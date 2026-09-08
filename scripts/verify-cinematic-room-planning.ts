import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import _ from "lodash";
import {
  CINEMATIC_CHAT_MODEL_LABELS,
  CINEMATIC_CHAT_MODEL_OPTIONS,
  CINEMATIC_CHAT_PLANNING_CONFIG,
  GEMINI_CHAT_BASE_MODEL_LABELS,
  GEMINI_CHAT_THINKING_LEVEL_LABELS,
  normalizeCinematicArtifactIdentity,
} from "../src/constants/cinematicConstants";
import {
  getCinematicVideoPlanningPrompt,
  getCinematicVideoPlanningRepairPrompt,
  getCinematicVideoPromptPolicyRepairPrompt,
  getCinematicVideoPromptRepairPrompt,
} from "../src/constants/cinematicPrompts";
import { createVisualContinuityContext } from "../src/services/visualContinuityService";
import {
  getBlockingCinematicPlanningIssues,
  getBlockingCinematicStoryboardContractIssues,
  getCinematicStoryboardContractIssues,
} from "../src/services/cinematicProductionPolicyService";
import { createScopedVisualBibleContext, getVisualShotPlanIssues } from "../src/services/visualPlanningService";
import { partitionCinematicPlanningResponse } from "../src/services/cinematicPlanningRecoveryService";
import { AiPlanningChatModel, AiPlanningFallbackProvider, type StoryboardScene, type VisualBible } from "../src/types";
import { safeParseJSON } from "../src/server/utils/helpers";

const TEST_CONSTANTS = {
  DEFAULT_CLIP_DURATION_SECONDS: 10,
  LANGUAGE_VIETNAMESE: "Vietnamese",
  DIRECTIVE_DIALOGUE_REQUIRED: "Dialogue is REQUIRED for sc_2.",
  PIPELINE_CONTROLLER_PATH: "../src/server/controllers/pipelineController.ts",
  CHAT_UI_PLANNING_SERVICE_PATH: "../src/server/services/chatUiPlanningService.ts",
  IMAGE_GENERATOR_SERVICE_PATH: "../src/server/services/imageGeneratorService.ts",
  APP_HEADER_PATH: "../src/components/Header.tsx",
  AUTO_VIDEO_PIPELINE_PATH: "../src/hooks/useAutoVideoPipeline.ts",
  SUCCESS_MESSAGE: "Cinematic room planning assertions passed.\n",
} as const;

const MOCK_PREVIOUS_SCENE = {
  id: "sc_1",
  sequenceId: "seq_1",
  actionEndState: "Kade holds the rifle at shoulder height beside the broken gate.",
  screenDirection: "left_to_right",
  eyelineDirection: "toward the gate",
  locationState: "rainy gate at night",
  wardrobeState: "dark field coat, rain soaked",
  propState: "laser rifle in both hands, intact",
} as unknown as StoryboardScene;

const MOCK_CURRENT_SCENE = {
  id: "sc_2",
  sequenceId: "seq_1",
  script: "Kade warns Varg to surrender.",
  characterIds: ["kade", "varg"],
} as unknown as StoryboardScene;

const MOCK_CHARACTERS = [
  { id: "kade", name: "Kade" },
  { id: "varg", name: "Varg" },
];

const MOCK_ENVIRONMENT_ONLY_SCENE = {
  id: "sc_environment",
  sequenceId: "seq_1",
  shotId: "shot_environment",
  shotRole: "payoff",
  dialogueMode: "silent_action",
  characterBlocking: "No foreground character",
  eyelineDirection: "not_applicable",
  screenDirection: "static_axis",
  actionStartState: "Rain falls over the empty gate.",
  actionEndState: "The gate collapses into the mud.",
  locationState: "rainy gate at night",
  wardrobeState: "not_applicable",
  propState: "broken gate in mud",
  lipSyncRequired: false,
  soundDesignCues: ["rain and collapsing metal"],
  characterIds: [],
  cinematicBeats: [
    { sourceSceneId: "sc_environment", shotId: "a", shotRole: "master", visibleAction: "Rain strikes the gate.", dialogueMode: "silent_action", spokenDialogue: "", speakerCharacterId: "", lipSyncRequired: false, startSecond: 0, endSecond: 3 },
    { sourceSceneId: "sc_environment", shotId: "b", shotRole: "coverage", visibleAction: "The hinges bend outward.", dialogueMode: "silent_action", spokenDialogue: "", speakerCharacterId: "", lipSyncRequired: false, startSecond: 3, endSecond: 7 },
    { sourceSceneId: "sc_environment", shotId: "c", shotRole: "payoff", visibleAction: "The gate collapses into mud.", dialogueMode: "silent_action", spokenDialogue: "", speakerCharacterId: "", lipSyncRequired: false, startSecond: 7, endSecond: 10 },
  ],
} as unknown as StoryboardScene;

const verifyVisualContinuity = () => {
  const continuity = createVisualContinuityContext([MOCK_PREVIOUS_SCENE, MOCK_CURRENT_SCENE], 1, 1);
  const previousContinuity = continuity.previousScene as Partial<StoryboardScene>;
  assert.equal(previousContinuity.actionEndState, MOCK_PREVIOUS_SCENE.actionEndState);
  assert.equal(previousContinuity.screenDirection, MOCK_PREVIOUS_SCENE.screenDirection);
  assert.equal(previousContinuity.propState, MOCK_PREVIOUS_SCENE.propState);
  return continuity;
};

const verifyInitialAndApiPlanningPrompts = (continuity: Record<string, unknown>) => {
  const serializedScene = JSON.stringify([MOCK_CURRENT_SCENE]);
  const serializedCharacters = JSON.stringify(MOCK_CHARACTERS);
  const serializedContinuity = JSON.stringify(continuity);

  const initialPrompt = getCinematicVideoPlanningPrompt(
    serializedScene,
    serializedCharacters,
    "{}",
    serializedContinuity,
    "",
    TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS,
    TEST_CONSTANTS.DIRECTIVE_DIALOGUE_REQUIRED,
    TEST_CONSTANTS.LANGUAGE_VIETNAMESE,
  );
  assert.match(initialPrompt, /Dialogue is REQUIRED for sc_2/);
  assert.match(initialPrompt, /Language: Vietnamese/);
  assert.match(initialPrompt, /Make all creative and directorial choices yourself/i);
  assert.match(initialPrompt, /at least three connected shots without repeating content/i);
  assert.match(initialPrompt, /Follow the supplied story and user settings/i);
  assert.match(initialPrompt, /preserve the supplied dialogue exactly once/i);
  assert.match(initialPrompt, /scene has no supplied dialogue, do not invent dialogue or narration/i);
  assert.match(initialPrompt, /Return valid raw JSON only/i);
  assert.match(initialPrompt, /artifactType.*requestId.*generationPrompt.*completionMarker/i);
  assert.doesNotMatch(initialPrompt, /whip-pans|action axis|contact point|decorative spinning|three to five unmistakable anchors/i);
  assert.doesNotMatch(initialPrompt, /application separately compiles|compiler-owned fields/i);

  const apiPrompt = getCinematicVideoPlanningPrompt(
    serializedScene,
    serializedCharacters,
    JSON.stringify({ characterSpecs: "full API visual bible" }),
    serializedContinuity,
    "",
    TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS,
  );
  assert.doesNotMatch(apiPrompt, /Dialogue assignment for this request/);
  assert.doesNotMatch(apiPrompt, /Use 1 to 5 concise soundDesignCues/);
  assert.match(apiPrompt, /full API visual bible/);
};

const verifyRepairPromptGeneration = (continuity: Record<string, unknown>) => {
  const repairPrompt = getCinematicVideoPlanningRepairPrompt(
    JSON.stringify([MOCK_CURRENT_SCENE]),
    JSON.stringify([{ id: "sc_2", generationPrompt: "" }]),
    JSON.stringify(["sc_2:generationPrompt:missing"]),
    JSON.stringify(continuity),
    TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS,
    TEST_CONSTANTS.DIRECTIVE_DIALOGUE_REQUIRED,
    TEST_CONSTANTS.LANGUAGE_VIETNAMESE,
  );
  assert.match(repairPrompt, /sc_2:generationPrompt:missing/);
  assert.match(repairPrompt, /Previous response/);
  assert.match(repairPrompt, /best complete Veo 3 prompt for each 10-second scene/i);
  assert.match(repairPrompt, /at least three connected shots/i);
  assert.match(repairPrompt, /Return the complete corrected raw JSON object only/i);
  assert.doesNotMatch(repairPrompt, /Set layout|hyphenated duration token|deterministically compiles/);

  const policyRepairPrompt = getCinematicVideoPromptPolicyRepairPrompt("A safe action prompt");
  assert.match(policyRepairPrompt, /change only the unsafe detail and preserve the story, characters, dialogue and creative direction/i);

  const technicalRepairPrompt = getCinematicVideoPromptRepairPrompt("A failed action prompt", ["contact_missing"], MOCK_CURRENT_SCENE);
  assert.match(technicalRepairPrompt, /Make all creative and directorial choices yourself/i);
  assert.match(technicalRepairPrompt, /at least three connected shots/i);
  assert.doesNotMatch(technicalRepairPrompt, /whip-pans|action axis|exact block or evasion/i);
};

const verifyDialogueContractExemption = () => {
  const contractIssues = getCinematicStoryboardContractIssues([MOCK_ENVIRONMENT_ONLY_SCENE], TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS);
  assert.equal(_.some(contractIssues, (issue) => _.includes(issue, "dialogue_coverage")), false);
};

const verifyEnvironmentalActionRecognition = () => {
  const issues = getVisualShotPlanIssues(
    {
      visualIntent: "Establish the hazardous route.",
      visibleAction: "Toxic demonic mist swirls through the canyon and obscures the passage.",
      reaction: "The route disappears behind the moving haze.",
      storyEvidence: "Black vapor gathers between the rock walls.",
      visualHook: "The canyon is visibly swallowed by the advancing mist.",
      composition: "Layered canyon walls frame the moving vapor.",
    },
    { id: "sc_environment", script: "The canyon is covered in demonic mist." } as StoryboardScene,
  );
  assert.equal(_.some(issues, (issue) => _.includes(issue, "no_observable_physical_verb")), false);
};

const verifyBlockingContractClassification = () => {
  const firstScene = {
    ..._.cloneDeep(MOCK_ENVIRONMENT_ONLY_SCENE),
    id: "sc_1",
    screenDirection: "left_to_right",
  } as StoryboardScene;
  const secondScene = {
    ..._.cloneDeep(MOCK_ENVIRONMENT_ONLY_SCENE),
    id: "sc_2",
    continuityFrom: "incorrect_scene",
    actionStartState: "A different action state.",
    screenDirection: "right_to_left",
  } as StoryboardScene;
  firstScene.generationPrompt = "Focused Veo prompt for scene one.";
  secondScene.generationPrompt = "Focused Veo prompt for scene two.";
  const advisoryIssues = getCinematicStoryboardContractIssues([firstScene, secondScene], TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS);
  assert.deepEqual(advisoryIssues, []);
  const continuityBlockers = getBlockingCinematicStoryboardContractIssues([firstScene, secondScene], TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS);
  assert.equal(continuityBlockers.includes("sc_2:continuityFrom:must_reference_previous_clip"), false);
  assert.equal(continuityBlockers.includes("sc_2:actionStartState:must_match_previous_end_state"), false);
  assert.equal(continuityBlockers.includes("sc_2:screenDirection:continuity_break"), false);

  const sceneMissingSound = { ..._.cloneDeep(MOCK_ENVIRONMENT_ONLY_SCENE), generationPrompt: "Focused Veo prompt.", soundDesignCues: [] } as StoryboardScene;
  assert.equal(getBlockingCinematicStoryboardContractIssues([sceneMissingSound], TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS).includes("sc_environment:soundDesignCues:missing"), false);

  assert.deepEqual(
    getBlockingCinematicPlanningIssues([
      "sc_2:screenDirection:continuity_break",
      "sc_2:neighbor_visual_repetition",
      "sc_2:editorial_rhythm:shotSize_repeated_three_times",
      "sc_2:prompt:incomplete_or_outside_global_length_contract",
      "sc_2:textOverlay:must_be_empty_when_text_forbidden",
    ]),
    [],
  );
  assert.deepEqual(getBlockingCinematicPlanningIssues(["sc_2:generationPrompt:missing", "sc_2:soundDesignCues:invalid"]), ["sc_2:generationPrompt:missing"]);
  assert.deepEqual(getBlockingCinematicPlanningIssues(["sc_2:characterIds:unknown:varg", "sc_2:actionChoreography:aftermath_missing"]), []);
};

const verifyScopedVisualBibleIsolation = () => {
  const mockVisualBible = {
    visualStyle: "cinematic",
    characterSpecs: "all unrelated character details",
    locations: [
      { id: "loc_a", name: "A", visualAnchors: [], geography: "A", timeProgression: "day" },
      { id: "loc_b", name: "B", visualAnchors: [], geography: "B", timeProgression: "night" },
    ],
    props: [
      { id: "prop_a", name: "A", visualAnchors: [], narrativeFunction: "A" },
      { id: "prop_b", name: "B", visualAnchors: [], narrativeFunction: "B" },
    ],
  } as unknown as VisualBible;

  const targetScene = { ...MOCK_CURRENT_SCENE, locationId: "loc_b", propIds: ["prop_b"] } as unknown as StoryboardScene;
  const scopedBible = createScopedVisualBibleContext(mockVisualBible, [targetScene]);

  assert.deepEqual(_.map(scopedBible.locations, "id"), ["loc_b"]);
  assert.deepEqual(_.map(scopedBible.props, "id"), ["prop_b"]);
  assert.equal("characterSpecs" in scopedBible, false);
};

const verifyPartialBatchSceneRecovery = () => {
  const requestedScenes = _.map(["scene_010", "scene_011", "scene_012"], (id) => ({ id, generationPrompt: "" })) as unknown as StoryboardScene[];
  const partialResponse = [
    { id: "scene_010", generationPrompt: "Complete AI-authored prompt for scene ten." },
    { id: "scene_011", generationPrompt: "Complete AI-authored prompt for scene eleven." },
  ] as unknown as StoryboardScene[];
  const firstPartition = partitionCinematicPlanningResponse(requestedScenes, partialResponse, ["scene_012:result:missing_scene"]);
  assert.deepEqual(_.map(firstPartition.completedScenes, "id"), ["scene_010", "scene_011"]);
  assert.deepEqual(_.map(firstPartition.unresolvedScenes, "id"), ["scene_012"]);

  const recoveredResponse = [{ id: "scene_012", generationPrompt: "Complete AI-authored prompt for scene twelve." }] as unknown as StoryboardScene[];
  const recoveredPartition = partitionCinematicPlanningResponse(firstPartition.unresolvedScenes, recoveredResponse, []);
  assert.deepEqual(_.map(recoveredPartition.completedScenes, "id"), ["scene_012"]);
  assert.deepEqual(recoveredPartition.unresolvedScenes, []);
};

const verifyPipelineControllerSourceInvariants = () => {
  const controllerSource = readFileSync(new URL(TEST_CONSTANTS.PIPELINE_CONTROLLER_PATH, import.meta.url), "utf8");
  assert.match(controllerSource, /AiPlanningExecutionMode\.ApiOnly\)\) return requestApiPlan\(apiContents, expectedSceneIds\)/);
  assert.match(controllerSource, /AiPlanningExecutionMode\.RoomOnly\)\) return requestChatUiPlan\(chatUiContents, expectedSceneIds\)/);
  assert.match(controllerSource, /return await requestApiPlan\(apiContents, expectedSceneIds\)[\s\S]*return requestChatUiPlan\(chatUiContents, expectedSceneIds\)/);
  assert.match(controllerSource, /return await requestChatUiPlan\(chatUiContents, expectedSceneIds\)[\s\S]*return requestApiPlan\(apiContents, expectedSceneIds\)/);
  assert.match(controllerSource, /forChatUi \? chunkCharactersJson : charactersJson/);
  assert.match(controllerSource, /isCinematicPlanning\s*\? _\.cloneDeep\(sourceScenes\)/);
  assert.match(controllerSource, /_\.map\(promptCharacters, \(character\) => _\.pick\(character, \["id", "name", "prompt"\]\)\)/);
  assert.match(controllerSource, /forChatUi \? chunkVisualBibleJson : jsonUtils\.safeStringify\(resolvedVisualBible\)/);
  assert.match(controllerSource, /createCinematicPlanningProperties/);
  assert.match(controllerSource, /generationPrompt: planningString/);
  assert.match(controllerSource, /if \(isCinematicPlanning\) \{[\s\S]*generationPrompt:missing[\s\S]*return _\.uniq\(issues\)/);
  assert.match(controllerSource, /getCorrectablePlanningIssues[\s\S]*CINEMATIC_CHAT_PLANNING_CONFIG\.MAX_CORRECTION_ATTEMPTS/);
  assert.match(controllerSource, /CINEMATIC_CHAT_PLANNING_CONFIG\.ROOM_RESPONSE_ATTEMPTS/);
  assert.match(controllerSource, /getBlockingCinematicStoryboardContractIssues/);
  assert.match(controllerSource, /getBlockingCinematicPlanningIssues\(planningIssues\)/);
  assert.match(controllerSource, /candidateBlockingCount[\s\S]*currentBlockingCount/);
  assert.match(controllerSource, /chunkSize = isCinematicPlanning \? CINEMATIC_PRODUCTION_POLICY\.PLANNING_CHUNK_SIZE/);
  assert.match(controllerSource, /targetRepairSceneIds[\s\S]*createRepairPrompt\(parsedItems, correctionIssues, targetRepairSceneIds\)/);
  assert.match(controllerSource, /getCinematicVideoPlanningRepairPrompt/);
  assert.match(controllerSource, /planningMasterStoryboard/);
  assert.doesNotMatch(controllerSource, /continuityContext\.masterSequence/);
  assert.match(controllerSource, /const parsedScenes = isCinematicPlanning \? _\.get\(parsed, "scenes"\) : parsed/);
  assert.match(controllerSource, /mergedCandidateItems[\s\S]*candidatePlanningIssues = collectPlanningIssues\(mergedCandidateItems\)/);
  assert.match(controllerSource, /blockedSceneIds[\s\S]*planningPartialStoryboard/);
  assert.match(controllerSource, /storyboard: planningPartialStoryboard/);
};

const verifyPlanningRunIsolation = () => {
  const planningServiceSource = readFileSync(new URL(TEST_CONSTANTS.CHAT_UI_PLANNING_SERVICE_PATH, import.meta.url), "utf8");
  const imageGeneratorSource = readFileSync(new URL(TEST_CONSTANTS.IMAGE_GENERATOR_SERVICE_PATH, import.meta.url), "utf8");
  const controllerSource = readFileSync(new URL(TEST_CONSTANTS.PIPELINE_CONTROLLER_PATH, import.meta.url), "utf8");
  assert.match(planningServiceSource, /activePlanningControllers = new Map<string, Map<string, ActivePlanningController>>/);
  assert.match(planningServiceSource, /runControllers\.get\(workerId\)\?\.controller\.abort\(\)/);
  assert.match(planningServiceSource, /planningMutexes = new Map<string, SimpleMutex>/);
  assert.match(planningServiceSource, /getPlanningRoomKey\(request\)/);
  assert.match(planningServiceSource, /difference\(expectedSceneIds, returnedSceneIds\)/);
  assert.match(planningServiceSource, /initialResponseSet = new Set/);
  assert.match(planningServiceSource, /initialResponseIdentitySet = new Set/);
  assert.match(planningServiceSource, /getChatResponseSnapshots/);
  assert.match(planningServiceSource, /responsesNotPresentBeforeSubmission/);
  assert.match(planningServiceSource, /mayUseUnmarkedJsonFallback = _\.isEmpty\(expectedSceneIds\) && _\.isEmpty\(completionMarker\) && isCompleteJson/);
  assert.match(planningServiceSource, /belongsToCurrentRequest \|\| mayUseUnmarkedJsonFallback/);
  assert.match(planningServiceSource, /closeChatPlanningRoom/);
  assert.match(planningServiceSource, /request\.closeRoomOnComplete/);
  assert.match(planningServiceSource, /CLOSED_ROOM_ERROR_PATTERN\.test\(errorMessage\)/);
  assert.match(planningServiceSource, /canRecoverClosedRoom[\s\S]*await closeChatPlanningRoom\(request\)/);
  assert.match(planningServiceSource, /const roomKey = getPlanningRoomKey\(request\)[\s\S]*rooms\.delete\(roomKey\)[\s\S]*page\.close\(\)/);
  assert.match(planningServiceSource, /const createRoom[\s\S]*rooms\.set\(projectId, page\)[\s\S]*catch \(error\)[\s\S]*rooms\.delete\(projectId\)[\s\S]*page\.close\(\)/);
  assert.match(planningServiceSource, /finally[\s\S]*await closeChatPlanningRoom\(request\)[\s\S]*release\(\)/);
  assert.match(planningServiceSource, /MODEL_PICKER_TIMEOUT_MS/);
  assert.doesNotMatch(planningServiceSource, /throw new Error\(`\$\{CINEMATIC_CHAT_PLANNING_CONFIG\.INVALID_RESPONSE_ERROR\}: completion_marker_missing/);
  assert.match(planningServiceSource, /sendButton = page\.locator\(sendSelector\)\.filter\(\{ visible: true \}\)\.last\(\)/);
  assert.match(controllerSource, /closeRoomOnComplete: false/);
  assert.match(controllerSource, /res\.once\("finish"[\s\S]*closePlanningRoom/);
  assert.match(planningServiceSource, /selectGeminiChatModel/);
  assert.match(planningServiceSource, /GEMINI_CHAT_BASE_MODEL_LABELS/);
  assert.match(planningServiceSource, /Thinking level\|Mức tư duy\|Cấp độ tư duy/);
  assert.match(planningServiceSource, /grokBootstrapMutexes = new WeakMap<BrowserContext, SimpleMutex>/);
  assert.match(planningServiceSource, /getGrokBootstrapMutex\(browser\.context\)\.acquire\(\)/);
  assert.match(planningServiceSource, /isGrokSecurityChallengeActive/);
  assert.match(planningServiceSource, /ensureGrokReady\(room, request\)/);
  assert.match(planningServiceSource, /Cloudflare yêu cầu xác minh[\s\S]*page\.bringToFront/);
  assert.match(planningServiceSource, /releaseBootstrap = await getGrokBootstrapMutex\(browser\.context\)\.acquire\(\)[\s\S]*createRoom[\s\S]*releaseBootstrap\(\)/);
  const grokReadinessSource = planningServiceSource.match(/const ensureGrokReady[\s\S]*?const ensureChatGptReady/)?.[0] || "";
  assert.match(grokReadinessSource, /GROK_READY_STABLE_POLLS/);
  assert.match(grokReadinessSource, /GROK_POST_CHALLENGE_READY_STABLE_POLLS/);
  assert.match(planningServiceSource, /const browser = await getOrLaunchGrokBrowser\(request\.chromeHeadless\)/);
  assert.match(grokReadinessSource, /challengeActiveLastPoll/);
  assert.match(grokReadinessSource, /grokReadyContexts\.delete\(context\)/);
  assert.doesNotMatch(grokReadinessSource, /page\.(?:goto|reload)\(/);
  assert.match(planningServiceSource, /input\.isEditable\(\)/);
  assert.equal(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_POLL_MS, 250);
  assert.equal(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_STABLE_POLLS, 2);
  assert.match(CINEMATIC_CHAT_PLANNING_CONFIG.JSON_ONLY_DIRECTIVE, /parseable directly with JSON\.parse/i);
  assert.match(planningServiceSource, /belongsToCurrentRequest && isCompleteJson/);
  assert.match(planningServiceSource, /const parsedLatest = tryParseJSON\(latestText\)/);
  assert.match(planningServiceSource, /INVALID_JSON_RESPONSE_ERROR/);
  assert.match(planningServiceSource, /chờ hàng đợi/);
  assert.match(planningServiceSource, /GROK_CHALLENGE_FRAME_SELECTOR\)[\s\S]*filter\(\{ visible: true \}\)/);
  assert.match(planningServiceSource, /challengeBodyVisible = !chatReady/);
  assert.match(imageGeneratorSource, /activeBrowserLaunchPromise: Promise<BrowserSession> \| null/);
  assert.match(imageGeneratorSource, /if \(activeBrowserLaunchPromise\)[\s\S]*await activeBrowserLaunchPromise/);
  assert.match(imageGeneratorSource, /grokBrowserLaunchPromise: Promise<\{ context: BrowserContext; page: Page \}> \| null/);
  assert.match(imageGeneratorSource, /waitForVisibleGrokVerificationBeforeAutomation/);
  assert.match(imageGeneratorSource, /if \(chromeHeadless === false\) await waitForVisibleGrokVerificationBeforeAutomation\(\)/);
  assert.match(imageGeneratorSource, /EXTERNAL_URLS\.GROK_CHAT,/);
  const grokLaunchSource = imageGeneratorSource.match(/const launchNativeGrokBrowser[\s\S]*?export const getOrLaunchGrokBrowser/)?.[0] || "";
  assert.doesNotMatch(grokLaunchSource, /EXTERNAL_URLS\.GROK_IMAGINE/);
  assert.match(grokLaunchSource, /waitForGrokChrome\(\)[\s\S]*waitForVisibleGrokVerificationBeforeAutomation\(\)[\s\S]*chromium\.connectOverCDP/);
  const grokPreconnectSource = imageGeneratorSource.match(/const waitForVisibleGrokVerificationBeforeAutomation[\s\S]*?const launchNativeGrokBrowser/)?.[0] || "";
  assert.doesNotMatch(grokPreconnectSource, /page\.(?:goto|reload)\(|chromium\.connectOverCDP/);
  assert.doesNotMatch(planningServiceSource, /activePlanningController\?\.abort\(\)/);
};

const verifyCurrentGeminiModelPicker = () => {
  assert.deepEqual(
    _.map(CINEMATIC_CHAT_MODEL_OPTIONS[AiPlanningFallbackProvider.GeminiChat], "label"),
    ["Flash-Lite", "Flash", "Pro", "Pro · Tư duy mở rộng", "Pro · Deep Think"],
  );
  assert(CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiFlashLite].test("Gemini 3.5 Flash-Lite"));
  assert(CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiFlash].test("Gemini 3.8 Flash"));
  assert(CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiPro].test("Gemini 3.1 Pro"));
  assert(GEMINI_CHAT_BASE_MODEL_LABELS[AiPlanningChatModel.GeminiDeepThink]?.test("Pro"));
  assert(GEMINI_CHAT_THINKING_LEVEL_LABELS[AiPlanningChatModel.GeminiThinking]?.test("Extended thinking"));
  assert(GEMINI_CHAT_THINKING_LEVEL_LABELS[AiPlanningChatModel.GeminiDeepThink]?.test("Deep Think"));
  assert(CINEMATIC_CHAT_PLANNING_CONFIG.GROK_CHALLENGE_TEXT_PATTERN.test("Performing security verification"));
  assert(CINEMATIC_CHAT_PLANNING_CONFIG.GROK_CHALLENGE_TEXT_PATTERN.test("Verify you are human"));
};

const verifyProviderRoomCleanup = () => {
  const planningServiceSource = readFileSync(new URL(TEST_CONSTANTS.CHAT_UI_PLANNING_SERVICE_PATH, import.meta.url), "utf8");
  const headerSource = readFileSync(new URL(TEST_CONSTANTS.APP_HEADER_PATH, import.meta.url), "utf8");
  assert.match(planningServiceSource, /clearChatPlanningRooms/);
  assert.match(planningServiceSource, /deleteProviderConversationHistory/);
  assert.match(planningServiceSource, /CONVERSATION_DELETE_FALLBACK_PATTERN/);
  assert.match(planningServiceSource, /deletedConversationCount/);
  assert.match(planningServiceSource, /sidebarOpenButton[\s\S]*sidebarReady/);
  assert.match(planningServiceSource, /record\.provider[\s\S]*record\.controller\.abort\(\)/);
  assert.match(planningServiceSource, /AiPlanningFallbackProvider\.GeminiChat[\s\S]*geminiRooms/);
  assert.match(planningServiceSource, /AiPlanningFallbackProvider\.GrokChat[\s\S]*grokRooms/);
  assert.match(planningServiceSource, /AiPlanningFallbackProvider\.ChatGptUi[\s\S]*chatGptRooms/);
  assert.match(headerSource, /CLEAR_GEMINI_ROOMS/);
  assert.match(headerSource, /CLEAR_GROK_ROOMS/);
  assert.match(headerSource, /CLEAR_CHATGPT_ROOMS/);
  assert.match(headerSource, /PIPELINE_CLEAR_CHAT_ROOMS/);
  assert.match(headerSource, /CLEAR_ROOM_CONFIRM/);
  assert.match(headerSource, /CINEMATIC_SETUP_TEXTS\[currentLang as Lang\] \|\| CINEMATIC_SETUP_TEXTS\.vi/);
  assert.doesNotMatch(headerSource, /CINEMATIC_SETUP_TEXTS\[isVietnamese \? UIConstants\.LANG_VI/);
};

const verifyProviderJsonVariants = () => {
  const samples = [
    '{"requestId":"room-json-test :video_prompts "}',
    '```json\n{"requestId":"room-json-test:video_prompts"}\n```',
    'Here is the result: {"requestId":"room-json-test:video_prompts"}',
    '{"requestId":"room-json-test:video_prompts","scenes":[{"id":"scene_001","generationPrompt":"The banner reads "Tề Thiên Đại Thánh" before it opens."}],"completionMarker":"VIDIFY_ARTIFACT_COMPLETE"}',
  ];
  _.forEach(samples, (sample) => {
    const parsed = safeParseJSON(sample, {});
    assert.equal(normalizeCinematicArtifactIdentity(parsed.requestId), "room-json-test:video_prompts");
  });
};

const verifyCinematicPlanningCheckpointing = () => {
  const pipelineSource = readFileSync(new URL(TEST_CONSTANTS.AUTO_VIDEO_PIPELINE_PATH, import.meta.url), "utf8");
  assert.match(pipelineSource, /generationPromptProfileVersion, CINEMATIC_VIDEO_PROMPT_PROFILE_VERSION/);
  assert.match(pipelineSource, /!hasSceneAsset\(scene\).*generationPromptProfileVersion/s);
  assert.match(pipelineSource, /planningBatches = _\.isEmpty\(scenesToPlan\) \? \[\] : \[scenesToPlan\]/);
  assert.match(pipelineSource, /storyboard: pendingPlanningScenes/);
  assert.match(pipelineSource, /planningMasterStoryboard/);
  assert.match(pipelineSource, /allPlanningIssues/);
  assert.doesNotMatch(pipelineSource, /recovery-\$\{batchIndex\}/);
  assert.match(pipelineSource, /const planningWorkerId = CINEMATIC_ROOM_STAGE\.PROMPT/);
  assert.match(pipelineSource, /partitionCinematicPlanningResponse\(requestedScenes, responseScenes, responsePlanningIssues\)/);
  assert.match(pipelineSource, /pendingPlanningScenes = await applyPlanningResponse\(pendingPlanningScenes, batchResponse\)/);
  assert.match(pipelineSource, /checkpointCompletedScenes\(partition\.completedScenes\)/);
  assert.match(pipelineSource, /for \(let batchIndex = 0; batchIndex < planningBatches\.length; batchIndex\+\+\) await processPlanningBatch\(batchIndex\)/);
  assert.doesNotMatch(pipelineSource, /Promise\.all\(_\.map\(_\.range\(planningWorkerCount\)/);
  assert.doesNotMatch(pipelineSource, /Server đã hoàn tất lượt sửa hard gate/);
  assert.doesNotMatch(pipelineSource, /CLIENT_SCENE_RECOVERY_ATTEMPTS|for \(const recoveryScene of pendingPlanningScenes\)/);
  assert.match(pipelineSource, /checkpointProject[\s\S]*await syncProject\(checkpointProject\)/);
  assert.match(pipelineSource, /checkpointPlanningState = async \(phase: string = "prompt_planning"\)/);
  assert.match(pipelineSource, /phase,\s*\r?\n\s*lastSuccessfulPhase/);
  assert.match(pipelineSource, /prompt_planning_completed/);
  assert.match(pipelineSource, /CINEMATIC_PLANNING_MESSAGES\.VI_BATCH_ATTEMPT/);
  assert.match(pipelineSource, /const latestProject = activeProjectSnapshotRef\.current \|\| currentProject/);
};

const runAllVerificationSuites = () => {
  const continuity = verifyVisualContinuity();
  verifyInitialAndApiPlanningPrompts(continuity);
  verifyRepairPromptGeneration(continuity);
  verifyDialogueContractExemption();
  verifyEnvironmentalActionRecognition();
  verifyBlockingContractClassification();
  verifyScopedVisualBibleIsolation();
  verifyPartialBatchSceneRecovery();
  verifyPipelineControllerSourceInvariants();
  verifyPlanningRunIsolation();
  verifyCurrentGeminiModelPicker();
  verifyProviderRoomCleanup();
  verifyProviderJsonVariants();
  verifyCinematicPlanningCheckpointing();
  process.stdout.write(TEST_CONSTANTS.SUCCESS_MESSAGE);
};

runAllVerificationSuites();
