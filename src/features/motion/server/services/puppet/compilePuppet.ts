import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { puppetPropRestRotation } from "../../../../../lib/motionPuppetAssets.js";
import { MOTION_APPEARANCE as APPEARANCE } from "../../../../../constants/motionAppearance.js";
import { MOTION_PACK as PACK } from "../../../../../constants/motionPack.js";
import { puppetAppearanceKey, puppetCharacterAppearance, puppetReadAppearances, mergePuppetAppearances } from "../../../../../lib/motionAppearance.js";
import type { PuppetAppearance, PuppetFrameActor } from "../../../../../types/motionPuppet.js";
import { MOTION_STAGE_GEOMETRY as G } from "../../../../../constants/motionStageGeometry.js";
import { puppetReadObjects } from "../../../../../lib/motionReadObjects.js";
import _ from "lodash";
import { PUPPET as P, PUPPET_TYPES } from "../../../../../constants/motionPuppet.js";
import { puppetBeatLines, puppetSentenceKey, puppetFrameLook, type PuppetLine } from "../../../../../lib/motionPuppet.js";
import { motionAutoSoundEvents } from "../../../../../lib/motionSound.js";
import type { MotionBeat, MotionShot, MotionVoiceClip } from "../../../../../types/motionVideo.js";
import type { PuppetCharacter, PuppetFrame, PuppetGen, PuppetKitSpec, PuppetProp, PuppetSet, PuppetStylePack } from "../../../../../types/motionPuppet.js";
import { readPuppet, puppetSetForLight } from "./kitLibrary.js";
import { layoutPuppetFrame, puppetHorizon } from "./layout.js";
import { MOTION_STORYBOARD as SB } from "../../../../../constants/motionStoryboard.js";
import { puppetSourceText, puppetStoryboardCovers } from "../../../../../lib/motionStoryboard.js";
import { puppetWordTimeline } from "./storyboardTiming.js";
import { repairPuppetFrameReferences } from "./frameReferences.js";
import { MOTION_VISUAL_CONTRACT as V } from "../../../../../constants/motionVisualContract.js";
import { withPuppetGenPack } from "./packRuntime.js";
import { assertPuppetSceneSelection } from "./packSelectionContract.js";
export interface PuppetTimedFrame extends Omit<PuppetFrame, "shot2" | "why"> {
  start: number;
  end: number;
  line?: string;
  lines?: string[];
  cut?: boolean;
  speech?: number[][];
  visualId?: string;
  visualStart?: number;
  visualEnd?: number;
  narration?: string;
  timing?: "words" | "estimated";
}
const clipTimer = (clips: MotionVoiceClip[]) => {
  const segs: { off: number; len: number; clip: MotionVoiceClip }[] = [];
  let text: string = P.EMPTY;
  for (const clip of _.sortBy(clips, (c) => c.start)) {
    const k = puppetSentenceKey(clip.text);
    if (!k) continue;
    if (text) text += P.SPACE;
    segs.push({ off: text.length, len: k.length, clip });
    text += k;
  }
  const timeAt = (pos: number): number => {
    const seg = _.findLast(segs, (s) => s.off <= pos) || segs[0];
    const f = _.clamp((pos - seg.off) / Math.max(1, seg.len), 0, 1);
    const words = seg.clip.words;
    if (words?.length) return seg.clip.start + words[Math.min(words.length - 1, Math.floor(f * words.length))][0];
    return seg.clip.start + f * (seg.clip.end - seg.clip.start);
  };
  return { text, timeAt, ok: segs.length > 0 };
};
const lineStarts = (keys: string[], start: number, end: number, clips: MotionVoiceClip[]): number[] => {
  const total = _.sumBy(keys, (k) => Math.max(1, k.length));
  let acc = 0;
  const even = _.map(keys, (k) => {
    const t = start + ((end - start) * acc) / Math.max(1, total);
    acc += Math.max(1, k.length);
    return t;
  });
  const timer = clipTimer(clips);
  if (!timer.ok) return even;
  let cursor = 0;
  return _.map(keys, (k, i) => {
    const at = timer.text.indexOf(k, cursor);
    if (at < 0) return even[i];
    cursor = at + k.length;
    return timer.timeAt(at);
  });
};
const frameFields = (f: PuppetFrame, beat: MotionBeat, speaker?: string): Omit<PuppetTimedFrame, "start" | "end"> =>
  _.omitBy(
    {
      shot: f.shot,
      choiceId: f.choiceId,
      layoutLocked: f.layoutLocked,
      blocking: f.blocking,
      contacts: f.contacts,
      set: f.set || beat.place,
      light: f.light || undefined,
      actors: f.actors,
      items: f.items,
      prop: f.prop || undefined,
      propMount: f.propMount,
      propSupport: f.propSupport,
      propAt: f.propAt || undefined,
      form: f.form,
      anchor: f.anchor,
      propX: f.propX,
      propY: f.propY,
      propDepthY: f.propDepthY,
      propParent: f.propParent,
      propH: f.propH,
      propRot: f.propRot,
      effectSource: f.effectSource,
      effectTarget: f.effectTarget,
      effectMode: f.effectMode,
      smokeX: f.smokeX,
      smokeY: f.smokeY,
      inset: f.inset,
      set2: f.set2,
      light2: f.light2,
      overlays: f.overlays?.length ? f.overlays : undefined,
      camera: f.camera,
      speaker: speaker || undefined,
    },
    _.isNil,
  ) as Omit<PuppetTimedFrame, "start" | "end">;
export const puppetBeatFrames = (beat: MotionBeat, gen: PuppetGen, start: number, end: number, clips: MotionVoiceClip[]): PuppetTimedFrame[] => {
  if (gen.storyboard) {
    const source = puppetBeatLines(beat, gen.narratorKey);
    const byKey = new Map(source.map((line) => [line.key, line]));
    const units = gen.storyboard.units.map((unit) => ({ ...unit, sources: unit.sources.filter((range) => byKey.has(range.line)) })).filter((unit) => unit.sources.length);
    if (!puppetStoryboardCovers({ ...gen.storyboard, units }, source)) throw new Error(SB.STALE);
    const times = puppetWordTimeline(source, clips, start, end);
    const result: PuppetTimedFrame[] = [];
    for (const unit of units) {
      const frame = gen.frames[unit.key];
      if (!frame) throw new Error(SB.STALE);
      for (const range of unit.sources) {
        const line = byKey.get(range.line)!;
        const word = times.get(line.key)![range.from];
        const from = result.length ? word.at : start;
        const previous = result[result.length - 1];
        const narration = puppetSourceText(line, range);
        if (previous?.visualId === unit.key && previous.speaker === line.speaker) {
          previous.narration += P.SPACE + narration;
          if (word.timing === RT_SERVER.ESTIMATED) previous.timing = word.timing;
          continue;
        }
        if (previous) {
          if (from <= previous.start || from >= end) throw new Error(SB.TIMING_INVALID);
          previous.end = from;
        }
        result.push({ ...frameFields(frame, beat, line.speaker), start: from, end, line: unit.key, lines: [unit.key], visualId: unit.key, narration, timing: word.timing });
      }
    }
    return result.map((frame) => ({ ...frame, start: +frame.start.toFixed(3), end: +frame.end.toFixed(3) }));
  }
  const legacy = puppetBeatLines({ ...beat, utterances: undefined });
  const frameOf = (line: PuppetLine): PuppetFrame | undefined => {
    const key = puppetSentenceKey(line.text);
    const old = legacy.find((item) => puppetSentenceKey(item.text).includes(key) && gen.frames[puppetSentenceKey(item.text)]);
    return gen.frames[line.key] || gen.frames[key] || (old ? gen.frames[puppetSentenceKey(old.text)] : undefined);
  };
  const lines = _.filter(puppetBeatLines(beat, gen.narratorKey), (l) => !!frameOf(l));
  const byKey = new Map(lines.map((line) => [line.key, line]));
  const secondOf = (key?: string): PuppetFrame | null | undefined => (key && byKey.has(key) ? frameOf(byKey.get(key)!)?.shot2 : null);
  if (!lines.length) return [];
  const at = lineStarts(
    _.map(lines, (l) => puppetSentenceKey(l.text)),
    start,
    end,
    clips,
  );
  const raw: PuppetTimedFrame[] = [];
  let prev = start;
  lines.forEach((l, i) => {
    const s = i === 0 ? start : _.clamp(at[i] - P.LEAD, prev, end);
    raw.push({ ...frameFields(frameOf(l)!, beat, l.speaker), start: s, end, line: l.key, lines: [l.key] });
    prev = s;
  });
  for (let i = 0; i < raw.length - 1; i++) raw[i].end = raw[i + 1].start;
  const merged: PuppetTimedFrame[] = [];
  for (const f of raw) {
    const last = _.last(merged);
    if (last && last.speaker === f.speaker && puppetFrameLook(last) === puppetFrameLook(f) && _.isEqual(secondOf(last.line), secondOf(f.line)) && (f.end - f.start < P.MIN_FRAME || last.end - last.start < P.MIN_FRAME)) {
      last.end = f.end;
      last.lines = [...(last.lines || []), ...(f.lines || [])];
    } else merged.push(f);
  }
  const out: PuppetTimedFrame[] = [];
  for (const f of merged) {
    const second = secondOf(f.line);
    if (second && f.end - f.start > P.SHOT2_MIN) {
      const mid = +((f.start + f.end) / 2).toFixed(3);
      out.push({ ...f, end: mid }, { ...frameFields(second, beat, f.speaker || undefined), start: mid, end: f.end, line: f.line });
    } else out.push(f);
  }
  return _.map(out, (f) => ({ ...f, start: +f.start.toFixed(3), end: +f.end.toFixed(3) }));
};
export const linkPuppetVisualFrames = (shots: MotionShot[]): void => {
  let group: PuppetTimedFrame[] = [];
  const finish = () => {
    for (const frame of group) {
      frame.visualStart = group[0].start;
      frame.visualEnd = group[group.length - 1].end;
    }
    group = [];
  };
  for (const shot of shots) {
    if (shot.template !== P.TEMPLATE) {
      finish();
      continue;
    }
    const frames = (shot.params as { frames?: PuppetTimedFrame[] })?.frames || [];
    for (const frame of frames) {
      const previous = group[group.length - 1];
      if (!frame.visualId || (previous && (previous.visualId !== frame.visualId || Math.abs(previous.end - frame.start) > SB.TIME_EPSILON))) finish();
      if (frame.visualId) group.push(frame);
    }
  }
  finish();
};
export const applyPuppetShotAppearances = (shots: MotionShot[], gen: PuppetGen): void => {
  const history = new Map<string, Map<string, PuppetAppearance>>();
  for (const shot of shots) {
    if (shot.template !== P.TEMPLATE) continue;
    for (const frame of (shot.params as { frames?: PuppetTimedFrame[] }).frames || []) {
      const read = gen.reads?.[frame.visualId || frame.line || P.EMPTY];
      if (!read) continue;
      const timeline = read.visual?.timeline || P.EMPTY;
      const known = history.get(timeline) || new Map<string, PuppetAppearance>();
      for (const [key, appearance] of puppetReadAppearances(read)) known.set(key, mergePuppetAppearances(known.get(key), appearance));
      frame.actors = frame.actors.map((actor) => {
        const appearance = known.get(actor.char);
        return appearance ? { ...actor, appearance, look: puppetAppearanceKey(appearance) } : actor;
      });
      history.set(timeline, known);
    }
  }
};
export const puppetLayoutFrames = (frames: PuppetTimedFrame[], gen: PuppetGen): PuppetTimedFrame[] => {
  return withPuppetGenPack(gen, () => puppetLayoutFramesFromAssets(frames, gen));
};
const puppetLayoutFramesFromAssets = (frames: PuppetTimedFrame[], gen: PuppetGen): PuppetTimedFrame[] => {
  const style = readPuppet<PuppetStylePack>(PUPPET_TYPES.STYLE, gen.styleId);
  if (!style) return frames;
  const heights = _.mapValues(gen.characters, (id) => readPuppet<PuppetCharacter>(PUPPET_TYPES.CHARACTER, id)?.height || 1);
  return _.map(frames, (frame) => {
    const selectionKey = frame.visualId || frame.line;
    if (selectionKey) assertPuppetSceneSelection(gen, selectionKey);
    const f = repairPuppetFrameReferences(frame, gen, frame.visualId || frame.line);
    if (gen.selectionVersion !== undefined) return f;
    const base = f.set && gen.sets[f.set] ? readPuppet<PuppetSet>(PUPPET_TYPES.SET, gen.sets[f.set]) : null;
    if (f.set && !base) throw new Error(V.FRAME_SET_MISSING(f.visualId || f.line || P.EMPTY, f.set));
    return layoutPuppetFrame(f, { props: _.mapValues(gen.props, (id) => readPuppet<PuppetProp>(PUPPET_TYPES.PROP, id)), set: base ? puppetSetForLight(base, f.light) : null, prop: f.prop && gen.props[f.prop] ? readPuppet<PuppetProp>(PUPPET_TYPES.PROP, gen.props[f.prop]) : null, body: style.body, heights });
  });
};
export const puppetSceneShot = (beat: MotionBeat, gen: PuppetGen, start: number, end: number, clips: MotionVoiceClip[], speech?: Record<string, number[][]>, soundFlag = false): MotionShot | null => {
  const frames = puppetLayoutFrames(puppetBeatFrames(beat, gen, start, end, clips), gen).map((frame) => ({ ...frame, speech: (frame.speaker ? speech?.[frame.speaker] || [] : []).map(([from, to]) => [Math.max(frame.start, start + from), Math.min(frame.end, start + to)]).filter(([from, to]) => Number.isFinite(from) && Number.isFinite(to) && to > from) }));
  if (!frames.length) return null;
  const chars = _.uniq(_.flatMap(frames, (f) => _.map(f.actors, (a) => a.char)));
  const props = _.uniq(_.compact(_.flatMap(frames, (f) => [f.prop, ...(f.items || []).map((it) => it.prop), ...f.actors.flatMap((a) => [a.hold, ...(a.wear || [])])])));
  const params = {
    frames,
    location: beat.place,
    time: beat.time,
    weather: beat.weather,
    actors: _.map(chars, (c) => ({ cast: c, at: P.ACTOR_AT })),
    props: _.map(props, (k) => ({ name: k })),
    ...(soundFlag ? {} : { soundEvents: motionAutoSoundEvents([beat.narration, beat.action, ..._.map(frames, (f) => _.compact([f.shot, f.prop, ..._.map(f.actors, (a) => a.pose), f.light, ...(f.overlays || [])]).join(P.SPACE))]) }),
    ...(speech && !_.isEmpty(speech) ? { speech } : {}),
    soundBeatId: beat.id,
    beatDur: +(end - start).toFixed(3),
    tOffset: 0,
  };
  return { id: beat.id, start: +start.toFixed(3), end: +end.toFixed(3), template: P.TEMPLATE, params };
};
const setSpec = (s: PuppetSet) => ({ svg: s.svg, floorY: s.floorY, wallY: puppetHorizon(s), lights: s.lights, time: s.time, framingBounds: s.framingBounds });
export const puppetIsGhost = (c: PuppetCharacter): boolean => c.group === P.GHOST_GROUP || _.some([c.name, c.role, c.archetype], (v) => !!v && P.GHOST_NAME_RE.test(v));
export const puppetKitSpec = (gen: PuppetGen, motion: boolean, actors: PuppetFrameActor[] = []): PuppetKitSpec | null => {
  return withPuppetGenPack(gen, () => puppetKitSpecFromAssets(gen, motion, actors));
};
const puppetKitSpecFromAssets = (gen: PuppetGen, motion: boolean, actors: PuppetFrameActor[]): PuppetKitSpec | null => {
  const style = readPuppet<PuppetStylePack>(PUPPET_TYPES.STYLE, gen.styleId);
  if (!style) return null;
  const characters: PuppetKitSpec["characters"] = {};
  const appearances = [...Object.values(gen.reads || {}).flatMap((read) => [...puppetReadAppearances(read)].map(([char, appearance]) => ({ char, appearance }))), ...actors.filter((actor) => actor.appearance)];
  const characterSpec = (c: PuppetCharacter) => ({ height: c.height, colors: c.colors, head: c.head, body: c.body, sprites: c.sprites });
  for (const [key, id] of _.toPairs(gen.characters)) {
    const c = readPuppet<PuppetCharacter>(PUPPET_TYPES.CHARACTER, id);
    if (c) {
      const looks = Object.fromEntries(appearances.filter((actor) => actor.char === key && actor.appearance).map((actor) => [puppetAppearanceKey(actor.appearance!), characterSpec(puppetCharacterAppearance(c, actor.appearance!))]));
      characters[key] = { ...characterSpec(c), ...(Object.keys(looks).length ? { looks } : {}), ...((gen.ghosts ? _.includes(gen.ghosts, key) : puppetIsGhost(c)) ? { ghost: true } : {}) };
    }
  }
  const sets: PuppetKitSpec["sets"] = {};
  for (const [place, id] of _.toPairs(gen.sets)) {
    const s = readPuppet<PuppetSet>(PUPPET_TYPES.SET, id);
    if (!s) continue;
    const variants: Record<string, string> = {};
    for (const [time, vid] of _.toPairs(s.variants || {})) {
      const v = readPuppet<PuppetSet>(PUPPET_TYPES.SET, vid);
      if (!v) continue;
      const vk = place + P.VARIANT_SEP + time;
      sets[vk] = setSpec(v);
      variants[time] = vk;
    }
    sets[place] = { ...setSpec(s), ...(_.size(variants) ? { variants } : {}) };
  }
  const props: PuppetKitSpec["props"] = {};
  const objects = Object.values(gen.reads || {}).flatMap(puppetReadObjects);
  for (const [key, id] of _.toPairs(gen.props)) {
    const p = readPuppet<PuppetProp>(PUPPET_TYPES.PROP, id);
    if (p) {
      const object = objects.find((object) => object.key === key);
      const restRotation = object && puppetPropRestRotation(object, p);
      props[key] = { svg: p.svg, base: p.base, size: p.size || p.height, emitter: p.emitter, grip: p.grip, attachment: p.attachment, ...(p.requirements?.includes(G.BODY_COVER_FEATURE) ? { bodyCover: true } : {}), ...(restRotation !== undefined ? { restRotation } : {}) };
    }
  }
  return { style: { body: style.body, face: style.face, line: style.line, vignette: style.vignette, ...(Object.values(PACK.PRESETS).includes(gen.styleId) ? { atmosphere: APPEARANCE.PROFILE } : {}) }, characters, sets, props, motion };
};
