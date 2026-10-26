import motion_vieneu_texts as T
from motion_vieneu_speech import synthesize_texts
import contextlib
import io
import json
import os
import sys
import traceback
from pathlib import Path
from typing import TypedDict
class TranscriptWord(TypedDict):
    w: str
    s: float
    e: float
for stream in (sys.stdout, sys.stdin, sys.stderr):
    if isinstance(stream, io.TextIOWrapper):
        stream.reconfigure(encoding=T.UTF_8)
root = Path(sys.argv[1]).resolve()
model_dir = sys.argv[2] if len(sys.argv) > 2 else None
root.mkdir(parents=True, exist_ok=True)
os.environ[T.HF_HOME] = str(root / T.MODELS)
os.environ[T.HF_HUB_DISABLE_PROGRESS_BARS] = T.VALUE_1
os.environ[T.HF_HUB_DOWNLOAD_TIMEOUT] = T.VALUE_300
engine = None
recognizers = {}
def execute(request):
    global engine
    import importlib.resources
    if request[T.COMMAND] == T.VOICES:
        asset = importlib.resources.files(T.VIENEU).joinpath(T.ASSETS_VOICES_V3_TURBO_JSON)
        data = json.loads(asset.read_text(encoding=T.UTF_8))
        saved = root / T.VOICES_V3_TURBO_JSON
        if saved.exists():
            data[T.PRESETS].update(json.loads(saved.read_text(encoding=T.UTF_8))[T.PRESETS])
        return [{T.ID: name, T.NAME: value.get(T.DESCRIPTION, name) if name.startswith(T.CUSTOM) else name, T.GENDER: value.get(T.GENDER, T.EMPTY_2), T.DESCRIPTION: value.get(T.DESCRIPTION, T.EMPTY_2)} for name, value in data[T.PRESETS].items()]
    if request[T.COMMAND] == T.TRANSCRIBE:
        source = Path(request[T.FILE]).resolve()
        if not source.is_file() or source.suffix != T.WAV:
            raise ValueError(T.INVALID_ASR_SOURCE)
        from faster_whisper import WhisperModel
        name = str(request.get(T.MODEL) or T.ASR_DEFAULT_MODEL)
        if name not in recognizers:
            recognizers[name] = WhisperModel(name, device=T.ASR_DEVICE, compute_type=T.ASR_COMPUTE, download_root=str(root / T.MODELS))
        segments, _ = recognizers[name].transcribe(str(source), language=request.get(T.LANGUAGE) or None, word_timestamps=True, beam_size=T.ASR_BEAM, vad_filter=False, condition_on_previous_text=False)
        words: list[TranscriptWord] = []
        for segment in segments:
            for word in segment.words or []:
                words.append({T.WORD_TEXT: word.word.strip(), T.WORD_START: round(float(word.start), 3), T.WORD_END: round(float(word.end), 3)})
        return {T.TEXT: T.SPACE.join(item[T.WORD_TEXT] for item in words), T.WORDS: words}
    from vieneu import Vieneu
    import numpy as np
    import soundfile as sf
    if engine is None and model_dir:
        engine = Vieneu(mode=T.V3TURBO, backbone_repo=model_dir, backend=T.PYTORCH, max_batch_size=8, babble_retries=1)
    if engine is None:
        from huggingface_hub import hf_hub_download
        from vieneu._v3_turbo_engine.onnx_runtime_lite import OnnxV3LiteEngine
        def fetch_local(repo, files, subfolder=None):
            directory = root / T.RESOLVED_MODELS / repo.replace(T.EMPTY_3, T.EMPTY_4)
            for name in files:
                hf_hub_download(repo, (subfolder + T.EMPTY_3 if subfolder else T.EMPTY_2) + name, local_dir=str(directory))
            return directory / subfolder if subfolder else directory
        OnnxV3LiteEngine._fetch = staticmethod(fetch_local)
        engine = Vieneu(mode=T.V3TURBO, backend=os.environ.get(T.MOTION_VIENEU_BACKEND, T.AUTO), precision=T.FP32, max_batch_size=8, babble_retries=1)
        engine._load_repo_voices(str(root))
    if request[T.COMMAND] == T.REGISTER:
        source = Path(request[T.FILE]).resolve()
        if not source.is_relative_to(root):
            raise ValueError(T.INVALID_REFERENCE_SOURCE)
        engine.add_voice(request[T.VOICE], str(source), denoise=request.get(T.DENOISE, True) is not False, description=request.get(T.NAME, T.EMPTY_2), gender=request.get(T.GENDER, T.EMPTY_2))
        temporary = root / T.VOICES_V3_TURBO_JSON_TMP
        engine.save_voices(str(temporary))
        temporary.replace(root / T.VOICES_V3_TURBO_JSON)
        return {T.ID: request[T.VOICE], T.NAME: request.get(T.NAME, request[T.VOICE]), T.GENDER: request.get(T.GENDER, T.EMPTY_2)}
    delivery = {}
    if request.get(T.TEMPERATURE) is not None:
        delivery[T.TEMPERATURE] = min(1.0, max(0.5, float(request[T.TEMPERATURE])))
    if request.get(T.SILENCE) is not None:
        delivery[T.SILENCE_P] = min(0.4, max(0.05, float(request[T.SILENCE])))
    def checked(item):
        text = str(item.get(T.TEXT, T.EMPTY_2)).strip()
        if not text or len(text) > 1800:
            raise ValueError(T.INVALID_SPEECH_TEXT)
        target = Path(item[T.FILE]).resolve()
        if not target.is_relative_to(root) or target.suffix != T.WAV:
            raise ValueError(T.INVALID_SPEECH_DESTINATION)
        return text, target
    def save(raw, target):
        wav = np.asarray(raw, dtype=np.float32).reshape(-1)
        if not wav.size or not np.isfinite(wav).all() or np.max(np.abs(wav)) < 0.0001:
            raise ValueError(T.EMPTY_SPEECH_AUDIO)
        target.parent.mkdir(parents=True, exist_ok=True)
        sf.write(str(target), wav, engine.sample_rate, subtype=T.PCM_16)
        return {T.SECONDS: wav.size / engine.sample_rate, T.SAMPLE_RATE: engine.sample_rate, T.BACKEND: engine.backend}
    if request[T.COMMAND] == T.BATCH:
        results = [None] * len(request[T.ITEMS])
        ready = []
        for index, item in enumerate(request[T.ITEMS]):
            try:
                ready.append((index,) + checked(item))
            except Exception as error:
                results[index] = {T.ERROR: str(error)}
        if ready:
            wavs = synthesize_texts(engine, [text for _, text, _ in ready], request[T.VOICE], delivery, request.get(T.PAUSES))
            for (index, _, target), raw in zip(ready, wavs):
                try:
                    results[index] = save(raw, target)
                except Exception as error:
                    results[index] = {T.ERROR: str(error)}
        return results
    text, target = checked(request)
    return save(synthesize_texts(engine, [text], request[T.VOICE], delivery, request.get(T.PAUSES))[0], target)
for line in sys.stdin:
    request = {}
    try:
        request = json.loads(line)
        with contextlib.redirect_stdout(sys.stderr):
            result = execute(request)
        response = {T.ID: request[T.ID], T.RESULT: result}
    except Exception as error:
        traceback.print_exc(file=sys.stderr)
        response = {T.ID: request.get(T.ID), T.ERROR: str(error)}
    sys.stdout.write(json.dumps(response, ensure_ascii=False) + T.EMPTY)
    sys.stdout.flush()
