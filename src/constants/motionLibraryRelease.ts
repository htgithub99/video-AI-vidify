export const MOTION_LIBRARY_RELEASE = {
  VERSION: 3,
  PLAN_VERSION: 1,
  POINTER: "active-release.json",
  RELEASES: "releases",
  ID: /^[a-zA-Z0-9_-]{1,100}$/,
  REPORT: "release-report.json",
  TYPES: ["style_pack", "character_kit", "prop", "set_base", "set_piece", "set"] as const,
  INVALID: "Bản kho hoạt động không hợp lệ. Giữ dữ liệu để khôi phục; không dùng lại kho cũ tự động.",
  WRITE_BLOCKED: "Kho đang dùng cấu trúc mô-đun mới. Tài nguyên chưa chuẩn hóa không được ghi lại vào kho hoạt động.",
  PLAN_INVALID: "Mẫu ghép cần nền sạch, mảnh đúng gói, vị trí hợp lệ và đầy đủ tham chiếu.",
  CLOSED_SEED: "Gói đóng đang dùng kho mô-đun đã cài. Không vẽ lại cảnh kiểu cũ; bổ sung qua công cụ xây kho mô-đun.",
} as const;
