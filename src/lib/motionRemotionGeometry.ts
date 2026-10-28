import { MOTION_REMOTION_LAYOUT as L } from "../constants/motionRemotionLayout.js";
import { MOTION_REMOTION_STAGING as S } from "../constants/motionRemotionStaging.js";
import type { MotionRemotionNode, MotionRemotionPlacedNode, MotionRemotionRole, MotionVectorAsset, MotionVisualRect } from "../types/motionVisual.js";
export const remotionSubject = (node: MotionRemotionNode): string => node.description.split(S.SUBJECT_LOCATION)[0].trim() || node.description;
export const remotionRole = (node: MotionRemotionNode): MotionRemotionRole => {
  if (node.kind !== "prop") return "object";
  const subject = remotionSubject(node);
  if (S.SUPPORT.test(subject)) return "support";
  if (S.SMALL.test(subject)) return "object";
  if (S.MARK.test(subject)) return "decal";
  if (S.ARCHITECTURE.test(subject)) return "fixture";
  if (node.role) return node.role;
  return L.DECAL.test(subject) ? "decal" : L.PORTRAIT.test(subject) ? "object" : L.FIXTURE.test(subject) ? "fixture" : L.SMALL.test(subject) || L.WIDE.test(subject) ? "object" : L.SUPPORT.test(subject) || S.MAT.test(subject) ? "support" : node.mount ? "fixture" : "object";
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
  const bottom = height * (remotionRole(node) === "fixture" ? 1 : L.SUBJECT_BOTTOM);
  return r.x >= -L.FRAME_TOLERANCE && r.y >= -L.FRAME_TOLERANCE && r.x + r.width <= width + L.FRAME_TOLERANCE && r.y + r.height <= bottom + L.FRAME_TOLERANCE;
};
export const remotionRegions = (raw: unknown): Record<string, MotionVisualRect> =>
  Object.fromEntries(
    Object.entries(raw && typeof raw === "object" ? raw : {}).flatMap(([key, value]) => {
      const r = remotionRect(value);
      return r && /^[a-z][a-z0-9_-]{0,48}$/i.test(key) ? [[key, r]] : [];
    }),
  );
export const remotionMount = (node: MotionRemotionNode): string => node.mount || (L.PILLAR.test(node.description) ? "pillar" : L.THRESHOLD.test(node.description) ? "floor" : L.WINDOW.test(node.description) ? "wall" : "doorway");
export const remotionMountSocket = (node: MotionRemotionNode): string => {
  if (node.layoutSocket) return node.layoutSocket;
  const subject = remotionSubject(node);
  return L.THRESHOLD.test(subject) || /ngưỡng cửa|bậc cửa/iu.test(subject) ? "threshold" : S.GATE.test(subject) ? "gate" : S.WINDOW.test(subject) ? "window" : S.DOOR.test(subject) ? "doorway" : remotionMount(node);
};
export const remotionMountRegion = (node: MotionRemotionNode, background?: MotionVectorAsset): MotionVisualRect => {
  const mount = remotionMount(node),
    subject = remotionSubject(node);
  const socket = remotionMountSocket(node);
  const outdoors = background?.regions?.outdoors;
  if (socket === "gate" && S.DISTANT.test(node.description) && outdoors && outdoors.width < 0.8) {
    const width = outdoors.width * 0.52,
      height = outdoors.height * 0.48;
    return { x: outdoors.x + (outdoors.width - width) / 2, y: outdoors.y + outdoors.height * 0.54 - height, width, height };
  }
  const dedicated = background?.regions?.[socket];
  if (dedicated && (socket !== "doorway" || dedicated.width <= 0.4)) return dedicated;
  if (S.ARCHITECTURE.test(subject) && socket !== "floor" && socket !== "pillar") {
    const width = socket === "window" ? 0.19 : socket === "gate" ? 0.34 : 0.24;
    const height = socket === "window" ? 0.3 : 0.62;
    const center = node.layoutX ?? (node.slot === "left" ? 0.24 : node.slot === "right" ? 0.76 : 0.5);
    const floor = background?.regions?.floor;
    const ground = Math.min(floor ? floor.y + floor.height * 0.65 : 0.82, L.GROUND_BOTTOM);
    return { x: Math.max(0, Math.min(1 - width, center - width / 2)), y: socket === "window" ? 0.18 : Math.max(0.04, ground - height), width, height };
  }
  return background?.regions?.[mount] || (mount === "floor" ? { x: 0.05, y: 0.72, width: 0.9, height: 0.18 } : mount === "pillar" ? { x: 0.1, y: 0.08, width: 0.08, height: 0.74 } : mount === "wall" ? { x: 0.65, y: 0.18, width: 0.2, height: 0.35 } : mount === "ceiling" ? { x: 0.3, y: 0.04, width: 0.4, height: 0.1 } : { x: 0.34, y: 0.12, width: 0.28, height: 0.7 });
};
export const remotionContact = (node: MotionRemotionNode) => node.contact || (node.kind === "character" && L.SEATED.test(node.pose) ? "seat" : node.kind === "character" && L.LYING.test(node.pose) ? "body" : "base");
export const remotionPoint = (asset: MotionVectorAsset | undefined, name: string): { x: number; y: number } => {
  if (name === "base" && asset?.spaceRevision && asset.bounds) return { x: asset.bounds.x + asset.bounds.width * 0.5, y: asset.bounds.y + asset.bounds.height };
  if (asset?.anchors?.[name]) return asset.anchors[name];
  const b = asset?.bounds || { x: 0, y: 0, width: 1, height: 1 };
  return { x: b.x + b.width * 0.5, y: b.y + b.height * (name === "seat" ? 0.59 : name === "body" ? 0.55 : name === "grip" ? 0.57 : name === "surface" ? 0.22 : 0.98) };
};
export const remotionObjectIdentity = (node: MotionRemotionNode) => node.objectId || (node.kind === "character" ? node.entityId || node.id : node.id);
