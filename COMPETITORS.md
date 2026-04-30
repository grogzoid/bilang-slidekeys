# Competitive Landscape

Research conducted via web search; current as of late April 2026.

## Chrome Web Store — direct competitors

### Google Input Tools

- **What**: Google's official extension for input methods across 90+ languages including Ukrainian
- **Strengths**: Brand trust (Google), language coverage, mature
- **Weaknesses**: Dated UI (~2014 visual design), no bilingual dual-label keys, no live transliteration overlay (LiveType-style), no per-page floating button — opens a modal that's clunky for quick inserts
- **URL**: Search "Google Input Tools" on Chrome Web Store
- **Differentiation gap**: Bilang-slidekeys focuses on *learners* needing the visual layout reference; Google's tool focuses on translators/typists who already know the layout

### Ukrainian Phonetic Keyboard (multiple variants)

- **What**: Phonetic-style typing — Latin letters that "sound like" Ukrainian (e.g. `pryvit` → `привіт`)
- **Strengths**: Fast for users who already think phonetically
- **Weaknesses**: No standard Ukrainian layout option (some users want to learn the real ЙЦУКЕН), no bilingual visual aid, single-purpose
- **Source**: GSCS Ukrainian Phonetic Keyboard, RusPhonetic Keyboard (similar approach for Russian)
- **Differentiation gap**: Phonetic typing is a different paradigm. Bilang-slidekeys is for users who want to learn or use the *real* keyboard layout, not a Latin transliteration

### Virtual Keyboard for Google Chrome (xonTAB)

- **What**: Generic virtual keyboard supporting 50+ languages
- **Strengths**: Wide language support, modal pop-up activates from toolbar
- **Weaknesses**: One language at a time, no learning aid (no dual labels), no live transliteration, no integration with target inputs (uses its own scratchpad)
- **URL**: chromewebstore.google.com/detail/.../ecjkcanpimnagobhegghdeeiagffoidk
- **Differentiation gap**: Single-language pop-up vs. bilang-slidekeys' bilingual always-paired approach

### KeyFloat

- **What**: Floating on-screen keyboard with smart predictions, 21 languages
- **Strengths**: Modern UI, predictions, privacy-focused
- **Weaknesses**: Single language at a time per session, no live-typing transliteration mode, prediction-focused rather than learning-focused
- **Differentiation gap**: KeyFloat targets touchscreen/accessibility users; bilang-slidekeys targets language learners

### Hot Virtual Keyboard Extension

- **What**: Older keyboard utility, mostly for tablets
- **Status**: Limited maintenance; not a strong competitor

### Ukrainian Symbols

- **What**: Helper for typing Ukrainian characters missing from Russian keyboard layouts (a niche-of-a-niche)
- **Differentiation gap**: Doesn't apply to our user base

## Distinguishing features of bilang-slidekeys

Compared to all of the above, **none** of them combine:

1. **Bilingual visual aid** (active language large, inactive in corner) — visually unique
2. **LiveType mode** (physical keyboard transliterated to Ukrainian in real time)
3. **Multi-Latin source language support** (EN/DE/ES/FR/IT) with digraph composition (`ae` → `ä`, etc.) for users who type into German/Spanish/French/Italian
4. **Draggable + dismissable floating button** with position persistence
5. **Excluded sensitive sites by default** (banks, password manager) — privacy/safety stance
6. **Web Component architecture** — same code runs in any framework or as a userscript

## Adjacent products (system-level, not Chrome extensions)

These run at the OS level and are not direct competitors but worth knowing for context.

### Punto Switcher (Windows)

- **What**: Yandex's free auto-layout-detector. Type "ghbdsn" in English layout, hit a hotkey, it converts to "привіт" in Ukrainian
- **Why it matters**: This is what the project owner's Ukrainian teacher uses. A *complementary* tool — converts after-the-fact rather than in-the-moment
- **Limitation**: Windows-only, system-wide (no per-site behavior), Russian-first

### XNeur (Linux)

- **What**: The Linux equivalent of Punto Switcher. Auto-detects mistyped layouts and converts on hotkey or automatically
- **Tools**: `xneur` (CLI), `gxneur` (GTK frontend)
- **Limitation**: X11-only (Wayland support partial), system-wide, requires daemon
- **Source**: https://manpages.ubuntu.com/manpages/focal/man1/xneur.1.html

### easy-switcher (Linux)

- **What**: Modern keyboard layout switcher for Linux, similar concept to xneur
- **Source**: https://github.com/freemind001/easy-switcher

### Keyman (cross-platform)

- **What**: SIL's industrial-strength multilingual keyboard tool
- **Strengths**: Supports rare/minority languages, custom layouts
- **Weaknesses**: Heavy install, overkill for casual use, dated UI

### Built-in OS layout switching

- **Windows**: Win+Space cycles installed layouts
- **macOS**: Ctrl+Space (default) cycles input sources
- **Linux GNOME**: Super+Space, configured via Settings > Keyboard > Input Sources
- **Limitation**: System-wide, no learning aid, no visual reference

## Market gap summary

There is genuine room in the Chrome Web Store for a tool that:

- **Visually teaches** the Ukrainian layout while letting users type
- **Combines** virtual click-typing AND live transliteration (LiveType)
- **Supports** non-English Latin source languages (DE/ES/FR/IT) — most existing tools assume EN-only

The Ukrainian-input space on Chrome is small (under 10 active extensions of any quality), and most are either:

- Dated/single-purpose (phonetic-only, or single-language pop-up)
- Too generic to be useful for learners (huge multi-language pickers without learning aids)
- Tied to a specific vendor/ecosystem (Google Input Tools)

Bilang-slidekeys' positioning: **the bilingual learning tool for Ukrainian (and friends) on the web**.

## Pricing landscape

Every competitor in this space is **free**. Chrome users do not pay for keyboard input extensions — pricing is not a viable differentiator. Bilang-slidekeys should be free and open source.

## Sources

- Google Input Tools: searches on Chrome Web Store
- GSCS Ukrainian Phonetic Keyboard: https://chromewebstore.google.com/detail/gscs-ukrainian-phonetic-k/jmpbgdolkmchgdobpadjogngokmkgkbi
- Virtual Keyboard for Chrome: https://chrome-stats.com/d/ecjkcanpimnagobhegghdeeiagffoidk
- xneur (Ubuntu manpage): https://manpages.ubuntu.com/manpages/focal/man1/xneur.1.html
- easy-switcher (Linux): https://github.com/freemind001/easy-switcher
- Punto Switcher: Yandex (Russian-language site, less search visibility in English markets)
