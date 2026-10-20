import _ from "lodash";
import { MOTION_BOARD2D as B } from "../constants/motionBoard2d.js";
import type { MotionBeat, MotionBoard2dDetail, MotionBoard2dItem, MotionBoard2dSentence, MotionStoryScript } from "../types/motionVideo.js";
import { motion2dObjectSpecies } from "./motion2dSpecies.js";

export interface Board2dLine { key: string; text: string; beatId: string; place?: string; speaker?: string; chapterId: string; cast: string[]; }
export const board2dSentenceKey = (text: string): string => _.trim(String(text || B.EMPTY).toLowerCase().normalize(B.NFC).replace(B.NORM_STRIP_RE, B.SPACE));
export const splitBoard2dSentences = (text: string): string[] => _.compact(_.map(String(text || B.EMPTY).match(B.SENTENCE_RE) || [], _.trim));
export const board2dPoint = (v: unknown, d: number[]): number[] => (Array.isArray(v) && v.length >= 2 && _.every(v.slice(0, 2), _.isFinite) ? [Number(v[0]), Number(v[1])] : d);
const pick = (v: unknown, list: readonly string[], d: string | null): string | null => (_.isString(v) && list.includes(v) ? v : d);
const inCast = (v: unknown, cast: string[]): v is string => _.isString(v) && (cast.includes(v) || B.EXTRA_KEY_RE.test(v));
const castKey = (v: unknown, cast: string[]): string | null => (inCast(v, cast) ? v : null);
export const board2dObjKey = (v: unknown): string | null => {
  const k = _.snakeCase(String(v || B.EMPTY));
  return B.KEY_RE.test(k) ? k : null;
};

export const normalizeBoard2dSentence = (raw: any, cast: string[]): MotionBoard2dSentence | null => {
  if (!raw || !_.isObject(raw)) return null;
  const r = raw as any;
  const mode = pick(r.mode, B.MODES, null) as MotionBoard2dSentence["mode"] | null;
  if (!mode) return null;
  const objects = _.take(
    _.compact(
      _.map(_.castArray(r.objects || []), (o: any) => {
        const key = board2dObjKey(o?.key);
        if (!key) return null;
        return { key, color: _.isString(o?.color) && B.HEX_RE.test(o.color) ? o.color : null, count: _.clamp(Math.round(Number(o?.count) || 1), 1, B.MAX_COUNT), state: pick(o?.state, B.STATES, null) };
      }),
    ),
    3,
  );
  const actors = _.uniqBy(
    _.compact(
      _.map(_.castArray(r.actors || []), (a: any) => {
        const c = castKey(a?.cast, cast);
        if (!c) return null;
        const face = castKey(a?.face, cast) || pick(a?.face, B.FACES, null) || undefined;
        return _.omitBy({ cast: c, pose: pick(a?.pose, B.POSES, B.POSE_DEFAULT) as string, expression: pick(a?.expression, B.EXPRESSIONS, B.EXPR_DEFAULT) as string, face, wear: board2dObjKey(a?.wear), hold: board2dObjKey(a?.hold), small: a?.small === true ? true : undefined, grip: pick(a?.grip, B.GRIPS, null) || undefined, effect: pick(a?.effect, B.EFFECTS, null) || undefined, depth: pick(a?.depth, B.DEPTHS, null) || undefined }, (v) => _.isNil(v) || (_.isArray(v) && !v.length)) as unknown as MotionBoard2dSentence["actors"][number];
      }),
    ),
    B.F_CAST,
  );
  const items = _.take(
    _.compact(
      _.map(_.castArray(r.items || []), (it: any) => {
        const key = board2dObjKey(it?.key);
        if (!key) return null;
        const count = _.clamp(Math.round(Number(it?.count) || _.find(objects, { key })?.count || 1), 1, B.MAX_COUNT);
        return _.omitBy({ key, x: _.clamp(Number(it?.x) || 0.5, 0, 1), y: _.clamp(Number(it?.y) || 0.75, 0, 1), scale: _.clamp(Number(it?.scale) || 0.4, 0.05, 1), effect: pick(it?.effect, B.EFFECTS, null), count: count > 1 ? count : null }, _.isNil) as unknown as MotionBoard2dItem;
      }),
    ),
    B.MAX_ITEMS,
  );
  const kind = mode === B.MODE_VIGNETTE ? pick(r.kind, B.KINDS, null) : null;
  if (mode === B.MODE_VIGNETTE && !kind) return null;
  const rawPlace = _.snakeCase(String(r.place || B.EMPTY));
  const place = B.PLACE_KEY_RE.test(rawPlace) ? rawPlace : null;
  const placeDesc = place && _.isString(r.placeDesc) && _.trim(r.placeDesc) ? _.truncate(_.trim(r.placeDesc), { length: 160 }) : null;
  const details = _.take(
    _.compact(
      _.map(_.castArray(r.details || []), (d: any) => {
        const as = pick(d?.as, B.DETAIL_AS, null);
        const key = as === B.AS.ACTOR ? castKey(d?.key, cast) || board2dObjKey(d?.key) : as === B.AS.POSE ? pick(d?.key, B.POSES, null) : as === B.AS.LIGHT ? pick(d?.key, B.LIGHTS, null) : board2dObjKey(d?.key);
        if (!as || !key) return null;
        return _.omitBy({ text: _.truncate(_.toString(d?.text), { length: B.DETAIL_TEXT_MAX }), key, as, who: castKey(d?.who, cast) }, _.isNil) as MotionBoard2dDetail;
      }),
    ),
    B.MAX_DETAILS,
  );
  const apparition = pick(r.apparition?.kind, B.APPARITIONS, null) ? { kind: r.apparition.kind as string, x: _.clamp(Number(r.apparition?.x) || 0.8, 0, 1) } : null;
  const out: MotionBoard2dSentence = { mode, kind, subject: castKey(r.subject, cast), target: castKey(r.target, cast), objects, actors, camera: pick(r.camera, B.CAMERAS, B.CAMERA_DEFAULT) as string, light: pick(r.light, B.LIGHTS, null), items, place, placeDesc, ...(details.length ? { details } : {}), ...(apparition ? { apparition } : {}) };
  if (mode === B.MODE_CUTAWAY && !items.length) out.items = _.map(objects, (o, i) => ({ key: o.key, x: (i + 1) / (objects.length + 1), y: 0.8, scale: 0.35, ...(o.count && o.count > 1 ? { count: o.count } : {}) }));
  return out;
};

export const applyBoard2dDetails = (s: MotionBoard2dSentence, cast: string[]): MotionBoard2dSentence => {
  const details = s.details || [];
  if (!details.length) return s;
  const next: MotionBoard2dSentence = { ...s, actors: _.map(s.actors, (a) => ({ ...a })), items: [...(s.items || [])], objects: [...s.objects] };
  let fixed = 0;
  const actorOf = (c: string) => _.find(next.actors, { cast: c });
  const ensureActor = (c: string) => {
    if (actorOf(c) || next.mode === B.MODE_VIGNETTE || next.mode === B.MODE_CUTAWAY || next.mode === B.MODE_PLACE) return actorOf(c);
    next.actors.push({ cast: c, pose: B.POSE_DEFAULT, expression: B.EXPR_DEFAULT });
    fixed++;
    return actorOf(c);
  };
  const hasThing = (k: string) => _.some(next.items, { key: k }) || _.some(next.objects, { key: k }) || _.some(next.actors, (a) => a.hold === k || a.wear === k);
  const addThing = (k: string) => {
    if (hasThing(k)) return;
    if (next.mode === B.MODE_VIGNETTE) next.objects.push({ key: k, color: null, count: 1, state: null });
    else next.items!.push({ key: k, x: B.ITEM_SLOTS[next.items!.length % B.ITEM_SLOTS.length], y: B.ITEM_Y, scale: B.ITEM_SCALE });
    fixed++;
  };
  for (const d of details) {
    if (d.as === B.AS.ACTOR) {
      if (inCast(d.key, cast)) ensureActor(d.key);
      else addThing(d.key);
    } else if ((d.as === B.AS.WEAR || d.as === B.AS.HOLD) && d.who && inCast(d.who, cast)) {
      const a = ensureActor(d.who);
      if (a && !a[d.as as "wear" | "hold"]) {
        a[d.as as "wear" | "hold"] = d.key;
        fixed++;
      } else if (!a) addThing(d.key);
    } else if (d.as === B.AS.WEAR || d.as === B.AS.HOLD || d.as === B.AS.ITEM || d.as === B.AS.OBJECT) addThing(d.key);
    else if (d.as === B.AS.POSE && d.who && inCast(d.who, cast)) {
      const a = ensureActor(d.who);
      if (a && a.pose === B.POSE_DEFAULT && d.key !== B.POSE_DEFAULT) {
        a.pose = d.key;
        fixed++;
      }
    } else if (d.as === B.AS.LIGHT && !next.light) {
      next.light = d.key;
      fixed++;
    } else if (d.as === B.AS.PLACE && !next.place) {
      next.place = d.key;
      fixed++;
    }
  }
  if (next.mode === B.MODE_PLACE && (next.actors.length || next.items!.length)) next.mode = next.actors.length ? B.MODE_PEOPLE : B.MODE_CUTAWAY;
  if (next.mode === B.MODE_CUTAWAY && next.actors.length && !next.items!.length) next.mode = B.MODE_PEOPLE;
  return fixed ? { ...next, fixed } : next;
};

export interface Board2dCastInfo { key: string; species?: string | null; worn?: boolean; }

export const refineBoard2dSentence = (s: MotionBoard2dSentence, cast: Board2dCastInfo[], placeKeys: string[], beatPlace?: string): MotionBoard2dSentence => {
  const animals = _.filter(cast, (c) => !!c.species);
  const actors = [...s.actors];
  const animalOf = (key: string): string | null => {
    const sp = motion2dObjectSpecies(key);
    const hit = sp ? _.filter(animals, (a) => a.species === sp) : [];
    return hit.length === 1 ? hit[0].key : null;
  };
  for (const key of _.map([...s.objects, ...(s.items || [])], B.F_KEY)) {
    const a = animalOf(key);
    if (a && !_.some(actors, { cast: a })) actors.push({ cast: a, pose: B.POSE_DEFAULT, expression: B.EXPR_DEFAULT });
  }
  const wearer = _.some(actors, (a) => !!a.wear || (!!_.find(cast, { key: a.cast })?.worn && !_.find(cast, { key: a.cast })?.species));
  const keep = (key: string): boolean => !B.SCENERY_RE.test(key) && !(B.WORN_RE.test(key) && wearer) && !animalOf(key);
  const objects = _.filter(s.objects, (o) => keep(o.key));
  const items = _.filter(s.items || [], (it) => keep(it.key));
  const place = s.place && (placeKeys.includes(s.place) || s.placeDesc) ? s.place : beatPlace || null;
  const next: MotionBoard2dSentence = { ...s, objects, items, actors, ambient: undefined, place, placeDesc: place && !placeKeys.includes(place) ? s.placeDesc || null : null };
  if (s.mode === B.MODE_PEOPLE && !actors.length) next.mode = B.MODE_PLACE;
  if (s.mode === B.MODE_CUTAWAY && !items.length) next.mode = actors.length ? B.MODE_PEOPLE : B.MODE_PLACE;
  if (s.mode === B.MODE_VIGNETTE && !objects.length && actors.length > s.actors.length) next.mode = B.MODE_PEOPLE;
  if (next.mode === B.MODE_PLACE) {
    next.actors = [];
    next.items = [];
  }
  return next;
};

export const collectBoard2dLines = (script: MotionStoryScript, sceneVisual: string): Board2dLine[] => {
  const out: Board2dLine[] = [];
  const seen = new Set<string>();
  for (const beat of script.beats as MotionBeat[]) {
    if (beat.visual !== sceneVisual) continue;
    const parts = beat.utterances?.length ? beat.utterances.map((u) => ({ text: u.text, speaker: u.role === B.DIALOGUE ? u.speaker : undefined })) : [{ text: beat.narration, speaker: undefined }];
    for (const part of parts)
      for (const text of splitBoard2dSentences(part.text)) {
        const key = board2dSentenceKey(text);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push({ key, text, beatId: beat.id, place: beat.place, speaker: part.speaker, chapterId: beat.chapterId, cast: beat.cast || [] });
      }
  }
  return out;
};


export const board2dCodeAlias = (key: string): string | null => (_.includes(B.CODE_OBJECTS as readonly string[], key) ? key : _.find(B.CODE_OBJECTS as readonly string[], (c) => _.includes(_.split(key, B.UNDERSCORE), c)) || null);
