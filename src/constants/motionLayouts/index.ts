export type MotionLayoutId = "auto" | "stage" | "cinematic" | "wide" | "medium" | "close";
export interface MotionLayoutSpec {
  label: { vi: string; en: string };
  hint: { vi: string; en: string };
  planner: string;
  scene: string;
  preview: string;
}
export const MOTION_LAYOUTS: Record<MotionLayoutId, MotionLayoutSpec> = {
  auto: { label: { vi: "Tự động", en: "Auto" }, hint: { vi: "Theo kiểu vẽ đã chọn", en: "Follows the drawing style" }, planner: "", scene: "", preview: "/motion-layouts/auto.webp" },
  stage: {
    label: { vi: "Dàn ngang", en: "Side stage" },
    hint: { vi: "Trung cảnh nhìn ngang, người cao 40–50% khung, đứng thành hàng; bản đồ giấy cũ có ký hiệu quân", en: "Side-on medium shots, people 40–50% of the frame in a row; parchment maps with unit tokens" },
    planner: "LAYOUT: mostly side-on medium shots like a stage, people 40-50% of the frame height standing in a row on one ground line, some wide establishing shots and few close-ups; maps are parchment plans with unit tokens and arrows.",
    scene: "FRAMING (layout): draw the main people 40-50% of the frame height, side-on, standing in one row on a single ground line; label a named person or place with one MotionKit.card tag; a map scene uses MotionKit.geoMap with unit markers and arrows.", preview: "/motion-layouts/stage.webp",
  },
  cinematic: {
    label: { vi: "Điện ảnh", en: "Cinematic" },
    hint: { vi: "Cận và trung cảnh, người chiếm 60–80% khung, có tiền cảnh qua vai, nền dày; thẻ chữ giữa các cảnh", en: "Close and medium shots, people 60–80% of the frame, over-shoulder foreground, dense backgrounds; text cards between scenes" },
    planner: "LAYOUT: cinematic medium and close shots, people 60-80% of the frame height and often cut at the knees or waist, some over-the-shoulder foreground, dense detailed backgrounds; add a label tag, info box or time card where the story gives a name, list or time.",
    scene: "FRAMING (layout): draw the main people large, 60-80% of the frame height (MotionKit.frame with shot 'medium' or 'close'; people may be cut at the knees or waist), some scenes with a dark foreground shape at one edge, and a dense background; when the narration names a person, a thing, a list or a clock time, add one MotionKit.card (tag, info or clock).", preview: "/motion-layouts/cinematic.webp",
  },
  wide: { label: { vi: "Toàn cảnh", en: "Wide" }, hint: { vi: "Ưu tiên cảnh rộng thấy cả bối cảnh", en: "Prefer wide shots that show the whole setting" }, planner: "LAYOUT: prefer wide establishing shots where people are 20-35% of the frame height and the setting fills the picture; use medium shots only for key dialogue.", scene: "FRAMING (layout): draw the people small, 20-35% of the frame height, inside a full wide setting.", preview: "/motion-layouts/wide.webp" },
  medium: { label: { vi: "Trung cảnh", en: "Medium" }, hint: { vi: "Ưu tiên trung cảnh, thấy người từ đầu tới chân", en: "Prefer medium shots with people shown head to toe" }, planner: "LAYOUT: prefer medium shots where people are 45-60% of the frame height and shown head to toe; mix in a few wide and close shots.", scene: "FRAMING (layout): draw the main people 45-60% of the frame height, shown head to toe.", preview: "/motion-layouts/medium.webp" },
  close: { label: { vi: "Cận cảnh", en: "Close" }, hint: { vi: "Ưu tiên cận cảnh mặt và hành động", en: "Prefer close shots of faces and actions" }, planner: "LAYOUT: prefer close shots where people fill 70-90% of the frame height, cut at the chest or waist, focused on faces, hands and objects; open each place with one wide shot.", scene: "FRAMING (layout): draw the main people 70-90% of the frame height, cut at the chest or waist (MotionKit.frame with shot 'close').", preview: "/motion-layouts/close.webp" },
};
export const MOTION_LAYOUT_DEFAULT: MotionLayoutId = "auto";
export const MOTION_LAYOUT_TEXT = { vi: { title: "Bố cục" }, en: { title: "Layout" } } as const;
