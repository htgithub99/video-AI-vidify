import { RUNTIME_TEXT as RT_SHARED } from "../../../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { stringifyJson } from "../../../../../lib/jsonStringify.js";
import { motionCharacterTraits, motionSemanticText, motionLocationFamily } from "../../../../../lib/motionResourceSemantics.js";
import { isTerminalMotionAiError } from "../../../../../server/services/chatSubmissionRecovery.js";
import { MOTION_VISUAL_CONTRACT as V } from "../../../../../constants/motionVisualContract.js";
import { puppetTimestamp as now } from "../../../../../lib/motionPuppetValues.js";
import _ from "lodash";
import { PA } from "../../../../../constants/motionPuppetAssets.js";
import { preferredPuppetProps, puppetAssetName, puppetObjectClass, puppetPropAllowed, puppetPropFits } from "../../../../../lib/motionPuppetAssets.js";
import { PUPPET as P, PUPPET_PROMPTS as PR, PUPPET_TYPES } from "../../../../../constants/motionPuppet.js";
import { MOTION_GEN_CONFIG } from "../../../../../constants/motionGenPrompts.js";
import { PUPPET_SEED_GROUP, PUPPET_SEED_TAG } from "../../../../../constants/motionPuppetSeed.js";
import { MOTION_STORY_CONFIG } from "../../../../../constants/motionVideo.js";
import type { MotionAiExecution, MotionCastMember } from "../../../../../types/motionVideo.js";
import type { PuppetCharacter, PuppetLight, PuppetObject, PuppetPlace, PuppetProp, PuppetSet, PuppetSprite, PuppetStylePack, PuppetViews } from "../../../../../types/motionPuppet.js";
import { mapMotionAiPool, runMotionAi, type MotionAiImage } from "../motionStoryService.js";
import { listPuppets, newPuppetId, puppetHash, readPuppet, writePuppet, writePuppetDiagnostic } from "./kitLibrary.js";
import { assertPuppetDrawingAllowed, puppetPackActive } from "./packPolicy.js";
import { MOTION_PACK as PACK } from "../../../../../constants/motionPack.js";
import { puppetSetWithFixtureStates } from "./packFixtures.js";
import { puppetPackSetLocationFits } from "./packLocation.js";
import { characterSheetSvg, cleanPuppetSvg, puppetImages, puppetReviewBoard, svgShapes } from "./svg.js";
import { cleanPuppetSpots } from "./layout.js";
import { cleanPuppetCompositions } from "./blocking.js";
import { puppetStyleImages, puppetStyleText, type PuppetRunOptions } from "./stylePack.js";
export const puppetLanes = (exec: MotionAiExecution): number => (_.includes(MOTION_GEN_CONFIG.SERIAL_PROVIDERS, exec.provider) ? 1 : Math.min(P.LANES, MOTION_STORY_CONFIG.PROVIDER_PARALLEL[String(exec.provider)] || P.LANES));
const hex = (v: unknown): string | undefined => (_.isString(v) && P.HEX_RE.test(v) ? v.toLowerCase() : undefined);
const ask = (o: PuppetRunOptions, prompt: string, artifact: string, images?: MotionAiImage[]): Promise<any> => (o.ai || runMotionAi)(prompt, artifact, ([P.ARTIFACT_CHAR_CHECK, P.ARTIFACT_SET_CHECK, P.ARTIFACT_CAST_MATCH, P.ARTIFACT_LIB_MATCH] as string[]).includes(artifact) ? o.mainExec || o.exec : o.exec, o.signal, o.log, images && images.length ? images : undefined);
const quiet = (o: PuppetRunOptions, prompt: string, artifact: string, images?: MotionAiImage[]): Promise<any> =>
  ask(o, prompt, artifact, images).catch((e: any) => {
    if (isTerminalMotionAiError(e, o.signal)) throw e;
    return null;
  });
const lightsOf = (raw: unknown): PuppetLight[] => _.take(_.compact(_.map(_.castArray(raw || []), (l: any) => (l && _.isFinite(Number(l.x)) && _.isFinite(Number(l.y)) ? { x: Number(l.x), y: Number(l.y), color: hex(l.color) || P.LIGHT_COLOR, kind: _.toString(l.kind || P.LIGHT_KIND) } : null))), P.LIGHTS_MAX);
export const castProfile = (c: MotionCastMember): string => _.compact([c.name, c.role, c.gender, c.age, c.look || c.description]).join(P.SEP);
const views = (raw: any, max: number): PuppetViews => {
  const out: PuppetViews = {};
  for (const v of P.VIEWS) if (raw?.[v]) out[v as keyof PuppetViews] = cleanPuppetSvg(raw[v], max);
  if (!out.front) throw new Error(P.ERR_EMPTY);
  return out;
};
const drawChecked = async <T>(keys: string[], draft: (key: string, why: string, last: boolean) => Promise<T>, review: (items: { key: string; item: T }[]) => Promise<Record<string, string>>, fail: (key: string, why: string) => void, redoLog: (key: string, why: string) => void, o: PuppetRunOptions): Promise<Record<string, T>> => {
  const out: Record<string, T> = {};
  const tries: Record<string, number> = {};
  const why: Record<string, string> = {};
  const run = async (k: string, once: boolean): Promise<void> => {
    while ((tries[k] || 0) < P.DRAW_TRIES && !o.signal?.aborted) {
      tries[k] = (tries[k] || 0) + 1;
      try {
        out[k] = await draft(k, why[k] || P.EMPTY, tries[k] >= P.DRAW_TRIES);
        return;
      } catch (e: any) {
        if (isTerminalMotionAiError(e, o.signal)) throw e;
        why[k] = String(e?.message || e);
        fail(k, why[k]);
        if (once) return;
      }
    }
  };
  await mapMotionAiPool(keys, (k) => run(k, false), puppetLanes(o.exec));
  const checkable = _.filter(keys, (k) => !!out[k]);
  const bad = checkable.length ? await review(_.map(checkable, (k) => ({ key: k, item: out[k] }))) : {};
  const rejected = _.filter(checkable, (k) => !!bad[k]);
  for (const k of rejected) {
    why[k] = bad[k];
    redoLog(k, bad[k]);
    delete out[k];
  }
  const redo = rejected.filter((key) => (tries[key] || 0) < P.DRAW_TRIES);
  await mapMotionAiPool(redo, (k) => run(k, true), puppetLanes(o.exec));
  const redrawn = redo.filter((key) => !!out[key]);
  const stillBad = redrawn.length ? await review(redrawn.map((key) => ({ key, item: out[key] }))) : {};
  for (const key of redrawn.filter((key) => !!stillBad[key])) {
    why[key] = stillBad[key];
    fail(key, why[key]);
    delete out[key];
  }
  const missing = keys.filter((key) => !out[key]);
  if (missing.length) throw new Error(P.ERR_DRAW_ASSETS(missing.map((key) => [key, why[key]].filter(Boolean).join(P.SEP))));
  return out;
};
const reviewInChunks = async <T>(items: { key: string; item: T }[], size: number, kind: string, call: (chunk: { key: string; item: T }[]) => Promise<Record<string, string>>, o: PuppetRunOptions): Promise<Record<string, string>> => {
  const chunks = _.chunk(items, size);
  o.log(P.LOG_CHECK_BATCH(kind, items.length, chunks.length));
  const parts = await mapMotionAiPool(chunks, call, puppetLanes(o.exec));
  return Object.assign({}, ...parts);
};
export const drawPuppetCharacters = async (style: PuppetStylePack, cast: MotionCastMember[], story: string, others: string, o: PuppetRunOptions): Promise<Record<string, PuppetCharacter>> => {
  assertPuppetDrawingAllowed();
  const refs = puppetStyleImages(style, P.CHAR_REF_KINDS);
  const byKey = _.keyBy(cast, (c) => c.key);
  const draft = async (k: string, why: string): Promise<PuppetCharacter> => {
    const c = byKey[k];
    o.log(P.LOG_CHAR(c.name || c.key));
    const raw = await ask(o, PR.CHARACTER({ style: puppetStyleText(style), story, character: castProfile(c), why }), P.ARTIFACT_CHARACTER, refs);
    const head = views(raw?.head, P.SVG_HEAD_BYTES);
    const body = views(raw?.body, P.SVG_BODY_BYTES);
    const colors = { body: hex(raw?.colors?.body), sleeve: hex(raw?.colors?.sleeve), skin: hex(raw?.colors?.skin), hair: hex(raw?.colors?.hair), face: hex(raw?.colors?.face) };
    return { id: newPuppetId(PUPPET_TYPES.CHARACTER), type: PUPPET_TYPES.CHARACTER, styleId: style.id, name: c.name || c.key, role: c.role, desc: castProfile(c), tags: _.compact([c.gender, c.age, c.role]), story, height: _.clamp(Number(raw?.height) || (c.age === P.AGE_CHILD ? P.HEIGHT_CHILD : 1), 0.6, 1.15), colors: _.omitBy(colors, _.isNil), head, body, sprites: {}, uses: 0, updatedAt: now() };
  };
  const checkRefs = _.take(refs, P.CHECK_REFS);
  const review = (items: { key: string; item: PuppetCharacter }[]) =>
    reviewInChunks(
      items,
      P.CHARS_PER_CHECK,
      P.KIND_CHARACTERS,
      async (chunk) => {
        const sheets = await puppetImages(_.map(chunk, (it) => ({ svg: characterSheetSvg(it.item, style.body.head), w: P.SHEET_PNG[0], h: P.SHEET_PNG[1] })));
        if (!sheets.length) return {};
        const raw = await quiet(o, PR.CHARS_CHECK({ characters: _.map(chunk, (it, i) => [i, castProfile(byKey[it.key])].join(P.SEP)).join(P.NL), others }), P.ARTIFACT_CHAR_CHECK, [...sheets, ...checkRefs]);
        const bad: Record<string, string> = {};
        for (const c of _.castArray(raw?.checks || [])) {
          const it = chunk[Number(c?.i)];
          if (it && (c?.ok === false || (checkRefs.length > 0 && Number(c?.styleScore) < P.STYLE_MATCH_MIN))) bad[it.key] = _.truncate(_.compact([_.toString(c.problems), _.toString(c.styleDiff)]).join(P.SEP), { length: 400 }) || P.WHY_STYLE;
        }
        return bad;
      },
      o,
    );
  const made = await drawChecked(
    _.map(cast, (c) => c.key),
    draft,
    review,
    (k, why) => o.log(P.LOG_CHAR_FAIL(byKey[k].name || k, why)),
    (k, why) => o.log(P.LOG_CHAR_CHECK(byKey[k].name || k, why)),
    o,
  );
  return _.mapValues(made, (c) => writePuppet(c));
};
export const drawPuppetSprites = async (style: PuppetStylePack, c: PuppetCharacter, o: PuppetRunOptions): Promise<PuppetCharacter> => {
  assertPuppetDrawingAllowed();
  const sheet = await puppetImages([{ svg: characterSheetSvg(c, style.body.head), w: P.SHEET_PNG[0], h: P.SHEET_PNG[1] }]);
  const raw = await quiet(o, PR.SPRITES({ style: puppetStyleText(style), character: c.desc, colors: stringifyJson(c.colors) }), P.ARTIFACT_SPRITES, [...sheet, ...puppetStyleImages(style, P.CHAR_REF_KINDS, 3)]);
  const sprites: Record<string, PuppetSprite> = {};
  for (const k of P.SPRITES) {
    const it = raw?.[k];
    try {
      if (!it?.svg) continue;
      const anchor = Array.isArray(it.anchor) && it.anchor.length >= 2 ? [_.clamp(Number(it.anchor[0]) || 0.5, 0, 1), _.clamp(Number(it.anchor[1]) || 0.97, 0, 1)] : [0.5, 0.97];
      sprites[k] = { svg: cleanPuppetSvg(it.svg, P.SVG_SPRITE_BYTES), w: _.clamp(Number(it.w) || 1, 0.3, 2), h: _.clamp(Number(it.h) || 1, 0.3, 2), anchor };
    } catch (e: any) {
      o.log(P.LOG_CHAR_FAIL(c.name + P.SPACE + k, String(e?.message || e)));
    }
  }
  return writePuppet<PuppetCharacter>({ ...c, sprites: { ...(c.sprites || {}), ...sprites }, updatedAt: now() });
};
const setRefKinds = (p: PuppetPlace): string[] => _.compact([p.time === P.NIGHT ? P.REF_NIGHT : null, ...(p.interior ? (P.KITCHEN_RE.test(p.key + P.SPACE + p.name + P.SPACE + p.desc) ? [P.REF_KITCHEN, P.REF_INTERIOR] : [P.REF_INTERIOR, P.REF_KITCHEN]) : [P.REF_EXTERIOR, P.REF_LANDSCAPE])]);
export interface PuppetSetJob {
  reference?: PuppetSet | null;
  key: string;
  place: PuppetPlace;
  uses: string;
  validate?: (set: PuppetSet) => string[];
}
export const drawPuppetSets = async (style: PuppetStylePack, jobs: PuppetSetJob[], o: PuppetRunOptions): Promise<Record<string, PuppetSet>> => {
  assertPuppetDrawingAllowed();
  const shapes = P.DETAIL_SHAPES[style.detail] || P.DETAIL_SHAPES[P.DETAIL_DEFAULT];
  const byKey = _.keyBy(jobs, (j) => j.key);
  const descOf = (place: PuppetPlace): string => place.name + P.DASH + place.desc + (place.interior ? P.INTERIOR_NOTE : P.EXTERIOR_NOTE);
  const draft = async (k: string, why: string, last: boolean): Promise<PuppetSet> => {
    const { place, uses, reference } = byKey[k];
    o.log(P.LOG_SET(place.name || place.key));
    const context = reference ? uses + P.NL + V.REFERENCE + stringifyJson({ svg: reference.svg, spots: reference.spots, compositions: reference.compositions }) : uses;
    const raw = await ask(o, PR.SET({ style: puppetStyleText(style, P.PART_SET), place: descOf(place), uses: context, time: place.time, why, lo: shapes[0], hi: shapes[1] }), P.ARTIFACT_SET, puppetStyleImages(style, setRefKinds(place)));
    const svg = cleanPuppetSvg(raw?.svg, P.SVG_SET_BYTES);
    const n = svgShapes(svg);
    const spots = cleanPuppetSpots(raw?.spots);
    if (n < shapes[0] && !last) throw new Error(P.WHY_SIMPLE(n, shapes[0]));
    const set: PuppetSet = {
      id: newPuppetId(PUPPET_TYPES.SET),
      type: PUPPET_TYPES.SET,
      styleId: style.id,
      name: place.name || place.key,
      desc: place.desc,
      tags: [place.key, place.interior ? P.INTERIOR_TAG : P.EXTERIOR_TAG],
      interior: place.interior,
      time: place.time,
      sceneCondition: place.sceneCondition,
      fixtureStates: place.fixtureStates,
      svg,
      floorY: _.clamp(Number(raw?.floorY) || P.FLOOR_DEFAULT, P.FLOOR_MIN, P.FLOOR_MAX),
      spots,
      compositions: cleanPuppetCompositions(raw?.compositions, spots),
      lights: lightsOf(raw?.lights),
      uses: 0,
      updatedAt: now(),
    };
    const missing = byKey[k].validate?.(set) || [];
    writePuppetDiagnostic(PA.SET_DRAFT, style.id + k, { place, uses, set, missing });
    if (missing.length) throw new Error(P.WHY_SET_REQUIREMENTS(missing));
    return set;
  };
  const review = (items: { key: string; item: PuppetSet }[]) =>
    reviewInChunks(
      items,
      P.SETS_PER_CHECK,
      P.KIND_SETS,
      async (chunk) => {
        const imgs = await puppetImages(_.map(chunk, (it, index) => ({ svg: it.item.svg, w: P.SET_PNG[0], h: P.SET_PNG[1], label: P.CHECK_LABEL(index) })));
        if (!imgs.length) return {};
        const refs = puppetStyleImages(style, _.uniq(_.flatMap(chunk, (it) => setRefKinds(byKey[it.key].place))), P.CHECK_REFS);
        const board = await puppetReviewBoard(imgs, refs);
        const raw = await quiet(o, PR.SETS_CHECK({ places: _.map(chunk, (it, i) => [i, descOf(byKey[it.key].place)].join(P.SEP)).join(P.NL) }), P.ARTIFACT_SET_CHECK, board);
        writePuppetDiagnostic(PA.SET_REVIEW, style.id + chunk.map((it) => it.key).join(P.SEP), { keys: chunk.map((it) => it.key), board, result: raw });
        const bad: Record<string, string> = {};
        for (const c of _.castArray(raw?.checks || [])) {
          const it = chunk[Number(c?.i)];
          if (!it) continue;
          const why = _.compact([P.WHY_MISMATCH(_.toString(c.looksLike), _.toString(c.missing)), _.toString(c.styleDiff)]).join(P.SEP) || P.WHY_STYLE;
          if (c?.match !== false && c?.severity === PA.REVIEW_MINOR) o.log(PA.LOG_SET_ADVISORY(it.item.name, why));
          else if (c?.match === false || (refs.length > 0 && Number(c?.styleScore) < P.STYLE_MATCH_MIN)) bad[it.key] = why;
        }
        for (const it of chunk) if (!bad[it.key]) writePuppet(it.item);
        return bad;
      },
      o,
    );
  const made = await drawChecked(
    _.map(jobs, (j) => j.key),
    draft,
    review,
    (k, why) => o.log(P.LOG_SET_FAIL(byKey[k].place.name || k, why)),
    (k, why) => o.log(P.LOG_SET_CHECK(byKey[k].place.name || k, why)),
    o,
  );
  return _.mapValues(made, (set) => writePuppet(set));
};
export const ensureSetVariant = async (set: PuppetSet, want: string, o: PuppetRunOptions, style?: PuppetStylePack): Promise<PuppetSet | null> => {
  if (puppetPackActive()) return set.time === want ? set : set.variants?.[want] ? readPuppet<PuppetSet>(PUPPET_TYPES.SET, set.variants[want]) : null;
  const have = set.variants?.[want] && readPuppet<PuppetSet>(PUPPET_TYPES.SET, set.variants[want]);
  if (have && !o.fresh) return have;
  o.log(P.LOG_SET_VARIANT(set.name, want));
  const raw = await quiet(o, PR.SET_VARIANT({ place: set.name + P.DASH + set.desc, time: want, svg: set.svg }), P.ARTIFACT_SET_VARIANT, style ? puppetStyleImages(style, want === P.NIGHT ? [P.REF_NIGHT] : [set.interior ? P.REF_INTERIOR : P.REF_EXTERIOR], 4) : undefined);
  try {
    const svg = cleanPuppetSvg(raw?.svg, P.SVG_SET_BYTES);
    const lights = lightsOf(raw?.lights);
    const v = writePuppet<PuppetSet>({ ...set, id: newPuppetId(PUPPET_TYPES.SET), name: set.name + P.VARIANT_SEP + want, svg, time: want, lights: lights.length ? lights : set.lights, variants: undefined, tags: [...set.tags, want], updatedAt: now() });
    writePuppet<PuppetSet>({ ...set, variants: { ...(set.variants || {}), [want]: v.id }, updatedAt: now() });
    return v;
  } catch (e: any) {
    o.log(P.LOG_SET_FAIL(set.name, String(e?.message || e)));
    return null;
  }
};
export const matchLibraryProps = async (style: PuppetStylePack, objects: PuppetObject[], o: PuppetRunOptions): Promise<Record<string, PuppetProp>> => {
  const list = preferredPuppetProps(listPuppets<PuppetProp>(PUPPET_TYPES.PROP, (p) => p.styleId === style.id && puppetPropAllowed(p)));
  const out: Record<string, PuppetProp> = {};
  for (const ob of objects) {
    const hit = list.find((p) => puppetPropFits(ob, p));
    if (hit) out[ob.key] = hit;
  }
  o.log(P.LOG_PROP_MATCH(_.size(out), objects.length));
  return out;
};
const setGroup = (s: PuppetSet): string => s.group || (_.includes(s.tags, PUPPET_SEED_TAG) ? PUPPET_SEED_GROUP(s.tags[0]) : s.id);
const pickOf = (seed: string, list: { id: string; uses: number }[]) => _.first(_.sortBy(list, [(a) => a.uses || 0, (a) => puppetHash(seed + a.id)]));
const usePuppet = <T extends PuppetSet | PuppetCharacter>(a: T): T => writePuppet<T>({ ...a, uses: (a.uses || 0) + 1 });
const packMatchScore = (requested: string, candidate: string): number => {
  const words = (text: string) => [
    ...new Set(
      text
        .toLowerCase()
        .split(PACK.WORDS)
        .filter((word) => word.length > 2 && !(PACK.STOP_WORDS as readonly string[]).includes(word)),
    ),
  ];
  return words(requested).filter((word) => words(candidate).includes(word)).length;
};
export const matchLibrarySets = async (style: PuppetStylePack, places: PuppetPlace[], o: PuppetRunOptions, seed: string, fits: (key: string, set: PuppetSet) => boolean = () => true): Promise<Record<string, PuppetSet>> => {
  const compatible = (place: PuppetPlace, set: PuppetSet): boolean => set.interior === place.interior && fits(place.key, set) && (!puppetPackActive() || puppetPackSetLocationFits(place, set));
  const rawSets = listPuppets<PuppetSet>(PUPPET_TYPES.SET, (s) => s.styleId === style.id && (puppetPackActive() || !s.name.includes(P.VARIANT_SEP)));
  const all = puppetPackActive()
    ? _.uniqBy(
        places.flatMap((place) => rawSets.map((set) => puppetSetWithFixtureStates(set, place.fixtureStates)).filter((set): set is PuppetSet => !!set)),
        (set) => set.id,
      )
    : rawSets;
  const replaced = new Set(all.flatMap((set) => set.replaces || []));
  const groups = _.groupBy(
    _.orderBy(
      all.filter((set) => !replaced.has(set.id)),
      [(set) => set.placementVersion || 0, (set) => set.updatedAt, (set) => set.id],
      [RT_SHARED.DESC, RT_SHARED.DESC, RT_SERVER.ASC],
    ),
    setGroup,
  );
  const library = _.take(
    _.uniqBy(
      _.flatMap(_.values(groups), (group) => _.compact(places.map((place) => group.find((set) => compatible(place, set))))),
      (set) => set.id,
    ),
    P.LIB_MATCH_MAX,
  );
  if (!places.length || !library.length) return {};
  const out: Record<string, PuppetSet> = {};
  const rest: PuppetPlace[] = [];
  for (const pl of places) {
    const exact = _.find(library, (s) => (s.tags[0] === pl.key || s.name === pl.name) && compatible(pl, s));
    const valid = library.filter((set) => compatible(pl, set));
    const unique = _.uniqBy(valid, setGroup);
    if (exact || unique.length === 1) out[pl.key] = exact || unique[0];
    else rest.push(pl);
  }
  if (!rest.length) return out;
  const side = (inside: boolean): string => (inside ? P.INSIDE : P.OUTSIDE);
  const candidates = library.filter((s) => rest.some((pl) => compatible(pl, s)));
  const raw = puppetPackActive()
    ? undefined
    : await quiet(
        o,
        PR.LIB_MATCH({
          places: _.map(rest, (pl) =>
            [
              pl.key,
              pl.name,
              pl.desc,
              side(pl.interior),
              candidates
                .filter((s) => compatible(pl, s))
                .map((s) => s.id)
                .join(P.COMMA),
            ].join(P.SEP),
          ).join(P.NL),
          library: _.map(candidates, (s) => [s.id, s.name, s.desc, side(s.interior)].join(P.SEP)).join(P.NL),
        }),
        P.ARTIFACT_LIB_MATCH,
      );
  const byId = _.keyBy(library, (s) => s.id);
  for (const m of _.castArray(raw?.matches || [])) {
    const pl = _.find(rest, { key: _.toString(m?.key) });
    const set = byId[_.toString(m?.id)];
    if (pl && set && compatible(pl, set)) out[pl.key] = set;
  }
  if (puppetPackActive())
    for (const place of rest.filter((place) => !out[place.key])) {
      const ranked = candidates
        .filter((set) => compatible(place, set))
        .map((set) => ({ set, score: (motionLocationFamily([place.visualBase, place.key, place.name, place.desc].join(P.SPACE)) ? 100 : 0) + packMatchScore([place.key, place.name, place.desc].join(P.SPACE), [set.name, set.desc, ...set.tags].join(P.SPACE)) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || a.set.id.localeCompare(b.set.id));
      if (ranked[0]) out[place.key] = ranked[0].set;
    }
  o.log(P.LOG_LIB_MATCH(_.size(out)));
  return _.mapValues(out, (rep, key) =>
    usePuppet(
      pickOf(
        seed + key,
        (groups[setGroup(rep)] || [rep]).filter((s) => compatible(places.find((place) => place.key === key)!, s) && (s.placementVersion || 0) === (rep.placementVersion || 0)),
      ) as PuppetSet,
    ),
  );
};
export const puppetStockCast = (styleId: string): PuppetCharacter[] => listPuppets<PuppetCharacter>(PUPPET_TYPES.CHARACTER, (c) => c.styleId === styleId && !!c.archetype);
export const puppetCastIsGhost = (c: Pick<MotionCastMember, "name" | "role" | "look" | "description" | "appearanceOf">): boolean => {
  const named = _.compact([c.name, c.role]);
  if (c.appearanceOf || _.some(named, (v) => P.GHOST_NAME_RE.test(v))) return true;
  if (_.some(named, (v) => P.HUMAN_ROLE_RE.test(v))) return false;
  return P.GHOST_LOOK_RE.test(_.compact([c.role, c.look, c.description]).join(P.SPACE));
};
export const matchArchetypes = async (style: PuppetStylePack, cast: MotionCastMember[], o: PuppetRunOptions): Promise<Record<string, PuppetCharacter>> => {
  const stock = puppetStockCast(style.id);
  if (!cast.length || !stock.length) return {};
  const raw = puppetPackActive() ? undefined : await quiet(o, PR.CAST_MATCH({ cast: _.map(cast, (c) => [c.key, c.name, c.role || P.EMPTY, c.gender || P.EMPTY, c.age || P.EMPTY, c.look || c.description || P.EMPTY].join(P.SEP)).join(P.NL), library: _.map(stock, (s) => [s.archetype, s.name, _.compact([s.gender, s.age]).join(P.SPACE), s.desc].join(P.SEP)).join(P.NL) }), P.ARTIFACT_CAST_MATCH);
  const byArch = _.keyBy(stock, (s) => s.archetype!);
  const used = new Set<string>(o.characterIds || []);
  const out: Record<string, PuppetCharacter> = {};
  for (const m of _.castArray(raw?.matches || [])) {
    const c = _.find(cast, { key: _.toString(m?.key) });
    const want = byArch[_.toString(m?.archetype)];
    if (!c || !want || out[c.key]) continue;
    const pick = used.has(want.id) ? undefined : want;
    if (!pick || pick.group === P.GHOST_GROUP || (c.gender && pick.gender && c.gender !== pick.gender) || (c.age && pick.age && c.age !== pick.age)) continue;
    used.add(pick.id);
    out[c.key] = usePuppet(pick);
  }
  if (puppetPackActive())
    for (const character of cast.filter((character) => !out[character.key])) {
      const traits = motionCharacterTraits(character);
      const ranked = stock
        .filter((asset) => !used.has(asset.id) && asset.group !== P.GHOST_GROUP && (!traits.gender || traits.gender === asset.gender) && (!traits.age || traits.age === asset.age) && (!traits.role || traits.role.asset.test(motionSemanticText([asset.name, asset.desc, asset.archetype, asset.group].join(P.SPACE)))))
        .map((asset) => ({ asset, score: (traits.gender ? 2 : 0) + (traits.age ? 2 : 0) + (traits.role ? 5 : 0) + packMatchScore(motionSemanticText([character.role, character.look, character.description].filter(Boolean).join(P.SPACE)), motionSemanticText([asset.name, asset.desc, asset.group, asset.archetype].filter(Boolean).join(P.SPACE))) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || a.asset.id.localeCompare(b.asset.id));
      if (ranked[0]) {
        out[character.key] = ranked[0].asset;
        used.add(ranked[0].asset.id);
      }
    }
  if (_.size(out)) o.log(P.LOG_CAST_MATCH(_.map(_.keys(out), (k) => _.find(cast, { key: k })?.name || k)));
  return out;
};
export const stockExtras = (styleId: string, keys: string[], taken: string[], seed: string): Record<string, PuppetCharacter> => {
  const pool = _.sortBy(
    _.filter(puppetStockCast(styleId), (s) => _.includes(P.EXTRA_GROUPS, s.group) && !_.includes(taken, s.id)),
    (s) => puppetHash(seed + s.id),
  );
  return pool.length ? _.fromPairs(_.map(keys, (k, i) => [k, pool[i % pool.length]])) : {};
};
export const drawPuppetProps = async (style: PuppetStylePack, keys: string[], notes: Record<string, string>, setting: string, o: PuppetRunOptions, objects: Record<string, PuppetObject> = {}): Promise<Record<string, PuppetProp>> => {
  assertPuppetDrawingAllowed();
  const out: Record<string, PuppetProp> = {};
  const refs = puppetStyleImages(style, [P.REF_PROP], 4);
  let todo = keys.filter((key) => puppetObjectClass(objects[key] || { key, type: P.OBJECT_TYPE_DEFAULT }) === PA.PROP);
  let why: string = P.EMPTY;
  for (let attempt = 0; attempt < P.DRAW_TRIES && todo.length && !o.signal?.aborted; attempt++) {
    try {
      o.log(P.LOG_PROPS(todo));
      const raw = await ask(o, PR.PROPS({ style: puppetStyleText(style, P.PART_PROP), items: _.map(todo, (k) => [k, _.startCase(k), objects[k]?.description || puppetAssetName(k), PA.TRAIT + (objects[k]?.requirements || []).join(P.COMMA)].join(P.SEP)).join(P.NL), setting, why }), P.ARTIFACT_PROPS, refs);
      const failed: string[] = [];
      const drawn: PuppetProp[] = [];
      for (const k of todo) {
        const it = _.find(_.castArray(raw?.props || []), (x: any) => _.snakeCase(_.toString(x?.key)) === k);
        try {
          if (!it) throw new Error(P.ERR_EMPTY);
          const svg = cleanPuppetSvg(it.svg, P.SVG_PROP_BYTES);
          const n = svgShapes(svg);
          if (!n || (n < P.PROP_MIN_SHAPES && attempt < P.DRAW_TRIES - 1)) throw new Error(P.WHY_SIMPLE(n, P.PROP_MIN_SHAPES));
          const base = [P.PROP_BOX / 2, P.PROP_BASE_Y].map((fallback, i) => (Array.isArray(it.base) && Number.isFinite(Number(it.base[i])) ? _.clamp(Number(it.base[i]), 0, P.PROP_BOX) : fallback));
          drawn.push({
            id: newPuppetId(PUPPET_TYPES.PROP),
            type: PUPPET_TYPES.PROP,
            styleId: style.id,
            key: k,
            name: _.startCase(k),
            desc: objects[k]?.description || puppetAssetName(k),
            originalDesc: notes[k],
            catalogVersion: PA.VERSION,
            category: PA.PROP,
            objectType: objects[k]?.type,
            requirements: objects[k]?.requirements,
            tags: [k],
            svg,
            base,
            emitter: Array.isArray(it.emitter) && it.emitter.length === 2 && it.emitter.every((v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= P.PROP_BOX) ? (it.emitter as [number, number]) : undefined,
            height: _.clamp(Number(it.height) || 0.4, 0.02, 20),
            size: _.clamp(objects[k]?.size || Number(it.size) || Number(it.height) || P.SIZE_DEFAULT, P.SIZE_MIN, P.SIZE_MAX),
            mount: objects[k]?.mount || (_.includes(P.MOUNTS, it.mount) ? it.mount : P.MOUNT_FLOOR),
            uses: 0,
            updatedAt: now(),
          });
        } catch (e: any) {
          failed.push(k);
          why = String(e?.message || e);
          o.log(P.LOG_PROP_FAIL(k, why));
        }
      }
      for (const d of drawn) out[d.key] = writePuppet(d);
      todo = failed;
    } catch (e: any) {
      if (isTerminalMotionAiError(e, o.signal)) throw e;
      why = String(e?.message || e);
      o.log(P.LOG_PROP_FAIL(todo.join(P.COMMA), why));
    }
  }
  if (todo.length) throw new Error(PA.DRAW_ERROR(todo));
  return out;
};
