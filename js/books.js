/* ============================================================================
   books.js — Dependencies page.
   M1 stub: M4 fills the render() body. The year-grouping rule from the previous
   build is preserved below: group by year only when EVERY finished entry has one.
   ========================================================================== */

import { D, el } from "./core.js";

function reading() {
  return (D && D.reading) || { current: [], finished: [] };
}

/** True when the finished shelf can be grouped by year. */
function canGroupByYear(finished) {
  return Array.isArray(finished) && finished.length > 0 && finished.every((b) => b && b.year);
}

/** Distinct years, newest first, for grouped finished entries. */
function yearsOf(finished) {
  return Array.from(new Set(finished.map((b) => b.year))).sort((a, b) => b - a);
}

/** A manifest row: title, author, scope tag and an optional note. */
function bookRow(book) {
  const row = el("li", "book-row");
  const title = el("span", "book-row-title serif", book.title || "");
  if (book.author) title.append(el("span", "book-row-author", ` — ${book.author}`));
  row.append(title);
  if (book.tag) row.append(el("span", "book-tag mono", book.tag));
  if (book.note) row.append(el("p", "book-note serif", book.note));
  return row;
}

export function render() {
  /* M4 */
}
