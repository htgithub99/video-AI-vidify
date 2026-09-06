import _ from "lodash";

export const getRoomOnlyScriptError = (provider: unknown, error: unknown, isVietnamese: boolean): string => {
  const roomName = _.toString(provider || "selected-room");
  const rawIssue = _.trim(_.toString(_.get(error, "message")));
  const containsUnrelatedProviderAdvice = /api\s*key|groq|cerebras|kh[oó]a/i.test(rawIssue);
  const roomIssue = !rawIssue || containsUnrelatedProviderAdvice ? "room_execution_failed" : _.truncate(rawIssue, { length: 240 });
  const isCreativeArtifactIssue = /cinematic_(?:story_bible|narrative_plan|screenplay).*_invalid|schema_version|completion_marker|\$root\./i.test(roomIssue);
  if (isCreativeArtifactIssue) {
    return isVietnamese
      ? `Room ${roomName} đã trả dữ liệu nhưng artifact kịch bản cuối còn lỗi cấu trúc (${roomIssue}). Các bước hợp lệ đã được checkpoint; hãy bấm Tiếp tục để AI viết lại riêng artifact này.`
      : `The ${roomName} room returned data, but the final screenplay artifact still has structural issues (${roomIssue}). Valid prior steps were checkpointed; resume to let AI rewrite only this artifact.`;
  }
  return isVietnamese
    ? `Room ${roomName} chưa trả được kịch bản hoàn chỉnh (${roomIssue}). Hãy kiểm tra trạng thái đăng nhập hoặc giao diện room rồi tiếp tục dự án.`
    : `The ${roomName} room did not return a complete screenplay (${roomIssue}). Check the room sign-in state or UI, then resume the project.`;
};
