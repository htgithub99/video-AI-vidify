import { MOTION_CATALOG_RUNTIME } from "./motionObjectCatalog.js";
import { MOTION_FIGURES as F } from "../constants/motionFigures.js";
import { MOTION_HTML_KIT as K } from "../constants/motionHtmlKit.js";
import { motionDrawStyle, motionMovementOf } from "./motionDrawStyle.js";
import { motionCameraShot, motionLayoutOf } from "./motionLayout.js";
import { motionSceneBlueprint } from "./motionSceneBlueprint.js";
// How a scene is shown or exported: its figures by the scene's own functions ("Dựng cảnh AI") or by the standard kit in
// the chosen drawing style ("Bộ vẽ chuẩn"), and the layout's camera over the scene the AI drew once.
export type MotionFigureScene = { shot?: string; kind?: string; sceneTemplate?: string };
export type MotionFigureRender = { kit?: boolean; profile?: string; proportion?: string; layout?: string; movement?: string; year?: number; scene?: MotionFigureScene };
// The renderer a compiled video or scene preview asks for, for one scene.
export const motionFigureRenderOf = (spec: { figureKit?: boolean; profileId?: string; proportion?: string; layout?: string; movement?: string; eraYear?: number } | undefined, scene?: MotionFigureScene): MotionFigureRender => ({
  kit: spec?.figureKit === true,
  year: spec?.eraYear,
  profile: spec?.profileId,
  proportion: spec?.proportion,
  movement: spec?.movement,
  layout: motionLayoutOf({ profileId: spec?.profileId, layout: spec?.layout, figureKit: spec?.figureKit }),
  scene: scene && { shot: scene.shot, kind: scene.kind, sceneTemplate: scene.sceneTemplate },
});
// Names one way of showing the figures, so a picture captured another way is known to be out of date.
export const motionFigureRenderKey = (render: MotionFigureRender | undefined): string => `${render?.kit ? `kit:${render.profile || ""}:${render.proportion || ""}` : "ai"}|${motionLayoutOf({ profileId: render?.profile, layout: render?.layout, figureKit: render?.kit })}|${motionMovementOf({ profileId: render?.profile, movement: render?.movement })}`;
export const motionHtmlUsesFigures = (html: string): boolean => F.USES.test(html);
// The view the page applies over the scene: the style layer ("Bộ vẽ chuẩn" only), the camera's shot with the plan's
// focal people as its subjects and its focal things (the key visual) kept in view, and the story's year (what the kit builds bridges of when a scene does not say).
export const motionFigureView = (render?: MotionFigureRender) => {
  const style = render?.kit && render.profile ? F.STYLES[motionDrawStyle(render.profile).kitLook] || null : null;
  const shot = motionCameraShot(motionLayoutOf({ profileId: render?.profile, layout: render?.layout, figureKit: render?.kit }), render?.scene);
  // How figures move ("Chuyển động"): the one chosen, else the drawing style's own ("Cắt dán kể chuyện": held poses, hops, the cut-out camera).
  const movement = motionMovementOf({ profileId: render?.profile, movement: render?.movement });
  const focus = shot === "wide" && movement !== "cutout" ? [] : (motionSceneBlueprint(render?.scene?.sceneTemplate, { shot: render?.scene?.shot, kind: render?.scene?.kind })?.items || []).filter((item) => item.focal).map((item) => item.id);
  return { style, shot, focus, movement, ...(Number.isFinite(render?.year) ? { year: render!.year } : {}) };
};
// Adds the figure table (and, for "Bộ vẽ chuẩn", the kit) and the view to a scene written against the figure contract.
// Scenes from before the contract are returned unchanged.
const CATALOG_JSON = JSON.stringify(MOTION_CATALOG_RUNTIME).replace(/</g, "\\u003c");
export const motionHtmlFigures = (html: string, render?: MotionFigureRender): string => {
  if (!motionHtmlUsesFigures(html) || html.includes(F.ATTR)) return html;
  const view = JSON.stringify(motionFigureView(render)).replace(/</g, "\\u003c");
  const tag = `<script ${F.ATTR}="1">window.__motionView=${view};window.__motionCatalog=${CATALOG_JSON};${F.SCRIPT}${F.VIEW}</script>`;
  const head = html.indexOf(K.HEAD);
  const page = head >= 0 ? html.slice(0, head + K.HEAD.length) + tag + html.slice(head + K.HEAD.length) : tag + html;
  if (!render?.kit || !render.profile) return page;
  const kit = K.SCRIPT_TAG + K.SCRIPT + K.SET_STYLE(motionDrawStyle(render.profile).kitLook) + K.SET_PROPORTION(render.proportion || "") + F.KIT_HOOK + K.SCRIPT_CLOSE;
  const at = page.indexOf(K.HEAD);
  return at >= 0 ? page.slice(0, at + K.HEAD.length) + kit + page.slice(at + K.HEAD.length) : kit + page;
};
// The scene's own code must not call the kit: it is not on the page when the scene's own functions draw.
export const motionHtmlFiguresIssue = (html: string): string | undefined => (F.KIT_CALL.test(html) ? F.KIT_CALL_ISSUE : undefined);
