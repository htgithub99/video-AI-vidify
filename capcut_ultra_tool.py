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

ERR_NO_MEDIA = "Không tìm thấy hình ảnh, video hoặc âm thanh trên dòng thời gian!"
ERR_CLI_USAGE = "Cú pháp: python capcut_ultra_tool.py <input_json> <output_json> [opts_json_string] HOẶC python capcut_ultra_tool.py <select-file/select-folder>"
ERR_OPTS_PARSE = "Lỗi phân tích cú pháp tùy chọn JSON: {}"
ERR_GENERIC = "ERROR: {}"

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
            # PNG
            if head.startswith(b'\x89PNG\r\n\x1a\n'):
                import struct
                w, h = struct.unpack('>II', head[16:24])
                return int(w), int(h)
            # GIF
            elif head.startswith(b'GIF87a') or head.startswith(b'GIF89a'):
                import struct
                w, h = struct.unpack('<HH', head[6:10])
                return int(w), int(h)
            # JPEG
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
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read().decode('utf-8'))
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

def process_capcut_ultra(input_json_path, output_json_path, opts):
    print(LOG_START_PROCESS.format(input_json_path))
    print(LOG_OPTS.format(opts))

    with open(input_json_path, READ_MODE, encoding=UTF8_ENCODING) as f:
        data = json.load(f)

    materials = data.setdefault(MATERIALS_ATTR, {})
    videos_mat = materials.setdefault(VIDEOS_ATTR, [])
    audios_mat = materials.setdefault(AUDIOS_ATTR, [])
    transitions_mat = materials.setdefault(TRANSITIONS_ATTR, [])
    
    vid_dict = {m[ID_ATTR]: m for m in videos_mat if m.get(TYPE_ATTR) in [PHOTO_TYPE_KEY, VIDEO_TYPE_KEY]}
    aud_dict = {m[ID_ATTR]: m for m in audios_mat}

    tracks = data.setdefault(TRACKS_ATTR, [])
    
    # Identify video/audio segments on all tracks
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

    # Sort ALL segments by start time initially
    all_video_segments.sort(key=lambda x: x['segment'].get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0))
    all_audio_segments.sort(key=lambda x: x['segment'].get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0))

    # Identify main tracks (for re-sequencing / timeline modifications)
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
    print(LOG_COUNT_PHOTOS.format(num_photos))
    print(LOG_COUNT_AUDIOS.format(num_audios))

    # Check if there is media to operate on
    if len(all_video_segments) == 0 and len(all_audio_segments) == 0:
        raise Exception(ERR_NO_MEDIA)

    # 7. Clear Transitions (Runs first to wipe slate)
    if opts.get('clear_transitions'):
        print(LOG_CLEAR_TRANSITIONS)
        trans_ids = {t['id'] for t in transitions_mat}
        for p_item in all_video_segments:
            seg = p_item['segment']
            if TRANSITION_ATTR in seg:
                del seg[TRANSITION_ATTR]
            if EXTRA_REFS_ATTR in seg:
                seg[EXTRA_REFS_ATTR] = [ref for ref in seg[EXTRA_REFS_ATTR] if ref not in trans_ids]
        transitions_mat.clear()

    # Determine if timeline modifications are requested
    timeline_modifying = any(opts.get(k) for k in ['sync_image_to_audio', 'custom_audio_order', 'randomize_video', 'reverse_timeline'])

    if timeline_modifying:
        if num_photos == 0 or num_audios == 0:
            raise Exception("Không thể thực hiện các thao tác thay đổi timeline do thiếu ảnh/video hoặc âm thanh trên track chính!")

        # 1. Sync Image/Video voice list to match 1-1 length
        if opts.get('sync_image_to_audio'):
            # If we have fewer photos than audios, duplicate the last photo or loop photos
            if num_photos < num_audios and num_photos > 0:
                print(f"-> Số lượng ảnh ({num_photos}) ít hơn âm thanh ({num_audios}). Đang tự động nhân bản ảnh...")
                while len(photo_segments) < num_audios:
                    last_item = photo_segments[-1]
                    new_seg = copy.deepcopy(last_item['segment'])
                    new_seg['id'] = f"dup_photo_{uuid.uuid4().hex[:8]}"
                    main_video_track['segments'].append(new_seg)
                    photo_segments.append({'segment': new_seg, 'material': last_item['material']})
                num_photos = len(photo_segments)
            
            # If we have more photos than audios, truncate extra photos
            elif num_photos > num_audios:
                print(f"-> Số lượng ảnh ({num_photos}) nhiều hơn âm thanh ({num_audios}). Đang cắt bỏ ảnh thừa...")
                extra_photos = photo_segments[num_audios:]
                for item in extra_photos:
                    if item['segment'] in main_video_track['segments']:
                        main_video_track['segments'].remove(item['segment'])
                photo_segments = photo_segments[:num_audios]
                num_photos = len(photo_segments)

        target_count = min(num_photos, num_audios)

        # Group paired tracks and overlapping text overlays into "Unified Scene objects"
        scenes = []
        for i in range(target_count):
            p_item = photo_segments[i]
            a_item = audio_segments[i]
            
            p_seg = p_item['segment']
            p_start = p_seg.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0)
            p_dur = p_seg.get(TARGET_TIMERANGE_ATTR, {}).get(DURATION_ATTR, 0)
            p_end = p_start + p_dur
            
            scene_texts = []
            for text_track in [t for t in tracks if t.get('type') == 'text']:
                for text_seg in text_track.get('segments', []):
                    t_start = text_seg.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0)
                    # If text overlaps with this scene
                    if p_start <= t_start < p_end:
                        scene_texts.append(text_seg)
                        
            scenes.append({
                "photo": p_item,
                "audio": a_item,
                "texts": scene_texts,
                "original_duration": p_dur,
                "original_start": p_start
            })

        # 3. Custom Audio Track Order
        if opts.get('custom_audio_order') and opts.get('audio_order_list'):
            order_str = opts.get('audio_order_list')
            print(LOG_CUSTOM_ORDER.format(order_str))
            keywords = [k.strip().lower() for k in order_str.split(",") if k.strip()]
            
            def get_scene_priority(scene):
                filename = os.path.basename(scene["audio"]['material'].get(PATH_ATTR, "")).lower()
                for index, keyword in enumerate(keywords):
                    if keyword in filename:
                        return index
                return len(keywords)
                
            scenes.sort(key=get_scene_priority)

        # 4. Randomize Video Timeline
        if opts.get('randomize_video'):
            print(LOG_RANDOMIZING)
            random.shuffle(scenes)

        # 10. Reverse Timeline Sequence
        if opts.get('reverse_timeline'):
            print(LOG_REVERSING)
            scenes.reverse()

        # Apply Synchronize sequence timing & properties
        print(LOG_SYNCING.format(target_count))
        current_time = 0
        for i, scene in enumerate(scenes):
            p_item = scene["photo"]
            a_item = scene["audio"]

            p_seg = p_item['segment']
            a_seg = a_item['segment']
            
            audio_path = a_item['material'][PATH_ATTR]
            audio_duration = get_audio_duration_micros(audio_path)
            
            # Audio timings
            a_seg[SOURCE_TIMERANGE_ATTR] = {START_ATTR: 0, DURATION_ATTR: audio_duration}
            a_seg[TARGET_TIMERANGE_ATTR] = {START_ATTR: current_time, DURATION_ATTR: audio_duration}
            a_item['material'][DURATION_ATTR] = audio_duration
            
            # Photo timings
            photo_duration = audio_duration if opts.get('sync_image_to_audio') else scene["original_duration"]
            p_seg[TARGET_TIMERANGE_ATTR] = {START_ATTR: current_time, DURATION_ATTR: photo_duration}
            
            if p_item['material'].get(TYPE_ATTR) == VIDEO_TYPE_KEY:
                p_seg[SOURCE_TIMERANGE_ATTR] = {START_ATTR: 0, DURATION_ATTR: photo_duration}
                p_item['material'][DURATION_ATTR] = photo_duration
            else:
                p_seg[SOURCE_TIMERANGE_ATTR] = {START_ATTR: 0, DURATION_ATTR: photo_duration}

            # Subtitles/Texts timing adjustment
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

            # 8. Auto Scale Fit Canvas
            scale_factor = 1.0
            if opts.get('auto_fill_canvas'):
                canvas_w = 1080
                canvas_h = 1920
                canvas_config = data.get('canvas_config') or data.get('settings', {}).get('canvas_config', {})
                if canvas_config and canvas_config.get('width') and canvas_config.get('height'):
                    canvas_w = canvas_config.get('width')
                    canvas_h = canvas_config.get('height')
                    
                media_path = p_item['material'].get(PATH_ATTR)
                scale_factor = 1.3  # Default safe scale to fill
                dims = get_media_dimensions(media_path)
                if dims:
                    media_w, media_h = dims
                    fit_scale_w = canvas_w / media_w
                    fit_scale_h = canvas_h / media_h
                    fit_scale = min(fit_scale_w, fit_scale_h)
                    fill_scale = max(fit_scale_w, fit_scale_h)
                    if fit_scale > 0:
                        scale_factor = fill_scale / fit_scale
                        scale_factor = max(1.0, min(scale_factor, 4.0))
                
                clip_settings = p_seg.setdefault(CLIP_ATTR, {})
                scale_settings = clip_settings.setdefault(SCALE_ATTR, {})
                scale_settings[X_AXIS] = scale_factor
                scale_settings[Y_AXIS] = scale_factor

            # 5. Auto Zoom & Pan / Dynamic Motion (zoom & subtle displacement)
            if opts.get('dynamic_motion'):
                clip_settings = p_seg.setdefault(CLIP_ATTR, {})
                scale_settings = clip_settings.setdefault(SCALE_ATTR, {})
                transform_settings = clip_settings.setdefault(TRANSFORM_ATTR, {})
                
                zoom_factor = random.choice([1.1, 1.15, 1.2])
                scale_settings[X_AXIS] = scale_factor * zoom_factor
                scale_settings[Y_AXIS] = scale_factor * zoom_factor
                transform_settings[X_AXIS] = random.choice([-40, 0, 40])
                transform_settings[Y_AXIS] = random.choice([-20, 0, 20])

            current_time += photo_duration

        total_duration = current_time
        data['duration'] = total_duration

    else:
        # TIMELINE NOT REARRANGED: Process ALL segments on the timeline independently
        print("-> Không thay đổi cấu trúc timeline. Áp dụng các hiệu ứng trực tiếp trên các phân cảnh hiện tại...")
        
        # Calculate overall duration from existing segments
        total_duration = data.get('duration', 0)
        if total_duration <= 0:
            for t in tracks:
                for seg in t.get(SEGMENTS_ATTR, []):
                    seg_end = seg.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0) + seg.get(TARGET_TIMERANGE_ATTR, {}).get(DURATION_ATTR, 0)
                    if seg_end > total_duration:
                        total_duration = seg_end
        data['duration'] = total_duration

        # 8. Auto Scale Fit Canvas
        if opts.get('auto_fill_canvas'):
            print("-> Đang tự động scale vừa khít khung hình cho tất cả ảnh/video...")
            canvas_w = 1080
            canvas_h = 1920
            canvas_config = data.get('canvas_config') or data.get('settings', {}).get('canvas_config', {})
            if canvas_config and canvas_config.get('width') and canvas_config.get('height'):
                canvas_w = canvas_config.get('width')
                canvas_h = canvas_config.get('height')
                
            for p_item in all_video_segments:
                p_seg = p_item['segment']
                media_path = p_item['material'].get(PATH_ATTR)
                scale_factor = 1.3
                dims = get_media_dimensions(media_path)
                if dims:
                    media_w, media_h = dims
                    fit_scale_w = canvas_w / media_w
                    fit_scale_h = canvas_h / media_h
                    fit_scale = min(fit_scale_w, fit_scale_h)
                    fill_scale = max(fit_scale_w, fit_scale_h)
                    if fit_scale > 0:
                        scale_factor = fill_scale / fit_scale
                        scale_factor = max(1.0, min(scale_factor, 4.0))
                
                clip_settings = p_seg.setdefault(CLIP_ATTR, {})
                scale_settings = clip_settings.setdefault(SCALE_ATTR, {})
                scale_settings[X_AXIS] = scale_factor
                scale_settings[Y_AXIS] = scale_factor
                p_item['last_scale'] = scale_factor

        # 5. Auto Zoom & Pan / Dynamic Motion
        if opts.get('dynamic_motion'):
            print("-> Đang tự động thêm chuyển động Zoom & Pan cho tất cả ảnh/video...")
            for p_item in all_video_segments:
                p_seg = p_item['segment']
                scale_factor = p_item.get('last_scale', 1.0)
                if not opts.get('auto_fill_canvas'):
                    # Check if already has scale
                    scale_factor = p_seg.get(CLIP_ATTR, {}).get(SCALE_ATTR, {}).get(X_AXIS, 1.0)

                clip_settings = p_seg.setdefault(CLIP_ATTR, {})
                scale_settings = clip_settings.setdefault(SCALE_ATTR, {})
                transform_settings = clip_settings.setdefault(TRANSFORM_ATTR, {})
                
                zoom_factor = random.choice([1.1, 1.15, 1.2])
                scale_settings[X_AXIS] = scale_factor * zoom_factor
                scale_settings[Y_AXIS] = scale_factor * zoom_factor
                transform_settings[X_AXIS] = random.choice([-40, 0, 40])
                transform_settings[Y_AXIS] = random.choice([-20, 0, 20])

    # 9. Normalize Volume (Apply to ALL audio segments in any audio track)
    if opts.get('normalize_volume'):
        print(LOG_NORMALIZE)
        for a_item in all_audio_segments:
            mat = a_item['material']
            mat[VOLUME_ATTR] = 1.0
            seg = a_item['segment']
            if 'volume' in seg:
                if isinstance(seg['volume'], dict):
                    seg['volume']['volume'] = 1.0
                else:
                    seg['volume'] = 1.0

    # 2. Ultra Music Mix (Random background music)
    if opts.get('ultra_music_mix'):
        print(LOG_MIXING)
        bgm_files = []
        dirs_to_scan = []
        if opts.get('sfx_folder'):
            dirs_to_scan.append(opts.get('sfx_folder'))
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
            # Check if there is an existing BGM track to avoid adding duplicates
            bgm_track = next((t for t in tracks if t.get('name') == "BGM Track"), None)
            if bgm_track:
                bgm_track['segments'].clear()
            else:
                bgm_track_id = f"bgm_track_{uuid.uuid4().hex[:8]}"
                bgm_track = {
                    "id": bgm_track_id,
                    "type": "audio",
                    "name": "BGM Track",
                    "segments": []
                }
                tracks.append(bgm_track)
            
            current_bgm_time = 0
            while current_bgm_time < total_duration:
                chosen_music = random.choice(music_files)
                music_dur = get_audio_duration_micros(chosen_music)
                
                mat_id = f"bgm_mat_{uuid.uuid4().hex[:8]}"
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
                seg_id = f"bgm_seg_{uuid.uuid4().hex[:8]}"
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
            print("-> Không tìm thấy tệp nhạc nền nào.")

    # 6. Auto Transition Insert
    if opts.get('auto_transition'):
        print(LOG_INSERT_TRANSITIONS)
        template_transition = transitions_mat[0] if transitions_mat else None
        
        target_video_segs = photo_segments if timeline_modifying else [v['segment'] for v in all_video_segments]
        
        for i in range(len(target_video_segs) - 1):
            p_seg = target_video_segs[i]
            # Only add transition if not already exists
            if TRANSITION_ATTR not in p_seg:
                trans_id = f"{TRANS_PREFIX}{uuid.uuid4().hex[:8]}"
                if template_transition:
                    trans_mat = copy.deepcopy(template_transition)
                    trans_mat[ID_ATTR] = trans_id
                else:
                    trans_mat = {
                        ID_ATTR: trans_id,
                        NAME_ATTR: TRANSITION_NAME,
                        TYPE_ATTR: TRANSITION_ATTR,
                        DURATION_ATTR: DEFAULT_TRANSITION_DURATION,
                        PATH_ATTR: ""
                    }
                transitions_mat.append(trans_mat)
                p_seg[TRANSITION_ATTR] = {
                    ID_ATTR: trans_id,
                    DURATION_ATTR: DEFAULT_TRANSITION_DURATION
                }
                if EXTRA_REFS_ATTR not in p_seg:
                    p_seg[EXTRA_REFS_ATTR] = []
                p_seg[EXTRA_REFS_ATTR].append(trans_id)

    # 11. Auto Font / Subtitle Preset Config
    if opts.get('auto_subtitles'):
        print(LOG_SUBTITLES)
        text_materials = data.get('materials', {}).get('texts', [])
        for tm in text_materials:
            try:
                content_str = tm.get('content', '')
                if not content_str:
                    continue
                c_dict = json.loads(content_str)
                
                c_dict['font_size'] = 12.0
                c_dict['text_color'] = '#FFCC00'  # Warm professional gold-yellow
                c_dict['has_stroke'] = True
                c_dict['stroke_color'] = '#000000'
                c_dict['stroke_width'] = 0.15
                c_dict['has_shadow'] = True
                c_dict['shadow_color'] = '#000000'
                c_dict['shadow_alpha'] = 0.8
                c_dict['shadow_blur'] = 0.15
                c_dict['align_type'] = 1
                c_dict['font_name'] = 'Inter'
                
                tm['content'] = json.dumps(c_dict, ensure_ascii=False)
            except Exception as e:
                print(f"Lỗi cấu hình phụ đề: {e}")

    # 12. AI Sound Effect Generator (Gemini Selection + Keyword fallback)
    if opts.get('ai_sfx_generator') and opts.get('sfx_folder'):
        print(LOG_AI_SFX)
        sfx_dir = opts.get('sfx_folder')
        if os.path.exists(sfx_dir) and os.path.isdir(sfx_dir):
            valid_exts = ('.mp3', '.wav', '.m4a', '.aac', '.flac')
            all_sfx_files = [f for f in os.listdir(sfx_dir) if f.lower().endswith(valid_exts)]
            
            if all_sfx_files:
                scenes_desc = []
                target_scenes_for_sfx = list(scenes) if timeline_modifying else []
                
                if not target_scenes_for_sfx:
                    # Form scenes representation from current segments
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
                                except Exception:
                                    pass
                                break
                    scene_label = overlapping_text or f"Scene {i+1} (Image: {scene['photo']['material'].get(NAME_ATTR)})"
                    scenes_desc.append({"index": i, "description": scene_label})
                
                gemini_api_key = opts.get('api_key')
                sfx_mapping = {}
                if gemini_api_key:
                    try:
                        print("-> Đang gửi yêu cầu gợi ý SFX tới Google Gemini...")
                        scenes_text = json.dumps(scenes_desc, ensure_ascii=False, indent=2)
                        sfx_list_str = "\n".join(all_sfx_files)
                        
                        prompt = f"""
                        Bạn là một nhà thiết kế âm thanh chuyên nghiệp cho video ngắn.
                        Tôi có danh sách các phân cảnh video dưới đây:
                        {scenes_text}

                        Và tôi có danh sách các tệp hiệu ứng âm thanh (SFX) có sẵn trong thư mục:
                        {sfx_list_str}

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
                        
                        res_text = call_gemini(gemini_api_key, prompt)
                        res_text = re.sub(r'```json|```', '', res_text).strip()
                        mapping_data = json.loads(res_text)
                        for item in mapping_data.get("sfx_mapping", []):
                            idx = item.get("scene_index")
                            fn = item.get("sfx_filename")
                            if fn and fn in all_sfx_files:
                                sfx_mapping[idx] = fn
                    except Exception as gem_err:
                        print(f"-> Lỗi kết nối Gemini: {gem_err}. Đang chuyển sang đối sánh từ khóa tự động...")
                        gemini_api_key = None
                        
                if not gemini_api_key:
                    print("-> Đang thực hiện đối sánh từ khóa tự động cho SFX...")
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
                    print(f"-> Đã ghép nối thành công {len(sfx_mapping)} hiệu ứng âm thanh.")
                    # Avoid duplicate SFX tracks
                    sfx_track = next((t for t in tracks if t.get('name') == "SFX Track"), None)
                    if sfx_track:
                        sfx_track['segments'].clear()
                    else:
                        sfx_track_id = f"sfx_track_{uuid.uuid4().hex[:8]}"
                        sfx_track = {
                            "id": sfx_track_id,
                            "type": "audio",
                            "name": "SFX Track",
                            "segments": []
                        }
                        tracks.append(sfx_track)
                    
                    for idx, sfx_file in sfx_mapping.items():
                        if idx >= len(target_scenes_for_sfx):
                            continue
                        scene_start = target_scenes_for_sfx[idx]['original_start'] if not timeline_modifying else target_scenes_for_sfx[idx]['photo']['segment'].get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0)
                        
                        full_sfx_path = os.path.join(sfx_dir, sfx_file)
                        sfx_dur = get_audio_duration_micros(full_sfx_path)
                        
                        mat_id = f"sfx_mat_{uuid.uuid4().hex[:8]}"
                        new_mat = {
                            "id": mat_id,
                            "name": sfx_file,
                            "path": full_sfx_path.replace("\\", "/"),
                            "duration": sfx_dur,
                            "type": "audio",
                            "volume": 0.8
                        }
                        audios_mat.append(new_mat)
                        
                        seg_id = f"sfx_seg_{uuid.uuid4().hex[:8]}"
                        new_seg = {
                            "id": seg_id,
                            "material_id": mat_id,
                            "source_timerange": {"start": 0, "duration": sfx_dur},
                            "target_timerange": {"start": scene_start, "duration": sfx_dur},
                            "volume": {"volume": 0.8}
                        }
                        sfx_track["segments"].append(new_seg)
                else:
                    print("-> Không tìm thấy kết hợp hiệu ứng âm thanh nào phù hợp.")
            else:
                print("-> Thư mục SFX trống.")

    # Chronological sort for all tracks to ensure perfect timeline rendering inside CapCut
    for t in tracks:
        if SEGMENTS_ATTR in t:
            t[SEGMENTS_ATTR].sort(key=lambda s: s.get(TARGET_TIMERANGE_ATTR, {}).get(START_ATTR, 0))

    with open(output_json_path, WRITE_MODE, encoding=UTF8_ENCODING) as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(LOG_SUCCESS)
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(ERR_CLI_USAGE)
        sys.exit(1)
        
    cmd_arg = sys.argv[1]
    
    if cmd_arg == CMD_SELECT_FILE:
        open_file_dialog()
        sys.exit(0)
    elif cmd_arg == CMD_SELECT_FOLDER:
        open_folder_dialog()
        sys.exit(0)
        
    if len(sys.argv) < 3:
        print(ERR_CLI_USAGE)
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
            print(ERR_OPTS_PARSE.format(e))
            
    try:
        process_capcut_ultra(input_file, output_file, opts)
    except Exception as e:
        print(ERR_GENERIC.format(e), file=sys.stderr)
        sys.exit(1)
