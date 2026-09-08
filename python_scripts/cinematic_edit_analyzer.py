from __future__ import annotations

import json
import math
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np


INPUT_ENCODING = "utf-8"
JSON_SEPARATORS = (",", ":")
PROCESS_ENCODING = "utf-8"
PROCESS_ERROR_MODE = "replace"
FFMPEG_NULL_TARGET = "NUL" if sys.platform == "win32" else "/dev/null"
FFMPEG_VIDEO_FILTER = "blackdetect=d={black_duration}:pix_th={black_pixel_threshold},freezedetect=n={freeze_noise}:d={freeze_duration},cropdetect=limit={crop_limit}:round={crop_round}:reset=0"
FFMPEG_AUDIO_FILTER = "silencedetect=n={silence_noise}:d={silence_duration}"
BLACK_RANGE_PATTERN = re.compile(r"black_start:([\d.]+)\s+black_end:([\d.]+)")
FREEZE_START_PATTERN = re.compile(r"freeze_start:\s*([\d.]+)")
FREEZE_END_PATTERN = re.compile(r"freeze_end:\s*([\d.]+)")
SILENCE_START_PATTERN = re.compile(r"silence_start:\s*([\d.]+)")
SILENCE_END_PATTERN = re.compile(r"silence_end:\s*([\d.]+)")
CROP_PATTERN = re.compile(r"crop=(\d+):(\d+):(\d+):(\d+)")
LIBRARY_OPENCV = "opencv"
LIBRARY_PYSCENEDETECT = "pyscenedetect"
TAKE_USE = "use"
TAKE_TRIM = "trim"
TAKE_OMIT = "omit"
SHOT_ROLE_MASTER = "master"
TRANSITION_CUT = "cut"
AUDIO_BRIDGE_HARD = "hard"
WARNING_CLIP_MISSING = "clip_missing"
WARNING_INVALID_DURATION = "invalid_duration"
WARNING_BLACK = "black_frames_detected"
WARNING_FREEZE = "freeze_detected"
WARNING_BORDER = "embedded_border_detected"
WARNING_LOW_SHARPNESS = "low_sharpness"
WARNING_LOW_MOTION = "low_motion"
WARNING_DUPLICATE_FRAMES = "duplicate_frames"
WARNING_SIMILAR_CLIP = "possible_repeated_visual_content"
REASON_MISSING = "clip_missing"
REASON_INVALID = "invalid_duration"
REASON_UNUSABLE = "insufficient_usable_duration_after_library_analysis"
REASON_LIBRARY = "library_selected_clean_visual_span"
EMPTY_TEXT = ""


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
    duplicate_warning_ratio: float
    ai_review_confidence: float
    score_scale: float
    min_sample_fps: float
    duplicate_clip_similarity_threshold: float
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
    command = [ffmpeg_path, "-hide_banner", "-i", video_path, "-vf", video_filter]
    if has_audio:
        command.extend(["-af", FFMPEG_AUDIO_FILTER.format(silence_noise=config.silence_noise, silence_duration=config.silence_duration)])
    command.extend(["-f", "null", FFMPEG_NULL_TARGET])
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
    return {"blackRanges": black_ranges, "freezeRanges": freeze_ranges, "silenceRanges": silence_ranges, "crops": crops}


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
        previous_gray = gray
        previous_hist = histogram
        frame_index += 1
    capture.release()
    return {
        "fps": fps,
        "frameCount": frame_count,
        "duration": duration,
        "width": width,
        "height": height,
        "sampleStep": sample_step,
        "times": times,
        "sharpness": sharpness,
        "luma": luma,
        "motion": motion,
        "contentChange": content_change,
        "visualFingerprint": [] if histogram_sum is None else cv2.normalize(histogram_sum, histogram_sum).flatten().astype(float).tolist(),
    }


def _opencv_cut_boundaries(metrics: dict[str, Any], config: AnalyzerConfig) -> list[float]:
    changes = np.asarray(metrics["contentChange"], dtype=np.float64)
    times = metrics["times"]
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
    times = metrics["times"]
    sharpness = _mean_between(metrics["sharpness"], times, start, end)
    motion = _mean_between(metrics["motion"], times, start, end)
    luma = _mean_between(metrics["luma"], times, start, end)
    sharpness_reference = float(np.quantile(metrics["sharpness"], config.sharpness_reference_quantile)) if metrics["sharpness"] else config.min_sharpness
    motion_reference = float(np.quantile(metrics["motion"], config.motion_reference_quantile)) if metrics["motion"] else config.low_motion_threshold
    sharpness_score = min(1.0, sharpness / max(sharpness_reference, config.min_sharpness))
    motion_score = min(1.0, motion / max(motion_reference, config.low_motion_threshold))
    exposure_score = max(0.0, 1.0 - abs(luma - config.exposure_midpoint) / config.exposure_midpoint)
    duplicate_ratio = _ratio_between(metrics["motion"], times, start, end, lambda value: value <= config.duplicate_motion_threshold)
    return (
        config.sharpness_weight * sharpness_score
        + config.motion_weight * motion_score
        + config.exposure_weight * exposure_score
        + config.uniqueness_weight * (1.0 - duplicate_ratio)
    )


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


def _resolve_crop(crops: list[tuple[int, int, int, int]], width: int, height: int, config: AnalyzerConfig) -> str:
    counts: dict[tuple[int, int, int, int], int] = {}
    for crop in crops:
        if crop[0] < width * config.embedded_border_ratio or crop[1] < height * config.embedded_border_ratio:
            counts[crop] = counts.get(crop, 0) + 1
    if not counts:
        return EMPTY_TEXT
    crop, observations = max(counts.items(), key=lambda item: item[1])
    return f"{crop[0]}:{crop[1]}:{crop[2]}:{crop[3]}" if observations >= config.crop_min_observations else EMPTY_TEXT


def _missing_decision(scene_id: str) -> dict[str, Any]:
    return {
        "sceneId": scene_id,
        "duration": 0.0,
        "trimStartSeconds": 0.0,
        "trimEndSeconds": 0.0,
        "sourceCrop": EMPTY_TEXT,
        "warnings": [WARNING_CLIP_MISSING],
        "takeDecision": TAKE_OMIT,
        "reason": REASON_MISSING,
        "segments": [],
        "observedShotCount": 0,
        "library": LIBRARY_OPENCV,
        "libraryConfidence": 0.0,
        "needsAiReview": True,
    }


def analyze_clip(clip: dict[str, Any], ffmpeg_path: str, config: AnalyzerConfig) -> dict[str, Any]:
    scene_id = str(clip.get("sceneId", EMPTY_TEXT))
    video_path = str(clip.get("path", EMPTY_TEXT))
    if not video_path or not Path(video_path).is_file():
        return _missing_decision(scene_id)
    metrics = _frame_metrics(video_path, config)
    duration = metrics["duration"]
    if duration <= 0:
        decision = _missing_decision(scene_id)
        decision.update({"warnings": [WARNING_INVALID_DURATION], "reason": REASON_INVALID})
        return decision
    has_audio = bool(clip.get("hasAudio", True))
    protect_dialogue = bool(clip.get("protectDialogue", False))
    ffmpeg_metrics = _run_ffmpeg_probe(video_path, ffmpeg_path, config, has_audio, duration)
    damaged_ranges = ffmpeg_metrics["blackRanges"] + ffmpeg_metrics["freezeRanges"]
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
        if has_audio:
            segment_start, segment_end = _protect_speech_window(
                segment_start,
                segment_end,
                0.0,
                duration,
                ffmpeg_metrics["silenceRanges"],
            )
        if _overlaps(segment_start, segment_end, damaged_ranges):
            continue
        candidates.append(
            {
                "segmentId": f"lib_{shot_index}",
                "inSeconds": round(segment_start, 3),
                "outSeconds": round(segment_end, 3),
                "shotRole": SHOT_ROLE_MASTER,
                "storyContribution": EMPTY_TEXT,
                "transition": TRANSITION_CUT,
                "audioBridgeMode": AUDIO_BRIDGE_HARD,
                "containsDialogue": protect_dialogue and _contains_speech(segment_start, segment_end, ffmpeg_metrics["silenceRanges"], config),
                "libraryScore": round(score * config.score_scale, 2),
            }
        )
    # Speech/sound can span camera cuts. Merge overlapping protected windows
    # so they cannot replay the same words when selected consecutively.
    merged_candidates: list[dict[str, Any]] = []
    for candidate in candidates:
        if merged_candidates and candidate["inSeconds"] <= merged_candidates[-1]["outSeconds"]:
            previous = merged_candidates[-1]
            previous["outSeconds"] = max(previous["outSeconds"], candidate["outSeconds"])
            previous["containsDialogue"] = previous["containsDialogue"] or candidate["containsDialogue"]
        else:
            merged_candidates.append(candidate.copy())
    candidates = merged_candidates
    warnings: list[str] = []
    if ffmpeg_metrics["blackRanges"]:
        warnings.append(WARNING_BLACK)
    if ffmpeg_metrics["freezeRanges"]:
        warnings.append(WARNING_FREEZE)
    source_crop = _resolve_crop(ffmpeg_metrics["crops"], metrics["width"], metrics["height"], config)
    if source_crop:
        warnings.append(WARNING_BORDER)
    average_sharpness = float(np.mean(metrics["sharpness"])) if metrics["sharpness"] else 0.0
    average_motion = float(np.mean(metrics["motion"])) if metrics["motion"] else 0.0
    duplicate_ratio = sum(1 for value in metrics["motion"] if value <= config.duplicate_motion_threshold) / len(metrics["motion"]) if metrics["motion"] else 1.0
    if average_sharpness < config.min_sharpness:
        warnings.append(WARNING_LOW_SHARPNESS)
    if average_motion < config.low_motion_threshold:
        warnings.append(WARNING_LOW_MOTION)
    if duplicate_ratio >= config.duplicate_warning_ratio:
        warnings.append(WARNING_DUPLICATE_FRAMES)
    if not candidates:
        take_decision = TAKE_OMIT
        reason = REASON_UNUSABLE
        trim_start = safe_start
        trim_end = max(0.0, duration - safe_end)
        confidence = 0.0
    else:
        first_start = min(segment["inSeconds"] for segment in candidates)
        last_end = max(segment["outSeconds"] for segment in candidates)
        trim_start = first_start
        trim_end = max(0.0, duration - last_end)
        take_decision = TAKE_TRIM if trim_start > 0 or trim_end > 0 or source_crop else TAKE_USE
        reason = REASON_LIBRARY
        confidence = float(np.mean([segment["libraryScore"] for segment in candidates]))
    return {
        "sceneId": scene_id,
        "duration": round(duration, 3),
        "width": metrics["width"],
        "height": metrics["height"],
        "hasAudio": has_audio,
        "trimStartSeconds": round(trim_start, 3),
        "trimEndSeconds": round(trim_end, 3),
        "sourceCrop": source_crop,
        "warnings": warnings,
        "takeDecision": take_decision,
        "reason": reason,
        "segments": candidates,
        "candidateSegments": candidates,
        "shotBoundaries": [round(value, 3) for value in boundaries],
        "observedShotCount": max(1, len(shot_edges) - 1),
        "sharpnessScore": round(min(config.score_scale, average_sharpness / max(config.min_sharpness, 1.0) * config.score_scale), 2),
        "motionScore": round(min(config.score_scale, average_motion / max(config.low_motion_threshold, 0.01) * config.score_scale), 2),
        "sharpnessRaw": round(average_sharpness, 4),
        "motionRaw": round(average_motion, 4),
        "duplicateFrameRatio": round(duplicate_ratio, 4),
        "library": library,
        "libraryConfidence": round(confidence, 2),
        "needsAiReview": confidence < config.ai_review_confidence or len(candidates) > 1,
        "_visualFingerprint": metrics["visualFingerprint"],
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
        current_fingerprint = current.get("_visualFingerprint", [])
        best_match: tuple[dict[str, Any] | None, float] = (None, 0.0)
        for previous in decisions[:current_index]:
            similarity = _cosine_similarity(current_fingerprint, previous.get("_visualFingerprint", []))
            if similarity > best_match[1]:
                best_match = (previous, similarity)
        if best_match[0] is not None and best_match[1] >= config.duplicate_clip_similarity_threshold:
            current["warnings"] = list(dict.fromkeys(current.get("warnings", []) + [WARNING_SIMILAR_CLIP]))
            current["visuallySimilarToSceneId"] = best_match[0]["sceneId"]
            current["visualSimilarityScore"] = round(best_match[1] * config.score_scale, 2)
            current["needsAiReview"] = True
    for decision in decisions:
        decision.pop("_visualFingerprint", None)


def main() -> int:
    if len(sys.argv) != 2:
        return 2
    payload = json.loads(Path(sys.argv[1]).read_text(encoding=INPUT_ENCODING))
    config = AnalyzerConfig.from_payload(payload["config"])
    ffmpeg_path = str(payload["ffmpegPath"])
    clips = payload.get("clips", [])
    with ThreadPoolExecutor(max_workers=config.max_workers) as executor:
        decisions = list(executor.map(lambda clip: analyze_clip(clip, ffmpeg_path, config), clips))
    _mark_visually_similar_clips(decisions, config)
    result = {"success": True, "libraryAnalysisAvailable": bool(decisions), "decisions": decisions}
    sys.stdout.write(json.dumps(result, ensure_ascii=False, separators=JSON_SEPARATORS))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
