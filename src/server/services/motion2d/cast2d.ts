import _ from "lodash";
import { MOTION_2D as C, MOTION_2D_PROMPTS } from "../../../constants/motion2d.js";
import { MOTION_CHARACTER_PALETTE, MOTION_CHARACTER_SENIOR_HAIR, motionSceneType } from "../../../constants/motionSceneCatalog.js";
import { MOTION_STYLE_FIGURE as F } from "../../../constants/motionStyleMetrics.js";
import { MOTION_STYLE_VALUES as SV } from "../../../constants/motionStyleConstraints.js";
import { motionStyleConstraints } from "../../../lib/motionStyleConstraints.js";
import { motionStyleTemplate, motionTemplateFits } from "../../../lib/motionStyleMetrics.js";
import * as MR from "../../../constants/motionRuntime.js";
import type { MotionCast2d, MotionCastMember, MotionGenState, MotionStoryAnalysis } from "../../../types/motionVideo.js";
import { loadMotionEngine } from "../motionEngineService.js";
import { runMotionAi } from "../motionStoryService.js";
import { motion2dSpecies } from "../../../lib/motion2dSpecies.js";
import { board2dSha, readBoard2dLib, writeBoard2dLib, type Board2dOptions } from "./board2d.js";

type Found = string | null | undefined;
const hexOr = (v: unknown): string | null => (_.isString(v) && C.HEX_FULL_RE.test(v) ? v.toLowerCase() : null);

const colorIn = (text: string): string | null => {
  const hex = text.match(C.HEX_RE);
  let best: { at: number; len: number; hex: string } | null = hex ? { at: hex.index || 0, len: hex[0].length, hex: hex[0].toLowerCase() } : null;
  for (const [re, value] of C.COLORS) {
    const m = re.exec(text);
    if (!m) continue;
    const at = m.index || 0;
    if (!best || at < best.at || (at === best.at && m[0].length > best.len)) best = { at, len: m[0].length, hex: value };
  }
  return best ? best.hex : null;
};
const near = (look: string, re: RegExp): Found => {
  re.lastIndex = 0;
  const m = re.exec(look);
  re.lastIndex = 0;
  if (!m) return undefined;
  const from = (m.index || 0) + m[0].length;
  return colorIn(look.slice(from, from + C.LOOK_WINDOW));
};
const lookText = (c: MotionCastMember): string => _.compact([c.look, c.description, c.costume?.label, c.costume?.top, c.costume?.bottom, c.costume?.hat, ...(c.costume?.extras || [])]).join(C.SPACE).normalize(MR.MOTION_TEXT_NFC).toLowerCase();
const isGhost = (c: MotionCastMember): boolean => c.type === C.GHOST_TYPE || C.GHOST_WORD_RE.test([c.name, c.role].join(C.SPACE).normalize(MR.MOTION_TEXT_NFC).toLowerCase());
const withHair = (info: MotionCast2d, c: MotionCastMember, i: number): MotionCast2d => {
  if (info.hair || info.hatKind === C.KINDS.CONE || info.animal) return info;
  const look = lookText(c);
  if (C.BALD_RE.test(look)) return info;
  const hair = hexOr(c.colors?.hair) || near(look, C.ROLE_RE.hair) || (c.age === C.AGE_SENIOR ? pick(MOTION_CHARACTER_SENIOR_HAIR, i).hex : pick(MOTION_CHARACTER_PALETTE.hair, i).hex);
  const hairKind = C.HAIR_LONG_RE.test(look) || c.gender === C.FEMALE ? C.KINDS.LONG : C.HAIR_SPIKE_RE.test(look) ? C.KINDS.SPIKE : C.HAIR_SIDE_RE.test(look) ? C.KINDS.SIDE : C.KINDS.SHORT;
  return { ...info, hair, hairKind };
};
const pick = <T>(list: readonly T[], i: number): T => list[((i % list.length) + list.length) % list.length];

const heightOf = (c: MotionCastMember): number => {
  const base = c.age === C.AGE_CHILD ? C.HEIGHT.child : c.age === C.AGE_SENIOR ? C.HEIGHT.senior : C.HEIGHT.adult;
  return +(base * (c.gender === C.FEMALE ? C.HEIGHT.female : 1)).toFixed(3);
};

const deriveAnimal = (c: MotionCastMember, species: string): MotionCast2d => {
  const look = lookText(c);
  const nameColor = colorIn(String(c.name || C.EMPTY).normalize(MR.MOTION_TEXT_NFC).toLowerCase());
  const fur = hexOr(c.colors?.top) || nameColor || colorIn(look.replace(C.ROLE_RE.hat, C.EMPTY)) || C.SPECIES_FUR[species] || C.DEFAULT_TOP;
  return {
    skin: fur,
    top: fur,
    bottom: null,
    hair: null,
    hairKind: null,
    hat: null,
    hatKind: null,
    scarf: null,
    eye: C.DEFAULT_EYE,
    legs: true,
    arms: false,
    animal: true,
    species,
    height: C.SPECIES_HEIGHT[species] || C.SPECIES_HEIGHT.dog,
    ghost: isGhost(c),
  };
};

const deriveFree = (c: MotionCastMember, i: number, skin: string): { info: MotionCast2d; guessed: boolean } => {
  const look = lookText(c);
  const colors = c.colors || {};
  const topFound = hexOr(colors.top) || near(look, C.ROLE_RE.top) || null;
  const top = topFound || pick(MOTION_CHARACTER_PALETTE.top, i).hex;
  const skirtNear = near(look, C.ROLE_RE.skirt);
  const bottom = hexOr(colors.bottom) || (skirtNear !== undefined ? skirtNear || pick(MOTION_CHARACTER_PALETTE.bottom, i).hex : near(look, C.ROLE_RE.bottom) || null);
  const hatNear = near(look, C.ROLE_RE.hat);
  const hatKind = hatNear === undefined ? null : C.HAT_CONE_RE.test(look) ? C.KINDS.CONE : C.HAT_HELMET_RE.test(look) ? C.KINDS.HELMET : C.HAT_TURBAN_RE.test(look) ? C.KINDS.TURBAN : C.KINDS.CAP;
  const hat = hatNear === undefined ? null : hatNear || (hatKind === C.KINDS.CONE ? C.HAT_CONE_COLOR : hexOr(colors.accent) || pick(MOTION_CHARACTER_PALETTE.accent, i).hex);
  const bald = C.BALD_RE.test(look);
  const hair = bald || hatKind === C.KINDS.CONE ? null : hexOr(colors.hair) || near(look, C.ROLE_RE.hair) || (c.age === C.AGE_SENIOR ? pick(MOTION_CHARACTER_SENIOR_HAIR, i).hex : pick(MOTION_CHARACTER_PALETTE.hair, i).hex);
  const hairKind = !hair ? null : C.HAIR_LONG_RE.test(look) || (c.gender === C.FEMALE && !C.HAIR_SPIKE_RE.test(look)) ? C.KINDS.LONG : C.HAIR_SPIKE_RE.test(look) ? C.KINDS.SPIKE : C.HAIR_SIDE_RE.test(look) ? C.KINDS.SIDE : C.KINDS.SHORT;
  const scarfNear = near(look, C.ROLE_RE.scarf);
  const info: MotionCast2d = {
    skin,
    top,
    bottom,
    hair,
    hairKind,
    beard: C.BEARD_RE.test(look) ? (c.age === C.AGE_SENIOR ? C.BEARD_COLOR : hair || C.BEARD_COLOR) : null,
    hat,
    hatKind,
    glasses: C.GLASSES_RE.test(look),
    scarf: scarfNear === undefined ? null : scarfNear || pick(MOTION_CHARACTER_PALETTE.accent, i + 1).hex,
    skirt: skirtNear !== undefined,
    eye: C.DEFAULT_EYE,
    legs: false,
    arms: true,
    animal: !!motionSceneType(c.type)?.animal,
    height: heightOf(c),
    ghost: isGhost(c),
  };
  return { info, guessed: !topFound };
};

const templateInfo = (c: MotionCastMember, i: number, analysis: MotionStoryAnalysis, skin: string, arms: boolean): MotionCast2d => {
  const look = lookText(c);
  const body = hexOr(c.colors?.top) || near(look, C.ROLE_RE.top) || pick(MOTION_CHARACTER_PALETTE.top, i).hex;
  const design = motionStyleTemplate(analysis.referenceStyle!.metrics!, { body, face: skin, feature: analysis.referenceStyle?.outlineColor || F.FALLBACK_FEATURE }, { arms });
  const info = designInfoOf(design) || { skin, top: body, height: heightOf(c) };
  return { ...withHair(info, c, i), top: body, ghost: isGhost(c), height: +(info.height * (c.age === C.AGE_CHILD ? C.TEMPLATE_CHILD : 1)).toFixed(3) };
};

const designInfoOf = (design: unknown): MotionCast2d | null => {
  try {
    const fn = loadMotionEngine().engine?.SVG2D?.designInfo;
    return fn ? (JSON.parse(JSON.stringify(fn(JSON.parse(JSON.stringify(design))))) as MotionCast2d) : null;
  } catch {
    return null;
  }
};
const hasDesign = (d: any): boolean => Array.isArray(d?.parts) && d.parts.length > 0;

const enrich = async (members: MotionCastMember[], analysis: MotionStoryAnalysis, styleKey: string, o: Board2dOptions): Promise<Record<string, Partial<MotionCast2d>>> => {
  const out: Record<string, Partial<MotionCast2d>> = {};
  const todo: MotionCastMember[] = [];
  const idOf = (c: MotionCastMember) => board2dSha(JSON.stringify([C.CAST_VERSION, c.key, c.name, c.role, c.gender, c.age, c.look, c.description]));
  for (const c of members) {
    const hit = readBoard2dLib<Partial<MotionCast2d>>(styleKey, C.CAST, idOf(c));
    if (hit) out[c.key] = hit;
    else todo.push(c);
  }
  if (!todo.length) return out;
  try {
    const raw = await (o.ai || runMotionAi)(
      MOTION_2D_PROMPTS.CAST({
        story: analysis.title + C.SPACE + C.SEP + C.SPACE + analysis.logline,
        style: _.truncate(analysis.referenceStyle?.description || C.EMPTY, { length: 300 }),
        cast: _.map(todo, (c) => [c.key, c.name, c.role || C.EMPTY, c.gender || C.EMPTY, c.age || C.EMPTY, c.look || c.description || C.EMPTY].join(C.SPACE + C.SEP + C.SPACE)).join(MR.MOTION_TEXT_SYMBOL_27),
      }),
      C.ARTIFACT_CAST,
      o.mainExec || o.exec,
      o.signal,
      o.log,
    );
    for (const it of _.castArray(raw?.cast || [])) {
      const c = _.find(todo, { key: it?.key });
      if (!c) continue;
      const kinds = _.values(C.KINDS) as string[];
      const v: Partial<MotionCast2d> = _.omitBy(
        {
          top: hexOr(it.top),
          bottom: hexOr(it.bottom),
          hair: hexOr(it.hair),
          hairKind: _.includes(kinds, it.hairKind) ? it.hairKind : undefined,
          hat: hexOr(it.hat),
          hatKind: _.includes(kinds, it.hatKind) ? it.hatKind : undefined,
          beard: hexOr(it.beard),
          scarf: hexOr(it.scarf),
          glasses: it.glasses === true ? true : undefined,
          skirt: it.skirt === true ? true : undefined,
          ghost: it.ghost === true ? true : undefined,
        },
        (x) => x === null || x === undefined,
      );
      if (!v.top) continue;
      out[c.key] = v;
      writeBoard2dLib(styleKey, C.CAST, idOf(c), v);
    }
  } catch (e: any) {
    if (o.signal?.aborted) throw e;
    o.log(C.LOG_CAST_FAIL(String(e?.message || e)));
  }
  return out;
};

export const buildCast2d = async (analysis: MotionStoryAnalysis, gen: MotionGenState, styleKey: string, o: Board2dOptions): Promise<Record<string, MotionCast2d>> => {
  const constraints = motionStyleConstraints(analysis.referenceStyle, MR.MOTION_TEXT_2D);
  const skin = constraints.faceFill ? constraints.faceFill.toLowerCase() : C.DEFAULT_SKIN;
  const arms = !_.includes(constraints.absent, SV.ARMS);
  const out: Record<string, MotionCast2d> = {};
  const free: { c: MotionCastMember; i: number; info: MotionCast2d; guessed: boolean }[] = [];
  _.forEach(analysis.cast, (c, i) => {
    const species = motion2dSpecies(c);
    if (species) {
      out[c.key] = deriveAnimal(c, species);
      return;
    }
    const legacy = gen.cast?.[c.key];
    if (hasDesign(legacy)) {
      const info = designInfoOf(legacy);
      if (info) {
        out[c.key] = { ...withHair(info, c, i), ghost: isGhost(c) };
        return;
      }
    }
    const animal = !!motionSceneType(c.type)?.animal;
    if (analysis.referenceStyle?.metrics && motionTemplateFits(constraints, MR.MOTION_TEXT_2D, animal)) {
      out[c.key] = templateInfo(c, i, analysis, skin, arms);
      return;
    }
    const d = deriveFree(c, i, skin);
    out[c.key] = d.info;
    free.push({ c, i, ...d });
  });
  const ask = _.filter(free, (f) => f.guessed);
  const extra = ask.length ? await enrich(_.map(ask, (f) => f.c), analysis, styleKey, o) : {};
  for (const f of free) if (extra[f.c.key]) out[f.c.key] = { ...f.info, ...extra[f.c.key], ghost: f.info.ghost || extra[f.c.key].ghost === true };
  o.log(C.LOG_CAST(_.size(out), _.size(extra)));
  return out;
};

export const cast2dSpec = (cast: Record<string, MotionCast2d> | undefined): Record<string, unknown> => _.mapValues(cast || {}, (info) => ({ info2d: info, ghost: info.ghost === true }));
