// Single source of truth for FertaFind's public SEO surface.
//
// Approved decisions (see docs/FertaFind_AI_SEO_Guide.pdf):
//   - Canonical host: https://www.fertafind.com (www, https).
//   - URL convention: no trailing slash except the homepage.
//   - Official positioning: "FertaFind helps farmers compare fertilizer quotes and
//     receive an AI-assisted, cost-based recommendation based on their crop, field,
//     location, and quote information."
//
// This module is intentionally free of framework, `@/` alias and `import.meta`
// imports so it can be unit-tested directly with `node --test`.

export const SITE_URL = "https://www.fertafind.com";
export const SITE_NAME = "FertaFind";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/fertafind-logo-transparent.png`;

const POSITIONING =
  "FertaFind helps farmers compare fertilizer quotes and receive an AI-assisted, cost-based recommendation based on their crop, field, location, and quote information.";

/** Absolute canonical URL for a route path. Homepage keeps its trailing slash; every other path drops it. */
export function canonicalUrl(path: string): string {
  if (!path || path === "/") return `${SITE_URL}/`;
  const clean = "/" + path.replace(/^\/+/, "").replace(/\/+$/, "");
  return `${SITE_URL}${clean}`;
}

// /about and /suppliers are not standalone indexable pages: origin/main redirects
// them into homepage sections (/#how and /#partners), so they are intentionally
// excluded from the SEO registry, the sitemap and structured data.
export type PageKey = "home" | "analyze" | "terms";

export interface PageSeo {
  path: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

export const PAGES: Record<PageKey, PageSeo> = {
  home: {
    path: "/",
    title: "FertaFind — Compare fertilizer quotes with AI",
    description: POSITIONING,
    ogTitle: "FertaFind — Compare fertilizer quotes with AI",
    ogDescription:
      "Compare fertilizer quotes and get an AI-assisted, cost-based recommendation based on your crop, field, location, and quote information.",
  },
  analyze: {
    path: "/analyze",
    title: "Analyze your fertilizer quotes — FertaFind",
    description:
      "Upload your fertilizer quotes and get an AI-assisted, cost-based recommendation using your crop, field, location, and quote details.",
    ogTitle: "Analyze your fertilizer quotes",
    ogDescription:
      "Upload fertilizer quotes for an AI-assisted, cost-based comparison and recommendation.",
  },
  terms: {
    path: "/terms",
    title: "Terms of use — FertaFind",
    description:
      "FertaFind's terms covering partner recommendations, fertilizer analysis, supplier purchases, delivery responsibilities, and use of farm data.",
    ogTitle: "FertaFind terms of use",
    ogDescription:
      "The terms covering FertaFind's partner recommendations, analysis, and supplier purchases.",
  },
};

export type MetaEntry =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string };

export interface LinkEntry {
  rel: string;
  href: string;
  type?: string;
}

/**
 * Page-specific head metadata. Every public page gets its own title, description,
 * Open Graph (title/description/url) and Twitter tags plus a single canonical link,
 * so inner pages never inherit the homepage's social copy.
 */
export function pageMeta(key: PageKey): {
  meta: MetaEntry[];
  links: LinkEntry[];
} {
  const page = PAGES[key];
  const url = canonicalUrl(page.path);
  return {
    meta: [
      { title: page.title },
      { name: "description", content: page.description },
      { property: "og:title", content: page.ogTitle },
      { property: "og:description", content: page.ogDescription },
      { property: "og:url", content: url },
      { name: "twitter:title", content: page.ogTitle },
      { name: "twitter:description", content: page.ogDescription },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

/** Wrap a JSON-LD object as a route `scripts` descriptor rendered server-side. */
export function jsonLdScript(data: object): { type: string; children: string } {
  return { type: "application/ld+json", children: JSON.stringify(data) };
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: DEFAULT_OG_IMAGE,
    description: POSITIONING,
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description:
      "Compare fertilizer quotes and get an AI-assisted, cost-based fertilizer recommendation.",
    inLanguage: "en",
  };
}

export function breadcrumbLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export function faqLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
