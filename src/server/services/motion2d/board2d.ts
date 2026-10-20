import fs from "fs";
import _ from "lodash";
import path from "path";
import { createHash } from "crypto";
import { MOTION_BOARD2D as B, MOTION_BOARD2D_PROMPTS as BP, MOTION_BOARD2D_STYLE_RULES } from "../../../constants/motionBoard2d.js";
import { MOTION_2D as C2, MOTION_2D_PROMPTS as P2 } from "../../../constants/motion2d.js";
import { codeSet2d, set2dKind } from "./sets2d.js";
import { MOTION_TEXT_UTF8 } from "../../../constants/motionRuntime.js";
import { parseJson } from "../../../lib/jsonStringify.js";
import type { MotionAiExecution, MotionBoard2d, MotionBoard2dProp, MotionBoard2dSentence, MotionBoard2dSet, MotionBoard2dSpec, MotionGenState, MotionStoryAnalysis, MotionStoryScript } from "../../../types/motionVideo.js";
import { getMotionRootDirectory } from "../motionLibraryService.js";
import { writeMotionJsonAtomic } from "../motionFileUtils.js";
import { mapMotionAiPool, runMotionAi } from "../motionStoryService.js";
import { MOTION_GEN_CONFIG } from "../../../constants/motionGenPrompts.js";
import { MOTION_STORY_CONFIG } from "../../../constants/motionVideo.js";
import { type Board2dCastInfo, type Board2dLine, board2dObjKey as objKey, board2dPoint as point, board2dCodeAlias, collectBoard2dLines, normalizeBoard2dSentence, refineBoard2dSentence, applyBoard2dDetails } from "../../../lib/motionBoard2d.js";
import { motion2dSpecies } from "../../../lib/motion2dSpecies.js";
import { find2dProp, find2dSet } from "./library2d.js";
import type { MotionPlace } from "../../../types/motionVideo.js";

export interface Board2dOptions {
  exec: MotionAiExecution;
  mainExec?: MotionAiExecution;
  signal?: AbortSignal;
  log: (s: string) => void;
  ai?: typeof runMotionAi;
  progress?: (p: number) => void;
  allPlaces?: boolean;
  places?: string[];
  redraw?: boolean;
  library?: { key: string; story: string } | null;
}
export interface Board2dLibraryUse { sets: string[]; props: string[]; }

export const board2dSha = (s: string): string => createHash(B.SHA).update(s).digest(B.HEX).slice(0, 24);
const sha = (s: string): string => board2dSha(s);
const styleDir = (styleKey: string, part: string): string => {
  const dir = path.join(getMotionRootDirectory(), B.DIR, sha(styleKey || B.DEFAULT_STYLE), part);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
export const readBoard2dLib = <T>(styleKey: string, part: string, id: string): T | null => {
  try {
    const file = path.join(styleDir(styleKey, part), id + B.JSON_EXT);
    return fs.existsSync(file) ? (parseJson(fs.readFileSync(file, MOTION_TEXT_UTF8)) as T) : null;
  } catch {
    return null;
  }
};
export const writeBoard2dLib = (styleKey: string, part: string, id: string, data: unknown): void => writeMotionJsonAtomic(path.join(styleDir(styleKey, part), id + B.JSON_EXT), data);

const repairSvg = (text: string): string => {
  if (B.SVG_EXTRACT_RE.test(text)) return text;
  const start = text.search(B.SVG_START_TAG_RE);
  const end = text.lastIndexOf(B.GT);
  if (start < 0 || end <= start) return text;
  const body = text.slice(start, end + 1);
  const open = (body.match(B.G_OPEN_RE) || []).length - (body.match(B.G_CLOSE_RE) || []).length;
  return body + B.G_CLOSE.repeat(Math.max(0, open)) + B.SVG_CLOSE;
};
export const board2dLanes = (exec: MotionAiExecution): number => (_.includes(MOTION_GEN_CONFIG.SERIAL_PROVIDERS, exec.provider) ? 1 : Math.min(B.PARALLEL, MOTION_STORY_CONFIG.PROVIDER_PARALLEL[String(exec.provider)] || B.PARALLEL));
export const validateBoard2dSvg = (raw: unknown, maxBytes: number): string => {
  const found = repairSvg(String(raw || B.EMPTY)).match(B.SVG_EXTRACT_RE);
  let svg = _.trim(found ? found[0] : B.EMPTY).replace(B.SVG_STRIP_RE, B.EMPTY).replace(B.SVG_FILTER_ATTR_RE, B.EMPTY);
  if (svg && !B.SVG_XMLNS_RE.test(svg.slice(0, svg.indexOf(B.GT) + 1))) svg = B.SVG_OPEN + B.SVG_XMLNS + svg.slice(B.SVG_OPEN.length);
  const bad = svg.match(B.SVG_FORBIDDEN_RE);
  const reason = !svg ? B.WHY_NO_SVG : !B.VIEWBOX_RE.test(svg) ? B.WHY_NO_VIEWBOX : bad ? bad[0] : !B.SVG_START_RE.test(svg) || !B.SVG_END_RE.test(svg) ? B.WHY_BROKEN : B.EMPTY;
  if (reason) {
    try {
      const dir = path.join(getMotionRootDirectory(), B.DIR);
      fs.mkdirSync(dir, { recursive: true });
      writeMotionJsonAtomic(path.join(dir, B.DEBUG_FILE), { reason, raw: String(raw || B.EMPTY).slice(0, B.DEBUG_MAX) });
    } catch {
      _.noop();
    }
    throw new Error(B.ERR_SVG + B.COLON_SP + reason);
  }
  if (Buffer.byteLength(svg) > maxBytes) throw new Error(B.ERR_SIZE);
  return svg;
};
export const propSvgQuality = (svg: string): string => {
  const shapes = (svg.match(B.SHAPE_RE) || []).length;
  const strokes = (svg.match(B.STROKE_RE) || []).length;
  return shapes < B.PROP_MIN_SHAPES || strokes < B.PROP_MIN_STROKES ? B.WHY_SIMPLE(shapes) : B.EMPTY;
};
const castInfos = (analysis: MotionStoryAnalysis): (Board2dCastInfo & { name: string; role?: string; gender?: string; age?: string })[] =>
  _.map(analysis.cast, (c) => ({
    key: c.key,
    name: c.name,
    role: c.role,
    gender: c.gender,
    age: c.age,
    species: motion2dSpecies(c),
    worn: _.compact([c.look, c.description, c.costume?.hat]).join(B.SPACE).normalize(B.NFC).toLowerCase().search(C2.ROLE_RE.hat) >= 0,
  }));
const catalogText = (propKeys: string[]): string =>
  JSON.stringify({ modes: B.MODES, vignetteKinds: B.KINDS, poses: B.POSES, expressions: B.EXPRESSIONS, cameras: B.CAMERAS, lights: B.LIGHTS, states: B.STATES, knownObjects: _.uniq([...B.CODE_OBJECTS, ...propKeys]) });
const styleText = (analysis: MotionStoryAnalysis): string => {
  const ref = analysis.referenceStyle;
  return [...MOTION_BOARD2D_STYLE_RULES, ref?.description ? B.REF_STYLE + ref.description : B.EMPTY, ref?.palette?.length ? B.PALETTE + ref.palette.join(B.COMMA_SP) : B.EMPTY, ref?.outlineColor ? B.OUTLINE + ref.outlineColor : B.EMPTY].filter(Boolean).join(B.NL);
};
const libraryPropKeys = (styleKey: string): string[] => {
  try {
    return _.map(
      _.filter(fs.readdirSync(styleDir(styleKey, B.PROPS)), (f) => f.endsWith(B.JSON_EXT)),
      (f) => f.slice(0, -B.JSON_EXT.length),
    );
  } catch {
    return [];
  }
};

const runScript = async (lines: Board2dLine[], all: Board2dLine[], script: MotionStoryScript, analysis: MotionStoryAnalysis, cast: string[], propKeys: string[], o: Board2dOptions): Promise<Record<string, MotionBoard2dSentence>> => {
  const narrator = _.find(analysis.cast, (c) => c.narrator)?.key || _.maxBy(cast, (k) => _.filter(script.beats, (b) => _.includes(b.cast || [], k)).length) || cast[0] || B.EMPTY;
  const firstIdx = _.findIndex(all, { key: lines[0].key });
  const previous = _.map(all.slice(Math.max(0, firstIdx - 3), firstIdx), B.F_TEXT).join(B.SPACE);
  const prompt = BP.SCRIPT({
    story: analysis.title + B.DASH + analysis.logline,
    cast: JSON.stringify(_.map(castInfos(analysis), (c) => _.omitBy({ key: c.key, name: c.name, role: c.role, gender: c.gender, age: c.age, species: c.species }, _.isNil))),
    narrator,
    places: _.map(analysis.places, (p) => [p.key, _.truncate(p.name + B.DASH + (p.description || B.EMPTY), { length: 140 })].join(B.PIPE)).join(B.NL),
    catalog: catalogText(propKeys),
    previous,
    sentences: _.map(lines, (l, i) => [i, l.place || B.EMPTY, l.speaker || B.EMPTY, l.cast.join(B.COMMA), l.text].join(B.PIPE)).join(B.NL),
  });
  const raw = await (o.ai || runMotionAi)(prompt, B.ARTIFACT_SCRIPT, o.mainExec || o.exec, o.signal, o.log);
  const list = _.castArray(raw?.sentences || []);
  const out: Record<string, MotionBoard2dSentence> = {};
  const infos = castInfos(analysis);
  const placeKeys = _.map(analysis.places, B.F_KEY);
  _.forEach(lines, (l, i) => {
    const item = _.find(list, (x: any) => Number(x?.i) === i);
    const norm = normalizeBoard2dSentence(item, cast);
    if (norm) out[l.key] = { ...refineBoard2dSentence(applyBoard2dDetails(norm, cast), infos, placeKeys, l.place), text: l.text };
  });
  const fixed = _.sumBy(_.values(out), (x) => x.fixed || 0);
  if (fixed) o.log(B.LOG_DETAILS(fixed, _.size(out)));
  return out;
};

const drawProps = async (keys: string[], hints: Record<string, string>, analysis: MotionStoryAnalysis, styleKey: string, o: Board2dOptions): Promise<void> => {
  await mapMotionAiPool(_.chunk(keys, B.PROPS_PER_CALL), async (group) => {
    if (o.signal?.aborted) return;
    o.log(B.LOG_PROPS(group));
    let todo = group;
    let why: string = B.EMPTY;
    for (let attempt = 0; attempt < B.DRAW_TRIES + 1 && todo.length; attempt++) {
      try {
        const raw = await (o.ai || runMotionAi)(BP.PROPS({ style: styleText(analysis), items: _.map(todo, (k) => [k, _.startCase(k), hints[k] || B.EMPTY].join(B.PIPE)).join(B.NL), why }), B.ARTIFACT_PROPS, o.exec, o.signal, o.log);
        const list = _.castArray(raw?.props || []);
        const failed: string[] = [];
        for (const k of todo) {
          const it = _.find(list, (x: any) => objKey(x?.key) === k);
          try {
            if (!it) throw new Error(B.ERR_EMPTY);
            const svg = validateBoard2dSvg(it.svg, B.PROP_MAX_BYTES);
            const weak = propSvgQuality(svg);
            if (weak && attempt < B.DRAW_TRIES) {
              why = weak;
              throw new Error(weak);
            }
            const prop: MotionBoard2dProp = { svg, grip: point(it.grip, [256, 300]), base: point(it.base, [256, 480]), height: _.clamp(Number(it.height) || 0.4, 0.02, 20) };
            writeBoard2dLib(styleKey, B.PROPS, k, prop);
          } catch (e: any) {
            failed.push(k);
            o.log(B.LOG_DRAW_FAIL(k, String(e?.message || e)));
          }
        }
        todo = failed;
      } catch (e: any) {
        if (o.signal?.aborted) throw e;
        o.log(B.LOG_DRAW_FAIL(todo.join(B.COMMA_SP), String(e?.message || e)));
      }
    }
  }, board2dLanes(o.exec));
};

const drawSet = async (place: MotionPlace, setId: string, uses: string, analysis: MotionStoryAnalysis, styleKey: string, o: Board2dOptions): Promise<boolean> => {
  const placeKey = place.key;
  const desc = place.name + B.DASH + place.description + (place.interior ? B.INTERIOR : B.EXTERIOR);
  const time = place.time || B.DEFAULT_TIME;
  o.log(B.LOG_SET(place.name || placeKey));
  let why: string = B.EMPTY;
  const tries = o.allPlaces ? C2.SETS_TRIES : B.DRAW_TRIES;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const prompt = attempt && o.allPlaces ? P2.SET_STRICT({ style: styleText(analysis), place: desc, time, why }) : BP.SET({ style: styleText(analysis), place: desc, uses, time });
      const raw = await (o.ai || runMotionAi)(prompt, B.ARTIFACT_SET, o.exec, o.signal, o.log);
      const set: MotionBoard2dSet = {
        svg: validateBoard2dSvg(raw?.svg, B.SET_MAX_BYTES),
        time,
        floorY: _.clamp(Number(raw?.floorY) || 850, 500, 1060),
        marks: _.take(_.filter(_.map(_.castArray(raw?.marks || []), (m) => point(m, [-1, -1])), (m) => m[0] >= 0 && m[0] <= B.SET_W), 8),
        lights: _.take(
          _.compact(_.map(_.castArray(raw?.lights || []), (l: any) => (l && _.isFinite(Number(l.x)) && _.isFinite(Number(l.y)) ? { x: Number(l.x), y: Number(l.y), color: _.isString(l.color) && B.HEX_RE.test(l.color) ? l.color : B.LIGHT_COLOR, kind: String(l.kind || B.LIGHT_KIND) } : null))),
          8,
        ),
      };
      writeBoard2dLib(styleKey, B.SETS, setId, set);
      return true;
    } catch (e: any) {
      if (o.signal?.aborted) throw e;
      why = String(e?.message || e);
      o.log(B.LOG_DRAW_FAIL(place.name || placeKey, why));
    }
  }
  return false;
};

const codeSetFor = (place: MotionPlace, styleKey: string): { id: string; kind: string } | null => {
  const kind = set2dKind(place);
  const set = codeSet2d(place, kind, place.time);
  const id = C2.CODE_SET_ID + sha([kind, place.key, place.time || B.EMPTY, set.svg].join(B.BAR));
  if (!readBoard2dLib(styleKey, B.SETS, id)) writeBoard2dLib(styleKey, B.SETS, id, set);
  return { id, kind };
};

const newPlaces = (lines: Board2dLine[], sentences: Record<string, MotionBoard2dSentence>, analysis: MotionStoryAnalysis): MotionPlace[] => {
  const known = new Set(_.map(analysis.places, B.F_KEY));
  const found: MotionPlace[] = [];
  for (const l of lines) {
    const s = sentences[l.key];
    if (!s?.place || known.has(s.place) || !s.placeDesc || _.some(found, { key: s.place }) || found.length >= B.MAX_NEW_PLACES) continue;
    const base = _.find(analysis.places, { key: l.place });
    const desc = s.placeDesc;
    found.push({ ...(base || {}), key: s.place, name: _.startCase(s.place), description: desc, interior: B.INTERIOR_RE.test(s.place + B.SPACE + desc.toLowerCase()), time: base?.time } as MotionPlace);
  }
  for (const l of lines) {
    const s = sentences[l.key];
    if (s?.place && !known.has(s.place) && !_.some(found, { key: s.place })) s.place = l.place || null;
  }
  return found;
};

export const board2dStyleKey = (gen: MotionGenState): string => gen.assetStyleKey || gen.referenceKey || B.DEFAULT_STYLE;

export const buildBoard2d = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: MotionGenState, sceneVisual: string, o: Board2dOptions): Promise<Board2dLibraryUse> => {
  const fromLib: Board2dLibraryUse = { sets: [], props: [] };
  const styleKey = board2dStyleKey(gen);
  const cast = _.map(analysis.cast, B.F_KEY);
  const prev = gen.board2d && gen.board2d.version === B.VERSION && gen.board2d.styleKey === styleKey ? gen.board2d : null;
  const board: MotionBoard2d = { ...(prev || {}), version: B.VERSION, styleKey, sentences: { ...(prev?.sentences || {}) }, props: [], sets: { ...(prev?.sets || {}) }, codeSets: { ...(prev?.codeSets || {}) } };
  const lines = collectBoard2dLines(script, sceneVisual);
  const castSig = sha(cast.join(B.COMMA) + B.BAR + B.SCRIPT_VERSION);
  const redo = new Set(_.filter(_.keys(board.sentences), (k) => board.sentences[k]?.redo));
  for (const k of redo) delete board.sentences[k];
  for (const l of lines) {
    if (board.sentences[l.key] || redo.has(l.key)) continue;
    const cached = readBoard2dLib<MotionBoard2dSentence>(styleKey, B.SCRIPT, sha(l.key + castSig));
    if (cached) board.sentences[l.key] = cached;
  }
  const todo = _.filter(lines, (l) => !board.sentences[l.key]);
  if (lines.length - todo.length) o.log(B.LOG_SCRIPT_CACHED(lines.length - todo.length));
  const libProps = libraryPropKeys(styleKey);
  if (todo.length) {
    const groups = _.flatMap(_.values(_.groupBy(todo, B.F_CHAPTER)), (list) => _.chunk(list, B.SENTENCES_PER_CALL));
    o.log(B.LOG_SCRIPT(todo.length, groups.length));
    let done = 0;
    await mapMotionAiPool(groups, async (group) => {
      if (o.signal?.aborted) throw new Error(B.ABORTED);
      let left = group;
      for (let attempt = 0; attempt < B.SCRIPT_TRIES && left.length; attempt++) {
        try {
          const got = await runScript(left, lines, script, analysis, cast, libProps, o);
          for (const [k, v] of Object.entries(got)) {
            board.sentences[k] = v;
            writeBoard2dLib(styleKey, B.SCRIPT, sha(k + castSig), v);
          }
          left = _.filter(left, (l) => !board.sentences[l.key]);
        } catch (e: any) {
          if (o.signal?.aborted) throw e;
          o.log(B.LOG_SCRIPT_FAIL(String(e?.message || e)));
        }
      }
      done++;
      o.progress?.((0.5 * done) / groups.length);
    }, board2dLanes(o.mainExec || o.exec));
  }
  const used = _.compact(_.map(lines, (l) => board.sentences[l.key]));
  const objectKeys = _.uniq(_.flatMap(used, (s) => [...(s.mode === B.MODE_PEOPLE ? [] : _.map(s.objects, B.F_KEY)), ..._.map(s.items || [], B.F_KEY), ..._.compact(_.map(s.actors, B.F_HOLD))]));
  const hints: Record<string, string> = {};
  for (const s of used) for (const ob of s.objects) if (ob.color && !hints[ob.key]) hints[ob.key] = ob.color;
  const needProps = _.filter(objectKeys, (k) => !board2dCodeAlias(k) && !readBoard2dLib(styleKey, B.PROPS, k));
  const peoplePlaces = _.uniq(_.compact(_.map(_.filter(lines, (l) => board.sentences[l.key]?.mode === B.MODE_PEOPLE), B.F_PLACE)));
  const extraPlaces = newPlaces(lines, board.sentences, analysis);
  const allKeys = _.uniq([..._.compact(_.map(lines, B.F_PLACE)), ..._.compact(_.map(used, B.F_PLACE))]);
  const placeKeys = o.places || (o.allPlaces ? allKeys : peoplePlaces);
  const placeOf = (pk: string): MotionPlace | undefined => _.find(analysis.places, { key: pk }) || _.find(extraPlaces, { key: pk });
  const usesOf = (pk: string): string => _.take(_.uniq([..._.map(_.filter(script.beats, { place: pk }), B.F_NARRATION), ..._.map(_.filter(lines, (l) => board.sentences[l.key]?.place === pk), B.F_TEXT)]), 4).join(B.SPACE).slice(0, 900);
  let reusedSets = 0;
  if (placeKeys.length > 1) o.log(B.LOG_PARALLEL(placeKeys.length, board2dLanes(o.exec)));
  await mapMotionAiPool(placeKeys, async (pk) => {
    const place = placeOf(pk);
    if (!place) return;
    const setId = sha([place.name, place.description, place.interior ? 1 : 0].join(B.BAR));
    if (!o.redraw && readBoard2dLib(styleKey, B.SETS, setId)) {
      board.sets[pk] = setId;
      delete board.codeSets![pk];
      reusedSets++;
      return;
    }
    const libSet = !o.redraw && o.library ? find2dSet(place, o.library.key, o.library.story) : null;
    if (libSet) {
      writeBoard2dLib(styleKey, B.SETS, setId, libSet.set);
      board.sets[pk] = setId;
      delete board.codeSets![pk];
      fromLib.sets.push(pk);
      o.log(C2.LIB.LOG_REUSE_SET(place.name || pk, libSet.name));
      return;
    }
    if (await drawSet(place, setId, usesOf(pk), analysis, styleKey, o)) {
      board.sets[pk] = setId;
      delete board.codeSets![pk];
      return;
    }
    if (!o.allPlaces) return;
    const code = codeSetFor(place, styleKey);
    if (!code) return;
    board.sets[pk] = code.id;
    board.codeSets![pk] = code.kind;
    o.log(C2.LOG_SET_CODE(place.name || pk));
  }, board2dLanes(o.exec));
  o.progress?.(0.75);
  const khoProps = o.library ? _.filter(needProps, (k) => {
    const hit = find2dProp(k, o.library!.key);
    if (hit) writeBoard2dLib(styleKey, B.PROPS, k, hit);
    return !!hit;
  }) : [];
  if (khoProps.length) {
    fromLib.props.push(...khoProps);
    o.log(C2.LIB.LOG_REUSE_PROPS(khoProps.length));
  }
  const drawPropKeys = _.difference(needProps, khoProps);
  if (drawPropKeys.length) await drawProps(drawPropKeys, hints, analysis, styleKey, o);
  o.log(B.LOG_LIBRARY(reusedSets, objectKeys.length - needProps.length));
  board.props = _.filter(objectKeys, (k) => !!readBoard2dLib(styleKey, B.PROPS, k));
  gen.board2d = board;
  o.progress?.(1);
  return fromLib;
};

export const board2dSpec = (gen: MotionGenState | undefined): MotionBoard2dSpec | undefined => {
  const board = gen?.board2d;
  if (!board || board.version !== B.VERSION) return undefined;
  const props: Record<string, MotionBoard2dProp> = {};
  for (const k of board.props) {
    const p = readBoard2dLib<MotionBoard2dProp>(board.styleKey, B.PROPS, k);
    if (p) props[k] = p;
  }
  const sets: Record<string, MotionBoard2dSet> = {};
  for (const [pk, id] of Object.entries(board.sets)) {
    const s = readBoard2dLib<MotionBoard2dSet>(board.styleKey, B.SETS, id);
    if (s) sets[pk] = s;
  }
  return { sentences: board.sentences, props, sets };
};
