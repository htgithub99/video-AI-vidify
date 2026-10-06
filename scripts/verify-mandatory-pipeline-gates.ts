import { stringifyJson } from "../src/lib/jsonStringify.js";
import { resolveSourceTextConstants } from "./sourceTextAssertions";
import assert from "node:assert/strict";
import fs from "node:fs";
import _ from "lodash";
import { getBlockingCinematicPlanningIssues, getCinematicScriptReadinessIssues, getCinematicGeneratedTakeIssues, getCinematicSceneContractIssues, getCinematicStoryboardReadinessIssues, repairCinematicStoryboardContract } from "../src/services/cinematicProductionPolicyService";
import { AssetAcceptance, GenerateType, QaStatus, SceneAssetStatus } from "../src/types";
import { getPipelineInvalidationState, getReferenceChangeState } from "../src/hooks/autoVideoPipelineUtils";
import { clearProjectSceneOutput } from "../src/services/projectRegenerationService";
import { getVisualShotPlanIssues } from "../src/services/visualPlanningService";
import { getCinematicStoryboardRecoveryPrompt } from "../src/constants/cinematicPrompts";
import { getUnderfilledCinematicSceneIds } from "../src/services/storyboardQualityService";
const cinematicSplitPrompt = getCinematicStoryboardRecoveryPrompt("Chapter One\nA complete playable event unfolds.", "[]", 1, 10, false);
assert.match(cinematicSplitPrompt, /Split the screenplay into exactly 1 clear, ordered 10-second scenes/i);
assert.match(cinematicSplitPrompt, /Choose the best pacing yourself/i);
assert.match(cinematicSplitPrompt, /unique scene IDs and exact scene dialogue/i);
assert.doesNotMatch(cinematicSplitPrompt, /storyboardQa|score of 85/i);
const longCinematicSource = _.join(_.fill(Array(200), "playable"), " ");
assert.deepEqual(getUnderfilledCinematicSceneIds([{ id: "title_only", script: "Biển Lửa Hỏa Diệm" } as any], longCinematicSource, 5), ["title_only"]);
const incompleteScriptIssues = getCinematicScriptReadinessIssues("Tôn Ngộ Không vung gậy nhưng câu chuyện đang v", [{ id: "ch_1", title: "Một", scriptSegment: "Câu chuyện đang v" }], { passed: true, durationFit: true } as any, { allowed: true } as any);
assert.deepEqual(incompleteScriptIssues, []);
const advisoryCinematicScoreIssues = getCinematicScriptReadinessIssues(
  "Cảnh phim kết thúc.",
  [{ id: "ch_1", title: "Một", scriptSegment: "Cảnh phim kết thúc." }],
  {
    continuityScore: 84,
    repetitionScore: 90,
    factualityScore: 90,
    emotionalArcScore: 90,
    conversationalScore: 90,
    hookPayoffScore: 90,
    passed: true,
  } as any,
  { allowed: true, warnings: [] } as any,
);
assert(!advisoryCinematicScoreIssues.some((issue) => issue.startsWith("scriptQa:cinematic_score_below_")));
const hardLowCinematicScoreIssues = getCinematicScriptReadinessIssues(
  "Cảnh phim kết thúc.",
  [{ id: "ch_1", title: "Một", scriptSegment: "Cảnh phim kết thúc." }],
  {
    continuityScore: 64,
    repetitionScore: 90,
    factualityScore: 90,
    emotionalArcScore: 90,
    conversationalScore: 90,
    hookPayoffScore: 90,
    passed: true,
  } as any,
  { allowed: true, warnings: [] } as any,
);
assert.deepEqual(hardLowCinematicScoreIssues, []);
assert(
  !getCinematicScriptReadinessIssues(
    "Cảnh phim kết thúc.",
    [{ id: "ch_1", title: "Một", scriptSegment: "Cảnh phim kết thúc." }],
    {
      continuityScore: 90,
      repetitionScore: 90,
      factualityScore: 90,
      emotionalArcScore: 90,
      conversationalScore: 90,
      hookPayoffScore: 90,
      passed: true,
    } as any,
    { allowed: true, warnings: ["content_safety_response_incomplete"] } as any,
  ).includes("contentSafety:review_unavailable_or_incomplete"),
);
const takeIssues = getCinematicGeneratedTakeIssues(
  [
    {
      id: "sc_1",
      assetUrl: "/assets/projects/test/videos/sc_1.mp4",
      assetType: GenerateType.Video,
      assetStatus: SceneAssetStatus.Approved,
      qaStatus: QaStatus.Passed,
      acceptance: AssetAcceptance.Approved,
    },
    { id: "sc_2", assetType: GenerateType.Video, assetStatus: SceneAssetStatus.Failed, qaStatus: QaStatus.Failed, acceptance: AssetAcceptance.Rejected },
  ] as any,
  2,
);
assert(takeIssues.includes("sc_2:asset_missing"));
assert(!takeIssues.includes("sc_2:qa_failed"));
assert(!takeIssues.some((issue) => issue.startsWith("storyboard:clip_count:")));
assert.deepEqual(
  getCinematicGeneratedTakeIssues(
    [
      {
        id: "sc_advisory_only",
        assetUrl: "/assets/projects/test/videos/sc_advisory_only.mp4",
        assetType: GenerateType.Video,
        assetStatus: SceneAssetStatus.Failed,
        qaStatus: QaStatus.Failed,
        acceptance: AssetAcceptance.Rejected,
      },
    ] as any,
    1,
  ),
  [],
  "Downloaded cinematic video must not be blocked by advisory QA state",
);
assert.deepEqual(
  getCinematicGeneratedTakeIssues(
    [
      {
        id: "sc_unreviewed",
        assetUrl: "/assets/projects/test/videos/sc_unreviewed.mp4",
        assetType: GenerateType.Video,
        assetStatus: SceneAssetStatus.Approved,
        qaStatus: QaStatus.Unavailable,
        acceptance: AssetAcceptance.AcceptedWithWarning,
      },
    ] as any,
    1,
  ),
  [],
);
assert.deepEqual(
  getCinematicGeneratedTakeIssues(
    [
      {
        id: "sc_failed_qa_but_downloaded",
        assetUrl: "/assets/projects/test/videos/sc_failed_qa_but_downloaded.mp4",
        assetType: GenerateType.Video,
        assetStatus: SceneAssetStatus.Failed,
        qaStatus: QaStatus.Failed,
        acceptance: AssetAcceptance.Rejected,
      },
    ] as any,
    1,
  ),
  [],
  "Downloaded video with failed QA remains eligible for editor/library analysis",
);
assert.deepEqual(getCinematicStoryboardReadinessIssues([{ id: "only_clip", script: "Một cảnh." }] as any, 2, { passed: true, scriptCoverageScore: 100, pacingCoverageScore: 100 } as any), ["storyboard:scene_count_mismatch:1/2"]);
assert.deepEqual(getCinematicStoryboardReadinessIssues([{ id: "usable_clip", script: "Một cảnh hoàn chỉnh." }] as any, 1, { passed: true, scriptCoverageScore: 84, pacingCoverageScore: 84, blockingErrors: [] } as any), []);
assert.deepEqual(
  getCinematicStoryboardReadinessIssues(
    [
      { id: "scene_intro", script: "Opening title image.", isFilmIntro: true },
      { id: "content_1", script: "Mở đầu câu chuyện." },
      { id: "content_2", script: "Kết thúc câu chuyện." },
    ] as any,
    2,
    { passed: true, scriptCoverageScore: 100, pacingCoverageScore: 100 } as any,
  ),
  [],
  "The separate intro must not replace or increase the requested content-scene count",
);
assert.deepEqual(getCinematicStoryboardReadinessIssues([{ id: "missing_story", script: "Một cảnh quá thiếu." }] as any, 1, { passed: true, scriptCoverageScore: 64, pacingCoverageScore: 90, blockingErrors: [] } as any), []);
const unclearFightIssues = getCinematicSceneContractIssues({ id: "fight_weak", script: "Ngộ Không vung thiết bảng giữa thiên binh." } as any, "10s");
assert.deepEqual(unclearFightIssues, ["fight_weak:generationPrompt:missing"]);
const readableFightIssues = getCinematicSceneContractIssues(
  {
    id: "fight_clear",
    script: "Ngộ Không plants his lead foot, transfers his weight forward and draws his staff back over his right shoulder. He swings his staff toward the armored opponent. The staff hits the raised shield with visible sparks; the defender recoils and slides backward. Ngộ Không lands in a new position while the opponent remains disarmed.",
    generationPrompt: "A focused Veo prompt showing one decisive attack, defence and physical consequence.",
  } as any,
  "10s",
);
assert.deepEqual(readableFightIssues, []);
const repairedFightScene = repairCinematicStoryboardContract([{ id: "fight_repaired", script: "The giant swings an axe while the hero blocks it.", visibleAction: "The giant swings an axe while the hero blocks it." } as any], "vi" as any, "10s")[0];
assert.deepEqual(getCinematicSceneContractIssues(repairedFightScene, "10s"), ["fight_repaired:generationPrompt:missing"]);
assert(!stringifyJson(repairedFightScene).includes("foreground attacker"));
assert(!getCinematicSceneContractIssues({ id: "retreat_order", script: "The emperor orders his soldiers to retreat while the hero approaches the throne." } as any, "10s").some((issue) => issue.includes(":actionChoreography:")));
const repairableScene = {
  id: "sc_repairable",
  script: "Ngộ Không nhìn quanh thiên đình.",
  prompt: "A cinematic celestial hall under motivated light.",
  characterIds: ["char_1"],
} as any;
const repairedVisualIssues = getVisualShotPlanIssues(
  {
    ...repairableScene,
    visibleAction: "A defiant and proud moment",
    visualIntent: "Reveal the character's challenge",
    reaction: "The celestial guards recoil",
    storyEvidence: "The challenge in the celestial hall",
    visualHook: "A lone rebel framed against the throne",
    composition: "Centered medium shot with visible guards",
  },
  repairableScene,
);
assert(repairedVisualIssues.some((issue) => issue.includes("visibleAction:no_observable_physical_verb")));
assert.deepEqual(getBlockingCinematicPlanningIssues(["sc_10:cinematicBeats:0:source_scene_mismatch", "sc_10:cinematicBeats:0:timing_invalid", "sc_10:cinematicBeats:1:generation_prompt_missing_exact_dialogue"]), []);
assert.deepEqual(
  getCinematicScriptReadinessIssues(
    "Cảnh một kết thúc. Cảnh hai bắt đầu.",
    [
      { id: "ch_1", title: "Một", scriptSegment: "Cảnh một kết thúc." },
      { id: "ch_2", title: "Hai", scriptSegment: "Nội dung không thuộc kịch bản." },
    ],
    { passed: true, durationFit: true } as any,
    { allowed: true } as any,
  ),
  [],
);
const resumableProject = {
  id: "resume_project",
  input: { type: "script", content: "Saved story." },
  config: { duration: "1 minute" },
  scriptRewritten: "Saved story.",
  contentSafety: { allowed: true },
  storyboard: [{ id: "saved_scene", assetUrl: "/assets/projects/resume_project/videos/saved_scene.mp4" }],
  thumbnails: [{ id: "thumb", imageUrl: "/assets/projects/resume_project/thumbnails/thumb.jpg" }],
  seo: { title: "Saved" },
  voiceConfig: { audioUrl: "/assets/projects/resume_project/voices/voice.mp3" },
  visualConfig: { styleReferenceImages: ["/references/style.jpg"], sceneReferenceImages: [], thumbnailReferenceImages: [] },
} as any;
const continuationReferences = getReferenceChangeState(resumableProject, [], [], [], [], true);
const continuationInvalidation = getPipelineInvalidationState(resumableProject, { resumeMode: true, duration: "2 minutes", forceRegenerateScenes: false, forceRegenerateVoice: false } as any, continuationReferences);
assert.equal(continuationReferences.shouldRegenerateStoryboard, false);
assert.equal(continuationInvalidation.regenerateScript, false);
assert.equal(continuationInvalidation.regenerateStoryboard, false);
assert.equal(continuationInvalidation.regenerateSceneAssets, false);
const targetedClipReset = clearProjectSceneOutput(
  {
    id: "targeted_project",
    renderedVideoUrl: "/assets/projects/targeted_project/videos/final.mp4",
    thumbnails: [{ id: "thumb_1", imageUrl: "/assets/projects/targeted_project/thumbnails/thumb.jpg" }],
    visualConfig: { characters: [{ id: "sun_wukong", images: ["/assets/projects/targeted_project/references/character/wukong.png"] }] },
    storyboard: [
      { id: "sc_keep", assetUrl: "/assets/projects/targeted_project/videos/sc_keep.mp4", generationPrompt: "keep prompt" },
      { id: "sc_retry", assetUrl: "/assets/projects/targeted_project/videos/sc_retry.mp4", generationPrompt: "retry prompt" },
    ],
  } as any,
  "sc_retry",
);
assert.equal(targetedClipReset.storyboard?.[0].assetUrl, "/assets/projects/targeted_project/videos/sc_keep.mp4");
assert.equal(targetedClipReset.storyboard?.[1].assetUrl, undefined);
assert.equal(targetedClipReset.storyboard?.[1].generationPrompt, "retry prompt");
assert.equal(targetedClipReset.renderedVideoUrl, undefined);
assert.equal(targetedClipReset.thumbnails?.[0].imageUrl, "/assets/projects/targeted_project/thumbnails/thumb.jpg");
assert.equal(targetedClipReset.visualConfig.characters?.[0].images?.[0], "/assets/projects/targeted_project/references/character/wukong.png");
const pipelineSource = resolveSourceTextConstants(fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8"));
const autoGeneratorSource = resolveSourceTextConstants(fs.readFileSync("src/components/AutoVideoGenerator.tsx", "utf8"));
const previewSource = resolveSourceTextConstants(fs.readFileSync("src/components/auto-video/PreviewPanelSection.tsx", "utf8"));
const controllerSource = resolveSourceTextConstants(fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8"));
assert.doesNotMatch(pipelineSource, /No valid take remains[\s\S]{0,300}realScenes\s*=\s*_\.filter/, "pipeline still deletes failed scenes before render");
assert.match(pipelineSource, /getCinematicGeneratedTakeIssues/, "mandatory take gate is not connected");
assert.match(pipelineSource, /qa_unavailable_no_evidence_for_regeneration/, "unavailable video QA still triggers unsupported regeneration");
assert.match(pipelineSource, /videoQaReasons\s*=\s*videoQa\.quality\s*\?\s*getSceneVisualRegenerationReasons/, "video regeneration is not limited to classified hard defects");
assert.match(pipelineSource, /retryScenes[\s\S]*runSceneGeneration\(retryScenes/, "failed-scene-only media retry is not connected");
assert.match(pipelineSource, /!hasSceneAsset\(scene\) && !scene\.remoteVideoDownloadPending/, "pending Flow media can be submitted for generation again");
assert.match(pipelineSource, /if \(!_\.isEmpty\(imageResult\.remoteMediaId\)\) sc\.remoteVideoMediaId = imageResult\.remoteMediaId/, "successful Flow media ID is not retained");
assert.match(pipelineSource, /isCinematicPipeline && isScriptCached[\s\S]*getCinematicScriptReadinessIssues/, "new production still validates an empty value as a saved script");
assert.match(pipelineSource, /isCinematicPipeline && isContinuation && isStoryboardCached/, "saved storyboard repair is not isolated to continuation runs");
assert.match(previewSource, /setIsSceneDialogOpen\(true\)/, "clip regeneration does not require an explicit scene selection");
assert.match(autoGeneratorSource, /deleteProjectRegenerationAssets\(project\.id, target, sceneId\)/, "selected clip ID is not sent to targeted cleanup");
assert.match(autoGeneratorSource, /forceRegenerateScenes: _\.isEmpty\(sceneId\)/, "selected clip retry still forces every scene to regenerate");
assert.match(controllerSource, /clearProjectSceneOutput\(project, sceneId\)/, "server does not isolate selected clip cleanup");
assert.match(controllerSource, /createCinematicFilmPackageResponseSchema/, "cinematic film package is not constrained to the configured scene count");
assert.match(controllerSource, /getCinematicFilmPackagePrompt/, "single film-package prompt is not connected");
assert.match(controllerSource, /productionScenes: _\.castArray\(cinematicFilmPackage\?\.scenes/, "AI-authored production scenes are not returned with the film package");
assert.match(controllerSource, /characters: _\.castArray\(cinematicFilmPackage\?\.characters/, "AI-authored cast is not returned with the film package");
assert.match(controllerSource, /passed: _\.isEmpty\(blockingErrors\)/, "cinematic storyboard still bypasses deterministic blocking errors");
assert.match(pipelineSource, /const shouldAnalyzeCharacters\s*=\s*!isCinematicPipeline/, "cinematic pipeline still performs a separate character-analysis request");
assert.doesNotMatch(pipelineSource, /createFallbackCharacterProfile|rawAnalyzedCharacters\s*=\s*\[/, "application code still creates a fallback character artifact");
assert.doesNotMatch(pipelineSource, /recoverCinematicChaptersFromStoryboard/, "pipeline still synthesizes cinematic chapters in application code");
process.stdout.write(stringifyJson({ passed: true, incompleteScriptIssues, advisoryCinematicScoreIssues, hardLowCinematicScoreIssues, takeIssues, unclearFightIssues }));
