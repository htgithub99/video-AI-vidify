export const PAGE_WATCHDOG = {
  INTERVAL_MS: 15000,
  PROBE_TIMEOUT_MS: 20000,
  CLOSE_TIMEOUT_MS: 10000,
  MAX_MISSES: 4,
  LOW_SPEC_MAX_MISSES: 6,
  CLOSE_EVENT: "close",
  HUNG_LOG: (label: string, seconds: number): string => `Tab ${label} không phản hồi ${seconds}s (Chrome/máy quá tải) – đóng tab để bước hiện tại tự thử lại ở tab mới.`,
  LABEL: { IMAGE: "tạo ảnh/video", BATCH: "tạo ảnh hàng loạt", FLOW: "Flow", GROK: "Grok", SUNO: "Suno", SESSION: "AI" },
} as const;
