# Spec — "GALLERY": a simple, grand, image-led portfolio

Status: **APPROVED 2026-11-20 — in progress** (owner changes: panel renamed from "Engineering"; Clarke quote kept inside Work)
Branch: `version2` (starting HEAD `62ce919`, the UPTIME build). Replaces UPTIME (`docs/specs/status-page-rebuild.md`), which the owner rejected.
Owner edits to preserve (never stage or modify unless named below): `.claude/settings.json`, the "Claude and DeepSeek workflow"
section of `README.md`, `.claude/skills/`, `docs/dual-agent.md`, `scripts/pi-worker`. `scripts/smoke-portfolio.py` is changed **only** in M4,
with owner approval (see §8).

## 1. Goal

A very simple, elegant site that shows grandeur through the owner's own photographs, not through UI. Reference:
mariasoc.com. Its pattern is a small serif wordmark and light nav, one letter-spaced tagline, tall full-bleed image panels each with a
large serif title and a tiny letter-spaced caption, and almost no other text. Our version opens with one full-screen photograph and the
name set large (the "grandeur moment"). Below it sit three tall image panels. No project-by-project detail anywhere.

Design rules: dark, gallery-like. Photos are the only colour. Type does the rest. No cards, badges, pills, chips, metrics, status
metaphors, terminal styling, icons-as-decoration, or gradients except a legibility scrim over photos. If an element doesn't help someone
see the photos or reach Saurav, it doesn't ship.

## 2. Decisions (from the interview, 2026-11-20)

| Topic | Decision |
|---|---|
| Home | Full-screen hero photo with the name, then 3 tall image panels |
| Pages | Home `/`, Photography `/photography/`, About `/about/`. The reading list (`/books/`) is removed. |
| Images | **Cloudinary.** The owner uploads originals in Cloudinary's web UI and pastes each image's *public ID* into `js/data.js`. The site builds responsive `f_auto,q_auto` URLs (AVIF/WebP) at the right width. No image binaries in git. |
| Mood | Dark gallery: near-black ground, ivory serif type |

Why Cloudinary rather than committing images to GitHub: full-screen photos need 2000–3000px sources, but phones should get ~800px versions.
Cloudinary does that resizing and format negotiation per request, for free, without bloating the repo or needing a build step. Updating a
photo means uploading it and changing one string. The free tier (25 credits/month) is far beyond a personal portfolio's traffic. Escape
hatch: any `publicId` that is a full `https://` URL or a root-relative path (`/images/x.jpg`) is used as-is, so a committed image still works.

## 3. Visual system

- **Type:** *Cormorant Garamond* (300/400, italic 300) for display (name, panel titles, page titles, large statements); *DM Mono* 400 for the
  tiny letter-spaced uppercase captions and nav (letter-spacing 0.18–0.24em, 11–12px). Body text is Cormorant Garamond 400 at 20–22px. Two families
  only, one Google Fonts request with `display=swap`.
- **Colour tokens:** `--ground #0B0B0A`, `--ink #ECE6DA` (ivory), `--muted #A8A196` (≥ 6:1 on ground), `--line rgba(236,230,218,.14)`.
  The whole site is dark. No light theme, no toggle (`js/theme.js` removed).
- **Scale:** hero name `clamp(3.5rem, 11vw, 10rem)` weight 300, tight tracking (-0.01em). Panel titles `clamp(2rem, 3.6vw, 3.25rem)`.
- **Photos over text:** a bottom-up scrim `linear-gradient(to top, rgba(0,0,0,.55), transparent 55%)` only where text sits on a photo;
  text contrast over the scrim should be ≥ 4.5:1 for typical photos.
- **Motion (restrained):** the hero image fades in over 1.2s once loaded; panel photos ease to `scale(1.04)` over 1.2s on hover/focus; content fades up
  on scroll (≤ 600ms). Nothing else. Everything is off under `prefers-reduced-motion`.
- **Layout:** full-bleed images. Text column max 640px for About. Generous whitespace; 16px minimum side gutter on phones.

## 4. Data model (`js/data.js`, rewritten, simple, heavily commented for the owner)

```js
const DATA = {
  site: { name, tagline /* "Engineer · Photographer" */, email, location /* "Leeds, UK" */,
          socials: { github, linkedin, instagram /* picsxarchive */ } },
  cloudinary: { cloudName: "your-cloud-name" },     // ← one-time setup
  hero: { image: { publicId, alt, focus /* optional CSS object-position e.g. "50% 35%" */ } },
  panels: [  // exactly the home panels, in order
    { title: "Foundations", caption: "The quiet infrastructure behind NHS research", href: "about/#work", image: {publicId, alt} },
    { title: "Photography", caption: "Landscape, architecture and light",          href: "photography/",  image: {publicId, alt} },
    { title: "Contact",     caption: "Say hello",                                   href: "about/#contact", image: {publicId, alt} }
  ],
  about: { image: {publicId, alt}, paragraphs: [ /* 2 short paragraphs, trimmed from the current text */ ],
           now: "Software & Infrastructure Engineer, Lancashire Teaching Hospitals NHS FT" },
  work: { quote: "Any sufficiently advanced technology is indistinguishable from magic.", quoteAuthor: "Arthur C. Clarke",
          text: /* one short paragraph on the work, condensed from the existing k8tre/about text, no project list */ },
  photography: { photos: [ { publicId, ratio, caption, exif? } … ] /* existing 10 entries kept */ }
};
```
Removed: `hero.statement/deck/quote`, `work`, `changelog`, `reading`, `site.status/availability/updated/timezone/coordinates`. The About
paragraphs are condensed from the existing `about.paragraphs` text (same facts, no new claims). The Clarke quote is kept, inside the Work section (owner request).

## 5. Pages and flows

### Shared
- **Header:** wordmark "Saurav Sudhar" (Cormorant 400, ~22px) left, nav right: Photography · About (DM Mono caps). On Home the header is
  transparent, overlaid on the hero. On other pages it sits on the ground colour. Below 640px it stays as two small text links (no hamburger,
  only two items). `aria-current="page"` is set on the current link.
- **Footer:** one quiet line: `© 2026 Saurav Sudhar · Leeds` left; Email · GitHub · LinkedIn · Instagram right (DM Mono caps), plus a "Back to top ↑" link.
- Skip link, `<main id="main">`, `<noscript>` with email + GitHub.

### Home `/`
1. **Hero:** 100svh full-bleed `<img>` (object-fit cover, `object-position` from `focus`) with a scrim. Bottom-left (or centred on phones):
   the name huge in Cormorant 300, the tagline in DM Mono caps beneath. A small "Scroll" cue in DM Mono with a 1px line. The hero image loads eagerly
   with `fetchpriority="high"` and a srcset 800–2560w.
2. **Panels:** three equal columns ≥ 900px, each `min-height: 85vh`, full-bleed photo (Cloudinary `c_fill,g_auto` crop at the panel aspect).
   Bottom-centred serif title plus a caption in mono caps. The whole panel is one link (`<a>`) with `aria-label` "<title> — <caption>". Below 900px
   the panels stack, each 70svh.
3. Footer.

### Photography `/photography/`
- Page title "Photography" (Cormorant 300, large) and a mono caption "<n> photographs · Instagram ↗" (link to picsxarchive).
- An elegant **column masonry**: CSS columns (1 col < 640, 2 cols < 1100, 3 cols ≥ 1100) with 24–32px gutters. Images keep their natural ratio
  (reserved via `ratio`). No captions under the grid images: the caption appears on hover/focus as a fade-in mono line, and always in the lightbox.
- **Lightbox:** reuse the existing accepted focus-trapped dialog (Esc, ← →, Tab trap, focus restore, scroll lock), restyled. The image is
  contained (`max-height: 88vh`), and the caption + exif sit in mono below. Prev/next are thin text buttons "Prev"/"Next", ≥ 44px.
- **Pending state:** when no image can be resolved (cloud name unset), the grid shows a single centred note "Photographs coming soon." instead of
  10 empty frames.

### About `/about/`
- Two columns ≥ 900px: a tall photo (about.image) left at 45% width, text right. Stacked on mobile with the photo first at 60svh.
- Title "About" (large Cormorant), the paragraphs at 20–22px, a mono "NOW" label + `about.now`.
- `#work` section (the Foundations panel lands here): a mono "WORK" label; the Clarke quote set large in Cormorant italic 300
  (`clamp(2rem, 5vw, 3.75rem)`), as a `<figure><blockquote>` + `<figcaption>` "— Arthur C. Clarke" in mono caps; then `work.text` as one
  paragraph. The section is separated by generous whitespace and a hairline. It reads as a pause, not a project list.
- `#contact` block: heading "Contact" (Cormorant), the email as a large link, social links in mono caps.

### Image states (all pages)
- `publicId` empty or `cloudName` unset with no full URL: the image element is not rendered. The hero falls back to the plain ground colour (the
  name still shows, which stays elegant), and panels fall back to a `#151513` tile with the title. No broken-image icons, no "PENDING" labels.
- Image load error: the same fallback.
- `alt` is required in data. A missing alt renders `alt=""` (decorative) for hero and panels, because their titles carry the meaning, and the caption for gallery images.

## 6. Exclusions
- No light theme, theme toggle, status metaphors, project lists, changelog, reading list, or Instagram sync.
- No framework, build step, analytics, or third-party JS.
- No slideshow or autoplay.
- No push or deploy (the owner does that).

## 7. Affected files

| Path | Change |
|---|---|
| `index.html`, `photography/index.html` | rewritten shells |
| `about/index.html` | **new** |
| `books/index.html`, `js/books.js`, `js/theme.js`, `js/photos.js`, `scripts/sync-instagram.py` | **deleted** (`git rm`) |
| `js/core.js` | slimmed: el, safeUrl, extLink, `imageSources(image, opts)` Cloudinary builder, header, footer, reveals |
| `js/app.js` | entry/router for home/photography/about |
| `js/home.js`, `js/photography.js`, `js/about.js` (new) | page renderers |
| `js/data.js` | rewritten per §4 |
| `css/styles.css` | rewritten |
| `README.md` | rewritten above the owner's workflow section, including the "Adding photos" guide |
| `scripts/smoke-portfolio.py` | markers updated for the new routes (M4, needs owner approval) |

CSP (every page, meta): `default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;
img-src 'self' data: https://res.cloudinary.com; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'`. No inline
scripts/styles/`style=`; JS sets styles only through CSSOM. No `innerHTML`. All data URLs go through `safeUrl`.

## 8. Milestones

### M1 — Foundation
Owned: all three HTML shells (new `about/index.html`), `css/styles.css` (tokens, reset, type, header, footer, utilities, reduced motion), `js/core.js`,
`js/app.js`, `js/data.js`, stubs for `js/home.js`/`js/photography.js`/`js/about.js`; deletions listed in §7 (the reviewer runs `git rm`).
Criteria: AC1–AC6.

### M2 — Home (hero + panels)
Owned: `js/home.js`, `css/styles.css` (HOME section), `index.html` if needed. Criteria: AC7–AC11.

### M3 — Photography + About
Owned: `js/photography.js`, `js/about.js`, `css/styles.css` (PHOTOGRAPHY, LIGHTBOX, ABOUT sections), their HTML shells. Criteria: AC12–AC17.

### M4 — Polish, docs, smoke markers
Owned: `css/styles.css`, any `js/*.js` for fixes, `README.md` (above the owner's section), `scripts/smoke-portfolio.py` (markers only:
`/` → `class="hero-name`, `/photography/` → `class="masonry`, `/about/` → `class="about-text`; remove `/books/`). Criteria: AC18–AC22.

## 9. Acceptance criteria

| # | Criterion | Verification |
|---|---|---|
| AC1 | All pages: 0 console errors, 0 CSP violations | headless Chrome (CDP) per page at 390/1440 |
| AC2 | No inline script/style/`style=`, no `'unsafe-inline'`; no `innerHTML`-family in JS | grep |
| AC3 | `imageSources` builds `f_auto,q_auto` Cloudinary URLs with srcset widths, honours full-URL/root-path passthrough, returns null for unset cloud/empty id, rejects unsafe URLs | browser eval unit checks |
| AC4 | Header: transparent over the home hero, solid elsewhere; `aria-current`; works at 360px without overflow | DOM + screenshots |
| AC5 | Footer links via safeUrl; Instagram goes to picsxarchive | DOM |
| AC6 | Removed routes/files are gone; no references to theme.js/photos.js/books remain | grep + 404 check |
| AC7 | Hero fills the viewport (100svh), image `fetchpriority=high`, srcset 800–2560w, `object-position` from `focus` | DOM eval with a fixture Cloudinary-shaped URL |
| AC8 | Name and tagline render from data; the name is the page's h1 | DOM |
| AC9 | 3 panels from data, each a single link with aria-label, image crop `c_fill,g_auto`; 3 columns ≥ 900px, stacked below | DOM + screenshots at 1440/390 |
| AC10 | Image-less fallbacks: no `<img>` when unresolved; load error → fallback tile; no broken icons | eval with cloudName unset and a 404 URL |
| AC11 | Hover/focus zoom and hero fade are disabled under reduced motion | computed styles under emulation |
| AC12 | Photography masonry renders all resolvable photos with reserved ratios; 1/2/3 columns at the breakpoints | DOM + screenshots |
| AC13 | Pending state shows only "Photographs coming soon." | eval with cloudName unset |
| AC14 | Lightbox: open via click/Enter, ← → wrap, Esc closes, Tab trapped, focus restored, scroll locked | scripted interaction test |
| AC15 | About renders image, paragraphs, NOW line, `#work` with the Clarke quote (blockquote + figcaption) and work text, `#contact` with mailto and socials | DOM |
| AC16 | About layout is two columns ≥ 900px and stacked below; `/about/#contact` lands with the heading visible under the header | screenshots + scroll check |
| AC17 | Missing optional fields (`exif`, `focus`, `alt`, socials) render nothing broken; no "undefined" | eval with stripped data |
| AC18 | No horizontal scroll at 360/390/768/1440 on all pages | scrollWidth check |
| AC19 | Text contrast ≥ 4.5:1 on ground; text over photos sits on the scrim | contrast sweep + review |
| AC20 | Reduced motion: no animations or transitions | emulation check |
| AC21 | README explains the Cloudinary photo workflow step by step (upload → copy public ID → paste → commit/push) and the passthrough option | review |
| AC22 | `python3 scripts/smoke-portfolio.py` passes with the updated markers | run |

## 10. Progress log
_(reviewer fills in)_

### M1 — ACCEPTED 2026-11-20
- Evidence (headless Chrome via CDP, 360px, all 3 pages): no console/CSP errors; scrollWidth 360. Header is overlay/absolute on home, static elsewhere, with correct `aria-current`.
  Footer: "© 2026 Saurav Sudhar · Leeds", Email/GitHub/LinkedIn/Instagram(picsxarchive) plus back-to-top. `imageSources`: unset cloud → null; Cloudinary
  `f_auto,q_auto,c_limit,w_1920` src with a 5-width srcset; crop → `c_fill,g_auto,ar_3:4`; `/images/a.jpg` and `https://` pass through; `http:`, `javascript:`, `..`,
  backslash, `//`, `data:` and an invalid cloud name are all rejected. AC2/AC3 greps are clean; no references to removed files; `/books/` returns 404.
- Incident: iCloud had evicted `.git/index` (dataless) when the session restarted. Objects were restored with `brctl download` and the index rebuilt from HEAD
  (`git reset`); `fsck` is clean. Workers from M1-fix onward use `deepseek-v4-pro` (owner request).

### M2 — ACCEPTED 2026-11-20
- Evidence (fixture photos via the `/images/…` passthrough): hero 900/900 = 100svh; img fetchpriority=high, eager, object-position from focus, fades in;
  one h1 = name, tagline from data. 3 panel links (about/#work, photography/, about/#contact) with aria-labels; 479×765 each at 1440 (3 columns),
  390×630 stacked at 390. Fallbacks: default data → 0 `<img>`, hero.is-imgless, panels #151513; a 404 image removes itself plus the scrim. Reduced motion:
  0 transitions/animations, hero opacity 1, reveals static. No overflow at 1440/1024/390.
- Fix round 1: hero content and cue aligned to the header frame (wordmark x = name x at 1440/1024/390); panel titles share one baseline (607px in all
  three); captions ≤ 2 lines.

### M3 — ACCEPTED 2026-11-20
- Photography (fixtures: 5 real + 1 missing): masonry with 3/2/1 columns at 1440/900/390 and reserved ratios; the broken tile is hidden and the count
  updates to "5 photographs". Lightbox: opens on the clicked photo, focus on Close, html.is-locked, arrows wrap, Tab cycles Prev/Next/Close, Esc closes and
  restores focus to the opener. Backdrop is opaque; caption and count are separate spans. Empty data → "Photographs coming soon." only; all-broken → same.
- About: two columns at 1440 (497 | 521), stacked at 390, imgless tile hidden on mobile. `#work` has the Clarke quote as blockquote + figcaption "— Arthur C. Clarke",
  a visually-hidden h2 and the work text. `#contact` has a mailto link and 3 socials. No "undefined". Portrait bottom 801 vs #work top 927 (gap fixed).
- Nav current state fixed (current = ink + underline, others muted). Reduced motion: 0 transitions/animations on all 3 pages.
- Fix round 1: nav current state, lightbox opacity and caption spacing, about bottom padding, live photo count.
