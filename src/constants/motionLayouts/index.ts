export type MotionLayoutId = "auto" | "stage" | "cinematic" | "wide" | "medium" | "close";
interface MotionLayoutSpec {
  label: { vi: string; en: string };
  hint: { vi: string; en: string };
  preview: string;
}
export const MOTION_LAYOUTS: Record<MotionLayoutId, MotionLayoutSpec> = {
  auto: { label: { vi: "Tự động", en: "Auto" }, hint: { vi: "Theo loại cảnh: mở đầu, bản đồ, đám đông thấy toàn cảnh; cảnh cận thì cận; người di chuyển thì trung cảnh; còn lại cắt như phim", en: "By the kind of scene: openings, maps and crowds wide; close scenes close; travelling leads in medium shots; the rest cut like a film" }, preview: "/motion-layouts/auto.webp" },
  stage: { label: { vi: "Dàn ngang", en: "Side stage" }, hint: { vi: "Toàn thân: thấy người từ đầu tới chân, máy lia theo người đi", en: "Full shot: people head to toe, the camera pans with whoever walks" }, preview: "/motion-layouts/stage.webp?v=1116" },
  cinematic: { label: { vi: "Điện ảnh", en: "Cinematic" }, hint: { vi: "Cắt theo câu: toàn → trung → cận, không nhảy hình", en: "Cut on the narration: wide → medium → close, never a jump cut" }, preview: "/motion-layouts/cinematic.webp?v=1116" },
  wide: { label: { vi: "Toàn cảnh", en: "Wide" }, hint: { vi: "Cả khung tổng; chuyển động mượt trôi nhẹ, cắt dán đứng yên", en: "The whole master shot; a slight drift with smooth movement, still with cut-out" }, preview: "/motion-layouts/wide.webp?v=1116" },
  medium: { label: { vi: "Trung cảnh", en: "Medium" }, hint: { vi: "Cú đầu toàn thân, sau đó cắt giữa đùi, mắt trên đường 1/3", en: "A full shot first, then cut at mid-thigh, eyes on the upper third" }, preview: "/motion-layouts/medium.webp?v=1116" },
  close: { label: { vi: "Cận cảnh", en: "Close" }, hint: { vi: "Cú đầu trung cảnh để định hướng, sau đó cận giữa ngực, thấy rõ mặt", en: "A medium shot to set the place, then medium close-ups at mid-chest" }, preview: "/motion-layouts/close.webp?v=1116" },
};
export const MOTION_LAYOUT_DEFAULT: MotionLayoutId = "auto";
export const MOTION_LAYOUT_WIDE: MotionLayoutId = "wide";
export const MOTION_LAYOUT_TEXT = { vi: { title: "Bố cục" }, en: { title: "Layout" } } as const;
