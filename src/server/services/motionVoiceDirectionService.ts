import { voiceChannelRef } from "../../lib/motionVoice.js";
import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { MOTION_VOICE as C, MOTION_VOICE_PROMPT, MOTION_VOICE_LIBRARY } from "../../constants/motionVoice.js";
import { applyVoiceLibrary, findVoiceChannel } from "./motionVoiceLibraryService.js";
import { MOTION_AUDIO_DIRECTION, MOTION_AUDIO_CAST_PROMPT } from "../../constants/motionAudioDirection.js";
import { motionAudioDirection, motionSpeakerTraits } from "../../lib/motionAudioDirection.js";
import { motionSceneType } from "../../constants/motionSceneCatalog.js";
import { motionVoiceSignature, motionVoiceCastContext, motionVoiceSpeaks, motionVoiceAge, normalizeMotionUtterances, fallbackMotionUtterances, selectMotionVoiceRoles, motionNarratorCastKey, motionNarratorLines } from "../../lib/motionVoice.js";
import type { MotionBeat, MotionStoryScript, MotionStoryAnalysis, MotionVoicePlan, MotionAiExecution, MotionVoicePreset } from "../../types/motionVideo.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import { mapMotionAiPool, runMotionAi, runInMotionAiWorkerSession, type MotionEditorialSession } from "./motionStoryService.js";
import _ from "lodash";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
import { motionPromptGroups } from "../../lib/motionPrompt.js";
import { MOTION_PROMPT as PROMPT } from "../../constants/motionPrompt.js";
import { motionTaskCheckpoint } from "./motionTaskCheckpoint.js";
import { motionInputKey } from "./motionFileUtils.js";
import { isMotionContentResponseError, isTerminalMotionAiError } from "./chatSubmissionRecovery.js";
import { MOTION_PRODUCTION as P } from "../../constants/motionProduction.js";
import { motionResponsePrompt, motionResponseRepair, type MotionResponseIssue } from "../../lib/motionResponseContract.js";
import { motionSpeechResponseIssues } from "../../lib/motionSpeechResponse.js";
import { MOTION_RESPONSE_TEXT as RESPONSE } from "../../constants/motionResponseContract.js";
export interface MotionVoiceOptions {
  session?: MotionEditorialSession;
  scope?: string;
  exec: MotionAiExecution;
  aspect?: string;
  signal?: AbortSignal;
  log?: (value: string) => void;
  onProgress?: (done: number, total: number) => void;
  ai?: typeof runMotionAi;
  asr?: boolean;
}
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
const needsDialogue = (beat: MotionBeat, lines: MotionVoicePlan["beats"][number]["utterances"], speakers: string[]): boolean => speakers.length > 1 && lines.every((line) => line.speaker === C.NARRATOR) && C.DIRECT_SPEECH_RE.test(beat.narration);
export const directMotionVoice = (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, voices: MotionVoicePreset[], opts: MotionVoiceOptions): Promise<MotionVoicePlan> => runInMotionAiWorkerSession(opts.scope || script.title, () => planMotionVoice(script, analysis, voices, opts), opts.log, opts.signal, opts.session);
const planMotionVoice = async (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, voices: MotionVoicePreset[], opts: MotionVoiceOptions): Promise<MotionVoicePlan> => {
  const channel = findVoiceChannel(script.voiceChannel),
    pinned = new Set<string>(channel ? [channel.narratorVoiceId, ...Object.values(channel.roleVoices || {})] : []);
  const library = applyVoiceLibrary(voices),
    spoken = library.filter((voice) => pinned.has(voice.id) || motionVoiceSpeaks(voice, script.language));
  voices = spoken.length ? spoken : library;
  const signature = motionVoiceSignature(script, analysis, voiceChannelRef(channel) || script.voiceChannel),
    speakers = [C.NARRATOR, ...(analysis?.cast || []).map((member) => member.key)],
    fixed = script.gen?.voiceCast || {};
  const planFile = path.join(
    getMotionRootDirectory(),
    MR.MOTION_TEXT_TTS_CACHE,
    createHash(MR.MOTION_TEXT_SHA256)
      .update(signature + JSON.stringify(fixed) + JSON.stringify(channel || {}))
      .digest(MR.MOTION_TEXT_HEX) + MR.MOTION_TEXT_PLAN_JSON,
  );
  let saved: MotionVoicePlan | undefined;
  try {
    saved = JSON.parse(fs.readFileSync(planFile, MR.MOTION_TEXT_UTF8));
  } catch {}
  if (
    saved?.signature === signature &&
    saved.version === C.PLAN_VERSION &&
    Array.isArray(saved.roles) &&
    Array.isArray(saved.beats) &&
    saved.beats.length === script.beats.length &&
    script.beats.every((beat) => saved!.beats.filter((row) => row?.id === beat.id && normalizeMotionUtterances(row.utterances, beat.id, speakers, beat.narration).length && !needsDialogue(beat, row.utterances, speakers)).length === 1) &&
    saved.roles.every((role) => voices.some((voice) => voice.id === role.voiceId && (!role.gender || voice.gender === role.gender))) &&
    (!channel || saved.roles.some((role) => role.speaker === C.NARRATOR && role.voiceId === channel.narratorVoiceId))
  ) {
    const narratorKey = motionNarratorCastKey(analysis);
    return { ...saved, beats: saved.beats.map((beat) => ({ ...beat, utterances: motionNarratorLines(beat.utterances, narratorKey, script.beats.find((b) => b.id === beat.id)?.narration) })) };
  }
  opts.log?.(C.PLANNING);
  let casting: any;
  const castContext = analysis ? { cast: motionVoiceCastContext(analysis), direction: motionAudioDirection(script, analysis) } : null;
  const recovery = motionTaskCheckpoint<{ casting?: any; casted?: boolean; rows: Record<string, { key: string; value?: MotionVoicePlan["beats"][number]; attempts: number; issues?: MotionResponseIssue[] }> }>(opts.scope || signature, C.ARTIFACT, [C.PLAN_VERSION, castContext, voices, channel, fixed, script.voiceChannel]);
  const draft = recovery.read() || { rows: {} };
  casting = draft.casting;
  const settled = castingSettled(analysis, voices, motionAudioDirection(script, analysis), channel, fixed);
  if (settled) opts.log?.(C.CASTING_SKIPPED);
  const baseDirection = motionAudioDirection(script, analysis);
  const defaults = selectMotionVoiceRoles(analysis, voices, {}, baseDirection, knownTraits(analysis), channel, fixed);
  const candidateIds = new Set([...defaults.map((role) => role.voiceId), ...Object.values(fixed), ...pinned]);
  for (const role of defaults) {
    const alternatives = voices.filter((voice) => (!role.gender || voice.gender === role.gender) && (!role.age || motionVoiceAge(voice) === role.age));
    for (const voice of alternatives.slice(0, PROMPT.CAST_ALTERNATIVES)) candidateIds.add(voice.id);
  }
  const candidates = voices.filter((voice) => candidateIds.has(voice.id));
  const sampleIndices = [...new Set(Array.from({ length: Math.min(PROMPT.CAST_EXCERPTS, script.beats.length) }, (_, index) => Math.round((index * (script.beats.length - 1)) / Math.max(1, Math.min(PROMPT.CAST_EXCERPTS, script.beats.length) - 1))))];
  if (!settled && !draft.casted)
    try {
      casting = await (opts.ai || runMotionAi)(
        [
          MOTION_AUDIO_CAST_PROMPT,
          JSON.stringify({
            title: script.title,
            direction: baseDirection,
            analysis: { title: analysis?.title, logline: analysis?.logline, genre: analysis?.genre, factual: analysis?.factual, format: analysis?.videoDna?.format, audience: analysis?.videoDna?.audienceProfile, cast: analysis?.cast?.map((member) => _.pick(member, ["key", "name", "role", "gender", "age", "description"])) },
            scriptExcerpts: sampleIndices.map((index) => ({ id: script.beats[index].id, narration: script.beats[index].narration.slice(0, PROMPT.CAST_EXCERPT_CHARS) })),
            fixed,
            voices: candidates.map((voice) => _.pick(voice, ["id", "name", "gender", "age", "description", "language"])),
          }),
        ].join(MR.MOTION_TEXT_SYMBOL_27),
        MOTION_AUDIO_DIRECTION.ARTIFACT,
        opts.exec,
        opts.signal,
        opts.log,
      );
      draft.casting = casting;
      draft.casted = true;
    } catch (error) {
      if (isTerminalMotionAiError(error, opts.signal) || P.SERVICE_ERROR_RE.test(String((error as Error)?.message))) throw error;
      opts.log?.(C.PLAN_FALLBACK);
    }
  if (!settled && draft.casted) recovery.save(draft);
  const direction = motionAudioDirection(script, analysis, casting?.audioDirection),
    requested: Record<string, string> = {},
    inferred: Record<string, { gender?: "male" | "female"; age?: string }> = knownTraits(analysis);
  for (const role of Array.isArray(casting?.roles) ? casting.roles : []) {
    if (!speakers.includes(role?.speaker)) continue;
    if (candidates.some((voice) => voice.id === role.voiceId)) requested[role.speaker] = role.voiceId;
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
    const key = motionInputKey([beat.id, beat.narration, beat.utterances, script.voiceSettings?.utterances?.[beat.id], direction, speakers, MOTION_VOICE_PROMPT, motionResponsePrompt(C.ARTIFACT)]);
    if (draft.rows[beat.id]?.key !== key) draft.rows[beat.id] = { key, attempts: 0 };
    const restored = draft.rows[beat.id].value;
    if (restored) {
      const utterances = normalizeMotionUtterances(restored.utterances, beat.id, speakers, beat.narration);
      if (utterances.length) {
        planned.set(beat.id, { id: beat.id, utterances });
        continue;
      }
    }
    const explicit = normalizeMotionUtterances(script.voiceSettings?.utterances?.[beat.id] || beat.utterances, beat.id, speakers, beat.narration),
      unvoiced = needsDialogue(beat, explicit, speakers);
    if (explicit.length && !unvoiced) planned.set(beat.id, { id: beat.id, utterances: explicit });
  }
  const pending = script.beats.filter((beat) => !planned.has(beat.id));
  const dialogue = speakers.length > 1 ? pending.filter((beat) => C.DIRECT_SPEECH_RE.test(beat.narration)) : [];
  for (const beat of pending) if (!dialogue.includes(beat)) planned.set(beat.id, fallbackBeat(beat));
  if (pending.length) opts.log?.(C.SPLIT_LOG(dialogue.length, pending.length - dialogue.length));
  const dialoguePrompt = (beats: MotionBeat[]) => {
    const prompt = [MOTION_VOICE_PROMPT, motionResponsePrompt(C.ARTIFACT), JSON.stringify({ direction, cast: analysis?.cast, beats: beats.map((beat) => ({ id: beat.id, narration: beat.narration, cast: beat.cast, action: beat.action, scenePlan: beat.scenePlan, sceneMood: beat.sceneMood })) })].join(MR.MOTION_TEXT_SYMBOL_27);
    const diagnostics = beats.filter((beat) => draft.rows[beat.id].issues?.length).map((beat) => ({ id: beat.id, issues: draft.rows[beat.id].issues }));
    return diagnostics.length ? motionResponseRepair(prompt, diagnostics) : prompt;
  };
  await mapMotionAiPool(
    motionPromptGroups(dialogue, dialoguePrompt, Math.min(C.AI_BATCH, PROMPT.DIALOGUE_ITEMS), undefined, (before, next) => before.chapterId !== next.chapterId || before.place !== next.place),
    async (group) => {
      if (opts.signal?.aborted) throw new Error(C.CANCELLED);
      for (let attempt = 0; attempt < C.SPLIT_ATTEMPTS; attempt++) {
        const open = group.filter((beat) => !planned.has(beat.id) && draft.rows[beat.id].attempts < C.SPLIT_ATTEMPTS);
        if (!open.length) break;
        if (attempt) {
          opts.log?.(C.SPLIT_RETRY);
        }
        try {
          const response = await (opts.ai || runMotionAi)(dialoguePrompt(open), C.ARTIFACT, opts.exec, opts.signal, opts.log);
          for (const beat of open) draft.rows[beat.id].attempts++;
          const rows = Array.isArray(response?.beats) ? response.beats : [];
          for (const beat of open) {
            const matches = rows.filter((row: any) => row?.id === beat.id);
            if (matches.length !== 1) {
              draft.rows[beat.id].issues = [{ path: "id", expected: matches.length ? RESPONSE.DUPLICATE_ID : RESPONSE.MISSING_ROW, actual: String(matches.length), value: RESPONSE.VALUE(beat.id) }];
              continue;
            }
            const item = matches[0];
            const issues = motionSpeechResponseIssues(item.utterances, speakers, beat.narration);
            draft.rows[beat.id].issues = issues;
            if (issues.length) continue;
            const utterances = normalizeMotionUtterances(item.utterances, beat.id, speakers, beat.narration);
            if (utterances.length) {
              const value = { id: beat.id, utterances };
              planned.set(beat.id, value);
              draft.rows[beat.id].value = value;
            }
          }
          recovery.save(draft);
        } catch (error) {
          if (opts.signal?.aborted) throw error;
          if (!isMotionContentResponseError(error)) throw error;
          for (const beat of open) {
            draft.rows[beat.id].attempts++;
            draft.rows[beat.id].issues = [{ path: "beats", expected: RESPONSE.MISSING_ROW, actual: "invalid JSON response", value: RESPONSE.VALUE(String((error as Error)?.message || error)) }];
          }
          recovery.save(draft);
        }
      }
      if (group.some((beat) => !planned.has(beat.id))) opts.log?.(C.PLAN_FALLBACK);
      for (const beat of group) if (!planned.has(beat.id)) planned.set(beat.id, fallbackBeat(beat));
    },
  );
  const narratorKey = motionNarratorCastKey(analysis);
  const plan = {
    version: C.PLAN_VERSION,
    signature,
    direction,
    roles,
    beats: script.beats.map((beat) => {
      const b = planned.get(beat.id)!;
      return { ...b, utterances: motionNarratorLines(b.utterances, narratorKey, beat.narration) };
    }),
  };
  fs.mkdirSync(path.dirname(planFile), { recursive: true });
  writeMotionJsonAtomic(planFile, plan);
  return plan;
};
