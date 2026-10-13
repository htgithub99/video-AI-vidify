import motion_vieneu_texts as T
import contextlib
import json
import os
import sys
import traceback
from pathlib import Path
sys.stdout.reconfigure(encoding=T.UTF_8)
sys.stdin.reconfigure(encoding=T.UTF_8)
sys.stderr.reconfigure(encoding=T.UTF_8)
root = Path(sys.argv[1]).resolve()
root.mkdir(parents=True, exist_ok=True)
os.environ["HF_HOME"] = str(root / T.MODELS)
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = T.VALUE_1
os.environ["HF_HUB_DOWNLOAD_TIMEOUT"] = T.VALUE_300
engine = None
def execute(request):
    global engine
    import importlib.resources
    if request["command"] == T.VOICES:
        asset = importlib.resources.files(T.VIENEU).joinpath(T.ASSETS_VOICES_V3_TURBO_JSON)
        data = json.loads(asset.read_text(encoding=T.UTF_8))
        saved = root / T.VOICES_V3_TURBO_JSON
        if saved.exists():
            data["presets"].update(json.loads(saved.read_text(encoding=T.UTF_8))["presets"])
        return [{"id": name, "name": value.get(T.DESCRIPTION, name) if name.startswith(T.CUSTOM) else name, "gender": value.get(T.GENDER, T.EMPTY_2), "description": value.get(T.DESCRIPTION, T.EMPTY_2)} for name, value in data["presets"].items()]
    from vieneu import Vieneu
    import numpy as np
    import soundfile as sf
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
    if request["command"] == T.REGISTER:
        source = Path(request["file"]).resolve()
        if not source.is_relative_to(root):
            raise ValueError(T.INVALID_REFERENCE_SOURCE)
        engine.add_voice(request["voice"], str(source), denoise=True, description=request.get(T.NAME, T.EMPTY_2), gender=request.get(T.GENDER, T.EMPTY_2))
        temporary = root / T.VOICES_V3_TURBO_JSON_TMP
        engine.save_voices(str(temporary))
        temporary.replace(root / T.VOICES_V3_TURBO_JSON)
        return {"id": request["voice"], "name": request.get(T.NAME, request["voice"]), "gender": request.get(T.GENDER, T.EMPTY_2)}
    text = str(request.get(T.TEXT, T.EMPTY_2)).strip()
    if not text or len(text) > 1800:
        raise ValueError(T.INVALID_SPEECH_TEXT)
    target = Path(request["file"]).resolve()
    if not target.is_relative_to(root) or target.suffix != T.WAV:
        raise ValueError(T.INVALID_SPEECH_DESTINATION)
    wav = np.asarray(engine.infer(text, voice=request["voice"], max_chars=256), dtype=np.float32).reshape(-1)
    if not wav.size or not np.isfinite(wav).all() or np.max(np.abs(wav)) < 0.0001:
        raise ValueError(T.EMPTY_SPEECH_AUDIO)
    target.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(target), wav, engine.sample_rate, subtype=T.PCM_16)
    return {"seconds": wav.size / engine.sample_rate, "sampleRate": engine.sample_rate, "backend": engine.backend}
for line in sys.stdin:
    request = {}
    try:
        request = json.loads(line)
        with contextlib.redirect_stdout(sys.stderr):
            result = execute(request)
        response = {"id": request["id"], "result": result}
    except Exception as error:
        traceback.print_exc(file=sys.stderr)
        response = {"id": request.get(T.ID), "error": str(error)}
    sys.stdout.write(json.dumps(response, ensure_ascii=False) + T.EMPTY)
    sys.stdout.flush()
