import { MOTION_CATALOG_RUNTIME } from "./motionObjectCatalog.js";
import { MOTION_FIGURE_VOCAB_RUNTIME } from "../constants/motionFigureVocabulary.js";
import { MOTION_FIGURES as F } from "../constants/motionFigures.js";
import { MOTION_HTML_KIT as K } from "../constants/motionHtmlKit.js";
import { motionDrawStyle, motionMovementOf } from "./motionDrawStyle.js";
import { motionLayoutOf } from "./motionLayout.js";
import { motionSceneInteractPairs } from "./motionSceneBlueprint.js";
import { motionIsSpecPage, motionSceneSpecOf } from "./motionSceneSpec.js";
import { MOTION_SCENE_ENGINE } from "../constants/motionSceneEngine.js";
import { MOTION_SCENE_REVISE as R, MOTION_SCENE_SPEC as S } from "../constants/motionSceneSpec.js";
import { motionHtmlRequired } from "./motionHtmlQuality.js";
import type { MotionCrossing } from "./motionCrossingSites.js";
export type MotionFigureScene = { shot?: string; kind?: string; sceneTemplate?: string; text?: string; time?: string; vary?: number; crossing?: MotionCrossing; html?: { language?: string } };
export type MotionFigureRender = { profile?: string; proportion?: string; layout?: string; movement?: string; year?: number; cast?: Record<string, Record<string, string>>; scene?: MotionFigureScene };
export const motionFigureRenderOf = (spec: { profileId?: string; proportion?: string; layout?: string; movement?: string; eraYear?: number; castMarks?: Record<string, Record<string, string>> } | undefined, scene?: MotionFigureScene): MotionFigureRender => ({
  year: spec?.eraYear,
  cast: spec?.castMarks,
  profile: spec?.profileId,
  proportion: spec?.proportion,
  movement: spec?.movement,
  layout: motionLayoutOf({ layout: spec?.layout }),
  scene: scene && { shot: scene.shot, kind: scene.kind, sceneTemplate: scene.sceneTemplate, text: scene.text, time: scene.time, vary: scene.vary, crossing: scene.crossing, html: scene.html?.language ? { language: scene.html.language } : undefined },
});
export const motionFigureRenderKey = (render: MotionFigureRender | undefined): string => `kit:${render?.profile || ""}:${render?.proportion || ""}|${motionLayoutOf({ layout: render?.layout })}|${motionMovementOf({ profileId: render?.profile, movement: render?.movement })}|r${F.RENDER_REVISION}e${S.ENGINE}v${R.REVISION}`;
export const motionFigureView = (render: MotionFigureRender | undefined, focus?: string) => {
  const style = render?.profile ? F.STYLES[motionDrawStyle(render.profile).kitLook] || null : null;
  const movement = motionMovementOf({ profileId: render?.profile, movement: render?.movement });
  const pairs = motionSceneInteractPairs(render?.scene?.sceneTemplate);
  const scene = render?.scene;
  return {
    style,
    layout: motionLayoutOf({ layout: render?.layout }),
    scene: { shot: scene?.shot, kind: scene?.kind, text: scene?.text, time: scene?.time, vary: scene?.vary, language: scene?.html?.language, required: motionHtmlRequired(scene?.sceneTemplate).map((r) => r.id) },
    profile: render?.profile,
    focus: focus ? [focus] : [],
    ...(pairs.length ? { pairs } : {}),
    ...(render?.cast ? { cast: render.cast } : {}),
    ...(scene?.crossing ? { crossing: scene.crossing } : {}),
    movement,
    ...(Number.isFinite(render?.year) ? { year: render!.year } : {}),
  };
};
const CATALOG_JSON = JSON.stringify(MOTION_CATALOG_RUNTIME).replace(/</g, "\\u003c");
const VOCAB_JSON = JSON.stringify(MOTION_FIGURE_VOCAB_RUNTIME).replace(/</g, "\\u003c");
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
