/* ============================================================================
   home.js — the hero and the three tall image panels (M2).

   Two moments, both image-led:
     1. A full-screen photograph with the name set large (the "grandeur moment").
     2. Three equal, full-bleed panels that link into the rest of the site.

   Everything is built from window.DATA. Text goes in through textContent;
   URLs through safeUrl(); images through makeImg() so Cloudinary does the
   resizing and the page stays calm when a photo is missing (plain ground,
   no broken-image icons).
   ========================================================================== */

import { D, el, safeUrl, makeImg } from "./core.js";

const HERO_WIDTHS = [800, 1200, 1600, 2000, 2560];
const PANEL_WIDTHS = [600, 900, 1200, 1600];

/** A full-bleed legibility scrim; hidden from screen readers. */
function scrim(className) {
  const layer = el("div", className);
  layer.setAttribute("aria-hidden", "true");
  return layer;
}

function renderHero() {
  const hero = document.getElementById("hero");
  if (!hero || !D) return;

  const image = D.hero && D.hero.image ? D.hero.image : null;

  const img = makeImg(image, {
    eager: true,
    priority: true,
    widths: HERO_WIDTHS,
    sizes: "100vw",
    className: "hero-img"
  });

  if (img) {
    // Fade the photograph in once it has loaded (instantly if already cached).
    img.addEventListener("load", () => img.classList.add("is-loaded"));
    if (img.complete) img.classList.add("is-loaded");
    // On a load error the img removes itself (makeImg) and #hero gets
    // .is-imgless; drop the scrim too so the fallback stays plain ground.
    const veil = scrim("hero-scrim");
    img.addEventListener("error", () => veil.remove(), { once: true });
    hero.append(img, veil);
  } else {
    // No resolvable image: the hero stays plain ground, name still shows.
    hero.classList.add("is-imgless");
  }

  const site = D.site || {};
  const content = el("div", "hero-content");
  // The name already shows in the header wordmark, so the h1 is for screen
  // readers and search engines only.
  content.append(el("h1", "hero-name visually-hidden", site.name));
  content.append(el("p", "hero-tagline mono", site.tagline));
  hero.append(content);

  const cue = el("a", "hero-cue mono", "Scroll");
  cue.href = "#panels";
  hero.append(cue);
}

function renderPanels() {
  const wrap = document.getElementById("panels");
  if (!wrap || !D) return;

  const items = Array.isArray(D.panels) ? D.panels : [];
  let rendered = 0;

  for (const item of items) {
    if (!item || typeof item.title !== "string" || !item.title.trim()) continue;
    const href = safeUrl(item.href);
    if (!href) continue;

    const title = item.title.trim();
    const caption = typeof item.caption === "string" ? item.caption : "";

    const link = el("a", "panel reveal");
    link.href = href;
    link.setAttribute("aria-label", caption ? `${title} — ${caption}` : title);

    const media = el("div", "panel-media");
    const img = makeImg(item.image, {
      crop: { aspect: "3:4" },
      widths: PANEL_WIDTHS,
      sizes: "(min-width: 900px) 34vw, 100vw",
      className: "panel-img"
    });
    if (img) media.append(img);
    else media.classList.add("is-imgless");

    const text = el("div", "panel-text");
    text.append(el("h2", "panel-title display", title));
    text.append(el("p", "panel-caption mono", caption));

    link.append(media, scrim("panel-scrim"), text);
    wrap.append(link);
    rendered += 1;
  }

  if (rendered === 0) wrap.remove();
}

export function render() {
  if (!D || typeof document === "undefined") return;
  renderHero();
  renderPanels();
}
