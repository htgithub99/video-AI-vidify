import { MOTION_HTML_FIGURE as F } from "../constants/motionHtmlFigure.js";
export const motionHtmlFigureDoc = (profile: string): string => F.DOC[profile] || F.DOC.history;
