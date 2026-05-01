# TODO — Chrome Web Store Publication

This is a handoff to a fresh session to convert the existing userscript-based bilang-slidekeys into a Chrome Web Store extension.

## Pre-requisites

- [ ] **Decide on visibility**: GitHub repo is currently private. Chrome Web Store extension can be published from a private repo's source, but for credibility / open source benefits, consider making the repo public before submission. (Use `gh repo edit grogzoid/bilang-slidekeys --visibility public --accept-visibility-change-consequences` to flip.)
- [ ] **Pay $5 USD** Chrome Web Store one-time developer registration fee (the only cost in the entire process). Done at https://chrome.google.com/webstore/devconsole
- [ ] **Decide on the published name**: "bilang-slidekeys" is a developer name. For the public extension listing, consider a friendlier name like "Bilingual Keyboard for Ukrainian" or "SlideKeys: Bilingual Keyboard". Brand consistency: the userscript is "Bilang SlideKeys", so something like "SlideKeys" is the natural product name.

## Politeness contract — REQUIRED before injection

The userscript already implements this; the extension must too.

If a host page has already embedded `<bilingual-keyboard>` (via website integration, see `website/TUTORIAL.md`), the extension MUST detect that and not inject anything. The check:

```js
// At the very top of the content script, before any DOM manipulation:
if (
  customElements.get('bilingual-keyboard') ||
  (typeof window !== 'undefined' && window.__bilangSlidekeys__)
) {
  return;  // Defer to host page or other extension
}
// ...otherwise mark this extension as the active source:
window.__bilangSlidekeys__ = { source: 'extension', version: '1.0.0', registered: false };
```

Before defining the custom element:

```js
if (!customElements.get('bilingual-keyboard')) {
  customElements.define('bilingual-keyboard', BilingualKeyboard);
  if (window.__bilangSlidekeys__) window.__bilangSlidekeys__.registered = true;
}
```

This prevents:
- Two floating ⌨️ buttons on the same page
- Two virtual keyboards stacking
- "Custom element with name 'bilingual-keyboard' has already been defined" errors

Test on `website/example/index.html` (with the userscript installed): the example's embed should "win" and the userscript should not inject anything visible.

## Architecture decision: click-to-activate, NOT always-on

The userscript is always-on (injects on every non-excluded page) because its audience is technical Tampermonkey users who accept that model. **The Chrome extension MUST NOT use always-on injection.** Reasons:

- Chrome shows users a scary "Read and change all your data on the websites you visit" install warning for extensions with broad host permissions. This kills install rates.
- Google's review process explicitly scrutinizes broad-host-permissions extensions. Reviewers want demonstrable justification for "all sites by default" — and "I want a keyboard available everywhere" is rejected. Extensions that activate on user gesture get faster, easier review.
- Performance: 40KB+ injected into every tab is wasteful when the user only types Ukrainian on 1-2 sites a day.
- Hotkey conflicts compound at scale.

**Required model: user-driven activation.**

- Extension is **inactive by default** on every page — content script injection happens only on demand, OR runs but waits for an activation signal before doing anything visible
- **Toolbar action (browser action)** is the primary entry point. User clicks the ⌨️ icon to activate the keyboard for the current tab.
- **Popup menu** behind the toolbar icon offers:
  - "Activate on this page" (one-shot for current tab)
  - "Always activate on [site.com]" (adds to allowlist)
  - "Never activate on [site.com]" (adds to blocklist)
  - "Open settings"
- **Options page** shows the user's allowlist + blocklist with edit controls, hotkey config, default Latin language, enabled Latin languages
- **Default blocklist** is pre-populated minimally (the userscript ships with only chase.com excluded; the extension can keep that and let users add their own sensitive sites: other banks, brokerages, password managers) — user sees it and can edit, but it's not invisible/hard-coded
- **Optional global hotkey** via `chrome.commands` API: user configures a system-wide shortcut at chrome://extensions/shortcuts to summon the keyboard on the active tab

This model:
- Reduces install friction (lighter permission ask)
- Speeds up Web Store review
- Gives users explicit control and visibility into what sites the extension affects
- Lets power users opt into "always on" for specific daily-use sites

## Convert userscript → Manifest V3 extension (click-to-activate model)

- [ ] **Create directory**: `chrome-extension/` at repo root
- [ ] **manifest.json** with:
  - `manifest_version: 3`
  - `name`, `version` (start at `1.0.0`), `description`
  - `icons` (16, 32, 48, 128)
  - `action`:
    - `default_popup: "popup.html"`
    - `default_icon: { "16": "icons/icon-16.png", "32": "icons/icon-32.png", "48": "icons/icon-48.png" }`
    - `default_title: "Bilingual Keyboard"`
  - `permissions`: `["storage", "activeTab", "scripting"]`
    - `activeTab` lets the extension inject into the current tab on user click without broad host permissions
    - `scripting` is the API for `chrome.scripting.executeScript`
  - `host_permissions`: only what's needed for the allowlist (sites user has approved). Use `chrome.permissions.request` to ask at runtime when user adds a site to "always activate"
  - `commands`: optional global keyboard shortcut for summoning the keyboard
  - `options_page: "options.html"`
  - **NO `content_scripts` at top level** — injection is triggered programmatically via `chrome.scripting.executeScript`
- [ ] **popup.html + popup.js**: small UI shown when user clicks toolbar icon. Buttons for "Activate here", "Always on [site]", "Never on [site]", "Open settings"
- [ ] **content.js**: the bundled keyboard component (adapted from `userscript/bilang-slidekeys.user.js` body). Removed: the userscript launcher's auto-inject. Added: a check on load for "is this site in the allowlist?" — if yes, auto-inject; if not, wait for an activation message from the popup or background script
- [ ] **background.js (service worker)**:
  - Listens for `action.onClicked` (or popup messages)
  - On user click → injects content.js into the active tab via `chrome.scripting.executeScript`
  - On popup "Always on [site]" → adds to allowlist in `chrome.storage.sync` AND requests `host_permissions` for that origin via `chrome.permissions.request`
  - Manages allowlist/blocklist state
- [ ] **options.html + options.js**: settings page accessed via popup or chrome://extensions
  - Allowlist editor (sites where extension auto-activates)
  - Blocklist editor (sites that override allowlist; pre-populated with default blocklist)
  - Default Latin language picker
  - Enabled Latin languages multi-select
  - Hotkey configurator (uses `chrome.commands`)
  - Stored via `chrome.storage.sync` so it follows user across devices
- [ ] **Storage migration**: keep the floating button position in `chrome.storage.local` (per-device); user preferences in `chrome.storage.sync` (across devices)

## Create icons (128, 48, 32, 16)

- [x] **Three SVG concept icons designed**, in `docs/icons/`:
  - `icon-keycap.svg` — Single keycap with Ф large + A in corner (mirrors the in-product key style)
  - `icon-toggle.svg` — Two overlapping keycaps showing the bilingual switching aspect
  - `icon-globe.svg` — Globe with a keyboard tile overlaid (international input symbol)
  - See `docs/icons/preview.html` for side-by-side comparison
- [ ] **Pick one design** and export to PNG at 128×128, 48×48, 32×32, 16×16
- [ ] Use `inkscape --export-type=png --export-width=128 docs/icons/icon-keycap.svg` (or similar) to rasterize
- [ ] Place final PNGs in `chrome-extension/icons/`
- [ ] Verify the 16×16 size is still legible — small sizes are the real test for icon designs

## Listing assets for Web Store submission

- [ ] **At least one screenshot** at 1280×800 OR 640×400 (you can show up to 5)
  - The existing screenshots in `docs/screenshots/` (keyboard-normal.png, intercept-mode.png, demo-page.png, quiz-with-keyboard.png) and `userscript/screenshots/` are good starting points but may need recropping/resizing to exact dimensions
  - Suggested screenshots: (1) keyboard open on a generic page, (2) LiveType mode with diagonal-split keys (the file is named intercept-mode.png for legacy reasons), (3) quiz page in action, (4) the keyboard popped out into a Picture-in-Picture window, (5) the floating button being dragged
- [ ] **Promotional tile** (440×280) — optional but boosts visibility
- [ ] **Marquee** (1400×560) — optional, for featured sections
- [ ] **Short description** (132 chars max). Suggestion:
  > "Bilingual on-screen keyboard for English/Ukrainian (and German, Spanish, French, Italian). Type live or click."
- [ ] **Detailed description** (16,000 chars max). Cover:
  - What it does (slides up, shows both languages, types into focused field)
  - LiveType mode (physical keyboard transliteration)
  - Multi-Latin language support with digraph composition
  - Privacy: no data collected, no telemetry, no remote code
  - Excluded sites list (and how users can add their own)
  - How to use: hotkey, drag, dismiss
  - Open source link
- [ ] **Single category**: "Accessibility" or "Productivity" (Productivity has higher discoverability; Accessibility is more accurate)
- [ ] **Language**: English (primary), can localize to Ukrainian later

## Privacy and legal

- [ ] **Privacy practices declaration** in the developer dashboard:
  - "Does the extension collect or use user data?" → **No** (the only persistent data is the floating button position, stored locally via `chrome.storage.local`; this is not user data per Google's definition)
  - Confirm that the extension's primary purpose is consistent with its description
- [ ] **Privacy policy URL** — optional since you collect nothing, but recommended. Can be a simple static page on a personal site or GitHub Pages with one paragraph: "This extension does not collect, transmit, or share any user data. The floating button's position is stored locally in your browser via chrome.storage.local and never leaves your device."
- [ ] **Permission justification** in the developer console:
  - `storage`: "Used to remember the position of the on-screen keyboard's floating toggle button across pages"
  - All host permissions: explained as needed for injecting the keyboard widget into web pages

## Submit and publish

- [ ] Zip the `chrome-extension/` directory (NOT the parent — zip should contain manifest.json at root)
- [ ] Upload to https://chrome.google.com/webstore/devconsole
- [ ] Fill out all listing fields
- [ ] Set distribution: **Public**, all regions
- [ ] Set pricing: **Free**
- [ ] Submit for review
- [ ] **First-time submission review takes 7–14 business days**. Subsequent updates: 2–5 days

## Post-launch

- [ ] **Add a "Install from Chrome Web Store" button** to the project README
- [ ] **Update the userscript README** to point at the extension as the recommended path for non-developer users
- [ ] **Open up the GitHub repo** if you haven't already — extensions on the Web Store benefit from public source links for trust
- [ ] **Track installs and reviews** via the developer dashboard
- [ ] **Plan v1.1**: based on user feedback. Likely candidates:
  - Add Polish, Czech, other Slavic Cyrillic targets (UK keyboard layout already covers most Cyrillic)
  - Better tablet/mobile support (the keyboard component currently scales but isn't optimized for touch)
  - Themes (dark/light, accent colors)
  - Keyboard layout customization (let users define their own keymaps)

## Technical migration checklist

- [ ] Test the extension thoroughly in Chrome (latest stable) before submission
- [ ] Test in **Edge** (uses same Chromium store mechanism, should work as-is)
- [ ] Test in **Firefox** — manifest V3 extensions need separate submission to AMO (addons.mozilla.org); consider after Chrome launch
- [ ] Verify `chrome.storage.local` works correctly for button position persistence
- [ ] Verify all excluded sites still function correctly with the extension installed
- [ ] Verify the keyboard does NOT inject into iframes (manifest needs `all_frames: false` — current userscript already uses `@noframes`)
- [ ] Verify CSP-strict sites still allow the Shadow DOM injection
- [ ] Test on the contenteditable-heavy sites the userscript was developed against: WhatsApp Web, Slack, Gmail, Discord

## Don't forget

- [ ] The project's existing demo pages, design docs, and showreel can stay where they are. The Chrome extension is an additional distribution path, not a replacement.
- [ ] Once the extension is live, the userscript distribution path can be marked "for advanced users" in the README — keep it as a developer-facing option.
- [ ] If the repo is made public, double-check no secrets/tokens leaked. The repo currently has no secrets (no `.env`, no API keys, no credentials), but worth a `git log -p | grep -i 'token\|secret\|api_key'` sanity check.
