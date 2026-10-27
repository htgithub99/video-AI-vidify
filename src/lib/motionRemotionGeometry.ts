import { MOTION_REMOTION_LAYOUT as L } from "../constants/motionRemotionLayout.js";
import type { MotionRemotionNode, MotionRemotionRole, MotionVectorAsset, MotionVisualRect } from "../types/motionVisual.js";
export const remotionRole = (node: MotionRemotionNode): MotionRemotionRole => {
  if (node.kind !== "prop") return "object";
  if (node.role) return node.role;
  const subject = node.description.split(L.SUBJECT_SEPARATOR)[0] || node.description;
  return node.mount ? "fixture" : L.DECAL.test(subject) ? "decal" : L.PORTRAIT.test(subject) ? "object" : L.FIXTURE.test(subject) ? "fixture" : L.SMALL.test(subject) || L.WIDE.test(subject) ? "object" : L.SUPPORT.test(subject) ? "support" : "object";
};
export const remotionRect = (raw: unknown): MotionVisualRect | undefined => {
  const r = raw as MotionVisualRect;
  return r && [r.x, r.y, r.width, r.height].every(Number.isFinite) && r.x >= 0 && r.y >= 0 && r.width > 0 && r.height > 0 && r.x + r.width <= 1.001 && r.y + r.height <= 1.001 ? { x: r.x, y: r.y, width: r.width, height: r.height } : undefined;
};
export const remotionRegions = (raw: unknown): Record<string, MotionVisualRect> =>
  Object.fromEntries(
    Object.entries(raw && typeof raw === "object" ? raw : {}).flatMap(([key, value]) => {
      const r = remotionRect(value);
      return r && /^[a-z][a-z0-9_-]{0,48}$/i.test(key) ? [[key, r]] : [];
    }),
  );
export const remotionMount = (node: MotionRemotionNode): string => node.mount || (L.PILLAR.test(node.description) ? "pillar" : L.THRESHOLD.test(node.description) ? "floor" : L.WINDOW.test(node.description) ? "wall" : "doorway");
export const remotionContact = (node: MotionRemotionNode) => node.contact || (node.kind === "character" && L.SEATED.test(node.pose) ? "seat" : node.kind === "character" && L.LYING.test(node.pose) ? "body" : "base");
export const remotionPoint = (asset: MotionVectorAsset | undefined, name: string): { x: number; y: number } => {
  if (asset?.anchors?.[name]) return asset.anchors[name];
  const b = asset?.bounds || { x: 0, y: 0, width: 1, height: 1 };
  return { x: b.x + b.width * 0.5, y: b.y + b.height * (name === "seat" ? 0.59 : name === "body" ? 0.55 : name === "grip" ? 0.57 : name === "surface" ? 0.22 : 0.98) };
};
export const remotionObjectIdentity = (node: MotionRemotionNode) => node.objectId || (node.kind === "character" ? node.entityId || node.id : node.id);
