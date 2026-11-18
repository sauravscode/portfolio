/* ============================================================================
   core.js — shared helpers, chrome (header/footer), clock, status and
   activity-bar logic. Page modules import from here.

   Rules: all DOM text goes in through textContent; HTML strings are never
   parsed. URLs from data pass through safeUrl() before they reach an href.
   ========================================================================== */

export const D = typeof window !== "undefined" ? window.DATA || null : null;
export const PAGE =
  typeof document !== "undefined" && document.body
    ? document.body.dataset.page || "home"
    : "home";
export const ROOT = PAGE === "home" ? "" : "../";

/* ---- tiny DOM helpers ------------------------------------------------------ */

/** Create an element with an optional class and text. */
export function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

/** Render "text with {{accented}} phrases" as text + <em class="accent">. */
export function accentify(target, value) {
  if (!target) return target;
  String(value == null ? "" : value)
    .split(/\{\{|\}\}/)
    .forEach((part, i) => {
      if (!part) return;
      if (i % 2) target.appendChild(el("em", "accent", part));
      else target.appendChild(document.createTextNode(part));
    });
  return target;
}

/* ---- URLs ------------------------------------------------------------------ */

/**
 * Allow only https:, mailto:, or a relative path (no scheme).
 * Returns null for anything else (javascript:, data:, protocol-relative, ...).
 */
export function safeUrl(url) {
  if (typeof url !== "string") return null;
  const raw = url.trim();
  if (!raw) return null;
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null;
  if (raw.startsWith("//") || raw.includes("\\")) return null;

  if (/^https:\/\//i.test(raw)) return raw;
  if (/^mailto:/i.test(raw)) return raw;
  if (raw.startsWith("/") || raw.startsWith("../") || raw.startsWith("./")) return raw;

  // A bare relative path ("photography/", "index.html#contact") has no scheme.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) return raw;
  return null;
}

/** Outbound link with rel="noopener noreferrer"; null when the URL is unsafe. */
export function extLink(cls, label, href) {
  const url = safeUrl(href);
  if (!url) return null;
  const a = el("a", cls, label);
  a.href = url;
  a.rel = "noopener noreferrer";
  if (/^https:\/\//i.test(url)) a.target = "_blank";
  return a;
}

/* ---- status metadata ------------------------------------------------------- */

const STATUS_META = {
  operational: { glyph: "●", label: "Operational" },
  active: { glyph: "◐", label: "Active" },
  complete: { glyph: "○", label: "Complete" },
  away: { glyph: "○", label: "Away" },
};

/** { glyph, label } for a status level. Glyph is distinct from the label text. */
export function statusMeta(level) {
  const key = String(level == null ? "" : level).toLowerCase();
  if (STATUS_META[key]) return { ...STATUS_META[key] };
  return {
    glyph: "○",
    label: key ? key.charAt(0).toUpperCase() + key.slice(1) : "Unknown",
  };
}

/* ---- clock / on-call ------------------------------------------------------- */

const WEEKDAY = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function cityName(site) {
  return String((site && site.locationLabel) || "Leeds").split(",")[0].trim();
}

function zonedParts(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
    }).formatToParts(date);
    const out = {};
    for (const part of parts) out[part.type] = part.value;
    return out;
  } catch (err) {
    return null;
  }
}

/**
 * On-call indicator for a given moment.
 * Returns { on: boolean, label: "On shift · 14:32 Leeds" } or null when the
 * availability data / timezone cannot be interpreted (the UI then hides).
 */
export function onCall(date = new Date(), site = D && D.site) {
  if (!site || !site.availability || !site.timezone) return null;
  const { hours, days } = site.availability;
  if (!Array.isArray(hours) || hours.length !== 2) return null;
  if (!Array.isArray(days) || days.length === 0) return null;

  const open = Number(hours[0]);
  const close = Number(hours[1]);
  if (!Number.isFinite(open) || !Number.isFinite(close) || open === close) return null;

  const when = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(when.getTime())) return null;

  const p = zonedParts(when, site.timezone);
  if (!p) return null;

  const hour = Number(p.hour);
  const minute = Number(p.minute);
  const day = WEEKDAY[p.weekday];
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || !day) return null;

  const now = `${pad2(hour)}:${pad2(minute)}`;
  const city = cityName(site);
  const works = new Set(days.map(Number));
  const workingDay = works.has(day);
  const inHours = hour >= open && hour < close;

  if (workingDay && inHours) {
    return { on: true, label: `On shift · ${now} ${city}` };
  }

  // Next shift start: same day if it is still ahead, otherwise the next
  // working day from availability.days (ISO 1–7), wrapping around the week.
  const beforeOpen = hour * 60 + minute < open * 60;
  let next = null;
  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = ((day - 1 + offset) % 7) + 1;
    if (!works.has(candidate)) continue;
    if (offset === 0 && !beforeOpen) continue;
    next = { day: candidate, offset };
    break;
  }

  if (!next) {
    return { on: false, label: `Off shift · back ${pad2(open)}:00 ${city}` };
  }

  const prefix = next.offset === 0 ? "" : `${DAY_NAMES[next.day - 1]} `;
  return {
    on: false,
    label: `Off shift · back ${prefix}${pad2(open)}:00 ${city}`,
  };
}

/* ---- activity bar ---------------------------------------------------------- */

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "YYYY-MM" → absolute month index, or null. */
export function monthIndex(value) {
  if (typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return year * 12 + (month - 1);
}

/** Absolute month indices from `a` to `b` inclusive, oldest → newest. */
export function monthsBetween(a, b) {
  const start = monthIndex(a);
  const end = monthIndex(b);
  if (start === null || end === null || end < start) return [];
  const out = [];
  for (let m = start; m <= end; m += 1) out.push(m);
  return out;
}

function formatMonth(index) {
  return `${MONTH_NAMES[index % 12]} ${Math.floor(index / 12)}`;
}

/**
 * 30-cell activity bar for a service.
 * Returns { cells: boolean[], label } where cells[0] is the oldest month and
 * label is suitable for aria-label. An invalid start (or an end before the
 * start) yields an empty bar and "Activity dates not set".
 *
 * @param {string} start  "YYYY-MM"
 * @param {string|null} end  "YYYY-MM" or null/undefined for ongoing
 * @param {Date} [now]
 * @param {number} [count]
 */
export function activityCells(start, end, now = new Date(), count = 30) {
  const size = Number.isFinite(count) && count > 0 ? Math.floor(count) : 30;
  const empty = Array.from({ length: size }, () => false);
  const startIndex = monthIndex(start);
  if (startIndex === null) return { cells: empty, label: "Activity dates not set" };

  const when = now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
  const nowIndex = when.getFullYear() * 12 + when.getMonth();

  const ongoing = end == null || end === "";
  const endIndex = ongoing ? nowIndex : monthIndex(end);
  if (endIndex === null || endIndex < startIndex) {
    return { cells: empty, label: "Activity dates not set" };
  }

  const cells = empty.map((_, i) => {
    const month = nowIndex - (size - 1) + i;
    return month >= startIndex && month <= endIndex;
  });

  const label = `Active ${formatMonth(startIndex)} to ${
    ongoing ? "present" : formatMonth(endIndex)
  }`;
  return { cells, label };
}

/* ---- header ---------------------------------------------------------------- */

/** Build the shared header into #site-head. `page` is "home"|"photography"|"books". */
export function renderHeader(page = PAGE) {
  const head = document.getElementById("site-head");
  if (!head) return;

  const inner = el("div", "wrap head-inner");

  const brand = el("a", "brand");
  brand.href = ROOT || "./";
  brand.setAttribute("aria-label", "Saurav Sudhar — status home");
  if (page === "home") brand.setAttribute("aria-current", "page");
  brand.append(
    el("span", null, "saurav.sudhar"),
    el("span", "brand-slash", "/"),
    el("span", null, "status")
  );

  const nav = el("nav", "nav");
  nav.id = "site-nav";
  nav.setAttribute("aria-label", "Primary");

  const links = [
    { label: "Services", href: `${ROOT}#services` },
    { label: "Runbook", href: `${ROOT}#runbook` },
    { label: "Exposures", href: `${ROOT}photography/`, page: "photography" },
    { label: "Dependencies", href: `${ROOT}books/`, page: "books" },
    { label: "Page on-call", href: `${ROOT}#contact` },
  ];
  for (const item of links) {
    const a = el("a", null, item.label);
    a.href = item.href;
    if (item.page && item.page === page) a.setAttribute("aria-current", "page");
    nav.append(a);
  }

  const actions = el("div", "head-actions");

  const navToggle = el("button", "nav-toggle", "Menu");
  navToggle.type = "button";
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-controls", "site-nav");

  const themeToggle = el("button", "theme-toggle");
  themeToggle.type = "button";

  actions.append(navToggle, themeToggle);
  inner.append(brand, nav, actions);
  head.append(inner);

  const currentTheme = () =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light";

  const syncThemeToggle = () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    themeToggle.textContent = next === "dark" ? "Dark" : "Light";
    const label = `Switch to ${next} theme`;
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
  };

  syncThemeToggle();

  themeToggle.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("theme", next);
    } catch (err) {
      /* Storage blocked: the toggle still works for this session. */
    }
    syncThemeToggle();
  });

  const setOpen = (open) => {
    head.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.textContent = open ? "Close" : "Menu";
  };

  navToggle.addEventListener("click", () => {
    setOpen(!head.classList.contains("is-open"));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && head.classList.contains("is-open")) {
      setOpen(false);
      navToggle.focus();
    }
  });
}

/* ---- footer ---------------------------------------------------------------- */

function startClock(node) {
  const site = D && D.site;
  if (!node || !site || !site.timezone) {
    if (node) node.hidden = true;
    return;
  }

  let fmt;
  try {
    fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: site.timezone,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (err) {
    node.hidden = true;
    return;
  }

  try {
    fmt.format(new Date());
  } catch (err) {
    // Some engines only reject an unknown zone when formatting.
    node.hidden = true;
    return;
  }

  const city = cityName(site);
  const tick = () => {
    const time = fmt.format(new Date());
    node.textContent = `${city} ${time}`;
    node.setAttribute("aria-label", `Local time in ${city}: ${time}`);
  };
  tick();
  window.setInterval(tick, 60_000);
}

/** Build the shared footer into #site-foot. */
export function renderFooter() {
  const foot = document.getElementById("site-foot");
  if (!foot) return;

  const inner = el("div", "wrap foot-inner");

  const meta = el("div", "foot-meta mono");
  if (D && D.site && D.site.updated) {
    meta.append(el("span", null, `Last updated ${D.site.updated}`));
  }
  const clock = el("span", "foot-clock");
  meta.append(clock);

  const socials = el("ul", "foot-socials");
  const labels = { github: "GitHub", linkedin: "LinkedIn", instagram: "Instagram" };
  if (D && D.site && D.site.socials) {
    for (const [name, href] of Object.entries(D.site.socials)) {
      const url = safeUrl(href);
      if (!url) continue;
      // A bare Instagram profile URL is a placeholder, so it is not shown.
      if (/^https:\/\/(www\.)?instagram\.com\/?$/i.test(url)) continue;
      const label = labels[name] || name.charAt(0).toUpperCase() + name.slice(1);
      const link = extLink("foot-social mono", label, url);
      if (!link) continue;
      const item = el("li");
      item.append(link);
      socials.append(item);
    }
  }

  inner.append(meta);
  if (socials.childElementCount) inner.append(socials);

  if (D && D.hero && D.hero.quote) {
    const epigraph = el("p", "foot-epigraph serif");
    epigraph.append(document.createTextNode(`\u201C${D.hero.quote}\u201D`));
    if (D.hero.quoteAuthor) {
      epigraph.append(
        document.createTextNode(" "),
        el("span", "foot-epigraph-author mono", `\u2014 ${D.hero.quoteAuthor}`)
      );
    }
    inner.append(epigraph);
  }

  foot.append(inner);
  startClock(clock);
}

/* ---- motion ---------------------------------------------------------------- */

/** Reveal-on-scroll. Under reduced motion (or no IO) elements appear at once. */
export function initReveals(root = document) {
  const items = Array.from(root.querySelectorAll(".reveal"));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach((node) => node.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  items.forEach((node) => io.observe(node));
}
