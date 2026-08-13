import assert from "node:assert/strict";
import { StoryboardScene } from "../src/types.ts";
import { validateAndRepairVoice } from "../src/services/voiceQualityRepairService.ts";

const originalFetch = globalThis.fetch;
let audioQaCalls = 0;
let voiceRepairCalls = 0;
let alignmentCalls = 0;

globalThis.fetch = (async (url: string | URL | Request) => {
  if (!String(url).includes("validate-audio")) {
    return new Response(JSON.stringify({ error: "unexpected request" }), { status: 500 });
  }
  audioQaCalls += 1;
  return new Response(JSON.stringify({
    success: true,
    quality: {
      pronunciationScore: 40,
      pauseScore: 40,
      loudnessScore: 40,
      naturalnessScore: 40,
      emotionTransitionScore: 40,
      blockingErrors: [],
      warnings: ["below target"],
    },
  }), { status: 200 });
}) as typeof fetch;

const scenes = [{
  id: "scene_1",
  chapterId: "chapter_1",
  startTime: "00:00",
  endTime: "00:30",
  duration: 30,
  script: "Source-grounded narration",
  subtitle: "Source-grounded narration",
  prompt: "A source-grounded visual",
  cameraMotion: "push_in",
}] as StoryboardScene[];

try {
  const result = await validateAndRepairVoice({
    audioBase64: "real-original-audio",
    audioUrl: "",
    provider: "real-provider",
    script: "Source-grounded narration",
    scenes,
    targetDurationSeconds: 30,
    regenerateVoice: async () => {
      voiceRepairCalls += 1;
      return { audioBase64: "real-repaired-audio", provider: "real-repair-provider" };
    },
    alignVoice: async (_audioBase64, alignedScenes) => {
      alignmentCalls += 1;
      return alignedScenes;
    },
  });

  assert.equal(audioQaCalls, 2);
  assert.equal(voiceRepairCalls, 1);
  assert.equal(alignmentCalls, 1);
  assert.equal(result.audioBase64, "real-repaired-audio");
  assert.equal(result.provider, "real-repair-provider");
  assert.equal(result.repairAttempted, true);
  assert.equal(result.repaired, true);
  assert.equal(result.quality.passed, false);
} finally {
  globalThis.fetch = originalFetch;
}

process.stdout.write("Voice quality repair assertions passed.\n");
