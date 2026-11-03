/* ==========================================================================
   CoolClock — High-Fidelity Stereo Web Audio Engine & Multi-Channel Mixer
   Features:
   - True 10s crossfaded stereo Pink, Brown & White noise buffers (zero seam)
   - Procedural Stereo Convolution Reverb + Master Soft Limiter
   - 12 Multi-layer organic soundscapes (combinable simultaneously!)
   - Interactive physical timer FX & polyphonic alarm chimes
   ========================================================================== */

class CoolClockAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.reverbNode = null;
    this.reverbSend = null;
    this.buffers = {};

    // Multi-channel mixer: { [soundId]: { gainNode, baseVol, nodes: [], timers: [] } }
    this.channels = {};
    this.volume = 0.5;
    this.alarmInterval = null;
    this.onChange = null; // optional UI sync callback
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.setupMasterBus();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setupMasterBus() {
    const ctx = this.ctx;
    if (!ctx || this.masterGain) return;

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -14;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.015;
    this.compressor.release.value = 0.25;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.volume * 0.85;

    // Lush 2.3s stereo acoustic impulse response for natural spatial depth
    this.reverbNode = ctx.createConvolver();
    this.reverbNode.buffer = this.createStereoReverbImpulse(ctx, 2.3, 2.8);

    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.28;

    this.reverbSend.connect(this.reverbNode);
    this.reverbNode.connect(this.masterGain);

    this.masterGain.connect(this.compressor);
    this.compressor.connect(ctx.destination);
  }

  createStereoReverbImpulse(ctx, durationSec = 2.2, decay = 2.6) {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * durationSec);
    const impulse = ctx.createBuffer(2, length, rate);

    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const env = Math.pow(1 - t, decay);
        const white = Math.random() * 2 - 1;
        // Progressive high-frequency air absorption damping
        const damp = 0.25 + (1 - t) * 0.45;
        lp = lp + damp * (white - lp);
        data[i] = lp * env * 0.55;
      }
    }
    return impulse;
  }

  /* -------------------- Seamless 10s Stereo Noise Buffers -------------------- */
  getStereoNoiseBuffer(ctx, mode = 'pink') {
    if (this.buffers[mode]) return this.buffers[mode];

    const duration = 10;
    const rate = ctx.sampleRate;
    const totalSamples = rate * duration;
    const fadeSamples = Math.floor(rate * 0.4); // seamless crossfade tail
    const buffer = ctx.createBuffer(2, totalSamples, rate);

    for (let ch = 0; ch < 2; ch++) {
      const raw = new Float32Array(totalSamples + fadeSamples);

      if (mode === 'brown') {
        let lastOut = 0;
        for (let i = 0; i < raw.length; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.018 * white) / 1.018;
          raw[i] = lastOut * 3.2;
        }
      } else if (mode === 'pink') {
        // Paul Kellet's refined pink noise filter
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < raw.length; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.105;
          b6 = white * 0.115926;
        }
      } else {
        for (let i = 0; i < raw.length; i++) {
          raw[i] = (Math.random() * 2 - 1) * 0.35;
        }
      }

      // Equal-power loop seam crossfade
      const out = buffer.getChannelData(ch);
      for (let i = 0; i < totalSamples; i++) {
        if (i < fadeSamples) {
          const p = i / fadeSamples;
          const gIn = Math.sin(p * Math.PI * 0.5);
          const gOut = Math.cos(p * Math.PI * 0.5);
          out[i] = raw[i] * gIn + raw[totalSamples + i] * gOut;
        } else {
          out[i] = raw[i];
        }
      }
    }

    this.buffers[mode] = buffer;
    return buffer;
  }

  createLoopingSource(ctx, mode = 'pink', playbackRate = 1.0) {
    const src = ctx.createBufferSource();
    src.buffer = this.getStereoNoiseBuffer(ctx, mode);
    src.loop = true;
    src.playbackRate.value = playbackRate;
    // Random start offset so layered sounds never phase-align
    const offset = Math.random() * 8.5;
    src.start(0, offset);
    return src;
  }

  createPanner(ctx, pan = 0) {
    if (typeof ctx.createStereoPanner === 'function') {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      return p;
    }
    const g = ctx.createGain();
    return g;
  }

  /* -------------------- Interactive Timer Micro-FX -------------------- */
  playSparkIgnite() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const len = Math.floor(ctx.sampleRate * 0.22);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.pow(1 - i / len, 1.8);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1900, now);
    filter.frequency.exponentialRampToValueAtTime(680, now + 0.2);
    filter.Q.value = 1.3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }

  playBlowOut() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const len = Math.floor(ctx.sampleRate * 0.34);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.sin((i / len) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(640, now);
    filter.frequency.linearRampToValueAtTime(210, now + 0.34);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }

  playSandFlip() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const len = Math.floor(ctx.sampleRate * 0.28);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.sin((i / len) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.6;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, now);
    filter.Q.value = 1.6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }

  playWaterDrop() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.09);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    if (this.reverbSend) gain.connect(this.reverbSend);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  /* -------------------- Alarm Chimes -------------------- */
  playChimeOnce(type = 'crystal') {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'crystal') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.13);

        gain.gain.setValueAtTime(0.001, now + i * 0.13);
        gain.gain.exponentialRampToValueAtTime(0.22, now + i * 0.13 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.13 + 1.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        if (this.reverbSend) gain.connect(this.reverbSend);
        osc.start(now + i * 0.13);
        osc.stop(now + i * 0.13 + 1.35);
      });
    } else if (type === 'zen') {
      // Authentic inharmonic singing bowl partials
      const base = 220;
      const ratios = [1, 2.71, 4.95, 7.42];
      ratios.forEach((r, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(base * r, now);

        const peak = 0.22 / (idx * 1.3 + 1);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(peak, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        if (this.reverbSend) gain.connect(this.reverbSend);
        osc.start(now);
        osc.stop(now + 3.45);
      });
    } else {
      [0, 0.16, 0.32].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now + offset);

        gain.gain.setValueAtTime(0.08, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.11);
      });
    }
  }

  startAlarmLoop(type = 'crystal') {
    this.stopAlarmLoop();
    this.playChimeOnce(type);
    this.alarmInterval = setInterval(() => {
      this.playChimeOnce(type);
    }, 3200);
  }

  stopAlarmLoop() {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }

  /* ==========================================================================
     MULTI-CHANNEL HIGH-FIDELITY SOUNDSCAPE MIXER
     ========================================================================== */
  setVolume(val0to1) {
    this.volume = Math.max(0, Math.min(1, val0to1));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.85, this.ctx.currentTime, 0.1);
    }
    this.notifyChange();
  }

  getActiveChannels() {
    return Object.keys(this.channels);
  }

  getActiveChannelMap() {
    const out = {};
    Object.keys(this.channels).forEach((id) => {
      out[id] = this.channels[id].baseVol;
    });
    return out;
  }

  hasActiveChannels() {
    return Object.keys(this.channels).length > 0;
  }

  isChannelActive(id) {
    return Boolean(this.channels[id]);
  }

  getChannelVolume(id) {
    return this.channels[id] ? this.channels[id].baseVol : 0.65;
  }

  notifyChange() {
    if (typeof this.onChange === 'function') {
      this.onChange(this.getActiveChannels(), this.volume);
    }
  }

  stopChannel(id) {
    const ch = this.channels[id];
    if (!ch) return;
    delete this.channels[id];

    ch.timers.forEach((tid) => clearInterval(tid));
    if (this.ctx && ch.gainNode) {
      const now = this.ctx.currentTime;
      try {
        ch.gainNode.gain.cancelScheduledValues(now);
        ch.gainNode.gain.setValueAtTime(Math.max(0.0001, ch.gainNode.gain.value), now);
        ch.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      } catch (_) {}
      setTimeout(() => {
        ch.nodes.forEach((n) => {
          try {
            if (n.stop) n.stop();
            if (n.disconnect) n.disconnect();
          } catch (_) {}
        });
      }, 360);
    }
    this.notifyChange();
  }

  stopAmbient() {
    Object.keys(this.channels).forEach((id) => this.stopChannel(id));
    this.notifyChange();
  }

  stopAllChannels() {
    this.stopAmbient();
  }

  setChannelVolume(id, vol0to1) {
    const clamped = Math.max(0.02, Math.min(1, vol0to1));
    if (!this.channels[id]) {
      this.startChannel(id, clamped);
      return;
    }
    this.channels[id].baseVol = clamped;
    if (this.ctx && this.channels[id].gainNode) {
      this.channels[id].gainNode.gain.setTargetAtTime(clamped * 0.65, this.ctx.currentTime, 0.08);
    }
    this.notifyChange();
  }

  toggleChannel(id, defaultVol = 0.68) {
    if (!id || id === 'none') {
      this.stopAmbient();
      return false;
    }
    if (this.channels[id]) {
      this.stopChannel(id);
      return false;
    }
    this.startChannel(id, defaultVol);
    return true;
  }

  applyMixPreset(presetMap) {
    // Stop channels not in preset, start/adjust channels in preset
    Object.keys(this.channels).forEach((id) => {
      if (!(id in presetMap)) this.stopChannel(id);
    });
    Object.entries(presetMap).forEach(([id, vol]) => {
      if (this.channels[id]) {
        this.setChannelVolume(id, vol);
      } else {
        this.startChannel(id, vol);
      }
    });
    this.notifyChange();
  }

  // Legacy single-select helper (still supported if needed)
  playAmbient(kind) {
    if (!kind || kind === 'none') {
      this.stopAmbient();
      return;
    }
    this.toggleChannel(kind, 0.7);
  }

  /* -------------------- Acoustic Sound Synthesis Builders -------------------- */
  startChannel(kind, baseVol = 0.68) {
    if (this.channels[kind]) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const chGain = ctx.createGain();
    chGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    chGain.gain.linearRampToValueAtTime(baseVol * 0.65, ctx.currentTime + 0.55);
    chGain.connect(this.masterGain);

    const ch = {
      gainNode: chGain,
      baseVol,
      nodes: [chGain],
      timers: [],
    };
    this.channels[kind] = ch;

    const sendReverb = (node, amount = 0.25) => {
      const g = ctx.createGain();
      g.gain.value = amount;
      node.connect(g);
      g.connect(this.reverbSend);
      ch.nodes.push(g);
    };

    // 1. RAIN ON WINDOW (Multi-band stereo rain + glass droplets)
    if (kind === 'rain') {
      const bodySrc = this.createLoopingSource(ctx, 'pink', 1.0);
      const bodyFilter = ctx.createBiquadFilter();
      bodyFilter.type = 'bandpass';
      bodyFilter.frequency.value = 880;
      bodyFilter.Q.value = 0.55;

      // Subtle wind swell on rain density
      const gustLfo = ctx.createOscillator();
      gustLfo.frequency.value = 0.07;
      const gustDepth = ctx.createGain();
      gustDepth.gain.value = 180;
      gustLfo.connect(gustDepth);
      gustDepth.connect(bodyFilter.frequency);
      gustLfo.start();

      const bodyGain = ctx.createGain();
      bodyGain.gain.value = 0.75;
      bodySrc.connect(bodyFilter);
      bodyFilter.connect(bodyGain);
      bodyGain.connect(chGain);

      // Warm roof patter layer
      const roofSrc = this.createLoopingSource(ctx, 'brown', 1.05);
      const roofFilter = ctx.createBiquadFilter();
      roofFilter.type = 'bandpass';
      roofFilter.frequency.value = 340;
      roofFilter.Q.value = 0.7;
      const roofGain = ctx.createGain();
      roofGain.gain.value = 0.42;
      roofSrc.connect(roofFilter);
      roofFilter.connect(roofGain);
      roofGain.connect(chGain);

      ch.nodes.push(bodySrc, bodyFilter, gustLfo, gustDepth, bodyGain, roofSrc, roofFilter, roofGain);

      // Stochastic stereo raindrops on glass pane
      const dropTimer = setInterval(() => {
        if (!this.channels.rain || !this.ctx) return;
        if (Math.random() > 0.65) return;
        this.spawnNoiseTransient(ctx, chGain, {
          dur: 0.014,
          freq: 1500 + Math.random() * 2400,
          q: 4.5,
          amp: 0.04 + Math.random() * 0.06,
          pan: Math.random() * 1.6 - 0.8,
          reverb: 0.35,
        });
      }, 95);
      ch.timers.push(dropTimer);
    }

    // 2. DISTANT THUNDERSTORM (Soft night rain + rolling stereo sub-bass thunder)
    else if (kind === 'thunder') {
      const rainSrc = this.createLoopingSource(ctx, 'pink', 0.94);
      const rainLp = ctx.createBiquadFilter();
      rainLp.type = 'lowpass';
      rainLp.frequency.value = 920;
      const rainG = ctx.createGain();
      rainG.gain.value = 0.42;
      rainSrc.connect(rainLp);
      rainLp.connect(rainG);
      rainG.connect(chGain);
      ch.nodes.push(rainSrc, rainLp, rainG);

      const triggerThunderRoll = () => {
        if (!this.channels.thunder || !this.ctx) return;
        const now = ctx.currentTime;
        const dur = 4.2 + Math.random() * 2.5;
        const src = ctx.createBufferSource();
        src.buffer = this.getStereoNoiseBuffer(ctx, 'brown');
        src.loop = true;

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(250 + Math.random() * 90, now);
        lp.frequency.exponentialRampToValueAtTime(52, now + dur);
        lp.Q.value = 1.4;

        const pan = this.createPanner(ctx, Math.random() * 1.2 - 0.6);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.001, now);
        env.gain.linearRampToValueAtTime(0.85, now + 0.18);
        env.gain.setValueAtTime(0.55, now + 0.55);
        env.gain.linearRampToValueAtTime(0.75, now + 1.1); // secondary rumble swell
        env.gain.exponentialRampToValueAtTime(0.0008, now + dur);

        src.connect(lp);
        lp.connect(pan);
        pan.connect(env);
        env.connect(chGain);
        if (this.reverbSend) env.connect(this.reverbSend);

        src.start(now, Math.random() * 5);
        src.stop(now + dur + 0.1);
      };

      // Initial gentle distant rumble after 1.2s, then organic intervals
      setTimeout(triggerThunderRoll, 1200);
      const thunderTimer = setInterval(() => {
        if (Math.random() < 0.45) triggerThunderRoll();
      }, 5200);
      ch.timers.push(thunderTimer);
    }

    // 3. COZY FIREPLACE (Warm chimney draft + realistic wood cavity snaps & embers)
    else if (kind === 'fire') {
      const hearthSrc = this.createLoopingSource(ctx, 'brown', 0.95);
      const hearthLp = ctx.createBiquadFilter();
      hearthLp.type = 'lowpass';
      hearthLp.frequency.value = 185;

      const draftLfo = ctx.createOscillator();
      draftLfo.frequency.value = 0.16;
      const draftDepth = ctx.createGain();
      draftDepth.gain.value = 0.16;

      const hearthGain = ctx.createGain();
      hearthGain.gain.value = 0.62;
      draftLfo.connect(draftDepth);
      draftDepth.connect(hearthGain.gain);
      draftLfo.start();

      hearthSrc.connect(hearthLp);
      hearthLp.connect(hearthGain);
      hearthGain.connect(chGain);

      // Gentle flame air hiss
      const hissSrc = this.createLoopingSource(ctx, 'pink', 1.0);
      const hissBp = ctx.createBiquadFilter();
      hissBp.type = 'bandpass';
      hissBp.frequency.value = 1050;
      hissBp.Q.value = 0.6;
      const hissGain = ctx.createGain();
      hissGain.gain.value = 0.11;
      hissSrc.connect(hissBp);
      hissBp.connect(hissGain);
      hissGain.connect(chGain);

      ch.nodes.push(hearthSrc, hearthLp, draftLfo, draftDepth, hearthGain, hissSrc, hissBp, hissGain);

      // Realistic wood crackle impulses (filtered micro-bursts in natural clusters)
      const fireTimer = setInterval(() => {
        if (!this.channels.fire || !this.ctx) return;
        if (Math.random() > 0.58) return;
        const panBase = Math.random() * 0.9 - 0.45;
        // Primary wood snap
        this.spawnNoiseTransient(ctx, chGain, {
          dur: 0.008 + Math.random() * 0.012,
          freq: 900 + Math.random() * 2400,
          q: 3.8 + Math.random() * 3.5,
          amp: 0.14 + Math.random() * 0.18,
          pan: panBase,
          reverb: 0.12,
        });
        // Secondary tiny ember crackles
        if (Math.random() < 0.55) {
          setTimeout(() => {
            if (!this.channels.fire || !this.ctx) return;
            this.spawnNoiseTransient(ctx, chGain, {
              dur: 0.005,
              freq: 2200 + Math.random() * 1800,
              q: 5.5,
              amp: 0.06 + Math.random() * 0.08,
              pan: panBase + (Math.random() * 0.2 - 0.1),
              reverb: 0.08,
            });
          }, 35 + Math.random() * 75);
        }
      }, 115);
      ch.timers.push(fireTimer);
    }

    // 4. OCEAN WAVES (Dual asynchronous deep swell + shorewash surf foam)
    else if (kind === 'waves') {
      // Layer A: Deep rolling swell
      const swellSrc = this.createLoopingSource(ctx, 'brown', 1.0);
      const swellLp = ctx.createBiquadFilter();
      swellLp.type = 'lowpass';
      swellLp.frequency.value = 340;

      const swellGain = ctx.createGain();
      swellGain.gain.value = 0.55;

      const waveLfo = ctx.createOscillator();
      waveLfo.type = 'sine';
      waveLfo.frequency.value = 0.105; // ~9.5s per wave

      const freqDepth = ctx.createGain();
      freqDepth.gain.value = 230;
      waveLfo.connect(freqDepth);
      freqDepth.connect(swellLp.frequency);

      const ampDepth = ctx.createGain();
      ampDepth.gain.value = 0.36;
      waveLfo.connect(ampDepth);
      ampDepth.connect(swellGain.gain);
      waveLfo.start();

      swellSrc.connect(swellLp);
      swellLp.connect(swellGain);
      swellGain.connect(chGain);

      // Layer B: Foamy shorewash cresting & receding
      const foamSrc = this.createLoopingSource(ctx, 'pink', 1.02);
      const foamBp = ctx.createBiquadFilter();
      foamBp.type = 'bandpass';
      foamBp.frequency.value = 1450;
      foamBp.Q.value = 0.55;

      const foamGain = ctx.createGain();
      foamGain.gain.value = 0.18;

      const foamLfo = ctx.createOscillator();
      foamLfo.type = 'sine';
      foamLfo.frequency.value = 0.105;
      const foamDepth = ctx.createGain();
      foamDepth.gain.value = 0.15;
      foamLfo.connect(foamDepth);
      foamDepth.connect(foamGain.gain);
      foamLfo.start(ctx.currentTime + 1.4); // phase offset for receding foam wash

      foamSrc.connect(foamBp);
      foamBp.connect(foamGain);
      foamGain.connect(chGain);
      sendReverb(foamGain, 0.2);

      ch.nodes.push(
        swellSrc, swellLp, swellGain, waveLfo, freqDepth, ampDepth,
        foamSrc, foamBp, foamGain, foamLfo, foamDepth
      );
    }

    // 5. FOREST & BIRDS (Spatial stereo canopy breeze + realistic songbird syrinx)
    else if (kind === 'forest') {
      [-0.65, 0.65].forEach((panPos, idx) => {
        const leafSrc = this.createLoopingSource(ctx, 'pink', idx === 0 ? 0.96 : 1.04);
        const leafBp = ctx.createBiquadFilter();
        leafBp.type = 'bandpass';
        leafBp.frequency.value = idx === 0 ? 580 : 720;
        leafBp.Q.value = 0.85;

        const breezeLfo = ctx.createOscillator();
        breezeLfo.frequency.value = idx === 0 ? 0.065 : 0.088;
        const breezeDepth = ctx.createGain();
        breezeDepth.gain.value = 210;
        breezeLfo.connect(breezeDepth);
        breezeDepth.connect(leafBp.frequency);
        breezeLfo.start();

        const pan = this.createPanner(ctx, panPos);
        const g = ctx.createGain();
        g.gain.value = 0.28;

        leafSrc.connect(leafBp);
        leafBp.connect(pan);
        pan.connect(g);
        g.connect(chGain);
        ch.nodes.push(leafSrc, leafBp, breezeLfo, breezeDepth, pan, g);
      });

      // Natural songbird phrases in forest canopy
      const birdTimer = setInterval(() => {
        if (!this.channels.forest || !this.ctx) return;
        if (Math.random() > 0.42) return;
        const notesCount = 2 + Math.floor(Math.random() * 3);
        const panVal = Math.random() * 1.5 - 0.75;
        const baseFreq = 2200 + Math.random() * 1400;
        const startT = ctx.currentTime + 0.05;

        for (let n = 0; n < notesCount; n++) {
          const t0 = startT + n * (0.11 + Math.random() * 0.07);
          const dur = 0.07 + Math.random() * 0.06;
          const fStart = baseFreq * (0.92 + Math.random() * 0.22);
          const fEnd = fStart * (Math.random() > 0.4 ? 1.18 : 0.86);

          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(fStart, t0);
          osc.frequency.exponentialRampToValueAtTime(fEnd, t0 + dur);

          const pan = this.createPanner(ctx, panVal);
          const env = ctx.createGain();
          env.gain.setValueAtTime(0.0005, t0);
          env.gain.linearRampToValueAtTime(0.055, t0 + 0.015);
          env.gain.exponentialRampToValueAtTime(0.0005, t0 + dur);

          osc.connect(pan);
          pan.connect(env);
          env.connect(chGain);
          if (this.reverbSend) env.connect(this.reverbSend);

          osc.start(t0);
          osc.stop(t0 + dur + 0.02);
        }
      }, 1900);
      ch.timers.push(birdTimer);
    }

    // 6. MOUNTAIN STREAM (Turbulent babbling brook + resonant water bubbles)
    else if (kind === 'stream') {
      const brookSrc = this.createLoopingSource(ctx, 'pink', 1.0);
      const bp1 = ctx.createBiquadFilter();
      bp1.type = 'bandpass';
      bp1.frequency.value = 640;
      bp1.Q.value = 1.1;

      const lfo1 = ctx.createOscillator();
      lfo1.frequency.value = 2.9;
      const d1 = ctx.createGain();
      d1.gain.value = 190;
      lfo1.connect(d1);
      d1.connect(bp1.frequency);
      lfo1.start();

      const bp2 = ctx.createBiquadFilter();
      bp2.type = 'bandpass';
      bp2.frequency.value = 1580;
      bp2.Q.value = 0.9;

      const g1 = ctx.createGain();
      g1.gain.value = 0.48;
      const g2 = ctx.createGain();
      g2.gain.value = 0.22;

      brookSrc.connect(bp1);
      bp1.connect(g1);
      g1.connect(chGain);

      brookSrc.connect(bp2);
      bp2.connect(g2);
      g2.connect(chGain);

      ch.nodes.push(brookSrc, bp1, lfo1, d1, bp2, g1, g2);

      // Gentle liquid gurgles / droplets
      const bubbleTimer = setInterval(() => {
        if (!this.channels.stream || !this.ctx) return;
        if (Math.random() > 0.55) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        const f0 = 320 + Math.random() * 420;
        osc.frequency.setValueAtTime(f0, now);
        osc.frequency.exponentialRampToValueAtTime(f0 * 1.85, now + 0.065);

        const pan = this.createPanner(ctx, Math.random() * 1.4 - 0.7);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0005, now);
        g.gain.linearRampToValueAtTime(0.032 + Math.random() * 0.025, now + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0005, now + 0.075);

        osc.connect(pan);
        pan.connect(g);
        g.connect(chGain);
        if (this.reverbSend) g.connect(this.reverbSend);
        osc.start(now);
        osc.stop(now + 0.08);
      }, 150);
      ch.timers.push(bubbleTimer);
    }

    // 7. SUMMER NIGHT & CRICKETS (Warm nocturnal air + stridulating field crickets)
    else if (kind === 'night') {
      const airSrc = this.createLoopingSource(ctx, 'brown', 0.92);
      const airLp = ctx.createBiquadFilter();
      airLp.type = 'lowpass';
      airLp.frequency.value = 240;
      const airG = ctx.createGain();
      airG.gain.value = 0.32;
      airSrc.connect(airLp);
      airLp.connect(airG);
      airG.connect(chGain);
      ch.nodes.push(airSrc, airLp, airG);

      const cricketTimer = setInterval(() => {
        if (!this.channels.night || !this.ctx) return;
        if (Math.random() > 0.65) return;
        const pulses = 3 + Math.floor(Math.random() * 2);
        const carrier = 4120 + (Math.random() - 0.5) * 180;
        const panPos = Math.random() * 1.6 - 0.8;
        const tBase = ctx.currentTime + 0.02;

        for (let p = 0; p < pulses; p++) {
          const t0 = tBase + p * 0.042;
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = carrier;

          const pan = this.createPanner(ctx, panPos);
          const env = ctx.createGain();
          env.gain.setValueAtTime(0.0005, t0);
          env.gain.linearRampToValueAtTime(0.035, t0 + 0.008);
          env.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.032);

          osc.connect(pan);
          pan.connect(env);
          env.connect(chGain);
          if (this.reverbSend) env.connect(this.reverbSend);
          osc.start(t0);
          osc.stop(t0 + 0.036);
        }
      }, 420);
      ch.timers.push(cricketTimer);
    }

    // 8. COZY PARISIAN CAFÉ (Warm vocal-formant room murmur + porcelain clinks)
    else if (kind === 'cafe') {
      const roomSrc = this.createLoopingSource(ctx, 'pink', 0.98);
      const formants = [
        { freq: 390, q: 1.4, gain: 0.42, lfo: 0.23 },
        { freq: 860, q: 1.7, gain: 0.28, lfo: 0.31 },
        { freq: 1520, q: 2.0, gain: 0.14, lfo: 0.19 },
      ];
      formants.forEach((fm, idx) => {
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = fm.freq;
        bp.Q.value = fm.q;

        const lfo = ctx.createOscillator();
        lfo.frequency.value = fm.lfo;
        const depth = ctx.createGain();
        depth.gain.value = fm.gain * 0.45;

        const g = ctx.createGain();
        g.gain.value = fm.gain;
        lfo.connect(depth);
        depth.connect(g.gain);
        lfo.start();

        const pan = this.createPanner(ctx, (idx - 1) * 0.35);
        roomSrc.connect(bp);
        bp.connect(g);
        g.connect(pan);
        pan.connect(chGain);
        ch.nodes.push(bp, lfo, depth, g, pan);
      });
      ch.nodes.push(roomSrc);

      // Subtle porcelain cup/spoon clinks
      const clinkTimer = setInterval(() => {
        if (!this.channels.cafe || !this.ctx) return;
        if (Math.random() > 0.32) return;
        const now = ctx.currentTime;
        const f1 = 2650 + Math.random() * 900;
        const pan = this.createPanner(ctx, Math.random() * 1.4 - 0.7);
        pan.connect(chGain);
        if (this.reverbSend) pan.connect(this.reverbSend);

        [f1, f1 * 1.58].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0005, now);
          g.gain.linearRampToValueAtTime(0.028 / (i + 1), now + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0004, now + 0.16);
          osc.connect(g);
          g.connect(pan);
          osc.start(now);
          osc.stop(now + 0.18);
        });
      }, 2600);
      ch.timers.push(clinkTimer);
    }

    // 9. NIGHT SLEEPER TRAIN (Warm coach hum + cushioned rhythmic rail cadence)
    else if (kind === 'train') {
      const cabSrc = this.createLoopingSource(ctx, 'brown', 0.9);
      const cabLp = ctx.createBiquadFilter();
      cabLp.type = 'lowpass';
      cabLp.frequency.value = 195;
      const cabGain = ctx.createGain();
      cabGain.gain.value = 0.68;
      cabSrc.connect(cabLp);
      cabLp.connect(cabGain);
      cabGain.connect(chGain);

      // Subtle low engine drone
      const hum = ctx.createOscillator();
      hum.type = 'sine';
      hum.frequency.value = 74;
      const humGain = ctx.createGain();
      humGain.gain.value = 0.09;
      hum.connect(humGain);
      humGain.connect(chGain);
      hum.start();

      ch.nodes.push(cabSrc, cabLp, cabGain, hum, humGain);

      // Double rail-joint beat ("ta-dum ... ta-dum")
      const railTimer = setInterval(() => {
        if (!this.channels.train || !this.ctx) return;
        [0, 0.17, 0.52, 0.69].forEach((offset, idx) => {
          setTimeout(() => {
            if (!this.channels.train || !this.ctx) return;
            this.spawnNoiseTransient(ctx, chGain, {
              dur: 0.055,
              freq: idx % 2 === 0 ? 155 : 125,
              q: 1.8,
              amp: 0.22,
              pan: idx < 2 ? -0.2 : 0.2,
              reverb: 0.05,
            });
          }, offset * 1000);
        });
      }, 1750);
      ch.timers.push(railTimer);
    }

    // 10. TIBETAN SINGING BOWLS & BINAURAL DRONE
    else if (kind === 'zen') {
      const padFreqs = [108, 162, 216, 219.5]; // gentle 3.5 Hz theta relaxation shimmer
      padFreqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        const pan = this.createPanner(ctx, i % 2 === 0 ? -0.35 : 0.35);
        const g = ctx.createGain();
        g.gain.value = 0.11 / (i * 0.4 + 1);
        osc.connect(pan);
        pan.connect(g);
        g.connect(chGain);
        osc.start();
        ch.nodes.push(osc, pan, g);
      });

      const strikeBowl = () => {
        if (!this.channels.zen || !this.ctx) return;
        const now = ctx.currentTime;
        const roots = [216, 288, 324];
        const root = roots[Math.floor(Math.random() * roots.length)];
        const partials = [1, 2.71, 4.95];
        const pan = this.createPanner(ctx, Math.random() * 1.0 - 0.5);
        pan.connect(chGain);
        if (this.reverbSend) pan.connect(this.reverbSend);

        partials.forEach((ratio, idx) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = root * ratio;
          const g = ctx.createGain();
          const peak = 0.085 / (idx * 1.4 + 1);
          g.gain.setValueAtTime(0.0004, now);
          g.gain.linearRampToValueAtTime(peak, now + 0.08);
          g.gain.exponentialRampToValueAtTime(0.0003, now + 6.2);
          osc.connect(g);
          g.connect(pan);
          osc.start(now);
          osc.stop(now + 6.3);
        });
      };

      setTimeout(strikeBowl, 600);
      const bowlTimer = setInterval(() => {
        if (Math.random() < 0.65) strikeBowl();
      }, 7800);
      ch.timers.push(bowlTimer);
    }

    // 11. SILK PINK NOISE (Balanced studio pink noise with smooth high roll-off)
    else if (kind === 'pink') {
      const src = this.createLoopingSource(ctx, 'pink', 1.0);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2800;
      const g = ctx.createGain();
      g.gain.value = 0.58;
      src.connect(lp);
      lp.connect(g);
      g.connect(chGain);
      ch.nodes.push(src, lp, g);
    }

    // 12. DEEP BROWN NOISE (Warm sub-smoothed waterfall masking)
    else if (kind === 'brown') {
      const src = this.createLoopingSource(ctx, 'brown', 1.0);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 390;
      const g = ctx.createGain();
      g.gain.value = 0.82;
      src.connect(lp);
      lp.connect(g);
      g.connect(chGain);
      ch.nodes.push(src, lp, g);
    }

    this.notifyChange();
  }

  spawnNoiseTransient(ctx, destNode, { dur = 0.015, freq = 1800, q = 3.0, amp = 0.1, pan = 0, reverb = 0 }) {
    const now = ctx.currentTime;
    const samples = Math.max(32, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, samples, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      const env = Math.pow(1 - i / samples, 2.1);
      d[i] = (Math.random() * 2 - 1) * env;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;

    const panner = this.createPanner(ctx, pan);
    const gain = ctx.createGain();
    gain.gain.value = amp;

    src.connect(filter);
    filter.connect(panner);
    panner.connect(gain);
    gain.connect(destNode);

    if (reverb > 0 && this.reverbSend) {
      const revG = ctx.createGain();
      revG.gain.value = reverb;
      gain.connect(revG);
      revG.connect(this.reverbSend);
    }

    src.start(now);
  }
}

window.coolAudio = new CoolClockAudio();
