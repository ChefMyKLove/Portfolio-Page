# Splash Page Redesign — Design Spec
**Date:** 2026-05-12  
**Author:** Michael Needham / Claude Code  
**Files affected:** `index.html`, `styles.css`, `script.js`, `carousel.css`

---

## Overview

Completely replace the current centered glass card with a cinematic two-phase entrance experience: a living animated background (cloud-displacement art), followed by a large glassmorphism circle rolling in from the left containing the profile and bio, surrounded by 8 nav bubbles that expand on hover.

---

## Phase 1 — Animated Intro (0–5s, skippable)

### Background
- Full-screen cycling rainbow art images (same 13 images as current `cycleBackgrounds`)
- On top: two overlay `<img>` layers using SVG `feTurbulence` + `feDisplacementMap` (same technique as the book cover in the pasted `index.html`) — creates a living, breathing cloud-warp effect
- JS drives the turbulence `baseFrequency` over time so the displacement slowly morphs, never repeating
- The whole screen feels alive and dreamlike before anything else appears

### Timer & Skip
- After 5 seconds the intro auto-advances to Phase 2
- At any point during Phase 1: clicking anywhere OR pressing any key skips immediately to Phase 2
- A subtle "tap to skip" hint text fades in at 1.5s, positioned bottom-center, low opacity

---

## Phase 2 — Circle Entrance & Navigation

### The Circle

**Entrance animation:**
- Starts fully off-screen to the left (translateX: -120vw)
- Swooshes in with a rolling physics feel: fast start, cubic-bezier ease, slight elastic overshoot on settle (~0.15s bounce past target, then back)
- Duration: ~900ms total
- Lands at horizontal position: ~38% from the left edge of the viewport, vertically centered

**Size:** `min(50vmin, 480px)` — large but never overflows on smaller screens

**Visual treatment (glassmorphism):**
- `background: rgba(0, 0, 0, 0.45)`
- `backdrop-filter: blur(24px)`
- `border: 1px solid rgba(255, 255, 255, 0.12)`
- `box-shadow: 0 0 40px rgba(102, 126, 234, 0.35), 0 8px 48px rgba(0,0,0,0.5)`
- Subtle purple-blue glow (consistent with existing brand colors)

**Circle contents (top to bottom, centered):**
1. Profile photo — circular crop, ~110px diameter, with a soft glow ring
2. Name — `"Hello! I'm Michael Needham"` — white, bold, ~1.6rem, letter-spaced
3. Tagline — `"Developer • Artist • Activist"` — muted white, light weight
4. Bio paragraph — full existing text — smaller font (~0.78rem), muted white, line-height 1.6, scrollable if needed on small screens

Contents fade in sequentially (staggered 150ms each) after the circle settles.

---

## 8 Navigation Bubbles

### Positioning
Bubbles are absolutely positioned relative to the viewport, fanning out in a clockwise arc from roughly the 1 o'clock position of the circle to the 5 o'clock position — using the open space to the right since the circle is left-of-center. Rough layout (adjustable in implementation):

```
        [1]  [2]
  CIRCLE     [3]
        [4]  [5]
          [6][7][8]
```

Exact pixel offsets are calculated relative to the circle's settled center point. Bubbles are not in orbit — they are statically positioned after entrance.

### Default State
- `~68px` diameter circles
- Same glassmorphism treatment as the main circle (lighter — ~0.25 opacity background)
- Icon or short label inside (2–4 chars max)
- Subtle glow on border

### Hover State
- Scale: `1.0` → `1.45` over 250ms cubic-bezier spring
- Full destination label appears (fades in)
- Glow intensifies
- `cursor: pointer`

### Entrance
Each bubble pops in with a spring scale animation (0 → 1.05 → 1.0) staggered 80ms apart, starting 300ms after the circle finishes settling.

### The 8 Bubbles

| # | Label | Destination | Icon hint |
|---|-------|-------------|-----------|
| 1 | Projects | `projects.html` | `{ }` |
| 2 | About Me | `about-me.html` | `♟` |
| 3 | Contact | `contact.html` | `✉` |
| 4 | Ordinal Rainbows | `ordinal-rainbows.html` | `🌈` |
| 5 | Blog Access | Patreon auth redirect | `✦` |
| 6 | Coming Soon | `#` (placeholder — easy to wire up) | `◌` |
| 7 | Coming Soon | `#` (placeholder) | `◌` |
| 8 | Coming Soon | `#` (placeholder) | `◌` |

Placeholders styled slightly more muted (lower opacity) with a dashed border to signal "not yet active."

---

## Background Continuation

The background art cycling + cloud-displacement animation continues running in both phases — it never stops. Phase 2 simply adds the circle and bubbles on top of it.

---

## Responsive Behavior

**Mobile (< 768px):**
- Circle centered horizontally, slightly smaller (`min(80vw, 380px)`)
- Bubbles flow into a 4×2 grid below the circle
- Bio text limited to ~4 lines with a "read more" expand if needed

**Desktop:** full layout as described above

---

## Files & Scope

| File | Change |
|------|--------|
| `index.html` | Full rewrite of splash section. Keep footer, keep script tags. Add SVG filter defs. |
| `styles.css` | Add `.splash-circle`, `.nav-bubble`, `.intro-overlay`, `.skip-hint`, phase animation keyframes. Remove old `.glass-card` block. |
| `script.js` | Add `initIntro()`: 5s timer, skip listeners, `animateCircleIn()`, `revealBubbles()`. Keep existing analytics, preload, and carousel code. |
| `carousel.css` | No changes expected. |

---

## Out of Scope

- No changes to other pages (`projects.html`, `about-me.html`, etc.)
- No backend changes
- No new images needed — uses existing `images/` directory
