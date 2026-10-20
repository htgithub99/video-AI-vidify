import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { MOTION_VOICE as C, MOTION_VOICE_PROMPT, MOTION_VOICE_LIBRARY } from "../../constants/motionVoice.js";
import { applyVoiceLibrary, findVoiceChannel } from "./motionVoiceLibraryService.js";
import { MOTION_AUDIO_DIRECTION, MOTION_AUDIO_CAST_PROMPT } from "../../constants/motionAudioDirection.js";
import { motionAudioDirection, motionSpeakerTraits } from "../../lib/motionAudioDirection.js";
import { motionSceneType } from "../../constants/motionSceneCatalog.js";
import { motionVoiceSignature, motionVoiceSpeaks, normalizeMotionUtterances, fallbackMotionUtterances, selectMotionVoiceRoles, motionNarratorCastKey, motionNarratorLines } from "../../lib/motionVoice.js";
import type { MotionBeat, MotionStoryScript, MotionStoryAnalysis, MotionVoicePlan, MotionAiExecution, MotionVoicePreset } from "../../types/motionVideo.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import { mapMotionAiPool, resetMotionAiRoom, runMotionAi } from "./motionStoryService.js";
import _ from "lodash";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
export interface MotionVoiceOptions { exec: MotionAiExecution; aspect?: string; signal?: AbortSignal; log?: (value: string) => void; onProgress?: (done: number, total: number) => void; ai?: typeof runMotionAi; asr?: boolean; }
const typeAge = (type?: string): string | undefined => (motionSceneType(type)?.senior ? MR.MOTION_TEXT_SENIOR : _.findKey(C.TYPE_AGE, (ids) => _.includes(ids, type)));
const knownTraits = (analysis: MotionStoryAnalysis | null): Record<string, { gender?: "male" | "female"; age?: string }> =>
  _.fromPairs(
    _.map(analysis?.cast || [], (member) => {
      const traits = motionSpeakerTraits(member);
      return [member.key, { gender: traits.gender, age: traits.age || typeAge(member.type) }];
    }),
  );
const castingSettled = (analysis: MotionStoryAnalysis | null, voices: MotionVoicePreset[], direction: ReturnType<typeof motionAudioDirection>, channel: ReturnType<typeof findVoiceChannel>, fixed: Record<string, string>): boolean => {
  const speakers = [C.NARRATOR, ..._.map(analysis?.cast || [], MR.MOTION_TEXT_KEY)];
  if (_.every(speakers, (speaker) => fixed[speaker] && voices.some((voice) => voice.id === fixed[speaker]))) return true;
  if (!channel) return false;
  const traits = knownTraits(analysis);
  if (_.some(analysis?.cast || [], (member) => !traits[member.key].gender || !traits[member.key].age)) return false;
  try {
    return _.every(selectMotionVoiceRoles(analysis, voices, {}, direction, traits, channel, fixed), (role) => role.locked || fixed[role.speaker] === role.voiceId);
  } catch {
    return false;
  }
};
const fallbackBeat = (beat: MotionBeat): MotionVoicePlan["beats"][number] => ({ id: beat.id, utterances: fallbackMotionUtterances(beat.id, beat.narration) });
export const directMotionVoice = async (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, voices: MotionVoicePreset[], opts: MotionVoiceOptions): Promise<MotionVoicePlan> => {
  const channel = findVoiceChannel(script.voiceChannel),
    pinned = new Set<string>(channel ? [channel.narratorVoiceId, ...Object.values(channel.roleVoices || {})] : []);
  const library = applyVoiceLibrary(voices),
    spoken = library.filter((voice) => pinned.has(voice.id) || motionVoiceSpeaks(voice, script.language));
  voices = spoken.length ? spoken : library;
  const signature = motionVoiceSignature(script, analysis),
    speakers = [C.NARRATOR, ...(analysis?.cast || []).map((member) => member.key)],
    fixed = script.gen?.voiceCast || {};
  const planFile = path.join(
    getMotionRootDirectory(),
    MR.MOTION_TEXT_TTS_CACHE,
    createHash(MR.MOTION_TEXT_SHA256)
      .update(signature + JSON.stringify(analysis?.cast || []) + JSON.stringify(fixed) + JSON.stringify(channel || {}))
      .digest(MR.MOTION_TEXT_HEX) + MR.MOTION_TEXT_PLAN_JSON,
  );
  let saved: MotionVoicePlan | undefined;
  try {
    saved = JSON.parse(fs.readFileSync(planFile, MR.MOTION_TEXT_UTF8));
  } catch {}
  if (saved?.signature === signature && saved.version === C.PLAN_VERSION && saved.roles.every((role) => voices.some((voice) => voice.id === role.voiceId && (!role.gender || voice.gender === role.gender))) && (!channel || saved.roles.some((role) => role.speaker === C.NARRATOR && role.voiceId === channel.narratorVoiceId))) return saved;
  opts.log?.(C.PLANNING);
  let casting: any;
  const settled = castingSettled(analysis, voices, motionAudioDirection(script, analysis), channel, fixed);
  if (settled) opts.log?.(C.CASTING_SKIPPED);
  const stride = Math.max(1, Math.ceil(script.beats.reduce((total, beat) => total + beat.narration.length, 0) / MOTION_AUDIO_DIRECTION.MAX_CONTEXT));
  if (!settled)
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
    inferred: Record<string, { gender?: "male" | "female"; age?: string }> = knownTraits(analysis);
  for (const role of Array.isArray(casting?.roles) ? casting.roles : []) {
    if (!speakers.includes(role?.speaker)) continue;
    if (voices.some((voice) => voice.id === role.voiceId)) requested[role.speaker] = role.voiceId;
    inferred[role.speaker] = { gender: ([MR.MOTION_TEXT_MALE, MR.MOTION_TEXT_FEMALE] as readonly string[]).includes(role.gender) ? role.gender : inferred[role.speaker]?.gender, age: ([MR.MOTION_TEXT_CHILD, MR.MOTION_TEXT_ADULT, MR.MOTION_TEXT_SENIOR] as readonly string[]).includes(role.age) ? role.age : inferred[role.speaker]?.age };
  }
  const roles = selectMotionVoiceRoles(analysis, voices, requested, direction, inferred, channel, fixed);
  const shared = _.filter(
    _.groupBy(roles, (role) => role.voiceId),
    (group) => group.length > 1,
  );
  if (shared.length) opts.log?.(C.SHARED_VOICE(_.map(shared, (group) => _.map(group, MR.MOTION_TEXT_NAME).join(MR.MOTION_TEXT_SYMBOL_14)).join(MR.MOTION_TEXT_SYMBOL_41)));
  if (channel) opts.log?.(MOTION_VOICE_LIBRARY.LOCKED_LOG + channel.name);
  const planned = new Map<string, MotionVoicePlan["beats"][number]>();
  for (const beat of script.beats) {
    const explicit = normalizeMotionUtterances(script.voiceSettings?.utterances?.[beat.id] || beat.utterances, beat.id, speakers, beat.narration),
      unvoiced = speakers.length > 1 && explicit.every((line) => line.speaker === C.NARRATOR) && C.DIRECT_SPEECH_RE.test(beat.narration);
    if (explicit.length && !unvoiced) planned.set(beat.id, { id: beat.id, utterances: explicit });
  }
  const pending = script.beats.filter((beat) => !planned.has(beat.id));
  const dialogue = speakers.length > 1 ? pending.filter((beat) => C.DIRECT_SPEECH_RE.test(beat.narration)) : [];
  for (const beat of pending) if (!dialogue.includes(beat)) planned.set(beat.id, fallbackBeat(beat));
  if (pending.length) opts.log?.(C.SPLIT_LOG(dialogue.length, pending.length - dialogue.length));
  await mapMotionAiPool(_.chunk(dialogue, C.AI_BATCH), async (group) => {
    if (opts.signal?.aborted) throw new Error(C.CANCELLED);
    for (let attempt = 0; attempt < C.SPLIT_ATTEMPTS; attempt++) {
      const open = group.filter((beat) => !planned.has(beat.id));
      if (!open.length) break;
      if (attempt) {
        opts.log?.(C.SPLIT_RETRY);
        await resetMotionAiRoom().catch(_.noop);
      }
      try {
        const response = await (opts.ai || runMotionAi)([MOTION_VOICE_PROMPT, JSON.stringify({ direction, cast: analysis?.cast, beats: open.map((beat) => ({ id: beat.id, narration: beat.narration, cast: beat.cast, action: beat.action, scenePlan: beat.scenePlan, sceneMood: beat.sceneMood })) })].join(MR.MOTION_TEXT_SYMBOL_27), C.ARTIFACT, opts.exec, opts.signal, opts.log);
        for (const item of Array.isArray(response?.beats) ? response.beats : []) {
          const beat = open.find((entry) => entry.id === item.id);
          if (!beat) continue;
          const utterances = normalizeMotionUtterances(item.utterances, beat.id, speakers, beat.narration);
          if (utterances.length) planned.set(beat.id, { id: beat.id, utterances });
        }
      } catch (error) {
        if (opts.signal?.aborted) throw error;
      }
    }
    if (group.some((beat) => !planned.has(beat.id))) opts.log?.(C.PLAN_FALLBACK);
    for (const beat of group) if (!planned.has(beat.id)) planned.set(beat.id, fallbackBeat(beat));
  });
  const narratorKey = motionNarratorCastKey(analysis);
  const plan = { version: C.PLAN_VERSION, signature, direction, roles, beats: script.beats.map((beat) => { const b = planned.get(beat.id)!; return { ...b, utterances: motionNarratorLines(b.utterances, narratorKey) }; }) };
  fs.mkdirSync(path.dirname(planFile), { recursive: true });
  writeMotionJsonAtomic(planFile, plan);
  return plan;
};
