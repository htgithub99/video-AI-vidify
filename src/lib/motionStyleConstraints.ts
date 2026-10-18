import { MOTION_STYLE_VALUES as SV } from "../constants/motionStyleConstraints.js";
import * as MR from "../constants/motionRuntime.js";
import _ from "lodash";
import { MOTION_STYLE_AXES, MOTION_STYLE_DEFAULT_WIDTH, MOTION_STYLE_FX, MOTION_STYLE_OUTLINE_WIDTH, MOTION_STYLE_PARTS, MOTION_STYLE_PATTERNS as P, MOTION_STYLE_RULES, MOTION_STYLE_PART_RE, MOTION_STYLE_LOG, MOTION_STYLE_SKIN_MATERIAL, MOTION_STYLE_FRAMING } from "../constants/motionStyleConstraints.js";
import type { MotionReferenceStyle } from "../types/motionVideo.js";
export type MotionStylePart = (typeof MOTION_STYLE_PARTS)[number];
export type MotionStyleAxis = (typeof MOTION_STYLE_AXES)[number];
export type MotionStyleFx = (typeof MOTION_STYLE_FX)[number];
export interface MotionStyleConstraints {
  present: boolean;
  absent: MotionStylePart[];
  hidden: MotionStylePart[];
  sharedFigure: boolean;
  variation: MotionStyleAxis[];
  faceFill?: string;
  shading: { kind: "flat" | "cel" | "soft" | "any"; tones: number };
  outline: { kind: "none" | "silhouette" | "all" | "any"; weight?: "thin" | "medium" | "thick"; width?: number };
  fx: { allowed: MotionStyleFx[]; forbidden: MotionStyleFx[] };
  night?: "tint" | "lights";
  perspective?: "front" | "side" | "three-quarter" | "deep";
  detail?: "low" | "medium" | "high";
  framing?: (typeof MOTION_STYLE_FRAMING)[keyof typeof MOTION_STYLE_FRAMING];
}
const text = (value: unknown): string => (typeof value === MR.MOTION_TEXT_STRING ? (value as string).trim() : MR.MOTION_TEXT_EMPTY);
const NONE: MotionStyleConstraints = { present: false, absent: [], hidden: [], sharedFigure: false, variation: [...MOTION_STYLE_AXES], shading: { kind: SV.ANY, tones: 0 }, outline: { kind: SV.ANY }, fx: { allowed: [], forbidden: [] } };
const fxOf = (sources: string[]): MotionStyleConstraints["fx"] => {
  const allowed = new Set<MotionStyleFx>(),
    forbidden = new Set<MotionStyleFx>();
  for (const clause of _.flatMap(sources, (source) => source.split(P.CLAUSE))) {
    for (const fx of MOTION_STYLE_FX) {
      const match = P.FX_WORDS[fx].exec(clause);
      if (!match) continue;
      const negated = P.NEGATE.test(clause.slice(0, match.index));
      (negated ? forbidden : allowed).add(fx);
    }
  }
  return { allowed: _.filter([...allowed], (fx) => !forbidden.has(fx)), forbidden: [...forbidden] };
};
const shadingOf = (render: Record<string, string>, drawingMode?: string): MotionStyleConstraints["shading"] => {
  const mode = text(render.mode),
    tones = parseInt(text(render.shadingTones), 10) || 0;
  if (!mode && !tones) return { kind: SV.ANY, tones: 0 };
  if (P.FLAT.test(mode) && !P.SOFT.test(mode)) return { kind: SV.FLAT, tones: Math.max(1, tones || 1) };
  if (P.CEL.test(mode)) return tones <= 1 && drawingMode === MR.MOTION_TEXT_2D ? { kind: SV.FLAT, tones: 1 } : { kind: SV.CEL, tones: Math.max(2, tones) };
  if (P.SOFT.test(mode)) return { kind: SV.SOFT, tones: Math.max(2, tones || 3) };
  return tones === 1 ? { kind: SV.FLAT, tones: 1 } : { kind: SV.ANY, tones };
};
const outlineOf = (style: MotionReferenceStyle): MotionStyleConstraints["outline"] => {
  const description = text(style.kit?.render?.outline);
  const number = Number(style.outlineWidth);
  if (!description && !Number.isFinite(number)) return { kind: SV.ANY };
  if (P.OUTLINE_NONE.test(description) || number === 0) return { kind: MR.MOTION_TEXT_NONE, width: 0 };
  const kind = P.OUTLINE_SILHOUETTE.test(description) ? SV.SILHOUETTE : MR.MOTION_TEXT_ALL;
  const weight = P.OUTLINE_THICK.test(description) ? SV.THICK : P.OUTLINE_THIN.test(description) ? SV.THIN : description ? MR.MOTION_TEXT_MEDIUM : undefined;
  const range = weight ? MOTION_STYLE_OUTLINE_WIDTH[weight] : undefined;
  const width = range ? (Number.isFinite(number) && number > 0 ? _.clamp(number, range[0], range[1]) : MOTION_STYLE_DEFAULT_WIDTH[weight!]) : Number.isFinite(number) ? number : undefined;
  return _.omitBy({ kind, weight, width: width === undefined ? undefined : Math.round(width * 1000) / 1000 }, _.isUndefined) as MotionStyleConstraints["outline"];
};
export const motionStyleConstraints = (style: MotionReferenceStyle | undefined | null, drawingMode?: string): MotionStyleConstraints => {
  if (!style) return NONE;
  const character = style.kit?.character || {},
    render = style.kit?.render || {},
    background = style.kit?.background || {};
  const absent = _.filter(MOTION_STYLE_PARTS, (part) => P.ABSENT.test(text(character[part])));
  const hidden = _.filter(MOTION_STYLE_PARTS, (part) => !absent.includes(part) && P.HIDDEN.test(text(character[part])));
  const figureText = [character.body, character.clothing, character.headShape, character.expressions, ..._.map(style.images, SV.DETAILS)].map(text).join(MR.MOTION_TEXT_SYMBOL_13);
  const sharedFigure = P.SHARED.test(figureText);
  const plainClothes = P.NO_CLOTHING_DETAIL.test(text(character.clothing));
  const variation = _.filter(MOTION_STYLE_AXES, (axis) => {
    if (sharedFigure) return axis === SV.COLOUR;
    if (axis === SV.HAIR) return !absent.includes(SV.HAIR);
    if (axis === SV.CLOTHING || axis === SV.ACCESSORIES) return !plainClothes;
    return true;
  });
  const lighting = text(render.lighting),
    perspective = text(background.perspective),
    detail = P.DETAIL.exec(text(background.detail))?.[1]?.toLowerCase();
  return _.omitBy(
    {
      present: true,
      absent,
      hidden,
      sharedFigure,
      variation,
      faceFill: P.HEX.exec(text(character.skin))?.[0]?.toUpperCase(),
      shading: shadingOf(render, drawingMode),
      outline: outlineOf(style),
      fx: fxOf([text(style.kit?.fx), lighting]),
      night: P.NIGHT_TINT.test(lighting) ? SV.TINT : P.NIGHT_LIGHTS.test(lighting) ? SV.LIGHTS : undefined,
      perspective: P.FRONT.test(perspective) ? SV.FRONT : P.SIDE.test(perspective) ? SV.SIDE : P.THREE_QUARTER.test(perspective) ? SV.THREE_QUARTER : P.DEEP.test(perspective) ? SV.DEEP : undefined,
      detail: detail === SV.MODERATE ? MR.MOTION_TEXT_MEDIUM : detail === SV.RICH ? MR.MOTION_TEXT_HIGH : (detail as MotionStyleConstraints["detail"]),
      framing: P.HEADS_TOP_HALF.test(text(style.kit?.camera)) ? MOTION_STYLE_FRAMING.HEADS_TOP_HALF : undefined,
    },
    _.isUndefined,
  ) as unknown as MotionStyleConstraints;
};
export const motionStyleHasPart = (constraints: MotionStyleConstraints, part: MotionStylePart): boolean => !constraints.absent.includes(part);
export const motionStyleShowsPart = (constraints: MotionStyleConstraints, part: MotionStylePart): boolean => !constraints.absent.includes(part) && !constraints.hidden.includes(part);
export interface MotionStyleRules { distinguish: string; face: string; arms: string; limits: string; precedence: string; }
const words = (list: readonly string[], dictionary: Record<string, string>): string => list.map((item) => dictionary[item] || item).join(MR.MOTION_TEXT_SYMBOL_14);
export const motionStyleRules = (constraints: MotionStyleConstraints): MotionStyleRules => {
  const R = MOTION_STYLE_RULES;
  if (!constraints.present) return { distinguish: R.DISTINGUISH_DEFAULT, face: R.FACE_DEFAULT, arms: R.ARMS_DEFAULT, limits: MR.MOTION_TEXT_EMPTY, precedence: MR.MOTION_TEXT_EMPTY };
  const axes = words(constraints.variation, R.AXIS_WORDS);
  const varied = _.difference([...MOTION_STYLE_AXES], constraints.variation).length > 0;
  const distinguish = constraints.sharedFigure ? R.SHARED(axes) : varied ? R.DISTINGUISH_AXES(axes) : R.DISTINGUISH_DEFAULT;
  const arms = constraints.absent.includes(SV.ARMS) ? R.NO_ARMS : constraints.absent.includes(SV.HANDS) ? R.NO_HANDS : R.ARMS_DEFAULT;
  const legless = constraints.absent.includes(SV.LEGS) || constraints.hidden.includes(SV.LEGS);
  const limits = _.compact([constraints.absent.length ? R.ABSENT(words(constraints.absent, R.PART_WORDS)) : MR.MOTION_TEXT_EMPTY, constraints.hidden.length ? R.HIDDEN(words(constraints.hidden, R.PART_WORDS)) : MR.MOTION_TEXT_EMPTY, legless ? R.GLIDE : MR.MOTION_TEXT_EMPTY]).join(MR.MOTION_TEXT_SYMBOL_27);
  const precedence = _.compact([R.PRECEDENCE, constraints.fx.forbidden.length ? R.FORBIDDEN_FX(words(constraints.fx.forbidden, R.FX_WORDS)) : MR.MOTION_TEXT_EMPTY, constraints.night === SV.TINT ? R.NIGHT_TINT : MR.MOTION_TEXT_EMPTY]).join(MR.MOTION_TEXT_SYMBOL_13);
  return { distinguish, face: constraints.faceFill ? R.FACE_FILL(constraints.faceFill) : R.FACE_DEFAULT, arms, limits, precedence };
};
export const motionEnforceStyle = (design: any, constraints: MotionStyleConstraints): { design: any; changes: string[] } => {
  if (!constraints.present || !Array.isArray(design?.parts)) return { design, changes: [] };
  const changes: string[] = [];
  const named = (id: string, nodes: any[]): string => [id, ..._.map(nodes || [], (node) => (typeof node?.mat === MR.MOTION_TEXT_STRING ? node.mat : node?.name || MR.MOTION_TEXT_EMPTY))].join(MR.MOTION_TEXT_SYMBOL_13);
  const banned = new Set<string>();
  for (const part of design.parts) {
    const hit = _.find(constraints.absent, (absent) => MOTION_STYLE_PART_RE[absent]?.test(part.id) || (absent === SV.HAIR && MOTION_STYLE_PART_RE.hair.test(named(part.id, part.nodes))));
    if (hit) banned.add(part.id);
  }
  const parts = _.map(design.parts, (part) => {
    if (!banned.has(part.id)) return part;
    changes.push(MOTION_STYLE_LOG.HIDDEN_PART(part.id));
    return { ...part, nodes: [], visible: false };
  });
  const strip = (entries: Record<string, Record<string, any>> | undefined) => _.mapValues(entries || {}, (entry) => _.omitBy(entry, (_value, id) => banned.has(id)));
  const materials = { ...(design.materials || {}) };
  const skin = materials[MOTION_STYLE_SKIN_MATERIAL];
  if (constraints.faceFill && skin && typeof skin === MR.MOTION_TEXT_OBJECT && _.toUpper(skin.color || MR.MOTION_TEXT_EMPTY) !== constraints.faceFill) {
    materials[MOTION_STYLE_SKIN_MATERIAL] = { ...skin, color: constraints.faceFill };
    changes.push(MOTION_STYLE_LOG.FACE_FILL(constraints.faceFill));
  }
  if (!changes.length) return { design, changes };
  return { design: { ...design, parts, materials, expressions: strip(design.expressions), poses: strip(design.poses) }, changes };
};
