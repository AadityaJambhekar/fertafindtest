import assert from "node:assert/strict";
import test from "node:test";
import {
  SUPPLIERS,
  SOURCING_ORIGINS,
  SOURCING_DISCLAIMER,
  SUPPLIER_DISCOVERY_DISCLAIMER,
  VERIFICATION_BADGE,
  SUPPLIER_TYPE_LABEL,
  type Supplier,
  type SourcingOrigin,
  isPublishable,
  listPublicSuppliers,
  listSupplierCompanies,
  listHiddenSuppliers,
  listSourcingOrigins,
  getPublicSupplierBySlug,
  getListedSupplierBySlug,
  publicSupplierSlugs,
  suppliersCollectionLd,
  supplierOrganizationLd,
  supplierDetailRouteHead,
  directoryFilterOptions,
  filterSupplierCompanies,
  filterSourcingOrigins,
  type SupplierDirectoryFilters,
} from "./suppliers.ts";

function completeVerifiedPublic(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: "acme",
    slug: "acme-fertilizer",
    displayName: "Acme Fertilizer",
    legalName: "Acme Fertilizer LLC",
    logo: null,
    verified: true,
    verificationStatus: "public-source-verified",
    supplierType: "distributor",
    country: "United States",
    state: "Iowa",
    city: "Ames",
    latitude: 42.03,
    longitude: -93.62,
    products: ["Urea"],
    productGrades: ["46-0-0"],
    serviceRegions: ["Midwest"],
    website: "https://example.com",
    fertilizerPage: null,
    publicEmail: "info@example.com",
    publicPhone: null,
    description: "A verified fertilizer distributor.",
    source: "Verified directly with the supplier",
    lastVerifiedAt: "2026-07-22",
    status: "public",
    ...overrides,
  };
}

const NO_FILTERS: SupplierDirectoryFilters = {
  verification: "",
  type: "",
  product: "",
  origin: "",
};

// Price / financial / availability language that must never appear in any record.
const FINANCIAL_LEAK =
  /\$|R\$|€|\bUSD\b|\bprices?\b|\bpricing\b|revenue|projection|forecast|margin|\bavailabilit|\bin stock\b|\bshipping\b|\bimport date|\bvolumes?\b|per ton\b/i;

// --- publication rules (unchanged behaviour) ---
test("a complete, verified, public record is publishable", () => {
  assert.equal(isPublishable(completeVerifiedPublic()), true);
});
test("draft records are never publishable", () => {
  assert.equal(isPublishable(completeVerifiedPublic({ status: "draft" })), false);
});
test("inactive records are never publishable", () => {
  assert.equal(isPublishable(completeVerifiedPublic({ status: "inactive" })), false);
});
test("unverified records are never publishable, even if status is public", () => {
  assert.equal(isPublishable(completeVerifiedPublic({ verified: false })), false);
});
test("records missing a required field are not publishable", () => {
  assert.equal(isPublishable(completeVerifiedPublic({ description: null })), false);
  assert.equal(isPublishable(completeVerifiedPublic({ description: "   " })), false);
  assert.equal(isPublishable(completeVerifiedPublic({ country: "" })), false);
  assert.equal(isPublishable(completeVerifiedPublic({ products: [] })), false);
});

// --- registry: FECOAGRO verified + Inmove source-listed, both listed companies ---
test("the directory lists exactly two supplier companies: FECOAGRO then Inmove", () => {
  const companies = listSupplierCompanies();
  assert.deepEqual(
    companies.map((s) => s.slug),
    ["fecoagro", "inmove"],
  );
});

test("exactly one supplier is publishable (verified) — FECOAGRO — for JSON-LD and the sitemap", () => {
  const pub = listPublicSuppliers();
  assert.equal(pub.length, 1);
  assert.equal(pub[0].slug, "fecoagro");
  assert.deepEqual(publicSupplierSlugs(), ["fecoagro"]);
});

test("FECOAGRO renders as a verified public record with website-verified fields only", () => {
  const s = getPublicSupplierBySlug("fecoagro");
  assert.ok(s, "FECOAGRO must be public");
  assert.equal(s!.status, "public");
  assert.equal(s!.verified, true);
  assert.equal(s!.verificationStatus, "public-source-verified");
  assert.equal(VERIFICATION_BADGE[s!.verificationStatus], "Public information verified");
  assert.equal(s!.displayName, "FECOAGRO");
  assert.equal(
    s!.legalName,
    "FECOAGRO – Federação das Cooperativas Agropecuárias do Estado de Santa Catarina",
  );
  assert.equal(s!.supplierType, "cooperative");
  assert.equal(s!.country, "Brazil");
  assert.equal(s!.state, "Santa Catarina");
  assert.equal(s!.city, "Florianópolis");
  assert.deepEqual(s!.products, [
    "Fertilizers",
    "Organomineral fertilizers",
    "Pasture fertilizers",
  ]);
  assert.equal(s!.source, "Official FECOAGRO website");
  // Unverified fields stay empty — nothing invented.
  assert.equal(s!.latitude, null);
  assert.equal(s!.longitude, null);
  assert.equal(s!.publicEmail, null);
  assert.equal(s!.publicPhone, null);
});

test("the FECOAGRO website + fertilizer page point to the official fecoagro.coop.br domain", () => {
  const s = getPublicSupplierBySlug("fecoagro")!;
  assert.equal(s.website, "https://www.fecoagro.coop.br/");
  assert.equal(new URL(s.website!).host, "www.fecoagro.coop.br");
  assert.equal(s.fertilizerPage, "https://www.fecoagro.coop.br/nossos-fertilizantes/");
  assert.equal(new URL(s.fertilizerPage!).host, "www.fecoagro.coop.br");
});

// --- Inmove: source-listed, unverified, no invented data ---
test("Inmove is a source-listed, unverified public company (a trading company)", () => {
  const inmove = getListedSupplierBySlug("inmove");
  assert.ok(inmove, "Inmove must be listed on the directory");
  assert.equal(inmove!.status, "public");
  assert.equal(inmove!.verified, false);
  assert.equal(inmove!.verificationStatus, "source-listed-unverified");
  assert.equal(VERIFICATION_BADGE[inmove!.verificationStatus], "Information pending verification");
  assert.equal(inmove!.supplierType, "trader");
  assert.equal(SUPPLIER_TYPE_LABEL[inmove!.supplierType], "Trading company");
  assert.equal(inmove!.country, "Brazil");
  // Not verified -> never publishable -> no Organization JSON-LD, never in the sitemap.
  assert.equal(isPublishable(inmove!), false);
  assert.equal(getPublicSupplierBySlug("inmove"), undefined);
  assert.ok(!publicSupplierSlugs().includes("inmove"));
});

test("Inmove has no invented website, address, contact, products, grades or coordinates", () => {
  const inmove = getListedSupplierBySlug("inmove")!;
  assert.equal(inmove.website, null);
  assert.equal(inmove.fertilizerPage, null);
  assert.equal(inmove.legalName, null);
  assert.equal(inmove.city, null);
  assert.equal(inmove.state, null);
  assert.equal(inmove.latitude, null);
  assert.equal(inmove.longitude, null);
  assert.equal(inmove.publicEmail, null);
  assert.equal(inmove.publicPhone, null);
  assert.equal(inmove.logo, null);
  assert.deepEqual(inmove.products, []);
  assert.deepEqual(inmove.productGrades, []);
  assert.deepEqual(inmove.serviceRegions, []);
  assert.equal(inmove.lastVerifiedAt, null);
  // The only prose is the provided caution wording, which makes the unverified status explicit.
  assert.equal(
    inmove.description,
    "Listed as a national trading supplier in source material provided to FertaFind. Additional company and product information has not yet been independently verified.",
  );
  assert.match(inmove.description!, /not yet been independently verified/i);
});

test("getListedSupplierBySlug resolves both companies; unknown slugs do not", () => {
  assert.equal(getListedSupplierBySlug("fecoagro")!.slug, "fecoagro");
  assert.equal(getListedSupplierBySlug("inmove")!.slug, "inmove");
  assert.equal(getListedSupplierBySlug("does-not-exist"), undefined);
});

// --- Global Sourcing Origins ---
test("all six global sourcing origins are listed with their exact products", () => {
  assert.deepEqual(listSourcingOrigins(), [
    { origin: "Russia", product: "KCL 60%" },
    { origin: "Germany", product: "KCL 60%" },
    { origin: "China", product: "Urea" },
    { origin: "Poland", product: "Urea" },
    { origin: "International Trading", product: "Urea" },
    { origin: "Egypt", product: "SSP" },
  ]);
});

test("sourcing origins are not turned into supplier companies", () => {
  const companyNames = new Set(listSupplierCompanies().map((s) => s.displayName.toLowerCase()));
  const companySlugs = new Set(SUPPLIERS.map((s) => s.slug.toLowerCase()));
  for (const o of SOURCING_ORIGINS) {
    assert.ok(!companyNames.has(o.origin.toLowerCase()), `${o.origin} must not be a company`);
    assert.ok(!companySlugs.has(o.origin.toLowerCase()), `${o.origin} must not be a supplier slug`);
    // A sourcing origin carries only an origin + product — no company identity fields.
    assert.deepEqual(Object.keys(o).sort(), ["origin", "product"]);
  }
});

test("sourcing origins expose no price, availability, shipping, volume or financial data", () => {
  for (const o of SOURCING_ORIGINS) {
    for (const value of Object.values(o)) {
      assert.ok(!FINANCIAL_LEAK.test(String(value)), `sourcing origin leaks data: ${value}`);
    }
  }
  assert.equal(
    SOURCING_DISCLAIMER,
    "Global sourcing origins are shown for market discovery. Individual suppliers, availability, pricing, and commercial relationships must be independently confirmed.",
  );
});

test("no Organization JSON-LD is emitted for sourcing origins", () => {
  const ld = suppliersCollectionLd() as unknown as { hasPart: Array<{ name: string }> };
  const names = ld.hasPart.map((p) => p.name.toLowerCase());
  for (const o of SOURCING_ORIGINS) {
    assert.ok(!names.includes(o.origin.toLowerCase()), `${o.origin} must not appear in JSON-LD`);
  }
});

// --- no leaked financial / private data, no partnership language (all records) ---
test("no withheld financial/private data leaks into any supplier or sourcing record", () => {
  const banned = /\$|\bR\$|revenue|projection|forecast|margin|customer\b/i;
  const records: Array<Supplier | SourcingOrigin> = [...SUPPLIERS, ...SOURCING_ORIGINS];
  for (const record of records) {
    for (const value of Object.values(record)) {
      const text = Array.isArray(value) ? value.join(" ") : String(value ?? "");
      assert.ok(!banned.test(text), `record leaks withheld data: ${text}`);
    }
  }
});

test("no partnership or endorsement language appears in any supplier record", () => {
  const banned = /official fertafind partner|partnership|\bendorse|preferred partner/i;
  for (const s of SUPPLIERS) {
    for (const value of Object.values(s)) {
      const text = Array.isArray(value) ? value.join(" ") : String(value ?? "");
      assert.ok(!banned.test(text), `${s.id} uses partnership/endorsement language: ${text}`);
    }
  }
});

test("the discovery disclaimer explicitly disclaims endorsement, partnership, pricing and availability", () => {
  assert.equal(
    SUPPLIER_DISCOVERY_DISCLAIMER,
    "Supplier information is provided for discovery and does not imply endorsement, partnership, pricing, availability, or commercial approval by FertaFind.",
  );
});

// --- filters (pure functions) ---
test("verification filter: Verified returns only FECOAGRO and no sourcing origins", () => {
  const f: SupplierDirectoryFilters = { ...NO_FILTERS, verification: "verified" };
  assert.deepEqual(
    filterSupplierCompanies(listSupplierCompanies(), f).map((s) => s.slug),
    ["fecoagro"],
  );
  assert.deepEqual(filterSourcingOrigins(listSourcingOrigins(), f), []);
});

test("verification filter: Pending returns only Inmove and no sourcing origins", () => {
  const f: SupplierDirectoryFilters = { ...NO_FILTERS, verification: "pending" };
  assert.deepEqual(
    filterSupplierCompanies(listSupplierCompanies(), f).map((s) => s.slug),
    ["inmove"],
  );
  assert.deepEqual(filterSourcingOrigins(listSourcingOrigins(), f), []);
});

test("supplier-type filter: Trading company returns only Inmove and no origins", () => {
  const f: SupplierDirectoryFilters = { ...NO_FILTERS, type: "trader" };
  assert.deepEqual(
    filterSupplierCompanies(listSupplierCompanies(), f).map((s) => s.slug),
    ["inmove"],
  );
  assert.deepEqual(filterSourcingOrigins(listSourcingOrigins(), f), []);
});

test("product filter: Urea returns the Urea origins and no supplier company", () => {
  const f: SupplierDirectoryFilters = { ...NO_FILTERS, product: "Urea" };
  assert.deepEqual(filterSupplierCompanies(listSupplierCompanies(), f), []);
  assert.deepEqual(
    filterSourcingOrigins(listSourcingOrigins(), f).map((o) => o.origin),
    ["China", "Poland", "International Trading"],
  );
});

test("origin filter: Russia returns the Russia origin and no supplier company", () => {
  const f: SupplierDirectoryFilters = { ...NO_FILTERS, origin: "Russia" };
  assert.deepEqual(filterSupplierCompanies(listSupplierCompanies(), f), []);
  assert.deepEqual(
    filterSourcingOrigins(listSourcingOrigins(), f).map((o) => o.origin),
    ["Russia"],
  );
});

test("origin filter: Brazil returns both companies and no sourcing origin", () => {
  const f: SupplierDirectoryFilters = { ...NO_FILTERS, origin: "Brazil" };
  assert.deepEqual(
    filterSupplierCompanies(listSupplierCompanies(), f).map((s) => s.slug),
    ["fecoagro", "inmove"],
  );
  assert.deepEqual(filterSourcingOrigins(listSourcingOrigins(), f), []);
});

test("directory filter options expose the trading-company type, all products and all origins", () => {
  const opts = directoryFilterOptions();
  assert.ok(opts.supplierTypes.includes("cooperative"));
  assert.ok(opts.supplierTypes.includes("trader"));
  for (const product of ["KCL 60%", "Urea", "SSP", "Fertilizers"]) {
    assert.ok(opts.products.includes(product), `products should include ${product}`);
  }
  for (const origin of [
    "Brazil",
    "Russia",
    "Germany",
    "China",
    "Poland",
    "International Trading",
    "Egypt",
  ]) {
    assert.ok(opts.origins.includes(origin), `origins should include ${origin}`);
  }
});

// --- JSON-LD + detail head rules ---
test("CollectionPage JSON-LD lists only the verified public supplier (Inmove excluded)", () => {
  const ld = suppliersCollectionLd() as unknown as { hasPart: Array<{ name: string }> };
  const names = ld.hasPart.map((p) => p.name);
  assert.deepEqual(names, ["FECOAGRO"]);
  assert.ok(!names.some((n) => /inmove/i.test(n)));
});

test("FECOAGRO detail head includes Organization JSON-LD", () => {
  const s = getListedSupplierBySlug("fecoagro")!;
  const head = supplierDetailRouteHead(s);
  const ldTypes = (head.scripts ?? [])
    .filter((sc) => sc.type === "application/ld+json")
    .map((sc) => JSON.parse(sc.children)["@type"]);
  assert.ok(ldTypes.includes("Organization"), "FECOAGRO must emit Organization JSON-LD");
  assert.ok(ldTypes.includes("BreadcrumbList"));
});

test("Inmove detail head emits NO Organization JSON-LD (breadcrumb only)", () => {
  const s = getListedSupplierBySlug("inmove")!;
  const head = supplierDetailRouteHead(s);
  const ldTypes = (head.scripts ?? [])
    .filter((sc) => sc.type === "application/ld+json")
    .map((sc) => JSON.parse(sc.children)["@type"]);
  assert.ok(!ldTypes.includes("Organization"), "Inmove must NOT emit Organization JSON-LD");
  assert.ok(ldTypes.includes("BreadcrumbList"));
  // Detail page must still be canonical + indexable (canonical link present, no noindex here).
  const hasCanonical = (head.links ?? []).some((l) => l.rel === "canonical");
  assert.ok(hasCanonical, "Inmove detail page keeps a canonical link");
});

test("Organization JSON-LD for FECOAGRO uses only verified fields (no nulls emitted)", () => {
  const s = getPublicSupplierBySlug("fecoagro")!;
  const ld = supplierOrganizationLd(s);
  assert.equal(ld["@type"], "Organization");
  assert.equal(ld.name, "FECOAGRO");
  assert.equal((ld.sameAs as string[])[0], "https://www.fecoagro.coop.br/");
  assert.equal("logo" in ld, false); // no verified logo
  assert.equal("email" in ld, false); // no public email
  assert.equal("telephone" in ld, false); // no public phone
  const addr = ld.address as Record<string, string>;
  assert.equal(addr.addressRegion, "Santa Catarina");
  assert.equal(addr.addressCountry, "Brazil");
});

test("Organization JSON-LD omits fields we do not have (no nulls emitted)", () => {
  const ld = supplierOrganizationLd(completeVerifiedPublic({ logo: null, publicPhone: null }));
  assert.equal(ld["@type"], "Organization");
  assert.equal("logo" in ld, false);
  assert.equal("telephone" in ld, false);
  assert.equal(ld.name, "Acme Fertilizer");
});

test("listHiddenSuppliers contains only non-publishable records (Inmove) — never rendered as verified", () => {
  const hidden = listHiddenSuppliers();
  for (const s of hidden) assert.equal(isPublishable(s), false);
  assert.ok(hidden.every((s) => !s.verified));
});
