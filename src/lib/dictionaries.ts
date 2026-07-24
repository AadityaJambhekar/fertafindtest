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
    stepperLocation: "Location",
    stepperCrop: "Crop",
    stepperQuotes: "Quotes",
    locationTitle: "Farm location",
    locationSubtitle: "Enter an address or drop a pin.",
    cropTitle: "Crops and field",
    cropSubtitle: "Choose one crop and enter the field size.",
    uploadStepTitle: "Upload quotes",
    uploadStepSubtitle: "Add photos, documents or copied quote text.",
    checking: "Checking…",
    analyzeCta: "Analyze",
    analyzingTitle: "Analyzing your quotes",
    analyzingBody:
      "Extracting nutrient values, comparing suppliers in your area, and calculating landed cost.",
    termsRequiredError: "Agree to the Terms of Service before analyzing your quotes.",
    verificationLoading: "Verification is still loading. Try again in a moment.",
    analysisFailed: "The quote analysis failed.",
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
  terms: {
    eyebrow: "FertaFind terms",
    title: "Terms of use",
    lastUpdated: "Last updated July 18, 2026",
    courtesyNotice:
      "This is the controlling English version of these Terms. Translations are provided for convenience only.",
    partnerTitle: "Partner-only marketplace",
    partnerBody:
      "FertaFind compares and recommends fertilizer products offered by participating FertaFind suppliers and partners. It does not search or rank every supplier or fertilizer product available in the wider market.",
    recommendationsTitle: "How recommendations work",
    recommendationsBody:
      "We use the information you provide—including quotes, crops, location, field details, and available soil or weather context—to rank eligible partner products by factors such as nutrient fit, stated price, delivery information, and estimated value. Commercial relationships with suppliers or partners may benefit FertaFind.",
    decisionTitle: "Decision support only",
    decisionBody:
      "Results are informational and are not agronomic, financial, legal, or safety advice. A recommendation does not guarantee price, stock, delivery, crop performance, suitability, savings, or return. Confirm the product label, final quote, availability, application plan, and local requirements with the supplier and a qualified adviser.",
    uploadsTitle: "Uploaded information",
    uploadsBody:
      "You must provide accurate farm information and have permission to upload each file. Do not upload information you are not authorised to share. Supplier listings, prices, service areas, and product data must be truthful and current. By selecting the acceptance box before analysis, you agree to the version of these Terms shown at that time.",
    soilTitle: "Soil, weather, and irrigation information",
    soilBody:
      "A laboratory soil test is optional but recommended. Weather, humidity, modeled surface soil temperature, soil moisture, irrigation information, and other environmental data may be estimated from third-party sources and may not match conditions within a particular field. FertaFind does not perform a physical soil test. Users are responsible for confirming recommendations with current field observations, product labels, applicable rules, and a qualified agronomist.",
    purchasesTitle: "Purchases, delivery, and fulfilment",
    purchasesBody1:
      "Unless an order confirmation expressly identifies FertaFind as the seller, fertilizer is sold and fulfilled by the participating supplier shown for the order. The supplier or its carrier controls stock confirmation, dispatch, delivery scheduling, unloading, title and risk transfer, returns, and any delivery-specific charges under the final order terms. After purchase, FertaFind is not responsible for an independent supplier's or carrier's delay, failed delivery, loss, damage, incorrect handling, or other act or omission, except to the extent caused by FertaFind or where applicable law does not allow that responsibility to be excluded.",
    purchasesBody2:
      "Customers must review the supplier's final price, delivery window, access requirements, cancellation terms, and refund terms before ordering, and should contact the supplier first about fulfilment problems. Nothing in these Terms limits any statutory cancellation, refund, consumer-protection, product-liability, or other right that cannot lawfully be waived. If FertaFind makes a specific delivery promise or applicable law assigns FertaFind responsibility, that promise or law will control.",
    availabilityTitle: "Service availability",
    availabilityBody:
      "Analyses may be incomplete or unavailable because of unclear files, missing information, third-party services, partner coverage, or technical limits. We may review, change, suspend, or remove listings, recommendations, or features where reasonably necessary.",
    changesTitle: "Changes and contact",
    changesBody: "We may update these terms as the service develops. Questions can be sent to",
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
    stepperLocation: "Localização",
    stepperCrop: "Cultura",
    stepperQuotes: "Cotações",
    locationTitle: "Localização da propriedade",
    locationSubtitle: "Digite um endereço ou marque um ponto no mapa.",
    cropTitle: "Culturas e talhão",
    cropSubtitle: "Escolha uma cultura e informe a área do talhão.",
    uploadStepTitle: "Envie as cotações",
    uploadStepSubtitle: "Adicione fotos, documentos ou o texto copiado da cotação.",
    checking: "Verificando…",
    analyzeCta: "Analisar",
    analyzingTitle: "Analisando suas cotações",
    analyzingBody:
      "Extraindo os teores de nutrientes, comparando fornecedores da sua região e calculando o custo posto na fazenda.",
    termsRequiredError: "Aceite os Termos de Serviço antes de analisar suas cotações.",
    verificationLoading: "A verificação ainda está carregando. Tente novamente em instantes.",
    analysisFailed: "A análise das cotações falhou.",
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
  terms: {
    eyebrow: "Termos da FertaFind",
    title: "Termos de uso",
    lastUpdated: "Última atualização em 18 de julho de 2026",
    courtesyNotice:
      "This Portuguese translation is provided for convenience. The English version remains the controlling version and should be reviewed by qualified legal counsel.",
    partnerTitle: "Marketplace exclusivo de parceiros",
    partnerBody:
      "A FertaFind compara e recomenda produtos fertilizantes oferecidos por fornecedores e parceiros participantes da FertaFind. Ela não pesquisa nem classifica todos os fornecedores ou produtos fertilizantes disponíveis no mercado em geral.",
    recommendationsTitle: "Como funcionam as recomendações",
    recommendationsBody:
      "Usamos as informações que você fornece — incluindo cotações, culturas, localização, detalhes do talhão e o contexto disponível de solo ou clima — para classificar os produtos de parceiros elegíveis por fatores como adequação de nutrientes, preço informado, informações de entrega e valor estimado. Relações comerciais com fornecedores ou parceiros podem beneficiar a FertaFind.",
    decisionTitle: "Apenas apoio à decisão",
    decisionBody:
      "Os resultados são informativos e não constituem aconselhamento agronômico, financeiro, jurídico ou de segurança. Uma recomendação não garante preço, estoque, entrega, desempenho da cultura, adequação, economia ou retorno. Confirme o rótulo do produto, a cotação final, a disponibilidade, o plano de aplicação e as exigências locais com o fornecedor e um profissional qualificado.",
    uploadsTitle: "Informações enviadas",
    uploadsBody:
      "Você deve fornecer informações corretas sobre a propriedade e ter permissão para enviar cada arquivo. Não envie informações que você não esteja autorizado a compartilhar. Anúncios de fornecedores, preços, áreas de atendimento e dados de produtos devem ser verdadeiros e atuais. Ao marcar a caixa de aceite antes da análise, você concorda com a versão destes Termos exibida naquele momento.",
    soilTitle: "Informações de solo, clima e irrigação",
    soilBody:
      "A análise laboratorial de solo é opcional, mas recomendada. Clima, umidade, temperatura superficial modelada do solo, umidade do solo, informações de irrigação e outros dados ambientais podem ser estimados a partir de fontes de terceiros e podem não corresponder às condições de um talhão específico. A FertaFind não realiza análise física de solo. Os usuários são responsáveis por confirmar as recomendações com observações atuais de campo, rótulos de produtos, normas aplicáveis e um agrônomo qualificado.",
    purchasesTitle: "Compras, entrega e cumprimento do pedido",
    purchasesBody1:
      "A menos que a confirmação do pedido identifique expressamente a FertaFind como vendedora, o fertilizante é vendido e entregue pelo fornecedor participante indicado no pedido. O fornecedor ou sua transportadora controla a confirmação de estoque, a expedição, a programação da entrega, a descarga, a transferência de titularidade e risco, as devoluções e quaisquer encargos específicos de entrega, conforme os termos finais do pedido. Após a compra, a FertaFind não é responsável por atraso, falha na entrega, perda, dano, manuseio incorreto ou outro ato ou omissão de fornecedor ou transportadora independente, exceto na medida em que tenha sido causado pela FertaFind ou quando a lei aplicável não permitir a exclusão dessa responsabilidade.",
    purchasesBody2:
      "Os clientes devem revisar o preço final do fornecedor, a janela de entrega, as exigências de acesso, os termos de cancelamento e os termos de reembolso antes de fazer o pedido, e devem contatar primeiro o fornecedor em caso de problemas no cumprimento. Nada nestes Termos limita qualquer direito legal de cancelamento, reembolso, proteção ao consumidor, responsabilidade pelo produto ou outro direito que não possa ser legalmente renunciado. Se a FertaFind fizer uma promessa específica de entrega ou se a lei aplicável atribuir responsabilidade à FertaFind, essa promessa ou lei prevalecerá.",
    availabilityTitle: "Disponibilidade do serviço",
    availabilityBody:
      "As análises podem ficar incompletas ou indisponíveis devido a arquivos pouco legíveis, informações ausentes, serviços de terceiros, cobertura de parceiros ou limites técnicos. Podemos revisar, alterar, suspender ou remover anúncios, recomendações ou funcionalidades quando razoavelmente necessário.",
    changesTitle: "Alterações e contato",
    changesBody:
      "Podemos atualizar estes termos conforme o serviço evolui. Dúvidas podem ser enviadas para",
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
