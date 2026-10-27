import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import type { MotionVectorAsset } from "../types/motionVisual.js";
const tags = new Set(["svg", "g", "path", "rect", "circle", "ellipse", "polygon", "polyline", "line", "defs", "lineargradient", "radialgradient", "stop", "clippath", "mask", "title", "desc"]);
export const parseRemotionAssetReply = (text: string): unknown => {
  const start = text.indexOf("{");
  if (start < 0) return undefined;
  const stack: string[] = [];
  let quoted = false,
    escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') quoted = false;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") {
      if (stack.pop() !== ch) return undefined;
      if (!stack.length) {
        try {
          const value = JSON.parse(text.slice(start, i + 1));
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
      if (!stack.length && (++roots !== 1 || name !== "svg")) return V.SVG_REASONS.XML;
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
export const normalizeMotionVector = (raw: unknown, key: string, inputKey: string, description: string): MotionVectorAsset => {
  let svg = typeof raw === "string" ? raw.trim() : "";
  const fail = (reason: string): never => {
    throw new Error(V.SVG_ERROR(reason));
  };
  if (!svg || svg.length > V.ASSET_LIMIT + 2048) fail(V.SVG_REASONS.EMPTY);
  svg = svg
    .replace(/^```(?:svg|xml|html)?\s*\n?([\s\S]*?)\n?```$/i, "$1")
    .trim()
    .replace(/^<\?xml\s[^?]*\?>\s*/i, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
  const root = svg.match(/^<svg\b[^>]*>/i)?.[0] || "";
  if (!/\bviewBox\s*=/.test(root)) {
    const dimension = (name: string) => root.match(new RegExp(`\\b${name}\\s*=\\s*["']([\\d.]+)(?:px)?["']`, "i"))?.[1];
    const width = dimension("width"),
      height = dimension("height");
    if (width && height) svg = svg.replace(/<svg\b/i, `<svg viewBox="0 0 ${width} ${height}"`);
  }
  const vb = svg.match(/^<svg\b[^>]*\bviewBox\s*=\s*["']\s*([-+\deE.]+)[\s,]+([-+\deE.]+)[\s,]+([-+\deE.]+)[\s,]+([-+\deE.]+)\s*["']/i);
  const namespace = svg.match(/\bxmlns\s*=\s*(["\'])(.*?)\1/);
  if (namespace && namespace[2] !== "http://www.w3.org/2000/svg") fail(V.SVG_REASONS.UNSAFE);
  const checked = svg.replace(/\sxmlns\s*=\s*(["\'])http:\/\/www\.w3\.org\/2000\/svg\1/g, "");
  const unsafe = /<\?|<!|\bon[a-z]+\s*=|\b(?:href|src)\s*=|(?:https?:|javascript:|data:|@import|expression\s*\()/i.test(checked) || [...svg.matchAll(/<\/?\s*([\w:-]+)/g)].some((tag) => !tags.has(tag[1].toLowerCase())) || [...svg.matchAll(/url\s*\(([^)]+)\)/gi)].some((url) => !/^\s*["']?#[\w.-]+["']?\s*$/.test(url[1]));
  if (svg.length > V.ASSET_LIMIT) fail(V.SVG_REASONS.EMPTY);
  if (unsafe) fail(V.SVG_REASONS.UNSAFE);
  if (!/^<svg\b/.test(svg)) fail(V.SVG_REASONS.XML);
  const issue = xmlIssue(svg);
  if (issue) fail(issue);
  if (!vb || !vb.slice(1).every((value) => Number.isFinite(Number(value))) || Number(vb[3]) < 1 || Number(vb[4]) < 1 || Number(vb[3]) > 4096 || Number(vb[4]) > 4096) fail(V.SVG_REASONS.DIMENSIONS);
  if (!/<(?:path|rect|circle|ellipse|polygon|polyline|line)\b/i.test(svg)) fail(V.SVG_REASONS.SHAPES);
  return { key, inputKey, svg: /\bxmlns\s*=/.test(svg) ? svg : svg.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"'), width: Number(vb![3]), height: Number(vb![4]), description };
};
export const motionVectorSource = (svg: string): string => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
