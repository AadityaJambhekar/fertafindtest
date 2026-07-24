import assert from "node:assert/strict";
import test from "node:test";
import {
  SUPPLIERS,
  SOURCING_ORIGINS,
  SOURCING_DISCLAIMER,
  SUPPLIER_DISCOVERY_DISCLAIMER,
  VERIFICATION_BADGE,
  SUPPLIER_BADGE_LABEL,
  SUPPLIER_TYPE_LABEL,
  supplierBadgeKind,
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
    relationship: "listed",
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
  relationship: "",
  verification: "",
  type: "",
  product: "",
  origin: "",
};

// Price / financial / availability language that must never appear in any sourcing record.
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

// --- registry: Nanofert only. Inmove/FECOAGRO were corrected to mentioned entities, and
// --- FertiExpress Group cannot be added until the owner-provided deck is available. ---
test("the network lists only supplier companies with a real FertaFind relationship", () => {
  assert.deepEqual(
    listSupplierCompanies().map((s) => s.slug),
    ["nanofert"],
  );
});

test("only genuine suppliers are publishable — for JSON-LD and the sitemap", () => {
  const pub = listPublicSuppliers();
  assert.deepEqual(
    pub.map((s) => s.slug),
    ["nanofert"],
  );
  assert.deepEqual(publicSupplierSlugs(), ["nanofert"]);
});

// --- badges: partner / verified / pending ---
test("badge kinds resolve correctly for each supplier", () => {
  assert.equal(supplierBadgeKind(getListedSupplierBySlug("nanofert")!), "partner");
  assert.equal(SUPPLIER_BADGE_LABEL.partner, "FertaFind Partner");
  assert.equal(SUPPLIER_BADGE_LABEL.verified, "Public information verified");
  assert.equal(SUPPLIER_BADGE_LABEL.pending, "Information pending verification");
});

// --- Nanofert: FertaFind partner moved into the supplier data model ---
test("Nanofert is a verified FertaFind partner with its official website and a local logo", () => {
  const n = getListedSupplierBySlug("nanofert");
  assert.ok(n, "Nanofert must be listed");
  assert.equal(n!.status, "public");
  assert.equal(n!.relationship, "partner");
  assert.equal(n!.verified, true);
  assert.equal(isPublishable(n!), true);
  assert.equal(n!.website, "https://www.nanofert.com.br/");
  assert.equal(new URL(n!.website!).host, "www.nanofert.com.br");
  assert.ok(n!.products.length > 0, "Nanofert keeps its documented products");
  // Logo is stored locally under /suppliers/ — never hotlinked or invented.
  assert.equal(n!.logo, "/suppliers/nanofert.png");
  assert.ok(n!.logo!.startsWith("/suppliers/"));
});

test("Nanofert detail head includes Organization JSON-LD (it is publishable)", () => {
  const head = supplierDetailRouteHead(getListedSupplierBySlug("nanofert")!);
  const types = (head.scripts ?? [])
    .filter((sc) => sc.type === "application/ld+json")
    .map((sc) => JSON.parse(sc.children)["@type"]);
  assert.ok(types.includes("Organization"));
  assert.ok(types.includes("BreadcrumbList"));
});

// --- Attribution correction: neither company is a supplier surface any more. Their
// --- retained mentioned-entity records are covered in supplier-attribution.test.ts. ---
test("FECOAGRO is no longer any kind of supplier record", () => {
  assert.equal(getPublicSupplierBySlug("fecoagro"), undefined);
  assert.equal(getListedSupplierBySlug("fecoagro"), undefined);
});

test("Inmove is no longer any kind of supplier record", () => {
  assert.equal(getPublicSupplierBySlug("inmove"), undefined);
  assert.equal(getListedSupplierBySlug("inmove"), undefined);
});

test("getListedSupplierBySlug resolves genuine suppliers; unknown slugs do not", () => {
  assert.equal(getListedSupplierBySlug("nanofert")!.slug, "nanofert");
  assert.equal(getListedSupplierBySlug("does-not-exist"), undefined);
});

// --- Global Sourcing Origins (unchanged) ---
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
  for (const o of SOURCING_ORIGINS) {
    assert.ok(!companyNames.has(o.origin.toLowerCase()), `${o.origin} must not be a company`);
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

// --- no leaked financial / private data, no fabricated partnership/endorsement language ---
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

test("no fabricated partnership or endorsement language appears in any supplier record", () => {
  const banned = /official fertafind partner|partnership|\bendorse|preferred partner/i;
  for (const s of SUPPLIERS) {
    for (const value of Object.values(s)) {
      const text = Array.isArray(value) ? value.join(" ") : String(value ?? "");
      assert.ok(!banned.test(text), `${s.id} uses fabricated partnership language: ${text}`);
    }
  }
});

test("the discovery disclaimer disclaims endorsement, partnership, pricing and availability", () => {
  assert.equal(
    SUPPLIER_DISCOVERY_DISCLAIMER,
    "Supplier information is provided for discovery and does not imply endorsement, partnership, pricing, availability, or commercial approval by FertaFind.",
  );
});

// --- filters (pure functions) ---
test("relationship filter: Partner returns only Nanofert and no sourcing origins", () => {
  const f: SupplierDirectoryFilters = { ...NO_FILTERS, relationship: "partner" };
  assert.deepEqual(
    filterSupplierCompanies(listSupplierCompanies(), f).map((s) => s.slug),
    ["nanofert"],
  );
  assert.deepEqual(filterSourcingOrigins(listSourcingOrigins(), f), []);
});

test("verification filter: Verified returns the verified suppliers and no sourcing origins", () => {
  const f: SupplierDirectoryFilters = { ...NO_FILTERS, verification: "verified" };
  assert.deepEqual(
    filterSupplierCompanies(listSupplierCompanies(), f).map((s) => s.slug),
    ["nanofert"],
  );
  assert.deepEqual(filterSourcingOrigins(listSourcingOrigins(), f), []);
});

test("verification filter: Pending returns nothing — no unverified supplier remains", () => {
  const f: SupplierDirectoryFilters = { ...NO_FILTERS, verification: "pending" };
  assert.deepEqual(filterSupplierCompanies(listSupplierCompanies(), f), []);
});

test("supplier-type filter narrows to the matching company", () => {
  const t = (type: SupplierDirectoryFilters["type"]) =>
    filterSupplierCompanies(listSupplierCompanies(), { ...NO_FILTERS, type }).map((s) => s.slug);
  assert.deepEqual(t("manufacturer"), ["nanofert"]);
  // The cooperative/trader records were corrected to non-public mentioned entities.
  assert.deepEqual(t("cooperative"), []);
  assert.deepEqual(t("trader"), []);
});

test("product filter: Urea returns the Urea origins and no supplier company", () => {
  const f: SupplierDirectoryFilters = { ...NO_FILTERS, product: "Urea" };
  assert.deepEqual(filterSupplierCompanies(listSupplierCompanies(), f), []);
  assert.deepEqual(
    filterSourcingOrigins(listSourcingOrigins(), f).map((o) => o.origin),
    ["China", "Poland", "International Trading"],
  );
});

test("origin filter: Brazil returns the Brazilian companies and no sourcing origin", () => {
  const f: SupplierDirectoryFilters = { ...NO_FILTERS, origin: "Brazil" };
  assert.deepEqual(
    filterSupplierCompanies(listSupplierCompanies(), f).map((s) => s.slug),
    ["nanofert"],
  );
  assert.deepEqual(filterSourcingOrigins(listSourcingOrigins(), f), []);
});

test("origin filter: Russia returns the Russia origin and no supplier company", () => {
  const f: SupplierDirectoryFilters = { ...NO_FILTERS, origin: "Russia" };
  assert.deepEqual(filterSupplierCompanies(listSupplierCompanies(), f), []);
  assert.deepEqual(
    filterSourcingOrigins(listSourcingOrigins(), f).map((o) => o.origin),
    ["Russia"],
  );
});

test("directory filter options expose all supplier types, products and origins", () => {
  const opts = directoryFilterOptions();
  assert.deepEqual(opts.supplierTypes, ["manufacturer"]);
  for (const product of ["KCL 60%", "Urea", "SSP", "Liquid nano-fertilizers"]) {
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
test("CollectionPage JSON-LD lists only the verified public suppliers", () => {
  const ld = suppliersCollectionLd() as unknown as { hasPart: Array<{ name: string }> };
  const names = ld.hasPart.map((p) => p.name);
  assert.deepEqual(names, ["Nanofert"]);
  assert.ok(!names.some((n) => /inmove|fecoagro/i.test(n)));
});

test("an unpublishable supplier emits NO Organization JSON-LD but keeps its canonical", () => {
  const draft = completeVerifiedPublic({ slug: "draft-co", status: "draft" });
  const head = supplierDetailRouteHead(draft);
  const types = (head.scripts ?? [])
    .filter((sc) => sc.type === "application/ld+json")
    .map((sc) => JSON.parse(sc.children)["@type"]);
  assert.ok(!types.includes("Organization"));
  assert.ok(types.includes("BreadcrumbList"));
  assert.ok((head.links ?? []).some((l) => l.rel === "canonical"));
});

test("Organization JSON-LD for a verified supplier uses only verified fields (no nulls emitted)", () => {
  const ld = supplierOrganizationLd(getPublicSupplierBySlug("nanofert")!);
  assert.equal(ld["@type"], "Organization");
  assert.equal(ld.name, "Nanofert");
  assert.equal((ld.sameAs as string[])[0], "https://www.nanofert.com.br/");
  assert.equal("email" in ld, false);
  assert.equal("telephone" in ld, false);
});

test("Organization JSON-LD includes a logo only when one is stored locally", () => {
  const withLogo = supplierOrganizationLd(completeVerifiedPublic({ logo: "/suppliers/x.png" }));
  assert.equal(withLogo.logo, "/suppliers/x.png");
  const withoutLogo = supplierOrganizationLd(completeVerifiedPublic({ logo: null }));
  assert.equal("logo" in withoutLogo, false);
});

test("listHiddenSuppliers contains only non-publishable records", () => {
  const hidden = listHiddenSuppliers();
  assert.deepEqual(
    hidden.map((s) => s.slug),
    [],
  );
  for (const s of hidden) assert.equal(isPublishable(s), false);
});
