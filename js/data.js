/* ============================================================================
   data.js — THE SINGLE SOURCE OF TRUTH
   ----------------------------------------------------------------------------
   Everything content-specific lives here. To update the site, edit THIS FILE
   ONLY — never touch the HTML pages, the CSS, or app.js. The pages read
   from this object and render themselves.

   Quick reference:
     • site         → name, role, location, email, social links + status fields
     • hero         → statement, deck, and the Clarke quote (footer epigraph)
     • work         → services/projects (first entry = the featured "primary system")
     • changelog    → dated history feed: role / ship / event / move
     • about        → operator profile paragraphs + runbook notes
     • photography  → Cloudinary cloud name + the photo list + Instagram
     • reading      → currently-reading (installing) and finished (resolved)

   Status-page additions (owner-maintained — never computed):
     • site.status        { level: "operational" | "active" | "away", label }
     • site.availability  { hours: [open, close], days: [ISO 1–7] } in site.timezone
     • site.updated       "YYYY-MM" — the footer's "last updated"
     • work[].status      "operational" | "active" | "complete"
     • work[].start       "YYYY-MM" first active month (activity bar)
     • work[].end         "YYYY-MM" last active month, or null when ongoing
     • work[].changes     optional [{ date: "YYYY-MM", text }]

   A note on accents: anywhere you see {{ }}, the wrapped phrase is printed in
   the italic accent style. Use it sparingly.
   ========================================================================== */

const DATA = {

  /* --------------------------------------------------------------------------
     SITE — identity and the links used in the header and footer.
     -------------------------------------------------------------------------- */
  site: {
    name: "Saurav Sudhar",
    role: "Software · Infrastructure Engineer",
    // Drives the live "mission control" clock. Any IANA timezone works.
    timezone: "Europe/London",
    locationLabel: "Leeds, UK",
    // Ambient coordinate readout in the telemetry strip.
    coordinates: "53.8008°N · 1.5491°W",
    email: "sauravsnair99@gmail.com",

    // Owner-written banner. level: "operational" | "active" | "away".
    // This is a statement, not a computed health check.
    status: {
      level: "active",
      label: "Building karectl at LTH · open to conversations"
    },

    // On-call window in the timezone above. days: ISO weekday (1 = Monday).
    availability: { hours: [9, 18], days: [1, 2, 3, 4, 5] },

    // Owner-maintained "last updated". Shown in the footer; never computed.
    updated: "2026-11",

    socials: {
      github: "https://github.com/sauravscode",
      linkedin: "https://www.linkedin.com/in/saurav-sudhar/",
      instagram: "https://www.instagram.com/"
    }
  },

  /* --------------------------------------------------------------------------
     HERO — the opening sequence. The Clarke quote is the centrepiece; keep it.
     `statement` is the short human line under the name ({{ }} = accent).
     -------------------------------------------------------------------------- */
  hero: {
    name: "Saurav Sudhar",
    role: "Software · Infrastructure Engineer",
    statement:
      "I build the quiet infrastructure that {{healthcare research}} runs on.",
    // The famous adage — the soul of the landing page.
    quote: "Any sufficiently advanced technology is indistinguishable from magic.",
    quoteAuthor: "Arthur C. Clarke",
    deck:
      "Kubernetes platforms for NHS Trusted Research Environments by day; " +
      "landscapes, architecture, and the behaviour of light through a Nikon when " +
      "I step away from the cluster. Same instinct either way — I care about how " +
      "things are built."
  },

  /* --------------------------------------------------------------------------
     WORK — the projects. The FIRST entry renders large as the "primary system";
     the rest follow as indexed modules. `manifest` is the small mono spec sheet.
     -------------------------------------------------------------------------- */
  work: [
    {
      id: "k8tre",
      name: "karectl / k8tre",
      tagline: "Production Kubernetes for NHS Trusted Research Environments",
      year: "2024 — present",
      featured: true,
      status: "operational",
      start: "2024-01", // TODO(owner): confirm start month
      end: null, // ongoing
      description:
        "The centre of what I do. A multi-trust, GitOps-driven platform that gives " +
        "NHS research teams a secure place to work with sensitive data — without that " +
        "data ever leaving safe hands. Single sign-on through Keycloak, distributed " +
        "storage across Longhorn and SeaweedFS, network policy enforced with Cilium, " +
        "and an Argo-driven delivery pipeline, all built toward SATRE compliance. " +
        "Real infrastructure, in service, held to a standard that matters.",
      stack: ["Kubernetes", "ArgoCD", "Terraform", "Helm", "Cilium",
              "Longhorn", "SeaweedFS", "Keycloak", "Azure AKS"],
      manifest: {
        Status: "In production",
        Scope: "Multi-trust",
        Delivery: "GitOps",
        Compliance: "SATRE"
      },
      links: [
        { label: "Repository", href: "https://github.com/k8tre" }
      ]
    },
    {
      id: "fastomop",
      name: "FastOMOP",
      tagline: "Natural-language querying over OMOP clinical databases",
      year: "2025",
      status: "active",
      start: "2025-01", // TODO(owner): confirm start month
      end: null, // ongoing
      description:
        "Ask a clinical question in plain English; get a grounded query over a " +
        "standardised OMOP data model in return. Built to shorten the distance " +
        "between a researcher's question and the data that answers it.",
      stack: ["Python", "LLMs", "OMOP CDM", "PostgreSQL"],
      manifest: {
        Status: "Active",
        Domain: "Clinical data",
        Interface: "Natural language"
      },
      links: [
        { label: "Repository", href: "https://github.com/sauravscode" }
      ]
    },
    {
      id: "fastrtt",
      name: "FastRTT",
      tagline: "Multi-agent validation for NHS referral-to-treatment pathways",
      year: "2025",
      status: "active",
      start: "2025-01", // TODO(owner): confirm start month
      end: null, // ongoing
      description:
        "A multi-agent system that walks the long, rule-heavy journey from referral " +
        "to treatment and checks it for the errors that quietly delay patients. The " +
        "rules are unforgiving; the cost of getting them wrong is measured in waiting.",
      stack: ["Python", "Multi-agent AI", "NHS RTT rules"],
      manifest: {
        Status: "Active",
        Domain: "NHS pathways",
        Pattern: "Multi-agent"
      },
      links: [
        { label: "Repository", href: "https://github.com/sauravscode" }
      ]
    },
    {
      id: "kubecon-scraper",
      name: "KubeCon Schedule Scraper",
      tagline: "Playwright tooling for KubeCon 2026 sessions and slide decks",
      year: "2026",
      status: "complete",
      start: "2026-03", // TODO(owner): confirm start month
      end: "2026-04", // TODO(owner): confirm end month
      description:
        "A scraper that pulled the full session schedule and slide decks from " +
        "KubeCon 2026 — because the conference site made the thing I wanted hard to " +
        "get, and that's usually a sign worth building a small, sharp tool for.",
      stack: ["Python", "Playwright"],
      manifest: {
        Status: "Complete",
        Type: "Automation",
        Target: "KubeCon 2026"
      },
      links: [
        { label: "Repository", href: "https://github.com/sauravscode" }
      ]
    }
  ],

  /* --------------------------------------------------------------------------
     CHANGELOG — reverse-chronological history feed.
     kind: "role" | "ship" | "event" | "move".
     Seeded only with facts already stated elsewhere in this file. Dates the
     source text does not pin down carry a TODO(owner) note.
     -------------------------------------------------------------------------- */
  changelog: [
    { date: "2026-03", kind: "event", text: "Attended KubeCon 2026." }, // TODO(owner): confirm date
    { date: "2026-01", kind: "move", text: "Relocated from Cardiff to Leeds." }, // TODO(owner): confirm date (source says "early 2026")
    { date: "2025-01", kind: "event", text: "Attended the HDR UK Conference." }, // TODO(owner): confirm date
    { date: "2024-01", kind: "role", text: "Joined Lancashire Teaching Hospitals NHS FT as a Junior Software / Infrastructure Engineer." } // TODO(owner): confirm date
  ],

  /* --------------------------------------------------------------------------
     ABOUT — keep it short and human. Each string in `paragraphs` is one block.
     `notes` are the small mono telemetry entries (your "field log").
     -------------------------------------------------------------------------- */
  about: {
    paragraphs: [
      "I'm a software and infrastructure engineer at Lancashire Teaching Hospitals, " +
      "where I help build and run a Kubernetes-based Trusted Research Environment — " +
      "the secure ground that lets researchers work with sensitive NHS data.",

      "I'm early in my career and, by most measures, in slightly over my head — which " +
      "is exactly where I like to be. The work is real: production clusters, multiple " +
      "trusts, GitOps all the way down. I've learned Kubernetes the way you learn a " +
      "language by moving to the country — certifications along the way, but mostly by " +
      "being responsible for things that simply have to stay up.",

      "Away from the cluster I read constantly and photograph compulsively — " +
      "landscapes, architecture, the structure of light. I moved from Cardiff to " +
      "Leeds at the start of 2026. I've come to think infrastructure and photography " +
      "are the same discipline wearing different clothes: both are about noticing " +
      "what holds a thing together, and then getting out of the way."
    ],
    notes: [
      { k: "Now", v: "Junior Software / Infrastructure Engineer, Lancashire Teaching Hospitals NHS FT" },
      { k: "Field", v: "Healthcare data infrastructure · research computing · cloud-native" },
      { k: "Learning", v: "Kubernetes certification journey, ongoing" },
      { k: "Seen", v: "KubeCon 2026" },
      { k: "Seen", v: "HDR UK Conference" },
      { k: "Based", v: "Leeds, relocated from Cardiff, early 2026" }
    ]
  },

  /* --------------------------------------------------------------------------
     PHOTOGRAPHY — the gallery is driven by Cloudinary.

     1. Set `cloudName` to your Cloudinary cloud name (Dashboard → top left).
     2. Upload your photos. For each one, copy its "Public ID"
        (e.g. "portfolio/derwent-water" — folder included).
     3. Add an entry below. The app builds optimised, responsive URLs for you
        (f_auto, q_auto, blur-up placeholder) — you never write a transform.

     `ratio` is width/height — it reserves space so the page never jumps while
     images load. 3:2 landscape = 1.5, 2:3 portrait = 0.667, square = 1.

     `exif` (optional) is a short technical line shown under the plate,
     e.g. "24mm · f/8 · 1/60 · ISO 100". Omit it and only the caption shows.

     No Cloudinary yet? Drop a full image URL in `publicId` and it is used as-is.
     -------------------------------------------------------------------------- */
  photography: {
    cloudName: "your-cloud-name",
    instagram: "https://www.instagram.com/",
    gear: "Nikon Z50 II",
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
  },

  /* --------------------------------------------------------------------------
     READING — two shelves. `note` is optional and shown small, in your voice.
     `year` (optional, number) on finished books: when EVERY finished entry
     has one, the shelf groups by year, newest first; otherwise one flat list.
     -------------------------------------------------------------------------- */
  reading: {
    current: [
      { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann",
        tag: "Technical", note: "The one everyone in infra circles back to." },
      { title: "The Overstory", author: "Richard Powers",
        tag: "Fiction", note: "Slow on purpose, in the best way." }
    ],
    finished: [
      { title: "Site Reliability Engineering", author: "Google", tag: "Technical" },
      { title: "Kubernetes in Action", author: "Marko Lukša", tag: "Technical" },
      { title: "A Philosophy of Software Design", author: "John Ousterhout", tag: "Technical" },
      { title: "Seeing Like a State", author: "James C. Scott", tag: "Non-fiction" },
      { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", tag: "Non-fiction" },
      { title: "The Order of Time", author: "Carlo Rovelli", tag: "Non-fiction" },
      { title: "On Photography", author: "Susan Sontag", tag: "Essays" },
      { title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin", tag: "Fiction" }
    ]
  }
};

// Expose globally so the (module) app can read it. Edit above — not this line.
window.DATA = DATA;
