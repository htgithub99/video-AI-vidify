export const BROWSER_LIFECYCLE_TEXTS = { urlSeparator: ", ", idleChromeClosed: "[Chrome] Tác vụ AI đã xong, chỉ còn tab chat/trống – đóng Chrome tự động.", busyChromeRetained: (urls: string): string => `[Chrome] Giữ Chrome mở vì còn tab đang dùng: ${urls}` } as const;
export const isDisposableChatBrowserUrl = (url: string): boolean => /^(?:about:blank$|chrome:\/\/(?:newtab|new-tab-page)\/?$|chrome-search:\/\/local-ntp(?:\/|$)|https:\/\/(?:gemini\.google\.com|chatgpt\.com|grok\.com|claude\.ai|chat\.deepseek\.com)(?:\/|$)|https:\/\/labs\.google\/?(?:[?#].*)?$)/i.test(url);
export const MOTION_BROWSER_RELEASED_LOG = "Đã đóng Chrome dùng cho AI trước khi dựng và ghép video.";
export const MOTION_BROWSER_FINISHED_LOG = "Đã xác nhận Chrome AI đóng sau khi xuất video.";
export const MOTION_BROWSER_NOT_RELEASED_ERROR = "Chưa thể đóng Chrome vì còn tác vụ hoặc tab đang dùng. Hãy hoàn tất tác vụ đó rồi xuất video lại.";
