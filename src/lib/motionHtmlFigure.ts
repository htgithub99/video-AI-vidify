import { MOTION_HTML_FIGURE as F } from "../constants/motionHtmlFigure.js";
import { motionProportionFigure } from "./motionDrawStyle.js";
// How the AI draws its own people: one base design for every scene (the drawing style is applied when the video is shown),
// in the chosen figure proportion.
export const motionHtmlFigureDoc = (settings: { profileId?: unknown; proportion?: unknown }): string => [F.INTRO, F.FACE, F.LIMBS, motionProportionFigure(settings) || F.BODY, F.ANIMAL, F.GROUND].join(F.JOIN);
