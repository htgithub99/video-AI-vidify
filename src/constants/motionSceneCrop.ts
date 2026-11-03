export const MOTION_SCENE_CROP = {
  SVG_ROOT: /<svg\b[^>]*>/i,
  VIEWBOX: /\sviewBox\s*=\s*(["'])([^"']*)\1/i,
  ASPECT: /\spreserveAspectRatio\s*=\s*(["'])[^"']*\1/i,
  WIDTH: /\swidth\s*=\s*(["'])([\d.]+)/i,
  HEIGHT: /\sheight\s*=\s*(["'])([\d.]+)/i,
  NUMBERS: /-?[\d.]+(?:e-?\d+)?/gi,
  SLICE: "xMidYMid slice",
  ROOT_END: /\s*>$/,
  CACHE: 32,
  PUSH: 0.03,
} as const;
