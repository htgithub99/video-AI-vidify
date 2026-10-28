import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
import string
PUNCTUATION_TO_REMOVE = string.punctuation + '""\'\'“”“”'
REGEX_SONG_SUFFIX = r'\(\d+\)$'
LOG_START_PROCESS = "-> Bắt đầu xử lý tối ưu hóa CapCut cho tệp tin: {}"
LOG_OPTS = "-> Cấu hình tùy chọn: {}"
LOG_COUNT_PHOTOS = "📷 Tìm thấy {} phân cảnh hình ảnh/video trên dòng thời gian."
LOG_COUNT_AUDIOS = "🎵 Tìm thấy {} âm thanh trên dòng thời gian."
LOG_CLEAR_TRANSITIONS = "🗑️ Đang dọn sạch toàn bộ hiệu ứng chuyển cảnh hiện tại..."
LOG_SYNCING = "⏳ Đang đồng bộ dòng thời gian cho {} phân cảnh..."
LOG_NORMALIZE = "🔊 Đang chuẩn hóa âm lượng của các phân đoạn âm thanh về mức chuẩn..."
LOG_REVERSING = "🔄 Đang đảo ngược thứ tự các phân cảnh trên dòng thời gian..."
LOG_MIXING = "🎵 Đang tự động chèn nhạc nền ngẫu nhiên..."
LOG_CUSTOM_ORDER = "🔀 Đang sắp xếp thứ tự âm thanh theo danh sách từ khóa: {}"
LOG_RANDOMIZING = "🔀 Đang xáo trộn ngẫu nhiên thứ tự các phân cảnh..."
LOG_INSERT_TRANSITIONS = "🎬 Đang tự động thêm hiệu ứng chuyển cảnh mới..."
LOG_SUBTITLES = "📝 Đang định dạng kiểu phụ đề và phông chữ chuyên nghiệp..."
LOG_AI_SFX = "⚡ Đang tự động tạo hiệu ứng âm thanh bằng trí tuệ nhân tạo (AI)..."
LOG_SUCCESS = "HOÀN TẤT: Toàn bộ tiến trình tối ưu hóa CapCut Ultra đã thành công!"
LOG_DUP_PHOTOS = "-> Số lượng ảnh ({}) ít hơn âm thanh ({}). Đang tự động nhân bản ảnh..."
LOG_TRUNCATE_PHOTOS = "-> Số lượng ảnh ({}) nhiều hơn âm thanh ({}). Đang cắt bỏ ảnh thừa..."
LOG_NO_TIMELINE_CHANGE = "-> Không thay đổi cấu trúc timeline. Áp dụng các hiệu ứng trực tiếp trên các phân cảnh hiện tại..."
LOG_NO_BGM_FOUND = "-> Không tìm thấy tệp nhạc nền nào."
LOG_NO_SFX_MATCH = "-> Không tìm thấy kết hợp hiệu ứng âm thanh nào phù hợp."
LOG_SFX_DIR_EMPTY = "-> Thư mục SFX trống."
LOG_SFX_GEMINI_REQUEST = "-> Đang gửi yêu cầu gợi ý SFX tới Google Gemini..."
LOG_SFX_GEMINI_ERR = "-> Lỗi kết nối Gemini: {}. Đang chuyển sang đối sánh từ khóa tự động..."
LOG_SFX_AUTO_MATCH = "-> Đang thực hiện đối sánh từ khóa tự động cho SFX..."
LOG_SFX_MATCH_SUCCESS = "-> Đã ghép nối thành công {} hiệu ứng âm thanh."
LOG_PROCESS_KILLED = "🛑 Phát hiện và đã tự động tắt tiến trình CapCut/Jianying đang hoạt động để tránh lỗi ghi đè dữ liệu."
LOG_WAIT_CLOSE = "⏳ Đang chờ hệ thống đóng hoàn toàn CapCut và giải phóng tài nguyên để tránh lỗi cache..."
LOG_SCENE_DETAIL = "🎬 Scene {:02d} | Ratio: {} | Type: {} | Motion: {} | Scale: {:.2f} | Transform: ({:.4f}, {:.4f}) | Rot: {:.2f}°"
LOG_SCENE_DETAIL_SIMPLE = "🎬 Scene {:02d} | Ratio: {} | Motion: {} | Scale: {:.2f} | Transform: ({:.4f}, {:.4f}) | Rot: {:.2f}°"
LOG_GEMINI_API_REQUEST = "-> Đang gửi yêu cầu gợi ý SFX tới Google Gemini..."
LOG_DUP_INFO = "-> Số lượng ảnh ({}) ít hơn âm thanh ({}). Đang tự động nhân bản ảnh..."
LOG_DEL_INFO = "-> Số lượng ảnh ({}) nhiều hơn âm thanh ({}). Đang cắt bỏ ảnh thừa..."
LOG_NO_SFX_DIR = "-> Thư mục SFX trống."
LOG_EXPORT_NO_DIR = "[Xuất Video] ❌ Chưa chỉ định thư mục lưu video!"
LOG_EXPORT_STARTING = "[Xuất Video] 🎬 Bắt đầu kết xuất video từ dự án CapCut..."
LOG_EXPORT_NO_MEDIA = "[Xuất Video] ⚠️ Không tìm thấy file ảnh hoặc audio trong dự án để kết xuất!"
LOG_EXPORT_NO_AUDIO = "[Xuất Video] ⚠️ Không có audio, sẽ kết xuất video im lặng."
LOG_EXPORT_RENDERING = "[Xuất Video] ⏳ Đang kết xuất video bằng ffmpeg ({} ảnh, {} audio)..."
LOG_EXPORT_SUCCESS = "[Xuất Video] ✅ Kết xuất video thành công! File lưu tại: {}"
LOG_EXPORT_FAIL = "[Xuất Video] ❌ Kết xuất thất bại với mã lỗi {}"
LOG_EXPORT_ERR = "[Xuất Video] ❌ Lỗi kết xuất: {}"
ERR_NO_MEDIA = "Không tìm thấy hình ảnh, video hoặc âm thanh trên dòng thời gian!"
ERR_CLI_USAGE = "Cú pháp: python capcut_ultra_tool.py <input_json> <output_json> [opts_json_string] HOẶC python capcut_ultra_tool.py <select-file/select-folder>"
ERR_OPTS_PARSE = "Lỗi phân tích cú pháp tùy chọn JSON: {}"
ERR_GENERIC = "ERROR: {}"
ERR_NO_TIMELINE_MOD = "Không thể thực hiện các thao tác thay đổi timeline do thiếu ảnh/video hoặc âm thanh trên track chính!"
ERR_SUBTITLE_CONFIG = "Lỗi cấu hình phụ đề: {}"
TRANSITION_NAME = "Chuyển cảnh ngẫu nhiên"
DEFAULT_TRANSITION_DURATION = 500000
DEFAULT_FALLBACK_DURATION = 5000000
TRANS_PREFIX = 'trans_'
VIDEO_TYPE_KEY = 'video'
AUDIO_TYPE_KEY = 'audio'
PHOTO_TYPE_KEY = 'photo'
TYPE_ATTR = 'type'
SEGMENTS_ATTR = 'segments'
MATERIALS_ATTR = 'materials'
VIDEOS_ATTR = 'videos'
AUDIOS_ATTR = 'audios'
TRANSITIONS_ATTR = 'transitions'
TRACKS_ATTR = 'tracks'
CLIP_ATTR = 'clip'
SCALE_ATTR = 'scale'
TRANSFORM_ATTR = 'transform'
TRANSITION_ATTR = 'transition'
EXTRA_REFS_ATTR = 'extra_material_refs'
TARGET_TIMERANGE_ATTR = 'target_timerange'
SOURCE_TIMERANGE_ATTR = 'source_timerange'
DURATION_ATTR = 'duration'
START_ATTR = 'start'
VOLUME_ATTR = 'volume'
PATH_ATTR = 'path'
ID_ATTR = 'id'
NAME_ATTR = 'name'
X_AXIS = 'x'
Y_AXIS = 'y'
UTF8_ENCODING = 'utf-8'
READ_MODE = 'r'
WRITE_MODE = 'w'
CMD_SELECT_FILE = "select-file"
CMD_SELECT_FOLDER = "select-folder"
DIALOG_FILE_TITLE = "Chọn file draft_content.json"
DIALOG_FOLDER_TITLE = "Chọn thư mục"
JSON_FILE_TYPES_LABEL = "JSON files"
JSON_EXT = "*.json"
ALL_EXT = "*.*"
OPT_SYNC_IMAGE_TO_AUDIO = 'sync_image_to_audio'
OPT_CUSTOM_AUDIO_ORDER = 'custom_audio_order'
OPT_AUDIO_ORDER_LIST = 'audio_order_list'
OPT_RANDOMIZE_VIDEO = 'randomize_video'
OPT_REVERSE_TIMELINE = 'reverse_timeline'
OPT_AUTO_FILL_CANVAS = 'auto_fill_canvas'
OPT_DYNAMIC_MOTION = 'dynamic_motion'
OPT_SCENE_TYPE = 'scene_type'
OPT_NORMALIZE_VOLUME = 'normalize_volume'
OPT_ULTRA_MUSIC_MIX = 'ultra_music_mix'
OPT_SFX_FOLDER = 'sfx_folder'
OPT_AUTO_TRANSITION = 'auto_transition'
OPT_AUTO_SUBTITLES = 'auto_subtitles'
OPT_AI_SFX_GENERATOR = 'ai_sfx_generator'
OPT_API_KEY = 'api_key'
CMD_KILL_CAPCUT = "taskkill /f /t /im CapCut.exe"
CMD_KILL_JIANYING = "taskkill /f /t /im JianyingPro.exe"
BGM_TRACK_NAME = "BGM Track"
BGM_TRACK_ID_PREFIX = "bgm_track_{}"
BGM_MAT_ID_PREFIX = "bgm_mat_{}"
BGM_SEG_ID_PREFIX = "bgm_seg_{}"
SFX_TRACK_NAME = "SFX Track"
SFX_TRACK_ID_PREFIX = "sfx_track_{}"
SFX_MAT_ID_PREFIX = "sfx_mat_{}"
SFX_SEG_ID_PREFIX = "sfx_seg_{}"
FONT_INTER = 'Inter'
DUP_PHOTO_PREFIX = "dup_photo_{}"
PROMPT_TEMPLATE = """
Bạn là một nhà thiết kế âm thanh chuyên nghiệp cho video ngắn.
Tôi có danh sách các phân cảnh video dưới đây:
{}

Và tôi có danh sách các tệp hiệu ứng âm thanh (SFX) có sẵn trong thư mục:
{}

Hãy ghép nối mỗi phân cảnh với một tệp SFX phù hợp nhất từ danh sách trên để làm nổi bật bối cảnh hoặc tạo chuyển cảnh mượt mà.
Nếu một phân cảnh không cần SFX hoặc không có tệp nào phù hợp, hãy đặt "sfx_filename" là null.
Hãy chọn tệp từ danh sách có sẵn, KHÔNG tự bịa tên tệp.
Trả về kết quả dưới dạng JSON object với cấu trúc:
{{
  "sfx_mapping": [
    {{"scene_index": 0, "sfx_filename": "tên_file.mp3"}},
    ...
  ]
}}
Chỉ trả về chuỗi JSON thô hợp lệ, không bọc trong markdown hay bất cứ ký tự nào khác.
"""
SAFE_TRANSFORM_X_MIN = -0.12
SAFE_TRANSFORM_X_MAX = 0.12
SAFE_TRANSFORM_Y_MIN = -0.08
SAFE_TRANSFORM_Y_MAX = 0.08
SAFE_PAN_MIN_SCALE = 1.12
MAX_ROTATION_DEGREE = 0.5
LIGHT_ROTATION_MIN = -0.15
LIGHT_ROTATION_MAX = 0.15
SCALE_MOTION_MIN = 1.08
SCALE_MOTION_MAX = 1.18
DURATION_HOOK_MIN = 1.5
DURATION_HOOK_MAX = 2.0
DURATION_INFO_MIN = 3.0
DURATION_INFO_MAX = 5.0
DURATION_IMPORTANT_MIN = 5.0
DURATION_IMPORTANT_MAX = 8.0
WEIGHT_ZOOM = 0.30
WEIGHT_PAN = 0.25
WEIGHT_PUSH = 0.15
WEIGHT_CORNER = 0.15
WEIGHT_KEN_BURNS = 0.15
KF_PROPERTY_SCALE = "UNIFORM_SCALE"
KF_PROPERTY_POSITION_X = "KFTypePositionX"
KF_PROPERTY_POSITION_Y = "KFTypePositionY"
KF_PROPERTY_ROTATION = "KFTypeRotation"
CURVE_EASE_IN_OUT = "EaseInOut"
RATIO_LANDSCAPE = "Landscape"
RATIO_PORTRAIT = "Portrait"
RATIO_SQUARE = "Square"
SCENE_HOOK = "Hook"
SCENE_IMPORTANT = "Important"
SCENE_INFORMATION = "Information"
MOTION_ZOOM_IN = "Zoom In"
MOTION_ZOOM_OUT = "Zoom Out"
MOTION_PAN_LEFT = "Pan Left"
MOTION_PAN_RIGHT = "Pan Right"
MOTION_PAN_UP = "Pan Up"
MOTION_PAN_DOWN = "Pan Down"
MOTION_PUSH_IN = "Push In"
MOTION_PULL_OUT = "Pull Out"
MOTION_CORNER_LEFT = "Corner Left"
MOTION_CORNER_RIGHT = "Corner Right"
MOTION_KEN_BURNS = "Ken Burns"
MOTION_STATIC_FOCUS = "Static Focus"
GENRE_TIKTOK = "tiktok"
GENRE_PODCAST = "podcast"
GENRE_REVIEW = "review"
GENRE_VLOG = "vlog"
GENRE_STORY = "story"
GENRE_NEWS = "news"
GENRE_DOCUMENTARY = "documentary"
GENRE_HISTORY = "history"
GENRE_ACTION = "action"
