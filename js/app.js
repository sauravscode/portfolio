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
