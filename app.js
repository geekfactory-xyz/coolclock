/* ==========================================================================
   CoolClock — Main Application Logic
   ========================================================================== */

(() => {
  'use strict';

  const STORAGE_KEY = 'coolclock_state_v1';
  const RING_CIRCUMFERENCE = 2 * Math.PI * 114; // r = 114 => ~716.28

  const THEMES = [
    // Nuit & Espace (dark)
    { id: 'aurora-night', name: 'Nuit Boréale', bg: '#080d1a', color: '#38bdf8', cat: 'dark' },
    { id: 'midnight-gold', name: 'Or de Minuit', bg: '#0b0a09', color: '#f59e0b', cat: 'dark' },
    { id: 'deep-ocean', name: 'Abysses Océan', bg: '#03111c', color: '#06b6d4', cat: 'dark' },
    { id: 'eclipse-crimson', name: 'Éclipse Écarlate', bg: '#100608', color: '#ef4444', cat: 'dark' },
    { id: 'cosmic-lavender', name: 'Lavande Cosmique', bg: '#110d21', color: '#c084fc', cat: 'dark' },
    { id: 'obsidian-amber', name: 'Obsidienne Ambrée', bg: '#111113', color: '#fb923c', cat: 'dark' },
    // Néon & Rétro (neon)
    { id: 'cyber-neon', name: 'Néon Cyberpunk', bg: '#070412', color: '#f43f5e', cat: 'neon' },
    { id: 'synthwave-84', name: "Synthwave '84", bg: '#160929', color: '#ff6ad5', cat: 'neon' },
    { id: 'matrix-code', name: 'Terminal Matrix', bg: '#020a04', color: '#22c55e', cat: 'neon' },
    { id: 'pipboy-amber', name: 'CRT Ambre Rétro', bg: '#110c02', color: '#ffb000', cat: 'neon' },
    { id: 'vaporwave-dream', name: 'Rêve Vaporwave', bg: '#171230', color: '#67e8f9', cat: 'neon' },
    { id: 'arcade-pixel', name: 'Borne Arcade', bg: '#090b24', color: '#facc15', cat: 'neon' },
    // Nature & Zen (nature)
    { id: 'zen-forest', name: 'Forêt Zen', bg: '#091410', color: '#34d399', cat: 'nature' },
    { id: 'campfire-ember', name: 'Feu de Camp', bg: '#140c08', color: '#f97316', cat: 'nature' },
    { id: 'arctic-glacier', name: 'Glacier Arctique', bg: '#0b1824', color: '#7dd3fc', cat: 'nature' },
    { id: 'sakura-night', name: 'Nuit de Sakura', bg: '#170d16', color: '#fda4af', cat: 'nature' },
    { id: 'desert-dune', name: 'Dunes Dorées', bg: '#19130c', color: '#eab308', cat: 'nature' },
    { id: 'stormy-fjord', name: 'Fjord Orageux', bg: '#0f141c', color: '#93c5fd', cat: 'nature' },
    // Clair & Minimaliste (light)
    { id: 'solar-dawn', name: 'Aurore Solaire', bg: '#fdf8f2', color: '#ea580c', cat: 'light' },
    { id: 'matcha-latte', name: 'Matcha Latte', bg: '#f4f7f0', color: '#4d7c0f', cat: 'light' },
    { id: 'nordic-snow', name: 'Neige Nordique', bg: '#f1f5f9', color: '#0284c7', cat: 'light' },
    { id: 'rose-quartz', name: 'Quartz Rose', bg: '#fdf2f8', color: '#db2777', cat: 'light' },
    { id: 'espresso-paper', name: 'Papier & Espresso', bg: '#f5efe6', color: '#92400e', cat: 'light' },
    { id: 'mono-minimal', name: 'Monochrome Brut', bg: '#0c0c0e', color: '#ffffff', cat: 'light' },
  ];

  const FEATURED_TIMEZONES = [
    { tz: 'America/Montreal', label: 'Montréal, Canada' },
    { tz: 'America/Toronto', label: 'Toronto, Canada' },
    { tz: 'America/Vancouver', label: 'Vancouver, Canada' },
    { tz: 'America/New_York', label: 'New York, États-Unis' },
    { tz: 'America/Chicago', label: 'Chicago, États-Unis' },
    { tz: 'America/Los_Angeles', label: 'Los Angeles, États-Unis' },
    { tz: 'America/Mexico_City', label: 'Mexico, Mexique' },
    { tz: 'America/Sao_Paulo', label: 'São Paulo, Brésil' },
    { tz: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires, Argentine' },
    { tz: 'Atlantic/Reykjavik', label: 'Reykjavik, Islande' },
    { tz: 'Europe/London', label: 'Londres, Royaume-Uni' },
    { tz: 'Europe/Paris', label: 'Paris, France' },
    { tz: 'Europe/Brussels', label: 'Bruxelles, Belgique' },
    { tz: 'Europe/Zurich', label: 'Genève / Zurich, Suisse' },
    { tz: 'Europe/Berlin', label: 'Berlin, Allemagne' },
    { tz: 'Europe/Madrid', label: 'Madrid, Espagne' },
    { tz: 'Europe/Rome', label: 'Rome, Italie' },
    { tz: 'Europe/Athens', label: 'Athènes, Grèce' },
    { tz: 'Africa/Casablanca', label: 'Casablanca, Maroc' },
    { tz: 'Africa/Dakar', label: 'Dakar, Sénégal' },
    { tz: 'Africa/Cairo', label: 'Le Caire, Égypte' },
    { tz: 'Africa/Johannesburg', label: 'Johannesbourg, Afrique du Sud' },
    { tz: 'Asia/Dubai', label: 'Dubaï, Émirats Arabes Unis' },
    { tz: 'Asia/Kolkata', label: 'New Delhi / Mumbai, Inde' },
    { tz: 'Asia/Bangkok', label: 'Bangkok, Thaïlande' },
    { tz: 'Asia/Singapore', label: 'Singapour' },
    { tz: 'Asia/Hong_Kong', label: 'Hong Kong' },
    { tz: 'Asia/Seoul', label: 'Séoul, Corée du Sud' },
    { tz: 'Asia/Tokyo', label: 'Tokyo, Japon' },
    { tz: 'Australia/Sydney', label: 'Sydney, Australie' },
    { tz: 'Pacific/Auckland', label: 'Auckland, Nouvelle-Zélande' },
    { tz: 'UTC', label: 'Temps Universel Coordonné (UTC)' },
  ];

  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  /* -------------------- Persistent State -------------------- */
  const defaultState = {
    lang: 'fr',
    theme: 'aurora-night',
    activeTab: 'clock',
    clockStyle: 'digital',
    use24h: true,
    showSeconds: true,
    selectedTz: 'LOCAL',
    worldClocks: ['Europe/Paris', 'America/New_York', 'Asia/Tokyo', 'Europe/London'],
    alarmSound: 'crystal',
    timerVisualMode: 'candle',
    ambientVolume: 50,
    musicService: 'spotify',
    customStreamUrls: {},
    pomoConfig: { work: 25, short: 5, long: 15, auto: false },
    pomoStats: { date: new Date().toDateString(), sessions: 0, minutes: 0 },
    pomoTasks: [
      { id: 1, text: 'Définir l’objectif prioritaire de la session', done: false },
    ],
    focusIntention: '',
  };

  let state = loadState();

  /* -------------------- i18n Helpers (FR / EN) -------------------- */
  function getLang() {
    return state.lang === 'en' ? 'en' : 'fr';
  }

  function getLocale() {
    return getLang() === 'en' ? 'en-US' : 'fr-FR';
  }

  function getDict(lang = getLang()) {
    const all = window.COOLCLOCK_I18N || {};
    return all[lang] || all.fr || {};
  }

  function t(key, vars) {
    const dict = getDict();
    const fallback = (window.COOLCLOCK_I18N && window.COOLCLOCK_I18N.fr) || {};
    let str = dict[key] !== undefined ? dict[key] : fallback[key];
    if (typeof str !== 'string') return key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replaceAll(`{${k}}`, String(v));
      });
    }
    return str;
  }

  function getThemeDisplayName(themeObj) {
    const names = getDict().themeNames;
    return (names && names[themeObj.id]) || themeObj.name;
  }

  function getFeaturedTzLabel(tz) {
    const labels = getDict().tzLabels;
    if (labels && labels[tz]) return labels[tz];
    const found = FEATURED_TIMEZONES.find((item) => item.tz === tz);
    return found ? found.label : null;
  }

  function getInteractiveHint(mode) {
    const key = `hint.${mode}`;
    const val = t(key);
    return val === key ? '' : val;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(defaultState);
      const parsed = JSON.parse(raw);
      const merged = {
        ...structuredClone(defaultState),
        ...parsed,
        pomoConfig: { ...defaultState.pomoConfig, ...(parsed.pomoConfig || {}) },
        pomoStats: { ...defaultState.pomoStats, ...(parsed.pomoStats || {}) },
        customStreamUrls: { ...defaultState.customStreamUrls, ...(parsed.customStreamUrls || {}) },
      };
      if (merged.lang !== 'fr' && merged.lang !== 'en') {
        merged.lang = 'fr';
      }
      // Reset daily stats if day changed
      if (merged.pomoStats.date !== new Date().toDateString()) {
        merged.pomoStats = { date: new Date().toDateString(), sessions: 0, minutes: 0 };
      }
      return merged;
    } catch (_) {
      return structuredClone(defaultState);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  /* -------------------- Timezone Helpers -------------------- */
  function getEffectiveMainTz() {
    return state.selectedTz === 'LOCAL' ? localTimezone : state.selectedTz;
  }

  function getFriendlyTzLabel(tz) {
    if (tz === 'LOCAL') return t('clock.localTimeCity', { city: formatTzCity(localTimezone) });
    const featured = getFeaturedTzLabel(tz);
    if (featured) return featured;
    return formatTzCity(tz);
  }

  function formatTzCity(tz) {
    if (!tz) return 'Local';
    if (tz === 'UTC') return 'UTC';
    const featured = getFeaturedTzLabel(tz);
    if (featured) return featured.split(',')[0].trim();
    const parts = tz.split('/');
    return parts[parts.length - 1].replace(/_/g, ' ');
  }

  function getTzParts(date, timeZone) {
    let dtf;
    try {
      dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone || 'UTC',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (_) {
      dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }
    const parts = {};
    dtf.formatToParts(date).forEach(({ type, value }) => {
      parts[type] = value;
    });
    let hour = parseInt(parts.hour, 10);
    if (hour === 24) hour = 0;
    return {
      year: parseInt(parts.year, 10),
      month: parseInt(parts.month, 10),
      day: parseInt(parts.day, 10),
      hour,
      minute: parseInt(parts.minute, 10),
      second: parseInt(parts.second, 10),
    };
  }

  function getUtcOffsetMinutes(date, timeZone) {
    const p = getTzParts(date, timeZone);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const utcNow = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
    return Math.round((asUtc - utcNow) / 60000);
  }

  function formatUtcOffset(offsetMins) {
    const sign = offsetMins >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMins);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return m === 0 ? `UTC${sign}${h}` : `UTC${sign}${h}:${String(m).padStart(2, '0')}`;
  }

  function formatDiffFromLocal(date, targetTz) {
    const targetMin = getUtcOffsetMinutes(date, targetTz);
    const localMin = getUtcOffsetMinutes(date, localTimezone);
    const diff = targetMin - localMin;
    if (diff === 0) return t('clock.diff.same');
    const sign = diff > 0 ? '+' : '-';
    const abs = Math.abs(diff);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    const dur = m === 0 ? `${h} h` : `${h} h ${m} min`;
    return t('clock.diff.offset', { sign, dur });
  }

  function getWeekAndDayOfYear(year, month, day) {
    const current = new Date(Date.UTC(year, month - 1, day));
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const dayOfYear = Math.floor((current - startOfYear) / 86400000) + 1;

    // ISO 8601 week number
    const temp = new Date(current.getTime());
    const dayNum = temp.getUTCDay() || 7;
    temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((temp - yearStart) / 86400000 + 1) / 7);
    return { weekNo, dayOfYear };
  }

  /* -------------------- Formatting Helpers -------------------- */
  function pad2(n) {
    return String(Math.floor(Math.max(0, n))).padStart(2, '0');
  }

  function formatDurationSec(totalSec) {
    const sec = Math.max(0, Math.ceil(totalSec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
    return `${pad2(m)}:${pad2(s)}`;
  }

  function formatStopwatchMs(ms) {
    const totalCs = Math.floor(ms / 10);
    const cs = totalCs % 100;
    const totalSec = Math.floor(totalCs / 100);
    const s = totalSec % 60;
    const m = Math.floor(totalSec / 60) % 60;
    const h = Math.floor(totalSec / 3600);
    return {
      main: `${pad2(h)}:${pad2(m)}:${pad2(s)}`,
      short: h > 0 ? `${pad2(h)}:${pad2(m)}:${pad2(s)}.${pad2(cs)}` : `${pad2(m)}:${pad2(s)}.${pad2(cs)}`,
      cs: `.${pad2(cs)}`,
    };
  }

  /* -------------------- DOM References -------------------- */
  const el = {
    langBtns: document.querySelectorAll('#lang-toggle .lang-btn'),
    metaDesc: document.getElementById('meta-description'),
    themeBtn: document.getElementById('theme-menu-btn'),
    themePopover: document.getElementById('theme-popover'),
    themeGrid: document.getElementById('theme-grid'),
    randomThemeBtn: document.getElementById('random-theme-btn'),
    themeSearchInput: document.getElementById('theme-search-input'),
    themeCatPills: document.querySelectorAll('#theme-cat-pills .cat-pill'),
    headerTzBadge: document.getElementById('header-tz-badge'),

    navTabs: document.querySelectorAll('.nav-tab'),
    panels: document.querySelectorAll('.tab-panel'),
    navPomoPill: document.getElementById('nav-pomo-pill'),
    navTimerPill: document.getElementById('nav-timer-pill'),
    navSwPill: document.getElementById('nav-sw-pill'),

    // Clock
    clockStyleBtns: document.querySelectorAll('#clock-style-switch .seg-btn'),
    mainTzSelect: document.getElementById('main-tz-select'),
    resetLocalTzBtn: document.getElementById('reset-local-tz-btn'),
    toggle24hBtn: document.getElementById('toggle-24h-btn'),
    toggleSecBtn: document.getElementById('toggle-seconds-btn'),
    clockCityLabel: document.getElementById('clock-city-label'),
    clockOffsetLabel: document.getElementById('clock-offset-label'),

    viewDigital: document.getElementById('view-digital'),
    viewAnalog: document.getElementById('view-analog'),
    viewFlip: document.getElementById('view-flip'),

    digHours: document.getElementById('dig-hours'),
    digMinutes: document.getElementById('dig-minutes'),
    digSecondsWrap: document.getElementById('dig-seconds-wrap'),
    digSeconds: document.getElementById('dig-seconds'),
    digAmpm: document.getElementById('dig-ampm'),
    minuteProgressBar: document.getElementById('minute-progress-bar'),

    analogTicks: document.getElementById('analog-ticks'),
    analogNumbers: document.getElementById('analog-numbers'),
    analogSubDigital: document.getElementById('analog-sub-digital'),
    handHour: document.getElementById('hand-hour'),
    handMinute: document.getElementById('hand-minute'),
    handSecond: document.getElementById('hand-second'),

    flipHours: document.getElementById('flip-hours'),
    flipMinutes: document.getElementById('flip-minutes'),
    flipSeconds: document.getElementById('flip-seconds'),
    flipSecSep: document.getElementById('flip-sec-sep'),
    flipSecUnit: document.getElementById('flip-sec-unit'),
    flipAmpm: document.getElementById('flip-ampm'),

    clockDateFull: document.getElementById('clock-date-full'),
    clockWeekNum: document.getElementById('clock-week-num'),
    clockDayYear: document.getElementById('clock-day-year'),
    clockDiffLocal: document.getElementById('clock-diff-local'),
    miniWorldGrid: document.getElementById('mini-world-grid'),

    // World
    worldAddSelect: document.getElementById('world-add-select'),
    worldAddBtn: document.getElementById('world-add-btn'),
    worldCardsGrid: document.getElementById('world-cards-grid'),

    // Pomodoro
    pomoModeBtns: document.querySelectorAll('#pomo-mode-tabs .seg-btn'),
    pomoRingFill: document.getElementById('pomo-ring-fill'),
    pomoPhaseLabel: document.getElementById('pomo-phase-label'),
    pomoTimeDisplay: document.getElementById('pomo-time-display'),
    pomoCycleDots: document.getElementById('pomo-cycle-dots'),
    pomoResetBtn: document.getElementById('pomo-reset-btn'),
    pomoStartBtn: document.getElementById('pomo-start-btn'),
    pomoStartLabel: document.getElementById('pomo-start-label'),
    pomoSkipBtn: document.getElementById('pomo-skip-btn'),
    pomoCfgWork: document.getElementById('pomo-cfg-work'),
    pomoCfgShort: document.getElementById('pomo-cfg-short'),
    pomoCfgLong: document.getElementById('pomo-cfg-long'),
    pomoCfgAuto: document.getElementById('pomo-cfg-auto'),
    pomoStatSessions: document.getElementById('pomo-stat-sessions'),
    pomoStatMinutes: document.getElementById('pomo-stat-minutes'),
    pomoClearDoneBtn: document.getElementById('pomo-clear-done-btn'),
    pomoTaskForm: document.getElementById('pomo-task-form'),
    pomoTaskInput: document.getElementById('pomo-task-input'),
    pomoTaskList: document.getElementById('pomo-task-list'),

    // Timers & Interactive Visual Timers
    alarmSoundSelect: document.getElementById('alarm-sound-select'),
    timerVisualBtns: document.querySelectorAll('#timer-visual-modes .vmode-btn'),
    timerStageWrapper: document.getElementById('timer-stage-wrapper'),
    interactiveCanvasBox: document.getElementById('interactive-canvas-box'),
    interactiveCanvas: document.getElementById('interactive-timer-canvas'),
    interactiveHintText: document.getElementById('interactive-hint-text'),
    timerRingSvg: document.getElementById('timer-ring-svg'),
    timerPresets: document.getElementById('timer-presets'),
    mainTimerRing: document.getElementById('main-timer-ring'),
    timerHmsInputs: document.getElementById('timer-hms-inputs'),
    tInH: document.getElementById('t-in-h'),
    tInM: document.getElementById('t-in-m'),
    tInS: document.getElementById('t-in-s'),
    mainTimerReadout: document.getElementById('main-timer-readout'),
    mainTimerTitle: document.getElementById('main-timer-title'),
    mainTimerReset: document.getElementById('main-timer-reset'),
    mainTimerStart: document.getElementById('main-timer-start'),
    mainTimerPlus1: document.getElementById('main-timer-plus1'),
    testSoundBtn: document.getElementById('test-sound-btn'),
    multiTimerForm: document.getElementById('multi-timer-form'),
    mtName: document.getElementById('mt-name'),
    mtMin: document.getElementById('mt-min'),
    mtSec: document.getElementById('mt-sec'),
    multiTimersList: document.getElementById('multi-timers-list'),

    // Stopwatch
    swMainTime: document.getElementById('sw-main-time'),
    swCentis: document.getElementById('sw-centis'),
    swCurrentLap: document.getElementById('sw-current-lap'),
    swResetBtn: document.getElementById('sw-reset-btn'),
    swStartBtn: document.getElementById('sw-start-btn'),
    swLapBtn: document.getElementById('sw-lap-btn'),
    swLapCount: document.getElementById('sw-lap-count'),
    swCopyLapsBtn: document.getElementById('sw-copy-laps-btn'),
    swLapsBody: document.getElementById('sw-laps-body'),

    // Focus Mode
    focusToggleBtn: document.getElementById('focus-toggle-btn'),
    focusOverlay: document.getElementById('focus-overlay'),
    focusSourceBtns: document.querySelectorAll('#focus-source-switch .seg-btn'),
    focusFullscreenBtn: document.getElementById('focus-fullscreen-btn'),
    focusCloseBtn: document.getElementById('focus-close-btn'),
    focusIntentionInput: document.getElementById('focus-intention-input'),
    focusGiantReadout: document.getElementById('focus-giant-readout'),
    focusSubStatus: document.getElementById('focus-sub-status'),
    focusActionWrap: document.getElementById('focus-action-wrap'),
    focusPrimaryBtn: document.getElementById('focus-primary-btn'),
    focusResetBtn: document.getElementById('focus-reset-btn'),
    toggleBreathBtn: document.getElementById('toggle-breath-btn'),
    breathVisualizer: document.getElementById('breath-visualizer'),
    breathText: document.getElementById('breath-text'),
    ambientSoundBtns: document.querySelectorAll('#ambient-sound-btns .sound-chip'),
    ambientVolume: document.getElementById('ambient-volume'),

    // Toast
    alarmToast: document.getElementById('alarm-toast'),
    alarmToastTitle: document.getElementById('alarm-toast-title'),
    alarmToastMsg: document.getElementById('alarm-toast-msg'),
    alarmDismissBtn: document.getElementById('alarm-dismiss-btn'),
  };

  /* ==========================================================================
     1. THEME ENGINE (24 Categorized Themes)
     ========================================================================== */
  let activeThemeCategory = 'all';
  let themeSearchQuery = '';

  function applyTheme(themeId) {
    state.theme = themeId;
    document.documentElement.setAttribute('data-theme', themeId);
    renderThemeGrid();
    saveState();
  }

  function cycleTheme() {
    const idx = THEMES.findIndex((t) => t.id === state.theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    applyTheme(next.id);
  }

  function pickRandomTheme() {
    const others = THEMES.filter((t) => t.id !== state.theme);
    const chosen = others[Math.floor(Math.random() * others.length)] || THEMES[0];
    applyTheme(chosen.id);
  }

  function renderThemeGrid() {
    el.themeGrid.innerHTML = '';
    const q = themeSearchQuery.trim().toLowerCase();

    const filtered = THEMES.filter((themeItem) => {
      const catOk = activeThemeCategory === 'all' || themeItem.cat === activeThemeCategory;
      const dispName = getThemeDisplayName(themeItem);
      const searchOk =
        !q ||
        dispName.toLowerCase().includes(q) ||
        themeItem.name.toLowerCase().includes(q) ||
        themeItem.id.toLowerCase().includes(q);
      return catOk && searchOk;
    });

    if (filtered.length === 0) {
      el.themeGrid.innerHTML = `<div class="muted-hint" style="grid-column:1/-1;text-align:center;padding:0.8rem 0;">${t('theme.empty')}</div>`;
      return;
    }

    filtered.forEach((themeItem) => {
      const btn = document.createElement('button');
      btn.className = `theme-option ${state.theme === themeItem.id ? 'active' : ''}`;
      const swatchStyle = `background: linear-gradient(135deg, ${themeItem.bg} 38%, ${themeItem.color} 100%)`;
      btn.innerHTML = `
        <span class="theme-swatch" style="${swatchStyle}"></span>
        <span>${getThemeDisplayName(themeItem)}</span>
      `;
      btn.addEventListener('click', () => {
        applyTheme(themeItem.id);
      });
      el.themeGrid.appendChild(btn);
    });
  }

  if (el.randomThemeBtn) {
    el.randomThemeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pickRandomTheme();
    });
  }

  if (el.themeSearchInput) {
    el.themeSearchInput.addEventListener('input', () => {
      themeSearchQuery = el.themeSearchInput.value;
      renderThemeGrid();
    });
  }

  el.themeCatPills.forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      activeThemeCategory = pill.dataset.cat;
      el.themeCatPills.forEach((p) => p.classList.toggle('active', p === pill));
      renderThemeGrid();
    });
  });

  el.themeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    el.themePopover.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!el.themePopover.contains(e.target) && !el.themeBtn.contains(e.target)) {
      el.themePopover.classList.add('hidden');
    }
  });

  /* ==========================================================================
     2. TAB NAVIGATION
     ========================================================================== */
  function switchTab(tabName) {
    state.activeTab = tabName;
    el.navTabs.forEach((btn) => {
      const active = btn.dataset.tab === tabName;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    el.panels.forEach((panel) => {
      panel.classList.toggle('active', panel.id === `panel-${tabName}`);
    });
    saveState();
  }

  el.navTabs.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('[data-goto-tab]').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.gotoTab));
  });

  /* ==========================================================================
     3. CLOCK & TIMEZONE SELECTORS
     ========================================================================== */
  function buildAnalogDial() {
    let ticksHtml = '';
    let numsHtml = '';
    for (let i = 0; i < 60; i++) {
      const angle = (i * 6 - 90) * (Math.PI / 180);
      const isMajor = i % 5 === 0;
      const rOuter = 132;
      const rInner = isMajor ? 119 : 126;
      const x1 = 150 + rInner * Math.cos(angle);
      const y1 = 150 + rInner * Math.sin(angle);
      const x2 = 150 + rOuter * Math.cos(angle);
      const y2 = 150 + rOuter * Math.sin(angle);
      ticksHtml += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" class="${isMajor ? 'analog-tick-major' : 'analog-tick-minor'}" />`;

      if (isMajor) {
        const hourNum = i === 0 ? 12 : i / 5;
        const rText = 102;
        const tx = 150 + rText * Math.cos(angle);
        const ty = 150 + rText * Math.sin(angle) + 5;
        numsHtml += `<text x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" text-anchor="middle" class="analog-num">${hourNum}</text>`;
      }
    }
    el.analogTicks.innerHTML = ticksHtml;
    el.analogNumbers.innerHTML = numsHtml;
  }

  function populateTimezoneDropdowns() {
    const prevWorldVal = el.worldAddSelect ? el.worldAddSelect.value : '';
    let allZones = FEATURED_TIMEZONES.map((f) => f.tz);
    if (typeof Intl.supportedValuesOf === 'function') {
      try {
        const supported = Intl.supportedValuesOf('timeZone');
        supported.forEach((z) => {
          if (!allZones.includes(z)) allZones.push(z);
        });
      } catch (_) {}
    }

    // Main Clock Selector
    const mainFrag = document.createDocumentFragment();
    const localOpt = document.createElement('option');
    localOpt.value = 'LOCAL';
    localOpt.textContent = t('clock.tz.localOpt', { city: formatTzCity(localTimezone) });
    mainFrag.appendChild(localOpt);

    const grpFeatured = document.createElement('optgroup');
    grpFeatured.label = t('clock.tz.groupFeatured');
    FEATURED_TIMEZONES.forEach(({ tz, label }) => {
      const opt = document.createElement('option');
      opt.value = tz;
      opt.textContent = getFeaturedTzLabel(tz) || label;
      grpFeatured.appendChild(opt);
    });
    mainFrag.appendChild(grpFeatured);

    const grpAll = document.createElement('optgroup');
    grpAll.label = t('clock.tz.groupAll');
    allZones
      .filter((z) => !FEATURED_TIMEZONES.some((f) => f.tz === z))
      .forEach((tz) => {
        const opt = document.createElement('option');
        opt.value = tz;
        opt.textContent = tz.replace(/_/g, ' ');
        grpAll.appendChild(opt);
      });
    mainFrag.appendChild(grpAll);

    el.mainTzSelect.innerHTML = '';
    el.mainTzSelect.appendChild(mainFrag);
    el.mainTzSelect.value = state.selectedTz;

    // World Clock Add Selector
    const worldFrag = document.createDocumentFragment();
    FEATURED_TIMEZONES.forEach(({ tz, label }) => {
      const opt = document.createElement('option');
      opt.value = tz;
      const locLabel = getFeaturedTzLabel(tz) || label;
      opt.textContent = `${locLabel} (${tz})`;
      worldFrag.appendChild(opt);
    });
    allZones
      .filter((z) => !FEATURED_TIMEZONES.some((f) => f.tz === z))
      .forEach((tz) => {
        const opt = document.createElement('option');
        opt.value = tz;
        opt.textContent = tz.replace(/_/g, ' ');
        worldFrag.appendChild(opt);
      });
    el.worldAddSelect.innerHTML = '';
    el.worldAddSelect.appendChild(worldFrag);
    if (prevWorldVal) {
      el.worldAddSelect.value = prevWorldVal;
    }
  }

  function applyClockControlsUI() {
    el.clockStyleBtns.forEach((b) => {
      b.classList.toggle('active', b.dataset.style === state.clockStyle);
    });
    el.viewDigital.classList.toggle('hidden', state.clockStyle !== 'digital');
    el.viewAnalog.classList.toggle('hidden', state.clockStyle !== 'analog');
    el.viewFlip.classList.toggle('hidden', state.clockStyle !== 'flip');

    el.toggle24hBtn.classList.toggle('active', state.use24h);
    el.toggle24hBtn.textContent = state.use24h ? '24h' : '12h AM/PM';
    el.toggleSecBtn.classList.toggle('active', state.showSeconds);

    el.digSecondsWrap.classList.toggle('hidden', !state.showSeconds);
    el.handSecond.classList.toggle('hidden', !state.showSeconds);
    el.flipSecSep.classList.toggle('hidden', !state.showSeconds);
    el.flipSecUnit.classList.toggle('hidden', !state.showSeconds);
  }

  el.clockStyleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.clockStyle = btn.dataset.style;
      applyClockControlsUI();
      saveState();
    });
  });

  el.mainTzSelect.addEventListener('change', () => {
    state.selectedTz = el.mainTzSelect.value;
    saveState();
    updateClockFrame();
  });

  el.resetLocalTzBtn.addEventListener('click', () => {
    state.selectedTz = 'LOCAL';
    el.mainTzSelect.value = 'LOCAL';
    saveState();
    updateClockFrame();
  });

  el.toggle24hBtn.addEventListener('click', () => {
    state.use24h = !state.use24h;
    applyClockControlsUI();
    saveState();
    updateClockFrame();
  });

  el.toggleSecBtn.addEventListener('click', () => {
    state.showSeconds = !state.showSeconds;
    applyClockControlsUI();
    saveState();
    updateClockFrame();
  });

  let prevFlip = { h: '', m: '', s: '' };

  function updateFlipUnit(cardEl, newVal, key) {
    if (prevFlip[key] !== newVal) {
      prevFlip[key] = newVal;
      cardEl.querySelector('.flip-value').textContent = newVal;
      cardEl.classList.remove('flip-animate');
      void cardEl.offsetWidth; // trigger reflow
      cardEl.classList.add('flip-animate');
    }
  }

  function updateClockFrame() {
    const now = new Date();
    const tz = getEffectiveMainTz();
    const parts = getTzParts(now, tz);
    const ms = now.getMilliseconds();

    let displayHour = parts.hour;
    let ampm = 'AM';
    if (!state.use24h) {
      ampm = displayHour >= 12 ? 'PM' : 'AM';
      displayHour = displayHour % 12 || 12;
    }

    const hStr = pad2(displayHour);
    const mStr = pad2(parts.minute);
    const sStr = pad2(parts.second);

    // Header badge
    const offsetMins = getUtcOffsetMinutes(now, tz);
    const offsetStr = formatUtcOffset(offsetMins);
    el.headerTzBadge.textContent = `${formatTzCity(tz)} (${offsetStr})`;

    // Location & Offset
    el.clockCityLabel.textContent = getFriendlyTzLabel(state.selectedTz);
    el.clockOffsetLabel.textContent = offsetStr;

    // Digital readout
    el.digHours.textContent = hStr;
    el.digMinutes.textContent = mStr;
    el.digSeconds.textContent = sStr;
    el.digAmpm.textContent = ampm;
    el.digAmpm.classList.toggle('hidden', state.use24h);

    const progressPct = ((parts.second + ms / 1000) / 60) * 100;
    el.minuteProgressBar.style.width = `${progressPct.toFixed(2)}%`;

    // Analog hands (smooth sweep)
    const secAngle = (parts.second + ms / 1000) * 6;
    const minAngle = (parts.minute + parts.second / 60) * 6;
    const hourAngle = ((parts.hour % 12) + parts.minute / 60) * 30;
    el.handHour.setAttribute('transform', `rotate(${hourAngle.toFixed(2)} 150 150)`);
    el.handMinute.setAttribute('transform', `rotate(${minAngle.toFixed(2)} 150 150)`);
    el.handSecond.setAttribute('transform', `rotate(${secAngle.toFixed(2)} 150 150)`);
    el.analogSubDigital.textContent = state.use24h ? `${hStr}:${mStr}` : `${hStr}:${mStr} ${ampm}`;

    // Flip clock
    updateFlipUnit(el.flipHours, hStr, 'h');
    updateFlipUnit(el.flipMinutes, mStr, 'm');
    updateFlipUnit(el.flipSeconds, sStr, 's');
    el.flipAmpm.textContent = ampm;
    el.flipAmpm.classList.toggle('hidden', state.use24h);

    // Date metadata
    try {
      const dateFormatter = new Intl.DateTimeFormat(getLocale(), {
        timeZone: tz,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      el.clockDateFull.textContent = dateFormatter.format(now);
    } catch (_) {
      el.clockDateFull.textContent = now.toLocaleDateString(getLocale(), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    const { weekNo, dayOfYear } = getWeekAndDayOfYear(parts.year, parts.month, parts.day);
    el.clockWeekNum.textContent = t('clock.week', { n: weekNo });
    el.clockDayYear.textContent = t('clock.day', { n: dayOfYear });
    el.clockDiffLocal.textContent = formatDiffFromLocal(now, tz);
  }

  /* ==========================================================================
     4. WORLD CLOCKS
     ========================================================================== */
  function renderWorldClocks() {
    el.miniWorldGrid.innerHTML = '';
    el.worldCardsGrid.innerHTML = '';

    state.worldClocks.forEach((tz, index) => {
      const cityLabel = formatTzCity(tz);
      const fullLabel = getFriendlyTzLabel(tz);

      if (index < 4) {
        const mini = document.createElement('div');
        mini.className = 'mini-world-card';
        mini.dataset.tz = tz;
        mini.title = t('clock.miniWorld.cardTitle');
        mini.innerHTML = `
          <div>
            <div class="mwc-city"><span class="mwc-sky">☀️</span><span>${cityLabel}</span></div>
            <div class="mwc-sub"></div>
          </div>
          <div class="mwc-time">--:--</div>
        `;
        mini.addEventListener('click', () => {
          state.selectedTz = tz;
          el.mainTzSelect.value = tz;
          saveState();
          updateClockFrame();
        });
        el.miniWorldGrid.appendChild(mini);
      }

      const card = document.createElement('div');
      card.className = 'glass-card world-card';
      card.dataset.tz = tz;
      card.innerHTML = `
        <div class="wc-top">
          <div>
            <div class="wc-city"><span class="wc-sky">☀️</span><span>${cityLabel}</span></div>
            <div class="wc-region" data-full="${fullLabel}"></div>
          </div>
          <div class="wc-actions">
            <button class="wc-btn wc-pin-btn" title="${t('world.card.show.title')}">${t('world.card.show')}</button>
            <button class="wc-btn wc-del-btn" title="${t('world.card.remove.title')}">✕</button>
          </div>
        </div>
        <div class="wc-time">--:--</div>
        <div class="wc-bottom">
          <span class="wc-date"></span>
          <span class="wc-diff"></span>
        </div>
      `;

      card.querySelector('.wc-pin-btn').addEventListener('click', () => {
        state.selectedTz = tz;
        el.mainTzSelect.value = tz;
        saveState();
        switchTab('clock');
      });

      card.querySelector('.wc-del-btn').addEventListener('click', () => {
        state.worldClocks = state.worldClocks.filter((z) => z !== tz);
        saveState();
        renderWorldClocks();
      });

      el.worldCardsGrid.appendChild(card);
    });

    updateWorldClocksLive();
  }

  function updateWorldClocksLive() {
    const now = new Date();

    el.miniWorldGrid.querySelectorAll('.mini-world-card').forEach((mini) => {
      const tz = mini.dataset.tz;
      const p = getTzParts(now, tz);
      const skyIcon = p.hour >= 6 && p.hour < 19 ? '☀️' : '🌙';
      let dispH = p.hour;
      if (!state.use24h) dispH = dispH % 12 || 12;
      const offsetStr = formatUtcOffset(getUtcOffsetMinutes(now, tz));

      mini.querySelector('.mwc-sky').textContent = skyIcon;
      mini.querySelector('.mwc-sub').textContent = offsetStr;
      mini.querySelector('.mwc-time').textContent = `${pad2(dispH)}:${pad2(p.minute)}`;
    });

    el.worldCardsGrid.querySelectorAll('.world-card').forEach((card) => {
      const tz = card.dataset.tz;
      const p = getTzParts(now, tz);
      const skyIcon = p.hour >= 6 && p.hour < 19 ? '☀️' : '🌙';
      let dispH = p.hour;
      let suffix = '';
      if (!state.use24h) {
        suffix = dispH >= 12 ? ' PM' : ' AM';
        dispH = dispH % 12 || 12;
      }
      const timeText = `${pad2(dispH)}:${pad2(p.minute)}${state.showSeconds ? ':' + pad2(p.second) : ''}${suffix}`;
      const offsetStr = formatUtcOffset(getUtcOffsetMinutes(now, tz));
      const regionEl = card.querySelector('.wc-region');
      const shortDate = new Intl.DateTimeFormat(getLocale(), {
        timeZone: tz,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(now);

      card.querySelector('.wc-sky').textContent = skyIcon;
      regionEl.textContent = `${regionEl.dataset.full} • ${offsetStr}`;
      card.querySelector('.wc-time').textContent = timeText;
      card.querySelector('.wc-date').textContent = shortDate;
      card.querySelector('.wc-diff').textContent = formatDiffFromLocal(now, tz);
    });
  }

  el.worldAddBtn.addEventListener('click', () => {
    const chosen = el.worldAddSelect.value;
    if (chosen && !state.worldClocks.includes(chosen)) {
      state.worldClocks.push(chosen);
      saveState();
      renderWorldClocks();
    }
  });

  /* ==========================================================================
     5. ALARM NOTIFICATION SYSTEM
     ========================================================================== */
  function triggerAlarmBanner(title, message) {
    window.coolAudio.startAlarmLoop(state.alarmSound);
    el.alarmToastTitle.textContent = title;
    el.alarmToastMsg.textContent = message;
    el.alarmToast.classList.remove('hidden');

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  }

  function dismissAlarmBanner() {
    window.coolAudio.stopAlarmLoop();
    el.alarmToast.classList.add('hidden');
  }

  el.alarmDismissBtn.addEventListener('click', dismissAlarmBanner);

  function requestNotificationPermIfNeeded() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }

  /* ==========================================================================
     6. POMODORO ENGINE
     ========================================================================== */
  const pomo = {
    mode: 'work', // 'work' | 'short' | 'long'
    running: false,
    totalSec: state.pomoConfig.work * 60,
    remainingSec: state.pomoConfig.work * 60,
    endTimestamp: 0,
    completedInCycle: 0, // 0..4
  };

  function getPomoDurationMinutes(mode) {
    if (mode === 'short') return state.pomoConfig.short;
    if (mode === 'long') return state.pomoConfig.long;
    return state.pomoConfig.work;
  }

  function updatePomoPhaseLabel() {
    const keyMap = {
      work: 'pomo.phase.work',
      short: 'pomo.phase.short',
      long: 'pomo.phase.long',
    };
    el.pomoPhaseLabel.textContent = t(keyMap[pomo.mode] || 'pomo.phase.work');
  }

  function setPomoMode(mode, autoStart = false) {
    pomo.mode = mode;
    pomo.running = false;
    const mins = getPomoDurationMinutes(mode);
    pomo.totalSec = mins * 60;
    pomo.remainingSec = pomo.totalSec;

    el.pomoModeBtns.forEach((b) => {
      b.classList.toggle('active', b.dataset.pomoMode === mode);
    });

    updatePomoPhaseLabel();

    renderPomoUI();
    if (autoStart) togglePomoStart();
  }

  function togglePomoStart() {
    window.coolAudio.ensureContext();
    requestNotificationPermIfNeeded();

    if (pomo.running) {
      pomo.remainingSec = Math.max(0, (pomo.endTimestamp - Date.now()) / 1000);
      pomo.running = false;
    } else {
      if (pomo.remainingSec <= 0) {
        pomo.remainingSec = pomo.totalSec;
      }
      pomo.endTimestamp = Date.now() + pomo.remainingSec * 1000;
      pomo.running = true;
    }
    renderPomoUI();
  }

  function resetPomo() {
    pomo.running = false;
    pomo.remainingSec = getPomoDurationMinutes(pomo.mode) * 60;
    pomo.totalSec = pomo.remainingSec;
    renderPomoUI();
  }

  function advancePomoPhase(completedFullSession = false) {
    if (pomo.mode === 'work') {
      if (completedFullSession) {
        pomo.completedInCycle += 1;
        state.pomoStats.sessions += 1;
        state.pomoStats.minutes += state.pomoConfig.work;
        saveState();
        renderPomoStats();
      }
      if (pomo.completedInCycle >= 4) {
        pomo.completedInCycle = 0;
        setPomoMode('long', state.pomoConfig.auto && completedFullSession);
      } else {
        setPomoMode('short', state.pomoConfig.auto && completedFullSession);
      }
    } else {
      setPomoMode('work', state.pomoConfig.auto && completedFullSession);
    }
  }

  function renderPomoStats() {
    el.pomoStatSessions.textContent = String(state.pomoStats.sessions);
    el.pomoStatMinutes.textContent = `${state.pomoStats.minutes} min`;
  }

  function renderPomoTasks() {
    el.pomoTaskList.innerHTML = '';
    if (state.pomoTasks.length === 0) {
      el.pomoTaskList.innerHTML = `<li class="muted-hint">${t('pomo.tasks.empty')}</li>`;
      return;
    }
    state.pomoTasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = `task-item ${task.done ? 'completed' : ''}`;
      li.innerHTML = `
        <label class="task-left">
          <input type="checkbox" ${task.done ? 'checked' : ''} />
          <span></span>
        </label>
        <button class="task-del-btn" title="${t('pomo.tasks.deleteTitle')}">✕</button>
      `;
      li.querySelector('span').textContent = task.text;
      li.querySelector('input').addEventListener('change', (e) => {
        task.done = e.target.checked;
        saveState();
        renderPomoTasks();
      });
      li.querySelector('.task-del-btn').addEventListener('click', () => {
        state.pomoTasks = state.pomoTasks.filter((tItem) => tItem.id !== task.id);
        saveState();
        renderPomoTasks();
      });
      el.pomoTaskList.appendChild(li);
    });
  }

  function renderPomoUI() {
    const formatted = formatDurationSec(pomo.remainingSec);
    el.pomoTimeDisplay.textContent = formatted;
    el.pomoStartLabel.textContent = pomo.running ? t('common.pause') : t('common.start');

    const ratio = pomo.totalSec > 0 ? pomo.remainingSec / pomo.totalSec : 0;
    const offset = RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, ratio)));
    el.pomoRingFill.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
    el.pomoRingFill.style.strokeDashoffset = `${offset}`;

    // Cycle dots (4 cycles)
    let dotsHtml = '';
    for (let i = 0; i < 4; i++) {
      dotsHtml += `<span class="cycle-dot ${i < pomo.completedInCycle ? 'done' : ''}"></span>`;
    }
    el.pomoCycleDots.innerHTML = dotsHtml;

    // Nav pill when running
    el.navPomoPill.textContent = formatted;
    el.navPomoPill.classList.toggle('hidden', !pomo.running);
  }

  el.pomoModeBtns.forEach((btn) => {
    btn.addEventListener('click', () => setPomoMode(btn.dataset.pomoMode, false));
  });
  el.pomoStartBtn.addEventListener('click', togglePomoStart);
  el.pomoResetBtn.addEventListener('click', resetPomo);
  el.pomoSkipBtn.addEventListener('click', () => advancePomoPhase(false));

  // Pomodoro Settings Inputs
  function syncPomoSettingsInputs() {
    el.pomoCfgWork.value = state.pomoConfig.work;
    el.pomoCfgShort.value = state.pomoConfig.short;
    el.pomoCfgLong.value = state.pomoConfig.long;
    el.pomoCfgAuto.checked = state.pomoConfig.auto;
  }

  [el.pomoCfgWork, el.pomoCfgShort, el.pomoCfgLong].forEach((inp) => {
    inp.addEventListener('change', () => {
      state.pomoConfig.work = Math.max(1, Math.min(180, parseInt(el.pomoCfgWork.value, 10) || 25));
      state.pomoConfig.short = Math.max(1, Math.min(60, parseInt(el.pomoCfgShort.value, 10) || 5));
      state.pomoConfig.long = Math.max(1, Math.min(90, parseInt(el.pomoCfgLong.value, 10) || 15));
      saveState();
      if (!pomo.running) {
        setPomoMode(pomo.mode, false);
      }
    });
  });

  el.pomoCfgAuto.addEventListener('change', () => {
    state.pomoConfig.auto = el.pomoCfgAuto.checked;
    saveState();
  });

  el.pomoTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = el.pomoTaskInput.value.trim();
    if (!txt) return;
    state.pomoTasks.push({ id: Date.now(), text: txt, done: false });
    el.pomoTaskInput.value = '';
    saveState();
    renderPomoTasks();
  });

  el.pomoClearDoneBtn.addEventListener('click', () => {
    state.pomoTasks = state.pomoTasks.filter((t) => !t.done);
    saveState();
    renderPomoTasks();
  });

  /* ==========================================================================
     7. MAIN TIMER, INTERACTIVE VISUAL TIMERS & MULTI-TIMERS
     ========================================================================== */
  const mainTimer = {
    state: 'idle', // 'idle' | 'running' | 'paused'
    totalSec: 300,
    remainingSec: 300,
    dragRefSec: 300,
    idleVisualRatio: 1,
    endTimestamp: 0,
  };

  let multiTimers = [];

  function applyTimerVisualMode(mode) {
    state.timerVisualMode = mode || 'candle';
    const isRing = state.timerVisualMode === 'ring';

    el.timerVisualBtns.forEach((b) => {
      b.classList.toggle('active', b.dataset.tmode === state.timerVisualMode);
    });
    if (el.timerStageWrapper) {
      el.timerStageWrapper.setAttribute('data-visual', state.timerVisualMode);
    }
    if (el.interactiveCanvasBox) {
      el.interactiveCanvasBox.classList.toggle('hidden', isRing);
    }
    if (el.timerRingSvg) {
      el.timerRingSvg.classList.toggle('hidden', !isRing);
    }
    if (!isRing && el.interactiveHintText) {
      el.interactiveHintText.textContent = getInteractiveHint(state.timerVisualMode);
    }
    saveState();
  }

  el.timerVisualBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      applyTimerVisualMode(btn.dataset.tmode);
    });
  });

  function readMainTimerInputsSec() {
    const h = Math.max(0, parseInt(el.tInH.value, 10) || 0);
    const m = Math.max(0, parseInt(el.tInM.value, 10) || 0);
    const s = Math.max(0, parseInt(el.tInS.value, 10) || 0);
    return h * 3600 + m * 60 + s;
  }

  function writeMainTimerInputsOnly(totalSec) {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    el.tInH.value = h;
    el.tInM.value = m;
    el.tInS.value = s;
  }

  function setMainTimerInputsFromSec(totalSec) {
    writeMainTimerInputsOnly(totalSec);
    mainTimer.totalSec = totalSec;
    mainTimer.remainingSec = totalSec;
    mainTimer.dragRefSec = Math.max(60, totalSec);
    mainTimer.idleVisualRatio = 1;
    renderMainTimerUI();
  }

  [el.tInH, el.tInM, el.tInS].forEach((inp) => {
    inp.addEventListener('input', () => {
      const sec = readMainTimerInputsSec();
      mainTimer.totalSec = sec;
      mainTimer.remainingSec = sec;
      mainTimer.dragRefSec = Math.max(60, sec);
      mainTimer.idleVisualRatio = 1;
    });
  });

  function toggleMainTimer() {
    window.coolAudio.ensureContext();
    requestNotificationPermIfNeeded();

    if (mainTimer.state === 'idle') {
      const sec = readMainTimerInputsSec();
      if (sec <= 0) return;
      // Preserve visual proportion if user scrubbed the candle/object before starting
      mainTimer.totalSec =
        mainTimer.idleVisualRatio < 0.99 ? Math.max(sec, mainTimer.dragRefSec) : sec;
      mainTimer.remainingSec = sec;
      mainTimer.endTimestamp = Date.now() + sec * 1000;
      mainTimer.state = 'running';
    } else if (mainTimer.state === 'running') {
      mainTimer.remainingSec = Math.max(0, (mainTimer.endTimestamp - Date.now()) / 1000);
      mainTimer.state = 'paused';
    } else if (mainTimer.state === 'paused') {
      mainTimer.endTimestamp = Date.now() + mainTimer.remainingSec * 1000;
      mainTimer.state = 'running';
    }
    renderMainTimerUI();
  }

  function resetMainTimer() {
    mainTimer.state = 'idle';
    mainTimer.idleVisualRatio = 1;
    const sec = readMainTimerInputsSec();
    mainTimer.totalSec = sec;
    mainTimer.remainingSec = sec;
    mainTimer.dragRefSec = Math.max(60, sec);
    renderMainTimerUI();
  }

  function addOneMinuteMainTimer() {
    if (mainTimer.state === 'idle') {
      const next = readMainTimerInputsSec() + 60;
      setMainTimerInputsFromSec(next);
    } else if (mainTimer.state === 'running') {
      mainTimer.totalSec += 60;
      mainTimer.endTimestamp += 60000;
      mainTimer.remainingSec += 60;
      renderMainTimerUI();
    } else {
      mainTimer.totalSec += 60;
      mainTimer.remainingSec += 60;
      renderMainTimerUI();
    }
  }

  function getInteractiveTimerRatio() {
    if (mainTimer.state === 'idle') {
      return mainTimer.idleVisualRatio;
    }
    return mainTimer.totalSec > 0 ? mainTimer.remainingSec / mainTimer.totalSec : 0;
  }

  // Instantiate HTML5 Canvas Interactive Timer Engine
  if (window.InteractiveTimersEngine && el.interactiveCanvas) {
    new window.InteractiveTimersEngine(el.interactiveCanvas, {
      getState: () => ({
        mode: state.timerVisualMode || 'candle',
        ratio: getInteractiveTimerRatio(),
        running: mainTimer.state === 'running',
        totalSec: mainTimer.totalSec,
        remainingSec: mainTimer.remainingSec,
      }),
      onScrubRatio: (newRatio) => {
        if (mainTimer.state === 'idle') {
          mainTimer.idleVisualRatio = newRatio;
          const ref = Math.max(60, mainTimer.dragRefSec);
          const scrubbedSec = Math.max(5, Math.round(ref * newRatio));
          mainTimer.remainingSec = scrubbedSec;
          writeMainTimerInputsOnly(scrubbedSec);
        } else {
          const nextRem = Math.max(1, newRatio * mainTimer.totalSec);
          mainTimer.remainingSec = nextRem;
          if (mainTimer.state === 'running') {
            mainTimer.endTimestamp = Date.now() + nextRem * 1000;
          }
          renderMainTimerUI();
        }
      },
      onTogglePlay: () => {
        toggleMainTimer();
      },
      onFlipHourglass: () => {
        window.coolAudio.ensureContext();
        if (mainTimer.state === 'idle') {
          toggleMainTimer();
        } else {
          const inverted =
            mainTimer.remainingSec < 2 || mainTimer.remainingSec >= mainTimer.totalSec - 1
              ? mainTimer.totalSec
              : mainTimer.totalSec - mainTimer.remainingSec;
          mainTimer.remainingSec = Math.max(1, inverted);
          mainTimer.endTimestamp = Date.now() + mainTimer.remainingSec * 1000;
          mainTimer.state = 'running';
          renderMainTimerUI();
        }
      },
    });
  }

  function renderMainTimerUI() {
    const isIdle = mainTimer.state === 'idle';
    el.timerHmsInputs.classList.toggle('hidden', !isIdle);
    el.mainTimerReadout.classList.toggle('hidden', isIdle);

    const formatted = formatDurationSec(mainTimer.remainingSec);
    el.mainTimerReadout.textContent = formatted;
    el.mainTimerStart.textContent =
      mainTimer.state === 'running'
        ? t('common.pause')
        : mainTimer.state === 'paused'
        ? t('common.resume')
        : t('common.start');

    const ratio = getInteractiveTimerRatio();
    const offset = RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, ratio)));
    el.mainTimerRing.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
    el.mainTimerRing.style.strokeDashoffset = `${offset}`;

    el.navTimerPill.textContent = formatted;
    el.navTimerPill.classList.toggle('hidden', mainTimer.state !== 'running');
  }

  el.alarmSoundSelect.value = state.alarmSound;
  el.alarmSoundSelect.addEventListener('change', () => {
    state.alarmSound = el.alarmSoundSelect.value;
    saveState();
    window.coolAudio.playChimeOnce(state.alarmSound);
  });

  el.testSoundBtn.addEventListener('click', () => {
    window.coolAudio.playChimeOnce(state.alarmSound);
  });

  el.timerPresets.querySelectorAll('.preset-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      mainTimer.state = 'idle';
      setMainTimerInputsFromSec(parseInt(chip.dataset.sec, 10));
    });
  });

  el.mainTimerStart.addEventListener('click', toggleMainTimer);
  el.mainTimerReset.addEventListener('click', resetMainTimer);
  el.mainTimerPlus1.addEventListener('click', addOneMinuteMainTimer);

  // Multi-timers
  el.multiTimerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    window.coolAudio.ensureContext();
    const name = el.mtName.value.trim() || t('timer.multi.defaultName');
    const mins = Math.max(0, parseInt(el.mtMin.value, 10) || 0);
    const secs = Math.max(0, parseInt(el.mtSec.value, 10) || 0);
    const totalSec = mins * 60 + secs;
    if (totalSec <= 0) return;

    multiTimers.push({
      id: Date.now() + Math.random(),
      name,
      totalSec,
      remainingSec: totalSec,
      endTimestamp: Date.now() + totalSec * 1000,
      running: true,
      finished: false,
    });
    el.mtName.value = '';
    renderMultiTimers();
  });

  function renderMultiTimers() {
    el.multiTimersList.innerHTML = '';
    if (multiTimers.length === 0) {
      el.multiTimersList.innerHTML = `<div class="muted-hint">${t('timer.multi.empty')}</div>`;
      return;
    }

    multiTimers.forEach((mt) => {
      const row = document.createElement('div');
      row.className = `mt-item ${mt.finished ? 'finished' : ''}`;
      row.dataset.id = String(mt.id);
      row.innerHTML = `
        <div class="mt-info">
          <strong></strong>
          <span class="mt-time">${mt.finished ? t('timer.multi.done') : formatDurationSec(mt.remainingSec)}</span>
        </div>
        <div class="mt-actions">
          ${!mt.finished ? `<button class="ghost-sm-btn mt-toggle">${mt.running ? t('common.pause') : t('common.resume')}</button>` : ''}
          <button class="ghost-sm-btn mt-remove">✕</button>
        </div>
      `;
      row.querySelector('strong').textContent = mt.name;

      const toggleBtn = row.querySelector('.mt-toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          if (mt.running) {
            mt.remainingSec = Math.max(0, (mt.endTimestamp - Date.now()) / 1000);
            mt.running = false;
          } else {
            mt.endTimestamp = Date.now() + mt.remainingSec * 1000;
            mt.running = true;
          }
          renderMultiTimers();
        });
      }

      row.querySelector('.mt-remove').addEventListener('click', () => {
        multiTimers = multiTimers.filter((item) => item.id !== mt.id);
        renderMultiTimers();
      });

      el.multiTimersList.appendChild(row);
    });
  }

  function updateMultiTimersLive() {
    el.multiTimersList.querySelectorAll('.mt-item').forEach((row) => {
      const mt = multiTimers.find((item) => String(item.id) === row.dataset.id);
      if (mt && !mt.finished) {
        const span = row.querySelector('.mt-time');
        if (span) span.textContent = formatDurationSec(mt.remainingSec);
      }
    });
  }

  /* ==========================================================================
     8. STOPWATCH ENGINE
     ========================================================================== */
  const sw = {
    running: false,
    startTime: 0,
    elapsedBefore: 0,
    laps: [], // { num, lapMs, totalMs }
  };

  function getSwElapsedMs() {
    if (!sw.running) return sw.elapsedBefore;
    return sw.elapsedBefore + (performance.now() - sw.startTime);
  }

  function toggleStopwatch() {
    if (sw.running) {
      sw.elapsedBefore += performance.now() - sw.startTime;
      sw.running = false;
    } else {
      sw.startTime = performance.now();
      sw.running = true;
    }
    updateStopwatchButtons();
  }

  function resetStopwatch() {
    sw.running = false;
    sw.startTime = 0;
    sw.elapsedBefore = 0;
    sw.laps = [];
    updateStopwatchButtons();
    updateStopwatchFrame();
    renderStopwatchLaps();
  }

  function recordStopwatchLap() {
    if (!sw.running) return;
    const totalMs = getSwElapsedMs();
    const prevTotal = sw.laps.length > 0 ? sw.laps[0].totalMs : 0;
    const lapMs = totalMs - prevTotal;
    sw.laps.unshift({
      num: sw.laps.length + 1,
      lapMs,
      totalMs,
    });
    renderStopwatchLaps();
  }

  function updateStopwatchButtons() {
    const total = getSwElapsedMs();
    el.swStartBtn.textContent = sw.running
      ? t('common.pause')
      : total > 0
      ? t('common.resume')
      : t('common.start');
    el.swLapBtn.disabled = !sw.running;
    el.swResetBtn.disabled = sw.running || total === 0;
    el.swCopyLapsBtn.disabled = sw.laps.length === 0;
    el.navSwPill.classList.toggle('hidden', !sw.running);
  }

  function updateStopwatchFrame() {
    const totalMs = getSwElapsedMs();
    const fmt = formatStopwatchMs(totalMs);
    el.swMainTime.textContent = fmt.main;
    el.swCentis.textContent = fmt.cs;

    const prevTotal = sw.laps.length > 0 ? sw.laps[0].totalMs : 0;
    const currentLapFmt = formatStopwatchMs(totalMs - prevTotal);
    el.swCurrentLap.textContent = t('sw.currentLap', { time: currentLapFmt.short });

    if (sw.running) {
      el.navSwPill.textContent = fmt.main.slice(3); // MM:SS
    }
  }

  function renderStopwatchLaps() {
    el.swLapCount.textContent = String(sw.laps.length);
    el.swCopyLapsBtn.disabled = sw.laps.length === 0;

    if (sw.laps.length === 0) {
      el.swLapsBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="3">${t('sw.laps.empty')}</td>
        </tr>
      `;
      return;
    }

    let minLap = Infinity;
    let maxLap = -Infinity;
    if (sw.laps.length >= 2) {
      sw.laps.forEach((l) => {
        if (l.lapMs < minLap) minLap = l.lapMs;
        if (l.lapMs > maxLap) maxLap = l.lapMs;
      });
    }

    el.swLapsBody.innerHTML = '';
    sw.laps.forEach((l) => {
      const tr = document.createElement('tr');
      if (sw.laps.length >= 2) {
        if (l.lapMs === minLap) tr.classList.add('lap-best');
        else if (l.lapMs === maxLap) tr.classList.add('lap-worst');
      }
      const badge =
        sw.laps.length >= 2 && l.lapMs === minLap
          ? ' ⚡'
          : sw.laps.length >= 2 && l.lapMs === maxLap
          ? ' 🐢'
          : '';
      tr.innerHTML = `
        <td>#${pad2(l.num)}${badge}</td>
        <td>${formatStopwatchMs(l.lapMs).short}</td>
        <td>${formatStopwatchMs(l.totalMs).short}</td>
      `;
      el.swLapsBody.appendChild(tr);
    });
  }

  el.swStartBtn.addEventListener('click', toggleStopwatch);
  el.swResetBtn.addEventListener('click', resetStopwatch);
  el.swLapBtn.addEventListener('click', recordStopwatchLap);

  el.swCopyLapsBtn.addEventListener('click', () => {
    const lines = sw.laps
      .slice()
      .reverse()
      .map((l) =>
        t('sw.laps.copyLine', {
          num: l.num,
          lap: formatStopwatchMs(l.lapMs).short,
          total: formatStopwatchMs(l.totalMs).short,
        })
      )
      .join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      el.swCopyLapsBtn.textContent = t('sw.laps.copied');
      setTimeout(() => {
        el.swCopyLapsBtn.textContent = t('sw.laps.copy');
      }, 1500);
    });
  });

  /* ==========================================================================
     9. IMMERSIVE FOCUS MODE & GUIDED BREATHING
     ========================================================================== */
  const focus = {
    open: false,
    view: 'pomodoro', // 'pomodoro' | 'clock' | 'timer'
    breathing: false,
    breathInhale: true,
    breathTimer: null,
  };

  function toggleFocusMode(forceState) {
    focus.open = typeof forceState === 'boolean' ? forceState : !focus.open;
    el.focusOverlay.classList.toggle('hidden', !focus.open);
    if (!focus.open) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } else {
      updateFocusReadout();
    }
  }

  function setFocusView(v) {
    focus.view = v;
    el.focusSourceBtns.forEach((b) => {
      b.classList.toggle('active', b.dataset.focusView === v);
    });
    el.focusActionWrap.classList.toggle('hidden', v === 'clock');
    updateFocusReadout();
  }

  function updateFocusReadout() {
    if (!focus.open) return;

    if (focus.view === 'pomodoro') {
      el.focusGiantReadout.textContent = formatDurationSec(pomo.remainingSec);
      el.focusSubStatus.textContent =
        pomo.mode === 'work' ? t('focus.sub.pomoWork') : t('focus.sub.pomoBreak');
      el.focusPrimaryBtn.textContent = pomo.running ? t('common.pause') : t('common.start');
    } else if (focus.view === 'timer') {
      el.focusGiantReadout.textContent = formatDurationSec(mainTimer.remainingSec);
      const customTitle = el.mainTimerTitle.value.trim();
      el.focusSubStatus.textContent = customTitle || t('focus.sub.timerDefault');
      el.focusPrimaryBtn.textContent =
        mainTimer.state === 'running' ? t('common.pause') : t('common.start');
    } else {
      const now = new Date();
      const tz = getEffectiveMainTz();
      const p = getTzParts(now, tz);
      let h = p.hour;
      if (!state.use24h) h = h % 12 || 12;
      el.focusGiantReadout.textContent = state.showSeconds
        ? `${pad2(h)}:${pad2(p.minute)}:${pad2(p.second)}`
        : `${pad2(h)}:${pad2(p.minute)}`;
      el.focusSubStatus.textContent = getFriendlyTzLabel(state.selectedTz);
    }
  }

  el.focusToggleBtn.addEventListener('click', () => toggleFocusMode(true));
  el.focusCloseBtn.addEventListener('click', () => toggleFocusMode(false));

  el.focusSourceBtns.forEach((btn) => {
    btn.addEventListener('click', () => setFocusView(btn.dataset.focusView));
  });

  el.focusPrimaryBtn.addEventListener('click', () => {
    if (focus.view === 'pomodoro') togglePomoStart();
    else if (focus.view === 'timer') toggleMainTimer();
    updateFocusReadout();
  });

  el.focusResetBtn.addEventListener('click', () => {
    if (focus.view === 'pomodoro') resetPomo();
    else if (focus.view === 'timer') resetMainTimer();
    updateFocusReadout();
  });

  el.focusFullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  el.focusIntentionInput.value = state.focusIntention || '';
  el.focusIntentionInput.addEventListener('input', () => {
    state.focusIntention = el.focusIntentionInput.value;
    saveState();
  });

  function syncBreathingUI() {
    el.toggleBreathBtn.classList.toggle('active', focus.breathing);
    el.toggleBreathBtn.textContent = focus.breathing
      ? t('focus.breath.on')
      : t('focus.breath.off');
    el.breathVisualizer.classList.toggle('hidden', !focus.breathing);
    if (focus.breathing) {
      el.breathText.textContent = focus.breathInhale
        ? t('focus.breath.inhale')
        : t('focus.breath.exhale');
    }
  }

  // Guided cardiac coherence breathing (5s inhale / 5s exhale)
  el.toggleBreathBtn.addEventListener('click', () => {
    focus.breathing = !focus.breathing;
    if (focus.breathTimer) {
      clearInterval(focus.breathTimer);
      focus.breathTimer = null;
    }
    if (focus.breathing) {
      focus.breathInhale = true;
      syncBreathingUI();
      focus.breathTimer = setInterval(() => {
        focus.breathInhale = !focus.breathInhale;
        el.breathText.textContent = focus.breathInhale
          ? t('focus.breath.inhale')
          : t('focus.breath.exhale');
      }, 5000);
    } else {
      syncBreathingUI();
    }
  });

  // Ambient Soundscape Quick-Mixer Controls (Focus Mode Dock)
  el.ambientSoundBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const sound = btn.dataset.sound;
      if (sound === 'none') {
        window.coolAudio.stopAllChannels();
      } else {
        window.coolAudio.toggleChannel(sound);
      }
    });
  });

  function setMasterAmbientVolumePct(pct) {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    state.ambientVolume = clamped;
    if (el.ambientVolume) el.ambientVolume.value = String(clamped);
    if (audioEl.masterSlider) audioEl.masterSlider.value = String(clamped);
    if (audioEl.masterPct) audioEl.masterPct.textContent = `${clamped}%`;
    window.coolAudio.setVolume(clamped / 100);
    saveState();
  }

  el.ambientVolume.addEventListener('input', () => {
    setMasterAmbientVolumePct(parseInt(el.ambientVolume.value, 10) || 0);
  });

  /* ==========================================================================
     9B. MULTI-MODE FULLSCREEN STUDIO (6 VISUAL MODES + AUTO-HIDE HUD)
     ========================================================================== */
  const fsEl = {
    mainClockStage: document.getElementById('main-clock-stage'),
    launchBtns: document.querySelectorAll('[data-fs-launch]'),
    studio: document.getElementById('fullscreen-studio'),
    hudTop: document.getElementById('fs-hud-top'),
    hudBottom: document.getElementById('fs-hud-bottom'),
    srcBtns: document.querySelectorAll('#fs-source-tabs .seg-btn'),
    modeBtns: document.querySelectorAll('#fs-mode-tabs .seg-btn'),

    viewGiant: document.getElementById('fs-view-giant'),
    giantEyebrow: document.getElementById('fs-giant-eyebrow'),
    giantDigits: document.getElementById('fs-giant-digits'),
    giantProgressWrap: document.getElementById('fs-giant-progress-wrap'),
    giantProgress: document.getElementById('fs-giant-progress'),
    giantSubline: document.getElementById('fs-giant-subline'),

    viewFlip: document.getElementById('fs-view-flip'),
    flipEyebrow: document.getElementById('fs-flip-eyebrow'),
    flipBox1: document.getElementById('fs-flip-box-1'),
    flipBox2: document.getElementById('fs-flip-box-2'),
    flipBox3: document.getElementById('fs-flip-box-3'),
    flipSubline: document.getElementById('fs-flip-subline'),

    viewCinema: document.getElementById('fs-view-cinema'),
    cinemaModeBtns: document.querySelectorAll('#fs-cinema-modes .cat-pill'),
    cinemaCanvas: document.getElementById('fs-interactive-canvas'),
    cinemaDigits: document.getElementById('fs-cinema-digits'),
    cinemaHint: document.getElementById('fs-cinema-hint'),

    viewAnalog: document.getElementById('fs-view-analog'),
    analogTicks: document.getElementById('fs-analog-ticks'),
    analogNumbers: document.getElementById('fs-analog-numbers'),
    handHour: document.getElementById('fs-hand-hour'),
    handMinute: document.getElementById('fs-hand-minute'),
    handSecond: document.getElementById('fs-hand-second'),
    analogTz: document.getElementById('fs-analog-tz'),
    analogDigital: document.getElementById('fs-analog-digital'),
    analogDate: document.getElementById('fs-analog-date'),

    viewWorld: document.getElementById('fs-view-world'),
    worldMainCity: document.getElementById('fs-world-main-city'),
    worldMainTime: document.getElementById('fs-world-main-time'),
    worldWallGrid: document.getElementById('fs-world-wall-grid'),

    viewOled: document.getElementById('fs-view-oled'),
    oledFloater: document.getElementById('fs-oled-floater'),
    oledTime: document.getElementById('fs-oled-time'),
    oledSub: document.getElementById('fs-oled-sub'),

    playbackGroup: document.getElementById('fs-playback-group'),
    playBtn: document.getElementById('fs-play-btn'),
    resetBtn: document.getElementById('fs-reset-btn'),
    extraBtn: document.getElementById('fs-extra-btn'),
    brightnessRange: document.getElementById('fs-brightness-range'),
    themeCycleBtn: document.getElementById('fs-theme-cycle-btn'),
    nativeToggleBtn: document.getElementById('fs-native-toggle-btn'),
    closeBtn: document.getElementById('fs-close-btn'),
  };

  const fs = {
    open: false,
    source: 'clock', // 'clock' | 'pomodoro' | 'timer' | 'stopwatch' | 'world'
    mode: 'giant', // 'giant' | 'flip-saver' | 'cinema' | 'analog-lounge' | 'world-wall' | 'oled'
    cinemaObject: 'candle',
    idleTimer: null,
    prevFlip: { c1: '', c2: '', c3: '' },
    lastWorldRenderSec: -1,
    lastOledDriftSec: -1,
  };

  function buildFsAnalogDial() {
    if (!fsEl.analogTicks || !el.analogTicks) return;
    fsEl.analogTicks.innerHTML = el.analogTicks.innerHTML;
    fsEl.analogNumbers.innerHTML = el.analogNumbers.innerHTML;
  }

  function wakeFsHud() {
    if (!fs.open || !fsEl.studio) return;
    fsEl.studio.classList.remove('fs-idle');
    if (fs.idleTimer) clearTimeout(fs.idleTimer);
    fs.idleTimer = setTimeout(() => {
      if (!fs.open) return;
      if (fsEl.hudTop.matches(':hover') || fsEl.hudBottom.matches(':hover')) return;
      fsEl.studio.classList.add('fs-idle');
    }, 3200);
  }

  function openFullscreenStudio(sourceHint) {
    const validSources = ['clock', 'pomodoro', 'timer', 'stopwatch', 'world'];
    const rawSrc = sourceHint || state.activeTab || 'clock';
    const src = validSources.includes(rawSrc) ? rawSrc : 'clock';
    fs.source = src;

    // Pick smart initial fullscreen mode based on context
    if (src === 'world') {
      fs.mode = 'world-wall';
    } else if (src === 'timer' && state.timerVisualMode && state.timerVisualMode !== 'ring') {
      fs.mode = 'cinema';
      fs.cinemaObject = state.timerVisualMode;
    } else if (src === 'clock' && state.clockStyle === 'flip') {
      fs.mode = 'flip-saver';
    } else if (src === 'clock' && state.clockStyle === 'analog') {
      fs.mode = 'analog-lounge';
    } else if (fs.mode === 'world-wall' && src !== 'world') {
      fs.mode = 'giant';
    }

    fs.open = true;
    fs.lastWorldRenderSec = -1;
    fsEl.studio.classList.remove('hidden');
    syncFsControlsUI();
    updateFullscreenStudioFrame();
    wakeFsHud();

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function closeFullscreenStudio() {
    fs.open = false;
    if (fs.idleTimer) clearTimeout(fs.idleTimer);
    fsEl.studio.classList.add('hidden');
    fsEl.studio.classList.remove('fs-idle');
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function syncFsControlsUI() {
    fsEl.studio.setAttribute('data-fs-mode', fs.mode);

    fsEl.srcBtns.forEach((b) => {
      b.classList.toggle('active', b.dataset.fsSrc === fs.source);
    });
    fsEl.modeBtns.forEach((b) => {
      b.classList.toggle('active', b.dataset.fsMode === fs.mode);
    });
    fsEl.cinemaModeBtns.forEach((b) => {
      b.classList.toggle('active', b.dataset.fsTmode === fs.cinemaObject);
    });

    fsEl.viewGiant.classList.toggle('hidden', fs.mode !== 'giant');
    fsEl.viewFlip.classList.toggle('hidden', fs.mode !== 'flip-saver');
    fsEl.viewCinema.classList.toggle('hidden', fs.mode !== 'cinema');
    fsEl.viewAnalog.classList.toggle('hidden', fs.mode !== 'analog-lounge');
    fsEl.viewWorld.classList.toggle('hidden', fs.mode !== 'world-wall');
    fsEl.viewOled.classList.toggle('hidden', fs.mode !== 'oled');

    const hasPlayback = fs.source === 'pomodoro' || fs.source === 'timer' || fs.source === 'stopwatch';
    fsEl.playbackGroup.classList.toggle('hidden', !hasPlayback);

    if (fs.source === 'timer') {
      fsEl.extraBtn.textContent = '+1 min';
      fsEl.extraBtn.classList.remove('hidden');
    } else if (fs.source === 'stopwatch') {
      fsEl.extraBtn.textContent = t('sw.lap');
      fsEl.extraBtn.classList.remove('hidden');
    } else if (fs.source === 'pomodoro') {
      fsEl.extraBtn.textContent = t('fs.extra.next');
      fsEl.extraBtn.classList.remove('hidden');
    } else {
      fsEl.extraBtn.classList.add('hidden');
    }
  }

  function getActiveFsReadoutData(now) {
    const tz = getEffectiveMainTz();
    const parts = getTzParts(now, tz);
    const ms = now.getMilliseconds();

    if (fs.source === 'pomodoro') {
      const rem = pomo.remainingSec;
      const m = Math.floor(Math.ceil(rem) / 60);
      const s = Math.ceil(rem) % 60;
      const pct = pomo.totalSec > 0 ? ((pomo.totalSec - rem) / pomo.totalSec) * 100 : 0;
      return {
        eyebrow: pomo.mode === 'work' ? t('fs.readout.pomoWork') : t('fs.readout.pomoBreak'),
        mainText: formatDurationSec(rem),
        shortText: `${pad2(m)}:${pad2(s)}`,
        subline: t('fs.readout.pomoSub', {
          cycle: (pomo.completedInCycle % 4) + 1,
          sessions: state.pomoStats.sessions,
        }),
        progressPct: pct,
        showProgress: true,
        flip: [pad2(m), pad2(s), null],
        isRunning: pomo.running,
      };
    }

    if (fs.source === 'timer') {
      const rem = mainTimer.remainingSec;
      const secCeil = Math.max(0, Math.ceil(rem));
      const h = Math.floor(secCeil / 3600);
      const m = Math.floor((secCeil % 3600) / 60);
      const s = secCeil % 60;
      const ratio = getInteractiveTimerRatio();
      const customLabel = el.mainTimerTitle.value.trim() || t('fs.readout.timerDefault');
      return {
        eyebrow: customLabel,
        mainText: formatDurationSec(rem),
        shortText: formatDurationSec(rem),
        subline:
          mainTimer.state === 'running'
            ? t('fs.readout.timerRunning')
            : t('fs.readout.timerPaused'),
        progressPct: (1 - ratio) * 100,
        showProgress: true,
        flip: h > 0 ? [pad2(h), pad2(m), pad2(s)] : [pad2(m), pad2(s), null],
        isRunning: mainTimer.state === 'running',
      };
    }

    if (fs.source === 'stopwatch') {
      const totalMs = getSwElapsedMs();
      const fmt = formatStopwatchMs(totalMs);
      const totalSec = Math.floor(totalMs / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor(totalSec / 60) % 60;
      const s = totalSec % 60;
      const cs = Math.floor((totalMs % 1000) / 10);
      return {
        eyebrow: t('fs.readout.swEyebrow'),
        mainText: `${fmt.main}${fmt.cs}`,
        shortText: fmt.main,
        subline:
          sw.laps.length > 0
            ? t('fs.readout.swLaps', { n: sw.laps.length })
            : t('fs.readout.swReady'),
        progressPct: ((totalMs % 60000) / 60000) * 100,
        showProgress: true,
        flip: h > 0 ? [pad2(h), pad2(m), pad2(s)] : [pad2(m), pad2(s), pad2(cs)],
        isRunning: sw.running,
      };
    }

    // Default: 'clock' or 'world'
    let dispH = parts.hour;
    let suffix = '';
    if (!state.use24h) {
      suffix = dispH >= 12 ? ' PM' : ' AM';
      dispH = dispH % 12 || 12;
    }
    const hStr = pad2(dispH);
    const mStr = pad2(parts.minute);
    const sStr = pad2(parts.second);
    const dateStr = new Intl.DateTimeFormat(getLocale(), {
      timeZone: tz,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);

    return {
      eyebrow: `${getFriendlyTzLabel(state.selectedTz)} (${formatUtcOffset(getUtcOffsetMinutes(now, tz))})`,
      mainText: state.showSeconds ? `${hStr}:${mStr}:${sStr}${suffix}` : `${hStr}:${mStr}${suffix}`,
      shortText: `${hStr}:${mStr}`,
      subline: dateStr,
      progressPct: ((parts.second + ms / 1000) / 60) * 100,
      showProgress: true,
      flip: [hStr, mStr, state.showSeconds ? sStr : null],
      isRunning: true,
    };
  }

  function updateFsFlipBox(boxEl, val, key) {
    if (val === null) {
      boxEl.classList.add('hidden');
      return;
    }
    boxEl.classList.remove('hidden');
    if (fs.prevFlip[key] !== val) {
      fs.prevFlip[key] = val;
      boxEl.querySelector('.fs-flip-val').textContent = val;
      boxEl.classList.remove('flip-animate');
      void boxEl.offsetWidth;
      boxEl.classList.add('flip-animate');
    }
  }

  function updateFullscreenStudioFrame() {
    if (!fs.open) return;
    const now = new Date();
    const data = getActiveFsReadoutData(now);

    // Update bottom playback button label
    if (fs.source === 'pomodoro') {
      fsEl.playBtn.textContent = pomo.running ? t('common.pause') : t('common.start');
    } else if (fs.source === 'timer') {
      fsEl.playBtn.textContent =
        mainTimer.state === 'running' ? t('common.pause') : t('common.start');
    } else if (fs.source === 'stopwatch') {
      fsEl.playBtn.textContent = sw.running ? t('common.pause') : t('common.start');
    }

    if (fs.mode === 'giant') {
      fsEl.giantEyebrow.textContent = data.eyebrow;
      fsEl.giantDigits.textContent = data.mainText;
      fsEl.giantSubline.textContent = data.subline;
      fsEl.giantProgressWrap.classList.toggle('hidden', !data.showProgress);
      fsEl.giantProgress.style.width = `${Math.max(0, Math.min(100, data.progressPct)).toFixed(1)}%`;
    } else if (fs.mode === 'flip-saver') {
      fsEl.flipEyebrow.textContent = data.eyebrow;
      updateFsFlipBox(fsEl.flipBox1, data.flip[0], 'c1');
      updateFsFlipBox(fsEl.flipBox2, data.flip[1], 'c2');
      updateFsFlipBox(fsEl.flipBox3, data.flip[2], 'c3');
      fsEl.flipSubline.textContent = data.subline;
    } else if (fs.mode === 'cinema') {
      const usingPomo = fs.source === 'pomodoro';
      fsEl.cinemaDigits.textContent = usingPomo
        ? formatDurationSec(pomo.remainingSec)
        : formatDurationSec(mainTimer.remainingSec);
      fsEl.cinemaHint.textContent = getInteractiveHint(fs.cinemaObject);
    } else if (fs.mode === 'analog-lounge') {
      const tz = getEffectiveMainTz();
      const p = getTzParts(now, tz);
      const ms = now.getMilliseconds();
      const secAngle = (p.second + ms / 1000) * 6;
      const minAngle = (p.minute + p.second / 60) * 6;
      const hourAngle = ((p.hour % 12) + p.minute / 60) * 30;
      fsEl.handHour.setAttribute('transform', `rotate(${hourAngle.toFixed(2)} 150 150)`);
      fsEl.handMinute.setAttribute('transform', `rotate(${minAngle.toFixed(2)} 150 150)`);
      fsEl.handSecond.setAttribute('transform', `rotate(${secAngle.toFixed(2)} 150 150)`);
      fsEl.analogTz.textContent = data.eyebrow;
      fsEl.analogDigital.textContent = data.mainText;
      fsEl.analogDate.textContent = data.subline;
    } else if (fs.mode === 'world-wall') {
      const tz = getEffectiveMainTz();
      const p = getTzParts(now, tz);
      fsEl.worldMainCity.textContent = getFriendlyTzLabel(state.selectedTz);
      fsEl.worldMainTime.textContent = `${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`;

      if (fs.lastWorldRenderSec !== p.second) {
        fs.lastWorldRenderSec = p.second;
        fsEl.worldWallGrid.innerHTML = '';
        state.worldClocks.forEach((wtz) => {
          const wp = getTzParts(now, wtz);
          const sky = wp.hour >= 6 && wp.hour < 19 ? '☀️' : '🌙';
          const offset = formatUtcOffset(getUtcOffsetMinutes(now, wtz));
          const card = document.createElement('div');
          card.className = 'fs-wall-card';
          card.innerHTML = `
            <div class="fs-wall-city"><span>${formatTzCity(wtz)}</span><span>${sky}</span></div>
            <div class="fs-wall-time">${pad2(wp.hour)}:${pad2(wp.minute)}:${pad2(wp.second)}</div>
            <div class="fs-wall-sub">${offset} • ${formatDiffFromLocal(now, wtz)}</div>
          `;
          fsEl.worldWallGrid.appendChild(card);
        });
      }
    } else if (fs.mode === 'oled') {
      fsEl.oledTime.textContent =
        fs.source === 'clock' ? data.shortText : data.mainText;
      fsEl.oledSub.textContent = t('fs.oled.sub', { eyebrow: data.eyebrow });

      const secNow = Math.floor(now.getTime() / 4000);
      if (fs.lastOledDriftSec !== secNow) {
        fs.lastOledDriftSec = secNow;
        const dx = Math.sin(secNow * 0.7) * 55;
        const dy = Math.cos(secNow * 0.5) * 38;
        fsEl.oledFloater.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      }
    }
  }

  // Instantiate Cinema Fullscreen Interactive Canvas Engine (460x380 Retina)
  if (window.InteractiveTimersEngine && fsEl.cinemaCanvas) {
    new window.InteractiveTimersEngine(
      fsEl.cinemaCanvas,
      {
        getState: () => {
          if (!fs.open || fs.mode !== 'cinema') {
            return { mode: 'ring', ratio: 1, running: false, totalSec: 300, remainingSec: 300 };
          }
          if (fs.source === 'pomodoro') {
            return {
              mode: fs.cinemaObject || 'candle',
              ratio: pomo.totalSec > 0 ? pomo.remainingSec / pomo.totalSec : 1,
              running: pomo.running,
              totalSec: pomo.totalSec,
              remainingSec: pomo.remainingSec,
            };
          }
          return {
            mode: fs.cinemaObject || 'candle',
            ratio: getInteractiveTimerRatio(),
            running: mainTimer.state === 'running',
            totalSec: mainTimer.totalSec,
            remainingSec: mainTimer.remainingSec,
          };
        },
        onScrubRatio: (newRatio) => {
          wakeFsHud();
          if (fs.source === 'pomodoro') {
            pomo.remainingSec = Math.max(1, newRatio * pomo.totalSec);
            if (pomo.running) {
              pomo.endTimestamp = Date.now() + pomo.remainingSec * 1000;
            }
            renderPomoUI();
          } else {
            if (mainTimer.state === 'idle') {
              mainTimer.idleVisualRatio = newRatio;
              const ref = Math.max(60, mainTimer.dragRefSec);
              const scrubbedSec = Math.max(5, Math.round(ref * newRatio));
              mainTimer.remainingSec = scrubbedSec;
              writeMainTimerInputsOnly(scrubbedSec);
            } else {
              const nextRem = Math.max(1, newRatio * mainTimer.totalSec);
              mainTimer.remainingSec = nextRem;
              if (mainTimer.state === 'running') {
                mainTimer.endTimestamp = Date.now() + nextRem * 1000;
              }
              renderMainTimerUI();
            }
          }
        },
        onTogglePlay: () => {
          wakeFsHud();
          if (fs.source === 'pomodoro') togglePomoStart();
          else toggleMainTimer();
        },
        onFlipHourglass: () => {
          wakeFsHud();
          if (fs.source === 'pomodoro') {
            pomo.remainingSec = Math.max(1, pomo.totalSec - pomo.remainingSec);
            pomo.endTimestamp = Date.now() + pomo.remainingSec * 1000;
            pomo.running = true;
            renderPomoUI();
          } else {
            if (mainTimer.state === 'idle') {
              toggleMainTimer();
            } else {
              const inverted =
                mainTimer.remainingSec < 2 || mainTimer.remainingSec >= mainTimer.totalSec - 1
                  ? mainTimer.totalSec
                  : mainTimer.totalSec - mainTimer.remainingSec;
              mainTimer.remainingSec = Math.max(1, inverted);
              mainTimer.endTimestamp = Date.now() + mainTimer.remainingSec * 1000;
              mainTimer.state = 'running';
              renderMainTimerUI();
            }
          }
        },
      },
      { displayWidth: 460, displayHeight: 380 }
    );
  }

  // Event listeners for Fullscreen Studio
  if (fsEl.mainClockStage) {
    fsEl.mainClockStage.addEventListener('dblclick', () => openFullscreenStudio('clock'));
  }
  fsEl.launchBtns.forEach((btn) => {
    btn.addEventListener('click', () => openFullscreenStudio(btn.dataset.fsLaunch));
  });
  fsEl.closeBtn.addEventListener('click', closeFullscreenStudio);

  ['mousemove', 'mousedown', 'touchstart', 'keydown'].forEach((evt) => {
    fsEl.studio.addEventListener(evt, wakeFsHud, { passive: true });
  });

  fsEl.srcBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      fs.source = btn.dataset.fsSrc;
      if (fs.source === 'world') fs.mode = 'world-wall';
      else if (fs.mode === 'world-wall') fs.mode = 'giant';
      syncFsControlsUI();
      updateFullscreenStudioFrame();
    });
  });

  fsEl.modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      fs.mode = btn.dataset.fsMode;
      if (fs.mode === 'cinema' && fs.source !== 'timer' && fs.source !== 'pomodoro') {
        fs.source = 'timer';
      }
      if (fs.mode === 'world-wall') {
        fs.source = 'world';
      }
      syncFsControlsUI();
      updateFullscreenStudioFrame();
    });
  });

  fsEl.cinemaModeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      fs.cinemaObject = btn.dataset.fsTmode;
      applyTimerVisualMode(fs.cinemaObject);
      syncFsControlsUI();
    });
  });

  fsEl.playBtn.addEventListener('click', () => {
    if (fs.source === 'pomodoro') togglePomoStart();
    else if (fs.source === 'timer') toggleMainTimer();
    else if (fs.source === 'stopwatch') toggleStopwatch();
    updateFullscreenStudioFrame();
  });

  fsEl.resetBtn.addEventListener('click', () => {
    if (fs.source === 'pomodoro') resetPomo();
    else if (fs.source === 'timer') resetMainTimer();
    else if (fs.source === 'stopwatch') resetStopwatch();
    updateFullscreenStudioFrame();
  });

  fsEl.extraBtn.addEventListener('click', () => {
    if (fs.source === 'timer') addOneMinuteMainTimer();
    else if (fs.source === 'stopwatch') recordStopwatchLap();
    else if (fs.source === 'pomodoro') advancePomoPhase(false);
    updateFullscreenStudioFrame();
  });

  fsEl.brightnessRange.addEventListener('input', () => {
    const val = parseInt(fsEl.brightnessRange.value, 10) / 100;
    fsEl.studio.style.setProperty('--fs-brightness', String(val));
  });

  fsEl.themeCycleBtn.addEventListener('click', cycleTheme);

  fsEl.nativeToggleBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  /* ==========================================================================
     9C. HI-FI AUDIO MIXER (12 SOUNDS) & STREAMING (SPOTIFY / APPLE MUSIC / DEEZER)
     ========================================================================== */
  const SOUND_CATALOG = [
    { id: 'rain', icon: '🌧️', defaultVol: 0.72 },
    { id: 'thunder', icon: '⛈️', defaultVol: 0.65 },
    { id: 'fire', icon: '🔥', defaultVol: 0.75 },
    { id: 'waves', icon: '🌊', defaultVol: 0.70 },
    { id: 'forest', icon: '🌲', defaultVol: 0.68 },
    { id: 'stream', icon: '💧', defaultVol: 0.68 },
    { id: 'night', icon: '🦗', defaultVol: 0.60 },
    { id: 'cafe', icon: '☕', defaultVol: 0.62 },
    { id: 'train', icon: '🚂', defaultVol: 0.65 },
    { id: 'zen', icon: '🥣', defaultVol: 0.65 },
    { id: 'pink', icon: '🩷', defaultVol: 0.55 },
    { id: 'brown', icon: '🪵', defaultVol: 0.65 },
  ];

  const SOUND_PRESETS = {
    stormCabin: { rain: 0.72, thunder: 0.58, fire: 0.78 },
    forestRetreat: { forest: 0.75, stream: 0.65 },
    starryBeach: { waves: 0.75, night: 0.48 },
    rainyCafe: { cafe: 0.68, rain: 0.55 },
    zenSanctuary: { zen: 0.72, stream: 0.42, brown: 0.30 },
  };

  const STREAM_SERVICES = {
    spotify: 'Spotify',
    apple: 'Apple Music',
    deezer: 'Deezer',
    radio: 'SomaFM',
  };

  const STREAM_LOGIN_URLS = {
    spotify: 'https://accounts.spotify.com/login?continue=https%3A%2F%2Fopen.spotify.com',
    apple: 'https://music.apple.com',
    deezer: 'https://www.deezer.com/login',
  };

  // Official SomaFM Direct Public Streams (MP3 & AAC — Non-Commercial, Ad-Free, Zero Proxy)
  const LIVE_RADIOS = [
    {
      id: 'groovesalad',
      icon: '🌿',
      stationName: 'Groove Salad',
      descFr: 'Chill & Ambient downtempo',
      descEn: 'Ambient & Downtempo Chill',
      stationPage: 'https://somafm.com/groovesalad/',
      streams: {
        mp3: [
          'https://ice2.somafm.com/groovesalad-128-mp3',
          'https://ice1.somafm.com/groovesalad-128-mp3',
          'https://ice4.somafm.com/groovesalad-128-mp3',
        ],
        aac: [
          'https://ice2.somafm.com/groovesalad-128-aac',
          'https://ice1.somafm.com/groovesalad-128-aac',
          'https://ice4.somafm.com/groovesalad-128-aac',
        ],
      },
    },
    {
      id: 'fluid',
      icon: '🎧',
      stationName: 'Fluid',
      descFr: 'Hip-hop instrumental, Future Soul & Lo-Fi',
      descEn: 'Instrumental Hip-Hop, Future Soul & Lo-Fi',
      stationPage: 'https://somafm.com/fluid/',
      streams: {
        mp3: [
          'https://ice2.somafm.com/fluid-128-mp3',
          'https://ice1.somafm.com/fluid-128-mp3',
          'https://ice4.somafm.com/fluid-128-mp3',
        ],
        aac: [
          'https://ice2.somafm.com/fluid-128-aac',
          'https://ice1.somafm.com/fluid-128-aac',
          'https://ice4.somafm.com/fluid-128-aac',
        ],
      },
    },
    {
      id: 'dronezone',
      icon: '🌌',
      stationName: 'Drone Zone',
      descFr: 'Textures atmosphériques & Focus profond',
      descEn: 'Atmospheric Textures & Deep Focus',
      stationPage: 'https://somafm.com/dronezone/',
      streams: {
        mp3: [
          'https://ice2.somafm.com/dronezone-128-mp3',
          'https://ice1.somafm.com/dronezone-128-mp3',
          'https://ice4.somafm.com/dronezone-128-mp3',
        ],
        aac: [
          'https://ice2.somafm.com/dronezone-128-aac',
          'https://ice1.somafm.com/dronezone-128-aac',
          'https://ice4.somafm.com/dronezone-128-aac',
        ],
      },
    },
    {
      id: 'deepspaceone',
      icon: '🪐',
      stationName: 'Deep Space One',
      descFr: 'Ambient spatial profond & Exploration',
      descEn: 'Deep Ambient Electronic & Space',
      stationPage: 'https://somafm.com/deepspaceone/',
      streams: {
        mp3: [
          'https://ice2.somafm.com/deepspaceone-128-mp3',
          'https://ice1.somafm.com/deepspaceone-128-mp3',
          'https://ice4.somafm.com/deepspaceone-128-mp3',
        ],
        aac: [
          'https://ice2.somafm.com/deepspaceone-128-aac',
          'https://ice1.somafm.com/deepspaceone-128-aac',
          'https://ice4.somafm.com/deepspaceone-128-aac',
        ],
      },
    },
    {
      id: 'lush',
      icon: '🌸',
      stationName: 'Lush',
      descFr: 'Voix douces & Électronique mélodique',
      descEn: 'Mellow Vocals & Chill Electronica',
      stationPage: 'https://somafm.com/lush/',
      streams: {
        mp3: [
          'https://ice2.somafm.com/lush-128-mp3',
          'https://ice1.somafm.com/lush-128-mp3',
          'https://ice4.somafm.com/lush-128-mp3',
        ],
        aac: [
          'https://ice2.somafm.com/lush-128-aac',
          'https://ice1.somafm.com/lush-128-aac',
          'https://ice4.somafm.com/lush-128-aac',
        ],
      },
    },
    {
      id: 'vaporwaves',
      icon: '🌴',
      stationName: 'Vaporwaves',
      descFr: 'Synthchill, Future Funk & Vaporwave',
      descEn: 'Vaporwave, Future Funk & Synthchill',
      stationPage: 'https://somafm.com/vaporwaves/',
      streams: {
        mp3: [
          'https://ice2.somafm.com/vaporwaves-128-mp3',
          'https://ice1.somafm.com/vaporwaves-128-mp3',
          'https://ice4.somafm.com/vaporwaves-128-mp3',
        ],
        aac: [
          'https://ice2.somafm.com/vaporwaves-128-aac',
          'https://ice1.somafm.com/vaporwaves-128-aac',
          'https://ice4.somafm.com/vaporwaves-128-aac',
        ],
      },
    },
  ];

  const STREAM_CURATED = {
    spotify: [
      {
        id: 'sp-lofi',
        fr: '☕ Lo-Fi Chill & Étude',
        en: '☕ Chill Lo-Fi Study',
        url: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwxd0LuZv',
      },
      {
        id: 'sp-piano',
        fr: '🎹 Piano Paisible',
        en: '🎹 Peaceful Piano',
        url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO',
      },
      {
        id: 'sp-focus',
        fr: '🧠 Deep Focus Ambient',
        en: '🧠 Deep Focus Ambient',
        url: 'https://open.spotify.com/playlist/6L1Yl0gW8L34K9930k5F7C',
      },
      {
        id: 'sp-flow',
        fr: '🌌 Flow State Synth',
        en: '🌌 Flow State Synth',
        url: 'https://open.spotify.com/playlist/4tF8vF32Q90PZ3M98R8M99',
      },
    ],
    apple: [
      {
        id: 'am-focus',
        fr: '🧠 Pure Focus',
        en: '🧠 Pure Focus',
        url: 'https://music.apple.com/us/playlist/pure-focus/pl.dbd712beded846dca273d5d3259d28aa',
      },
      {
        id: 'am-lofi',
        fr: '☕ Lo-Fi Chill',
        en: '☕ Lo-Fi Chill',
        url: 'https://music.apple.com/us/playlist/lo-fi-chill/pl.f3630f9a2b824340a6ac6df759d57a94',
      },
      {
        id: 'am-piano',
        fr: '🎹 Piano Chill',
        en: '🎹 Piano Chill',
        url: 'https://music.apple.com/us/playlist/piano-chill/pl.u-ZmblWJvT48Nd4p',
      },
    ],
    deezer: [
      {
        id: 'dz-lofi',
        fr: '☕ Lo-Fi Chill Beats',
        en: '☕ Lo-Fi Chill Beats',
        url: 'https://www.deezer.com/playlist/1253942361',
      },
      {
        id: 'dz-piano',
        fr: '🎹 Piano Calme & Focus',
        en: '🎹 Calm Piano & Focus',
        url: 'https://www.deezer.com/playlist/314272462',
      },
    ],
  };

  const audioEl = {
    headerBtn: document.getElementById('audio-drawer-btn'),
    headerEq: document.getElementById('header-audio-eq'),
    fsAudioBtn: document.getElementById('fs-audio-btn'),
    focusOpenBtn: document.getElementById('focus-open-audio-btn'),
    backdrop: document.getElementById('audio-drawer-backdrop'),
    drawer: document.getElementById('audio-studio-drawer'),
    expandBtn: document.getElementById('audio-drawer-expand'),
    closeBtn: document.getElementById('audio-drawer-close'),
    activeBadge: document.getElementById('audio-active-badge'),
    tabBtns: document.querySelectorAll('#audio-studio-tabs .seg-btn'),
    panelMixer: document.getElementById('audio-panel-mixer'),
    panelStreaming: document.getElementById('audio-panel-streaming'),

    // Mixer
    masterSlider: document.getElementById('mixer-master-volume'),
    masterPct: document.getElementById('mixer-master-pct'),
    stopAllBtn: document.getElementById('mixer-stop-all-btn'),
    presetBtns: document.querySelectorAll('#mixer-presets .cat-pill'),
    mixerGrid: document.getElementById('mixer-grid'),

    // Streaming & Full-Track Unlock
    serviceBtns: document.querySelectorAll('#stream-service-tabs .stream-svc-btn'),
    embedSection: document.getElementById('stream-embed-section'),
    authBox: document.getElementById('stream-auth-box'),
    fileWarn: document.getElementById('stream-file-warn'),
    popoutBtn: document.getElementById('stream-popout-btn'),
    nativeBtn: document.getElementById('stream-native-btn'),
    loginBtn: document.getElementById('stream-login-btn'),
    reloadBtn: document.getElementById('stream-reload-btn'),
    curatedTitle: document.getElementById('stream-curated-title'),
    curatedList: document.getElementById('stream-curated-list'),
    customForm: document.getElementById('stream-custom-form'),
    urlInput: document.getElementById('stream-url-input'),
    urlError: document.getElementById('stream-url-error'),
    playerCard: document.getElementById('stream-player-card'),
    activeTitle: document.getElementById('stream-active-title'),
    openExtLink: document.getElementById('stream-open-ext'),
    unloadBtn: document.getElementById('stream-unload-btn'),
    iframeMount: document.getElementById('stream-iframe-mount'),

    // SomaFM Live Radios (Direct Public MP3/AAC Streams & Attribution)
    radioNowPlayingBar: document.getElementById('audio-radio-nowplaying-bar'),
    radioNpText: document.getElementById('audio-radio-np-text'),
    radioNpStop: document.getElementById('audio-radio-np-stop'),
    radioBox: document.getElementById('stream-radio-box'),
    radioStations: document.getElementById('stream-radio-stations'),
    radioStationName: document.getElementById('stream-radio-station-name'),
    radioStationDesc: document.getElementById('stream-radio-station-desc'),
    radioStationLink: document.getElementById('stream-radio-station-link'),
    radioDirectUrl: document.getElementById('stream-radio-direct-url'),
    radioCodecBtns: document.querySelectorAll('#stream-radio-codec-btns .radio-codec-btn'),
    radioPlayBtn: document.getElementById('stream-radio-play-btn'),
    radioLivePill: document.getElementById('stream-radio-live-pill'),
    radioVol: document.getElementById('stream-radio-vol'),
    radioAudio: document.getElementById('stream-radio-audio'),
  };

  const audioStudio = {
    open: false,
    expanded: false,
    tab: 'mixer', // 'mixer' | 'streaming'
    activePresetId: null,
    mountedEmbedUrl: '',
    mountedService: null,
    mountedSourceUrl: '',
    mountedTitleKey: null,
    radioStationId: 'groovesalad',
    radioCodec: 'mp3', // 'mp3' | 'aac'
    radioMirrorIdx: 0,
    radioPlaying: false,
    loginPollTimer: null,
  };

  // Detect file:// local origin (where browsers isolate 3rd-party cookies inside iframes)
  if (audioEl.fileWarn && window.location.protocol === 'file:') {
    audioEl.fileWarn.classList.remove('hidden');
  }

  function syncExpandBtnLabel() {
    if (!audioEl.expandBtn) return;
    audioEl.expandBtn.textContent = audioStudio.expanded
      ? t('audio.drawer.shrink')
      : t('audio.drawer.expand');
  }

  function buildMixerGridOnce() {
    if (!audioEl.mixerGrid || audioEl.mixerGrid.children.length > 0) return;
    SOUND_CATALOG.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'mixer-card';
      card.dataset.soundId = item.id;
      const pct = Math.round(item.defaultVol * 100);
      card.innerHTML = `
        <button type="button" class="mixer-card-top">
          <span class="mixer-card-icon" aria-hidden="true">${item.icon}</span>
          <span class="mixer-card-info">
            <div class="mixer-card-name"></div>
            <div class="mixer-card-desc"></div>
          </span>
        </button>
        <div class="mixer-card-slider-wrap">
          <input type="range" class="mixer-ch-slider" min="5" max="100" value="${pct}" />
          <span class="mixer-ch-pct">${pct}%</span>
        </div>
      `;

      const toggleBtn = card.querySelector('.mixer-card-top');
      const slider = card.querySelector('.mixer-ch-slider');
      const pctLabel = card.querySelector('.mixer-ch-pct');

      toggleBtn.addEventListener('click', () => {
        audioStudio.activePresetId = null;
        const vol = (parseInt(slider.value, 10) || 70) / 100;
        window.coolAudio.toggleChannel(item.id, vol);
      });

      slider.addEventListener('input', () => {
        const val = parseInt(slider.value, 10) || 5;
        pctLabel.textContent = `${val}%`;
        if (!window.coolAudio.isChannelActive(item.id)) {
          audioStudio.activePresetId = null;
          window.coolAudio.toggleChannel(item.id, val / 100);
        } else {
          window.coolAudio.setChannelVolume(item.id, val / 100);
        }
      });

      audioEl.mixerGrid.appendChild(card);
    });
  }

  function refreshMixerLabels() {
    buildMixerGridOnce();
    syncExpandBtnLabel();
    if (!audioEl.mixerGrid) return;
    audioEl.mixerGrid.querySelectorAll('.mixer-card').forEach((card) => {
      const id = card.dataset.soundId;
      card.querySelector('.mixer-card-name').textContent = t(`sound.${id}`);
      card.querySelector('.mixer-card-desc').textContent = t(`sound.${id}.desc`);
      card.querySelector('.mixer-ch-slider').setAttribute('aria-label', t(`sound.${id}`));
    });
  }

  function syncAudioStudioUI() {
    const rawActive = window.coolAudio.getActiveChannels();
    const activeIds = Array.isArray(rawActive) ? rawActive : Object.keys(rawActive || {});
    const activeSet = new Set(activeIds);
    const count = activeIds.length;
    const hasStream = Boolean(audioStudio.mountedEmbedUrl) || audioStudio.radioPlaying;

    // 1. Update Mixer Cards
    if (audioEl.mixerGrid) {
      audioEl.mixerGrid.querySelectorAll('.mixer-card').forEach((card) => {
        const id = card.dataset.soundId;
        const isActive = activeSet.has(id);
        card.classList.toggle('active', isActive);
        if (isActive) {
          const pct = Math.round(window.coolAudio.getChannelVolume(id) * 100);
          const slider = card.querySelector('.mixer-ch-slider');
          const pctEl = card.querySelector('.mixer-ch-pct');
          if (document.activeElement !== slider) {
            slider.value = String(pct);
          }
          pctEl.textContent = `${pct}%`;
        }
      });
    }

    // 2. Update Preset Buttons
    audioEl.presetBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.preset === audioStudio.activePresetId && count > 0);
    });

    // 3. Update Focus Mode Quick-Mixer Chips
    el.ambientSoundBtns.forEach((btn) => {
      const s = btn.dataset.sound;
      if (s === 'none') {
        btn.classList.toggle('active', count === 0);
      } else {
        btn.classList.toggle('active', activeSet.has(s));
      }
    });

    // 4. Update Header Equalizer & Active Count Badge
    const anyPlaying = count > 0 || hasStream;
    if (audioEl.headerBtn) {
      audioEl.headerBtn.classList.toggle('playing', anyPlaying);
    }
    if (audioEl.headerEq) {
      audioEl.headerEq.classList.toggle('hidden', !anyPlaying);
    }
    if (audioEl.activeBadge) {
      if (count > 0) {
        audioEl.activeBadge.textContent = t('audio.activeBadge', { n: count });
        audioEl.activeBadge.classList.remove('hidden');
      } else {
        audioEl.activeBadge.classList.add('hidden');
      }
    }
  }

  window.coolAudio.onChange = syncAudioStudioUI;

  function openAudioDrawer(preferredTab) {
    if (preferredTab) {
      setAudioDrawerTab(preferredTab);
    }
    audioStudio.open = true;
    audioEl.drawer.classList.add('open');
    audioEl.backdrop.classList.add('open');
  }

  function closeAudioDrawer() {
    audioStudio.open = false;
    audioEl.drawer.classList.remove('open');
    audioEl.backdrop.classList.remove('open');
  }

  function toggleAudioDrawer(preferredTab) {
    if (audioStudio.open) closeAudioDrawer();
    else openAudioDrawer(preferredTab);
  }

  function setAudioDrawerTab(tabName) {
    audioStudio.tab = tabName === 'streaming' ? 'streaming' : 'mixer';
    audioEl.tabBtns.forEach((b) => {
      b.classList.toggle('active', b.dataset.audioTab === audioStudio.tab);
    });
    audioEl.panelMixer.classList.toggle('hidden', audioStudio.tab !== 'mixer');
    audioEl.panelStreaming.classList.toggle('hidden', audioStudio.tab !== 'streaming');

    if (audioStudio.tab === 'streaming') {
      const svc = getSelectedStreamService();
      syncServiceSectionVisibility(svc);
      if (svc !== 'radio' && !audioStudio.mountedEmbedUrl) {
        loadDefaultForService(svc);
      }
    }
  }

  function getSelectedStreamService() {
    const svc = state.musicService;
    return STREAM_SERVICES[svc] ? svc : 'spotify';
  }

  function syncServiceSectionVisibility(svc) {
    const isRadio = svc === 'radio';
    if (audioEl.radioBox) audioEl.radioBox.classList.toggle('hidden', !isRadio);
    if (audioEl.embedSection) audioEl.embedSection.classList.toggle('hidden', isRadio);
    renderRadioStations();
  }

  function parseMusicUrl(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') return null;
    const input = rawInput.trim();
    if (!input) return null;

    // 1. Spotify URI: spotify:playlist:37i9dQZF1DX4sWSpwq3LiO
    const spUri = input.match(/^spotify:(playlist|album|track|episode|show):([A-Za-z0-9]+)$/i);
    if (spUri) {
      const type = spUri[1].toLowerCase();
      const id = spUri[2];
      return {
        service: 'spotify',
        embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
        externalUrl: `https://open.spotify.com/${type}/${id}`,
        nativeUri: `spotify:${type}:${id}`,
        height: type === 'track' ? 152 : 380,
      };
    }

    // 2. Spotify Web / Embed URL
    const spUrl = input.match(
      /open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?(playlist|album|track|episode|show)\/([A-Za-z0-9]+)/i
    );
    if (spUrl) {
      const type = spUrl[1].toLowerCase();
      const id = spUrl[2];
      return {
        service: 'spotify',
        embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
        externalUrl: `https://open.spotify.com/${type}/${id}`,
        nativeUri: `spotify:${type}:${id}`,
        height: type === 'track' ? 152 : 380,
      };
    }

    // 3. Apple Music Web / Embed URL
    const amUrl = input.match(
      /(?:embed\.)?music\.apple\.com\/([a-z]{2}\/(?:playlist|album|station|song)\/[^\s?#]+)(?:\?([^\s#]+))?/i
    );
    if (amUrl) {
      const path = amUrl[1];
      const query = amUrl[2] || '';
      const iMatch = query.match(/(?:^|&)i=(\d+)/);
      const trackParam = iMatch ? iMatch[1] : null;
      const isSingle = path.includes('/song/') || Boolean(trackParam);
      const ext = `https://music.apple.com/${path}${trackParam ? `?i=${trackParam}` : ''}`;
      return {
        service: 'apple',
        embedUrl: `https://embed.music.apple.com/${path}${
          trackParam ? `?i=${trackParam}&theme=dark` : '?theme=dark'
        }`,
        externalUrl: ext,
        nativeUri: ext.replace(/^https?:\/\//i, 'music://'),
        height: isSingle ? 190 : 450,
      };
    }

    // 4. Deezer Web or Widget URL
    const dzUrl =
      input.match(/deezer\.com\/(?:[a-z]{2}\/)?(playlist|album|track|podcast)\/(\d+)/i) ||
      input.match(/widget\.deezer\.com\/widget\/(?:dark|light|auto)\/(playlist|album|track|podcast)\/(\d+)/i);
    if (dzUrl) {
      const type = dzUrl[1].toLowerCase();
      const id = dzUrl[2];
      return {
        service: 'deezer',
        embedUrl: `https://widget.deezer.com/widget/dark/${type}/${id}?tracklist=true`,
        externalUrl: `https://www.deezer.com/${type}/${id}`,
        nativeUri: `deezer://www.deezer.com/${type}/${id}`,
        height: type === 'track' ? 152 : 380,
      };
    }

    return null;
  }

  function findCuratedByUrl(url) {
    for (const svc of Object.keys(STREAM_CURATED)) {
      const found = STREAM_CURATED[svc].find((item) => item.url === url);
      if (found) return found;
    }
    return null;
  }

  function getActiveOrDefaultSourceUrl(service) {
    const svc = service === 'radio' ? 'spotify' : service;
    if (audioStudio.mountedService === svc && audioStudio.mountedSourceUrl) {
      return audioStudio.mountedSourceUrl;
    }
    if (state.customStreamUrls && state.customStreamUrls[svc]) {
      return state.customStreamUrls[svc];
    }
    const list = STREAM_CURATED[svc] || STREAM_CURATED.spotify;
    return list[0].url;
  }

  function mountStreamEmbed(parsed, sourceUrl, curatedItem = null, forceReload = false) {
    if (!parsed || !audioEl.iframeMount) return;
    audioEl.urlError.classList.add('hidden');

    if (forceReload || audioStudio.mountedEmbedUrl !== parsed.embedUrl) {
      audioEl.iframeMount.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.src = parsed.embedUrl;
      iframe.height = String(parsed.height || 380);
      iframe.loading = 'eager';
      iframe.title = `${STREAM_SERVICES[parsed.service]} Player`;
      // Never restrict with a strict sandbox attribute so Apple ID / Spotify / Deezer login popups work cleanly!
      iframe.allow =
        'autoplay *; clipboard-write *; encrypted-media *; fullscreen *; picture-in-picture *';
      iframe.setAttribute('allowfullscreen', '');

      audioEl.iframeMount.appendChild(iframe);
      audioStudio.mountedEmbedUrl = parsed.embedUrl;
    }

    audioStudio.mountedService = parsed.service;
    audioStudio.mountedSourceUrl = sourceUrl;
    audioStudio.mountedTitleKey = curatedItem ? curatedItem.id : null;

    audioEl.playerCard.classList.remove('hidden');
    syncStreamingPanelLabels();
    syncAudioStudioUI();
  }

  function reloadMountedStreamEmbed() {
    const svc = getSelectedStreamService();
    if (svc === 'radio') return;
    const srcUrl = getActiveOrDefaultSourceUrl(svc);
    const parsed = parseMusicUrl(srcUrl);
    if (parsed) {
      mountStreamEmbed(parsed, srcUrl, findCuratedByUrl(srcUrl), true);
    }
  }

  function openCenteredPopup(url, windowName, w = 500, h = 680) {
    const left = Math.max(20, Math.round(window.screenX + (window.outerWidth - w) / 2));
    const top = Math.max(20, Math.round(window.screenY + (window.outerHeight - h) / 2));
    return window.open(
      url,
      windowName,
      `popup=yes,width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,status=no,resizable=yes,scrollbars=yes`
    );
  }

  function unloadStreamEmbed() {
    if (audioEl.iframeMount) {
      audioEl.iframeMount.innerHTML = '';
    }
    audioStudio.mountedEmbedUrl = '';
    audioStudio.mountedService = null;
    audioStudio.mountedSourceUrl = '';
    audioStudio.mountedTitleKey = null;
    audioEl.playerCard.classList.add('hidden');
    renderStreamCuratedList();
    syncAudioStudioUI();
  }

  function loadDefaultForService(service) {
    if (service === 'radio') return;
    const savedCustom = state.customStreamUrls && state.customStreamUrls[service];
    if (savedCustom) {
      const parsed = parseMusicUrl(savedCustom);
      if (parsed) {
        mountStreamEmbed(parsed, savedCustom, findCuratedByUrl(savedCustom));
        return;
      }
    }
    const list = STREAM_CURATED[service] || STREAM_CURATED.spotify;
    if (list.length > 0) {
      const first = list[0];
      const parsed = parseMusicUrl(first.url);
      if (parsed) {
        mountStreamEmbed(parsed, first.url, first);
      }
    }
  }

  /* ---- SomaFM Live Radio Controller (Direct Public MP3/AAC Streams & Clear Attribution) ---- */
  function getActiveRadioObj() {
    return LIVE_RADIOS.find((r) => r.id === audioStudio.radioStationId) || LIVE_RADIOS[0];
  }

  function getDirectSomaFmUrl(station = getActiveRadioObj(), codec = audioStudio.radioCodec, mirrorIdx = 0) {
    const fmt = codec === 'aac' ? 'aac' : 'mp3';
    const list = (station && station.streams && station.streams[fmt]) || LIVE_RADIOS[0].streams.mp3;
    return list[Math.min(mirrorIdx, list.length - 1)];
  }

  function syncRadioNowPlayingStrip() {
    if (!audioEl.radioNowPlayingBar) return;
    const activeSt = getActiveRadioObj();
    audioEl.radioNowPlayingBar.classList.toggle('hidden', !audioStudio.radioPlaying);
    if (audioEl.radioNpText && activeSt) {
      audioEl.radioNpText.textContent = t('audio.stream.radioNowPlaying', {
        station: activeSt.stationName,
      });
    }
  }

  function renderRadioStations() {
    if (!audioEl.radioStations) return;
    const activeSt = getActiveRadioObj();
    const codec = audioStudio.radioCodec === 'aac' ? 'aac' : 'mp3';
    const codecUpper = codec.toUpperCase();

    audioEl.radioStations.innerHTML = '';
    LIVE_RADIOS.forEach((st) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `stream-pill ${st.id === activeSt.id ? 'active' : ''}`;
      btn.textContent = `${st.icon} SomaFM • ${st.stationName}`;
      btn.title = `SomaFM — ${st.stationName} (${getLang() === 'en' ? st.descEn : st.descFr})`;
      btn.addEventListener('click', () => {
        audioStudio.radioStationId = st.id;
        audioStudio.radioMirrorIdx = 0;
        playBuiltInRadio(st, 0);
      });
      audioEl.radioStations.appendChild(btn);
    });

    // Update Mandatory Attribution Card (Radio Name + Specific Station + Links to somafm.com & Direct Public URL)
    if (audioEl.radioStationName) {
      audioEl.radioStationName.textContent = activeSt.stationName;
    }
    if (audioEl.radioStationDesc) {
      audioEl.radioStationDesc.textContent = `— ${getLang() === 'en' ? activeSt.descEn : activeSt.descFr}`;
    }
    if (audioEl.radioStationLink) {
      audioEl.radioStationLink.href = activeSt.stationPage;
    }
    if (audioEl.radioDirectUrl) {
      const directUrl = getDirectSomaFmUrl(activeSt, codec, audioStudio.radioMirrorIdx);
      audioEl.radioDirectUrl.href = directUrl;
      audioEl.radioDirectUrl.textContent = t('audio.stream.radioDirectStream', { codec: codecUpper });
      audioEl.radioDirectUrl.title = t('audio.stream.radioDirectStreamTitle', { codec: codecUpper });
    }

    if (audioEl.radioCodecBtns) {
      audioEl.radioCodecBtns.forEach((b) => {
        b.classList.toggle('active', b.dataset.codec === codec);
      });
    }

    if (audioEl.radioPlayBtn) {
      audioEl.radioPlayBtn.textContent = audioStudio.radioPlaying
        ? t('audio.stream.radioPause', { station: activeSt.stationName })
        : t('audio.stream.radioPlay', { station: activeSt.stationName });
    }
    if (audioEl.radioLivePill) {
      audioEl.radioLivePill.classList.toggle('hidden', !audioStudio.radioPlaying);
    }

    syncRadioNowPlayingStrip();
  }

  function playBuiltInRadio(station = getActiveRadioObj(), mirrorIdx = 0) {
    if (!audioEl.radioAudio || !station) return;
    audioStudio.radioMirrorIdx = mirrorIdx;
    const directUrl = getDirectSomaFmUrl(station, audioStudio.radioCodec, mirrorIdx);
    if (audioEl.radioAudio.src !== directUrl) {
      audioEl.radioAudio.src = directUrl;
    }
    audioEl.radioAudio.volume = (parseInt(audioEl.radioVol.value, 10) || 70) / 100;
    audioEl.radioAudio
      .play()
      .then(() => {
        audioStudio.radioPlaying = true;
        renderRadioStations();
        syncAudioStudioUI();
      })
      .catch(() => {
        const fmt = audioStudio.radioCodec === 'aac' ? 'aac' : 'mp3';
        const mirrors = (station.streams && station.streams[fmt]) || [];
        if (mirrorIdx + 1 < mirrors.length) {
          playBuiltInRadio(station, mirrorIdx + 1);
          return;
        }
        audioStudio.radioPlaying = false;
        renderRadioStations();
        syncAudioStudioUI();
      });
  }

  function toggleBuiltInRadio() {
    if (!audioEl.radioAudio) return;
    if (audioStudio.radioPlaying) {
      audioEl.radioAudio.pause();
      audioStudio.radioPlaying = false;
      renderRadioStations();
      syncAudioStudioUI();
    } else {
      playBuiltInRadio(getActiveRadioObj(), 0);
    }
  }

  function renderStreamCuratedList() {
    if (!audioEl.curatedList) return;
    const svc = getSelectedStreamService();
    syncServiceSectionVisibility(svc);

    audioEl.serviceBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.service === svc);
    });

    if (svc === 'radio') return;

    const svcName = STREAM_SERVICES[svc];
    if (audioEl.curatedTitle) {
      audioEl.curatedTitle.textContent = t('audio.stream.curatedTitle', { service: svcName });
    }
    if (audioEl.loginBtn) {
      audioEl.loginBtn.textContent = t('audio.stream.loginBtn', { service: svcName });
    }
    if (audioEl.nativeBtn) {
      audioEl.nativeBtn.textContent = t('audio.stream.nativeBtn', { service: svcName });
    }

    audioEl.curatedList.innerHTML = '';
    const items = STREAM_CURATED[svc] || [];
    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `stream-pill ${audioStudio.mountedSourceUrl === item.url ? 'active' : ''}`;
      btn.textContent = getLang() === 'en' ? item.en : item.fr;
      btn.addEventListener('click', () => {
        const parsed = parseMusicUrl(item.url);
        if (parsed) {
          mountStreamEmbed(parsed, item.url, item);
          renderStreamCuratedList();
        }
      });
      audioEl.curatedList.appendChild(btn);
    });
  }

  function syncStreamingPanelLabels() {
    renderStreamCuratedList();
    renderRadioStations();
    if (!audioStudio.mountedEmbedUrl) {
      audioEl.playerCard.classList.add('hidden');
      return;
    }
    const svc = audioStudio.mountedService || getSelectedStreamService();
    const svcName = STREAM_SERVICES[svc] || 'Spotify';
    const curated = findCuratedByUrl(audioStudio.mountedSourceUrl);
    const titleLabel = curated
      ? `${svcName} • ${getLang() === 'en' ? curated.en : curated.fr}`
      : svcName;

    audioEl.activeTitle.textContent = titleLabel;
    audioEl.openExtLink.textContent = t('audio.stream.openApp', { service: svcName });
    if (audioStudio.mountedSourceUrl) {
      const parsed = parseMusicUrl(audioStudio.mountedSourceUrl);
      if (parsed) audioEl.openExtLink.href = parsed.externalUrl;
    }
  }

  // Wire Audio Drawer Events
  if (audioEl.headerBtn) {
    audioEl.headerBtn.addEventListener('click', () => toggleAudioDrawer());
  }
  if (audioEl.fsAudioBtn) {
    audioEl.fsAudioBtn.addEventListener('click', () => openAudioDrawer());
  }
  if (audioEl.focusOpenBtn) {
    audioEl.focusOpenBtn.addEventListener('click', () => openAudioDrawer());
  }
  if (audioEl.expandBtn) {
    audioEl.expandBtn.addEventListener('click', () => {
      audioStudio.expanded = !audioStudio.expanded;
      audioEl.drawer.classList.toggle('expanded', audioStudio.expanded);
      syncExpandBtnLabel();
    });
  }
  if (audioEl.closeBtn) {
    audioEl.closeBtn.addEventListener('click', closeAudioDrawer);
  }
  if (audioEl.backdrop) {
    audioEl.backdrop.addEventListener('click', closeAudioDrawer);
  }

  audioEl.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => setAudioDrawerTab(btn.dataset.audioTab));
  });

  if (audioEl.masterSlider) {
    audioEl.masterSlider.addEventListener('input', () => {
      setMasterAmbientVolumePct(parseInt(audioEl.masterSlider.value, 10) || 0);
    });
  }

  if (audioEl.stopAllBtn) {
    audioEl.stopAllBtn.addEventListener('click', () => {
      audioStudio.activePresetId = null;
      window.coolAudio.stopAllChannels();
    });
  }

  audioEl.presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.preset;
      const map = SOUND_PRESETS[key];
      if (!map) return;
      if (audioStudio.activePresetId === key && window.coolAudio.hasActiveChannels()) {
        audioStudio.activePresetId = null;
        window.coolAudio.stopAllChannels();
      } else {
        audioStudio.activePresetId = key;
        window.coolAudio.applyMixPreset(map);
      }
    });
  });

  audioEl.serviceBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const svc = btn.dataset.service;
      if (!STREAM_SERVICES[svc]) return;
      state.musicService = svc;
      saveState();
      audioEl.urlError.classList.add('hidden');
      renderStreamCuratedList();
      if (svc !== 'radio' && audioStudio.mountedService !== svc) {
        loadDefaultForService(svc);
        renderStreamCuratedList();
      }
    });
  });

  // Full-Track Login Popup + Auto-Reload
  if (audioEl.loginBtn) {
    audioEl.loginBtn.addEventListener('click', () => {
      const svc = getSelectedStreamService();
      const loginUrl = STREAM_LOGIN_URLS[svc] || STREAM_LOGIN_URLS.spotify;
      const popup = openCenteredPopup(loginUrl, 'coolclock_music_login', 520, 700);
      if (audioStudio.loginPollTimer) clearInterval(audioStudio.loginPollTimer);
      if (popup) {
        audioStudio.loginPollTimer = setInterval(() => {
          if (popup.closed) {
            clearInterval(audioStudio.loginPollTimer);
            audioStudio.loginPollTimer = null;
            reloadMountedStreamEmbed();
          }
        }, 800);
      }
    });
  }

  if (audioEl.reloadBtn) {
    audioEl.reloadBtn.addEventListener('click', reloadMountedStreamEmbed);
  }

  // Floating Full Mini-Player (100% full tracks even on file:// or strict cookies!)
  if (audioEl.popoutBtn) {
    audioEl.popoutBtn.addEventListener('click', () => {
      const svc = getSelectedStreamService();
      const srcUrl = getActiveOrDefaultSourceUrl(svc);
      const parsed = parseMusicUrl(srcUrl);
      const targetUrl = parsed ? parsed.externalUrl : STREAM_LOGIN_URLS[svc];
      // Unload 30s preview iframe so both don't play simultaneously
      unloadStreamEmbed();
      openCenteredPopup(targetUrl, 'coolclock_floating_player', 460, 680);
    });
  }

  // Native Desktop App Launcher (spotify:, music://, deezer://)
  if (audioEl.nativeBtn) {
    audioEl.nativeBtn.addEventListener('click', () => {
      const svc = getSelectedStreamService();
      const srcUrl = getActiveOrDefaultSourceUrl(svc);
      const parsed = parseMusicUrl(srcUrl);
      if (parsed && parsed.nativeUri) {
        unloadStreamEmbed();
        window.location.href = parsed.nativeUri;
      }
    });
  }

  // SomaFM Live Radio Events (Direct Public MP3/AAC Streams)
  if (audioEl.radioPlayBtn) {
    audioEl.radioPlayBtn.addEventListener('click', toggleBuiltInRadio);
  }
  if (audioEl.radioNpStop) {
    audioEl.radioNpStop.addEventListener('click', toggleBuiltInRadio);
  }
  if (audioEl.radioCodecBtns) {
    audioEl.radioCodecBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextCodec = btn.dataset.codec === 'aac' ? 'aac' : 'mp3';
        if (audioStudio.radioCodec === nextCodec) return;
        audioStudio.radioCodec = nextCodec;
        audioStudio.radioMirrorIdx = 0;
        if (audioStudio.radioPlaying) {
          playBuiltInRadio(getActiveRadioObj(), 0);
        } else {
          renderRadioStations();
        }
      });
    });
  }
  if (audioEl.radioVol) {
    audioEl.radioVol.addEventListener('input', () => {
      if (audioEl.radioAudio) {
        audioEl.radioAudio.volume = (parseInt(audioEl.radioVol.value, 10) || 0) / 100;
      }
    });
  }

  if (audioEl.customForm) {
    audioEl.customForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = audioEl.urlInput.value.trim();
      const parsed = parseMusicUrl(raw);
      if (!parsed) {
        audioEl.urlError.classList.remove('hidden');
        return;
      }
      state.musicService = parsed.service;
      state.customStreamUrls[parsed.service] = raw;
      saveState();
      audioEl.urlInput.value = '';
      syncServiceSectionVisibility(parsed.service);
      mountStreamEmbed(parsed, raw, findCuratedByUrl(raw), true);
      renderStreamCuratedList();
    });
  }

  if (audioEl.unloadBtn) {
    audioEl.unloadBtn.addEventListener('click', unloadStreamEmbed);
  }

  /* ==========================================================================
     9D. CONTACT FORM (FORMSPREE + HCAPTCHA + DIRECT EMAIL)
     ========================================================================== */
  const CONTACT_EMAIL = 'coolclock@geek-factory.xyz';

  const contactEl = {
    copyBtn: document.getElementById('copy-contact-email-btn'),
    form: document.getElementById('contact-form'),
    hiddenSubject: document.getElementById('contact-hidden-subject'),
    nameIn: document.getElementById('contact-name'),
    emailIn: document.getElementById('contact-email'),
    catSelect: document.getElementById('contact-category'),
    subjectIn: document.getElementById('contact-subject'),
    messageIn: document.getElementById('contact-message'),
    charCount: document.getElementById('contact-char-count'),
    captchaFileHint: document.getElementById('contact-captcha-file-hint'),
    statusBox: document.getElementById('contact-form-status'),
    submitBtn: document.getElementById('contact-submit-btn'),
  };

  let contactCaptchaToken = '';

  window.onCoolClockHCaptchaSuccess = function (token) {
    contactCaptchaToken = token || '';
    if (contactEl.statusBox && contactEl.statusBox.dataset.errKind === 'captcha') {
      contactEl.statusBox.classList.add('hidden');
    }
  };

  window.onCoolClockHCaptchaExpired = function () {
    contactCaptchaToken = '';
  };

  if (contactEl.captchaFileHint && window.location.protocol === 'file:') {
    contactEl.captchaFileHint.classList.remove('hidden');
  }

  function showContactStatus(type, htmlOrText, isHtml = false, errKind = '') {
    if (!contactEl.statusBox) return;
    contactEl.statusBox.className = `contact-status is-${type}`;
    contactEl.statusBox.dataset.errKind = errKind;
    if (isHtml) {
      contactEl.statusBox.innerHTML = htmlOrText;
    } else {
      contactEl.statusBox.textContent = htmlOrText;
    }
    contactEl.statusBox.classList.remove('hidden');
  }

  function updateContactCharCount() {
    if (!contactEl.messageIn || !contactEl.charCount) return;
    const len = contactEl.messageIn.value.length;
    contactEl.charCount.textContent = `${len} / 3000`;
  }

  if (contactEl.messageIn) {
    contactEl.messageIn.addEventListener('input', updateContactCharCount);
  }

  if (contactEl.copyBtn) {
    let copyTimer = null;
    contactEl.copyBtn.addEventListener('click', () => {
      const done = () => {
        contactEl.copyBtn.textContent = t('contact.emailCopied');
        if (copyTimer) clearTimeout(copyTimer);
        copyTimer = setTimeout(() => {
          contactEl.copyBtn.textContent = t('contact.copyEmail');
        }, 2200);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(CONTACT_EMAIL).then(done).catch(done);
      } else {
        const tmp = document.createElement('textarea');
        tmp.value = CONTACT_EMAIL;
        document.body.appendChild(tmp);
        tmp.select();
        try {
          document.execCommand('copy');
        } catch (_) {}
        document.body.removeChild(tmp);
        done();
      }
    });
  }

  if (contactEl.form) {
    contactEl.form.addEventListener('reset', () => {
      setTimeout(() => {
        updateContactCharCount();
        contactCaptchaToken = '';
        if (contactEl.statusBox) {
          contactEl.statusBox.classList.add('hidden');
        }
        if (window.hcaptcha && typeof window.hcaptcha.reset === 'function') {
          try {
            window.hcaptcha.reset();
          } catch (_) {}
        }
      }, 0);
    });

    contactEl.form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(contactEl.form);
      // Honeypot check
      if (formData.get('_gotcha')) {
        return;
      }

      const nameVal = (contactEl.nameIn.value || '').trim();
      const emailVal = (contactEl.emailIn.value || '').trim();
      const subjectVal = (contactEl.subjectIn.value || '').trim();
      const messageVal = (contactEl.messageIn.value || '').trim();
      const categoryVal = contactEl.catSelect ? contactEl.catSelect.value : 'suggestion';
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);

      if (!nameVal || !emailValid || !subjectVal || !messageVal) {
        showContactStatus('error', t('contact.err.fields'), false, 'fields');
        return;
      }

      // Verify hCaptcha token
      let token = contactCaptchaToken || String(formData.get('h-captcha-response') || '').trim();
      if (!token && window.hcaptcha && typeof window.hcaptcha.getResponse === 'function') {
        try {
          token = window.hcaptcha.getResponse();
        } catch (_) {}
      }

      if (!token) {
        showContactStatus('error', t('contact.err.captcha'), false, 'captcha');
        return;
      }

      formData.set('h-captcha-response', token);
      formData.set('_replyto', emailVal);
      const formattedSubject = `[CoolClock • ${categoryVal}] ${subjectVal}`;
      formData.set('_subject', formattedSubject);
      if (contactEl.hiddenSubject) {
        contactEl.hiddenSubject.value = formattedSubject;
      }

      const endpoint = (contactEl.form.getAttribute('action') || '').trim();
      const isPlaceholderEndpoint =
        !endpoint ||
        endpoint.includes('VOTRE_ID_FORMSPREE') ||
        endpoint.includes('YOUR_FORMSPREE_ID');

      if (isPlaceholderEndpoint) {
        const mailtoBody = `${messageVal}\n\n---\n${nameVal} (${emailVal})`;
        const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
          formattedSubject
        )}&body=${encodeURIComponent(mailtoBody)}`;
        showContactStatus(
          'info',
          t('contact.info.placeholderEndpoint', { mailto: mailtoHref }),
          true,
          'placeholder'
        );
        return;
      }

      if (contactEl.submitBtn) {
        contactEl.submitBtn.disabled = true;
        contactEl.submitBtn.textContent = t('contact.submitting');
      }

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        });

        if (res.ok) {
          contactEl.form.reset();
          updateContactCharCount();
          contactCaptchaToken = '';
          if (window.hcaptcha && typeof window.hcaptcha.reset === 'function') {
            try {
              window.hcaptcha.reset();
            } catch (_) {}
          }
          showContactStatus('success', t('contact.success'), false, '');
        } else {
          const data = await res.json().catch(() => null);
          const serverErr =
            data && Array.isArray(data.errors) && data.errors.length > 0
              ? data.errors.map((item) => item.message).join(' • ')
              : '';
          if (serverErr) {
            showContactStatus('error', serverErr, false, 'server');
          } else {
            showContactStatus('error', t('contact.err.network'), true, 'network');
          }
        }
      } catch (_) {
        showContactStatus('error', t('contact.err.network'), true, 'network');
      } finally {
        if (contactEl.submitBtn) {
          contactEl.submitBtn.disabled = false;
          contactEl.submitBtn.textContent = t('contact.submitBtn');
        }
      }
    });
  }

  /* ==========================================================================
     10. KEYBOARD SHORTCUTS
     ========================================================================== */
  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      if (e.key === 'Escape' && (audioStudio.open || focus.open || fs.open)) {
        e.target.blur();
      }
      return;
    }

    if (e.key === 'Escape') {
      if (audioStudio.open) {
        closeAudioDrawer();
        return;
      }
      if (fs.open) {
        closeFullscreenStudio();
        return;
      }
      if (focus.open) {
        toggleFocusMode(false);
        return;
      }
    }

    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleAudioDrawer();
      return;
    }

    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      if (fs.open) closeFullscreenStudio();
      else openFullscreenStudio(state.activeTab);
      return;
    }

    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      if (fs.open) closeFullscreenStudio();
      toggleFocusMode();
      return;
    }
    if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      cycleTheme();
      return;
    }
    if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      applyLanguage(getLang() === 'fr' ? 'en' : 'fr');
      return;
    }
    if (!focus.open && !fs.open) {
      if (e.key === '1') switchTab('clock');
      if (e.key === '2') switchTab('pomodoro');
      if (e.key === '3') switchTab('timer');
      if (e.key === '4') switchTab('stopwatch');
      if (e.key === '5') switchTab('world');
      if (e.key === '6') switchTab('contact');
    }

    if (e.code === 'Space') {
      if (fs.open) {
        if (fs.source === 'pomodoro') {
          e.preventDefault();
          togglePomoStart();
        } else if (fs.source === 'timer') {
          e.preventDefault();
          toggleMainTimer();
        } else if (fs.source === 'stopwatch') {
          e.preventDefault();
          toggleStopwatch();
        }
      } else if (focus.open) {
        if (focus.view === 'pomodoro') {
          e.preventDefault();
          togglePomoStart();
        } else if (focus.view === 'timer') {
          e.preventDefault();
          toggleMainTimer();
        }
      } else if (state.activeTab === 'pomodoro') {
        e.preventDefault();
        togglePomoStart();
      } else if (state.activeTab === 'timer') {
        e.preventDefault();
        toggleMainTimer();
      } else if (state.activeTab === 'stopwatch') {
        e.preventDefault();
        toggleStopwatch();
      }
    }
  });

  /* ==========================================================================
     11. MASTER LOOP (60fps clock/stopwatch + 250ms drift-free & occlusion-proof tick)
     ========================================================================== */
  function animationTick() {
    try {
      updateClockFrame();
      if (sw.running) {
        updateStopwatchFrame();
      }
      if (focus.open && focus.view === 'clock') {
        updateFocusReadout();
      }
      if (fs.open) {
        updateFullscreenStudioFrame();
      }
    } catch (err) {
      console.error('CoolClock frame error:', err);
    }
    requestAnimationFrame(animationTick);
  }

  function updateDocumentTitle() {
    if (pomo.running) {
      document.title = t('doc.title.pomo', { time: formatDurationSec(pomo.remainingSec) });
    } else if (mainTimer.state === 'running') {
      document.title = t('doc.title.timer', { time: formatDurationSec(mainTimer.remainingSec) });
    } else {
      document.title = t('doc.title.default');
    }
  }

  function applyStaticDomTranslations() {
    document.documentElement.lang = getLang();
    if (el.metaDesc) {
      el.metaDesc.setAttribute('content', t('doc.metaDesc'));
    }

    el.langBtns.forEach((btn) => {
      const isAct = btn.dataset.lang === getLang();
      btn.classList.toggle('active', isAct);
      btn.setAttribute('aria-pressed', String(isAct));
    });

    document.querySelectorAll('[data-i18n]').forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-html]').forEach((node) => {
      node.innerHTML = t(node.dataset.i18nHtml);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      node.setAttribute('placeholder', t(node.dataset.i18nPlaceholder));
    });
    document.querySelectorAll('[data-i18n-title]').forEach((node) => {
      node.setAttribute('title', t(node.dataset.i18nTitle));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((node) => {
      node.setAttribute('aria-label', t(node.dataset.i18nAria));
    });
  }

  function applyLanguage(nextLang, skipSave = false) {
    state.lang = nextLang === 'en' ? 'en' : 'fr';

    // Translate untouched default starter task seamlessly
    const allDicts = window.COOLCLOCK_I18N || {};
    const frDefault = allDicts.fr && allDicts.fr['pomo.tasks.defaultTask'];
    const enDefault = allDicts.en && allDicts.en['pomo.tasks.defaultTask'];
    state.pomoTasks.forEach((task) => {
      if (task.id === 1 && (task.text === frDefault || task.text === enDefault)) {
        task.text = t('pomo.tasks.defaultTask');
      }
    });

    applyStaticDomTranslations();
    populateTimezoneDropdowns();
    renderThemeGrid();
    applyClockControlsUI();
    updateClockFrame();
    renderWorldClocks();

    updatePomoPhaseLabel();
    renderPomoUI();
    renderPomoTasks();

    applyTimerVisualMode(state.timerVisualMode || 'candle');
    renderMainTimerUI();
    renderMultiTimers();

    updateStopwatchButtons();
    updateStopwatchFrame();
    renderStopwatchLaps();

    syncBreathingUI();
    updateFocusReadout();

    refreshMixerLabels();
    syncStreamingPanelLabels();
    syncAudioStudioUI();

    fs.lastWorldRenderSec = -1;
    syncFsControlsUI();
    updateFullscreenStudioFrame();
    updateDocumentTitle();

    if (!skipSave) {
      saveState();
    }
  }

  el.langBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetLang = btn.dataset.lang === getLang() ? (getLang() === 'fr' ? 'en' : 'fr') : btn.dataset.lang;
      applyLanguage(targetLang);
    });
  });

  function backgroundTimersTick() {
    const nowMs = Date.now();

    // 0. Keep main clock & fullscreen live even when rAF is throttled in background/second screen
    try {
      updateClockFrame();
      if (fs.open) {
        updateFullscreenStudioFrame();
      }
    } catch (_) {}

    // 1. Update world clocks live text
    updateWorldClocksLive();

    // 2. Pomodoro tick
    if (pomo.running) {
      const rem = (pomo.endTimestamp - nowMs) / 1000;
      if (rem <= 0) {
        pomo.remainingSec = 0;
        pomo.running = false;
        const finishedWork = pomo.mode === 'work';
        triggerAlarmBanner(
          finishedWork ? t('alarm.pomoWorkTitle') : t('alarm.pomoBreakTitle'),
          finishedWork ? t('alarm.pomoWorkMsg') : t('alarm.pomoBreakMsg')
        );
        advancePomoPhase(true);
      } else {
        pomo.remainingSec = rem;
        renderPomoUI();
      }
    }

    // 3. Main Timer tick
    if (mainTimer.state === 'running') {
      const rem = (mainTimer.endTimestamp - nowMs) / 1000;
      if (rem <= 0) {
        mainTimer.remainingSec = 0;
        mainTimer.state = 'idle';
        const label = el.mainTimerTitle.value.trim() || t('timer.defaultMainName');
        triggerAlarmBanner(t('alarm.timeUp'), t('alarm.mainTimerMsg', { label }));
        resetMainTimer();
      } else {
        mainTimer.remainingSec = rem;
        renderMainTimerUI();
      }
    }

    // 4. Multi-timers tick
    let mtStructureChanged = false;
    multiTimers.forEach((mt) => {
      if (mt.running && !mt.finished) {
        const rem = (mt.endTimestamp - nowMs) / 1000;
        if (rem <= 0) {
          mt.remainingSec = 0;
          mt.running = false;
          mt.finished = true;
          triggerAlarmBanner(t('alarm.multiTimerTitle'), t('alarm.multiTimerMsg', { name: mt.name }));
          mtStructureChanged = true;
        } else {
          mt.remainingSec = rem;
        }
      }
    });
    if (mtStructureChanged) {
      renderMultiTimers();
    } else if (multiTimers.length > 0) {
      updateMultiTimersLive();
    }

    // 5. Update Focus readout & document title
    if (focus.open) {
      updateFocusReadout();
    }
    updateDocumentTitle();
  }

  /* ==========================================================================
     INITIALIZATION
     ========================================================================== */
  function init() {
    try {
      buildAnalogDial();
      buildFsAnalogDial();
      const validTheme = THEMES.some((themeItem) => themeItem.id === state.theme)
        ? state.theme
        : 'aurora-night';
      applyTheme(validTheme);
      switchTab(state.activeTab);

      syncPomoSettingsInputs();
      setPomoMode('work', false);
      renderPomoStats();

      setMainTimerInputsFromSec(300);
      buildMixerGridOnce();
      setMasterAmbientVolumePct(typeof state.ambientVolume === 'number' ? state.ambientVolume : 50);
      applyLanguage(state.lang, true);
    } catch (err) {
      console.error('CoolClock init error:', err);
    }

    // Always start real-time loops unconditionally
    updateClockFrame();
    requestAnimationFrame(animationTick);
    setInterval(backgroundTimersTick, 250);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        updateClockFrame();
        updateWorldClocksLive();
      }
    });
  }

  init();
})();
