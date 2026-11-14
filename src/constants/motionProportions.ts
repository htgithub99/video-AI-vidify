import type { MotionProportionId } from "./motionDrawStyles/types.js";
export const MOTION_PROPORTIONS = {
  STYLE: "style",
  NATIVE: "chibi" as MotionProportionId,
  LABEL_JOIN: ": ",
  CHOICES: ["chibi", "balanced", "storybook"] as MotionProportionId[],
  TEXT: {
    vi: { title: "Tỷ lệ", style: "Theo kiểu vẽ", hint: "Tỷ lệ đầu so với thân người; đồ vật, con vật và nhà cửa luôn theo kích thước thật so với người" },
    en: { title: "Proportions", style: "Match the style", hint: "Head-to-body ratio of people; objects, animals and buildings always keep their real size next to people" },
  },
  SPECS: {
    chibi: {
      label: { vi: "Chibi đầu to (~2 đầu)", en: "Big-head chibi (~2 heads)" },
      planner: "PROPORTIONS: big-head chibi people about two heads tall (the head is close to half the height); props, animals, vehicles and buildings keep their real size next to them.",
      figure: "",
    },
    balanced: {
      label: { vi: "Hoạt hình cân đối (~4 đầu)", en: "Balanced cartoon (~4 heads)" },
      planner: "PROPORTIONS: people are balanced cartoon figures about four heads tall (head a quarter of the height, legs a little under half, shoulders about two head widths); props, animals, vehicles and buildings keep their real size next to them.",
      figure:
        "PROPORTION OVERRIDE (replaces the head, body and vertical-frame numbers above; keep each person's total height H exactly as large as those numbers give for the r you choose): people are about four heads tall: head diameter H/4 on a short visible neck, torso from the shoulders at 0.72H down to the hips at 0.46H, legs from the hips to the shoes (a little under half of H), shoulders about two head widths, arms hanging to mid-thigh, small mitten hands and feet. Weapons, tools, animals, vehicles, doors and furniture keep their real size against H (a spear taller than the man, a rifle about 0.6H, a horse's back at 0.75H, a door about 1.15H).",
    },
    storybook: {
      label: { vi: "Kể chuyện gần thật (~5 đầu)", en: "Storybook natural (~5 heads)" },
      planner: "PROPORTIONS: naturally proportioned storybook people about five heads tall (head a fifth of the height, legs about half, shoulders about two head widths); props, animals, vehicles and buildings keep their real size next to them.",
      figure:
        "PROPORTION OVERRIDE (replaces the head, body and vertical-frame numbers above; keep each person's total height H exactly as large as those numbers give for the r you choose): people are about five heads tall: head diameter H/5 on a short visible neck, torso from the shoulders at 0.76H down to the hips at 0.48H, legs from the hips to the shoes (about half of H), shoulders about two head widths, arms hanging to mid-thigh, natural hands and boots. Weapons, tools, animals, vehicles, doors and furniture keep their real size against H (a spear taller than the man, a rifle about 0.6H, a horse's back at 0.75H, a door about 1.15H).",
    },
  } as Record<MotionProportionId, { label: { vi: string; en: string }; planner: string; figure: string }>,
} as const;
