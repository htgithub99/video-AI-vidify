if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import sys
import json
import os
import base64
import subprocess
import traceback
import math
import random
import re
import threading
import hashlib
import shutil
from concurrent.futures import ThreadPoolExecutor
SCENE_RENDER_TIMEOUT_SECONDS = 180
MAX_DIAGNOSTIC_BYTES = 1024 * 1024
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
class FFMPEG_CONSTANTS:
    RGB24 = _CODE_TEXT.RGB24
    RAW_VIDEO = _CODE_TEXT.RAWVIDEO
    LIBX264 = _CODE_TEXT.LIBX264
    SLOW = _CODE_TEXT.VERYFAST
    HIGH = _CODE_TEXT.HIGH
    AAC = _CODE_TEXT.AAC_501331
    YUV420P = _CODE_TEXT.YUV420P
    ANULLSRC = _CODE_TEXT.ANULLSRC_R_44100_CL_STEREO
    AFADE = _CODE_TEXT.AFADE_T_IN_ST_0_D_0_AFADE_T_OUT_ST_1_D_0
    FADE_IN_BLACK = _CODE_TEXT.FADE_T_IN_ST_0_D_0_COLOR_BLACK
    FADE_OUT_BLACK = _CODE_TEXT.FADE_T_OUT_ST_0_D_1_COLOR_BLACK
    NULL_EFFECT = _CODE_TEXT.NULL
    CONCAT_PREFIX = _CODE_TEXT.FILE_PART_0_MP4
    CONCAT_FORMAT = _CODE_TEXT.CONCAT
    COPY_CODEC = _CODE_TEXT.COPY
    RGB_MODE = _CODE_TEXT.RGB
    BLACK_COLOR = _CODE_TEXT.BLACK
    UTF8 = _CODE_TEXT.UTF_8
    OUTPUT_SUCCESS = _CODE_TEXT.SUCCESS
    JPEG_FORMAT = _CODE_TEXT.JPEG_F4DC1C
    ASSET_VIDEO = _CODE_TEXT.VIDEO
    IMAGE_EXTENSION = _CODE_TEXT.JPG_D912C7
    VIDEO_EXTENSION = _CODE_TEXT.MP4
    VIDEO_SCALE_FILTER = _CODE_TEXT.SCALE_0_1_FORCE_ORIGINAL_ASPECT_RATIO_INCREASE_CROP_0_1_FPS_
    IMAGE_SCALE_FILTER = _CODE_TEXT.SCALE_0_1_FORCE_ORIGINAL_ASPECT_RATIO_INCREASE_CROP_0_1_SETS
    ZOOM_IN_FILTER = _CODE_TEXT.ZOOMPAN_Z_MIN_ZOOM_0_1_08_X_IW_2_IW_ZOOM_2_Y_IH_2_IH_ZOOM_2_
    ZOOM_OUT_FILTER = _CODE_TEXT.ZOOMPAN_Z_IF_EQ_ON_1_1_08_MAX_1_ZOOM_0_X_IW_2_IW_ZOOM_2_Y_IH
    PAN_LEFT_FILTER = _CODE_TEXT.ZOOMPAN_Z_1_08_X_IW_IW_ZOOM_1_ON_0_Y_IH_2_IH_ZOOM_2_D_0_S_1_
    PAN_RIGHT_FILTER = _CODE_TEXT.ZOOMPAN_Z_1_08_X_IW_IW_ZOOM_ON_0_Y_IH_2_IH_ZOOM_2_D_0_S_1_X_
    PAN_UP_FILTER = _CODE_TEXT.ZOOMPAN_Z_1_08_X_IW_2_IW_ZOOM_2_Y_IH_IH_ZOOM_1_ON_0_D_0_S_1_
    PAN_DOWN_FILTER = _CODE_TEXT.ZOOMPAN_Z_1_08_X_IW_2_IW_ZOOM_2_Y_IH_IH_ZOOM_ON_0_D_0_S_1_X_
    VIDEO_TRIM_FILTER = _CODE_TEXT.TRIM_START_0_END_1_SETPTS_PTS_STARTPTS_TPAD_STOP_MODE_CLONE_
    VIDEO_TRIM_START_FILTER = _CODE_TEXT.TRIM_START_0_SETPTS_PTS_STARTPTS_TPAD_STOP_MODE_CLONE_STOP_D
    FFPROBE_NAME = _CODE_TEXT.FFPROBE
    FFPROBE_EXE_NAME = _CODE_TEXT.FFPROBE_EXE
    WINDOWS_EXECUTABLE_EXTENSION = _CODE_TEXT.EXE
    FFPROBE_LOG_LEVEL = _CODE_TEXT.ERROR_CA00FC
    FFPROBE_DURATION_ENTRY = _CODE_TEXT.FORMAT_DURATION
    FFPROBE_OUTPUT_FORMAT = _CODE_TEXT.DEFAULT_NOPRINT_WRAPPERS_1_NOKEY_1
    PROBE_TIMEOUT_SECONDS = 15
    DURATION_PATTERN = _CODE_TEXT.DURATION_S_D_D_D_D
    DURATION_HOURS_GROUP = 1
    DURATION_MINUTES_GROUP = 2
    DURATION_SECONDS_GROUP = 3
    MINUTES_PER_HOUR = 60
    SECONDS_PER_MINUTE = 60
    DEFAULT_TRIM_SECONDS = 0.25
    VIDEO_CONTENT_FOCUS_RATIO = 0.18
    MIN_USABLE_VIDEO_SECONDS = 0.5
    ZERO_SECONDS = 0.0
    DEFAULT_MAX_WORKERS = 1
    INDEX_PADDING = 3
    DEFAULT_SCENE_DURATION = 5
    DEFAULT_OUTPUT_WIDTH = 1920
    DEFAULT_OUTPUT_HEIGHT = 1080
    DEFAULT_OUTPUT_FPS = 30
    DEFAULT_OUTPUT_BITRATE = _CODE_TEXT.VALUE_5000K
    EMPTY_STRING = ""
    BINARY_WRITE_MODE = _CODE_TEXT.WB
    KEY_ASSET_TYPE = _CODE_TEXT.ASSETTYPE
    KEY_IMAGE_BASE64 = _CODE_TEXT.IMAGEBASE64
    KEY_AUDIO_BASE64 = _CODE_TEXT.AUDIOBASE64
    KEY_MEDIA_PATH = _CODE_TEXT.MEDIAPATH
    KEY_AUDIO_PATH = _CODE_TEXT.AUDIOPATH
    KEY_DURATION = _CODE_TEXT.DURATION
    KEY_TRANSITION = _CODE_TEXT.TRANSITION
    KEY_CAMERA_MOTION = _CODE_TEXT.CAMERAMOTION
    KEY_EFFECTS = _CODE_TEXT.EFFECTS
    KEY_LIGHTING_EFFECT = _CODE_TEXT.LIGHTINGEFFECT
    KEY_MAX_SCENE_WORKERS = _CODE_TEXT.MAXSCENEWORKERS
    KEY_VIDEO_TRIM_START_SECONDS = _CODE_TEXT.VIDEOTRIMSTARTSECONDS
    KEY_VIDEO_TRIM_END_SECONDS = _CODE_TEXT.VIDEOTRIMENDSECONDS
    KEY_SCENE_CACHE_DIR = _CODE_TEXT.SCENECACHEDIR
    SCENE_CACHE_VERSION = _CODE_TEXT.SCENE_CACHE_V1
    SCENE_CACHE_MIN_BYTES = 1024
    KEY_SUBTITLE = _CODE_TEXT.SUBTITLE
    KEY_SUBTITLE_CUES = _CODE_TEXT.SUBTITLECUES
    KEY_SUBTITLE_CUE_TEXT = _CODE_TEXT.TEXT
    KEY_SUBTITLE_CUE_START = _CODE_TEXT.STARTOFFSETSECONDS
    KEY_SUBTITLE_CUE_DURATION = _CODE_TEXT.DURATIONSECONDS
    KEY_SUBTITLE_MODE = _CODE_TEXT.SUBTITLEMODE
    KEY_AUDIO_TRACKS = _CODE_TEXT.AUDIOTRACKS
    KEY_CINEMATIC_AUDIO_BRIDGE_MODE = _CODE_TEXT.CINEMATICAUDIOBRIDGEMODE
    KEY_CINEMATIC_DIALOGUE_DETECTED = _CODE_TEXT.CINEMATICDIALOGUEDETECTED
    AUDIO_BRIDGE_AMBIENCE = _CODE_TEXT.AMBIENCE
    AUDIO_EDGE_SMOOTH_SECONDS = 0.04
    KEY_SAFE_PROFILE = _CODE_TEXT.SAFEPROFILE
    SUBTITLE_MODE_BURN_IN = _CODE_TEXT.BURN_IN
    SUBTITLE_MODE_TRACK = _CODE_TEXT.TRACK
    SUBTITLE_MODE_BOTH = _CODE_TEXT.BOTH
    SUBTITLE_FILE_NAME = _CODE_TEXT.SUBTITLES_SRT
    SUBTITLE_CODEC = _CODE_TEXT.MOV_TEXT
    SUBTITLE_STREAM_TITLE = _CODE_TEXT.VIDIFY_SUBTITLES
    KEY_TEXT = _CODE_TEXT.TEXT
    AUDIO_TRACK_VOLUME_FILTER = _CODE_TEXT.VOLUME_0_DB
    AUDIO_TRACK_DELAY_FILTER = _CODE_TEXT.ADELAY_0_0
    AUDIO_TRACK_TRIM_FILTER = _CODE_TEXT.ATRIM_DURATION_0
    AUDIO_TRACK_FADE_IN_FILTER = _CODE_TEXT.AFADE_T_IN_ST_0_D_0
    AUDIO_TRACK_FADE_OUT_FILTER = _CODE_TEXT.AFADE_T_OUT_ST_0_D_1
    AUDIO_MIX_FILTER = _CODE_TEXT.AMIX_INPUTS_0_DURATION_FIRST_DROPOUT_TRANSITION_2_LOUDNORM_I
    TEMP_MEDIA_TEMPLATE = _CODE_TEXT.MEDIA_0_1
    TEMP_AUDIO_TEMPLATE = _CODE_TEXT.AUDIO_0_MP3
    PART_FILE_TEMPLATE = _CODE_TEXT.PART_0_MP4
    PART_ERROR_TEMPLATE = _CODE_TEXT.FFMPEG_SCENE_0_FAILED_WITH_CODE_1_2
    ZOOM_IN = _CODE_TEXT.ZOOM_IN_C852FE
    ZOOM_OUT = _CODE_TEXT.ZOOM_OUT_FCBF91
    PAN_LEFT = _CODE_TEXT.PAN_LEFT_DDA81C
    PAN_RIGHT = _CODE_TEXT.PAN_RIGHT_87A111
    PAN_UP = _CODE_TEXT.PAN_UP_55A047
    PAN_DOWN = _CODE_TEXT.PAN_DOWN_288EAF
    DRIFT = _CODE_TEXT.DRIFT
    ARC = _CODE_TEXT.ARC
    PUSH = _CODE_TEXT.PUSH_D107EA
    REVEAL = _CODE_TEXT.REVEAL
    STATIC = _CODE_TEXT.STATIC
    DEFAULT = _CODE_TEXT.DEFAULT
    TRANS_CROSS = _CODE_TEXT.CROSS_DISSOLVE
    TRANS_BLUR = _CODE_TEXT.BLUR_DISSOLVE
    TRANS_BRIGHT = _CODE_TEXT.BRIGHTNESS_FADE
    TRANS_ZOOM = _CODE_TEXT.ZOOM_TRANSITION
    TRANS_SLIDE = _CODE_TEXT.SLIDE_LEFT_E2065A
    TRANS_SLIDE_UP = _CODE_TEXT.SLIDE_UP
    TRANS_FADE_BLACK = _CODE_TEXT.FADE_BLACK
    TRANS_FADE_WHITE = _CODE_TEXT.FADE_WHITE
    TRANS_CUT = _CODE_TEXT.CUT
    TRANS_SLIDE_RIGHT = _CODE_TEXT.SLIDE_RIGHT_88C69B
    TRANS_SLIDE_DOWN = _CODE_TEXT.SLIDE_DOWN
    TRANS_WIPE_LEFT = _CODE_TEXT.WIPE_LEFT
    TRANS_WIPE_RIGHT = _CODE_TEXT.WIPE_RIGHT
    TRANS_WIPE_UP = _CODE_TEXT.WIPE_UP
    TRANS_WIPE_DOWN = _CODE_TEXT.WIPE_DOWN
    TRANS_FLASH = _CODE_TEXT.FLASH_851E43
    TRANS_WHIP_LEFT = _CODE_TEXT.WHIP_LEFT
    TRANS_WHIP_RIGHT = _CODE_TEXT.WHIP_RIGHT
    TRANS_GLITCH = _CODE_TEXT.GLITCH_TRANSITION
    TRANS_FILM_BURN = _CODE_TEXT.FILM_BURN_5D5A1B
    EFFECT_SAD_KEYS = [_CODE_TEXT.SAD, _CODE_TEXT.GLOOMY, _CODE_TEXT.DARK, _CODE_TEXT.MELANCHOLIC, _CODE_TEXT.VIGNETTE, _CODE_TEXT.SHADOW]
    EFFECT_VINTAGE_KEYS = [_CODE_TEXT.VINTAGE, _CODE_TEXT.SEPIA, _CODE_TEXT.OLD_PHOTO, _CODE_TEXT.GRAIN, _CODE_TEXT.RETRO, _CODE_TEXT.CLASSIC]
    EFFECT_DREAMY_KEYS = [_CODE_TEXT.DREAMY, _CODE_TEXT.GLOW, _CODE_TEXT.BLOOM, _CODE_TEXT.ETHEREAL, _CODE_TEXT.MYSTERY, _CODE_TEXT.MAGICAL, _CODE_TEXT.SOFT_LIGHT]
    EFFECT_GLITCH_KEYS = [_CODE_TEXT.GLITCH_64AAC4, _CODE_TEXT.ACTION, _CODE_TEXT.CYBERPUNK, _CODE_TEXT.ENERGY, _CODE_TEXT.INTENSE, _CODE_TEXT.SHAKING, _CODE_TEXT.VIBRANT]
    EFFECT_WARM_KEYS = [_CODE_TEXT.WARM, _CODE_TEXT.GOLDEN_HOUR, _CODE_TEXT.SUNNY, _CODE_TEXT.BRIGHT, _CODE_TEXT.ROMANTIC]
    EFFECT_COLD_KEYS = [_CODE_TEXT.COLD, _CODE_TEXT.WINTER, _CODE_TEXT.SNOW, _CODE_TEXT.FROSTY, _CODE_TEXT.BLUE_MOOD, _CODE_TEXT.L_NH, _CODE_TEXT.B_NG]
    EFFECT_NOIR_KEYS = [_CODE_TEXT.NOIR, _CODE_TEXT.BW, _CODE_TEXT.BLACK_AND_WHITE, _CODE_TEXT.MONOCHROME, _CODE_TEXT.TR_NG_EN]
    EFFECT_HORROR_KEYS = [_CODE_TEXT.HORROR, _CODE_TEXT.SCARY, _CODE_TEXT.GHOSTLY, _CODE_TEXT.FOGGY, _CODE_TEXT.MISTY, _CODE_TEXT.KINH_D, _CODE_TEXT.S_NG_M]
    EFFECT_VHS_KEYS = [_CODE_TEXT.VHS, _CODE_TEXT.ANALOG, _CODE_TEXT.TV_DISTORTION, _CODE_TEXT.SCANLINE, _CODE_TEXT.NHI_U]
    EFFECT_NEON_KEYS = [_CODE_TEXT.NEON, _CODE_TEXT.GLOW_NEON, _CODE_TEXT.CYBERPUNK_COLOR, _CODE_TEXT.S_C_S]
    DEFAULT_LIGHTING_EFFECT = _CODE_TEXT.NATURAL_LIGHT
    SHORT_SCENE_DURATION = 2.5
    SHORT_SCENE_LIGHTING_EFFECTS = {_CODE_TEXT.STROBE, _CODE_TEXT.FLICKER}
    SHORT_SCENE_VISUAL_EFFECTS = {_CODE_TEXT.GLITCH_64AAC4, _CODE_TEXT.VHS, _CODE_TEXT.PIXELATE}
    SHORT_SCENE_VISUAL_FALLBACK = _CODE_TEXT.SOFT_FOCUS
    COMFORT_MIN_INTENSE_DURATION = 3.5
    COMFORT_EFFECT_COOLDOWN_SCENES = 6
    DISRUPTIVE_LIGHTING_EFFECTS = {_CODE_TEXT.STROBE, _CODE_TEXT.FLICKER, _CODE_TEXT.EXPOSURE_PULSE}
    DISRUPTIVE_VISUAL_EFFECTS = {_CODE_TEXT.GLITCH_64AAC4, _CODE_TEXT.VHS, _CODE_TEXT.PIXELATE, _CODE_TEXT.CHROMATIC_ABERRATION}
    DISRUPTIVE_TRANSITIONS = {_CODE_TEXT.FLASH_851E43, _CODE_TEXT.WHIP_LEFT, _CODE_TEXT.WHIP_RIGHT, _CODE_TEXT.GLITCH_TRANSITION, _CODE_TEXT.ZOOM_TRANSITION}
    MOTION_STYLE_BY_ID = {
        _CODE_TEXT.ZOOM_IN_952328: 0,
        _CODE_TEXT.ZOOM_OUT_1BDD5F: 1,
        _CODE_TEXT.PAN_LEFT_1D9B11: 2,
        _CODE_TEXT.PAN_RIGHT_AB81E6: 3,
        _CODE_TEXT.PAN_UP_A5AC98: 4,
        _CODE_TEXT.PAN_DOWN_BE8BF5: 5,
        _CODE_TEXT.DIAGONAL_DOWN_RIGHT: 6,
        _CODE_TEXT.DIAGONAL_UP_RIGHT: 7,
        _CODE_TEXT.CINEMATIC_ARC: 8,
        _CODE_TEXT.DRIFT: 9,
        _CODE_TEXT.PUSH_IN_DE0F36: 10,
        _CODE_TEXT.SLOW_REVEAL: 11,
        _CODE_TEXT.STATIC: 12,
        _CODE_TEXT.DIAGONAL_UP_LEFT: 13,
        _CODE_TEXT.DIAGONAL_DOWN_LEFT: 14,
        _CODE_TEXT.PULL_OUT_FC6E97: 15,
        _CODE_TEXT.FLOATING_CAMERA: 16,
        _CODE_TEXT.HANDHELD_SOFT: 17,
        _CODE_TEXT.PARALLAX_LEFT: 18,
        _CODE_TEXT.PARALLAX_RIGHT: 19,
    }
    TRANSITION_IDS = {
        _CODE_TEXT.CUT,
        _CODE_TEXT.CROSS_DISSOLVE,
        _CODE_TEXT.BLUR_DISSOLVE,
        _CODE_TEXT.BRIGHTNESS_FADE,
        _CODE_TEXT.FADE_BLACK,
        _CODE_TEXT.FADE_WHITE,
        _CODE_TEXT.SLIDE_LEFT_E2065A,
        _CODE_TEXT.SLIDE_RIGHT_88C69B,
        _CODE_TEXT.SLIDE_UP,
        _CODE_TEXT.SLIDE_DOWN,
        _CODE_TEXT.WIPE_LEFT,
        _CODE_TEXT.WIPE_RIGHT,
        _CODE_TEXT.WIPE_UP,
        _CODE_TEXT.WIPE_DOWN,
        _CODE_TEXT.ZOOM_TRANSITION,
        _CODE_TEXT.FLASH_851E43,
        _CODE_TEXT.WHIP_LEFT,
        _CODE_TEXT.WHIP_RIGHT,
        _CODE_TEXT.GLITCH_TRANSITION,
        _CODE_TEXT.FILM_BURN_5D5A1B,
    }
def format_srt_timestamp(seconds):
    total_milliseconds = max(0, round(float(seconds) * 1000))
    hours, remainder = divmod(total_milliseconds, 3600000)
    minutes, remainder = divmod(remainder, 60000)
    secs, milliseconds = divmod(remainder, 1000)
    return f'{hours:02d}{_CODE_TEXT.SYMBOL_E7AC07}{minutes:02d}{_CODE_TEXT.SYMBOL_E7AC07}{secs:02d}{_CODE_TEXT.SYMBOL_D03502}{milliseconds:03d}'
def create_subtitle_file(temp_dir, scenes, durations):
    subtitle_path = os.path.join(temp_dir, FFMPEG_CONSTANTS.SUBTITLE_FILE_NAME)
    entries = []
    cursor = 0.0
    for index, scene in enumerate(scenes):
        duration = float(durations[index])
        subtitle_cues = scene.get(FFMPEG_CONSTANTS.KEY_SUBTITLE_CUES) or []
        if subtitle_cues:
            for cue in subtitle_cues:
                text = str(cue.get(FFMPEG_CONSTANTS.KEY_SUBTITLE_CUE_TEXT) or "").strip()
                start_seconds = cursor + max(0, float(cue.get(FFMPEG_CONSTANTS.KEY_SUBTITLE_CUE_START) or 0))
                cue_duration = max(0, float(cue.get(FFMPEG_CONSTANTS.KEY_SUBTITLE_CUE_DURATION) or 0))
                if text and cue_duration > FFMPEG_CONSTANTS.ZERO_SECONDS:
                    entries.append(f'{len(entries) + 1}{_CODE_TEXT.SYMBOL_01BA47}{format_srt_timestamp(start_seconds)}{_CODE_TEXT.SYMBOL_0BC923}{format_srt_timestamp(start_seconds + cue_duration)}{_CODE_TEXT.SYMBOL_01BA47}{text}{_CODE_TEXT.SYMBOL_01BA47}')
        else:
            text = str(scene.get(FFMPEG_CONSTANTS.KEY_SUBTITLE) or scene.get(FFMPEG_CONSTANTS.KEY_TEXT) or "").strip()
            if text:
                entries.append(f'{len(entries) + 1}{_CODE_TEXT.SYMBOL_01BA47}{format_srt_timestamp(cursor)}{_CODE_TEXT.SYMBOL_0BC923}{format_srt_timestamp(cursor + duration)}{_CODE_TEXT.SYMBOL_01BA47}{text}{_CODE_TEXT.SYMBOL_01BA47}')
        cursor += duration
    with open(subtitle_path, _CODE_TEXT.W, encoding=FFMPEG_CONSTANTS.UTF8) as subtitle_file:
        subtitle_file.write(_CODE_TEXT.SYMBOL_01BA47.join(entries))
    return subtitle_path if entries else None
def create_subtitle_filter(subtitle_path):
    subtitle_style = _CODE_TEXT.FONTNAME_ARIAL_FONTSIZE_13_PRIMARYCOLOUR_H00FFFFFF_OUTLINECO
    return f'{_CODE_TEXT.SUBTITLES_FILENAME}{os.path.basename(subtitle_path)}{_CODE_TEXT.FORCE_STYLE}{subtitle_style}{_CODE_TEXT.SYMBOL_265FDA}'
def add_subtitle_input(command, subtitle_path, subtitle_input_index):
    if not subtitle_path:
        return None
    command.extend([_CODE_TEXT.I, subtitle_path])
    return subtitle_input_index
def add_subtitle_output(command, subtitle_path, subtitle_mode, subtitle_input_index):
    burn_subtitles = subtitle_mode in (
        FFMPEG_CONSTANTS.SUBTITLE_MODE_BURN_IN,
        FFMPEG_CONSTANTS.SUBTITLE_MODE_BOTH,
    )
    include_track = subtitle_mode in (
        FFMPEG_CONSTANTS.SUBTITLE_MODE_TRACK,
        FFMPEG_CONSTANTS.SUBTITLE_MODE_BOTH,
    )
    if burn_subtitles:
        command.extend(
            [
                _CODE_TEXT.VF,
                create_subtitle_filter(subtitle_path),
                _CODE_TEXT.C_V,
                FFMPEG_CONSTANTS.LIBX264,
                _CODE_TEXT.PRESET,
                FFMPEG_CONSTANTS.SLOW,
                _CODE_TEXT.PIX_FMT,
                FFMPEG_CONSTANTS.YUV420P,
            ]
        )
    else:
        command.extend([_CODE_TEXT.C_V, FFMPEG_CONSTANTS.COPY_CODEC])
    if include_track:
        command.extend(
            [
                _CODE_TEXT.MAP,
                f'{subtitle_input_index}{_CODE_TEXT.S_0}',
                _CODE_TEXT.C_S,
                FFMPEG_CONSTANTS.SUBTITLE_CODEC,
                _CODE_TEXT.METADATA_S_S_0,
                f'{_CODE_TEXT.TITLE}{FFMPEG_CONSTANTS.SUBTITLE_STREAM_TITLE}',
            ]
        )
    COLOR_BLACK_RGB = (0, 0, 0)
    COLOR_WHITE_RGB = (255, 255, 255)
    COLOR_FOG_RGB = (200, 200, 200)
    COLOR_COLD_TINT_RGB = (100, 140, 240)
    COLOR_WARM_TINT_RGB = (255, 200, 150)
    COLOR_GLOW_TINT_RGB = (255, 140, 0)
def get_ffprobe_command(ffmpeg_cmd):
    ffmpeg_directory = os.path.dirname(ffmpeg_cmd)
    ffmpeg_name = os.path.basename(ffmpeg_cmd).lower()
    ffprobe_name = FFMPEG_CONSTANTS.FFPROBE_EXE_NAME if ffmpeg_name.endswith(FFMPEG_CONSTANTS.WINDOWS_EXECUTABLE_EXTENSION) else FFMPEG_CONSTANTS.FFPROBE_NAME
    sibling_path = os.path.join(ffmpeg_directory, ffprobe_name) if ffmpeg_directory else ffprobe_name
    return sibling_path if os.path.exists(sibling_path) else ffprobe_name
def get_media_duration(ffmpeg_cmd, media_path):
    command = [
        get_ffprobe_command(ffmpeg_cmd),
        _CODE_TEXT.V,
        FFMPEG_CONSTANTS.FFPROBE_LOG_LEVEL,
        _CODE_TEXT.SHOW_ENTRIES,
        FFMPEG_CONSTANTS.FFPROBE_DURATION_ENTRY,
        _CODE_TEXT.OF,
        FFMPEG_CONSTANTS.FFPROBE_OUTPUT_FORMAT,
        media_path,
    ]
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=FFMPEG_CONSTANTS.PROBE_TIMEOUT_SECONDS,
            check=False,
        )
        duration = max(float(result.stdout.strip()), FFMPEG_CONSTANTS.ZERO_SECONDS)
        if duration > FFMPEG_CONSTANTS.ZERO_SECONDS:
            return duration
    except (OSError, ValueError, subprocess.SubprocessError):
        pass
    try:
        result = subprocess.run(
            [ffmpeg_cmd, _CODE_TEXT.I, media_path],
            capture_output=True,
            text=True,
            timeout=FFMPEG_CONSTANTS.PROBE_TIMEOUT_SECONDS,
            check=False,
        )
        match = re.search(FFMPEG_CONSTANTS.DURATION_PATTERN, result.stderr)
        if not match:
            return FFMPEG_CONSTANTS.ZERO_SECONDS
        hours = float(match.group(FFMPEG_CONSTANTS.DURATION_HOURS_GROUP))
        minutes = float(match.group(FFMPEG_CONSTANTS.DURATION_MINUTES_GROUP))
        seconds = float(match.group(FFMPEG_CONSTANTS.DURATION_SECONDS_GROUP))
        return hours * FFMPEG_CONSTANTS.MINUTES_PER_HOUR * FFMPEG_CONSTANTS.SECONDS_PER_MINUTE + minutes * FFMPEG_CONSTANTS.SECONDS_PER_MINUTE + seconds
    except (OSError, ValueError, subprocess.SubprocessError):
        return FFMPEG_CONSTANTS.ZERO_SECONDS
def media_has_audio_stream(ffmpeg_cmd, media_path):
    try:
        result = subprocess.run(
            [
                get_ffprobe_command(ffmpeg_cmd),
                _CODE_TEXT.V,
                _CODE_TEXT.ERROR_CA00FC,
                _CODE_TEXT.SELECT_STREAMS,
                _CODE_TEXT.A_0,
                _CODE_TEXT.SHOW_ENTRIES,
                _CODE_TEXT.STREAM_CODEC_TYPE,
                _CODE_TEXT.OF,
                _CODE_TEXT.CSV_P_0,
                media_path,
            ],
            capture_output=True,
            text=True,
            timeout=FFMPEG_CONSTANTS.PROBE_TIMEOUT_SECONDS,
            check=False,
        )
        return result.returncode == 0 and _CODE_TEXT.AUDIO in result.stdout.lower()
    except (OSError, subprocess.SubprocessError):
        return False
def create_automatic_music_bed(ffmpeg_cmd, temp_dir, duration_seconds, profile):
    profiles = {
        _CODE_TEXT.SATIRICAL_EDITORIAL: (110.0, 164.81, 220.0, _CODE_TEXT.PINK, 950),
        _CODE_TEXT.TENSION_PULSE: (55.0, 82.41, 110.0, _CODE_TEXT.BROWN, 520),
        _CODE_TEXT.LIGHT_WARM: (130.81, 196.0, 261.63, _CODE_TEXT.PINK, 1300),
        _CODE_TEXT.REFLECTIVE_AMBIENT: (73.42, 110.0, 146.83, _CODE_TEXT.BROWN, 720),
        _CODE_TEXT.DOCUMENTARY_EDITORIAL: (82.41, 123.47, 164.81, _CODE_TEXT.PINK, 820),
        _CODE_TEXT.CURIOUS_EXPLAINER: (98.0, 146.83, 220.0, _CODE_TEXT.PINK, 1150),
        _CODE_TEXT.FORENSIC_RESTRAINT: (55.0, 73.42, 110.0, _CODE_TEXT.BROWN, 430),
        _CODE_TEXT.CLEAN_REVIEW: (110.0, 164.81, 246.94, _CODE_TEXT.PINK, 1250),
        _CODE_TEXT.COUNTDOWN_MOMENTUM: (123.47, 185.0, 246.94, _CODE_TEXT.PINK, 1200),
        _CODE_TEXT.HUMAN_STORY_ARC: (73.42, 123.47, 196.0, _CODE_TEXT.BROWN, 760),
        _CODE_TEXT.WORLD_DISCOVERY: (65.41, 98.0, 196.0, _CODE_TEXT.BROWN, 680),
    }
    frequencies = profiles.get(profile, profiles[_CODE_TEXT.DOCUMENTARY_EDITORIAL])
    output_path = os.path.join(temp_dir, _CODE_TEXT.AUTOMATIC_MUSIC_BED_WAV)
    duration = max(1.0, float(duration_seconds))
    command = [ffmpeg_cmd, _CODE_TEXT.Y_6287C6]
    for frequency in frequencies[:3]:
        command.extend(
            [
                _CODE_TEXT.F,
                _CODE_TEXT.LAVFI,
                _CODE_TEXT.I,
                f'{_CODE_TEXT.SINE_FREQUENCY}{frequency}{_CODE_TEXT.SAMPLE_RATE_48000_DURATION}{duration}',
            ]
        )
    command.extend(
        [
            _CODE_TEXT.F,
            _CODE_TEXT.LAVFI,
            _CODE_TEXT.I,
            f'{_CODE_TEXT.ANOISESRC_COLOR}{frequencies[3]}{_CODE_TEXT.AMPLITUDE_0_018_SAMPLE_RATE_48000_DURATION}{duration}',
        ]
    )
    filter_graph = f'{_CODE_TEXT.VALUE_0_A_VOLUME_0_018_A0_1_A_VOLUME_0_012_A1_2_A_VOLUME_0_007_A2_}{frequencies[4]}{_CODE_TEXT.HIGHPASS_F_45_VOLUME_0_32_TEXTURE_A0_A1_A2_TEXTURE_AMIX_INPU}'
    command.extend(
        [
            _CODE_TEXT.FILTER_COMPLEX,
            filter_graph,
            _CODE_TEXT.MAP,
            _CODE_TEXT.MUSIC_E3EDBE,
            _CODE_TEXT.C_A,
            _CODE_TEXT.PCM_S16LE,
            output_path,
        ]
    )
    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        return output_path if os.path.exists(output_path) else None
    except (OSError, subprocess.SubprocessError):
        return None
def create_automatic_accent_track(ffmpeg_cmd, temp_dir, scenes, profile):
    accent_events = [(0.12, _CODE_TEXT.IMPACT)]
    timeline_seconds = 0.0
    last_accent_seconds = -20.0
    for scene in scenes:
        purpose = str(scene.get(_CODE_TEXT.SHOTPURPOSE, "")).lower()
        transition = str(scene.get(_CODE_TEXT.TRANSITION, "")).lower()
        visible_action = str(scene.get(_CODE_TEXT.VISIBLEACTION, "")).lower()
        is_emphasis = purpose in (_CODE_TEXT.REVEAL, _CODE_TEXT.PUNCHLINE, _CODE_TEXT.CHAPTER_TURN, _CODE_TEXT.TURNING_POINT)
        is_chapter_boundary = transition == _CODE_TEXT.FADE_BLACK
        if is_emphasis and timeline_seconds - last_accent_seconds >= 8.0:
            accent_events.append((max(0.0, timeline_seconds + 0.08), _CODE_TEXT.IMPACT if purpose in (_CODE_TEXT.REVEAL, _CODE_TEXT.TURNING_POINT) else _CODE_TEXT.SOFT))
            last_accent_seconds = timeline_seconds
        elif is_chapter_boundary and timeline_seconds - last_accent_seconds >= 15.0:
            accent_events.append((max(0.0, timeline_seconds + float(scene.get(_CODE_TEXT.DURATION, 0))), _CODE_TEXT.WHOOSH))
            last_accent_seconds = timeline_seconds
        action_type = None
        if re.search(_CODE_TEXT.BDOOR_B_C_A, visible_action):
            action_type = _CODE_TEXT.DOOR
        elif re.search(_CODE_TEXT.BFOOTSTEPS_B_BWALK_S_ING_ED_B_B_C_CH_N_I_B, visible_action):
            action_type = _CODE_TEXT.FOOTSTEP
        elif re.search(_CODE_TEXT.BPHONE_B_I_N_THO_I_TIN_NH_N, visible_action):
            action_type = _CODE_TEXT.PHONE
        elif re.search(_CODE_TEXT.BCAR_B_BVEHICLE_B_XE_M_Y_T, visible_action):
            action_type = _CODE_TEXT.VEHICLE
        if action_type and timeline_seconds - last_accent_seconds >= 2.5:
            accent_events.append((max(0.0, timeline_seconds + 0.15), action_type))
            last_accent_seconds = timeline_seconds
        timeline_seconds += float(scene.get(_CODE_TEXT.DURATION, 0))
    accent_events = accent_events[:10]
    if not accent_events:
        return None
    bright_profiles = (_CODE_TEXT.SATIRICAL_EDITORIAL, _CODE_TEXT.LIGHT_WARM, _CODE_TEXT.CLEAN_REVIEW, _CODE_TEXT.COUNTDOWN_MOMENTUM, _CODE_TEXT.CURIOUS_EXPLAINER)
    base_frequency = 520 if profile in bright_profiles else 95
    output_path = os.path.join(temp_dir, _CODE_TEXT.AUTOMATIC_ACCENT_TRACK_WAV)
    command = [ffmpeg_cmd, _CODE_TEXT.Y_6287C6]
    for _, event_type in accent_events:
        if event_type == _CODE_TEXT.WHOOSH:
            source = _CODE_TEXT.ANOISESRC_COLOR_WHITE_AMPLITUDE_0_16_SAMPLE_RATE_48000_DURAT
        elif event_type == _CODE_TEXT.DOOR:
            source = _CODE_TEXT.ANOISESRC_COLOR_BROWN_AMPLITUDE_0_20_SAMPLE_RATE_48000_DURAT
        elif event_type == _CODE_TEXT.FOOTSTEP:
            source = _CODE_TEXT.ANOISESRC_COLOR_BROWN_AMPLITUDE_0_18_SAMPLE_RATE_48000_DURAT
        elif event_type == _CODE_TEXT.PHONE:
            source = _CODE_TEXT.SINE_FREQUENCY_880_SAMPLE_RATE_48000_DURATION_0_16
        elif event_type == _CODE_TEXT.VEHICLE:
            source = _CODE_TEXT.ANOISESRC_COLOR_BROWN_AMPLITUDE_0_16_SAMPLE_RATE_48000_DURAT
        elif event_type == _CODE_TEXT.SOFT:
            source = _CODE_TEXT.ANOISESRC_COLOR_PINK_AMPLITUDE_0_10_SAMPLE_RATE_48000_DURATI
        else:
            source = f'{_CODE_TEXT.SINE_FREQUENCY}{base_frequency}{_CODE_TEXT.SAMPLE_RATE_48000_DURATION_0_38}'
        command.extend([_CODE_TEXT.F, _CODE_TEXT.LAVFI, _CODE_TEXT.I, source])
    filters = []
    labels = []
    for index, (accent_time, event_type) in enumerate(accent_events):
        delay_ms = round(accent_time * 1000)
        label = f'{_CODE_TEXT.ACCENT}{index}'
        if event_type == _CODE_TEXT.WHOOSH:
            treatment = _CODE_TEXT.HIGHPASS_F_180_LOWPASS_F_5500_AFADE_T_IN_ST_0_D_0_22_AFADE_T
        elif event_type == _CODE_TEXT.DOOR:
            treatment = _CODE_TEXT.HIGHPASS_F_70_LOWPASS_F_950_AFADE_T_OUT_ST_0_03_D_0_24_VOLUM
        elif event_type == _CODE_TEXT.FOOTSTEP:
            treatment = _CODE_TEXT.HIGHPASS_F_55_LOWPASS_F_520_TREMOLO_F_4_D_0_45_AFADE_T_OUT_S
        elif event_type == _CODE_TEXT.PHONE:
            treatment = _CODE_TEXT.HIGHPASS_F_650_LOWPASS_F_1800_AFADE_T_OUT_ST_0_08_D_0_08_VOL
        elif event_type == _CODE_TEXT.VEHICLE:
            treatment = _CODE_TEXT.HIGHPASS_F_45_LOWPASS_F_380_AFADE_T_IN_ST_0_D_0_18_AFADE_T_O
        elif event_type == _CODE_TEXT.SOFT:
            treatment = _CODE_TEXT.HIGHPASS_F_120_LOWPASS_F_2200_AFADE_T_OUT_ST_0_03_D_0_30_VOL
        else:
            treatment = _CODE_TEXT.LOWPASS_F_180_AFADE_T_OUT_ST_0_02_D_0_35_VOLUME_16DB
        filters.append(f'{_CODE_TEXT.SYMBOL_245843}{index}{_CODE_TEXT.A}{treatment}{_CODE_TEXT.ADELAY}{delay_ms}{_CODE_TEXT.ALL_1}{label}{_CODE_TEXT.SYMBOL_CFAE0D}')
        labels.append(f'{_CODE_TEXT.SYMBOL_245843}{label}{_CODE_TEXT.SYMBOL_CFAE0D}')
    filters.append(f"{''.join(labels)}{_CODE_TEXT.AMIX_INPUTS}{len(labels)}{_CODE_TEXT.NORMALIZE_0_APAD_ACCENTS}")
    command.extend(
        [
            _CODE_TEXT.FILTER_COMPLEX,
            _CODE_TEXT.SYMBOL_41B805.join(filters),
            _CODE_TEXT.MAP,
            _CODE_TEXT.ACCENTS,
            _CODE_TEXT.T,
            str(max(1.0, timeline_seconds)),
            _CODE_TEXT.C_A,
            _CODE_TEXT.PCM_S16LE,
            output_path,
        ]
    )
    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        return output_path if os.path.exists(output_path) else None
    except (OSError, subprocess.SubprocessError):
        return None
def validate_rendered_output(ffmpeg_cmd, media_path, width, height, expected_duration, audio_required):
    if not os.path.exists(media_path) or os.path.getsize(media_path) < 1024:
        raise Exception(_CODE_TEXT.FINAL_RENDER_IS_MISSING_OR_EMPTY)
    command = [
        get_ffprobe_command(ffmpeg_cmd),
        _CODE_TEXT.V,
        _CODE_TEXT.ERROR_CA00FC,
        _CODE_TEXT.SHOW_ENTRIES,
        _CODE_TEXT.FORMAT_DURATION_STREAM_CODEC_TYPE_WIDTH_HEIGHT,
        _CODE_TEXT.OF,
        _CODE_TEXT.JSON_02BD17,
        media_path,
    ]
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=FFMPEG_CONSTANTS.PROBE_TIMEOUT_SECONDS,
            check=True,
        )
        metadata = json.loads(result.stdout)
    except (OSError, ValueError, json.JSONDecodeError, subprocess.SubprocessError) as error:
        raise Exception(_CODE_TEXT.FINAL_RENDER_COULD_NOT_BE_INSPECTED) from error
    streams = metadata.get(_CODE_TEXT.STREAMS, [])
    video_stream = next((stream for stream in streams if stream.get(_CODE_TEXT.CODEC_TYPE) == _CODE_TEXT.VIDEO), None)
    has_audio = any(stream.get(_CODE_TEXT.CODEC_TYPE) == _CODE_TEXT.AUDIO for stream in streams)
    if not video_stream:
        raise Exception(_CODE_TEXT.FINAL_RENDER_HAS_NO_VIDEO_STREAM)
    if int(video_stream.get(_CODE_TEXT.WIDTH, 0)) != int(width) or int(video_stream.get(_CODE_TEXT.HEIGHT, 0)) != int(height):
        raise Exception(_CODE_TEXT.FINAL_RENDER_RESOLUTION_DOES_NOT_MATCH_THE_REQUESTED_OUTPUT)
    if audio_required and not has_audio:
        raise Exception(_CODE_TEXT.FINAL_RENDER_HAS_NO_AUDIO_STREAM)
    actual_duration = float(metadata.get(_CODE_TEXT.FORMAT, {}).get(_CODE_TEXT.DURATION, 0) or 0)
    tolerance = max(1.25, expected_duration * 0.05)
    if actual_duration <= 0 or (expected_duration > 0 and abs(actual_duration - expected_duration) > tolerance):
        raise Exception(_CODE_TEXT.FINAL_RENDER_DURATION_IS_OUTSIDE_THE_EXPECTED_RANGE)
def get_video_trim_filter(ffmpeg_cmd, media_path, trim_start, trim_end, output_duration):
    source_duration = get_media_duration(ffmpeg_cmd, media_path)
    safe_start = max(float(trim_start), FFMPEG_CONSTANTS.ZERO_SECONDS)
    safe_end = max(float(trim_end), FFMPEG_CONSTANTS.ZERO_SECONDS)
    if source_duration <= FFMPEG_CONSTANTS.ZERO_SECONDS:
        return FFMPEG_CONSTANTS.VIDEO_TRIM_START_FILTER.format(safe_start, output_duration)
    maximum_trim = max(
        source_duration - FFMPEG_CONSTANTS.MIN_USABLE_VIDEO_SECONDS,
        FFMPEG_CONSTANTS.ZERO_SECONDS,
    )
    safe_start = min(safe_start, maximum_trim)
    safe_end = min(safe_end, maximum_trim - safe_start)
    usable_end = max(safe_start + FFMPEG_CONSTANTS.MIN_USABLE_VIDEO_SECONDS, source_duration - safe_end)
    usable_duration = max(usable_end - safe_start, FFMPEG_CONSTANTS.MIN_USABLE_VIDEO_SECONDS)
    selected_duration = min(max(float(output_duration), FFMPEG_CONSTANTS.MIN_USABLE_VIDEO_SECONDS), usable_duration)
    selection_slack = max(usable_duration - selected_duration, FFMPEG_CONSTANTS.ZERO_SECONDS)
    safe_start += selection_slack * FFMPEG_CONSTANTS.VIDEO_CONTENT_FOCUS_RATIO
    end_position = min(usable_end, safe_start + selected_duration)
    return FFMPEG_CONSTANTS.VIDEO_TRIM_FILTER.format(
        safe_start,
        end_position,
        output_duration,
    )
def update_hash_from_file(digest, file_path):
    if not file_path or not os.path.exists(file_path):
        digest.update(b"missing")
        return
    with open(file_path, _CODE_TEXT.RB) as source_file:
        while True:
            chunk = source_file.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
def create_scene_cache_key(media_path, audio_path, render_signature):
    digest = hashlib.sha256()
    digest.update(FFMPEG_CONSTANTS.SCENE_CACHE_VERSION.encode(FFMPEG_CONSTANTS.UTF8))
    digest.update(json.dumps(render_signature, sort_keys=True, ensure_ascii=True).encode(FFMPEG_CONSTANTS.UTF8))
    update_hash_from_file(digest, media_path)
    update_hash_from_file(digest, audio_path)
    return digest.hexdigest()
def get_native_image_filter(style_index, width, height, fps, total_frames, safe_profile, fade_filter):
    filters = [FFMPEG_CONSTANTS.IMAGE_SCALE_FILTER.format(width, height)]
    if not safe_profile and style_index != 12:
        zoom_step = max(0.0001, 0.08 / max(total_frames, 1))
        if style_index == 1:
            motion_filter = FFMPEG_CONSTANTS.ZOOM_OUT_FILTER.format(zoom_step, total_frames, width, height, fps)
        elif style_index == 2:
            motion_filter = FFMPEG_CONSTANTS.PAN_LEFT_FILTER.format(total_frames, width, height, fps)
        elif style_index == 3:
            motion_filter = FFMPEG_CONSTANTS.PAN_RIGHT_FILTER.format(total_frames, width, height, fps)
        elif style_index == 4:
            motion_filter = FFMPEG_CONSTANTS.PAN_UP_FILTER.format(total_frames, width, height, fps)
        elif style_index == 5:
            motion_filter = FFMPEG_CONSTANTS.PAN_DOWN_FILTER.format(total_frames, width, height, fps)
        else:
            motion_filter = FFMPEG_CONSTANTS.ZOOM_IN_FILTER.format(zoom_step, total_frames, width, height, fps)
        filters.append(motion_filter)
    else:
        filters.append(f'{_CODE_TEXT.FPS_4EF7DE}{fps}')
    filters.extend([fade_filter, _CODE_TEXT.FORMAT_YUV420P])
    return _CODE_TEXT.SYMBOL_D03502.join(filters)
def ease_hermite(t):
    return t * t * (3.0 - 2.0 * t)
def ease_cubic_in_out(t):
    if t < 0.5:
        return 4.0 * t * t * t
    return 1.0 - pow(-2.0 * t + 2.0, 3) / 2.0
def ease_quart_out(t):
    return 1.0 - pow(1.0 - t, 4)
def ease_sine_in_out(t):
    return -(math.cos(math.pi * t) - 1.0) / 2.0
def ease_expo_out(t):
    return 1.0 if t >= 1.0 else 1.0 - pow(2.0, -10.0 * t)
def ease_back_out(t):
    c1 = 1.70158
    c3 = c1 + 1.0
    return 1.0 + c3 * pow(t - 1.0, 3) + c1 * pow(t - 1.0, 2)
def ease_linear(t):
    return t
EASING_FUNCTIONS = [
    ease_sine_in_out,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_linear,
    ease_linear,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_linear,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_sine_in_out,
]
def apply_visual_effects(frame, effects_str, frame_index, total_frames):
    if not effects_str:
        return frame
    eff = str(effects_str).lower().strip()
    w, h = frame.size
    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_SAD_KEYS):
        frame = ImageEnhance.Color(frame).enhance(0.7)
        frame = ImageEnhance.Brightness(frame).enhance(0.85)
        try:
            vignette = Image.new(_CODE_TEXT.L, (w, h), 255)
            draw = ImageDraw.Draw(vignette)
            max_d = max(w, h)
            for r in range(int(max_d * 0.7), int(max_d * 0.45), -10):
                opacity = int((1.0 - (r - max_d * 0.45) / (max_d * 0.25)) * 120)
                opacity = max(0, min(opacity, 120))
                draw.ellipse([w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r], fill=255 - opacity)
            dark = Image.new(_CODE_TEXT.RGB, (w, h), FFMPEG_CONSTANTS.COLOR_BLACK_RGB)
            frame = Image.composite(dark, frame, vignette)
        except:
            pass
    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_VINTAGE_KEYS):
        sepia_matrix = (0.393, 0.769, 0.189, 0, 0.349, 0.686, 0.168, 0, 0.272, 0.534, 0.131, 0)
        frame = frame.convert(_CODE_TEXT.RGB, sepia_matrix)
        try:
            noise = Image.effect_noise((w, h), 8)
            noise = noise.convert(_CODE_TEXT.RGB)
            frame = Image.blend(frame, noise, 0.08)
        except:
            pass
    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_DREAMY_KEYS):
        try:
            blurred = frame.filter(ImageFilter.GaussianBlur(12))
            frame = Image.blend(frame, blurred, 0.28)
        except:
            pass
    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_GLITCH_KEYS):
        try:
            r, g, b = frame.split()
            r_shifted = Image.new(_CODE_TEXT.L, (w, h))
            r_shifted.paste(r, (-4, 0))
            b_shifted = Image.new(_CODE_TEXT.L, (w, h))
            b_shifted.paste(b, (4, 0))
            frame = Image.merge(_CODE_TEXT.RGB, (r_shifted, g, b_shifted))
        except:
            pass
        frame_rng = random.Random(frame_index * 7919 + total_frames)
        if frame_rng.random() < 0.12:
            try:
                band_h = int(h * 0.08)
                band_y = frame_rng.randint(0, h - band_h)
                shift_x = frame_rng.randint(-12, 12)
                band = frame.crop((0, band_y, w, band_y + band_h))
                frame.paste(band, (shift_x, band_y))
            except:
                pass
    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_WARM_KEYS):
        frame = ImageEnhance.Color(frame).enhance(1.25)
        warm_tint = Image.new(_CODE_TEXT.RGB, (w, h), FFMPEG_CONSTANTS.COLOR_WARM_TINT_RGB)
        frame = Image.blend(frame, warm_tint, 0.08)
    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_COLD_KEYS):
        frame = ImageEnhance.Color(frame).enhance(0.85)
        cold_tint = Image.new(_CODE_TEXT.RGB, (w, h), FFMPEG_CONSTANTS.COLOR_COLD_TINT_RGB)
        frame = Image.blend(frame, cold_tint, 0.12)
    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_NOIR_KEYS):
        frame = frame.convert(_CODE_TEXT.L).convert(_CODE_TEXT.RGB)
        frame = ImageEnhance.Contrast(frame).enhance(1.4)
    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_HORROR_KEYS):
        try:
            fog = Image.new(_CODE_TEXT.RGB, (w, h), FFMPEG_CONSTANTS.COLOR_FOG_RGB)
            frame = Image.blend(frame, fog, 0.15)
            frame = ImageEnhance.Color(frame).enhance(0.65)
            frame = ImageEnhance.Brightness(frame).enhance(0.75)
        except:
            pass
    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_VHS_KEYS):
        try:
            r, g, b = frame.split()
            r_shifted = Image.new(_CODE_TEXT.L, (w, h))
            r_shifted.paste(r, (-3, 1))
            b_shifted = Image.new(_CODE_TEXT.L, (w, h))
            b_shifted.paste(b, (3, -1))
            frame = Image.merge(_CODE_TEXT.RGB, (r_shifted, g, b_shifted))
            scanlines = Image.new(_CODE_TEXT.RGB, (w, h), FFMPEG_CONSTANTS.COLOR_WHITE_RGB)
            draw = ImageDraw.Draw(scanlines)
            for y in range(0, h, 4):
                draw.line([(0, y), (w, y)], fill=FFMPEG_CONSTANTS.COLOR_BLACK_RGB, width=1)
            frame = Image.blend(frame, scanlines, 0.08)
        except:
            pass
    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_NEON_KEYS):
        frame = ImageEnhance.Color(frame).enhance(1.4)
        frame = ImageEnhance.Contrast(frame).enhance(1.2)
    if _CODE_TEXT.FILM_GRAIN in eff:
        noise = Image.effect_noise((w, h), 5).convert(_CODE_TEXT.RGB)
        frame = Image.blend(frame, noise, 0.045)
    if _CODE_TEXT.SHARPEN in eff:
        frame = frame.filter(ImageFilter.UnsharpMask(radius=1.4, percent=115, threshold=4))
    if _CODE_TEXT.CHROMATIC_ABERRATION in eff:
        r, g, b = frame.split()
        shifted_r = Image.new(_CODE_TEXT.L, (w, h))
        shifted_r.paste(r, (-2, 0))
        shifted_b = Image.new(_CODE_TEXT.L, (w, h))
        shifted_b.paste(b, (2, 0))
        frame = Image.merge(_CODE_TEXT.RGB, (shifted_r, g, shifted_b))
    if _CODE_TEXT.PIXELATE in eff:
        small = frame.resize((max(1, w // 12), max(1, h // 12)), Image.Resampling.BILINEAR)
        frame = small.resize((w, h), Image.Resampling.NEAREST)
    if _CODE_TEXT.SOFT_FOCUS in eff:
        softened = frame.filter(ImageFilter.GaussianBlur(3.5))
        frame = Image.blend(frame, softened, 0.22)
    return frame
def apply_lighting_effect(frame, lighting_str, frame_index, total_frames):
    light = str(lighting_str or FFMPEG_CONSTANTS.DEFAULT_LIGHTING_EFFECT).lower().strip()
    if light in ("", _CODE_TEXT.NONE_140BED, _CODE_TEXT.NATURAL, FFMPEG_CONSTANTS.DEFAULT_LIGHTING_EFFECT):
        return frame
    w, h = frame.size
    progress = frame_index / max(total_frames - 1, 1)
    pulse = 0.5 - 0.5 * math.cos(progress * math.pi * 2.0)
    if light == _CODE_TEXT.FLICKER:
        return ImageEnhance.Brightness(frame).enhance(0.96 + 0.05 * math.sin(progress * math.pi * 6.0))
    if light == _CODE_TEXT.STROBE:
        return ImageEnhance.Brightness(frame).enhance(1.0 + 0.08 * max(0.0, math.sin(progress * math.pi * 4.0)))
    if light == _CODE_TEXT.EXPOSURE_PULSE:
        return ImageEnhance.Brightness(frame).enhance(1.0 + 0.10 * pulse)
    if light == _CODE_TEXT.GOLDEN_GLOW:
        warm = Image.new(_CODE_TEXT.RGB, (w, h), (255, 188, 92))
        return Image.blend(frame, warm, 0.08)
    overlay = Image.new(_CODE_TEXT.RGBA, (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, _CODE_TEXT.RGBA)
    if light == _CODE_TEXT.LIGHT_LEAK:
        draw.ellipse((-w * 0.35, -h * 0.25, w * 0.45, h * 1.1), fill=(255, 110, 45, int(24 + 16 * pulse)))
    elif light == _CODE_TEXT.LENS_FLARE:
        x = int(w * (0.2 + 0.6 * progress))
        y = int(h * 0.25)
        draw.ellipse((x - 70, y - 70, x + 70, y + 70), fill=(255, 230, 170, 34))
        draw.ellipse((x - 16, y - 16, x + 16, y + 16), fill=(255, 255, 235, 90))
    elif light == _CODE_TEXT.GOD_RAYS:
        for offset in range(-2, 3):
            x = int(w * (0.25 + offset * 0.09))
            draw.polygon([(x, 0), (x + 35, 0), (x + 220, h), (x - 60, h)], fill=(255, 245, 205, 14))
    elif light == _CODE_TEXT.SPOTLIGHT:
        draw.ellipse((w * 0.2, -h * 0.15, w * 0.8, h * 0.95), fill=(255, 245, 220, 25))
    elif light == _CODE_TEXT.BOKEH:
        rng = random.Random(1337)
        for _ in range(14):
            x, y = rng.randint(0, w), rng.randint(0, h)
            radius = rng.randint(8, 28)
            draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(255, 225, 160, 18))
    else:
        return frame
    return Image.alpha_composite(frame.convert(_CODE_TEXT.RGBA), overlay).convert(_CODE_TEXT.RGB)
def get_crop_coordinates(style, t_smooth, w_new, h_new, width, height):
    z = 1.0
    w_crop = width
    h_crop = height
    x0 = (w_new - w_crop) / 2.0
    y0 = (h_new - h_crop) / 2.0
    if style == 0:
        z = 1.0 + 0.06 * t_smooth
        w_crop = width / z
        h_crop = height / z
        x0 = (w_new - w_crop) / 2.0
        y0 = (h_new - h_crop) / 2.0
    elif style == 1:
        z = 1.06 - 0.06 * t_smooth
        w_crop = width / z
        h_crop = height / z
        x0 = (w_new - w_crop) / 2.0
        y0 = (h_new - h_crop) / 2.0
    elif style == 2:
        z = 1.06
        w_crop = width / z
        h_crop = height / z
        y0 = (h_new - h_crop) / 2.0
        x_max = w_new - w_crop
        pan_distance = min(x_max, width * 0.04)
        x0 = x_max * 0.5 - pan_distance * 0.5 + pan_distance * t_smooth
    elif style == 3:
        z = 1.06
        w_crop = width / z
        h_crop = height / z
        y0 = (h_new - h_crop) / 2.0
        x_max = w_new - w_crop
        pan_distance = min(x_max, width * 0.04)
        x0 = x_max * 0.5 + pan_distance * 0.5 - pan_distance * t_smooth
    elif style == 4:
        z = 1.06
        w_crop = width / z
        h_crop = height / z
        x0 = (w_new - w_crop) / 2.0
        y_max = h_new - h_crop
        pan_distance = min(y_max, height * 0.04)
        y0 = y_max * 0.5 - pan_distance * 0.5 + pan_distance * t_smooth
    elif style == 5:
        z = 1.06
        w_crop = width / z
        h_crop = height / z
        x0 = (w_new - w_crop) / 2.0
        y_max = h_new - h_crop
        pan_distance = min(y_max, height * 0.04)
        y0 = y_max * 0.5 + pan_distance * 0.5 - pan_distance * t_smooth
    elif style == 6:
        z = 1.06
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        x0 = x_max * t_smooth
        y0 = y_max * t_smooth
    elif style == 7:
        z = 1.06
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        x0 = x_max * t_smooth
        y0 = y_max * (1.0 - t_smooth)
    elif style == 8:
        z = 1.0 + 0.06 * t_smooth
        arc_phase = math.sin(t_smooth * math.pi)
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        x0 = x_max * (0.2 + 0.6 * t_smooth)
        y0 = y_max * (0.5 - 0.2 * arc_phase)
    elif style == 9:
        z = 1.035 + 0.015 * t_smooth
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        drift_x = 0.47 + 0.06 * t_smooth
        drift_y = 0.49 + 0.02 * t_smooth
        x0 = x_max * drift_x
        y0 = y_max * drift_y
    elif style == 10:
        z = 1.0 + 0.06 * t_smooth
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        x0 = x_max * (0.5 + 0.15 * t_smooth)
        y0 = y_max * (0.5 - 0.1 * t_smooth)
    elif style == 11:
        z = 1.06 - 0.06 * t_smooth
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        x0 = x_max * (0.5 - 0.2 * t_smooth)
        y0 = y_max * (0.3 + 0.4 * t_smooth)
    elif style in (13, 14):
        z = 1.06
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        travel_x = min(x_max, width * 0.035)
        travel_y = min(y_max, height * 0.035)
        x_direction = -1.0
        y_direction = -1.0 if style == 13 else 1.0
        x0 = x_max * 0.5 - x_direction * travel_x * 0.5 + x_direction * travel_x * t_smooth
        y0 = y_max * 0.5 - y_direction * travel_y * 0.5 + y_direction * travel_y * t_smooth
    elif style == 15:
        z = 1.06 - 0.045 * t_smooth
        w_crop = width / z
        h_crop = height / z
        x0 = (w_new - w_crop) * (0.55 - 0.05 * t_smooth)
        y0 = (h_new - h_crop) * (0.45 + 0.05 * t_smooth)
    elif style == 16:
        z = 1.045 + 0.012 * math.sin(t_smooth * math.pi)
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        x0 = x_max * (0.5 + 0.035 * math.sin(t_smooth * math.pi * 1.2))
        y0 = y_max * (0.5 + 0.035 * math.cos(t_smooth * math.pi))
    elif style == 17:
        z = 1.055
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        x0 = x_max * 0.5 + min(x_max, width * 0.012) * math.sin(t_smooth * math.pi * 2.0)
        y0 = y_max * 0.5 + min(y_max, height * 0.010) * math.sin(t_smooth * math.pi * 1.5)
    elif style in (18, 19):
        z = 1.055
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        travel = min(x_max, width * 0.03)
        direction = 1.0 if style == 18 else -1.0
        x0 = x_max * 0.5 - direction * travel * 0.5 + direction * travel * t_smooth
        y0 = y_max * (0.48 + 0.04 * t_smooth)
    x0 = max(0.0, min(x0, w_new - w_crop))
    y0 = max(0.0, min(y0, h_new - h_crop))
    x1 = x0 + w_crop
    y1 = y0 + h_crop
    return x0, y0, x1, y1
def write_ken_burns_frames_to_pipe(image_path, width, height, duration, fps, style_index, effects_str, lighting_str, proc, frame_count=None):
    try:
        img = Image.open(image_path)
    except Exception:
        img = Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), color=FFMPEG_CONSTANTS.BLACK_COLOR)
    img = img.convert(FFMPEG_CONSTANTS.RGB_MODE)
    w_orig, h_orig = img.size
    scale_factor = max(width / w_orig, height / h_orig)
    w_new = float(w_orig * scale_factor)
    h_new = float(h_orig * scale_factor)
    img_resized = img.resize((int(w_new), int(h_new)), Image.Resampling.BILINEAR)
    total_frames = frame_count if frame_count is not None else math.ceil(duration * fps)
    style = style_index % 20
    if style == 12:
        x0, y0, x1, y1 = get_crop_coordinates(style, 1.0, w_new, h_new, width, height)
        base_frame = img_resized.transform((width, height), Image.Transform.EXTENT, (x0, y0, x1, y1), resample=Image.Resampling.BILINEAR)
        try:
            for j in range(total_frames):
                final_frame = base_frame.copy()
                final_frame = apply_visual_effects(final_frame, effects_str, j, total_frames)
                final_frame = apply_lighting_effect(final_frame, lighting_str, j, total_frames)
                proc.stdin.write(final_frame.tobytes())
        except BrokenPipeError:
            pass
        return
    easing_fn = EASING_FUNCTIONS[style]
    try:
        for j in range(total_frames):
            t = j / max(total_frames - 1, 1)
            t_smooth = easing_fn(t)
            x0, y0, x1, y1 = get_crop_coordinates(style, t_smooth, w_new, h_new, width, height)
            final_frame = img_resized.transform((width, height), Image.Transform.EXTENT, (x0, y0, x1, y1), resample=Image.Resampling.BILINEAR)
            final_frame = apply_visual_effects(final_frame, effects_str, j, total_frames)
            final_frame = apply_lighting_effect(final_frame, lighting_str, j, total_frames)
            proc.stdin.write(final_frame.tobytes())
    except BrokenPipeError:
        pass
def generate_crossfade_frames(img_prev, img_next, width, height, fps, transition_dur, transition_type, proc):
    total_frames = max(int(transition_dur * fps), 2)
    img_a = img_prev.resize((width, height), Image.Resampling.BILINEAR).convert(FFMPEG_CONSTANTS.RGB_MODE)
    img_b = img_next.resize((width, height), Image.Resampling.BILINEAR).convert(FFMPEG_CONSTANTS.RGB_MODE)
    try:
        for j in range(total_frames):
            t = j / max(total_frames - 1, 1)
            t_smooth = ease_cubic_in_out(t)
            if transition_type == FFMPEG_CONSTANTS.TRANS_BLUR:
                blur_radius = t_smooth * 8.0
                if blur_radius > 0.5:
                    frame_a = img_a.filter(ImageFilter.GaussianBlur(radius=blur_radius))
                else:
                    frame_a = img_a
                frame = Image.blend(frame_a, img_b, t_smooth)
            elif transition_type == FFMPEG_CONSTANTS.TRANS_BRIGHT:
                if t_smooth < 0.5:
                    bright_factor = 1.0 + t_smooth * 0.5
                    enhancer = ImageEnhance.Brightness(img_a)
                    frame = enhancer.enhance(bright_factor)
                else:
                    bright_factor = 1.0 + (1.0 - t_smooth) * 0.5
                    enhancer = ImageEnhance.Brightness(img_b)
                    frame = enhancer.enhance(bright_factor)
            elif transition_type == FFMPEG_CONSTANTS.TRANS_ZOOM:
                if t_smooth < 0.5:
                    zoom = 1.0 + t_smooth * 0.32
                    crop_w = int(width / zoom)
                    crop_h = int(height / zoom)
                    left = (width - crop_w) // 2
                    top = (height - crop_h) // 2
                    frame = img_a.crop((left, top, left + crop_w, top + crop_h))
                    frame = frame.resize((width, height), Image.Resampling.BILINEAR)
                    alpha = (t_smooth - 0.3) * 5.0 if t_smooth > 0.3 else 0
                    alpha = min(alpha, 1.0)
                    white = Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), FFMPEG_CONSTANTS.COLOR_WHITE_RGB)
                    frame = Image.blend(frame, white, alpha)
                else:
                    zoom = 1.0 + (1.0 - t_smooth) * 0.32
                    crop_w = int(width / zoom)
                    crop_h = int(height / zoom)
                    left = (width - crop_w) // 2
                    top = (height - crop_h) // 2
                    frame = img_b.crop((left, top, left + crop_w, top + crop_h))
                    frame = frame.resize((width, height), Image.Resampling.BILINEAR)
                    alpha = (0.7 - t_smooth) * 5.0 if t_smooth < 0.7 else 0
                    alpha = max(min(alpha, 1.0), 0)
                    white = Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), FFMPEG_CONSTANTS.COLOR_WHITE_RGB)
                    frame = Image.blend(white, frame, 1.0 - alpha)
            elif transition_type == FFMPEG_CONSTANTS.TRANS_SLIDE:
                offset = int(width * t_smooth)
                frame = Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height))
                frame.paste(img_a, (-offset, 0))
                frame.paste(img_b, (width - offset, 0))
            elif transition_type == FFMPEG_CONSTANTS.TRANS_SLIDE_UP:
                offset = int(height * t_smooth)
                frame = Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height))
                frame.paste(img_a, (0, -offset))
                frame.paste(img_b, (0, height - offset))
            elif transition_type in (FFMPEG_CONSTANTS.TRANS_SLIDE_RIGHT, FFMPEG_CONSTANTS.TRANS_SLIDE_DOWN):
                frame = Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height))
                if transition_type == FFMPEG_CONSTANTS.TRANS_SLIDE_RIGHT:
                    offset = int(width * t_smooth)
                    frame.paste(img_a, (offset, 0))
                    frame.paste(img_b, (offset - width, 0))
                else:
                    offset = int(height * t_smooth)
                    frame.paste(img_a, (0, offset))
                    frame.paste(img_b, (0, offset - height))
            elif transition_type in (FFMPEG_CONSTANTS.TRANS_WIPE_LEFT, FFMPEG_CONSTANTS.TRANS_WIPE_RIGHT, FFMPEG_CONSTANTS.TRANS_WIPE_UP, FFMPEG_CONSTANTS.TRANS_WIPE_DOWN):
                frame = img_a.copy()
                if transition_type in (FFMPEG_CONSTANTS.TRANS_WIPE_LEFT, FFMPEG_CONSTANTS.TRANS_WIPE_RIGHT):
                    amount = int(width * t_smooth)
                    box = (width - amount, 0, width, height) if transition_type == FFMPEG_CONSTANTS.TRANS_WIPE_LEFT else (0, 0, amount, height)
                else:
                    amount = int(height * t_smooth)
                    box = (0, height - amount, width, height) if transition_type == FFMPEG_CONSTANTS.TRANS_WIPE_UP else (0, 0, width, amount)
                if box[2] > box[0] and box[3] > box[1]:
                    frame.paste(img_b.crop(box), box)
            elif transition_type == FFMPEG_CONSTANTS.TRANS_FLASH:
                base = img_a if t_smooth < 0.5 else img_b
                flash_amount = 1.0 - abs(t_smooth - 0.5) * 2.0
                frame = Image.blend(base, Image.new(_CODE_TEXT.RGB, (width, height), (255, 255, 255)), 0.45 * flash_amount)
            elif transition_type in (FFMPEG_CONSTANTS.TRANS_WHIP_LEFT, FFMPEG_CONSTANTS.TRANS_WHIP_RIGHT):
                direction = -1 if transition_type == FFMPEG_CONSTANTS.TRANS_WHIP_LEFT else 1
                offset = int(width * t_smooth)
                frame = Image.new(_CODE_TEXT.RGB, (width, height))
                frame.paste(img_a.filter(ImageFilter.GaussianBlur(3)), (direction * offset, 0))
                frame.paste(img_b.filter(ImageFilter.GaussianBlur(3)), (direction * offset - direction * width, 0))
            elif transition_type == FFMPEG_CONSTANTS.TRANS_GLITCH:
                frame = Image.blend(img_a, img_b, t_smooth)
                rng = random.Random(j + 991)
                for _ in range(3):
                    band_h = max(2, height // 30)
                    y = rng.randint(0, height - band_h)
                    band = frame.crop((0, y, width, y + band_h))
                    frame.paste(band, (rng.randint(-10, 10), y))
            elif transition_type == FFMPEG_CONSTANTS.TRANS_FILM_BURN:
                base = Image.blend(img_a, img_b, t_smooth)
                burn = Image.new(_CODE_TEXT.RGB, (width, height), (255, 92, 20))
                frame = Image.blend(base, burn, 0.22 * math.sin(t_smooth * math.pi))
            elif transition_type == FFMPEG_CONSTANTS.TRANS_FADE_BLACK:
                if t_smooth < 0.5:
                    alpha = t_smooth * 2.0
                    black = Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), FFMPEG_CONSTANTS.COLOR_BLACK_RGB)
                    frame = Image.blend(img_a, black, alpha)
                else:
                    alpha = (t_smooth - 0.5) * 2.0
                    black = Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), FFMPEG_CONSTANTS.COLOR_BLACK_RGB)
                    frame = Image.blend(black, img_b, alpha)
            elif transition_type == FFMPEG_CONSTANTS.TRANS_FADE_WHITE:
                if t_smooth < 0.5:
                    alpha = t_smooth * 2.0
                    white = Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), FFMPEG_CONSTANTS.COLOR_WHITE_RGB)
                    frame = Image.blend(img_a, white, alpha)
                else:
                    alpha = (t_smooth - 0.5) * 2.0
                    white = Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), FFMPEG_CONSTANTS.COLOR_WHITE_RGB)
                    frame = Image.blend(white, img_b, alpha)
            else:
                frame = Image.blend(img_a, img_b, t_smooth)
            proc.stdin.write(frame.tobytes())
    except BrokenPipeError:
        pass
def map_motion_to_style(camera_motion, scene_index, prev_style, num_styles=12):
    if not camera_motion:
        motion = FFMPEG_CONSTANTS.DEFAULT
    else:
        motion = str(camera_motion).strip().lower()
    normalized_motion = motion.replace(_CODE_TEXT.SYMBOL_3973E0, _CODE_TEXT.SYMBOL_D2E2AD).replace(_CODE_TEXT.SYMBOL_36A9E7, _CODE_TEXT.SYMBOL_D2E2AD)
    if normalized_motion in FFMPEG_CONSTANTS.MOTION_STYLE_BY_ID:
        return FFMPEG_CONSTANTS.MOTION_STYLE_BY_ID[normalized_motion]
    if _CODE_TEXT.ZOOM_IN_C852FE in motion or _CODE_TEXT.PH_NG_TO in motion:
        return 0
    elif _CODE_TEXT.ZOOM_OUT_FCBF91 in motion or _CODE_TEXT.THU_NH in motion:
        return 1
    elif _CODE_TEXT.PAN_LEFT_DDA81C in motion or _CODE_TEXT.G_C_TR_I in motion:
        return 2
    elif _CODE_TEXT.PAN_RIGHT_87A111 in motion or _CODE_TEXT.G_C_PH_I in motion:
        return 3
    elif _CODE_TEXT.PAN_UP_55A047 in motion or _CODE_TEXT.G_C_TR_N in motion:
        return 4
    elif _CODE_TEXT.PAN_DOWN_288EAF in motion or _CODE_TEXT.G_C_D_I in motion:
        return 5
    elif _CODE_TEXT.DRIFT in motion or _CODE_TEXT.TR_I_NH in motion:
        return 9
    elif _CODE_TEXT.ARC in motion or _CODE_TEXT.H_NH_CUNG in motion:
        return 8
    elif _CODE_TEXT.PUSH_D107EA in motion or _CODE_TEXT.Y_V_O in motion:
        return 10
    elif _CODE_TEXT.REVEAL in motion or _CODE_TEXT.H_L in motion:
        return 11
    elif _CODE_TEXT.STATIC in motion or _CODE_TEXT.T_NH in motion:
        return 12
    return 12
def get_transition_type(scene_index, scene_transition=None, prev_transition_type=None):
    if scene_transition:
        transition_lower = scene_transition.lower().strip()
        if transition_lower in FFMPEG_CONSTANTS.TRANSITION_IDS:
            return transition_lower
        if _CODE_TEXT.NONE_140BED in transition_lower or _CODE_TEXT.CUT in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_CUT
        elif _CODE_TEXT.FADE_009978 in transition_lower and _CODE_TEXT.WHITE in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_FADE_WHITE
        elif _CODE_TEXT.FADE_009978 in transition_lower and _CODE_TEXT.BLACK in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_FADE_BLACK
        elif _CODE_TEXT.DISSOLVE in transition_lower or _CODE_TEXT.CROSS in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_CROSS
        elif _CODE_TEXT.BLUR_E42932 in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_BLUR
        elif _CODE_TEXT.BRIGHT in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_BRIGHT
        elif _CODE_TEXT.WHITE in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_FADE_WHITE
        elif _CODE_TEXT.ZOOM_D21BB5 in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_ZOOM
        elif _CODE_TEXT.SLIDE in transition_lower or _CODE_TEXT.WIPE in transition_lower:
            if _CODE_TEXT.UP in transition_lower:
                return FFMPEG_CONSTANTS.TRANS_SLIDE_UP
            return FFMPEG_CONSTANTS.TRANS_SLIDE
    return FFMPEG_CONSTANTS.TRANS_CROSS
def get_last_frame_from_scene(image_path, width, height, duration, fps, style_index, effects_str, lighting_str):
    try:
        img = Image.open(image_path)
    except Exception:
        return Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), color=FFMPEG_CONSTANTS.BLACK_COLOR)
    img = img.convert(FFMPEG_CONSTANTS.RGB_MODE)
    w_orig, h_orig = img.size
    scale_factor = max(width / w_orig, height / h_orig)
    w_new = float(w_orig * scale_factor)
    h_new = float(h_orig * scale_factor)
    img_resized = img.resize((int(w_new), int(h_new)), Image.Resampling.BILINEAR)
    style = style_index % 13
    easing_fn = EASING_FUNCTIONS[style]
    t_smooth = easing_fn(1.0)
    x0, y0, x1, y1 = get_crop_coordinates(style, t_smooth, w_new, h_new, width, height)
    final = img_resized.transform((width, height), Image.Transform.EXTENT, (x0, y0, x1, y1), resample=Image.Resampling.BILINEAR)
    total_frames = int(duration * fps)
    final = apply_visual_effects(final, effects_str, total_frames - 1, total_frames)
    final = apply_lighting_effect(final, lighting_str, total_frames - 1, total_frames)
    return final
def get_first_frame_from_scene(image_path, width, height, style_index, effects_str, lighting_str):
    try:
        img = Image.open(image_path)
    except Exception:
        return Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), color=FFMPEG_CONSTANTS.BLACK_COLOR)
    img = img.convert(FFMPEG_CONSTANTS.RGB_MODE)
    w_orig, h_orig = img.size
    scale_factor = max(width / w_orig, height / h_orig)
    w_new = float(w_orig * scale_factor)
    h_new = float(h_orig * scale_factor)
    img_resized = img.resize((int(w_new), int(h_new)), Image.Resampling.BILINEAR)
    style = style_index % 13
    easing_fn = EASING_FUNCTIONS[style]
    t_smooth = easing_fn(0.0)
    x0, y0, x1, y1 = get_crop_coordinates(style, t_smooth, w_new, h_new, width, height)
    final = img_resized.transform((width, height), Image.Transform.EXTENT, (x0, y0, x1, y1), resample=Image.Resampling.BILINEAR)
    final = apply_visual_effects(final, effects_str, 0, 100)
    final = apply_lighting_effect(final, lighting_str, 0, 100)
    return final
def main():
    try:
        if len(sys.argv) < 2:
            raise Exception(_CODE_TEXT.MISSING_CONFIG_JSON_FILE_PATH)
        config_path = sys.argv[1]
        with open(config_path, _CODE_TEXT.R, encoding=FFMPEG_CONSTANTS.UTF8) as f:
            config = json.load(f)
        tempDir = config.get(_CODE_TEXT.TEMPDIR)
        ffmpegCmd = config.get(_CODE_TEXT.FFMPEGCMD, _CODE_TEXT.FFMPEG)
        width = config.get(_CODE_TEXT.WIDTH, FFMPEG_CONSTANTS.DEFAULT_OUTPUT_WIDTH)
        height = config.get(_CODE_TEXT.HEIGHT, FFMPEG_CONSTANTS.DEFAULT_OUTPUT_HEIGHT)
        fps = config.get(_CODE_TEXT.FPS, FFMPEG_CONSTANTS.DEFAULT_OUTPUT_FPS)
        bitrate = config.get(_CODE_TEXT.BITRATE, FFMPEG_CONSTANTS.DEFAULT_OUTPUT_BITRATE)
        finalOutputPath = config.get(_CODE_TEXT.FINALOUTPUTPATH)
        finalOutputUrl = config.get(_CODE_TEXT.FINALOUTPUTURL)
        scenes = config.get(_CODE_TEXT.SCENES, [])
        safe_profile = bool(config.get(FFMPEG_CONSTANTS.KEY_SAFE_PROFILE, False))
        scene_cache_dir = config.get(FFMPEG_CONSTANTS.KEY_SCENE_CACHE_DIR)
        if scene_cache_dir:
            os.makedirs(scene_cache_dir, exist_ok=True)
        video_trim_start = config.get(
            FFMPEG_CONSTANTS.KEY_VIDEO_TRIM_START_SECONDS,
            FFMPEG_CONSTANTS.DEFAULT_TRIM_SECONDS,
        )
        video_trim_end = config.get(
            FFMPEG_CONSTANTS.KEY_VIDEO_TRIM_END_SECONDS,
            FFMPEG_CONSTANTS.DEFAULT_TRIM_SECONDS,
        )
        if not os.path.exists(tempDir):
            os.makedirs(tempDir, exist_ok=True)
        videoParts = []
        def clean_base64(b64_str):
            if b64_str and _CODE_TEXT.BASE64 in b64_str:
                return b64_str.split(_CODE_TEXT.BASE64)[1]
            return b64_str
        scene_media_paths = []
        scene_is_video = []
        scene_audio_paths = []
        scene_durations = []
        scene_transitions = []
        scene_media_owned = []
        scene_audio_owned = []
        preserve_video_audio = bool(config.get(_CODE_TEXT.PRESERVEVIDEOAUDIO))
        for i, scene in enumerate(scenes):
            idx = str(i).zfill(FFMPEG_CONSTANTS.INDEX_PADDING)
            is_video = scene.get(FFMPEG_CONSTANTS.KEY_ASSET_TYPE) == FFMPEG_CONSTANTS.ASSET_VIDEO
            media_extension = FFMPEG_CONSTANTS.VIDEO_EXTENSION if is_video else FFMPEG_CONSTANTS.IMAGE_EXTENSION
            temp_media_path = os.path.join(
                tempDir,
                FFMPEG_CONSTANTS.TEMP_MEDIA_TEMPLATE.format(idx, media_extension),
            )
            temp_audio_path = os.path.join(
                tempDir,
                FFMPEG_CONSTANTS.TEMP_AUDIO_TEMPLATE.format(idx),
            )
            img_b64 = scene.get(FFMPEG_CONSTANTS.KEY_IMAGE_BASE64)
            audio_b64 = scene.get(FFMPEG_CONSTANTS.KEY_AUDIO_BASE64)
            source_media_path = scene.get(FFMPEG_CONSTANTS.KEY_MEDIA_PATH)
            source_audio_path = scene.get(FFMPEG_CONSTANTS.KEY_AUDIO_PATH)
            duration = scene.get(FFMPEG_CONSTANTS.KEY_DURATION, FFMPEG_CONSTANTS.DEFAULT_SCENE_DURATION)
            scene_trim_start = max(0.0, float(scene.get(_CODE_TEXT.SOURCETRIMSTARTSECONDS, 0) or 0))
            scene_trim_end = max(0.0, float(scene.get(_CODE_TEXT.SOURCETRIMENDSECONDS, 0) or 0))
            scene_source_crop = str(scene.get(_CODE_TEXT.SOURCECROP) or "").strip()
            transition = scene.get(FFMPEG_CONSTANTS.KEY_TRANSITION, FFMPEG_CONSTANTS.EMPTY_STRING)
            if scene.get(FFMPEG_CONSTANTS.KEY_LIGHTING_EFFECT) in FFMPEG_CONSTANTS.DISRUPTIVE_LIGHTING_EFFECTS:
                scene[FFMPEG_CONSTANTS.KEY_LIGHTING_EFFECT] = FFMPEG_CONSTANTS.DEFAULT_LIGHTING_EFFECT
            if float(duration or FFMPEG_CONSTANTS.DEFAULT_SCENE_DURATION) < FFMPEG_CONSTANTS.SHORT_SCENE_DURATION:
                if scene.get(FFMPEG_CONSTANTS.KEY_LIGHTING_EFFECT) in FFMPEG_CONSTANTS.SHORT_SCENE_LIGHTING_EFFECTS:
                    scene[FFMPEG_CONSTANTS.KEY_LIGHTING_EFFECT] = FFMPEG_CONSTANTS.DEFAULT_LIGHTING_EFFECT
                if scene.get(FFMPEG_CONSTANTS.KEY_EFFECTS) in FFMPEG_CONSTANTS.SHORT_SCENE_VISUAL_EFFECTS:
                    scene[FFMPEG_CONSTANTS.KEY_EFFECTS] = FFMPEG_CONSTANTS.SHORT_SCENE_VISUAL_FALLBACK
            media_owned = False
            if source_media_path and os.path.exists(source_media_path):
                mediaPath = source_media_path
            elif img_b64:
                mediaPath = temp_media_path
                img_data = clean_base64(img_b64)
                with open(mediaPath, FFMPEG_CONSTANTS.BINARY_WRITE_MODE) as f:
                    f.write(base64.b64decode(img_data))
                media_owned = True
            else:
                scene_id = scene.get(_CODE_TEXT.ID) or idx
                raise Exception(f'{_CODE_TEXT.SCENE}{scene_id}{_CODE_TEXT.HAS_NO_REAL_VISUAL_ASSET}')
            if preserve_video_audio and is_video:
                native_video_duration = get_media_duration(ffmpegCmd, mediaPath)
                if native_video_duration > FFMPEG_CONSTANTS.ZERO_SECONDS:
                    duration = max(FFMPEG_CONSTANTS.MIN_USABLE_VIDEO_SECONDS, native_video_duration - scene_trim_start - scene_trim_end)
            if not is_video:
                scene_id = scene.get(_CODE_TEXT.ID) or idx
                try:
                    with Image.open(mediaPath) as image_file:
                        image_file.verify()
                except Exception as error:
                    raise Exception(f'{_CODE_TEXT.SCENE}{scene_id}{_CODE_TEXT.HAS_AN_INVALID_IMAGE_ASSET}{error}')
            hasAudio = False
            audio_owned = False
            audioPath = None
            if source_audio_path and os.path.exists(source_audio_path):
                audioPath = source_audio_path
                hasAudio = True
            elif audio_b64:
                audioPath = temp_audio_path
                audio_data = clean_base64(audio_b64)
                with open(audioPath, FFMPEG_CONSTANTS.BINARY_WRITE_MODE) as f:
                    f.write(base64.b64decode(audio_data))
                hasAudio = True
                audio_owned = True
            if hasAudio:
                audio_duration = get_media_duration(ffmpegCmd, audioPath)
                if audio_duration > FFMPEG_CONSTANTS.ZERO_SECONDS:
                    duration = audio_duration
            scene_media_paths.append(mediaPath)
            scene_is_video.append(is_video)
            scene_audio_paths.append(audioPath if hasAudio else None)
            scene_durations.append(duration)
            scene_transitions.append(transition)
            scene_media_owned.append(media_owned)
            scene_audio_owned.append(audio_owned)
        globalAudioPath = config.get(_CODE_TEXT.GLOBALAUDIOPATH)
        if globalAudioPath and os.path.exists(globalAudioPath):
            global_audio_duration = get_media_duration(ffmpegCmd, globalAudioPath)
            declared_scene_duration = sum(float(value or 0) for value in scene_durations)
            if global_audio_duration > FFMPEG_CONSTANTS.ZERO_SECONDS and declared_scene_duration > FFMPEG_CONSTANTS.ZERO_SECONDS:
                duration_scale = global_audio_duration / declared_scene_duration
                scaled_durations = []
                scaled_cursor = 0.0
                for scene_index, original_duration in enumerate(scene_durations):
                    is_last_scene = scene_index == len(scene_durations) - 1
                    scaled_duration = max(0.0, global_audio_duration - scaled_cursor) if is_last_scene else max(0.05, float(original_duration) * duration_scale)
                    scaled_durations.append(scaled_duration)
                    scaled_cursor += scaled_duration
                    scenes[scene_index][FFMPEG_CONSTANTS.KEY_DURATION] = scaled_duration
                    for cue in scenes[scene_index].get(FFMPEG_CONSTANTS.KEY_SUBTITLE_CUES, []):
                        cue[_CODE_TEXT.STARTOFFSETSECONDS] = float(cue.get(_CODE_TEXT.STARTOFFSETSECONDS, 0)) * duration_scale
                        cue[_CODE_TEXT.DURATIONSECONDS] = float(cue.get(_CODE_TEXT.DURATIONSECONDS, 0)) * duration_scale
                scene_durations = scaled_durations
        chosen_styles = []
        chosen_transitions = []
        prev_style = -1
        prev_trans = None
        same_motion_run = 0
        same_transition_run = 0
        last_intense_effect_index = -FFMPEG_CONSTANTS.COMFORT_EFFECT_COOLDOWN_SCENES
        last_disruptive_transition_index = -FFMPEG_CONSTANTS.COMFORT_EFFECT_COOLDOWN_SCENES
        for i, scene in enumerate(scenes):
            camera_motion = scene.get(FFMPEG_CONSTANTS.KEY_CAMERA_MOTION, FFMPEG_CONSTANTS.EMPTY_STRING)
            style_idx = 12 if safe_profile or scene_durations[i] < FFMPEG_CONSTANTS.SHORT_SCENE_DURATION else map_motion_to_style(camera_motion, i, prev_style, num_styles=20)
            if style_idx == 9:
                style_idx = 12
            same_motion_run = same_motion_run + 1 if style_idx == prev_style else 1
            if style_idx != 12 and same_motion_run > 2:
                style_idx = 12
                same_motion_run = 1
            chosen_styles.append(style_idx)
            if style_idx != 12:
                prev_style = style_idx
            requested_effect = str(scene.get(FFMPEG_CONSTANTS.KEY_EFFECTS) or "").lower().strip()
            if requested_effect in FFMPEG_CONSTANTS.DISRUPTIVE_VISUAL_EFFECTS:
                intense_allowed = scene_durations[i] >= FFMPEG_CONSTANTS.COMFORT_MIN_INTENSE_DURATION and i - last_intense_effect_index >= FFMPEG_CONSTANTS.COMFORT_EFFECT_COOLDOWN_SCENES
                if intense_allowed:
                    last_intense_effect_index = i
                else:
                    scene[FFMPEG_CONSTANTS.KEY_EFFECTS] = FFMPEG_CONSTANTS.EMPTY_STRING
            transition_meta = scene_transitions[i]
            trans_type = FFMPEG_CONSTANTS.TRANS_CUT if safe_profile else get_transition_type(i, transition_meta, prev_trans)
            if scene_durations[i] < FFMPEG_CONSTANTS.SHORT_SCENE_DURATION and trans_type in (FFMPEG_CONSTANTS.TRANS_FLASH, FFMPEG_CONSTANTS.TRANS_WHIP_LEFT, FFMPEG_CONSTANTS.TRANS_WHIP_RIGHT, FFMPEG_CONSTANTS.TRANS_GLITCH):
                trans_type = FFMPEG_CONSTANTS.TRANS_CUT
            if scene_is_video[i] or (i + 1 < len(scenes) and scene_is_video[i + 1]):
                trans_type = FFMPEG_CONSTANTS.TRANS_CUT
            if trans_type in FFMPEG_CONSTANTS.DISRUPTIVE_TRANSITIONS:
                disruptive_allowed = scene_durations[i] >= FFMPEG_CONSTANTS.COMFORT_MIN_INTENSE_DURATION and i - last_disruptive_transition_index >= FFMPEG_CONSTANTS.COMFORT_EFFECT_COOLDOWN_SCENES
                if disruptive_allowed:
                    last_disruptive_transition_index = i
                else:
                    trans_type = FFMPEG_CONSTANTS.TRANS_CUT
            same_transition_run = same_transition_run + 1 if trans_type == prev_trans else 1
            if trans_type != FFMPEG_CONSTANTS.TRANS_CUT and same_transition_run > 2:
                trans_type = FFMPEG_CONSTANTS.TRANS_CUT
                same_transition_run = 1
            chosen_transitions.append(trans_type)
            prev_trans = trans_type
        completed_scene_count = 0
        progress_lock = threading.Lock()
        def emit_progress(progress):
            print(json.dumps({_CODE_TEXT.PROGRESS: progress}), flush=True)
        def render_scene(i):
            nonlocal completed_scene_count
            idx = str(i).zfill(FFMPEG_CONSTANTS.INDEX_PADDING)
            scene_id = scenes[i].get(_CODE_TEXT.ID) or idx
            diagnostic_path = os.path.join(tempDir, f'{_CODE_TEXT.SCENE_2CBE6C}{idx}{_CODE_TEXT.FFMPEG_LOG}')
            outPath = os.path.join(tempDir, FFMPEG_CONSTANTS.PART_FILE_TEMPLATE.format(idx))
            mediaPath = scene_media_paths[i]
            audioPath = scene_audio_paths[i]
            duration = scene_durations[i]
            is_video = scene_is_video[i]
            scene_trim_start = max(0.0, float(scenes[i].get(_CODE_TEXT.SOURCETRIMSTARTSECONDS, video_trim_start) or 0))
            scene_trim_end = max(0.0, float(scenes[i].get(_CODE_TEXT.SOURCETRIMENDSECONDS, video_trim_end) or 0))
            scene_source_crop = str(scenes[i].get(_CODE_TEXT.SOURCECROP) or "").strip()
            use_embedded_audio = preserve_video_audio and is_video and media_has_audio_stream(ffmpegCmd, mediaPath)
            audio_bridge_mode = str(scenes[i].get(FFMPEG_CONSTANTS.KEY_CINEMATIC_AUDIO_BRIDGE_MODE) or FFMPEG_CONSTANTS.EMPTY_STRING)
            contains_dialogue = bool(scenes[i].get(FFMPEG_CONSTANTS.KEY_CINEMATIC_DIALOGUE_DETECTED))
            fade_dur = min(0.5, duration / 3.0)
            fade_dur = max(fade_dur, 0.15)
            transition_dur = min(0.65, duration / 4.0) if i < len(scenes) - 1 else 0
            total_frames = math.ceil(duration * fps)
            actual_duration = total_frames / fps
            if is_video:
                cmd = [ffmpegCmd, _CODE_TEXT.Y_6287C6, _CODE_TEXT.I, mediaPath]
            else:
                cmd = [ffmpegCmd, _CODE_TEXT.Y_6287C6, _CODE_TEXT.LOOP, _CODE_TEXT.VALUE_1, _CODE_TEXT.I, mediaPath]
            if use_embedded_audio:
                embedded_audio_filters = [
                    f'{_CODE_TEXT.ATRIM_START}{scene_trim_start}{_CODE_TEXT.DURATION_4FF0D6}{duration}',
                    _CODE_TEXT.ASETPTS_PTS_STARTPTS,
                    _CODE_TEXT.ARESAMPLE_48000_ASYNC_1_FIRST_PTS_0,
                ]
                if audio_bridge_mode == FFMPEG_CONSTANTS.AUDIO_BRIDGE_AMBIENCE and not contains_dialogue:
                    smooth_duration = min(FFMPEG_CONSTANTS.AUDIO_EDGE_SMOOTH_SECONDS, duration / 4.0)
                    embedded_audio_filters.extend(
                        [
                            f'{_CODE_TEXT.AFADE_T_IN_ST_0_D}{smooth_duration}',
                            f'{_CODE_TEXT.AFADE_T_OUT_ST}{max(0, duration - smooth_duration)}{_CODE_TEXT.D_162E22}{smooth_duration}',
                        ]
                    )
                af_effect = _CODE_TEXT.SYMBOL_D03502.join(embedded_audio_filters)
            elif audioPath:
                cmd.extend([_CODE_TEXT.I, audioPath])
                audio_filters = []
                if i == 0:
                    audio_filters.append(f'{_CODE_TEXT.AFADE_T_IN_ST_0_D}{fade_dur}')
                if i == len(scenes) - 1:
                    audio_filters.append(f'{_CODE_TEXT.AFADE_T_OUT_ST}{max(0, duration - fade_dur)}{_CODE_TEXT.D_162E22}{fade_dur}')
                af_effect = _CODE_TEXT.SYMBOL_D03502.join(audio_filters) if audio_filters else _CODE_TEXT.ANULL
            else:
                cmd.extend([_CODE_TEXT.F, _CODE_TEXT.LAVFI, _CODE_TEXT.I, FFMPEG_CONSTANTS.ANULLSRC])
                af_effect = _CODE_TEXT.ANULL
            if i == 0:
                vf_effect = FFMPEG_CONSTANTS.FADE_IN_BLACK.format(fade_dur)
            elif i == len(scenes) - 1:
                vf_effect = FFMPEG_CONSTANTS.FADE_OUT_BLACK.format(max(0, duration - fade_dur), fade_dur)
            else:
                vf_effect = FFMPEG_CONSTANTS.NULL_EFFECT
            video_filter = vf_effect
            if is_video:
                video_filter_parts = [
                    get_video_trim_filter(
                        ffmpegCmd,
                        mediaPath,
                        scene_trim_start,
                        scene_trim_end,
                        actual_duration,
                    )
                ]
                if scene_source_crop:
                    video_filter_parts.append(f'{_CODE_TEXT.CROP}{scene_source_crop}')
                video_filter_parts.extend(
                    [
                        FFMPEG_CONSTANTS.VIDEO_SCALE_FILTER.format(width, height, fps),
                        vf_effect,
                    ]
                )
                video_filter = _CODE_TEXT.SYMBOL_D03502.join(video_filter_parts)
            else:
                video_filter = get_native_image_filter(
                    chosen_styles[i],
                    width,
                    height,
                    fps,
                    total_frames,
                    safe_profile,
                    vf_effect,
                )
            cache_path = None
            if scene_cache_dir:
                cache_key = create_scene_cache_key(
                    mediaPath,
                    audioPath,
                    {
                        _CODE_TEXT.SCENEID: scene_id,
                        _CODE_TEXT.DURATION: actual_duration,
                        _CODE_TEXT.ISVIDEO: is_video,
                        _CODE_TEXT.WIDTH: width,
                        _CODE_TEXT.HEIGHT: height,
                        _CODE_TEXT.FPS: fps,
                        _CODE_TEXT.BITRATE: bitrate,
                        _CODE_TEXT.VIDEOFILTER: video_filter,
                        _CODE_TEXT.AUDIOFILTER: af_effect,
                        _CODE_TEXT.HASAUDIO: bool(audioPath) or use_embedded_audio,
                        _CODE_TEXT.SAFEPROFILE: safe_profile,
                    },
                )
                cache_path = os.path.join(scene_cache_dir, f'{scene_id}{_CODE_TEXT.SYMBOL_D2E2AD}{cache_key}{_CODE_TEXT.MP4}')
                if os.path.exists(cache_path) and os.path.getsize(cache_path) > FFMPEG_CONSTANTS.SCENE_CACHE_MIN_BYTES:
                    shutil.copy2(cache_path, outPath)
                    with progress_lock:
                        completed_scene_count += 1
                        emit_progress(max(1, round(completed_scene_count * 90 / len(scenes))))
                    return FFMPEG_CONSTANTS.CONCAT_PREFIX.format(idx)
            audio_input_index = _CODE_TEXT.VALUE_0_A_0 if use_embedded_audio else _CODE_TEXT.VALUE_1_A_0
            cmd.extend(
                [
                    _CODE_TEXT.MAP,
                    _CODE_TEXT.VALUE_0_V_0,
                    _CODE_TEXT.MAP,
                    audio_input_index,
                    _CODE_TEXT.C_V,
                    FFMPEG_CONSTANTS.LIBX264,
                    _CODE_TEXT.B_V,
                    bitrate,
                    _CODE_TEXT.PRESET,
                    FFMPEG_CONSTANTS.SLOW,
                    _CODE_TEXT.PROFILE_V,
                    FFMPEG_CONSTANTS.HIGH,
                    _CODE_TEXT.LEVEL,
                    _CODE_TEXT.VALUE_4_1,
                    _CODE_TEXT.PIX_FMT,
                    FFMPEG_CONSTANTS.YUV420P,
                    _CODE_TEXT.C_A,
                    FFMPEG_CONSTANTS.AAC,
                    _CODE_TEXT.B_A,
                    _CODE_TEXT.VALUE_128K,
                    _CODE_TEXT.VF,
                    video_filter,
                    _CODE_TEXT.AF,
                    af_effect,
                    _CODE_TEXT.T,
                    str(actual_duration),
                    outPath,
                ]
            )
            stderr_text = ""
            try:
                completed = subprocess.run(
                    cmd,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=SCENE_RENDER_TIMEOUT_SECONDS,
                )
                return_code = completed.returncode
                stderr_text = (completed.stderr or "")[-MAX_DIAGNOSTIC_BYTES:]
            except subprocess.TimeoutExpired as error:
                stderr_text = str(error)
                return_code = -1
            with open(diagnostic_path, _CODE_TEXT.W, encoding=FFMPEG_CONSTANTS.UTF8) as diagnostic_file:
                diagnostic_file.write(stderr_text[-MAX_DIAGNOSTIC_BYTES:])
            if return_code != 0:
                diagnostic = _CODE_TEXT.SYMBOL_36A9E7.join(stderr_text.strip().splitlines()[-6:])
                raise Exception(FFMPEG_CONSTANTS.PART_ERROR_TEMPLATE.format(scene_id, return_code, diagnostic))
            if cache_path:
                temporary_cache_path = f'{cache_path}{_CODE_TEXT.SYMBOL_CDB4EE}{threading.get_ident()}{_CODE_TEXT.TMP}'
                try:
                    shutil.copy2(outPath, temporary_cache_path)
                    os.replace(temporary_cache_path, cache_path)
                    for cached_name in os.listdir(scene_cache_dir):
                        if cached_name.startswith(f'{scene_id}{_CODE_TEXT.SYMBOL_D2E2AD}') and cached_name != os.path.basename(cache_path):
                            try:
                                os.remove(os.path.join(scene_cache_dir, cached_name))
                            except OSError:
                                pass
                except OSError:
                    try:
                        if os.path.exists(temporary_cache_path):
                            os.remove(temporary_cache_path)
                    except OSError:
                        pass
            with progress_lock:
                completed_scene_count += 1
                emit_progress(max(1, round(completed_scene_count * 90 / len(scenes))))
            return FFMPEG_CONSTANTS.CONCAT_PREFIX.format(idx)
        max_workers = max(
            FFMPEG_CONSTANTS.DEFAULT_MAX_WORKERS,
            min(
                int(config.get(FFMPEG_CONSTANTS.KEY_MAX_SCENE_WORKERS, FFMPEG_CONSTANTS.DEFAULT_MAX_WORKERS)),
                len(scenes),
            ),
        )
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            videoParts = list(executor.map(render_scene, range(len(scenes))))
        for i, mediaPath in enumerate(scene_media_paths):
            if scene_media_owned[i]:
                try:
                    os.remove(mediaPath)
                except:
                    pass
            audioPath = scene_audio_paths[i]
            if audioPath and scene_audio_owned[i]:
                try:
                    os.remove(audioPath)
                except:
                    pass
        listPath = os.path.join(tempDir, _CODE_TEXT.LIST_TXT)
        with open(listPath, _CODE_TEXT.W, encoding=FFMPEG_CONSTANTS.UTF8) as f:
            f.write(_CODE_TEXT.SYMBOL_01BA47.join(videoParts))
        assetsDir = os.path.dirname(finalOutputPath)
        if not os.path.exists(assetsDir):
            os.makedirs(assetsDir, exist_ok=True)
        tempFinalPath = os.path.join(tempDir, _CODE_TEXT.TEMP_FINAL_MP4)
        concatCmd = [ffmpegCmd, _CODE_TEXT.Y_6287C6, _CODE_TEXT.F, FFMPEG_CONSTANTS.CONCAT_FORMAT, _CODE_TEXT.SAFE, _CODE_TEXT.VALUE_0, _CODE_TEXT.I, listPath, _CODE_TEXT.C, FFMPEG_CONSTANTS.COPY_CODEC, tempFinalPath]
        subprocess.run(concatCmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        emit_progress(94)
        subtitle_mode = config.get(FFMPEG_CONSTANTS.KEY_SUBTITLE_MODE, FFMPEG_CONSTANTS.SUBTITLE_MODE_BURN_IN)
        subtitle_path = create_subtitle_file(tempDir, scenes, scene_durations)
        audio_tracks = config.get(FFMPEG_CONSTANTS.KEY_AUDIO_TRACKS, [])
        embedded_audio_present = preserve_video_audio and any(scene_is_video[index] and media_has_audio_stream(ffmpegCmd, scene_media_paths[index]) for index in range(len(scene_media_paths)))
        scene_audio_present = any(scene_audio_paths) or embedded_audio_present
        expected_output_duration = sum(scene_durations)
        auto_music_profile = config.get(_CODE_TEXT.AUTOMUSICPROFILE)
        has_music_track = any(track.get(_CODE_TEXT.TYPE) == _CODE_TEXT.MUSIC for track in audio_tracks)
        if auto_music_profile and not has_music_track:
            automatic_music_path = create_automatic_music_bed(
                ffmpegCmd,
                tempDir,
                expected_output_duration,
                auto_music_profile,
            )
            if automatic_music_path:
                automatic_fade_seconds = min(2.0, expected_output_duration / 4.0)
                audio_tracks.append(
                    {
                        _CODE_TEXT.ID: _CODE_TEXT.AUTOMATIC_MUSIC_BED,
                        _CODE_TEXT.TYPE: _CODE_TEXT.MUSIC,
                        _CODE_TEXT.ASSETPATH: automatic_music_path,
                        _CODE_TEXT.STARTSECONDS: 0,
                        _CODE_TEXT.DURATIONSECONDS: expected_output_duration,
                        _CODE_TEXT.VOLUMEDB: 0,
                        _CODE_TEXT.LOOP_254637: False,
                        _CODE_TEXT.FADEINSECONDS: automatic_fade_seconds,
                        _CODE_TEXT.FADEOUTSECONDS: automatic_fade_seconds,
                    }
                )
        if globalAudioPath and os.path.exists(globalAudioPath):
            global_audio_duration = get_media_duration(ffmpegCmd, globalAudioPath)
            if global_audio_duration > FFMPEG_CONSTANTS.ZERO_SECONDS:
                expected_output_duration = global_audio_duration
            auto_music_profile = config.get(_CODE_TEXT.AUTOMUSICPROFILE)
            has_music_track = any(track.get(_CODE_TEXT.TYPE) == _CODE_TEXT.MUSIC for track in audio_tracks)
            if auto_music_profile and not has_music_track:
                automatic_music_path = create_automatic_music_bed(
                    ffmpegCmd,
                    tempDir,
                    expected_output_duration,
                    auto_music_profile,
                )
                if automatic_music_path:
                    automatic_fade_seconds = min(2.0, expected_output_duration / 4.0)
                    audio_tracks.append(
                        {
                            _CODE_TEXT.ID: _CODE_TEXT.AUTOMATIC_MUSIC_BED,
                            _CODE_TEXT.TYPE: _CODE_TEXT.MUSIC,
                            _CODE_TEXT.ASSETPATH: automatic_music_path,
                            _CODE_TEXT.STARTSECONDS: 0,
                            _CODE_TEXT.DURATIONSECONDS: expected_output_duration,
                            _CODE_TEXT.VOLUMEDB: 0,
                            _CODE_TEXT.LOOP_254637: False,
                            _CODE_TEXT.FADEINSECONDS: automatic_fade_seconds,
                            _CODE_TEXT.FADEOUTSECONDS: automatic_fade_seconds,
                        }
                    )
            has_sound_effect_track = any(track.get(_CODE_TEXT.TYPE) == _CODE_TEXT.SFX for track in audio_tracks)
            if auto_music_profile and not has_sound_effect_track:
                automatic_accent_path = create_automatic_accent_track(
                    ffmpegCmd,
                    tempDir,
                    scenes,
                    auto_music_profile,
                )
                if automatic_accent_path:
                    audio_tracks.append(
                        {
                            _CODE_TEXT.ID: _CODE_TEXT.AUTOMATIC_EDITORIAL_ACCENTS,
                            _CODE_TEXT.TYPE: _CODE_TEXT.SFX,
                            _CODE_TEXT.ASSETPATH: automatic_accent_path,
                            _CODE_TEXT.STARTSECONDS: 0,
                            _CODE_TEXT.DURATIONSECONDS: expected_output_duration,
                            _CODE_TEXT.VOLUMEDB: -6,
                            _CODE_TEXT.LOOP_254637: False,
                            _CODE_TEXT.FADEINSECONDS: 0,
                            _CODE_TEXT.FADEOUTSECONDS: 0,
                        }
                    )
            mergeAudioCmd = [
                ffmpegCmd,
                _CODE_TEXT.Y_6287C6,
                _CODE_TEXT.I,
                tempFinalPath,
                _CODE_TEXT.I,
                globalAudioPath,
            ]
            for track in audio_tracks:
                if track.get(_CODE_TEXT.LOOP_254637):
                    mergeAudioCmd.extend([_CODE_TEXT.STREAM_LOOP, _CODE_TEXT.VALUE_1_1BAD6B])
                mergeAudioCmd.extend([_CODE_TEXT.I, track.get(_CODE_TEXT.ASSETPATH)])
            subtitle_input_index = add_subtitle_input(
                mergeAudioCmd,
                subtitle_path,
                2 + len(audio_tracks),
            )
            mix_filters = []
            mix_inputs = [_CODE_TEXT.VALUE_1_A]
            for track_index, track in enumerate(audio_tracks):
                input_index = track_index + 2
                delay_milliseconds = max(0, round(float(track.get(_CODE_TEXT.STARTSECONDS, 0)) * 1000))
                track_duration = float(track.get(_CODE_TEXT.DURATIONSECONDS, expected_output_duration))
                fade_in_seconds = min(max(0, float(track.get(_CODE_TEXT.FADEINSECONDS, 0))), track_duration)
                fade_out_seconds = min(max(0, float(track.get(_CODE_TEXT.FADEOUTSECONDS, 0))), track_duration)
                filters = [
                    FFMPEG_CONSTANTS.AUDIO_TRACK_TRIM_FILTER.format(track_duration),
                    FFMPEG_CONSTANTS.AUDIO_TRACK_VOLUME_FILTER.format(float(track.get(_CODE_TEXT.VOLUMEDB, -18))),
                ]
                if fade_in_seconds > FFMPEG_CONSTANTS.ZERO_SECONDS:
                    filters.append(FFMPEG_CONSTANTS.AUDIO_TRACK_FADE_IN_FILTER.format(fade_in_seconds))
                if fade_out_seconds > FFMPEG_CONSTANTS.ZERO_SECONDS:
                    filters.append(
                        FFMPEG_CONSTANTS.AUDIO_TRACK_FADE_OUT_FILTER.format(
                            max(0, track_duration - fade_out_seconds),
                            fade_out_seconds,
                        )
                    )
                filters.append(FFMPEG_CONSTANTS.AUDIO_TRACK_DELAY_FILTER.format(delay_milliseconds))
                prepared_label = f'{_CODE_TEXT.PREPARED}{track_index}'
                output_label = f'{_CODE_TEXT.MIX}{track_index}'
                mix_filters.append(f'{_CODE_TEXT.SYMBOL_245843}{input_index}{_CODE_TEXT.A}{_CODE_TEXT.SYMBOL_D03502.join(filters)}{_CODE_TEXT.SYMBOL_245843}{prepared_label}{_CODE_TEXT.SYMBOL_CFAE0D}')
                mix_filters.append(f'{_CODE_TEXT.SYMBOL_245843}{prepared_label}{_CODE_TEXT.ANULL_0D47DA}{output_label}{_CODE_TEXT.SYMBOL_CFAE0D}')
                mix_inputs.append(f'{_CODE_TEXT.SYMBOL_245843}{output_label}{_CODE_TEXT.SYMBOL_CFAE0D}')
            if mix_filters:
                mix_filters.append(f"{''.join(mix_inputs)}{FFMPEG_CONSTANTS.AUDIO_MIX_FILTER.format(len(mix_inputs))}{_CODE_TEXT.MIXED}")
                mergeAudioCmd.extend([_CODE_TEXT.FILTER_COMPLEX, _CODE_TEXT.SYMBOL_41B805.join(mix_filters), _CODE_TEXT.MAP, _CODE_TEXT.VALUE_0_V_0, _CODE_TEXT.MAP, _CODE_TEXT.MIXED])
            else:
                mergeAudioCmd.extend([_CODE_TEXT.MAP, _CODE_TEXT.VALUE_0_V_0, _CODE_TEXT.MAP, _CODE_TEXT.VALUE_1_A_0, _CODE_TEXT.AF, _CODE_TEXT.LOUDNORM_I_16_TP_1_LRA_7])
            mergeAudioCmd.extend([_CODE_TEXT.C_A, FFMPEG_CONSTANTS.AAC, _CODE_TEXT.AR, _CODE_TEXT.VALUE_48000])
            if subtitle_input_index is not None:
                add_subtitle_output(mergeAudioCmd, subtitle_path, subtitle_mode, subtitle_input_index)
            else:
                mergeAudioCmd.extend([_CODE_TEXT.C_V, FFMPEG_CONSTANTS.COPY_CODEC])
            if global_audio_duration > FFMPEG_CONSTANTS.ZERO_SECONDS:
                mergeAudioCmd.extend([_CODE_TEXT.T, str(global_audio_duration)])
            mergeAudioCmd.extend([_CODE_TEXT.SHORTEST, finalOutputPath])
            subprocess.run(mergeAudioCmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, cwd=tempDir)
        else:
            if os.path.exists(finalOutputPath):
                os.remove(finalOutputPath)
            if scene_audio_present:
                normalizeAudioCmd = [
                    ffmpegCmd,
                    _CODE_TEXT.Y_6287C6,
                    _CODE_TEXT.I,
                    tempFinalPath,
                ]
                for track in audio_tracks:
                    if track.get(_CODE_TEXT.LOOP_254637):
                        normalizeAudioCmd.extend([_CODE_TEXT.STREAM_LOOP, _CODE_TEXT.VALUE_1_1BAD6B])
                    normalizeAudioCmd.extend([_CODE_TEXT.I, track.get(_CODE_TEXT.ASSETPATH)])
                subtitle_input_index = add_subtitle_input(normalizeAudioCmd, subtitle_path, 1 + len(audio_tracks))
                if audio_tracks:
                    film_mix_filters = []
                    film_mix_inputs = [_CODE_TEXT.VALUE_0_A]
                    for track_index, track in enumerate(audio_tracks):
                        input_index = track_index + 1
                        delay_ms = max(0, round(float(track.get(_CODE_TEXT.STARTSECONDS, 0)) * 1000))
                        volume_db = float(track.get(_CODE_TEXT.VOLUMEDB, -18))
                        label = f'{_CODE_TEXT.FILMMIX}{track_index}'
                        film_mix_filters.append(f'{_CODE_TEXT.SYMBOL_245843}{input_index}{_CODE_TEXT.A_VOLUME}{volume_db}{_CODE_TEXT.DB_ADELAY}{delay_ms}{_CODE_TEXT.SYMBOL_CBE5CF}{delay_ms}{_CODE_TEXT.SYMBOL_245843}{label}{_CODE_TEXT.SYMBOL_CFAE0D}')
                        film_mix_inputs.append(f'{_CODE_TEXT.SYMBOL_245843}{label}{_CODE_TEXT.SYMBOL_CFAE0D}')
                    film_mix_filters.append(f"{''.join(film_mix_inputs)}{_CODE_TEXT.AMIX_INPUTS}{len(film_mix_inputs)}{_CODE_TEXT.DURATION_FIRST_DROPOUT_TRANSITION_2_LOUDNORM_I_16_TP_1_LRA_7}")
                    normalizeAudioCmd.extend([_CODE_TEXT.FILTER_COMPLEX, _CODE_TEXT.SYMBOL_41B805.join(film_mix_filters), _CODE_TEXT.MAP, _CODE_TEXT.VALUE_0_V_0, _CODE_TEXT.MAP, _CODE_TEXT.FILM_AUDIO])
                else:
                    normalizeAudioCmd.extend([_CODE_TEXT.MAP, _CODE_TEXT.VALUE_0_V_0, _CODE_TEXT.MAP, _CODE_TEXT.VALUE_0_A_0, _CODE_TEXT.AF, _CODE_TEXT.LOUDNORM_I_16_TP_1_LRA_7])
                normalizeAudioCmd.extend([_CODE_TEXT.C_A, FFMPEG_CONSTANTS.AAC, _CODE_TEXT.AR, _CODE_TEXT.VALUE_48000])
                if subtitle_input_index is not None:
                    add_subtitle_output(normalizeAudioCmd, subtitle_path, subtitle_mode, subtitle_input_index)
                else:
                    normalizeAudioCmd.extend([_CODE_TEXT.C_V, FFMPEG_CONSTANTS.COPY_CODEC])
                normalizeAudioCmd.extend([_CODE_TEXT.T, str(expected_output_duration), finalOutputPath])
                subprocess.run(normalizeAudioCmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, cwd=tempDir)
            else:
                if subtitle_path:
                    subtitle_cmd = [ffmpegCmd, _CODE_TEXT.Y_6287C6, _CODE_TEXT.I, tempFinalPath, _CODE_TEXT.I, subtitle_path, _CODE_TEXT.MAP, _CODE_TEXT.VALUE_0_V_0]
                    add_subtitle_output(subtitle_cmd, subtitle_path, subtitle_mode, 1)
                    subtitle_cmd.append(finalOutputPath)
                    subprocess.run(subtitle_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, cwd=tempDir)
                else:
                    os.rename(tempFinalPath, finalOutputPath)
        validate_rendered_output(
            ffmpegCmd,
            finalOutputPath,
            width,
            height,
            expected_output_duration,
            preserve_video_audio or scene_audio_present or bool(globalAudioPath and os.path.exists(globalAudioPath)),
        )
        emit_progress(99)
        print(json.dumps({FFMPEG_CONSTANTS.OUTPUT_SUCCESS: True, _CODE_TEXT.URL: finalOutputUrl}))
    except Exception as e:
        print(json.dumps({FFMPEG_CONSTANTS.OUTPUT_SUCCESS: False, _CODE_TEXT.ERROR_CA00FC: str(e), _CODE_TEXT.TRACEBACK: traceback.format_exc()}))
        sys.exit(1)
if __name__ == _CODE_TEXT.MAIN:
    main()
