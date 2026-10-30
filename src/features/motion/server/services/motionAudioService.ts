import * as COMMON_RUNTIME from "../../../../constants/sourceText.js";
import { RUNTIME_VALUES } from "../../../../constants/runtime/values.js";
import { parseJson } from "../../../../lib/jsonStringify.js";
import { findVoiceChannel, voiceChannelRef } from "./motionVoiceLibraryService.js";
import { motionSpeechRateProfile, recordSpeechRate } from "./motionSpeechRateService.js";
import * as MR from "../../../../constants/motionRuntime.js";
import { stringifyJson } from "../../../../lib/jsonStringify.js";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { MOTION_VOICE as C, MOTION_VOICE_DELIVERY as D, MOTION_VOICE_FX as FX, MOTION_VOICE_PACING as PACE, MOTION_VOICE_PATTERNS as P, MOTION_VOICE_SPEED, MOTION_VOICE_QUALITY as Q } from "../../../../constants/motionVoice.js";
import { knownVoiceTempoFactor, readVoiceSpeedSettings, voiceSpeedKey, voiceTempoFactor, voiceSpeedUsesAcoustics, voiceUsesReferenceSpeed, withMotionVoiceSpeedSnapshot } from "./motionVoiceSpeedService.js";
import { MOTION_STORY_CONFIG } from "../../../../constants/motionVideo.js";
import type { MotionBeat, MotionVoiceTrack, MotionStoryScript, MotionStoryAnalysis, MotionVoicePreset, MotionUtterance, MotionVoiceDelivery, MotionVoicePlan, MotionVoiceClipQuality, MotionVoiceCadence } from "../../../../types/motionVideo.js";
import { computeBeatTimeline, compileStorySpec } from "./motionDirectorService.js";
import { motionSoundSpatial } from "../../../../lib/motionSoundPlan.js";
import { directedSpeechText, isAi33Voice, motionVoiceFilter, motionVoiceSignature, resolveMotionDelivery, motionLanguageCode, motionNarratorCastKey } from "../../../../lib/motionVoice.js";
import { getMotionAudioDirectory } from "./motionLibraryService.js";
import { directMotionVoice, type MotionVoiceOptions } from "./motionVoiceDirectionService.js";
import { transcribeVieneuAudio, vieneuRoot, type VieneuDelivery } from "../../../../server/services/vieneuTtsService.js";
import { listMotionVoices, synthesizeMotionSpeech } from "./motionVoiceSourceService.js";
import { buildMotionSoundTrack, motionWavHeader, runMotionAudioProcess } from "./motionSoundMixService.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
import { measureVoicePaceFile, measureVoiceCadenceFile } from "./motionVoicePaceService.js";
import { normalizeReferenceVoiceCadence, referenceCadenceProfile } from "./motionVoiceCadenceService.js";
import _ from "lodash";
import { motionAudioHash as hash, motionWavData, motionWavFileInfo } from "./motionAudioUtils.js";
import { motionVoiceSignal, trimMotionVoiceEdges, motionVoiceBoundaryPadding, compareMotionVoiceText, motionSupportedTranscript } from "./motionVoiceQualityService.js";
import { puppetStoryboardInputKey, puppetStoryboardCovers } from "../../../../lib/motionStoryboard.js";
import { collectPuppetLines } from "../../../../lib/motionPuppet.js";
import { speechUnits } from "./motionSpeechRateService.js";
const active = new Map<string, Promise<MotionVoiceTrack>>();
const voiceTrackSpeedKey = (plan: MotionVoicePlan): string => hash([PACE.VERSION, cadenceProfile(), readVoiceSpeedSettings().target?.pauses, _.uniq(plan.roles.map((role) => role.voiceId)).map((voiceId) => [voiceId, voiceSpeedKey(voiceId), knownVoiceTempoFactor(voiceId)])]);
const cadenceProfile = () => referenceCadenceProfile(readVoiceSpeedSettings().target, readVoiceSpeedSettings().correction);
const referenceNarration = (line: MotionUtterance, voiceId: string, paced: boolean) => (paced && line.role === MR.MOTION_TEXT_NARRATION && voiceUsesReferenceSpeed(voiceId) ? cadenceProfile() : undefined);
export interface MotionVoiceDependencies {
  voices?: (signal?: AbortSignal, log?: (value: string) => void) => Promise<MotionVoicePreset[]>;
  synthesize?: typeof synthesizeMotionSpeech;
  transcribe?: typeof transcribeVieneuAudio;
}
const deliveryTempo = (line: MotionUtterance, delivery: MotionVoiceDelivery): number => _.clamp(_.clamp(line.speed || 1, C.TEMPO.SPEED_MIN, C.TEMPO.SPEED_MAX) * delivery.tempo, C.TEMPO.MIN, C.TEMPO.MAX);
const directedBase = (line: MotionUtterance): string => directedSpeechText({ ...line, emotion: MR.MOTION_TEXT_NEUTRAL as MotionUtterance["emotion"] });
const legacyEngineDelivery = (voiceId: string, delivery: MotionVoiceDelivery): VieneuDelivery => (isAi33Voice(voiceId) ? {} : { temperature: delivery.temperature, silence: delivery.silence, pauses: readVoiceSpeedSettings().target?.pauses });
const engineDelivery = (voiceId: string, delivery: MotionVoiceDelivery): VieneuDelivery => {
  const engine = legacyEngineDelivery(voiceId, delivery);
  return engine.pauses ? { ...engine, pauses: _.pick(engine.pauses, [RUNTIME_VALUES.CLAUSE_9D96E17F, RUNTIME_VALUES.SENTENCE_821119D7, COMMON_RUNTIME.SOURCE_TEXT_BEAT] as string[]) } : engine;
};
const speechTokens = (text: string): string[] => _.compact(text.toLowerCase().normalize(C.ASR.NORMALIZE).split(C.ASR.TOKEN_RE));
const voiceTextPassed = (result: { error: number; errorRun: number }): boolean => result.error <= C.ASR.MAX_ERROR && result.errorRun < C.ASR.MAX_ERROR_RUN;
const voiceClipRateLimit = (line: MotionUtterance, language: unknown): number | undefined => {
  const target = readVoiceSpeedSettings().target;
  const reference = target?.rateBasis === MOTION_VOICE_SPEED.BASIS.TEXT ? target.rate * PACE.REFERENCE_RATE_MARGIN : undefined;
  const dialogue = line.role !== MR.MOTION_TEXT_NARRATION ? PACE.DIALOGUE_RATE[motionLanguageCode(language)] : undefined;
  return reference && dialogue ? Math.min(reference, dialogue) : reference || dialogue;
};
type ClipWords = [number, number][];
interface SpeechClipAudio {
  cadence?: MotionVoiceCadence;
  id: string;
  bytes: number;
  duration: number;
  words?: ClipWords;
  leading: number;
  trailing: number;
  quality: MotionVoiceClipQuality;
}
const checkClip = async (file: string, line: MotionUtterance, language: unknown, opts: MotionVoiceOptions, deps: MotionVoiceDependencies): Promise<{ error: number; errorRun: number; heard: string; words: ClipWords } | null> => {
  try {
    const recognized = await (deps.transcribe || transcribeVieneuAudio)(file, language === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI, opts.signal, opts.log);
    const result = motionSupportedTranscript(await fs.promises.readFile(file), recognized);
    if (recognized.words.length && !result.words.length) throw new Error(RUNTIME_VALUES.NHAN_DANG_CHI_CO_TU_NAM_NGOAI_TIENG_NOI_CAN_NGHE_LAI_KHONG_COI_L_B4231C91);
    return { ...compareMotionVoiceText(line.text, result.text), heard: result.text, words: _.map(result.words, (word) => [word.s, word.e] as [number, number]) };
  } catch (error) {
    if (opts.signal?.aborted) throw error;
    opts.log?.(C.ASR.UNAVAILABLE(_.toString((error as Error)?.message || error)));
    return null;
  }
};
const normalizeClip = (wav: Buffer): Buffer => {
  const { start, length } = motionWavData(wav);
  const n = Math.floor(length / 2),
    N = FX.NORM;
  let energy = 0,
    count = 0,
    peak = 0;
  for (let f = 0; f < n; f += N.FRAME) {
    const frames = Math.min(N.FRAME, n - f);
    let e = 0;
    for (let i = 0; i < frames; i++) {
      const v = wav.readInt16LE(start + (f + i) * 2) / 32768;
      e += v * v;
      peak = Math.max(peak, Math.abs(v));
    }
    if (10 * Math.log10(e / frames + 1e-12) > N.ACTIVE_DB) {
      energy += e;
      count += frames;
    }
  }
  if (!count) return wav;
  const rms = Math.sqrt(energy / count);
  const gain = _.clamp(Math.min(Math.pow(10, N.TARGET_DB / 20) / rms, N.PEAK / Math.max(peak, 1e-6)), N.MIN_GAIN, N.MAX_GAIN);
  const out = Buffer.from(wav);
  for (let i = 0; i < n; i++) out.writeInt16LE(Math.round(_.clamp(wav.readInt16LE(start + i * 2) * gain, -32767, 32767)), start + i * 2);
  return out;
};
const clipJobs = new Map<string, Promise<SpeechClipAudio>>();
const speechClip = (line: MotionUtterance, voiceId: string, language: unknown, opts: MotionVoiceOptions, deps: MotionVoiceDependencies, delivery: MotionVoiceDelivery, paced = false, preset?: number | null): Promise<SpeechClipAudio> => {
  const key = hash([line.text, line.speed, line.emotion, line.intensity, line.role, voiceId, language, delivery, engineDelivery(voiceId, delivery), voiceSpeedKey(voiceId), voiceClipRateLimit(line, language), referenceNarration(line, voiceId, paced), paced, preset, opts.asr === true]);
  const running = clipJobs.get(key);
  if (running) return running;
  const job = speechClipOnce(line, voiceId, language, opts, deps, delivery, paced, preset).finally(() => clipJobs.delete(key));
  clipJobs.set(key, job);
  return job;
};
const speechClipOnce = async (line: MotionUtterance, voiceId: string, language: unknown, opts: MotionVoiceOptions, deps: MotionVoiceDependencies, delivery: MotionVoiceDelivery, paced = false, preset?: number | null): Promise<SpeechClipAudio> => {
  const spoken = directedSpeechText(line);
  const known = preset !== undefined ? preset : knownVoiceTempoFactor(voiceId);
  const reference = referenceNarration(line, voiceId, paced);
  const legacyRawId = C.CLIP_PREFIX + hash([C.VERSION, C.CLIP_VERSION, C.PACKAGE, language, line.text, voiceId, D.VERSION, legacyEngineDelivery(voiceId, delivery), ...(spoken !== directedBase(line) ? [spoken] : [])]) + MR.MOTION_TEXT_WAV;
  const rawId = C.CLIP_PREFIX + hash([C.VERSION, C.CLIP_VERSION, C.PACKAGE, language, line.text, voiceId, D.VERSION, engineDelivery(voiceId, delivery), ...(spoken !== directedBase(line) ? [spoken] : [])]) + MR.MOTION_TEXT_WAV,
    id = C.CLIP_PREFIX + hash([rawId, C.TEMPO, line.role, line.speed, delivery.tempo, known, FX.VERSION, Q.VERSION, opts.asr === true, C.ASR.VERSION, motionVoiceFilter(line, delivery, 1), paced, reference, ...(paced ? [PACE.VERSION, PACE.DIALOGUE_RATE, voiceClipRateLimit(line, language)] : [])]) + MR.MOTION_TEXT_WAV,
    file = path.join(getMotionAudioDirectory(), id),
    wordsFile = file + C.ASR.WORDS_EXT,
    checkFile = file + C.ASR.CHECK_EXT;
  let words: ClipWords | undefined;
  let cadence: MotionVoiceCadence | undefined;
  let quality: MotionVoiceClipQuality = { status: Q.STATUS.UNCHECKED };
  let cachedClipValid = false;
  try {
    motionVoiceSignal(fs.readFileSync(file));
    cachedClipValid = true;
  } catch {}
  try {
    const saved = parseJson(fs.readFileSync(checkFile, MR.MOTION_TEXT_UTF8));
    if (saved.version === C.ASR.VERSION && saved.text === line.text && saved.checked === !!opts.asr && cachedClipValid) {
      quality = saved.quality;
      cadence = saved.cadence;
      if (quality.status === Q.STATUS.PASSED && fs.existsSync(wordsFile)) words = parseJson(fs.readFileSync(wordsFile, MR.MOTION_TEXT_UTF8));
    }
  } catch {}
  if (opts.asr && [Q.STATUS.REVIEW, Q.STATUS.UNAVAILABLE].includes(quality.status as any) && Date.now() - (quality.verifiedAt || 0) >= C.ASR.RECHECK_MS) {
    const rechecked = await checkClip(file, line, language, opts, deps);
    quality = rechecked ? { status: voiceTextPassed(rechecked) ? Q.STATUS.PASSED : Q.STATUS.REVIEW, error: rechecked.error, errorRun: rechecked.errorRun, heard: rechecked.heard, verifiedAt: Date.now() } : { status: Q.STATUS.UNAVAILABLE, verifiedAt: Date.now() };
    if (rechecked && voiceTextPassed(rechecked)) words = rechecked.words;
  }
  let best: { wav: Buffer; result: Awaited<ReturnType<typeof checkClip>>; cadence?: MotionVoiceCadence } | undefined;
  for (let check = 0; ; check++) {
    try {
      if (known === null || !cachedClipValid || check > 0) {
        const original = path.join(vieneuRoot(), MR.MOTION_TEXT_CLIPS, check ? rawId + randomUUID() + MR.MOTION_TEXT_WAV : rawId),
          temp = file + randomUUID() + MR.MOTION_TEXT_WAV;
        fs.mkdirSync(path.dirname(original), { recursive: true });
        try {
          let failure: unknown;
          for (let attempt = 0; attempt < 2; attempt++) {
            if (opts.signal?.aborted) throw new Error(C.CANCELLED);
            try {
              const legacy = path.join(vieneuRoot(), MR.MOTION_TEXT_CLIPS, legacyRawId);
              if (!check && !fs.existsSync(original) && legacy !== original && fs.existsSync(legacy)) {
                try {
                  motionVoiceSignal(await fs.promises.readFile(legacy));
                  await fs.promises.copyFile(legacy, original);
                } catch {}
              }
              if (!(fs.existsSync(original) && fs.statSync(original).size >= 48)) await (deps.synthesize || synthesizeMotionSpeech)(spoken, voiceId, original, opts.signal, opts.log, engineDelivery(voiceId, delivery));
              motionVoiceSignal(await fs.promises.readFile(original));
              failure = undefined;
              break;
            } catch (error) {
              failure = error;
              if (opts.signal?.aborted) throw error;
              await fs.promises.rm(original, { force: true });
              opts.log?.(Q.RETRY);
            }
          }
          if (failure) throw failure;
          const render = (value: number) => runMotionAudioProcess([MR.MOTION_TEXT_I, original, MR.MOTION_TEXT_AF, motionVoiceFilter(line, delivery, value), MR.MOTION_TEXT_AR, String(C.SAMPLE_RATE), MR.MOTION_TEXT_AC, MR.MOTION_TEXT_1, MR.MOTION_TEXT_C_A, MR.MOTION_TEXT_PCM_S16LE, MR.MOTION_TEXT_F, MR.MOTION_TEXT_WAV_2, temp], opts.signal);
          const tempo = paced ? delivery.tempo : deliveryTempo(line, delivery);
          const scaled = (factor: number): number => (Math.abs(factor - 1) > MOTION_VOICE_SPEED.REPROCESS_DELTA ? _.clamp(tempo * factor, MOTION_VOICE_SPEED.MIN, MOTION_VOICE_SPEED.MAX) : tempo);
          const first = reference ? 1 : known === null ? tempo : scaled(known);
          await render(first);
          let rendered: Buffer = await fs.promises.readFile(temp);
          let acousticRate: number | undefined;
          if (known === null && voiceSpeedUsesAcoustics()) {
            try {
              acousticRate = (await measureVoiceCadenceFile(original, opts.signal)).rate;
            } catch (error) {
              if (opts.signal?.aborted) throw error;
            }
          }
          const factor = known === null ? voiceTempoFactor(voiceId, line.text, (motionWavData(rendered).length / 2 / C.SAMPLE_RATE) * first, acousticRate) : known;
          if (!reference && known === null && scaled(factor) !== tempo) {
            await render(scaled(factor));
            rendered = await fs.promises.readFile(temp);
          }
          const units = speechUnits(line.text);
          const rate = voiceClipRateLimit(line, language);
          cadence = undefined;
          if (reference) {
            try {
              const matched = await normalizeReferenceVoiceCadence(temp, line.text, reference, opts.signal);
              if (matched) {
                rendered = matched.wav;
                cadence = matched.cadence;
              }
            } catch (error) {
              if (opts.signal?.aborted) throw error;
              opts.log?.(PACE.CADENCE_ERROR(_.toString((error as Error)?.message || error)));
            }
            if (!cadence) {
              opts.log?.(PACE.CADENCE_FALLBACK);
              await render(scaled(factor));
              rendered = await fs.promises.readFile(temp);
            }
          }
          const duration = motionWavData(trimMotionVoiceEdges(rendered)).duration;
          if (!cadence && paced && rate && units >= PACE.DIALOGUE_MIN_UNITS && units / duration > rate) {
            await render(((scaled(factor) * duration * rate) / units) * PACE.DIALOGUE_RATE_MARGIN);
            rendered = await fs.promises.readFile(temp);
          }
          const wav = normalizeClip(trimMotionVoiceEdges(rendered));
          const { start, length, availableBytes } = motionWavData(wav);
          if (!length || length > availableBytes) throw new Error(C.FAILED);
          await fs.promises.writeFile(temp, Buffer.concat([motionWavHeader(length, 1), wav.subarray(start, start + length)]));
          fs.renameSync(temp, file);
        } finally {
          await fs.promises.rm(temp, { force: true }).catch(() => {});
          if (check) await fs.promises.rm(original, { force: true }).catch(() => {});
        }
      }
    } catch (error) {
      if (opts.signal?.aborted || !best?.result) throw error;
      await fs.promises.writeFile(file, best.wav);
      cadence = best.cadence;
      quality = { status: Q.STATUS.REVIEW, error: best.result.error, heard: best.result.heard };
      opts.log?.(C.ASR.KEPT(line.text, best.result.error));
      break;
    }
    motionVoiceSignal(await fs.promises.readFile(file));
    if (!opts.asr || quality.status === Q.STATUS.PASSED || quality.status === Q.STATUS.REVIEW || (quality.status === Q.STATUS.UNAVAILABLE && !!quality.verifiedAt)) break;
    const result = await checkClip(file, line, language, opts, deps);
    if (!best || (result && (!best.result || (voiceTextPassed(result) && !voiceTextPassed(best.result)) || (voiceTextPassed(result) === voiceTextPassed(best.result) && result.error < best.result.error)))) best = { wav: await fs.promises.readFile(file), result, cadence };
    if (!result || voiceTextPassed(result) || check >= C.ASR.RETRIES) {
      await fs.promises.writeFile(file, best.wav);
      cadence = best.cadence;
      quality = best.result ? { status: voiceTextPassed(best.result) ? Q.STATUS.PASSED : Q.STATUS.REVIEW, error: best.result.error, errorRun: best.result.errorRun, heard: best.result.heard } : { status: Q.STATUS.UNAVAILABLE };
      if (quality.status === Q.STATUS.REVIEW) opts.log?.(C.ASR.KEPT(line.text, best.result!.error));
      if (quality.status === Q.STATUS.PASSED) words = best.result!.words;
      break;
    }
    opts.log?.(C.ASR.RETRY(line.text, result.error));
  }
  if (words) await fs.promises.writeFile(wordsFile, stringifyJson(words));
  else await fs.promises.rm(wordsFile, { force: true });
  quality.verifiedAt ||= Date.now();
  writeMotionJsonAtomic(checkFile, { version: C.ASR.VERSION, text: line.text, checked: !!opts.asr, quality, ...(cadence ? { cadence } : {}) });
  const signal = motionVoiceSignal(await fs.promises.readFile(file));
  const bytes = motionWavFileInfo(file).length;
  return { id, bytes, duration: bytes / 2 / C.SAMPLE_RATE, leading: signal.leading, trailing: signal.trailing, quality, ...(cadence ? { cadence } : {}), ...(words ? { words } : {}) };
};
type VoiceClipLayout = { beatId: string; line: MotionUtterance; voiceId: string; audio: SpeechClipAudio; t: number; delivery: MotionVoiceDelivery }[];
const voicePlan = async (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, opts: MotionVoiceOptions, deps: MotionVoiceDependencies): Promise<MotionVoicePlan> => directMotionVoice(script, analysis, await (deps.voices || listMotionVoices)(opts.signal, opts.log), opts);
type Pacing = Omit<(typeof PACE)["HORROR"], "key"> & { key: string };
const PACE_KIND = PACE.KIND;
export const motionVoicePacing = (analysis: MotionStoryAnalysis | null): Pacing | null => {
  const target = readVoiceSpeedSettings().target;
  const p = target?.pauses;
  if (p)
    return {
      ...PACE.HORROR,
      key: PACE.MEASURED_KEY,
      narrationTempo: 1,
      dialogueTempo: 1,
      clauseGap: p.clause ?? p.sentence,
      sentenceGap: p.sentence,
      suspenseGap: p.suspense,
      revealGap: _.round((p.sentence + p.suspense) / 2, 2),
      gaps: { FIRST: [PACE.FIRST_MIN, p.sentence], SAME_SPEAKER: [p.sentence * PACE.SAME_SHARE, p.suspense], SPEAKER_CHANGE: [p.sentence, p.suspense], BEAT_END: [p.suspense, p.beat] },
    } as unknown as Pacing;
  if (!(analysis && PACE.HORROR_RE.test([analysis.videoGenre, analysis.genre, analysis.genre2, analysis.sfxMood, analysis.musicMood].join(MR.MOTION_TEXT_SYMBOL_13)))) return null;
  return PACE.HORROR;
};
export const motionPacedLines = (line: MotionUtterance, _pacing: Pacing | null): { line: MotionUtterance; gap: number }[] => [{ line, gap: 0 }];
const runClipPool = async <T, R>(items: T[], limit: number, signal: AbortSignal | undefined, fn: (item: T) => Promise<R>): Promise<R[]> => {
  const out: R[] = new Array(items.length);
  let next = 0,
    failed = false;
  const lane = async (): Promise<void> => {
    while (!failed && next < items.length) {
      if (signal?.aborted) throw new Error(C.CANCELLED);
      const index = next++;
      try {
        out[index] = await fn(items[index]);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, lane));
  return out;
};
const pacedGap = (value: number, kind: keyof Pacing["gaps"], pacing: Pacing | null, cap: number): number => (pacing ? _.clamp(value, pacing.gaps[kind][0], pacing.gaps[kind][1]) : Math.min(value, cap));
export const motionVoiceSemanticGap = (line: MotionUtterance, next: MotionUtterance | undefined, pacing: Pacing, chapterChanged = false): number => {
  if (chapterChanged) return PACE.CHAPTER_PAUSE;
  if (!next) return pacing.gaps.BEAT_END[0];
  const text = line.text.trim().replace(PACE.CLOSING_MARKS_RE, MR.MOTION_TEXT_EMPTY);
  if (PACE.SUSPENSE_END_RE.test(text)) return pacing.suspenseGap;
  if (PACE.CLAUSE_END_RE.test(text)) return pacing.clauseGap;
  if (PACE.QUESTION_END_RE.test(text)) return pacing.sentenceGap * PACE.QUESTION_SHARE;
  if (!PACE.SENTENCE_END_RE.test(text)) return pacing.clauseGap * PACE.CONTINUATION_SHARE;
  return pacing.sentenceGap * (next.speaker === line.speaker ? 1 : PACE.RESPONSE_SHARE);
};
const layoutMotionVoice = async (plan: MotionVoicePlan, script: MotionStoryScript, opts: MotionVoiceOptions, deps: MotionVoiceDependencies, pacing: Pacing | null = null): Promise<{ local: VoiceClipLayout; durations: number[] }> => {
  const local: VoiceClipLayout = [],
    durations: number[] = [];
  const totalLines = plan.beats.reduce((sum, beat) => sum + beat.utterances.length, 0);
  let split = 0;
  let done = 0;
  const ordered = plan.beats.flatMap((beat) => beat.utterances.map((line) => ({ beat, line })));
  let orderedIndex = 0;
  const moods: Record<string, number> = {};
  let ai33 = 0;
  const lines: { beatId: string; voiceId: string; paced: MotionVoiceDelivery; narration: boolean; pieces: { line: MotionUtterance; gap: number }[]; gapBefore: number; gapAfter: number }[][] = [];
  for (const beat of plan.beats) {
    const sceneMood = script.beats.find((item) => item.id === beat.id)?.sceneMood;
    lines.push(
      beat.utterances.map((line, index) => {
        const previous = pacing ? ordered[orderedIndex - 1]?.line : beat.utterances[index - 1],
          nextEntry = ordered[orderedIndex + 1],
          next = pacing ? nextEntry?.line : beat.utterances[index + 1];
        orderedIndex++;
        const voiceId = plan.roles.find((role) => role.speaker === (line.voiceSpeaker || line.speaker))?.voiceId || plan.roles[0].voiceId;
        const delivery = resolveMotionDelivery(line, sceneMood);
        if (delivery.strength) moods[delivery.mood] = (moods[delivery.mood] || 0) + 1;
        if (delivery.strength && isAi33Voice(voiceId)) ai33++;
        const narration = line.role === MR.MOTION_TEXT_NARRATION;
        const base = pacing ? { ...delivery, ...(narration ? { tempo: pacing.narrationTempo, temperature: PACE.NARRATION_TEMPERATURE, silence: PACE.NARRATION_SILENCE, pause: 1, gain: 1, strength: Math.min(delivery.strength, PACE.NARRATION_STRENGTH) } : { tempo: pacing.dialogueTempo, temperature: PACE.NARRATION_TEMPERATURE, silence: PACE.NARRATION_SILENCE }) } : delivery;
        const paced = { ...base, tempo: base.tempo * (pacing?.key === PACE.MEASURED_KEY ? 1 : narration ? C.TEMPO.NARRATION_SCALE : C.TEMPO.DIALOGUE_SCALE) };
        const pieces = motionPacedLines(line, pacing);
        if (pieces.length > 1) split++;
        const gapBefore = previous ? 0 : pacedGap(line.pauseBefore * paced.pause, PACE_KIND.FIRST, pacing, C.PAUSE.FIRST);
        let gapAfter = pacedGap(
          Math.max(line.pauseAfter * paced.pause, (next?.pauseBefore || 0) * paced.pause, pacing && next?.speaker === line.speaker ? pacing.sentenceGap : 0),
          !next ? PACE_KIND.BEAT_END : next.speaker === line.speaker ? PACE_KIND.SAME_SPEAKER : PACE_KIND.SPEAKER_CHANGE,
          pacing,
          !next ? C.PAUSE.BEAT_END : next.speaker === line.speaker ? C.PAUSE.SAME_SPEAKER : C.PAUSE.SPEAKER_CHANGE,
        );
        if (pacing) {
          const chapter = script.beats.find((item) => item.id === beat.id)?.chapterId;
          const nextChapter = nextEntry && script.beats.find((item) => item.id === nextEntry.beat.id)?.chapterId;
          gapAfter = Math.max(motionVoiceSemanticGap(line, next, pacing, !!nextEntry && chapter !== nextChapter), Math.min(Math.max(line.pauseAfter, next?.pauseBefore || 0) * paced.pause, pacing.gaps.BEAT_END[1]));
        }
        return { beatId: beat.id, voiceId, paced, narration, pieces, gapBefore, gapAfter };
      }),
    );
  }
  const flat = lines.flat();
  const factors: Record<string, number | null> = Object.fromEntries(_.map(_.uniq(_.map(flat, (item) => item.voiceId)), (voiceId) => [voiceId, knownVoiceTempoFactor(voiceId)]));
  for (const voiceId of Object.keys(factors))
    if (factors[voiceId] === null) {
      if (flat.filter((item) => item.voiceId === voiceId).every((item) => item.pieces.every((piece) => !!referenceNarration(piece.line, voiceId, !!pacing)))) {
        factors[voiceId] = 1;
        continue;
      }
      const sample = flat.flatMap((item) => (item.voiceId === voiceId ? item.pieces.map((piece) => ({ item, piece })) : [])).find(({ piece }) => speechTokens(piece.line.text).length >= MOTION_VOICE_SPEED.MIN_UNITS);
      if (sample) {
        await speechClip(sample.piece.line, voiceId, script.language, { ...opts, asr: false }, deps, sample.item.paced, !!pacing, null);
        factors[voiceId] = knownVoiceTempoFactor(voiceId) ?? 1;
      } else factors[voiceId] = 1;
    }
  const audios = await runClipPool(flat, C.CLIP_PARALLEL, opts.signal, async (item) => {
    const out = [];
    for (const piece of item.pieces) out.push(speechClip(piece.line, item.voiceId, script.language, opts, deps, item.paced, !!pacing, factors[item.voiceId]));
    const ready = await Promise.all(out);
    opts.onProgress?.(++done, totalLines);
    return ready;
  });
  let k = 0;
  for (const beatLines of lines) {
    let cursor = 0;
    for (const item of beatLines) {
      const clips = audios[k++];
      cursor += motionVoiceBoundaryPadding(item.gapBefore, 0, clips[0]?.leading);
      item.pieces.forEach((piece, p) => {
        local.push({ beatId: item.beatId, line: piece.line, voiceId: item.voiceId, audio: clips[p], t: cursor, delivery: item.paced });
        cursor += clips[p].duration + motionVoiceBoundaryPadding(piece.gap, clips[p].trailing, clips[p + 1]?.leading);
      });
      cursor += motionVoiceBoundaryPadding(item.gapAfter, clips[clips.length - 1]?.trailing, audios[k]?.[0]?.leading);
    }
    durations.push(Math.max(0.6, cursor));
  }
  if (!totalLines) throw new Error(C.EMPTY);
  opts.log?.(D.LOG(moods, ai33));
  if (pacing) opts.log?.(PACE.LOG(pacing.key, split));
  const measured = local.flatMap((item) => (item.audio.cadence ? [item.audio.cadence] : []));
  if (measured.length)
    opts.log?.(
      PACE.CADENCE_LOG(
        measured.length,
        Math.min(...measured.map((item) => item.after)),
        Math.max(...measured.map((item) => item.after)),
        measured[0].target,
        measured.filter((item) => item.limited).length,
        measured.reduce((sum, item) => sum + (item.pausesMatched || 0), 0),
        measured.reduce((sum, item) => sum + (item.pausesExpected || 0), 0),
      ),
    );
  const checks = local.map((item) => item.audio.quality.status);
  if (opts.asr) opts.log?.(Q.SUMMARY(checks.filter((status) => status === Q.STATUS.REVIEW).length, checks.filter((status) => status === Q.STATUS.UNAVAILABLE).length));
  return { local, durations };
};
export const buildMotionVoiceTrack = (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, opts: MotionVoiceOptions, deps: MotionVoiceDependencies = {}): Promise<MotionVoiceTrack> =>
  withMotionVoiceSpeedSnapshot(async () => {
    const rateProfile = motionSpeechRateProfile(script.voiceChannel);
    const rememberRate = (track: MotionVoiceTrack): MotionVoiceTrack => {
      if (!deps.synthesize) {
        const measured = recordSpeechRate(script, track.totalSeconds, rateProfile);
        if (measured) opts.log?.(MOTION_STORY_CONFIG.SPEECH_RATE_MEASURED(measured));
      }
      return track;
    };
    const plan = await voicePlan(script, analysis, opts, deps);
    const pacing = motionVoicePacing(analysis);
    const speedKey = voiceTrackSpeedKey(plan);
    const id = C.PREFIX + hash([C.VERSION, C.TRACK_VERSION, C.PACKAGE, speedKey, plan, opts.aspect, script.gen?.staging, opts.asr === true, ...(pacing ? [PACE.VERSION, pacing] : [])]) + MR.MOTION_TEXT_WAV,
      folder = getMotionAudioDirectory(),
      file = path.join(folder, id),
      metadata = file + MR.MOTION_TEXT_JSON;
    try {
      const cached = parseJson(fs.readFileSync(metadata, MR.MOTION_TEXT_UTF8)) as MotionVoiceTrack;
      if (cached.signature === plan.signature && cached.provider === C.PROVIDER && cached.speedKey === speedKey && motionVoiceTrackFilesValid(cached, script) && cached.clips?.every((clip) => !opts.asr || ![Q.STATUS.REVIEW, Q.STATUS.UNAVAILABLE].includes(clip.quality?.status as any) || Date.now() - (clip.quality?.verifiedAt || 0) < C.ASR.RECHECK_MS)) {
        return rememberRate(cached);
      }
    } catch {}
    const running = active.get(id);
    if (running) return running;
    const task = (async (): Promise<MotionVoiceTrack> => {
      opts.log?.(C.GENERATING);
      const { local, durations } = await layoutMotionVoice(plan, script, opts, deps, pacing);
      const puppet = script.gen?.puppet;
      const sources = puppet?.storyboard ? collectPuppetLines(script, MR.MOTION_TEXT_SCENE, motionNarratorCastKey(analysis)) : [];
      const visualReady = !puppet ? !!Object.keys(script.gen?.staging || {}).length : !!analysis && !!puppet.storyboard && puppet.storyboard.inputKey === puppetStoryboardInputKey(sources, analysis) && puppetStoryboardCovers(puppet.storyboard, sources) && puppet.storyboard.units.every((unit) => !!puppet.frames[unit.key]);
      const timeline = computeBeatTimeline(script.beats, durations, !!pacing),
        temporary = file + randomUUID() + MR.MOTION_TEXT_WAV,
        frames = Math.ceil(timeline.total * C.SAMPLE_RATE),
        visual = visualReady ? compileStorySpec(script, analysis, { aspect: opts.aspect || MR.MOTION_TEXT_16_9, durations, continuousVoice: !!pacing }).spec : undefined;
      const clips = local.map((item) => {
        const index = script.beats.findIndex((beat) => beat.id === item.beatId);
        const start = timeline.starts[index] + item.t;
        return {
          id: item.line.id,
          beatId: item.beatId,
          speaker: item.line.speaker,
          ...(item.line.voiceSpeaker ? { voiceSpeaker: item.line.voiceSpeaker } : {}),
          voiceId: item.voiceId,
          text: item.line.text,
          audioId: item.audio.id,
          start,
          end: start + item.audio.duration,
          delivery: item.delivery,
          quality: item.audio.quality,
          ...(item.audio.cadence ? { cadence: item.audio.cadence } : {}),
          ...(item.audio.words ? { words: item.audio.words } : {}),
        };
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
            const pcm = motionWavData(audio);
            const item = local[index],
              beatIndex = script.beats.findIndex((beat) => beat.id === item.beatId),
              staging: any = script.gen?.staging?.[item.beatId],
              actor = staging?.actors?.find((actor: any) => actor.cast === item.line.speaker);
            const pan = !visual || item.line.role === MR.MOTION_TEXT_NARRATION || item.line.role === MR.MOTION_TEXT_THOUGHT ? 0 : Math.max(-0.35, Math.min(0.35, motionSoundSpatial(visual, clips[index].start, actor, durations[beatIndex], item.t).pan || 0));
            const stereo = Buffer.alloc(item.audio.bytes * 2),
              gain = item.delivery.gain;
            for (let sample = 0; sample < item.audio.bytes / 2; sample++) {
              const value = audio.readInt16LE(pcm.start + sample * 2) * gain;
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
      const track: MotionVoiceTrack = { continuous: !!pacing, speedKey: voiceTrackSpeedKey(plan), audioId: id, provider: C.PROVIDER, voiceId: C.MODEL, signature: plan.signature, durations, totalSeconds: timeline.total, plan, clips, subtitles: clips.map((clip) => ({ start: clip.start, end: clip.end, text: clip.text, speaker: clip.speaker })) };
      writeMotionJsonAtomic(metadata, track);
      await measureVoicePaceFile(file, opts.signal)
        .then((r) => opts.log?.(C.LOG_PACE(r)))
        .catch(_.noop);
      return rememberRate(track);
    })();
    active.set(id, task);
    try {
      return await task;
    } finally {
      active.delete(id);
    }
  });
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
    const track = parseJson(fs.readFileSync(file + MR.MOTION_TEXT_JSON, MR.MOTION_TEXT_UTF8)) as MotionVoiceTrack;
    if (track.provider === C.PROVIDER && track.signature === motionVoiceSignature(script, analysis, voiceChannelRef(findVoiceChannel(script.voiceChannel)) || script.voiceChannel) && (!track.plan || track.speedKey === voiceTrackSpeedKey(track.plan)) && track.audioId === id && motionVoiceTrackFilesValid(track, script)) return track;
  } catch {}
};
export const motionVoiceTrackFilesValid = (track: MotionVoiceTrack, script: MotionStoryScript): boolean => {
  try {
    if (!P.VOICE_TRACK.test(track.audioId) || !Number.isFinite(track.totalSeconds) || track.totalSeconds <= 0 || track.durations?.length !== script.beats.length || track.durations.some((value) => !Number.isFinite(value) || value <= 0) || !track.clips?.length) return false;
    const file = motionWavFileInfo(path.join(getMotionAudioDirectory(), track.audioId));
    if (file.sampleRate !== C.SAMPLE_RATE || file.channels !== 2 || Math.abs(file.duration - track.totalSeconds) > 0.1) return false;
    const beatIds = new Set(script.beats.map((beat) => beat.id));
    const covered = new Set<string>();
    let previousEnd = 0;
    for (const clip of track.clips) {
      if (!beatIds.has(clip.beatId) || !clip.text?.trim() || path.basename(clip.audioId) !== clip.audioId || !Number.isFinite(clip.start) || !Number.isFinite(clip.end) || clip.start < previousEnd - 0.001 || clip.end <= clip.start || clip.end > track.totalSeconds + 0.1) return false;
      const audio = motionWavFileInfo(path.join(getMotionAudioDirectory(), clip.audioId));
      if (audio.sampleRate !== C.SAMPLE_RATE || audio.channels !== 1 || Math.abs(audio.duration - (clip.end - clip.start)) > 0.1) return false;
      covered.add(clip.beatId);
      previousEnd = clip.end;
    }
    return script.beats.every(
      (beat) =>
        covered.has(beat.id) &&
        speechTokens(
          track
            .clips!.filter((clip) => clip.beatId === beat.id)
            .map((clip) => clip.text)
            .join(MR.MOTION_TEXT_SYMBOL_13),
        ).join(MR.MOTION_TEXT_SYMBOL_13) === speechTokens(beat.narration).join(MR.MOTION_TEXT_SYMBOL_13),
    );
  } catch {
    return false;
  }
};
