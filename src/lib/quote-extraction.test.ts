// Proves the DOCX/XLSX extractor reads REAL document contents (fixtures are genuine ZIP-based
// Office files under ./fixtures, built by fixtures/generate.sh). The assertions lock the exact
// facts a fertilizer quote must surface — supplier, NPK grade, unit price, quantity, delivery —
// and prove empty / image-only / corrupt files never claim a successful parse.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  extractDocx,
  extractXlsx,
  extractQuoteDocument,
  officeFormat,
} from "./quote-extraction.ts";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url));

// --- DOCX ---------------------------------------------------------------

test("DOCX: paragraphs, headings and table cells are all extracted", () => {
  const r = extractDocx(fixture("quote-basic.docx"));
  assert.equal(r.ok, true);
  assert.equal(r.format, "docx");
  // heading + paragraphs
  assert.match(r.text, /AgroSul Fertilizantes - Fertilizer Quote/);
  assert.match(r.text, /Supplier: AgroSul Fertilizantes Ltda/);
  // delivery information
  assert.match(r.text, /Delivery: R\$ 120\.00 per tonne, delivery within 15 days/);
  // table: product names, NPK grades, quantities and prices
  assert.match(r.text, /Urea/);
  assert.match(r.text, /Nano Urea/);
  assert.match(r.text, /46-0-0/);
  assert.match(r.text, /17-0-0/); // the example grade must reach the extracted content
  assert.match(r.text, /R\$ 180\.00/);
  assert.match(r.text, /R\$ 45\.00/);
  assert.match(r.text, /200 kg\/ha/);
});

test("DOCX: table rows keep their cells together (tab-separated)", () => {
  const r = extractDocx(fixture("quote-basic.docx"));
  const ureaRow = r.text.split("\n").find((line) => line.startsWith("Urea"));
  assert.ok(ureaRow, "the Urea row should be present");
  // Product, grade, bag, price and rate should ride on the same row.
  assert.match(ureaRow!, /Urea\t46-0-0\t50 kg\tR\$ 180\.00\t200 kg\/ha/);
});

test("DOCX: an empty document reports empty, never a successful parse", () => {
  const r = extractDocx(fixture("empty.docx"));
  assert.equal(r.ok, false);
  assert.equal(r.reason, "empty");
  assert.equal(r.text, "");
});

test("DOCX: an image-only document is flagged, not silently 'parsed'", () => {
  const r = extractDocx(fixture("image-only.docx"));
  assert.equal(r.ok, false);
  assert.equal(r.reason, "image-only");
});

test("DOCX: a corrupt (non-zip) file is rejected as corrupt", () => {
  const r = extractDocx(Buffer.from("this is not a real .docx file at all"));
  assert.equal(r.ok, false);
  assert.equal(r.reason, "corrupt");
});

// --- XLSX ---------------------------------------------------------------

test("XLSX: every sheet, header and value is extracted (no sheet or row skipped)", () => {
  const r = extractXlsx(fixture("quote-multisheet.xlsx"));
  assert.equal(r.ok, true);
  assert.equal(r.format, "xlsx");
  assert.equal(r.sheetCount, 2, "both worksheets must be read");
  // both sheets by name
  assert.match(r.text, /Sheet: Quote/);
  assert.match(r.text, /Sheet: Totals/);
  // headers
  assert.match(r.text, /Unit price BRL/);
  assert.match(r.text, /Delivery date/);
  // shared-string values: supplier, product, NPK grades
  assert.match(r.text, /AgroSul Fertilizantes/);
  assert.match(r.text, /46-0-0/);
  assert.match(r.text, /17-0-0/);
  // numeric values (unit prices, quantities) and a delivery date
  assert.match(r.text, /\b180\b/);
  assert.match(r.text, /\b45\b/);
  assert.match(r.text, /2026-08-01/);
});

test("XLSX: a formula cell contributes its cached displayed value", () => {
  const r = extractXlsx(fixture("quote-multisheet.xlsx"));
  // Sheet "Totals" holds =180*10 whose cached value is 1800.
  assert.match(r.text, /1800/);
});

test("XLSX: an empty workbook reports empty, never a successful parse", () => {
  const r = extractXlsx(fixture("empty.xlsx"));
  assert.equal(r.ok, false);
  assert.equal(r.reason, "empty");
  assert.equal(r.text, "");
});

test("XLSX: a corrupt (non-zip) file is rejected as corrupt", () => {
  const r = extractXlsx(Buffer.from("PK\x03\x04 but truncated garbage"));
  assert.equal(r.ok, false);
  assert.equal(r.reason, "corrupt");
});

// --- dispatch -----------------------------------------------------------

test("dispatch routes by extension and mime, and ignores non-office files", () => {
  assert.equal(officeFormat("q.docx", ""), "docx");
  assert.equal(officeFormat("q.xlsx", ""), "xlsx");
  assert.equal(
    officeFormat("q", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    "docx",
  );
  assert.equal(officeFormat("photo.png", "image/png"), null);
  assert.equal(officeFormat("quote.pdf", "application/pdf"), null);
  // A PDF/image must not be routed through local extraction.
  assert.equal(extractQuoteDocument("quote.pdf", "application/pdf", Buffer.from("%PDF-1.4")), null);
  // A real docx routes and extracts.
  const routed = extractQuoteDocument("quote-basic.docx", "", fixture("quote-basic.docx"));
  assert.ok(routed && routed.ok && /AgroSul/.test(routed.text));
});
