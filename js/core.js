/* ============================================================================
   core.js — shared helpers and chrome.

   Everything here is small on purpose:
     • el / safeUrl / extLink      — DOM and URL primitives
     • imageSources / makeImg      — Cloudinary-aware responsive images
     • renderHeader / renderFooter — the shared chrome
     • initReveals                 — restrained scroll reveal

   Rules: all text goes in through textContent; HTML strings are never parsed.
   URLs coming from data pass through safeUrl() before they reach an href.
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

/* ---- responsive images ----------------------------------------------------- */

const DEFAULT_WIDTHS = [640, 960, 1280, 1920, 2560];
const CLOUD_NAME = /^[A-Za-z0-9_-]+$/;
const FOCUS = /^\d{1,3}% \d{1,3}%$/;

/** The configured Cloudinary cloud name, or "" when unset/placeholder/invalid. */
function cloudName() {
  const cloud = D && D.cloudinary && typeof D.cloudinary.cloudName === "string"
    ? D.cloudinary.cloudName.trim()
    : "";
  if (!cloud || cloud === "your-cloud-name") return "";
  return CLOUD_NAME.test(cloud) ? cloud : "";
}

function cleanWidths(widths) {
  const list = (Array.isArray(widths) ? widths : DEFAULT_WIDTHS)
    .map((width) => Math.round(Number(width)))
    .filter((width) => Number.isFinite(width) && width >= 16 && width <= 6000);
  const unique = Array.from(new Set(list)).sort((a, b) => a - b);
  return unique.length ? unique : DEFAULT_WIDTHS.slice();
}

/** `{ aspect: "3:4" }` → "3:4", or null when the crop is unusable. */
function cleanCrop(crop) {
  if (!crop || typeof crop !== "object") return null;
  const aspect = typeof crop.aspect === "string" ? crop.aspect.trim() : "";
  const match = /^(\d{1,3}):(\d{1,3})$/.exec(aspect);
  if (!match) return null;
  if (Number(match[1]) === 0 || Number(match[2]) === 0) return null;
  return aspect;
}

function cloudinaryUrl(cloud, publicId, width, aspect) {
  const transform = aspect
    ? `f_auto,q_auto,c_fill,g_auto,ar_${aspect},w_${width}`
    : `f_auto,q_auto,c_limit,w_${width}`;
  return `https://res.cloudinary.com/${cloud}/image/upload/${transform}/${publicId}`;
}

/**
 * Responsive sources for one image record ({ publicId, alt, focus }).
 *
 * Returns { src, srcset, sizes } or null when the image cannot be resolved.
 *  • full https:// URLs and root-relative "/…" paths pass through unchanged;
 *  • Cloudinary public IDs get f_auto,q_auto URLs at each requested width;
 *  • missing/empty publicId, unset/invalid cloudName, unsafe URLs and IDs
 *    containing ".." or a backslash all return null.
 *
 * @param {object} image
 * @param {{widths?: number[], crop?: {aspect?: string}, sizes?: string}} [opts]
 */
export function imageSources(image, opts = {}) {
  if (!image || typeof image !== "object") return null;

  const publicId = typeof image.publicId === "string" ? image.publicId.trim() : "";
  if (!publicId) return null;
  if (/[\u0000-\u001f\u007f\\]/.test(publicId)) return null;
  if (publicId.includes("..")) return null;

  // A publicId may be a full https URL or a root-relative path: use it as-is.
  if (/^https:\/\//i.test(publicId)) {
    const url = safeUrl(publicId);
    if (!url || !/^https:\/\//i.test(url)) return null;
    return { src: url, srcset: null, sizes: null };
  }
  if (publicId.startsWith("/")) {
    const url = safeUrl(publicId);
    if (!url || !url.startsWith("/") || url.startsWith("//")) return null;
    return { src: url, srcset: null, sizes: null };
  }

  // Any other scheme (http:, data:, javascript:, …) is not a Cloudinary ID.
  if (/^[a-z][a-z0-9+.-]*:/i.test(publicId)) return null;
  if (publicId.startsWith("#") || publicId.includes("?") || publicId.includes("#")) {
    return null;
  }

  const cloud = cloudName();
  if (!cloud) return null;

  const widths = cleanWidths(opts.widths);
  const aspect = cleanCrop(opts.crop);
  const sizes = typeof opts.sizes === "string" && opts.sizes.trim()
    ? opts.sizes.trim()
    : "100vw";

  const atMost = widths.filter((width) => width <= 1920);
  const srcWidth = atMost.length ? atMost[atMost.length - 1] : widths[0];

  return {
    src: cloudinaryUrl(cloud, publicId, srcWidth, aspect),
    srcset: widths
      .map((width) => `${cloudinaryUrl(cloud, publicId, width, aspect)} ${width}w`)
      .join(", "),
    sizes
  };
}

/**
 * Build an <img> for an image record, or null when it cannot be resolved.
 *
 * opts: { widths, crop, sizes, eager, priority, className }
 *  • lazy by default; eager + fetchpriority=high for the hero;
 *  • object-position from image.focus only when it looks like "50% 35%";
 *  • on a load error the image removes itself and its parent gets .is-imgless,
 *    so the layout falls back to the quiet tile instead of a broken icon.
 */
export function makeImg(image, opts = {}) {
  const sources = imageSources(image, opts);
  if (!sources) return null;

  const img = el("img", opts.className || null);
  img.alt = image && typeof image.alt === "string" ? image.alt : "";
  img.decoding = "async";
  img.loading = opts.eager ? "eager" : "lazy";
  if (opts.priority) img.setAttribute("fetchpriority", "high");

  const focus = image && typeof image.focus === "string" ? image.focus.trim() : "";
  if (FOCUS.test(focus)) img.style.setProperty("object-position", focus);

  img.addEventListener("error", () => {
    const parent = img.parentNode;
    if (parent) img.remove();
    if (parent && parent.classList) parent.classList.add("is-imgless");
  }, { once: true });

  if (sources.srcset) {
    img.srcset = sources.srcset;
    img.sizes = sources.sizes || "100vw";
  }
  img.src = sources.src;

  return img;
}

/* ---- header ---------------------------------------------------------------- */

/** Build the shared header into #site-head. `page` is "home"|"photography"|"about". */
export function renderHeader(page = PAGE) {
  const head = document.getElementById("site-head");
  if (!head) return;

  const inner = el("div", "wrap head-inner");

  const brand = el("a", "wordmark", "Saurav Sudhar");
  brand.href = ROOT || "./";
  if (page === "home") brand.setAttribute("aria-current", "page");

  const nav = el("nav", "nav");
  nav.setAttribute("aria-label", "Primary");

  const links = [
    { label: "Photography", href: `${ROOT}photography/`, page: "photography" },
    { label: "About", href: `${ROOT}about/`, page: "about" }
  ];

  for (const item of links) {
    const link = el("a", "nav-link mono", item.label);
    link.href = item.href;
    if (item.page === page) link.setAttribute("aria-current", "page");
    nav.append(link);
  }

  head.classList.toggle("site-head--overlay", page === "home");

  inner.append(brand, nav);
  head.replaceChildren(inner);
}

/* ---- footer ---------------------------------------------------------------- */

/** Build the shared footer into #site-foot. */
export function renderFooter() {
  const foot = document.getElementById("site-foot");
  if (!foot) return;

  const site = (D && D.site) || {};
  const location = typeof site.location === "string" ? site.location : "Leeds, UK";
  const city = location.split(",")[0].trim() || "Leeds";
  const name = typeof site.name === "string" && site.name.trim()
    ? site.name.trim()
    : "Saurav Sudhar";
  const year = new Date().getFullYear();

  const inner = el("div", "wrap foot-inner");
  inner.append(el("p", "foot-meta mono", `\u00A9 ${year} ${name} \u00B7 ${city}`));

  const nav = el("nav", "foot-links");
  nav.setAttribute("aria-label", "Footer");

  const email = typeof site.email === "string" ? site.email.trim() : "";
  const emailLink = email ? extLink("foot-link mono", "Email", `mailto:${email}`) : null;
  if (emailLink) nav.append(emailLink);

  const socials = site.socials && typeof site.socials === "object" ? site.socials : {};
  const labels = [["github", "GitHub"], ["linkedin", "LinkedIn"], ["instagram", "Instagram"]];

  for (const [key, label] of labels) {
    const link = extLink("foot-link mono", label, socials[key]);
    if (link) nav.append(link);
  }

  const top = el("a", "foot-top mono", "Back to top \u2191");
  top.href = "#main";
  nav.append(top);

  inner.append(nav);
  foot.replaceChildren(inner);
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
