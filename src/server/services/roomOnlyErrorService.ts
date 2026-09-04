import _ from "lodash";

export const getRoomOnlyScriptError = (provider: unknown, error: unknown, isVietnamese: boolean): string => {
  const roomName = _.toString(provider || "selected-room");
  const rawIssue = _.trim(_.toString(_.get(error, "message")));
  const containsUnrelatedProviderAdvice = /api\s*key|groq|cerebras|kh[oó]a/i.test(rawIssue);
  const roomIssue = !rawIssue || containsUnrelatedProviderAdvice ? "room_execution_failed" : _.truncate(rawIssue, { length: 240 });
  return isVietnamese
    ? `Room ${roomName} chưa trả được kịch bản hoàn chỉnh (${roomIssue}). Hãy kiểm tra trạng thái đăng nhập hoặc giao diện room rồi tiếp tục dự án.`
    : `The ${roomName} room did not return a complete screenplay (${roomIssue}). Check the room sign-in state or UI, then resume the project.`;
};
