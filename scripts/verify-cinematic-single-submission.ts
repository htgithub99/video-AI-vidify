import assert from "node:assert/strict";
import { createCinematicVideoPrompt } from "../src/services/cinematicEpisodeService";
import { getCinematicPromptPreflightIssues, resolveAuthoritativeCinematicPrompt } from "../src/services/cinematicPromptPreflightService";
import { GenerateType, ProjectLanguage, StoryboardScene } from "../src/types";
import { getCinematicSceneContractIssues } from "../src/services/cinematicProductionPolicyService";

const scene = {
  id: "sc_preflight",
  duration: 10,
  sequenceId: "sequence_1",
  shotId: "shot_1",
  shotRole: "master",
  dialogueMode: "on_screen_dialogue",
  spokenDialogue: "We leave before sunrise.",
  speakerCharacterId: "char_1",
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

const prompt = createCinematicVideoPrompt(scene, "", GenerateType.Video, 10);
assert.deepEqual(getCinematicPromptPreflightIssues(scene, prompt, 10), []);
assert.ok(getCinematicPromptPreflightIssues(scene, prompt.replace("Shot 3", "Final view"), 10).some((issue) => issue.includes("shot_3_missing")));
assert.ok(getCinematicPromptPreflightIssues(scene, prompt.replace(scene.spokenDialogue!, ""), 10).some((issue) => issue.includes("dialogue_missing")));
const aiAuthoredPrompt = `${prompt}\n\nPreserve these intentional trailing line breaks.\n`;
assert.equal(resolveAuthoritativeCinematicPrompt(aiAuthoredPrompt, { violatesPolicy: false, repairedPrompt: "must not replace a safe prompt" }), aiAuthoredPrompt);
const aiRewrittenPrompt = `${prompt}\nComplete AI-authored safe rewrite.`;
assert.equal(resolveAuthoritativeCinematicPrompt(aiAuthoredPrompt, { violatesPolicy: true, repairedPrompt: aiRewrittenPrompt }), aiRewrittenPrompt);
assert.equal(resolveAuthoritativeCinematicPrompt(aiAuthoredPrompt, { violatesPolicy: true, repairedPrompt: "" }), "");
scene.characterIds = ["char_1"];
assert.deepEqual(getCinematicSceneContractIssues(scene, 10, ProjectLanguage.EN), []);
assert.ok(getCinematicSceneContractIssues({ ...scene, spokenDialogue: "Người kể: Anh ấy bước đi." }, 10, ProjectLanguage.VI).some((issue) => issue.includes("third_person_narration_forbidden")));
assert.ok(getCinematicSceneContractIssues({ ...scene, spokenDialogue: "Chúng ta đi ngay." }, 10, ProjectLanguage.EN).some((issue) => issue.includes("must_be_english")));
process.stdout.write(JSON.stringify({ passed: true, videoSubmissionLimit: 1, shots: 3 }));
