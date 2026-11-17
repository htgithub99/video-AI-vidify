import type { MotionKitSkin } from "./types.js";
import { MOTION_KIT_THINGS_DRAW } from "./draw.js";
export const OUTLINE_SKIN: MotionKitSkin = {
  id: "outline",
  params: { waterLook: { day: "#7fb8e0", night: "#4e6680", ripple: "soft" }, ol: "#26201c", skin: "#f8f8f6", skinShade: "#d0d5dd", mitten: "#fbfbf8", hip: 0.95, top: 1.55, hem: 0.05, head: 2.4, shX: 0.6, shY: 1.38, upper: 0.55, fore: 0.5, thigh: 0.46, shin: 0.42, foot: 0.12, arm: 0.3, leg: 0.3, hipX: 0.26, hand: 0.17, lw: 0.075, pants: 0.6, boots: "#36281e", top0: "#6e5343", neck: 0.26, thumb: true, torsoW: 1.08, torsoProf: [[0, 0.46], [0.12, 0.7], [0.45, 0.62], [0.78, 0.56], [1, 0.6]] },
  draw: MOTION_KIT_THINGS_DRAW,
};
