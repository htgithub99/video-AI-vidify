import { resolveSourceTextConstants } from "./sourceTextAssertions";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GEMINI_IMAGES_ASPECT_CONFIG } from "../src/constants/config.ts";
import { AspectRatio } from "../src/types.ts";
import { writeVerificationLog } from "./verificationLogger.ts";

const serviceSource = resolveSourceTextConstants(readFileSync(new URL("../src/server/services/imageGeneratorService.ts", import.meta.url), "utf8"));

for (const ratio of Object.values(AspectRatio)) {
  assert.match(ratio, GEMINI_IMAGES_ASPECT_CONFIG.VALUE_PATTERNS[ratio]);
}

assert.match(serviceSource, /const isImageGeneration = !_.isEqual\(visualConfig\?\.generateType, GenerateType\.Video\);/);
assert.match(serviceSource, /if \(isImageGeneration\) \{[\s\S]*?targetModelRegex = GEMINI_MODEL_FLASH_REGEX;[\s\S]*?fallbackModelRegex = GEMINI_MODEL_FLASH_FAMILY_REGEX;/);
assert.doesNotMatch(serviceSource, /!_.isEqual\(visualConfig\.generateType, GenerateType\.Video\) \|\| \(await configureGeminiModel/);
assert.match(serviceSource, /const modelConfigured = await configureGeminiModel\(activePage!, visualConfig\);/);
assert.match(serviceSource, /const modelConfigured = await configureGeminiModel\(page, itemVisualConfig\)\.catch\(\(\) => false\);/);
assert.match(serviceSource, /await configureGeminiAspectRatio\(page, \(visualConfig\?\.aspectRatio \|\| AspectRatio\.SixteenNine\) as AspectRatio\);/);

writeVerificationLog("Gemini Images aspect-ratio assertions passed");
