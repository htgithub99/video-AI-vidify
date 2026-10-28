if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import logging
logging.basicConfig(level=logging.INFO, format=_CODE_TEXT.ASCTIME_S_LEVELNAME_S_MESSAGE_S)
import os
import json
import random
import uuid
import re
import sys
import string
import copy
import urllib.request
PUNCTUATION_TO_REMOVE = string.punctuation + _CODE_TEXT.SYMBOL_5AA8AE
REGEX_SONG_SUFFIX = _CODE_TEXT.D_9A45F1
LOG_START_PROCESS = _CODE_TEXT.B_T_U_X_L_T_I_U_H_A_CAPCUT_CHO_T_P_TIN
LOG_OPTS = _CODE_TEXT.C_U_H_NH_T_Y_CH_N
LOG_COUNT_PHOTOS = _CODE_TEXT.T_M_TH_Y_PH_N_C_NH_H_NH_NH_VIDEO_TR_N_D_NG_TH_I_GIAN
LOG_COUNT_AUDIOS = _CODE_TEXT.T_M_TH_Y_M_THANH_TR_N_D_NG_TH_I_GIAN
LOG_CLEAR_TRANSITIONS = _CODE_TEXT.ANG_D_N_S_CH_TO_N_B_HI_U_NG_CHUY_N_C_NH_HI_N_T_I
LOG_SYNCING = _CODE_TEXT.ANG_NG_B_D_NG_TH_I_GIAN_CHO_PH_N_C_NH
LOG_NORMALIZE = _CODE_TEXT.ANG_CHU_N_H_A_M_L_NG_C_A_C_C_PH_N_O_N_M_THANH_V_M_C_CHU_N
LOG_REVERSING = _CODE_TEXT.ANG_O_NG_C_TH_T_C_C_PH_N_C_NH_TR_N_D_NG_TH_I_GIAN
LOG_MIXING = _CODE_TEXT.ANG_T_NG_CH_N_NH_C_N_N_NG_U_NHI_N
LOG_CUSTOM_ORDER = _CODE_TEXT.ANG_S_P_X_P_TH_T_M_THANH_THEO_DANH_S_CH_T_KH_A
LOG_RANDOMIZING = _CODE_TEXT.ANG_X_O_TR_N_NG_U_NHI_N_TH_T_C_C_PH_N_C_NH
LOG_INSERT_TRANSITIONS = _CODE_TEXT.ANG_T_NG_TH_M_HI_U_NG_CHUY_N_C_NH_M_I
LOG_SUBTITLES = _CODE_TEXT.ANG_NH_D_NG_KI_U_PH_V_PH_NG_CH_CHUY_N_NGHI_P
LOG_AI_SFX = _CODE_TEXT.ANG_T_NG_T_O_HI_U_NG_M_THANH_B_NG_TR_TU_NH_N_T_O_AI
LOG_SUCCESS = _CODE_TEXT.HO_N_T_T_TO_N_B_TI_N_TR_NH_T_I_U_H_A_CAPCUT_ULTRA_TH_NH_C_NG
LOG_DUP_PHOTOS = _CODE_TEXT.S_L_NG_NH_T_H_N_M_THANH_ANG_T_NG_NH_N_B_N_NH
LOG_TRUNCATE_PHOTOS = _CODE_TEXT.S_L_NG_NH_NHI_U_H_N_M_THANH_ANG_C_T_B_NH_TH_A
LOG_NO_TIMELINE_CHANGE = _CODE_TEXT.KH_NG_THAY_I_C_U_TR_C_TIMELINE_P_D_NG_C_C_HI_U_NG_TR_C_TI_P_
LOG_NO_BGM_FOUND = _CODE_TEXT.KH_NG_T_M_TH_Y_T_P_NH_C_N_N_N_O
LOG_NO_SFX_MATCH = _CODE_TEXT.KH_NG_T_M_TH_Y_K_T_H_P_HI_U_NG_M_THANH_N_O_PH_H_P
LOG_SFX_DIR_EMPTY = _CODE_TEXT.TH_M_C_SFX_TR_NG
LOG_SFX_GEMINI_REQUEST = _CODE_TEXT.ANG_G_I_Y_U_C_U_G_I_SFX_T_I_GOOGLE_GEMINI
LOG_SFX_GEMINI_ERR = _CODE_TEXT.L_I_K_T_N_I_GEMINI_ANG_CHUY_N_SANG_I_S_NH_T_KH_A_T_NG
LOG_SFX_AUTO_MATCH = _CODE_TEXT.ANG_TH_C_HI_N_I_S_NH_T_KH_A_T_NG_CHO_SFX
LOG_SFX_MATCH_SUCCESS = _CODE_TEXT.GH_P_N_I_TH_NH_C_NG_HI_U_NG_M_THANH
LOG_PROCESS_KILLED = _CODE_TEXT.PH_T_HI_N_V_T_NG_T_T_TI_N_TR_NH_CAPCUT_JIANYING_ANG_HO_T_NG_
LOG_WAIT_CLOSE = _CODE_TEXT.ANG_CH_H_TH_NG_NG_HO_N_TO_N_CAPCUT_V_GI_I_PH_NG_T_I_NGUY_N_T
LOG_SCENE_DETAIL = _CODE_TEXT.SCENE_02D_RATIO_TYPE_MOTION_SCALE_2F_TRANSFORM_4F_4F_ROT_2F
LOG_SCENE_DETAIL_SIMPLE = _CODE_TEXT.SCENE_02D_RATIO_MOTION_SCALE_2F_TRANSFORM_4F_4F_ROT_2F
LOG_GEMINI_API_REQUEST = _CODE_TEXT.ANG_G_I_Y_U_C_U_G_I_SFX_T_I_GOOGLE_GEMINI
LOG_DUP_INFO = _CODE_TEXT.S_L_NG_NH_T_H_N_M_THANH_ANG_T_NG_NH_N_B_N_NH
LOG_DEL_INFO = _CODE_TEXT.S_L_NG_NH_NHI_U_H_N_M_THANH_ANG_C_T_B_NH_TH_A
LOG_NO_SFX_DIR = _CODE_TEXT.TH_M_C_SFX_TR_NG
LOG_EXPORT_NO_DIR = _CODE_TEXT.XU_T_VIDEO_CH_A_CH_NH_TH_M_C_L_U_VIDEO
LOG_EXPORT_STARTING = _CODE_TEXT.XU_T_VIDEO_B_T_U_K_T_XU_T_VIDEO_T_D_N_CAPCUT
LOG_EXPORT_NO_MEDIA = _CODE_TEXT.XU_T_VIDEO_KH_NG_T_M_TH_Y_FILE_NH_HO_C_AUDIO_TRONG_D_N_K_T_X
LOG_EXPORT_NO_AUDIO = _CODE_TEXT.XU_T_VIDEO_KH_NG_C_AUDIO_S_K_T_XU_T_VIDEO_IM_L_NG
LOG_EXPORT_RENDERING = _CODE_TEXT.XU_T_VIDEO_ANG_K_T_XU_T_VIDEO_B_NG_FFMPEG_NH_AUDIO
LOG_EXPORT_SUCCESS = _CODE_TEXT.XU_T_VIDEO_K_T_XU_T_VIDEO_TH_NH_C_NG_FILE_L_U_T_I
LOG_EXPORT_FAIL = _CODE_TEXT.XU_T_VIDEO_K_T_XU_T_TH_T_B_I_V_I_M_L_I
LOG_EXPORT_ERR = _CODE_TEXT.XU_T_VIDEO_L_I_K_T_XU_T
ERR_NO_MEDIA = _CODE_TEXT.KH_NG_T_M_TH_Y_H_NH_NH_VIDEO_HO_C_M_THANH_TR_N_D_NG_TH_I_GIA
ERR_CLI_USAGE = _CODE_TEXT.C_PH_P_PYTHON_CAPCUT_ULTRA_TOOL_PY_INPUT_JSON_OUTPUT_JSON_OP
ERR_OPTS_PARSE = _CODE_TEXT.L_I_PH_N_T_CH_C_PH_P_T_Y_CH_N_JSON
ERR_GENERIC = _CODE_TEXT.ERROR
ERR_NO_TIMELINE_MOD = _CODE_TEXT.KH_NG_TH_TH_C_HI_N_C_C_THAO_T_C_THAY_I_TIMELINE_DO_THI_U_NH_
ERR_SUBTITLE_CONFIG = _CODE_TEXT.L_I_C_U_H_NH_PH
TRANSITION_NAME = _CODE_TEXT.CHUY_N_C_NH_NG_U_NHI_N
DEFAULT_TRANSITION_DURATION = 500000
DEFAULT_FALLBACK_DURATION = 5000000
TRANS_PREFIX = _CODE_TEXT.TRANS
VIDEO_TYPE_KEY = _CODE_TEXT.VIDEO
AUDIO_TYPE_KEY = _CODE_TEXT.AUDIO
PHOTO_TYPE_KEY = _CODE_TEXT.PHOTO
TYPE_ATTR = _CODE_TEXT.TYPE
SEGMENTS_ATTR = _CODE_TEXT.SEGMENTS
MATERIALS_ATTR = _CODE_TEXT.MATERIALS
VIDEOS_ATTR = _CODE_TEXT.VIDEOS
AUDIOS_ATTR = _CODE_TEXT.AUDIOS
TRANSITIONS_ATTR = _CODE_TEXT.TRANSITIONS
TRACKS_ATTR = _CODE_TEXT.TRACKS
CLIP_ATTR = _CODE_TEXT.CLIP
SCALE_ATTR = _CODE_TEXT.SCALE
TRANSFORM_ATTR = _CODE_TEXT.TRANSFORM
TRANSITION_ATTR = _CODE_TEXT.TRANSITION
EXTRA_REFS_ATTR = _CODE_TEXT.EXTRA_MATERIAL_REFS
TARGET_TIMERANGE_ATTR = _CODE_TEXT.TARGET_TIMERANGE
SOURCE_TIMERANGE_ATTR = _CODE_TEXT.SOURCE_TIMERANGE
DURATION_ATTR = _CODE_TEXT.DURATION
START_ATTR = _CODE_TEXT.START
VOLUME_ATTR = _CODE_TEXT.VOLUME
PATH_ATTR = _CODE_TEXT.PATH
ID_ATTR = _CODE_TEXT.ID
NAME_ATTR = _CODE_TEXT.NAME
X_AXIS = _CODE_TEXT.X
Y_AXIS = _CODE_TEXT.Y
UTF8_ENCODING = _CODE_TEXT.UTF_8
READ_MODE = _CODE_TEXT.R
WRITE_MODE = _CODE_TEXT.W
CMD_SELECT_FILE = _CODE_TEXT.SELECT_FILE
CMD_SELECT_FOLDER = _CODE_TEXT.SELECT_FOLDER
CMD_SAVE_FILE = _CODE_TEXT.SAVE_FILE
CMD_SELECT_SAVE_FILE = _CODE_TEXT.SELECT_SAVE_FILE
CMD_SELECT_SAVE_FILE = _CODE_TEXT.SELECT_SAVE_FILE
DIALOG_FILE_TITLE = _CODE_TEXT.CH_N_FILE_DRAFT_CONTENT_JSON
DIALOG_FOLDER_TITLE = _CODE_TEXT.CH_N_TH_M_C
JSON_FILE_TYPES_LABEL = _CODE_TEXT.JSON_FILES
JSON_EXT = _CODE_TEXT.JSON
ALL_EXT = _CODE_TEXT.SYMBOL_4EAD03
def save_file_dialog(source_path, suggested_name, extension):
    import shutil
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk()
    root.withdraw()
    root.attributes(_CODE_TEXT.TOPMOST, True)
    normalized_extension = extension if extension.startswith(_CODE_TEXT.SYMBOL_CDB4EE) else _CODE_TEXT.SYMBOL_CDB4EE + extension
    target_path = filedialog.asksaveasfilename(title=_CODE_TEXT.L_U_T_P, initialfile=suggested_name, defaultextension=normalized_extension, filetypes=[(f'{normalized_extension.upper()}{_CODE_TEXT.FILES}', f'{_CODE_TEXT.SYMBOL_684888}{normalized_extension}'), (ALL_EXT, ALL_EXT)])
    root.destroy()
    if target_path:
        shutil.copyfile(source_path, target_path)
        print(os.path.normpath(target_path), end="")
def select_save_file_dialog(suggested_name, extension):
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk()
    root.withdraw()
    root.attributes(_CODE_TEXT.TOPMOST, True)
    target_path = filedialog.asksaveasfilename(title=_CODE_TEXT.L_U_T_P, initialfile=suggested_name, defaultextension=extension, filetypes=[(_CODE_TEXT.ZIP_FILES, _CODE_TEXT.ZIP_B500A0), (ALL_EXT, ALL_EXT)])
    root.destroy()
    if target_path:
        print(os.path.normpath(target_path), end="")
def select_save_file_dialog(suggested_name, extension):
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk()
    root.withdraw()
    root.attributes(_CODE_TEXT.TOPMOST, True)
    normalized_extension = extension if extension.startswith(_CODE_TEXT.SYMBOL_CDB4EE) else _CODE_TEXT.SYMBOL_CDB4EE + extension
    target_path = filedialog.asksaveasfilename(title=_CODE_TEXT.L_U_T_P, initialfile=suggested_name, defaultextension=normalized_extension, filetypes=[(f'{normalized_extension.upper()}{_CODE_TEXT.FILES}', f'{_CODE_TEXT.SYMBOL_684888}{normalized_extension}'), (ALL_EXT, ALL_EXT)])
    root.destroy()
    if target_path:
        print(os.path.normpath(target_path), end="")
OPT_SYNC_IMAGE_TO_AUDIO = _CODE_TEXT.SYNC_IMAGE_TO_AUDIO
OPT_CUSTOM_AUDIO_ORDER = _CODE_TEXT.CUSTOM_AUDIO_ORDER
OPT_AUDIO_ORDER_LIST = _CODE_TEXT.AUDIO_ORDER_LIST
OPT_RANDOMIZE_VIDEO = _CODE_TEXT.RANDOMIZE_VIDEO
OPT_REVERSE_TIMELINE = _CODE_TEXT.REVERSE_TIMELINE
OPT_AUTO_FILL_CANVAS = _CODE_TEXT.AUTO_FILL_CANVAS
OPT_DYNAMIC_MOTION = _CODE_TEXT.DYNAMIC_MOTION
OPT_SCENE_TYPE = _CODE_TEXT.SCENE_TYPE
OPT_NORMALIZE_VOLUME = _CODE_TEXT.NORMALIZE_VOLUME
OPT_ULTRA_MUSIC_MIX = _CODE_TEXT.ULTRA_MUSIC_MIX
OPT_SFX_FOLDER = _CODE_TEXT.SFX_FOLDER
OPT_AUTO_TRANSITION = _CODE_TEXT.AUTO_TRANSITION
OPT_AUTO_SUBTITLES = _CODE_TEXT.AUTO_SUBTITLES
OPT_AI_SFX_GENERATOR = _CODE_TEXT.AI_SFX_GENERATOR
OPT_API_KEY = _CODE_TEXT.API_KEY
CMD_KILL_CAPCUT = _CODE_TEXT.TASKKILL_F_T_IM_CAPCUT_EXE
CMD_KILL_JIANYING = _CODE_TEXT.TASKKILL_F_T_IM_JIANYINGPRO_EXE
BGM_TRACK_NAME = _CODE_TEXT.BGM_TRACK
BGM_TRACK_ID_PREFIX = _CODE_TEXT.BGM_TRACK_D05232
BGM_MAT_ID_PREFIX = _CODE_TEXT.BGM_MAT
BGM_SEG_ID_PREFIX = _CODE_TEXT.BGM_SEG
SFX_TRACK_NAME = _CODE_TEXT.SFX_TRACK
SFX_TRACK_ID_PREFIX = _CODE_TEXT.SFX_TRACK_A7B7C8
SFX_MAT_ID_PREFIX = _CODE_TEXT.SFX_MAT
SFX_SEG_ID_PREFIX = _CODE_TEXT.SFX_SEG
FONT_INTER = _CODE_TEXT.INTER
DUP_PHOTO_PREFIX = _CODE_TEXT.DUP_PHOTO
PROMPT_TEMPLATE = _CODE_TEXT.B_N_L_M_T_NH_THI_T_K_M_THANH_CHUY_N_NGHI_P_CHO_VIDEO_NG_N_T_
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
KF_PROPERTY_SCALE = _CODE_TEXT.UNIFORM_SCALE
KF_PROPERTY_POSITION_X = _CODE_TEXT.KFTYPEPOSITIONX
KF_PROPERTY_POSITION_Y = _CODE_TEXT.KFTYPEPOSITIONY
KF_PROPERTY_ROTATION = _CODE_TEXT.KFTYPEROTATION
CURVE_EASE_IN_OUT = _CODE_TEXT.EASEINOUT
RATIO_LANDSCAPE = _CODE_TEXT.LANDSCAPE
RATIO_PORTRAIT = _CODE_TEXT.PORTRAIT
RATIO_SQUARE = _CODE_TEXT.SQUARE
SCENE_HOOK = _CODE_TEXT.HOOK
SCENE_IMPORTANT = _CODE_TEXT.IMPORTANT
SCENE_INFORMATION = _CODE_TEXT.INFORMATION
MOTION_ZOOM_IN = _CODE_TEXT.ZOOM_IN
MOTION_ZOOM_OUT = _CODE_TEXT.ZOOM_OUT
MOTION_PAN_LEFT = _CODE_TEXT.PAN_LEFT
MOTION_PAN_RIGHT = _CODE_TEXT.PAN_RIGHT
MOTION_PAN_UP = _CODE_TEXT.PAN_UP
MOTION_PAN_DOWN = _CODE_TEXT.PAN_DOWN
MOTION_PUSH_IN = _CODE_TEXT.PUSH_IN
MOTION_PULL_OUT = _CODE_TEXT.PULL_OUT
MOTION_CORNER_LEFT = _CODE_TEXT.CORNER_LEFT
MOTION_CORNER_RIGHT = _CODE_TEXT.CORNER_RIGHT
MOTION_KEN_BURNS = _CODE_TEXT.KEN_BURNS
MOTION_STATIC_FOCUS = _CODE_TEXT.STATIC_FOCUS
GENRE_TIKTOK = _CODE_TEXT.TIKTOK
GENRE_PODCAST = _CODE_TEXT.PODCAST
GENRE_REVIEW = _CODE_TEXT.REVIEW
GENRE_VLOG = _CODE_TEXT.VLOG
GENRE_STORY = _CODE_TEXT.STORY
GENRE_NEWS = _CODE_TEXT.NEWS
GENRE_DOCUMENTARY = _CODE_TEXT.DOCUMENTARY
GENRE_HISTORY = _CODE_TEXT.HISTORY
GENRE_ACTION = _CODE_TEXT.ACTION
if hasattr(sys.stdout, _CODE_TEXT.RECONFIGURE):
    sys.stdout.reconfigure(encoding=UTF8_ENCODING)
if hasattr(sys.stderr, _CODE_TEXT.RECONFIGURE):
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
        cmd = [_CODE_TEXT.FFPROBE, _CODE_TEXT.V, _CODE_TEXT.ERROR_CA00FC, _CODE_TEXT.SHOW_ENTRIES, _CODE_TEXT.FORMAT_DURATION, _CODE_TEXT.OF, _CODE_TEXT.DEFAULT_NOPRINT_WRAPPERS_1_NOKEY_1, filepath]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
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
        with wave.open(filepath, _CODE_TEXT.RB) as w:
            frames = w.getnframes()
            rate = w.getframerate()
            return int((frames / float(rate)) * 1000000)
    except Exception:
        pass
    return DEFAULT_FALLBACK_DURATION
def get_image_dimensions_fallback(filepath):
    try:
        with open(filepath, _CODE_TEXT.RB) as f:
            head = f.read(32)
            if len(head) < 24:
                return None
            if head.startswith(b'\x89PNG\r\n\x1a\n'):
                import struct
                w, h = struct.unpack(_CODE_TEXT.II, head[16:24])
                return int(w), int(h)
            elif head.startswith(b'GIF87a') or head.startswith(b'GIF89a'):
                import struct
                w, h = struct.unpack(_CODE_TEXT.HH, head[6:10])
                return int(w), int(h)
            elif head.startswith(b'\xff\xd8'):
                f.seek(0)
                size = 2
                while size:
                    f.seek(size, 1)
                    byte = f.read(2)
                    if not byte:
                        break
                    while byte[0] != 0xFF:
                        byte = f.read(1)
                        if not byte:
                            break
                    ftype = byte[1]
                    if ftype in [0xC0, 0xC1, 0xC2, 0xC3, 0xC9, 0xCA, 0xCB]:
                        f.seek(3, 1)
                        import struct
                        h, w = struct.unpack(_CODE_TEXT.HH_A2114B, f.read(4))
                        return int(w), int(h)
                    else:
                        size = struct.unpack(_CODE_TEXT.H, f.read(2))[0] - 2
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
    if ext in [_CODE_TEXT.JPG_D912C7, _CODE_TEXT.JPEG_7F43C2, _CODE_TEXT.PNG_B98B80, _CODE_TEXT.BMP, _CODE_TEXT.WEBP_ED140D]:
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
    url = f'{_CODE_TEXT.HTTPS_GENERATIVELANGUAGE_GOOGLEAPIS_COM_V1BETA_MODELS_GEMINI}{api_key}'
    headers = {_CODE_TEXT.CONTENT_TYPE: _CODE_TEXT.APPLICATION_JSON}
    payload = {_CODE_TEXT.CONTENTS: [{_CODE_TEXT.PARTS: [{_CODE_TEXT.TEXT: prompt}]}], _CODE_TEXT.GENERATIONCONFIG: {_CODE_TEXT.RESPONSEMIMETYPE: _CODE_TEXT.APPLICATION_JSON}}
    req = urllib.request.Request(url, data=json.dumps(payload).encode(UTF8_ENCODING), headers=headers, method=_CODE_TEXT.POST)
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read().decode(UTF8_ENCODING))
        text = res_data[_CODE_TEXT.CANDIDATES][0][_CODE_TEXT.CONTENT][_CODE_TEXT.PARTS][0][_CODE_TEXT.TEXT]
        return text
def open_file_dialog():
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes(_CODE_TEXT.TOPMOST, True)
        file_path = filedialog.askopenfilename(title=DIALOG_FILE_TITLE, filetypes=[(JSON_FILE_TYPES_LABEL, JSON_EXT), (ALL_EXT, ALL_EXT)])
        if file_path:
            print(os.path.normpath(file_path), end="")
            return
    except Exception:
        pass
    found_paths = []
    for root_dir, dirs, files in os.walk(_CODE_TEXT.SYMBOL_CDB4EE):
        if any(ex in root_dir for ex in [_CODE_TEXT.NODE_MODULES, _CODE_TEXT.DIST, _CODE_TEXT.GIT, _CODE_TEXT.PYCACHE]):
            continue
        for f in files:
            if f == _CODE_TEXT.DRAFT_CONTENT_JSON:
                found_paths.append(os.path.abspath(os.path.join(root_dir, f)))
    if found_paths:
        print(os.path.normpath(found_paths[0]), end="")
    else:
        any_json = []
        for root_dir, dirs, files in os.walk(_CODE_TEXT.SYMBOL_CDB4EE):
            if any(ex in root_dir for ex in [_CODE_TEXT.NODE_MODULES, _CODE_TEXT.DIST, _CODE_TEXT.GIT, _CODE_TEXT.PYCACHE]):
                continue
            for f in files:
                if f.endswith(_CODE_TEXT.JSON_12157A) and f not in [_CODE_TEXT.PACKAGE_JSON, _CODE_TEXT.TSCONFIG_JSON, _CODE_TEXT.METADATA_JSON, _CODE_TEXT.PACKAGE_LOCK_JSON, _CODE_TEXT.ESLINTRC_JSON]:
                    any_json.append(os.path.abspath(os.path.join(root_dir, f)))
        if any_json:
            print(os.path.normpath(any_json[0]), end="")
        else:
            print(os.path.abspath(_CODE_TEXT.DRAFT_CONTENT_JSON), end="")
def open_folder_dialog():
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes(_CODE_TEXT.TOPMOST, True)
        dir_path = filedialog.askdirectory(title=DIALOG_FOLDER_TITLE)
        if dir_path:
            print(os.path.normpath(dir_path), end="")
            return
    except Exception:
        pass
    found_dirs = []
    for root_dir, dirs, files in os.walk(_CODE_TEXT.SYMBOL_CDB4EE):
        if any(ex in root_dir for ex in [_CODE_TEXT.NODE_MODULES, _CODE_TEXT.DIST, _CODE_TEXT.GIT, _CODE_TEXT.PYCACHE]):
            continue
        for d in dirs:
            if d.lower() in [_CODE_TEXT.SFX, _CODE_TEXT.MUSIC, _CODE_TEXT.ASSETS, _CODE_TEXT.AUDIO]:
                found_dirs.append(os.path.abspath(os.path.join(root_dir, d)))
    if found_dirs:
        print(os.path.normpath(found_dirs[0]), end="")
    else:
        print(os.path.abspath(_CODE_TEXT.SYMBOL_CDB4EE), end="")
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
        important_keywords = [_CODE_TEXT.QUAN_TR_NG, _CODE_TEXT.CH, _CODE_TEXT.K_T_LU_N, _CODE_TEXT.T_M_L_I, _CODE_TEXT.IMPORTANT_34A989, _CODE_TEXT.CONCLUSION, _CODE_TEXT.ATTENTION, _CODE_TEXT.L_U]
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
    MOTIONS = [MOTION_ZOOM_IN, MOTION_ZOOM_OUT, MOTION_PAN_LEFT, MOTION_PAN_RIGHT, MOTION_PAN_UP, MOTION_PAN_DOWN, MOTION_PUSH_IN, MOTION_PULL_OUT, MOTION_CORNER_LEFT, MOTION_CORNER_RIGHT, MOTION_KEN_BURNS, MOTION_STATIC_FOCUS]
    MOTION_GROUPS = {_CODE_TEXT.ZOOM: [MOTION_ZOOM_IN, MOTION_ZOOM_OUT], _CODE_TEXT.PAN: [MOTION_PAN_LEFT, MOTION_PAN_RIGHT, MOTION_PAN_UP, MOTION_PAN_DOWN], _CODE_TEXT.PUSH: [MOTION_PUSH_IN, MOTION_PULL_OUT], _CODE_TEXT.CORNER: [MOTION_CORNER_LEFT, MOTION_CORNER_RIGHT], _CODE_TEXT.KEN_BURNS: [MOTION_KEN_BURNS], _CODE_TEXT.STATIC_FOCUS: [MOTION_STATIC_FOCUS]}
    @staticmethod
    def select_motion(aspect_ratio, motion_history=None, motion_style=_CODE_TEXT.DEFAULT):
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
            if m in MotionEngine.MOTION_GROUPS[_CODE_TEXT.ZOOM]:
                weights.append(w_zoom / len(MotionEngine.MOTION_GROUPS[_CODE_TEXT.ZOOM]))
            elif m in MotionEngine.MOTION_GROUPS[_CODE_TEXT.PAN]:
                weights.append(w_pan / len(MotionEngine.MOTION_GROUPS[_CODE_TEXT.PAN]))
            elif m in MotionEngine.MOTION_GROUPS[_CODE_TEXT.PUSH]:
                weights.append(w_push / len(MotionEngine.MOTION_GROUPS[_CODE_TEXT.PUSH]))
            elif m in MotionEngine.MOTION_GROUPS[_CODE_TEXT.CORNER]:
                weights.append(w_corner / len(MotionEngine.MOTION_GROUPS[_CODE_TEXT.CORNER]))
            elif m in MotionEngine.MOTION_GROUPS[_CODE_TEXT.KEN_BURNS]:
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
        return {_CODE_TEXT.CURVETYPE: curve_type, _CODE_TEXT.GRAPHID: "", _CODE_TEXT.LEFT_CONTROL: {_CODE_TEXT.X: 0.0, _CODE_TEXT.Y: 0.0}, _CODE_TEXT.RIGHT_CONTROL: {_CODE_TEXT.X: 0.0, _CODE_TEXT.Y: 0.0}, _CODE_TEXT.ID: kf_id, _CODE_TEXT.TIME_OFFSET: int(time_offset), _CODE_TEXT.VALUES: [float(value)]}
    @staticmethod
    def build_keyframe_list(property_type, keyframes):
        return {_CODE_TEXT.ID: uuid.uuid4().hex, _CODE_TEXT.KEYFRAME_LIST: keyframes, _CODE_TEXT.MATERIAL_ID: "", _CODE_TEXT.PROPERTY_TYPE: property_type}
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
            dx = dx_limit * random.uniform(0.25, 0.35)
            dy = dy_limit * random.uniform(0.25, 0.35)
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
            kb_preset = random.choice([_CODE_TEXT.TOPLEFT_TO_CENTER, _CODE_TEXT.BOTTOM_TO_TOP, _CODE_TEXT.CORNER_TO_CORNER])
            if kb_preset == _CODE_TEXT.TOPLEFT_TO_CENTER:
                scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, fill_scale * 1.15))
                scale_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, fill_scale * 1.04))
                dx, dy = CanvasEngine.calculate_safe_crop_margin(1.15, fill_scale)
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, -dx * 0.9))
                pos_x_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, 0, dy * 0.9))
                pos_y_kfs.append(MotionEngine.build_keyframe(uuid.uuid4().hex, duration_micros, 0.0))
            elif kb_preset == _CODE_TEXT.BOTTOM_TO_TOP:
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
        segment[_CODE_TEXT.COMMON_KEYFRAMES] = [MotionEngine.build_keyframe_list(KF_PROPERTY_SCALE, scale_kfs), MotionEngine.build_keyframe_list(KF_PROPERTY_POSITION_X, pos_x_kfs), MotionEngine.build_keyframe_list(KF_PROPERTY_POSITION_Y, pos_y_kfs), MotionEngine.build_keyframe_list(KF_PROPERTY_ROTATION, rot_kfs)]
        clip_settings = segment.setdefault(_CODE_TEXT.CLIP, {})
        scale_settings = clip_settings.setdefault(_CODE_TEXT.SCALE, {})
        transform_settings = clip_settings.setdefault(_CODE_TEXT.TRANSFORM, {})
        scale_settings[_CODE_TEXT.X] = scale_kfs[0][_CODE_TEXT.VALUES][0]
        scale_settings[_CODE_TEXT.Y] = scale_kfs[0][_CODE_TEXT.VALUES][0]
        transform_settings[_CODE_TEXT.X] = pos_x_kfs[0][_CODE_TEXT.VALUES][0]
        transform_settings[_CODE_TEXT.Y] = pos_y_kfs[0][_CODE_TEXT.VALUES][0]
        clip_settings[_CODE_TEXT.ROTATION] = start_rot
        final_scale_display = scale_kfs[1][_CODE_TEXT.VALUES][0] if len(scale_kfs) > 1 else scale_kfs[0][_CODE_TEXT.VALUES][0]
        final_x_display = pos_x_kfs[1][_CODE_TEXT.VALUES][0] if len(pos_x_kfs) > 1 else pos_x_kfs[0][_CODE_TEXT.VALUES][0]
        final_y_display = pos_y_kfs[1][_CODE_TEXT.VALUES][0] if len(pos_y_kfs) > 1 else pos_y_kfs[0][_CODE_TEXT.VALUES][0]
        return motion, final_scale_display, final_x_display, final_y_display, start_rot
class TransitionEngine:
    TRANSITION_LIBRARY = {
        GENRE_TIKTOK: [
            {_CODE_TEXT.NAME: _CODE_TEXT.FLASH, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008016, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069056, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.WHIP, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008050, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069090, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.GLITCH, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008090, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069130, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.ZOOM, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008060, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069100, _CODE_TEXT.PATH: ""},
        ],
        GENRE_PODCAST: [{_CODE_TEXT.NAME: _CODE_TEXT.CROSS_FADE, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008620, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069058, _CODE_TEXT.PATH: ""}, {_CODE_TEXT.NAME: _CODE_TEXT.BLUR, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008020, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069060, _CODE_TEXT.PATH: ""}],
        GENRE_REVIEW: [
            {_CODE_TEXT.NAME: _CODE_TEXT.SLIDE_LEFT, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008071, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069111, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.SLIDE_RIGHT, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008072, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069112, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.PUSH, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008075, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069115, _CODE_TEXT.PATH: ""},
        ],
        GENRE_VLOG: [
            {_CODE_TEXT.NAME: _CODE_TEXT.ZOOM, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008060, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069100, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.MOTION_BLUR, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008022, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069062, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.CROSS_FADE, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008620, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069058, _CODE_TEXT.PATH: ""},
        ],
        GENRE_STORY: [{_CODE_TEXT.NAME: _CODE_TEXT.DIP_TO_BLACK, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008013, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069053, _CODE_TEXT.PATH: ""}, {_CODE_TEXT.NAME: _CODE_TEXT.CROSS_FADE, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008620, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069058, _CODE_TEXT.PATH: ""}],
        GENRE_NEWS: [{_CODE_TEXT.NAME: _CODE_TEXT.PUSH, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008075, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069115, _CODE_TEXT.PATH: ""}, {_CODE_TEXT.NAME: _CODE_TEXT.CROSS_FADE, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008620, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069058, _CODE_TEXT.PATH: ""}],
        GENRE_DOCUMENTARY: [
            {_CODE_TEXT.NAME: _CODE_TEXT.CROSS_FADE, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008620, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069058, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.DIP_TO_BLACK, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008013, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069053, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.BLUR, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008020, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069060, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.PULL_IN, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008076, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069116, _CODE_TEXT.PATH: ""},
        ],
        GENRE_HISTORY: [
            {_CODE_TEXT.NAME: _CODE_TEXT.FILM_BURN, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008035, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069075, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.FADE, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008620, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069058, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.FLASH, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008016, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069056, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.GLITCH, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008090, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069130, _CODE_TEXT.PATH: ""},
        ],
        GENRE_ACTION: [
            {_CODE_TEXT.NAME: _CODE_TEXT.WHIP, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008050, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069090, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.ZOOM, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008060, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069100, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.MOTION_BLUR, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008022, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069062, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.PUSH, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008075, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069115, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.SLIDE_LEFT, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008071, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069111, _CODE_TEXT.PATH: ""},
            {_CODE_TEXT.NAME: _CODE_TEXT.SLIDE_RIGHT, _CODE_TEXT.EFFECT_ID: _CODE_TEXT.VALUE_6008072, _CODE_TEXT.RESOURCE_ID: _CODE_TEXT.VALUE_7108928014529069112, _CODE_TEXT.PATH: ""},
        ],
    }
    @staticmethod
    def select_transition(genre=GENRE_DOCUMENTARY, transition_history=None):
        pool = TransitionEngine.TRANSITION_LIBRARY.get(genre, TransitionEngine.TRANSITION_LIBRARY[GENRE_DOCUMENTARY])
        allowed = [t for t in pool]
        if transition_history:
            filtered = [t for t in allowed if t[_CODE_TEXT.NAME] not in transition_history]
            if filtered:
                allowed = filtered
            else:
                last_t = transition_history[-1]
                if last_t in [x[_CODE_TEXT.NAME] for x in allowed] and len(allowed) > 1:
                    allowed = [t for t in allowed if t[_CODE_TEXT.NAME] != last_t]
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
    if opts.get(_CODE_TEXT.SEED) is not None:
        random.seed(opts.get(_CODE_TEXT.SEED))
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
    canvas_config = data.get(_CODE_TEXT.CANVAS_CONFIG) or data.get(_CODE_TEXT.SETTINGS, {}).get(_CODE_TEXT.CANVAS_CONFIG, {})
    if canvas_config and canvas_config.get(_CODE_TEXT.WIDTH) and canvas_config.get(_CODE_TEXT.HEIGHT):
        canvas_w = canvas_config.get(_CODE_TEXT.WIDTH)
        canvas_h = canvas_config.get(_CODE_TEXT.HEIGHT)
    all_video_segments = []
    all_audio_segments = []
    for t in tracks:
        if t.get(TYPE_ATTR) == VIDEO_TYPE_KEY:
            for seg in t.get(SEGMENTS_ATTR, []):
                mat_id = seg.get(_CODE_TEXT.MATERIAL_ID)
                if mat_id in vid_dict:
                    all_video_segments.append({_CODE_TEXT.SEGMENT: seg, _CODE_TEXT.MATERIAL: vid_dict[mat_id], _CODE_TEXT.TRACK: t})
        elif t.get(TYPE_ATTR) == AUDIO_TYPE_KEY:
            for seg in t.get(SEGMENTS_ATTR, []):
                mat_id = seg.get(_CODE_TEXT.MATERIAL_ID)
                if mat_id in aud_dict:
                    all_audio_segments.append({_CODE_TEXT.SEGMENT: seg, _CODE_TEXT.MATERIAL: aud_dict[mat_id], _CODE_TEXT.TRACK: t})
    all_video_segments.sort(key=lambda x: x[_CODE_TEXT.SEGMENT].get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0))
    all_audio_segments.sort(key=lambda x: x[_CODE_TEXT.SEGMENT].get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0))
    main_video_track = None
    max_vid_segs = -1
    main_audio_track = None
    max_aud_segs = -1
    for t in tracks:
        if t.get(TYPE_ATTR) == VIDEO_TYPE_KEY:
            segs = t.get(SEGMENTS_ATTR, [])
            media_count = sum(1 for s in segs if s.get(ID_ATTR) in vid_dict or s.get(_CODE_TEXT.MATERIAL_ID) in vid_dict)
            if media_count > max_vid_segs:
                max_vid_segs = media_count
                main_video_track = t
        elif t.get(TYPE_ATTR) == AUDIO_TYPE_KEY:
            segs = t.get(SEGMENTS_ATTR, [])
            media_count = sum(1 for s in segs if s.get(ID_ATTR) in aud_dict or s.get(_CODE_TEXT.MATERIAL_ID) in aud_dict)
            if media_count > max_aud_segs:
                max_aud_segs = media_count
                main_audio_track = t
    photo_segments = []
    audio_segments = []
    if main_video_track:
        for seg in main_video_track.get(SEGMENTS_ATTR, []):
            mat_id = seg.get(_CODE_TEXT.MATERIAL_ID)
            if mat_id in vid_dict:
                photo_segments.append({_CODE_TEXT.SEGMENT: seg, _CODE_TEXT.MATERIAL: vid_dict[mat_id]})
    if main_audio_track:
        for seg in main_audio_track.get(SEGMENTS_ATTR, []):
            mat_id = seg.get(_CODE_TEXT.MATERIAL_ID)
            if mat_id in aud_dict:
                audio_segments.append({_CODE_TEXT.SEGMENT: seg, _CODE_TEXT.MATERIAL: aud_dict[mat_id]})
    photo_segments.sort(key=lambda x: x[_CODE_TEXT.SEGMENT].get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0))
    audio_segments.sort(key=lambda x: x[_CODE_TEXT.SEGMENT].get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0))
    num_photos = len(photo_segments)
    num_audios = len(audio_segments)
    logging.info(LOG_COUNT_PHOTOS.format(num_photos))
    logging.info(LOG_COUNT_AUDIOS.format(num_audios))
    if len(all_video_segments) == 0 and len(all_audio_segments) == 0:
        raise Exception(ERR_NO_MEDIA)
    if opts.get(_CODE_TEXT.CLEAR_TRANSITIONS):
        logging.info(LOG_CLEAR_TRANSITIONS)
        trans_ids = {t[_CODE_TEXT.ID] for t in transitions_mat}
        for p_item in all_video_segments:
            seg = p_item[_CODE_TEXT.SEGMENT]
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
                logging.info(f'{_CODE_TEXT.CH_UNIFIED_AUDIO_CHIA_U_1_M_THANH_CHO}{num_photos}{_CODE_TEXT.NH}')
                pass
            elif num_photos < num_audios and num_photos > 0:
                logging.info(LOG_DUP_INFO.format(num_photos, num_audios))
                while len(photo_segments) < num_audios:
                    last_item = photo_segments[-1]
                    new_seg = copy.deepcopy(last_item[_CODE_TEXT.SEGMENT])
                    new_seg[_CODE_TEXT.ID] = DUP_PHOTO_PREFIX.format(uuid.uuid4().hex[:8])
                    main_video_track[_CODE_TEXT.SEGMENTS].append(new_seg)
                    photo_segments.append({_CODE_TEXT.SEGMENT: new_seg, _CODE_TEXT.MATERIAL: last_item[_CODE_TEXT.MATERIAL]})
                num_photos = len(photo_segments)
            elif num_photos > num_audios:
                logging.info(LOG_DEL_INFO.format(num_photos, num_audios))
                extra_photos = photo_segments[num_audios:]
                for item in extra_photos:
                    if item[_CODE_TEXT.SEGMENT] in main_video_track[_CODE_TEXT.SEGMENTS]:
                        main_video_track[_CODE_TEXT.SEGMENTS].remove(item[_CODE_TEXT.SEGMENT])
                photo_segments = photo_segments[:num_audios]
                num_photos = len(photo_segments)
        target_count = num_photos if (num_audios == 1 and num_photos > 1) else min(num_photos, num_audios)
        scenes = []
        for i in range(target_count):
            p_item = photo_segments[i]
            a_item = audio_segments[0] if (num_audios == 1) else audio_segments[i]
            p_seg = p_item[_CODE_TEXT.SEGMENT]
            p_start = p_seg.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0)
            p_dur = p_seg.get(TARGET_TIMERANGE_ATTR, {}).get(DURATION_ATTR, 0)
            p_end = p_start + p_dur
            scene_texts = []
            for text_track in [t for t in tracks if t.get(_CODE_TEXT.TYPE) == _CODE_TEXT.TEXT]:
                for text_seg in text_track.get(_CODE_TEXT.SEGMENTS, []):
                    t_start = text_seg.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0)
                    if p_start <= t_start < p_end:
                        scene_texts.append(text_seg)
            scenes.append({_CODE_TEXT.PHOTO: p_item, _CODE_TEXT.AUDIO: a_item, _CODE_TEXT.TEXTS: scene_texts, _CODE_TEXT.ORIGINAL_DURATION: p_dur, _CODE_TEXT.ORIGINAL_START: p_start})
        if opts.get(OPT_CUSTOM_AUDIO_ORDER) and opts.get(OPT_AUDIO_ORDER_LIST):
            order_str = opts.get(OPT_AUDIO_ORDER_LIST)
            logging.info(LOG_CUSTOM_ORDER.format(order_str))
            keywords = [k.strip().lower() for k in order_str.split(_CODE_TEXT.SYMBOL_D03502) if k.strip()]
            def get_scene_priority(scene):
                filename = os.path.basename(scene[_CODE_TEXT.AUDIO][_CODE_TEXT.MATERIAL].get(PATH_ATTR, "")).lower()
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
        is_unified_audio = num_audios == 1 and num_photos > 1
        if is_unified_audio:
            single_audio_path = audio_segments[0][_CODE_TEXT.MATERIAL][PATH_ATTR]
            total_audio_duration = get_audio_duration_micros(single_audio_path)
            unified_photo_dur = int(total_audio_duration / num_photos) if num_photos > 0 else 0
            audio_segments[0][_CODE_TEXT.SEGMENT][SOURCE_TIMERANGE_ATTR] = {START_ATTR: 0, DURATION_ATTR: total_audio_duration}
            audio_segments[0][_CODE_TEXT.SEGMENT][TARGET_TIMERANGE_ATTR] = {START_ATTR: 0, DURATION_ATTR: total_audio_duration}
            audio_segments[0][_CODE_TEXT.MATERIAL][DURATION_ATTR] = total_audio_duration
        for i, scene in enumerate(scenes):
            p_item = scene[_CODE_TEXT.PHOTO]
            a_item = scene[_CODE_TEXT.AUDIO]
            p_seg = p_item[_CODE_TEXT.SEGMENT]
            a_seg = a_item[_CODE_TEXT.SEGMENT]
            audio_path = a_item[_CODE_TEXT.MATERIAL][PATH_ATTR]
            audio_duration = get_audio_duration_micros(audio_path)
            if not is_unified_audio:
                a_seg[SOURCE_TIMERANGE_ATTR] = {START_ATTR: 0, DURATION_ATTR: audio_duration}
                a_seg[TARGET_TIMERANGE_ATTR] = {START_ATTR: current_time, DURATION_ATTR: audio_duration}
                a_item[_CODE_TEXT.MATERIAL][DURATION_ATTR] = audio_duration
            if opts.get(OPT_SYNC_IMAGE_TO_AUDIO):
                photo_duration = unified_photo_dur if is_unified_audio else audio_duration
            else:
                photo_duration = scene[_CODE_TEXT.ORIGINAL_DURATION]
            p_seg[TARGET_TIMERANGE_ATTR] = {START_ATTR: current_time, DURATION_ATTR: photo_duration}
            p_seg[SOURCE_TIMERANGE_ATTR] = {START_ATTR: 0, DURATION_ATTR: photo_duration}
            if p_item[_CODE_TEXT.MATERIAL].get(TYPE_ATTR) == VIDEO_TYPE_KEY:
                p_item[_CODE_TEXT.MATERIAL][DURATION_ATTR] = photo_duration
            orig_start = scene[_CODE_TEXT.ORIGINAL_START]
            orig_dur = scene[_CODE_TEXT.ORIGINAL_DURATION]
            for text_seg in scene[_CODE_TEXT.TEXTS]:
                t_orig_start = text_seg.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0)
                t_offset = t_orig_start - orig_start
                if orig_dur > 0:
                    ratio = photo_duration / orig_dur
                    new_offset = int(t_offset * ratio)
                    new_dur = int(text_seg.get(TARGET_TIMERANGE_ATTR, {}).get(DURATION_ATTR, 0) * ratio)
                else:
                    new_offset = 0
                    new_dur = photo_duration
                text_seg[TARGET_TIMERANGE_ATTR] = {START_ATTR: current_time + new_offset, DURATION_ATTR: new_dur}
                if text_seg.get(SOURCE_TIMERANGE_ATTR):
                    text_seg[SOURCE_TIMERANGE_ATTR][DURATION_ATTR] = new_dur
            scene_text = ""
            for text_seg in scene[_CODE_TEXT.TEXTS]:
                mat_id = text_seg.get(_CODE_TEXT.MATERIAL_ID)
                for tm in data.get(_CODE_TEXT.MATERIALS, {}).get(_CODE_TEXT.TEXTS, []):
                    if tm.get(_CODE_TEXT.ID) == mat_id:
                        try:
                            c_dict = json.loads(tm.get(_CODE_TEXT.CONTENT, _CODE_TEXT.SYMBOL_44136F))
                            scene_text = c_dict.get(_CODE_TEXT.TEXT, '')
                        except:
                            pass
                        break
            media_path = p_item[_CODE_TEXT.MATERIAL].get(PATH_ATTR)
            dims = get_media_dimensions(media_path)
            media_w, media_h = dims if dims else (1920, 1080)
            aspect_ratio = SceneAnalyzer.analyze_ratio(media_w, media_h)
            fill_scale = CanvasEngine.calculate_fill_scale(media_w, media_h, canvas_w, canvas_h)
            if opts.get(OPT_AUTO_FILL_CANVAS):
                clip_settings = p_seg.setdefault(_CODE_TEXT.CLIP, {})
                scale_settings = clip_settings.setdefault(_CODE_TEXT.SCALE, {})
                scale_settings[_CODE_TEXT.X] = fill_scale
                scale_settings[_CODE_TEXT.Y] = fill_scale
            applied_motion = _CODE_TEXT.NONE
            final_scale, final_x, final_y, final_rot = fill_scale, 0.0, 0.0, 0.0
            if opts.get(OPT_DYNAMIC_MOTION):
                motion = MotionEngine.select_motion(aspect_ratio, motion_history, opts.get(_CODE_TEXT.MOTION_STYLE, _CODE_TEXT.DEFAULT))
                applied_motion, final_scale, final_x, final_y, final_rot = MotionEngine.apply_motion(p_seg, motion, photo_duration, fill_scale, canvas_w, canvas_h)
                motion_history.append(motion)
                if len(motion_history) > 3:
                    motion_history.pop(0)
            scene_type = SceneAnalyzer.classify_scene_type(i, target_count, scene_text)
            logging.info(LOG_SCENE_DETAIL.format(i + 1, aspect_ratio, scene_type, applied_motion, final_scale, final_x, final_y, final_rot))
            current_time += photo_duration
        total_duration = current_time
        data[_CODE_TEXT.DURATION] = total_duration
    else:
        logging.info(LOG_NO_TIMELINE_CHANGE)
        total_duration = data.get(_CODE_TEXT.DURATION, 0)
        if total_duration <= 0:
            for t in tracks:
                for seg in t.get(SEGMENTS_ATTR, []):
                    seg_end = seg.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0) + seg.get(TARGET_TIMERANGE_ATTR, {}).get(DURATION_ATTR, 0)
                    if seg_end > total_duration:
                        total_duration = seg_end
        data[_CODE_TEXT.DURATION] = total_duration
        motion_history = []
        for i, p_item in enumerate(all_video_segments):
            p_seg = p_item[_CODE_TEXT.SEGMENT]
            media_path = p_item[_CODE_TEXT.MATERIAL].get(PATH_ATTR)
            dims = get_media_dimensions(media_path)
            media_w, media_h = dims if dims else (1920, 1080)
            aspect_ratio = SceneAnalyzer.analyze_ratio(media_w, media_h)
            fill_scale = CanvasEngine.calculate_fill_scale(media_w, media_h, canvas_w, canvas_h)
            photo_duration = p_seg.get(TARGET_TIMERANGE_ATTR, {}).get(DURATION_ATTR, 0)
            if opts.get(OPT_AUTO_FILL_CANVAS):
                clip_settings = p_seg.setdefault(_CODE_TEXT.CLIP, {})
                scale_settings = clip_settings.setdefault(_CODE_TEXT.SCALE, {})
                scale_settings[_CODE_TEXT.X] = fill_scale
                scale_settings[_CODE_TEXT.Y] = fill_scale
            applied_motion = _CODE_TEXT.NONE
            final_scale, final_x, final_y, final_rot = fill_scale, 0.0, 0.0, 0.0
            if opts.get(OPT_DYNAMIC_MOTION):
                motion = MotionEngine.select_motion(aspect_ratio, motion_history, opts.get(_CODE_TEXT.MOTION_STYLE, _CODE_TEXT.DEFAULT))
                applied_motion, final_scale, final_x, final_y, final_rot = MotionEngine.apply_motion(p_seg, motion, photo_duration, fill_scale, canvas_w, canvas_h)
                motion_history.append(motion)
                if len(motion_history) > 3:
                    motion_history.pop(0)
            logging.info(LOG_SCENE_DETAIL_SIMPLE.format(i + 1, aspect_ratio, applied_motion, final_scale, final_x, final_y, final_rot))
    if opts.get(OPT_NORMALIZE_VOLUME):
        logging.info(LOG_NORMALIZE)
        for a_item in all_audio_segments:
            mat = a_item[_CODE_TEXT.MATERIAL]
            mat[VOLUME_ATTR] = 1.0
            seg = a_item[_CODE_TEXT.SEGMENT]
            if _CODE_TEXT.VOLUME in seg:
                if isinstance(seg[_CODE_TEXT.VOLUME], dict):
                    seg[_CODE_TEXT.VOLUME][_CODE_TEXT.VOLUME] = 1.0
                else:
                    seg[_CODE_TEXT.VOLUME] = 1.0
    if opts.get(OPT_ULTRA_MUSIC_MIX):
        logging.info(LOG_MIXING)
        bgm_files = []
        dirs_to_scan = []
        if opts.get(OPT_SFX_FOLDER):
            dirs_to_scan.append(opts.get(OPT_SFX_FOLDER))
        dirs_to_scan.append(os.path.dirname(input_json_path))
        for d in list(dirs_to_scan):
            music_sub = os.path.join(d, _CODE_TEXT.MUSIC)
            bgm_sub = os.path.join(d, _CODE_TEXT.BGM)
            if os.path.exists(music_sub):
                dirs_to_scan.append(music_sub)
            if os.path.exists(bgm_sub):
                dirs_to_scan.append(bgm_sub)
        valid_exts = (_CODE_TEXT.MP3_510A4A, _CODE_TEXT.WAV_DA076E, _CODE_TEXT.M4A_C1523C, _CODE_TEXT.AAC, _CODE_TEXT.FLAC)
        for d in dirs_to_scan:
            if os.path.exists(d) and os.path.isdir(d):
                for f in os.listdir(d):
                    if f.lower().endswith(valid_exts):
                        bgm_files.append(os.path.join(d, f))
        music_keywords = [_CODE_TEXT.MUSIC, _CODE_TEXT.BGM, _CODE_TEXT.NHAC, _CODE_TEXT.BEAT, _CODE_TEXT.INSTRUMENTAL, _CODE_TEXT.BACKGROUND]
        music_files = [f for f in bgm_files if any(k in os.path.basename(f).lower() for k in music_keywords)]
        if not music_files:
            music_files = bgm_files
        if music_files:
            bgm_track = next((t for t in tracks if t.get(_CODE_TEXT.NAME) == BGM_TRACK_NAME), None)
            if bgm_track:
                bgm_track[_CODE_TEXT.SEGMENTS].clear()
            else:
                bgm_track_id = BGM_TRACK_ID_PREFIX.format(uuid.uuid4().hex[:8])
                bgm_track = {_CODE_TEXT.ID: bgm_track_id, _CODE_TEXT.TYPE: _CODE_TEXT.AUDIO, _CODE_TEXT.NAME: BGM_TRACK_NAME, _CODE_TEXT.SEGMENTS: []}
                tracks.append(bgm_track)
            current_bgm_time = 0
            while current_bgm_time < total_duration:
                chosen_music = random.choice(music_files)
                music_dur = get_audio_duration_micros(chosen_music)
                mat_id = BGM_MAT_ID_PREFIX.format(uuid.uuid4().hex[:8])
                new_mat = {_CODE_TEXT.ID: mat_id, _CODE_TEXT.NAME: os.path.basename(chosen_music), _CODE_TEXT.PATH: chosen_music.replace(_CODE_TEXT.SYMBOL, _CODE_TEXT.SYMBOL_8A5EDA), _CODE_TEXT.DURATION: music_dur, _CODE_TEXT.TYPE: _CODE_TEXT.AUDIO, _CODE_TEXT.VOLUME: 0.15}
                audios_mat.append(new_mat)
                seg_dur = min(music_dur, total_duration - current_bgm_time)
                seg_id = BGM_SEG_ID_PREFIX.format(uuid.uuid4().hex[:8])
                new_seg = {_CODE_TEXT.ID: seg_id, _CODE_TEXT.MATERIAL_ID: mat_id, _CODE_TEXT.SOURCE_TIMERANGE: {_CODE_TEXT.START: 0, _CODE_TEXT.DURATION: seg_dur}, _CODE_TEXT.TARGET_TIMERANGE: {_CODE_TEXT.START: current_bgm_time, _CODE_TEXT.DURATION: seg_dur}, _CODE_TEXT.VOLUME: {_CODE_TEXT.VOLUME: 0.15}}
                bgm_track[_CODE_TEXT.SEGMENTS].append(new_seg)
                current_bgm_time += seg_dur
        else:
            logging.info(LOG_NO_BGM_FOUND)
    if opts.get(OPT_AUTO_TRANSITION):
        logging.info(LOG_INSERT_TRANSITIONS)
        template_transition = transitions_mat[0] if transitions_mat else None
        target_video_segs = photo_segments if timeline_modifying else [v[_CODE_TEXT.SEGMENT] for v in all_video_segments]
        genre = opts.get(_CODE_TEXT.TRANSITION_STYLE, _CODE_TEXT.DEFAULT)
        if genre == _CODE_TEXT.DEFAULT:
            genre = GENRE_DOCUMENTARY
        if genre == _CODE_TEXT.NONE_140BED:
            return
        transition_history = []
        for i in range(len(target_video_segs) - 1):
            p_seg = target_video_segs[i]
            if TRANSITION_ATTR not in p_seg:
                trans_choice = TransitionEngine.select_transition(genre, transition_history)
                transition_history.append(trans_choice[_CODE_TEXT.NAME])
                if len(transition_history) > 3:
                    transition_history.pop(0)
                trans_id = f'{TRANS_PREFIX}{uuid.uuid4().hex[:8]}'
                clip_dur = p_seg.get(TARGET_TIMERANGE_ATTR, {}).get(DURATION_ATTR, DEFAULT_FALLBACK_DURATION)
                trans_dur = TransitionEngine.calculate_duration(clip_dur)
                if template_transition:
                    trans_mat = copy.deepcopy(template_transition)
                    trans_mat[ID_ATTR] = trans_id
                    trans_mat[NAME_ATTR] = trans_choice[_CODE_TEXT.NAME]
                    trans_mat[DURATION_ATTR] = trans_dur
                    trans_mat[_CODE_TEXT.EFFECT_ID] = trans_choice[_CODE_TEXT.EFFECT_ID]
                    trans_mat[_CODE_TEXT.RESOURCE_ID] = trans_choice[_CODE_TEXT.RESOURCE_ID]
                else:
                    trans_mat = {_CODE_TEXT.CATEGORY_NAME: _CODE_TEXT.TRANSITION, _CODE_TEXT.DURATION: trans_dur, _CODE_TEXT.EFFECT_ID: trans_choice[_CODE_TEXT.EFFECT_ID], _CODE_TEXT.ID: trans_id, _CODE_TEXT.NAME: trans_choice[_CODE_TEXT.NAME], _CODE_TEXT.PATH: trans_choice[_CODE_TEXT.PATH], _CODE_TEXT.RESOURCE_ID: trans_choice[_CODE_TEXT.RESOURCE_ID], _CODE_TEXT.TYPE: _CODE_TEXT.TRANSITION}
                transitions_mat.append(trans_mat)
                p_seg[TRANSITION_ATTR] = {ID_ATTR: trans_id, DURATION_ATTR: trans_dur}
                if EXTRA_REFS_ATTR not in p_seg:
                    p_seg[EXTRA_REFS_ATTR] = []
                p_seg[EXTRA_REFS_ATTR].append(trans_id)
    if opts.get(OPT_AUTO_SUBTITLES):
        logging.info(LOG_SUBTITLES)
        text_materials = data.get(_CODE_TEXT.MATERIALS, {}).get(_CODE_TEXT.TEXTS, [])
        for tm in text_materials:
            try:
                content_str = tm.get(_CODE_TEXT.CONTENT, '')
                if not content_str:
                    continue
                c_dict = json.loads(content_str)
                c_dict[_CODE_TEXT.FONT_SIZE] = 12.0
                c_dict[_CODE_TEXT.TEXT_COLOR] = _CODE_TEXT.FFCC00
                c_dict[_CODE_TEXT.HAS_STROKE] = True
                c_dict[_CODE_TEXT.STROKE_COLOR] = _CODE_TEXT.VALUE_000000
                c_dict[_CODE_TEXT.STROKE_WIDTH] = 0.15
                c_dict[_CODE_TEXT.HAS_SHADOW] = True
                c_dict[_CODE_TEXT.SHADOW_COLOR] = _CODE_TEXT.VALUE_000000
                c_dict[_CODE_TEXT.SHADOW_ALPHA] = 0.8
                c_dict[_CODE_TEXT.SHADOW_BLUR] = 0.15
                c_dict[_CODE_TEXT.ALIGN_TYPE] = 1
                c_dict[_CODE_TEXT.FONT_NAME] = FONT_INTER
                tm[_CODE_TEXT.CONTENT] = json.dumps(c_dict, ensure_ascii=False)
            except Exception as e:
                logging.info(ERR_SUBTITLE_CONFIG.format(e))
    if opts.get(OPT_AI_SFX_GENERATOR) and opts.get(OPT_SFX_FOLDER):
        logging.info(LOG_AI_SFX)
        sfx_dir = opts.get(OPT_SFX_FOLDER)
        if os.path.exists(sfx_dir) and os.path.isdir(sfx_dir):
            valid_exts = (_CODE_TEXT.MP3_510A4A, _CODE_TEXT.WAV_DA076E, _CODE_TEXT.M4A_C1523C, _CODE_TEXT.AAC, _CODE_TEXT.FLAC)
            all_sfx_files = [f for f in os.listdir(sfx_dir) if f.lower().endswith(valid_exts)]
            if all_sfx_files:
                scenes_desc = []
                target_scenes_for_sfx = list(scenes) if timeline_modifying else []
                if not target_scenes_for_sfx:
                    for i, v_item in enumerate(all_video_segments):
                        p_seg = v_item[_CODE_TEXT.SEGMENT]
                        p_start = p_seg.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0)
                        p_dur = p_seg.get(TARGET_TIMERANGE_ATTR, {}).get(DURATION_ATTR, 0)
                        p_end = p_start + p_dur
                        scene_texts = []
                        for text_track in [t for t in tracks if t.get(_CODE_TEXT.TYPE) == _CODE_TEXT.TEXT]:
                            for text_seg in text_track.get(_CODE_TEXT.SEGMENTS, []):
                                t_start = text_seg.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0)
                                if p_start <= t_start < p_end:
                                    scene_texts.append(text_seg)
                        target_scenes_for_sfx.append({_CODE_TEXT.PHOTO: v_item, _CODE_TEXT.TEXTS: scene_texts, _CODE_TEXT.ORIGINAL_DURATION: p_dur, _CODE_TEXT.ORIGINAL_START: p_start})
                for i, scene in enumerate(target_scenes_for_sfx):
                    overlapping_text = ""
                    for text_seg in scene[_CODE_TEXT.TEXTS]:
                        mat_id = text_seg.get(_CODE_TEXT.MATERIAL_ID)
                        for tm in data.get(_CODE_TEXT.MATERIALS, {}).get(_CODE_TEXT.TEXTS, []):
                            if tm.get(_CODE_TEXT.ID) == mat_id:
                                try:
                                    c_dict = json.loads(tm.get(_CODE_TEXT.CONTENT, _CODE_TEXT.SYMBOL_44136F))
                                    overlapping_text = c_dict.get(_CODE_TEXT.TEXT, '')
                                except:
                                    pass
                                break
                    scene_label = overlapping_text or f'{_CODE_TEXT.SCENE}{i + 1}{_CODE_TEXT.IMAGE}{scene[_CODE_TEXT.PHOTO][_CODE_TEXT.MATERIAL].get(NAME_ATTR)}{_CODE_TEXT.SYMBOL_BA5EC5}'
                    scenes_desc.append({_CODE_TEXT.INDEX: i, _CODE_TEXT.DESCRIPTION: scene_label})
                gemini_api_key = opts.get(OPT_API_KEY)
                sfx_mapping = {}
                if gemini_api_key:
                    try:
                        logging.info(LOG_GEMINI_API_REQUEST)
                        scenes_text = json.dumps(scenes_desc, ensure_ascii=False, indent=2)
                        sfx_list_str = _CODE_TEXT.SYMBOL_01BA47.join(all_sfx_files)
                        prompt = PROMPT_TEMPLATE.format(scenes_text, sfx_list_str)
                        res_text = call_gemini(gemini_api_key, prompt)
                        res_text = re.sub(_CODE_TEXT.JSON_64F096, '', res_text).strip()
                        mapping_data = json.loads(res_text)
                        for item in mapping_data.get(_CODE_TEXT.SFX_MAPPING, []):
                            idx = item.get(_CODE_TEXT.SCENE_INDEX)
                            fn = item.get(_CODE_TEXT.SFX_FILENAME)
                            if fn and fn in all_sfx_files:
                                sfx_mapping[idx] = fn
                    except Exception as gem_err:
                        logging.info(LOG_SFX_GEMINI_ERR.format(gem_err))
                        gemini_api_key = None
                if not gemini_api_key:
                    logging.info(LOG_SFX_AUTO_MATCH)
                    for item in scenes_desc:
                        idx = item[_CODE_TEXT.INDEX]
                        desc = item[_CODE_TEXT.DESCRIPTION].lower()
                        matched_file = None
                        for f in all_sfx_files:
                            f_clean = os.path.splitext(f)[0].lower()
                            f_words = re.split(_CODE_TEXT.S, f_clean)
                            if any(w in desc for w in f_words if len(w) > 2):
                                matched_file = f
                                break
                        if matched_file:
                            sfx_mapping[idx] = matched_file
                if sfx_mapping:
                    logging.info(LOG_SFX_MATCH_SUCCESS.format(len(sfx_mapping)))
                    sfx_track = next((t for t in tracks if t.get(_CODE_TEXT.NAME) == SFX_TRACK_NAME), None)
                    if sfx_track:
                        sfx_track[_CODE_TEXT.SEGMENTS].clear()
                    else:
                        sfx_track_id = SFX_TRACK_ID_PREFIX.format(uuid.uuid4().hex[:8])
                        sfx_track = {_CODE_TEXT.ID: sfx_track_id, _CODE_TEXT.TYPE: _CODE_TEXT.AUDIO, _CODE_TEXT.NAME: SFX_TRACK_NAME, _CODE_TEXT.SEGMENTS: []}
                        tracks.append(sfx_track)
                    for idx, sfx_file in sfx_mapping.items():
                        if idx >= len(target_scenes_for_sfx):
                            continue
                        scene_start = target_scenes_for_sfx[idx][_CODE_TEXT.ORIGINAL_START] if not timeline_modifying else target_scenes_for_sfx[idx][_CODE_TEXT.PHOTO][_CODE_TEXT.SEGMENT].get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0)
                        full_sfx_path = os.path.join(sfx_dir, sfx_file)
                        sfx_dur = get_audio_duration_micros(full_sfx_path)
                        mat_id = SFX_MAT_ID_PREFIX.format(uuid.uuid4().hex[:8])
                        new_mat = {_CODE_TEXT.ID: mat_id, _CODE_TEXT.NAME: sfx_file, _CODE_TEXT.PATH: full_sfx_path.replace(_CODE_TEXT.SYMBOL, _CODE_TEXT.SYMBOL_8A5EDA), _CODE_TEXT.DURATION: sfx_dur, _CODE_TEXT.TYPE: _CODE_TEXT.AUDIO, _CODE_TEXT.VOLUME: 0.8}
                        audios_mat.append(new_mat)
                        seg_id = SFX_SEG_ID_PREFIX.format(uuid.uuid4().hex[:8])
                        new_seg = {_CODE_TEXT.ID: seg_id, _CODE_TEXT.MATERIAL_ID: mat_id, _CODE_TEXT.SOURCE_TIMERANGE: {_CODE_TEXT.START: 0, _CODE_TEXT.DURATION: sfx_dur}, _CODE_TEXT.TARGET_TIMERANGE: {_CODE_TEXT.START: scene_start, _CODE_TEXT.DURATION: sfx_dur}, _CODE_TEXT.VOLUME: {_CODE_TEXT.VOLUME: 0.8}}
                        sfx_track[_CODE_TEXT.SEGMENTS].append(new_seg)
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
        export_output_dir = opts.get(_CODE_TEXT.VIDEO_OUTPUT_DIR, "").strip()
        if not export_output_dir:
            logging.info(LOG_EXPORT_NO_DIR)
            return
        logging.info(LOG_EXPORT_STARTING)
        with open(draft_json_path, _CODE_TEXT.R, encoding=_CODE_TEXT.UTF_8) as f:
            draft_content = json.load(f)
        materials = draft_content.get(_CODE_TEXT.MATERIALS, {})
        videos = materials.get(_CODE_TEXT.VIDEOS, [])
        audios = materials.get(_CODE_TEXT.AUDIOS, [])
        tracks = draft_content.get(_CODE_TEXT.TRACKS, [])
        video_track = next((t for t in tracks if t.get(_CODE_TEXT.TYPE) == _CODE_TEXT.VIDEO), None)
        audio_track = next((t for t in tracks if t.get(_CODE_TEXT.TYPE) == _CODE_TEXT.AUDIO and t.get(_CODE_TEXT.NAME) not in [_CODE_TEXT.BGM_TRACK, _CODE_TEXT.SFX_TRACK]), None)
        image_segs = sorted(video_track.get(_CODE_TEXT.SEGMENTS, []) if video_track else [], key=lambda s: s.get(_CODE_TEXT.TARGET_TIMERANGE, {}).get(_CODE_TEXT.START, 0))
        audio_segs = sorted(audio_track.get(_CODE_TEXT.SEGMENTS, []) if audio_track else [], key=lambda s: s.get(_CODE_TEXT.TARGET_TIMERANGE, {}).get(_CODE_TEXT.START, 0))
        video_mat_map = {v[_CODE_TEXT.ID]: (v.get(_CODE_TEXT.PATH) or v.get(_CODE_TEXT.FILE_PATH)) for v in videos if _CODE_TEXT.ID in v and (v.get(_CODE_TEXT.PATH) or v.get(_CODE_TEXT.FILE_PATH))}
        audio_mat_map = {a[_CODE_TEXT.ID]: (a.get(_CODE_TEXT.PATH) or a.get(_CODE_TEXT.FILE_PATH)) for a in audios if _CODE_TEXT.ID in a and (a.get(_CODE_TEXT.PATH) or a.get(_CODE_TEXT.FILE_PATH))}
        image_items = []
        for seg in image_segs:
            mat_id = seg.get(_CODE_TEXT.MATERIAL_ID)
            mat_path = video_mat_map.get(mat_id)
            if mat_path and os.path.exists(mat_path):
                dur_us = seg.get(_CODE_TEXT.TARGET_TIMERANGE, {}).get(_CODE_TEXT.DURATION, 5000000)
                image_items.append({_CODE_TEXT.PATH: mat_path, _CODE_TEXT.DURATION: dur_us / 1000000.0})
        if not image_items:
            logging.info(LOG_EXPORT_NO_MEDIA)
            return
        audio_items = []
        for seg in audio_segs:
            mat_id = seg.get(_CODE_TEXT.MATERIAL_ID)
            mat_path = audio_mat_map.get(mat_id)
            if mat_path and os.path.exists(mat_path):
                audio_items.append(mat_path)
        export_unique_id = uuid.uuid4().hex[:8]
        main_audio_path = None
        audio_list_file_path = None
        if len(audio_items) == 1:
            main_audio_path = audio_items[0]
        elif len(audio_items) > 1:
            audio_list_file_path = os.path.join(tempfile.gettempdir(), f'{_CODE_TEXT.FFMPEG_AUDLIST}{export_unique_id}{_CODE_TEXT.TXT}')
            with open(audio_list_file_path, _CODE_TEXT.W, encoding=_CODE_TEXT.UTF_8) as f:
                for item in audio_items:
                    posix_path = item.replace(_CODE_TEXT.SYMBOL, _CODE_TEXT.SYMBOL_8A5EDA)
                    posix_path = posix_path.replace(_CODE_TEXT.SYMBOL_265FDA, _CODE_TEXT.SYMBOL_EB70F0)
                    f.write(f'{_CODE_TEXT.FILE}{posix_path}{_CODE_TEXT.SYMBOL_E6AB25}')
        if not audio_items:
            logging.info(LOG_EXPORT_NO_AUDIO)
        logging.info(LOG_EXPORT_RENDERING.format(len(image_items), len(audio_items)))
        os.makedirs(export_output_dir, exist_ok=True)
        export_unique_id = uuid.uuid4().hex[:8]
        list_file_path = os.path.join(tempfile.gettempdir(), f'{_CODE_TEXT.FFMPEG_IMGLIST}{export_unique_id}{_CODE_TEXT.TXT}')
        with open(list_file_path, _CODE_TEXT.W, encoding=_CODE_TEXT.UTF_8) as f:
            for item in image_items:
                posix_path = item[_CODE_TEXT.PATH].replace(_CODE_TEXT.SYMBOL, _CODE_TEXT.SYMBOL_8A5EDA)
                posix_path = posix_path.replace(_CODE_TEXT.SYMBOL_265FDA, _CODE_TEXT.SYMBOL_EB70F0)
                f.write(f'{_CODE_TEXT.FILE}{posix_path}{_CODE_TEXT.SYMBOL_E6AB25}')
                f.write(f'{_CODE_TEXT.DURATION_6F2BEC}{item[_CODE_TEXT.DURATION]:.3f}{_CODE_TEXT.SYMBOL_01BA47}')
            if image_items:
                posix_path = image_items[-1][_CODE_TEXT.PATH].replace(_CODE_TEXT.SYMBOL, _CODE_TEXT.SYMBOL_8A5EDA)
                posix_path = posix_path.replace(_CODE_TEXT.SYMBOL_265FDA, _CODE_TEXT.SYMBOL_EB70F0)
                f.write(f'{_CODE_TEXT.FILE}{posix_path}{_CODE_TEXT.SYMBOL_E6AB25}')
        project_name = opts.get(_CODE_TEXT.PROJECT_NAME, _CODE_TEXT.CAPCUT_EXPORT).strip()
        if not project_name:
            project_name = _CODE_TEXT.CAPCUT_EXPORT
        safe_label = re.sub(_CODE_TEXT.A_ZA_Z0_9, _CODE_TEXT.SYMBOL_D2E2AD, project_name)
        out_video_path = os.path.join(export_output_dir, f'{safe_label}{_CODE_TEXT.SYMBOL_D2E2AD}{export_unique_id}{_CODE_TEXT.MP4}')
        ffmpeg_cmd = [_CODE_TEXT.FFMPEG, _CODE_TEXT.F, _CODE_TEXT.CONCAT, _CODE_TEXT.SAFE, _CODE_TEXT.VALUE_0, _CODE_TEXT.I, list_file_path]
        if audio_list_file_path:
            ffmpeg_cmd.extend([_CODE_TEXT.F, _CODE_TEXT.CONCAT, _CODE_TEXT.SAFE, _CODE_TEXT.VALUE_0, _CODE_TEXT.I, audio_list_file_path])
        elif main_audio_path:
            ffmpeg_cmd.extend([_CODE_TEXT.I, main_audio_path])
        ffmpeg_cmd.extend([_CODE_TEXT.VF, _CODE_TEXT.SCALE_1920_1080_FORCE_ORIGINAL_ASPECT_RATIO_DECREASE_PAD_192, _CODE_TEXT.C_V, _CODE_TEXT.LIBX264, _CODE_TEXT.PRESET, _CODE_TEXT.ULTRAFAST, _CODE_TEXT.CRF, _CODE_TEXT.VALUE_26, _CODE_TEXT.R_1E1CAA, _CODE_TEXT.VALUE_30, _CODE_TEXT.THREADS, _CODE_TEXT.VALUE_0, _CODE_TEXT.PIX_FMT, _CODE_TEXT.YUV420P])
        if audio_list_file_path or main_audio_path:
            ffmpeg_cmd.extend([_CODE_TEXT.C_A, _CODE_TEXT.AAC_501331, _CODE_TEXT.B_A, _CODE_TEXT.VALUE_192K])
        else:
            ffmpeg_cmd.extend([_CODE_TEXT.AN])
        ffmpeg_cmd.extend([_CODE_TEXT.Y_6287C6, out_video_path])
        ffmpeg_exe = _CODE_TEXT.FFMPEG_EXE if os.name == _CODE_TEXT.NT else _CODE_TEXT.FFMPEG
        static_ffmpeg1 = os.path.join(os.getcwd(), ffmpeg_exe)
        static_ffmpeg2 = os.path.join(os.path.dirname(__file__), _CODE_TEXT.SYMBOL_5EC1F7, ffmpeg_exe)
        if os.path.exists(static_ffmpeg1):
            ffmpeg_cmd[0] = static_ffmpeg1
        elif os.path.exists(static_ffmpeg2):
            ffmpeg_cmd[0] = static_ffmpeg2
        process = subprocess.Popen(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding=_CODE_TEXT.UTF_8, errors=_CODE_TEXT.REPLACE)
        for line in iter(process.stdout.readline, ''):
            if line.strip():
                logging.info(f'{_CODE_TEXT.FFMPEG_851922}{line.strip()}')
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
if __name__ == _CODE_TEXT.MAIN:
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
    elif cmd_arg == CMD_SAVE_FILE:
        if len(sys.argv) < 5:
            logging.info(ERR_CLI_USAGE)
            sys.exit(1)
        save_file_dialog(sys.argv[2], sys.argv[3], sys.argv[4])
        sys.exit(0)
    elif cmd_arg == CMD_SELECT_SAVE_FILE:
        select_save_file_dialog(sys.argv[2], sys.argv[3])
        sys.exit(0)
    elif cmd_arg == CMD_SELECT_SAVE_FILE:
        if len(sys.argv) < 4:
            sys.exit(1)
        select_save_file_dialog(sys.argv[2], sys.argv[3])
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
        is_auto_mode = opts.get(_CODE_TEXT.IS_AUTO_MODE, False)
        if is_auto_mode:
            try:
                from capcut_project_builder import generate_capcut_project
                template_path = opts.get(_CODE_TEXT.TEMPLATE_ID, "")
                parent_folder = opts.get(_CODE_TEXT.PARENT_FOLDER, "")
                images_dir_opt = opts.get(_CODE_TEXT.IMAGES_DIR, None)
                voices_dir_opt = opts.get(_CODE_TEXT.VOICES_DIR, None)
                project_name = opts.get(_CODE_TEXT.PROJECT_NAME)
                if not project_name:
                    project_name = _CODE_TEXT.AI_VIDEO + uuid.uuid4().hex[:6]
                logging.info(f'{_CODE_TEXT.AUTO_MODE_GENERATING_NEW_PROJECT}{project_name}{_CODE_TEXT.FROM_TEMPLATE}')
                new_input_path = generate_capcut_project(template_path, parent_folder, project_name, None, images_dir_opt, voices_dir_opt)
                logging.info(f'{_CODE_TEXT.AUTO_MODE_PROJECT_CREATED_AT}{new_input_path}')
                input_file = new_input_path
                output_file = new_input_path
            except Exception as ex:
                logging.info(f'{_CODE_TEXT.ERROR_IN_AUTO_GENERATION}{ex}')
                sys.exit(1)
        style_opts = opts.get(_CODE_TEXT.PROJECT_STYLE, {})
        motion_style = style_opts.get(_CODE_TEXT.CAMERA_MOTION, _CODE_TEXT.DEFAULT)
        transition_style = style_opts.get(_CODE_TEXT.TRANSITIONS, _CODE_TEXT.DEFAULT)
        opts[_CODE_TEXT.MOTION_STYLE] = motion_style
        opts[_CODE_TEXT.TRANSITION_STYLE] = transition_style
        process_capcut_ultra(input_file, output_file, opts)
        if opts.get(_CODE_TEXT.AUTO_EXPORT_VIDEO, False):
            export_video_with_ffmpeg(output_file, opts)
    except Exception as e:
        import traceback
        traceback.print_exc()
        logging.error(ERR_GENERIC.format(e))
        sys.exit(1)
