// Public supplier directory — typed registry, publication rules and selectors.
//
// PUBLICATION SAFETY (enforced here and in suppliers.test.ts):
//   - A supplier renders publicly ONLY when status === "public", verified === true,
//     and every required public field is present. Anything else (draft / inactive /
//     incomplete) is hidden from every public view and excluded from the sitemap.
//   - We never fabricate supplier identities, addresses, coordinates, prices, contact
//     details, certifications or service regions. Unknown fields stay null / empty.
//
// This module is intentionally framework-free (no React / @/ alias / import.meta) so it
// can be unit-tested with `node --test` and imported by content.ts for the sitemap.

import { SITE_URL, SITE_NAME, canonicalUrl, jsonLdScript, breadcrumbLd, pageMeta } from "./seo.ts";

export type SupplierType = "manufacturer" | "distributor" | "cooperative" | "retailer" | "importer";

export type SupplierStatus = "draft" | "public" | "inactive";

export interface Supplier {
  id: string;
  slug: string;
  displayName: string;
  legalName: string | null;
  logo: string | null;
  verified: boolean;
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

// ---------------------------------------------------------------------------
// Registry.
//
// FECOAGRO is a PUBLIC record whose details were verified against its official website
// (public-source verification only — NOT a partnership or endorsement). Inmove remains an
// unverified DRAFT and renders nowhere public (hidden from the directory, sitemap, JSON-LD,
// homepage and filters). Every field we have not independently verified is left null / empty
// on purpose. Deliberately WITHHELD from the repo entirely (per directive): reference prices,
// projections, customer names, internal financial data and any private operational data from
// the FertiExpress material. Country/product rows from that material are NOT turned into named
// supplier companies.
// ---------------------------------------------------------------------------
const FERTIEXPRESS_SOURCE =
  "FertiExpress reference material (unverified) — pending independent verification before any public listing";

function draft(
  id: string,
  displayName: string,
  supplierType: SupplierType,
  country: string,
): Supplier {
  return {
    id,
    slug: id,
    displayName,
    legalName: null,
    logo: null,
    verified: false,
    supplierType,
    country,
    state: null,
    city: null,
    latitude: null,
    longitude: null,
    products: [],
    productGrades: [],
    serviceRegions: [],
    website: null,
    fertilizerPage: null,
    publicEmail: null,
    publicPhone: null,
    description: null,
    source: FERTIEXPRESS_SOURCE,
    lastVerifiedAt: null,
    status: "draft",
  };
}

export const SUPPLIERS: Supplier[] = [
  {
    id: "fecoagro",
    slug: "fecoagro",
    displayName: "FECOAGRO",
    legalName: "FECOAGRO – Federação das Cooperativas Agropecuárias do Estado de Santa Catarina",
    logo: null,
    // Public-source verification only: these details were confirmed against FECOAGRO's
    // official website. This is not a partnership, endorsement, or availability claim.
    verified: true,
    supplierType: "cooperative",
    country: "Brazil",
    state: "Santa Catarina",
    city: "Florianópolis",
    // No verified coordinates are published, so the map marker is intentionally omitted.
    latitude: null,
    longitude: null,
    products: ["Fertilizers", "Organomineral fertilizers", "Pasture fertilizers"],
    productGrades: [],
    serviceRegions: [],
    website: "https://www.fecoagro.coop.br/",
    fertilizerPage: "https://www.fecoagro.coop.br/nossos-fertilizantes/",
    publicEmail: null,
    publicPhone: null,
    description:
      "FECOAGRO is a federation of agricultural cooperatives in Santa Catarina, Brazil, with fertilizer manufacturing and distribution activities.",
    source: "Official FECOAGRO website",
    lastVerifiedAt: "2026-07-23",
    status: "public",
  },
  draft("inmove", "Inmove", "distributor", "Brazil"),
];

// ---------------------------------------------------------------------------
// Publication rules.
// ---------------------------------------------------------------------------

/** Fields that must be non-empty before a record may be shown publicly. */
const REQUIRED_PUBLIC_FIELDS: Array<keyof Supplier> = [
  "displayName",
  "slug",
  "supplierType",
  "country",
  "description",
  "source",
];

/** True only for a verified, complete, explicitly-public record. */
export function isPublishable(s: Supplier): boolean {
  if (s.status !== "public") return false;
  if (!s.verified) return false;
  for (const key of REQUIRED_PUBLIC_FIELDS) {
    const value = s[key];
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
  }
  // A public supplier must offer at least one product.
  if (!Array.isArray(s.products) || s.products.length === 0) return false;
  return true;
}

/** Every supplier safe to render publicly. Currently empty by design. */
export function listPublicSuppliers(): Supplier[] {
  return SUPPLIERS.filter(isPublishable);
}

/** Draft/inactive/incomplete records — for internal counts only, never rendered publicly. */
export function listHiddenSuppliers(): Supplier[] {
  return SUPPLIERS.filter((s) => !isPublishable(s));
}

export function getPublicSupplierBySlug(slug: string): Supplier | undefined {
  return listPublicSuppliers().find((s) => s.slug === slug);
}

/** Slugs of public suppliers only — feeds the sitemap. Empty while none are verified. */
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
};

/** Distinct filter values, derived from PUBLIC suppliers only. */
export function supplierFilterOptions() {
  const pub = listPublicSuppliers();
  const uniq = (arr: string[]) => [...new Set(arr.filter(Boolean))].sort();
  return {
    products: uniq(pub.flatMap((s) => s.products)),
    productGrades: uniq(pub.flatMap((s) => s.productGrades)),
    supplierTypes: uniq(pub.map((s) => s.supplierType)) as SupplierType[],
    countries: uniq(pub.map((s) => s.country)),
    states: uniq(pub.flatMap((s) => (s.state ? [s.state] : []))),
    serviceRegions: uniq(pub.flatMap((s) => s.serviceRegions)),
  };
}

// ---------------------------------------------------------------------------
// SEO surface for the directory and detail pages.
// ---------------------------------------------------------------------------

export const SUPPLIERS_DIRECTORY = {
  path: "/suppliers",
  title: "Fertilizer supplier directory — FertaFind",
  description:
    "A directory of fertilizer suppliers and manufacturers. FertaFind lists a supplier only after its details are independently verified, so the public directory is added to over time.",
  ogTitle: "Fertilizer supplier directory",
  ogDescription:
    "Browse fertilizer suppliers on FertaFind. Suppliers are listed only after their details are verified.",
};

/** CollectionPage structured data listing the public suppliers (empty while none are verified). */
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

/** Route head for a verified public supplier detail page. */
export function supplierDetailRouteHead(s: Supplier) {
  const url = canonicalUrl(supplierPath(s.slug));
  const title = `${s.displayName} — Fertilizer supplier — FertaFind`;
  const description =
    s.description ??
    `${s.displayName} is a fertilizer ${SUPPLIER_TYPE_LABEL[s.supplierType].toLowerCase()} listed on FertaFind.`;
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
    scripts: [
      jsonLdScript(supplierOrganizationLd(s)),
      jsonLdScript(
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Suppliers", path: "/suppliers" },
          { name: s.displayName, path: supplierPath(s.slug) },
        ]),
      ),
    ],
  };
}
