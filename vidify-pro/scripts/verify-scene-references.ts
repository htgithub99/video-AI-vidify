import assert from "node:assert/strict";
import {
  createCanonicalCharacterPrompt,
  createSceneGenerationContext,
  resolveSceneCharacterIds,
} from "../src/services/sceneReferenceService.ts";
import { CharacterConfig, StoryboardScene } from "../src/types.ts";
import { writeVerificationLog } from "./verificationLogger.ts";
import { normalizeExtractedStyle } from "../src/services/styleReferenceService.ts";

const characters: CharacterConfig[] = [
  {
    id: "char_1",
    name: "Player",
    description: "An anxious gambler",
    prompt:
      "Asian male gambler with messy black hair, grey shirt, silver wristwatch",
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
  prompt: "The Hostess gestures toward a gaming table, medium shot composition",
  script: "The hostess invites another bet.",
  subtitle: "The hostess invites another bet.",
  characterIds: ["char_2"],
  expectedSubjectCount: 1,
  allowBackgroundPeople: false,
  layout: "single_frame",
  textAllowed: false,
} as StoryboardScene;
assert.deepEqual(resolveSceneCharacterIds(scene, characters), ["char_2"]);
const context = createSceneGenerationContext(scene, {
  characters,
  styleReferenceImages: ["/assets/projects/test/references/style/style.png"],
  sceneReferenceImages: ["/assets/projects/test/references/scene/scene.png"],
});
assert.deepEqual(context.referenceImages, [
  "/assets/projects/test/references/style/style.png",
  "/assets/projects/test/references/character/hostess.png",
  "/assets/projects/test/references/scene/scene.png",
]);
assert.match(context.prompt, /exactly 1 primary subject/i);
assert.match(context.prompt, /never a collage/i);
assert.match(context.prompt, /no background people/i);
assert.match(context.prompt, /no readable text/i);
assert.match(context.prompt, /image 1 only for art style/i);
assert.match(
  context.prompt,
  /image 2 to preserve the exact identity and outfit of Hostess/i,
);

const inferredScene = {
  ...scene,
  characterIds: undefined,
  prompt:
    "Asian male gambler with messy black hair in a grey shirt checks his silver wristwatch, medium shot composition",
  script: "The player considers one final bet.",
  subtitle: "The player considers one final bet.",
};
assert.deepEqual(resolveSceneCharacterIds(inferredScene, characters), [
  "char_1",
]);
const canonicalPrompt = createCanonicalCharacterPrompt(
  characters[0],
  "flat chibi stickman illustration",
);
assert.match(canonicalPrompt, /single full-body canonical design/i);
assert.match(canonicalPrompt, /never a collage/i);
assert.match(canonicalPrompt, /no readable text/i);
const extractedStickmanStyle =
  "chibi stickman, bean torso, white background, subtle highlights, stable hair silhouettes";
assert.equal(
  normalizeExtractedStyle(extractedStickmanStyle),
  extractedStickmanStyle,
);
writeVerificationLog("Scene reference assertions passed");
