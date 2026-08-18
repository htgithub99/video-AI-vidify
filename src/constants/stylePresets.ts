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
  { id: "all", nameVi: "Tất cả (16)", nameEn: "All (16)" },
  { id: "cartoon_2d", nameVi: "2D & Hoạt hình", nameEn: "2D & Anime" },
  { id: "3d_cinematic", nameVi: "3D & Điện ảnh", nameEn: "3D & Cinema" },
  { id: "artistic_retro", nameVi: "Nghệ thuật & Retro", nameEn: "Art & Retro" },
];

export const CURATED_STYLE_PRESETS: Record<string, CuratedStylePreset> = {
  stickman: {
    id: "stickman",
    name: "Stickman 2D",
    nameVi: "Người que 2D",
    category: "cartoon_2d",
    icon: "🏃",
    tagline: "Tối giản • Nền trắng",
    description: "Người que hoạt hình tối giản, nét viền đen đậm trên nền trắng tinh khiết, má hồng dễ thương",
    positivePrompt: "2D minimalist stick figure animation style, ultra clean uniform bold black ink outlines, pure solid white background, cute minimal dot eyes, soft circular pink cheek blush, flat vector art, high clarity, educational infographic aesthetic, clean vector illustration",
    negativePrompt: "photorealistic, realistic human anatomy, 3D render, complex shading, gradients, photorealism, detailed skin, heavy textures, real person, cinematic lighting, complex background, colored realism, noise, sketch, messy, colored background",
    defaultBackgroundMode: "white",
    characterRule: "simple stick limbs, circular head, elongated oval torso, small circular hands and feet, minimal dot eyes, soft circular pink blush",
    keywords: ["stickman", "stick figure", "người que", "hình que", "nét que", "stick-figure", "stick", "hoạt hình que"],
  },
  vector_2d: {
    id: "vector_2d",
    name: "2D Vector",
    nameVi: "Hoạt hình Vector",
    category: "cartoon_2d",
    icon: "🎨",
    tagline: "Phẳng • Màu pastel",
    description: "Hoạt hình vector 2D phẳng, phong cách Kurzgesagt/Explainer, màu sắc hài hòa tươi sáng",
    positivePrompt: "premium 2D flat vector art style, Kurzgesagt inspired motion graphics aesthetic, clean bold geometric outlines, vibrant harmonious color palette, flat soft shading, modern corporate explainer video visual, crisp high quality digital vector illustration",
    negativePrompt: "photorealistic, 3D render, realistic human skin, gritty texture, noise, volumetric lighting, dark realism, complex textures, blurry, photographic, sketches",
    defaultBackgroundMode: "contextual",
    characterRule: "stylized 2D cartoon proportions, smooth vector shapes, clean geometric features",
    keywords: ["vector_2d", "vector 2d", "flat vector", "kurzgesagt", "infographic vector"],
  },
  anime: {
    id: "anime",
    name: "Modern Anime",
    nameVi: "Anime Hiện đại",
    category: "cartoon_2d",
    icon: "🌸",
    tagline: "Rực rỡ • Shonen",
    description: "Anime Nhật Bản rực rỡ, cel-shading chuẩn studio Kyoto Animation & Ufotable, mắt biểu cảm",
    positivePrompt: "modern Japanese anime art style, crisp cel shading, sharp keyframe line art, Kyoto Animation and Ufotable aesthetic, expressive detailed anime eyes, vibrant studio lighting, dynamic cinematic anime frame, high production anime movie still",
    negativePrompt: "western comic, 3D CGI render, photorealistic, stick figure, low quality, deformed anatomy, muddy colors, bad lineart, messy sketch, blurry",
    defaultBackgroundMode: "contextual",
    characterRule: "expressive anime facial features, detailed anime hair, dynamic anime posing, crisp anime outlines",
    keywords: ["anime", "manga", "hoạt hình nhật", "nhật bản", "cel-shading", "wibu", "shonen"],
  },
  ghibli: {
    id: "ghibli",
    name: "Studio Ghibli",
    nameVi: "Anime Ghibli",
    category: "cartoon_2d",
    icon: "🍃",
    tagline: "Thơ mộng • Hoài niệm",
    description: "Phong cách Studio Ghibli hoài niệm, màu sắc ấm áp, bầu trời xanh mây trắng thơ mộng",
    positivePrompt: "Studio Ghibli cinematic animation style, hand-painted gouache background, nostalgic warm color palette, soft natural sunlight, Hayao Miyazaki aesthetic, lush detailed landscape, whimsical storytelling atmosphere, painted clouds and nature",
    negativePrompt: "3D CGI render, photorealistic, harsh neon, stick figure, dark gritty, deformed, modern digital glossy, harsh shadows, sharp plastic",
    defaultBackgroundMode: "contextual",
    characterRule: "charming hand-drawn Ghibli character design with soft expressive features and warm organic textures",
    keywords: ["ghibli", "miyazaki", "totoro", "anime ghibli", "thơ mộng", "hoài niệm"],
  },
  chibi: {
    id: "chibi",
    name: "Cute Chibi",
    nameVi: "Chibi Dễ thương",
    category: "cartoon_2d",
    icon: "🐣",
    tagline: "Đầu to • Siêu đáng yêu",
    description: "Phong cách Chibi đầu to thân nhỏ siêu đáng yêu, mắt long lanh biểu cảm phong phú",
    positivePrompt: "kawaii 2D chibi illustration style, 2-head-tall proportions, oversized expressive sparkling eyes, tiny cute hands and feet, soft pastel candy colors, adorable cheerful aesthetic, clean vector linework, heartwarming playful mood",
    negativePrompt: "realistic human proportions, scary, horror, photorealistic, adult anatomy, gritty, dark, mature, ugly, realistic skin",
    defaultBackgroundMode: "contextual",
    characterRule: "chibi 1:2 body ratio, giant sparkling eyes, cute rounded limbs, playful animated expressions",
    keywords: ["chibi", "kawaii", "chibi 2d", "cute chibi", "đầu to"],
  },
  comic: {
    id: "comic",
    name: "Comic Book",
    nameVi: "Truyện tranh Comic",
    category: "cartoon_2d",
    icon: "💥",
    tagline: "Nét mực • Siêu anh hùng",
    description: "Nét vẽ truyện tranh siêu anh hùng Mỹ, nét mực đậm, chấm halftone, góc quay hành động kịch tính",
    positivePrompt: "American comic book art style, bold heavy ink outlines, halftone dot texture, dramatic dynamic action lighting, vibrant pop colors, graphic novel artwork, high contrast comic panel composition, cinematic superhero comic frame",
    negativePrompt: "photorealistic, 3D smooth render, soft airbrush, blurry, stick figure, low detail, muddy, pastel, flat boring",
    defaultBackgroundMode: "contextual",
    characterRule: "heroic or dramatic comic book proportions, bold expressive cross-hatching, sharp ink shadows",
    keywords: ["comic", "comic book", "graphic novel", "marvel", "dc", "superhero", "truyện tranh comic"],
  },
  webtoon: {
    id: "webtoon",
    name: "Webtoon Manhwa",
    nameVi: "Webtoon Hàn Quốc",
    category: "cartoon_2d",
    icon: "📱",
    tagline: "Hiện đại • Tỏa sáng",
    description: "Nét vẽ Webtoon Hàn Quốc hiện đại, nhân vật trau chuốt, hiệu ứng phát sáng huyền ảo",
    positivePrompt: "modern Korean webtoon manhwa digital art style, crisp sharp digital linework, glossy hair highlights, radiant expressive eyes, glowing magical gradient lighting, high aesthetic K-romance manhwa, clean modern digital coloring",
    negativePrompt: "western cartoon, rough sketch, 3D CGI render, stick figure, bad anatomy, flat boring lighting, low detail, muddy",
    defaultBackgroundMode: "contextual",
    characterRule: "stylish K-webtoon proportions, detailed styled hair, radiant expressive eyes, handsome/beautiful aesthetic",
    keywords: ["webtoon", "manhwa", "korean", "hàn quốc", "truyện tranh hàn", "k-drama"],
  },
  pixar_3d: {
    id: "pixar_3d",
    name: "3D Pixar",
    nameVi: "3D Hoạt hình Pixar",
    category: "3d_cinematic",
    icon: "🧸",
    tagline: "Disney 3D • Mịn màng",
    description: "Hoạt hình 3D dễ thương phong cách Disney/Pixar, bề mặt mịn, ánh sáng mềm mại",
    positivePrompt: "Pixar and Disney 3D animation style, adorable stylized 3D character, subsurface scattering skin, soft studio rim lighting, vibrant saturated colors, smooth surfaces, charming cinematic 3D render, 8k render quality, friendly animated expression",
    negativePrompt: "photorealistic, 2D flat, stick figure, rough sketch, gritty realism, grotesque, horror, bad anatomy, clay texture, sharp noise, dull lighting",
    defaultBackgroundMode: "contextual",
    characterRule: "cute 3D cartoon proportions, big expressive eyes, smooth stylized surfaces, charming friendly poses",
    keywords: ["pixar_3d", "pixar", "disney 3d", "3d pixar", "disney animation"],
  },
  hyper_3d: {
    id: "hyper_3d",
    name: "Unreal Engine 5",
    nameVi: "3D CGI Siêu thực",
    category: "3d_cinematic",
    icon: "🚀",
    tagline: "Ray-Tracing • Bom tấn",
    description: "Đồ họa CGI 3D siêu chân thực Unreal Engine 5, ray-tracing, chi tiết vật liệu đỉnh cao",
    positivePrompt: "hyper-realistic 3D CGI render, Unreal Engine 5 cinematic, Octane Render, ray-traced global illumination, intricate micro-textures, photorealistic volumetric lighting, blockbuster movie CGI quality, depth of field, photoreal 8k masterpiece",
    negativePrompt: "2D flat, cartoon, drawing, sketch, stick figure, low poly, noisy, oversaturated cheap render, blurry, amateur 3D",
    defaultBackgroundMode: "contextual",
    characterRule: "high-fidelity 3D human or character model with micro-detail textures and realistic subsurface skin",
    keywords: ["hyper_3d", "unreal engine", "ue5", "octane", "ray tracing", "3d cgi", "3d siêu thực"],
  },
  cinematic: {
    id: "cinematic",
    name: "Cinematic 35mm",
    nameVi: "Điện ảnh 35mm",
    category: "3d_cinematic",
    icon: "🎬",
    tagline: "Tả thực • Phim trường",
    description: "Phim điện ảnh tả thực chân thực, góc quay 35mm, ánh sáng tự nhiên, chiều sâu điện ảnh",
    positivePrompt: "cinematic 35mm film still, shot on Panavision anamorphic lens, natural cinematic film lighting, shallow depth of field, subtle organic film grain, authentic human texture, color graded Hollywood movie frame, high dynamic range, master photography",
    negativePrompt: "cartoon, anime, 2D vector, stick figure, illustration, drawing, painting, 3D render, low quality, oversaturated, plastic skin, fake lighting",
    defaultBackgroundMode: "contextual",
    characterRule: "realistic human anatomy, authentic facial expressions, natural clothing textures, cinematic wardrobe",
    keywords: ["cinematic", "photorealistic", "người thật", "35mm", "panavision", "hollywood", "tả thực"],
  },
  claymation: {
    id: "claymation",
    name: "Claymation",
    nameVi: "Đất nặn Thủ công",
    category: "3d_cinematic",
    icon: "🧱",
    tagline: "Stop-Motion • Aardman",
    description: "Phong cách đất nặn hoạt hình stop-motion thủ công Aardman, vân tay đất sét độc đáo",
    positivePrompt: "authentic claymation stop-motion animation style, tactile plasticine clay material with subtle hand-molded fingerprint textures, miniature studio tabletop lighting, Aardman Studios aesthetic, handcrafted clay model, charming stop-motion visual",
    negativePrompt: "2D flat, digital smooth render, photorealistic human, sharp vector, stick figure, CGI glossy, smooth plastic",
    defaultBackgroundMode: "contextual",
    characterRule: "sculpted clay character with tactile handmade clay details, playful proportions and subtle clay creases",
    keywords: ["claymation", "đất nặn", "stop motion", "aardman", "plasticine"],
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    nameVi: "Cyberpunk Neon",
    category: "3d_cinematic",
    icon: "🌃",
    tagline: "Tương lai • Phát sáng",
    description: "Thành phố tương lai neon phát sáng, đêm tối huyền ảo với ánh sáng xanh tím rực rỡ",
    positivePrompt: "cyberpunk futuristic aesthetic, vibrant glowing neon lights, rain-slicked reflective surfaces, dark moody sci-fi atmosphere, volumetric neon fog, high contrast cyan and magenta lighting, cinematic blade runner style, high tech night scene",
    negativePrompt: "stick figure, bright pastel cartoon, watercolor, daytime sunlight, vintage, rustic, dull lighting, low contrast",
    defaultBackgroundMode: "contextual",
    characterRule: "futuristic tech-wear styling, neon reflections on clothing and skin, cybernetic accents",
    keywords: ["cyberpunk", "neon dark", "sci-fi", "blade runner", "thành phố neon"],
  },
  watercolor: {
    id: "watercolor",
    name: "Watercolor",
    nameVi: "Màu nước Nghệ thuật",
    category: "artistic_retro",
    icon: "🖌️",
    tagline: "Loang nước • Thơ mộng",
    description: "Tranh vẽ màu nước loang mềm mại, nét mực vẽ tay nghệ thuật trên giấy có vân",
    positivePrompt: "artistic watercolor painting style, soft translucent color washes, gentle water bloom bleed, delicate ink line art on textured cold-press watercolor paper, refined fine art illustration, poetic emotional mood",
    negativePrompt: "photorealistic, 3D CGI render, vector, harsh digital lines, stick figure, neon, high contrast harsh shadows, oversaturated, glossy",
    defaultBackgroundMode: "contextual",
    characterRule: "delicate watercolor figure with soft color washes and expressive hand-painted outlines",
    keywords: ["watercolor", "màu nước", "thủy mặc", "loang nước", "tranh màu nước"],
  },
  retro_90s: {
    id: "retro_90s",
    name: "Retro 90s",
    nameVi: "Anime Cổ điển 90s",
    category: "artistic_retro",
    icon: "📼",
    tagline: "VHS Lo-Fi • Hoài cổ",
    description: "Phong cách Anime cổ điển thập niên 90, hạt phim VHS hoài niệm, màu sắc ấm áp",
    positivePrompt: "90s vintage anime cel animation style, nostalgic VHS tape scanline grain, soft retro color palette, Sailor Moon and Cowboy Bebop aesthetic, classic hand-painted anime look, retro 1990s TV broadcast atmosphere",
    negativePrompt: "modern sharp 3D, CGI, photorealistic, vector, stick figure, ultra-crisp modern digital glossy, clean vector",
    defaultBackgroundMode: "contextual",
    characterRule: "classic 1990s anime character silhouette with soft nostalgic features and retro styling",
    keywords: ["retro_90s", "retro anime", "vintage anime", "vhs", "lo-fi", "anime 90s", "anime cổ điển"],
  },
  paper_cutout: {
    id: "paper_cutout",
    name: "Paper Craft",
    nameVi: "Cắt giấy Nghệ thuật",
    category: "artistic_retro",
    icon: "📄",
    tagline: "3D Layer • Tinh xảo",
    description: "Nghệ thuật cắt dán giấy xếp lớp 3D, đổ bóng phân tầng tinh tế và màu sắc ấm áp",
    positivePrompt: "3D layered paper craft illustration, intricate dimensional paper cutout art, realistic soft drop shadows between stacked textured paper layers, delicate craft origami aesthetic, warm ambient lighting, tactile textured paper art",
    negativePrompt: "photorealistic human, smooth gradient 3D render, anime lineart, stick figure, blurry, flat 2D, noisy",
    defaultBackgroundMode: "contextual",
    characterRule: "layered paper cutout character with distinct geometric silhouette and shadow depth",
    keywords: ["paper_cutout", "paper craft", "paper cutout", "cắt giấy", "origami", "xếp giấy"],
  },
  pixel_art: {
    id: "pixel_art",
    name: "Pixel Art",
    nameVi: "Pixel Art 16-Bit",
    category: "artistic_retro",
    icon: "👾",
    tagline: "Arcade • Game retro",
    description: "Đồ họa 8-bit/16-bit pixel hoài cổ phong cách game retro thập niên 90",
    positivePrompt: "16-bit retro pixel art aesthetic, detailed SNES and arcade sprite graphics, curated nostalgic color palette, crisp pixel grid, classic 90s video game cutscene art, pixel-perfect composition",
    negativePrompt: "smooth curves, high resolution vector, 3D render, photorealistic, blur, anti-aliased smudge, modern drawing, photographic",
    defaultBackgroundMode: "contextual",
    characterRule: "pixelated sprite character with distinct retro gaming proportions and clean pixel silhouette",
    keywords: ["pixel_art", "pixel", "pixel art", "8-bit", "16-bit", "arcade sprite", "pixel game"],
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
