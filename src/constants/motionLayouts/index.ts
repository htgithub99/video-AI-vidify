export type MotionLayoutId = "auto" | "stage" | "cinematic" | "wide" | "medium" | "close";
export interface MotionLayoutSpec {
  label: { vi: string; en: string };
  hint: { vi: string; en: string };
  planner: string;
  scene: string;
  preview: string;
  scale?: string;
  focal?: number;
  focalWide?: number;
  // Height of a main person as a share of the frame for each shot size, so the layout plan follows the chosen layout.
  share?: Record<"establishing" | "wide" | "medium" | "close", number>;
}
export const MOTION_LAYOUTS: Record<MotionLayoutId, MotionLayoutSpec> = {
  auto: { label: { vi: "Tự động", en: "Auto" }, hint: { vi: "Theo kiểu vẽ đã chọn", en: "Follows the drawing style" }, planner: "", scene: "", preview: "/motion-layouts/auto.webp" },
  stage: {
    label: { vi: "Dàn ngang", en: "Side stage" },
    hint: { vi: "Trung cảnh nhìn ngang, người cao 32–40% khung, đứng thành hàng; bản đồ giấy cũ có ký hiệu quân", en: "Side-on medium shots, people 32–40% of the frame in a row; parchment maps with unit tokens" },
    planner: "LAYOUT: mostly side-on medium shots like a stage, people 32-40% of the frame height standing in a row on one ground line, some wide establishing shots and few close-ups; maps are parchment plans with unit tokens and arrows.",
    scene: "FRAMING (layout): draw the main people 32-40% of the frame height, side-on, standing in one row on a single ground line; when the narration names a person or place, add one MotionKit.card tag in a top corner (never beside a face or joined to a person by a line); a map scene uses MotionKit.geoMap with unit markers and arrows.", preview: "/motion-layouts/stage.webp", scale: "SCALE (from the chosen layout; it replaces every other shot-size rule): the main people are 32-40% of the frame height, side-on and head to toe, in most scenes; a wide establishing shot keeps them at 18-24%; never shrink a named or acting person to crowd size. ", focal: 0.26, focalWide: 0.14, share: { establishing: 0.18, wide: 0.22, medium: 0.36, close: 0.42 },
  },
  cinematic: {
    label: { vi: "Điện ảnh", en: "Cinematic" },
    hint: { vi: "Cận và trung cảnh, người chiếm 50–65% khung, có tiền cảnh qua vai, nền dày; thẻ chữ giữa các cảnh", en: "Close and medium shots, people 50–65% of the frame, over-shoulder foreground, dense backgrounds; text cards between scenes" },
    planner: "LAYOUT: cinematic medium and close shots, people 50-65% of the frame height and often cut at the knees or waist, some over-the-shoulder foreground, dense detailed backgrounds; add a label tag, info box or time card where the story gives a name, list or time.",
    scene: "FRAMING (layout): draw the main people large, 50-65% of the frame height (MotionKit.frame with shot 'medium' or 'close'; people may be cut at the knees or waist), some scenes with a dark foreground shape at one edge, and a dense background; when the narration names a person, a thing, a list or a clock time, add one MotionKit.card (tag, info or clock).", preview: "/motion-layouts/cinematic.webp", scale: "SCALE (from the chosen layout; it replaces every other shot-size rule): the main people are 50-65% of the frame height and may be cut at the knees or waist; a wide establishing shot keeps them at 20-28%; never shrink a named or acting person to crowd size. ", focal: 0.38, focalWide: 0.16, share: { establishing: 0.22, wide: 0.27, medium: 0.54, close: 0.64 },
  },
  wide: { label: { vi: "Toàn cảnh", en: "Wide" }, hint: { vi: "Ưu tiên cảnh rộng thấy cả bối cảnh", en: "Prefer wide shots that show the whole setting" }, planner: "LAYOUT: prefer wide establishing shots where people are 16-28% of the frame height and the setting fills the picture; use medium shots only for key dialogue.", scene: "FRAMING (layout): draw the people small, 16-28% of the frame height, inside a full wide setting.", preview: "/motion-layouts/wide.webp", scale: "SCALE (from the chosen layout; it replaces every other shot-size rule): the main people are 16-28% of the frame height inside a full setting; never smaller than 14%. ", focal: 0.14, focalWide: 0.11, share: { establishing: 0.16, wide: 0.19, medium: 0.24, close: 0.28 }, },
  medium: { label: { vi: "Trung cảnh", en: "Medium" }, hint: { vi: "Ưu tiên trung cảnh, thấy người từ đầu tới chân", en: "Prefer medium shots with people shown head to toe" }, planner: "LAYOUT: prefer medium shots where people are 38-48% of the frame height and shown head to toe; mix in a few wide and close shots.", scene: "FRAMING (layout): draw the main people 38-48% of the frame height, shown head to toe.", preview: "/motion-layouts/medium.webp", scale: "SCALE (from the chosen layout; it replaces every other shot-size rule): the main people are 38-48% of the frame height, head to toe; a wide establishing shot keeps them at 18-24%. ", focal: 0.3, focalWide: 0.14, share: { establishing: 0.19, wide: 0.23, medium: 0.42, close: 0.48 }, },
  close: { label: { vi: "Cận cảnh", en: "Close" }, hint: { vi: "Ưu tiên cận cảnh mặt và hành động", en: "Prefer close shots of faces and actions" }, planner: "LAYOUT: prefer close shots where people fill 58-72% of the frame height, cut at the chest or waist, focused on faces, hands and objects; open each place with one wide shot.", scene: "FRAMING (layout): draw the main people 58-72% of the frame height, cut at the chest or waist (MotionKit.frame with shot 'close').", preview: "/motion-layouts/close.webp", scale: "SCALE (from the chosen layout; it replaces every other shot-size rule): the main people fill 58-72% of the frame height, cut at the chest or waist; an opening wide shot keeps them at 20-28%. ", focal: 0.46, focalWide: 0.16, share: { establishing: 0.22, wide: 0.27, medium: 0.6, close: 0.7 }, },
};
export const MOTION_LAYOUT_DEFAULT: MotionLayoutId = "auto";
export const MOTION_LAYOUT_TEXT = { vi: { title: "Bố cục" }, en: { title: "Layout" } } as const;
