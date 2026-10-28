from __future__ import annotations
if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import difflib
import json
import math
import re
import subprocess
import sys
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from typing import Any
import cv2
import numpy as np
INPUT_ENCODING = _CODE_TEXT.UTF_8
JSON_SEPARATORS = (_CODE_TEXT.SYMBOL_D03502, _CODE_TEXT.SYMBOL_E7AC07)
PROCESS_ENCODING = _CODE_TEXT.UTF_8
PROCESS_ERROR_MODE = _CODE_TEXT.REPLACE
FFMPEG_NULL_TARGET = _CODE_TEXT.NUL if sys.platform == _CODE_TEXT.WIN32 else _CODE_TEXT.DEV_NULL
FFMPEG_VIDEO_FILTER = _CODE_TEXT.BLACKDETECT_D_BLACK_DURATION_PIX_TH_BLACK_PIXEL_THRESHOLD_FR
FFMPEG_AUDIO_FILTER = _CODE_TEXT.SILENCEDETECT_N_SILENCE_NOISE_D_SILENCE_DURATION
BLACK_RANGE_PATTERN = re.compile(_CODE_TEXT.BLACK_START_D_S_BLACK_END_D)
FREEZE_START_PATTERN = re.compile(_CODE_TEXT.FREEZE_START_S_D)
FREEZE_END_PATTERN = re.compile(_CODE_TEXT.FREEZE_END_S_D)
SILENCE_START_PATTERN = re.compile(_CODE_TEXT.SILENCE_START_S_D)
SILENCE_END_PATTERN = re.compile(_CODE_TEXT.SILENCE_END_S_D)
CROP_PATTERN = re.compile(_CODE_TEXT.CROP_D_D_D_D)
LIBRARY_OPENCV = _CODE_TEXT.OPENCV
LIBRARY_PYSCENEDETECT = _CODE_TEXT.PYSCENEDETECT
TAKE_USE = _CODE_TEXT.USE
TAKE_TRIM = _CODE_TEXT.TRIM
TAKE_OMIT = _CODE_TEXT.OMIT
SHOT_ROLE_MASTER = _CODE_TEXT.MASTER
TRANSITION_CUT = _CODE_TEXT.CUT
AUDIO_BRIDGE_HARD = _CODE_TEXT.HARD
AUDIO_BRIDGE_AMBIENCE = _CODE_TEXT.AMBIENCE
WARNING_CLIP_MISSING = _CODE_TEXT.CLIP_MISSING
WARNING_INVALID_DURATION = _CODE_TEXT.INVALID_DURATION
WARNING_BLACK = _CODE_TEXT.BLACK_FRAMES_DETECTED
WARNING_FREEZE = _CODE_TEXT.FREEZE_DETECTED
WARNING_BORDER = _CODE_TEXT.EMBEDDED_BORDER_DETECTED
WARNING_LOW_SHARPNESS = _CODE_TEXT.LOW_SHARPNESS
WARNING_LOW_MOTION = _CODE_TEXT.LOW_MOTION
WARNING_DUPLICATE_FRAMES = _CODE_TEXT.DUPLICATE_FRAMES
WARNING_SIMILAR_CLIP = _CODE_TEXT.POSSIBLE_REPEATED_VISUAL_CONTENT
WARNING_REPEATED_CLIP_OMITTED = _CODE_TEXT.REPEATED_VISUAL_CONTENT_OMITTED
WARNING_DIALOGUE_MISMATCH = _CODE_TEXT.DIALOGUE_DOES_NOT_MATCH_SCREENPLAY
REASON_MISSING = _CODE_TEXT.CLIP_MISSING
REASON_INVALID = _CODE_TEXT.INVALID_DURATION
REASON_UNUSABLE = _CODE_TEXT.INSUFFICIENT_USABLE_DURATION_AFTER_LIBRARY_ANALYSIS
REASON_LIBRARY = _CODE_TEXT.LIBRARY_SELECTED_CLEAN_VISUAL_SPAN
REASON_REPEATED = _CODE_TEXT.LIBRARY_OMITTED_NEAR_EXACT_REPEATED_CLIP
EMPTY_TEXT = ""
NARRATIVE_ANCHOR_ROLES = frozenset({_CODE_TEXT.INTRO, _CODE_TEXT.SETUP, _CODE_TEXT.INCITING_INCIDENT, _CODE_TEXT.CLIMAX, _CODE_TEXT.CONSEQUENCE, _CODE_TEXT.RESOLUTION, _CODE_TEXT.PAYOFF})
@dataclass(frozen=True)
class AnalyzerConfig:
    sample_fps: float
    analysis_width: int
    min_usable_seconds: float
    min_selection_seconds: float
    max_segment_seconds: float
    segment_length_step_seconds: float
    visual_quality_weight: float
    duration_preservation_weight: float
    edge_trim_limit_ratio: float
    edge_padding_seconds: float
    cut_threshold: float
    adaptive_cut_sigma: float
    min_shot_seconds: float
    dark_luma_threshold: float
    bright_luma_threshold: float
    duplicate_motion_threshold: float
    low_motion_threshold: float
    min_sharpness: float
    black_duration: float
    black_pixel_threshold: float
    freeze_noise: str
    freeze_duration: float
    silence_noise: str
    silence_duration: float
    crop_limit: int
    crop_round: int
    embedded_border_ratio: float
    crop_min_observations: int
    ffmpeg_timeout_seconds: float
    prefer_scenedetect: bool
    scenedetect_adaptive_threshold: float
    scenedetect_min_content_value: float
    scenedetect_window_width: int
    sharpness_weight: float
    motion_weight: float
    exposure_weight: float
    uniqueness_weight: float
    sharpness_reference_quantile: float
    motion_reference_quantile: float
    exposure_midpoint: float
    dialogue_silence_ratio: float
    dialogue_context_seconds: float
    dialogue_text_match_threshold: float
    dialogue_sequence_match_weight: float
    dialogue_token_match_weight: float
    whisper_model: str
    whisper_device: str
    whisper_compute_type: str
    whisper_beam_size: int
    whisper_no_speech_probability: float
    whisper_local_files_only: bool
    duplicate_warning_ratio: float
    ai_review_confidence: float
    score_scale: float
    min_sample_fps: float
    duplicate_clip_similarity_threshold: float
    duplicate_clip_perceptual_threshold: float
    duplicate_clip_auto_omit_threshold: float
    internal_segment_similarity_threshold: float
    silent_selection_ratio: float
    max_selected_segments: int
    segment_merge_gap_seconds: float
    perceptual_hash_size: int
    perceptual_sequence_samples: int
    max_workers: int
    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "AnalyzerConfig":
        return cls(**payload)
def _number(value: Any, default: float = 0.0) -> float:
    try:
        result = float(value)
        return result if math.isfinite(result) else default
    except (TypeError, ValueError):
        return default
def _ranges(starts: list[float], ends: list[float], duration: float) -> list[list[float]]:
    return [[start, ends[index] if index < len(ends) else duration] for index, start in enumerate(starts)]
def _run_ffmpeg_probe(video_path: str, ffmpeg_path: str, config: AnalyzerConfig, has_audio: bool, duration: float) -> dict[str, Any]:
    video_filter = FFMPEG_VIDEO_FILTER.format(
        black_duration=config.black_duration,
        black_pixel_threshold=config.black_pixel_threshold,
        freeze_noise=config.freeze_noise,
        freeze_duration=config.freeze_duration,
        crop_limit=config.crop_limit,
        crop_round=config.crop_round,
    )
    command = [ffmpeg_path, _CODE_TEXT.HIDE_BANNER, _CODE_TEXT.I, video_path, _CODE_TEXT.VF, video_filter]
    if has_audio:
        command.extend([_CODE_TEXT.AF, FFMPEG_AUDIO_FILTER.format(silence_noise=config.silence_noise, silence_duration=config.silence_duration)])
    command.extend([_CODE_TEXT.F, _CODE_TEXT.NULL, FFMPEG_NULL_TARGET])
    try:
        completed = subprocess.run(
            command,
            capture_output=True,
            check=False,
            timeout=config.ffmpeg_timeout_seconds,
            text=True,
            encoding=PROCESS_ENCODING,
            errors=PROCESS_ERROR_MODE,
        )
        output = completed.stderr
    except (OSError, subprocess.SubprocessError):
        output = EMPTY_TEXT
    black_ranges = [[_number(match.group(1)), _number(match.group(2))] for match in BLACK_RANGE_PATTERN.finditer(output)]
    freeze_ranges = _ranges(
        [_number(match.group(1)) for match in FREEZE_START_PATTERN.finditer(output)],
        [_number(match.group(1)) for match in FREEZE_END_PATTERN.finditer(output)],
        duration,
    )
    silence_ranges = _ranges(
        [_number(match.group(1)) for match in SILENCE_START_PATTERN.finditer(output)],
        [_number(match.group(1)) for match in SILENCE_END_PATTERN.finditer(output)],
        duration,
    )
    crops = [tuple(int(value) for value in match.groups()) for match in CROP_PATTERN.finditer(output)]
    return {_CODE_TEXT.BLACKRANGES: black_ranges, _CODE_TEXT.FREEZERANGES: freeze_ranges, _CODE_TEXT.SILENCERANGES: silence_ranges, _CODE_TEXT.CROPS: crops}
def _safe_edge_bounds(duration: float, ranges: list[list[float]], config: AnalyzerConfig) -> tuple[float, float]:
    edge_tolerance = config.edge_padding_seconds
    trim_limit = duration * config.edge_trim_limit_ratio
    start = 0.0
    end = duration
    for range_start, range_end in ranges:
        actual_end = duration if range_end <= 0 else min(duration, range_end)
        if range_start <= edge_tolerance:
            start = max(start, min(actual_end, trim_limit))
        if actual_end >= duration - edge_tolerance:
            end = min(end, max(range_start, duration - trim_limit))
    return start, end
def _detect_shots_with_scenedetect(video_path: str, config: AnalyzerConfig) -> tuple[bool, list[float]]:
    if not config.prefer_scenedetect:
        return False, []
    try:
        from scenedetect import AdaptiveDetector, detect
        scenes = detect(
            video_path,
            AdaptiveDetector(
                adaptive_threshold=config.scenedetect_adaptive_threshold,
                min_content_val=config.scenedetect_min_content_value,
                window_width=config.scenedetect_window_width,
            ),
            start_in_scene=True,
        )
        return True, [scene[0].get_seconds() for scene in scenes[1:]]
    except (ImportError, OSError, ValueError, RuntimeError):
        return False, []
def _frame_metrics(video_path: str, config: AnalyzerConfig) -> dict[str, Any]:
    capture = cv2.VideoCapture(video_path)
    fps = _number(capture.get(cv2.CAP_PROP_FPS))
    frame_count = int(_number(capture.get(cv2.CAP_PROP_FRAME_COUNT)))
    duration = frame_count / fps if fps > 0 else 0.0
    width = int(_number(capture.get(cv2.CAP_PROP_FRAME_WIDTH)))
    height = int(_number(capture.get(cv2.CAP_PROP_FRAME_HEIGHT)))
    sample_step = max(1, int(round(fps / config.sample_fps))) if fps > 0 else 1
    times: list[float] = []
    sharpness: list[float] = []
    luma: list[float] = []
    motion: list[float] = []
    content_change: list[float] = []
    perceptual_hashes: list[int] = []
    previous_gray: np.ndarray | None = None
    previous_hist: np.ndarray | None = None
    histogram_sum: np.ndarray | None = None
    frame_index = 0
    while capture.isOpened():
        ok, frame = capture.read()
        if not ok:
            break
        if frame_index % sample_step != 0:
            frame_index += 1
            continue
        resized_height = max(2, int(round(frame.shape[0] * config.analysis_width / frame.shape[1])))
        resized = cv2.resize(frame, (config.analysis_width, resized_height), interpolation=cv2.INTER_AREA)
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV)
        histogram = cv2.calcHist([hsv], [0, 1], None, [32, 32], [0, 180, 0, 256])
        cv2.normalize(histogram, histogram)
        histogram_sum = histogram.copy() if histogram_sum is None else histogram_sum + histogram
        times.append(frame_index / fps if fps > 0 else 0.0)
        sharpness.append(float(cv2.Laplacian(gray, cv2.CV_64F).var()))
        luma.append(float(np.mean(gray)))
        motion.append(0.0 if previous_gray is None else float(np.mean(cv2.absdiff(gray, previous_gray))))
        content_change.append(0.0 if previous_hist is None else float(cv2.compareHist(previous_hist, histogram, cv2.HISTCMP_BHATTACHARYYA)))
        resized_hash_frame = cv2.resize(gray, (config.perceptual_hash_size + 1, config.perceptual_hash_size), interpolation=cv2.INTER_AREA)
        difference = resized_hash_frame[:, 1:] > resized_hash_frame[:, :-1]
        hash_value = 0
        for bit_index, enabled in enumerate(difference.flatten()):
            if enabled:
                hash_value |= 1 << bit_index
        perceptual_hashes.append(hash_value)
        previous_gray = gray
        previous_hist = histogram
        frame_index += 1
    capture.release()
    return {
        _CODE_TEXT.FPS: fps,
        _CODE_TEXT.FRAMECOUNT: frame_count,
        _CODE_TEXT.DURATION: duration,
        _CODE_TEXT.WIDTH: width,
        _CODE_TEXT.HEIGHT: height,
        _CODE_TEXT.SAMPLESTEP: sample_step,
        _CODE_TEXT.TIMES: times,
        _CODE_TEXT.SHARPNESS: sharpness,
        _CODE_TEXT.LUMA: luma,
        _CODE_TEXT.MOTION: motion,
        _CODE_TEXT.CONTENTCHANGE: content_change,
        _CODE_TEXT.PERCEPTUALHASHES: perceptual_hashes,
        _CODE_TEXT.VISUALFINGERPRINT: [] if histogram_sum is None else cv2.normalize(histogram_sum, histogram_sum).flatten().astype(float).tolist(),
    }
def _opencv_cut_boundaries(metrics: dict[str, Any], config: AnalyzerConfig) -> list[float]:
    changes = np.asarray(metrics[_CODE_TEXT.CONTENTCHANGE], dtype=np.float64)
    times = metrics[_CODE_TEXT.TIMES]
    if changes.size < 3:
        return []
    median = float(np.median(changes))
    deviation = float(np.median(np.abs(changes - median)))
    threshold = max(config.cut_threshold, median + config.adaptive_cut_sigma * deviation)
    boundaries: list[float] = []
    previous_boundary = 0.0
    for index, value in enumerate(changes):
        timestamp = times[index]
        if value >= threshold and timestamp - previous_boundary >= config.min_shot_seconds:
            boundaries.append(timestamp)
            previous_boundary = timestamp
    return boundaries
def _mean_between(values: list[float], times: list[float], start: float, end: float) -> float:
    selected = [value for value, timestamp in zip(values, times) if start <= timestamp <= end]
    return float(np.mean(selected)) if selected else 0.0
def _ratio_between(values: list[float], times: list[float], start: float, end: float, predicate: Any) -> float:
    selected = [value for value, timestamp in zip(values, times) if start <= timestamp <= end]
    return sum(1 for value in selected if predicate(value)) / len(selected) if selected else 0.0
def _window_score(metrics: dict[str, Any], start: float, end: float, config: AnalyzerConfig) -> float:
    times = metrics[_CODE_TEXT.TIMES]
    sharpness = _mean_between(metrics[_CODE_TEXT.SHARPNESS], times, start, end)
    motion = _mean_between(metrics[_CODE_TEXT.MOTION], times, start, end)
    luma = _mean_between(metrics[_CODE_TEXT.LUMA], times, start, end)
    sharpness_reference = float(np.quantile(metrics[_CODE_TEXT.SHARPNESS], config.sharpness_reference_quantile)) if metrics[_CODE_TEXT.SHARPNESS] else config.min_sharpness
    motion_reference = float(np.quantile(metrics[_CODE_TEXT.MOTION], config.motion_reference_quantile)) if metrics[_CODE_TEXT.MOTION] else config.low_motion_threshold
    sharpness_score = min(1.0, sharpness / max(sharpness_reference, config.min_sharpness))
    motion_score = min(1.0, motion / max(motion_reference, config.low_motion_threshold))
    exposure_score = max(0.0, 1.0 - abs(luma - config.exposure_midpoint) / config.exposure_midpoint)
    duplicate_ratio = _ratio_between(metrics[_CODE_TEXT.MOTION], times, start, end, lambda value: value <= config.duplicate_motion_threshold)
    return config.sharpness_weight * sharpness_score + config.motion_weight * motion_score + config.exposure_weight * exposure_score + config.uniqueness_weight * (1.0 - duplicate_ratio)
def _best_window(metrics: dict[str, Any], start: float, end: float, config: AnalyzerConfig) -> tuple[float, float, float]:
    duration = end - start
    if duration <= config.max_segment_seconds:
        return start, end, _window_score(metrics, start, end, config)
    sample_period = 1.0 / max(config.sample_fps, config.min_sample_fps)
    window_lengths = np.arange(config.min_selection_seconds, config.max_segment_seconds + config.segment_length_step_seconds, config.segment_length_step_seconds)
    scored: list[tuple[float, float, float]] = []
    for window_length in window_lengths:
        bounded_length = min(float(window_length), duration)
        candidates = np.arange(start, end - bounded_length + sample_period, sample_period)
        for candidate in candidates:
            candidate_start = float(candidate)
            quality_score = _window_score(metrics, candidate_start, candidate_start + bounded_length, config)
            duration_score = bounded_length / config.max_segment_seconds
            combined_score = config.visual_quality_weight * quality_score + config.duration_preservation_weight * duration_score
            scored.append((candidate_start, bounded_length, combined_score))
    best_start, best_length, best_score = max(scored, key=lambda item: item[2])
    return best_start, min(end, best_start + best_length), best_score
def _overlaps(range_start: float, range_end: float, ranges: list[list[float]]) -> bool:
    return any(range_start < other_end and range_end > other_start for other_start, other_end in ranges)
def _contains_speech(start: float, end: float, silence_ranges: list[list[float]], config: AnalyzerConfig) -> bool:
    covered = sum(max(0.0, min(end, silence_end) - max(start, silence_start)) for silence_start, silence_end in silence_ranges)
    return covered < (end - start) * config.dialogue_silence_ratio
def _protect_speech_window(start: float, end: float, shot_start: float, shot_end: float, silence_ranges: list[list[float]]) -> tuple[float, float]:
    cursor = shot_start
    speech_ranges: list[tuple[float, float]] = []
    for silence_start, silence_end in sorted(silence_ranges):
        bounded_silence_start = max(shot_start, min(shot_end, silence_start))
        bounded_silence_end = max(shot_start, min(shot_end, silence_end))
        if bounded_silence_start > cursor:
            speech_ranges.append((cursor, bounded_silence_start))
        cursor = max(cursor, bounded_silence_end)
    if cursor < shot_end:
        speech_ranges.append((cursor, shot_end))
    overlaps = [(speech_start, speech_end) for speech_start, speech_end in speech_ranges if speech_start < end and speech_end > start]
    if not overlaps:
        return start, end
    return min(start, overlaps[0][0]), max(end, overlaps[-1][1])
def _load_speech_model(config: AnalyzerConfig) -> Any | None:
    try:
        from faster_whisper import WhisperModel
        return WhisperModel(
            config.whisper_model,
            device=config.whisper_device,
            compute_type=config.whisper_compute_type,
            local_files_only=config.whisper_local_files_only,
        )
    except Exception:
        return None
def _detect_speech(
    video_path: str,
    speech_model: Any | None,
    speech_model_lock: Lock | None,
    dialogue_language: str,
    config: AnalyzerConfig,
) -> dict[str, Any]:
    if speech_model is None or speech_model_lock is None:
        return {_CODE_TEXT.RANGES: [], _CODE_TEXT.TRANSCRIPT: EMPTY_TEXT}
    try:
        with speech_model_lock:
            transcription_options: dict[str, Any] = {
                _CODE_TEXT.BEAM_SIZE: config.whisper_beam_size,
                _CODE_TEXT.VAD_FILTER: True,
                _CODE_TEXT.CONDITION_ON_PREVIOUS_TEXT: False,
            }
            if re.fullmatch(_CODE_TEXT.A_Z_2, dialogue_language):
                transcription_options[_CODE_TEXT.LANGUAGE] = dialogue_language
            segments, _ = speech_model.transcribe(
                video_path,
                **transcription_options,
            )
            detected_segments = list(segments)
        accepted_segments = [segment for segment in detected_segments if str(segment.text or EMPTY_TEXT).strip() and _number(segment.end) > _number(segment.start) and _number(segment.no_speech_prob, 1.0) <= config.whisper_no_speech_probability]
        return {
            _CODE_TEXT.RANGES: [[max(0.0, _number(segment.start)), max(0.0, _number(segment.end))] for segment in accepted_segments],
            _CODE_TEXT.TRANSCRIPT: _CODE_TEXT.SYMBOL_36A9E7.join(str(segment.text or EMPTY_TEXT).strip() for segment in accepted_segments),
        }
    except Exception:
        return {_CODE_TEXT.RANGES: [], _CODE_TEXT.TRANSCRIPT: EMPTY_TEXT}
def _hash_similarity(left: int, right: int, bit_count: int) -> float:
    return 1.0 - ((left ^ right).bit_count() / max(1, bit_count))
def _normalize_dialogue(value: str) -> str:
    normalized = unicodedata.normalize(_CODE_TEXT.NFKD, value.lower().replace(_CODE_TEXT.SYMBOL_BF502A, _CODE_TEXT.D_18AC3E))
    without_marks = "".join(character for character in normalized if not unicodedata.combining(character))
    return _CODE_TEXT.SYMBOL_36A9E7.join(re.sub(_CODE_TEXT.A_Z0_9, _CODE_TEXT.SYMBOL_36A9E7, without_marks).split())
def _dialogue_text_match_score(expected: str, recognized: str, config: AnalyzerConfig) -> float:
    normalized_expected = _normalize_dialogue(expected)
    normalized_recognized = _normalize_dialogue(recognized)
    if not normalized_expected or not normalized_recognized:
        return 0.0
    sequence_score = difflib.SequenceMatcher(None, normalized_expected, normalized_recognized).ratio()
    expected_tokens = set(normalized_expected.split())
    recognized_tokens = set(normalized_recognized.split())
    token_score = len(expected_tokens & recognized_tokens) / max(1, len(expected_tokens | recognized_tokens))
    return config.dialogue_sequence_match_weight * sequence_score + config.dialogue_token_match_weight * token_score
def _sample_sequence(values: list[int], sample_count: int) -> list[int]:
    if not values:
        return []
    if len(values) <= sample_count:
        return values
    indexes = np.linspace(0, len(values) - 1, sample_count).round().astype(int)
    return [values[index] for index in indexes]
def _perceptual_sequence_similarity(left: list[int], right: list[int], config: AnalyzerConfig) -> float:
    left_samples = _sample_sequence(left, config.perceptual_sequence_samples)
    right_samples = _sample_sequence(right, config.perceptual_sequence_samples)
    if not left_samples or not right_samples:
        return 0.0
    sample_count = min(len(left_samples), len(right_samples))
    left_samples = _sample_sequence(left_samples, sample_count)
    right_samples = _sample_sequence(right_samples, sample_count)
    bit_count = config.perceptual_hash_size * config.perceptual_hash_size
    return float(np.mean([_hash_similarity(left, right, bit_count) for left, right in zip(left_samples, right_samples)]))
def _segment_hashes(metrics: dict[str, Any], start: float, end: float) -> list[int]:
    return [value for value, timestamp in zip(metrics[_CODE_TEXT.PERCEPTUALHASHES], metrics[_CODE_TEXT.TIMES]) if start <= timestamp <= end]
def _merge_segments(segments: list[dict[str, Any]], config: AnalyzerConfig) -> list[dict[str, Any]]:
    merged: list[dict[str, Any]] = []
    for segment in sorted(segments, key=lambda item: (item[_CODE_TEXT.INSECONDS], item[_CODE_TEXT.OUTSECONDS])):
        previous = merged[-1] if merged else None
        if previous and segment[_CODE_TEXT.INSECONDS] <= previous[_CODE_TEXT.OUTSECONDS] + config.segment_merge_gap_seconds:
            previous[_CODE_TEXT.OUTSECONDS] = max(previous[_CODE_TEXT.OUTSECONDS], segment[_CODE_TEXT.OUTSECONDS])
            previous[_CODE_TEXT.CONTAINSDIALOGUE] = previous[_CODE_TEXT.CONTAINSDIALOGUE] or segment[_CODE_TEXT.CONTAINSDIALOGUE]
            previous[_CODE_TEXT.LIBRARYSCORE] = max(previous.get(_CODE_TEXT.LIBRARYSCORE, 0), segment.get(_CODE_TEXT.LIBRARYSCORE, 0))
            previous[_CODE_TEXT.PERCEPTUALHASHES_4FE704] = previous.get(_CODE_TEXT.PERCEPTUALHASHES_4FE704, []) + segment.get(_CODE_TEXT.PERCEPTUALHASHES_4FE704, [])
        else:
            merged.append(segment.copy())
    return merged
def _selected_duration(segments: list[dict[str, Any]]) -> float:
    return sum(max(0.0, segment[_CODE_TEXT.OUTSECONDS] - segment[_CODE_TEXT.INSECONDS]) for segment in segments)
def _select_fallback_segments(
    candidates: list[dict[str, Any]],
    safe_start: float,
    safe_end: float,
    protect_dialogue: bool,
    speech_analysis_available: bool,
    detected_speech_ranges: list[list[float]],
    metrics: dict[str, Any],
    config: AnalyzerConfig,
) -> list[dict[str, Any]]:
    if protect_dialogue and (not speech_analysis_available or not detected_speech_ranges):
        return [
            {
                _CODE_TEXT.SEGMENTID: _CODE_TEXT.DIALOGUE_SAFE_1,
                _CODE_TEXT.INSECONDS: round(safe_start, 3),
                _CODE_TEXT.OUTSECONDS: round(safe_end, 3),
                _CODE_TEXT.SHOTROLE: SHOT_ROLE_MASTER,
                _CODE_TEXT.STORYCONTRIBUTION: EMPTY_TEXT,
                _CODE_TEXT.TRANSITION: TRANSITION_CUT,
                _CODE_TEXT.AUDIOBRIDGEMODE: AUDIO_BRIDGE_HARD,
                _CODE_TEXT.CONTAINSDIALOGUE: True,
                _CODE_TEXT.LIBRARYSCORE: round(_window_score(metrics, safe_start, safe_end, config) * config.score_scale, 2),
                _CODE_TEXT.PERCEPTUALHASHES_4FE704: _segment_hashes(metrics, safe_start, safe_end),
            }
        ]
    if protect_dialogue and detected_speech_ranges:
        return [
            {
                _CODE_TEXT.SEGMENTID: _CODE_TEXT.DIALOGUE_SAFE_1,
                _CODE_TEXT.INSECONDS: round(safe_start, 3),
                _CODE_TEXT.OUTSECONDS: round(safe_end, 3),
                _CODE_TEXT.SHOTROLE: SHOT_ROLE_MASTER,
                _CODE_TEXT.STORYCONTRIBUTION: EMPTY_TEXT,
                _CODE_TEXT.TRANSITION: TRANSITION_CUT,
                _CODE_TEXT.AUDIOBRIDGEMODE: AUDIO_BRIDGE_HARD,
                _CODE_TEXT.CONTAINSDIALOGUE: True,
                _CODE_TEXT.LIBRARYSCORE: round(_window_score(metrics, safe_start, safe_end, config) * config.score_scale, 2),
                _CODE_TEXT.PERCEPTUALHASHES_4FE704: _segment_hashes(metrics, safe_start, safe_end),
            }
        ]
    if not candidates:
        return []
    duration_budget = max(config.min_selection_seconds, (safe_end - safe_start) * config.silent_selection_ratio)
    ranked = sorted(candidates, key=lambda item: item.get(_CODE_TEXT.LIBRARYSCORE, 0), reverse=True)
    selected: list[dict[str, Any]] = []
    for candidate in ranked:
        if len(selected) >= config.max_selected_segments:
            break
        repeated = any(_perceptual_sequence_similarity(candidate.get(_CODE_TEXT.PERCEPTUALHASHES_4FE704, []), kept.get(_CODE_TEXT.PERCEPTUALHASHES_4FE704, []), config) >= config.internal_segment_similarity_threshold for kept in selected)
        if repeated:
            continue
        candidate_duration = candidate[_CODE_TEXT.OUTSECONDS] - candidate[_CODE_TEXT.INSECONDS]
        if selected and _selected_duration(selected) + candidate_duration > duration_budget:
            continue
        selected.append(candidate)
    return sorted(selected or [ranked[0]], key=lambda item: item[_CODE_TEXT.INSECONDS])
def _resolve_crop(crops: list[tuple[int, int, int, int]], width: int, height: int, config: AnalyzerConfig) -> str:
    counts: dict[tuple[int, int, int, int], int] = {}
    for crop in crops:
        if crop[0] < width * config.embedded_border_ratio or crop[1] < height * config.embedded_border_ratio:
            counts[crop] = counts.get(crop, 0) + 1
    if not counts:
        return EMPTY_TEXT
    crop, observations = max(counts.items(), key=lambda item: item[1])
    return f'{crop[0]}{_CODE_TEXT.SYMBOL_E7AC07}{crop[1]}{_CODE_TEXT.SYMBOL_E7AC07}{crop[2]}{_CODE_TEXT.SYMBOL_E7AC07}{crop[3]}' if observations >= config.crop_min_observations else EMPTY_TEXT
def _missing_decision(scene_id: str) -> dict[str, Any]:
    return {
        _CODE_TEXT.SCENEID: scene_id,
        _CODE_TEXT.DURATION: 0.0,
        _CODE_TEXT.TRIMSTARTSECONDS: 0.0,
        _CODE_TEXT.TRIMENDSECONDS: 0.0,
        _CODE_TEXT.SOURCECROP: EMPTY_TEXT,
        _CODE_TEXT.WARNINGS: [WARNING_CLIP_MISSING],
        _CODE_TEXT.TAKEDECISION: TAKE_OMIT,
        _CODE_TEXT.REASON: REASON_MISSING,
        _CODE_TEXT.SEGMENTS: [],
        _CODE_TEXT.OBSERVEDSHOTCOUNT: 0,
        _CODE_TEXT.LIBRARY: LIBRARY_OPENCV,
        _CODE_TEXT.LIBRARYCONFIDENCE: 0.0,
        _CODE_TEXT.NEEDSAIREVIEW: True,
    }
def analyze_clip(
    clip: dict[str, Any],
    ffmpeg_path: str,
    config: AnalyzerConfig,
    speech_model: Any | None = None,
    speech_model_lock: Lock | None = None,
) -> dict[str, Any]:
    scene_id = str(clip.get(_CODE_TEXT.SCENEID, EMPTY_TEXT))
    video_path = str(clip.get(_CODE_TEXT.PATH, EMPTY_TEXT))
    if not video_path or not Path(video_path).is_file():
        return _missing_decision(scene_id)
    metrics = _frame_metrics(video_path, config)
    duration = metrics[_CODE_TEXT.DURATION]
    if duration <= 0:
        decision = _missing_decision(scene_id)
        decision.update({_CODE_TEXT.WARNINGS: [WARNING_INVALID_DURATION], _CODE_TEXT.REASON: REASON_INVALID})
        return decision
    has_audio = bool(clip.get(_CODE_TEXT.HASAUDIO, True))
    protect_dialogue = bool(clip.get(_CODE_TEXT.PROTECTDIALOGUE, False))
    narrative_role = str(clip.get(_CODE_TEXT.NARRATIVEROLE, EMPTY_TEXT)).strip().lower()
    protect_narrative = bool(clip.get(_CODE_TEXT.PROTECTNARRATIVE, False)) or narrative_role in NARRATIVE_ANCHOR_ROLES
    ffmpeg_metrics = _run_ffmpeg_probe(video_path, ffmpeg_path, config, has_audio, duration)
    speech_analysis = _detect_speech(video_path, speech_model, speech_model_lock, str(clip.get(_CODE_TEXT.DIALOGUELANGUAGE, EMPTY_TEXT)).lower(), config) if has_audio and protect_dialogue else {_CODE_TEXT.RANGES: [], _CODE_TEXT.TRANSCRIPT: EMPTY_TEXT}
    detected_speech_ranges = speech_analysis[_CODE_TEXT.RANGES]
    damaged_ranges = ffmpeg_metrics[_CODE_TEXT.BLACKRANGES] + ffmpeg_metrics[_CODE_TEXT.FREEZERANGES]
    safe_start, safe_end = _safe_edge_bounds(duration, damaged_ranges, config)
    opencv_boundaries = _opencv_cut_boundaries(metrics, config)
    scenedetect_available, scenedetect_boundaries = _detect_shots_with_scenedetect(video_path, config) if opencv_boundaries else (False, [])
    boundaries = scenedetect_boundaries if scenedetect_available else opencv_boundaries
    library = LIBRARY_PYSCENEDETECT if scenedetect_available else LIBRARY_OPENCV
    shot_edges = [safe_start] + [value for value in boundaries if safe_start + config.min_shot_seconds <= value <= safe_end - config.min_shot_seconds] + [safe_end]
    candidates: list[dict[str, Any]] = []
    for shot_index, (shot_start, shot_end) in enumerate(zip(shot_edges, shot_edges[1:]), start=1):
        if shot_end - shot_start < config.min_usable_seconds:
            continue
        segment_start, segment_end, score = _best_window(metrics, shot_start, shot_end, config)
        if has_audio and protect_dialogue:
            shot_speech_ranges = [speech_range for speech_range in detected_speech_ranges if _overlaps(shot_start, shot_end, [speech_range])]
            if shot_speech_ranges:
                speech_start = max(shot_start, min(speech_range[0] for speech_range in shot_speech_ranges) - config.dialogue_context_seconds)
                speech_end = min(shot_end, max(speech_range[1] for speech_range in shot_speech_ranges) + config.dialogue_context_seconds)
                segment_start = min(segment_start, speech_start)
                segment_end = max(segment_end, speech_end)
            elif not detected_speech_ranges:
                segment_start, segment_end = _protect_speech_window(
                    segment_start,
                    segment_end,
                    shot_start,
                    shot_end,
                    ffmpeg_metrics[_CODE_TEXT.SILENCERANGES],
                )
        if _overlaps(segment_start, segment_end, damaged_ranges):
            continue
        candidates.append(
            {
                _CODE_TEXT.SEGMENTID: f'{_CODE_TEXT.LIB}{shot_index}',
                _CODE_TEXT.INSECONDS: round(segment_start, 3),
                _CODE_TEXT.OUTSECONDS: round(segment_end, 3),
                _CODE_TEXT.SHOTROLE: SHOT_ROLE_MASTER,
                _CODE_TEXT.STORYCONTRIBUTION: EMPTY_TEXT,
                _CODE_TEXT.TRANSITION: TRANSITION_CUT,
                _CODE_TEXT.AUDIOBRIDGEMODE: AUDIO_BRIDGE_HARD if protect_dialogue or not has_audio else AUDIO_BRIDGE_AMBIENCE,
                _CODE_TEXT.CONTAINSDIALOGUE: protect_dialogue and (_overlaps(segment_start, segment_end, detected_speech_ranges) if detected_speech_ranges else _contains_speech(segment_start, segment_end, ffmpeg_metrics[_CODE_TEXT.SILENCERANGES], config)),
                _CODE_TEXT.LIBRARYSCORE: round(score * config.score_scale, 2),
                _CODE_TEXT.PERCEPTUALHASHES_4FE704: _segment_hashes(metrics, segment_start, segment_end),
            }
        )
    merged_candidates: list[dict[str, Any]] = []
    for candidate in candidates:
        if merged_candidates and candidate[_CODE_TEXT.INSECONDS] < merged_candidates[-1][_CODE_TEXT.OUTSECONDS]:
            previous = merged_candidates[-1]
            previous[_CODE_TEXT.OUTSECONDS] = max(previous[_CODE_TEXT.OUTSECONDS], candidate[_CODE_TEXT.OUTSECONDS])
            previous[_CODE_TEXT.CONTAINSDIALOGUE] = previous[_CODE_TEXT.CONTAINSDIALOGUE] or candidate[_CODE_TEXT.CONTAINSDIALOGUE]
            previous[_CODE_TEXT.PERCEPTUALHASHES_4FE704] = previous.get(_CODE_TEXT.PERCEPTUALHASHES_4FE704, []) + candidate.get(_CODE_TEXT.PERCEPTUALHASHES_4FE704, [])
        else:
            merged_candidates.append(candidate.copy())
    candidates = merged_candidates
    if protect_dialogue and detected_speech_ranges:
        for candidate in candidates:
            candidate[_CODE_TEXT.CONTAINSDIALOGUE] = False
        speech_candidates = _merge_segments(
            [
                {
                    _CODE_TEXT.SEGMENTID: f'{_CODE_TEXT.SPEECH}{speech_index}',
                    _CODE_TEXT.INSECONDS: round(max(safe_start, speech_start - config.dialogue_context_seconds), 3),
                    _CODE_TEXT.OUTSECONDS: round(min(safe_end, speech_end + config.dialogue_context_seconds), 3),
                    _CODE_TEXT.SHOTROLE: SHOT_ROLE_MASTER,
                    _CODE_TEXT.STORYCONTRIBUTION: EMPTY_TEXT,
                    _CODE_TEXT.TRANSITION: TRANSITION_CUT,
                    _CODE_TEXT.AUDIOBRIDGEMODE: AUDIO_BRIDGE_HARD,
                    _CODE_TEXT.CONTAINSDIALOGUE: True,
                    _CODE_TEXT.LIBRARYSCORE: round(
                        _window_score(
                            metrics,
                            max(safe_start, speech_start - config.dialogue_context_seconds),
                            min(safe_end, speech_end + config.dialogue_context_seconds),
                            config,
                        )
                        * config.score_scale,
                        2,
                    ),
                    _CODE_TEXT.PERCEPTUALHASHES_4FE704: _segment_hashes(
                        metrics,
                        max(safe_start, speech_start - config.dialogue_context_seconds),
                        min(safe_end, speech_end + config.dialogue_context_seconds),
                    ),
                }
                for speech_index, (speech_start, speech_end) in enumerate(detected_speech_ranges, start=1)
                if speech_end > speech_start
            ],
            config,
        )
        for speech_index, candidate in enumerate(speech_candidates, start=1):
            candidate[_CODE_TEXT.SEGMENTID] = f'{_CODE_TEXT.SPEECH}{speech_index}'
        candidates.extend(speech_candidates)
    selected_segments = _select_fallback_segments(
        candidates,
        safe_start,
        safe_end,
        protect_dialogue,
        speech_model is not None,
        detected_speech_ranges,
        metrics,
        config,
    )
    if protect_dialogue and not detected_speech_ranges:
        candidates = [segment.copy() for segment in selected_segments]
    elif not protect_dialogue:
        candidate_ids = {segment[_CODE_TEXT.SEGMENTID] for segment in candidates}
        candidates.extend(segment.copy() for segment in selected_segments if segment[_CODE_TEXT.SEGMENTID] not in candidate_ids)
    warnings: list[str] = []
    if ffmpeg_metrics[_CODE_TEXT.BLACKRANGES]:
        warnings.append(WARNING_BLACK)
    if ffmpeg_metrics[_CODE_TEXT.FREEZERANGES]:
        warnings.append(WARNING_FREEZE)
    source_crop = _resolve_crop(ffmpeg_metrics[_CODE_TEXT.CROPS], metrics[_CODE_TEXT.WIDTH], metrics[_CODE_TEXT.HEIGHT], config)
    if source_crop:
        warnings.append(WARNING_BORDER)
    average_sharpness = float(np.mean(metrics[_CODE_TEXT.SHARPNESS])) if metrics[_CODE_TEXT.SHARPNESS] else 0.0
    average_motion = float(np.mean(metrics[_CODE_TEXT.MOTION])) if metrics[_CODE_TEXT.MOTION] else 0.0
    duplicate_ratio = sum(1 for value in metrics[_CODE_TEXT.MOTION] if value <= config.duplicate_motion_threshold) / len(metrics[_CODE_TEXT.MOTION]) if metrics[_CODE_TEXT.MOTION] else 1.0
    if average_sharpness < config.min_sharpness:
        warnings.append(WARNING_LOW_SHARPNESS)
    if average_motion < config.low_motion_threshold:
        warnings.append(WARNING_LOW_MOTION)
    if duplicate_ratio >= config.duplicate_warning_ratio:
        warnings.append(WARNING_DUPLICATE_FRAMES)
    if not selected_segments:
        take_decision = TAKE_OMIT
        reason = REASON_UNUSABLE
        trim_start = safe_start
        trim_end = max(0.0, duration - safe_end)
        confidence = 0.0
    else:
        first_start = min(segment[_CODE_TEXT.INSECONDS] for segment in selected_segments)
        last_end = max(segment[_CODE_TEXT.OUTSECONDS] for segment in selected_segments)
        trim_start = first_start
        trim_end = max(0.0, duration - last_end)
        take_decision = TAKE_TRIM if trim_start > 0 or trim_end > 0 or source_crop else TAKE_USE
        reason = REASON_LIBRARY
        confidence = float(np.mean([segment[_CODE_TEXT.LIBRARYSCORE] for segment in selected_segments]))
    speech_duration = sum(max(0.0, speech_end - speech_start) for speech_start, speech_end in detected_speech_ranges)
    covered_speech_duration = sum(max(0.0, min(segment[_CODE_TEXT.OUTSECONDS], speech_end) - max(segment[_CODE_TEXT.INSECONDS], speech_start)) for segment in selected_segments for speech_start, speech_end in detected_speech_ranges)
    dialogue_coverage_ratio = min(1.0, covered_speech_duration / speech_duration) if speech_duration > 0 else (1.0 if protect_dialogue and selected_segments else 0.0)
    expected_dialogue = str(clip.get(_CODE_TEXT.EXPECTEDDIALOGUE, EMPTY_TEXT)).strip()
    recognized_transcript = str(speech_analysis[_CODE_TEXT.TRANSCRIPT]).strip()
    dialogue_text_match_score = _dialogue_text_match_score(expected_dialogue, recognized_transcript, config)
    dialogue_mismatch = bool(protect_dialogue and expected_dialogue and recognized_transcript and dialogue_text_match_score < config.dialogue_text_match_threshold)
    if dialogue_mismatch:
        warnings.append(WARNING_DIALOGUE_MISMATCH)
    public_candidates = [{key: value for key, value in segment.items() if not key.startswith(_CODE_TEXT.SYMBOL_D2E2AD)} for segment in candidates]
    public_selected_segments = [{key: value for key, value in segment.items() if not key.startswith(_CODE_TEXT.SYMBOL_D2E2AD)} for segment in selected_segments]
    return {
        _CODE_TEXT.SCENEID: scene_id,
        _CODE_TEXT.DURATION: round(duration, 3),
        _CODE_TEXT.WIDTH: metrics[_CODE_TEXT.WIDTH],
        _CODE_TEXT.HEIGHT: metrics[_CODE_TEXT.HEIGHT],
        _CODE_TEXT.HASAUDIO: has_audio,
        _CODE_TEXT.TRIMSTARTSECONDS: round(trim_start, 3),
        _CODE_TEXT.TRIMENDSECONDS: round(trim_end, 3),
        _CODE_TEXT.SOURCECROP: source_crop,
        _CODE_TEXT.WARNINGS: warnings,
        _CODE_TEXT.TAKEDECISION: take_decision,
        _CODE_TEXT.REASON: reason,
        _CODE_TEXT.SEGMENTS: public_selected_segments,
        _CODE_TEXT.CANDIDATESEGMENTS: public_candidates,
        _CODE_TEXT.SHOTBOUNDARIES: [round(value, 3) for value in boundaries],
        _CODE_TEXT.OBSERVEDSHOTCOUNT: max(1, len(shot_edges) - 1),
        _CODE_TEXT.SHARPNESSSCORE: round(min(config.score_scale, average_sharpness / max(config.min_sharpness, 1.0) * config.score_scale), 2),
        _CODE_TEXT.MOTIONSCORE: round(min(config.score_scale, average_motion / max(config.low_motion_threshold, 0.01) * config.score_scale), 2),
        _CODE_TEXT.SHARPNESSRAW: round(average_sharpness, 4),
        _CODE_TEXT.MOTIONRAW: round(average_motion, 4),
        _CODE_TEXT.DUPLICATEFRAMERATIO: round(duplicate_ratio, 4),
        _CODE_TEXT.LIBRARY: library,
        _CODE_TEXT.LIBRARYCONFIDENCE: round(confidence, 2),
        _CODE_TEXT.NEEDSAIREVIEW: confidence < config.ai_review_confidence or len(candidates) > 1,
        _CODE_TEXT.SPEECHANALYSISAVAILABLE: bool(speech_model) if protect_dialogue else False,
        _CODE_TEXT.DETECTEDSPEECHRANGES: [[round(value, 3) for value in speech_range] for speech_range in detected_speech_ranges],
        _CODE_TEXT.RECOGNIZEDTRANSCRIPT: recognized_transcript,
        _CODE_TEXT.DIALOGUECOVERAGERATIO: round(dialogue_coverage_ratio, 4),
        _CODE_TEXT.DIALOGUETEXTMATCHSCORE: round(dialogue_text_match_score * config.score_scale, 2),
        _CODE_TEXT.DIALOGUEMISMATCH: dialogue_mismatch,
        _CODE_TEXT.NARRATIVEROLE: narrative_role,
        _CODE_TEXT.PROTECTNARRATIVE: protect_narrative,
        _CODE_TEXT.SELECTEDDURATION: round(_selected_duration(selected_segments), 3),
        _CODE_TEXT.ANALYSISPROVENANCE: list(dict.fromkeys([LIBRARY_OPENCV, library, _CODE_TEXT.FASTER_WHISPER if speech_model is not None and protect_dialogue else _CODE_TEXT.FFMPEG_SILENCEDETECT])),
        _CODE_TEXT.VISUALFINGERPRINT_EE05CB: metrics[_CODE_TEXT.VISUALFINGERPRINT],
        _CODE_TEXT.PERCEPTUALSEQUENCE: metrics[_CODE_TEXT.PERCEPTUALHASHES],
        _CODE_TEXT.PROTECTDIALOGUE_B1A194: protect_dialogue,
    }
def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or len(left) != len(right):
        return 0.0
    left_array = np.asarray(left, dtype=np.float64)
    right_array = np.asarray(right, dtype=np.float64)
    denominator = float(np.linalg.norm(left_array) * np.linalg.norm(right_array))
    return float(np.dot(left_array, right_array) / denominator) if denominator > 0 else 0.0
def _mark_visually_similar_clips(decisions: list[dict[str, Any]], config: AnalyzerConfig) -> None:
    for current_index, current in enumerate(decisions):
        current_fingerprint = current.get(_CODE_TEXT.VISUALFINGERPRINT_EE05CB, [])
        current_sequence = current.get(_CODE_TEXT.PERCEPTUALSEQUENCE, [])
        best_match: tuple[dict[str, Any] | None, float, float] = (None, 0.0, 0.0)
        for previous in decisions[:current_index]:
            histogram_similarity = _cosine_similarity(current_fingerprint, previous.get(_CODE_TEXT.VISUALFINGERPRINT_EE05CB, []))
            perceptual_similarity = _perceptual_sequence_similarity(current_sequence, previous.get(_CODE_TEXT.PERCEPTUALSEQUENCE, []), config)
            if histogram_similarity + perceptual_similarity > best_match[1] + best_match[2]:
                best_match = (previous, histogram_similarity, perceptual_similarity)
        repeated_visual = best_match[0] is not None and best_match[1] >= config.duplicate_clip_similarity_threshold and best_match[2] >= config.duplicate_clip_perceptual_threshold
        if repeated_visual:
            current[_CODE_TEXT.WARNINGS] = list(dict.fromkeys(current.get(_CODE_TEXT.WARNINGS, []) + [WARNING_SIMILAR_CLIP]))
            current[_CODE_TEXT.VISUALLYSIMILARTOSCENEID] = best_match[0][_CODE_TEXT.SCENEID]
            current[_CODE_TEXT.VISUALSIMILARITYSCORE] = round(best_match[2] * config.score_scale, 2)
            current[_CODE_TEXT.NEEDSAIREVIEW] = True
            if best_match[2] >= config.duplicate_clip_auto_omit_threshold and not current.get(_CODE_TEXT.PROTECTDIALOGUE_B1A194, False):
                current[_CODE_TEXT.WARNINGS] = list(dict.fromkeys(current[_CODE_TEXT.WARNINGS] + [WARNING_REPEATED_CLIP_OMITTED]))
                current[_CODE_TEXT.TAKEDECISION] = TAKE_OMIT
                current[_CODE_TEXT.REASON] = REASON_REPEATED
                current[_CODE_TEXT.SEGMENTS] = []
                current[_CODE_TEXT.SELECTEDDURATION] = 0.0
    for decision in decisions:
        decision.pop(_CODE_TEXT.VISUALFINGERPRINT_EE05CB, None)
        decision.pop(_CODE_TEXT.PERCEPTUALSEQUENCE, None)
        decision.pop(_CODE_TEXT.PROTECTDIALOGUE_B1A194, None)
def main() -> int:
    if len(sys.argv) != 2:
        return 2
    payload = json.loads(Path(sys.argv[1]).read_text(encoding=INPUT_ENCODING))
    config = AnalyzerConfig.from_payload(payload[_CODE_TEXT.CONFIG])
    ffmpeg_path = str(payload[_CODE_TEXT.FFMPEGPATH])
    clips = payload.get(_CODE_TEXT.CLIPS, [])
    needs_speech_analysis = any(bool(clip.get(_CODE_TEXT.HASAUDIO, True)) and bool(clip.get(_CODE_TEXT.PROTECTDIALOGUE, False)) for clip in clips)
    speech_model = _load_speech_model(config) if needs_speech_analysis else None
    speech_model_lock = Lock() if speech_model is not None else None
    with ThreadPoolExecutor(max_workers=config.max_workers) as executor:
        decisions = list(
            executor.map(
                lambda clip: analyze_clip(clip, ffmpeg_path, config, speech_model, speech_model_lock),
                clips,
            )
        )
    _mark_visually_similar_clips(decisions, config)
    result = {_CODE_TEXT.SUCCESS: True, _CODE_TEXT.LIBRARYANALYSISAVAILABLE: bool(decisions), _CODE_TEXT.DECISIONS: decisions}
    sys.stdout.buffer.write(json.dumps(result, ensure_ascii=False, separators=JSON_SEPARATORS).encode(INPUT_ENCODING))
    return 0
if __name__ == _CODE_TEXT.MAIN:
    raise SystemExit(main())
