// Multilingual SEO: localized metadata, reciprocal hreflang, canonical, and a sitemap
// that lists every indexable page once per locale.

import test from "node:test";
import assert from "node:assert/strict";

import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  localePath,
  localeToSegment,
  type Locale,
} from "./i18n.ts";
import { localizedPageMeta, localizedHead } from "./seo-i18n.ts";
import {
  sitemapEntries,
  buildSitemapXml,
  allIndexablePaths,
  isEnglishOnlyPath,
  localizedPaths,
} from "./content.ts";
import { SITE_URL } from "./seo.ts";

// --- sitemap covers every locale ---

test("every translated page is listed once per supported locale", () => {
  const entries = sitemapEntries();
  for (const path of localizedPaths()) {
    for (const locale of SUPPORTED_LOCALES) {
      const wanted = localePath(locale, path);
      assert.ok(
        entries.some((e) => e.path === wanted),
        `sitemap is missing ${wanted}`,
      );
    }
  }
});

test("English-only long-form pages get no Portuguese sitemap entry", () => {
  const entries = sitemapEntries().map((e) => e.path);
  const englishOnly = allIndexablePaths().filter(isEnglishOnlyPath);
  assert.ok(englishOnly.length > 0, "expected some English-only editorial pages");
  for (const path of englishOnly) {
    assert.ok(entries.includes(localePath("en", path)), `${path} must be listed in English`);
    assert.ok(
      !entries.includes(localePath("pt-BR", path)),
      `${path} must NOT be advertised as Portuguese`,
    );
  }
});

test("every sitemap URL is locale-prefixed and absolute", () => {
  const xml = buildSitemapXml();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 0);
  for (const loc of locs) {
    assert.ok(loc.startsWith(`${SITE_URL}/`), `${loc} is not absolute`);
    const path = loc.slice(SITE_URL.length);
    // Derived from the locale list so adding a locale cannot silently bypass this check.
    const segments = SUPPORTED_LOCALES.map(localeToSegment).join("|");
    assert.match(path, new RegExp(`^/(${segments})(/|$)`), `${loc} has no locale segment`);
  }
});

test("no private results page is in the sitemap", () => {
  assert.ok(!/\/results/.test(buildSitemapXml()));
});

// --- localized metadata ---

test("page metadata differs per locale", () => {
  const en = localizedPageMeta("en", "suppliers");
  const pt = localizedPageMeta("pt-BR", "suppliers");
  assert.notEqual(en.title, pt.title);
  assert.notEqual(en.description, pt.description);
  assert.ok(en.title.trim().length > 0);
  assert.ok(pt.title.trim().length > 0);
});

test("every locale supplies a title and description for every core page", () => {
  for (const locale of SUPPORTED_LOCALES) {
    for (const key of ["home", "analyze", "suppliers", "resources", "terms"] as const) {
      const meta = localizedPageMeta(locale, key);
      assert.ok(meta.title.trim().length > 0, `${locale}/${key} title`);
      assert.ok(meta.description.trim().length > 0, `${locale}/${key} description`);
    }
  }
});

// --- head: canonical + hreflang + og ---

const prop = (meta: ReturnType<typeof localizedHead>["meta"], name: string) =>
  meta.flatMap((m) => ("property" in m && m.property === name ? [m.content] : []))[0];

function tagsOf(head: ReturnType<typeof localizedHead>) {
  const links = head.links ?? [];
  const meta = head.meta ?? [];
  return {
    canonical: links.find((l) => l.rel === "canonical")?.href,
    alternates: links.filter((l) => l.rel === "alternate"),
    ogLocale: prop(meta, "og:locale"),
    ogUrl: prop(meta, "og:url"),
    ogTitle: prop(meta, "og:title"),
    title: meta.flatMap((m) => ("title" in m ? [m.title] : []))[0],
  };
}

test("canonical points at the page's own locale URL", () => {
  for (const locale of SUPPORTED_LOCALES) {
    const { canonical } = tagsOf(localizedHead(locale, "suppliers", "/suppliers"));
    assert.equal(canonical, `${SITE_URL}${localePath(locale, "/suppliers")}`);
  }
});

test("hreflang alternates are reciprocal and include x-default", () => {
  for (const locale of SUPPORTED_LOCALES) {
    const { alternates } = tagsOf(localizedHead(locale, "analyze", "/analyze"));
    const byLang = Object.fromEntries(alternates.map((l) => [l.hrefLang, l.href]));
    assert.equal(byLang.en, `${SITE_URL}/en/analyze`);
    assert.equal(byLang["pt-BR"], `${SITE_URL}/pt-br/analyze`);
    assert.equal(byLang["x-default"], `${SITE_URL}${localePath(DEFAULT_LOCALE, "/analyze")}`);
    assert.equal(alternates.length, SUPPORTED_LOCALES.length + 1);
  }
});

test("both locales advertise the same alternate set — genuinely reciprocal", () => {
  const sets = SUPPORTED_LOCALES.map((locale) =>
    tagsOf(localizedHead(locale, "home", "/"))
      .alternates.map((l) => `${l.hrefLang}=${l.href}`)
      .sort()
      .join("|"),
  );
  assert.equal(new Set(sets).size, 1, "locales disagree about the alternate set");
});

test("Open Graph carries a localized title and the locale itself", () => {
  const en = tagsOf(localizedHead("en", "home", "/"));
  const pt = tagsOf(localizedHead("pt-BR", "home", "/"));
  assert.equal(en.ogLocale, "en");
  assert.equal(pt.ogLocale, "pt-BR");
  assert.notEqual(en.ogTitle, pt.ogTitle);
  assert.equal(pt.ogUrl, `${SITE_URL}/pt-br`);
});

test("an unknown locale degrades to English metadata rather than throwing", () => {
  const meta = localizedPageMeta("es" as Locale, "home");
  assert.deepEqual(meta, localizedPageMeta("en", "home"));
});
