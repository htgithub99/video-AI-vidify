import type { MotionKitSkin } from "./types.js";
import { MOTION_KIT_PARTS_DRAW } from "./draw.js";
export const STICK_SKIN: MotionKitSkin = {
  id: "stick",
  params: { waterLook: { day: "#5f8fb8", night: "#3e5486", ripple: "hatch" },
    stick: 0.1, sleeve: 0.42, faceDetail: true, sole: "#f1eadc",
    ol: "#2a1f1c", skin: "#f6f3ec", skinShade: "#d8d2c8", mitten: "#2a1f1c", pants: 0.6, boots: "#8a3426", top0: "#a8342e", lw: 0.05,
    headR: 0.72, head: 2.32, neck: 0.16, top: 1.62, shY: 1.46, shX: 0.48, hip: 1.62, hem: 0.06, thigh: 0.86, shin: 0.8, foot: 0.1, upper: 0.72, fore: 0.66, torsoProf: [[0, 0.42], [0.1, 0.6], [0.35, 0.56], [0.62, 0.47], [0.72, 0.5], [1, 0.6]], runArms: true, flat2d: true, corner: 0.35, bootShaft: 0.5, armorOver: true, beltY: -0.24, arm: 0.33, leg: 0.37, hipX: 0.2, hand: 0.19,
    limb: { leg: [1.25, 1.02, 0.84], arm: [1.12, 1.0, 0.86] }, torsoW: 0.92, thumb: true, organic: { leaf: ["#6e8a4a", "#5d7a40", "#4c6838"], leafNight: ["#3a4870", "#33405f", "#2c3854"], pine: "#3d5a3a", pineNight: "#1f2a4a", bark: "#6a4a32", barkNight: "#2e2a44" }, ground: { grass: "#8c9452", dirt: "#d8b676", mud: "#8a6a4a", battlefield: "#cfa968", field: "#d2b46c" }, mapSea: "#8fb0cc", mapLand: "#e2cc94", parchment: true, sky: { day: ["#6d8fb8", "#e9cc9c"], overcast: ["#8c97aa", "#cfc8bc"], dawn: ["#7a7aaa", "#eab98a"], dusk: ["#4a4a7e", "#dc9c6c"], night: ["#0f1738", "#2b3b74"] }, puddles: true, tone: { col: "#6a5c8c", k: 0.08, sat: 0.96 }, rim: 0.9, rimD: 1, mute: 0.1, dim: 0.3, dimCol: "#a49ec0", card: { ink: "#2a1f1c", paper: "#f2e6cc", head: "#a8342e", headText: "#f6efe0", text: "#2a1f1c" },
  },
  draw: MOTION_KIT_PARTS_DRAW,
};
