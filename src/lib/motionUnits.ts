import { MOTION_UNITS, MOTION_UNIT_BY_ANIMAL, MOTION_UNIT_BY_KIND, MOTION_UNIT_LEAD, type MotionUnit } from "../constants/motionUnits.js";
import { motionObjectKind } from "./motionObjectKinds.js";
import type { MotionRemotionNode, MotionRemotionScene } from "../types/motionVisual.js";
const MOUNTED = "mounted";
const LEAD = "lead";
const CHARACTER = "character";
export const motionUnitPart = (name: string): RegExp => new RegExp(`(?:^|[_-])${name}(?:[_-]|$)`, "i");
export const motionNodeUnit = (node: MotionRemotionNode, scene: Pick<MotionRemotionScene, "nodes" | "objects">): MotionUnit | undefined => {
  if (node.kind !== CHARACTER || node.animal) return undefined;
  if (node.unit && (MOTION_UNITS as readonly string[]).includes(node.unit)) return node.unit;
  const targetId = node.rides || node.uses?.objectId;
  const target = targetId ? scene.nodes.find((item) => item.id === targetId) : undefined;
  if (node.stance === MOUNTED && target?.animal) return MOTION_UNIT_BY_ANIMAL[target.animal];
  if (node.stance === LEAD && target?.animal && MOTION_UNIT_BY_ANIMAL[target.animal]) return MOTION_UNIT_LEAD;
  if (!(node.anonymous || node.crowd)) return undefined;
  const listed = targetId ? (scene.objects || []).find((item) => item.id === targetId) : undefined;
  const kind = listed && motionObjectKind(listed);
  return kind ? MOTION_UNIT_BY_KIND[kind] : undefined;
};
export const motionUnitTargets = (scene: Pick<MotionRemotionScene, "nodes">): Map<string, string> => {
  const targets = new Map<string, string>();
  for (const node of scene.nodes) {
    if (!node.unit) continue;
    const target = node.rides || node.uses?.objectId;
    if (target && target !== node.id) targets.set(target, node.id);
  }
  return targets;
};
