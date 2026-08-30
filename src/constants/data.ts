import { SplitStrategy, VideoGenre } from "./enums";
import _ from "lodash";

export interface PipelineNode {
  id: string;
  nameVi: string;
  nameEn: string;
  stageGroup: number;
  descVi: string;
  descEn: string;
}

export const pipelineNodes = [
  {
    id: "In",
    nameVi: "Đầu Vào",
    nameEn: "Input Source",
    stageGroup: 0,
    descVi: "Thu thập kịch bản thô hoặc ý tưởng ban đầu.",
    descEn: "Captures raw Original Script or short Story Idea.",
  },
  {
    id: "HKG",
    nameVi: "Tạo lời dẫn",
    nameEn: "Hook Generator",
    stageGroup: 1,
    descVi: "Thiết kế câu mở đầu, câu giữ chân và kêu gọi hành động.",
    descEn: "Calculates high click-rate Opening, Retention and CTA hooks.",
  },
  {
    id: "SRW",
    nameVi: "Viết Lại Kịch Bản",
    nameEn: "Script Rewriter",
    stageGroup: 2,
    descVi: "Viết lại và điều chỉnh độ độc bản của câu chuyện.",
    descEn: "Rewrites original words to bypass redundant phrases.",
  },
  {
    id: "SEH",
    nameVi: "Nâng Cấp Văn Phong",
    nameEn: "Script Enhancer",
    stageGroup: 2,
    descVi: "Tối ưu độ trôi chảy và kịch tính hóa hội thoại.",
    descEn: "Injects flow dramatic triggers and flow patterns.",
  },
  {
    id: "LFE",
    nameVi: "Mở Rộng Thời Lượng",
    nameEn: "Long Form Expander",
    stageGroup: 2,
    descVi: "Mở rộng cốt truyện lên tới 60 phút bằng cách thêm bối cảnh.",
    descEn: "Expands script lengths dynamically by adding contextual side stories.",
  },
  {
    id: "FCK",
    nameVi: "Kiểm Chứng Thực Tế",
    nameEn: "Fact Checker",
    stageGroup: 2,
    descVi: "Rà soát tên riêng, năm, địa danh lịch sử chuẩn xác.",
    descEn: "Validates factual events, metrics and chronologies.",
  },
  {
    id: "CGT",
    nameVi: "Thiết lập chương truyện",
    nameEn: "Chapter Generator",
    stageGroup: 2,
    descVi: "Trực quan hóa cấu trúc câu chuyện thành chương mục.",
    descEn: "Breaks large scripts into core semantic chapters.",
  },
  {
    id: "SGE",
    nameVi: "Dựng phân cảnh",
    nameEn: "Storyboard Generator",
    stageGroup: 3,
    descVi: "Lập sơ độ phân cảnh chi tiết đồng bộ mốc thời gian.",
    descEn: "Forms coordinates linking timing, narration, and screen actions.",
  },
  {
    id: "SSP",
    nameVi: "Phân dòng cảnh",
    nameEn: "Scene Splitter",
    stageGroup: 3,
    descVi: "Cắt nhỏ kịch bản bám sát diễn biến bối cảnh.",
    descEn: "Splits chapter narratives into granular scenes.",
  },
  {
    id: "TGE",
    nameVi: "Thiết Kế Sơ Đồ Thời Gian",
    nameEn: "Timeline Generator",
    stageGroup: 3,
    descVi: "Ước lượng thời gian và thời lượng cho từng khung hình.",
    descEn: "Calculates start-end frames based on reading speeds.",
  },
  {
    id: "VPL",
    nameVi: "Kế Hoạch Hình Ảnh",
    nameEn: "Visual Planner",
    stageGroup: 4,
    descVi: "Định lượng số lượng ảnh cần thiết cho đoạn phim.",
    descEn: "Optimizes assets count, preventing duplicate images.",
  },
  {
    id: "ASM",
    nameVi: "Tài nguyên hình ảnh",
    nameEn: "Asset Manager",
    stageGroup: 4,
    descVi: "Nhập dữ liệu hình ảnh tải lên hoặc tự động khởi tạo.",
    descEn: "Mixes imported CSV elements and system default textures.",
  },
  {
    id: "PGE",
    nameVi: "Mô tả hình ảnh",
    nameEn: "Prompt Generator",
    stageGroup: 4,
    descVi: "Dựng từ khóa vẽ tranh chi tiết cho công cụ.",
    descEn: "Enhances descriptive painting formulas for high quality.",
  },
  {
    id: "CCM",
    nameVi: "Duy Trì Nhân Vật",
    nameEn: "Character Consistency",
    stageGroup: 4,
    descVi: "Khóa diện mạo, trang phục và tỷ lệ cơ thể nhân vật.",
    descEn: "Locks key faces, clothing features and colors.",
  },
  {
    id: "IMG",
    nameVi: "Tạo Ảnh Thần Tốc",
    nameEn: "Image Generator",
    stageGroup: 4,
    descVi: "Thực thi quy trình lập hình ảnh tự động.",
    descEn: "Runs the latent diffusion rendering pipeline.",
  },
  {
    id: "VGE",
    nameVi: "Tạo giọng nói",
    nameEn: "Voice Generator",
    stageGroup: 5,
    descVi: "Chuyển đổi văn bản thành tệp thu âm diễn cảm.",
    descEn: "Transforms text strings into full wave audio files.",
  },
  {
    id: "SGE_sub",
    nameVi: "Hệ Thống Phụ Đề",
    nameEn: "Subtitle Generator",
    stageGroup: 5,
    descVi: "Tạo tệp phụ đề định dạng chuẩn bám sát giọng đọc.",
    descEn: "Drafts exact SRT subtitle alignments.",
  },
  {
    id: "FAL",
    nameVi: "Căn Khớp Giọng Nói",
    nameEn: "Forced Alignment",
    stageGroup: 5,
    descVi: "Áp dụng thuật toán khớp âm thanh thực tế với chữ.",
    descEn: "Aligns speech phonemes directly to text stamps.",
  },
  {
    id: "TNG",
    nameVi: "Thiết kế ảnh bìa",
    nameEn: "Thumbnail Generator",
    stageGroup: 4,
    descVi: "Khởi sinh các mẫu ảnh bìa tăng tỷ lệ nhấn xem.",
    descEn: "Generates high engagement MrBeast or History layouts.",
  },
  {
    id: "TTG",
    nameVi: "Dựng Tiêu Đề",
    nameEn: "Title Generator",
    stageGroup: 6,
    descVi: "Tối ưu tiêu đề dễ tìm kiếm và thu hút đám đông.",
    descEn: "Creates clickbait and standard search terms.",
  },
  {
    id: "DSG",
    nameVi: "Tạo phần mô tả",
    nameEn: "Description Generator",
    stageGroup: 6,
    descVi: "Soạn nội dung giới thiệu tối ưu tìm kiếm.",
    descEn: "Writes descriptive templates fitted for algorithm reach.",
  },
  { id: "HSG", nameVi: "Đề xuât chủ đề", nameEn: "Hashtag Generator", stageGroup: 6, descVi: "Gợi ý các thẻ nổi bật thịnh hành.", descEn: "Finds trending tags." },
  { id: "TAG", nameVi: "Từ Khóa Tìm Kiếm", nameEn: "Tag Generator", stageGroup: 6, descVi: "Tổng hợp bộ nhãn tìm kiếm phim siêu tốc.", descEn: "Compiles search key phrases." },
  {
    id: "VDA",
    nameVi: "Hệ thống điều phối",
    nameEn: "Video Director AI",
    stageGroup: 7,
    descVi: "Tổng hợp điều khiển góc quay máy ảnh chuyển tiếp.",
    descEn: "Ensures scene flow, camera transitions and visuals fit.",
  },
  {
    id: "AVE",
    nameVi: "Trình Biên Tập Tự Động",
    nameEn: "Auto Video Editor",
    stageGroup: 7,
    descVi: "Tổng hòa các dải âm thanh, phụ đề và dữ liệu thành phim hoàn chỉnh.",
    descEn: "Fuses visuals, subtitle layers and music track.",
  },
  {
    id: "QCH",
    nameVi: "Kiểm Soát Chất Lượng",
    nameEn: "Quality Checker",
    stageGroup: 7,
    descVi: "Đánh giá tỷ lệ nén tệp tin, chuẩn khung hình và độ trong âm thanh.",
    descEn: "Verifies file compressions and safely scales.",
  },
  {
    id: "EXP",
    nameVi: "Xuất bản phim",
    nameEn: "Exporter Engine",
    stageGroup: 7,
    descVi: "Hỗ trợ tải tệp phim độ tương thích cao cực nhanh.",
    descEn: "Allows professional raw file export in XML format.",
  },
] as const;

export const genreLabels = {
  [VideoGenre.CINEMATIC_EPISODE]: "Phim truyện điện ảnh AI",
  [VideoGenre.STORY_DRIVEN_VIDEO_ESSAY]: "Tóm tắt phim & truyện",
  [VideoGenre.NARRATIVE_EXPLAINER]: "Giải thích nguồn gốc & sự kiện",
  [VideoGenre.CHARACTER_PSYCHOLOGY]: "Phân tích tâm lý nhân vật",
  [VideoGenre.LORE_WORLD_BUILDING]: "Giải mã chi tiết bí ẩn",
  [VideoGenre.SATIRICAL_LIFE_AUTO]: "AI tự chọn",
  [VideoGenre.TRANSFORMATION_TIMELINE]: "Biến đổi theo thời gian",
  [VideoGenre.CAREER_SOCIAL_DARKSIDE]: "Góc tối nghề nghiệp",
  [VideoGenre.DOWNFALL_CONSEQUENCE]: "Sa ngã và trả giá",
  [VideoGenre.DARK_COMEDY_TRAGEDY]: "Bi kịch hài đen",
  Storytelling: "Tóm tắt phim & truyện",
  History: "Lịch sử & tài liệu",
  Documentary: "Phim tài liệu",
  Explanation: "Giải thích nguồn gốc & sự kiện",
  Review: "Đánh giá / Review",
  Education: "Giáo dục",
  News: "Tin tức",
  "Top List": "Bảng xếp hạng / Top list",
  "True Crime": "Trinh thám / Thám án",
  Science: "Khoa học",
  Psychology: "Tâm lý & triết học",
  Philosophy: "Triết học",
} as const;

export const GENRE_OPTION_GROUPS = [
  {
    label: "Kể chuyện châm biếm",
    options: [
      VideoGenre.SATIRICAL_LIFE_AUTO,
      VideoGenre.TRANSFORMATION_TIMELINE,
      VideoGenre.CAREER_SOCIAL_DARKSIDE,
      VideoGenre.DOWNFALL_CONSEQUENCE,
      VideoGenre.DARK_COMEDY_TRAGEDY,
    ],
  },
  {
    label: "Kể chuyện – giải thích",
    options: [VideoGenre.STORY_DRIVEN_VIDEO_ESSAY, VideoGenre.NARRATIVE_EXPLAINER, VideoGenre.CHARACTER_PSYCHOLOGY, VideoGenre.LORE_WORLD_BUILDING],
  },
  {
    label: "Tài liệu – kiến thức",
    options: ["History", "Science", "Psychology"],
  },
  {
    label: "YouTube phổ biến",
    options: ["Review", "News", "Top List", "True Crime"],
  },
] as const;

export const GENRE_VALUE_ALIASES: Record<string, string> = {
  Storytelling: VideoGenre.STORY_DRIVEN_VIDEO_ESSAY,
  Documentary: "History",
  Explanation: VideoGenre.NARRATIVE_EXPLAINER,
  Education: VideoGenre.NARRATIVE_EXPLAINER,
  Philosophy: "Psychology",
  "Tâm lý": "Psychology",
};

export const normalizeGenreValue = (genre?: string): string => _.get(GENRE_VALUE_ALIASES, genre || "", genre || VideoGenre.STORY_DRIVEN_VIDEO_ESSAY);

export const audLabels = { "General Audience": "Khán giả đại chúng", Kids: "Trẻ em", Teenagers: "Thanh thiếu niên", Adults: "Người lớn", Seniors: "Người cao tuổi" } as const;

export const styleLabels = {
  Professional: "Chuyên nghiệp",
  Documentary: "Tài liệu chân thực",
  Viral: "Lan truyền / Đề xuất",
  Mystery: "Bí ẩn / Kịch tính",
  Drama: "Kịch tính / Gây cấn",
  Educational: "Mang tính giáo dục",
  Scientific: "Khoa học thực tiễn",
} as const;

export const motionLabels = {
  "Zoom In": "Phóng to",
  "Zoom Out": "Thu nhỏ",
  "Pan Left": "Góc trái",
  "Pan Right": "Góc phải",
  "Pan Up": "Góc trên",
  "Pan Down": "Góc dưới",
  Drift: "Trôi nhẹ",
  "Cinematic Arc": "Hình cung",
  "Push In": "Đẩy vào",
  "Slow Reveal": "Hé lộ",
  Static: "Tĩnh",
} as const;

export const emotionMap = { Normal: "Bình thường", Excited: "Hào hứng", Serious: "Trang nghiêm", Dramatic: "Kịch tính", Mysterious: "Bí ẩn" } as const;

export const stylePresetsKeywords = {
  Stickman:
    "2D minimalist stick figure illustration, clean uniform bold black outlines on pure solid white background, minimal dot eyes, soft pink circular cheek blush, flat vector without shading",
  "2D Vector": "2D flat vector cartoon illustration, vibrant pastel colors, clean bold outlines, minimalist design, stylized characters",
  Anime: "modern anime style, vibrant cel shading, clean hand-drawn keyframe linework, Kyoto Animation aesthetic, expressive anime eyes, studio lighting",
  "3D Pixar": "3D cute animated cartoon render, smooth clay-like shading, Pixar aesthetic, soft ambient studio lighting, vibrant saturated colors",
  Comic: "comic book illustration style, bold ink outlines, dynamic action composition, halftone dot shading, graphic novel artwork",
  Cinematic: "cinematic film still, photorealistic, shot on 35mm lens, natural filmic lighting, rich atmospheric depth of field, dramatic cinematic composition",
  Watercolor: "artistic watercolor wash illustration, soft paint bleed, subtle ink linework on textured paper, delicate pastel palette",
  Cyberpunk: "cyberpunk neon aesthetic, glowing neon lights, futuristic dark atmosphere, high contrast moody shadows, volumetric fog",
  "Oil Painting": "classic oil on canvas painting, textured visible brush strokes, impasto technique, dramatic chiaroscuro lighting",
  "Pixel Art": "8-bit retro pixel art, detailed vintage sprite design, limited color palette, clean grid pixels, nostalgic 90s arcade game look",
  Realistic: "cinematic film still, photorealistic, natural lighting, high depth of field, authentic textures",
  Historical: "historical accuracy, period-accurate costume design, aged sepia tone, archival epic style, ancient realism",
  "Black & White": "monochrome photography, high contrast black and white film grain, classic noir shading, deep dramatic shadows",
  Documentary: "raw documentary photography, photojournalism style, unposed authentic moment, natural ambient light",
  "Low Poly": "3d low-poly geometric artwork, stylized faceted polygons, clean retro rendering, pastel vector gaming assets",
} as const;

export const GEMINI_UNSUPPORTED_ERROR_KEYWORDS = ["not found", "404", "unsupported"] as const;
export const GEMINI_RETRYABLE_ERROR_KEYWORDS = ["429", "quota", "Quota exceeded", "503", "500", "550", "fetch failed", "Timeout", "undici"] as const;
export const STICKMAN_KEYWORDS = ["người que", "hình que", "nét que", "stickman", "stick figure", "hoạt hình", "stick"] as const;

export const LOG_SUCCESS_KEYWORDS = ["thành công", "success", "hoàn thành"] as const;
export const CONSOLE_LOG_IGNORED_MESSAGES = [
  "Warning:",
  "Maximum update depth exceeded",
  "setState inside useEffect",
  "React limits the number of nested updates",
  "Cannot update a component while rendering",
] as const;
export const VITE_CONNECTION_LOST_KEYWORDS = ["[vite] server connection lost", "server connection lost. polling for restart"] as const;
export const VITE_HOT_UPDATE_KEYWORDS = ["[vite] hot updated", "[vite] hmr update"] as const;
export const VITE_FAILED_RELOAD_KEYWORD = "[hmr] failed to reload";
export const VITE_CONNECTED_KEYWORD = "[vite] connected";
export const LOG_PENDING_KEYWORDS = ["bắt đầu thực thi", "pending", "đang xử lý", "trigger"] as const;
export const LOG_WARN_KEYWORDS = ["cảnh báo", "warning", "warn"] as const;
export const LOG_ERROR_KEYWORDS = ["lỗi", "error", "fail"] as const;

export const LOG_ERROR_SYMBOLS = ["❌", "💀"] as const;
export const LOG_WARN_SYMBOLS = ["⚠️", "⏳"] as const;

export const GEMINI_RETRYABLE_STATUSES = ["RESOURCE_EXHAUSTED", "UNAVAILABLE", 429, "429"] as const;
export const GEMINI_QUOTA_STATUSES = ["RESOURCE_EXHAUSTED", 429, "429"] as const;
export const GEMINI_USER_MESSAGES = {
  vi: {
    missingKey: "Chưa có khóa AI. Hãy thêm khóa Cerebras, Groq hoặc Gemini hợp lệ trong Cài đặt rồi thử lại.",
    unsupportedModel: "Mô hình AI hiện tại không còn được hỗ trợ. Hệ thống đã tạm loại mô hình này; hãy thử lại để dùng mô hình khác.",
    zeroQuota: "Tài khoản Gemini không có hạn mức miễn phí cho mô hình khả dụng. Hãy đổi khóa có hạn mức hoặc bật thanh toán rồi thử lại.",
    dailyQuota: "Hạn mức Gemini hôm nay đã hết. Hãy chờ hạn mức được làm mới hoặc đổi khóa rồi thử lại.",
    rateLimit: "Gemini đang giới hạn tần suất yêu cầu. Hãy đợi một lúc rồi tiếp tục dự án.",
    transient: "Gemini đang tạm thời không phản hồi. Hãy kiểm tra kết nối và thử lại sau ít phút.",
    fatal: "Không thể tạo nội dung bằng các AI đã cấu hình. Hãy kiểm tra khóa Groq, Cerebras hoặc Gemini và thử lại.",
  },
  en: {
    missingKey: "No AI key is configured. Add a valid Cerebras, Groq, or Gemini key in Settings and try again.",
    unsupportedModel: "The current AI model is no longer supported. It has been temporarily removed; retry to use another model.",
    zeroQuota: "This Gemini account has no free quota for an available model. Use a key with quota or enable billing and try again.",
    dailyQuota: "Today's Gemini quota is exhausted. Wait for the quota to reset or use another key.",
    rateLimit: "Gemini is rate-limiting requests. Wait briefly, then resume the project.",
    transient: "Gemini is temporarily unavailable. Check the connection and retry in a few minutes.",
    fatal: "The configured AI providers could not generate the content. Check the Groq, Cerebras, or Gemini keys and try again.",
  },
} as const;

export const GEMINI_RETRY_REGEX = /retry in ([\d\.]+)s/i;

export const GENRE_OPTIONS = _.flatMap(GENRE_OPTION_GROUPS, "options");

export const AUDIENCE_OPTIONS = ["General Audience", "Kids", "Teenagers", "Adults", "Seniors"] as const;

export const WRITING_STYLE_OPTIONS = ["Professional", "Documentary", "Viral", "Mystery", "Drama", "Educational", "Scientific"] as const;

export const HOOK_STRATEGY_OPTIONS = [
  { value: "Auto", label: "Tự động" },
  { value: "Mystery", label: "Kỳ bí, tò mò" },
  { value: "Shock", label: "Gây sốc" },
  { value: "Drama", label: "Kịch tính" },
  { value: "Curiosity", label: "Hiếu kỳ" },
  { value: "Emotional", label: "Cảm xúc" },
  { value: "Historical", label: "Lịch sử" },
  { value: "Statistical", label: "Thống kê" },
  { value: "Question", label: "Đặt câu hỏi" },
  { value: "Story", label: "Câu chuyện" },
] as const;

export const HOOK_POSITION_OPTIONS = [
  { value: "start", label: "Chỉ mở đầu" },
  { value: "mid", label: "Mở đầu & Giữa" },
  { value: "all", label: "Đầu, Giữa & Cuối" },
] as const;

export const DURATION_OPTIONS = [
  { val: "2m", label: "300 từ (~2 phút)" },
  { val: "5m", label: "750 từ (~5 phút)" },
  { val: "10m", label: "1500 từ (~10 phút)" },
  { val: "15m", label: "2250 từ (~15 phút)" },
  { val: "30m", label: "4500 từ (~30 phút)" },
  { val: "40m", label: "6000 từ (~40 phút)" },
  { val: "60m", label: "9000 từ (~60 phút)" },
  { val: "1h30m", label: "13500 từ (~1h30 phút)" },
  { val: "2h", label: "18000 từ (~2 giờ)" },
] as const;

export const DEFAULT_IMAGE_KEYWORDS = "cinematic,landscape";

export const ABBREVIATIONS = [
  "tp",
  "ts",
  "ths",
  "gs",
  "pgs",
  "ks",
  "nxb",
  "sđt",
  "vv",
  "dr",
  "mr",
  "mrs",
  "ms",
  "st",
  "vol",
  "pm",
  "am",
  "vs",
  "eg",
  "ie",
  "co",
  "inc",
  "approx",
  "vn",
] as const;

export const CONJUNCTIONS = [
  "và",
  "nhưng",
  "hoặc",
  "vì",
  "nên",
  "để",
  "khi",
  "mà",
  "thì",
  "nếu",
  "tuy",
  "bởi",
  "sau",
  "trong",
  "cho",
  "and",
  "but",
  "or",
  "because",
  "so",
  "then",
  "to",
  "when",
  "while",
  "if",
  "although",
  "that",
  "which",
  "who",
  "for",
  "with",
] as const;

export const SCENE_SPLIT_MOTIONS = ["Zoom In", "Zoom Out", "Pan Left", "Pan Right", "Pan Up", "Pan Down", "Drift", "Cinematic Arc", "Push In", "Slow Reveal", "Static"] as const;

const easeCubicInOut = (t: number): number => (t < 0.5 ? 4.0 * t * t * t : 1.0 - Math.pow(-2.0 * t + 2.0, 3) / 2.0);
const easeSineInOut = (t: number): number => -(Math.cos(Math.PI * t) - 1.0) / 2.0;
const easeExpoOut = (t: number): number => (t >= 1.0 ? 1.0 : 1.0 - Math.pow(2.0, -10.0 * t));

export const CAMERA_MOTION_EFFECTS: Record<string, (progress: number) => { scale: number; dx: number; dy: number }> = {
  "Zoom In": (p) => {
    const t = easeCubicInOut(p);
    return { scale: 1.0 + 0.06 * t, dx: 0, dy: 0 };
  },
  "Zoom Out": (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.06 - 0.06 * t, dx: 0, dy: 0 };
  },
  "Pan Left": (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.08, dx: 25.6 - 51.2 * t, dy: 0 };
  },
  "Pan Right": (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.08, dx: -25.6 + 51.2 * t, dy: 0 };
  },
  "Pan Up": (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.08, dx: 0, dy: 14.4 - 28.8 * t };
  },
  "Pan Down": (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.08, dx: 0, dy: -14.4 + 28.8 * t };
  },
  Drift: (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.06 + 0.04 * Math.sin(t * Math.PI), dx: 30 * Math.sin(t * Math.PI * 1.5), dy: 20 * Math.cos(t * Math.PI * 1.2) };
  },
  "Cinematic Arc": (p) => {
    const t = easeCubicInOut(p);
    return { scale: 1.0 + 0.15 * t, dx: 60 * t, dy: -30 * Math.sin(t * Math.PI) };
  },
  "Push In": (p) => {
    const t = easeExpoOut(p);
    return { scale: 1.0 + 0.28 * t, dx: 20 * t, dy: -15 * t };
  },
  "Slow Reveal": (p) => {
    const t = easeCubicInOut(p);
    return { scale: 1.18 - 0.14 * t, dx: -30 * t, dy: 40 * t };
  },
  Static: () => ({ scale: 1.0, dx: 0, dy: 0 }),
};

export const SCENE_SPLIT_TRANSITIONS = ["Cross Dissolve", "Blur Dissolve", "Brightness Fade", "Fade out to black", "Slide", "Zoom transition", "Cut"] as const;

export const AI_MOTION_EFFECT_IDS = [
  "zoom_in",
  "zoom_out",
  "pan_left",
  "pan_right",
  "pan_up",
  "pan_down",
  "diagonal_up_left",
  "diagonal_up_right",
  "diagonal_down_left",
  "diagonal_down_right",
  "drift",
  "cinematic_arc",
  "push_in",
  "pull_out",
  "slow_reveal",
  "floating_camera",
  "handheld_soft",
  "parallax_left",
  "parallax_right",
  "static",
] as const;
export const AI_TRANSITION_EFFECT_IDS = [
  "cut",
  "cross_dissolve",
  "blur_dissolve",
  "brightness_fade",
  "fade_black",
  "fade_white",
  "slide_left",
  "slide_right",
  "slide_up",
  "slide_down",
  "wipe_left",
  "wipe_right",
  "wipe_up",
  "wipe_down",
  "zoom_transition",
  "flash",
  "whip_left",
  "whip_right",
  "glitch_transition",
  "film_burn",
] as const;
export const AI_VISUAL_EFFECT_IDS = [
  "sad_vignette",
  "vintage",
  "dreamy",
  "glitch",
  "warm",
  "cold",
  "noir",
  "horror_fog",
  "vhs",
  "neon",
  "film_grain",
  "sharpen",
  "chromatic_aberration",
  "pixelate",
  "soft_focus",
] as const;
export const AI_LIGHTING_EFFECT_IDS = [
  "natural_light",
  "light_leak",
  "lens_flare",
  "god_rays",
  "spotlight",
  "bokeh",
  "flicker",
  "strobe",
  "exposure_pulse",
  "golden_glow",
] as const;

export const AI_MODEL_CAPABILITY = { TEXT: "text", VISUAL: "visual", AUDIO: "audio" } as const;

export const AI_MODEL_REGISTRY = [
  {
    id: "gemini-3.7-flash",
    freeEligible: true,
    priority: 1,
    capabilities: [AI_MODEL_CAPABILITY.TEXT, AI_MODEL_CAPABILITY.VISUAL, AI_MODEL_CAPABILITY.AUDIO],
  },
  {
    id: "gemini-3.6-flash",
    freeEligible: true,
    priority: 2,
    capabilities: [AI_MODEL_CAPABILITY.TEXT, AI_MODEL_CAPABILITY.VISUAL, AI_MODEL_CAPABILITY.AUDIO],
  },
  {
    id: "gemini-3.5-flash-lite",
    freeEligible: true,
    priority: 3,
    capabilities: [AI_MODEL_CAPABILITY.TEXT, AI_MODEL_CAPABILITY.VISUAL, AI_MODEL_CAPABILITY.AUDIO],
  },
] as const;
export const AVAILABLE_MODELS = _.map(_.sortBy(_.filter(AI_MODEL_REGISTRY, "freeEligible"), "priority"), "id");
export const GEMINI_NON_RETRYABLE_MODEL_PATTERNS = ["no longer available", "not found", "model is not found", "unsupported model"] as const;
export const GEMINI_ZERO_QUOTA_PATTERNS = ["limit: 0", "limit=0", "free_tier_requests, limit: 0", "free_tier_input_token_count, limit: 0"] as const;
export const GEMINI_DAILY_QUOTA_PATTERNS = ["perday", "per day", "requestsperday", "tokensperday"] as const;

export const PROMPT_FILLER_WORDS = [
  "beautiful",
  "detailed",
  "artistic",
  "image",
  "generation",
  "prompt",
  "describing",
  "characters",
  "clothes",
  "historical",
  "accuracy",
  "weather",
  "camera",
  "angle",
  "lighting",
  "based",
  "style",
  "with",
  "what",
  "where",
  "photo",
  "shot",
  "highly",
  "ultra",
  "dramatic",
  "gorgeous",
  "scene",
  "rendering",
] as const;

export const STICKMAN_STYLE_MODIFIERS =
  "chibi stickman cartoon illustration, oversized round head, small rounded bean-shaped torso, thin tubular black arms and legs, distinct stable hair silhouette, minimal oval eyes and tiny nose, restrained expressive eyebrows and mouth, thick clean hand-drawn black outlines, flat solid clothing colors, no gradients, no realistic shading, simple cutout-like composition";

export const DEFAULT_SESSION_ID = ";1781857807598";

export const VOICE_PROVIDER_OPTIONS = [
  { value: "edge", labelKey: "Edge_Microsoft" },
  { value: "elevenlabs", labelKey: "ElevenLabs" },
  { value: "minimax", labelKey: "Minimax" },
  { value: "kokoro", labelKey: "Kokoro" },
  { value: "clone", labelKey: "Clone" },
  { value: "vbee", labelKey: "Vbee" },
] as const;

export const VOICE_LANGUAGE_OPTIONS = [
  { value: "", labelKey: "All" },
  { value: "en", labelKey: "English_3" },
  { value: "vi", labelKey: "Vietnamese_4" },
  { value: "fr", labelKey: "French" },
  { value: "de", labelKey: "German" },
  { value: "es", labelKey: "Spanish" },
  { value: "ja", labelKey: "Japanese" },
  { value: "ko", labelKey: "Korean" },
  { value: "zh", labelKey: "Chinese" },
] as const;

export const VOICE_AGE_OPTIONS = [
  { value: "", labelKey: "All" },
  { value: "young", labelKey: "Young" },
  { value: "middle_aged", labelKey: "Middle_aged" },
  { value: "old", labelKey: "Elderly" },
] as const;

export const GEMINI_CHAT_SPEED_OPTIONS = [
  { value: "1", labelKey: "GeminiSpeed_1", fallbackLabel: "1" },
  { value: "3", labelKey: "GeminiSpeed_3", fallbackLabel: "3" },
  { value: "5", labelKey: "GeminiSpeed_5", fallbackLabel: "5" },
  { value: "7", labelKey: "GeminiSpeed_7", fallbackLabel: "7" },
  { value: "10", labelKey: "GeminiSpeed_10", fallbackLabel: "10" },
] as const;

export const BATCH_DELAY_OPTIONS = [
  { value: "default", labelKey: "Batch_Delay_Default" },
  { value: "1s", labelKey: "Batch_Delay_1s" },
  { value: "2s", labelKey: "Batch_Delay_2s" },
  { value: "3s", labelKey: "Batch_Delay_3s" },
  { value: "random123", labelKey: "Batch_Delay_Random_123" },
] as const;

export const PROJECT_LANGUAGE_OPTIONS = [
  { value: "vi", labelKey: "Ti_ng_Vi_t" },
  { value: "en", labelKey: "Ti_ng_Anh" },
] as const;

export const VOICE_PRESET_MAP: Record<string, string> = {
  "preset-vi-bac-female": "edge_vi-VN-HoaiMyNeural",
  "preset-vi-bac-male": "edge_vi-VN-NamMinhNeural",
  "preset-vi-trung-female": "edge_vi-VN-HoaiMyNeural",
  "preset-vi-trung-male": "edge_vi-VN-NamMinhNeural",
  "preset-vi-nam-female": "edge_vi-VN-HoaiMyNeural",
  "preset-vi-nam-male": "edge_vi-VN-NamMinhNeural",
  "preset-vi-kid": "edge_vi-VN-HoaiMyNeural",
  "gcp-vi-female": "edge_vi-VN-HoaiMyNeural",
  "gcp-vi-male": "edge_vi-VN-NamMinhNeural",
  "gcp-en-female": "edge_en-US-AriaNeural",
  "fpt-vi-female": "edge_vi-VN-HoaiMyNeural",
  "fpt-vi-male": "edge_vi-VN-NamMinhNeural",
  "zalo-vi-female": "edge_vi-VN-HoaiMyNeural",
  "viettel-vi-male": "edge_vi-VN-NamMinhNeural",
  "gemini-cloud-vi-female": "edge_vi-VN-HoaiMyNeural",
  "gemini-cloud-vi-male": "edge_vi-VN-NamMinhNeural",
  "gemini-cloud-vi": "edge_vi-VN-HoaiMyNeural",
};

export const getDurationText = (isVi: boolean, durStr: string) => {
  const spokenWordsPerMinute = isVi ? 250 : 150;
  if (durStr === "30s") {
    return { targetWordCount: _.round(spokenWordsPerMinute / 2), durationText: isVi ? "30 giây (30 seconds)" : "30 seconds" };
  }
  const match = durStr.match(/(\d+)/);
  if (match) {
    const mins = parseInt(match[1], 10);
    const targetWordCount = mins * spokenWordsPerMinute;
    const paragraphs = mins * 3;
    const durationText = isVi
      ? `${mins} phút (${mins} minutes). You MUST write at least ${paragraphs} deeply detailed paragraphs/sections to fill this time.`
      : `${mins} minutes. You MUST write at least ${paragraphs} deeply detailed paragraphs/sections to fill this time.`;
    return { targetWordCount, durationText, targetWordCountMin: Math.floor(targetWordCount * 0.95) };
  }
  return { targetWordCount: spokenWordsPerMinute * 2, durationText: isVi ? "2 phút (2 minutes)" : "2 minutes", targetWordCountMin: Math.floor(spokenWordsPerMinute * 2 * 0.95) };
};

export const SPLIT_STRATEGY_OPTIONS = [
  { value: SplitStrategy.WORD, labelKey: "By_word", titleKey: "Word_aligned_Maximizes_im", className: "text-slate-300" },
  { value: SplitStrategy.SHORT_SENTENCE, labelKey: "Short_sentence", titleKey: "Fast_paced_vibrant_short_", className: "text-slate-300" },
  { value: SplitStrategy.LONG_SENTENCE, labelKey: "Long_sentence", titleKey: "Default_balanced_standard", className: "text-slate-300" },
  { value: SplitStrategy.MIXED_SENTENCES, labelKey: "Mixed_sentences", titleKey: "Mixed_sentences_desc", className: "text-emerald-450 font-bold" },
  { value: SplitStrategy.PARAGRAPH, labelKey: "Paragraph_density", titleKey: "Logical_paragraph_aligned", className: "text-slate-300" },
] as const;

export const VOICE_OWNERSHIP_KEY = "voice_ownership";
export const VOICE_OWNERSHIP_COMMUNITY = "community";
export const VBEE_PROVIDER_ID = "vbee";
export const VBEE_VOICE_PREFIXES = ["vbee-", "vbee"];

export const VOICE_PROVIDER_MAPPINGS = [
  { prefixes: ["gemini-cloud", "preset-"], provider: "Gemini Speech" },
  { prefixes: ["elevenlabs"], provider: "ElevenLabs" },
  { prefixes: ["azure-cloud"], provider: "Azure AI" },
  { prefixes: ["openai-tts"], provider: "OpenAI TTS" },
  { prefixes: ["google-cloud"], provider: "Google Cloud" },
  { prefixes: ["fpt-"], provider: "FPT.AI" },
  { prefixes: ["zalo-"], provider: "Zalo AI" },
  { prefixes: ["viettel-"], provider: "Viettel AI" },
  { prefixes: ["vbee-"], provider: "Vbee" },
];

export const VOICE_DESCRIPTION_KEYS: Record<string, string> = {
  "preset-vi-bac-female": "Northern_female",
  "preset-vi-bac-male": "Northern_male",
  "preset-vi-trung-female": "Central_female",
  "preset-vi-trung-male": "Central_male",
  "preset-vi-nam-female": "Southern_female",
  "preset-vi-nam-male": "Southern_male",
  "preset-vi-kid": "Playful_kids_voiceover",
  "gcp-vi-female": "Google_free_female",
  "gcp-vi-male": "Google_free_male",
  "gcp-en-female": "Google_free_English_femal",
  "fpt-vi-female": "FPT_female_monthly",
  "fpt-vi-male": "FPT_male_monthly",
  "zalo-vi-female": "Zalo_female_daily",
  "viettel-vi-male": "Viettel_male_yearly",
  "gemini-cloud-vi-female": "Hifidelity_female_cloud_A",
  "gemini-cloud-vi-male": "Hifidelity_male_cloud_AI",
  "gemini-cloud-vi": "Muff_free_cloud_AI_defaul",
};

export const VOICE_PAGE_SIZE = "30";
export const GENDER_OPTIONS = ["", "male", "female"] as const;
export const AUDIO_PLAYBACK_FAILED_ERR = "AUDIO_PLAYBACK_FAILED";

export const APP_LOCALES = { VI: "vi-VN", EN: "en-US", VI_SHORT: "vi", EN_SHORT: "en" } as const;

export const DEFAULT_PROVIDER = "";
