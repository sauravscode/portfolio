# Saurav Sudhar — Portfolio

**"EVENT HORIZON."** A portfolio rendered around a real-time, gravitationally-lensed
**black hole** — Einstein-ring light bending, a doppler-shifted accretion disk, a
photon ring — written as a single WebGL fragment shader, no Three.js. The site is
a voyage: scroll is flight, sections are sectors, navigation engages the warp
drive, and Arthur C. Clarke's adage anchors the landing:
*"Any sufficiently advanced technology is indistinguishable from magic."*

Built with **vanilla HTML, CSS, and JavaScript — no framework, no build step.**

```
portfolio/
├── index.html          # semantic structure (shells that JS fills from data.js)
├── css/styles.css      # the entire design system, one sectioned file
├── js/
│   ├── data.js         # ← ALL your content lives here. Edit this, nothing else.
│   ├── app.js          # the flight computer — rendering + every interaction
│   └── space.js        # the black-hole universe (WebGL, hand-written GLSL)
└── README.md
```

---

## ✦ The one rule

**To change any content, edit [`js/data.js`](js/data.js) only.** Never touch the
HTML, CSS, `app.js`, or `space.js`. The page reads from the `DATA` object and
renders itself. Every section is commented in that file.

---

## ✦ The experience

- **The black hole** — the hero is lit by an accretion disk with doppler beaming
  (the approaching side burns brighter), a photon ring, and lensed far-side arcs.
  The starfield genuinely bends around the shadow. As you scroll, the hole recedes
  off the bow; it returns as a beacon at the final sector.
- **The voyage** — each section is a sector with its own nebula palette. Scroll
  velocity streaks the stars; clicking any nav link fires a warp burst.
- **The ship console** — press **⌘K** (or `/`) and type: `goto work`, `email`,
  `clarke`, `whoami`, `uptime`, `hyperdrive`, `coffee`, `help`…
- **Telemetry** — a live HUD (sector, velocity, local time, session clock, FPS),
  a route map on the left edge, and a mission clock in the header.
- **Engine hum** — **SND** toggles a generative WebAudio soundscape (two detuned
  oscillators + filtered stellar wind; warp whooshes on jumps). No audio files;
  off by default.
- **Signature details** — decode-scramble section titles, a constellation map of
  the featured stack, a targeting-reticle cursor with a comet trail, motes that
  gravitate toward the hole, occasional meteors, holographic panels with corner
  brackets and pointer-tracked sheen, magnetic buttons, and the konami code.

---

## Running locally

No build, no dependencies:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

`?still=1` renders a settled, static frame with all content revealed (used for
previews and tests; add `&y=1200` or `#work` to jump).

---

## Photography — adding & removing photos (Cloudinary)

The gallery is driven by [Cloudinary](https://cloudinary.com)'s free tier. You never
write an image transform by hand — the site builds optimised, responsive URLs
(`f_auto`, `q_auto`, `srcset`, fade-in) for you.

**One-time setup**

1. Create a free Cloudinary account.
2. On the **Dashboard** (top-left) copy your **Cloud name**.
3. In `js/data.js`, set it:

   ```js
   photography: {
     cloudName: "your-cloud-name",   // ← paste it here
     ...
   }
   ```

Until you set this, the gallery shows **"awaiting signal"** placeholders with your
captions — the layout is correct before the photos exist.

**Adding a photo**

1. Upload it in Cloudinary (Media Library), e.g. into a `portfolio/` folder.
2. Copy the photo's **Public ID** (includes the folder, e.g. `portfolio/derwent-water`).
3. Add an entry to the `photos` array:

   ```js
   { publicId: "portfolio/derwent-water", ratio: 1.5, caption: "Derwent Water, dawn" },
   ```

   - **`ratio`** is `width ÷ height` (3:2 → `1.5`, 2:3 → `0.667`, square → `1`).
   - **`caption`** shows on hover ("PLATE 01 — …") and in the lightbox.

**Removing a photo** — delete its line. ~10 reads best.

> **No Cloudinary yet?** Drop a full image URL straight into `publicId` (anything
> starting with `http`) and it's used as-is — wire content first, switch later.

Also set your Instagram link in the same `photography` block.

---

## Updating everything else (`js/data.js`)

| What | Where | Notes |
|------|-------|-------|
| Name / role / socials / email | `site` | Used across the header, console, channel, footer, and the live clock. |
| The Clarke quote | `hero.quote`, `hero.quoteAuthor` | The word **magic** shimmers automatically. |
| Hero statement | `hero.statement` | Wrap a phrase in `{{ }}` to colour it with the accent. |
| Projects | `work[]` | The entry with `featured: true` renders large as the "prime system" with the constellation map. `manifest` is the spec sheet; `stack` are the chips; `links` are the buttons. |
| About copy | `about.paragraphs[]` | Each string is one paragraph. |
| "Field log" notes | `about.notes[]` | `{ k: "label", v: "value" }`. |
| Reading shelves | `reading.current[]`, `reading.finished[]` | `note` is optional. |
| Live clock / location | `site.timezone`, `site.locationLabel` | Any IANA timezone string. |

---

## Deploying

It's static, so anywhere that serves files works.

### GitHub Pages

```bash
git add .
git commit -m "Portfolio"
git push origin main
```

Then: **Settings → Pages → Source: Deploy from a branch → `main` / root.**

### Netlify (drag-and-drop)

Drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

---

## Design & engineering notes

- **The 3D** — `space.js` is one full-screen WebGL fragment shader: screen-space
  gravitational lensing (radial compression toward the photon sphere plus a
  frame-drag swirl), an accretion disk built from rigidly-rotating fbm turbulence
  with doppler beaming, four parallax starfield layers, a deep-field galaxy layer
  that blooms in during the photography sector, and per-sector nebula palettes.
- **Motion** — boot sequence, warp bursts on navigation, decode-scramble titles,
  reveal-on-scroll, panel tilt + sheen, magnetic buttons, reticle cursor, comet
  trail, gravity-bound motes, meteors. Press **FX** to switch it all off (the
  choice is remembered); everything also degrades automatically under
  `prefers-reduced-motion` to a clean static frame.
- **Audio** — fully generative (oscillators + filtered noise), created only after
  a user gesture, default off. No audio assets.
- **Performance** — no framework or build; capped device-pixel-ratio with adaptive
  quality that drops render scale if frames run slow; the scene pauses when the
  tab is hidden; lazy, responsive, `f_auto/q_auto` images with reserved aspect
  ratios so there's no layout shift.
- **Security** — strict Content-Security-Policy (`script-src 'self'`), no
  third-party runtime scripts, no `innerHTML` for data (everything via
  `textContent`/`createElement`), `rel="noopener noreferrer"` on outbound links.
  Static hosting means there's no server to attack.
- **Accessibility** — semantic landmarks, a skip link, keyboard-operable menu,
  console, and lightbox (arrows / Esc), visible focus styles, `aria-label` on the
  animated name, and a `<noscript>` fallback.
- **Type** — *Space Grotesk* (display + UI), *JetBrains Mono* (telemetry),
  *Fraunces* italic reserved for the Clarke quote.

---

*Rendered around a black hole — WebGL · vanilla JS · zero frameworks.*
