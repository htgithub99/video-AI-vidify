import { writeVerificationLog } from "./verificationLogger.ts";
import { resolveUsableHooks } from "../src/services/hookResilienceService.ts";
import { acquirePipelineRunLease, releasePipelineRunLease } from "../src/services/pipelineRunLockService.ts";
import { applyProfessionalEditingPolicy } from "../src/services/editingPolicyService.ts";
import { createAudienceMarketDirective } from "../src/services/audienceMarketService.ts";
import { ensureRenderReadySceneAssets } from "../src/services/renderCompletionFallbackService.ts";
import { createAudioCueSheet } from "../src/services/soundDesignService.ts";
import { removeAdjacentRepeatedNarrationSentences, removeAdjacentRepeatedStoryboardScenes } from "../src/services/scriptContinuityService.ts";
import { rankEditorialVideoSceneIds } from "../src/services/projectImageGenerationService.ts";
import { createSceneSubtitleCues } from "../src/services/subtitleService.ts";
import { appendAssetRevision } from "../src/services/dependencyHashService.ts";
import { removeRedundantSceneAudioBase64 } from "../src/services/voiceTimelineService.ts";
import {
  getGenerationCheckpointSceneProgress,
  hasCompleteSceneAlignment,
  mergeContinuationLogs,
  resolveCinematicContinuationStage,
} from "../src/hooks/autoVideoPipelineUtils.ts";
import { CINEMATIC_PROGRESS_STAGE } from "../src/constants/cinematicConstants.ts";
import fs from "node:fs";

const values = new Map<string, string>();
const sessionValues = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
});
Object.defineProperty(globalThis, "sessionStorage", {
  value: {
    getItem: (key: string) => sessionValues.get(key) ?? null,
    setItem: (key: string, value: string) => sessionValues.set(key, value),
    removeItem: (key: string) => sessionValues.delete(key),
  },
});
const assert = (value: unknown, message: string): void => {
  if (!value) throw new Error(message);
};

const interruptedPromptProgress = getGenerationCheckpointSceneProgress({
  storyboard: [
    { id: "scene_001", generationPrompt: "AI prompt 1" },
    { id: "scene_002", generationPrompt: "AI prompt 2" },
    { id: "scene_003", generationPrompt: "" },
  ],
  generationCheckpoint: {
    intent: "continue",
    phase: "prompt_planning_failed",
    completedSceneIds: [],
    pendingSceneIds: ["scene_001", "scene_002", "scene_003"],
    failedSceneIds: [],
    updatedAt: new Date().toISOString(),
  },
} as any);
assert(interruptedPromptProgress.completedSceneIds.join(",") === "scene_001,scene_002", "completed AI prompts were lost from the interrupted checkpoint");
assert(interruptedPromptProgress.pendingSceneIds.join(",") === "scene_003", "interrupted checkpoint did not isolate the missing prompt");
const resumedLogs = mergeContinuationLogs(
  ["[10:00:00] Kịch bản đã hoàn tất.", "[10:01:00] Đang viết prompt."],
  ["[10:01:00] Đang viết prompt.", "[10:02:00] Quy trình đã tạm dừng."],
);
assert(resumedLogs.length === 3, "continuation discarded or duplicated saved generation logs");
assert(resumedLogs[0].includes("Kịch bản đã hoàn tất"), "continuation lost the earlier project history");
assert(
  resolveCinematicContinuationStage({ scriptRewritten: "screenplay", storyboard: [{ id: "scene_001", generationPrompt: "video prompt", assetUrl: undefined }], thumbnails: [{ id: "thumbnail_001", imageUrl: "/cover.jpg" }] } as any) ===
    CINEMATIC_PROGRESS_STAGE.VIDEO,
  "continuation replayed completed screenplay, prompt or thumbnail steps instead of resuming video",
);
assert(
  resolveCinematicContinuationStage({ scriptRewritten: "screenplay", storyboard: [{ id: "scene_001", generationPrompt: "" }], thumbnails: [{ id: "thumbnail_001", imageUrl: "/cover.jpg" }] } as any) ===
    CINEMATIC_PROGRESS_STAGE.PROMPT,
  "continuation skipped an unfinished prompt step",
);


const sourceHookText = "A real opening sentence from the supplied script.";
const fallbackHooks = resolveUsableHooks([], "Auto", 3, sourceHookText);
assert(fallbackHooks.length === 1 && fallbackHooks[0].content === sourceHookText, "source hook fallback changed the supplied content");
const groundedHooks = resolveUsableHooks([
  { id: "wrong", content: "Bạn nghĩ làm kỹ sư nữ là ngôi sao, nhưng mỗi cuộc họp lại là một trận chiến.", type: "contrast" },
  { id: "right", content: "Bạn tưởng gái ngành chỉ cần biết cười, nhưng hóa đơn ở đây luôn biết cách cười trước.", type: "contrast" },
], "Auto", 3, "Tại sao thật tệ khi là Gái Ngành?");
assert(groundedHooks.length === 1 && groundedHooks[0].id === "right", "off-topic occupation hook passed topic grounding");
const invalidVietnameseHooks = resolveUsableHooks([
  { id: "missing_tones", content: "Ban tuong minh da thoat, nhung cai bay moi chi vua dong cua.", type: "contrast" },
], "Auto", 3, "Bạn tưởng mình đã thoát khỏi cái bẫy.", true);
assert(invalidVietnameseHooks.length === 1 && invalidVietnameseHooks[0].id !== "missing_tones", "unaccented Vietnamese hook entered the script");
const first = acquirePipelineRunLease("project_1");
const duplicate = acquirePipelineRunLease("project_1");
assert(first.acquired && !duplicate.acquired, "duplicate pipeline run was accepted");
releasePipelineRunLease(first);
assert(acquirePipelineRunLease("project_1").acquired, "pipeline lease was not released");
const stringOnlyTimeline = [{ id: "sc_1", startTime: "00:00", endTime: "00:03", duration: 3, audioBase64: "large-clip" }] as any;
assert(!hasCompleteSceneAlignment(stringOnlyTimeline, true), "estimated string timeline was mistaken for backend voice alignment");
const alignedScenes = [{ id: "sc_1", startTime: "00:00", endTime: "00:03", _start: 0, _end: 3, duration: 3, audioBase64: "large-clip" }] as any;
const compactAlignedScenes = removeRedundantSceneAudioBase64(alignedScenes, true);
assert(!compactAlignedScenes[0].audioBase64, "redundant aligned scene audio remained in the project checkpoint");
assert(hasCompleteSceneAlignment(compactAlignedScenes, true), "global narration did not preserve reusable scene timing");
const revisionScene = { id: "sc_revision", prompt: "prompt", assetRevisions: [] } as any;
const embeddedRevision = appendAssetRevision(revisionScene, "data:image/jpeg;base64,AAAA", "generated" as any);
assert(embeddedRevision.assetUrl === "", "embedded media leaked into asset revision history");
const repeatedOpening = "Bạn nghĩ làm kỹ sư nữ là ngôi sao? Thực tế: mỗi buổi họp là một trận chiến giấu nụ cười. Bạn nghĩ làm kỹ sư nữ là ngôi sao và mỗi buổi họp là một trận chiến giấu nụ cười. Nội dung mới bắt đầu ở đây.";
const repairedOpening = removeAdjacentRepeatedNarrationSentences(repeatedOpening);
assert(!repairedOpening.includes("ngôi sao và mỗi buổi họp"), "cumulative hook restatement remained in narration");
assert(repairedOpening.includes("Nội dung mới bắt đầu ở đây"), "continuity repair removed new narration");
const unicodeEllipsisOpening = "Bạn sẽ không tin tại sao thật tệ khi là Gái Ngành, vì mọi người tưởng chúng ta luôn mạnh mẽ, còn thực tế lại… Mọi người tưởng chúng ta luôn mạnh mẽ, còn thực tế lại hoàn toàn khác. Mai bước vào ca làm việc đêm.";
const repairedUnicodeEllipsisOpening = removeAdjacentRepeatedNarrationSentences(unicodeEllipsisOpening);
assert(!repairedUnicodeEllipsisOpening.includes("thực tế lại hoàn toàn khác"), "unicode ellipsis hid a repeated hook restatement");
assert(repairedUnicodeEllipsisOpening.includes("Mai bước vào ca làm việc đêm"), "unicode ellipsis repair removed the first new story beat");
const repairedScenes = removeAdjacentRepeatedStoryboardScenes([
  { id: "voice_1", script: "Bạn nghĩ làm kỹ sư nữ là ngôi sao?" },
  { id: "voice_2", script: "Thực tế: mỗi buổi họp là một trận chiến giấu nụ cười." },
  { id: "voice_3", script: "Bạn nghĩ làm kỹ sư nữ là ngôi sao và mỗi buổi họp là một trận chiến giấu nụ cười." },
  { id: "voice_4", script: "Nội dung mới bắt đầu ở đây với một tình tiết hoàn toàn khác." },
] as any);
assert(repairedScenes.map(scene => scene.id).join(",") === "voice_1,voice_2,voice_4", "cumulative repeated storyboard scene was not removed");
const editorialVideoIds = rankEditorialVideoSceneIds([
  { id: "still_hook", chapterId: "c1", duration: 4, shotPurpose: "emotional_hold", cameraMotion: "static", visibleAction: "She stares sadly at the wall.", visualHook: "face", storyEvidence: "wall" },
  { id: "transaction", chapterId: "c1", duration: 5, shotPurpose: "action", cameraMotion: "Pan Right", visibleAction: "She signs the paper and hands over the envelope.", visualHook: "envelope exchange", storyEvidence: "signed agreement", layout: "single_frame" },
  { id: "portrait", chapterId: "c1", duration: 4, shotPurpose: "reaction", cameraMotion: "static", visibleAction: "She looks worried." },
  { id: "reveal", chapterId: "c2", duration: 6, shotPurpose: "reveal", cameraMotion: "Zoom Out", visibleAction: "The door opens and the hidden queue moves into view.", visualHook: "door reveal", storyEvidence: "waiting queue", layout: "single_frame" },
] as any, ["still_hook", "portrait"], 2);
assert(editorialVideoIds.join(",") === "transaction,reveal", "editorial video selection favored static AI picks over motion value and chapter distribution");
const semanticSubtitleCues = createSceneSubtitleCues({
  id: "subtitle_scene",
  duration: 6,
  subtitle: "Mai ký vào bảng chấm công với những điều khoản phạt vô lý, nhưng quản lý chỉ mỉm cười rồi giữ lại bản hợp đồng.",
} as any);
assert(semanticSubtitleCues.length >= 2, "long subtitle was not split into readable semantic cues");
assert(semanticSubtitleCues.every(cue => cue.text.split("\n").length === 1), "subtitle cue must use exactly one line");
assert(semanticSubtitleCues.every(cue => cue.text.split("\n").every(line => line.length <= 42)), "subtitle line exceeded safe horizontal length");
assert(semanticSubtitleCues.some(cue => cue.text.toLowerCase().startsWith("nhưng")), "subtitle did not preserve the semantic contrast boundary");
const autoGeneratorSource = fs.readFileSync("src/components/AutoVideoGenerator.tsx", "utf8");
const previewSource = fs.readFileSync("src/components/auto-video/PreviewPanelSection.tsx", "utf8");
const generationSettingsSource = fs.readFileSync("src/components/auto-video/GenerationSettingsSection.tsx", "utf8");
const pipelineControllerSource = fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8");
const pipelineHookSource = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
const ffmpegRenderSource = fs.readFileSync("src/server/utils/ffmpegRender.ts", "utf8");
assert(/const handleStartAutoGenerate[\s\S]*: Promise<void> =>/.test(autoGeneratorSource), "pipeline start promise is not exposed to regeneration");
assert(/await handleStartAutoGenerate\(\{/.test(autoGeneratorSource), "regeneration does not await the active pipeline");
assert(/finally \{\s*setLoadingTarget\(null\)/.test(previewSource), "regeneration loading state can remain stuck");
assert(!/mediaMixTexts\.badge\s*\(/.test(generationSettingsSource), "mixed-mode settings call a missing translation function");
assert(/mediaMixTexts\?\.maxVideos/.test(generationSettingsSource), "mixed-mode settings do not use the declared translation contract");
assert(
  /finalCleanScript = isCinematicScript \? fullScript\.trim\(\) : removeAdjacentRepeatedNarrationSentences/.test(pipelineControllerSource),
  "server script output does not isolate screenplay dialogue from narration cleanup",
);
assert(
  /const rewrittenScript = isCinematicStoryboard \? rawRewrittenScript : removeAdjacentRepeatedNarrationSentences/.test(pipelineControllerSource),
  "server storyboard input does not isolate cinematic screenplay from narration cleanup",
);
assert(/regenerateVideoClips=\{cinematicMode\}/.test(autoGeneratorSource), "cinematic preview does not expose clip regeneration");
assert(
  /scriptRewritten: existingTargetProj\.scriptRewritten[\s\S]*storyboard: existingTargetProj\.storyboard[\s\S]*renderedVideoUrl: existingTargetProj\.renderedVideoUrl/.test(pipelineHookSource),
  "continuation clears saved production data before replacement data is ready",
);
assert(
  /const completedRunLogs = isContinuation[\s\S]*let currentLogs: string\[\] = _\.clone\(completedRunLogs\)/.test(pipelineHookSource),
  "continuation clears the visible log history instead of appending the resumed step",
);
assert(
  /cinematicResumeStage[\s\S]*_\.lte\(cinematicResumeStage, CINEMATIC_PROGRESS_STAGE\.SCRIPT\)/.test(pipelineHookSource),
  "continuation replays progress messages for cinematic stages that already completed",
);
assert(
  /const isVideoStageContinuation =[\s\S]*CINEMATIC_PROGRESS_STAGE\.VIDEO[\s\S]*const seoRequest = cachedSeoData \|\| isVideoStageContinuation[\s\S]*const shouldPlanThumbnails =[\s\S]*!isVideoStageContinuation/.test(
    pipelineHookSource,
  ),
  "video-stage continuation can reopen a creative planning room for SEO or thumbnail planning",
);
assert(
  /if \(seoRes\?\.success && preparedSeoData\)[\s\S]*seo: preparedSeoData as VideoProject\["seo"\]/.test(pipelineHookSource),
  "successful SEO room output is not checkpointed before media generation",
);
assert(
  /appendCinematicLog\(cinematicProgressMessages\.VIDEO_READY[\s\S]*appendLog\(T\.logPipelineElapsed[\s\S]*await syncProject\(renderCompletedProj\)/.test(
    pipelineHookSource,
  ),
  "completion messages are appended after the final project checkpoint and disappear on reload",
);
assert(/regenerateVideoClips \? regenerationTexts\.clips : regenerationTexts\.images/.test(previewSource), "cinematic preview still labels clip regeneration as images");
assert(/hasGlobalNarration[\s\S]*audioPath = hasGlobalNarration \? undefined/.test(ffmpegRenderSource), "global narration does not suppress per-scene audio sources");

const editScenes = applyProfessionalEditingPolicy([
  { id: "s1", chapterId: "c1", duration: 5, effects: "dreamy", lightingEffect: "spotlight", transition: "cross_dissolve", cameraMotion: "handheld_soft" },
  { id: "s2", chapterId: "c1", duration: 5, effects: "sad_vignette", lightingEffect: "god_rays", transition: "cross_dissolve", cameraMotion: "static" },
  { id: "s3", chapterId: "c2", duration: 5, effects: "film_grain", lightingEffect: "golden_glow", transition: "glitch_transition", cameraMotion: "static" },
] as any, {
  colorPalette: "flat solid colors, no gradients",
  characterSpecs: "",
  landscapeSpecs: "",
  lightingMood: "no shading",
});
assert(editScenes[0].effects === "" && editScenes[0].lightingEffect === "natural_light" && editScenes[0].cameraMotion === "static", "flat-style comfort policy failed");
assert(editScenes[1].transition === "fade_black" && editScenes[2].transition === "cut", "chapter transition policy failed");
const comfortScenes = applyProfessionalEditingPolicy([
  { id: "c1", chapterId: "c1", duration: 1.8, effects: "glitch", lightingEffect: "strobe", transition: "whip_left", cameraMotion: "handheld_soft", shotPurpose: "action" },
  { id: "c2", chapterId: "c1", duration: 4, effects: "glitch", lightingEffect: "flicker", transition: "glitch_transition", cameraMotion: "handheld_soft", shotPurpose: "action" },
] as any, { visualStyle: "cinematic live action" } as any);
assert(comfortScenes[0].cameraMotion === "static" && comfortScenes[0].effects === "" && comfortScenes[0].lightingEffect === "natural_light", "short-scene comfort policy failed");
assert(comfortScenes[1].effects === "" && comfortScenes[1].lightingEffect === "natural_light" && comfortScenes[1].transition === "cut", "disruptive effect guard failed");
assert(comfortScenes.every(scene => scene.cameraMotion === "static"), "short or uncomfortable motion must be neutralized");
const gentleMotionScenes = applyProfessionalEditingPolicy([
  { id: "g1", chapterId: "c1", duration: 5, cameraMotion: "static" },
  { id: "g2", chapterId: "c1", duration: 5, cameraMotion: "Pan Right" },
  { id: "g3", chapterId: "c1", duration: 5, cameraMotion: "shaky handheld" },
  { id: "g4", chapterId: "c1", duration: 5, cameraMotion: "Zoom Out" },
] as any, { visualStyle: "cinematic live action" } as any);
assert(gentleMotionScenes[1].cameraMotion === "Pan Right", "gentle pan should remain available");
assert(gentleMotionScenes[2].cameraMotion === "static", "shake and handheld motion must be removed");
const repetitiveMotionScenes = applyProfessionalEditingPolicy(Array.from({ length: 8 }, (_, index) => ({
  id: `repeat_${index}`,
  chapterId: "repeat_chapter",
  duration: 4,
  cameraMotion: "Zoom In",
  transition: "cut",
})) as any);
assert(new Set(repetitiveMotionScenes.map(scene => scene.cameraMotion)).size > 2, "repeated safe motion was not diversified");
assert(repetitiveMotionScenes.some(scene => scene.transition === "cross_dissolve"), "long documentary sequence remained all hard cuts");
assert(createAudienceMarketDirective("vi", "Khán giả trẻ").includes("Vietnamese audience across Vietnam"), "Vietnam market contract missing");
assert(createAudienceMarketDirective("en", "Global viewers").includes("international English-speaking audience"), "international market contract missing");
const renderFallback = ensureRenderReadySceneAssets([
  { id: "ready", assetUrl: "data:image/png;base64,ready" },
  { id: "missing" },
] as any);
assert(renderFallback.repairedSceneIds.includes("missing") && Boolean(renderFallback.scenes[1].assetUrl), "missing scene did not receive completion fallback");
const cueSheet = createAudioCueSheet([
  { id: "s1", duration: 5, script: "A character waits", prompt: "one character portrait" },
] as any);
assert(!cueSheet.cues.some(cue => cue.description === "vehicle movement"), "character falsely triggered car sound effect");

writeVerificationLog("Pipeline resilience assertions passed");
