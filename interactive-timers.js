/* ==========================================================================
   CoolClock — Interactive Visual Timers Engine (HTML5 Canvas + Physics)
   Modes: 'candle' | 'fuse' | 'hourglass' | 'cup' | 'plant'
   ========================================================================== */

class InteractiveTimersEngine {
  constructor(canvas, callbacks, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.callbacks = callbacks || {};

    this.width = 320;
    this.height = 265;
    this.displayWidth = options.displayWidth || 320;
    this.displayHeight = options.displayHeight || 265;
    this.responsive = Boolean(options.responsive);

    // Pointer & interaction state
    this.pointer = { x: 160, y: 130, vx: 0, vy: 0, inside: false, down: false };
    this.dragMode = null; // 'scrub' | null
    this.dragMoved = false;
    this.downPos = { x: 0, y: 0 };

    // Particle systems & physics states
    this.sparks = [];
    this.smoke = [];
    this.raindrops = [];
    this.sandGrains = [];
    this.steam = [];
    this.pollen = [];

    this.windTilt = 0;
    this.waveAmplitude = 1.5;
    this.hourglassAngle = 0;
    this.hourglassTargetAngle = 0;
    this.wasRunning = false;

    if (this.canvas) {
      this.setupCanvas();
      this.bindEvents();
      requestAnimationFrame((ts) => this.loop(ts));
    }
  }

  setupCanvas() {
    if (this.responsive) {
      this.refreshLayout();
      let resizeTimer = null;
      const schedule = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => this.refreshLayout(), 120);
      };
      window.addEventListener('resize', schedule);
      window.addEventListener('orientationchange', schedule);
      document.addEventListener('fullscreenchange', schedule);
      document.addEventListener('webkitfullscreenchange', schedule);
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scaleX = this.displayWidth / this.width;
    const scaleY = this.displayHeight / this.height;
    this.canvas.width = Math.round(this.displayWidth * dpr);
    this.canvas.height = Math.round(this.displayHeight * dpr);
    this.canvas.style.width = `${this.displayWidth}px`;
    this.canvas.style.height = `${this.displayHeight}px`;
    this.ctx.setTransform(dpr * scaleX, 0, 0, dpr * scaleY, 0, 0);
  }

  /** Exact 320:265 sizing in CSS px (no aspect-ratio reliance) + capped backing store for 4K ARM panels. */
  refreshLayout() {
    if (!this.canvas || !this.ctx || !this.responsive) return;
    const vw = window.innerWidth || document.documentElement.clientWidth || 1024;
    const vh = window.innerHeight || document.documentElement.clientHeight || 768;
    const availW = Math.max(240, vw * 0.92);
    const availH = Math.max(200, vh * 0.74);
    const scale = Math.min(availW / this.width, availH / this.height);
    const cssW = Math.round(this.width * scale);
    const cssH = Math.round(this.height * scale);
    this.canvas.style.setProperty('width', `${cssW}px`, 'important');
    this.canvas.style.setProperty('height', `${cssH}px`, 'important');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bufW = Math.min(1120, Math.round(cssW * dpr));
    const bufH = Math.round((bufW * this.height) / this.width);
    if (this.canvas.width !== bufW) this.canvas.width = bufW;
    if (this.canvas.height !== bufH) this.canvas.height = bufH;
    this.ctx.setTransform(bufW / this.width, 0, 0, bufH / this.height, 0, 0);
  }

  /** Cross-browser rounded rectangle path (ctx.roundRect requires Chromium 99+). */
  roundRectPath(ctx, x, y, w, h, radii) {
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, radii);
      return;
    }
    let r = Array.isArray(radii) ? radii : [radii];
    if (r.length === 1) r = [r[0], r[0], r[0], r[0]];
    else if (r.length === 2) r = [r[0], r[1], r[0], r[1]];
    else if (r.length === 3) r = [r[0], r[1], r[2], r[1]];
    const max = Math.min(w, h) / 2;
    const [tl, tr, br, bl] = r.map((v) => Math.max(0, Math.min(Number(v) || 0, max)));
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.arcTo(x + w, y, x + w, y + tr, tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
    ctx.lineTo(x + bl, y + h);
    ctx.arcTo(x, y + h, x, y + h - bl, bl);
    ctx.lineTo(x, y + tl);
    ctx.arcTo(x, y, x + tl, y, tl);
    ctx.closePath();
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const src = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    return {
      x: ((src.clientX - rect.left) / (rect.width || 1)) * this.width,
      y: ((src.clientY - rect.top) / (rect.height || 1)) * this.height,
    };
  }

  bindEvents() {
    const onMove = (e) => {
      const pos = this.getCanvasCoords(e);
      this.pointer.vx = pos.x - this.pointer.x;
      this.pointer.vy = pos.y - this.pointer.y;
      this.pointer.x = pos.x;
      this.pointer.y = pos.y;
      this.pointer.inside = true;

      // Wind reaction when moving cursor near flame/plant/liquid
      this.windTilt += this.pointer.vx * 0.045;
      this.windTilt = Math.max(-18, Math.min(18, this.windTilt));
      this.waveAmplitude = Math.min(8, this.waveAmplitude + Math.abs(this.pointer.vx) * 0.08);

      if (this.pointer.down) {
        const dist = Math.hypot(pos.x - this.downPos.x, pos.y - this.downPos.y);
        if (dist > 6) {
          this.dragMoved = true;
          this.handleScrub(pos);
          if (e.cancelable) e.preventDefault();
        }
      } else {
        this.updateCursorStyle(pos);
      }
    };

    const onDown = (e) => {
      const pos = this.getCanvasCoords(e);
      this.pointer.x = pos.x;
      this.pointer.y = pos.y;
      this.pointer.down = true;
      this.dragMoved = false;
      this.downPos = { x: pos.x, y: pos.y };
    };

    const onUp = () => {
      if (!this.pointer.down) return;
      this.pointer.down = false;

      if (!this.dragMoved) {
        this.handleClick(this.downPos);
      }
      this.dragMode = null;
    };

    // Pointer Events (SMART Boards / Android / pen / mouse) — one unified stream, no ghost clicks.
    if ('PointerEvent' in window) {
      this.activePointerId = null;
      this.canvas.style.touchAction = 'none';
      this.canvas.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button > 0) return;
        this.activePointerId = e.pointerId;
        try {
          this.canvas.setPointerCapture(e.pointerId);
        } catch (_) {
          /* noop */
        }
        onDown(e);
      });
      this.canvas.addEventListener('pointermove', (e) => {
        if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
        onMove(e);
      });
      const end = (e) => {
        if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
        this.activePointerId = null;
        onUp();
      };
      this.canvas.addEventListener('pointerup', end);
      this.canvas.addEventListener('pointercancel', (e) => {
        if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
        this.activePointerId = null;
        this.pointer.down = false;
        this.dragMode = null;
      });
      this.canvas.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'mouse') this.pointer.inside = false;
      });
      return;
    }

    // Legacy fallback: ignore synthetic mouse events emitted after a touch (prevents double toggle).
    this.lastTouchTime = 0;
    const isGhostMouse = () => Date.now() - this.lastTouchTime < 600;

    this.canvas.addEventListener('mousemove', (e) => {
      if (!isGhostMouse()) onMove(e);
    });
    this.canvas.addEventListener('mousedown', (e) => {
      if (!isGhostMouse()) onDown(e);
    });
    window.addEventListener('mouseup', () => {
      if (!isGhostMouse()) onUp();
    });

    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        this.lastTouchTime = Date.now();
        onDown(e);
      },
      { passive: true }
    );
    this.canvas.addEventListener(
      'touchmove',
      (e) => {
        this.lastTouchTime = Date.now();
        onMove(e);
      },
      { passive: false }
    );
    window.addEventListener('touchend', () => {
      this.lastTouchTime = Date.now();
      onUp();
    });
    window.addEventListener('touchcancel', () => {
      this.lastTouchTime = Date.now();
      this.pointer.down = false;
      this.dragMode = null;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.pointer.inside = false;
    });
  }

  updateCursorStyle(pos) {
    const st = this.callbacks.getState ? this.callbacks.getState() : null;
    if (!st || st.mode === 'ring') return;

    if (st.mode === 'candle') {
      const candleTopY = this.getCandleTopY(st.ratio);
      if (Math.hypot(pos.x - 160, pos.y - (candleTopY - 22)) < 28) {
        this.canvas.style.cursor = 'pointer';
      } else if (Math.abs(pos.x - 160) < 48 && pos.y > 55 && pos.y < 238) {
        this.canvas.style.cursor = 'ns-resize';
      } else {
        this.canvas.style.cursor = 'grab';
      }
    } else if (st.mode === 'fuse') {
      this.canvas.style.cursor = 'ew-resize';
    } else if (st.mode === 'hourglass') {
      this.canvas.style.cursor = 'pointer';
    } else {
      this.canvas.style.cursor = 'ns-resize';
    }
  }

  handleScrub(pos) {
    const st = this.callbacks.getState ? this.callbacks.getState() : null;
    if (!st || !this.callbacks.onScrubRatio) return;

    let newRatio = st.ratio;

    if (st.mode === 'candle') {
      // Candle top goes from y=76 (ratio=1) to y=206 (ratio=0)
      newRatio = (206 - pos.y) / (206 - 76);
    } else if (st.mode === 'fuse') {
      // Project onto fuse path
      const pathPts = this.getFusePathPoints();
      let bestIdx = 0;
      let bestDist = Infinity;
      pathPts.forEach((pt, i) => {
        const d = Math.hypot(pt.x - pos.x, pt.y - pos.y);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      });
      const progress = bestIdx / (pathPts.length - 1); // 0 = start (full), 1 = end (empty)
      newRatio = 1 - progress;
    } else if (st.mode === 'hourglass') {
      newRatio = (210 - pos.y) / (210 - 55);
    } else if (st.mode === 'cup') {
      newRatio = (205 - pos.y) / (205 - 82);
      this.waveAmplitude = 7;
    } else if (st.mode === 'plant') {
      // Higher plant = closer to completion (ratio -> 0), dragging up grows plant
      const growth = (210 - pos.y) / (210 - 55);
      newRatio = 1 - growth;
    }

    newRatio = Math.max(0.01, Math.min(1, newRatio));
    this.callbacks.onScrubRatio(newRatio);
  }

  handleClick(pos) {
    const st = this.callbacks.getState ? this.callbacks.getState() : null;
    if (!st) return;

    if (st.mode === 'candle') {
      if (st.running) {
        // Puff of smoke when blowing out candle
        const topY = this.getCandleTopY(st.ratio);
        for (let i = 0; i < 12; i++) {
          this.smoke.push({
            x: 160 + (Math.random() - 0.5) * 6,
            y: topY - 16,
            vx: (Math.random() - 0.5) * 0.9,
            vy: -0.9 - Math.random() * 1.1,
            r: 3 + Math.random() * 4,
            alpha: 0.65,
          });
        }
        if (window.coolAudio) window.coolAudio.playBlowOut();
      } else {
        if (window.coolAudio) window.coolAudio.playSparkIgnite();
      }
      if (this.callbacks.onTogglePlay) this.callbacks.onTogglePlay();
    } else if (st.mode === 'fuse') {
      if (!st.running && window.coolAudio) window.coolAudio.playSparkIgnite();
      if (this.callbacks.onTogglePlay) this.callbacks.onTogglePlay();
    } else if (st.mode === 'hourglass') {
      this.hourglassTargetAngle += Math.PI;
      if (window.coolAudio) window.coolAudio.playSandFlip();
      if (this.callbacks.onFlipHourglass) this.callbacks.onFlipHourglass();
    } else if (st.mode === 'cup') {
      this.waveAmplitude = 9;
      if (window.coolAudio) window.coolAudio.playWaterDrop();
      if (this.callbacks.onTogglePlay) this.callbacks.onTogglePlay();
    } else if (st.mode === 'plant') {
      // Spawn raindrops where clicked
      for (let i = 0; i < 10; i++) {
        this.raindrops.push({
          x: pos.x + (Math.random() - 0.5) * 70,
          y: Math.min(pos.y, 70) + Math.random() * 20,
          vy: 3 + Math.random() * 2.5,
        });
      }
      if (window.coolAudio) window.coolAudio.playWaterDrop();
      if (this.callbacks.onTogglePlay) this.callbacks.onTogglePlay();
    }
  }

  /* -------------------- Geometry Helpers -------------------- */
  getCandleTopY(ratio) {
    const clamped = Math.max(0, Math.min(1, ratio));
    // Base sits at y=224; max height = 148 (top=76), min height = 18 (top=206)
    return 206 - clamped * 130;
  }

  getFusePathPoints() {
    if (this._fusePts) return this._fusePts;
    const pts = [];
    const steps = 140;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // S-curve from left (36, 195) winding to right bell at (268, 92)
      const x = 36 + t * 232;
      const y = 148 + Math.sin(t * Math.PI * 2.3 + 0.5) * 48 - t * 32;
      pts.push({ x, y });
    }
    this._fusePts = pts;
    return pts;
  }

  /* -------------------- Master Render Loop -------------------- */
  loop(ts) {
    const st = this.callbacks.getState ? this.callbacks.getState() : null;
    if (st && st.mode !== 'ring' && this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height);

      // Decay wind & waves smoothly
      this.windTilt *= 0.92;
      this.waveAmplitude = Math.max(1.2, this.waveAmplitude * 0.96);
      this.hourglassAngle += (this.hourglassTargetAngle - this.hourglassAngle) * 0.14;

      const t = ts * 0.001;

      if (st.mode === 'candle') this.drawCandle(st, t);
      else if (st.mode === 'fuse') this.drawFuse(st, t);
      else if (st.mode === 'hourglass') this.drawHourglass(st, t);
      else if (st.mode === 'cup') this.drawCup(st, t);
      else if (st.mode === 'plant') this.drawPlant(st, t);
    }
    requestAnimationFrame((nextTs) => this.loop(nextTs));
  }

  /* ==================== 1. CANDLE & WICK ==================== */
  drawCandle(st, t) {
    const ctx = this.ctx;
    const ratio = Math.max(0, Math.min(1, st.ratio));
    const baseY = 226;
    const topY = this.getCandleTopY(ratio);
    const candleH = Math.max(14, baseY - topY);
    const cx = 160;
    const w = 68;

    // 1. Warm ambient glow behind flame when lit
    if (st.running && ratio > 0) {
      const pulse = 1 + Math.sin(t * 7.5) * 0.05;
      const glow = ctx.createRadialGradient(cx, topY - 26, 4, cx, topY - 22, 110 * pulse);
      glow.addColorStop(0, 'rgba(255, 190, 75, 0.42)');
      glow.addColorStop(0.45, 'rgba(251, 113, 36, 0.14)');
      glow.addColorStop(1, 'rgba(251, 113, 36, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, topY - 22, 115, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Brass candle holder dish
    const holderGrad = ctx.createLinearGradient(cx - 62, baseY, cx + 62, baseY + 18);
    holderGrad.addColorStop(0, '#92400e');
    holderGrad.addColorStop(0.5, '#fbbf24');
    holderGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = holderGrad;
    ctx.beginPath();
    ctx.ellipse(cx, baseY + 6, 58, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Holder handle ring on right
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx + 58, baseY + 2, 10, -Math.PI * 0.6, Math.PI * 0.7);
    ctx.stroke();

    // 3. Candle Wax Body (3D cylindrical shading)
    const waxGrad = ctx.createLinearGradient(cx - w / 2, topY, cx + w / 2, topY);
    waxGrad.addColorStop(0, '#e7dcc8');
    waxGrad.addColorStop(0.32, '#fffdf7');
    waxGrad.addColorStop(0.75, '#f3ead8');
    waxGrad.addColorStop(1, '#cbbba0');

    ctx.fillStyle = waxGrad;
    ctx.beginPath();
    this.roundRectPath(ctx, cx - w / 2, topY, w, candleH, [8, 8, 6, 6]);
    ctx.fill();

    // Top melted wax pool ellipse
    ctx.fillStyle = st.running ? '#fef3c7' : '#f5ebd6';
    ctx.beginPath();
    ctx.ellipse(cx, topY + 2, w / 2 - 1, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wax drips along the side as it melts
    const dripProgress = 1 - ratio;
    const drips = [
      { dx: -22, len: Math.min(candleH - 6, 14 + dripProgress * 38) },
      { dx: 18, len: Math.min(candleH - 6, 9 + dripProgress * 52) },
      { dx: -4, len: Math.min(candleH - 6, 6 + dripProgress * 26) },
    ];
    ctx.fillStyle = '#fffbeb';
    drips.forEach((d) => {
      if (d.len > 6) {
        ctx.beginPath();
        this.roundRectPath(ctx, cx + d.dx - 3, topY + 3, 6, d.len, 3);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + d.dx, topY + 3 + d.len, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 4. Braided Wick ("Mèche de bougie")
    const wickTipX = cx + this.windTilt * 0.15;
    const wickTipY = topY - 15;
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, topY + 2);
    ctx.quadraticCurveTo(cx + 2, topY - 8, wickTipX, wickTipY);
    ctx.stroke();

    // Glowing ember tip on the wick
    ctx.fillStyle = st.running ? '#fb923c' : '#ef4444';
    ctx.beginPath();
    ctx.arc(wickTipX, wickTipY, 2.3, 0, Math.PI * 2);
    ctx.fill();

    // 5. Living Flame (when running) OR Rising Smoke (when paused/stopped)
    if (st.running && ratio > 0) {
      const flickerX = Math.sin(t * 13) * 2.2 + Math.cos(t * 7.3) * 1.5 + this.windTilt;
      const stretchY = Math.sin(t * 16) * 2.5;
      const fx = wickTipX + flickerX * 0.65;
      const fy = wickTipY - 26 + stretchY;

      // Outer orange flame
      const outerGrad = ctx.createLinearGradient(wickTipX, wickTipY + 2, fx, fy - 14);
      outerGrad.addColorStop(0, 'rgba(59, 130, 246, 0.75)');
      outerGrad.addColorStop(0.25, '#f97316');
      outerGrad.addColorStop(0.75, '#facc15');
      outerGrad.addColorStop(1, 'rgba(254, 240, 138, 0.1)');

      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.moveTo(wickTipX, wickTipY + 2);
      ctx.bezierCurveTo(wickTipX - 16, wickTipY - 8, fx - 12, fy, fx, fy - 12);
      ctx.bezierCurveTo(fx + 12, fy, wickTipX + 16, wickTipY - 8, wickTipX, wickTipY + 2);
      ctx.fill();

      // Inner bright core
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.moveTo(wickTipX, wickTipY);
      ctx.quadraticCurveTo(wickTipX - 6, wickTipY - 10, fx * 0.6 + wickTipX * 0.4, wickTipY - 22);
      ctx.quadraticCurveTo(wickTipX + 6, wickTipY - 10, wickTipX, wickTipY);
      ctx.fill();
    } else {
      // Gentle smoke trail when paused
      if (Math.random() < 0.18) {
        this.smoke.push({
          x: wickTipX,
          y: wickTipY - 2,
          vx: (Math.random() - 0.5) * 0.35 + this.windTilt * 0.03,
          vy: -0.65 - Math.random() * 0.4,
          r: 2.2,
          alpha: 0.38,
        });
      }
    }

    // Update & render smoke particles
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const p = this.smoke[i];
      p.x += p.vx + Math.sin(t * 3 + p.y * 0.06) * 0.25;
      p.y += p.vy;
      p.r += 0.09;
      p.alpha -= 0.008;
      if (p.alpha <= 0) {
        this.smoke.splice(i, 1);
        continue;
      }
      ctx.fillStyle = `rgba(180, 190, 205, ${p.alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ==================== 2. SPARKLING FUSE CORD ==================== */
  drawFuse(st, t) {
    const ctx = this.ctx;
    const pts = this.getFusePathPoints();
    const ratio = Math.max(0, Math.min(1, st.ratio));
    const burnIdx = Math.min(pts.length - 1, Math.floor((1 - ratio) * (pts.length - 1)));
    const endPt = pts[pts.length - 1];

    // 1. Draw target brass bell / chime at the end of the fuse
    ctx.save();
    ctx.translate(endPt.x + 12, endPt.y);
    const bellShake = ratio <= 0.02 ? Math.sin(t * 40) * 0.2 : 0;
    ctx.rotate(bellShake);
    const bellGrad = ctx.createLinearGradient(-16, -20, 16, 20);
    bellGrad.addColorStop(0, '#fde047');
    bellGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = bellGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 18, Math.PI, 0);
    ctx.lineTo(22, 16);
    ctx.lineTo(-22, 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(0, 18, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Charred ash trail (burned portion)
    if (burnIdx > 0) {
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.32)';
      ctx.lineWidth = 4;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      for (let i = 0; i <= burnIdx; i++) {
        if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
        else ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Unburned braided rope portion
    if (burnIdx < pts.length - 1) {
      ctx.strokeStyle = '#d6b88a';
      ctx.lineWidth = 8.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = burnIdx; i < pts.length; i++) {
        if (i === burnIdx) ctx.moveTo(pts[i].x, pts[i].y);
        else ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      // Rope twist texture overlay
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Burning spark head
    const head = pts[burnIdx];
    const emberGlow = ctx.createRadialGradient(head.x, head.y, 2, head.x, head.y, st.running ? 36 : 16);
    emberGlow.addColorStop(0, '#ffffff');
    emberGlow.addColorStop(0.25, '#facc15');
    emberGlow.addColorStop(0.6, 'rgba(249, 115, 22, 0.45)');
    emberGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = emberGlow;
    ctx.beginPath();
    ctx.arc(head.x, head.y, st.running ? 36 : 16, 0, Math.PI * 2);
    ctx.fill();

    // Emit flying sparks when running
    if (st.running && ratio > 0) {
      for (let i = 0; i < 3; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 1.2 + Math.random() * 3.6;
        this.sparks.push({
          x: head.x,
          y: head.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 1.2,
          life: 1,
          color: Math.random() > 0.4 ? '#fef08a' : '#fb923c',
        });
      }
    }

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.14; // gravity
      s.life -= 0.045;
      if (s.y > 245) {
        s.y = 245;
        s.vy *= -0.45;
      }
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = s.life;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 1.4, s.y - s.vy * 1.4);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  /* ==================== 3. FLIPPABLE HOURGLASS ==================== */
  drawHourglass(st) {
    const ctx = this.ctx;
    const ratio = Math.max(0, Math.min(1, st.ratio));
    const cx = 160;
    const cy = 132;

    ctx.save();
    ctx.translate(cx, cy);
    // Keep visual upright sand logic while animating 180° flip smoothly
    const visualRot = this.hourglassAngle % (Math.PI * 2);
    const animOffset = this.hourglassTargetAngle - this.hourglassAngle;
    ctx.rotate(animOffset);

    // Top & bottom wooden caps
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    this.roundRectPath(ctx, -58, -98, 116, 12, 6);
    this.roundRectPath(ctx, -58, 86, 116, 12, 6);
    ctx.fill();

    // Side brass pillars
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-48, -86);
    ctx.lineTo(-48, 86);
    ctx.moveTo(48, -86);
    ctx.lineTo(48, 86);
    ctx.stroke();

    // Top Sand Bulb Clip
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-40, -84);
    ctx.bezierCurveTo(-40, -28, -5, -12, -3, 0);
    ctx.lineTo(3, 0);
    ctx.bezierCurveTo(5, -12, 40, -28, 40, -84);
    ctx.closePath();
    ctx.clip();

    const topSandHeight = ratio * 78;
    const sandGrad = ctx.createLinearGradient(-35, -80, 35, 80);
    sandGrad.addColorStop(0, '#fcd34d');
    sandGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = sandGrad;
    ctx.fillRect(-45, -topSandHeight, 90, topSandHeight + 2);
    ctx.restore();

    // Bottom Sand Bulb Clip
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.bezierCurveTo(-5, 12, -40, 28, -40, 84);
    ctx.lineTo(40, 84);
    ctx.bezierCurveTo(40, 28, 5, 12, 3, 0);
    ctx.closePath();
    ctx.clip();

    const botRatio = 1 - ratio;
    const botH = botRatio * 78;
    ctx.fillStyle = sandGrad;
    ctx.beginPath();
    ctx.moveTo(-45, 86);
    ctx.lineTo(-45, 86 - botH * 0.75);
    ctx.quadraticCurveTo(0, 86 - botH * 1.18, 45, 86 - botH * 0.75);
    ctx.lineTo(45, 86);
    ctx.closePath();
    ctx.fill();

    // Falling sand stream
    if (st.running && ratio > 0 && Math.abs(animOffset) < 0.25) {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([4, 3]);
      ctx.lineDashOffset = -(performance.now() * 0.08);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 86 - botH * 0.9);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // Glass Bulb Outline & Shine
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-40, -84);
    ctx.bezierCurveTo(-40, -28, -5, -12, -3, 0);
    ctx.bezierCurveTo(-5, 12, -40, 28, -40, 84);
    ctx.lineTo(40, 84);
    ctx.bezierCurveTo(40, 28, 5, 12, 3, 0);
    ctx.bezierCurveTo(5, -12, 40, -28, 40, -84);
    ctx.closePath();
    ctx.stroke();

    void visualRot;
    ctx.restore();
  }

  /* ==================== 4. STEAMING CUP ==================== */
  drawCup(st, t) {
    const ctx = this.ctx;
    const ratio = Math.max(0, Math.min(1, st.ratio));
    const cx = 152;

    // Cup handle
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.75)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx + 58, 145, 24, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    // Saucer
    ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, 216, 76, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cup Interior Clip for Liquid
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - 56, 82);
    ctx.lineTo(cx - 44, 202);
    ctx.quadraticCurveTo(cx, 214, cx + 44, 202);
    ctx.lineTo(cx + 56, 82);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.fill();
    ctx.clip();

    if (ratio > 0.005) {
      const liqY = 204 - ratio * 116;
      const liqGrad = ctx.createLinearGradient(cx, liqY, cx, 210);
      liqGrad.addColorStop(0, '#d97706');
      liqGrad.addColorStop(0.35, '#92400e');
      liqGrad.addColorStop(1, '#451a03');
      ctx.fillStyle = liqGrad;

      ctx.beginPath();
      ctx.moveTo(cx - 65, 215);
      for (let x = cx - 62; x <= cx + 62; x += 6) {
        const wy =
          liqY +
          Math.sin(x * 0.07 + t * 4.2) * this.waveAmplitude +
          Math.cos(x * 0.11 - t * 2.8) * (this.waveAmplitude * 0.5);
        ctx.lineTo(x, wy);
      }
      ctx.lineTo(cx + 65, 215);
      ctx.closePath();
      ctx.fill();

      // Crema / foam highlight line
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();

    // Glass/Ceramic Cup Outline
    ctx.strokeStyle = 'rgba(241, 245, 249, 0.8)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx - 56, 82);
    ctx.lineTo(cx - 44, 202);
    ctx.quadraticCurveTo(cx, 214, cx + 44, 202);
    ctx.lineTo(cx + 56, 82);
    ctx.closePath();
    ctx.stroke();

    // Rising Steam wisps when running
    if (st.running && ratio > 0.05 && Math.random() < 0.16) {
      this.steam.push({
        x: cx + (Math.random() - 0.5) * 52,
        y: 74,
        r: 5 + Math.random() * 6,
        alpha: 0.42,
      });
    }
    for (let i = this.steam.length - 1; i >= 0; i--) {
      const s = this.steam[i];
      s.y -= 0.75;
      s.x += Math.sin(t * 2.5 + s.y * 0.05) * 0.45 + this.windTilt * 0.03;
      s.r += 0.12;
      s.alpha -= 0.006;
      if (s.alpha <= 0) {
        this.steam.splice(i, 1);
        continue;
      }
      ctx.fillStyle = `rgba(241, 245, 249, ${s.alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ==================== 5. ZEN BLOOMING PLANT ==================== */
  drawPlant(st, t) {
    const ctx = this.ctx;
    const growth = Math.max(0.03, Math.min(1, 1 - st.ratio)); // 0 -> seed, 1 -> full bloom!
    const cx = 160;
    const soilY = 196;

    // Raindrops animation
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    for (let i = this.raindrops.length - 1; i >= 0; i--) {
      const d = this.raindrops[i];
      d.y += d.vy;
      if (d.y > soilY) {
        this.raindrops.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x, d.y + 7);
      ctx.stroke();
    }

    // Swaying Stem
    const stemH = 18 + growth * 118;
    const sway = Math.sin(t * 2.1) * (4 + growth * 5) + this.windTilt * 0.5;
    const tipX = cx + sway;
    const tipY = soilY - stemH;

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, soilY);
    ctx.quadraticCurveTo(cx + sway * 0.35, soilY - stemH * 0.5, tipX, tipY);
    ctx.stroke();

    // Leaves appearing progressively
    const leafPairs = [
      { threshold: 0.2, frac: 0.35, dir: -1, size: 18 },
      { threshold: 0.35, frac: 0.5, dir: 1, size: 20 },
      { threshold: 0.55, frac: 0.7, dir: -1, size: 22 },
      { threshold: 0.7, frac: 0.82, dir: 1, size: 19 },
    ];
    leafPairs.forEach((lf) => {
      if (growth > lf.threshold) {
        const scale = Math.min(1, (growth - lf.threshold) / 0.2);
        const lx = cx + sway * lf.frac * 0.8;
        const ly = soilY - stemH * lf.frac;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(lf.dir * (0.55 + Math.sin(t * 2 + lf.frac) * 0.08));
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.ellipse((lf.dir * lf.size * scale) / 2, 0, lf.size * scale * 0.65, 7 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // Flower Bud & Petals (blooms strongly above 65% elapsed)
    if (growth > 0.6) {
      const bloom = Math.min(1, (growth - 0.6) / 0.38);
      const petals = 8;
      ctx.save();
      ctx.translate(tipX, tipY);
      ctx.rotate(t * 0.25);
      for (let i = 0; i < petals; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / petals);
        ctx.fillStyle = i % 2 === 0 ? '#f472b6' : '#fb7185';
        ctx.beginPath();
        ctx.ellipse(0, -11 * bloom, 6 * bloom, 12 * bloom, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 5 + 4 * bloom, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Small green sprout tip
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Terracotta Pot & Soil
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(cx, soilY, 40, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const potGrad = ctx.createLinearGradient(cx - 44, soilY, cx + 44, 240);
    potGrad.addColorStop(0, '#ea580c');
    potGrad.addColorStop(1, '#9a3412');
    ctx.fillStyle = potGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 42, soilY + 2);
    ctx.lineTo(cx - 32, 240);
    ctx.quadraticCurveTo(cx, 246, cx + 32, 240);
    ctx.lineTo(cx + 42, soilY + 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    this.roundRectPath(ctx, cx - 46, soilY - 4, 92, 10, 4);
    ctx.fill();
  }
}

window.InteractiveTimersEngine = InteractiveTimersEngine;
