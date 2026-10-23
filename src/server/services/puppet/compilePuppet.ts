import _ from "lodash";
import { PUPPET as P, PUPPET_TYPES } from "../../../constants/motionPuppet.js";
import { puppetBeatLines, puppetSentenceKey } from "../../../lib/motionPuppet.js";
import { motionAutoSoundEvents } from "../../../lib/motionSound.js";
import type { MotionBeat, MotionShot, MotionVoiceClip } from "../../../types/motionVideo.js";
import type { PuppetCharacter, PuppetFrame, PuppetGen, PuppetKitSpec, PuppetProp, PuppetSet, PuppetStylePack } from "../../../types/motionPuppet.js";
import { readPuppet } from "./kitLibrary.js";
import { layoutPuppetFrame, puppetHorizon } from "./layout.js";
export interface PuppetTimedFrame extends Omit<PuppetFrame, "shot2" | "why"> {
  start: number;
  end: number;
  line?: string;
  cut?: boolean;
  speech?: number[][];
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
      set: f.set || beat.place,
      light: f.light || undefined,
      actors: f.actors,
      items: f.items,
      prop: f.prop || undefined,
      propMount: f.propMount,
      propAt: f.propAt || undefined,
      form: f.form,
      anchor: f.anchor,
      propX: f.propX,
      propRot: f.propRot,
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
  const lines = _.filter(puppetBeatLines(beat), (l) => !!gen.frames[l.key]);
  if (!lines.length) return [];
  const at = lineStarts(
    _.map(lines, (l) => l.key),
    start,
    end,
    clips,
  );
  const raw: PuppetTimedFrame[] = [];
  let prev = start;
  lines.forEach((l, i) => {
    const s = i === 0 ? start : _.clamp(at[i] - P.LEAD, prev, end);
    raw.push({ ...frameFields(gen.frames[l.key], beat, l.speaker), start: s, end, line: l.key });
    prev = s;
  });
  for (let i = 0; i < raw.length - 1; i++) raw[i].end = raw[i + 1].start;
  const merged: PuppetTimedFrame[] = [];
  for (const f of raw) {
    const last = _.last(merged);
    if (last && last.speaker === f.speaker && f.end - f.start < P.MIN_FRAME) last.end = f.end;
    else if (last && last.speaker === f.speaker && last.end - last.start < P.MIN_FRAME) merged[merged.length - 1] = { ...f, start: last.start };
    else merged.push(f);
  }
  const out: PuppetTimedFrame[] = [];
  for (const f of merged) {
    const second = f.line ? gen.frames[f.line]?.shot2 : null;
    if (second && f.end - f.start > P.SHOT2_MIN) {
      const mid = +((f.start + f.end) / 2).toFixed(3);
      out.push({ ...f, end: mid }, { ...frameFields(second, beat, f.speaker || undefined), start: mid, end: f.end, line: f.line });
    } else out.push(f);
  }
  return _.map(out, (f) => ({ ...f, start: +f.start.toFixed(3), end: +f.end.toFixed(3) }));
};
export const puppetLayoutFrames = (frames: PuppetTimedFrame[], gen: PuppetGen): PuppetTimedFrame[] => {
  const style = readPuppet<PuppetStylePack>(PUPPET_TYPES.STYLE, gen.styleId);
  if (!style) return frames;
  const heights = _.mapValues(gen.characters, (id) => readPuppet<PuppetCharacter>(PUPPET_TYPES.CHARACTER, id)?.height || 1);
  return _.map(frames, (f) => layoutPuppetFrame(f, { props: _.mapValues(gen.props, (id) => readPuppet<PuppetProp>(PUPPET_TYPES.PROP, id)), set: f.set && gen.sets[f.set] ? readPuppet<PuppetSet>(PUPPET_TYPES.SET, gen.sets[f.set]) : null, prop: f.prop && gen.props[f.prop] ? readPuppet<PuppetProp>(PUPPET_TYPES.PROP, gen.props[f.prop]) : null, body: style.body, heights }));
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
const setSpec = (s: PuppetSet) => ({ svg: s.svg, floorY: s.floorY, wallY: puppetHorizon(s), lights: s.lights, time: s.time });
export const puppetIsGhost = (c: PuppetCharacter): boolean => c.group === P.GHOST_GROUP || _.some([c.name, c.role, c.archetype], (v) => !!v && P.GHOST_NAME_RE.test(v));
export const puppetKitSpec = (gen: PuppetGen, motion: boolean): PuppetKitSpec | null => {
  const style = readPuppet<PuppetStylePack>(PUPPET_TYPES.STYLE, gen.styleId);
  if (!style) return null;
  const characters: PuppetKitSpec["characters"] = {};
  for (const [key, id] of _.toPairs(gen.characters)) {
    const c = readPuppet<PuppetCharacter>(PUPPET_TYPES.CHARACTER, id);
    if (c) characters[key] = { height: c.height, colors: c.colors, head: c.head, body: c.body, sprites: c.sprites, ...((gen.ghosts ? _.includes(gen.ghosts, key) : puppetIsGhost(c)) ? { ghost: true } : {}) };
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
  for (const [key, id] of _.toPairs(gen.props)) {
    const p = readPuppet<PuppetProp>(PUPPET_TYPES.PROP, id);
    if (p) props[key] = { svg: p.svg, base: p.base, size: p.size || p.height };
  }
  return { style: { body: style.body, face: style.face, line: style.line, vignette: style.vignette }, characters, sets, props, motion };
};
