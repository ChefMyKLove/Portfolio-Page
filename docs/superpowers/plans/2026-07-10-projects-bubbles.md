# Projects Bubbles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage's Ordinal Rainbows bubble link straight out to ordinalrainbows.com, give the Projects nav bubble a briefcase icon, and rebuild `projects.html` from rectangular cards into a two-tier bubble layout (3 large featured-site bubbles + 6 standard project bubbles) with hover tooltips and status badges.

**Architecture:** Pure static HTML/CSS edit, no build step, no JS framework, no test runner in this repo. All work happens directly in `index.html`, `projects.html`, and `carousel.css`. "Testing" in this plan means opening the page in a browser and visually/manually verifying the described behavior — there is no unit test suite for this static site, so each task's verification step is a manual browser check instead of an automated test run.

**Tech Stack:** Static HTML5, CSS3 (existing glassmorphism bubble style from `styles.css` `.nav-bubble`), inline SVG icons, no JavaScript needed for any part of this feature.

## Global Constraints

- Ordinal Rainbows homepage bubble: `href="https://ordinalrainbows.com"`, `target="_blank" rel="noopener noreferrer"` (matches NAKED/Stratos/Solutions bubble pattern).
- Internal `ordinal-rainbows.html` page stays; the Projects-page Ordinal Rainbows bubble keeps linking to it internally (not to ordinalrainbows.com).
- Projects nav bubble icon (index.html) changes from `{ }` to 💼.
- `projects.html` drops the `.projects-grid`/`.project-card` layout entirely — no rectangular cards remain.
- Featured bubbles (Kathleen Yearwood, Selina Martin, ChefMyKLove.com) are visually larger (`.project-bubble-lg`, 200px desktop) than the 6 standard project bubbles (140px desktop).
- Kathleen and Selina each get a distinct custom inline SVG electric-guitar silhouette (not the same shape, not emoji). ChefMyKLove.com gets a custom inline SVG chef-hat silhouette (not emoji).
- Hover tooltip fades in above each bubble via CSS `[data-tooltip]` + `::after`/`::before`, no JavaScript. Tooltip is hidden on touch/no-hover devices via `@media (hover: none)`.
- Status badges: green "Live", purple "Coming Soon", and a new amber "Seeking Funding" badge (ASMRtists only).
- ASMRtists tooltip text must include the investor call-to-action: `invest@asmrtists.ca`.
- Responsive breakpoints mirror the existing `carousel.css` `.projects-grid` breakpoints (900px, 580px).
- All external site links (`ordinalrainbows.com`, `kathleenyearwood.com`, `selinamartin.com`, `chefmyklove.com`) open in a new tab with `rel="noopener noreferrer"`.

---

### Task 1: Homepage nav bubble changes

**Files:**
- Modify: `index.html:84-99`

**Interfaces:**
- Consumes: nothing (no dependency on other tasks)
- Produces: nothing consumed by later tasks — fully independent change

- [ ] **Step 1: Update the Projects bubble icon**

In `index.html`, find:

```html
    <a href="projects.html" class="nav-bubble" id="bubble-1" aria-label="Projects">
      <span class="bubble-icon" aria-hidden="true">{ }</span>
      <span class="bubble-label">Projects</span>
    </a>
```

Replace with:

```html
    <a href="projects.html" class="nav-bubble" id="bubble-1" aria-label="Projects">
      <span class="bubble-icon" aria-hidden="true">💼</span>
      <span class="bubble-label">Projects</span>
    </a>
```

- [ ] **Step 2: Update the Ordinal Rainbows bubble to link externally**

In `index.html`, find:

```html
    <a href="ordinal-rainbows.html" class="nav-bubble" id="bubble-4" aria-label="Ordinal Rainbows">
      <span class="bubble-icon" aria-hidden="true">🌈</span>
      <span class="bubble-label">Ordinals</span>
    </a>
```

Replace with:

```html
    <a href="https://ordinalrainbows.com" class="nav-bubble" id="bubble-4" aria-label="Ordinal Rainbows" target="_blank" rel="noopener noreferrer">
      <span class="bubble-icon" aria-hidden="true">🌈</span>
      <span class="bubble-label">Ordinals</span>
    </a>
```

- [ ] **Step 3: Verify in browser**

Run: `Start-Process "d:\Desktop\Portfolio-Page\index.html"` (PowerShell)

Expected: Page loads, all nav bubbles fan out as before. The Projects bubble shows a briefcase icon. Clicking the Ordinals bubble opens `https://ordinalrainbows.com` in a new tab; the original portfolio tab stays open on `index.html`.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Link Ordinal Rainbows bubble to ordinalrainbows.com, add briefcase icon to Projects bubble"
```

---

### Task 2: Projects page bubble CSS foundation

**Files:**
- Modify: `carousel.css:1697-1833` (replaces the entire `PROJECT CARDS GRID` section — `.projects-grid`, `.project-card`, `.project-card-image`, `.project-card-placeholder`, `.placeholder-icon`, `.placeholder-label`, `.project-card-body`, `.project-card-status`, `.ph-*` gradients, and their two `@media` blocks)

**Interfaces:**
- Consumes: nothing
- Produces: CSS classes used by Task 3's markup — `.bubble-section-label`, `.featured-bubbles`, `.project-bubbles`, `.project-bubble`, `.project-bubble-lg`, `.project-bubble-icon`, `.bubble-icon-svg`, `.project-bubble-label`, `.project-bubble-status` (with modifiers `.live`, `.coming-soon`, `.seeking-funding`), and the `[data-tooltip]` attribute-driven tooltip behavior.

- [ ] **Step 1: Replace the old project-card CSS block**

In `carousel.css`, delete everything from the `/* PROJECT CARDS GRID */` comment at line 1697 through the closing `}` of the `@media (max-width: 580px)` block at line 1833 (i.e. all of the current lines 1697-1833), and replace it with:

```css
/* ============================================
   PROJECT BUBBLES
   ============================================ */

.bubble-section-label {
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.72rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  font-weight: 700;
  margin: 8px 0 20px;
}

.featured-bubbles,
.project-bubbles {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: 32px;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 10px;
  position: relative;
  z-index: 1;
}

.featured-bubbles {
  margin-bottom: 56px;
}

.project-bubbles {
  margin-bottom: 40px;
}

.project-bubble {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 0 24px rgba(102, 126, 234, 0.3), 0 4px 18px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-decoration: none;
  color: #fff;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease;
}

.project-bubble:hover,
.project-bubble:focus-visible {
  transform: scale(1.1);
  background: rgba(102, 126, 234, 0.28);
  border-color: rgba(255, 255, 255, 0.42);
  box-shadow:
    0 0 26px rgba(102, 126, 234, 0.66),
    0 0 58px rgba(102, 126, 234, 0.22),
    0 6px 22px rgba(0, 0, 0, 0.55);
}

.project-bubble-lg {
  width: 200px;
  height: 200px;
  gap: 6px;
}

.project-bubble-icon {
  font-size: 2.6rem;
  line-height: 1;
  text-shadow:
    0 0 14px rgba(255, 255, 255, 0.54),
    0 0 28px rgba(180, 155, 255, 0.36),
    0 2px 10px rgba(0, 0, 0, 0.95);
}

.project-bubble-lg .project-bubble-icon {
  font-size: 3.4rem;
}

.bubble-icon-svg {
  width: 3.2rem;
  height: 3.2rem;
  color: #fff;
  filter:
    drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))
    drop-shadow(0 0 20px rgba(180, 155, 255, 0.32));
}

.project-bubble-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-align: center;
  padding: 0 10px;
}

.project-bubble-lg .project-bubble-label {
  font-size: 0.82rem;
}

.project-bubble-status {
  position: absolute;
  bottom: -6px;
  right: -6px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.project-bubble-status.live {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.16);
  border: 1px solid rgba(74, 222, 128, 0.4);
}

.project-bubble-status.coming-soon {
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.16);
  border: 1px solid rgba(167, 139, 250, 0.4);
}

.project-bubble-status.seeking-funding {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.16);
  border: 1px solid rgba(251, 191, 36, 0.4);
}

/* Tooltip: shown on hover/focus via [data-tooltip], CSS-only */
.project-bubble[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 14px);
  left: 50%;
  transform: translateX(-50%) translateY(6px);
  width: 220px;
  max-width: 60vw;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(10, 10, 15, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.72rem;
  line-height: 1.5;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease;
  z-index: 50;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
}

.project-bubble[data-tooltip]::before {
  content: "";
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%) translateY(6px);
  border: 6px solid transparent;
  border-top-color: rgba(10, 10, 15, 0.92);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease;
  z-index: 50;
}

.project-bubble[data-tooltip]:hover::after,
.project-bubble[data-tooltip]:hover::before,
.project-bubble[data-tooltip]:focus-visible::after,
.project-bubble[data-tooltip]:focus-visible::before {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

@media (hover: none) {
  .project-bubble[data-tooltip]::after,
  .project-bubble[data-tooltip]::before {
    display: none;
  }
}

@media (max-width: 900px) {
  .project-bubble { width: 116px; height: 116px; }
  .project-bubble-lg { width: 160px; height: 160px; }
  .project-bubble-icon { font-size: 2.2rem; }
  .project-bubble-lg .project-bubble-icon { font-size: 2.8rem; }
  .bubble-icon-svg { width: 2.6rem; height: 2.6rem; }
  .featured-bubbles, .project-bubbles { gap: 22px; }
}

@media (max-width: 580px) {
  .project-bubble { width: 100px; height: 100px; }
  .project-bubble-lg { width: 138px; height: 138px; }
  .project-bubble-label { font-size: 0.62rem; }
  .project-bubble-lg .project-bubble-label { font-size: 0.72rem; }
  .project-bubble-icon { font-size: 1.9rem; }
  .project-bubble-lg .project-bubble-icon { font-size: 2.4rem; }
  .bubble-icon-svg { width: 2.2rem; height: 2.2rem; }
  .featured-bubbles, .project-bubbles { gap: 16px; }
  .project-bubble[data-tooltip]::after { width: 160px; font-size: 0.68rem; }
}
```

- [ ] **Step 2: Verify no other page references the removed classes**

Run: `grep -rn "project-card\|projects-grid\|placeholder-icon\|placeholder-label\|ph-njc\|ph-or\|ph-ap\|ph-yt\|ph-st\|ph-pb" --include=*.html .`

Expected: No matches (this was already confirmed during design — `projects.html` is the only file using these classes, and Task 3 rewrites its markup to drop them). If any unexpected match appears, stop and investigate before continuing — do not delete CSS still in use elsewhere.

- [ ] **Step 3: Commit**

```bash
git add carousel.css
git commit -m "Replace project-card grid CSS with project-bubble layout"
```

---

### Task 3: Projects page markup rewrite

**Files:**
- Modify: `projects.html:94-103` (remove now-unused `.project-card-body h3` inline style rule)
- Modify: `projects.html:141-221` (replace the `.projects-grid` div and its contents with the new bubble markup)

**Interfaces:**
- Consumes: CSS classes produced by Task 2 (`.bubble-section-label`, `.featured-bubbles`, `.project-bubbles`, `.project-bubble`, `.project-bubble-lg`, `.project-bubble-icon`, `.bubble-icon-svg`, `.project-bubble-label`, `.project-bubble-status.live/.coming-soon/.seeking-funding`, `[data-tooltip]`)
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Remove the now-unused inline `.project-card-body h3` style**

In `projects.html`, find and delete this block (it targeted the old rectangular cards, which no longer exist):

```css
    .project-card-body h3 {
      font-size: 1.12rem;
      font-weight: 800;
      background: linear-gradient(135deg, #f97316, #eab308, #22c55e, #06b6d4, #6366f1, #a855f7, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      -webkit-text-stroke: 0.75px rgba(255, 255, 255, 0.15);
      filter: drop-shadow(0 1px 6px rgba(0,0,0,0.98)) drop-shadow(0 0 16px rgba(0,0,0,0.85));
    }
```

- [ ] **Step 2: Replace the projects grid markup**

In `projects.html`, find the entire block from `<div class="projects-grid">` through its matching closing `</div>` (currently lines 141-221):

```html
    <div class="projects-grid">

      <a href="projects/not-just-covid.html" class="project-card">
        <div class="project-card-image">
          <div class="project-card-placeholder ph-njc">
            <span class="placeholder-icon">🌬️</span>
          </div>
        </div>
        <div class="project-card-body">
          <h3>Not Just Covid</h3>
          <p>Clean air advocacy platform for disability justice communities</p>
          <span class="project-card-status coming-soon">Coming Soon</span>
        </div>
      </a>

      <a href="ordinal-rainbows.html" class="project-card">
        <div class="project-card-image">
          <div class="project-card-placeholder ph-or">
            <span class="placeholder-icon">🌈</span>
          </div>
        </div>
        <div class="project-card-body">
          <h3>Ordinal Rainbows</h3>
          <p>Digital art ecosystem minting rainbow photography as Ordinals on BSV Blockchain</p>
          <span class="project-card-status live">Live</span>
        </div>
      </a>

      <a href="projects/accessibility-pad.html" class="project-card">
        <div class="project-card-image">
          <div class="project-card-placeholder ph-ap">
            <span class="placeholder-icon">♿</span>
          </div>
        </div>
        <div class="project-card-body">
          <h3>Accessibility Pad</h3>
          <p>Voice-powered notepad built with full accessibility support from the ground up</p>
          <span class="project-card-status live">Live</span>
        </div>
      </a>

      <a href="projects/youtunes.html" class="project-card">
        <div class="project-card-image">
          <div class="project-card-placeholder ph-yt">
            <span class="placeholder-icon">🎵</span>
          </div>
        </div>
        <div class="project-card-body">
          <h3>YouTunes</h3>
          <p>BSV Blockchain music streaming with direct micropayments per stream to artists</p>
          <span class="project-card-status coming-soon">Coming Soon</span>
        </div>
      </a>

      <a href="projects/stratos.html" class="project-card">
        <div class="project-card-image">
          <div class="project-card-placeholder ph-st">
            <span class="placeholder-icon">🌍</span>
          </div>
        </div>
        <div class="project-card-body">
          <h3>Stratos</h3>
          <p>Real-time global monitor for weather, earthquakes, and space weather</p>
          <span class="project-card-status live">Live</span>
        </div>
      </a>

      <a href="projects/asmrtists.html" class="project-card">
        <div class="project-card-image">
          <div class="project-card-placeholder ph-as">
            <span class="placeholder-icon">🎨</span>
          </div>
        </div>
        <div class="project-card-body">
          <h3>ASMRtists</h3>
          <p>Print fulfillment &amp; NFT portal turning visual art into on-chain revenue for artists and collectors</p>
          <span class="project-card-status live">In Development</span>
        </div>
      </a>

    </div>
```

Replace it with:

```html
    <div class="featured-bubbles">

      <a href="https://kathleenyearwood.com" target="_blank" rel="noopener noreferrer" class="project-bubble project-bubble-lg" data-tooltip="Kathleen Yearwood — client site built by ChefMyKLove Custom Software Solutions" aria-label="Kathleen Yearwood">
        <svg class="bubble-icon-svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="21.5" y="2" width="5" height="20" rx="1.5" fill="currentColor" opacity="0.9"/>
          <path d="M19 2 L29 2 L27 7 L21 7 Z" fill="currentColor" opacity="0.9"/>
          <path d="M24 20 C 34 20, 40 26, 38 34 C 36 41, 28 44, 24 40 C 20 44, 12 41, 10 34 C 8 26, 14 20, 24 20 Z" fill="currentColor"/>
          <circle cx="24" cy="30" r="1.4" fill="#0a0a0f"/>
          <rect x="20" y="24" width="8" height="2" rx="1" fill="#0a0a0f" opacity="0.7"/>
        </svg>
        <span class="project-bubble-label">Kathleen Yearwood</span>
        <span class="project-bubble-status live">Live</span>
      </a>

      <a href="https://selinamartin.com" target="_blank" rel="noopener noreferrer" class="project-bubble project-bubble-lg" data-tooltip="Selina Martin — client site built by ChefMyKLove Custom Software Solutions" aria-label="Selina Martin">
        <svg class="bubble-icon-svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="21.5" y="2" width="5" height="18" rx="1.5" fill="currentColor" opacity="0.9"/>
          <path d="M19 2 L29 2 L27 6 L21 6 Z" fill="currentColor" opacity="0.9"/>
          <path d="M24 18 C 36 18, 42 26, 40 34 C 38 43, 26 46, 18 42 C 10 38, 8 28, 14 22 C 17 19, 20 18, 24 18 Z" fill="currentColor"/>
          <rect x="19" y="27" width="10" height="2.4" rx="1.2" fill="#0a0a0f" opacity="0.7"/>
        </svg>
        <span class="project-bubble-label">Selina Martin</span>
        <span class="project-bubble-status live">Live</span>
      </a>

      <a href="https://chefmyklove.com" target="_blank" rel="noopener noreferrer" class="project-bubble project-bubble-lg" data-tooltip="ChefMyKLove.com — my ongoing portfolio project" aria-label="ChefMyKLove.com">
        <svg class="bubble-icon-svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M14 44 L14 30 L34 30 L34 44 Z" fill="currentColor" opacity="0.9"/>
          <path d="M12 30 C 8 30, 6 26, 8 22 C 9 19, 12 18, 14 19 C 14 13, 20 9, 24 9 C 28 9, 34 13, 34 19 C 36 18, 39 19, 40 22 C 42 26, 40 30, 36 30 Z" fill="currentColor"/>
        </svg>
        <span class="project-bubble-label">ChefMyKLove.com</span>
        <span class="project-bubble-status live">Live</span>
      </a>

    </div>

    <span class="bubble-section-label">Projects</span>

    <div class="project-bubbles">

      <a href="projects/not-just-covid.html" class="project-bubble" data-tooltip="Clean air advocacy platform for disability justice communities" aria-label="Not Just Covid">
        <span class="project-bubble-icon" aria-hidden="true">🌬️</span>
        <span class="project-bubble-label">Not Just Covid</span>
        <span class="project-bubble-status coming-soon">Coming Soon</span>
      </a>

      <a href="ordinal-rainbows.html" class="project-bubble" data-tooltip="Digital art ecosystem minting rainbow photography as Ordinals on BSV Blockchain" aria-label="Ordinal Rainbows">
        <span class="project-bubble-icon" aria-hidden="true">🌈</span>
        <span class="project-bubble-label">Ordinal Rainbows</span>
        <span class="project-bubble-status live">Live</span>
      </a>

      <a href="projects/accessibility-pad.html" class="project-bubble" data-tooltip="Voice-powered notepad built with full accessibility support from the ground up" aria-label="Accessibility Pad">
        <span class="project-bubble-icon" aria-hidden="true">♿</span>
        <span class="project-bubble-label">Accessibility Pad</span>
        <span class="project-bubble-status live">Live</span>
      </a>

      <a href="projects/youtunes.html" class="project-bubble" data-tooltip="BSV Blockchain music streaming with direct micropayments per stream to artists" aria-label="YouTunes">
        <span class="project-bubble-icon" aria-hidden="true">🎵</span>
        <span class="project-bubble-label">YouTunes</span>
        <span class="project-bubble-status coming-soon">Coming Soon</span>
      </a>

      <a href="projects/stratos.html" class="project-bubble" data-tooltip="Real-time global monitor for weather, earthquakes, and space weather" aria-label="Stratos">
        <span class="project-bubble-icon" aria-hidden="true">🌍</span>
        <span class="project-bubble-label">Stratos</span>
        <span class="project-bubble-status live">Live</span>
      </a>

      <a href="projects/asmrtists.html" class="project-bubble" data-tooltip="Print fulfillment &amp; NFT portal turning visual art into on-chain revenue for artists and collectors — seeking investment to launch. Investor package: invest@asmrtists.ca" aria-label="ASMRtists">
        <span class="project-bubble-icon" aria-hidden="true">🎨</span>
        <span class="project-bubble-label">ASMRtists</span>
        <span class="project-bubble-status seeking-funding">Seeking Funding</span>
      </a>

    </div>
```

- [ ] **Step 3: Verify in browser**

Run: `Start-Process "d:\Desktop\Portfolio-Page\projects.html"` (PowerShell)

Expected: No rectangular cards remain. A row of 3 large bubbles (Kathleen Yearwood with a curvy double-cutaway guitar icon, Selina Martin with a rounder single-cutaway guitar icon, ChefMyKLove.com with a chef-hat icon) appears above a "Projects" label, followed by a row of 6 smaller emoji-icon bubbles. Hovering any bubble scales it up and fades in a tooltip above it with the description text (ASMRtists tooltip includes "invest@asmrtists.ca"). ASMRtists shows an amber "Seeking Funding" badge; the others show green "Live" or purple "Coming Soon" badges. Clicking Kathleen/Selina/ChefMyKLove opens their site in a new tab; clicking Ordinal Rainbows stays on this site and opens `ordinal-rainbows.html`.

- [ ] **Step 4: Commit**

```bash
git add projects.html
git commit -m "Rebuild Projects page as bubble layout with featured client-site bubbles"
```

---

### Task 4: Cross-browser-width QA pass

**Files:**
- None (verification-only task, no code changes expected unless a bug is found)

**Interfaces:**
- Consumes: everything produced by Tasks 1-3
- Produces: nothing (terminal task)

- [ ] **Step 1: Verify desktop layout**

Run: `Start-Process "d:\Desktop\Portfolio-Page\projects.html"` (PowerShell), then resize the browser window to \>900px wide.

Expected: Featured row shows all 3 bubbles side by side at 200px diameter; project row shows all 6 bubbles side by side (wrapping only if the window is narrower than ~1100px) at 140px diameter.

- [ ] **Step 2: Verify tablet breakpoint (900px)**

Resize the browser window to between 580px and 900px wide.

Expected: Bubbles shrink (large bubbles to 160px, standard bubbles to 116px per the CSS in Task 2) and wrap onto additional rows as needed. No horizontal scrollbar appears.

- [ ] **Step 3: Verify mobile breakpoint (580px)**

Resize the browser window to below 580px wide, or open dev tools device emulation for a phone-sized viewport.

Expected: Bubbles shrink further (large bubbles to 138px, standard bubbles to 100px) and stack into a narrower wrapped grid. Tooltip width narrows to 160px so it doesn't overflow the viewport. No horizontal scrollbar appears.

- [ ] **Step 4: Verify touch/no-hover fallback**

In dev tools, use device emulation (which reports `(hover: none)`) or a real touch device.

Expected: Tapping a bubble navigates directly to its link without any tooltip appearing or blocking the tap (per the `@media (hover: none)` rule added in Task 2).

- [ ] **Step 5: Verify homepage still works end-to-end**

Run: `Start-Process "d:\Desktop\Portfolio-Page\index.html"` (PowerShell)

Expected: All 10 nav bubbles still fan out and animate in as before Task 1. No console errors in dev tools.

- [ ] **Step 6: Fix any issues found, then final commit if changes were made**

If Steps 1-5 revealed any layout bugs, fix them in `carousel.css` or `projects.html`, re-verify, then:

```bash
git add carousel.css projects.html
git commit -m "Fix responsive/touch issues found in Projects bubble QA pass"
```

If no issues were found, no commit is needed for this task.

---

## Self-Review Notes

- **Spec coverage:** Section 1 (homepage bubble changes) → Task 1. Section 2 layout/sizing → Task 2 (CSS) + Task 3 (markup). Per-bubble spec table (icons, links, tooltips, status badges) → Task 3, every row from both tables represented. Interaction (hover tooltip, touch fallback) → Task 2 CSS + Task 4 verification. Responsive behavior → Task 2 CSS breakpoints + Task 4 verification. Out-of-scope items (sub-pages, homepage radial layout, backend) are untouched by all tasks.
- **Placeholder scan:** No TBD/TODO markers; every step has complete, real code.
- **Type/name consistency:** CSS class names (`.project-bubble`, `.project-bubble-lg`, `.project-bubble-icon`, `.bubble-icon-svg`, `.project-bubble-label`, `.project-bubble-status` + modifiers, `.featured-bubbles`, `.project-bubbles`, `.bubble-section-label`, `[data-tooltip]`) are identical between Task 2 (where they're defined) and Task 3 (where they're used in markup).
