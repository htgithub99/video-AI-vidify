import assert from "node:assert/strict";
import fs from "node:fs";
import { createCinematicVideoPrompt } from "../src/services/cinematicEpisodeService";
import {
  getBlockingCinematicPromptPreflightIssues,
  getCinematicPromptPreflightIssues,
  resolveAuthoritativeCinematicPrompt,
} from "../src/services/cinematicPromptPreflightService";
import { AspectRatio, GenerateType, ImageGeneratorEngine, StoryboardScene } from "../src/types";
import { getCinematicSceneContractIssues } from "../src/services/cinematicProductionPolicyService";
import { isNonRetryableFlowVideoError } from "../src/services/projectImageGenerationService";
import { FLOW_DIRECT_VIDEO_CONFIG } from "../src/constants/config";
import {
  createFlowDurationOptionPattern,
  createFlowMediaRedirectUrl,
  createFlowVideoConfigState,
  isFlowProjectPageUrl,
  isFlowProjectUnavailableState,
  isFlowPromptValueApplied,
  isFlowVideoConfigSummaryMatching,
  normalizeFlowPromptValue,
  normalizeFlowMediaId,
} from "../src/server/services/imageGeneratorService";

const scene = {
  id: "sc_preflight",
  duration: 10,
  script: "Kade orders the pilot to leave before sunrise, then boards the damaged ship.",
  prompt: "Kade and the pilot commit to departure beside the damaged ship before sunrise.",
  visualIntent: "The departure decision becomes irreversible.",
  visibleAction: "Kade gives the order and boards the ship.",
  reaction: "The pilot follows and closes the ramp.",
  storyEvidence: "The closing ramp and rising engines prove departure.",
  visualHook: "The ramp seals as cold dawn cuts through dust.",
  shotPurpose: "decision",
  shotSize: "wide to medium coverage",
  cameraAngle: "eye level with a low payoff angle",
  composition: "Kade and the pilot remain readable against the ramp.",
  continuityNotes: "Preserve the same ramp geography, identities, armor and rifle.",
  lighting: "Cold motivated dawn light from screen left.",
  expectedSubjectCount: 2,
  allowBackgroundPeople: false,
  layout: "single_frame",
  textAllowed: false,
  textOverlay: "",
  locationId: "landing_site",
  propIds: ["kade_rifle", "ship_ramp"],
  continuityFrom: "",
  assetStrategy: "ai_generated",
  archivalSearchQuery: "",
  archivalRationale: "",
  sequenceId: "sequence_1",
  shotId: "shot_1",
  shotRole: "master",
  dialogueMode: "on_screen_dialogue",
  spokenDialogue: "We leave before sunrise.",
  speakerCharacterId: "char_1",
  characterIds: ["char_1"],
  lipSyncRequired: true,
  characterBlocking: "Kade faces the pilot beside the open ship ramp",
  eyelineDirection: "Kade looks screen right toward the pilot",
  screenDirection: "left_to_right",
  actionStartState: "Kade stands beside the damaged ship",
  actionEndState: "Kade boards after giving the order",
  locationState: "the same windblown landing site before sunrise",
  wardrobeState: "unchanged weathered armor",
  propState: "rifle remains secured across Kade's back",
  soundDesignCues: ["wind", "ship engine idle"],
  cinematicBeats: [
    { sourceSceneId: "sc_preflight", shotId: "master", shotRole: "master", shotSize: "wide shot", cameraAngle: "eye level", visibleAction: "Kade approaches the waiting pilot and establishes the damaged ship", reaction: "The pilot turns toward him", transition: "hard_cut", dialogueMode: "silent_action", spokenDialogue: "", speakerCharacterId: "", lipSyncRequired: false, startSecond: 0, endSecond: 3.2 },
    { sourceSceneId: "sc_preflight", shotId: "speaker", shotRole: "coverage", shotSize: "medium close up", cameraAngle: "eye level", visibleAction: "Kade stops and gives the departure order", reaction: "The pilot listens", transition: "match_cut", dialogueMode: "on_screen_dialogue", spokenDialogue: "We leave before sunrise.", speakerCharacterId: "char_1", lipSyncRequired: true, startSecond: 3.2, endSecond: 6.7 },
    { sourceSceneId: "sc_preflight", shotId: "payoff", shotRole: "payoff", shotSize: "wide shot", cameraAngle: "low angle", visibleAction: "Kade boards while the engines rise to flight power", reaction: "The pilot follows and closes the ramp", transition: "hard_cut", dialogueMode: "silent_action", spokenDialogue: "", speakerCharacterId: "", lipSyncRequired: false, startSecond: 6.7, endSecond: 10 },
  ],
} as StoryboardScene;

const prompt = `Cinematic live-action photorealism, natural human skin texture, physically plausible environment, realistic materials, motivated practical lighting, restrained filmic contrast, subtle atmospheric depth, grounded production design. Shot on 35mm anamorphic lens, 24fps, cinematic depth of field, natural motion blur.

Kade, an original fictional character and not a real person or celebrity, faces the pilot beside an open damaged ship ramp at the same windblown landing site before sunrise. He wears unchanged weathered armor, while his rifle remains secured across his back. Cold dawn light silhouettes the ramp and drifting dust without hiding either face.

Create one continuous 10-second cinematic sequence with exactly 3 chronological shots and exactly 2 motivated cuts.

0s–3.2s — Shot 1: wide shot, eye level. Kade approaches from screen left, stops beside the ramp, and turns toward the waiting pilot. The pilot pivots to meet his eyeline as the idle engine vibrates the loose ramp cables.

3.2s–6.7s — Shot 2: medium close up, eye level. Continue directly from Shot 1. Kade plants both feet, keeps the rifle secured, and says exactly, "We leave before sunrise." His lips move naturally in sync; the pilot absorbs the order and reaches for the ramp control.

6.7s–10s — Shot 3: wide shot, low angle. Continue directly from Shot 2. Kade boards, the pilot follows, and the ramp closes behind them while the engines rise to flight power, visibly completing the decision to depart.

Maintain identical character identity, face, hairstyle, wardrobe (unchanged weathered armor), weapon and props (rifle secured across Kade's back), lighting direction, geography (the same windblown landing site before sunrise), eyeline and left-to-right screen direction across all shots. Exactly 3 shots and exactly 2 clean motivated cuts. No extra shots, montage, morphing, duplicated characters, distorted faces, wardrobe changes or weapon changes. Natural wind and idle engine audio only; no narrator or background music. Completely text-free. No captions, subtitles, signs, labels, letters, numbers, logos or watermarks. Full-bleed cinematic frame with no borders, margins, letterboxing or pillarboxing.`;
scene.generationPrompt = prompt;
assert.equal(createCinematicVideoPrompt(scene, "ignored metadata", GenerateType.Video, 10), prompt);
assert.deepEqual(getCinematicPromptPreflightIssues(scene, prompt, 10), []);
assert.deepEqual(getBlockingCinematicPromptPreflightIssues(scene, prompt, 10), []);
const promptWithoutCaptureMetadata = prompt.replace("Shot on 35mm anamorphic lens, 24fps, ", "");
assert.deepEqual(getCinematicPromptPreflightIssues(scene, promptWithoutCaptureMetadata, 10), []);
assert.deepEqual(getBlockingCinematicPromptPreflightIssues(scene, promptWithoutCaptureMetadata, 10), []);
const staleDialoguePatch = "Mandatory dialogue correction: char_1 must audibly speak exactly the approved line.";
const compiledFromStaleScene = createCinematicVideoPrompt({ ...scene, generationPrompt: staleDialoguePatch }, scene.prompt || "", GenerateType.Video, 10);
assert.equal(compiledFromStaleScene, staleDialoguePatch);
assert.deepEqual(getCinematicPromptPreflightIssues(scene, compiledFromStaleScene, 10), []);
assert.deepEqual(getCinematicPromptPreflightIssues(scene, prompt.replace("Shot 3", "Final view"), 10), []);
assert.deepEqual(getCinematicPromptPreflightIssues(scene, prompt.replaceAll(scene.spokenDialogue!, ""), 10), []);
assert.deepEqual(getCinematicPromptPreflightIssues(scene, "", 10), ["sc_preflight:generationPrompt:missing"]);
const aiAuthoredPrompt = `${prompt}\n\nPreserve these intentional trailing line breaks.\n`;
assert.equal(resolveAuthoritativeCinematicPrompt(aiAuthoredPrompt, { violatesPolicy: false, repairedPrompt: "must not replace a safe prompt" }), aiAuthoredPrompt);
const aiRewrittenPrompt = `${prompt}\nComplete AI-authored safe rewrite.`;
assert.equal(resolveAuthoritativeCinematicPrompt(aiAuthoredPrompt, { violatesPolicy: true, repairedPrompt: aiRewrittenPrompt }), aiRewrittenPrompt);
assert.equal(resolveAuthoritativeCinematicPrompt(aiAuthoredPrompt, { violatesPolicy: true, repairedPrompt: "" }), aiAuthoredPrompt);
assert.deepEqual(getCinematicSceneContractIssues(scene, 10), []);
assert.deepEqual(getCinematicSceneContractIssues({ ...scene, spokenDialogue: "Người kể: Anh ấy bước đi." }, 10), []);
assert.deepEqual(getCinematicSceneContractIssues({ ...scene, generationPrompt: "" }, 10), ["sc_preflight:generationPrompt:missing"]);
const flowMediaId = "84a69b3c-7dda-487c-a735-227c6b76b6b9";
const duplicatedFlowMediaUrl = `https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=${flowMediaId}/fx/api/trpc/media.getMediaUrlRedirect?name=${flowMediaId}`;
assert.equal(normalizeFlowMediaId(duplicatedFlowMediaUrl), flowMediaId);
assert.equal(createFlowMediaRedirectUrl(duplicatedFlowMediaUrl), `https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=${flowMediaId}`);
assert.equal(isFlowProjectPageUrl("https://flow.google.com/project/8a74ebe7-1cc0-4e64-bd91-bbdbbd252c4d", "8a74ebe7-1cc0-4e64-bd91-bbdbbd252c4d"), true);
assert.equal(isFlowProjectPageUrl("https://labs.google/fx/vi/tools/flow/project/8a74ebe7-1cc0-4e64-bd91-bbdbbd252c4d", "8a74ebe7-1cc0-4e64-bd91-bbdbbd252c4d"), true);
assert.equal(isFlowProjectUnavailableState("https://flow.google.com/404?reason=project", ""), true);
assert.equal(isFlowProjectUnavailableState("https://flow.google.com/project/missing", "Không tìm thấy dự án."), true);
assert.equal(isFlowProjectUnavailableState("https://flow.google.com/project/active", "Create a video"), false);
assert.equal(FLOW_DIRECT_VIDEO_CONFIG.MODEL_BUTTON_LABEL.test("Select model family"), true);
assert.equal(createFlowDurationOptionPattern("10s").test("10 giây"), true);
assert.equal(createFlowDurationOptionPattern("10s").test("8 giây"), false);
assert.equal(normalizeFlowPromptValue("Shot 1\n\u200B Shot 2"), "Shot 1 Shot 2");
assert.equal(isFlowPromptValueApplied("Shot 1\n\nShot 2", "Shot 1 Shot 2"), true);
assert.equal(isFlowPromptValueApplied("Shot 1", "Shot 1 Shot 2"), false);
assert.equal(
  isFlowVideoConfigSummaryMatching("Video · 360p · 10 giây · x1", {
    generateType: GenerateType.Video,
    imageGeneratorEngine: ImageGeneratorEngine.Veo3,
    videoResolution: "360p",
    videoDuration: "10s",
  }),
  true,
);
assert.equal(
  isFlowVideoConfigSummaryMatching("Video · 16:9 · 10 giây · x1", {
    generateType: GenerateType.Video,
    imageGeneratorEngine: ImageGeneratorEngine.Veo3,
    aspectRatio: AspectRatio.SixteenNine,
    videoResolution: "360p",
    videoDuration: "10s",
  }),
  true,
);
assert.equal(
  isFlowVideoConfigSummaryMatching("Video · 9:16 · 10 giây · x1", {
    generateType: GenerateType.Video,
    imageGeneratorEngine: ImageGeneratorEngine.Veo3,
    aspectRatio: AspectRatio.SixteenNine,
    videoResolution: "360p",
    videoDuration: "10s",
  }),
  false,
);
assert.equal(
  isFlowVideoConfigSummaryMatching("Video · 720p · 8 giây · x1", {
    generateType: GenerateType.Video,
    imageGeneratorEngine: ImageGeneratorEngine.Veo3Fast,
    videoResolution: "360p",
    videoDuration: "10s",
  }),
  true,
);
assert.equal(
  isFlowVideoConfigSummaryMatching("Video · 360p · 8 giây · x1", {
    generateType: GenerateType.Video,
    imageGeneratorEngine: ImageGeneratorEngine.Veo3Fast,
    videoResolution: "360p",
    videoDuration: "10s",
  }),
  false,
);
assert.equal(isFlowVideoConfigSummaryMatching("Video · 720p · 8 giây · x2", { generateType: GenerateType.Video, videoResolution: "360p", videoDuration: "10s" }), false);
assert.equal(isNonRetryableFlowVideoError("Google Flow chưa áp dụng đúng cấu hình video người dùng đã chọn."), true);
assert.equal(isNonRetryableFlowVideoError("Ảnh nhân vật chưa được Flow xác nhận tải lên."), true);
assert.equal(isNonRetryableFlowVideoError("Kết nối mạng tạm thời bị gián đoạn."), false);
assert.notEqual(
  createFlowVideoConfigState({ generateType: GenerateType.Video, videoResolution: "360p", videoDuration: "10s" }),
  createFlowVideoConfigState({ generateType: GenerateType.Video, videoResolution: "720p", videoDuration: "8s" }),
);
const flowAutomationSource = fs.readFileSync("src/server/services/imageGeneratorService.ts", "utf8");
const cinematicPipelineSource = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
assert.match(flowAutomationSource, /replaceFlowPromptInput/);
assert.match(flowAutomationSource, /normalizeFlowPromptValue/);
assert.match(flowAutomationSource, /waitForFlowPromptApplied/);
assert.match(flowAutomationSource, /expected=.*observed=/);
assert.match(flowAutomationSource, /flow-submit-disabled-after-prompt/);
assert.match(flowAutomationSource, /FLOW_DIRECT_VIDEO_CONFIG\.SETTINGS_PANEL/);
assert.match(flowAutomationSource, /FLOW_DIRECT_VIDEO_CONFIG\.CONFIG_BUTTON_SELECTOR/);
assert.match(flowAutomationSource, /CONFIG_APPLY_ATTEMPTS/);
assert.match(flowAutomationSource, /\[role="radio"\]/);
assert.match(flowAutomationSource, /if \(attempts >= maxAttempts\) throw error;[\s\S]*browserSessionUnavailable/);
assert.doesNotMatch(flowAutomationSource, /navigator\.clipboard\.writeText\(text\), targetPrompt/);
assert.match(cinematicPipelineSource, /generateCount: isCinematicEpisodeGenre\(config\.genre\)[\s\S]*SecurityConstants\.DEFAULT_AMOUNT/);
assert.match(cinematicPipelineSource, /isNonRetryableFlowVideoError\(failureReason\)/);
assert.match(cinematicPipelineSource, /PIPELINE_CLEAN_BATCH_IMAGES/);
assert.match(cinematicPipelineSource, /idempotencyKey: _\.join\(\[voiceUpdatedProj\.id, sc\.id, sc\.dependencyHash\]/);
assert.match(cinematicPipelineSource, /await generateFilmThumbnails\(\);[\s\S]*await runSceneGeneration\(remainingTargetScenes, false\)/);
assert.doesNotMatch(cinematicPipelineSource, /Promise\.all\(\[runSceneGeneration\(remainingTargetScenes, false\), generateFilmThumbnails\(\)\]\)/);
assert.match(flowAutomationSource, /remoteVideoMediaId/);
assert.match(flowAutomationSource, /sandboxConfig\.knownVideoMediaIds/);
assert.match(flowAutomationSource, /collectFlowVideoUrls\(page, editId\)/);
assert.match(flowAutomationSource, /matchingResponseUrls/);
assert.match(flowAutomationSource, /_\.isEqual\(extractFlowMediaIdFromUrl\(url\), targetMediaId\)/);
assert.doesNotMatch(flowAutomationSource, /collectFlowVideoUrls\(page\)/);
const pipelineControllerSource = fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8");
const projectControllerSource = fs.readFileSync("src/server/controllers/projectController.ts", "utf8");
assert.match(pipelineControllerSource, /activeVideoSubmissionKeys/);
assert.match(pipelineControllerSource, /completedVideoSubmissionResults/);
assert.match(pipelineControllerSource, /completedSubmission && _\.get\(completedSubmission, "success"\)/);
assert.match(pipelineControllerSource, /completedVideoSubmissionResults\.delete\(requestedIdempotencyKey\)/);
assert.match(pipelineControllerSource, /!_\.isEmpty\(requestedIdempotencyKey\) && result\?\.success/);
assert.doesNotMatch(pipelineControllerSource, /_\.some\(\[result\?\.success, result\?\.remoteMediaCreated\]/);
assert.match(pipelineControllerSource, /CONTENT_HASH_ALGORITHM/);
assert.match(pipelineControllerSource, /DUPLICATE_MEDIA_ERROR/);
assert.match(pipelineControllerSource, /DUPLICATE_MEDIA_ID_ERROR/);
assert.match(projectControllerSource, /sceneIdByContentHash/);
assert.match(projectControllerSource, /remoteVideoMediaId: undefined/);
assert.match(cinematicPipelineSource, /const recoverPendingFlowDownloads = async/);
assert.match(cinematicPipelineSource, /await runSceneGeneration\(retryScenes, true\);[\s\S]*await recoverPendingFlowDownloads\(\)/);
process.stdout.write(JSON.stringify({ passed: true, videoSubmissionLimit: 1, creativeQaBlockers: 0 }));
