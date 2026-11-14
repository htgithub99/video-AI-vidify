import type { MotionDrawStyleSpec } from "./types.js";
export const COMIC_DRAW_STYLE: MotionDrawStyleSpec = {
  family: "history",
  label: { vi: "Truyện tranh", en: "Comic" },
  hint: { vi: "Nét mực đen chi tiết, nếp áo, nền rậm, người ~5 đầu, thẻ chữ và đồng hồ (kiểu video WW2)", en: "Detailed black ink, fabric folds, dense backgrounds, ~5-head people, label and clock cards (WW2 video-like)" },
  planner:
    "Hand-inked comic illustration (WW2 daily-life video-like): bold black outlines with rich interior linework (fabric folds, seams, roots, leaf veins), muted olive, khaki, earth and foliage greens; people about five heads tall with natural bodies, paper-white round faces shaded grey on one side, dot eyes, short brows and small mouths, white hands with fingers; era-accurate uniforms and gear with pockets, straps and pouches; dense detailed backgrounds of outlined leaves, dirt banks and grass; medium and close cinematic shots; cream label tags with dark borders, olive-header info boxes, white captions on dark boxes and dark time cards with a yellow clock.",
  title: "VISUAL STYLE (inked comic):",
  look:
    "- Look: hand-inked comic illustration (WW2 daily-life video-like). Each shape is one closed Path2D with a muted fill, a darker shade side inside clip(p) and a bold black (#15140f) stroke; add short interior ink lines for folds, seams and texture. People about 5 heads tall, paper-white faces shaded grey on one side, dot eyes; backgrounds dense with outlined leaves, dirt banks, roots and grass.",
  kitLookLine:
    "- Look: hand-inked comic illustration (WW2 daily-life video-like); the kit draws every figure, animal, building, plant, sky and effect in this look, and the few shapes you draw yourself copy it: one closed Path2D, muted fill, darker shade side, bold black stroke, a few interior ink lines; trench, foxhole and forest-edge backgrounds use MotionKit.terrain kind bank and bushes.",
  kitLook: "comic",
  figure: "history",
  proportion: "storybook",
  layout: "cinematic",
  preview: "/motion-styles/comic.webp?v=1114f",
};
