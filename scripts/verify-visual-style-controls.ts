import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { BACKGROUND_MODE_CONFIG, PROJECT_ASSET_GROUP, THUMBNAIL_TEXT_MODE_CONFIG } from "../src/constants/config.ts";
import { STYLE_EXTRACTION_PROMPT, THUMBNAIL_STYLE_EXTRACTION_PROMPT, VISUAL_BIBLE_REFERENCE_PROMPT } from "../src/constants/prompts.ts";
import { BackgroundMode, TextInImageMode, ThumbnailTextMode } from "../src/types.ts";
import { normalizeBackgroundMode, normalizeThumbnailTextMode, SCENE_TEXT_MODE } from "../src/services/visualConfigModeService.ts";
import { createCharacterConstructionDirective, createSoftStyleDirective, createThumbnailStyleDirective } from "../src/services/styleReferenceService.ts";
import { deduplicateVisualStyleText } from "../src/services/visualStyleDisplayService.ts";

assert.deepEqual(BACKGROUND_MODE_CONFIG.OPTIONS, ["auto", "minimal", "contextual", "transparent"]);
assert.equal(Object.values(BACKGROUND_MODE_CONFIG.DESCRIPTIONS.vi).every(Boolean), true);
assert.deepEqual(THUMBNAIL_TEXT_MODE_CONFIG.OPTIONS, ["headline", "no_text"]);
assert.equal(Object.values(THUMBNAIL_TEXT_MODE_CONFIG.DESCRIPTIONS.vi).every(Boolean), true);
assert.equal(SCENE_TEXT_MODE, TextInImageMode.NoText);
assert.equal(normalizeBackgroundMode(BackgroundMode.White), BackgroundMode.Minimal);
assert.equal(normalizeThumbnailTextMode(TextInImageMode.Auto), ThumbnailTextMode.Headline);
assert.match(STYLE_EXTRACTION_PROMPT, /sampleSpecificContent/);
assert.match(STYLE_EXTRACTION_PROMPT, /characterType/);
assert.match(STYLE_EXTRACTION_PROMPT, /script controls setting, period, action, mood, lighting and composition/i);
assert.match(THUMBNAIL_STYLE_EXTRACTION_PROMPT, /thumbnail presentation profile/i);
assert.match(THUMBNAIL_STYLE_EXTRACTION_PROMPT, /must never replace it/i);
assert.match(THUMBNAIL_STYLE_EXTRACTION_PROMPT, /sampleSpecificContent/);
assert.match(THUMBNAIL_STYLE_EXTRACTION_PROMPT, /words, logos/);
assert.match(VISUAL_BIBLE_REFERENCE_PROMPT, /soft visual-language reference/);

const styleProfile = {
  medium: "2D digital cartoon illustration composited over a textured photographic background",
  characterType: "stick-figure character construction",
  characterDna: "round heads, capsule-shaped torsos, thin stick limbs and dot eyes",
  lineDna: "Bold clean dark outlines defining shapes and facial features",
  colorDna: "Muted earthy color palette with soft gradients",
  renderingDna: "Soft internal gradients with minimal shading",
  periodCues: "",
  worldRendering: "Textured realistic backgrounds contrasted with flat cartoon characters",
  adaptiveElements: "Scene specific",
  sampleSpecificContent: ["dark stone room"],
};
assert.match(createSoftStyleDirective(styleProfile), /Every person uses the same stickfigure character construction/);
assert.match(createSoftStyleDirective(styleProfile), /thin stick limbs and dot eyes/);
assert.doesNotMatch(createSoftStyleDirective(styleProfile), /dark stone room/);
assert.match(createCharacterConstructionDirective(styleProfile), /capsuleshaped torsos/);
const alternateThumbnailProfile = {
  ...styleProfile,
  medium: "photorealistic portrait",
  characterType: "realistic human photography",
  characterDna: "full anatomical bodies",
  worldRendering: "high contrast illustrated background",
};
const thumbnailStyle = createThumbnailStyleDirective(styleProfile, alternateThumbnailProfile);
assert.match(thumbnailStyle, /capsuleshaped torsos/);
assert.match(thumbnailStyle, /high contrast illustrated background/);
assert.doesNotMatch(thumbnailStyle, /full anatomical bodies/);
const repeatedVisualDna = "Visual DNA: 2D stickfigure cartoon style set against a moody background.Visual DNA: 2D stickfigure cartoon style set against a moody background.";
assert.equal(
  deduplicateVisualStyleText(repeatedVisualDna),
  "Visual DNA: 2D stickfigure cartoon style set against a moody background.",
);

const pipeline = fs.readFileSync(path.resolve("src/hooks/useAutoVideoPipeline.ts"), "utf8");
assert.match(pipeline, /purpose: StyleReferencePurpose\.Scene/);
assert.match(pipeline, /purpose: StyleReferencePurpose\.Thumbnail/);
assert.doesNotMatch(pipeline, /referencesAreShared/);

const controller = fs.readFileSync(path.resolve("src/server/controllers/pipelineController.ts"), "utf8");
assert.match(controller, /cachePayload[\s\S]*purpose/);
assert.match(controller, /profileVersion: STYLE_EXTRACTION_CONFIG\.PROFILE_VERSION/);
assert.match(controller, new RegExp(`PROJECT_ASSET_GROUP\\.${PROJECT_ASSET_GROUP.VISUALS.toUpperCase()}`));
assert.match(controller, /REFERENCE_ASSET_GROUP\.CHARACTER/);
assert.match(controller, /REFERENCE_ASSET_GROUP\.UPSCALED/);

process.stdout.write("Visual style control assertions passed.\n");
