import _ from "lodash";
import { REUP_WATERMARK as W } from "../constants/reupConfig.js";
import type { ReupCorner } from "../types/reup.js";
const BOXES: Record<ReupCorner | "mid", [number, number, number, number]> = { tl: [0, W.BOX.W, 0, W.BOX.H], tr: [1 - W.BOX.W, 1, 0, W.BOX.H], bl: [0, W.BOX.W, 1 - W.BOX.H, 1], br: [1 - W.BOX.W, 1, 1 - W.BOX.H, 1], mid: [0.3, 0.7, 0.3, 0.7] };
const detail = (frame: Uint8Array, width: number, height: number, r: number, into: Float64Array): void => {
  const stride = width + 1;
  const sum = new Float64Array(stride * (height + 1));
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      row += frame[y * width + x];
      sum[(y + 1) * stride + x + 1] = sum[y * stride + x + 1] + row;
    }
  }
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - r),
      y1 = Math.min(height, y + r + 1);
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - r),
        x1 = Math.min(width, x + r + 1);
      const mean = (sum[y1 * stride + x1] - sum[y0 * stride + x1] - sum[y1 * stride + x0] + sum[y0 * stride + x0]) / ((y1 - y0) * (x1 - x0));
      into[y * width + x] += frame[y * width + x] - mean;
    }
  }
};
export const reupWatermarkCorner = (raw: Uint8Array, width = W.WIDTH, height = W.HEIGHT): ReupCorner | undefined => {
  const size = width * height;
  const count = Math.floor(raw.length / size);
  if (count < W.MIN_FRAMES) return undefined;
  const acc = new Float64Array(size);
  for (let i = 0; i < count; i++) detail(raw.subarray(i * size, (i + 1) * size), width, height, W.RADIUS, acc);
  const score = ([x0, x1, y0, y1]: [number, number, number, number]): number => {
    const values: number[] = [];
    for (let y = Math.floor(y0 * height); y < Math.floor(y1 * height); y++) for (let x = Math.floor(x0 * width); x < Math.floor(x1 * width); x++) values.push(Math.abs(acc[y * width + x] / count));
    values.sort((a, b) => a - b);
    return values[Math.floor((values.length - 1) * W.PERCENTILE)] || 0;
  };
  const scores = _.mapValues(BOXES, score);
  const best = _.maxBy(["tl", "tr", "bl", "br"] as ReupCorner[], (c) => scores[c])!;
  const rest = _.sortBy(_.without(Object.keys(scores), best).map((k) => scores[k as keyof typeof scores]));
  const median = rest[Math.floor(rest.length / 2)];
  return scores[best] >= W.MIN_SCORE && scores[best] >= median * W.RATIO ? best : undefined;
};
export const reupWatermarkCrop = (corner: ReupCorner | undefined): string => {
  if (!corner) return "";
  const keep = 1 - W.CROP;
  return `crop=iw*${keep}:ih*${keep}:${corner.endsWith("l") ? `iw*${W.CROP}` : "0"}:${corner.startsWith("t") ? `ih*${W.CROP}` : "0"},`;
};
