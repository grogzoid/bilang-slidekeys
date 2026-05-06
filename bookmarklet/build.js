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
  // If the keyboard is already in the DOM, toggle visibility instead of
  // injecting another instance. (Note: we check the DOM, not the flag,
  // because the component's own customElements.define block also sets the
  // flag — checking the flag would short-circuit on first run.)
  const existing = document.querySelector('bilingual-keyboard');
  if (existing) {
    if (existing.hasAttribute('visible')) existing.removeAttribute('visible');
    else existing.setAttribute('visible', '');
    return;
  }

  // Inject a new instance.
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

// Now produce the inlined bookmarklet URL. We minify with terser, then
// URL-encode and write to bookmarklet/bookmarklet.url. The INSTALL.html
// embeds this as the href so the bookmarklet is fully self-contained
// (works on sites with strict CSP that block third-party script loads).
import { execSync } from 'node:child_process';
const tmpPath = resolve(__dirname, 'bilang-slidekeys.bookmarklet.js');
const minified = execSync(`npx --yes terser "${tmpPath}" --compress --mangle`, {
  encoding: 'utf8',
}).trim();
console.log('Minified to ' + minified.length + ' bytes');

// Wrap in javascript: prefix and percent-encode characters that would
// terminate the URL or break the href attribute.
const bookmarkletUrl = 'javascript:' + encodeURIComponent(minified);
writeFileSync(resolve(__dirname, 'bookmarklet.url'), bookmarkletUrl);
console.log('Wrote bookmarklet/bookmarklet.url (' + bookmarkletUrl.length + ' chars)');

// Also write a small JSON file with metadata the install page can read
// at runtime to avoid duplicating the URL between build.js and HTML.
writeFileSync(resolve(__dirname, 'bookmarklet.meta.json'), JSON.stringify({
  url_first_chars: bookmarkletUrl.slice(0, 80) + '...',
  minified_bytes: minified.length,
  encoded_bytes: bookmarkletUrl.length,
  built_at: new Date().toISOString(),
}, null, 2));

// Splice the bookmarklet URL into INSTALL.html. The template uses the
// marker BOOKMARKLET_HREF — replace it with the actual URL.
const installPath = resolve(__dirname, 'INSTALL.html');
const installHtml = readFileSync(installPath, 'utf8');
// Match an existing href on the .bookmarklet anchor and replace it.
const updated = installHtml.replace(
  /(<a class="bookmarklet" href=")[^"]*(")/,
  (m, pre, post) => pre + bookmarkletUrl.replace(/"/g, '&quot;') + post
);
if (updated === installHtml) {
  console.warn('WARN: did not splice bookmarklet URL into INSTALL.html (anchor not found?)');
} else {
  writeFileSync(installPath, updated);
  console.log('Updated INSTALL.html with the inlined bookmarklet URL');
}
