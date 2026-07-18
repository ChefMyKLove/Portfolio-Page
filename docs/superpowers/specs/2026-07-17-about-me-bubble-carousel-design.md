# About Me / Projects Bubble Redesign — Design Spec

Date: 2026-07-17

## 1. Overview

Replace the rectangular glass-card layout on `about-me.html` with the site's
circular "bubble" visual language (already used on the splash page, the
Projects grid, and the Contact bubble pool). The page title, the back-to-portfolio
link, and the two content sections ("My Journey", "Skills & Background")
all become physics-driven circular bubbles. `projects.html` gets the same
title/back-button treatment and joins its existing 9 project bubbles into
the same physics field.

## 2. Goals

- About Me content reads as stacked "decks" of circular cards instead of
  rectangular text blocks.
- Every bubble on both pages (title, back button, content cards, existing
  project bubbles) lives in one shared, physics-driven field per page: drag
  any bubble, fling it, and it can collide with *any* other bubble on that
  page, cascading a chain-reaction scatter across the whole page. Everything
  independently springs back to its own home position afterward.
- Physics feel more energetic and longer-lasting than the existing Contact
  page pool (bigger launches, less damping, longer before homing kicks back in).
- Existing Contact page (`bubble-pool.js`) behavior is unchanged — this is
  additive, not a refactor of a working page.
- Reduced-motion and narrow-screen users get a fully usable static fallback.

## 3. Non-goals

- No changes to `contact.html`'s existing bubble pool behavior or constants.
- No content rewrite beyond re-chunking existing copy into slides (copy text
  itself stays as-is, see §5).
- No changes to the Projects page's existing bubble *content*, links, tooltips,
  or status badges — only their physics/visual treatment changes.

## 4. Architecture

### 4.1 Shared physics module (new: `bubble-physics.js`)

Extract the reusable core of `bubble-pool.js` (collision detection, mass-weighted
impulse response, spring-to-home, idle drift, drag/fling pointer handling,
click-vs-fling disambiguation, resize handling, reduced-motion bail-out) into
a shared module used by `about-me.html` and `projects.html`. `bubble-pool.js`
itself is left untouched so `contact.html` carries zero regression risk.

For deck cards specifically, "current position" means each card's authored
stacked offset (a small per-depth translate/rotate/scale, see §5.6) — so a
card's physics home is its slot in the stack, not a shared single point. This
is what makes the "resolve back to the wobbly carousel" behavior work: each
card independently springs back to its own stacked slot.

The shared module takes a **home-layout strategy** as a parameter, because the
three pages need different home arrangements:

- **Contact page** (unchanged, still its own file): big bubble in the center,
  others orbit it.
- **About Me / Projects pages** (new): **freeze-current-position** strategy —
  bubbles are first laid out normally via CSS (flex/grid, or stacked via
  transform offsets for deck cards), then the script measures each element's
  rendered center position and uses that as its physics home. This means the
  visual layout intent (two-column decks, project grid) is authored in plain
  CSS/HTML, and the physics layer just makes it draggable/collidable on top.

### 4.2 Physics tuning ("louder and longer" than Contact page)

Starting values (tunable during implementation), relative to `bubble-pool.js`'s
constants:

| Constant | Contact page | About Me / Projects |
|---|---|---|
| RESTITUTION | 0.9 | 0.96 |
| DAMPING | 0.98 | 0.99 |
| MAX_LAUNCH | 45 px/frame | 70 px/frame |
| HIT_COOLDOWN | 500 ms | 900 ms |
| SLOW_SPEED (homing threshold) | 2.5 | 1.8 |
| idle drift amplitude | 5-9px | 10-18px |

Net effect: bigger flings, bubbles coast and bounce longer before any of them
starts homing, and the idle wobble is more visible even at rest.

### 4.3 Cycling glow (shared CSS)

Every bubble gets a `::before` layer running the site's existing 130s
`backgroundCycle` keyframe (same rotation already used by `#emailTrigger`,
`.glass-card`, `.section-content-box`) at ~0.4 opacity, clipped to
`border-radius: 50%`, sitting behind the bubble's content. Pure reuse of an
existing animation — no new keyframes needed.

## 5. About Me page

### 5.1 Back button

True circle (~54px), icon-only (←), tooltip "Portfolio" on hover/focus, fixed
top-left position (matches today's placement). Part of the page's shared
physics field.

### 5.2 Title bubble

True circle sized to hug its content (~260px), containing only "About Me" in
stacked, rainbow-gradient text — no label or tagline inside. The "Portfolio"
eyebrow label and "Developer · Artist · Activist" tagline move to plain text
below the circle. Part of the shared physics field.

### 5.3 Journey deck (left column, 6 cards)

Stacked deck, one card visible/readable at a time (top of stack); the rest
peek out as layered edges behind it. Card diameter varies by content length
(see §5.5). Slides, in order:

1. "A lifelong creative exploring media as diverse as sound sculpture, fibre
   art, painting, poetry, and soap making, my practice currently exists at
   the intersection of photography, digital manipulation, and
   blockchain-based community art. After three decades as a professional
   chef, a career-ending injury pushed me into software
   development—a shift that fundamentally changed my creative practice and
   kick-started an incredible new artistic odyssey."
2. "I discovered that debugging code, like recipe development, is about
   transformation: taking ideas and raw materials and reshaping them into
   something new that provides a nourishing experience. Software
   development offered something my earlier media couldn't—the ability to
   create work that scales, persists, and invites participation. Code lets
   me turn ideas into interactive experiences. Now I work creatively in this
   digital realm, treating technology as both medium and collaborator in
   building more inclusive digital spaces."
3. "What excites me is that this technology is a studio, a megaphone, and a
   toolkit all in one. It amplifies creativity, connects communities, and
   opens sustainable paths for artists who've been shut out of traditional
   systems. I'm building tools and experiences that let marginalized
   creators own their work, reach audiences directly, and thrive on their
   own terms—using code and blockchain as levers for real equity."
4. Link-out card: "See what I'm cooking up →" (→ `projects.html`)
5. Image card: `images/HummingBow.jpg` (art photo)
6. Image card: `images/IMG_20201211_103947_047.png` (personal photo)

> Note: the original 4-paragraph block is split into 3 paragraph cards + the
> existing "See what I'm cooking up" link as its own 4th card, to match the
> "one bubble with four elements" split from the original request.

### 5.4 Skills deck (right column, 4 cards)

1. Intro paragraph ("My career has spanned over 30 years in culinary
   arts...") + "From the kitchen to the codebase" list (Systems Thinking,
   Emotional Intelligence, Adaptability).
2. Transition paragraph ("Transitioning into software development...") +
   "What that looks like in practice" list (Creative Advocacy, Inclusive
   Design, Alternative Economics, Civic Technology, Community Empowerment).
3. Image card: `images/TieDyeBow.JPEG` (art photo)
4. Image card: `images/IMG_20201211_103947_047.png` (personal photo)

### 5.5 Card sizing

Diameter scales with word count, clamped:

```
diameter = clamp(280px, 260px + wordCount * 2.4px, 440px)
```

Image cards use a fixed 320px diameter with `object-fit: cover`.

### 5.6 Interaction model

- **Idle**: whole stack wobbles gently in place (subtle bob/rotate loop).
- **Arrows (‹ ›, built into each deck)**: pop the top card away with a
  fly-off animation (translate + rotate + fade), then move it to the bottom
  of that deck's own slide order — loops forever. This is a deliberate,
  non-physics UI action; it does not touch the shared physics field.
- **Drag/fling any card (top or, once exposed by dragging things out of the
  way, any other)**: that card becomes a live physics body in the page's
  shared field — it can travel anywhere on the page and collide with the
  title bubble, back button, or any card from the *other* deck. Collisions
  cascade (chain-reaction "burst"). Every bubble independently springs back
  to its own home position once it settles.
- Both decks and the title/back bubble share **one physics field** per page
  — nothing is siloed.

## 6. Projects page

- New title bubble ("Projects", same treatment as §5.2) and back button
  (§5.1).
- All 9 existing project/featured bubbles keep their current content,
  links, hover tooltips, and status badges, but gain: the cycling-glow
  visual (§4.3), and membership in the page's shared physics field (draggable,
  collidable with each other and with the new title/back bubbles). Existing
  click-through behavior is preserved via the same click-vs-fling
  disambiguation already proven on the Contact page.

## 7. Accessibility & fallback

- `prefers-reduced-motion: reduce` or narrow viewport (< 340px field width,
  matching `bubble-pool.js`'s existing threshold): physics module doesn't
  activate. Decks show only their top card (static), arrows still work via a
  simple show/hide swap (no fly-off animation, or a much shorter one guarded
  by the same media query). Title/back/project bubbles render at their
  authored CSS positions, fully clickable, no drag.
- Arrow buttons are real `<button>` elements, keyboard-focusable, with
  `aria-label`s ("Previous slide in Journey carousel", etc.).
- An `aria-live="polite"` region announces the current slide ("Slide 2 of 4")
  on arrow navigation.
- All image cards get descriptive `alt` text.

## 8. Testing / verification plan

Manual QA on both pages:

- Drag, fling, and release a bubble; confirm it collides with others,
  everything scatters, and each bubble returns to its own home position.
- Confirm arrow-click pops the top card and cycles order correctly, looping
  past the last slide back to the first.
- Confirm dragging a card does not interfere with arrow-driven cycling and
  vice versa.
- Confirm existing Projects page links, hover tooltips, and status badges
  still work after the physics/glow changes (click vs. drag still
  disambiguated correctly).
- Confirm `contact.html` is visually and behaviorally unchanged.
- Test with `prefers-reduced-motion: reduce` and at narrow viewport widths —
  confirm static fallback is fully usable via keyboard and touch.
- Test on mobile (touch drag/fling) on both pages.
