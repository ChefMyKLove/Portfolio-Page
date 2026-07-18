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

  const allBodies = [backBtn, titleBubble].concat(projectBubbles).filter(Boolean);
  window.BubblePhysics.createField({ field: field, bodies: allBodies });
})();
