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

// --- documented backlog (tracked, not silently ignored) ------------------

/**
 * Surfaces whose deep FORM field labels are still English and are scheduled for a follow-up
 * translation pass. Documented here so the residual is tracked in code. The files must exist.
 */
export const KNOWN_RESIDUAL: Array<{ file: string; note: string }> = [
  {
    file: "../routes/$locale.analyze.tsx",
    note: "wizard field labels, soil-test + water sections",
  },
  { file: "../routes/$locale.results.$id.tsx", note: "results panel labels and section headings" },
];

test("documented i18n backlog files still exist (report stays accurate)", () => {
  for (const { file } of KNOWN_RESIDUAL) {
    assert.ok(read(file).length > 0, `${file} should exist`);
  }
});
