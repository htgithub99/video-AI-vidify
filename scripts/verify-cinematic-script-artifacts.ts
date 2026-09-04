import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CINEMATIC_SCRIPT_ARTIFACT_CONFIG } from "../src/constants/config";
import {
  CINEMATIC_NARRATIVE_PLAN_RESPONSE_SCHEMA,
  CINEMATIC_STORY_BIBLE_RESPONSE_SCHEMA,
  FINAL_CINEMATIC_SCREENPLAY_RESPONSE_SCHEMA,
} from "../src/constants/responseSchemas";
import { getCinematicNarrativePlanPrompt, getCinematicStoryBiblePrompt } from "../src/constants/prompts";
import {
  getCinematicArtifactIssues,
  getCinematicNarrativePlanIssues,
  getCinematicStoryBibleIssues,
  createCinematicScriptSourceSignature,
  requestValidCinematicArtifact,
} from "../src/server/services/cinematicScriptArtifactService";

const storyBible = {
  schemaVersion: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.STORY_BIBLE_SCHEMA_VERSION,
  artifactId: "story_bible_01",
  theme: "A choice creates an irreversible cost.",
  characterSpecs: "Lan, a mechanic in her thirties with cropped black hair and a scar above her left brow.",
  preferredTerms: [],
  factCheckNotes: "Fictional story.",
  creativeBrief: {
    logline: "Lan must choose between escape and saving her crew.",
    centralQuestion: "Will Lan accept the cost of leadership?",
    viewerPromise: "A concrete choice with a visible consequence.",
    centralMessage: "Responsibility is proven through action.",
    audience: "Adult drama audience.",
    narrativePerspective: "Close third person.",
    primaryCharacter: "Lan.",
    conflict: "Escape conflicts with rescue.",
    turningPoint: "Lan destroys the only escape route.",
    resolution: "The crew survives while Lan remains trapped.",
    emotionalArc: "Self-protection to responsibility.",
    visualMotifs: ["a damaged ignition key"],
    forbiddenDirections: [],
  },
  factPack: { claims: [] },
  completionMarker: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER,
};

const beats = Array.from({ length: 6 }, (_, index) => ({
  id: `beat_${index + 1}`,
  type: index === 0 ? "hook" : index === 5 ? "payoff" : "escalation",
  event: `Event ${index + 1}`,
  characterStateBefore: "Before",
  characterStateAfter: "After",
  visibleAction: "Lan changes the machine state.",
  retentionPurpose: "Advances the central choice.",
  targetDurationSeconds: 20,
  callbackId: "",
}));
const narrativePlan = {
  schemaVersion: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.NARRATIVE_PLAN_SCHEMA_VERSION,
  artifactId: "narrative_01",
  sourceStoryBibleArtifactId: storyBible.artifactId,
  narrativePlan: {
    viewerPromise: "A concrete choice with a visible consequence.",
    centralQuestion: "Will Lan accept the cost of leadership?",
    protagonist: {
      initialState: "Lan prepares to escape.",
      emotionalLack: "Avoids responsibility.",
      externalGoal: "Start the last vehicle.",
      internalNeed: "Choose the crew.",
      temptation: "Leave alone.",
      firstCompromise: "Hides the working key.",
      escalatingChoices: ["Delays the rescue."],
      pointOfNoReturn: "Breaks the escape mechanism.",
      falseVictory: "The crew reaches the vehicle.",
      collapse: "The exit seals.",
      finalCost: "Lan cannot leave.",
      realization: "Leadership requires a cost.",
    },
    beats,
    callbacks: [],
    endingPayoff: "The crew leaves while Lan remains behind.",
  },
  chapters: Array.from({ length: 3 }, (_, index) => ({
    id: `ch_${index + 1}`,
    title: `Chapter ${index + 1}`,
    description: `Distinct causal event ${index + 1}`,
    purpose: "Advance the irreversible choice.",
    requiredBeatIds: [`beat_${index * 2 + 1}`, `beat_${index * 2 + 2}`],
    characterStartState: "Before",
    characterEndState: "After",
    callbackSetupIds: [],
    callbackPayoffIds: [],
    forbiddenRepetition: [],
    handoffToNextChapter: "The consequence continues.",
  })),
  completionMarker: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER,
};

assert.deepEqual(getCinematicStoryBibleIssues(storyBible), []);
assert.deepEqual(getCinematicNarrativePlanIssues(narrativePlan, 3, storyBible.artifactId), []);
assert.ok(getCinematicNarrativePlanIssues({ ...narrativePlan, sourceStoryBibleArtifactId: "wrong" }, 3, storyBible.artifactId).includes("$root.sourceStoryBibleArtifactId:mismatch"));

const artifactOptions = {
  artifactName: "cinematic_story_bible",
  schemaVersion: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.STORY_BIBLE_SCHEMA_VERSION,
  schema: CINEMATIC_STORY_BIBLE_RESPONSE_SCHEMA,
  validate: getCinematicStoryBibleIssues,
};
assert.ok(
  getCinematicArtifactIssues(JSON.stringify({ ...storyBible, completionMarker: undefined }), { ...storyBible, completionMarker: undefined }, artifactOptions).some((issue) =>
    issue.includes("completionMarker"),
  ),
);
const nonTerminalMarker = { completionMarker: CINEMATIC_SCRIPT_ARTIFACT_CONFIG.COMPLETION_MARKER, ...storyBible, factCheckNotes: "after marker" };
assert.ok(getCinematicArtifactIssues(JSON.stringify(nonTerminalMarker), nonTerminalMarker, artifactOptions).includes("completion_marker_not_terminal"));

const workers: string[] = [];
let responseIndex = 0;
const result = await requestValidCinematicArtifact(
  { contents: "Create story bible", config: {}, task: {} },
  artifactOptions,
  async (request) => {
    workers.push(String(request.task.roomWorkerId));
    responseIndex++;
    return { text: responseIndex === 1 ? "{\"theme\":\"cut off\"" : JSON.stringify(storyBible) };
  },
);
assert.equal(result.value.artifactId, storyBible.artifactId);
assert.deepEqual(workers, [CINEMATIC_SCRIPT_ARTIFACT_CONFIG.PRIMARY_WORKER_ID, CINEMATIC_SCRIPT_ARTIFACT_CONFIG.RECOVERY_WORKER_ID]);

const transportWorkers: string[] = [];
let transportAttempt = 0;
const recoveredTransportResult = await requestValidCinematicArtifact(
  { contents: "Create story bible", config: {}, task: {} },
  artifactOptions,
  async (request) => {
    transportWorkers.push(String(request.task.roomWorkerId));
    transportAttempt++;
    if (transportAttempt < 2) throw new Error("completion_marker_missing");
    return { text: JSON.stringify(storyBible) };
  },
);
assert.equal(recoveredTransportResult.value.artifactId, storyBible.artifactId);
assert.deepEqual(transportWorkers, [
  CINEMATIC_SCRIPT_ARTIFACT_CONFIG.PRIMARY_WORKER_ID,
  CINEMATIC_SCRIPT_ARTIFACT_CONFIG.RECOVERY_WORKER_ID,
]);
assert.ok(recoveredTransportResult.rotationLogs.some((log) => log.includes("room_response_failed:completion_marker_missing")));

let truncatedAttempt = 0;
const strictJsonResult = await requestValidCinematicArtifact(
  { contents: "Create story bible", config: {}, task: {} },
  artifactOptions,
  async () => {
    truncatedAttempt++;
    const completeResponse = JSON.stringify(storyBible);
    return { text: truncatedAttempt === 1 ? completeResponse.slice(0, -1) : completeResponse };
  },
);
assert.equal(strictJsonResult.value.artifactId, storyBible.artifactId);
assert.equal(truncatedAttempt, 2);

const baseSourceSignature = createCinematicScriptSourceSignature({ originalInput: "A", genre: "Drama", creativityLevel: 5 });
assert.equal(baseSourceSignature, createCinematicScriptSourceSignature({ creativityLevel: 5, genre: "Drama", originalInput: "A" }));
assert.notEqual(baseSourceSignature, createCinematicScriptSourceSignature({ originalInput: "B", genre: "Drama", creativityLevel: 5 }));

const storyPrompt = getCinematicStoryBiblePrompt("Source", "2 minutes", 300, "Drama", "Cinematic", false, "Adults");
const narrativePrompt = getCinematicNarrativePlanPrompt("Source", JSON.stringify(storyBible), "2 minutes", 300, 3, false);
assert.match(storyPrompt, /VIDIFY_ARTIFACT_COMPLETE/);
assert.match(narrativePrompt, /sourceStoryBibleArtifactId/);
assert.equal(FINAL_CINEMATIC_SCREENPLAY_RESPONSE_SCHEMA.properties.completionMarker.type, "string");
assert.equal(CINEMATIC_NARRATIVE_PLAN_RESPONSE_SCHEMA.properties.sourceStoryBibleArtifactId.type, "string");

const projectControllerSource = readFileSync(new URL("../src/server/controllers/projectController.ts", import.meta.url), "utf8");
const pipelineControllerSource = readFileSync(new URL("../src/server/controllers/pipelineController.ts", import.meta.url), "utf8");
assert.match(projectControllerSource, /resolveLatestCinematicArtifacts/);
assert.match(projectControllerSource, /storedUpdatedAt > incomingUpdatedAt/);
assert.match(pipelineControllerSource, /cinematicScriptArtifacts: latestCinematicCheckpoint\?\.cinematicScriptArtifacts/);

process.stdout.write("Cinematic script artifact protocol assertions passed.\n");
