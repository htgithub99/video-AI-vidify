export const BROWSER_LIFECYCLE_TEXTS = { urlSeparator: ", ", idleChromeClosed: "[Chrome] Tác vụ AI đã xong, chỉ còn tab chat/trống – đóng Chrome tự động.", busyChromeRetained: (urls: string): string => `[Chrome] Giữ Chrome mở vì còn tab đang dùng: ${urls}` } as const;
export const isDisposableChatBrowserUrl = (url: string): boolean => /^(?:about:blank$|chrome:\/\/(?:newtab|new-tab-page)\/?$|chrome-search:\/\/local-ntp(?:\/|$)|https:\/\/(?:gemini\.google\.com|chatgpt\.com|grok\.com|claude\.ai|chat\.deepseek\.com)(?:\/|$)|https:\/\/labs\.google\/?(?:[?#].*)?$)/i.test(url);
export const MOTION_BROWSER_RELEASED_LOG = "Đã đóng Chrome dùng cho AI trước khi dựng và ghép video.";
export const MOTION_BROWSER_NOT_RELEASED_ERROR = "Chưa thể đóng Chrome vì còn tác vụ hoặc tab đang dùng. Hãy hoàn tất tác vụ đó rồi xuất video lại.";
export const MOTION_BROWSER_HANDOFF = {
  ABORT: "abort",
  CLOSE_ATTEMPTS: 3,
  RETRY_MS: 500,
  PREPARING: "Chờ hoàn tất các bước và đóng Chrome AI",
  WAITING: (count: number): string => `Đang chờ ${count} phiên xử lý Motion kết thúc và thu hồi phòng chat trước khi xuất video…`,
  RETRY: (attempt: number): string => `Chrome AI chưa đóng xong – kiểm tra lại lần ${attempt}…`,
  ACTIVE_ROOMS: (urls: string): string => `Chrome còn phòng chat đang được tác vụ khác sử dụng: ${urls}`,
  GROK_BUSY: "Chrome Grok còn tác vụ, tab đang dùng hoặc chưa đóng xong.",
  SHARED_BUSY: "Chrome dùng chung còn tác vụ, tab đang dùng hoặc chưa đóng xong.",
} as const;
