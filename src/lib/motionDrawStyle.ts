import { MOTION_DRAW_STYLES as S, MOTION_DRAW_STYLE_DEFAULT } from "../constants/motionDrawStyles/index.js";
import { MOTION_PROPORTIONS as P } from "../constants/motionProportions.js";
import type { MotionDrawStyleSpec, MotionMovement, MotionProportionId } from "../constants/motionDrawStyles/types.js";
type MotionDrawStyleId = keyof typeof S;
const motionIsDrawStyle = (id: unknown): id is MotionDrawStyleId => typeof id === "string" && Object.hasOwn(S, id);
export const motionDrawStyle = (id?: unknown): MotionDrawStyleSpec => S[motionIsDrawStyle(id) ? id : MOTION_DRAW_STYLE_DEFAULT];
export const motionIsProportion = (id: unknown): id is MotionProportionId => typeof id === "string" && (P.CHOICES as string[]).includes(id);
export const motionProportionOf = (settings?: { profileId?: unknown; proportion?: unknown }): MotionProportionId => (motionIsProportion(settings?.proportion) ? settings.proportion : motionDrawStyle(settings?.profileId).proportion);
export const motionProportionPlanner = (settings?: { profileId?: unknown; proportion?: unknown }): string => P.SPECS[motionProportionOf(settings)].planner;
export const motionProportionFigure = (settings?: { profileId?: unknown; proportion?: unknown }): string => {
  const proportion = motionProportionOf(settings);
  return proportion === P.NATIVE ? "" : P.SPECS[proportion].figure;
};
// How figures move when the video is shown ("Chuyển động"): the one chosen, else the drawing style's own.
export const MOTION_MOVEMENTS: readonly MotionMovement[] = ["smooth", "cutout"];
export const motionIsMovement = (id: unknown): id is MotionMovement => typeof id === "string" && (MOTION_MOVEMENTS as readonly string[]).includes(id);
export const motionMovementOf = (settings?: { profileId?: unknown; movement?: unknown }): MotionMovement => (motionIsMovement(settings?.movement) ? settings.movement : motionDrawStyle(settings?.profileId).movement || "smooth");
