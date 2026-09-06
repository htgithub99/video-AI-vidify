import assert from "node:assert/strict";
import {
  formatSceneDisplayName,
  formatSceneList,
  formatSceneNumber,
  formatUserFacingLog,
  formatUserFacingLogs,
  getUserLogBadges,
} from "../src/lib/userLogFormatter.ts";
import { AUTO_GENERATOR_PANEL_TEXTS } from "../src/constants/texts.ts";
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

assert.match(formatUserFacingLog("Missing API key", "vi"), /cấu hình|khóa dịch vụ/i);
assert.match(formatUserFacingLog("429 quota exceeded", "vi"), /giới hạn/);
assert.equal(formatUserFacingLog("Bước 2/4 · AI đang viết prompt video cho từng cảnh.", "vi"), "Bước 2/4 · AI đang viết prompt video cho từng cảnh.");
assert.equal(
  formatUserFacingLog(
    "[Kịch bản][room-only · gemini-chat/gemini-flash] Lần 2 chưa đạt (invalid_script_plan_response:$root.scriptSegment:word_ratio_1.520); đang retry riêng bước kịch bản.",
    "vi",
  ),
  "AI đang hoàn thiện và bổ sung chi tiết nội dung còn thiếu cho các phân cảnh (lần 2)...",
);
assert.equal(
  formatUserFacingLog("[Preflight] scene_001: giữ prompt hiện tại với cảnh báo scene_001:generationPrompt:length_outside_recommended_range.", "vi"),
  "Cảnh 1 đã sẵn sàng để sản xuất. Một số góp ý nhỏ đã được ghi nhận và không làm gián đoạn tiến độ.",
);
assert.equal(
  formatUserFacingLog("Google Flow chưa áp dụng đúng cấu hình video người dùng đã chọn.", "vi"),
  "Cài đặt video chưa đồng bộ chính xác với dịch vụ tạo. Hệ thống đã tạm dừng để bạn kiểm tra và tránh tạo sai sót.",
);
assert.equal(
  formatUserFacingLog("Room grok chưa trả được kịch bản hoàn chỉnh (invalid_script_plan_response). Hãy kiểm tra trạng thái đăng nhập.", "vi"),
  "Phiên làm việc AI chưa sẵn sàng hoặc cần xác thực lại. Hãy kiểm tra trạng thái đăng nhập rồi bấm Tiếp tục dự án.",
);
assert.equal(
  formatUserFacingLog("Quy trình tạo video gặp sự cố. Room chatgpt-ui đã trả dữ liệu nhưng cinematic_film_package_invalid:response:incomplete.", "vi"),
  "AI đã trả lời nhưng bộ kịch bản chưa truyền về đầy đủ. Hệ thống sẽ yêu cầu AI gửi lại trọn vẹn khi bạn chọn Tiếp tục dự án.",
);
assert.equal(
  formatUserFacingLog("✓ Tạo kịch bản phân cảnh thành công với 12 phân cảnh.", "vi"),
  "Toàn bộ kịch bản phân cảnh đã được chia nhỏ và phân bổ thời lượng thành công.",
);
assert.equal(
  formatUserFacingLog("✓ Viết lại kịch bản thành công.", "vi"),
  "Kịch bản chi tiết đã được xây dựng hoàn tất và sẵn sàng cho bước tiếp theo.",
);
assert.equal(
  formatUserFacingLog("⚠️ Không thể sinh dữ liệu SEO.", "vi"),
  "Chưa thể tạo tiêu đề và mô tả SEO tối ưu. Quy trình sản xuất video chính vẫn đang tiếp tục bình thường.",
);
assert.equal(
  formatUserFacingLog("AI chưa trả đủ hồ sơ nhân vật: characters:missing", "vi"),
  "Nội dung phản hồi chưa đầy đủ chi tiết cần thiết. Hệ thống đang tự động yêu cầu hoàn thiện thêm...",
);
assert.ok(formatUserFacingLog("Một thông báo rất dài ".repeat(20), "vi").length <= 221);
assert.deepEqual(
  formatUserFacingLogs(
    [
      "[08:00:00] [AI Router] Đang gọi cerebras: gpt-oss-120b.",
      "[08:00:01] [AI Router] Đang gọi groq: compound-mini.",
      "[08:00:02] ✓ Viết lại kịch bản thành công.",
    ],
    "vi",
  ),
  [
    "[08:00:00] Đang thiết lập kết nối an toàn tới dịch vụ trí tuệ nhân tạo...",
    "[08:00:02] Kịch bản chi tiết đã được xây dựng hoàn tất và sẵn sàng cho bước tiếp theo.",
  ],
);
assert.equal(getUserLogBadges("vi").ERROR_BADGE, "CẦN LƯU Ý");
assert.equal(getUserLogBadges("en").SUCCESS_BADGE, "DONE");

assert.equal(formatSceneNumber("scene_010"), "10");
assert.equal(formatSceneDisplayName("scene_010", "vi"), "cảnh 10");
assert.equal(formatSceneDisplayName("scene_010", "en"), "scene 10");
assert.equal(formatSceneList([{ id: "scene_010" }, { id: "scene_011" }, { id: "scene_012" }], "vi"), "các cảnh 10, 11, 12");
assert.equal(formatSceneList([{ id: "scene_010" }, { id: "scene_011" }], "en"), "scenes 10, 11");

assert.equal(
  formatUserFacingLog("Đang xử lý scene_010, scene_011, scene_012 (lần 2).", "vi"),
  "Đang xử lý các cảnh 10, 11, 12 (lần 2).",
);
assert.equal(
  formatUserFacingLog("[Đạo diễn phim][prompt] Đang xử lý scene_010, scene_011, scene_012 (lần 2/3).", "vi"),
  "Đang xử lý các cảnh 10, 11, 12 (lần 2).",
);

assert.equal(
  formatUserFacingLog("⏱ Quy trình đã dừng sau giây.", "vi"),
  "Quy trình sản xuất đã tạm dừng an toàn. Bạn có thể kiểm tra các thông báo chi tiết và bấm Tiếp tục dự án bất cứ khi nào.",
);
assert.equal(
  formatUserFacingLog("⏱️ Quy trình đã dừng sau 15 giây.", "vi"),
  "Quy trình sản xuất đã tạm dừng sau 15 giây. Bạn có thể kiểm tra thông báo và chọn Tiếp tục dự án khi sẵn sàng.",
);
assert.equal(AUTO_GENERATOR_PANEL_TEXTS.vi.logPipelineFailedElapsed(NaN), "⏱️ Quy trình đã tạm dừng.");
assert.equal(AUTO_GENERATOR_PANEL_TEXTS.vi.logPipelineFailedElapsed(0), "⏱️ Quy trình đã tạm dừng.");
assert.equal(AUTO_GENERATOR_PANEL_TEXTS.vi.logPipelineFailedElapsed(24.3), "⏱️ Quy trình đã dừng sau 24 giây.");

writeVerificationLog("User-facing log assertions passed");
