import { stringifyJson } from "../src/lib/jsonStringify.js";
import assert from "node:assert/strict";
import { StoryboardScene } from "../src/types.ts";
import { assessVoiceAdvisory } from "../src/services/voiceQualityRepairService.ts";
const originalFetch = globalThis.fetch;
let audioQaCalls = 0;
let voiceRepairCalls = 0;
let alignmentCalls = 0;
globalThis.fetch = (async (url: string | URL | Request) => {
  if (!String(url).includes("validate-audio")) {
    return new Response(stringifyJson({ error: "unexpected request" }), { status: 500 });
  }
  audioQaCalls += 1;
  return new Response(stringifyJson({ success: true, quality: { pronunciationScore: 40, pauseScore: 40, loudnessScore: 40, naturalnessScore: 40, emotionTransitionScore: 40, blockingErrors: [], warnings: ["below target"] } }), { status: 200 });
}) as typeof fetch;
const scenes = [{ id: "scene_1", chapterId: "chapter_1", startTime: "00:00", endTime: "00:30", duration: 30, script: "Source-grounded narration", subtitle: "Source-grounded narration", prompt: "A source-grounded visual", cameraMotion: "push_in" }] as StoryboardScene[];
try {
  const result = await assessVoiceAdvisory({ audioBase64: "real-original-audio", audioUrl: "", provider: "real-provider", scenes, targetDurationSeconds: 30 });
  assert.equal(audioQaCalls, 0);
  assert.equal(voiceRepairCalls, 0);
  assert.equal(alignmentCalls, 0);
  assert.equal(result.audioBase64, "real-original-audio");
  assert.equal(result.provider, "real-provider");
  assert.equal(result.quality.passed, true);
} finally {
  globalThis.fetch = originalFetch;
}
process.stdout.write("Voice advisory assertions passed.\n");
