/* ============================================================================
   app.js — thin entry point.
   Renders the shared chrome, then hands off to the module for <body data-page>.
   ========================================================================== */

import { D, PAGE, renderHeader, renderFooter, initReveals } from "./core.js";
import * as home from "./home.js";
import * as photography from "./photography.js";
import * as books from "./books.js";

const PAGES = { home, photography, books };

// All three modules are tiny and side-effect-free; only the module matching
// <body data-page> is asked to render.
if (!D) {
  console.error("window.DATA missing — is js/data.js loaded?");
} else {
  renderHeader(PAGE);
  renderFooter();

  const page = PAGES[PAGE] || PAGES.home;
  try {
    if (page && typeof page.render === "function") page.render();
  } catch (err) {
    console.error(`Failed to render the "${PAGE}" page`, err);
  }

  initReveals();
}
