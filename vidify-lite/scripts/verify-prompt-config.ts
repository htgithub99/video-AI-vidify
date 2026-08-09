import { writeVerificationLog } from "./verificationLogger.ts";
import fs from "fs";
import path from "path";
import { resolveVisualConfig } from "../src/services/autoVideoConfigResolver.ts";
import { applyBackgroundMode } from "../src/lib/imagePromptDirectives.ts";
import { BackgroundMode, GenerateType, ImageGeneratorEngine } from "../src/types.ts";
import { ResponseContractName, assertResponseContract } from "../src/server/services/responseContractService.ts";
import { resolveCorrectiveRetryLimit } from "../src/services/qualityProfileService.ts";
import { QualityMode } from "../src/types.ts";

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
assert(/if\s*\(config\.factCheck\).*groundedResearchResponse\s*=\s*await generateContentWithRetry/.test(controller), "grounded research is not conditional");
assertResponseContract({ audience: "general", versions: [{ id: "1" }] }, ResponseContractName.Hook);
assert(resolveCorrectiveRetryLimit(QualityMode.Economy) === 0, "economy corrective retry budget failed");
assert(resolveCorrectiveRetryLimit(QualityMode.Premium) === 1, "premium corrective retry budget failed");

const prompts = fs.readFileSync(path.resolve("src/constants/prompts.ts"), "utf8");
assert(prompts.includes("COMPACT_CINEMATIC_PROMPT_RULES"), "compact prompt module missing");

writeVerificationLog("Prompt/config conflict assertions passed");
