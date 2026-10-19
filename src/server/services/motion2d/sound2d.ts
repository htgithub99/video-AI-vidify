import _ from "lodash";
import { MOTION_2D as C, MOTION_2D_PROMPTS as P } from "../../../constants/motion2d.js";
import { MOTION_SOUND_CONFIG, MOTION_SOUND_PROMPT } from "../../../constants/motionSound.js";
import { MOTION_AUDIO_DIRECTION } from "../../../constants/motionAudioDirection.js";
import * as MR from "../../../constants/motionRuntime.js";
import { motionAudioDirection } from "../../../lib/motionAudioDirection.js";
import { board2dSentenceKey, splitBoard2dSentences } from "../../../lib/motionBoard2d.js";
import { normalizeSoundEvents } from "../../../lib/motionSound.js";
import type { MotionAudioDirection, MotionBeat, MotionGenState, MotionStoryAnalysis, MotionStoryScript } from "../../../types/motionVideo.js";
import { motionSoundCatalogPrompt } from "../motionSfxLibraryService.js";
import { mapMotionAiPool, runMotionAi } from "../motionStoryService.js";
import { board2dLanes, type Board2dOptions } from "./board2d.js";

const beatContext = (beat: MotionBeat, gen: MotionGenState) => {
  const sentences = gen.board2d?.sentences || {};
  const texts = beat.utterances?.length ? _.map(beat.utterances, (u) => ({ speaker: u.speaker, role: u.role, text: u.text })) : [{ speaker: C.EMPTY, role: MR.MOTION_TEXT_NARRATION, text: beat.narration }];
  return {
    id: beat.id,
    place: beat.place,
    time: beat.time,
    weather: beat.weather,
    cast: beat.cast,
    lines: texts,
    pictures: _.compact(_.flatMap(texts, (t) => _.map(splitBoard2dSentences(t.text), (x) => {
      const e = sentences[board2dSentenceKey(x)];
      return e ? { text: x, mode: e.mode, kind: e.kind, objects: _.map(e.objects, C.F_KEY), poses: _.map(e.actors, (a) => a.cast + C.SEP + a.pose), light: e.light } : null;
    }))),
  };
};

export const directSound2d = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: MotionGenState, o: Board2dOptions & { direction?: MotionAudioDirection }): Promise<void> => {
  const direction = o.direction || motionAudioDirection(script, analysis);
  const beats = _.filter(script.beats, (b) => b.visual === MR.MOTION_TEXT_SCENE && b.data?.[C.SOUND_FLAG] !== C.SOUND_VERSION);
  if (!beats.length) return;
  o.log(MOTION_SOUND_CONFIG.PLANNING);
  await mapMotionAiPool(
    _.chunk(beats, C.SOUND_BEATS_PER_CALL),
    async (group) => {
      if (o.signal?.aborted) throw new Error(C.ABORTED);
      const context = JSON.stringify(_.map(group, (b) => beatContext(b, gen)));
      try {
        const prompt = [MOTION_SOUND_PROMPT, MOTION_AUDIO_DIRECTION.CONTEXT + JSON.stringify(direction), await motionSoundCatalogPrompt(context), P.SOUND({ genre: [analysis.videoGenre, analysis.genre].filter(Boolean).join(C.SPACE), beats: context })].join(MR.MOTION_TEXT_SYMBOL_27);
        const raw = await (o.ai || runMotionAi)(prompt, MOTION_SOUND_CONFIG.ARTIFACT, o.mainExec || o.exec, o.signal, o.log);
        for (const item of _.castArray(raw?.beats || [])) {
          const beat = _.find(group, { id: item?.id });
          if (!beat) continue;
          beat.data = { ...(beat.data || {}), soundEvents: normalizeSoundEvents(item.soundEvents), soundSilence: item.soundSilence === true };
        }
      } catch (e: any) {
        if (o.signal?.aborted) throw e;
        o.log(MOTION_SOUND_CONFIG.SKIPPED);
      }
      for (const b of group) b.data = { ...(b.data || {}), [C.SOUND_FLAG]: C.SOUND_VERSION };
    },
    board2dLanes(o.mainExec || o.exec),
  );
};
