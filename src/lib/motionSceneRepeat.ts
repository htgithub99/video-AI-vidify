import { MOTION_SCENE_REVISE as R } from "../constants/motionSceneSpec.js";
import { motionSceneSpecOf } from "./motionSceneSpec.js";
type Scene = { html?: { html?: string }; vary?: number };
const tokens = (html: string | undefined): Set<string> | undefined => {
  const spec = motionSceneSpecOf(html);
  if (!spec || spec.map) return undefined;
  const [w, h] = spec.frame || [1280, 720];
  return new Set([`${spec.time}|${spec.ground}|${Math.round(spec.horizon / (h * R.REPEAT.CELL))}`, ...spec.items.map((it) => `${it.fn}|${it.kind || ""}|${Math.round((it.x ?? it.from ?? 0) / (w * R.REPEAT.CELL))}|${Math.round((it.y ?? 0) / (h * R.REPEAT.CELL))}`)]);
};
export const motionSceneRepeats = <T extends Scene>(scenes: T[]): T[] => {
  let before: Set<string> | undefined,
    varied = false,
    run = 0;
  return scenes.map((scene) => {
    const now = tokens(scene.html?.html),
      same = !!now && !!before && [...now].filter((t) => before!.has(t)).length / new Set([...now, ...before]).size >= R.REPEAT.SAME;
    before = now;
    run = same ? run + 1 : 0;
    varied = same && !varied;
    const vary = run >= R.REPEAT.REFRAME_RUN && !varied ? 2 : varied ? 1 : 0;
    return vary ? { ...scene, vary } : scene;
  });
};
