import { SplitStrategy, VideoGenre } from "./enums";
import { SCRIPT_SPEECH_RATE_CONFIG } from "./config";
import { SCRIPT_DURATION_LABELS, GENRE_GROUP_LABELS } from "./texts";
import _ from "lodash";
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
    label: GENRE_GROUP_LABELS.vi.SATIRICAL,
    options: [VideoGenre.SATIRICAL_LIFE_AUTO, VideoGenre.TRANSFORMATION_TIMELINE, VideoGenre.CAREER_SOCIAL_DARKSIDE, VideoGenre.DOWNFALL_CONSEQUENCE, VideoGenre.DARK_COMEDY_TRAGEDY],
  },
  {
    label: GENRE_GROUP_LABELS.vi.STORY_EXPLAINER,
    options: [VideoGenre.STORY_DRIVEN_VIDEO_ESSAY, VideoGenre.NARRATIVE_EXPLAINER, VideoGenre.CHARACTER_PSYCHOLOGY, VideoGenre.LORE_WORLD_BUILDING],
  },
  {
    label: GENRE_GROUP_LABELS.vi.DOCUMENTARY_KNOWLEDGE,
    options: ["History", "Science", "Psychology"],
  },
  {
    label: GENRE_GROUP_LABELS.vi.YOUTUBE_TRENDING,
    options: ["Review", "News", "Top List", "True Crime"],
  },
] as const;
const GENRE_VALUE_ALIASES: Record<string, string> = {
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
export const stylePresetsKeywords = {
  Stickman: "2D minimalist stick figure illustration, clean uniform bold black outlines on pure solid white background, minimal dot eyes, soft pink circular cheek blush, flat vector without shading",
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
export const GEMINI_RETRYABLE_ERROR_KEYWORDS = ["429", "quota", "Quota exceeded", "503", "500", "550", "fetch failed", "Timeout", "undici"] as const;
export const LOG_SUCCESS_KEYWORDS = ["thành công", "success", "hoàn thành"] as const;
export const CONSOLE_LOG_IGNORED_MESSAGES = ["Warning:", "Maximum update depth exceeded", "setState inside useEffect", "React limits the number of nested updates", "Cannot update a component while rendering"] as const;
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
  { val: "2m", label: SCRIPT_DURATION_LABELS.vi["2m"] },
  { val: "5m", label: SCRIPT_DURATION_LABELS.vi["5m"] },
  { val: "10m", label: SCRIPT_DURATION_LABELS.vi["10m"] },
  { val: "15m", label: SCRIPT_DURATION_LABELS.vi["15m"] },
  { val: "30m", label: SCRIPT_DURATION_LABELS.vi["30m"] },
  { val: "40m", label: SCRIPT_DURATION_LABELS.vi["40m"] },
  { val: "60m", label: SCRIPT_DURATION_LABELS.vi["60m"] },
  { val: "1h30m", label: SCRIPT_DURATION_LABELS.vi["1h30m"] },
  { val: "2h", label: SCRIPT_DURATION_LABELS.vi["2h"] },
] as const;
export const ABBREVIATIONS = ["tp", "ts", "ths", "gs", "pgs", "ks", "nxb", "sđt", "vv", "dr", "mr", "mrs", "ms", "st", "vol", "pm", "am", "vs", "eg", "ie", "co", "inc", "approx", "vn"] as const;
export const CONJUNCTIONS = ["và", "nhưng", "hoặc", "vì", "nên", "để", "khi", "mà", "thì", "nếu", "tuy", "bởi", "sau", "trong", "cho", "and", "but", "or", "because", "so", "then", "to", "when", "while", "if", "although", "that", "which", "who", "for", "with"] as const;
export const AI_MOTION_EFFECT_IDS = ["zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down", "diagonal_up_left", "diagonal_up_right", "diagonal_down_left", "diagonal_down_right", "drift", "cinematic_arc", "push_in", "pull_out", "slow_reveal", "floating_camera", "handheld_soft", "parallax_left", "parallax_right", "static"] as const;
export const AI_TRANSITION_EFFECT_IDS = ["cut", "cross_dissolve", "blur_dissolve", "brightness_fade", "fade_black", "fade_white", "slide_left", "slide_right", "slide_up", "slide_down", "wipe_left", "wipe_right", "wipe_up", "wipe_down", "zoom_transition", "flash", "whip_left", "whip_right", "glitch_transition", "film_burn"] as const;
export const AI_VISUAL_EFFECT_IDS = ["sad_vignette", "vintage", "dreamy", "glitch", "warm", "cold", "noir", "horror_fog", "vhs", "neon", "film_grain", "sharpen", "chromatic_aberration", "pixelate", "soft_focus"] as const;
export const AI_LIGHTING_EFFECT_IDS = ["natural_light", "light_leak", "lens_flare", "god_rays", "spotlight", "bokeh", "flicker", "strobe", "exposure_pulse", "golden_glow"] as const;
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
  { value: "2", labelKey: "GeminiSpeed_2", fallbackLabel: "2" },
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
  const spokenWordsPerMinute = isVi ? SCRIPT_SPEECH_RATE_CONFIG.VIETNAMESE_WORDS_PER_MINUTE : SCRIPT_SPEECH_RATE_CONFIG.ENGLISH_WORDS_PER_MINUTE;
  if (durStr === "30s") {
    return { targetWordCount: _.round(spokenWordsPerMinute / 2), durationText: isVi ? "30 giây (30 seconds)" : "30 seconds" };
  }
  const match = durStr.match(/(\d+)/);
  if (match) {
    const mins = parseInt(match[1], 10);
    const targetWordCount = mins * spokenWordsPerMinute;
    const paragraphs = mins * 3;
    const durationText = isVi ? `${mins} phút (${mins} minutes). You MUST write at least ${paragraphs} deeply detailed paragraphs/sections to fill this time.` : `${mins} minutes. You MUST write at least ${paragraphs} deeply detailed paragraphs/sections to fill this time.`;
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
