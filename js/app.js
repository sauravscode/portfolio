/* ============================================================================
   app.js — behaviour
   ----------------------------------------------------------------------------
   Renders every section from DATA (see data.js) and wires the interactions:
   theme, live status clock, scroll reveals, the spine, the section-aware nav,
   the Cloudinary gallery with blur-up, the lightbox, and the custom cursor.

   Plain ES2020, no dependencies. Everything degrades gracefully:
   reduced-motion users get the content with the motion stripped out, and
   touch users get a normal pointer.
   ========================================================================== */
(() => {
  "use strict";

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const esc = (s) => String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const prefersReduced =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==========================================================================
     1. CLOUDINARY URL BUILDING
     Builds optimised, responsive URLs from a public ID. If a full URL is
     given instead (starts with http), it's used as-is so content can be wired
     before Cloudinary is set up.
     ========================================================================== */
  const cloud = (DATA.photography && DATA.photography.cloudName) || "";

  const isFullUrl = (id) => /^https?:\/\//.test(id);

  function cldUrl(publicId, { w, blur = false } = {}) {
    if (isFullUrl(publicId)) return publicId;
    const base = `https://res.cloudinary.com/${cloud}/image/upload`;
    const t = blur
      ? "f_auto,q_1,w_64,e_blur:1400,c_limit"
      : `f_auto,q_auto,c_limit${w ? `,w_${w}` : ""}`;
    return `${base}/${t}/${publicId}`;
  }

  function cldSrcset(publicId) {
    if (isFullUrl(publicId)) return "";
    return [600, 900, 1200, 1800]
      .map((w) => `${cldUrl(publicId, { w })} ${w}w`)
      .join(", ");
  }

  /* ==========================================================================
     2. RENDER — pour DATA into the page
     ========================================================================== */
  function renderMasthead() {
    $("#brand-name").textContent = DATA.site.name;
    $("#brand-role").textContent = DATA.site.role;
  }

  function renderHero() {
    const h = DATA.hero;
    $("#hero-eyebrow").textContent = h.eyebrow;

    // Each headline line becomes a masked element that wipes up on load.
    const head = $("#hero-headline");
    head.innerHTML = h.headline.map((line) => {
      const html = esc(line).replace(
        /\{\{(.+?)\}\}/g,
        '<span class="accent">$1</span>'
      );
      return `<span class="line-mask"><span>${html}</span></span>`;
    }).join("");

    $("#hero-deck").textContent = h.deck;

    $("#hero-meta").innerHTML = [
      DATA.site.locationLabel,
      DATA.site.coordinates,
      "Available for the right work"
    ].map((m) => `<span>${esc(m)}</span>`).join("");
  }

  function renderWork() {
    const items = DATA.work;
    const featured = items.find((w) => w.featured) || items[0];
    const rest = items.filter((w) => w !== featured);

    // Featured centrepiece -------------------------------------------------
    const f = featured;
    const fEl = el("article", "featured reveal");
    fEl.innerHTML = `
      <div class="featured__main">
        <p class="featured__tag mono">Featured · ${esc(f.year)}</p>
        <h3 class="featured__name">${esc(f.name)}</h3>
        <p class="featured__tagline">${esc(f.tagline)}</p>
        <p class="featured__desc">${esc(f.description)}</p>
      </div>
      <div class="featured__aside">
        <div class="manifest">${manifestRows(f.manifest)}</div>
        <ul class="stack">${f.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
        ${linksHtml(f.links)}
      </div>`;
    $("#work-featured").appendChild(fEl);

    // The rest, as an indexed list ----------------------------------------
    const list = $("#work-list");
    rest.forEach((w, i) => {
      const li = el("li", "work__item reveal");
      li.style.setProperty("--reveal-delay", `${i * 0.06}s`);
      const idx = String(i + 2).padStart(2, "0");
      const firstLink = w.links && w.links[0] ? w.links[0].href : null;
      const nameInner = firstLink
        ? `<a href="${esc(firstLink)}" target="_blank" rel="noopener">${esc(w.name)} <span class="arrow">↗</span></a>`
        : esc(w.name);
      li.innerHTML = `
        <span class="work__idx">${idx}</span>
        <div class="work__main">
          <h3 class="work__name">${nameInner}</h3>
          <p class="work__tagline">${esc(w.tagline)}</p>
          <p class="work__desc">${esc(w.description)}</p>
          <ul class="stack work__stack">${w.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
        </div>
        <span class="work__year mono">${esc(w.year)}</span>`;
      list.appendChild(li);
    });
  }

  function manifestRows(m) {
    return Object.entries(m).map(([k, v]) => `
      <div class="manifest__row">
        <span class="manifest__k">${esc(k)}</span>
        <span class="manifest__v">${esc(v)}</span>
      </div>`).join("");
  }

  function linksHtml(links) {
    if (!links || !links.length) return "";
    return links.map((l) =>
      `<a class="link-arrow" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} <span aria-hidden="true">↗</span></a>`
    ).join("");
  }

  function renderAbout() {
    $("#about-body").innerHTML =
      DATA.about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("");

    const dl = $("#about-notes");
    dl.innerHTML = DATA.about.notes.map((n) => `
      <div>
        <dt>${esc(n.k)}</dt>
        <dd>${esc(n.v)}</dd>
      </div>`).join("");
  }

  let GALLERY = [];
  function renderPhotography() {
    const p = DATA.photography;
    GALLERY = p.photos;
    $("#photo-sub").textContent = `Landscape · architecture · travel — shot on ${p.gear}`;
    $("#photo-instagram").href = p.instagram;

    const wrap = $("#gallery");
    p.photos.forEach((photo, i) => {
      const a = el("button", "shot reveal");
      a.type = "button";
      a.style.aspectRatio = String(photo.ratio || 1.5);
      a.style.setProperty("--reveal-delay", `${(i % 3) * 0.08}s`);
      a.setAttribute("aria-label", `Open photograph: ${photo.caption || "untitled"}`);
      a.dataset.index = i;

      const num = String(i + 1).padStart(2, "0");
      const img = new Image();
      img.alt = photo.caption || "Photograph by Saurav Sudhar";
      img.loading = "lazy";
      img.decoding = "async";
      img.src = cldUrl(photo.publicId, { blur: true }); // LQIP first
      const srcset = cldSrcset(photo.publicId);

      // Blur-up: load the full image, then swap and reveal.
      const full = new Image();
      full.onload = () => {
        img.src = full.currentSrc || full.src;
        if (srcset) { img.srcset = srcset; img.sizes = "(max-width: 560px) 92vw, (max-width: 1024px) 46vw, 30vw"; }
        a.classList.add("is-loaded");
      };
      full.onerror = () => a.classList.add("is-loaded"); // show LQIP rather than nothing
      if (srcset) { full.sizes = "(max-width: 560px) 92vw, (max-width: 1024px) 46vw, 30vw"; full.srcset = srcset; }
      full.src = cldUrl(photo.publicId, { w: 1200 });

      a.appendChild(img);
      a.appendChild(el("span", "shot__num mono", num));
      if (photo.caption) a.appendChild(el("span", "shot__cap", esc(photo.caption)));
      a.addEventListener("click", () => openLightbox(i));
      wrap.appendChild(a);
    });
  }

  function renderReading() {
    const book = (b) => `
      <li class="reveal">
        <span class="book__title">${esc(b.title)}</span>
        <span class="book__tag">${esc(b.tag)}</span>
        <span class="book__author">${esc(b.author)}</span>
        ${b.note ? `<span class="book__note">“${esc(b.note)}”</span>` : ""}
      </li>`;
    $("#shelf-current").innerHTML = DATA.reading.current.map(book).join("");
    $("#shelf-finished").innerHTML = DATA.reading.finished.map(book).join("");
  }

  function renderConnect() {
    const s = DATA.site.socials;
    const links = [
      ["GitHub", s.github],
      ["LinkedIn", s.linkedin],
      ["Instagram", s.instagram],
      ["Email", `mailto:${DATA.site.email}`]
    ].filter(([, href]) => href);
    $("#connect-links").innerHTML = links.map(([label, href]) => {
      const ext = href.startsWith("http") ? ' target="_blank" rel="noopener"' : "";
      return `<a href="${esc(href)}"${ext}>${esc(label)}</a>`;
    }).join("");
  }

  function renderColophon() {
    $("#colophon-name").textContent = `© ${DATA.site.name}`;
    $("#colophon-coords").textContent = DATA.site.coordinates;
    $("#colophon-year").textContent = new Date().getFullYear();
  }

  /* ==========================================================================
     3. LIVE STATUS — local time + an "observability" readout
     ========================================================================== */
  function startStatus() {
    const out = $("#status-text");
    const tz = DATA.site.timezone || "Europe/London";
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false, timeZone: tz
    });
    const tick = () => {
      out.textContent = `${DATA.site.locationLabel} · ${fmt.format(new Date())} · reconciled`;
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ==========================================================================
     4. REVEALS — IntersectionObserver lifts elements into view
     ========================================================================== */
  function startReveals() {
    const reveals = $$(".reveal, .line-mask");
    if (prefersReduced || !("IntersectionObserver" in window)) {
      reveals.forEach((n) => n.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          // stagger masked headline lines
          $$(".line-mask", e.target).forEach((m, i) =>
            m.style.setProperty("--line-delay", `${i * 0.09}s`));
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((n) => io.observe(n));
  }

  /* ==========================================================================
     5. SPINE + NAV — section-aware index and progress
     ========================================================================== */
  function startSectionObserver() {
    const sections = $$("main .section");
    const spineNum = $("#spine-num");
    const spineLabel = $("#spine-label");
    const spineFill = $("#spine-fill");
    const navLinks = $$("[data-nav]");

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const sec = e.target;
        spineNum.textContent = sec.dataset.index || "00";
        spineLabel.textContent = sec.dataset.label || "";
        const id = sec.id;
        navLinks.forEach((a) =>
          a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
      });
    }, { threshold: 0.5, rootMargin: "-30% 0px -30% 0px" });
    sections.forEach((s) => io.observe(s));

    // Scroll progress for the spine fill + masthead state
    const masthead = $("#masthead");
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      spineFill.style.height = `${pct}%`;
      masthead.classList.toggle("is-scrolled", window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ==========================================================================
     6. THEME
     ========================================================================== */
  function startTheme() {
    const root = document.documentElement;
    const toggle = $("#theme-toggle");
    const meta = $('meta[name="theme-color"]');
    const stored = localStorage.getItem("theme");
    const initial = stored ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    apply(initial);

    function apply(t) {
      root.setAttribute("data-theme", t);
      toggle.setAttribute("aria-pressed", String(t === "dark"));
      if (meta) meta.setAttribute("content", t === "dark" ? "#16150f" : "#f5f2ec");
    }
    toggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      apply(next);
    });
  }

  /* ==========================================================================
     7. MOBILE MENU
     ========================================================================== */
  function startMenu() {
    const btn = $("#menu-toggle");
    const nav = $("#primary-nav");
    const close = () => {
      nav.classList.remove("is-open");
      btn.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    };
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      btn.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
    $$("[data-nav]").forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ==========================================================================
     8. LIGHTBOX
     ========================================================================== */
  let lbIndex = 0, lastFocused = null;
  const lb = $("#lightbox"), lbImg = $("#lb-img"), lbCap = $("#lb-cap");

  function openLightbox(i) {
    lbIndex = i;
    lastFocused = document.activeElement;
    paintLightbox();
    lb.hidden = false;
    lb.classList.add("is-open");
    document.body.style.overflow = "hidden";
    $("#lb-close").focus();
    document.addEventListener("keydown", lbKeys);
  }
  function closeLightbox() {
    lb.hidden = true;
    lb.classList.remove("is-open");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", lbKeys);
    if (lastFocused) lastFocused.focus();
  }
  function paintLightbox() {
    const photo = GALLERY[lbIndex];
    lbImg.src = cldUrl(photo.publicId, { w: 1800 });
    lbImg.alt = photo.caption || "Photograph by Saurav Sudhar";
    lbCap.textContent =
      `${String(lbIndex + 1).padStart(2, "0")} / ${String(GALLERY.length).padStart(2, "0")}` +
      (photo.caption ? ` — ${photo.caption}` : "");
  }
  function step(d) { lbIndex = (lbIndex + d + GALLERY.length) % GALLERY.length; paintLightbox(); }
  function lbKeys(e) {
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "Tab") { e.preventDefault(); } // simple focus trap
  }
  $("#lb-close").addEventListener("click", closeLightbox);
  $("#lb-next").addEventListener("click", () => step(1));
  $("#lb-prev").addEventListener("click", () => step(-1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });

  /* ==========================================================================
     9. CUSTOM CURSOR — lerped ring; "VIEW" viewfinder over photos
     ========================================================================== */
  function startCursor() {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine || prefersReduced) return;
    const cur = $("#cursor");
    const label = $(".cursor__label", cur);
    cur.style.display = "block";

    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });

    (function loop() {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      cur.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();

    document.addEventListener("mouseover", (e) => {
      const shot = e.target.closest(".shot");
      const link = e.target.closest("a, button, [role='button']");
      cur.classList.toggle("is-view", !!shot);
      cur.classList.toggle("is-link", !!link && !shot);
      if (shot) label.textContent = "View";
    });
    document.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget) { cur.classList.remove("is-view", "is-link"); }
    });
    document.addEventListener("mouseleave", () => { cur.style.opacity = "0"; });
    document.addEventListener("mouseenter", () => { cur.style.opacity = "1"; });
  }

  /* ==========================================================================
     10. SMOOTH ANCHOR SCROLL (honours reduced motion via CSS)
     ========================================================================== */
  function startAnchors() {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", id);
      });
    });
  }

  /* ==========================================================================
     BOOT
     ========================================================================== */
  function init() {
    renderMasthead();
    renderHero();
    renderWork();
    renderAbout();
    renderPhotography();
    renderReading();
    renderConnect();
    renderColophon();

    startTheme();
    startStatus();
    startMenu();
    startAnchors();
    startReveals();
    startSectionObserver();
    startCursor();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
