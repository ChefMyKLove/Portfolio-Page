/* ============================================================
   bubble-fx.js — ambient bubble motion for any page.

   Drops floating glass bubbles around the viewport edges (they
   bob on slow sine paths) and gives them — plus any element
   marked data-bop — the hero page's springy "poke" physics:
   press-and-flick sends it bouncing away, then it springs back.
   Short clicks pass through untouched, so it's safe on links.

   Usage: include after site-bubbles.css (for the glass tokens):
     <script src="bubble-fx.js"></script>
   Optional: window.BUBBLE_FX = { count: 8 } before the script.

   Skips entirely under prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ---------- springy poke (port of the hero page's BopBody) ----------
  class Bop {
    constructor(el, opts = {}) {
      this.el = el;
      this.ox = 0; this.oy = 0;
      this.vx = 0; this.vy = 0;
      this.rafId = null;
      this.spring = opts.spring || 0.08;
      this.damping = opts.damping || 0.86;
      this.strength = opts.strength || 26;

      let pressT = 0, pressX = 0, pressY = 0, didBop = false;

      el.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        pressT = Date.now(); pressX = e.clientX; pressY = e.clientY; didBop = false;
      });
      el.addEventListener('pointerup', (e) => {
        const dt = Date.now() - pressT;
        if (dt > 180 || Math.hypot(e.clientX - pressX, e.clientY - pressY) > 6) {
          didBop = true;
          this._bop(pressX, pressY);
        }
      });
      el.addEventListener('click', (e) => {
        if (didBop) { e.preventDefault(); e.stopPropagation(); didBop = false; }
      });
    }

    _bop(mx, my) {
      const r = this.el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = cx - mx, dy = cy - my;
      const d = Math.hypot(dx, dy) || 1;
      this.vx += (dx / d) * this.strength;
      this.vy += (dy / d) * this.strength;
      if (!this.rafId) this._tick();
    }

    _tick() {
      this.vx += -this.ox * this.spring;
      this.vy += -this.oy * this.spring;
      this.vx *= this.damping;
      this.vy *= this.damping;
      this.ox += this.vx;
      this.oy += this.vy;
      this._apply();

      if (Math.abs(this.vx) + Math.abs(this.vy) > 0.1 || Math.abs(this.ox) + Math.abs(this.oy) > 0.4) {
        this.rafId = requestAnimationFrame(() => this._tick());
      } else {
        this.ox = 0; this.oy = 0; this.vx = 0; this.vy = 0; this.rafId = null;
        this._apply();
      }
    }

    _apply() {
      this.el.style.transform = (this.ox || this.oy)
        ? `translate(${this.ox.toFixed(1)}px, ${this.oy.toFixed(1)}px)`
        : '';
    }
  }

  // ---------- styles (tokens from site-bubbles.css, with fallbacks) ----------
  const style = document.createElement('style');
  style.textContent = `
    .fx-bubble-slot {
      position: fixed;
      z-index: 1;
      animation: fxFloat var(--fx-dur, 9s) ease-in-out infinite alternate;
    }
    .fx-bubble {
      display: block;
      border-radius: 50%;
      background: var(--glass-bg, rgba(255,255,255,0.06));
      -webkit-backdrop-filter: blur(var(--glass-blur, 14px));
      backdrop-filter: blur(var(--glass-blur, 14px));
      border: 1px solid var(--glass-border, rgba(255,255,255,0.22));
      box-shadow: 0 0 18px rgba(var(--glow-rgb, 102,126,234), 0.22),
                  0 4px 14px rgba(0,0,0,0.35);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    @keyframes fxFloat {
      from { transform: translate(0, 0); }
      to   { transform: translate(var(--fx-dx, 20px), var(--fx-dy, -26px)); }
    }
  `;
  document.head.appendChild(style);

  // ---------- decorative floating bubbles ----------
  const cfg = window.BUBBLE_FX || {};
  const small = window.innerWidth < 640;
  const count = cfg.count != null ? cfg.count : (small ? 4 : 7);

  const rand = (min, max) => min + Math.random() * (max - min);

  // Bias to the side bands so bubbles frame the content instead of hiding under it
  function slotPosition(i) {
    const leftSide = i % 2 === 0;
    return {
      left: leftSide ? rand(1.5, 14) : rand(84, 95),
      top: rand(6, 86)
    };
  }

  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const slot = document.createElement('div');
    slot.className = 'fx-bubble-slot';
    slot.setAttribute('aria-hidden', 'true');
    const pos = slotPosition(i);
    const size = Math.round(rand(small ? 26 : 34, small ? 54 : 84));
    slot.style.left = pos.left + '%';
    slot.style.top = pos.top + '%';
    slot.style.setProperty('--fx-dur', rand(6, 14).toFixed(1) + 's');
    slot.style.setProperty('--fx-dx', rand(-34, 34).toFixed(0) + 'px');
    slot.style.setProperty('--fx-dy', rand(-40, 40).toFixed(0) + 'px');
    slot.style.animationDelay = (-rand(0, 12)).toFixed(1) + 's';

    const bubble = document.createElement('span');
    bubble.className = 'fx-bubble';
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    slot.appendChild(bubble);
    frag.appendChild(slot);

    new Bop(bubble, { strength: 34 });
  }
  // Insert at the top of <body> so page content (later siblings at the same
  // or higher z-index) paints above the bubbles
  document.body.insertBefore(frag, document.body.firstChild);

  // ---------- poke physics for marked page elements ----------
  document.querySelectorAll('[data-bop]').forEach(el => new Bop(el));
})();
