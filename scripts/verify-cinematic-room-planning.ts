import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import _ from "lodash";
import {
  CINEMATIC_CHAT_MODEL_LABELS,
  CINEMATIC_CHAT_MODEL_OPTIONS,
  CINEMATIC_CHAT_PLANNING_CONFIG,
  GEMINI_CHAT_BASE_MODEL_LABELS,
  GEMINI_CHAT_THINKING_LEVEL_LABELS,
} from "../src/constants/cinematicConstants";
import { getCinematicVideoPlanningPrompt, getCinematicVideoPlanningRepairPrompt } from "../src/constants/prompts";
import { createVisualContinuityContext } from "../src/services/visualContinuityService";
import {
  getBlockingCinematicPlanningIssues,
  getBlockingCinematicStoryboardContractIssues,
  getCinematicStoryboardContractIssues,
} from "../src/services/cinematicProductionPolicyService";
import { createScopedVisualBibleContext, getVisualShotPlanIssues } from "../src/services/visualPlanningService";
import { AiPlanningChatModel, AiPlanningFallbackProvider, type StoryboardScene, type VisualBible } from "../src/types";

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
  assert.match(initialPrompt, /natural Vietnamese/);
  assert.match(initialPrompt, /application validates this field and sends it unchanged/i);
  assert.match(initialPrompt, /author the "generationPrompt" field/i);
  assert.match(initialPrompt, /layout must be exactly "single_frame"/i);
  assert.match(initialPrompt, /speakerCharacterId must exactly equal one ID in that same scene's characterIds array/i);
  assert.match(initialPrompt, /copy it character-for-character without translation/i);
  assert.match(initialPrompt, /literal hyphenated duration token "10-second"/i);
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
  assert.match(repairPrompt, /Rewrite every supplied failed scene as one complete production artifact/);
  assert.match(repairPrompt, /sc_2:generationPrompt:missing/);
  assert.match(repairPrompt, /Previous rejected complete scene/);
  assert.match(repairPrompt, /forwards generationPrompt unchanged/);
  assert.match(repairPrompt, /Set layout to exactly "single_frame"/i);
  assert.match(repairPrompt, /speakerCharacterId must exactly equal one ID already present/i);
  assert.match(repairPrompt, /copy it character-for-character/i);
  assert.match(repairPrompt, /hyphenated duration token "10-second"/i);
  assert.doesNotMatch(repairPrompt, /deterministically compiles/);
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
  const advisoryIssues = getCinematicStoryboardContractIssues([firstScene, secondScene], TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS);
  assert(advisoryIssues.includes("sc_2:continuityFrom:must_reference_previous_clip"));
  assert(advisoryIssues.includes("sc_2:actionStartState:must_match_previous_end_state"));
  assert(advisoryIssues.includes("sc_2:screenDirection:continuity_break"));
  const continuityBlockers = getBlockingCinematicStoryboardContractIssues([firstScene, secondScene], TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS);
  assert(continuityBlockers.includes("sc_2:continuityFrom:must_reference_previous_clip"));
  assert.equal(continuityBlockers.includes("sc_2:actionStartState:must_match_previous_end_state"), false);
  assert.equal(continuityBlockers.includes("sc_2:screenDirection:continuity_break"), false);

  const sceneMissingSound = { ..._.cloneDeep(MOCK_ENVIRONMENT_ONLY_SCENE), soundDesignCues: [] } as StoryboardScene;
  assert(getBlockingCinematicStoryboardContractIssues([sceneMissingSound], TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS).includes("sc_environment:soundDesignCues:missing"));

  assert.deepEqual(
    getBlockingCinematicPlanningIssues([
      "sc_2:screenDirection:continuity_break",
      "sc_2:neighbor_visual_repetition",
      "sc_2:editorial_rhythm:shotSize_repeated_three_times",
      "sc_2:prompt:incomplete_or_outside_global_length_contract",
      "sc_2:textOverlay:must_be_empty_when_text_forbidden",
    ]),
    ["sc_2:textOverlay:must_be_empty_when_text_forbidden"],
  );
  assert.deepEqual(getBlockingCinematicPlanningIssues(["sc_2:generationPrompt:missing", "sc_2:soundDesignCues:invalid"]), [
    "sc_2:generationPrompt:missing",
    "sc_2:soundDesignCues:invalid",
  ]);
  assert.deepEqual(getBlockingCinematicPlanningIssues(["sc_2:characterIds:unknown:varg", "sc_2:actionChoreography:aftermath_missing"]), [
    "sc_2:characterIds:unknown:varg",
  ]);
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

const verifyPipelineControllerSourceInvariants = () => {
  const controllerSource = readFileSync(new URL(TEST_CONSTANTS.PIPELINE_CONTROLLER_PATH, import.meta.url), "utf8");
  assert.match(controllerSource, /AiPlanningExecutionMode\.ApiOnly\)\) return requestApiPlan\(apiContents, expectedSceneIds\)/);
  assert.match(controllerSource, /AiPlanningExecutionMode\.RoomOnly\)\) return requestChatUiPlan\(chatUiContents, expectedSceneIds\)/);
  assert.match(controllerSource, /return await requestApiPlan\(apiContents, expectedSceneIds\)[\s\S]*return requestChatUiPlan\(chatUiContents, expectedSceneIds\)/);
  assert.match(controllerSource, /return await requestChatUiPlan\(chatUiContents, expectedSceneIds\)[\s\S]*return requestApiPlan\(apiContents, expectedSceneIds\)/);
  assert.match(controllerSource, /forChatUi \? chunkCharactersJson : charactersJson/);
  assert.match(controllerSource, /isCinematicPlanning\s*\? _\.cloneDeep\(sourceScenes\)/);
  assert.match(controllerSource, /isCinematicPlanning \? promptCharacters : _\.filter/);
  assert.match(controllerSource, /forChatUi \? chunkVisualBibleJson : jsonUtils\.safeStringify\(resolvedVisualBible\)/);
  assert.match(controllerSource, /maxItems: CINEMATIC_CHAT_PLANNING_CONFIG\.API_MAX_SOUND_DESIGN_CUES/);
  assert.match(controllerSource, /getCorrectablePlanningIssues[\s\S]*CINEMATIC_CHAT_PLANNING_CONFIG\.MAX_CORRECTION_ATTEMPTS/);
  assert.match(controllerSource, /CINEMATIC_CHAT_PLANNING_CONFIG\.ROOM_RESPONSE_ATTEMPTS/);
  assert.match(controllerSource, /getBlockingCinematicStoryboardContractIssues/);
  assert.match(controllerSource, /getBlockingCinematicPlanningIssues\(planningIssues\)/);
  assert.match(controllerSource, /candidateBlockingCount[\s\S]*currentBlockingCount/);
  assert.match(controllerSource, /chunkSize = isCinematicPlanning \? CINEMATIC_PRODUCTION_POLICY\.PLANNING_CHUNK_SIZE/);
  assert.match(controllerSource, /targetRepairSceneIds[\s\S]*createRepairPrompt\(parsedItems, correctionIssues, targetRepairSceneIds\)/);
  assert.match(controllerSource, /getCinematicVideoPlanningRepairPrompt/);
  assert.match(controllerSource, /planningMasterStoryboard/);
  assert.match(controllerSource, /continuityContext\.masterSequence/);
  assert.match(controllerSource, /exactSceneSet/);
  assert.match(controllerSource, /mergedCandidateItems[\s\S]*candidatePlanningIssues = collectPlanningIssues\(mergedCandidateItems\)/);
  assert.match(controllerSource, /blockedSceneIds[\s\S]*planningPartialStoryboard/);
  assert.match(controllerSource, /storyboard: planningPartialStoryboard/);
};

const verifyPlanningRunIsolation = () => {
  const planningServiceSource = readFileSync(new URL(TEST_CONSTANTS.CHAT_UI_PLANNING_SERVICE_PATH, import.meta.url), "utf8");
  const imageGeneratorSource = readFileSync(new URL(TEST_CONSTANTS.IMAGE_GENERATOR_SERVICE_PATH, import.meta.url), "utf8");
  assert.match(planningServiceSource, /activePlanningControllers = new Map<string, Map<string, ActivePlanningController>>/);
  assert.match(planningServiceSource, /runControllers\.get\(workerId\)\?\.controller\.abort\(\)/);
  assert.match(planningServiceSource, /planningMutexes = new Map<string, SimpleMutex>/);
  assert.match(planningServiceSource, /getPlanningRoomKey\(request\)/);
  assert.match(planningServiceSource, /difference\(expectedSceneIds, returnedSceneIds\)/);
  assert.match(planningServiceSource, /belongsToCurrentRequest\) return latestText/);
  assert.match(planningServiceSource, /closeChatPlanningRoomPage/);
  assert.match(planningServiceSource, /request\.closeRoomOnComplete/);
  assert.match(planningServiceSource, /const roomKey = getPlanningRoomKey\(request\)[\s\S]*rooms\.delete\(roomKey\)[\s\S]*page\.close\(\)/);
  assert.match(planningServiceSource, /finally[\s\S]*await closeChatPlanningRoomPage\(request\)[\s\S]*release\(\)/);
  assert.match(planningServiceSource, /selectGeminiChatModel/);
  assert.match(planningServiceSource, /GEMINI_CHAT_BASE_MODEL_LABELS/);
  assert.match(planningServiceSource, /Thinking level\|Mức tư duy\|Cấp độ tư duy/);
  assert.match(planningServiceSource, /grokBootstrapMutex = new SimpleMutex/);
  assert.match(planningServiceSource, /isGrokSecurityChallengeActive/);
  assert.match(planningServiceSource, /ensureGrokReady\(room, request\)/);
  assert.match(planningServiceSource, /Cloudflare yêu cầu xác minh[\s\S]*page\.bringToFront/);
  assert.match(planningServiceSource, /releaseBootstrap = await grokBootstrapMutex\.acquire\(\)[\s\S]*createRoom[\s\S]*releaseBootstrap\(\)/);
  assert.match(imageGeneratorSource, /activeBrowserLaunchPromise: Promise<BrowserSession> \| null/);
  assert.match(imageGeneratorSource, /if \(activeBrowserLaunchPromise\)[\s\S]*await activeBrowserLaunchPromise/);
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

const verifyCinematicPlanningCheckpointing = () => {
  const pipelineSource = readFileSync(new URL(TEST_CONSTANTS.AUTO_VIDEO_PIPELINE_PATH, import.meta.url), "utf8");
  assert.match(pipelineSource, /scenesToPlan = shouldReuseCompletedPlans \? _.filter\(realScenes, \(scene\) => _.isEmpty\(_.trim\(scene\.generationPrompt\)\)\) : realScenes/);
  assert.match(pipelineSource, /planningBatches = _.chunk\(scenesToPlan, CINEMATIC_POLICY_CONFIG\.PLANNING_CHUNK_SIZE\)/);
  assert.match(pipelineSource, /storyboard: pendingPlanningScenes/);
  assert.match(pipelineSource, /planningMasterStoryboard/);
  assert.match(pipelineSource, /allPlanningIssues/);
  assert.match(pipelineSource, /recovery-\$\{batchIndex\}/);
  assert.match(pipelineSource, /issueSceneIds[\s\S]*pendingPlanningScenes = _.filter\(pendingPlanningScenes/);
  assert.match(pipelineSource, /completedResponseScenes[\s\S]*checkpointCompletedScenes/);
  assert.match(pipelineSource, /PLANNING_WORKER_COUNT[\s\S]*Promise\.all/);
  assert.match(pipelineSource, /if \(!batchResponse\.success && !_\.isEmpty\(responsePlanningIssues\)\)[\s\S]*break;/);
  assert.match(pipelineSource, /checkpointProject[\s\S]*await syncProject\(checkpointProject\)/);
  assert.match(pipelineSource, /checkpointPlanningState = async \(phase: string = "prompt_planning"\)/);
  assert.match(pipelineSource, /phase,\s*\r?\n\s*lastSuccessfulPhase/);
  assert.match(pipelineSource, /prompt_planning_completed/);
  assert.match(pipelineSource, /Đang xử lý/);
};

const runAllVerificationSuites = () => {
  const continuity = verifyVisualContinuity();
  verifyInitialAndApiPlanningPrompts(continuity);
  verifyRepairPromptGeneration(continuity);
  verifyDialogueContractExemption();
  verifyEnvironmentalActionRecognition();
  verifyBlockingContractClassification();
  verifyScopedVisualBibleIsolation();
  verifyPipelineControllerSourceInvariants();
  verifyPlanningRunIsolation();
  verifyCurrentGeminiModelPicker();
  verifyProviderRoomCleanup();
  verifyCinematicPlanningCheckpointing();
  process.stdout.write(TEST_CONSTANTS.SUCCESS_MESSAGE);
};

runAllVerificationSuites();
