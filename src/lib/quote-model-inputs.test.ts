// The upload -> AI request contract. Proves that facts inside a DOCX/XLSX quote actually reach
// the model input as text (supplier name, NPK grade, unit price), that PDFs/images are passed
// through for the model to read, and that an unreadable document produces a warning and NO
// input part — i.e. the request never claims a document was parsed when it was not.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildQuoteModelInputs, type ModelInput } from "./quote-extraction.ts";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url));

const MESSAGES = {
  docCorrupt: 'We could not read "{file}" (corrupt).',
  docEmpty: '"{file}" has no readable text.',
  docImageOnly: '"{file}" contains only images.',
};

const textOf = (inputs: ModelInput[]) =>
  inputs
    .filter((i): i is Extract<ModelInput, { type: "input_text" }> => i.type === "input_text")
    .map((i) => i.text)
    .join("\n");

test("DOCX quote: supplier name, NPK grade and unit price reach the AI input as text", () => {
  const { inputs, warnings } = buildQuoteModelInputs(
    [{ name: "quote-basic.docx", type: "", bytes: fixture("quote-basic.docx") }],
    MESSAGES,
  );
  assert.equal(warnings.length, 0);
  assert.equal(inputs.length, 1);
  assert.equal(inputs[0].type, "input_text");
  const text = textOf(inputs);
  assert.match(text, /quote-basic\.docx/); // the source file is identified
  assert.match(text, /AgroSul Fertilizantes/); // supplier name
  assert.match(text, /17-0-0/); // NPK grade (the example assertion)
  assert.match(text, /46-0-0/);
  assert.match(text, /R\$ 180\.00/); // a known unit price
});

test("XLSX quote: every sheet's values (supplier, grade, price, formula total) reach the input", () => {
  const { inputs, warnings } = buildQuoteModelInputs(
    [{ name: "quote-multisheet.xlsx", type: "", bytes: fixture("quote-multisheet.xlsx") }],
    MESSAGES,
  );
  assert.equal(warnings.length, 0);
  const text = textOf(inputs);
  assert.match(text, /AgroSul Fertilizantes/);
  assert.match(text, /17-0-0/);
  assert.match(text, /\b180\b/); // unit price value
  assert.match(text, /1800/); // formula cached (displayed) value
  assert.match(text, /Sheet: Totals/); // second sheet is not ignored
});

test("an image-only DOCX yields a warning and NO model input — no false 'parsed' claim", () => {
  const { inputs, warnings } = buildQuoteModelInputs(
    [{ name: "scan.docx", type: "", bytes: fixture("image-only.docx") }],
    MESSAGES,
  );
  assert.deepEqual(inputs, []);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /scan\.docx/);
  assert.match(warnings[0], /only images/);
});

test("an empty and a corrupt document both warn without producing input", () => {
  const empty = buildQuoteModelInputs(
    [{ name: "blank.xlsx", type: "", bytes: fixture("empty.xlsx") }],
    MESSAGES,
  );
  assert.deepEqual(empty.inputs, []);
  assert.match(empty.warnings[0], /blank\.xlsx/);
  assert.match(empty.warnings[0], /no readable text/);

  const corrupt = buildQuoteModelInputs(
    [{ name: "broken.docx", type: "", bytes: Buffer.from("definitely not a zip") }],
    MESSAGES,
  );
  assert.deepEqual(corrupt.inputs, []);
  assert.match(corrupt.warnings[0], /broken\.docx/);
  assert.match(corrupt.warnings[0], /corrupt/);
});

test("PDFs pass through as input_file and images as input_image (model reads them directly)", () => {
  const { inputs } = buildQuoteModelInputs(
    [
      { name: "quote.pdf", type: "application/pdf", bytes: Buffer.from("%PDF-1.4 ...") },
      { name: "photo.png", type: "image/png", bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
    ],
    MESSAGES,
  );
  const types = inputs.map((i) => i.type);
  assert.deepEqual(types, ["input_file", "input_image"]);
});

test("a mixed upload keeps the readable files and warns only about the unreadable one", () => {
  const { inputs, warnings } = buildQuoteModelInputs(
    [
      { name: "quote-basic.docx", type: "", bytes: fixture("quote-basic.docx") },
      { name: "scan.docx", type: "", bytes: fixture("image-only.docx") },
      { name: "quote.pdf", type: "application/pdf", bytes: Buffer.from("%PDF-1.4") },
    ],
    MESSAGES,
  );
  // The readable DOCX (input_text) and the PDF (input_file) survive; the image-only DOCX warns.
  assert.equal(inputs.length, 2);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /scan\.docx/);
});
