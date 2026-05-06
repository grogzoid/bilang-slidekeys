#!/usr/bin/env node
/**
 * Build the bookmarklet's loaded script from src/.
 *
 * The bookmarklet itself (in bookmarklet/INSTALL.html) is a tiny
 * "javascript:..." URL that fetches this script via jsDelivr and
 * injects it into the current page. So the file produced here is the
 * *full* bundle that does the work; the bookmarklet URL is just a
 * loader.
 *
 * Differences from the Tampermonkey bundle:
 *  - No userscript metadata block
 *  - No GM_* API or unsafeWindow references (bookmarklets run in the
 *    page's own context, so plain window/document are correct)
 *  - The launcher injects the keyboard immediately on first load and
 *    toggles visibility on subsequent invocations
 *
 * Run: node bookmarklet/build.js
 * Output: bookmarklet/bilang-slidekeys.bookmarklet.js
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const layouts = readFileSync(resolve(root, 'src/layouts.js'), 'utf8');
const component = readFileSync(resolve(root, 'src/bilingual-keyboard.js'), 'utf8');

const componentBody = component
  .replace(/^import\s+\{\s*keymap\s*\}\s+from\s+['"]\.\/layouts\.js['"];?\s*\n/m, '')
  .replace(/\nexport default BilingualKeyboard;\s*$/, '');

const layoutsBody = layouts.replace(/^export\s+const\s+keymap/m, 'const keymap');

const launcher = `
/* ─── Bookmarklet launcher ─── */
(function bilangBookmarkletLauncher() {
  // Check politeness flag — defer to a host-page embed or a userscript /
  // extension that already injected.
  if (window.__bilangSlidekeys__) {
    // Already present. Toggle the keyboard panel's visibility instead of
    // re-injecting; that way clicking the bookmarklet on a page where the
    // keyboard is already loaded just shows/hides it.
    const existing = document.querySelector('bilingual-keyboard');
    if (existing) {
      if (existing.hasAttribute('visible')) existing.removeAttribute('visible');
      else existing.setAttribute('visible', '');
    }
    return;
  }

  window.__bilangSlidekeys__ = { source: 'bookmarklet', version: 'BUILD_VERSION', registered: false };

  // Define the custom element and inject an instance.
  function inject() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', inject, { once: true });
      return;
    }
    const kb = document.createElement('bilingual-keyboard');
    kb.setAttribute('active-lang', 'uk');
    kb.setAttribute('input-mode', 'live-type');
    kb.setAttribute('latin-lang', 'en');
    kb.setAttribute('enabled-latin-langs', 'en');
    kb.setAttribute('visible', '');  // open immediately on first click
    document.body.appendChild(kb);
  }
  inject();
})();
`;

const VERSION = `bookmarklet-${new Date().toISOString().slice(0, 10)}`;
const finalLauncher = launcher.replace('BUILD_VERSION', VERSION);

const bundle = `/* bilang-slidekeys bookmarklet bundle
 * Source: https://github.com/grogzoid/bilang-slidekeys
 * Generated: ${new Date().toISOString()}
 *
 * Loaded by the bookmarklet at bookmarklet/INSTALL.html — defines the
 * <bilingual-keyboard> custom element and injects an instance into the
 * current page. Re-running the bookmarklet toggles the panel's visibility
 * instead of re-injecting.
 */
(function () {
  'use strict';

  if (customElements.get('bilingual-keyboard') || window.__bilangSlidekeys__) {
    // Already present from another source — defer.
    const existing = document.querySelector('bilingual-keyboard');
    if (existing) {
      if (existing.hasAttribute('visible')) existing.removeAttribute('visible');
      else existing.setAttribute('visible', '');
    }
    return;
  }

${layoutsBody}

${componentBody}
${finalLauncher}
})();
`;

writeFileSync(resolve(__dirname, 'bilang-slidekeys.bookmarklet.js'), bundle);
console.log('Wrote bookmarklet/bilang-slidekeys.bookmarklet.js (' + bundle.length + ' bytes)');
