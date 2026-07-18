# About Me / Projects Bubble Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rectangular About Me content blocks with two physics-driven "stacked deck" bubble carousels, turn the About Me / Projects page titles and back buttons into true-circle bubbles, and fold all of it (plus the existing 12 Projects bubbles) into one shared drag/fling/collide physics field per page.

**Architecture:** Extract a generalized, configurable physics engine (`bubble-physics.js`) from the existing `bubble-pool.js` (used unmodified on `contact.html`). About Me and Projects pages use a "freeze current position" home-layout strategy: elements are positioned via plain CSS/inline-transform first, then the engine measures their rendered position as their physics home. About Me's two content sections become "decks" — stacks of circular cards (one card per paragraph/list/photo) built by a data-driven `about-me-decks.js`, with built-in prev/next arrows that pop the top card to the back of the stack, and free physics dragging that lets any card collide with anything else on the page.

**Tech Stack:** Vanilla HTML/CSS/JS, no build step, no test framework (verified: no `package.json` in repo). Verification is `node --check` for JS syntax and manual browser QA (this repo has no automated test runner).

## Global Constraints

- Do not modify `bubble-pool.js` or change `contact.html`'s existing behavior (spec §3, non-goals).
- Do not change Projects page bubble content, links, tooltips, or status badges — only their physics/visual treatment (spec §3, §6).
- Physics constants must be "louder and longer" than the Contact page: RESTITUTION 0.96, DAMPING 0.99, MAX_LAUNCH 70, HIT_COOLDOWN 900ms, SLOW_SPEED 1.8, idle drift amplitude 10-18px (spec §4.2).
- `prefers-reduced-motion: reduce` and narrow fields (< 340px) must fall back to a fully usable static layout, no physics (spec §7).
- No intermediate wrapper element between a physics body and its page-level field container may have `position: relative/absolute/fixed` set — only the field container itself is positioned. (This is required for the shared-field coordinate math in §4.1 below; violating it will visibly misplace bubbles.)
- Card diameter formula: `clamp(280px, 260px + wordCount * 2.4px, 440px)`; image cards fixed at 320px (spec §5.5).

---

### Task 1: Shared physics engine module

**Files:**
- Create: `d:\Desktop\Portfolio-Page\bubble-physics.js`

**Interfaces:**
- Produces: `window.BubblePhysics.createField(options)` where `options = { field: HTMLElement, bodies: HTMLElement[], constants?: object }`. Returns `null` if reduced-motion is set or `field` is narrower than 340px, otherwise returns `{ bodies, retarget(el, newHome, opts), findBody(el), destroy() }`. `retarget(el, {x,y}, { detour?: {x,y} })` changes an existing body's physics home (optionally routing it through a detour waypoint first before settling at the new home) — used later by the deck arrow-cycle feature.

- [ ] **Step 1: Write the module**

```javascript
/* ============================================================
   bubble-physics.js — shared pool-table physics engine.

   Generalized core extracted from bubble-pool.js (the Contact
   page's engine, which stays untouched). This module takes any
   set of DOM elements as physics bodies and uses their CURRENT
   rendered position (after normal CSS layout) as their home —
   unlike bubble-pool.js's fixed "big bubble in center, others
   orbit" layout, which is specific to the Contact page.

   Usage:
     const controller = BubblePhysics.createField({
       field: document.getElementById('pageField'),   // position:relative
       bodies: [el1, el2, ...],                        // already laid out
       constants: { ... }                              // optional overrides
     });
     controller.retarget(el, { x, y }, { detour: { x, y } });
     controller.destroy();
   ============================================================ */
(function (global) {
  'use strict';

  const DEFAULTS = {
    RESTITUTION: 0.96,
    DAMPING: 0.99,
    SPRING: 0.02,
    SPRING_DAMPING: 0.9,
    HOMING_CAP: 10,
    CLICK_MS: 180,
    CLICK_PX: 6,
    MAX_LAUNCH: 70,
    SLOW_SPEED: 1.8,
    HIT_COOLDOWN: 900,
    EDGE_PAD: 8,
    DRIFT_AMP_MIN: 10,
    DRIFT_AMP_MAX: 18,
    MIN_FIELD_WIDTH: 340
  };

  function createField(options) {
    const field = options.field;
    const els = (options.bodies || []).slice();
    if (!field || els.length < 1) return null;
    if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

    const C = Object.assign({}, DEFAULTS, options.constants || {});

    let fieldW = 0, fieldH = 0;
    function measureField() {
      const rect = field.getBoundingClientRect();
      fieldW = rect.width;
      fieldH = rect.height;
    }
    measureField();
    if (fieldW < C.MIN_FIELD_WIDTH) return null;

    field.classList.add('pool-active');

    const bodies = els.map((el) => {
      const rect = el.getBoundingClientRect();
      const fieldRect = field.getBoundingClientRect();
      const cx = rect.left - fieldRect.left + rect.width / 2;
      const cy = rect.top - fieldRect.top + rect.height / 2;
      const r = Math.max(rect.width, rect.height) / 2;
      el.style.position = 'absolute';
      el.style.top = '0';
      el.style.left = '0';
      el.style.margin = '0';
      return {
        el, r, m: r,
        x: cx, y: cy, vx: 0, vy: 0,
        home: { x: cx, y: cy },
        detour: null,
        state: 'idle',
        homing: false,
        lastHit: 0,
        slowSince: 0,
        ampX: C.DRIFT_AMP_MIN + Math.random() * (C.DRIFT_AMP_MAX - C.DRIFT_AMP_MIN),
        ampY: C.DRIFT_AMP_MIN + Math.random() * (C.DRIFT_AMP_MAX - C.DRIFT_AMP_MIN),
        freqX: 0.2 + Math.random() * 0.2,
        freqY: 0.2 + Math.random() * 0.2,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        pointerId: null,
        grabDX: 0, grabDY: 0,
        pressT: 0, pressX: 0, pressY: 0,
        samples: [],
        suppressClick: false
      };
    });

    function render(b) {
      b.el.style.transform = 'translate3d(' + (b.x - b.r).toFixed(1) + 'px, ' + (b.y - b.r).toFixed(1) + 'px, 0)';
    }
    bodies.forEach(render);

    function pointerToField(e) {
      const rect = field.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function excite(b, now) {
      if (b.state !== 'drag') b.state = 'excited';
      b.lastHit = now;
    }

    let rafId = null;

    function step(now) {
      const t = now / 1000;

      for (const b of bodies) {
        if (b.state === 'idle') {
          b.x = b.home.x + b.ampX * Math.sin(t * b.freqX * Math.PI * 2 + b.phaseX);
          b.y = b.home.y + b.ampY * Math.sin(t * b.freqY * Math.PI * 2 + b.phaseY);
          b.vx = 0; b.vy = 0;
        }
      }

      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], b = bodies[j];
          if (a.state === 'idle' && b.state === 'idle') continue;
          if (a.homing || b.homing) continue;
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 1;
          const minDist = a.r + b.r;
          if (dist < minDist) {
            const nx = dx / dist, ny = dy / dist;
            const invA = a.state === 'drag' ? 0 : 1 / a.m;
            const invB = b.state === 'drag' ? 0 : 1 / b.m;
            const invSum = invA + invB;
            if (invSum === 0) continue;
            const overlap = minDist - dist;
            a.x -= nx * overlap * (invA / invSum);
            a.y -= ny * overlap * (invA / invSum);
            b.x += nx * overlap * (invB / invSum);
            b.y += ny * overlap * (invB / invSum);
            const relVx = b.vx - a.vx, relVy = b.vy - a.vy;
            const relSpeed = relVx * nx + relVy * ny;
            if (relSpeed < 0) {
              const impulse = -(1 + C.RESTITUTION) * relSpeed / invSum;
              a.vx -= impulse * invA * nx; a.vy -= impulse * invA * ny;
              b.vx += impulse * invB * nx; b.vy += impulse * invB * ny;
            }
            excite(a, now); excite(b, now);
          }
        }
      }

      for (const b of bodies) {
        if (b.state !== 'excited') { render(b); continue; }

        const speed = Math.abs(b.vx) + Math.abs(b.vy);
        if (speed >= C.SLOW_SPEED) b.slowSince = 0;
        else if (!b.slowSince) b.slowSince = now;
        if (!b.homing && speed < C.SLOW_SPEED &&
            (now - b.lastHit > C.HIT_COOLDOWN || now - b.slowSince > 1200)) {
          b.homing = true;
        }

        if (b.homing) {
          const target = b.detour || b.home;
          b.vx += (target.x - b.x) * C.SPRING;
          b.vy += (target.y - b.y) * C.SPRING;
          b.vx *= C.SPRING_DAMPING;
          b.vy *= C.SPRING_DAMPING;
          const hsp = Math.hypot(b.vx, b.vy);
          if (hsp > C.HOMING_CAP) {
            b.vx = b.vx / hsp * C.HOMING_CAP;
            b.vy = b.vy / hsp * C.HOMING_CAP;
          }
          if (Math.hypot(target.x - b.x, target.y - b.y) < 3 &&
              Math.abs(b.vx) + Math.abs(b.vy) < 0.6) {
            b.x = target.x; b.y = target.y; b.vx = 0; b.vy = 0;
            if (b.detour) {
              b.detour = null;
            } else {
              b.state = 'idle';
              b.homing = false;
              b.phaseX = -t * b.freqX * Math.PI * 2;
              b.phaseY = -t * b.freqY * Math.PI * 2;
            }
          }
        } else {
          b.vx *= C.DAMPING; b.vy *= C.DAMPING;
        }

        const cap = C.MAX_LAUNCH * 1.2;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > cap) { b.vx = b.vx / sp * cap; b.vy = b.vy / sp * cap; }

        b.x += b.vx; b.y += b.vy;

        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * C.RESTITUTION; }
        else if (b.x > fieldW - b.r) { b.x = fieldW - b.r; b.vx = -Math.abs(b.vx) * C.RESTITUTION; }
        if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * C.RESTITUTION; }
        else if (b.y > fieldH - b.r) { b.y = fieldH - b.r; b.vy = -Math.abs(b.vy) * C.RESTITUTION; }

        render(b);
      }

      rafId = requestAnimationFrame(step);
    }

    function start() { if (rafId === null) rafId = requestAnimationFrame(step); }
    function stop() { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }

    function onVisibility() { if (document.hidden) stop(); else start(); }
    document.addEventListener('visibilitychange', onVisibility);

    bodies.forEach(b => {
      const el = b.el;

      function onPointerDown(e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* non-active pointer */ }
        b.pointerId = e.pointerId;
        b.state = 'drag';
        b.homing = false;
        b.detour = null;
        b.vx = 0; b.vy = 0;
        el.classList.add('dragging');
        b.pressT = performance.now();
        b.pressX = e.clientX;
        b.pressY = e.clientY;
        const p = pointerToField(e);
        b.grabDX = b.x - p.x;
        b.grabDY = b.y - p.y;
        b.samples = [{ x: e.clientX, y: e.clientY, t: b.pressT }];
      }

      function onPointerMove(e) {
        if (b.state !== 'drag' || e.pointerId !== b.pointerId) return;
        const now = performance.now();
        const p = pointerToField(e);
        let nx = Math.min(Math.max(p.x + b.grabDX, b.r), fieldW - b.r);
        let ny = Math.min(Math.max(p.y + b.grabDY, b.r), fieldH - b.r);
        b.vx = nx - b.x; b.vy = ny - b.y;
        b.x = nx; b.y = ny;
        render(b);
        b.samples.push({ x: e.clientX, y: e.clientY, t: now });
        while (b.samples.length > 2 && now - b.samples[0].t > 120) b.samples.shift();
      }

      function release(e) {
        if (b.state !== 'drag' || e.pointerId !== b.pointerId) return;
        const now = performance.now();
        el.classList.remove('dragging');
        b.pointerId = null;
        const dt = now - b.pressT;
        const dist = Math.hypot(e.clientX - b.pressX, e.clientY - b.pressY);

        if (dt <= C.CLICK_MS && dist <= C.CLICK_PX) {
          b.state = 'excited'; b.vx = 0; b.vy = 0; b.lastHit = 0;
          return;
        }

        b.suppressClick = true;
        const recent = b.samples.filter(s => now - s.t <= 100);
        const first = recent[0] || b.samples[0];
        const last = b.samples[b.samples.length - 1];
        const span = Math.max(last.t - first.t, 16);
        let vx = (last.x - first.x) / span * (1000 / 60);
        let vy = (last.y - first.y) / span * (1000 / 60);
        const mag = Math.hypot(vx, vy);
        if (mag > C.MAX_LAUNCH) { vx = vx / mag * C.MAX_LAUNCH; vy = vy / mag * C.MAX_LAUNCH; }
        b.vx = vx; b.vy = vy;
        b.state = 'excited';
        b.lastHit = now;
      }

      el.addEventListener('pointerdown', onPointerDown);
      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('click', function (e) {
        if (b.suppressClick) { e.preventDefault(); e.stopPropagation(); b.suppressClick = false; }
      }, true);
    });

    let resizeTimer = null;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        const oldW = fieldW, oldH = fieldH;
        measureField();
        const sx = fieldW / oldW, sy = fieldH / oldH;
        bodies.forEach(b => {
          b.home.x *= sx; b.home.y *= sy;
          if (b.state === 'idle') { b.x = b.home.x; b.y = b.home.y; }
          else {
            b.x = Math.min(Math.max(b.x * sx, b.r), fieldW - b.r);
            b.y = Math.min(Math.max(b.y * sy, b.r), fieldH - b.r);
          }
          render(b);
        });
      }, 150);
    }
    global.addEventListener('resize', onResize);

    start();

    function findBody(el) { return bodies.find(function (b) { return b.el === el; }); }

    function retarget(el, newHome, opts) {
      const b = findBody(el);
      if (!b) return;
      opts = opts || {};
      b.home = { x: newHome.x, y: newHome.y };
      b.detour = opts.detour ? { x: opts.detour.x, y: opts.detour.y } : null;
      b.state = 'excited';
      b.homing = true;
      b.slowSince = 0;
      b.lastHit = performance.now();
    }

    function destroy() {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      global.removeEventListener('resize', onResize);
      field.classList.remove('pool-active');
    }

    return { bodies, retarget, destroy, findBody };
  }

  global.BubblePhysics = { createField: createField };
})(window);
```

- [ ] **Step 2: Verify syntax**

Run: `node --check bubble-physics.js`
Expected: no output (exit code 0).

- [ ] **Step 3: Commit**

```bash
git add bubble-physics.js
git commit -m "feat: add shared bubble-physics engine for About Me / Projects pages"
```

---

### Task 2: Shared bubble CSS

**Files:**
- Modify: `d:\Desktop\Portfolio-Page\site-bubbles.css` (append to end of file)

**Interfaces:**
- Consumes: `--glass-bg`, `--glass-bg-hover`, `--glass-border`, `--glass-border-bright`, `--glow-shadow`, `--glow-shadow-hover`, `--rainbow` custom properties (already defined at the top of this file). `@keyframes backgroundCycle` (already defined in `carousel.css`, which every page using these classes already loads).
- Produces: CSS classes `.bubble-cycling-glow`, `.bubble-back-btn` (+ `.bbb-arrow`, `.bbb-tooltip`), `.bubble-title` (+ `.bubble-title-caption`), `.bubble-page-field`, `.deck-column`, `.deck-wrap`, `.deck-card` (+ `.deck-card-inner`, `.deck-step`, `.deck-list-heading`, `.deck-link`, `.wobble`), `.deck-controls`, `.deck-arrow-btn`, `.deck-slide-count`.

- [ ] **Step 1: Append the new CSS**

```css

/* ============================================================
   About Me / Projects bubble redesign — shared styles.
   Consumes tokens defined above (--glass-*, --glow-*, --rainbow).
   @keyframes backgroundCycle comes from carousel.css, already
   loaded by every page that uses .bubble-cycling-glow.
   ============================================================ */

/* ---------- Cycling background glow ---------- */
.bubble-cycling-glow {
  position: relative;
  overflow: hidden;
}
.bubble-cycling-glow::before {
  content: '';
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  animation: backgroundCycle 130s infinite ease-in-out;
  opacity: 0.4;
  pointer-events: none;
  z-index: 0;
}
.bubble-cycling-glow > * { position: relative; z-index: 1; }

/* ---------- True-circle back button ---------- */
.bubble-back-btn {
  position: relative;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: var(--glow-shadow);
  color: #fff;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.25s ease, background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
.bubble-back-btn:hover,
.bubble-back-btn:focus-visible {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-bright);
  box-shadow: var(--glow-shadow-hover);
  transform: scale(1.08);
}
.bubble-back-btn .bbb-arrow { font-size: 1.3rem; pointer-events: none; }
.bubble-back-btn .bbb-tooltip {
  position: absolute;
  top: 50%;
  left: calc(100% + 12px);
  transform: translateY(-50%) translateX(-6px);
  white-space: nowrap;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(10, 10, 15, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.18);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.bubble-back-btn:hover .bbb-tooltip,
.bubble-back-btn:focus-visible .bbb-tooltip {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

/* ---------- True-circle title bubble ---------- */
.bubble-title {
  width: 260px;
  height: 260px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glow-shadow);
  margin: 0 auto;
}
.bubble-title h1 {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.15;
  margin: 0;
  max-width: 74%;
  background: var(--rainbow);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.bubble-title-caption {
  text-align: center;
  margin: 14px auto 32px;
}
.bubble-title-caption .label {
  display: block;
  font-size: 0.7rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 700;
  background: var(--rainbow);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 6px;
}
.bubble-title-caption p {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
}

/* ---------- Shared physics field wrapper ---------- */
.bubble-page-field {
  position: relative;
  width: 100%;
}
.bubble-page-field.pool-active { touch-action: none; }
.bubble-page-field .dragging { cursor: grabbing; z-index: 500; }

/* ---------- Content deck (stacked bubble carousel) ---------- */
.deck-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.deck-wrap {
  position: static;
  width: 100%;
  min-height: 500px;
}
.deck-card {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  background: rgba(10, 10, 15, 0.65);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glow-shadow);
}
.deck-card-inner {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 14%;
  transform-origin: center;
}
.deck-card .deck-step {
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  color: #8b8fc7;
  margin-bottom: 8px;
}
.deck-card-inner p {
  font-size: 0.9rem;
  line-height: 1.55;
  color: #b8bbda;
  margin: 0;
}
.deck-card-inner .deck-list-heading {
  font-weight: 700;
  color: #e8eaf6;
  margin-top: 10px;
}
.deck-card-inner ul {
  text-align: left;
  padding-left: 1.1em;
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: #b8bbda;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 100%;
  overflow-y: auto;
}
.deck-card-inner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  position: absolute;
  inset: 0;
}
.deck-card-inner a.deck-link {
  background: var(--rainbow);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
  text-decoration: none;
}
.deck-card.wobble { animation: deckWobble 3.6s ease-in-out infinite; }
@keyframes deckWobble {
  0%, 100% { margin-top: 0; }
  50% { margin-top: -4px; }
}

.deck-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.deck-arrow-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: #fff;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}
.deck-arrow-btn:hover,
.deck-arrow-btn:focus-visible {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-bright);
  transform: scale(1.08);
}
.deck-slide-count {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  min-width: 3.5em;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .deck-card.wobble { animation: none; }
  .bubble-cycling-glow::before { animation: none; }
}

@media (max-width: 720px) {
  .bubble-title { width: 200px; height: 200px; }
  .bubble-title h1 { font-size: 1.25rem; }
  .deck-wrap { min-height: 380px; }
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `node -e "require('fs').readFileSync('site-bubbles.css','utf8')"`
Expected: no output (this just confirms the file is still readable/well-formed as text; CSS has no strict syntax checker available in this repo, so visual verification happens in Task 5/7).

- [ ] **Step 3: Commit**

```bash
git add site-bubbles.css
git commit -m "feat: add shared CSS for bubble title/back-button/deck-card treatment"
```

---

### Task 3: About Me content data + deck-building logic

**Files:**
- Create: `d:\Desktop\Portfolio-Page\about-me-decks.js`

**Interfaces:**
- Consumes: none (pure data + DOM builder module).
- Produces: `window.AboutMeDecks = { JOURNEY_SLIDES, SKILLS_SLIDES, buildDeck(container, slides) }`. `buildDeck` returns `{ cards: HTMLElement[], order: number[], layout(), stackOffset(depth), container }`. `order[0]` is always the index (into `cards`) of the current top/front card.

- [ ] **Step 1: Write the module**

```javascript
/* ============================================================
   about-me-decks.js — content data + stacked-deck DOM builder
   for the About Me page's two bubble carousels.
   ============================================================ */
(function (global) {
  'use strict';

  const JOURNEY_SLIDES = [
    { type: 'text', text: "A lifelong creative exploring media as diverse as sound sculpture, fibre art, painting, poetry, and soap making, my practice currently exists at the intersection of photography, digital manipulation, and blockchain-based community art. After three decades as a professional chef, a career-ending injury pushed me into software development—a shift that fundamentally changed my creative practice and kick-started an incredible new artistic odyssey." },
    { type: 'text', text: "I discovered that debugging code, like recipe development, is about transformation: taking ideas and raw materials and reshaping them into something new that provides a nourishing experience. Software development offered something my earlier media couldn't—the ability to create work that scales, persists, and invites participation. Code lets me turn ideas into interactive experiences. Now I work creatively in this digital realm, treating technology as both medium and collaborator in building more inclusive digital spaces." },
    { type: 'text', text: "What excites me is that this technology is a studio, a megaphone, and a toolkit all in one. It amplifies creativity, connects communities, and opens sustainable paths for artists who've been shut out of traditional systems. I'm building tools and experiences that let marginalized creators own their work, reach audiences directly, and thrive on their own terms—using code and blockchain as levers for real equity." },
    { type: 'link', text: "See what I'm cooking up", href: 'projects.html' },
    { type: 'image', src: 'images/HummingBow.jpg', alt: 'Rainbow art photograph from the Ordinal Rainbows collection' },
    { type: 'image', src: 'images/IMG_20201211_103947_047.png', alt: 'Portrait of Michael Needham' }
  ];

  const SKILLS_SLIDES = [
    {
      type: 'list',
      intro: "My career has spanned over 30 years in culinary arts, where I honed creativity and precision under pressure. The kitchen taught me invaluable lessons that translate directly to software development.",
      heading: "From the kitchen to the codebase",
      items: [
        "Systems Thinking: Keeping the entirety of the project in mind, and how all components interact.",
        "Emotional Intelligence: Understanding and managing emotions in both personal and professional contexts.",
        "Adaptability: Adjusting to new environments, challenges, and evolving requirements."
      ]
    },
    {
      type: 'list',
      intro: "Transitioning into software development has allowed me to apply these same principles to digital creation, where I now build interactive experiences and tools that empower creators and communities. As an artist and developer committed to social justice, I see technology as a way to dismantle gatekeeping and redistribute power.",
      heading: "What that looks like in practice",
      items: [
        "Creative Advocacy: Art and tech projects that amplify marginalized voices and challenge inequity.",
        "Inclusive Design: Tools and platforms built for accessibility, ensuring people of all abilities and backgrounds can participate.",
        "Alternative Economics: Community-driven platforms and revenue models that empower creators and redistribute resources.",
        "Civic Technology: Projects that advocate for environmental justice, equitable access, and inclusive public spaces.",
        "Community Empowerment: Collaborative spaces where diverse groups co-create solutions for a more just future."
      ]
    },
    { type: 'image', src: 'images/TieDyeBow.JPEG', alt: 'Tie-dye rainbow art photograph from the Ordinal Rainbows collection' },
    { type: 'image', src: 'images/IMG_20201211_103947_047.png', alt: 'Portrait of Michael Needham' }
  ];

  function wordCount(str) {
    return (String(str).trim().match(/\S+/g) || []).length;
  }

  function diameterFor(slide) {
    if (slide.type === 'image') return 320;
    let text;
    if (slide.type === 'list') text = [slide.intro, slide.heading].concat(slide.items).join(' ');
    else if (slide.type === 'link') text = slide.text;
    else text = slide.text || '';
    const wc = wordCount(text);
    return Math.min(440, Math.max(280, 260 + wc * 2.4));
  }

  function makeStep(index, total) {
    const step = document.createElement('span');
    step.className = 'deck-step';
    step.textContent = (index + 1) + ' / ' + total;
    return step;
  }

  function buildCard(slide, index, total) {
    const el = document.createElement('div');
    el.className = 'deck-card bubble-cycling-glow';
    const d = diameterFor(slide);
    el.style.width = d + 'px';
    el.style.height = d + 'px';

    const inner = document.createElement('div');
    inner.className = 'deck-card-inner';

    if (slide.type === 'image') {
      const img = document.createElement('img');
      img.src = slide.src;
      img.alt = slide.alt;
      inner.appendChild(img);
    } else if (slide.type === 'link') {
      inner.appendChild(makeStep(index, total));
      const a = document.createElement('a');
      a.className = 'deck-link';
      a.href = slide.href;
      a.textContent = slide.text + ' →';
      inner.appendChild(a);
    } else if (slide.type === 'list') {
      inner.appendChild(makeStep(index, total));
      const p = document.createElement('p');
      p.textContent = slide.intro;
      inner.appendChild(p);
      const h = document.createElement('p');
      h.className = 'deck-list-heading';
      h.textContent = slide.heading;
      inner.appendChild(h);
      const ul = document.createElement('ul');
      slide.items.forEach(function (it) {
        const li = document.createElement('li');
        li.textContent = it;
        ul.appendChild(li);
      });
      inner.appendChild(ul);
    } else {
      inner.appendChild(makeStep(index, total));
      const p = document.createElement('p');
      p.textContent = slide.text;
      inner.appendChild(p);
    }

    el.appendChild(inner);
    return el;
  }

  function stackOffset(depth) {
    return { dx: depth * 10, dy: depth * 14, rot: depth * -3, scale: 1 - depth * 0.04 };
  }

  function buildDeck(container, slides) {
    const cards = slides.map(function (s, i) { return buildCard(s, i, slides.length); });
    cards.forEach(function (c) { container.appendChild(c); });
    const order = cards.map(function (_, i) { return i; });

    function layout() {
      order.forEach(function (cardIdx, depth) {
        const el = cards[cardIdx];
        const offset = stackOffset(depth);
        el.style.zIndex = String(100 - depth);
        el.style.transform = 'translate(' + offset.dx + 'px, ' + offset.dy + 'px)';
        const inner = el.querySelector('.deck-card-inner');
        if (inner) inner.style.transform = 'rotate(' + offset.rot + 'deg) scale(' + offset.scale + ')';
        el.classList.toggle('wobble', depth === 0);
        el.setAttribute('aria-hidden', depth === 0 ? 'false' : 'true');
      });
    }
    layout();

    return { cards: cards, order: order, layout: layout, stackOffset: stackOffset, container: container };
  }

  global.AboutMeDecks = {
    JOURNEY_SLIDES: JOURNEY_SLIDES,
    SKILLS_SLIDES: SKILLS_SLIDES,
    buildDeck: buildDeck
  };
})(window);
```

- [ ] **Step 2: Verify syntax**

Run: `node --check about-me-decks.js`
Expected: no output (exit code 0).

- [ ] **Step 3: Verify the data and builder logic in isolation**

Run: `node -e "
const { JSDOM } = (() => { try { return require('jsdom'); } catch (e) { return {}; } })();
"`

Since `jsdom` is not a dependency of this static-site repo, do a lighter manual check instead:

Run: `node -e "
global.window = global;
global.document = { createElement: () => ({ style: {}, classList: { add(){}, toggle(){} }, setAttribute(){}, appendChild(){}, querySelector: () => null }) };
require('./about-me-decks.js');
console.log('JOURNEY_SLIDES:', AboutMeDecks.JOURNEY_SLIDES.length);
console.log('SKILLS_SLIDES:', AboutMeDecks.SKILLS_SLIDES.length);
"`
Expected:
```
JOURNEY_SLIDES: 6
SKILLS_SLIDES: 4
```

- [ ] **Step 4: Commit**

```bash
git add about-me-decks.js
git commit -m "feat: add About Me deck content data and card-building logic"
```

---

### Task 4: About Me page markup + glue script

**Files:**
- Modify: `d:\Desktop\Portfolio-Page\about-me.html` (replace `<style>` block's `.am-header`/`.am-grid`/`.am-card` rules and the `<body>` content between `<!-- Back to portfolio -->` and `<script src="bg-anim.js">`)
- Create: `d:\Desktop\Portfolio-Page\about-me-bubbles.js`

**Interfaces:**
- Consumes: `window.AboutMeDecks.buildDeck`, `window.AboutMeDecks.JOURNEY_SLIDES`, `window.AboutMeDecks.SKILLS_SLIDES` (Task 3), `window.BubblePhysics.createField` (Task 1), CSS classes from Task 2.
- Produces: working About Me page.

- [ ] **Step 1: Replace the page-specific `<style>` block in `about-me.html`**

Remove the existing rules for `.am-header`, `.am-grid`, `.am-card` (and its children), `.am-section-title`, and `.am-back-row` (lines roughly 36–196 in the original file — the header/grid/card/back-row block). The back button moves inside the physics field in Step 2 below, so `.am-back-row` is dead CSS once removed. Keep `.am-page` and `.am-footer`. Replace the removed block with:

```css
    .am-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 24px 60px;
      min-height: 100vh;
      position: relative;
      z-index: 10;
    }

    .am-back-row-inline {
      width: 100%;
      max-width: 1080px;
      margin: 0 0 20px;
    }

    .am-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
      width: 100%;
      max-width: 1080px;
    }
    @media (max-width: 720px) {
      .am-grid { grid-template-columns: 1fr; }
    }

    .am-footer {
      margin-top: 40px;
      color: var(--am-muted, #6b7099);
      font-size: .78rem;
      text-align: center;
    }
    .am-footer a {
      background: var(--rainbow);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      text-decoration: none;
      font-weight: 600;
    }
    .am-footer a:hover { text-decoration: underline; }
```

- [ ] **Step 2: Replace the `<body>` content**

Replace everything from `<!-- Back to portfolio -->` through the closing `</div><!-- /.am-page -->` with:

```html
  <div class="am-page">
    <div class="bubble-page-field" id="aboutMeField">

      <div class="am-back-row-inline">
        <a href="index.html" class="bubble-back-btn" id="aboutMeBack" aria-label="Back to portfolio">
          <span class="bbb-arrow" aria-hidden="true">&larr;</span>
          <span class="bbb-tooltip">Portfolio</span>
        </a>
      </div>

      <div class="bubble-title bubble-cycling-glow" id="aboutMeTitle">
        <h1>About Me</h1>
      </div>
      <div class="bubble-title-caption">
        <span class="label">Portfolio</span>
        <p>Developer &middot; Artist &middot; Activist</p>
      </div>

      <div class="am-grid">
        <div class="deck-column">
          <div class="deck-wrap" id="journeyDeck"></div>
          <div class="deck-controls">
            <button type="button" class="deck-arrow-btn" id="journeyPrev" aria-label="Previous slide in Journey carousel">&lsaquo;</button>
            <span class="deck-slide-count" id="journeyLive" aria-live="polite"></span>
            <button type="button" class="deck-arrow-btn" id="journeyNext" aria-label="Next slide in Journey carousel">&rsaquo;</button>
          </div>
        </div>
        <div class="deck-column">
          <div class="deck-wrap" id="skillsDeck"></div>
          <div class="deck-controls">
            <button type="button" class="deck-arrow-btn" id="skillsPrev" aria-label="Previous slide in Skills carousel">&lsaquo;</button>
            <span class="deck-slide-count" id="skillsLive" aria-live="polite"></span>
            <button type="button" class="deck-arrow-btn" id="skillsNext" aria-label="Next slide in Skills carousel">&rsaquo;</button>
          </div>
        </div>
      </div>

    </div><!-- /.bubble-page-field -->

    <footer class="am-footer">
      <a href="index.html">Portfolio</a> &middot; Michael Needham &middot; Developer &middot; Artist &middot; Activist
    </footer>

  </div><!-- /.am-page -->
```

- [ ] **Step 3: Add the new script tags before the closing `</body>`**

Find:
```html
  <script src="bg-anim.js"></script>
  <script src="bubble-fx.js"></script>
</body>
```
Replace with:
```html
  <script src="bg-anim.js"></script>
  <script src="bubble-fx.js"></script>
  <script src="bubble-physics.js"></script>
  <script src="about-me-decks.js"></script>
  <script src="about-me-bubbles.js"></script>
</body>
```

- [ ] **Step 4: Write `about-me-bubbles.js`**

```javascript
/* ============================================================
   about-me-bubbles.js — glue: builds the two decks, registers
   every bubble (back button, title, all deck cards) in one
   shared BubblePhysics field, and wires the prev/next arrows.
   ============================================================ */
(function () {
  'use strict';

  const pageField = document.getElementById('aboutMeField');
  const journeyContainer = document.getElementById('journeyDeck');
  const skillsContainer = document.getElementById('skillsDeck');
  const backBtn = document.getElementById('aboutMeBack');
  const titleBubble = document.getElementById('aboutMeTitle');
  if (!pageField || !journeyContainer || !skillsContainer) return;

  const journeyDeck = window.AboutMeDecks.buildDeck(journeyContainer, window.AboutMeDecks.JOURNEY_SLIDES);
  const skillsDeck = window.AboutMeDecks.buildDeck(skillsContainer, window.AboutMeDecks.SKILLS_SLIDES);

  function anchorOf(container) {
    const c = container.getBoundingClientRect();
    const f = pageField.getBoundingClientRect();
    return { x: c.left - f.left + c.width / 2, y: c.top - f.top + c.height / 2 };
  }
  const journeyAnchor = anchorOf(journeyContainer);
  const skillsAnchor = anchorOf(skillsContainer);

  const allBodies = [backBtn, titleBubble].concat(journeyDeck.cards, skillsDeck.cards).filter(Boolean);
  const physics = window.BubblePhysics.createField({ field: pageField, bodies: allBodies });

  function wireArrows(prefix, deck, anchor) {
    const prevBtn = document.getElementById(prefix + 'Prev');
    const nextBtn = document.getElementById(prefix + 'Next');
    const liveRegion = document.getElementById(prefix + 'Live');

    function announce() {
      if (!liveRegion) return;
      liveRegion.textContent = 'Slide ' + (deck.order[0] + 1) + ' of ' + deck.cards.length;
    }

    function cycle(direction) {
      const leavingIdx = direction === 'next' ? deck.order[0] : deck.order[deck.order.length - 1];
      if (direction === 'next') deck.order.push(deck.order.shift());
      else deck.order.unshift(deck.order.pop());

      if (!physics) {
        deck.layout();
        announce();
        return;
      }

      deck.order.forEach(function (cardIdx, depth) {
        const el = deck.cards[cardIdx];
        const offset = deck.stackOffset(depth);
        const inner = el.querySelector('.deck-card-inner');
        if (inner) inner.style.transform = 'rotate(' + offset.rot + 'deg) scale(' + offset.scale + ')';
        el.classList.toggle('wobble', depth === 0);
        el.setAttribute('aria-hidden', depth === 0 ? 'false' : 'true');
        const home = { x: anchor.x + offset.dx, y: anchor.y + offset.dy };
        if (cardIdx === leavingIdx) {
          const sign = direction === 'next' ? 1 : -1;
          physics.retarget(el, home, { detour: { x: anchor.x + sign * 260, y: anchor.y - 90 } });
        } else {
          physics.retarget(el, home);
        }
      });
      announce();
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { cycle('prev'); });
    if (nextBtn) nextBtn.addEventListener('click', function () { cycle('next'); });
    announce();
  }

  wireArrows('journey', journeyDeck, journeyAnchor);
  wireArrows('skills', skillsDeck, skillsAnchor);
})();
```

- [ ] **Step 5: Verify syntax**

Run: `node --check about-me-bubbles.js`
Expected: no output (exit code 0).

- [ ] **Step 6: Commit**

```bash
git add about-me.html about-me-bubbles.js
git commit -m "feat: rebuild About Me page as physics-driven bubble decks"
```

---

### Task 5: Manual QA — About Me page

**Files:** none (verification only)

- [ ] **Step 1: Open the page and confirm baseline render**

Open `about-me.html` directly in a browser (double-click or `file://` path). Confirm: back button is a small circle top-left with a tooltip on hover; title is a circle reading "About Me"; two decks are visible with a readable top card each; arrows and slide counter are visible under each deck.

- [ ] **Step 2: Confirm arrow cycling**

Click the Journey deck's `›` arrow 4 times. Confirm the top card flies out and a new one appears each time, and after the 4th click the deck-slide-count and content return to slide 1 of 6 (having cycled through all 6). Repeat with `‹` to go backward. Repeat for the Skills deck (4 slides).

- [ ] **Step 3: Confirm shared physics field**

Drag the About Me title bubble across the screen and release with some velocity. Confirm it collides with nearby deck cards or the back button, everything scatters, and every bubble independently drifts back to its own position within a few seconds. Confirm the "See what I'm cooking up" link card and image cards are draggable too.

- [ ] **Step 4: Confirm reduced motion fallback**

In browser DevTools, enable "prefers-reduced-motion: reduce" (Chrome: Rendering tab → Emulate CSS media feature). Reload the page. Confirm bubbles do not drift/wobble, dragging does nothing, but the arrows still cycle slides correctly (no physics needed).

- [ ] **Step 5: Confirm links still work**

Click (short click, no drag) the back button — confirm it navigates to `index.html`. Cycle the Journey deck to its "See what I'm cooking up" card and click it — confirm it navigates to `projects.html`.

- [ ] **Step 6: Fix any issues found, then commit**

```bash
git add -A
git commit -m "fix: address About Me bubble QA findings"
```
(Only run this commit if fixes were needed — otherwise skip.)

---

### Task 6: Projects page bubble-field integration

**Files:**
- Modify: `d:\Desktop\Portfolio-Page\projects.html`
- Create: `d:\Desktop\Portfolio-Page\projects-bubbles.js`

**Interfaces:**
- Consumes: `window.BubblePhysics.createField` (Task 1), `.bubble-cycling-glow`/`.bubble-title`/`.bubble-back-btn`/`.bubble-page-field` CSS (Task 2). Existing `.project-bubble` elements (from `carousel.css`, unchanged).
- Produces: working Projects page with title/back bubbles and all 12 project bubbles in one shared physics field.

- [ ] **Step 1: Replace the page-specific `<style>` block's header/back-row rules in `projects.html`**

Remove `.pg-header` and its children, and `.am-back-row`. Keep `.pg-page` and `.pg-footer`. Add:

```css
    .am-back-row-inline {
      width: 100%;
      max-width: 1080px;
      margin: 0 0 20px;
    }
```

- [ ] **Step 2: Replace the back-row + header markup**

Find:
```html
  <div class="am-back-row">
    <a href="index.html" class="nav-button"><h4>← Home</h4></a>
  </div>

  <div class="pg-page">
    <header class="pg-header">
      <span class="label">Portfolio</span>
      <h1>Projects</h1>
    </header>
```
Replace with:
```html
  <div class="pg-page">
    <div class="bubble-page-field" id="projectsField">

      <div class="am-back-row-inline">
        <a href="index.html" class="bubble-back-btn" id="projectsBack" aria-label="Back to portfolio">
          <span class="bbb-arrow" aria-hidden="true">&larr;</span>
          <span class="bbb-tooltip">Portfolio</span>
        </a>
      </div>

      <div class="bubble-title bubble-cycling-glow" id="projectsTitle">
        <h1>Projects</h1>
      </div>
      <div class="bubble-title-caption">
        <span class="label">Portfolio</span>
      </div>
```

- [ ] **Step 3: Close the new wrapper div**

Find:
```html
    </div>

    <footer class="pg-footer">
      <a href="index.html">Home</a> · Michael Needham · Developer · Artist · Activist
    </footer>
  </div>
```
(this is the closing of `.project-bubbles` followed by the footer) and replace with:
```html
    </div>

    </div><!-- /.bubble-page-field -->

    <footer class="pg-footer">
      <a href="index.html">Home</a> · Michael Needham · Developer · Artist · Activist
    </footer>
  </div>
```

- [ ] **Step 4: Add the new script tags**

Find:
```html
  <script src="bg-anim.js"></script>
</body>
```
Replace with:
```html
  <script src="bg-anim.js"></script>
  <script src="bubble-physics.js"></script>
  <script src="projects-bubbles.js"></script>
</body>
```

- [ ] **Step 5: Write `projects-bubbles.js`**

```javascript
/* ============================================================
   projects-bubbles.js — glue: adds the cycling-glow visual to
   every existing project bubble and registers the title, back
   button, and all project bubbles in one shared physics field.
   ============================================================ */
(function () {
  'use strict';

  const field = document.getElementById('projectsField');
  if (!field) return;

  const backBtn = document.getElementById('projectsBack');
  const titleBubble = document.getElementById('projectsTitle');
  const projectBubbles = Array.from(field.querySelectorAll('.project-bubble'));

  projectBubbles.forEach(function (el) {
    el.classList.add('bubble-cycling-glow');
  });

  const allBodies = [backBtn, titleBubble].concat(projectBubbles).filter(Boolean);
  window.BubblePhysics.createField({ field: field, bodies: allBodies });
})();
```

- [ ] **Step 6: Verify syntax**

Run: `node --check projects-bubbles.js`
Expected: no output (exit code 0).

- [ ] **Step 7: Commit**

```bash
git add projects.html projects-bubbles.js
git commit -m "feat: add title/back bubbles and shared physics field to Projects page"
```

---

### Task 7: Manual QA — Projects page + Contact page regression check

**Files:** none (verification only)

- [ ] **Step 1: Open the Projects page and confirm baseline render**

Open `projects.html`. Confirm: back button and title bubble render as true circles at the top; all 12 project/featured bubbles still show their icons, labels, and status badges, now with a subtle cycling photo glow behind them.

- [ ] **Step 2: Confirm physics + existing behavior**

Drag the title bubble into the project bubble grid and release with velocity. Confirm bubbles scatter and spring back to their original grid positions. Confirm hovering a project bubble still shows its tooltip. Confirm clicking (short click, no drag) a project bubble still navigates to its link/opens its modal as before.

- [ ] **Step 3: Confirm reduced-motion fallback**

Enable `prefers-reduced-motion: reduce` in DevTools, reload. Confirm all bubbles render in their normal static grid positions, fully clickable, no physics.

- [ ] **Step 4: Confirm `contact.html` is unaffected**

Open `contact.html`. Confirm the bubble pool still behaves exactly as before (orbiting email bubble, drag/fling/collide) — this page was not modified.

- [ ] **Step 5: Fix any issues found, then commit**

```bash
git add -A
git commit -m "fix: address Projects page bubble QA findings"
```
(Only run this commit if fixes were needed — otherwise skip.)
