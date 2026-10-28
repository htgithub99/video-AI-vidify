import { MOTION_REMOTION_STAGING as S } from "../constants/motionRemotionStaging.js";
import { normalizeMotionVector } from "./motionVectorAsset.js";
export const remotionSpiritCrowdAsset = (key: string) => {
  const figures = Array.from({ length: 7 }, (_, index) => {
    const x = 55 + index * 112,
      top = 30 + (index % 3) * 18;
    return `<g opacity="${0.5 + (index % 3) * 0.13}"><path d="M${x - 15} ${top + 35}Q${x - 28} ${top + 80} ${x - 36} 280L${x + 36} 280Q${x + 28} ${top + 80} ${x + 15} ${top + 35}Z" fill="#3d444c"/><ellipse cx="${x}" cy="${top + 17}" rx="17" ry="23" fill="#a7adb0"/><path d="M${x - 19} ${top + 14}Q${x - 17} ${top - 12} ${x + 12} ${top - 6}L${x + 20} ${top + 23}Q${x + 8} ${top + 4} ${x - 19} ${top + 14}Z" fill="#292c34"/><path d="M${x - 10} ${top + 19}h6m8 0h6" stroke="#333640" stroke-width="3"/></g>`;
  }).join("");
  return { ...normalizeMotionVector(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 300">${figures}</svg>`, key, key, S.CROWD_DESCRIPTION), anchors: { base: { x: 0.5, y: 280 / 300 }, inside: { x: 0.5, y: 0.5 } }, bounds: { x: 0.02, y: 0.03, width: 0.96, height: 0.91 }, stagingRevision: S.REVISION };
};
