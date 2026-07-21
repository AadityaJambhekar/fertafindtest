import assert from "node:assert/strict";
import test from "node:test";
import { partnerProducts } from "./partner-catalog.ts";
import { recommendPartnerProducts } from "./partner-recommendations.ts";
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
      soilPh: "6.4",
      soilOrganicMatter: "3%",
      soilCec: "12 cmol/kg",
      soilTexture: "Loam",
      measuredSoilMoisture: "",
      measuredSoilTemperature: "",
      irrigationStatus: "rain-fed",
      irrigationMethod: "",
      wateringFrequency: "",
      wateringTime: "",
      wateringDurationMinutes: "",
      nextWateringDate: "",
      growerNotes: "",
    },
    nutrientPlan: {
      targetNitrogenKgHa: "60",
      targetPhosphorusKgHa: "30",
      targetPotassiumKgHa: "40",
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
  assert.ok(result?.excluded.some((item) => item.productName === "Nano Nitro"));
  assert.ok(result?.excluded.some((item) => item.productName === "Nano Plus"));
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
