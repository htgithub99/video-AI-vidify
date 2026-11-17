import type { MotionDrawStyleSpec } from "./types.js";
// Storybook cut-out: thin dark line, flat colour with one shade band, held poses that snap and hop, a camera that holds,
// pans evenly with whoever walks and pushes in on each line of the narration.
export const CUTOUT_DRAW_STYLE: MotionDrawStyleSpec = {
  family: "history",
  label: { vi: "Cắt dán kể chuyện", en: "Cut-out storybook" },
  hint: { vi: "Nét mảnh, màu phẳng; dáng đổi tức thì, đi nhảy cóc; máy quay lia đều và đẩy vào theo lời kể", en: "Thin line, flat colour; poses snap, walks hop; the camera pans evenly and pushes in on the narration" },
  kitLook: "cutout",
  proportion: "storybook",
  layout: "wide",
  movement: "cutout",
  preview: "/motion-styles/cutout.webp?v=1117b",
};
