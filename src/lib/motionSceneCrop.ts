import { MOTION_SCENE_CROP as K } from "../constants/motionSceneCrop.js";
import type { MotionRemotionNode, MotionRemotionScene, MotionSceneComposition, MotionSceneCrop } from "../types/motionVisual.js";
const DETAIL = "detail";
const ILLUSTRATION = "illustration";
const CHARACTER = "character";
const PROP = "prop";
const words = (text?: string): Set<string> => new Set((text || "").toLowerCase().match(K.WORD) || []);
const focusNode = (scene: MotionRemotionScene): MotionRemotionNode | undefined =>
  scene.view === DETAIL ? scene.nodes.find((node) => node.kind === PROP) : scene.nodes.find((node) => node.kind === CHARACTER && !node.anonymous && node.entityId) || scene.nodes.find((node) => node.kind === CHARACTER && !node.anonymous);
const matchNode = (focus: MotionRemotionNode, source: MotionRemotionScene): MotionRemotionNode | undefined => {
  if (focus.kind === CHARACTER) return source.nodes.find((node) => node.kind === CHARACTER && node.entityId && node.entityId === focus.entityId);
  const target = words(focus.description);
  return source.nodes.find((node) => node.kind === PROP && (node.id === focus.id || [...words(node.description)].filter((word) => target.has(word)).length >= K.SHARED_WORDS));
};
export const motionSceneCropCandidates = (scenes: MotionRemotionScene[]): number => {
  let count = 0;
  scenes.forEach((scene, index) => {
    delete scene.cropFrom;
    if (!scene.view || !K.VIEWS.includes(scene.view) || (scene.format && scene.format !== ILLUSTRATION)) return;
    const focus = focusNode(scene);
    if (!focus) return;
    for (let distance = 1; distance <= K.NEIGHBOURS; distance++) {
      for (const source of [scenes[index - distance], scenes[index + distance]]) {
        if (!source || source.place !== scene.place || !K.SOURCE_VIEWS.includes(source.view || "wide") || source.cropFrom) continue;
        const match = matchNode(focus, source);
        if (!match) continue;
        scene.cropFrom = { sceneId: source.id, nodeId: match.id };
        count++;
        return;
      }
    }
  });
  return count;
};
export const motionSceneCropBox = (composition: MotionSceneComposition, nodeId: string, view: string, aspect: number): MotionSceneCrop | undefined => {
  const box = composition.design?.placements.find((placement) => placement.id === nodeId)?.box;
  if (!box) return undefined;
  let x = box.x, y = box.y, width = box.width, height = box.height;
  if (view === DETAIL) {
    x -= width * K.DETAIL.PAD;
    y -= height * K.DETAIL.PAD;
    width *= 1 + 2 * K.DETAIL.PAD;
    height *= 1 + 2 * K.DETAIL.PAD;
  } else {
    x += width * K.HEAD.DX;
    y += height * K.HEAD.DY;
    width *= K.HEAD.WIDTH;
    height *= K.HEAD.HEIGHT;
  }
  const centerX = x + width / 2, centerY = y + height / 2;
  if (width / height < aspect) width = height * aspect;
  else height = width / aspect;
  const scale = Math.min(1 / width, 1 / height);
  if (scale > K.MAX_SCALE || scale < K.MIN_SCALE) return undefined;
  x = Math.min(Math.max(0, centerX - width / 2), 1 - width);
  y = Math.min(Math.max(0, centerY - height / 2), 1 - height);
  return { x, y, width, height };
};
export const motionSceneCropFrame = (crop: MotionSceneCrop, width: number, height: number, progress: number): { scale: number; x: number; y: number } => {
  const scale = Math.min(1 / crop.width, 1 / crop.height) * (1 + K.PUSH * Math.max(0, Math.min(1, progress)));
  const centerX = (crop.x + crop.width / 2) * width, centerY = (crop.y + crop.height / 2) * height;
  const maxX = ((scale - 1) * width) / 2, maxY = ((scale - 1) * height) / 2;
  return { scale, x: Math.max(-maxX, Math.min(maxX, (width / 2 - centerX) * scale)), y: Math.max(-maxY, Math.min(maxY, (height / 2 - centerY) * scale)) };
};
