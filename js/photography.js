/* ============================================================================
   photography.js — the gallery grid and the lightbox (M3).

   The Cloudinary helpers once private to this module now live in core.js
   (imageSources / makeImg), so the whole site shares one image path. What
   remains here is the page itself: resolve the photos, render the editorial
   grid with always-visible captions, and adapt the accepted focus-trapped
   lightbox
   (Esc, ← →, Tab trap, focus restore, scroll lock) to the grid buttons.

   Rules: no HTML parsing; all text goes through textContent; URLs through
   safeUrl/extLink; images through imageSources/makeImg. Optional fields
   (exif, caption) simply render nothing when missing.
   ========================================================================== */

import { D, el, extLink, imageSources, makeImg } from "./core.js";

// Editorial grid image sizing. A feature (full-width) photo can reach the
// .wrap content width — 1200px minus two 48px gutters = 1104px — so its
// srcset tops out at 2560w for sharp high-DPI displays. Paired photos share a
// row and stop at 1600w.
const FEATURE_WIDTHS = [800, 1200, 1600, 2000, 2560];
const FEATURE_SIZES = "(min-width: 1200px) 1104px, 92vw";
const PAIR_WIDTHS = [600, 900, 1200, 1600];
const PAIR_SIZES = "(min-width: 900px) 46vw, 92vw";

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

  // Swipe navigation (touch/pen): a mostly-horizontal swipe of at least 50px
  // steps prev/next. Vertical scroll gestures are ignored, and swipes that
  // start on a button stay with that button's click.
  let swipeStart = null;
  box.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
    if (event.target instanceof Element && event.target.closest("button")) return;
    swipeStart = { x: event.clientX, y: event.clientY };
  });
  box.addEventListener("pointerup", (event) => {
    if (!swipeStart) return;
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
    const start = swipeStart;
    swipeStart = null;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) <= 1.5 * Math.abs(dy)) return;
    if (dx < 0) show(current + 1);
    else show(current - 1);
  });
  box.addEventListener("pointercancel", () => {
    swipeStart = null;
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
      imageSources(photo, { widths: FEATURE_WIDTHS, sizes: FEATURE_SIZES }) !== null
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
  const list = el("ul", "gallery-grid");
  const openers = new Map();
  const lightboxPhotos = [];
  const shotMeta = []; // { item, img, featureSources, pairSources }

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

  /** Point a shot <img> at a sources object (feature or pair). */
  function applyShotSources(img, sources) {
    if (sources.srcset) {
      img.sizes = sources.sizes || "92vw";
      img.srcset = sources.srcset;
    } else {
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
    }
    img.src = sources.src;
  }

  // Feature/pair assignment: the first visible photo spans both columns and
  // the rest pair up. When the rest is odd, the last visible photo also spans
  // both columns so the grid never ends ragged. Runs after render and again
  // whenever a broken photo hides its cell.
  function relayout() {
    const visible = shotMeta.filter(({ item }) => !item.hidden);
    for (const meta of shotMeta) meta.item.classList.remove("gallery-item--feature");
    if (!visible.length) return;

    const lastIsFeature = (visible.length - 1) % 2 === 1;
    visible.forEach((meta, i) => {
      const feature = i === 0 || (lastIsFeature && i === visible.length - 1);
      meta.item.classList.toggle("gallery-item--feature", feature);
      if (meta.img) {
        applyShotSources(meta.img, feature ? meta.featureSources : meta.pairSources);
      }
    });
  }

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

    // The same photo may render full-width (feature) or half-width (pair)
    // depending on where it sits once broken images are hidden, so keep both
    // source sets and let relayout() choose.
    const featureSources = imageSources(photo, {
      widths: FEATURE_WIDTHS,
      sizes: FEATURE_SIZES
    });
    const pairSources = imageSources(photo, {
      widths: PAIR_WIDTHS,
      sizes: PAIR_SIZES
    });

    const item = el("li", "gallery-item");
    const button = el("button", "shot");
    button.type = "button";
    button.setAttribute("aria-label", `Open photograph: ${caption || "Untitled"}`);

    const frame = el("span", "shot-frame");
    frame.style.setProperty("--ratio", String(cleanRatio(photo.ratio)));

    // At render time nothing is hidden yet, so the feature/pair role is just
    // the first photo plus (when the rest is odd) the last photo. relayout()
    // re-derives this after any broken image is hidden.
    const initialFeature =
      index === 0 || ((resolved.length - 1) % 2 === 1 && index === resolved.length - 1);
    const img = makeImg(photo, {
      widths: initialFeature ? FEATURE_WIDTHS : PAIR_WIDTHS,
      sizes: initialFeature ? FEATURE_SIZES : PAIR_SIZES,
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
        relayout();
      }, { once: true });
      frame.append(img);
      shotMeta.push({ item, img, featureSources, pairSources });
    } else {
      // resolution guaranteed a source above; still keep a quiet fallback.
      frame.classList.add("is-imgless");
      item.hidden = true;
      lb.broken = true;
      shotMeta.push({ item, img: null, featureSources, pairSources });
    }

    const cap = el("span", "shot-cap mono", caption);
    button.append(frame, cap);
    item.append(button);
    list.append(item);
    openers.set(index, button);
  });

  wrap.append(list);
  gallery.append(wrap);
  relayout();
  initLightbox(lightboxPhotos, openers);
}
