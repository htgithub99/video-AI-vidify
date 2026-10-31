export const MOTION_RENDER_BEHAVIOR = {
  VERSION: 1,
  INVALID: "Cấu hình chuyển động không hợp lệ. Hãy chọn lại Chuyển động cảnh.",
  DEFAULT: { version: 1, actors: "fixed", sceneEffects: "off", camera: "fixed" },
  CAMERA: { DETAIL_CLUE_SCALE: 4.5, DETAIL_CHARACTER_SCALE: 2.8, DETAIL_CHARACTER_HEIGHT: 0.55, DETAIL_ATTACHMENT_WIDTH: 1.5, DETAIL_ATTACHMENT_HEIGHT: 0.3 },
  ACTOR: { AMOUNT: 0.006, SECONDS: 7 },
  EFFECT: { RAIN: "#afc3d0", SMOKE: "#b9c0c3", FLAME: "#efba6c", GLOW: "#d99745", FOG: "#8d9b9f", RAIN_COUNT: 72, SMOKE_COUNT: 7, FOG_COUNT: 4 },
  LOG: (actors: string, effects: string, camera: string) => `Cấu hình dựng: nhân vật ${actors === "simple" ? "có chuyển động" : "giữ tư thế"}; hiệu ứng ${effects === "gentle" ? "nhẹ" : "tắt"}; camera ${camera === "gentle" ? "theo hành động chính" : "cố định"}.`,
} as const;
