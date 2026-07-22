import assert from "node:assert/strict";
import test from "node:test";
import {
  detectAiReferral,
  sanitizeAnalyticsParams,
  ANALYTICS_PARAM_ALLOWLIST,
} from "./analytics-core.ts";

test("detects a ChatGPT referrer URL", () => {
  assert.equal(detectAiReferral("https://chatgpt.com/", null), "chatgpt");
  assert.equal(
    detectAiReferral("https://chat.openai.com/c/abc", null),
    "chatgpt",
  );
});

test("detects an AI source via utm_source=chatgpt.com", () => {
  assert.equal(detectAiReferral("", "chatgpt.com"), "chatgpt");
});

test("detects Perplexity, Gemini, Claude and Copilot referrers", () => {
  assert.equal(
    detectAiReferral("https://www.perplexity.ai/search", null),
    "perplexity",
  );
  assert.equal(
    detectAiReferral("https://gemini.google.com/app", null),
    "gemini",
  );
  assert.equal(detectAiReferral("https://claude.ai/chat/1", null), "claude");
  assert.equal(
    detectAiReferral("https://copilot.microsoft.com/", null),
    "copilot",
  );
});

test("returns null for ordinary search and social referrers", () => {
  assert.equal(
    detectAiReferral("https://www.google.com/search?q=fertilizer", null),
    null,
  );
  assert.equal(detectAiReferral("https://t.co/xyz", null), null);
  assert.equal(detectAiReferral("", null), null);
  assert.equal(detectAiReferral(null, null), null);
});

test("tolerates malformed referrer URLs without throwing", () => {
  assert.equal(detectAiReferral("not a url", null), null);
});

test("sanitizeAnalyticsParams keeps only the allowlisted keys", () => {
  const out = sanitizeAnalyticsParams({
    page_path: "/analyze",
    source_category: "chatgpt",
  });
  assert.deepEqual(out, { page_path: "/analyze", source_category: "chatgpt" });
});

test("sanitizeAnalyticsParams strips any private form values", () => {
  const out = sanitizeAnalyticsParams({
    page_path: "/results",
    farmAddress: "123 Private Farm Rd",
    quoteValue: "4200",
    uploadedFile: "quote.jpg",
    nutrientPlan: "N120 P40 K60",
    location: "Iowa",
  } as Record<string, unknown>);
  assert.deepEqual(out, { page_path: "/results" });
  for (const key of Object.keys(out)) {
    assert.ok((ANALYTICS_PARAM_ALLOWLIST as readonly string[]).includes(key));
  }
});

test("sanitizeAnalyticsParams drops empty and non-string values", () => {
  const out = sanitizeAnalyticsParams({
    page_path: "",
    source_category: 123 as unknown as string,
  });
  assert.deepEqual(out, {});
});
