import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCinematicVideoPrompt } from "../src/services/cinematicEpisodeService";
import { getBlockingCinematicStoryboardContractIssues } from "../src/services/cinematicProductionPolicyService";
import { GenerateType, ProjectLanguage, StoryboardScene } from "../src/types";

const incompleteAiScene = {
  id: "sc_1",
  duration: 10,
  script: "The protagonist opens the gate.",
  prompt: "Short metadata",
  generationPrompt: "",
} as StoryboardScene;

assert.ok(getBlockingCinematicStoryboardContractIssues([incompleteAiScene], 10, ProjectLanguage.EN).length > 0);
assert.equal(createCinematicVideoPrompt(incompleteAiScene, incompleteAiScene.prompt, GenerateType.Video, 10), "");

const authoredPrompt = "AI-authored prompt preserved byte-for-byte.\nSecond line remains unchanged.\n";
const authoredScene = { ...incompleteAiScene, generationPrompt: authoredPrompt };
assert.equal(createCinematicVideoPrompt(authoredScene, "compiler must ignore this", GenerateType.Video, 10), authoredPrompt);

const controllerSource = readFileSync(new URL("../src/server/controllers/pipelineController.ts", import.meta.url), "utf8");
const pipelineSource = readFileSync(new URL("../src/hooks/useAutoVideoPipeline.ts", import.meta.url), "utf8");
const promptSource = readFileSync(new URL("../src/constants/prompts.ts", import.meta.url), "utf8");
assert.doesNotMatch(controllerSource, /generationPrompt:\s*createCinematicVideoPrompt/);
assert.doesNotMatch(controllerSource, /repairCinematicStoryboardContract\(plannedScenes/);
assert.doesNotMatch(pipelineSource, /realScenes\s*=\s*repairCinematicStoryboardContract/);
assert.match(pipelineSource, /scene\.generationPrompt = retryPrompt/);
assert.match(pipelineSource, /requestAiRewrittenVideoPrompt/);
assert.match(
  controllerSource,
  /isCinematicPlanning\s*\? _\.cloneDeep\(sourceScenes\)\s*:\s*resolveStoryboardCharacterIds/,
  "cinematic scene-character membership is still inferred in application code",
);
assert.match(
  controllerSource,
  /_\.map\(_\.isEmpty\(relevantChunkCharacters\) \? promptCharacters : relevantChunkCharacters, \(character\) => _\.pick\(character, \["id", "name", "prompt"\]\)\)/,
  "Room planning must receive compact AI-authored identity cards scoped to the current chunk",
);
assert.doesNotMatch(promptSource, /clipDurationSeconds \/ 3|\(clipDurationSeconds \* 2\) \/ 3/, "prompt template still injects equal shot timing from code");

process.stdout.write("AI-authored cinematic prompt boundary assertions passed.\n");
