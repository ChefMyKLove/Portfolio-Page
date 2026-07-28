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

  // Everything (back button, title, both decks' cards, and both decks'
  // arrow rows) must fit on one screen with no scrolling. So every card
  // in a deck gets ONE uniform diameter — no per-card variation by
  // content length — sized from the space that's actually left once
  // every other fixed piece of chrome is accounted for. Content that's
  // too long for that circle scrolls inside it (.deck-card-inner has
  // overflow-y: auto) rather than growing the circle past what fits.
  function computeCardDiameter() {
    // Below 720px the two decks stack vertically (matching .am-grid's
    // media query) instead of sitting side-by-side, and the page scrolls
    // normally there (see .am-page's media query) — so the one-screen
    // height budget doesn't apply; size from width alone.
    if (window.innerWidth <= 720) {
      return Math.max(140, Math.min(360, window.innerWidth * 0.8));
    }
    const page = document.querySelector('.am-page');
    const backRow = document.querySelector('.am-back-row-inline');
    const titleSlot = document.querySelector('.am-title-slot');
    const footer = document.querySelector('.am-footer');
    const pageStyle = getComputedStyle(page);
    const pagePadding = parseFloat(pageStyle.paddingTop) + parseFloat(pageStyle.paddingBottom);
    const footerStyle = footer ? getComputedStyle(footer) : null;
    const footerMarginTop = footerStyle ? parseFloat(footerStyle.marginTop) : 0;

    const backRowH = (backRow ? backRow.getBoundingClientRect().height : 0) + 8; // + its own margin-bottom
    const titleSlotH = titleSlot ? titleSlot.getBoundingClientRect().height : 0;
    const gridMarginTop = 8;
    const controlsH = 52;
    const columnGap = 16; // gap between deck-wrap and its controls row
    const footerH = (footer ? footer.getBoundingClientRect().height : 0) + footerMarginTop;
    // Matches the +90 buffer applied to the deck-wrap's own min-height
    // below (room for the deepest stacked card's peek-out offset).
    const deckWrapBuffer = 90;

    const reservedHeight = pagePadding + backRowH + titleSlotH + gridMarginTop + deckWrapBuffer + controlsH + columnGap + footerH;
    const heightBudget = window.innerHeight - reservedHeight;

    const gridMaxWidth = 1300, gridGap = 120, gridSidePadding = 48; // matches .am-grid / .am-page CSS
    const gridAvailableWidth = Math.min(gridMaxWidth, window.innerWidth - gridSidePadding);
    const widthBudget = (gridAvailableWidth - gridGap) / 2;

    return Math.max(140, Math.min(heightBudget, widthBudget));
  }
  const cardDiameter = computeCardDiameter();

  const journeyDeck = window.AboutMeDecks.buildDeck(journeyContainer, window.AboutMeDecks.JOURNEY_SLIDES, cardDiameter);
  const skillsDeck = window.AboutMeDecks.buildDeck(skillsContainer, window.AboutMeDecks.SKILLS_SLIDES, cardDiameter);

  // The CSS min-height on .deck-wrap is a fallback; reserve the uniform
  // card size plus room for the deepest stacked card's offset (up to
  // ~70px at 5 cards deep) so the peeking stack never clips its wrap.
  journeyContainer.style.minHeight = (cardDiameter + 90) + 'px';
  skillsContainer.style.minHeight = (cardDiameter + 90) + 'px';

  function anchorOf(container) {
    const c = container.getBoundingClientRect();
    const f = pageField.getBoundingClientRect();
    return { x: c.left - f.left + c.width / 2, y: c.top - f.top + c.height / 2 };
  }
  const journeyAnchor = anchorOf(journeyContainer);
  const skillsAnchor = anchorOf(skillsContainer);

  function applyAnchor(deck, anchor) {
    deck.order.forEach(function (cardIdx, depth) {
      const el = deck.cards[cardIdx];
      const offset = deck.stackOffset(depth);
      const r = parseFloat(el.style.width) / 2;
      el.style.transform = 'translate(' + (anchor.x + offset.dx - r) + 'px, ' + (anchor.y + offset.dy - r) + 'px)';
    });
  }
  applyAnchor(journeyDeck, journeyAnchor);
  applyAnchor(skillsDeck, skillsAnchor);

  const allBodies = [backBtn, titleBubble].concat(journeyDeck.cards, skillsDeck.cards).filter(Boolean);
  const physics = window.BubblePhysics.createField({
    field: pageField,
    bodies: allBodies,
    // Only grabbing/flinging the "About Me" bubble itself triggers the
    // field-wide shrink — dragging a content card or cycling the arrows
    // does not.
    shrinkTriggerEl: titleBubble,
    constants: {
      DRIFT_AMP_MIN: 3,
      DRIFT_AMP_MAX: 6,
      // Snappier spring-home so the arrow-cycle slide (and any settling
      // after a fling) resolves quickly instead of drifting slowly in.
      SPRING: 0.09,
      HOMING_CAP: 34,
      // Bubbles read at full size at rest, but shrink toward the same
      // diameter as the About Me title bubble the instant it starts
      // moving — full-size circles crashing into each other looked too
      // heavy; small ones bouncing around reads as a proper bubble effect.
      SHRINK_TO_DIAMETER: 260
    }
  });

  function wireArrows(prefix, deck, anchor) {
    const prevBtn = document.getElementById(prefix + 'Prev');
    const nextBtn = document.getElementById(prefix + 'Next');
    const liveRegion = document.getElementById(prefix + 'Live');

    function announce() {
      if (!liveRegion) return;
      liveRegion.textContent = 'Slide ' + (deck.order[0] + 1) + ' of ' + deck.cards.length;
    }

    function cycle(direction) {
      if (direction === 'next') deck.order.push(deck.order.shift());
      else deck.order.unshift(deck.order.pop());

      if (!physics) {
        deck.layout();
        applyAnchor(deck, anchor);
        announce();
        return;
      }

      // No detour: every card (including the one leaving the front)
      // retargets straight to its new stack slot. The departing card's
      // z-index drops to the back immediately, so it visibly slides
      // behind the incoming card rather than flying out and back —
      // quicker and more direct than the old fly-out animation.
      deck.order.forEach(function (cardIdx, depth) {
        const el = deck.cards[cardIdx];
        const offset = deck.stackOffset(depth);
        const inner = el.querySelector('.deck-card-inner');
        if (inner) inner.style.transform = 'rotate(' + offset.rot + 'deg) scale(' + offset.scale + ')';
        el.classList.toggle('wobble', depth === 0);
        el.setAttribute('aria-hidden', depth === 0 ? 'false' : 'true');
        const link = el.querySelector('a');
        if (link) {
          if (depth === 0) link.removeAttribute('tabindex');
          else link.setAttribute('tabindex', '-1');
        }
        el.style.zIndex = String(100 - depth);
        const home = { x: anchor.x + offset.dx, y: anchor.y + offset.dy };
        physics.retarget(el, home);
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
