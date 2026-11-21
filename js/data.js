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
     • ratio     — width / height (3:2 = 1.5, 2:3 = 0.667, square = 1).
                   Photography: reserves space so the grid never jumps.
                   Hero only: width ÷ height of the photo, used so phones
                   download a sharp enough version.
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
    cloudName: "loqdzgcd"
  },

  /* --------------------------------------------------------------------------
     HERO — the full-screen opening photograph. Empty publicId = plain ground,
     with the name still shown. `focus` picks which part of the frame survives
     the full-screen crop.
     -------------------------------------------------------------------------- */
  hero: {
    image: {
      publicId: "DSC_0429",
      alt: "A car on a winding road through a highland glen beneath mountains at sunset",
      focus: "70% 50%",
      ratio: 1.895
    }
  },

  /* --------------------------------------------------------------------------
     PANELS — the three tall image panels on the home page, in order.
     The whole panel is a link, so `title` and `caption` carry its meaning.
     -------------------------------------------------------------------------- */
  panels: [
    {
      title: "Work",
      caption: "Software and infrastructure engineer",
      href: "about/#work",
      image: { publicId: "DSC_0068", alt: "Two people walking through a rain-wet underpass lined with relief murals" }
    },
    {
      title: "Photography",
      caption: "Landscape, architecture and light",
      href: "photography/",
      image: { publicId: "DSC_0588", alt: "A curved stone viaduct crossing a wooded highland glen" }
    },
    {
      title: "Contact",
      caption: "Say hello",
      href: "about/#contact",
      image: { publicId: "DSC_0166", alt: "A piper in full highland dress playing on a sandstone street" }
    }
  ],

  /* --------------------------------------------------------------------------
     ABOUT — the portrait, two short paragraphs, and the NOW line.
     -------------------------------------------------------------------------- */
  about: {
    image: { publicId: "DSC_0164", alt: "A turreted sandstone building on a city corner under a blue sky" },
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
      { publicId: "DSC_0429", ratio: 1.895,  caption: "Road through the glen" },
      { publicId: "DSC_0588", ratio: 1.7976, caption: "Viaduct in the glen" },
      { publicId: "DSC_0333", ratio: 1.4321, caption: "Pillars of light" },
      { publicId: "DSC_0068", ratio: 1.7986, caption: "Underpass, after rain" },
      { publicId: "DSC_0166", ratio: 1.5576, caption: "The piper" },
      { publicId: "DSC_0164", ratio: 1.5002, caption: "Corner, late light" },
      { publicId: "DSC_0679", ratio: 1.699,  caption: "Platform, steam railway" },
      { publicId: "DSC_0076", ratio: 1.5002, caption: "Winter fair" }
    ]
  }
};

// Expose globally so the (module) app can read it. Edit above — not this line.
window.DATA = DATA;
