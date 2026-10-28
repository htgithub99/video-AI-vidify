import { stringifyJson } from "../src/lib/jsonStringify.js";
import { writeVerificationLog } from "./verificationLogger.ts";
import assert from "node:assert/strict";
import { resolveApiKeys } from "../src/server/services/apiKeyResolver";
import { requestContext } from "../src/server/utils/requestContext";
const originalFetch = globalThis.fetch;
const originalEnvironment = { GEMINI_API_KEY: process.env.GEMINI_API_KEY, CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY, GROQ_API_KEY: process.env.GROQ_API_KEY, AI33_API_KEY: process.env.AI33_API_KEY };
for (const key of Object.keys(originalEnvironment)) delete process.env[key];
let sheetRequestCount = 0;
globalThis.fetch = (async () => {
  sheetRequestCount += 1;
  return new Response(stringifyJson({ apiKeys: { GEMINI_KEY: "sheet-gemini", CEREBRAS_KEY: "sheet-cerebras", GROQ_KEY: "sheet-groq", AI33_KEY: "sheet-ai33" } }), { status: 200, headers: { "Content-Type": "application/json" } });
}) as typeof fetch;
try {
  const configured = await requestContext.run({ geminiKey: "  user-gemini  ", cerebrasKey: "user-cerebras", groqKey: "user-groq", ai33Key: "user-ai33", licenseKey: "test-license" }, resolveApiKeys);
  assert.equal(sheetRequestCount, 0, "Google Sheet must not be requested when all user-configured keys exist");
  assert.equal(configured.geminiKey, "user-gemini", "Configured key should be trimmed and retained");
  assert.deepEqual(Object.values(configured.source), ["user_config", "user_config", "user_config", "user_config"]);
  const fallback = await requestContext.run({ geminiKey: "user-gemini", cerebrasKey: "", groqKey: " ", ai33Key: "", licenseKey: "test-license" }, resolveApiKeys);
  assert.equal(sheetRequestCount, 1, "Google Sheet should be requested once for missing providers");
  assert.equal(fallback.geminiKey, "user-gemini", "Google Sheet must never overwrite a configured key");
  assert.equal(fallback.cerebrasKey, "sheet-cerebras");
  assert.equal(fallback.groqKey, "sheet-groq");
  assert.equal(fallback.ai33Key, "sheet-ai33");
  assert.deepEqual(fallback.source, { gemini: "user_config", cerebras: "google_sheet", groq: "google_sheet", ai33: "google_sheet" });
  writeVerificationLog("API key priority checks passed.");
} finally {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
