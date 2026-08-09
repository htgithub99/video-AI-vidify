import assert from "node:assert/strict";
import fs from "node:fs";
import { applyVoiceSelection, resolveVoiceRouting } from "../src/lib/voiceRouting.ts";
import { AudioType, Gender, AgeGroup } from "../src/types.ts";
import { writeVerificationLog } from "./verificationLogger.ts";

const vbeeRoute = resolveVoiceRouting({ provider: "vbee", voiceId: "pro-trainer-id" });
assert.equal(vbeeRoute.finalVoiceId, "pro-trainer-id");

const inferredVbeeRoute = resolveVoiceRouting({ voiceId: "vbee-pro-trainer" });
assert.equal(inferredVbeeRoute.finalVoiceId, "vbee-pro-trainer");

assert.equal(resolveVoiceRouting({ provider: "vbee" }).finalVoiceId, "edge_vi-VN-HoaiMyNeural");

const presetRoute = resolveVoiceRouting({ provider: "AI33Pro", voiceId: "preset-vi-bac-female" });
assert.equal(presetRoute.finalVoiceId, "edge_vi-VN-HoaiMyNeural");

const pipelineControllerSource = fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8");
assert.match(pipelineControllerSource, /EXTERNAL_URLS\.AI33_TTS/);
const voiceImplementationSource = [
  pipelineControllerSource,
  fs.readFileSync("src/constants/apiRoutes.ts", "utf8"),
  fs.readFileSync("src/constants/defaultConfigs.ts", "utf8"),
  fs.readFileSync("src/lib/voiceRouting.ts", "utf8"),
].join("\n");
assert.doesNotMatch(voiceImplementationSource, /freeTts|translate_tts|ttsfree|DEFAULT_AI33_TOKEN/i);

const project = {
  id: "voice-routing-test",
  name: "Voice routing test",
  description: "",
  createdAt: "",
  updatedAt: "",
  creditsUsed: 0,
  input: {} as never,
  config: {} as never,
  hookConfig: {} as never,
  visualConfig: {} as never,
  voiceConfig: {
    provider: "AI33Pro",
    voiceURI: "preset-vi-bac-female",
    audioType: AudioType.TTS,
    gender: Gender.Female,
    age: AgeGroup.Adult,
    emotion: "neutral",
    speed: 1,
    audioBase64: "old-global-audio",
    audioUrl: "old-global-url",
  },
  storyboard: [{
    id: "scene-1",
    chapterId: "chapter-1",
    startTime: "00:00",
    endTime: "00:05",
    duration: 5,
    script: "Test",
    subtitle: "Test",
    prompt: "Test",
    cameraMotion: "static",
    audioBase64: "old-scene-audio",
    audioUrl: "old-scene-url",
  }],
};

const updatedProject = applyVoiceSelection(project, {
  provider: "vbee",
  voiceURI: "pro-trainer-id",
  voiceName: "Pro Trainer",
});
assert.equal(updatedProject.voiceConfig.audioBase64, "");
assert.equal(updatedProject.voiceConfig.audioUrl, "");
assert.equal(updatedProject.storyboard?.[0].audioBase64, undefined);
assert.equal(updatedProject.storyboard?.[0].audioUrl, undefined);

const unchangedProject = applyVoiceSelection(project, {
  provider: "AI33Pro",
  voiceURI: "preset-vi-bac-female",
});
assert.equal(unchangedProject.voiceConfig.audioBase64, "old-global-audio");
assert.equal(unchangedProject.storyboard?.[0].audioBase64, "old-scene-audio");

writeVerificationLog("AI33Pro voice routing assertions passed");
