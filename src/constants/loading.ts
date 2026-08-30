export const LOADING_CONFIG = {
  ELEMENT_ID: "app-loading",
  FADE_OUT_CLASS: "fade-out",
  FONT_TIMEOUT_MS: 1500,
  REMOVE_DELAY_MS: 400,
  GOOGLE_FONTS_URL:
    "https://fonts.googleapis.com/css2?family=Merienda:wght@300..900&family=Montserrat:wght@300..900&family=JetBrains+Mono:ital,wght@0,100..900;1,100..900&display=swap",
} as const;

export const LOADING_KEYS = { GENERATE_DETAILED_PROMPT_PREFIX: "generateDetailedPrompt_", RENDER_SCENE_PREFIX: "renderScene_" } as const;

export const TAB_CONTENT_LOADING_CONFIG = { ROWS: [0, 1, 2], MIN_DISPLAY_MS: 650, MAX_WAIT_MS: 10000 } as const;

export const TAB_CONTENT_LOADING_CLASSES = {
  ROOT: "absolute inset-0 box-border h-full min-h-0 w-full min-w-0 overflow-hidden bg-slate-955 p-4 sm:p-6 lg:p-8 animate-pulse",
  GRID: "grid h-full min-h-0 w-full min-w-0 grid-cols-1 gap-6 xl:grid-cols-12",
  MAIN_COLUMN: "flex min-h-0 flex-col gap-5 xl:col-span-8",
  MAIN_CARD: "flex min-h-0 flex-[3] flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6",
  MAIN_TITLE: "mb-6 h-5 w-44 rounded bg-slate-800",
  MAIN_OPTIONS: "grid grid-cols-1 gap-4 md:grid-cols-2",
  MAIN_OPTION_PRIMARY: "h-20 rounded-xl bg-slate-800/70",
  MAIN_OPTION_SECONDARY: "h-20 rounded-xl bg-slate-800/50",
  MAIN_BODY: "mt-5 min-h-44 flex-1 rounded-xl bg-slate-800/60",
  FOOTER_CARD: "flex min-h-36 flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6",
  FOOTER_TITLE: "mb-5 h-4 w-36 rounded bg-slate-800",
  FOOTER_GRID: "grid flex-1 grid-cols-1 gap-4 md:grid-cols-3",
  FOOTER_ITEM: "min-h-12 rounded-xl bg-slate-800/60",
  SIDE_COLUMN: "flex min-h-0 flex-col gap-5 xl:col-span-4",
  SIDE_HEADER_CARD: "shrink-0 rounded-2xl border border-slate-800 bg-slate-900 p-6",
  SIDE_HEADER_TITLE: "mx-auto mb-6 h-5 w-40 rounded bg-slate-800",
  SIDE_HEADER_BODY: "h-12 rounded-xl bg-slate-800/70",
  SIDE_BODY_CARD: "flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6",
  SIDE_BODY_TITLE: "mb-6 h-4 w-32 rounded bg-slate-800",
  SIDE_BODY_GRID: "grid min-h-0 flex-1 grid-rows-3 gap-4",
  SIDE_BODY_ROW: "flex min-h-0 flex-col gap-2",
  SIDE_BODY_LABEL: "h-3 w-1/3 rounded bg-slate-800",
  SIDE_BODY_VALUE: "min-h-10 flex-1 rounded-xl bg-slate-800/60",
} as const;

export const MEDIA_MIX_CONFIG = { DEFAULT_MAX_VIDEOS: 3, DEFAULT_TRIM_SECONDS: 0.25, MIN_VIDEOS: 1, MAX_VIDEOS: 10, VIDEO_COUNT_OPTIONS: [1, 2, 3, 4, 5, 6, 8, 10] } as const;
