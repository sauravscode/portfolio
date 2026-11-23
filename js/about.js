import { D, el, extLink, makeImg, socialIcon } from "./core.js";

function renderAboutMain() {
  const section = document.getElementById("about-main");
  if (!section || !D || !D.about) return;

  const grid = el("div", "wrap about-grid");

  const photo = el("div", "about-photo");
  const img = makeImg(D.about.image, {
    crop: { aspect: "4:5" },
    widths: [600, 900, 1200, 1600],
    sizes: "(min-width: 900px) 45vw, 100vw",
    className: "about-img",
    eager: true
  });
  if (img) photo.append(img);
  else photo.classList.add("is-imgless");

  const text = el("div", "about-text");
  text.append(el("h1", "display about-title", "About"));

  const paragraphs = Array.isArray(D.about.paragraphs) ? D.about.paragraphs : [];
  for (const paragraph of paragraphs) {
    if (typeof paragraph === "string" && paragraph.trim()) {
      text.append(el("p", "about-para", paragraph.trim()));
    }
  }

  const now = typeof D.about.now === "string" ? D.about.now.trim() : "";
  const nowLine = el("p", "about-now");
  nowLine.append(el("span", "mono about-now-label", "Now"));
  if (now) nowLine.append(document.createTextNode(" " + now));
  text.append(nowLine);

  grid.append(photo, text);
  section.append(grid);
}

function renderWork() {
  const section = document.getElementById("work");
  if (!section || !D || !D.work) return;

  const wrap = el("div", "wrap measure-wide");

  const heading = el("h2", "visually-hidden", "Work");
  heading.id = "work-title";
  wrap.append(heading);

  const label = el("p", "mono section-label", "Work");
  label.setAttribute("aria-hidden", "true");
  wrap.append(label);

  const quote = typeof D.work.quote === "string" ? D.work.quote.trim() : "";
  const author = typeof D.work.quoteAuthor === "string"
    ? D.work.quoteAuthor.trim()
    : "";

  if (quote) {
    const figure = el("figure", "quote reveal");
    figure.append(el("blockquote", "quote-text", `\u201C${quote}\u201D`));
    const cite = el("figcaption", "quote-cite mono");
    cite.textContent = author ? `\u2014 ${author}` : "";
    figure.append(cite);
    wrap.append(figure);
  }

  const workText = typeof D.work.text === "string" ? D.work.text.trim() : "";
  if (workText) wrap.append(el("p", "work-text", workText));

  section.append(wrap);
}

function renderContact() {
  const section = document.getElementById("contact");
  if (!section || !D) return;

  const wrap = el("div", "wrap");

  const title = el("h2", "display contact-title", "Contact");
  title.id = "contact-title";
  wrap.append(title);

  wrap.append(el("p", "contact-lede", "The best way to reach me is on LinkedIn or Instagram."));

  const site = D.site || {};
  const socials =
    site.socials && typeof site.socials === "object" ? site.socials : {};
  const labels = [
    ["linkedin", "LinkedIn"],
    ["instagram", "Instagram"],
    ["github", "GitHub"]
  ];
  const row = el("div", "contact-socials");
  for (const [key, label] of labels) {
    const link = extLink("contact-social", "", socials[key]);
    if (!link) continue;
    const icon = socialIcon(key);
    if (icon) link.append(icon);
    link.append(el("span", "mono", label));
    row.append(link);
  }
  if (row.childElementCount) wrap.append(row);

  section.append(wrap);
}

export function render() {
  if (!D || typeof document === "undefined") return;
  renderAboutMain();
  renderWork();
  renderContact();
}
