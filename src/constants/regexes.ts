export const MARKDOWN_REGEX = /[*#_\[\]`~>|\/\-\\]/g;

export const EMOJI_REGEX =
  /[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{24C2}\u{23E9}-\u{23EF}\u{23F0}\u{23F3}\u{23FA}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/gu;

export const VIETNAMESE_ACCENT_MARKS_REGEX = /[\u0300-\u036f]/g;
export const VIETNAMESE_D_LETTER_REGEX = /[đĐ]/g;
export const SAFE_FOLDER_CHARS_REGEX = /[^a-zA-Z0-9\s-_]/g;
export const SAFE_PROJECT_ID_REGEX = /[^a-zA-Z0-9_-]/g;
export const MULTIPLE_SPACES_REGEX = /\s+/g;

export const PLAYWRIGHT_SUBMIT_ICON_REGEX = /^(arrow_forward|add_2|send)$/i;
export const PLAYWRIGHT_SUBMIT_TEXT_REGEX = /(Tạo|Create|Generate)/i;

export const BASE64_IMAGE_MIME_REGEX = /^data:image\/([a-zA-Z0-9+]+);base64,([\s\S]+)$/;
export const BASE64_VIDEO_MIME_REGEX = /^data:video\/([a-zA-Z0-9+]+);base64,([\s\S]+)$/;

export const BASE64_DATA_URL_REGEX = /^data:([^;]+);base64,([\s\S]+)$/;

export const ASSET_PROJECT_PATH_REGEX = /(\/assets\/projects\/)[^/]+\//i;

export const AUDIO_CLEAN_PREFIX_REGEX = /^(Dưới đây là|Đây là|Tuyệt vời|Chắc chắn|Sau đây là|Tôi đã tạo|Hãy cùng xem|Chào bạn|Chắc chắn rồi|Vâng|Được chứ).*?:?\n?/i;
export const AUDIO_CLEAN_MARKDOWN_REGEX = /[\*\#\_\-\[\]\(\)]/g;
export const AUDIO_CLEAN_EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
export const WHITESPACE_REGEX = /\s+/g;
export const VIETNAMESE_VALID_CHARS_REGEX = /[^a-zđâăêôơưàáảãạằắẳẵặầấẩẫậềếểễệồốổỗộờớởỡợừứửữựỳýỷỹỵ]/g;
export const PROMPT_NUMBERING_PREFIX_REGEX = /^\d+[\.\-\s)]+\s*/;

export const IMAGE_GEN_IMAGEN_EXACT_REGEX = /(imagen|banana pro)/i;
export const IMAGE_GEN_IMAGEN_FALLBACK_REGEX = /(imagen|banana pro|banana)/i;
export const IMAGE_GEN_LABS_EXACT_REGEX = /(labs-sandbox|sandbox|banana 2 lite)/i;
export const IMAGE_GEN_LABS_FALLBACK_REGEX = /(labs-sandbox|sandbox|banana 2 lite|banana)/i;
export const IMAGE_GEN_VEO_EXACT_REGEX = /(veo|omni flash|banana 2\b(?!.*lite))/i;
export const IMAGE_GEN_VEO_FALLBACK_REGEX = /(veo|omni flash|banana 2)/i;

export const GEMINI_MODEL_PRO_REGEX = /\b3\.1\s+Pro\b/i;
export const GEMINI_MODEL_FLASH_REGEX = /\b3\.7\s+Flash\b/i;
export const GEMINI_MODEL_FLASH_FAMILY_REGEX = /\b3\.\d+\s+Flash(?![\s-]*Lite)\b/i;
export const GEMINI_MODEL_FLASH_LITE_REGEX = /\b3\.5\s+Flash[\s-]*Lite\b/i;

export const JSON_CLEANUP_CURLY_REGEX = /,\s*}/g;
export const JSON_CLEANUP_SQUARE_REGEX = /,\s*]/g;
export const ALPHANUMERIC_ONLY_REGEX = /[^a-z0-9]/g;
export const SINGLE_QUOTE_REGEX = /'/g;

export const LAST_WORD_IN_SENTENCE_REGEX = /(\b[a-zA-ZÀ-ỹ]+)$/;
export const SENTENCE_PUNCTUATION_END_REGEX = /[伤害,.;:—\-\s]+$/;
export const DIGIT_REGEX = /\d/;
export const ENDS_WITH_DIGIT_REGEX = /\d$/;
export const STARTS_WITH_DIGIT_REGEX = /^\d/;

export const DETECTOR_VIETNAMESE_REGEX = /[áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/i;
export const LEADING_HASHTAGS_REGEX = /^#+/;
export const REGEX_AUTO_MODE_PATH = /\[AUTO-MODE\] Project created at:\s*(.+)/i;
export const IMAGE_ID_URL_REGEX = /[?&](id|docid|name)=([^&]+)/;
export const FANTASY_LEAK_REGEX =
  /\b(?:fantasy|mystic(?:al)?|magic(?:al)?|immortal|cultivat(?:or|ion)|celestial|spiritual energy|talisman|temple|ancient seal|floating (?:stairs|energy|runes?)|moonlit.*magical|magical.*moonlit)\b/i;
export const FANTASY_STORY_REGEX =
  /\b(?:fantasy|magic(?:al)?|wizard|witch|spell|immortal|cultivat(?:or|ion)|celestial|spiritual|talisman|temple|ancient kingdom|tu tien|tien hiep|phep thuat|than tien|tu tien|linh luc|tien nhan)\b/i;
export const GEMINI_ACTIVE_VIDEO_MODE_REGEX = /^\s*(?:video|tạo video|create video|generate video)\s*$/i;
export const GEMINI_ACTIVE_IMAGE_MODE_REGEX = /^\s*(?:hình ảnh|image|images|bỏ chọn hình ảnh|deselect image)\s*$/i;
