// KAP Organic Agro (third active public supplier) and the removal of the directory
// filter bar.
//
// Every field below is checked against the official site, kaporganic.com. Nothing here may
// assert a price, stock level, delivery promise or performance claim — those are exactly the
// things the record must not carry.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { SUPPORTED_LOCALES, type Locale } from "./i18n.ts";
import { getDictionary } from "./dictionaries.ts";
import {
  listSupplierCompanies,
  listPublicSuppliers,
  listMentionedEntities,
  getPublicSupplierBySlug,
  publicSupplierSlugs,
  suppliersCollectionLd,
  supplierOrganizationLd,
  activeSupplierCount,
  publicSupplierCount,
} from "./suppliers.ts";
import { sitemapEntries } from "./content.ts";
import { localePath } from "./i18n.ts";

const KAP = "kap-organic-agro";

// --- the record ---

test("KAP Organic Agro is an active, public supplier", () => {
  const s = getPublicSupplierBySlug(KAP);
  assert.ok(s, "KAP must be public");
  assert.equal(s.displayName, "KAP Organic Agro");
  assert.equal(s.status, "public");
  assert.equal(s.verified, true);
  assert.equal(s.relationship, "supplier");
  assert.equal(s.verificationStatus, "owner-confirmed-public-source-verified");
});

test("KAP is classified as a distributor, never the manufacturer", () => {
  const s = getPublicSupplierBySlug(KAP)!;
  assert.equal(s.supplierType, "distributor");
  // IFFCO makes the products; KAP distributes them. The copy must not blur that.
  assert.match(s.description!, /distributes/i);
  assert.ok(!/\bmanufactur/i.test(s.description!), "KAP must not be described as a manufacturer");
  assert.match(s.description!, /IFFCO/, "the manufacturer is named");
});

test("KAP records both published locations exactly as the site labels them", () => {
  const s = getPublicSupplierBySlug(KAP)!;
  assert.equal(s.country, "United States");
  assert.equal(s.state, "California");
  assert.equal(s.city, "Livermore", "site labels Livermore as Operations");
  assert.equal(s.corporateLocation, "Milpitas, California", "site labels Milpitas as Corporate");
});

test("KAP points at its official website", () => {
  const s = getPublicSupplierBySlug(KAP)!;
  assert.equal(s.website, "https://www.kaporganic.com/");
  assert.equal(new URL(s.website).host, "www.kaporganic.com");
  assert.equal(new URL(s.website).protocol, "https:", "must be https");
});

test("KAP's logo is stored locally at a real file, never hotlinked", () => {
  const s = getPublicSupplierBySlug(KAP)!;
  assert.equal(s.logo, "/suppliers/kap-organic-agro.png");
  assert.ok(s.logo.startsWith("/suppliers/"), "local path only");
  assert.ok(!/^https?:/i.test(s.logo), "must not be a remote URL");
  const bytes = readFileSync(
    new URL("../../public/suppliers/kap-organic-agro.png", import.meta.url),
  );
  assert.ok(bytes.length > 1000, "logo file must exist and be non-trivial");
  // PNG magic number, and a square canvas so the official mark is not distorted.
  assert.deepEqual([...bytes.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47], "must be a real PNG");
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  assert.equal(width, height, "square source must stay square — aspect ratio preserved");
});

test("KAP carries no price, stock, delivery or performance claim", () => {
  const s = getPublicSupplierBySlug(KAP)!;
  const text = JSON.stringify(s);
  for (const pattern of [
    /\$\d/,
    /\bprice[sd]?\b(?! final)/i,
    /in stock|inventory|available now/i,
    /free shipping|next.day|guaranteed delivery|delivers in/i,
    /increase[sd]? yield|boosts?|guarantee/i,
    /discount|voucher|\boff\b/i,
  ]) {
    assert.ok(!pattern.test(text), `KAP record carries an unsupported claim: ${pattern}`);
  }
});

// --- the network ---

test("exactly three suppliers are active and public", () => {
  assert.equal(activeSupplierCount(), 3);
  assert.equal(publicSupplierCount(), 3);
  assert.deepEqual(
    listSupplierCompanies().map((s) => s.displayName),
    ["FertiExpress Group", "Nanofert", "KAP Organic Agro"],
  );
});

test("Inmove and FECOAGRO are still hidden", () => {
  for (const m of listMentionedEntities()) {
    assert.equal(m.public, false, `${m.name} stays non-public`);
    assert.equal(m.indexable, false, `${m.name} stays non-indexable`);
  }
  assert.ok(!publicSupplierSlugs().includes("inmove"));
  assert.ok(!publicSupplierSlugs().includes("fecoagro"));
});

// --- surfaces ---

test("KAP appears in the sitemap for every locale that has a supplier directory", () => {
  const entries = sitemapEntries().map((e) => e.path);
  for (const locale of SUPPORTED_LOCALES) {
    const url = localePath(locale, `/suppliers/${KAP}`);
    assert.ok(entries.includes(url), `${url} must be in the sitemap`);
  }
});

test("KAP is listed in the directory CollectionPage JSON-LD", () => {
  const ld = suppliersCollectionLd() as unknown as {
    hasPart: Array<{ name: string; url: string }>;
  };
  const kap = ld.hasPart.find((p) => p.name === "KAP Organic Agro");
  assert.ok(kap, "KAP must appear in structured data");
  assert.match(kap.url, /\/suppliers\/kap-organic-agro$/);
});

test("KAP's Organization JSON-LD carries only fields we hold", () => {
  const ld = supplierOrganizationLd(getPublicSupplierBySlug(KAP)!);
  assert.equal(ld["@type"], "Organization");
  assert.equal(ld.name, "KAP Organic Agro");
  assert.deepEqual(ld.sameAs, ["https://www.kaporganic.com/"]);
  assert.equal(ld.logo, "/suppliers/kap-organic-agro.png");
  // No contact details were approved for republication.
  assert.equal("email" in ld, false);
  assert.equal("telephone" in ld, false);
});

test("KAP has a curated description in every locale, none falling back to English", () => {
  const en = getDictionary("en").supplierDescription[KAP];
  assert.ok(en && en.trim().length > 0, "English description exists");
  for (const locale of SUPPORTED_LOCALES) {
    const text = getDictionary(locale as Locale).supplierDescription[KAP];
    assert.ok(text && text.trim().length > 0, `${locale} description exists`);
    if (locale !== "en") {
      assert.notEqual(text, en, `${locale} must not fall back to English`);
    }
    // Brand and manufacturer names survive translation.
    assert.match(text, /KAP Organic Agro/, `${locale} keeps the company name`);
    assert.match(text, /IFFCO/, `${locale} keeps the manufacturer name`);
  }
});

test("the United States is localized for every locale", () => {
  for (const locale of SUPPORTED_LOCALES) {
    const label = getDictionary(locale as Locale).country["United States"];
    assert.ok(label && label.trim().length > 0, `${locale} needs a country label`);
  }
});

// --- the filter bar is gone ---

const directorySource = () =>
  readFileSync(new URL("../routes/$locale.suppliers.index.tsx", import.meta.url), "utf8");

test("no filter control renders on the supplier directory", () => {
  const src = directorySource();
  for (const gone of [
    "FilterSelect",
    "filterSupplierCompanies",
    "directoryFilterOptions",
    "SupplierDirectoryFilters",
    "EMPTY_FILTERS",
    "isFiltering",
    "setFilters",
  ]) {
    assert.ok(!src.includes(gone), `${gone} must be gone from the directory page`);
  }
  assert.ok(!/<select/i.test(src), "no select element may remain");
});

test("the directory keeps no filter state at all", () => {
  const src = directorySource();
  assert.ok(!/useState/.test(src), "no component state is needed without filters");
  assert.ok(!/useMemo/.test(src), "no memoised filtering remains");
});

test("the filter helpers are removed from the data layer", () => {
  const lib = readFileSync(new URL("./suppliers.ts", import.meta.url), "utf8");
  for (const gone of [
    "export function filterSupplierCompanies",
    "export function filterSourcingOrigins",
    "export function directoryFilterOptions",
    "export interface SupplierDirectoryFilters",
  ]) {
    assert.ok(!lib.includes(gone), `${gone} must be removed`);
  }
});

test("supplier data fields are still stored even though filtering is gone", () => {
  // "Preserve supplier data fields internally" — the fields remain for future use.
  for (const s of listPublicSuppliers()) {
    assert.ok(Array.isArray(s.products), `${s.slug} keeps products`);
    assert.ok(Array.isArray(s.productGrades), `${s.slug} keeps grades`);
    assert.ok(Array.isArray(s.serviceRegions), `${s.slug} keeps service regions`);
    assert.ok(typeof s.country === "string", `${s.slug} keeps its country`);
  }
  const kap = getPublicSupplierBySlug(KAP)!;
  assert.deepEqual(kap.products, ["Nano fertilizers", "Seaweed extract"]);
  assert.ok(
    kap.productGrades.some((g) => g.includes("17-0-0")),
    "NPK grades preserved verbatim",
  );
});

test("all three supplier cards render immediately, with no empty-state branch", () => {
  const src = directorySource();
  assert.match(src, /companies\.map\(/, "cards map straight over the full list");
  assert.ok(
    !/match the current filters/i.test(src),
    "the filtered empty state must be gone — all cards are always shown",
  );
});

test("no link still carries an obsolete supplier filter parameter", () => {
  for (const file of ["../components/site-header.tsx", "../routes/$locale.index.tsx"]) {
    const src = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.ok(
      !/relationship=partner/.test(src),
      `${file} still links to a filter that no longer exists`,
    );
  }
});
