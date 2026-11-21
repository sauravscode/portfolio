/* ============================================================================
   photography.js — the gallery grid and the lightbox (M3).

   The Cloudinary helpers once private to this module now live in core.js
   (imageSources / makeImg), so the whole site shares one image path. What
   remains here is the page itself: resolve the photos, render the masonry
   grid with hover captions, and adapt the accepted focus-trapped lightbox
   (Esc, ← →, Tab trap, focus restore, scroll lock) to the grid buttons.

   Rules: no HTML parsing; all text goes through textContent; URLs through
   safeUrl/extLink; images through imageSources/makeImg. Optional fields
   (exif, caption) simply render nothing when missing.
   ========================================================================== */

import { D, el, extLink, imageSources, makeImg } from "./core.js";

const SHOT_WIDTHS = [480, 800, 1200, 1600];
const SHOT_SIZES =
  "(min-width: 1100px) 31vw, (min-width: 640px) 46vw, 92vw";

/** A safe aspect ratio for the frame: finite, within 0.2–5, else 1.5. */
function cleanRatio(value) {
  const ratio = Number(value);
  if (Number.isFinite(ratio) && ratio >= 0.2 && ratio <= 5) return ratio;
  return 1.5;
}

/* ============================================================================
   LIGHTBOX — the accepted focus-trapped dialog, adapted to the grid buttons.
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
  let loadToken = 0;

  /** Point an <img> at a record's sources (responsive when Cloudinary-backed). */
  function setSources(target, sources) {
    if (sources.srcset) {
      target.sizes = sources.sizes || "92vw";
      target.srcset = sources.srcset;
    } else {
      target.removeAttribute("srcset");
      target.removeAttribute("sizes");
    }
    target.src = sources.src;
  }

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

    // Hide the previous photo at once: browsers keep painting the old image
    // until the new one has downloaded, which made navigation look stuck.
    const token = ++loadToken;
    img.classList.add("is-loading");
    box.classList.add("is-loading");
    img.style.setProperty("--lb-ratio", String(photo.ratio));
    const reveal = () => {
      if (token !== loadToken) return; // a newer photo was requested meanwhile
      img.classList.remove("is-loading");
      box.classList.remove("is-loading");
    };
    img.onload = reveal;
    img.onerror = reveal;
    setSources(img, photo.sources);
    img.alt = caption;
    if (img.complete && img.naturalWidth) reveal();

    // Warm the neighbours so the next arrow press is instant.
    for (const step of [1, -1]) {
      const near = list[(pos + step + list.length) % list.length];
      if (near && near !== list[pos]) setSources(new Image(), near.photo.sources);
    }
    const capText = el("span", "lb-cap-text");
    capText.textContent = `${caption}${photo.exif ? " · " + photo.exif : ""}`;
    const count = el("span", "lb-count");
    count.textContent = `${pos + 1} / ${list.length}`;
    cap.replaceChildren(capText, count);
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
    loadToken += 1;
    box.classList.remove("is-loading");
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

  // Clicking the backdrop (the box itself) closes; the figure and buttons do not.
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
   RENDER
   ========================================================================== */

export function render() {
  if (!D || typeof document === "undefined") return;

  const sub = document.getElementById("photo-sub");
  const gallery = document.getElementById("gallery");
  if (!sub || !gallery) return;

  const records =
    D.photography && Array.isArray(D.photography.photos)
      ? D.photography.photos
      : [];

  // Only photos whose publicId resolves to a real source make it to the page.
  const resolved = records.filter(
    (photo) =>
      photo &&
      typeof photo === "object" &&
      imageSources(photo, { widths: SHOT_WIDTHS, sizes: SHOT_SIZES }) !== null
  );

  const instagram =
    D.site && D.site.socials && typeof D.site.socials.instagram === "string"
      ? D.site.socials.instagram
      : "";
  const instagramLink = extLink("page-sub-link mono", "Instagram ↗", instagram);

  if (resolved.length === 0) {
    // Pending state: one quiet line, no empty frames.
    const wrap = el("div", "wrap");
    wrap.append(el("p", "gallery-empty", "Photographs coming soon."));
    gallery.append(wrap);
    if (instagramLink) sub.append(instagramLink);
    return;
  }

  const countSpan = el("span", "photo-count");
  countSpan.textContent = `${resolved.length} photographs`;
  sub.append(countSpan);
  if (instagramLink) {
    sub.append(document.createTextNode(" · "), instagramLink);
  }

  const wrap = el("div", "wrap");
  const list = el("ul", "masonry");
  const openers = new Map();
  const lightboxPhotos = [];

  // When a photograph 404s its cell hides and it leaves the lightbox, so the
  // "<n> photographs" count must track what is actually visible, not what was
  // resolved. Only the count span is rewritten; the Instagram link is kept.
  const showEmpty = () => {
    const empty = el("div", "wrap");
    empty.append(el("p", "gallery-empty", "Photographs coming soon."));
    gallery.replaceChildren(empty);
    sub.replaceChildren();
    if (instagramLink) sub.append(instagramLink);
  };

  const refreshCount = () => {
    const visible = lightboxPhotos.filter((photo) => !photo.broken).length;
    if (visible === 0) {
      showEmpty();
      return;
    }
    countSpan.textContent = `${visible} photographs`;
  };

  resolved.forEach((photo, index) => {
    const caption = typeof photo.caption === "string" ? photo.caption.trim() : "";
    const exif = typeof photo.exif === "string" ? photo.exif.trim() : "";

    // Responsive lightbox sources: the browser picks the width the screen
    // needs instead of always downloading the 2560px version.
    const sources = imageSources(photo, {
      widths: [960, 1440, 1920, 2560],
      sizes: "92vw"
    });
    const lb = { sources, caption, exif, ratio: cleanRatio(photo.ratio), broken: false };
    lightboxPhotos.push(lb);

    const item = el("li", "masonry-item");
    const button = el("button", "shot");
    button.type = "button";
    button.setAttribute("aria-label", `Open photograph: ${caption || "Untitled"}`);

    const frame = el("span", "shot-frame");
    frame.style.setProperty("--ratio", String(cleanRatio(photo.ratio)));

    const img = makeImg(photo, {
      widths: SHOT_WIDTHS,
      sizes: SHOT_SIZES,
      className: "shot-img"
    });

    if (img) {
      img.addEventListener("load", () => img.classList.add("is-loaded"));
      if (img.complete) img.classList.add("is-loaded");
      // A photo that fails hides its whole cell and leaves the lightbox.
      img.addEventListener("error", () => {
        item.hidden = true;
        lb.broken = true;
        refreshCount();
      }, { once: true });
      frame.append(img);
    } else {
      // resolution guaranteed a source above; still keep a quiet fallback.
      frame.classList.add("is-imgless");
      item.hidden = true;
      lb.broken = true;
    }

    const cap = el("span", "shot-cap mono", caption);
    button.append(frame, cap);
    item.append(button);
    list.append(item);
    openers.set(index, button);
  });

  wrap.append(list);
  gallery.append(wrap);
  initLightbox(lightboxPhotos, openers);
}
