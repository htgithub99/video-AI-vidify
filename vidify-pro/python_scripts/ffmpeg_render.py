import sys
import json
import os
import base64
import subprocess
import traceback
import math
import random
from PIL import Image, ImageFilter, ImageEnhance

class FFMPEG_CONSTANTS:
    RGB24 = "rgb24"
    RAW_VIDEO = "rawvideo"
    LIBX264 = "libx264"
    SLOW = "slow"
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
    TRANS_CUT = "cut"

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

EASING_FUNCTIONS = [
    ease_cubic_in_out,
    ease_quart_out,
    ease_sine_in_out,
    ease_sine_in_out,
    ease_cubic_in_out,
    ease_cubic_in_out,
    ease_expo_out,
    ease_back_out,
    ease_quart_out,
    ease_sine_in_out,
    ease_expo_out,
    ease_cubic_in_out,
    ease_sine_in_out,
]

def get_crop_coordinates(style, t_smooth, w_new, h_new, width, height):
    z = 1.0
    w_crop = width
    h_crop = height
    x0 = (w_new - w_crop) / 2.0
    y0 = (h_new - h_crop) / 2.0

    if style == 0:
        z = 1.0 + 0.22 * t_smooth
        w_crop = width / z
        h_crop = height / z
        x0 = (w_new - w_crop) / 2.0
        y0 = (h_new - h_crop) / 2.0
    elif style == 1:
        z = 1.22 - 0.22 * t_smooth
        w_crop = width / z
        h_crop = height / z
        x0 = (w_new - w_crop) / 2.0
        y0 = (h_new - h_crop) / 2.0
    elif style == 2:
        z = 1.12
        w_crop = width / z
        h_crop = height / z
        y0 = (h_new - h_crop) / 2.0
        x_max = w_new - w_crop
        x0 = x_max * t_smooth
    elif style == 3:
        z = 1.12
        w_crop = width / z
        h_crop = height / z
        y0 = (h_new - h_crop) / 2.0
        x_max = w_new - w_crop
        x0 = x_max * (1.0 - t_smooth)
    elif style == 4:
        z = 1.12
        w_crop = width / z
        h_crop = height / z
        x0 = (w_new - w_crop) / 2.0
        y_max = h_new - h_crop
        y0 = y_max * (1.0 - t_smooth)
    elif style == 5:
        z = 1.12
        w_crop = width / z
        h_crop = height / z
        x0 = (w_new - w_crop) / 2.0
        y_max = h_new - h_crop
        y0 = y_max * t_smooth
    elif style == 6:
        z = 1.15
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        x0 = x_max * t_smooth
        y0 = y_max * t_smooth
    elif style == 7:
        z = 1.15
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        x0 = x_max * t_smooth
        y0 = y_max * (1.0 - t_smooth)
    elif style == 8:
        z = 1.0 + 0.18 * t_smooth
        arc_phase = math.sin(t_smooth * math.pi)
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        x0 = x_max * (0.2 + 0.6 * t_smooth)
        y0 = y_max * (0.5 - 0.3 * arc_phase)
    elif style == 9:
        z = 1.08 + 0.06 * math.sin(t_smooth * math.pi)
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        drift_x = 0.5 + 0.3 * math.sin(t_smooth * math.pi * 1.5)
        drift_y = 0.5 + 0.2 * math.cos(t_smooth * math.pi * 1.2)
        x0 = x_max * drift_x
        y0 = y_max * drift_y
    elif style == 10:
        z = 1.0 + 0.30 * t_smooth
        w_crop = width / z
        h_crop = height / z
        x_max = w_new - w_crop
        y_max = h_new - h_crop
        x0 = x_max * (0.5 + 0.15 * t_smooth)
        y0 = y_max * (0.5 - 0.1 * t_smooth)
    elif style == 11:
        z = 1.20 - 0.15 * t_smooth
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

def write_ken_burns_frames_to_pipe(image_path, width, height, duration, fps, style_index, proc):
    try:
        img = Image.open(image_path)
    except Exception:
        img = Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), color=FFMPEG_CONSTANTS.BLACK_COLOR)
        
    img = img.convert(FFMPEG_CONSTANTS.RGB_MODE)
    w_orig, h_orig = img.size
    
    scale_factor = max(width / w_orig, height / h_orig) * 1.25
    w_new = float(w_orig * scale_factor)
    h_new = float(h_orig * scale_factor)
    
    img_resized = img.resize((int(w_new), int(h_new)), Image.Resampling.LANCZOS)
    total_frames = int(duration * fps)
    style = style_index % 13
    
    if style == 12:
        x0, y0, x1, y1 = get_crop_coordinates(style, 1.0, w_new, h_new, width, height)
        final_frame = img_resized.transform(
            (width, height),
            Image.Transform.EXTENT,
            (x0, y0, x1, y1),
            resample=Image.Resampling.BICUBIC
        )
        frame_bytes = final_frame.tobytes()
        try:
            for _ in range(total_frames):
                proc.stdin.write(frame_bytes)
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
                resample=Image.Resampling.BICUBIC
            )
            proc.stdin.write(final_frame.tobytes())
    except BrokenPipeError:
        pass

def generate_crossfade_frames(img_prev, img_next, width, height, fps, transition_dur, transition_type, proc):
    total_frames = max(int(transition_dur * fps), 2)
    
    img_a = img_prev.resize((width, height), Image.Resampling.LANCZOS).convert(FFMPEG_CONSTANTS.RGB_MODE)
    img_b = img_next.resize((width, height), Image.Resampling.LANCZOS).convert(FFMPEG_CONSTANTS.RGB_MODE)
    
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
                    frame = frame.resize((width, height), Image.Resampling.BICUBIC)
                    alpha = (t_smooth - 0.3) * 5.0 if t_smooth > 0.3 else 0
                    alpha = min(alpha, 1.0)
                    white = Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), (255, 255, 255))
                    frame = Image.blend(frame, white, alpha)
                else:
                    zoom = 1.0 + (1.0 - t_smooth) * 2.0
                    crop_w = int(width / zoom)
                    crop_h = int(height / zoom)
                    left = (width - crop_w) // 2
                    top = (height - crop_h) // 2
                    frame = img_b.crop((left, top, left + crop_w, top + crop_h))
                    frame = frame.resize((width, height), Image.Resampling.BICUBIC)
                    alpha = (0.7 - t_smooth) * 5.0 if t_smooth < 0.7 else 0
                    alpha = max(min(alpha, 1.0), 0)
                    white = Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), (255, 255, 255))
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
        elif "dissolve" in transition_lower or "cross" in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_CROSS
        elif "blur" in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_BLUR
        elif "bright" in transition_lower or "white" in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_BRIGHT
        elif "zoom" in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_ZOOM
        elif "slide" in transition_lower or "wipe" in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_SLIDE
        elif "fade" in transition_lower and "black" in transition_lower:
            return FFMPEG_CONSTANTS.TRANS_FADE_BLACK
    
    random.seed()
    options = [
        FFMPEG_CONSTANTS.TRANS_CROSS,
        FFMPEG_CONSTANTS.TRANS_BLUR,
        FFMPEG_CONSTANTS.TRANS_BRIGHT,
        FFMPEG_CONSTANTS.TRANS_ZOOM,
        FFMPEG_CONSTANTS.TRANS_SLIDE
    ]
    if prev_transition_type in options:
        options = [opt for opt in options if opt != prev_transition_type]
    return random.choice(options)

def get_last_frame_from_scene(image_path, width, height, duration, fps, style_index):
    try:
        img = Image.open(image_path)
    except Exception:
        return Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), color=FFMPEG_CONSTANTS.BLACK_COLOR)
    
    img = img.convert(FFMPEG_CONSTANTS.RGB_MODE)
    w_orig, h_orig = img.size
    
    scale_factor = max(width / w_orig, height / h_orig) * 1.25
    w_new = float(w_orig * scale_factor)
    h_new = float(h_orig * scale_factor)
    img_resized = img.resize((int(w_new), int(h_new)), Image.Resampling.LANCZOS)
    
    style = style_index % 13
    easing_fn = EASING_FUNCTIONS[style]
    t_smooth = easing_fn(1.0)
    
    x0, y0, x1, y1 = get_crop_coordinates(style, t_smooth, w_new, h_new, width, height)
    final = img_resized.transform((width, height), Image.Transform.EXTENT, (x0, y0, x1, y1), resample=Image.Resampling.BICUBIC)
    return final

def get_first_frame_from_scene(image_path, width, height):
    try:
        img = Image.open(image_path)
    except Exception:
        return Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), color=FFMPEG_CONSTANTS.BLACK_COLOR)
    
    img = img.convert(FFMPEG_CONSTANTS.RGB_MODE)
    w_orig, h_orig = img.size
    scale_factor = max(width / w_orig, height / h_orig) * 1.25
    w_new = int(w_orig * scale_factor)
    h_new = int(h_orig * scale_factor)
    img_resized = img.resize((w_new, h_new), Image.Resampling.LANCZOS)
    
    left = (w_new - width) // 2
    top = (h_new - height) // 2
    return img_resized.crop((left, top, left + width, top + height))

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

        scene_img_paths = []
        scene_audio_paths = []
        scene_durations = []
        scene_transitions = []
        
        for i, scene in enumerate(scenes):
            idx = str(i).zfill(3)
            imgPath = os.path.join(tempDir, f"img_{idx}.jpg")
            audioPath = os.path.join(tempDir, f"audio_{idx}.mp3")
            
            img_b64 = scene.get("imageBase64")
            audio_b64 = scene.get("audioBase64")
            duration = scene.get("duration", 5)
            transition = scene.get("transition", "")
            
            if img_b64:
                img_data = clean_base64(img_b64)
                with open(imgPath, "wb") as f:
                    f.write(base64.b64decode(img_data))
            else:
                Image.new(FFMPEG_CONSTANTS.RGB_MODE, (width, height), color=FFMPEG_CONSTANTS.BLACK_COLOR).save(imgPath, FFMPEG_CONSTANTS.JPEG_FORMAT)
            
            hasAudio = False
            if audio_b64:
                audio_data = clean_base64(audio_b64)
                with open(audioPath, "wb") as f:
                    f.write(base64.b64decode(audio_data))
                hasAudio = True
            
            scene_img_paths.append(imgPath)
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
            chosen_transitions.append(trans_type)
            prev_trans = trans_type

        for i in range(len(scenes)):
            idx = str(i).zfill(3)
            outPath = os.path.join(tempDir, f"part_{idx}.mp4")
            imgPath = scene_img_paths[i]
            audioPath = scene_audio_paths[i]
            duration = scene_durations[i]
            
            fade_dur = min(0.5, duration / 3.0)
            fade_dur = max(fade_dur, 0.15)
            
            transition_dur = min(0.5, duration / 4.0) if i < len(scenes) - 1 else 0
            total_scene_dur = duration + transition_dur
            
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
            
            cmd.extend([
                "-map", "0:v:0",
                "-map", "1:a:0",
                "-c:v", FFMPEG_CONSTANTS.LIBX264, "-b:v", bitrate,
                "-preset", FFMPEG_CONSTANTS.SLOW,
                "-profile:v", FFMPEG_CONSTANTS.HIGH, "-level", "4.1",
                "-pix_fmt", FFMPEG_CONSTANTS.YUV420P,
                "-c:a", FFMPEG_CONSTANTS.AAC, "-b:a", "128k",
                "-vf", vf_effect,
                "-af", af_effect,
                "-t", str(total_scene_dur),
                "-shortest", outPath
            ])
            
            proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            write_ken_burns_frames_to_pipe(imgPath, width, height, duration, fps, chosen_styles[i], proc)
            
            if transition_dur > 0 and i < len(scenes) - 1:
                transition_type = chosen_transitions[i]
                
                if transition_type != FFMPEG_CONSTANTS.TRANS_CUT:
                    img_prev = get_last_frame_from_scene(imgPath, width, height, duration, fps, chosen_styles[i])
                    img_next = get_first_frame_from_scene(scene_img_paths[i + 1], width, height)
                    
                    generate_crossfade_frames(
                        img_prev, img_next,
                        width, height, fps,
                        transition_dur, transition_type, proc
                    )
            
            proc.stdin.close()
            proc.wait()
            
            if proc.returncode != 0:
                raise Exception(f"FFmpeg part generation failed with code {proc.returncode}")
                
            videoParts.append(FFMPEG_CONSTANTS.CONCAT_PREFIX.format(idx))
            
            try:
                os.remove(imgPath)
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
