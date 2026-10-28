import assert from "node:assert/strict";
import { CURATED_STYLE_PRESETS } from "../src/constants/stylePresets.ts";
import { getPipelineInvalidationState } from "../src/features/video-generation/hooks/autoVideoPipelineUtils.ts";
const preset = CURATED_STYLE_PRESETS.meme_hai_huoc_2d;
const sharedConfig = { genre: "story", language: "vi", duration: "60", rewriteLevel: 1, similarityReduction: 0, creativityLevel: 1, factCheck: false, audience: "general", writingStyle: "narrative", splitStrategy: "sentence" };
const project: any = {
  input: { type: "text", content: "same script" },
  config: sharedConfig,
  scriptRewritten: "same script",
  contentSafety: { allowed: true },
  storyboard: [{ id: "sc_1", assetUrl: "/assets/sc_1.jpg" }],
  voiceConfig: { audioUrl: "/assets/narration.mp3", provider: "edge", voiceURI: "voice", voiceName: "voice", speed: 1, pitch: 1, volume: 1 },
  thumbnails: [{ id: "th_1", imageUrl: "/assets/thumb.jpg" }],
  visualConfig: {
    style: preset.positivePrompt,
    thumbnailReferencePrompt: preset.positivePrompt,
    thumbnailCount: 1,
    thumbnailBackgroundMode: "auto",
    thumbnailTextInImageMode: "headline",
    thumbnailImageFocusMode: "default",
    generationMode: "gemini_chat",
    imageGeneratorEngine: "veo3",
    generateType: "image",
    maxVideoScenes: 0,
    imageFocusMode: "default",
    aspectRatio: "16:9",
    chromeHeadless: true,
    videoDuration: "5",
    styleBackgroundMode: "auto",
    styleTextInImageMode: "no_text",
  },
};
const config: any = {
  ...sharedConfig,
  inputType: "text",
  scriptContent: "same script",
  voiceProvider: "edge",
  voiceURI: "voice",
  voiceName: "voice",
  voiceSpeed: 1,
  voicePitch: 1,
  voiceVolume: 1,
  generationMode: "gemini_chat",
  imageGeneratorEngine: "veo3",
  generateType: "image",
  maxVideoScenes: 0,
  imageFocusMode: "default",
  aspectRatio: "16:9",
  chromeHeadless: true,
  videoDuration: "5",
  styleBackgroundMode: "auto",
  styleTextInImageMode: "no_text",
  thumbnailStylePreset: preset.id,
  stylePreset: preset.id,
  thumbnailCount: 1,
  thumbnailBackgroundMode: "auto",
  thumbnailTextInImageMode: "headline",
  thumbnailImageFocusMode: "default",
};
const references = { hasVisualOverrides: false, shouldRegenerateSceneAssets: false, shouldRegenerateStoryboard: false, shouldRegenerateThumbnails: false };
assert.equal(getPipelineInvalidationState(project, config, references).regenerateThumbnails, false);
assert.equal(getPipelineInvalidationState(project, { ...config, thumbnailCount: 2 }, references).regenerateThumbnails, true);
process.stdout.write("Thumbnail reuse assertions passed.\n");
