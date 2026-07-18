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
