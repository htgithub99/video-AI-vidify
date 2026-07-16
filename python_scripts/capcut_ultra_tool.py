import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
import os
import json
import random
import uuid
import re
import sys
import string
import copy
import urllib.request

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

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding=UTF8_ENCODING)
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding=UTF8_ENCODING)

def clean_song_name(raw_name):
    if not raw_name:
        return ""
    name_without_ext = os.path.splitext(raw_name)[0]
    clean = re.sub(REGEX_SONG_SUFFIX, '', name_without_ext).strip()
    return clean

def util_get_filename_from_path(path):
    if not path:
        return ""
    return os.path.basename(path)

def get_audio_duration_micros(filepath):
    if not filepath or not os.path.exists(filepath):
        return DEFAULT_FALLBACK_DURATION
    import subprocess
    try:
        cmd = [
            'ffprobe', 
            '-v', 'error', 
            '-show_entries', 'format=duration', 
            '-of', 'default=noprint_wrappers=1:nokey=1', 
            filepath
        ]
        result = subprocess.run(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True, 
            timeout=5
        )
        if result.returncode == 0:
            duration_sec = float(result.stdout.strip())
            if duration_sec > 0:
                return int(duration_sec * 1000000)
    except Exception:
        pass

    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(filepath)
        return len(audio) * 1000
    except Exception:
        pass

    try:
        import wave
        with wave.open(filepath, 'rb') as w:
            frames = w.getnframes()
            rate = w.getframerate()
            return int((frames / float(rate)) * 1000000)
    except Exception:
        pass

    return DEFAULT_FALLBACK_DURATION

def get_image_dimensions_fallback(filepath):
    try:
        with open(filepath, 'rb') as f:
            head = f.read(32)
            if len(head) < 24:
                return None
            if head.startswith(b'\x89PNG\r\n\x1a\n'):
                import struct
                w, h = struct.unpack('>II', head[16:24])
                return int(w), int(h)
            elif head.startswith(b'GIF87a') or head.startswith(b'GIF89a'):
                import struct
                w, h = struct.unpack('<HH', head[6:10])
                return int(w), int(h)
            elif head.startswith(b'\xff\xd8'):
                f.seek(0)
                size = 2
                while size:
                    f.seek(size, 1)
                    byte = f.read(2)
                    if not byte:
                        break
                    while byte[0] != 0xff:
                        byte = f.read(1)
                        if not byte:
                            break
                    ftype = byte[1]
                    if ftype in [0xc0, 0xc1, 0xc2, 0xc3, 0xc9, 0xca, 0xcb]:
                        f.seek(3, 1)
                        import struct
                        h, w = struct.unpack('>HH', f.read(4))
                        return int(w), int(h)
                    else:
                        size = struct.unpack('>H', f.read(2))[0] - 2
    except Exception:
        pass
    return None

def get_media_dimensions(filepath):
    if not filepath or not os.path.exists(filepath):
        return None
    dims = get_image_dimensions_fallback(filepath)
    if dims:
        return dims
    ext = os.path.splitext(filepath)[1].lower()
    if ext in ['.jpg', '.jpeg', '.png', '.bmp', '.webp']:
        try:
            from PIL import Image
            with Image.open(filepath) as img:
                return img.size
        except Exception:
            pass
    try:
        import cv2
        cap = cv2.VideoCapture(filepath)
        if cap.isOpened():
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            cap.release()
            if w > 0 and h > 0:
                return (w, h)
    except Exception:
        pass
    return None

def call_gemini(api_key, prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode(UTF8_ENCODING), headers=headers, method="POST")
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read().decode(UTF8_ENCODING))
        text = res_data['candidates'][0]['content']['parts'][0]['text']
        return text

def open_file_dialog():
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        file_path = filedialog.askopenfilename(
            title=DIALOG_FILE_TITLE,
            filetypes=[
                (JSON_FILE_TYPES_LABEL, JSON_EXT), 
                (ALL_EXT, ALL_EXT)
            ]
        )
        if file_path:
            print(os.path.normpath(file_path), end="")
            return
    except Exception:
        pass
    
    found_paths = []
    for root_dir, dirs, files in os.walk("."):
        if any(ex in root_dir for ex in ["node_modules", "dist", ".git", "__pycache__"]):
            continue
        for f in files:
            if f == "draft_content.json":
                found_paths.append(os.path.abspath(os.path.join(root_dir, f)))
    if found_paths:
        print(os.path.normpath(found_paths[0]), end="")
    else:
        any_json = []
        for root_dir, dirs, files in os.walk("."):
            if any(ex in root_dir for ex in ["node_modules", "dist", ".git", "__pycache__"]):
                continue
            for f in files:
                if f.endswith(".json") and f not in ["package.json", "tsconfig.json", "metadata.json", "package-lock.json", ".eslintrc.json"]:
                    any_json.append(os.path.abspath(os.path.join(root_dir, f)))
        if any_json:
            print(os.path.normpath(any_json[0]), end="")
        else:
            print(os.path.abspath("draft_content.json"), end="")

def open_folder_dialog():
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        dir_path = filedialog.askdirectory(title=DIALOG_FOLDER_TITLE)
        if dir_path:
            print(os.path.normpath(dir_path), end="")
            return
    except Exception:
        pass
        
    found_dirs = []
    for root_dir, dirs, files in os.walk("."):
        if any(ex in root_dir for ex in ["node_modules", "dist", ".git", "__pycache__"]):
            continue
        for d in dirs:
            if d.lower() in ["sfx", "music", "assets", "audio"]:
                found_dirs.append(os.path.abspath(os.path.join(root_dir, d)))
    if found_dirs:
        print(os.path.normpath(found_dirs[0]), end="")
    else:
        print(os.path.abspath("."), end="")

class SceneAnalyzer:
    @staticmethod
    def analyze_ratio(media_w, media_h):
        if not media_w or not media_h:
            return RATIO_SQUARE
        ratio = media_w / media_h
        if ratio > 1.2:
            return RATIO_LANDSCAPE
        elif ratio < 0.8:
            return RATIO_PORTRAIT
        else:
            return RATIO_SQUARE

    @staticmethod
    def classify_scene_type(index, total_scenes, scene_text=""):
        if index == 0:
            return SCENE_HOOK
        important_keywords = ["quan trọng", "chú ý", "kết luận", "tóm lại", "important", "conclusion", "attention", "lưu ý"]
        is_important_text = any(kw in scene_text.lower() for kw in important_keywords)
        if index == total_scenes - 1 or is_important_text:
            return SCENE_IMPORTANT
        return SCENE_INFORMATION

class CanvasEngine:
    @staticmethod
    def calculate_fill_scale(media_w, media_h, canvas_w, canvas_h):
        if not media_w or not media_h:
            return 1.3
        fit_scale_w = canvas_w / media_w
        fit_scale_h = canvas_h / media_h
        fit_scale = min(fit_scale_w, fit_scale_h)
        fill_scale = max(fit_scale_w, fit_scale_h)
        if fit_scale > 0:
            scale_factor = fill_scale / fit_scale
            return max(1.0, min(scale_factor, 4.0))
        return 1.0

    @staticmethod
    def calculate_safe_crop_margin(motion_scale, fill_scale):
        if motion_scale <= 1.0:
            return 0.0, 0.0
        max_d = (motion_scale - 1.0) * 0.95
        max_dx = min(max_d, SAFE_TRANSFORM_X_MAX)
        max_dy = min(max_d, SAFE_TRANSFORM_Y_MAX)
        return max_dx, max_dy

class MotionEngine:
    MOTIONS = [
        MOTION_ZOOM_IN, MOTION_ZOOM_OUT, MOTION_PAN_LEFT, MOTION_PAN_RIGHT, 
        MOTION_PAN_UP, MOTION_PAN_DOWN, MOTION_PUSH_IN, MOTION_PULL_OUT, 
        MOTION_CORNER_LEFT, MOTION_CORNER_RIGHT, MOTION_KEN_BURNS, MOTION_STATIC_FOCUS
    ]
    
    MOTION_GROUPS = {
        "Zoom": [MOTION_ZOOM_IN, MOTION_ZOOM_OUT],
        "Pan": [MOTION_PAN_LEFT, MOTION_PAN_RIGHT, MOTION_PAN_UP, MOTION_PAN_DOWN],
        "Push": [MOTION_PUSH_IN, MOTION_PULL_OUT],
        "Corner": [MOTION_CORNER_LEFT, MOTION_CORNER_RIGHT],
        "Ken Burns": [MOTION_KEN_BURNS],
        "Static Focus": [MOTION_STATIC_FOCUS]
    }

    @staticmethod
    def select_motion(aspect_ratio, motion_history=None, motion_style="default"):
        if aspect_ratio == RATIO_LANDSCAPE:
            allowed = [MOTION_PAN_LEFT, MOTION_PAN_RIGHT, MOTION_ZOOM_IN, MOTION_ZOOM_OUT, MOTION_KEN_BURNS, MOTION_STATIC_FOCUS]
        elif aspect_ratio == RATIO_PORTRAIT:
            allowed = [MOTION_PAN_UP, MOTION_PAN_DOWN, MOTION_ZOOM_IN, MOTION_ZOOM_OUT, MOTION_PUSH_IN, MOTION_PULL_OUT, MOTION_STATIC_FOCUS]
        else:
            allowed = [MOTION_ZOOM_IN, MOTION_ZOOM_OUT, MOTION_CORNER_LEFT, MOTION_CORNER_RIGHT, MOTION_STATIC_FOCUS]

        w_zoom = WEIGHT_ZOOM
        w_pan = WEIGHT_PAN
        w_push = WEIGHT_PUSH
        w_corner = WEIGHT_CORNER
        w_kb = WEIGHT_KEN_BURNS
        w_static = 0.05
        
        if motion_style == GENRE_TIKTOK:
            w_zoom, w_pan, w_static = 2.0, 1.5, 0.0
            allowed = [m for m in allowed if m not in [MOTION_STATIC_FOCUS, MOTION_KEN_BURNS]]
        elif motion_style == GENRE_PODCAST:
            w_static, w_kb, w_zoom = 5.0, 2.0, 0.5
            allowed = [m for m in allowed if m in [MOTION_STATIC_FOCUS, MOTION_KEN_BURNS, MOTION_ZOOM_IN]]
        elif motion_style == GENRE_REVIEW:
            w_zoom = 3.0
            allowed = [m for m in allowed if m in [MOTION_ZOOM_IN, MOTION_PUSH_IN, MOTION_STATIC_FOCUS]]
        elif motion_style == GENRE_VLOG:
            w_pan, w_zoom, w_kb = 1.5, 1.5, 1.0
        elif motion_style == GENRE_STORY:
            w_kb, w_pan, w_zoom = 3.0, 2.0, 0.5
        elif motion_style == GENRE_NEWS:
            w_static, w_pan = 2.0, 1.5
            allowed = [m for m in allowed if m in [MOTION_STATIC_FOCUS, MOTION_PAN_UP, MOTION_PAN_DOWN, MOTION_PAN_LEFT, MOTION_PAN_RIGHT]]
            
        if not allowed:
            allowed = [MOTION_STATIC_FOCUS]

        if motion_history:
            filtered = [m for m in allowed if m not in motion_history]
            if filtered:
                allowed = filtered
            else:
                last_m = motion_history[-1]
                if last_m in allowed and len(allowed) > 1:
                    allowed = [m for m in allowed if m != last_m]

        weights = []
        for m in allowed:
            if m in MotionEngine.MOTION_GROUPS["Zoom"]:
                weights.append(w_zoom / len(MotionEngine.MOTION_GROUPS["Zoom"]))
            elif m in MotionEngine.MOTION_GROUPS["Pan"]:
                weights.append(w_pan / len(MotionEngine.MOTION_GROUPS["Pan"]))
            elif m in MotionEngine.MOTION_GROUPS["Push"]:
                weights.append(w_push / len(MotionEngine.MOTION_GROUPS["Push"]))
            elif m in MotionEngine.MOTION_GROUPS["Corner"]:
                weights.append(w_corner / len(MotionEngine.MOTION_GROUPS["Corner"]))
            elif m in MotionEngine.MOTION_GROUPS["Ken Burns"]:
                weights.append(w_kb)
            else:
                weights.append(w_static)

        total_w = sum(weights)
        if total_w > 0:
            weights = [w / total_w for w in weights]
        else:
            weights = [1.0 / len(allowed)] * len(allowed)

        return random.choices(allowed, weights=weights)[0]

    @staticmethod
    def build_keyframe(kf_id, time_offset, value, curve_type=CURVE_EASE_IN_OUT):
        return {
            "curveType": curve_type,
            "graphID": "",
            "left_control": {"x": 0.0, "y": 0.0},
            "right_control": {"x": 0.0, "y": 0.0},
            "id": kf_id,
            "time_offset": int(time_offset),
            "values": [float(value)]
        }

    @staticmethod
    def build_keyframe_list(property_type, keyframes):
        return {
            "id": uuid.uuid4().hex,
            "keyframe_list": keyframes,
            "material_id": "",
            "property_type": property_type
        }

    @staticmethod
    def apply_motion(segment, motion, duration_micros, fill_scale, canvas_w, canvas_h):
        duration_sec = duration_micros / 1000000.0
        
        if duration_sec <= 2.0:
            motion_scale = SCALE_MOTION_MAX
        elif duration_sec >= 8.0:
            motion_scale = SCALE_MOTION_MIN
        else:
            ratio = (duration_sec - 2.0) / 6.0
            motion_scale = SCALE_MOTION_MAX - ratio * (SCALE_MOTION_MAX - SCALE_MOTION_MIN)
            
        motion_scale = random.uniform(motion_scale - 0.01, motion_scale + 0.01)
        motion_scale = max(SCALE_MOTION_MIN, min(motion_scale, SCALE_MOTION_MAX))

        max_dx, max_dy = CanvasEngine.calculate_safe_crop_margin(motion_scale, fill_scale)

        start_rot = random.uniform(LIGHT_ROTATION_MIN, LIGHT_ROTATION_MAX)
        end_rot = random.uniform(LIGHT_ROTATION_MIN, LIGHT_ROTATION_MAX)
        start_rot = max(-MAX_ROTATION_DEGREE, min(start_rot, MAX_ROTATION_DEGREE))
        end_rot = max(-MAX_ROTATION_DEGREE, min(end_rot, MAX_ROTATION_DEGREE))

        scale_kfs = []
        pos_x_kfs = []
        pos_y_kfs = []
        rot_kfs = []

        if motion == MOTION_ZOOM_IN:
            scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, fill_scale))
            scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, fill_scale * motion_scale))
            pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, 0.0))
            pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))
            pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, 0.0))
            pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))

        elif motion == MOTION_ZOOM_OUT:
            scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, fill_scale * motion_scale))
            scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, fill_scale))
            pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, 0.0))
            pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))
            pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, 0.0))
            pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))

        elif motion in [MOTION_PAN_LEFT, MOTION_PAN_RIGHT, MOTION_PAN_UP, MOTION_PAN_DOWN, MOTION_CORNER_LEFT, MOTION_CORNER_RIGHT]:
            pan_scale = fill_scale * max(SAFE_PAN_MIN_SCALE, motion_scale)
            scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, pan_scale))
            scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, pan_scale))

            actual_motion_scale = pan_scale / fill_scale
            dx_limit, dy_limit = CanvasEngine.calculate_safe_crop_margin(actual_motion_scale, fill_scale)
            
            dx = dx_limit * random.uniform(0.8, 0.95)
            dy = dy_limit * random.uniform(0.8, 0.95)

            if pan_scale < SAFE_PAN_MIN_SCALE * fill_scale:
                dx = 0.0
                dy = 0.0

            if motion == MOTION_PAN_LEFT:
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, dx))
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, -dx))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, 0.0))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))
            elif motion == MOTION_PAN_RIGHT:
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, -dx))
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, dx))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, 0.0))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))
            elif motion == MOTION_PAN_UP:
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, 0.0))
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, -dy))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, dy))
            elif motion == MOTION_PAN_DOWN:
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, 0.0))
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, dy))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, -dy))
            elif motion == MOTION_CORNER_LEFT:
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, dx))
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, -dx))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, dy))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, -dy))
            elif motion == MOTION_CORNER_RIGHT:
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, -dx))
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, dx))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, dy))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, -dy))

        elif motion == MOTION_PUSH_IN:
            scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, fill_scale))
            scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, fill_scale * motion_scale))
            
            dx_limit, dy_limit = CanvasEngine.calculate_safe_crop_margin(motion_scale, fill_scale)
            dx = dx_limit * 0.7
            dy = dy_limit * 0.7
            
            pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, dx))
            pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))
            pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, dy))
            pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))

        elif motion == MOTION_PULL_OUT:
            scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, fill_scale * motion_scale))
            scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, fill_scale))
            
            dx_limit, dy_limit = CanvasEngine.calculate_safe_crop_margin(motion_scale, fill_scale)
            dx = dx_limit * 0.7
            dy = dy_limit * 0.7
            
            pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, 0.0))
            pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, dx))
            pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, 0.0))
            pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, dy))

        elif motion == MOTION_KEN_BURNS:
            kb_preset = random.choice(["TopLeft_to_Center", "Bottom_to_Top", "Corner_to_Corner"])
            if kb_preset == "TopLeft_to_Center":
                scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, fill_scale * 1.15))
                scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, fill_scale * 1.04))
                
                dx, dy = CanvasEngine.calculate_safe_crop_margin(1.15, fill_scale)
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, -dx * 0.9))
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, dy * 0.9))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))
            elif kb_preset == "Bottom_to_Top":
                scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, fill_scale * 1.14))
                scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, fill_scale * 1.14))
                
                dx, dy = CanvasEngine.calculate_safe_crop_margin(1.14, fill_scale)
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, 0.0))
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, -dy * 0.9))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, dy * 0.9))
            else:
                scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, fill_scale * 1.16))
                scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, fill_scale * 1.06))
                
                dx_start, dy_start = CanvasEngine.calculate_safe_crop_margin(1.16, fill_scale)
                dx_end, dy_end = CanvasEngine.calculate_safe_crop_margin(1.06, fill_scale)
                
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, -dx_start * 0.9))
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, dx_end * 0.9))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, -dy_start * 0.9))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, dy_end * 0.9))

        else:
            scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, fill_scale * 1.02))
            scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, fill_scale * 1.03))
            pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, 0.0))
            pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))
            pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, 0.0))
            pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))

        rot_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, start_rot))
        rot_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, end_rot))

        segment['common_keyframes'] = [
            MotionEngine.build_keyframe_list(KF_PROPERTY_SCALE, scale_kfs),
            MotionEngine.build_keyframe_list(KF_PROPERTY_POSITION_X, pos_x_kfs),
            MotionEngine.build_keyframe_list(KF_PROPERTY_POSITION_Y, pos_y_kfs),
            MotionEngine.build_keyframe_list(KF_PROPERTY_ROTATION, rot_kfs)
        ]

        clip_settings = segment.setdefault('clip', {})
        scale_settings = clip_settings.setdefault('scale', {})
        transform_settings = clip_settings.setdefault('transform', {})
        
        scale_settings['x'] = scale_kfs[0]['values'][0]
        scale_settings['y'] = scale_kfs[0]['values'][0]
        transform_settings['x'] = pos_x_kfs[0]['values'][0]
        transform_settings['y'] = pos_y_kfs[0]['values'][0]
        clip_settings['rotation'] = start_rot

        final_scale_display = scale_kfs[1]['values'][0] if len(scale_kfs) > 1 else scale_kfs[0]['values'][0]
        final_x_display = pos_x_kfs[1]['values'][0] if len(pos_x_kfs) > 1 else pos_x_kfs[0]['values'][0]
        final_y_display = pos_y_kfs[1]['values'][0] if len(pos_y_kfs) > 1 else pos_y_kfs[0]['values'][0]

        return motion, final_scale_display, final_x_display, final_y_display, start_rot

class TransitionEngine:
    TRANSITION_LIBRARY = {
        GENRE_TIKTOK: [
            {"name": "Flash", "effect_id": "6008016", "resource_id": "7108928014529069056", "path": ""},
            {"name": "Whip", "effect_id": "6008050", "resource_id": "7108928014529069090", "path": ""},
            {"name": "Glitch", "effect_id": "6008090", "resource_id": "7108928014529069130", "path": ""},
            {"name": "Zoom", "effect_id": "6008060", "resource_id": "7108928014529069100", "path": ""}
        ],
        GENRE_PODCAST: [
            {"name": "Cross Fade", "effect_id": "6008620", "resource_id": "7108928014529069058", "path": ""},
            {"name": "Blur", "effect_id": "6008020", "resource_id": "7108928014529069060", "path": ""}
        ],
        GENRE_REVIEW: [
            {"name": "Slide Left", "effect_id": "6008071", "resource_id": "7108928014529069111", "path": ""},
            {"name": "Slide Right", "effect_id": "6008072", "resource_id": "7108928014529069112", "path": ""},
            {"name": "Push", "effect_id": "6008075", "resource_id": "7108928014529069115", "path": ""}
        ],
        GENRE_VLOG: [
            {"name": "Zoom", "effect_id": "6008060", "resource_id": "7108928014529069100", "path": ""},
            {"name": "Motion Blur", "effect_id": "6008022", "resource_id": "7108928014529069062", "path": ""},
            {"name": "Cross Fade", "effect_id": "6008620", "resource_id": "7108928014529069058", "path": ""}
        ],
        GENRE_STORY: [
            {"name": "Dip to Black", "effect_id": "6008013", "resource_id": "7108928014529069053", "path": ""},
            {"name": "Cross Fade", "effect_id": "6008620", "resource_id": "7108928014529069058", "path": ""}
        ],
        GENRE_NEWS: [
            {"name": "Push", "effect_id": "6008075", "resource_id": "7108928014529069115", "path": ""},
            {"name": "Cross Fade", "effect_id": "6008620", "resource_id": "7108928014529069058", "path": ""}
        ],
        GENRE_DOCUMENTARY: [
            {"name": "Cross Fade", "effect_id": "6008620", "resource_id": "7108928014529069058", "path": ""},
            {"name": "Dip to Black", "effect_id": "6008013", "resource_id": "7108928014529069053", "path": ""},
            {"name": "Blur", "effect_id": "6008020", "resource_id": "7108928014529069060", "path": ""},
            {"name": "Pull In", "effect_id": "6008076", "resource_id": "7108928014529069116", "path": ""}
        ],
        GENRE_HISTORY: [
            {"name": "Film Burn", "effect_id": "6008035", "resource_id": "7108928014529069075", "path": ""},
            {"name": "Fade", "effect_id": "6008620", "resource_id": "7108928014529069058", "path": ""},
            {"name": "Flash", "effect_id": "6008016", "resource_id": "7108928014529069056", "path": ""},
            {"name": "Glitch", "effect_id": "6008090", "resource_id": "7108928014529069130", "path": ""}
        ],
        GENRE_ACTION: [
            {"name": "Whip", "effect_id": "6008050", "resource_id": "7108928014529069090", "path": ""},
            {"name": "Zoom", "effect_id": "6008060", "resource_id": "7108928014529069100", "path": ""},
            {"name": "Motion Blur", "effect_id": "6008022", "resource_id": "7108928014529069062", "path": ""},
            {"name": "Push", "effect_id": "6008075", "resource_id": "7108928014529069115", "path": ""},
            {"name": "Slide Left", "effect_id": "6008071", "resource_id": "7108928014529069111", "path": ""},
            {"name": "Slide Right", "effect_id": "6008072", "resource_id": "7108928014529069112", "path": ""}
        ]
    }

    @staticmethod
    def select_transition(genre=GENRE_DOCUMENTARY, transition_history=None):
        pool = TransitionEngine.TRANSITION_LIBRARY.get(genre, TransitionEngine.TRANSITION_LIBRARY[GENRE_DOCUMENTARY])
        allowed = [t for t in pool]
        
        if transition_history:
            filtered = [t for t in allowed if t["name"] not in transition_history]
            if filtered:
                allowed = filtered
            else:
                last_t = transition_history[-1]
                if last_t in [x["name"] for x in allowed] and len(allowed) > 1:
                    allowed = [t for t in allowed if t["name"] != last_t]
                    
        return random.choice(allowed)

    @staticmethod
    def calculate_duration(clip_duration_micros):
        duration_sec = clip_duration_micros / 1000000.0
        if duration_sec <= 2.0:
            return 100000
        elif duration_sec >= 8.0:
            return 300000
        else:
            ratio = (duration_sec - 2.0) / 6.0
            ms = 100 + ratio * 200
            return int(ms * 1000)

def kill_capcut_processes():
    try:
        import subprocess
        import time
        res_cc = subprocess.run(CMD_KILL_CAPCUT, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        res_jy = subprocess.run(CMD_KILL_JIANYING, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        killed_any = (res_cc.returncode == 0) or (res_jy.returncode == 0)
        
        logging.info(LOG_WAIT_CLOSE)
        if killed_any:
            logging.info(LOG_PROCESS_KILLED)
            time.sleep(5.0) 
        else:
            time.sleep(3.0)
    except Exception:
        pass

def process_capcut_ultra(input_json_path, output_json_path, opts):
    kill_capcut_processes()
    logging.info(LOG_START_PROCESS.format(input_json_path))
    logging.info(LOG_OPTS.format(opts))

    if opts.get('seed') is not None:
        random.seed(opts.get('seed'))

    with open(input_json_path, READ_MODE, encoding=UTF8_ENCODING) as f:
        data = json.load(f)

    materials = data.setdefault(MATERIALS_ATTR, {})
    videos_mat = materials.setdefault(VIDEOS_ATTR, [])
    audios_mat = materials.setdefault(AUDIOS_ATTR, [])
    transitions_mat = materials.setdefault(TRANSITIONS_ATTR, [])
    
    vid_dict = {m[ID_ATTR]: m for m in videos_mat if m.get(TYPE_ATTR) in [PHOTO_TYPE_KEY, VIDEO_TYPE_KEY]}
    aud_dict = {m[ID_ATTR]: m for m in audios_mat}

    tracks = data.setdefault(TRACKS_ATTR, [])
    
    canvas_w = 1080
    canvas_h = 1920
    canvas_config = data.get('canvas_config') or data.get('settings', {}).get('canvas_config', {})
    if canvas_config and canvas_config.get('width') and canvas_config.get('height'):
        canvas_w = canvas_config.get('width')
        canvas_h = canvas_config.get('height')
        
    all_video_segments = []
    all_audio_segments = []
    for t in tracks:
        if t.get(TYPE_ATTR) == VIDEO_TYPE_KEY:
            for seg in t.get(SEGMENTS_ATTR, []):
                mat_id = seg.get('material_id')
                if mat_id in vid_dict:
                    all_video_segments.append({'segment': seg, 'material': vid_dict[mat_id], 'track': t})
        elif t.get(TYPE_ATTR) == AUDIO_TYPE_KEY:
            for seg in t.get(SEGMENTS_ATTR, []):
                mat_id = seg.get('material_id')
                if mat_id in aud_dict:
                    all_audio_segments.append({'segment': seg, 'material': aud_dict[mat_id], 'track': t})

    all_video_segments.sort(key=lambda x: x['segment'].get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0))
    all_audio_segments.sort(key=lambda x: x['segment'].get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0))

    main_video_track = None
    max_vid_segs = -1
    main_audio_track = None
    max_aud_segs = -1
    
    for t in tracks:
        if t.get(TYPE_ATTR) == VIDEO_TYPE_KEY:
            segs = t.get(SEGMENTS_ATTR, [])
            media_count = sum(1 for s in segs if s.get(ID_ATTR) in vid_dict or s.get('material_id') in vid_dict)
            if media_count > max_vid_segs:
                max_vid_segs = media_count
                main_video_track = t
        elif t.get(TYPE_ATTR) == AUDIO_TYPE_KEY:
            segs = t.get(SEGMENTS_ATTR, [])
            media_count = sum(1 for s in segs if s.get(ID_ATTR) in aud_dict or s.get('material_id') in aud_dict)
            if media_count > max_aud_segs:
                max_aud_segs = media_count
                main_audio_track = t

    photo_segments = []
    audio_segments = []
    
    if main_video_track:
        for seg in main_video_track.get(SEGMENTS_ATTR, []):
            mat_id = seg.get('material_id')
            if mat_id in vid_dict:
                photo_segments.append({'segment': seg, 'material': vid_dict[mat_id]})
            
    if main_audio_track:
        for seg in main_audio_track.get(SEGMENTS_ATTR, []):
            mat_id = seg.get('material_id')
            if mat_id in aud_dict:
                audio_segments.append({'segment': seg, 'material': aud_dict[mat_id]})

    photo_segments.sort(key=lambda x: x['segment'].get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0))
    audio_segments.sort(key=lambda x: x['segment'].get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0))

    num_photos = len(photo_segments)
    num_audios = len(audio_segments)
    logging.info(LOG_COUNT_PHOTOS.format(num_photos))
    logging.info(LOG_COUNT_AUDIOS.format(num_audios))

    if len(all_video_segments) == 0 and len(all_audio_segments) == 0:
        raise Exception(ERR_NO_MEDIA)

    if opts.get('clear_transitions'):
        logging.info(LOG_CLEAR_TRANSITIONS)
        trans_ids = {t['id'] for t in transitions_mat}
        for p_item in all_video_segments:
            seg = p_item['segment']
            if TRANSITION_ATTR in seg:
                del seg[TRANSITION_ATTR]
            if EXTRA_REFS_ATTR in seg:
                seg[EXTRA_REFS_ATTR] = [ref for ref in seg[EXTRA_REFS_ATTR] if ref not in trans_ids]
        transitions_mat.clear()

    timeline_modifying = any(opts.get(k) for k in [OPT_SYNC_IMAGE_TO_AUDIO, OPT_CUSTOM_AUDIO_ORDER, OPT_RANDOMIZE_VIDEO, OPT_REVERSE_TIMELINE])

    if timeline_modifying:
        if num_photos == 0 or num_audios == 0:
            raise Exception(ERR_NO_TIMELINE_MOD)

        if opts.get(OPT_SYNC_IMAGE_TO_AUDIO):
            if num_audios == 1 and num_photos > 1:
                logging.info(f"-> Chế độ Unified Audio: Chia đều 1 âm thanh cho {num_photos} ảnh.")
                pass
            elif num_photos < num_audios and num_photos > 0:
                logging.info(LOG_DUP_INFO.format(num_photos, num_audios))
                while len(photo_segments) < num_audios:
                    last_item = photo_segments[-1]
                    new_seg = copy.deepcopy(last_item['segment'])
                    new_seg['id'] = DUP_PHOTO_PREFIX.format(uuid.uuid4().hex[:8])
                    main_video_track['segments'].append(new_seg)
                    photo_segments.append({'segment': new_seg, 'material': last_item['material']})
                num_photos = len(photo_segments)
            elif num_photos > num_audios:
                logging.info(LOG_DEL_INFO.format(num_photos, num_audios))
                extra_photos = photo_segments[num_audios:]
                for item in extra_photos:
                    if item['segment'] in main_video_track['segments']:
                        main_video_track['segments'].remove(item['segment'])
                photo_segments = photo_segments[:num_audios]
                num_photos = len(photo_segments)

        target_count = num_photos if (num_audios == 1 and num_photos > 1) else min(num_photos, num_audios)

        scenes = []
        for i in range(target_count):
            p_item = photo_segments[i]
            a_item = audio_segments[0] if (num_audios == 1) else audio_segments[i]
            p_seg = p_item['segment']
            p_start = p_seg.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0)
            p_dur = p_seg.get(TARGET_TIMERANGE_ATTR, {}).get(DURATION_ATTR, 0)
            p_end = p_start + p_dur
            
            scene_texts = []
            for text_track in [t for t in tracks if t.get('type') == 'text']:
                for text_seg in text_track.get('segments', []):
                    t_start = text_seg.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0)
                    if p_start <= t_start < p_end:
                        scene_texts.append(text_seg)
                        
            scenes.append({
                "photo": p_item,
                "audio": a_item,
                "texts": scene_texts,
                "original_duration": p_dur,
                "original_start": p_start
            })

        if opts.get(OPT_CUSTOM_AUDIO_ORDER) and opts.get(OPT_AUDIO_ORDER_LIST):
            order_str = opts.get(OPT_AUDIO_ORDER_LIST)
            logging.info(LOG_CUSTOM_ORDER.format(order_str))
            keywords = [k.strip().lower() for k in order_str.split(",") if k.strip()]
            
            def get_scene_priority(scene):
                filename = os.path.basename(scene["audio"]['material'].get(PATH_ATTR, "")).lower()
                for index, keyword in enumerate(keywords):
                    if keyword in filename:
                        return index
                return len(keywords)
                
            scenes.sort(key=get_scene_priority)

        if opts.get(OPT_RANDOMIZE_VIDEO):
            logging.info(LOG_RANDOMIZING)
            random.shuffle(scenes)

        if opts.get(OPT_REVERSE_TIMELINE):
            logging.info(LOG_REVERSING)
            scenes.reverse()

        logging.info(LOG_SYNCING.format(target_count))
        current_time = 0
        motion_history = []
        
        is_unified_audio = (num_audios == 1 and num_photos > 1)
        if is_unified_audio:
            single_audio_path = audio_segments[0]['material'][PATH_ATTR]
            total_audio_duration = get_audio_duration_micros(single_audio_path)
            unified_photo_dur = int(total_audio_duration / num_photos) if num_photos > 0 else 0
            
            audio_segments[0]['segment'][SOURCE_TIMERANGE_ATTR] = {START_ATTR: 0, DURATION_ATTR: total_audio_duration}
            audio_segments[0]['segment'][TARGET_TIMERANGE_ATTR] = {START_ATTR: 0, DURATION_ATTR: total_audio_duration}
            audio_segments[0]['material'][DURATION_ATTR] = total_audio_duration

        for i, scene in enumerate(scenes):
            p_item = scene["photo"]
            a_item = scene["audio"]
            p_seg = p_item['segment']
            a_seg = a_item['segment']
            
            audio_path = a_item['material'][PATH_ATTR]
            audio_duration = get_audio_duration_micros(audio_path)
            
            if not is_unified_audio:
                a_seg[SOURCE_TIMERANGE_ATTR] = {START_ATTR: 0, DURATION_ATTR: audio_duration}
                a_seg[TARGET_TIMERANGE_ATTR] = {START_ATTR: current_time, DURATION_ATTR: audio_duration}
                a_item['material'][DURATION_ATTR] = audio_duration
            
            if opts.get(OPT_SYNC_IMAGE_TO_AUDIO):
                photo_duration = unified_photo_dur if is_unified_audio else audio_duration
            else:
                photo_duration = scene["original_duration"]

            p_seg[TARGET_TIMERANGE_ATTR] = {START_ATTR: current_time, DURATION_ATTR: photo_duration}
            p_seg[SOURCE_TIMERANGE_ATTR] = {START_ATTR: 0, DURATION_ATTR: photo_duration}
            
            if p_item['material'].get(TYPE_ATTR) == VIDEO_TYPE_KEY:
                p_item['material'][DURATION_ATTR] = photo_duration

            orig_start = scene["original_start"]
            orig_dur = scene["original_duration"]
            for text_seg in scene["texts"]:
                t_orig_start = text_seg.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0)
                t_offset = t_orig_start - orig_start
                if orig_dur > 0:
                    ratio = photo_duration / orig_dur
                    new_offset = int(t_offset * ratio)
                    new_dur = int(text_seg.get(TARGET_TIMERANGE_ATTR, {}).get(DURATION_ATTR, 0) * ratio)
                else:
                    new_offset = 0
                    new_dur = photo_duration
                    
                text_seg[TARGET_TIMERANGE_ATTR] = {
                    START_ATTR: current_time + new_offset,
                    DURATION_ATTR: new_dur
                }
                if text_seg.get(SOURCE_TIMERANGE_ATTR):
                    text_seg[SOURCE_TIMERANGE_ATTR][DURATION_ATTR] = new_dur

            scene_text = ""
            for text_seg in scene["texts"]:
                mat_id = text_seg.get('material_id')
                for tm in data.get('materials', {}).get('texts', []):
                    if tm.get('id') == mat_id:
                        try:
                            c_dict = json.loads(tm.get('content', '{}'))
                            scene_text = c_dict.get('text', '')
                        except: pass
                        break
            
            media_path = p_item['material'].get(PATH_ATTR)
            dims = get_media_dimensions(media_path)
            media_w, media_h = dims if dims else (1920, 1080)
            
            aspect_ratio = SceneAnalyzer.analyze_ratio(media_w, media_h)
            fill_scale = CanvasEngine.calculate_fill_scale(media_w, media_h, canvas_w, canvas_h)
            
            if opts.get(OPT_AUTO_FILL_CANVAS):
                clip_settings = p_seg.setdefault('clip', {})
                scale_settings = clip_settings.setdefault('scale', {})
                scale_settings['x'] = fill_scale
                scale_settings['y'] = fill_scale

            applied_motion = "None"
            final_scale, final_x, final_y, final_rot = fill_scale, 0.0, 0.0, 0.0
            if opts.get(OPT_DYNAMIC_MOTION):
                motion = MotionEngine.select_motion(aspect_ratio, motion_history, opts.get("_motion_style", "default"))
                applied_motion, final_scale, final_x, final_y, final_rot = MotionEngine.apply_motion(
                    p_seg, motion, photo_duration, fill_scale, canvas_w, canvas_h
                )
                motion_history.append(motion)
                if len(motion_history) > 3:
                    motion_history.pop(0)
            
            scene_type = SceneAnalyzer.classify_scene_type(i, target_count, scene_text)
            logging.info(LOG_SCENE_DETAIL.format(i+1, aspect_ratio, scene_type, applied_motion, final_scale, final_x, final_y, final_rot))

            current_time += photo_duration
        total_duration = current_time
        data['duration'] = total_duration
    else:
        logging.info(LOG_NO_TIMELINE_CHANGE)
        total_duration = data.get('duration', 0)
        if total_duration <= 0:
            for t in tracks:
                for seg in t.get(SEGMENTS_ATTR, []):
                    seg_end = seg.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0) + seg.get(TARGET_TIMERANGE_ATTR, {}).get(DURATION_ATTR, 0)
                    if seg_end > total_duration:
                        total_duration = seg_end
        data['duration'] = total_duration

        motion_history = []
        for i, p_item in enumerate(all_video_segments):
            p_seg = p_item['segment']
            media_path = p_item['material'].get(PATH_ATTR)
            dims = get_media_dimensions(media_path)
            media_w, media_h = dims if dims else (1920, 1080)
            
            aspect_ratio = SceneAnalyzer.analyze_ratio(media_w, media_h)
            fill_scale = CanvasEngine.calculate_fill_scale(media_w, media_h, canvas_w, canvas_h)
            photo_duration = p_seg.get(TARGET_TIMERANGE_ATTR, {}).get(DURATION_ATTR, 0)

            if opts.get(OPT_AUTO_FILL_CANVAS):
                clip_settings = p_seg.setdefault('clip', {})
                scale_settings = clip_settings.setdefault('scale', {})
                scale_settings['x'] = fill_scale
                scale_settings['y'] = fill_scale

            applied_motion = "None"
            final_scale, final_x, final_y, final_rot = fill_scale, 0.0, 0.0, 0.0
            if opts.get(OPT_DYNAMIC_MOTION):
                motion = MotionEngine.select_motion(aspect_ratio, motion_history, opts.get("_motion_style", "default"))
                applied_motion, final_scale, final_x, final_y, final_rot = MotionEngine.apply_motion(
                    p_seg, motion, photo_duration, fill_scale, canvas_w, canvas_h
                )
                motion_history.append(motion)
                if len(motion_history) > 3:
                    motion_history.pop(0)
                
            logging.info(LOG_SCENE_DETAIL_SIMPLE.format(i+1, aspect_ratio, applied_motion, final_scale, final_x, final_y, final_rot))

    if opts.get(OPT_NORMALIZE_VOLUME):
        logging.info(LOG_NORMALIZE)
        for a_item in all_audio_segments:
            mat = a_item['material']
            mat[VOLUME_ATTR] = 1.0
            seg = a_item['segment']
            if 'volume' in seg:
                if isinstance(seg['volume'], dict):
                    seg['volume']['volume'] = 1.0
                else:
                    seg['volume'] = 1.0

    if opts.get(OPT_ULTRA_MUSIC_MIX):
        logging.info(LOG_MIXING)
        bgm_files = []
        dirs_to_scan = []
        if opts.get(OPT_SFX_FOLDER):
            dirs_to_scan.append(opts.get(OPT_SFX_FOLDER))
        dirs_to_scan.append(os.path.dirname(input_json_path))
        
        for d in list(dirs_to_scan):
            music_sub = os.path.join(d, 'music')
            bgm_sub = os.path.join(d, 'bgm')
            if os.path.exists(music_sub): dirs_to_scan.append(music_sub)
            if os.path.exists(bgm_sub): dirs_to_scan.append(bgm_sub)
            
        valid_exts = ('.mp3', '.wav', '.m4a', '.aac', '.flac')
        for d in dirs_to_scan:
            if os.path.exists(d) and os.path.isdir(d):
                for f in os.listdir(d):
                    if f.lower().endswith(valid_exts):
                        bgm_files.append(os.path.join(d, f))
                        
        music_keywords = ["music", "bgm", "nhac", "beat", "instrumental", "background"]
        music_files = [f for f in bgm_files if any(k in os.path.basename(f).lower() for k in music_keywords)]
        if not music_files:
            music_files = bgm_files
            
        if music_files:
            bgm_track = next((t for t in tracks if t.get('name') == BGM_TRACK_NAME), None)
            if bgm_track:
                bgm_track['segments'].clear()
            else:
                bgm_track_id = BGM_TRACK_ID_PREFIX.format(uuid.uuid4().hex[:8])
                bgm_track = {
                    "id": bgm_track_id,
                    "type": "audio",
                    "name": BGM_TRACK_NAME,
                    "segments": []
                }
                tracks.append(bgm_track)
            
            current_bgm_time = 0
            while current_bgm_time < total_duration:
                chosen_music = random.choice(music_files)
                music_dur = get_audio_duration_micros(chosen_music)
                mat_id = BGM_MAT_ID_PREFIX.format(uuid.uuid4().hex[:8])
                new_mat = {
                    "id": mat_id,
                    "name": os.path.basename(chosen_music),
                    "path": chosen_music.replace("\\", "/"),
                    "duration": music_dur,
                    "type": "audio",
                    "volume": 0.15
                }
                audios_mat.append(new_mat)
                
                seg_dur = min(music_dur, total_duration - current_bgm_time)
                seg_id = BGM_SEG_ID_PREFIX.format(uuid.uuid4().hex[:8])
                new_seg = {
                    "id": seg_id,
                    "material_id": mat_id,
                    "source_timerange": {"start": 0, "duration": seg_dur},
                    "target_timerange": {"start": current_bgm_time, "duration": seg_dur},
                    "volume": {"volume": 0.15}
                }
                bgm_track["segments"].append(new_seg)
                current_bgm_time += seg_dur
        else:
            logging.info(LOG_NO_BGM_FOUND)

    if opts.get(OPT_AUTO_TRANSITION):
        logging.info(LOG_INSERT_TRANSITIONS)
        template_transition = transitions_mat[0] if transitions_mat else None
        target_video_segs = photo_segments if timeline_modifying else [v['segment'] for v in all_video_segments]
        
        genre = opts.get("_transition_style", "default")
        if genre == "default":
            genre = GENRE_DOCUMENTARY
            
        if genre == "none":
            return
            
        transition_history = []
        for i in range(len(target_video_segs) - 1):
            p_seg = target_video_segs[i]
            if TRANSITION_ATTR not in p_seg:
                trans_choice = TransitionEngine.select_transition(genre, transition_history)
                transition_history.append(trans_choice["name"])
                if len(transition_history) > 3:
                    transition_history.pop(0)
                
                trans_id = f"{TRANS_PREFIX}{uuid.uuid4().hex[:8]}"
                clip_dur = p_seg.get(TARGET_TIMERANGE_ATTR, {}).get(DURATION_ATTR, DEFAULT_FALLBACK_DURATION)
                trans_dur = TransitionEngine.calculate_duration(clip_dur)
                
                if template_transition:
                    trans_mat = copy.deepcopy(template_transition)
                    trans_mat[ID_ATTR] = trans_id
                    trans_mat[NAME_ATTR] = trans_choice["name"]
                    trans_mat[DURATION_ATTR] = trans_dur
                    trans_mat["effect_id"] = trans_choice["effect_id"]
                    trans_mat["resource_id"] = trans_choice["resource_id"]
                else:
                    trans_mat = {
                        "category_name": "transition",
                        "duration": trans_dur,
                        "effect_id": trans_choice["effect_id"],
                        "id": trans_id,
                        "name": trans_choice["name"],
                        "path": trans_choice["path"],
                        "resource_id": trans_choice["resource_id"],
                        "type": "transition"
                    }
                transitions_mat.append(trans_mat)
                p_seg[TRANSITION_ATTR] = {
                    ID_ATTR: trans_id,
                    DURATION_ATTR: trans_dur
                }
                if EXTRA_REFS_ATTR not in p_seg:
                    p_seg[EXTRA_REFS_ATTR] = []
                p_seg[EXTRA_REFS_ATTR].append(trans_id)

    if opts.get(OPT_AUTO_SUBTITLES):
        logging.info(LOG_SUBTITLES)
        text_materials = data.get('materials', {}).get('texts', [])
        for tm in text_materials:
            try:
                content_str = tm.get('content', '')
                if not content_str:
                    continue
                c_dict = json.loads(content_str)
                
                c_dict['font_size'] = 12.0
                c_dict['text_color'] = '#FFCC00'
                c_dict['has_stroke'] = True
                c_dict['stroke_color'] = '#000000'
                c_dict['stroke_width'] = 0.15
                c_dict['has_shadow'] = True
                c_dict['shadow_color'] = '#000000'
                c_dict['shadow_alpha'] = 0.8
                c_dict['shadow_blur'] = 0.15
                c_dict['align_type'] = 1
                c_dict['font_name'] = FONT_INTER
                
                tm['content'] = json.dumps(c_dict, ensure_ascii=False)
            except Exception as e:
                logging.info(ERR_SUBTITLE_CONFIG.format(e))

    if opts.get(OPT_AI_SFX_GENERATOR) and opts.get(OPT_SFX_FOLDER):
        logging.info(LOG_AI_SFX)
        sfx_dir = opts.get(OPT_SFX_FOLDER)
        if os.path.exists(sfx_dir) and os.path.isdir(sfx_dir):
            valid_exts = ('.mp3', '.wav', '.m4a', '.aac', '.flac')
            all_sfx_files = [f for f in os.listdir(sfx_dir) if f.lower().endswith(valid_exts)]
            
            if all_sfx_files:
                scenes_desc = []
                target_scenes_for_sfx = list(scenes) if timeline_modifying else []
                
                if not target_scenes_for_sfx:
                    for i, v_item in enumerate(all_video_segments):
                        p_seg = v_item['segment']
                        p_start = p_seg.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0)
                        p_dur = p_seg.get(TARGET_TIMERANGE_ATTR, {}).get(DURATION_ATTR, 0)
                        p_end = p_start + p_dur
                        
                        scene_texts = []
                        for text_track in [t for t in tracks if t.get('type') == 'text']:
                            for text_seg in text_track.get('segments', []):
                                t_start = text_seg.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0)
                                if p_start <= t_start < p_end:
                                    scene_texts.append(text_seg)
                        
                        target_scenes_for_sfx.append({
                            "photo": v_item,
                            "texts": scene_texts,
                            "original_duration": p_dur,
                            "original_start": p_start
                        })
                
                for i, scene in enumerate(target_scenes_for_sfx):
                    overlapping_text = ""
                    for text_seg in scene["texts"]:
                        mat_id = text_seg.get('material_id')
                        for tm in data.get('materials', {}).get('texts', []):
                            if tm.get('id') == mat_id:
                                try:
                                    c_dict = json.loads(tm.get('content', '{}'))
                                    overlapping_text = c_dict.get('text', '')
                                except: pass
                                break
                    scene_label = overlapping_text or f"Scene {i+1} (Image: {scene['photo']['material'].get(NAME_ATTR)})"
                    scenes_desc.append({"index": i, "description": scene_label})
                
                gemini_api_key = opts.get(OPT_API_KEY)
                sfx_mapping = {}
                if gemini_api_key:
                    try:
                        logging.info(LOG_GEMINI_API_REQUEST)
                        scenes_text = json.dumps(scenes_desc, ensure_ascii=False, indent=2)
                        sfx_list_str = "\n".join(all_sfx_files)
                        
                        prompt = PROMPT_TEMPLATE.format(scenes_text, sfx_list_str)
                        
                        res_text = call_gemini(gemini_api_key, prompt)
                        res_text = re.sub(r'```json|```', '', res_text).strip()
                        mapping_data = json.loads(res_text)
                        for item in mapping_data.get("sfx_mapping", []):
                            idx = item.get("scene_index")
                            fn = item.get("sfx_filename")
                            if fn and fn in all_sfx_files:
                                sfx_mapping[idx] = fn
                    except Exception as gem_err:
                        logging.info(LOG_SFX_GEMINI_ERR.format(gem_err))
                        gemini_api_key = None
                        
                if not gemini_api_key:
                    logging.info(LOG_SFX_AUTO_MATCH)
                    for item in scenes_desc:
                        idx = item["index"]
                        desc = item["description"].lower()
                        matched_file = None
                        for f in all_sfx_files:
                            f_clean = os.path.splitext(f)[0].lower()
                            f_words = re.split(r'[-_\s]+', f_clean)
                            if any(w in desc for w in f_words if len(w) > 2):
                                matched_file = f
                                break
                        if matched_file:
                            sfx_mapping[idx] = matched_file
                
                if sfx_mapping:
                    logging.info(LOG_SFX_MATCH_SUCCESS.format(len(sfx_mapping)))
                    sfx_track = next((t for t in tracks if t.get('name') == SFX_TRACK_NAME), None)
                    if sfx_track:
                        sfx_track['segments'].clear()
                    else:
                        sfx_track_id = SFX_TRACK_ID_PREFIX.format(uuid.uuid4().hex[:8])
                        sfx_track = {
                            "id": sfx_track_id,
                            "type": "audio",
                            "name": SFX_TRACK_NAME,
                            "segments": []
                        }
                        tracks.append(sfx_track)
                    
                    for idx, sfx_file in sfx_mapping.items():
                        if idx >= len(target_scenes_for_sfx):
                            continue
                        scene_start = target_scenes_for_sfx[idx]['original_start'] if not timeline_modifying else target_scenes_for_sfx[idx]['photo']['segment'].get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0)
                        
                        full_sfx_path = os.path.join(sfx_dir, sfx_file)
                        sfx_dur = get_audio_duration_micros(full_sfx_path)
                        
                        mat_id = SFX_MAT_ID_PREFIX.format(uuid.uuid4().hex[:8])
                        new_mat = {
                            "id": mat_id,
                            "name": sfx_file,
                            "path": full_sfx_path.replace("\\", "/"),
                            "duration": sfx_dur,
                            "type": "audio",
                            "volume": 0.8
                        }
                        audios_mat.append(new_mat)
                        
                        seg_id = SFX_SEG_ID_PREFIX.format(uuid.uuid4().hex[:8])
                        new_seg = {
                            "id": seg_id,
                            "material_id": mat_id,
                            "source_timerange": {"start": 0, "duration": sfx_dur},
                            "target_timerange": {"start": scene_start, "duration": sfx_dur},
                            "volume": {"volume": 0.8}
                        }
                        sfx_track["segments"].append(new_seg)
                else:
                    logging.info(LOG_NO_SFX_MATCH)
            else:
                logging.info(LOG_NO_SFX_DIR)

    for t in tracks:
        if SEGMENTS_ATTR in t:
            t[SEGMENTS_ATTR].sort(key=lambda s: s.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0))

    with open(output_json_path, WRITE_MODE, encoding=UTF8_ENCODING) as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    logging.info(LOG_SUCCESS)
    return True

import tempfile
import subprocess

def export_video_with_ffmpeg(draft_json_path, opts):
    try:
        export_output_dir = opts.get("video_output_dir", "").strip()
        if not export_output_dir:
            logging.info(LOG_EXPORT_NO_DIR)
            return
            
        logging.info(LOG_EXPORT_STARTING)
        
        with open(draft_json_path, 'r', encoding='utf-8') as f:
            draft_content = json.load(f)
            
        materials = draft_content.get('materials', {})
        videos = materials.get('videos', [])
        audios = materials.get('audios', [])
        
        tracks = draft_content.get('tracks', [])
        video_track = next((t for t in tracks if t.get('type') == 'video'), None)
        audio_track = next((t for t in tracks if t.get('type') == 'audio' and t.get('name') not in ['BGM Track', 'SFX Track']), None)
        
        image_segs = sorted(video_track.get('segments', []) if video_track else [], key=lambda s: s.get('target_timerange', {}).get('start', 0))
        audio_segs = sorted(audio_track.get('segments', []) if audio_track else [], key=lambda s: s.get('target_timerange', {}).get('start', 0))
        
        video_mat_map = {v['id']: (v.get('path') or v.get('file_Path')) for v in videos if 'id' in v and (v.get('path') or v.get('file_Path'))}
        audio_mat_map = {a['id']: (a.get('path') or a.get('file_Path')) for a in audios if 'id' in a and (a.get('path') or a.get('file_Path'))}
        
        image_items = []
        for seg in image_segs:
            mat_id = seg.get('material_id')
            mat_path = video_mat_map.get(mat_id)
            if mat_path and os.path.exists(mat_path):
                dur_us = seg.get('target_timerange', {}).get('duration', 5000000)
                image_items.append({'path': mat_path, 'duration': dur_us / 1000000.0})
                
        if not image_items:
            logging.info(LOG_EXPORT_NO_MEDIA)
            return
            
        audio_items = []
        for seg in audio_segs:
            mat_id = seg.get('material_id')
            mat_path = audio_mat_map.get(mat_id)
            if mat_path and os.path.exists(mat_path):
                audio_items.append(mat_path)
                
        export_unique_id = uuid.uuid4().hex[:8]
        main_audio_path = None
        audio_list_file_path = None
        if len(audio_items) == 1:
            main_audio_path = audio_items[0]
        elif len(audio_items) > 1:
            audio_list_file_path = os.path.join(tempfile.gettempdir(), f"ffmpeg_audlist_{export_unique_id}.txt")
            with open(audio_list_file_path, 'w', encoding='utf-8') as f:
                for item in audio_items:
                    posix_path = item.replace('\\', '/')
                    posix_path = posix_path.replace("'", "'\\''")
                    f.write(f"file '{posix_path}'\n")
                    
        if not audio_items:
            logging.info(LOG_EXPORT_NO_AUDIO)
            
        logging.info(LOG_EXPORT_RENDERING.format(len(image_items), len(audio_items)))
        
        os.makedirs(export_output_dir, exist_ok=True)
        
        export_unique_id = uuid.uuid4().hex[:8]
        list_file_path = os.path.join(tempfile.gettempdir(), f"ffmpeg_imglist_{export_unique_id}.txt")
        
        with open(list_file_path, 'w', encoding='utf-8') as f:
            for item in image_items:
                posix_path = item['path'].replace('\\', '/')
                posix_path = posix_path.replace("'", "'\\''")
                f.write(f"file '{posix_path}'\n")
                f.write(f"duration {item['duration']:.3f}\n")
            if image_items:
                posix_path = image_items[-1]['path'].replace('\\', '/')
                posix_path = posix_path.replace("'", "'\\''")
                f.write(f"file '{posix_path}'\n")
                
        project_name = opts.get("project_name", "capcut_export").strip()
        if not project_name:
            project_name = "capcut_export"
        safe_label = re.sub(r'[^a-zA-Z0-9_\-]', '_', project_name)
        out_video_path = os.path.join(export_output_dir, f"{safe_label}_{export_unique_id}.mp4")
        
        ffmpeg_cmd = ['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_file_path]
        if audio_list_file_path:
            ffmpeg_cmd.extend(['-f', 'concat', '-safe', '0', '-i', audio_list_file_path])
        elif main_audio_path:
            ffmpeg_cmd.extend(['-i', main_audio_path])
            
        ffmpeg_cmd.extend([
            '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '26',
            '-r', '30',
            '-threads', '0',
            '-pix_fmt', 'yuv420p'
        ])
        
        if audio_list_file_path or main_audio_path:
            ffmpeg_cmd.extend(['-c:a', 'aac', '-b:a', '192k'])
        else:
            ffmpeg_cmd.extend(['-an'])
            
        ffmpeg_cmd.extend(['-y', out_video_path])
        
        ffmpeg_exe = 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg'
        static_ffmpeg1 = os.path.join(os.getcwd(), ffmpeg_exe)
        static_ffmpeg2 = os.path.join(os.path.dirname(__file__), '..', ffmpeg_exe)
        
        if os.path.exists(static_ffmpeg1):
            ffmpeg_cmd[0] = static_ffmpeg1
        elif os.path.exists(static_ffmpeg2):
            ffmpeg_cmd[0] = static_ffmpeg2
            
        process = subprocess.Popen(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
        for line in iter(process.stdout.readline, ''):
            if line.strip():
                logging.info(f"[ffmpeg] {line.strip()}")
                
        process.stdout.close()
        return_code = process.wait()
        
        try:
            if os.path.exists(list_file_path):
                os.remove(list_file_path)
        except:
            pass
            
        if return_code == 0:
            logging.info(LOG_EXPORT_SUCCESS.format(out_video_path))
        else:
            logging.info(LOG_EXPORT_FAIL.format(return_code))
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        logging.info(LOG_EXPORT_ERR.format(str(e)))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        logging.info(ERR_CLI_USAGE)
        sys.exit(1)
        
    cmd_arg = sys.argv[1]
    
    if cmd_arg == CMD_SELECT_FILE:
        open_file_dialog()
        sys.exit(0)
    elif cmd_arg == CMD_SELECT_FOLDER:
        open_folder_dialog()
        sys.exit(0)
        
    if len(sys.argv) < 3:
        logging.info(ERR_CLI_USAGE)
        sys.exit(1)
        
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    opts = {}
    if len(sys.argv) > 3:
        try:
            opts_arg = sys.argv[3]
            if os.path.exists(opts_arg):
                with open(opts_arg, READ_MODE, encoding=UTF8_ENCODING) as opt_f:
                    opts = json.load(opt_f)
            else:
                opts = json.loads(opts_arg)
        except Exception as e:
            logging.info(ERR_OPTS_PARSE.format(e))
            
    try:
        is_auto_mode = opts.get("is_auto_mode", False)
        
        if is_auto_mode:
            try:
                from capcut_project_builder import generate_capcut_project
                template_path = opts.get("template_id", "")
                parent_folder = opts.get("parent_folder", "")
                images_dir_opt = opts.get("images_dir", None)
                voices_dir_opt = opts.get("voices_dir", None)
                project_name = opts.get("project_name")
                if not project_name:
                    project_name = "AI_Video_" + uuid.uuid4().hex[:6]
                
                logging.info(f"[AUTO-MODE] Generating new project '{project_name}' from template...")
                new_input_path = generate_capcut_project(template_path, parent_folder, project_name, None, images_dir_opt, voices_dir_opt)
                logging.info(f"[AUTO-MODE] Project created at: {new_input_path}")
                input_file = new_input_path
                output_file = new_input_path
            except Exception as ex:
                logging.info(f"Error in auto generation: {ex}")
                sys.exit(1)
        style_opts = opts.get("project_style", {})
        motion_style = style_opts.get("camera_motion", "default")
        transition_style = style_opts.get("transitions", "default")
        opts["_motion_style"] = motion_style
        opts["_transition_style"] = transition_style

        process_capcut_ultra(input_file, output_file, opts)
        
        if opts.get("auto_export_video", False):
            export_video_with_ffmpeg(output_file, opts)
    except Exception as e:
        import traceback
        traceback.print_exc()
        logging.error(ERR_GENERIC.format(e))
        sys.exit(1)
