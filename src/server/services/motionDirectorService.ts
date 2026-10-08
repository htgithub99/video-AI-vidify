import _ from "lodash";
import {
  MOTION_TEMPLATE_C_3,
  MOTION_TEMPLATE_JOIN_SPACE,
  MOTION_TEMPLATE_P,
  MOTION_TEXT_BG3D,
  MOTION_TEXT_CAMERA,
  MOTION_TEXT_CAMERAS,
  MOTION_TEXT_CHAPTER,
  MOTION_TEXT_CINEMA,
  MOTION_TEXT_CLOCK,
  MOTION_TEXT_COUNTER,
  MOTION_TEXT_CUT,
  MOTION_TEXT_DIP,
  MOTION_TEXT_DOCUMENTARY,
  MOTION_TEXT_EN,
  MOTION_TEXT_ENDING,
  MOTION_TEXT_FADE,
  MOTION_TEXT_FFB070,
  MOTION_TEXT_GEN3D,
  MOTION_TEXT_HEADLINE,
  MOTION_TEXT_HIT,
  MOTION_TEXT_KICH_BAN_CHUA_CO_BEAT_NAO_2,
  MOTION_TEXT_LOCATION,
  MOTION_TEXT_MAP,
  MOTION_TEXT_NHAT_BAO,
  MOTION_TEXT_QUOTE,
  MOTION_TEXT_SCENE,
  MOTION_TEXT_SO_DO_MINH_HOA_2,
  MOTION_TEXT_STAGING,
  MOTION_TEXT_STATS,
  MOTION_TEXT_SYMBOL_13,
  MOTION_TEXT_TAG,
  MOTION_TEXT_TIMELINE,
  MOTION_TEXT_TITLE,
} from "../../constants/motionRuntime.js";
import { MOTION_STORY_CONFIG } from "../../constants/motionVideo.js";
import type { MotionBeat, MotionGenState, MotionShot, MotionSpec, MotionStoryAnalysis, MotionStoryScript } from "../../types/motionVideo.js";
const NON_SCENE_TRANSITION_IN = 0.55;
const GRAPHIC_HOLD = [MOTION_TEXT_TITLE, MOTION_TEXT_QUOTE, MOTION_TEXT_STATS, MOTION_TEXT_COUNTER, MOTION_TEXT_MAP, MOTION_TEXT_TIMELINE, MOTION_TEXT_HEADLINE];
const countUnits = (text: string): number => _.size(_.compact(_.toString(text).split(/\s+/)));
export const estimateBeatSeconds = (beat: MotionBeat, language: string): number => {
  const rate = language === MOTION_TEXT_EN ? MOTION_STORY_CONFIG.EN_WORDS_PER_SECOND : MOTION_STORY_CONFIG.VI_SYLLABLES_PER_SECOND;
  const pauses = (beat.narration.match(/[,.;:!?…]/g) || []).length * 0.18;
  return Math.max(1.2, countUnits(beat.narration) / rate + pauses);
};
export const computeBeatTimeline = (beats: MotionBeat[], durations: number[]): { starts: number[]; ends: number[]; total: number } => {
  const starts: number[] = [];
  const ends: number[] = [];
  let cursor = beats[0]?.visual === MOTION_TEXT_TITLE ? 0.9 : 0.5;
  beats.forEach((b, i) => {
    starts.push(cursor);
    const d = Math.max(0.6, durations[i] || 1);
    ends.push(cursor + d);
    const next = beats[i + 1];
    const gap = !next ? 0 : next.chapterId !== b.chapterId || next.visual === MOTION_TEXT_CHAPTER ? MOTION_STORY_CONFIG.CHAPTER_GAP_SECONDS : MOTION_STORY_CONFIG.BEAT_GAP_SECONDS;
    const hold = _.includes(GRAPHIC_HOLD, b.visual) ? 0.45 : 0;
    cursor += d + gap + hold;
  });
  const tail = MOTION_STORY_CONFIG.TAIL_SECONDS + (_.last(beats)?.visual === MOTION_TEXT_ENDING ? 1.6 : 0);
  return { starts, ends, total: (_.last(ends) || 3) + tail };
};
const splitSubtitle = (text: string, max: number): string[] => {
  const sentences = _.compact(_.map(_.toString(text).match(/[^.!?…]+[.!?…]*["”»)]*/g) || [text], _.trim));
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length <= max) {
      out.push(s);
      continue;
    }
    const parts = _.compact(_.map(s.split(/(?<=[,;:–—])\s+/), _.trim));
    let cur = "";
    for (const p of parts) {
      if ((cur + MOTION_TEXT_SYMBOL_13 + p).trim().length > max && cur) {
        out.push(cur.trim());
        cur = p;
      } else cur = MOTION_TEMPLATE_JOIN_SPACE(`${cur}`, `${p}`);
    }
    if (cur.trim()) {
      const words = cur.trim().split(/\s+/);
      let line = "";
      for (const w of words) {
        if ((line + MOTION_TEXT_SYMBOL_13 + w).trim().length > max && line) {
          out.push(line.trim());
          line = w;
        } else line = MOTION_TEMPLATE_JOIN_SPACE(`${line}`, `${w}`);
      }
      if (line.trim()) out.push(line.trim());
    }
  }
  return out;
};
const buildSubtitles = (beat: MotionBeat, start: number, end: number): { start: number; end: number; text: string }[] => {
  const pieces = splitSubtitle(beat.narration, MOTION_STORY_CONFIG.SUBTITLE_MAX_CHARS);
  const weights = _.map(pieces, (p) => countUnits(p) + (/[,.;:!?…]$/.test(p) ? 0.8 : 0));
  const total = _.sum(weights) || 1;
  let t = start;
  return _.map(pieces, (text, i) => {
    const d = ((end - start) * weights[i]) / total;
    const s = { start: +t.toFixed(3), end: +(t + d).toFixed(3), text };
    t += d;
    return s;
  });
};
const pickTransition = (beat: MotionBeat, prev: MotionBeat | undefined, index: number, gen?: MotionGenState): { type: string; duration: number } => {
  if (index === 0) return { type: MOTION_TEXT_FADE, duration: 0.9 };
  if (!prev) return { type: MOTION_TEXT_CUT, duration: 0 };
  if (beat.visual === MOTION_TEXT_CHAPTER || beat.chapterId !== prev.chapterId) return { type: MOTION_TEXT_DIP, duration: 0.9 };
  if (beat.visual === MOTION_TEXT_ENDING) return { type: MOTION_TEXT_FADE, duration: 1.2 };
  const isScene = beat.visual === MOTION_TEXT_SCENE,
    wasScene = prev.visual === MOTION_TEXT_SCENE;
  if (!isScene || !wasScene) return { type: MOTION_TEXT_FADE, duration: NON_SCENE_TRANSITION_IN };
  const locA = _.get(gen, [MOTION_TEXT_STAGING, prev.id, MOTION_TEXT_LOCATION]) || prev.place,
    locB = _.get(gen, [MOTION_TEXT_STAGING, beat.id, MOTION_TEXT_LOCATION]) || beat.place;
  if (locA !== locB) return beat.time !== prev.time ? { type: MOTION_TEXT_DIP, duration: 0.6 } : { type: MOTION_TEXT_FADE, duration: 0.5 };
  return { type: MOTION_TEXT_CUT, duration: 0 };
};
const nearestScene = (beats: MotionBeat[], i: number, gen?: MotionGenState): MotionBeat | undefined => {
  const ok = (b?: MotionBeat) => !!b && b.visual === MOTION_TEXT_SCENE && !!gen?.staging?.[b.id];
  for (let d = 0; d < beats.length; d++) {
    if (ok(beats[i + d])) return beats[i + d];
    if (ok(beats[i - d])) return beats[i - d];
  }
  return undefined;
};
const bgOf = (beats: MotionBeat[], i: number, gen?: MotionGenState): Record<string, unknown> => {
  const b = nearestScene(beats, i, gen);
  if (!b) return {};
  const stg: any = gen!.staging[b.id];
  return { bg3d: { location: stg.location, time: stg.time } };
};
const graphicParams = (beat: MotionBeat, analysis: MotionStoryAnalysis | null, bg: Record<string, unknown>): Pick<MotionShot, "template" | "params"> => {
  const d = (beat.data || {}) as Record<string, any>;
  switch (beat.visual) {
    case MOTION_TEXT_TITLE:
      return { template: MOTION_TEXT_TITLE, params: { kicker: d.kicker || "", title: d.title || analysis?.title || "", subtitle: d.subtitle || "", ...bg } };
    case MOTION_TEXT_CHAPTER:
      return { template: MOTION_TEXT_CHAPTER, params: { number: d.number ?? "", title: d.title || "", label: d.label, ...bg } };
    case MOTION_TEXT_QUOTE:
      return { template: MOTION_TEXT_QUOTE, params: { text: d.text || beat.narration, author: d.author || "", highlight: _.castArray(d.highlight || []), ...bg } };
    case MOTION_TEXT_STATS:
      return {
        template: MOTION_TEXT_STATS,
        params: {
          title: d.title || "",
          items: _.take(
            _.map(_.castArray(d.items || []), (it: any) => ({ value: _.toNumber(it?.value) || 0, prefix: _.toString(it?.prefix || ""), suffix: _.toString(it?.suffix || ""), label: _.toString(it?.label || ""), decimals: _.toNumber(it?.decimals) || 0 })),
            4,
          ),
          ...bg,
        },
      };
    case MOTION_TEXT_COUNTER:
      return { template: MOTION_TEXT_COUNTER, params: { from: _.toNumber(d.from) || 0, to: _.isFinite(_.toNumber(d.to)) ? _.toNumber(d.to) : 100, label: d.label || "", format: d.format === MOTION_TEXT_CLOCK ? MOTION_TEXT_CLOCK : undefined, tick: d.tick !== false, ...bg } };
    case MOTION_TEXT_MAP:
      return {
        template: MOTION_TEXT_MAP,
        params: {
          title: d.title || "",
          note: MOTION_TEXT_SO_DO_MINH_HOA_2,
          points: _.map(_.castArray(d.points || []), (p: any, i: number, arr: any[]) => ({ id: _.toString(p?.id || MOTION_TEMPLATE_P(`${i}`)), x: _.clamp(_.toNumber(p?.x) || 0.5, 0.05, 0.95), y: _.clamp(_.toNumber(p?.y) || 0.5, 0.08, 0.92), label: _.toString(p?.label || ""), sub: p?.sub, at: 0.05 + (0.5 * i) / Math.max(1, arr.length) })),
          routes: _.map(_.castArray(d.routes || []), (r: any, i: number) => ({ from: _.toString(r?.from), to: _.toString(r?.to), at: 0.2 + i * 0.15, dur: 0.35, bend: 0.12 })),
        },
      };
    case MOTION_TEXT_TIMELINE:
      return {
        template: MOTION_TEXT_TIMELINE,
        params: {
          title: d.title || "",
          events: _.take(
            _.map(_.castArray(d.events || []), (e: any) => ({ label: _.toString(e?.date || e?.label || ""), text: _.toString(e?.text || "") })),
            5,
          ),
        },
      };
    case MOTION_TEXT_HEADLINE:
      return { template: MOTION_TEXT_HEADLINE, params: { paper: d.paper || MOTION_TEXT_NHAT_BAO, date: d.date || "", headline: d.headline || beat.narration.slice(0, 60), sub: d.sub || "" } };
    case MOTION_TEXT_ENDING:
      return { template: MOTION_TEXT_ENDING, params: { text: d.text || beat.narration, sub: d.sub || "", ...bg } };
    default:
      return { template: MOTION_TEXT_QUOTE, params: { text: beat.narration, ...bg } };
  }
};
export interface CompiledStory {
  spec: MotionSpec;
  starts: number[];
  ends: number[];
  sfxCues: { t: number; kind: "hit" | "rise" | "chapter" }[];
  missing: string[];
}
const sceneShots = (beat: MotionBeat, gen: MotionGenState, start: number, end: number, speechStart: number): MotionShot[] => {
  const stg: any = gen.staging[beat.id];
  const dur = end - start;
  const cams: any[] = stg.cameras?.length ? stg.cameras : [stg.camera || {}];
  const overlays = beat.label ? [{ type: MOTION_TEXT_TAG, text: beat.label, at: 0.5, duration: Math.max(1.6, Math.min(4.5, dur - 1)) }] : undefined;
  const cuts = _.map(cams, (c, i) => (i === 0 ? 0 : _.clamp(_.toNumber(c.at) || 0, 0.15, 0.9)));
  const shots: MotionShot[] = [];
  cams.forEach((cam, i) => {
    const s0 = start + cuts[i] * dur;
    const s1 = i + 1 < cams.length ? start + cuts[i + 1] * dur : end;
    if (s1 - s0 < 0.8 && i > 0) return;
    const params = { ..._.omit(stg, [MOTION_TEXT_CAMERA, MOTION_TEXT_CAMERAS]), cameras: [cam], beatDur: +dur.toFixed(3), tOffset: +(s0 - start).toFixed(3) };
    shots.push({ id: i ? MOTION_TEMPLATE_C_3(`${beat.id}`, `${i + 1}`) : beat.id, start: +s0.toFixed(3), end: +s1.toFixed(3), template: MOTION_TEXT_GEN3D, params, overlays: i === 0 ? overlays : undefined, transition: i === 0 ? undefined : { type: MOTION_TEXT_CUT, duration: 0 } });
  });
  void speechStart;
  return shots;
};
export const compileStorySpec = (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, opts: { aspect: string; durations?: number[]; look?: string; accent?: string }): CompiledStory => {
  const beats = script.beats;
  if (_.isEmpty(beats)) throw new Error(MOTION_TEXT_KICH_BAN_CHUA_CO_BEAT_NAO_2);
  const gen = script.gen;
  const durations = _.map(beats, (b, i) => opts.durations?.[i] || b.duration || estimateBeatSeconds(b, script.language));
  const { starts, ends, total } = computeBeatTimeline(beats, durations);
  const lead = MOTION_STORY_CONFIG.LEAD_SECONDS;
  const shotStarts = _.map(starts, (s, i) => (i === 0 ? 0 : Math.max(0, s - lead)));
  const shots: MotionShot[] = [];
  const subtitles: { start: number; end: number; text: string }[] = [];
  const sfxCues: CompiledStory["sfxCues"] = [];
  const missing: string[] = [];
  const usedLocations = new Set<string>();
  beats.forEach((beat, i) => {
    const start = shotStarts[i];
    let end = i + 1 < beats.length ? shotStarts[i + 1] : total;
    if (end - start < MOTION_STORY_CONFIG.MIN_SHOT_SECONDS && i + 1 < beats.length) end = start + MOTION_STORY_CONFIG.MIN_SHOT_SECONDS;
    const transition = pickTransition(beat, beats[i - 1], i, gen);
    if (beat.visual === MOTION_TEXT_SCENE && gen?.staging?.[beat.id] && gen.locations?.[_.get(gen.staging, [beat.id, MOTION_TEXT_LOCATION]) as string]) {
      const list = sceneShots(beat, gen, start, end, starts[i]);
      if (list.length) list[0].transition = transition;
      usedLocations.add(_.get(gen.staging, [beat.id, MOTION_TEXT_LOCATION]) as string);
      shots.push(...list);
    } else {
      if (beat.visual === MOTION_TEXT_SCENE) missing.push(beat.id);
      const bg = bgOf(beats, i, gen);
      if (bg.bg3d) usedLocations.add(_.get(bg, [MOTION_TEXT_BG3D, MOTION_TEXT_LOCATION]) as string);
      const p = beat.visual === MOTION_TEXT_SCENE ? { template: MOTION_TEXT_QUOTE, params: { text: beat.action || beat.narration, author: "", ...bg } } : graphicParams(beat, analysis, bg);
      shots.push({ id: beat.id, start: +start.toFixed(3), end: +end.toFixed(3), ...p, transition });
    }
    if (!_.includes([MOTION_TEXT_TITLE, MOTION_TEXT_QUOTE, MOTION_TEXT_ENDING, MOTION_TEXT_HEADLINE], beat.visual)) subtitles.push(...buildSubtitles(beat, starts[i], ends[i]));
    if (beat.emphasis) sfxCues.push({ t: starts[i], kind: MOTION_TEXT_HIT });
    if (i > 0 && beat.chapterId !== beats[i - 1].chapterId) sfxCues.push({ t: start, kind: MOTION_TEXT_CHAPTER });
  });
  for (let i = 1; i < shots.length; i++) if (shots[i].start < shots[i - 1].end) shots[i - 1].end = shots[i].start;
  const spec: MotionSpec = {
    title: script.title || analysis?.title,
    aspect: opts.aspect,
    fps: 30,
    look: opts.look || analysis?.look || MOTION_TEXT_DOCUMENTARY,
    accent: opts.accent || analysis?.accent || MOTION_TEXT_FFB070,
    subtitleStyle: MOTION_TEXT_CINEMA,
    gen: gen ? { style: gen.style, cast: gen.cast, locations: _.pick(gen.locations, [...usedLocations]) } : undefined,
    shots,
    subtitles,
    duration: +total.toFixed(3),
  };
  return { spec, starts, ends, sfxCues, missing };
};
