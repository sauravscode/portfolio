# Tungsten Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **REQUIRED at execution:** Invoke the `frontend-design:frontend-design` skill before starting Task 1. It informs every UI decision in Tasks 1–8. Task 8 ends with a screenshot-driven design-polish pass.

**Goal:** Replace the EVENT HORIZON single-page WebGL site with a three-page, zero-build "Tungsten" portfolio — dark, cinematic, engineer-first, per the approved spec at `docs/superpowers/specs/2026-07-11-tungsten-redesign-design.md`.

**Architecture:** Three semantic HTML shells (`index.html`, `photography/index.html`, `books/index.html`) filled client-side from `window.DATA` (`js/data.js`) by one shared renderer (`js/app.js`). One sectioned stylesheet (`css/styles.css`) carries the whole design system. No frameworks, no build step.

**Tech Stack:** Vanilla HTML/CSS/JS, Google Fonts (Fraunces, IBM Plex Sans, JetBrains Mono), Cloudinary image URLs, `python3 -m http.server` for local verification.

## Global Constraints

- **Zero build:** no package.json, no node_modules, no bundler. Ship the files as written.
- **Content rule:** all content renders from `window.DATA`; JS never uses `innerHTML` for data — `textContent`/`createElement` only.
- **No invented professional content:** copy comes from `js/data.js` as it exists today (minus removals listed in Task 1).
- **CSP on every page**, verbatim: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://res.cloudinary.com; connect-src 'self'; base-uri 'self'; form-action 'none'; object-src 'none';`
- **Color tokens** (exact): bg `#0B0A08`, raised `#12100D`, text `#EDE7DC`, dim `#8A8478`, accent `#E09236`, accent-bright `#F2B25C`, hairline `rgba(237,231,220,.08)`. One accent; no decorative gradients (light-glow gradients only).
- **Type:** Fraunces (display), IBM Plex Sans (body), JetBrains Mono (labels/annotations). Never Inter.
- **Motion (closed set):** scroll reveals, hero-glow parallax, link transitions, image blur-up. `prefers-reduced-motion: reduce` disables all of it.
- **Outbound links:** `target="_blank" rel="noopener noreferrer"`.
- **Commits:** every task ends in a commit; messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- **Verification server:** `python3 -m http.server 8000` from repo root; pages at `http://localhost:8000/`, `/photography/`, `/books/`.

---

### Task 1: Checkpoint, teardown, and the foundation (chrome + hero + design-system core)

**Files:**
- Commit first: entire current working tree (EVENT HORIZON is uncommitted — preserve it in history)
- Delete: `js/space.js`
- Rewrite: `index.html`, `css/styles.css`, `js/app.js`
- Modify: `js/data.js` (remove `hero.eyebrow` only)

**Interfaces:**
- Produces (used by every later task):
  - `el(tag, cls, text) → HTMLElement` — DOM helper
  - `accentify(target, string)` — renders `{{…}}` spans as `<em class="accent">`
  - `PAGE` (string from `<body data-page>`), `ROOT` (`""` on home, `"../"` on subpages)
  - `renderHeader()`, `renderFooter()`, `initReveals()`, `initClock()`, `initNavToggle()`
  - Reveal convention: add class `reveal` (+ optional inline `--d: <n>ms` stagger delay); `initReveals()` is called once **after** all rendering
  - Stub functions Tasks 2–4 replace: `renderWork()`, `renderAbout()`, `renderDoorways()`, `renderContact()`, `renderEpigraph()`
  - CSS primitives: `.wrap`, `.wrap--narrow`, `.mono-label`, `.serif`, `.section`, `.section-head`, `.section-label`, `.section-title`, `.link-line`, `.reveal`

- [ ] **Step 1: Checkpoint the uncommitted EVENT HORIZON build**

```bash
git add -A
git commit -m "checkpoint: EVENT HORIZON build before Tungsten redesign

Preserves the uncommitted WebGL black-hole site in history before the
full rewrite per docs/superpowers/specs/2026-07-11-tungsten-redesign-design.md.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Expected: commit succeeds; `git status` clean.

- [ ] **Step 2: Delete the WebGL layer**

```bash
git rm js/space.js
```

- [ ] **Step 3: Edit `js/data.js` — remove the free-text eyebrow**

Delete this line from the `hero` object (the eyebrow is now built from `site` fields):

```js
    eyebrow: "Infrastructure for healthcare research",
```

Also update the file's header comment block: change the line `• hero         → the opening sequence (name, statement, the Clarke quote)` to `• hero         → statement, deck, and the Clarke quote (now the footer epigraph)`. Everything else in `data.js` stays byte-identical for now.

- [ ] **Step 4: Rewrite `index.html`**

Full file content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

  <title>Saurav Sudhar — Software · Infrastructure Engineer</title>
  <meta name="description" content="Software and infrastructure engineer building Kubernetes platforms for NHS Trusted Research Environments. Night photography and a reading list alongside." />
  <meta name="author" content="Saurav Sudhar" />
  <meta name="theme-color" content="#0B0A08" />
  <meta name="color-scheme" content="dark" />

  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src https://fonts.gstatic.com;
    img-src 'self' data: https://res.cloudinary.com;
    connect-src 'self';
    base-uri 'self';
    form-action 'none';
    object-src 'none';
  " />
  <meta name="referrer" content="strict-origin-when-cross-origin" />

  <meta property="og:type" content="website" />
  <meta property="og:title" content="Saurav Sudhar — Software · Infrastructure Engineer" />
  <meta property="og:description" content="Kubernetes infrastructure for NHS research — and the structure of light." />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..500;1,9..144,300..400&family=IBM+Plex+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" />
  <link rel="stylesheet" href="css/styles.css" />

  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230B0A08'/><circle cx='50' cy='50' r='30' fill='none' stroke='%23E09236' stroke-width='7'/><circle cx='50' cy='50' r='9' fill='%23E09236'/></svg>" />

  <style>html{background:#0B0A08;color-scheme:dark}</style>
  <script src="js/data.js"></script>
</head>

<body data-page="home">
  <noscript>
    <p class="noscript">This site renders its content with JavaScript.
    Reach me at sauravsnair99@gmail.com.</p>
  </noscript>

  <div class="glow" id="glow" aria-hidden="true"></div>
  <div class="grain" aria-hidden="true"></div>

  <a class="skip-link" href="#work">Skip to content</a>

  <header class="site-head" id="site-head"></header>

  <main>
    <section class="hero" aria-label="Introduction">
      <div class="wrap">
        <p class="hero-eyebrow mono-label reveal" id="hero-eyebrow"></p>
        <h1 class="hero-statement serif reveal" id="hero-statement" style="--d:80ms"></h1>
        <p class="hero-deck reveal" id="hero-deck" style="--d:160ms"></p>
      </div>
    </section>

    <section class="section work" id="work" aria-labelledby="work-title">
      <div class="wrap">
        <header class="section-head reveal">
          <p class="section-label mono-label">01 — SELECTED SYSTEMS</p>
          <h2 class="section-title serif" id="work-title">Selected Systems</h2>
        </header>
        <article class="work-featured" id="work-featured"></article>
        <ol class="work-index" id="work-index"></ol>
      </div>
    </section>

    <section class="section about" id="about" aria-labelledby="about-title">
      <div class="wrap">
        <header class="section-head reveal">
          <p class="section-label mono-label">02 — THE OPERATOR</p>
          <h2 class="section-title serif" id="about-title">About</h2>
        </header>
        <div class="about-grid">
          <div class="about-body" id="about-body"></div>
          <aside class="about-log" aria-label="Field log">
            <p class="mono-label about-log-head">FIELD LOG</p>
            <dl id="about-log"></dl>
          </aside>
        </div>
      </div>
    </section>

    <nav class="doorways" aria-label="Photography and books">
      <a class="doorway doorway--photo reveal" id="door-photo" href="photography/"></a>
      <a class="doorway doorway--books reveal" id="door-books" href="books/"></a>
    </nav>

    <section class="section contact" id="contact" aria-labelledby="contact-title">
      <div class="wrap">
        <p class="section-label mono-label reveal">03 — CONTACT</p>
        <h2 class="contact-title serif reveal" id="contact-title" style="--d:80ms">Let&rsquo;s build something that stays&nbsp;up.</h2>
        <a class="contact-mail reveal" id="contact-mail" href="#" style="--d:160ms"></a>
        <div class="contact-links" id="contact-links"></div>
      </div>
    </section>

    <figure class="epigraph reveal">
      <blockquote class="epigraph-text serif" id="epigraph-text"></blockquote>
      <figcaption class="epigraph-author mono-label" id="epigraph-author"></figcaption>
    </figure>
  </main>

  <footer class="site-foot" id="site-foot"></footer>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 5: Rewrite `css/styles.css` — sections 1–8 (tokens through hero, footer, reveal engine)**

Full file content (later tasks append further sections at the end):

```css
/* ============================================================================
   TUNGSTEN — design system
   01 tokens & reset   02 primitives   03 ambient light & grain
   04 header/nav       05 footer       06 hero
   07 sections shared  08 motion
   (appended by later tasks: 09 work · 10 about · 11 doorways · 12 contact
    13 photography/plates · 14 lightbox · 15 books · 16 responsive polish)
   ========================================================================== */

/* ---- 01 · tokens & reset ------------------------------------------------ */
:root {
  --bg: #0B0A08;
  --bg-raised: #12100D;
  --text: #EDE7DC;
  --text-dim: #8A8478;
  --accent: #E09236;
  --accent-bright: #F2B25C;
  --hairline: rgba(237, 231, 220, .08);
  --serif: "Fraunces", Georgia, serif;
  --sans: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
  --wrap: 1080px;
  --wrap-narrow: 860px;
  --pad: clamp(1.25rem, 4vw, 2.5rem);
}

*, *::before, *::after { box-sizing: border-box; }

html { background: var(--bg); scroll-behavior: smooth; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  font-weight: 300;
  font-size: 1rem;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}

img { max-width: 100%; display: block; }

a { color: var(--accent); text-decoration: none; }
a:hover { color: var(--accent-bright); }

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 2px;
}

::selection { background: rgba(224, 146, 54, .28); color: var(--text); }

.noscript {
  padding: 1rem var(--pad);
  font-family: var(--mono);
  font-size: .8rem;
  color: var(--accent);
  border-bottom: 1px solid var(--hairline);
}

.skip-link {
  position: absolute;
  left: -200vw;
  top: 0;
  z-index: 100;
  padding: .6rem 1rem;
  background: var(--bg-raised);
  font-family: var(--mono);
  font-size: .75rem;
}
.skip-link:focus { left: 0; }

/* ---- 02 · primitives ---------------------------------------------------- */
.wrap {
  max-width: var(--wrap);
  margin-inline: auto;
  padding-inline: var(--pad);
}
.wrap--narrow { max-width: var(--wrap-narrow); }

.serif {
  font-family: var(--serif);
  font-optical-sizing: auto;
  font-weight: 340;
  letter-spacing: -.015em;
}

.mono-label {
  font-family: var(--mono);
  font-size: .6875rem;
  font-weight: 400;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.link-line {
  display: inline-block;
  font-family: var(--mono);
  font-size: .75rem;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--accent);
  padding-bottom: 2px;
  background: linear-gradient(var(--accent-bright), var(--accent-bright)) no-repeat 0 100% / 0 1px;
  transition: background-size .25s ease, color .2s ease;
}
.link-line:hover { background-size: 100% 1px; }

/* ---- 03 · ambient light & grain ----------------------------------------- */
.glow {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(90% 60% at 14% 108%,
    rgba(224, 146, 54, .20) 0%,
    rgba(224, 146, 54, .05) 45%,
    transparent 72%);
  transform: translateY(calc(var(--par, 0) * 1px));
  will-change: transform;
}

.grain {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  opacity: .045;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='128' height='128' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ---- 04 · header / nav --------------------------------------------------- */
.site-head {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: .9rem var(--pad);
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--hairline);
}

.brand { display: flex; align-items: baseline; gap: .8rem; color: var(--text); }
.brand:hover { color: var(--text); }
.brand-name { font-family: var(--serif); font-size: 1.05rem; font-weight: 400; }
.brand-role { display: none; }
@media (min-width: 720px) { .brand-role { display: inline; } }

.nav { display: flex; align-items: center; gap: clamp(1rem, 2.5vw, 2rem); }
.nav a {
  font-family: var(--mono);
  font-size: .72rem;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--text-dim);
  transition: color .2s ease;
}
.nav a:hover { color: var(--accent-bright); }
.nav a[aria-current="page"] { color: var(--accent); }

.head-aside { display: flex; align-items: center; gap: 1rem; }
.head-clock { font-size: .68rem; white-space: nowrap; }

.nav-toggle {
  display: none;
  background: none;
  border: 1px solid var(--hairline);
  border-radius: 3px;
  color: var(--text);
  font-family: var(--mono);
  font-size: .7rem;
  letter-spacing: .1em;
  padding: .35rem .6rem;
  cursor: pointer;
}

@media (max-width: 640px) {
  .nav-toggle { display: inline-block; }
  .head-clock { display: none; }
  .nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    background: var(--bg-raised);
    border-bottom: 1px solid var(--hairline);
    display: none;
  }
  .nav a { display: block; width: 100%; padding: .9rem var(--pad); }
  .site-head[data-open] .nav { display: flex; }
}

/* ---- 05 · footer ---------------------------------------------------------- */
.site-foot { border-top: 1px solid var(--hairline); margin-top: clamp(4rem, 10vh, 7rem); }
.colophon {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem 2rem;
  justify-content: space-between;
  padding: 1.2rem var(--pad);
  font-size: .65rem;
}

/* ---- 06 · hero ------------------------------------------------------------ */
.hero {
  min-height: min(88vh, 860px);
  display: flex;
  align-items: center;
  padding-block: clamp(4rem, 12vh, 8rem);
}

.hero-eyebrow { color: var(--accent); }

.hero-statement {
  margin: 1.2rem 0 0;
  font-size: clamp(2.6rem, 7.5vw, 6.5rem);
  line-height: 1.04;
}
.hero-statement .accent {
  font-style: italic;
  font-weight: 300;
  color: var(--accent);
}

.hero-deck {
  margin: 2rem 0 0;
  max-width: 34rem;
  color: var(--text-dim);
}

/* ---- 07 · sections shared -------------------------------------------------- */
.section { padding-block: clamp(4rem, 12vh, 8rem); }

.section-head { margin-bottom: clamp(2rem, 5vh, 3.5rem); }
.section-label { color: var(--accent); margin: 0 0 .8rem; }
.section-title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.1;
}

/* ---- 08 · motion ------------------------------------------------------------ */
.reveal {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity .7s ease-out, transform .7s ease-out;
  transition-delay: var(--d, 0ms);
}
.reveal.is-in { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .reveal { opacity: 1; transform: none; transition: none; }
  .glow { transform: none; }
  *, *::before, *::after { transition-duration: .01ms !important; animation: none !important; }
}
```

- [ ] **Step 6: Rewrite `js/app.js`**

Full file content (stubs for Tasks 2–4 included so the page runs end-to-end now):

```js
/* ============================================================================
   app.js — TUNGSTEN renderer
   Reads window.DATA (js/data.js) and fills the semantic shells.
   Page detection: <body data-page="home|photography|books">.
   ========================================================================== */
"use strict";

const D = window.DATA;
const PAGE = document.body.dataset.page || "home";
const ROOT = PAGE === "home" ? "" : "../";

/* ---- helpers -------------------------------------------------------------- */
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

/** Render "text with {{accented}} phrases" into target as text + <em.accent>. */
function accentify(target, s) {
  String(s).split(/\{\{|\}\}/).forEach((part, i) => {
    if (!part) return;
    if (i % 2) target.appendChild(el("em", "accent", part));
    else target.appendChild(document.createTextNode(part));
  });
}

function extLink(cls, label, href) {
  const a = el("a", cls, label);
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}

/* ---- shared chrome ---------------------------------------------------------- */
function renderHeader() {
  const head = document.getElementById("site-head");

  const brand = el("a", "brand");
  brand.href = ROOT || "./";
  brand.append(
    el("span", "brand-name", D.site.name),
    el("span", "brand-role mono-label", D.site.role)
  );

  const nav = el("nav", "nav");
  nav.id = "site-nav";
  nav.setAttribute("aria-label", "Primary");
  const links = [
    ["Work", ROOT + "index.html#work", null],
    ["Photography", ROOT + "photography/", "photography"],
    ["Books", ROOT + "books/", "books"],
    ["Contact", ROOT + "index.html#contact", null],
  ];
  for (const [label, href, pageName] of links) {
    const a = el("a", null, label);
    a.href = href;
    if (pageName === PAGE) a.setAttribute("aria-current", "page");
    nav.append(a);
  }

  const aside = el("div", "head-aside");
  const clock = el("span", "head-clock mono-label");
  clock.id = "head-clock";
  const toggle = el("button", "nav-toggle", "MENU");
  toggle.id = "nav-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "site-nav");
  aside.append(clock, toggle);

  head.append(brand, nav, aside);
}

function renderFooter() {
  const foot = document.getElementById("site-foot");
  const row = el("div", "colophon mono-label");
  row.append(
    el("span", null, D.site.name),
    el("span", null, D.site.coordinates),
    el("span", null, `© ${new Date().getFullYear()}`)
  );
  foot.append(row);
}

function initClock() {
  const t = document.getElementById("head-clock");
  if (!t) return;
  const city = D.site.locationLabel.split(",")[0].toUpperCase();
  const fmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: D.site.timezone,
  });
  const tick = () => { t.textContent = `${city} · ${fmt.format(new Date())}`; };
  tick();
  setInterval(tick, 30_000);
}

function initNavToggle() {
  const btn = document.getElementById("nav-toggle");
  const head = document.getElementById("site-head");
  btn.addEventListener("click", () => {
    const open = head.toggleAttribute("data-open");
    btn.setAttribute("aria-expanded", String(open));
  });
}

/* ---- motion ------------------------------------------------------------------ */
function initReveals() {
  const items = document.querySelectorAll(".reveal");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach((n) => n.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  items.forEach((n) => io.observe(n));
}

/* ---- home ---------------------------------------------------------------------- */
function renderHero() {
  document.getElementById("hero-eyebrow").textContent =
    `${D.site.locationLabel.toUpperCase()} · ${D.site.coordinates}`;
  accentify(document.getElementById("hero-statement"), D.hero.statement);
  document.getElementById("hero-deck").textContent = D.hero.deck;
}

/* Stubs — replaced by Tasks 2, 3, 4. */
function renderWork() {}
function renderAbout() {}
function renderDoorways() {}
function renderContact() {}
function renderEpigraph() {}

function renderHome() {
  renderHero();
  renderWork();
  renderAbout();
  renderDoorways();
  renderContact();
  renderEpigraph();
}

/* ---- boot ------------------------------------------------------------------------ */
if (!D) {
  console.error("window.DATA missing — is js/data.js loaded?");
} else {
  renderHeader();
  renderFooter();
  if (PAGE === "home") renderHome();
  initClock();
  initNavToggle();
  initReveals();
}
```

- [ ] **Step 7: Serve and verify**

```bash
python3 -m http.server 8000
```

Load `http://localhost:8000/` in a browser and confirm:
- Warm near-black page, amber glow bottom-left, faint grain.
- Header: serif "Saurav Sudhar" + mono role, 4 nav links, live Leeds clock.
- Hero: mono coordinates eyebrow, big Fraunces statement with "healthcare research" in italic amber, dim deck paragraph. All three fade-rise in on load.
- Empty Work/About/Contact section shells with amber `01 —` labels visible below (they fill in Tasks 2–4).
- Zero console errors; no request for `space.js`.

Also verify degraded states: disable JS (noscript line with email appears); emulate `prefers-reduced-motion` (content visible instantly, no transitions).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: Tungsten foundation — chrome, hero, design-system core

Rewrites index.html/styles.css/app.js, deletes the WebGL layer, and
removes hero.eyebrow from data.js (eyebrow now built from site fields).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Home — Selected Systems

**Files:**
- Modify: `js/app.js` (replace `renderWork` stub)
- Modify: `css/styles.css` (append section 09)

**Interfaces:**
- Consumes: `el()`, `extLink()`, `.reveal` + `--d` convention, `D.work[]` (first `featured: true` entry is the flagship)
- Produces: nothing later tasks depend on

- [ ] **Step 1: Replace the `renderWork` stub in `js/app.js`**

```js
function renderWork() {
  const featured = D.work.find((w) => w.featured) || D.work[0];
  const rest = D.work.filter((w) => w !== featured);

  /* flagship */
  const art = document.getElementById("work-featured");
  art.classList.add("reveal");

  const head = el("div", "feat-head");
  head.append(
    el("h3", "feat-name serif", featured.name),
    el("span", "feat-year mono-label", featured.year)
  );

  const man = el("dl", "feat-manifest");
  for (const [k, v] of Object.entries(featured.manifest || {})) {
    man.append(
      el("dt", "mono-label", k),
      el("dd", "mono-label", String(v))
    );
  }

  const links = el("div", "feat-links");
  for (const l of featured.links || []) links.append(extLink("link-line", l.label, l.href));

  art.append(
    head,
    el("p", "feat-tagline", featured.tagline),
    el("p", "feat-desc", featured.description),
    man,
    el("p", "feat-stack mono-label", (featured.stack || []).join(" · ")),
    links
  );

  /* index rows */
  const ol = document.getElementById("work-index");
  rest.forEach((w, i) => {
    const li = el("li", "work-row reveal");
    li.style.setProperty("--d", `${i * 80}ms`);
    const a = (w.links && w.links[0])
      ? extLink("work-row-link", "", w.links[0].href)
      : el("div", "work-row-link");
    a.append(
      el("span", "work-row-idx mono-label", String(i + 2).padStart(3, "0")),
      (() => {
        const t = el("span", "work-row-main");
        t.append(el("span", "work-row-name serif", w.name),
                 el("span", "work-row-tag", w.tagline));
        return t;
      })(),
      el("span", "work-row-year mono-label", w.year),
      el("span", "work-row-status mono-label", (w.manifest && w.manifest.Status) || "")
    );
    li.append(a);
    ol.append(li);
  });
}
```

- [ ] **Step 2: Append section 09 to `css/styles.css`**

```css
/* ---- 09 · work ------------------------------------------------------------- */
.work-featured {
  border-top: 1px solid var(--accent);
  padding-top: 2rem;
}

.feat-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
}
.feat-name { margin: 0; font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight: 400; }
.feat-year { color: var(--accent); }

.feat-tagline { margin: .6rem 0 0; color: var(--accent-bright); font-weight: 400; }
.feat-desc { margin: 1.2rem 0 0; max-width: 46rem; color: var(--text-dim); }

.feat-manifest {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, max-content));
  gap: .4rem 3rem;
  margin: 1.8rem 0 0;
  padding: 1rem 0;
  border-block: 1px solid var(--hairline);
}
.feat-manifest dt { margin: 0; }
.feat-manifest dd { margin: 0; color: var(--text); }

.feat-stack { margin: 1.2rem 0 0; color: var(--text-dim); }
.feat-links { margin-top: 1.6rem; display: flex; gap: 2rem; }

.work-index {
  list-style: none;
  margin: clamp(2.5rem, 6vh, 4rem) 0 0;
  padding: 0;
}
.work-row { border-bottom: 1px solid var(--hairline); }
.work-row:first-child { border-top: 1px solid var(--hairline); }

.work-row-link {
  display: grid;
  grid-template-columns: 3rem 1fr auto auto;
  align-items: baseline;
  gap: 1.5rem;
  padding: 1.1rem 0;
  color: var(--text);
  transition: padding-left .25s ease;
}
.work-row-link:hover { color: var(--text); padding-left: .6rem; }
.work-row-link:hover .work-row-name { color: var(--accent-bright); }

.work-row-main { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; }
.work-row-name { font-size: 1.15rem; font-weight: 400; transition: color .2s ease; }
.work-row-tag { color: var(--text-dim); font-size: .85rem; }
.work-row-status { color: var(--accent); }

@media (max-width: 640px) {
  .work-row-link { grid-template-columns: 2.2rem 1fr; }
  .work-row-year, .work-row-status { display: none; }
}
```

- [ ] **Step 3: Verify in browser**

Reload `http://localhost:8000/#work`. Confirm: k8tre renders large under an amber top rule — name + year, amber tagline, dim description, ruled manifest grid (STATUS / SCOPE / DELIVERY / COMPLIANCE), stack line, REPOSITORY link with underline sweep on hover. Below: three ruled index rows (002 FastOMOP, 003 FastRTT, 004 KubeCon Schedule Scraper) with hover nudge. Rows stagger in on scroll. No console errors.

- [ ] **Step 4: Commit**

```bash
git add js/app.js css/styles.css
git commit -m "feat: Selected Systems — flagship k8tre + ruled index rows

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Home — About + field log

**Files:**
- Modify: `js/app.js` (replace `renderAbout` stub)
- Modify: `css/styles.css` (append section 10)

**Interfaces:**
- Consumes: `el()`, `.reveal` + `--d`, `D.about.paragraphs[]`, `D.about.notes[]` (`{k, v}`)
- Produces: nothing later tasks depend on

- [ ] **Step 1: Replace the `renderAbout` stub in `js/app.js`**

```js
function renderAbout() {
  const body = document.getElementById("about-body");
  D.about.paragraphs.forEach((p, i) => {
    const node = el("p", "reveal", p);
    node.style.setProperty("--d", `${i * 80}ms`);
    body.append(node);
  });

  const log = document.getElementById("about-log");
  log.parentElement.classList.add("reveal");
  for (const n of D.about.notes) {
    log.append(
      el("dt", "mono-label", n.k),
      el("dd", null, n.v)
    );
  }
}
```

- [ ] **Step 2: Append section 10 to `css/styles.css`**

```css
/* ---- 10 · about --------------------------------------------------------------- */
.about-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(240px, 1fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: start;
}
@media (max-width: 820px) { .about-grid { grid-template-columns: 1fr; } }

.about-body p { margin: 0 0 1.3rem; max-width: 40rem; }
.about-body p:last-child { margin-bottom: 0; }

.about-log {
  border-left: 1px solid var(--hairline);
  padding-left: clamp(1.2rem, 2.5vw, 2rem);
}
.about-log-head { color: var(--accent); margin: 0 0 1rem; }
.about-log dl { margin: 0; }
.about-log dt { margin: .9rem 0 .15rem; }
.about-log dt:first-of-type { margin-top: 0; }
.about-log dd { margin: 0; font-size: .85rem; color: var(--text); }
```

- [ ] **Step 3: Verify in browser**

Reload and scroll to About. Confirm: three paragraphs left (readable measure, staggered reveal), FIELD LOG right behind a hairline rule — amber head, mono keys (NOW / FIELD / LEARNING / SEEN / SEEN / BASED) over plain values. At 768px and below the log stacks under the paragraphs. No console errors.

- [ ] **Step 4: Commit**

```bash
git add js/app.js css/styles.css
git commit -m "feat: About section with field-log sidebar

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Home — doorways, contact, epigraph

**Files:**
- Modify: `js/app.js` (replace `renderDoorways`, `renderContact`, `renderEpigraph` stubs; add `cloudReady()` + `cldUrl()` helpers)
- Modify: `css/styles.css` (append sections 11–12)

**Interfaces:**
- Consumes: `el()`, `extLink()`, `D.photography`, `D.reading`, `D.site`, `D.hero.quote/quoteAuthor`
- Produces: `cloudReady() → boolean` and `cldUrl(publicId, w, extra?) → string` — **Task 5 reuses these exact signatures** for the gallery

- [ ] **Step 1: Add Cloudinary helpers to `js/app.js`** (place above `renderHero`, in a new `/* ---- images ---- */` block)

```js
/* ---- images -------------------------------------------------------------- */
function cloudReady() {
  const c = D.photography.cloudName;
  return Boolean(c) && c !== "your-cloud-name";
}

/** Build a Cloudinary delivery URL. `extra` is an optional transform suffix. */
function cldUrl(publicId, w, extra = "") {
  return `https://res.cloudinary.com/${D.photography.cloudName}` +
         `/image/upload/f_auto,q_auto,w_${w},c_limit${extra}/${publicId}`;
}
```

- [ ] **Step 2: Replace the three stubs in `js/app.js`**

```js
function renderDoorways() {
  /* Photography doorway */
  const dp = document.getElementById("door-photo");
  const first = D.photography.photos[0];
  if (first && /^(https?:\/\/|\/)/.test(first.publicId)) {
    dp.style.backgroundImage = `url("${first.publicId}")`;
  } else if (first && cloudReady()) {
    dp.style.backgroundImage = `url("${cldUrl(first.publicId, 1200)}")`;
  }
  const dpInner = el("span", "doorway-inner");
  dpInner.append(
    el("span", "doorway-label mono-label", "DEEP FIELD"),
    el("span", "doorway-title serif", "Photography"),
    el("span", "doorway-sub mono-label",
      `${D.photography.photos.length} PLATES · ${D.photography.gear.toUpperCase()} →`)
  );
  dp.append(dpInner);

  /* Books doorway */
  const db = document.getElementById("door-books");
  const top = D.reading.current[0];
  const dbInner = el("span", "doorway-inner");
  const volumes = D.reading.current.length + D.reading.finished.length;
  dbInner.append(
    el("span", "doorway-label mono-label", "THE ARCHIVE"),
    el("span", "doorway-title serif", "Books"),
    el("span", "doorway-sub mono-label", `${volumes} VOLUMES →`)
  );
  if (top && top.note) {
    dbInner.insertBefore(
      el("span", "doorway-quote serif", `“${top.note}”`),
      dbInner.lastChild
    );
  }
  db.append(dbInner);
}

function renderContact() {
  const mail = document.getElementById("contact-mail");
  mail.href = `mailto:${D.site.email}`;
  mail.textContent = D.site.email;

  const links = document.getElementById("contact-links");
  links.classList.add("reveal");
  links.style.setProperty("--d", "240ms");
  for (const [name, href] of Object.entries(D.site.socials)) {
    links.append(extLink("link-line", name, href));
  }
}

function renderEpigraph() {
  document.getElementById("epigraph-text").textContent = `“${D.hero.quote}”`;
  document.getElementById("epigraph-author").textContent = `— ${D.hero.quoteAuthor}`;
}
```

- [ ] **Step 3: Append sections 11–12 to `css/styles.css`**

```css
/* ---- 11 · doorways --------------------------------------------------------- */
.doorways { display: grid; }
@media (min-width: 820px) { .doorways { grid-template-columns: 1fr 1fr; } }

.doorway {
  position: relative;
  display: block;
  min-height: clamp(240px, 34vh, 340px);
  border-block: 1px solid var(--hairline);
  background-color: var(--bg-raised);
  background-size: cover;
  background-position: center;
  overflow: hidden;
}
.doorway--photo { box-shadow: inset 0 0 0 999px rgba(11, 10, 8, .55); }
.doorway--photo::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(70% 55% at 50% 88%, rgba(224, 146, 54, .22), transparent 68%);
}
@media (min-width: 820px) { .doorway--books { border-left: 1px solid var(--hairline); } }

.doorway-inner {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: .35rem;
  padding: clamp(1.5rem, 4vw, 2.5rem);
}
.doorway-label { color: var(--accent); }
.doorway-title {
  color: var(--text);
  font-size: clamp(1.8rem, 3.5vw, 2.6rem);
  line-height: 1.1;
  transition: color .2s ease;
}
.doorway:hover .doorway-title { color: var(--accent-bright); }
.doorway-quote {
  font-style: italic;
  color: var(--text-dim);
  font-size: 1rem;
  max-width: 26rem;
}
.doorway-sub { margin-top: .5rem; }

/* ---- 12 · contact + epigraph ------------------------------------------------- */
.contact { text-align: left; }
.contact-title {
  margin: 1rem 0 0;
  font-size: clamp(2.2rem, 5.5vw, 4.5rem);
  line-height: 1.06;
  max-width: 18em;
}

.contact-mail {
  display: inline-block;
  margin-top: 2rem;
  font-family: var(--mono);
  font-size: clamp(1rem, 2.2vw, 1.4rem);
  letter-spacing: .04em;
  color: var(--accent);
  border-bottom: 1px solid var(--accent);
  padding-bottom: .3rem;
  transition: color .2s ease, border-color .2s ease;
}
.contact-mail:hover { color: var(--accent-bright); border-color: var(--accent-bright); }

.contact-links {
  margin-top: 2.2rem;
  display: flex;
  gap: 2.2rem;
  flex-wrap: wrap;
}

.epigraph {
  margin: clamp(3rem, 8vh, 5rem) auto 0;
  max-width: 44rem;
  padding-inline: var(--pad);
  text-align: center;
}
.epigraph-text {
  margin: 0;
  font-style: italic;
  font-size: 1.05rem;
  color: var(--text-dim);
  line-height: 1.6;
}
.epigraph-author { margin-top: .8rem; }
```

- [ ] **Step 4: Verify in browser**

Reload. Confirm: two full-width doorway bands after About — Photography (dark band, amber under-glow, "DEEP FIELD / Photography / 10 PLATES · NIKON Z50 II →") and Books (raised band with the Kleppmann note as an italic quote, "THE ARCHIVE / Books / 10 VOLUMES →"); both link to the (still-404) subpages. Contact: big serif line, amber underlined email, github/linkedin/instagram links. Clarke epigraph sits small, italic, centred above the colophon. No console errors.

- [ ] **Step 5: Commit**

```bash
git add js/app.js css/styles.css
git commit -m "feat: doorway bands, contact, and Clarke epigraph

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Photography page — plates gallery

**Files:**
- Create: `photography/index.html`
- Modify: `js/app.js` (add `renderPhotography`, `photoSources`, `plateFigure`; wire into boot)
- Modify: `js/data.js` (document + add optional `exif` to the photo entries)
- Modify: `css/styles.css` (append section 13)

**Interfaces:**
- Consumes: `cloudReady()`, `cldUrl(publicId, w, extra)` from Task 4; chrome/motion from Task 1
- Produces: `photoSources(p) → {src, srcset, sizes, blur} | null`, module-level `plateImages` array (`{index, figure}` refs) — **Task 6's lightbox consumes both**, and each plate `figure` element gets class `plate` with a `data-idx` attribute Task 6 reads

- [ ] **Step 1: Create `photography/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

  <title>Photography — Saurav Sudhar</title>
  <meta name="description" content="Deep Field — landscape, architecture, and the behaviour of light. Photography by Saurav Sudhar." />
  <meta name="author" content="Saurav Sudhar" />
  <meta name="theme-color" content="#0B0A08" />
  <meta name="color-scheme" content="dark" />

  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src https://fonts.gstatic.com;
    img-src 'self' data: https://res.cloudinary.com;
    connect-src 'self';
    base-uri 'self';
    form-action 'none';
    object-src 'none';
  " />
  <meta name="referrer" content="strict-origin-when-cross-origin" />

  <meta property="og:type" content="website" />
  <meta property="og:title" content="Photography — Saurav Sudhar" />
  <meta property="og:description" content="Deep Field — landscape, architecture, and the behaviour of light." />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..500;1,9..144,300..400&family=IBM+Plex+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" />
  <link rel="stylesheet" href="../css/styles.css" />

  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230B0A08'/><circle cx='50' cy='50' r='30' fill='none' stroke='%23E09236' stroke-width='7'/><circle cx='50' cy='50' r='9' fill='%23E09236'/></svg>" />

  <style>html{background:#0B0A08;color-scheme:dark}</style>
  <script src="../js/data.js"></script>
</head>

<body data-page="photography">
  <noscript>
    <p class="noscript">This site renders its content with JavaScript.
    Reach me at sauravsnair99@gmail.com.</p>
  </noscript>

  <div class="glow" id="glow" aria-hidden="true"></div>
  <div class="grain" aria-hidden="true"></div>

  <a class="skip-link" href="#plates">Skip to content</a>

  <header class="site-head" id="site-head"></header>

  <main>
    <section class="section page-head" aria-labelledby="photo-title">
      <div class="wrap wrap--narrow">
        <p class="section-label mono-label reveal">DEEP FIELD</p>
        <h1 class="section-title serif reveal" id="photo-title" style="--d:80ms">Photography</h1>
        <p class="page-sub mono-label reveal" id="photo-sub" style="--d:160ms"></p>
      </div>
    </section>

    <section class="plates-wrap" aria-label="Photographs">
      <div class="wrap wrap--narrow">
        <div class="plates" id="plates"></div>
        <p class="plates-foot reveal">
          <a class="link-line" id="photo-instagram" href="#" target="_blank" rel="noopener noreferrer">Full stream on Instagram</a>
        </p>
      </div>
    </section>
  </main>

  <footer class="site-foot" id="site-foot"></footer>

  <script type="module" src="../js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Update the photo entries in `js/data.js`**

Two small edits inside the `photography` block — the ten entries otherwise stay as-is until Saurav fills real data.

1. Add this to the comment block above the `photos` array (after the `ratio` explanation):

```
     `exif` (optional) is a short technical line shown under the plate,
     e.g. "24mm · f/8 · 1/60 · ISO 100". Omit it and only the caption shows.
```

2. Add an `exif` example to the first entry only:

```js
      { publicId: "portfolio/photo-01", ratio: 1.5,  caption: "Northern fells, first light",
        exif: "24mm · f/8 · 1/60 · ISO 100" },
```

- [ ] **Step 3: Add gallery rendering to `js/app.js`**

Add below the `/* ---- images ---- */` helpers:

```js
/** Resolve responsive sources for a photo, or null when no image is available.
    publicId may be a Cloudinary public ID, a full URL, or a root-relative
    same-origin path (e.g. "/test.jpg") — the latter two are used as-is. */
function photoSources(p) {
  if (/^(https?:\/\/|\/)/.test(p.publicId)) {
    return { src: p.publicId, srcset: null, sizes: null, blur: null };
  }
  if (!cloudReady()) return null;
  return {
    src: cldUrl(p.publicId, 1200),
    srcset: [480, 800, 1200, 1600].map((w) => `${cldUrl(p.publicId, w)} ${w}w`).join(", "),
    sizes: "(max-width: 900px) 92vw, 820px",
    blur: cldUrl(p.publicId, 60, ",e_blur:800,q_1"),
  };
}

/** Plate figures in DOM order; the lightbox (Task 6) navigates this. */
const plateImages = [];

function plateFigure(p, num, idx) {
  const fig = el("figure", "plate");
  fig.dataset.idx = String(idx);

  const frame = el("div", "plate-frame");
  frame.style.aspectRatio = String(p.ratio || 1.5);

  const s = photoSources(p);
  if (s) {
    const img = el("img");
    img.alt = p.caption || "Photograph";
    img.decoding = "async";
    img.loading = num > 2 ? "lazy" : "eager";
    if (s.blur) {
      frame.classList.add("is-blur");
      frame.style.backgroundImage = `url("${s.blur}")`;
      img.addEventListener("load", () => frame.classList.add("is-loaded"), { once: true });
    }
    img.addEventListener("error", () => {
      frame.replaceChildren();
      frame.classList.remove("is-blur");
      frame.classList.add("plate-pending");
    }, { once: true });
    img.src = s.src;
    if (s.srcset) { img.srcset = s.srcset; img.sizes = s.sizes; }
    frame.append(img);
  } else {
    frame.classList.add("plate-pending");
  }

  const cap = el("figcaption", "plate-cap");
  cap.append(el("span", "mono-label plate-num",
    `PLATE ${String(num).padStart(2, "0")} — ${(p.caption || "").toUpperCase()}`));
  if (p.exif) cap.append(el("span", "mono-label plate-exif", p.exif));

  fig.append(frame, cap);
  plateImages.push({ index: idx, figure: fig });
  return fig;
}

function renderPhotography() {
  document.getElementById("photo-sub").textContent =
    `${D.photography.photos.length} PLATES · ${D.photography.gear.toUpperCase()} · LANDSCAPE / ARCHITECTURE / LIGHT`;

  const ig = document.getElementById("photo-instagram");
  ig.href = D.photography.instagram;

  const wrap = document.getElementById("plates");
  const photos = D.photography.photos;
  let i = 0;
  let plateNo = 1;
  while (i < photos.length) {
    const p = photos[i];
    const next = photos[i + 1];
    if (p.ratio < 1 && next && next.ratio < 1) {
      const pair = el("div", "plate-pair reveal");
      pair.append(plateFigure(p, plateNo++, i), plateFigure(next, plateNo++, i + 1));
      wrap.append(pair);
      i += 2;
    } else {
      const fig = plateFigure(p, plateNo++, i);
      fig.classList.add("reveal");
      wrap.append(fig);
      i += 1;
    }
  }
}
```

And in the boot block at the bottom, after `if (PAGE === "home") renderHome();` add:

```js
  if (PAGE === "photography") renderPhotography();
```

- [ ] **Step 4: Append section 13 to `css/styles.css`**

```css
/* ---- 13 · photography / plates ------------------------------------------------ */
.page-head { padding-block: clamp(3rem, 9vh, 6rem) clamp(1rem, 3vh, 2rem); }
.page-sub { margin: 1rem 0 0; }

.plates {
  display: flex;
  flex-direction: column;
  gap: clamp(2.5rem, 6vh, 4.5rem);
}

.plate { margin: 0; }

.plate-frame {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 2px;
  background-color: var(--bg-raised);
  background-size: cover;
  background-position: center;
}
.plate-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.plate-frame.is-blur img { opacity: 0; transition: opacity .6s ease; }
.plate-frame.is-blur.is-loaded img { opacity: 1; }

.plate-frame.plate-pending {
  border: 1px solid var(--hairline);
  background-color: transparent;
}
.plate-frame.plate-pending::after {
  content: "PLATE PENDING";
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-family: var(--mono);
  font-size: .65rem;
  letter-spacing: .18em;
  color: var(--text-dim);
}

.plate-cap {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: .7rem;
}
.plate-exif { color: var(--text-dim); opacity: .8; }

.plate-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(1rem, 2.5vw, 1.8rem);
}
@media (max-width: 560px) { .plate-pair { grid-template-columns: 1fr; gap: 2.5rem; } }

.plates-foot { margin-top: clamp(2.5rem, 6vh, 4rem); }
```

- [ ] **Step 5: Verify in browser**

Load `http://localhost:8000/photography/`. With `cloudName` still unset, confirm: header/footer chrome identical to home, "Photography" nav link amber (`aria-current`), page head reads "DEEP FIELD / Photography / 10 PLATES · NIKON Z50 II · …". Ten plates render as hairline "PLATE PENDING" boxes with correct aspect ratios; with today's data the three portrait photos (02/06/09) are never adjacent, so no pairs form — expected. Captions read `PLATE 01 — NORTHERN FELLS, FIRST LIGHT` with the EXIF sample right-aligned on plate 01. Instagram link at the foot. No layout shift, no console errors.

Then prove the real-image branch with a same-origin file: copy any JPEG to the repo root as `test.jpg`, set the first entry's `publicId` to `"/test.jpg"` in `js/data.js`, reload — plate 01 shows the image (root-relative paths pass the `/^(https?:\/\/|\/)/` check and `img-src 'self'` allows them). Revert the `publicId` and delete `test.jpg` before committing.

- [ ] **Step 6: Commit**

```bash
git add photography/index.html js/app.js js/data.js css/styles.css
git commit -m "feat: photography page — plates gallery with Cloudinary blur-up

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Lightbox

**Files:**
- Modify: `photography/index.html` (add lightbox markup before the footer)
- Modify: `js/app.js` (add lightbox controller; make plates clickable)
- Modify: `css/styles.css` (append section 14)

**Interfaces:**
- Consumes: `photoSources()`, `plateImages`, `plate` figures with `data-idx` (Task 5); `el()` (Task 1)
- Produces: nothing later tasks depend on

- [ ] **Step 1: Add lightbox markup to `photography/index.html`** (immediately before `<footer …>`)

```html
  <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Photograph viewer" hidden>
    <button class="lb-close" id="lb-close" type="button" aria-label="Close viewer">✕</button>
    <button class="lb-nav lb-prev" id="lb-prev" type="button" aria-label="Previous photograph">‹</button>
    <figure class="lb-figure">
      <img id="lb-img" alt="" />
      <figcaption class="lb-cap mono-label" id="lb-cap"></figcaption>
    </figure>
    <button class="lb-nav lb-next" id="lb-next" type="button" aria-label="Next photograph">›</button>
  </div>
```

- [ ] **Step 2: Add the lightbox controller to `js/app.js`** (below `renderPhotography`)

```js
/* ---- lightbox ---------------------------------------------------------------- */
function initLightbox() {
  const box = document.getElementById("lightbox");
  if (!box) return;
  const img = document.getElementById("lb-img");
  const cap = document.getElementById("lb-cap");
  const btnClose = document.getElementById("lb-close");
  const btnPrev = document.getElementById("lb-prev");
  const btnNext = document.getElementById("lb-next");

  let current = -1;
  let returnFocus = null;

  /** Photos that actually have an image (placeholders are not viewable). */
  const viewable = () => D.photography.photos
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => photoSources(p) !== null);

  function show(listPos) {
    const list = viewable();
    if (!list.length) return;
    const pos = ((listPos % list.length) + list.length) % list.length;
    current = pos;
    const { p, i } = list[pos];
    const s = photoSources(p);
    img.src = s.src;
    if (s.srcset) { img.srcset = s.srcset; img.sizes = "92vw"; } else { img.removeAttribute("srcset"); }
    img.alt = p.caption || "Photograph";
    cap.textContent = [`PLATE ${String(i + 1).padStart(2, "0")} — ${(p.caption || "").toUpperCase()}`, p.exif]
      .filter(Boolean).join("   ·   ");
  }

  function open(photoIndex) {
    const list = viewable();
    const pos = list.findIndex(({ i }) => i === photoIndex);
    if (pos === -1) return;
    returnFocus = document.activeElement;
    box.hidden = false;
    document.body.style.overflow = "hidden";
    show(pos);
    btnClose.focus();
  }

  function close() {
    box.hidden = true;
    document.body.style.overflow = "";
    if (returnFocus) returnFocus.focus();
  }

  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", () => show(current - 1));
  btnNext.addEventListener("click", () => show(current + 1));
  box.addEventListener("click", (e) => { if (e.target === box) close(); });

  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(current - 1);
    else if (e.key === "ArrowRight") show(current + 1);
    else if (e.key === "Tab") {
      /* focus trap across the three buttons */
      const focusables = [btnClose, btnPrev, btnNext];
      const idx = focusables.indexOf(document.activeElement);
      e.preventDefault();
      const next = e.shiftKey
        ? focusables[(idx - 1 + focusables.length) % focusables.length]
        : focusables[(idx + 1) % focusables.length];
      next.focus();
    }
  });

  /* make plates that have an image clickable + keyboard-operable */
  for (const { index, figure } of plateImages) {
    if (photoSources(D.photography.photos[index]) === null) continue;
    const frame = figure.querySelector(".plate-frame");
    frame.tabIndex = 0;
    frame.setAttribute("role", "button");
    frame.setAttribute("aria-label", `View ${D.photography.photos[index].caption || "photograph"}`);
    frame.style.cursor = "zoom-in";
    frame.addEventListener("click", () => open(index));
    frame.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(index); }
    });
  }
}
```

And in the boot block, change the photography line to:

```js
  if (PAGE === "photography") { renderPhotography(); initLightbox(); }
```

- [ ] **Step 3: Append section 14 to `css/styles.css`**

```css
/* ---- 14 · lightbox -------------------------------------------------------------- */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: clamp(1rem, 4vw, 3rem);
  background: rgba(6, 5, 4, .94);
}

.lb-figure {
  margin: 0;
  max-width: min(92vw, 1400px);
  max-height: 100%;
  display: flex;
  flex-direction: column;
  gap: .8rem;
}
.lb-figure img {
  max-width: 100%;
  max-height: 80vh;
  width: auto;
  height: auto;
  margin-inline: auto;
}
.lb-cap { text-align: center; }

.lb-close, .lb-nav {
  background: none;
  border: 1px solid var(--hairline);
  border-radius: 3px;
  color: var(--text);
  font-size: 1.1rem;
  line-height: 1;
  padding: .55rem .75rem;
  cursor: pointer;
  transition: border-color .2s ease, color .2s ease;
}
.lb-close:hover, .lb-nav:hover { border-color: var(--accent); color: var(--accent-bright); }

.lb-close { position: absolute; top: 1rem; right: 1rem; }

@media (max-width: 640px) {
  .lb-nav { position: absolute; bottom: 1rem; }
  .lb-prev { left: 1rem; }
  .lb-next { right: 1rem; }
}
```

- [ ] **Step 4: Verify in browser**

With `cloudName` unset all plates are placeholders, so the lightbox has nothing viewable — verify it stays closed (placeholder frames are not clickable, no `role="button"`, no zoom cursor).

Then exercise the full flow with the same `test.jpg` technique as Task 5 Step 5 (repo-root JPEG, `publicId: "/test.jpg"`): plate 01 renders the image; click opens the lightbox; ←/→ wrap around (with a single viewable image the plate stays put); Esc closes and focus returns to the plate frame; Tab cycles close/prev/next only while open. Revert the `publicId` and delete `test.jpg` before committing.

- [ ] **Step 5: Commit**

```bash
git add photography/index.html js/app.js css/styles.css
git commit -m "feat: keyboard-navigable lightbox with focus trap

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Books page — Marginalia

**Files:**
- Create: `books/index.html`
- Modify: `js/app.js` (add `renderBooks`; wire into boot)
- Modify: `js/data.js` (document optional `year` on finished entries)
- Modify: `css/styles.css` (append section 15)

**Interfaces:**
- Consumes: chrome/motion/helpers from Task 1; `D.reading.current[]`, `D.reading.finished[]` (`{title, author, tag, note?, year?}`)
- Produces: nothing later tasks depend on

- [ ] **Step 1: Create `books/index.html`**

Full file content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

  <title>Books — Saurav Sudhar</title>
  <meta name="description" content="A shelf, not a table — what Saurav Sudhar is reading and has read." />
  <meta name="author" content="Saurav Sudhar" />
  <meta name="theme-color" content="#0B0A08" />
  <meta name="color-scheme" content="dark" />

  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src https://fonts.gstatic.com;
    img-src 'self' data: https://res.cloudinary.com;
    connect-src 'self';
    base-uri 'self';
    form-action 'none';
    object-src 'none';
  " />
  <meta name="referrer" content="strict-origin-when-cross-origin" />

  <meta property="og:type" content="website" />
  <meta property="og:title" content="Books — Saurav Sudhar" />
  <meta property="og:description" content="A shelf, not a table — what Saurav Sudhar is reading and has read." />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..500;1,9..144,300..400&family=IBM+Plex+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" />
  <link rel="stylesheet" href="../css/styles.css" />

  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230B0A08'/><circle cx='50' cy='50' r='30' fill='none' stroke='%23E09236' stroke-width='7'/><circle cx='50' cy='50' r='9' fill='%23E09236'/></svg>" />

  <style>html{background:#0B0A08;color-scheme:dark}</style>
  <script src="../js/data.js"></script>
</head>

<body data-page="books">
  <noscript>
    <p class="noscript">This site renders its content with JavaScript.
    Reach me at sauravsnair99@gmail.com.</p>
  </noscript>

  <div class="glow" id="glow" aria-hidden="true"></div>
  <div class="grain" aria-hidden="true"></div>

  <a class="skip-link" href="#shelves">Skip to content</a>

  <header class="site-head" id="site-head"></header>

  <main>
    <section class="section page-head" aria-labelledby="books-title">
      <div class="wrap wrap--narrow">
        <p class="section-label mono-label reveal">THE ARCHIVE</p>
        <h1 class="section-title serif reveal" id="books-title" style="--d:80ms">Books</h1>
        <p class="page-sub mono-label reveal" id="books-count" style="--d:160ms"></p>
      </div>
    </section>

    <section class="shelves" id="shelves" aria-label="Reading list">
      <div class="wrap wrap--narrow">
        <p class="shelf-label mono-label reveal">▍ IN PROGRESS</p>
        <ul class="shelf shelf--current" id="shelf-current"></ul>
        <p class="shelf-label mono-label reveal">▍ FINISHED</p>
        <ul class="shelf shelf--finished" id="shelf-finished"></ul>
      </div>
    </section>
  </main>

  <footer class="site-foot" id="site-foot"></footer>

  <script type="module" src="../js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Document `year` in `js/data.js`**

In the READING comment block, extend the note line to:

```
     READING — two shelves. `note` is optional and shown small, in your voice.
     `year` (optional, number) on finished books: when EVERY finished entry
     has one, the shelf groups by year, newest first; otherwise one flat list.
```

Data entries stay unchanged (no invented years).

- [ ] **Step 3: Add `renderBooks` to `js/app.js`** (below the lightbox block)

```js
/* ---- books ---------------------------------------------------------------------- */
function bookCurrent(b, i) {
  const li = el("li", "book-current reveal");
  li.style.setProperty("--d", `${i * 80}ms`);
  const head = el("div", "book-head");
  head.append(
    el("span", "book-title serif", b.title),
    el("span", "book-tag mono-label", b.tag || "")
  );
  li.append(head, el("p", "book-author", b.author));
  if (b.note) li.append(el("p", "book-note serif", `“${b.note}”`));
  return li;
}

function bookRow(b, i) {
  const li = el("li", "book-row reveal");
  li.style.setProperty("--d", `${(i % 8) * 60}ms`);
  const line = el("div", "book-row-line");
  const t = el("span", "book-row-title serif", b.title);
  t.append(el("span", "book-row-author", ` — ${b.author}`));
  line.append(t, el("span", "book-tag mono-label", b.tag || ""));
  li.append(line);
  if (b.note) li.append(el("p", "book-note book-note--small serif", `“${b.note}”`));
  return li;
}

function renderBooks() {
  const current = D.reading.current;
  const finished = D.reading.finished;

  document.getElementById("books-count").textContent =
    `A SHELF, NOT A TABLE · ${current.length + finished.length} VOLUMES`;

  const cur = document.getElementById("shelf-current");
  current.forEach((b, i) => cur.append(bookCurrent(b, i)));

  const fin = document.getElementById("shelf-finished");
  const grouped = finished.length > 0 && finished.every((b) => b.year);
  if (grouped) {
    const years = [...new Set(finished.map((b) => b.year))].sort((a, b) => b - a);
    for (const y of years) {
      const yl = el("li", "shelf-year reveal");
      yl.append(el("span", "mono-label", String(y)));
      fin.append(yl);
      finished.filter((b) => b.year === y).forEach((b, i) => fin.append(bookRow(b, i)));
    }
  } else {
    finished.forEach((b, i) => fin.append(bookRow(b, i)));
  }
}
```

And in the boot block add:

```js
  if (PAGE === "books") renderBooks();
```

- [ ] **Step 4: Append section 15 to `css/styles.css`**

```css
/* ---- 15 · books / marginalia ------------------------------------------------------ */
.shelves { padding-bottom: clamp(3rem, 8vh, 5rem); }

.shelf { list-style: none; margin: 0 0 clamp(2.5rem, 6vh, 4rem); padding: 0; }
.shelf-label { color: var(--accent); margin: 0 0 .5rem; }

.book-current {
  padding: 1.4rem 0 1.2rem;
  border-bottom: 1px solid rgba(224, 146, 54, .16);
}
.book-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
}
.book-title { font-size: 1.4rem; font-weight: 400; }
.book-tag { color: var(--accent); }
.book-author { margin: .2rem 0 0; font-size: .85rem; color: var(--text-dim); }

.book-note {
  margin: .9rem 0 0;
  padding-left: 1rem;
  border-left: 2px solid rgba(224, 146, 54, .4);
  font-style: italic;
  color: var(--text-dim);
  font-size: 1rem;
  max-width: 34rem;
}
.book-note--small { font-size: .9rem; margin-top: .5rem; }

.book-row { padding: .85rem 0; border-bottom: 1px solid var(--hairline); }
.book-row-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
}
.book-row-title { font-size: 1.05rem; font-weight: 400; }
.book-row-author { font-family: var(--sans); font-size: .82rem; color: var(--text-dim); }

.shelf-year { padding: 1.6rem 0 .4rem; }
.shelf-year .mono-label { color: var(--accent); }
```

- [ ] **Step 5: Verify in browser**

Load `http://localhost:8000/books/`. Confirm: "THE ARCHIVE / Books / A SHELF, NOT A TABLE · 10 VOLUMES". IN PROGRESS: Kleppmann and Powers with serif titles, mono tags, italic amber-ruled notes. FINISHED: eight compressed ruled rows (flat list — entries have no `year`), tags right-aligned, "On Photography" and the rest present. Nav "Books" is amber. Mobile width: rows wrap gracefully. No console errors.

- [ ] **Step 6: Commit**

```bash
git add books/index.html js/app.js js/data.js css/styles.css
git commit -m "feat: books page — marginalia reading list

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Parallax, responsive & design-polish pass

**Files:**
- Modify: `js/app.js` (add `initParallax`; wire into boot)
- Modify: `css/styles.css` (append section 16 + any fixes found)

**Interfaces:**
- Consumes: `.glow` element + `--par` CSS var (Task 1)
- Produces: final visual state

- [ ] **Step 1: Add `initParallax` to `js/app.js`**

```js
/* ---- parallax --------------------------------------------------------------------- */
function initParallax() {
  const glow = document.getElementById("glow");
  if (!glow || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      /* glow drifts up slowly as you descend — max ~60px */
      glow.style.setProperty("--par", String(Math.min(scrollY * 0.06, 60) * -1));
      ticking = false;
    });
  }, { passive: true });
}
```

Boot block: call `initParallax();` after `initReveals();` — all three pages have `<div class="glow" id="glow">`.

- [ ] **Step 2: Append section 16 to `css/styles.css`**

```css
/* ---- 16 · responsive polish --------------------------------------------------------- */
@media (max-width: 640px) {
  .hero { min-height: 72vh; }
  .hero-statement { font-size: clamp(2.2rem, 11vw, 3.2rem); }
  .feat-manifest { gap: .4rem 1.6rem; }
  .colophon { flex-direction: column; gap: .2rem; }
}

@media (min-width: 1600px) {
  :root { --wrap: 1180px; }
}
```

- [ ] **Step 3: Design-polish pass (frontend-design-driven)**

With the `frontend-design:frontend-design` skill loaded, view every page at 375px, 768px, and 1440px widths and fix what reads wrong, editing `css/styles.css` in place. Checklist to judge against (from the spec):

- Negative space: sections breathe; nothing cramped against the header.
- Hierarchy: mono labels clearly subordinate; serif display clearly dominant; the amber accent appears only where it means something.
- The glow reads as *light*, not as a colored blob — tune alpha/position if not.
- Hover states all transition smoothly (~200ms); focus rings visible on dark.
- The three pages feel like one site: same chrome, same rhythm, same label grammar.

- [ ] **Step 4: Verify the full motion & reduced-motion matrix**

- Normal: reveals stagger on scroll on all three pages; glow drifts on scroll; blur-up path present (placeholder plates excluded).
- `prefers-reduced-motion: reduce` (devtools emulation): everything visible immediately, glow static, zero transitions.
- Keyboard: tab through home top-to-bottom — skip link appears first, every link/button reachable, focus visible throughout.

- [ ] **Step 5: Commit**

```bash
git add js/app.js css/styles.css photography/index.html books/index.html
git commit -m "feat: glow parallax + responsive and design polish pass

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: README, .gitignore, final verification

**Files:**
- Rewrite: `README.md`
- Create: `.gitignore`

**Interfaces:**
- Consumes: everything
- Produces: the finished branch, ready for the finishing-a-development-branch skill

- [ ] **Step 1: Create `.gitignore`**

```gitignore
.superpowers/
.claude/settings.local.json
.DS_Store
```

- [ ] **Step 2: Rewrite `README.md`**

```markdown
# Saurav Sudhar — Portfolio

**"TUNGSTEN."** A dark, cinematic portfolio — engineering precision meets
night-photography atmosphere. Grandeur through lighting, negative space, and
typography; one restrained tungsten-amber accent against warm near-black.

Built with **vanilla HTML, CSS, and JavaScript — no framework, no build step.**

```
portfolio/
├── index.html              # home — the professional portfolio
├── photography/index.html  # Deep Field — plates gallery + lightbox
├── books/index.html        # The Archive — annotated reading list
├── css/styles.css          # the entire design system, one sectioned file
├── js/
│   ├── data.js             # ← ALL content lives here. Edit this, nothing else.
│   └── app.js              # renderer — fills the pages from data.js
└── README.md
```

## ✦ The one rule

**To change any content, edit [`js/data.js`](js/data.js) only.** The pages
read from the `DATA` object and render themselves. Every section is commented
in that file.

## Running locally

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Photography (Cloudinary)

1. Create a free [Cloudinary](https://cloudinary.com) account; copy your
   **Cloud name** from the dashboard into `photography.cloudName` in
   `js/data.js`.
2. Upload photos; for each, add an entry to `photography.photos`:
   `{ publicId: "portfolio/derwent-water", ratio: 1.5, caption: "…", exif: "24mm · f/8 · 1/60 · ISO 100" }`
   — `ratio` is width ÷ height; `exif` is optional.
3. Until then, plates render as quiet "PLATE PENDING" frames.

The site builds responsive `f_auto,q_auto` URLs with blur-up loading for you.

## Design system

- **Type:** Fraunces (display serif) · IBM Plex Sans (body) · JetBrains Mono
  (labels, EXIF, statuses — the "precision marginalia" layer).
- **Color:** near-black `#0B0A08`, warm off-white `#EDE7DC`, one accent:
  tungsten amber `#E09236`. All pairs pass WCAG AA.
- **Motion:** scroll reveals, hero-glow parallax, link sweeps, image blur-up —
  and nothing else. Fully disabled under `prefers-reduced-motion`.
- **Security:** strict CSP (`script-src 'self'`), no third-party runtime JS,
  no `innerHTML` for data, `noopener noreferrer` on outbound links.
- **Accessibility:** semantic landmarks, skip links, keyboard-operable nav
  and lightbox (focus trap, Esc, arrows), visible focus, `<noscript>` fallback.

## Deploying

Static files — GitHub Pages (`main` / root) or drop the folder on Netlify.

*Spec: `docs/superpowers/specs/2026-07-11-tungsten-redesign-design.md`.*
```

- [ ] **Step 3: Run the spec §8 verification checklist end-to-end**

1. `python3 -m http.server 8000` — walk `/`, `/photography/`, `/books/` at 1440 / 768 / 375 widths.
2. Keyboard-only pass on all pages (skip link, nav toggle at mobile width, lightbox when an image exists).
3. Reduced-motion emulation pass.
4. No-JS pass: noscript notice shows; no broken half-rendered chrome.
5. Placeholder pass: `cloudName` unset → pending plates, doorway falls back to raised band.
6. Contrast spot-checks in devtools: `#EDE7DC`/`#0B0A08`, `#8A8478`/`#0B0A08`, `#E09236`/`#0B0A08` — all ≥ 4.5:1.
7. `git grep -n "space.js\|EVENT HORIZON\|console__\|hud\|boot__"` — expect matches only in `docs/` and git history, none in live code.

Fix anything found; re-run the failing check.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "docs: rewrite README for Tungsten; add .gitignore

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Post-plan notes

- **Open items owned by Saurav (not blockers, survive after Task 9):** set
  `photography.cloudName` + real photo `publicId`s/captions/`exif`; real
  Instagram URL in `site.socials.instagram` and `photography.instagram`;
  verify LinkedIn URL; optional `year` values on finished books.
- **Integration:** after Task 9, use superpowers:finishing-a-development-branch
  (branch `version2` → merge/PR decision is Saurav's).
