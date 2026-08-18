import _ from "lodash";

export type StyleCategory = "all" | "cartoon_2d" | "3d_cinematic" | "artistic_retro";

export interface CuratedStylePreset {
  id: string;
  name: string;
  nameVi: string;
  category: StyleCategory;
  icon: string;
  tagline: string;
  description: string;
  positivePrompt: string;
  negativePrompt: string;
  defaultBackgroundMode: "minimal" | "contextual" | "white";
  characterRule: string;
  keywords: string[];
}

export const STYLE_PRESET_CONFIG = {
  DEFAULT_ID: "stickman",
  CUSTOM_ID: "custom",
  CUSTOM_NAME: "Tùy chỉnh",
  CUSTOM_NAME_VI: "Tùy chỉnh",
  CUSTOM_CATEGORY: "all" as StyleCategory,
  CUSTOM_ICON: "🎨",
  CUSTOM_TAGLINE: "Tùy chỉnh • Độc bản",
  CUSTOM_BG_MODE: "contextual" as const,
  MIN_CUSTOM_PROMPT_LENGTH: 30,
  KEYWORD_LENGTH_KEY: "keywordLength",
  WORD_BOUNDARY_PREFIX: "\\b",
  WORD_BOUNDARY_SUFFIX: "\\b",
  REGEX_FLAG_I: "i",
} as const;

export const STYLE_CATEGORIES: { id: StyleCategory; nameVi: string; nameEn: string }[] = [
  { id: "all", nameVi: "Tất cả (7)", nameEn: "All (7)" },
  { id: "cartoon_2d", nameVi: "2D & Hoạt hình", nameEn: "2D & Cartoon" },
  { id: "3d_cinematic", nameVi: "3D & Điện ảnh", nameEn: "3D & Cinema" },
];

export const CURATED_STYLE_PRESETS: Record<string, CuratedStylePreset> = {
  stickman: {
    id: "stickman",
    name: "Stickman",
    nameVi: "Người Que",
    category: "cartoon_2d",
    icon: "🏃",
    tagline: "Tối giản • Nền trắng",
    description: "Minh họa người que 2D đơn sắc, nét đen đồng nhất trên nền trắng; tối ưu cho video giải thích rõ ràng.",
    positivePrompt: "minimalist 2D black-ink stick-figure illustration, pure white background, high-contrast monochrome vector line art, uniform 4px-style black outlines, circular heads, simple stick limbs and hands, sparse expressive eyes and eyebrows, one clear action per frame, clean educational explainer visual, consistent character design",
    negativePrompt: "any color, gradients, gray wash, 3D render, photorealism, realistic skin, painterly texture, detailed scenery, drop shadows, complex shading, text, watermark, blur, noise",
    defaultBackgroundMode: "white",
    characterRule: "Preserve circular head, thin stick limbs, simple hands, black-only uniform line weight, and pure white negative space in every scene.",
    keywords: ["người que", "stickman", "nguoi que", "stick figure", "đen trắng", "hình que"],
  },
  gai_xinh_2d: {
    id: "gai_xinh_2d",
    name: "Pretty Girl 2D",
    nameVi: "Gái Xinh 2D",
    category: "cartoon_2d",
    icon: "✨",
    tagline: "Thời thượng • Sắc nét",
    description: "Webtoon romance hiện đại, nét mực tinh gọn, màu sạch và nhân vật thời trang, thanh lịch.",
    positivePrompt: "polished modern Korean webtoon illustration, 2D digital comic art, elegant adult female character, refined almond-shaped eyes, clean tapered ink lines, soft cel shading with subtle blush, contemporary stylish clothing, restrained pastel-and-jewel-tone palette, bright editorial lighting, attractive but natural facial proportions, consistent webtoon character model",
    negativePrompt: "photorealism, 3D CGI, western superhero comic, chibi proportions, childlike appearance, sexualized pose, rough sketch, mismatched eyes, malformed hands, muddy palette, heavy grain, text, watermark",
    defaultBackgroundMode: "contextual",
    characterRule: "Use elegant adult webtoon proportions, clear almond eyes, glossy stylized hair masses, thin tapered linework, and clean cel-shaded skin consistently.",
    keywords: ["gái xinh", "gái xinh 2d", "hot girl", "nữ thần", "gai xinh", "webtoon", "manhwa"],
  },
  hoat_hinh_mat_hip: {
    id: "hoat_hinh_mat_hip",
    name: "Funny Slit Eyes",
    nameVi: "Hoạt Hình Mắt Híp",
    category: "cartoon_2d",
    icon: "😆",
    tagline: "Đầu to • Hài hước",
    description: "Hoạt hình hài 2D đầu to, mắt híp hình hạt đỗ và biểu cảm cường điệu, màu phẳng tươi sáng.",
    positivePrompt: "playful 2D comedy cartoon, oversized round head and small compact body, horizontal bean-shaped squinting eyes, arched brows, wide exaggerated comic mouth, thick uniform black outlines, simple rounded shapes, bright flat color fills, minimal props, clean cheerful explainer-animation frame, consistent chibi proportions",
    negativePrompt: "photorealism, realistic anatomy, 3D CGI, anime detailed eyes, dark gritty mood, thin sketchy lines, gradients, dramatic rendering, busy background, text, watermark, blur",
    defaultBackgroundMode: "minimal",
    characterRule: "Lock the oversized round head, compact body, bean-shaped squinting eyes, thick outline weight, and exaggerated comedy expression across all scenes.",
    keywords: ["mắt híp", "hoạt hình mắt híp", "hài bựa", "nhóc tóc đỏ", "én", "vui nhộn", "mat hip"],
  },
  tho_bay_mau: {
    id: "tho_bay_mau",
    name: "Tho Bay Mau Style",
    nameVi: "Thỏ Bảy Màu",
    category: "cartoon_2d",
    icon: "🍵",
    tagline: "Cổ tích • Dân gian VN",
    description: "Hoạt hình châm biếm Việt Nam: hình khối tối giản, nét mực đậm và bảng màu dân gian ấm.",
    positivePrompt: "Vietnamese satirical folk-cartoon illustration, minimalist 2D animation, rounded capsule-shaped torso, round head, dot eyes and small expressive mouth, bold even black ink outlines, warm muted folk palette of ochre, terracotta, teal and cream, simple paper-like flat fills, witty everyday storytelling, clean uncluttered composition, consistent character silhouette",
    negativePrompt: "photorealism, 3D CGI, glossy plastic, anime action style, hyper-detailed skin, neon cyberpunk, dark horror mood, thin realistic anatomy, gradients, text, watermark, blur",
    defaultBackgroundMode: "contextual",
    characterRule: "Keep the capsule torso, round head, dot eyes, minimal limbs, bold black outline, and muted folk palette unchanged between scenes.",
    keywords: ["thỏ bảy màu", "tho bay mau", "dân gian", "cổ tích", "bá hộ", "trạng quỳnh", "việt nam"],
  },
  gau_truc_hai: {
    id: "gau_truc_hai",
    name: "Funny Panda Meme",
    nameVi: "Gấu Trúc Hài",
    category: "cartoon_2d",
    icon: "🐼",
    tagline: "Meme bựa • Cổ trang",
    description: "Meme hoạt hình đầu gấu trúc, biểu cảm lầy lội; trang phục kiếm hiệp cổ trang dễ nhận diện.",
    positivePrompt: "humorous 2D panda-head meme cartoon, round white panda head, symmetrical black ears and black eye patches, deliberately exaggerated deadpan human-like comic expression, simplified ancient Chinese wuxia robe and hair accessories, bold clean outlines, flat warm colors, one readable comedic reaction, light parchment or simple scenic background, consistent panda head shape",
    negativePrompt: "photorealistic human face, realistic panda, serious portrait, 3D CGI, western superhero comic, cyberpunk neon, malformed ears, asymmetrical eye patches, horror, text, watermark, blur, low resolution",
    defaultBackgroundMode: "contextual",
    characterRule: "Always retain the round white panda head, two black ears, balanced black eye patches, flat comic expression, and simplified wuxia costume; avoid realistic fur.",
    keywords: ["gấu trúc", "gấu trúc hài", "panda meme", "gấu trúc bựa", "cổ trang", "gau truc", "ảnh chế"],
  },
  ve_tay_don_gian: {
    id: "ve_tay_don_gian",
    name: "Simple Hand-Drawn",
    nameVi: "Vẽ Tay Đơn Giản",
    category: "cartoon_2d",
    icon: "✏️",
    tagline: "Phóng khoáng • Đời sống",
    description: "Minh họa mực tay phóng khoáng cho các tình huống đời sống, nét vẽ tự nhiên và nền thoáng.",
    positivePrompt: "hand-drawn indie editorial cartoon, loose confident black ink contours with intentional line variation, off-white paper background, limited two-color accent palette, simple everyday clothing and props, understated facial features, observational slice-of-life humor, airy negative space, lightly imperfect human-made linework, consistent sketch vocabulary",
    negativePrompt: "3D CGI, photorealism, glossy anime, polished vector-perfect lines, dense crosshatching, neon glow, volumetric lighting, elaborate colorful scenery, text, watermark, blur",
    defaultBackgroundMode: "white",
    characterRule: "Keep loose ink-line variation, off-white paper ground, limited accents, simple everyday clothes, and relaxed stylized facial features in every frame.",
    keywords: ["vẽ tay", "vẽ tay đơn giản", "ve tay", "đời sống", "châm biếm", "indie", "anh da đen"],
  },
  tien_hiep_3d: {
    id: "tien_hiep_3d",
    name: "3D Xianxia",
    nameVi: "3D Tiên Hiệp",
    category: "3d_cinematic",
    icon: "⚔️",
    tagline: "Đồ họa 3D • Tu tiên",
    description: "Khung hình donghua tiên hiệp 3D điện ảnh: chất liệu tinh xảo, ánh sáng huyền ảo và trang phục bay bổng.",
    positivePrompt: "cinematic 3D Chinese xianxia donghua frame, premium stylized character render, elegant historical fantasy robes with flowing fabric, refined facial features, detailed hair strands, physically based cloth and environment materials, cool moonlit key light with warm magical rim light, controlled atmospheric mist, shallow depth of field, epic but readable composition, consistent high-end 3D animation asset quality",
    negativePrompt: "2D flat cartoon, stick figure, low-poly geometry, cheap mobile-game render, modern streetwear, plastic skin, distorted anatomy, extra fingers, cluttered effects, oversaturated neon, text, watermark, blur",
    defaultBackgroundMode: "contextual",
    characterRule: "Maintain the same premium 3D donghua facial model, hair design, robe materials, historical-fantasy silhouette, and cinematic cool-to-warm lighting across scenes.",
    keywords: ["3d tiên hiệp", "tiên hiệp", "tu tiên", "3d trung quốc", "tiên nghịch", "đấu phá", "tien hiep", "xianxia", "donghua", "immortal cultivator", "unreal engine 5"],
  },
};

export const DEFAULT_STYLE_PRESET_ID = STYLE_PRESET_CONFIG.DEFAULT_ID;

const findByPresetId = (normalized: string): CuratedStylePreset | undefined => {
  return CURATED_STYLE_PRESETS[normalized];
};

const findByExactPrompt = (trimmed: string, normalized: string): CuratedStylePreset | undefined => {
  return _.find(CURATED_STYLE_PRESETS, (preset) =>
    _.isEqual(_.trim(preset.positivePrompt), trimmed) ||
    _.isEqual(_.toLower(_.trim(preset.positivePrompt)), normalized),
  );
};

const findByPresetName = (normalized: string): CuratedStylePreset | undefined => {
  return _.find(CURATED_STYLE_PRESETS, (preset) =>
    _.isEqual(_.toLower(preset.name), normalized) ||
    _.isEqual(_.toLower(preset.nameVi), normalized),
  );
};

const findByKeywords = (normalized: string): CuratedStylePreset | undefined => {
  const allPresets = _.values(CURATED_STYLE_PRESETS);
  const candidates: { preset: CuratedStylePreset; keywordLength: number }[] = [];

  _.forEach(allPresets, (preset) => {
    _.forEach(preset.keywords, (keyword) => {
      const escaped = _.escapeRegExp(_.toLower(keyword));
      const regex = new RegExp(
        `${STYLE_PRESET_CONFIG.WORD_BOUNDARY_PREFIX}${escaped}${STYLE_PRESET_CONFIG.WORD_BOUNDARY_SUFFIX}`,
        STYLE_PRESET_CONFIG.REGEX_FLAG_I,
      );
      if (regex.test(normalized)) {
        candidates.push({ preset, keywordLength: keyword.length });
      }
    });
  });

  if (_.isEmpty(candidates)) return undefined;
  const bestCandidate = _.maxBy(candidates, STYLE_PRESET_CONFIG.KEYWORD_LENGTH_KEY);
  return bestCandidate?.preset;
};

const createCustomPreset = (prompt: string): CuratedStylePreset => ({
  id: STYLE_PRESET_CONFIG.CUSTOM_ID,
  name: STYLE_PRESET_CONFIG.CUSTOM_NAME,
  nameVi: STYLE_PRESET_CONFIG.CUSTOM_NAME_VI,
  category: STYLE_PRESET_CONFIG.CUSTOM_CATEGORY,
  icon: STYLE_PRESET_CONFIG.CUSTOM_ICON,
  tagline: STYLE_PRESET_CONFIG.CUSTOM_TAGLINE,
  description: prompt,
  positivePrompt: prompt,
  negativePrompt: CURATED_STYLE_PRESETS[DEFAULT_STYLE_PRESET_ID].negativePrompt,
  defaultBackgroundMode: STYLE_PRESET_CONFIG.CUSTOM_BG_MODE,
  characterRule: "",
  keywords: [],
});

export const resolveStylePreset = (input?: string): CuratedStylePreset => {
  if (!input || !_.isString(input)) {
    return CURATED_STYLE_PRESETS[DEFAULT_STYLE_PRESET_ID];
  }

  const trimmed = _.trim(input);
  const normalized = _.toLower(trimmed);

  const matchedById = findByPresetId(normalized);
  if (matchedById) return matchedById;

  const matchedByPrompt = findByExactPrompt(trimmed, normalized);
  if (matchedByPrompt) return matchedByPrompt;

  const matchedByName = findByPresetName(normalized);
  if (matchedByName) return matchedByName;

  const matchedByKeyword = findByKeywords(normalized);
  if (matchedByKeyword) return matchedByKeyword;

  if (_.gt(_.size(trimmed), STYLE_PRESET_CONFIG.MIN_CUSTOM_PROMPT_LENGTH)) {
    return createCustomPreset(trimmed);
  }

  return CURATED_STYLE_PRESETS[DEFAULT_STYLE_PRESET_ID];
};
