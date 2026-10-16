import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { MOTION_VOICE as C, MOTION_VOICE_PROMPT, MOTION_VOICE_LIBRARY } from "../../constants/motionVoice.js";
import { applyVoiceLibrary, findVoiceChannel } from "./motionVoiceLibraryService.js";
import { MOTION_AUDIO_DIRECTION, MOTION_AUDIO_CAST_PROMPT } from "../../constants/motionAudioDirection.js";
import { motionAudioDirection } from "../../lib/motionAudioDirection.js";
import { motionVoiceSignature, motionVoiceSpeaks, normalizeMotionUtterances, fallbackMotionUtterances, selectMotionVoiceRoles } from "../../lib/motionVoice.js";
import type { MotionStoryScript, MotionStoryAnalysis, MotionVoicePlan, MotionAiExecution, MotionVoicePreset } from "../../types/motionVideo.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import { runMotionAi } from "./motionStoryService.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
export interface MotionVoiceOptions { exec: MotionAiExecution; aspect?: string; signal?: AbortSignal; log?: (value: string) => void; onProgress?: (done: number, total: number) => void; ai?: typeof runMotionAi; }
export const directMotionVoice = async (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, voices: MotionVoicePreset[], opts: MotionVoiceOptions): Promise<MotionVoicePlan> => {
  const channel = findVoiceChannel(script.voiceChannel),
    pinned = new Set<string>(channel ? [channel.narratorVoiceId, ...Object.values(channel.roleVoices || {})] : []);
  const library = applyVoiceLibrary(voices),
    spoken = library.filter((voice) => pinned.has(voice.id) || motionVoiceSpeaks(voice, script.language));
  voices = spoken.length ? spoken : library;
  const signature = motionVoiceSignature(script, analysis),
    speakers = [C.NARRATOR, ...(analysis?.cast || []).map((member) => member.key)];
  const planFile = path.join(
    getMotionRootDirectory(),
    MR.MOTION_TEXT_TTS_CACHE,
    createHash(MR.MOTION_TEXT_SHA256)
      .update(signature + JSON.stringify(analysis?.cast || []))
      .digest(MR.MOTION_TEXT_HEX) + MR.MOTION_TEXT_PLAN_JSON,
  );
  let saved: MotionVoicePlan | undefined;
  try {
    saved = JSON.parse(fs.readFileSync(planFile, MR.MOTION_TEXT_UTF8));
  } catch {}
  if (saved?.signature === signature && saved.version === C.VERSION && saved.roles.every((role) => voices.some((voice) => voice.id === role.voiceId && (!role.gender || voice.gender === role.gender))) && (!channel || saved.roles.some((role) => role.speaker === C.NARRATOR && role.voiceId === channel.narratorVoiceId))) return saved;
  opts.log?.(C.PLANNING);
  let casting: any;
  const stride = Math.max(1, Math.ceil(script.beats.reduce((total, beat) => total + beat.narration.length, 0) / MOTION_AUDIO_DIRECTION.MAX_CONTEXT));
  try {
    casting = await (opts.ai || runMotionAi)(
      [
        MOTION_AUDIO_CAST_PROMPT,
        JSON.stringify({
          title: script.title,
          direction: motionAudioDirection(script, analysis),
          analysis: { title: analysis?.title, logline: analysis?.logline, genre: analysis?.genre, factual: analysis?.factual, format: analysis?.videoDna?.format, audience: analysis?.videoDna?.audienceProfile, cast: analysis?.cast },
          scriptExcerpts: script.beats.filter((_beat, index) => index % stride === 0).map((beat) => ({ id: beat.id, narration: beat.narration })),
          voices,
        }),
      ].join(MR.MOTION_TEXT_SYMBOL_27),
      MOTION_AUDIO_DIRECTION.ARTIFACT,
      opts.exec,
      opts.signal,
      opts.log,
    );
  } catch (error) {
    if (opts.signal?.aborted) throw error;
    opts.log?.(C.PLAN_FALLBACK);
  }
  const direction = motionAudioDirection(script, analysis, casting?.audioDirection),
    requested: Record<string, string> = {},
    inferred: Record<string, { gender?: "male" | "female"; age?: string }> = {};
  for (const role of Array.isArray(casting?.roles) ? casting.roles : []) {
    if (!speakers.includes(role?.speaker)) continue;
    if (voices.some((voice) => voice.id === role.voiceId)) requested[role.speaker] = role.voiceId;
    inferred[role.speaker] = { gender: ([MR.MOTION_TEXT_MALE, MR.MOTION_TEXT_FEMALE] as readonly string[]).includes(role.gender) ? role.gender : undefined, age: ([MR.MOTION_TEXT_CHILD, MR.MOTION_TEXT_ADULT, MR.MOTION_TEXT_SENIOR] as readonly string[]).includes(role.age) ? role.age : undefined };
  }
  const roles = selectMotionVoiceRoles(analysis, voices, requested, direction, inferred, channel);
  if (channel) opts.log?.(MOTION_VOICE_LIBRARY.LOCKED_LOG + channel.name);
  const planned = new Map<string, MotionVoicePlan["beats"][number]>();
  for (const beat of script.beats) {
    const explicit = normalizeMotionUtterances(script.voiceSettings?.utterances?.[beat.id] || beat.utterances, beat.id, speakers, beat.narration),
      unvoiced = speakers.length > 1 && explicit.every((line) => line.speaker === C.NARRATOR) && C.DIRECT_SPEECH_RE.test(beat.narration);
    if (explicit.length && !unvoiced) planned.set(beat.id, { id: beat.id, utterances: explicit });
  }
  const pending = script.beats.filter((beat) => !planned.has(beat.id));
  for (let index = 0; index < pending.length; index += C.BATCH) {
    if (opts.signal?.aborted) throw new Error(C.CANCELLED);
    const group = pending.slice(index, index + C.BATCH);
    try {
      const response = await (opts.ai || runMotionAi)([MOTION_VOICE_PROMPT, JSON.stringify({ direction, cast: analysis?.cast, beats: group.map((beat) => ({ id: beat.id, narration: beat.narration, cast: beat.cast, action: beat.action, scenePlan: beat.scenePlan })) })].join(MR.MOTION_TEXT_SYMBOL_27), C.ARTIFACT, opts.exec, opts.signal, opts.log);
      for (const item of Array.isArray(response?.beats) ? response.beats : []) {
        const beat = group.find((entry) => entry.id === item.id);
        if (!beat) continue;
        const utterances = normalizeMotionUtterances(item.utterances, beat.id, speakers, beat.narration);
        if (utterances.length) planned.set(beat.id, { id: beat.id, utterances });
      }
    } catch (error) {
      if (opts.signal?.aborted) throw error;
      opts.log?.(C.PLAN_FALLBACK);
    }
    for (const beat of group) if (!planned.has(beat.id)) planned.set(beat.id, { id: beat.id, utterances: fallbackMotionUtterances(beat.id, beat.narration) });
  }
  const plan = { version: C.VERSION, signature, direction, roles, beats: script.beats.map((beat) => planned.get(beat.id)!) };
  fs.mkdirSync(path.dirname(planFile), { recursive: true });
  writeMotionJsonAtomic(planFile, plan);
  return plan;
};
