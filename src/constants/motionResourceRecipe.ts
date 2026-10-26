export const MOTION_RESOURCE_RECIPE = {
  INNER: /^<svg\b[^>]*>([\s\S]*)<\/svg>\s*$/i,
  DEFS: /<defs>[\s\S]*?<\/defs>/g,
  TOKEN: /^[a-zA-Z0-9_]+$/,
  MARKER: (token: string): string => `<g data-motion-piece="${token}"/>`,
  INVALID: "Recipe thiếu nền, mảnh hoặc điểm gắn đã khai báo.",
} as const;
