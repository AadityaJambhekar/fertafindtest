// Defensive extraction + validation of the model's structured quote analysis.
//
// Contract: `/api/analyze-quotes` calls the OpenAI Responses API
// (POST https://api.openai.com/v1/responses) with
// `text.format = { type: "json_schema", strict: true, schema: quoteSchema }`.
// In the happy path the model returns strict-schema JSON, surfaced either as
// `output_text` or as `output[].content[]` items of type "output_text".
//
// Production reality is messier: the response can be empty, a refusal, wrapped
// in ```json fences, prefixed/suffixed with prose, truncated at the token
// limit, or shaped wrongly. The previous code did a raw
// `JSON.parse(textFromResponse(...))`, which threw on any of those — the known
// production failure. This module turns ANY response into either a validated
// payload or a typed failure with a safe, user-facing message. It never
// fabricates fields/products and never accepts partially-invalid quote data.

import type { AnalyzedQuote, AgronomyGuidance } from "./quote-analysis.ts";

export type QuoteExtraction = {
  quotes: Omit<AnalyzedQuote, "id">[];
  warnings: string[];
  agronomy: AgronomyGuidance;
};

export type ParseFailureReason =
  | "empty" // completed but produced no output text
  | "refusal" // the model refused to answer
  | "truncated" // output was cut off (incomplete / unbalanced JSON)
  | "not_json" // no parseable JSON object could be recovered
  | "schema_invalid"; // parsed, but the shape/fields are wrong

export type ParseResult =
  { ok: true; data: QuoteExtraction } | { ok: false; reason: ParseFailureReason };

// The subset of the Responses API result we depend on. Extra fields are ignored.
export type OpenAIResponse = {
  output_text?: string;
  status?: string; // "completed" | "incomplete" | ...
  incomplete_details?: { reason?: string } | null;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string; refusal?: string }>;
  }>;
  error?: { message?: string } | null;
};

// Pull the assistant text out of a Responses payload, and flag explicit refusals.
export function extractOutputText(result: OpenAIResponse): { text: string; refused: boolean } {
  const contents = result.output?.flatMap((item) => item.content ?? []) ?? [];
  const refused = contents.some(
    (c) => c?.type === "refusal" && typeof c.refusal === "string" && c.refusal.trim().length > 0,
  );
  if (refused) return { text: "", refused: true };

  if (typeof result.output_text === "string" && result.output_text.trim().length > 0) {
    return { text: result.output_text, refused: false };
  }

  const text = contents
    .filter((c) => c?.type === "output_text" && typeof c.text === "string")
    .map((c) => c.text as string)
    .join("");
  return { text, refused: false };
}

// Recover the first balanced, top-level JSON object from a string that may be
// fenced (```json ... ```) or surrounded by explanatory prose. String-aware so
// braces inside quoted values do not confuse the scan. Returns null when no
// balanced object exists (e.g. truncated output).
export function extractJsonObject(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim();

  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) s = fence[1].trim();

  const start = s.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null; // never closed -> truncated / malformed
}

function isNullableNumber(x: unknown): boolean {
  return x === null || typeof x === "number";
}

// A quote row must carry every required field with the right primitive type.
// Anything less is treated as invalid rather than silently patched.
function isValidQuote(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const q = v as Record<string, unknown>;
  const npkOk =
    Array.isArray(q.npk) && q.npk.length === 3 && q.npk.every((n) => typeof n === "number");
  return (
    typeof q.sourceFile === "string" &&
    typeof q.product === "string" &&
    typeof q.supplier === "string" &&
    npkOk &&
    isNullableNumber(q.bagKg) &&
    isNullableNumber(q.pricePerBag) &&
    isNullableNumber(q.deliveryPerT) &&
    isNullableNumber(q.applicationRateKgHa) &&
    typeof q.currency === "string" &&
    typeof q.confidence === "number" &&
    typeof q.notes === "string" &&
    typeof q.agronomicFit === "string" &&
    typeof q.fitReason === "string" &&
    typeof q.stageFit === "string" &&
    typeof q.stageReason === "string"
  );
}

export function isQuoteExtraction(v: unknown): v is QuoteExtraction {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.quotes) || !o.quotes.every(isValidQuote)) return false;
  if (!Array.isArray(o.warnings) || !o.warnings.every((w) => typeof w === "string")) return false;
  if (!o.agronomy || typeof o.agronomy !== "object") return false;
  return true;
}

export function parseQuoteAnalysis(result: OpenAIResponse): ParseResult {
  const { text, refused } = extractOutputText(result);
  if (refused) return { ok: false, reason: "refusal" };

  // Explicit truncation signal from the Responses API — never accept partial data.
  if (result.status === "incomplete" || result.incomplete_details?.reason) {
    return { ok: false, reason: "truncated" };
  }
  if (!text.trim()) return { ok: false, reason: "empty" };

  const json = extractJsonObject(text);
  if (!json) {
    // We saw an opening brace but never a balanced close -> cut off.
    return { ok: false, reason: text.includes("{") ? "truncated" : "not_json" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, reason: "not_json" };
  }

  if (!isQuoteExtraction(parsed)) return { ok: false, reason: "schema_invalid" };
  return { ok: true, data: parsed };
}

// Safe, user-facing message per failure class. Never leaks raw model output,
// stack traces, keys, or provider internals; every path invites a retry.
export function parseFailureMessage(reason: ParseFailureReason): string {
  switch (reason) {
    case "refusal":
      return "The AI could not analyze those files. Try clearer JPG, PNG, or PDF quotes and try again.";
    case "truncated":
      return "The analysis was cut off before it finished. Please try again.";
    case "empty":
      return "The AI returned no analysis. Please try again.";
    case "not_json":
    case "schema_invalid":
    default:
      return "The AI returned an unreadable analysis. Please try again.";
  }
}
