// Curated UI dictionaries for the public site.
//
// Hand-written translations only — never runtime machine translation. The parity test in
// dictionaries.test.ts fails the build if English gains a key that a locale has not
// translated, so a half-translated page can never ship.
//
// NEVER translated (they are source-document facts or brand identity):
//   company names (FertaFind, FertiExpress Group, Nanofert), product and model names,
//   NPK grades, numeric values, currency codes and amounts, units of measure.
//
// Framework-free so it can be unit-tested with `node --test`.

import { DEFAULT_LOCALE, type Locale } from "./i18n.ts";

const en = {
  nav: {
    howItWorks: "How it works",
    whyFertafind: "Why FertaFind",
    suppliers: "Suppliers",
    faq: "FAQ",
    analyzeQuotes: "Analyze quotes",
    resources: "Resources",
    terms: "Terms",
    language: "Language",
  },
  common: {
    back: "Back",
    next: "Next",
    continue: "Continue",
    submit: "Submit",
    cancel: "Cancel",
    clearFilters: "Clear filters",
    loading: "Loading…",
    optional: "Optional",
    required: "Required",
    learnMore: "Learn more",
    visitWebsite: "Visit website",
    seeAll: "See all",
  },
  home: {
    heroTitle: "Compare fertilizer quotes on one clear, cost-based footing",
    heroSubtitle:
      "Upload the quotes you already have. FertaFind puts grade, pack size and delivery on the same basis so you can compare them fairly.",
    heroCta: "Analyze your quotes",
    workingWith: "Working with Nanofert",
    howTitle: "How it works",
    whyTitle: "Why FertaFind",
    faqTitle: "Frequently asked questions",
    supplierNetworkTitle: "Our Supplier Network",
  },
  analyze: {
    title: "Analyze your quotes",
    stepLocation: "Where is your farm?",
    stepCrop: "What are you growing?",
    stepUpload: "Upload quotes",
    stepReview: "Review and submit",
    locationLabel: "Farm location",
    locationPlaceholder: "Town, region or address",
    locationHelp: "We use this for weather and delivery context only.",
    useMap: "Pick on the map",
    cropLabel: "Crop",
    growthStageLabel: "Growth stage",
    fieldSizeLabel: "Field size",
    organicLabel: "Organic certification",
    goalTitle: "Your goal",
    goalSubtitle: "Choose how to rank suitable products.",
    goalYield: "Improve yield",
    goalYieldHelp: "Prioritize nutrient and field fit",
    goalCost: "Reduce costs",
    goalCostHelp: "Prioritize landed nutrient cost",
    goalBalanced: "Balance both",
    goalBalancedHelp: "Balance value and crop fit",
    uploadTitle: "Add your quotes",
    uploadHelp: "Add photos, documents or copied quote text.",
    uploadCta: "Choose files",
    analyzing: "Analyzing your quotes…",
    agreeToTerms: "I agree to the Terms",
  },
  results: {
    title: "Your quote comparison",
    recommended: "Recommended",
    lowestCost: "Lowest cost",
    sortBy: "Sort by",
    noResults: "No results to show yet.",
    disclaimer:
      "This comparison is guidance only. Confirm grades, rates, availability and final pricing with the supplier before purchase.",
  },
  suppliers: {
    title: "Our Supplier Network",
    subtitle: "Fertilizer suppliers listed on FertaFind.",
    eyebrow: "Supplier network",
    description:
      "A directory of fertilizer suppliers on FertaFind. Each supplier is clearly marked as independently verified, supplier-provided, or pending verification.",
    companiesHeading: "Supplier companies",
    companyOne: "company",
    companyMany: "companies",
    viewSupplier: "View supplier",
    ctaTitle: "Already have quotes from a supplier?",
    ctaBody:
      "FertaFind puts every fertilizer quote on one clear, cost-based footing — grade, pack size and delivery — so you can compare them fairly.",
    filterAll: "All",
    filterVerified: "Verified",
    filterProvided: "Supplier-provided",
    filterPending: "Pending verification",
    filterRelationship: "Relationship",
    filterVerification: "Verification",
    filterType: "Supplier type",
    filterProduct: "Product",
    filterOrigin: "Origin",
    products: "Products",
    grades: "Grades",
    servesRegions: "Serves",
    noneMatch: "No suppliers match the current filters.",
    disclaimer:
      "Supplier information is provided for discovery and does not imply endorsement, partnership, pricing, availability, or commercial approval by FertaFind.",
  },
  validation: {
    locationTooShort: "Enter at least 3 characters.",
    locationNotFound: "We couldn't find that location. Check the spelling and try again.",
    locationFailed: "We couldn't check that location. Please try again.",
    cropRequired: "Choose at least one crop.",
    goalRequired: "Choose a goal.",
    quotesRequired: "Add at least one quote.",
    termsRequired: "Please accept the Terms to continue.",
  },
  errors: {
    generic: "Something went wrong. Please try again.",
    network: "We couldn't reach the server. Check your connection and try again.",
    tooManyFiles: "Too many files. Please remove some and try again.",
    fileTooLarge: "That file is too large.",
    notFound: "We couldn't find that page.",
  },
  empty: {
    noQuotes: "You haven't added any quotes yet.",
    noSuppliers: "No suppliers to show.",
  },
  notice: {
    untranslatedArticle: "This article is currently available in English only.",
  },
  supplierType: {
    manufacturer: "Manufacturer",
    distributor: "Distributor",
    cooperative: "Cooperative",
    retailer: "Retailer",
    importer: "Importer",
    trader: "Trading company",
  },
  badge: {
    partner: "FertaFind Partner",
    supplier: "FertaFind Supplier",
    verified: "Public information verified",
    pending: "Information pending verification",
  },
  breadcrumb: {
    home: "Home",
    suppliers: "Suppliers",
  },
  footer: {
    tagline:
      "Smarter fertilizer decisions for growers. Compare quotes on one clear, cost-based basis.",
    productHeading: "Product",
    contactHeading: "Contact",
    partners: "Partners",
    rights: "All rights reserved.",
  },
  country: {
    Brazil: "Brazil",
  },
  // Supplier prose, keyed by slug. Company and product names are never translated.
  supplierDescription: {
    "fertiexpress-group":
      "FertiExpress Group imports and distributes fertilizers for Brazilian agriculture, connecting international and national suppliers to growers across the country. Confirm grades, availability and final pricing before purchase.",
    nanofert:
      "Nanofert provides liquid nano-fertilizer products with documented crop and lifecycle programs. Confirm rates, availability and final pricing before purchase.",
  },
} as const;

/** The dictionary shape every locale must satisfy, derived from English. */
export type Dictionary = {
  [K in keyof typeof en]: { [P in keyof (typeof en)[K]]: string };
};

const ptBR: Dictionary = {
  nav: {
    howItWorks: "Como funciona",
    whyFertafind: "Por que a FertaFind",
    suppliers: "Fornecedores",
    faq: "Perguntas frequentes",
    analyzeQuotes: "Analisar cotações",
    resources: "Materiais",
    terms: "Termos",
    language: "Idioma",
  },
  common: {
    back: "Voltar",
    next: "Avançar",
    continue: "Continuar",
    submit: "Enviar",
    cancel: "Cancelar",
    clearFilters: "Limpar filtros",
    loading: "Carregando…",
    optional: "Opcional",
    required: "Obrigatório",
    learnMore: "Saiba mais",
    visitWebsite: "Acessar site",
    seeAll: "Ver todos",
  },
  home: {
    heroTitle: "Compare cotações de fertilizantes em uma base clara de custo",
    heroSubtitle:
      "Envie as cotações que você já tem. A FertaFind coloca formulação, embalagem e entrega na mesma base para você comparar com justiça.",
    heroCta: "Analisar suas cotações",
    workingWith: "Trabalhando com a Nanofert",
    howTitle: "Como funciona",
    whyTitle: "Por que a FertaFind",
    faqTitle: "Perguntas frequentes",
    supplierNetworkTitle: "Nossa rede de fornecedores",
  },
  analyze: {
    title: "Analise suas cotações",
    stepLocation: "Onde fica sua propriedade?",
    stepCrop: "O que você está cultivando?",
    stepUpload: "Envie as cotações",
    stepReview: "Revisar e enviar",
    locationLabel: "Localização da propriedade",
    locationPlaceholder: "Cidade, região ou endereço",
    locationHelp: "Usamos isso apenas para contexto de clima e entrega.",
    useMap: "Selecionar no mapa",
    cropLabel: "Cultura",
    growthStageLabel: "Estágio de desenvolvimento",
    fieldSizeLabel: "Área do talhão",
    organicLabel: "Certificação orgânica",
    goalTitle: "Seu objetivo",
    goalSubtitle: "Escolha como classificar os produtos adequados.",
    goalYield: "Aumentar a produtividade",
    goalYieldHelp: "Priorizar nutrientes e adequação ao talhão",
    goalCost: "Reduzir custos",
    goalCostHelp: "Priorizar o custo do nutriente posto na fazenda",
    goalBalanced: "Equilibrar os dois",
    goalBalancedHelp: "Equilibrar custo-benefício e adequação à cultura",
    uploadTitle: "Adicione suas cotações",
    uploadHelp: "Adicione fotos, documentos ou o texto copiado da cotação.",
    uploadCta: "Escolher arquivos",
    analyzing: "Analisando suas cotações…",
    agreeToTerms: "Concordo com os Termos",
  },
  results: {
    title: "Sua comparação de cotações",
    recommended: "Recomendado",
    lowestCost: "Menor custo",
    sortBy: "Ordenar por",
    noResults: "Ainda não há resultados para mostrar.",
    disclaimer:
      "Esta comparação é apenas orientativa. Confirme formulações, doses, disponibilidade e o preço final com o fornecedor antes da compra.",
  },
  suppliers: {
    title: "Nossa rede de fornecedores",
    subtitle: "Fornecedores de fertilizantes listados na FertaFind.",
    eyebrow: "Rede de fornecedores",
    description:
      "Um diretório de fornecedores de fertilizantes na FertaFind. Cada fornecedor é claramente identificado como verificado de forma independente, informado pelo próprio fornecedor ou pendente de verificação.",
    companiesHeading: "Empresas fornecedoras",
    companyOne: "empresa",
    companyMany: "empresas",
    viewSupplier: "Ver fornecedor",
    ctaTitle: "Já tem cotações de algum fornecedor?",
    ctaBody:
      "A FertaFind coloca cada cotação de fertilizante em uma base clara de custo — formulação, embalagem e entrega — para você comparar com justiça.",
    filterAll: "Todos",
    filterVerified: "Verificado",
    filterProvided: "Informado pelo fornecedor",
    filterPending: "Pendente de verificação",
    filterRelationship: "Relacionamento",
    filterVerification: "Verificação",
    filterType: "Tipo de fornecedor",
    filterProduct: "Produto",
    filterOrigin: "Origem",
    products: "Produtos",
    grades: "Formulações",
    servesRegions: "Atende",
    noneMatch: "Nenhum fornecedor corresponde aos filtros atuais.",
    disclaimer:
      "As informações sobre fornecedores são fornecidas para descoberta e não implicam endosso, parceria, preço, disponibilidade ou aprovação comercial pela FertaFind.",
  },
  validation: {
    locationTooShort: "Digite pelo menos 3 caracteres.",
    locationNotFound: "Não encontramos essa localização. Verifique a grafia e tente novamente.",
    locationFailed: "Não conseguimos verificar essa localização. Tente novamente.",
    cropRequired: "Escolha pelo menos uma cultura.",
    goalRequired: "Escolha um objetivo.",
    quotesRequired: "Adicione pelo menos uma cotação.",
    termsRequired: "Aceite os Termos para continuar.",
  },
  errors: {
    generic: "Algo deu errado. Tente novamente.",
    network: "Não conseguimos acessar o servidor. Verifique sua conexão e tente novamente.",
    tooManyFiles: "Arquivos demais. Remova alguns e tente novamente.",
    fileTooLarge: "Esse arquivo é muito grande.",
    notFound: "Não encontramos essa página.",
  },
  empty: {
    noQuotes: "Você ainda não adicionou nenhuma cotação.",
    noSuppliers: "Nenhum fornecedor para mostrar.",
  },
  notice: {
    untranslatedArticle: "Este artigo está disponível apenas em inglês no momento.",
  },
  supplierType: {
    manufacturer: "Fabricante",
    distributor: "Distribuidora",
    cooperative: "Cooperativa",
    retailer: "Revenda",
    importer: "Importadora",
    trader: "Trading",
  },
  badge: {
    partner: "Parceira FertaFind",
    supplier: "Fornecedora FertaFind",
    verified: "Informações públicas verificadas",
    pending: "Informações pendentes de verificação",
  },
  breadcrumb: {
    home: "Início",
    suppliers: "Fornecedores",
  },
  footer: {
    tagline:
      "Decisões mais inteligentes sobre fertilizantes. Compare cotações em uma base clara de custo.",
    productHeading: "Produto",
    contactHeading: "Contato",
    partners: "Parceiras",
    rights: "Todos os direitos reservados.",
  },
  country: {
    Brazil: "Brasil",
  },
  supplierDescription: {
    "fertiexpress-group":
      "A FertiExpress Group importa e distribui fertilizantes para a agricultura brasileira, conectando fornecedores internacionais e nacionais a produtores de todo o país. Confirme formulações, disponibilidade e preço final antes da compra.",
    nanofert:
      "A Nanofert oferece fertilizantes líquidos nano com programas documentados por cultura e ciclo. Confirme doses, disponibilidade e preço final antes da compra.",
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = {
  en: en as unknown as Dictionary,
  "pt-BR": ptBR,
};

/** The dictionary for a locale; unknown locales safely fall back to English. */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}
