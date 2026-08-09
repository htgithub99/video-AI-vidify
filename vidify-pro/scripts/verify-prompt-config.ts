import fs from "fs";
import path from "path";
import { resolveVisualConfig } from "../src/services/autoVideoConfigResolver.ts";
import { applyBackgroundMode } from "../src/lib/imagePromptDirectives.ts";
import { BackgroundMode, GenerateType, ImageGeneratorEngine } from "../src/types.ts";

const assert = (condition: unknown, message: string): void => {
  if (!condition) throw new Error(message);
};

const blockedVideoConfig = resolveVisualConfig({
  generateType: GenerateType.Video,
  imageGeneratorEngine: ImageGeneratorEngine.Imagen,
} as any);
assert(blockedVideoConfig.blocked, "unsupported video/image-engine conflict was not blocked");
const textIdentityConfig = resolveVisualConfig({ characterConsistency: true, characterPrompt: "Vietnamese man in his forties, short black hair, worn navy jacket" } as any);
assert(textIdentityConfig.config.characterConsistency, "textual character identity was incorrectly disabled");

const prompt = "A cinematic street scene --ar 16:9";
const compiledOnce = applyBackgroundMode(prompt, BackgroundMode.Auto);
const compiledTwice = applyBackgroundMode(compiledOnce, BackgroundMode.Auto);
assert(compiledOnce === compiledTwice, "prompt directive compiler is not idempotent");
assert((compiledTwice.match(/--ar\s+\d+:\d+/g) || []).length === 1, "aspect ratio was duplicated");

const controller = fs.readFileSync(path.resolve("src/server/controllers/pipelineController.ts"), "utf8");
assert(/config\.factCheck\s*\?\s*await generateContentWithRetry/.test(controller), "grounded research is not conditional");

console.log("Prompt/config conflict assertions passed");
