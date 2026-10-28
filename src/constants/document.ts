import { LOADING_CONFIG } from "./loading";
import { STORAGE_KEYS } from "./storageKeys";
export const DOCUMENT_CONFIG = { TITLE: "AI Video Factory", FONTS_ORIGIN: "https://fonts.googleapis.com", FONTS_STATIC_ORIGIN: "https://fonts.gstatic.com", FONT_STYLESHEET: LOADING_CONFIG.GOOGLE_FONTS_URL, THEME: { storageKey: STORAGE_KEYS.APP_THEME, light: "light", dark: "dark" } } as const;
