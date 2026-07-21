import { normalizePartnerText, partnerProducts } from "./partner-catalog.ts";
import type { NutrientCode, PartnerProduct, PartnerProductUse } from "./partner-catalog.ts";
import type { QuoteAnalysis } from "./quote-analysis.ts";

export type RecommendationFactor = {
  label: string;
  status: "used" | "missing" | "caution";
  detail: string;
};

export type ScoreComponent = {
  label: string;
  points: number;
  detail: string;
};

export type EvaluatedPartnerProduct = {
  product: PartnerProduct;
  use: PartnerProductUse;
  stageCompatibility: "compatible" | "unknown";
  score: number;
  scoreComponents: ScoreComponent[];
  suitability: "compatible" | "needs-verification";
  whySelected: string[];
  missingInformation: string[];
  factors: RecommendationFactor[];
  estimatedPrice: {
    amount: number;
    currency: "BRL";
    basis: "per hectare at the documented single-application rate";
  } | null;
};

export type ExcludedPartnerProduct = {
  productName: string;
  reason: string;
};

export type CropPartnerRecommendation = {
  crop: string;
  lifecycleStage: string;
  supplier: "Nanofert" | null;
  status: "matching" | "needs-verification" | "unsupported";
  label:
    | "Best compatible partner option"
    | "Matching partner program"
    | "Available compatible option"
    | "No partner match";
  summary: string;
  selectedProducts: EvaluatedPartnerProduct[];
  alternatives: EvaluatedPartnerProduct[];
  excluded: ExcludedPartnerProduct[];
  factorsUsed: RecommendationFactor[];
  missingInformation: string[];
  sufficientlyCompleteComparisons: number;
  quoteComparisonOnly: boolean;
};

type CropSelection = { crop: string; stage: string };

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function parseCropSelections(crops: string, cropStages: string): CropSelection[] {
  const stageMap = new Map<string, string>();
  for (const segment of cropStages.split(";")) {
    const [rawCrop, ...rawStage] = segment.split(":");
    if (!rawCrop?.trim()) continue;
    stageMap.set(normalizePartnerText(rawCrop), rawStage.join(":").trim());
  }

  return crops
    .split(",")
    .map((crop) => crop.trim())
    .filter(Boolean)
    .map((crop) => {
      const normalizedCrop = normalizePartnerText(crop);
      const exactStage = stageMap.get(normalizedCrop);
      const fuzzyStage = [...stageMap.entries()].find(
        ([key]) => key.includes(normalizedCrop) || normalizedCrop.includes(key),
      )?.[1];
      return { crop, stage: exactStage || fuzzyStage || "Not sure" };
    });
}

function useMatchesCrop(use: PartnerProductUse, crop: string) {
  const normalizedCrop = normalizePartnerText(crop);
  return use.cropAliases.some((alias) => {
    const normalizedAlias = normalizePartnerText(alias);
    return normalizedCrop.includes(normalizedAlias) || normalizedAlias.includes(normalizedCrop);
  });
}

function stageMatch(use: PartnerProductUse, stage: string) {
  const normalizedStage = normalizePartnerText(stage);
  if (!normalizedStage || normalizedStage === "not sure") return "unknown" as const;
  if (!use.compatibleStages.length) return "unknown" as const;
  return use.compatibleStages.some((candidate) => {
    const normalizedCandidate = normalizePartnerText(candidate);
    return (
      normalizedStage === normalizedCandidate ||
      normalizedStage.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedStage)
    );
  })
    ? ("compatible" as const)
    : ("conflict" as const);
}

function targetNutrients(analysis: QuoteAnalysis) {
  const explicitPriorities = analysis.nutrientPlan?.priorityNutrients?.filter(
    (nutrient): nutrient is "N" | "P" | "K" | "Zn" => ["N", "P", "K", "Zn"].includes(nutrient),
  );
  if (explicitPriorities?.length) return [...new Set(explicitPriorities)];

  const pairs: Array<[NutrientCode, string]> = [
    ["N", analysis.nutrientPlan?.targetNitrogenKgHa],
    ["P", analysis.nutrientPlan?.targetPhosphorusKgHa],
    ["K", analysis.nutrientPlan?.targetPotassiumKgHa],
  ];
  return pairs.flatMap(([nutrient, value]) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? [nutrient] : [];
  });
}

function hasLaboratorySoil(analysis: QuoteAnalysis) {
  const context = analysis.farmContext;
  return Boolean(
    context?.soilTestAvailable &&
    [
      context.soilNitrogen,
      context.soilPhosphorus,
      context.soilPotassium,
      context.soilPh,
      context.soilOrganicMatter,
      context.soilCec,
      context.soilTexture,
    ].some((value) => value?.trim()),
  );
}

function weatherFactors(analysis: QuoteAnalysis) {
  const warnings: string[] = [];
  const weather = analysis.weather;
  if (!weather) return { warnings: ["Live weather was unavailable."], points: -3 };
  if (weather.next3DaysRainMm != null && weather.next3DaysRainMm >= 25) {
    warnings.push(`${weather.next3DaysRainMm.toFixed(1)} mm of rain is forecast over three days.`);
  }
  if (weather.windSpeedKph != null && weather.windSpeedKph >= 20) {
    warnings.push(`Wind is ${weather.windSpeedKph.toFixed(1)} km/h.`);
  }
  if (weather.next3DaysMaxTempC != null && weather.next3DaysMaxTempC >= 32) {
    warnings.push(
      `The three-day maximum temperature is ${weather.next3DaysMaxTempC.toFixed(1)}°C.`,
    );
  }
  if (weather.soilMoistureM3M3 != null && weather.soilMoistureM3M3 >= 0.45) {
    warnings.push("Modeled surface soil moisture is high.");
  }
  return { warnings, points: warnings.length ? -5 : 3 };
}

function simpleLitersPerHectare(rate: string | null) {
  if (!rate) return null;
  const match = rate.trim().match(/^(\d+(?:\.\d+)?)\s*L\/ha$/i);
  if (!match) return null;
  const liters = Number(match[1]);
  return Number.isFinite(liters) && liters > 0 ? liters : null;
}

function evaluateProduct(
  product: PartnerProduct,
  use: PartnerProductUse,
  stage: string,
  analysis: QuoteAnalysis,
): EvaluatedPartnerProduct | null {
  const stageStatus = stageMatch(use, stage);
  if (stageStatus === "conflict") return null;

  const scoreComponents: ScoreComponent[] = [
    {
      label: "Verified crop match",
      points: 40,
      detail: `${product.name} is documented for ${use.crop}.`,
    },
  ];
  const whySelected = [`Verified in the supplier document for ${use.crop}.`];
  const factors: RecommendationFactor[] = [];
  const missingInformation = [...product.requiresSupplierVerification];

  if (stageStatus === "compatible") {
    scoreComponents.push({
      label: "Lifecycle match",
      points: 30,
      detail: `${stage} matches the documented timing: ${use.timing}.`,
    });
    whySelected.push(`The selected ${stage} stage matches the documented application window.`);
    factors.push({ label: "Lifecycle", status: "used", detail: `${stage} matched ${use.timing}.` });
  } else {
    scoreComponents.push({
      label: "Lifecycle not verified",
      points: 5,
      detail: `The document does not state a lifecycle window that confirms ${stage}.`,
    });
    missingInformation.push("Lifecycle-stage confirmation");
    factors.push({
      label: "Lifecycle",
      status: "caution",
      detail: `The supplier document does not confirm ${stage} for this use.`,
    });
  }

  const targets = targetNutrients(analysis);
  const matchingTargets = product.nutrients.filter((nutrient) => targets.includes(nutrient));
  if (matchingTargets.length) {
    const points = Math.min(24, matchingTargets.length * 12);
    scoreComponents.push({
      label: "Nutrient-target relevance",
      points,
      detail: `${matchingTargets.join(", ")} appears in the grower's positive target plan.`,
    });
    whySelected.push(
      `Its verified nutrient role aligns with the ${matchingTargets.join(", ")} target.`,
    );
    factors.push({
      label: "Nutrient priorities",
      status: "used",
      detail: `${matchingTargets.join(", ")} target relevance increased the score.`,
    });
  } else if (targets.length) {
    factors.push({
      label: "Nutrient priorities",
      status: "caution",
      detail: `The supplied target plan was checked, but this product's verified nutrient role does not directly match ${targets.join(", ")}.`,
    });
  } else {
    factors.push({
      label: "Nutrient priorities",
      status: "missing",
      detail: "No nutrient priority or positive target N, P or K rate was supplied.",
    });
    missingInformation.push("Target N-P-K plan");
  }

  if (hasLaboratorySoil(analysis)) {
    factors.push({
      label: "Laboratory soil",
      status: "used",
      detail:
        "Laboratory values were present, but the catalog does not contain verified product thresholds; no unsupported soil prescription was inferred.",
    });
  } else {
    factors.push({
      label: "Laboratory soil",
      status: "missing",
      detail: "No usable laboratory soil result was supplied.",
    });
    missingInformation.push("Usable laboratory soil results");
  }

  const weather = weatherFactors(analysis);
  scoreComponents.push({
    label: "Application conditions",
    points: weather.points,
    detail: weather.warnings.length
      ? weather.warnings.join(" ")
      : "No heavy-rain, high-wind, high-heat or saturated-soil flag was detected.",
  });
  factors.push({
    label: "Weather and soil moisture",
    status: weather.warnings.length ? "caution" : "used",
    detail: weather.warnings.length
      ? weather.warnings.join(" ")
      : "Current weather and modeled surface-soil conditions produced no timing flag.",
  });

  const irrigation = analysis.farmContext?.irrigationStatus;
  if (!irrigation) {
    factors.push({
      label: "Watering",
      status: "missing",
      detail: "Watering status was not supplied.",
    });
    missingInformation.push("Watering status and timing");
  } else if (
    irrigation !== "rain-fed" &&
    (!analysis.farmContext.irrigationMethod?.trim() ||
      !analysis.farmContext.wateringFrequency?.trim())
  ) {
    factors.push({
      label: "Watering",
      status: "caution",
      detail: "Irrigation is used or planned, but method or frequency is incomplete.",
    });
    missingInformation.push("Complete irrigation method and frequency");
  } else {
    factors.push({
      label: "Watering",
      status: "used",
      detail:
        irrigation === "rain-fed"
          ? "The field was assessed as rain-fed."
          : `${analysis.farmContext.irrigationMethod} at ${analysis.farmContext.wateringFrequency} was considered for application timing.`,
    });
  }

  const formPreference = analysis.preferences?.fertilizerForm ?? "either";
  if (formPreference === "liquid") {
    scoreComponents.push({
      label: "Form preference",
      points: 5,
      detail:
        "The documented L/ha or mL rate confirms a liquid product and matches the preference.",
    });
    factors.push({
      label: "Form preference",
      status: "used",
      detail: "Liquid preference matched.",
    });
  } else if (formPreference === "dry") {
    scoreComponents.push({
      label: "Form preference",
      points: -10,
      detail: "The product is documented as liquid, while dry/granular was preferred.",
    });
    factors.push({
      label: "Form preference",
      status: "caution",
      detail: "The product is liquid and does not match the dry/granular preference.",
    });
  }

  const originPreference = analysis.preferences?.fertilizerOrigin ?? "either";
  if (originPreference !== "either") {
    scoreComponents.push({
      label: "Origin classification unknown",
      points: -4,
      detail: `The document does not verify whether the product is ${originPreference}.`,
    });
    factors.push({
      label: "Organic/synthetic preference",
      status: "caution",
      detail: `The ${originPreference} preference could not be verified from the supplier document.`,
    });
    missingInformation.push("Verified organic or synthetic classification");
  }

  if (!use.rate) missingInformation.push("Application rate");
  if (!product.price || !product.currency || !product.packageQuantity) {
    missingInformation.push("Current price, currency and liter basis");
    factors.push({
      label: "Price",
      status: "missing",
      detail:
        "No verified product price, currency and package quantity are available, so price did not affect ranking.",
    });
  } else {
    factors.push({
      label: "Price",
      status: "used",
      detail: `${product.currency} ${product.price.toFixed(2)} per liter includes the supplied 40% farmer markup.`,
    });
  }
  if (!product.deliveryRegions.length) {
    factors.push({
      label: "Availability",
      status: "missing",
      detail: "Supplier delivery coverage is not verified for this farm.",
    });
  }

  const dedupedMissing = unique(missingInformation);
  const score = Math.max(
    0,
    Math.min(
      100,
      scoreComponents.reduce((total, component) => total + component.points, 0),
    ),
  );
  const litersPerHectare = simpleLitersPerHectare(use.rate);
  const estimatedPrice =
    litersPerHectare && product.price && product.currency === "BRL"
      ? {
          amount: Math.round(litersPerHectare * product.price * 100) / 100,
          currency: product.currency,
          basis: "per hectare at the documented single-application rate" as const,
        }
      : null;

  return {
    product,
    use,
    stageCompatibility: stageStatus,
    score,
    scoreComponents,
    suitability: dedupedMissing.length ? "needs-verification" : "compatible",
    whySelected,
    missingInformation: dedupedMissing,
    factors,
    estimatedPrice,
  };
}

function comparisonComplete(product: EvaluatedPartnerProduct) {
  return Boolean(
    product.suitability === "compatible" &&
    product.use.rate &&
    product.product.price &&
    product.product.currency &&
    product.product.packageQuantity &&
    product.product.deliveryRegions.length,
  );
}

function aggregateFactors(products: EvaluatedPartnerProduct[]) {
  const byLabel = new Map<string, RecommendationFactor>();
  for (const factor of products.flatMap((product) => product.factors)) {
    const current = byLabel.get(factor.label);
    if (!current || (current.status === "used" && factor.status !== "used")) {
      byLabel.set(factor.label, factor);
    }
  }
  return [...byLabel.values()];
}

export function recommendPartnerProducts(analysis: QuoteAnalysis): CropPartnerRecommendation[] {
  return parseCropSelections(analysis.crop, analysis.farmContext?.cropStage ?? "").map(
    ({ crop, stage }) => {
      const cropUses = partnerProducts.flatMap((product) =>
        product.uses.filter((use) => useMatchesCrop(use, crop)).map((use) => ({ product, use })),
      );

      if (!cropUses.length) {
        return {
          crop,
          lifecycleStage: stage,
          supplier: null,
          status: "unsupported",
          label: "No partner match",
          summary:
            "No participating partner product currently has a verified crop program for this crop. Uploaded products remain available only in Quote comparison.",
          selectedProducts: [],
          alternatives: [],
          excluded: [],
          factorsUsed: [],
          missingInformation: [],
          sufficientlyCompleteComparisons: 0,
          quoteComparisonOnly: true,
        };
      }

      const evaluated: EvaluatedPartnerProduct[] = [];
      const excluded: ExcludedPartnerProduct[] = [];
      for (const { product, use } of cropUses) {
        const result = evaluateProduct(product, use, stage, analysis);
        if (result) evaluated.push(result);
        else {
          excluded.push({
            productName: product.name,
            reason: `${stage} conflicts with the documented timing (${use.timing}).`,
          });
        }
      }

      const bestByProduct = new Map<string, EvaluatedPartnerProduct>();
      for (const candidate of evaluated) {
        const current = bestByProduct.get(candidate.product.id);
        if (!current || candidate.score > current.score)
          bestByProduct.set(candidate.product.id, candidate);
      }
      const candidates = [...bestByProduct.values()];
      const stageCompatibleCandidates = candidates.filter(
        (candidate) => candidate.stageCompatibility === "compatible",
      );
      const protocolGroups = new Map<string, EvaluatedPartnerProduct[]>();
      for (const candidate of stageCompatibleCandidates) {
        const group = protocolGroups.get(candidate.use.protocolId) ?? [];
        group.push(candidate);
        protocolGroups.set(candidate.use.protocolId, group);
      }
      const rankedGroups = [...protocolGroups.values()].sort((a, b) => {
        const average = (items: EvaluatedPartnerProduct[]) =>
          items.reduce((total, item) => total + item.score, 0) / items.length;
        return average(b) - average(a) || b.length - a.length;
      });

      const stageKnown = normalizePartnerText(stage) !== "not sure";
      const priorities = analysis.nutrientPlan?.priorityNutrients ?? [];
      const leadingGroup = rankedGroups[0] ?? [];
      const priorityMatches = priorities.length
        ? leadingGroup.filter((candidate) =>
            candidate.product.nutrients.some((nutrient) =>
              priorities.includes(nutrient as "N" | "P" | "K" | "Zn"),
            ),
          )
        : leadingGroup;
      const selectedProducts = stageKnown
        ? [...(priorityMatches.length ? priorityMatches : leadingGroup)].sort(
            (a, b) => b.score - a.score,
          )
        : [];
      const selectedIds = new Set(selectedProducts.map((product) => product.product.id));
      const alternatives = candidates
        .filter((product) => !selectedIds.has(product.product.id))
        .sort((a, b) => b.score - a.score);
      const completeComparisons = rankedGroups.filter((group) =>
        group.every(comparisonComplete),
      ).length;
      const missingInformation = unique(
        selectedProducts.flatMap((product) => product.missingInformation),
      );
      const needsVerification = selectedProducts.some(
        (product) => product.suitability === "needs-verification",
      );
      const label = !selectedProducts.length
        ? "No partner match"
        : completeComparisons >= 2
          ? "Best compatible partner option"
          : selectedProducts.length > 1
            ? "Matching partner program"
            : "Available compatible option";

      return {
        crop,
        lifecycleStage: stage,
        supplier: "Nanofert",
        status: needsVerification || !selectedProducts.length ? "needs-verification" : "matching",
        label,
        summary: !stageKnown
          ? "Select a lifecycle stage before choosing among the documented partner products."
          : selectedProducts.length
            ? `${selectedProducts.map((item) => item.product.name).join(" + ")} matches the documented ${crop} protocol for ${stage}. Missing commercial or label information must still be confirmed.`
            : candidates.some((candidate) => candidate.stageCompatibility === "unknown")
              ? `Partner products are documented for ${crop}, but the supplier source does not verify their use at ${stage}. Confirm the lifecycle stage with the supplier before treating any product as a recommendation.`
              : `No documented partner product is compatible with ${crop} at ${stage}.`,
        selectedProducts,
        alternatives,
        excluded,
        factorsUsed: aggregateFactors(selectedProducts),
        missingInformation,
        sufficientlyCompleteComparisons: completeComparisons,
        quoteComparisonOnly: false,
      };
    },
  );
}
