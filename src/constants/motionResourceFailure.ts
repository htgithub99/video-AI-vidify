export const MOTION_RESOURCE_FAILURE = {
  CODE: "motion_resource_failure",
  REASONS: { METADATA: "metadata", FILTERED: "filtered", SUPPORT: "support", SEARCH: "search_limit", MISSING: "missing", COMBINATION: "combination" },
  MESSAGE: (place: string, reason: string, details: string[]): string => {
    const labels: Record<string, string> = { metadata: "Hồ sơ tài nguyên chưa đủ", filtered: "Mảnh phù hợp bị giới hạn phạm vi sử dụng", support: "Chưa ghép đủ điểm đặt", search_limit: "Chưa tìm được tổ hợp trong giới hạn tìm kiếm", missing: "Chưa có tài nguyên phù hợp", combination: "Các thành phần chưa ghép được thành bố cục hợp lệ" };
    return `${labels[reason] || labels.combination} cho ${place}${details.length ? ": " + details.join("; ") : ""}. Giữ phần đã đạt; không tự vẽ thêm hoặc thay sai tài nguyên.`;
  },
  LOG: (place: string, count: number, reason: string): string => `Kiểm kho ${place}: ${count} ứng viên, nguyên nhân ${reason}.`,
} as const;
