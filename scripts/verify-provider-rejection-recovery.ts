import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getCinematicSceneImageProviderRepairPrompt,
  getCinematicThumbnailProviderRepairPrompt,
} from "../src/constants/cinematicPrompts";
import { CINEMATIC_GENERATION_RECOVERY_CONFIG } from "../src/constants/config";
import { isProviderGenerationRejection } from "../src/services/projectImageGenerationService";

const providerRejection =
  "Gemini từ chối tạo nội dung: I can't generate the image due to interests of third-party content providers.";

assert.equal(CINEMATIC_GENERATION_RECOVERY_CONFIG.PROVIDER_REPAIR_ATTEMPTS, 2);
assert.equal(isProviderGenerationRejection(providerRejection), true);
assert.equal(isProviderGenerationRejection("temporary network timeout"), false);

const sceneRepairPrompt = getCinematicSceneImageProviderRepairPrompt(
  "Sun Wukong faces the celestial gate.",
  { id: "scene_001", script: "The hero faces the gate." },
);
assert.match(sceneRepairPrompt, /same approved story moment/i);
assert.match(sceneRepairPrompt, /visible characters, identity anchors, action, composition/i);
assert.match(sceneRepairPrompt, /scene_001/);

const thumbnailRepairPrompt = getCinematicThumbnailProviderRepairPrompt(
  "Epic key art for the final confrontation.",
  { id: "film_cover_1", layoutId: "solo_left_arrow_right" },
);
assert.match(thumbnailRepairPrompt, /approved layout and exact visible headline/i);

const imageGeneratorSource = readFileSync(new URL("../src/server/services/imageGeneratorService.ts", import.meta.url), "utf8");
assert.match(imageGeneratorSource, /terminalWarning = errorMessage/);
assert.match(imageGeneratorSource, /warning: terminalWarning/);

const pipelineSource = readFileSync(new URL("../src/hooks/useAutoVideoPipeline.ts", import.meta.url), "utf8");
assert.doesNotMatch(pipelineSource, /CHARACTER_REFERENCE_PROVIDER_REJECTION_PURPOSE/);
assert.match(pipelineSource, /THUMBNAIL_PROVIDER_REJECTION_PURPOSE/);
assert.match(pipelineSource, /VI_CHARACTER_REFERENCE_REQUIRED/);
assert.match(pipelineSource, /VI_THUMBNAIL_REQUIRED/);
assert.doesNotMatch(pipelineSource, /continuing with the AI-authored identity prompt/i);
assert.doesNotMatch(pipelineSource, /clean film keyframe|keyframe sạch/i);
assert.doesNotMatch(pipelineSource, /PIPELINE_EXTRACT_THUMBNAIL_FRAME/);

const controllerSource = readFileSync(new URL("../src/server/controllers/pipelineController.ts", import.meta.url), "utf8");
assert.doesNotMatch(controllerSource, /getCinematicCharacterReferenceProviderRepairPrompt/);
assert.match(controllerSource, /getCinematicSceneImageProviderRepairPrompt/);
assert.doesNotMatch(controllerSource, /EXTRACT_THUMBNAIL_FRAME/);

process.stdout.write(JSON.stringify({ passed: true, providerRetries: CINEMATIC_GENERATION_RECOVERY_CONFIG.PROVIDER_REPAIR_ATTEMPTS }));
