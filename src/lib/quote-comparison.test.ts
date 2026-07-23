import assert from "node:assert/strict";
import test from "node:test";
import { rankQuotes, showsComparisonRanking } from "./quote-comparison.ts";
import type { AnalyzedQuote, QuoteAnalysis } from "./quote-analysis.ts";

function quote(overrides: Partial<AnalyzedQuote>): AnalyzedQuote {
  return {
    id: "quote",
    sourceFile: "quote.pdf",
    product: "Product",
    supplier: "Supplier",
    npk: [10, 10, 10],
    bagKg: 50,
    pricePerBag: 50,
    deliveryPerT: 0,
    applicationRateKgHa: 100,
    currency: "USD",
    confidence: 0.9,
    notes: "",
    agronomicFit: "suitable",
    fitReason: "",
    stageFit: "compatible",
    stageReason: "",
    ...overrides,
  };
}

function analysisWith(
  quotes: AnalyzedQuote[],
  decisionGoal: QuoteAnalysis["decisionGoal"] = "balanced",
): QuoteAnalysis {
  return {
    id: "analysis",
    createdAt: "2026-07-20T00:00:00.000Z",
    location: {
      displayName: "Test farm",
      lat: 37.77,
      lon: -122.42,
      radiusKm: 50,
    },
    crop: "Corn / Maize",
    decisionGoal,
    preferences: { fertilizerForm: "either", fertilizerOrigin: "either" },
    fieldSize: 10,
    unit: "ha",
    farmContext: {
      analysisDate: "2026-07-20",
      plantingDate: "",
      cropStage: "",
      soilTestAvailable: false,
      soilTestDate: "",
      soilSampleDepthCm: "",
      soilTestMethod: "",
      soilNitrogen: "",
      soilPhosphorus: "",
      soilPotassium: "",
      soilSulfur: "",
      soilPh: "",
      soilOrganicMatter: "",
      soilCec: "",
      soilTexture: "",
      soilMicronutrients: {},
      measuredSoilMoisture: "",
      measuredSoilTemperature: "",
      irrigationStatus: "rain-fed",
      irrigationMethod: "",
      wateringFrequency: "",
      wateringTime: "",
      wateringDurationMinutes: "",
      nextWateringDate: "",
      growerNotes: "",
      priorFertilizerApplied: null,
      priorFertilizerApplications: [],
    },
    nutrientPlan: {
      targetNitrogenKgHa: "",
      targetPhosphorusKgHa: "",
      targetPotassiumKgHa: "",
      targetSulfurKgHa: "",
    },
    weather: null,
    agronomy: {
      weatherSummary: "",
      timingGuidance: "",
      soilGuidance: "",
      soilTestSummary: "",
      irrigationGuidance: "",
      caution: "",
    },
    quotes,
    warnings: [],
  };
}

test("comparison/ranking language is hidden for zero or one quote and shown for two or more", () => {
  assert.equal(showsComparisonRanking(0), false);
  assert.equal(showsComparisonRanking(1), false);
  assert.equal(showsComparisonRanking(2), true);
  assert.equal(showsComparisonRanking(8), true);
});

test("ranking a single quote returns just that quote with a finite score", () => {
  const only = quote({ id: "only", product: "Urea", npk: [46, 0, 0] });
  const ranked = rankQuotes(analysisWith([only]));
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0]?.q.id, "only");
  assert.ok(Number.isFinite(ranked[0]?.decisionScore));
});

test("a priced, comparable quote always outranks a quote with no usable price basis", () => {
  const priced = quote({
    id: "priced",
    npk: [46, 0, 0],
    bagKg: 50,
    pricePerBag: 40,
  });
  const noBasis = quote({
    id: "no-basis",
    npk: [46, 0, 0],
    bagKg: null,
    pricePerBag: null,
  });
  const ranked = rankQuotes(analysisWith([noBasis, priced]));
  assert.equal(ranked[0]?.q.id, "priced");
});

test("multi-quote cost-goal comparison ranks the lower nutrient cost first (no regression)", () => {
  const cheap = quote({
    id: "cheap",
    npk: [46, 0, 0],
    bagKg: 50,
    pricePerBag: 40,
  });
  const dear = quote({
    id: "dear",
    npk: [46, 0, 0],
    bagKg: 50,
    pricePerBag: 80,
  });
  const ranked = rankQuotes(analysisWith([dear, cheap], "cost"));
  assert.equal(ranked[0]?.q.id, "cheap");
});
