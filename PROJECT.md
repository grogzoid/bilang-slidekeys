# bilang-slidekeys — Project Overview

## Background

The owner is learning Ukrainian at A1 level on a Linux desktop (Fedora/GNOME). They occasionally type Ukrainian in web apps (Gmail, WhatsApp Web, language learning sites, chat with friends/family/teacher) but don't want to commit to a system-wide Ukrainian keyboard layout switch — it's friction for an English-primary user, the OS-level Win+Space dance is clumsy for short Ukrainian inserts, and learners benefit from *seeing* the layout while they type.

Existing options were unsatisfying: Windows' on-screen keyboard is ugly and intrusive, Linux GNOME's input switcher is invisible until needed, and Chrome Web Store extensions in this niche are dated, niche-focused (phonetic-only), or tied to single vendors (Google Input Tools).

## Problem

For learners and occasional Ukrainian typists in web contexts, the friction is:

1. **Discoverability** — where are the Ukrainian characters on a QWERTY keyboard?
2. **Visual learning** — seeing both the English and Ukrainian on each key cements the layout faster than rote memorization
3. **Site-specific use** — wanting Ukrainian only in some inputs, not everywhere
4. **Reverse direction** — wanting to *type Latin keystrokes and get Ukrainian output* (live transliteration) for fast typing without thinking about the layout
5. **Transliteration aids for non-English users** — a German speaker learning Ukrainian wants `ae` → `ä` digraph composition while typing into German output sections

## Goal

Build a single composable web component that lets a user, on any web page:

- See a virtual keyboard with **both languages on every key** simultaneously (active language large, inactive in corner)
- Toggle **active language** with a click; visual labels swap so the keyboard always shows the new active language large
- Type by **clicking virtual keys** that insert into the focused input
- Type by **using their physical keyboard** with live transliteration to Ukrainian (LiveType mode)
- **Drag** the floating summon button anywhere; **dismiss** it when not needed
- **Persist** preferences (button position) per browser
- Work on virtually any text input including modern contenteditable-based editors (Slack, WhatsApp Web, Gmail, Notion, Discord, X)
- Respect **excluded sites** (banks, password managers) so the userscript never injects there

Stretch goals (already implemented):

- Multi-Latin-language support (EN/DE/ES/FR/IT) with per-language digraph composition tables
- Globe button to cycle through enabled Latin languages on the fly
- Configurable hotkey (default Ctrl+Shift+`)
- Optional diagonal key layout for LiveType mode

## Approach

**Architecture: Web Component (custom element) with Shadow DOM.**

- Zero runtime dependencies
- Style isolation via Shadow DOM means the keyboard's CSS can't conflict with host page styles, and vice versa
- Distributed three ways: (1) raw web component, (2) React wrapper, (3) bundled userscript for Tampermonkey/Violentmonkey
- Next step: package as a Chrome Web Store extension for non-technical users

**Distribution lifecycle so far:**

1. Built the component as ES modules + demo HTML pages (works locally with no build step)
2. Bundled into a single `.user.js` for userscript managers (Tampermonkey)
3. Hosted on private GitHub repo (grogzoid/bilang-slidekeys), installed via raw URL
4. **Next:** Convert to Manifest V3 Chrome extension for Chrome Web Store

**Why Chrome Web Store next:** non-technical Ukrainian-learning friends/family won't install Tampermonkey ("Tampermonkey" sounds shady to non-developers, and the install flow is multi-step). A Chrome extension is one-click install and an order of magnitude more discoverable.

## Constraints

- Owner is the only developer; this is a personal/hobby project intended to also help others
- No backend, no telemetry, no data collection — privacy is a feature
- Must remain free
- Source code is currently a private repo — will go public when published to Chrome Web Store (or before)
- Excluded sites support is a hard requirement (the userscript ships with one default and lets users add their own; the extension must do the same)

## Stakeholders

- **Owner**: solo developer + primary user (Ukrainian A1 learner)
- **Owner's Ukrainian teacher**: uses Punto Switcher / xneur-style after-the-fact transliteration; might appreciate this tool's live approach
- **Future users**: non-technical English speakers learning Ukrainian, plus EN/DE/ES/FR/IT speakers who want to type Ukrainian online
