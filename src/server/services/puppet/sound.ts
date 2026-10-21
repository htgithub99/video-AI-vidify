import _ from "lodash";
import { PUPPET as P, PUPPET_PROMPTS as PR } from "../../../constants/motionPuppet.js";
import { MOTION_SOUND_CONFIG, MOTION_SOUND_PROMPT } from "../../../constants/motionSound.js";
import { MOTION_AUDIO_DIRECTION } from "../../../constants/motionAudioDirection.js";
import * as MR from "../../../constants/motionRuntime.js";
import { motionAudioDirection } from "../../../lib/motionAudioDirection.js";
import { puppetBeatLines } from "../../../lib/motionPuppet.js";
import { normalizeSoundEvents } from "../../../lib/motionSound.js";
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
    _.map(puppetBeatLines(beat), (l) => {
      const f = gen.frames[l.key];
      return f ? _.omitBy({ text: l.text, shot: f.shot, people: _.map(f.actors, (a) => a.char + P.SEP + a.pose + P.SEP + a.expr), object: f.prop, light: f.light, overlays: f.overlays }, (v) => _.isNil(v) || (_.isArray(v) && !v.length)) : null;
    }),
  ),
});

export const directPuppetSound = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: PuppetGen, o: PuppetRunOptions & { direction?: MotionAudioDirection }): Promise<void> => {
  const direction = o.direction || motionAudioDirection(script, analysis);
  const beats = _.filter(script.beats, (b) => b.visual === MR.MOTION_TEXT_SCENE && b.data?.[P.SOUND_FLAG] !== P.SOUND_VERSION);
  if (!beats.length) return;
  o.log(MOTION_SOUND_CONFIG.PLANNING);
  const genre = _.compact([analysis.videoGenre, analysis.genre]).join(P.SPACE);
  await mapMotionAiPool(
    _.chunk(beats, P.SOUND_BEATS_PER_CALL),
    async (group) => {
      if (o.signal?.aborted) throw new Error(P.ABORTED);
      const context = JSON.stringify(_.map(group, (b) => beatContext(b, gen)));
      try {
        const prompt = [MOTION_SOUND_PROMPT, MOTION_AUDIO_DIRECTION.CONTEXT + JSON.stringify(direction), await motionSoundCatalogPrompt(context), PR.SOUND({ genre, horror: P.HORROR_RE.test(genre), beats: context })].join(MR.MOTION_TEXT_SYMBOL_27);
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
      for (const b of group) b.data = { ...(b.data || {}), [P.SOUND_FLAG]: P.SOUND_VERSION };
    },
    puppetLanes(o.mainExec || o.exec),
  );
};
