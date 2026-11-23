import { D, el, safeUrl, makeImg } from "./core.js";

const HERO_WIDTHS = [800, 1200, 1600, 2000, 2560, 3000, 3500];
const PANEL_WIDTHS = [600, 900, 1200, 1600];

function heroSizes() {
  const ratio = D && D.hero && D.hero.image ? Number(D.hero.image.ratio) : NaN;
  if (Number.isFinite(ratio) && ratio >= 0.3 && ratio <= 5) {
    const r1000 = Math.round(ratio * 1000);
    return `(max-aspect-ratio: ${r1000}/1000) ${r1000 / 10}vh, 100vw`;
  }
  return "100vw";
}

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
    sizes: heroSizes(),
    className: "hero-img"
  });

  if (img) {
    img.addEventListener("load", () => img.classList.add("is-loaded"));
    if (img.complete) img.classList.add("is-loaded");
    const veil = scrim("hero-scrim");
    img.addEventListener("error", () => veil.remove(), { once: true });
    hero.append(img, veil);
  } else {
    hero.classList.add("is-imgless");
  }

  const site = D.site || {};
  const content = el("div", "hero-content");
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
