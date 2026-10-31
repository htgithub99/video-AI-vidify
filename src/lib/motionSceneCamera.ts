import { MOTION_CAMERA as C } from "../constants/motionCamera.js";
import { compositionElements, motionSceneAnimationValue } from "./motionSceneComposition.js";
import { motionActorTracks } from "./motionActorTracks.js";
import { stringifyJson } from "./jsonStringify.js";
import type { MotionSceneComposition, MotionVectorAsset, MotionRemotionTimedScene } from "../types/motionVisual.js";
type Point = { x: number; y: number };
type Matrix = [number, number, number, number, number, number];
const identity = (): Matrix => [1, 0, 0, 1, 0, 0];
const multiply = (a: Matrix, b: Matrix): Matrix => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
const point = (m: Matrix, p: Point): Point => ({ x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] });
const inverse = (m: Matrix): Matrix | undefined => {
  const d = m[0] * m[3] - m[1] * m[2];
  return Math.abs(d) > 1e-9 ? [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d, (m[2] * m[5] - m[3] * m[4]) / d, (m[1] * m[4] - m[0] * m[5]) / d] : undefined;
};
const matrix = (value: string): Matrix => {
  let result = identity();
  for (const match of value.matchAll(/(translate|scale|rotate|matrix|skewX|skewY)\(([^)]*)\)/g)) {
    const n = match[2].match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)?.map(Number) || [];
    if (!n.length || !n.every(Number.isFinite)) continue;
    let next = identity();
    if (match[1] === "matrix" && n.length === 6) next = n as Matrix;
    if (match[1] === "translate") next = [1, 0, 0, 1, n[0], n[1] || 0];
    if (match[1] === "scale") next = [n[0], 0, 0, n[1] ?? n[0], 0, 0];
    if (match[1] === "rotate") {
      const a = (n[0] * Math.PI) / 180,
        x = n[1] || 0,
        y = n[2] || 0,
        c = Math.cos(a),
        s = Math.sin(a);
      next = [c, s, -s, c, x - c * x + s * y, y - s * x - c * y];
    }
    if (match[1] === "skewX") next[2] = Math.tan((n[0] * Math.PI) / 180);
    if (match[1] === "skewY") next[1] = Math.tan((n[0] * Math.PI) / 180);
    result = multiply(result, next);
  }
  return result;
};
const cache = new WeakMap<MotionSceneComposition, { asset: MotionVectorAsset; elements: ReturnType<typeof compositionElements>; tracks: ReturnType<typeof motionActorTracks>; paths: Map<string, Point[]> }>();
const contextFor = (composition: MotionSceneComposition, asset: MotionVectorAsset) => {
  let context = cache.get(composition);
  if (!context || context.asset !== asset) {
    context = { asset, elements: compositionElements(asset.svg), tracks: motionActorTracks(composition, asset.height).filter((track) => track.channel === "actor" && track.attribute === "transform"), paths: new Map() };
    cache.set(composition, context);
  }
  return context;
};
export const motionSceneSubjectPoint = (composition: MotionSceneComposition, asset: MotionVectorAsset, subjectId: string, initial: Point, seconds: number): Point => {
  const context = contextFor(composition, asset),
    element = context.elements.get(subjectId);
  if (!element) return initial;
  const transform = (at: number) =>
    element.lineage.reduce((result, item) => {
      const base = matrix(item.transform || ""),
        track = item.id && context.tracks.find((animation) => animation.target === item.id);
      return multiply(result, track ? multiply(base, matrix(motionSceneAnimationValue(track, at))) : base);
    }, identity());
  const original = inverse(transform(0));
  if (!original) return initial;
  const current = point(transform(seconds), point(original, initial));
  return [current.x, current.y].every(Number.isFinite) ? current : initial;
};
export const motionSceneCameraDirection = (scene: MotionRemotionTimedScene, asset: MotionVectorAsset, seconds: number, duration: number) => {
  const composition = scene.composition!,
    context = contextFor(composition, asset),
    plan = composition.design?.cameraMotion;
  const eligible = (id?: string) => composition.layers.find((layer) => layer.id === id && (layer.kind === "character" || layer.kind === "prop"));
  if (plan?.subjectId && !eligible(plan.subjectId)) return { mode: "hold" as const };
  const traveling = context.tracks.find((track) => !track.period && eligible(track.target) && /translate|matrix/.test(String(track.keyframes[0]?.value)));
  const subject = eligible(plan?.subjectId) || eligible(scene.focus?.[0]) || eligible(traveling?.target);
  const mode = plan?.mode || (traveling && subject?.id === traveling.target ? "follow" : "hold");
  if (mode === "hold" || !subject) return { mode: "hold" as const };
  const placement = composition.design?.placements.find((item) => item.id === subject.id)?.box;
  const origin = plan?.focus ? { x: plan.focus.x * asset.width, y: plan.focus.y * asset.height } : placement ? { x: (placement.x + placement.width / 2) * asset.width, y: (placement.y + placement.height / 2) * asset.height } : { x: asset.width / 2, y: asset.height / 2 };
  if (mode !== "follow") return { mode, origin, focus: origin };
  const key = stringifyJson([subject.id, origin, duration]);
  let path = context.paths.get(key);
  if (!path) {
    path = [origin];
    const step = 1 / C.SAMPLE_FPS,
      dx = asset.width * C.FOLLOW_SPEED * step,
      dy = asset.height * C.FOLLOW_SPEED * step;
    for (let at = 1; at <= Math.ceil(duration * C.SAMPLE_FPS); at++) {
      const target = motionSceneSubjectPoint(composition, asset, subject.id, origin, at * step),
        before = path[at - 1];
      path.push({ x: before.x + Math.max(-dx, Math.min(dx, target.x - before.x)), y: before.y + Math.max(-dy, Math.min(dy, target.y - before.y)) });
    }
    context.paths.set(key, path);
  }
  const frame = Math.max(0, Math.min(path.length - 1, seconds * C.SAMPLE_FPS)),
    at = Math.floor(frame),
    a = path[at],
    b = path[Math.min(at + 1, path.length - 1)],
    p = frame - at;
  return { mode, origin, focus: { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p } };
};
