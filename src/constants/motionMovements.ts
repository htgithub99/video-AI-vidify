import type { MotionMovement } from "./motionDrawStyles/types.js";
// "Chuyển động": how the figures and the camera move, chosen apart from the drawing style (which only sets the default).
export const MOTION_MOVEMENT_OPTIONS: Record<MotionMovement, { label: { vi: string; en: string }; hint: { vi: string; en: string }; preview: string }> = {
  smooth: {
    label: { vi: "Mượt liên tục", en: "Smooth" },
    hint: { vi: "Nhân vật đi, chạy, thở liền mạch; camera trôi êm theo bố cục.", en: "Figures walk, run and breathe continuously; the camera glides with the layout." },
    preview: "/motion-styles/history.webp?v=1114f",
  },
  cutout: {
    label: { vi: "Cắt dán kể chuyện", en: "Cut-out storybook" },
    hint: { vi: "Đổi tư thế dứt khoát, đi theo từng bước nhảy, camera cắt cận theo lời kể, chuyển mờ đen khi nhảy thời gian, thẻ địa điểm và năm.", en: "Snapped poses, hopping steps, a camera that cuts close with the narration, dips to black at time jumps, place and year cards." },
    preview: "/motion-styles/cutout.webp?v=1117b",
  },
};
export const MOTION_MOVEMENT_TEXT = { vi: { title: "Chuyển động" }, en: { title: "Motion" } } as const;
