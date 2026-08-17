import assert from "node:assert/strict";
import { formatUserFacingLog, getUserLogBadges } from "../src/lib/userLogFormatter.ts";
import { writeVerificationLog } from "./verificationLogger.ts";

const technicalLogs = [
  "[AI Router] Đang gọi cerebras: gpt-oss-120b.",
  "HTTP 500 POST /api/pipeline/voice failed with JSON response",
  "Exception: request failed at VoiceController.createTask (C:\\app\\voice.ts:42:10)",
  "[Gemini Chat] model picker selector not found in DOM",
  "{\"status\":500,\"stack\":\"internal\"}",
  "Model gemini-3.5-flash-lite returned invalid payload at pipelineController.ts:42:10",
];

for (const log of technicalLogs) {
  const userMessage = formatUserFacingLog(log, "vi");
  assert.doesNotMatch(userMessage, /api|http|cerebras|groq|gemini|json|stack|exception|function|class|selector|dom|pipelineController|\\app\\/i);
  assert.ok(userMessage.length > 0);
}

assert.match(formatUserFacingLog("Missing API key", "vi"), /cấu hình/i);
assert.match(formatUserFacingLog("429 quota exceeded", "vi"), /giới hạn/);
assert.equal(getUserLogBadges("vi").ERROR_BADGE, "CẦN LƯU Ý");
assert.equal(getUserLogBadges("en").SUCCESS_BADGE, "DONE");

writeVerificationLog("User-facing log assertions passed");
