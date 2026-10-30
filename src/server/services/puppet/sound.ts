import _ from "lodash";
import { PUPPET as P } from "../../../constants/motionPuppet.js";
import * as MR from "../../../constants/motionRuntime.js";
import { puppetBeatVisualLines } from "../../../lib/motionStoryboard.js";
import type { MotionAudioDirection, MotionBeat, MotionStoryAnalysis, MotionStoryScript } from "../../../types/motionVideo.js";
import type { PuppetGen } from "../../../types/motionPuppet.js";
import type { PuppetRunOptions } from "./stylePack.js";
import { directMotionSound } from "../motionSoundDirectionService.js";
import { puppetLanes } from "./kitDraw.js";
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
export const directPuppetSound = (script: MotionStoryScript, analysis: MotionStoryAnalysis, gen: PuppetGen, o: PuppetRunOptions & { direction?: MotionAudioDirection; onAccepted?: () => void }): Promise<void> => directMotionSound(script, analysis, { ...o, exec: o.mainExec || o.exec, concurrency: puppetLanes(o.mainExec || o.exec), contextFor: (beat) => beatContext(beat, gen) });
