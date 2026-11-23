import { MOTION_SCENE_SPEC as S } from "../constants/motionSceneSpec.js";
import { motionSceneSpecOf } from "./motionSceneSpec.js";
import { motionSceneBeat, motionSceneChapters } from "./motionSceneChapters.js";
export type MotionPlaceLook = { ground: string; sun: "left" | "right" };
type Scene = { html?: { html?: string }; locationKey?: string; beatId?: string; fromLineId?: string; text?: string; placeLook?: MotionPlaceLook };
const mode = <V extends string>(list: V[]): V | undefined => {
  const n = new Map<V, number>();
  list.forEach((v) => n.set(v, (n.get(v) || 0) + 1));
  return [...n.entries()].sort((a, b) => b[1] - a[1] || list.indexOf(a[0]) - list.indexOf(b[0]))[0]?.[0];
};
export const motionPlaceLooks = <T extends Scene>(scenes: T[], beats: { id: string; chapterId?: string; place?: string }[] = []): T[] => {
  const chapters = motionSceneChapters(scenes, beats);
  const keyOf = scenes.map((scene, i) => {
    const place = motionSceneBeat(scene, beats)?.place || scene.locationKey || "";
    return place ? `${place}#${chapters[i]}` : "";
  });
  const specs = scenes.map((scene) => motionSceneSpecOf(scene.html?.html));
  const groups = new Map<string, number[]>();
  keyOf.forEach((k, i) => {
    const spec = specs[i];
    if (k && spec && !spec.map && !spec.interior) groups.set(k, [...(groups.get(k) || []), i]);
  });
  const looks = new Map<number, MotionPlaceLook>();
  groups.forEach((list) => {
    if (list.length < 2) return;
    const ground = mode(list.map((i) => specs[i]!.ground).filter((g) => g && g !== "snow"));
    const sun = mode(
      list.map((i) => {
        const W = specs[i]!.frame?.[0] || S.WIDTH,
          x = specs[i]!.sky?.sunX;
        return (Number.isFinite(x) ? x! / W : 0.84) < 0.5 ? "left" : "right";
      }),
    );
    if (ground && sun) list.forEach((i) => looks.set(i, { ground, sun: sun as "left" | "right" }));
  });
  let prev: { ground: string; chapter: string } | undefined;
  scenes.forEach((scene, i) => {
    const chapter = chapters[i];
    const spec = specs[i];
    if (!spec || spec.map || spec.interior) return;
    const own = looks.get(i)?.ground || spec.ground,
      text = String(scene.text || "").toLowerCase();
    const told = (g?: string) => !!g && (S.GROUND_WORDS[g] || []).some((w) => text.includes(w));
    if (own && prev && prev.chapter === chapter && own !== prev.ground && own !== "snow" && prev.ground !== "snow" && !told(own)) {
      const W = spec.frame?.[0] || S.WIDTH,
        x = spec.sky?.sunX;
      looks.set(i, { ground: prev.ground, sun: looks.get(i)?.sun || ((Number.isFinite(x) ? x! / W : 0.84) < 0.5 ? "left" : "right") });
    }
    const ground = looks.get(i)?.ground || own;
    if (ground) prev = { ground, chapter };
  });
  return scenes.map((scene, i) => (looks.has(i) ? { ...scene, placeLook: looks.get(i) } : scene));
};
