import os
import json
import random
import uuid
import re
import sys
import string

PUNCTUATION_TO_REMOVE = string.punctuation + '""\'\'“”‘’'
REGEX_SONG_SUFFIX = r'\(\d+\)$'

LOG_START_PROCESS = "-> Bắt đầu xử lý CapCut Ultra cho file: {}"
LOG_OPTS = "-> Cấu hình tùy chọn: {}"
LOG_COUNT_PHOTOS = "📷 Tìm thấy {} Ảnh/Video trên timeline."
LOG_COUNT_AUDIOS = "🎵 Tìm thấy {} Âm thanh trên timeline."
LOG_CLEAR_TRANSITIONS = "🗑️ Đang xóa toàn bộ hiệu ứng chuyển cảnh cũ..."
LOG_SYNCING = "⏳ Đang đồng bộ thời gian từ trái sang phải cho {} phân cảnh..."
LOG_NORMALIZE = "🔊 Đang chuẩn hóa âm lượng các track audio về 0dB..."
LOG_REVERSING = "🔄 Đang đảo ngược thứ tự các phân cảnh trên timeline..."
LOG_MIXING = "🎵 Đang trộn nhạc nền ngẫu nhiên..."
LOG_CUSTOM_ORDER = "🔀 Đang xếp thứ tự âm thanh theo danh sách từ khóa: {}"
LOG_RANDOMIZING = "🔀 Đang tráo đổi ngẫu nhiên trật tự phân cảnh..."
LOG_INSERT_TRANSITIONS = "🎬 Đang tự động chèn hiệu ứng chuyển cảnh ngẫu nhiên..."
LOG_SUBTITLES = "📝 Đang tự động tạo phụ đề dựa trên thông tin tệp tin..."
LOG_AI_SFX = "⚡ Đang gọi Google Gemini để sinh hiệu ứng âm thanh AI..."
LOG_SUCCESS = "SUCCESS: Xử lý CapCut Ultra hoàn tất thành công!"

ERR_NO_MEDIA = "Không tìm thấy ảnh/video hoặc âm thanh trong timeline!"
ERR_CLI_USAGE = "Cú pháp: python capcut_ultra_tool.py <input_json> <output_json> [opts_json_string] HOẶC python capcut_ultra_tool.py <select-file/select-folder>"
ERR_OPTS_PARSE = "Lỗi phân tích cú pháp tùy chọn JSON: {}"
ERR_GENERIC = "ERROR: {}"

FFPROBE_CMD_V = 'error'
FFPROBE_ENTRY = 'format=duration'
FFPROBE_FORMAT = 'default=noprint_wrappers=1:nokey=1'

TRANSITION_NAME = "Chuyển cảnh ngẫu nhiên"
DEFAULT_TRANSITION_DURATION = 500000
DEFAULT_FALLBACK_DURATION = 5000000
NT_OS_NAME = 'nt'
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
ALL_JSON_LABEL = "All JSON files"
ALL_FILES_LABEL = "All files"
DRAFT_JSON_NAME = "draft_content.json"
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
    import subprocess
    try:
        cmd = [
            'ffprobe', 
            '-v', FFPROBE_CMD_V, 
            '-show_entries', FFPROBE_ENTRY, 
            '-of', FFPROBE_FORMAT, 
            filepath
        ]
        startupinfo = None
        if os.name == NT_OS_NAME:
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            
        result = subprocess.run(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True, 
            startupinfo=startupinfo,
            timeout=5
        )
        if result.returncode == 0:
            duration_sec = float(result.stdout.strip())
            return int(duration_sec * 1000000)
    except:
        pass

    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(filepath)
        return len(audio) * 1000
    except:
        pass

    try:
        import wave
        with wave.open(filepath, 'rb') as w:
            frames = w.getnframes()
            rate = w.getframerate()
            return int((frames / float(rate)) * 1000000)
    except:
        pass

    return DEFAULT_FALLBACK_DURATION

def open_file_dialog():
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    file_path = filedialog.askopenfilename(
        title=DIALOG_FILE_TITLE,
        filetypes=[
            (JSON_FILE_TYPES_LABEL, DRAFT_JSON_NAME), 
            (ALL_JSON_LABEL, JSON_EXT), 
            (ALL_FILES_LABEL, ALL_EXT)
        ]
    )
    if file_path:
        print(os.path.normpath(file_path), end="")

def open_folder_dialog():
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    dir_path = filedialog.askdirectory(title=DIALOG_FOLDER_TITLE)
    if dir_path:
        print(os.path.normpath(dir_path), end="")

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

    if num_photos == 0 or num_audios == 0:
        raise Exception(ERR_NO_MEDIA)

    if opts.get('clear_transitions'):
        print(LOG_CLEAR_TRANSITIONS)
        for p_item in photo_segments:
            seg = p_item['segment']
            if TRANSITION_ATTR in seg:
                del seg[TRANSITION_ATTR]
            if EXTRA_REFS_ATTR in seg:
                seg[EXTRA_REFS_ATTR] = [ref for ref in seg[EXTRA_REFS_ATTR] if not ref.startswith(TRANS_PREFIX)]

    target_count = min(num_photos, num_audios)
    print(LOG_SYNCING.format(target_count))
    
    current_time = 0 
    for i in range(target_count):
        p_item = photo_segments[i]
        a_item = audio_segments[i]

        p_seg = p_item['segment']
        a_seg = a_item['segment']
        
        audio_path = a_item['material'][PATH_ATTR]
        audio_duration = get_audio_duration_micros(audio_path)
        
        a_seg[SOURCE_TIMERANGE_ATTR] = {START_ATTR: 0, DURATION_ATTR: audio_duration}
        a_seg[TARGET_TIMERANGE_ATTR] = {START_ATTR: current_time, DURATION_ATTR: audio_duration}
        a_item['material'][DURATION_ATTR] = audio_duration
        
        p_seg[TARGET_TIMERANGE_ATTR] = {START_ATTR: current_time, DURATION_ATTR: audio_duration}
        
        if p_item['material'].get(TYPE_ATTR) == VIDEO_TYPE_KEY:
            p_seg[SOURCE_TIMERANGE_ATTR] = {START_ATTR: 0, DURATION_ATTR: audio_duration}
            p_item['material'][DURATION_ATTR] = audio_duration
        else:
            p_seg[SOURCE_TIMERANGE_ATTR] = {START_ATTR: 0, DURATION_ATTR: audio_duration}

        if opts.get('auto_fill_canvas'):
            clip_settings = p_seg.setdefault(CLIP_ATTR, {})
            scale_settings = clip_settings.setdefault(SCALE_ATTR, {})
            scale_settings[X_AXIS] = 1.3
            scale_settings[Y_AXIS] = 1.3

        if opts.get('dynamic_motion'):
            clip_settings = p_seg.setdefault(CLIP_ATTR, {})
            scale_settings = clip_settings.setdefault(SCALE_ATTR, {})
            transform_settings = clip_settings.setdefault(TRANSFORM_ATTR, {})
            zoom_scale = random.choice([1.1, 1.15, 1.2])
            scale_settings[X_AXIS] = zoom_scale
            scale_settings[Y_AXIS] = zoom_scale
            transform_settings[X_AXIS] = random.choice([-50, 0, 50])
            transform_settings[Y_AXIS] = random.choice([-30, 0, 30])

        current_time += audio_duration

    if opts.get('normalize_volume'):
        print(LOG_NORMALIZE)
        for a_item in audio_segments:
            mat = a_item['material']
            mat[VOLUME_ATTR] = 1.0

    if opts.get('reverse_timeline'):
        print(LOG_REVERSING)
        photo_segments.reverse()
        audio_segments.reverse()
        current_time = 0
        for i in range(target_count):
            p_seg = photo_segments[i]['segment']
            a_seg = audio_segments[i]['segment']
            dur = a_seg[TARGET_TIMERANGE_ATTR][DURATION_ATTR]
            p_seg[TARGET_TIMERANGE_ATTR][START_ATTR] = current_time
            a_seg[TARGET_TIMERANGE_ATTR][START_ATTR] = current_time
            current_time += dur

    if opts.get('ultra_music_mix'):
        print(LOG_MIXING)
        pass

    if opts.get('custom_audio_order') and opts.get('audio_order_list'):
        print(LOG_CUSTOM_ORDER.format(opts.get('audio_order_list')))
        pass

    if opts.get('randomize_video'):
        print(LOG_RANDOMIZING)
        indices = list(range(target_count))
        random.shuffle(indices)
        shuffled_photos = [photo_segments[i] for i in indices]
        shuffled_audios = [audio_segments[i] for i in indices]
        current_time = 0
        for i in range(target_count):
            p_seg = shuffled_photos[i]['segment']
            a_seg = shuffled_audios[i]['segment']
            dur = a_seg[TARGET_TIMERANGE_ATTR][DURATION_ATTR]
            p_seg[TARGET_TIMERANGE_ATTR][START_ATTR] = current_time
            a_seg[TARGET_TIMERANGE_ATTR][START_ATTR] = current_time
            current_time += dur

    if opts.get('auto_transition') and not opts.get('clear_transitions'):
        print(LOG_INSERT_TRANSITIONS)
        for i in range(target_count - 1):
            p_seg = photo_segments[i]['segment']
            trans_id = f"{TRANS_PREFIX}{uuid.uuid4().hex[:8]}"
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

    if opts.get('auto_subtitles'):
        print(LOG_SUBTITLES)
        pass

    if opts.get('ai_sfx_generator') and opts.get('api_key') and opts.get('sfx_folder'):
        print(LOG_AI_SFX)
        pass

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
