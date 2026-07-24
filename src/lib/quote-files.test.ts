import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_QUOTE_FILES,
  MIN_QUOTE_FILES,
  quoteCountError,
  quoteFileError,
} from "./quote-files.ts";

// A tiny stand-in for the browser File shape that quoteFileError accepts.
const fileLike = (name: string, type: string, size = 1024) => ({
  name,
  type,
  size,
});

test("zero quotes are rejected", () => {
  assert.notEqual(quoteCountError(0), "");
});

test("one quote is accepted — a single quote is the minimum", () => {
  assert.equal(MIN_QUOTE_FILES, 1);
  assert.equal(quoteCountError(1), "");
});

test("two or more quotes are still accepted", () => {
  assert.equal(quoteCountError(2), "");
  assert.equal(quoteCountError(5), "");
  assert.equal(quoteCountError(MAX_QUOTE_FILES), "");
});

test("the maximum file limit is unchanged and more than the maximum is rejected", () => {
  assert.equal(MAX_QUOTE_FILES, 8);
  assert.notEqual(quoteCountError(MAX_QUOTE_FILES + 1), "");
});

test("a single uploaded image counts as a valid quote", () => {
  assert.equal(quoteFileError(fileLike("quote.jpg", "image/jpeg")), "");
});

test("a single manually pasted text quote counts as a valid quote", () => {
  // Pasted quote text is turned into a text/plain File in the analyze flow.
  assert.equal(quoteFileError(fileLike("pasted-quote.txt", "text/plain")), "");
});

test("an unsupported (unparsable) file does not count as a valid quote", () => {
  assert.notEqual(
    quoteFileError(fileLike("malware.exe", "application/x-msdownload")),
    "",
  );
});

test("an oversized quote file is rejected", () => {
  assert.notEqual(
    quoteFileError(fileLike("huge.pdf", "application/pdf", 11 * 1024 * 1024)),
    "",
  );
});
