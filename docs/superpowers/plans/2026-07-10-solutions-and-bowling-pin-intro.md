# Solutions Wiring + Bowling-Pin Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up `chefmyklove.com/solutions` (the media kit) with homepage nav bubbles, then replace the homepage's desktop bubble fan-out with a bowling-pin intro: bubbles hold in a pin formation, the existing circle roll-in animation smashes through them via custom physics, and they resolve into an evenly-spaced bottom row.

**Architecture:** This is a static HTML/CSS/vanilla-JS site (GitHub Pages, no build step, no bundler, no test framework — `backend/` is an unrelated Node API for the blog). All new JS is added to the existing `script.js` as plain functions, following the file's existing conventions (see `BopBody` class, `animateCircleIn()`). All "tests" in this plan are manual browser verification steps (open the file, look at specific things at specific viewport widths) since there is no automated test tooling for the frontend.

**Tech Stack:** Plain HTML/CSS/JS, GitHub Pages static hosting, no dependencies added.

## Global Constraints

- No third-party physics library — the scatter uses a small custom circle-collision loop, matching the existing hand-rolled `BopBody` pattern already in `script.js`.
- Do not modify the circle's existing roll-in timing/speed/deceleration/rest position (`animateCircleIn`'s spin/translate logic) — only when it starts is delayed by the pin hold; its own motion is untouched.
- Desktop-only for the pin/scatter/physics sequence (`window.innerWidth > 768`, matching the existing `isMobile` check). Mobile keeps its current simple fade-in trigger.
- Bottom-row bubble spacing must self-adjust to viewport width (space-evenly formula), not a fixed pixel gap.
- Never commit anything — the user reviews and commits manually.

---

## File Structure

- **Modify `index.html`**: add 2 new `.nav-bubble` entries (Media Kit, Solutions).
- **Modify `styles.css`**: remove the old fixed fan-out `#bubble-1`..`#bubble-8` position rules (JS now controls bubble position directly); adjust the mobile grid from 8 to 10 slots.
- **Modify `script.js`**: replace `revealBubbles()` with `revealBubblesSimple()` (mobile) plus a new bowling-pin sequence (`showPinFormation`, `runScatterPhysics`, `resolveBottomRow`, and small helpers), and rewire `animateCircleIn()`'s desktop branch to use them instead of the old fixed-timeout fan-out and fixed-timeout land-acknowledgement trigger.
- **Move `media-kit.html` → `solutions/index.html`**: add Open Graph tags for social link previews.

---

### Task 1: Move media kit to `/solutions` with social preview tags

**Files:**
- Create: `solutions/index.html` (moved from `media-kit.html`)
- Delete: `media-kit.html`

**Interfaces:**
- Produces: a working page at `chefmyklove.com/solutions` once deployed via GitHub Pages (directory + `index.html` resolves automatically, no server config needed).

- [ ] **Step 1: Move the file**

Run:
```bash
mkdir -p solutions
mv media-kit.html solutions/index.html
```

- [ ] **Step 2: Add Open Graph / Twitter meta tags**

In `solutions/index.html`, the `<head>` currently reads (first few lines):

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chefmyklove Custom Software Solutions — Media Kit</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
```

Insert after the `<title>` line:

```html
<title>Chefmyklove Custom Software Solutions — Media Kit</title>
<meta property="og:title" content="Chefmyklove Custom Software Solutions — Media Kit">
<meta property="og:description" content="Custom software solutions, media kit, and press materials for Chefmyklove.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://chefmyklove.com/solutions">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com">
```

No `og:image` is added — there's no existing asset suited for a social preview image. This can be added later if one is created; don't reference a file that doesn't exist.

- [ ] **Step 3: Verify no other file links to the old path**

Run: `grep -r "media-kit" --include="*.html" --include="*.js" .`
Expected: no output (already confirmed during planning — nothing else references `media-kit.html`).

- [ ] **Step 4: Manual verification**

Open `solutions/index.html` directly in a browser (e.g. `file:///d:/Desktop/Portfolio-Page/solutions/index.html`) and confirm:
- The media kit ticket page renders exactly as it did before the move (fonts, QR code, layout).
- View page source and confirm the 5 new `<meta>` tags are present in `<head>`.

---

### Task 2: Add Media Kit and Solutions nav bubbles

**Files:**
- Modify: `index.html:112-115`

**Interfaces:**
- Consumes: `openPrintifyModal(url, title)` (existing global function in `script.js`, currently used for Printify product iframes — takes a URL and a title string, creates an iframe modal with close button, outside-click-close, and Escape-close).
- Produces: `#bubble-9` (Media Kit) and `#bubble-10` (Solutions) — the new total bubble count (10) that Task 4's pin formation and Task 6's bottom-row layout are built for.

- [ ] **Step 1: Add the two bubbles**

In `index.html`, the nav-bubble block currently ends with:

```html
    <a href="https://asmrtists.ca" class="nav-bubble" id="bubble-8" aria-label="ASMRtists" target="_blank" rel="noopener noreferrer">
      <span class="bubble-icon" aria-hidden="true">🎨</span>
      <span class="bubble-label">ASMRtists</span>
    </a>
    </section>
```

Change to:

```html
    <a href="https://asmrtists.ca" class="nav-bubble" id="bubble-8" aria-label="ASMRtists" target="_blank" rel="noopener noreferrer">
      <span class="bubble-icon" aria-hidden="true">🎨</span>
      <span class="bubble-label">ASMRtists</span>
    </a>
    <button type="button" class="nav-bubble" id="bubble-9" onclick="openPrintifyModal('/solutions', 'Media Kit')" aria-label="Media Kit">
      <span class="bubble-icon" aria-hidden="true">🧾</span>
      <span class="bubble-label">Media Kit</span>
    </button>
    <a href="https://solutions.chefmyklove.com" class="nav-bubble" id="bubble-10" aria-label="Solutions" target="_blank" rel="noopener noreferrer">
      <span class="bubble-icon" aria-hidden="true">🛠️</span>
      <span class="bubble-label">Solutions</span>
    </a>
    </section>
```

- [ ] **Step 2: Manual verification**

Serve the site locally (any static server, e.g. `python -m http.server` from the repo root) and open the homepage in a desktop browser:
- Confirm 10 bubbles now appear (this will still look like the old fan-out layout until Task 4-6 land — that's expected at this checkpoint).
- Click the Media Kit bubble → confirm the existing Printify-style modal opens with `/solutions` iframed inside, has a working close button (×), closes on Escape, and closes on outside click.
- Click the Solutions bubble → confirm it opens `https://solutions.chefmyklove.com` in a new tab.

---

### Task 3: Remove fixed fan-out CSS positions, resize mobile grid for 10 bubbles

**Files:**
- Modify: `styles.css:445-456`
- Modify: `styles.css:655-664`

**Interfaces:**
- Produces: `.nav-bubble` elements with no default `left`/`top` (desktop) — Task 4/5/6's JS is now solely responsible for positioning them via inline styles.

- [ ] **Step 1: Remove the old fan-out position rules**

In `styles.css`, this block currently exists:

```css
/* Bubble positions.
   All 5 main nav bubbles arc right of circle at consistent R=378 from center (288 radius + 44 bubble radius + 46 gap).
   Angles evenly spaced -30°, -12°, 5°, 22°, 40° — so every bubble center sits exactly on the circumference.
   Bubbles 6-8 (coming-soon) cluster just below Projects. */
#bubble-1 { left: calc(38vw + 146px); top: calc(50vh + 149px); }  /* 40° */
#bubble-2 { left: calc(38vw + 183px); top: calc(50vh - 283px); }  /* -30° */
#bubble-3 { left: calc(38vw + 226px); top: calc(50vh - 173px); }  /* -12° */
#bubble-4 { left: calc(38vw + 232px); top: calc(50vh -  61px); }  /*   5° */
#bubble-5 { left: calc(38vw + 207px); top: calc(50vh +  48px); }  /*  22° */
#bubble-6 { left: calc(38vw +  54px); top: calc(50vh + 253px); }  /* lower-left of Projects */
#bubble-7 { left: calc(38vw + 146px); top: calc(50vh + 265px); }  /* directly below Projects */
#bubble-8 { left: calc(38vw + 238px); top: calc(50vh + 253px); }  /* lower-right of Projects */
```

Replace with:

```css
/* Bubble positions on desktop are set entirely by JS (see showPinFormation(),
   runScatterPhysics(), and resolveBottomRow() in script.js) — the bowling-pin
   intro sequence positions each bubble explicitly at every phase, so no
   default per-bubble CSS position is needed here. */
```

- [ ] **Step 2: Resize the mobile grid from 8 to 10 slots**

In `styles.css`, this rule currently exists:

```css
    .nav-zone {
        display: grid !important;
        grid-template-columns: repeat(4, 72px);
        grid-template-rows: repeat(2, 72px);
        gap: 14px;
        justify-content: center;
        padding: 36px 20px 28px;
        width: 100%;
        box-sizing: border-box;
    }
```

Change the grid dimensions to fit 10 bubbles (5 columns × 2 rows):

```css
    .nav-zone {
        display: grid !important;
        grid-template-columns: repeat(5, 72px);
        grid-template-rows: repeat(2, 72px);
        gap: 14px;
        justify-content: center;
        padding: 36px 20px 28px;
        width: 100%;
        box-sizing: border-box;
    }
```

- [ ] **Step 3: Manual verification**

Open the homepage in a browser at a narrow width (< 768px, e.g. browser dev tools device toolbar at 375px):
- Confirm all 10 bubbles appear in a clean 5×2 grid with no overlap and no horizontal scrollbar.
- Open at a desktop width (e.g. 1440px):
- Confirm bubbles no longer snap to the old fan-out positions (they'll likely all pile at the top-left corner at this checkpoint, since no CSS position and no JS position yet either — that's expected until Task 4 lands).

---

### Task 4: Pin formation + delayed circle roll-in

**Files:**
- Modify: `script.js:1072-1083` (replace `revealBubbles`)
- Modify: `script.js:968-984` (mobile branch call site + desktop kickoff)

**Interfaces:**
- Produces: `revealBubblesSimple()` (mobile bubble reveal, same behavior as the old `revealBubbles()`), `getCircleRestCenter()`, `getPinPositions()`, `showPinFormation()` — all consumed by Task 5/6.
- Consumes: `BopBody` class (existing, unchanged), `.nav-bubble` / `.visible` CSS (existing).

- [ ] **Step 1: Replace `revealBubbles()` with the renamed simple version plus pin-formation helpers**

In `script.js`, this function currently exists:

```js
// ============================================
// BUBBLE ENTRANCE — staggered spring pop-in
// ============================================
function revealBubbles() {
    const bubbles = document.querySelectorAll('.nav-bubble');
    bubbles.forEach((bubble, i) => {
        setTimeout(() => {
            bubble.classList.add('visible');
            new BopBody(bubble, { strength: 22, spring: 0.10, damping: 0.85 });
        }, i * 80);
    });
}
```

Replace with:

```js
// ============================================
// BUBBLE ENTRANCE — staggered spring pop-in (mobile grid reveal)
// ============================================
function revealBubblesSimple() {
    const bubbles = document.querySelectorAll('.nav-bubble');
    bubbles.forEach((bubble, i) => {
        setTimeout(() => {
            bubble.classList.add('visible');
            new BopBody(bubble, { strength: 22, spring: 0.10, damping: 0.85 });
        }, i * 80);
    });
}

// ============================================
// BOWLING-PIN INTRO (desktop only)
// ============================================
const BUBBLE_SIZE           = 88;   // px — matches .nav-bubble width/height
const PIN_PITCH             = 100;  // px between pin columns/rows
const PIN_HOLD_MS           = 1500; // how long the pin formation holds before the circle rolls in
const BOTTOM_MARGIN         = 96;   // px side padding for the resolved bottom row
const BOTTOM_GAP_FROM_FLOOR = 56;   // px from bottom of viewport to the bubble row's center

// Mirrors the .splash-circle CSS rule (top: calc(50% - 50px); left: calc(38vw - 100px);
// width/height: min(60vmin, 576px)) so the rest position can be computed without
// measuring the DOM. If that CSS rule ever changes, update this to match.
function getCircleRestCenter() {
    const size = Math.min(Math.min(window.innerWidth, window.innerHeight) * 0.6, 576);
    const left = window.innerWidth * 0.38 - 100;
    const top  = window.innerHeight / 2 - 50;
    return { x: left + size / 2, y: top + size / 2, size };
}

// 10 positions in a 1-2-3-4 bowling-pin triangle, headpin (column 1) facing
// left toward the circle's incoming direction, centered on the circle's
// rest position along its horizontal travel path.
function getPinPositions() {
    const rest = getCircleRestCenter();
    const baseX = rest.x - 2.5 * PIN_PITCH;
    const cols = [
        { x: baseX,                 ys: [0] },
        { x: baseX + PIN_PITCH,     ys: [-50, 50] },
        { x: baseX + PIN_PITCH * 2, ys: [-100, 0, 100] },
        { x: baseX + PIN_PITCH * 3, ys: [-150, -50, 50, 150] },
    ];
    const positions = [];
    cols.forEach(col => {
        col.ys.forEach(dy => positions.push({ x: col.x, y: rest.y + dy }));
    });
    return positions; // always 10 entries
}

// Places all .nav-bubble elements into the pin formation and reveals them
// with the existing stagger/spring-pop, already in their final visual style.
function showPinFormation() {
    const bubbles = Array.from(document.querySelectorAll('.nav-bubble'));
    const pins = getPinPositions();
    bubbles.forEach((bubble, i) => {
        const pos = pins[i];
        bubble.style.left = `${Math.round(pos.x - BUBBLE_SIZE / 2)}px`;
        bubble.style.top  = `${Math.round(pos.y - BUBBLE_SIZE / 2)}px`;
        setTimeout(() => {
            bubble.classList.add('visible');
            new BopBody(bubble, { strength: 22, spring: 0.10, damping: 0.85 });
        }, i * 80);
    });
}
```

- [ ] **Step 2: Update the mobile call site**

In `script.js`, inside `animateCircleIn()`:

```js
    // ── Mobile: fade in directly, no spin, no clock ──
    if (isMobile) {
        circle.classList.add('mobile-ready');
        if (inner) inner.style.filter = '';
        setTimeout(revealBubbles, 1000);
        return;
    }
```

Change to:

```js
    // ── Mobile: fade in directly, no spin, no clock ──
    if (isMobile) {
        circle.classList.add('mobile-ready');
        if (inner) inner.style.filter = '';
        setTimeout(revealBubblesSimple, 1000);
        return;
    }
```

- [ ] **Step 3: Delay the desktop roll-in kickoff behind the pin hold**

In `script.js`, immediately after the mobile block, this currently exists:

```js
    // ── Desktop: full roll-in animation ──
    frameId = requestAnimationFrame(tick);

    requestAnimationFrame(() => {
        circle.classList.add('entered');
        if (ring) ring.classList.add('entered');
    });

    setTimeout(revealBubbles, 2700);
```

Change to:

```js
    // ── Desktop: pins hold first, then the (unchanged) roll-in smashes through them ──
    showPinFormation();

    setTimeout(() => {
        frameId = requestAnimationFrame(tick);

        requestAnimationFrame(() => {
            circle.classList.add('entered');
            if (ring) ring.classList.add('entered');
        });
    }, PIN_HOLD_MS);
```

(Task 5 will add the physics call inside this same `setTimeout`, and Task 6 will remove the old fixed-timeout land-acknowledgement trigger further down in this function.)

- [ ] **Step 4: Manual verification**

Open the homepage on a desktop-width browser (> 768px):
- Confirm all 10 bubbles appear immediately in a bowling-pin triangle roughly to the left of where the circle normally rests, in their full icon+label style.
- Confirm the circle does NOT start rolling in until about 1.5 seconds after page load (count "one-one-thousand, one-one-thousand-five-hundred" — it should visibly wait).
- Confirm that once it starts, the circle's spin/roll-in looks and times exactly as it did before this change (same speed, same deceleration, same rest position) — the bubbles will visually overlap/collide with it since Task 5 (physics) hasn't landed yet, that's expected at this checkpoint.

---

### Task 5: Scatter physics (circle-vs-bubble and bubble-vs-bubble collision)

**Files:**
- Modify: `script.js` (add `runScatterPhysics` after the functions added in Task 4)
- Modify: `script.js:976-984` (desktop kickoff, extending Task 4's `setTimeout`)

**Interfaces:**
- Consumes: `BUBBLE_SIZE` (from Task 4).
- Produces: `runScatterPhysics(circleEl, onSettled)` — runs until bubbles settle or a safety timeout elapses, then calls `onSettled()`. Consumed by Task 6.

- [ ] **Step 1: Add the physics function**

In `script.js`, immediately after `showPinFormation()` (added in Task 4), add:

```js
// Runs a small custom circle-collision simulation: the (real) splash circle
// smashes into the pin-formation bubbles, which then also collide with each
// other, scattering with velocity and damping until they come to rest (or a
// safety timeout elapses). Calls onSettled() exactly once when done.
function runScatterPhysics(circleEl, onSettled) {
    const bubbles = Array.from(document.querySelectorAll('.nav-bubble'));
    const bodies = bubbles.map(el => {
        const rect = el.getBoundingClientRect();
        return {
            el,
            x: rect.left + BUBBLE_SIZE / 2,
            y: rect.top + BUBBLE_SIZE / 2,
            vx: 0,
            vy: 0,
            r: BUBBLE_SIZE / 2,
        };
    });

    const DAMPING               = 0.965;
    const RESTITUTION           = 0.85;
    const SETTLE_SPEED          = 0.15; // px/frame, summed across all bubbles' |vx|+|vy|
    const SETTLE_FRAMES_NEEDED  = 20;   // ~1/3s at 60fps below SETTLE_SPEED
    const MAX_DURATION_MS       = 3000; // safety cap so a light-damping edge case can't hang the intro

    let prevCircleCenter = null;
    let settleFrames = 0;
    let rafId = null;
    const startTime = performance.now();

    function step() {
        const rect = circleEl.getBoundingClientRect();
        const circleCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const circleRadius = rect.width / 2;
        const circleVel = prevCircleCenter
            ? { x: circleCenter.x - prevCircleCenter.x, y: circleCenter.y - prevCircleCenter.y }
            : { x: 0, y: 0 };
        prevCircleCenter = circleCenter;

        // Circle vs each bubble
        bodies.forEach(b => {
            const dx = b.x - circleCenter.x, dy = b.y - circleCenter.y;
            const dist = Math.hypot(dx, dy) || 1;
            const overlap = (circleRadius + b.r) - dist;
            if (overlap > 0) {
                const nx = dx / dist, ny = dy / dist;
                b.x += nx * overlap;
                b.y += ny * overlap;
                const speed = Math.hypot(circleVel.x, circleVel.y);
                b.vx += nx * (speed * 0.9 + 4) + circleVel.x * 0.3;
                b.vy += ny * (speed * 0.9 + 4) + circleVel.y * 0.3;
            }
        });

        // Bubble vs bubble
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const a = bodies[i], b = bodies[j];
                const dx = b.x - a.x, dy = b.y - a.y;
                const dist = Math.hypot(dx, dy) || 1;
                const minDist = a.r + b.r;
                if (dist < minDist) {
                    const overlap = (minDist - dist) / 2;
                    const nx = dx / dist, ny = dy / dist;
                    a.x -= nx * overlap; a.y -= ny * overlap;
                    b.x += nx * overlap; b.y += ny * overlap;
                    const relVx = b.vx - a.vx, relVy = b.vy - a.vy;
                    const relSpeed = relVx * nx + relVy * ny;
                    if (relSpeed < 0) {
                        const impulse = -relSpeed * RESTITUTION;
                        a.vx -= impulse * nx; a.vy -= impulse * ny;
                        b.vx += impulse * nx; b.vy += impulse * ny;
                    }
                }
            }
        }

        // Integrate, damp, clamp to viewport, write to DOM
        let totalSpeed = 0;
        bodies.forEach(b => {
            b.vx *= DAMPING; b.vy *= DAMPING;
            b.x += b.vx; b.y += b.vy;
            b.x = Math.max(b.r, Math.min(window.innerWidth - b.r, b.x));
            b.y = Math.max(b.r, Math.min(window.innerHeight - b.r, b.y));
            b.el.style.left = `${Math.round(b.x - b.r)}px`;
            b.el.style.top  = `${Math.round(b.y - b.r)}px`;
            totalSpeed += Math.abs(b.vx) + Math.abs(b.vy);
        });

        const elapsed = performance.now() - startTime;
        settleFrames = totalSpeed < SETTLE_SPEED ? settleFrames + 1 : 0;

        if (settleFrames >= SETTLE_FRAMES_NEEDED || elapsed >= MAX_DURATION_MS) {
            cancelAnimationFrame(rafId);
            onSettled();
            return;
        }
        rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
}
```

- [ ] **Step 2: Call it from the desktop kickoff**

In `script.js`, Task 4 left this in place:

```js
    // ── Desktop: pins hold first, then the (unchanged) roll-in smashes through them ──
    showPinFormation();

    setTimeout(() => {
        frameId = requestAnimationFrame(tick);

        requestAnimationFrame(() => {
            circle.classList.add('entered');
            if (ring) ring.classList.add('entered');
        });
    }, PIN_HOLD_MS);
```

Change to:

```js
    // ── Desktop: pins hold first, then the (unchanged) roll-in smashes through them ──
    showPinFormation();

    setTimeout(() => {
        frameId = requestAnimationFrame(tick);

        requestAnimationFrame(() => {
            circle.classList.add('entered');
            if (ring) ring.classList.add('entered');
        });

        runScatterPhysics(circle, () => {
            // Task 6 replaces this placeholder call with resolveBottomRow(triggerLandAcknowledgement)
        });
    }, PIN_HOLD_MS);
```

- [ ] **Step 3: Manual verification**

Open the homepage on a desktop-width browser (> 768px):
- Confirm the pins hold for ~1.5s, then the circle rolls in and visibly knocks the bubbles apart as it passes through/near them — they should scatter with some velocity and rot-adjacent motion (bubbles don't rotate themselves, but should slide and bounce off each other), then come to rest scattered around the screen (not yet in a bottom row — that's Task 6).
- Confirm bubbles never fully leave the viewport (clamped) and don't jitter forever — motion should visibly stop within ~3 seconds of the circle reaching them.
- Open browser dev tools console and confirm no errors are thrown during the sequence.

---

### Task 6: Resolve to bottom row + settle-triggered land acknowledgement

**Files:**
- Modify: `script.js` (add `computeBottomRowPositions`, `resolveBottomRow`, `triggerLandAcknowledgement`)
- Modify: `script.js:993-999` (remove old fixed-timeout land-ack trigger)
- Modify: `script.js` (Task 5's placeholder callback)

**Interfaces:**
- Consumes: `runScatterPhysics`'s `onSettled` callback (Task 5).
- Produces: none consumed further — this is the final step of the sequence.

- [ ] **Step 1: Add the resolve + land-ack functions**

In `script.js`, immediately after `runScatterPhysics` (added in Task 5), add:

```js
// Computes 10 evenly-spaced bottom-row positions using the same math as
// CSS `justify-content: space-evenly`: equal gap before the first bubble,
// between each pair, and after the last — so it always fits the current
// viewport width instead of using a fixed pixel gap.
function computeBottomRowPositions(count) {
    const available = window.innerWidth - BOTTOM_MARGIN * 2;
    const gap = (available - count * BUBBLE_SIZE) / (count + 1);
    const y = window.innerHeight - BUBBLE_SIZE - BOTTOM_GAP_FROM_FLOOR;
    const positions = [];
    for (let i = 0; i < count; i++) {
        const x = BOTTOM_MARGIN + gap * (i + 1) + BUBBLE_SIZE * i;
        positions.push({ x, y });
    }
    return positions;
}

// Animates the scattered bubbles into the final evenly-spaced bottom row,
// then calls onDone() once the transition finishes.
function resolveBottomRow(onDone) {
    const bubbles = Array.from(document.querySelectorAll('.nav-bubble'));
    const targets = computeBottomRowPositions(bubbles.length);
    bubbles.forEach(el => {
        el.style.transition = 'left 0.6s cubic-bezier(0.22, 1, 0.36, 1), top 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
    });
    // Flush layout so the transition above is applied before left/top change.
    void bubbles[0].offsetHeight;
    bubbles.forEach((el, i) => {
        el.style.left = `${Math.round(targets[i].x - BUBBLE_SIZE / 2)}px`;
        el.style.top  = `${Math.round(targets[i].y - BUBBLE_SIZE / 2)}px`;
    });
    setTimeout(() => {
        bubbles.forEach(el => { el.style.transition = ''; });
        onDone();
    }, 650);
}

function triggerLandAcknowledgement() {
    const landCircle = document.getElementById('landCircle');
    const landTitle  = document.getElementById('landTitle');
    if (landCircle) landCircle.classList.add('active');
    if (landTitle)  landTitle.classList.add('active');
}
```

- [ ] **Step 2: Wire the settle callback**

In `script.js`, Task 5 left this placeholder:

```js
        runScatterPhysics(circle, () => {
            // Task 6 replaces this placeholder call with resolveBottomRow(triggerLandAcknowledgement)
        });
```

Change to:

```js
        runScatterPhysics(circle, () => {
            resolveBottomRow(triggerLandAcknowledgement);
        });
```

- [ ] **Step 3: Remove the old fixed-timeout land-acknowledgement trigger**

In `script.js`, inside the `circle.addEventListener('animationend', function onTranslateEnd(e) {...})` handler, this currently exists:

```js
        circle.style.animation = 'none';
        circle.style.translate = '-50% -50%';
        translateDone = true;

        // Trigger land acknowledgement circle after main circle settles
        setTimeout(() => {
            const landCircle = document.getElementById('landCircle');
            const landTitle  = document.getElementById('landTitle');
            if (landCircle) landCircle.classList.add('active');
            if (landTitle)  landTitle.classList.add('active');
        }, 1800);

        if (spinStopped) {
```

Change to:

```js
        circle.style.animation = 'none';
        circle.style.translate = '-50% -50%';
        translateDone = true;

        if (spinStopped) {
```

(Land acknowledgement is now triggered from `resolveBottomRow`'s callback once the bubbles have actually settled, not from a fixed timer relative to the circle's translate animation ending.)

- [ ] **Step 4: Manual verification**

Open the homepage on a desktop-width browser (> 768px) at several widths (e.g. 1920px, 1440px, 1024px):
- Confirm the full sequence plays: pins hold ~1.5s → circle rolls in and scatters them → bubbles settle → bubbles smoothly animate into a single row along the bottom, evenly spaced, with generous empty margin on both ends, all 10 visible with no horizontal scrollbar at any of the tested widths.
- Confirm the land acknowledgement text/circle fades in at roughly the same time the bubbles finish settling into the row (not noticeably before or after).
- Resize the browser window after the sequence completes and reload — confirm the row re-computes correctly for the new width (each fresh page load, not live-resize, since there's no resize listener — that's expected, matches spec scope).
- Click a few bubbles in their final position (e.g. Projects, Contact) and confirm they still navigate correctly — position changes don't affect their `href`/`onclick`.

---

## Self-Review Notes

- **Spec coverage:** Part 1 (move + OG tags + 2 bubbles + modal) → Tasks 1-2. Part 2 (pin formation, unchanged circle timing, custom physics, space-evenly resolve, settle-triggered land-ack, mobile grid) → Tasks 3-6. All spec sections have a corresponding task.
- **Placeholder scan:** Task 5 Step 2 contains a code comment marking where Task 6 fills in the real call — this is intentional cross-task sequencing (not a design placeholder), and Task 6 Step 2 immediately replaces it with the real implementation.
- **Type/name consistency:** `revealBubblesSimple`, `getCircleRestCenter`, `getPinPositions`, `showPinFormation`, `runScatterPhysics`, `computeBottomRowPositions`, `resolveBottomRow`, `triggerLandAcknowledgement`, `BUBBLE_SIZE`, `PIN_PITCH`, `PIN_HOLD_MS`, `BOTTOM_MARGIN`, `BOTTOM_GAP_FROM_FLOOR` are used identically everywhere they appear across tasks.
- **Scope:** This plan intentionally does not add a resize listener, session-skip logic, or an `og:image` — all explicitly out of scope per the spec.
