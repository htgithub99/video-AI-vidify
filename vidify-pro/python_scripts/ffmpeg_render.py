import sys
import json
import os
import base64
import subprocess
import traceback
import math
import random
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

    COLOR_BLACK_RGB = (0, 0, 0)
    COLOR_WHITE_RGB = (255, 255, 255)
    COLOR_FOG_RGB = (200, 200, 200)
    COLOR_COLD_TINT_RGB = (100, 140, 240)
    COLOR_WARM_TINT_RGB = (255, 200, 150)
    COLOR_GLOW_TINT_RGB = (255, 140, 0)

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
    ease_linear,
    ease_linear,
    ease_linear,
    ease_linear,
    ease_linear,
    ease_linear,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_linear,
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
            glow_overlay = Image.new("RGB", (w, h), FFMPEG_CONSTANTS.COLOR_BLACK_RGB)
            draw = ImageDraw.Draw(glow_overlay)
            glow_r = int(max(w, h) * 0.4)
            oscillation = math.sin(frame_index / max(total_frames, 1) * math.pi)
            glow_r = int(glow_r * (0.9 + 0.2 * oscillation))
            for r in range(glow_r, 0, -20):
                draw.ellipse([-r, -r, r, r], fill=FFMPEG_CONSTANTS.COLOR_GLOW_TINT_RGB)
            frame = Image.blend(frame, glow_overlay, 0.15)
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
            
        if random.random() < 0.15:
            try:
                band_h = int(h * 0.08)
                band_y = random.randint(0, h - band_h)
                shift_x = random.randint(-15, 15)
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

    return frame

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
        x0 = x_max * t_smooth
    elif style == 3:
        z = 1.06
        w_crop = width / z
        h_crop = height / z
        y0 = (h_new - h_crop) / 2.0
        x_max = w_new - w_crop
        x0 = x_max * (1.0 - t_smooth)
    elif style == 4:
        z = 1.06
        w_crop = width / z
        h_crop = height / z
        x0 = (w_new - w_crop) / 2.0
        y_max = h_new - h_crop
        y0 = y_max * (1.0 - t_smooth)
    elif style == 5:
        z = 1.06
        w_crop = width / z
        h_crop = height / z
        x0 = (w_new - w_crop) / 2.0
        y_max = h_new - h_crop
        y0 = y_max * t_smooth
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
        z = 1.03 + 0.03 * math.sin(t_smooth * math.pi)
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        drift_x = 0.5 + 0.1 * math.sin(t_smooth * math.pi * 1.5)
        drift_y = 0.5 + 0.1 * math.cos(t_smooth * math.pi * 1.2)
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

    x0 = max(0.0, min(x0, w_new - w_crop))
    y0 = max(0.0, min(y0, h_new - h_crop))
    x1 = x0 + w_crop
    y1 = y0 + h_crop
    return x0, y0, x1, y1

def write_ken_burns_frames_to_pipe(image_path, width, height, duration, fps, style_index, effects_str, proc):
    try:
        img = Image.open(image_path)
    except Exception:
        img = Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), color=FFMPEG_CONSTANTS.BLACK_COLOR)
        
    img = img.convert(FFMPEG_CONSTANTS.RGB_MODE)
    w_orig, h_orig = img.size
    
    scale_factor = max(width / w_orig, height / h_orig) * 1.08
    w_new = float(w_orig * scale_factor)
    h_new = float(h_orig * scale_factor)
    
    img_resized = img.resize((int(w_new), int(h_new)), Image.Resampling.BILINEAR)
    total_frames = int(duration * fps)
    style = style_index % 13
    
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
                    bright_factor = 1.0 + t_smooth * 4.0
                    enhancer = ImageEnhance.Brightness(img_a)
                    frame = enhancer.enhance(bright_factor)
                else:
                    bright_factor = 1.0 + (1.0 - t_smooth) * 4.0
                    enhancer = ImageEnhance.Brightness(img_b)
                    frame = enhancer.enhance(bright_factor)
                    
            elif transition_type == FFMPEG_CONSTANTS.TRANS_ZOOM:
                if t_smooth < 0.5:
                    zoom = 1.0 + t_smooth * 2.0
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
                    zoom = 1.0 + (1.0 - t_smooth) * 2.0
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
        
    random.seed()
    available_styles = [x for x in range(num_styles) if x != prev_style]
    return random.choice(available_styles)

def get_transition_type(scene_index, scene_transition=None, prev_transition_type=None):
    if scene_transition:
        transition_lower = scene_transition.lower().strip()
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
    
    random.seed()
    options = [
        FFMPEG_CONSTANTS.TRANS_CROSS,
        FFMPEG_CONSTANTS.TRANS_BLUR,
        FFMPEG_CONSTANTS.TRANS_BRIGHT,
        FFMPEG_CONSTANTS.TRANS_ZOOM,
        FFMPEG_CONSTANTS.TRANS_SLIDE,
        FFMPEG_CONSTANTS.TRANS_SLIDE_UP,
        FFMPEG_CONSTANTS.TRANS_FADE_BLACK,
        FFMPEG_CONSTANTS.TRANS_FADE_WHITE
    ]
    if prev_transition_type in options:
        options = [opt for opt in options if opt != prev_transition_type]
    return random.choice(options)

def get_last_frame_from_scene(image_path, width, height, duration, fps, style_index, effects_str):
    try:
        img = Image.open(image_path)
    except Exception:
        return Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), color=FFMPEG_CONSTANTS.BLACK_COLOR)
    
    img = img.convert(FFMPEG_CONSTANTS.RGB_MODE)
    w_orig, h_orig = img.size
    
    scale_factor = max(width / w_orig, height / h_orig) * 1.08
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
    return final

def get_first_frame_from_scene(image_path, width, height, style_index, effects_str):
    try:
        img = Image.open(image_path)
    except Exception:
        return Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), color=FFMPEG_CONSTANTS.BLACK_COLOR)
    
    img = img.convert(FFMPEG_CONSTANTS.RGB_MODE)
    w_orig, h_orig = img.size
    scale_factor = max(width / w_orig, height / h_orig) * 1.08
    w_new = float(w_orig * scale_factor)
    h_new = float(h_orig * scale_factor)
    img_resized = img.resize((int(w_new), int(h_new)), Image.Resampling.BILINEAR)
    
    style = style_index % 13
    easing_fn = EASING_FUNCTIONS[style]
    t_smooth = easing_fn(0.0)
    
    x0, y0, x1, y1 = get_crop_coordinates(style, t_smooth, w_new, h_new, width, height)
    final = img_resized.transform((width, height), Image.Transform.EXTENT, (x0, y0, x1, y1), resample=Image.Resampling.BILINEAR)
    
    final = apply_visual_effects(final, effects_str, 0, 100)
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
        width = config.get("width", 1280)
        height = config.get("height", 720)
        fps = config.get("fps", 30)
        bitrate = config.get("bitrate", "2500k")
        finalOutputPath = config.get("finalOutputPath")
        finalOutputUrl = config.get("finalOutputUrl")
        scenes = config.get("scenes", [])
        
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
        
        for i, scene in enumerate(scenes):
            idx = str(i).zfill(3)
            is_video = scene.get("assetType") == FFMPEG_CONSTANTS.ASSET_VIDEO
            media_extension = FFMPEG_CONSTANTS.VIDEO_EXTENSION if is_video else FFMPEG_CONSTANTS.IMAGE_EXTENSION
            mediaPath = os.path.join(tempDir, f"media_{idx}{media_extension}")
            audioPath = os.path.join(tempDir, f"audio_{idx}.mp3")
            
            img_b64 = scene.get("imageBase64")
            audio_b64 = scene.get("audioBase64")
            duration = scene.get("duration", 5)
            transition = scene.get("transition", "")
            
            if img_b64:
                img_data = clean_base64(img_b64)
                with open(mediaPath, "wb") as f:
                    f.write(base64.b64decode(img_data))
            else:
                is_video = False
                mediaPath = os.path.join(tempDir, f"media_{idx}{FFMPEG_CONSTANTS.IMAGE_EXTENSION}")
                Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), color=FFMPEG_CONSTANTS.BLACK_COLOR).save(mediaPath, FFMPEG_CONSTANTS.JPEG_FORMAT)
            
            hasAudio = False
            if audio_b64:
                audio_data = clean_base64(audio_b64)
                with open(audioPath, "wb") as f:
                    f.write(base64.b64decode(audio_data))
                hasAudio = True
            
            scene_media_paths.append(mediaPath)
            scene_is_video.append(is_video)
            scene_audio_paths.append(audioPath if hasAudio else None)
            scene_durations.append(duration)
            scene_transitions.append(transition)

        chosen_styles = []
        chosen_transitions = []
        prev_style = -1
        prev_trans = None

        for i, scene in enumerate(scenes):
            camera_motion = scene.get("cameraMotion", "")
            style_idx = map_motion_to_style(camera_motion, i, prev_style, num_styles=12)
            chosen_styles.append(style_idx)
            if style_idx != 12:
                prev_style = style_idx

            transition_meta = scene_transitions[i]
            trans_type = get_transition_type(i, transition_meta, prev_trans)
            if scene_is_video[i] or (i + 1 < len(scenes) and scene_is_video[i + 1]):
                trans_type = FFMPEG_CONSTANTS.TRANS_CUT
            chosen_transitions.append(trans_type)
            prev_trans = trans_type

        for i in range(len(scenes)):
            idx = str(i).zfill(3)
            outPath = os.path.join(tempDir, f"part_{idx}.mp4")
            mediaPath = scene_media_paths[i]
            audioPath = scene_audio_paths[i]
            duration = scene_durations[i]
            is_video = scene_is_video[i]
            
            fade_dur = min(0.5, duration / 3.0)
            fade_dur = max(fade_dur, 0.15)
            
            transition_dur = min(0.5, duration / 4.0) if i < len(scenes) - 1 else 0
            
            total_frames = int(duration * fps)
            transition_frames = max(int(transition_dur * fps), 2) if (transition_dur > 0 and i < len(scenes) - 1 and chosen_transitions[i] != FFMPEG_CONSTANTS.TRANS_CUT) else 0
            actual_duration = (total_frames + transition_frames) / fps
            
            if is_video:
                cmd = [ffmpegCmd, "-y", "-stream_loop", "-1", "-i", mediaPath]
            else:
                cmd = [
                    ffmpegCmd, "-y",
                    "-f", FFMPEG_CONSTANTS.RAW_VIDEO,
                    "-pix_fmt", FFMPEG_CONSTANTS.RGB24,
                    "-s", f"{width}x{height}",
                    "-r", str(fps),
                    "-i", "-"
                ]
            
            if audioPath:
                cmd.extend(["-i", audioPath])
                af_effect = FFMPEG_CONSTANTS.AFADE.format(fade_dur, max(0, duration-fade_dur))
            else:
                cmd.extend(["-f", "lavfi", "-i", FFMPEG_CONSTANTS.ANULLSRC])
                af_effect = FFMPEG_CONSTANTS.AFADE.format(fade_dur, max(0, duration-fade_dur))
            
            if i == 0:
                vf_effect = FFMPEG_CONSTANTS.FADE_IN_BLACK.format(fade_dur)
            elif i == len(scenes) - 1:
                vf_effect = FFMPEG_CONSTANTS.FADE_OUT_BLACK.format(max(0, duration-fade_dur), fade_dur)
            else:
                vf_effect = FFMPEG_CONSTANTS.NULL_EFFECT
            
            video_filter = vf_effect
            if is_video:
                video_filter = ",".join([
                    FFMPEG_CONSTANTS.VIDEO_SCALE_FILTER.format(width, height, fps),
                    vf_effect,
                ])

            cmd.extend([
                "-map", "0:v:0",
                "-map", "1:a:0",
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

            if is_video:
                completed = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                return_code = completed.returncode
            else:
                proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

                write_ken_burns_frames_to_pipe(mediaPath, width, height, duration, fps, chosen_styles[i], scenes[i].get("effects", ""), proc)

                if transition_dur > 0 and i < len(scenes) - 1:
                    transition_type = chosen_transitions[i]

                    if transition_type != FFMPEG_CONSTANTS.TRANS_CUT:
                        img_prev = get_last_frame_from_scene(mediaPath, width, height, duration, fps, chosen_styles[i], scenes[i].get("effects", ""))
                        img_next = get_first_frame_from_scene(scene_media_paths[i + 1], width, height, chosen_styles[i + 1], scenes[i + 1].get("effects", ""))

                        generate_crossfade_frames(
                            img_prev, img_next,
                            width, height, fps,
                            transition_dur, transition_type, proc
                        )

                proc.stdin.close()
                proc.wait()
                return_code = proc.returncode

            if return_code != 0:
                raise Exception(f"FFmpeg part generation failed with code {return_code}")
                
            videoParts.append(FFMPEG_CONSTANTS.CONCAT_PREFIX.format(idx))
            
            try:
                os.remove(mediaPath)
            except:
                pass
            if audioPath:
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
        subprocess.run(concatCmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        globalAudioPath = config.get("globalAudioPath")
        if globalAudioPath and os.path.exists(globalAudioPath):
            mergeAudioCmd = [
                ffmpegCmd, "-y", "-i", tempFinalPath, "-i", globalAudioPath,
                "-map", "0:v:0", "-map", "1:a:0",
                "-c:v", FFMPEG_CONSTANTS.COPY_CODEC, "-c:a", FFMPEG_CONSTANTS.AAC, "-shortest", finalOutputPath
            ]
            subprocess.run(mergeAudioCmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            if os.path.exists(finalOutputPath):
                os.remove(finalOutputPath)
            os.rename(tempFinalPath, finalOutputPath)
        
        print(json.dumps({FFMPEG_CONSTANTS.OUTPUT_SUCCESS: True, "url": finalOutputUrl}))
        
    except Exception as e:
        print(json.dumps({FFMPEG_CONSTANTS.OUTPUT_SUCCESS: False, "error": str(e), "traceback": traceback.format_exc()}))
        sys.exit(1)

if __name__ == "__main__":
    main()
