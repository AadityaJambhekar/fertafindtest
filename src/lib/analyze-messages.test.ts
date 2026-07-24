// Parity + safety guard for the server analyze/parse messages, mirroring dictionaries.test.ts:
// every locale must define exactly the same keys, no message may be blank, no message may leak
// the AI provider's name, and Portuguese/Spanish must actually be translated (not copied
// English) for the user-facing runtime messages a grower will see.

import test from "node:test";
import assert from "node:assert/strict";
import { SUPPORTED_LOCALES, type Locale } from "./i18n.ts";
import { analyzeMessages, fillMessage } from "./analyze-messages.ts";

const keys = (locale: Locale) => Object.keys(analyzeMessages(locale)).sort();

test("every locale defines exactly the same analyze-message keys", () => {
  const english = keys("en");
  for (const locale of SUPPORTED_LOCALES) {
    assert.deepEqual(keys(locale), english, `${locale} keys must match English`);
  }
});

test("no analyze message is blank", () => {
  for (const locale of SUPPORTED_LOCALES) {
    for (const [key, value] of Object.entries(analyzeMessages(locale))) {
      assert.ok(value.trim().length > 0, `${locale}.${key} is blank`);
    }
  }
});

test("no analyze message leaks the AI provider name or raw error shape", () => {
  for (const locale of SUPPORTED_LOCALES) {
    for (const [key, value] of Object.entries(analyzeMessages(locale))) {
      assert.doesNotMatch(
        value,
        /openai|gpt-|api key|bearer|stack|\bnull\b|undefined|status \d/i,
        `${locale}.${key} must not leak provider/internal detail`,
      );
    }
  }
});

test("Portuguese and Spanish runtime messages are translated, not copied English", () => {
  const en = analyzeMessages("en");
  for (const locale of ["pt-BR", "es-419"] as Locale[]) {
    const other = analyzeMessages(locale);
    // Sample the messages a grower actually sees at runtime; each must differ from English.
    for (const key of ["rateLimited", "aiFailed", "docImageOnly", "noUsableContent"] as const) {
      assert.notEqual(other[key], en[key], `${locale}.${key} must be translated`);
    }
  }
});

test("fillMessage substitutes the file name and leaves unknown tokens intact", () => {
  const en = analyzeMessages("en");
  const filled = fillMessage(en.docImageOnly, { file: "quote.docx" });
  assert.match(filled, /quote\.docx/);
  assert.doesNotMatch(filled, /\{file\}/);
  assert.equal(fillMessage("keep {unknown}", { file: "x" }), "keep {unknown}");
});
