import { writeVerificationLog } from "./verificationLogger.ts";
import { createSafeFallbackHook, resolveUsableHooks } from "../src/services/hookResilienceService.ts";
import { acquirePipelineRunLease, releasePipelineRunLease } from "../src/services/pipelineRunLockService.ts";
import { ProjectLanguage } from "../src/types.ts";
import { applyProfessionalEditingPolicy } from "../src/services/editingPolicyService.ts";
import { createAudioCueSheet } from "../src/services/soundDesignService.ts";

const values = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
});
const assert = (value: unknown, message: string): void => {
  if (!value) throw new Error(message);
};

const fallback = createSafeFallbackHook("kiểm thử", ProjectLanguage.VI, "Auto");
assert(fallback.selected && fallback.content.length > 0, "hook fallback failed");
const fallbackHooks = resolveUsableHooks([], "kiểm thử", ProjectLanguage.VI, "Auto", 3);
assert(fallbackHooks.length === 3 && fallbackHooks[0].selected, "empty hooks were not recovered with enough variants");
const first = acquirePipelineRunLease("project_1");
const duplicate = acquirePipelineRunLease("project_1");
assert(first.acquired && !duplicate.acquired, "duplicate pipeline run was accepted");
releasePipelineRunLease(first);
assert(acquirePipelineRunLease("project_1").acquired, "pipeline lease was not released");

const editScenes = applyProfessionalEditingPolicy([
  { id: "s1", chapterId: "c1", duration: 5, effects: "dreamy", lightingEffect: "spotlight", transition: "cross_dissolve", cameraMotion: "handheld_soft" },
  { id: "s2", chapterId: "c1", duration: 5, effects: "sad_vignette", lightingEffect: "god_rays", transition: "cross_dissolve", cameraMotion: "static" },
  { id: "s3", chapterId: "c2", duration: 5, effects: "film_grain", lightingEffect: "golden_glow", transition: "glitch_transition", cameraMotion: "static" },
] as any, {
  colorPalette: "flat solid colors, no gradients",
  characterSpecs: "",
  landscapeSpecs: "",
  lightingMood: "no shading",
});
assert(editScenes[0].effects === "" && editScenes[0].lightingEffect === "natural_light" && editScenes[0].cameraMotion === "drift", "flat-style effect policy failed");
assert(editScenes[1].transition === "fade_black" && editScenes[2].transition === "cut", "chapter transition policy failed");
const cueSheet = createAudioCueSheet([
  { id: "s1", duration: 5, script: "A character waits", prompt: "one character portrait" },
] as any);
assert(!cueSheet.cues.some(cue => cue.description === "vehicle movement"), "character falsely triggered car sound effect");

writeVerificationLog("Pipeline resilience assertions passed");
