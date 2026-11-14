import type { MotionDrawStyleSpec } from "./types.js";
export const SKETCH_DRAW_STYLE: MotionDrawStyleSpec = {
  family: "history",
  label: { vi: "Hoạt hình", en: "Cartoon" },
  hint: { vi: "Nét đều xanh than, màu phẳng trầm, người ~4,5 đầu đầy đặn, cảnh đêm có lửa (kiểu The Curious Stick)", en: "Uniform navy line, flat muted colour, full ~4.5-head people, firelit night scenes (The Curious Stick-like)" },
  planner:
    "Flat 2D cartoon (The Curious Stick-like): smooth uniform dark-navy outlines, flat muted colours with at most one soft shade tone, no texture or hatching; people about four and a half heads tall with full natural bodies (shoulders about two head widths, tapered arms and legs, mitten hands with a thumb), paper-white faces with dot eyes, short heavy brows and simple mouths; era-accurate clothes and armour in muted reds, steels, browns and greens; moody night or dusk light with warm fire glows on dark layered pine forests and muddy ground with outlined puddles; maps are flat top-down plans or parchment with unit tokens.",
  title: "VISUAL STYLE (flat cartoon):",
  look:
    "- Look: flat 2D cartoon (The Curious Stick-like). Each shape is one closed Path2D of quadraticCurveTo curves with a flat muted fill and a smooth uniform dark-navy (#16172a) stroke; at most one darker shade tone inside clip(p); no grain, hatching or gradients except light glows. People are about 4.5 heads tall with full bodies and tapered limbs; faces paper-white with dot eyes and short brows. Night scenes: navy sky with stars, dark layered pines, dark muddy ground with outlined puddles, warm fire glow.",
  kitLookLine:
    "- Look: flat 2D cartoon (The Curious Stick-like); the kit draws every figure, animal, building, plant, sky and effect in this look, and the few shapes you draw yourself copy it: one closed Path2D of quadraticCurveTo curves, flat muted fill, smooth uniform dark-navy stroke, at most one shade tone.",
  kitLook: "sketch",
  figure: "history",
  proportion: "balanced",
  layout: "stage",
  preview: "/motion-styles/sketch.webp?v=1114f",
};
