# Apogee — landing page

A static HTML / CSS / vanilla-JavaScript implementation of the supplied Figma
files (`Untitled_5.fig`, `Untitled_12.fig`). No frameworks, no build step — open `index.html`, or
serve the folder with any static server:

```bash
python3 -m http.server 8000
```

## Source of truth

The `.fig` file was unpacked and its `canvas.fig` payload (Kiwi binary schema +
zstd-compressed node data) was decoded, so every value below comes from the
design data itself rather than from a screenshot.

Each file holds one **1644 × 1033** website frame with a 42px corner radius,
wrapped in a `Dribbble shot HD` presentation box. That wrapper — and the
photographer credit labels on it — are presentation furniture and are not part
of the site, so only the inner frame is built. Both files also carry the site
header inside the frame; it is implemented once, at page level.

Neither file defines tablet or mobile frames, or any prototype interaction.

| Section | Source | Frame |
| --- | --- | --- |
| Hero | `Untitled_5.fig` | photo cropped at `-35, -2037`, warm radial glow, headline stack |
| Platform | `Untitled_12.fig` | same photo cropped at `-71, -654` (the red sun), no glow, product window |

## Hero values taken from the design

| Element | Value |
| --- | --- |
| Artboard | 1644 × 1033, radius 42, base fill `#080A19` |
| Background photo | 1787 × 3188 at `-35, -2037` |
| Glow overlay | radial gradient, ellipse `109.987% × 112.486%` at `50% 0%`, stops `rgba(247,127,113,0) 66.43%` → `rgba(247,127,113,.5) 84.06%` → `#FF503C 100%` |
| Header | `35, 29`, 1571 × 52 |
| Nav pill | `616.5, 0`, 343 × 52, radius 11, `rgba(10,7,7,.35)`, 24px padding, 30px gap |
| Actions pill | `1345, 0`, 226 × 52, radius 13, `rgba(0,0,0,.35)`, 3px padding, 5px gap |
| Login / Book a demo | 84 × 46 and 131 × 46, radius 11, `#E9E9E9` / `#0A0707` |
| Hero stack | `441, 556`, 763 wide, vertical auto-layout, 30px gap, centred |
| "Backed by" pill | 198.64 × 43.72, radius 5, `rgba(0,0,0,.3)`, background blur 29.2 |
| Headline | 90px, line height 0.95, tracking −6%, centred, 3 explicit lines |
| Sub-copy | 20px, line height 1.2, tracking −2%, 423px wide, 80% white |

Two details from the design that are easy to lose in translation are handled
explicitly in `css/style.css`:

* Figma renders the headline's 85.5px line advance at **85px**, so the three
  lines occupy exactly 255px.
* The source headline string carries a space before each `U+2028` line
  separator, and Figma counts those spaces when centring each line. They are
  preserved as `&nbsp;` in the markup, and the block is offset by half the
  tracking because browsers — unlike Figma — also add the negative letter-space
  after the last glyph of every line.

The Figma background-blur radius of 29.2 corresponds to `backdrop-filter:
blur(14.6px)`; this was confirmed by sweeping values against the design's own
render.

## Platform section values

| Element | Value |
| --- | --- |
| Content group | `372, 215`, 901 × 943 — deliberately taller than the frame, so the product window is cropped by its foot |
| "Live Data Stream" pill | 138 × 36, radius 6, `rgba(10,7,7,.35)`, 12/16 padding, 4px dot |
| Heading | 48px, line height 0.95 (46px advance), tracking −6%, 469px wide, 3 lines |
| Product window | 901 × 680 at `0, 263`; surface `rgba(17,16,15,.35)`, radius 7, background blur 98.5 |
| Browser toolbar | 899.24 × 37.23, `#191C1F`, address bar `#0C0F12` radius 4.215 |
| Product nav | 901 × 29 at `0, 48`, hairline at 20% with a full-strength 102px active run |
| Cards | 282 × 247 and 426 × 247, radius 23, `rgba(17,16,15,.35)` |

The charts are generated from the design's own primitives rather than redrawn:
the revenue sparkline is its 62 line elements (32 at full strength, the rest at
10%) plus five grid rules, the lead-performance grid is its 84 dots in the
exact white / `#3E332F` pattern, and the sales columns keep their 2px caps and
single highlighted bar.

One deliberate departure: the design stops the window surface at 627px because
the frame crops it long before that, which leaves the lower cards floating on
displays tall enough to show the window's foot. The surface is carried down to
the full 680px instead. Nothing changes at the design's own proportions.

## Assets

Everything is extracted from the `.fig` file — nothing is substituted with a
generic icon set.

* `assets/images/hero-rocket.png` — the original embedded photograph.
* `assets/svg/apogee-mark.svg` — the wordmark glyph, decoded from the
  `BOOLEAN_OPERATION` fill geometry in the file.
* `assets/svg/y-combinator.svg` — the "Backed by" logo, likewise decoded from
  the file's vector geometry (a white plate with the Y knocked out, exactly as
  the design composes it).
* `assets/svg/favicon.svg` — the site icon, built from the same mark.
* The `Platform` chevron is inlined in `index.html` so it can inherit the link
  colour on hover; its path is the design's own geometry.
* `assets/svg/dashboard/` — the browser chrome glyphs and product nav icons,
  decoded from the file's vector geometry, plus the three charts generated
  from the design's line, dot and bar data.
* `assets/images/avatar-jane.jpg` — the embedded avatar.

## Fonts

| Design | Used here | Notes |
| --- | --- | --- |
| STIX Two Math Regular | **STIX Two Math** | The exact family, self-hosted from Google Fonts. |
| Suisse Intl Book (450) | Switzer Variable @ 450 | Suisse Intl is a licensed retail font. Switzer is the closest freely available neo-grotesque; rendered widths land within ~2–4% of the design's measurements. |
| Aeonik Regular | General Sans 400 | Aeonik is likewise a licensed font; used only by the "Backed by:" label, whose box is pinned to the design's 69px width so the pill geometry stays exact. |
| Inter Regular | **Inter** | The exact family, latin subset. Used only by the browser address bar inside the product window. |

All four are self-hosted in `assets/fonts/` as WOFF2.

## Motion

The two frames are two framings of the *same* photograph — the hero crops it at
`-35, -2037`, the platform frame at `-71, -654` — so the move between them is
one continuous camera travel, not a crossfade between two pictures. The page is
built around that: a single pinned scene holds one photo layer, and scroll
progress drives one timeline.

* `.scene` is `100svh + --scene-travel` tall; `.scene__viewport` sticks to the
  top for its duration.
* `js/script.js` writes a progress value and a handful of custom properties;
  CSS does the rest. Each element is a *track* with its own window and easing,
  so nothing is a hard-coded pair of keyframes.
* Scroll supplies the *target*; what renders eases toward it, frame-rate
  independently. Mapping the timeline straight onto `scrollY` looks right in a
  slow drag but collapses on a flick — one wheel gesture can cover the whole
  scene in a single frame, which reads as no animation at all. With damping a
  hard flick still plays the move out over about a second, and a deliberate
  scroll stays in step. It snaps when it is within 0.0004 of the target, so
  both ends stay pixel-exact.
* At progress 0 the stage is the hero frame exactly; at progress 1 it is the
  platform frame exactly. Both were re-verified pixel-for-pixel after the
  animation was added.

The timings come from tracking the reference animation frame by frame — the
photograph's offset and scale were solved per frame against the source image,
and each element's opacity and position were measured — then normalised onto
the scroll timeline:

| Track | Window | Behaviour |
| --- | --- | --- |
| camera pan | 0 → 0.86, linear | measured 0.447 of the way at 0.377 of the timeline, against 0.444 for a straight line; it lands the framing before the content settles, then holds |
| camera push-in | peaks mid-travel | the reference is at 1.108x at that same point |
| hero copy out | 0.295 → 0.365 | holds at full strength while the camera climbs, then goes in about a fifth of a second — with a ~10px upward drift, which its bounding box shows |
| glow out | 0.55 → 0.95 | see the note below |
| platform frame in | 0.557 → 0.623 | fades up early in its rise |
| pill + heading up | 0.563 → 0.967, ease-out quart | **638px** — they hold a constant 78px gap through the whole move, so they are one block |
| product window up | 0.557 → 0.984, ease-out cubic | **555px** |

The two travel distances are not a rounding difference: tracking the heading's
ink and the window's top edge frame by frame gives 638px against 555px on
different curves. That parallax is what gives the arrival its depth, and
moving them as one block — which is what an earlier pass did — flattens it.

The opening is a separate, load-time timeline in CSS, also measured element by
element:

| Element | Behaviour |
| --- | --- |
| header | fades in over 0.35s, no movement |
| headline lines | **uncovered, not moved**: each line slides up 100% inside a clip, 0.9s, 0.13s apart. In the reference each line's ink grows upward from a pinned bottom edge — line 1 holds at y 718 while its top climbs 700 → 642 — which is a mask, not a translate |
| badge, sub-copy | fade only. Their bounding boxes are fixed from the first frame they appear (the sub-copy sits at 922-958 throughout), so nothing moves |

The clip uses `clip-path` rather than `overflow`, so the line boxes keep their
exact layout; it is left open at the top for ascenders and closed just below
the baseline, where the reference's mask sits. The opening animates the
elements *inside* `.hero__content` while scroll drives the container, so the
two never contend for the same property. It is skipped if the page loads
part-scrolled.

**Two deliberate differences from the reference**, both for the same reason —
the reference does not end on the platform frame's own design, and section two
has to.

* Its camera keeps zooming past that frame, resting at about 1.65x with a much
  larger sun than `Untitled_12.fig` shows. The travel resolves onto the Figma
  frame instead and the push-in returns to 1.
* Its warm wash never fades — measured at the bottom corners it holds the same
  saturation from the hero right through to the last frame — but the platform
  frame has the wash hidden. It is carried through the move and resolved late
  (0.55 → 0.95) rather than dropped early.

Everything up to those resolutions follows the reference. If the video's ending
is what you want instead, both are small changes in `js/script.js`.

## Layout architecture

The header is fixed, which is how both design frames show it. Further sections
follow the scene in normal document flow.

Everything is driven by two fluid units declared in `:root`. Both equal exactly
`1px` at the design's 1644px reference width — so at that width the page
reproduces the Figma frame — and scale with the viewport either side of it:

| Unit | Drives | Range |
| --- | --- | --- |
| `--u-ui` | header, nav, buttons, badge | clamped 0.93 → 1.15, so 14px labels stay legible on a 1280 laptop and don't balloon on a 2560 display |
| `--u-hero` | hero headline, sub-copy, measure, gaps | clamped 0.74 → 1.30, tracking the viewport almost exactly so the poster keeps the design's proportions |
| `--u-shot` | the whole platform composition | `min(width, height)` fit, clamped 0.62 → 1.45 |

Motion state travels the same way: `--p`, `--cam-x/y/z`, `--glow-o`, `--hero-o`,
`--plat-o` and `--plat-p` are the only values JavaScript writes.

`--u-shot` is deliberately a *contain* fit rather than a width fit. The product
window is cropped by the foot of its frame by design, and only a fit that
respects height as well keeps that crop identical: 81.6% of the window shows at
every 16:9 size, exactly as in Figma. A width-only fit would swallow the lower
cards on the 16:9 displays that most laptops use. On viewports squarer than the
design, more of the window shows — never less.

Every dimension is then written as the design's own number, e.g.
`font-size: calc(90 * var(--u-hero))` — the Figma values stay readable in the
source. Tracking and the headline's optical offset are expressed in `em`, so
they scale with the type automatically.

The photograph is sized `max(108.699%, 172.95svh)` — the two ways the design
expresses the same crop, relative to the frame's width and to its height.
Taking the larger keeps the design's framing on wide displays and zooms in,
rather than revealing more of the image, on squarer ones. The glow's radii are
percentages of the hero box, so the wash follows the viewport.

The source frame is a rounded presentation artboard. The hero renders
full-bleed because it is now a page section rather than a shot; setting
`--hero-inset: 12px` and `--hero-radius: 42px` in `:root` restores the inset,
rounded card.

At 900px the desktop header reaches its first genuine compression point: the
centred navigation pill and right-side actions no longer retain a comfortable
gap. Below that content-derived breakpoint, the header uses its toggle menu and
the scene adopts a tablet architecture. Portrait/square tablets keep the
signal, statement and product in narrative order with the dashboard scaled by
both available width and height. The statement remains above the complete
dashboard at every tablet aspect ratio, with the product scaled to keep every
card visible without shrinking the UI more than the available height requires.
The same HTML, assets and animation tracks serve the responsive architecture.

## Verification

The implementation was rendered in Chromium and compared numerically against
the design's own 1644 × 1033 render. At that reference size every element
(header, nav, buttons, hero stack, badge, headline, sub-copy) lands within a
pixel of its Figma coordinates, and the mean per-pixel difference over the
whole frame is ~1%, accounted for by text antialiasing and image resampling.

The animation was verified against the reference frame by frame, and both
endpoints re-checked after it was added: the hero still matches the Figma
render to ~1% and the platform frame is within antialiasing noise of its
pre-animation render.

Both sections were then checked at 2560×1440, 1920×1080, 1728×1117, 1680×1050,
1644×1033, 1600×900, 1512×982, 1440×900, 1366×768, 1280×1024, 1280×800,
1280×720, 1152×720 and 1024×768. At every one:

* each section occupies exactly one viewport height, with no horizontal scroll;
* the photograph covers its section on all four edges;
* the platform content starts at 20.81% of the section height, matching Figma;
* the product window shows 81.6% of its height on 16:9 displays, as designed;
* progress reaches exactly 0 and exactly 1 at the ends of the scene;
* the console is clean.

`prefers-reduced-motion` drops the opening and the push-in and shortens the
scene; the camera itself stays, since it is driven by the reader rather than
playing on its own.
