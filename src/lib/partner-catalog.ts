export type NutrientCode = "N" | "P" | "K" | "Zn" | "B" | "Cu";

export type PartnerProductUse = {
  crop: string;
  cropAliases: string[];
  compatibleStages: string[];
  protocolId: string;
  timing: string;
  rate: string | null;
  source: string;
};

export type PartnerProduct = {
  id: string;
  name: string;
  supplier: "Nanofert";
  nutrients: NutrientCode[];
  nutrientEvidence: string;
  form: "liquid";
  origin: null;
  price: number | null;
  currency: "BRL" | null;
  packageQuantity: number | null;
  priceBasis: "per liter" | null;
  priceSource: string | null;
  deliveryRegions: string[];
  uses: PartnerProductUse[];
  evidence: string[];
  requiresSupplierVerification: string[];
};

const commonVerification = [
  "Delivery availability for the selected farm",
  "Organic or synthetic classification",
  "Current product label and local registration",
];

const farmerPricePerLiter = (distributorPrice: number) =>
  Math.round(distributorPrice * 1.4 * 100) / 100;

const priceSource =
  "Nanofert distributor price table supplied 2026-07-20; website farmer price applies a 40% markup to the 28-day/base BRL-per-liter price.";

export const partnerProducts: PartnerProduct[] = [
  {
    id: "nanofert-nano-nitro",
    name: "Nano Nitro",
    supplier: "Nanofert",
    nutrients: ["N"],
    nutrientEvidence: "The supplier document describes Nano Nitro as foliar nitrogen.",
    form: "liquid",
    origin: null,
    price: farmerPricePerLiter(56),
    currency: "BRL",
    packageQuantity: 1,
    priceBasis: "per liter",
    priceSource,
    deliveryRegions: [],
    uses: [
      {
        crop: "Soybeans",
        cropAliases: ["soybean", "soybeans", "soy", "soya", "soja"],
        compatibleStages: ["R1-R2"],
        protocolId: "soybean-r1-r2",
        timing: "R1-R2, approximately 45-55 days after planting",
        rate: "1 L/ha",
        source: "Nanofert crop-positioning PDF, pages 2 and 6",
      },
      {
        crop: "Corn / Maize",
        cropAliases: ["corn", "maize", "milho"],
        compatibleStages: ["V6-V7"],
        protocolId: "corn-v6-v7",
        timing: "V6-V7, approximately 35-40 days after emergence",
        rate: "1 L/ha",
        source: "Nanofert crop-positioning PDF, pages 8 and 11",
      },
      {
        crop: "Pasture / Forage",
        cropAliases: ["pasture", "forage", "grassland", "grazing"],
        compatibleStages: ["active vegetative growth", "recovery"],
        protocolId: "pasture-active-growth",
        timing: "Supplier calendar positions applications in Nov/Dec and Feb/Mar",
        rate: "1 L/ha",
        source: "Nanofert crop-positioning PDF, pages 13-15",
      },
      {
        crop: "Beans",
        cropAliases: ["bean", "beans", "feijao", "feijão"],
        compatibleStages: ["V3-Vn", "vegetative"],
        protocolId: "beans-vegetative",
        timing: "Vegetative stage, approximately 20-30 days after planting",
        rate: "1 L/ha",
        source: "Nanofert crop-positioning PDF, pages 18-19",
      },
      {
        crop: "Sugarcane",
        cropAliases: ["sugarcane", "sugar cane", "cana-de-acucar", "cana-de-açúcar"],
        compatibleStages: [],
        protocolId: "sugarcane-nitro-plus",
        timing:
          "Two foliar applications in the supplier-reported APTA trial; exact crop stages were not stated",
        rate: "1 L/ha first application; 1.5 L/ha second application",
        source: "Nanofert crop-positioning PDF, page 23",
      },
      {
        crop: "Tomatoes",
        cropAliases: ["tomato", "tomatoes", "tomate"],
        compatibleStages: ["transplant / establishment"],
        protocolId: "tomato-establishment",
        timing: "15 days after transplanting",
        rate: "1 L/ha",
        source: "Nanofert crop-positioning PDF, page 29",
      },
      {
        crop: "Peppers",
        cropAliases: ["pepper", "peppers", "bell pepper", "pimentao", "pimentão"],
        compatibleStages: ["transplant / establishment"],
        protocolId: "pepper-establishment",
        timing: "15 days after transplanting",
        rate: "1 L/ha",
        source: "Nanofert crop-positioning PDF, page 31",
      },
      {
        crop: "Cassava",
        cropAliases: ["cassava", "manioc", "mandioca"],
        compatibleStages: ["establishment", "vegetative growth"],
        protocolId: "cassava-establishment",
        timing: "30-45 days after planting",
        rate: "1 L/ha",
        source: "Nanofert crop-positioning PDF, page 30",
      },
      {
        crop: "Grapes",
        cropAliases: ["grape", "grapes", "vineyard", "uva"],
        compatibleStages: ["bud break", "brotacao", "brotação"],
        protocolId: "grapes-bud-break",
        timing: "Bud break; three applications were reported in Sep/2025",
        rate: null,
        source: "Nanofert crop-positioning PDF, page 34",
      },
      {
        crop: "Grapes",
        cropAliases: ["grape", "grapes", "vineyard", "uva"],
        compatibleStages: ["post-harvest", "pos-colheita", "pós-colheita"],
        protocolId: "grapes-post-harvest",
        timing: "Post-harvest; Jan/2026 in the documented field protocol",
        rate: null,
        source: "Nanofert crop-positioning PDF, page 34",
      },
    ],
    evidence: [
      "Nano Nitro appears in verified crop-stage protocols for soybeans, corn, pasture, beans, sugarcane, tomato, pepper, cassava and grapes.",
    ],
    requiresSupplierVerification: [...commonVerification, "Exact guaranteed nutrient analysis"],
  },
  {
    id: "nanofert-nano-plus",
    name: "Nano Plus",
    supplier: "Nanofert",
    nutrients: [],
    nutrientEvidence:
      "The supplier document calls Nano Plus a complementary nutritional complex, but does not provide an exact guaranteed analysis.",
    form: "liquid",
    origin: null,
    price: farmerPricePerLiter(58),
    currency: "BRL",
    packageQuantity: 1,
    priceBasis: "per liter",
    priceSource,
    deliveryRegions: [],
    uses: [
      {
        crop: "Soybeans",
        cropAliases: ["soybean", "soybeans", "soy", "soya", "soja"],
        compatibleStages: ["R1-R2"],
        protocolId: "soybean-r1-r2",
        timing: "R1-R2, approximately 45-55 days after planting",
        rate: "0.5 L/ha",
        source: "Nanofert crop-positioning PDF, pages 2 and 6",
      },
      {
        crop: "Corn / Maize",
        cropAliases: ["corn", "maize", "milho"],
        compatibleStages: ["V6-V7"],
        protocolId: "corn-v6-v7",
        timing: "V6-V7, approximately 35-40 days after emergence",
        rate: "0.5 L/ha",
        source: "Nanofert crop-positioning PDF, pages 8 and 11",
      },
      {
        crop: "Pasture / Forage",
        cropAliases: ["pasture", "forage", "grassland", "grazing"],
        compatibleStages: ["active vegetative growth", "recovery"],
        protocolId: "pasture-active-growth",
        timing: "Supplier calendar positions applications in Nov/Dec and Feb/Mar",
        rate: "0.5 L/ha",
        source: "Nanofert crop-positioning PDF, pages 13-15",
      },
      {
        crop: "Beans",
        cropAliases: ["bean", "beans", "feijao", "feijão"],
        compatibleStages: ["flowering", "pod formation"],
        protocolId: "beans-flowering",
        timing: "Flowering to early pod formation, approximately 45-55 days after planting",
        rate: "0.5 L/ha",
        source: "Nanofert crop-positioning PDF, pages 18-19",
      },
      {
        crop: "Sugarcane",
        cropAliases: ["sugarcane", "sugar cane", "cana-de-acucar", "cana-de-açúcar"],
        compatibleStages: [],
        protocolId: "sugarcane-nitro-plus",
        timing:
          "First foliar application in the supplier-reported APTA trial; exact crop stage was not stated",
        rate: "0.5 L/ha",
        source: "Nanofert crop-positioning PDF, page 23",
      },
      {
        crop: "Lettuce",
        cropAliases: ["lettuce", "alface"],
        compatibleStages: ["transplant / establishment", "head formation / filling"],
        protocolId: "lettuce-stage-program",
        timing: "10-15 and 20-30 days after transplanting",
        rate: "100 mL per 100 L spray mix",
        source: "Nanofert crop-positioning PDF, page 28",
      },
      {
        crop: "Tomatoes",
        cropAliases: ["tomato", "tomatoes", "tomate"],
        compatibleStages: ["vegetative growth", "fruit growth", "maturation / harvest"],
        protocolId: "tomato-plus",
        timing: "60, 90, 105 and 120 days after transplanting",
        rate: "1 L/ha at 60 DAT; 0.5 L/ha at 90, 105 and 120 DAT",
        source: "Nanofert crop-positioning PDF, page 29",
      },
      {
        crop: "Peppers",
        cropAliases: ["pepper", "peppers", "bell pepper", "pimentao", "pimentão"],
        compatibleStages: ["vegetative growth", "fruit growth", "maturation / harvest"],
        protocolId: "pepper-plus",
        timing: "60, 90, 105 and 120 days after transplanting",
        rate: "1 L/ha at 60 DAT; 0.5 L/ha at 90, 105 and 120 DAT",
        source: "Nanofert crop-positioning PDF, page 31",
      },
      {
        crop: "Cassava",
        cropAliases: ["cassava", "manioc", "mandioca"],
        compatibleStages: ["tuber initiation", "root bulking"],
        protocolId: "cassava-root-development",
        timing: "120-150 and 180-220 days after planting",
        rate: "0.5 L/ha",
        source: "Nanofert crop-positioning PDF, page 30",
      },
      {
        crop: "Grapes",
        cropAliases: ["grape", "grapes", "vineyard", "uva"],
        compatibleStages: ["pre-flowering / flowering", "pre-flowering", "flowering"],
        protocolId: "grapes-flowering",
        timing: "Pre-flowering / flowering",
        rate: null,
        source: "Nanofert crop-positioning PDF, page 34",
      },
      {
        crop: "Grapes",
        cropAliases: ["grape", "grapes", "vineyard", "uva"],
        compatibleStages: ["fruit set", "pea-sized berries", "chumbinho", "meia-baga"],
        protocolId: "grapes-fruit-set",
        timing: "Fruit set / pea-sized to half-sized berries; Oct/2025 in the documented protocol",
        rate: null,
        source: "Nanofert crop-positioning PDF, page 34",
      },
    ],
    evidence: ["Nano Plus is shown as a component of multiple crop- and stage-specific protocols."],
    requiresSupplierVerification: [
      ...commonVerification,
      "Exact guaranteed nutrient and bioactive composition",
    ],
  },
  {
    id: "nanofert-nano-phos",
    name: "Nano Phos",
    supplier: "Nanofert",
    nutrients: ["P"],
    nutrientEvidence:
      "The bean section identifies Nano Phos as the phosphorus product used during flowering.",
    form: "liquid",
    origin: null,
    price: farmerPricePerLiter(63),
    currency: "BRL",
    packageQuantity: 1,
    priceBasis: "per liter",
    priceSource,
    deliveryRegions: [],
    uses: [
      {
        crop: "Beans",
        cropAliases: ["bean", "beans", "feijao", "feijão"],
        compatibleStages: ["flowering", "pod formation"],
        protocolId: "beans-flowering",
        timing: "Flowering to early pod formation, approximately 45-55 days after planting",
        rate: "1 L/ha",
        source: "Nanofert crop-positioning PDF, pages 18-19",
      },
      {
        crop: "Lettuce",
        cropAliases: ["lettuce", "alface"],
        compatibleStages: ["transplant / establishment", "vegetative growth"],
        protocolId: "lettuce-establishment",
        timing: "10-15 days after transplanting",
        rate: "200 mL per 100 L spray mix",
        source: "Nanofert crop-positioning PDF, page 28",
      },
      {
        crop: "Tomatoes",
        cropAliases: ["tomato", "tomatoes", "tomate"],
        compatibleStages: ["vegetative growth", "flowering"],
        protocolId: "tomato-flowering",
        timing: "30 and 45 days after transplanting",
        rate: "1 L/ha",
        source: "Nanofert crop-positioning PDF, page 29",
      },
      {
        crop: "Peppers",
        cropAliases: ["pepper", "peppers", "bell pepper", "pimentao", "pimentão"],
        compatibleStages: ["vegetative growth", "flowering"],
        protocolId: "pepper-flowering",
        timing: "30 and 45 days after transplanting",
        rate: "1 L/ha",
        source: "Nanofert crop-positioning PDF, page 31",
      },
      {
        crop: "Cassava",
        cropAliases: ["cassava", "manioc", "mandioca"],
        compatibleStages: ["tuber initiation"],
        protocolId: "cassava-tuber-initiation",
        timing: "60-120 days after planting",
        rate: "1 L/ha",
        source: "Nanofert crop-positioning PDF, page 30",
      },
      {
        crop: "Grapes",
        cropAliases: ["grape", "grapes", "vineyard", "uva"],
        compatibleStages: ["pre-flowering / flowering", "pre-flowering", "flowering"],
        protocolId: "grapes-flowering",
        timing: "Pre-flowering / flowering",
        rate: null,
        source: "Nanofert crop-positioning PDF, page 34",
      },
      {
        crop: "Grapes",
        cropAliases: ["grape", "grapes", "vineyard", "uva"],
        compatibleStages: ["fruit set", "pea-sized berries", "chumbinho", "meia-baga"],
        protocolId: "grapes-fruit-set",
        timing: "Fruit set / pea-sized to half-sized berries; Oct/2025 in the documented protocol",
        rate: null,
        source: "Nanofert crop-positioning PDF, page 34",
      },
    ],
    evidence: ["Nano Phos is shown in bean, lettuce, tomato, pepper, cassava and grape protocols."],
    requiresSupplierVerification: [...commonVerification, "Exact guaranteed phosphorus analysis"],
  },
  {
    id: "nanofert-nano-kali",
    name: "Nano Kali",
    supplier: "Nanofert",
    nutrients: ["K"],
    nutrientEvidence:
      "The product is identified as Nano Kali in the supplier's crop-stage protocols; exact guaranteed analysis is not supplied.",
    form: "liquid",
    origin: null,
    price: farmerPricePerLiter(58),
    currency: "BRL",
    packageQuantity: 1,
    priceBasis: "per liter",
    priceSource,
    deliveryRegions: [],
    uses: [
      {
        crop: "Lettuce",
        cropAliases: ["lettuce", "alface"],
        compatibleStages: ["head formation / filling"],
        protocolId: "lettuce-filling",
        timing: "20-30 days after transplanting",
        rate: "200 mL per 100 L spray mix",
        source: "Nanofert crop-positioning PDF, page 28",
      },
      {
        crop: "Tomatoes",
        cropAliases: ["tomato", "tomatoes", "tomate"],
        compatibleStages: ["fruit growth", "maturation / harvest"],
        protocolId: "tomato-fruit-growth",
        timing: "75, 90, 105 and 120 days after transplanting",
        rate: "1 L/ha",
        source: "Nanofert crop-positioning PDF, page 29",
      },
      {
        crop: "Peppers",
        cropAliases: ["pepper", "peppers", "bell pepper", "pimentao", "pimentão"],
        compatibleStages: ["fruit growth", "maturation / harvest"],
        protocolId: "pepper-fruit-growth",
        timing: "75, 90, 105 and 120 days after transplanting",
        rate: "1 L/ha",
        source: "Nanofert crop-positioning PDF, page 31",
      },
      {
        crop: "Cassava",
        cropAliases: ["cassava", "manioc", "mandioca"],
        compatibleStages: ["root bulking"],
        protocolId: "cassava-root-bulking",
        timing: "180-220 days after planting",
        rate: "1 L/ha",
        source: "Nanofert crop-positioning PDF, page 30",
      },
      {
        crop: "Grapes",
        cropAliases: ["grape", "grapes", "vineyard", "uva"],
        compatibleStages: ["berry growth", "maturation", "growth / maturation"],
        protocolId: "grapes-maturation",
        timing: "Berry growth / maturation; Oct-Dec/2025 in the documented protocol",
        rate: null,
        source: "Nanofert crop-positioning PDF, page 34",
      },
    ],
    evidence: ["Nano Kali is shown in lettuce, tomato, pepper, cassava and grape protocols."],
    requiresSupplierVerification: [...commonVerification, "Exact guaranteed potassium analysis"],
  },
  {
    id: "nanofert-nano-zin",
    name: "Nano Zin",
    supplier: "Nanofert",
    nutrients: ["Zn"],
    nutrientEvidence:
      "The product is named Nano Zin/Nano Zn in the supplied crop-stage protocols; exact guaranteed analysis is not supplied.",
    form: "liquid",
    origin: null,
    price: farmerPricePerLiter(55),
    currency: "BRL",
    packageQuantity: 1,
    priceBasis: "per liter",
    priceSource,
    deliveryRegions: [],
    uses: [
      {
        crop: "Tomatoes",
        cropAliases: ["tomato", "tomatoes", "tomate"],
        compatibleStages: ["transplant / establishment"],
        protocolId: "tomato-establishment",
        timing: "15 days after transplanting",
        rate: "0.5 L/ha",
        source: "Nanofert crop-positioning PDF, page 29",
      },
      {
        crop: "Peppers",
        cropAliases: ["pepper", "peppers", "bell pepper", "pimentao", "pimentão"],
        compatibleStages: ["transplant / establishment"],
        protocolId: "pepper-establishment",
        timing: "15 days after transplanting",
        rate: "0.5 L/ha",
        source: "Nanofert crop-positioning PDF, page 31",
      },
      {
        crop: "Cassava",
        cropAliases: ["cassava", "manioc", "mandioca"],
        compatibleStages: ["establishment", "vegetative growth"],
        protocolId: "cassava-establishment",
        timing: "30-45 days after planting",
        rate: "0.5 L/ha",
        source: "Nanofert crop-positioning PDF, page 30",
      },
      {
        crop: "Grapes",
        cropAliases: ["grape", "grapes", "vineyard", "uva"],
        compatibleStages: ["bud break", "brotacao", "brotação"],
        protocolId: "grapes-bud-break",
        timing: "Bud break; three applications were reported in Sep/2025",
        rate: null,
        source: "Nanofert crop-positioning PDF, page 34",
      },
    ],
    evidence: ["Nano Zin/Nano Zn is shown in tomato, pepper, cassava and grape protocols."],
    requiresSupplierVerification: [...commonVerification, "Exact guaranteed zinc analysis"],
  },
  {
    id: "nanofert-nano-boro",
    name: "Nano Boro",
    supplier: "Nanofert",
    nutrients: ["B"],
    nutrientEvidence:
      "The product is named Nano Boro in the documented grape protocol; exact guaranteed analysis is not supplied.",
    form: "liquid",
    origin: null,
    price: farmerPricePerLiter(45),
    currency: "BRL",
    packageQuantity: 1,
    priceBasis: "per liter",
    priceSource,
    deliveryRegions: [],
    uses: [
      {
        crop: "Grapes",
        cropAliases: ["grape", "grapes", "vineyard", "uva"],
        compatibleStages: ["pre-flowering / flowering", "pre-flowering", "flowering"],
        protocolId: "grapes-flowering",
        timing: "Pre-flowering / flowering",
        rate: null,
        source: "Nanofert crop-positioning PDF, page 34",
      },
    ],
    evidence: ["Nano Boro is shown in the pre-flowering/flowering grape protocol."],
    requiresSupplierVerification: [
      ...commonVerification,
      "Exact guaranteed boron analysis",
      "Application rate",
    ],
  },
  {
    id: "nanofert-nano-cobre",
    name: "Nano Cobre",
    supplier: "Nanofert",
    nutrients: ["Cu"],
    nutrientEvidence:
      "The product is named Nano Cobre in the documented grape protocol; exact guaranteed analysis is not supplied.",
    form: "liquid",
    origin: null,
    price: farmerPricePerLiter(60),
    currency: "BRL",
    packageQuantity: 1,
    priceBasis: "per liter",
    priceSource: `${priceSource} The table labels this row “Nano CUB”; confirm that it is the Nano Cobre product before purchase.`,
    deliveryRegions: [],
    uses: [
      {
        crop: "Grapes",
        cropAliases: ["grape", "grapes", "vineyard", "uva"],
        compatibleStages: ["fruit set", "pea-sized berries", "chumbinho", "meia-baga"],
        protocolId: "grapes-fruit-set",
        timing: "Fruit set / pea-sized to half-sized berries; Oct/2025 in the documented protocol",
        rate: null,
        source: "Nanofert crop-positioning PDF, page 34",
      },
      {
        crop: "Grapes",
        cropAliases: ["grape", "grapes", "vineyard", "uva"],
        compatibleStages: ["berry growth", "maturation", "growth / maturation"],
        protocolId: "grapes-maturation",
        timing: "Berry growth / maturation; Oct-Dec/2025 in the documented protocol",
        rate: null,
        source: "Nanofert crop-positioning PDF, page 34",
      },
    ],
    evidence: [
      "Nano Cobre is shown at fruit set/berry sizing and again at growth/maturation for grapes.",
    ],
    requiresSupplierVerification: [
      ...commonVerification,
      "Exact guaranteed copper analysis",
      "Application rate",
    ],
  },
  {
    id: "nanofert-nano-n",
    name: "Nano-N",
    supplier: "Nanofert",
    nutrients: ["N"],
    nutrientEvidence:
      "The supplier trial identifies the product as Nano-N; exact guaranteed analysis is not supplied.",
    form: "liquid",
    origin: null,
    price: null,
    currency: null,
    packageQuantity: null,
    priceBasis: null,
    priceSource: null,
    deliveryRegions: [],
    uses: [
      {
        crop: "Sugarcane",
        cropAliases: ["sugarcane", "sugar cane", "cana-de-acucar", "cana-de-açúcar"],
        compatibleStages: [],
        protocolId: "sugarcane-nano-n-dap",
        timing: "Crop lifecycle stage was not stated in the supplied trial summary",
        rate: "2 L/ha",
        source: "Nanofert crop-positioning PDF, page 24",
      },
    ],
    evidence: ["Nano-N 2 L/ha appears in a supplier-reported sugarcane comparison."],
    requiresSupplierVerification: [
      ...commonVerification,
      "Exact guaranteed nitrogen analysis",
      "Application stage",
    ],
  },
  {
    id: "nanofert-nano-dap",
    name: "Nano-DAP",
    supplier: "Nanofert",
    nutrients: [],
    nutrientEvidence:
      "The supplied trial names Nano-DAP but does not provide a guaranteed nutrient analysis.",
    form: "liquid",
    origin: null,
    price: null,
    currency: null,
    packageQuantity: null,
    priceBasis: null,
    priceSource: null,
    deliveryRegions: [],
    uses: [
      {
        crop: "Sugarcane",
        cropAliases: ["sugarcane", "sugar cane", "cana-de-acucar", "cana-de-açúcar"],
        compatibleStages: [],
        protocolId: "sugarcane-nano-n-dap",
        timing: "Crop lifecycle stage was not stated in the supplied trial summary",
        rate: "1 L/ha",
        source: "Nanofert crop-positioning PDF, page 24",
      },
    ],
    evidence: ["Nano-DAP 1 L/ha appears with Nano-N in a supplier-reported sugarcane comparison."],
    requiresSupplierVerification: [
      ...commonVerification,
      "Exact guaranteed nutrient analysis",
      "Application stage",
    ],
  },
];

export function normalizePartnerText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function catalogSupportsCrop(crop: string) {
  const normalized = normalizePartnerText(crop);
  return partnerProducts.some((product) =>
    product.uses.some((use) =>
      use.cropAliases.some((alias) => normalized.includes(normalizePartnerText(alias))),
    ),
  );
}
