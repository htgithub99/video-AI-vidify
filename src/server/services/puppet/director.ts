import _ from "lodash";
import { PUPPET as P, PUPPET_GENRES, PUPPET_GENRE_ALIAS, PUPPET_GENRE_DEFAULT, PUPPET_PROMPTS as PR } from "../../../constants/motionPuppet.js";
import { puppetSentenceKey, type PuppetLine } from "../../../lib/motionPuppet.js";
import type { MotionStoryAnalysis } from "../../../types/motionVideo.js";
import type { PuppetFrame, PuppetFrameActor, PuppetObject, PuppetPlace, PuppetRead, PuppetSpot } from "../../../types/motionPuppet.js";
import { mapMotionAiPool, runMotionAi } from "../motionStoryService.js";
import { puppetLanes } from "./kitDraw.js";
import type { PuppetRunOptions } from "./stylePack.js";

const pick = (v: unknown, list: readonly string[], d: string): string => (_.isString(v) && list.includes(v) ? v : d);
const keyOf = (v: unknown): string | null => {
  const k = _.snakeCase(_.toString(v || P.EMPTY));
  return P.KEY_RE.test(k) ? k : null;
};
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
const castText = (analysis: MotionStoryAnalysis): string => _.map(analysis.cast, (c) => [c.key, c.name, _.truncate(c.look || c.description || P.EMPTY, { length: 90 })].join(P.SEP)).join(P.NL);

const actorOf = (raw: any, cast: string[]): PuppetFrameActor | null => {
  const c = _.toString(raw?.char);
  if (!isCast(cast, c)) return null;
  return _.omitBy({ char: c, pose: pick(raw?.pose, P.POSES, P.POSE_DEFAULT), expr: pick(raw?.expr, P.EXPRS, P.EXPR_DEFAULT), face: pick(raw?.face, P.FACES, P.FACE_DEFAULT), x: _.isFinite(Number(raw?.x)) ? _.clamp(Number(raw.x), 0.05, 0.95) : undefined, spot: keyOf(raw?.spot) || undefined, depth: pick(raw?.depth, P.DEPTHS, P.DEPTH_MID) }, _.isNil) as PuppetFrameActor;
};

export const normalizePuppetFrame = (raw: any, line: PuppetLine, cast: string[], nested = false): PuppetFrame => {
  let actors = _.take(_.uniqBy(_.compact(_.map(_.castArray(raw?.actors || []), (a) => actorOf(a, cast))), (a) => a.char), P.ACTOR_MAX);
  let shot = pick(raw?.shot, P.SHOTS, P.SHOT_DEFAULT);
  const prop = keyOf(raw?.prop);
  const speaker = line.speaker && isCast(cast, line.speaker) ? line.speaker : null;
  if (_.includes(P.SHOT_PROP, shot) && !prop) shot = actors.length ? P.SHOT_DEFAULT : P.SHOT_ESTABLISHING;
  if (_.includes(P.SHOT_ONE, shot) && !actors.length) shot = speaker ? shot : P.SHOT_ESTABLISHING;
  if (_.includes(P.SHOT_NOBODY, shot)) actors = [];
  if (speaker && !_.includes(P.SHOT_NOBODY, shot) && !_.some(actors, { char: speaker }) && shot !== P.SHOT_INSERT) actors = [{ char: speaker, pose: P.POSE_TALK, expr: P.EXPR_DEFAULT, face: P.FACE_DEFAULT, depth: P.DEPTH_MID }, ...actors].slice(0, P.ACTOR_MAX);
  if (speaker) actors = _.map(actors, (a) => (a.char === speaker && a.pose === P.POSE_DEFAULT ? { ...a, pose: P.POSE_TALK } : a));
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
  const place = keyOf(raw?.place);
  const frame: PuppetFrame = {
    shot,
    set: place || line.place || undefined,
    light: pick(raw?.light, P.LIGHTS, P.EMPTY) || null,
    actors,
    prop: prop || null,
    propAt: keyOf(raw?.propAt) || null,
    propX: _.isFinite(Number(raw?.propX)) ? _.clamp(Number(raw.propX), 0.1, 0.9) : undefined,
    overlays: _.take(_.filter(_.castArray(raw?.overlays || []), (x) => _.includes(P.OVERLAYS, x)), 3) as string[],
    camera: { move: pick(raw?.camera?.move, P.MOVES, P.MOVE_DEFAULT) },
    speaker,
  };
  if (!nested && raw?.shot2 && _.isObject(raw.shot2)) frame.shot2 = normalizePuppetFrame({ place, light: raw.light, prop: raw.prop, overlays: raw.overlays, ...raw.shot2 }, line, cast, true);
  return frame;
};

export interface PuppetReadResult { reads: Record<string, PuppetRead>; newPlaces: Record<string, PuppetPlace>; }

const objectOf = (raw: any, line: PuppetLine): PuppetObject | null => {
  const word = _.trim(_.toString(raw?.word));
  const key = keyOf(raw?.key);
  if (!word || !key || !wordIn(word, line.text)) return null;
  return { word, key, size: _.clamp(Number(raw?.size) || P.SIZE_DEFAULT, P.SIZE_MIN, P.SIZE_MAX), mount: pick(raw?.mount, P.MOUNTS, P.MOUNT_FLOOR), note: _.truncate(word + P.DASH + line.text, { length: 160 }) };
};

const readOf = (raw: any, line: PuppetLine, cast: string[], places: Record<string, PuppetPlace>, fresh: Record<string, PuppetPlace>): { read: PuppetRead; bad: boolean } => {
  let who = _.uniq(_.filter(_.map(_.castArray(raw?.who || []), _.toString), (c) => isCast(cast, c)));
  if (line.speaker && isCast(cast, line.speaker) && !who.includes(line.speaker)) who = [line.speaker, ...who];
  who = _.take(who, P.ACTOR_MAX);
  const object = raw?.object ? objectOf(raw.object, line) : null;
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
    object,
    action: pick(raw?.action, _.keys(P.ACTIONS), P.ACTION_DEFAULT),
    emotion: pick(raw?.emotion, P.EXPRS, P.EXPR_DEFAULT),
    light: pick(raw?.light, P.LIGHTS, P.EMPTY) || null,
    overlays: _.take(_.filter(_.castArray(raw?.overlays || []), (x) => _.includes(P.OVERLAYS, x)), 3) as string[],
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
    const raw = await (o.ai || runMotionAi)(PR.READ({ story, cast: castText(analysis), places: placeText, previous: previousOf(all, group[0].key), lines: text }), P.ARTIFACT_READ, o.mainExec || o.exec, o.signal, o.log).catch((e: any) => {
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
    return [...bad, ..._.map(_.filter(group, (l) => !result.reads[l.key]), (l) => l.key)];
  };
  const groups = groupsOf(lines, P.READ_PER_CALL);
  o.log(P.LOG_READ(lines.length, groups.length));
  const retry = _.flatten(await mapMotionAiPool(groups, (g) => ask(g, why), puppetLanes(o.mainExec || o.exec)));
  if (retry.length && !o.signal?.aborted) {
    o.log(P.LOG_READ_RETRY(retry.length));
    const again = _.filter(lines, (l) => retry.includes(l.key));
    const notes = _.fromPairs(_.map(again, (l) => [l.key, _.compact([why[l.key], P.WHY_READ]).join(P.SEP)]));
    await mapMotionAiPool(groupsOf(again, P.READ_PER_CALL), (g) => ask(g, notes), puppetLanes(o.mainExec || o.exec));
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
    const shot = _.toString(x?.shot);
    const needs = !_.includes(P.SHOT_NOBODY, shot) && shot !== P.SHOT_INSERT;
    const missing = needs && !actors.length ? _.map(_.filter(r.who, (c) => !listed.has(c)), (c) => ({ char: c, pose: poseOf(r), expr: exprOf(r) })) : [];
    return {
      ...x,
      place: r.place,
      light: r.light,
      prop: r.object?.key || null,
      overlays: r.overlays,
      propAt: keys.has(_.toString(x?.propAt)) ? x.propAt : null,
      actors: _.map([...actors, ...missing], (a: any) => {
        const spot = _.find(spots, { key: _.toString(a?.spot) });
        const pose = _.includes(P.POSES, a?.pose) ? a.pose : a.char === r.focus ? poseOf(r) : P.POSE_DEFAULT;
        const fit = spot && P.POSE_KIND[spot.kind] && !_.includes(P.LOW_POSES, pose) ? spot.kind : pose;
        return { ...a, spot: spot?.key, pose: fit, expr: _.includes(P.EXPRS, a?.expr) ? a.expr : exprOf(r) };
      }),
    };
  };
  const frame = normalizePuppetFrame({ ...fill(raw), shot2: raw?.shot2 && _.isObject(raw.shot2) ? fill(raw.shot2) : null }, line, cast);
  return fitObject(frame, r);
};

const fitObject = (f: PuppetFrame, r: PuppetRead): PuppetFrame => {
  const out = { ...f };
  if (r.object && out.shot === P.SHOT_OBJECT && r.object.size < P.SIZE_SMALL) out.shot = P.SHOT_INSERT;
  if (out.shot2) out.shot2 = fitObject(out.shot2, r);
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
    const next = normalizePuppetFrame({ ...f, place: f.set, shot: P.SHOT_SWAP[f.shot] || P.SHOT_DEFAULT }, lines[i], cast);
    if (next.shot === f.shot) continue;
    frames[lines[i].key] = { ...next, shot2: f.shot2 };
    run = 0;
    changed++;
  }
  return changed;
};

interface PuppetComposeCtx { spots: (place: string | undefined) => PuppetSpot[]; spotsText: (place: string) => string; framing: string; }

export const composePuppetLines = async (lines: PuppetLine[], all: PuppetLine[], analysis: MotionStoryAnalysis, reads: Record<string, PuppetRead>, why: Record<string, string>, ctx: PuppetComposeCtx, o: PuppetRunOptions): Promise<Record<string, PuppetFrame>> => {
  const cast = _.map(analysis.cast, (c) => c.key);
  const castNames = _.map(analysis.cast, (c) => [c.key, c.name].join(P.SEP)).join(P.NL);
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
        return [i, l.text, r.focus, r.who.join(P.COMMA), r.place || P.EMPTY, obj, r.action, r.emotion, l.speaker || P.EMPTY, why[l.key] ? P.FIX_PREFIX + why[l.key] : P.EMPTY].join(P.SEP);
      }).join(P.NL);
      const raw = await (o.ai || runMotionAi)(PR.COMPOSE({ genre, framing: ctx.framing, cast: castNames, places: _.map(placeKeys, ctx.spotsText).join(P.NL), previous: previousOf(all, group[0].key), lines: text }), P.ARTIFACT_COMPOSE, o.mainExec || o.exec, o.signal, o.log).catch((e: any) => {
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
    puppetLanes(o.mainExec || o.exec),
  );
  const missing = _.filter(lines, (l) => !frames[l.key]);
  if (missing.length) {
    o.log(P.LOG_COMPOSE_MISSING(missing.length));
    for (const l of missing) frames[l.key] = readFrame(reads[l.key], l, cast);
  }
  const ordered = _.filter(all, (l) => !!frames[l.key]);
  const swapped = swapRuns(ordered, frames, cast);
  if (swapped) o.log(P.LOG_SHOT_RUN(swapped));
  return frames;
};
