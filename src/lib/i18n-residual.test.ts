// Residual-English / language-fallback guard for the customer-facing surfaces.
//
// This is the automated check the audit requires: it fails when a critical Portuguese or Spanish
// page would fall back to English, when an allowlisted proper noun is accidentally translated,
// or when a surface that was localized regrows a hard-coded English string. It also documents
// (KNOWN_RESIDUAL) the surfaces whose deep field labels are still English so the backlog is
// tracked in code, not just prose.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { getDictionary } from "./dictionaries.ts";
import { PROPER_NOUNS } from "./i18n-allowlist.ts";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

// --- allowlist: proper nouns are never translated ------------------------

test("allowlisted proper nouns survive verbatim in Portuguese and Spanish", () => {
  const en = JSON.stringify(getDictionary("en"));
  const pt = JSON.stringify(getDictionary("pt-BR"));
  const es = JSON.stringify(getDictionary("es-419"));
  for (const noun of PROPER_NOUNS) {
    if (!en.includes(noun)) continue; // only enforce terms English actually ships
    assert.ok(pt.includes(noun), `pt-BR must keep "${noun}" untranslated`);
    assert.ok(es.includes(noun), `es-419 must keep "${noun}" untranslated`);
  }
});

// --- fallback guard: newly-localized surfaces are actually translated -----

const CRITICAL_SECTIONS = ["errorPages", "locationPicker", "supplierDetail"] as const;

test("critical localized sections do not fall back to English in pt-BR / es-419", () => {
  const en = getDictionary("en") as unknown as Record<string, Record<string, string>>;
  for (const locale of ["pt-BR", "es-419"] as const) {
    const dict = getDictionary(locale) as unknown as Record<string, Record<string, string>>;
    for (const section of CRITICAL_SECTIONS) {
      for (const [key, value] of Object.entries(en[section])) {
        // Each prose string must be genuinely translated (differ from English).
        assert.notEqual(
          dict[section][key],
          value,
          `${locale}.${section}.${key} is still English (fallback)`,
        );
      }
    }
  }
});

// --- regression guard: fixed surfaces must pull from the dictionary -------

// Phrases that were hard-coded before this change and are now dictionary-driven. If any reappears
// as a literal in its source file, the localization regressed.
const MUST_NOT_CONTAIN: Array<{ file: string; phrases: string[] }> = [
  {
    file: "../components/farm-location-picker.tsx",
    phrases: ["Address or place", "Set your farm pin", "Drop a pin instead", "Hide map"],
  },
  {
    file: "../routes/$locale.suppliers.$slug.tsx",
    phrases: ["Information pending verification", "Analyze a quote", "Fertilizer products"],
  },
  { file: "../routes/__root.tsx", phrases: ["Page not found", "Go home", "Try again"] },
  {
    file: "../routes/$locale.analyze.tsx",
    phrases: [
      "Clear selection",
      "Product preferences",
      "Crop stage",
      "Laboratory soil test",
      "Water and soil",
      "Nutrient targets",
      "Drop, tap, or paste quotes here",
    ],
  },
  {
    file: "../routes/$locale.results.$id.tsx",
    phrases: [
      "Your recommendation",
      "Recommendation audit",
      "Quote comparison",
      "Check before buying",
      "Farmer price",
      "Estimated product cost",
    ],
  },
];

test("localized surfaces no longer contain their old hard-coded English strings", () => {
  for (const { file, phrases } of MUST_NOT_CONTAIN) {
    const src = read(file);
    for (const phrase of phrases) {
      assert.ok(!src.includes(`>${phrase}<`), `${file} still hard-codes ">${phrase}<"`);
      assert.ok(!src.includes(`"${phrase}"`), `${file} still hard-codes "${phrase}"`);
    }
  }
});

// --- fallback guard: Analyze + Results customer surfaces are actually translated ----------
//
// Representative keys across every category the audit named. Each must be genuinely translated
// (differ from English) in BOTH pt-BR and es-419 — this is what fails when a critical surface
// falls back to English. Kept as an explicit list (not a broad regex) so it cannot mask a
// regression; exact technical/unit cognates that legitimately match English are handled by the
// narrow allowlist in spanish-i18n.test.ts / dictionaries.test.ts.
const CRITICAL_KEYS: string[] = [
  // Analyze field labels & sections
  "analyze.clearSelection",
  "analyze.fieldSizeLabel",
  "analyze.prefsTitle",
  "analyze.cropStageTitle",
  "analyze.soilTitle",
  "analyze.waterTitle",
  "analyze.targetsTitle",
  "analyze.moreDetails",
  // Analyze crop name / stage display maps
  "analyze.cropName.Soybeans",
  "analyze.cropStage.Flowering",
  // Analyze validation + upload/parsing
  "validation.locationNotFound",
  "validation.locationFailed",
  "analyze.maxFilesError",
  "analyze.dropzoneTitle",
  "analyze.dropzoneHelp",
  "analyze.soilUploadHelp",
  // Results headings
  "results.yourRecommendation",
  "results.recommendationAudit",
  "results.quoteComparison",
  "results.farmDataTitle",
  // Comparison + price/nutrient/delivery labels
  "results.nutrientCost",
  "results.costPerHa",
  "results.sortScore",
  "results.topComparison",
  "results.farmerPrice",
  "results.estimatedProductCost",
  // Recommendations
  "results.partnerRecommendation",
  "results.noVerifiedStageTitle",
  "results.factorsUsedSummary",
  // Warnings
  "results.checkBeforeBuying",
  "results.notARecommendation",
  // Empty + error states
  "results.noExtracted",
  "results.loadingTitle",
  "results.notAvailableTitle",
  // 404 text
  "errorPages.notFoundTitle",
  "errorPages.goHome",
];

function readPath(dict: unknown, path: string): string {
  return path
    .split(".")
    .reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], dict) as string;
}

test("critical Analyze/Results/404 strings are translated in pt-BR and es-419 (no English fallback)", () => {
  const en = getDictionary("en");
  for (const locale of ["pt-BR", "es-419"] as const) {
    const dict = getDictionary(locale);
    for (const path of CRITICAL_KEYS) {
      const enValue = readPath(en, path);
      const localized = readPath(dict, path);
      assert.ok(typeof localized === "string" && localized.length > 0, `${locale}.${path} missing`);
      assert.notEqual(localized, enValue, `${locale}.${path} still equals English "${enValue}"`);
    }
  }
});

// --- documented backlog (tracked, not silently ignored) ------------------

/**
 * Customer-facing English strings still pending translation, tracked in code so the residual is
 * never silently forgotten. These are the SHARED file-validation strings produced by
 * quote-files.ts (also consumed by the server contract) and the soil-test extraction server
 * route — localizing them needs a locale-threading refactor scheduled as a follow-up.
 */
export const KNOWN_RESIDUAL: Array<{ file: string; note: string }> = [
  {
    file: "../lib/quote-files.ts",
    note: "client file-validation messages (unsupported type / over 10 MB), shared with the server",
  },
  {
    file: "../routes/api.extract-soil-test.ts",
    note: "soil-test extraction server responses (secondary, collapsed 'More details' feature)",
  },
];

test("documented i18n backlog files still exist (report stays accurate)", () => {
  for (const { file } of KNOWN_RESIDUAL) {
    assert.ok(read(file).length > 0, `${file} should exist`);
  }
});
