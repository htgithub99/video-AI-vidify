import assert from "node:assert/strict";
import { createCinematicVideoPrompt } from "../src/services/cinematicEpisodeService";
import {
  getBlockingCinematicPromptPreflightIssues,
  getCinematicPromptPreflightIssues,
  resolveAuthoritativeCinematicPrompt,
} from "../src/services/cinematicPromptPreflightService";
import { GenerateType, ProjectLanguage, StoryboardScene } from "../src/types";
import { getCinematicSceneContractIssues } from "../src/services/cinematicProductionPolicyService";
import { createFlowMediaRedirectUrl, normalizeFlowMediaId } from "../src/server/services/imageGeneratorService";

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
assert.ok(getCinematicPromptPreflightIssues(scene, prompt, 10).some((issue) => issue.includes("length_outside_recommended_range")));
assert.deepEqual(getBlockingCinematicPromptPreflightIssues(scene, prompt, 10), []);
const promptWithoutCaptureMetadata = prompt.replace("Shot on 35mm anamorphic lens, 24fps, ", "");
assert.ok(getCinematicPromptPreflightIssues(scene, promptWithoutCaptureMetadata, 10).some((issue) => issue.includes("cinematic_capture_missing")));
assert.deepEqual(getBlockingCinematicPromptPreflightIssues(scene, promptWithoutCaptureMetadata, 10), []);
const staleDialoguePatch = "Mandatory dialogue correction: char_1 must audibly speak exactly the approved line.";
const compiledFromStaleScene = createCinematicVideoPrompt({ ...scene, generationPrompt: staleDialoguePatch }, scene.prompt || "", GenerateType.Video, 10);
assert.equal(compiledFromStaleScene, staleDialoguePatch);
assert.ok(getCinematicPromptPreflightIssues(scene, compiledFromStaleScene, 10).length > 0);
assert.ok(getCinematicPromptPreflightIssues(scene, prompt.replace("Shot 3", "Final view"), 10).some((issue) => issue.includes("shot_3_missing")));
assert.ok(getCinematicPromptPreflightIssues(scene, prompt.replaceAll(scene.spokenDialogue!, ""), 10).some((issue) => issue.includes("dialogue_missing")));
const aiAuthoredPrompt = `${prompt}\n\nPreserve these intentional trailing line breaks.\n`;
assert.equal(resolveAuthoritativeCinematicPrompt(aiAuthoredPrompt, { violatesPolicy: false, repairedPrompt: "must not replace a safe prompt" }), aiAuthoredPrompt);
const aiRewrittenPrompt = `${prompt}\nComplete AI-authored safe rewrite.`;
assert.equal(resolveAuthoritativeCinematicPrompt(aiAuthoredPrompt, { violatesPolicy: true, repairedPrompt: aiRewrittenPrompt }), aiRewrittenPrompt);
assert.equal(resolveAuthoritativeCinematicPrompt(aiAuthoredPrompt, { violatesPolicy: true, repairedPrompt: "" }), "");
assert.deepEqual(getCinematicSceneContractIssues(scene, 10, ProjectLanguage.EN), []);
assert.ok(getCinematicSceneContractIssues({ ...scene, spokenDialogue: "Người kể: Anh ấy bước đi." }, 10, ProjectLanguage.VI).some((issue) => issue.includes("third_person_narration_forbidden")));
assert.ok(getCinematicSceneContractIssues({ ...scene, spokenDialogue: "Chúng ta đi ngay." }, 10, ProjectLanguage.EN).some((issue) => issue.includes("must_be_english")));
const flowMediaId = "84a69b3c-7dda-487c-a735-227c6b76b6b9";
const duplicatedFlowMediaUrl = `https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=${flowMediaId}/fx/api/trpc/media.getMediaUrlRedirect?name=${flowMediaId}`;
assert.equal(normalizeFlowMediaId(duplicatedFlowMediaUrl), flowMediaId);
assert.equal(createFlowMediaRedirectUrl(duplicatedFlowMediaUrl), `https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=${flowMediaId}`);
process.stdout.write(JSON.stringify({ passed: true, videoSubmissionLimit: 1, shots: 3 }));
