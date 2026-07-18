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

  // Measure the field's natural (pre-absolute) flow height before
  // createField() switches every body to position:absolute — otherwise
  // .featured-bubbles/.project-bubbles collapse to zero height once their
  // children leave the flow, and the footer renders on top of the bubbles
  // instead of below them.
  const naturalHeight = field.getBoundingClientRect().height;
  field.style.minHeight = naturalHeight + 'px';

  const allBodies = [backBtn, titleBubble].concat(projectBubbles).filter(Boolean);
  window.BubblePhysics.createField({ field: field, bodies: allBodies });
})();
