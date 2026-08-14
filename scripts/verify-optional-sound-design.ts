import _ from "lodash";
import { writeVerificationLog } from "./verificationLogger.ts";
import { createRenderAudioTracks } from "../src/services/audioMixService.ts";
import { evaluateFinalQuality } from "../src/services/finalQualityService.ts";
import { applyOptionalMusicAsset, createAudioCueSheet } from "../src/services/soundDesignService.ts";
import { AudioCueStatus, AudioCueType, SceneAssetStatus } from "../src/types.ts";

const assert = (condition: unknown, message: string): void => {
  if (!condition) throw new Error(message);
};

const cueSheet = createAudioCueSheet([
  { id: "scene_1", duration: 5, script: "A door closes", prompt: "wide shot of a closing door" },
] as any);
assert(_.every(cueSheet.cues, cue => !_.has(cue, "required")), "sound design created a mandatory cue");
assert(_.isEmpty(createRenderAudioTracks(cueSheet)), "unresolved optional cues reached the renderer");

const musicAssetUrl = "/assets/projects/project_1/audio/music.mp3";
const cueSheetWithMusic = applyOptionalMusicAsset(cueSheet, musicAssetUrl);
const renderTracks = createRenderAudioTracks(cueSheetWithMusic);
assert(_.size(renderTracks) === 1, "approved optional music was not added to the mix");
assert(_.get(_.first(renderTracks), "assetUrl") === musicAssetUrl, "optional music asset changed before render");
assert(_.some(cueSheetWithMusic.cues, { type: AudioCueType.Music, status: AudioCueStatus.Approved }), "optional music was not approved");

const legacyCueSheet = {
  ...cueSheet,
  cues: _.map(cueSheet.cues, cue => ({ ...cue, required: true })),
};
const project = {
  storyboard: [{ assetUrl: "asset", assetStatus: SceneAssetStatus.Approved }],
  visualConfig: { thumbnailCount: 1 },
  thumbnails: [{ approved: true, qa: { passed: true } }],
  voiceConfig: { audioBase64: "real-audio", audioQa: { passed: true } },
  subtitleQa: { passed: true },
  editorQa: { passed: true },
  scriptQa: { passed: true, continuityScore: 90, emotionalArcScore: 90, hookPayoffScore: 90 },
  storyboardQa: { passed: true },
  contentSafety: { allowed: true },
  renderedVideoUrl: "video",
  finalMultimodalQa: { passed: true, reviewAvailable: true },
  manualReviewItems: [],
  audioCueSheet: legacyCueSheet,
} as any;
const finalQuality = evaluateFinalQuality(project);
assert(finalQuality.publishable, "missing optional sound blocked final quality");
assert(!_.includes(finalQuality.blockingErrors, "required_sound_assets_missing"), "legacy sound requirement blocked final quality");
assert(!_.includes(finalQuality.warnings, "sound_design_cues_not_mixed"), "missing optional sound created a final warning");

writeVerificationLog("Optional sound design assertions passed");
