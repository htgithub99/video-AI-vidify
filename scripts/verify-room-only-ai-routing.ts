import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const serverSource = readFileSync(new URL("../server.ts", import.meta.url), "utf8");
const pipelineSource = readFileSync(new URL("../src/hooks/useAutoVideoPipeline.ts", import.meta.url), "utf8");
const aiServiceSource = readFileSync(new URL("../src/server/services/geminiService.ts", import.meta.url), "utf8");

assert.ok(serverSource.includes("aiExecutionMode:"));
assert.ok(serverSource.includes("aiRoomProvider:"));
assert.ok(serverSource.includes("aiRoomModel,"));
assert.ok(serverSource.includes("aiRoomProjectId,"));
assert.match(pipelineSource, /const pipelineSystemFetch = [\s\S]*aiExecution:[\s\S]*mode: config\.planningExecutionMode/);
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

process.stdout.write("Room-only AI routing assertions passed.\n");
