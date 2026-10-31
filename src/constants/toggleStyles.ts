export const TOGGLE_STYLES = {
  TRACK: "toggle-switch select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-all",
  ACTIVE: "!bg-emerald-500 border border-emerald-400/60 shadow-sm shadow-emerald-500/30",
  INACTIVE: "!bg-slate-800 border border-slate-700/80 hover:border-slate-600",
  THUMB: "toggle-switch-thumb shadow-md transition-transform",
  THUMB_ACTIVE: "translate-x-[20px] bg-white",
  THUMB_INACTIVE: "translate-x-0 !bg-slate-300",
} as const;
