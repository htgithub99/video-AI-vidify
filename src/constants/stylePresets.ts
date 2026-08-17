import _ from "lodash";

export type StyleCategory = "all" | "cartoon_2d" | "3d_cinematic" | "artistic_retro";

export interface CuratedStylePreset {
  id: string;
  name: string;
  nameVi: string;
  category: StyleCategory;
  icon: string;
  description: string;
  positivePrompt: string;
  negativePrompt: string;
  defaultBackgroundMode: "minimal" | "contextual" | "white";
  characterRule: string;
  keywords: string[];
}

export const STYLE_CATEGORIES: { id: StyleCategory; nameVi: string; nameEn: string }[] = [
  { id: "all", nameVi: "Tất cả", nameEn: "All" },
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
    description: "Người que hoạt hình tối giản, nét viền đen đậm trên nền trắng, má hồng dễ thương",
    positivePrompt: "2D minimalist stick figure illustration, clean uniform bold black outlines on pure solid white background, minimal dot eyes, soft pink circular cheek blush, flat vector without shading or gradients",
    negativePrompt: "photorealistic, realistic human anatomy, 3D render, complex shading, gradients, photorealism, detailed skin, heavy textures, real person, cinematic lighting, complex background, colored realism",
    defaultBackgroundMode: "white",
    characterRule: "simple stick limbs, circular head, elongated oval torso, small circular hands and feet, minimal dot eyes",
    keywords: ["stickman", "stick figure", "người que", "hình que", "nét que", "stick-figure", "stick", "hoạt hình que"],
  },
  vector_2d: {
    id: "vector_2d",
    name: "2D Vector Cartoon",
    nameVi: "Hoạt hình 2D Vector",
    category: "cartoon_2d",
    icon: "🎨",
    description: "Hoạt hình vector 2D phẳng, màu sắc pastel tươi sáng, thiết kế tinh gọn",
    positivePrompt: "2D flat vector cartoon illustration, vibrant pastel colors, clean bold outlines, minimalist design, stylized characters, flat clean shading",
    negativePrompt: "photorealistic, 3D render, realistic human skin, gritty texture, noise, volumetric lighting, dark realism, complex textures",
    defaultBackgroundMode: "contextual",
    characterRule: "stylized 2D cartoon proportions, smooth vector shapes",
    keywords: ["vector", "2d", "cartoon", "hoạt hình 2d", "vector 2d", "flat vector", "phẳng"],
  },
  anime: {
    id: "anime",
    name: "Modern Anime",
    nameVi: "Anime Hiện đại",
    category: "cartoon_2d",
    icon: "🌸",
    description: "Anime Nhật Bản rực rỡ, cel-shading chuẩn studio Kyoto Animation, mắt biểu cảm",
    positivePrompt: "modern anime style, vibrant cel shading, clean hand-drawn keyframe linework, Kyoto Animation aesthetic, expressive anime eyes, studio lighting",
    negativePrompt: "western comic, 3D render, photorealistic, stick figure, low quality, deformed anatomy, muddy colors, bad lineart",
    defaultBackgroundMode: "contextual",
    characterRule: "expressive anime facial features, detailed anime hair, dynamic anime posing",
    keywords: ["anime", "manga", "hoạt hình nhật", "nhật bản", "cel-shading", "wibu"],
  },
  ghibli: {
    id: "ghibli",
    name: "Studio Ghibli",
    nameVi: "Hoạt hình Ghibli",
    category: "cartoon_2d",
    icon: "🍃",
    description: "Phong cách Studio Ghibli hoài niệm, màu sắc ấm áp, bầu trời xanh mây trắng thơ mộng",
    positivePrompt: "Studio Ghibli aesthetic illustration, hand-painted gouache background, nostalgic warm color palette, whimsical atmosphere, Hayao Miyazaki art style, lush scenic nature",
    negativePrompt: "photorealistic, 3D render, harsh neon, stick figure, dark gritty, deformed, modern digital glossy",
    defaultBackgroundMode: "contextual",
    characterRule: "charming hand-drawn Ghibli character design with soft expressive features",
    keywords: ["ghibli", "miyazaki", "totoro", "anime ghibli", "thơ mộng"],
  },
  chibi: {
    id: "chibi",
    name: "Cute Chibi",
    nameVi: "Chibi Dễ thương",
    category: "cartoon_2d",
    icon: "🐣",
    description: "Phong cách Chibi đầu to thân nhỏ siêu đáng yêu, mắt long lanh biểu cảm phong phú",
    positivePrompt: "super cute 2D chibi character illustration, oversized head, tiny body, giant sparkling expressive eyes, adorable playful pose, pastel colorful background",
    negativePrompt: "realistic proportions, scary, horror, photorealistic, adult anatomy, gritty, dark",
    defaultBackgroundMode: "contextual",
    characterRule: "chibi 1:2 body ratio, giant sparkling eyes, cute rounded limbs",
    keywords: ["chibi", "cute", "dễ thương", "đầu to", "đáng yêu"],
  },
  comic: {
    id: "comic",
    name: "Comic Book / Manga",
    nameVi: "Truyện tranh Comic",
    category: "cartoon_2d",
    icon: "💥",
    description: "Nét vẽ truyện tranh siêu anh hùng, nét mực đậm, chấm halftone, góc quay hành động",
    positivePrompt: "comic book illustration style, bold ink outlines, dynamic action composition, halftone dot shading, graphic novel artwork, high contrast ink work",
    negativePrompt: "photorealistic, 3D render, smooth airbrush, blurry, stick figure, low detail, muddy",
    defaultBackgroundMode: "contextual",
    characterRule: "heroic or dramatic comic book proportions, bold expressive cross-hatching",
    keywords: ["comic", "manga", "truyện tranh", "comic book", "graphic novel", "marvel", "dc"],
  },
  webtoon: {
    id: "webtoon",
    name: "Korean Webtoon / Manhwa",
    nameVi: "Webtoon / Manhwa",
    category: "cartoon_2d",
    icon: "📱",
    description: "Nét vẽ Webtoon Hàn Quốc hiện đại, nhân vật trau chuốt, hiệu ứng phát sáng huyền ảo",
    positivePrompt: "modern Korean webtoon manhwa art style, crisp digital linework, glowing gradient lighting, handsome beautiful stylized character, high aesthetic romance manhwa",
    negativePrompt: "western cartoon, rough sketch, 3D render, stick figure, bad anatomy, flat boring lighting",
    defaultBackgroundMode: "contextual",
    characterRule: "stylish K-webtoon proportions, detailed styled hair, radiant expressive eyes",
    keywords: ["webtoon", "manhwa", "korean", "hàn quốc", "truyện tranh hàn"],
  },
  pixar_3d: {
    id: "pixar_3d",
    name: "3D Animation / Pixar",
    nameVi: "3D Hoạt hình Pixar",
    category: "3d_cinematic",
    icon: "🧸",
    description: "Hoạt hình 3D dễ thương phong cách Disney/Pixar, bề mặt mịn, ánh sáng mềm mại",
    positivePrompt: "3D cute animated cartoon render, smooth clay-like shading, Pixar aesthetic, soft ambient studio lighting, vibrant saturated colors, playful friendly expression",
    negativePrompt: "photorealistic, 2D flat, stick figure, rough sketch, gritty realism, grotesque, horror, bad anatomy",
    defaultBackgroundMode: "contextual",
    characterRule: "cute 3D cartoon proportions, big expressive eyes, smooth stylized surfaces",
    keywords: ["3d", "pixar", "chibi 3d", "3d render", "hoạt hình 3d", "clay", "cute 3d", "disney"],
  },
  hyper_3d: {
    id: "hyper_3d",
    name: "Unreal Engine 5 CGI",
    nameVi: "3D CGI Siêu thực",
    category: "3d_cinematic",
    icon: "🚀",
    description: "Đồ họa CGI 3D siêu chân thực Unreal Engine 5, ray-tracing, chi tiết vật liệu đỉnh cao",
    positivePrompt: "Unreal Engine 5 3D render, hyper-detailed CGI masterpiece, ray-traced global illumination, octane render quality, subsurface scattering skin, realistic depth of field",
    negativePrompt: "2D flat, cartoon, drawing, sketch, stick figure, low poly, noisy, oversaturated cheap render",
    defaultBackgroundMode: "contextual",
    characterRule: "high-fidelity 3D human or character model with micro-detail textures",
    keywords: ["unreal engine", "ue5", "cgi", "3d siêu thực", "octane", "ray tracing"],
  },
  cinematic: {
    id: "cinematic",
    name: "Cinematic Film 35mm",
    nameVi: "Điện ảnh Tả thực 35mm",
    category: "3d_cinematic",
    icon: "🎬",
    description: "Phim điện ảnh tả thực chân thực, góc quay 35mm, ánh sáng tự nhiên, chiều sâu điện ảnh",
    positivePrompt: "cinematic film still, photorealistic, shot on 35mm lens, natural filmic lighting, rich atmospheric depth of field, dramatic cinematic composition, high realism",
    negativePrompt: "cartoon, anime, 2D vector, stick figure, illustration, drawing, painting, 3D render, low quality, oversaturated",
    defaultBackgroundMode: "contextual",
    characterRule: "realistic human anatomy, authentic facial expressions, natural clothing textures",
    keywords: ["cinematic", "realistic", "tả thực", "điện ảnh", "photorealistic", "người thật", "film"],
  },
  claymation: {
    id: "claymation",
    name: "Claymation / Stop-Motion",
    nameVi: "Đất nặn Stop-Motion",
    category: "3d_cinematic",
    icon: "🧱",
    description: "Phong cách đất nặn hoạt hình stop-motion thủ công Aardman, vân tay đất sét độc đáo",
    positivePrompt: "claymation stop-motion animation style, tactile plasticine clay texture with subtle fingerprint marks, studio tabletop lighting, handcrafted miniature set, Aardman aesthetic",
    negativePrompt: "2D flat, digital smooth render, photorealistic human, sharp vector, stick figure",
    defaultBackgroundMode: "contextual",
    characterRule: "sculpted clay character with tactile handmade clay details and playful proportions",
    keywords: ["claymation", "clay", "đất nặn", "stop motion", "aardman"],
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    nameVi: "Cyberpunk / Neon Tối",
    category: "3d_cinematic",
    icon: "🌃",
    description: "Thành phố tương lai neon phát sáng, đêm tối huyền ảo với ánh sáng xanh tím rực rỡ",
    positivePrompt: "cyberpunk neon aesthetic, glowing neon lights, futuristic dark atmosphere, high contrast moody shadows, volumetric fog, vibrant cyan and magenta accents",
    negativePrompt: "stick figure, bright pastel cartoon, watercolor, daytime sunlight, vintage, rustic",
    defaultBackgroundMode: "contextual",
    characterRule: "futuristic tech-wear styling, neon reflections on clothing and skin",
    keywords: ["cyberpunk", "neon", "futuristic", "tương lai", "neon dark"],
  },
  watercolor: {
    id: "watercolor",
    name: "Artistic Watercolor",
    nameVi: "Màu nước Nghệ thuật",
    category: "artistic_retro",
    icon: "🖌️",
    description: "Tranh vẽ màu nước loang mềm mại, nét mực vẽ tay nghệ thuật trên giấy có vân",
    positivePrompt: "artistic watercolor wash illustration, soft paint bleed, subtle ink linework on textured paper, delicate pastel palette, fine art aesthetic",
    negativePrompt: "photorealistic, 3D render, vector, harsh digital lines, stick figure, neon, high contrast harsh shadows",
    defaultBackgroundMode: "contextual",
    characterRule: "delicate watercolor figure with soft color washes and expressive hand-painted outlines",
    keywords: ["watercolor", "màu nước", "tranh vẽ", "paint", "artistic", "thủy mặc"],
  },
  retro_90s: {
    id: "retro_90s",
    name: "90s Retro Anime / Lo-Fi",
    nameVi: "Anime Hoài niệm 90s (Lo-Fi)",
    category: "artistic_retro",
    icon: "📼",
    description: "Phong cách Anime cổ điển thập niên 90, hạt phim VHS hoài niệm, màu sắc ấm áp",
    positivePrompt: "90s vintage retro anime aesthetic, VHS tape grain texture, soft nostalgic pastel lighting, Sailor Moon aesthetic, classic hand-painted cel animation feel",
    negativePrompt: "modern sharp 3D, CGI, photorealistic, vector, stick figure, ultra-crisp modern digital",
    defaultBackgroundMode: "contextual",
    characterRule: "classic 1990s anime character silhouette with soft nostalgic features",
    keywords: ["90s", "retro anime", "vintage", "vhs", "lo-fi", "hoài niệm"],
  },
  paper_cutout: {
    id: "paper_cutout",
    name: "3D Paper Cutout",
    nameVi: "Cắt giấy Nghệ thuật 3D",
    category: "artistic_retro",
    icon: "📄",
    description: "Nghệ thuật cắt dán giấy xếp lớp 3D, đổ bóng phân tầng tinh tế và màu sắc ấm áp",
    positivePrompt: "3D layered paper craft illustration, intricate paper cutout art, realistic drop shadows between paper layers, textured craft paper, origami aesthetic",
    negativePrompt: "photorealistic human, smooth gradient 3D, anime lineart, stick figure, blurry",
    defaultBackgroundMode: "contextual",
    characterRule: "layered paper cutout character with distinct geometric silhouette and shadow depth",
    keywords: ["paper", "cắt giấy", "origami", "paper cutout", "xếp giấy"],
  },
  pixel_art: {
    id: "pixel_art",
    name: "Retro Pixel Art",
    nameVi: "Pixel Art Cổ điển",
    category: "artistic_retro",
    icon: "👾",
    description: "Đồ họa 8-bit/16-bit pixel hoài cổ phong cách game retro thập niên 90",
    positivePrompt: "16-bit retro pixel art, detailed vintage sprite design, limited color palette, clean grid pixels, nostalgic 90s arcade game look",
    negativePrompt: "photorealistic, smooth vector, 3D render, high resolution curves, blur, painting",
    defaultBackgroundMode: "contextual",
    characterRule: "pixelated sprite character with distinct retro gaming proportions",
    keywords: ["pixel", "pixel art", "8-bit", "16-bit", "retro", "game arcade"],
  },
};

export const DEFAULT_STYLE_PRESET_ID = "stickman";

export const resolveStylePreset = (input?: string): CuratedStylePreset => {
  if (!input || !_.isString(input)) {
    return CURATED_STYLE_PRESETS[DEFAULT_STYLE_PRESET_ID];
  }

  const normalized = _.toLower(_.trim(input));

  if (CURATED_STYLE_PRESETS[normalized]) {
    return CURATED_STYLE_PRESETS[normalized];
  }

  const matched = _.find(CURATED_STYLE_PRESETS, (preset) =>
    _.some(preset.keywords, (keyword) => _.includes(normalized, _.toLower(keyword)))
  );

  return matched || CURATED_STYLE_PRESETS[DEFAULT_STYLE_PRESET_ID];
};
