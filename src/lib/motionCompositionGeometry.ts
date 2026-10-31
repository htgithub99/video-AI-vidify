import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { MOTION_SCENE_COMPOSITION as C } from "../constants/motionSceneComposition.js";
import type { MotionRemotionNode, MotionSceneComposition, MotionVisualRect } from "../types/motionVisual.js";
export const motionCompositionGeometryErrors = (composition: MotionSceneComposition, measured: Record<string, MotionVisualRect | null>): string[] => {
  const errors: string[] = [];
  for (const placement of composition.design?.placements || []) {
    if (!composition.layers.some((layer) => layer.id === placement.id && (layer.kind === RT_SHARED.CHARACTER || layer.kind === RT_SHARED.PROP))) continue;
    const box = measured[placement.id];
    const planned = placement.box;
    if (box === undefined) continue;
    if (!box || ![box.x, box.y, box.width, box.height].every(Number.isFinite) || box.width < 0 || box.height < 0 || (box.width === 0 && box.height === 0)) {
      errors.push(C.GEOMETRY_ERROR(placement.id));
      continue;
    }
    const area = box.width * box.height,
      expected = planned.width * planned.height;
    const intersection = Math.max(0, Math.min(1, box.x + box.width) - Math.max(0, box.x)) * Math.max(0, Math.min(1, box.y + box.height) - Math.max(0, box.y));
    const distance = Math.hypot(box.x + box.width / 2 - planned.x - planned.width / 2, box.y + box.height / 2 - planned.y - planned.height / 2);
    if ((area >= C.GEOMETRY.COVERAGE && expected < C.GEOMETRY.EXPECTED_COVERAGE) || (area > expected * C.GEOMETRY.OVERSIZE && distance > C.GEOMETRY.CENTER_DISTANCE) || intersection < area * (1 - C.GEOMETRY.OUTSIDE_SHARE)) errors.push(C.GEOMETRY_ERROR(placement.id));
  }
  return errors;
};
export const motionCompositionPostureNotes = (composition: MotionSceneComposition, nodes: MotionRemotionNode[], measured: Record<string, MotionVisualRect | null>, aspect: number): string[] => {
  const X = C.POSTURE_CHECK;
  return nodes.flatMap((node) => {
    if (node.kind !== RT_SHARED.CHARACTER) return [];
    const said = [node.posture, node.pose].filter(Boolean).join(X.JOIN);
    const box = measured[node.id];
    const notes: string[] = [];
    if (box && box.height > 0 && X.LYING.test(said) && (box.width * aspect) / box.height < X.LYING_MIN_RATIO) notes.push(X.LYING_NOTE(node.id));
    const placement = composition.design?.placements.find((item) => item.id === node.id);
    if (placement?.supportId === X.WATER && !X.WATER_OK.test([said, node.support, node.description].filter(Boolean).join(X.JOIN))) notes.push(X.WATER_NOTE(node.id));
    return notes;
  });
};
