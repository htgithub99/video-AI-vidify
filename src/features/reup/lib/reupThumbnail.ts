import { REUP_CSS_FONTS, REUP_TEXT, reupFontScript } from "../constants/reupConfig.js";
import type { ReupThumbLayout } from "../types/reup.js";
const REUP_THUMB = { W: 1280, H: 720, MAX_SIZE: 128, MIN_SIZE: 44, WHITE: "#ffffff", YELLOW: "#ffd400", STROKE: "rgba(0,0,0,0.9)", SHADOW: "rgba(0,0,0,0.55)", RING: "#ffd400", SHADE: "rgba(0,0,0,0.62)", QUALITY: 0.92 } as const;
const load = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
const cover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number): void => {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
};
const fontOf = (css: string, size: number): string => css.replace("{size}", String(Math.round(size)));
const fitBlock = (ctx: CanvasRenderingContext2D, css: string, lines: string[], maxWidth: number, maxHeight: number): number => {
  let size = REUP_THUMB.MAX_SIZE;
  const fits = (): boolean => {
    ctx.font = fontOf(css, size);
    return lines.every((line) => ctx.measureText(line).width <= maxWidth) && size * (1 + (lines.length - 1) * REUP_TEXT.THUMB_LINE_HEIGHT) <= maxHeight;
  };
  while (size > REUP_THUMB.MIN_SIZE && !fits()) size -= 2;
  return size;
};
const drawLines = (ctx: CanvasRenderingContext2D, css: string, lines: string[], x: number, bottom: number, maxWidth: number, align: CanvasTextAlign): void => {
  const size = fitBlock(ctx, css, lines, maxWidth, REUP_THUMB.H * REUP_TEXT.THUMB_BLOCK);
  const step = size * REUP_TEXT.THUMB_LINE_HEIGHT;
  ctx.font = fontOf(css, size);
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  lines.forEach((line, i) => {
    const y = bottom - (lines.length - 1 - i) * step;
    ctx.save();
    ctx.shadowColor = REUP_THUMB.SHADOW;
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.05;
    ctx.lineWidth = Math.max(3, Math.round(size * REUP_TEXT.THUMB_OUTLINE * 2));
    ctx.strokeStyle = REUP_THUMB.STROKE;
    ctx.strokeText(line, x, y);
    ctx.restore();
    ctx.fillStyle = i ? REUP_THUMB.YELLOW : REUP_THUMB.WHITE;
    ctx.fillText(line, x, y);
  });
};
export const drawReupThumbnail = async (layout: ReupThumbLayout, frames: string[], lines: string[], lang = "en"): Promise<string> => {
  if (!frames[0]) return "";
  const css = REUP_CSS_FONTS[reupFontScript(lang)];
  await document.fonts?.load(fontOf(css, 100), lines.join(" ")).catch(() => undefined);
  const [a, b] = await Promise.all([load(frames[0]), frames[1] ? load(frames[1]) : Promise.resolve(undefined)]);
  const { W, H } = REUP_THUMB;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  if (layout === "split" && b) {
    cover(ctx, a, 0, 0, W / 2, H);
    cover(ctx, b, W / 2, 0, W / 2, H);
    ctx.fillStyle = REUP_THUMB.WHITE;
    ctx.fillRect(W / 2 - 5, 0, 10, H);
  } else cover(ctx, a, 0, 0, W, H);
  if (layout === "circle" && b) {
    const r = 210;
    const cx = W - r - 60;
    const cy = r + 50;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    cover(ctx, b, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
    ctx.lineWidth = 14;
    ctx.strokeStyle = REUP_THUMB.RING;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  const shade = ctx.createLinearGradient(0, H * 0.45, 0, H);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(1, REUP_THUMB.SHADE);
  ctx.fillStyle = shade;
  ctx.fillRect(0, H * 0.45, W, H * 0.55);
  const clean = lines
    .map((l) => l.trim().toLocaleUpperCase(lang))
    .filter(Boolean)
    .slice(0, 2);
  if (clean.length) drawLines(ctx, css, clean, layout === "split" ? W / 2 : 56, H - 56, layout === "split" ? W - 112 : layout === "circle" ? W - 600 : W - 112, layout === "split" ? "center" : "left");
  return canvas.toDataURL("image/jpeg", REUP_THUMB.QUALITY);
};
