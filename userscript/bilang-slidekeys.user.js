// ==UserScript==
// @name         Bilang SlideKeys
// @namespace    https://github.com/grogzoid/bilang-slidekeys
// @version      0.2.0
// @description  Bilingual EN/UK on-screen keyboard available on every web page
// @author       grogzoid
// @match        *://*/*
// @exclude      *://*.chase.com/*
// @exclude      *://chase.com/*
// @run-at       document-end
// @noframes
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
  'use strict';

  // Tampermonkey runs scripts that declare any @grant in a sandbox where
  // 'window' is a wrapper, not the host page's window. Use unsafeWindow
  // (which Tampermonkey exposes for exactly this purpose) so that DOM
  // mutations and the politeness flag land on the real page's window —
  // visible to host-page scripts and other userscripts/extensions.
  const window = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : globalThis.window;
  const document = window.document;
  const customElements = window.customElements;
  const HTMLElement = window.HTMLElement;
  const localStorage = window.localStorage;
  const navigator = window.navigator;

  // Politeness check: if a host page (or another userscript/extension) has
  // already registered <bilingual-keyboard> or set the source flag, defer.
  // The host page's instance takes precedence — we don't inject anything.
  if (
    customElements.get('bilingual-keyboard') ||
    window.__bilangSlidekeys__
  ) {
    return;
  }
  // Mark this script as the active source.
  window.__bilangSlidekeys__ = { source: 'userscript', version: '0.2.0', registered: false };

// Bilingual keyboard key mappings: EN (QWERTY) <-> UK (Ukrainian Windows layout)
// Each key object maps a physical key position to both language outputs.

const keymap = [
  // Row 0: Number row
  [
    { en: '`', enShift: '~', uk: "'", ukShift: '₴', code: 'Backquote' },
    { en: '1', enShift: '!', uk: '1', ukShift: '!', code: 'Digit1' },
    { en: '2', enShift: '@', uk: '2', ukShift: '"', code: 'Digit2' },
    { en: '3', enShift: '#', uk: '3', ukShift: '№', code: 'Digit3' },
    { en: '4', enShift: '$', uk: '4', ukShift: ';', code: 'Digit4' },
    { en: '5', enShift: '%', uk: '5', ukShift: '%', code: 'Digit5' },
    { en: '6', enShift: '^', uk: '6', ukShift: ':', code: 'Digit6' },
    { en: '7', enShift: '&', uk: '7', ukShift: '?', code: 'Digit7' },
    { en: '8', enShift: '*', uk: '8', ukShift: '*', code: 'Digit8' },
    { en: '9', enShift: '(', uk: '9', ukShift: '(', code: 'Digit9' },
    { en: '0', enShift: ')', uk: '0', ukShift: ')', code: 'Digit0' },
    { en: '-', enShift: '_', uk: '-', ukShift: '_', code: 'Minus' },
    { en: '=', enShift: '+', uk: '=', ukShift: '+', code: 'Equal' },
  ],
  // Row 1: QWERTY row
  [
    { en: 'q', enShift: 'Q', uk: 'й', ukShift: 'Й', code: 'KeyQ' },
    { en: 'w', enShift: 'W', uk: 'ц', ukShift: 'Ц', code: 'KeyW' },
    { en: 'e', enShift: 'E', uk: 'у', ukShift: 'У', code: 'KeyE' },
    { en: 'r', enShift: 'R', uk: 'к', ukShift: 'К', code: 'KeyR' },
    { en: 't', enShift: 'T', uk: 'е', ukShift: 'Е', code: 'KeyT' },
    { en: 'y', enShift: 'Y', uk: 'н', ukShift: 'Н', code: 'KeyY' },
    { en: 'u', enShift: 'U', uk: 'г', ukShift: 'Г', code: 'KeyU' },
    { en: 'i', enShift: 'I', uk: 'ш', ukShift: 'Ш', code: 'KeyI' },
    { en: 'o', enShift: 'O', uk: 'щ', ukShift: 'Щ', code: 'KeyO' },
    { en: 'p', enShift: 'P', uk: 'з', ukShift: 'З', code: 'KeyP' },
    { en: '[', enShift: '{', uk: 'х', ukShift: 'Х', code: 'BracketLeft' },
    { en: ']', enShift: '}', uk: 'ї', ukShift: 'Ї', code: 'BracketRight' },
  ],
  // Row 2: Home row
  [
    { en: 'a', enShift: 'A', uk: 'ф', ukShift: 'Ф', code: 'KeyA' },
    { en: 's', enShift: 'S', uk: 'і', ukShift: 'І', code: 'KeyS' },
    { en: 'd', enShift: 'D', uk: 'в', ukShift: 'В', code: 'KeyD' },
    { en: 'f', enShift: 'F', uk: 'а', ukShift: 'А', code: 'KeyF' },
    { en: 'g', enShift: 'G', uk: 'п', ukShift: 'П', code: 'KeyG' },
    { en: 'h', enShift: 'H', uk: 'р', ukShift: 'Р', code: 'KeyH' },
    { en: 'j', enShift: 'J', uk: 'о', ukShift: 'О', code: 'KeyJ' },
    { en: 'k', enShift: 'K', uk: 'л', ukShift: 'Л', code: 'KeyK' },
    { en: 'l', enShift: 'L', uk: 'д', ukShift: 'Д', code: 'KeyL' },
    { en: ';', enShift: ':', uk: 'ж', ukShift: 'Ж', code: 'Semicolon' },
    { en: "'", enShift: '"', uk: 'є', ukShift: 'Є', code: 'Quote' },
  ],
  // Row 3: Bottom letter row
  [
    { en: 'z', enShift: 'Z', uk: 'я', ukShift: 'Я', code: 'KeyZ' },
    { en: 'x', enShift: 'X', uk: 'ч', ukShift: 'Ч', code: 'KeyX' },
    { en: 'c', enShift: 'C', uk: 'с', ukShift: 'С', code: 'KeyC' },
    { en: 'v', enShift: 'V', uk: 'м', ukShift: 'М', code: 'KeyV' },
    { en: 'b', enShift: 'B', uk: 'и', ukShift: 'И', code: 'KeyB' },
    { en: 'n', enShift: 'N', uk: 'т', ukShift: 'Т', code: 'KeyN' },
    { en: 'm', enShift: 'M', uk: 'ь', ukShift: 'Ь', code: 'KeyM' },
    { en: ',', enShift: '<', uk: 'б', ukShift: 'Б', code: 'Comma' },
    { en: '.', enShift: '>', uk: 'ю', ukShift: 'Ю', code: 'Period' },
    { en: '/', enShift: '?', uk: '.', ukShift: ',', code: 'Slash' },
  ],
];


const STYLES = `
  :host {
    --kb-bg: #1a1a2e;
    --key-bg: #1e1e2e;
    --key-border: #555;
    --key-border-bottom: #444;
    --key-active-color: #7ec8e3;
    --key-inactive-color: #999;
    --key-text: #eee;
    --panel-bg: #16162a;
    --toggle-bg: #1e1e2e;
    --glow-color: rgba(126, 200, 227, 0.4);
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  }

  .kb-toggle-wrap {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 100001;
    width: 56px;
    height: 56px;
    transition: opacity 0.2s ease, transform 0.2s ease;
    touch-action: none;
  }

  .kb-toggle-wrap.open {
    opacity: 0;
    pointer-events: none;
    transform: scale(0.8);
  }

  .kb-toggle-wrap.dismissed {
    display: none;
  }

  .kb-toggle-wrap.dragging .kb-toggle-btn {
    cursor: grabbing;
  }

  .kb-toggle-btn {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid var(--key-border);
    background: var(--toggle-bg);
    color: var(--key-text);
    font-size: 24px;
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    padding: 0;
  }

  .kb-toggle-wrap:not(.dragging) .kb-toggle-btn:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 24px rgba(0,0,0,0.5);
  }

  .kb-dismiss-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #2a2a3e;
    border: 1.5px solid #555;
    color: #aaa;
    font-size: 14px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    opacity: 0;
    transition: opacity 0.15s, background 0.15s, color 0.15s;
    z-index: 1;
  }

  .kb-toggle-wrap:hover .kb-dismiss-btn {
    opacity: 1;
  }

  .kb-dismiss-btn:hover {
    background: #3a3a4e;
    color: #fff;
  }

  .kb-close-btn {
    position: absolute;
    top: 8px;
    right: 12px;
    z-index: 3;
    background: transparent;
    border: none;
    color: var(--key-inactive-color);
    font-size: 22px;
    line-height: 1;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: color 0.15s, background 0.15s;
  }

  .kb-close-btn:hover {
    color: var(--key-text);
    background: rgba(255, 255, 255, 0.06);
  }

  .kb-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100000;
    background: var(--panel-bg);
    border-top: 2px solid #333;
    padding: 10px 8px 14px;
    transform: translateY(100%);
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 -8px 32px rgba(0,0,0,0.5);
  }

  .kb-panel.visible {
    transform: translateY(0);
  }

  .kb-internal-area {
    display: none;
    margin: 0 auto 8px;
    max-width: 900px;
    gap: 8px;
    align-items: stretch;
  }

  .kb-internal-area.active {
    display: flex;
  }

  .kb-internal-textarea {
    flex: 1;
    min-height: 48px;
    max-height: 80px;
    background: #111;
    color: var(--key-text);
    border: 2px solid #444;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 16px;
    font-family: inherit;
    resize: none;
    outline: none;
  }

  .kb-internal-textarea:focus {
    border-color: var(--key-active-color);
  }

  .kb-copy-btn {
    background: var(--key-bg);
    color: var(--key-text);
    border: 2px solid var(--key-border);
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    white-space: nowrap;
    transition: background 0.15s;
  }

  .kb-copy-btn:hover {
    background: #2a2a3e;
  }

  .kb-rows {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    max-width: 900px;
    margin: 0 auto;
  }

  .kb-row {
    display: flex;
    gap: 5px;
    justify-content: center;
    width: 100%;
  }

  .kb-key {
    position: relative;
    min-width: 52px;
    height: 58px;
    background: var(--key-bg);
    border: 2px solid var(--key-border);
    border-bottom: 3px solid var(--key-border-bottom);
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-user-select: none;
    transition: transform 0.08s ease, border-bottom-width 0.08s ease, background 0.1s;
    flex-shrink: 1;
    flex-grow: 0;
    padding: 4px;
    box-sizing: border-box;
  }

  .kb-key:active, .kb-key.pressed {
    transform: translateY(2px);
    border-bottom-width: 1px;
    background: #2a2a4a;
  }

  .kb-key .active-char {
    font-size: 28px;
    color: var(--key-active-color);
    line-height: 1;
  }

  .kb-key .inactive-char {
    position: absolute;
    top: 2px;
    right: 4px;
    font-size: 18px;
    color: var(--key-inactive-color);
    line-height: 1;
  }

  /* LiveType mode (opt-in diagonal layout): active lang top-left, inactive bottom-right */
  :host([input-mode="live-type"][live-type-keys="diagonal"]) .kb-key .diag-primary {
    position: absolute;
    top: 2px;
    left: 4px;
    font-size: 24px;
    color: #7ec8e3;
    line-height: 1;
  }

  :host([input-mode="live-type"][live-type-keys="diagonal"]) .kb-key .diag-secondary {
    position: absolute;
    bottom: 2px;
    right: 4px;
    font-size: 24px;
    color: #999;
    line-height: 1;
  }

  .kb-key.flash {
    background: #3a3a5a;
    border-color: var(--key-active-color);
    transition: none;
  }

  .kb-key.space {
    flex-grow: 1;
    min-width: 200px;
    max-width: 380px;
  }

  .kb-key.shift {
    min-width: 80px;
    font-size: 14px;
  }

  .kb-key.shift.active-shift {
    background: #2a2a4a;
    border-color: var(--key-active-color);
  }

  .kb-key.backspace {
    min-width: 80px;
    font-size: 14px;
  }

  .kb-key.enter {
    min-width: 76px;
    font-size: 14px;
  }

  .kb-key.lang-toggle {
    min-width: 76px;
    font-size: 13px;
    color: var(--key-active-color);
  }

  .kb-key.lang-toggle .active-char {
    font-size: 13px;
  }

  .kb-livetype-btn {
    position: absolute;
    left: 20px;
    bottom: 14px;
    background: var(--key-bg);
    border: 2px solid var(--key-border);
    border-bottom: 3px solid var(--key-border-bottom);
    border-radius: 8px;
    color: var(--key-text);
    font-family: inherit;
    font-size: 15px;
    padding: 10px 14px;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    z-index: 2;
  }

  .kb-livetype-btn:hover {
    border-color: #777;
  }

  .kb-livetype-btn.active {
    background: #2a2a4a;
    border-color: var(--key-active-color);
    color: var(--key-active-color);
    box-shadow: 0 0 8px var(--glow-color);
  }

  .kb-key.special .active-char {
    font-size: 15px;
    color: var(--key-text);
  }

  .kb-globe-btn {
    position: absolute;
    left: 130px;
    bottom: 14px;
    background: var(--key-bg);
    border: 2px solid var(--key-border);
    border-bottom: 3px solid var(--key-border-bottom);
    border-radius: 8px;
    color: var(--key-text);
    font-family: inherit;
    font-size: 14px;
    padding: 10px 12px;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    z-index: 2;
  }

  .kb-globe-btn:hover {
    border-color: #777;
  }

  .kb-globe-btn[hidden] {
    display: none;
  }

  @media (max-width: 700px) {
    .kb-key {
      min-width: 30px;
      height: 46px;
    }
    .kb-key .active-char { font-size: 24px; }
    .kb-key .inactive-char { font-size: 14px; top: 2px; right: 3px; }
    .kb-key.space { min-width: 120px; }
    .kb-key.shift, .kb-key.backspace, .kb-key.enter, .kb-key.lang-toggle {
      min-width: 50px;
    }
    .kb-panel { padding: 6px 4px 10px; }
    .kb-row { gap: 3px; }
    .kb-rows { gap: 4px; }
    .kb-globe-btn { left: 110px; font-size: 12px; padding: 8px 10px; }
  }
`;

const LANGUAGE_DEFS = {
  en: { name: 'English', code: 'EN', digraphs: {} },
  uk: { name: 'Ukrainian', code: 'UA', digraphs: {} },
  de: {
    name: 'German', code: 'DE',
    digraphs: {
      'ae': 'ä', 'Ae': 'Ä', 'AE': 'Ä',
      'oe': 'ö', 'Oe': 'Ö', 'OE': 'Ö',
      'ue': 'ü', 'Ue': 'Ü', 'UE': 'Ü',
      'ss': 'ß',
    },
  },
  es: {
    name: 'Spanish', code: 'ES',
    digraphs: {
      'n~': 'ñ', 'N~': 'Ñ',
      "a'": 'á', "e'": 'é', "i'": 'í', "o'": 'ó', "u'": 'ú',
      "A'": 'Á', "E'": 'É', "I'": 'Í', "O'": 'Ó', "U'": 'Ú',
      'u"': 'ü', 'U"': 'Ü',
    },
  },
  fr: {
    name: 'French', code: 'FR',
    digraphs: {
      "e'": 'é', "E'": 'É',
      'a`': 'à', 'A`': 'À', 'e`': 'è', 'E`': 'È', 'u`': 'ù', 'U`': 'Ù',
      'a^': 'â', 'A^': 'Â', 'e^': 'ê', 'E^': 'Ê',
      'i^': 'î', 'I^': 'Î', 'o^': 'ô', 'O^': 'Ô', 'u^': 'û', 'U^': 'Û',
      'c,': 'ç', 'C,': 'Ç',
      'e"': 'ë', 'E"': 'Ë', 'i"': 'ï', 'I"': 'Ï', 'u"': 'ü', 'U"': 'Ü',
    },
  },
  it: {
    name: 'Italian', code: 'IT',
    digraphs: {
      'a`': 'à', 'A`': 'À', 'e`': 'è', 'E`': 'È',
      'i`': 'ì', 'I`': 'Ì', 'o`': 'ò', 'O`': 'Ò', 'u`': 'ù', 'U`': 'Ù',
      "e'": 'é', "E'": 'É',
    },
  },
};

class BilingualKeyboard extends HTMLElement {
  static get observedAttributes() {
    return ['active-lang', 'input-mode', 'visible', 'latin-lang', 'enabled-latin-langs', 'live-type-keys'];
  }

  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
    this._shifted = false;          // virtual Shift toggle state
    this._physicalShifted = false;  // physical Shift currently held down
    this._capsLockOn = false;       // last-observed CapsLock state
    this._boundTarget = null;
    this._panelHeight = 340;

    // Build code → keyObj lookup map for LiveType mode
    this._codeMap = new Map();
    for (const row of keymap) {
      for (const keyObj of row) {
        if (keyObj.code) {
          this._codeMap.set(keyObj.code, keyObj);
        }
      }
    }

    // Map from code → DOM key element for flash effect
    this._codeToKeyEl = new Map();

    // Build shadow DOM
    const style = document.createElement('style');
    style.textContent = STYLES;
    this._shadow.appendChild(style);

    // Toggle button (wrapped for draggability + dismiss button as sibling)
    this._toggleWrap = document.createElement('div');
    this._toggleWrap.className = 'kb-toggle-wrap';

    this._toggleBtn = document.createElement('button');
    this._toggleBtn.className = 'kb-toggle-btn';
    this._toggleBtn.textContent = '\u2328\uFE0F';
    this._toggleBtn.setAttribute('aria-label', 'Toggle keyboard');
    this._toggleWrap.appendChild(this._toggleBtn);

    this._dismissBtn = document.createElement('button');
    this._dismissBtn.className = 'kb-dismiss-btn';
    this._dismissBtn.textContent = '\u00D7';
    this._dismissBtn.setAttribute('aria-label', 'Hide keyboard button');
    this._dismissBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleWrap.classList.add('dismissed');
    });
    this._dismissBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    this._toggleWrap.appendChild(this._dismissBtn);

    // Drag/click logic on the toggle button
    let dragStartX = 0, dragStartY = 0, dragOriginX = 0, dragOriginY = 0;
    let isPointerDown = false, dragMoved = false;
    const DRAG_THRESHOLD = 5;
    this._toggleBtn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      isPointerDown = true;
      dragMoved = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const rect = this._toggleWrap.getBoundingClientRect();
      dragOriginX = rect.left;
      dragOriginY = rect.top;
      this._toggleBtn.setPointerCapture(e.pointerId);
    });
    this._toggleBtn.addEventListener('pointermove', (e) => {
      if (!isPointerDown) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      if (!dragMoved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
        dragMoved = true;
        this._toggleWrap.classList.add('dragging');
      }
      if (dragMoved) {
        const newX = Math.max(0, Math.min(window.innerWidth - 56, dragOriginX + dx));
        const newY = Math.max(0, Math.min(window.innerHeight - 56, dragOriginY + dy));
        this._toggleWrap.style.left = newX + 'px';
        this._toggleWrap.style.top = newY + 'px';
        this._toggleWrap.style.right = 'auto';
        this._toggleWrap.style.bottom = 'auto';
      }
    });
    this._toggleBtn.addEventListener('pointerup', (e) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      this._toggleWrap.classList.remove('dragging');
      try { this._toggleBtn.releasePointerCapture(e.pointerId); } catch (_) {}
      if (dragMoved) {
        // Persist position
        try {
          const rect = this._toggleWrap.getBoundingClientRect();
          localStorage.setItem('bilang-kb-pos', JSON.stringify({ x: rect.left, y: rect.top }));
        } catch (_) {}
      } else {
        // Treat as click
        this._toggleVisible();
      }
    });

    this._shadow.appendChild(this._toggleWrap);

    // Restore saved position
    try {
      const saved = localStorage.getItem('bilang-kb-pos');
      if (saved) {
        const { x, y } = JSON.parse(saved);
        if (typeof x === 'number' && typeof y === 'number') {
          this._toggleWrap.style.left = x + 'px';
          this._toggleWrap.style.top = y + 'px';
          this._toggleWrap.style.right = 'auto';
          this._toggleWrap.style.bottom = 'auto';
        }
      }
    } catch (_) {}

    // Panel
    this._panel = document.createElement('div');
    this._panel.className = 'kb-panel';
    this._shadow.appendChild(this._panel);

    // Close button (top-right of panel) — replaces the floating toggle when open
    this._closeBtn = document.createElement('button');
    this._closeBtn.className = 'kb-close-btn';
    this._closeBtn.textContent = '×';
    this._closeBtn.setAttribute('aria-label', 'Close keyboard');
    this._closeBtn.addEventListener('click', () => { this.visible = false; });
    this._panel.appendChild(this._closeBtn);

    // LiveType toggle button (pinned to left of panel)
    this._liveTypeBtn = document.createElement('button');
    this._liveTypeBtn.className = 'kb-livetype-btn';
    this._liveTypeBtn.textContent = 'LiveType';
    this._liveTypeBtn.addEventListener('click', () => {
      if (this.inputMode === 'live-type') {
        this.setAttribute('input-mode', 'bound');
      } else {
        this.setAttribute('input-mode', 'live-type');
      }
    });
    this._panel.appendChild(this._liveTypeBtn);

    // Globe (Latin language cycle) button — only visible when >1 Latin lang enabled
    this._globeBtn = document.createElement('button');
    this._globeBtn.className = 'kb-globe-btn';
    this._globeBtn.hidden = true;
    this._globeBtn.addEventListener('click', () => this._cycleLatinLang());
    this._panel.appendChild(this._globeBtn);

    // Internal textarea area
    this._internalArea = document.createElement('div');
    this._internalArea.className = 'kb-internal-area';
    this._internalTextarea = document.createElement('textarea');
    this._internalTextarea.className = 'kb-internal-textarea';
    this._internalTextarea.placeholder = 'Type here...';
    this._copyBtn = document.createElement('button');
    this._copyBtn.className = 'kb-copy-btn';
    this._copyBtn.textContent = 'Copy';
    this._copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(this._internalTextarea.value).then(() => {
        this._copyBtn.textContent = 'Copied!';
        setTimeout(() => { this._copyBtn.textContent = 'Copy'; }, 1200);
      });
    });
    this._internalArea.appendChild(this._internalTextarea);
    this._internalArea.appendChild(this._copyBtn);
    this._panel.appendChild(this._internalArea);

    // Keyboard rows container
    this._rowsContainer = document.createElement('div');
    this._rowsContainer.className = 'kb-rows';
    this._panel.appendChild(this._rowsContainer);

    // Bound input tracking (supports INPUT, TEXTAREA, and contenteditable elements).
    // The visual highlight is only applied while the keyboard panel is open,
    // and uses outline (not box-shadow) so it doesn't render as full-width
    // horizontal lines on contenteditable elements that extend edge-to-edge.
    this._onFocusIn = (e) => {
      if (this.inputMode !== 'bound' && this.inputMode !== 'live-type') return;
      const t = e.target;
      const isContentEditable = t && t.isContentEditable && !this._shadow.contains(t);
      const isFormInput = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') && t !== this._internalTextarea;
      if (isContentEditable || isFormInput) {
        this._unhighlightBoundTarget();
        this._boundTarget = t;
        if (this.visible) this._highlightBoundTarget();
      }
    };

    this._onFocusOut = (e) => {
      // Clear the visual highlight when the bound target loses focus,
      // but keep the bound-target reference for typing routing.
      // (Pages with multiple inputs shouldn't have a stuck highlight on
      // an unfocused element.)
      if (e.target === this._boundTarget) {
        this._unhighlightBoundTarget();
      }
    };

    // Track physical Shift held + CapsLock state so the keyboard's key
    // labels can reflect what the user would actually produce. This runs
    // whenever the panel is visible — it's purely a visual sync.
    this._onModifierKeydown = (e) => {
      if (!this.visible) return;
      let changed = false;
      const newCaps = !!(e.getModifierState && e.getModifierState('CapsLock'));
      if (newCaps !== this._capsLockOn) {
        this._capsLockOn = newCaps;
        changed = true;
      }
      if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !this._physicalShifted) {
        this._physicalShifted = true;
        changed = true;
      }
      if (changed) this._render();
    };
    this._onModifierKeyup = (e) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (this._physicalShifted) {
          this._physicalShifted = false;
          if (this.visible) this._render();
        }
      }
    };
    this._onWindowBlur = () => {
      // If the user alt-tabs while holding Shift, we'd never see the keyup —
      // reset on blur so the labels don't get stuck.
      if (this._physicalShifted) {
        this._physicalShifted = false;
        if (this.visible) this._render();
      }
    };

    // LiveType mode keydown handler — intercepts physical keystrokes
    // and inserts the active language's character via _insertChar.
    // Only active while the keyboard panel is visible: closing the panel
    // should immediately stop intercepting keystrokes, even if input-mode
    // remains 'live-type' (so reopening resumes where the user left off).
    this._onLiveTypeKeydown = (e) => {
      if (this.inputMode !== 'live-type') return;
      if (!this.visible) return;
      // Don't intercept modifier combos
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const keyObj = this._codeMap.get(e.code);
      if (!keyObj) return; // Let non-mapped keys (Enter, Backspace, arrows, etc.) through

      e.preventDefault();

      // Determine effective shift state from physical shift, virtual shift,
      // and caps lock (caps lock only affects alphabetic keys).
      const isAlpha = /^Key[A-Z]$/.test(e.code);
      const capsLock = e.getModifierState && e.getModifierState('CapsLock');
      const baseShift = e.shiftKey || this._shifted;
      const shifted = isAlpha ? (baseShift !== capsLock) : baseShift;

      // Output the active language's character
      const lang = this.activeLang;
      const char = lang === 'uk'
        ? (shifted ? keyObj.ukShift : keyObj.uk)
        : (shifted ? keyObj.enShift : keyObj.en);
      this._insertChar(char);

      // Flash the corresponding virtual key
      const keyEl = this._codeToKeyEl.get(e.code);
      if (keyEl) {
        keyEl.classList.add('flash');
        setTimeout(() => keyEl.classList.remove('flash'), 120);
      }

      // Clear virtual shift after one keystroke (mirrors virtual click behavior)
      if (this._shifted) {
        this._shifted = false;
        this._render();
      }
    };

    this._render();
  }

  connectedCallback() {
    document.addEventListener('focusin', this._onFocusIn, true);
    document.addEventListener('focusout', this._onFocusOut, true);
    document.addEventListener('keydown', this._onLiveTypeKeydown, true);
    document.addEventListener('keydown', this._onModifierKeydown, true);
    document.addEventListener('keyup', this._onModifierKeyup, true);
    window.addEventListener('blur', this._onWindowBlur);

    // Set defaults
    if (!this.hasAttribute('active-lang')) this.setAttribute('active-lang', 'uk');
    if (!this.hasAttribute('input-mode')) this.setAttribute('input-mode', 'live-type');
    if (!this.hasAttribute('latin-lang')) this.setAttribute('latin-lang', 'en');
    if (!this.hasAttribute('enabled-latin-langs')) this.setAttribute('enabled-latin-langs', 'en');
    this._updateGlobeButton();

    // Measure panel height after first render
    requestAnimationFrame(() => {
      this._updatePanelHeight();
    });
  }

  disconnectedCallback() {
    document.removeEventListener('focusin', this._onFocusIn, true);
    document.removeEventListener('focusout', this._onFocusOut, true);
    document.removeEventListener('keydown', this._onLiveTypeKeydown, true);
    document.removeEventListener('keydown', this._onModifierKeydown, true);
    document.removeEventListener('keyup', this._onModifierKeyup, true);
    window.removeEventListener('blur', this._onWindowBlur);
    this._clearBodyPadding();
    this._unhighlightBoundTarget();
    this._boundTarget = null;
  }

  // Compute the effective shift state for a given key.
  // Caps Lock affects letter keys (XOR with shift); non-letter keys ignore Caps Lock.
  _shiftedFor(keyObj) {
    const code = keyObj && keyObj.code;
    const isAlpha = !!(code && /^Key[A-Z]$/.test(code));
    const baseShift = !!(this._shifted || this._physicalShifted);
    return isAlpha ? (baseShift !== this._capsLockOn) : baseShift;
  }

  _highlightBoundTarget() {
    const t = this._boundTarget;
    if (!t) return;
    if (t._prevOutline === undefined) t._prevOutline = t.style.outline;
    if (t._prevOutlineOffset === undefined) t._prevOutlineOffset = t.style.outlineOffset;
    t.style.outline = '2px solid rgba(126, 200, 227, 0.6)';
    t.style.outlineOffset = '2px';
  }

  _unhighlightBoundTarget() {
    const t = this._boundTarget;
    if (!t) return;
    t.style.outline = t._prevOutline || '';
    t.style.outlineOffset = t._prevOutlineOffset || '';
    delete t._prevOutline;
    delete t._prevOutlineOffset;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'visible') {
      this._updateVisibility();
    }
    if (name === 'active-lang' || name === 'input-mode' || name === 'latin-lang' || name === 'live-type-keys') {
      this._render();
    }
    if (name === 'latin-lang' || name === 'enabled-latin-langs') {
      this._updateGlobeButton();
    }
    if (name === 'input-mode') {
      this._updateInternalArea();
      // Clear bound highlight if switching away from bound/live-type modes
      if (newVal !== 'bound' && newVal !== 'live-type') {
        this._unhighlightBoundTarget();
        this._boundTarget = null;
      }
    }
  }

  get activeLang() { return this.getAttribute('active-lang') || 'uk'; }
  set activeLang(v) { this.setAttribute('active-lang', v); }

  get inputMode() { return this.getAttribute('input-mode') || 'live-type'; }
  set inputMode(v) { this.setAttribute('input-mode', v); }

  get visible() { return this.hasAttribute('visible'); }
  set visible(v) {
    if (v) this.setAttribute('visible', '');
    else this.removeAttribute('visible');
  }

  get latinLang() { return this.getAttribute('latin-lang') || 'en'; }
  set latinLang(v) { this.setAttribute('latin-lang', v); }

  get enabledLatinLangs() {
    const raw = this.getAttribute('enabled-latin-langs') || 'en';
    return raw.split(',').map(s => s.trim()).filter(s => s && LANGUAGE_DEFS[s]);
  }

  _cycleLatinLang() {
    const enabled = this.enabledLatinLangs;
    if (enabled.length <= 1) return;
    const current = this.latinLang;
    const idx = enabled.indexOf(current);
    const nextIdx = (idx === -1 ? 0 : (idx + 1) % enabled.length);
    const next = enabled[nextIdx];
    this.setAttribute('latin-lang', next);
    this.dispatchEvent(new CustomEvent('latin-lang-change', {
      detail: { lang: next },
      bubbles: true, composed: true
    }));
  }

  _updateGlobeButton() {
    if (!this._globeBtn) return;
    const enabled = this.enabledLatinLangs;
    if (enabled.length > 1) {
      this._globeBtn.hidden = false;
      const def = LANGUAGE_DEFS[this.latinLang] || LANGUAGE_DEFS.en;
      this._globeBtn.textContent = `🌐 ${def.code}`;
    } else {
      this._globeBtn.hidden = true;
    }
  }

  _toggleVisible() {
    this.visible = !this.visible;
  }

  _updateVisibility() {
    const isVisible = this.visible;
    if (isVisible) {
      this._panel.classList.add('visible');
      this._toggleWrap.classList.add('open');
      // Un-dismiss whenever the keyboard is shown — gives users an escape
      // hatch if they previously dismissed the floating button.
      this._toggleWrap.classList.remove('dismissed');
      // Highlight the bound input only while the keyboard is open.
      this._highlightBoundTarget();
      requestAnimationFrame(() => this._updatePanelHeight());
      this._setBodyPadding();
      // After the slide-up transition, scroll the bound input into view
      // if it's currently obscured by (or below) the keyboard's top edge.
      setTimeout(() => {
        const target = this._boundTarget;
        if (!target || !this.visible) return;
        const rect = target.getBoundingClientRect();
        const panelTop = window.innerHeight - this._panel.offsetHeight;
        // Skip if the input sits comfortably above the keyboard's top edge.
        if (rect.bottom <= panelTop && rect.top >= 0) return;
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 380);
    } else {
      this._panel.classList.remove('visible');
      this._toggleWrap.classList.remove('open');
      this._clearBodyPadding();
      // Clear input highlight when the keyboard closes.
      this._unhighlightBoundTarget();
    }
    this.dispatchEvent(new CustomEvent('visibility-change', {
      detail: { visible: isVisible },
      bubbles: true, composed: true
    }));
  }

  _updatePanelHeight() {
    const h = this._panel.offsetHeight;
    if (h > 0) {
      this._panelHeight = h;
      if (this.visible) this._setBodyPadding();
    }
  }

  _setBodyPadding() {
    document.body.style.paddingBottom = this._panelHeight + 'px';
  }

  _clearBodyPadding() {
    document.body.style.paddingBottom = '';
  }

  _updateInternalArea() {
    if (this.inputMode === 'internal') {
      this._internalArea.classList.add('active');
    } else {
      this._internalArea.classList.remove('active');
    }
  }

  _getTargetElement() {
    const mode = this.inputMode;
    if (mode === 'internal') {
      return this._internalTextarea;
    }
    if (mode === 'bound' || mode === 'live-type') {
      return this._boundTarget;
    }
    // focus mode
    const el = document.activeElement;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) {
      return el;
    }
    return null;
  }

  _insertChar(char) {
    const el = this._getTargetElement();
    if (!el) return;

    // Contenteditable: route through execCommand so React/Vue/etc. see the change.
    // Note: digraph composition is currently INPUT/TEXTAREA-only because reading the
    // previous character from a Selection in arbitrary contenteditable DOM is non-trivial.
    if (el.isContentEditable) {
      el.focus();
      document.execCommand('insertText', false, char);
      this.dispatchEvent(new CustomEvent('key-input', {
        detail: { char, lang: this.activeLang },
        bubbles: true, composed: true
      }));
      return;
    }

    // Digraph composition: only when Latin side is active and a non-English Latin lang is selected.
    const latinLang = this.latinLang;
    const activeLang = this.activeLang;
    if (activeLang === 'en' && latinLang !== 'en') {
      const digraphs = (LANGUAGE_DEFS[latinLang] && LANGUAGE_DEFS[latinLang].digraphs) || {};
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      // Only compose for single-char inserts with a collapsed cursor and an actual previous char.
      if (start === end && start > 0 && char.length === 1) {
        const prevChar = el.value[start - 1];
        const digraph = prevChar + char;
        const replacement = digraphs[digraph];
        if (replacement) {
          el.value = el.value.slice(0, start - 1) + replacement + el.value.slice(start);
          const newPos = (start - 1) + replacement.length;
          el.selectionStart = el.selectionEnd = newPos;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          this.dispatchEvent(new CustomEvent('key-input', {
            detail: { char: replacement, lang: 'en', composed: digraph },
            bubbles: true, composed: true
          }));
          return;
        }
      }
    }

    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const val = el.value;
    el.value = val.slice(0, start) + char + val.slice(end);
    const newPos = start + char.length;
    el.selectionStart = el.selectionEnd = newPos;

    // Trigger input event so frameworks detect the change
    el.dispatchEvent(new Event('input', { bubbles: true }));

    this.dispatchEvent(new CustomEvent('key-input', {
      detail: { char, lang: this.activeLang },
      bubbles: true, composed: true
    }));
  }

  _doBackspace() {
    const el = this._getTargetElement();
    if (!el) return;

    if (el.isContentEditable) {
      el.focus();
      document.execCommand('delete', false);
      return;
    }

    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const val = el.value;

    if (start !== end) {
      el.value = val.slice(0, start) + val.slice(end);
      el.selectionStart = el.selectionEnd = start;
    } else if (start > 0) {
      el.value = val.slice(0, start - 1) + val.slice(start);
      el.selectionStart = el.selectionEnd = start - 1;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  _toggleLang() {
    const newLang = this.activeLang === 'en' ? 'uk' : 'en';
    this.setAttribute('active-lang', newLang);
    this.dispatchEvent(new CustomEvent('lang-change', {
      detail: { lang: newLang },
      bubbles: true, composed: true
    }));
  }

  _toggleShift() {
    this._shifted = !this._shifted;
    this._render();
  }

  _handleKeyPress(keyObj) {
    const lang = this.activeLang;
    const shifted = this._shiftedFor(keyObj);
    let char;
    if (lang === 'en') {
      char = shifted ? keyObj.enShift : keyObj.en;
    } else {
      char = shifted ? keyObj.ukShift : keyObj.uk;
    }
    this._insertChar(char);

    // Auto-unshift the virtual Shift toggle after one keypress
    // (physical Shift still held will keep producing shifted output)
    if (this._shifted) {
      this._shifted = false;
      this._render();
    }
  }

  _render() {
    const lang = this.activeLang;
    const isLiveType = this.inputMode === 'live-type';
    // Diagonal layout is opt-in via live-type-keys="diagonal"; otherwise LiveType
    // renders keys identically to normal mode (only the highlighted LiveType button signals state).
    const useDiagonal = isLiveType && this.getAttribute('live-type-keys') === 'diagonal';

    // Clear keyboard rows
    this._rowsContainer.innerHTML = '';
    this._codeToKeyEl.clear();

    // Update internal area visibility
    this._updateInternalArea();

    // Sync LiveType button state
    if (this._liveTypeBtn) {
      this._liveTypeBtn.classList.toggle('active', isLiveType);
    }

    // Build each row from keymap
    for (let ri = 0; ri < keymap.length; ri++) {
      const row = keymap[ri];
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';

      // Add shift at start of row 3 (bottom letter row)
      if (ri === 3) {
        const shiftKey = this._createSpecialKey('Shift', 'shift', () => this._toggleShift());
        if (this._shifted) shiftKey.classList.add('active-shift');
        rowEl.appendChild(shiftKey);
      }

      for (const keyObj of row) {
        const keyEl = document.createElement('div');
        keyEl.className = 'kb-key';
        const shifted = this._shiftedFor(keyObj);

        if (useDiagonal) {
          // Diagonal split: active lang top-left (primary), inactive bottom-right (secondary)
          const primaryChar = document.createElement('span');
          primaryChar.className = 'diag-primary';
          const secondaryChar = document.createElement('span');
          secondaryChar.className = 'diag-secondary';

          if (lang === 'uk') {
            primaryChar.textContent = shifted ? keyObj.ukShift : keyObj.uk;
            secondaryChar.textContent = shifted ? keyObj.enShift : keyObj.en;
          } else {
            primaryChar.textContent = shifted ? keyObj.enShift : keyObj.en;
            secondaryChar.textContent = shifted ? keyObj.ukShift : keyObj.uk;
          }

          keyEl.appendChild(primaryChar);
          keyEl.appendChild(secondaryChar);
        } else {
          const activeChar = document.createElement('span');
          activeChar.className = 'active-char';
          const inactiveChar = document.createElement('span');
          inactiveChar.className = 'inactive-char';

          let aChar, iChar;
          if (lang === 'en') {
            aChar = shifted ? keyObj.enShift : keyObj.en;
            iChar = shifted ? keyObj.ukShift : keyObj.uk;
          } else {
            aChar = shifted ? keyObj.ukShift : keyObj.uk;
            iChar = shifted ? keyObj.enShift : keyObj.en;
          }

          activeChar.textContent = aChar;
          inactiveChar.textContent = iChar;

          keyEl.appendChild(activeChar);
          keyEl.appendChild(inactiveChar);
        }

        keyEl.addEventListener('pointerdown', (e) => {
          e.preventDefault(); // Prevent stealing focus from input
          if (isLiveType) {
            // In LiveType mode, virtual key clicks insert active language char.
            // Use the same combined shift logic as the labels (caps lock + shift).
            const sh = this._shiftedFor(keyObj);
            const char = lang === 'uk'
              ? (sh ? keyObj.ukShift : keyObj.uk)
              : (sh ? keyObj.enShift : keyObj.en);
            this._insertChar(char);
            if (this._shifted) { this._shifted = false; this._render(); }
          } else {
            this._handleKeyPress(keyObj);
          }
        });

        // Track code → element mapping for flash effect
        if (keyObj.code) {
          this._codeToKeyEl.set(keyObj.code, keyEl);
        }

        rowEl.appendChild(keyEl);
      }

      this._rowsContainer.appendChild(rowEl);
    }

    // Row 4: functional row
    const funcRow = document.createElement('div');
    funcRow.className = 'kb-row';

    // Language toggle \u2014 label reflects current Latin lang (e.g., DE\u2194UA)
    const latinDef = LANGUAGE_DEFS[this.latinLang] || LANGUAGE_DEFS.en;
    const langKey = this._createSpecialKey(
      `${latinDef.code}\u2194UA`,
      'lang-toggle',
      () => this._toggleLang()
    );
    funcRow.appendChild(langKey);

    // Space
    const spaceKey = document.createElement('div');
    spaceKey.className = 'kb-key space';
    const spaceLabel = document.createElement('span');
    spaceLabel.className = 'active-char';
    spaceLabel.textContent = ' ';
    spaceLabel.style.opacity = '0.3';
    spaceLabel.textContent = '␣';
    spaceKey.appendChild(spaceLabel);
    spaceKey.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this._insertChar(' ');
      if (this._shifted) { this._shifted = false; this._render(); }
    });
    funcRow.appendChild(spaceKey);

    // Backspace
    const bsKey = this._createSpecialKey('⌫', 'backspace', () => {
      this._doBackspace();
    });
    funcRow.appendChild(bsKey);

    // Enter
    const enterKey = this._createSpecialKey('Enter', 'enter', () => {
      this._insertChar('\n');
      if (this._shifted) { this._shifted = false; this._render(); }
    });
    funcRow.appendChild(enterKey);

    this._rowsContainer.appendChild(funcRow);
  }

  _createSpecialKey(label, className, handler) {
    const keyEl = document.createElement('div');
    keyEl.className = `kb-key special ${className}`;
    const span = document.createElement('span');
    span.className = 'active-char';
    span.textContent = label;
    keyEl.appendChild(span);
    keyEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handler();
    });
    return keyEl;
  }
}

// Defensive registration: only define if no other source (website embed,
// userscript, or extension) has already registered the element. First
// source to load wins — later sources should defer politely. The
// window.__bilangSlidekeys__ flag lets external code detect that the
// component is already present and skip its own injection.
if (!customElements.get('bilingual-keyboard')) {
  customElements.define('bilingual-keyboard', BilingualKeyboard);
  if (typeof window !== 'undefined') {
    // Preserve a previously-set `source` (e.g. by a userscript or extension
    // wrapping this code), but mark registered=true now that define succeeded.
    if (!window.__bilangSlidekeys__) {
      window.__bilangSlidekeys__ = { source: 'embed', version: '1.0.0' };
    }
    window.__bilangSlidekeys__.registered = true;
  }
}


/* ─── Userscript launcher ─── */
(function () {
  /* ============================================================
   * CONFIG
   *
   * HOTKEY — keyboard combo that summons the keyboard.
   *   Format: "Ctrl+", "Shift+", "Alt+", "Meta+" prefixes + a
   *   KeyboardEvent.code value (e.g. "KeyK", "Backquote", "Slash").
   *   Default 'Ctrl+Shift+Backquote' is the least conflicty option.
   *   Set to '' to disable.
   *
   * The script does NOT show up automatically on web pages. Use the
   * Tampermonkey extension menu (click the TM icon) to:
   *   • "Toggle keyboard here" — show/hide on this page (resets on reload)
   *   • "Always enable on [hostname]" — persistent per-site
   * The hotkey also works as an alternate trigger.
   * ============================================================ */
  const HOTKEY = 'Ctrl+Shift+Backquote';

  const STORAGE_KEY = 'bilang-slidekeys-always-enabled';

  function readAlwaysEnabled() {
    try {
      const raw = (typeof GM_getValue === 'function')
        ? GM_getValue(STORAGE_KEY, '[]')
        : (localStorage.getItem(STORAGE_KEY) || '[]');
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (_) { return []; }
  }

  function writeAlwaysEnabled(list) {
    const json = JSON.stringify(list);
    try {
      if (typeof GM_setValue === 'function') GM_setValue(STORAGE_KEY, json);
      else localStorage.setItem(STORAGE_KEY, json);
    } catch (_) {}
  }

  const hostname = location.hostname;
  function isAlwaysEnabledHere() { return readAlwaysEnabled().includes(hostname); }

  function inject() {
    if (document.querySelector('bilingual-keyboard')) return;
    const kb = document.createElement('bilingual-keyboard');
    kb.setAttribute('active-lang', 'uk');
    kb.setAttribute('input-mode', 'live-type');
    kb.setAttribute('latin-lang', 'en');
    kb.setAttribute('enabled-latin-langs', 'en');
    document.body.appendChild(kb);
  }

  function remove() {
    const existing = document.querySelector('bilingual-keyboard');
    if (existing) existing.remove();
  }

  function ensureInjected() {
    if (document.body) inject();
    else document.addEventListener('DOMContentLoaded', inject, { once: true });
  }

  // Auto-inject on always-enabled hosts
  if (isAlwaysEnabledHere()) ensureInjected();

  // ─── Tampermonkey menu commands ───
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Toggle keyboard here', () => {
      if (document.querySelector('bilingual-keyboard')) remove();
      else inject();
    });
    const alwaysCmdLabel = isAlwaysEnabledHere()
      ? 'Stop always-enabling on ' + hostname
      : 'Always enable on ' + hostname;
    GM_registerMenuCommand(alwaysCmdLabel, () => {
      const list = readAlwaysEnabled();
      const nowEnabled = !list.includes(hostname);
      const next = nowEnabled
        ? list.concat([hostname])
        : list.filter(h => h !== hostname);
      writeAlwaysEnabled(next);
      if (nowEnabled) ensureInjected();
      else remove();
      // The menu label won't update until the page reloads — TM API limitation.
      // Use a brief notification so the user knows their click took effect.
      try {
        const note = document.createElement('div');
        note.textContent = nowEnabled
          ? 'bilang-slidekeys: will auto-enable on ' + hostname + ' from now on'
          : 'bilang-slidekeys: disabled auto-enable on ' + hostname;
        Object.assign(note.style, {
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          background: '#1e1e2e', color: '#7ec8e3', padding: '12px 20px',
          borderRadius: '8px', border: '1px solid #555', fontSize: '14px',
          fontFamily: 'system-ui, sans-serif', zIndex: '100002',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        });
        document.body.appendChild(note);
        setTimeout(() => note.remove(), 3000);
      } catch (_) {}
    });
  }

  // ─── Hotkey ───
  function parseHotkey(str) {
    if (!str) return null;
    const parts = str.split('+').map(s => s.trim());
    const code = parts.pop();
    return {
      code,
      ctrl: parts.includes('Ctrl'),
      shift: parts.includes('Shift'),
      alt: parts.includes('Alt'),
      meta: parts.includes('Meta'),
    };
  }
  const hk = parseHotkey(HOTKEY);

  if (hk) {
    document.addEventListener('keydown', (e) => {
      if (e.code !== hk.code) return;
      if (!!e.ctrlKey !== hk.ctrl) return;
      if (!!e.shiftKey !== hk.shift) return;
      if (!!e.altKey !== hk.alt) return;
      if (!!e.metaKey !== hk.meta) return;
      e.preventDefault();
      let kb = document.querySelector('bilingual-keyboard');
      if (!kb) {
        // Hotkey on a non-enabled page: inject and show panel
        inject();
        kb = document.querySelector('bilingual-keyboard');
        if (kb) kb.setAttribute('visible', '');
        return;
      }
      if (kb.hasAttribute('visible')) kb.removeAttribute('visible');
      else kb.setAttribute('visible', '');
    });
  }
})();

})();
