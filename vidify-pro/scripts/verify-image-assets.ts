import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  readEncodedProjectImage,
  readStyleReferenceImage,
} from "../src/server/services/imageAssetService.ts";
import { createGeminiReferenceFiles } from "../src/server/services/imageGeneratorService.ts";
import { writeVerificationLog } from "./verificationLogger.ts";

const originalAppDataDirectory = process.env.APP_DATA_DIR;
const temporaryRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), "vidify-image-assets-"),
);
const dataDirectory = path.join(temporaryRoot, "data");
const assetDirectory = path.join(
  dataDirectory,
  "assets",
  "projects",
  "test",
  "images",
);
const pngPath = path.join(assetDirectory, "reference.png");
const outsidePath = path.join(temporaryRoot, "outside.png");
const imageBuffer = Buffer.from("image-content");

try {
  process.env.APP_DATA_DIR = temporaryRoot;
  fs.mkdirSync(assetDirectory, { recursive: true });
  fs.writeFileSync(pngPath, imageBuffer);
  fs.writeFileSync(outsidePath, imageBuffer);
  assert.deepEqual(readEncodedProjectImage("data:image/webp;base64,aW1hZ2U="), {
    mimeType: "image/webp",
    data: "aW1hZ2U=",
  });
  const encodedProjectImage = readEncodedProjectImage(
    "/assets/projects/test/images/reference.png",
  );
  assert.equal(encodedProjectImage?.mimeType, "image/png");
  assert.equal(encodedProjectImage?.data, imageBuffer.toString("base64"));
  assert.equal(readEncodedProjectImage("/assets/../../outside.png"), undefined);
  const encodedStyleImage = await readStyleReferenceImage(
    "/assets/projects/test/images/reference.png",
  );
  assert.equal(encodedStyleImage.mimeType, "image/png");
  assert.equal(encodedStyleImage.data, imageBuffer.toString("base64"));
  const referenceFiles = createGeminiReferenceFiles([
    "data:image/webp;base64,aW1hZ2U=",
    "/assets/projects/test/images/reference.png",
  ]);
  assert.equal(referenceFiles.length, 2);
  assert.equal(referenceFiles[0].mimeType, "image/webp");
  assert.equal(referenceFiles[1].mimeType, "image/png");
  assert.equal(referenceFiles[1].buffer.toString(), imageBuffer.toString());
  writeVerificationLog("Image asset assertions passed");
} finally {
  if (originalAppDataDirectory === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = originalAppDataDirectory;
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
