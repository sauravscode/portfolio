/* ============================================================================
   app.js — the flight computer (ES module).
   ----------------------------------------------------------------------------
   Reads window.DATA, renders every sector, and wires the voyage:
     • the WebGL black-hole universe (space.js) — scroll = flight
     • the SHIP CONSOLE (⌘K / "/") — a command palette with a personality
     • the route map (left edge), telemetry HUD (bottom left), live clock
     • generative WebAudio engine hum + warp whooshes (SND toggle, off by default)
     • decode-scramble section titles, reticle cursor, comet trail, motes
       with gravitational pull toward the hole, panel tilt + sheen, magnetism
     • the photography lightbox + Cloudinary URL building
     • the boot sequence, FX toggle, and the konami hyperdrive

   You should not need to edit this — content lives in data.js.
   ========================================================================== */

import { initSpace } from "./space.js";

const DATA = window.DATA;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE_POINTER = matchMedia("(hover: hover) and (pointer: fine)").matches;
// ?still=1 — render a static frame with everything revealed (previews/tests)
const STILL = REDUCED || new URLSearchParams(location.search).has("still");
const SESSION_T0 = Date.now();

let space = null;
let fxOn = true;

/* ---------- tiny DOM helpers (textContent only — no innerHTML for data) ---- */
function elem(tag, cls, text){
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function accentInto(node, str, cls = "accent"){
  node.textContent = "";
  const re = /\{\{(.+?)\}\}/g;
  let last = 0, m;
  while ((m = re.exec(str))){
    if (m.index > last) node.appendChild(document.createTextNode(str.slice(last, m.index)));
    node.appendChild(elem("span", cls, m[1]));
    last = re.lastIndex;
  }
  if (last < str.length) node.appendChild(document.createTextNode(str.slice(last)));
}
function highlightWord(node, str, word, cls){
  const i = str.toLowerCase().indexOf(word.toLowerCase());
  node.textContent = "";
  if (i < 0){ node.textContent = str; return; }
  node.appendChild(document.createTextNode(str.slice(0, i)));
  node.appendChild(elem("span", cls, str.slice(i, i + word.length)));
  node.appendChild(document.createTextNode(str.slice(i + word.length)));
}

/* ============================================================
   TOAST
   ============================================================ */
let toastTimer = 0;
function toast(msg, ms = 2600){
  const t = $("#toast");
  t.hidden = false;
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add("is-on"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove("is-on");
    setTimeout(() => { t.hidden = true; }, 300);
  }, ms);
}

/* ============================================================
   AUDIO — a tiny generative engine. No assets; pure synthesis.
   Off by default; the SND toggle (a user gesture) starts it.
   ============================================================ */
const audio = (() => {
  let ctx = null, master = null, on = false;

  function build(){
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // engine hum: two detuned low oscillators through a dark lowpass
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 220; lp.Q.value = 0.6;
    lp.connect(master);
    for (const [freq, type, g] of [[55, "sine", .05], [110.7, "triangle", .018]]){
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type; o.frequency.value = freq; og.gain.value = g;
      o.connect(og); og.connect(lp); o.start();
    }
    // slow breathing on the hum
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.07; lg.gain.value = 60;
    lfo.connect(lg); lg.connect(lp.frequency); lfo.start();

    // stellar wind: looped noise through a gentle bandpass
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf; noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 700; bp.Q.value = 0.4;
    const ng = ctx.createGain(); ng.gain.value = 0.012;
    noise.connect(bp); bp.connect(ng); ng.connect(master); noise.start();
  }

  return {
    get on(){ return on; },
    toggle(){
      if (!ctx){ try { build(); } catch { return false; } }
      on = !on;
      if (ctx.state === "suspended") ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(on ? 1 : 0, ctx.currentTime + 0.8);
      return on;
    },
    // warp whoosh: noise burst swept through a bandpass
    whoosh(){
      if (!on || !ctx) return;
      const t = ctx.currentTime;
      const len = ctx.sampleRate * 1.2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(180, t);
      bp.frequency.exponentialRampToValueAtTime(2600, t + 0.35);
      bp.frequency.exponentialRampToValueAtTime(220, t + 1.1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.18);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
      src.connect(bp); bp.connect(g); g.connect(master);
      src.start(t); src.stop(t + 1.25);
    },
    // tiny UI blip
    blip(freq = 1320){
      if (!on || !ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.1);
    },
  };
})();

/* ============================================================
   RENDER — fill the shells from DATA
   ============================================================ */
function renderHero(){
  const h = DATA.hero;
  $("#hero-eyebrow").textContent = h.eyebrow;

  // letters grouped into unbreakable words, so the name only wraps at spaces
  const name = $("#hero-name");
  name.setAttribute("aria-label", h.name);
  let i = 0;
  h.name.split(" ").forEach((word, wi) => {
    if (wi > 0){ name.appendChild(elem("span", "ltr sp")); i++; }
    const w = elem("span", "word");
    w.setAttribute("aria-hidden", "true");
    [...word].forEach(ch => {
      const s = elem("span", "ltr", ch);
      s.style.setProperty("--i", i++);
      w.appendChild(s);
    });
    name.appendChild(w);
  });

  accentInto($("#hero-statement"), h.statement);
  highlightWord($("#quote-text"), h.quote, "magic", "em");
  $("#quote-author").textContent = h.quoteAuthor;
  $("#hero-deck").textContent = h.deck;
}

function manifestDl(obj){
  const dl = elem("dl", "manifest");
  Object.entries(obj).forEach(([k, v]) => {
    const d = elem("div");
    d.appendChild(elem("dt", null, k));
    d.appendChild(elem("dd", null, v));
    dl.appendChild(d);
  });
  return dl;
}
function stackRow(stack){
  const row = elem("div", "stack");
  stack.forEach(s => row.appendChild(elem("span", "chip", s)));
  return row;
}
function linkBtn(link, cls = "btn"){
  if (!link) return null;
  const a = elem("a", cls);
  a.href = link.href; a.target = "_blank"; a.rel = "noopener noreferrer";
  a.append(elem("span", null, link.label));
  a.append(elem("span", "arr", "↗"));
  a.dataset.cursor = "OPEN";
  return a;
}

/* the featured stack rendered as a constellation — stars joined by survey lines */
function constellationSvg(stack){
  const NS = "http://www.w3.org/2000/svg";
  const W = 320, H = 230, PAD = 30;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("aria-hidden", "true");

  // deterministic star positions seeded by each name
  const seedOf = (s) => [...s].reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 7) >>> 0;
  const pts = stack.map((nm, i) => {
    const s = seedOf(nm);
    const col = i % 3, row = Math.floor(i / 3);
    const cols = 3, rows = Math.ceil(stack.length / 3);
    const cw = (W - PAD * 2) / cols, ch = (H - PAD * 2) / Math.max(rows, 1);
    return {
      nm,
      x: PAD + col * cw + (s % 1000) / 1000 * cw * 0.8 + cw * 0.1,
      y: PAD + row * ch + ((s >> 10) % 1000) / 1000 * ch * 0.7 + ch * 0.15,
    };
  });

  for (let i = 1; i < pts.length; i++){
    const ln = document.createElementNS(NS, "line");
    ln.setAttribute("x1", pts[i - 1].x.toFixed(1));
    ln.setAttribute("y1", pts[i - 1].y.toFixed(1));
    ln.setAttribute("x2", pts[i].x.toFixed(1));
    ln.setAttribute("y2", pts[i].y.toFixed(1));
    svg.appendChild(ln);
  }
  pts.forEach(p => {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", p.x.toFixed(1));
    c.setAttribute("cy", p.y.toFixed(1));
    c.setAttribute("r", "2.2");
    svg.appendChild(c);
    const tx = document.createElementNS(NS, "text");
    tx.setAttribute("x", (Math.min(p.x + 6, W - 4)).toFixed(1));
    tx.setAttribute("y", (p.y - 6).toFixed(1));
    tx.setAttribute("text-anchor", p.x > W - 70 ? "end" : "start");
    tx.textContent = p.nm;
    svg.appendChild(tx);
  });

  const wrap = elem("div", "constellation");
  wrap.appendChild(elem("span", "constellation__head mono", "SYSTEM CONSTELLATION"));
  wrap.appendChild(svg);
  return wrap;
}

function renderWork(){
  const items = DATA.work.slice();
  const fi = items.findIndex(w => w.featured);
  const featured = items.splice(fi >= 0 ? fi : 0, 1)[0];

  // --- featured "prime system" ---
  const f = elem("article", "work__featured panel");
  f.setAttribute("data-reveal", "");

  const main = elem("div", "work__featured-main");
  main.append(elem("span", "work__featured-tag mono", `◉ PRIME SYSTEM · ${featured.year}`));
  main.append(elem("h3", "work__featured-name", featured.name));
  main.append(elem("p", "work__featured-line", featured.tagline));
  main.append(elem("p", "work__featured-desc", featured.description));
  main.append(stackRow(featured.stack));
  const fbtn = linkBtn(featured.links && featured.links[0]);
  if (fbtn) main.append(fbtn);

  const side = elem("div", "work__featured-side");
  side.append(constellationSvg(featured.stack));
  side.append(manifestDl(featured.manifest));

  f.append(main, side, elem("span", "sheen"));
  $("#work-featured").append(f);

  // --- the rest as indexed modules ---
  const list = $("#work-list");
  items.forEach((w, idx) => {
    const li = elem("li", "module panel");
    li.setAttribute("data-reveal", "");
    li.style.setProperty("--i", idx);

    const top = elem("div", "module__top");
    top.append(elem("span", "module__idx mono", String(idx + 2).padStart(2, "0")));
    top.append(elem("span", "module__year mono", w.year));
    li.append(top);

    li.append(elem("h3", "module__name", w.name));
    li.append(elem("p", "module__line", w.tagline));
    li.append(elem("p", "module__desc", w.description));
    li.append(stackRow(w.stack));

    const foot = elem("div", "module__foot");
    const b = linkBtn(w.links && w.links[0]);
    if (b) foot.append(b);
    li.append(foot);
    li.append(elem("span", "sheen"));
    list.append(li);
  });
}

function renderAbout(){
  const body = $("#about-body");
  DATA.about.paragraphs.forEach((p, i) => {
    const para = elem("p", null, p);
    para.setAttribute("data-reveal", "");
    para.style.setProperty("--i", i);
    body.append(para);
  });
  const dl = $("#about-notes");
  DATA.about.notes.forEach(n => {
    const d = elem("div");
    d.append(elem("dt", null, n.k));
    d.append(elem("dd", null, n.v));
    dl.append(d);
  });
}

/* ---------- Photography (Cloudinary) ---------- */
const CLOUD = DATA.photography.cloudName;
const isHttp = (s) => /^https?:\/\//.test(s);
const isPlaceholder = (p) => CLOUD === "your-cloud-name" && !isHttp(p.publicId);
function cloudUrl(publicId, w){
  if (isHttp(publicId)) return publicId;
  return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,c_fill,w_${w}/${publicId}`;
}

const realShots = [];

function renderPhotography(){
  $("#photo-sub").textContent =
    `Landscape · architecture · the behaviour of light — ${DATA.photography.gear}`;
  const ig = $("#photo-instagram");
  ig.href = DATA.photography.instagram; ig.dataset.cursor = "OPEN";

  const gallery = $("#gallery");
  DATA.photography.photos.forEach((p, idx) => {
    const fig = elem("figure", "shot");
    fig.setAttribute("data-reveal", "");
    fig.style.setProperty("--i", idx % 6);
    const media = elem("div", "shot__media");
    media.style.aspectRatio = String(p.ratio || 1.5);

    if (isPlaceholder(p)){
      fig.classList.add("is-placeholder");
      const ph = elem("div", "shot__ph-label");
      ph.append(elem("span", null, "◇ AWAITING SIGNAL"));
      ph.append(elem("span", null, p.caption || ""));
      media.append(ph);
      fig.append(media);
      gallery.append(fig);
      return;
    }

    const img = new Image();
    img.alt = p.caption || "Photograph";
    img.loading = "lazy"; img.decoding = "async";
    img.src = cloudUrl(p.publicId, 900);
    if (!isHttp(p.publicId)){
      img.srcset = [480, 900, 1400].map(w => `${cloudUrl(p.publicId, w)} ${w}w`).join(", ");
      img.sizes = "(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw";
    }
    img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
    if (img.complete) img.classList.add("is-loaded");
    media.append(img);

    const cap = elem("figcaption", "shot__cap");
    cap.textContent = `PLATE ${String(idx + 1).padStart(2, "0")} — ${p.caption || ""}`;
    fig.append(media, cap);

    const fullIndex = realShots.length;
    realShots.push({ src: cloudUrl(p.publicId, 1800), caption: p.caption || "" });
    fig.dataset.cursor = "VIEW";
    fig.addEventListener("click", () => openLightbox(fullIndex));
    gallery.append(fig);
  });
}

function renderReading(){
  const fill = (sel, books, cls) => {
    const ul = $(sel); ul.classList.add(cls);
    books.forEach((b, i) => {
      const li = elem("li", "book");
      li.setAttribute("data-reveal", "");
      li.style.setProperty("--i", i % 8);
      li.append(elem("span", "book__title", b.title));
      const meta = elem("div", "book__meta");
      meta.append(elem("span", "book__author", b.author));
      if (b.tag) meta.append(elem("span", "book__tag", b.tag));
      li.append(meta);
      if (b.note) li.append(elem("p", "book__note", b.note));
      ul.append(li);
    });
  };
  fill("#shelf-current", DATA.reading.current, "shelf--current");
  fill("#shelf-finished", DATA.reading.finished, "shelf--finished");
}

function renderConnect(){
  const mail = $("#connect-mail");
  mail.href = `mailto:${DATA.site.email}`;
  mail.dataset.cursor = "TRANSMIT";
  $("#connect-mail-text").textContent = DATA.site.email;

  const wrap = $("#connect-links");
  const s = DATA.site.socials;
  [
    { label: "GitHub", href: s.github },
    { label: "LinkedIn", href: s.linkedin },
    { label: "Instagram", href: s.instagram },
  ].forEach(l => {
    if (!l.href) return;
    const a = elem("a", "connect__link");
    a.href = l.href; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.dataset.cursor = "OPEN";
    a.append(elem("span", null, l.label));
    a.append(elem("span", "arr", "→"));
    wrap.append(a);
  });
}

function renderChrome(){
  $("#brand-name").textContent = DATA.site.name;
  $("#brand-role").textContent = DATA.site.role;
  $("#colophon-name").textContent = `© ${new Date().getFullYear()} ${DATA.site.name}`;
  $("#colophon-coords").textContent = DATA.site.coordinates;
  $("#colophon-year").textContent = DATA.site.locationLabel;
}

/* ============================================================
   ROUTE MAP — the voyage, drawn on the left edge
   ============================================================ */
function buildRoute(){
  const route = $("#route");
  const track = elem("span", "route__track");
  const fill = elem("span", "route__fill");
  fill.id = "route-fill";
  track.append(fill);
  route.append(track);

  $$("main .section").forEach(sec => {
    const b = elem("button", "route__wp");
    b.type = "button";
    b.setAttribute("aria-label", `Go to ${sec.dataset.label}`);
    b.dataset.target = sec.id;
    b.append(elem("span", "route__node"));
    b.append(elem("span", "route__label", `${sec.dataset.index} ${sec.dataset.label.toUpperCase()}`));
    b.addEventListener("click", () => warpTo(`#${sec.id}`));
    route.append(b);
  });
}

/* ============================================================
   SCRAMBLE — decode-in section titles
   ============================================================ */
const GLYPHS = "▚▞▘▝<>/\\[]{}=+*#%@$&0123456789ABCDEF";
function scramble(node, duration = 850){
  const finalText = node.dataset.final || node.textContent;
  node.dataset.final = finalText;
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    const settled = Math.floor(p * finalText.length);
    let out = finalText.slice(0, settled);
    for (let i = settled; i < finalText.length; i++){
      out += finalText[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    node.textContent = out;
    if (p < 1) requestAnimationFrame(step);
    else node.textContent = finalText;
  };
  requestAnimationFrame(step);
}

function startScrambles(){
  if (STILL || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries){
      if (e.isIntersecting){ scramble(e.target); io.unobserve(e.target); }
    }
  }, { threshold: 0.4 });
  $$("[data-scramble]").forEach(n => io.observe(n));
}

/* ============================================================
   TELEMETRY — header clock + bottom-left HUD
   ============================================================ */
function startTelemetry(){
  const out = $("#telemetry-text");
  const hudLoc = $("#hud-loc");
  const hudUp = $("#hud-uptime");
  const tz = DATA.site.timezone;
  const place = (DATA.site.locationLabel || "").split(",")[0].toUpperCase();
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const tick = () => {
    const now = fmt.format(new Date());
    out.textContent = `${place} ${now} · NOMINAL`;
    hudLoc.textContent = `${place} ${now}`;
    const s = Math.floor((Date.now() - SESSION_T0) / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    hudUp.textContent = `${mm}:${ss}`;
  };
  tick();
  setInterval(tick, 1000);
}

function startHudLoop(){
  const hudVel = $("#hud-vel"), hudFps = $("#hud-fps");
  let lastTxt = 0;
  const loop = (now) => {
    if (now - lastTxt > 150){
      lastTxt = now;
      if (space && fxOn && !STILL){
        hudVel.textContent = `${(space.getVel() * 0.92).toFixed(3)}c`;
        hudFps.textContent = String(space.getFps());
      } else {
        hudVel.textContent = "0.000c";
        hudFps.textContent = "STATIC";
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ============================================================
   SCROLL — sectors, veil, deck, route, nav → space
   ============================================================ */
const SECTIONS = () => $$("main .section");

function startScroll(){
  const sections = SECTIONS();
  const deck = $("#deck"), veil = $("#veil");
  const navLinks = $$(".nav a[data-nav]");
  const routeFill = $("#route-fill");
  const hudSector = $("#hud-sector");
  let lastY = window.scrollY, ticking = false;

  const update = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const prog = max > 0 ? y / max : 0;

    if (routeFill) routeFill.style.height = `${prog * 100}%`;
    if (space) space.setScroll(prog);

    if (veil && !STILL){
      const v = Math.min(0.72, Math.max(0, (y - window.innerHeight * 0.32) / (window.innerHeight * 0.6)));
      veil.style.opacity = v.toFixed(3);
    }

    // current sector
    let cur = sections[0];
    const probe = y + window.innerHeight * 0.4;
    for (const s of sections){ if (s.offsetTop <= probe) cur = s; }
    if (cur){
      const idx = parseInt(cur.dataset.index, 10) || 0;
      if (space) space.setSector(idx);
      hudSector.textContent = `${cur.dataset.index} · ${cur.dataset.label.toUpperCase()}`;
      navLinks.forEach(a => a.classList.toggle("is-current", a.getAttribute("href") === `#${cur.id}`));
      $$(".route__wp").forEach(w => w.classList.toggle("is-current", w.dataset.target === cur.id));
    }

    // deck: stuck + auto-hide on scroll-down (unless menu open)
    deck.classList.toggle("is-stuck", y > 24);
    const menuOpen = $("#primary-nav").classList.contains("is-open");
    if (!menuOpen && y > 480 && y > lastY + 4) deck.classList.add("is-hidden");
    else if (y < lastY - 4 || y < 480) deck.classList.remove("is-hidden");
    lastY = y;
    ticking = false;
  };
  const onScroll = () => { if (!ticking){ ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
}

/* warp-assisted navigation — every in-page jump fires the drive */
function warpTo(hash){
  const target = $(hash);
  if (!target) return;
  if (!STILL && fxOn){
    space?.warpBurst?.();
    audio.whoosh();
  }
  target.scrollIntoView({ behavior: STILL ? "auto" : "smooth" });
}

function startWarpNav(){
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute("href");
    if (hash.length < 2) return;
    e.preventDefault();
    warpTo(hash);
    history.replaceState(null, "", hash);
  });
}

/* ============================================================
   REVEAL ON SCROLL
   ============================================================ */
function startReveals(){
  if (STILL || !("IntersectionObserver" in window)){
    $$("[data-reveal]").forEach(n => n.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries){
      if (e.isIntersecting){ e.target.classList.add("is-in"); io.unobserve(e.target); }
    }
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.1 });
  $$("[data-reveal]").forEach(n => io.observe(n));
}

/* ============================================================
   NAV (mobile menu)
   ============================================================ */
function startNav(){
  const toggle = $("#menu-toggle"), nav = $("#primary-nav");
  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
}

/* ============================================================
   TILT + SHEEN + MAGNETISM
   ============================================================ */
function startTilt(){
  if (!FINE_POINTER || STILL) return;
  $$(".module, .work__featured").forEach(card => {
    card.addEventListener("pointermove", (e) => {
      if (document.body.classList.contains("fx-off")) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (0.5 - py) * 6, ry = (px - 0.5) * 8;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });

  // magnetic pull on pill buttons
  $$(".btn, .connect__link, .photo__more").forEach(el => {
    el.addEventListener("pointermove", (e) => {
      if (document.body.classList.contains("fx-off")) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.3}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
}

/* ============================================================
   CURSOR (reticle) + FX CANVAS (trail, motes, gravity, meteors)
   ============================================================ */
const pointer = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 };

function startCursor(){
  const cursor = $("#cursor");
  const label = $(".cursor__label", cursor);
  const fx = $("#fx");
  const ctx = fx.getContext("2d");
  let dpr = Math.min(devicePixelRatio || 1, 2);
  let motes = [], trail = [], meteors = [], rafId = 0, running = false;
  let nextMeteor = performance.now() + 4000;

  function size(){
    dpr = Math.min(devicePixelRatio || 1, 2);
    fx.width = innerWidth * dpr; fx.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function seedMotes(){
    const n = Math.max(14, Math.min(40, Math.round(innerWidth * innerHeight / 46000)));
    motes = Array.from({ length: n }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.12, vy: -0.05 - Math.random() * 0.18,
      r: 0.6 + Math.random() * 1.4, a: 0.06 + Math.random() * 0.16,
      tw: Math.random() * 6.28,
    }));
  }
  const COLORS = ["91,233,255", "139,108,255", "255,93,177"];

  function frame(now){
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalCompositeOperation = "lighter";

    // gravity: while the hero hole is on screen, motes drift toward it
    const pull = Math.max(0, 1 - window.scrollY / (innerHeight * 0.9));
    const gx = innerWidth / 2, gy = innerHeight * 0.36;

    for (const m of motes){
      if (pull > 0.02){
        const dx = gx - m.x, dy = gy - m.y;
        const d2 = dx * dx + dy * dy;
        const f = (pull * 14) / Math.max(d2, 8000);
        m.vx += dx * f * 0.05; m.vy += dy * f * 0.05;
        m.vx *= 0.995; m.vy *= 0.995;
      }
      m.x += m.vx; m.y += m.vy; m.tw += 0.02;
      if (m.y < -5){ m.y = innerHeight + 5; m.x = Math.random() * innerWidth; }
      if (m.y > innerHeight + 5) m.y = -5;
      if (m.x < -5) m.x = innerWidth + 5;
      if (m.x > innerWidth + 5) m.x = -5;
      const a = m.a * (0.6 + 0.4 * Math.sin(m.tw));
      ctx.beginPath();
      ctx.fillStyle = `rgba(160,190,255,${a})`;
      ctx.arc(m.x, m.y, m.r, 0, 6.2832); ctx.fill();
    }

    // occasional meteor
    if (now > nextMeteor){
      nextMeteor = now + 5000 + Math.random() * 9000;
      const fromLeft = Math.random() < 0.5;
      meteors.push({
        x: fromLeft ? -30 : innerWidth + 30,
        y: Math.random() * innerHeight * 0.45,
        vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 5),
        vy: 2.2 + Math.random() * 2.4,
        life: 1,
      });
    }
    for (let i = meteors.length - 1; i >= 0; i--){
      const mt = meteors[i];
      mt.x += mt.vx; mt.y += mt.vy; mt.life -= 0.012;
      if (mt.life <= 0 || mt.y > innerHeight + 40){ meteors.splice(i, 1); continue; }
      const grad = ctx.createLinearGradient(mt.x, mt.y, mt.x - mt.vx * 9, mt.y - mt.vy * 9);
      grad.addColorStop(0, `rgba(255,244,220,${0.85 * mt.life})`);
      grad.addColorStop(1, "rgba(255,244,220,0)");
      ctx.strokeStyle = grad; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(mt.x, mt.y);
      ctx.lineTo(mt.x - mt.vx * 9, mt.y - mt.vy * 9);
      ctx.stroke();
    }

    // comet trail
    for (let i = trail.length - 1; i >= 0; i--){
      const p = trail[i];
      p.life -= 0.045;
      if (p.life <= 0){ trail.splice(i, 1); continue; }
      const r = p.life * 7 + 1;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.c},${p.life * 0.5})`;
      ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    rafId = requestAnimationFrame(frame);
  }
  function start(){ if (running) return; running = true; size(); seedMotes(); rafId = requestAnimationFrame(frame); }
  function stop(){ running = false; cancelAnimationFrame(rafId); ctx.clearRect(0, 0, innerWidth, innerHeight); }

  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY;
    pointer.nx = (e.clientX / innerWidth) * 2 - 1;
    pointer.ny = -((e.clientY / innerHeight) * 2 - 1);
    if (space) space.setPointer(pointer.nx, pointer.ny);
    if (FINE_POINTER){
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      if (running){
        trail.push({ x: e.clientX, y: e.clientY, life: 1, c: COLORS[trail.length % 3] });
        if (trail.length > 22) trail.shift();
      }
    }
  }, { passive: true });

  if (FINE_POINTER){
    document.addEventListener("pointerover", (e) => {
      const hit = e.target.closest("a, button, .shot, [data-cursor]");
      if (hit){ cursor.classList.add("is-active"); label.textContent = hit.dataset.cursor || ""; }
    });
    document.addEventListener("pointerout", (e) => {
      if (!e.relatedTarget || !e.relatedTarget.closest?.("a, button, .shot, [data-cursor]")){
        cursor.classList.remove("is-active"); label.textContent = "";
      }
    });
    window.addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    window.addEventListener("pointerup", () => cursor.classList.remove("is-down"));
    window.addEventListener("resize", () => { if (running){ size(); seedMotes(); } }, { passive: true });
  }

  return { start, stop };
}

/* ============================================================
   LIGHTBOX
   ============================================================ */
let lbIndex = 0;
function openLightbox(i){
  lbIndex = i;
  const lb = $("#lightbox");
  lb.hidden = false;
  requestAnimationFrame(() => lb.classList.add("is-open"));
  document.body.style.overflow = "hidden";
  showLightbox();
  $("#lb-close").focus();
}
function showLightbox(){
  const shot = realShots[lbIndex];
  if (!shot) return;
  $("#lb-img").src = shot.src;
  $("#lb-img").alt = shot.caption;
  $("#lb-cap").textContent = shot.caption;
}
function closeLightbox(){
  const lb = $("#lightbox");
  lb.classList.remove("is-open");
  document.body.style.overflow = "";
  setTimeout(() => { lb.hidden = true; $("#lb-img").src = ""; }, 320);
}
function stepLightbox(d){
  if (!realShots.length) return;
  lbIndex = (lbIndex + d + realShots.length) % realShots.length;
  showLightbox();
}
function startLightbox(){
  $("#lb-close").addEventListener("click", closeLightbox);
  $("#lb-prev").addEventListener("click", () => stepLightbox(-1));
  $("#lb-next").addEventListener("click", () => stepLightbox(1));
  $("#lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox") closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if ($("#lightbox").hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") stepLightbox(-1);
    if (e.key === "ArrowRight") stepLightbox(1);
  });
}

/* ============================================================
   HYPERDRIVE (konami + console command)
   ============================================================ */
let hyperTimer = 0;
function engageHyperdrive(){
  if (STILL) return;
  document.body.classList.add("hyper");
  space?.setHyper?.(true);
  space?.warpBurst?.();
  audio.whoosh();
  toast("⚡ HYPERDRIVE ENGAGED");
  clearTimeout(hyperTimer);
  hyperTimer = setTimeout(() => {
    document.body.classList.remove("hyper");
    space?.setHyper?.(false);
    toast("sublight restored", 1800);
  }, 8000);
}

function startKonami(){
  const SEQ = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown",
               "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let i = 0;
  document.addEventListener("keydown", (e) => {
    i = (e.key === SEQ[i]) ? i + 1 : (e.key === SEQ[0] ? 1 : 0);
    if (i === SEQ.length){ i = 0; engageHyperdrive(); }
  });
}

/* ============================================================
   SHIP CONSOLE (⌘K / "/")
   ============================================================ */
function startConsole(){
  const root = $("#console");
  const input = $("#console-input");
  const list = $("#console-list");
  const out = $("#console-out");
  let sel = 0, current = [];

  const open3rd = (url) => { window.open(url, "_blank", "noopener,noreferrer"); };
  const say = (msg) => { out.textContent = msg; };

  const COMMANDS = [
    { name: "goto arrival",    desc: "fly to the top",                   run: () => { close(); warpTo("#hero"); } },
    { name: "goto work",       desc: "sector 01 — selected systems",     run: () => { close(); warpTo("#work"); } },
    { name: "goto operator",   desc: "sector 02 — profile",              run: () => { close(); warpTo("#about"); } },
    { name: "goto deep field", desc: "sector 03 — photography",          run: () => { close(); warpTo("#photography"); } },
    { name: "goto archive",    desc: "sector 04 — reading",              run: () => { close(); warpTo("#reading"); } },
    { name: "goto channel",    desc: "sector 05 — connect",              run: () => { close(); warpTo("#connect"); } },
    { name: "email",           desc: "open a channel to the operator",   run: () => { location.href = `mailto:${DATA.site.email}`; } },
    { name: "github",          desc: "open the code transmission",       run: () => open3rd(DATA.site.socials.github) },
    { name: "linkedin",        desc: "open the formal channel",          run: () => open3rd(DATA.site.socials.linkedin) },
    { name: "instagram",       desc: "open the deep-field feed",         run: () => open3rd(DATA.photography.instagram) },
    { name: "fx",              desc: "toggle motion & effects",          run: () => { $("#motion-toggle").click(); say(`fx ${fxOn ? "online" : "offline"}`); } },
    { name: "audio",           desc: "toggle the engine hum",            run: () => { $("#audio-toggle").click(); say(audio.on ? "engine hum online" : "running silent"); } },
    { name: "hyperdrive",      desc: "you know what this does",          run: () => { close(); engageHyperdrive(); } },
    { name: "whoami",          desc: "identify the operator",            run: () => say(`${DATA.site.name} — ${DATA.site.role}, ${DATA.site.locationLabel}. ${DATA.site.coordinates}`) },
    { name: "uptime",          desc: "session elapsed",                  run: () => { const s = Math.floor((Date.now() - SESSION_T0) / 1000); say(`T+${Math.floor(s / 60)}m ${s % 60}s — all systems nominal`); } },
    { name: "clarke",          desc: "print the adage",                  run: () => say(`“${DATA.hero.quote}” — ${DATA.hero.quoteAuthor}`) },
    { name: "coffee",          desc: "request supplies",                 run: () => say("☕ brewing… ERROR 418: I'm a teapot. The operator runs on flat whites.") },
    { name: "sudo",            desc: "request elevation",                run: () => say("permission denied: this vessel answers only to the operator.") },
    { name: "help",            desc: "list every command",               run: () => say(COMMANDS.map(c => c.name).join(" · ")) },
  ];

  function render(){
    const q = input.value.trim().toLowerCase();
    current = q
      ? COMMANDS.filter(c => c.name.includes(q) || c.desc.toLowerCase().includes(q))
      : COMMANDS;
    sel = Math.min(sel, Math.max(0, current.length - 1));
    list.textContent = "";
    current.forEach((c, i) => {
      const li = elem("li", "console__item" + (i === sel ? " is-sel" : ""));
      li.setAttribute("role", "option");
      li.append(elem("span", "console__item-name", c.name));
      li.append(elem("span", "console__item-desc", c.desc));
      li.addEventListener("click", () => { audio.blip(); c.run(); });
      list.append(li);
    });
  }

  function open(){
    if (!root.hidden) return;
    root.hidden = false;
    requestAnimationFrame(() => root.classList.add("is-open"));
    input.value = ""; out.textContent = ""; sel = 0;
    render();
    input.focus();
    audio.blip(1680);
  }
  function close(){
    root.classList.remove("is-open");
    setTimeout(() => { root.hidden = true; }, 180);
  }

  input.addEventListener("input", () => { sel = 0; render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown"){ e.preventDefault(); sel = Math.min(sel + 1, current.length - 1); render(); audio.blip(990); }
    if (e.key === "ArrowUp"){ e.preventDefault(); sel = Math.max(sel - 1, 0); render(); audio.blip(990); }
    if (e.key === "Enter"){
      e.preventDefault();
      const q = input.value.trim().toLowerCase();
      const exact = COMMANDS.find(c => c.name === q);
      const cmd = exact || current[sel];
      if (cmd){ audio.blip(); cmd.run(); }
      else say(`unrecognised command: "${q}" — try help`);
    }
    if (e.key === "Escape") close();
  });
  root.addEventListener("click", (e) => { if (e.target === root) close(); });
  $("#console-toggle").addEventListener("click", open);

  document.addEventListener("keydown", (e) => {
    const typing = /^(input|textarea)$/i.test(document.activeElement?.tagName || "");
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"){ e.preventDefault(); root.hidden ? open() : close(); }
    else if (e.key === "/" && !typing && root.hidden && $("#lightbox").hidden){ e.preventDefault(); open(); }
  });
}

/* ============================================================
   BOOT + FX/SND TOGGLES + lifecycle
   ============================================================ */
function reveal(skipped = false){
  if (!document.body.classList.contains("js-loading")) return;
  document.body.classList.remove("js-loading");
  document.body.classList.add("is-ready");
  const boot = $("#boot");
  if (boot){ boot.classList.add("is-done"); setTimeout(() => boot.remove(), 800); }
  // if boot was skipped early, don't make the name wait for its cue
  if (skipped){
    $$(".hero__name .ltr").forEach((l, i) => { l.style.animationDelay = `${120 + i * 42}ms`; });
  }
}

function init(){
  if (STILL) document.body.classList.add("still");

  // 1. render everything from data
  renderChrome();
  renderHero();
  renderWork();
  renderAbout();
  renderPhotography();
  renderReading();
  renderConnect();
  buildRoute();

  // 2. behaviours
  startTelemetry();
  startReveals();
  startScrambles();
  startNav();
  startTilt();
  startLightbox();
  startScroll();
  startWarpNav();
  startConsole();
  startKonami();

  // 3. the universe (also drawn — statically — under reduced motion)
  try { space = initSpace($("#stage")); } catch (e){ console.warn("[space] init failed", e); }
  if (STILL && space) space.still(REDUCED ? 0.4 : 1);

  // 4. cursor + fx canvas
  const fx = startCursor();

  // 5. HUD readout loop
  startHudLoop();

  // 6. FX toggle (persisted)
  const fxBtn = $("#motion-toggle");
  fxOn = !STILL && localStorage.getItem("fx") !== "off";
  const applyFx = () => {
    document.body.classList.toggle("fx-off", !fxOn);
    fxBtn.setAttribute("aria-pressed", String(fxOn));
    if (fxOn){ space?.resume?.(); space?.setIntensity?.(1); if (FINE_POINTER) fx.start(); }
    else { space?.setIntensity?.(0); space?.pause?.(); fx.stop(); }
  };
  fxBtn.addEventListener("click", () => {
    fxOn = !fxOn; localStorage.setItem("fx", fxOn ? "on" : "off"); applyFx();
  });
  applyFx();

  // 7. SND toggle — generative audio needs a user gesture, so never auto-on
  const sndBtn = $("#audio-toggle");
  sndBtn.addEventListener("click", () => {
    const on = audio.toggle();
    sndBtn.setAttribute("aria-pressed", String(on));
    toast(on ? "♪ engine hum online" : "running silent", 1600);
  });

  // 8. pause heavy work when the tab is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden){ space?.pause?.(); fx.stop(); }
    else if (fxOn){ space?.resume?.(); if (FINE_POINTER) fx.start(); }
  });

  // 9. boot sequence (click/key to skip)
  if (STILL || !fxOn){ reveal(); }
  else {
    const bootDone = setTimeout(() => reveal(false), 2050);
    const skip = () => { clearTimeout(bootDone); reveal(true); };
    $("#boot").addEventListener("click", skip, { once: true });
    document.addEventListener("keydown", function onKey(){
      document.removeEventListener("keydown", onKey);
      if (document.body.classList.contains("js-loading")) skip();
    });
  }

  // safety net: never leave content hidden
  setTimeout(() => { if (document.body.classList.contains("js-loading")) reveal(); }, 4000);

  // ?still preview: representative veil so stacked content reads correctly
  if (STILL){
    const v = $("#veil"); if (v) v.style.opacity = "0.6";
    document.documentElement.style.scrollBehavior = "auto";
    const y = new URLSearchParams(location.search).get("y");
    setTimeout(() => {
      try {
        if (y != null) window.scrollTo(0, parseInt(y, 10) || 0);
        else if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
      } catch {}
      // re-render the settled frame so the background matches the new sector
      setTimeout(() => space?.still?.(REDUCED ? 0.4 : 1), 250);
    }, 1200);
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
