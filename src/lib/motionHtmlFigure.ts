import { MOTION_HTML_FIGURE as F } from "../constants/motionHtmlFigure.js";
import { motionDrawStyle, motionProportionFigure } from "./motionDrawStyle.js";
export const motionHtmlFigureDoc = (profile: string, proportion?: string): string => [F.DOC[motionDrawStyle(profile).figure] || F.DOC.history, motionProportionFigure({ profileId: profile, proportion })].filter(Boolean).join(F.JOIN);
