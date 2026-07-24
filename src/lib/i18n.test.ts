// Locale model: supported locales, URL segments, resolution priority, and the
// server-side validation that guards the AI analysis request.

import test from "node:test";
import assert from "node:assert/strict";

import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  localeToSegment,
  segmentToLocale,
  parseLocale,
  resolveLocale,
  localePath,
  stripLocale,
  localeHtmlLang,
  validateRequestLocale,
  hreflangLinks,
  aiLanguageInstruction,
  LOCALE_STORAGE_KEY,
  readSavedLocale,
  saveLocale,
  type Locale,
} from "./i18n.ts";

/** A minimal in-memory stand-in for window.localStorage. */
function fakeStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    read: () => Object.fromEntries(data),
  };
}

// --- the supported set ---

test("English, Brazilian Portuguese and Latin American Spanish are public", () => {
  assert.deepEqual([...SUPPORTED_LOCALES], ["en", "pt-BR", "es-419"]);
  assert.equal(DEFAULT_LOCALE, "en");
});

test("the Spanish URL segment is /es/, not the full es-419 tag", () => {
  // The internal tag is a UN M49 region code; the public URL stays short and familiar.
  assert.equal(localeToSegment("es-419"), "es");
  assert.equal(segmentToLocale("es"), "es-419");
  assert.equal(localePath("es-419", "/analyze"), "/es/analyze");
  assert.deepEqual(stripLocale("/es/analyze"), { locale: "es-419", path: "/analyze" });
});

test("the es-419 tag itself is not a valid URL segment", () => {
  // Only one canonical URL per locale, so /es-419/... must not silently resolve.
  assert.equal(segmentToLocale("es-419"), null);
});

test("regional Spanish variants all resolve to the Latin American dictionary", () => {
  for (const tag of ["es", "es-419", "es-MX", "es-AR", "es-CL", "es-CO", "ES-mx"]) {
    assert.equal(parseLocale(tag), "es-419", `${tag} should resolve to es-419`);
  }
});

// --- URL segments are lowercase; locale tags keep their canonical casing ---

test("locale tags map to their URL segments and back", () => {
  assert.equal(localeToSegment("en"), "en");
  assert.equal(localeToSegment("pt-BR"), "pt-br");
  assert.equal(segmentToLocale("en"), "en");
  assert.equal(segmentToLocale("pt-br"), "pt-BR");
  assert.equal(segmentToLocale("PT-BR"), "pt-BR");
  assert.equal(segmentToLocale("fr"), null);
});

test("every supported locale round-trips tag -> segment -> tag", () => {
  for (const locale of SUPPORTED_LOCALES) {
    assert.equal(segmentToLocale(localeToSegment(locale)), locale, `${locale} round-trip`);
  }
  // Segments are unique, so no two locales can claim the same URL prefix.
  const segments = SUPPORTED_LOCALES.map(localeToSegment);
  assert.equal(new Set(segments).size, segments.length, "segments must be unique");
});

test("html lang uses the full locale tag, not the short URL segment", () => {
  assert.equal(localeHtmlLang("en"), "en");
  assert.equal(localeHtmlLang("pt-BR"), "pt-BR");
  assert.equal(localeHtmlLang("es-419"), "es-419");
});

// --- parsing is strict ---

test("parseLocale accepts known tags case-insensitively and rejects everything else", () => {
  assert.equal(parseLocale("en"), "en");
  assert.equal(parseLocale("pt-BR"), "pt-BR");
  assert.equal(parseLocale("pt-br"), "pt-BR");
  assert.equal(parseLocale("  pt-BR  "), "pt-BR");
  for (const bad of ["", "xx", "en-US-x-hack", null, undefined, 42, {}, [], "pt_BR", "fr-CA"]) {
    assert.equal(parseLocale(bad), null, `${JSON.stringify(bad)} must not parse`);
  }
});

test("a bare pt tag resolves to Brazilian Portuguese", () => {
  assert.equal(parseLocale("pt"), "pt-BR");
});

// --- resolution priority: explicit > saved > browser > English ---

test("an explicit selection beats every other signal", () => {
  const locale = resolveLocale({
    explicit: "en",
    saved: "pt-BR",
    acceptLanguage: "pt-BR,pt;q=0.9",
  });
  assert.equal(locale, "en");
});

test("a saved preference beats the browser header", () => {
  assert.equal(resolveLocale({ saved: "pt-BR", acceptLanguage: "en-US,en;q=0.9" }), "pt-BR");
});

test("the browser header is used only when nothing else is known", () => {
  assert.equal(resolveLocale({ acceptLanguage: "pt-BR,pt;q=0.9,en;q=0.8" }), "pt-BR");
  assert.equal(resolveLocale({ acceptLanguage: "pt;q=0.9" }), "pt-BR");
});

test("resolution falls back to English for unknown or absent signals", () => {
  assert.equal(resolveLocale({}), "en");
  assert.equal(resolveLocale({ acceptLanguage: "fr-FR,fr;q=0.9" }), "en");
  assert.equal(resolveLocale({ explicit: "klingon", saved: "nope" }), "en");
});

test("a Spanish browser is offered Spanish unless the user chose otherwise", () => {
  assert.equal(resolveLocale({ acceptLanguage: "es-MX,es;q=0.9,en;q=0.8" }), "es-419");
  assert.equal(resolveLocale({ acceptLanguage: "es-419" }), "es-419");
  // An explicit choice always wins over browser detection.
  assert.equal(resolveLocale({ explicit: "en", acceptLanguage: "es-MX,es;q=0.9" }), "en");
  assert.equal(resolveLocale({ saved: "pt-BR", acceptLanguage: "es-MX,es;q=0.9" }), "pt-BR");
});

test("an unparseable explicit value falls through to the next signal, not to English", () => {
  assert.equal(resolveLocale({ explicit: "zz", saved: "pt-BR" }), "pt-BR");
});

test("browser quality values are honoured, not just source order", () => {
  assert.equal(resolveLocale({ acceptLanguage: "fr;q=1.0, pt-BR;q=0.8, en;q=0.2" }), "pt-BR");
});

// --- path helpers ---

test("localePath prefixes a path with the locale segment", () => {
  assert.equal(localePath("en", "/analyze"), "/en/analyze");
  assert.equal(localePath("pt-BR", "/analyze"), "/pt-br/analyze");
  assert.equal(localePath("pt-BR", "/suppliers"), "/pt-br/suppliers");
});

test("localePath normalises the root and missing leading slash", () => {
  assert.equal(localePath("en", "/"), "/en");
  assert.equal(localePath("pt-BR", ""), "/pt-br");
  assert.equal(localePath("en", "analyze"), "/en/analyze");
});

test("localePath never double-prefixes an already-localized path", () => {
  assert.equal(localePath("pt-BR", "/pt-br/analyze"), "/pt-br/analyze");
  assert.equal(localePath("en", "/pt-br/analyze"), "/en/analyze");
});

test("stripLocale splits a localized path into its locale and bare path", () => {
  assert.deepEqual(stripLocale("/pt-br/analyze"), { locale: "pt-BR", path: "/analyze" });
  assert.deepEqual(stripLocale("/en/suppliers"), { locale: "en", path: "/suppliers" });
  assert.deepEqual(stripLocale("/en"), { locale: "en", path: "/" });
  assert.deepEqual(stripLocale("/pt-br/"), { locale: "pt-BR", path: "/" });
});

test("stripLocale leaves an unprefixed path untouched", () => {
  assert.deepEqual(stripLocale("/analyze"), { locale: null, path: "/analyze" });
  assert.deepEqual(stripLocale("/"), { locale: null, path: "/" });
  // "engines" starts with "en" but is not a locale segment.
  assert.deepEqual(stripLocale("/engines"), { locale: null, path: "/engines" });
});

test("localePath and stripLocale round-trip for every supported locale", () => {
  for (const locale of SUPPORTED_LOCALES) {
    for (const path of ["/", "/analyze", "/suppliers", "/guides/fertilizer-cost-per-acre"]) {
      assert.deepEqual(stripLocale(localePath(locale, path)), { locale, path });
    }
  }
});

// --- server-side validation for the AI request ---

test("validateRequestLocale accepts a valid locale", () => {
  assert.equal(validateRequestLocale("pt-BR"), "pt-BR");
  assert.equal(validateRequestLocale("pt-br"), "pt-BR");
  assert.equal(validateRequestLocale("en"), "en");
});

test("validateRequestLocale falls back to English for anything unknown", () => {
  for (const bad of ["fr", "de", "", null, undefined, 7, {}, "<script>"]) {
    assert.equal(validateRequestLocale(bad), "en", `${JSON.stringify(bad)} must fall back`);
  }
});

// --- hreflang ---

test("hreflang links are reciprocal and include x-default", () => {
  const links = hreflangLinks("/analyze");
  const byLang = Object.fromEntries(links.map((l) => [l.hreflang, l.href]));
  assert.equal(byLang.en, "https://www.fertafind.com/en/analyze");
  assert.equal(byLang["pt-BR"], "https://www.fertafind.com/pt-br/analyze");
  // hreflang advertises the full tag while the URL keeps the short segment.
  assert.equal(byLang["es-419"], "https://www.fertafind.com/es/analyze");
  assert.equal(byLang["x-default"], "https://www.fertafind.com/en/analyze");
  assert.equal(links.length, SUPPORTED_LOCALES.length + 1);
});

test("hreflang links are computed from the bare path even if given a localized one", () => {
  assert.deepEqual(hreflangLinks("/pt-br/analyze"), hreflangLinks("/analyze"));
});

// --- saved preference ---

test("a saved locale round-trips through storage", () => {
  const storage = fakeStorage();
  saveLocale(storage, "pt-BR");
  assert.equal(storage.read()[LOCALE_STORAGE_KEY], "pt-BR");
  assert.equal(readSavedLocale(storage), "pt-BR");
});

test("a missing or corrupt saved locale reads as null, not as a crash", () => {
  assert.equal(readSavedLocale(fakeStorage()), null);
  assert.equal(readSavedLocale(fakeStorage({ [LOCALE_STORAGE_KEY]: "klingon" })), null);
  assert.equal(readSavedLocale(null), null);
});

test("storage that throws (private mode, blocked cookies) degrades quietly", () => {
  const hostile = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
  assert.equal(readSavedLocale(hostile), null);
  assert.doesNotThrow(() => saveLocale(hostile, "pt-BR"));
});

// --- the language instruction sent to the analysis model ---

test("Brazilian Portuguese asks the model for Portuguese prose", () => {
  const instruction = aiLanguageInstruction("pt-BR");
  assert.match(instruction, /Brazilian Portuguese/i);
});

test("Latin American Spanish asks the model for neutral Latin American prose", () => {
  assert.match(aiLanguageInstruction("es-419"), /Latin American Spanish/i);
});

test("the server accepts exactly en, pt-BR and es-419", () => {
  assert.equal(validateRequestLocale("es-419"), "es-419");
  assert.equal(validateRequestLocale("es"), "es-419");
  assert.equal(validateRequestLocale("es-MX"), "es-419");
  for (const bad of ["fr", "de", "zh", "", null, undefined, {}]) {
    assert.equal(validateRequestLocale(bad), "en", `${JSON.stringify(bad)} falls back`);
  }
});

test("English asks the model for English prose", () => {
  assert.match(aiLanguageInstruction("en"), /English/i);
});

test("every locale instruction protects names, numbers, currencies and units from translation", () => {
  for (const locale of SUPPORTED_LOCALES) {
    const instruction = aiLanguageInstruction(locale);
    for (const term of ["company", "product", "number", "currenc", "unit"]) {
      assert.match(
        instruction,
        new RegExp(term, "i"),
        `${locale} instruction must protect ${term}`,
      );
    }
    // Grades like "46-0-0" must never be reformatted for a locale.
    assert.match(instruction, /translate/i);
  }
});
