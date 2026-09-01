import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import _ from "lodash";
import { getCinematicVideoPlanningPrompt, getCinematicVideoPlanningRepairPrompt } from "../src/constants/prompts";
import { createVisualContinuityContext } from "../src/services/visualContinuityService";
import {
  getBlockingCinematicPlanningIssues,
  getBlockingCinematicStoryboardContractIssues,
  getCinematicStoryboardContractIssues,
} from "../src/services/cinematicProductionPolicyService";
import { createScopedVisualBibleContext, getVisualShotPlanIssues } from "../src/services/visualPlanningService";
import type { StoryboardScene, VisualBible } from "../src/types";

const TEST_CONSTANTS = {
  DEFAULT_CLIP_DURATION_SECONDS: 10,
  LANGUAGE_VIETNAMESE: "Vietnamese",
  DIRECTIVE_DIALOGUE_REQUIRED: "Dialogue is REQUIRED for sc_2.",
  PIPELINE_CONTROLLER_PATH: "../src/server/controllers/pipelineController.ts",
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
  assert.match(initialPrompt, /generationPrompt is the final 180-500 word English prompt/);

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
  assert.match(repairPrompt, /Rewrite the COMPLETE scene object/);
  assert.match(repairPrompt, /sc_2:generationPrompt:missing/);
  assert.match(repairPrompt, /Output only the complete valid JSON array/);
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
  assert.equal(advisoryIssues.length, 3);
  assert.deepEqual(getBlockingCinematicStoryboardContractIssues([firstScene, secondScene], TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS), []);

  const sceneMissingSound = { ..._.cloneDeep(MOCK_ENVIRONMENT_ONLY_SCENE), soundDesignCues: [] } as StoryboardScene;
  assert.match(getBlockingCinematicStoryboardContractIssues([sceneMissingSound], TEST_CONSTANTS.DEFAULT_CLIP_DURATION_SECONDS)[0], /soundDesignCues:missing$/);

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
  assert.deepEqual(getBlockingCinematicPlanningIssues(["sc_2:generationPrompt:missing", "sc_2:soundDesignCues:invalid"]), [
    "sc_2:generationPrompt:missing",
    "sc_2:soundDesignCues:invalid",
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
  assert.match(controllerSource, /AiPlanningExecutionMode\.ApiOnly\)\) return requestApiPlan\(apiContents\)/);
  assert.match(controllerSource, /AiPlanningExecutionMode\.RoomOnly\)\) return requestChatUiPlan\(chatUiContents\)/);
  assert.match(controllerSource, /return await requestApiPlan\(apiContents\)[\s\S]*return requestChatUiPlan\(chatUiContents\)/);
  assert.match(controllerSource, /return await requestChatUiPlan\(chatUiContents\)[\s\S]*return requestApiPlan\(apiContents\)/);
  assert.match(controllerSource, /forChatUi \? chunkCharactersJson : charactersJson/);
  assert.match(controllerSource, /forChatUi \? chunkVisualBibleJson : jsonUtils\.safeStringify\(resolvedVisualBible\)/);
  assert.match(controllerSource, /maxItems: CINEMATIC_CHAT_PLANNING_CONFIG\.API_MAX_SOUND_DESIGN_CUES/);
  assert.match(controllerSource, /planningExecutionMode, AiPlanningExecutionMode\.ApiOnly\)[\s\S]*firstParsedItems[\s\S]*firstPlanningIssues/);
  assert.match(controllerSource, /else \{[\s\S]*CINEMATIC_CHAT_PLANNING_CONFIG\.MAX_CORRECTION_ATTEMPTS/);
  assert.match(controllerSource, /CINEMATIC_CHAT_PLANNING_CONFIG\.ROOM_RESPONSE_ATTEMPTS/);
  assert.match(controllerSource, /getBlockingCinematicStoryboardContractIssues/);
  assert.match(controllerSource, /getBlockingCinematicPlanningIssues\(planningIssues\)/);
  assert.match(controllerSource, /candidateBlockingCount[\s\S]*currentBlockingCount/);
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
  process.stdout.write(TEST_CONSTANTS.SUCCESS_MESSAGE);
};

runAllVerificationSuites();
