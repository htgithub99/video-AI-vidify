import { MOTION_DRAW_STYLES as S, MOTION_DRAW_STYLE_DEFAULT } from "../constants/motionDrawStyles/index.js";
import { MOTION_PROPORTIONS as P } from "../constants/motionProportions.js";
import type { MotionDrawStyleSpec, MotionProportionId, MotionStyleFamily } from "../constants/motionDrawStyles/types.js";
export type MotionDrawStyleId = keyof typeof S;
export const motionDrawStyleIds = Object.keys(S) as MotionDrawStyleId[];
export const motionIsDrawStyle = (id: unknown): id is MotionDrawStyleId => typeof id === "string" && Object.hasOwn(S, id);
export const motionDrawStyle = (id?: unknown): MotionDrawStyleSpec => S[motionIsDrawStyle(id) ? id : MOTION_DRAW_STYLE_DEFAULT];
export const motionStyleFamily = (id?: unknown): MotionStyleFamily => motionDrawStyle(id).family;
export const motionIsProportion = (id: unknown): id is MotionProportionId => typeof id === "string" && (P.CHOICES as string[]).includes(id);
export const motionProportionOf = (settings?: { profileId?: unknown; proportion?: unknown }): MotionProportionId => (motionIsProportion(settings?.proportion) ? settings.proportion : motionDrawStyle(settings?.profileId).proportion);
export const motionProportionPlanner = (settings?: { profileId?: unknown; proportion?: unknown }): string => P.SPECS[motionProportionOf(settings)].planner;
export const motionProportionFigure = (settings?: { profileId?: unknown; proportion?: unknown }): string => {
  const proportion = motionProportionOf(settings);
  return proportion === P.NATIVE ? "" : P.SPECS[proportion].figure;
};
