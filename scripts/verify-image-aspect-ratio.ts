import assert from "node:assert/strict";
import { isImageAspectRatioCompatible, readBase64ImageDimensions } from "../src/server/utils/imageAspectRatio.ts";
import { writeVerificationLog } from "./verificationLogger.ts";
const createPngHeader = (width: number, height: number): string => {
  const buffer = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(buffer);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer.toString("base64");
};
const landscape = createPngHeader(1920, 1080);
const square = createPngHeader(1024, 1024);
assert.deepEqual(readBase64ImageDimensions(landscape), { width: 1920, height: 1080 });
assert.equal(isImageAspectRatioCompatible(landscape, "16:9"), true);
assert.equal(isImageAspectRatioCompatible(square, "16:9"), false);
assert.equal(isImageAspectRatioCompatible(square, "1:1"), true);
assert.equal(isImageAspectRatioCompatible("unsupported", "16:9"), true);
writeVerificationLog("Image aspect-ratio assertions passed");
