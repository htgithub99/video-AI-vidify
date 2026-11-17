import type { MotionKitSkin } from "./types.js";
import { MOTION_KIT_PARTS_DRAW } from "./draw.js";
// "Cắt dán kể chuyện": a storybook cut-out look. Thin warm-black line, flat colour with one hard shade band (flat), white
// egg faces with dot eyes, heavy brows and a wide mouth, period dress from the shared outfits. cutout: each pose is a
// held picture (no blending between drawings), walking and running step through four leg drawings and hop.
export const CUTOUT_SKIN: MotionKitSkin = {
  id: "cutout",
  params: { waterLook: { day: "#6f97ad", night: "#3c5466", ripple: "soft" },
    faceDetail: true, flat: true, cutout: true,
    ol: "#2b2622", skin: "#f4f1ea", skinShade: "#d9d5ce", mitten: "#f4f1ea", pants: 0.62, boots: "#4a3628", top0: "#7a5a44", lw: 0.05, lineTint: 0.25,
    // Adult puppet proportions (about five heads tall, as in the reference storybook videos): an egg head, a long torso,
    // long legs in loose trousers, thin arms and mitten hands; every limb is two stiff pieces pinned at the joint (puppet).
    puppet: true, headR: 0.55, head: 2.06, neck: 0.22, top: 1.47, shY: 1.36, shX: 0.46, hip: 2.35, hem: 0.36, thigh: 1.25, shin: 1.1, foot: 0.13, upper: 0.88, fore: 0.8, torsoProf: [[0, 0.4], [0.06, 0.5], [0.3, 0.47], [0.62, 0.42], [1, 0.5]], runArms: true, flat2d: true, corner: 0.35, bootShaft: 0.36, armorOver: true, beltY: -0.24, arm: 0.23, leg: 0.42, hipX: 0.2, hand: 0.22,
    limb: { leg: [1, 1, 1], arm: [1, 1, 1] }, torsoW: 1, thumb: true, organic: { leaf: ["#56703f", "#4a6338", "#3e5530"], leafNight: ["#2f3d36", "#29362f", "#232e29"], pine: "#34493a", pineNight: "#1d2a27", bark: "#4e3a2c", barkNight: "#2e2722" }, ground: { grass: "#6a7a48", dirt: "#9a7a52", mud: "#4e4236", battlefield: "#5c5240", field: "#a8985e" }, mapSea: "#8ea6aa", mapLand: "#d6c9a6", parchment: true, sky: { day: ["#8fa6b6", "#d8dccf"], overcast: ["#7f8a92", "#c2c5c0"], dawn: ["#6c7290", "#e0b48a"], dusk: ["#3e3c58", "#c28a6a"], night: ["#0b1020", "#1e2638"] }, puddles: true, tone: { col: "#4a4a40", k: 0.08, sat: 0.92 }, rim: 0, rimD: 1, mute: 0.12, dim: 0.22, dimCol: "#7e8290", card: { ink: "#2b2622", paper: "#efe6d0", head: "#3a2c24", headText: "#efe6d0", text: "#2b2622" },
  },
  draw: MOTION_KIT_PARTS_DRAW,
};
