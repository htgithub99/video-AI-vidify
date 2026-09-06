import _ from "lodash";
import { VideoGenre } from "./enums";

export type StyleCategory = "all" | "cartoon_2d" | "3d_cinematic" | "documentary_editorial" | "infographic_concept" | "artistic_retro";

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
  CINEMATIC_PHOTOREAL_ID: "cinematic_photoreal",
  KEYWORD_LENGTH_KEY: "keywordLength",
  WORD_BOUNDARY_PREFIX: "\\b",
  WORD_BOUNDARY_SUFFIX: "\\b",
  REGEX_FLAG_I: "i",
  EMPTY_STRING: "",
} as const;

export const STYLE_IDENTITY_BOUNDARY =
  "Style applies only to rendering, linework, shape language, palette, materials, and lighting. Character name, gender, age, face, hair, body, wardrobe, role, and setting must come only from the story character card and current scene.";

export const STYLE_CATEGORIES: StyleCategoryItem[] = [
  { id: "all", nameVi: "Tất cả", nameEn: "All" },
  { id: "cartoon_2d", nameVi: "2D & Minh họa", nameEn: "2D & Illustration" },
  { id: "3d_cinematic", nameVi: "3D & Phim ảnh", nameEn: "3D & Cinematic" },
  { id: "documentary_editorial", nameVi: "Ảnh thật & Tư liệu", nameEn: "Real & Documentary" },
  { id: "infographic_concept", nameVi: "Đồ họa & Giải thích", nameEn: "Graphics & Explainers" },
  { id: "artistic_retro", nameVi: "Hội họa & Kỳ ảo", nameEn: "Painterly & Fantasy" },
];

export const CURATED_STYLE_PRESETS: Record<string, CuratedStylePreset> = {
  stickman: {
    id: "stickman",
    name: "Stickman",
    nameVi: "Người Que Tối Giản",
    category: "cartoon_2d",
    icon: "🏃",
    tagline: "Tối giản • Nền trắng",
    description: "Minh họa sơ đồ người que 2D đơn sắc, nét đen đồng nhất trên nền trắng; chỉ quy định cách thể hiện, không cung cấp ngoại hình nhân vật mẫu.",
    positivePrompt:
      "minimalist 2D black-ink stick-figure illustration medium, high-contrast monochrome vector linework, uniform black stroke weight, sparse symbolic detail, pure white background, one clearly readable action per frame, clean educational explainer composition",
    negativePrompt:
      "any color, gradients, gray wash, 3D render, photorealism, realistic skin, painterly texture, detailed scenery, drop shadows, complex shading, text, watermark, blur, noise",
    defaultBackgroundMode: "white",
    characterRule:
      "Apply only the monochrome stick-figure abstraction and uniform line treatment. Derive every identity cue, distinguishing feature, action, prop, and setting from the story character card and current scene; do not copy a sample character design.",
    keywords: ["người que", "stickman", "nguoi que", "stick figure", "đen trắng", "hình que"],
  },
  gai_xinh_2d: {
    id: "gai_xinh_2d",
    name: "Modern Webtoon",
    nameVi: "Webtoon Hiện Đại",
    category: "cartoon_2d",
    icon: "✨",
    tagline: "Thời thượng • Sắc nét",
    description: "Ngôn ngữ webtoon 2D hiện đại với nét mực tinh gọn, cel shading sạch và bảng màu biên tập; không mang ngoại hình nhân vật mẫu vào truyện.",
    positivePrompt:
      "polished Korean webtoon rendering language, 2D digital comic medium, clean tapered ink linework, controlled soft cel shading, restrained pastel-and-jewel-tone palette, crisp color separation, editorial lighting, polished consistent panel rendering",
    negativePrompt:
      "photorealism, 3D CGI, western superhero comic, accidental chibi proportions, rough sketch, mismatched eyes, malformed hands, muddy palette, heavy grain, text, watermark",
    defaultBackgroundMode: "contextual",
    characterRule:
      "Apply only webtoon linework, cel shading, palette, and editorial lighting. Character name, gender, age, face, eyes, hair, body, clothing, role, action, and setting must remain exactly story-defined.",
    keywords: ["gái xinh", "gái xinh 2d", "hot girl", "nữ thần", "gai xinh", "webtoon", "manhwa"],
  },
  hoat_hinh_mat_hip: {
    id: "hoat_hinh_mat_hip",
    name: "Bold Comedy Cartoon",
    nameVi: "Hoạt Hình Hài Nét Đậm",
    category: "cartoon_2d",
    icon: "😆",
    tagline: "Đầu to • Hài hước",
    description: "Hoạt hình hài 2D với nét đậm, hình khối đồ họa mềm và màu phẳng tươi sáng; ngoại hình cụ thể vẫn lấy từ nhân vật trong truyện.",
    positivePrompt:
      "playful 2D comedy-cartoon rendering language, thick uniform black outlines, simple rounded graphic shape language, bright flat color fills, minimal shading, lively visual timing, clean readable explainer-animation composition",
    negativePrompt:
      "photorealism, realistic anatomy, 3D CGI, anime detailed eyes, dark gritty mood, thin sketchy lines, gradients, dramatic rendering, busy background, text, watermark, blur",
    defaultBackgroundMode: "minimal",
    characterRule:
      "Apply only the bold outline, rounded graphic language, flat colors, and comedy-cartoon rendering. Do not impose a preset head, eye, mouth, body, hairstyle, costume, or expression; all character facts and reactions come from the story.",
    keywords: ["mắt híp", "hoạt hình mắt híp", "hài bựa", "nhóc tóc đỏ", "én", "vui nhộn", "mat hip"],
  },
  hoat_hinh_2d_vn: {
    id: "hoat_hinh_2d_vn",
    name: "Vietnamese 2D Cartoon",
    nameVi: "Hoạt Hình Việt Châm Biếm",
    category: "cartoon_2d",
    icon: "🍵",
    tagline: "Nét đậm • Dân gian VN",
    description: "Phong cách hoạt hình 2D tối giản Việt Nam: nét viền đen đậm, màu ấm và biểu cảm châm biếm hài hước.",
    positivePrompt:
      "satirical Vietnamese 2D cartoon visual language, clean minimalist 2D animation aesthetic, bold black ink outlines, warm muted color palette of ochre, terracotta, teal and cream, smooth flat color fills, clean uncluttered composition, consistent stylized graphic linework",
    negativePrompt:
      "photorealism, 3D CGI, animal head, rabbit ears, animal mascot, glossy plastic, anime hyper-detail, neon cyberpunk, dark horror mood, gradients, text, watermark, blur",
    defaultBackgroundMode: "contextual",
    characterRule:
      "Apply only bold black linework, warm flat colors, minimal shading, and clean Vietnamese editorial-cartoon rendering. Preserve all character anatomy, identity, wardrobe, action, props, era, and setting from the story; introduce no mascot or sample character.",
    keywords: ["hoạt hình 2d vn", "hoạt hình vn", "hoat hinh 2d vn", "thỏ bảy màu", "tho bay mau", "dân gian", "châm biếm", "nét đậm", "việt nam"],
  },
  meme_hai_huoc_2d: {
    id: "meme_hai_huoc_2d",
    name: "Comic Meme",
    nameVi: "Truyện Tranh Meme",
    category: "cartoon_2d",
    icon: "😏",
    tagline: "Châm biếm • Hài hước",
    description: "Phong cách meme 2D hài hước: biểu cảm châm biếm sinh động, nét vẽ đồ họa gọn gàng và màu phẳng dễ nhận diện.",
    positivePrompt:
      "humorous 2D comic-meme rendering language, bold clean graphic outlines, flat warm color fills, simplified graphic shape language, high visual readability, punchy reaction staging, consistent clean cartoon finish",
    negativePrompt:
      "photorealism, realistic animal anatomy, animal head, panda mascot, 3D CGI, western superhero comic, cyberpunk neon, horror, text, watermark, blur, low resolution",
    defaultBackgroundMode: "contextual",
    characterRule:
      "Apply only meme-comic linework, flat colors, graphic simplification, and reaction staging. Do not copy a mascot, animal head, stock face, costume, or emotion; identity and reaction must come from the story scene.",
    keywords: ["meme hài hước 2d", "meme hài", "meme 2d", "meme hai huoc 2d", "gấu trúc hài", "panda meme", "gấu trúc bựa", "ảnh chế", "hài hước"],
  },
  ve_tay_don_gian: {
    id: "ve_tay_don_gian",
    name: "Simple Hand-Drawn",
    nameVi: "Minh Họa Vẽ Tay",
    category: "cartoon_2d",
    icon: "✏️",
    tagline: "Phóng khoáng • Đời sống",
    description: "Minh họa mực tay phóng khoáng cho các tình huống đời sống, nét vẽ tự nhiên và nền thoáng.",
    positivePrompt:
      "hand-drawn indie editorial illustration medium, loose confident black ink contours with intentional line variation, off-white paper texture, limited two-color accent palette, airy negative space, lightly imperfect human-made linework, consistent sketch vocabulary",
    negativePrompt:
      "3D CGI, photorealism, glossy anime, polished vector-perfect lines, dense crosshatching, neon glow, volumetric lighting, elaborate colorful scenery, text, watermark, blur",
    defaultBackgroundMode: "white",
    characterRule:
      "Apply only loose ink-line variation, paper texture, limited accents, and airy editorial composition. Preserve the complete story-defined character identity, clothing, role, action, props, era, and environment.",
    keywords: ["vẽ tay", "vẽ tay đơn giản", "ve tay", "đời sống", "châm biếm", "indie", "anh da đen"],
  },
  cinematic_photoreal: {
    id: "cinematic_photoreal",
    name: "Cinematic Photoreal",
    nameVi: "Điện Ảnh Chân Thực",
    category: "3d_cinematic",
    icon: "🎬",
    tagline: "Phim truyện • Chân thực",
    description: "Khung hình live-action chân thực cho kể chuyện, tiểu sử, tâm lý và tình huống đời sống; không áp diễn viên mẫu lên nhân vật.",
    positivePrompt:
      "cinematic live-action photorealism, natural human skin texture, physically plausible environments, motivated practical lighting, restrained filmic contrast, subtle atmospheric depth, realistic fabric and material response, grounded production design, polished narrative-film composition",
    negativePrompt:
      "3D CGI, plastic skin, beauty-filter face, chibi, anime, fantasy costume without story basis, excessive teal-orange grade, artificial glow, stock-photo smile, text, logo, watermark, frame, collage",
    defaultBackgroundMode: "contextual",
    characterRule:
      "Apply only live-action photographic realism, filmic light, material response, and camera language. Preserve the exact named character DNA, age, ethnicity, body, face, hair, wardrobe continuity, action, era, and location from the story.",
    keywords: ["điện ảnh chân thực", "cinematic photoreal", "live action", "phim truyện", "realistic cinematic"],
  },
  archival_documentary: {
    id: "archival_documentary",
    name: "Historical Archive",
    nameVi: "Tư Liệu Lịch Sử",
    category: "documentary_editorial",
    icon: "🗃️",
    tagline: "Ảnh thật • Chứng cứ",
    description: "Ngôn ngữ tài liệu dựa trên ảnh thật, bản đồ, hồ sơ và tái dựng có phân biệt rõ nguồn chứng cứ.",
    positivePrompt:
      "evidence-led documentary visual language, authentic archival photography treatment, accurate maps plans documents and material evidence, restrained neutral color grade, editorial sequencing, factual geographic and period specificity, clean museum-quality presentation, clearly differentiated reconstruction imagery",
    negativePrompt:
      "fabricated newspaper, fake quotation, invented document text, fantasy symbolism presented as fact, glossy commercial advertising, sensational gore, neon cyberpunk, inaccurate uniform, text artifacts, logo, watermark, decorative frame",
    defaultBackgroundMode: "contextual",
    characterRule:
      "Rendering must preserve factual identity and provenance. Never redesign a real person, building, artifact, map, uniform, date, or location; AI reconstruction must remain visually documentary and must not impersonate archival evidence.",
    keywords: ["tài liệu", "tư liệu", "archival documentary", "lịch sử", "hồ sơ", "documentary", "history"],
  },
  architecture_documentary: {
    id: "architecture_documentary",
    name: "Real Architecture",
    nameVi: "Kiến Trúc Chân Thực",
    category: "documentary_editorial",
    icon: "🏛️",
    tagline: "Công trình • Vật liệu",
    description: "Ảnh kiến trúc chân thực kết hợp bản vẽ, mặt bằng, vật liệu và bối cảnh địa lý để giải thích công trình chính xác.",
    positivePrompt:
      "professional architectural documentary photography, accurate building geometry and scale, rectilinear perspective control, natural daylight, truthful material texture, exterior and interior spatial continuity, site context, plan section and construction-detail editorial language, calm premium design-publication composition",
    negativePrompt:
      "impossible geometry, invented facade, warped verticals, fantasy building additions, miniature toy look, overprocessed HDR, empty luxury-advertising gloss, fake blueprint labels, text, logo, watermark, white picture frame",
    defaultBackgroundMode: "contextual",
    characterRule:
      "Architecture is the subject. Preserve the real building, plan, materials, structural logic, geography, period and scale; people remain contextually sized and story-defined rather than becoming fashion models.",
    keywords: ["kiến trúc", "architecture", "công trình", "nội thất", "architectural documentary", "bản vẽ"],
  },
  science_infographic: {
    id: "science_infographic",
    name: "Science Graphics",
    nameVi: "Đồ Họa Khoa Học",
    category: "infographic_concept",
    icon: "🔬",
    tagline: "Chính xác • Dễ hiểu",
    description: "Minh họa khoa học vector sắc nét, phân tầng rõ ràng và ưu tiên độ chính xác của cơ chế, tỷ lệ và cấu trúc.",
    positivePrompt:
      "premium science-explainer infographic illustration, precise vector geometry, clean modular shapes, crisp flat color separation, dark navy and vivid accent palette, accurate scale relationships, layered process visualization, elegant educational composition, highly readable visual hierarchy without labels",
    negativePrompt:
      "fake equations, pseudo-science symbols, inaccurate anatomy, impossible molecule, decorative data, excessive holograms, clutter, photoreal stock laboratory, gradients everywhere, text, numbers, logo, watermark",
    defaultBackgroundMode: "minimal",
    characterRule:
      "Apply only clean infographic geometry, palette, hierarchy and explanatory staging. Human identity and all scientific structures, quantities, processes and environments must remain source-accurate and scene-defined.",
    keywords: ["khoa học", "science infographic", "infographic", "giải thích khoa học", "vector science", "education"],
  },
  editorial_explainer: {
    id: "editorial_explainer",
    name: "Visual Explainer",
    nameVi: "Đồ Họa Giải Thích",
    category: "infographic_concept",
    icon: "🧩",
    tagline: "Trực quan • Mạch lạc",
    description: "Đồ họa biên tập kết hợp người, vật thể, bản đồ và sơ đồ nguyên nhân–kết quả cho video giải thích và tin tức.",
    positivePrompt:
      "modern editorial explainer illustration, clean geometric cut-paper shapes, restrained red blue cream and charcoal palette, sharp visual hierarchy, human-scale cause-and-effect staging, maps objects and contextual environments integrated into one coherent frame, premium newsroom graphics finish",
    negativePrompt:
      "copied news branding, channel logo, mascot, generic corporate stock art, fake chart labels, floating random icons, glossy 3D, cinematic fantasy, crowded collage, text, watermark",
    defaultBackgroundMode: "contextual",
    characterRule:
      "Apply only editorial geometry, palette, hierarchy and explanatory composition. Never copy a broadcaster's brand, presenter, studio, logo or exact layout; story facts and character DNA remain authoritative.",
    keywords: ["giải thích", "editorial explainer", "video essay", "news graphic", "báo chí", "nguồn gốc sự kiện"],
  },
  true_crime_evidence: {
    id: "true_crime_evidence",
    name: "Investigation Files",
    nameVi: "Hồ Sơ Điều Tra",
    category: "documentary_editorial",
    icon: "🔎",
    tagline: "Chứng cứ • Tiết chế",
    description: "Tài liệu điều tra tiết chế, tập trung vào địa điểm, timeline và chứng cứ thay vì hình ảnh bạo lực hoặc biểu tượng sáo rỗng.",
    positivePrompt:
      "restrained true-crime documentary visual language, low-key practical lighting, desaturated neutral palette, precise location and timeline evidence, forensic object inserts, investigative editorial composition, subtle film grain, respectful victim-centered framing, realistic night exteriors and interview-room atmosphere",
    negativePrompt:
      "gore, corpse, blood spectacle, victim glamorization, horror monster, detective pinboard cliché without story evidence, fake police text, neon red overload, melodramatic silhouette, logo, watermark, collage frame",
    defaultBackgroundMode: "contextual",
    characterRule:
      "Preserve real identities, dignity, chronology, evidence and locations. Never invent wounds, clues, police insignia or suspect appearance; suspense comes from verified details and composition, not sensational distortion.",
    keywords: ["true crime", "trinh thám", "thám án", "hồ sơ vụ án", "crime documentary", "điều tra"],
  },
  psychology_editorial: {
    id: "psychology_editorial",
    name: "Psychology Illustration",
    nameVi: "Minh Họa Tâm Lý",
    category: "infographic_concept",
    icon: "🧠",
    tagline: "Hành vi • Cảm xúc",
    description: "Minh họa tâm lý mang tính biên tập, dùng hành vi thật và ẩn dụ tiết chế để giải thích trạng thái tinh thần.",
    positivePrompt:
      "thoughtful psychology editorial illustration, tactile paper-cut and soft painted texture, restrained muted palette with one emotional accent color, human behavior grounded in observable gestures, spatial metaphor used sparingly, calm negative space, sophisticated magazine composition",
    negativePrompt:
      "literal brain floating in space, split-face cliché, random maze mirror, mental illness stigma, horror distortion, psychedelic overload, diagnosis text, fake medical chart, logo, watermark",
    defaultBackgroundMode: "minimal",
    characterRule:
      "Preserve exact human identity and show psychology through observable behavior, relationships and environment first. Use conceptual metaphor only when the narration is explicitly abstract and never portray it as literal fact.",
    keywords: ["tâm lý", "psychology", "triết học", "philosophy", "ý niệm", "mental health editorial"],
  },
  historical_painterly: {
    id: "historical_painterly",
    name: "Historical Reconstruction",
    nameVi: "Tái Dựng Lịch Sử",
    category: "artistic_retro",
    icon: "📜",
    tagline: "Đúng thời kỳ • Sử thi",
    description: "Tái dựng lịch sử bằng minh họa hội họa điện ảnh có kiểm soát, ưu tiên trang phục, kiến trúc và công nghệ đúng thời kỳ.",
    positivePrompt:
      "historically grounded painterly reconstruction, cinematic digital gouache and oil-brush texture, period-accurate clothing architecture tools vehicles and terrain, restrained earth pigments, atmospheric depth, museum illustration quality, readable military and civilian staging without heroic distortion",
    negativePrompt:
      "anachronism, modern object, fantasy armor, wrong flag, invented insignia, glossy game concept art, divine glow, propaganda pose, inaccurate ethnicity, text, logo, watermark, ornate picture frame",
    defaultBackgroundMode: "contextual",
    characterRule:
      "Apply only painterly medium, pigments and depth. Preserve verified person, faction, clothing, technology, geography and chronology; do not beautify, modernize or mythologize historical identity.",
    keywords: ["lịch sử hội họa", "historical painterly", "tái dựng lịch sử", "sử thi", "history illustration"],
  },
  fantasy_concept_art: {
    id: "fantasy_concept_art",
    name: "Cinematic Fantasy",
    nameVi: "Kỳ Ảo Điện Ảnh",
    category: "3d_cinematic",
    icon: "🐉",
    tagline: "Thế giới • Thần thoại",
    description: "Concept art điện ảnh cho lore, thần thoại và thế giới giả tưởng, giữ đúng quy tắc thế giới và thiết kế nhân vật của câu chuyện.",
    positivePrompt:
      "premium cinematic fantasy concept-art rendering, coherent world-building design language, large-scale environmental storytelling, painterly realism, controlled atmospheric perspective, material-specific costume and architecture, dramatic but readable light, consistent production-design bible quality",
    negativePrompt:
      "generic game splash art, random magic effects, unrelated dragon, default medieval armor, chibi, neon clutter, character redesign, inconsistent faction costume, floating text, logo, watermark, decorative frame",
    defaultBackgroundMode: "contextual",
    characterRule:
      "Apply only concept-art medium, scale, atmosphere and production-design finish. Character species, face, body, costume, faction, magic system, architecture, props and geography must come exclusively from the established story world.",
    keywords: ["concept art", "kỳ ảo", "fantasy", "lore", "world building", "thần thoại", "giải mã bí ẩn"],
  },
  product_review_studio: {
    id: "product_review_studio",
    name: "Product Review Studio",
    nameVi: "Review Sản Phẩm",
    category: "documentary_editorial",
    icon: "📦",
    tagline: "Sản phẩm • So sánh",
    description: "Ảnh review sạch, trung thực về hình dáng, vật liệu và thao tác sử dụng, phù hợp sản phẩm, công nghệ và top list.",
    positivePrompt:
      "premium product-review studio photography, accurate product geometry and material finish, soft controlled key and rim light, neutral contextual surface, honest scale, practical hand interaction, comparison-ready composition, crisp commercial detail without misleading enhancement",
    negativePrompt:
      "invented product feature, warped logo, fake UI, impossible reflection, luxury exaggeration, floating product, oversaturated glow, duplicated item, text, price tag, watermark, border frame",
    defaultBackgroundMode: "minimal",
    characterRule:
      "Product shape, controls, materials, scale and use must remain source-accurate. People and hands serve the demonstrated action; never alter the story-defined presenter or fabricate a feature for visual appeal.",
    keywords: ["review", "sản phẩm", "product review", "công nghệ", "top list", "so sánh"],
  },
  tien_hiep_3d: {
    id: "tien_hiep_3d",
    name: "Cinematic 3D Animation",
    nameVi: "Hoạt Hình 3D Điện Ảnh",
    category: "3d_cinematic",
    icon: "⚔️",
    tagline: "3D cao cấp • Ánh sáng phim",
    description: "Ngôn ngữ render donghua 3D điện ảnh với vật liệu PBR, ánh sáng thể tích và độ hoàn thiện cao; không tự thêm ngoại hình, cổ trang hay tiên hiệp vào nhân vật.",
    positivePrompt:
      "premium Chinese 3D donghua rendering language, cinematic stylized 3D animation medium, physically based materials, refined surface detail, controlled subsurface scattering, cinematic volumetric lighting, polished high-end production-quality render",
    negativePrompt:
      "chibi, childlike proportions, oversized head, tiny limbs, 2D flat cartoon, stick figure, low-poly geometry, cheap mobile-game render, plastic skin, distorted anatomy, extra fingers, inconsistent costume, cluttered effects, oversaturated neon, text, watermark, blur",
    defaultBackgroundMode: "contextual",
    characterRule:
      "Apply only donghua 3D rendering, materials, surface finish, lighting, and cinematic depth. Name, gender, age, face, eyes, hair, body proportions, clothing, role, action, props, era, and setting come only from the story; introduce no cultivator, robe, temple, weapon, or magic unless narrated.",
    keywords: ["3d tiên hiệp", "tiên hiệp", "tu tiên", "3d trung quốc", "tiên nghịch", "đấu phá", "tien hiep", "xianxia", "donghua", "immortal cultivator", "unreal engine 5"],
  },
};

const DEFAULT_STYLE_PRESET_ID = STYLE_PRESET_CONFIG.DEFAULT_ID;

export const GENRE_STYLE_RECOMMENDATIONS: Record<string, string[]> = {
  [VideoGenre.CINEMATIC_EPISODE]: ["cinematic_photoreal", "fantasy_concept_art", "tien_hiep_3d"],
  [VideoGenre.SATIRICAL_LIFE_AUTO]: ["hoat_hinh_2d_vn", "meme_hai_huoc_2d", "ve_tay_don_gian"],
  [VideoGenre.TRANSFORMATION_TIMELINE]: ["cinematic_photoreal", "editorial_explainer", "hoat_hinh_2d_vn"],
  [VideoGenre.CAREER_SOCIAL_DARKSIDE]: ["hoat_hinh_2d_vn", "cinematic_photoreal", "true_crime_evidence"],
  [VideoGenre.DOWNFALL_CONSEQUENCE]: ["cinematic_photoreal", "ve_tay_don_gian", "true_crime_evidence"],
  [VideoGenre.DARK_COMEDY_TRAGEDY]: ["hoat_hinh_2d_vn", "ve_tay_don_gian", "cinematic_photoreal"],
  [VideoGenre.STORY_DRIVEN_VIDEO_ESSAY]: ["cinematic_photoreal", "editorial_explainer", "historical_painterly"],
  [VideoGenre.NARRATIVE_EXPLAINER]: ["editorial_explainer", "science_infographic", "archival_documentary"],
  [VideoGenre.CHARACTER_PSYCHOLOGY]: ["psychology_editorial", "cinematic_photoreal", "gai_xinh_2d"],
  [VideoGenre.LORE_WORLD_BUILDING]: ["fantasy_concept_art", "tien_hiep_3d", "historical_painterly"],
  History: ["archival_documentary", "historical_painterly", "architecture_documentary"],
  Science: ["science_infographic", "editorial_explainer", "cinematic_photoreal"],
  Psychology: ["psychology_editorial", "cinematic_photoreal", "ve_tay_don_gian"],
  Review: ["product_review_studio", "editorial_explainer", "cinematic_photoreal"],
  News: ["editorial_explainer", "archival_documentary", "cinematic_photoreal"],
  "Top List": ["product_review_studio", "editorial_explainer", "cinematic_photoreal"],
  "True Crime": ["true_crime_evidence", "archival_documentary", "cinematic_photoreal"],
};

export const CINEMATIC_FILM_STYLE_PRESET_IDS = ["cinematic_photoreal", "fantasy_concept_art", "tien_hiep_3d"] as const;

export const getRecommendedStylePresetIds = (genre?: string): string[] =>
  _.filter(_.get(GENRE_STYLE_RECOMMENDATIONS, genre || "", [DEFAULT_STYLE_PRESET_ID]), (presetId) => Boolean(CURATED_STYLE_PRESETS[presetId]));

const LEGACY_STYLE_ID_ALIASES: Record<string, string> = {
  tho_bay_mau: "hoat_hinh_2d_vn",
  gau_truc_hai: "meme_hai_huoc_2d",
};

const findByPresetId = (normalized: string): CuratedStylePreset | undefined => {
  const resolvedId = _.get(LEGACY_STYLE_ID_ALIASES, normalized, normalized);
  return CURATED_STYLE_PRESETS[resolvedId];
};

const findByExactPrompt = (trimmed: string, normalized: string): CuratedStylePreset | undefined =>
  _.find(CURATED_STYLE_PRESETS, (preset) => _.isEqual(_.trim(preset.positivePrompt), trimmed) || _.isEqual(_.toLower(_.trim(preset.positivePrompt)), normalized));

const findByPresetName = (normalized: string): CuratedStylePreset | undefined =>
  _.find(CURATED_STYLE_PRESETS, (preset) => _.isEqual(_.toLower(preset.name), normalized) || _.isEqual(_.toLower(preset.nameVi), normalized));

const findByKeywords = (normalized: string): CuratedStylePreset | undefined => {
  const allPresets = _.values(CURATED_STYLE_PRESETS);
  const candidates: { preset: CuratedStylePreset; keywordLength: number }[] = [];

  _.forEach(allPresets, (preset) => {
    _.forEach(preset.keywords, (keyword) => {
      const escaped = _.escapeRegExp(_.toLower(keyword));
      const regex = new RegExp(`${STYLE_PRESET_CONFIG.WORD_BOUNDARY_PREFIX}${escaped}${STYLE_PRESET_CONFIG.WORD_BOUNDARY_SUFFIX}`, STYLE_PRESET_CONFIG.REGEX_FLAG_I);
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
