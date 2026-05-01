# Review Handoff — bilang-slidekeys

This document is for code reviewers (LLM or human) who are looking at
this project before its first wide release. The project is being
prepared for two release milestones:

1. **Public userscript distribution** — making the GitHub repo public
   so anyone with Tampermonkey/Violentmonkey can install via the raw
   URL.
2. **Chrome Web Store submission** — converting the userscript into a
   Manifest V3 extension for one-click install for non-technical users.

The maintainer (a solo developer) wants reviewers to look for:
**security issues**, **code quality concerns**, and **usability /
UX issues** before flipping the repo public and submitting the
extension.

## TL;DR for a reviewer just starting

1. Read `PROJECT.md` (15 min) — what this is and why
2. Read `IMPLEMENTATION.md` (15 min) — architecture
3. Read `src/bilingual-keyboard.js` (the main file, ~1100 lines)
4. Skim `userscript/build.js` and `userscript/validate.js`
5. Review the userscript bundle `userscript/bilang-slidekeys.user.js`
   (auto-generated from src; same code, different packaging)
6. Walk through `userscript/INSTALL.md` from a user's perspective
7. Walk through `website/TUTORIAL.md` from a developer's perspective
8. Open the demos at `demo/index.html` after running
   `python3 -m http.server 8080`
9. Then come back to this file and address each section below

## Project surface area

| Area | What's there | LOC est. |
|---|---|---|
| Web component | `src/bilingual-keyboard.js` | ~1100 |
| Layout data | `src/layouts.js` | ~70 |
| React wrapper | `src/BilingualKeyboard.jsx` | ~80 |
| Userscript builder | `userscript/build.js` | ~270 |
| Userscript validator | `userscript/validate.js` | ~190 |
| Bundled userscript | `userscript/bilang-slidekeys.user.js` | (auto) |
| Demos | `demo/*.html` | ~3000 total |
| Website embed example | `website/example/index.html` | ~150 |
| Documentation | `*.md` | ~3000 total |

## Security review focus

### Network and data access

- **Does the component make any network requests?** Check
  `src/bilingual-keyboard.js`. Should be zero — confirm no `fetch`,
  no `XMLHttpRequest`, no `import` from external URLs, no analytics.
- **Does the userscript phone home?** Check `userscript/build.js`'s
  bundled launcher. The only network call expected is none.
- **What's persisted to storage?**
  - `localStorage['bilang-kb-pos']` — floating button position
    (`{x, y}` numbers)
  - `localStorage['bilang-slidekeys-always-enabled']` (or
    `GM_setValue`) — array of hostnames the user opted in
  - That's it. No content, no input data, no telemetry.
- **Does the script access cookies?** No. Verify by grep for
  `cookie`.

### DOM manipulation safety

- The component injects a `<bilingual-keyboard>` element with a Shadow
  DOM. All UI lives inside the shadow root, so it can't visually
  conflict with the host page.
- The component reads/writes `<input>`, `<textarea>`, and
  contenteditable elements that the user has clicked. Those writes go
  through `el.value = ...` (form inputs) or
  `document.execCommand('insertText', ...)` (contenteditable).
- The floating button writes `style.outline` on the bound input as a
  visual cue. Original outline is preserved and restored on unbind.
- **Risk areas:**
  - Could the keyboard inject text into a hidden/cloaked input the
    user can't see? Theoretically yes — see the `bound` mode
    behavior. We highlight the bound target with a blue outline as a
    visual cue.
  - Could a host page maliciously read what the user types via the
    `key-input` event? Yes, by `addEventListener('key-input', ...)`.
    But the host page already controls its own inputs, so this is
    not a new attack surface.

### XSS / injection

- No `innerHTML` set from user input. Confirm with grep.
- No `eval()` outside of the bundle's window-resolution fallback
  (`(0, eval)('this')`) — that fallback was removed in commit
  `c540c5d`; current code uses only `unsafeWindow` and `self`.
- The bundle's IIFE uses `'use strict';`.
- The userscript metadata declares `@grant GM_registerMenuCommand
  GM_setValue GM_getValue` — minimal grants for the menu and
  per-site enable persistence.

### Excluded sites (sensitive domains)

The userscript ships with `@exclude *://*.chase.com/*` and
`@exclude *://chase.com/*`. This is one example domain; the maintainer
considers the exclude list a per-user customization (banks,
brokerages, password managers should be added by individual users in
their installed copy). **Reviewer: confirm this is documented clearly
in `userscript/INSTALL.md` and the README.**

### Permissions footprint for the future Chrome extension

Per `TODO.md`, the planned extension uses `activeTab` + `scripting` +
`storage` permissions only. No `host_permissions` at install time —
those are requested at runtime when the user opts in to "Always
enable on [hostname]". **Reviewer: this is the right minimal
footprint. Confirm the TODO checklist has nothing that would expand
permissions unnecessarily.**

### Politeness contract

The component uses a `window.__bilangSlidekeys__` flag to coordinate
across multiple sources (host-page embed, userscript, future
extension). The userscript bails on load if either
`customElements.get('bilingual-keyboard')` or
`window.__bilangSlidekeys__` is already truthy — host page wins.
**Reviewer: this is a soft contract relying on globals. Could a
malicious page set the flag pre-emptively to disable our keyboard?
Yes. Is that a meaningful threat? Probably not — the page already
controls its DOM and could just block the script via CSP if it
wanted.**

## Code quality review focus

### File-level concerns

- `src/bilingual-keyboard.js` is ~1100 lines. **Should it be split
  into multiple files?** The component has clear functional sections
  (constructor, render, event handlers, helpers, PiP) but they share
  state. Splitting would require either passing state as parameters
  (verbose) or breaking encapsulation. Reviewer's call.
- `userscript/build.js` does a lot of string manipulation to
  transform the source into a userscript. Reviewer: is the regex /
  replace logic robust? See `:host` → `.kb-panel.pip` transform.

### Naming and clarity

- The mode formerly known as "intercept" is now "live-type". The
  attribute value uses kebab-case (`live-type`); the user-facing name
  uses CamelCase ("LiveType"). Some legacy file/screenshot names
  still say "intercept" (e.g. `docs/screenshots/intercept-mode.png`)
  — these are intentional to avoid breaking links but flagged in
  `TODO.md`.
- Method names like `_onLiveTypeKeydown`, `_onModifierKeydown`,
  `_onModifierKeyup`, `_onWindowBlur`, `_handleKeyPress`,
  `_insertChar`, `_doBackspace`, `_shiftedFor` follow a consistent
  underscore-prefix-private convention. **Reviewer: scan for naming
  inconsistencies.**

### Build/validate process

- `node userscript/build.js` reads source files, transforms ES module
  syntax, generates the userscript metadata block (with `@version`
  auto-derived from `git rev-list --count v0.2.0..HEAD`), bundles
  layouts + component + launcher.
- The build runs `validate.js` automatically at the end. Validation
  loads the bundle in Node `vm` with a stubbed browser environment
  and runs both the no-`unsafeWindow` and with-`unsafeWindow` paths.
- **Reviewer:** is the validator catching the right kinds of bugs?
  A previously-shipped bug (invalid CSS in PiP-mode `:host` regex
  transform) wasn't caught because validation only runs the IIFE
  body, not user-interaction paths like `_popOut()`. Worth adding?

### Tests

- There are **no automated tests**. Manual testing happens via:
  - The demos in `demo/`
  - The example page in `website/example/index.html`
  - Smoke-test screenshots in `userscript/screenshots/`
- **Reviewer: should this project have unit tests before public
  release?** Pro: regressions are easy to introduce, especially in
  the keymap data and the live-type/shifting logic. Con: the
  component is essentially a UI widget; UI logic is annoying to unit
  test. Recommendation: maybe extract pure functions (`_shiftedFor`,
  the `:host` transformer) into a testable module.

### Browser compatibility

- Uses Custom Elements V1, Shadow DOM V1, ES modules, `e.code` /
  `e.getModifierState`, `document.execCommand('insertText')`,
  `localStorage`. All available in Chrome 67+, Firefox 63+, Safari
  10.1+, Edge 79+.
- PiP feature requires Chromium 116+ (Document Picture-in-Picture
  API). Gracefully hidden on browsers without it.
- **Not tested on Safari, mobile, or in Edge specifically.**
  Reviewer: should the maintainer add a browser-compat matrix to
  `IMPLEMENTATION.md`?

## Usability review focus

### First-run experience

- Install Tampermonkey from Chrome Web Store
- Install bilang-slidekeys from raw URL
- Visit a non-excluded page → no visible UI yet (the keyboard is
  opt-in by default)
- Press `Ctrl+Shift+\`` (the hotkey) → keyboard slides up
- OR open Tampermonkey menu → "Toggle keyboard here" / "Always
  enable on [hostname]"

**Reviewer questions:**
- Is the hotkey discoverable? (Doc: `userscript/INSTALL.md` step 4
  describes both paths.)
- Is the "Always enable on [hostname]" persistent option sufficiently
  prominent for users who want the keyboard on a specific site daily?
- The `Ctrl+Shift+\`` hotkey — is backtick discoverable? Some users
  may not know which key that is. We document it as "the key above
  Tab".

### LiveType discoverability

LiveType is the default input mode. New users:
- Click into a text input
- Press the hotkey to summon the keyboard
- Start typing on their physical keyboard
- See Cyrillic appear

**Reviewer questions:**
- Is the keyboard's "you're now in LiveType" state visually obvious?
  (LiveType button glows blue when active.)
- Without prior knowledge of ЙЦУКЕН, will users understand why
  pressing `g` produces `п`? (Documentation:
  `userscript/INSTALL.md` step 6 has a complete example with a
  mapping table.)

### Pop-out keyboard

The PiP feature is gated behind a small ⧉ icon. **Reviewer
questions:**
- Is it discoverable enough? Tooltip says "Pop out keyboard to a
  separate window".
- The PiP mode loses focus context when the user types in the PiP
  window — is this confusing?

### Floating button

- Drag-to-reposition (long press)
- Hover to see dismiss × (top-right corner)
- Position persists across page reloads via `localStorage`

**Reviewer:** is the dismiss × discoverable? It only appears on
hover. A user who doesn't hover may not know they can dismiss.

### Edge cases

- **Highly visual sites (canvas-heavy game UIs)** — no input element,
  keyboard binds to nothing, typing does nothing. Expected behavior.
- **Sites with strict CSP** — Shadow DOM injection may fail silently.
  Document this somewhere?
- **Sites that aggressively re-render React inputs** — typing routes
  through `dispatchEvent('input')` so React state updates correctly.
  Verified manually on Slack, Gmail, WhatsApp Web.

## What the maintainer should personally review

Out of all the LLM-reviewable stuff above, here's what a human owner
must decide:

1. **Repo visibility.** The repo is currently private. Going public
   exposes commit history, PRs, etc. Going public is required for
   the userscript raw URL to work for non-authenticated installers.
   Decision: **flip public when ready to release**.

2. **Branding / naming.** The userscript name is "Bilang SlideKeys".
   The store extension name (per `TODO.md`) could be "SlideKeys",
   "Bilingual Keyboard", or "Bilang SlideKeys" — pick before
   submission. Affects all listing assets, screenshots, README.

3. **Default exclude list.** The userscript ships with chase.com
   excluded as an example. The maintainer should NOT bundle their
   personal banking/brokerage/password-manager domains. Each user
   adds their own. **Reviewer: is this documented clearly enough?**

4. **Privacy policy.** The extension's privacy practices declaration
   needs to say "no user data collected". Since `localStorage` is
   used for button position only (not "user data" per Google's
   definition), this is an honest "no". A privacy policy page is
   recommended even though optional — a single paragraph hosted on
   GitHub Pages or similar is enough.

5. **Icon design.** Three concept SVGs are at `docs/icons/` (keycap,
   toggle, globe). Pick one before submitting. The 128×128 size needs
   to be exported to PNG for the manifest.

6. **Listing copy.** Short description (132 chars), long description
   (16,000 chars). `TODO.md` has draft text. Reviewer: critique it.

7. **Screenshots for the listing.** Need 1280×800 or 640×400 PNGs.
   Existing screenshots in `docs/screenshots/` and
   `userscript/screenshots/` may need recropping.

8. **Demo video.** The Document Picture-in-Picture flow is the
   standout feature for a video. Recommend recording one of: the
   showreel auto-play, a typing demo on a real site like Wikipedia
   Ukraine article, or the popout flow.

9. **Hotkey conflict review.** Default `Ctrl+Shift+\`` was chosen
   because it's not used by major web apps. Reviewer/maintainer:
   audit your daily-use sites once more before release. Easy to
   change in the userscript header.

## Known issues and limitations (documented)

- `docs/INLINE-PUSHUP.md` — inline mode's body-padding push-up
  doesn't work on locked-viewport SPAs (WhatsApp Web, Slack, Discord).
  PiP mode is the recommended path.
- `IMPLEMENTATION.md` "Known limitations" section — digraph
  composition only works for INPUT/TEXTAREA, not contenteditable.
  Listed as acceptable trade-off.
- French `oe` ligature would conflict with German `oe → ö` if both
  enabled simultaneously — only one Latin language is active at a
  time, so not a practical issue.

## Git history

Repo was rebased to a single initial commit (commit `c290e74` or
later HEAD as of this writing) to remove sensitive references. Old
commit history was discarded; backup tar at
`/tmp/bilang-slidekeys-old-git-*.tar.gz` on the maintainer's machine.
The rebase is documented in commit messages — reviewer doesn't need
to know the old hashes.

## How to run things locally

```bash
# Clone
git clone https://github.com/grogzoid/bilang-slidekeys
cd bilang-slidekeys

# Build the userscript bundle (also runs the validator)
node userscript/build.js

# Serve locally (any port)
python3 -m http.server 8080

# Open the demo directory
open http://localhost:8080/demo/

# Open the install tutorial as rendered HTML
open http://localhost:8080/userscript/INSTALL.html

# Open the website embed example
open http://localhost:8080/website/example/index.html
```

## Questions to send back to the maintainer

If you, the reviewer, find something that requires the maintainer's
input rather than just code feedback, please flag with one of these
prefixes:

- **DECISION:** for product/scope decisions
- **PRIVACY:** for data-handling concerns
- **SECURITY:** for vulnerability findings
- **POLISH:** for usability/UX suggestions
- **CODE:** for code quality / architecture suggestions

The maintainer will triage based on these tags.

## Out of scope for this review

- **Chrome extension implementation itself** — not yet built; just
  documented in `TODO.md`. Review the plan, not the code.
- **Web Store listing assets** — screenshots, descriptions are
  drafted but not finalized.
- **Localization** — extension and userscript are English-only.
  Ukrainian / German / Spanish / French / Italian localization is a
  v1.1+ concern.
- **Accessibility** — keyboard navigation within the panel works
  (tab through buttons), but full ARIA label coverage and screen
  reader testing has not been done. Worth flagging if you find
  obvious gaps.
