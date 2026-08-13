import { writeVerificationLog } from "./verificationLogger.ts";
import { AVAILABLE_MODELS } from "../src/constants/data.ts";
import { classifyGeminiError, GeminiErrorCategory, getGeminiUserMessage } from "../src/server/services/geminiErrorClassifier.ts";
import { estimateGeminiContents } from "../src/server/services/geminiService.ts";
import { AiTaskCapability, routeAiTask } from "../src/server/services/taskRouterService.ts";

const assert = (value: unknown, message: string): void => {
  if (!value) throw new Error(message);
};

assert(AVAILABLE_MODELS[0] === "gemini-3-flash" && AVAILABLE_MODELS.includes("gemini-3.5-flash-lite"), "Gemini visual fallback order is invalid");
assert(new Set(AVAILABLE_MODELS).size === AVAILABLE_MODELS.length, "Gemini models were duplicated");
assert(!AVAILABLE_MODELS.includes("gemini-2.5-flash" as never), "retired model remained enabled");
assert(!AVAILABLE_MODELS.includes("gemini-3.1-pro-preview" as never), "zero-quota preview remained enabled");
assert(classifyGeminiError({ status: 404, message: "model no longer available" }).category === GeminiErrorCategory.UnsupportedModel, "404 classification failed");
assert(classifyGeminiError({ status: 429, message: "free_tier_requests, limit: 0" }).category === GeminiErrorCategory.ZeroQuota, "zero quota classification failed");
assert(!classifyGeminiError({ status: 429, message: "requests per day quota" }).retryable, "daily quota was retryable");
assert(classifyGeminiError({ status: 429, message: "retry in 3s" }).retryLimit === 1, "rate limit retry policy failed");
assert(getGeminiUserMessage({ status: 429, message: "free_tier_requests, limit: 0" }, true).includes("hạn mức"), "localized quota message failed");

const textRoute = routeAiTask({ capability: AiTaskCapability.FactualReview, estimatedInputTokens: 100, maxOutputTokens: 100 });
assert(textRoute.models.every(model => model.includes("lite")), "text routing included a visual-only model");
const visualRoute = routeAiTask({ capability: AiTaskCapability.StyleExtraction, estimatedInputTokens: 100, mediaInputCount: 1, maxOutputTokens: 100 });
assert(visualRoute.models[0] === "gemini-3-flash" && visualRoute.models.length === 2, "visual routing excluded the preferred model or fallback");

const estimate = estimateGeminiContents([
  { inlineData: { mimeType: "image/png", data: "A".repeat(2_500_000) } },
  { text: "Inspect this image" },
]);
assert(estimate.mediaInputCount === 1 && estimate.estimatedTextTokens < 100, "base64 image was counted as text tokens");

writeVerificationLog("Gemini routing assertions passed");
