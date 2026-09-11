import assert from "node:assert/strict";
import { createCharacterIdentityBlocks, createSceneGenerationContext } from "../src/services/sceneReferenceService.ts";
import { CharacterConfig, StoryboardScene } from "../src/types.ts";
import { writeVerificationLog } from "./verificationLogger.ts";
import { normalizeExtractedStyle } from "../src/services/styleReferenceService.ts";
import fs from "node:fs";
import path from "node:path";

const autoPipelineSource = fs.readFileSync(path.resolve("src/hooks/useAutoVideoPipeline.ts"), "utf8");
assert.doesNotMatch(autoPipelineSource, /response\.data\??\.urls/, "Character references read the wrong persistence field");

const characters: CharacterConfig[] = [
  {
    id: "char_1",
    name: "Player",
    description: "An anxious gambler",
    prompt: "Asian male gambler with messy black hair, grey shirt, silver wristwatch, cinematic lighting, sharp detail",
    hair: "messy black hair",
    signatureClothing: "grey shirt",
    accessories: "silver wristwatch",
    images: ["/assets/projects/test/references/character/player.png"],
  },
  {
    id: "char_2",
    name: "Hostess",
    description: "A welcoming hostess",
    prompt: "Asian female hostess with long brown hair and burgundy blouse",
    hair: "long brown hair",
    signatureClothing: "burgundy blouse",
    images: ["/assets/projects/test/references/character/hostess.png"],
  },
];

const scene = {
  id: "sc_1",
  prompt: "The Hostess gestures toward a gaming table, medium shot composition --ar 16:9",
  script: "The hostess invites another bet.",
  subtitle: "The hostess invites another bet.",
  characterIds: ["char_2"],
  expectedSubjectCount: 1,
  allowBackgroundPeople: false,
  layout: "single_frame",
  textAllowed: false,
} as StoryboardScene;

const context = createSceneGenerationContext(scene, {
  characters,
  styleReferenceImages: ["/assets/projects/test/references/style/style.png"],
  sceneReferenceImages: ["/assets/projects/test/references/scene/scene.png"],
});
assert.deepEqual(context.referenceImages, []);
assert.equal(context.prompt, scene.prompt);

const nodeContext = createSceneGenerationContext(scene, {
  characters,
  styleReferenceImages: ["/assets/projects/test/references/style/style.png"],
  sceneReferenceImages: [],
});
assert.deepEqual(nodeContext.referenceImages, []);
assert.equal(nodeContext.prompt, scene.prompt);

const finalizedPrompt = "Complete AI-authored scene prompt with identity, white canvas, no text, and medium shot";
const finalizedContext = createSceneGenerationContext({
  ...scene,
  prompt: `${finalizedPrompt} --ar 16:9`,
}, {
  characters,
  styleReferenceImages: ["/assets/projects/test/references/style/style.png"],
  sceneReferenceImages: [],
});
assert.equal(finalizedContext.prompt, `${finalizedPrompt} --ar 16:9`);
assert.deepEqual(finalizedContext.referenceImages, []);

const multiCharacterContext = createSceneGenerationContext({
  ...scene,
  characterIds: ["char_1", "char_2"],
  expectedSubjectCount: 2,
  prompt: "The Player watches while the Hostess lifts the bowl, medium wide shot --ar 16:9",
}, {
  characters,
  styleReferenceImages: [],
  sceneReferenceImages: [],
});
assert.equal(multiCharacterContext.prompt, "The Player watches while the Hostess lifts the bowl, medium wide shot --ar 16:9");
assert.equal(multiCharacterContext.referenceImages.length, 0);

const objectOnlyContext = createSceneGenerationContext({
  ...scene,
  characterIds: [],
  expectedSubjectCount: 1,
  prompt: "A ceramic bowl covers four gaming pieces, overhead shot --ar 16:9",
  script: "A bowl covers four pieces.",
  subtitle: "A bowl covers four pieces.",
}, {
  characters,
  styleReferenceImages: [],
  sceneReferenceImages: [],
});
assert.doesNotMatch(objectOnlyContext.prompt, /CHARACTER 1 —/i);
assert.equal(objectOnlyContext.prompt, "A ceramic bowl covers four gaming pieces, overhead shot --ar 16:9");

const unassignedScene = {
  ...scene,
  characterIds: undefined,
  prompt: "Asian male gambler with messy black hair in a grey shirt checks his silver wristwatch, medium shot composition",
  script: "The player considers one final bet.",
  subtitle: "The player considers one final bet.",
};
assert.deepEqual(
  createSceneGenerationContext(unassignedScene as StoryboardScene, { characters }).characterIds,
  [],
  "application code must not infer creative character membership from prompt text",
);

const explicitEmptyScene = {
  ...scene,
  characterIds: [],
  prompt: "Officials inspect legal documents, medium shot composition",
  script: "This practical solution helps the community.",
  subtitle: "This practical solution helps the community.",
};
assert.deepEqual(createSceneGenerationContext(explicitEmptyScene, { characters }).characterIds, []);
const unnamedPeopleContext = createSceneGenerationContext(explicitEmptyScene, {
  characters,
  styleReferenceImages: [],
  sceneReferenceImages: [],
});
assert.doesNotMatch(unnamedPeopleContext.prompt, /objects or environment only/i);

const identityBlocks = createCharacterIdentityBlocks(characters);
assert.match(identityBlocks, /Exactly 2 recurring main characters/i);
assert.match(identityBlocks, /CHARACTER 1 — PLAYER/i);
assert.match(identityBlocks, /CHARACTER 2 — HOSTESS/i);
assert.match(identityBlocks, /Keep each character visually distinct and preserve their identity/i);
assert.doesNotMatch(identityBlocks, /cinematic lighting|sharp detail/i);

const extractedStickmanStyle = "chibi stickman, bean torso, white background, subtle highlights, stable hair silhouettes";
assert.equal(normalizeExtractedStyle(extractedStickmanStyle), extractedStickmanStyle);

writeVerificationLog("Scene reference assertions passed");
