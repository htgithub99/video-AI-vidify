import { MOTION_FIGURES as F } from "../constants/motionFigures.js";
import { MOTION_HTML_KIT as K } from "../constants/motionHtmlKit.js";
import { motionDrawStyle } from "./motionDrawStyle.js";
// How a scene's figures are drawn when it is shown or exported: by the scene's own functions ("Dựng cảnh AI") or by the
// standard kit in the chosen drawing style ("Bộ vẽ chuẩn").
export type MotionFigureRender = { kit?: boolean; profile?: string; proportion?: string };
// The renderer a compiled video or scene preview asks for.
export const motionFigureRenderOf = (spec: { figureKit?: boolean; profileId?: string; proportion?: string } | undefined): MotionFigureRender => ({ kit: spec?.figureKit === true, profile: spec?.profileId, proportion: spec?.proportion });
// Names one way of drawing the figures, so a picture captured with another one is known to be out of date.
export const motionFigureRenderKey = (render: MotionFigureRender | undefined): string => (render?.kit ? `kit:${render.profile || ""}:${render.proportion || ""}` : "ai");
export const motionHtmlUsesFigures = (html: string): boolean => F.USES.test(html);
// Adds the figure table (and, for "Bộ vẽ chuẩn", the kit) to a scene written against the figure contract. Scenes from
// before the contract are returned unchanged and keep the renderer they were drawn for.
export const motionHtmlFigures = (html: string, render?: MotionFigureRender): string => {
  if (!motionHtmlUsesFigures(html) || html.includes(F.ATTR)) return html;
  const tag = `<script ${F.ATTR}="1">${F.SCRIPT}</script>`;
  const head = html.indexOf(K.HEAD);
  const page = head >= 0 ? html.slice(0, head + K.HEAD.length) + tag + html.slice(head + K.HEAD.length) : tag + html;
  if (!render?.kit || !render.profile) return page;
  const kit = K.SCRIPT_TAG + K.SCRIPT + K.SET_STYLE(motionDrawStyle(render.profile).kitLook) + K.SET_PROPORTION(render.proportion || "") + F.KIT_HOOK + K.SCRIPT_CLOSE;
  const at = page.indexOf(K.HEAD);
  return at >= 0 ? page.slice(0, at + K.HEAD.length) + kit + page.slice(at + K.HEAD.length) : kit + page;
};
// The scene's own code must not call the kit: it is not on the page when the scene's own functions draw.
export const motionHtmlFiguresIssue = (html: string): string | undefined => (F.KIT_CALL.test(html) ? F.KIT_CALL_ISSUE : undefined);
