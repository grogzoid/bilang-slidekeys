#!/usr/bin/env node
/**
 * Bundle the web component + layouts into a single userscript.
 * Run: node userscript/build.js
 * Output: userscript/bilang-slidekeys.user.js
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const layouts = readFileSync(resolve(root, 'src/layouts.js'), 'utf8');
const component = readFileSync(resolve(root, 'src/bilingual-keyboard.js'), 'utf8');

// Auto-version: 0.2.<commits-since-v0.2.0>. Counting from the v0.2.0
// git tag means the patch number doesn't drift if commits are squashed
// or rebased, and Tampermonkey's "Check for updates" picks up every push
// because @version always changes.
let commitsSinceTag = '0';
try {
  commitsSinceTag = execSync('git rev-list --count v0.2.0..HEAD', { cwd: root, encoding: 'utf8' }).trim();
} catch (_) {
  // tag missing or git unavailable — keep "0" (yields 0.2.0)
}
const VERSION = `0.3.${commitsSinceTag}`;

// Strip the import statement from component
const componentBody = component
  .replace(/^import\s+\{\s*keymap\s*\}\s+from\s+['"]\.\/layouts\.js['"];?\s*\n/m, '')
  .replace(/\nexport default BilingualKeyboard;\s*$/, '');

// Strip the export from layouts (we'll define keymap as a const)
const layoutsBody = layouts.replace(/^export\s+const\s+keymap/m, 'const keymap');

const header = `// ==UserScript==
// @name         Bilang SlideKeys
// @namespace    https://github.com/grogzoid/bilang-slidekeys
// @version      ${VERSION}
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
`;

const launcher = `
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
`;

const bundle = `${header}
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
  window.__bilangSlidekeys__ = { source: 'userscript', version: '${VERSION}', registered: false };

${layoutsBody}

${componentBody}
${launcher}
})();
`;

writeFileSync(resolve(__dirname, 'bilang-slidekeys.user.js'), bundle);
console.log('Wrote userscript/bilang-slidekeys.user.js (' + bundle.length + ' bytes)');
