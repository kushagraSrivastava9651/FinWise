import { useEffect } from "react";

function upsertMeta(attrName, attrValue, content) {
  const selector = `meta[${attrName}="${attrValue}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  if (content) {
    tag.setAttribute("content", content);
  }
  return tag;
}

function setCanonical(url) {
  let link = document.head.querySelector("link[rel=canonical]");
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

export default function Seo({
  title,
  description,
  url,
  image,
  keywords,
  type = "website",
}) {
  useEffect(() => {
    if (!title || !description) return;

    document.title = title;
    const pageUrl = url || `${window.location.origin}${window.location.pathname}`;
    setCanonical(pageUrl);

    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", keywords || "EMI calculator, SIP calculator, FD calculator, tax calculator, loan comparison, amortisation schedule, personal finance India");
    upsertMeta("name", "robots", "index,follow");

    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", pageUrl);
    if (image) upsertMeta("property", "og:image", image);

    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    if (image) upsertMeta("name", "twitter:image", image);
  }, [title, description, url, image, keywords, type]);

  return null;
}
