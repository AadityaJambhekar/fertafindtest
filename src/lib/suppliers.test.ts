import assert from "node:assert/strict";
import test from "node:test";
import {
  SUPPLIERS,
  type Supplier,
  isPublishable,
  listPublicSuppliers,
  listHiddenSuppliers,
  getPublicSupplierBySlug,
  publicSupplierSlugs,
  suppliersCollectionLd,
  supplierOrganizationLd,
} from "./suppliers.ts";

function completeVerifiedPublic(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: "acme",
    slug: "acme-fertilizer",
    displayName: "Acme Fertilizer",
    legalName: "Acme Fertilizer LLC",
    logo: null,
    verified: true,
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

// --- publication rules ---
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

// --- current registry: FECOAGRO public, Inmove hidden ---
test("the registry exposes exactly one public supplier (FECOAGRO)", () => {
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

test("Inmove remains an unverified, hidden draft", () => {
  const inmove = SUPPLIERS.find((s) => s.id === "inmove")!;
  assert.equal(inmove.status, "draft");
  assert.equal(inmove.verified, false);
  assert.equal(isPublishable(inmove), false);
  assert.equal(getPublicSupplierBySlug("inmove"), undefined);
  assert.ok(!publicSupplierSlugs().includes("inmove"));
  assert.deepEqual(
    listHiddenSuppliers().map((s) => s.id),
    ["inmove"],
  );
});

test("hidden draft records never invent addresses, coordinates, prices or contacts", () => {
  for (const s of listHiddenSuppliers()) {
    assert.equal(s.latitude, null);
    assert.equal(s.longitude, null);
    assert.equal(s.city, null);
    assert.equal(s.state, null);
    assert.equal(s.website, null);
    assert.equal(s.fertilizerPage, null);
    assert.equal(s.publicEmail, null);
    assert.equal(s.publicPhone, null);
    assert.equal(s.description, null);
    assert.deepEqual(s.products, []);
    assert.deepEqual(s.serviceRegions, []);
  }
});

test("no withheld financial/private data leaks into any supplier field", () => {
  const banned = /\$|\bR\$|revenue|projection|forecast|margin|customer\b/i;
  for (const s of SUPPLIERS) {
    for (const value of Object.values(s)) {
      const text = Array.isArray(value) ? value.join(" ") : String(value ?? "");
      assert.ok(!banned.test(text), `${s.id} field leaks withheld data: ${text}`);
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

// --- JSON-LD: only public, verified fields; drafts excluded ---
test("CollectionPage JSON-LD lists only the public supplier (drafts excluded)", () => {
  const ld = suppliersCollectionLd() as unknown as { hasPart: Array<{ name: string }> };
  const names = ld.hasPart.map((p) => p.name);
  assert.deepEqual(names, ["FECOAGRO"]);
  assert.ok(!names.some((n) => /inmove/i.test(n)));
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
