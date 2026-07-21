export type AnalyzedQuote = {
  id: string;
  sourceFile: string;
  product: string;
  supplier: string;
  npk: [number, number, number];
  bagKg: number | null;
  pricePerBag: number | null;
  deliveryPerT: number | null;
  applicationRateKgHa: number | null;
  currency: string;
  confidence: number;
  notes: string;
  agronomicFit: "suitable" | "caution" | "not_enough_information";
  fitReason: string;
  stageFit: "compatible" | "incompatible" | "unknown";
  stageReason: string;
};

export type FarmContext = {
  analysisDate: string;
  plantingDate: string;
  cropStage: string;
  soilTestAvailable: boolean;
  soilTestDate: string;
  soilSampleDepthCm: string;
  soilTestMethod: string;
  soilNitrogen: string;
  soilPhosphorus: string;
  soilPotassium: string;
  soilPh: string;
  soilOrganicMatter: string;
  soilCec: string;
  soilTexture: string;
  measuredSoilMoisture: string;
  measuredSoilTemperature: string;
  irrigationStatus: string;
  irrigationMethod: string;
  wateringFrequency: string;
  wateringTime: string;
  wateringDurationMinutes: string;
  nextWateringDate: string;
  growerNotes: string;
};

export type NutrientPlan = {
  targetNitrogenKgHa: string;
  targetPhosphorusKgHa: string;
  targetPotassiumKgHa: string;
  priorityNutrients?: Array<"N" | "P" | "K" | "Zn">;
};

export type AgronomyGuidance = {
  weatherSummary: string;
  timingGuidance: string;
  soilGuidance: string;
  soilTestSummary: string;
  irrigationGuidance: string;
  caution: string;
  factorChecks?: {
    location: AnalysisFactorCheck;
    fieldSize: AnalysisFactorCheck;
    decisionGoal: AnalysisFactorCheck;
    cropStage: AnalysisFactorCheck;
    soil: AnalysisFactorCheck;
    weather: AnalysisFactorCheck;
    irrigation: AnalysisFactorCheck;
    nutrientTargets: AnalysisFactorCheck;
    productPreferences: AnalysisFactorCheck;
  };
};

export type AnalysisFactorCheck = {
  status: "used" | "missing" | "caution";
  effect: string;
};

export type QuoteAnalysis = {
  id: string;
  createdAt: string;
  location: {
    displayName: string;
    lat: number;
    lon: number;
    radiusKm: number;
  };
  crop: string;
  decisionGoal: "yield" | "cost" | "balanced";
  preferences: {
    fertilizerForm: "liquid" | "dry" | "either";
    fertilizerOrigin: "organic" | "synthetic" | "either";
  };
  fieldSize: number;
  unit: "ha" | "ac";
  farmContext: FarmContext;
  nutrientPlan: NutrientPlan;
  weather: {
    observedAt: string;
    temperatureC: number | null;
    humidityPercent: number | null;
    rainMm: number | null;
    windSpeedKph: number | null;
    soilTemperatureC: number | null;
    soilMoistureM3M3: number | null;
    next3DaysRainMm: number | null;
    next3DaysMaxTempC: number | null;
    next3DaysEt0Mm: number | null;
    source: "Open-Meteo";
  } | null;
  agronomy: AgronomyGuidance;
  quotes: AnalyzedQuote[];
  warnings: string[];
};

export const analysisStorageKey = (id: string) => `fertafind-analysis:${id}`;
