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
    RGB24 = "rgb24"
    RAW_VIDEO = "rawvideo"
    LIBX264 = "libx264"
    SLOW = "veryfast"
    HIGH = "high"
    AAC = "aac"
    YUV420P = "yuv420p"
    ANULLSRC = "anullsrc=r=44100:cl=stereo"
    AFADE = "afade=t=in:st=0:d={0},afade=t=out:st={1}:d={0}"
    FADE_IN_BLACK = "fade=t=in:st=0:d={0}:color=black"
    FADE_OUT_BLACK = "fade=t=out:st={0}:d={1}:color=black"
    NULL_EFFECT = "null"
    CONCAT_PREFIX = "file 'part_{0}.mp4'"
    CONCAT_FORMAT = "concat"
    COPY_CODEC = "copy"
    RGB_MODE = "RGB"
    BLACK_COLOR = "black"
    UTF8 = "utf-8"
    OUTPUT_SUCCESS = "success"
    JPEG_FORMAT = "JPEG"
    ASSET_VIDEO = "video"
    IMAGE_EXTENSION = ".jpg"
    VIDEO_EXTENSION = ".mp4"
    VIDEO_SCALE_FILTER = "scale={0}:{1}:force_original_aspect_ratio=increase,crop={0}:{1},fps={2},setsar=1"
    IMAGE_SCALE_FILTER = "scale={0}:{1}:force_original_aspect_ratio=increase,crop={0}:{1},setsar=1"
    ZOOM_IN_FILTER = "zoompan=z='min(zoom+{0},1.08)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d={1}:s={2}x{3}:fps={4}"
    ZOOM_OUT_FILTER = "zoompan=z='if(eq(on,1),1.08,max(1,zoom-{0}))':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d={1}:s={2}x{3}:fps={4}"
    PAN_LEFT_FILTER = "zoompan=z=1.08:x='(iw-iw/zoom)*(1-on/{0})':y='ih/2-ih/zoom/2':d={0}:s={1}x{2}:fps={3}"
    PAN_RIGHT_FILTER = "zoompan=z=1.08:x='(iw-iw/zoom)*on/{0}':y='ih/2-ih/zoom/2':d={0}:s={1}x{2}:fps={3}"
    PAN_UP_FILTER = "zoompan=z=1.08:x='iw/2-iw/zoom/2':y='(ih-ih/zoom)*(1-on/{0})':d={0}:s={1}x{2}:fps={3}"
    PAN_DOWN_FILTER = "zoompan=z=1.08:x='iw/2-iw/zoom/2':y='(ih-ih/zoom)*on/{0}':d={0}:s={1}x{2}:fps={3}"
    VIDEO_TRIM_FILTER = "trim=start={0}:end={1},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration={2}"
    VIDEO_TRIM_START_FILTER = "trim=start={0},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration={1}"
    FFPROBE_NAME = "ffprobe"
    FFPROBE_EXE_NAME = "ffprobe.exe"
    WINDOWS_EXECUTABLE_EXTENSION = ".exe"
    FFPROBE_LOG_LEVEL = "error"
    FFPROBE_DURATION_ENTRY = "format=duration"
    FFPROBE_OUTPUT_FORMAT = "default=noprint_wrappers=1:nokey=1"
    PROBE_TIMEOUT_SECONDS = 15
    DURATION_PATTERN = r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)"
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
    DEFAULT_OUTPUT_BITRATE = "5000k"
    EMPTY_STRING = ""
    BINARY_WRITE_MODE = "wb"
    KEY_ASSET_TYPE = "assetType"
    KEY_IMAGE_BASE64 = "imageBase64"
    KEY_AUDIO_BASE64 = "audioBase64"
    KEY_MEDIA_PATH = "mediaPath"
    KEY_AUDIO_PATH = "audioPath"
    KEY_DURATION = "duration"
    KEY_TRANSITION = "transition"
    KEY_CAMERA_MOTION = "cameraMotion"
    KEY_EFFECTS = "effects"
    KEY_LIGHTING_EFFECT = "lightingEffect"
    KEY_MAX_SCENE_WORKERS = "maxSceneWorkers"
    KEY_VIDEO_TRIM_START_SECONDS = "videoTrimStartSeconds"
    KEY_VIDEO_TRIM_END_SECONDS = "videoTrimEndSeconds"
    KEY_SCENE_CACHE_DIR = "sceneCacheDir"
    SCENE_CACHE_VERSION = "scene-cache-v1"
    SCENE_CACHE_MIN_BYTES = 1024
    KEY_SUBTITLE = "subtitle"
    KEY_SUBTITLE_CUES = "subtitleCues"
    KEY_SUBTITLE_CUE_TEXT = "text"
    KEY_SUBTITLE_CUE_START = "startOffsetSeconds"
    KEY_SUBTITLE_CUE_DURATION = "durationSeconds"
    KEY_SUBTITLE_MODE = "subtitleMode"
    KEY_AUDIO_TRACKS = "audioTracks"
    KEY_SAFE_PROFILE = "safeProfile"
    SUBTITLE_MODE_BURN_IN = "burn_in"
    SUBTITLE_MODE_TRACK = "track"
    SUBTITLE_MODE_BOTH = "both"
    SUBTITLE_FILE_NAME = "subtitles.srt"
    SUBTITLE_CODEC = "mov_text"
    SUBTITLE_STREAM_TITLE = "Vidify Subtitles"
    KEY_TEXT = "text"
    AUDIO_TRACK_VOLUME_FILTER = "volume={0}dB"
    AUDIO_TRACK_DELAY_FILTER = "adelay={0}|{0}"
    AUDIO_TRACK_TRIM_FILTER = "atrim=duration={0}"
    AUDIO_TRACK_FADE_IN_FILTER = "afade=t=in:st=0:d={0}"
    AUDIO_TRACK_FADE_OUT_FILTER = "afade=t=out:st={0}:d={1}"
    AUDIO_MIX_FILTER = "amix=inputs={0}:duration=first:dropout_transition=2,loudnorm=I=-16:TP=-1:LRA=7"
    TEMP_MEDIA_TEMPLATE = "media_{0}{1}"
    TEMP_AUDIO_TEMPLATE = "audio_{0}.mp3"
    PART_FILE_TEMPLATE = "part_{0}.mp4"
    PART_ERROR_TEMPLATE = "FFmpeg scene {0} failed with code {1}: {2}"
    
    ZOOM_IN = "zoom in"
    ZOOM_OUT = "zoom out"
    PAN_LEFT = "pan left"
    PAN_RIGHT = "pan right"
    PAN_UP = "pan up"
    PAN_DOWN = "pan down"
    DRIFT = "drift"
    ARC = "arc"
    PUSH = "push"
    REVEAL = "reveal"
    STATIC = "static"
    DEFAULT = "default"
    
    TRANS_CROSS = "cross_dissolve"
    TRANS_BLUR = "blur_dissolve"
    TRANS_BRIGHT = "brightness_fade"
    TRANS_ZOOM = "zoom_transition"
    TRANS_SLIDE = "slide_left"
    TRANS_SLIDE_UP = "slide_up"
    TRANS_FADE_BLACK = "fade_black"
    TRANS_FADE_WHITE = "fade_white"
    TRANS_CUT = "cut"
    TRANS_SLIDE_RIGHT = "slide_right"
    TRANS_SLIDE_DOWN = "slide_down"
    TRANS_WIPE_LEFT = "wipe_left"
    TRANS_WIPE_RIGHT = "wipe_right"
    TRANS_WIPE_UP = "wipe_up"
    TRANS_WIPE_DOWN = "wipe_down"
    TRANS_FLASH = "flash"
    TRANS_WHIP_LEFT = "whip_left"
    TRANS_WHIP_RIGHT = "whip_right"
    TRANS_GLITCH = "glitch_transition"
    TRANS_FILM_BURN = "film_burn"

    EFFECT_SAD_KEYS = ["sad", "gloomy", "dark", "melancholic", "vignette", "shadow"]
    EFFECT_VINTAGE_KEYS = ["vintage", "sepia", "old photo", "grain", "retro", "classic"]
    EFFECT_DREAMY_KEYS = ["dreamy", "glow", "bloom", "ethereal", "mystery", "magical", "soft light"]
    EFFECT_GLITCH_KEYS = ["glitch", "action", "cyberpunk", "energy", "intense", "shaking", "vibrant"]
    EFFECT_WARM_KEYS = ["warm", "golden hour", "sunny", "bright", "romantic"]
    EFFECT_COLD_KEYS = ["cold", "winter", "snow", "frosty", "blue mood", "lạnh", "băng"]
    EFFECT_NOIR_KEYS = ["noir", "bw", "black and white", "monochrome", "trắng đen"]
    EFFECT_HORROR_KEYS = ["horror", "scary", "ghostly", "foggy", "misty", "kinh dị", "sương mù"]
    EFFECT_VHS_KEYS = ["vhs", "analog", "tv distortion", "scanline", "nhiễu"]
    EFFECT_NEON_KEYS = ["neon", "glow neon", "cyberpunk color", "sặc sỡ"]
    DEFAULT_LIGHTING_EFFECT = "natural_light"
    SHORT_SCENE_DURATION = 2.5
    SHORT_SCENE_LIGHTING_EFFECTS = {"strobe", "flicker"}
    SHORT_SCENE_VISUAL_EFFECTS = {"glitch", "vhs", "pixelate"}
    SHORT_SCENE_VISUAL_FALLBACK = "soft_focus"
    COMFORT_MIN_INTENSE_DURATION = 3.5
    COMFORT_EFFECT_COOLDOWN_SCENES = 6
    DISRUPTIVE_LIGHTING_EFFECTS = {"strobe", "flicker", "exposure_pulse"}
    DISRUPTIVE_VISUAL_EFFECTS = {"glitch", "vhs", "pixelate", "chromatic_aberration"}
    DISRUPTIVE_TRANSITIONS = {"flash", "whip_left", "whip_right", "glitch_transition", "zoom_transition"}
    MOTION_STYLE_BY_ID = {
        "zoom_in": 0, "zoom_out": 1, "pan_left": 2, "pan_right": 3,
        "pan_up": 4, "pan_down": 5, "diagonal_down_right": 6,
        "diagonal_up_right": 7, "cinematic_arc": 8, "drift": 9,
        "push_in": 10, "slow_reveal": 11, "static": 12,
        "diagonal_up_left": 13, "diagonal_down_left": 14, "pull_out": 15,
        "floating_camera": 16, "handheld_soft": 17,
        "parallax_left": 18, "parallax_right": 19,
    }
    TRANSITION_IDS = {
        "cut", "cross_dissolve", "blur_dissolve", "brightness_fade", "fade_black", "fade_white",
        "slide_left", "slide_right", "slide_up", "slide_down", "wipe_left", "wipe_right", "wipe_up", "wipe_down",
        "zoom_transition", "flash", "whip_left", "whip_right", "glitch_transition", "film_burn",
    }

def format_srt_timestamp(seconds):
    total_milliseconds = max(0, round(float(seconds) * 1000))
    hours, remainder = divmod(total_milliseconds, 3600000)
    minutes, remainder = divmod(remainder, 60000)
    secs, milliseconds = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"

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
                    entries.append(
                        f"{len(entries) + 1}\n{format_srt_timestamp(start_seconds)} --> {format_srt_timestamp(start_seconds + cue_duration)}\n{text}\n"
                    )
        else:
            text = str(scene.get(FFMPEG_CONSTANTS.KEY_SUBTITLE) or scene.get(FFMPEG_CONSTANTS.KEY_TEXT) or "").strip()
            if text:
                entries.append(
                    f"{len(entries) + 1}\n{format_srt_timestamp(cursor)} --> {format_srt_timestamp(cursor + duration)}\n{text}\n"
                )
        cursor += duration
    with open(subtitle_path, "w", encoding=FFMPEG_CONSTANTS.UTF8) as subtitle_file:
        subtitle_file.write("\n".join(entries))
    return subtitle_path if entries else None

def create_subtitle_filter(subtitle_path):
    subtitle_style = (
        "FontName=Arial,FontSize=13,PrimaryColour=&H00FFFFFF,"
        "OutlineColour=&H90000000,BackColour=&H50000000,"
        "BorderStyle=1,Outline=1.8,Shadow=0,Alignment=2,MarginV=28,"
        "Bold=0,Spacing=0.2"
    )
    return f"subtitles=filename='{os.path.basename(subtitle_path)}':force_style='{subtitle_style}'"

def add_subtitle_input(command, subtitle_path, subtitle_input_index):
    if not subtitle_path:
        return None
    command.extend(["-i", subtitle_path])
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
        command.extend([
            "-vf", create_subtitle_filter(subtitle_path),
            "-c:v", FFMPEG_CONSTANTS.LIBX264,
            "-preset", FFMPEG_CONSTANTS.SLOW,
            "-pix_fmt", FFMPEG_CONSTANTS.YUV420P,
        ])
    else:
        command.extend(["-c:v", FFMPEG_CONSTANTS.COPY_CODEC])
    if include_track:
        command.extend([
            "-map", f"{subtitle_input_index}:s:0",
            "-c:s", FFMPEG_CONSTANTS.SUBTITLE_CODEC,
            "-metadata:s:s:0", f"title={FFMPEG_CONSTANTS.SUBTITLE_STREAM_TITLE}",
        ])

    COLOR_BLACK_RGB = (0, 0, 0)
    COLOR_WHITE_RGB = (255, 255, 255)
    COLOR_FOG_RGB = (200, 200, 200)
    COLOR_COLD_TINT_RGB = (100, 140, 240)
    COLOR_WARM_TINT_RGB = (255, 200, 150)
    COLOR_GLOW_TINT_RGB = (255, 140, 0)

def get_ffprobe_command(ffmpeg_cmd):
    ffmpeg_directory = os.path.dirname(ffmpeg_cmd)
    ffmpeg_name = os.path.basename(ffmpeg_cmd).lower()
    ffprobe_name = (
        FFMPEG_CONSTANTS.FFPROBE_EXE_NAME
        if ffmpeg_name.endswith(FFMPEG_CONSTANTS.WINDOWS_EXECUTABLE_EXTENSION)
        else FFMPEG_CONSTANTS.FFPROBE_NAME
    )
    sibling_path = os.path.join(ffmpeg_directory, ffprobe_name) if ffmpeg_directory else ffprobe_name
    return sibling_path if os.path.exists(sibling_path) else ffprobe_name

def get_media_duration(ffmpeg_cmd, media_path):
    command = [
        get_ffprobe_command(ffmpeg_cmd),
        "-v",
        FFMPEG_CONSTANTS.FFPROBE_LOG_LEVEL,
        "-show_entries",
        FFMPEG_CONSTANTS.FFPROBE_DURATION_ENTRY,
        "-of",
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
            [ffmpeg_cmd, "-i", media_path],
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
        return (
            hours
            * FFMPEG_CONSTANTS.MINUTES_PER_HOUR
            * FFMPEG_CONSTANTS.SECONDS_PER_MINUTE
            + minutes * FFMPEG_CONSTANTS.SECONDS_PER_MINUTE
            + seconds
        )
    except (OSError, ValueError, subprocess.SubprocessError):
        return FFMPEG_CONSTANTS.ZERO_SECONDS

def media_has_audio_stream(ffmpeg_cmd, media_path):
    try:
        result = subprocess.run(
            [
                get_ffprobe_command(ffmpeg_cmd), "-v", "error",
                "-select_streams", "a:0", "-show_entries", "stream=codec_type",
                "-of", "csv=p=0", media_path,
            ],
            capture_output=True,
            text=True,
            timeout=FFMPEG_CONSTANTS.PROBE_TIMEOUT_SECONDS,
            check=False,
        )
        return result.returncode == 0 and "audio" in result.stdout.lower()
    except (OSError, subprocess.SubprocessError):
        return False

def create_automatic_music_bed(ffmpeg_cmd, temp_dir, duration_seconds, profile):
    profiles = {
        "satirical_editorial": (110.0, 164.81, 220.0, "pink", 950),
        "tension_pulse": (55.0, 82.41, 110.0, "brown", 520),
        "light_warm": (130.81, 196.0, 261.63, "pink", 1300),
        "reflective_ambient": (73.42, 110.0, 146.83, "brown", 720),
        "documentary_editorial": (82.41, 123.47, 164.81, "pink", 820),
        "curious_explainer": (98.0, 146.83, 220.0, "pink", 1150),
        "forensic_restraint": (55.0, 73.42, 110.0, "brown", 430),
        "clean_review": (110.0, 164.81, 246.94, "pink", 1250),
        "countdown_momentum": (123.47, 185.0, 246.94, "pink", 1200),
        "human_story_arc": (73.42, 123.47, 196.0, "brown", 760),
        "world_discovery": (65.41, 98.0, 196.0, "brown", 680),
    }
    frequencies = profiles.get(profile, profiles["documentary_editorial"])
    output_path = os.path.join(temp_dir, "automatic_music_bed.wav")
    duration = max(1.0, float(duration_seconds))
    command = [ffmpeg_cmd, "-y"]
    for frequency in frequencies[:3]:
        command.extend([
            "-f", "lavfi", "-i",
            f"sine=frequency={frequency}:sample_rate=48000:duration={duration}",
        ])
    command.extend([
        "-f", "lavfi", "-i",
        f"anoisesrc=color={frequencies[3]}:amplitude=0.018:sample_rate=48000:duration={duration}",
    ])
    filter_graph = (
        f"[0:a]volume=0.018[a0];[1:a]volume=0.012[a1];[2:a]volume=0.007[a2];"
        f"[3:a]lowpass=f={frequencies[4]},highpass=f=45,volume=0.32[texture];"
        f"[a0][a1][a2][texture]amix=inputs=4:normalize=0,"
        f"acompressor=threshold=0.08:ratio=2:attack=80:release=500,"
        f"loudnorm=I=-31:TP=-9:LRA=4,"
        f"aformat=channel_layouts=stereo[music]"
    )
    command.extend([
        "-filter_complex", filter_graph,
        "-map", "[music]", "-c:a", "pcm_s16le", output_path,
    ])
    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        return output_path if os.path.exists(output_path) else None
    except (OSError, subprocess.SubprocessError):
        return None

def create_automatic_accent_track(ffmpeg_cmd, temp_dir, scenes, profile):
    accent_events = [(0.12, "impact")]
    timeline_seconds = 0.0
    last_accent_seconds = -20.0
    for scene in scenes:
        purpose = str(scene.get("shotPurpose", "")).lower()
        transition = str(scene.get("transition", "")).lower()
        visible_action = str(scene.get("visibleAction", "")).lower()
        is_emphasis = purpose in ("reveal", "punchline", "chapter_turn", "turning_point")
        is_chapter_boundary = transition == "fade_black"
        if is_emphasis and timeline_seconds - last_accent_seconds >= 8.0:
            accent_events.append((max(0.0, timeline_seconds + 0.08), "impact" if purpose in ("reveal", "turning_point") else "soft"))
            last_accent_seconds = timeline_seconds
        elif is_chapter_boundary and timeline_seconds - last_accent_seconds >= 15.0:
            accent_events.append((max(0.0, timeline_seconds + float(scene.get("duration", 0))), "whoosh"))
            last_accent_seconds = timeline_seconds
        action_type = None
        if re.search(r"\bdoor\b|cửa", visible_action):
            action_type = "door"
        elif re.search(r"\bfootsteps?\b|\bwalk(?:s|ing|ed)?\b|bước chân|đi bộ", visible_action):
            action_type = "footstep"
        elif re.search(r"\bphone\b|điện thoại|tin nhắn", visible_action):
            action_type = "phone"
        elif re.search(r"\bcar\b|\bvehicle\b|xe máy|ô tô", visible_action):
            action_type = "vehicle"
        if action_type and timeline_seconds - last_accent_seconds >= 2.5:
            accent_events.append((max(0.0, timeline_seconds + 0.15), action_type))
            last_accent_seconds = timeline_seconds
        timeline_seconds += float(scene.get("duration", 0))
    accent_events = accent_events[:10]
    if not accent_events:
        return None
    bright_profiles = ("satirical_editorial", "light_warm", "clean_review", "countdown_momentum", "curious_explainer")
    base_frequency = 520 if profile in bright_profiles else 95
    output_path = os.path.join(temp_dir, "automatic_accent_track.wav")
    command = [ffmpeg_cmd, "-y"]
    for _, event_type in accent_events:
        if event_type == "whoosh":
            source = "anoisesrc=color=white:amplitude=0.16:sample_rate=48000:duration=0.55"
        elif event_type == "door":
            source = "anoisesrc=color=brown:amplitude=0.20:sample_rate=48000:duration=0.28"
        elif event_type == "footstep":
            source = "anoisesrc=color=brown:amplitude=0.18:sample_rate=48000:duration=0.48"
        elif event_type == "phone":
            source = "sine=frequency=880:sample_rate=48000:duration=0.16"
        elif event_type == "vehicle":
            source = "anoisesrc=color=brown:amplitude=0.16:sample_rate=48000:duration=0.70"
        elif event_type == "soft":
            source = "anoisesrc=color=pink:amplitude=0.10:sample_rate=48000:duration=0.34"
        else:
            source = f"sine=frequency={base_frequency}:sample_rate=48000:duration=0.38"
        command.extend(["-f", "lavfi", "-i", source])
    filters = []
    labels = []
    for index, (accent_time, event_type) in enumerate(accent_events):
        delay_ms = round(accent_time * 1000)
        label = f"accent{index}"
        if event_type == "whoosh":
            treatment = "highpass=f=180,lowpass=f=5500,afade=t=in:st=0:d=0.22,afade=t=out:st=0.28:d=0.27,volume=-15dB"
        elif event_type == "door":
            treatment = "highpass=f=70,lowpass=f=950,afade=t=out:st=0.03:d=0.24,volume=-16dB"
        elif event_type == "footstep":
            treatment = "highpass=f=55,lowpass=f=520,tremolo=f=4:d=0.45,afade=t=out:st=0.32:d=0.15,volume=-18dB"
        elif event_type == "phone":
            treatment = "highpass=f=650,lowpass=f=1800,afade=t=out:st=0.08:d=0.08,volume=-20dB"
        elif event_type == "vehicle":
            treatment = "highpass=f=45,lowpass=f=380,afade=t=in:st=0:d=0.18,afade=t=out:st=0.42:d=0.25,volume=-19dB"
        elif event_type == "soft":
            treatment = "highpass=f=120,lowpass=f=2200,afade=t=out:st=0.03:d=0.30,volume=-18dB"
        else:
            treatment = "lowpass=f=180,afade=t=out:st=0.02:d=0.35,volume=-16dB"
        filters.append(f"[{index}:a]{treatment},adelay={delay_ms}:all=1[{label}]")
        labels.append(f"[{label}]")
    filters.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0,apad[accents]")
    command.extend([
        "-filter_complex", ";".join(filters),
        "-map", "[accents]", "-t", str(max(1.0, timeline_seconds)),
        "-c:a", "pcm_s16le", output_path,
    ])
    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        return output_path if os.path.exists(output_path) else None
    except (OSError, subprocess.SubprocessError):
        return None

def validate_rendered_output(ffmpeg_cmd, media_path, width, height, expected_duration, audio_required):
    if not os.path.exists(media_path) or os.path.getsize(media_path) < 1024:
        raise Exception("Final render is missing or empty")
    command = [
        get_ffprobe_command(ffmpeg_cmd), "-v", "error",
        "-show_entries", "format=duration:stream=codec_type,width,height",
        "-of", "json", media_path,
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
        raise Exception("Final render could not be inspected") from error
    streams = metadata.get("streams", [])
    video_stream = next((stream for stream in streams if stream.get("codec_type") == "video"), None)
    has_audio = any(stream.get("codec_type") == "audio" for stream in streams)
    if not video_stream:
        raise Exception("Final render has no video stream")
    if int(video_stream.get("width", 0)) != int(width) or int(video_stream.get("height", 0)) != int(height):
        raise Exception("Final render resolution does not match the requested output")
    if audio_required and not has_audio:
        raise Exception("Final render has no audio stream")
    actual_duration = float(metadata.get("format", {}).get("duration", 0) or 0)
    tolerance = max(1.25, expected_duration * 0.05)
    if actual_duration <= 0 or (expected_duration > 0 and abs(actual_duration - expected_duration) > tolerance):
        raise Exception("Final render duration is outside the expected range")

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
    # Generated clips commonly spend their first frames establishing the shot,
    # while strong zooms, morphs, or end poses tend to appear in the latter half.
    # Select an early-middle window so short voice scenes retain the principal
    # action without including either unstable edge.
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
    with open(file_path, "rb") as source_file:
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
        filters.append(f"fps={fps}")
    filters.extend([fade_filter, "format=yuv420p"])
    return ",".join(filters)

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
            vignette = Image.new("L", (w, h), 255)
            draw = ImageDraw.Draw(vignette)
            max_d = max(w, h)
            for r in range(int(max_d * 0.7), int(max_d * 0.45), -10):
                opacity = int((1.0 - (r - max_d*0.45)/(max_d*0.25)) * 120)
                opacity = max(0, min(opacity, 120))
                draw.ellipse([w/2 - r, h/2 - r, w/2 + r, h/2 + r], fill=255 - opacity)
            dark = Image.new("RGB", (w, h), FFMPEG_CONSTANTS.COLOR_BLACK_RGB)
            frame = Image.composite(dark, frame, vignette)
        except:
            pass

    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_VINTAGE_KEYS):
        sepia_matrix = (
            0.393, 0.769, 0.189, 0,
            0.349, 0.686, 0.168, 0,
            0.272, 0.534, 0.131, 0
        )
        frame = frame.convert("RGB", sepia_matrix)
        try:
            noise = Image.effect_noise((w, h), 8)
            noise = noise.convert("RGB")
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
            r_shifted = Image.new("L", (w, h))
            r_shifted.paste(r, (-4, 0))
            b_shifted = Image.new("L", (w, h))
            b_shifted.paste(b, (4, 0))
            frame = Image.merge("RGB", (r_shifted, g, b_shifted))
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
        warm_tint = Image.new("RGB", (w, h), FFMPEG_CONSTANTS.COLOR_WARM_TINT_RGB)
        frame = Image.blend(frame, warm_tint, 0.08)

    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_COLD_KEYS):
        frame = ImageEnhance.Color(frame).enhance(0.85)
        cold_tint = Image.new("RGB", (w, h), FFMPEG_CONSTANTS.COLOR_COLD_TINT_RGB)
        frame = Image.blend(frame, cold_tint, 0.12)

    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_NOIR_KEYS):
        frame = frame.convert("L").convert("RGB")
        frame = ImageEnhance.Contrast(frame).enhance(1.4)

    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_HORROR_KEYS):
        try:
            fog = Image.new("RGB", (w, h), FFMPEG_CONSTANTS.COLOR_FOG_RGB)
            frame = Image.blend(frame, fog, 0.15)
            frame = ImageEnhance.Color(frame).enhance(0.65)
            frame = ImageEnhance.Brightness(frame).enhance(0.75)
        except:
            pass

    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_VHS_KEYS):
        try:
            r, g, b = frame.split()
            r_shifted = Image.new("L", (w, h))
            r_shifted.paste(r, (-3, 1))
            b_shifted = Image.new("L", (w, h))
            b_shifted.paste(b, (3, -1))
            frame = Image.merge("RGB", (r_shifted, g, b_shifted))
            
            scanlines = Image.new("RGB", (w, h), FFMPEG_CONSTANTS.COLOR_WHITE_RGB)
            draw = ImageDraw.Draw(scanlines)
            for y in range(0, h, 4):
                draw.line([(0, y), (w, y)], fill=FFMPEG_CONSTANTS.COLOR_BLACK_RGB, width=1)
            frame = Image.blend(frame, scanlines, 0.08)
        except:
            pass

    if any(k in eff for k in FFMPEG_CONSTANTS.EFFECT_NEON_KEYS):
        frame = ImageEnhance.Color(frame).enhance(1.4)
        frame = ImageEnhance.Contrast(frame).enhance(1.2)

    if "film_grain" in eff:
        noise = Image.effect_noise((w, h), 5).convert("RGB")
        frame = Image.blend(frame, noise, 0.045)

    if "sharpen" in eff:
        frame = frame.filter(ImageFilter.UnsharpMask(radius=1.4, percent=115, threshold=4))

    if "chromatic_aberration" in eff:
        r, g, b = frame.split()
        shifted_r = Image.new("L", (w, h))
        shifted_r.paste(r, (-2, 0))
        shifted_b = Image.new("L", (w, h))
        shifted_b.paste(b, (2, 0))
        frame = Image.merge("RGB", (shifted_r, g, shifted_b))

    if "pixelate" in eff:
        small = frame.resize((max(1, w // 12), max(1, h // 12)), Image.Resampling.BILINEAR)
        frame = small.resize((w, h), Image.Resampling.NEAREST)

    if "soft_focus" in eff:
        softened = frame.filter(ImageFilter.GaussianBlur(3.5))
        frame = Image.blend(frame, softened, 0.22)

    return frame

def apply_lighting_effect(frame, lighting_str, frame_index, total_frames):
    light = str(lighting_str or FFMPEG_CONSTANTS.DEFAULT_LIGHTING_EFFECT).lower().strip()
    if light in ("", "none", "natural", FFMPEG_CONSTANTS.DEFAULT_LIGHTING_EFFECT):
        return frame
    w, h = frame.size
    progress = frame_index / max(total_frames - 1, 1)
    pulse = 0.5 - 0.5 * math.cos(progress * math.pi * 2.0)

    if light == "flicker":
        return ImageEnhance.Brightness(frame).enhance(0.96 + 0.05 * math.sin(progress * math.pi * 6.0))
    if light == "strobe":
        return ImageEnhance.Brightness(frame).enhance(1.0 + 0.08 * max(0.0, math.sin(progress * math.pi * 4.0)))
    if light == "exposure_pulse":
        return ImageEnhance.Brightness(frame).enhance(1.0 + 0.10 * pulse)
    if light == "golden_glow":
        warm = Image.new("RGB", (w, h), (255, 188, 92))
        return Image.blend(frame, warm, 0.08)

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    if light == "light_leak":
        draw.ellipse((-w * 0.35, -h * 0.25, w * 0.45, h * 1.1), fill=(255, 110, 45, int(24 + 16 * pulse)))
    elif light == "lens_flare":
        x = int(w * (0.2 + 0.6 * progress))
        y = int(h * 0.25)
        draw.ellipse((x - 70, y - 70, x + 70, y + 70), fill=(255, 230, 170, 34))
        draw.ellipse((x - 16, y - 16, x + 16, y + 16), fill=(255, 255, 235, 90))
    elif light == "god_rays":
        for offset in range(-2, 3):
            x = int(w * (0.25 + offset * 0.09))
            draw.polygon([(x, 0), (x + 35, 0), (x + 220, h), (x - 60, h)], fill=(255, 245, 205, 14))
    elif light == "spotlight":
        draw.ellipse((w * 0.2, -h * 0.15, w * 0.8, h * 0.95), fill=(255, 245, 220, 25))
    elif light == "bokeh":
        rng = random.Random(1337)
        for _ in range(14):
            x, y = rng.randint(0, w), rng.randint(0, h)
            radius = rng.randint(8, 28)
            draw.ellipse((x-radius, y-radius, x+radius, y+radius), fill=(255, 225, 160, 18))
    else:
        return frame
    return Image.alpha_composite(frame.convert("RGBA"), overlay).convert("RGB")

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
        base_frame = img_resized.transform(
            (width, height),
            Image.Transform.EXTENT,
            (x0, y0, x1, y1),
            resample=Image.Resampling.BILINEAR
        )
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
            
            final_frame = img_resized.transform(
                (width, height),
                Image.Transform.EXTENT,
                (x0, y0, x1, y1),
                resample=Image.Resampling.BILINEAR
            )
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
                frame = Image.blend(base, Image.new("RGB", (width, height), (255, 255, 255)), 0.45 * flash_amount)

            elif transition_type in (FFMPEG_CONSTANTS.TRANS_WHIP_LEFT, FFMPEG_CONSTANTS.TRANS_WHIP_RIGHT):
                direction = -1 if transition_type == FFMPEG_CONSTANTS.TRANS_WHIP_LEFT else 1
                offset = int(width * t_smooth)
                frame = Image.new("RGB", (width, height))
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
                burn = Image.new("RGB", (width, height), (255, 92, 20))
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

    normalized_motion = motion.replace("-", "_").replace(" ", "_")
    if normalized_motion in FFMPEG_CONSTANTS.MOTION_STYLE_BY_ID:
        return FFMPEG_CONSTANTS.MOTION_STYLE_BY_ID[normalized_motion]
    
    if "zoom in" in motion or "phóng to" in motion:
        return 0
    elif "zoom out" in motion or "thu nhỏ" in motion:
        return 1
    elif "pan left" in motion or "góc trái" in motion:
        return 2
    elif "pan right" in motion or "góc phải" in motion:
        return 3
    elif "pan up" in motion or "góc trên" in motion:
        return 4
    elif "pan down" in motion or "góc dưới" in motion:
        return 5
    elif "drift" in motion or "trôi nhẹ" in motion:
        return 9
    elif "arc" in motion or "hình cung" in motion:
        return 8
    elif "push" in motion or "đẩy vào" in motion:
        return 10
    elif "reveal" in motion or "hé lộ" in motion:
        return 11
    elif "static" in motion or "tĩnh" in motion:
        return 12
        
    return 12

def get_transition_type(scene_index, scene_transition=None, prev_transition_type=None):
    if scene_transition:
        transition_lower = scene_transition.lower().strip()
        if transition_lower in FFMPEG_CONSTANTS.TRANSITION_IDS:
            return transition_lower
        if "none" in transition_lower or "cut" in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_CUT
        elif "fade" in transition_lower and "white" in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_FADE_WHITE
        elif "fade" in transition_lower and "black" in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_FADE_BLACK
        elif "dissolve" in transition_lower or "cross" in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_CROSS
        elif "blur" in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_BLUR
        elif "bright" in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_BRIGHT
        elif "white" in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_FADE_WHITE
        elif "zoom" in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_ZOOM
        elif "slide" in transition_lower or "wipe" in transition_lower:
            if "up" in transition_lower:
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
            raise Exception("Missing config JSON file path")
        
        config_path = sys.argv[1]
        with open(config_path, "r", encoding=FFMPEG_CONSTANTS.UTF8) as f:
            config = json.load(f)
            
        tempDir = config.get("tempDir")
        ffmpegCmd = config.get("ffmpegCmd", "ffmpeg")
        width = config.get("width", FFMPEG_CONSTANTS.DEFAULT_OUTPUT_WIDTH)
        height = config.get("height", FFMPEG_CONSTANTS.DEFAULT_OUTPUT_HEIGHT)
        fps = config.get("fps", FFMPEG_CONSTANTS.DEFAULT_OUTPUT_FPS)
        bitrate = config.get("bitrate", FFMPEG_CONSTANTS.DEFAULT_OUTPUT_BITRATE)
        finalOutputPath = config.get("finalOutputPath")
        finalOutputUrl = config.get("finalOutputUrl")
        scenes = config.get("scenes", [])
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
            if b64_str and "base64," in b64_str:
                return b64_str.split("base64,")[1]
            return b64_str

        scene_media_paths = []
        scene_is_video = []
        scene_audio_paths = []
        scene_durations = []
        scene_transitions = []
        scene_media_owned = []
        scene_audio_owned = []
        preserve_video_audio = bool(config.get("preserveVideoAudio"))
        
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
            scene_trim_start = max(0.0, float(scene.get("sourceTrimStartSeconds", 0) or 0))
            scene_trim_end = max(0.0, float(scene.get("sourceTrimEndSeconds", 0) or 0))
            scene_source_crop = str(scene.get("sourceCrop") or "").strip()
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
                scene_id = scene.get("id") or idx
                raise Exception(f"Scene {scene_id} has no real visual asset")

            if preserve_video_audio and is_video:
                native_video_duration = get_media_duration(ffmpegCmd, mediaPath)
                if native_video_duration > FFMPEG_CONSTANTS.ZERO_SECONDS:
                    duration = max(FFMPEG_CONSTANTS.MIN_USABLE_VIDEO_SECONDS, native_video_duration - scene_trim_start - scene_trim_end)

            if not is_video:
                scene_id = scene.get("id") or idx
                try:
                    with Image.open(mediaPath) as image_file:
                        image_file.verify()
                except Exception as error:
                    raise Exception(f"Scene {scene_id} has an invalid image asset: {error}")
            
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

        globalAudioPath = config.get("globalAudioPath")
        if globalAudioPath and os.path.exists(globalAudioPath):
            global_audio_duration = get_media_duration(ffmpegCmd, globalAudioPath)
            declared_scene_duration = sum(float(value or 0) for value in scene_durations)
            if global_audio_duration > FFMPEG_CONSTANTS.ZERO_SECONDS and declared_scene_duration > FFMPEG_CONSTANTS.ZERO_SECONDS:
                duration_scale = global_audio_duration / declared_scene_duration
                scaled_durations = []
                scaled_cursor = 0.0
                for scene_index, original_duration in enumerate(scene_durations):
                    is_last_scene = scene_index == len(scene_durations) - 1
                    scaled_duration = (
                        max(0.0, global_audio_duration - scaled_cursor)
                        if is_last_scene
                        else max(0.05, float(original_duration) * duration_scale)
                    )
                    scaled_durations.append(scaled_duration)
                    scaled_cursor += scaled_duration
                    scenes[scene_index][FFMPEG_CONSTANTS.KEY_DURATION] = scaled_duration
                    for cue in scenes[scene_index].get(FFMPEG_CONSTANTS.KEY_SUBTITLE_CUES, []):
                        cue["startOffsetSeconds"] = float(cue.get("startOffsetSeconds", 0)) * duration_scale
                        cue["durationSeconds"] = float(cue.get("durationSeconds", 0)) * duration_scale
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
                intense_allowed = (
                    scene_durations[i] >= FFMPEG_CONSTANTS.COMFORT_MIN_INTENSE_DURATION
                    and i - last_intense_effect_index >= FFMPEG_CONSTANTS.COMFORT_EFFECT_COOLDOWN_SCENES
                )
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
                disruptive_allowed = (
                    scene_durations[i] >= FFMPEG_CONSTANTS.COMFORT_MIN_INTENSE_DURATION
                    and i - last_disruptive_transition_index >= FFMPEG_CONSTANTS.COMFORT_EFFECT_COOLDOWN_SCENES
                )
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
            print(json.dumps({"progress": progress}), flush=True)

        def render_scene(i):
            nonlocal completed_scene_count
            idx = str(i).zfill(FFMPEG_CONSTANTS.INDEX_PADDING)
            scene_id = scenes[i].get("id") or idx
            diagnostic_path = os.path.join(tempDir, f"scene_{idx}_ffmpeg.log")
            outPath = os.path.join(tempDir, FFMPEG_CONSTANTS.PART_FILE_TEMPLATE.format(idx))
            mediaPath = scene_media_paths[i]
            audioPath = scene_audio_paths[i]
            duration = scene_durations[i]
            is_video = scene_is_video[i]
            scene_trim_start = max(0.0, float(scenes[i].get("sourceTrimStartSeconds", video_trim_start) or 0))
            scene_trim_end = max(0.0, float(scenes[i].get("sourceTrimEndSeconds", video_trim_end) or 0))
            scene_source_crop = str(scenes[i].get("sourceCrop") or "").strip()
            use_embedded_audio = preserve_video_audio and is_video and media_has_audio_stream(ffmpegCmd, mediaPath)
            
            fade_dur = min(0.5, duration / 3.0)
            fade_dur = max(fade_dur, 0.15)
            
            transition_dur = min(0.65, duration / 4.0) if i < len(scenes) - 1 else 0
            
            total_frames = math.ceil(duration * fps)
            actual_duration = total_frames / fps
            
            if is_video:
                cmd = [ffmpegCmd, "-y", "-i", mediaPath]
            else:
                cmd = [ffmpegCmd, "-y", "-loop", "1", "-i", mediaPath]
            
            if use_embedded_audio:
                # Match production-sound loudness per generated take before
                # concatenation so quiet ambience and clipped action clips do
                # not jump tens of decibels at edit points. Do not fade every
                # generated take: repeated fades expose the 10-second clip
                # boundaries and destroy continuous dialogue/room tone.
                # Native audio must use exactly the same source interval as
                # picture. Fading unknown speech at either edge loses words.
                embedded_audio_filters = [
                    f"atrim=start={scene_trim_start}:duration={duration}",
                    "asetpts=PTS-STARTPTS",
                    "loudnorm=I=-20:TP=-2:LRA=11",
                ]
                af_effect = ",".join(embedded_audio_filters)
            elif audioPath:
                cmd.extend(["-i", audioPath])
                audio_filters = []
                if i == 0:
                    audio_filters.append(f"afade=t=in:st=0:d={fade_dur}")
                if i == len(scenes) - 1:
                    audio_filters.append(f"afade=t=out:st={max(0, duration-fade_dur)}:d={fade_dur}")
                af_effect = ",".join(audio_filters) if audio_filters else "anull"
            else:
                cmd.extend(["-f", "lavfi", "-i", FFMPEG_CONSTANTS.ANULLSRC])
                af_effect = "anull"
            
            if i == 0:
                vf_effect = FFMPEG_CONSTANTS.FADE_IN_BLACK.format(fade_dur)
            elif i == len(scenes) - 1:
                vf_effect = FFMPEG_CONSTANTS.FADE_OUT_BLACK.format(max(0, duration-fade_dur), fade_dur)
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
                    video_filter_parts.append(f"crop={scene_source_crop}")
                video_filter_parts.extend([
                    FFMPEG_CONSTANTS.VIDEO_SCALE_FILTER.format(width, height, fps),
                    vf_effect,
                ])
                video_filter = ",".join(video_filter_parts)
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
                        "sceneId": scene_id,
                        "duration": actual_duration,
                        "isVideo": is_video,
                        "width": width,
                        "height": height,
                        "fps": fps,
                        "bitrate": bitrate,
                        "videoFilter": video_filter,
                        "audioFilter": af_effect,
                        "hasAudio": bool(audioPath) or use_embedded_audio,
                        "safeProfile": safe_profile,
                    },
                )
                cache_path = os.path.join(scene_cache_dir, f"{scene_id}_{cache_key}.mp4")
                if os.path.exists(cache_path) and os.path.getsize(cache_path) > FFMPEG_CONSTANTS.SCENE_CACHE_MIN_BYTES:
                    shutil.copy2(cache_path, outPath)
                    with progress_lock:
                        completed_scene_count += 1
                        emit_progress(max(1, round(completed_scene_count * 90 / len(scenes))))
                    return FFMPEG_CONSTANTS.CONCAT_PREFIX.format(idx)

            audio_input_index = "0:a:0" if use_embedded_audio else "1:a:0"
            cmd.extend([
                "-map", "0:v:0",
                "-map", audio_input_index,
                "-c:v", FFMPEG_CONSTANTS.LIBX264, "-b:v", bitrate,
                "-preset", FFMPEG_CONSTANTS.SLOW,
                "-profile:v", FFMPEG_CONSTANTS.HIGH, "-level", "4.1",
                "-pix_fmt", FFMPEG_CONSTANTS.YUV420P,
                "-c:a", FFMPEG_CONSTANTS.AAC, "-b:a", "128k",
                "-vf", video_filter,
                "-af", af_effect,
                "-t", str(actual_duration),
                outPath
            ])

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

            with open(diagnostic_path, "w", encoding=FFMPEG_CONSTANTS.UTF8) as diagnostic_file:
                diagnostic_file.write(stderr_text[-MAX_DIAGNOSTIC_BYTES:])

            if return_code != 0:
                diagnostic = " ".join(stderr_text.strip().splitlines()[-6:])
                raise Exception(FFMPEG_CONSTANTS.PART_ERROR_TEMPLATE.format(scene_id, return_code, diagnostic))

            if cache_path:
                temporary_cache_path = f"{cache_path}.{threading.get_ident()}.tmp"
                try:
                    shutil.copy2(outPath, temporary_cache_path)
                    os.replace(temporary_cache_path, cache_path)
                    for cached_name in os.listdir(scene_cache_dir):
                        if cached_name.startswith(f"{scene_id}_") and cached_name != os.path.basename(cache_path):
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
            
        listPath = os.path.join(tempDir, "list.txt")
        with open(listPath, "w", encoding=FFMPEG_CONSTANTS.UTF8) as f:
            f.write("\n".join(videoParts))
            
        assetsDir = os.path.dirname(finalOutputPath)
        if not os.path.exists(assetsDir):
            os.makedirs(assetsDir, exist_ok=True)
            
        tempFinalPath = os.path.join(tempDir, "temp_final.mp4")
        concatCmd = [ffmpegCmd, "-y", "-f", FFMPEG_CONSTANTS.CONCAT_FORMAT, "-safe", "0", "-i", listPath, "-c", FFMPEG_CONSTANTS.COPY_CODEC, tempFinalPath]
        subprocess.run(concatCmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        emit_progress(94)
        
        subtitle_mode = config.get(FFMPEG_CONSTANTS.KEY_SUBTITLE_MODE, FFMPEG_CONSTANTS.SUBTITLE_MODE_BURN_IN)
        subtitle_path = create_subtitle_file(tempDir, scenes, scene_durations)
        audio_tracks = config.get(FFMPEG_CONSTANTS.KEY_AUDIO_TRACKS, [])
        embedded_audio_present = preserve_video_audio and any(
            scene_is_video[index] and media_has_audio_stream(ffmpegCmd, scene_media_paths[index])
            for index in range(len(scene_media_paths))
        )
        scene_audio_present = any(scene_audio_paths) or embedded_audio_present
        expected_output_duration = sum(scene_durations)
        auto_music_profile = config.get("autoMusicProfile")
        has_music_track = any(track.get("type") == "music" for track in audio_tracks)
        if auto_music_profile and not has_music_track:
            automatic_music_path = create_automatic_music_bed(
                ffmpegCmd, tempDir, expected_output_duration, auto_music_profile,
            )
            if automatic_music_path:
                automatic_fade_seconds = min(2.0, expected_output_duration / 4.0)
                audio_tracks.append({
                    "id": "automatic_music_bed", "type": "music",
                    "assetPath": automatic_music_path, "startSeconds": 0,
                    "durationSeconds": expected_output_duration, "volumeDb": 0,
                    "loop": False, "fadeInSeconds": automatic_fade_seconds,
                    "fadeOutSeconds": automatic_fade_seconds,
                })
        if globalAudioPath and os.path.exists(globalAudioPath):
            global_audio_duration = get_media_duration(ffmpegCmd, globalAudioPath)
            if global_audio_duration > FFMPEG_CONSTANTS.ZERO_SECONDS:
                expected_output_duration = global_audio_duration
            auto_music_profile = config.get("autoMusicProfile")
            has_music_track = any(track.get("type") == "music" for track in audio_tracks)
            if auto_music_profile and not has_music_track:
                automatic_music_path = create_automatic_music_bed(
                    ffmpegCmd,
                    tempDir,
                    expected_output_duration,
                    auto_music_profile,
                )
                if automatic_music_path:
                    automatic_fade_seconds = min(2.0, expected_output_duration / 4.0)
                    audio_tracks.append({
                        "id": "automatic_music_bed",
                        "type": "music",
                        "assetPath": automatic_music_path,
                        "startSeconds": 0,
                        "durationSeconds": expected_output_duration,
                        # The generated bed is already normalized to -31 LUFS,
                        # approximately 15 LU below narration; do not attenuate it twice.
                        "volumeDb": 0,
                        "loop": False,
                        "fadeInSeconds": automatic_fade_seconds,
                        "fadeOutSeconds": automatic_fade_seconds,
                    })
            has_sound_effect_track = any(track.get("type") == "sfx" for track in audio_tracks)
            if auto_music_profile and not has_sound_effect_track:
                automatic_accent_path = create_automatic_accent_track(
                    ffmpegCmd,
                    tempDir,
                    scenes,
                    auto_music_profile,
                )
                if automatic_accent_path:
                    audio_tracks.append({
                        "id": "automatic_editorial_accents",
                        "type": "sfx",
                        "assetPath": automatic_accent_path,
                        "startSeconds": 0,
                        "durationSeconds": expected_output_duration,
                        "volumeDb": -6,
                        "loop": False,
                        "fadeInSeconds": 0,
                        "fadeOutSeconds": 0,
                    })
            mergeAudioCmd = [
                ffmpegCmd, "-y", "-i", tempFinalPath, "-i", globalAudioPath,
            ]
            for track in audio_tracks:
                if track.get("loop"):
                    mergeAudioCmd.extend(["-stream_loop", "-1"])
                mergeAudioCmd.extend(["-i", track.get("assetPath")])
            subtitle_input_index = add_subtitle_input(
                mergeAudioCmd,
                subtitle_path,
                2 + len(audio_tracks),
            )
            mix_filters = []
            mix_inputs = ["[1:a]"]
            for track_index, track in enumerate(audio_tracks):
                input_index = track_index + 2
                delay_milliseconds = max(0, round(float(track.get("startSeconds", 0)) * 1000))
                track_duration = float(track.get("durationSeconds", expected_output_duration))
                fade_in_seconds = min(max(0, float(track.get("fadeInSeconds", 0))), track_duration)
                fade_out_seconds = min(max(0, float(track.get("fadeOutSeconds", 0))), track_duration)
                filters = [
                    FFMPEG_CONSTANTS.AUDIO_TRACK_TRIM_FILTER.format(track_duration),
                    FFMPEG_CONSTANTS.AUDIO_TRACK_VOLUME_FILTER.format(float(track.get("volumeDb", -18))),
                ]
                if fade_in_seconds > FFMPEG_CONSTANTS.ZERO_SECONDS:
                    filters.append(FFMPEG_CONSTANTS.AUDIO_TRACK_FADE_IN_FILTER.format(fade_in_seconds))
                if fade_out_seconds > FFMPEG_CONSTANTS.ZERO_SECONDS:
                    filters.append(FFMPEG_CONSTANTS.AUDIO_TRACK_FADE_OUT_FILTER.format(
                        max(0, track_duration - fade_out_seconds),
                        fade_out_seconds,
                    ))
                filters.append(FFMPEG_CONSTANTS.AUDIO_TRACK_DELAY_FILTER.format(delay_milliseconds))
                prepared_label = f"prepared{track_index}"
                output_label = f"mix{track_index}"
                mix_filters.append(f"[{input_index}:a]{','.join(filters)}[{prepared_label}]")
                mix_filters.append(f"[{prepared_label}]anull[{output_label}]")
                mix_inputs.append(f"[{output_label}]")
            if mix_filters:
                mix_filters.append(f"{''.join(mix_inputs)}{FFMPEG_CONSTANTS.AUDIO_MIX_FILTER.format(len(mix_inputs))}[mixed]")
                mergeAudioCmd.extend(["-filter_complex", ";".join(mix_filters), "-map", "0:v:0", "-map", "[mixed]"])
            else:
                mergeAudioCmd.extend(["-map", "0:v:0", "-map", "1:a:0", "-af", "loudnorm=I=-16:TP=-1:LRA=7"])
            mergeAudioCmd.extend(["-c:a", FFMPEG_CONSTANTS.AAC, "-ar", "48000"])
            if subtitle_input_index is not None:
                add_subtitle_output(mergeAudioCmd, subtitle_path, subtitle_mode, subtitle_input_index)
            else:
                mergeAudioCmd.extend(["-c:v", FFMPEG_CONSTANTS.COPY_CODEC])
            if global_audio_duration > FFMPEG_CONSTANTS.ZERO_SECONDS:
                mergeAudioCmd.extend(["-t", str(global_audio_duration)])
            mergeAudioCmd.extend(["-shortest", finalOutputPath])
            subprocess.run(mergeAudioCmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, cwd=tempDir)
        else:
            if os.path.exists(finalOutputPath):
                os.remove(finalOutputPath)
            if scene_audio_present:
                normalizeAudioCmd = [
                    ffmpegCmd, "-y", "-i", tempFinalPath,
                ]
                for track in audio_tracks:
                    if track.get("loop"):
                        normalizeAudioCmd.extend(["-stream_loop", "-1"])
                    normalizeAudioCmd.extend(["-i", track.get("assetPath")])
                subtitle_input_index = add_subtitle_input(normalizeAudioCmd, subtitle_path, 1 + len(audio_tracks))
                if audio_tracks:
                    film_mix_filters = []
                    film_mix_inputs = ["[0:a]"]
                    for track_index, track in enumerate(audio_tracks):
                        input_index = track_index + 1
                        delay_ms = max(0, round(float(track.get("startSeconds", 0)) * 1000))
                        volume_db = float(track.get("volumeDb", -18))
                        label = f"filmmix{track_index}"
                        film_mix_filters.append(f"[{input_index}:a]volume={volume_db}dB,adelay={delay_ms}|{delay_ms}[{label}]")
                        film_mix_inputs.append(f"[{label}]")
                    film_mix_filters.append(f"{''.join(film_mix_inputs)}amix=inputs={len(film_mix_inputs)}:duration=first:dropout_transition=2,loudnorm=I=-16:TP=-1:LRA=7[film_audio]")
                    normalizeAudioCmd.extend(["-filter_complex", ";".join(film_mix_filters), "-map", "0:v:0", "-map", "[film_audio]"])
                else:
                    normalizeAudioCmd.extend(["-map", "0:v:0", "-map", "0:a:0", "-af", "loudnorm=I=-16:TP=-1:LRA=7"])
                normalizeAudioCmd.extend(["-c:a", FFMPEG_CONSTANTS.AAC, "-ar", "48000"])
                if subtitle_input_index is not None:
                    add_subtitle_output(normalizeAudioCmd, subtitle_path, subtitle_mode, subtitle_input_index)
                else:
                    normalizeAudioCmd.extend(["-c:v", FFMPEG_CONSTANTS.COPY_CODEC])
                normalizeAudioCmd.append(finalOutputPath)
                subprocess.run(normalizeAudioCmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, cwd=tempDir)
            else:
                if subtitle_path:
                    subtitle_cmd = [ffmpegCmd, "-y", "-i", tempFinalPath, "-i", subtitle_path, "-map", "0:v:0"]
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
        print(json.dumps({FFMPEG_CONSTANTS.OUTPUT_SUCCESS: True, "url": finalOutputUrl}))
        
    except Exception as e:
        print(json.dumps({FFMPEG_CONSTANTS.OUTPUT_SUCCESS: False, "error": str(e), "traceback": traceback.format_exc()}))
        sys.exit(1)

if __name__ == "__main__":
    main()
