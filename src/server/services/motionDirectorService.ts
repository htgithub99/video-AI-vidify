import { puppetKitSpec, puppetSceneShot } from "./puppet/compilePuppet.js";
import { PUPPET as PUPPET_C } from "../../constants/motionPuppet.js";
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
  MOTION_TEMPLATE_JOIN_SPACE,
  MOTION_TEMPLATE_P,
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
  MOTION_TEXT_HEADLINE,
  MOTION_TEXT_KICH_BAN_CHUA_CO_BEAT_NAO_2,
  MOTION_TEXT_MAP,
  MOTION_TEXT_NHAT_BAO,
  MOTION_TEXT_QUOTE,
  MOTION_TEXT_SCENE,
  MOTION_TEXT_SO_DO_MINH_HOA_2,
  MOTION_TEXT_STATS,
  MOTION_TEXT_SYMBOL_13,
  MOTION_TEXT_TIMELINE,
  MOTION_TEXT_TITLE,
} from "../../constants/motionRuntime.js";
import { MOTION_STORY_CONFIG, MOTION_DIRECTOR_PATTERNS as P } from "../../constants/motionVideo.js";
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
const pickTransition = (beat: MotionBeat, prev: MotionBeat | undefined, index: number): { type: string; duration: number } => {
  if (index === 0) return { type: MOTION_TEXT_FADE, duration: 0.9 };
  if (!prev) return { type: MOTION_TEXT_CUT, duration: 0 };
  if (beat.visual === MOTION_TEXT_CHAPTER || beat.chapterId !== prev.chapterId) return { type: MOTION_TEXT_DIP, duration: 0.9 };
  if (beat.visual === MOTION_TEXT_ENDING) return { type: MOTION_TEXT_FADE, duration: 1.2 };
  const isScene = beat.visual === MOTION_TEXT_SCENE,
    wasScene = prev.visual === MOTION_TEXT_SCENE;
  if (!isScene && !wasScene) return { type: MOTION_STORY_CONFIG.GRAPHIC_TRANSITION, duration: MOTION_STORY_CONFIG.GRAPHIC_TRANSITION_SECONDS };
  if (!isScene || !wasScene) return { type: MOTION_TEXT_FADE, duration: NON_SCENE_TRANSITION_IN };
  const locA = prev.place,
    locB = beat.place;
  if (locA !== locB) return beat.time !== prev.time ? { type: MOTION_TEXT_DIP, duration: 0.6 } : { type: MOTION_TEXT_FADE, duration: 0.5 };
  return { type: MOTION_TEXT_CUT, duration: 0 };
};
const nearestScene = (beats: MotionBeat[], i: number, gen?: MotionGenState): MotionBeat | undefined => {
  const ok = (b?: MotionBeat) => !!b && b.visual === MOTION_TEXT_SCENE && !!b.place && !!gen?.puppet?.sets[b.place];
  for (let d = 0; d < beats.length; d++) {
    if (ok(beats[i + d])) return beats[i + d];
    if (ok(beats[i - d])) return beats[i - d];
  }
  return undefined;
};
const bgOf = (beats: MotionBeat[], i: number, gen?: MotionGenState): Record<string, unknown> => {
  const b = nearestScene(beats, i, gen);
  return b ? { [PUPPET_C.BG_PARAM]: { set: b.place, light: b.time } } : {};
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
const quotedIn = (narration: string, text: string): boolean => {
  const head = _.trim(text).slice(0, PUPPET_C.QUOTE_HEAD);
  const at = head ? narration.indexOf(head) : -1;
  return at >= 0 && PUPPET_C.QUOTE_BEFORE_RE.test(narration.slice(Math.max(0, at - PUPPET_C.QUOTE_LOOKBACK), at));
};
const spokenClip = (beat: MotionBeat, clip: MotionVoiceClip, roles: readonly string[] = PUPPET_C.SPEAK_ROLES): boolean => _.some(beat.utterances || [], (u) => u.speaker === clip.speaker && _.includes(roles, u.role) && (u.id === clip.id || _.includes(clip.text, _.trim(u.text).slice(0, 12))) && quotedIn(beat.narration, u.text));
export const compileStorySpec = (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, opts: { aspect: string; durations?: number[]; look?: string; accent?: string; voiceTrack?: MotionVoiceTrack }): CompiledStory => {
  const beats = script.beats;
  if (_.isEmpty(beats)) throw new Error(MOTION_TEXT_KICH_BAN_CHUA_CO_BEAT_NAO_2);
  const gen = script.gen;
  const durations = _.map(beats, (b, i) => opts.durations?.[i] || b.duration || estimateBeatSeconds(b, script.language));
  const { starts, ends, total } = computeBeatTimeline(beats, durations);
  const lead = MOTION_STORY_CONFIG.LEAD_SECONDS;
  const shotStarts = _.map(starts, (s, i) => (i === 0 ? 0 : Math.max(0, s - lead, ends[i - 1] + MOTION_STORY_CONFIG.SPEECH_HOLD_SECONDS)));
  const shots: MotionShot[] = [];
  const subtitles: { start: number; end: number; text: string; dialogue?: boolean }[] = [];
  const missing: string[] = [];
  const hudStates = motionHudStates(beats);
  beats.forEach((beat, i) => {
    const start = shotStarts[i];
    let end = i + 1 < beats.length ? shotStarts[i + 1] : total;
    if (end - start < MOTION_STORY_CONFIG.MIN_SHOT_SECONDS && i + 1 < beats.length) end = start + MOTION_STORY_CONFIG.MIN_SHOT_SECONDS;
    const transition = pickTransition(beat, beats[i - 1], i);
    const clips = _.filter(opts.voiceTrack?.clips, (clip) => clip.beatId === beat.id);
    const speech = _.mapValues(
      _.groupBy(
        _.filter(clips, (clip) => !!clip.speaker && spokenClip(beat, clip)),
        (clip) => clip.speaker,
      ),
      (list) => _.flatMap(list, (clip) => speechRanges(clip, start)),
    );
    const puppetShot = beat.visual === MOTION_TEXT_SCENE && gen?.puppet ? puppetSceneShot(beat, gen.puppet, start, end, clips, speech, !!beat.data?.[PUPPET_C.SOUND_FLAG]) : null;
    if (puppetShot) {
      puppetShot.transition = i === 0 && analysis?.videoDna ? { type: MR.MOTION_TEXT_CUT, duration: 0 } : transition;
      shots.push(puppetShot);
    } else {
      if (beat.visual === MOTION_TEXT_SCENE) missing.push(beat.id);
      const bg = bgOf(beats, i, gen);
      const p = beat.visual === MOTION_TEXT_SCENE ? { template: MOTION_TEXT_QUOTE, params: { text: beat.action || beat.narration, author: MR.MOTION_TEXT_EMPTY, ...bg } } : graphicParams(beat, analysis, bg);
      const params = beat.visual === MOTION_TEXT_SCENE ? p.params : budgetShotText(p.template, p.params as Record<string, unknown>, beat.narration, hudStates[i]);
      shots.push({ id: beat.id, start: +start.toFixed(3), end: +end.toFixed(3), ...p, params, transition });
    }
    const lines = opts.voiceTrack?.clips?.filter((clip) => clip.beatId === beat.id);
    if (lines?.length) {
      for (const clip of lines) {
        const lineBeat = { ...beat, narration: clip.text };
        const spoken = spokenClip(beat, clip, [PUPPET_C.DIALOGUE]);
        subtitles.push(..._.map(buildSubtitles(lineBeat, clip.start, clip.end), (sub) => (spoken ? { ...sub, dialogue: true } : sub)));
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
    gen: gen ? { characterMotion: gen.characterMotion, characterMode: gen.characterMode, videoDna: gen.videoDna, drawingMode: gen.drawingMode } : undefined,
    shots,
    subtitles,
    duration: +total.toFixed(3),
  };
  const kit = gen?.puppet ? puppetKitSpec(gen.puppet, gen.characterMotion === true) : null;
  if (kit) spec.kit = kit;
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
  if (gen?.puppet) spec.fxCues = sfxCues.filter((cue) => MOTION_VIDEO_CONSTANTS.FX_CUE_RE.test(cue.kind)).map((cue) => ({ t: cue.t, kind: cue.kind }));
  return { spec, starts, ends, sfxCues, missing };
};
