/* ============================================================================
   theme.js — classic, synchronous, loaded in <head>.
   Sets the theme before first paint: stored choice, else prefers-color-scheme.
   Every storage access is guarded so a blocked localStorage cannot break paint.
   ========================================================================== */
(function () {
  "use strict";

  var stored = null;
  try {
    stored = window.localStorage.getItem("theme");
  } catch (err) {
    stored = null;
  }

  if (stored !== "light" && stored !== "dark") {
    var mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    stored = mq && mq.matches ? "dark" : "light";
  }

  document.documentElement.dataset.theme = stored;
})();
