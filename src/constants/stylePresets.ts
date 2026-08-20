import _ from "lodash";

export type StyleCategory = "all" | "cartoon_2d" | "3d_cinematic" | "artistic_retro";

export type BackgroundMode = "minimal" | "contextual" | "white";

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
  defaultBackgroundMode: BackgroundMode;
  characterRule: string;
  keywords: string[];
}

export interface StyleCategoryItem {
  id: StyleCategory;
  nameVi: string;
  nameEn: string;
}

export const STYLE_PRESET_CONFIG = {
  DEFAULT_ID: "stickman",
  CUSTOM_ID: "custom",
  CUSTOM_NAME: "Tùy chỉnh",
  CUSTOM_NAME_VI: "Tùy chỉnh",
  CUSTOM_CATEGORY: "all" as StyleCategory,
  CUSTOM_ICON: "🎨",
  CUSTOM_TAGLINE: "Tùy chỉnh • Độc bản",
  CUSTOM_BG_MODE: "contextual" as BackgroundMode,
  MIN_CUSTOM_PROMPT_LENGTH: 30,
  KEYWORD_LENGTH_KEY: "keywordLength",
  WORD_BOUNDARY_PREFIX: "\\b",
  WORD_BOUNDARY_SUFFIX: "\\b",
  REGEX_FLAG_I: "i",
  EMPTY_STRING: "",
} as const;

export const STYLE_IDENTITY_BOUNDARY = "Style applies only to rendering, linework, shape language, palette, materials, and lighting. Character name, gender, age, face, hair, body, wardrobe, role, and setting must come only from the story character card and current scene.";

export const STYLE_CATEGORIES: StyleCategoryItem[] = [
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
    description: "Minh họa sơ đồ người que 2D đơn sắc, nét đen đồng nhất trên nền trắng; chỉ quy định cách thể hiện, không cung cấp ngoại hình nhân vật mẫu.",
    positivePrompt: "minimalist 2D black-ink stick-figure illustration medium, high-contrast monochrome vector linework, uniform black stroke weight, sparse symbolic detail, pure white background, one clearly readable action per frame, clean educational explainer composition",
    negativePrompt: "any color, gradients, gray wash, 3D render, photorealism, realistic skin, painterly texture, detailed scenery, drop shadows, complex shading, text, watermark, blur, noise",
    defaultBackgroundMode: "white",
    characterRule: "Apply only the monochrome stick-figure abstraction and uniform line treatment. Derive every identity cue, distinguishing feature, action, prop, and setting from the story character card and current scene; do not copy a sample character design.",
    keywords: ["người que", "stickman", "nguoi que", "stick figure", "đen trắng", "hình que"],
  },
  gai_xinh_2d: {
    id: "gai_xinh_2d",
    name: "Pretty Girl 2D",
    nameVi: "Gái Xinh 2D",
    category: "cartoon_2d",
    icon: "✨",
    tagline: "Thời thượng • Sắc nét",
    description: "Ngôn ngữ webtoon 2D hiện đại với nét mực tinh gọn, cel shading sạch và bảng màu biên tập; không mang ngoại hình nhân vật mẫu vào truyện.",
    positivePrompt: "polished Korean webtoon rendering language, 2D digital comic medium, clean tapered ink linework, controlled soft cel shading, restrained pastel-and-jewel-tone palette, crisp color separation, editorial lighting, polished consistent panel rendering",
    negativePrompt: "photorealism, 3D CGI, western superhero comic, accidental chibi proportions, rough sketch, mismatched eyes, malformed hands, muddy palette, heavy grain, text, watermark",
    defaultBackgroundMode: "contextual",
    characterRule: "Apply only webtoon linework, cel shading, palette, and editorial lighting. Character name, gender, age, face, eyes, hair, body, clothing, role, action, and setting must remain exactly story-defined.",
    keywords: ["gái xinh", "gái xinh 2d", "hot girl", "nữ thần", "gai xinh", "webtoon", "manhwa"],
  },
  hoat_hinh_mat_hip: {
    id: "hoat_hinh_mat_hip",
    name: "Funny Slit Eyes",
    nameVi: "Hoạt Hình Mắt Híp",
    category: "cartoon_2d",
    icon: "😆",
    tagline: "Đầu to • Hài hước",
    description: "Hoạt hình hài 2D với nét đậm, hình khối đồ họa mềm và màu phẳng tươi sáng; ngoại hình cụ thể vẫn lấy từ nhân vật trong truyện.",
    positivePrompt: "playful 2D comedy-cartoon rendering language, thick uniform black outlines, simple rounded graphic shape language, bright flat color fills, minimal shading, lively visual timing, clean readable explainer-animation composition",
    negativePrompt: "photorealism, realistic anatomy, 3D CGI, anime detailed eyes, dark gritty mood, thin sketchy lines, gradients, dramatic rendering, busy background, text, watermark, blur",
    defaultBackgroundMode: "minimal",
    characterRule: "Apply only the bold outline, rounded graphic language, flat colors, and comedy-cartoon rendering. Do not impose a preset head, eye, mouth, body, hairstyle, costume, or expression; all character facts and reactions come from the story.",
    keywords: ["mắt híp", "hoạt hình mắt híp", "hài bựa", "nhóc tóc đỏ", "én", "vui nhộn", "mat hip"],
  },
  hoat_hinh_2d_vn: {
    id: "hoat_hinh_2d_vn",
    name: "Vietnamese 2D Cartoon",
    nameVi: "Hoạt Hình 2D VN",
    category: "cartoon_2d",
    icon: "🍵",
    tagline: "Nét đậm • Dân gian VN",
    description: "Phong cách hoạt hình 2D tối giản Việt Nam: nét viền đen đậm, màu ấm và biểu cảm châm biếm hài hước.",
    positivePrompt: "satirical Vietnamese 2D cartoon visual language, clean minimalist 2D animation aesthetic, bold black ink outlines, warm muted color palette of ochre, terracotta, teal and cream, smooth flat color fills, clean uncluttered composition, consistent stylized graphic linework",
    negativePrompt: "photorealism, 3D CGI, animal head, rabbit ears, animal mascot, glossy plastic, anime hyper-detail, neon cyberpunk, dark horror mood, gradients, text, watermark, blur",
    defaultBackgroundMode: "contextual",
    characterRule: "Apply only bold black linework, warm flat colors, minimal shading, and clean Vietnamese editorial-cartoon rendering. Preserve all character anatomy, identity, wardrobe, action, props, era, and setting from the story; introduce no mascot or sample character.",
    keywords: ["hoạt hình 2d vn", "hoạt hình vn", "hoat hinh 2d vn", "thỏ bảy màu", "tho bay mau", "dân gian", "châm biếm", "nét đậm", "việt nam"],
  },
  meme_hai_huoc_2d: {
    id: "meme_hai_huoc_2d",
    name: "2D Comedy Meme",
    nameVi: "Meme Hài Hước 2D",
    category: "cartoon_2d",
    icon: "😏",
    tagline: "Châm biếm • Hài hước",
    description: "Phong cách meme 2D hài hước: biểu cảm châm biếm sinh động, nét vẽ đồ họa gọn gàng và màu phẳng dễ nhận diện.",
    positivePrompt: "humorous 2D comic-meme rendering language, bold clean graphic outlines, flat warm color fills, simplified graphic shape language, high visual readability, punchy reaction staging, consistent clean cartoon finish",
    negativePrompt: "photorealism, realistic animal anatomy, animal head, panda mascot, 3D CGI, western superhero comic, cyberpunk neon, horror, text, watermark, blur, low resolution",
    defaultBackgroundMode: "contextual",
    characterRule: "Apply only meme-comic linework, flat colors, graphic simplification, and reaction staging. Do not copy a mascot, animal head, stock face, costume, or emotion; identity and reaction must come from the story scene.",
    keywords: ["meme hài hước 2d", "meme hài", "meme 2d", "meme hai huoc 2d", "gấu trúc hài", "panda meme", "gấu trúc bựa", "ảnh chế", "hài hước"],
  },
  ve_tay_don_gian: {
    id: "ve_tay_don_gian",
    name: "Simple Hand-Drawn",
    nameVi: "Vẽ Tay Đơn Giản",
    category: "cartoon_2d",
    icon: "✏️",
    tagline: "Phóng khoáng • Đời sống",
    description: "Minh họa mực tay phóng khoáng cho các tình huống đời sống, nét vẽ tự nhiên và nền thoáng.",
    positivePrompt: "hand-drawn indie editorial illustration medium, loose confident black ink contours with intentional line variation, off-white paper texture, limited two-color accent palette, airy negative space, lightly imperfect human-made linework, consistent sketch vocabulary",
    negativePrompt: "3D CGI, photorealism, glossy anime, polished vector-perfect lines, dense crosshatching, neon glow, volumetric lighting, elaborate colorful scenery, text, watermark, blur",
    defaultBackgroundMode: "white",
    characterRule: "Apply only loose ink-line variation, paper texture, limited accents, and airy editorial composition. Preserve the complete story-defined character identity, clothing, role, action, props, era, and environment.",
    keywords: ["vẽ tay", "vẽ tay đơn giản", "ve tay", "đời sống", "châm biếm", "indie", "anh da đen"],
  },
  tien_hiep_3d: {
    id: "tien_hiep_3d",
    name: "3D Xianxia",
    nameVi: "3D Tiên Hiệp",
    category: "3d_cinematic",
    icon: "⚔️",
    tagline: "Đồ họa 3D • Tu tiên",
    description: "Ngôn ngữ render donghua 3D điện ảnh với vật liệu PBR, ánh sáng thể tích và độ hoàn thiện cao; không tự thêm ngoại hình, cổ trang hay tiên hiệp vào nhân vật.",
    positivePrompt: "premium Chinese 3D donghua rendering language, cinematic stylized 3D animation medium, physically based materials, refined surface detail, controlled subsurface scattering, cinematic volumetric lighting, polished high-end production-quality render",
    negativePrompt: "chibi, childlike proportions, oversized head, tiny limbs, 2D flat cartoon, stick figure, low-poly geometry, cheap mobile-game render, plastic skin, distorted anatomy, extra fingers, inconsistent costume, cluttered effects, oversaturated neon, text, watermark, blur",
    defaultBackgroundMode: "contextual",
    characterRule: "Apply only donghua 3D rendering, materials, surface finish, lighting, and cinematic depth. Name, gender, age, face, eyes, hair, body proportions, clothing, role, action, props, era, and setting come only from the story; introduce no cultivator, robe, temple, weapon, or magic unless narrated.",
    keywords: ["3d tiên hiệp", "tiên hiệp", "tu tiên", "3d trung quốc", "tiên nghịch", "đấu phá", "tien hiep", "xianxia", "donghua", "immortal cultivator", "unreal engine 5"],
  },
};

export const DEFAULT_STYLE_PRESET_ID = STYLE_PRESET_CONFIG.DEFAULT_ID;

const LEGACY_STYLE_ID_ALIASES: Record<string, string> = {
  tho_bay_mau: "hoat_hinh_2d_vn",
  gau_truc_hai: "meme_hai_huoc_2d",
};

const findByPresetId = (normalized: string): CuratedStylePreset | undefined => {
  const resolvedId = _.get(LEGACY_STYLE_ID_ALIASES, normalized, normalized);
  return CURATED_STYLE_PRESETS[resolvedId];
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
        candidates.push({ preset, keywordLength: _.size(keyword) });
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
  characterRule: STYLE_PRESET_CONFIG.EMPTY_STRING,
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
