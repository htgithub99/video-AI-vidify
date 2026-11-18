import type { ReupThumbLayout } from "../types/reup.js";
const REUP_THUMB = { W: 1280, H: 720, FONT: "900 {size}px Impact, 'Arial Black', 'Segoe UI', sans-serif", WHITE: "#ffffff", YELLOW: "#ffd400", RING: "#ffd400", SHADE: "rgba(0,0,0,0.62)", QUALITY: 0.92 } as const;
const load = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
/** Draw `img` covering the box (centre crop). */
const cover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number): void => {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
};
const fitText = (ctx: CanvasRenderingContext2D, line: string, maxWidth: number, start: number): number => {
  let size = start;
  ctx.font = REUP_THUMB.FONT.replace("{size}", String(size));
  while (size > 40 && ctx.measureText(line).width > maxWidth) {
    size -= 4;
    ctx.font = REUP_THUMB.FONT.replace("{size}", String(size));
  }
  return size;
};
const drawLines = (ctx: CanvasRenderingContext2D, lines: string[], x: number, bottom: number, maxWidth: number, align: CanvasTextAlign): void => {
  const sizes = lines.map((line) => fitText(ctx, line.toUpperCase(), maxWidth, 118));
  let y = bottom - sizes.slice(1).reduce((a, b) => a + b * 1.08, 0);
  lines.forEach((line, i) => {
    ctx.font = REUP_THUMB.FONT.replace("{size}", String(sizes[i]));
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.round(sizes[i] * 0.16);
    ctx.strokeStyle = "#000";
    ctx.strokeText(line.toUpperCase(), x, y);
    ctx.fillStyle = i ? REUP_THUMB.YELLOW : REUP_THUMB.WHITE;
    ctx.fillText(line.toUpperCase(), x, y);
    y += sizes[i + 1] ? sizes[i + 1] * 1.08 : 0;
  });
};
/** A thumbnail drawn from real frames as a JPEG data URL: single frame, before/after split, or a circle reveal. */
export const drawReupThumbnail = async (layout: ReupThumbLayout, frames: string[], lines: string[]): Promise<string> => {
  if (!frames[0]) return "";
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
  const clean = lines.filter(Boolean).slice(0, 2);
  if (clean.length) drawLines(ctx, clean, layout === "split" ? W / 2 : 56, H - 56, layout === "split" ? W - 112 : layout === "circle" ? W - 600 : W - 112, layout === "split" ? "center" : "left");
  return canvas.toDataURL("image/jpeg", REUP_THUMB.QUALITY);
};
