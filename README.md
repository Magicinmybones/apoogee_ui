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

## Layout architecture

The page is a normal stack of sections, not a scaled artboard. The hero is a
`min-height: 100svh` section, so it always occupies exactly one viewport with
nothing below the fold, and further sections append after it in document flow.
The header is absolutely positioned over the hero and is ready to be made
sticky once there is a scrolled state to design against.

Everything is driven by two fluid units declared in `:root`. Both equal exactly
`1px` at the design's 1644px reference width — so at that width the page
reproduces the Figma frame — and scale with the viewport either side of it:

| Unit | Drives | Range |
| --- | --- | --- |
| `--u-ui` | header, nav, buttons, badge | clamped 0.93 → 1.15, so 14px labels stay legible on a 1280 laptop and don't balloon on a 2560 display |
| `--u-hero` | hero headline, sub-copy, measure, gaps | clamped 0.74 → 1.30, tracking the viewport almost exactly so the poster keeps the design's proportions |
| `--u-shot` | the whole platform composition | `min(width, height)` fit, clamped 0.62 → 1.45 |

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

Tablet and phone layouts are not designed yet — below 900px the page falls back
to a single-column reflow with a toggle menu so it stays usable.

## Verification

The implementation was rendered in Chromium and compared numerically against
the design's own 1644 × 1033 render. At that reference size every element
(header, nav, buttons, hero stack, badge, headline, sub-copy) lands within a
pixel of its Figma coordinates, and the mean per-pixel difference over the
whole frame is ~1%, accounted for by text antialiasing and image resampling.

Both sections were then checked at 2560×1440, 1920×1080, 1728×1117, 1680×1050,
1644×1033, 1600×900, 1512×982, 1440×900, 1366×768, 1280×1024, 1280×800,
1280×720, 1152×720 and 1024×768. At every one:

* each section occupies exactly one viewport height, with no horizontal scroll;
* the photograph covers its section on all four edges;
* the platform content starts at 20.81% of the section height, matching Figma;
* the product window shows 81.6% of its height on 16:9 displays, as designed;
* the console is clean.
