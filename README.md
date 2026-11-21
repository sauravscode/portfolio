# Saurav Sudhar — Portfolio

**GALLERY** — a simple, grand, image-led portfolio. Dark as a gallery and quiet
as a gallery: near-black ground, ivory serif type, and Saurav's own photographs
doing the talking. Three pages — **Home** (a full-screen hero with the name set
large, then three tall panels: Work, Photography, Contact),
**Photography** (a masonry grid with a keyboard lightbox), and **About** (the
story, the Clarke quote in the Work section, and contact). No cards, no badges,
no metrics — just the photos and the fewest words.

## The one rule

**Edit [`js/data.js`](js/data.js) only.** Every page reads from the `DATA`
object in that one file and renders itself. The name, tagline, email, socials,
the hero photo, the three panels, the About text, the Clarke quote, and every
gallery photograph live there, each with a comment. Change nothing else.

## Adding your photos (Cloudinary)

Photos are served by [Cloudinary](https://cloudinary.com) — never committed to
this repo. You upload the original once, and Cloudinary makes the responsive
AVIF/WebP versions at every screen size, for free (the free tier is far more
than a personal portfolio needs).

**One-time setup**

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. Open the **Dashboard** and copy your **Cloud name**.
3. Paste it into `cloudinary.cloudName` in `js/data.js`.

**Per photo**

1. Open **Media Library** and upload the original — **2000–3000px on the long
   edge, JPEG, sRGB**. Don't pre-resize; Cloudinary does that for you.
2. Optionally put it in a `portfolio` folder to keep names tidy.
3. Click the asset and copy its **Public ID** — e.g. `portfolio/derwent-dawn`
   (the folder is part of the ID).
4. Paste that string into the right `publicId`:
   - `hero.image` — the full-screen opening photo;
   - `panels[i].image` — one of the three home panels;
   - `about.image` — the About portrait;
   - `photography.photos[]` — a gallery entry.
5. Add a short `alt` saying what the photo shows.
6. For gallery photos set `ratio` = width ÷ height (3:2 → `1.5`, 2:3 → `0.667`).
7. For the hero, set `focus` to choose which part survives the crop — e.g.
   `"50% 35%"`.
8. Save, commit, push — GitHub Pages redeploys.

**Why Cloudinary** — automatic AVIF/WebP and per-screen sizes, nothing heavy in
git, and a free tier far beyond this site's traffic.

**Escape hatch** — a `publicId` may also be a full `https://` image URL, or a
committed root-relative path like `/images/derwent.jpg`. Those are used exactly
as written.

**Before you add photos** the site stays calm: the hero and panels fall back to
the plain dark ground, and the Photography page shows a single line,
"Photographs coming soon." No broken-image icons, ever.

## Files

```
portfolio/
├── index.html                  # Home — hero + three panels
├── photography/index.html      # Photography — masonry + lightbox
├── about/index.html            # About — portrait, Work quote, contact
├── css/styles.css              # the whole design system, one sectioned file
├── js/
│   ├── data.js                 # ← ALL content lives here. Edit this, nothing else.
│   ├── app.js                  # thin entry point / page router
│   ├── core.js                 # helpers, images, header/footer, reveals
│   ├── home.js                 # hero + panels renderer
│   ├── photography.js          # masonry + lightbox renderer
│   └── about.js                # portrait + work + contact renderer
├── scripts/
│   └── smoke-portfolio.py      # headless-Chrome smoke test
└── README.md
```

## Running locally

```bash
python3 -m http.server 8000 --bind 127.0.0.1
# → http://127.0.0.1:8000
```

## Testing

```bash
python3 scripts/smoke-portfolio.py
```

The smoke test opens each route in headless Chrome and checks the marker
element its renderer is expected to produce.

## Design system

- **Type:** Cormorant Garamond (display and body) + DM Mono (the tiny
  letter-spaced captions and nav). One Google Fonts request, `display=swap`.
- **Colour:** ground `#0B0B0A`, ink `#ECE6DA`, muted `#A8A196`; the whole site
  is dark. Photos are the only colour.
- **Motion:** a hero fade and a gentle panel zoom, content reveals ≤ 600ms —
  all disabled under `prefers-reduced-motion`.
- **Security:** a CSP meta tag with no `'unsafe-inline'`; no inline scripts or
  styles; content rendered with `textContent`, never `innerHTML`; every URL
  passes through `safeUrl`.
- **Accessibility:** landmarks, a skip link, a keyboard lightbox with a focus
  trap that restores focus on close, visible focus rings, and ≥ 24px touch
  targets.

## Deploying

Static files — GitHub Pages (`main` / root) or drop the folder on Netlify. The
CSP is enforced with a `<meta>` tag. `frame-ancestors` and other header-only
directives cannot be set in a meta tag; configure them at the host level (a
`_headers` file on Netlify, for example) if you want them.

*Spec: [`docs/specs/gallery-rebuild.md`](docs/specs/gallery-rebuild.md).*
