/* ============================================================
   bubble-pool.js — pool-table physics for the contact page.

   Grab a bubble, drag, and release to fling it: it carries real
   momentum and knocks the other bubbles around (mass ∝ radius, so
   the big email bubble feels heavy). Once things calm down every
   bubble springs back to its home spot and resumes a subtle drift.
   A short press (≤180ms, ≤6px) is still a click, so links, the
   email copy, and double-click-to-message all work untouched.

   Collision + spring constants ported from the hero page physics
   (script.js runScatterPhysics / BopBody). Self-contained: only
   activates when #bubbleField exists, motion is allowed, and the
   field is wide enough — otherwise the CSS flex layout stands.
   ============================================================ */
(function () {
  'use strict';

  const field = document.getElementById('bubbleField');
  if (!field) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const els = Array.from(field.querySelectorAll('.pool-bubble'));
  if (els.length < 2) return;

  // Physics constants (hero-page feel)
  const RESTITUTION = 0.9;
  const DAMPING = 0.98;
  const SPRING = 0.02;          // gentler than BopBody — returns span 100s of px
  const SPRING_DAMPING = 0.9;
  const HOMING_CAP = 10;        // px/frame — glide home, don't whip-crack
  const CLICK_MS = 180;
  const CLICK_PX = 6;
  const MAX_LAUNCH = 45;     // px per frame
  const SLOW_SPEED = 2.5;    // below this an excited bubble starts homing
  const HIT_COOLDOWN = 500;  // ms after a hit before homing kicks in
  const EDGE_PAD = 8;

  let fieldW = 0, fieldH = 0;
  let bodies = [];
  let rafId = null;

  function measure() {
    const rect = field.getBoundingClientRect();
    fieldW = rect.width;
    fieldH = rect.height;
  }

  measure();
  if (fieldW < 340) return; // tiny screens keep the static flex grid

  field.classList.add('pool-active');

  bodies = els.map((el, i) => {
    const r = el.offsetWidth / 2;
    return {
      el,
      r,
      m: r,                    // mass ∝ radius
      x: 0, y: 0, vx: 0, vy: 0,
      home: { x: 0, y: 0 },
      state: 'idle',           // idle | excited | drag
      homing: false,
      lastHit: 0,
      slowSince: 0,
      // per-bubble drift character
      ampX: 5 + Math.random() * 4,
      ampY: 5 + Math.random() * 4,
      freqX: 0.2 + Math.random() * 0.2,
      freqY: 0.2 + Math.random() * 0.2,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      // drag bookkeeping
      pointerId: null,
      grabDX: 0, grabDY: 0,
      pressT: 0, pressX: 0, pressY: 0,
      samples: [],
      suppressClick: false
    };
  });

  // Big bubble (the email button) sits at the center, the rest orbit it.
  function layoutHomes() {
    measure();
    const bigIdx = bodies.reduce((best, b, i) => (b.r > bodies[best].r ? i : best), 0);
    const big = bodies[bigIdx];
    const cx = fieldW / 2, cy = fieldH / 2;
    big.home.x = cx;
    big.home.y = cy;

    const others = bodies.filter((_, i) => i !== bigIdx);
    const maxR = Math.max(...others.map(b => b.r));
    // Orbit radius needs to clear the big bubble entirely, not just reach
    // toward the field edge — otherwise a large email bubble overlaps its
    // neighbors when the field is too short for its radius
    const wantRadius = big.r + maxR + 24;
    const rx = Math.min(wantRadius, fieldW / 2 - maxR - EDGE_PAD);
    const ry = Math.min(wantRadius, fieldH / 2 - maxR - EDGE_PAD);
    others.forEach((b, i) => {
      const ang = -Math.PI / 2 + (i * Math.PI * 2) / others.length;
      b.home.x = cx + Math.cos(ang) * rx;
      b.home.y = cy + Math.sin(ang) * ry;
    });

    // Relax homes apart — short fields can squeeze the ellipse into the
    // big bubble, so nudge overlapping homes until everyone has breathing room
    for (let iter = 0; iter < 30; iter++) {
      let moved = false;
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], b = bodies[j];
          const dx = b.home.x - a.home.x, dy = b.home.y - a.home.y;
          const dist = Math.hypot(dx, dy) || 1;
          const need = a.r + b.r + 14;
          if (dist < need) {
            const push = (need - dist) / 2;
            const nx = dx / dist, ny = dy / dist;
            a.home.x -= nx * push; a.home.y -= ny * push;
            b.home.x += nx * push; b.home.y += ny * push;
            moved = true;
          }
        }
      }
      bodies.forEach(b => {
        b.home.x = Math.min(Math.max(b.home.x, b.r + EDGE_PAD), fieldW - b.r - EDGE_PAD);
        b.home.y = Math.min(Math.max(b.home.y, b.r + EDGE_PAD), fieldH - b.r - EDGE_PAD);
      });
      if (!moved) break;
    }
  }

  function render(b) {
    b.el.style.transform = `translate3d(${(b.x - b.r).toFixed(1)}px, ${(b.y - b.r).toFixed(1)}px, 0)`;
  }

  layoutHomes();
  bodies.forEach(b => { b.x = b.home.x; b.y = b.home.y; render(b); });

  function pointerToField(e) {
    const rect = field.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // Collisions wake a bubble up but never cancel an in-progress spring-home —
  // otherwise crowded rebounds keep resetting each other and nothing settles.
  function excite(b, now) {
    if (b.state !== 'drag') b.state = 'excited';
    b.lastHit = now;
  }

  // ---------- simulation loop ----------
  function step(now) {
    const t = now / 1000;

    // Idle drift — gentle wander around home
    for (const b of bodies) {
      if (b.state === 'idle') {
        b.x = b.home.x + b.ampX * Math.sin(t * b.freqX * Math.PI * 2 + b.phaseX);
        b.y = b.home.y + b.ampY * Math.sin(t * b.freqY * Math.PI * 2 + b.phaseY);
        b.vx = 0;
        b.vy = 0;
      }
    }

    // Pairwise circle collisions, mass-weighted (dragged body = immovable).
    // Homing bubbles glide home as ghosts — colliding mid-return turns the
    // crowded center into an endless traffic jam that never settles.
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
            const impulse = -(1 + RESTITUTION) * relSpeed / invSum;
            a.vx -= impulse * invA * nx; a.vy -= impulse * invA * ny;
            b.vx += impulse * invB * nx; b.vy += impulse * invB * ny;
          }
          excite(a, now);
          excite(b, now);
        }
      }
    }

    // Integrate excited bodies: damping, walls, spring-home
    for (const b of bodies) {
      if (b.state !== 'excited') { render(b); continue; }

      const speed = Math.abs(b.vx) + Math.abs(b.vy);
      if (speed >= SLOW_SPEED) b.slowSince = 0;
      else if (!b.slowSince) b.slowSince = now;
      if (!b.homing && speed < SLOW_SPEED &&
          (now - b.lastHit > HIT_COOLDOWN || now - b.slowSince > 1200)) {
        // Slow and left alone — or slow but stuck in resting contact —
        // either way, start springing home
        b.homing = true;
      }

      if (b.homing) {
        // Spring applied every frame until arrival
        b.vx += (b.home.x - b.x) * SPRING;
        b.vy += (b.home.y - b.y) * SPRING;
        b.vx *= SPRING_DAMPING;
        b.vy *= SPRING_DAMPING;
        const hsp = Math.hypot(b.vx, b.vy);
        if (hsp > HOMING_CAP) {
          b.vx = b.vx / hsp * HOMING_CAP;
          b.vy = b.vy / hsp * HOMING_CAP;
        }
        if (Math.hypot(b.home.x - b.x, b.home.y - b.y) < 3 &&
            Math.abs(b.vx) + Math.abs(b.vy) < 0.6) {
          b.x = b.home.x;
          b.y = b.home.y;
          b.vx = 0; b.vy = 0;
          b.state = 'idle';
          b.homing = false;
          // restart drift from home so there's no positional snap
          b.phaseX = -t * b.freqX * Math.PI * 2;
          b.phaseY = -t * b.freqY * Math.PI * 2;
        }
      } else {
        b.vx *= DAMPING;
        b.vy *= DAMPING;
      }

      // hard speed cap — collisions can't fling anything faster than a launch
      const cap = MAX_LAUNCH * 1.2;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > cap) {
        b.vx = b.vx / sp * cap;
        b.vy = b.vy / sp * cap;
      }

      b.x += b.vx;
      b.y += b.vy;

      // Bounce off the field walls
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * RESTITUTION; }
      else if (b.x > fieldW - b.r) { b.x = fieldW - b.r; b.vx = -Math.abs(b.vx) * RESTITUTION; }
      if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * RESTITUTION; }
      else if (b.y > fieldH - b.r) { b.y = fieldH - b.r; b.vy = -Math.abs(b.vy) * RESTITUTION; }

      render(b);
    }

    rafId = requestAnimationFrame(step);
  }

  function start() {
    if (rafId === null) rafId = requestAnimationFrame(step);
  }
  function stop() {
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  // ---------- pointer interaction ----------
  bodies.forEach(b => {
    const el = b.el;

    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* non-active pointer */ }
      b.pointerId = e.pointerId;
      b.state = 'drag';
      b.homing = false;
      b.vx = 0; b.vy = 0;
      el.classList.add('dragging');
      b.pressT = performance.now();
      b.pressX = e.clientX;
      b.pressY = e.clientY;
      const p = pointerToField(e);
      b.grabDX = b.x - p.x;
      b.grabDY = b.y - p.y;
      b.samples = [{ x: e.clientX, y: e.clientY, t: b.pressT }];
    });

    el.addEventListener('pointermove', (e) => {
      if (b.state !== 'drag' || e.pointerId !== b.pointerId) return;
      const now = performance.now();
      const p = pointerToField(e);
      let nx = Math.min(Math.max(p.x + b.grabDX, b.r), fieldW - b.r);
      let ny = Math.min(Math.max(p.y + b.grabDY, b.r), fieldH - b.r);
      // per-frame velocity approximation so collisions feel the drag motion
      b.vx = nx - b.x;
      b.vy = ny - b.y;
      b.x = nx;
      b.y = ny;
      render(b);
      b.samples.push({ x: e.clientX, y: e.clientY, t: now });
      while (b.samples.length > 2 && now - b.samples[0].t > 120) b.samples.shift();
    });

    function release(e) {
      if (b.state !== 'drag' || e.pointerId !== b.pointerId) return;
      const now = performance.now();
      el.classList.remove('dragging');
      b.pointerId = null;
      const dt = now - b.pressT;
      const dist = Math.hypot(e.clientX - b.pressX, e.clientY - b.pressY);

      if (dt <= CLICK_MS && dist <= CLICK_PX) {
        // A click — let the native click/dblclick fire (link, email copy…)
        b.state = 'excited';
        b.vx = 0; b.vy = 0;
        b.lastHit = 0;
        return;
      }

      // A fling — launch with the velocity of the last ~100ms of movement
      b.suppressClick = true;
      const recent = b.samples.filter(s => now - s.t <= 100);
      const first = recent[0] || b.samples[0];
      const last = b.samples[b.samples.length - 1];
      const span = Math.max(last.t - first.t, 16);
      let vx = (last.x - first.x) / span * (1000 / 60);
      let vy = (last.y - first.y) / span * (1000 / 60);
      const mag = Math.hypot(vx, vy);
      if (mag > MAX_LAUNCH) {
        vx = vx / mag * MAX_LAUNCH;
        vy = vy / mag * MAX_LAUNCH;
      }
      b.vx = vx;
      b.vy = vy;
      b.state = 'excited';
      b.lastHit = now;
    }

    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);

    // One-shot click suppressor after a fling (BopBody pattern)
    el.addEventListener('click', (e) => {
      if (b.suppressClick) {
        e.preventDefault();
        e.stopPropagation();
        b.suppressClick = false;
      }
    }, true);
  });

  // ---------- resize ----------
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      layoutHomes();
      bodies.forEach(b => {
        if (b.state === 'idle') {
          b.x = b.home.x;
          b.y = b.home.y;
        } else {
          b.x = Math.min(Math.max(b.x, b.r), fieldW - b.r);
          b.y = Math.min(Math.max(b.y, b.r), fieldH - b.r);
          if (b.state === 'excited') b.lastHit = 0; // spring to new home now
        }
        render(b);
      });
    }, 150);
  });

  start();

  // debug/testing handle
  window.__bubblePool = { bodies, layoutHomes };
})();
