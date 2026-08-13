import assert from "node:assert/strict";
import { AssetsMode, ImageGeneratorEngine } from "../src/types.ts";
import { validateAudioQuality } from "../src/services/audioQualityService.ts";
import { generateCharacterReferenceLibrary } from "../src/services/characterReferenceService.ts";
import { validateFinalVideo } from "../src/services/finalMultimodalQualityService.ts";
import { validateAndRepairVisualAsset } from "../src/services/visualAssetRepairService.ts";

const originalFetch = globalThis.fetch;
let sceneQaCalls = 0;
let imageGenerationCalls = 0;
let audioQaCalls = 0;
let finalQaCalls = 0;
let characterQaCalls = 0;

const lowSceneQuality = {
  anatomy: 40,
  subjectCount: 40,
  promptAlignment: 40,
  characterConsistency: 40,
  composition: 40,
  styleConsistency: 40,
  editability: 40,
  usableForVideo: true,
  blockingErrors: [],
  warnings: ["below target"],
};

const lowFinalQuality = {
  visualScore: 40,
  cropScore: 40,
  continuityScore: 40,
  pacingScore: 40,
  transitionVarietyScore: 40,
  promiseAlignmentScore: 40,
  audioMixScore: 40,
  subtitleLegibilityScore: 40,
  blockingErrors: [],
  warnings: ["below target"],
};

globalThis.fetch = (async (url: string | URL | Request) => {
  const target = String(url);
  if (target.includes("validate-scene-image")) {
    sceneQaCalls += 1;
    return new Response(JSON.stringify({ success: true, quality: lowSceneQuality }), { status: 200 });
  }
  if (target.includes("generate-image")) {
    imageGenerationCalls += 1;
    return new Response(JSON.stringify({ success: true, base64: "cmVhbC1yZXBhaXJlZC1pbWFnZQ==" }), { status: 200 });
  }
  if (target.includes("validate-character-reference")) {
    characterQaCalls += 1;
    return new Response(JSON.stringify({
      success: true,
      quality: {
        identityConsistencyScore: 40,
        viewCoverageScore: 40,
        styleConsistencyScore: 40,
        anatomyScore: 40,
        usableAsReference: true,
        blockingErrors: [],
      },
    }), { status: 200 });
  }
  if (target.includes("validate-audio")) {
    audioQaCalls += 1;
    return new Response(JSON.stringify({ success: true, quality: {
      pronunciationScore: 40,
      pauseScore: 40,
      loudnessScore: 40,
      naturalnessScore: 40,
      emotionTransitionScore: 40,
      blockingErrors: [],
      warnings: ["below target"],
    } }), { status: 200 });
  }
  if (target.includes("validate-final-video")) {
    finalQaCalls += 1;
    return new Response(JSON.stringify({ success: true, quality: lowFinalQuality }), { status: 200 });
  }
  return new Response(JSON.stringify({ error: "unexpected request" }), { status: 500 });
}) as typeof fetch;

try {
  const visualResult = await validateAndRepairVisualAsset({
    projectId: "project_1",
    target: {
      id: "scene_1",
      script: "A real scene",
      prompt: "A real scene, medium shot",
      assetUrl: "real-original-image",
    },
    style: "editorial illustration",
    resolution: "Standard",
    engine: ImageGeneratorEngine.Imagen,
    visualConfig: {},
    sandboxConfig: {},
  });
  assert.equal(sceneQaCalls, 2);
  assert.equal(imageGenerationCalls, 1);
  assert.equal(visualResult.approved, false);
  assert.equal(visualResult.repaired, true);
  assert.match(visualResult.assetUrl, /^data:image/);

  const audioResult = await validateAudioQuality("real-audio", "A real script", 60, 60);
  assert.equal(audioQaCalls, 1);
  assert.equal(audioResult.passed, false);

  const characterResult = await generateCharacterReferenceLibrary({
    projectId: "character-repair",
    characters: [{
      id: "character_1",
      name: "Real character",
      description: "Source-grounded identity",
      images: ["/assets/projects/character-repair/references/original.png"],
      referenceApproved: true,
    }],
    visualConfig: {
      source: "auto",
      style: "editorial illustration",
      quality: "Standard",
      density: 5,
      characterConsistency: true,
      assetsMode: AssetsMode.Mixed,
    },
  });
  assert.equal(characterQaCalls, 2);
  assert.equal(imageGenerationCalls, 2);
  assert.equal(characterResult[0].referenceApproved, false);
  assert.equal(characterResult[0].images.includes("/assets/projects/character-repair/references/original.png"), true);

  const finalResult = await validateFinalVideo("real-video", "A real script", "A real promise");
  assert.equal(finalQaCalls, 2);
  assert.equal(finalResult.passed, false);
  assert.equal(finalResult.reviewAvailable, true);
} finally {
  globalThis.fetch = originalFetch;
}

process.stdout.write("QA retry behavior assertions passed.\n");
