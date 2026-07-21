import { createFileRoute } from "@tanstack/react-router";
import type { AnalyzedQuote, AgronomyGuidance, QuoteAnalysis } from "@/lib/quote-analysis";
import { getQuoteFileDescriptor, MAX_QUOTE_FILES, quoteFileError } from "@/lib/quote-files";
import { getFarmWeather } from "@/lib/weather";

const MAX_REQUEST_BYTES = 82 * 1024 * 1024;
const ANALYSIS_LIMIT = 3;
const ANALYSIS_WINDOW_MS = 10 * 60 * 1000;
const analysisAttempts = new Map<string, number[]>();
const GOOGLE_TEST_SECRET = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

type RecaptchaResult = {
  success: boolean;
  hostname?: string;
  "error-codes"?: string[];
};

function requestIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

function consumeAnalysisAttempt(ip: string) {
  const now = Date.now();
  const recent = (analysisAttempts.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < ANALYSIS_WINDOW_MS,
  );
  if (recent.length >= ANALYSIS_LIMIT) {
    analysisAttempts.set(ip, recent);
    return false;
  }
  recent.push(now);
  analysisAttempts.set(ip, recent);
  return true;
}

async function verifyRecaptcha(request: Request, token: string) {
  const url = new URL(request.url);
  const isLocal = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  const secret = isLocal ? GOOGLE_TEST_SECRET : process.env.RECAPTCHA_SECRET_KEY || "";
  if (!secret) return { configured: false, valid: false };

  const body = new URLSearchParams({ secret, response: token });
  const ip = requestIp(request);
  if (ip !== "local") body.set("remoteip", ip);

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(8_000),
    });
    const result = (await response.json()) as RecaptchaResult;
    const expectedHostname = process.env.RECAPTCHA_HOSTNAME;
    const hostnameMatches = !expectedHostname || result.hostname === expectedHostname || isLocal;
    return {
      configured: true,
      valid: response.ok && result.success && hostnameMatches,
    };
  } catch {
    return { configured: true, valid: false };
  }
}

const quoteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["quotes", "warnings", "agronomy"],
  properties: {
    quotes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "sourceFile",
          "product",
          "supplier",
          "npk",
          "bagKg",
          "pricePerBag",
          "deliveryPerT",
          "applicationRateKgHa",
          "currency",
          "confidence",
          "notes",
          "agronomicFit",
          "fitReason",
          "stageFit",
          "stageReason",
        ],
        properties: {
          sourceFile: { type: "string" },
          product: { type: "string" },
          supplier: { type: "string" },
          npk: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: { type: "number" },
          },
          bagKg: { type: ["number", "null"] },
          pricePerBag: { type: ["number", "null"] },
          deliveryPerT: { type: ["number", "null"] },
          applicationRateKgHa: { type: ["number", "null"] },
          currency: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          notes: { type: "string" },
          agronomicFit: {
            type: "string",
            enum: ["suitable", "caution", "not_enough_information"],
          },
          fitReason: { type: "string" },
          stageFit: {
            type: "string",
            enum: ["compatible", "incompatible", "unknown"],
          },
          stageReason: { type: "string" },
        },
      },
    },
    warnings: { type: "array", items: { type: "string" } },
    agronomy: {
      type: "object",
      additionalProperties: false,
      required: [
        "weatherSummary",
        "timingGuidance",
        "soilGuidance",
        "soilTestSummary",
        "irrigationGuidance",
        "caution",
        "factorChecks",
      ],
      properties: {
        weatherSummary: { type: "string" },
        timingGuidance: { type: "string" },
        soilGuidance: { type: "string" },
        soilTestSummary: { type: "string" },
        irrigationGuidance: { type: "string" },
        caution: { type: "string" },
        factorChecks: {
          type: "object",
          additionalProperties: false,
          required: [
            "location",
            "fieldSize",
            "decisionGoal",
            "cropStage",
            "soil",
            "weather",
            "irrigation",
            "nutrientTargets",
            "productPreferences",
          ],
          properties: Object.fromEntries(
            [
              "location",
              "fieldSize",
              "decisionGoal",
              "cropStage",
              "soil",
              "weather",
              "irrigation",
              "nutrientTargets",
              "productPreferences",
            ].map((name) => [
              name,
              {
                type: "object",
                additionalProperties: false,
                required: ["status", "effect"],
                properties: {
                  status: { type: "string", enum: ["used", "missing", "caution"] },
                  effect: { type: "string" },
                },
              },
            ]),
          ),
        },
      },
    },
  },
} as const;

type OpenAIResult = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

function textFromResponse(result: OpenAIResult) {
  if (result.output_text) return result.output_text;
  return (
    result.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")
      ?.text ?? ""
  );
}

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function analysisErrorMessage(status: number) {
  if (status === 401) {
    return "The OpenAI API key was rejected. Check OPENAI_API_KEY and restart the server.";
  }
  if (status === 429) {
    return "OpenAI API credit is unavailable or the usage limit was reached. Add API credit or try again later.";
  }
  if (status === 400 || status === 413) {
    return "OpenAI could not process this upload. Try a clearer JPG, PNG, or PDF quote under 10 MB.";
  }
  if (status >= 500) {
    return "OpenAI is temporarily unavailable. Please try again in a few minutes.";
  }
  return "The AI could not analyze those files. Please try again.";
}

export const Route = createFileRoute("/api/analyze-quotes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (contentLength > MAX_REQUEST_BYTES) {
          return Response.json(
            { error: "The upload is too large. Use up to 8 files under 10 MB each." },
            { status: 413 },
          );
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ error: "Invalid upload." }, { status: 400 });
        }

        // Do not use `instanceof File` here. Multipart files can come from a
        // different runtime realm on Vercel and fail that check even though
        // they are valid uploads.
        const files = form.getAll("quotes").filter((item): item is File => {
          if (typeof item === "string") return false;
          return (
            typeof item.name === "string" &&
            item.name.trim().length > 0 &&
            typeof item.size === "number" &&
            item.size > 0 &&
            typeof item.arrayBuffer === "function"
          );
        });
        const locationName = field(form, "location");
        const crop = field(form, "crop");
        const decisionGoal = field(form, "decisionGoal");
        const fertilizerFormPreference = field(form, "fertilizerFormPreference");
        const fertilizerOriginPreference = field(form, "fertilizerOriginPreference");
        const unit = field(form, "unit") === "ac" ? "ac" : "ha";
        const fieldSize = Number(field(form, "fieldSize"));
        const radiusKm = Number(field(form, "radiusKm"));
        const lat = Number(field(form, "lat"));
        const lon = Number(field(form, "lon"));
        const plantingDate = field(form, "plantingDate");
        const cropStage = field(form, "cropStage");
        const soilTestAvailable = field(form, "soilTestAvailable") === "true";
        const soilTestDate = field(form, "soilTestDate");
        const soilSampleDepthCm = field(form, "soilSampleDepthCm");
        const soilTestMethod = field(form, "soilTestMethod");
        const soilNitrogen = field(form, "soilNitrogen");
        const soilPhosphorus = field(form, "soilPhosphorus");
        const soilPotassium = field(form, "soilPotassium");
        const soilPh = field(form, "soilPh");
        const soilOrganicMatter = field(form, "soilOrganicMatter");
        const soilCec = field(form, "soilCec");
        const soilTexture = field(form, "soilTexture");
        const measuredSoilMoisture = field(form, "measuredSoilMoisture");
        const measuredSoilTemperature = field(form, "measuredSoilTemperature");
        const irrigationStatus = field(form, "irrigationStatus");
        const irrigationMethod = field(form, "irrigationMethod");
        const wateringFrequency = field(form, "wateringFrequency");
        const wateringTime = field(form, "wateringTime");
        const wateringDurationMinutes = field(form, "wateringDurationMinutes");
        const nextWateringDate = field(form, "nextWateringDate");
        const growerNotes = field(form, "growerNotes");
        const targetNitrogenKgHa = field(form, "targetNitrogenKgHa");
        const targetPhosphorusKgHa = field(form, "targetPhosphorusKgHa");
        const targetPotassiumKgHa = field(form, "targetPotassiumKgHa");
        const priorityNutrients = field(form, "priorityNutrients")
          .split(",")
          .filter((nutrient): nutrient is "N" | "P" | "K" | "Zn" =>
            ["N", "P", "K", "Zn"].includes(nutrient),
          );
        const recaptchaToken = field(form, "recaptchaToken");

        if (!recaptchaToken) {
          return Response.json({ error: "Verification is required." }, { status: 403 });
        }
        const recaptcha = await verifyRecaptcha(request, recaptchaToken);
        if (!recaptcha.configured) {
          return Response.json(
            { error: "Google reCAPTCHA is not configured yet." },
            { status: 503 },
          );
        }
        if (!recaptcha.valid) {
          return Response.json(
            { error: "Verification failed or expired. Please try again." },
            { status: 403 },
          );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return Response.json(
            {
              error:
                "Quote analysis is not configured yet. Add OPENAI_API_KEY to the server environment.",
              code: "MISSING_API_KEY",
            },
            { status: 503 },
          );
        }

        if (
          !locationName ||
          !crop ||
          !["yield", "cost", "balanced"].includes(decisionGoal) ||
          !["liquid", "dry", "either"].includes(fertilizerFormPreference) ||
          !["organic", "synthetic", "either"].includes(fertilizerOriginPreference) ||
          !Number.isFinite(fieldSize) ||
          fieldSize <= 0 ||
          !["rain-fed", "irrigated", "planned"].includes(irrigationStatus)
        ) {
          return Response.json(
            {
              error:
                "Location, crop, preferences, priority, field size and water source are required.",
            },
            { status: 400 },
          );
        }
        if (plantingDate) {
          const plantingTimestamp = Date.parse(`${plantingDate}T00:00:00Z`);
          const today = new Date();
          const todayTimestamp = Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate(),
          );
          if (!Number.isFinite(plantingTimestamp) || plantingTimestamp > todayTimestamp) {
            return Response.json(
              { error: "Planting date cannot be in the future." },
              { status: 400 },
            );
          }
        }
        if (!files.length || files.length > MAX_QUOTE_FILES) {
          return Response.json(
            { error: `Upload between 1 and ${MAX_QUOTE_FILES} quote files.` },
            { status: 400 },
          );
        }
        for (const file of files) {
          const error = quoteFileError(file);
          if (error) return Response.json({ error }, { status: 400 });
        }

        if (!consumeAnalysisAttempt(requestIp(request))) {
          return Response.json(
            { error: "Too many analyses from this connection. Try again in 10 minutes." },
            { status: 429, headers: { "Retry-After": "600" } },
          );
        }

        const fileInputs = await Promise.all(
          files.map(async (file) => {
            const descriptor = getQuoteFileDescriptor(file);
            if (!descriptor) throw new Error(`${file.name} is not a supported quote file.`);
            const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
            const dataUrl = `data:${descriptor.mime};base64,${base64}`;
            return descriptor.kind === "document"
              ? { type: "input_file", filename: file.name, file_data: dataUrl }
              : { type: "input_image", image_url: dataUrl, detail: "high" };
          }),
        );

        let weather = null;
        try {
          weather = await getFarmWeather(lat, lon);
        } catch {
          // Weather is useful context, but a temporary weather outage should not block quote extraction.
        }

        const prompt = `You extract fertilizer quote line items for FertaFind.

Files supplied: ${files.map((file) => file.name).join(", ")}.
Farm: ${locationName}; crop: ${crop}; field: ${fieldSize} ${unit}; delivery radius: ${radiusKm} km.
Grower's main goal: ${decisionGoal === "yield" ? "improve yield" : decisionGoal === "cost" ? "reduce fertilizer cost" : "balance yield potential and cost"}. Use this goal to explain and compare otherwise agronomically suitable products, but never rank an unsuitable product first merely because it is cheaper or promise a yield increase.
Grower's fertilizer preferences: ${fertilizerFormPreference === "liquid" ? "liquid fertilizer" : fertilizerFormPreference === "dry" ? "dry or granular fertilizer" : "no liquid/dry preference"}; ${fertilizerOriginPreference === "organic" ? "organic fertilizer" : fertilizerOriginPreference === "synthetic" ? "synthetic/mineral fertilizer" : "no organic/synthetic preference"}. Treat these as ranking preferences only after crop and soil suitability. Never label a product liquid, dry, organic, or synthetic unless the quote supports it. If the quote does not state enough to confirm a preference, explicitly say that in fitReason rather than guessing.

Decision context (use it to flag fit and timing only; never invent nutrient requirements):
- Analysis date: ${new Date().toISOString().slice(0, 10)}
- Planting date: ${plantingDate || "not supplied"}; crop stage: ${cropStage || "not supplied"}
- Laboratory soil test supplied: ${soilTestAvailable ? "yes" : "no"}. Test date ${soilTestDate || "not supplied"}; sample depth ${soilSampleDepthCm || "not supplied"}; laboratory/extraction method ${soilTestMethod || "not supplied"}.
- Soil test results (preserve the grower's stated units): nitrate-N ${soilNitrogen || "not supplied"}, available P ${soilPhosphorus || "not supplied"}, exchangeable K ${soilPotassium || "not supplied"}, pH ${soilPh || "not supplied"}, organic matter ${soilOrganicMatter || "not supplied"}, CEC ${soilCec || "not supplied"}, texture ${soilTexture || "not supplied"}.
- Grower measurements: soil moisture ${measuredSoilMoisture || "not supplied"}; soil temperature ${measuredSoilTemperature || "not supplied"}.
- Water source: ${irrigationStatus}; method ${irrigationMethod || "not supplied"}; frequency ${wateringFrequency || "not supplied"}; typical time ${wateringTime || "not supplied"}; duration ${wateringDurationMinutes || "not supplied"}; next watering ${nextWateringDate || "not supplied"}.
- Grower notes: ${growerNotes || "not supplied"}
- Target nutrient plan: N ${targetNitrogenKgHa || "not supplied"} kg/ha, P ${targetPhosphorusKgHa || "not supplied"} kg/ha, K ${targetPotassiumKgHa || "not supplied"} kg/ha
- Grower-selected nutrient priorities: ${priorityNutrients.length ? priorityNutrients.join(", ") : "not supplied"}. Use these as directional priorities only; do not infer a dose or guaranteed nutrient quantity.
- Current pin weather: ${weather ? `${weather.temperatureC ?? "unknown"}°C air temperature, ${weather.humidityPercent ?? "unknown"}% humidity, ${weather.rainMm ?? "unknown"} mm precipitation, ${weather.windSpeedKph ?? "unknown"} km/h wind, modeled surface soil temperature ${weather.soilTemperatureC ?? "unknown"}°C, modeled surface soil moisture ${weather.soilMoistureM3M3 ?? "unknown"} m³/m³; next 3 days rain ${weather.next3DaysRainMm ?? "unknown"} mm, max air temperature ${weather.next3DaysMaxTempC ?? "unknown"}°C, reference evapotranspiration ${weather.next3DaysEt0Mm ?? "unknown"} mm.` : "weather temporarily unavailable"}

Extract every distinct fertilizer product being quoted. Copy only values visible in the files. Do not invent a supplier, price, delivery charge, application rate, currency, pack size, nutrient value, or soil requirement. Use null for a missing numeric value, an empty string for missing text, and [0,0,0] only when N-P-K is not stated. Convert tonnes to kilograms where necessary. pricePerBag means the price for the stated pack/bag/bulk unit whose mass is bagKg. deliveryPerT means delivery cost per metric tonne. applicationRateKgHa means kilograms per hectare. Put uncertainty or unit conversions in notes.

For each product, actually evaluate agronomicFit using the supplied crop stage, laboratory soil results, target nutrient plan, forecast rainfall, humidity, soil temperature, soil moisture, evapotranspiration and irrigation schedule. Set stageFit to compatible only when the crop stage and the product's stated label/application timing support each other; set it to incompatible when they conflict; otherwise set it to unknown. stageReason must identify the crop stage and the product timing evidence used, or explicitly say the quote does not state a timing window. An incompatible stage cannot be agronomicFit "suitable".

Complete all nine factorChecks. Each effect must state how that factor changed the recommendation or why it could not be used: location, fieldSize, decisionGoal, cropStage, laboratory soil, weather, irrigation, nutrientTargets and productPreferences. Location must explain its use for weather and delivery context, not invent local agronomy. Field size must explain its use for whole-field quantity/cost context and must not change agronomic suitability. The decision goal may change ranking weights only after safety and suitability. Use status "used" only when usable data affected the assessment, "missing" when the data was absent, and "caution" when data exists but is incomplete, unverified, or conflicts with the product. Do not merely repeat the input.

Do not treat modeled surface conditions as a substitute for a field measurement or laboratory test. If soil-test units, extraction method, sample depth, timing, irrigation detail, application rate, or crop requirement are missing, say so and use "not_enough_information" or "caution" rather than guessing. Irrigation guidance must consider whether watering is sufficient to incorporate the quoted product and the risk of loss from heavy rain, saturated soil, heat, wind or poorly timed application. SoilTestSummary must state which supplied soil-test fields were used, or clearly say no lab test was provided. fitReason must be concise, plain-language, and start with exactly one of these verdicts: "Recommended because", "Use caution because", or "Not enough information because". Use "Recommended because" only when agronomicFit is "suitable" and the quote contains enough product and rate information to support it. Never claim a guaranteed yield. Identify sourceFile using one of the supplied filenames. confidence is 0 to 1. Add warnings for unreadable pages or information that prevents a fair comparison.`;

        const upstream = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.OPENAI_QUOTE_MODEL || "gpt-5.6-luna",
            store: false,
            input: [
              {
                role: "user",
                content: [{ type: "input_text", text: prompt }, ...fileInputs],
              },
            ],
            text: {
              format: {
                type: "json_schema",
                name: "fertilizer_quote_analysis",
                strict: true,
                schema: quoteSchema,
              },
            },
          }),
        });

        const openAIResult = (await upstream.json()) as OpenAIResult;
        if (!upstream.ok) {
          console.error(
            "OpenAI quote analysis failed",
            upstream.status,
            openAIResult.error?.message,
          );
          return Response.json({ error: analysisErrorMessage(upstream.status) }, { status: 502 });
        }

        try {
          const extracted = JSON.parse(textFromResponse(openAIResult)) as {
            quotes: Omit<AnalyzedQuote, "id">[];
            warnings: string[];
            agronomy: AgronomyGuidance;
          };
          if (!extracted.quotes.length) {
            return Response.json(
              { error: "No fertilizer quote items were found in those files." },
              { status: 422 },
            );
          }

          const id = crypto.randomUUID();
          const analysis: QuoteAnalysis = {
            id,
            createdAt: new Date().toISOString(),
            location: {
              displayName: locationName,
              lat,
              lon,
              radiusKm,
            },
            crop,
            decisionGoal: decisionGoal as QuoteAnalysis["decisionGoal"],
            preferences: {
              fertilizerForm:
                fertilizerFormPreference as QuoteAnalysis["preferences"]["fertilizerForm"],
              fertilizerOrigin:
                fertilizerOriginPreference as QuoteAnalysis["preferences"]["fertilizerOrigin"],
            },
            fieldSize,
            unit,
            farmContext: {
              analysisDate: new Date().toISOString().slice(0, 10),
              plantingDate,
              cropStage,
              soilTestAvailable,
              soilTestDate,
              soilSampleDepthCm,
              soilTestMethod,
              soilNitrogen,
              soilPhosphorus,
              soilPotassium,
              soilPh,
              soilOrganicMatter,
              soilCec,
              soilTexture,
              measuredSoilMoisture,
              measuredSoilTemperature,
              irrigationStatus,
              irrigationMethod,
              wateringFrequency,
              wateringTime,
              wateringDurationMinutes,
              nextWateringDate,
              growerNotes,
            },
            nutrientPlan: {
              targetNitrogenKgHa,
              targetPhosphorusKgHa,
              targetPotassiumKgHa,
              priorityNutrients,
            },
            weather,
            agronomy: extracted.agronomy,
            quotes: extracted.quotes.map((quote, index) => ({
              ...quote,
              id: `${id}-${index + 1}`,
            })),
            warnings: extracted.warnings,
          };
          return Response.json({ analysis });
        } catch (error) {
          console.error("Invalid structured quote analysis", error);
          return Response.json(
            { error: "The AI returned an unreadable analysis. Please try again." },
            { status: 502 },
          );
        }
      },
    },
  },
});
