import type { ButtonVariant } from "../types";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

export const BUTTON_CLASS_NAME = {
  BASE: "inline-flex items-center gap-2 justify-center font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm relative overflow-hidden select-none",
  LOADING: "button-skeleton-loading !opacity-100 disabled:!opacity-100 cursor-wait active:scale-100",
  LOADING_CONTENT: "inline-flex items-center gap-2 justify-center w-full [&_svg:not(.app-loading-spinner)]:hidden [&_img]:hidden relative z-10",
  LOADING_SPINNER: "w-4 h-4 animate-spin shrink-0 app-loading-spinner inline-block text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]",
  LOADING_TEXT: "truncate font-extrabold text-white tracking-wide drop-shadow-sm",
} as const;

export const BUTTON_SIZE_CLASS_NAME: Record<ButtonSize, string> = {
  xs: "px-3 h-10 min-h-[40px] max-h-[40px] text-xs rounded-xl tracking-wide",
  sm: "px-3.5 h-10 min-h-[40px] max-h-[40px] text-xs rounded-xl tracking-wide",
  md: "px-4 h-10 min-h-[40px] max-h-[40px] text-xs rounded-xl tracking-wide",
  lg: "px-5 h-12 min-h-[48px] max-h-[48px] text-sm rounded-xl font-bold",
};

export const BUTTON_VARIANT_CLASS_NAME: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:via-rose-450 hover:to-indigo-500 active:from-rose-700 active:to-indigo-700 text-white border border-rose-400/30 shadow-lg shadow-rose-600/20",
  secondary: "bg-slate-900 hover:bg-slate-850 text-slate-100 border border-slate-800 shadow-sm",
  success:
    "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white border border-emerald-400/30 shadow-md shadow-emerald-600/20",
  info: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white border border-blue-400/30 shadow-md shadow-blue-600/20",
  purple:
    "bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-500 hover:via-purple-500 hover:to-pink-500 active:from-violet-700 active:to-pink-700 text-white border border-purple-400/30 shadow-md shadow-purple-600/20",
  amber:
    "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:from-amber-600 active:to-orange-600 text-white border border-amber-400/30 shadow-md shadow-amber-500/20",
  danger:
    "bg-gradient-to-r from-rose-600 via-rose-600 to-red-600 hover:from-rose-500 hover:via-rose-500 hover:to-red-500 active:from-rose-700 active:to-red-700 text-white border border-rose-500/40 shadow-md shadow-rose-600/25",
  ghost: "bg-transparent hover:bg-slate-200/80 dark:hover:bg-slate-800/60 active:bg-slate-300/80 dark:active:bg-slate-700/60 text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-slate-100 border border-transparent shadow-none",
  outline: "bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 shadow-sm backdrop-blur-sm",
  unstyled: "",
};

export const MODAL_CLASS_NAME = {
  OVERLAY: "fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200",
  CONTENT: "modal-content-card bg-[#fffdf9] dark:bg-[#15101d] border border-amber-900/15 dark:border-purple-500/20 rounded-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-left text-slate-900 dark:text-slate-100",
  TOP_DECORATION: "absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.04] rounded-full blur-3xl pointer-events-none z-0",
  BOTTOM_DECORATION: "absolute bottom-0 left-0 w-64 h-64 bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none z-0",
  HEADER: "modal-header-bar flex items-center justify-between px-6 py-4 border-b border-amber-900/10 dark:border-slate-800/80 relative z-10 bg-[#f7f2e7] dark:bg-[#1a1424] backdrop-blur-sm",
  TITLE: "modal-title-text text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 truncate",
  CLOSE_BUTTON: "modal-close-button-custom w-8 h-8 rounded-xl flex items-center justify-center bg-slate-200/90 hover:bg-rose-100/90 text-slate-800 hover:text-rose-600 border border-slate-300/80 hover:border-rose-300/60 shadow-xs dark:bg-slate-800/90 dark:hover:bg-rose-950/80 dark:text-slate-200 dark:hover:text-rose-400 dark:border-slate-700/90 dark:hover:border-rose-500/40 transition-all ml-auto shrink-0 cursor-pointer",
  CLOSE_ICON: "w-4 h-4 stroke-[2.5]",
  BODY: "modal-body-area flex-1 overflow-y-auto bg-transparent relative z-10 p-6 text-slate-900 dark:text-slate-100",
  DEFAULT_WIDTH: "max-w-2xl",
  WIDTH_PREFIX: "max-w-",
} as const;

export const MODAL_SIZE_CLASS_NAME: Record<string, string> = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
};

export const GROUPED_SELECT_CLASS_NAME = {
  WRAPPER: "space-y-1",
  LABEL: "text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block",
  CONTROL: "relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 h-10 focus-within:border-rose-500/50 transition-colors",
  ICON: "w-3.5 h-3.5 text-slate-400 mr-2 shrink-0",
  SELECT: "flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5",
  GROUP: "bg-slate-955 text-slate-400 font-bold",
  OPTION: "bg-slate-955 text-slate-300 font-normal",
  CHEVRON: "pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5",
} as const;
