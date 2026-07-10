# Tungsten — Portfolio Redesign Design Spec

**Date:** 2026-07-11
**Status:** Approved by Saurav (brainstorm session, visual companion mockups)
**Supersedes:** "EVENT HORIZON" (uncommitted build on `version2`)

## 1. Summary

Complete redesign of sauravscode's personal portfolio. The site reads as a
**software/infrastructure engineer's portfolio first**, with Photography and
Books as two well-crafted passion pages alongside the professional core.

Aesthetic: **dark, moody, cinematic** — engineering precision meets
night-photography atmosphere. Grandeur comes from lighting, negative space,
and typographic hierarchy, not decoration. This is a deliberate, user-confirmed
pivot away from the maximalist sci-fi direction of EVENT HORIZON: the WebGL
black hole, ship console, HUD, boot sequence, and audio are all removed.

Direction chosen from three mockups: **"Tungsten — the darkroom print"**
(over "Meridian — the instrument" and "Nocturne — the long exposure").

## 2. Decisions (user-confirmed)

| Question | Decision |
|---|---|
| Restraint vs maximalism | Full pivot to cinematic restraint; drop all sci-fi chrome |
| Site structure | Multi-page: home + `/photography/` + `/books/` |
| Photography content | Real photos exist (~10–30, Nikon Z50 II); user uploads to Cloudinary during/after implementation; graceful placeholders until then |
| Professional content | Keep exactly what's in `data.js` today, re-presented; no new claims |
| Stack | Zero-build vanilla HTML/CSS/JS; content stays in `data.js` |
| Design direction | Tungsten (Fraunces serif, tungsten-amber accent, EXIF marginalia) |
| Photography layout | "Plates" — exhibition-style centred column |
| Books layout | "Marginalia" — annotated editorial list |

## 3. Architecture

```
portfolio/
├── index.html              home — professional portfolio
├── photography/index.html  plates gallery + lightbox
├── books/index.html        marginalia reading list
├── css/styles.css          entire design system, one sectioned file
├── js/
│   ├── data.js             single source of truth (same contract, small additions)
│   └── app.js              shared renderer + motion; per-page hooks
└── README.md               rewritten for the new site
```

- **Deleted:** `js/space.js` (WebGL shader) and every EVENT HORIZON subsystem.
- **Rendering model unchanged:** each page is a semantic HTML shell; `app.js`
  fills it from `window.DATA`. The README's "one rule" (edit `data.js` only)
  survives.
- `app.js` detects the page via `<body data-page="home|photography|books">`
  and runs the matching render function plus the shared chrome (header, footer,
  reveals).
- Clean URLs via directory-style pages (`/photography/`, `/books/`). Pages in
  subdirectories reference assets with relative paths (`../css/styles.css`) so
  the site works from any static root — GitHub Pages or Netlify, no config.
- **Security posture kept:** strict CSP meta tag on every page
  (`script-src 'self'`; images self + data: + res.cloudinary.com; fonts from
  Google Fonts), no `innerHTML` for data, `rel="noopener noreferrer"` outbound.

### data.js contract changes

Shape stays as today, with:

1. `photography.photos[]` gains optional `exif` string
   (e.g. `"24mm · f/8 · 1/60 · ISO 100"`), rendered right-aligned under the plate.
2. `reading.finished[]` gains optional `year` (number) for future grouping;
   rendering works with or without it.
3. Remove `hero.eyebrow` free-text in favour of the EXIF-style eyebrow built
   from `site` fields (location + coordinates); keep `hero.statement`,
   `hero.deck`, `hero.quote` (now the footer epigraph).
4. Placeholders the user must fill (unchanged from today, still open):
   `photography.cloudName`, real Instagram URL (`site.socials.instagram`,
   `photography.instagram`), verify LinkedIn URL.

## 4. Visual system — "Tungsten"

### Color

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0B0A08` | page base (warm near-black) |
| `--bg-raised` | `#12100D` | panels, lightbox chrome |
| `--text` | `#EDE7DC` | primary text (warm off-white) |
| `--text-dim` | `#8A8478` | secondary text (5.2:1 on bg) |
| `--accent` | `#E09236` | tungsten amber — links, labels, rules (7.7:1 on bg) |
| `--accent-bright` | `#F2B25C` | hover states |
| `--hairline` | `rgba(237,231,220,.08)` | rules, borders |

One accent only. The only gradients are **light**: each page has a single
fixed, soft radial glow low in the frame (CSS `radial-gradient`, amber at
~25% alpha fading to transparent) — the "distant sodium streetlight". A static
film-grain overlay (inline SVG `feTurbulence` noise as data URI, ~4% opacity,
no animation) sits over the whole page.

### Typography

- **Fraunces** (Google Fonts, variable: optical size 9–144, weights 300–500,
  italic) — display: hero statement, section titles, book titles, pull-quotes,
  the Clarke epigraph.
- **IBM Plex Sans** 300/400/500 — all body copy.
- **JetBrains Mono** 400/500 — the "precision layer": nav, tracked-wide
  uppercase labels, coordinates, EXIF, statuses, tags, field log, colophon.
- Scale: hero display `clamp(3rem, 8vw, 7rem)`, section titles
  `clamp(2rem, 4vw, 3.25rem)`, body `1rem/1.7`, mono labels `0.6875rem` with
  `letter-spacing: .14em`.

### The signature move

Engineering precision appears as **marginalia**: mono annotations in the
margins of a serif, photographic world — coordinates under the nav, f-stops
under photographs, `IN PRODUCTION` beside k8tre, tags beside books. Never
decoration for its own sake; every annotation is true content.

### Motion (complete list)

1. Scroll reveals: opacity 0→1 + 12px rise, ~700ms ease-out, staggered ~80ms,
   via one IntersectionObserver.
2. Hero glow parallax: glow translates slightly (~6%) against scroll. Hero only.
3. Link underline sweeps and accent color transitions (~200ms).
4. Image blur-up: Cloudinary low-res placeholder → sharp fade.

Nothing else. `prefers-reduced-motion: reduce` disables reveals (content
visible immediately), parallax, and blur-up animation.

## 5. Pages

### 5.1 Home (`index.html`)

Top to bottom:

1. **Header** (shared on all pages): name + role left; nav right —
   `Work · Photography · Books · Contact` (Work/Contact are same-page anchors;
   Photography/Books are pages); small mono Leeds clock (IANA timezone from
   `site.timezone`). Mobile: nav collapses to an accessible toggle.
2. **Hero:** mono eyebrow built from site data
   (`LEEDS, UK · 53.8008°N 1.5491°W`), Fraunces statement from
   `hero.statement` with the `{{ }}` phrase in amber italic, then `hero.deck`
   as a short readable paragraph. Ambient glow low-left.
3. **Selected Systems** (`work[]`): k8tre (the `featured` entry) renders
   large — tagline, description, mono manifest (Status/Scope/Delivery/
   Compliance), stack list, repository link. Remaining three render as ruled
   index rows: mono index number, name + tagline, year, mono status; row
   expands nothing — links go straight to the repo.
4. **About** (`about`): the three paragraphs, with the field log (`notes[]`)
   as a mono sidebar list on desktop, stacked below on mobile.
5. **Doorways:** two full-width link bands — Photography (dark band using the
   first gallery image, amber caption, "Deep Field — N plates") and Books
   (serif band quoting the top in-progress note, "The Archive — N volumes").
6. **Contact** (`site`): large serif "Let's build something that stays up.",
   email as the primary action, then GitHub / LinkedIn / Instagram mono links.
7. **Epigraph + footer:** the Clarke quote as a small Fraunces italic line
   with attribution — a whisper, not the centrepiece — above a one-line mono
   colophon (name, coordinates, year).

### 5.2 Photography (`photography/index.html`)

- Page header: serif title (e.g. "Deep Field"), mono subline: plate count,
  camera (`photography.gear`), themes.
- **Plates:** centred column (~720–880px). Landscape/square images one per
  row; two consecutive portrait images may pair side by side. Under each:
  `PLATE 01 — CAPTION` (mono, left) and optional EXIF (mono, dim, right).
- **Lightbox:** click/Enter opens; arrows/Esc + buttons; shows image, caption,
  EXIF. Focus is trapped while open and returns to the opening plate on close.
- **Images:** Cloudinary `f_auto,q_auto` responsive `srcset`, blur-up
  placeholder, `width/height` reserved from `ratio` (zero layout shift),
  `loading="lazy"` below the fold.
- **Placeholder state:** while `cloudName` is unset or an image fails, the
  plate renders as a hairline-ruled box with the caption — restrained, no
  fake sci-fi copy.
- Footer of page: Instagram link.

### 5.3 Books (`books/index.html`)

- Page header: serif title (e.g. "The Archive"), mono subline
  ("A shelf, not a table · N volumes").
- **In progress:** each book gets room — serif title, author, mono tag, and
  the personal `note` as an italic pull-quote with an amber left rule.
- **Finished:** compressed ruled lines — serif title + author inline, mono tag
  right. Optional `note` renders as the same italic quote, smaller. If `year`
  is present on entries, group by year descending; otherwise one list.

## 6. Removed from EVENT HORIZON

WebGL black hole (`space.js`), boot sequence, ship console (⌘K), telemetry
HUD, route map, generative audio, decode-scramble titles, cursor
reticle/comet trail, motes/meteors, scanlines, animated grain, konami code,
warp transitions, `?still=1` test hook (no longer needed — pages are static
by default). `index.html`, `styles.css`, and `app.js` are rewritten, not
edited.

## 7. Resilience, accessibility, performance

- **No JS:** `<noscript>` notice with the email address on every page.
- **Image failure / Cloudinary unset:** caption-only placeholder plates.
- **Accessibility:** semantic landmarks; skip link; keyboard-operable nav
  toggle and lightbox (focus trap, Esc, arrows); visible focus styles; alt
  text from captions; WCAG AA contrast verified for all token pairs;
  `prefers-reduced-motion` respected.
- **Performance:** no framework, no build; three font families subset via
  Google Fonts `display=swap`; critical inline style paints the dark base
  instantly; lazy responsive images with reserved ratios; static grain (no
  animation loops, no canvas); target Lighthouse ≥95 performance/accessibility
  on all three pages.

## 8. Verification

1. `python3 -m http.server` — walk all three pages at 1440px, 768px, 375px.
2. Keyboard-only pass: tab order, skip link, nav toggle, lightbox.
3. Reduced-motion pass (`prefers-reduced-motion` emulation).
4. No-JS pass (noscript visible, page doesn't render broken chrome).
5. Placeholder pass: `cloudName` unset → plates degrade gracefully.
6. Contrast spot-checks with devtools on token pairs.

## 9. Open items for Saurav (not blockers)

- Create Cloudinary account / set `photography.cloudName`; upload photos and
  replace the placeholder `publicId`s; add real captions + optional `exif`.
- Real Instagram URL; verify LinkedIn URL.
- Optional: `year` values for finished books.
