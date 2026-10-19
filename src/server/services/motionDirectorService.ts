import { MOTION_BOARD2D } from "../../constants/motionBoard2d.js";
import { board2dSpec } from "./motion2d/board2d.js";
import { cast2dSpec } from "./motion2d/cast2d.js";
import { MOTION_2D } from "../../constants/motion2d.js";
import { motionAutoSoundEvents } from "../../lib/motionSound.js";
import { board2dSentenceKey, splitBoard2dSentences } from "../../lib/motionBoard2d.js";
import { MOTION_VIDEO_CONSTANTS } from "../../constants/motionVideo.js";
import { budgetShotText } from "../../lib/motionTextBudget.js";
import { motionStyleFinish } from "../../constants/motionStyleFinish.js";
import { compileMotionSoundPlan } from "../../lib/motionSoundPlan.js";
import type { MotionSoundCue } from "../../types/motionVideo.js";
import * as MR from "../../constants/motionRuntime.js";
import { MOTION_HISTORY } from "../../constants/motionHistory.js";
import { buildMotionHudTrack, motionHudStates, motionGeomapParams, motionIconsParams, motionScoreboardParams, motionVerdictParams } from "../../lib/motionHistory.js";
import { normalizeSoundCues } from "../../lib/motionSound.js";
import { MOTION_VOICE } from "../../constants/motionVoice.js";
import { motionMusicCues, motionMusicMood, motionMusicSegments } from "./motionMusicService.js";
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
  MOTION_TEXT_TIMELINE,
  MOTION_TEXT_TITLE,
} from "../../constants/motionRuntime.js";
import { MOTION_STORY_CONFIG, MOTION_DIRECTOR_PATTERNS as P } from "../../constants/motionVideo.js";
import { planMotionCoverage } from "../../lib/motionCoverage.js";
import type { MotionBeat, MotionGenState, MotionShot, MotionSpec, MotionStoryAnalysis, MotionStoryScript, MotionVoiceClip, MotionVoiceTrack } from "../../types/motionVideo.js";
const NON_SCENE_TRANSITION_IN = 0.55;
const GRAPHIC_HOLD = [MOTION_TEXT_TITLE, MOTION_TEXT_QUOTE, MOTION_TEXT_STATS, MOTION_TEXT_COUNTER, MOTION_TEXT_MAP, MOTION_TEXT_TIMELINE, MR.MOTION_TEXT_STARMAP, MR.MOTION_TEXT_BITMAP, MOTION_TEXT_HEADLINE, MOTION_HISTORY.GEOMAP, MOTION_HISTORY.ICONS, MOTION_HISTORY.VERDICT, MOTION_HISTORY.SCOREBOARD];
const countUnits = (text: string): number => _.size(_.compact(_.toString(text).split(P.WORDS)));
export const estimateBeatSeconds = (beat: MotionBeat, language: string): number => {
  const rate = language === MOTION_TEXT_EN ? MOTION_STORY_CONFIG.EN_WORDS_PER_SECOND : MOTION_STORY_CONFIG.VI_SYLLABLES_PER_SECOND;
  const pauses = (beat.narration.match(P.PUNCTUATION) || []).length * 0.18;
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
  const sentences = _.compact(_.map(_.toString(text).match(P.SENTENCES) || [text], _.trim));
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length <= max) {
      out.push(s);
      continue;
    }
    const parts = _.compact(_.map(s.split(P.CLAUSES), _.trim));
    let cur: string = MR.MOTION_TEXT_EMPTY;
    for (const p of parts) {
      if ((cur + MOTION_TEXT_SYMBOL_13 + p).trim().length > max && cur) {
        out.push(cur.trim());
        cur = p;
      } else cur = MOTION_TEMPLATE_JOIN_SPACE(String(cur), String(p));
    }
    if (cur.trim()) {
      const words = cur.trim().split(P.WORDS);
      let line: string = MR.MOTION_TEXT_EMPTY;
      for (const w of words) {
        if ((line + MOTION_TEXT_SYMBOL_13 + w).trim().length > max && line) {
          out.push(line.trim());
          line = w;
        } else line = MOTION_TEMPLATE_JOIN_SPACE(String(line), String(w));
      }
      if (line.trim()) out.push(line.trim());
    }
  }
  return out;
};
const buildSubtitles = (beat: MotionBeat, start: number, end: number): { start: number; end: number; text: string }[] => {
  const pieces = splitSubtitle(beat.narration, MOTION_STORY_CONFIG.SUBTITLE_MAX_CHARS);
  const weights = _.map(pieces, (p) => countUnits(p) + (P.SENTENCE_END.test(p) ? 0.8 : 0));
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
  if (!isScene && !wasScene) return { type: MOTION_STORY_CONFIG.GRAPHIC_TRANSITION, duration: MOTION_STORY_CONFIG.GRAPHIC_TRANSITION_SECONDS };
  if (!isScene || !wasScene) return { type: MOTION_TEXT_FADE, duration: NON_SCENE_TRANSITION_IN };
  const locA = _.get(gen, [MOTION_TEXT_STAGING, prev.id, MOTION_TEXT_LOCATION]) || prev.place,
    locB = _.get(gen, [MOTION_TEXT_STAGING, beat.id, MOTION_TEXT_LOCATION]) || beat.place;
  if (locA !== locB) return beat.time !== prev.time ? { type: MOTION_TEXT_DIP, duration: 0.6 } : { type: MOTION_TEXT_FADE, duration: 0.5 };
  return { type: MOTION_TEXT_CUT, duration: 0 };
};
const is2d = (gen?: MotionGenState): boolean => gen?.drawingMode === MOTION_VIDEO_CONSTANTS.DRAWING_2D;
const nearestScene = (beats: MotionBeat[], i: number, gen?: MotionGenState): MotionBeat | undefined => {
  const ok = (b?: MotionBeat) => !!b && b.visual === MOTION_TEXT_SCENE && (is2d(gen) ? !!b.place : !!gen?.staging?.[b.id]);
  for (let d = 0; d < beats.length; d++) {
    if (ok(beats[i + d])) return beats[i + d];
    if (ok(beats[i - d])) return beats[i - d];
  }
  return undefined;
};
const bgOf = (beats: MotionBeat[], i: number, gen?: MotionGenState): Record<string, unknown> => {
  const b = nearestScene(beats, i, gen);
  if (!b) return {};
  if (is2d(gen)) return { [MOTION_2D.BG2D]: { location: b.place, time: b.time } };
  const stg: any = gen!.staging[b.id];
  return { bg3d: { location: stg.location, time: stg.time } };
};
const graphicParams = (beat: MotionBeat, analysis: MotionStoryAnalysis | null, bg: Record<string, unknown>): Pick<MotionShot, "template" | "params"> => {
  const d = (beat.data || {}) as Record<string, any>;
  switch (beat.visual) {
    case MOTION_HISTORY.GEOMAP:
      return { template: MOTION_HISTORY.GEOMAP, params: motionGeomapParams(d) };
    case MOTION_HISTORY.VERDICT:
      return { template: MOTION_HISTORY.VERDICT, params: motionVerdictParams(d) };
    case MOTION_HISTORY.SCOREBOARD:
      return { template: MOTION_HISTORY.SCOREBOARD, params: motionScoreboardParams(d) };
    case MOTION_HISTORY.ICONS:
      return { template: MOTION_HISTORY.ICONS, params: { ...motionIconsParams(d), ...bg } };
    case MOTION_TEXT_TITLE:
      return { template: MOTION_TEXT_TITLE, params: { kicker: d.kicker || MR.MOTION_TEXT_EMPTY, title: d.title || analysis?.title || MR.MOTION_TEXT_EMPTY, subtitle: d.subtitle || MR.MOTION_TEXT_EMPTY, ...bg } };
    case MOTION_TEXT_CHAPTER:
      return { template: MOTION_TEXT_CHAPTER, params: { number: d.number ?? MR.MOTION_TEXT_EMPTY, title: d.title || MR.MOTION_TEXT_EMPTY, label: d.label, ...bg } };
    case MOTION_TEXT_QUOTE:
      return { template: MOTION_TEXT_QUOTE, params: { text: d.text || beat.narration, author: d.author || MR.MOTION_TEXT_EMPTY, highlight: _.castArray(d.highlight || []), ...bg } };
    case MOTION_TEXT_STATS:
      return {
        template: MOTION_TEXT_STATS,
        params: {
          title: d.title || MR.MOTION_TEXT_EMPTY,
          items: _.take(
            _.map(_.castArray(d.items || []), (it: any) => ({ value: _.toNumber(it?.value) || 0, prefix: _.toString(it?.prefix || MR.MOTION_TEXT_EMPTY), suffix: _.toString(it?.suffix || MR.MOTION_TEXT_EMPTY), label: _.toString(it?.label || MR.MOTION_TEXT_EMPTY), decimals: _.toNumber(it?.decimals) || 0 })),
            4,
          ),
          ...bg,
        },
      };
    case MOTION_TEXT_COUNTER:
      return { template: MOTION_TEXT_COUNTER, params: { from: _.toNumber(d.from) || 0, to: _.isFinite(_.toNumber(d.to)) ? _.toNumber(d.to) : 100, label: d.label || MR.MOTION_TEXT_EMPTY, format: d.format === MOTION_TEXT_CLOCK ? MOTION_TEXT_CLOCK : undefined, tick: d.tick !== false, ...bg } };
    case MOTION_TEXT_MAP:
      return {
        template: MOTION_TEXT_MAP,
        params: {
          title: d.title || MR.MOTION_TEXT_EMPTY,
          note: MOTION_TEXT_SO_DO_MINH_HOA_2,
          points: _.map(_.castArray(d.points || []), (p: any, i: number, arr: any[]) => ({ id: _.toString(p?.id || MOTION_TEMPLATE_P(String(i))), x: _.clamp(_.toNumber(p?.x) || 0.5, 0.05, 0.95), y: _.clamp(_.toNumber(p?.y) || 0.5, 0.08, 0.92), label: _.toString(p?.label || MR.MOTION_TEXT_EMPTY), sub: p?.sub, at: 0.05 + (0.5 * i) / Math.max(1, arr.length) })),
          routes: _.map(_.castArray(d.routes || []), (r: any, i: number) => ({ from: _.toString(r?.from), to: _.toString(r?.to), at: 0.2 + i * 0.15, dur: 0.35, bend: 0.12 })),
        },
      };
    case MOTION_TEXT_TIMELINE:
      return {
        template: MOTION_TEXT_TIMELINE,
        params: {
          title: d.title || MR.MOTION_TEXT_EMPTY,
          events: _.take(
            _.map(_.castArray(d.events || []), (e: any) => ({ label: _.toString(e?.date || e?.label || MR.MOTION_TEXT_EMPTY), text: _.toString(e?.text || MR.MOTION_TEXT_EMPTY) })),
            5,
          ),
        },
      };
    case MR.MOTION_TEXT_STARMAP: {
      const stars = _.take(_.castArray(d.stars || d.points || []), 12);
      const ids = new Set<string>();
      return {
        template: MR.MOTION_TEXT_STARMAP,
        params: {
          title: d.title || MR.MOTION_TEXT_EMPTY,
          stars: _.map(stars, (s: any, i: number) => {
            const id = _.toString(s?.id || MR.MOTION_TEMPLATE_S_2(i));
            ids.add(id);
            return { id, x: _.clamp(_.toNumber(s?.x) || 0.5, 0, 1), y: _.clamp(_.toNumber(s?.y) || 0.5, 0, 1), label: _.toString(s?.label || MR.MOTION_TEXT_EMPTY), sub: _.toString(s?.sub || MR.MOTION_TEXT_EMPTY), center: s?.center === true || _.toString(d.center) === id, at: 0.05 + (0.45 * i) / Math.max(1, stars.length) };
          }),
          links: _.take(
            _.filter(
              _.map(_.castArray(d.links || d.routes || []), (l: any, i: number) => ({ from: _.toString(l?.from), to: _.toString(l?.to), label: _.toString(l?.label || l?.distance || MR.MOTION_TEXT_EMPTY), at: 0.35 + i * 0.1 })),
              (l) => ids.has(l.from) && ids.has(l.to),
            ),
            10,
          ),
        },
      };
    }
    case MR.MOTION_TEXT_BITMAP: {
      const rows = _.take(
        _.map(_.castArray(d.rows || d.grid || []), (r: unknown) => _.toString(r).replace(P.BITMAP, MR.MOTION_TEXT_EMPTY).slice(0, 48)),
        64,
      ).filter((r) => r.length);
      return { template: MR.MOTION_TEXT_BITMAP, params: { title: d.title || MR.MOTION_TEXT_EMPTY, caption: _.toString(d.caption || MR.MOTION_TEXT_EMPTY), rows: rows.length ? rows : [MR.MOTION_TEXT_0110, MR.MOTION_TEXT_1001, MR.MOTION_TEXT_1001, MR.MOTION_TEXT_0110] } };
    }
    case MOTION_TEXT_HEADLINE:
      return { template: MOTION_TEXT_HEADLINE, params: { paper: d.paper || MOTION_TEXT_NHAT_BAO, date: d.date || MR.MOTION_TEXT_EMPTY, headline: d.headline || beat.narration.slice(0, 60), sub: d.sub || MR.MOTION_TEXT_EMPTY } };
    case MOTION_TEXT_ENDING:
      return { template: MOTION_TEXT_ENDING, params: { text: d.text || beat.narration, sub: d.sub || MR.MOTION_TEXT_EMPTY, ...bg } };
    default:
      return { template: MOTION_TEXT_QUOTE, params: { text: beat.narration, ...bg } };
  }
};
export interface CompiledStory { spec: MotionSpec; starts: number[]; ends: number[]; sfxCues: MotionSoundCue[]; missing: string[]; }
const speechRanges = (clip: MotionVoiceClip, origin: number): number[][] => {
  const words = clip.words?.length ? clip.words : [[0, clip.end - clip.start] as [number, number]];
  const out: number[][] = [];
  for (const [s, e] of words) {
    const from = +(clip.start + s - origin).toFixed(3),
      to = +(clip.start + e - origin).toFixed(3),
      last = out[out.length - 1];
    if (last && from - last[1] < MOTION_VOICE.ASR.MERGE_GAP) last[1] = to;
    else out.push([from, to]);
  }
  return out;
};
export const sceneShots = (beat: MotionBeat, gen: MotionGenState, start: number, end: number, speechStart: number, beatIndex = 0, speech?: Record<string, number[][]>, lines?: Record<string, number>): MotionShot[] => {
  const stg: any = gen.staging[beat.id];
  const dur = end - start;
  const cams: any[] = planMotionCoverage(stg, dur, beatIndex, MR.MOTION_TEMPLATE_SYMBOL_115(beat.narration, beat.action || MR.MOTION_TEXT_EMPTY), beat);
  const authored = _.map(cams, (c, i) => (i === 0 ? 0 : _.clamp(c.utterance && lines?.[c.utterance] != null ? lines[c.utterance] / dur : _.toNumber(c.at) || 0, 0.15, 0.9)));
  const cuts = _.map(authored, (cut, i) => (i && cut <= authored[i - 1] ? _.clamp(_.toNumber(cams[i].at) || 0, 0.15, 0.9) : cut));
  const shots: MotionShot[] = [];
  cams.forEach((cam, i) => {
    const s0 = start + cuts[i] * dur;
    const s1 = i + 1 < cams.length ? start + cuts[i + 1] * dur : end;
    if (s1 - s0 < 0.8 && i > 0) return;
    const params = { ..._.omit(stg, [MOTION_TEXT_CAMERA, MOTION_TEXT_CAMERAS]), ...(speech && !_.isEmpty(speech) ? { speech } : {}), soundBeatId: beat.id, cameras: [cam], beatDur: +dur.toFixed(3), tOffset: +(s0 - start).toFixed(3) };
    shots.push({ id: i ? MOTION_TEMPLATE_C_3(String(beat.id), String(i + 1)) : beat.id, start: +s0.toFixed(3), end: +s1.toFixed(3), template: gen.drawingMode === MOTION_VIDEO_CONSTANTS.DRAWING_2D ? MOTION_VIDEO_CONSTANTS.TEMPLATE_2D : MOTION_TEXT_GEN3D, params, transition: i === 0 ? undefined : { type: MOTION_TEXT_CUT, duration: 0 } });
  });
  void speechStart;
  return shots;
};
const beatSentences2d = (beat: MotionBeat, gen: MotionGenState): string[] => {
  const sentences = gen.board2d?.sentences || {};
  const texts = beat.utterances?.length ? _.map(beat.utterances, MOTION_2D.F_TEXT) : [beat.narration];
  return _.flatMap(_.compact(_.flatMap(texts, (t) => _.map(splitBoard2dSentences(t), (x) => sentences[board2dSentenceKey(x)]))), (e) => _.compact([e.kind, ..._.map(e.objects, MOTION_2D.F_KEY), ..._.map(e.actors, MOTION_2D.F_POSE), e.light]));
};
export const sceneShots2d = (beat: MotionBeat, gen: MotionGenState, start: number, end: number, speech?: Record<string, number[][]>): MotionShot[] => {
  const known = new Set([..._.keys(gen.board2d?.cast || {}), ..._.keys(gen.cast || {})]);
  const cast = _.take(_.uniq(_.filter(beat.cast || [], (c) => !known.size || known.has(c))), MOTION_2D.ACTOR_MAX);
  const n = cast.length;
  const actors = _.map(cast, (c, i) => ({ cast: c, at: [+((i - (n - 1) / 2) * MOTION_2D.ACTOR_GAP).toFixed(3), 0], face: n < 2 ? 0 : i === 0 ? 90 : i === n - 1 ? -90 : 0, action: MOTION_2D.ACTION_IDLE }));
  const dur = end - start;
  const params = {
    location: beat.place,
    time: beat.time,
    weather: beat.weather,
    actors,
    props: [],
    hide: [],
    soundEvents: motionAutoSoundEvents([beat.narration, beat.action, ...beatSentences2d(beat, gen)]),
    ...(speech && !_.isEmpty(speech) ? { speech } : {}),
    soundBeatId: beat.id,
    cameras: [{ shot: MOTION_2D.SHOT_WIDE, move: MOTION_2D.MOVE_STATIC }],
    beatDur: +dur.toFixed(3),
    tOffset: 0,
  };
  return [{ id: beat.id, start: +start.toFixed(3), end: +end.toFixed(3), template: MOTION_VIDEO_CONSTANTS.TEMPLATE_2D, params }];
};
const spokenClip = (beat: MotionBeat, clip: MotionVoiceClip, roles: readonly string[] = MOTION_2D.SPEAK_ROLES): boolean => _.some(beat.utterances || [], (u) => u.speaker === clip.speaker && _.includes(roles, u.role) && (u.id === clip.id || _.includes(clip.text, _.trim(u.text).slice(0, 12))));
export const compileStorySpec = (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, opts: { aspect: string; durations?: number[]; look?: string; accent?: string; voiceTrack?: MotionVoiceTrack }): CompiledStory => {
  const beats = script.beats;
  if (_.isEmpty(beats)) throw new Error(MOTION_TEXT_KICH_BAN_CHUA_CO_BEAT_NAO_2);
  const gen = script.gen;
  const durations = _.map(beats, (b, i) => opts.durations?.[i] || b.duration || estimateBeatSeconds(b, script.language));
  const { starts, ends, total } = computeBeatTimeline(beats, durations);
  const lead = MOTION_STORY_CONFIG.LEAD_SECONDS;
  const shotStarts = _.map(starts, (s, i) => (i === 0 ? 0 : Math.max(0, s - lead, ends[i - 1] + MOTION_STORY_CONFIG.SPEECH_HOLD_SECONDS)));
  const shots: MotionShot[] = [];
  const subtitles: { start: number; end: number; text: string; speaker?: string }[] = [];
  const missing: string[] = [];
  const usedLocations = new Set<string>();
  const hudStates = motionHudStates(beats);
  beats.forEach((beat, i) => {
    const start = shotStarts[i];
    let end = i + 1 < beats.length ? shotStarts[i + 1] : total;
    if (end - start < MOTION_STORY_CONFIG.MIN_SHOT_SECONDS && i + 1 < beats.length) end = start + MOTION_STORY_CONFIG.MIN_SHOT_SECONDS;
    const transition = pickTransition(beat, beats[i - 1], i, gen);
    const scene2d = beat.visual === MOTION_TEXT_SCENE && is2d(gen) && !!beat.place;
    if (scene2d || (beat.visual === MOTION_TEXT_SCENE && gen?.staging?.[beat.id] && gen.locations?.[_.get(gen.staging, [beat.id, MOTION_TEXT_LOCATION]) as string])) {
      const speech = _.mapValues(
        _.groupBy(
          _.filter(opts.voiceTrack?.clips, (clip) => clip.beatId === beat.id && !!clip.speaker && (!scene2d || spokenClip(beat, clip))),
          (clip) => clip.speaker,
        ),
        (clips) => _.flatMap(clips, (clip) => speechRanges(clip, start)),
      );
      const lines = _.fromPairs(
        _.map(
          _.filter(opts.voiceTrack?.clips, (clip) => clip.beatId === beat.id),
          (clip) => [clip.id, clip.start - start],
        ),
      );
      const list = scene2d ? sceneShots2d(beat, gen!, start, end, speech) : sceneShots(beat, gen!, start, end, starts[i], i, speech, lines);
      if (list.length) list[0].transition = i === 0 && analysis?.videoDna ? { type: MR.MOTION_TEXT_CUT, duration: 0 } : transition;
      if (!scene2d) usedLocations.add(_.get(gen!.staging, [beat.id, MOTION_TEXT_LOCATION]) as string);
      shots.push(...list);
    } else {
      if (beat.visual === MOTION_TEXT_SCENE) missing.push(beat.id);
      const bg = bgOf(beats, i, gen);
      if (bg.bg3d) usedLocations.add(_.get(bg, [MOTION_TEXT_BG3D, MOTION_TEXT_LOCATION]) as string);
      const p = beat.visual === MOTION_TEXT_SCENE ? { template: MOTION_TEXT_QUOTE, params: { text: beat.action || beat.narration, author: MR.MOTION_TEXT_EMPTY, ...bg } } : graphicParams(beat, analysis, bg);
      const params = beat.visual === MOTION_TEXT_SCENE ? p.params : budgetShotText(p.template, p.params as Record<string, unknown>, beat.narration, hudStates[i]);
      shots.push({ id: beat.id, start: +start.toFixed(3), end: +end.toFixed(3), ...p, params, transition });
    }
    const lines = opts.voiceTrack?.clips?.filter((clip) => clip.beatId === beat.id);
    if (lines?.length) {
      for (const clip of lines) {
        const lineBeat = { ...beat, narration: clip.text };
        const spoken = spokenClip(beat, clip, [MOTION_BOARD2D.DIALOGUE]);
        const speakerName = gen?.drawingMode === MOTION_VIDEO_CONSTANTS.DRAWING_2D && spoken ? _.find(analysis?.cast || [], { key: clip.speaker })?.name : undefined;
        subtitles.push(..._.map(buildSubtitles(lineBeat, clip.start, clip.end), (sub) => (speakerName ? { ...sub, speaker: speakerName } : sub)));
      }
    } else if (!_.includes([MOTION_TEXT_TITLE, MOTION_TEXT_QUOTE, MOTION_TEXT_ENDING, MOTION_TEXT_HEADLINE], beat.visual)) subtitles.push(...buildSubtitles(beat, starts[i], ends[i]));
  });
  for (let i = 1; i < shots.length; i++) if (shots[i].start < shots[i - 1].end) shots[i - 1].end = shots[i].start;
  const spec: MotionSpec = {
    title: script.title || analysis?.title,
    aspect: opts.aspect,
    fps: 30,
    look: opts.look || analysis?.look || MOTION_TEXT_DOCUMENTARY,
    accent: opts.accent || analysis?.accent || MOTION_TEXT_FFB070,
    subtitleStyle: MOTION_TEXT_CINEMA,
    fadeIn: analysis?.videoDna ? 0 : undefined,
    fadeOut: analysis?.videoDna ? 0 : undefined,
    gen: gen ? { characterMotion: gen.characterMotion, characterMode: gen.characterMode, videoDna: gen.videoDna, drawingMode: gen.drawingMode, style: { ...gen.style, ...(gen.style?.metrics || !analysis?.referenceStyle?.metrics ? {} : { metrics: analysis.referenceStyle.metrics }) }, cast: is2d(gen) && gen.board2d?.cast ? cast2dSpec(gen.board2d.cast) : gen.cast, locations: is2d(gen) ? {} : _.pick(gen.locations, [...usedLocations]), ...(is2d(gen) ? { board2d: board2dSpec(gen) } : {}) } : undefined,
    shots,
    subtitles,
    duration: +total.toFixed(3),
  };
  const finish = motionStyleFinish(analysis?.stylePreset);
  if (finish) spec.finish = finish;
  spec.music = { mood: motionMusicMood(analysis), cues: motionMusicCues(spec), segments: motionMusicSegments(analysis, beats, shotStarts), ...(finish?.music ? { instrument: finish.music } : {}), ...(finish?.ambience ? { ambience: finish.ambience } : {}) };
  const hud = buildMotionHudTrack(beats, shotStarts, total);
  if (hud.length) spec.hud = hud;
  const stampCues = normalizeSoundCues(
    _.map(_.filter(shots, { template: MOTION_HISTORY.VERDICT }), (shot) => ({ id: MOTION_HISTORY.STAMP_CUE_ID(shot.id), beatId: shot.id, kind: MOTION_HISTORY.VERDICT_SFX_KIND, layer: MOTION_HISTORY.VERDICT_SFX_LAYER, t: +(shot.start + MOTION_HISTORY.VERDICT_STAMP_AT * (shot.end - shot.start)).toFixed(3), duration: MOTION_HISTORY.VERDICT_SFX_SECONDS })),
    spec.duration,
  );
  const sfxCues = [...compileMotionSoundPlan(spec, script, analysis, opts.voiceTrack?.plan?.direction, opts.voiceTrack?.plan?.roles, opts.voiceTrack?.clips), ...stampCues];
  if (gen?.drawingMode === MOTION_VIDEO_CONSTANTS.DRAWING_2D) spec.fxCues = sfxCues.filter((cue) => MOTION_VIDEO_CONSTANTS.FX_CUE_RE.test(cue.kind)).map((cue) => ({ t: cue.t, kind: cue.kind }));
  return { spec, starts, ends, sfxCues, missing };
};
