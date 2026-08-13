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

     Both framings place the same image at the same width, so the move is a
     travel between the two design values — but not a straight one. Solving
     the photograph's scale and offset against the source image, frame by
     frame through the reference, gives a launch rather than a glide: the
     frame punches in to 1.30 just as the copy starts to go, then eases back
     to about 1.11 while the pan, which had barely moved, rushes from a
     quarter of the way to nearly two thirds in a fifth of a second.

     That surge is most of what the moment reads as, and a push-in that peaks
     mid-travel cannot produce it — worse, it cancels the pan exactly where
     the reference is moving fastest, which leaves the frame looking frozen
     behind the departing copy.

     The tables are that solved path. PAN is a fraction of the hero ->
     platform travel, ZOOM a scale about the centre of the frame; both are
     anchored so p = 0 and p >= 0.86 land on the two designs exactly. Past
     about 0.48 the reference stops panning and keeps zooming on past the
     platform framing, so from there these resolve onto the design instead.
     ------------------------------------------------------------------ */
  var CAM = {
    from: { x: -47.957, y: -80.097 },   /* hero frame:     photo at -35, -2037 */
    to:   { x: -50.0,   y: -36.716 }    /* platform frame: photo at -71,  -654 */
  };

  var CAM_PAN = [
    [0.000, 0.000], [0.090, 0.035], [0.160, 0.063], [0.220, 0.119],
    [0.260, 0.159], [0.289, 0.244], [0.321, 0.268], [0.354, 0.368],
    [0.371, 0.421], [0.387, 0.479], [0.420, 0.564], [0.436, 0.597],
    [0.480, 0.630], [0.600, 0.662], [0.700, 0.780], [0.780, 0.900],
    [0.860, 1.000]
  ];

  var CAM_ZOOM = [
    [0.000, 1.000], [0.090, 1.000], [0.160, 1.035], [0.220, 1.057],
    [0.260, 1.071], [0.289, 1.227], [0.305, 1.293], [0.321, 1.300],
    [0.338, 1.244], [0.354, 1.192], [0.371, 1.129], [0.387, 1.108],
    [0.436, 1.129], [0.550, 1.180], [0.700, 1.090], [0.860, 1.000]
  ];

  /* Smoothstep between knots so the joins have no velocity step. */
  function tableAt(table, p) {
    var last = table.length - 1;
    if (p <= table[0][0]) return table[0][1];
    if (p >= table[last][0]) return table[last][1];
    for (var i = 1; i <= last; i++) {
      if (p <= table[i][0]) {
        var a = table[i - 1], b = table[i];
        var u = (p - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * u * u * (3 - 2 * u);
      }
    }
    return table[last][1];
  }

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
       easing on it would just read as lag. Its shape comes from the solved
       path, not from an ease. Secondary tracks are eased. */
    var pan = tableAt(CAM_PAN, p);

    root.style.setProperty('--p', p.toFixed(4));
    root.style.setProperty('--cam-x', lerp(CAM.from.x, CAM.to.x, pan).toFixed(4) + '%');
    root.style.setProperty('--cam-y', lerp(CAM.from.y, CAM.to.y, pan).toFixed(4) + '%');
    root.style.setProperty('--cam-z',
      (reduced ? 1 : tableAt(CAM_ZOOM, p)).toFixed(4));

    root.style.setProperty('--glow-o', (1 - track(p, T.glowOut[0], T.glowOut[1], T.glowOut[2])).toFixed(3));

    var exit = track(p, T.heroOut[0], T.heroOut[1]);
    var blur = HERO_EXIT.blur * Math.pow(exit, HERO_EXIT.blurPow);
    root.style.setProperty('--hero-out', Math.pow(exit, HERO_EXIT.risePow).toFixed(4));
    root.style.setProperty('--hero-o', Math.pow(
      1 - clamp01((exit - HERO_EXIT.fadeFrom) / (1 - HERO_EXIT.fadeFrom)),
      HERO_EXIT.fadePow).toFixed(3));
    /* `none` rather than blur(0) so nothing is rasterised through a filter
       while the hero is at rest. */
    root.style.setProperty('--hero-filter', exit > 0
      ? 'blur(calc(' + blur.toFixed(3) + ' * var(--u-hero)))'
      : 'none');
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
  }

  /* ------------------------------------------------------------------
     Scroll binding

     Scroll gives the *target*; what gets rendered eases toward it. Mapping
     the timeline straight onto scrollY looks correct in a slow drag but
     collapses on a flick — a single wheel gesture can jump the whole scene in
     one frame, which reads as no animation at all. Damping means a flick still
     plays the move out, while a deliberate scroll stays in step.

     The step is frame-rate independent: an exponential approach to the target
     over real elapsed time, so it behaves the same at 60Hz and 120Hz.
     ------------------------------------------------------------------ */
  var SETTLE = 5.5;      /* approach rate, per second */
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
      current += (target - current) * (1 - Math.exp(-SETTLE * dt));
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
