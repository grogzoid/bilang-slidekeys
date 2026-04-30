# bilang-slidekeys — Technical Implementation

## Repository

- **GitHub**: https://github.com/grogzoid/bilang-slidekeys (private)
- **Local dev path**: `~/claude_sysadmin/bilingual-keyboard/`
- **Owner**: grogzoid (Greg Finney)
- **License**: MIT

## File structure

```
bilingual-keyboard/
├── src/
│   ├── bilingual-keyboard.js   ← The web component (custom element + shadow DOM)
│   ├── layouts.js              ← Keymap data: physical key → {en, uk} character pairs
│   ├── BilingualKeyboard.jsx   ← React wrapper (forwards attrs/events)
│   └── index.js                ← Module exports
├── demo/
│   ├── index.html              ← Mode switcher + Latin language picker demo
│   ├── quiz.html               ← A1 Ukrainian translation quiz
│   ├── chat.html               ← Bilingual chat console demo
│   ├── poetry.html             ← Shevchenko typewriter demo
│   ├── recipe.html             ← Recipe card builder demo
│   └── showreel.html           ← Self-playing animation showreel
├── website/
│   ├── TUTORIAL.md             ← How web developers embed the component
│   └── example/
│       └── index.html          ← Working host-page example with politeness-flag diagnostic
├── userscript/
│   ├── build.js                ← Bundles src/* into a single .user.js
│   ├── bilang-slidekeys.user.js ← Built userscript (committed for direct install)
│   └── README.md               ← Install instructions
├── docs/
│   ├── screenshots/
│   └── icons/                  ← SVG icon concepts (preview.html shows all three)
├── package.json
├── README.md                   ← User-facing readme with screenshots
├── PROJECT.md                  ← Project background, problem, goal, approach (handoff)
├── IMPLEMENTATION.md           ← This file (handoff)
├── TODO.md                     ← Remaining work for Chrome Web Store (handoff)
└── COMPETITORS.md              ← Competitive landscape (handoff)
```

## Component architecture

### Custom element: `<bilingual-keyboard>`

Defined in `src/bilingual-keyboard.js`. Uses `attachShadow({ mode: 'open' })` for full style encapsulation.

### Observed attributes

| Attribute             | Values                                                   | Default     | Purpose                                              |
|-----------------------|----------------------------------------------------------|-------------|------------------------------------------------------|
| `active-lang`         | `en`, `uk`                                               | `uk`        | Which side is "primary" (large char on keys)         |
| `latin-lang`          | `en`, `de`, `es`, `fr`, `it`                             | `en`        | Which Latin language's digraphs are active           |
| `enabled-latin-langs` | comma-separated list                                     | `en`        | What the globe button cycles through                 |
| `input-mode`          | `bound`, `focus`, `internal`, `live-type`                | `live-type` | Where keystrokes go                                  |
| `live-type-keys`      | `''` or `diagonal`                                       | `''`        | Opt-in diagonal key layout for LiveType mode         |
| `visible`             | boolean attribute                                        | absent      | Whether the keyboard panel is shown                  |

### Public events

| Event                  | Detail payload                          |
|------------------------|-----------------------------------------|
| `key-input`            | `{ char, lang, composed? }`             |
| `lang-change`          | `{ lang }`                              |
| `latin-lang-change`    | `{ lang }`                              |
| `visibility-change`    | `{ visible }`                           |

### Input modes

- **`bound`**: listens for `focusin` on INPUT/TEXTAREA/contenteditable; binds to last-focused element. Highlights bound target with a blue glow.
- **`focus`**: targets `document.activeElement` at the moment of input. No persistent binding.
- **`internal`**: shows a built-in textarea above the keys with a Copy button.
- **`live-type`** (default, formerly `intercept`): listens for physical `keydown`, looks up `e.code` in the keymap, prevents default, and inserts the active-lang character into the bound target. Honors physical Shift, virtual Shift, and CapsLock (XOR for alphabetic keys only). Only intercepts while the keyboard panel is visible.

### Latin language registry (`LANGUAGE_DEFS`)

Object literal at the top of `bilingual-keyboard.js`. Each entry has:

```js
{ name: string, code: string, digraphs: { 'pair': 'composed' } }
```

Digraph composition runs in `_insertChar`: when active-lang is `en` and latin-lang is non-English, the previous character + new character is checked against the active language's digraph table. On match, the previous char is replaced with the composed character.

Limitation: digraph composition is **INPUT/TEXTAREA only**. Contenteditable uses `document.execCommand('insertText')` and skips digraphs (would need a Selection-API-based prev-char read, deferred).

### Floating ⌨️ button

- Wrapped in `.kb-toggle-wrap` (positioned fixed by default)
- **Draggable**: pointerdown → pointermove (>5px = drag mode) → pointerup. Position persisted to `localStorage['bilang-kb-pos']`.
- **Dismissable**: small × button (sibling, top-right, semi-overlapping) shown on hover. Click dismisses for the session. Re-summon via the configured hotkey un-dismisses.
- **Hidden when panel is open** (replaced by an in-panel × close button at top-right).
- Constrained to viewport bounds during drag.

### Keyboard panel

- `position: fixed; bottom: 0`, slides up via `transform: translateY()`.
- When opened, scrolls the bound input into view (380ms delay to avoid the slide-up animation).
- LiveType toggle button + globe button pinned to bottom-left of the panel.
- × close button at top-right.

### Layout data (`src/layouts.js`)

Array of arrays (rows of keys). Each key:

```js
{
  en: 'a',         // base lowercase EN char
  enShift: 'A',    // shifted EN char
  uk: 'ф',         // base lowercase UK char
  ukShift: 'Ф',    // shifted UK char
  code: 'KeyA',    // KeyboardEvent.code (used in LiveType lookup)
}
```

Standard QWERTY positions; mapped to the standard Ukrainian Windows layout (ЙЦУКЕН).

## Userscript bundling

`userscript/build.js`:

1. Reads `src/layouts.js` and `src/bilingual-keyboard.js`
2. Strips the import statement and the `export default` from the component
3. Strips `export const` from the layout module
4. Wraps everything in an IIFE inside a userscript metadata header
5. Appends a launcher IIFE that:
   - Defines a `HOTKEY` config string
   - Inserts `<bilingual-keyboard>` into `document.body`
   - Registers the keydown listener for the configured hotkey

Run: `node userscript/build.js` after editing src files. Validate: `node --check userscript/bilang-slidekeys.user.js`.

Bundle size: ~40KB.

## Userscript installation

Via Tampermonkey (or Violentmonkey):

1. Open the local file `userscript/bilang-slidekeys.user.js` in Chrome (requires "Allow access to file URLs" in Tampermonkey extension details for `file://` URLs).
2. Tampermonkey detects the userscript metadata and prompts to install.

For private repo, Tampermonkey can't fetch directly because it doesn't authenticate. Workarounds: load the local file, or paste contents into a manually-created script in the dashboard.

## Excluded sites

The userscript metadata block has hard `@exclude` rules:

```
*://*.chase.com/*
*://chase.com/*
```

The list is intentionally minimal in the public bundle — users add their own sensitive sites (other banks, brokerages, password managers) by editing the script's metadata block in their userscript manager.

These will need to translate to `exclude_matches` in the Chrome extension manifest.

## Configuration in the userscript

A single config block at the top of the launcher in `userscript/bilang-slidekeys.user.js`:

```js
const HOTKEY = 'Ctrl+Shift+Backquote';
```

Format: any combo of `Ctrl+`, `Shift+`, `Alt+`, `Meta+` prefixes followed by a `KeyboardEvent.code`. Empty string disables the hotkey.

## Demo pages

All standalone HTML; no build step. Open via local server (`python3 -m http.server 8801 --directory ~/claude_sysadmin/bilingual-keyboard`).

- `demo/index.html` — interactive: Latin language radio picker, input mode picker, event log
- `demo/quiz.html` — A1 Ukrainian translation quiz with submit/score/show corrections
- `demo/poetry.html` — Shevchenko ghost-text typing practice
- `demo/showreel.html` — self-playing animation, useful for screen recordings

## Politeness contract (multi-source coexistence)

The component supports being loaded from multiple sources on the same page (host-page embed, userscript, Chrome extension). Only one instance should activate. Mechanism:

1. The component file does:
   ```js
   if (!customElements.get('bilingual-keyboard')) {
     customElements.define('bilingual-keyboard', BilingualKeyboard);
     window.__bilangSlidekeys__ ??= { source: 'embed', version: '...' };
     window.__bilangSlidekeys__.registered = true;
   }
   ```
2. The userscript bundle wraps everything in an early-bail check:
   ```js
   if (customElements.get('bilingual-keyboard') || window.__bilangSlidekeys__) return;
   window.__bilangSlidekeys__ = { source: 'userscript', version: '...', registered: false };
   ```
3. The Chrome extension MUST do the same check before injecting (see TODO.md).

Result: **first source to load wins**. Host page embeds always win when present (they execute synchronously during parse, before document-end userscripts). The flag also lets host pages diagnose which source is active for debugging.

## Browser compatibility

- Custom Elements V1: Chrome 67+, Firefox 63+, Safari 10.1+, Edge 79+
- Shadow DOM: same
- `e.getModifierState('CapsLock')`: Chrome 49+
- `document.execCommand('insertText')`: deprecated but supported in all major browsers; required for contenteditable framework compat
- ES modules: all modern browsers

No transpilation needed for modern Chromium. Safari/iOS untested.

## Known limitations

- Digraph composition skipped on contenteditable (would require Selection API rewrite)
- French `oe` ligature (`oe → œ`) and German `oe → ö` would conflict if both languages enabled simultaneously — irrelevant in practice since only one Latin language is active at a time
- LiveType doesn't handle dead keys (out of scope for Ukrainian output)
- Userscript on `file://` pages requires explicit permission in Tampermonkey
- Some sites with strict CSP may break the bundle's inline styles inside Shadow DOM (rare)

## Testing approach

Manual testing via Playwright MCP during development:

- Verified component injection on plain HTML test pages
- Verified shadow DOM creation and rendering
- Verified hotkey binding and panel toggle
- Verified contenteditable insertion path

No automated test suite (yet — would be nice for the extension submission).
