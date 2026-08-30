import assert from "node:assert/strict";
import { getCharacterAnalysisPrompt } from "../src/constants/prompts";
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

const characterPrompt = getCharacterAnalysisPrompt("Kade confronts Varg", "cinematic live action");
assert.match(characterPrompt, /referenceGenerationPrompt/);
assert.match(characterPrompt, /identity reference for image-to-video continuity/i);
assert.match(characterPrompt, /scene wardrobe, action, location, damage, and lighting remain controlled/i);

process.stdout.write(JSON.stringify({ passed: true, cinematicReferenceCount: cinematicReferences.referenceImages.length, automaticReferencesUnchanged: true }));
