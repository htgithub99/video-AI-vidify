export type MotionLayoutId = "auto" | "stage" | "cinematic" | "wide" | "medium" | "close";
// A layout is a virtual camera over the scene the AI drew once: it never changes the drawing, only how close the frame is.
// Shot sizes are the cinematographer's cut points on the main person (full: head to toe; cowboy: mid-thigh; medium: just
// below the waist; mcu: mid-chest); "wide" shows the AI's whole frame.
export type MotionCameraShot = "wide" | "full" | "cowboy" | "medium" | "mcu";
export const MOTION_CAMERA_SHOTS: readonly MotionCameraShot[] = ["wide", "full", "cowboy", "medium", "mcu"];
interface MotionLayoutSpec {
  label: { vi: string; en: string };
  hint: { vi: string; en: string };
  preview: string;
  // The shot size for a scene planned as a medium shot; establishing and wide scenes step one size out, close scenes one in.
  shot: MotionCameraShot;
}
export const MOTION_LAYOUTS: Record<MotionLayoutId, MotionLayoutSpec> = {
  auto: { label: { vi: "Tự động", en: "Auto" }, hint: { vi: "Bộ vẽ chuẩn: theo kiểu vẽ đã chọn · Dựng cảnh AI: nguyên khung", en: "Standard kit: follows the drawing style · AI scenes: the whole frame" }, preview: "/motion-layouts/auto.webp", shot: "wide" },
  stage: { label: { vi: "Dàn ngang", en: "Side stage" }, hint: { vi: "Máy quay toàn thân: thấy người từ đầu tới chân", en: "Full shot: people head to toe" }, preview: "/motion-layouts/stage.webp?v=1116", shot: "full" },
  cinematic: { label: { vi: "Điện ảnh", en: "Cinematic" }, hint: { vi: "Trung cảnh: cắt ngay dưới thắt lưng, mắt trên đường 1/3", en: "Medium shot: cut just below the waist, eyes on the upper third" }, preview: "/motion-layouts/cinematic.webp?v=1116", shot: "medium" },
  wide: { label: { vi: "Toàn cảnh", en: "Wide" }, hint: { vi: "Nguyên khung cảnh AI vẽ", en: "The whole frame the AI drew" }, preview: "/motion-layouts/wide.webp?v=1116", shot: "wide" },
  medium: { label: { vi: "Trung cảnh", en: "Medium" }, hint: { vi: "Cắt giữa đùi (cowboy), mắt trên đường 1/3", en: "Cowboy shot: cut at mid-thigh, eyes on the upper third" }, preview: "/motion-layouts/medium.webp?v=1116", shot: "cowboy" },
  close: { label: { vi: "Cận cảnh", en: "Close" }, hint: { vi: "Cận trung: cắt giữa ngực, thấy rõ mặt", en: "Medium close-up: cut at mid-chest" }, preview: "/motion-layouts/close.webp?v=1116", shot: "mcu" },
};
export const MOTION_LAYOUT_DEFAULT: MotionLayoutId = "auto";
// The AI's whole frame, with no camera (scene checks and thumbnails taken while drawing).
export const MOTION_LAYOUT_WIDE: MotionLayoutId = "wide";
export const MOTION_LAYOUT_TEXT = { vi: { title: "Bố cục" }, en: { title: "Layout" } } as const;
