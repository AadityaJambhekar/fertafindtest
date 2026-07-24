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
    heroBadge: "AI-powered fertilizer intelligence",
    // The animated headline is "headlineLead" + one rotating phrase.
    headlineLead: "Find the fertilizer",
    heroLede:
      "Upload a quote. We compare nutrients, price and delivery to find a strong match for your crop.",
    heroPrimaryCta: "Analyze for free",
    heroSecondaryCta: "How it works",
    proofVerified: "Verified partner data",
    proofSeparate: "Quotes kept separate",
    proofFlagged: "Missing details flagged",
    howEyebrow: "01 / How it works",
    howHeading: "From quote photo to smart decision — in minutes.",
    howCta: "Start for free",
    whyEyebrow: "02 / Why farmers use FertaFind",
    whyHeading: "Clearer comparisons. Fewer bad surprises.",
    whyLede:
      "Fertilizer is one of the largest cash expenses on the farm. A small decision made better each season compounds fast.",
    networkEyebrow: "03 / Our supplier network",
    networkLede:
      "The companies in the FertaFind network — each clearly marked as a FertaFind partner, verified from public sources, or pending independent verification.",
    networkViewAll: "View all suppliers",
    locationPending: "Location pending verification",
    faqEyebrow: "04 / FAQ",
    faqHeading: "Clear answers before you analyze.",
    faqLede:
      "What the recommendation does, what it does not do, and where better field data helps.",
  },
  /** Animated headline phrases. Rendered after home.headlineLead, so each must complete it. */
  homeRotating: ["worth buying.", "right for you.", "for healthy crops.", "for better yields."],
  homeSteps: [
    {
      title: "Tell us your farm",
      body: "Enter your location, crops, field size and the conditions that affect application.",
    },
    {
      title: "Upload your quotes",
      body: "Snap photos of every fertilizer quote you've received. That's it.",
    },
    {
      title: "AI does the math",
      body: "We extract NPK, price per unit, application rates and delivery costs.",
    },
    {
      title: "See the recommendation",
      body: "Get one clear recommended fertilizer, the reason it fits and the supporting costs.",
    },
  ],
  homeBenefits: [
    {
      title: "See nutrient cost on one basis",
      body: "Quotes can look similar until price, pack size and nutrient concentration are put on the same basis. We show that clearly for one quote or several.",
    },
    {
      title: "Landed cost, not sticker price",
      body: "When freight is stated on the quote, it is included so the recommendation reflects the cost of getting product to the farm.",
    },
    {
      title: "Fit-first, not brand-first",
      body: "Recommendations consider the quoted nutrient mix alongside the crop, soil information, weather and watering details you provide.",
    },
    {
      title: "Important gaps stay visible",
      body: "Missing rates, prices, soil tests or uncertain extraction are flagged instead of being quietly guessed.",
    },
  ],
  homeFaq: [
    {
      question: "Does FertaFind recommend the same fertilizer every time?",
      answer:
        "No. Partner products are evaluated against the selected crop, lifecycle stage, soil information, nutrient targets, weather, irrigation, prior applications, preferences, and available supplier evidence.",
    },
    {
      question: "What happens if my crop has no matching partner product?",
      answer:
        "FertaFind will say that no participating partner product currently matches. Your uploaded products can still appear in a separate quote comparison, but they will not be presented as a partner recommendation.",
    },
    {
      question: "Do I need a laboratory soil test?",
      answer:
        "No. A soil test is optional, but it can materially improve the analysis. Without one, missing nutrient and soil-condition information is shown as a limitation rather than guessed.",
    },
    {
      question: "Will the cheapest quote always win?",
      answer:
        "No. Agronomic suitability comes first. Price and delivery are considered only after crop and stage compatibility, and an estimated cost is shown only when enough real pricing information exists.",
    },
  ],
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

/** Every field of an object becomes a translatable string. */
type Translated<T> = { [P in keyof T]: string };

/**
 * The dictionary shape every locale must satisfy, derived from English.
 *
 * Sections are either a flat map of strings, a list of strings (the rotating headline),
 * or a list of objects (steps, benefits, FAQ). Every shape is derived from `en`, so a new
 * English key cannot be added without every locale being forced to supply it.
 */
export type Dictionary = {
  [K in keyof typeof en]: (typeof en)[K] extends readonly string[]
    ? string[]
    : (typeof en)[K] extends readonly (infer Item)[]
      ? Array<Translated<Item>>
      : Translated<(typeof en)[K]>;
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
    workingWith: "Em parceria com a Nanofert",
    howTitle: "Como funciona",
    whyTitle: "Por que a FertaFind",
    faqTitle: "Perguntas frequentes",
    supplierNetworkTitle: "Nossa rede de fornecedores",
    heroBadge: "Inteligência em fertilizantes com IA",
    headlineLead: "Encontre o fertilizante",
    heroLede:
      "Envie uma cotação. Nós comparamos nutrientes, preço e entrega para encontrar a melhor opção para sua cultura.",
    heroPrimaryCta: "Analisar gratuitamente",
    heroSecondaryCta: "Como funciona",
    proofVerified: "Dados verificados de parceiros",
    proofSeparate: "Cotações analisadas separadamente",
    proofFlagged: "Informações ausentes sinalizadas",
    howEyebrow: "01 / Como funciona",
    howHeading: "Da foto da cotação a uma decisão mais inteligente — em minutos.",
    howCta: "Comece gratuitamente",
    whyEyebrow: "02 / Por que produtores usam a FertaFind",
    whyHeading: "Comparações mais claras. Menos surpresas desagradáveis.",
    whyLede:
      "O fertilizante é uma das maiores despesas em dinheiro da fazenda. Uma decisão um pouco melhor a cada safra se acumula rápido.",
    networkEyebrow: "03 / Nossa rede de fornecedores",
    networkLede:
      "As empresas da rede FertaFind — cada uma claramente identificada como parceira FertaFind, verificada em fontes públicas ou pendente de verificação independente.",
    networkViewAll: "Ver todos os fornecedores",
    locationPending: "Localização pendente de verificação",
    faqEyebrow: "04 / Perguntas frequentes",
    faqHeading: "Respostas claras antes de você analisar.",
    faqLede: "O que a recomendação faz, o que ela não faz e onde dados de campo melhores ajudam.",
  },
  // The first phrase completes the requested headline:
  // "Encontre o fertilizante certo para sua lavoura."
  homeRotating: [
    "certo para sua lavoura.",
    "que vale a pena comprar.",
    "ideal para sua cultura.",
    "para melhores produtividades.",
  ],
  homeSteps: [
    {
      title: "Conte sobre sua propriedade",
      body: "Informe sua localização, culturas, área do talhão e as condições que afetam a aplicação.",
    },
    {
      title: "Envie suas cotações",
      body: "Fotografe cada cotação de fertilizante que você recebeu. É só isso.",
    },
    {
      title: "A IA faz as contas",
      body: "Extraímos NPK, preço por unidade, doses de aplicação e custos de entrega.",
    },
    {
      title: "Veja a recomendação",
      body: "Receba um fertilizante recomendado com clareza, o motivo de ele se encaixar e os custos que sustentam a escolha.",
    },
  ],
  homeBenefits: [
    {
      title: "Veja o custo do nutriente em uma única base",
      body: "Cotações podem parecer semelhantes até que preço, embalagem e concentração de nutrientes sejam colocados na mesma base. Mostramos isso com clareza para uma ou várias cotações.",
    },
    {
      title: "Custo posto na fazenda, não preço de tabela",
      body: "Quando o frete está informado na cotação, ele é incluído para que a recomendação reflita o custo de levar o produto até a fazenda.",
    },
    {
      title: "Adequação primeiro, marca depois",
      body: "As recomendações consideram a combinação de nutrientes cotada junto com a cultura, as informações de solo, o clima e os detalhes de irrigação que você fornece.",
    },
    {
      title: "Lacunas importantes ficam visíveis",
      body: "Doses, preços, análises de solo ausentes ou extração incerta são sinalizados em vez de serem silenciosamente adivinhados.",
    },
  ],
  homeFaq: [
    {
      question: "A FertaFind recomenda sempre o mesmo fertilizante?",
      answer:
        "Não. Os produtos de parceiros são avaliados em relação à cultura selecionada, ao estágio do ciclo, às informações de solo, às metas de nutrientes, ao clima, à irrigação, às aplicações anteriores, às preferências e às evidências disponíveis do fornecedor.",
    },
    {
      question: "O que acontece se nenhum produto de parceiro servir para minha cultura?",
      answer:
        "A FertaFind informará que nenhum produto de parceiro participante corresponde no momento. Os produtos que você enviou ainda podem aparecer em uma comparação de cotações separada, mas não serão apresentados como recomendação de parceiro.",
    },
    {
      question: "Preciso de uma análise laboratorial de solo?",
      answer:
        "Não. A análise de solo é opcional, mas pode melhorar bastante o resultado. Sem ela, as informações ausentes de nutrientes e de condição do solo são mostradas como limitação, em vez de adivinhadas.",
    },
    {
      question: "A cotação mais barata sempre vence?",
      answer:
        "Não. A adequação agronômica vem primeiro. Preço e entrega só são considerados depois da compatibilidade com a cultura e o estágio, e um custo estimado só é exibido quando há informação de preço real suficiente.",
    },
  ],
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

/**
 * Neutral Latin American Spanish (es-419).
 *
 * Deliberately region-neutral: "computadora"-style vocabulary, no voseo, no Iberian
 * "vosotros", and agricultural terms chosen to read naturally from Mexico to Argentina
 * ("cultivo", "parcela", "cotización"). Brand, product, grade, NPK, currency and unit
 * tokens are never translated.
 */
const es419: Dictionary = {
  nav: {
    howItWorks: "Cómo funciona",
    whyFertafind: "Por qué FertaFind",
    suppliers: "Proveedores",
    faq: "Preguntas frecuentes",
    analyzeQuotes: "Analizar cotizaciones",
    resources: "Recursos",
    terms: "Términos",
    language: "Idioma",
  },
  common: {
    back: "Atrás",
    next: "Siguiente",
    continue: "Continuar",
    submit: "Enviar",
    cancel: "Cancelar",
    clearFilters: "Borrar filtros",
    loading: "Cargando…",
    optional: "Opcional",
    required: "Obligatorio",
    learnMore: "Más información",
    visitWebsite: "Visitar el sitio",
    seeAll: "Ver todo",
  },
  home: {
    heroTitle: "Compara cotizaciones de fertilizantes sobre una misma base de costo",
    heroSubtitle:
      "Sube las cotizaciones que ya tienes. FertaFind pone la formulación, la presentación y la entrega sobre la misma base para que puedas compararlas de forma justa.",
    heroCta: "Analizar tus cotizaciones",
    workingWith: "En alianza con Nanofert",
    howTitle: "Cómo funciona",
    whyTitle: "Por qué FertaFind",
    faqTitle: "Preguntas frecuentes",
    supplierNetworkTitle: "Nuestra red de proveedores",
    heroBadge: "Inteligencia en fertilizantes con IA",
    headlineLead: "Encuentra el fertilizante",
    heroLede:
      "Sube una cotización. Comparamos nutrientes, precio y entrega para encontrar la mejor opción para tu cultivo.",
    heroPrimaryCta: "Analizar gratis",
    heroSecondaryCta: "Cómo funciona",
    proofVerified: "Datos verificados de socios",
    proofSeparate: "Cotizaciones analizadas por separado",
    proofFlagged: "Información faltante señalada",
    howEyebrow: "01 / Cómo funciona",
    howHeading: "De la foto de la cotización a una decisión más inteligente — en minutos.",
    howCta: "Empieza gratis",
    whyEyebrow: "02 / Por qué los productores usan FertaFind",
    whyHeading: "Comparaciones más claras. Menos sorpresas desagradables.",
    whyLede:
      "El fertilizante es uno de los mayores gastos en efectivo del campo. Una decisión un poco mejor cada ciclo se acumula rápido.",
    networkEyebrow: "03 / Nuestra red de proveedores",
    networkLede:
      "Las empresas de la red FertaFind: cada una identificada claramente como socia de FertaFind, verificada con fuentes públicas o pendiente de verificación independiente.",
    networkViewAll: "Ver todos los proveedores",
    locationPending: "Ubicación pendiente de verificación",
    faqEyebrow: "04 / Preguntas frecuentes",
    faqHeading: "Respuestas claras antes de analizar.",
    faqLede: "Qué hace la recomendación, qué no hace y dónde ayudan mejores datos de campo.",
  },
  // The first phrase completes the headline: "Encuentra el fertilizante correcto para tu cultivo."
  homeRotating: [
    "correcto para tu cultivo.",
    "que vale la pena comprar.",
    "ideal para tu parcela.",
    "para mejores rendimientos.",
  ],
  homeSteps: [
    {
      title: "Cuéntanos sobre tu campo",
      body: "Ingresa tu ubicación, cultivos, superficie de la parcela y las condiciones que afectan la aplicación.",
    },
    {
      title: "Sube tus cotizaciones",
      body: "Toma fotos de cada cotización de fertilizante que hayas recibido. Eso es todo.",
    },
    {
      title: "La IA hace los cálculos",
      body: "Extraemos NPK, precio por unidad, dosis de aplicación y costos de entrega.",
    },
    {
      title: "Consulta la recomendación",
      body: "Recibe un fertilizante recomendado con claridad, el motivo por el que se ajusta y los costos que lo respaldan.",
    },
  ],
  homeBenefits: [
    {
      title: "Observa el costo del nutriente sobre una sola base",
      body: "Las cotizaciones pueden parecer similares hasta que el precio, la presentación y la concentración de nutrientes se colocan sobre la misma base. Lo mostramos con claridad para una o varias cotizaciones.",
    },
    {
      title: "Costo puesto en campo, no precio de lista",
      body: "Cuando el flete aparece en la cotización, se incluye para que la recomendación refleje el costo de llevar el producto hasta el campo.",
    },
    {
      title: "Primero la aptitud, después la marca",
      body: "Las recomendaciones consideran la mezcla de nutrientes cotizada junto con el cultivo, la información de suelo, el clima y los datos de riego que proporciones.",
    },
    {
      title: "Los vacíos importantes quedan visibles",
      body: "Las dosis, precios o análisis de suelo faltantes y las extracciones inciertas se señalan en lugar de adivinarse en silencio.",
    },
  ],
  homeFaq: [
    {
      question: "¿FertaFind recomienda siempre el mismo fertilizante?",
      answer:
        "No. Los productos de socios se evalúan frente al cultivo seleccionado, la etapa del ciclo, la información de suelo, las metas de nutrientes, el clima, el riego, las aplicaciones previas, las preferencias y la evidencia disponible del proveedor.",
    },
    {
      question: "¿Qué pasa si ningún producto de socio se ajusta a mi cultivo?",
      answer:
        "FertaFind indicará que actualmente ningún producto de socio participante coincide. Los productos que subiste aún pueden aparecer en una comparación de cotizaciones aparte, pero no se presentarán como recomendación de socio.",
    },
    {
      question: "¿Necesito un análisis de suelo de laboratorio?",
      answer:
        "No. El análisis de suelo es opcional, pero puede mejorar mucho el resultado. Sin él, la información faltante de nutrientes y de condición del suelo se muestra como una limitación en lugar de adivinarse.",
    },
    {
      question: "¿La cotización más barata siempre gana?",
      answer:
        "No. La aptitud agronómica va primero. El precio y la entrega se consideran solo después de la compatibilidad con el cultivo y la etapa, y solo se muestra un costo estimado cuando existe suficiente información real de precios.",
    },
  ],
  analyze: {
    title: "Analiza tus cotizaciones",
    stepLocation: "¿Dónde está tu campo?",
    stepCrop: "¿Qué estás cultivando?",
    stepUpload: "Sube las cotizaciones",
    stepReview: "Revisar y enviar",
    locationLabel: "Ubicación del campo",
    locationPlaceholder: "Ciudad, región o dirección",
    locationHelp: "La usamos únicamente para el contexto de clima y entrega.",
    useMap: "Seleccionar en el mapa",
    cropLabel: "Cultivo",
    growthStageLabel: "Etapa de desarrollo",
    fieldSizeLabel: "Superficie de la parcela",
    organicLabel: "Certificación orgánica",
    goalTitle: "Tu objetivo",
    goalSubtitle: "Elige cómo clasificar los productos adecuados.",
    goalYield: "Aumentar el rendimiento",
    goalYieldHelp: "Priorizar los nutrientes y la aptitud de la parcela",
    goalCost: "Reducir costos",
    goalCostHelp: "Priorizar el costo del nutriente puesto en campo",
    goalBalanced: "Equilibrar ambos",
    goalBalancedHelp: "Equilibrar el valor y la aptitud del cultivo",
    uploadTitle: "Agrega tus cotizaciones",
    uploadHelp: "Agrega fotos, documentos o el texto copiado de la cotización.",
    uploadCta: "Elegir archivos",
    analyzing: "Analizando tus cotizaciones…",
    agreeToTerms: "Acepto los Términos",
    stepperLocation: "Ubicación",
    stepperCrop: "Cultivo",
    stepperQuotes: "Cotizaciones",
    locationTitle: "Ubicación del campo",
    locationSubtitle: "Escribe una dirección o marca un punto en el mapa.",
    cropTitle: "Cultivos y parcela",
    cropSubtitle: "Elige un cultivo e ingresa la superficie de la parcela.",
    uploadStepTitle: "Sube las cotizaciones",
    uploadStepSubtitle: "Agrega fotos, documentos o el texto copiado de la cotización.",
    checking: "Verificando…",
    analyzeCta: "Analizar",
    analyzingTitle: "Analizando tus cotizaciones",
    analyzingBody:
      "Extrayendo los valores de nutrientes, comparando proveedores de tu zona y calculando el costo puesto en campo.",
    termsRequiredError: "Acepta los Términos de servicio antes de analizar tus cotizaciones.",
    verificationLoading: "La verificación todavía está cargando. Inténtalo de nuevo en un momento.",
    analysisFailed: "El análisis de las cotizaciones falló.",
  },
  results: {
    title: "Tu comparación de cotizaciones",
    recommended: "Recomendado",
    lowestCost: "Menor costo",
    sortBy: "Ordenar por",
    noResults: "Todavía no hay resultados para mostrar.",
    disclaimer:
      "Esta comparación es solo orientativa. Confirma las formulaciones, dosis, disponibilidad y el precio final con el proveedor antes de comprar.",
  },
  suppliers: {
    title: "Nuestra red de proveedores",
    subtitle: "Proveedores de fertilizantes listados en FertaFind.",
    eyebrow: "Red de proveedores",
    description:
      "Un directorio de proveedores de fertilizantes en FertaFind. Cada proveedor está identificado claramente como verificado de forma independiente, informado por el propio proveedor o pendiente de verificación.",
    companiesHeading: "Empresas proveedoras",
    companyOne: "empresa",
    companyMany: "empresas",
    viewSupplier: "Ver proveedor",
    ctaTitle: "¿Ya tienes cotizaciones de algún proveedor?",
    ctaBody:
      "FertaFind pone cada cotización de fertilizante sobre una base clara de costo — formulación, presentación y entrega — para que puedas compararlas de forma justa.",
    filterAll: "Todos",
    filterVerified: "Verificado",
    filterProvided: "Informado por el proveedor",
    filterPending: "Pendiente de verificación",
    filterRelationship: "Relación",
    filterVerification: "Verificación",
    filterType: "Tipo de proveedor",
    filterProduct: "Producto",
    filterOrigin: "Origen",
    products: "Productos",
    grades: "Formulaciones",
    servesRegions: "Atiende",
    noneMatch: "Ningún proveedor coincide con los filtros actuales.",
    disclaimer:
      "La información sobre proveedores se ofrece con fines de descubrimiento y no implica respaldo, alianza, precio, disponibilidad ni aprobación comercial por parte de FertaFind.",
  },
  validation: {
    locationTooShort: "Ingresa al menos 3 caracteres.",
    locationNotFound: "No encontramos esa ubicación. Revisa la escritura e inténtalo de nuevo.",
    locationFailed: "No pudimos verificar esa ubicación. Inténtalo de nuevo.",
    cropRequired: "Elige al menos un cultivo.",
    goalRequired: "Elige un objetivo.",
    quotesRequired: "Agrega al menos una cotización.",
    termsRequired: "Acepta los Términos para continuar.",
  },
  errors: {
    generic: "Algo salió mal. Inténtalo de nuevo.",
    network: "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
    tooManyFiles: "Demasiados archivos. Quita algunos e inténtalo de nuevo.",
    fileTooLarge: "Ese archivo es demasiado grande.",
    notFound: "No encontramos esa página.",
  },
  empty: {
    noQuotes: "Todavía no has agregado ninguna cotización.",
    noSuppliers: "No hay proveedores para mostrar.",
  },
  terms: {
    eyebrow: "Términos de FertaFind",
    title: "Términos de uso",
    lastUpdated: "Última actualización: 18 de julio de 2026",
    courtesyNotice:
      "Esta traducción al español se proporciona únicamente para comodidad. La versión en inglés sigue siendo la versión aplicable.",
    partnerTitle: "Marketplace exclusivo de socios",
    partnerBody:
      "FertaFind compara y recomienda productos fertilizantes ofrecidos por proveedores y socios participantes de FertaFind. No busca ni clasifica todos los proveedores o productos fertilizantes disponibles en el mercado en general.",
    recommendationsTitle: "Cómo funcionan las recomendaciones",
    recommendationsBody:
      "Usamos la información que proporcionas —incluidas cotizaciones, cultivos, ubicación, detalles de la parcela y el contexto disponible de suelo o clima— para clasificar los productos de socios elegibles según factores como la aptitud de nutrientes, el precio informado, la información de entrega y el valor estimado. Las relaciones comerciales con proveedores o socios pueden beneficiar a FertaFind.",
    decisionTitle: "Solo apoyo a la decisión",
    decisionBody:
      "Los resultados son informativos y no constituyen asesoría agronómica, financiera, legal ni de seguridad. Una recomendación no garantiza precio, existencias, entrega, desempeño del cultivo, aptitud, ahorro ni retorno. Confirma la etiqueta del producto, la cotización final, la disponibilidad, el plan de aplicación y los requisitos locales con el proveedor y un asesor calificado.",
    uploadsTitle: "Información subida",
    uploadsBody:
      "Debes proporcionar información correcta del campo y contar con permiso para subir cada archivo. No subas información que no estés autorizado a compartir. Los listados de proveedores, precios, zonas de servicio y datos de productos deben ser veraces y estar actualizados. Al marcar la casilla de aceptación antes del análisis, aceptas la versión de estos Términos mostrada en ese momento.",
    soilTitle: "Información de suelo, clima y riego",
    soilBody:
      "El análisis de suelo de laboratorio es opcional, pero recomendable. El clima, la humedad, la temperatura superficial modelada del suelo, la humedad del suelo, la información de riego y otros datos ambientales pueden estimarse a partir de fuentes de terceros y podrían no coincidir con las condiciones de una parcela específica. FertaFind no realiza análisis físicos de suelo. Los usuarios son responsables de confirmar las recomendaciones con observaciones actuales de campo, etiquetas de productos, normas aplicables y un agrónomo calificado.",
    purchasesTitle: "Compras, entrega y cumplimiento",
    purchasesBody1:
      "A menos que la confirmación del pedido identifique expresamente a FertaFind como vendedor, el fertilizante es vendido y entregado por el proveedor participante indicado en el pedido. El proveedor o su transportista controla la confirmación de existencias, el despacho, la programación de la entrega, la descarga, la transferencia de titularidad y riesgo, las devoluciones y cualquier cargo específico de entrega según los términos finales del pedido. Después de la compra, FertaFind no es responsable por demoras, entregas fallidas, pérdidas, daños, manejo incorrecto u otros actos u omisiones de un proveedor o transportista independiente, salvo en la medida en que hayan sido causados por FertaFind o cuando la ley aplicable no permita excluir esa responsabilidad.",
    purchasesBody2:
      "Los clientes deben revisar el precio final del proveedor, la ventana de entrega, los requisitos de acceso, los términos de cancelación y los términos de reembolso antes de hacer el pedido, y deben contactar primero al proveedor ante problemas de cumplimiento. Nada en estos Términos limita ningún derecho legal de cancelación, reembolso, protección al consumidor, responsabilidad por producto u otro derecho que no pueda renunciarse legalmente. Si FertaFind hace una promesa específica de entrega o la ley aplicable le asigna responsabilidad, esa promesa o ley prevalecerá.",
    availabilityTitle: "Disponibilidad del servicio",
    availabilityBody:
      "Los análisis pueden quedar incompletos o no estar disponibles por archivos poco legibles, información faltante, servicios de terceros, cobertura de socios o límites técnicos. Podemos revisar, cambiar, suspender o retirar listados, recomendaciones o funciones cuando sea razonablemente necesario.",
    changesTitle: "Cambios y contacto",
    changesBody:
      "Podemos actualizar estos términos a medida que el servicio evoluciona. Las dudas pueden enviarse a",
  },
  notice: {
    untranslatedArticle: "Este artículo está disponible únicamente en inglés por el momento.",
  },
  supplierType: {
    manufacturer: "Fabricante",
    distributor: "Distribuidora",
    cooperative: "Cooperativa",
    retailer: "Comercializadora",
    importer: "Importadora",
    trader: "Empresa comercializadora",
  },
  badge: {
    partner: "Socio de FertaFind",
    supplier: "Proveedor de FertaFind",
    verified: "Información pública verificada",
    pending: "Información pendiente de verificación",
  },
  breadcrumb: {
    home: "Inicio",
    suppliers: "Proveedores",
  },
  footer: {
    tagline:
      "Decisiones más inteligentes sobre fertilizantes. Compara cotizaciones sobre una base clara de costo.",
    productHeading: "Producto",
    contactHeading: "Contacto",
    partners: "Socios",
    rights: "Todos los derechos reservados.",
  },
  country: {
    Brazil: "Brasil",
  },
  supplierDescription: {
    "fertiexpress-group":
      "FertiExpress Group importa y distribuye fertilizantes para la agricultura brasileña, conectando a proveedores internacionales y nacionales con productores de todo el país. Confirma las formulaciones, la disponibilidad y el precio final antes de comprar.",
    nanofert:
      "Nanofert ofrece fertilizantes líquidos nano con programas documentados por cultivo y ciclo. Confirma las dosis, la disponibilidad y el precio final antes de comprar.",
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = {
  en: en as unknown as Dictionary,
  "pt-BR": ptBR,
  "es-419": es419,
};

/** The dictionary for a locale; unknown locales safely fall back to English. */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}
