// the-picture-that-tastes-of-one entry (Node 22, standard library only).
//
// The entry is one picture of food: a single perfect ripe strawberry,
// generated in the build session, macro food photography. This program
// copies it to the output directory after checking it is a whole
// PNG or JPEG inside the competition's limits (at most 1 MiB, at most
// 1024 by 1024 pixels), so the bytes the judge sees are exactly the
// bytes in the repository.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 1048576;
const MAX_SIDE = 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, 'entry.png');
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const target = join(outDir, 'entry.png');

const bytes = readFileSync(source);
if (bytes.length > MAX_BYTES) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
}

let kind: string;
let width: number;
let height: number;

if (bytes.subarray(0, 8).equals(PNG_MAGIC)) {
  kind = 'PNG';
  // PNG header: width at bytes 16-19, height at bytes 20-23 (big-endian).
  width = bytes.readUInt32BE(16);
  height = bytes.readUInt32BE(20);
} else if (bytes.subarray(0, 3).equals(JPEG_MAGIC)) {
  kind = 'JPEG';
  // Walk JPEG markers until a Start Of Frame (baseline/progressive)
  // gives the dimensions: precision byte, then height, then width.
  let pos = 2;
  let found = false;
  while (pos + 9 <= bytes.length) {
    if (bytes[pos] !== 0xff) {
      throw new Error('entry.png is not a whole JPEG (bad marker)');
    }
    const marker = bytes[pos + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      height = bytes.readUInt16BE(pos + 5);
      width = bytes.readUInt16BE(pos + 7);
      found = true;
      break;
    }
    const len = bytes.readUInt16BE(pos + 2);
    pos += 2 + len;
  }
  if (!found) {
    throw new Error('entry.png is not a whole JPEG (no frame found)');
  }
} else {
  throw new Error('entry.png is neither PNG nor JPEG (bad magic bytes)');
}

if (width > MAX_SIDE || height > MAX_SIDE) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(target, bytes);
console.log(`wrote ${target}: ${width}x${height} ${kind}, ${bytes.length} bytes`);
