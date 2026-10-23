import { puppetTokens as tokens, puppetKeyOf as keyOf } from "../../../lib/motionPuppetValues.js";
import _ from "lodash";
import { PA } from "../../../constants/motionPuppetAssets.js";
import { puppetAssetName, puppetEnglish, puppetObjectClass } from "../../../lib/motionPuppetAssets.js";
import { PUPPET as P, PUPPET_GENRES, PUPPET_GENRE_ALIAS, PUPPET_GENRE_DEFAULT, PUPPET_PROMPTS as PR } from "../../../constants/motionPuppet.js";
import { puppetSentenceKey, type PuppetLine } from "../../../lib/motionPuppet.js";
import type { MotionStoryAnalysis } from "../../../types/motionVideo.js";
import type { PuppetFrame, PuppetFrameActor, PuppetObject, PuppetPlace, PuppetRead, PuppetSpot } from "../../../types/motionPuppet.js";
import { mapMotionAiPool, runMotionAi } from "../motionStoryService.js";
import { puppetLanes } from "./kitDraw.js";
import { puppetFeatureSpot, puppetStatePose, puppetSupportAssignments } from "./layout.js";
export { puppetFeatureSpot } from "./layout.js";
import type { PuppetRunOptions } from "./stylePack.js";
const pick = (v: unknown, list: readonly string[], d: string): string => (_.isString(v) && list.includes(v) ? v : d);
export const puppetGenreRules = (genre: string | undefined): string => {
  const g = PUPPET_GENRES[_.toString(genre)] || PUPPET_GENRES[PUPPET_GENRE_ALIAS[_.toString(genre)]] || PUPPET_GENRES[PUPPET_GENRE_DEFAULT];
  return [g.shots, P.PACING_LABEL + g.pacing, P.LIGHT_LABEL + g.light, P.OPENING_LABEL + g.opening].join(P.SEP);
};
const isCast = (cast: string[], c: string): boolean => cast.includes(c) || P.EXTRA_RE.test(c);
const groupsOf = <T>(list: T[], size: number): T[][] => _.chunk(list, Math.ceil(list.length / Math.max(1, Math.ceil(list.length / size))));
const previousOf = (all: PuppetLine[], first: string): string => {
  const at = _.findIndex(all, { key: first });
  return _.map(all.slice(Math.max(0, at - P.PREVIOUS_LINES), Math.max(0, at)), (l) => l.text).join(P.SPACE);
};
const wordIn = (word: string, text: string): boolean => {
  const w = puppetSentenceKey(word);
  return !!w && (P.SPACE + puppetSentenceKey(text) + P.SPACE).includes(P.SPACE + w + P.SPACE);
};
const castText = (analysis: MotionStoryAnalysis): string => _.map(analysis.cast, (c) => [c.key, c.name, c.role, c.gender, c.age, c.look || c.description || P.EMPTY].join(P.SEP)).join(P.NL);
const actorOf = (raw: any, cast: string[]): PuppetFrameActor | null => {
  const c = _.toString(raw?.char);
  if (!isCast(cast, c)) return null;
  return _.omitBy(
    {
      char: c,
      pose: pick(raw?.pose, P.POSES, P.POSE_DEFAULT),
      gesture: pick(raw?.gesture, P.GESTURES, P.EMPTY) || undefined,
      expr: pick(raw?.expr, P.EXPRS, P.EXPR_DEFAULT),
      face: pick(raw?.face, P.FACES, P.FACE_DEFAULT),
      x: _.isFinite(Number(raw?.x)) ? _.clamp(Number(raw.x), 0.05, 0.95) : undefined,
      spot: keyOf(raw?.spot) || undefined,
      support: keyOf(raw?.support) || undefined,
      target: isCast(cast, _.toString(raw?.target)) && raw.target !== c ? raw.target : undefined,
      removeWear: _.isArray(raw?.removeWear) ? _.compact(raw.removeWear.map(keyOf)) : undefined,
      hold: keyOf(raw?.hold) || undefined,
      wear: _.isArray(raw?.wear) && raw.wear.length ? _.filter(_.compact(_.map(raw.wear, keyOf)), (k) => wearable(k)) : undefined,
      depth: pick(raw?.depth, P.DEPTHS, P.DEPTH_MID),
      sil: raw?.sil === true ? true : undefined,
      trail: raw?.trail === true ? true : undefined,
    },
    _.isNil,
  ) as PuppetFrameActor;
};
export const normalizePuppetFrame = (raw: any, line: PuppetLine, cast: string[], nested = false): PuppetFrame => {
  let actors = _.take(
    _.uniqBy(_.compact(_.map(_.castArray(raw?.actors || []), (a) => actorOf(a, cast))), (a) => a.char),
    P.ACTOR_MAX,
  );
  let shot = pick(raw?.shot, P.SHOTS, P.SHOT_DEFAULT);
  const prop = keyOf(raw?.prop);
  const speaker = line.speaker && isCast(cast, line.speaker) ? line.speaker : null;
  if (_.includes(P.SHOT_PROP, shot) && !prop) shot = actors.length ? P.SHOT_DEFAULT : P.SHOT_ESTABLISHING;
  if (_.includes(P.SHOT_ONE, shot) && !actors.length) shot = speaker ? shot : P.SHOT_ESTABLISHING;
  if (_.includes(P.SHOT_NOBODY, shot)) actors = [];
  if (speaker && !_.includes(P.SHOT_NOBODY, shot) && !_.some(actors, { char: speaker }) && shot !== P.SHOT_INSERT) actors = [{ char: speaker, pose: P.POSE_TALK, expr: P.EXPR_DEFAULT, face: P.FACE_DEFAULT, depth: P.DEPTH_MID }, ...actors].slice(0, P.ACTOR_MAX);
  if (speaker) actors = _.map(actors, (a) => (a.char === speaker && a.pose === P.POSE_DEFAULT ? { ...a, pose: P.POSE_TALK } : a));
  if (shot === P.SHOT_SPLIT && !actors.length) shot = P.SHOT_ESTABLISHING;
  if (shot === P.SHOT_DUO && actors.length < 2) shot = actors.length ? P.SHOT_BUST : P.SHOT_ESTABLISHING;
  if (shot === P.SHOT_OTS) {
    if (actors.length < 2) shot = P.SHOT_DEFAULT;
    else {
      const main = speaker && _.some(actors, { char: speaker }) ? speaker : actors[0].char;
      actors = _.map(actors, (a) => (a.char === main ? { ...a, depth: P.DEPTH_MID } : { ...a, depth: P.DEPTH_FORE, face: P.FACE_BACK }));
    }
  } else actors = _.map(actors, (a) => (a.depth === P.DEPTH_FORE ? { ...a, depth: P.DEPTH_MID } : a));
  if (_.includes(P.SHOT_ONE, shot) && actors.length) {
    const main = speaker && _.some(actors, { char: speaker }) ? _.find(actors, { char: speaker })! : actors[0];
    actors = shot === P.SHOT_SHADOW ? [main, ..._.reject(actors, { char: main.char })].slice(0, 2) : [main];
  }
  actors = _.map(actors, (a) => (a.sil && (a.char === speaker || !_.includes(P.SIL_SHOTS, shot)) ? (_.omit(a, P.SIL_FIELD) as PuppetFrameActor) : a));
  const place = keyOf(raw?.place);
  const frame: PuppetFrame = {
    shot,
    set: place || line.place || undefined,
    light: pick(raw?.light, P.LIGHTS, P.EMPTY) || null,
    actors,
    prop: prop || null,
    propMount: pick(raw?.propMount, P.MOUNTS, P.EMPTY) || undefined,
    propRot: raw?.propRot != null && _.isFinite(Number(raw.propRot)) ? _.clamp(Number(raw.propRot), -180, 180) : undefined,
    propAt: keyOf(raw?.propAt) || null,
    items: _.take(
      _.uniqBy(
        _.compact(
          _.map(_.castArray(raw?.items || []), (it: any) => {
            const prop = keyOf(it?.prop);
            return prop ? { prop, propAt: keyOf(it?.propAt), propMount: pick(it?.propMount, P.MOUNTS, P.EMPTY) || undefined, propRot: it?.propRot != null && _.isFinite(Number(it.propRot)) ? _.clamp(Number(it.propRot), -180, 180) : undefined } : null;
          }),
        ),
        (it) => it.prop,
      ),
      P.OBJECTS_MAX,
    ),
    form: pick(raw?.form, P.FORMS, P.EMPTY) || undefined,
    anchor: keyOf(raw?.anchor) || undefined,
    propX: _.isFinite(Number(raw?.propX)) ? _.clamp(Number(raw.propX), 0.1, 0.9) : undefined,
    overlays: _.take(
      _.filter(_.castArray(raw?.overlays || []), (x) => _.includes(P.OVERLAYS, x)),
      3,
    ) as string[],
    camera: { move: pick(raw?.camera?.move, P.MOVES, P.MOVE_DEFAULT) },
    speaker,
    inset: keyOf(raw?.inset) || undefined,
    set2: shot === P.SHOT_SPLIT ? keyOf(raw?.set2) || undefined : undefined,
    light2: shot === P.SHOT_SPLIT ? pick(raw?.light2, P.LIGHTS, P.EMPTY) || undefined : undefined,
  };
  if (!nested && raw?.shot2 && _.isObject(raw.shot2)) frame.shot2 = normalizePuppetFrame({ place, light: raw.light, prop: raw.prop, overlays: raw.overlays, ...raw.shot2 }, line, cast, true);
  return frame;
};
export interface PuppetReadResult {
  reads: Record<string, PuppetRead>;
  newPlaces: Record<string, PuppetPlace>;
}
export const wearable = (...names: (string | undefined)[]): boolean => _.some(names, (n) => !!n && P.WEARABLE_RE.test(_.replace(n, /_/g, P.SPACE)));
const objectOf = (raw: any, line: PuppetLine): PuppetObject | null => {
  const word = _.trim(_.toString(raw?.word));
  const key = keyOf(raw?.key);
  if (!word || !key || !wordIn(word, line.text)) return null;
  if (PA.NON_OBJECT_WORD.test(word)) return null;
  let type = pick(raw?.type, P.OBJECT_TYPES, P.OBJECT_TYPE_DEFAULT);
  const category = _.toString(raw?.category) || undefined;
  const classification = puppetObjectClass({ key, type, category });
  if (classification === PA.EXCLUDED) return null;
  if (classification === PA.SCENERY && !_.includes(P.FEATURE_OBJECT_TYPES, type)) type = PA.SCENERY;
  let mount = pick(raw?.mount, P.MOUNTS, P.TYPE_MOUNT[type] || P.MOUNT_FLOOR);
  const onBody = P.BODY_PLACE_RE.test(line.text) || mount === P.MOUNT_BODY;
  if (onBody && classification === PA.PROP) {
    type = P.OBJECT_TYPE_SMALL;
    mount = P.MOUNT_BODY;
  } else if (mount === P.MOUNT_WEAR && !wearable(key, word)) {
    type = P.OBJECT_TYPE_SMALL;
    mount = P.MOUNT_HELD_KEY;
  }
  const rotation = raw?.rotation != null && _.isFinite(Number(raw.rotation)) ? _.clamp(Number(raw.rotation), -180, 180) : type === P.OBJECT_TYPE_TOOL && mount === P.MOUNT_TABLE ? P.REST_TOOL_ROTATION : undefined;
  const description = puppetEnglish(raw?.description) ? _.truncate(raw.description, { length: 500 }) : puppetAssetName(key);
  return {
    word,
    key,
    size: _.clamp(Number(raw?.size) || P.SIZE_DEFAULT, P.SIZE_MIN, P.SIZE_MAX),
    type,
    mount,
    rotation,
    owner: _.toString(raw?.owner) || undefined,
    note: _.truncate(word + P.DASH + line.text, { length: 160 }),
    category: classification === PA.SCENERY ? PA.SCENE_FEATURE : PA.PROP,
    description,
    requirements: _.uniq(_.filter(_.castArray(raw?.requirements || []), (v) => typeof v === PA.STRING && PA.KEY.test(v))),
  };
};
const readOf = (raw: any, line: PuppetLine, cast: string[], places: Record<string, PuppetPlace>, fresh: Record<string, PuppetPlace>): { read: PuppetRead; bad: boolean } => {
  let who = _.uniq(_.filter(_.map(_.castArray(raw?.who || []), _.toString), (c) => isCast(cast, c)));
  if (line.speaker && isCast(cast, line.speaker) && !who.includes(line.speaker)) who = [line.speaker, ...who];
  who = _.take(who, P.ACTOR_MAX);
  const object = raw?.object ? objectOf(raw.object, line) : null;
  const objects = _.take(
    _.uniqBy(_.compact([object, ..._.map(_.castArray(raw?.objects || []), (ob) => objectOf(ob, line))]), (ob) => ob.key),
    P.OBJECTS_MAX,
  ).map((ob) => ({ ...ob, owner: ob.owner && who.includes(ob.owner) ? ob.owner : undefined }));
  const states = _.uniqBy(
    _.filter(
      _.map(_.castArray(raw?.states || []), (s: any) => ({
        char: _.toString(s?.char),
        action: pick(s?.action, _.keys(P.ACTIONS), P.ACTION_DEFAULT),
        posture: pick(s?.posture, P.POSTURES, P.EMPTY) || undefined,
        gesture: pick(s?.gesture, P.GESTURES, P.EMPTY) || undefined,
        support: keyOf(s?.support) || undefined,
        target: who.includes(_.toString(s?.target)) && s.target !== s.char ? _.toString(s.target) : undefined,
      })),
      (s) => who.includes(s.char),
    ),
    (s) => s.char,
  );
  const named = _.trim(_.toString(raw?.object?.word));
  const f = _.toString(raw?.focus);
  const focus = isCast(cast, f) ? f : f === P.FOCUS_OBJECT && object ? f : f === P.FOCUS_PLACE ? f : who[0] || (object ? P.FOCUS_OBJECT : P.FOCUS_PLACE);
  if (isCast(cast, focus) && !who.includes(focus)) who = [focus, ...who].slice(0, P.ACTOR_MAX);
  const pk = keyOf(raw?.place);
  let place = pk && (places[pk] || fresh[pk]) ? pk : undefined;
  const desc = _.trim(_.toString(raw?.placeDesc));
  if (pk && !place && desc) {
    fresh[pk] = { key: pk, name: _.startCase(pk), desc: _.truncate(desc, { length: 200 }), interior: P.INTERIOR_RE.test(pk + P.SPACE + desc.toLowerCase()), time: _.includes(P.NIGHT_LIGHTS, raw?.light) ? P.NIGHT : P.DAY };
    place = pk;
  }
  const read: PuppetRead = {
    focus,
    who,
    place: place || line.place,
    object: objects.find((ob) => ob.key === object?.key) || null,
    objects,
    states,
    action: pick(raw?.action, _.keys(P.ACTIONS), P.ACTION_DEFAULT),
    emotion: pick(raw?.emotion, P.EXPRS, P.EXPR_DEFAULT),
    light: pick(raw?.light, P.LIGHTS, P.EMPTY) || null,
    overlays: _.take(
      _.filter(_.castArray(raw?.overlays || []), (x) => _.includes(P.OVERLAYS, x)),
      3,
    ) as string[],
  };
  return { read, bad: (!!named && !object) || (f === P.FOCUS_OBJECT && !object) };
};
export const readPuppetLines = async (lines: PuppetLine[], all: PuppetLine[], analysis: MotionStoryAnalysis, places: Record<string, PuppetPlace>, why: Record<string, string>, o: PuppetRunOptions): Promise<PuppetReadResult> => {
  const cast = _.map(analysis.cast, (c) => c.key);
  const story = analysis.title + P.DASH + analysis.logline;
  const placeText = _.map(_.values(places), (p) => [p.key, _.truncate(p.name + P.DASH + p.desc, { length: 140 })].join(P.SEP)).join(P.NL);
  const result: PuppetReadResult = { reads: {}, newPlaces: {} };
  const ask = async (group: PuppetLine[], notes: Record<string, string>): Promise<string[]> => {
    const text = _.map(group, (l, i) => [i, l.speaker || P.EMPTY, l.text, notes[l.key] ? P.FIX_PREFIX + notes[l.key] : P.EMPTY].join(P.SEP)).join(P.NL);
    const raw = await (o.ai || runMotionAi)(PR.READ({ story, cast: castText(analysis), places: placeText, previous: previousOf(all, group[0].key), lines: text }), P.ARTIFACT_READ, o.exec, o.signal, o.log).catch((e: any) => {
      if (o.signal?.aborted) throw e;
      o.log(P.LOG_READ_FAIL(String(e?.message || e)));
      return null;
    });
    const bad: string[] = [];
    for (const it of _.castArray(raw?.lines || [])) {
      const line = group[Number(it?.i)];
      if (!line) continue;
      const r = readOf(it, line, cast, places, result.newPlaces);
      result.reads[line.key] = r.read;
      if (r.bad) bad.push(line.key);
    }
    return [
      ...bad,
      ..._.map(
        _.filter(group, (l) => !result.reads[l.key]),
        (l) => l.key,
      ),
    ];
  };
  const groups = groupsOf(lines, P.READ_PER_CALL);
  o.log(P.LOG_READ(lines.length, groups.length));
  const retry = _.flatten(await mapMotionAiPool(groups, (g) => ask(g, why), puppetLanes(o.exec)));
  if (retry.length && !o.signal?.aborted) {
    o.log(P.LOG_READ_RETRY(retry.length));
    const again = _.filter(lines, (l) => retry.includes(l.key));
    const notes = _.fromPairs(_.map(again, (l) => [l.key, _.compact([why[l.key], P.WHY_READ]).join(P.SEP)]));
    await mapMotionAiPool(groupsOf(again, P.READ_PER_CALL), (g) => ask(g, notes), puppetLanes(o.exec));
  }
  for (const l of lines) if (!result.reads[l.key]) result.reads[l.key] = { focus: l.speaker || P.FOCUS_PLACE, who: l.speaker ? [l.speaker] : [], place: l.place, object: null, action: l.speaker ? P.POSE_TALK : P.ACTION_DEFAULT, emotion: P.EXPR_DEFAULT, light: null, overlays: [] };
  return result;
};
const poseOf = (r: PuppetRead): string => P.ACTIONS[r.action] || P.POSE_DEFAULT;
const exprOf = (r: PuppetRead): string => (_.includes(P.SLEEP_ACTIONS, r.action) ? P.EXPR_SLEEP : r.emotion);
const readFrame = (r: PuppetRead, line: PuppetLine, cast: string[]): PuppetFrame => {
  const who = r.who;
  const big = r.object && r.object.size >= P.SIZE_SMALL;
  const shot = r.focus === P.FOCUS_OBJECT && r.object ? (big ? P.SHOT_OBJECT : P.SHOT_INSERT) : who.length > 2 ? P.SHOT_GROUP : who.length === 2 ? P.SHOT_TWO : who.length ? P.SHOT_DEFAULT : r.object ? P.SHOT_INSERT : P.SHOT_ESTABLISHING;
  return normalizePuppetFrame({ shot, place: r.place, light: r.light, prop: r.object?.key, overlays: r.overlays, actors: _.map(who, (c) => ({ char: c, pose: c === r.focus || who.length === 1 ? poseOf(r) : P.POSE_DEFAULT, expr: exprOf(r) })) }, line, cast);
};
const composeOf = (raw: any, r: PuppetRead, line: PuppetLine, cast: string[], spots: PuppetSpot[]): PuppetFrame => {
  const keys = new Set(_.map(spots, (s) => s.key));
  const allowed = new Set([...r.who, ...(line.speaker ? [line.speaker] : [])]);
  const fill = (x: any) => {
    const actors = _.filter(_.castArray(x?.actors || []), (a: any) => allowed.has(_.toString(a?.char)));
    const listed = new Set(_.map(actors, (a: any) => _.toString(a?.char)));
    const simultaneous = (r.states || []).length > 1 && (r.states || []).some((s) => !!s.support || !!s.target);
    const shot = simultaneous && !_.includes(P.BLOCKING_SHOTS, x?.shot) ? P.SHOT_DEFAULT : _.toString(x?.shot);
    const needs = !_.includes(P.SHOT_NOBODY, shot) && shot !== P.SHOT_INSERT;
    const missing =
      needs && (!actors.length || simultaneous)
        ? _.map(
            _.filter(r.who, (c) => !listed.has(c)),
            (c) => ({ char: c, pose: c === r.focus ? poseOf(r) : P.POSE_DEFAULT, expr: exprOf(r) }),
          )
        : [];
    return {
      ...x,
      shot,
      place: r.place,
      light: r.light,
      prop: r.object?.key || null,
      overlays: r.overlays,
      propAt: keys.has(_.toString(x?.propAt)) ? x.propAt : null,
      anchor: keys.has(_.toString(x?.anchor)) ? x.anchor : undefined,
      actors: _.map([...actors, ...missing], (a: any) => {
        const spot = _.find(spots, { key: _.toString(a?.spot) });
        const pose = _.includes(P.POSES, a?.pose) ? a.pose : a.char === r.focus ? poseOf(r) : P.POSE_DEFAULT;
        return { ...a, spot: spot?.key, pose, expr: _.includes(P.EXPRS, a?.expr) ? a.expr : exprOf(r) };
      }),
    };
  };
  const frame = normalizePuppetFrame({ ...fill(raw), shot2: raw?.shot2 && _.isObject(raw.shot2) ? fill(raw.shot2) : null }, line, cast);
  return fitPuppetRead(frame, r, spots);
};
export const puppetReadObjects = (r: PuppetRead): PuppetObject[] => _.uniqBy(_.compact([r.object, ...(r.objects || [])]), (ob) => ob.key);
export const fitPuppetRead = (frame: PuppetFrame, r: PuppetRead, spots: PuppetSpot[] = []): PuppetFrame => {
  const states = _.keyBy(r.states || [], (s) => s.char);
  const used = new Set<string>();
  const assigned = puppetSupportAssignments(r.states || [], spots);
  const reserved = new Map([...(assigned || [])].map(([char, spot]) => [spot, char]));
  let out = {
    ...frame,
    actors: frame.actors.map((a) => {
      const state = states[a.char];
      if (!state) return a;
      const pose = puppetStatePose(state);
      const kind = P.POSE_KIND[pose] || P.SPOT_STAND;
      const matches = spots.filter((s) => !used.has(s.key) && (!reserved.has(s.key) || reserved.get(s.key) === a.char) && (s.kind === kind || (kind === P.SPOT_STAND && s.kind === P.SPOT_DOOR)));
      const support = state.support ? spots.find((s) => s.key === assigned?.get(a.char)) : null;
      const own = spots.find((s) => s.key === a.spot);
      const spot = state.support ? support?.key : own && matches.includes(own) ? own.key : undefined;
      if (spot) used.add(spot);
      return { ...a, pose, gesture: state.gesture, expr: _.includes(P.SLEEP_ACTIONS, state.action) ? P.EXPR_SLEEP : a.expr, support: state.support, target: state.target, spot };
    }),
  };
  out = fitObject(out, r, spots);
  out.propRot = r.object?.rotation;
  out.propMount = r.object?.mount;
  const items = [];
  for (const ob of puppetReadObjects(r).filter((ob) => ob.key !== r.object?.key)) {
    const applied = fitObject({ ...out, prop: ob.key, shot2: null }, { ...r, object: ob, action: ob.owner && states[ob.owner] ? states[ob.owner].action : r.action }, spots);
    out.actors = applied.actors;
    if (applied.prop && !out.actors.some((a) => a.hold === ob.key || a.wear?.includes(ob.key))) items.push({ prop: ob.key, propMount: ob.mount, propRot: ob.rotation, propAt: frame.items?.find((it) => it.prop === ob.key)?.propAt || undefined });
  }
  out.items = items.length ? items : undefined;
  if (out.shot === P.SHOT_OTS && out.actors.some((a) => a.support && _.includes(P.LOW_POSES, a.pose))) {
    out.shot = P.SHOT_DEFAULT;
    out.actors = out.actors.map((a) => ({ ...a, depth: P.DEPTH_MID }));
  }
  if (frame.shot2) out.shot2 = fitPuppetRead(frame.shot2, r, spots);
  return out;
};
const fitHands = (f: PuppetFrame, r: PuppetRead): PuppetFrame => {
  const key = r.object?.key;
  const shoulder = r.object?.mount === P.MOUNT_SHOULDER;
  const uses = !!key && (r.object!.mount === P.MOUNT_HELD_KEY || shoulder);
  let actors = _.map(f.actors, (a) => ({ ...a, hold: uses && a.hold === key && (!r.object?.owner || r.object.owner === a.char) ? key : a.hold && a.hold !== key ? a.hold : undefined }));
  if (uses && !actors.length && _.includes(r.who, r.focus)) actors = [{ char: r.focus, pose: poseOf(r), expr: exprOf(r), face: P.FACE_DEFAULT, depth: P.DEPTH_MID, hold: undefined }];
  const holder = _.find(actors, { char: r.object?.owner || r.focus }) || (actors.length === 1 ? actors[0] : null);
  if (uses && holder && !_.some(actors, (a) => a.hold === key) && actors.length) actors = _.map(actors, (a) => (a === holder ? { ...a, hold: key } : a));
  actors = _.map(actors, (a) => {
    if (!a.hold) return a;
    if (_.includes(P.LOW_POSES, a.pose)) return a;
    if (shoulder) return { ...a, pose: P.POSE_SHOULDER };
    return _.includes(P.HOLD_POSES, a.pose) ? a : { ...a, pose: _.includes(P.HOLD_POSES, P.ACTIONS[r.action]) ? P.ACTIONS[r.action] : P.POSE_HOLD };
  });
  const held = _.some(actors, (a) => a.hold === key);
  return { ...f, actors, shot: held && _.includes(P.HOLD_SHOTS, f.shot) ? P.SHOT_DEFAULT : f.shot };
};
const fitFeature = (f: PuppetFrame, r: PuppetRead, spots: PuppetSpot[]): PuppetFrame => {
  const key = r.object!.key;
  const actors = _.map(f.actors, (a) => {
    if (a.char !== r.focus && f.actors.length > 1) return a;
    const own = _.find(spots, { key: a.spot });
    const kind = P.POSE_KIND[a.pose] || P.SPOT_STAND;
    const sp = puppetFeatureSpot(
      spots.filter((s) => s.kind === kind || (kind === P.SPOT_STAND && s.kind === P.SPOT_DOOR)),
      a.support || key,
      kind,
    );
    if (!sp || (own && _.intersection(tokens(key), tokens(own.key)).length)) return a;
    return { ...a, spot: sp.key };
  });
  const shot = _.includes(P.SHOT_PROP, f.shot) ? (actors.length ? P.SHOT_DEFAULT : P.SHOT_ESTABLISHING) : f.shot;
  return { ...f, actors, shot, prop: null, propAt: null };
};
const fitWear = (f: PuppetFrame, r: PuppetRead): PuppetFrame => {
  const key = r.object!.key;
  const owner = r.object?.owner || (_.includes(r.who, r.focus) ? r.focus : r.who.length === 1 ? r.who[0] : undefined);
  const actors = _.map(f.actors, (a) => ({ ...a, wear: a.char === owner ? _.uniq([...(a.wear || []), key]) : (a.wear || []).filter((item) => item !== key) }));
  return { ...f, actors, prop: f.shot === P.SHOT_INSERT ? f.prop : null };
};
const fitObject = (f: PuppetFrame, r: PuppetRead, spots: PuppetSpot[] = []): PuppetFrame => {
  let out = { ...f };
  const ob = r.object;
  if (ob && puppetObjectClass(ob) === PA.SCENERY) out = fitFeature(out, r, spots);
  else if (ob && ob.mount === P.MOUNT_WEAR) out = fitWear(out, r);
  else if (ob && ob.mount === P.MOUNT_BODY) out = { ...out, shot: _.includes(P.CLOSE_SHOTS, out.shot) ? out.shot : P.SHOT_INSERT, prop: ob.key, actors: _.map(out.actors, (a) => (a.hold === ob.key ? _.omit(a, P.HOLD_FIELD) : a)) as PuppetFrame["actors"] };
  else {
    if (ob && out.shot === P.SHOT_OBJECT && ob.size < P.SIZE_SMALL && !_.some(out.actors, (a) => a.hold)) out.shot = P.SHOT_INSERT;
    if (out.shot !== P.SHOT_INSERT || ob?.mount === P.MOUNT_HELD_KEY || ob?.mount === P.MOUNT_SHOULDER) out = fitHands(out, r);
  }
  if (out.shot2) out.shot2 = fitObject(out.shot2, r, spots);
  return out;
};
const swapRuns = (lines: PuppetLine[], frames: Record<string, PuppetFrame>, cast: string[]): number => {
  let changed = 0;
  let run = 0;
  for (let i = 0; i < lines.length; i++) {
    const f = frames[lines[i].key];
    const prev = i ? frames[lines[i - 1].key] : null;
    run = f && prev && prev.shot === f.shot ? run + 1 : 0;
    const talk = !!lines[i].speaker && !!lines[i - 1]?.speaker;
    if (!f || run < P.SHOT_RUN_MAX || talk) continue;
    const candidate = P.SHOT_SWAP[f.shot] || P.SHOT_DEFAULT;
    const simultaneous = f.actors.length > 1 && f.actors.some((a) => a.support || a.target);
    const shot = simultaneous && !_.includes(P.BLOCKING_SHOTS, candidate) ? (f.shot === P.SHOT_DEFAULT ? P.SHOT_TWO : P.SHOT_DEFAULT) : candidate;
    const next = normalizePuppetFrame({ ...f, place: f.set, shot }, lines[i], cast);
    if (next.shot === f.shot) continue;
    frames[lines[i].key] = { ...next, shot2: f.shot2 };
    run = 0;
    changed++;
  }
  return changed;
};
interface PuppetComposeCtx {
  spots: (place: string | undefined) => PuppetSpot[];
  spotsText: (place: string) => string;
  framing: string;
}
export const composePuppetLines = async (lines: PuppetLine[], all: PuppetLine[], analysis: MotionStoryAnalysis, reads: Record<string, PuppetRead>, why: Record<string, string>, ctx: PuppetComposeCtx, o: PuppetRunOptions): Promise<Record<string, PuppetFrame>> => {
  const cast = _.map(analysis.cast, (c) => c.key);
  const castNames = castText(analysis);
  const genre = puppetGenreRules(analysis.videoGenre);
  const frames: Record<string, PuppetFrame> = {};
  const groups = groupsOf(lines, P.COMPOSE_PER_CALL);
  o.log(P.LOG_COMPOSE(lines.length, groups.length));
  await mapMotionAiPool(
    groups,
    async (group) => {
      const placeKeys = _.uniq(_.compact(_.map(group, (l) => reads[l.key]?.place)));
      const text = _.map(group, (l, i) => {
        const r = reads[l.key];
        const obj = r.object ? [r.object.key, r.object.size, r.object.mount].join(P.COMMA) : P.EMPTY;
        return [i, l.text, r.focus, r.who.join(P.COMMA), r.place || P.EMPTY, obj, r.action, r.emotion, l.speaker || P.EMPTY, JSON.stringify(r.states || []), JSON.stringify(puppetReadObjects(r)), why[l.key] ? P.FIX_PREFIX + why[l.key] : P.EMPTY].join(P.SEP);
      }).join(P.NL);
      const raw = await (o.ai || runMotionAi)(PR.COMPOSE({ genre, framing: ctx.framing, cast: castNames, places: _.map(placeKeys, ctx.spotsText).join(P.NL), previous: previousOf(all, group[0].key), lines: text }), P.ARTIFACT_COMPOSE, o.exec, o.signal, o.log).catch((e: any) => {
        if (o.signal?.aborted) throw e;
        o.log(P.LOG_COMPOSE_FAIL(String(e?.message || e)));
        return null;
      });
      for (const it of _.castArray(raw?.frames || [])) {
        const line = group[Number(it?.i)];
        if (!line || !reads[line.key]) continue;
        frames[line.key] = composeOf(it, reads[line.key], line, cast, ctx.spots(reads[line.key].place));
      }
    },
    puppetLanes(o.exec),
  );
  const missing = _.filter(lines, (l) => !frames[l.key]);
  if (missing.length) {
    o.log(P.LOG_COMPOSE_MISSING(missing.length));
    for (const l of missing) frames[l.key] = fitPuppetRead(readFrame(reads[l.key], l, cast), reads[l.key], ctx.spots(reads[l.key].place));
  }
  const ordered = _.filter(all, (l) => !!frames[l.key]);
  const swapped = swapRuns(ordered, frames, cast);
  if (swapped) o.log(P.LOG_SHOT_RUN(swapped));
  return frames;
};
