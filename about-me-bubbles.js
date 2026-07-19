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
        applyAnchor(deck, anchor);
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
        const link = el.querySelector('a');
        if (link) {
          if (depth === 0) link.removeAttribute('tabindex');
          else link.setAttribute('tabindex', '-1');
        }
        el.style.zIndex = String(100 - depth);
        const home = { x: anchor.x + offset.dx, y: anchor.y + offset.dy };
        if (cardIdx === leavingIdx) {
          const sign = direction === 'next' ? 1 : -1;
          physics.retarget(el, home, { detour: { x: anchor.x + sign * 420, y: anchor.y - 140 } });
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
