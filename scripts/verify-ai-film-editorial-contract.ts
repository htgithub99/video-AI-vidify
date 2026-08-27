import assert from "node:assert/strict";
import {
  applyCinematicContinuityHandoffs,
  bundleCinematicScenesForGeneration,
  getCinematicStoryboardContractIssues,
} from "../src/services/cinematicProductionPolicyService";
import { prepareProjectMediaPrompt } from "../src/services/projectImageGenerationService";
import { GenerateType, StoryboardScene } from "../src/types";

const createScene = (id: string, beatCount: number): StoryboardScene => {
  const duration = 10 / beatCount;
  const beats = Array.from({ length: beatCount }, (_, index) => ({
    sourceSceneId: id,
    shotId: `${id}_shot_${index + 1}`,
    shotRole: index === beatCount - 1 ? "payoff" : index === 0 ? "master" : "coverage",
    shotSize: index === 0 ? "wide shot" : "editorially selected shot",
    cameraAngle: "motivated angle",
    visibleAction: `Distinct causal action ${index + 1}`,
    reaction: `Visible consequence ${index + 1}`,
    transition: index % 2 === 0 ? "hard_cut" : "match_cut",
    dialogueMode: "silent_action",
    spokenDialogue: "",
    speakerCharacterId: "",
    lipSyncRequired: false,
    startSecond: Number((index * duration).toFixed(2)),
    endSecond: index === beatCount - 1 ? 10 : Number(((index + 1) * duration).toFixed(2)),
  })) as NonNullable<StoryboardScene["cinematicBeats"]>;
  return {
    id,
    chapterId: "chapter_1",
    startTime: "00:00",
    endTime: "00:10",
    duration: 10,
    script: "A clear playable story event.",
    subtitle: "",
    prompt: "",
    generationPrompt: `Create one continuous 10-second sequence with exactly ${beatCount} chronological shots. Shot 1. Shot 2. Shot 3.`,
    cameraMotion: "AI selected",
    sequenceId: id,
    shotId: `${id}_master`,
    shotRole: "master",
    dialogueMode: "silent_action",
    spokenDialogue: "",
    speakerCharacterId: "",
    lipSyncRequired: false,
    characterBlocking: "AI-authored blocking",
    eyelineDirection: "static_axis",
    screenDirection: "static_axis",
    actionStartState: `Opening ${id}`,
    actionEndState: `Ending ${id}`,
    locationState: "Stable location",
    wardrobeState: "Stable wardrobe",
    propState: "Stable prop state",
    soundDesignCues: ["location ambience"],
    cinematicBeats: beats,
  };
};

for (const beatCount of [3, 4, 5]) {
  const scene = createScene(`scene_${beatCount}`, beatCount);
  assert.deepEqual(getCinematicStoryboardContractIssues([scene]), []);
  assert.deepEqual(bundleCinematicScenesForGeneration([scene], 1), [scene]);
  assert.deepEqual(applyCinematicContinuityHandoffs([scene]), [scene]);
}

const aiPrompt = "Create one continuous 10-second sequence with exactly 4 chronological shots. Shot 1: setup. Shot 2: obstacle. Shot 3: decision. Shot 4: consequence.";
assert.equal(
  prepareProjectMediaPrompt({ sceneId: "scene_4", prompt: aiPrompt, generateType: GenerateType.Video }),
  aiPrompt,
);

console.log("AI film editorial contract verified: AI-owned 3–5 shots, timing and prompt remain unchanged.");
