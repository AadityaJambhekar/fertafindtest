import assert from "node:assert/strict";
import test from "node:test";
import { partnerProducts } from "./partner-catalog.ts";
import {
  getPartnerStageAvailability,
  recommendPartnerProducts,
} from "./partner-recommendations.ts";
import type { QuoteAnalysis } from "./quote-analysis.ts";

function analysisFor(crop: string, cropStage: string): QuoteAnalysis {
  return {
    id: "test-analysis",
    createdAt: "2026-07-20T00:00:00.000Z",
    location: { displayName: "Test farm", lat: 37.77, lon: -122.42, radiusKm: 50 },
    crop,
    decisionGoal: "balanced",
    preferences: { fertilizerForm: "liquid", fertilizerOrigin: "either" },
    fieldSize: 10,
    unit: "ha",
    farmContext: {
      analysisDate: "2026-07-20",
      plantingDate: "2026-06-01",
      cropStage,
      soilTestAvailable: true,
      soilTestDate: "2026-06-15",
      soilSampleDepthCm: "0-20 cm",
      soilTestMethod: "Laboratory report",
      soilNitrogen: "20 mg/kg",
      soilPhosphorus: "15 mg/kg",
      soilPotassium: "120 mg/kg",
      soilSulfur: "8 mg/kg",
      soilPh: "6.4",
      soilOrganicMatter: "3%",
      soilCec: "12 cmol/kg",
      soilTexture: "Loam",
      soilMicronutrients: { zinc: "1.1 ppm" },
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
      targetNitrogenKgHa: "60",
      targetPhosphorusKgHa: "30",
      targetPotassiumKgHa: "40",
      targetSulfurKgHa: "15",
    },
    weather: {
      observedAt: "2026-07-20T00:00:00.000Z",
      temperatureC: 24,
      humidityPercent: 62,
      rainMm: 0,
      windSpeedKph: 8,
      soilTemperatureC: 20,
      soilMoistureM3M3: 0.25,
      next3DaysRainMm: 4,
      next3DaysMaxTempC: 28,
      next3DaysEt0Mm: 9,
      source: "Open-Meteo",
    },
    agronomy: {
      weatherSummary: "",
      timingGuidance: "",
      soilGuidance: "",
      soilTestSummary: "",
      irrigationGuidance: "",
      caution: "",
    },
    quotes: [],
    warnings: [],
  };
}

function selectedNames(analysis: QuoteAnalysis) {
  return recommendPartnerProducts(analysis)[0]?.selectedProducts.map((item) => item.product.name);
}

test("grapes at fruit set returns the documented Nano Cobre combination", () => {
  const result = recommendPartnerProducts(analysisFor("Grapes", "Grapes: Fruit set"))[0];
  assert.deepEqual(
    result?.selectedProducts.map((item) => item.product.name).sort(),
    ["Nano Cobre", "Nano Phos", "Nano Plus"].sort(),
  );
});

test("grapes at maturation returns Nano Kali and Nano Cobre", () => {
  assert.deepEqual(
    selectedNames(analysisFor("Grapes", "Grapes: Maturation"))?.sort(),
    ["Nano Cobre", "Nano Kali"].sort(),
  );
});

test("corn at V6-V7 evaluates Nano Nitro and Nano Plus", () => {
  assert.deepEqual(
    selectedNames(analysisFor("Corn / Maize", "Corn / Maize: V6-V7"))?.sort(),
    ["Nano Nitro", "Nano Plus"].sort(),
  );
});

test("beans selects the stage-appropriate flowering program", () => {
  assert.deepEqual(
    selectedNames(analysisFor("Beans", "Beans: Flowering"))?.sort(),
    ["Nano Phos", "Nano Plus"].sort(),
  );
});

test("wheat returns no partner recommendation", () => {
  const result = recommendPartnerProducts(analysisFor("Wheat", "Wheat: Grain filling"))[0];
  assert.equal(result?.status, "unsupported");
  assert.equal(result?.quoteComparisonOnly, true);
  assert.deepEqual(result?.selectedProducts, []);
});

test("multiple selected crops return separate recommendations", () => {
  const results = recommendPartnerProducts(
    analysisFor("Corn / Maize, Grapes", "Corn / Maize: V6-V7; Grapes: Maturation"),
  );
  assert.equal(results.length, 2);
  assert.deepEqual(
    results.map((result) => result.crop),
    ["Corn / Maize", "Grapes"],
  );
  assert.deepEqual(
    results[1]?.selectedProducts.map((item) => item.product.name).sort(),
    ["Nano Cobre", "Nano Kali"].sort(),
  );
});

test("a lifecycle conflict prevents a product from being recommended", () => {
  const result = recommendPartnerProducts(analysisFor("Corn / Maize", "Corn / Maize: R1-R3"))[0];
  assert.deepEqual(result?.selectedProducts, []);
  assert.match(result?.summary ?? "", /No documented partner product is compatible/i);
  assert.ok(result?.excluded.some((item) => item.productName === "Nano Nitro"));
  assert.ok(result?.excluded.some((item) => item.productName === "Nano Plus"));
});

test("stage availability distinguishes verified, unverified and uncovered stages", () => {
  assert.equal(getPartnerStageAvailability("Corn / Maize", "V6-V7"), "available");
  assert.equal(getPartnerStageAvailability("Sugarcane", "Grand growth"), "needs-verification");
  assert.equal(getPartnerStageAvailability("Corn / Maize", "R1-R3"), "unavailable");
  assert.equal(getPartnerStageAvailability("Wheat", "Grain filling"), "unavailable");
});

test("an unverified sugarcane lifecycle does not become a matching program", () => {
  const result = recommendPartnerProducts(analysisFor("Sugarcane", "Sugarcane: Grand growth"))[0];
  assert.equal(result?.label, "No partner match");
  assert.deepEqual(result?.selectedProducts, []);
  assert.ok(result?.alternatives.some((item) => item.product.name === "Nano Nitro"));
  assert.ok(result?.alternatives.every((item) => item.stageCompatibility === "unknown"));
});

test("missing supplier rate prevents an estimated per-hectare price", () => {
  const result = recommendPartnerProducts(analysisFor("Grapes", "Grapes: Fruit set"))[0];
  assert.ok(result?.selectedProducts.every((item) => item.estimatedPrice === null));
  assert.ok(result?.selectedProducts.every((item) => item.use.rate === null));
  assert.ok(result?.missingInformation.includes("Application rate"));
});

test("farmer price includes 40 percent markup and calculates a simple per-hectare estimate", () => {
  const result = recommendPartnerProducts(
    analysisFor("Tomatoes", "Tomatoes: Transplant / establishment"),
  )[0];
  const nitro = result?.selectedProducts.find((item) => item.product.name === "Nano Nitro");
  assert.equal(nitro?.product.price, 78.4);
  assert.equal(nitro?.product.currency, "BRL");
  assert.equal(nitro?.estimatedPrice?.amount, 78.4);
});

test("all supplied base prices receive the 40 percent farmer markup", () => {
  const expected = new Map([
    ["Nano Nitro", 78.4],
    ["Nano Phos", 88.2],
    ["Nano Kali", 81.2],
    ["Nano Plus", 81.2],
    ["Nano Zin", 77],
    ["Nano Boro", 63],
    ["Nano Cobre", 84],
  ]);
  for (const [name, price] of expected) {
    assert.equal(partnerProducts.find((product) => product.name === name)?.price, price);
  }
});

test("official deck compositions are preserved without inventing Nano-N or Nano-DAP analyses", () => {
  const analyses = new Map(
    partnerProducts.map((product) => [product.name, product.guaranteedAnalysis]),
  );
  assert.equal(analyses.get("Nano Nitro"), "20:5:5 + 2S");
  assert.equal(analyses.get("Nano Phos"), "8:16:3");
  assert.equal(analyses.get("Nano Kali"), "N 9%, P 9%, K 12% (9:9:12)");
  assert.equal(analyses.get("Nano Zin"), "Zn 2.2%, S 2%");
  assert.equal(analyses.get("Nano Boro"), "B 3.5%, Zn 0.2%");
  assert.equal(analyses.get("Nano Cobre"), "Cu 2.5%, S 1.2%");
  assert.equal(analyses.get("Nano-N"), null);
  assert.equal(analyses.get("Nano-DAP"), null);
});

test("uploaded quotes remain separate from partner recommendations", () => {
  const analysis = analysisFor("Wheat", "Wheat: Grain filling");
  analysis.quotes.push({
    id: "quote-1",
    sourceFile: "quote.pdf",
    product: "Uploaded Urea",
    supplier: "Uploaded supplier",
    npk: [46, 0, 0],
    bagKg: 50,
    pricePerBag: 40,
    deliveryPerT: 0,
    applicationRateKgHa: 100,
    currency: "USD",
    confidence: 0.9,
    notes: "",
    agronomicFit: "not_enough_information",
    fitReason: "Not enough information because the quote lacks a verified rate recommendation.",
    stageFit: "unknown",
    stageReason: "Timing not stated.",
  });
  const result = recommendPartnerProducts(analysis)[0];
  assert.equal(result?.status, "unsupported");
  assert.equal(result?.selectedProducts.length, 0);
  assert.equal(analysis.quotes[0]?.product, "Uploaded Urea");
});

test("a zinc priority selects Nano Zin instead of defaulting to Nano Nitro", () => {
  const analysis = analysisFor("Tomatoes", "Tomatoes: Transplant / establishment");
  analysis.nutrientPlan.priorityNutrients = ["Zn"];
  assert.deepEqual(selectedNames(analysis), ["Nano Zin"]);
});

test("a zinc priority selects micronutrient-focused Nano Plus in the corn V6-V7 program", () => {
  const analysis = analysisFor("Corn / Maize", "Corn / Maize: V6-V7");
  analysis.nutrientPlan.priorityNutrients = ["Zn"];
  assert.deepEqual(selectedNames(analysis), ["Nano Plus"]);
});

test("a nitrogen priority selects Nano Nitro from the same compatible stage", () => {
  const analysis = analysisFor("Tomatoes", "Tomatoes: Transplant / establishment");
  analysis.nutrientPlan.priorityNutrients = ["N"];
  assert.deepEqual(selectedNames(analysis), ["Nano Nitro"]);
});

test("a phosphorus priority selects Nano Phos at tomato flowering", () => {
  const analysis = analysisFor("Tomatoes", "Tomatoes: Flowering");
  analysis.nutrientPlan.priorityNutrients = ["P"];
  assert.deepEqual(selectedNames(analysis), ["Nano Phos"]);
});

test("prior fertilizer applications are included in recommendation factors", () => {
  const analysis = analysisFor("Corn / Maize", "Corn / Maize: V6-V7");
  analysis.farmContext.priorFertilizerApplied = true;
  analysis.farmContext.priorFertilizerApplications = [
    {
      applicationDate: "2026-07-01",
      productAnalysis: "Urea 46-0-0",
      quantity: "50",
      unit: "kg/ha",
    },
  ];
  const [recommendation] = recommendPartnerProducts(analysis);
  const priorFactor = recommendation.selectedProducts
    .flatMap((product) => product.factors)
    .find((factor) => factor.label === "Prior fertilizer");
  assert.ok(priorFactor);
  assert.match(priorFactor.detail, /23\.0 kg\/ha N/);
});

test("certified organic farms never receive products without verified OMRI approval", () => {
  const analysis = analysisFor("Corn / Maize", "V6-V7");
  analysis.preferences = {
    ...analysis.preferences,
    fertilizerOrigin: "organic",
    organicCertification: "certified",
  };
  const [recommendation] = recommendPartnerProducts(analysis);
  assert.equal(recommendation.selectedProducts.length, 0);
  assert.equal(recommendation.alternatives.length, 0);
  assert.match(recommendation.summary, /OMRI approval/);
});
