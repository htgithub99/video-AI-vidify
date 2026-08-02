import { AppTheme } from "./enums";

export enum ProgressLogTone {
  Info = "info",
  Running = "running",
  Success = "success",
  Warning = "warning",
  Error = "error",
}

export const PROGRESS_LOG_CONFIG = {
  TIME_PATTERN: /^\[([^\]]+)\]\s*/,
  PREFIX_PATTERN: /^(?:🚀|📌|✅|✓|⚠️?|❌|🎨|♻️?)\s*/u,
  EMPTY_VALUE: "",
  LIGHT_THEME: AppTheme.LIGHT,
  MARKERS: {
    [ProgressLogTone.Error]: ["❌", "gặp sự cố", "thất bại", "failed completely"],
    [ProgressLogTone.Warning]: ["⚠", "cảnh báo", "warning"],
    [ProgressLogTone.Success]: ["✅", "✓", "thành công", "hoàn tất"],
    [ProgressLogTone.Running]: ["🚀", "📌", "đang ", "bắt đầu"],
  },
  CLASSES: {
    ICON: "w-3.5 h-3.5 shrink-0",
    ITEM: "flex items-start gap-3 rounded-xl px-3 py-2.5",
    ICON_CONTAINER: "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
    MESSAGE: "min-w-0 flex-1 whitespace-pre-wrap break-words leading-5 text-xs font-medium pt-1",
    TIME: "shrink-0 text-[9px] tabular-nums pt-1.5",
    TIME_LIGHT: "text-slate-500",
    TIME_DARK: "text-slate-400",
  },
  COLORS: {
    MESSAGE_LIGHT: "#1f2937",
    MESSAGE_DARK: "#f8fafc",
  },
  STYLES: {
    [ProgressLogTone.Info]: { light: "bg-blue-50 text-slate-800", dark: "bg-blue-500/10 text-slate-100", iconLight: "text-blue-700", iconDark: "text-blue-300", iconBgLight: "bg-blue-100", iconBgDark: "bg-blue-500/15" },
    [ProgressLogTone.Running]: { light: "bg-amber-50 text-slate-900", dark: "bg-amber-500/10 text-slate-100", iconLight: "text-amber-700", iconDark: "text-amber-300", iconBgLight: "bg-amber-100", iconBgDark: "bg-amber-500/15" },
    [ProgressLogTone.Success]: { light: "bg-emerald-50 text-slate-900", dark: "bg-emerald-500/10 text-slate-100", iconLight: "text-emerald-700", iconDark: "text-emerald-300", iconBgLight: "bg-emerald-100", iconBgDark: "bg-emerald-500/15" },
    [ProgressLogTone.Warning]: { light: "bg-orange-50 text-slate-900", dark: "bg-orange-500/10 text-slate-100", iconLight: "text-orange-700", iconDark: "text-orange-300", iconBgLight: "bg-orange-100", iconBgDark: "bg-orange-500/15" },
    [ProgressLogTone.Error]: { light: "bg-rose-50 text-slate-900", dark: "bg-rose-500/10 text-slate-100", iconLight: "text-rose-700", iconDark: "text-rose-300", iconBgLight: "bg-rose-100", iconBgDark: "bg-rose-500/15" },
  },
} as const;
