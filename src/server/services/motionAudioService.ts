import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { MOTION_VOICE as C } from "../../constants/motionVoice.js";
import { MOTION_STORY_CONFIG } from "../../constants/motionVideo.js";
import type { MotionBeat, MotionVoiceTrack, MotionStoryScript, MotionStoryAnalysis, MotionVoicePreset, MotionUtterance } from "../../types/motionVideo.js";
import { computeBeatTimeline, compileStorySpec } from "./motionDirectorService.js";
import { motionSoundSpatial } from "../../lib/motionSoundPlan.js";
import { directedSpeechText, motionVoiceSignature } from "../../lib/motionVoice.js";
import { getMotionAudioDirectory } from "./motionLibraryService.js";
import { directMotionVoice, type MotionVoiceOptions } from "./motionVoiceDirectionService.js";
import { listVieneuVoices, synthesizeVieneuSpeech, vieneuRoot } from "./vieneuTtsService.js";
import { buildMotionSoundTrack, motionWavHeader, runMotionAudioProcess } from "./motionSoundMixService.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
import { motionAudioHash as hash } from "./motionAudioUtils.js";
const active = new Map<string, Promise<MotionVoiceTrack>>();
export interface MotionVoiceDependencies { voices?: (signal?: AbortSignal, log?: (value: string) => void) => Promise<MotionVoicePreset[]>; synthesize?: typeof synthesizeVieneuSpeech; }
const deliverySpeed = (line: MotionUtterance): number => Math.max(0.93, Math.min(1.12, line.speed * ({ neutral: 1, warm: 0.99, serious: 0.98, tense: 1, surprised: 1.04, sad: 0.96, excited: 1.06 }[line.emotion] || 1)));
const speechClip = async (line: MotionUtterance, voiceId: string, opts: MotionVoiceOptions, deps: MotionVoiceDependencies): Promise<{ id: string; bytes: number; duration: number }> => {
  const id = C.CLIP_PREFIX + hash([C.VERSION, C.CLIP_VERSION, C.PACKAGE, line.text, voiceId, line.emotion, line.speed, line.emphasis]) + MR.MOTION_TEXT_WAV,
    file = path.join(getMotionAudioDirectory(), id);
  if (!fs.existsSync(file) || fs.statSync(file).size < 48) {
    const original = path.join(vieneuRoot(), MR.MOTION_TEXT_CLIPS, id),
      temp = file + randomUUID() + MR.MOTION_TEXT_WAV;
    fs.mkdirSync(path.dirname(original), { recursive: true });
    try {
      let failure: unknown;
      for (let attempt = 0; attempt < 2; attempt++) {
        if (opts.signal?.aborted) throw new Error(C.CANCELLED);
        try {
          await (deps.synthesize || synthesizeVieneuSpeech)(directedSpeechText(line), voiceId, original, opts.signal, opts.log);
          failure = undefined;
          break;
        } catch (error) {
          failure = error;
          if (opts.signal?.aborted) throw error;
        }
      }
      if (failure) throw failure;
      await runMotionAudioProcess([MR.MOTION_TEXT_I, original, MR.MOTION_TEXT_AF, MR.MOTION_TEMPLATE_ATEMPO_HIGHPASS_F_65_DYNAUDNORM_F_150_G_5_P_0_75_M_3_AFADE_T(deliverySpeed(line).toFixed(3)), MR.MOTION_TEXT_AR, String(C.SAMPLE_RATE), MR.MOTION_TEXT_AC, MR.MOTION_TEXT_1, MR.MOTION_TEXT_C_A, MR.MOTION_TEXT_PCM_S16LE, MR.MOTION_TEXT_F, MR.MOTION_TEXT_WAV_2, temp], opts.signal);
      const wav = await fs.promises.readFile(temp);
      const offset = wav.indexOf(Buffer.from(MR.MOTION_TEXT_DATA), 12),
        length = offset >= 0 ? wav.readUInt32LE(offset + 4) : 0;
      if (!length || length > wav.length - offset - 8) throw new Error(C.FAILED);
      await fs.promises.writeFile(temp, Buffer.concat([motionWavHeader(length, 1), wav.subarray(offset + 8, offset + 8 + length)]));
      fs.renameSync(temp, file);
    } finally {
      await fs.promises.rm(temp, { force: true }).catch(() => {});
    }
  }
  const bytes = fs.statSync(file).size - 44;
  return { id, bytes, duration: bytes / 2 / C.SAMPLE_RATE };
};
export const buildMotionVoiceTrack = async (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, opts: MotionVoiceOptions, deps: MotionVoiceDependencies = {}): Promise<MotionVoiceTrack> => {
  const voices = await (deps.voices || listVieneuVoices)(opts.signal, opts.log),
    plan = await directMotionVoice(script, analysis, voices, opts);
  const id = C.PREFIX + hash([C.VERSION, C.TRACK_VERSION, C.PACKAGE, plan, opts.aspect, script.gen?.staging]) + MR.MOTION_TEXT_WAV,
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
    const local: { beatId: string; line: MotionUtterance; voiceId: string; audio: { id: string; bytes: number; duration: number }; t: number }[] = [],
      durations: number[] = [];
    const totalLines = plan.beats.reduce((sum, beat) => sum + beat.utterances.length, 0);
    let done = 0;
    for (const beat of plan.beats) {
      let cursor = 0;
      for (let index = 0; index < beat.utterances.length; index++) {
        const line = beat.utterances[index],
          previous = beat.utterances[index - 1],
          next = beat.utterances[index + 1];
        if (opts.signal?.aborted) throw new Error(C.CANCELLED);
        const voiceId = plan.roles.find((role) => role.speaker === line.speaker)?.voiceId || plan.roles[0].voiceId;
        const audio = await speechClip(line, voiceId, opts, deps);
        const gapBefore = previous ? 0 : Math.min(line.pauseBefore, C.PAUSE.FIRST),
          gapAfter = Math.min(Math.max(line.pauseAfter, next?.pauseBefore || 0), !next ? C.PAUSE.BEAT_END : next.speaker === line.speaker ? C.PAUSE.SAME_SPEAKER : C.PAUSE.SPEAKER_CHANGE);
        cursor += gapBefore;
        local.push({ beatId: beat.id, line, voiceId, audio, t: cursor });
        cursor += audio.duration + gapAfter;
        opts.onProgress?.(++done, totalLines);
      }
      durations.push(Math.max(0.6, cursor));
    }
    if (!totalLines) throw new Error(C.EMPTY);
    const timeline = computeBeatTimeline(script.beats, durations),
      temporary = file + randomUUID() + MR.MOTION_TEXT_WAV,
      frames = Math.ceil(timeline.total * C.SAMPLE_RATE),
      visual = compileStorySpec(script, analysis, { aspect: opts.aspect || MR.MOTION_TEXT_16_9, durations }).spec;
    const clips = local.map((item) => {
      const index = script.beats.findIndex((beat) => beat.id === item.beatId);
      const start = timeline.starts[index] + item.t;
      return { id: item.line.id, beatId: item.beatId, speaker: item.line.speaker, voiceId: item.voiceId, text: item.line.text, audioId: item.audio.id, start, end: start + item.audio.duration };
    });
    const handle = await fs.promises.open(temporary, MR.MOTION_TEXT_W);
    try {
      try {
        await handle.write(motionWavHeader(frames * 4, 2));
        const silence = Buffer.alloc(C.SAMPLE_RATE * 4);
        let written = 0;
        for (let index = 0; index < local.length; index++) {
          if (opts.signal?.aborted) throw new Error(C.CANCELLED);
          const target = Math.round(clips[index].start * C.SAMPLE_RATE);
          while (written < target) {
            const count = Math.min(C.SAMPLE_RATE, target - written);
            await handle.write(silence, 0, count * 4);
            written += count;
          }
          const audio = await fs.promises.readFile(path.join(folder, local[index].audio.id));
          const item = local[index],
            beatIndex = script.beats.findIndex((beat) => beat.id === item.beatId),
            staging: any = script.gen?.staging?.[item.beatId],
            actor = staging?.actors?.find((actor: any) => actor.cast === item.line.speaker);
          const pan = item.line.role === MR.MOTION_TEXT_NARRATION || item.line.role === MR.MOTION_TEXT_THOUGHT ? 0 : Math.max(-0.35, Math.min(0.35, motionSoundSpatial(visual, clips[index].start, actor, durations[beatIndex], item.t).pan || 0));
          const stereo = Buffer.alloc(item.audio.bytes * 2),
            gain = item.line.emotion === MR.MOTION_TEXT_SAD ? 0.9 : item.line.emotion === MR.MOTION_TEXT_EXCITED ? 1.05 : 1;
          for (let sample = 0; sample < item.audio.bytes / 2; sample++) {
            const value = audio.readInt16LE(44 + sample * 2) * gain;
            stereo.writeInt16LE(Math.round(Math.max(-32767, Math.min(32767, value * Math.sqrt((1 - pan) / 2)))), sample * 4);
            stereo.writeInt16LE(Math.round(Math.max(-32767, Math.min(32767, value * Math.sqrt((1 + pan) / 2)))), sample * 4 + 2);
          }
          await handle.write(stereo);
          written += item.audio.bytes / 2;
        }
        while (written < frames) {
          const count = Math.min(C.SAMPLE_RATE, frames - written);
          await handle.write(silence, 0, count * 4);
          written += count;
        }
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
  if (typeof id !== "string" || !/^voice-vieneu-[a-f0-9]{32}\.wav$/.test(id)) return;
  const file = path.join(getMotionAudioDirectory(), id);
  try {
    const track = JSON.parse(fs.readFileSync(file + MR.MOTION_TEXT_JSON, MR.MOTION_TEXT_UTF8)) as MotionVoiceTrack;
    if (track.provider === C.PROVIDER && track.signature === motionVoiceSignature(script, analysis) && fs.statSync(file).size > 44) return track;
  } catch {}
};
