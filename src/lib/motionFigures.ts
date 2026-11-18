import { MOTION_CATALOG_RUNTIME } from "./motionObjectCatalog.js";
import { MOTION_FIGURE_VOCAB_RUNTIME } from "../constants/motionFigureVocabulary.js";
import { MOTION_FIGURES as F } from "../constants/motionFigures.js";
import { MOTION_HTML_KIT as K } from "../constants/motionHtmlKit.js";
import { motionDrawStyle, motionMovementOf } from "./motionDrawStyle.js";
import { motionCameraShot, motionLayoutOf } from "./motionLayout.js";
import { motionIsSpecPage, motionSceneSpecOf } from "./motionSceneSpec.js";
import { MOTION_SCENE_ENGINE } from "../constants/motionSceneEngine.js";
import { MOTION_SCENE_SPEC as S } from "../constants/motionSceneSpec.js";
// How a scene is shown or exported: the engine draws its spec with the kit in the chosen drawing style, and the layout's
// camera frames the scene's subject.
export type MotionFigureScene = { shot?: string; kind?: string; sceneTemplate?: string };
export type MotionFigureRender = { profile?: string; proportion?: string; layout?: string; movement?: string; year?: number; scene?: MotionFigureScene };
// The renderer a compiled video or scene preview asks for, for one scene.
export const motionFigureRenderOf = (spec: { profileId?: string; proportion?: string; layout?: string; movement?: string; eraYear?: number } | undefined, scene?: MotionFigureScene): MotionFigureRender => ({
  year: spec?.eraYear,
  profile: spec?.profileId,
  proportion: spec?.proportion,
  movement: spec?.movement,
  layout: motionLayoutOf({ profileId: spec?.profileId, layout: spec?.layout }),
  scene: scene && { shot: scene.shot, kind: scene.kind },
});
// Names one way of showing the figures, so a picture captured another way is known to be out of date.
export const motionFigureRenderKey = (render: MotionFigureRender | undefined): string => `kit:${render?.profile || ""}:${render?.proportion || ""}|${motionLayoutOf({ profileId: render?.profile, layout: render?.layout })}|${motionMovementOf({ profileId: render?.profile, movement: render?.movement })}|r${F.RENDER_REVISION}e${S.ENGINE}`;
// The view the page applies over the scene: the style layer, the camera's shot with the scene's subject (its spec's
// focal item) as what it frames, and the story's year (what the kit builds things of when a scene does not say).
export const motionFigureView = (render: MotionFigureRender | undefined, focus?: string) => {
  const style = render?.profile ? F.STYLES[motionDrawStyle(render.profile).kitLook] || null : null;
  const shot = motionCameraShot(motionLayoutOf({ profileId: render?.profile, layout: render?.layout }), render?.scene);
  // How figures move ("Chuyển động"): the one chosen, else the drawing style's own ("Cắt dán kể chuyện": held poses, hops, the cut-out camera).
  const movement = motionMovementOf({ profileId: render?.profile, movement: render?.movement });
  return { style, shot, focus: focus && (shot !== "wide" || movement === "cutout") ? [focus] : [], movement, ...(Number.isFinite(render?.year) ? { year: render!.year } : {}) };
};
// Adds the figure table, the kit and the scene engine (with the view) to a scene page.
const CATALOG_JSON = JSON.stringify(MOTION_CATALOG_RUNTIME).replace(/</g, "\\u003c");
const VOCAB_JSON = JSON.stringify(MOTION_FIGURE_VOCAB_RUNTIME).replace(/</g, "\\u003c");
// The kit, the figure table and the view, put at the top of a page (the engine's page, or a test page drawing through the table).
export const motionFigureKitPage = (html: string, render?: MotionFigureRender, focus?: string): string => {
  const view = JSON.stringify(motionFigureView(render, focus)).replace(/</g, "\\u003c");
  const kit = K.SCRIPT_TAG + K.SCRIPT + K.SET_STYLE(motionDrawStyle(render?.profile).kitLook) + K.SET_PROPORTION(render?.proportion || "") + F.KIT_HOOK + K.SCRIPT_CLOSE;
  const tag = `<script ${F.ATTR}="1">window.__motionView=${view};window.__motionCatalog=${CATALOG_JSON};window.__motionVocab=${VOCAB_JSON};${F.SCRIPT}${F.VIEW}</script>`;
  const at = html.indexOf(K.HEAD);
  return at >= 0 ? html.slice(0, at + K.HEAD.length) + kit + tag + html.slice(at + K.HEAD.length) : kit + tag + html;
};
export const motionHtmlFigures = (html: string, render?: MotionFigureRender): string => {
  if (!motionIsSpecPage(html) || html.includes(F.ATTR)) return html;
  const page = motionFigureKitPage(html, render, motionSceneSpecOf(html)?.focus);
  const end = page.lastIndexOf("</body>");
  const engine = `<script>${MOTION_SCENE_ENGINE}</script>`;
  return end >= 0 ? page.slice(0, end) + engine + page.slice(end) : page + engine;
};
