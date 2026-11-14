import { HISTORY_DRAW_STYLE } from "./history.js";
import { HORROR_DRAW_STYLE } from "./horror.js";
import { SKETCH_DRAW_STYLE } from "./sketch.js";
import { COMIC_DRAW_STYLE } from "./comic.js";
import type { MotionStyleFamily } from "./types.js";
export const MOTION_DRAW_STYLES = {
  history: HISTORY_DRAW_STYLE,
  sketch: SKETCH_DRAW_STYLE,
  comic: COMIC_DRAW_STYLE,
  horror: HORROR_DRAW_STYLE,
} as const;
export const MOTION_DRAW_STYLE_DEFAULT = "history" as const;
export const MOTION_DRAW_STYLE_ALIAS: Record<string, keyof typeof MOTION_DRAW_STYLES> = { explainer: "history" };
export const motionStyleRecord = <T>(byFamily: Record<MotionStyleFamily, T>): Record<keyof typeof MOTION_DRAW_STYLES, T> => Object.fromEntries(Object.entries(MOTION_DRAW_STYLES).map(([id, style]) => [id, byFamily[style.family]])) as Record<keyof typeof MOTION_DRAW_STYLES, T>;
