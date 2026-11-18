# Spec — "UPTIME": status-page portfolio rebuild

Status: **APPROVED 2026-11-18 — in progress**
Branch: `version2` (starting HEAD `1b56d57`)
Owner edits to preserve (not part of this task, never stage, never modify):
`.claude/settings.json`, `README.md` (except the section named in M5), `.claude/skills/`,
`docs/dual-agent.md`, `scripts/pi-worker`, `scripts/smoke-portfolio.py`.

---

## 1. Goal

Rebuild all three pages of the portfolio around one familiar, out-of-the-box concept: **the site is
the status page of Saurav's engineering practice.** Visitors already know how to read a status page
(services, components, history, subscribe/contact), so the novelty sits in the metaphor and the
UX stays effortless. It must read as a credible professional engineer's portfolio first and a clever
concept second. Restraint throughout: no shaders, no boot sequences, no fake terminals.

Metaphor map:

| Portfolio content | Status-page element |
|---|---|
| Projects (`work`) | **Services**: name, status pill, activity bar, expandable details |
| Project stack | **Components** of a service |
| Career/news log (new `changelog`) | **Changelog / history** feed |
| About + field log | **Runbook**: "About the operator" |
| Contact | **Page the on-call**: email, copy button, socials, availability |
| Photography | **Exposures**: a gallery whose captions are formatted as readings (EXIF as metrics) |
| Books | **Dependencies**: a reading list shown as a dependency manifest (`installing` / `resolved`) |

### Honesty rule (hard requirement)
There are **no invented metrics**. No uptime percentages, latency, or visitor counts. Every number or
status shown comes from `js/data.js` or the real clock. Activity bars show the months a project was
active, taken from data (`start`/`end`), and are labelled "activity", never "uptime". The global banner
reflects a status the owner writes (`site.status`), not a computed claim.

## 2. Architecture decisions (constraints chosen by the architect)

1. **Vanilla HTML/CSS/JS, no build step, no dependencies.** Deploys as static files to GitHub Pages.
2. **Single content source:** all content lives in `js/data.js` (`window.DATA`). The pages render
   from it and no content is hard-coded in HTML except the `<noscript>` fallback and static landmarks.
3. **ES modules.** `js/app.js` is the entry point and imports `js/core.js`
   (helpers, theme, header/footer, clock) plus one page module: `js/home.js`, `js/photography.js` or `js/books.js`.
   `js/theme.js` is a tiny classic (non-module) script loaded synchronously in `<head>` to set the theme before
   first paint (no flash). `css/styles.css` is one file with clearly commented sections.
4. **Security:** a CSP meta tag on every page: `default-src 'self'; script-src 'self'; style-src 'self'
   https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://res.cloudinary.com;
   connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'none'` (frame-ancestors
   is ignored in meta tags but kept for documentation). **No inline `<script>` and no inline `style=""` attributes or
   `<style>` blocks**, so `'unsafe-inline'` is dropped from style-src (the CSS custom property `--d` delays move to classes,
   and JS sets styles only through `element.style.setProperty`, which CSP allows). Data is never passed to `innerHTML`;
   all text goes in with `textContent`. Outbound links get `rel="noopener noreferrer"`. URLs from data are only
   used if they start with `https://`, `mailto:` or `/` (helper `safeUrl`); anything else is dropped.
5. **Accessibility: WCAG 2.2 AA.** Semantic landmarks and a skip link; expandable services use native
   `<details>/<summary>`; visible `:focus-visible` rings; text contrast ≥ 4.5:1 in both themes; status is never
   conveyed by colour alone (each pill shows a text label and a distinct glyph ● ◐ ○); `prefers-reduced-motion` disables
   every transition and animation; all interactive targets ≥ 24×24 CSS px; the lightbox is a focus-trapped dialog (reuse the
   current logic).
6. **Performance:** at most 3 font families, loaded through one Google Fonts request with `display=swap`; Cloudinary
   `f_auto,q_auto` responsive images with lazy loading and reserved aspect ratios (CLS ≈ 0). No layout shift when the theme
   applies.

## 3. Visual direction

A Swiss-precision status page, light by default, with a dark mode. It must not look like Tungsten.

- **Type:** *Instrument Sans* (UI/body), *JetBrains Mono* (data, labels, timestamps), *Instrument Serif* (italic,
  used only for the large hero line and section headings). No Inter, no Fraunces.
- **Light tokens:** paper `#F4F3EF`, surface `#FFFFFF`, ink `#15171A`, muted `#5B6068`, hairline `#DEDCD5`.
- **Dark tokens:** paper `#0F1113`, surface `#16191C`, ink `#E8E6E1`, muted `#9AA0A8`, hairline `#2A2E33`.
- **Signal colours (both themes, AA-checked against their background):** operational green (`#1E8E4E` light /
  `#3DBE72` dark), active/building amber (`#A86400` / `#E3A43A`), complete/archived slate (`#5B6068` / `#9AA0A8`),
  info blue for links (`#1F5FBF` / `#7AA7F0`).
- **Layout:** a single centred column, max-width 960px, with hairline-ruled rows and generous whitespace. No card grids
  and no gradients. One recurring motif: the 30-cell activity bar.
- **Motion:** opacity/translate reveals ≤ 300ms, the pill "pulse" dot on operational services (2s, subtle), and
  `<details>` expand. All of it is off under reduced motion.

## 4. Data model changes (`js/data.js`)

Keep every existing field and value. Add fields, and update the header comment to document them:

- `site.status`: `{ level: "operational" | "active" | "away", label: "Building karectl at LTH · open to conversations" }`
- `site.availability`: `{ hours: [9, 18], days: [1,2,3,4,5] }`, used for the "on-call now / off-shift" indicator, computed
  from `site.timezone`.
- `site.updated`: `"2026-11"`, the owner-maintained "last updated" shown in the footer (never computed).
- On each `work[]` item: `status: "operational" | "active" | "complete"` (k8tre → operational, FastOMOP → active, FastRTT →
  active, scraper → complete); `start: "2024-01"`, `end: null | "YYYY-MM"` (owner to verify; defaults are k8tre `2024-01`→null,
  FastOMOP `2025-01`→null, FastRTT `2025-01`→null, scraper `2026-03`→`2026-04`); optional `changes: [{ date, text }]`.
- New top-level `changelog: [{ date: "YYYY-MM", kind: "role" | "ship" | "event" | "move", text }]`, seeded **only** with facts
  already in the data: relocated Cardiff → Leeds (`2026-01`, move); KubeCon 2026 (event); HDR UK Conference (event);
  started at Lancashire Teaching Hospitals (role). Any entry whose date is not stated in the existing data gets a
  `// TODO(owner): confirm date` comment.
- Photography keeps its structure. Books keep their structure (the `tag` becomes the dependency "scope").

## 5. Pages and user flows

### Shared chrome (all pages)
- **Header:** wordmark "saurav.sudhar / status" on the left, nav (Services · Runbook · Exposures · Dependencies · Page
  on-call) and a theme toggle on the right. Below 720px the nav collapses into a disclosure button (`aria-expanded`). The
  current page is marked with `aria-current="page"`.
- **Theme toggle:** cycles light → dark, and the first visit follows `prefers-color-scheme`. The choice persists in
  `localStorage` (every access wrapped in try/catch) and is applied by `js/theme.js` before first paint through
  `document.documentElement.dataset.theme`.
- **Footer:** "Last updated {build date from data `site.updated`}", local Leeds clock (`HH:MM` with an `aria-label`),
  socials, and the Clarke quote as a one-line epigraph.

### Home (`/`)
1. **Status banner** (hero): a large pill with the `site.status` label, plus the name and role and the existing
   `hero.statement` (the `{{accent}}` syntax is preserved) in the serif. Next to it sits a live **on-call indicator**:
   "On shift · 14:32 Leeds" or "Off shift · back 09:00 Leeds", computed from availability and timezone. It updates each minute.
2. **Services** (`#services`): one row per `work[]` item. The collapsed row shows name, tagline, status pill (glyph + text),
   year range, and a 30-cell activity bar covering the last 30 months, with cells filled in the months between start and end
   (`role="img"` and an `aria-label` such as "Active Jan 2024 to present"). The first/featured service is open by default.
   Expanded (`<details>`): description, **Components** (stack as mono chips), manifest as a `<dl>`, per-service `changes`
   if present, and links. The featured service name keeps the class `feat-name` (the smoke test depends on it, see §7).
   - A **filter bar** above the rows: All · Operational · Active · Complete (buttons with `aria-pressed`). Filtering hides rows
     and announces "N services shown" in an `aria-live="polite"` region.
3. **Changelog** (`#changelog`): reverse-chronological feed grouped by year, each entry showing kind glyph, date and text.
4. **Runbook** (`#runbook`): "About the operator" with the `about.paragraphs` text, and the `about.notes` as a `<dl>` sidebar
   (a stacked list on mobile).
5. **Elsewhere**: two linked rows to Exposures and Dependencies, each with a live count ("10 exposures", "2 installing · 8 resolved").
6. **Page the on-call** (`#contact`): heading "Page the on-call", the email as a large `mailto:` link, a **Copy** button
   (Clipboard API with a fallback to selecting the text; announces "Email copied" through aria-live), and social links.

### Exposures (`/photography/`)
- Page header: "Exposures", subtitle "{n} frames · {gear}".
- A responsive justified grid using the existing ratio-reserved figures, Cloudinary blur-up and keyboard lightbox. Each caption
  reads like a reading: caption in sans, EXIF in mono (`24mm · f/8 · 1/60 · ISO 100`). Captions keep the class `plate-cap`.
- With an unset `cloudName` (current state), placeholders show "PENDING UPLOAD" in an honest empty state that is not broken
  images. The lightbox stays disabled for pending plates.
- The Instagram link at the bottom is hidden if the URL is the bare `https://www.instagram.com/`.

### Dependencies (`/books/`)
- Page header: "Dependencies", subtitle "{current} installing · {finished} resolved".
- A **manifest view**: two groups, `installing` (current) and `resolved` (finished, grouped by year if every entry has one,
  per the existing rule). Each row shows the title (class `book-row-title`, smoke test), author, scope tag and an optional note
  in italic serif.
- **Scope filter** chips generated from the distinct `tag` values (All + each tag), using `aria-pressed` and live count.

### Empty/edge states
- Empty `work`, `changelog`, `photos`, `current` or `finished`: each section shows a single muted line ("No services listed")
  instead of an empty box, and nothing throws.
- A missing optional field (`end`, `changes`, `exif`, `note`, `links`) renders nothing and no "undefined" appears.
- An invalid `start` date leaves the activity bar empty and the aria-label says "Activity dates not set".
- Timezone: if `Intl` doesn't know the zone, the indicator falls back to hiding itself (no crash).
- JS disabled: `<noscript>` gives the email and the GitHub link.
- With `localStorage` unavailable, the theme still toggles for the session.

## 6. Exclusions
- No frameworks, bundlers, analytics, cookies, trackers, web fonts beyond the three, or service workers.
- No real health checks or network calls to external status APIs.
- No command palette, sound, WebGL, or cursor effects.
- No content rewrites beyond the new fields listed in §4.
- No push or deploy (owner does this).

## 7. Affected files

| Path | Change |
|---|---|
| `index.html`, `photography/index.html`, `books/index.html` | rewritten shells |
| `css/styles.css` | rewritten design system |
| `js/data.js` | additive fields only |
| `js/theme.js` (new), `js/core.js` (new), `js/home.js` (new), `js/photography.js` (new), `js/books.js` (new) | new modules |
| `js/app.js` | becomes the thin entry/router |
| `README.md` | only the "Design system" and structure sections (M5) |

`scripts/smoke-portfolio.py` is **not** modified; the rebuild keeps its markers (`class="feat-name …"`, `class="plate-cap"`,
`class="book-row-title …"`). Because the script matches the literal attribute strings `class="feat-name serif"` and
`class="book-row-title serif"`, those exact class attribute values must be preserved on those elements (the `serif` class
can be a harmless alias in CSS).

## 8. Milestones

Each milestone is implemented by one Pi worker, then reviewed and verified by Claude before the next one starts.

### M1 — Foundation: shells, tokens, theme, shared chrome, data model
Owned paths: `index.html`, `photography/index.html`, `books/index.html`, `css/styles.css` (tokens, reset, typography,
shared chrome, theme, utilities, pill, activity-bar sections only), `js/theme.js`, `js/core.js`, `js/app.js`, `js/data.js`.
Page modules may be stubs exporting `render()`.
Criteria: AC1–AC8.

### M2 — Home
Owned paths: `js/home.js`, `css/styles.css` (home section), `index.html` (section landmarks only if needed).
Criteria: AC9–AC16.

### M3 — Exposures
Owned paths: `js/photography.js`, `css/styles.css` (exposures + lightbox sections), `photography/index.html`.
Criteria: AC17–AC20.

### M3b — Instagram sync (owner request 2026-11-18: photos come from https://www.instagram.com/picsxarchive/)
Owned paths: `scripts/sync-instagram.py` (new), `js/photos.js` (generated, new), `photography/img/` (generated),
`js/photography.js`, `photography/index.html`, `js/data.js` (`site.socials.instagram` and `photography.instagram` set to the
picsxarchive URL).
Design: the owner runs `IG_ACCESS_TOKEN=… python3 scripts/sync-instagram.py [--limit 24]` locally. Only the Python standard
library is used. It calls the official Instagram API (`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,
thumbnail_url,permalink,timestamp,children{media_type,media_url}`, with pagination) and downloads IMAGE posts. For CAROUSEL_ALBUM it
takes the first image child; VIDEO is skipped. Files go to `photography/img/<id>.jpg`, and the aspect ratio is read from the JPEG
SOF header (stdlib only, no PIL). It then writes `js/photos.js` as `window.PHOTOS = [{src, ratio, caption, permalink, date}]`
(a classic script, so CSP-safe; `img-src 'self'`). The caption is the first line of the IG caption with hashtags stripped, ≤ 80 chars.
Image files no longer in the feed are removed. The token is read from the env only: never written, logged or put in URLs that
get printed (error messages redact it). Media hosts are checked against `*.cdninstagram.com` / `*.fbcdn.net` over https before
download, and the size is capped at 15 MB. Exit codes are non-zero with a clear message when the token is missing or expired.
The page uses `window.PHOTOS` when it is a non-empty array, otherwise it falls back to `DATA.photography.photos` (Cloudinary/pending).
Each frame links "View on Instagram" to its permalink via `safeUrl`.
Criteria: AC29–AC32.

### M4 — Dependencies
Owned paths: `js/books.js`, `css/styles.css` (dependencies section), `books/index.html`.
Criteria: AC21–AC23.

### M5 — Polish, responsive, a11y, docs
Owned paths: `css/styles.css`, any `js/*.js` file for fixes, `README.md` (Design system/structure sections only).
Criteria: AC24–AC28.

## 9. Acceptance criteria and verification

| # | Criterion | Verification (local) |
|---|---|---|
| AC1 | All three pages load with zero console errors and zero CSP violations | Headless Chrome console capture on each route |
| AC2 | No inline `<script>`, `<style>` or `style=` attributes in any HTML file; CSP has no `'unsafe-inline'` | `grep -nE '<script>|<style|style="|unsafe-inline'` on the HTML files returns nothing (except `<script src`) |
| AC3 | No `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write` in JS | grep on `js/` |
| AC4 | Theme: first paint follows `prefers-color-scheme`; the toggle flips `data-theme` and persists across a reload; works with storage blocked | Chrome emulation + reload test; manual |
| AC5 | Header nav is keyboard-operable, mobile disclosure toggles `aria-expanded`, `aria-current` set per page | Interaction test at 390px and 1280px |
| AC6 | `safeUrl` rejects `javascript:` and other non-allowed schemes | Node unit check by importing `core.js` helper logic, or a browser eval |
| AC7 | `data.js` keeps every original field/value; new fields from §4 present and documented | Diff review |
| AC8 | Footer shows the Leeds clock and Clarke epigraph on all pages | DOM dump |
| AC9 | Status banner renders `site.status` with pill glyph + text and the accented statement | DOM dump + screenshot |
| AC10 | On-call indicator correct for in-hours and out-of-hours (and hidden for an invalid timezone) | Browser eval with a mocked `Date` |
| AC11 | One service row per `work[]`; first open; others collapsed; `feat-name serif` present | Smoke test + DOM |
| AC12 | Activity bar: 30 cells, filled cells match the start/end months, correct aria-label | Browser eval against data |
| AC13 | Filter bar filters rows, sets `aria-pressed`, announces the count | Interaction test |
| AC14 | Changelog is reverse-chronological and grouped by year | DOM check |
| AC15 | Runbook renders paragraphs and the notes `<dl>`; Elsewhere counts match the data | DOM check |
| AC16 | Copy-email button copies (or falls back) and announces | Interaction test |
| AC17 | Exposures grid renders all photos with reserved ratios and `plate-cap` captions | Smoke + DOM |
| AC18 | Pending state with an unset cloudName: labelled placeholders, no broken `<img>` requests | Network log / DOM |
| AC19 | Lightbox: opens on Enter/click for real images, arrows navigate, Esc closes, focus is trapped and restored | Interaction test with a temporary real URL (not committed) |
| AC20 | Bare Instagram URL hides the link | DOM check |
| AC21 | Dependencies shows installing/resolved groups with correct counts and `book-row-title serif` | Smoke + DOM |
| AC22 | Scope filter chips derived from tags; filtering and live count work | Interaction test |
| AC23 | Year grouping applies only when every finished entry has `year` | Browser eval with mutated data |
| AC24 | No horizontal scroll at 360px, 390px, 768px or 1280px on any page | Screenshots + `scrollWidth` check |
| AC25 | Contrast ≥ 4.5:1 for text tokens in both themes; status never conveyed by colour alone | Script contrast calc on tokens; review |
| AC26 | Reduced motion disables all animations/transitions | Emulated `prefers-reduced-motion` and computed-style check |
| AC27 | Empty-data edge cases (§5) render the muted lines without errors | Browser eval with emptied arrays |
| AC29 | Sync script with a mocked API (local fixture server via `--api-base` test flag, http allowed only for 127.0.0.1) downloads images, writes valid `js/photos.js`, skips video, prunes stale files | Run against a local fixture |
| AC30 | Missing/invalid token → non-zero exit, token never printed | Run with bad token; grep output |
| AC31 | Exposures renders from `window.PHOTOS` when present (ratios reserved, `plate-cap`, permalink link) and from DATA otherwise | DOM check both ways |
| AC32 | Instagram links point to picsxarchive | DOM check |
| AC28 | `python3 scripts/smoke-portfolio.py` passes; README design section updated | Run the script |

## 10. Progress log
_(filled in by the reviewer as milestones are accepted)_

### M1 — ACCEPTED 2026-11-18
- Spec correction: `frame-ancestors` removed from the meta CSP (Chrome logs an error for it in meta; it can only be set as an HTTP header).
- Evidence: AC2/AC3 grep clean. All three routes have 0 console errors and 0 CSP violations (headless Chrome via CDP; fonts are blocked offline by the harness).
  The theme follows prefers-color-scheme, the toggle flips and persists across a reload, and it still works with localStorage throwing. Mobile nav: aria-expanded toggles,
  the panel spans 360/390 exactly (scrollWidth = viewport), aria-current is correct per page. `safeUrl` rejects javascript:/data:/vbscript:/http:/
  protocol-relative/control-char URLs. `onCall` is correct for in-hours, weekend ("back Mon 09:00"), evening, early morning and an invalid timezone (null).
  `activityCells` gives 30 cells and the right labels, and an invalid start gives "Activity dates not set". The footer shows the updated date, clock, socials and epigraph on all pages.
- Fix round 1: frame-ancestors console error, mobile nav overflow (406px at 390), weekend on-call wording, changelog role date (2024-01).
