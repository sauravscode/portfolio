/* ============================================================================
   home.js — Home: status banner, services, changelog, runbook, elsewhere and
   "Page the on-call".
   ----------------------------------------------------------------------------
   Everything is rendered from window.DATA. There are no invented metrics: the
   only numbers are counts of items in the data and the live clock. DOM text
   always goes through textContent (el()/accentify()); URLs always pass safeUrl()
   via extLink(). Optional fields that are missing render nothing at all.
   ========================================================================== */

import {
  D,
  ROOT,
  el,
  accentify,
  extLink,
  safeUrl,
  statusMeta,
  onCall,
  activityCells,
  monthIndex,
} from "./core.js";

/* ---- shared bits ---------------------------------------------------------- */

const LEVELS = ["operational", "active", "complete"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Normalise a status level, or "" when it is not one of the known levels. */
function levelOf(status) {
  const key = String(status == null ? "" : status).toLowerCase();
  return LEVELS.includes(key) ? key : "";
}

/** "YYYY-MM" → "Mar 2026" (or "" when the date cannot be read). */
function monthLabel(value) {
  const index = monthIndex(value);
  if (index === null) return "";
  return `${MONTHS[index % 12]} ${Math.floor(index / 12)}`;
}

/** Empty <div class="wrap"> inside a section; returns the wrapper. */
function mount(id) {
  const section = document.getElementById(id);
  if (!section) return null;
  const wrap = el("div", "wrap");
  section.replaceChildren(wrap);
  return wrap;
}

function sectionHead(eyebrow, title, sub, titleId) {
  const head = el("header", "sec-head reveal");
  if (eyebrow) head.append(el("p", "sec-eyebrow mono", eyebrow));
  const heading = el("h2", null, title);
  if (titleId) heading.id = titleId;
  head.append(heading);
  if (sub) head.append(el("p", "sec-sub mono", sub));
  return head;
}

/** Point a section's accessible name at its rendered <h2> (no duplicate labels). */
function labelSection(sectionId, titleId) {
  const section = document.getElementById(sectionId);
  if (!section || !document.getElementById(titleId)) return;
  section.removeAttribute("aria-label");
  section.setAttribute("aria-labelledby", titleId);
}

/** Status pill: distinct glyph (decorative) + visible text label. */
function statusPill(level, large) {
  const meta = statusMeta(level);
  const key = levelOf(level);
  const pill = el(
    "span",
    `pill${key ? ` pill--${key}` : ""}${large ? " pill--lg" : ""}`
  );
  const glyph = el("span", "pill-glyph", meta.glyph);
  glyph.setAttribute("aria-hidden", "true");
  pill.append(glyph, el("span", "pill-label", meta.label));
  return pill;
}

/** Pluralise a count label: countLabel(1, "exposure") → "1 exposure". */
function countLabel(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/* ============================================================================
   1. STATUS BANNER
   ========================================================================== */

function startOnCall(node) {
  if (!node) return;

  const dot = el("span", "oncall-dot");
  dot.setAttribute("aria-hidden", "true");
  const text = el("span", "oncall-text");
  node.append(dot, text);

  const tick = () => {
    const info = onCall(new Date(), D.site);
    if (!info) {
      // Unknown availability / timezone: hide the indicator entirely.
      node.hidden = true;
      text.textContent = "";
      return;
    }
    node.hidden = false;
    node.classList.toggle("is-on", Boolean(info.on));
    text.textContent = info.label;
  };

  tick();
  window.setInterval(tick, 60_000);
}

function renderStatus() {
  const wrap = mount("status");
  if (!wrap) return;

  const site = D.site || {};
  const hero = D.hero || {};
  const status = site.status || {};

  const kicker = el("p", "hero-kicker");
  if (status.level) kicker.append(statusPill(status.level, true));
  if (status.label) kicker.append(el("span", "hero-state", status.label));

  const onCallNode = el("span", "oncall mono");
  kicker.append(onCallNode);
  wrap.append(kicker);
  startOnCall(onCallNode);

  const name = hero.name || site.name || "";
  const role = hero.role || site.role || "";
  if (name || role) {
    const identity = el("p", "hero-name mono");
    if (name) identity.append(el("span", "hero-name-text", name));
    if (role) identity.append(el("span", "hero-role", ` · ${role}`));
    wrap.append(identity);
  }

  if (hero.statement) {
    const statement = el("h1", "hero-line serif");
    accentify(statement, hero.statement);
    wrap.append(statement);
  }

  if (hero.deck) wrap.append(el("p", "hero-deck", hero.deck));
}

/* ============================================================================
   2. SERVICES
   ========================================================================== */

const FILTERS = [
  { key: "all", label: "All" },
  { key: "operational", label: "Operational" },
  { key: "active", label: "Active" },
  { key: "complete", label: "Complete" },
];

function activityBar(start, end, level) {
  const { cells, label } = activityCells(start, end);
  const bar = el("span", `activity${level ? ` activity--${level}` : ""}`);
  bar.setAttribute("role", "img");
  bar.setAttribute("aria-label", label);
  for (const on of cells) {
    bar.append(el("span", `activity-cell${on ? " is-on" : ""}`));
  }
  return bar;
}

/** One <details class="service"> row. `open` marks the featured service. */
function serviceRow(item, open) {
  const level = levelOf(item.status);

  const node = el("details", "service");
  if (level) node.classList.add(`service--${level}`);
  node.dataset.status = level;
  if (open) node.open = true;

  /* summary ---------------------------------------------------------------- */
  const summary = el("summary", "service-summary");

  const head = el("span", "service-head");
  const nameClass = item.featured ? "feat-name serif" : "service-name serif";
  head.append(el("span", nameClass, item.name || "Untitled service"));
  if (item.tagline) head.append(el("span", "service-tagline", item.tagline));
  summary.append(head);

  const meta = el("span", "service-meta");
  if (item.status) meta.append(statusPill(item.status, false));
  if (item.year) meta.append(el("span", "service-years mono", item.year));
  summary.append(meta);

  summary.append(activityBar(item.start, item.end, level));

  /* expanded body ---------------------------------------------------------- */
  const body = el("div", "service-body");

  if (item.description) body.append(el("p", "service-desc", item.description));

  const stack = (Array.isArray(item.stack) ? item.stack : [])
    .filter((chip) => typeof chip === "string" && chip.trim());
  if (stack.length) {
    const group = el("div", "service-group");
    group.append(el("h3", "service-sub", "Components"));
    const chips = el("ul", "chips");
    for (const chip of stack) chips.append(el("li", "chip mono", chip));
    group.append(chips);
    body.append(group);
  }

  const manifest = item.manifest && typeof item.manifest === "object"
    ? Object.entries(item.manifest).filter(([, value]) => value != null && value !== "")
    : [];
  if (manifest.length) {
    const group = el("div", "service-group");
    group.append(el("h3", "service-sub", "Manifest"));
    const dl = el("dl", "manifest");
    for (const [key, value] of manifest) {
      dl.append(el("dt", "mono", key), el("dd", null, String(value)));
    }
    group.append(dl);
    body.append(group);
  }

  const changes = (Array.isArray(item.changes) ? item.changes : [])
    .filter((change) => change && change.text);
  if (changes.length) {
    const group = el("div", "service-group");
    group.append(el("h3", "service-sub", "Changes"));
    const list = el("ol", "service-changes");
    for (const change of changes) {
      const row = el("li", "service-change");
      const label = monthLabel(change.date);
      if (label) {
        const time = el("time", "service-change-date mono", label);
        time.setAttribute("datetime", change.date);
        row.append(time);
      }
      row.append(el("span", "service-change-text", change.text));
      list.append(row);
    }
    group.append(list);
    body.append(group);
  }

  const links = [];
  for (const link of Array.isArray(item.links) ? item.links : []) {
    if (!link || !link.label || !link.href) continue;
    const anchor = extLink("service-link mono", link.label, link.href);
    if (anchor) links.push(anchor);
  }
  if (links.length) {
    const group = el("div", "service-group");
    group.append(el("h3", "service-sub", "Links"));
    const list = el("div", "service-links");
    list.append(...links);
    group.append(list);
    body.append(group);
  }

  node.append(summary, body);
  return { node, status: level };
}

function renderServices() {
  const wrap = mount("services");
  if (!wrap) return;

  const items = (Array.isArray(D.work) ? D.work : [])
    .filter((item) => item && typeof item === "object");

  wrap.append(sectionHead("Status", "Services", "Activity over the last 30 months", "services-title"));
  labelSection("services", "services-title");

  if (!items.length) {
    wrap.append(el("p", "empty", "No services listed."));
    return;
  }

  const bar = el("div", "filter-bar");
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Filter services by status");

  const buttons = new Map();
  for (const filter of FILTERS) {
    const button = el("button", "filter-btn", filter.label);
    button.type = "button";
    button.dataset.filter = filter.key;
    button.setAttribute("aria-pressed", filter.key === "all" ? "true" : "false");
    buttons.set(filter.key, button);
    bar.append(button);
  }

  const live = el("p", "visually-hidden");
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");

  const featured = items.findIndex((item) => item.featured);
  const openIndex = featured === -1 ? 0 : featured;

  const list = el("div", "services-list");
  const rows = items.map((item, index) => {
    const row = serviceRow(item, index === openIndex);
    list.append(row.node);
    return row;
  });

  let announceTimer = 0;
  const announce = (message) => {
    window.clearTimeout(announceTimer);
    live.textContent = "";
    announceTimer = window.setTimeout(() => {
      live.textContent = message;
    }, 60);
  };

  const applyFilter = (key) => {
    let shown = 0;
    for (const row of rows) {
      const match = key === "all" || row.status === key;
      row.node.hidden = !match;
      if (match) shown += 1;
    }
    for (const [name, button] of buttons) {
      button.setAttribute("aria-pressed", String(name === key));
    }
    announce(`${shown} ${shown === 1 ? "service" : "services"} shown`);
  };

  bar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button || !bar.contains(button)) return;
    applyFilter(button.dataset.filter);
  });

  wrap.append(bar, live, list);
}

/* ============================================================================
   3. CHANGELOG
   ========================================================================== */

const KIND_META = {
  role: { glyph: "\u25C6", label: "Role" },
  ship: { glyph: "\u25B2", label: "Ship" },
  event: { glyph: "\u25CF", label: "Event" },
  move: { glyph: "\u2192", label: "Move" },
};

function logEntry(entry) {
  const row = el("li", "log-entry");

  const meta = el("div", "log-meta");

  const kindKey = String(entry.kind || "").toLowerCase();
  const known = KIND_META[kindKey];
  const kind = known || {
    glyph: "\u00B7",
    label: kindKey ? kindKey.charAt(0).toUpperCase() + kindKey.slice(1) : "Note",
  };
  const kindNode = el("span", `log-kind${known ? ` log-kind--${kindKey}` : ""}`);
  const glyph = el("span", "log-glyph", kind.glyph);
  glyph.setAttribute("aria-hidden", "true");
  kindNode.append(glyph, el("span", "log-kind-label mono", kind.label));

  meta.append(kindNode);

  const label = monthLabel(entry.date);
  if (label) {
    const time = el("time", "log-date mono", label);
    time.setAttribute("datetime", entry.date);
    meta.append(time);
  }

  row.append(meta, el("p", "log-text", entry.text));
  return row;
}

function renderChangelog() {
  const wrap = mount("changelog");
  if (!wrap) return;

  wrap.append(sectionHead("History", "Changelog", "Newest first", "changelog-title"));
  labelSection("changelog", "changelog-title");

  const entries = (Array.isArray(D.changelog) ? D.changelog : [])
    .filter((entry) => entry && entry.text)
    .slice()
    .sort((a, b) => {
      const left = monthIndex(a.date);
      const right = monthIndex(b.date);
      if (left === null && right === null) return 0;
      if (left === null) return 1;
      if (right === null) return -1;
      return right - left;
    });

  if (!entries.length) {
    wrap.append(el("p", "empty", "No changes logged."));
    return;
  }

  let year = null;
  let list = null;
  for (const entry of entries) {
    const index = monthIndex(entry.date);
    const label = index === null ? "Undated" : String(Math.floor(index / 12));
    if (label !== year) {
      year = label;
      const group = el("div", "log-group");
      group.append(el("h3", "log-year mono", label));
      list = el("ol", "log");
      group.append(list);
      wrap.append(group);
    }
    list.append(logEntry(entry));
  }
}

/* ============================================================================
   4. RUNBOOK
   ========================================================================== */

function renderRunbook() {
  const wrap = mount("runbook");
  if (!wrap) return;

  const about = D.about || {};

  wrap.append(sectionHead("About the operator", "Runbook", null, "runbook-title"));
  labelSection("runbook", "runbook-title");

  const grid = el("div", "runbook");

  const body = el("div", "runbook-body");
  const paragraphs = (Array.isArray(about.paragraphs) ? about.paragraphs : [])
    .filter((text) => typeof text === "string" && text.trim());
  if (paragraphs.length) {
    for (const text of paragraphs) body.append(el("p", "runbook-p", text));
  } else {
    body.append(el("p", "empty", "No runbook notes yet."));
  }
  grid.append(body);

  const notes = (Array.isArray(about.notes) ? about.notes : [])
    .filter((note) => note && (note.k || note.v));
  if (notes.length) {
    const aside = el("aside", "runbook-notes");
    aside.setAttribute("aria-label", "Operator notes");
    const dl = el("dl", "runbook-dl");
    for (const note of notes) {
      const row = el("div", "runbook-note");
      if (note.k) row.append(el("dt", "runbook-k mono", note.k));
      if (note.v) row.append(el("dd", "runbook-v", note.v));
      dl.append(row);
    }
    aside.append(dl);
    grid.append(aside);
  }

  wrap.append(grid);
}

/* ============================================================================
   5. ELSEWHERE
   ========================================================================== */

function photoCount() {
  const generated = typeof window !== "undefined" ? window.PHOTOS : null;
  if (Array.isArray(generated) && generated.length) return generated.length;
  const photography = D.photography || {};
  return Array.isArray(photography.photos) ? photography.photos.length : 0;
}

function elsewhereRow(name, count, href) {
  const url = safeUrl(href);
  if (!url) return null;
  const item = el("li");
  const row = el("a", "elsewhere-row");
  row.href = url;

  row.append(
    el("span", "elsewhere-name serif", name),
    el("span", "elsewhere-count mono", count)
  );
  const arrow = el("span", "elsewhere-arrow mono", "\u2192");
  arrow.setAttribute("aria-hidden", "true");
  row.append(arrow);

  item.append(row);
  return item;
}

function renderElsewhere() {
  const wrap = mount("elsewhere");
  if (!wrap) return;

  wrap.append(sectionHead("Continue", "Elsewhere", null, "elsewhere-title"));
  labelSection("elsewhere", "elsewhere-title");

  const reading = D.reading || {};
  const installing = (Array.isArray(reading.current) ? reading.current : [])
    .filter(Boolean).length;
  const resolved = (Array.isArray(reading.finished) ? reading.finished : [])
    .filter(Boolean).length;

  const list = el("ul", "elsewhere-list");
  list.append(...[
    elsewhereRow("Exposures", countLabel(photoCount(), "exposure"), `${ROOT}photography/`),
    elsewhereRow(
      "Dependencies",
      `${installing} installing \u00B7 ${resolved} resolved`,
      `${ROOT}books/`
    ),
  ].filter(Boolean));
  wrap.append(list);
}

/* ============================================================================
   6. PAGE THE ON-CALL
   ========================================================================== */

const SOCIAL_LABELS = { github: "GitHub", linkedin: "LinkedIn", instagram: "Instagram" };

/** First part of locationLabel, e.g. "Leeds, UK" → "Leeds". */
function cityOf(site) {
  return String((site && site.locationLabel) || "Leeds").split(",")[0].trim();
}

/** Owner-declared availability, e.g. "Mon–Fri · 09:00–18:00 Leeds". */
function availabilityLine(site) {
  const availability = site && site.availability;
  if (!availability || !Array.isArray(availability.hours) || !Array.isArray(availability.days)) {
    return "";
  }
  if (availability.hours.length !== 2) return "";
  const open = Number(availability.hours[0]);
  const close = Number(availability.hours[1]);
  if (!Number.isFinite(open) || !Number.isFinite(close)) return "";

  const days = Array.from(new Set(availability.days.map(Number)
    .filter((day) => day >= 1 && day <= 7))).sort((a, b) => a - b);
  if (!days.length) return "";

  const pad = (value) => String(value).padStart(2, "0");
  let span;
  if (days.join(",") === "1,2,3,4,5") span = "Mon\u2013Fri";
  else if (days.length === 7) span = "Every day";
  else span = days.map((day) => DAYS[day - 1]).join(", ");

  return `${span} \u00B7 ${pad(open)}:00\u2013${pad(close)}:00 ${cityOf(site)}`;
}

function selectContents(node) {
  const selection = window.getSelection ? window.getSelection() : null;
  if (!selection || !document.createRange) return false;
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
}

function execCopy() {
  try {
    return document.execCommand("copy");
  } catch (err) {
    return false;
  }
}

function renderContact() {
  const wrap = mount("contact");
  if (!wrap) return;

  wrap.append(sectionHead("Contact", "Page the on-call", null, "contact-title"));
  labelSection("contact", "contact-title");

  const site = D.site || {};
  const email = typeof site.email === "string" ? site.email.trim() : "";
  const mailto = email ? safeUrl(`mailto:${email}`) : null;

  if (!mailto) {
    wrap.append(el("p", "empty", "No contact address listed."));
    return;
  }

  const direct = el("p", "contact-direct");
  const link = el("a", "contact-email serif", email);
  link.href = mailto;
  direct.append(link);
  wrap.append(direct);

  const hours = availabilityLine(site);
  if (hours) wrap.append(el("p", "contact-hours mono", hours));

  const actions = el("div", "contact-actions");
  const copy = el("button", "copy-btn", "Copy");
  copy.type = "button";
  copy.setAttribute("aria-label", `Copy email address ${email}`);

  const announcement = el("p", "contact-announce mono");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");

  let resetTimer = 0;
  const say = (message) => {
    window.clearTimeout(resetTimer);
    announcement.textContent = message;
    resetTimer = window.setTimeout(() => {
      announcement.textContent = "";
    }, 3000);
  };

  copy.addEventListener("click", async () => {
    const clipboard = navigator.clipboard;
    if (clipboard && typeof clipboard.writeText === "function") {
      try {
        await clipboard.writeText(email);
        say("Email copied");
        return;
      } catch (err) {
        /* Permission denied — fall through to the selection fallback. */
      }
    }
    const ok = selectContents(link) && execCopy();
    say(ok ? "Email copied" : "Press Ctrl+C to copy");
  });

  actions.append(copy, announcement);
  wrap.append(actions);

  const socials = site.socials && typeof site.socials === "object" ? site.socials : {};
  const socialList = el("ul", "contact-socials");
  for (const [key, href] of Object.entries(socials)) {
    const url = safeUrl(href);
    if (!url) continue;
    // A bare Instagram profile URL is a placeholder, so it is not shown.
    if (/^https:\/\/(www\.)?instagram\.com\/?$/i.test(url)) continue;
    const label = SOCIAL_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
    const anchor = extLink("contact-social mono", label, url);
    if (!anchor) continue;
    const item = el("li");
    item.append(anchor);
    socialList.append(item);
  }
  if (socialList.childElementCount) wrap.append(socialList);
}

/* ============================================================================
   ENTRY POINT
   ========================================================================== */

export function render() {
  if (!D || typeof document === "undefined") return;
  renderStatus();
  renderServices();
  renderChangelog();
  renderRunbook();
  renderElsewhere();
  renderContact();
}
