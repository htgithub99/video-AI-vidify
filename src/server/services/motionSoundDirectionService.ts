import { RUNTIME_TEXT as RT_SERVER } from "../../constants/runtime/server.js";
import { stringifyJson } from "../../lib/jsonStringify.js";
import _ from "lodash";
import { PUPPET as P, PUPPET_PROMPTS as PR } from "../../constants/motionPuppet.js";
import { MOTION_SOUND_CONFIG, MOTION_SOUND_PROMPT } from "../../constants/motionSound.js";
import { MOTION_AUDIO_DIRECTION } from "../../constants/motionAudioDirection.js";
import * as MR from "../../constants/motionRuntime.js";
import { motionAudioDirection } from "../../lib/motionAudioDirection.js";
import { motionNarratedSoundEvents, normalizeSoundEvents } from "../../lib/motionSound.js";
import { motionPromptGroupsAsync } from "../../lib/motionPrompt.js";
import { motionResponsePrompt } from "../../lib/motionResponseContract.js";
import { motionInputKey } from "./motionFileUtils.js";
import type { MotionAudioDirection, MotionBeat, MotionStoryAnalysis, MotionStoryScript } from "../../types/motionVideo.js";
import { motionSoundCatalogPrompt } from "./motionSfxLibraryService.js";
import { mapMotionAiPool, runMotionAi, motionCaptchaError } from "./motionStoryService.js";
import { MOTION_AI_ROLE } from "../../constants/motionAiFallback.js";
import type { MotionAiExecution, MotionAiLog } from "../../types/motionVideo.js";
export interface MotionSoundDirectionOptions {
  exec: MotionAiExecution;
  signal?: AbortSignal;
  log: MotionAiLog;
  ai?: typeof runMotionAi;
  direction?: MotionAudioDirection;
  onAccepted?: () => void;
  contextFor?: (beat: MotionBeat) => unknown;
  concurrency?: number;
}
const storySoundContext = (beat: MotionBeat) => ({ id: beat.id, place: beat.place, time: beat.time, weather: beat.weather, cast: beat.cast, lines: beat.utterances?.length ? beat.utterances.map(({ speaker, role, text }) => ({ speaker, role, text })) : [{ role: "narration", text: beat.narration }] });
export const directMotionSound = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, o: MotionSoundDirectionOptions): Promise<void> => {
  const beatContext = o.contextFor || storySoundContext;
  const exec = { ...o.exec, role: MOTION_AI_ROLE.MAIN };
  const direction = o.direction || motionAudioDirection(script, analysis);
  const scenes = script.beats;
  const genre = _.compact([analysis.videoGenre, analysis.genre]).join(P.SPACE);
  const states = new Map(
    scenes.map((beat) => {
      const inputKey = motionInputKey([MOTION_SOUND_CONFIG.VERSION, MOTION_SOUND_PROMPT, direction, genre, beatContext(beat)]);
      const previous = beat.data?.[MOTION_SOUND_CONFIG.DIRECTION_STATE] as { inputKey?: string; attempts?: number; status?: string } | undefined;
      const events = beat.data?.soundEvents;
      const valid = Array.isArray(events) ? normalizeSoundEvents(events).length === events.length : beat.data?.soundSilence === true;
      const changed = previous?.inputKey !== undefined && previous.inputKey !== inputKey;
      const state = { inputKey, attempts: previous?.inputKey === inputKey && Number.isInteger(previous.attempts) && previous.attempts! >= 0 ? previous.attempts! : 0, status: !changed && valid && beat.data?.[P.SOUND_FLAG] === P.SOUND_VERSION ? RT_SERVER.ACCEPTED : RT_SERVER.PENDING };
      beat.data = { ...(beat.data || {}), [MOTION_SOUND_CONFIG.DIRECTION_STATE]: state };
      if (changed || !valid) delete beat.data[P.SOUND_FLAG];
      if (changed) {
        delete beat.data.soundEvents;
        delete beat.data.soundSilence;
      }
      return [beat.id, state] as const;
    }),
  );
  const beats = scenes.filter((beat) => beat.data?.[P.SOUND_FLAG] !== P.SOUND_VERSION);
  const fillNarrated = () => {
    for (const beat of scenes) {
      if (beat.data?.soundSilence || normalizeSoundEvents(beat.data?.soundEvents).length) continue;
      const events = motionNarratedSoundEvents(beat.narration);
      if (events.length) beat.data = { ...(beat.data || {}), soundEvents: events };
    }
    o.onAccepted?.();
  };
  if (!beats.length) {
    fillNarrated();
    return;
  }
  o.log(MOTION_SOUND_CONFIG.PLANNING);
  const promptOf = async (group: MotionBeat[]) => {
    o.signal?.throwIfAborted();
    const context = stringifyJson(group.map((beat) => beatContext(beat)));
    return ([MOTION_SOUND_PROMPT, motionResponsePrompt(MOTION_SOUND_CONFIG.ARTIFACT), MOTION_AUDIO_DIRECTION.CONTEXT + stringifyJson(direction), await motionSoundCatalogPrompt(context), PR.SOUND({ genre, horror: P.HORROR_RE.test(genre), beats: context })] as string[]).join(MR.MOTION_TEXT_SYMBOL_27);
  };
  try {
    const groups = await motionPromptGroupsAsync(
      beats.filter((beat) => states.get(beat.id)!.attempts < MOTION_SOUND_CONFIG.DIRECTION_ATTEMPTS),
      promptOf,
      MOTION_SOUND_CONFIG.DIRECTION_ITEMS,
      undefined,
      (before, next) => before.chapterId !== next.chapterId || before.place !== next.place,
    );
    await mapMotionAiPool(
      groups,
      async ({ items: group, prompt }) => {
        if (o.signal?.aborted) throw new Error(P.ABORTED);
        const pending = group.filter((beat) => beat.data?.[P.SOUND_FLAG] !== P.SOUND_VERSION);
        try {
          for (const beat of pending) states.get(beat.id)!.attempts++;
          const raw = await (o.ai || runMotionAi)(prompt, MOTION_SOUND_CONFIG.ARTIFACT, exec, o.signal, o.log);
          const rows = Array.isArray(raw?.beats) ? raw.beats : [];
          for (const beat of pending) {
            const matches = rows.filter((row: any) => row?.id === beat.id);
            if (matches.length !== 1 || (!Array.isArray(matches[0].soundEvents) && matches[0].soundSilence !== true)) continue;
            const item = matches[0];
            const supplied = Array.isArray(item.soundEvents) ? item.soundEvents : [];
            const events = normalizeSoundEvents(supplied);
            if (events.length !== supplied.length) continue;
            states.get(beat.id)!.status = RT_SERVER.ACCEPTED;
            beat.data = { ...(beat.data || {}), soundEvents: item.soundSilence === true ? [] : events, soundSilence: item.soundSilence === true, [P.SOUND_FLAG]: P.SOUND_VERSION };
          }
        } catch (e: any) {
          if (o.signal?.aborted || motionCaptchaError(e)) {
            for (const beat of pending) states.get(beat.id)!.attempts--;
            throw e;
          }
          o.log(MOTION_SOUND_CONFIG.SKIPPED);
        }
        o.onAccepted?.();
      },
      o.concurrency ?? 1,
    );
    const pending = beats.filter((beat) => beat.data?.[P.SOUND_FLAG] !== P.SOUND_VERSION);
    if (pending.length) o.log(MOTION_SOUND_CONFIG.DIRECTION_PENDING(pending.length));
  } finally {
    if (!o.signal?.aborted) fillNarrated();
  }
};
