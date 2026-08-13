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
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
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
  /* Windows are fractions of the scene's travel, taken from the reference
     animation's 2.05s -> 5.10s transition and normalised onto it. */
  var T = {
    /* The hero copy holds at full strength while the camera climbs, then
       goes over about 0.6s. Shaped by HERO_EXIT rather than a single ease:
       the three properties that carry it do not run on the same curve. */
    heroOut:   [0.297, 0.508],
    /* The reference keeps the warm wash the whole way; it is resolved late so
       the frame still lands on its design, which has no wash. */
    glowOut:   [0.550, 0.950, easeInOutCubic],
    /* The platform frame fades up early in its rise. */
    platIn:    [0.557, 0.623, easeOutCubic],
    /* Pill and heading move as one block - they hold a constant 78px gap - and
       travel 638px, further and on a sharper curve than the window's 555px.
       The two rates are the parallax the arrival gets its depth from. */
    platText:  [0.563, 0.967, easeOutQuart],
    platShot:  [0.557, 0.984, easeOutCubic]
  };

  /* ------------------------------------------------------------------
     The hero exit

     Tracked at full resolution in the reference, the headline neither
     simply fades nor simply slides. Correlating each line against its own
     sharp frame gives, over the 0.33s the exit lasts:

       rise    0 -> 163px, accelerating (it fits t^1.75, not an ease-out)
       blur    0 -> 18px of Gaussian, fast at first then flattening
       opacity holds at 1 until the copy is already soft, then falls with
               a long tail — it is still a legible ghost two thirds of the
               way through and only clears at the very end

     So the copy is pulled up and out of focus first and only disappears
     once it is already soft, which is why a plain fade reads as wrong.
     The whole thing lasts 0.6s, twice as long as the blur alone suggests,
     because that tail is faint enough to miss in a profile fit and obvious
     on screen. Distances are design pixels and scale with --u-hero.
     ------------------------------------------------------------------ */
  var HERO_EXIT = {
    risePow:  1.75,
    blur:     18,
    blurPow:  0.9,
    fadeFrom: 0.38,
    fadePow:  1.25
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

    var exit = track(p, T.heroOut[0], T.heroOut[1]);
    var blur = HERO_EXIT.blur * Math.pow(exit, HERO_EXIT.blurPow);
    root.style.setProperty('--hero-out', Math.pow(exit, HERO_EXIT.risePow).toFixed(4));
    root.style.setProperty('--hero-o', Math.pow(
      1 - clamp01((exit - HERO_EXIT.fadeFrom) / (1 - HERO_EXIT.fadeFrom)),
      HERO_EXIT.fadePow).toFixed(3));
    /* `none` rather than blur(0) so nothing is rasterised through a filter
       while the hero is at rest. */
    if (exit > 0) {
      root.style.setProperty('--hero-filter',
        'blur(calc(' + blur.toFixed(3) + ' * var(--u-hero)))');
      root.style.setProperty('--badge-backdrop', 'none');
    } else {
      root.style.setProperty('--hero-filter', 'none');
      root.style.removeProperty('--badge-backdrop');
    }
    root.style.setProperty('--hero-vis', exit >= 1 ? 'hidden' : 'visible');

    root.style.setProperty('--plat-o',
      track(p, T.platIn[0], T.platIn[1], T.platIn[2]).toFixed(3));
    root.style.setProperty('--plat-text-p',
      track(p, T.platText[0], T.platText[1], T.platText[2]).toFixed(4));
    root.style.setProperty('--plat-shot-p',
      track(p, T.platShot[0], T.platShot[1], T.platShot[2]).toFixed(4));

    /* Keep the frame that is off-stage out of the accessibility tree and
       out of hit-testing. */
    root.style.setProperty('--plat-vis', p > 0.54 ? 'visible' : 'hidden');

    /* Layer promotion is worth it mid-move and costs sharpness at rest. */
    root.classList.toggle('is-moving', p > 0.001 && p < 0.999);

    /* Once the reader is moving, the opening has had its chance; retire it so
       it cannot outrank the exit. */
    if (p > 0.05) openHero();
  }

  /* ------------------------------------------------------------------
     Scroll binding

     Scroll gives the *target*; what gets rendered follows it. Mapping the
     timeline straight onto scrollY looks correct in a slow drag but collapses
     on a flick — a single wheel gesture can jump the whole scene in one frame,
     which reads as no animation at all.

     An exponential approach on its own is not enough either. It closes most of
     the gap immediately, so on a flick the first half of the timeline — which
     is where the hero copy leaves — is over in a tenth of a second and simply
     is not seen. What holds that beat open is a ceiling on how fast the
     timeline may advance: past it the scene plays at its own rate no matter
     how hard the page was thrown. MAX_RATE is set so a flick plays the whole
     move out in about two and a half seconds, near the reference's own 3.05s,
     which leaves the exit the half second it needs to read.

     Below the ceiling the smoothing is light, so a deliberate scroll still
     tracks the hand. Both steps are frame-rate independent — they work off
     real elapsed time, so they behave the same at 60Hz and 120Hz.
     ------------------------------------------------------------------ */
  var SETTLE = 9;        /* approach rate, per second */
  var MAX_RATE = 0.40;   /* ceiling on timeline units per second */
  var EPSILON = 0.0004;  /* close enough to snap, so the ends stay exact */

  var current = 0;
  var frameId = null;
  var lastTime = 0;

  function progress() {
    if (!scene) return 0;
    var travel = scene.offsetHeight - window.innerHeight;
    if (travel <= 0) return 0;
    return clamp01((window.scrollY - scene.offsetTop) / travel);
  }

  function frame(now) {
    var dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
    lastTime = now;

    var target = progress();
    if (reduced) {
      current = target;
    } else {
      var step = (target - current) * (1 - Math.exp(-SETTLE * dt));
      var cap = MAX_RATE * dt;
      if (step > cap) step = cap;
      else if (step < -cap) step = -cap;
      current += step;
      if (Math.abs(target - current) < EPSILON) current = target;
    }

    apply(current);

    if (current !== target) {
      frameId = requestAnimationFrame(frame);
    } else {
      frameId = null;
      lastTime = 0;
    }
  }

  function kick() {
    if (frameId === null) {
      lastTime = 0;
      frameId = requestAnimationFrame(frame);
    }
  }

  current = progress();
  apply(current);
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick);

  /* ------------------------------------------------------------------
     Opening. Skipped when the page loads part-scrolled, or on request.

     When it has played, .is-open retires its machinery. That matters beyond
     tidiness: a filled animation outranks the element's own opacity, so the
     exit could not fade a block the opening had left behind, and the line
     clip would cut the exit's blur off at the baseline.
     ------------------------------------------------------------------ */
  var intro = null;
  var opened = false;

  function openHero() {
    if (opened) return;
    opened = true;
    if (intro) { clearTimeout(intro); intro = null; }
    root.classList.add('is-open');
  }

  function startIntro() {
    if (reduced || progress() > 0.02) {
      root.classList.add('is-instant');
      openHero();
      return;
    }
    root.classList.add('is-ready');
    /* The sub-copy's fade is the last of the opening to finish. The timer is
       the backstop for when that event does not arrive. */
    var last = document.querySelector('.hero__subtitle');
    if (last) last.addEventListener('animationend', openHero, { once: true });
    intro = setTimeout(openHero, 1800);
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

  function setMenu(open, returnFocus) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    menu.hidden = !open;

    if (open) {
      var firstLink = menu.querySelector('a');
      if (firstLink) firstLink.focus({ preventScroll: true });
    } else if (returnFocus) {
      toggle.focus({ preventScroll: true });
    }
  }

  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', function (event) {
    if (event.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false, true);
    }
  });

  document.addEventListener('click', function (event) {
    if (
      toggle.getAttribute('aria-expanded') === 'true' &&
      !toggle.contains(event.target) &&
      !menu.contains(event.target)
    ) {
      setMenu(false);
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > REFLOW_BREAKPOINT) setMenu(false);
  });
})();
