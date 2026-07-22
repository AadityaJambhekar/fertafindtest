export const MAX_QUOTE_FILES = 8;
export const MAX_QUOTE_FILE_BYTES = 10 * 1024 * 1024;

export type QuoteFileKind = "image" | "document";

type QuoteFileLike = {
  name: string;
  type: string;
  size?: number;
};

type QuoteFileDescriptor = {
  kind: QuoteFileKind;
  mime: string;
  label: string;
};

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "JPEG image",
  "image/png": "PNG image",
  "image/webp": "WebP image",
  "image/gif": "GIF image",
};

const DOCUMENT_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "Word document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word document",
  "application/vnd.ms-excel": "Excel spreadsheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel spreadsheet",
  "text/csv": "CSV file",
  "application/csv": "CSV file",
  "text/plain": "text file",
  "application/rtf": "RTF document",
  "text/rtf": "RTF document",
};

const EXTENSION_TYPES: Record<string, QuoteFileDescriptor> = {
  jpg: { kind: "image", mime: "image/jpeg", label: "JPEG image" },
  jpeg: { kind: "image", mime: "image/jpeg", label: "JPEG image" },
  png: { kind: "image", mime: "image/png", label: "PNG image" },
  webp: { kind: "image", mime: "image/webp", label: "WebP image" },
  gif: { kind: "image", mime: "image/gif", label: "GIF image" },
  pdf: { kind: "document", mime: "application/pdf", label: "PDF" },
  doc: { kind: "document", mime: "application/msword", label: "Word document" },
  docx: {
    kind: "document",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    label: "Word document",
  },
  xls: { kind: "document", mime: "application/vnd.ms-excel", label: "Excel spreadsheet" },
  xlsx: {
    kind: "document",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    label: "Excel spreadsheet",
  },
  csv: { kind: "document", mime: "text/csv", label: "CSV file" },
  txt: { kind: "document", mime: "text/plain", label: "text file" },
  rtf: { kind: "document", mime: "application/rtf", label: "RTF document" },
};

export const QUOTE_FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf,.jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf";

export const QUOTE_FILE_HELP_TEXT =
  "Images, PDFs, Word, Excel, CSV or pasted text · up to 8 files.";

function extensionFor(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function getQuoteFileDescriptor(file: QuoteFileLike): QuoteFileDescriptor | null {
  if (file.type in IMAGE_TYPES) {
    return { kind: "image", mime: file.type, label: IMAGE_TYPES[file.type] };
  }
  if (file.type in DOCUMENT_TYPES) {
    return { kind: "document", mime: file.type, label: DOCUMENT_TYPES[file.type] };
  }
  return EXTENSION_TYPES[extensionFor(file.name)] ?? null;
}

export function isQuoteFileSupported(file: QuoteFileLike) {
  return Boolean(getQuoteFileDescriptor(file));
}

export function quoteFileError(file: QuoteFileLike) {
  if (!isQuoteFileSupported(file)) {
    return `${file.name || "That file"} is not a supported quote file. Use an image, PDF, Word, Excel, CSV, RTF or text file.`;
  }
  if (typeof file.size === "number" && file.size > MAX_QUOTE_FILE_BYTES) {
    return `${file.name || "That file"} is over 10 MB.`;
  }
  return "";
}
