/* ==========================================================================
   Apogee
   --------------------------------------------------------------------------
   The hero and the platform frame are two framings of one photograph, so the
   move between them is a single camera travel rather than a crossfade. The
   scene is pinned; scroll progress drives one timeline, and every element is
   a track on it with its own window and easing. Values below were read off
   the reference animation and normalised to that timeline.
   ========================================================================== */
(function () {
  'use strict';

  var REFLOW_BREAKPOINT = 900; /* keep in sync with css/style.css */
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.classList.add('js');

  /* ------------------------------------------------------------------
     Easing
     ------------------------------------------------------------------ */
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function linear(t) { return t; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* Progress of a track that runs between `from` and `to` on the timeline. */
  function track(p, from, to, ease) {
    return (ease || linear)(clamp01((p - from) / (to - from)));
  }

  /* ------------------------------------------------------------------
     The camera
     Both framings place the same image with the same width; only the
     translate differs, so the travel is a straight interpolation between
     the two design values. On top of it rides a push-in that peaks
     mid-travel and resolves to 1, which is the depth the reference
     animation gets from zooming as it climbs.
     ------------------------------------------------------------------ */
  var CAM = {
    from: { x: -47.957, y: -80.097 },   /* hero frame:     photo at -35, -2037 */
    to:   { x: -50.0,   y: -36.716 },   /* platform frame: photo at -71,  -654 */
    /* The reference animation lands its framing before the content has
       finished settling: tracking the photograph through it puts the frame on
       the platform crop at ~86% of the travel, then holding. Within that the
       travel is linear — measured 0.447 of the way at 0.377 of the scroll,
       against 0.444 for a straight line. */
    until: 0.86,
    /* It also zooms as it climbs; at that same point it is at 1.108. A push
       that peaks mid-travel and resolves to 1 gives the same depth while
       still landing exactly on the platform frame. */
    push: 0.11
  };

  /* ------------------------------------------------------------------
     Timeline. Windows are fractions of the scene's scroll travel.
     ------------------------------------------------------------------ */
  var T = {
    glowOut:  [0.000, 0.360, easeInOutCubic],
    heroOut:  [0.290, 0.410, easeInOutCubic],
    platIn:   [0.567, 0.623, easeOutCubic],   /* the frame fades up ...        */
    platRise: [0.557, 0.984, easeOutCubic]    /* ... while it rides into place */
  };

  var scene = document.getElementById('scene');

  function apply(p) {
    /* The camera tracks scroll directly: the reader is the timeline, so any
       easing on it would just read as lag. Secondary tracks are eased. */
    var q = clamp01(p / CAM.until);

    root.style.setProperty('--p', p.toFixed(4));
    root.style.setProperty('--cam-x', lerp(CAM.from.x, CAM.to.x, q).toFixed(4) + '%');
    root.style.setProperty('--cam-y', lerp(CAM.from.y, CAM.to.y, q).toFixed(4) + '%');
    root.style.setProperty('--cam-z',
      (reduced ? 1 : 1 + CAM.push * Math.sin(Math.PI * q)).toFixed(4));

    root.style.setProperty('--glow-o', (1 - track(p, T.glowOut[0], T.glowOut[1], T.glowOut[2])).toFixed(3));

    var heroOut = track(p, T.heroOut[0], T.heroOut[1], T.heroOut[2]);
    root.style.setProperty('--hero-o', (1 - heroOut).toFixed(3));
    root.style.setProperty('--hero-vis', heroOut >= 1 ? 'hidden' : 'visible');

    root.style.setProperty('--plat-o',
      track(p, T.platIn[0], T.platIn[1], T.platIn[2]).toFixed(3));
    root.style.setProperty('--plat-p',
      track(p, T.platRise[0], T.platRise[1], T.platRise[2]).toFixed(4));

    /* Keep the frame that is off-stage out of the accessibility tree and
       out of hit-testing. */
    root.style.setProperty('--plat-vis', p > 0.54 ? 'visible' : 'hidden');

    /* Layer promotion is worth it mid-move and costs sharpness at rest. */
    root.classList.toggle('is-moving', p > 0.001 && p < 0.999);
  }

  /* ------------------------------------------------------------------
     Scroll binding
     ------------------------------------------------------------------ */
  var ticking = false;
  var lastP = -1;

  function progress() {
    if (!scene) return 0;
    var travel = scene.offsetHeight - window.innerHeight;
    if (travel <= 0) return 0;
    return clamp01((window.scrollY - scene.offsetTop) / travel);
  }

  function update() {
    ticking = false;
    var p = progress();
    if (Math.abs(p - lastP) < 0.0002) return;
    lastP = p;
    apply(p);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  apply(progress());
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    lastP = -1;
    update();
  });

  /* ------------------------------------------------------------------
     Opening. Skipped when the page loads part-scrolled, or on request.
     ------------------------------------------------------------------ */
  function startIntro() {
    if (reduced || progress() > 0.02) {
      root.classList.add('is-instant');
      return;
    }
    root.classList.add('is-ready');
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(startIntro);
    setTimeout(startIntro, 1200); /* never wait on a slow font */
  } else {
    startIntro();
  }

  /* ------------------------------------------------------------------
     Menu for reflowed (narrow) viewports.
     ------------------------------------------------------------------ */
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
