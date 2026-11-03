import type { MotionSceneFormat, MotionSceneView } from "./motionProfiles/framing.js";
export const MOTION_SCENE_INTENT = {
  SHOT_TO_VIEW: { wide: "wide", medium: "medium", medium_close: "medium_close", close: "close", over_shoulder: "over_shoulder", insert: "detail", establishing: "establishing", pov: "close", low: "wide", high: "wide", aerial: "wide" } as Record<string, MotionSceneView>,
  VISUAL_TO_FORMAT: { map: "map", geomap: "map", timeline: "timeline", verdict: "comparison", scoreboard: "comparison", stats: "diagram", counter: "diagram", chapter: "card", title: "card", quote: "card", headline: "card", ending: "card" } as Record<string, MotionSceneFormat>,
  ILLUSTRATION: "illustration" as MotionSceneFormat,
  LOG: (views: number, formats: number): string => `Phân cảnh: bổ sung ${views} khung hình và ${formats} dạng hình theo ý đồ kịch bản bằng code.`,
} as const;
