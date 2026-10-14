import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import { stringifyJson } from "../src/lib/jsonStringify.js";
import { resolveSourceTextConstants } from "./sourceTextAssertions";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import _ from "lodash";
import { CINEMATIC_CHAT_MODEL_LABELS, CINEMATIC_CHAT_MODEL_OPTIONS, CINEMATIC_CHAT_PLANNING_CONFIG, CINEMATIC_POLICY_CONFIG, GEMINI_CHAT_BASE_MODEL_LABELS, GEMINI_CHAT_THINKING_LEVEL_LABELS, normalizeCinematicArtifactIdentity } from "../src/constants/cinematicConstants";
import { getCinematicVideoPlanningPrompt, getCinematicVideoPlanningRepairPrompt, getCinematicVideoPromptPolicyRepairPrompt, getCinematicVideoPromptRepairPrompt } from "../src/constants/cinematicPrompts";
import { createVisualContinuityContext } from "../src/services/visualContinuityService";
import { createCinematicPlanningBatches, getBlockingCinematicPlanningIssues, getBlockingCinematicStoryboardContractIssues, getCinematicStoryboardContractIssues } from "../src/services/cinematicProductionPolicyService";
import { createScopedVisualBibleContext, getVisualShotPlanIssues } from "../src/services/visualPlanningService";
import { partitionCinematicPlanningResponse } from "../src/services/cinematicPlanningRecoveryService";
import { AiPlanningChatModel, AiPlanningFallbackProvider, type StoryboardScene, type VisualBible } from "../src/types";
import { safeParseJSON } from "../src/server/utils/helpers";
const TEST_CONSTANTS = {
  DEFAULT_CLIP_DURATION_SECONDS: 10,
  LANGUAGE_VIETNAMESE: VT.VIETNAMESE,
  DIRECTIVE_DIALOGUE_REQUIRED: VT.DIALOGUE_IS_REQUIRED_FOR_SC_2,
  PIPELINE_CONTROLLER_PATH: VT.SRC_SERVER_CONTROLLERS_PIPELINECONTROLLER_TS,
  CHAT_UI_PLANNING_SERVICE_PATH: VT.SRC_SERVER_SERVICES_CHATUIPLANNINGSERVICE_TS,
  IMAGE_GENERATOR_SERVICE_PATH: VT.SRC_SERVER_SERVICES_IMAGEGENERATORSERVICE_TS,
  APP_HEADER_PATH: VT.SRC_COMPONENTS_HEADER_TSX,
  AUTO_VIDEO_PIPELINE_PATH: VT.SRC_HOOKS_USEAUTOVIDEOPIPELINE_TS,
  CINEMATIC_CONSTANTS_PATH: VT.SRC_CONSTANTS_CINEMATICCONSTANTS_TS,
  SUCCESS_MESSAGE: VT.CINEMATIC_ROOM_PLANNING_ASSERTIONS_PASSED,
} as const;
const MOCK_PREVIOUS_SCENE = {
  id: VT.SC_1,
  sequenceId: VT.SEQ_1,
  actionEndState: VT.KADE_HOLDS_THE_RIFLE_AT_SHOULDER_HEIGHT_BESIDE_THE_BROKEN_GATE,
  screenDirection: VT.LEFT_TO_RIGHT,
  eyelineDirection: VT.TOWARD_THE_GATE,
  locationState: VT.RAINY_GATE_AT_NIGHT,
  wardrobeState: VT.DARK_FIELD_COAT_RAIN_SOAKED,
  propState: VT.LASER_RIFLE_IN_BOTH_HANDS_INTACT,
} as unknown as StoryboardScene;
const MOCK_CURRENT_SCENE = {
  id: VT.SC_2,
  sequenceId: VT.SEQ_1,
  script: VT.KADE_WARNS_VARG_TO_SURRENDER,
  characterIds: [VT.KADE, VT.VARG],
} as unknown as StoryboardScene;
const MOCK_CHARACTERS = [
  { id: VT.KADE, name: VT.KADE_2 },
  { id: VT.VARG, name: VT.VARG_2 },
];
const MOCK_ENVIRONMENT_ONLY_SCENE = {
  id: VT.SC_ENVIRONMENT,
  sequenceId: VT.SEQ_1,
  shotId: VT.SHOT_ENVIRONMENT,
  shotRole: VT.PAYOFF,
  dialogueMode: VT.SILENT_ACTION,
  characterBlocking: VT.NO_FOREGROUND_CHARACTER,
  eyelineDirection: VT.NOT_APPLICABLE,
  screenDirection: VT.STATIC_AXIS,
  actionStartState: VT.RAIN_FALLS_OVER_THE_EMPTY_GATE,
  actionEndState: VT.THE_GATE_COLLAPSES_INTO_THE_MUD,
  locationState: VT.RAINY_GATE_AT_NIGHT,
  wardrobeState: VT.NOT_APPLICABLE,
  propState: VT.BROKEN_GATE_IN_MUD,
  lipSyncRequired: false,
  soundDesignCues: [VT.RAIN_AND_COLLAPSING_METAL],
  characterIds: [],
  cinematicBeats: [
    {
      sourceSceneId: VT.SC_ENVIRONMENT,
      shotId: VT.A_2,
      shotRole: VT.MASTER,
      visibleAction: VT.RAIN_STRIKES_THE_GATE,
      dialogueMode: VT.SILENT_ACTION,
      spokenDialogue: VT.EMPTY_2,
      speakerCharacterId: VT.EMPTY_2,
      lipSyncRequired: false,
      startSecond: 0,
      endSecond: 3,
    },
    {
      sourceSceneId: VT.SC_ENVIRONMENT,
      shotId: VT.B,
      shotRole: VT.COVERAGE,
      visibleAction: VT.THE_HINGES_BEND_OUTWARD,
      dialogueMode: VT.SILENT_ACTION,
      spokenDialogue: VT.EMPTY_2,
      speakerCharacterId: VT.EMPTY_2,
      lipSyncRequired: false,
      startSecond: 3,
      endSecond: 7,
    },
    {
      sourceSceneId: VT.SC_ENVIRONMENT,
      shotId: VT.C,
      shotRole: VT.PAYOFF,
      visibleAction: VT.THE_GATE_COLLAPSES_INTO_MUD,
      dialogueMode: VT.SILENT_ACTION,
      spokenDialogue: VT.EMPTY_2,
      speakerCharacterId: VT.EMPTY_2,
      lipSyncRequired: false,
      startSecond: 7,
      endSecond: 10,
    },
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
  const serializedScene = stringifyJson([MOCK_CURRENT_SCENE]);
  const serializedCharacters = stringifyJson(MOCK_CHARACTERS);
  const serializedContinuity = stringifyJson(continuity);
  const initialPrompt = getCinematicVideoPlanningPrompt(serializedScene, serializedCharacters, VT.EMPTY_9, serializedContinuity, VT.EMPTY_2, TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS, TEST_CONSTANTS.DIRECTIVE_DIALOGUE_REQUIRED, TEST_CONSTANTS.LANGUAGE_VIETNAMESE);
  assert.match(initialPrompt, /Dialogue is REQUIRED for sc_2/);
  assert.match(initialPrompt, /Language: Vietnamese/);
  assert.match(initialPrompt, /Make all creative and directorial choices yourself/i);
  assert.match(initialPrompt, /at least 4 clearly distinct, connected shots\/camera setups/i);
  assert.match(initialPrompt, /Follow the supplied story and user settings/i);
  assert.match(initialPrompt, /preserve the supplied dialogue exactly once/i);
  assert.match(initialPrompt, /scene has no supplied dialogue, do not invent dialogue or narration/i);
  assert.match(initialPrompt, /Return valid raw JSON only/i);
  assert.match(initialPrompt, /artifactType.*requestId.*generationPrompt.*completionMarker/i);
  assert.doesNotMatch(initialPrompt, /whip-pans|action axis|contact point|decorative spinning|three to five unmistakable anchors/i);
  assert.doesNotMatch(initialPrompt, /application separately compiles|compiler-owned fields/i);
  const apiPrompt = getCinematicVideoPlanningPrompt(serializedScene, serializedCharacters, stringifyJson({ characterSpecs: VT.FULL_API_VISUAL_BIBLE }), serializedContinuity, VT.EMPTY_2, TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS);
  assert.doesNotMatch(apiPrompt, /Dialogue assignment for this request/);
  assert.doesNotMatch(apiPrompt, /Use 1 to 5 concise soundDesignCues/);
  assert.match(apiPrompt, /full API visual bible/);
};
const verifyRepairPromptGeneration = (continuity: Record<string, unknown>) => {
  const repairPrompt = getCinematicVideoPlanningRepairPrompt(stringifyJson([MOCK_CURRENT_SCENE]), stringifyJson([{ id: VT.SC_2, generationPrompt: VT.EMPTY_2 }]), stringifyJson([VT.SC_2_GENERATIONPROMPT_MISSING]), stringifyJson(continuity), TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS, TEST_CONSTANTS.DIRECTIVE_DIALOGUE_REQUIRED, TEST_CONSTANTS.LANGUAGE_VIETNAMESE);
  assert.match(repairPrompt, /sc_2:generationPrompt:missing/);
  assert.match(repairPrompt, /Previous response/);
  assert.match(repairPrompt, /best complete Veo 3 prompt for each 10-second scene/i);
  assert.match(repairPrompt, /at least 4 clearly distinct, connected shots\/camera setups/i);
  assert.match(repairPrompt, /Return the complete corrected raw JSON object only/i);
  assert.doesNotMatch(repairPrompt, /Set layout|hyphenated duration token|deterministically compiles/);
  const policyRepairPrompt = getCinematicVideoPromptPolicyRepairPrompt(VT.A_SAFE_ACTION_PROMPT);
  assert.match(policyRepairPrompt, /change only the unsafe detail and preserve the story, characters, dialogue and creative direction/i);
  const technicalRepairPrompt = getCinematicVideoPromptRepairPrompt(VT.A_FAILED_ACTION_PROMPT, [VT.CONTACT_MISSING], MOCK_CURRENT_SCENE);
  assert.match(technicalRepairPrompt, /Make all creative and directorial choices yourself/i);
  assert.match(technicalRepairPrompt, /at least 4 clearly distinct, connected shots\/camera setups/i);
  assert.doesNotMatch(technicalRepairPrompt, /whip-pans|action axis|exact block or evasion/i);
};
const verifyDialogueContractExemption = () => {
  const contractIssues = getCinematicStoryboardContractIssues([MOCK_ENVIRONMENT_ONLY_SCENE], TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS);
  assert.equal(
    _.some(contractIssues, (issue) => _.includes(issue, VT.DIALOGUE_COVERAGE)),
    false,
  );
};
const verifyEnvironmentalActionRecognition = () => {
  const issues = getVisualShotPlanIssues(
    {
      visualIntent: VT.ESTABLISH_THE_HAZARDOUS_ROUTE,
      visibleAction: VT.TOXIC_DEMONIC_MIST_SWIRLS_THROUGH_THE_CANYON_AND_OBSCURES_THE_PA,
      reaction: VT.THE_ROUTE_DISAPPEARS_BEHIND_THE_MOVING_HAZE,
      storyEvidence: VT.BLACK_VAPOR_GATHERS_BETWEEN_THE_ROCK_WALLS,
      visualHook: VT.THE_CANYON_IS_VISIBLY_SWALLOWED_BY_THE_ADVANCING_MIST,
      composition: VT.LAYERED_CANYON_WALLS_FRAME_THE_MOVING_VAPOR,
    },
    { id: VT.SC_ENVIRONMENT, script: VT.THE_CANYON_IS_COVERED_IN_DEMONIC_MIST } as StoryboardScene,
  );
  assert.equal(
    _.some(issues, (issue) => _.includes(issue, VT.NO_OBSERVABLE_PHYSICAL_VERB)),
    false,
  );
};
const verifyBlockingContractClassification = () => {
  const firstScene = {
    ..._.cloneDeep(MOCK_ENVIRONMENT_ONLY_SCENE),
    id: VT.SC_1,
    screenDirection: VT.LEFT_TO_RIGHT,
  } as StoryboardScene;
  const secondScene = {
    ..._.cloneDeep(MOCK_ENVIRONMENT_ONLY_SCENE),
    id: VT.SC_2,
    continuityFrom: VT.INCORRECT_SCENE,
    actionStartState: VT.A_DIFFERENT_ACTION_STATE,
    screenDirection: VT.RIGHT_TO_LEFT,
  } as StoryboardScene;
  firstScene.generationPrompt = VT.FOCUSED_VEO_PROMPT_FOR_SCENE_ONE;
  secondScene.generationPrompt = VT.FOCUSED_VEO_PROMPT_FOR_SCENE_TWO;
  const advisoryIssues = getCinematicStoryboardContractIssues([firstScene, secondScene], TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS);
  assert.deepEqual(advisoryIssues, []);
  const continuityBlockers = getBlockingCinematicStoryboardContractIssues([firstScene, secondScene], TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS);
  assert.equal(continuityBlockers.includes(VT.SC_2_CONTINUITYFROM_MUST_REFERENCE_PREVIOUS_CLIP), false);
  assert.equal(continuityBlockers.includes(VT.SC_2_ACTIONSTARTSTATE_MUST_MATCH_PREVIOUS_END_STATE), false);
  assert.equal(continuityBlockers.includes(VT.SC_2_SCREENDIRECTION_CONTINUITY_BREAK), false);
  const sceneMissingSound = { ..._.cloneDeep(MOCK_ENVIRONMENT_ONLY_SCENE), generationPrompt: VT.FOCUSED_VEO_PROMPT, soundDesignCues: [] } as StoryboardScene;
  assert.equal(getBlockingCinematicStoryboardContractIssues([sceneMissingSound], TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS).includes(VT.SC_ENVIRONMENT_SOUNDDESIGNCUES_MISSING), false);
  assert.deepEqual(getBlockingCinematicPlanningIssues([VT.SC_2_SCREENDIRECTION_CONTINUITY_BREAK, VT.SC_2_NEIGHBOR_VISUAL_REPETITION, VT.SC_2_EDITORIAL_RHYTHM_SHOTSIZE_REPEATED_THREE_TIMES, VT.SC_2_PROMPT_INCOMPLETE_OR_OUTSIDE_GLOBAL_LENGTH_CONTRACT, VT.SC_2_TEXTOVERLAY_MUST_BE_EMPTY_WHEN_TEXT_FORBIDDEN]), []);
  assert.deepEqual(getBlockingCinematicPlanningIssues([VT.SC_2_GENERATIONPROMPT_MISSING, VT.SC_2_SOUNDDESIGNCUES_INVALID]), [VT.SC_2_GENERATIONPROMPT_MISSING]);
  assert.deepEqual(getBlockingCinematicPlanningIssues([VT.SC_2_CHARACTERIDS_UNKNOWN_VARG, VT.SC_2_ACTIONCHOREOGRAPHY_AFTERMATH_MISSING]), []);
};
const verifyScopedVisualBibleIsolation = () => {
  const mockVisualBible = {
    visualStyle: VT.CINEMATIC,
    characterSpecs: VT.ALL_UNRELATED_CHARACTER_DETAILS,
    locations: [
      { id: VT.LOC_A, name: VT.A, visualAnchors: [], geography: VT.A, timeProgression: VT.DAY },
      { id: VT.LOC_B, name: VT.B_2, visualAnchors: [], geography: VT.B_2, timeProgression: VT.NIGHT },
    ],
    props: [
      { id: VT.PROP_A, name: VT.A, visualAnchors: [], narrativeFunction: VT.A },
      { id: VT.PROP_B, name: VT.B_2, visualAnchors: [], narrativeFunction: VT.B_2 },
    ],
  } as unknown as VisualBible;
  const targetScene = { ...MOCK_CURRENT_SCENE, locationId: VT.LOC_B, propIds: [VT.PROP_B] } as unknown as StoryboardScene;
  const scopedBible = createScopedVisualBibleContext(mockVisualBible, [targetScene]);
  assert.deepEqual(_.map(scopedBible.locations, VT.ID), [VT.LOC_B]);
  assert.deepEqual(_.map(scopedBible.props, VT.ID), [VT.PROP_B]);
  assert.equal(VT.CHARACTERSPECS in scopedBible, false);
};
const verifyPartialBatchSceneRecovery = () => {
  const requestedScenes = _.map([VT.SCENE_010, VT.SCENE_011, VT.SCENE_012], (id) => ({ id, generationPrompt: VT.EMPTY_2 })) as unknown as StoryboardScene[];
  const partialResponse = [
    { id: VT.SCENE_010, generationPrompt: VT.COMPLETE_AI_AUTHORED_PROMPT_FOR_SCENE_TEN },
    { id: VT.SCENE_011, generationPrompt: VT.COMPLETE_AI_AUTHORED_PROMPT_FOR_SCENE_ELEVEN },
  ] as unknown as StoryboardScene[];
  const firstPartition = partitionCinematicPlanningResponse(requestedScenes, partialResponse, [VT.SCENE_012_RESULT_MISSING_SCENE]);
  assert.deepEqual(_.map(firstPartition.completedScenes, VT.ID), [VT.SCENE_010, VT.SCENE_011]);
  assert.deepEqual(_.map(firstPartition.unresolvedScenes, VT.ID), [VT.SCENE_012]);
  const recoveredResponse = [{ id: VT.SCENE_012, generationPrompt: VT.COMPLETE_AI_AUTHORED_PROMPT_FOR_SCENE_TWELVE }] as unknown as StoryboardScene[];
  const recoveredPartition = partitionCinematicPlanningResponse(firstPartition.unresolvedScenes, recoveredResponse, []);
  assert.deepEqual(_.map(recoveredPartition.completedScenes, VT.ID), [VT.SCENE_012]);
  assert.deepEqual(recoveredPartition.unresolvedScenes, []);
};
const verifyPipelineControllerSourceInvariants = () => {
  const controllerSource = resolveSourceTextConstants(readFileSync(new URL(TEST_CONSTANTS.PIPELINE_CONTROLLER_PATH, import.meta.url), VT.UTF8));
  assert.match(controllerSource, /AiPlanningExecutionMode\.ApiOnly\)\) return requestApiPlan\(apiContents, expectedSceneIds\)/);
  assert.match(controllerSource, /AiPlanningExecutionMode\.RoomOnly\)\) return requestChatUiPlan\(chatUiContents, expectedSceneIds\)/);
  assert.match(controllerSource, /return await requestApiPlan\(apiContents, expectedSceneIds\)[\s\S]*return requestChatUiPlan\(chatUiContents, expectedSceneIds\)/);
  assert.match(controllerSource, /return await requestChatUiPlan\(chatUiContents, expectedSceneIds\)[\s\S]*return requestApiPlan\(apiContents, expectedSceneIds\)/);
  assert.match(controllerSource, /const scopedCharactersJson = chunkCharactersJson/);
  assert.match(controllerSource, /let plannedScenes: StoryboardScene\[\] = _\.cloneDeep\(sourceScenes\)/);
  assert.doesNotMatch(controllerSource, /resolveStoryboardCharacterIds/);
  assert.match(controllerSource, /relevantChunkCharacters/);
  assert.match(controllerSource, /_\.pick\(character, \["id", "name", "prompt"\]\)/);
  assert.match(controllerSource, /const scopedVisualBibleJson = chunkVisualBibleJson/);
  assert.match(controllerSource, /createCinematicPlanningProperties/);
  assert.match(controllerSource, /generationPrompt: planningString/);
  assert.match(controllerSource, /if \(isCinematicPlanning\) \{[\s\S]*generationPrompt:missing[\s\S]*return _\.uniq\(issues\)/);
  assert.match(controllerSource, /getCorrectablePlanningIssues[\s\S]*CINEMATIC_CHAT_PLANNING_CONFIG\.MAX_CORRECTION_ATTEMPTS/);
  assert.match(controllerSource, /CINEMATIC_CHAT_PLANNING_CONFIG\.ROOM_RESPONSE_ATTEMPTS/);
  assert.match(controllerSource, /getBlockingCinematicStoryboardContractIssues/);
  assert.match(controllerSource, /chunkSize = isCinematicPlanning \? CINEMATIC_PRODUCTION_POLICY\.PLANNING_CHUNK_SIZE/);
  assert.match(controllerSource, /isCinematicPlanning \? createCinematicPlanningBatches\(planningPayload\)/);
  assert.match(controllerSource, /createRepairPrompt\(parsedItems, correctionIssues, sceneIds\)/);
  assert.match(controllerSource, /getCinematicVideoPlanningRepairPrompt/);
  assert.match(controllerSource, /planningMasterStoryboard/);
  assert.doesNotMatch(controllerSource, /continuityContext\.masterSequence/);
  assert.match(controllerSource, /const parsedScenes = isCinematicPlanning \? _\.get\(parsed, "scenes"\) : parsed/);
  assert.match(controllerSource, /parsedItems = candidateItems/);
  assert.match(controllerSource, /blockedSceneIds[\s\S]*planningPartialStoryboard/);
  assert.match(controllerSource, /storyboard: planningPartialStoryboard/);
};
const verifyPlanningRunIsolation = () => {
  const planningServiceSource = resolveSourceTextConstants(readFileSync(new URL(TEST_CONSTANTS.CHAT_UI_PLANNING_SERVICE_PATH, import.meta.url), VT.UTF8));
  const cinematicConstantsSource = resolveSourceTextConstants(readFileSync(new URL(TEST_CONSTANTS.CINEMATIC_CONSTANTS_PATH, import.meta.url), VT.UTF8));
  const imageGeneratorSource = resolveSourceTextConstants(readFileSync(new URL(TEST_CONSTANTS.IMAGE_GENERATOR_SERVICE_PATH, import.meta.url), VT.UTF8));
  const controllerSource = resolveSourceTextConstants(readFileSync(new URL(TEST_CONSTANTS.PIPELINE_CONTROLLER_PATH, import.meta.url), VT.UTF8));
  assert.match(planningServiceSource, /activePlanningControllers = new Map<string, Map<string, ActivePlanningController>>/);
  assert.match(planningServiceSource, /runControllers\.get\(workerId\)\?\.controller\.abort\(\)/);
  assert.match(planningServiceSource, /planningMutexes = new Map<string, SimpleMutex>/);
  assert.match(planningServiceSource, /getPlanningRoomKey\(request\)/);
  assert.match(planningServiceSource, /difference\(expectedSceneIds, returnedSceneIds\)/);
  assert.match(planningServiceSource, /initialResponseSet = new Set/);
  assert.match(planningServiceSource, /initialResponseIdentitySet = new Set/);
  assert.match(planningServiceSource, /getChatResponseSnapshots/);
  assert.match(planningServiceSource, /responsesNotPresentBeforeSubmission/);
  assert.match(planningServiceSource, /mayUseUnmarkedJsonFallback = _\.isEmpty\(expectedSceneIds\) && _\.isEmpty\(completionMarker\)[\s\S]{0,150}_\.isEmpty\(artifactType\) && _\.isEmpty\(normalizedExpectedRequestId\) && isCompleteJson/);
  assert.match(planningServiceSource, /belongsToCurrentRequest \|\| mayUseUnmarkedJsonFallback/);
  assert.match(planningServiceSource, /closeChatPlanningRoom/);
  assert.match(planningServiceSource, /request\.closeRoomOnComplete/);
  assert.match(planningServiceSource, /pendingRoomResponses = new Map<string, PendingRoomResponse>/);
  assert.match(planningServiceSource, /RESPONSE_RESUME_LOG/);
  assert.match(planningServiceSource, /if \(responseProgressed \|\| isBusy\)/);
  assert.match(planningServiceSource, /responseCompleted && \(request\.closeRoomOnComplete/);
  assert.match(cinematicConstantsSource, /CLOSE_ROOM_ON_COMPLETE:\s*false/);
  assert.match(planningServiceSource, /if \(!isResponseTimeoutError\(error\)\) pendingRoomResponses\.delete\(roomKey\)/);
  assert.match(planningServiceSource, /CLOSED_ROOM_ERROR_PATTERN\.test\(errorMessage\)/);
  assert.match(planningServiceSource, /canRecoverClosedRoom[\s\S]*await closeChatPlanningRoom\(request\)/);
  assert.match(planningServiceSource, /const roomKey = getPlanningRoomKey\(request\)[\s\S]*rooms\.delete\(roomKey\)[\s\S]*page\.close\(\)/);
  assert.match(planningServiceSource, /const createRoom[\s\S]*rooms\.set\(projectId, page\)[\s\S]*catch \(error\)[\s\S]*rooms\.delete\(projectId\)[\s\S]*page\.close\(\)/);
  assert.match(planningServiceSource, /finally[\s\S]*await closeChatPlanningRoom\(request\)[\s\S]*release\(\)/);
  assert.match(planningServiceSource, /MODEL_PICKER_TIMEOUT_MS/);
  assert.match(planningServiceSource, /hasRequiredCompletionMarker/);
  assert.match(planningServiceSource, /hasRequiredArtifactIdentity/);
  assert.match(planningServiceSource, /isCompleteJson && !_.isEmpty\(responseCandidates\) && stablePolls >= CINEMATIC_CHAT_PLANNING_CONFIG\.INVALID_RESPONSE_STABLE_POLLS/);
  assert.match(planningServiceSource, /configuredSendButton = page\.locator\(sendSelector\)\.filter\(\{ visible: true \}\)\.last\(\)/);
  assert.match(planningServiceSource, /semanticSendButton[\s\S]*getByRole/);
  assert.match(controllerSource, /keepPlanningRoomOpen = req\.body\?\.keepPlanningRoomOpen !== false/);
  assert.match(controllerSource, /res\.once\("finish"[\s\S]*closePlanningRoom/);
  assert.match(planningServiceSource, /selectGeminiChatModel/);
  assert.match(planningServiceSource, /GEMINI_CHAT_BASE_MODEL_LABELS/);
  assert.match(cinematicConstantsSource, /Thinking level\|Mức tư duy\|Cấp độ tư duy/);
  assert.match(planningServiceSource, /THINKING_LEVEL_NAME_PATTERN/);
  assert.match(planningServiceSource, /grokBootstrapMutexes = new WeakMap<BrowserContext, SimpleMutex>/);
  assert.match(planningServiceSource, /getGrokBootstrapMutex\(browser\.context\)\.acquire\(\)/);
  assert.match(planningServiceSource, /isGrokSecurityChallengeActive/);
  assert.match(planningServiceSource, /ensureGrokReady\(room, request\)/);
  assert.match(planningServiceSource, /CLOUDFLARE_CHALLENGE_NOTICE[\s\S]*page\.bringToFront/);
  assert.match(planningServiceSource, /releaseBootstrap = await getGrokBootstrapMutex\(browser\.context\)\.acquire\(\)[\s\S]*createRoom[\s\S]*releaseBootstrap\(\)/);
  const grokReadinessSource = planningServiceSource.match(/const ensureGrokReady[\s\S]*?const ensureChatGptReady/)?.[0] || VT.EMPTY_2;
  assert.match(grokReadinessSource, /GROK_READY_STABLE_POLLS/);
  assert.match(grokReadinessSource, /GROK_POST_CHALLENGE_READY_STABLE_POLLS/);
  assert.match(planningServiceSource, /const browser = await getOrLaunchGrokBrowser\(request\.chromeHeadless\)/);
  assert.match(grokReadinessSource, /challengeActiveLastPoll/);
  assert.match(grokReadinessSource, /grokReadyContexts\.delete\(context\)/);
  assert.doesNotMatch(grokReadinessSource, /page\.(?:goto|reload)\(/);
  assert.match(planningServiceSource, /input\.isEditable\(\)/);
  assert.equal(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_POLL_MS, 250);
  assert.equal(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_STABLE_POLLS, 20);
  assert(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_MAX_TIMEOUT_MS > CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_MS);
  assert.match(CINEMATIC_CHAT_PLANNING_CONFIG.JSON_ONLY_DIRECTIVE, /parseable directly with JSON\.parse/i);
  assert.match(planningServiceSource, /belongsToCurrentRequest \|\| mayUseUnmarkedJsonFallback/);
  assert.match(planningServiceSource, /stablePolls, CINEMATIC_CHAT_PLANNING_CONFIG\.RESPONSE_STABLE_POLLS/);
  assert.match(planningServiceSource, /pendingRoomResponses\.set\(roomKey,[\s\S]*if \(!submissionConfirmed\)/);
  assert.match(planningServiceSource, /const parsedLatest = parseStrictRoomJson\(latestText\)/);
  assert.match(planningServiceSource, /const trimmed = _\.trim\(text\)/);
  assert.match(planningServiceSource, /return parseJson\(trimmed\)/);
  assert.match(planningServiceSource, /INVALID_JSON_RESPONSE_ERROR/);
  assert.match(planningServiceSource, /PLANNING_QUEUE_ACQUIRED/);
  assert.match(planningServiceSource, /GROK_CHALLENGE_FRAME_SELECTOR\)[\s\S]*filter\(\{ visible: true \}\)/);
  assert.match(planningServiceSource, /challengeBodyVisible = !chatReady/);
  assert.match(imageGeneratorSource, /activeBrowserLaunchPromise: Promise<BrowserSession> \| null/);
  assert.match(imageGeneratorSource, /if \(activeBrowserLaunchPromise\)[\s\S]*await activeBrowserLaunchPromise/);
  assert.match(imageGeneratorSource, /grokBrowserLaunchPromise: Promise<\{ context: BrowserContext; page: Page;? \}> \| null/);
  assert.match(imageGeneratorSource, /waitForVisibleGrokVerificationBeforeAutomation/);
  assert.match(imageGeneratorSource, /if \(chromeHeadless === false\) await waitForVisibleGrokVerificationBeforeAutomation\(\)/);
  assert.match(imageGeneratorSource, /EXTERNAL_URLS\.GROK_CHAT[,)]/);
  const grokLaunchSource = imageGeneratorSource.match(/const launchNativeGrokBrowser[\s\S]*?export const getOrLaunchGrokBrowser/)?.[0] || VT.EMPTY_2;
  assert.doesNotMatch(grokLaunchSource, /EXTERNAL_URLS\.GROK_IMAGINE/);
  assert.match(grokLaunchSource, /waitForGrokChrome\(\)[\s\S]*waitForVisibleGrokVerificationBeforeAutomation\(\)[\s\S]*chromium\.connectOverCDP/);
  const grokPreconnectSource = imageGeneratorSource.match(/const waitForVisibleGrokVerificationBeforeAutomation[\s\S]*?const launchNativeGrokBrowser/)?.[0] || VT.EMPTY_2;
  assert.doesNotMatch(grokPreconnectSource, /page\.(?:goto|reload)\(|chromium\.connectOverCDP/);
  assert.doesNotMatch(planningServiceSource, /activePlanningController\?\.abort\(\)/);
};
const verifyCurrentGeminiModelPicker = () => {
  assert.deepEqual(_.map(CINEMATIC_CHAT_MODEL_OPTIONS[AiPlanningFallbackProvider.GeminiChat], VT.LABEL), [VT.VALUE_3_5_FLASH_LITE, VT.VALUE_3_8_FLASH, VT.VALUE_3_1_PRO, VT.VALUE_4_ARGON, VT.PRO_TU_DUY_MO_RONG, VT.PRO_DEEP_THINK]);
  assert(CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiFlashLite].test(VT.GEMINI_3_5_FLASH_LITE));
  assert(CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiFlash].test(VT.GEMINI_3_8_FLASH));
  assert(CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiPro].test(VT.GEMINI_3_1_PRO));
  assert(CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiArgon].test(VT.VALUE_4_ARGON_NHIEM_VU_PHUC_TAP_MOI));
  assert(CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiArgon].test(VT.GEMINI_4_ARGON_CAO));
  assert(GEMINI_CHAT_BASE_MODEL_LABELS[AiPlanningChatModel.GeminiArgon]?.test(VT.ARGON_HIGH));
  assert(!CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiArgon].test(VT.VALUE_3_8_FLASH_CAO));
  assert(!CINEMATIC_CHAT_MODEL_LABELS[AiPlanningChatModel.GeminiFlash].test(VT.VALUE_3_5_FLASH_LITE));
  assert(GEMINI_CHAT_BASE_MODEL_LABELS[AiPlanningChatModel.GeminiDeepThink]?.test(VT.PRO));
  assert(GEMINI_CHAT_THINKING_LEVEL_LABELS[AiPlanningChatModel.GeminiThinking]?.test(VT.EXTENDED_THINKING));
  assert(GEMINI_CHAT_THINKING_LEVEL_LABELS[AiPlanningChatModel.GeminiDeepThink]?.test(VT.DEEP_THINK));
  assert(CINEMATIC_CHAT_PLANNING_CONFIG.GROK_CHALLENGE_TEXT_PATTERN.test(VT.PERFORMING_SECURITY_VERIFICATION));
  assert(CINEMATIC_CHAT_PLANNING_CONFIG.GROK_CHALLENGE_TEXT_PATTERN.test(VT.VERIFY_YOU_ARE_HUMAN));
};
const verifyProviderRoomCleanup = () => {
  const planningServiceSource = resolveSourceTextConstants(readFileSync(new URL(TEST_CONSTANTS.CHAT_UI_PLANNING_SERVICE_PATH, import.meta.url), VT.UTF8));
  const headerSource = resolveSourceTextConstants(readFileSync(new URL(TEST_CONSTANTS.APP_HEADER_PATH, import.meta.url), VT.UTF8));
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
  const parsed = safeParseJSON(VT.REQUESTID_ROOM_JSON_TEST_VIDEO_PROMPTS, {});
  assert.equal(normalizeCinematicArtifactIdentity(parsed.requestId), VT.ROOM_JSON_TEST_VIDEO_PROMPTS);
  assert.equal(safeParseJSON(VT.JSON_REQUESTID_ROOM_JSON_TEST_VIDEO_PROMPTS, {}).requestId, VT.ROOM_JSON_TEST_VIDEO_PROMPTS);
  assert.equal(safeParseJSON(VT.HERE_IS_THE_RESULT_REQUESTID_ROOM_JSON_TEST_VIDEO_PROMPTS, {}).requestId, VT.ROOM_JSON_TEST_VIDEO_PROMPTS);
  assert.equal(safeParseJSON(VT.REQUESTID_BROKEN_ARTIFACTTYPE_MUSIC_STYLE_ANALYSIS_REQUESTID_MUS, {}).requestId, VT.MUSIC_OK);
  assert.equal(safeParseJSON(VT.REQUESTID_OLD_ARTIFACTTYPE_MUSIC_REFERENCE_SOURCE_REQUESTID_SOUR, {}).requestId, VT.SOURCE_NEW);
  assert.equal(safeParseJSON(VT.LYRICS_VERSE_DONG_MOT_DONG_HAI, {}).lyrics, VT.VERSE_DONG_MOT_DONG_HAI);
  assert.equal(safeParseJSON(VT.SONGS_TITLE_CO_DAU, {}).songs[0].title, VT.CO_DAU);
  const invalidSamples = [VT.REQUESTID_ROOM_JSON_TEST_VIDEO_PROMPTS_SCENES_ID_SCENE_001_GENER];
  _.forEach(invalidSamples, (sample) => assert.throws(() => safeParseJSON(sample, {}), /invalid_ai_json_response|Dữ liệu phản hồi AI không hợp lệ|Invalid AI response structure/));
};
const verifyCinematicPlanningCheckpointing = () => {
  const pipelineSource = resolveSourceTextConstants(readFileSync(new URL(TEST_CONSTANTS.AUTO_VIDEO_PIPELINE_PATH, import.meta.url), VT.UTF8));
  assert.match(pipelineSource, /generationPromptProfileVersion, CINEMATIC_VIDEO_PROMPT_PROFILE_VERSION/);
  assert.match(pipelineSource, /!hasSceneAsset\(scene\).*generationPromptProfileVersion/s);
  assert.match(pipelineSource, /planningBatches = createCinematicPlanningBatches\(scenesToPlan\)/);
  assert.match(pipelineSource, /storyboard: pendingPlanningScenes/);
  assert.match(pipelineSource, /planningMasterStoryboard/);
  assert.match(pipelineSource, /allPlanningIssues/);
  assert.doesNotMatch(pipelineSource, /recovery-\$\{batchIndex\}/);
  assert.match(pipelineSource, /const planningWorkerId = CINEMATIC_ROOM_STAGE\.PROMPT/);
  assert.match(pipelineSource, /partitionCinematicPlanningResponse\(requestedScenes, responseScenes, responsePlanningIssues\)/);
  assert.doesNotMatch(pipelineSource, /if \(!response\.success\) return requestedScenes/);
  assert.match(pipelineSource, /if \(_\.isEmpty\(responseScenes\)\) return requestedScenes/);
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
  assert.match(pipelineSource, /latestPlanningMasterStoryboard/);
  assert.match(pipelineSource, /firstPendingSceneIndex/);
  assert.match(pipelineSource, /const latestProject = activeProjectSnapshotRef\.current \|\| currentProject/);
  assert.match(pipelineSource, /const pipelineArtifactRunId =/);
  assert.match(pipelineSource, /presentationTarget\?\.lastRunId/);
  assert.match(pipelineSource, /pipelineRunId: pipelineArtifactRunId/);
  assert.match(pipelineSource, /retainPlanningRoomsForResume =/);
  assert.match(pipelineSource, /!retainPlanningRoomsForResume &&/);
  assert.doesNotMatch(pipelineSource, /closeCompletedPlanningWorkers\(\[CINEMATIC_ROOM_STAGE\.(?:SCRIPT|PROMPT|THUMBNAIL)\]\)/);
  assert.match(pipelineSource, /pipelineCompleted &&[\s\S]*PIPELINE_CLOSE_CHAT_PLANNING_ROOMS/);
};
const verifyLongFilmPlanningBatches = () => {
  const twentyMinuteScenes = _.map(_.range(120), (index) => ({
    id: `${VT.SCENE_2}${_.padStart(_.toString(index + 1), 3, VT.VALUE_0)}`,
    script: `${VT.STORY_BEAT}${index + 1}`,
    generationPrompt: VT.EMPTY_2,
  }));
  const batches = createCinematicPlanningBatches(twentyMinuteScenes);
  assert.equal(_.sumBy(batches, VT.LENGTH), twentyMinuteScenes.length);
  assert.equal(batches.length, _.ceil(_.divide(twentyMinuteScenes.length, CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_SIZE)));
  assert(_.every(batches, (batch) => _.lte(batch.length, CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_SIZE)));
  const largeScenes = _.map(_.range(4), (index) => ({ id: `${VT.LARGE}${index}`, script: VT.X.repeat(9000) }));
  const sizeBoundBatches = createCinematicPlanningBatches(largeScenes);
  assert(_.gt(sizeBoundBatches.length, 1));
  assert.deepEqual(_.flatten(sizeBoundBatches), largeScenes);
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
  verifyLongFilmPlanningBatches();
  process.stdout.write(TEST_CONSTANTS.SUCCESS_MESSAGE);
};
runAllVerificationSuites();
