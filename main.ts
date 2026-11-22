// One Mango, Perfectly Ripe — entry writer.
//
// Copies the single-ingredient photograph (mango.jpg, repo root) into the
// output directory as entry.png, but only after proving the file is a whole,
// in-limits PNG or JPEG. Nothing is written until every check passes.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Limits from the bounty: a whole PNG or JPEG, at most 1,048,576 bytes and
// at most 1024 x 1024 pixels.
// ---------------------------------------------------------------------------
const MAX_BYTES = 1_048_576;
const MAX_WIDTH = 1024;
const MAX_HEIGHT = 1024;

// The photograph this entry is built around. One ingredient, nothing else.
const ASSET_NAME = "mango.jpg";
const OUTPUT_NAME = "entry.png";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// ---------------------------------------------------------------------------
// Format sniffing: magic bytes first, then real dimension parsing.
// ---------------------------------------------------------------------------
function sniffKind(buf) {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "png";
  }
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) {
    return "jpeg";
  }
  return null;
}

function pngDimensions(buf) {
  // IHDR chunk: width and height are big-endian uint32 at offsets 16 and 20.
  if (buf.length < 24 || buf.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("PNG is missing a valid IHDR chunk");
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function jpegDimensions(buf) {
  // Walk the marker segments until a Start-Of-Frame marker gives the size.
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) throw new Error("JPEG stream is corrupted");
    const marker = buf[offset + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const segmentLength = buf.readUInt16BE(offset + 2);
    // SOF0 / SOF1 / SOF2 carry height then width (big-endian uint16).
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + segmentLength;
  }
  throw new Error("JPEG has no Start-Of-Frame segment");
}

function measureImage(buf) {
  const kind = sniffKind(buf);
  if (kind === null) {
    throw new Error("asset is neither PNG nor JPEG (magic bytes do not match)");
  }
  const dims = kind === "png" ? pngDimensions(buf) : jpegDimensions(buf);
  return { kind, ...dims };
}

// ---------------------------------------------------------------------------
// Guard: byte size, then dimensions. Fail loudly before any write happens.
// ---------------------------------------------------------------------------
function guardLimits(buf, measured) {
  if (buf.length > MAX_BYTES) {
    throw new Error(`image is ${buf.length} bytes, over the ${MAX_BYTES} byte limit`);
  }
  if (measured.width > MAX_WIDTH || measured.height > MAX_HEIGHT) {
    throw new Error(
      `image is ${measured.width}x${measured.height}, over the ${MAX_WIDTH}x${MAX_HEIGHT} limit`,
    );
  }
}

// ---------------------------------------------------------------------------
// Post-write verification: re-read what landed on disk and prove it is the
// same file we checked, byte for byte, still inside every limit. Any
// mismatch is fatal — a half-written entry must never look like success.
// ---------------------------------------------------------------------------
function verifyWritten(outPath, originalBytes) {
  const written = readFileSync(outPath);
  if (!written.equals(originalBytes)) {
    throw new Error(`written file ${outPath} differs from the verified asset`);
  }
  const measured = measureImage(written);
  guardLimits(written, measured);
  console.log(
    `post-write check OK: ${outPath} is byte-identical, ${measured.kind} ${measured.width}x${measured.height}, ${written.length} bytes`,
  );
}

// ---------------------------------------------------------------------------
// Main flow.
// ---------------------------------------------------------------------------
function main() {
  const assetPath = join(repoRoot, ASSET_NAME);
  const bytes = readFileSync(assetPath);

  const measured = measureImage(bytes);
  guardLimits(bytes, measured);
  console.log(
    `verified ${ASSET_NAME}: ${measured.kind} ${measured.width}x${measured.height}, ${bytes.length} bytes — within limits`,
  );

  mkdirSync(outputDir, { recursive: true });
  const outPath = join(outputDir, OUTPUT_NAME);
  writeFileSync(outPath, bytes);
  console.log(`wrote ${outPath} (${bytes.length} bytes)`);

  verifyWritten(outPath, bytes);
}

main();
