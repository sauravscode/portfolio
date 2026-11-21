# Spec — GALLERY refinement pass (owner: "suggest and do, no approval needed")

Status: **APPROVED BY BRIEF 2026-11-21 — in progress** (the owner waived interview and approval; reviewer decisions below)
Branch: `version2`, start HEAD `6c7afb3`. Preserve owner edits: `.claude/settings.json`, the README workflow section, `.claude/skills/`,
`docs/dual-agent.md`, `scripts/` (pi-worker, smoke-portfolio.py). Workers: `DEEPSEEK_MODEL=deepseek-v4-pro`.

## 1. Reviewer findings and decisions

| Area | Finding | Decision |
|---|---|---|
| Landing image | DSC_0333 (illuminated Christmas columns) is striking but seasonal and busy; text fights the lights | **Hero → DSC_0429** (Glen road at sunset): scale, sky, timeless; calm dark moor under the tagline. Mobile focus `70% 50%` keeps peak + road |
| Hero sharpness on phones | `sizes="100vw"`, but in portrait `object-fit: cover` renders the image at `100vh × ratio` wide → ~2× upscaled, soft | Add `hero.image.ratio`; sizes = `(max-aspect-ratio: R/1000) <R·100>vh, 100vw` style media condition so the browser fetches the width actually displayed |
| Header over bright sky | Ivory wordmark/nav on a pale sky lose contrast | Same soft text halo as the tagline on the **overlay header only** |
| About photo | DSC_0429 moves to the hero | **About → DSC_0164** (turreted sandstone building, 4:5 crop reviewed) |
| Grandeur | Static hero | A one-time, slow "settle": hero image scales 1.06 → 1 over 2.4s ease-out on load. Never loops. Off under reduced motion |
| Gallery | 3-column masonry of small thumbnails; all 8 photos are landscape so columns end ragged; captions hidden until hover | **Editorial layout:** first photo full-width (feature), then pairs in 2 columns (≥ 900px), 1 column on phones; a trailing odd photo spans full width. Captions always visible below each image (quiet mono). Order leads with the strongest |
| Lightbox on phones | No swipe | Horizontal swipe (≥ 50px, mostly horizontal) = prev/next |
| Sharing | No social preview; links shared in chat look bare | `og:image`/`twitter:card summary_large_image` (static Cloudinary 1200×630 crop of the hero) + `og:url`-free meta on all pages; `preconnect` to res.cloudinary.com |
| Dead links | Old `/books/` URLs 404 to GitHub's default page | Styled `404.html` matching the site, link home |
| Theme | Dark gallery suits vivid, colourful photographs; a light theme would compete | **Keep dark.** No palette change |

## 2. Data changes (`js/data.js`)
- `hero.image = { publicId: "DSC_0429", alt: "<descriptive>", focus: "70% 50%", ratio: 1.895 }` (ratio documented in the header comment).
- `about.image = { publicId: "DSC_0164", alt: "<descriptive>" }`.
- `photography.photos` reordered: DSC_0429, DSC_0588, DSC_0333, DSC_0068, DSC_0166, DSC_0164, DSC_0679, DSC_0076 (same entries, ratios unchanged).

## 3. Milestones

### R1 — Hero, header, About, meta
Owned: `js/data.js`, `js/home.js`, `js/core.js` (only if needed for sizes), `css/styles.css` (HOME + HEADER), `index.html`, `photography/index.html`,
`about/index.html` (meta + preconnect only), `README.md` (one line on `ratio`/`focus` for the hero, above the owner's section). Criteria: RC1–RC6.

### R2 — Editorial gallery + swipe
Owned: `js/photography.js`, `css/styles.css` (PHOTOGRAPHY + LIGHTBOX). Criteria: RC7–RC10.

### R3 — 404 page
Owned: `404.html` (new). Criteria: RC11.

## 4. Acceptance criteria

| # | Criterion | Verification |
|---|---|---|
| RC1 | Hero shows DSC_0429; at 390×844 the loaded candidate width ≥ the rendered width (no upscaling); at 1440×900 it is ≥ 1600w | CDP: `currentSrc` width vs `getBoundingClientRect` |
| RC2 | The overlay header text has a halo; non-home headers unchanged | computed `text-shadow` |
| RC3 | The settle animation runs once on load (≤ 2.6s) and is absent under reduced motion | computed styles / `getAnimations()` |
| RC4 | About shows DSC_0164 | DOM |
| RC5 | All 3 pages have og:title/description/image, twitter:card, and preconnect to res.cloudinary.com; the og:image URL returns 200 image/jpeg 1200×630 | grep + curl |
| RC6 | No console/CSP errors; no overflow at 360/1440; smoke passes | harness |
| RC7 | Gallery: first item full width; pairs in 2 columns ≥ 900px; 1 column < 900px; trailing odd item full width; no ragged column ends | DOM rects at 1440/390 |
| RC8 | Captions visible without hover; images load at a width ≥ rendered width | computed opacity; currentSrc |
| RC9 | Lightbox swipe: a left swipe → next, a right swipe → prev; a vertical drag does nothing; keyboard and buttons unchanged | synthetic touch/pointer events |
| RC10 | Broken-image handling and the live count still work | eval with a bad id |
| RC11 | `/404.html` matches the site (fonts/colours/header wordmark), links home, CSP identical, no JS required | DOM + screenshot |

## 5. Progress log

### R1 — ACCEPTED 2026-11-21
- Hero DSC_0429 (focus 70% 50%, ratio 1.895). 390×844: fetched 1600w for 1599px rendered (was 800w, i.e. 2× upscaled). 1440×900: 2000w for 1706px.
  Settle animation hero-settle 2.4s ×1; reduced motion → none/none, 0 animations. Overlay header halo on; about header none. About = DSC_0164 (4:5 c_fill).
  og/twitter meta + Cloudinary preconnect on all 3 pages, CSP unchanged; og:image returns 200 image/jpeg 1200×630. Gallery reordered. README notes
  added; the owner's section is byte-identical (kept out of the commit).

### R2 — ACCEPTED 2026-11-21
- Editorial grid at 1440: F(1104) + 3 aligned pairs (532 each, shared 8:5 frames, equal tops) + trailing F. At 390: single column with natural ratios.
  Every image fetches ≥ its displayed width. Captions are always visible below the frame. With a broken last photo the layout becomes FppppppH and the count
  shows "7 photographs". Swipe: left → next, right → prev; vertical, < 50px, mouse, and button-origin drags are ignored; keys and buttons unchanged; touch-action pan-y.
  Reduced motion: 0 transitions/animations.
- Fix round 1: pair frames share 8:5 at ≥ 900px.
- Note: `.gitignore` gained `/docs` at 14:50 during the R2 run (not in the worker's report). It was left untouched and unstaged for the owner to confirm.
