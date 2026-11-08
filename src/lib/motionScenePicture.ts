import { MOTION_SCENE_QUALITY as Q } from "../constants/motionSceneQuality.js";
import { MOTION_PROFILE_SCENES } from "../constants/motionProfiles/scenes.js";
import { MOTION_CAST_IDENTITY } from "../constants/motionCastIdentity.js";
import { svgGeometry } from "./motionSvgGeometry.js";
import { motionLayerSvg } from "./motionIdentityReference.js";
import { motionLayerPart, motionLayerParts, motionSceneQualityIssues } from "./motionSceneQuality.js";
import { motionSkinHex } from "./motionCastIdentity.js";
import type { MotionCastMember } from "../types/motionVideo.js";
import type { MotionRemotionNode, MotionRemotionProfile, MotionSceneObject, MotionVisualRect } from "../types/motionVisual.js";
export interface MotionScenePicture {
  issues: string[];
  severe: number;
}
const rgb = (hex: string): [number, number, number] | undefined => {
  const match = Q.PICTURE.HEX.exec(hex.trim());
  if (!match) return undefined;
  const full = match[1].length === 3 ? [...match[1]].map((c) => c + c).join("") : match[1];
  return [0, 2, 4].map((at) => parseInt(full.slice(at, at + 2), 16)) as [number, number, number];
};
const fillOf = (fragment: string | undefined): [number, number, number] | undefined => {
  const value = fragment && Q.PICTURE.FILL.exec(fragment)?.[2];
  return value ? rgb(value) : undefined;
};
const luminance = ([r, g, b]: [number, number, number]): number => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const area = (rect: MotionVisualRect): number => Math.max(0, rect.width) * Math.max(0, rect.height);
const overlap = (a: MotionVisualRect, b: MotionVisualRect): number => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
export const motionSceneMeasure = (svg: string, width: number, height: number): Record<string, MotionVisualRect | null> => {
  const measured: Record<string, MotionVisualRect | null> = {};
  for (const [id, box] of svgGeometry(svg).boxes) measured[id] = Number.isFinite(box.minX) ? { x: box.minX / width, y: box.minY / height, width: (box.maxX - box.minX) / width, height: (box.maxY - box.minY) / height } : null;
  return measured;
};
export const motionScenePictureIssues = (svg: string, scene: { nodes: MotionRemotionNode[]; view?: string; objects?: MotionSceneObject[] }, profile: MotionRemotionProfile, members: MotionCastMember[], width: number, height: number): MotionScenePicture => {
  const spec = MOTION_PROFILE_SCENES[profile];
  const cast = new Set(members.map((member) => member.key));
  const member = (node: MotionRemotionNode) => members.find((item) => item.key === node.entityId);
  const names = (node: MotionRemotionNode) => member(node)?.name || node.id;
  let measured: Record<string, MotionVisualRect | null>;
  try {
    measured = motionSceneMeasure(svg, width, height);
  } catch {
    return { issues: [], severe: 0 };
  }
  const base = motionSceneQualityIssues(svg, scene.nodes, scene.view, measured, spec, cast, names, width / height, { marks: (node) => member(node)?.marks || [], objects: scene.objects, profile });
  const extra: string[] = [];
  const people = scene.nodes.filter((node) => node.kind === Q.PICTURE.CHARACTER && !node.animal && measured[node.id] && node.representation !== Q.DETAIL);
  for (const node of people) {
    const name = names(node);
    const headId = motionLayerPart(svg, node.id, spec.headPart);
    const ownBase = motionLayerParts(svg, node.id, Q.HEAD_BASE)[0];
    const baseId = ownBase || headId;
    const cover = ownBase ? Q.PICTURE.FACE_COVER : Q.PICTURE.FACE_COVER_HEAD;
    const face = baseId ? measured[baseId] : undefined;
    if (face && area(face) > 0)
      for (const mark of motionLayerParts(svg, node.id, Q.MARK_PART)) {
        const box = measured[mark];
        const color = fillOf(motionLayerSvg(svg, mark));
        if (box && color && luminance(color) < Q.PICTURE.FACE_DARK && overlap(box, face) / area(face) > cover && box.y + box.height > face.y + face.height * Q.PICTURE.MOUTH_LINE) extra.push(Q.ISSUE.FACE_COVER(name, mark));
      }
    const wanted = Q.PICTURE.SKIN_PROFILES[profile] && node.entityId && cast.has(node.entityId) ? rgb(motionSkinHex(member(node)?.skin, MOTION_CAST_IDENTITY.SKIN_DEFAULT[profile])) : undefined;
    const drawn = baseId ? fillOf(motionLayerSvg(svg, baseId)) : undefined;
    if (wanted && drawn && Math.hypot(wanted[0] - drawn[0], wanted[1] - drawn[1], wanted[2] - drawn[2]) > Q.PICTURE.SKIN_TOLERANCE) extra.push(Q.ISSUE.SKIN(name));
    if (node.facing === Q.PICTURE.BACK || node.stance === Q.PICTURE.BACK) {
      const fragment = headId ? motionLayerSvg(svg, headId) : undefined;
      if (motionLayerParts(svg, node.id, Q.PICTURE.EYE_PART).length || (fragment && Q.PICTURE.EYE_SHAPE.test(fragment))) extra.push(Q.ISSUE.BACK_FACE(name));
    }
    const box = measured[node.id];
    if (box && Q.SIZE_VIEWS.includes(scene.view || "") && box.y < -Q.PICTURE.HEAD_ROOM) extra.push(Q.ISSUE.HEAD_CROP(name));
  }
  const issues = [...new Set([...base, ...extra])];
  const severe = issues.filter((issue) => Q.PICTURE.SEVERE.some((pattern) => pattern.test(issue))).length;
  return { issues, severe };
};
