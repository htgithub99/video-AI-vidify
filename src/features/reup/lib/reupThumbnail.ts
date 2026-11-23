import { REUP_CSS_FONTS, REUP_TEXT, REUP_THUMBS, reupFontScript } from "../constants/reupConfig.js";
import type { ReupThumbIdea, ReupThumbSpot } from "../types/reup.js";
const REUP_THUMB = {
  W: 1280,
  H: 720,
  PAD: 56,
  MAX_SIZE: 128,
  MIN_SIZE: 44,
  WHITE: "#ffffff",
  YELLOW: "#ffd400",
  INK: "#111111",
  STROKE: "rgba(0,0,0,0.9)",
  SHADOW: "rgba(0,0,0,0.55)",
  RING: "#ffd400",
  SHADE: "rgba(0,0,0,0.62)",
  GRADE: "contrast(1.14) saturate(1.22) brightness(1.03)",
  VIGNETTE: "rgba(0,0,0,0.55)",
  WARM: "rgba(255,170,60,0.10)",
  COOL: "rgba(40,90,160,0.12)",
  CIRCLE_R: 210,
  CIRCLE_ROOM: 600,
  GAP: 10,
  TAG_SIZE: 76,
  TAG_PAD: 22,
  GRID: 8,
  SKIN: 2,
  SUBJECT: 0.9,
  SUBJECT_SPAN: 0.16,
  MIN_ROOM: 0.55,
  RANK: 0.12,
  HINT: 0.1,
  LIT_TARGET: 95,
  LIT_MAX: 1.7,
  QUALITY: 0.92,
} as const;
type Box = [number, number, number, number];
const load = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
type Pic = HTMLImageElement | HTMLCanvasElement;
const lit = (img: HTMLImageElement): Pic => {
  const probe = document.createElement("canvas");
  probe.width = 32;
  probe.height = 18;
  const p = probe.getContext("2d");
  if (!p) return img;
  p.drawImage(img, 0, 0, 32, 18);
  let luma = 255;
  try {
    const d = p.getImageData(0, 0, 32, 18).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    luma = sum / (d.length / 4);
  } catch {
    return img;
  }
  if (luma >= REUP_THUMB.LIT_TARGET) return img;
  const out = document.createElement("canvas");
  out.width = img.width;
  out.height = img.height;
  const o = out.getContext("2d");
  if (!o) return img;
  o.filter = `brightness(${Math.min(REUP_THUMB.LIT_MAX, REUP_THUMB.LIT_TARGET / Math.max(1, luma)).toFixed(2)}) contrast(1.05)`;
  o.drawImage(img, 0, 0);
  return out;
};
const cover = (ctx: CanvasRenderingContext2D, img: Pic, [x, y, w, h]: Box, focus = 0.5, zoom = 1): void => {
  const scale = Math.max(w / img.width, h / img.height) * zoom;
  const sw = w / scale;
  const sh = h / scale;
  const sx = Math.min(Math.max(img.width * focus - sw / 2, 0), img.width - sw);
  ctx.drawImage(img, sx, (img.height - sh) / 2, sw, sh, x, y, w, h);
};
const grade = (ctx: CanvasRenderingContext2D, draw: () => void): void => {
  const { W, H } = REUP_THUMB;
  ctx.save();
  ctx.filter = REUP_THUMB.GRADE;
  draw();
  ctx.restore();
  const tone = ctx.createLinearGradient(0, 0, W, H);
  tone.addColorStop(0, REUP_THUMB.COOL);
  tone.addColorStop(1, REUP_THUMB.WARM);
  ctx.fillStyle = tone;
  ctx.fillRect(0, 0, W, H);
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, REUP_THUMB.VIGNETTE);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
};
const fontOf = (css: string, size: number): string => css.replace("{size}", String(Math.round(size)));
const fitBlock = (ctx: CanvasRenderingContext2D, css: string, lines: string[], maxWidth: number, maxHeight: number, least: number = REUP_THUMB.MIN_SIZE): number => {
  let size = REUP_THUMB.MAX_SIZE;
  const fits = (): boolean => {
    ctx.font = fontOf(css, size);
    return lines.every((line) => ctx.measureText(line).width <= maxWidth) && size * (1 + (lines.length - 1) * REUP_TEXT.THUMB_LINE_HEIGHT) <= maxHeight;
  };
  while (size > least && !fits()) size -= 2;
  return size;
};
const anchor = (spot: ReupThumbSpot, box: Box): { x: number; align: CanvasTextAlign; top: boolean } => {
  const [bx, , bw] = box;
  const P = REUP_THUMB.PAD;
  return spot[1] === "l" ? { x: bx + P, align: "left", top: spot[0] === "t" } : spot[1] === "r" ? { x: bx + bw - P, align: "right", top: spot[0] === "t" } : { x: bx + bw / 2, align: "center", top: spot[0] === "t" };
};
const shade = (ctx: CanvasRenderingContext2D, top: boolean, box: Box): void => {
  const [x, y, w, h] = box;
  const g = top ? ctx.createLinearGradient(0, y + h * 0.55, 0, y) : ctx.createLinearGradient(0, y + h * 0.45, 0, y + h);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, REUP_THUMB.SHADE);
  ctx.fillStyle = g;
  if (top) ctx.fillRect(x, y, w, h * 0.55);
  else ctx.fillRect(x, y + h * 0.45, w, h * 0.55);
};
interface Placed {
  size: number;
  x: number;
  align: CanvasTextAlign;
  first: number;
  step: number;
  rect: Box;
}
const place = (ctx: CanvasRenderingContext2D, css: string, lines: string[], spot: ReupThumbSpot, box: Box, maxWidth: number, least?: number): Placed => {
  const { x, align, top } = anchor(spot, box);
  const size = fitBlock(ctx, css, lines, maxWidth, box[3] * REUP_TEXT.THUMB_BLOCK, least);
  const step = size * REUP_TEXT.THUMB_LINE_HEIGHT;
  const first = top ? box[1] + REUP_THUMB.PAD + size : box[1] + box[3] - REUP_THUMB.PAD - (lines.length - 1) * step;
  ctx.font = fontOf(css, size);
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const left = align === "left" ? x : align === "right" ? x - w : x - w / 2;
  return { size, x, align, first, step, rect: [left, first - size, w, (lines.length - 1) * step + size * 1.15] };
};
const drawLines = (ctx: CanvasRenderingContext2D, css: string, lines: string[], p: Placed): void => {
  ctx.font = fontOf(css, p.size);
  ctx.textAlign = p.align;
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  lines.forEach((line, i) => {
    const y = p.first + i * p.step;
    ctx.save();
    ctx.shadowColor = REUP_THUMB.SHADOW;
    ctx.shadowBlur = p.size * 0.18;
    ctx.shadowOffsetY = p.size * 0.05;
    ctx.lineWidth = Math.max(3, Math.round(p.size * REUP_TEXT.THUMB_OUTLINE * 2));
    ctx.strokeStyle = REUP_THUMB.STROKE;
    ctx.strokeText(line, p.x, y);
    ctx.restore();
    ctx.fillStyle = i ? REUP_THUMB.YELLOW : REUP_THUMB.WHITE;
    ctx.fillText(line, p.x, y);
  });
};
const roomFor = (spot: ReupThumbSpot, box: Box, width: number, focus?: number): number => {
  if (focus === undefined || spot[1] === "c") return width;
  const { W, PAD, SUBJECT_SPAN, MIN_ROOM } = REUP_THUMB;
  const near = spot[1] === "l" ? focus * W - W * SUBJECT_SPAN - box[0] - PAD : box[0] + box[2] - PAD - (focus * W + W * SUBJECT_SPAN);
  return Math.min(width, Math.max(box[2] * MIN_ROOM, near));
};
const busyMap = (ctx: CanvasRenderingContext2D): ((r: Box) => number) => {
  const { W, H, GRID: g } = REUP_THUMB;
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, W, H).data;
  } catch {
    return () => 0;
  }
  const cols = Math.floor(W / g);
  const rows = Math.floor(H / g);
  const luma = (x: number, y: number): number => {
    const i = (y * W + x) * 4;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  };
  const cell = new Float32Array(cols * rows);
  for (let r = 0; r < rows - 1; r++)
    for (let c = 0; c < cols - 1; c++) {
      const x = c * g;
      const y = r * g;
      const i = (y * W + x) * 4;
      const [R, G, B] = [data[i], data[i + 1], data[i + 2]];
      const skin = R > 95 && G > 40 && B > 20 && R > G && R > B && R - Math.min(G, B) > 15 && Math.abs(R - G) > 15 ? REUP_THUMB.SKIN : 0;
      cell[r * cols + c] = (Math.abs(luma(x + g, y) - luma(x, y)) + Math.abs(luma(x, y + g) - luma(x, y))) / 64 + skin;
    }
  return ([x, y, w, h]: Box): number => {
    let sum = 0;
    let n = 0;
    for (let r = Math.max(0, Math.floor(y / g)); r < Math.min(rows, Math.ceil((y + h) / g)); r++)
      for (let c = Math.max(0, Math.floor(x / g)); c < Math.min(cols, Math.ceil((x + w) / g)); c++) {
        sum += cell[r * cols + c];
        n++;
      }
    return n ? sum / n : 0;
  };
};
const pickSpot = (ctx: CanvasRenderingContext2D, idea: ReupThumbIdea, prefer: readonly string[], rectOf: (spot: ReupThumbSpot) => Box): ReupThumbSpot => {
  const allowed = (idea.layout === "ai" && idea.kind === "split" ? REUP_THUMBS.SPLIT_SPOTS : REUP_THUMBS.SPOTS[idea.layout]) as readonly ReupThumbSpot[];
  if (idea.pin && idea.spot) return idea.spot;
  const busy = busyMap(ctx);
  const subject = idea.focus === undefined ? undefined : idea.focus * REUP_THUMB.W;
  const score = (spot: ReupThumbSpot): number => {
    const rect = rectOf(spot);
    const overlap = subject === undefined ? 0 : Math.max(0, Math.min(rect[0] + rect[2], subject + REUP_THUMB.W * REUP_THUMB.SUBJECT_SPAN) - Math.max(rect[0], subject - REUP_THUMB.W * REUP_THUMB.SUBJECT_SPAN)) / (REUP_THUMB.W * REUP_THUMB.SUBJECT_SPAN * 2);
    const rank = prefer.indexOf(spot);
    return busy(rect) + overlap * REUP_THUMB.SUBJECT + (rank < 0 ? prefer.length : rank) * REUP_THUMB.RANK - (spot === idea.spot ? REUP_THUMB.HINT : 0);
  };
  return allowed.reduce((best, spot) => (score(spot) < score(best) ? spot : best), allowed[0]);
};
const tagRect = (ctx: CanvasRenderingContext2D, css: string, text: string, spot: ReupThumbSpot, box: Box): Box => {
  const { TAG_SIZE: size, TAG_PAD: pad, PAD } = REUP_THUMB;
  ctx.font = fontOf(css, size);
  const w = Math.min(box[2] - PAD * 2, ctx.measureText(text).width + pad * 2);
  const h = size + pad * 1.4;
  const x = spot[1] === "l" ? box[0] + PAD : spot[1] === "r" ? box[0] + box[2] - PAD - w : box[0] + (box[2] - w) / 2;
  const y = spot[0] === "t" ? box[1] + PAD : box[1] + box[3] - PAD - h;
  return [x, y, w, h];
};
const drawTag = (ctx: CanvasRenderingContext2D, css: string, text: string, [x, y, w, h]: Box): void => {
  const { TAG_SIZE: size, TAG_PAD: pad } = REUP_THUMB;
  ctx.font = fontOf(css, size);
  ctx.fillStyle = REUP_THUMB.YELLOW;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = REUP_THUMB.INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, y + h / 2 + size * 0.04, w - pad);
};
const rewrap = (ctx: CanvasRenderingContext2D, css: string, lines: string[], width: number): { lines: string[]; size: number } => {
  const words = lines.join(" ").split(/\s+/).filter(Boolean);
  const wrap = (size: number): string[] => {
    ctx.font = fontOf(css, size);
    const out: string[] = [];
    for (const word of words) {
      const last = out[out.length - 1];
      if (last && ctx.measureText(`${last} ${word}`).width <= width) out[out.length - 1] = `${last} ${word}`;
      else out.push(word);
    }
    return out;
  };
  for (let size = REUP_THUMBS.AI.TEXT_MIN; size >= REUP_THUMB.MIN_SIZE; size -= 4) {
    const out = wrap(size);
    if (out.length <= REUP_THUMBS.AI.LINES && out.every((l) => ctx.measureText(l).width <= width)) return { lines: out, size };
  }
  return { lines: wrap(REUP_THUMB.MIN_SIZE), size: REUP_THUMB.MIN_SIZE };
};
const readable = (ctx: CanvasRenderingContext2D): boolean => {
  const { SMALL, FLAT } = REUP_THUMBS.AI;
  const probe = document.createElement("canvas");
  probe.width = SMALL;
  probe.height = Math.round((SMALL * REUP_THUMB.H) / REUP_THUMB.W);
  const p = probe.getContext("2d");
  if (!p) return true;
  p.drawImage(ctx.canvas, 0, 0, probe.width, probe.height);
  try {
    const d = p.getImageData(0, 0, probe.width, probe.height).data;
    const l: number[] = [];
    for (let i = 0; i < d.length; i += 4) l.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    const mean = l.reduce((a, b) => a + b, 0) / l.length;
    return Math.sqrt(l.reduce((a, b) => a + (b - mean) ** 2, 0) / l.length) >= FLAT;
  } catch {
    return true;
  }
};
export const drawReupPending = (label: string, lang = "en"): string => {
  const { W, H } = REUP_THUMB;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0f172a");
  g.addColorStop(1, "#3b0764");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.font = fontOf(REUP_CSS_FONTS[reupFontScript(lang)], 64);
  ctx.fillStyle = REUP_THUMB.WHITE;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, W / 2, H / 2);
  return canvas.toDataURL("image/jpeg", REUP_THUMB.QUALITY);
};
export const drawReupThumbnail = async (idea: ReupThumbIdea, frames: string[], lang = "en", prefer: readonly string[] = []): Promise<string> => {
  if (idea.layout === "ai" && idea.image) frames = [idea.image];
  if (!frames[0]) return "";
  const css = REUP_CSS_FONTS[reupFontScript(lang)];
  let lines = idea.lines
    .map((l) => l.trim().toLocaleUpperCase(lang))
    .filter(Boolean)
    .slice(0, 2);
  await document.fonts?.load(fontOf(css, 100), lines.join(" ")).catch(() => undefined);
  const imgs = (await Promise.all(frames.slice(0, 3).map(load))).map((img) => (idea.layout === "ai" ? img : lit(img)));
  const [a, b = a, c = b] = imgs;
  const { W, H, GAP } = REUP_THUMB;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const full: Box = [0, 0, W, H];
  const focus = idea.focus ?? 0.5;
  let textBox = full;
  let width = W - REUP_THUMB.PAD * 2;
  let least: number = REUP_THUMBS.AI.TEXT_MIN;
  if (idea.layout === "ai") {
    if (idea.kind !== "split" && lines.length) {
      textBox = [0, 0, Math.round(W * REUP_THUMBS.AI.COLUMN), H];
      width = textBox[2] - REUP_THUMB.PAD * 2;
      const wrapped = rewrap(ctx, css, lines, width);
      lines = wrapped.lines;
      least = wrapped.size;
    }
    cover(ctx, a, full);
    if (!readable(ctx)) {
      ctx.save();
      ctx.filter = `contrast(${REUP_THUMBS.AI.PUNCH}) saturate(${REUP_THUMBS.AI.PUNCH})`;
      cover(ctx, a, full);
      ctx.restore();
    }
  } else if (idea.layout === "cinema" || idea.layout === "badge") grade(ctx, () => cover(ctx, a, full, focus));
  else if (idea.layout === "split" && imgs.length > 1) {
    cover(ctx, a, [0, 0, W / 2, H], focus);
    cover(ctx, b, [W / 2, 0, W / 2, H]);
    ctx.fillStyle = REUP_THUMB.WHITE;
    ctx.fillRect(W / 2 - GAP / 2, 0, GAP, H);
  } else if (idea.layout === "collage" && imgs.length > 1) {
    const big = Math.round((W * 2) / 3);
    ctx.fillStyle = REUP_THUMB.WHITE;
    ctx.fillRect(0, 0, W, H);
    cover(ctx, a, [0, 0, big - GAP / 2, H], focus);
    cover(ctx, b, [big + GAP / 2, 0, W - big - GAP / 2, H / 2 - GAP / 2]);
    cover(ctx, c, [big + GAP / 2, H / 2 + GAP / 2, W - big - GAP / 2, H / 2 - GAP / 2]);
    textBox = [0, 0, big - GAP / 2, H];
    width = textBox[2] - REUP_THUMB.PAD * 2;
  } else cover(ctx, a, full, focus);
  if (idea.layout === "circle" && imgs.length > 1) {
    const r = REUP_THUMB.CIRCLE_R;
    const cx = W - r - 60;
    const cy = r + 50;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    cover(ctx, b, [cx - r, cy - r, r * 2, r * 2]);
    ctx.restore();
    ctx.lineWidth = 14;
    ctx.strokeStyle = REUP_THUMB.RING;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    width = W - REUP_THUMB.CIRCLE_ROOM;
  }
  if (idea.layout === "split") width = W - REUP_THUMB.PAD * 2;
  if (lines.length && idea.layout === "badge")
    drawTag(
      ctx,
      css,
      lines[0],
      tagRect(
        ctx,
        css,
        lines[0],
        pickSpot(ctx, idea, prefer, (spot) => tagRect(ctx, css, lines[0], spot, textBox)),
        textBox,
      ),
    );
  else if (lines.length && idea.layout !== "cinema") {
    const fit = (s: ReupThumbSpot) => place(ctx, css, lines, s, textBox, roomFor(s, textBox, width, idea.layout === "hero" || idea.layout === "circle" ? idea.focus : undefined), idea.layout === "ai" ? least : undefined);
    const spot = pickSpot(ctx, idea, prefer, (s) => fit(s).rect);
    shade(ctx, spot[0] === "t", textBox);
    drawLines(ctx, css, lines, fit(spot));
  }
  return canvas.toDataURL("image/jpeg", REUP_THUMB.QUALITY);
};
