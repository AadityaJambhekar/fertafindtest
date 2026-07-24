// Task-5 coverage: every quote file format the product promises must be (a) accepted by the
// client/server guard and (b) routed to the correct OpenAI Responses input part. The server
// (routes/api.analyze-quotes.ts) sends `descriptor.kind === "document"` as `input_file` and an
// image kind as `input_image`; OpenAI performs the actual text/data extraction. This test locks
// the accept + routing contract for JPG, PNG, PDF, DOCX, XLSX, CSV and TXT so a future edit
// cannot silently drop a format or send a document down the image path (or vice-versa).

import assert from "node:assert/strict";
import test from "node:test";
import { getQuoteFileDescriptor, quoteFileError, isQuoteFileSupported } from "./quote-files.ts";

const fileLike = (name: string, type: string, size = 2048) => ({ name, type, size });

// name, canonical mime, and the input-part kind the server must choose.
const FORMATS: Array<{ label: string; name: string; mime: string; kind: "image" | "document" }> = [
  { label: "JPG", name: "quote.jpg", mime: "image/jpeg", kind: "image" },
  { label: "PNG", name: "quote.png", mime: "image/png", kind: "image" },
  { label: "PDF", name: "quote.pdf", mime: "application/pdf", kind: "document" },
  {
    label: "DOCX",
    name: "quote.docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    kind: "document",
  },
  {
    label: "XLSX",
    name: "quote.xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    kind: "document",
  },
  { label: "CSV", name: "quote.csv", mime: "text/csv", kind: "document" },
  { label: "TXT", name: "quote.txt", mime: "text/plain", kind: "document" },
];

for (const fmt of FORMATS) {
  test(`${fmt.label} is accepted and routed as a ${fmt.kind}`, () => {
    const file = fileLike(fmt.name, fmt.mime);
    assert.equal(quoteFileError(file), "", `${fmt.label} must be accepted`);
    assert.ok(isQuoteFileSupported(file), `${fmt.label} must be supported`);
    const descriptor = getQuoteFileDescriptor(file);
    assert.ok(descriptor, `${fmt.label} must resolve a descriptor`);
    assert.equal(descriptor!.kind, fmt.kind, `${fmt.label} routes to the ${fmt.kind} input part`);
  });

  test(`${fmt.label} is still recognized by extension when the browser sends no mime`, () => {
    // Some browsers/OSes upload with an empty type; extension detection must still route it.
    const descriptor = getQuoteFileDescriptor(fileLike(fmt.name, ""));
    assert.ok(descriptor, `${fmt.label} must resolve by extension alone`);
    assert.equal(descriptor!.kind, fmt.kind);
  });
}

test("a corrupt/unknown binary is rejected with a safe, non-technical message", () => {
  const message = quoteFileError(fileLike("statement.exe", "application/x-msdownload"));
  assert.notEqual(message, "", "unsupported files must be rejected");
  // The message must read like guidance, never a stack trace or provider error.
  assert.doesNotMatch(message, /stack|undefined|null|error:|openai|http|\bat\b/i);
});
