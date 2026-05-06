# bilang-slidekeys bookmarklet

Zero-install distribution: a single bookmark you drag to your browser's bookmarks bar. Click it on any web page to summon the bilingual keyboard.

## Install

Open **[INSTALL.html](https://htmlpreview.github.io/?https://github.com/grogzoid/bilang-slidekeys/blob/main/bookmarklet/INSTALL.html)** in your browser and drag the styled "⌨ Bilang Keyboard" button to your bookmarks bar.

(Or, if you've cloned the repo locally, serve the directory and open `bookmarklet/INSTALL.html`.)

## How it works

The bookmark's URL is a single `javascript:` URL with the **entire keyboard inlined** — minified and URL-encoded into ~46 K characters. No CDN, no remote fetch, no third-party dependency. When you click the bookmark:

1. The `javascript:` URL executes in the page's context (with the page's privileges)
2. If a `<bilingual-keyboard>` element is already in the DOM, toggle its visibility
3. Otherwise, define the custom element class, create an instance, append it to `document.body`

Going inline (vs. the previous CDN-loader design) was necessary because sites with strict Content Security Policy block third-party `<script src=...>` injection. Inline `javascript:` execution sidesteps CSP — the bookmarklet works on Wikipedia, Twitter/X, GitHub, banking sites, anywhere.

## Files in this directory

| File | Purpose |
|---|---|
| `INSTALL.html` | The install page with the draggable button |
| `bilang-slidekeys.bookmarklet.js` | The full bundle that jsDelivr serves (auto-generated) |
| `build.js` | Builds the bundle from `src/` |

## Build

```bash
node bookmarklet/build.js
```

Reads `src/bilingual-keyboard.js` + `src/layouts.js`, strips the ES module syntax, wraps in an IIFE with a launcher that injects the keyboard. Outputs `bookmarklet/bilang-slidekeys.bookmarklet.js`.

## Why the bookmarklet vs. userscript vs. extension

| Method | Effort | Behavior |
|---|---|---|
| Bookmarklet | Drag once | Click per-page on demand |
| Userscript | Install Tampermonkey + script | Auto-loads on opted-in sites |
| Extension (planned) | One-click from Chrome Web Store | Same as userscript without Tampermonkey |

Bookmarklets are great for **testing, research, and casual use** because there's no install commitment and they work in every browser.

## Limitations

- **No auto-load** — you click it on each page. For a use-on-every-page experience, see `../userscript/INSTALL.md`.
- **No auto-update** — the code is frozen in the URL. Re-drag the button from `INSTALL.html` to update.
- **URL length** — the inlined URL is ~46 K characters. Modern browsers (Chrome 80+, Firefox 80+, Edge, modern Safari) handle this; very old or enterprise-restricted builds may truncate.
- **WhatsApp Web layout quirks** — same as inline userscript mode. Use the keyboard's pop-out (⧉) button to sidestep this. See `../docs/INLINE-PUSHUP.md`.
