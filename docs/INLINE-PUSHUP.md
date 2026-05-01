# Inline keyboard's content push-up: when it works, when it doesn't

When the keyboard slides up inline, the user expects page content above
the keyboard to stay visible — i.e. the keyboard should *displace* the
page content, not *cover* it. On most sites this works. On WhatsApp Web
and a few similar SPAs (Slack, Discord, Gmail compose), it works
intermittently or not at all. This document explains why, what we've
tried, what's solvable, and what isn't.

## What the keyboard does

Three mechanisms cooperate when the panel becomes visible:

1. **Bottom padding on `<body>`.** The component sets
   `document.body.style.paddingBottom = panelHeight + 'px'` (≈340 px).
   On sites that follow normal document flow, this grows the body
   layout box so the page becomes scrollable to its full content
   height *plus* the keyboard's height. Content that was at the bottom
   of the viewport is now scrollable into view above the keyboard.

2. **Scroll-into-view on the bound input.** ~380 ms after the slide-up
   transition (so the panel has settled), if the bound input's
   bounding rect is below the keyboard's top edge,
   `target.scrollIntoView({ block: 'center', behavior: 'smooth' })` is
   called. On well-behaved pages this lifts the focused input above
   the keyboard.

3. **Floating button repositioning.** The ⌨️ floating button slides up
   when the panel is open; this is purely cosmetic but worth noting.

## Why this works on most sites

A "normal" web page has `<body>` as the primary layout container.
Headers, navigation, content, footers all live inside body and respond
to its size. Scroll position is `document.documentElement.scrollTop`.

When we add `padding-bottom: 340px` to body:

- Body's content box is taller
- The browser's overall scroll range grows
- Existing content stays visually in the same place (its top
  positions are unchanged)
- The user can scroll past the formerly-bottom content

Then `scrollIntoView` brings the focused input up so it's visible. End
result: keyboard is at the bottom, input sits above it, prior page
content is still reachable above by scrolling. Works as designed.

## Why WhatsApp Web (and similar SPAs) often don't push up

Modern chat-focused single-page apps use a layout pattern that
specifically *defeats* body padding:

```
html, body { height: 100vh; overflow: hidden; }
#root      { height: 100vh; display: flex; flex-direction: column; }
.chat-area { flex: 1; overflow-y: auto; }   /* the messages list */
.input-bar { flex: 0 0 auto; }              /* the typing area, anchored at bottom of #root */
```

This pattern locks the body to viewport height, hides body overflow,
and uses an inner flex container with its own scrollable region. The
input bar is at the *bottom of the viewport-height flex container* —
NOT at the bottom of the document. Adding bottom padding to `<body>`
has no effect because:

- Body has `overflow: hidden`, so its layout doesn't grow visibly
- `#root` has explicit `height: 100vh` and ignores body's content-box size
- The chat scroll area's height is computed from flex distribution, not from body padding

`scrollIntoView` on the message-input element doesn't help either,
because that element is already pinned at the bottom of the visible
flex container — its bounding rect is correct, the keyboard is just
covering the same screen region.

WhatsApp Web specifically uses this exact pattern. Slack, Discord,
Gmail compose, Notion, ChatGPT — same family.

## Why it works "intermittently" on WhatsApp specifically

WhatsApp Web has multiple layout states, several of which behave
differently:

- **Single-pane vs. two-pane view** — depending on viewport width
  WhatsApp shows just the chat or chat + sidebar. The two layouts use
  slightly different containers; one may inherit body padding while
  the other doesn't.
- **Conversation closed vs. open** — when no chat is selected, the
  right pane shows a placeholder with normal-ish flow that may respect
  body padding. When a chat is open, the locked viewport-height
  pattern kicks in.
- **Mobile-emulation mode** — DevTools or narrow windows sometimes
  trigger an alternative responsive layout.
- **Recent layout updates** — WhatsApp ships layout changes regularly;
  what worked last week may not this week.
- **Window state** — fullscreen vs. windowed, since WhatsApp
  occasionally calculates `100vh` differently than `100%`.

Practical observation: the keyboard appears to push content up on
WhatsApp Web "sometimes" because the user is hitting one of the
states above where the layout *does* honor body padding. It's not a
bug we caused; it's a side-effect of WhatsApp having multiple layouts
under the hood.

## What's solvable (with effort)

### a) Walk the DOM up from the bound input and pad the right ancestor

Instead of always padding `<body>`, find the nearest scroll container
above the bound input and pad *that*. Heuristic detection:

- Walk parent chain of bound target
- For each ancestor, check `getComputedStyle(el).overflowY` — `auto`
  or `scroll` means it's a scroll container
- Stop at the first such ancestor; pad it instead of body

**Pros:** Could work on WhatsApp's chat scroll container.
**Cons:**
- Heuristic-fragile; breaks when WhatsApp tweaks their CSS
- Per-site debugging required
- May break unrelated layout (e.g. shifting the chat scroll
  position by accident)
- Doesn't help if the input is *outside* the scroll container
  (which is WhatsApp's actual layout — input bar is a sibling, not a
  descendant, of the messages scroll area)

### b) Insert a transparent spacer next to the input

Inject an invisible block-level element with the keyboard's height
just below the bound input's positioning ancestor. Forces layout
recalculation that may displace content above.

**Pros:** Sometimes works where body padding fails.
**Cons:** Even more brittle. Mutates the host page's DOM in places we
don't own. Sites with strict layout systems (React/Vue) may
immediately re-render and remove our spacer. Sites with mutation
observers may treat our spacer as an attack and react badly.

### c) Per-site detection and custom strategies

Maintain a `host → strategy` mapping; on `web.whatsapp.com` use
strategy A, on `slack.com` use B, etc.

**Pros:** Targeted reliability.
**Cons:** Massive maintenance burden. Each site change = breakage.
We'd be reverse-engineering layouts we don't own. Doesn't scale to
the long tail of sites the user might visit.

### d) Use the browser's own viewport-resize signal

When a real OS keyboard appears on mobile, the browser fires
`visualViewport.resize`. The page's CSS responds via media queries
and `dvh`/`svh`/`lvh` units. We could *fake* a viewport-resize-like
event so well-designed responsive sites adapt.

**Pros:** Theoretically cleanest, leverages site's own responsive design.
**Cons:** No browser API to programmatically resize the visual viewport.
Would require capability we don't have.

## What's not solvable

- **Sites with `overflow: hidden` on `<html>`/`<body>` and explicit
  `100vh` on top-level containers** — body padding has no effect by
  design.
- **Sites with strict CSP that disallow inline style modifications**
  — though uncommon, some banks and government sites are this locked
  down.
- **Sites with Shadow DOM containing the input** — we can't traverse
  up beyond the shadow root host.
- **Sites with `<iframe>`-isolated input fields** — the iframe is a
  separate document, our padding mechanism doesn't reach inside.
- **Mobile keyboards' actual viewport-resize protocol** — desktop
  browsers don't expose this to scripts. We can fake-pad but can't
  trigger the same lifecycle.

## The robust answer: Picture-in-Picture (already implemented)

The PiP pop-out window solves the WhatsApp problem completely because:

- The keyboard lives in an OS-level window, not the page
- WhatsApp's internal scroll container and locked-viewport layout are
  irrelevant — the keyboard isn't competing with them
- Same behavior across every site
- Always on top, draggable by the user

**Trade-offs:**

- Document Picture-in-Picture API requires Chromium 116+ (2024-mid).
  Firefox and Safari users see no pop-out option.
- The PiP window is OS-managed; user has to position it once.
- Some focus quirks (typing in the PiP can move focus there from the
  main page).

## Recommendation

For sites with the locked-viewport layout (WhatsApp Web, Slack,
Discord, Gmail compose, Notion, ChatGPT), **use the pop-out (⧉)
button**. The inline mode's body-padding push-up is a best-effort that
intentionally doesn't try to be smart about specific sites — keeping
that mechanism simple is more robust than chasing per-site quirks.

If push-up reliability on WhatsApp specifically becomes important, the
least-bad path is **option (a)**: walk the DOM and pad the nearest
scroll container above the input. It would catch WhatsApp's chat list
in some states and still fall back to body padding when no scroll
ancestor exists. We've intentionally not pursued this because the
maintenance cost is high relative to the alternative (PiP).

## What we already did to mitigate this

- The pop-out button (⧉) on the keyboard panel — Chromium-only
  Document PiP, the recommended path for SPA-heavy use.
- The bound-input scroll-into-view on slide-up — helps on
  push-up-friendly sites.
- The body padding — works on the long tail of normal sites.

The remaining intermittent push-up on WhatsApp Web is the union of
the layout-state factors described above. We do not consider it a bug
in bilang-slidekeys; it's a fundamental incompatibility between
inline-positioned overlays and locked-viewport SPA layouts.
