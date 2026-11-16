export const STUDIO_UI = {
  DEFER_MS: 250,
  HEADER_BADGE_ROW: "header-badge-row",
  STATUS_ROLE: "status",
  POLITE_LIVE: "polite",
  GROUP_ROLE: "group",
  PAGE_CURRENT: "page",
  LOADING: "py-16 flex flex-col items-center justify-center text-center space-y-4",
  LOADING_FRAME: "w-14 h-14 rounded-2xl border flex items-center justify-center shadow-lg",
  LOADING_FRAME_PRIMARY: "bg-purple-500/15 border-purple-500/30 shadow-purple-500/20",
  LOADING_FRAME_SECONDARY: "bg-fuchsia-500/15 border-fuchsia-500/30 shadow-fuchsia-500/20",
  LOADING_ICON_PRIMARY: "w-7 h-7 text-purple-400 animate-spin",
  LOADING_ICON_SECONDARY: "w-7 h-7 text-fuchsia-400 animate-pulse",
  LOADING_COPY: "space-y-1",
  LOADING_TITLE: "text-sm font-extrabold text-slate-200",
  LOADING_DESCRIPTION: "text-xs text-slate-400",
  PAGE: "studio-page creation-workspace w-full h-full min-h-0 flex flex-col overflow-y-auto overflow-x-hidden p-4 sm:p-6 custom-scrollbar",
  CANVAS: "studio-canvas w-full min-w-0 rounded-2xl p-4 sm:p-6 space-y-5 relative",
  CARD: "studio-card glass-card min-w-0 rounded-2xl",
  FIELDSET: "studio-card glass-card min-w-0 rounded-2xl p-4 space-y-4",
  HEADER: "studio-header flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5",
  HEADER_CONTENT: "flex items-center gap-3 min-w-0",
  ICON_FRAME: "studio-icon-frame w-10 h-10 rounded-xl p-0.5 shrink-0",
  ICON_INNER: "studio-icon-inner w-full h-full rounded-[10px] flex items-center justify-center",
  ICON: "w-5 h-5 shrink-0",
  TITLE_ROW: "flex items-center gap-2 flex-wrap",
  TITLE: "studio-title text-base sm:text-lg font-black tracking-tight",
  DESCRIPTION: "studio-description text-[11px] mt-0.5 leading-relaxed",
  ACTIONS: "studio-header-actions flex items-center gap-2 flex-wrap w-full lg:w-auto self-start lg:self-auto shrink-0",
  BADGE: "studio-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold",
  BADGE_ICON: "w-2.5 h-2.5 shrink-0",
  MIN_WIDTH: "min-w-0",
  BUTTON: "studio-button",
  DISCLOSURE: "studio-disclosure inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold",
  DISCLOSURE_ICON: "w-3.5 h-3.5 shrink-0",
  INPUT: "studio-input",
  SELECT: "studio-input studio-select",
  TEXTAREA: "studio-input studio-textarea",
  SEGMENTED: "studio-segmented",
  SEGMENT: "studio-segment",
  EMPTY: "",
  BUTTON_TYPE: "button",
  UNSTYLED: "unstyled",
  PRIMARY: "primary",
  DANGER: "danger",
  ACCENT: "accent",
  SECONDARY: "secondary",
  APP_HEADER_ROW: "studio-app-header-row w-full px-3 sm:px-5 lg:px-6 py-2 flex items-center justify-between gap-3 sm:gap-5 relative",
  APP_HEADER_BRAND: "studio-app-header-brand flex items-center gap-2 sm:gap-3 min-w-0",
  APP_HEADER_TITLE: "studio-app-header-title min-w-0",
  APP_HEADER_ACTIONS: "studio-app-header-actions flex items-center justify-end gap-1.5 sm:gap-2 shrink-0",
  MENU_BUTTON: "studio-menu-button header-control-item w-8 min-w-[32px] p-0 rounded-xl flex items-center justify-center lg:hidden",
} as const;
export const STUDIO_PAGINATION = {
  FIRST_PAGE: 1,
  VISIBLE_PAGES: 5,
  ROOT: "flex min-w-0 flex-nowrap items-center justify-between gap-2 pt-4",
  SUMMARY: "min-w-0 truncate text-xs text-slate-400",
  CONTROLS: "flex shrink-0 flex-nowrap items-center gap-0.5",
  BUTTON: "studio-pagination-button !h-8 !min-h-8 !max-h-8 min-w-8 !px-1 shrink-0 whitespace-nowrap text-xs font-bold inline-flex items-center justify-center rounded-lg",
  ICON: "w-4 h-4 shrink-0",
} as const;
export const STUDIO_PAGINATION_TEXT = {
  vi: { LABEL: "Phân trang", PREVIOUS: "Trang trước", NEXT: "Trang sau", PAGE: (page: number, total: number): string => `Trang ${page} / ${total}`, RANGE: (start: number, end: number, total: number): string => `${start}–${end} / ${total}`, SUMMARY: (start: number, end: number, total: number): string => `Hiển thị ${start}–${end} / ${total} mục` },
  en: { LABEL: "Pagination", PREVIOUS: "Previous page", NEXT: "Next page", PAGE: (page: number, total: number): string => `Page ${page} / ${total}`, RANGE: (start: number, end: number, total: number): string => `${start}–${end} / ${total}`, SUMMARY: (start: number, end: number, total: number): string => `Showing ${start}–${end} of ${total} items` },
} as const;
export const STUDIO_TEXTS = {
  vi: { AUTO_TITLE: "Tạo video tự động", AUTO_DESCRIPTION: "Từ ý tưởng đến kịch bản, hình ảnh, giọng đọc và video.", CINEMATIC_TITLE: "Sản xuất phim AI", CINEMATIC_DESCRIPTION: "Xây dựng câu chuyện, nhân vật và các cảnh phim trong một quy trình.", OPEN_MENU: "Mở menu", CLOSE_MENU: "Đóng menu" },
  en: { AUTO_TITLE: "Automatic video studio", AUTO_DESCRIPTION: "Turn an idea into a script, images, narration and video.", CINEMATIC_TITLE: "AI film studio", CINEMATIC_DESCRIPTION: "Build your story, characters and film scenes in one workflow.", OPEN_MENU: "Open menu", CLOSE_MENU: "Close menu" },
} as const;
export const STUDIO_BUTTON_PATTERNS = {
  DANGER: /(?:^|\s)bg-(?:red|rose)-[567]00(?:\s|$)/,
  DANGER_GRADIENT: /(?:^|\s)from-(?:red|rose)-[567]00\s+(?:via-(?:red|rose)-[567]00\s+)?to-(?:red|rose)-[567]00(?:\s|$)/,
  PRIMARY: /(?:^|\s)(?:bg-gradient-to-|bg-(?:purple|violet|indigo|blue|fuchsia|pink)-[567]00(?:\s|$))/,
  ACCENT: /(?:^|\s)(?:bg|border|text)-(?:purple|violet|indigo|blue|cyan|sky|fuchsia|pink|rose)-\d/,
  SECONDARY: /(?:^|\s)(?:bg-slate-\d|bg-white(?:\/\d+)?(?:\s|$))/,
} as const;
export const STUDIO_CONTROL_CONTENT = {
  ICON_TAG: "svg",
  MEDIA_TAGS: ["img", "picture", "video", "canvas", "iframe"],
  ROLES: ["switch", "checkbox", "radio", "combobox"],
  HIDDEN_LABEL: /(?:^|\s)sr-only(?:\s|$)/,
  ICON_NAME: /Icon$/,
  // An icon-only button keeps only its layout: fills, frames and every pointer effect (colour, scale, movement, fade) come
  // from the shared icon-button rule.
  ICON_APPEARANCE: /(?:^|:)!?(?:bg-|from-|via-|to-|border(?:-|$)|shadow(?:-|$)|ring(?:-|$))|^(?:hover|active|focus|group-hover):!?(?:text-|scale-|-?translate-|rotate-|opacity-|brightness-)/,
  INTERACTION_APPEARANCE: /(?:^|:)(?:hover|active|focus|focus-within|focus-visible|group-hover|group-active|group-focus-within):!?(?:bg-|from-|via-|to-|border(?:-|$)|ring(?:-|$)|shadow(?:-|$))/,
} as const;

// Shared "confirm delete" dialog used by every screen.
export const STUDIO_CONFIRM = {
  TITLE: "inline-flex items-center gap-2 leading-none text-slate-100",
  TITLE_ICON: "w-4 h-4 text-rose-500 shrink-0",
  TITLE_TEXT: "leading-none text-sm font-extrabold",
  BODY: "space-y-4 text-left",
  MESSAGE: "text-xs sm:text-sm text-slate-300 leading-relaxed",
  WARNING: "p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2",
  WARNING_ICON: "w-4 h-4 text-rose-500 shrink-0",
  ACTIONS: "flex justify-end items-center gap-2.5 pt-3 border-t border-slate-800",
  CANCEL: "h-9 px-4 rounded-xl text-xs font-bold",
  CONFIRM: "h-9 px-5 rounded-xl text-xs font-extrabold",
  MAX_WIDTH: "max-w-md",
} as const;

// Shared video player (Export, Motion, Flow, Shorts, Auto video): YouTube-style controls on every screen.
export const STUDIO_PLAYER = {
  FRAME: "studio-player relative rounded-2xl overflow-hidden bg-black border border-slate-800/80 flex items-center justify-center group/video select-none",
  MEDIA: "absolute inset-0 w-full h-full",
  VIDEO: "absolute inset-0 w-full h-full bg-black",
  FIT_CONTAIN: "object-contain",
  FIT_COVER: "object-cover",
  // Click layer over the picture: a click plays or pauses.
  SURFACE: "absolute inset-0 z-[5] cursor-pointer",
  BIG_PLAY: "absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 flex items-center justify-center pointer-events-none z-[6]",
  BIG_PLAY_ICON: "w-7 h-7 text-white fill-white ml-1",
  BADGE: "absolute top-2.5 left-2.5 max-w-[70%] px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center gap-1 pointer-events-none z-10 truncate",
  BADGE_ICON: "w-3 h-3 shrink-0",
  BAR: "absolute bottom-0 inset-x-0 z-10 px-3 pb-2 pt-10 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-white transition-opacity duration-200",
  TRACK: "group/track relative h-4 flex items-center cursor-pointer",
  TRACK_DISABLED: "pointer-events-none opacity-50",
  SEGMENTS: "absolute inset-x-0 flex gap-[3px] h-[3px] group-hover/track:h-[5px] transition-[height] duration-100",
  SEGMENT: "relative h-full bg-white/30 overflow-hidden",
  SEGMENT_FILL: "absolute inset-y-0 left-0 bg-red-600",
  SEGMENT_HOVER: "absolute inset-y-0 left-0 bg-white/40",
  THUMB: "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[13px] h-[13px] rounded-full bg-red-600 transition-transform duration-100 pointer-events-none",
  HOVER_TIP: "absolute bottom-5 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none",
  HOVER_THUMB: "block rounded-lg border-2 border-white/90 bg-black shadow-lg",
  HOVER_THUMB_EMPTY: "opacity-60",
  HOVER_LABEL: "max-w-[240px] h-8 px-3 rounded-full bg-black/75 text-white text-[13px] font-bold flex items-center gap-2 whitespace-nowrap",
  HOVER_TIME: "shrink-0",
  HOVER_TITLE: "truncate min-w-0",
  CONTROLS: "mt-1 flex items-center justify-between gap-2",
  GROUP: "flex items-center gap-1.5 min-w-0",
  CTRL: "studio-player-ctrl",
  CTRL_ICON: "w-5 h-5",
  CTRL_ICON_FILL: "w-5 h-5 fill-white",
  VOLUME: "studio-player-vol group/vol",
  VOLUME_SLIDER: "studio-player-volume",
  PILL: "studio-player-pill",
  CHAPTER: "studio-player-pill studio-player-chapter",
  CHAPTER_TEXT: "truncate max-w-[16rem]",
  ACTION: "studio-player-pill studio-player-action",
  ACTION_ON: "is-on",
  LOADING: "absolute inset-0 flex items-center justify-center bg-black/50 z-[6]",
  LOADING_ICON: "w-8 h-8 text-white animate-spin",
  ERROR: "text-xs text-rose-400 mt-2",
} as const;
export const STUDIO_PLAYER_TEXT = {
  vi: { PLAY: "Phát", PAUSE: "Tạm dừng", BACK: "Lùi", NEXT: "Tiếp", FULLSCREEN: "Toàn màn hình", EXIT_FULLSCREEN: "Thoát toàn màn hình", MUTE: "Tắt tiếng", UNMUTE: "Bật tiếng", VOLUME: "Âm lượng" },
  en: { PLAY: "Play", PAUSE: "Pause", BACK: "Back", NEXT: "Next", FULLSCREEN: "Fullscreen", EXIT_FULLSCREEN: "Exit fullscreen", MUTE: "Mute", UNMUTE: "Unmute", VOLUME: "Volume" },
} as const;
// Seconds jumped by Back / Next when the video has no scene marks.
export const STUDIO_PLAYER_STEP_SECONDS = 5;
// Words of the scene name shown in the seek-bar hover label.
export const STUDIO_PLAYER_HOVER_WORDS = 3;
// One video plays at a time across the whole app.
export const STUDIO_PLAYER_PLAY_EVENT = "studio-player-play";
