// Latin American Spanish (es-419) coverage.
//
// The internal tag and the public URL segment differ on purpose: "es-419" is correct for
// <html lang> and hreflang, while the public prefix stays "/es/". Several tests below exist
// specifically to stop those two from drifting apart.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  localePath,
  localeToSegment,
  segmentToLocale,
  stripLocale,
  parseLocale,
  resolveLocale,
  validateRequestLocale,
  hreflangLinks,
  aiLanguageInstruction,
  localeHtmlLang,
  type Locale,
} from "./i18n.ts";
import { getDictionary } from "./dictionaries.ts";
import { localizedPageMeta, localizedHead } from "./seo-i18n.ts";
import { sitemapEntries, isEnglishOnlyPath, localizedPaths } from "./content.ts";
import { SITE_URL } from "./seo.ts";
import { listSupplierCompanies, listPublicSuppliers, listMentionedEntities } from "./suppliers.ts";

const ES: Locale = "es-419";

// --- locale identity ---

test("Spanish is a supported locale served at /es/", () => {
  assert.ok(SUPPORTED_LOCALES.includes(ES));
  assert.equal(localeToSegment(ES), "es");
  assert.equal(segmentToLocale("es"), ES);
  assert.equal(localeHtmlLang(ES), "es-419");
});

test("Spanish routes exist for every localized page", () => {
  for (const path of localizedPaths()) {
    const url = localePath(ES, path);
    assert.match(url, /^\/es(\/|$)/, `${path} must have a /es URL`);
    assert.deepEqual(stripLocale(url), { locale: ES, path }, `${url} round-trips`);
  }
});

test("the required Spanish routes all resolve", () => {
  const required = [
    "/",
    "/analyze",
    "/suppliers",
    "/suppliers/fertiexpress-group",
    "/suppliers/nanofert",
    "/resources",
    "/terms",
  ];
  for (const path of required) {
    assert.equal(stripLocale(localePath(ES, path)).path, path, `/es${path} maps back cleanly`);
  }
  // /faq redirects into the homepage section rather than 404ing.
  assert.equal(localePath(ES, "/faq"), "/es/faq");
});

// --- browser detection and explicit choice ---

test("a Spanish browser is offered Spanish", () => {
  for (const header of ["es-MX,es;q=0.9,en;q=0.8", "es-419", "es-AR", "es"]) {
    assert.equal(resolveLocale({ acceptLanguage: header }), ES, header);
  }
});

test("an explicit or saved choice always beats Spanish browser detection", () => {
  assert.equal(resolveLocale({ explicit: "en", acceptLanguage: "es-MX" }), "en");
  assert.equal(resolveLocale({ saved: "pt-BR", acceptLanguage: "es-MX" }), "pt-BR");
  assert.equal(resolveLocale({ explicit: ES, saved: "en" }), ES);
});

// --- dictionary coverage ---

const CRITICAL_SECTIONS = [
  "nav",
  "common",
  "home",
  "analyze",
  "results",
  "suppliers",
  "validation",
  "errors",
  "empty",
  "terms",
  "footer",
  "badge",
  "breadcrumb",
  "supplierType",
] as const;

test("no critical Spanish section falls back to English", () => {
  const en = getDictionary("en");
  const es = getDictionary(ES);
  const offenders: string[] = [];
  for (const section of CRITICAL_SECTIONS) {
    const enSection = en[section] as Record<string, string>;
    const esSection = es[section] as Record<string, string>;
    for (const key of Object.keys(enSection)) {
      // Identical strings are only acceptable when they are proper nouns / shared tokens.
      if (esSection[key] === enSection[key] && !ALLOWED_IDENTICAL.test(esSection[key])) {
        offenders.push(`${section}.${key} = "${esSection[key]}"`);
      }
    }
  }
  assert.deepEqual(offenders, [], "these Spanish strings are still English");
});

/** Values that may legitimately match English: brand names and shared tokens. */
const ALLOWED_IDENTICAL = /^(FertaFind|Nanofert|FertiExpress Group|NPK|IA|Producto|Total)$/;

test("every Spanish goal option is translated", () => {
  const es = getDictionary(ES);
  const en = getDictionary("en");
  for (const key of [
    "goalYield",
    "goalYieldHelp",
    "goalCost",
    "goalCostHelp",
    "goalBalanced",
    "goalBalancedHelp",
    "goalTitle",
    "goalSubtitle",
  ] as const) {
    assert.ok(es.analyze[key].trim().length > 0, `${key} must exist`);
    assert.notEqual(es.analyze[key], en.analyze[key], `${key} must be translated`);
  }
});

test("every goal option is translated in all three languages", () => {
  for (const locale of SUPPORTED_LOCALES) {
    const d = getDictionary(locale);
    for (const key of ["goalYield", "goalCost", "goalBalanced"] as const) {
      assert.ok(d.analyze[key].trim().length > 0, `${locale}.${key}`);
    }
  }
  // The three goals must be distinct in every language, or the choice is meaningless.
  for (const locale of SUPPORTED_LOCALES) {
    const d = getDictionary(locale);
    const goals = [d.analyze.goalYield, d.analyze.goalCost, d.analyze.goalBalanced];
    assert.equal(new Set(goals).size, 3, `${locale} goals must be distinct`);
  }
});

test("the Spanish homepage, rotating headline and list sections are complete", () => {
  const es = getDictionary(ES);
  const en = getDictionary("en");
  assert.equal(es.homeRotating.length, en.homeRotating.length);
  assert.notDeepEqual(es.homeRotating, en.homeRotating);
  assert.equal(
    `${es.home.headlineLead} ${es.homeRotating[0]}`,
    "Encuentra el fertilizante correcto para tu cultivo.",
  );
  for (const phrase of es.homeRotating) assert.match(`${es.home.headlineLead} ${phrase}`, /[.!?]$/);
  assert.equal(es.homeSteps.length, en.homeSteps.length);
  assert.equal(es.homeBenefits.length, en.homeBenefits.length);
  assert.equal(es.homeFaq.length, en.homeFaq.length);
  for (const [i, s] of es.homeSteps.entries()) assert.notEqual(s.title, en.homeSteps[i].title);
  for (const [i, f] of es.homeFaq.entries()) assert.notEqual(f.question, en.homeFaq[i].question);
});

test("brand, product and unit tokens survive Spanish translation", () => {
  const serialized = JSON.stringify(getDictionary(ES));
  for (const term of ["FertaFind", "Nanofert", "FertiExpress Group", "NPK"]) {
    assert.ok(serialized.includes(term), `${term} must appear verbatim`);
  }
});

test("the Spanish Terms notice is the exact required wording", () => {
  assert.equal(
    getDictionary(ES).terms.courtesyNotice,
    "Esta traducción al español se proporciona únicamente para comodidad. La versión en inglés sigue siendo la versión aplicable.",
  );
});

test("Spanish long-form guides are marked English-only, not faked", () => {
  const notice = getDictionary(ES).notice.untranslatedArticle;
  assert.match(notice, /inglés/i, "the notice must be written in Spanish");
  // And no Spanish sitemap entry is minted for them.
  const entries = sitemapEntries().map((e) => e.path);
  for (const path of localizedPaths()) assert.ok(!isEnglishOnlyPath(path));
  const englishOnly = sitemapEntries()
    .map((e) => stripLocale(e.path).path)
    .filter(isEnglishOnlyPath);
  for (const path of new Set(englishOnly)) {
    assert.ok(!entries.includes(localePath(ES, path)), `${path} must not be advertised in Spanish`);
  }
});

// --- switcher ---

test("the switcher offers EN, PT-BR and ES", () => {
  const src = readFileSync(new URL("../components/language-switcher.tsx", import.meta.url), "utf8");
  assert.match(src, /en:\s*"EN"/);
  assert.match(src, /"pt-BR":\s*"PT-BR"/);
  assert.match(src, /"es-419":\s*"ES"/);
  assert.match(src, /"es-419":\s*"Español \(Latinoamérica\)"/, "accessible name in Spanish");
});

// --- AI locale ---

test("the AI receives a validated locale for all three languages", () => {
  assert.equal(validateRequestLocale("en"), "en");
  assert.equal(validateRequestLocale("pt-BR"), "pt-BR");
  assert.equal(validateRequestLocale("es-419"), ES);
  assert.equal(validateRequestLocale("es"), ES);
  assert.equal(validateRequestLocale("es-MX"), ES);
});

test("an unsupported AI locale falls back to English", () => {
  for (const bad of ["fr", "de", "zh-CN", "", null, undefined, 0, {}, []]) {
    assert.equal(validateRequestLocale(bad), "en", `${JSON.stringify(bad)}`);
  }
});

test("the Spanish AI instruction protects names, numbers, currencies and units", () => {
  const instruction = aiLanguageInstruction(ES);
  assert.match(instruction, /Latin American Spanish/i);
  for (const term of ["company", "product", "numeric", "currenc", "unit"]) {
    assert.match(instruction, new RegExp(term, "i"), `must protect ${term}`);
  }
});

// --- SEO ---

test("Spanish pages carry Spanish metadata distinct from the other locales", () => {
  for (const key of ["home", "analyze", "suppliers", "resources", "terms"] as const) {
    const es = localizedPageMeta(ES, key);
    assert.ok(es.title.trim().length > 0, `${key} title`);
    assert.ok(es.description.trim().length > 0, `${key} description`);
    assert.notEqual(es.title, localizedPageMeta("en", key).title, `${key} vs en`);
    assert.notEqual(es.title, localizedPageMeta("pt-BR", key).title, `${key} vs pt-BR`);
  }
});

test("Spanish canonical points at the /es URL and hreflang covers all three locales", () => {
  const head = localizedHead(ES, "suppliers", "/suppliers");
  const canonical = head.links.find((l) => l.rel === "canonical");
  assert.equal(canonical?.href, `${SITE_URL}/es/suppliers`);

  const alts = Object.fromEntries(
    head.links.filter((l) => l.rel === "alternate").map((l) => [l.hrefLang, l.href]),
  );
  assert.equal(alts.en, `${SITE_URL}/en/suppliers`);
  assert.equal(alts["pt-BR"], `${SITE_URL}/pt-br/suppliers`);
  // hreflang advertises the full tag; the URL keeps the short segment.
  assert.equal(alts["es-419"], `${SITE_URL}/es/suppliers`);
  assert.equal(alts["x-default"], `${SITE_URL}${localePath(DEFAULT_LOCALE, "/suppliers")}`);
});

test("all three locales advertise an identical alternate set", () => {
  const sets = SUPPORTED_LOCALES.map((locale) =>
    localizedHead(locale, "home", "/")
      .links.filter((l) => l.rel === "alternate")
      .map((l) => `${l.hrefLang}=${l.href}`)
      .sort()
      .join("|"),
  );
  assert.equal(new Set(sets).size, 1, "hreflang must be reciprocal across every locale");
});

test("Spanish Open Graph declares es-419 and the other locales as alternates", () => {
  const meta = localizedHead(ES, "home", "/").meta;
  const prop = (name: string) =>
    meta.flatMap((m) => ("property" in m && m.property === name ? [m.content] : []));
  assert.deepEqual(prop("og:locale"), ["es-419"]);
  assert.deepEqual(prop("og:locale:alternate").sort(), ["en", "pt-BR"]);
});

test("the sitemap lists a Spanish URL for every translated page", () => {
  const entries = sitemapEntries().map((e) => e.path);
  for (const path of localizedPaths()) {
    assert.ok(entries.includes(localePath(ES, path)), `${path} needs a Spanish entry`);
  }
  assert.ok(!entries.some((p) => p.includes("/results")), "results stay noindex");
});

// --- data safeguards ---

test("localization work did not disturb supplier state", () => {
  assert.equal(listSupplierCompanies().length, 3);
  assert.equal(listPublicSuppliers().length, 3);
  assert.deepEqual(
    listSupplierCompanies()
      .map((s) => s.displayName)
      .sort(),
    ["FertiExpress Group", "KAP Organic Agro", "Nanofert"],
  );
  for (const m of listMentionedEntities()) {
    assert.equal(m.public, false, `${m.name} stays non-public`);
    assert.equal(m.indexable, false, `${m.name} stays non-indexable`);
  }
});

test("no private deck data appears in any Spanish string", () => {
  const serialized = JSON.stringify(getDictionary(ES));
  for (const pattern of [
    /EBITDA/i,
    /\bROI\b/i,
    /faturamento/i,
    /R\$/,
    /USD\s*\d/,
    /Novellino|Angelina/i,
    /Nutriverde|Nativia|Bom Jesus/i,
    /ISO\s*9001/i,
    /CNPJ/i,
  ]) {
    assert.ok(!pattern.test(serialized), `Spanish dictionary leaks ${pattern}`);
  }
});

// --- parse hygiene ---

test("only the /es segment resolves, never the raw es-419 tag as a URL", () => {
  assert.equal(segmentToLocale("es-419"), null, "/es-419/ must not be a second canonical URL");
  assert.equal(parseLocale("es-419"), ES, "but the tag itself is a valid stored/sent value");
});
