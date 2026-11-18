/* ============================================================================
   books.js — Dependencies page.
   ----------------------------------------------------------------------------
   The reading list is rendered as a dependency manifest:
     • two groups — installing (current) and resolved (finished)
     • one row per book: state glyph, title, author, scope chip, optional note
     • a scope filter built from the distinct tags, with a live count

   The year-grouping rule from the previous build is preserved: the resolved
   shelf groups by year only when EVERY finished entry has a numeric year.
   Otherwise it is one flat list in data order.

   Rules: no HTML parsing (text via textContent/el()); optional fields that are
   absent render nothing; filtering only toggles [hidden], never re-renders.
   ========================================================================== */

import { D, el } from "./core.js";

const INSTALLING = { glyph: "\u25D0", label: "installing" };
const RESOLVED = { glyph: "\u25CF", label: "resolved" };

/* ---- normalisation -------------------------------------------------------- */

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function shelf(value) {
  return (Array.isArray(value) ? value : []).filter(
    (book) => book && typeof book === "object"
  );
}

function reading() {
  const value = (D && D.reading) || {};
  return {
    current: shelf(value.current),
    finished: shelf(value.finished),
  };
}

/** A scope tag, or "" when the book has none. */
function scopeOf(book) {
  return text(book && book.tag);
}

/** A numeric year, or null. Accepts 2024 and "2024" but nothing else. */
function yearOf(book) {
  if (!book) return null;
  const value = typeof book.year === "string" ? book.year.trim() : book.year;
  if (value == null || value === "") return null;
  const year = Number(value);
  return Number.isInteger(year) ? year : null;
}

/** True when every finished entry has a numeric year. */
function canGroupByYear(finished) {
  return (
    Array.isArray(finished) &&
    finished.length > 0 &&
    finished.every((book) => yearOf(book) !== null)
  );
}

/** Distinct years, newest first. */
function yearsOf(finished) {
  return Array.from(new Set(finished.map(yearOf)))
    .filter((year) => year !== null)
    .sort((a, b) => b - a);
}

/** Scope tags across both shelves, first-seen order, no duplicates. */
function scopesOf(current, finished) {
  const seen = new Set();
  for (const book of [...current, ...finished]) {
    const tag = scopeOf(book);
    if (tag && !seen.has(tag)) seen.add(tag);
  }
  return Array.from(seen);
}

/* ---- rows ----------------------------------------------------------------- */

/**
 * One manifest line: mono glyph, title + author + optional note, scope chip.
 * `state` is "installing" or "resolved" and is only used for the glyph and
 * a data attribute (the group heading carries the readable status).
 */
function bookRow(book, state) {
  const meta = state === "installing" ? INSTALLING : RESOLVED;

  const row = el("li", "dep");
  row.dataset.state = state;

  const glyph = el("span", `dep-glyph dep-glyph--${state} mono`, meta.glyph);
  glyph.setAttribute("aria-hidden", "true");

  const main = el("div", "dep-main");
  const line = el("p", "dep-line");
  const title = el("span", "book-row-title serif", text(book.title));
  line.append(title);

  const author = text(book.author);
  if (author) line.append(el("span", "dep-author", author));
  main.append(line);

  const note = text(book.note);
  if (note) main.append(el("p", "dep-note serif", note));

  row.append(glyph, main);

  const scope = scopeOf(book);
  if (scope) row.append(el("span", "dep-scope mono", scope));

  return { node: row, tag: scope, subgroup: null };
}

/* ---- groups --------------------------------------------------------------- */

function groupHead(label, count, titleId) {
  const head = el("div", "dep-group-head");
  const heading = el("h2", "dep-group-title mono", label);
  heading.id = titleId;
  head.append(heading, el("span", "dep-count mono", String(count)));
  return head;
}

/**
 * Build one shelf as a <section>. Returns { node, rows, subgroups } so the
 * filter can hide empty rows/groups without re-rendering.
 */
function buildGroup(label, state, books) {
  const titleId = `deps-${state}`;
  const section = el("section", "dep-group");
  section.dataset.group = state;
  section.setAttribute("aria-labelledby", titleId);
  section.append(groupHead(label, books.length, titleId));

  const group = { node: section, rows: [], subgroups: [] };

  if (!books.length) {
    section.append(
      el(
        "p",
        "empty dep-empty",
        state === "installing" ? "Nothing installing." : "Nothing resolved yet."
      )
    );
    return group;
  }

  const addList = (parent, entries) => {
    const list = el("ul", "dep-list");
    for (const book of entries) {
      const row = bookRow(book, state);
      list.append(row.node);
      group.rows.push(row);
    }
    parent.append(list);
  };

  if (state === "resolved" && canGroupByYear(books)) {
    for (const year of yearsOf(books)) {
      const bucket = el("div", "dep-year");
      bucket.append(el("h3", "dep-year-title mono", String(year)));
      const firstRow = group.rows.length;
      addList(bucket, books.filter((book) => yearOf(book) === year));
      const subgroup = {
        node: bucket,
        rows: group.rows.slice(firstRow),
      };
      for (const row of subgroup.rows) row.subgroup = subgroup;
      group.subgroups.push(subgroup);
      section.append(bucket);
    }
  } else {
    addList(section, books);
  }

  return group;
}

/* ---- page header --------------------------------------------------------- */

function renderSub(current, finished) {
  const node = document.getElementById("books-count");
  if (!node) return;
  node.textContent = `${current} installing \u00B7 ${finished} resolved`;
}

/** The lockfile comment above the manifest. */
function leadLine(total) {
  const noun = total === 1 ? "package" : "packages";
  return el("p", "dep-lead mono", `# reading.lock \u2014 ${total} ${noun}`);
}

/* ============================================================================
   RENDER
   ========================================================================== */

export function render() {
  if (!D || typeof document === "undefined") return;

  const section = document.getElementById("deps");
  if (!section) return;

  const { current, finished } = reading();
  renderSub(current.length, finished.length);

  const wrap = el("div", "wrap");
  section.replaceChildren(wrap);

  const total = current.length + finished.length;
  wrap.append(leadLine(total));

  const installing = buildGroup("installing", "installing", current);
  const resolved = buildGroup("resolved", "resolved", finished);
  wrap.append(installing.node, resolved.node);

  /* Empty both shelves: no filter, just the two honest group lines. */
  if (total === 0) return;

  const bar = el("div", "filter-bar");
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Filter dependencies by scope");

  const buttons = new Map();
  const addButton = (key, label) => {
    const button = el("button", "filter-btn", label);
    button.type = "button";
    button.dataset.filter = key;
    button.setAttribute("aria-pressed", key === "all" ? "true" : "false");
    buttons.set(key, button);
    bar.append(button);
  };

  addButton("all", "All");
  for (const tag of scopesOf(current, finished)) addButton(tag, tag);

  const live = el("p", "visually-hidden");
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");

  const none = el("p", "empty dep-none", "No dependencies in this scope.");
  none.hidden = true;

  const groups = [installing, resolved];
  const allRows = groups.flatMap((group) => group.rows);

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

    for (const row of allRows) {
      const match = key === "all" || (row.tag !== "" && row.tag === key);
      row.node.hidden = !match;
      if (match) shown += 1;
    }

    for (const group of groups) {
      // Empty shelves keep their "Nothing …" line; non-empty groups hide when
      // every row inside them is filtered out.
      group.node.hidden =
        group.rows.length > 0 && group.rows.every((row) => row.node.hidden);

      for (const subgroup of group.subgroups) {
        subgroup.node.hidden = subgroup.rows.every((row) => row.node.hidden);
      }
    }

    none.hidden = shown !== 0;

    for (const [name, button] of buttons) {
      button.setAttribute("aria-pressed", String(name === key));
    }

    announce(`${shown} ${shown === 1 ? "dependency" : "dependencies"} shown`);
  };

  bar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button || !bar.contains(button)) return;
    applyFilter(button.dataset.filter);
  });

  // The filter sits above the manifest it controls, so insert it after the lead.
  wrap.insertBefore(bar, installing.node);
  wrap.insertBefore(live, installing.node);
  wrap.append(none);
}
