import { stringifyJson } from "../src/lib/jsonStringify.js";
import { resolveSourceTextConstants } from "./sourceTextAssertions";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createCinematicVideoPrompt } from "../src/services/cinematicEpisodeService";
import { getBlockingCinematicPromptPreflightIssues, getCinematicPromptPreflightIssues, resolveAuthoritativeCinematicPrompt } from "../src/services/cinematicPromptPreflightService";
import { AspectRatio, GenerateType, ImageGeneratorEngine, StoryboardScene } from "../src/types";
import { getCinematicSceneContractIssues } from "../src/services/cinematicProductionPolicyService";
import { isNonRetryableFlowVideoError } from "../src/services/projectImageGenerationService";
import { FLOW_DIRECT_VIDEO_CONFIG } from "../src/constants/config";
import {
  createFlowDurationOptionPattern,
  assignFlowVideoBatchMediaIds,
  createFlowMediaRedirectUrl,
  createFlowVideoConfigState,
  extractFlowMediaIdFromUrl,
  isFlowProjectPageUrl,
  isFlowProjectUnavailableState,
  isFlowPromptValueApplied,
  isReliableFlowVideoResponseUrl,
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
    {
      sourceSceneId: "sc_preflight",
      shotId: "master",
      shotRole: "master",
      shotSize: "wide shot",
      cameraAngle: "eye level",
      visibleAction: "Kade approaches the waiting pilot and establishes the damaged ship",
      reaction: "The pilot turns toward him",
      transition: "hard_cut",
      dialogueMode: "silent_action",
      spokenDialogue: "",
      speakerCharacterId: "",
      lipSyncRequired: false,
      startSecond: 0,
      endSecond: 3.2,
    },
    {
      sourceSceneId: "sc_preflight",
      shotId: "speaker",
      shotRole: "coverage",
      shotSize: "medium close up",
      cameraAngle: "eye level",
      visibleAction: "Kade stops and gives the departure order",
      reaction: "The pilot listens",
      transition: "match_cut",
      dialogueMode: "on_screen_dialogue",
      spokenDialogue: "We leave before sunrise.",
      speakerCharacterId: "char_1",
      lipSyncRequired: true,
      startSecond: 3.2,
      endSecond: 6.7,
    },
    {
      sourceSceneId: "sc_preflight",
      shotId: "payoff",
      shotRole: "payoff",
      shotSize: "wide shot",
      cameraAngle: "low angle",
      visibleAction: "Kade boards while the engines rise to flight power",
      reaction: "The pilot follows and closes the ramp",
      transition: "hard_cut",
      dialogueMode: "silent_action",
      spokenDialogue: "",
      speakerCharacterId: "",
      lipSyncRequired: false,
      startSecond: 6.7,
      endSecond: 10,
    },
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
assert.equal(extractFlowMediaIdFromUrl("https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=projects%2F0d414a19-5a6b-4e19-9287-acf5e88aebc2%2Fmedia%2F27793cf7-734b-4827-b145-5e571c99b871"), "27793cf7-734b-4827-b145-5e571c99b871");
assert.equal(isReliableFlowVideoResponseUrl("https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=27793cf7-734b-4827-b145-5e571c99b871"), true);
assert.equal(isReliableFlowVideoResponseUrl("https://example.com/assets/0d414a19-5a6b-4e19-9287-acf5e88aebc2/image.png"), false);
assert.equal(isFlowProjectPageUrl("https://flow.google.com/project/8a74ebe7-1cc0-4e64-bd91-bbdbbd252c4d", "8a74ebe7-1cc0-4e64-bd91-bbdbbd252c4d"), true);
assert.equal(isFlowProjectPageUrl("https://labs.google/fx/vi/tools/flow/project/8a74ebe7-1cc0-4e64-bd91-bbdbbd252c4d", "8a74ebe7-1cc0-4e64-bd91-bbdbbd252c4d"), true);
assert.equal(isFlowProjectPageUrl("https://flow.google.com/project/8a74ebe7-1cc0-4e64-bd91-bbdbbd252c4d/edit/d2dc38a3-c731-4540-bed8-761bb207d39b", "8a74ebe7-1cc0-4e64-bd91-bbdbbd252c4d"), false);
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
  isFlowVideoConfigSummaryMatching("Video · 360p · 10 giây · 1x", {
    generateType: GenerateType.Video,
    imageGeneratorEngine: ImageGeneratorEngine.Veo3,
    videoResolution: "360p",
    videoDuration: "10s",
  }),
  true,
);
assert.equal(
  isFlowVideoConfigSummaryMatching("Video · 16:9 · 10 giây · 1x", {
    generateType: GenerateType.Video,
    imageGeneratorEngine: ImageGeneratorEngine.Veo3,
    aspectRatio: AspectRatio.SixteenNine,
    videoResolution: "360p",
    videoDuration: "10s",
  }),
  true,
);
assert.equal(
  isFlowVideoConfigSummaryMatching("Video · 9:16 · 10 giây · 1x", {
    generateType: GenerateType.Video,
    imageGeneratorEngine: ImageGeneratorEngine.Veo3,
    aspectRatio: AspectRatio.SixteenNine,
    videoResolution: "360p",
    videoDuration: "10s",
  }),
  false,
);
assert.equal(
  isFlowVideoConfigSummaryMatching("Video · 720p · 8 giây · 1x", {
    generateType: GenerateType.Video,
    imageGeneratorEngine: ImageGeneratorEngine.Veo3Fast,
    videoResolution: "360p",
    videoDuration: "10s",
  }),
  true,
);
assert.equal(
  isFlowVideoConfigSummaryMatching("Video · 360p · 8 giây · 1x", {
    generateType: GenerateType.Video,
    imageGeneratorEngine: ImageGeneratorEngine.Veo3Fast,
    videoResolution: "360p",
    videoDuration: "10s",
  }),
  false,
);
assert.equal(isFlowVideoConfigSummaryMatching("Video · 720p · 8 giây · x2", { generateType: GenerateType.Video, videoResolution: "360p", videoDuration: "10s" }), false);
assert.equal(FLOW_DIRECT_VIDEO_CONFIG.VIDEO_OUTPUT_COUNT, 1);
assert.equal(FLOW_DIRECT_VIDEO_CONFIG.PROMPTS_PER_BATCH, 1);
assert.equal(FLOW_DIRECT_VIDEO_CONFIG.GENERATION_RETRY_COUNT, 2);
assert.deepEqual(
  assignFlowVideoBatchMediaIds(
    [
      { sceneId: "scene_001", prompt: "Kade closes the damaged ship ramp before sunrise." },
      { sceneId: "scene_002", prompt: "Mira raises a red signal flare above the flooded street." },
    ],
    [
      { editId: "11111111-1111-4111-8111-111111111111", promptText: "Mira raises a red signal flare above the flooded street." },
      { editId: "22222222-2222-4222-8222-222222222222", promptText: "Kade closes the damaged ship ramp before sunrise." },
    ],
  ),
  [
    { sceneId: "scene_001", mediaId: "22222222-2222-4222-8222-222222222222" },
    { sceneId: "scene_002", mediaId: "11111111-1111-4111-8111-111111111111" },
  ],
);
assert.deepEqual(
  assignFlowVideoBatchMediaIds(
    [
      { sceneId: "scene_a", prompt: "alpha glacier raven" },
      { sceneId: "scene_b", prompt: "beta harbor eagle" },
    ],
    [
      { editId: "33333333-3333-4333-8333-333333333333", promptText: "alpha glacier beta harbor", evidence: "dom", discoveryOrder: 0 },
      { editId: "44444444-4444-4444-8444-444444444444", promptText: "alpha glacier", evidence: "dom", discoveryOrder: 1 },
    ],
  ),
  [
    { sceneId: "scene_a", mediaId: "44444444-4444-4444-8444-444444444444" },
    { sceneId: "scene_b", mediaId: "33333333-3333-4333-8333-333333333333" },
  ],
);
assert.deepEqual(
  assignFlowVideoBatchMediaIds(
    [
      { sceneId: "scene_a", prompt: "first scene prompt" },
      { sceneId: "scene_b", prompt: "second scene prompt" },
    ],
    [
      { editId: "55555555-5555-4555-8555-555555555555", evidence: "dom", discoveryOrder: 0 },
      { editId: "66666666-6666-4666-8666-666666666666", evidence: "dom", discoveryOrder: 1 },
    ],
  ),
  [
    { sceneId: "scene_a", mediaId: undefined },
    { sceneId: "scene_b", mediaId: undefined },
  ],
);
assert.deepEqual(assignFlowVideoBatchMediaIds([{ sceneId: "scene_a", prompt: "first scene prompt" }], [{ editId: "55555555-5555-4555-8555-555555555555", evidence: "dom", discoveryOrder: 0 }]), [{ sceneId: "scene_a", mediaId: undefined }]);
assert.deepEqual(
  assignFlowVideoBatchMediaIds(
    [
      { sceneId: "scene_a", prompt: "first scene prompt" },
      { sceneId: "scene_b", prompt: "second scene prompt" },
    ],
    [
      { editId: "77777777-7777-4777-8777-777777777777", evidence: "network", discoveryOrder: 0 },
      { editId: "88888888-8888-4888-8888-888888888888", evidence: "network", discoveryOrder: 1 },
    ],
  ),
  [
    { sceneId: "scene_a", mediaId: undefined },
    { sceneId: "scene_b", mediaId: undefined },
  ],
);
assert.equal(isNonRetryableFlowVideoError("Google Flow chưa áp dụng đúng cấu hình video người dùng đã chọn."), true);
assert.equal(isNonRetryableFlowVideoError("Ảnh nhân vật chưa được Flow xác nhận tải lên."), true);
assert.equal(isNonRetryableFlowVideoError("Kết nối mạng tạm thời bị gián đoạn."), false);
assert.notEqual(createFlowVideoConfigState({ generateType: GenerateType.Video, videoResolution: "360p", videoDuration: "10s" }), createFlowVideoConfigState({ generateType: GenerateType.Video, videoResolution: "720p", videoDuration: "8s" }));
const flowAutomationSource = resolveSourceTextConstants(fs.readFileSync("src/server/services/imageGeneratorService.ts", "utf8"));
const cinematicPipelineSource = resolveSourceTextConstants(fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8"));
assert.match(flowAutomationSource, /replaceFlowPromptInput/);
assert.match(flowAutomationSource, /normalizeFlowPromptValue/);
assert.match(flowAutomationSource, /waitForFlowPromptApplied/);
assert.match(flowAutomationSource, /resolveFlowGeneratedMediaDetails/);
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
assert.match(flowAutomationSource, /waitForFlowGeneratedMediaBatch/);
assert.match(flowAutomationSource, /generateFlowVideoPromptBatchWithPlaywright/);
assert.match(flowAutomationSource, /PROMPTS_PER_BATCH/);
assert.match(flowAutomationSource, /FLOW_VIDEO_MEDIA_CONFIG\.EXPECTED_OUTPUT_COUNT/);
assert.match(flowAutomationSource, /remoteMediaIds: remoteVideoMediaIds/);
assert.match(flowAutomationSource, /else if \(!isFlowVideoGeneration\)[\s\S]*activePage\.reload/);
assert.match(flowAutomationSource, /sandboxConfig\.knownVideoMediaIds/);
assert.match(flowAutomationSource, /const directMediaUrl = createFlowMediaRedirectUrl\(mediaId\)/);
assert.doesNotMatch(flowAutomationSource, /page\.goto\(`\$\{EXTERNAL_URLS\.GOOGLE_LABS_FLOW\}\/\$\{flowProjectId\}\/edit\/\$\{editId\}`/);
assert.doesNotMatch(flowAutomationSource, /mediaCard\.click\(\{ force: true \}\)/);
assert.match(flowAutomationSource, /collectNewFlowGeneratedMedia/);
assert.match(flowAutomationSource, /isReliableFlowVideoResponseUrl/);
assert.match(flowAutomationSource, /confirmedDomMedia/);
assert.match(flowAutomationSource, /const countAttachedFlowCharacters[\s\S]*ATTACHMENT_PREVIEW/);
assert.doesNotMatch(flowAutomationSource, /const countAttachedFlowCharacters[\s\S]{0,900}promptCharacterCount/);
assert.match(flowAutomationSource, /HTML_VIDEO_URL_PATTERN\.test\(htmlVideoUrl\)/);
assert.doesNotMatch(flowAutomationSource, /collectFlowVideoUrls\(page\)/);
const pipelineControllerSource = resolveSourceTextConstants(fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8"));
const projectControllerSource = resolveSourceTextConstants(fs.readFileSync("src/server/controllers/projectController.ts", "utf8"));
assert.match(pipelineControllerSource, /activeVideoSubmissionKeys/);
assert.match(pipelineControllerSource, /completedVideoSubmissionResults/);
assert.match(pipelineControllerSource, /completedSubmission && _\.get\(completedSubmission, "success"\)/);
assert.match(pipelineControllerSource, /completedVideoSubmissionResults\.delete\(requestedIdempotencyKey\)/);
assert.match(pipelineControllerSource, /!_\.isEmpty\(requestedIdempotencyKey\) && result\?\.success/);
assert.doesNotMatch(pipelineControllerSource, /_\.some\(\[result\?\.success, result\?\.remoteMediaCreated\]/);
assert.match(pipelineControllerSource, /CONTENT_HASH_ALGORITHM/);
assert.match(pipelineControllerSource, /DUPLICATE_MEDIA_ERROR/);
assert.match(pipelineControllerSource, /DUPLICATE_MEDIA_ID_ERROR/);
assert.match(pipelineControllerSource, /persistProjectVideoVariants/);
assert.match(pipelineControllerSource, /completedScene\.assetUrls = fallbackUrls/);
assert.match(pipelineControllerSource, /remoteVideoMediaIds = generatedRemoteMediaIds/);
assert.match(projectControllerSource, /sceneIdByContentHash/);
assert.match(projectControllerSource, /remoteVideoMediaId: undefined/);
assert.match(projectControllerSource, /assetUrls = _\.uniq\(\[assetUrl, \.\.\.assetUrls\]\)/);
assert.match(cinematicPipelineSource, /const recoverPendingFlowDownloads = async/);
assert.doesNotMatch(cinematicPipelineSource, /submitProjectFlowVideoBatch/);
assert.match(cinematicPipelineSource, /await finishVideoScene\(scene\)/);
assert.match(cinematicPipelineSource, /attempt <= FLOW_DIRECT_VIDEO_CONFIG\.GENERATION_RETRY_COUNT/);
assert.match(cinematicPipelineSource, /if \(!hasSceneAsset\(scene\)\) break/);
const flowCreatorSource = resolveSourceTextConstants(fs.readFileSync("src/components/FlowVideoCreator.tsx", "utf8"));
assert.match(flowCreatorSource, /for \(let attempt = 0; attempt <= FLOW_DIRECT_VIDEO_CONFIG\.GENERATION_RETRY_COUNT; attempt\+\+\)/);
assert.match(flowCreatorSource, /generated\?\.remoteMediaCreated !== false/);
assert.doesNotMatch(flowCreatorSource, /const batch: Clip\[\]/);
assert.match(pipelineControllerSource, /_\.size\(requestedItems\) !== FLOW_DIRECT_VIDEO_CONFIG\.PROMPTS_PER_BATCH/);
assert.match(cinematicPipelineSource, /await runSceneGeneration\(retryScenes, true\);[\s\S]*await recoverPendingFlowDownloads\(\)/);
process.stdout.write(stringifyJson({ passed: true, promptsPerGeneration: FLOW_DIRECT_VIDEO_CONFIG.PROMPTS_PER_BATCH, retryCount: FLOW_DIRECT_VIDEO_CONFIG.GENERATION_RETRY_COUNT, videosPerPrompt: 1, creativeQaBlockers: 0 }));
