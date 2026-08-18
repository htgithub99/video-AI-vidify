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
    description: "Người que hoạt hình 2D đen trắng tối giản, nét mực đen rõ ràng trên nền trắng tinh khiết",
    positivePrompt: "2D minimalist black and white stick figure animation style, clean uniform bold black ink outlines, pure solid white background, expressive cartoon eyes with subtle eyelids, simple stick limbs, clean line art, educational infographic aesthetic, high contrast monochrome vector illustration",
    negativePrompt: "color, colored, rainbow, red, blue, green, yellow, gradient, 3D render, photorealistic, realistic human skin, textures, complex shading, background scenery, noise, blurry",
    defaultBackgroundMode: "white",
    characterRule: "circular stickman head, expressive minimal eyes with eyelids, simple stick limbs and fingers, elongated torso, pure monochrome black ink",
    keywords: ["người que", "stickman", "nguoi que", "stick figure", "đen trắng", "hình que"],
  },
  gai_xinh_2d: {
    id: "gai_xinh_2d",
    name: "Pretty Girl 2D",
    nameVi: "Gái Xinh 2D",
    category: "cartoon_2d",
    icon: "✨",
    tagline: "Thời thượng • Sắc nét",
    description: "Truyện tranh Manhwa hiện đại, nét vẽ sắc nét, mắt hạnh nhân quyến rũ, thời trang sành điệu",
    positivePrompt: "modern Korean manhwa webtoon digital art style, crisp sharp delicate ink linework, aesthetic webtoon character design, sharp expressive almond eyes, soft smooth 2D cel shading, vibrant clean color palette, high aesthetic K-romance illustration, polished digital comic art",
    negativePrompt: "photorealistic, 3D CGI render, western comic, stick figure, rough sketch, ugly face, distorted eyes, bad hands, muddy colors, heavy noise",
    defaultBackgroundMode: "contextual",
    characterRule: "delicate aesthetic facial features, expressive eyes, voluminous stylized hair, clean thin line art, stylish manhwa anatomy and proportions",
    keywords: ["gái xinh", "gái xinh 2d", "hot girl", "nữ thần", "gai xinh", "webtoon", "manhwa"],
  },
  hoat_hinh_mat_hip: {
    id: "hoat_hinh_mat_hip",
    name: "Funny Slit Eyes",
    nameVi: "Hoạt Hình Mắt Híp",
    category: "cartoon_2d",
    icon: "😆",
    tagline: "Đầu to • Hài hước",
    description: "Hoạt hình ngắn vui nhộn, đầu to nét vẽ hài hước, đôi mắt nhắm tịt hình hạt đỗ, biểu cảm dí dỏm",
    positivePrompt: "2D funny caricature cartoon animation style, oversized round chibi head with tiny body proportions, distinctive horizontal oval closed bean eyes with arched brows, exaggerated expressive comical mouth, bold thick uniform black cartoon line art, vibrant flat colors, playful comedy explainer animation",
    negativePrompt: "photorealistic, realistic human proportions, 3D CGI render, dark gritty, anime realistic eyes, complex gradients, photorealism, blurry",
    defaultBackgroundMode: "minimal",
    characterRule: "oversized chibi round head, 1:2.5 body ratio, horizontal bean-shaped closed eyes, exaggerated comical expressions, bold clean black outlines",
    keywords: ["mắt híp", "hoạt hình mắt híp", "hài bựa", "nhóc tóc đỏ", "én", "vui nhộn", "mat hip"],
  },
  tho_bay_mau: {
    id: "tho_bay_mau",
    name: "Tho Bay Mau Style",
    nameVi: "Thỏ Bảy Màu",
    category: "cartoon_2d",
    icon: "🍵",
    tagline: "Cổ tích • Dân gian VN",
    description: "Hoạt hình dân gian Việt Nam, nhân vật thân viên thuốc tối giản, nét vẽ châm biếm hài hước",
    positivePrompt: "Vietnamese satirical folk cartoon animation style, Tho Bay Mau inspired 2D aesthetic, capsule pill-shaped simplified character torso, round head with expressive cartoon features, bold uniform black ink outlines, warm muted traditional colors, clean minimalist 2D animation art",
    negativePrompt: "photorealistic, modern western 3D, CGI render, glossy plastic, hyper-detailed skin, anime shonen, dark neon, blurry",
    defaultBackgroundMode: "contextual",
    characterRule: "pill-shaped capsule torso, round head with simple dot eyes and minimal limbs, bold cartoon outlines, satirical folk cartoon proportions",
    keywords: ["thỏ bảy màu", "tho bay mau", "dân gian", "cổ tích", "bá hộ", "trạng quỳnh", "việt nam"],
  },
  gau_truc_hai: {
    id: "gau_truc_hai",
    name: "Funny Panda Meme",
    nameVi: "Gấu Trúc Hài",
    category: "cartoon_2d",
    icon: "🐼",
    tagline: "Meme bựa • Cổ trang",
    description: "Meme đầu gấu trúc biểu cảm chế hài hước bựa, kết hợp trang phục cổ trang kiếm hiệp",
    positivePrompt: "viral Chinese Panda head meme animation style, round white panda head with black ears combined with iconic hilarious human meme facial expressions, expressive humorous face, traditional ancient Chinese martial arts aesthetic, subtle golden outer aura glow, funny viral meme animation style",
    negativePrompt: "serious realism, photorealistic human face, western comic, 3D CGI render, high-tech neon, deformed panda ears, blurry, low resolution",
    defaultBackgroundMode: "contextual",
    characterRule: "round white panda head with distinct black ears, iconic meme expressive face, subtle golden outline glow",
    keywords: ["gấu trúc", "gấu trúc hài", "panda meme", "gấu trúc bựa", "cổ trang", "gau truc", "ảnh chế"],
  },
  ve_tay_don_gian: {
    id: "ve_tay_don_gian",
    name: "Simple Hand-Drawn",
    nameVi: "Vẽ Tay Đơn Giản",
    category: "cartoon_2d",
    icon: "✏️",
    tagline: "Phóng khoáng • Đời sống",
    description: "Nét vẽ mực tay phóng khoáng, châm biếm đời sống thường ngày, phong cách hoạt họa tự do",
    positivePrompt: "expressive hand-drawn indie comic animation style, casual loose black ink sketch outlines, witty everyday life comic aesthetic, minimalist clean background with soft cast shadow, stylized cartoon ink illustration, relatable indie webcomic look",
    negativePrompt: "3D CGI render, photorealistic, hyper-detailed anime, complex colored gradients, neon glowing, volumetric lighting, colorful background",
    defaultBackgroundMode: "white",
    characterRule: "loose expressive ink sketch style, simple everyday clothing, stylized facial features, relaxed posture, clean line art",
    keywords: ["vẽ tay", "vẽ tay đơn giản", "ve tay", "đời sống", "châm biếm", "indie", "anh da đen"],
  },
  tien_hiep_3d: {
    id: "tien_hiep_3d",
    name: "3D Xianxia",
    nameVi: "3D Tiên Hiệp",
    category: "3d_cinematic",
    icon: "⚔️",
    tagline: "Đồ họa 3D • Tu tiên",
    description: "Phim hoạt hình 3D Tiên Hiệp Trung Quốc (Donghua), đồ họa Unreal Engine 5 điện ảnh",
    positivePrompt: "high-end 3D Chinese Xianxia Donghua animation cinematic frame, stylized Unreal Engine 5 render, cinematic lighting, ethereal atmospheric volumetric glow, refined subsurface scattering skin, exquisite cloth and texture detailing, blockbuster 3D anime movie aesthetic, 8k resolution",
    negativePrompt: "2D flat cartoon, stick figure, low poly, cheap 3D, modern clothes, deformed anatomy, blurry, messy sketch, oversaturated plastic",
    defaultBackgroundMode: "contextual",
    characterRule: "ethereal 3D animated character proportions, stylized charismatic facial features, finely rendered hair strands, detailed flowing clothing, cinematic Donghua 3D aesthetic",
    keywords: ["3d tiên hiệp", "tiên hiệp", "tu tiên", "3d trung quốc", "tiên nghịch", "đấu phá", "tien hiep"],
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
