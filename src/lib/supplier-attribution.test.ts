// Supplier attribution correction — companies named inside a source document must never
// become first-class suppliers. Inmove and FECOAGRO were mentioned inside the FertiExpress
// material; they are retained as non-public mentioned entities only.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { SUPPORTED_LOCALES } from "./i18n.ts";
import { getDictionary } from "./dictionaries.ts";

import {
  SUPPLIERS,
  listSupplierCompanies,
  listPublicSuppliers,
  listMentionedEntities,
  getMentionedEntityById,
  getListedSupplierBySlug,
  getPublicSupplierBySlug,
  publicSupplierSlugs,
  isPublishable,
  suppliersCollectionLd,
  activeSupplierCount,
  publicSupplierCount,
  FERTIEXPRESS_DOCUMENT_ID,
} from "./suppliers.ts";

// --- FertiExpress Group: created from the owner-provided presentation ---

test("FertiExpress Group is an active, public supplier", () => {
  const s = getPublicSupplierBySlug("fertiexpress-group");
  assert.ok(s, "FertiExpress Group must be public");
  assert.equal(s.displayName, "FertiExpress Group");
  assert.equal(s.status, "public");
  assert.equal(s.verified, true);
  assert.equal(s.relationship, "supplier");
  assert.equal(s.verificationStatus, "owner-provided");
});

test("FertiExpress Group records the owner-provided deck as its source", () => {
  const s = getPublicSupplierBySlug("fertiexpress-group")!;
  assert.match(s.source, /owner-provided/i);
  assert.equal(s.lastVerifiedAt, "2026-07-23");
});

test("FertiExpress Group carries its real logo, stored locally", () => {
  const s = getPublicSupplierBySlug("fertiexpress-group")!;
  assert.equal(s.logo, "/suppliers/fertiexpress-group.png");
  assert.ok(s.logo.startsWith("/suppliers/"), "logo must be local, never hotlinked");
});

test("FertiExpress Group publishes only the products the deck supports", () => {
  const s = getPublicSupplierBySlug("fertiexpress-group")!;
  assert.deepEqual(s.products, ["Potassium chloride (KCL)", "Urea", "Ammonium sulphate"]);
  assert.deepEqual(s.productGrades, ["KCL 60%", "Urea 46%"]);
});

test("FertiExpress Group invents no contact details the deck does not contain", () => {
  const s = getPublicSupplierBySlug("fertiexpress-group")!;
  // The presentation contains no website, e-mail or phone anywhere.
  assert.equal(s.website, null);
  assert.equal(s.fertilizerPage, null);
  assert.equal(s.publicEmail, null);
  assert.equal(s.publicPhone, null);
  assert.equal(s.legalName, null);
  // Only the city appears in the deck; the state is never stated, so it stays null.
  assert.equal(s.city, "Campinas");
  assert.equal(s.state, null);
  assert.equal(s.latitude, null);
  assert.equal(s.longitude, null);
});

test("no private deck information reaches any published supplier record", () => {
  // Every one of these appears in the FertiExpress presentation and must never ship:
  // revenue, margins, EBITDA, projections, customer names, reference prices, freight
  // costs, import arrival dates, staff names, payment terms and the unearned ISO claim.
  const forbidden = [
    /206[.,]4/,
    /\bEBITDA\b/i,
    /\bROI\b/i,
    /payback/i,
    /\bmargin/i,
    /revenue/i,
    /projection|forecast/i,
    /faturamento/i,
    /\bCIF\b|\bFOB\b/,
    /USD\s*\d/,
    /R\$/,
    /freight cost|custo.*frete/i,
    /ISO\s*9001/i,
    /Novellino|Angelina|Renato/i,
    /Nutriverde|Nativia|Bom Jesus|Tera Fertilizantes|PMG Comercial|Viterra|Embrafos/i,
    /agosto\s*\/?\s*2026|august\s*2026/i,
    /CNPJ/i,
  ];
  for (const s of listPublicSuppliers()) {
    const text = JSON.stringify(s);
    for (const pattern of forbidden) {
      assert.ok(!pattern.test(text), `${s.displayName} leaks private deck data: ${pattern}`);
    }
  }
});

// --- registry composition ---

test("no company mentioned inside a source document is a first-class supplier", () => {
  const slugs = SUPPLIERS.map((s) => s.slug);
  assert.ok(!slugs.includes("inmove"), "Inmove must not be a supplier record");
  assert.ok(!slugs.includes("fecoagro"), "FECOAGRO must not be a supplier record");
});

test("Nanofert remains an active, public supplier with its logo and website preserved", () => {
  const nanofert = getPublicSupplierBySlug("nanofert");
  assert.ok(nanofert, "Nanofert must stay public");
  assert.equal(nanofert.relationship, "partner");
  assert.equal(nanofert.logo, "/suppliers/nanofert.png");
  assert.equal(nanofert.website, "https://www.nanofert.com.br/");
});

test("exactly two suppliers are active and public: FertiExpress Group and Nanofert", () => {
  assert.equal(activeSupplierCount(), 2);
  assert.equal(publicSupplierCount(), 2);
  assert.deepEqual(
    listSupplierCompanies()
      .map((s) => s.displayName)
      .sort(),
    ["FertiExpress Group", "Nanofert"],
  );
  assert.deepEqual(
    listPublicSuppliers()
      .map((s) => s.displayName)
      .sort(),
    ["FertiExpress Group", "Nanofert"],
  );
});

test("active and public supplier counts are reported and agree with the registry", () => {
  assert.equal(activeSupplierCount(), listSupplierCompanies().length);
  assert.equal(publicSupplierCount(), listPublicSuppliers().length);
});

// --- mentioned entities are retained, not deleted ---

test("Inmove and FECOAGRO are retained as mentioned entities, not deleted", () => {
  const names = listMentionedEntities()
    .map((m) => m.name.toLowerCase())
    .sort();
  assert.deepEqual(names, ["fecoagro", "inmove"]);
});

test("every mentioned entity carries full provenance back to its source document", () => {
  for (const m of listMentionedEntities()) {
    assert.equal(m.sourceDocumentId, FERTIEXPRESS_DOCUMENT_ID, `${m.name} source document`);
    assert.equal(m.extractionOrigin, "supplier-document", `${m.name} extraction origin`);
    assert.ok(m.reviewReason.trim().length > 0, `${m.name} must record why it needs review`);
    assert.equal(m.reviewState, "needs_manual_review", `${m.name} review state`);
    assert.equal(m.requiresReview, true, `${m.name} requiresReview`);
    assert.equal(m.reviewedAt, null, `${m.name} must not be pre-reviewed`);
    assert.equal(m.reviewedBy, null, `${m.name} must not be pre-reviewed`);
  }
});

test("a mentioned entity records its prior misattribution without auto-reassigning it", () => {
  const inmove = getMentionedEntityById("inmove");
  assert.ok(inmove);
  assert.equal(inmove.previousSupplierName, "Inmove");
  // FertiExpress is only ever a candidate — never an automatic reassignment.
  assert.equal(inmove.possibleSupplier, "FertiExpress Group");
  assert.equal(inmove.confirmedSupplierId, null);
});

// --- mentioned entities can never become public ---

test("mentioned entities are structurally non-public", () => {
  for (const m of listMentionedEntities()) {
    assert.equal(m.public, false, `${m.name} must never be public`);
    assert.equal(m.indexable, false, `${m.name} must never be indexable`);
  }
});

test("a mentioned entity resolves to no supplier route, public or listed", () => {
  for (const slug of ["inmove", "fecoagro"]) {
    assert.equal(getListedSupplierBySlug(slug), undefined, `${slug} must have no listed route`);
    assert.equal(getPublicSupplierBySlug(slug), undefined, `${slug} must have no public route`);
  }
});

test("no mentioned entity enters the sitemap", () => {
  const slugs = publicSupplierSlugs();
  assert.ok(!slugs.includes("inmove"));
  assert.ok(!slugs.includes("fecoagro"));
});

test("no mentioned entity appears in the directory CollectionPage JSON-LD", () => {
  const serialized = JSON.stringify(suppliersCollectionLd()).toLowerCase();
  assert.ok(!serialized.includes("inmove"), "Inmove must not appear in structured data");
  assert.ok(!serialized.includes("fecoagro"), "FECOAGRO must not appear in structured data");
});

// --- the public directory surface ---

const directorySource = () =>
  readFileSync(new URL("../routes/suppliers.index.tsx", import.meta.url), "utf8");

test("the public supplier directory no longer renders Global Sourcing Origins", () => {
  const src = directorySource();
  assert.ok(!/listSourcingOrigins/.test(src), "must not read sourcing origins");
  assert.ok(!/Global sourcing origins/i.test(src), "must not render the sourcing-origins section");
});

test("the public supplier directory names no mentioned entity", () => {
  const src = directorySource().toLowerCase();
  assert.ok(!src.includes("inmove"));
  assert.ok(!src.includes("fecoagro"));
});

test('the public supplier directory heading is "Our Supplier Network"', () => {
  // The heading is rendered from the dictionary, so assert it there and confirm the route
  // reads it from the dictionary rather than hard-coding a second copy.
  assert.equal(getDictionary("en").suppliers.title, "Our Supplier Network");
  assert.ok(directorySource().includes("{t.suppliers.title}"));
});

test("the supplier directory heading is translated for every locale", () => {
  for (const locale of SUPPORTED_LOCALES) {
    assert.ok(getDictionary(locale).suppliers.title.trim().length > 0);
  }
});

test("a mentioned entity cannot satisfy the supplier publication gate even if coerced", () => {
  // Guards against a future edit that widens a mentioned entity into a Supplier shape.
  const coerced = {
    ...listMentionedEntities()[0],
    status: "public",
    verified: true,
    displayName: "Inmove",
    slug: "inmove",
    supplierType: "trader",
    country: "Brazil",
    description: "coerced",
    source: "coerced",
    products: ["Urea"],
  } as unknown as Parameters<typeof isPublishable>[0];
  assert.equal(isPublishable(coerced), false, "a mentioned entity must never be publishable");
});
