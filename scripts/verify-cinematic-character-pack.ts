import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getCinematicCharacterAnalysisPrompt } from "../src/constants/cinematicPrompts";
import { createSceneGenerationContext, resolveCinematicSceneCharacterReferences } from "../src/services/sceneReferenceService";
import { CharacterConfig, StoryboardScene } from "../src/types";

const characters: CharacterConfig[] = [
  { id: "char_kade", name: "Kade Voss", description: "Bounty hunter", images: ["/assets/kade.png"] },
  { id: "char_varg", name: "Varg", description: "Crime lord", images: ["/assets/varg.png"] },
  { id: "char_pilot", name: "Mira", description: "Pilot", images: ["/assets/mira.png"] },
];

const scene = { id: "sc_1", characterIds: ["char_kade", "char_varg"], prompt: "Kade confronts Varg", script: "Kade confronts Varg" } as StoryboardScene;
const cinematicReferences = resolveCinematicSceneCharacterReferences(scene, characters);
assert.deepEqual(cinematicReferences.characterIds, ["char_kade", "char_varg"]);
assert.deepEqual(cinematicReferences.referenceImages, ["/assets/kade.png", "/assets/varg.png"]);
assert.equal(cinematicReferences.referenceRoles.length, 2);

const automaticContext = createSceneGenerationContext(scene, { characters });
assert.deepEqual(automaticContext.referenceImages, []);

const characterPrompt = getCinematicCharacterAnalysisPrompt("Kade confronts Varg", "cinematic live action", "");
assert.match(characterPrompt, /referenceGenerationPrompt/);
assert.match(characterPrompt, /character-continuity director/i);
assert.match(characterPrompt, /Separate immutable identity from scene action/i);
assert.match(characterPrompt, /sourceIdentityEvidence/);
assert.match(characterPrompt, /speciesPresentation/);
assert.match(characterPrompt, /identityContinuityRisks/);
assert.match(characterPrompt, /characters\[\]\.prompt and characters\[\]\.referenceGenerationPrompt entirely in English/i);
assert.match(characterPrompt, /Preserve canonical proper names exactly/i);
assert.match(characterPrompt, /no readable text/i);

const pipelineControllerSource = readFileSync(new URL("../src/server/controllers/pipelineController.ts", import.meta.url), "utf8");
assert.match(pipelineControllerSource, /identityContinuityRisks: _\.castArray/);
assert.doesNotMatch(pipelineControllerSource, /identityContinuityRisks:not_resolved/);
assert.match(pipelineControllerSource, /getCinematicCharacterAnalysisPrompt/);
assert.doesNotMatch(pipelineControllerSource, /requiresCompleteArtifact \? 3 : 1/);

process.stdout.write(JSON.stringify({ passed: true, cinematicReferenceCount: cinematicReferences.referenceImages.length, automaticReferencesUnchanged: true }));
