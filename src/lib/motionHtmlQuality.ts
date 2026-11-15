import vm from "node:vm";
import { MOTION_HTML_QUALITY as Q } from "../constants/motionHtmlQuality.js";
import type { MotionHtmlMark } from "../types/motionHtmlScene.js";

export interface MotionHtmlRequired {
  id: string;
  focal: boolean;
}
const scriptsOf = (html: string): string[] => [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]).filter((code) => code.trim());
const syntaxError = (code: string): SyntaxError | undefined => {
  try {
    new vm.Script(code);
    return undefined;
  } catch (error) {
    return error instanceof SyntaxError ? error : undefined;
  }
};
export const motionHtmlScriptIssue = (html: string): { reason: string; flattened: boolean; line?: number } | undefined => {
  const code = scriptsOf(html).find((entry) => syntaxError(entry));
  if (!code) return undefined;
  const error = syntaxError(code)!;
  const flattened = code.length >= Q.FLAT_MIN_CHARS && !code.includes("\n");
  const line = Number(String(error.stack).match(Q.STACK_LINE)?.[1]) || undefined;
  return { reason: flattened ? `${Q.FLAT_ISSUE} (SyntaxError: ${error.message})` : `SyntaxError: ${error.message}`, flattened, line };
};
export const motionHtmlErrorSignature = (reason: string): string => Q.SIGNATURE_DROP.reduce((text, pattern) => text.replace(pattern, " "), reason).trim().toLowerCase();
const around = (code: string, index: number): string => code.slice(Math.max(0, index - Q.SNIPPET_RADIUS), index + Q.SNIPPET_RADIUS).trim();
export const motionHtmlRuntimeFeedback = (reason: string, html: string): string => {
  const scripts = scriptsOf(html);
  const code = scripts.find((entry) => syntaxError(entry)) || scripts.join("\n");
  const snippets: string[] = [];
  const name = reason.match(Q.UNDEFINED_NAME)?.[1];
  if (name && code) {
    const pattern = new RegExp(`(?<![\\w$.])${name.replace(/\$/g, "\\$")}(?![\\w$])`, "g");
    for (const match of code.matchAll(pattern)) {
      snippets.push(around(code, match.index || 0));
      if (snippets.length >= Q.SNIPPET_MAX) break;
    }
  } else if (code) {
    const error = syntaxError(code);
    const line = Number(String(error?.stack).match(Q.STACK_LINE)?.[1]);
    const text = line ? code.split("\n")[line - 1] : undefined;
    if (text) snippets.push(text.trim().slice(0, Q.SNIPPET_RADIUS * 2));
  }
  const clean = reason.replace(/^page\.evaluate:\s*/i, "").replace(/\s+at\s+<anonymous>[^\n]*/g, "").trim();
  return Q.RUNTIME_FEEDBACK(clean, snippets);
};
export const motionHtmlMarkId = (value: unknown): string => String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
export const motionHtmlRequired = (template: string | undefined): MotionHtmlRequired[] => {
  const line = template?.match(Q.REQUIRED_LINE)?.[1];
  if (!line) return [];
  const items = line
    .split(Q.REQUIRED_SEP)
    .map((part) => part.match(Q.REQUIRED_ITEM))
    .filter((match): match is RegExpMatchArray => !!match && !!motionHtmlMarkId(match[1]))
    .map((match) => ({ id: motionHtmlMarkId(match[1]), focal: match[2]?.toLowerCase() === Q.FOCAL }));
  const unique = items.filter((item, index) => items.findIndex((other) => other.id === item.id) === index);
  if (unique.length && !unique.some((item) => item.focal)) unique[0].focal = true;
  return unique;
};
const unionById = (marks: MotionHtmlMark[]): Map<string, MotionHtmlMark> => {
  const out = new Map<string, MotionHtmlMark>();
  const kitIds = new Set(marks.filter((mark) => mark.src === "kit").map((mark) => motionHtmlMarkId(mark.id)));
  for (const mark of marks) {
    if (/^[~!]/.test(String(mark.id)) || (kitIds.has(motionHtmlMarkId(mark.id)) && mark.src !== "kit")) continue;
    if (![mark.x, mark.y, mark.w, mark.h].every(Number.isFinite)) continue;
    const id = motionHtmlMarkId(mark.id);
    const prev = out.get(id);
    if (!prev) out.set(id, { ...mark, id });
    else {
      const x = Math.min(prev.x, mark.x),
        y = Math.min(prev.y, mark.y);
      out.set(id, { id, x, y, w: Math.max(prev.x + prev.w, mark.x + mark.w) - x, h: Math.max(prev.y + prev.h, mark.y + mark.h) - y });
    }
  }
  return out;
};
const visibleShare = (mark: MotionHtmlMark): number => {
  const area = mark.w * mark.h;
  if (area <= 0) return 0;
  const w = Math.max(0, Math.min(1, mark.x + mark.w) - Math.max(0, mark.x)),
    h = Math.max(0, Math.min(1, mark.y + mark.h) - Math.max(0, mark.y));
  return (w * h) / area;
};
export const motionHtmlMissing = (required: MotionHtmlRequired[], marks: MotionHtmlMark[], focalMin: number = Q.FOCAL_MIN): string[] => {
  const byId = unionById(marks);
  const issues: string[] = [];
  for (const item of required) {
    const mark = byId.get(item.id);
    if (!mark) issues.push(Q.MISSING_ITEM(item.id, "unmarked"));
    else if (visibleShare(mark) < Q.VISIBLE_MIN) issues.push(Q.MISSING_ITEM(item.id, "outside"));
    else if (item.focal && Math.max(mark.h, mark.w) < focalMin) issues.push(Q.MISSING_ITEM(item.id, "small", Math.max(mark.h, mark.w), focalMin));
  }
  return issues;
};
export const motionHtmlFocalMoved = (required: MotionHtmlRequired[], start: MotionHtmlMark[], end: MotionHtmlMark[]): boolean => {
  const a = unionById(start),
    b = unionById(end);
  return required
    .filter((item) => item.focal)
    .some((item) => {
      const from = a.get(item.id),
        to = b.get(item.id);
      if (!from || !to) return false;
      const moved = Math.hypot(to.x + to.w / 2 - (from.x + from.w / 2), to.y + to.h / 2 - (from.y + from.h / 2));
      const grew = Math.abs(to.w * to.h - from.w * from.h) / Math.max(1e-6, from.w * from.h);
      const reshaped = Math.abs(to.w - from.w) + Math.abs(to.h - from.h);
      return moved >= Q.MARK_MOVE || grew >= Q.MARK_GROW || reshaped >= Q.MARK_MOVE;
    });
};
export const motionHtmlCutLarge = (marks: MotionHtmlMark[], maxCut: number): string[] =>
  marks
    .filter((mark) => mark.large && mark.h > 0)
    .map((mark) => ({ id: String(mark.id).slice(1).split(":").pop() || "object", cut: Math.max(0, -mark.y) / mark.h }))
    .filter((entry) => entry.cut > maxCut)
    .map((entry) => entry.id)
    .filter((id, index, list) => list.indexOf(id) === index);
export const motionHtmlUnknownKinds = (marks: MotionHtmlMark[]): string[] =>
  [...new Set(marks.map((mark) => String(mark.id)).filter((id) => id.startsWith("!unknown:")).map((id) => id.slice("!unknown:".length).replace(":", " ")))];
