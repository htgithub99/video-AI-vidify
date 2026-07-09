import os
import json
import sys
import re
import string
import difflib
import warnings

WARNING_ACTION = "ignore"
MODEL_NAME = "base"

FILE_READ_MODE = "r"
FILE_WRITE_MODE = "w"
FILE_ENCODING = "utf-8"

KEY_ID = "id"
KEY_SCRIPT = "script"
KEY_SUBTITLE = "subtitle"
KEY_NARRATION = "narrationText"
KEY_TEXT = "text"
KEY_SEGMENTS = "segments"
KEY_WORDS = "words"
KEY_WORD = "word"
KEY_START = "start"
KEY_END = "end"
KEY_SUCCESS = "success"
KEY_ALIGNMENTS = "alignments"
KEY_DURATION = "duration"

RE_WHITESPACE = r'\s+'
PUNCTUATION_TO_REMOVE = string.punctuation + '""\'\'“”‘’'

ERROR_MISSING_ARGS = "Lỗi: Thiếu tham số truyền vào."
ERROR_USAGE = "Cú pháp: python voice_aligner.py <audio_path> <scenes_json_path> <output_json_path>"
ERROR_AUDIO_NOT_FOUND = "Lỗi: Không tìm thấy file âm thanh tại {path}"
ERROR_SCENES_NOT_FOUND = "Lỗi: Không tìm thấy file JSON phân cảnh tại {path}"
ERROR_WHISPER_NOT_INSTALLED = "Lỗi: Chưa cài đặt thư viện openai-whisper."
ERROR_READ_JSON = "Lỗi đọc JSON kịch bản: {error}"
ERROR_WHISPER_RUN = "Lỗi khi chạy Whisper AI: {error}"
ERROR_WRITE_JSON = "Lỗi ghi file kết quả JSON: {error}"
SUCCESS_MESSAGE = "✅ Đồng bộ hóa mốc thời gian hoàn tất!"
ERROR_FFMPEG_MISSING = "Hệ thống thiếu phần mềm FFmpeg (Bắt buộc cho Whisper). Vui lòng cài đặt FFmpeg (https://ffmpeg.org/download.html) và thêm vào PATH Windows."

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

warnings.filterwarnings(WARNING_ACTION, category=UserWarning)
warnings.filterwarnings(WARNING_ACTION, category=FutureWarning)

def normalize_text(text):
    if not text:
        return ""
    text = text.lower()
    text = text.translate(str.maketrans('', '', PUNCTUATION_TO_REMOVE))
    return re.sub(RE_WHITESPACE, ' ', text).strip()

def to_char_list(text):
    if not text:
        return []
    norm = normalize_text(text)
    norm_no_ws = norm.replace(" ", "")
    return list(norm_no_ws)

def main():
    if len(sys.argv) < 4:
        print(ERROR_MISSING_ARGS, file=sys.stderr, flush=True)
        print(ERROR_USAGE, file=sys.stderr, flush=True)
        sys.exit(1)

    audio_path = sys.argv[1]
    scenes_json_path = sys.argv[2]
    output_json_path = sys.argv[3]

    if not os.path.exists(audio_path):
        print(ERROR_AUDIO_NOT_FOUND.format(path=audio_path), file=sys.stderr, flush=True)
        sys.exit(1)

    if not os.path.exists(scenes_json_path):
        print(ERROR_SCENES_NOT_FOUND.format(path=scenes_json_path), file=sys.stderr, flush=True)
        sys.exit(1)

    try:
        import whisper
    except ImportError:
        print(ERROR_WHISPER_NOT_INSTALLED, file=sys.stderr, flush=True)
        sys.exit(1)

    try:
        with open(scenes_json_path, FILE_READ_MODE, encoding=FILE_ENCODING) as f:
            raw_scenes = json.load(f)
    except Exception as e:
        print(ERROR_READ_JSON.format(error=str(e)), file=sys.stderr, flush=True)
        sys.exit(1)

    scenes = []
    for s in raw_scenes:
        text = s.get(KEY_SCRIPT) or s.get(KEY_SUBTITLE) or s.get(KEY_NARRATION) or s.get(KEY_TEXT) or ""
        scenes.append({
            KEY_ID: s.get(KEY_ID),
            KEY_TEXT: text.strip()
        })

    try:
        model = whisper.load_model(MODEL_NAME)
        result = model.transcribe(audio_path, word_timestamps=True)
    except Exception as e:
        error_msg = str(e)
        if "WinError 2" in error_msg or "ffmpeg" in error_msg.lower() or "not found" in error_msg.lower():
            error_msg = ERROR_FFMPEG_MISSING
        print(ERROR_WHISPER_RUN.format(error=error_msg), file=sys.stderr, flush=True)
        sys.exit(1)

    # Phân bổ thời gian của từ nhận diện bởi Whisper cho từng ký tự cấu thành (đa ngôn ngữ)
    ai_chars = []
    for segment in result.get(KEY_SEGMENTS, []):
        for word_info in segment.get(KEY_WORDS, []):
            word_text = word_info[KEY_WORD]
            chars = to_char_list(word_text)
            if not chars:
                continue
            
            w_start = word_info[KEY_START]
            w_end = word_info[KEY_END]
            w_dur = max(0.0, w_end - w_start)
            w_len = len(chars)
            
            for k, char in enumerate(chars):
                c_start = w_start + k * (w_dur / w_len)
                c_end = w_start + (k + 1) * (w_dur / w_len)
                ai_chars.append({
                    "char": char,
                    KEY_START: c_start,
                    KEY_END: c_end
                })

    # Tách kịch bản gốc thành mảng ký tự và ánh xạ đến scene_idx
    script_chars = []
    char_to_scene = []
    for idx, scene in enumerate(scenes):
        chars = to_char_list(scene[KEY_TEXT])
        script_chars.extend(chars)
        char_to_scene.extend([idx] * len(chars))

    whisper_char_list = [c["char"] for c in ai_chars]
    sm = difflib.SequenceMatcher(None, script_chars, whisper_char_list)
    matches = sm.get_matching_blocks()

    # Lọc bỏ các block khớp quá ngắn (nhiễu ký tự đơn lẻ)
    filtered_matches = [m for m in matches if m.size >= 2]
    sorted_matches = sorted(filtered_matches, key=lambda x: x.a)

    # Thuật toán Quy hoạch động để chọn chuỗi khớp đơn điệu (monotonic) tối ưu
    n_matches = len(sorted_matches)
    dp = [m.size for m in sorted_matches]
    parent = [-1] * n_matches

    for i in range(n_matches):
        for j in range(i):
            if sorted_matches[i].a >= sorted_matches[j].a + sorted_matches[j].size and \
               sorted_matches[i].b >= sorted_matches[j].b + sorted_matches[j].size:
                if dp[j] + sorted_matches[i].size > dp[i]:
                    dp[i] = dp[j] + sorted_matches[i].size
                    parent[i] = j

    optimal_matches = []
    if n_matches > 0:
        best_idx = dp.index(max(dp))
        curr = best_idx
        while curr != -1:
            optimal_matches.append(sorted_matches[curr])
            curr = parent[curr]
        optimal_matches.reverse()

    # Gán mốc thời gian từ chuỗi khớp đơn điệu
    scene_core_times = [{KEY_START: None, KEY_END: None} for _ in range(len(scenes))]
    for match in optimal_matches:
        for k in range(match.size):
            scene_idx = char_to_scene[match.a + k]
            if scene_core_times[scene_idx][KEY_START] is None:
                scene_core_times[scene_idx][KEY_START] = ai_chars[match.b + k][KEY_START]
            scene_core_times[scene_idx][KEY_END] = ai_chars[match.b + k][KEY_END]

    total_duration_sec = result.get(KEY_SEGMENTS, [])[-1].get(KEY_END, 10.0) if result.get(KEY_SEGMENTS) else 10.0
    
    # Nội suy thời gian cho các cảnh chưa khớp được từ nào
    i = 0
    n = len(scenes)
    while i < n:
        if scene_core_times[i][KEY_START] is None:
            j = i
            while j < n and scene_core_times[j][KEY_START] is None:
                j += 1
            
            prev_end = scene_core_times[i-1][KEY_END] if i > 0 else 0.0
            next_start = total_duration_sec
            for k_idx in range(j, n):
                if scene_core_times[k_idx][KEY_START] is not None:
                    next_start = scene_core_times[k_idx][KEY_START]
                    break
            
            # Phòng vệ chống chồng chéo thời gian
            if prev_end > next_start:
                prev_end = next_start
            
            gap_len = max(0.0, next_start - prev_end)
            unmatched_scenes = scenes[i:j]
            total_chars = sum(len(to_char_list(s[KEY_TEXT])) for s in unmatched_scenes)
            
            current_t = prev_end
            if total_chars > 0:
                for idx_unmatched, s_unmatched in enumerate(unmatched_scenes):
                    scene_idx = i + idx_unmatched
                    dur = gap_len * (len(to_char_list(s_unmatched[KEY_TEXT])) / total_chars)
                    scene_core_times[scene_idx][KEY_START] = current_t
                    scene_core_times[scene_idx][KEY_END] = current_t + dur
                    current_t += dur
            else:
                dur = gap_len / len(unmatched_scenes)
                for idx_unmatched in range(len(unmatched_scenes)):
                    scene_idx = i + idx_unmatched
                    scene_core_times[scene_idx][KEY_START] = current_t
                    scene_core_times[scene_idx][KEY_END] = current_t + dur
                    current_t += dur
            i = j
        else:
            i += 1

    # Tính toán điểm cắt thực tế cho các cảnh
    scene_cuts = []
    for i in range(len(scenes)):
        s_time = scene_core_times[i][KEY_START]
        e_time = scene_core_times[i][KEY_END]
        
        # Phòng vệ: Đảm bảo thời gian bắt đầu của cảnh i không nhỏ hơn mốc kết thúc của cảnh trước
        if i > 0:
            prev_end = scene_core_times[i-1][KEY_END]
            if s_time is not None and prev_end is not None and s_time < prev_end:
                s_time = prev_end
        if s_time is not None and e_time is not None and e_time < s_time:
            e_time = s_time
        
        if i == 0:
            cut_start = 0.0
        else:
            prev_end = scene_core_times[i-1][KEY_END]
            gap_prev = max(0.0, s_time - prev_end)
            len_prev = len(to_char_list(scenes[i-1].get(KEY_TEXT, '')))
            len_curr = len(to_char_list(scenes[i].get(KEY_TEXT, '')))
            total_len = len_prev + len_curr
            ratio_prev = len_prev / total_len if total_len > 0 else 0.5
            cut_start = prev_end + gap_prev * ratio_prev
        
        if i == len(scenes) - 1:
            cut_end = total_duration_sec
        else:
            next_start = scene_core_times[i+1][KEY_START]
            gap_next = max(0.0, next_start - e_time)
            len_curr = len(to_char_list(scenes[i].get(KEY_TEXT, '')))
            len_next = len(to_char_list(scenes[i+1].get(KEY_TEXT, '')))
            total_len = len_curr + len_next
            ratio_curr = len_curr / total_len if total_len > 0 else 0.5
            cut_end = e_time + gap_next * ratio_curr
        
        if cut_end < cut_start:
            cut_end = cut_start
                
        scene_cuts.append({
            KEY_ID: scenes[i][KEY_ID],
            KEY_START: round(cut_start, 3),
            KEY_END: round(cut_end, 3),
            KEY_DURATION: round(cut_end - cut_start, 3)
        })

    try:
        with open(output_json_path, FILE_WRITE_MODE, encoding=FILE_ENCODING) as f:
            json.dump({KEY_SUCCESS: True, KEY_ALIGNMENTS: scene_cuts}, f, ensure_ascii=False, indent=2)
        print(SUCCESS_MESSAGE)
    except Exception as e:
        print(ERROR_WRITE_JSON.format(error=str(e)), file=sys.stderr, flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
