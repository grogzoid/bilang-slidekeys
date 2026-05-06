# bilang-slidekeys bookmarklet

Zero-install distribution: a single bookmark you drag to your browser's bookmarks bar. Click it on any web page to summon the bilingual keyboard.

## Install

Open **[INSTALL.html](https://htmlpreview.github.io/?https://github.com/grogzoid/bilang-slidekeys/blob/main/bookmarklet/INSTALL.html)** in your browser and drag the styled "⌨ Bilang Keyboard" button to your bookmarks bar.

(Or, if you've cloned the repo locally, serve the directory and open `bookmarklet/INSTALL.html`.)

## How it works

The bookmark's URL is a tiny `javascript:` snippet (~250 chars) that:

1. Checks whether the keyboard is already loaded on the current page (via `window.__bilangSlidekeys__`)
2. If not, creates a `<script>` tag pointing at the full bundle on **jsDelivr** (a CDN that mirrors GitHub):
   ```
   https://cdn.jsdelivr.net/gh/grogzoid/bilang-slidekeys@main/bookmarklet/bilang-slidekeys.bookmarklet.js
   ```
3. The full bundle defines the `<bilingual-keyboard>` custom element, creates an instance, and shows the keyboard panel
4. On subsequent clicks, the bookmarklet just toggles the panel's visibility (no re-fetch)

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

- **Strict Content Security Policy** sites may block the third-party script load. Most everyday sites (Gmail, WhatsApp Web, Wikipedia, Twitter, GitHub) work fine.
- **No auto-load** — you click it on each page. For a use-on-every-page experience, see `userscript/INSTALL.md`.
- **WhatsApp Web layout quirks** — same as inline userscript mode. Use the keyboard's pop-out (⧉) button to sidestep this.
