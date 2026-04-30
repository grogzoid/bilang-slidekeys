# Embed bilang-slidekeys in your website

A drop-in bilingual on-screen keyboard (English / Ukrainian, with optional German, Spanish, French, Italian) for any web page. Zero dependencies, single custom element, Shadow DOM isolation.

## What you'll get

A floating ⌨️ button in the bottom-right of your page. Clicking it slides up a virtual keyboard. Users can:

- Click virtual keys to type into the focused input
- Use their physical keyboard with **LiveType mode** (transliteration: type Latin letters, get Ukrainian output)
- Toggle the active language with one button
- Drag the floating button anywhere; dismiss it for the session

The keyboard works with `<input>`, `<textarea>`, and `contenteditable` elements (Slack-style, Gmail-style, Discord-style rich text editors).

## 30-second integration

1. **Copy two files** into your project: [`bilingual-keyboard.js`](https://github.com/grogzoid/bilang-slidekeys/blob/main/src/bilingual-keyboard.js) and [`layouts.js`](https://github.com/grogzoid/bilang-slidekeys/blob/main/src/layouts.js). Place them in the same directory.

2. **Import the component** as an ES module in your HTML:

   ```html
   <script type="module" src="path/to/bilingual-keyboard.js"></script>
   ```

3. **Drop the element** anywhere in your page (typically near the end of `<body>`):

   ```html
   <bilingual-keyboard active-lang="uk" input-mode="bound"></bilingual-keyboard>
   ```

That's it. The floating button appears, all your inputs are now keyboard-target-aware.

## Configuration via attributes

| Attribute             | Values                                                   | Default  | Purpose                                              |
|-----------------------|----------------------------------------------------------|----------|------------------------------------------------------|
| `active-lang`         | `en`, `uk`                                               | `uk`     | Which side is "primary" (large char on keys)         |
| `latin-lang`          | `en`, `de`, `es`, `fr`, `it`                             | `en`     | Latin language for digraph composition               |
| `enabled-latin-langs` | comma-separated list                                     | `en`     | Languages the globe button cycles through            |
| `input-mode`          | `bound`, `focus`, `internal`, `live-type`                | `bound`  | Where keystrokes go                                  |
| `live-type-keys`      | `''` or `diagonal`                                       | `''`     | Diagonal key layout when LiveType is active          |
| `visible`             | boolean attribute                                        | absent   | Show keyboard panel by default                       |

Example with all options:

```html
<bilingual-keyboard
  active-lang="uk"
  latin-lang="en"
  enabled-latin-langs="en,de,es"
  input-mode="bound"
  live-type-keys="diagonal">
</bilingual-keyboard>
```

## Listening to events

```js
const kb = document.querySelector('bilingual-keyboard');

kb.addEventListener('key-input', (e) => {
  console.log('Typed:', e.detail.char, 'in', e.detail.lang);
});

kb.addEventListener('lang-change', (e) => {
  console.log('Active language changed to:', e.detail.lang);
});

kb.addEventListener('latin-lang-change', (e) => {
  console.log('Latin language changed to:', e.detail.lang);
});

kb.addEventListener('visibility-change', (e) => {
  console.log('Keyboard', e.detail.visible ? 'opened' : 'closed');
});
```

## Programmatic control

```js
const kb = document.querySelector('bilingual-keyboard');

// Show the panel
kb.setAttribute('visible', '');

// Hide
kb.removeAttribute('visible');

// Switch active language
kb.setAttribute('active-lang', 'en');

// Switch Latin language (and digraph table)
kb.setAttribute('latin-lang', 'de');

// Switch input mode
kb.setAttribute('input-mode', 'live-type');
```

## Politeness with userscript / extension users

The component sets a global flag when it registers:

```js
window.__bilangSlidekeys__ = {
  source: 'embed',     // 'embed', 'userscript', or 'extension'
  version: '1.0.0',
  registered: true     // true once customElements.define succeeds
};
```

The bilang-slidekeys userscript and Chrome extension check this flag at startup and **defer** if it's already set — so users with the extension installed won't see two keyboards, two floating buttons, or duplicate behavior on your site. The host page's embed always wins.

If you want to *opt out* of the polite-defer behavior (allow extension to override your embed), you can manually delete the flag before extensions inject. But this is rare; the default behavior is what most sites want.

## Loading order

The component must be registered before any `<bilingual-keyboard>` element is parsed. Three approaches:

**Inline in `<head>` (synchronous)** — the safest:

```html
<head>
  <script type="module" src="bilingual-keyboard.js"></script>
</head>
```

**Defer at end of `<body>` (most common)** — works because the custom element upgrades retroactively when registered:

```html
<body>
  <bilingual-keyboard></bilingual-keyboard>
  <script type="module" src="bilingual-keyboard.js"></script>
</body>
```

**Lazy load on demand**:

```js
// Only load the component when the user clicks a "type Ukrainian" button
document.getElementById('start-uk').addEventListener('click', async () => {
  await import('./bilingual-keyboard.js');
  const kb = document.createElement('bilingual-keyboard');
  document.body.appendChild(kb);
  kb.setAttribute('visible', '');
});
```

## React / Vue / Angular

Custom elements work in all major frameworks.

**React** — use the [provided wrapper](https://github.com/grogzoid/bilang-slidekeys/blob/main/src/BilingualKeyboard.jsx):

```jsx
import { BilingualKeyboard } from 'bilang-slidekeys/react';

function App() {
  return <BilingualKeyboard activeLang="uk" inputMode="bound" />;
}
```

**Vue** — works directly:

```vue
<template>
  <bilingual-keyboard active-lang="uk" input-mode="bound"></bilingual-keyboard>
</template>
```

(For Vue 2, you may need to declare the element as a custom element in your config; Vue 3 handles them natively.)

**Angular** — declare as a custom element schema:

```ts
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
```

## Privacy

- No external requests, no analytics, no telemetry
- Stores only the floating button position in `localStorage` (key: `bilang-kb-pos`) so it persists across reloads
- All language data is bundled in the source files
- Works offline

## Customization

Style overrides via CSS custom properties on the `:host`:

```css
bilingual-keyboard {
  --kb-bg: #2a2a4a;
  --key-bg: #1e1e2e;
  --key-border: #555;
  --key-active-color: #7ec8e3;
  --key-inactive-color: #999;
  --key-text: #eee;
  --panel-bg: #16162a;
  --toggle-bg: #1e1e2e;
  --glow-color: rgba(126, 200, 227, 0.4);
}
```

(Note: due to Shadow DOM, only these declared CSS custom properties pierce the boundary.)

## Bundle size

- `bilingual-keyboard.js`: ~36 KB unminified, ~10 KB gzipped
- `layouts.js`: ~3 KB unminified, ~1 KB gzipped

## Source

[github.com/grogzoid/bilang-slidekeys](https://github.com/grogzoid/bilang-slidekeys) — MIT licensed.

## Live example

Open `website/example/index.html` from this repository in a browser (after `python3 -m http.server` from the repo root) for a working integration. The example includes a politeness-flag diagnostic that shows what `window.__bilangSlidekeys__` looks like when the component is loaded.
