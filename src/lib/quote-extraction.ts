// Server-side text extraction for uploaded DOCX and XLSX quote files.
//
// WHY THIS EXISTS: the analyze handler forwards PDFs and images to the model, which reads them
// natively. It cannot read .docx/.xlsx binaries, so those must be turned into text HERE and
// passed to the model as text. This module reads the real document parts (not just the
// filename) so the extracted supplier names, product grades, prices and quantities actually
// reach the AI request — and it reports empty / corrupt / image-only files honestly instead of
// pretending a document was parsed.
//
// Dependency-free and framework-free (node:zlib + Buffer only) so it unit-tests with node --test
// and bundles into the server function. Never imported by client code.

import { unzip, NotAZipError } from "./ooxml.ts";
import { getQuoteFileDescriptor } from "./quote-files.ts";

export type ExtractionReason = "corrupt" | "empty" | "image-only";

export interface QuoteExtraction {
  format: "docx" | "xlsx";
  /** True only when readable text/data was extracted. */
  ok: boolean;
  /** The extracted, model-ready text. Empty when ok is false. */
  text: string;
  /** Why extraction produced no usable text. Absent when ok is true. */
  reason?: ExtractionReason;
  /** XLSX: how many worksheets were read (every sheet is included, never skipped). */
  sheetCount?: number;
}

const XML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => safeCodePoint(parseInt(dec, 10)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (m) => XML_ENTITIES[m] ?? m);
}

function safeCodePoint(code: number): string {
  try {
    return Number.isFinite(code) ? String.fromCodePoint(code) : "";
  } catch {
    return "";
  }
}

/** Collapse intra-line whitespace, drop blank lines, and trim. */
function tidy(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, (m) => (m.includes("\t") ? "\t" : " ")).trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .trim();
}

/** All `<t>` text inside a fragment, concatenated (handles rich-text runs). */
function concatTextNodes(fragment: string): string {
  const parts = fragment.match(/<t\b[^>]*>([\s\S]*?)<\/t>/g) ?? [];
  return parts
    .map((p) => decodeEntities(p.replace(/^<t\b[^>]*>/, "").replace(/<\/t>$/, "")))
    .join("");
}

// ---------------------------------------------------------------------------
// DOCX
// ---------------------------------------------------------------------------

function extractDocxText(documentXml: string): { text: string; hasImage: boolean } {
  const hasImage = /<(w:drawing|a:blip|pic:pic|v:imagedata|wp:inline)\b/.test(documentXml);
  // Inside a table cell, a paragraph break must NOT split the row — collapse it to a space so
  // the cell stays a single tab-separated field.
  const cellsFlattened = documentXml.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, (cell) =>
    cell.replace(/<\/w:p>/g, " "),
  );
  // Turn structural boundaries into whitespace, then drop the remaining tags so only the text
  // nodes survive. Table cells become tab-separated, rows and paragraphs newline-separated.
  const withBreaks = cellsFlattened
    .replace(/<w:tab\b[^>]*\/?>/g, "\t")
    .replace(/<w:br\b[^>]*\/?>/g, "\n")
    .replace(/<\/w:tc>/g, "\t")
    .replace(/<\/w:tr>/g, "\n")
    .replace(/<\/w:p>/g, "\n");
  const stripped = withBreaks.replace(/<[^>]+>/g, "");
  return { text: tidy(decodeEntities(stripped)), hasImage };
}

export function extractDocx(bytes: Uint8Array | Buffer): QuoteExtraction {
  let entries: Map<string, Buffer>;
  try {
    entries = unzip(bytes);
  } catch (error) {
    if (error instanceof NotAZipError)
      return { format: "docx", ok: false, text: "", reason: "corrupt" };
    throw error;
  }
  const documentXml = entries.get("word/document.xml")?.toString("utf8");
  if (!documentXml) return { format: "docx", ok: false, text: "", reason: "corrupt" };

  const { text, hasImage } = extractDocxText(documentXml);
  if (text.length > 0) return { format: "docx", ok: true, text };
  return { format: "docx", ok: false, text: "", reason: hasImage ? "image-only" : "empty" };
}

// ---------------------------------------------------------------------------
// XLSX
// ---------------------------------------------------------------------------

function parseSharedStrings(xml: string | undefined): string[] {
  if (!xml) return [];
  const items = xml.match(/<si\b[^>]*>([\s\S]*?)<\/si>/g) ?? [];
  return items.map((si) => concatTextNodes(si));
}

interface SheetRef {
  name: string;
  rid: string;
}

function parseWorkbookSheets(xml: string): SheetRef[] {
  const sheets: SheetRef[] = [];
  const tags = xml.match(/<sheet\b[^>]*\/?>/g) ?? [];
  for (const tag of tags) {
    const name = decodeEntities(tag.match(/\bname="([^"]*)"/)?.[1] ?? "");
    const rid = tag.match(/r:id="([^"]*)"/)?.[1] ?? "";
    sheets.push({ name, rid });
  }
  return sheets;
}

function parseWorkbookRels(xml: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!xml) return map;
  const rels = xml.match(/<Relationship\b[^>]*\/?>/g) ?? [];
  for (const rel of rels) {
    const id = rel.match(/\bId="([^"]*)"/)?.[1];
    const target = rel.match(/\bTarget="([^"]*)"/)?.[1];
    if (id && target) map.set(id, target);
  }
  return map;
}

/** Resolve a workbook-relative worksheet target to its full part path. */
function resolveSheetPath(target: string): string {
  const clean = target.replace(/^\/+/, "");
  if (clean.startsWith("xl/")) return clean;
  return `xl/${clean}`;
}

function cellValue(attrs: string, inner: string, shared: string[]): string {
  const type = attrs.match(/\bt="([^"]*)"/)?.[1] ?? "";
  if (type === "inlineStr") return concatTextNodes(inner);
  const v = inner.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1];
  if (v === undefined) return "";
  if (type === "s") {
    const idx = Number.parseInt(v, 10);
    return Number.isInteger(idx) && idx >= 0 && idx < shared.length ? shared[idx] : "";
  }
  if (type === "b") return v === "1" ? "TRUE" : "FALSE";
  // "str" (formula string result), numbers, dates and formula numbers all use the cached <v>.
  return decodeEntities(v);
}

function extractSheet(xml: string, shared: string[]): string {
  const rows = xml.match(/<row\b[^>]*>[\s\S]*?<\/row>/g) ?? [];
  const lines: string[] = [];
  for (const row of rows) {
    const cells = row.match(/<c\b([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g) ?? [];
    const values = cells.map((cell) => {
      const attrs = cell.match(/^<c\b([^>]*?)(?:\/>|>)/)?.[1] ?? "";
      const inner = cell.match(/>([\s\S]*?)<\/c>$/)?.[1] ?? "";
      return cellValue(attrs, inner, shared);
    });
    if (values.some((value) => value.trim().length > 0)) lines.push(values.join("\t"));
  }
  return lines.join("\n");
}

export function extractXlsx(bytes: Uint8Array | Buffer): QuoteExtraction {
  let entries: Map<string, Buffer>;
  try {
    entries = unzip(bytes);
  } catch (error) {
    if (error instanceof NotAZipError)
      return { format: "xlsx", ok: false, text: "", reason: "corrupt" };
    throw error;
  }
  const workbookXml = entries.get("xl/workbook.xml")?.toString("utf8");
  if (!workbookXml) return { format: "xlsx", ok: false, text: "", reason: "corrupt" };

  const shared = parseSharedStrings(entries.get("xl/sharedStrings.xml")?.toString("utf8"));
  const rels = parseWorkbookRels(entries.get("xl/_rels/workbook.xml.rels")?.toString("utf8"));
  const sheetRefs = parseWorkbookSheets(workbookXml);

  const blocks: string[] = [];
  let sheetCount = 0;
  // Walk sheets in workbook order. Fall back to any worksheet parts not referenced by the
  // workbook rels so a rows/sheets are never silently ignored.
  const consumed = new Set<string>();
  for (const ref of sheetRefs) {
    const target = rels.get(ref.rid);
    const path = target ? resolveSheetPath(target) : "";
    const xml = path ? entries.get(path)?.toString("utf8") : undefined;
    sheetCount++;
    consumed.add(path);
    const body = xml ? extractSheet(xml, shared) : "";
    blocks.push(`Sheet: ${ref.name || `Sheet ${sheetCount}`}\n${body}`.trimEnd());
  }
  for (const [name, buf] of entries) {
    if (!/^xl\/worksheets\/.*\.xml$/.test(name) || consumed.has(name)) continue;
    sheetCount++;
    const body = extractSheet(buf.toString("utf8"), shared);
    blocks.push(`Sheet: ${name}\n${body}`.trimEnd());
  }

  const text = tidy(blocks.join("\n\n"));
  const hasData = blocks.some((b) => b.split("\n").slice(1).join("").trim().length > 0);
  if (hasData) return { format: "xlsx", ok: true, text, sheetCount };
  return { format: "xlsx", ok: false, text: "", reason: "empty", sheetCount };
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** The Office format for a file, or null when it is not a DOCX/XLSX we extract locally. */
export function officeFormat(filename: string, mime: string): "docx" | "xlsx" | null {
  const lower = filename.toLowerCase();
  if (mime === DOCX_MIME || lower.endsWith(".docx")) return "docx";
  if (mime === XLSX_MIME || lower.endsWith(".xlsx")) return "xlsx";
  return null;
}

/**
 * Extract text from a DOCX/XLSX upload, or null when the file is not one we extract locally
 * (PDFs and images are handled by the model directly and must not pass through here).
 */
export function extractQuoteDocument(
  filename: string,
  mime: string,
  bytes: Uint8Array | Buffer,
): QuoteExtraction | null {
  const format = officeFormat(filename, mime);
  if (format === "docx") return extractDocx(bytes);
  if (format === "xlsx") return extractXlsx(bytes);
  return null;
}

// ---------------------------------------------------------------------------
// Model-input assembly (the upload -> AI request contract).
// ---------------------------------------------------------------------------

export interface UploadedFile {
  name: string;
  type: string;
  bytes: Uint8Array | Buffer;
}

export type ModelInput =
  | { type: "input_text"; text: string }
  | { type: "input_file"; filename: string; file_data: string }
  | { type: "input_image"; image_url: string; detail: string };

/** Localized templates (with {file}) for files that could not be read. */
export interface UnreadableMessages {
  docCorrupt: string;
  docEmpty: string;
  docImageOnly: string;
}

function fill(template: string, file: string): string {
  return template.replace(/\{file\}/g, file);
}

/**
 * Turn uploaded files into the model's `content` parts, the single place that decides HOW each
 * upload reaches the AI:
 *   - images  -> input_image (the model reads them),
 *   - PDFs    -> input_file (the model reads them),
 *   - DOCX/XLSX -> extracted locally to input_text so their real supplier names, grades, prices
 *                  and quantities reach the request as text,
 *   - unreadable DOCX/XLSX (empty / image-only / corrupt) -> a localized warning and NO input,
 *     so the request never pretends a document was parsed.
 * Returns the model inputs plus per-file warnings. Never throws on a bad file.
 */
export function buildQuoteModelInputs(
  files: UploadedFile[],
  messages: UnreadableMessages,
): { inputs: ModelInput[]; warnings: string[] } {
  const inputs: ModelInput[] = [];
  const warnings: string[] = [];

  for (const file of files) {
    const descriptor = getQuoteFileDescriptor(file);
    if (!descriptor) continue;

    if (officeFormat(file.name, file.type)) {
      const extraction = extractQuoteDocument(file.name, file.type, file.bytes)!;
      if (extraction.ok) {
        inputs.push({
          type: "input_text",
          text: `Fertilizer quote extracted from the ${extraction.format.toUpperCase()} file "${file.name}":\n${extraction.text}`,
        });
      } else {
        const template =
          extraction.reason === "image-only"
            ? messages.docImageOnly
            : extraction.reason === "empty"
              ? messages.docEmpty
              : messages.docCorrupt;
        warnings.push(fill(template, file.name));
      }
      continue;
    }

    const base64 = Buffer.from(file.bytes).toString("base64");
    const dataUrl = `data:${descriptor.mime};base64,${base64}`;
    inputs.push(
      descriptor.kind === "document"
        ? { type: "input_file", filename: file.name, file_data: dataUrl }
        : { type: "input_image", image_url: dataUrl, detail: "high" },
    );
  }

  return { inputs, warnings };
}
