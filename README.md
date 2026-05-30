# Saurav Sudhar — Portfolio

A personal portfolio with an editorial, archival aesthetic — *"Specimen / Manifest."*
Warm paper-and-ink, a characterful serif (Fraunces) for warmth, tracked monospace
(JetBrains Mono) for the infrastructure texture, and one restrained ember accent.

Built with **vanilla HTML, CSS, and JavaScript — no framework, no build step.**
Open `index.html` and it runs. The whole thing is a handful of static files, which
is the right tool for a portfolio: sub-second LCP, nothing to hydrate, full control
over every pixel of craft.

```
portfolio/
├── index.html          # semantic structure (shells that JS fills from data.js)
├── css/styles.css      # the entire design system, one organised file
├── js/
│   ├── data.js         # ← ALL your content lives here. Edit this, nothing else.
│   └── app.js          # rendering + interactions (no need to touch this)
└── README.md
```

---

## ✦ The one rule

**To change any content, edit [`js/data.js`](js/data.js) only.** Never touch the
HTML, CSS, or `app.js`. The layout reads from the `DATA` object and renders itself.
Every section is commented in that file.

---

## Running locally

No build, no dependencies. Either:

- **Just open it** — double-click `index.html`. (Photos load from Cloudinary over
  the network, so they need an internet connection.)
- **Or serve it** (nicer for development):

  ```bash
  python3 -m http.server 8000
  # then visit http://localhost:8000
  ```

---

## Photography — adding & removing photos (Cloudinary)

The gallery is driven by [Cloudinary](https://cloudinary.com)'s free tier. You never
write an image transform by hand — the site builds optimised, responsive URLs
(`f_auto`, `q_auto`, a blurred low-quality placeholder, and `srcset`) for you.

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

**Adding a photo**

1. Upload the image in Cloudinary (Media Library). Put your photos in a folder, e.g.
   `portfolio/`.
2. Copy the photo's **Public ID** (it includes the folder, e.g. `portfolio/derwent-water`).
3. Add an entry to the `photos` array:

   ```js
   { publicId: "portfolio/derwent-water", ratio: 1.5, caption: "Derwent Water, dawn" },
   ```

   - **`ratio`** is `width ÷ height`. It reserves the right space so the page never
     jumps while images load. Common values:
     - Landscape 3:2 → `1.5`
     - Portrait 2:3 → `0.667`
     - Square → `1`
   - **`caption`** is optional; it shows on hover and in the lightbox.

**Removing a photo** — delete its line from the `photos` array. Show up to ~10 for
the best composition.

> **No Cloudinary yet?** You can drop a full image URL straight into `publicId`
> (anything starting with `http`) and it's used as-is — so you can wire up the
> content first and switch to Cloudinary later.

Also set your Instagram link in the same `photography` block.

---

## Updating projects, about, reading, and links

All in `js/data.js`:

| What | Where | Notes |
|------|-------|-------|
| Hero headline & deck | `hero` | Wrap a phrase in `{{ }}` to colour it with the accent. |
| Projects | `work[]` | The entry with `featured: true` is rendered large as the centrepiece. `manifest` is the small spec-sheet; `stack` are the tech tags; `links` are the buttons. |
| About copy | `about.paragraphs[]` | Each string is one paragraph. |
| "Field log" margin notes | `about.notes[]` | `{ k: "label", v: "value" }`. |
| Reading shelves | `reading.current[]`, `reading.finished[]` | `note` is optional. |
| Name / role / socials / email | `site` | Used across the masthead, connect, and footer. |
| Live status location & timezone | `site.timezone`, `site.locationLabel` | Any IANA timezone string. |

---

## Deploying

It's static, so anywhere that serves files works.

### GitHub Pages

```bash
git add .
git commit -m "Portfolio"
git push origin main
```

Then in the repo: **Settings → Pages → Build and deployment → Source: Deploy from a
branch → Branch: `main` / root → Save.** Your site appears at
`https://<username>.github.io/<repo>/` within a minute or two.

### Netlify (drag-and-drop)

Go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the project
folder in. Done. (No build command, no publish directory needed — it's all static.)

### Netlify / Vercel (from Git)

Connect the repo. **Build command:** none. **Publish/Output directory:** the project
root (`.`).

---

## Design notes

- **Type** — *Fraunces* (display serif: warmth, the reader-of-books feel),
  *Inter* (UI), *JetBrains Mono* (metadata, the infrastructure texture). Loaded with
  `display=swap` so text paints instantly on a serif fallback while the webfont
  arrives — that keeps LCP low.
- **Colour** — a warm "paper" light theme by default (most dev portfolios are dark;
  this one isn't) with a considered warm-dark counterpart. One ember accent, used
  sparingly. Toggle in the masthead; choice is remembered, and it honours your
  system `prefers-color-scheme` on first visit.
- **Motion** — restrained and purposeful: clip-reveal headlines, lift-and-fade on
  scroll, a viewfinder cursor over photographs, an ambient "control plane" status
  strip (a quiet nod to the day job). All of it is removed automatically under
  `prefers-reduced-motion`.
- **Performance** — no framework or build; lazy-loaded images with Cloudinary
  blur-up placeholders and `srcset`; aspect ratios reserved up front so there's no
  layout shift.
- **Accessibility** — semantic landmarks, a skip link, keyboard-operable menu and
  lightbox (arrows / Esc), visible focus styles, and high contrast on both themes.

---

*Built with vanilla HTML · CSS · JS.*
