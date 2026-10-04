import { resolveSourceTextConstants } from "./sourceTextAssertions";
import { writeVerificationLog } from "./verificationLogger.ts";
import { resolveUsableHooks } from "../src/services/hookResilienceService.ts";
import { acquirePipelineRunLease, releasePipelineRunLease } from "../src/services/pipelineRunLockService.ts";
import { createAudienceMarketDirective } from "../src/services/audienceMarketService.ts";
import { createAudioCueSheet } from "../src/services/soundDesignService.ts";
import { createSceneSubtitleCues } from "../src/services/subtitleService.ts";
import { appendAssetRevision } from "../src/services/dependencyHashService.ts";
import { removeRedundantSceneAudioBase64 } from "../src/services/voiceTimelineService.ts";
import {
  getGenerationCheckpointSceneProgress,
  hasCompleteSceneAlignment,
  mergeContinuationLogs,
  resolveCinematicContinuationStage,
  resolveTargetProject,
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

const workspaceProjects = [
  { id: "parent", name: "Project", projectKind: "container" },
  { id: "auto", parentId: "parent", name: "Project - Tự động", projectKind: "auto" },
  { id: "film", parentId: "parent", name: "Project - Phim AI", projectKind: "cinematic" },
] as any;
assert(resolveTargetProject(workspaceProjects, "film", workspaceProjects[2], "", "", false).existingTargetProject?.id === "auto", "quick video resolved the selected film project instead of its auto sibling");
assert(resolveTargetProject(workspaceProjects, "auto", workspaceProjects[1], "", "", true).existingTargetProject?.id === "film", "AI film resolved the selected auto project instead of its cinematic sibling");
assert(resolveTargetProject([{ id: "orphan-film", parentId: "missing", name: "Orphan - Phim AI", projectKind: "cinematic" }] as any, "orphan-film", null, "", "", false).existingTargetProject === null, "orphan film was reused as a quick-video target");

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
const interruptedMediaProgress = getGenerationCheckpointSceneProgress({
  storyboard: [
    { id: "scene_001", assetUrl: "/assets/projects/project_1/videos/scene_001.mp4" },
    {
      id: "scene_005",
      remoteVideoMediaId: "4e0d5a34-1936-4dc5-a947-33ea6ad5d050",
      remoteVideoDownloadPending: true,
      assetError: "Flow chưa trả về tệp video hoàn chỉnh.",
    },
    {
      id: "scene_007",
      remoteVideoMediaId: "15aff451-76f7-45a7-a2f3-84fdffeb0d6a",
      remoteVideoDownloadPending: true,
      assetError: "Flow chưa trả về tệp video hoàn chỉnh.",
    },
  ],
  generationCheckpoint: {
    intent: "continue",
    phase: "media_generation",
    completedSceneIds: ["scene_001"],
    pendingSceneIds: ["scene_005", "scene_007"],
    failedSceneIds: ["scene_005", "scene_007"],
    updatedAt: new Date().toISOString(),
  },
} as any);
assert(interruptedMediaProgress.completedSceneIds.join(",") === "scene_001", "completed video clip was lost from the media checkpoint");
assert(interruptedMediaProgress.pendingSceneIds.join(",") === "scene_005,scene_007", "media checkpoint did not preserve the missing clips");
assert(interruptedMediaProgress.failedSceneIds.join(",") === "scene_005,scene_007", "media checkpoint did not preserve failed clip details");
const resumedLogs = mergeContinuationLogs(
  ["[10:00:00] Kịch bản đã hoàn tất.", "[10:01:00] Đang viết prompt."],
  ["[10:01:00] Đang viết prompt.", "[10:02:00] Quy trình đã tạm dừng."],
);
assert(resumedLogs.length === 3, "continuation discarded or duplicated saved generation logs");
assert(resumedLogs[0].includes("Kịch bản đã hoàn tất"), "continuation lost the earlier project history");
assert(
  resolveCinematicContinuationStage({
    scriptRewritten: "screenplay",
    storyboard: [{ id: "scene_001", generationPrompt: "video prompt", assetUrl: undefined }],
    thumbnails: [{ id: "thumbnail_001", imageUrl: "/cover.jpg" }],
  } as any) === CINEMATIC_PROGRESS_STAGE.VIDEO,
  "continuation replayed completed screenplay, prompt or thumbnail steps instead of resuming video",
);
assert(
  resolveCinematicContinuationStage({
    scriptRewritten: "screenplay",
    storyboard: [{ id: "scene_001", generationPrompt: "" }],
    thumbnails: [{ id: "thumbnail_001", imageUrl: "/cover.jpg" }],
  } as any) === CINEMATIC_PROGRESS_STAGE.PROMPT,
  "continuation skipped an unfinished prompt step",
);

const sourceHookText = "A real opening sentence from the supplied script.";
const rejectedIncompleteHooks = resolveUsableHooks([], "Auto", 3, sourceHookText);
assert(rejectedIncompleteHooks.length === 0, "missing AI hooks were replaced with code-authored content");
const groundedHooks = resolveUsableHooks(
  [
    { id: "wrong", content: "Bạn nghĩ làm kỹ sư nữ là ngôi sao, nhưng mỗi cuộc họp lại là một trận chiến.", type: "contrast" },
    { id: "right", content: "Bạn tưởng gái ngành chỉ cần biết cười, nhưng hóa đơn ở đây luôn biết cách cười trước.", type: "contrast" },
  ],
  "Auto",
  3,
  "Tại sao thật tệ khi là Gái Ngành?",
);
assert(groundedHooks.length === 0, "an invalid hook was removed while the remaining partial AI response was accepted");
const invalidVietnameseHooks = resolveUsableHooks(
  [{ id: "missing_tones", content: "Ban tuong minh da thoat, nhung cai bay moi chi vua dong cua.", type: "contrast" }],
  "Auto",
  3,
  "Bạn tưởng mình đã thoát khỏi cái bẫy.",
  true,
);
assert(invalidVietnameseHooks.length === 0, "invalid Vietnamese hooks were replaced with code-authored content");
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
const semanticSubtitleCues = createSceneSubtitleCues({
  id: "subtitle_scene",
  duration: 6,
  subtitle: "Mai ký vào bảng chấm công với những điều khoản phạt vô lý, nhưng quản lý chỉ mỉm cười rồi giữ lại bản hợp đồng.",
} as any);
assert(semanticSubtitleCues.length >= 2, "long subtitle was not split into readable semantic cues");
assert(
  semanticSubtitleCues.every((cue) => cue.text.split("\n").length === 1),
  "subtitle cue must use exactly one line",
);
assert(
  semanticSubtitleCues.every((cue) => cue.text.split("\n").every((line) => line.length <= 42)),
  "subtitle line exceeded safe horizontal length",
);
assert(
  semanticSubtitleCues.some((cue) => cue.text.toLowerCase().startsWith("nhưng")),
  "subtitle did not preserve the semantic contrast boundary",
);
const autoGeneratorSource = resolveSourceTextConstants(fs.readFileSync("src/components/AutoVideoGenerator.tsx", "utf8"));
const previewSource = resolveSourceTextConstants(fs.readFileSync("src/components/auto-video/PreviewPanelSection.tsx", "utf8"));
const generationSettingsSource = resolveSourceTextConstants(fs.readFileSync("src/components/auto-video/GenerationSettingsSection.tsx", "utf8"));
const pipelineControllerSource = resolveSourceTextConstants(fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8"));
const pipelineHookSource = resolveSourceTextConstants(fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8"));
const autoVideoStateSource = resolveSourceTextConstants(fs.readFileSync("src/hooks/useAutoVideoState.ts", "utf8"));
const imageGeneratorSource = resolveSourceTextConstants(fs.readFileSync("src/server/services/imageGeneratorService.ts", "utf8"));
const chatPlanningSource = resolveSourceTextConstants(fs.readFileSync("src/server/services/chatUiPlanningService.ts", "utf8"));
const ffmpegRenderSource = resolveSourceTextConstants(fs.readFileSync("src/server/utils/ffmpegRender.ts", "utf8"));
const cinematicConstantsSource = resolveSourceTextConstants(fs.readFileSync("src/constants/cinematicConstants.ts", "utf8"));
assert(/const handleStartAutoGenerate[\s\S]*: Promise<void> =>/.test(autoGeneratorSource), "pipeline start promise is not exposed to regeneration");
assert(/await handleStartAutoGenerate\(\{/.test(autoGeneratorSource), "regeneration does not await the active pipeline");
assert(/finally \{\s*setLoadingTarget\(null\)/.test(previewSource), "regeneration loading state can remain stuck");
assert(!/mediaMixTexts\.badge\s*\(/.test(generationSettingsSource), "mixed-mode settings call a missing translation function");
assert(/mediaMixTexts\?\.maxVideos/.test(generationSettingsSource), "mixed-mode settings do not use the declared translation contract");
assert(!/removeAdjacentRepeatedNarrationSentences|removeAdjacentRepeatedStoryboardScenes/.test(pipelineControllerSource), "server still cuts AI-authored narration or scenes");
assert(
  !/GEMINI_RESPONSE_SELECTOR:\s*['"]model-response,/.test(cinematicConstantsSource) &&
    /model-response[^'"\r\n]*\[id\^=["']model-response-message-content/.test(cinematicConstantsSource),
  "Gemini response extraction still reads the UI label wrapper instead of the exact AI-authored payload node",
);
assert(
  /getOrLaunchGlobalBrowser\(request\.chromeHeadless, true\)/.test(chatPlanningSource) &&
    /browserInstance = await getOrLaunchGlobalBrowser\(visualConfig\?\.chromeHeadless, true\)/.test(imageGeneratorSource) &&
    /preferSharedChrome && !activeBrowserInstance\.preserveExternalPages/.test(imageGeneratorSource),
  "AI room or quick-image generation ignored an already authenticated shared Chrome session",
);
assert(/regenerateVideoClips=\{cinematicMode\}/.test(autoGeneratorSource), "cinematic preview does not expose clip regeneration");
assert(
  /scriptRewritten: existingTargetProj\.scriptRewritten[\s\S]*storyboard: existingTargetProj\.storyboard[\s\S]*renderedVideoUrl: existingTargetProj\.renderedVideoUrl/.test(
    pipelineHookSource,
  ),
  "continuation clears saved production data before replacement data is ready",
);
assert(
  /const completedRunLogs = isContinuation[\s\S]*let currentLogs: string\[\] = _\.clone\(completedRunLogs\)/.test(pipelineHookSource),
  "continuation clears the visible log history instead of appending the resumed step",
);
assert(
  /const savedTargetIsCinematic =[\s\S]*if \(savedTarget && savedTargetIsCinematic\) \{[\s\S]*config\.duration = _\.defaultTo\(savedTarget\.config\?\.duration, config\.duration\)[\s\S]*config\.videoDuration = _\.defaultTo\(savedTarget\.visualConfig\?\.videoDuration, config\.videoDuration\)/.test(
    pipelineHookSource,
  ),
  "cinematic continuation trusts stale form cache instead of the freshly hydrated project configuration",
);
assert(
  /const \[isConfigLoaded, setIsConfigLoaded\] = useState\(!selectedProjectId\)/.test(autoVideoStateSource) &&
    /setIsConfigLoaded\(false\)[\s\S]*if \(foundProj\) \{\s*applyProjectToState\(foundProj, actions\);\s*setProjectName\(foundProj\.name\);\s*\} else if \(parsed\)/.test(
      autoVideoStateSource,
    ) &&
    /finally \{\s*setIsConfigLoaded\(true\)/.test(autoVideoStateSource),
  "project continuation can run before the saved project configuration replaces stale cached defaults",
);
assert(
  /const estimateDuration = canContinueProject \? _\.defaultTo\(presentationProject\?\.config\?\.duration, duration\)/.test(autoGeneratorSource) &&
    /const estimateClipDuration = canContinueProject \? _\.defaultTo\(presentationProject\?\.visualConfig\?\.videoDuration, videoDuration\)/.test(autoGeneratorSource),
  "cinematic continuation estimate is rendered from stale cached controls instead of the saved project",
);
assert(
  /cinematicResumeStage[\s\S]*_\.lte\(cinematicResumeStage, CINEMATIC_PROGRESS_STAGE\.SCRIPT\)/.test(pipelineHookSource),
  "continuation replays progress messages for cinematic stages that already completed",
);
assert(
  /const isVideoStageContinuation =[\s\S]*CINEMATIC_PROGRESS_STAGE\.VIDEO[\s\S]*const seoRequest =\s*cachedSeoData \|\| isVideoStageContinuation[\s\S]*const shouldPlanThumbnails =[\s\S]*!isVideoStageContinuation/.test(
    pipelineHookSource,
  ),
  "video-stage continuation can reopen a creative planning room for SEO or thumbnail planning",
);
assert(
  /if \(seoRes\?\.success && preparedSeoData\)[\s\S]*seo: preparedSeoData as VideoProject\["seo"\]/.test(pipelineHookSource),
  "successful SEO room output is not checkpointed before media generation",
);
assert(
  /appendCinematicLog\(cinematicProgressMessages\.VIDEO_READY[\s\S]*appendLog\(T\.logPipelineElapsed[\s\S]*await syncProject\(renderCompletedProj\)/.test(pipelineHookSource),
  "completion messages are appended after the final project checkpoint and disappear on reload",
);
assert(
  /const generatedBatch = await waitForFlowGeneratedMediaBatch/.test(imageGeneratorSource) &&
    /remoteVideoMediaIds = _\.uniq/.test(imageGeneratorSource) &&
    /_\.lt\(_\.size\(remoteVideoMediaIds\), FLOW_VIDEO_MEDIA_CONFIG\.EXPECTED_OUTPUT_COUNT\)/.test(imageGeneratorSource) &&
    /await downloadValidatedVideo\(browserInstance\.context, \[remoteVideoSourceUrl\]/.test(imageGeneratorSource) &&
    /await downloadFlowVideoFromEditor\(activePage, currentProjectId, remoteVideoMediaId/.test(imageGeneratorSource),
  "Flow did not wait for and preserve the complete configured media output before download",
);
assert(
  /voiceUpdatedProj = \{ \.\.\.persistedProject, storyboard: realScenes as VideoProject\["storyboard"\] \};\s*latestCheckpointStoryboard = _\.cloneDeep\(realScenes\);\s*activeProjectSnapshotRef\.current = voiceUpdatedProj;/.test(
    pipelineHookSource,
  ),
  "media checkpoint did not update the latest recoverable storyboard snapshot",
);
assert(
  /manualReviewItems: checkpointSourceProject \? createManualReviewItems\(checkpointSourceProject\)/.test(pipelineHookSource) &&
    /generationDiagnostics: _\.concat\(checkpointSourceProject\?\.generationDiagnostics/.test(pipelineHookSource),
  "pipeline failure rebuilt diagnostics from a stale project snapshot",
);
assert(
  /if \(isContinuation && hasSceneAsset\(sc\)\) return false;[\s\S]*if \(isContinuation\) await recoverPendingFlowDownloads\(\);[\s\S]*!scene\.remoteVideoDownloadPending/.test(
    pipelineHookSource,
  ),
  "continuation can regenerate completed clips or resubmit clips that only need downloading",
);
assert(
  /const persistRecoveredFlowScene =[\s\S]*scene\.assetUrl = _\.head\(fallbackUrls\);[\s\S]*scene\.assetUrls = fallbackUrls;[\s\S]*scene\.remoteVideoDownloadPending = false;[\s\S]*project\.generationCheckpoint = \{[\s\S]*completedSceneIds,[\s\S]*pendingSceneIds,[\s\S]*failedSceneIds,[\s\S]*await saveProjectDetailToDb\(project\)/.test(
    pipelineControllerSource,
  ) &&
    /router\.post\("\/recover-flow-video"[\s\S]*for \(const \[variantIndex, mediaId\] of persistedMediaIds\.entries\(\)\)[\s\S]*getPersistedProjectVideoVariantUrl[\s\S]*persistRecoveredFlowScene\(project, scene, persistedMediaIds, fallbackUrls\)/.test(
      pipelineControllerSource,
    ),
  "successful Flow recovery or its checkpoint was not persisted atomically before the response",
);
assert(/regenerateVideoClips \? regenerationTexts\.clips : regenerationTexts\.images/.test(previewSource), "cinematic preview still labels clip regeneration as images");
assert(/hasGlobalNarration[\s\S]*audioPath = hasGlobalNarration \? undefined/.test(ffmpegRenderSource), "global narration does not suppress per-scene audio sources");

assert(createAudienceMarketDirective("vi", "Khán giả trẻ").includes("Vietnamese audience across Vietnam"), "Vietnam market contract missing");
assert(createAudienceMarketDirective("en", "Global viewers").includes("international English-speaking audience"), "international market contract missing");
assert(!fs.existsSync("src/services/renderCompletionFallbackService.ts"), "render still contains a cross-scene visual substitution fallback");
const cueSheet = createAudioCueSheet([{ id: "s1", duration: 5, script: "A character waits", prompt: "one character portrait" }] as any);
assert(!cueSheet.cues.some((cue) => cue.description === "vehicle movement"), "character falsely triggered car sound effect");

writeVerificationLog("Pipeline resilience assertions passed");
