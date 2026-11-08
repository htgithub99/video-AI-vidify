import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { MOTION_SCENE_SCORE as S } from "../constants/motionSceneScore.js";
import { parseSvgTransform, svgGeometry, svgWithin, type SvgGeometry } from "./motionSvgGeometry.js";
import { motionAnimationTracks } from "./motionActorTracks.js";
import type { MotionRemotionNode, MotionSceneActionPlan, MotionSceneAnimation, MotionSceneLayer } from "../types/motionVisual.js";
export interface MotionSceneScoreInput {
  svg: string;
  layers: MotionSceneLayer[];
  animations: MotionSceneAnimation[];
  nodes: Pick<MotionRemotionNode, "id" | "kind" | "entityId">[];
  actionPlan?: MotionSceneActionPlan;
  duration?: number;
  width: number;
  height: number;
  motion: boolean;
  picture?: { issues: string[]; severe: number };
}
export type MotionSceneCriterion = keyof typeof S.WEIGHTS;
export interface MotionSceneScore {
  revision: number;
  score: number;
  passed: boolean;
  issues: string[];
  criteria: Record<MotionSceneCriterion, number>;
}
type Subject = { nodeId: string; action: string; parts: unknown[]; phases: unknown[]; end: string };
const valueAt = (track: MotionSceneAnimation, time: number): string | number => {
  const t = track.period ? time % track.period : time;
  let current = track.keyframes[0];
  for (const frame of track.keyframes) if (frame.at <= t) current = frame;
  return current.value;
};
const offsetAt = (tracks: MotionSceneAnimation[], time: number): [number, number] =>
  tracks.reduce<[number, number]>(
    (sum, track) => {
      const m = parseSvgTransform(String(valueAt(track, time)));
      return [sum[0] + m[4], sum[1] + m[5]];
    },
    [0, 0],
  );
const lastTime = (track: MotionSceneAnimation, duration: number) => (track.period ? duration : track.keyframes.at(-1)?.at || 0);
const ratio = (bad: number, total: number) => (total ? 1 - bad / total : 1);
const outOfFrame = (input: MotionSceneScoreInput, geometry: SvgGeometry, transforms: MotionSceneAnimation[], seconds: number): { framed: number; outside: string[] } => {
  const framed = input.nodes.filter((node) => (node.kind === RT_MAINTENANCE.CHARACTER || node.kind === RT_MAINTENANCE.PROP) && geometry.boxes.has(node.id));
  const outside = framed
    .filter((node) => {
      const box = geometry.boxes.get(node.id)!;
      const carriers = input.motion ? transforms.filter((track) => track.target === node.id || geometry.ancestors.get(node.id)?.includes(track.target)) : [];
      const [w, h] = [Math.max(1, box.maxX - box.minX), Math.max(1, box.maxY - box.minY)];
      return [0, seconds / 2, seconds].some((time) => {
        const [dx, dy] = offsetAt(carriers, time);
        const overX = Math.max(0, -(box.minX + dx)) + Math.max(0, box.maxX + dx - input.width);
        const overY = Math.max(0, -(box.minY + dy)) + Math.max(0, box.maxY + dy - input.height);
        return overX / w > S.FRAME_TOLERANCE || overY / h > S.FRAME_TOLERANCE;
      });
    })
    .map((node) => node.id);
  return { framed: framed.length, outside };
};
export const scoreMotionScene = (input: MotionSceneScoreInput): MotionSceneScore => {
  const geometry = svgGeometry(input.svg);
  const tracks = motionAnimationTracks(Array.isArray(input.animations) ? input.animations : []).filter((track) => Array.isArray(track?.keyframes) && track.keyframes.length > 0);
  const transforms = tracks.filter((track) => track.attribute === RT_MAINTENANCE.TRANSFORM_3);
  const issues: string[] = [];
  const criteria: Record<MotionSceneCriterion, number> = { coverage: 1, parts: 1, frame: 1, duration: 1, identity: 1, stillness: 1, picture: 1 };
  const seconds = input.duration && input.duration > 0 ? input.duration : Math.max(1, ...tracks.map((track) => lastTime(track, 0)));
  const subjects: Subject[] = (input.actionPlan?.subjects || []).filter((subject) => typeof subject?.nodeId === "string");
  const still = (subject: Subject) => !subject.phases?.length && S.STILL_WORDS.test(`${subject.action}${RT_MAINTENANCE.SPACE}${subject.end}`);
  if (input.motion) {
    const moving = subjects.filter((subject) => !still(subject));
    const uncovered = moving.filter((subject) => !tracks.some((track) => svgWithin(geometry, subject.nodeId, track.target))).map((subject) => subject.nodeId);
    criteria.coverage = ratio(uncovered.length, moving.length);
    if (uncovered.length) issues.push(S.ISSUE.COVERAGE(uncovered));
    const withParts = moving.filter((subject) => (subject.parts?.length || 0) > 0);
    const rigid = withParts.filter((subject) => new Set(tracks.filter((track) => track.target !== subject.nodeId && svgWithin(geometry, subject.nodeId, track.target)).map((track) => track.target)).size < Math.min(2, subject.parts.length)).map((subject) => subject.nodeId);
    criteria.parts = ratio(rigid.length, withParts.length);
    if (rigid.length) issues.push(S.ISSUE.PARTS(rigid));
    if (moving.length && tracks.length) {
      const covered = Math.max(...tracks.map((track) => lastTime(track, seconds)));
      criteria.duration = Math.min(1, covered / (seconds * S.DURATION_COVER));
      if (criteria.duration < 1) issues.push(S.ISSUE.DURATION(seconds, covered));
    }
    const stillOnes = subjects.filter(still);
    const restless = stillOnes
      .filter((subject) => {
        const own = transforms.filter((track) => track.target === subject.nodeId);
        return [0, seconds / 2, seconds].some((time) => Math.hypot(...offsetAt(own, time)) > S.STILL_LIMIT * input.width);
      })
      .map((subject) => subject.nodeId);
    criteria.stillness = ratio(restless.length, stillOnes.length);
    if (restless.length) issues.push(S.ISSUE.STILL(restless));
  }
  const frame = outOfFrame(input, geometry, transforms, seconds);
  criteria.frame = ratio(frame.outside.length, frame.framed);
  if (frame.outside.length) issues.push(S.ISSUE.FRAME(frame.outside));
  const cast = input.nodes.filter((node) => node.kind === RT_MAINTENANCE.CHARACTER && node.entityId);
  const wrong = cast.filter((node) => !(input.layers || []).some((layer) => layer.id === node.id && layer.kind === RT_MAINTENANCE.CHARACTER && layer.entityId === node.entityId)).map((node) => node.id);
  criteria.identity = ratio(wrong.length, cast.length);
  if (wrong.length) issues.push(S.ISSUE.IDENTITY(wrong));
  if (input.picture?.issues.length) {
    criteria.picture = input.picture.severe ? 0 : Math.max(0, 1 - input.picture.issues.length * S.PICTURE_PENALTY);
    issues.push(...input.picture.issues);
  }
  const score = Math.round((Object.keys(S.WEIGHTS) as MotionSceneCriterion[]).reduce((sum, key) => sum + S.WEIGHTS[key] * Math.max(0, Math.min(1, criteria[key])), 0));
  return { revision: S.REVISION, score, passed: score >= S.THRESHOLD, issues, criteria };
};
