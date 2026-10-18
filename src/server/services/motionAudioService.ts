import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { MOTION_VOICE as C, MOTION_VOICE_DELIVERY as D, MOTION_VOICE_PATTERNS as P } from "../../constants/motionVoice.js";
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
import { speechUnits } from "./motionSpeechRateService.js";
import _ from "lodash";
import { motionAudioHash as hash, motionWavData } from "./motionAudioUtils.js";
const active = new Map<string, Promise<MotionVoiceTrack>>();
export interface MotionVoiceDependencies { voices?: (signal?: AbortSignal, log?: (value: string) => void) => Promise<MotionVoicePreset[]>; synthesize?: typeof synthesizeMotionSpeech; }
const deliveryTempo = (line: MotionUtterance, delivery: MotionVoiceDelivery, language: unknown, seconds: number): number => {
  const units = speechUnits(line.text),
    target = language === MR.MOTION_TEXT_EN ? C.TEMPO.TARGET.en : C.TEMPO.TARGET.vi;
  return units && seconds > 0 ? _.clamp((target * _.clamp(line.speed || 1, C.TEMPO.SPEED_MIN, C.TEMPO.SPEED_MAX) * delivery.tempo * seconds) / units, C.TEMPO.MIN, C.TEMPO.MAX) : 1;
};
const engineDelivery = (voiceId: string, delivery: MotionVoiceDelivery): VieneuDelivery => (isAi33Voice(voiceId) ? {} : { temperature: delivery.temperature, silence: delivery.silence });
const wavSeconds = (wav: Buffer): number => {
  const { length, availableBytes } = motionWavData(wav);
  return (length ? Math.min(length, availableBytes) : 0) / 2 / C.SAMPLE_RATE;
};
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
  const id = C.CLIP_PREFIX + hash([C.VERSION, C.CLIP_VERSION, C.PACKAGE, C.TEMPO, language, line.text, voiceId, line.speed, D.VERSION, engineDelivery(voiceId, delivery), delivery.tempo]) + MR.MOTION_TEXT_WAV,
    file = path.join(getMotionAudioDirectory(), id),
    wordsFile = file + C.ASR.WORDS_EXT;
  let words: ClipWords | undefined;
  try {
    if (fs.existsSync(file) && fs.existsSync(wordsFile)) words = JSON.parse(fs.readFileSync(wordsFile, MR.MOTION_TEXT_UTF8));
  } catch {}
  for (let check = 0; ; check++) {
    if (!fs.existsSync(file) || fs.statSync(file).size < 48) {
      const original = path.join(vieneuRoot(), MR.MOTION_TEXT_CLIPS, id),
        temp = file + randomUUID() + MR.MOTION_TEXT_WAV,
        measured = file + randomUUID() + MR.MOTION_TEXT_WAV;
      fs.mkdirSync(path.dirname(original), { recursive: true });
      try {
        let failure: unknown;
        for (let attempt = 0; attempt < 2; attempt++) {
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
        const encode = (source: string, tempo: number) =>
          runMotionAudioProcess([MR.MOTION_TEXT_I, source, MR.MOTION_TEXT_AF, MR.MOTION_TEMPLATE_ATEMPO_HIGHPASS_F_65_DYNAUDNORM_F_150_G_5_P_0_75_M_3_AFADE_T(tempo.toFixed(3)), MR.MOTION_TEXT_AR, String(C.SAMPLE_RATE), MR.MOTION_TEXT_AC, MR.MOTION_TEXT_1, MR.MOTION_TEXT_C_A, MR.MOTION_TEXT_PCM_S16LE, MR.MOTION_TEXT_F, MR.MOTION_TEXT_WAV_2, temp], opts.signal);
        await encode(original, 1);
        const tempo = deliveryTempo(line, delivery, language, wavSeconds(await fs.promises.readFile(temp)));
        if (Math.abs(tempo - 1) > 0.005) {
          await fs.promises.rename(temp, measured);
          await encode(measured, tempo);
        }
        const wav = await fs.promises.readFile(temp);
        const { start, length, availableBytes } = motionWavData(wav);
        if (!length || length > availableBytes) throw new Error(C.FAILED);
        await fs.promises.writeFile(temp, Buffer.concat([motionWavHeader(length, 1), wav.subarray(start, start + length)]));
        fs.renameSync(temp, file);
      } finally {
        await fs.promises.rm(temp, { force: true }).catch(() => {});
        await fs.promises.rm(measured, { force: true }).catch(() => {});
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
  }
  const bytes = fs.statSync(file).size - 44;
  return { id, bytes, duration: bytes / 2 / C.SAMPLE_RATE, ...(words ? { words } : {}) };
};
type VoiceClipLayout = { beatId: string; line: MotionUtterance; voiceId: string; audio: SpeechClipAudio; t: number; delivery: MotionVoiceDelivery }[];
const voicePlan = async (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, opts: MotionVoiceOptions, deps: MotionVoiceDependencies): Promise<MotionVoicePlan> => directMotionVoice(script, analysis, await (deps.voices || listMotionVoices)(opts.signal, opts.log), opts);
const layoutMotionVoice = async (plan: MotionVoicePlan, script: MotionStoryScript, opts: MotionVoiceOptions, deps: MotionVoiceDependencies): Promise<{ local: VoiceClipLayout; durations: number[] }> => {
  const local: VoiceClipLayout = [],
    durations: number[] = [];
  const totalLines = plan.beats.reduce((sum, beat) => sum + beat.utterances.length, 0);
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
      const audio = await speechClip(line, voiceId, script.language, opts, deps, delivery);
      const gapBefore = previous ? 0 : Math.min(line.pauseBefore * delivery.pause, C.PAUSE.FIRST),
        gapAfter = Math.min(Math.max(line.pauseAfter, next?.pauseBefore || 0) * delivery.pause, !next ? C.PAUSE.BEAT_END : next.speaker === line.speaker ? C.PAUSE.SAME_SPEAKER : C.PAUSE.SPEAKER_CHANGE);
      cursor += gapBefore;
      local.push({ beatId: beat.id, line, voiceId, audio, t: cursor, delivery });
      cursor += audio.duration + gapAfter;
      opts.onProgress?.(++done, totalLines);
    }
    durations.push(Math.max(0.6, cursor));
  }
  if (!totalLines) throw new Error(C.EMPTY);
  opts.log?.(D.LOG(moods, ai33));
  return { local, durations };
};
export const measureMotionVoice = async (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, opts: MotionVoiceOptions, deps: MotionVoiceDependencies = {}): Promise<MotionVoiceTiming> => {
  const plan = await voicePlan(script, analysis, opts, deps);
  const { local, durations } = await layoutMotionVoice(plan, script, opts, deps);
  return {
    signature: plan.signature,
    beats: Object.fromEntries(plan.beats.map((beat, index) => [beat.id, { duration: durations[index], lines: local.filter((item) => item.beatId === beat.id).map((item) => ({ id: item.line.id, speaker: item.line.speaker, text: item.line.text, from: +item.t.toFixed(3), to: +(item.t + item.audio.duration).toFixed(3) })) }])),
  };
};
export const buildMotionVoiceTrack = async (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, opts: MotionVoiceOptions, deps: MotionVoiceDependencies = {}): Promise<MotionVoiceTrack> => {
  const plan = await voicePlan(script, analysis, opts, deps);
  const id = C.PREFIX + hash([C.VERSION, C.TRACK_VERSION, C.PACKAGE, plan, opts.aspect, script.gen?.staging, opts.asr === true]) + MR.MOTION_TEXT_WAV,
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
    const { local, durations } = await layoutMotionVoice(plan, script, opts, deps);
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
