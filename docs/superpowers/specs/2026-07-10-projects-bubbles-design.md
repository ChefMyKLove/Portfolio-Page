# Projects Bubbles Design

Date: 2026-07-10

## Summary

Two changes to the portfolio site's navigation and Projects page:

1. The homepage's Ordinal Rainbows nav bubble links directly out to `ordinalrainbows.com` instead of the internal page, and the Projects nav bubble gets a briefcase icon instead of `{ }`.
2. The Projects page (`projects.html`) drops its rectangular card grid entirely in favor of a bubble layout, reusing the homepage's glass-bubble visual language. Every project becomes a bubble, plus three new bubbles for client/portfolio sites (Kathleen Yearwood, Selina Martin, ChefMyKLove.com).

## 1. Homepage nav bubble changes

File: `index.html`

- **Ordinal Rainbows bubble** ([index.html:96-99](../../../index.html#L96-L99)): add `target="_blank" rel="noopener noreferrer"` and change `href` to `https://ordinalrainbows.com`. This matches the existing external-link pattern used by the NAKED, Stratos, and Solutions bubbles. The internal `ordinal-rainbows.html` page is untouched and stays linked from the Projects page bubble (see below).
- **Projects bubble** ([index.html:84-86](../../../index.html#L84-L86)): icon changes from `{ }` to a briefcase icon (💼). Link and label unchanged.

## 2. Projects page bubble conversion

File: `projects.html` (structure + new styles), `carousel.css` (new bubble-grid CSS replaces the `.projects-grid`/`.project-card` block at lines 1697-1833, or lives alongside it if the old classes are still referenced elsewhere — confirm during implementation and remove old rules if unused).

### Layout

Two-tier layout, both using a wrapping flex/grid row centered on the page (not the homepage's fixed-position radial layout — this is a normal in-flow section so it reads top-to-bottom and wraps responsively):

1. **Featured row** — 3 large bubbles (~200px diameter desktop, scaling down on narrow viewports): Kathleen Yearwood, Selina Martin, ChefMyKLove.com.
2. **Projects row** — 6 standard bubbles (~140px diameter desktop): Not Just Covid, Ordinal Rainbows, Accessibility Pad, YouTunes, Stratos, ASMRtists.

Each bubble is styled after `.nav-bubble` (glass background, blur, glow border, scale-on-hover) but sized larger and positioned in normal flow. A section label ("Featured Sites" / "Projects") separates the two rows.

### Per-bubble spec

**Featured (large) bubbles:**

| Bubble | Icon | Link | Hover tooltip | Status badge |
|---|---|---|---|---|
| Kathleen Yearwood | Custom inline SVG guitar #1 — curvy double-cutaway body (Stratocaster-style silhouette) | `https://kathleenyearwood.com`, new tab | "Kathleen Yearwood — client site built by ChefMyKLove Custom Software Solutions" | Live |
| Selina Martin | Custom inline SVG guitar #2 — single-cutaway body (Les Paul-style silhouette), visually distinct shape from Kathleen's icon | `https://selinamartin.com`, new tab | "Selina Martin — client site built by ChefMyKLove Custom Software Solutions" | Live |
| ChefMyKLove.com | Custom inline SVG chef hat | `https://chefmyklove.com`, new tab | "ChefMyKLove.com — my ongoing portfolio project" | Live |

**Standard (project) bubbles** — same links/icons/status as the current cards, reusing existing descriptions as tooltip text:

| Bubble | Icon | Link | Hover tooltip | Status badge |
|---|---|---|---|---|
| Not Just Covid | 🌬️ | `projects/not-just-covid.html` | "Clean air advocacy platform for disability justice communities" | Coming Soon |
| Ordinal Rainbows | 🌈 | `ordinal-rainbows.html` (internal) | "Digital art ecosystem minting rainbow photography as Ordinals on BSV Blockchain" | Live |
| Accessibility Pad | ♿ | `projects/accessibility-pad.html` | "Voice-powered notepad built with full accessibility support from the ground up" | Live |
| YouTunes | 🎵 | `projects/youtunes.html` | "BSV Blockchain music streaming with direct micropayments per stream to artists" | Coming Soon |
| Stratos | 🌍 | `projects/stratos.html` | "Real-time global monitor for weather, earthquakes, and space weather" | Live |
| ASMRtists | 🎨 | `projects/asmrtists.html` | "Print fulfillment & NFT portal turning visual art into on-chain revenue for artists and collectors — seeking investment to launch. Investor package: invest@asmrtists.ca" | **Seeking Funding** (badge text changes from "In Development") |

### Interaction

- Hover: bubble scales up slightly (matching `.nav-bubble.visible:hover` behavior) and a tooltip fades in above the bubble showing the description text. Tooltip is CSS-only (no JS), using a `data-tooltip` attribute + `::after`/`::before` pseudo-elements, consistent with the site's existing glass/blur aesthetic.
- Status badge sits as a small corner tag on the bubble (reusing the `.project-card-status.live` / `.coming-soon` color scheme: green for live, purple for coming soon; a new color for "Seeking Funding", e.g. amber/gold to signal a call-to-action).
- Touch devices: tapping a bubble navigates (no separate tooltip-only tap state needed — the tooltip is a nice-to-have on hover-capable devices, degrades gracefully by simply not showing on touch).

### Responsive behavior

Follows the existing mobile pattern used for `.nav-bubble` and `.projects-grid`: bubbles shrink and the row wraps to fewer per line as viewport narrows (roughly 3 → 2 → 1 across breakpoints, mirroring the current `.projects-grid` breakpoints at 900px and 580px).

## Out of scope

- No changes to the individual project sub-pages (`projects/*.html`, `ordinal-rainbows.html`).
- No changes to the homepage's fixed-position radial bubble layout or its other bubbles beyond the two listed in Section 1.
- No backend/CMS changes — this is static HTML/CSS.
