# Solutions wiring + bowling-pin intro redesign

Date: 2026-07-10

## Overview

Two related pieces of work:

1. Wire up the media kit (`media-kit.html`) as a real page at `chefmyklove.com/solutions`, plus add two new homepage nav bubbles (Media Kit, Solutions).
2. Redesign the homepage's desktop intro sequence: the 10 nav bubbles start stacked in a bowling-pin formation directly in the existing splash circle's flight path, hold for a beat, then the circle (unchanged) rolls in and physically scatters them; they resolve into an evenly-spaced row along the bottom.

## Part 1: Media kit + subdomain wiring

### File changes

- Move `media-kit.html` → `solutions/index.html`. GitHub Pages (this repo is served via the `CNAME` at `chefmyklove.com`) resolves `/solutions/` (and `/solutions` via automatic trailing-slash redirect) to that file's `index.html`, giving us `chefmyklove.com/solutions` with no server config needed.
- Add Open Graph / Twitter meta tags (`og:title`, `og:description`, `og:image`, `og:url`) to `solutions/index.html`'s `<head>`. This matters because external visitors (e.g. a link shared on Facebook) land directly on this URL with no JS context — the page must be fully standalone and correctly describe itself for link-preview crawlers, which don't execute JavaScript.

### New nav bubbles

Two bubbles added to the homepage's bubble set (bringing the total from 8 to 10):

- **Media Kit** — icon/label bubble that, on click, opens the existing `openPrintifyModal(url, title)` helper (in `script.js`, currently used for Printify product iframes) pointed at `/solutions`: `openPrintifyModal('/solutions', 'Media Kit')`. This function already handles the iframe, close button, Escape-to-close, and outside-click-to-close — no new modal code needed, just a new caller.
- **Solutions** — external link bubble to `https://solutions.chefmyklove.com`, `target="_blank" rel="noopener noreferrer"`, following the exact same pattern as the existing NAKED/Stratos/ASMRtists bubbles. This subdomain is already live elsewhere; this is just a link, no deployment work here.

Rationale for the modal-vs-navigation split: `/solutions` must stay a fully working standalone page (for direct/external visits and social previews), while the homepage additionally offers a faster in-page modal view for people already on the site. Reusing `openPrintifyModal` via iframe means there's exactly one copy of the content — no risk of the modal and the standalone page drifting apart.

## Part 2: Bowling-pin intro sequence (desktop only)

This entirely replaces the current `revealBubbles()` fan-out behavior and its trigger timing on desktop. Mobile is unaffected in mechanism (still no spin, no clock, no physics) but adopts the new bottom-row final layout (see below) instead of the old fan-out, for visual consistency between the two device sizes.

### Sequence

1. Background appears (unchanged).
2. All 10 nav bubbles render immediately in their **final full style** — same `.nav-bubble` markup, 88px, icon + label + glow, nothing simplified — arranged in a real 1-2-3-4 bowling-pin triangle (10 bubbles: 1 + 2 + 3 + 4 columns), positioned so the formation sits inside the existing splash circle's horizontal flight path (see Positioning below), rather than centered on the page.
3. Hold for ~1.5s — long enough to read a couple of labels. No user interaction required or expected during this hold.
4. The splash circle's roll-in animation plays **completely unchanged** — same `animateCircleIn()` timing, speed, deceleration curve (`STOP_DURATION`, `TOP_SPEED`, etc.), and final rest position (`38vw`/`50%`). Nothing in that existing function's motion is touched.
5. As the circle's bounding area sweeps through the pin formation during its travel, a small custom physics step (see below) detects the overlap and applies an impulse to each affected bubble, sending them scattering with velocity, some rotation, and damping — "like bowling pins."
6. Scattered bubbles animate into a single row along the bottom of the viewport, using `justify-content: space-evenly` (not a fixed pixel gap) inside a container with generous fixed left/right margins, so all 10 always fit within the current browser width and stay evenly spaced regardless of viewport size.
7. Land acknowledgement (`#landCircle` / `#landTitle`) triggers once the physics step reports the bubbles have settled (velocity below a small threshold for N consecutive frames), rather than the current fixed `setTimeout(1800ms)` — since the new 1.5s hold shifts overall timing, an event-based trigger is more robust than re-tuning a magic number.

### Positioning

The splash circle's existing motion is purely horizontal at vertical center: it translates from far off-screen left to a rest center of approximately `(38vw, 50%)`, per its existing CSS (`top: calc(50% - 50px)`, `left: calc(38vw - 100px)`, translate animation only moves horizontally). The pin formation should be centered vertically at `50vh` and horizontally somewhere left of `38vw` (e.g. around `18-26vw` for the formation's horizontal center, tuned during implementation/testing) — close enough to the rest spot that the circle's leading edge sweeps through it before settling, giving a clean "plows through on the way in" read rather than an overshoot-and-return.

Formation layout (10 bubbles, 88px diameter, pitch ~100px so pins sit close like a real pin deck):

- Column 1 (headpin, closest to incoming circle): 1 bubble, centered vertically.
- Column 2: 2 bubbles, offset ±50px vertically from center.
- Column 3: 3 bubbles, offset 0/±100px.
- Column 4 (farthest from incoming circle): 4 bubbles, offset ±50px/±150px.

Exact pixel/vw offsets are tuned during implementation against the real rendered circle position, not hardcoded from the mockup values used during design discussion.

### Physics implementation

The codebase already has a small hand-rolled physics helper (`BopBody` in `script.js`, used for the bubble pop-in spring effect and the circle's settle-bop). Rather than adding a third-party physics library (e.g. Matter.js, ~80KB), this reuses that pattern: a small custom script (roughly 150-250 lines) handling:

- Per-bubble position + velocity state.
- Circle-circle collision detection between the incoming splash circle (treated as one large circular body) and each pin bubble.
- Simple impulse/restitution response on collision, plus light inter-bubble collision so scattering bubbles react to each other, not just the circle.
- Damping so bubbles settle rather than bouncing forever.
- A "settled" check (all velocities below threshold) used to trigger the land-acknowledgement step.

This runs only on desktop (`window.innerWidth > 768`, matching the existing `isMobile` check in `animateCircleIn()`), gated the same way the current spin/clock logic already is.

### Mobile behavior

Unchanged trigger logic (`isMobile` branch in `animateCircleIn()`: no spin, no clock, bubbles fade in via the existing spring pop-in). The only change on mobile is the **final resting layout** of the bubbles — they now fade directly into the new bottom `space-evenly` row instead of the old fan-out positions, so both device sizes share one final nav layout.

### Repeat plays

No session-skip logic is added — matches current behavior, where the full intro (spin, clock, bubble reveal) plays on every page load. Remains skippable via the existing "tap anywhere to skip" hint (`#skipHint`).

## Out of scope

- Redesigning `solutions.chefmyklove.com` itself (confirmed already live and maintained separately).
- Changing the analog clock's rendering, the circle's roll-in physics/timing, or the click-to-reveal clock toggle — all unchanged.
- Any new bubbles beyond the 10 (8 existing + Media Kit + Solutions).
- Session-based or first-visit-only intro gating.
