export const MOTION_PARTS = {
  OPTIONS: [1, 2, 3, 4, 5, 6],
  DEFAULT: 1,
  DEFAULT_CHAPTER_SECONDS: 120,
  MINUTE_SECONDS: 60,
  CARRY_KEYS: ["style", "cast", "locations", "locationInfo", "assetSources", "assetStyleKey", "creativeSignature", "referenceKey", "characterMode", "drawingMode", "videoDna", "characterMotion", "voiceCast"],
  TITLE: { vi: (title: string, index: number, count: number): string => `${title} (Phần ${index}/${count})`, en: (title: string, index: number, count: number): string => `${title} (Part ${index}/${count})` },
  NEXT_JOIN: " – ",
  EN: "en",
  LINK_TARGET: "_blank",
  LINK_REL: "noreferrer",
};
export const MOTION_PARTS_TEXT = {
  vi: {
    OPTION: (count: number, minutes: number): string => `${count} phần · ≈${minutes} phút/phần`,
    LABEL: (index: number, count: number): string => `Phần ${index}/${count}`,
    INFO: (chapters: number, minutes: number): string => `${chapters} chương · ≈${minutes} phút`,
    CONTINUE: (index: number): string => `Chạy tiếp phần ${index}`,
  },
  en: {
    OPTION: (count: number, minutes: number): string => `${count} parts · ≈${minutes} min each`,
    LABEL: (index: number, count: number): string => `Part ${index}/${count}`,
    INFO: (chapters: number, minutes: number): string => `${chapters} chapters · ≈${minutes} min`,
    CONTINUE: (index: number): string => `Continue with part ${index}`,
  },
};
export const MOTION_PARTS_STYLES = {
  LIST: "space-y-2",
  ROW: "flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-955/70 px-3 py-2",
  ROW_ACTIVE: "border-purple-500/60 bg-purple-500/10",
  NAME: "text-xs font-bold text-slate-100 truncate",
  INFO: "text-[10px] font-mono text-slate-400",
  STATUS: "text-[10px] font-mono font-bold uppercase shrink-0",
  STATUS_DONE: "text-emerald-400",
  STATUS_CURRENT: "text-purple-300",
  STATUS_PENDING: "text-slate-500",
  LINK: "text-[10px] font-mono text-purple-300 underline shrink-0",
  HINT: "text-[11px] leading-relaxed text-slate-500",
  TEXT_BLOCK: "min-w-0",
  BADGE: (done: number, count: number): string => `${done}/${count}`,
};
