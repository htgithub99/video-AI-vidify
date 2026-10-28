export const FEATURE_WORKSPACE = {
  ERROR_EVENT: "workspace_render_failed",
  CONTAINER: "w-full h-full min-h-0",
  HIDDEN: "hidden",
  RECOVERY: "flex h-full min-h-0 items-center justify-center p-6",
  RECOVERY_CARD: "max-w-lg space-y-4 p-6",
  RECOVERY_TITLE: "text-base font-semibold text-slate-100",
  RECOVERY_COPY: "text-sm text-slate-400",
  UI: { vi: { TITLE: "Màn hình gặp lỗi", DESCRIPTION: "Bạn có thể thử mở lại màn này hoặc chuyển sang mục khác.", RETRY: "Mở lại màn hình" }, en: { TITLE: "This screen encountered an error", DESCRIPTION: "Try opening this screen again or switch to another menu item.", RETRY: "Open screen again" } },
} as const;
