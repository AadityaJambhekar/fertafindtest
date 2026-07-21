import { createFileRoute } from "@tanstack/react-router";
import { getQuoteFileDescriptor, MAX_QUOTE_FILE_BYTES } from "@/lib/quote-files";

const EXTRACTION_LIMIT = 5;
const EXTRACTION_WINDOW_MS = 10 * 60 * 1000;
const extractionAttempts = new Map<string, number[]>();
const GOOGLE_TEST_SECRET = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

type OpenAIResult = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

type RecaptchaResult = {
  success: boolean;
  hostname?: string;
};

const soilTestSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "soilTestDate",
    "soilSampleDepthCm",
    "soilTestMethod",
    "soilNitrogen",
    "soilPhosphorus",
    "soilPotassium",
    "soilPh",
    "soilOrganicMatter",
    "soilCec",
    "soilTexture",
    "warnings",
  ],
  properties: {
    soilTestDate: { type: "string" },
    soilSampleDepthCm: { type: "string" },
    soilTestMethod: { type: "string" },
    soilNitrogen: { type: "string" },
    soilPhosphorus: { type: "string" },
    soilPotassium: { type: "string" },
    soilPh: { type: "string" },
    soilOrganicMatter: { type: "string" },
    soilCec: { type: "string" },
    soilTexture: { type: "string" },
    warnings: { type: "array", items: { type: "string" } },
  },
} as const;

function requestIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

function consumeAttempt(ip: string) {
  const now = Date.now();
  const recent = (extractionAttempts.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < EXTRACTION_WINDOW_MS,
  );
  if (recent.length >= EXTRACTION_LIMIT) return false;
  recent.push(now);
  extractionAttempts.set(ip, recent);
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
    return {
      configured: true,
      valid:
        response.ok &&
        result.success &&
        (!expectedHostname || result.hostname === expectedHostname || isLocal),
    };
  } catch {
    return { configured: true, valid: false };
  }
}

function textFromResponse(result: OpenAIResult) {
  if (result.output_text) return result.output_text;
  return (
    result.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")
      ?.text ?? ""
  );
}

export const Route = createFileRoute("/api/extract-soil-test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ error: "Invalid soil-test upload." }, { status: 400 });
        }

        const file = form.get("soilTest");
        const recaptchaToken = form.get("recaptchaToken");
        if (!(file instanceof File) || typeof recaptchaToken !== "string") {
          return Response.json({ error: "Choose a soil-test image or PDF." }, { status: 400 });
        }
        if (file.size > MAX_QUOTE_FILE_BYTES) {
          return Response.json(
            { error: "The soil-test file must be under 10 MB." },
            { status: 413 },
          );
        }
        const descriptor = getQuoteFileDescriptor(file);
        if (
          !descriptor ||
          !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(descriptor.mime)
        ) {
          return Response.json(
            { error: "Use a JPG, PNG, WebP or PDF soil-test report." },
            { status: 400 },
          );
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
            { error: "Verification failed or expired. Try again." },
            { status: 403 },
          );
        }
        if (!consumeAttempt(requestIp(request))) {
          return Response.json(
            { error: "Too many soil-test scans. Try again in 10 minutes." },
            { status: 429, headers: { "Retry-After": "600" } },
          );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "Soil-test reading is not configured yet." },
            { status: 503 },
          );
        }

        const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
        const dataUrl = `data:${descriptor.mime};base64,${base64}`;
        const fileInput =
          descriptor.kind === "document"
            ? { type: "input_file", filename: file.name, file_data: dataUrl }
            : { type: "input_image", image_url: dataUrl, detail: "high" };

        const prompt = `Read this agricultural laboratory soil-test report and extract only values visibly stated in the file. Preserve units inside each string. Use YYYY-MM-DD for a clearly stated test date when possible. For soilSampleDepthCm return only the visible depth/range in centimetres, converting from inches only when the source unit is explicit and adding that conversion to warnings. Include the laboratory or extraction method with the relevant nutrient when shown (for example Olsen P or Mehlich-3). Use an empty string for anything absent or unreadable. Never estimate, infer or invent a soil value. Add a warning for unclear units, unreadable text, multiple sample rows, or any conversion.`;

        try {
          const response = await fetch("https://api.openai.com/v1/responses", {
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
                  content: [{ type: "input_text", text: prompt }, fileInput],
                },
              ],
              text: {
                format: {
                  type: "json_schema",
                  name: "soil_test_extraction",
                  strict: true,
                  schema: soilTestSchema,
                },
              },
            }),
          });
          const result = (await response.json()) as OpenAIResult;
          if (!response.ok) {
            const message =
              response.status === 429
                ? "AI credit is unavailable or the usage limit was reached."
                : "The soil test could not be read. Try a clearer image or PDF.";
            return Response.json({ error: message }, { status: 502 });
          }

          const values = JSON.parse(textFromResponse(result)) as Record<string, unknown>;
          return Response.json({ values });
        } catch {
          return Response.json(
            { error: "The soil test could not be read. Try a clearer image or PDF." },
            { status: 502 },
          );
        }
      },
    },
  },
});
