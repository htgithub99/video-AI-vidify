import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { MOTION_VOICE as C, MOTION_VOICE_DELIVERY as D, MOTION_VOICE_PACING as PACE, MOTION_VOICE_PATTERNS as P, MOTION_VOICE_SPEED } from "../../constants/motionVoice.js";
import { readVoiceSpeedSettings, voiceSpeedKey, voiceTempoFactor } from "./motionVoiceSpeedService.js";
import { MOTION_STORY_CONFIG } from "../../constants/motionVideo.js";
import type { MotionBeat, MotionVoiceTrack, MotionStoryScript, MotionStoryAnalysis, MotionVoicePreset, MotionUtterance, MotionVoiceDelivery, MotionVoicePlan, MotionVoiceTiming } from "../../types/motionVideo.js";
import { computeBeatTimeline, compileStorySpec } from "./motionDirectorService.js";
import { motionSoundSpatial } from "../../lib/motionSoundPlan.js";
import { directedSpeechText, isAi33Voice, motionVoiceSignature, resolveMotionDelivery } from "../../lib/motionVoice.js";
import { getMotionAudioDirectory } from "./motionLibraryService.js";
import { directMotionVoice, type MotionVoiceOptions } from "./motionVoiceDirectionService.js";
import { transcribeVieneuAudio, vieneuRoot, type VieneuDelivery } from "./vieneuTtsService.js";
import { listMotionVoices, synthesizeMotionSpeech } from "./motionVoiceSourceService.js";
import { buildMotionSoundTrack, motionWavHeader, runMotionAudioProcess } from "./motionSoundMixService.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
import _ from "lodash";
import { motionAudioHash as hash, motionWavData } from "./motionAudioUtils.js";
const active = new Map<string, Promise<MotionVoiceTrack>>();
export interface MotionVoiceDependencies { voices?: (signal?: AbortSignal, log?: (value: string) => void) => Promise<MotionVoicePreset[]>; synthesize?: typeof synthesizeMotionSpeech; }
const deliveryTempo = (line: MotionUtterance, delivery: MotionVoiceDelivery): number => _.clamp(_.clamp(line.speed || 1, C.TEMPO.SPEED_MIN, C.TEMPO.SPEED_MAX) * delivery.tempo, C.TEMPO.MIN, C.TEMPO.MAX);
const engineDelivery = (voiceId: string, delivery: MotionVoiceDelivery): VieneuDelivery => (isAi33Voice(voiceId) ? {} : { temperature: delivery.temperature, silence: delivery.silence });
const speechTokens = (text: string): string[] => _.compact(text.toLowerCase().normalize(C.ASR.NORMALIZE).split(C.ASR.TOKEN_RE));
const speechError = (expected: string, heard: string): number => {
  const a = speechTokens(expected),
    b = speechTokens(heard);
  if (!a.length) return 0;
  let row = _.range(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return row[b.length] / a.length;
};
type ClipWords = [number, number][];
interface SpeechClipAudio { id: string; bytes: number; duration: number; words?: ClipWords; }
const checkClip = async (file: string, line: MotionUtterance, language: unknown, opts: MotionVoiceOptions): Promise<{ error: number; words: ClipWords } | null> => {
  try {
    const result = await transcribeVieneuAudio(file, language === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI, opts.signal, opts.log);
    return { error: speechError(line.text, result.text), words: _.map(result.words, (word) => [word.s, word.e] as [number, number]) };
  } catch (error) {
    if (opts.signal?.aborted) throw error;
    opts.log?.(C.ASR.UNAVAILABLE(_.toString((error as Error)?.message || error)));
    return null;
  }
};
const speechClip = async (line: MotionUtterance, voiceId: string, language: unknown, opts: MotionVoiceOptions, deps: MotionVoiceDependencies, delivery: MotionVoiceDelivery): Promise<SpeechClipAudio> => {
  const rawId = C.CLIP_PREFIX + hash([C.VERSION, C.CLIP_VERSION, C.PACKAGE, language, line.text, voiceId, D.VERSION, engineDelivery(voiceId, delivery)]) + MR.MOTION_TEXT_WAV,
    id = C.CLIP_PREFIX + hash([rawId, C.TEMPO, line.speed, delivery.tempo, voiceSpeedKey(voiceId)]) + MR.MOTION_TEXT_WAV,
    file = path.join(getMotionAudioDirectory(), id),
    wordsFile = file + C.ASR.WORDS_EXT;
  let words: ClipWords | undefined;
  try {
    if (fs.existsSync(file) && fs.existsSync(wordsFile)) words = JSON.parse(fs.readFileSync(wordsFile, MR.MOTION_TEXT_UTF8));
  } catch {}
  for (let check = 0; ; check++) {
    if (!fs.existsSync(file) || fs.statSync(file).size < 48) {
      const original = path.join(vieneuRoot(), MR.MOTION_TEXT_CLIPS, rawId),
        temp = file + randomUUID() + MR.MOTION_TEXT_WAV;
      fs.mkdirSync(path.dirname(original), { recursive: true });
      try {
        let failure: unknown;
        for (let attempt = 0; attempt < 2 && !(fs.existsSync(original) && fs.statSync(original).size >= 48); attempt++) {
          if (opts.signal?.aborted) throw new Error(C.CANCELLED);
          try {
            await (deps.synthesize || synthesizeMotionSpeech)(directedSpeechText(line), voiceId, original, opts.signal, opts.log, engineDelivery(voiceId, delivery));
            failure = undefined;
            break;
          } catch (error) {
            failure = error;
            if (opts.signal?.aborted) throw error;
          }
        }
        if (failure) throw failure;
        const render = (value: number) => runMotionAudioProcess([MR.MOTION_TEXT_I, original, MR.MOTION_TEXT_AF, MR.MOTION_TEMPLATE_ATEMPO_HIGHPASS_F_65_DYNAUDNORM_F_150_G_5_P_0_75_M_3_AFADE_T(value.toFixed(3)), MR.MOTION_TEXT_AR, String(C.SAMPLE_RATE), MR.MOTION_TEXT_AC, MR.MOTION_TEXT_1, MR.MOTION_TEXT_C_A, MR.MOTION_TEXT_PCM_S16LE, MR.MOTION_TEXT_F, MR.MOTION_TEXT_WAV_2, temp], opts.signal);
        const tempo = deliveryTempo(line, delivery);
        await render(tempo);
        const factor = voiceTempoFactor(voiceId, line.text, motionWavData(await fs.promises.readFile(temp)).length / 2 / C.SAMPLE_RATE * tempo);
        if (Math.abs(factor - 1) > MOTION_VOICE_SPEED.REPROCESS_DELTA) await render(_.clamp(tempo * factor, MOTION_VOICE_SPEED.MIN, MOTION_VOICE_SPEED.MAX));
        const wav = await fs.promises.readFile(temp);
        const { start, length, availableBytes } = motionWavData(wav);
        if (!length || length > availableBytes) throw new Error(C.FAILED);
        await fs.promises.writeFile(temp, Buffer.concat([motionWavHeader(length, 1), wav.subarray(start, start + length)]));
        fs.renameSync(temp, file);
      } finally {
        await fs.promises.rm(temp, { force: true }).catch(() => {});
      }
    }
    if (!opts.asr || words) break;
    const result = await checkClip(file, line, language, opts);
    if (!result) break;
    if (result.error <= C.ASR.MAX_ERROR || check >= C.ASR.RETRIES) {
      if (result.error > C.ASR.MAX_ERROR) opts.log?.(C.ASR.KEPT(line.text, result.error));
      words = result.words;
      await fs.promises.writeFile(wordsFile, JSON.stringify(words));
      break;
    }
    opts.log?.(C.ASR.RETRY(line.text, result.error));
    await fs.promises.rm(file, { force: true });
    await fs.promises.rm(path.join(vieneuRoot(), MR.MOTION_TEXT_CLIPS, rawId), { force: true });
  }
  const bytes = fs.statSync(file).size - 44;
  return { id, bytes, duration: bytes / 2 / C.SAMPLE_RATE, ...(words ? { words } : {}) };
};
type VoiceClipLayout = { beatId: string; line: MotionUtterance; voiceId: string; audio: SpeechClipAudio; t: number; delivery: MotionVoiceDelivery }[];
const voicePlan = async (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, opts: MotionVoiceOptions, deps: MotionVoiceDependencies): Promise<MotionVoicePlan> => directMotionVoice(script, analysis, await (deps.voices || listMotionVoices)(opts.signal, opts.log), opts);
type Pacing = (typeof PACE)["HORROR"];
const PACE_KIND = PACE.KIND;
export const motionVoicePacing = (analysis: MotionStoryAnalysis | null): Pacing | null => {
  const target = readVoiceSpeedSettings().target;
  const p = target?.pauses;
  if (p) return { ...PACE.HORROR, key: PACE.MEASURED_KEY, narrationTempo: 1, dialogueTempo: 1, clauseGap: p.clause ?? p.sentence, sentenceGap: p.sentence, suspenseGap: p.suspense, revealGap: _.round((p.sentence + p.suspense) / 2, 2), gaps: { FIRST: [PACE.FIRST_MIN, p.sentence], SAME_SPEAKER: [p.sentence * PACE.SAME_SHARE, p.suspense], SPEAKER_CHANGE: [p.sentence, p.suspense], BEAT_END: [p.suspense, p.beat] } } as unknown as Pacing;
  if (!(analysis && PACE.HORROR_RE.test([analysis.videoGenre, analysis.genre, analysis.genre2, analysis.sfxMood, analysis.musicMood].join(MR.MOTION_TEXT_SYMBOL_13)))) return null;
  return target ? ({ ...PACE.HORROR, narrationTempo: 1, dialogueTempo: 1 } as unknown as Pacing) : PACE.HORROR;
};
export const motionPacedLines = (line: MotionUtterance, pacing: Pacing | null): { line: MotionUtterance; gap: number }[] => {
  if (!pacing || line.role !== MR.MOTION_TEXT_NARRATION) return [{ line, gap: 0 }];
  const words = (x: string) => _.compact(x.split(PACE.WORD_RE)).length;
  const parts: { text: string; clause: boolean }[] = [];
  for (const sentence of _.compact(_.map(line.text.match(PACE.SENTENCE_RE) || [line.text], _.trim))) {
    const clauses: string[] = [];
    for (const piece of _.compact(_.map(sentence.split(PACE.CLAUSE_RE), _.trim))) {
      const last = clauses.length - 1;
      if (last >= 0 && (words(piece) < PACE.MIN_WORDS || words(clauses[last]) < PACE.MIN_WORDS) && words(clauses[last]) + words(piece) <= PACE.MAX_PHRASE_WORDS) clauses[last] += MR.MOTION_TEXT_SYMBOL_13 + piece;
      else clauses.push(piece);
    }
    _.forEach(clauses, (text, k) => {
      const last = parts.length - 1;
      if (k === 0 && last >= 0 && words(text) < PACE.MIN_WORDS) parts[last].text += MR.MOTION_TEXT_SYMBOL_13 + text;
      else parts.push({ text, clause: false });
      if (k < clauses.length - 1) parts[parts.length - 1].clause = true;
    });
  }
  if (parts.length < 2) return [{ line, gap: 0 }];
  return _.map(parts, ({ text, clause }, k) => {
    const next = parts[k + 1]?.text;
    const gap = !next ? 0 : PACE.SUSPENSE_END_RE.test(text) ? pacing.suspenseGap : clause ? pacing.clauseGap : words(next) <= pacing.revealWords ? pacing.revealGap : pacing.sentenceGap;
    return { line: { ...line, id: line.id + PACE.SUFFIX + k, text, emphasis: _.filter(line.emphasis || [], (w) => _.includes(text, w)) }, gap };
  });
};
const pacedGap = (value: number, kind: keyof Pacing["gaps"], pacing: Pacing | null, cap: number): number => (pacing ? _.clamp(value, pacing.gaps[kind][0], pacing.gaps[kind][1]) : Math.min(value, cap));
const layoutMotionVoice = async (plan: MotionVoicePlan, script: MotionStoryScript, opts: MotionVoiceOptions, deps: MotionVoiceDependencies, pacing: Pacing | null = null): Promise<{ local: VoiceClipLayout; durations: number[] }> => {
  const local: VoiceClipLayout = [],
    durations: number[] = [];
  const totalLines = plan.beats.reduce((sum, beat) => sum + beat.utterances.length, 0);
  let split = 0;
  let done = 0;
  const moods: Record<string, number> = {};
  let ai33 = 0;
  for (const beat of plan.beats) {
    const sceneMood = script.beats.find((item) => item.id === beat.id)?.sceneMood;
    let cursor = 0;
    for (let index = 0; index < beat.utterances.length; index++) {
      const line = beat.utterances[index],
        previous = beat.utterances[index - 1],
        next = beat.utterances[index + 1];
      if (opts.signal?.aborted) throw new Error(C.CANCELLED);
      const voiceId = plan.roles.find((role) => role.speaker === line.speaker)?.voiceId || plan.roles[0].voiceId;
      const delivery = resolveMotionDelivery(line, sceneMood);
      if (delivery.strength) moods[delivery.mood] = (moods[delivery.mood] || 0) + 1;
      if (delivery.strength && isAi33Voice(voiceId)) ai33++;
      const paced = pacing ? { ...delivery, tempo: delivery.tempo * (line.role === MR.MOTION_TEXT_NARRATION ? pacing.narrationTempo : pacing.dialogueTempo) } : delivery;
      const pieces = motionPacedLines(line, pacing);
      if (pieces.length > 1) split++;
      const gapBefore = previous ? 0 : pacedGap(line.pauseBefore * delivery.pause, PACE_KIND.FIRST, pacing, C.PAUSE.FIRST),
        gapAfter = pacedGap(Math.max(line.pauseAfter, next?.pauseBefore || 0) * delivery.pause, !next ? PACE_KIND.BEAT_END : next.speaker === line.speaker ? PACE_KIND.SAME_SPEAKER : PACE_KIND.SPEAKER_CHANGE, pacing, !next ? C.PAUSE.BEAT_END : next.speaker === line.speaker ? C.PAUSE.SAME_SPEAKER : C.PAUSE.SPEAKER_CHANGE);
      cursor += gapBefore;
      for (const piece of pieces) {
        const audio = await speechClip(piece.line, voiceId, script.language, opts, deps, paced);
        local.push({ beatId: beat.id, line: piece.line, voiceId, audio, t: cursor, delivery: paced });
        cursor += audio.duration + piece.gap;
      }
      cursor += gapAfter;
      opts.onProgress?.(++done, totalLines);
    }
    durations.push(Math.max(0.6, cursor));
  }
  if (!totalLines) throw new Error(C.EMPTY);
  opts.log?.(D.LOG(moods, ai33));
  if (pacing) opts.log?.(PACE.LOG(pacing.key, split));
  return { local, durations };
};
export const measureMotionVoice = async (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, opts: MotionVoiceOptions, deps: MotionVoiceDependencies = {}): Promise<MotionVoiceTiming> => {
  const plan = await voicePlan(script, analysis, opts, deps);
  const { local, durations } = await layoutMotionVoice(plan, script, opts, deps, motionVoicePacing(analysis));
  return {
    signature: plan.signature,
    beats: Object.fromEntries(plan.beats.map((beat, index) => [beat.id, { duration: durations[index], lines: local.filter((item) => item.beatId === beat.id).map((item) => ({ id: item.line.id, speaker: item.line.speaker, text: item.line.text, from: +item.t.toFixed(3), to: +(item.t + item.audio.duration).toFixed(3) })) }])),
  };
};
export const buildMotionVoiceTrack = async (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, opts: MotionVoiceOptions, deps: MotionVoiceDependencies = {}): Promise<MotionVoiceTrack> => {
  const plan = await voicePlan(script, analysis, opts, deps);
  const pacing = motionVoicePacing(analysis);
  const id = C.PREFIX + hash([C.VERSION, C.TRACK_VERSION, C.PACKAGE, plan, opts.aspect, script.gen?.staging, opts.asr === true, ...(pacing ? [PACE.VERSION, pacing] : [])]) + MR.MOTION_TEXT_WAV,
    folder = getMotionAudioDirectory(),
    file = path.join(folder, id),
    metadata = file + MR.MOTION_TEXT_JSON;
  try {
    const cached = JSON.parse(fs.readFileSync(metadata, MR.MOTION_TEXT_UTF8)) as MotionVoiceTrack;
    if (cached.signature === plan.signature && cached.provider === C.PROVIDER && fs.statSync(file).size > 44 && cached.clips?.every((clip) => fs.existsSync(path.join(folder, clip.audioId)))) return cached;
  } catch {}
  const running = active.get(id);
  if (running) return running;
  const task = (async (): Promise<MotionVoiceTrack> => {
    opts.log?.(C.GENERATING);
    const { local, durations } = await layoutMotionVoice(plan, script, opts, deps, pacing);
    const timeline = computeBeatTimeline(script.beats, durations),
      temporary = file + randomUUID() + MR.MOTION_TEXT_WAV,
      frames = Math.ceil(timeline.total * C.SAMPLE_RATE),
      visual = compileStorySpec(script, analysis, { aspect: opts.aspect || MR.MOTION_TEXT_16_9, durations }).spec;
    const clips = local.map((item) => {
      const index = script.beats.findIndex((beat) => beat.id === item.beatId);
      const start = timeline.starts[index] + item.t;
      return { id: item.line.id, beatId: item.beatId, speaker: item.line.speaker, voiceId: item.voiceId, text: item.line.text, audioId: item.audio.id, start, end: start + item.audio.duration, delivery: item.delivery, ...(item.audio.words ? { words: item.audio.words } : {}) };
    });
    const handle = await fs.promises.open(temporary, MR.MOTION_TEXT_W);
    try {
      try {
        await handle.write(motionWavHeader(frames * 4, 2));
        const silence = Buffer.alloc(C.SAMPLE_RATE * 4);
        let written = 0;
        const padTo = async (target: number): Promise<void> => {
          while (written < target) {
            const count = Math.min(C.SAMPLE_RATE, target - written);
            await handle.write(silence, 0, count * 4);
            written += count;
          }
        };
        for (let index = 0; index < local.length; index++) {
          if (opts.signal?.aborted) throw new Error(C.CANCELLED);
          const target = Math.round(clips[index].start * C.SAMPLE_RATE);
          await padTo(target);
          const audio = await fs.promises.readFile(path.join(folder, local[index].audio.id));
          const item = local[index],
            beatIndex = script.beats.findIndex((beat) => beat.id === item.beatId),
            staging: any = script.gen?.staging?.[item.beatId],
            actor = staging?.actors?.find((actor: any) => actor.cast === item.line.speaker);
          const pan = item.line.role === MR.MOTION_TEXT_NARRATION || item.line.role === MR.MOTION_TEXT_THOUGHT ? 0 : Math.max(-0.35, Math.min(0.35, motionSoundSpatial(visual, clips[index].start, actor, durations[beatIndex], item.t).pan || 0));
          const stereo = Buffer.alloc(item.audio.bytes * 2),
            gain = item.delivery.gain;
          for (let sample = 0; sample < item.audio.bytes / 2; sample++) {
            const value = audio.readInt16LE(44 + sample * 2) * gain;
            stereo.writeInt16LE(Math.round(Math.max(-32767, Math.min(32767, value * Math.sqrt((1 - pan) / 2)))), sample * 4);
            stereo.writeInt16LE(Math.round(Math.max(-32767, Math.min(32767, value * Math.sqrt((1 + pan) / 2)))), sample * 4 + 2);
          }
          await handle.write(stereo);
          written += item.audio.bytes / 2;
        }
        await padTo(frames);
      } finally {
        await handle.close();
      }
      if (opts.signal?.aborted) throw new Error(C.CANCELLED);
      fs.renameSync(temporary, file);
    } finally {
      await fs.promises.rm(temporary, { force: true }).catch(() => {});
    }
    const track: MotionVoiceTrack = { audioId: id, provider: C.PROVIDER, voiceId: C.MODEL, signature: plan.signature, durations, totalSeconds: timeline.total, plan, clips, subtitles: clips.map((clip) => ({ start: clip.start, end: clip.end, text: clip.text, speaker: clip.speaker })) };
    writeMotionJsonAtomic(metadata, track);
    return track;
  })();
  active.set(id, task);
  try {
    return await task;
  } finally {
    active.delete(id);
  }
};
export const fitUploadedVoice = (beats: MotionBeat[], estimates: number[], audioSeconds: number): number[] => {
  const { total } = computeBeatTimeline(beats, estimates),
    speech = estimates.reduce((sum, duration) => sum + duration, 0),
    overhead = total - speech - MOTION_STORY_CONFIG.TAIL_SECONDS;
  const k = Math.max(0.3, (audioSeconds - overhead) / Math.max(1, speech));
  return estimates.map((estimate) => estimate * k);
};
export const buildSfxTrack = async (durationSeconds: number, cues: unknown, _mood?: string, signal?: AbortSignal): Promise<string | undefined> => (await buildMotionSoundTrack(durationSeconds, cues, {}, signal)).sfxId;
export const readMotionVoiceTrack = (id: unknown, script: MotionStoryScript, analysis: MotionStoryAnalysis | null = null): MotionVoiceTrack | undefined => {
  if (typeof id !== MR.MOTION_TEXT_STRING || !P.VOICE_TRACK.test(id as string)) return;
  const file = path.join(getMotionAudioDirectory(), id as string);
  try {
    const track = JSON.parse(fs.readFileSync(file + MR.MOTION_TEXT_JSON, MR.MOTION_TEXT_UTF8)) as MotionVoiceTrack;
    if (track.provider === C.PROVIDER && track.signature === motionVoiceSignature(script, analysis) && fs.statSync(file).size > 44) return track;
  } catch {}
};
