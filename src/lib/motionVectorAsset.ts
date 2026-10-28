import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { parseJson } from "./jsonStringify.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import type { MotionVectorAsset } from "../types/motionVisual.js";
import { MOTION_SCENE_COMPOSITION as C } from "../constants/motionSceneComposition.js";
const tags = new Set([RT_SHARED.SVG, RT_CORE.G, RT_CORE.PATH, RT_CORE.RECT, RT_CORE.CIRCLE, RT_CORE.ELLIPSE, RT_CORE.POLYGON, RT_CORE.POLYLINE, RT_CORE.LINE, RT_CORE.DEFS, RT_CORE.LINEARGRADIENT, RT_CORE.RADIALGRADIENT, RT_CORE.STOP, RT_CORE.CLIPPATH, RT_CORE.MASK, RT_SHARED.TITLE, RT_SHARED.DESC] as string[]);
export const parseRemotionAssetReply = (text: string): unknown => {
  const start = text.indexOf(RT_CORE.SYMBOL_021FB5);
  if (start < 0) return undefined;
  const stack: string[] = [];
  let quoted = false,
    escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === RT_CORE.SYMBOL) escaped = true;
      else if (ch === RT_CORE.SYMBOL_8A331F) quoted = false;
      continue;
    }
    if (ch === RT_CORE.SYMBOL_8A331F) quoted = true;
    else if (ch === RT_CORE.SYMBOL_021FB5 || ch === RT_CORE.SYMBOL_245843) stack.push(ch === RT_CORE.SYMBOL_021FB5 ? RT_CORE.SYMBOL_D10B36 : RT_SHARED.SYMBOL_CFAE0D);
    else if (ch === RT_CORE.SYMBOL_D10B36 || ch === RT_SHARED.SYMBOL_CFAE0D) {
      if (stack.pop() !== ch) return undefined;
      if (!stack.length) {
        try {
          const value = parseJson(text.slice(start, i + 1));
          return typeof value.svg === "string" || (value.anchors && typeof value.anchors === "object") ? value : undefined;
        } catch {
          return undefined;
        }
      }
    }
  }
  return undefined;
};
const xmlIssue = (svg: string): string | undefined => {
  const stack: string[] = [];
  let offset = 0;
  let roots = 0;
  for (const token of svg.matchAll(/<([^<>]*)>/g)) {
    const between = svg.slice(offset, token.index);
    if (/[<>]|&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/i.test(between) || (!stack.length && between.trim())) return V.SVG_REASONS.XML;
    const tag = token[1].match(/^(\/?)([\w:-]+)([\s\S]*?)(\/?)$/);
    if (!tag) return V.SVG_REASONS.XML;
    const [, close, name, attributes, selfClose] = tag;
    if (close) {
      const expected = stack.pop();
      if (attributes.trim() || selfClose) return V.SVG_REASONS.XML;
      if (expected !== name) return V.SVG_CLOSE_MISMATCH(expected, name);
    } else {
      if (!stack.length && (++roots !== 1 || name !== RT_SHARED.SVG)) return V.SVG_REASONS.XML;
      const names = new Set<string>();
      let rest = attributes;
      while (rest.trim()) {
        const attr = rest.match(/^\s+([\w:-]+)\s*=\s*("[^"<]*"|'[^'<]*')/);
        if (!attr || names.has(attr[1]) || /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/i.test(attr[2])) return V.SVG_REASONS.XML;
        names.add(attr[1]);
        rest = rest.slice(attr[0].length);
      }
      if (!selfClose) stack.push(name);
    }
    offset = token.index! + token[0].length;
  }
  if (stack.length) return V.SVG_UNCLOSED([...new Set(stack.reverse())]);
  if (roots !== 1 || svg.slice(offset).trim()) return V.SVG_REASONS.XML;
  return undefined;
};
export const normalizeMotionVector = (raw: unknown, key: string, inputKey: string, description: string, composition = false): MotionVectorAsset => {
  let svg = typeof raw === "string" ? raw.trim() : "";
  const limit = composition ? C.LIMIT : V.ASSET_LIMIT;
  const allowed = composition ? new Set([...tags, ...C.FILTER_TAGS]) : tags;
  const fail = (reason: string): never => {
    throw new Error(V.SVG_ERROR(reason));
  };
  if (!svg || svg.length > limit + 2048) fail(V.SVG_REASONS.EMPTY);
  svg = svg
    .replace(/^```(?:svg|xml|html)?\s*\n?([\s\S]*?)\n?```$/i, RT_CORE.VALUE_1_C1B43B)
    .trim()
    .replace(/^<\?xml\s[^?]*\?>\s*/i, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/>>+(?=\s*<)/g, RT_CORE.SYMBOL_CC80A2)
    .replace(/(<(?:path|rect|circle|ellipse|polygon|polyline|line|stop)\b[^<>]*["']\s*\/)(?=<)/gi, RT_CORE.VALUE_1_A27769)
    .trim();
  const root = svg.match(/^<svg\b[^>]*>/i)?.[0] || "";
  if (!/\bviewBox\s*=/.test(root)) {
    const dimension = (name: string) => root.match(new RegExp(`${RT_SHARED.B}${name}${RT_CORE.S_S_D_PX}`, RT_SHARED.I))?.[1];
    const width = dimension(RT_SHARED.WIDTH),
      height = dimension(RT_SHARED.HEIGHT);
    if (width && height) svg = svg.replace(/<svg\b/i, `${RT_CORE.SVG_VIEWBOX_0_0}${width}${RT_SHARED.SYMBOL_36A9E7}${height}${RT_CORE.SYMBOL_8A331F}`);
  }
  const vb = svg.match(/^<svg\b[^>]*\bviewBox\s*=\s*["']\s*([-+\deE.]+)[\s,]+([-+\deE.]+)[\s,]+([-+\deE.]+)[\s,]+([-+\deE.]+)\s*["']/i);
  const namespace = svg.match(/\bxmlns\s*=\s*(["\'])(.*?)\1/);
  if (namespace && namespace[2] !== RT_CORE.HTTP_WWW_W3_ORG_2000_SVG) fail(V.SVG_REASONS.UNSAFE);
  const checked = svg.replace(/\sxmlns\s*=\s*(["\'])http:\/\/www\.w3\.org\/2000\/svg\1/g, "");
  const unsafe = /<\?|<!|\bon[a-z]+\s*=|\b(?:href|src)\s*=|(?:https?:|javascript:|data:|@import|expression\s*\()/i.test(checked) || [...svg.matchAll(/<\/?\s*([\w:-]+)/g)].some((tag) => !allowed.has(tag[1].toLowerCase())) || [...svg.matchAll(/url\s*\(([^)]+)\)/gi)].some((url) => !/^\s*["']?#[\w.-]+["']?\s*$/.test(url[1]));
  if (svg.length > limit) fail(V.SVG_REASONS.EMPTY);
  if (unsafe) fail(V.SVG_REASONS.UNSAFE);
  if (!/^<svg\b/.test(svg)) fail(V.SVG_REASONS.XML);
  const issue = xmlIssue(svg);
  if (issue) fail(issue);
  if (!vb || !vb.slice(1).every((value) => Number.isFinite(Number(value))) || Number(vb[3]) < 1 || Number(vb[4]) < 1 || Number(vb[3]) > 4096 || Number(vb[4]) > 4096) fail(V.SVG_REASONS.DIMENSIONS);
  if (!/<(?:path|rect|circle|ellipse|polygon|polyline|line)\b/i.test(svg)) fail(V.SVG_REASONS.SHAPES);
  return { key, inputKey, svg: /\bxmlns\s*=/.test(svg) ? svg : svg.replace(/<svg\b/i, RT_CORE.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG), width: Number(vb![3]), height: Number(vb![4]), description, ...(composition ? { compositionRevision: C.REVISION } : {}) };
};
export const motionVectorSource = (svg: string, stretch = false): string => `${RT_CORE.DATA_IMAGE_SVG_XML_CHARSET_UTF_8}${encodeURIComponent(stretch ? svg.replace(/^<svg\b[^>]*>/i, (root) => root.replace(/\s+preserveAspectRatio\s*=\s*(?:"[^"]*"|'[^']*')/gi, "").replace(/>$/, RT_CORE.PRESERVEASPECTRATIO_NONE)) : svg)}`;
