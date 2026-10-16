import _ from "lodash";
import { MOTION_QA as Q } from "../constants/motionQa.js";
import { motionHudStates } from "./motionHistory.js";
import type { MotionStoryAnalysis, MotionStoryScript } from "../types/motionVideo.js";
export const motionQaReport = (script: MotionStoryScript, analysis: MotionStoryAnalysis): string[] => {
  const beats = script.beats || [];
  const gen = script.gen;
  const counts = _.countBy(beats, (b) => b.visual);
  const scene = counts[Q.SCENE] || 0;
  const other = _.map(_.toPairs(_.omit(counts, Q.SCENE)), ([visual, count]) => Q.VISUAL_PART(visual, count)).join(Q.JOIN);
  const usedPlaces = _.uniq(
    _.compact(
      _.map(
        _.filter(beats, (b) => b.visual === Q.SCENE),
        (b) => b.place,
      ),
    ),
  );
  const reusedPlaces = _.filter(usedPlaces, (key) => !!_.find(analysis.places, (p) => p.key === key && !!p.reuse)).length;
  const reusedCast = _.filter(analysis.cast, (c) => !!c.reuse).length;
  const costumed = _.filter(analysis.cast, (c) => !!c.reuse && !!c.costume).length;
  const years = _.compact(_.map(motionHudStates(beats), (h) => Number((_.toString(h.date).match(Q.YEAR_RE) || [])[1]) || 0));
  const back = _.filter(years, (y, i) => i > 0 && y < years[i - 1]).length;
  const ratio = Math.round((scene * 100) / Math.max(1, beats.length));
  return _.compact([
    Q.HEADER,
    Q.VISUALS(scene, beats.length, other),
    Q.PLACES(usedPlaces.length, reusedPlaces, Math.max(0, usedPlaces.length - reusedPlaces)),
    Q.CAST(analysis.cast.length, reusedCast, costumed),
    years.length > 1 ? (back ? Q.HUD_BACK(back) : Q.HUD_OK) : undefined,
    ratio < Q.SCENE_MIN && beats.length ? Q.SCENE_LOW(ratio) : undefined,
    gen?.failed?.length ? Q.FAILED(gen.failed.length) : undefined,
  ]);
};
