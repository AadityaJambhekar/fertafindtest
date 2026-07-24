import assert from "node:assert/strict";
import { SUPPORTED_LOCALES, localePath } from "./i18n.ts";
import test from "node:test";
import { PAGES, canonicalUrl } from "./seo.ts";
import {
  CONTENT_PAGES,
  RESOURCES,
  allIndexablePaths,
  buildSitemapXml,
  contentLd,
  contentPageMeta,
  contentRouteHead,
  formatDate,
  getContentPage,
  isEnglishOnlyPath,
  resourcesRouteHead,
} from "./content.ts";

const BANNED_CLAIMS = [
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

test("every content page has a clean, descriptive, unique slug", () => {
  const slugs = CONTENT_PAGES.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, "slugs are unique");
  for (const s of slugs) {
    assert.match(
      s,
      /^\/(guides|compare|methodology)\/[a-z0-9]+(-[a-z0-9]+)*$/,
      `${s} is a descriptive, lowercase, hyphenated path`,
    );
  }
});

test("titles and descriptions are non-empty and unique across all indexable pages", () => {
  const core = [PAGES.home, PAGES.analyze, PAGES.terms];
  const titles = [
    ...CONTENT_PAGES.map((p) => p.title),
    RESOURCES.title,
    ...core.map((p) => p.title),
  ];
  const descriptions = [
    ...CONTENT_PAGES.map((p) => p.description),
    RESOURCES.description,
    ...core.map((p) => p.description),
  ];
  for (const t of titles) assert.ok(t.trim().length > 0, "title present");
  for (const d of descriptions) {
    assert.ok(d.trim().length >= 50, "description is substantive");
    assert.ok(d.trim().length <= 230, "description is not runaway");
  }
  assert.equal(new Set(titles).size, titles.length, "titles unique");
  assert.equal(new Set(descriptions).size, descriptions.length, "descriptions unique");
});

test("each page has exactly one H1 field and it is non-empty", () => {
  for (const p of CONTENT_PAGES) {
    assert.ok(p.h1.trim().length > 0, `${p.slug} has an H1`);
  }
});

test("contentPageMeta emits one www canonical (no trailing slash) equal to og:url", () => {
  for (const p of CONTENT_PAGES) {
    const { meta, links } = contentPageMeta(p);
    const canonicals = links.filter((l) => l.rel === "canonical");
    assert.equal(canonicals.length, 1, `${p.slug} has one canonical`);
    const href = canonicals[0].href;
    assert.equal(href, canonicalUrl(p.slug));
    assert.ok(href.startsWith("https://www.fertafind.com/"), "www host");
    assert.ok(!href.endsWith("/"), "no trailing slash");
    const ogUrl = meta.find((m) => "property" in m && m.property === "og:url") as
      { content?: string } | undefined;
    assert.equal(ogUrl?.content, href, "og:url equals canonical");
    assert.ok(
      meta.some((m) => "title" in m),
      `${p.slug} has a title`,
    );
    assert.ok(
      meta.some((m) => "name" in m && m.name === "description"),
      `${p.slug} has a meta description`,
    );
    assert.ok(
      meta.some((m) => "property" in m && m.property === "og:title"),
      `${p.slug} has og:title`,
    );
  }
});

test("every content page cites at least one verifiable https source", () => {
  for (const p of CONTENT_PAGES) {
    assert.ok(p.sources.length >= 1, `${p.slug} cites a source`);
    for (const s of p.sources) {
      assert.ok(s.url.startsWith("https://"), `${s.url} is https`);
      assert.ok(s.label.trim().length > 0, "source has a label");
      assert.ok(s.publisher.trim().length > 0, "source has a publisher");
      assert.match(s.accessed, /^\d{4}-\d{2}-\d{2}$/, "accessed is an ISO date");
    }
  }
});

test("each page cites an official USDA or university-extension source", () => {
  for (const p of CONTENT_PAGES) {
    const authoritative = p.sources.some((s) =>
      /(^https:\/\/[^/]*\.)?usda\.gov|\.edu\b|extension\./.test(s.url),
    );
    assert.ok(authoritative, `${p.slug} cites an official/extension source`);
  }
});

test("structured data is Article/WebPage with no fabricated rating, review, or person author", () => {
  for (const p of CONTENT_PAGES) {
    const ld = contentLd(p) as Record<string, unknown>;
    assert.ok(
      ld["@type"] === "Article" || ld["@type"] === "WebPage",
      `${p.slug} uses Article or WebPage`,
    );
    assert.equal(ld.url, canonicalUrl(p.slug));
    assert.ok(ld.headline && ld.description, `${p.slug} has headline + description`);
    for (const forbidden of ["aggregateRating", "review", "reviewRating", "ratingValue"]) {
      assert.ok(!(forbidden in ld), `${p.slug} must not invent ${forbidden}`);
    }
    if ("author" in ld) {
      const author = ld.author as Record<string, unknown>;
      assert.equal(
        author["@type"],
        "Organization",
        `${p.slug} author is the organisation, not a fabricated person`,
      );
    }
  }
});

test("breadcrumbs start at Home and end at the page's own slug", () => {
  for (const p of CONTENT_PAGES) {
    const b = p.breadcrumb;
    assert.ok(b.length >= 2, `${p.slug} has a trail`);
    assert.equal(b[0].name, "Home");
    assert.equal(b[0].path, "/");
    assert.equal(b[b.length - 1].path, p.slug, "trail ends at the page");
  }
});

test("content metadata contains no unsupported marketing claims", () => {
  for (const p of CONTENT_PAGES) {
    const blob = [p.title, p.h1, p.description, p.ogTitle, p.ogDescription].join(" ");
    for (const re of BANNED_CLAIMS) {
      assert.ok(!re.test(blob), `${p.slug} contains banned claim ${re}`);
    }
  }
});

test("sitemap includes every indexable path, excludes /results, has no duplicates", () => {
  const paths = allIndexablePaths();
  for (const required of ["/", "/analyze", "/terms", "/resources"]) {
    assert.ok(paths.includes(required), `${required} is indexable`);
  }
  for (const p of CONTENT_PAGES) {
    assert.ok(paths.includes(p.slug), `${p.slug} is in the sitemap set`);
  }
  assert.equal(new Set(paths).size, paths.length, "no duplicate paths");
  assert.ok(!paths.some((p) => p.startsWith("/results")), "results pages are excluded");
  // Translated pages are published once per locale; English-only editorial only in English.
  const xml = buildSitemapXml();
  for (const p of paths) {
    const locales = isEnglishOnlyPath(p) ? (["en"] as const) : SUPPORTED_LOCALES;
    for (const locale of locales) {
      assert.ok(
        xml.includes(`<loc>${canonicalUrl(localePath(locale, p))}</loc>`),
        `${localePath(locale, p)} appears in the generated sitemap`,
      );
    }
    if (isEnglishOnlyPath(p)) {
      assert.ok(
        !xml.includes(`<loc>${canonicalUrl(localePath("pt-BR", p))}</loc>`),
        `${p} must not be advertised as Portuguese`,
      );
    }
  }
});

test("resources hub head has a canonical and CollectionPage + BreadcrumbList data", () => {
  const head = resourcesRouteHead();
  const canonical = head.links.find((l) => l.rel === "canonical");
  // Canonical is locale-specific now; the default locale is English.
  assert.equal(canonical?.href, canonicalUrl(localePath("en", "/resources")));
  const alternates = head.links.filter((l) => l.rel === "alternate");
  assert.ok(
    alternates.some((l) => l.hrefLang === "x-default"),
    "resources advertises x-default",
  );
  const types = head.scripts.map(
    (s) => (JSON.parse(s.children) as Record<string, unknown>)["@type"],
  );
  assert.ok(types.includes("CollectionPage"), "has CollectionPage");
  assert.ok(types.includes("BreadcrumbList"), "has BreadcrumbList");
});

test("contentRouteHead wires the page's structured data plus BreadcrumbList", () => {
  for (const p of CONTENT_PAGES) {
    const head = contentRouteHead(p);
    const types = head.scripts.map(
      (s) => (JSON.parse(s.children) as Record<string, unknown>)["@type"],
    );
    assert.ok(types.includes(p.structuredData), `${p.slug} has ${p.structuredData}`);
    assert.ok(types.includes("BreadcrumbList"), `${p.slug} has BreadcrumbList`);
  }
});

test("getContentPage resolves known slugs and rejects unknown ones", () => {
  assert.ok(getContentPage("/compare/dap-vs-map"));
  assert.equal(getContentPage("/guides/does-not-exist"), undefined);
});

test("formatDate renders ISO dates in plain English", () => {
  assert.equal(formatDate("2026-07-22"), "July 22, 2026");
});
