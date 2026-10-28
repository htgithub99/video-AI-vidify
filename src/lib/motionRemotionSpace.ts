import { MOTION_REMOTION_SPACE as C } from "../constants/motionRemotionSpace.js";
import { MOTION_REMOTION_STAGING as S } from "../constants/motionRemotionStaging.js";
import { remotionObjectIdentity, remotionRole, remotionSubject, remotionMountSocket } from "./motionRemotionGeometry.js";
import type { MotionRemotionNode, MotionRemotionScene, MotionVisualRect } from "../types/motionVisual.js";
export const normalizeRemotionSpacePose = (nodes: MotionRemotionNode[]): void => {
  for (const node of nodes) {
    if (node.kind === "character" && C.COMPLEX_VIEW.test(node.pose)) {
      node.pose = C.SIMPLE_VIEW;
      delete node.assetKey;
    }
    if (node.kind !== "character" || !C.SEATED.test(node.pose) || C.GROUND_SEAT.test(node.pose) || (node.relation === "on" && nodes.some((target) => target.id === node.target && remotionRole(target) === "support"))) continue;
    node.pose = C.BACK.test(node.pose) ? "standing with back turned, arms relaxed" : C.FEAR.test(node.pose) ? "standing, frightened face, arms relaxed" : "standing three-quarter view, arms relaxed, neutral closed mouth";
    delete node.assetKey;
  }
};
export const remotionSpaceGuide = (scenes: MotionRemotionScene[], aspect = "16:9") => {
  const [widthRatio, heightRatio] = aspect.split(":").map(Number);
  const ratio = Number.isFinite(widthRatio / heightRatio) && heightRatio > 0 ? widthRatio / heightRatio : 16 / 9;
  const regions: Record<string, MotionVisualRect> = { floor: { x: 0, y: C.HORIZON, width: 1, height: 1 - C.HORIZON }, wall: { x: 0, y: 0, width: 1, height: C.HORIZON } };
  for (const node of scenes.flatMap((scene) => scene.nodes).filter((node) => remotionRole(node) === "fixture" && S.ARCHITECTURE.test(remotionSubject(node)))) {
    const socket = remotionMountSocket(node);
    if (regions[socket]) continue;
    const baseSocket = remotionMountSocket({ ...node, layoutSocket: undefined });
    if (baseSocket === "floor" || baseSocket === "pillar") continue;
    const window = baseSocket === "window", threshold = baseSocket === "threshold";
    const height = threshold ? 0.025 : window ? 0.23 : 0.4;
    const width = threshold ? 0.3 : Math.min(0.36, (height * (window ? 1.2 : baseSocket === "gate" ? 1.1 : 0.58)) / ratio);
    const center = node.layoutX ?? (node.slot === "left" ? 0.2 : node.slot === "right" ? 0.8 : 0.5);
    regions[socket] = { x: Math.max(0.03, Math.min(0.97 - width, center - width / 2)), y: threshold ? C.FRONT_GROUND - height : window ? 0.1 : C.BACK_GROUND - height, width, height };
  }
  return { revision: C.REVISION, horizon: C.HORIZON, vanishingPoint: { x: 0.5, y: C.HORIZON }, regions };
};
export const remotionLocationComposition = (scenes: MotionRemotionScene[]) => {
  const subjects = new Map<string, { id: string; kind: string; description: string; x: number; ground: number; height?: number; relation?: string; target?: string }>();
  for (const scene of scenes) for (const node of scene.nodes) {
    const id = remotionObjectIdentity(node);
    if (node.kind === "label" || subjects.has(id)) continue;
    subjects.set(id, { id, kind: node.kind, description: remotionSubject(node), x: node.layoutX ?? (node.slot === "left" ? 0.24 : node.slot === "right" ? 0.76 : 0.5), ground: node.layoutY ?? C.FRONT_GROUND, height: node.layoutHeight, relation: node.relation, target: node.target });
  }
  return { policy: C.COMPOSITION_GUIDE, subjects: [...subjects.values()] };
};
export const assignRemotionSpace = (scenes: MotionRemotionScene[]): void => {
  const people = new Map<string, { x: number; y: number }>();
  const sockets = new Map<string, Set<string>>();
  for (const scene of scenes) for (const node of scene.nodes.filter((item) => remotionRole(item) === "fixture")) {
    const socket = remotionMountSocket({ ...node, layoutSocket: undefined });
    const key = `${scene.locationKey || scene.place}:${socket}`;
    const ids = sockets.get(key) || new Set<string>();
    ids.add(remotionObjectIdentity(node));
    sockets.set(key, ids);
  }
  for (const scene of scenes) {
    for (const node of scene.nodes) {
      if (remotionRole(node) === "fixture") {
        const socket = remotionMountSocket({ ...node, layoutSocket: undefined });
        const ids = [...sockets.get(`${scene.locationKey || scene.place}:${socket}`)!].sort();
        node.layoutSocket = ids.length > 1 ? `${socket}_${ids.indexOf(remotionObjectIdentity(node)) + 1}` : undefined;
      }
      const subject = remotionSubject(node);
      const altar = node.kind === "prop" && C.ALTAR.test(subject);
      const coffin = node.kind === "prop" && C.COFFIN.test(subject);
      const bed = node.kind === "prop" && C.BED.test(subject);
      const seat = node.kind === "prop" && C.SEAT.test(subject);
      node.layoutY = altar ? C.BACK_GROUND : coffin || bed ? 0.87 : remotionRole(node) === "support" && !seat ? 0.78 : C.FRONT_GROUND;
      node.layoutHeight = node.kind === "character" ? C.CHARACTER_HEIGHT[node.age || "adult"] * (C.SEATED.test(node.pose) ? C.SEATED_HEIGHT : 1) : altar ? 0.2 : coffin ? 0.43 : bed ? 0.32 : seat ? 0.16 : undefined;
      node.layoutDepth = Math.round(node.layoutY * 100);
    }
    for (const node of scene.nodes.filter((item) => item.kind === "character")) {
      const key = `${scene.locationKey || scene.place}:${remotionObjectIdentity(node)}`;
      const prior = people.get(key);
      const moved = !!node.stateEvidence || C.MOVE.test(node.evidence || "");
      const target = scene.nodes.find((item) => item.id === node.target);
      let x = prior && !moved ? prior.x : node.slot === "left" ? 0.3 : node.slot === "right" ? 0.73 : 0.53;
      if ((!prior || moved) && target && (node.relation === "beside" || node.relation === "behind")) {
        const center = target.layoutX ?? (target.slot === "left" ? 0.24 : target.slot === "right" ? 0.76 : 0.5);
        const gap = target.kind === "character" ? 0.18 : C.COFFIN.test(remotionSubject(target)) ? 0.21 : 0.19;
        const candidates = node.slot === "left" ? [center - gap, center + gap] : [center + gap, center - gap];
        x = candidates.find((value) => value >= 0.13 && value <= 0.87) ?? x;
      }
      const occupied = scene.nodes.filter((item) => item.kind === "character" && item !== node && people.has(`${scene.locationKey || scene.place}:${remotionObjectIdentity(item)}`)).map((item) => people.get(`${scene.locationKey || scene.place}:${remotionObjectIdentity(item)}`)!.x);
      if (!prior && occupied.some((value) => Math.abs(value - x) < 0.16)) x = [x - 0.18, x + 0.18, 0.3, 0.7].find((value) => value >= 0.13 && value <= 0.87 && occupied.every((other) => Math.abs(other - value) >= 0.16)) ?? x;
      node.layoutX = x;
      people.set(key, { x, y: node.layoutY! });
    }
    for (const mat of scene.nodes.filter((node) => node.kind === "prop" && S.MAT.test(remotionSubject(node)))) {
      const seated = scene.nodes.filter((node) => node.kind === "character" && node.relation === "on" && node.target === mat.id && node.layoutX !== undefined);
      if (seated.length) mat.layoutX = seated.reduce((sum, node) => sum + node.layoutX!, 0) / seated.length;
    }
  }
};
