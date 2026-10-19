import _ from "lodash";
import * as MR from "../constants/motionRuntime.js";
import { MOTION_STYLE_CALIBRATION_SET as CS, MOTION_STYLE_METRIC_LIMITS as LIMITS, MOTION_STYLE_METRIC_DEFAULTS as DEFAULTS, MOTION_STYLE_METRIC_VALUES as V, MOTION_STYLE_FIGURE as F, MOTION_STYLE_SET as SET, MOTION_STYLE_METRICS_LOG as LOG } from "../constants/motionStyleMetrics.js";
import { MOTION_STYLE_VALUES as SV } from "../constants/motionStyleConstraints.js";
import type { MotionStyleConstraints } from "./motionStyleConstraints.js";
import type { MotionFlatCamera, MotionReferenceStyle, MotionStyleMetrics, MotionStyleShotMix } from "../types/motionVideo.js";
type Vec3 = [number, number, number];
type Box = { min: Vec3; max: Vec3 };
type Mat3 = number[];
const DEG = Math.PI / 180;
const round = (value: number): number => Math.round(value * 1000) / 1000;
const numberIn = (value: unknown, key: string): number | undefined => {
  const n = typeof value === MR.MOTION_TEXT_STRING ? parseFloat(value as string) : (value as number);
  if (typeof n !== MR.MOTION_TEXT_NUMBER || !Number.isFinite(n)) return undefined;
  const [lo, hi] = LIMITS[key];
  return round(_.clamp(n, lo, hi));
};
const shotMixOf = (value: any): MotionStyleShotMix | undefined => {
  if (!value || typeof value !== MR.MOTION_TEXT_OBJECT) return undefined;
  const raw = _.map(V.SHOTS, (shot) => Math.max(0, Number(value[shot]) || 0));
  const total = _.sum(raw);
  if (!total) return undefined;
  return _.zipObject(
    V.SHOTS,
    _.map(raw, (n) => round(n / total)),
  ) as unknown as MotionStyleShotMix;
};
export const normalizeMotionStyleMetrics = (value: any): MotionStyleMetrics | undefined => {
  if (!value || typeof value !== MR.MOTION_TEXT_OBJECT || Array.isArray(value)) return undefined;
  const numbers = _.omitBy(_.mapValues(LIMITS, (_range, key) => numberIn(value[key], key)), _.isUndefined);
  const metrics = _.omitBy(
    {
      ...numbers,
      bodyShape: _.includes(V.BODY_SHAPES, value.bodyShape) ? value.bodyShape : undefined,
      groundView: _.includes(V.GROUND_VIEWS, value.groundView) ? value.groundView : undefined,
      shotMix: shotMixOf(value.shotMix),
      calibrated: value.calibrated === true ? true : undefined,
    },
    _.isUndefined,
  ) as MotionStyleMetrics;
  return _.isEmpty(_.omit(metrics, V.CALIBRATED)) ? undefined : metrics;
};
export const mergeMotionStyleMetrics = (base: MotionStyleMetrics | undefined, patch: unknown): { metrics: MotionStyleMetrics | undefined; changes: string[] } => {
  const next = normalizeMotionStyleMetrics(patch);
  if (!next) return { metrics: base, changes: [] };
  const merged = normalizeMotionStyleMetrics({ ...(base || {}), ...next, shotMix: next.shotMix || base?.shotMix }) || base;
  const changes = _.compact(
    _.map(_.omit(next, V.CALIBRATED), (value, key) => {
      const before = (base as Record<string, unknown> | undefined)?.[key];
      return _.isEqual(before, value) ? undefined : LOG.CHANGE(key, _.isObject(before) ? JSON.stringify(before) : _.toString(before ?? V.MISSING), _.isObject(value) ? JSON.stringify(value) : _.toString(value));
    }),
  );
  return { metrics: merged, changes };
};
export const motionMetricsText = (metrics: MotionStyleMetrics | undefined): string => (metrics ? JSON.stringify(_.omit(metrics, V.CALIBRATED)) : MR.MOTION_TEXT_EMPTY);
const or = (value: number | undefined, fallback: number): number => value ?? fallback;
export const motionGroundTilted = (style: MotionReferenceStyle | undefined, drawingMode?: string): boolean => drawingMode === MR.MOTION_TEXT_2D && style?.metrics?.groundView === V.TILTED;
export const motionFlatCamera = (style: MotionReferenceStyle | undefined, drawingMode?: string): MotionFlatCamera | undefined => {
  const metrics = style?.metrics;
  if (drawingMode !== MR.MOTION_TEXT_2D || !metrics) return undefined;
  return _.omitBy({ pitch: metrics.groundView === V.TILTED ? or(metrics.groundTilt, DEFAULTS.groundTilt) : 0, wideFigure: metrics.wideFigure, horizon: metrics.horizon }, _.isUndefined) as unknown as MotionFlatCamera;
};
const rotation = (rot?: number[]): Mat3 => {
  const [x, y, z] = _.map(rot || [0, 0, 0], (v) => (v || 0) * DEG);
  const cx = Math.cos(x),
    sx = Math.sin(x),
    cy = Math.cos(y),
    sy = Math.sin(y),
    cz = Math.cos(z),
    sz = Math.sin(z);
  return [cy * cz + sy * sx * sz, sy * sx * cz - cy * sz, sy * cx, cx * sz, cx * cz, -sx, cy * sx * sz - sy * cz, sy * sz + cy * sx * cz, cy * cx];
};
const apply = (m: Mat3, v: Vec3): Vec3 => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const corners = (box: Box): Vec3[] => _.flatMap([box.min[0], box.max[0]], (x) => _.flatMap([box.min[1], box.max[1]], (y) => _.map([box.min[2], box.max[2]], (z): Vec3 => [x, y, z])));
const unite = (boxes: (Box | null)[]): Box | null => {
  const list = _.compact(boxes);
  if (!list.length) return null;
  return { min: [0, 1, 2].map((i) => _.min(_.map(list, (b) => b.min[i]))!) as Vec3, max: [0, 1, 2].map((i) => _.max(_.map(list, (b) => b.max[i]))!) as Vec3 };
};
const transformBox = (box: Box, node: any): Box => {
  const s: number[] = Array.isArray(node.scale) ? node.scale : typeof node.scale === MR.MOTION_TEXT_NUMBER ? [node.scale, node.scale, node.scale] : [1, 1, 1];
  const m = rotation(node.rot);
  const p: number[] = node.pos || [0, 0, 0];
  const points = _.map(corners(box), (c) => {
    const r = apply(m, [c[0] * s[0], c[1] * s[1], c[2] * s[2]]);
    return [r[0] + p[0], r[1] + p[1], r[2] + p[2]] as Vec3;
  });
  return { min: [0, 1, 2].map((i) => _.min(_.map(points, (q) => q[i]))!) as Vec3, max: [0, 1, 2].map((i) => _.max(_.map(points, (q) => q[i]))!) as Vec3 };
};
const half = (w: number, h: number, d: number): Box => ({ min: [-w / 2, -h / 2, -d / 2], max: [w / 2, h / 2, d / 2] });
const localBox = (node: any, defs: Record<string, any[]>, depth: number): Box | null => {
  const r = Number(node.radius) || 0;
  switch (node.shape) {
    case MR.MOTION_TEXT_BOX:
      return Array.isArray(node.size) ? half(node.size[0], node.size[1], node.size[2]) : null;
    case MR.MOTION_TEXT_CYLINDER:
    case MR.MOTION_TEXT_CONE: {
      const w = 2 * Math.max(r, Number(node.radiusTop) || 0, Number(node.radiusBottom) || 0);
      return half(w, Number(node.height) || 0, w);
    }
    case MR.MOTION_TEXT_SPHERE:
      return half(2 * r, 2 * r, 2 * r);
    case MR.MOTION_TEXT_CAPSULE:
      return half(2 * r, Math.max(Number(node.height) || 0, 2 * r), 2 * r);
    case MR.MOTION_TEXT_DISC:
    case MR.MOTION_TEXT_RING:
      return half(2 * r, 2 * r, 0.01);
    case MR.MOTION_TEXT_PLANE:
      return Array.isArray(node.size) ? half(node.size[0], node.size[1], 0.01) : null;
    case MR.MOTION_TEXT_EXTRUDE: {
      const pts: number[][] = Array.isArray(node.points) ? node.points : [];
      if (!pts.length) return null;
      const d = Number(node.depth) || 0;
      return { min: [_.min(_.map(pts, 0))!, _.min(_.map(pts, 1))!, -d / 2], max: [_.max(_.map(pts, 0))!, _.max(_.map(pts, 1))!, d / 2] };
    }
    case MR.MOTION_TEXT_GROUP:
      return unite(_.map(node.children || [], (child) => motionNodeBox(child, defs, depth + 1)));
    case MR.MOTION_TEXT_USE:
      return unite(_.map(defs[node.ref] || [], (child) => motionNodeBox(child, defs, depth + 1)));
    case MR.MOTION_TEXT_REPEAT: {
      const inner = node.node ? motionNodeBox(node.node, defs, depth + 1) : null;
      if (!inner) return null;
      const count: number[] = node.count || [1, 1, 1],
        step: number[] = node.step || [0, 0, 0];
      const ex = [0, 1, 2].map((i) => ((count[i] || 1) - 1) * (step[i] || 0));
      return { min: [0, 1, 2].map((i) => inner.min[i] + Math.min(0, ex[i])) as Vec3, max: [0, 1, 2].map((i) => inner.max[i] + Math.max(0, ex[i])) as Vec3 };
    }
    default:
      return null;
  }
};
export const motionNodeBox = (node: any, defs: Record<string, any[]> = {}, depth = 0): Box | null => {
  if (!node || depth > 8 || node.visible === false || node.shape === MR.MOTION_TEXT_LIGHT) return null;
  const box = localBox(node, defs, depth);
  return box ? transformBox(box, node) : null;
};
const nodesBox = (nodes: any[], defs: Record<string, any[]> = {}): Box | null => unite(_.map(nodes || [], (node) => motionNodeBox(node, defs)));
const size = (box: Box): Vec3 => [box.max[0] - box.min[0], box.max[1] - box.min[1], box.max[2] - box.min[2]];
const colourOf = (node: any, materials: Record<string, any>): string | undefined => {
  const mat = typeof node?.mat === MR.MOTION_TEXT_STRING ? materials[node.mat] : node?.mat;
  return typeof mat?.color === MR.MOTION_TEXT_STRING ? mat.color : undefined;
};
const firstColour = (nodes: any[], materials: Record<string, any>): string | undefined => {
  for (const node of nodes || []) {
    const own = colourOf(node, materials) || firstColour(node.children || [], materials);
    if (own) return own;
  }
  return undefined;
};
const partOf = (design: any, id?: string): any => (id ? _.find(design?.parts, { id }) : undefined);
const bodyPart = (design: any): any => partOf(design, design?.anchors?.body) || _.find(design?.parts, (part) => F.ID_RE.BODY.test(part.id));
const ellipse = (radius: number, stretch: number, pos: Vec3, colour: string): any => ({ shape: MR.MOTION_TEXT_CYLINDER, pos, rot: [F.ROT_X, 0, 0], scale: [1, 1, round(stretch)], mat: { color: colour, roughness: 1, metalness: 0, unlit: true }, radius: round(radius), height: F.FEATURE_DEPTH, segments: F.SEGMENTS });
export const motionStyleTemplate = (metrics: MotionStyleMetrics, colours: { body: string; face: string; feature: string }, options: { arms: boolean }): any => {
  const D = F.HEAD_DIAMETER;
  const aspect = or(metrics.headAspect, DEFAULTS.headAspect);
  const headH = D * aspect;
  const bodyH = round(or(metrics.bodyToHead, DEFAULTS.bodyToHead) * headH);
  const bodyW = round(or(metrics.bodyWidth, DEFAULTS.bodyWidth) * D);
  const profile = F.PROFILE[metrics.bodyShape || V.DOME] || F.PROFILE[V.DOME];
  const left = _.map(profile, ([x, y]) => [round(x * bodyW), round(y * bodyH)]);
  const right = _.map(_.reverse(_.initial(_.clone(left))), ([x, y]) => [round(-x), y]);
  const flat = (colour: string) => ({ color: colour, roughness: 1, metalness: 0, unlit: true });
  const headY = round(bodyH + headH / 2 - headH * F.HEAD_OVERLAP);
  const eyeW = (or(metrics.eyeWidth, DEFAULTS.eyeWidth) * D) / 2;
  const eyeStretch = (or(metrics.eyeHeight, DEFAULTS.eyeHeight) * headH) / (2 * eyeW);
  const eyeX = (or(metrics.eyeGap, DEFAULTS.eyeGap) * D) / 2;
  const eyeY = or(metrics.eyeY, DEFAULTS.eyeY) * headH;
  const mouthW = (or(metrics.mouthWidth, DEFAULTS.mouthWidth) * D) / 2;
  const mouthStretch = (or(metrics.mouthHeight, DEFAULTS.mouthHeight) * headH) / (2 * mouthW);
  const mouthY = round(or(metrics.mouthY, DEFAULTS.mouthY) * headH);
  const armR = (or(metrics.armThickness, DEFAULTS.armThickness) * D) / 2;
  const armL = Math.max(armR * 2, or(metrics.armLength, DEFAULTS.armLength) * headH);
  const withArms = options.arms && armR > F.MIN_ARM;
  const arm = (id: string, side: number) => ({ id, pos: [round(side * (bodyW / 2 - armR * F.ARM_INSET)), round(bodyH * F.SHOULDER), F.ARM_Z], rot: [0, 0, side * F.ARM_SWING], parent: F.IDS.BODY, nodes: [{ shape: MR.MOTION_TEXT_CAPSULE, name: F.MATS.BODY, pos: [0, round(-armL / 2), 0], mat: flat(colours.body), radius: round(armR), height: round(armL) }] });
  const parts = [
    { id: F.IDS.BODY, pos: [0, 0, 0], nodes: [{ shape: MR.MOTION_TEXT_EXTRUDE, name: F.MATS.BODY, pos: [0, 0, -F.HEAD_Z], mat: flat(colours.body), points: [...left, ...right], depth: F.DEPTH }] },
    { id: F.IDS.HEAD, pos: [0, headY, F.HEAD_Z], parent: F.IDS.BODY, nodes: [{ shape: MR.MOTION_TEXT_CYLINDER, name: F.MATS.SKIN, pos: [0, 0, 0], rot: [F.ROT_X, 0, 0], scale: [1, 1, round(aspect)], mat: flat(colours.face), radius: D / 2, height: F.DEPTH, segments: F.SEGMENTS }] },
    { id: F.IDS.EYES, pos: [0, round(eyeY), F.FEATURE_Z], parent: F.IDS.HEAD, nodes: [ellipse(eyeW, eyeStretch, [round(-eyeX), 0, 0], colours.feature), ellipse(eyeW, eyeStretch, [round(eyeX), 0, 0], colours.feature)] },
    { id: F.IDS.MOUTH, pos: [0, mouthY, F.FEATURE_Z], parent: F.IDS.HEAD, nodes: [ellipse(mouthW, mouthStretch, [0, 0, 0], colours.feature)] },
    { id: F.IDS.MOUTH_OPEN, pos: [0, mouthY, F.FEATURE_Z], parent: F.IDS.HEAD, visible: false, nodes: [ellipse(mouthW * F.OPEN_MOUTH, mouthStretch * F.OPEN_MOUTH, [0, 0, 0], colours.feature)] },
    ...(withArms ? [arm(F.IDS.ARM_L, -1), arm(F.IDS.ARM_R, 1)] : []),
  ];
  return {
    materials: { [F.MATS.SKIN]: flat(colours.face), [F.MATS.BODY]: flat(colours.body), [F.MATS.FEATURE]: flat(colours.feature) },
    parts,
    anchors: _.omitBy({ body: F.IDS.BODY, head: F.IDS.HEAD, arm_l: withArms ? F.IDS.ARM_L : undefined, arm_r: withArms ? F.IDS.ARM_R : undefined }, _.isUndefined),
    poses: {},
    motions: {},
    expressions: { [F.EXPRESSIONS.TALK]: { [F.IDS.MOUTH]: { visible: false }, [F.IDS.MOUTH_OPEN]: { visible: true } }, [F.EXPRESSIONS.BLINK]: { [F.IDS.EYES]: { scale: [1, F.BLINK, 1] } } },
  };
};
const templateId = (design: any, id: string): string | undefined => {
  const anchors = design?.anchors || {};
  if (id === anchors.body || (!anchors.body && F.ID_RE.BODY.test(id))) return F.IDS.BODY;
  if (id === anchors.head) return F.IDS.HEAD;
  if (id === anchors.arm_l || id === anchors.armLeft) return F.IDS.ARM_L;
  if (id === anchors.arm_r || id === anchors.armRight) return F.IDS.ARM_R;
  if (F.ID_RE.BROW.test(id)) return undefined;
  if (F.ID_RE.MOUTH_OPEN.test(id)) return F.IDS.MOUTH_OPEN;
  if (F.ID_RE.MOUTH.test(id)) return F.IDS.MOUTH;
  if (F.ID_RE.EYES.test(id)) return F.IDS.EYES;
  return _.includes(_.values(F.IDS), id) ? id : undefined;
};
const remapEntries = (design: any, entries: Record<string, Record<string, any>> | undefined, ids: Set<string>): Record<string, Record<string, any>> =>
  _.mapValues(entries || {}, (entry) =>
    _.omitBy(
      _.mapKeys(
        _.mapValues(entry, (value) => _.omit(value, MR.MOTION_TEXT_POS)),
        (_value, id) => templateId(design, id) || id,
      ),
      (value, id) => !ids.has(id) || _.isEmpty(value),
    ),
  );
const rebuildFigure = (design: any, metrics: MotionStyleMetrics, constraints: MotionStyleConstraints, outline?: string): any => {
  const materials = design.materials || {};
  const body = colourOf({ mat: F.MATS.BODY }, materials) || firstColour(bodyPart(design)?.nodes || [], materials) || F.FALLBACK_BODY;
  const face = constraints.faceFill || colourOf({ mat: F.MATS.SKIN }, materials) || firstColour(partOf(design, design?.anchors?.head)?.nodes || [], materials) || F.FALLBACK_FACE;
  const feature = colourOf({ mat: F.MATS.FEATURE }, materials) || outline || F.FALLBACK_FEATURE;
  const template = motionStyleTemplate(metrics, { body, face, feature }, { arms: !_.includes(constraints.absent, SV.ARMS) });
  const ids = new Set<string>(_.map(template.parts, MR.MOTION_TEXT_ID));
  const motions = _.mapValues(design.motions || {}, (motion: any) => ({ ...motion, tracks: _.compact(_.map(motion?.tracks || [], (track: any) => (ids.has(templateId(design, track?.part) || MR.MOTION_TEXT_EMPTY) ? { ...track, part: templateId(design, track.part), keys: _.map(track.keys || [], (key: any) => _.omit(key, MR.MOTION_TEXT_POS)) } : null))) }));
  return {
    ...template,
    poses: remapEntries(design, design.poses, ids),
    expressions: { ...remapEntries(design, design.expressions, ids), ...template.expressions },
    motions: _.omitBy(motions, (motion: any) => !motion.tracks.length),
  };
};
const scaleNode = (node: any, k: number): any => {
  const out = { ...node };
  for (const key of [MR.MOTION_TEXT_RADIUS, V.RADIUS_TOP, V.RADIUS_BOTTOM, MR.MOTION_TEXT_HEIGHT]) if (typeof out[key] === MR.MOTION_TEXT_NUMBER && !(key === MR.MOTION_TEXT_HEIGHT && out.shape === MR.MOTION_TEXT_CYLINDER && Math.abs(out.rot?.[0] || 0) === F.ROT_X)) out[key] = round(out[key] * k);
  if (Array.isArray(out.size)) out.size = _.map(out.size, (v: number) => round(v * k));
  if (Array.isArray(out.points)) {
    const box = localBox(out, {}, 0);
    if (box) {
      const cx = (box.min[0] + box.max[0]) / 2,
        cy = (box.min[1] + box.max[1]) / 2;
      out.points = _.map(out.points, ([x, y]: number[]) => [round(cx + (x - cx) * k), round(cy + (y - cy) * k)]);
    }
  }
  if (Array.isArray(out.children)) out.children = _.map(out.children, (child) => scaleNode(child, k));
  return out;
};
const fitFeatures = (design: any, metrics: MotionStyleMetrics): { design: any; changes: string[] } => {
  const head = partOf(design, design?.anchors?.head);
  const headBox = head ? nodesBox(head.nodes) : null;
  if (!headBox) return { design, changes: [] };
  const headH = size(headBox)[1];
  const changes: string[] = [];
  const factor = (test: (id: string) => boolean, target?: number): number | undefined => {
    if (!target || !headH) return undefined;
    const parts = _.filter(design.parts, (part) => test(part.id));
    const heights = _.compact(_.map(parts, (part) => nodesBox(part.nodes))).map((box) => size(box)[1]);
    const current = _.max(heights);
    if (!current) return undefined;
    const k = _.clamp(target / (current / headH), F.FIT_RANGE[0], F.FIT_RANGE[1]);
    return Math.abs(k - 1) > F.FIT_THRESHOLD ? k : undefined;
  };
  const isEye = (id: string) => F.ID_RE.EYES.test(id) && !F.ID_RE.BROW.test(id);
  const isMouth = (id: string) => F.ID_RE.MOUTH.test(id) || F.ID_RE.MOUTH_OPEN.test(id);
  const eyeK = factor(isEye, metrics.eyeHeight);
  const mouthK = factor((id) => F.ID_RE.MOUTH.test(id), metrics.mouthHeight);
  if (!eyeK && !mouthK) return { design, changes };
  if (eyeK) changes.push(LOG.EYES(eyeK.toFixed(2)));
  if (mouthK) changes.push(LOG.MOUTH(mouthK.toFixed(2)));
  const parts = _.map(design.parts, (part) => {
    const k = eyeK && isEye(part.id) ? eyeK : mouthK && isMouth(part.id) ? mouthK : undefined;
    return k ? { ...part, nodes: _.map(part.nodes, (node) => scaleNode(node, k)) } : part;
  });
  return { design: { ...design, parts }, changes };
};
export const motionTemplateFits = (constraints: MotionStyleConstraints, drawingMode?: string, animal?: boolean): boolean => !animal && constraints.sharedFigure && drawingMode === MR.MOTION_TEXT_2D && constraints.shading.kind === SV.FLAT && (_.includes(constraints.absent, SV.LEGS) || _.includes(constraints.hidden, SV.LEGS));
export const motionFitCharacter = (design: any, style: MotionReferenceStyle | undefined, constraints: MotionStyleConstraints, drawingMode?: string, animal?: boolean): { design: any; template: boolean; changes: string[] } => {
  const metrics = style?.metrics;
  if (!metrics || !Array.isArray(design?.parts)) return { design, template: false, changes: [] };
  if (motionTemplateFits(constraints, drawingMode, animal)) return { design: rebuildFigure(design, metrics, constraints, style?.outlineColor), template: true, changes: [] };
  const fitted = fitFeatures(design, metrics);
  return { design: fitted.design, template: false, changes: fitted.changes };
};
const nodeName = (node: any): string => [node?.name, node?.ref].filter(Boolean).join(MR.MOTION_TEXT_SYMBOL_13);
const isSky = (node: any, box: Box): boolean => SET.SKY_RE.test(nodeName(node)) || size(box)[0] > SET.SKY_WIDTH;
export const motionFitFlatLocation = (location: any, style: MotionReferenceStyle | undefined, drawingMode?: string): { location: any; changes: string[] } => {
  if (!motionGroundTilted(style, drawingMode) || !Array.isArray(location?.nodes)) return { location, changes: [] };
  const defs: Record<string, any[]> = location.defs || {};
  const stage = location.stage || { center: [0, 0], size: [8, 3] };
  const marks: number[][] = _.values(location.marks || {}) as number[][];
  const stageBack = stage.center[1] - stage.size[1] / 2;
  const entries = _.map(location.nodes, (node: any, index: number) => ({ node, index, box: motionNodeBox(node, defs) }));
  const upright = (box: Box) => {
    const [w, h, d] = size(box);
    return d <= SET.THIN && h >= d * SET.UPRIGHT_RATIO && w > 0;
  };
  const backdrop = (e: (typeof entries)[number]) => {
    if (!e.box || isSky(e.node, e.box)) return false;
    const [w, h, d] = size(e.box);
    return d <= SET.BACKDROP_MAX_DEPTH && w >= SET.BACKDROP_MIN_WIDTH && h >= SET.BACKDROP_MIN_HEIGHT && e.box.min[1] <= SET.FLOOR_Y && e.box.max[2] <= stageBack && SET.GROUND_PLANE_RE.test(nodeName(e.node));
  };
  const grounds = _.filter(entries, backdrop);
  const buildings = _.filter(entries, (e) => !!e.box && !isSky(e.node, e.box) && !_.includes(grounds, e) && size(e.box)[1] >= SET.BUILDING_MIN_HEIGHT && e.box.max[2] <= stageBack && e.box.min[1] >= SET.FLOOR_Y - SET.FLOAT_TOLERANCE);
  const stageFront = stage.center[1] + stage.size[1] / 2;
  const backLimit = _.max(_.map(buildings, (e) => e.box!.max[2])) ?? stageBack - 1;
  const groundObjects = _.filter(entries, (e) => !!e.box && !_.includes(grounds, e) && SET.GROUND_OBJECT_RE.test(nodeName(e.node)) && upright(e.box) && e.box.min[1] <= SET.FLOOR_Y + SET.GROUND_NEAR);
  const onTop = (e: (typeof entries)[number], g: (typeof entries)[number]) => e.box!.min[0] >= g.box!.min[0] - SET.DECAL_MARGIN && e.box!.max[0] <= g.box!.max[0] + SET.DECAL_MARGIN && e.box!.min[1] >= g.box!.min[1] - SET.DECAL_MARGIN && e.box!.max[1] <= g.box!.max[1] + SET.DECAL_MARGIN && Math.abs(e.box!.max[2] - g.box!.max[2]) <= SET.DECAL_DEPTH;
  const decalOwner = new Map<number, number>();
  for (const e of entries) {
    if (!e.box || _.includes(grounds, e) || _.includes(groundObjects, e) || !upright(e.box) || size(e.box)[2] > SET.DECAL_DEPTH) continue;
    const owner = _.find(groundObjects, (g) => onTop(e, g));
    if (owner) decalOwner.set(e.index, owner.index);
  }
  const decals = _.filter(entries, (e) => decalOwner.has(e.index));
  const changes: string[] = [];
  const replaced = new Map<number, any>();
  const removed = new Set<number>();
  const added: any[] = [];
  let groundMat: any;
  for (const g of grounds) {
    const [w] = size(g.box!);
    const back = Math.min(g.box!.min[2], backLimit) - SET.GROUND_BACK;
    const front = stage.center[1] + stage.size[1] / 2 + SET.GROUND_FRONT;
    const depth = Math.min(SET.GROUND_DEPTH_MAX, front - back);
    groundMat = groundMat || g.node.mat;
    replaced.set(g.index, { shape: MR.MOTION_TEXT_BOX, name: g.node.name || MR.MOTION_TEXT_GROUND, pos: [round((g.box!.min[0] + g.box!.max[0]) / 2), SET.GROUND_Y, round(front - depth / 2)], mat: g.node.mat, size: [round(w), SET.GROUND_THICKNESS, round(depth)] });
  }
  if (grounds.length) changes.push(LOG.GROUND);
  let layer = 0;
  for (const g of groundObjects) {
    const group = [g, ..._.filter(decals, (d) => decalOwner.get(d.index) === g.index)];
    const box = unite(_.map(group, (e) => e.box))!;
    const height = size(box)[1];
    let zc = box.max[2];
    if (zc - height < backLimit + SET.BACK_GAP) zc = Math.min(stageFront, backLimit + SET.BACK_GAP + height);
    const children = _.map(group, (e) => {
      const pos: number[] = e.node.pos || [0, 0, 0];
      return { ...e.node, pos: [pos[0], round(pos[1] - box.min[1]), round(pos[2] - box.min[2])] };
    });
    added.push({ shape: MR.MOTION_TEXT_GROUP, name: nodeName(g.node) || MR.MOTION_TEXT_GROUND, pos: [0, round(SET.FLOOR_Y + SET.LAY_GAP + layer * SET.LAY_STEP), round(zc)], rot: [SET.ROT_LAY, 0, 0], children });
    _.forEach(group, (e) => removed.add(e.index));
    layer++;
  }
  if (groundObjects.length) changes.push(LOG.LAID(groundObjects.length + decals.length));
  const horizon = _.max(_.map(grounds, (g) => g.box!.max[1])) || 0;
  const seated = new Set(_.map(_.filter(entries, (e) => horizon > SET.FLOAT_TOLERANCE && !!e.box && !removed.has(e.index) && !replaced.has(e.index) && !isSky(e.node, e.box) && e.box.max[2] <= stageBack && e.box.min[1] >= horizon - SET.HORIZON_TOLERANCE), (e) => e.index));
  if (seated.size) changes.push(LOG.SEATED(seated.size));
  const walls = _.filter(entries, (e) => !!e.box && size(e.box)[1] >= SET.BUILDING_MIN_HEIGHT);
  let dropped = 0,
    moved = 0;
  const nodes = _.compact(
    _.map(entries, (e) => {
      if (removed.has(e.index)) return null;
      if (replaced.has(e.index)) return replaced.get(e.index);
      let node = e.node;
      if (seated.has(e.index)) {
        const pos: number[] = node.pos || [0, 0, 0];
        return { ...node, pos: [pos[0], round(pos[1] - horizon), pos[2]] };
      }
      if (groundMat && node.shape === MR.MOTION_TEXT_BOX && SET.WALK_RE.test(nodeName(node)) && e.box && size(e.box)[1] <= SET.GROUND_THICKNESS * 2) return { ...node, mat: groundMat };
      const box = e.box;
      if (!box || isSky(node, box) || _.includes(buildings, e) || SET.HANG_RE.test(nodeName(node)) || node.shape === MR.MOTION_TEXT_LIGHT) return node;
      const [, h] = size(box);
      const nearWall = _.some(walls, (w) => w !== e && w.box!.max[2] <= box.min[2] + SET.WALL_NEAR && w.box!.max[2] >= box.min[2] - SET.WALL_NEAR && w.box!.max[1] >= box.max[1]);
      const supported = _.some(entries, (f) => f !== e && !!f.box && !removed.has(f.index) && !isSky(f.node, f.box) && f.box.max[1] >= box.min[1] - SET.SUPPORT_GAP && f.box.max[1] <= box.min[1] + SET.SUPPORT_SINK && f.box.min[0] <= box.max[0] && f.box.max[0] >= box.min[0] && f.box.min[2] <= box.max[2] + SET.SUPPORT_DEPTH && f.box.max[2] >= box.min[2] - SET.SUPPORT_DEPTH);
      if (box.min[1] > SET.FLOOR_Y + SET.FLOAT_TOLERANCE && h < SET.FLOAT_MAX_HEIGHT && box.max[2] > backLimit && !nearWall && !supported) {
        const pos: number[] = node.pos || [0, 0, 0];
        node = { ...node, pos: [pos[0], round(pos[1] - (box.min[1] - SET.FLOOR_Y)), pos[2]] };
        dropped++;
      }
      if (h >= SET.TALL && box.max[2] > backLimit) {
        const hit = _.find(marks, (mk) => mk[0] >= box.min[0] - SET.MARK_X && mk[0] <= box.max[0] + SET.MARK_X && mk[1] >= box.min[2] - SET.MARK_Z && mk[1] <= box.max[2] + SET.MARK_Z);
        if (hit) {
          const pos: number[] = node.pos || [0, 0, 0];
          const shift = box.max[2] - (hit[1] - SET.MARK_CLEAR);
          const target = Math.max(backLimit + SET.BACK_GAP + (box.max[2] - box.min[2]), box.max[2] - shift);
          node = target < box.max[2] - SET.BACK_GAP ? { ...node, pos: [pos[0], (node.pos || pos)[1], round(pos[2] - (box.max[2] - target))] } : { ...node, pos: [round(pos[0] + (hit[0] >= (box.min[0] + box.max[0]) / 2 ? -1 : 1) * (Math.min(Math.abs(hit[0] - box.min[0]), Math.abs(box.max[0] - hit[0])) + SET.MARK_CLEAR)), (node.pos || pos)[1], pos[2]] };
          moved++;
        }
      }
      return node;
    }),
  );
  if (dropped) changes.push(LOG.DROPPED(dropped));
  if (moved) changes.push(LOG.MOVED(moved));
  if (!changes.length) return { location, changes };
  return { location: { ...location, nodes: [...nodes, ...added] }, changes };
};
const CS_HEX = CS.HEX;
const luminance = (hex: string): number => {
  const n = parseInt(hex.slice(1), 16);
  return 0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255);
};
const saturation = (hex: string): number => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (_.max(c)! - _.min(c)!) / Math.max(1, _.max(c)!);
};
export const motionCalibrationSet = (style: MotionReferenceStyle | undefined): any => {
  const K = CS;
  const palette = _.uniq(_.filter(style?.palette || [], (hex) => CS_HEX.test(hex)));
  const sorted = _.sortBy(palette.length ? palette : [F.FALLBACK_FACE, F.FALLBACK_BODY, F.FALLBACK_FEATURE], luminance);
  const at = (k: number) => sorted[_.clamp(Math.round(k * (sorted.length - 1)), 0, sorted.length - 1)];
  const sky = _.maxBy(sorted, (hex) => luminance(hex) - saturation(hex) * CS.SKY_SATURATION_WEIGHT) || at(1);
  const rest = _.without(sorted, sky);
  const pickRest = (k: number) => rest[_.clamp(Math.round(k * (rest.length - 1)), 0, Math.max(0, rest.length - 1))] || at(k);
  const colours = [sky, pickRest(1), pickRest(0.5), pickRest(0.3), pickRest(0.1), _.maxBy(rest, saturation) || at(0.6)];
  const flat = (color: string) => ({ color, roughness: 1, metalness: 0, unlit: true });
  const materials = _.zipObject(K.MATS, _.map(colours, flat));
  return {
    name: K.NAME,
    interior: false,
    time: MR.MOTION_TEXT_DAY,
    materials,
    sky: { top: colours[0], horizon: colours[0] },
    ground: { size: [K.GROUND.size[0], K.GROUND.size[2]], mat: materials.ground, none: true },
    nodes: [
      { shape: MR.MOTION_TEXT_BOX, name: K.NAMES.GROUND, pos: [...K.GROUND.pos], mat: K.MATS[2], size: [...K.GROUND.size] },
      { shape: MR.MOTION_TEXT_BOX, name: K.NAMES.SKY, pos: [...K.SKY.pos], mat: K.MATS[0], size: [...K.SKY.size] },
      { shape: MR.MOTION_TEXT_BOX, name: K.NAMES.WALL, pos: [...K.WALL.pos], mat: K.MATS[1], size: [...K.WALL.size] },
      { shape: MR.MOTION_TEXT_EXTRUDE, name: K.NAMES.ROOF, pos: [...K.ROOF.pos], mat: K.MATS[3], points: _.map(K.ROOF.points, (p) => [...p]), depth: K.ROOF.depth },
      ..._.map(K.DOOR.xs, (x) => ({ shape: MR.MOTION_TEXT_BOX, name: K.NAMES.DOOR, pos: [x, K.DOOR.y, K.DOOR.z], mat: K.MATS[4], size: [...K.DOOR.size] })),
      { shape: MR.MOTION_TEXT_CYLINDER, name: K.NAMES.PATCH, pos: [...K.PATCH.pos], scale: [...K.PATCH.scale], mat: K.MATS[5], radius: K.PATCH.radius, height: K.PATCH.height, segments: F.SEGMENTS },
      { ...K.LIGHT },
    ],
    stage: { center: [...K.STAGE.center], size: [...K.STAGE.size] },
    marks: _.mapValues(K.MARKS, (p) => [...p]),
    camera: { pos: [...K.CAMERA.pos], target: [...K.CAMERA.target], fov: K.CAMERA.fov },
  };
};
export const motionCalibrationCast = (style: MotionReferenceStyle | undefined, constraints: MotionStyleConstraints, bodies: string[]): any[] => {
  const metrics = style?.metrics || {};
  const palette = style?.palette || [];
  const pick = (i: number) => bodies[i] || palette[i + 1] || F.FALLBACK_BODY;
  return _.map([0, 1], (i) => motionStyleTemplate(metrics, { body: pick(i), face: constraints.faceFill || F.FALLBACK_FACE, feature: style?.outlineColor || F.FALLBACK_FEATURE }, { arms: !_.includes(constraints.absent, SV.ARMS) }));
};
