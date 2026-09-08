import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getCinematicCharacterAnalysisPrompt } from "../src/constants/cinematicPrompts";
import { CINEMATIC_CHARACTER_PACK_CONFIG } from "../src/constants/cinematicConstants";
import { CINEMATIC_CHARACTER_ANALYSIS_RESPONSE_SCHEMA } from "../src/constants/responseSchemas";
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
assert.deepEqual(cinematicReferences.referenceImageNames, ["Kade Voss", "Varg"]);
assert.equal(cinematicReferences.referenceRoles.length, 2);

const inferredReferences = resolveCinematicSceneCharacterReferences(
  {
    ...scene,
    characterIds: ["char_kade"],
    prompt: "Kade prepares to fight",
    script: "Kade prepares to fight",
    generationPrompt: "Kade Voss and Varg charge toward each other.",
  },
  characters,
);
assert.deepEqual(inferredReferences.characterIds, ["char_kade", "char_varg"]);
assert.deepEqual(inferredReferences.referenceImageNames, ["Kade Voss", "Varg"]);

const exclusionAwareReferences = resolveCinematicSceneCharacterReferences(
  {
    ...scene,
    characterIds: ["char_kade", "char_varg"],
    generationPrompt: "Kade Voss stands alone. No Varg visible.",
  },
  characters,
);
assert.deepEqual(exclusionAwareReferences.characterIds, ["char_kade"]);
assert.deepEqual(exclusionAwareReferences.referenceImageNames, ["Kade Voss"]);

const automaticContext = createSceneGenerationContext(scene, { characters });
assert.deepEqual(automaticContext.referenceImages, []);

const characterPrompt = getCinematicCharacterAnalysisPrompt("Kade confronts Varg", "cinematic live action", "");
assert.match(characterPrompt, /referenceGenerationPrompt/);
assert.match(characterPrompt, /Create one effective Veo character-reference prompt/i);
assert.match(characterPrompt, /Design the appearance yourself/i);
assert.match(characterPrompt, /identity fields and referenceGenerationPrompt in English/i);
assert.match(characterPrompt, /high-quality 16:9 cinematic character reference sheet/i);
assert.match(characterPrompt, /full-body front and back views/i);
assert.match(characterPrompt, /three-quarter and side views/i);
assert.match(characterPrompt, /two clear face close-ups/i);
assert.match(characterPrompt, /signature weapon or prop separately/i);
assert.match(characterPrompt, /exact character name once/i);
assert.doesNotMatch(characterPrompt, /No extra views, panels, duplicate character, detached props/i);
assert.doesNotMatch(characterPrompt, /sourceIdentityEvidence|speciesPresentation|identityContinuityRisks|faceShape|timelineStages/i);
assert.deepEqual(CINEMATIC_CHARACTER_ANALYSIS_RESPONSE_SCHEMA.required, ["characters"]);
assert.deepEqual(CINEMATIC_CHARACTER_ANALYSIS_RESPONSE_SCHEMA.properties.characters.items.required, ["id", "name", "description", "referenceGenerationPrompt"]);
assert.equal(CINEMATIC_CHARACTER_ANALYSIS_RESPONSE_SCHEMA.properties.characters.maxItems, CINEMATIC_CHARACTER_PACK_CONFIG.MAX_CHARACTERS);

const pipelineControllerSource = readFileSync(new URL("../src/server/controllers/pipelineController.ts", import.meta.url), "utf8");
assert.match(pipelineControllerSource, /identityContinuityRisks: _\.castArray/);
assert.doesNotMatch(pipelineControllerSource, /identityContinuityRisks:not_resolved/);
assert.match(pipelineControllerSource, /getCinematicCharacterAnalysisPrompt/);
assert.doesNotMatch(pipelineControllerSource, /requiresCompleteArtifact \? 3 : 1/);

process.stdout.write(JSON.stringify({ passed: true, cinematicReferenceCount: cinematicReferences.referenceImages.length, automaticReferencesUnchanged: true }));
