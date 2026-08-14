import { writeVerificationLog } from "./verificationLogger.ts";
import { resolveUsableHooks } from "../src/services/hookResilienceService.ts";
import { acquirePipelineRunLease, releasePipelineRunLease } from "../src/services/pipelineRunLockService.ts";
import { applyProfessionalEditingPolicy } from "../src/services/editingPolicyService.ts";
import { createAudioCueSheet } from "../src/services/soundDesignService.ts";
import fs from "node:fs";

const values = new Map<string, string>();
const sessionValues = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
});
Object.defineProperty(globalThis, "sessionStorage", {
  value: {
    getItem: (key: string) => sessionValues.get(key) ?? null,
    setItem: (key: string, value: string) => sessionValues.set(key, value),
    removeItem: (key: string) => sessionValues.delete(key),
  },
});
const assert = (value: unknown, message: string): void => {
  if (!value) throw new Error(message);
};

const sourceHookText = "A real opening sentence from the supplied script.";
const fallbackHooks = resolveUsableHooks([], "Auto", 3, sourceHookText);
assert(fallbackHooks.length === 1 && fallbackHooks[0].content === sourceHookText, "source hook fallback changed the supplied content");
const first = acquirePipelineRunLease("project_1");
const duplicate = acquirePipelineRunLease("project_1");
assert(first.acquired && !duplicate.acquired, "duplicate pipeline run was accepted");
releasePipelineRunLease(first);
assert(acquirePipelineRunLease("project_1").acquired, "pipeline lease was not released");
const autoGeneratorSource = fs.readFileSync("src/components/AutoVideoGenerator.tsx", "utf8");
const previewSource = fs.readFileSync("src/components/auto-video/PreviewPanelSection.tsx", "utf8");
assert(/const handleStartAutoGenerate[\s\S]*: Promise<void> =>/.test(autoGeneratorSource), "pipeline start promise is not exposed to regeneration");
assert(/await handleStartAutoGenerate\(\{/.test(autoGeneratorSource), "regeneration does not await the active pipeline");
assert(/finally \{\s*setLoadingTarget\(null\)/.test(previewSource), "regeneration loading state can remain stuck");

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
