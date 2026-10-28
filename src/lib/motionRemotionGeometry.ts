import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { MOTION_REMOTION_LAYOUT as L } from "../constants/motionRemotionLayout.js";
import { MOTION_REMOTION_STAGING as S } from "../constants/motionRemotionStaging.js";
import type { MotionRemotionNode, MotionRemotionPlacedNode, MotionRemotionRole, MotionVectorAsset, MotionVisualRect } from "../types/motionVisual.js";
export const remotionSubject = (node: MotionRemotionNode): string => node.description.split(S.SUBJECT_LOCATION)[0].trim() || node.description;
export const remotionRole = (node: MotionRemotionNode): MotionRemotionRole => {
  if (node.kind !== RT_SHARED.PROP) return RT_SHARED.OBJECT;
  const subject = remotionSubject(node);
  if (S.SUPPORT.test(subject)) return RT_CORE.SUPPORT_A18603;
  if (S.SMALL.test(subject)) return RT_SHARED.OBJECT;
  if (S.MARK.test(subject)) return RT_SHARED.DECAL;
  if (S.ARCHITECTURE.test(subject)) return RT_SHARED.FIXTURE;
  if (node.role) return node.role;
  return L.DECAL.test(subject) ? RT_SHARED.DECAL : L.PORTRAIT.test(subject) ? RT_SHARED.OBJECT : L.FIXTURE.test(subject) ? RT_SHARED.FIXTURE : L.SMALL.test(subject) || L.WIDE.test(subject) ? RT_SHARED.OBJECT : L.SUPPORT.test(subject) || S.MAT.test(subject) ? RT_CORE.SUPPORT_A18603 : node.mount ? RT_SHARED.FIXTURE : RT_SHARED.OBJECT;
};
export const remotionRect = (raw: unknown): MotionVisualRect | undefined => {
  const r = raw as MotionVisualRect;
  return r && [r.x, r.y, r.width, r.height].every(Number.isFinite) && r.x >= 0 && r.y >= 0 && r.width > 0 && r.height > 0 && r.x + r.width <= 1.001 && r.y + r.height <= 1.001 ? { x: r.x, y: r.y, width: r.width, height: r.height } : undefined;
};
export const remotionVisibleRect = (node: Pick<MotionRemotionPlacedNode, "x" | "y" | "width" | "height">, asset?: MotionVectorAsset): MotionVisualRect => {
  const bounds = asset?.bounds || { x: 0, y: 0, width: 1, height: 1 };
  return { x: node.x + node.width * bounds.x, y: node.y + node.height * bounds.y, width: node.width * bounds.width, height: node.height * bounds.height };
};
export const remotionNodeFitsFrame = (node: MotionRemotionPlacedNode, asset: MotionVectorAsset | undefined, width: number, height: number): boolean => {
  if (![node.x, node.y, node.width, node.height].every(Number.isFinite) || node.width <= 0 || node.height <= 0 || (asset?.bounds && !remotionRect(asset.bounds))) return false;
  const r = remotionVisibleRect(node, asset);
  const bottom = height * (remotionRole(node) === RT_SHARED.FIXTURE ? 1 : L.SUBJECT_BOTTOM);
  return r.x >= -L.FRAME_TOLERANCE && r.y >= -L.FRAME_TOLERANCE && r.x + r.width <= width + L.FRAME_TOLERANCE && r.y + r.height <= bottom + L.FRAME_TOLERANCE;
};
export const remotionRegions = (raw: unknown): Record<string, MotionVisualRect> =>
  Object.fromEntries(
    Object.entries(raw && typeof raw === "object" ? raw : {}).flatMap(([key, value]) => {
      const r = remotionRect(value);
      return r && /^[a-z][a-z0-9_-]{0,48}$/i.test(key) ? [[key, r]] : [];
    }),
  );
export const remotionMount = (node: MotionRemotionNode): string => node.mount || (L.PILLAR.test(node.description) ? RT_CORE.PILLAR : L.THRESHOLD.test(node.description) ? RT_SHARED.FLOOR : L.WINDOW.test(node.description) ? RT_CORE.WALL : RT_CORE.DOORWAY);
export const remotionMountSocket = (node: MotionRemotionNode): string => {
  if (node.layoutSocket) return node.layoutSocket;
  const subject = remotionSubject(node);
  return L.THRESHOLD.test(subject) || /ngưỡng cửa|bậc cửa/iu.test(subject) ? RT_CORE.THRESHOLD : S.GATE.test(subject) ? RT_CORE.GATE : S.WINDOW.test(subject) ? RT_CORE.WINDOW : S.DOOR.test(subject) ? RT_CORE.DOORWAY : remotionMount(node);
};
export const remotionMountRegion = (node: MotionRemotionNode, background?: MotionVectorAsset): MotionVisualRect => {
  const mount = remotionMount(node),
    subject = remotionSubject(node);
  const socket = remotionMountSocket(node);
  const outdoors = background?.regions?.outdoors;
  if (socket === RT_CORE.GATE && S.DISTANT.test(node.description) && outdoors && outdoors.width < 0.8) {
    const width = outdoors.width * 0.52,
      height = outdoors.height * 0.48;
    return { x: outdoors.x + (outdoors.width - width) / 2, y: outdoors.y + outdoors.height * 0.54 - height, width, height };
  }
  const dedicated = background?.regions?.[socket];
  if (dedicated && (socket !== RT_CORE.DOORWAY || dedicated.width <= 0.4)) return dedicated;
  if (S.ARCHITECTURE.test(subject) && socket !== RT_SHARED.FLOOR && socket !== RT_CORE.PILLAR) {
    const width = socket === RT_CORE.WINDOW ? 0.19 : socket === RT_CORE.GATE ? 0.34 : 0.24;
    const height = socket === RT_CORE.WINDOW ? 0.3 : 0.62;
    const center = node.layoutX ?? (node.slot === RT_SHARED.LEFT ? 0.24 : node.slot === RT_SHARED.RIGHT ? 0.76 : 0.5);
    const floor = background?.regions?.floor;
    const ground = Math.min(floor ? floor.y + floor.height * 0.65 : 0.82, L.GROUND_BOTTOM);
    return { x: Math.max(0, Math.min(1 - width, center - width / 2)), y: socket === RT_CORE.WINDOW ? 0.18 : Math.max(0.04, ground - height), width, height };
  }
  return background?.regions?.[mount] || (mount === RT_SHARED.FLOOR ? { x: 0.05, y: 0.72, width: 0.9, height: 0.18 } : mount === RT_CORE.PILLAR ? { x: 0.1, y: 0.08, width: 0.08, height: 0.74 } : mount === RT_CORE.WALL ? { x: 0.65, y: 0.18, width: 0.2, height: 0.35 } : mount === RT_CORE.CEILING ? { x: 0.3, y: 0.04, width: 0.4, height: 0.1 } : { x: 0.34, y: 0.12, width: 0.28, height: 0.7 });
};
export const remotionContact = (node: MotionRemotionNode) => node.contact || (node.kind === RT_SHARED.CHARACTER && L.SEATED.test(node.pose) ? RT_CORE.SEAT : node.kind === RT_SHARED.CHARACTER && L.LYING.test(node.pose) ? RT_SHARED.BODY : RT_SHARED.BASE);
export const remotionPoint = (asset: MotionVectorAsset | undefined, name: string): { x: number; y: number } => {
  if (name === RT_SHARED.BASE && asset?.spaceRevision && asset.bounds) return { x: asset.bounds.x + asset.bounds.width * 0.5, y: asset.bounds.y + asset.bounds.height };
  if (asset?.anchors?.[name]) return asset.anchors[name];
  const b = asset?.bounds || { x: 0, y: 0, width: 1, height: 1 };
  return { x: b.x + b.width * 0.5, y: b.y + b.height * (name === RT_CORE.SEAT ? 0.59 : name === RT_SHARED.BODY ? 0.55 : name === RT_CORE.GRIP ? 0.57 : name === RT_CORE.SURFACE ? 0.22 : 0.98) };
};
export const remotionObjectIdentity = (node: MotionRemotionNode) => node.objectId || (node.kind === RT_SHARED.CHARACTER ? node.entityId || node.id : node.id);
