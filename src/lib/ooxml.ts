// Minimal, dependency-free ZIP reader for Office Open XML (DOCX / XLSX) parts.
//
// DOCX and XLSX are ZIP containers of XML parts. We read them without a third-party
// dependency: parse the End Of Central Directory record, walk the central directory (which
// authoritatively records each entry's compression method and sizes), then inflate each
// entry with node:zlib. Only STORE (0) and DEFLATE (8) are used by Office; anything else is
// rejected. Server-only (uses node:zlib + Buffer) — never imported by client code.

import { inflateRawSync } from "node:zlib";

const EOCD_SIG = 0x06054b50; // End Of Central Directory
const CDH_SIG = 0x02014b50; // Central Directory File Header
const LFH_SIG = 0x04034b50; // Local File Header

/** Thrown when the bytes are not a readable ZIP (used to flag a corrupt upload). */
export class NotAZipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotAZipError";
  }
}

function toBuffer(bytes: Uint8Array | Buffer): Buffer {
  return Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
}

/** Locate the End Of Central Directory record by scanning back from the tail. */
function findEocd(buf: Buffer): number {
  // The EOCD is 22 bytes + up to 65535 of comment. Scan back from the last possible start.
  const minStart = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= minStart; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) return i;
  }
  return -1;
}

/**
 * Decompress every file entry of a ZIP into a name -> bytes map.
 * Directory entries (names ending in "/") are skipped. Throws NotAZipError on malformed input.
 */
export function unzip(bytes: Uint8Array | Buffer): Map<string, Buffer> {
  const buf = toBuffer(bytes);
  if (buf.length < 22 || buf.readUInt32LE(0) !== LFH_SIG) {
    // Not strictly required (some zips start elsewhere), but Office files always begin with a
    // local file header; a missing signature is the fast, reliable "not a real docx/xlsx" tell.
    if (findEocd(buf) === -1) throw new NotAZipError("Missing ZIP signature.");
  }
  const eocd = findEocd(buf);
  if (eocd === -1) throw new NotAZipError("No End Of Central Directory record.");

  const entryCount = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16); // central directory start offset

  const out = new Map<string, Buffer>();
  for (let i = 0; i < entryCount; i++) {
    if (ptr + 46 > buf.length || buf.readUInt32LE(ptr) !== CDH_SIG) {
      throw new NotAZipError("Corrupt central directory.");
    }
    const method = buf.readUInt16LE(ptr + 10);
    const compressedSize = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localOffset = buf.readUInt32LE(ptr + 42);
    const name = buf.toString("utf8", ptr + 46, ptr + 46 + nameLen);
    ptr += 46 + nameLen + extraLen + commentLen;

    if (name.endsWith("/")) continue; // directory entry

    // The local header's OWN name/extra lengths locate the data (its extra field can differ
    // from the central directory's), while the central directory owns the compressed size.
    if (buf.readUInt32LE(localOffset) !== LFH_SIG) throw new NotAZipError("Corrupt local header.");
    const lNameLen = buf.readUInt16LE(localOffset + 26);
    const lExtraLen = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(dataStart, dataStart + compressedSize);

    let content: Buffer;
    if (method === 0) content = Buffer.from(raw);
    else if (method === 8) {
      try {
        content = inflateRawSync(raw);
      } catch {
        throw new NotAZipError(`Could not inflate entry: ${name}`);
      }
    } else {
      throw new NotAZipError(`Unsupported compression method ${method} for ${name}`);
    }
    out.set(name, content);
  }
  return out;
}

/** Read a single entry as a UTF-8 string, or null when absent. */
export function readEntryText(entries: Map<string, Buffer>, name: string): string | null {
  const entry = entries.get(name);
  return entry ? entry.toString("utf8") : null;
}
