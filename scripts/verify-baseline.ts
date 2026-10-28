import { resolveSourceTextConstants } from "./sourceTextAssertions";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { GENRE_OPTION_GROUPS, normalizeGenreValue } from "../src/constants/data.ts";
import { VideoGenre } from "../src/constants/enums.ts";
import { resolveVisualConfig } from "../src/services/autoVideoConfigResolver.ts";
import { createDependencyHash, createSceneDependencyHash, inheritApprovedSceneAsset } from "../src/services/dependencyHashService.ts";
import { createManualReviewItems, evaluateFinalQuality } from "../src/services/finalQualityService.ts";
import { getSceneAssetSummary } from "../src/services/projectImageGenerationService.ts";
import { evaluateAudioTiming, evaluateThumbnail } from "../src/services/productionQualityService.ts";
import { normalizeHookScore, normalizeScriptQualityReport, parseTargetDurationSeconds } from "../src/services/scriptQualityService.ts";
import { AiTaskCapability, routeAiTask } from "../src/server/services/taskRouterService.ts";
import { GenerateType, ImageGeneratorEngine, SceneAssetStatus, TextInImageMode } from "../src/types.ts";
import { writeVerificationLog } from "./verificationLogger.ts";
import { getChapterWriterPrompt, getHookGeneratorPrompt } from "../src/constants/prompts.ts";
const assert = (condition: unknown, message: string): void => {
  if (!condition) throw new Error(message);
};
const visual = resolveVisualConfig({ generateType: GenerateType.Image, imageGeneratorEngine: ImageGeneratorEngine.Veo3, videoDuration: "8s", maxVideoScenes: 3, characterConsistency: true, styleTextInImageMode: TextInImageMode.NoText } as any);
assert(visual.config.imageGeneratorEngine === ImageGeneratorEngine.Imagen && !visual.config.videoDuration && !visual.config.characterConsistency, "config resolver gate failed");
const scenes = _.times(52, (index) => ({ id: `sc_${index + 1}`, assetUrl: index < 31 ? "asset" : undefined, assetStatus: index < 31 ? SceneAssetStatus.Approved : SceneAssetStatus.Pending }) as any);
assert(!getSceneAssetSummary(scenes).complete && getSceneAssetSummary(scenes).missingSceneIds.length === 21, "31/52 reconciliation failed");
assert(!normalizeHookScore({ factualSafety: 40, retention: 100, clarity: 100, emotion: 100 }).accepted, "unsafe hook was accepted");
assert(!normalizeHookScore({ factualSafety: 100, retention: 100, clarity: 100, emotion: 100, unsupportedClaim: true }).accepted, "unsupported factual hook accepted");
const flexibleDuration = normalizeScriptQualityReport({ continuityScore: 100, repetitionScore: 100, factualityScore: 100, emotionalArcScore: 100, conversationalScore: 100, hookPayoffScore: 100, blockingErrors: [], warnings: [], suggestedPatches: [] }, 948, 300);
assert(flexibleDuration.passed && flexibleDuration.durationFit && flexibleDuration.blockingErrors.length === 0, "reasonable flexible duration was rejected");
const shortDurationAdvisory = normalizeScriptQualityReport({ continuityScore: 100, repetitionScore: 100, factualityScore: 100, emotionalArcScore: 100, conversationalScore: 100, hookPayoffScore: 100, blockingErrors: [], warnings: [], suggestedPatches: [] }, 118, 120);
assert(shortDurationAdvisory.passed && !shortDurationAdvisory.durationFit && shortDurationAdvisory.warnings.includes("script_duration_out_of_target"), "short duration did not remain advisory");
const strongLanguageAdvisory = normalizeScriptQualityReport({ continuityScore: 85, repetitionScore: 85, factualityScore: 85, emotionalArcScore: 85, conversationalScore: 85, hookPayoffScore: 85, blockingErrors: ["The title uses harsh editorial language"], warnings: [], suggestedPatches: [] }, 300, 120);
assert(strongLanguageAdvisory.passed && strongLanguageAdvisory.blockingErrors.length === 0, "strong editorial language blocked the script");
const audioTiming = evaluateAudioTiming(140, parseTargetDurationSeconds("5m"));
assert(!audioTiming.passed && !audioTiming.durationFit && audioTiming.warnings.includes("audio_perceptual_qa_pending"), "audio perceptual quality gate failed");
const badThumbnail = evaluateThumbnail({ anatomy: 20, subjectCount: 90, promptAlignment: 90, characterConsistency: 90, composition: 90, styleConsistency: 90, editability: 90, usableForVideo: false, blockingErrors: ["missing_head"], warnings: [] });
assert(!badThumbnail.passed, "headless thumbnail accepted");
const hash = createSceneDependencyHash({ id: "sc_1", prompt: "p", script: "s" }, { style: "a" });
const previous = { id: "sc_1", prompt: "p", script: "s", dependencyHash: hash, assetUrl: "asset", assetStatus: SceneAssetStatus.Approved } as any;
assert(inheritApprovedSceneAsset({ ...previous, assetUrl: undefined }, previous).assetUrl === "asset", "approved lineage inheritance failed");
assert(createDependencyHash("data:image/png;base64,AAAA") === createDependencyHash("data:image/png;base64,BBBB"), "base64 leaked into dependency hash");
let budgetBlocked = false;
try {
  routeAiTask({ capability: AiTaskCapability.ScriptWriting, estimatedInputTokens: 1_000_000, maxOutputTokens: 1_000_000, budgetUsd: 0.01 });
} catch {
  budgetBlocked = true;
}
assert(budgetBlocked, "budget ceiling failed");
const project: any = {
  storyboard: [{ assetUrl: "asset", assetStatus: SceneAssetStatus.Approved }],
  thumbnails: [],
  voiceConfig: { audioBase64: "real-audio", audioQa: { passed: true } },
  subtitleQa: { passed: true },
  editorQa: { passed: true },
  scriptQa: { passed: true, continuityScore: 96, emotionalArcScore: 90, hookPayoffScore: 90 },
  renderedVideoUrl: "video",
  finalMultimodalQa: { passed: true },
  manualReviewItems: [],
};
assert(evaluateFinalQuality(project).publishable, "thumbnail incorrectly blocked a complete video");
const satiricalGenres = [VideoGenre.SATIRICAL_LIFE_AUTO, VideoGenre.TRANSFORMATION_TIMELINE, VideoGenre.CAREER_SOCIAL_DARKSIDE, VideoGenre.DOWNFALL_CONSEQUENCE, VideoGenre.DARK_COMEDY_TRAGEDY];
assert(_.isEqual(GENRE_OPTION_GROUPS[0].options, satiricalGenres), "satirical genre group changed");
const visibleGenres = _.flatMap(GENRE_OPTION_GROUPS, "options");
assert(visibleGenres.length === 16 && _.uniq(visibleGenres).length === visibleGenres.length, "genre list is not compact and unique");
assert(normalizeGenreValue(VideoGenre.STORYTELLING) === VideoGenre.STORY_DRIVEN_VIDEO_ESSAY && normalizeGenreValue("Documentary") === VideoGenre.HISTORY && normalizeGenreValue("Education") === VideoGenre.NARRATIVE_EXPLAINER && normalizeGenreValue(VideoGenre.PHILOSOPHY) === VideoGenre.PSYCHOLOGY, "legacy genre normalization failed");
const satiricalChapterPrompt = getChapterWriterPrompt("Chương 1", "Mô tả", VideoGenre.SATIRICAL_LIFE_AUTO, "Documentary", true, "", "", 220, "sentence", "Trạng thái");
assert(/SATIRICAL SPOKEN-LANGUAGE CONTRACT/.test(satiricalChapterPrompt), "satirical spoken-language contract missing");
assert(/Never begin three consecutive sentences with "Bạn"/.test(satiricalChapterPrompt), "satirical syntax variation rule missing");
assert(/hồi chuông cảnh tỉnh/.test(satiricalChapterPrompt), "satirical anti-AI prose list missing");
const naturalVietnamesePrompt = getHookGeneratorPrompt(3, "Một chủ đề", VideoGenre.HISTORY, "Story", 10, "vi");
const naturalEnglishPrompt = getHookGeneratorPrompt(3, "A topic", VideoGenre.HISTORY, "Story", 10, "en");
assert(/NATURAL VIETNAMESE VOICE CONTRACT/.test(naturalVietnamesePrompt) && /hồi chuông cảnh tỉnh/.test(naturalVietnamesePrompt), "global natural Vietnamese contract missing");
assert(/NATURAL ENGLISH VOICE CONTRACT/.test(naturalEnglishPrompt) && /in today's world/.test(naturalEnglishPrompt), "global natural English contract missing");
assert(!/SATIRICAL SPOKEN-LANGUAGE CONTRACT/.test(naturalEnglishPrompt), "satirical voice leaked into a non-satirical genre");
const publishableProject: any = { ...project, visualConfig: { thumbnailCount: 1 }, thumbnails: [{ approved: true, qa: { passed: true } }], storyboardQa: { passed: true }, contentSafety: { allowed: true }, finalMultimodalQa: { passed: true, reviewAvailable: true, continuityScore: 90, pacingScore: 90, promiseAlignmentScore: 90, warnings: [] } };
assert(evaluateFinalQuality(publishableProject).publishable, "valid final project was blocked");
const unavailableFinalQa = evaluateFinalQuality({ ...publishableProject, finalMultimodalQa: { passed: false, reviewAvailable: false, warnings: ["final_multimodal_qa_unavailable"] } });
assert(unavailableFinalQa.publishable && unavailableFinalQa.warnings.includes("final_multimodal_qa_unavailable"), "unavailable final QA blocked a complete video");
const lowFinalQa = evaluateFinalQuality({ ...publishableProject, finalMultimodalQa: { passed: false, reviewAvailable: true, blockingErrors: ["broken_frame"], warnings: [] } });
assert(!lowFinalQa.publishable && lowFinalQa.blockingErrors.includes("broken_frame"), "a confirmed broken final frame was allowed to publish");
const advisoryReviewItems = createManualReviewItems({ ...publishableProject, storyboard: [{ id: "scene_warning", assetUrl: "asset", assetStatus: SceneAssetStatus.Approved, acceptance: "accepted_with_warning" }], finalMultimodalQa: { passed: false, reviewAvailable: true, blockingErrors: [], warnings: ["pacing_could_improve"] } });
assert(advisoryReviewItems.length === 0, "advisory warnings created mandatory manual-review work");
const promptFiles = ["prompts.ts", "promptGuidelines.ts", "texts.ts", "data.ts"].map((file) => resolveSourceTextConstants(fs.readFileSync(path.resolve("src/constants", file), "utf8"))).join("\n");
assert(!/[ï¿½]|Ãƒ.|Ã¢â‚¬|Ã°Å¸/.test(promptFiles), "UTF-8/mojibake gate failed");
writeVerificationLog("VIDIFY baseline acceptance assertions passed");
