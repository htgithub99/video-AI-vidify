import { MOTION_VERIFICATION_TEXTS as VT, CINEMATIC_VERIFICATION_PATTERNS as CP } from "./motionVerificationTexts.js";
import { GEMINI_MODEL_ENCODING } from "../src/constants/geminiChatModels.js";
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
const MOCK_PREVIOUS_SCENE = { id: VT.SC_1, sequenceId: VT.SEQ_1, actionEndState: VT.KADE_HOLDS_THE_RIFLE_AT_SHOULDER_HEIGHT_BESIDE_THE_BROKEN_GATE, screenDirection: VT.LEFT_TO_RIGHT, eyelineDirection: VT.TOWARD_THE_GATE, locationState: VT.RAINY_GATE_AT_NIGHT, wardrobeState: VT.DARK_FIELD_COAT_RAIN_SOAKED, propState: VT.LASER_RIFLE_IN_BOTH_HANDS_INTACT } as unknown as StoryboardScene;
const MOCK_CURRENT_SCENE = { id: VT.SC_2, sequenceId: VT.SEQ_1, script: VT.KADE_WARNS_VARG_TO_SURRENDER, characterIds: [VT.KADE, VT.VARG] } as unknown as StoryboardScene;
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
    { sourceSceneId: VT.SC_ENVIRONMENT, shotId: VT.A_2, shotRole: VT.MASTER, visibleAction: VT.RAIN_STRIKES_THE_GATE, dialogueMode: VT.SILENT_ACTION, spokenDialogue: VT.EMPTY_2, speakerCharacterId: VT.EMPTY_2, lipSyncRequired: false, startSecond: 0, endSecond: 3 },
    { sourceSceneId: VT.SC_ENVIRONMENT, shotId: VT.B, shotRole: VT.COVERAGE, visibleAction: VT.THE_HINGES_BEND_OUTWARD, dialogueMode: VT.SILENT_ACTION, spokenDialogue: VT.EMPTY_2, speakerCharacterId: VT.EMPTY_2, lipSyncRequired: false, startSecond: 3, endSecond: 7 },
    { sourceSceneId: VT.SC_ENVIRONMENT, shotId: VT.C, shotRole: VT.PAYOFF, visibleAction: VT.THE_GATE_COLLAPSES_INTO_MUD, dialogueMode: VT.SILENT_ACTION, spokenDialogue: VT.EMPTY_2, speakerCharacterId: VT.EMPTY_2, lipSyncRequired: false, startSecond: 7, endSecond: 10 },
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
  assert.match(initialPrompt, CP.DIALOGUE_IS_REQUIRED_FOR_SC_2);
  assert.match(initialPrompt, CP.LANGUAGE_VIETNAMESE);
  assert.match(initialPrompt, CP.MAKE_ALL_CREATIVE_AND_DIRECTORIAL_CHOICES_YOURSELF_I);
  assert.match(initialPrompt, CP.AT_LEAST_4_CLEARLY_DISTINCT_CONNECTED_SHOTS_CAMERA_SETUPS_I);
  assert.match(initialPrompt, CP.FOLLOW_THE_SUPPLIED_STORY_AND_USER_SETTINGS_I);
  assert.match(initialPrompt, CP.PRESERVE_THE_SUPPLIED_DIALOGUE_EXACTLY_ONCE_I);
  assert.match(initialPrompt, CP.SCENE_HAS_NO_SUPPLIED_DIALOGUE_DO_NOT_INVENT_DIALOGUE_OR_NARRATION_I);
  assert.match(initialPrompt, CP.RETURN_VALID_RAW_JSON_ONLY_I);
  assert.match(initialPrompt, CP.ARTIFACTTYPE_REQUESTID_GENERATIONPROMPT_COMPLETIONMARKER_I);
  assert.doesNotMatch(initialPrompt, CP.WHIP_PANS_ACTION_AXIS_CONTACT_POINT_DECORATIVE_SPINNING_THREE_TO_FIVE_UNMISTAK);
  assert.doesNotMatch(initialPrompt, CP.APPLICATION_SEPARATELY_COMPILES_COMPILER_OWNED_FIELDS_I);
  const apiPrompt = getCinematicVideoPlanningPrompt(serializedScene, serializedCharacters, stringifyJson({ characterSpecs: VT.FULL_API_VISUAL_BIBLE }), serializedContinuity, VT.EMPTY_2, TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS);
  assert.doesNotMatch(apiPrompt, CP.DIALOGUE_ASSIGNMENT_FOR_THIS_REQUEST);
  assert.doesNotMatch(apiPrompt, CP.USE_1_TO_5_CONCISE_SOUNDDESIGNCUES);
  assert.match(apiPrompt, CP.FULL_API_VISUAL_BIBLE);
};
const verifyRepairPromptGeneration = (continuity: Record<string, unknown>) => {
  const repairPrompt = getCinematicVideoPlanningRepairPrompt(stringifyJson([MOCK_CURRENT_SCENE]), stringifyJson([{ id: VT.SC_2, generationPrompt: VT.EMPTY_2 }]), stringifyJson([VT.SC_2_GENERATIONPROMPT_MISSING]), stringifyJson(continuity), TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS, TEST_CONSTANTS.DIRECTIVE_DIALOGUE_REQUIRED, TEST_CONSTANTS.LANGUAGE_VIETNAMESE);
  assert.match(repairPrompt, CP.SC_2_GENERATIONPROMPT_MISSING);
  assert.match(repairPrompt, CP.PREVIOUS_RESPONSE);
  assert.match(repairPrompt, CP.BEST_COMPLETE_VEO_3_PROMPT_FOR_EACH_10_SECOND_SCENE_I);
  assert.match(repairPrompt, CP.AT_LEAST_4_CLEARLY_DISTINCT_CONNECTED_SHOTS_CAMERA_SETUPS_I);
  assert.match(repairPrompt, CP.RETURN_THE_COMPLETE_CORRECTED_RAW_JSON_OBJECT_ONLY_I);
  assert.doesNotMatch(repairPrompt, CP.SET_LAYOUT_HYPHENATED_DURATION_TOKEN_DETERMINISTICALLY_COMPILES);
  const policyRepairPrompt = getCinematicVideoPromptPolicyRepairPrompt(VT.A_SAFE_ACTION_PROMPT);
  assert.match(policyRepairPrompt, CP.CHANGE_ONLY_THE_UNSAFE_DETAIL_AND_PRESERVE_THE_STORY_CHARACTERS_DIALOGUE_AND_C);
  const technicalRepairPrompt = getCinematicVideoPromptRepairPrompt(VT.A_FAILED_ACTION_PROMPT, [VT.CONTACT_MISSING], MOCK_CURRENT_SCENE);
  assert.match(technicalRepairPrompt, CP.MAKE_ALL_CREATIVE_AND_DIRECTORIAL_CHOICES_YOURSELF_I);
  assert.match(technicalRepairPrompt, CP.AT_LEAST_4_CLEARLY_DISTINCT_CONNECTED_SHOTS_CAMERA_SETUPS_I);
  assert.doesNotMatch(technicalRepairPrompt, CP.WHIP_PANS_ACTION_AXIS_EXACT_BLOCK_OR_EVASION_I);
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
    { visualIntent: VT.ESTABLISH_THE_HAZARDOUS_ROUTE, visibleAction: VT.TOXIC_DEMONIC_MIST_SWIRLS_THROUGH_THE_CANYON_AND_OBSCURES_THE_PA, reaction: VT.THE_ROUTE_DISAPPEARS_BEHIND_THE_MOVING_HAZE, storyEvidence: VT.BLACK_VAPOR_GATHERS_BETWEEN_THE_ROCK_WALLS, visualHook: VT.THE_CANYON_IS_VISIBLY_SWALLOWED_BY_THE_ADVANCING_MIST, composition: VT.LAYERED_CANYON_WALLS_FRAME_THE_MOVING_VAPOR },
    { id: VT.SC_ENVIRONMENT, script: VT.THE_CANYON_IS_COVERED_IN_DEMONIC_MIST } as StoryboardScene,
  );
  assert.equal(
    _.some(issues, (issue) => _.includes(issue, VT.NO_OBSERVABLE_PHYSICAL_VERB)),
    false,
  );
};
const verifyBlockingContractClassification = () => {
  const firstScene = { ..._.cloneDeep(MOCK_ENVIRONMENT_ONLY_SCENE), id: VT.SC_1, screenDirection: VT.LEFT_TO_RIGHT } as StoryboardScene;
  const secondScene = { ..._.cloneDeep(MOCK_ENVIRONMENT_ONLY_SCENE), id: VT.SC_2, continuityFrom: VT.INCORRECT_SCENE, actionStartState: VT.A_DIFFERENT_ACTION_STATE, screenDirection: VT.RIGHT_TO_LEFT } as StoryboardScene;
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
  assert.match(controllerSource, CP.AIPLANNINGEXECUTIONMODE_APIONLY_RETURN_REQUESTAPIPLAN_APICONTENTS_EXPECTEDSCEN);
  assert.match(controllerSource, CP.AIPLANNINGEXECUTIONMODE_ROOMONLY_RETURN_REQUESTCHATUIPLAN_CHATUICONTENTS_EXPEC);
  assert.match(controllerSource, CP.RETURN_AWAIT_REQUESTAPIPLAN_APICONTENTS_EXPECTEDSCENEIDS_S_S_RETURN_REQUESTCHA);
  assert.match(controllerSource, CP.RETURN_AWAIT_REQUESTCHATUIPLAN_CHATUICONTENTS_EXPECTEDSCENEIDS_S_S_RETURN_REQU);
  assert.match(controllerSource, CP.CONST_SCOPEDCHARACTERSJSON_CHUNKCHARACTERSJSON);
  assert.match(controllerSource, CP.LET_PLANNEDSCENES_STORYBOARDSCENE_CLONEDEEP_SOURCESCENES);
  assert.doesNotMatch(controllerSource, CP.RESOLVESTORYBOARDCHARACTERIDS);
  assert.match(controllerSource, CP.RELEVANTCHUNKCHARACTERS);
  assert.match(controllerSource, CP.PICK_CHARACTER_ID_NAME_PROMPT);
  assert.match(controllerSource, CP.CONST_SCOPEDVISUALBIBLEJSON_CHUNKVISUALBIBLEJSON);
  assert.match(controllerSource, CP.CREATECINEMATICPLANNINGPROPERTIES);
  assert.match(controllerSource, CP.GENERATIONPROMPT_PLANNINGSTRING);
  assert.match(controllerSource, CP.IF_ISCINEMATICPLANNING_S_S_GENERATIONPROMPT_MISSING_S_S_RETURN_UNIQ_ISSUES);
  assert.match(controllerSource, CP.GETCORRECTABLEPLANNINGISSUES_S_S_CINEMATIC_CHAT_PLANNING_CONFIG_MAX_CORRECTION);
  assert.match(controllerSource, CP.CINEMATIC_CHAT_PLANNING_CONFIG_ROOM_RESPONSE_ATTEMPTS);
  assert.match(controllerSource, CP.GETBLOCKINGCINEMATICSTORYBOARDCONTRACTISSUES);
  assert.match(controllerSource, CP.CHUNKSIZE_ISCINEMATICPLANNING_CINEMATIC_PRODUCTION_POLICY_PLANNING_CHUNK_SIZE);
  assert.match(controllerSource, CP.ISCINEMATICPLANNING_CREATECINEMATICPLANNINGBATCHES_PLANNINGPAYLOAD);
  assert.match(controllerSource, CP.CREATEREPAIRPROMPT_PARSEDITEMS_CORRECTIONISSUES_SCENEIDS);
  assert.match(controllerSource, CP.GETCINEMATICVIDEOPLANNINGREPAIRPROMPT);
  assert.match(controllerSource, CP.PLANNINGMASTERSTORYBOARD);
  assert.doesNotMatch(controllerSource, CP.CONTINUITYCONTEXT_MASTERSEQUENCE);
  assert.match(controllerSource, CP.CONST_PARSEDSCENES_ISCINEMATICPLANNING_GET_PARSED_SCENES_PARSED);
  assert.match(controllerSource, CP.PARSEDITEMS_CANDIDATEITEMS);
  assert.match(controllerSource, CP.BLOCKEDSCENEIDS_S_S_PLANNINGPARTIALSTORYBOARD);
  assert.match(controllerSource, CP.STORYBOARD_PLANNINGPARTIALSTORYBOARD);
};
const verifyPlanningRunIsolation = () => {
  const planningServiceSource = resolveSourceTextConstants(readFileSync(new URL(TEST_CONSTANTS.CHAT_UI_PLANNING_SERVICE_PATH, import.meta.url), VT.UTF8));
  const cinematicConstantsSource = resolveSourceTextConstants(readFileSync(new URL(TEST_CONSTANTS.CINEMATIC_CONSTANTS_PATH, import.meta.url), VT.UTF8));
  const imageGeneratorSource = resolveSourceTextConstants(readFileSync(new URL(TEST_CONSTANTS.IMAGE_GENERATOR_SERVICE_PATH, import.meta.url), VT.UTF8));
  const controllerSource = resolveSourceTextConstants(readFileSync(new URL(TEST_CONSTANTS.PIPELINE_CONTROLLER_PATH, import.meta.url), VT.UTF8));
  assert.match(planningServiceSource, CP.ACTIVEPLANNINGCONTROLLERS_NEW_MAP_STRING_MAP_STRING_ACTIVEPLANNINGCONTROLLER);
  assert.match(planningServiceSource, CP.RUNCONTROLLERS_GET_WORKERID_CONTROLLER_ABORT);
  assert.match(planningServiceSource, CP.PLANNINGMUTEXES_NEW_MAP_STRING_SIMPLEMUTEX);
  assert.match(planningServiceSource, CP.GETPLANNINGROOMKEY_REQUEST);
  assert.match(planningServiceSource, CP.DIFFERENCE_EXPECTEDSCENEIDS_RETURNEDSCENEIDS);
  assert.match(planningServiceSource, CP.INITIALRESPONSESET_NEW_SET);
  assert.match(planningServiceSource, CP.INITIALRESPONSEIDENTITYSET_NEW_SET);
  assert.match(planningServiceSource, CP.GETCHATRESPONSESNAPSHOTS);
  assert.match(planningServiceSource, CP.RESPONSESNOTPRESENTBEFORESUBMISSION);
  assert.match(planningServiceSource, CP.MAYUSEUNMARKEDJSONFALLBACK_ISEMPTY_EXPECTEDSCENEIDS_ISEMPTY_COMPLETIONMARKER_S);
  assert.match(planningServiceSource, CP.BELONGSTOCURRENTREQUEST_MAYUSEUNMARKEDJSONFALLBACK);
  assert.match(planningServiceSource, CP.CLOSECHATPLANNINGROOM);
  assert.match(planningServiceSource, CP.REQUEST_CLOSEROOMONCOMPLETE);
  assert.match(planningServiceSource, CP.PENDINGROOMRESPONSES_NEW_MAP_STRING_PENDINGROOMRESPONSE);
  assert.match(planningServiceSource, CP.RESPONSE_RESUME_LOG);
  assert.match(planningServiceSource, CP.IF_RESPONSEPROGRESSED_ISBUSY);
  assert.match(planningServiceSource, CP.RESPONSECOMPLETED_REQUEST_CLOSEROOMONCOMPLETE);
  assert.match(cinematicConstantsSource, CP.CLOSE_ROOM_ON_COMPLETE_S_FALSE);
  assert.match(planningServiceSource, CP.IF_ISRESPONSETIMEOUTERROR_ERROR_PENDINGROOMRESPONSES_DELETE_ROOMKEY);
  assert.match(planningServiceSource, CP.CLOSED_ROOM_ERROR_PATTERN_TEST_ERRORMESSAGE);
  assert.match(planningServiceSource, CP.CANRECOVERCLOSEDROOM_S_S_AWAIT_CLOSECHATPLANNINGROOM_REQUEST);
  assert.match(planningServiceSource, CP.CONST_ROOMKEY_GETPLANNINGROOMKEY_REQUEST_S_S_ROOMS_DELETE_ROOMKEY_S_S_PAGE_CLO);
  assert.match(planningServiceSource, CP.CONST_CREATEROOM_S_S_ROOMS_SET_PROJECTID_PAGE_S_S_CATCH_ERROR_S_S_ROOMS_DELETE);
  assert.match(planningServiceSource, CP.FINALLY_S_S_AWAIT_CLOSECHATPLANNINGROOM_REQUEST_S_S_RELEASE);
  assert.match(planningServiceSource, CP.MODEL_PICKER_TIMEOUT_MS);
  assert.match(planningServiceSource, CP.HASREQUIREDCOMPLETIONMARKER);
  assert.match(planningServiceSource, CP.HASREQUIREDARTIFACTIDENTITY);
  assert.match(planningServiceSource, CP.ISCOMPLETEJSON_ISEMPTY_RESPONSECANDIDATES_STABLEPOLLS_CINEMATIC_CHAT_PLANNING_);
  assert.match(planningServiceSource, CP.CONFIGUREDSENDBUTTON_PAGE_LOCATOR_SENDSELECTOR_FILTER_VISIBLE_TRUE_LAST);
  assert.match(planningServiceSource, CP.SEMANTICSENDBUTTON_S_S_GETBYROLE);
  assert.match(controllerSource, CP.KEEPPLANNINGROOMOPEN_REQ_BODY_KEEPPLANNINGROOMOPEN_FALSE);
  assert.match(controllerSource, CP.RES_ONCE_FINISH_S_S_CLOSEPLANNINGROOM);
  assert.match(planningServiceSource, CP.SELECTGEMINICHATMODEL);
  assert.match(planningServiceSource, CP.GEMINI_CHAT_BASE_MODEL_LABELS);
  assert.match(cinematicConstantsSource, CP.THINKING_LEVEL_M_C_T_DUY_C_P_T_DUY);
  assert.match(planningServiceSource, CP.THINKING_LEVEL_NAME_PATTERN);
  assert.match(planningServiceSource, CP.GROKBOOTSTRAPMUTEXES_NEW_WEAKMAP_BROWSERCONTEXT_SIMPLEMUTEX);
  assert.match(planningServiceSource, CP.GETGROKBOOTSTRAPMUTEX_BROWSER_CONTEXT_ACQUIRE);
  assert.match(planningServiceSource, CP.ISGROKSECURITYCHALLENGEACTIVE);
  assert.match(planningServiceSource, CP.ENSUREGROKREADY_ROOM_REQUEST);
  assert.match(planningServiceSource, CP.CLOUDFLARE_CHALLENGE_NOTICE_S_S_PAGE_BRINGTOFRONT);
  assert.match(planningServiceSource, CP.RELEASEBOOTSTRAP_AWAIT_GETGROKBOOTSTRAPMUTEX_BROWSER_CONTEXT_ACQUIRE_S_S_CREAT);
  const grokReadinessSource = planningServiceSource.match(CP.CONST_ENSUREGROKREADY_S_S_CONST_ENSURECHATGPTREADY)?.[0] || VT.EMPTY_2;
  assert.match(grokReadinessSource, CP.GROK_READY_STABLE_POLLS);
  assert.match(grokReadinessSource, CP.GROK_POST_CHALLENGE_READY_STABLE_POLLS);
  assert.match(planningServiceSource, CP.CONST_BROWSER_AWAIT_GETORLAUNCHGROKBROWSER_REQUEST_CHROMEHEADLESS);
  assert.match(grokReadinessSource, CP.CHALLENGEACTIVELASTPOLL);
  assert.match(grokReadinessSource, CP.GROKREADYCONTEXTS_DELETE_CONTEXT);
  assert.doesNotMatch(grokReadinessSource, CP.PAGE_GOTO_RELOAD);
  assert.match(planningServiceSource, CP.INPUT_ISEDITABLE);
  assert.equal(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_POLL_MS, 250);
  assert.equal(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_STABLE_POLLS, 20);
  assert(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_MAX_TIMEOUT_MS > CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_MS);
  assert.match(CINEMATIC_CHAT_PLANNING_CONFIG.JSON_ONLY_DIRECTIVE, CP.PARSEABLE_DIRECTLY_WITH_JSON_PARSE_I);
  assert.match(planningServiceSource, CP.BELONGSTOCURRENTREQUEST_MAYUSEUNMARKEDJSONFALLBACK);
  assert.match(planningServiceSource, CP.STABLEPOLLS_CINEMATIC_CHAT_PLANNING_CONFIG_RESPONSE_STABLE_POLLS);
  assert.match(planningServiceSource, CP.PENDINGROOMRESPONSES_SET_ROOMKEY_S_S_IF_SUBMISSIONCONFIRMED);
  assert.match(planningServiceSource, CP.CONST_PARSEDLATEST_PARSESTRICTROOMJSON_LATESTTEXT);
  assert.match(planningServiceSource, CP.CONST_TRIMMED_TRIM_TEXT);
  assert.match(planningServiceSource, CP.RETURN_PARSEJSON_TRIMMED);
  assert.match(planningServiceSource, CP.INVALID_JSON_RESPONSE_ERROR);
  assert.match(planningServiceSource, CP.PLANNING_QUEUE_ACQUIRED);
  assert.match(planningServiceSource, CP.GROK_CHALLENGE_FRAME_SELECTOR_S_S_FILTER_VISIBLE_TRUE);
  assert.match(planningServiceSource, CP.CHALLENGEBODYVISIBLE_CHATREADY);
  assert.match(imageGeneratorSource, CP.ACTIVEBROWSERLAUNCHPROMISE_PROMISE_BROWSERSESSION_NULL);
  assert.match(imageGeneratorSource, CP.IF_ACTIVEBROWSERLAUNCHPROMISE_S_S_AWAIT_ACTIVEBROWSERLAUNCHPROMISE);
  assert.match(imageGeneratorSource, CP.GROKBROWSERLAUNCHPROMISE_PROMISE_CONTEXT_BROWSERCONTEXT_PAGE_PAGE_NULL);
  assert.match(imageGeneratorSource, CP.WAITFORVISIBLEGROKVERIFICATIONBEFOREAUTOMATION);
  assert.match(imageGeneratorSource, CP.IF_CHROMEHEADLESS_FALSE_AWAIT_WAITFORVISIBLEGROKVERIFICATIONBEFOREAUTOMATION);
  assert.match(imageGeneratorSource, CP.EXTERNAL_URLS_GROK_CHAT);
  const grokLaunchSource = imageGeneratorSource.match(CP.CONST_LAUNCHNATIVEGROKBROWSER_S_S_EXPORT_CONST_GETORLAUNCHGROKBROWSER)?.[0] || VT.EMPTY_2;
  assert.doesNotMatch(grokLaunchSource, CP.EXTERNAL_URLS_GROK_IMAGINE);
  assert.match(grokLaunchSource, CP.WAITFORGROKCHROME_S_S_WAITFORVISIBLEGROKVERIFICATIONBEFOREAUTOMATION_S_S_CHROM);
  const grokPreconnectSource = imageGeneratorSource.match(CP.CONST_WAITFORVISIBLEGROKVERIFICATIONBEFOREAUTOMATION_S_S_CONST_LAUNCHNATIVEGRO)?.[0] || VT.EMPTY_2;
  assert.doesNotMatch(grokPreconnectSource, CP.PAGE_GOTO_RELOAD_CHROMIUM_CONNECTOVERCDP);
  assert.doesNotMatch(planningServiceSource, CP.ACTIVEPLANNINGCONTROLLER_ABORT);
};
const verifyCurrentGeminiModelPicker = () => {
  assert.deepEqual(
    _.map(
      CINEMATIC_CHAT_MODEL_OPTIONS[AiPlanningFallbackProvider.GeminiChat].filter((option) => !option.value.includes(GEMINI_MODEL_ENCODING.SEPARATOR)),
      VT.LABEL,
    ),
    [VT.VALUE_3_5_FLASH_LITE, VT.VALUE_3_8_FLASH, VT.VALUE_3_1_PRO, VT.VALUE_4_ARGON, VT.PRO_TU_DUY_MO_RONG, VT.PRO_DEEP_THINK],
  );
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
  assert.match(planningServiceSource, CP.CLEARCHATPLANNINGROOMS);
  assert.match(planningServiceSource, CP.DELETEPROVIDERCONVERSATIONHISTORY);
  assert.match(planningServiceSource, CP.CONVERSATION_DELETE_FALLBACK_PATTERN);
  assert.match(planningServiceSource, CP.DELETEDCONVERSATIONCOUNT);
  assert.match(planningServiceSource, CP.SIDEBAROPENBUTTON_S_S_SIDEBARREADY);
  assert.match(planningServiceSource, CP.RECORD_PROVIDER_S_S_RECORD_CONTROLLER_ABORT);
  assert.match(planningServiceSource, CP.AIPLANNINGFALLBACKPROVIDER_GEMINICHAT_S_S_GEMINIROOMS);
  assert.match(planningServiceSource, CP.AIPLANNINGFALLBACKPROVIDER_GROKCHAT_S_S_GROKROOMS);
  assert.match(planningServiceSource, CP.AIPLANNINGFALLBACKPROVIDER_CHATGPTUI_S_S_CHATGPTROOMS);
  assert.match(headerSource, CP.CLEAR_GEMINI_ROOMS);
  assert.match(headerSource, CP.CLEAR_GROK_ROOMS);
  assert.match(headerSource, CP.CLEAR_CHATGPT_ROOMS);
  assert.match(headerSource, CP.PIPELINE_CLEAR_CHAT_ROOMS);
  assert.match(headerSource, CP.CLEAR_ROOM_CONFIRM);
  assert.match(headerSource, CP.CINEMATIC_SETUP_TEXTS_CURRENTLANG_AS_LANG_CINEMATIC_SETUP_TEXTS_VI);
  assert.doesNotMatch(headerSource, CP.CINEMATIC_SETUP_TEXTS_ISVIETNAMESE_UICONSTANTS_LANG_VI);
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
  _.forEach(invalidSamples, (sample) => assert.throws(() => safeParseJSON(sample, {}), CP.INVALID_AI_JSON_RESPONSE_D_LI_U_PH_N_H_I_AI_KH_NG_H_P_L_INVALID_AI_RESPONSE_ST));
};
const verifyCinematicPlanningCheckpointing = () => {
  const pipelineSource = resolveSourceTextConstants(readFileSync(new URL(TEST_CONSTANTS.AUTO_VIDEO_PIPELINE_PATH, import.meta.url), VT.UTF8));
  assert.match(pipelineSource, CP.GENERATIONPROMPTPROFILEVERSION_CINEMATIC_VIDEO_PROMPT_PROFILE_VERSION);
  assert.match(pipelineSource, CP.HASSCENEASSET_SCENE_GENERATIONPROMPTPROFILEVERSION_S);
  assert.match(pipelineSource, CP.PLANNINGBATCHES_CREATECINEMATICPLANNINGBATCHES_SCENESTOPLAN);
  assert.match(pipelineSource, CP.STORYBOARD_PENDINGPLANNINGSCENES);
  assert.match(pipelineSource, CP.PLANNINGMASTERSTORYBOARD);
  assert.match(pipelineSource, CP.ALLPLANNINGISSUES);
  assert.doesNotMatch(pipelineSource, CP.RECOVERY_BATCHINDEX);
  assert.match(pipelineSource, CP.CONST_PLANNINGWORKERID_CINEMATIC_ROOM_STAGE_PROMPT);
  assert.match(pipelineSource, CP.PARTITIONCINEMATICPLANNINGRESPONSE_REQUESTEDSCENES_RESPONSESCENES_RESPONSEPLAN);
  assert.doesNotMatch(pipelineSource, CP.IF_RESPONSE_SUCCESS_RETURN_REQUESTEDSCENES);
  assert.match(pipelineSource, CP.IF_ISEMPTY_RESPONSESCENES_RETURN_REQUESTEDSCENES);
  assert.match(pipelineSource, CP.PENDINGPLANNINGSCENES_AWAIT_APPLYPLANNINGRESPONSE_PENDINGPLANNINGSCENES_BATCHR);
  assert.match(pipelineSource, CP.CHECKPOINTCOMPLETEDSCENES_PARTITION_COMPLETEDSCENES);
  assert.match(pipelineSource, CP.FOR_LET_BATCHINDEX_0_BATCHINDEX_PLANNINGBATCHES_LENGTH_BATCHINDEX_AWAIT_PROCES);
  assert.doesNotMatch(pipelineSource, CP.PROMISE_ALL_MAP_RANGE_PLANNINGWORKERCOUNT);
  assert.doesNotMatch(pipelineSource, CP.SERVER_HO_N_T_T_L_T_S_A_HARD_GATE);
  assert.doesNotMatch(pipelineSource, CP.CLIENT_SCENE_RECOVERY_ATTEMPTS_FOR_CONST_RECOVERYSCENE_OF_PENDINGPLANNINGSCENE);
  assert.match(pipelineSource, CP.CHECKPOINTPROJECT_S_S_AWAIT_SYNCPROJECT_CHECKPOINTPROJECT);
  assert.match(pipelineSource, CP.CHECKPOINTPLANNINGSTATE_ASYNC_PHASE_STRING_PROMPT_PLANNING);
  assert.match(pipelineSource, CP.PHASE_S_R_N_S_LASTSUCCESSFULPHASE);
  assert.match(pipelineSource, CP.PROMPT_PLANNING_COMPLETED);
  assert.match(pipelineSource, CP.CINEMATIC_PLANNING_MESSAGES_VI_BATCH_ATTEMPT);
  assert.match(pipelineSource, CP.LATESTPLANNINGMASTERSTORYBOARD);
  assert.match(pipelineSource, CP.FIRSTPENDINGSCENEINDEX);
  assert.match(pipelineSource, CP.CONST_LATESTPROJECT_ACTIVEPROJECTSNAPSHOTREF_CURRENT_CURRENTPROJECT);
  assert.match(pipelineSource, CP.CONST_PIPELINEARTIFACTRUNID);
  assert.match(pipelineSource, CP.PRESENTATIONTARGET_LASTRUNID);
  assert.match(pipelineSource, CP.PIPELINERUNID_PIPELINEARTIFACTRUNID);
  assert.match(pipelineSource, CP.RETAINPLANNINGROOMSFORRESUME);
  assert.match(pipelineSource, CP.RETAINPLANNINGROOMSFORRESUME_2);
  assert.doesNotMatch(pipelineSource, CP.CLOSECOMPLETEDPLANNINGWORKERS_CINEMATIC_ROOM_STAGE_SCRIPT_PROMPT_THUMBNAIL);
  assert.match(pipelineSource, CP.PIPELINECOMPLETED_S_S_PIPELINE_CLOSE_CHAT_PLANNING_ROOMS);
};
const verifyLongFilmPlanningBatches = () => {
  const twentyMinuteScenes = _.map(_.range(120), (index) => ({ id: VT.SCENE_2 + _.padStart(_.toString(index + 1), 3, VT.VALUE_0), script: VT.STORY_BEAT + (index + 1), generationPrompt: VT.EMPTY_2 }));
  const batches = createCinematicPlanningBatches(twentyMinuteScenes);
  assert.equal(_.sumBy(batches, VT.LENGTH), twentyMinuteScenes.length);
  assert.equal(batches.length, _.ceil(_.divide(twentyMinuteScenes.length, CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_SIZE)));
  assert(_.every(batches, (batch) => _.lte(batch.length, CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_SIZE)));
  const largeScenes = _.map(_.range(4), (index) => ({ id: VT.LARGE + index, script: VT.X.repeat(9000) }));
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
