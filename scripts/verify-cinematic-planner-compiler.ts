import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import _ from "lodash";
import {
  getBlockingCinematicStoryboardContractIssues,
  repairCinematicStoryboardContract,
} from "../src/services/cinematicProductionPolicyService";
import { createCinematicVideoPrompt } from "../src/services/cinematicEpisodeService";
import { getCinematicPromptPreflightIssues } from "../src/services/cinematicPromptPreflightService";
import { GenerateType, ProjectLanguage, StoryboardScene } from "../src/types";

const SCENE_COUNT = 12;
const CLIP_DURATION_SECONDS = 10;
const ACTION_SCENE_INDEXES = new Set([1, 2, 4, 5, 7, 8, 10, 11]);
const DIALOGUE_SCENE_INDEXES = new Set([0, 3, 6, 9]);
const DIALOGUE = "Ngộ Không, hãy dừng tay và nghe ta nói!";
const CREATIVE_BRIEF =
  "Photorealistic mythic Chinese palace drama featuring Sun Wukong with his unmistakable simian face, amber eyes, russet fur, gold circlet, red-and-gold armor, and gold-banded staff beside a distinct armored heavenly guard. Preserve both identities, grounded anatomy, practical cloud-palace lighting, layered celestial architecture, readable body language, clear spatial depth, restrained cinematic contrast, realistic materials, and one story-specific physical consequence in the foreground.";

const createCreativeScene = (index: number): StoryboardScene => {
  const id = `sc_${index + 1}`;
  const isAction = ACTION_SCENE_INDEXES.has(index);
  const hasDialogue = DIALOGUE_SCENE_INDEXES.has(index);
  const visibleAction = isAction
    ? "Sun Wukong attacks toward the armored heavenly guard from left to right, swinging his gold-banded staff into the guard's raised shield."
    : "Sun Wukong plants his gold-banded staff on the jade floor and points toward the sealed celestial gate as the heavenly guard steps aside.";
  const reaction = isAction
    ? "The shield catches the contact with sparks; the heavenly guard recoils, stumbles backward, and drops to one knee."
    : "The heavenly guard lowers his shoulders and reveals the newly opened passage behind him.";
  const actionEndState = isAction
    ? "Aftermath: Sun Wukong remains grounded on the left while the disarmed guard remains kneeling in a new position beside the damaged balustrade."
    : "The open gate remains visible while Sun Wukong faces the passage and the guard remains clear of his path.";
  const dialogueMode = hasDialogue ? "on_screen_dialogue" : "silent_action";
  const spokenDialogue = hasDialogue ? DIALOGUE : "";
  const speakerCharacterId = hasDialogue ? "heaven_guard" : "";
  const beats = isAction
    ? [
        {
          shotRole: "master",
          shotSize: "wide shot",
          cameraAngle: "eye level",
          visibleAction: "Sun Wukong and the heavenly guard establish distance on one left-to-right action axis while the guard raises his shield.",
          reaction: "Both performers hold readable grounded stances.",
          transition: "hard_cut",
        },
        {
          shotRole: "coverage",
          shotSize: "medium shot",
          cameraAngle: "low angle",
          visibleAction,
          reaction,
          transition: "match_cut",
        },
        {
          shotRole: "payoff",
          shotSize: "medium wide shot",
          cameraAngle: "eye level",
          visibleAction: actionEndState,
          reaction: "The guard remains visibly displaced and unable to continue the exchange.",
          transition: "hard_cut",
        },
      ]
    : [
        {
          shotRole: "master",
          shotSize: "wide shot",
          cameraAngle: "eye level",
          visibleAction: "Sun Wukong and the heavenly guard face each other beside the sealed celestial gate.",
          reaction: "The guard watches the staff touch the jade floor.",
          transition: "hard_cut",
        },
        {
          shotRole: "coverage",
          shotSize: "medium two shot",
          cameraAngle: "eye level",
          visibleAction,
          reaction,
          transition: "match_cut",
        },
        {
          shotRole: "payoff",
          shotSize: "wide reveal",
          cameraAngle: "low angle",
          visibleAction: actionEndState,
          reaction: "Sun Wukong redirects his attention into the revealed route.",
          transition: "hard_cut",
        },
      ];

  return {
    id,
    chapterId: "chapter_1",
    startTime: `00:${_.padStart(_.toString(index * CLIP_DURATION_SECONDS), 2, "0")}`,
    endTime: `00:${_.padStart(_.toString((index + 1) * CLIP_DURATION_SECONDS), 2, "0")}`,
    duration: CLIP_DURATION_SECONDS,
    script: isAction ? `${visibleAction} ${reaction} ${actionEndState}` : `${visibleAction} ${reaction}`,
    subtitle: spokenDialogue,
    prompt: CREATIVE_BRIEF,
    cameraMotion: "motivated stable coverage",
    visualIntent: isAction ? "The viewer understands who initiates the exchange, who receives it, and how the balance of power changes." : "The viewer understands that a guarded route has opened through a character decision.",
    visibleAction,
    reaction,
    storyEvidence: isAction ? "The displaced shield, sparks, kneeling guard, and damaged rail prove the impact." : "The open gate and the guard's changed position prove access was granted.",
    visualHook: isAction ? "The staff-to-shield contact creates a readable foreground spark line between both performers." : "The sealed gate separates into a luminous passage behind the two performers.",
    characterIds: ["sun_wukong", "heaven_guard"],
    shotPurpose: isAction ? "escalation" : "decision",
    dialogueMode,
    spokenDialogue,
    speakerCharacterId,
    lipSyncRequired: hasDialogue,
    actionEndState,
    cinematicBeats: _.map(beats, (beat, beatIndex) => ({
      ...beat,
      dialogueMode: hasDialogue && beatIndex === 1 ? "on_screen_dialogue" : "silent_action",
      spokenDialogue: hasDialogue && beatIndex === 1 ? DIALOGUE : "",
      speakerCharacterId: hasDialogue && beatIndex === 1 ? "heaven_guard" : "",
      lipSyncRequired: hasDialogue && beatIndex === 1,
    })) as StoryboardScene["cinematicBeats"],
    assetStrategy: "ai_generated",
  } as StoryboardScene;
};

const startedAt = performance.now();
const creativePlan = _.map(_.range(SCENE_COUNT), createCreativeScene);
const repairedPlan = repairCinematicStoryboardContract(creativePlan, ProjectLanguage.VI, CLIP_DURATION_SECONDS);
const compiledPlan = _.map(repairedPlan, (scene) => ({
  ...scene,
  generationPrompt: createCinematicVideoPrompt(scene, scene.prompt, GenerateType.Video, CLIP_DURATION_SECONDS),
}));
const elapsedMilliseconds = performance.now() - startedAt;

assert.equal(compiledPlan.length, SCENE_COUNT);
assert.deepEqual(getBlockingCinematicStoryboardContractIssues(compiledPlan, CLIP_DURATION_SECONDS, ProjectLanguage.VI), []);
_.forEach(compiledPlan, (scene) => {
  const promptWordCount = _.size(_.words(scene.generationPrompt || ""));
  assert.deepEqual(getCinematicPromptPreflightIssues(scene, scene.generationPrompt || "", CLIP_DURATION_SECONDS), [], `${scene.id} has ${promptWordCount} prompt words`);
  assert.match(scene.generationPrompt || "", /Creative brief: Photorealistic mythic Chinese palace drama/);
  assert.match(scene.generationPrompt || "", /No gore, exposed wounds, dismemberment, torture/);
  assert.equal(_.size(scene.cinematicBeats), 3);
  assert.equal(_.first(scene.cinematicBeats)?.startSecond, 0);
  assert.equal(_.last(scene.cinematicBeats)?.endSecond, CLIP_DURATION_SECONDS);
});
_.forEach(_.filter(compiledPlan, (_scene, index) => ACTION_SCENE_INDEXES.has(index)), (scene) => {
  assert.match(scene.generationPrompt || "", /foreground initiator and explicit target/);
  assert.match(scene.generationPrompt || "", /visible contact or evasion/);
  assert.match(scene.generationPrompt || "", /stable aftermath/);
});

process.stdout.write(
  `Cinematic planner/compiler dry-run passed: ${SCENE_COUNT}/${SCENE_COUNT} scenes, 0 Flow calls, ${elapsedMilliseconds.toFixed(1)}ms.\n`,
);
