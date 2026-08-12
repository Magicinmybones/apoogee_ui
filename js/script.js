/* --------------------------------------------------------------------------
   Apogee — hero landing page
   -------------------------------------------------------------------------- */
(function () {
  'use strict';

  var DESIGN_WIDTH = 1644;
  var REFLOW_BREAKPOINT = 900; /* keep in sync with css/style.css */

  var root = document.documentElement;

  /* ------------------------------------------------------------------
     Scale the artboard so the desktop composition keeps its exact
     proportions on any viewport wider than the reflow breakpoint.
     ------------------------------------------------------------------ */
  function fitStage() {
    if (window.innerWidth <= REFLOW_BREAKPOINT) {
      root.style.setProperty('--stage-scale', '1');
      return;
    }
    var available = document.documentElement.clientWidth;
    root.style.setProperty('--stage-scale', String(Math.min(1, available / DESIGN_WIDTH)));
  }

  fitStage();
  window.addEventListener('resize', fitStage);

  /* ------------------------------------------------------------------
     Menu for reflowed (narrow) viewports.
     ------------------------------------------------------------------ */
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');

  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  }

  if (toggle && menu) {
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
  }
})();
