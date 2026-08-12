/* --------------------------------------------------------------------------
   Apogee
   Layout is handled entirely in CSS; the only behaviour here is the menu used
   once the header reflows.
   -------------------------------------------------------------------------- */
(function () {
  'use strict';

  var REFLOW_BREAKPOINT = 900; /* keep in sync with css/style.css */

  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  }

  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', function (event) {
    if (event.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setMenu(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > REFLOW_BREAKPOINT) setMenu(false);
  });
})();
