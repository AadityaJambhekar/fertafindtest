// Public supplier directory + global sourcing origins — typed registry, publication
// rules and selectors.
//
// PUBLICATION SAFETY (enforced here and in suppliers.test.ts):
//   - A supplier is PUBLISHABLE (Organization JSON-LD + sitemap) ONLY when
//     status === "public", verified === true, and every required public field is
//     present. FECOAGRO is the only publishable record today.
//   - A supplier may still be LISTED on the directory when status === "public" even
//     if unverified (e.g. Inmove) — but it renders with an explicit "pending
//     verification" caution, never emits Organization JSON-LD, and never enters the
//     sitemap.
//   - We never fabricate supplier identities, addresses, coordinates, prices, contact
//     details, certifications or service regions. Unknown fields stay null / empty.
//   - Global sourcing origins are market-discovery reference rows (origin + product).
//     They are NOT supplier companies: no detail pages, no verification badges, no
//     Organization JSON-LD, and no prices / availability / volumes / financial data.
//
// This module is intentionally framework-free (no React / @/ alias / import.meta) so it
// can be unit-tested with `node --test` and imported by content.ts for the sitemap.

import { SITE_URL, SITE_NAME, canonicalUrl, jsonLdScript, breadcrumbLd, pageMeta } from "./seo.ts";

export type SupplierType =
  "manufacturer" | "distributor" | "cooperative" | "retailer" | "importer" | "trader";

export type SupplierStatus = "draft" | "public" | "inactive";

/**
 * How much of a listed company's information we have independently confirmed.
 *   - public-source-verified: checked against the company's own public website.
 *   - owner-provided:         supplied by the company itself in material it gave FertaFind.
 *   - source-listed-unverified: named in third-party material, nothing confirmed.
 */
export type VerificationStatus =
  "public-source-verified" | "owner-provided" | "source-listed-unverified";

/** A company's relationship to FertaFind. "partner" is a declared FertaFind partner,
 *  "supplier" is a direct supplying company, and every other listed company is a plain
 *  directory listing. */
export type SupplierRelationship = "partner" | "supplier" | "listed";

export interface Supplier {
  id: string;
  slug: string;
  displayName: string;
  legalName: string | null;
  /** Local logo path under /public/suppliers/ (never a hotlinked or invented remote URL). */
  logo: string | null;
  verified: boolean;
  verificationStatus: VerificationStatus;
  relationship: SupplierRelationship;
  supplierType: SupplierType;
  country: string;
  state: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  products: string[];
  productGrades: string[];
  serviceRegions: string[];
  website: string | null;
  /** A verified public page for the supplier's fertilizer products, if one exists. */
  fertilizerPage: string | null;
  /** An approved, publishable contact email only — never a scraped or private address. */
  publicEmail: string | null;
  /** An approved, publishable phone only. */
  publicPhone: string | null;
  description: string | null;
  /** Where this record came from (for internal provenance; not a marketing claim). */
  source: string;
  lastVerifiedAt: string | null;
  status: SupplierStatus;
}

/** A market-discovery sourcing origin — an origin/country and the product sourced. */
export interface SourcingOrigin {
  origin: string;
  product: string;
}

/**
 * A company NAMED INSIDE a source document (deck, catalogue, PDF, quote, presentation).
 *
 * A mentioned entity is NOT a supplier. It has no slug, no route, no card, no sitemap entry
 * and no structured data, and it can never be promoted to a supplier without an explicit
 * human approval step. It exists only to preserve provenance — so that removing an incorrect
 * supplier attribution never destroys the underlying source record.
 */
export interface MentionedEntity {
  id: string;
  name: string;
  /** The supplier whose document named this company (the document's owner/uploader). */
  sourceSupplierId: string | null;
  sourceDocumentId: string;
  extractionOrigin: "supplier-document";
  extractionConfidence: "low" | "medium" | "high";
  /** Verbatim context from the source document, for a human reviewer. */
  sourceContext: string | null;
  /** The top-level supplier name this record was incorrectly published under, if any. */
  previousSupplierName: string | null;
  reviewReason: string;
  /** A CANDIDATE attribution only — never applied automatically. */
  possibleSupplier: string | null;
  /** Set only by an explicit human approval; null until then. */
  confirmedSupplierId: string | null;
  reviewState: "needs_manual_review" | "approved" | "rejected";
  requiresReview: boolean;
  reviewedAt: string | null;
  reviewedBy: string | null;
  /** Always false. A mentioned entity is never publicly visible. */
  public: false;
  /** Always false. A mentioned entity is never indexable. */
  indexable: false;
}

// ---------------------------------------------------------------------------
// Registry.
//
// ATTRIBUTION CORRECTION (2026-07-23): "Inmove" and "FECOAGRO" were named INSIDE the
// FertiExpress presentation as companies FertiExpress itself sources from. They were never
// FertaFind suppliers and must not exist as top-level supplier records. They are retained
// below as non-public MENTIONED_ENTITIES so the source record survives the correction.
//
// Deliberately WITHHELD from the repo entirely (per directive): reference prices,
// projections, customer names, internal financial data and any private operational data
// from the FertiExpress material.
//
// NOTE: FertiExpress Group is NOT yet a supplier record. The owner-provided presentation is
// not present in this repository, so there is no source for its logo, website, country or
// products. Creating the record from assumed values would fabricate supplier data, which the
// rules above forbid. It must be added from the deck under the approval gate.
// ---------------------------------------------------------------------------

/** Identifier for the owner-provided FertiExpress presentation these mentions came from. */
export const FERTIEXPRESS_DOCUMENT_ID = "fertiexpress-presentation";

export const SUPPLIERS: Supplier[] = [
  {
    id: "fertiexpress-group",
    slug: "fertiexpress-group",
    displayName: "FertiExpress Group",
    // The deck shows the wordmark and a registration number but no full legal entity name.
    legalName: null,
    // Brand mark extracted from page 1 of the owner-provided presentation, stored locally.
    logo: "/suppliers/fertiexpress-group.png",
    // "Verified" here means the company itself supplied this material — NOT independently
    // confirmed against a public source, which the badge states plainly.
    verified: true,
    verificationStatus: "owner-provided",
    relationship: "supplier",
    supplierType: "importer",
    country: "Brazil",
    // The presentation names the operating base only as a city; the state is never stated.
    state: null,
    city: "Campinas",
    latitude: null,
    longitude: null,
    products: ["Potassium chloride (KCL)", "Urea", "Ammonium sulphate"],
    productGrades: ["KCL 60%", "Urea 46%"],
    serviceRegions: ["Brazil"],
    // No website, e-mail or phone appears anywhere in the presentation, so none is invented.
    website: null,
    fertilizerPage: null,
    publicEmail: null,
    publicPhone: null,
    description:
      "FertiExpress Group imports and distributes fertilizers for Brazilian agriculture, connecting international and national suppliers to growers across the country. Confirm grades, availability and final pricing before purchase.",
    source: "Owner-provided FertiExpress Group supplier presentation",
    lastVerifiedAt: "2026-07-23",
    status: "public",
  },
  {
    id: "nanofert",
    slug: "nanofert",
    displayName: "Nanofert",
    legalName: null,
    // Existing Nanofert partner logo, preserved and stored locally under /public/suppliers/.
    logo: "/suppliers/nanofert.png",
    // A declared FertaFind partner; product details are confirmed from its official website.
    verified: true,
    verificationStatus: "public-source-verified",
    relationship: "partner",
    supplierType: "manufacturer",
    country: "Brazil",
    state: null,
    city: null,
    latitude: null,
    longitude: null,
    products: ["Liquid nano-fertilizers"],
    productGrades: [],
    serviceRegions: [],
    website: "https://www.nanofert.com.br/",
    fertilizerPage: null,
    publicEmail: null,
    publicPhone: null,
    description:
      "Nanofert provides liquid nano-fertilizer products with documented crop and lifecycle programs. Confirm rates, availability and final pricing before purchase.",
    source: "Official Nanofert website",
    lastVerifiedAt: "2026-07-23",
    status: "public",
  },
];

/**
 * Companies named inside the FertiExpress presentation. NON-PUBLIC by construction.
 *
 * Their original source data is preserved here rather than deleted, but the incorrect
 * "FertaFind supplier" attribution has been removed. Neither is reassigned to FertiExpress:
 * the source does not prove that attribution, so each stays in `needs_manual_review`.
 */
export const MENTIONED_ENTITIES: MentionedEntity[] = [
  {
    id: "inmove",
    name: "Inmove",
    sourceSupplierId: null,
    sourceDocumentId: FERTIEXPRESS_DOCUMENT_ID,
    extractionOrigin: "supplier-document",
    extractionConfidence: "low",
    sourceContext:
      "Named in the FertiExpress presentation as a national trading company FertiExpress sources from.",
    previousSupplierName: "Inmove",
    reviewReason:
      "Published as a top-level FertaFind supplier from a company name found inside the FertiExpress presentation. No direct FertaFind supplier relationship was ever established.",
    possibleSupplier: "FertiExpress Group",
    confirmedSupplierId: null,
    reviewState: "needs_manual_review",
    requiresReview: true,
    reviewedAt: null,
    reviewedBy: null,
    public: false,
    indexable: false,
  },
  {
    id: "fecoagro",
    name: "FECOAGRO",
    sourceSupplierId: null,
    sourceDocumentId: FERTIEXPRESS_DOCUMENT_ID,
    extractionOrigin: "supplier-document",
    extractionConfidence: "low",
    sourceContext:
      "Named in the FertiExpress presentation as a cooperative federation FertiExpress sources from. Company details were later corroborated against fecoagro.coop.br, but that corroborates the company's existence — not any FertaFind relationship.",
    previousSupplierName: "FECOAGRO",
    reviewReason:
      "Published as a top-level FertaFind supplier from a company name found inside the FertiExpress presentation. Public-source verification of company details is not evidence of a FertaFind supplier relationship.",
    possibleSupplier: "FertiExpress Group",
    confirmedSupplierId: null,
    reviewState: "needs_manual_review",
    requiresReview: true,
    reviewedAt: null,
    reviewedBy: null,
    public: false,
    indexable: false,
  },
];

/** Every retained mentioned entity. Never rendered publicly. */
export function listMentionedEntities(): MentionedEntity[] {
  return MENTIONED_ENTITIES;
}

export function getMentionedEntityById(id: string): MentionedEntity | undefined {
  return MENTIONED_ENTITIES.find((m) => m.id === id);
}

/** Mentioned entities still awaiting a human attribution decision. */
export function listEntitiesNeedingReview(): MentionedEntity[] {
  return MENTIONED_ENTITIES.filter((m) => m.reviewState === "needs_manual_review");
}

// ---------------------------------------------------------------------------
// Global Sourcing Origins — market-discovery reference only. No prices, availability,
// volumes, import dates, forecasts or financial data are stored or shown.
// ---------------------------------------------------------------------------
export const SOURCING_ORIGINS: SourcingOrigin[] = [
  { origin: "Russia", product: "KCL 60%" },
  { origin: "Germany", product: "KCL 60%" },
  { origin: "China", product: "Urea" },
  { origin: "Poland", product: "Urea" },
  { origin: "International Trading", product: "Urea" },
  { origin: "Egypt", product: "SSP" },
];

export function listSourcingOrigins(): SourcingOrigin[] {
  return SOURCING_ORIGINS;
}

export const SOURCING_DISCLAIMER =
  "Global sourcing origins are shown for market discovery. Individual suppliers, availability, pricing, and commercial relationships must be independently confirmed.";

export const SUPPLIER_DISCOVERY_DISCLAIMER =
  "Supplier information is provided for discovery and does not imply endorsement, partnership, pricing, availability, or commercial approval by FertaFind.";

// ---------------------------------------------------------------------------
// Publication rules.
// ---------------------------------------------------------------------------

/** Fields that must be non-empty before a record may be shown as VERIFIED / publishable. */
const REQUIRED_PUBLIC_FIELDS: Array<keyof Supplier> = [
  "displayName",
  "slug",
  "supplierType",
  "country",
  "description",
  "source",
];

/**
 * A record carrying document-extraction provenance is a mentioned entity, never a supplier —
 * even if it has been given supplier-shaped fields. This is the structural backstop that stops
 * a company name found inside a document from ever reaching a public surface.
 */
function hasExtractionProvenance(record: unknown): boolean {
  if (typeof record !== "object" || record === null) return false;
  if ("extractionOrigin" in record) return true;
  return (record as { public?: unknown }).public === false;
}

/** True only for a verified, complete, explicitly-public record (Organization JSON-LD + sitemap). */
export function isPublishable(s: Supplier): boolean {
  if (hasExtractionProvenance(s)) return false;
  if (s.status !== "public") return false;
  if (!s.verified) return false;
  for (const key of REQUIRED_PUBLIC_FIELDS) {
    const value = s[key];
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
  }
  // A verified supplier must offer at least one product.
  if (!Array.isArray(s.products) || s.products.length === 0) return false;
  return true;
}

/** Verified, complete suppliers — the only records that emit Organization JSON-LD / enter the sitemap. */
export function listPublicSuppliers(): Supplier[] {
  return SUPPLIERS.filter(isPublishable);
}

/** Every company listed on the directory (verified or source-listed-unverified). */
export function listSupplierCompanies(): Supplier[] {
  return SUPPLIERS.filter((s) => s.status === "public" && !hasExtractionProvenance(s));
}

/** Active (directory-listed) supplier records. */
export function activeSupplierCount(): number {
  return listSupplierCompanies().length;
}

/** Publishable supplier records (Organization JSON-LD + sitemap). */
export function publicSupplierCount(): number {
  return listPublicSuppliers().length;
}

/** Records that are not publishable (unverified/draft/inactive) — never rendered as verified. */
export function listHiddenSuppliers(): Supplier[] {
  return SUPPLIERS.filter((s) => !isPublishable(s));
}

/** A verified, publishable supplier by slug (FECOAGRO today). */
export function getPublicSupplierBySlug(slug: string): Supplier | undefined {
  return listPublicSuppliers().find((s) => s.slug === slug);
}

/** Any listed company by slug — verified or unverified — for its detail page. */
export function getListedSupplierBySlug(slug: string): Supplier | undefined {
  return listSupplierCompanies().find((s) => s.slug === slug);
}

/** Slugs of verified suppliers only — feeds the sitemap. */
export function publicSupplierSlugs(): string[] {
  return listPublicSuppliers().map((s) => s.slug);
}

export function supplierPath(slug: string): string {
  return `/suppliers/${slug}`;
}

export const SUPPLIER_TYPE_LABEL: Record<SupplierType, string> = {
  manufacturer: "Manufacturer",
  distributor: "Distributor",
  cooperative: "Cooperative",
  retailer: "Retailer",
  importer: "Importer",
  trader: "Trading company",
};

export const VERIFICATION_BADGE: Record<VerificationStatus, string> = {
  "public-source-verified": "Public information verified",
  "owner-provided": "Information provided by the supplier",
  "source-listed-unverified": "Information pending verification",
};

/** The single badge kind shown for a company card: a partner badge wins, otherwise the
 *  verification level (verified vs pending). */
export type SupplierBadgeKind = "partner" | "supplier" | "verified" | "pending";

export function supplierBadgeKind(s: Supplier): SupplierBadgeKind {
  if (s.relationship === "partner") return "partner";
  if (s.relationship === "supplier") return "supplier";
  return s.verificationStatus === "public-source-verified" ? "verified" : "pending";
}

export const SUPPLIER_BADGE_LABEL: Record<SupplierBadgeKind, string> = {
  partner: "FertaFind Partner",
  supplier: "FertaFind Supplier",
  verified: "Public information verified",
  pending: "Information pending verification",
};

// ---------------------------------------------------------------------------
// Directory filters (pure functions — unit-tested, driven by the UI).
// ---------------------------------------------------------------------------

export interface SupplierDirectoryFilters {
  /** "" = any, "partner" = declared FertaFind partner, "supplier" = direct supplier. */
  relationship: "" | "partner" | "supplier";
  /** "" = any, else the verification level to narrow to. */
  verification: "" | "verified" | "provided" | "pending";
  type: "" | SupplierType;
  product: string;
  /** Country (for companies) or sourcing origin. */
  origin: string;
}

export function filterSupplierCompanies(
  companies: Supplier[],
  f: SupplierDirectoryFilters,
): Supplier[] {
  return companies.filter((s) => {
    if (f.relationship !== "" && s.relationship !== f.relationship) return false;
    if (f.verification === "verified" && s.verificationStatus !== "public-source-verified")
      return false;
    if (f.verification === "provided" && s.verificationStatus !== "owner-provided") return false;
    if (f.verification === "pending" && s.verificationStatus !== "source-listed-unverified")
      return false;
    if (f.type && s.supplierType !== f.type) return false;
    if (f.product && !s.products.includes(f.product)) return false;
    if (f.origin && s.country !== f.origin) return false;
    return true;
  });
}

export function filterSourcingOrigins(
  origins: SourcingOrigin[],
  f: SupplierDirectoryFilters,
): SourcingOrigin[] {
  // Relationship, verification and supplier-type are company-only concepts; when any is set the
  // user is narrowing to supplier companies, so no sourcing origins apply.
  if (f.relationship !== "" || f.verification !== "" || f.type !== "") return [];
  return origins.filter((o) => {
    if (f.product && o.product !== f.product) return false;
    if (f.origin && o.origin !== f.origin) return false;
    return true;
  });
}

/** Distinct filter values across supplier companies AND sourcing origins. */
export function directoryFilterOptions() {
  const companies = listSupplierCompanies();
  const uniq = (arr: string[]) => [...new Set(arr.filter(Boolean))].sort();
  return {
    supplierTypes: uniq(companies.map((s) => s.supplierType)) as SupplierType[],
    products: uniq(companies.flatMap((s) => s.products)),
    origins: uniq(companies.map((s) => s.country)),
  };
}

// ---------------------------------------------------------------------------
// SEO surface for the directory and detail pages.
// ---------------------------------------------------------------------------

export const SUPPLIERS_DIRECTORY = {
  path: "/suppliers",
  title: "Fertilizer supplier directory — FertaFind",
  description:
    "A directory of fertilizer suppliers on FertaFind. Each supplier is clearly marked as independently verified, supplier-provided, or pending verification.",
  ogTitle: "Fertilizer supplier directory",
  ogDescription:
    "Browse fertilizer suppliers on FertaFind. Each entry is clearly marked as independently verified, supplier-provided, or pending verification.",
};

/** CollectionPage structured data listing the VERIFIED public suppliers only. */
export function suppliersCollectionLd() {
  const url = canonicalUrl(SUPPLIERS_DIRECTORY.path);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: SUPPLIERS_DIRECTORY.ogTitle,
    description: SUPPLIERS_DIRECTORY.description,
    url,
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: `${SITE_URL}/` },
    hasPart: listPublicSuppliers().map((s) => ({
      "@type": "Organization",
      name: s.displayName,
      url: canonicalUrl(supplierPath(s.slug)),
    })),
  };
}

export function suppliersRouteHead() {
  return {
    ...pageMeta("suppliers"),
    scripts: [
      jsonLdScript(suppliersCollectionLd()),
      jsonLdScript(
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Suppliers", path: "/suppliers" },
        ]),
      ),
    ],
  };
}

/** Organization JSON-LD for a verified public supplier only (no fabricated fields). */
export function supplierOrganizationLd(s: Supplier) {
  const url = canonicalUrl(supplierPath(s.slug));
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: s.displayName,
    url,
  };
  if (s.legalName) ld.legalName = s.legalName;
  if (s.logo) ld.logo = s.logo;
  if (s.website) ld.sameAs = [s.website];
  if (s.description) ld.description = s.description;
  const address: Record<string, string> = {};
  if (s.city) address.addressLocality = s.city;
  if (s.state) address.addressRegion = s.state;
  if (s.country) address.addressCountry = s.country;
  if (Object.keys(address).length > 0) ld.address = { "@type": "PostalAddress", ...address };
  if (s.publicEmail) ld.email = s.publicEmail;
  if (s.publicPhone) ld.telephone = s.publicPhone;
  return ld;
}

/**
 * Route head for a listed supplier detail page. Organization JSON-LD is emitted ONLY for a
 * verified, publishable supplier; an unverified (source-listed) supplier keeps its canonical
 * link, metadata and breadcrumb but never emits Organization JSON-LD.
 */
export function supplierDetailRouteHead(s: Supplier) {
  const url = canonicalUrl(supplierPath(s.slug));
  const title = `${s.displayName} — Fertilizer supplier — FertaFind`;
  const description =
    s.description ??
    `${s.displayName} is a fertilizer ${SUPPLIER_TYPE_LABEL[s.supplierType].toLowerCase()} listed on FertaFind.`;
  const breadcrumb = jsonLdScript(
    breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "Suppliers", path: "/suppliers" },
      { name: s.displayName, path: supplierPath(s.slug) },
    ]),
  );
  const scripts = isPublishable(s)
    ? [jsonLdScript(supplierOrganizationLd(s)), breadcrumb]
    : [breadcrumb];
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: s.displayName },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: s.displayName },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts,
  };
}
