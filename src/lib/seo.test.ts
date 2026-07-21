import assert from "node:assert/strict";
import test from "node:test";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  canonicalUrl,
  PAGES,
  pageMeta,
  jsonLdScript,
  organizationLd,
  websiteLd,
  breadcrumbLd,
  faqLd,
  type PageKey,
} from "./seo.ts";

const PAGE_KEYS: PageKey[] = ["home", "about", "analyze", "suppliers", "terms"];

test("SITE_URL is the approved www host with https and no trailing slash", () => {
  assert.equal(SITE_URL, "https://www.fertafind.com");
});

test("canonicalUrl keeps a trailing slash only for the homepage", () => {
  assert.equal(canonicalUrl("/"), "https://www.fertafind.com/");
  assert.equal(canonicalUrl(""), "https://www.fertafind.com/");
});

test("canonicalUrl produces www, no-trailing-slash URLs for inner pages", () => {
  assert.equal(canonicalUrl("/about"), "https://www.fertafind.com/about");
  assert.equal(canonicalUrl("/about/"), "https://www.fertafind.com/about");
  assert.equal(canonicalUrl("analyze"), "https://www.fertafind.com/analyze");
});

test("every public page has a unique, non-empty title", () => {
  const titles = PAGE_KEYS.map((k) => PAGES[k].title);
  for (const t of titles) assert.ok(t && t.trim().length > 0, "title present");
  assert.equal(new Set(titles).size, titles.length, "titles are unique");
});

test("every public page has a unique, non-empty description", () => {
  const descriptions = PAGE_KEYS.map((k) => PAGES[k].description);
  for (const d of descriptions)
    assert.ok(d && d.trim().length > 0, "description present");
  assert.equal(
    new Set(descriptions).size,
    descriptions.length,
    "descriptions are unique",
  );
});

test("pageMeta emits exactly one canonical link on the approved host", () => {
  for (const key of PAGE_KEYS) {
    const { links } = pageMeta(key);
    const canonicals = links.filter((l) => l.rel === "canonical");
    assert.equal(canonicals.length, 1, `${key} has one canonical`);
    assert.ok(
      canonicals[0].href.startsWith("https://www.fertafind.com"),
      `${key} canonical uses www host`,
    );
  }
});

test("inner-page canonicals never carry a trailing slash", () => {
  for (const key of PAGE_KEYS) {
    if (key === "home") continue;
    const { links } = pageMeta(key);
    const href = links.find((l) => l.rel === "canonical")!.href;
    assert.ok(!href.endsWith("/"), `${key} canonical has no trailing slash`);
  }
});

test("pageMeta gives each page its own Open Graph title, description and url", () => {
  for (const key of PAGE_KEYS) {
    const { meta } = pageMeta(key);
    const byProp = (p: string) =>
      meta.find((m) => "property" in m && m.property === p) as
        { content?: string } | undefined;
    const byName = (n: string) =>
      meta.find((m) => "name" in m && m.name === n) as
        { content?: string } | undefined;
    assert.ok(byProp("og:title")?.content, `${key} has og:title`);
    assert.ok(byProp("og:description")?.content, `${key} has og:description`);
    assert.equal(
      byProp("og:url")?.content,
      canonicalUrl(PAGES[key].path),
      `${key} og:url is canonical`,
    );
    assert.ok(byName("twitter:title")?.content, `${key} has twitter:title`);
    assert.ok(
      byName("twitter:description")?.content,
      `${key} has twitter:description`,
    );
    assert.ok(byName("description")?.content, `${key} has description meta`);
  }
});

test("no page inherits the homepage Open Graph copy", () => {
  const ogTitle = (key: PageKey) =>
    (
      pageMeta(key).meta.find(
        (m) => "property" in m && m.property === "og:title",
      ) as {
        content?: string;
      }
    ).content;
  const home = ogTitle("home");
  for (const key of PAGE_KEYS) {
    if (key === "home") continue;
    assert.notEqual(
      ogTitle(key),
      home,
      `${key} og:title differs from homepage`,
    );
  }
});

test("metadata contains no unsupported marketing claims", () => {
  const banned = [
    /highest[\s-]?roi/i,
    /\broi\b/i,
    /save (you )?money/i,
    /lift your yield/i,
    /more yield per dollar/i,
    /stop overpaying/i,
    /best[\s-]?value/i,
    /guaranteed savings/i,
    /guaranteed (yield|return)/i,
    /\d+\s*%\s*(average\s*)?savings/i,
  ];
  const blobs: string[] = [];
  for (const key of PAGE_KEYS) {
    const p = PAGES[key];
    blobs.push(p.title, p.description, p.ogTitle, p.ogDescription);
  }
  blobs.push(organizationLd().description, websiteLd().description);
  for (const blob of blobs) {
    for (const re of banned) {
      assert.ok(!re.test(blob), `banned claim ${re} found in: "${blob}"`);
    }
  }
});

test("Organization JSON-LD is valid and uses the www host without invented fields", () => {
  const org = organizationLd() as Record<string, unknown>;
  assert.equal(org["@context"], "https://schema.org");
  assert.equal(org["@type"], "Organization");
  assert.equal(org.name, SITE_NAME);
  assert.equal(org.url, `${SITE_URL}/`);
  assert.equal(org.logo, DEFAULT_OG_IMAGE);
  for (const forbidden of [
    "aggregateRating",
    "review",
    "address",
    "telephone",
    "founder",
    "sameAs",
  ]) {
    assert.ok(!(forbidden in org), `Organization must not invent ${forbidden}`);
  }
});

test("WebSite JSON-LD is valid and references the homepage", () => {
  const site = websiteLd() as Record<string, unknown>;
  assert.equal(site["@context"], "https://schema.org");
  assert.equal(site["@type"], "WebSite");
  assert.equal(site.name, SITE_NAME);
  assert.equal(site.url, `${SITE_URL}/`);
});

test("BreadcrumbList JSON-LD is well-formed with canonical item URLs", () => {
  const crumb = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ]) as Record<string, unknown>;
  assert.equal(crumb["@type"], "BreadcrumbList");
  const items = crumb.itemListElement as Array<Record<string, unknown>>;
  assert.equal(items.length, 2);
  assert.equal(items[0].position, 1);
  assert.equal(items[1].position, 2);
  assert.equal(items[0].item, "https://www.fertafind.com/");
  assert.equal(items[1].item, "https://www.fertafind.com/about");
});

test("FAQPage JSON-LD mirrors the supplied visible questions and answers", () => {
  const faqs = [
    { question: "Q1?", answer: "A1." },
    { question: "Q2?", answer: "A2." },
  ];
  const faq = faqLd(faqs) as Record<string, unknown>;
  assert.equal(faq["@type"], "FAQPage");
  const entities = faq.mainEntity as Array<Record<string, unknown>>;
  assert.equal(entities.length, 2);
  assert.equal(entities[0]["@type"], "Question");
  assert.equal(entities[0].name, "Q1?");
  const accepted = entities[0].acceptedAnswer as Record<string, unknown>;
  assert.equal(accepted["@type"], "Answer");
  assert.equal(accepted.text, "A1.");
});

test("jsonLdScript produces a valid application/ld+json descriptor", () => {
  const script = jsonLdScript({ "@type": "Thing" });
  assert.equal(script.type, "application/ld+json");
  assert.deepEqual(JSON.parse(script.children), { "@type": "Thing" });
});
