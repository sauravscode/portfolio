import { D, PAGE, renderHeader, renderFooter, initReveals } from "./core.js";
import * as home from "./home.js";
import * as photography from "./photography.js";
import * as about from "./about.js";

const PAGES = { home, photography, about };

renderHeader(PAGE);
renderFooter();

if (!D) {
  console.error("window.DATA missing — is js/data.js loaded?");
} else {
  const page = PAGES[PAGE] || PAGES.home;
  try {
    if (page && typeof page.render === "function") page.render();
  } catch (err) {
    console.error(`Failed to render the "${PAGE}" page`, err);
  }
}

initReveals();
