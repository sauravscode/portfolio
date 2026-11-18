/* ============================================================================
   photography.js — Exposures page.
   M1 stub: M3 fills the render() body. The Cloudinary + lightbox helpers below
   are ported from the previous build so that behaviour is preserved.
   ========================================================================== */

import { D, el } from "./core.js";

const plateImages = [];

function photography() {
  return (D && D.photography) || { cloudName: "", photos: [], instagram: "", gear: "" };
}

function photos() {
  const p = photography();
  return Array.isArray(p.photos) ? p.photos : [];
}

/* ---- images -------------------------------------------------------------- */

function cloudReady() {
  const cloud = photography().cloudName;
  return Boolean(cloud) && cloud !== "your-cloud-name";
}

/** Build a Cloudinary delivery URL. `extra` is an optional transform suffix. */
function cldUrl(publicId, w, extra = "") {
  return `https://res.cloudinary.com/${photography().cloudName}` +
         `/image/upload/f_auto,q_auto,w_${w},c_limit${extra}/${publicId}`;
}

/** Resolve responsive sources for a photo, or null when no image is available.
    publicId may be a Cloudinary public ID, a full URL, or a root-relative
    same-origin path (e.g. "/test.jpg") — the latter two are used as-is. */
function photoSources(p) {
  if (!p || typeof p.publicId !== "string") return null;
  if (/^(https?:\/\/|\/)/.test(p.publicId)) {
    return { src: p.publicId, srcset: null, sizes: null, blur: null };
  }
  if (!cloudReady()) return null;
  return {
    src: cldUrl(p.publicId, 1200),
    srcset: [480, 800, 1200, 1600].map((w) => `${cldUrl(p.publicId, w)} ${w}w`).join(", "),
    sizes: "(max-width: 900px) 92vw, 820px",
    blur: cldUrl(p.publicId, 60, ",e_blur:800,q_1"),
  };
}

/** Plate figure with a reserved ratio, blur-up and a reading-style caption. */
function plateFigure(p, num, idx) {
  const fig = el("figure", "plate");
  fig.dataset.idx = String(idx);

  const frame = el("div", "plate-frame");
  frame.style.setProperty("aspect-ratio", String((p && p.ratio) || 1.5));

  const sources = photoSources(p);
  if (sources) {
    const img = el("img");
    img.alt = (p && p.caption) || "Photograph";
    img.decoding = "async";
    img.loading = num > 2 ? "lazy" : "eager";
    if (sources.blur) {
      frame.classList.add("is-blur");
      frame.style.setProperty("background-image", `url("${sources.blur}")`);
      img.addEventListener("load", () => frame.classList.add("is-loaded"), { once: true });
    }
    img.addEventListener("error", () => {
      frame.replaceChildren();
      frame.classList.remove("is-blur");
      frame.classList.add("plate-pending");
    }, { once: true });
    img.src = sources.src;
    if (sources.srcset) {
      img.srcset = sources.srcset;
      img.sizes = sources.sizes;
    }
    frame.append(img);
  } else {
    frame.classList.add("plate-pending");
  }

  const cap = el("figcaption", "plate-cap");
  const label = String((p && p.caption) || "").toUpperCase();
  cap.append(el("span", "plate-num", `Exposure ${String(num).padStart(2, "0")} — ${label}`));
  if (p && p.exif) cap.append(el("span", "plate-exif mono", p.exif));

  fig.append(frame, cap);
  plateImages.push({ index: idx, figure: fig });
  return fig;
}

/* ---- lightbox ------------------------------------------------------------ */

/** Focus-trapped viewer. Only photos with a resolved source are viewable. */
function initLightbox() {
  const box = document.getElementById("lightbox");
  if (!box) return;
  const img = document.getElementById("lb-img");
  const cap = document.getElementById("lb-cap");
  const btnClose = document.getElementById("lb-close");
  const btnPrev = document.getElementById("lb-prev");
  const btnNext = document.getElementById("lb-next");
  if (!img || !cap || !btnClose || !btnPrev || !btnNext) return;

  let current = -1;
  let returnFocus = null;

  const viewable = () => photos()
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => photoSources(p) !== null);

  function show(listPos) {
    const list = viewable();
    if (!list.length) return;
    const pos = ((listPos % list.length) + list.length) % list.length;
    current = pos;
    const { p, i } = list[pos];
    const sources = photoSources(p);
    img.src = sources.src;
    if (sources.srcset) {
      img.srcset = sources.srcset;
      img.sizes = "92vw";
    } else {
      img.removeAttribute("srcset");
    }
    img.alt = (p && p.caption) || "Photograph";
    cap.textContent = [
      `Exposure ${String(i + 1).padStart(2, "0")} — ${String((p && p.caption) || "").toUpperCase()}`,
      p && p.exif,
    ].filter(Boolean).join("   ·   ");
  }

  function open(photoIndex) {
    const list = viewable();
    const pos = list.findIndex(({ i }) => i === photoIndex);
    if (pos === -1) return;
    returnFocus = document.activeElement;
    box.hidden = false;
    document.body.style.setProperty("overflow", "hidden");
    show(pos);
    btnClose.focus();
  }

  function close() {
    box.hidden = true;
    document.body.style.removeProperty("overflow");
    if (returnFocus) returnFocus.focus();
  }

  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", () => show(current - 1));
  btnNext.addEventListener("click", () => show(current + 1));
  box.addEventListener("click", (event) => {
    if (event.target === box) close();
  });

  document.addEventListener("keydown", (event) => {
    if (box.hidden) return;
    if (event.key === "Escape") close();
    else if (event.key === "ArrowLeft") show(current - 1);
    else if (event.key === "ArrowRight") show(current + 1);
    else if (event.key === "Tab") {
      const focusables = [btnClose, btnPrev, btnNext];
      const idx = focusables.indexOf(document.activeElement);
      event.preventDefault();
      const next = event.shiftKey
        ? focusables[(idx - 1 + focusables.length) % focusables.length]
        : focusables[(idx + 1) % focusables.length];
      next.focus();
    }
  });

  for (const { index, figure } of plateImages) {
    if (photoSources(photos()[index]) === null) continue;
    const frame = figure.querySelector(".plate-frame");
    if (!frame) continue;
    frame.tabIndex = 0;
    frame.setAttribute("role", "button");
    frame.setAttribute("aria-label", `View ${(photos()[index] && photos()[index].caption) || "photograph"}`);
    frame.style.setProperty("cursor", "zoom-in");
    frame.addEventListener("click", () => open(index));
    frame.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open(index);
      }
    });
  }
}

export function render() {
  /* M3 */
}
