import { MOTION_APPEARANCE as A } from "../constants/motionAppearance.js";
import { puppetSourceQuote } from "./motionPuppetValues.js";
import { illustrationSemanticText } from "./motionIllustrationPolicy.js";
import type { PuppetAppearance, PuppetCharacter, PuppetFrame, PuppetRead } from "../types/motionPuppet.js";
const semantic = illustrationSemanticText;
const descriptionOf = (text: string, part: (typeof A.PARTS)[number], match: RegExpMatchArray): string => {
  const rest = text
    .slice(match.index! + match[0].length)
    .split(/[,.;!?]/)[0]
    .slice(0, 55);
  const next = A.PARTS.filter((other) => other !== part)
    .map((other) => rest.search(A.PART_WORDS[other]))
    .filter((at) => at >= 0);
  return rest.slice(0, next.length ? Math.min(...next) : rest.length);
};
export const normalizePuppetAppearance = (raw: unknown, source: string): PuppetAppearance | undefined => {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as PuppetAppearance;
  const evidence = typeof value.evidence === "string" && puppetSourceQuote(source, value.evidence);
  if (!evidence) return undefined;
  const text = semantic(evidence),
    out: PuppetAppearance = { evidence };
  for (const part of A.PARTS) {
    const color = value[part];
    if (!color || !Object.hasOwn(A.COLORS, color)) continue;
    const match = text.match(A.PART_WORDS[part]);
    if (!match || A.NEGATED.test(text.slice(0, match.index))) continue;
    const description = descriptionOf(text, part, match);
    const localEvidence = evidence.slice(match.index! + match[0].length, match.index! + match[0].length + description.length);
    if (A.COLOR_EVIDENCE[color].test(localEvidence) && A.COLOR_WORDS[color].test(description) && !A.NEGATED.test(description.slice(0, description.search(A.COLOR_WORDS[color])))) out[part] = color;
    else if (part === "body" && color === "white" && match[0] === "bong trang") out.body = color;
  }
  const formMatch = value.form === "revealed" ? text.match(A.REVEAL) : value.form === "human" ? text.match(A.HUMAN) : null;
  if (formMatch && !A.NEGATED.test(text.slice(0, formMatch.index))) out.form = value.form;
  return A.PARTS.some((part) => out[part]) || out.form ? out : undefined;
};
export const inferPuppetAppearance = (source: string): PuppetAppearance | undefined => {
  const raw: Record<string, unknown> = { evidence: source };
  const text = semantic(source);
  for (const part of A.PARTS) {
    const match = text.match(A.PART_WORDS[part]);
    if (!match) continue;
    const description = descriptionOf(text, part, match);
    const color = Object.entries(A.COLOR_WORDS).find(([, pattern]) => pattern.test(description))?.[0];
    if (color) raw[part] = color;
    else if (part === "body" && match[0] === "bong trang") raw.body = "white";
  }
  if (A.REVEAL.test(text)) raw.form = "revealed";
  else if (A.HUMAN.test(text)) raw.form = "human";
  return normalizePuppetAppearance(raw, source);
};
export const puppetReadAppearances = (read: PuppetRead): Map<string, PuppetAppearance> => {
  const result = new Map<string, PuppetAppearance>();
  for (const state of read.states || []) if (read.who.includes(state.char) && state.appearance) result.set(state.char, state.appearance);
  return result;
};
export const puppetAppearanceKey = (appearance: PuppetAppearance): string => [...A.PARTS.map((part) => appearance[part] || ""), appearance.form || ""].join(":");
export const mergePuppetAppearances = (before: PuppetAppearance | undefined, next: PuppetAppearance): PuppetAppearance => ({ ...(next.form === "human" ? {} : next.body ? { hair: before?.hair, form: before?.form } : before), ...next });
export const withPuppetFrameAppearance = (frame: PuppetFrame, read: PuppetRead): PuppetFrame => {
  const appearances = puppetReadAppearances(read);
  return {
    ...frame,
    actors: frame.actors.map((actor) => {
      const appearance = appearances.get(actor.char);
      return appearance ? { ...actor, appearance, look: puppetAppearanceKey(appearance) } : actor;
    }),
  };
};
export const puppetCharacterAppearance = (character: PuppetCharacter, appearance: PuppetAppearance): PuppetCharacter => {
  const colors = { ...character.colors };
  const face = appearance.face || appearance.body,
    clothes = appearance.clothes || appearance.body;
  if (face) colors.face = colors.skin = A.COLORS[face];
  if (clothes) colors.body = colors.sleeve = A.COLORS[clothes];
  if (appearance.hair) colors.hair = A.COLORS[appearance.hair];
  const replacements = (keys: (keyof typeof colors)[]) => new Map(keys.filter((key) => character.colors[key] && colors[key] !== character.colors[key]).map((key) => [character.colors[key]!.toLowerCase(), colors[key]!]));
  const headColors = replacements(["skin", "face", "hair"]),
    bodyColors = new Map<string, string>();
  if (appearance.body) for (const svg of Object.values(character.body)) for (const match of svg.matchAll(/\bfill=["'](#[0-9a-f]{6}|#[0-9a-f]{3})["']/gi)) bodyColors.set(match[1].toLowerCase(), A.COLORS[appearance.body]);
  for (const [color, value] of replacements(["body", "sleeve"])) bodyColors.set(color, value);
  const allColors = new Map([...bodyColors, ...headColors]);
  const recolor = (svg: string, palette: Map<string, string>): string => svg.replace(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi, (color) => palette.get(color.toLowerCase()) || color);
  const views = (values: PuppetCharacter["head"], palette: Map<string, string>) => Object.fromEntries(Object.entries(values).map(([view, svg]) => [view, recolor(svg, palette)]));
  return { ...character, colors, head: views(character.head, headColors), body: views(character.body, bodyColors), sprites: Object.fromEntries(Object.entries(character.sprites).map(([pose, sprite]) => [pose, { ...sprite, svg: recolor(sprite.svg, allColors) }])) };
};
