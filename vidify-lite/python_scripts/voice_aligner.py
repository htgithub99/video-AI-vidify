import os
import json
import sys
import re
import string
import difflib
import warnings
import unicodedata

WARNING_ACTION = "ignore"
MODEL_NAME = "tiny"
DEVICE = "cpu"
COMPUTE_TYPE = "int8"

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
ERROR_WHISPER_NOT_INSTALLED = "Lỗi: Chưa cài đặt thư viện faster-whisper."
ERROR_READ_JSON = "Lỗi đọc JSON kịch bản: {error}"
ERROR_WHISPER_RUN = "Lỗi khi chạy Faster Whisper: {error}"
ERROR_WRITE_JSON = "Lỗi ghi file kết quả JSON: {error}"
SUCCESS_MESSAGE = "✅ Đồng bộ hóa mốc thời gian hoàn tất!"
ERROR_FFMPEG_MISSING = "Hệ thống thiếu phần mềm FFmpeg. Vui lòng cài đặt FFmpeg và thêm vào PATH Windows."

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding=FILE_ENCODING)
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding=FILE_ENCODING)

warnings.filterwarnings(WARNING_ACTION, category=UserWarning)
warnings.filterwarnings(WARNING_ACTION, category=FutureWarning)

def normalize_text(text):
    if not text:
        return ""
    text = unicodedata.normalize('NFC', text)
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
        from faster_whisper import WhisperModel
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
        model = WhisperModel(MODEL_NAME, device=DEVICE, compute_type=COMPUTE_TYPE)
        segments, info = model.transcribe(audio_path, word_timestamps=True)
        
        total_duration_sec = info.duration
        
        ai_words = []
        for segment in segments:
            for w in segment.words:
                word_text = normalize_text(w.word)
                if not word_text:
                    continue
                ai_words.append({
                    KEY_WORD: word_text,
                    KEY_START: w.start,
                    KEY_END: w.end
                })
    except Exception as e:
        error_msg = str(e)
        if "WinError 2" in error_msg or "ffmpeg" in error_msg.lower() or "not found" in error_msg.lower():
            error_msg = ERROR_FFMPEG_MISSING
        print(ERROR_WHISPER_RUN.format(error=error_msg), file=sys.stderr, flush=True)
        sys.exit(1)

    script_words = []
    word_to_scene = []
    for idx, scene in enumerate(scenes):
        words_in_scene = [normalize_text(w) for w in (scene[KEY_TEXT] or "").split() if normalize_text(w)]
        script_words.extend(words_in_scene)
        word_to_scene.extend([idx] * len(words_in_scene))

    whisper_word_list = [w[KEY_WORD] for w in ai_words]
    sm = difflib.SequenceMatcher(None, script_words, whisper_word_list, autojunk=False)
    matches = sm.get_matching_blocks()

    filtered_matches = [m for m in matches if m.size >= 1]
    sorted_matches = sorted(filtered_matches, key=lambda x: x.a)

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

    n_words = len(script_words)
    script_word_times = [{KEY_START: None, KEY_END: None} for _ in range(n_words)]
    for match in optimal_matches:
        for k in range(match.size):
            script_idx = match.a + k
            ai_idx = match.b + k
            script_word_times[script_idx][KEY_START] = ai_words[ai_idx][KEY_START]
            script_word_times[script_idx][KEY_END] = ai_words[ai_idx][KEY_END]

    i = 0
    while i < n_words:
        if script_word_times[i][KEY_START] is None:
            j = i
            while j < n_words and script_word_times[j][KEY_START] is None:
                j += 1
            
            prev_end = script_word_times[i-1][KEY_END] if i > 0 and script_word_times[i-1][KEY_END] is not None else 0.0
            next_start = script_word_times[j][KEY_START] if j < n_words and script_word_times[j][KEY_START] is not None else total_duration_sec
            
            if prev_end > next_start:
                prev_end = next_start
                
            gap_len = max(0.0, next_start - prev_end)
            
            missing_chars = [len(to_char_list(script_words[k])) for k in range(i, j)]
            total_missing_chars = sum(missing_chars)
            
            current_t = prev_end
            for k_idx in range(i, j):
                if total_missing_chars > 0:
                    dur = gap_len * (missing_chars[k_idx - i] / total_missing_chars)
                else:
                    dur = gap_len / (j - i)
                script_word_times[k_idx][KEY_START] = current_t
                script_word_times[k_idx][KEY_END] = current_t + dur
                current_t += dur
            
            i = j
        else:
            i += 1

    for i in range(1, n_words):
        if script_word_times[i][KEY_START] > script_word_times[i-1][KEY_END]:
            mid = (script_word_times[i][KEY_START] + script_word_times[i-1][KEY_END]) / 2.0
            script_word_times[i-1][KEY_END] = mid
            script_word_times[i][KEY_START] = mid
        elif script_word_times[i][KEY_START] < script_word_times[i-1][KEY_END]:
            mid = (script_word_times[i][KEY_START] + script_word_times[i-1][KEY_END]) / 2.0
            script_word_times[i-1][KEY_END] = mid
            script_word_times[i][KEY_START] = mid

    if n_words > 0:
        script_word_times[0][KEY_START] = 0.0
        script_word_times[-1][KEY_END] = total_duration_sec

    scene_cuts = []
    for i in range(len(scenes)):
        word_indices = [idx for idx, s_idx in enumerate(word_to_scene) if s_idx == i]
        
        if len(word_indices) > 0:
            first_idx = word_indices[0]
            last_idx = word_indices[-1]
            cut_start = script_word_times[first_idx][KEY_START]
            cut_end = script_word_times[last_idx][KEY_END]
        else:
            cut_start = scene_cuts[-1][KEY_END] if i > 0 else 0.0
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
