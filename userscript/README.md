# Bilang SlideKeys — Userscript

Run the bilingual keyboard on every web page via a userscript manager.

## Install

1. Install **[Tampermonkey](https://www.tampermonkey.net/)** (or [Violentmonkey](https://violentmonkey.github.io/) — open source) in your browser.

2. Open `bilang-slidekeys.user.js` in a browser. The userscript manager will detect it and prompt you to install.

   Direct install URL (when this repo is public): `https://raw.githubusercontent.com/grogzoid/bilang-slidekeys/main/userscript/bilang-slidekeys.user.js`

3. Click **Install**.

## Usage

- A floating ⌨️ button appears in the bottom-right of every page (except excluded sites).
- Click it to slide the keyboard up.
- Click any text input first; the keyboard will type into it.
- **Hotkey:** `Ctrl+Shift+K` toggles the keyboard.

## Excluded sites

The userscript is blocked on these domains by default for safety:

- `chase.com` — banking

To add more exclusions: open the script in your userscript manager's editor and add `// @exclude *://*.example.com/*` lines to the header.

## Updating

After modifying source files (`src/bilingual-keyboard.js` or `src/layouts.js`), rebuild:

```bash
node userscript/build.js
```

The build script bundles the web component + layout data into a single self-contained `.user.js` file.

## How it works

Tampermonkey injects the script into matching pages. The script:

1. Defines the `<bilingual-keyboard>` custom element (Shadow DOM, isolated styles).
2. Inserts an instance into `document.body`.
3. The floating toggle button appears; the keyboard stays hidden until summoned.
4. Adds a `Ctrl+Shift+K` hotkey listener.

The script declares `@grant GM_registerMenuCommand GM_setValue GM_getValue` — these are required for the Tampermonkey menu commands ("Toggle keyboard here", "Always enable on [hostname]") and persistent per-site enable settings. No network/storage access beyond `localStorage` for the floating button position. Shadow DOM ensures the keyboard's styles never conflict with page styles.
