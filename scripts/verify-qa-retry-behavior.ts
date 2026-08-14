import assert from "node:assert/strict";
import { createAdvisoryAudioQuality } from "../src/services/audioQualityService.ts";
import { createAdvisoryFinalVideoReport } from "../src/services/finalMultimodalQualityService.ts";
import { acceptGeneratedThumbnail } from "../src/services/thumbnailQualityPipelineService.ts";

const originalFetch = globalThis.fetch;
let sceneQaCalls = 0;
let imageGenerationCalls = 0;
let audioQaCalls = 0;
let finalQaCalls = 0;

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
  const visualResult = acceptGeneratedThumbnail({
    id: "thumbnail_1",
    prompt: "A real thumbnail, medium shot",
    style: "editorial illustration",
    imageUrl: "real-original-image",
  } as any);
  assert.equal(sceneQaCalls, 0);
  assert.equal(imageGenerationCalls, 0);
  assert.equal(visualResult.approved, true);
  assert.equal(visualResult.imageUrl, "real-original-image");

  const audioResult = createAdvisoryAudioQuality(60, 60);
  assert.equal(audioQaCalls, 0);
  assert.equal(audioResult.passed, true);

  const finalResult = createAdvisoryFinalVideoReport();
  assert.equal(finalQaCalls, 0);
  assert.equal(finalResult.passed, true);
  assert.equal(finalResult.reviewAvailable, false);
} finally {
  globalThis.fetch = originalFetch;
}

process.stdout.write("QA advisory behavior assertions passed.\n");
