import { MOTION_STYLE_VALUES as SV } from "../constants/motionStyleConstraints.js";
import * as MR from "../constants/motionRuntime.js";
import _ from "lodash";
import { MOTION_POSES as P } from "../constants/motionPoses.js";
import { roundMotionNumber } from "./motionUtils.js";
import type { MotionBeat, MotionCastMember } from "../types/motionVideo.js";
import { MOTION_GEN_POSE_PROMPTS } from "../constants/motionGenPrompts.js";
import { motionStyleShowsPart, type MotionStyleConstraints } from "./motionStyleConstraints.js";
type V3 = [number, number, number];
type M3 = number[];
interface Transform { pos?: number[]; rot?: number[]; scale?: number[]; }
const DEG = Math.PI / 180;
const rotation = (rot: number[] = [0, 0, 0]): M3 => {
  const [a, b, c] = rot.map((value) => (Number(value) || 0) * DEG);
  const [ca, sa, cb, sb, cc, sc] = [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b), Math.cos(c), Math.sin(c)];
  return [cb * cc, -cb * sc, sb, ca * sc + sa * sb * cc, ca * cc - sa * sb * sc, -sa * cb, sa * sc - ca * sb * cc, sa * cc + ca * sb * sc, ca * cb];
};
const times = (m: M3, v: V3): V3 => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const compose = (m: M3, n: M3): M3 => [0, 1, 2].flatMap((row) => [0, 1, 2].map((col) => m[row * 3] * n[col] + m[row * 3 + 1] * n[3 + col] + m[row * 3 + 2] * n[6 + col]));
interface Frame { m: M3; t: V3; }
const frameOf = (value: Transform): Frame => {
  const scale = (value.scale || [1, 1, 1]).map((x) => Number(x) || 1);
  const r = rotation(value.rot);
  return { m: [r[0] * scale[0], r[1] * scale[1], r[2] * scale[2], r[3] * scale[0], r[4] * scale[1], r[5] * scale[2], r[6] * scale[0], r[7] * scale[1], r[8] * scale[2]], t: (value.pos || [0, 0, 0]).map((x) => Number(x) || 0) as V3 };
};
const chain = (parent: Frame, local: Frame): Frame => {
  const moved = times(parent.m, local.t);
  return { m: compose(parent.m, local.m), t: [parent.t[0] + moved[0], parent.t[1] + moved[1], parent.t[2] + moved[2]] };
};
const extentOf = (node: any): V3 => {
  const n = (value: unknown, fallback: number) => Math.abs(Number(value)) || fallback;
  const spread = (points: any[], index: number) => (Array.isArray(points) && points.length ? Math.max(...points.map((p) => Math.abs(Number(p?.[index]) || 0))) : 0.05);
  switch (node?.shape) {
    case MR.MOTION_TEXT_BOX:
      return [n(node.size?.[0], 0.1) / 2, n(node.size?.[1], 0.1) / 2, n(node.size?.[2], 0.1) / 2];
    case MR.MOTION_TEXT_SPHERE:
      return [n(node.radius, 0.1), n(node.radius, 0.1), n(node.radius, 0.1)];
    case MR.MOTION_TEXT_CYLINDER:
    case MR.MOTION_TEXT_CONE:
      return [n(node.radius, 0.1), n(node.height, 0.2) / 2, n(node.radius, 0.1)];
    case MR.MOTION_TEXT_CAPSULE:
      return [n(node.radius, 0.1), n(node.height, 0.2) / 2 + n(node.radius, 0.1), n(node.radius, 0.1)];
    case MR.MOTION_TEXT_TORUS:
      return [n(node.radius, 0.1) + n(node.tube, 0.03), n(node.radius, 0.1) + n(node.tube, 0.03), n(node.tube, 0.03)];
    case MR.MOTION_TEXT_PLANE:
      return [n(node.size?.[0], 0.1) / 2, n(node.size?.[1], 0.1) / 2, 0.001];
    case MR.MOTION_TEXT_DISC:
    case MR.MOTION_TEXT_RING:
      return [n(node.radius, 0.1), n(node.radius, 0.1), 0.001];
    case MR.MOTION_TEXT_EXTRUDE:
    case MR.MOTION_TEXT_STROKE:
      return [spread(node.points, 0), spread(node.points, 1), n(node.depth, 0.02) / 2];
    case MR.MOTION_TEXT_LATHE:
      return [spread(node.points, 0), spread(node.points, 1), spread(node.points, 0)];
    case MR.MOTION_TEXT_TUBE:
      return [spread(node.path, 0) + n(node.radius, 0.02), spread(node.path, 1) + n(node.radius, 0.02), spread(node.path, 2) + n(node.radius, 0.02)];
    default:
      return [0, 0, 0];
  }
};
const nodePoints = (nodes: any[], offset: V3 = [0, 0, 0], depth = 0): V3[] =>
  depth > 6
    ? []
    : _.flatMap(Array.isArray(nodes) ? nodes : [], (node) => {
        const center: V3 = [offset[0] + (Number(node?.pos?.[0]) || 0), offset[1] + (Number(node?.pos?.[1]) || 0), offset[2] + (Number(node?.pos?.[2]) || 0)];
        const scale = Array.isArray(node?.scale) ? node.scale.map((x: unknown) => Math.abs(Number(x)) || 1) : [1, 1, 1];
        const e = extentOf(node).map((value, axis) => value * scale[axis]) as V3;
        const own: V3[] = e.some((value) => value > 0) ? [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z): V3 => [center[0] + x * e[0], center[1] + y * e[1], center[2] + z * e[2]]))) : [];
        return [...own, ...nodePoints(node?.children, center, depth + 1), ...(node?.node ? nodePoints([node.node], center, depth + 1) : [])];
      });
const partsOf = (design: any): any[] => (Array.isArray(design?.parts) ? design.parts : []);
const restOf = (part: any): Transform => ({ pos: part.pos || [0, 0, 0], rot: part.rot || [0, 0, 0], scale: part.scale || [1, 1, 1] });
export const motionPartFrames = (design: any, pose: Record<string, Transform> = {}): Record<string, Frame> => {
  const parts = partsOf(design),
    byId = _.keyBy(parts, MR.MOTION_TEXT_ID),
    frames: Record<string, Frame> = {};
  const visit = (id: string, guard = 0): Frame => {
    if (frames[id]) return frames[id];
    const part = byId[id];
    const local = frameOf({ ...restOf(part), ..._.pick(pose[id] || {}, [MR.MOTION_TEXT_POS, MR.MOTION_TEXT_ROT, MR.MOTION_TEXT_SCALE]) });
    const parent = part.parent && byId[part.parent] && guard < 64 ? visit(part.parent, guard + 1) : { m: rotation(), t: [0, 0, 0] as V3 };
    return (frames[id] = chain(parent, local));
  };
  for (const part of parts) visit(part.id);
  return frames;
};
export const motionPoseBounds = (design: any, pose: Record<string, Transform> = {}): { minY: number; maxY: number } => {
  const frames = motionPartFrames(design, pose);
  let minY = Infinity,
    maxY = -Infinity;
  for (const part of partsOf(design)) {
    const frame = frames[part.id];
    for (const point of nodePoints(part.nodes)) {
      const y = frame.t[1] + times(frame.m, point)[1];
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return Number.isFinite(minY) ? { minY, maxY } : { minY: 0, maxY: 0 };
};
export const motionLimbParts = (design: any): { armRight?: string; armLeft?: string; legRight?: string; legLeft?: string; body?: string; head?: string; roots: string[] } => {
  const parts = partsOf(design),
    anchors = design?.anchors || {},
    byId = _.keyBy(parts, MR.MOTION_TEXT_ID);
  const frames = motionPartFrames(design);
  const top = (re: RegExp) => parts.filter((part) => re.test(part.id) && !(part.parent && re.test(part.parent)));
  const side = (list: any[], sign: number) => _.maxBy(list, (part) => sign * frames[part.id].t[0]);
  const pick = (anchor: string, re: RegExp, sign: number) => {
    if (byId[anchors[anchor]]) return anchors[anchor] as string;
    const list = top(re).filter((part) => sign * frames[part.id].t[0] > 0.005);
    return side(list, sign)?.id as string | undefined;
  };
  const A = P.LIMB_ANCHORS;
  return {
    armRight: pick(A.armRight, P.LIMB_RE.ARM, 1),
    armLeft: pick(A.armLeft, P.LIMB_RE.ARM, -1),
    legRight: pick(A.legRight, P.LIMB_RE.LEG, 1),
    legLeft: pick(A.legLeft, P.LIMB_RE.LEG, -1),
    body: byId[anchors[A.body]] ? anchors[A.body] : _.find(parts, (part) => P.LIMB_RE.BODY.test(part.id))?.id,
    head: byId[anchors[A.head]] ? anchors[A.head] : _.find(parts, (part) => P.LIMB_RE.HEAD.test(part.id))?.id,
    roots: parts.filter((part) => !part.parent || !byId[part.parent]).map((part) => part.id),
  };
};
const plus = (a: number[] = [0, 0, 0], b: number[] = [0, 0, 0]): number[] => [0, 1, 2].map((axis) => roundMotionNumber((Number(a[axis]) || 0) + (Number(b[axis]) || 0)));
const seatedName = (name: string): boolean => !(P.POSES.find((pose) => pose.name === name)?.grounded ?? !P.PATTERNS.SEATED.test(name));
const grounded = (design: any, name: string, pose: Record<string, Transform>): Record<string, Transform> => {
  const rest = motionPoseBounds(design).minY,
    posed = motionPoseBounds(design, pose),
    height = Math.max(0.1, posed.maxY - posed.minY);
  const gap = posed.minY - rest;
  if (Math.abs(gap) <= P.LIMITS.GROUND_TOLERANCE * height || (seatedName(name) && gap > 0)) return pose;
  const out = { ...pose };
  for (const root of motionLimbParts(design).roots) {
    const part = _.find(partsOf(design), { id: root });
    out[root] = { ...(out[root] || {}), pos: plus(out[root]?.pos || part?.pos, [0, -gap, 0]) };
  }
  return out;
};
export const motionProceduralPose = (design: any, name: string): Record<string, Transform> | undefined => {
  const spec = P.PROCEDURAL[name];
  if (!spec) return undefined;
  const limbs = motionLimbParts(design),
    byId = _.keyBy(partsOf(design), MR.MOTION_TEXT_ID),
    pose: Record<string, Transform> = {};
  const turn = (id: string | undefined, delta: number[]) => {
    if (!id || !byId[id]) return false;
    pose[id] = { rot: plus(byId[id].rot, delta) };
    return true;
  };
  let ok = true;
  if (spec.legs) ok = turn(limbs.legRight, [spec.legs[0], 0, 0]) && turn(limbs.legLeft, [spec.legs[1], 0, 0]) && ok;
  if (spec.arms) ok = turn(limbs.armRight, [spec.arms[0], 0, 0]) && turn(limbs.armLeft, [spec.arms[1], 0, 0]) && ok;
  if (spec.armRight) ok = turn(limbs.armRight, spec.armRight) && ok;
  if (spec.armLeft) ok = turn(limbs.armLeft, spec.armLeft) && ok;
  if (spec.body) ok = turn(limbs.body, spec.body) && ok;
  if (spec.root) ok = _.every(limbs.roots, (root) => turn(root, spec.root!)) && limbs.roots.length > 0 && ok;
  return ok ? grounded(design, name, pose) : undefined;
};
const wrap = (value: number): number => (((((Number(value) || 0) + 180) % 360) + 360) % 360) - 180;
export const motionSanitizePoses = (design: any): { design: any; changes: string[] } => {
  if (!design?.poses) return { design, changes: [] };
  const byId = _.keyBy(partsOf(design), MR.MOTION_TEXT_ID),
    head = motionLimbParts(design).head,
    changes: string[] = [];
  const poses: Record<string, Record<string, Transform>> = {};
  for (const [name, pose] of Object.entries<Record<string, Transform>>(design.poses)) {
    const fixed: Record<string, Transform> = {};
    for (const [id, value] of Object.entries(pose || {})) {
      if (!byId[id]) {
        changes.push(P.DIAGNOSTICS.UNKNOWN_PART(name, id));
        continue;
      }
      const next: Transform = { ...value };
      if (value.rot) {
        const rest = byId[id].rot || [0, 0, 0],
          limit = id === head ? P.LIMITS.HEAD_ROT : P.LIMITS.ROT;
        next.rot = value.rot.map((angle, axis) => roundMotionNumber((Number(rest[axis]) || 0) + _.clamp(wrap(angle - (Number(rest[axis]) || 0)), -limit, limit)));
        if (
          !_.isEqual(
            next.rot,
            value.rot.map((x) => roundMotionNumber(Number(x) || 0)),
          )
        )
          changes.push(P.DIAGNOSTICS.ROTATION(name, id));
      }
      if (value.scale) {
        next.scale = value.scale.map((x) => _.clamp(Number(x) || 1, P.LIMITS.SCALE_MIN, P.LIMITS.SCALE_MAX));
        if (!_.isEqual(next.scale, value.scale)) changes.push(P.DIAGNOSTICS.SCALE(name, id));
      }
      fixed[id] = next;
    }
    const level = grounded(design, name, fixed);
    if (level !== fixed) changes.push(P.DIAGNOSTICS.GROUND(name));
    poses[name] = level;
  }
  return { design: { ...design, poses }, changes };
};
const hasKey = (text: string, key: string): boolean => new RegExp(P.PATTERNS.PHRASE(_.escapeRegExp(key)), P.PATTERNS.FLAGS).test(text);
export const motionPoseNamesIn = (text: string): string[] => {
  const lower = _.toLower(text).normalize(MR.MOTION_TEXT_NFC);
  return _.map(
    _.orderBy(
      _.filter(
        _.map(P.POSES, (pose) => ({ name: pose.name, hits: _.sumBy(pose.keys, (key) => (hasKey(lower, key) ? 1 : 0)) })),
        (entry) => entry.hits > 0,
      ),
      [MR.MOTION_TEXT_HITS],
      [MR.MOTION_TEXT_DESC],
    ),
    MR.MOTION_TEXT_NAME,
  );
};
export interface MotionCastNeeds { poses: string[]; expressions: string[]; lines: string[]; }
export const motionCastNeeds = (beats: MotionBeat[], cast: MotionCastMember[], emotionExpression: Record<string, string>, constraints?: MotionStyleConstraints): Record<string, MotionCastNeeds> =>
  _.fromPairs(
    _.map(cast, (member) => {
      const own = _.filter(beats, (beat) => _.includes(beat.cast || [], member.key));
      const lines = _.uniq(
        _.compact(
          _.flatMap(own, (beat) => {
            const text = _.compact([beat.action, beat.scenePlan?.subject, beat.narration]).join(MR.MOTION_TEXT_SYMBOL_58);
            if ((beat.cast || []).length <= 1) return [beat.action || beat.narration];
            const name = _.toLower(member.name);
            return _.filter(_.map(text.split(P.PATTERNS.CLAUSES), _.trim), (clause) => !!clause && (_.toLower(clause).includes(name) || _.toLower(clause).includes(member.key)));
          }),
        ),
      ).slice(0, P.MAX_ACTION_LINES);
      const poses = _.uniq(_.flatMap(lines, motionPoseNamesIn)).filter((name) => !_.includes(P.AUTOMATIC, name) && motionPoseFits(name, constraints));
      const feelings = _.flatMap(own, (beat) => [
        ..._.map(
          _.filter(beat.utterances || [], (line) => line.speaker === member.key),
          MR.MOTION_TEXT_EMOTION,
        ),
        ...(beat.sceneMood && (beat.cast || []).length <= 1 ? [beat.sceneMood.mood] : []),
      ]);
      const expressions = _.uniq(_.compact(_.map(feelings, (emotion) => emotionExpression[emotion])));
      return [member.key, { poses, expressions, lines }];
    }),
  );
export const motionCastSummary = (design: any, motion: boolean): Record<string, unknown> => {
  const bounds = motionPoseBounds(design);
  return _.omitBy(
    {
      height: roundMotionNumber(bounds.maxY - bounds.minY),
      anchors: design?.anchors,
      parts: _.map(partsOf(design), MR.MOTION_TEXT_ID),
      poses: _.keys(design?.poses),
      motions: motion ? _.keys(design?.motions) : undefined,
      expressions: _.keys(design?.expressions),
    },
    _.isUndefined,
  );
};
export const motionPartOutline = (design: any): Record<string, unknown>[] => {
  const frames = motionPartFrames(design);
  return _.map(partsOf(design), (part) => {
    const points = nodePoints(part.nodes);
    const size = [0, 1, 2].map((axis) => (points.length ? roundMotionNumber(Math.max(...points.map((p) => p[axis])) - Math.min(...points.map((p) => p[axis]))) : 0));
    return _.omitBy({ id: part.id, parent: part.parent, pos: part.pos, rot: part.rot, size, world: frames[part.id].t.map(roundMotionNumber) }, _.isUndefined);
  });
};
export const motionPoseFits = (name: string, constraints?: MotionStyleConstraints): boolean => !constraints || _.every(P.LIMBS[name] || [], (part) => motionStyleShowsPart(constraints, part));
export const motionPoseRule = (constraints: MotionStyleConstraints): string => {
  const arms = motionStyleShowsPart(constraints, SV.ARMS),
    legs = motionStyleShowsPart(constraints, SV.LEGS);
  const anchors = arms && legs ? MOTION_GEN_POSE_PROMPTS.ANCHORS_FULL : arms ? MOTION_GEN_POSE_PROMPTS.ANCHORS_ARMS : legs ? MOTION_GEN_POSE_PROMPTS.ANCHORS_LEGS : MOTION_GEN_POSE_PROMPTS.ANCHORS_NONE;
  return MOTION_GEN_POSE_PROMPTS.RULE(
    _.filter(_.map(P.POSES, MR.MOTION_TEXT_NAME), (name) => motionPoseFits(name, constraints)),
    [...P.EXPRESSIONS],
    anchors,
  );
};
