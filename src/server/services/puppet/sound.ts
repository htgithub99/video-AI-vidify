import _ from "lodash";
import { PUPPET as P, PUPPET_PROMPTS as PR } from "../../../constants/motionPuppet.js";
import { MOTION_SOUND_CONFIG, MOTION_SOUND_PROMPT } from "../../../constants/motionSound.js";
import { MOTION_AUDIO_DIRECTION } from "../../../constants/motionAudioDirection.js";
import * as MR from "../../../constants/motionRuntime.js";
import { motionAudioDirection } from "../../../lib/motionAudioDirection.js";
import { puppetBeatVisualLines } from "../../../lib/motionStoryboard.js";
import { normalizeSoundEvents } from "../../../lib/motionSound.js";
import { motionPromptGroupsAsync } from "../../../lib/motionPrompt.js";
import { motionResponsePrompt } from "../../../lib/motionResponseContract.js";
import { motionInputKey } from "../motionFileUtils.js";
import { isMotionContentResponseError } from "../chatSubmissionRecovery.js";
import type { MotionAudioDirection, MotionBeat, MotionStoryAnalysis, MotionStoryScript } from "../../../types/motionVideo.js";
import type { PuppetGen } from "../../../types/motionPuppet.js";
import { motionSoundCatalogPrompt } from "../motionSfxLibraryService.js";
import { mapMotionAiPool, runMotionAi } from "../motionStoryService.js";
import { puppetLanes } from "./kitDraw.js";
import type { PuppetRunOptions } from "./stylePack.js";
const beatContext = (beat: MotionBeat, gen: PuppetGen) => ({
  id: beat.id,
  place: beat.place,
  time: beat.time,
  weather: beat.weather,
  cast: beat.cast,
  lines: beat.utterances?.length ? _.map(beat.utterances, (u) => ({ speaker: u.speaker, role: u.role, text: u.text })) : [{ speaker: P.EMPTY, role: MR.MOTION_TEXT_NARRATION, text: beat.narration }],
  pictures: _.compact(
    _.map(puppetBeatVisualLines(beat, gen), (l) => {
      const f = gen.frames[l.key];
      return f ? _.omitBy({ unit: l.key, purpose: l.visualUnit?.purpose, show: l.visualUnit?.show, text: l.text, shot: f.shot, people: _.map(f.actors, (a) => a.char + P.SEP + a.pose + P.SEP + a.expr), object: f.prop, light: f.light, overlays: f.overlays }, (v) => _.isNil(v) || (_.isArray(v) && !v.length)) : null;
    }),
  ),
});
export const directPuppetSound = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: PuppetGen, o: PuppetRunOptions & { direction?: MotionAudioDirection; onAccepted?: () => void }): Promise<void> => {
  const direction = o.direction || motionAudioDirection(script, analysis);
  const scenes = script.beats.filter((beat) => beat.visual === MR.MOTION_TEXT_SCENE);
  const genre = _.compact([analysis.videoGenre, analysis.genre]).join(P.SPACE);
  const states = new Map(
    scenes.map((beat) => {
      const inputKey = motionInputKey([MOTION_SOUND_CONFIG.VERSION, MOTION_SOUND_PROMPT, direction, genre, beatContext(beat, gen)]);
      const previous = beat.data?.[MOTION_SOUND_CONFIG.DIRECTION_STATE] as { inputKey?: string; attempts?: number; status?: string } | undefined;
      const events = beat.data?.soundEvents;
      const valid = Array.isArray(events) ? normalizeSoundEvents(events).length === events.length : beat.data?.soundSilence === true;
      const changed = previous?.inputKey !== undefined && previous.inputKey !== inputKey;
      const state = { inputKey, attempts: previous?.inputKey === inputKey && Number.isInteger(previous.attempts) && previous.attempts! >= 0 ? previous.attempts! : 0, status: !changed && valid && beat.data?.[P.SOUND_FLAG] === P.SOUND_VERSION ? "accepted" : "pending" };
      beat.data = { ...(beat.data || {}), [MOTION_SOUND_CONFIG.DIRECTION_STATE]: state };
      if (changed || !valid) delete beat.data[P.SOUND_FLAG];
      return [beat.id, state] as const;
    }),
  );
  const beats = scenes.filter((beat) => beat.data?.[P.SOUND_FLAG] !== P.SOUND_VERSION);
  if (!beats.length) return;
  o.log(MOTION_SOUND_CONFIG.PLANNING);
  const promptOf = async (group: MotionBeat[]) => {
    o.signal?.throwIfAborted();
    const context = JSON.stringify(group.map((beat) => beatContext(beat, gen)));
    return [MOTION_SOUND_PROMPT, motionResponsePrompt(MOTION_SOUND_CONFIG.ARTIFACT), MOTION_AUDIO_DIRECTION.CONTEXT + JSON.stringify(direction), await motionSoundCatalogPrompt(context), PR.SOUND({ genre, horror: P.HORROR_RE.test(genre), beats: context })].join(MR.MOTION_TEXT_SYMBOL_27);
  };
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
        const raw = await (o.ai || runMotionAi)(prompt, MOTION_SOUND_CONFIG.ARTIFACT, o.exec, o.signal, o.log);
        for (const beat of pending) states.get(beat.id)!.attempts++;
        const rows = Array.isArray(raw?.beats) ? raw.beats : [];
        for (const beat of pending) {
          const matches = rows.filter((row: any) => row?.id === beat.id);
          if (matches.length !== 1 || (!Array.isArray(matches[0].soundEvents) && matches[0].soundSilence !== true)) continue;
          const item = matches[0];
          const supplied = Array.isArray(item.soundEvents) ? item.soundEvents : [];
          const events = normalizeSoundEvents(supplied);
          if (events.length !== supplied.length) continue;
          states.get(beat.id)!.status = "accepted";
          beat.data = { ...(beat.data || {}), soundEvents: events, soundSilence: item.soundSilence === true, [P.SOUND_FLAG]: P.SOUND_VERSION };
        }
      } catch (e: any) {
        if (o.signal?.aborted) throw e;
        if (isMotionContentResponseError(e)) for (const beat of pending) states.get(beat.id)!.attempts++;
        o.log(MOTION_SOUND_CONFIG.SKIPPED);
      }
      o.onAccepted?.();
    },
    puppetLanes(o.exec),
  );
  const pending = beats.filter((beat) => beat.data?.[P.SOUND_FLAG] !== P.SOUND_VERSION);
  if (pending.length) o.log(MOTION_SOUND_CONFIG.DIRECTION_PENDING(pending.length));
};
