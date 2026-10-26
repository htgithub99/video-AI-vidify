import os from "os";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { PUPPET as P } from "../../../constants/motionPuppet.js";
import { balanceSvgTags } from "../../../lib/motionSvgBalance.js";
import { rasterizeMotionSvgs } from "../motionRenderService.js";
import type { MotionAiImage } from "../motionStoryService.js";
import { puppetHash } from "./kitLibrary.js";
import type { PuppetCharacter, PuppetStylePack, PuppetViews } from "../../../types/motionPuppet.js";
const repair = (raw: string): string => {
  const text = raw.replace(P.ENT_LT_RE, P.LT).replace(P.ENT_GT_RE, P.GT).replace(P.ENT_QUOT_RE, P.QUOT).replace(P.ENT_AMP_RE, P.AMP);
  if (P.SVG_EXTRACT_RE.test(text)) return text;
  const start = text.search(P.SVG_TAG_RE);
  const end = text.lastIndexOf(P.GT);
  return start >= 0 && end > start ? text.slice(start, end + 1) + P.SVG_CLOSE : text;
};
export const cleanPuppetSvg = (raw: unknown, maxBytes: number): string => {
  const found = repair(String(raw || P.EMPTY)).match(P.SVG_EXTRACT_RE);
  let svg = _.trim(found ? found[0] : P.EMPTY)
    .replace(P.SVG_STRIP_RE, P.EMPTY)
    .replace(P.SVG_FILTER_ATTR_RE, P.EMPTY);
  if (svg) svg = balanceSvgTags(svg);
  if (svg && !P.SVG_XMLNS_RE.test(svg.slice(0, svg.indexOf(P.GT) + 1))) svg = P.SVG_OPEN + P.SVG_XMLNS + svg.slice(P.SVG_OPEN.length);
  const bad = svg.match(P.SVG_FORBIDDEN_RE);
  const reason = !svg ? P.WHY_NO_SVG : !P.VIEWBOX_RE.test(svg) ? P.WHY_NO_VIEWBOX : bad ? bad[0] : !P.SVG_START_RE.test(svg) || !P.SVG_END_RE.test(svg) ? P.WHY_BROKEN : P.EMPTY;
  if (reason) throw new Error(P.ERR_SVG + P.DASH + reason);
  if (Buffer.byteLength(svg) > maxBytes) throw new Error(P.ERR_SIZE);
  return svg;
};
export const svgShapes = (svg: string): number => (svg.match(P.SHAPE_RE) || []).length;
const inner = (svg: string): string => {
  const m = svg.match(P.SVG_INNER_RE);
  return m ? m[1] : P.EMPTY;
};
const vbOf = (svg: string, d: string): string => {
  const m = svg.match(P.VIEWBOX_VAL_RE);
  return m ? m[1] : d;
};
export const characterSheetSvg = (c: { head: PuppetViews; body: PuppetViews }, headRatio: number): string => {
  const W = 1200,
    H = 1000,
    col = W / 3;
  const parts: string[] = [];
  P.VIEWS.forEach((v, i) => {
    const head = c.head[v as keyof PuppetViews],
      body = c.body[v as keyof PuppetViews];
    const hw = col * 0.62,
      hh = hw;
    const bw = col * 0.62,
      bh = Math.max(200, H * 0.85 - hh * (1 - headRatio * 0.2));
    const x = i * col + (col - hw) / 2;
    if (body) parts.push(P.NESTED_SVG(x, H - bh - 20, bw, bh, vbOf(body, P.BODY_VB), inner(body)));
    if (head) parts.push(P.NESTED_SVG(x, H - bh - 20 - hh * 0.88, hw, hh, vbOf(head, P.HEAD_VB), inner(head)));
  });
  return P.SHEET_SVG(W, H, parts.join(P.EMPTY));
};
export const puppetImages = async (items: { svg: string; w: number; h: number; label?: string }[]): Promise<MotionAiImage[]> => {
  const dir = path.join(os.tmpdir(), P.CHECK_DIR);
  const jobs = _.map(items, (it) => ({ svg: balanceSvgTags(it.svg), file: path.join(dir, puppetHash(it.svg + it.w + (it.label || P.EMPTY)) + P.PNG_EXT), width: it.w, height: it.h, label: it.label }));
  const files = await rasterizeMotionSvgs(jobs).catch(() => [] as string[]);
  return files.length === jobs.length ? _.map(files, (f) => ({ name: path.basename(f), mimeType: P.PNG_MIME, path: f })) : [];
};
export const puppetReviewBoard = async (candidates: MotionAiImage[], references: MotionAiImage[]): Promise<MotionAiImage[]> => {
  if (!candidates.length) return [];
  const images = [...candidates, ...references];
  const [w, h] = P.SET_PNG;
  const cells = images.map((image, index) => {
    const bytes = fs.readFileSync(image.path);
    const source = `data:${image.mimeType};base64,${bytes.toString("base64")}`;
    const x = (index % P.CHECK_BOARD_COLUMNS) * w;
    const y = Math.floor(index / P.CHECK_BOARD_COLUMNS) * h;
    return index < candidates.length ? P.CHECK_CELL(x, y, w, h, source) : P.CHECK_REFERENCE_CELL(x, y, w, h, source, index - candidates.length);
  });
  return puppetImages([{ svg: P.CHECK_BOARD(w * P.CHECK_BOARD_COLUMNS, h * Math.ceil(images.length / P.CHECK_BOARD_COLUMNS), cells.join(P.EMPTY)), w: w * P.CHECK_BOARD_COLUMNS, h: h * Math.ceil(images.length / P.CHECK_BOARD_COLUMNS) }]);
};
export const proceduralViews = (c: Pick<PuppetCharacter, "colors">, style: Pick<PuppetStylePack, "face" | "line">): { head: PuppetViews; body: PuppetViews } => {
  const F = style.face;
  const fill = c.colors.face || F.fill || P.PROC_FACE;
  const line = style.line.color;
  const eye = (fx: number): string => P.PROC_DOT(400 * fx, 400 * F.eyeY, 200 * F.eyeW, 200 * F.eyeH * (F.eyes === P.EYES[1] ? 0.4 : 1), F.eyeColor);
  const mouth = (fx: number): string => (F.mouthRest === P.MOUTH_RESTS[1] ? P.PROC_DOT(400 * fx, 400 * F.mouthY, 200 * F.mouthW, 200 * F.mouthH, F.eyeColor) : P.EMPTY);
  const front = eye(0.5 - F.eyeGap / 2) + eye(0.5 + F.eyeGap / 2) + mouth(0.5);
  const side = eye(0.5 + P.PROC_SIDE_X) + mouth(0.5 + P.PROC_SIDE_X);
  const head = (face: string): string => P.PROC_HEAD(fill, line, P.PROC_SW, face);
  const body = P.PROC_BODY(c.colors.body || line, line, P.PROC_SW);
  return { head: { front: head(front), side: head(side), back: head(P.EMPTY) }, body: { front: body, side: body, back: body } };
};
