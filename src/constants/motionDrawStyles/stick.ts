import type { MotionDrawStyleSpec } from "./types.js";
// A copy of "Hoạt hình" with stick-figure people (ink-line arms and legs, inked hands with fingers, sandals, a big head
// with a detailed face) and a warm sand / lavender / crimson palette with deep-navy nights.
export const STICK_DRAW_STYLE: MotionDrawStyleSpec = {
  family: "history",
  label: { vi: "Người que", en: "Stick figures" },
  hint: { vi: "Tay chân nét que, mặt rõ nét, đất cát ấm, núi tím lavender, đêm xanh navy", en: "Ink-line limbs, detailed faces, warm sand, lavender hills, navy nights" },
  kitLook: "stick",
  proportion: "balanced",
  preview: "/motion-styles/stick.webp?v=1116",
};
