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

/* ---- home ---------------------------------------------------------------------- */
function renderHero() {
  document.getElementById("hero-eyebrow").textContent =
    `${D.site.locationLabel.toUpperCase()} · ${D.site.coordinates}`;
  accentify(document.getElementById("hero-statement"), D.hero.statement);
  document.getElementById("hero-deck").textContent = D.hero.deck;
}

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
    const item = el("div", "feat-manifest-item");
    item.append(
      el("dt", "mono-label", k),
      el("dd", "mono-label", String(v))
    );
    man.append(item);
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
