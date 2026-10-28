import { MOTION_REMOTION_SPACE as C } from "../constants/motionRemotionSpace.js";
import { MOTION_REMOTION_LAYOUT as L } from "../constants/motionRemotionLayout.js";
import { MOTION_REMOTION_STAGING as S } from "../constants/motionRemotionStaging.js";
import { normalizeMotionVector } from "./motionVectorAsset.js";
import { remotionSubject } from "./motionRemotionGeometry.js";
import type { MotionRemotionNode, MotionVectorAsset } from "../types/motionVisual.js";
export const remotionClosedCoffin = (node: MotionRemotionNode) => node.kind === "prop" && C.COFFIN.test(remotionSubject(node)) && !C.CUSTOM_COFFIN.test(remotionSubject(node)) && !C.OPEN_COFFIN.test([node.description, node.pose, node.state].join(" "));
export const remotionClosedCoffinAsset = (key: string, description: string): MotionVectorAsset => {
  const colors = C.COFFIN_COLORS;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 390"><g stroke="${colors.ink}" stroke-width="4" stroke-linejoin="round"><path d="M130 288V345H161V296M605 153V211H631V144" fill="${colors.side}"/><path d="M70 205L140 290L240 320L700 135V182L240 367L140 337L70 252Z" fill="${colors.side}"/><path d="M70 205L520 65L625 78L700 135L240 320L140 290Z" fill="${colors.wood}"/><path d="M91 210L524 80L619 92L671 132L238 301L150 275Z" fill="${colors.lid}"/><path d="M140 290V337M240 320V367M90 229L143 308L240 339L682 164" fill="none" opacity=".55"/><path d="M212 218L558 111M222 233L570 123" fill="none" opacity=".22"/></g></svg>`;
  return { ...normalizeMotionVector(svg, key, key, description), anchors: { base: { x: 0.48, y: 367 / 390 }, surface: { x: 0.48, y: 0.45 } }, bounds: { x: 68 / 800, y: 63 / 390, width: 634 / 800, height: 306 / 390 }, layerRevision: L.REVISION, stagingRevision: S.REVISION, spaceRevision: C.REVISION, projectionRevision: C.COFFIN_REVISION };
};
export const remotionThresholdAsset = (key: string, description: string): MotionVectorAsset => ({ ...normalizeMotionVector('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 100"><g stroke="#292e35" stroke-width="4" stroke-linejoin="round"><path d="M40 18H758L788 66H12Z" fill="#62665f"/><path d="M12 66H788V84H12Z" fill="#424840"/><path d="M53 33H746" fill="none" stroke="#7b7d71" stroke-width="3"/></g></svg>', key, key, description), anchors: { base: { x: 0.5, y: 0.86 } }, bounds: { x: 0.0125, y: 0.16, width: 0.975, height: 0.7 }, layerRevision: L.REVISION, stagingRevision: S.REVISION, spaceRevision: C.REVISION });
export const remotionSimpleInterior = (description: string) => C.SIMPLE_INTERIOR.test(description) && C.SIMPLE_WALL.test(description) && !C.SPECIAL_INTERIOR.test(description);
export const remotionInteriorAsset = (key: string, description: string, space: NonNullable<MotionVectorAsset["space"]>): MotionVectorAsset => {
  const c = C.ROOM_COLORS, width = 1920, height = 1080, horizon = space.horizon * height;
  const rays = Array.from({ length: 13 }, (_, index) => `<path d="M${width * space.vanishingPoint.x} ${horizon}L${(index - 3) * width / 6} ${height}"/>`).join("");
  const rows = [0.025, 0.065, 0.13, 0.24, 0.42, 0.67].map((t) => `<path d="M0 ${horizon + (height - horizon) * t}H${width}"/>`).join("");
  const openings = Object.entries(space.regions).filter(([name]) => /^(?:doorway|window|gate)(?:_\d+)?$/.test(name));
  const apertures = openings.map(([, r]) => `<rect x="${r.x * width}" y="${r.y * height}" width="${r.width * width}" height="${r.height * height}" fill="${c.opening}"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${c.wall}"/><path d="M0 ${horizon}H${width}V${height}H0Z" fill="${c.floor}"/><g stroke="${c.line}" stroke-width="2" fill="none" opacity=".48">${rays}${rows}</g><path d="M0 ${horizon - 14}H${width}V${horizon + 6}H0Z" fill="${c.trim}"/><path d="M0 18H${width}" fill="none" stroke="${c.trim}" stroke-width="16"/>${apertures}</svg>`;
  const outdoors = openings.find(([name]) => /^(?:window|gate)/.test(name))?.[1];
  return { ...normalizeMotionVector(svg, key, key, description), space, regions: { ...space.regions, ...(outdoors ? { outdoors } : {}) }, anchors: { base: { x: 0.5, y: 1 } }, bounds: { x: 0, y: 0, width: 1, height: 1 }, layerRevision: L.REVISION, stagingRevision: S.REVISION, spaceRevision: C.REVISION, backgroundRevision: C.BACKGROUND_REVISION };
};
