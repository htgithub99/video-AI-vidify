import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { remotionNodeFitsFrame, remotionVisibleRect } from "./motionRemotionGeometry.js";
import { MOTION_REMOTION_STAGING as S } from "../constants/motionRemotionStaging.js";
import type { MotionRemotionPlacedNode, MotionRemotionTimedScene, MotionVectorAsset, MotionVisualRect } from "../types/motionVisual.js";
export const remotionDetailNodes = (scene: MotionRemotionTimedScene): MotionRemotionPlacedNode[] => {
  if (scene.view !== RT_SHARED.DETAIL || !scene.focus?.some((id) => scene.nodes.some((node) => node.id === id))) return scene.nodes;
  const visible = new Set(scene.focus);
  const selected = new Set(scene.focus);
  for (let pass = 0; pass < scene.nodes.length; pass++) {
    const size = visible.size;
    for (const node of scene.nodes) {
      if (visible.has(node.id) && node.target && (selected.has(node.id) || ([RT_SHARED.ON, RT_SHARED.INSIDE, RT_SHARED.HELDBY] as string[]).includes(node.relation || ""))) visible.add(node.target);
      if (node.target && visible.has(node.target) && ([RT_SHARED.ON, RT_SHARED.INSIDE, RT_SHARED.HELDBY] as string[]).includes(node.relation || "") && node.kind !== RT_SHARED.CHARACTER) visible.add(node.id);
    }
    if (visible.size === size) break;
  }
  return scene.nodes.filter((node) => visible.has(node.id) || node.role === RT_SHARED.FIXTURE);
};
const overlap = (a: MotionVisualRect, b: MotionVisualRect) => (Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))) / Math.max(1, Math.min(a.width * a.height, b.width * b.height));
export const separateRemotionSubjects = (nodes: MotionRemotionPlacedNode[], assets: Record<string, MotionVectorAsset>, width: number, height: number, preserveStaging = false) => {
  const rect = (node: MotionRemotionPlacedNode) => remotionVisibleRect(node, assets[node.assetKey || ""]);
  for (const node of nodes.filter((n) => n.kind === RT_SHARED.CHARACTER && n.relation !== RT_SHARED.ON && n.relation !== RT_SHARED.INSIDE)) {
    if (preserveStaging && node.layoutDepth !== undefined) continue;
    const cluster = new Set([node.id]);
    for (let i = 0; i < nodes.length; i++) for (const child of nodes) if (child.target && cluster.has(child.target)) cluster.add(child.id);
    const moving = nodes.filter((n) => cluster.has(n.id));
    const obstacles = nodes.filter((n) => !cluster.has(n.id) && (n.kind === RT_SHARED.CHARACTER || (n.kind === RT_SHARED.PROP && n.essential && n.role === RT_SHARED.OBJECT && !S.CROWD.test(n.description))));
    const core = (n: MotionRemotionPlacedNode) => {
      const r = rect(n);
      return n.kind === RT_SHARED.CHARACTER ? { ...r, height: r.height * 0.4 } : r;
    };
    const original = core(node);
    const score = (dx: number) =>
      obstacles.reduce((sum, obstacle) => {
        const subject = obstacle.kind === RT_SHARED.CHARACTER ? original : rect(node);
        return sum + overlap({ ...subject, x: subject.x + dx }, core(obstacle));
      }, 0);
    let best = 0,
      cost = score(0);
    if (cost < 0.15) continue;
    const candidates = obstacles
      .flatMap((n) => {
        const r = core(n);
        return [r.x - original.width - width * 0.025 - original.x, r.x + r.width + width * 0.025 - original.x];
      })
      .sort((a, b) => Math.abs(a) - Math.abs(b));
    for (const dx of candidates) {
      if (!moving.every((n) => remotionNodeFitsFrame({ ...n, x: n.x + dx }, assets[n.assetKey || ""], width, height))) continue;
      const next = score(dx);
      if (next >= cost - 0.001) continue;
      best = dx;
      cost = next;
      if (cost < 0.01) break;
    }
    for (const item of moving) item.x += best;
  }
  return nodes;
};
