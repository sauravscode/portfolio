/* ============================================================================
   photography.js — the gallery grid and the lightbox.
   ----------------------------------------------------------------------------
   M1 keeps the module quiet: render() does nothing yet. The two proven pieces
   from the previous build are ported below and stay unexported until M3:
     • the Cloudinary URL builder (cloudUrl / cloudNameOf / cloudSources),
       including full-URL and root-relative passthrough, cloud-name validation
       and rejection of backslashes/"..";
     • initLightbox(), the accepted focus-trapped dialog (Esc, ← →, Tab trap,
       focus restore, scroll lock).

   Rules: no HTML parsing; URLs pass safeUrl(); optional fields render nothing.
   ========================================================================== */

import { D, safeUrl } from "./core.js";

/* ============================================================================
   CLOUDINARY SOURCES — used by the M3 renderer.
   ========================================================================== */

/** A Cloudinary cloud name is a host label, so keep it to host-safe chars. */
function cloudNameOf(data) {
  const source = data && typeof data === "object" ? data : D;
  const fromCloudinary = source && source.cloudinary && typeof source.cloudinary.cloudName === "string"
    ? source.cloudinary.cloudName
    : "";
  const fallback = source && typeof source.cloudName === "string" ? source.cloudName : "";
  const cloud = (fromCloudinary || fallback).trim();
  if (!cloud || cloud === "your-cloud-name") return "";
  return /^[A-Za-z0-9_-]+$/.test(cloud) ? cloud : "";
}

function cloudUrl(cloud, publicId, width, extra = "") {
  return `https://res.cloudinary.com/${cloud}` +
         `/image/upload/f_auto,q_auto,w_${width},c_limit${extra}/${publicId}`;
}

/**
 * Sources for one Cloudinary photo record ({ publicId, ratio, caption, exif? }).
 * A publicId may itself be a full https URL or a root-relative path.
 * Returns { src, large, srcset, sizes } or null when nothing can be resolved.
 */
function cloudSources(image, cloud) {
  if (!image || typeof image.publicId !== "string") return null;
  const publicId = image.publicId.trim();
  if (!publicId || publicId.includes("\\") || publicId.includes("..")) return null;

  if (/^(https?:\/\/|\/)/i.test(publicId)) {
    const url = safeUrl(publicId);
    if (!url || !/^(https:\/\/|\/)/i.test(url) || url.startsWith("//")) return null;
    return { src: url, large: url, srcset: null, sizes: null };
  }

  // Any other scheme (javascript:, data:, …) is not a public ID.
  if (/^[a-z][a-z0-9+.-]*:/i.test(publicId)) return null;
  if (!cloud) return null;

  return {
    src: cloudUrl(cloud, publicId, 1200),
    large: cloudUrl(cloud, publicId, 1600),
    srcset: [640, 960, 1280, 1920, 2560]
      .map((width) => `${cloudUrl(cloud, publicId, width)} ${width}w`)
      .join(", "),
    sizes: "(max-width: 639px) 92vw, (max-width: 1099px) 46vw, 30vw"
  };
}

/* ============================================================================
   LIGHTBOX — the accepted focus-trapped dialog, restyled in M3.
   ========================================================================== */

/**
 * Wire the #lightbox dialog.
 *
 * @param {Array<object>} photos  records with { sources, caption, exif, broken }
 * @param {Map<number, HTMLElement>} openers  photo index → opening button
 */
function initLightbox(photos, openers) {
  const box = document.getElementById("lightbox");
  if (!box) return;
  const img = document.getElementById("lb-img");
  const cap = document.getElementById("lb-cap");
  const btnClose = document.getElementById("lb-close");
  const btnPrev = document.getElementById("lb-prev");
  const btnNext = document.getElementById("lb-next");
  if (!img || !cap || !btnClose || !btnPrev || !btnNext) return;

  let current = 0;
  let returnFocus = null;

  const viewable = () => photos
    .map((photo, index) => ({ photo, index }))
    .filter(({ photo }) => photo.sources && !photo.broken);

  function refreshNav() {
    const single = viewable().length < 2;
    btnPrev.hidden = single;
    btnNext.hidden = single;
    box.classList.toggle("is-single", single);
  }

  function show(position) {
    const list = viewable();
    if (!list.length) return;
    const pos = ((position % list.length) + list.length) % list.length;
    current = pos;
    const { photo } = list[pos];
    const caption = photo.caption || "Untitled";

    img.src = photo.sources.large || photo.sources.src;
    if (photo.sources.srcset) {
      img.srcset = photo.sources.srcset;
      img.sizes = "92vw";
    } else {
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
    }
    img.alt = caption;
    cap.textContent = `${caption}  ${pos + 1} / ${list.length}`;
    refreshNav();
  }

  function open(photoIndex) {
    const pos = viewable().findIndex(({ index }) => index === photoIndex);
    if (pos === -1) return;
    returnFocus = openers.get(photoIndex) || document.activeElement;
    show(pos);
    box.hidden = false;
    document.documentElement.classList.add("is-locked");
    btnClose.focus();
  }

  function close() {
    if (box.hidden) return;
    box.hidden = true;
    document.documentElement.classList.remove("is-locked");
    img.removeAttribute("src");
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    img.alt = "";
    if (returnFocus && typeof returnFocus.focus === "function") returnFocus.focus();
  }

  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", () => show(current - 1));
  btnNext.addEventListener("click", () => show(current + 1));

  box.addEventListener("click", (event) => {
    if (event.target === box) close();
  });

  document.addEventListener("keydown", (event) => {
    if (box.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(current - 1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      show(current + 1);
      return;
    }
    if (event.key !== "Tab") return;

    const focusables = [btnClose, btnPrev, btnNext].filter((node) => !node.hidden);
    if (!focusables.length) return;
    const at = focusables.indexOf(document.activeElement);
    event.preventDefault();
    let next;
    if (at === -1) {
      next = event.shiftKey ? focusables[focusables.length - 1] : focusables[0];
    } else {
      const step = event.shiftKey ? -1 : 1;
      next = focusables[(at + step + focusables.length) % focusables.length];
    }
    next.focus();
  });

  for (const { index } of viewable()) {
    const button = openers.get(index);
    if (!button) continue;
    button.addEventListener("click", () => open(index));
  }

  refreshNav();
}

/* ============================================================================
   ENTRY POINT
   ========================================================================== */

export function render() {
  if (!D || typeof document === "undefined") return;
  // M3: masonry grid, hover captions, lightbox, and the pending state.
}
