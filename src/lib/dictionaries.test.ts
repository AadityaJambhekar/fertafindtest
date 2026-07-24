// Curated UI dictionaries. The parity test below is what makes "curated, not machine
// translated" enforceable: a key added to English fails the build until it is translated.

import test from "node:test";
import assert from "node:assert/strict";

import { SUPPORTED_LOCALES, type Locale } from "./i18n.ts";
import { getDictionary, type Dictionary } from "./dictionaries.ts";

/** Flatten a nested dictionary into dotted key paths. */
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k));
}

function values(obj: unknown): string[] {
  if (typeof obj === "string") return [obj];
  if (typeof obj !== "object" || obj === null) return [];
  return Object.values(obj).flatMap(values);
}

test("every supported locale has a dictionary", () => {
  for (const locale of SUPPORTED_LOCALES) {
    assert.ok(getDictionary(locale), `${locale} must have a dictionary`);
  }
});

test("every locale defines exactly the same keys as English — no gaps, no strays", () => {
  const english = keyPaths(getDictionary("en")).sort();
  for (const locale of SUPPORTED_LOCALES) {
    const theirs = keyPaths(getDictionary(locale)).sort();
    const missing = english.filter((k) => !theirs.includes(k));
    const extra = theirs.filter((k) => !english.includes(k));
    assert.deepEqual(missing, [], `${locale} is missing keys`);
    assert.deepEqual(extra, [], `${locale} has keys English does not`);
  }
});

test("no dictionary value is empty or a leftover placeholder", () => {
  for (const locale of SUPPORTED_LOCALES) {
    for (const value of values(getDictionary(locale))) {
      assert.ok(value.trim().length > 0, `${locale} has an empty string`);
      assert.ok(!/^TODO|^FIXME|^XXX|\bTRANSLATE\b/i.test(value), `${locale} has a placeholder`);
    }
  }
});

test("Portuguese is actually translated, not copied English", () => {
  const en = getDictionary("en");
  const pt = getDictionary("pt-BR");
  const identical = keyPaths(en).filter((path) => {
    const read = (d: Dictionary) =>
      path.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], d);
    return read(en) === read(pt);
  });
  // A handful of terms are identical by design (brand names, "FertaFind", "Nanofert").
  assert.ok(
    identical.length < keyPaths(en).length * 0.15,
    `too many pt-BR values are untranslated English: ${identical.join(", ")}`,
  );
});

test("brand, product and grade terms survive translation verbatim", () => {
  const pt = JSON.stringify(getDictionary("pt-BR"));
  for (const term of ["FertaFind", "FertiExpress Group", "Nanofert"]) {
    if (JSON.stringify(getDictionary("en")).includes(term)) {
      assert.ok(pt.includes(term), `${term} must not be translated`);
    }
  }
});

test("an unknown locale falls back to the English dictionary", () => {
  assert.equal(getDictionary("es" as Locale), getDictionary("en"));
  assert.equal(getDictionary(undefined as unknown as Locale), getDictionary("en"));
});
