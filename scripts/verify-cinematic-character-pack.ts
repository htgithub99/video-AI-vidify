import { resolveSourceTextConstants } from "./sourceTextAssertions";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getCinematicCharacterAnalysisPrompt } from "../src/constants/cinematicPrompts";
import { CINEMATIC_CHARACTER_PACK_CONFIG } from "../src/constants/cinematicConstants";
import { CINEMATIC_CHARACTER_ANALYSIS_RESPONSE_SCHEMA } from "../src/constants/responseSchemas";
import { createSceneGenerationContext, resolveCinematicSceneCharacterReferences } from "../src/services/sceneReferenceService";
import { CharacterConfig, StoryboardScene } from "../src/types";

const characters: CharacterConfig[] = [
  {
    id: "char_kade",
    name: "Kade Voss",
    description: "Bounty hunter",
    images: [],
    flowCharacterName: "Kade Voss",
    flowCharacterProjectId: "flow_project",
    flowCharacterProfileVersion: CINEMATIC_CHARACTER_PACK_CONFIG.FLOW_CHARACTER_PROFILE_VERSION,
  },
  {
    id: "char_varg",
    name: "Varg",
    description: "Crime lord",
    images: [],
    flowCharacterName: "Varg",
    flowCharacterProjectId: "flow_project",
    flowCharacterProfileVersion: CINEMATIC_CHARACTER_PACK_CONFIG.FLOW_CHARACTER_PROFILE_VERSION,
  },
  { id: "char_pilot", name: "Mira", description: "Pilot", images: ["/assets/mira.png"] },
];

const scene = { id: "sc_1", characterIds: ["char_kade", "char_varg"], prompt: "Kade confronts Varg", script: "Kade confronts Varg" } as StoryboardScene;
const cinematicReferences = resolveCinematicSceneCharacterReferences(scene, characters);
assert.deepEqual(cinematicReferences.characterIds, ["char_kade", "char_varg"]);
assert.deepEqual(cinematicReferences.referenceImages, []);
assert.deepEqual(cinematicReferences.referenceImageNames, []);
assert.deepEqual(cinematicReferences.referenceCharacterNames, ["Kade Voss", "Varg"]);

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
assert.deepEqual(inferredReferences.characterIds, ["char_kade"]);
assert.deepEqual(inferredReferences.referenceCharacterNames, ["Kade Voss"]);

const aiMembershipRemainsAuthoritative = resolveCinematicSceneCharacterReferences(
  {
    ...scene,
    characterIds: ["char_kade", "char_varg"],
    generationPrompt: "Kade Voss stands alone. No Varg visible.",
  },
  characters,
);
assert.deepEqual(aiMembershipRemainsAuthoritative.characterIds, ["char_kade", "char_varg"]);
assert.deepEqual(aiMembershipRemainsAuthoritative.referenceCharacterNames, ["Kade Voss", "Varg"]);

const explicitCharactersRemainAuthoritative = resolveCinematicSceneCharacterReferences(
  {
    id: "sc_explicit",
    characterIds: ["char_kade"],
    script: "Kade stands beneath a dark celestial sky in battle armor.",
    prompt: "Cinematic dark armor and celestial light.",
  } as StoryboardScene,
  characters,
);
assert.deepEqual(explicitCharactersRemainAuthoritative.characterIds, ["char_kade"]);
assert.deepEqual(explicitCharactersRemainAuthoritative.referenceCharacterNames, ["Kade Voss"]);

const automaticContext = createSceneGenerationContext(scene, { characters });
assert.deepEqual(automaticContext.referenceImages, []);

const characterPrompt = getCinematicCharacterAnalysisPrompt("Kade confronts Varg", "cinematic live action", "");
assert.match(characterPrompt, /referenceGenerationPrompt/);
assert.match(characterPrompt, /Create one effective Veo character-reference prompt/i);
assert.match(characterPrompt, /Design the appearance yourself/i);
assert.match(characterPrompt, /identity fields and referenceGenerationPrompt in English/i);
assert.match(characterPrompt, /reusable Flow Character/i);
assert.match(characterPrompt, /Show only that character/i);
assert.match(characterPrompt, /three-quarter standing view/i);
assert.match(characterPrompt, /plain or softly segmented neutral background/i);
assert.match(characterPrompt, /hands, feet and complete silhouette/i);
assert.match(characterPrompt, /no fused or extra limbs/i);
assert.match(characterPrompt, /Do not include another subject, scenery, story action, collage, turnaround sheet, duplicate body/i);
assert.match(characterPrompt, /exact character name/i);
assert.doesNotMatch(characterPrompt, /sourceIdentityEvidence|speciesPresentation|identityContinuityRisks|faceShape|timelineStages/i);
assert.deepEqual(CINEMATIC_CHARACTER_ANALYSIS_RESPONSE_SCHEMA.required, ["characters"]);
assert.deepEqual(CINEMATIC_CHARACTER_ANALYSIS_RESPONSE_SCHEMA.properties.characters.items.required, ["id", "name", "description", "referenceGenerationPrompt"]);
assert.equal(CINEMATIC_CHARACTER_ANALYSIS_RESPONSE_SCHEMA.properties.characters.maxItems, CINEMATIC_CHARACTER_PACK_CONFIG.MAX_CHARACTERS);

const pipelineControllerSource = resolveSourceTextConstants(readFileSync(new URL("../src/server/controllers/pipelineController.ts", import.meta.url), "utf8"));
const pipelineSource = resolveSourceTextConstants(readFileSync(new URL("../src/hooks/useAutoVideoPipeline.ts", import.meta.url), "utf8"));
const imageGeneratorSource = resolveSourceTextConstants(readFileSync(new URL("../src/server/services/imageGeneratorService.ts", import.meta.url), "utf8"));
assert.match(pipelineControllerSource, /identityContinuityRisks: _\.castArray/);
assert.doesNotMatch(pipelineControllerSource, /identityContinuityRisks:not_resolved/);
assert.match(pipelineControllerSource, /getCinematicCharacterAnalysisPrompt/);
assert.doesNotMatch(pipelineControllerSource, /requiresCompleteArtifact \? 3 : 1/);
assert.match(pipelineControllerSource, /ENSURE_FLOW_CHARACTERS/);
assert.match(pipelineSource, /PIPELINE_ENSURE_FLOW_CHARACTERS/);
assert.match(pipelineSource, /referenceCharacterNames: requestContext\.referenceCharacterNames/);
assert.doesNotMatch(pipelineSource, /hasCompleteCharacterReferences/);
assert.match(imageGeneratorSource, /attachFlowCharactersByName/);
assert.match(imageGeneratorSource, /FLOW_CHARACTER_CONFIG\.CHARACTER_FILTER/);
assert.match(imageGeneratorSource, /ensureFlowCharacters/);
assert.match(imageGeneratorSource, /captureFlowCharacterReference/);
assert.match(imageGeneratorSource, /imageUrl/);
assert.match(pipelineSource, /characterImages: _\.compact/);

process.stdout.write(
  JSON.stringify({ passed: true, cinematicFlowCharacterCount: cinematicReferences.referenceCharacterNames.length, automaticReferencesUnchanged: true }),
);
