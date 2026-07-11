# Saurav Sudhar — Portfolio

**"TUNGSTEN."** A dark, cinematic portfolio — engineering precision meets
night-photography atmosphere. Grandeur through lighting, negative space, and
typography; one restrained tungsten-amber accent against warm near-black.

Built with **vanilla HTML, CSS, and JavaScript — no framework, no build step.**

```
portfolio/
├── index.html              # home — the professional portfolio
├── photography/index.html  # Deep Field — plates gallery + lightbox
├── books/index.html        # The Archive — annotated reading list
├── css/styles.css          # the entire design system, one sectioned file
├── js/
│   ├── data.js             # ← ALL content lives here. Edit this, nothing else.
│   └── app.js              # renderer — fills the pages from data.js
└── README.md
```

## ✦ The one rule

**To change any content, edit [`js/data.js`](js/data.js) only.** The pages
read from the `DATA` object and render themselves. Every section is commented
in that file.

## Running locally

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Photography (Cloudinary)

1. Create a free [Cloudinary](https://cloudinary.com) account; copy your
   **Cloud name** from the dashboard into `photography.cloudName` in
   `js/data.js`.
2. Upload photos; for each, add an entry to `photography.photos`:

   ```js
   { publicId: "portfolio/derwent-water", ratio: 1.5,
     caption: "Derwent Water, dawn", exif: "24mm · f/8 · 1/60 · ISO 100" },
   ```

   `ratio` is width ÷ height (3:2 → `1.5`, 2:3 → `0.667`, square → `1`);
   `exif` is optional.
3. Until then, plates render as quiet "PLATE PENDING" frames.

The site builds responsive `f_auto,q_auto` URLs with blur-up loading for you.
A full image URL (or root-relative path) in `publicId` is used as-is.

## Books

Two shelves in `reading`: `current` and `finished`. `note` (optional) renders
as an italic margin quote in your voice. If **every** finished entry has a
`year`, the shelf groups by year, newest first.

## Design system

- **Type:** Fraunces (display serif) · IBM Plex Sans (body) · JetBrains Mono
  (labels, EXIF, statuses — the "precision marginalia" layer).
- **Color:** near-black `#0B0A08`, warm off-white `#EDE7DC`, one accent:
  tungsten amber `#E09236`. All pairs pass WCAG AA.
- **Motion:** scroll reveals, hero-glow parallax, link sweeps, image blur-up —
  and nothing else. Fully disabled under `prefers-reduced-motion`.
- **Security:** strict CSP (`script-src 'self'`), no third-party runtime JS,
  no `innerHTML` for data, `noopener noreferrer` on outbound links.
- **Accessibility:** semantic landmarks, skip links, keyboard-operable nav
  and lightbox (focus trap, Esc, arrows), visible focus, `<noscript>` fallback.

## Deploying

Static files — GitHub Pages (`main` / root) or drop the folder on Netlify.

*Spec: `docs/superpowers/specs/2026-07-11-tungsten-redesign-design.md`.*
