import * as COMMON_RUNTIME from "../constants/sourceText.js";
import { RUNTIME_VALUES } from "../constants/runtime/values.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { parseJson, normalizeJsonWhitespace } from "./jsonStringify.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import type { MotionVectorAsset } from "../types/motionVisual.js";
import { MOTION_SCENE_COMPOSITION as C } from "../constants/motionSceneComposition.js";
const tags = new Set([RT_SHARED.SVG, RT_CORE.G, RT_CORE.PATH, RT_CORE.RECT, RT_CORE.CIRCLE, RT_CORE.ELLIPSE, RT_CORE.POLYGON, RT_CORE.POLYLINE, RT_CORE.LINE, RT_CORE.DEFS, RT_CORE.LINEARGRADIENT, RT_CORE.RADIALGRADIENT, RT_CORE.STOP, RT_CORE.CLIPPATH, RT_CORE.MASK, RT_SHARED.TITLE, RT_SHARED.DESC] as string[]);
const parseVectorReply = (text: string): unknown => {
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
export const quoteBareJsonKeys = (text: string): string => {
  const K = C.JSON_KEY;
  let out = "",
    quoted = false,
    escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    out += ch;
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === K.ESCAPE) escaped = true;
      else if (ch === K.QUOTE) quoted = false;
      continue;
    }
    if (ch === K.QUOTE) quoted = true;
    if (!K.OPENER.test(ch)) continue;
    const bare = K.BARE.exec(text.slice(i + 1, i + 1 + K.LOOKAHEAD));
    if (!bare) continue;
    out += `${bare[1]}${K.QUOTE}${bare[2]}${K.QUOTE}${bare[3]}`;
    i += bare[0].length;
  }
  return out;
};
export const parseRemotionAssetReply = (text: string): unknown => {
  text = normalizeJsonWhitespace(text);
  const parsed = parseVectorReply(text);
  if (parsed !== undefined) return parsed;
  const candidate = text.replace(/(<\/svg>|\\u003c\/svg>)(?=\s*\}\s*(?:```)?\s*$)/i, RUNTIME_VALUES.VALUE_2093DF4A);
  let quoted = false,
    escaped = false,
    repaired = "";
  for (const ch of candidate) {
    if (quoted && !escaped && /[\n\r\t]/.test(ch)) {
      repaired += ch === COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_56 ? COMMON_RUNTIME.SOURCE_TEXT_N : ch === RUNTIME_VALUES.VALUE_9D1E0E2D ? COMMON_RUNTIME.SOURCE_TEXT_R_2 : COMMON_RUNTIME.SOURCE_TEXT_T_3;
      continue;
    }
    repaired += ch;
    if (escaped) escaped = false;
    else if (quoted && ch === COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_22) escaped = true;
    else if (ch === COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_3) quoted = !quoted;
  }
  return parseVectorReply(repaired) ?? parseVectorReply(quoteBareJsonKeys(repaired));
};
export const closeMotionSvgTags = (svg: string): string => {
  const stack: string[] = [];
  const closable = new Set([COMMON_RUNTIME.SOURCE_TEXT_SVG, RUNTIME_VALUES.G_CD0AA985, COMMON_RUNTIME.SOURCE_TEXT_PATH, RUNTIME_VALUES.RECT_0A473EBE, RUNTIME_VALUES.CIRCLE_8A39178D, RUNTIME_VALUES.ELLIPSE_C613C768, RUNTIME_VALUES.POLYGON_2B3B1812, RUNTIME_VALUES.POLYLINE_D2920224, RUNTIME_VALUES.LINE_38A9C1E7] as string[]);
  const shapes = new Set([COMMON_RUNTIME.SOURCE_TEXT_PATH, RUNTIME_VALUES.RECT_0A473EBE, RUNTIME_VALUES.CIRCLE_8A39178D, RUNTIME_VALUES.ELLIPSE_C613C768, RUNTIME_VALUES.POLYGON_2B3B1812, RUNTIME_VALUES.POLYLINE_D2920224, RUNTIME_VALUES.LINE_38A9C1E7] as string[]);
  let offset = 0,
    inserted = 0,
    repaired = "";
  for (const match of svg.matchAll(/<(?:[^<>"']|"[^"<]*"|'[^'<]*')*>/g)) {
    const between = svg.slice(offset, match.index);
    if (/[<>]/.test(between)) return svg;
    const tag = match[0].match(/^<(\/?)([\w:-]+)([\s\S]*?)(\/?)>$/);
    if (!tag) return svg;
    const [, close, name, attributes, selfClose] = tag;
    repaired += between;
    if (close) {
      const index = stack.lastIndexOf(name);
      if (index < 0 && !attributes.trim() && !selfClose && name === RUNTIME_VALUES.G_CD0AA985 && stack.length === 1 && stack[0] === COMMON_RUNTIME.SOURCE_TEXT_SVG && C.MARKUP_TRAILING_GROUPS.test(svg.slice(match.index! + match[0].length))) {
        if (++inserted > C.MARKUP_REPAIR_LIMIT) return svg;
        offset = match.index! + match[0].length;
        continue;
      }
      if (index < 0 || attributes.trim() || selfClose) return svg;
      while (stack.length - 1 > index) {
        if (!closable.has(stack.at(-1)!) || ++inserted > C.MARKUP_REPAIR_LIMIT) return svg;
        repaired += `${RUNTIME_VALUES.VALUE_2A535776}${stack.pop()}${RUNTIME_VALUES.VALUE_62B67E1F}`;
      }
      stack.pop();
    } else {
      if (!stack.length && (name !== COMMON_RUNTIME.SOURCE_TEXT_SVG || offset > 0)) return svg;
      if (shapes.has(stack.at(-1)!) && name !== COMMON_RUNTIME.SOURCE_TEXT_TITLE && name !== COMMON_RUNTIME.SOURCE_TEXT_DESC) return svg;
      if (!selfClose) stack.push(name);
    }
    repaired += match[0];
    offset = match.index! + match[0].length;
  }
  const tail = svg.slice(offset);
  if (/[<>]/.test(tail) || (stack.length && tail.trim()) || stack.some((name) => !closable.has(name)) || inserted + stack.length > C.MARKUP_REPAIR_LIMIT) return svg;
  return (
    repaired +
    tail +
    stack
      .reverse()
      .map((name) => `${RUNTIME_VALUES.VALUE_2A535776}${name}${RUNTIME_VALUES.VALUE_62B67E1F}`)
      .join("")
  );
};
export const dedupeMotionSvgAttributes = (svg: string): string =>
  svg.replace(C.MARKUP_TAG, (tag: string, name: string, attributes: string, end: string) => {
    const list = [...attributes.matchAll(C.MARKUP_ATTRIBUTE)];
    const last = new Map(list.map((attribute, index) => [attribute[1], index]));
    if (last.size === list.length) return tag;
    return `${RUNTIME_VALUES.VALUE_DABD3AFF}${name}${list
      .filter((attribute, index) => last.get(attribute[1]) === index)
      .map((attribute) => `${COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52}${attribute[1]}${COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_33}${attribute[2]}`)
      .join("")}${end}${RUNTIME_VALUES.VALUE_62B67E1F}`;
  });
export const repairMotionSvgMarkup = (svg: string): string => closeMotionSvgTags(dedupeMotionSvgAttributes(svg));
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
const SAN = C.SANITIZE;
const elementEnd = (svg: string, tag: string, from: number): { inner: string; end: number } | undefined => {
  const pattern = SAN.SAME_TAG(tag);
  pattern.lastIndex = from;
  let depth = 1;
  for (let match = pattern.exec(svg); match; match = pattern.exec(svg)) {
    if (match[2]) continue;
    depth += match[1] ? -1 : 1;
    if (!depth) return { inner: svg.slice(from, match.index), end: match.index + match[0].length };
  }
  return undefined;
};
const expandMotionSvgUses = (svg: string): string => {
  let text = svg;
  for (let pass = 0; pass < SAN.PASSES && SAN.USE.test(text); pass++) {
    const source = text;
    text = source.replace(new RegExp(SAN.USE.source, "gi"), (_whole, attrs: string) => {
      const href = attrs.match(SAN.HREF)?.[1];
      const open = href ? SAN.ID_OPEN(href).exec(source) : null;
      if (!open) return "";
      const tag = open[1];
      const closed = open[3] ? undefined : elementEnd(source, tag, open.index + open[0].length);
      if (!open[3] && !closed) return "";
      const body = (tag.toLowerCase() === SAN.SYMBOL ? closed!.inner : open[0].replace(SAN.ID_ATTR, "") + (closed ? closed.inner + `</${tag}>` : "")).replace(new RegExp(SAN.ID_ATTR.source, "g"), "");
      const value = (name: string) => attrs.match(SAN.ATTR(name))?.[2];
      const shift = value("x") || value("y") ? `translate(${Number(value("x")) || 0} ${Number(value("y")) || 0}) ` : "";
      const transform = `${shift}${value("transform") || ""}`.trim();
      const copied = SAN.COPY_ATTRS.map((name) => (value(name) ? ` ${name}="${value(name)}"` : "")).join("");
      return `<g${transform ? ` transform="${transform}"` : ""}${copied}>${body}</g>`;
    });
  }
  return text.replace(new RegExp(SAN.USE.source, "gi"), "");
};
export const sanitizeMotionCompositionSvg = (svg: string, allowed: Set<string>): string => {
  const text = expandMotionSvgUses(svg);
  let out = "";
  let skip = 0;
  let last = 0;
  for (const match of text.matchAll(SAN.TAG)) {
    if (!skip) out += text.slice(last, match.index);
    last = match.index! + match[0].length;
    if (!match[2]) continue;
    const [, close, name, , self] = match;
    if (skip) {
      if (!self) skip += close ? -1 : 1;
      continue;
    }
    if (!allowed.has(name.toLowerCase())) {
      if (!close && !self) skip = 1;
      continue;
    }
    out += match[0];
  }
  if (!skip) out += text.slice(last);
  out = out.replace(SAN.BAD_ATTRS, "").replace(SAN.BAD_URL_ATTR, "");
  const emptyFilters = new Set<string>();
  out = out.replace(SAN.FILTER, (whole, attrs: string, body?: string) => {
    if (body && SAN.FILTER_PRIMITIVE.test(body)) return whole;
    const id = attrs.match(SAN.ATTR("id"))?.[2];
    if (id) emptyFilters.add(id);
    return "";
  });
  return out.replace(SAN.FILTER_ATTRIBUTE, (whole, _quote: string, value: string) => (emptyFilters.has(value.match(SAN.FILTER_REFERENCE)?.[1] || "") ? "" : whole));
};
export const normalizeMotionVector = (raw: unknown, key: string, inputKey: string, description: string, composition = false): MotionVectorAsset => {
  let svg = typeof raw === "string" ? raw.trim() : "";
  const limit = composition ? C.LIMIT : V.ASSET_LIMIT;
  const allowed = composition ? new Set([...tags, ...C.FILTER_TAGS, C.PATTERN_TAG]) : tags;
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
  if (composition) svg = sanitizeMotionCompositionSvg(svg, allowed).trim();
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
  if (composition) svg = repairMotionSvgMarkup(svg);
  if (svg.length > limit) fail(V.SVG_REASONS.EMPTY);
  const issue = xmlIssue(svg);
  if (issue) fail(issue);
  if (!vb || !vb.slice(1).every((value) => Number.isFinite(Number(value))) || Number(vb[3]) < 1 || Number(vb[4]) < 1 || Number(vb[3]) > 4096 || Number(vb[4]) > 4096) fail(V.SVG_REASONS.DIMENSIONS);
  if (!/<(?:path|rect|circle|ellipse|polygon|polyline|line)\b/i.test(svg)) fail(V.SVG_REASONS.SHAPES);
  return { key, inputKey, svg: /\bxmlns\s*=/.test(svg) ? svg : svg.replace(/<svg\b/i, RT_CORE.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG), width: Number(vb![3]), height: Number(vb![4]), description, ...(composition ? { compositionRevision: C.REVISION } : {}) };
};
export const motionVectorSource = (svg: string, stretch = false): string => `${RT_CORE.DATA_IMAGE_SVG_XML_CHARSET_UTF_8}${encodeURIComponent(stretch ? svg.replace(/^<svg\b[^>]*>/i, (root) => root.replace(/\s+preserveAspectRatio\s*=\s*(?:"[^"]*"|'[^']*')/gi, "").replace(/>$/, RT_CORE.PRESERVEASPECTRATIO_NONE)) : svg)}`;
