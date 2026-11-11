export const MOTION_SEO_CHAPTER_STYLES = {
  PANEL: "overflow-hidden rounded-2xl border border-purple-500/15 bg-white/80 dark:bg-[#17121f] [font-family:Arial,sans-serif] not-italic",
  HEADER: "flex h-8 items-center justify-between gap-2 border-b border-purple-500/10 px-3",
  HEADING: "flex min-w-0 items-center gap-2",
  ICON: "flex shrink-0 items-center text-purple-500 dark:text-purple-300",
  TITLE: "text-xs font-semibold text-slate-900 dark:text-slate-100",
  COUNT: "ml-1.5 text-[10px] font-normal text-slate-500 dark:text-slate-400",
  COPY: "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-purple-600 transition-colors hover:bg-purple-500/10 dark:text-purple-300",
  LIST: "m-0 grid max-h-52 list-none grid-cols-1 gap-x-5 overflow-y-auto px-3 py-1 sm:grid-cols-2 custom-scrollbar",
  ROW: "grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-baseline gap-2 py-1",
  TIME: "text-[11px] font-medium leading-[18px] tabular-nums text-purple-600 dark:text-purple-300 [font-family:ui-monospace,Consolas,monospace]",
  CHAPTER: "min-w-0 break-words text-xs font-normal leading-[18px] text-slate-700 dark:text-slate-200",
} as const;
