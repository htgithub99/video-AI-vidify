export const MARKDOWN_REGEX = /[*#_\[\]`~>|\/\-\\]/g;

export const EMOJI_REGEX =
  /[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{24C2}\u{23E9}-\u{23EF}\u{23F0}\u{23F3}\u{23FA}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/gu;

// Regex chuẩn hóa tiếng Việt không dấu
export const VIETNAMESE_ACCENT_MARKS_REGEX = /[\u0300-\u036f]/g;
export const VIETNAMESE_D_LETTER_REGEX = /[đĐ]/g;
export const SAFE_FOLDER_CHARS_REGEX = /[^a-zA-Z0-9\s-_]/g;
export const MULTIPLE_SPACES_REGEX = /\s+/g;

// Regex tách câu trong audio
export const SENTENCE_SPLIT_REGEX = /[^.!?]+[.!?]*/g;
export const CLAUSE_SPLIT_REGEX = /([,;:|])\s*/;

// Regex tách từ khóa prompt và base64
export const NON_ALPHANUMERIC_SPACE_REGEX = /[^a-zA-Z0-9\s]/g;
export const BASE64_IMAGE_DATA_REGEX = /^data:([^;]+);base64,(.+)$/;

// Regex Playwright tìm nút bấm Sandbox
export const PLAYWRIGHT_SUBMIT_ICON_REGEX = /^(arrow_forward|add_2|send)$/i;
export const PLAYWRIGHT_SUBMIT_TEXT_REGEX = /(Tạo|Create|Generate)/i;

// Regex phân tích câu lệnh cURL (Sandbox Header Config)
export const CURL_AUTHORIZATION_BEARER_REGEX = /-H\s+['"]authorization:\s*(Bearer\s+[^'"]+)['"]/i;
export const CURL_AUTHORIZATION_JSON_REGEX = /"authorization"\s*:\s*"([^"]+)"/i;
export const CURL_BEARER_TOKEN_REGEX = /(Bearer\s+ya29\.[a-zA-Z0-9_\-]+)/i;
export const CURL_PROJECT_ID_BODY_REGEX = /"projectId"\s*:\s*"(projects\/)?([^"]+)"/;
export const CURL_PROJECT_ID_URL_REGEX = /projects\/([^/]+)/;
export const CURL_CLIENT_SESSION_ID_REGEX = /"clientSessionId"\s*:\s*"([^"]+)"/i;
export const CURL_SESSION_ID_REGEX = /"sessionId"\s*:\s*"([^"]+)"/i;
export const CURL_RECAPTCHA_TOKEN_REGEX = /"token"\s*:\s*"([^"]+)"/i;
export const CURL_AGENT_SESSION_ID_REGEX = /"agentSessionId"\s*:\s*"([^"]+)"/i;

export const BASE64_IMAGE_MIME_REGEX = /^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/;

export const BASE64_DATA_URL_REGEX = /^data:([^;]+);base64,(.+)$/;

export const AUDIO_CLEAN_PREFIX_REGEX = /^(Dưới đây là|Đây là|Tuyệt vời|Chắc chắn|Sau đây là|Tôi đã tạo|Hãy cùng xem|Chào bạn|Chắc chắn rồi|Vâng|Được chứ).*?:?\n?/i;
export const AUDIO_CLEAN_MARKDOWN_REGEX = /[\*\#\_\-\[\]\(\)]/g;
export const AUDIO_CLEAN_EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
export const FILE_EXTENSION_REGEX = /\.[^/.]+$/;
export const WHITESPACE_REGEX = /\s+/g;
export const VIETNAMESE_VALID_CHARS_REGEX = /[^a-zđâăêôơưàáảãạằắẳẵặầấẩẫậềếểễệồốổỗộờớởỡợừứửữựỳýỷỹỵ]/g;
export const PROMPT_NUMBERING_PREFIX_REGEX = /^\d+[\.\-\s)]+\s*/;
export const ASPECT_RATIO_PARAM_REGEX = /\s*--ar\s+\d+:\d+/gi;
