import type { QuoteAnalysis } from "@/lib/quote-analysis";

export type PartnerProgram = {
  supplier: string;
  title: string;
  cropLabel: string;
  aliases: string[];
  rate: string;
  timing: string;
  evidence: string;
  sourceNote: string;
  preferredStagePatterns?: string[];
  plantingDayWindows?: Array<[number, number]>;
};

const programs: PartnerProgram[] = [
  {
    supplier: "Nanofert",
    title: "Nano Nitro + Nano Plus",
    cropLabel: "Corn / Maize",
    aliases: ["corn", "maize", "milho"],
    rate: "Nano Nitro 1 L/ha + Nano Plus 0.5 L/ha",
    timing: "V6–V7, approximately 35–40 days after emergence",
    evidence:
      "Supplier-reported average gain of 8.8 sc/ha across 11 commercial corn areas in 2025/26.",
    sourceNote:
      "Based on Nanofert supplier positioning data. Field results are not guaranteed and the final program should be confirmed locally.",
    preferredStagePatterns: ["v6–v7", "v6-v7"],
  },
  {
    supplier: "Nanofert",
    title: "Nano Nitro + Nano Plus",
    cropLabel: "Soybean",
    aliases: ["soybean", "soy", "soya", "soja"],
    rate: "Nano Nitro 1 L/ha + Nano Plus 0.5 L/ha",
    timing: "Reproductive stage; confirm the exact timing locally",
    evidence:
      "Supplier-reported average gain of 3.5 sc/ha, with a positive response in 87% of 112 commercial areas.",
    sourceNote:
      "Based on Nanofert supplier positioning data. Field results are not guaranteed and the final program should be confirmed locally.",
    preferredStagePatterns: ["r1–r2", "r3–r4", "r5–r8", "reproductive"],
  },
  {
    supplier: "Nanofert",
    title: "Nano Nitro, Nano Phos + Nano Plus",
    cropLabel: "Beans",
    aliases: ["bean", "beans", "feijao", "feijão"],
    rate:
      "Nano Nitro 1 L/ha, followed by Nano Phos 1 L/ha + Nano Plus 0.5 L/ha",
    timing: "20–30 days after planting, then 45–55 days after planting",
    evidence: "Supplier-reported average gain of 6.4 sc/ha across 6 commercial farms.",
    sourceNote:
      "Based on Nanofert supplier positioning data. Field results are not guaranteed and the final program should be confirmed locally.",
    plantingDayWindows: [[20, 30], [45, 55]],
  },
  {
    supplier: "Nanofert",
    title: "Nano Nitro + Nano Plus",
    cropLabel: "Pasture",
    aliases: ["pasture", "grassland", "grazing"],
    rate: "Nano Nitro 1 L/ha + Nano Plus 0.5 L/ha",
    timing: "Supplier program indicates applications in Nov/Dec and Feb/Mar",
    evidence: "Nanofert supplier positioning program for pasture management.",
    sourceNote:
      "Based on Nanofert supplier positioning data. Field results are not guaranteed and the final program should be confirmed locally.",
  },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function findPartnerProgram(crops: string) {
  const normalized = normalize(crops);
  return programs.find((program) =>
    program.aliases.some((alias) => normalized.includes(normalize(alias))),
  );
}

export type PartnerAssessment = {
  status: "supported" | "caution" | "insufficient";
  label: string;
  summary: string;
  checks: string[];
};

function hasPositiveTarget(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

/**
 * Separates a crop/catalog match from a field-ready recommendation.
 * The thresholds here only flag timing/data-quality risks; they do not invent
 * a nutrient prescription or replace the supplier label/local agronomist.
 */
export function assessPartnerProgram(
  program: PartnerProgram,
  analysis: QuoteAnalysis,
): PartnerAssessment {
  const context = analysis.farmContext;
  const weather = analysis.weather;
  const checks: string[] = [];
  let status: PartnerAssessment["status"] = "supported";

  const labValues = context
    ? [
        context.soilNitrogen,
        context.soilPhosphorus,
        context.soilPotassium,
        context.soilPh,
        context.soilOrganicMatter,
        context.soilCec,
        context.soilTexture,
      ].filter((value) => value?.trim()).length
    : 0;
  const hasLabSoil = Boolean(context?.soilTestAvailable && labValues > 0);
  const hasNutrientPlan = [
    analysis.nutrientPlan?.targetNitrogenKgHa,
    analysis.nutrientPlan?.targetPhosphorusKgHa,
    analysis.nutrientPlan?.targetPotassiumKgHa,
  ].some(hasPositiveTarget);

  if (!hasLabSoil) {
    status = "insufficient";
    checks.push("No usable laboratory soil values were supplied, so nutrient suitability is not confirmed.");
  } else {
    checks.push(`${labValues} laboratory soil factor${labValues === 1 ? " was" : "s were"} included in the analysis.`);
  }

  if (!hasNutrientPlan) {
    status = "insufficient";
    checks.push("No positive target N, P or K rate was supplied, so the program cannot be called the best nutrient match.");
  } else {
    checks.push("The grower's target nutrient plan was included in the field check.");
  }

  if (!context?.cropStage?.trim() && !context?.plantingDate?.trim()) {
    if (status === "supported") status = "caution";
    checks.push("Crop stage and planting date were not supplied; confirm the application window.");
  }

  const normalizedStage = normalize(context?.cropStage || "");
  if (program.preferredStagePatterns?.length) {
    const stageKnown = normalizedStage && !normalizedStage.includes("not sure");
    const matchesStage = program.preferredStagePatterns.some((pattern) =>
      normalizedStage.includes(normalize(pattern)),
    );
    if (!stageKnown) {
      if (status === "supported") status = "caution";
      checks.push(`The selected lifecycle stage is unknown; the supplier window is ${program.timing}.`);
    } else if (!matchesStage) {
      if (status === "supported") status = "caution";
      checks.push(`The selected lifecycle stage does not match the supplier's stated window (${program.timing}).`);
    } else {
      checks.push(`The selected lifecycle stage matches the supplier's stated application window (${program.timing}).`);
    }
  }

  if (program.plantingDayWindows?.length) {
    const plantingTime = context?.plantingDate ? Date.parse(`${context.plantingDate}T00:00:00Z`) : NaN;
    const analysisTime = context?.analysisDate ? Date.parse(`${context.analysisDate}T00:00:00Z`) : NaN;
    if (Number.isFinite(plantingTime) && Number.isFinite(analysisTime)) {
      const daysAfterPlanting = Math.floor((analysisTime - plantingTime) / 86_400_000);
      const inWindow = program.plantingDayWindows.some(([start, end]) =>
        daysAfterPlanting >= start && daysAfterPlanting <= end,
      );
      if (!inWindow) {
        if (status === "supported") status = "caution";
        checks.push(`The field is about ${daysAfterPlanting} days after planting, outside the supplier's stated windows (${program.timing}).`);
      } else {
        checks.push(`The field is about ${daysAfterPlanting} days after planting, within a stated supplier window.`);
      }
    } else {
      if (status === "supported") status = "caution";
      checks.push(`A planting date is needed to compare this program with its stated windows (${program.timing}).`);
    }
  }

  const timingFlags: string[] = [];
  if (weather?.next3DaysRainMm != null && weather.next3DaysRainMm >= 25) {
    timingFlags.push(`${weather.next3DaysRainMm.toFixed(1)} mm of rain is forecast over 3 days`);
  }
  if (weather?.windSpeedKph != null && weather.windSpeedKph >= 20) {
    timingFlags.push(`current wind is ${weather.windSpeedKph.toFixed(1)} km/h`);
  }
  if (weather?.next3DaysMaxTempC != null && weather.next3DaysMaxTempC >= 32) {
    timingFlags.push(`the 3-day maximum is ${weather.next3DaysMaxTempC.toFixed(1)}°C`);
  }
  if (timingFlags.length) {
    if (status === "supported") status = "caution";
    checks.push(`Timing check: ${timingFlags.join("; ")}. Confirm label-safe application conditions.`);
  } else if (weather) {
    checks.push("No heavy-rain, high-wind or high-heat timing flag was detected from the fetched weather snapshot.");
  } else {
    if (status === "supported") status = "caution";
    checks.push("Live weather was unavailable, so application conditions were not verified.");
  }

  if (context?.irrigationStatus && context.irrigationStatus !== "rain-fed") {
    if (!context.irrigationMethod?.trim() || !context.wateringFrequency?.trim()) {
      if (status === "supported") status = "caution";
      checks.push("Irrigation is planned or used, but method/frequency details are incomplete.");
    } else {
      checks.push(`Irrigation context (${context.irrigationMethod}, ${context.wateringFrequency}) was included.`);
    }
  } else if (context?.irrigationStatus === "rain-fed") {
    checks.push("The field was assessed as rain-fed.");
  }

  if (status === "insufficient") {
    return {
      status,
      label: "Partner crop match — more data needed",
      summary: `${program.title} matches the selected ${program.cropLabel.toLowerCase()} crop in the partner catalog, but the available field data is not enough to call it the best agronomic option.`,
      checks,
    };
  }
  if (status === "caution") {
    return {
      status,
      label: "Partner match — timing caution",
      summary: `${program.title} matches the crop, but current or missing field conditions affect the application decision. Review the checks below before buying or applying it.`,
      checks,
    };
  }
  return {
    status,
    label: "Field-checked partner match",
    summary: `${program.title} matches the crop and no major timing flag was detected from the soil, nutrient-plan, weather and irrigation data supplied.`,
    checks,
  };
}
