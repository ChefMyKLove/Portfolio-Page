# Splash Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the centered glassmorphism card with a cinematic two-phase splash: 5-second living-art background intro (skippable), then a large glassmorphism circle swooshing in from the left containing profile + bio, surrounded by 8 expandable nav bubbles.

**Architecture:** Phase 1 runs a CSS cycling background + SVG feTurbulence cloud-displacement animation driven by JS-mutated baseFrequency (same technique as the book cover). After 5s (or on user skip), Phase 2 animates the circle in from off-screen left using a spring cubic-bezier. Bubbles stagger in with a pop animation after the circle settles.

**Tech Stack:** Vanilla HTML/CSS/JS. No build step. No new dependencies. Existing `script.js` extended with new init functions. Existing `styles.css` partially replaced.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `index.html` | Rewrite splash section | SVG filters, cloud layers, skip hint, circle, 8 bubbles, remove old nav/glass-card |
| `styles.css` | Partial rewrite | Remove glass-card block, add cloud-layer, splash-circle, nav-bubble, animation keyframes |
| `script.js` | Extend | Add `startCloudAnim()`, `initIntro()`, `animateCircleIn()`, `revealBubbles()` after existing code |
| `carousel.css` | No change | Left as-is |

---

## Task 1: Rewrite `index.html` — remove old structure, add new

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Read the current file**

Open `index.html`. Confirm the structure: `<header>` contains `.splash-container > .glass-card`. The `<main>` is empty. Footer is below `</body>`.

- [ ] **Step 2: Replace the entire file content**

Replace `index.html` with the following. Key changes:
- Title updated
- Bootstrap removed (not needed; normalize kept)
- SVG filter defs added (two feTurbulence filters for cloud warp)
- `.background-container` kept (CSS background cycling)
- Two `<img class="cloud-layer">` elements added (the dreamy displacement overlays)
- `#skipHint` div added
- `<main id="main">` contains the circle + all 8 bubble elements
- Old `<header>` / `.glass-card` / `<nav>` removed

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Michael Needham — Developer · Artist · Activist</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css">
  <link rel="stylesheet" href="styles.css">
  <script>
    window.handleBlogClick = function() {
      window.location.href = 'https://portfolio-and-blog-production.up.railway.app/auth/patreon';
    };
  </script>
</head>
<body>
  <a id="top"></a>
  <a href="#main" class="skip-link">Skip to main content</a>

  <!-- SVG filter definitions for cloud displacement -->
  <svg id="svg-filters" style="position:absolute;width:0;height:0;overflow:hidden;" aria-hidden="true">
    <defs>
      <filter id="cloud-warp" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
        <feTurbulence id="cloud-turb" type="fractalNoise" baseFrequency="0.009 0.011" numOctaves="4" seed="7" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="82" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="cloud-warp-b" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
        <feTurbulence id="cloud-turb-b" type="fractalNoise" baseFrequency="0.010 0.009" numOctaves="4" seed="13" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="82" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
  </svg>

  <!-- Cycling rainbow art background -->
  <div class="background-container"></div>

  <!-- Cloud overlay layers — dreamy displacement on top of background -->
  <img src="images/HummingBow.jpg" class="cloud-layer cloud-layer-1" alt="">
  <img src="images/IMG_6906.JPEG" class="cloud-layer cloud-layer-2" alt="">

  <!-- Phase 1: skip hint (auto-fades in at 1.5s) -->
  <div class="skip-hint" id="skipHint" aria-hidden="true">tap anywhere to skip</div>

  <!-- Phase 2: circle + bubbles (circle starts off-screen left) -->
  <main id="main">
    <div class="splash-circle" id="splashCircle">
      <div class="circle-inner">
        <img src="images/IMG_20201211_103947_047.png" alt="Michael Needham" class="circle-profile">
        <h1 class="circle-name">Hello! I'm Michael Needham</h1>
        <h3 class="circle-tagline">Developer • Artist • Activist</h3>
        <p class="circle-bio">A full stack and Web3 developer from Nanaimo, Canada. I build tools, platforms, and creative experiences that remove barriers, redistribute power, and enable marginalized artists and communities to own their work, reach global audiences, and thrive. I build with accessibility and inclusion at the core, because that's how we dismantle oppressive systems and create the conditions that ensure our collective liberation.</p>
      </div>
    </div>

    <!-- Nav bubbles — fan out right of circle -->
    <a href="projects.html" class="nav-bubble" id="bubble-1" aria-label="Projects">
      <span class="bubble-icon" aria-hidden="true">{ }</span>
      <span class="bubble-label">Projects</span>
    </a>
    <a href="about-me.html" class="nav-bubble" id="bubble-2" aria-label="About Me">
      <span class="bubble-icon" aria-hidden="true">♟</span>
      <span class="bubble-label">About Me</span>
    </a>
    <a href="contact.html" class="nav-bubble" id="bubble-3" aria-label="Contact">
      <span class="bubble-icon" aria-hidden="true">✉</span>
      <span class="bubble-label">Contact</span>
    </a>
    <a href="ordinal-rainbows.html" class="nav-bubble" id="bubble-4" aria-label="Ordinal Rainbows">
      <span class="bubble-icon" aria-hidden="true">🌈</span>
      <span class="bubble-label">Ordinals</span>
    </a>
    <button class="nav-bubble" id="bubble-5" onclick="handleBlogClick()" aria-label="Blog Access">
      <span class="bubble-icon" aria-hidden="true">✦</span>
      <span class="bubble-label">Blog</span>
    </button>
    <span class="nav-bubble coming-soon" id="bubble-6" aria-label="Coming Soon">
      <span class="bubble-icon" aria-hidden="true">◌</span>
      <span class="bubble-label">Soon</span>
    </span>
    <span class="nav-bubble coming-soon" id="bubble-7" aria-label="Coming Soon">
      <span class="bubble-icon" aria-hidden="true">◌</span>
      <span class="bubble-label">Soon</span>
    </span>
    <span class="nav-bubble coming-soon" id="bubble-8" aria-label="Coming Soon">
      <span class="bubble-icon" aria-hidden="true">◌</span>
      <span class="bubble-label">Soon</span>
    </span>
  </main>

  <!-- Preload background images -->
  <div class="preload-container" aria-hidden="true">
    <img src="images/HummingBow.jpg" alt="">
    <img src="images/IMG_6794.JPEG" alt="">
    <img src="images/IMG_6795.JPEG" alt="">
    <img src="images/IMG_6796.JPEG" alt="">
    <img src="images/IMG_6797.JPEG" alt="">
    <img src="images/TunnelBow.JPEG" alt="">
    <img src="images/IMG_6906.JPEG" alt="">
    <img src="images/IMG_6907.JPEG" alt="">
    <img src="images/IMG_6908.JPEG" alt="">
    <img src="images/IMG_6909.JPEG" alt="">
    <img src="images/IMG_6910.JPEG" alt="">
    <img src="images/IMG_6911.JPEG" alt="">
    <img src="images/IMG_6912.JPEG" alt="">
  </div>

  <script src="script.js"></script>
  <script src="interactivity.js"></script>
</body>
<footer>
  <div class="footer-content">
    <h4>&copy; 2026 <a href="https://chefmyklove.github.io/ORDINALRAINBOWS-Vol.1/" target="_blank" rel="noopener" class="link">Chef MyKLove</a></h4>
    <h6>All rights reserved.</h6>
    <div class="footer-links">
      <a href="https://patreon.com/chefmyklove" target="_blank" rel="noopener" class="link">Patreon</a>
      <a href="https://chefmyklove.github.io/ORDINALRAINBOWS-Vol.1/" target="_blank" rel="noopener" class="link">Shop Art</a>
      <a href="mailto:chefmyklove@gmail.com" class="link">Email</a>
    </div>
  </div>
</footer>
</html>
```

- [ ] **Step 3: Verify in browser**

Open `index.html` directly in a browser. You should see:
- A plain body with no old glass card
- The background cycling images (they may not cycle yet until styles are updated)
- No JavaScript errors in the console (the `init()` call in script.js will fail gracefully because it guards missing elements)

---

## Task 2: Rewrite `styles.css` — remove old, add new

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Replace the entire file content**

The old file has glass-card, btn, nav-button styles that are all removed. The new file keeps: reset, body, background-container (with fixed image names), link, footer, accessibility. Adds: cloud layers, skip hint, circle, bubbles, responsive.

```css
/* ============================================
   RESET & BASE
   ============================================ */
*, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    overflow-x: hidden;
    min-height: 100vh;
    width: 100vw;
    position: relative;
    background: #0a0a0f;
}

/* ============================================
   SKIP LINK (accessibility)
   ============================================ */
.skip-link {
    position: absolute;
    top: -100px;
    left: 16px;
    z-index: 9999;
    padding: 8px 16px;
    background: #667eea;
    color: #fff;
    border-radius: 4px;
    text-decoration: none;
    font-size: 0.9rem;
    transition: top 0.2s;
}
.skip-link:focus { top: 16px; }

/* ============================================
   BACKGROUND — CYCLING ART IMAGES
   ============================================ */
.background-container {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 0;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    animation: cycleBackgrounds 104s linear infinite;
}

@keyframes cycleBackgrounds {
    0%      { background-image: url('images/HummingBow.jpg'); }
    7.69%   { background-image: url('images/IMG_6794.JPEG'); }
    15.38%  { background-image: url('images/IMG_6795.JPEG'); }
    23.07%  { background-image: url('images/IMG_6796.JPEG'); }
    30.76%  { background-image: url('images/IMG_6797.JPEG'); }
    38.45%  { background-image: url('images/TunnelBow.JPEG'); }
    46.14%  { background-image: url('images/IMG_6906.JPEG'); }
    53.83%  { background-image: url('images/IMG_6907.JPEG'); }
    61.52%  { background-image: url('images/IMG_6908.JPEG'); }
    69.21%  { background-image: url('images/IMG_6909.JPEG'); }
    76.9%   { background-image: url('images/IMG_6910.JPEG'); }
    84.59%  { background-image: url('images/IMG_6911.JPEG'); }
    92.28%  { background-image: url('images/IMG_6912.JPEG'); }
    100%    { background-image: url('images/HummingBow.jpg'); }
}

/* ============================================
   CLOUD OVERLAY LAYERS (displacement animation)
   ============================================ */
.cloud-layer {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: center;
    pointer-events: none;
    mix-blend-mode: screen;
    z-index: 1;
    will-change: transform;
    mask-image: linear-gradient(to bottom,
        transparent 3%, black 18%, black 82%, transparent 97%);
    -webkit-mask-image: linear-gradient(to bottom,
        transparent 3%, black 18%, black 82%, transparent 97%);
}

.cloud-layer-1 {
    filter: url(#cloud-warp);
    animation: cloud-drift-1 20s ease-in-out infinite,
               cloud-fade    26s ease-in-out infinite;
}

.cloud-layer-2 {
    filter: url(#cloud-warp-b);
    animation: cloud-drift-2 24s ease-in-out infinite,
               cloud-fade    26s -3s ease-in-out infinite;
}

@keyframes cloud-drift-1 {
    0%, 100% { transform: scale(1.10) translate(-1.0%, -0.5%) rotate(-3deg); }
    25%      { transform: scale(1.07) translate( 0.7%,  0.8%) rotate( 1deg); }
    55%      { transform: scale(1.06) translate( 0.9%,  0.4%) rotate( 4deg); }
    78%      { transform: scale(1.08) translate(-0.4%,  0.6%) rotate(-1deg); }
}

@keyframes cloud-drift-2 {
    0%, 100% { transform: scale(1.08) translate( 0.7%, -0.5%) rotate( 3deg); }
    30%      { transform: scale(1.10) translate(-0.5%,  0.5%) rotate(-2deg); }
    62%      { transform: scale(1.07) translate(-0.9%,  0.9%) rotate(-4deg); }
}

@keyframes cloud-fade {
    0%, 100% { opacity: 0.55; }
    48%      { opacity: 0.06; }
    52%      { opacity: 0.06; }
}

/* ============================================
   PHASE 1 — SKIP HINT
   ============================================ */
.skip-hint {
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    z-index: 200;
    pointer-events: none;
    opacity: 0;
    animation: skipHintFadeIn 0.7s 1.5s ease-out forwards;
    white-space: nowrap;
}

@keyframes skipHintFadeIn {
    to { opacity: 1; }
}

.skip-hint.hidden {
    animation: none;
    opacity: 0;
    transition: opacity 0.3s ease;
}

/* ============================================
   PHASE 2 — GLASSMORPHISM CIRCLE
   ============================================ */
.splash-circle {
    position: fixed;
    top: 50%;
    left: 38vw;
    /* Start well off-screen to the left */
    transform: translate(calc(-50% - 120vw), -50%);
    width: min(50vmin, 480px);
    height: min(50vmin, 480px);
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow:
        0 0 40px rgba(102, 126, 234, 0.35),
        0 8px 48px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    z-index: 100;
    will-change: transform;
}

.splash-circle.entered {
    transform: translate(-50%, -50%);
    transition: transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.circle-inner {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28px 22px;
    overflow-y: auto;
    text-align: center;
    gap: 6px;
    /* Scrollbar hidden but functional */
    scrollbar-width: none;
}
.circle-inner::-webkit-scrollbar { display: none; }

/* Content items — each fades in sequentially via JS adding .revealed */
.circle-profile,
.circle-name,
.circle-tagline,
.circle-bio {
    opacity: 0;
    transition: opacity 0.45s ease;
}

.circle-profile {
    width: 92px;
    height: 92px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 18px rgba(102, 126, 234, 0.4);
    flex-shrink: 0;
}

.circle-name {
    font-size: clamp(0.75rem, 2vmin, 1.1rem);
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.04em;
    text-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
    margin: 0;
    line-height: 1.2;
}

.circle-tagline {
    font-size: clamp(0.6rem, 1.4vmin, 0.82rem);
    color: rgba(255, 255, 255, 0.8);
    font-weight: 300;
    letter-spacing: 0.06em;
    margin: 0;
}

.circle-bio {
    font-size: clamp(0.55rem, 1.1vmin, 0.7rem);
    color: rgba(255, 255, 255, 0.68);
    line-height: 1.6;
    margin: 0;
}

.circle-profile.revealed,
.circle-name.revealed,
.circle-tagline.revealed,
.circle-bio.revealed {
    opacity: 1;
}

/* ============================================
   NAV BUBBLES
   ============================================ */
.nav-bubble {
    position: fixed;
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 0 14px rgba(102, 126, 234, 0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    cursor: pointer;
    text-decoration: none;
    color: #fff;
    z-index: 100;
    /* Hidden + collapsed until JS adds .visible */
    opacity: 0;
    transform: scale(0);
    transition:
        transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
        opacity   0.2s ease,
        background 0.22s ease,
        box-shadow 0.22s ease;
    /* Reset button defaults */
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    line-height: 1;
}

.nav-bubble.visible {
    opacity: 1;
    transform: scale(1);
}

.nav-bubble.visible:hover {
    transform: scale(1.44);
    background: rgba(102, 126, 234, 0.35);
    box-shadow: 0 0 28px rgba(102, 126, 234, 0.55);
}

.nav-bubble.coming-soon {
    border-style: dashed;
    opacity: 0;
    transform: scale(0);
    cursor: default;
}

.nav-bubble.coming-soon.visible {
    opacity: 0.42;
    transform: scale(1);
}

.nav-bubble.coming-soon:hover {
    transform: scale(1) !important;
    background: rgba(0, 0, 0, 0.35) !important;
    box-shadow: 0 0 14px rgba(102, 126, 234, 0.2) !important;
}

.bubble-icon {
    font-size: 1rem;
    line-height: 1;
    display: block;
}

.bubble-label {
    font-size: 0.48rem;
    letter-spacing: 0.05em;
    text-align: center;
    opacity: 0.8;
    max-width: 58px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
}

/* Bubble positions — fanning out clockwise from ~1 o'clock to ~5 o'clock.
   Circle center is at (38vw, 50vh). Circle radius ~240px. */
#bubble-1 { left: calc(38vw + 240px); top: calc(50vh - 200px); }
#bubble-2 { left: calc(38vw + 330px); top: calc(50vh - 115px); }
#bubble-3 { left: calc(38vw + 360px); top: calc(50vh -  10px); }
#bubble-4 { left: calc(38vw + 335px); top: calc(50vh + 105px); }
#bubble-5 { left: calc(38vw + 250px); top: calc(50vh + 200px); }
#bubble-6 { left: calc(38vw + 145px); top: calc(50vh + 265px); }
#bubble-7 { left: calc(38vw + 255px); top: calc(50vh + 280px); }
#bubble-8 { left: calc(38vw + 360px); top: calc(50vh + 265px); }

/* ============================================
   FOOTER
   ============================================ */
footer {
    position: relative;
    z-index: 150;
    text-align: center;
    padding: 20px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
}

.footer-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8rem;
}

.footer-links {
    display: flex;
    gap: 24px;
}

.link {
    color: rgba(255, 255, 255, 0.65);
    text-decoration: none;
    font-size: 0.85rem;
    transition: color 0.2s ease;
    position: relative;
    padding-bottom: 2px;
}
.link::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 0; height: 1px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    transition: width 0.3s ease;
}
.link:hover { color: #fff; }
.link:hover::after { width: 100%; }

/* ============================================
   PRELOAD (hidden)
   ============================================ */
.preload-container {
    position: absolute;
    width: 0; height: 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
}

/* ============================================
   RESPONSIVE — MOBILE (< 768px)
   ============================================ */
@media (max-width: 768px) {
    .splash-circle {
        left: 50%;
        width: min(80vw, 360px);
        height: min(80vw, 360px);
    }
    .splash-circle.entered {
        transform: translate(-50%, -40%);
    }
    /* Shift circle up to make room for bubble grid below */
    .circle-profile { width: 72px; height: 72px; }

    /* Stack bubbles in 4×2 grid below the circle */
    .nav-bubble {
        width: 56px;
        height: 56px;
        position: fixed;
        left: auto !important;
        top: auto !important;
    }
    #bubble-1 { bottom: 120px; left: calc(10vw + 0px) !important; }
    #bubble-2 { bottom: 120px; left: calc(10vw + 68px) !important; }
    #bubble-3 { bottom: 120px; left: calc(10vw + 136px) !important; }
    #bubble-4 { bottom: 120px; left: calc(10vw + 204px) !important; }
    #bubble-5 { bottom: 52px;  left: calc(10vw + 0px) !important; }
    #bubble-6 { bottom: 52px;  left: calc(10vw + 68px) !important; }
    #bubble-7 { bottom: 52px;  left: calc(10vw + 136px) !important; }
    #bubble-8 { bottom: 52px;  left: calc(10vw + 204px) !important; }
}

/* ============================================
   ACCESSIBILITY
   ============================================ */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

.nav-bubble:focus-visible,
.link:focus-visible {
    outline: 2px solid rgba(102, 126, 234, 0.9);
    outline-offset: 4px;
}
```

- [ ] **Step 3: Verify in browser**

Open `index.html`. You should see:
- Cycling rainbow art background (all 13 images rotating)
- Two dreamy cloud-displacement overlays drifting on top
- No glass card, no old nav buttons
- The circle is off-screen (not visible) because JS hasn't run Phase 2 yet
- Footer rendered correctly

---

## Task 3: Add cloud turbulence JS to `script.js`

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Add `startCloudAnim()` function**

Open `script.js`. Find the `// ============================================` comment block just above the `init()` function near the bottom (around line 470). Insert the following **before** the `init()` function:

```javascript
// ============================================
// CLOUD TURBULENCE ANIMATION
// Continuously mutates SVG feTurbulence baseFrequency
// to create the living, breathing displacement effect.
// ============================================
let cloudAnimT = 0;
let cloudAnimRaf = null;

function startCloudAnim() {
    const turb  = document.getElementById('cloud-turb');
    const turb2 = document.getElementById('cloud-turb-b');
    if (!turb) return;

    function tick() {
        cloudAnimT += 0.00065;
        const fx  = 0.009 + Math.sin(cloudAnimT * 1.10) * 0.008 + Math.sin(cloudAnimT * 2.30) * 0.004;
        const fy  = 0.011 + Math.cos(cloudAnimT * 0.75) * 0.007 + Math.cos(cloudAnimT * 1.90) * 0.004;
        turb.setAttribute('baseFrequency', `${fx.toFixed(5)} ${fy.toFixed(5)}`);
        if (turb2) {
            const fx2 = 0.010 + Math.sin(cloudAnimT * 0.85 + 2.10) * 0.008 + Math.sin(cloudAnimT * 1.70) * 0.004;
            const fy2 = 0.009 + Math.cos(cloudAnimT * 0.60 + 1.50) * 0.007 + Math.cos(cloudAnimT * 1.50) * 0.004;
            turb2.setAttribute('baseFrequency', `${fx2.toFixed(5)} ${fy2.toFixed(5)}`);
        }
        cloudAnimRaf = requestAnimationFrame(tick);
    }
    tick();
}
```

- [ ] **Step 2: Call `startCloudAnim()` in `init()`**

Find the `init()` function. Add `startCloudAnim();` as the first line inside it:

```javascript
function init() {
    startCloudAnim();   // <-- add this line
    log('Initializing splash page...');
    document.body.classList.add('loading');
    // ... rest of existing init() code unchanged ...
}
```

- [ ] **Step 3: Verify in browser**

Open `index.html`. The cloud overlays should now slowly morph their displacement pattern over time — the rainbow art images should appear to breathe and warp gently, creating a dreamy living-art effect. Open DevTools → Elements and watch the `baseFrequency` attribute on the `<feTurbulence>` elements change every frame.

---

## Task 4: Add Phase 1 intro logic to `script.js`

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Add `initIntro()` and `startPhase2()` functions**

Insert the following block **after** the `startCloudAnim()` block added in Task 3 and **before** `init()`:

```javascript
// ============================================
// PHASE 1 INTRO — 5s timer + skip handlers
// ============================================
let introTimer = null;
let phase2Started = false;

function initIntro() {
    const hint = document.getElementById('skipHint');

    function triggerSkip() {
        if (phase2Started) return;
        phase2Started = true;
        clearTimeout(introTimer);

        document.removeEventListener('click', triggerSkip);
        document.removeEventListener('keydown', keySkip);

        if (hint) hint.classList.add('hidden');

        // Small delay so the click doesn't fire on the circle
        setTimeout(startPhase2, 80);
    }

    function keySkip(e) {
        // Only skip on meaningful keys, not modifier keys
        const ignored = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'];
        if (!ignored.includes(e.key)) triggerSkip();
    }

    document.addEventListener('click', triggerSkip);
    document.addEventListener('keydown', keySkip);

    // Auto-advance after 5 seconds
    introTimer = setTimeout(triggerSkip, 5000);
}

function startPhase2() {
    animateCircleIn();
}
```

- [ ] **Step 2: Call `initIntro()` from `init()`**

Inside the existing `init()` function, add `initIntro();` after `startCloudAnim();`:

```javascript
function init() {
    startCloudAnim();
    initIntro();        // <-- add this line
    log('Initializing splash page...');
    // ... rest unchanged ...
}
```

- [ ] **Step 3: Verify in browser**

Open `index.html`. After 5 seconds in the browser, open the console and confirm `animateCircleIn is not defined` error appears (expected — we haven't written it yet). Also verify that clicking the page before 5s fires the same error — confirming the skip handler is working.

---

## Task 5: Add circle entrance + content reveal to `script.js`

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Add `animateCircleIn()` and `revealCircleContents()`**

Insert the following block after the `startPhase2()` function from Task 4:

```javascript
// ============================================
// PHASE 2 — CIRCLE ENTRANCE + CONTENT REVEAL
// ============================================
function animateCircleIn() {
    const circle = document.getElementById('splashCircle');
    if (!circle) return;

    // Trigger the CSS spring transition (transform goes from off-screen to -50%,-50%)
    requestAnimationFrame(() => {
        circle.classList.add('entered');
    });

    // After circle settles (~950ms), reveal inner content + bubbles
    const SETTLE_MS = 960;
    setTimeout(revealCircleContents, SETTLE_MS);
    setTimeout(revealBubbles, SETTLE_MS + 300);
}

function revealCircleContents() {
    const items = [
        document.querySelector('.circle-profile'),
        document.querySelector('.circle-name'),
        document.querySelector('.circle-tagline'),
        document.querySelector('.circle-bio'),
    ];

    items.forEach((el, i) => {
        if (!el) return;
        setTimeout(() => el.classList.add('revealed'), i * 160);
    });
}
```

- [ ] **Step 2: Verify in browser**

Open `index.html`. Wait 5 seconds (or click to skip). The circle should swoosh in from the left with a spring bounce, landing slightly left of center. After it settles, the profile image, name, tagline, and bio should fade in one by one.

If the circle overshoots too much, adjust the `cubic-bezier` in `.splash-circle.entered` in `styles.css`. The current value `(0.34, 1.56, 0.64, 1)` produces ~8% overshoot — increase the second value (e.g., `1.8`) for more bounce, decrease toward `1.0` for less.

---

## Task 6: Add bubble entrance to `script.js`

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Add `revealBubbles()`**

Insert the following after `revealCircleContents()` from Task 5:

```javascript
// ============================================
// BUBBLE ENTRANCE — staggered spring pop-in
// ============================================
function revealBubbles() {
    const bubbles = document.querySelectorAll('.nav-bubble');
    bubbles.forEach((bubble, i) => {
        setTimeout(() => bubble.classList.add('visible'), i * 80);
    });
}
```

- [ ] **Step 2: Verify in browser**

Open `index.html`, wait for Phase 2. After the circle settles, 8 bubbles should pop in one by one (80ms apart) around the right side of the circle, each with a spring scale-in effect. Hovering a bubble should scale it up ~44% with a purple glow. The 3 Coming Soon bubbles should be dimmer with a dashed border and not scale on hover.

---

## Task 7: Update `init()` — guard stale function calls

**Files:**
- Modify: `script.js`

The existing `init()` calls `setupEmailModal()` which looks for `#emailTrigger` and `#contactModal` — those elements no longer exist on this page. Guard the call to prevent console errors.

- [ ] **Step 1: Find and update `setupEmailModal()` call in `init()`**

Locate this line inside `init()`:
```javascript
setupEmailModal();
```

Replace it with:
```javascript
if (document.getElementById('emailTrigger')) setupEmailModal();
```

- [ ] **Step 2: Verify no console errors**

Open `index.html` in the browser. Open DevTools → Console. There should be zero errors after the page loads and after Phase 2 triggers. Warnings about preloaded images not found are acceptable if any remain.

---

## Task 8: Final visual QA

**Files:**
- No code changes — verification only

- [ ] **Step 1: Desktop verification**

At browser width > 768px:
- [ ] Background images cycle with cloud displacement overlay running
- [ ] "tap anywhere to skip" hint appears at ~1.5s, bottom-center
- [ ] After 5s (or click): hint disappears, circle slides in from left with spring bounce
- [ ] Circle lands with its center at ~38% from left edge, vertically centered
- [ ] Profile pic, name, tagline, bio fade in sequentially after circle settles
- [ ] 8 bubbles pop in one by one to the right of the circle
- [ ] Hovering bubbles 1–5 scales them and shows purple glow
- [ ] Bubbles 6–8 are dimmer/dashed, do not scale on hover
- [ ] Clicking Projects/About Me/Contact navigates correctly
- [ ] Blog button triggers Patreon auth redirect
- [ ] Footer links work

- [ ] **Step 2: Mobile verification (resize browser to < 768px)**

- [ ] Circle centers horizontally, positioned higher on screen
- [ ] Bubbles appear in 2 rows of 4 along the bottom
- [ ] No overflow or horizontal scroll

- [ ] **Step 3: Accessibility**

- [ ] Tab through the page with keyboard — bubbles are focusable, focus ring visible
- [ ] Skip link appears on first Tab press
- [ ] Enable `prefers-reduced-motion` in OS settings → all animations disabled, page still functional

---

## Self-Review Checklist

**Spec coverage:**
- [x] 5s intro with cycling art background → Task 1–4
- [x] Cloud-displacement effect (SVG feTurbulence) → Task 1 (HTML), Task 2 (CSS), Task 3 (JS)
- [x] Skippable by click or keypress → Task 4
- [x] Circle swooshes in from left with elastic settle → Task 2 (CSS), Task 5 (JS)
- [x] Circle lands slightly left of center → Task 2 (`left: 38vw`)
- [x] Glassmorphism circle treatment → Task 2
- [x] Profile pic, full bio inside circle → Task 1 (HTML), Task 2 (CSS)
- [x] 8 bubbles: 5 destinations + 3 coming-soon → Task 1 (HTML), Task 2 (CSS)
- [x] Bubbles expand on hover → Task 2 (CSS)
- [x] Staggered bubble entrance → Task 6 (JS)
- [x] Mobile responsive layout → Task 2 (CSS)
- [x] Background continues running in Phase 2 → continuous (never stopped)

**Type/name consistency:**
- `splash-circle` / `splashCircle` — used consistently across HTML, CSS, JS ✓
- `nav-bubble` / `.nav-bubble` — consistent ✓
- `revealBubbles` called from `animateCircleIn` and defined in Task 6 ✓
- `animateCircleIn` called from `startPhase2` and defined in Task 5 ✓
- `.revealed` class added by JS, defined in CSS ✓
- `.entered` class added by JS, defined in CSS ✓
- `.visible` class added by JS, defined in CSS ✓
