import assert from "node:assert/strict";
import _ from "lodash";
import { generatePlanningWithChatUi } from "../src/server/services/chatUiPlanningService.ts";
import { closeActiveBrowser } from "../src/server/services/imageGeneratorService.ts";
import { SecurityConstants } from "../src/constants/security.ts";
import { requestContext } from "../src/server/utils/requestContext.ts";
import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../src/types.ts";
const PROVIDER_MODELS: Record<string, { provider: AiPlanningFallbackProvider; model: AiPlanningChatModel }> = {
  gemini: { provider: AiPlanningFallbackProvider.GeminiChat, model: AiPlanningChatModel.GeminiFlash },
  grok: { provider: AiPlanningFallbackProvider.GrokChat, model: AiPlanningChatModel.GrokFast },
  chatgpt: { provider: AiPlanningFallbackProvider.ChatGptUi, model: AiPlanningChatModel.ChatGptAuto },
};
const providerKey = _.lowerCase(_.trim(process.argv[2] || "gemini"));
const providerConfig = PROVIDER_MODELS[providerKey];
assert.ok(providerConfig, `Unsupported provider: ${providerKey}`);
const probeId = `film_room_probe_${providerKey}`;
const prompt = `Return exactly this JSON array with no Markdown and no extra text: [{"id":"${probeId}","stage":"cinematic_room_transport","status":"ok"}]`;
try {
  const response = await requestContext.run({ licenseKey: SecurityConstants.DEFAULT_LICENSE_KEY }, () => generatePlanningWithChatUi({ ...providerConfig, prompt, projectId: `live_room_probe_${providerKey}_${Date.now()}`, chromeHeadless: false, expectedSceneIds: [probeId] }));
  const parsed = JSON.parse(response.text);
  assert.ok(_.isArray(parsed));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0]?.id, probeId);
  assert.equal(parsed[0]?.stage, "cinematic_room_transport");
  assert.equal(parsed[0]?.status, "ok");
  process.stdout.write(`${providerKey}: room transport and JSON extraction passed.\n`);
} finally {
  await closeActiveBrowser();
}
