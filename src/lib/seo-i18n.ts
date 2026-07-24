// Multilingual SEO: localized titles/descriptions/Open Graph, per-locale canonicals and
// reciprocal hreflang (including x-default).
//
// Sits above seo.ts and i18n.ts so neither has to know about the other.

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  hreflangLinks,
  localePath,
  type Locale,
} from "./i18n.ts";
import {
  DEFAULT_OG_IMAGE,
  PAGES,
  SITE_URL,
  type LinkEntry,
  type MetaEntry,
  type PageKey,
} from "./seo.ts";

export interface LocalizedPageSeo {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

/** Curated Brazilian Portuguese metadata. Brand and product names stay verbatim. */
const PT_BR_PAGES: Record<PageKey, LocalizedPageSeo> = {
  home: {
    title: "FertaFind — Compare cotações de fertilizantes com IA",
    description:
      "Compare cotações de fertilizantes e receba uma recomendação assistida por IA, baseada em custo, considerando sua cultura, talhão, localização e as informações da cotação.",
    ogTitle: "FertaFind — Compare cotações de fertilizantes com IA",
    ogDescription:
      "Compare cotações de fertilizantes e receba uma recomendação assistida por IA e baseada em custo.",
  },
  analyze: {
    title: "Analise suas cotações de fertilizantes — FertaFind",
    description:
      "Envie suas cotações de fertilizantes e receba uma recomendação assistida por IA e baseada em custo, usando sua cultura, talhão, localização e os detalhes da cotação.",
    ogTitle: "Analise suas cotações de fertilizantes",
    ogDescription:
      "Envie cotações de fertilizantes para uma comparação e recomendação baseada em custo.",
  },
  terms: {
    title: "Termos de uso — FertaFind",
    description:
      "Os termos da FertaFind sobre recomendações de parceiros, análise de fertilizantes, compras de fornecedores, responsabilidades de entrega e uso dos dados da propriedade.",
    ogTitle: "Termos de uso da FertaFind",
    ogDescription:
      "Os termos que regem as recomendações, análises e compras de fornecedores da FertaFind.",
  },
  resources: {
    title: "Materiais sobre compra de fertilizantes — FertaFind",
    description:
      "Guias e comparações que explicam como ler uma cotação de fertilizante, comparar formulações pelo custo por unidade de nutriente e considerar o frete.",
    ogTitle: "Materiais sobre compra de fertilizantes",
    ogDescription: "Guias sobre comparação de cotações, custo por unidade de nutriente e frete.",
  },
  suppliers: {
    title: "Diretório de fornecedores de fertilizantes — FertaFind",
    description:
      "Um diretório de fornecedores de fertilizantes na FertaFind. Cada fornecedor é identificado como verificado de forma independente, informado pelo próprio fornecedor ou pendente de verificação.",
    ogTitle: "Diretório de fornecedores de fertilizantes",
    ogDescription:
      "Conheça os fornecedores de fertilizantes na FertaFind, cada um com seu nível de verificação.",
  },
};

const LOCALIZED_PAGES: Record<Locale, Record<PageKey, LocalizedPageSeo>> = {
  en: Object.fromEntries(
    (Object.keys(PAGES) as PageKey[]).map((key) => [
      key,
      {
        title: PAGES[key].title,
        description: PAGES[key].description,
        ogTitle: PAGES[key].ogTitle,
        ogDescription: PAGES[key].ogDescription,
      },
    ]),
  ) as Record<PageKey, LocalizedPageSeo>,
  "pt-BR": PT_BR_PAGES,
};

/** Localized metadata for a core page; unknown locales fall back to English. */
export function localizedPageMeta(locale: Locale, key: PageKey): LocalizedPageSeo {
  return (LOCALIZED_PAGES[locale] ?? LOCALIZED_PAGES[DEFAULT_LOCALE])[key];
}

/**
 * The complete localized head for a page: title, description, Open Graph (including
 * og:locale and the alternates), Twitter tags, a canonical pointing at THIS locale's URL,
 * and reciprocal hreflang links plus x-default.
 */
export function localizedHead(
  locale: Locale,
  key: PageKey,
  path: string,
): { meta: MetaEntry[]; links: LinkEntry[] } {
  const page = localizedPageMeta(locale, key);
  const url = `${SITE_URL}${localePath(locale, path)}`;

  const meta: MetaEntry[] = [
    { title: page.title },
    { name: "description", content: page.description },
    { property: "og:title", content: page.ogTitle },
    { property: "og:description", content: page.ogDescription },
    { property: "og:url", content: url },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: locale },
    { property: "og:image", content: DEFAULT_OG_IMAGE },
    { name: "twitter:title", content: page.ogTitle },
    { name: "twitter:description", content: page.ogDescription },
  ];

  // Every locale advertises the same alternate set, so the links are truly reciprocal.
  for (const other of SUPPORTED_LOCALES) {
    if (other === locale) continue;
    meta.push({ property: "og:locale:alternate", content: other });
  }

  const links: LinkEntry[] = [
    { rel: "canonical", href: url },
    ...hreflangLinks(path).map((l) => ({
      rel: "alternate",
      href: l.href,
      hrefLang: l.hreflang,
    })),
  ];

  return { meta, links };
}
