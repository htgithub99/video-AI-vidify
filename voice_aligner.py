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
ERROR_WHISPER_NOT_INSTALLED = "Lỗi: Chưa cài đặt thư viện whisperx."
ERROR_READ_JSON = "Lỗi đọc JSON kịch bản: {error}"
ERROR_WHISPER_RUN = "Lỗi khi chạy WhisperX AI: {error}"
ERROR_WRITE_JSON = "Lỗi ghi file kết quả JSON: {error}"
SUCCESS_MESSAGE = "✅ Đồng bộ hóa mốc thời gian hoàn tất!"
ERROR_FFMPEG_MISSING = "Hệ thống thiếu phần mềm FFmpeg (Bắt buộc cho WhisperX). Vui lòng cài đặt FFmpeg (https://ffmpeg.org/download.html) và thêm vào PATH Windows."

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

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
        import whisperx
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
        combined_script_text = " ".join(s[KEY_TEXT] for s in scenes if s.get(KEY_TEXT))
        
        device = "cpu"
        batch_size = 16
        compute_type = "int8"

        # Load whisperx model
        has_vietnamese = any(ord(c) > 0x1E00 for c in combined_script_text)
        detect_lang = "vi" if has_vietnamese else "en"

        model = whisperx.load_model(MODEL_NAME, device, compute_type=compute_type, language=detect_lang)
        audio = whisperx.load_audio(audio_path)
        
        result = model.transcribe(audio, batch_size=batch_size)
        total_duration_sec = len(audio) / 16000.0  # WhisperX load_audio returns float32 numpy array sampled at 16kHz
        
        # Chạy Align Model của WhisperX để căn chỉnh mốc thời gian chi tiết của từng từ
        try:
            model_a, metadata = whisperx.load_align_model(language_code=detect_lang, device=device)
            result = whisperx.align(result["segments"], model_a, metadata, audio, device, return_char_alignments=False)
        except Exception as align_err:
            # Fallback nếu mô hình align không tải được
            pass

        ai_words = []
        for segment in result.get("segments", []):
            if "words" in segment:
                for w in segment["words"]:
                    if "start" in w and "end" in w:
                        word_text = normalize_text(w["word"])
                        if not word_text:
                            continue
                        ai_words.append({
                            "word": word_text,
                            KEY_START: w["start"],
                            KEY_END: w["end"]
                        })
    except Exception as e:
        error_msg = str(e)
        if "WinError 2" in error_msg or "ffmpeg" in error_msg.lower() or "not found" in error_msg.lower():
            error_msg = ERROR_FFMPEG_MISSING
        print(ERROR_WHISPER_RUN.format(error=error_msg), file=sys.stderr, flush=True)
        sys.exit(1)

    # Tách kịch bản gốc thành mảng từ và ánh xạ đến scene_idx
    script_words = []
    word_to_scene = []
    for idx, scene in enumerate(scenes):
        words_in_scene = [normalize_text(w) for w in (scene[KEY_TEXT] or "").split() if normalize_text(w)]
        script_words.extend(words_in_scene)
        word_to_scene.extend([idx] * len(words_in_scene))

    whisper_word_list = [w["word"] for w in ai_words]
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

    scene_core_times = [{KEY_START: None, KEY_END: None} for _ in range(len(scenes))]
    for match in optimal_matches:
        for k in range(match.size):
            scene_idx = word_to_scene[match.a + k]
            if scene_core_times[scene_idx][KEY_START] is None:
                scene_core_times[scene_idx][KEY_START] = ai_words[match.b + k][KEY_START]
            scene_core_times[scene_idx][KEY_END] = ai_words[match.b + k][KEY_END]

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

    scene_cuts = []
    for i in range(len(scenes)):
        s_time = scene_core_times[i][KEY_START]
        e_time = scene_core_times[i][KEY_END]
        
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
