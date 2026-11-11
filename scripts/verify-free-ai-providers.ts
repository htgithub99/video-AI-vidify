import { stringifyJson } from "../src/lib/jsonStringify.js";
import { writeVerificationLog } from "./verificationLogger.ts";
import { FREE_AI_PROVIDER_CONFIG } from "../src/constants/config.ts";
import { generateWithFreeProviders } from "../src/server/services/freeAiProviderService.ts";
const assert = (value: unknown, message: string): void => {
  if (!value) throw new Error(message);
};
assert(!FREE_AI_PROVIDER_CONFIG.CEREBRAS.models.includes("gpt-oss-120b" as never), "Removed gpt-oss-120b remained in Cerebras models");
assert(!FREE_AI_PROVIDER_CONFIG.GROQ.models.includes("openai/gpt-oss-120b" as never), "Removed openai/gpt-oss-120b remained in Groq models");
assert(!FREE_AI_PROVIDER_CONFIG.GROQ.models.includes("qwen/qwen3.6-27b" as never), "Removed qwen/qwen3.6-27b remained in Groq models");
assert(!FREE_AI_PROVIDER_CONFIG.GROQ.scriptModels.includes("openai/gpt-oss-120b" as never), "Removed openai/gpt-oss-120b remained in Groq scriptModels");
assert(!FREE_AI_PROVIDER_CONFIG.GROQ.scriptModels.includes("qwen/qwen3.6-27b" as never), "Removed qwen/qwen3.6-27b remained in Groq scriptModels");
const originalFetch = globalThis.fetch;
let requestedUrl = "";
let requestedModel = "";
let requestedContent = "";
let fetchCount = 0;
globalThis.fetch = (async (url: any, init: any) => {
  fetchCount += 1;
  requestedUrl = String(url);
  const body = JSON.parse(init.body);
  requestedModel = body.model;
  requestedContent = body.messages[0].content;
  return new Response(stringifyJson({ choices: [{ message: { content: '{"passed":true}' } }], usage: { prompt_tokens: 12, completion_tokens: 6 } }), { status: 200, headers: { "Content-Type": "application/json" } });
}) as typeof fetch;
try {
  const result = await generateWithFreeProviders({ contents: "Return JSON", config: { responseMimeType: "application/json" } }, { cerebrasKey: "test-cerebras", groqKey: "test-groq" });
  assert(requestedUrl.includes("cerebras.ai"), "Cerebras was not first");
  assert(requestedModel === "zai-glm-4.7", "Unexpected primary free model");
  assert(result.response?.aiMetadata?.provider === "cerebras", "Provider metadata missing");
  await generateWithFreeProviders({ contents: [{ role: "user", parts: [{ text: "Nested free text" }] }] }, { cerebrasKey: "test-cerebras", groqKey: "test-groq" });
  assert(requestedContent.includes("Nested free text"), "Nested text payload skipped free providers");
  const beforeMediaFetch = fetchCount;
  const mediaResult = await generateWithFreeProviders({ contents: [{ inlineData: { mimeType: "image/png", data: "AA==" } }, { text: "Inspect this image" }] }, { cerebrasKey: "test-cerebras", groqKey: "test-groq" });
  assert(!mediaResult.response && fetchCount === beforeMediaFetch, "Multimodal request was incorrectly sent to a text-only free provider");
  const researched = await generateWithFreeProviders({ contents: "Research", config: { tools: [{ googleSearch: {} }] } }, { cerebrasKey: "test-cerebras", groqKey: "test-groq" });
  assert(researched.response?.aiMetadata?.model === "groq/compound-mini", "Free tool model was not used");
  writeVerificationLog("Free AI provider assertions passed");
} finally {
  globalThis.fetch = originalFetch;
}
