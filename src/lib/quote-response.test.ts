import assert from "node:assert/strict";
import test from "node:test";
import {
  parseQuoteAnalysis,
  extractJsonObject,
  extractOutputText,
  parseFailureMessage,
  isQuoteExtraction,
  type OpenAIResponse,
} from "./quote-response.ts";

const validQuote = {
  sourceFile: "quote.pdf",
  product: "Urea 46-0-0",
  supplier: "Farm Supply Co.",
  npk: [46, 0, 0],
  bagKg: 50,
  pricePerBag: 38,
  deliveryPerT: 25,
  applicationRateKgHa: 150,
  currency: "USD",
  confidence: 0.9,
  notes: "",
  agronomicFit: "caution",
  fitReason: "Use caution because the quote lacks a soil test.",
  stageFit: "unknown",
  stageReason: "No timing window stated.",
};

const validExtraction = {
  quotes: [validQuote],
  warnings: ["Check the soil test."],
  agronomy: {
    weatherSummary: "",
    timingGuidance: "",
    soilGuidance: "",
    soilTestSummary: "",
    irrigationGuidance: "",
    caution: "",
    factorChecks: {},
  },
};
const validJson = JSON.stringify(validExtraction);

const asText = (text: string, extra: Partial<OpenAIResponse> = {}): OpenAIResponse => ({
  status: "completed",
  output_text: text,
  ...extra,
});
const asOutputArray = (text: string): OpenAIResponse => ({
  status: "completed",
  output: [{ content: [{ type: "output_text", text }] }],
});

test("valid strict JSON via output_text parses and validates", () => {
  const r = parseQuoteAnalysis(asText(validJson));
  assert.equal(r.ok, true);
  assert.equal(r.ok && r.data.quotes.length, 1);
});

test("valid JSON via output[].content[] path", () => {
  assert.equal(parseQuoteAnalysis(asOutputArray(validJson)).ok, true);
});

test("empty output text -> empty", () => {
  assert.deepEqual(parseQuoteAnalysis(asText("")), { ok: false, reason: "empty" });
  assert.deepEqual(parseQuoteAnalysis({ status: "completed", output: [] }), {
    ok: false,
    reason: "empty",
  });
});

test("no output field at all -> empty", () => {
  assert.deepEqual(parseQuoteAnalysis({ status: "completed" }), { ok: false, reason: "empty" });
});

test("refusal output -> refusal", () => {
  const r = parseQuoteAnalysis({
    status: "completed",
    output: [{ content: [{ type: "refusal", refusal: "I can't help with that." }] }],
  });
  assert.deepEqual(r, { ok: false, reason: "refusal" });
});

test("markdown ```json fences are stripped", () => {
  assert.equal(parseQuoteAnalysis(asText("```json\n" + validJson + "\n```")).ok, true);
  assert.equal(parseQuoteAnalysis(asText("```\n" + validJson + "\n```")).ok, true);
});

test("leading and trailing explanatory prose is tolerated", () => {
  const wrapped =
    "Sure! Here is the analysis you asked for:\n" +
    validJson +
    "\nLet me know if you need anything else.";
  assert.equal(parseQuoteAnalysis(asText(wrapped)).ok, true);
});

test("truncated output (unbalanced braces) -> truncated", () => {
  const cut = validJson.slice(0, validJson.length - 12);
  assert.deepEqual(parseQuoteAnalysis(asText(cut)), { ok: false, reason: "truncated" });
});

test("explicit incomplete status -> truncated even if body looks complete", () => {
  assert.deepEqual(
    parseQuoteAnalysis(
      asText(validJson, {
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
      }),
    ),
    { ok: false, reason: "truncated" },
  );
});

test("no JSON object present -> not_json", () => {
  assert.deepEqual(parseQuoteAnalysis(asText("I could not find any fertilizer products.")), {
    ok: false,
    reason: "not_json",
  });
});

test("balanced but syntactically invalid JSON -> not_json", () => {
  assert.deepEqual(parseQuoteAnalysis(asText("{ 'quotes': [], }")), {
    ok: false,
    reason: "not_json",
  });
});

test("upstream returned HTML error text -> not_json (never a crash)", () => {
  assert.deepEqual(parseQuoteAnalysis(asText("<html><body>502 Bad Gateway</body></html>")), {
    ok: false,
    reason: "not_json",
  });
});

test("schema-invalid: missing quotes array -> schema_invalid", () => {
  assert.deepEqual(parseQuoteAnalysis(asText(JSON.stringify({ warnings: [], agronomy: {} }))), {
    ok: false,
    reason: "schema_invalid",
  });
});

test("schema-invalid: a quote row with wrong types is rejected (no partial accept)", () => {
  const bad = {
    ...validExtraction,
    quotes: [{ ...validQuote, npk: [46, 0], pricePerBag: "cheap" }],
  };
  assert.deepEqual(parseQuoteAnalysis(asText(JSON.stringify(bad))), {
    ok: false,
    reason: "schema_invalid",
  });
});

test("an empty quotes array is valid (0 identifiable products)", () => {
  const r = parseQuoteAnalysis(asText(JSON.stringify({ ...validExtraction, quotes: [] })));
  assert.equal(r.ok, true);
  assert.equal(r.ok && r.data.quotes.length, 0);
});

test("extractJsonObject handles fences, prose, and braces inside strings", () => {
  assert.equal(extractJsonObject('```json\n{"a":1}\n```'), '{"a":1}');
  assert.equal(extractJsonObject('prefix {"a":"}{"} suffix'), '{"a":"}{"}');
  assert.equal(extractJsonObject("nothing here"), null);
});

test("extractOutputText prefers output_text, then output[].content[]", () => {
  assert.equal(extractOutputText({ output_text: "hi" }).text, "hi");
  assert.equal(
    extractOutputText({ output: [{ content: [{ type: "output_text", text: "yo" }] }] }).text,
    "yo",
  );
  assert.equal(
    extractOutputText({ output: [{ content: [{ type: "refusal", refusal: "no" }] }] }).refused,
    true,
  );
});

test("isQuoteExtraction is a strict type guard", () => {
  assert.equal(isQuoteExtraction(validExtraction), true);
  assert.equal(isQuoteExtraction({ quotes: "x", warnings: [], agronomy: {} }), false);
  assert.equal(isQuoteExtraction(null), false);
});

test("every failure message is safe, non-empty, and leaks no internals", () => {
  for (const reason of ["empty", "refusal", "truncated", "not_json", "schema_invalid"] as const) {
    const m = parseFailureMessage(reason);
    assert.ok(m.length > 0);
    assert.doesNotMatch(m, /stack|Error:|sk-|api[\s-]?key|openai internal|Bearer/i);
  }
});
