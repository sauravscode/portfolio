/* ============================================================================
   data.js — EVERYTHING YOU EDIT LIVES HERE
   ----------------------------------------------------------------------------
   The pages read this file and render themselves. To change the site, change
   this file only — never the HTML, the CSS, or the JS.

   ADDING A PHOTOGRAPH (Cloudinary) — step by step
     1. Sign in at https://cloudinary.com and open Media Library.
     2. Upload the original. 2000–3000px on the long edge is plenty; Cloudinary
        makes the smaller versions, so do not resize by hand.
     3. Keep photos in a folder (e.g. "portfolio") if you like tidy names.
     4. Click the image and copy its "Public ID" — for example
        "portfolio/derwent-dawn" (the folder is part of the ID).
     5. Paste that string into a `publicId` below.
     6. Add a short `alt` — what the photo shows, for screen readers.
     7. Save, then commit and push. That is the whole workflow.

   ONE-TIME SETUP
     • Set `cloudinary.cloudName` (below) to your Cloudinary cloud name. You
       will find it at the top left of the Cloudinary Dashboard.
     • Until you do, images are simply not rendered — the layout stays calm,
       with the ground colour showing through. No broken-image icons.

   HOW IMAGE URLS WORK
     • The site builds responsive `f_auto,q_auto` Cloudinary URLs (AVIF/WebP at
       the right width) from each publicId. Never paste a transform URL.
     • ESCAPE HATCH: a `publicId` may also be a full `https://` image URL, or a
       root-relative path such as "/images/derwent.jpg" (with the file committed
       to the repo). Those are used exactly as written.

   FIELD REFERENCE
     • publicId  — Cloudinary Public ID (preferred), or a full/root-relative URL.
     • alt       — what the image shows. Required in spirit; empty is decorative.
     • focus     — optional object-position for cropped photos, "50% 35%". It
                   chooses which part of the frame stays visible.
     • ratio     — photography only: width / height (3:2 = 1.5, 2:3 = 0.667,
                   square = 1). Reserves space so the grid never jumps.
     • caption   — photography only: a short line shown on hover and in the
                   lightbox.
     • exif      — photography only, optional: "24mm · f/8 · 1/60 · ISO 100".
   ========================================================================== */

const DATA = {

  /* --------------------------------------------------------------------------
     SITE — identity and the links used in the header and footer.
     `location` is shown as "Leeds" in the footer; keep "Leeds, UK" here.
     -------------------------------------------------------------------------- */
  site: {
    name: "Saurav Sudhar",
    tagline: "Engineer · Photographer",
    email: "sauravsnair99@gmail.com",
    location: "Leeds, UK",
    socials: {
      github: "https://github.com/sauravscode",
      linkedin: "https://www.linkedin.com/in/saurav-sudhar/",
      instagram: "https://www.instagram.com/picsxarchive/"
    }
  },

  /* --------------------------------------------------------------------------
     CLOUDINARY — one-time setup. Paste your cloud name between the quotes.
     -------------------------------------------------------------------------- */
  cloudinary: {
    cloudName: "your-cloud-name"
  },

  /* --------------------------------------------------------------------------
     HERO — the full-screen opening photograph. Empty publicId = plain ground,
     with the name still shown. `focus` picks which part of the frame survives
     the full-screen crop.
     -------------------------------------------------------------------------- */
  hero: {
    image: { publicId: "", alt: "", focus: "50% 50%" }
  },

  /* --------------------------------------------------------------------------
     PANELS — the three tall image panels on the home page, in order.
     The whole panel is a link, so `title` and `caption` carry its meaning.
     -------------------------------------------------------------------------- */
  panels: [
    {
      title: "Foundations",
      caption: "The quiet infrastructure behind NHS research",
      href: "about/#work",
      image: { publicId: "", alt: "" }
    },
    {
      title: "Photography",
      caption: "Landscape, architecture and light",
      href: "photography/",
      image: { publicId: "", alt: "" }
    },
    {
      title: "Contact",
      caption: "Say hello",
      href: "about/#contact",
      image: { publicId: "", alt: "" }
    }
  ],

  /* --------------------------------------------------------------------------
     ABOUT — the portrait, two short paragraphs, and the NOW line.
     -------------------------------------------------------------------------- */
  about: {
    image: { publicId: "", alt: "" },
    paragraphs: [
      "I'm a software and infrastructure engineer at Lancashire Teaching Hospitals, " +
      "where I help build and run a Kubernetes-based Trusted Research Environment — " +
      "the secure ground that lets researchers work with sensitive NHS data.",

      "I'm early in my career and in slightly over my head, which is where I like to " +
      "be: production clusters, multiple trusts, GitOps all the way down. Away from " +
      "the cluster I read constantly and photograph compulsively. I moved from " +
      "Cardiff to Leeds in early 2026."
    ],
    now: "Software & Infrastructure Engineer, Lancashire Teaching Hospitals NHS FT"
  },

  /* --------------------------------------------------------------------------
     WORK — one short paragraph and the Clarke quote. No project list.
     -------------------------------------------------------------------------- */
  work: {
    quote: "Any sufficiently advanced technology is indistinguishable from magic.",
    quoteAuthor: "Arthur C. Clarke",
    text:
      "At Lancashire Teaching Hospitals I help build and run k8tre: a multi-trust, " +
      "GitOps-driven Kubernetes platform for NHS Trusted Research Environments. It " +
      "gives research teams a secure place to work with sensitive data, without that " +
      "data ever leaving safe hands — single sign-on, distributed storage, enforced " +
      "network policy, and delivery toward SATRE compliance."
  },

  /* --------------------------------------------------------------------------
     PHOTOGRAPHY — the gallery grid. Each photo uses the fields described at the
     top of this file. Ratio reserves space; caption shows on hover and in the
     lightbox; exif is optional.
     -------------------------------------------------------------------------- */
  photography: {
    photos: [
      { publicId: "portfolio/photo-01", ratio: 1.5,  caption: "Northern fells, first light",
        exif: "24mm · f/8 · 1/60 · ISO 100" },
      { publicId: "portfolio/photo-02", ratio: 0.667, caption: "Concrete and sky" },
      { publicId: "portfolio/photo-03", ratio: 1.5,  caption: "Coast road" },
      { publicId: "portfolio/photo-04", ratio: 1,     caption: "Stairwell geometry" },
      { publicId: "portfolio/photo-05", ratio: 1.5,  caption: "Valley in cloud" },
      { publicId: "portfolio/photo-06", ratio: 0.667, caption: "Glass facade" },
      { publicId: "portfolio/photo-07", ratio: 1.5,  caption: "Harbour, low tide" },
      { publicId: "portfolio/photo-08", ratio: 1.5,  caption: "Moorland weather" },
      { publicId: "portfolio/photo-09", ratio: 0.667, caption: "Brutalist detail" },
      { publicId: "portfolio/photo-10", ratio: 1.5,  caption: "The road to Leeds" }
    ]
  }
};

// Expose globally so the (module) app can read it. Edit above — not this line.
window.DATA = DATA;
