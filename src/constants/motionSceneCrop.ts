export const MOTION_SCENE_CROP = {
  VIEWS: ["close", "detail"] as readonly string[],
  SOURCE_VIEWS: ["wide", "medium", "establishing"] as readonly string[],
  HEAD: { DX: -0.3, DY: -0.08, WIDTH: 1.6, HEIGHT: 0.62 },
  DETAIL: { PAD: 0.4 },
  MAX_SCALE: 2.2,
  MIN_SCALE: 1.15,
  PUSH: 0.02,
  NEIGHBOURS: 2,
  WORD: /[\p{L}\p{N}]+/gu,
  SHARED_WORDS: 2,
  LOG: (count: number): string => `Cận cảnh: ${count} hình được cắt bằng camera từ hình liền kề, không gọi AI vẽ.`,
  SKIP_LOG: (id: string): string => `Cận cảnh ${id}: hình nguồn chưa sẵn sàng hoặc quá nhỏ, vẽ mới.`,
} as const;
