import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(scriptDir, "entry.png");
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const outputPath = join(outputDir, "entry.png");

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);

function hasSignature(bytes: Buffer, signature: Buffer): boolean {
  return bytes.length >= signature.length && bytes.subarray(0, signature.length).equals(signature);
}

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

let sourceBytes: Buffer;
try {
  sourceBytes = readFileSync(sourcePath);
} catch (error) {
  fail(`could not read source image ${sourcePath}: ${(error as Error).message}`);
}

if (!hasSignature(sourceBytes, PNG_SIGNATURE) && !hasSignature(sourceBytes, JPEG_SIGNATURE)) {
  fail(`source image ${sourcePath} is not a PNG or JPEG file`);
}

try {
  mkdirSync(outputDir, { recursive: true });
} catch (error) {
  fail(`could not create output directory ${outputDir}: ${(error as Error).message}`);
}

try {
  writeFileSync(outputPath, sourceBytes);
} catch (error) {
  fail(`could not write output image ${outputPath}: ${(error as Error).message}`);
}

let outputSize: number;
try {
  outputSize = statSync(outputPath).size;
} catch (error) {
  fail(`could not inspect output image ${outputPath}: ${(error as Error).message}`);
}

if (outputSize !== sourceBytes.byteLength) {
  fail(`output size ${outputSize} bytes does not match source size ${sourceBytes.byteLength} bytes`);
}

console.log(`wrote ${outputPath} (${sourceBytes.byteLength} bytes)`);
