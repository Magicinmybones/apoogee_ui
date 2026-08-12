# Apogee — hero landing page

A static HTML / CSS / vanilla-JavaScript implementation of the supplied Figma
file (`Untitled_5.fig`). No frameworks, no build step — open `index.html`, or
serve the folder with any static server:

```bash
python3 -m http.server 8000
```

## Source of truth

The `.fig` file was unpacked and its `canvas.fig` payload (Kiwi binary schema +
zstd-compressed node data) was decoded, so every value below comes from the
design data itself rather than from a screenshot.

The document contains one visible artboard — a **1644 × 1033** frame with a
42px corner radius. The only other top-level frame (`Dribbble shot HD - 91`,
a presentation mock-up wrapping the same artboard) is hidden in the file, as is
the analytics-dashboard group inside the artboard. There are no tablet or
mobile frames and no prototype interactions defined.

## Layout values taken from the design

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

## Fonts

| Design | Used here | Notes |
| --- | --- | --- |
| STIX Two Math Regular | **STIX Two Math** | The exact family, self-hosted from Google Fonts. |
| Suisse Intl Book (450) | Switzer Variable @ 450 | Suisse Intl is a licensed retail font. Switzer is the closest freely available neo-grotesque; rendered widths land within ~2–4% of the design's measurements. |
| Aeonik Regular | General Sans 400 | Aeonik is likewise a licensed font; used only by the "Backed by:" label, whose box is pinned to the design's 69px width so the pill geometry stays exact. |

All three are self-hosted in `assets/fonts/` as WOFF2.

## Responsive behaviour

The file only ships a desktop frame, so:

* **≥ 1644px** — the artboard renders at native size, centred.
* **900 – 1644px** — the whole artboard is scaled proportionally (`transform:
  scale()`, driven by a few lines in `js/script.js`), so every proportion,
  spacing value and line break stays exactly as designed.
* **< 900px** — the same components reflow into a single column. Colours,
  type, radii, the gradient and the photograph's framing are unchanged; the
  nav and action pills collapse into a toggle menu built from the design's own
  surfaces. Nothing is redesigned or added beyond that control.

## Verification

The implementation was rendered in Chromium and compared numerically against
the design's own 1644 × 1033 render. Element geometry (header, nav, buttons,
hero stack, badge, headline, sub-copy) matches the Figma coordinates exactly,
and the mean per-pixel difference over the whole frame is ~1%, accounted for by
text antialiasing and image resampling.
