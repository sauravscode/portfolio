const DATA = {

  site: {
    name: "Saurav Sudhar",
    tagline: "Engineer · Photographer",
    socials: {
      github: "https://github.com/sauravscode",
      linkedin: "https://www.linkedin.com/in/sauravsnair/",
      instagram: "https://www.instagram.com/picsxarchive/"
    }
  },

  cloudinary: {
    cloudName: "loqdzgcd"
  },

  hero: {
    image: {
      publicId: "DSC_0429",
      alt: "A car on a winding road through a highland glen beneath mountains at sunset",
      focus: "70% 50%",
      ratio: 1.895
    }
  },

  panels: [
    {
      title: "Work",
      caption: "Software and infrastructure engineer",
      href: "about/#work",
      image: { publicId: "DSC_0076", alt: "A winter fair at night: a lit ferris wheel beside a glowing funfair ride", gravity: "center" }
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

  about: {
    image: { publicId: "DSC_0164", alt: "A turreted sandstone building on a city corner under a blue sky" },
    paragraphs: [
      "I'm a software and infrastructure engineer at Lancashire Teaching Hospitals, " +
      "where I help build and run a Kubernetes-based Trusted Research Environment — " +
      "the secure ground that lets researchers work with sensitive NHS data.",

      "I'm early in my career and in slightly over my head, which is where I like to " +
      "be: production clusters, multiple trusts, GitOps all the way down. Away from " +
      "the cluster I read constantly and photograph compulsively."
    ],
    now: "Software & Infrastructure Engineer, Lancashire Teaching Hospitals NHS FT"
  },

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

window.DATA = DATA;
