import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolvePipelineAiExecution } from "../src/services/pipelineAiExecutionService";
import { getRoomOnlyScriptError } from "../src/server/services/roomOnlyErrorService";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider, type VideoProject } from "../src/types";

const serverSource = readFileSync(new URL("../server.ts", import.meta.url), "utf8");
const pipelineSource = readFileSync(new URL("../src/hooks/useAutoVideoPipeline.ts", import.meta.url), "utf8");
const aiServiceSource = readFileSync(new URL("../src/server/services/geminiService.ts", import.meta.url), "utf8");
const pipelineControllerSource = readFileSync(new URL("../src/server/controllers/pipelineController.ts", import.meta.url), "utf8");

assert.ok(serverSource.includes("aiExecutionMode:"));
assert.ok(serverSource.includes("aiRoomProvider:"));
assert.ok(serverSource.includes("aiRoomModel,"));
assert.ok(serverSource.includes("aiRoomProjectId,"));
assert.match(pipelineSource, /const resolvedAiExecution = resolvePipelineAiExecution\(config, existingTargetProj, isCinematicPipeline\)/);
assert.match(pipelineSource, /const pipelineSystemFetch = [\s\S]*aiExecution:[\s\S]*mode: resolvedAiExecution\.mode/);
assert.match(pipelineSource, /pipelineSystemFetch\(API_ROUTES\.PIPELINE_SCRIPT/);
assert.match(pipelineSource, /const analyzeCharacterRes = await pipelineSystemFetch/);
assert.match(pipelineSource, /storyboardRes = await pipelineSystemFetch/);
assert.match(pipelineSource, /pipelineSystemFetch\(API_ROUTES\.PIPELINE_OPTIMIZE_PROMPTS/);
assert.match(pipelineSource, /let clipAnalysis = await pipelineSystemFetch/);
assert.match(pipelineSource, /const finalQaResponse = await pipelineSystemFetch/);

const roomBranchIndex = aiServiceSource.indexOf("const roomExecution = getRoomExecution()");
const apiBranchIndex = aiServiceSource.indexOf("const keys = await resolveApiKeys()", roomBranchIndex);
assert.ok(roomBranchIndex >= 0 && apiBranchIndex > roomBranchIndex);
const roomBranch = aiServiceSource.slice(roomBranchIndex, apiBranchIndex);
assert.match(roomBranch, /generatePlanningWithChatUi/);
assert.doesNotMatch(roomBranch, /generateWithFreeProviders|GoogleGenAI|resolveApiKeys/);
assert.match(aiServiceSource, /createRoomRequestPayload\(params\.contents\)/);
assert.match(aiServiceSource, /attachments: roomPayload\.attachments/);
assert.match(aiServiceSource, /Room-only AI execution requires inline media data/);
assert.match(aiServiceSource, /if \(roomOnlyContext && !roomExecution\)/);
assert.ok(aiServiceSource.indexOf("if (roomOnlyContext && !roomExecution)") < aiServiceSource.indexOf("const keys = await resolveApiKeys()", roomBranchIndex));
assert.match(pipelineControllerSource, /aiExecutionMode, AiPlanningExecutionMode\.RoomOnly/);
assert.match(pipelineControllerSource, /getRoomOnlyScriptError\(requestContext\.getStore\(\)\?\.aiRoomProvider, error, isVi\)/);

const continuedProject = {
  config: {},
  visualConfig: {
    planningFallbackProvider: AiPlanningFallbackProvider.GrokChat,
    planningChatModel: AiPlanningChatModel.GrokExpert,
    planningExecutionMode: AiPlanningExecutionMode.RoomOnly,
    planningChromeHeadless: false,
  },
} as VideoProject;
const restoredExecution = resolvePipelineAiExecution({}, continuedProject, true);
assert.deepEqual(restoredExecution, {
  provider: AiPlanningFallbackProvider.GrokChat,
  model: AiPlanningChatModel.GrokExpert,
  mode: AiPlanningExecutionMode.RoomOnly,
  chromeHeadless: false,
});

const guardedExecution = resolvePipelineAiExecution(
  {
    planningFallbackProvider: AiPlanningFallbackProvider.Disabled,
    planningExecutionMode: AiPlanningExecutionMode.RoomOnly,
  },
  null,
  true,
);
assert.equal(guardedExecution.mode, AiPlanningExecutionMode.RoomOnly);
assert.equal(guardedExecution.provider, AiPlanningFallbackProvider.GeminiChat);

const roomError = getRoomOnlyScriptError(
  AiPlanningFallbackProvider.GeminiChat,
  new Error("Không thể tạo nội dung. Hãy kiểm tra khóa Groq, Cerebras hoặc API key."),
  true,
);
assert.match(roomError, /Gemini Chat|gemini-chat|Room/);
assert.doesNotMatch(roomError, /kh[oó]a|API key|Groq|Cerebras/i);

process.stdout.write("Room-only AI routing assertions passed.\n");
