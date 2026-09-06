import assert from "node:assert/strict";
import { formatUserFacingLog, formatUserFacingLogs, getUserLogBadges } from "../src/lib/userLogFormatter.ts";
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
assert.equal(
  formatUserFacingLog(
    "[Kịch bản][room-only · gemini-chat/gemini-flash] Lần 2 chưa đạt (invalid_script_plan_response:$root.scriptSegment:word_ratio_1.520); đang retry riêng bước kịch bản.",
    "vi",
  ),
  "AI đang bổ sung phần còn thiếu (lần 2)...",
);
assert.equal(
  formatUserFacingLog("[Preflight] scene_001: giữ prompt hiện tại với cảnh báo scene_001:generationPrompt:length_outside_recommended_range.", "vi"),
  "Cảnh 1 đã sẵn sàng. Một vài góp ý nhỏ không làm gián đoạn.",
);
assert.equal(
  formatUserFacingLog("Google Flow chưa áp dụng đúng cấu hình video người dùng đã chọn.", "vi"),
  "Google Flow chưa nhận đúng cài đặt video. Đã dừng để tránh tạo sai.",
);
assert.equal(
  formatUserFacingLog("Room grok chưa trả được kịch bản hoàn chỉnh (invalid_script_plan_response). Hãy kiểm tra trạng thái đăng nhập.", "vi"),
  "Phòng AI chưa sẵn sàng. Hãy kiểm tra đăng nhập rồi chọn Tiếp tục dự án.",
);
assert.equal(formatUserFacingLog("✓ Tạo kịch bản phân cảnh thành công với 12 phân cảnh.", "vi"), "Các phân cảnh đã sẵn sàng.");
assert.equal(formatUserFacingLog("✓ Viết lại kịch bản thành công.", "vi"), "Kịch bản đã hoàn tất.");
assert.equal(formatUserFacingLog("⚠️ Không thể sinh dữ liệu SEO.", "vi"), "Chưa tạo được tiêu đề và mô tả video. Quá trình chính vẫn tiếp tục.");
assert.equal(formatUserFacingLog("AI chưa trả đủ hồ sơ nhân vật: characters:missing", "vi"), "AI trả thiếu một số nội dung cần thiết.");
assert.ok(formatUserFacingLog("Một thông báo rất dài ".repeat(20), "vi").length <= 141);
assert.deepEqual(
  formatUserFacingLogs(
    [
      "[08:00:00] [AI Router] Đang gọi cerebras: gpt-oss-120b.",
      "[08:00:01] [AI Router] Đang gọi groq: compound-mini.",
      "[08:00:02] ✓ Viết lại kịch bản thành công.",
    ],
    "vi",
  ),
  ["[08:00:00] Đang kết nối dịch vụ tạo nội dung...", "[08:00:02] Kịch bản đã hoàn tất."],
);
assert.equal(getUserLogBadges("vi").ERROR_BADGE, "CẦN LƯU Ý");
assert.equal(getUserLogBadges("en").SUCCESS_BADGE, "DONE");

writeVerificationLog("User-facing log assertions passed");
