if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import logging
logging.basicConfig(level=logging.INFO, format=_CODE_TEXT.ASCTIME_S_LEVELNAME_S_MESSAGE_S)
import os
import json
import uuid
import glob
import re
from pathlib import Path
MICROSECONDS_PER_SEC = 1000000
DEFAULT_IMAGE_DURATION = int(5 * MICROSECONDS_PER_SEC)
def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(_CODE_TEXT.D, s)]
def normalize_path_for_capcut(p):
    p = os.path.abspath(p).replace(_CODE_TEXT.SYMBOL, _CODE_TEXT.SYMBOL_8A5EDA)
    if len(p) >= 2 and p[1] == _CODE_TEXT.SYMBOL_E7AC07:
        p = p[0].upper() + p[1:]
    return p
def generate_capcut_project(template_json_path, parent_folder, project_name, data_dir=None, images_dir_opt=None, voices_dir_opt=None):
    """
    Creates a new CapCut project based on a template, importing images and voices
    from the given parent_folder or independent image/voice dirs.
    """
    local_app_data = os.environ.get(_CODE_TEXT.LOCALAPPDATA, '')
    capcut_drafts_dir = os.path.join(local_app_data, _CODE_TEXT.CAPCUT, _CODE_TEXT.USER_DATA, _CODE_TEXT.PROJECTS, _CODE_TEXT.COM_LVEDITOR_DRAFT)
    if not os.path.exists(capcut_drafts_dir):
        capcut_drafts_dir = os.path.join(os.environ.get(_CODE_TEXT.USERPROFILE, ''), _CODE_TEXT.APPDATA, _CODE_TEXT.LOCAL, _CODE_TEXT.CAPCUT, _CODE_TEXT.USER_DATA, _CODE_TEXT.PROJECTS, _CODE_TEXT.COM_LVEDITOR_DRAFT)
        if not os.path.exists(capcut_drafts_dir):
            if data_dir:
                capcut_drafts_dir = os.path.join(data_dir, _CODE_TEXT.CAPCUTDRAFTS)
            else:
                capcut_drafts_dir = os.path.join(os.getcwd(), _CODE_TEXT.CAPCUTDRAFTS)
            os.makedirs(capcut_drafts_dir, exist_ok=True)
    project_dir = os.path.join(capcut_drafts_dir, project_name)
    os.makedirs(project_dir, exist_ok=True)
    source_dir = parent_folder
    images_dir = images_dir_opt
    voices_dir = voices_dir_opt
    if source_dir and source_dir.lower().endswith(_CODE_TEXT.ZIP):
        import zipfile
        import tempfile
        temp_dir = tempfile.mkdtemp(prefix=_CODE_TEXT.CAPCUT_SOURCE)
        with zipfile.ZipFile(source_dir, _CODE_TEXT.R) as zip_ref:
            zip_ref.extractall(temp_dir)
        source_dir = temp_dir
    if source_dir and not images_dir:
        images_dir = os.path.join(source_dir, _CODE_TEXT.IMAGES)
        if not os.path.exists(images_dir):
            images_dir = source_dir
    if source_dir and not voices_dir:
        voices_dir = os.path.join(source_dir, _CODE_TEXT.VOICES)
        if not os.path.exists(voices_dir):
            voices_dir = source_dir
    meta_info = {_CODE_TEXT.DRAFT_MATERIALS: [{_CODE_TEXT.VALUE: [], _CODE_TEXT.TYPE: 0}], _CODE_TEXT.DRAFT_NAME: project_name, _CODE_TEXT.DRAFT_FPS: 30, _CODE_TEXT.DRAFT_VERSION: _CODE_TEXT.VALUE_5_6_0, _CODE_TEXT.CREATE_TIME: 0, _CODE_TEXT.MODIFY_TIME: 0, _CODE_TEXT.DRAFT_TYPE: _CODE_TEXT.VIDEO}
    with open(os.path.join(project_dir, _CODE_TEXT.DRAFT_META_INFO_JSON), _CODE_TEXT.W, encoding=_CODE_TEXT.UTF_8) as f:
        json.dump(meta_info, f, ensure_ascii=False, indent=2)
    with open(template_json_path, _CODE_TEXT.R, encoding=_CODE_TEXT.UTF_8) as f:
        draft_content = json.load(f)
    if _CODE_TEXT.MATERIALS not in draft_content:
        draft_content[_CODE_TEXT.MATERIALS] = {}
    if _CODE_TEXT.VIDEOS not in draft_content[_CODE_TEXT.MATERIALS]:
        draft_content[_CODE_TEXT.MATERIALS][_CODE_TEXT.VIDEOS] = []
    if _CODE_TEXT.AUDIOS not in draft_content[_CODE_TEXT.MATERIALS]:
        draft_content[_CODE_TEXT.MATERIALS][_CODE_TEXT.AUDIOS] = []
    if _CODE_TEXT.SPEEDS not in draft_content[_CODE_TEXT.MATERIALS]:
        draft_content[_CODE_TEXT.MATERIALS][_CODE_TEXT.SPEEDS] = []
    if _CODE_TEXT.CANVASES not in draft_content[_CODE_TEXT.MATERIALS]:
        draft_content[_CODE_TEXT.MATERIALS][_CODE_TEXT.CANVASES] = []
    if _CODE_TEXT.TRACKS not in draft_content:
        draft_content[_CODE_TEXT.TRACKS] = []
    video_track = next((t for t in draft_content[_CODE_TEXT.TRACKS] if t.get(_CODE_TEXT.TYPE) == _CODE_TEXT.VIDEO), None)
    audio_track = next((t for t in draft_content[_CODE_TEXT.TRACKS] if t.get(_CODE_TEXT.TYPE) == _CODE_TEXT.AUDIO), None)
    if not video_track:
        video_track = {_CODE_TEXT.ID: uuid.uuid4().hex, _CODE_TEXT.TYPE: _CODE_TEXT.VIDEO, _CODE_TEXT.SEGMENTS: []}
        draft_content[_CODE_TEXT.TRACKS].insert(0, video_track)
    if not audio_track:
        audio_track = {_CODE_TEXT.ID: uuid.uuid4().hex, _CODE_TEXT.TYPE: _CODE_TEXT.AUDIO, _CODE_TEXT.SEGMENTS: []}
        draft_content[_CODE_TEXT.TRACKS].append(audio_track)
    video_track[_CODE_TEXT.SEGMENTS] = []
    audio_track[_CODE_TEXT.SEGMENTS] = []
    for t in draft_content[_CODE_TEXT.TRACKS]:
        if t.get(_CODE_TEXT.TYPE) == _CODE_TEXT.TEXT:
            t[_CODE_TEXT.SEGMENTS] = []
    current_vid_start = 0
    current_aud_start = 0
    image_files = []
    if images_dir:
        if os.path.isfile(images_dir):
            image_files = [images_dir]
        else:
            for ext in [_CODE_TEXT.JPG, _CODE_TEXT.PNG, _CODE_TEXT.JPEG, _CODE_TEXT.WEBP]:
                image_files.extend(glob.glob(os.path.join(images_dir, ext)))
            image_files = sorted(list(set(image_files)), key=natural_sort_key)
    for img_path in image_files:
        mat_id = uuid.uuid4().hex
        speed_id = uuid.uuid4().hex
        canvas_id = uuid.uuid4().hex
        draft_content[_CODE_TEXT.MATERIALS][_CODE_TEXT.SPEEDS].append({_CODE_TEXT.ID: speed_id, _CODE_TEXT.SPEED: 1.0, _CODE_TEXT.TYPE: _CODE_TEXT.SPEED, _CODE_TEXT.MODE: 0})
        draft_content[_CODE_TEXT.MATERIALS][_CODE_TEXT.CANVASES].append({_CODE_TEXT.ID: canvas_id, _CODE_TEXT.TYPE: _CODE_TEXT.CANVAS_COLOR, _CODE_TEXT.COLOR: "", _CODE_TEXT.IMAGE_ID: ""})
        draft_content[_CODE_TEXT.MATERIALS][_CODE_TEXT.VIDEOS].append(
            {
                _CODE_TEXT.ID: mat_id,
                _CODE_TEXT.MATERIAL_ID: mat_id,
                _CODE_TEXT.PATH: normalize_path_for_capcut(img_path),
                _CODE_TEXT.FILE_PATH: normalize_path_for_capcut(img_path),
                _CODE_TEXT.TYPE: _CODE_TEXT.PHOTO,
                _CODE_TEXT.CATEGORY_NAME: _CODE_TEXT.LOCAL_25BF8E,
                _CODE_TEXT.MATERIAL_NAME: os.path.basename(img_path),
                _CODE_TEXT.DURATION: DEFAULT_IMAGE_DURATION,
                _CODE_TEXT.WIDTH: 1920,
                _CODE_TEXT.HEIGHT: 1080,
            }
        )
        video_track[_CODE_TEXT.SEGMENTS].append(
            {
                _CODE_TEXT.ID: uuid.uuid4().hex,
                _CODE_TEXT.MATERIAL_ID: mat_id,
                _CODE_TEXT.SPEED_ID: speed_id,
                _CODE_TEXT.CANVAS_ID: canvas_id,
                _CODE_TEXT.SOURCE_TIMERANGE: {_CODE_TEXT.START: 0, _CODE_TEXT.DURATION: DEFAULT_IMAGE_DURATION},
                _CODE_TEXT.TARGET_TIMERANGE: {_CODE_TEXT.START: current_vid_start, _CODE_TEXT.DURATION: DEFAULT_IMAGE_DURATION},
                _CODE_TEXT.VISIBLE: True,
                _CODE_TEXT.VOLUME: 1.0,
                _CODE_TEXT.CLIP: {_CODE_TEXT.ALPHA: 1.0, _CODE_TEXT.SCALE: {_CODE_TEXT.X: 1.0, _CODE_TEXT.Y: 1.0}, _CODE_TEXT.TRANSFORM: {_CODE_TEXT.X: 0.0, _CODE_TEXT.Y: 0.0}},
            }
        )
        current_vid_start += DEFAULT_IMAGE_DURATION
    audio_files = []
    if voices_dir:
        if os.path.isfile(voices_dir):
            audio_files = [voices_dir]
        else:
            for ext in [_CODE_TEXT.MP3, _CODE_TEXT.WAV, _CODE_TEXT.M4A]:
                audio_files.extend(glob.glob(os.path.join(voices_dir, ext)))
            audio_files = sorted(list(set(audio_files)), key=natural_sort_key)
    for aud_path in audio_files:
        mat_id = uuid.uuid4().hex
        speed_id = uuid.uuid4().hex
        draft_content[_CODE_TEXT.MATERIALS][_CODE_TEXT.SPEEDS].append({_CODE_TEXT.ID: speed_id, _CODE_TEXT.SPEED: 1.0, _CODE_TEXT.TYPE: _CODE_TEXT.SPEED, _CODE_TEXT.MODE: 0})
        draft_content[_CODE_TEXT.MATERIALS][_CODE_TEXT.AUDIOS].append(
            {
                _CODE_TEXT.ID: mat_id,
                _CODE_TEXT.MATERIAL_ID: mat_id,
                _CODE_TEXT.PATH: normalize_path_for_capcut(aud_path),
                _CODE_TEXT.FILE_PATH: normalize_path_for_capcut(aud_path),
                _CODE_TEXT.TYPE: _CODE_TEXT.EXTRACT_MUSIC,
                _CODE_TEXT.CATEGORY_NAME: _CODE_TEXT.LOCAL_25BF8E,
                _CODE_TEXT.NAME: os.path.basename(aud_path),
                _CODE_TEXT.MATERIAL_NAME: os.path.basename(aud_path),
                _CODE_TEXT.DURATION: DEFAULT_IMAGE_DURATION,
            }
        )
        audio_track[_CODE_TEXT.SEGMENTS].append(
            {_CODE_TEXT.ID: uuid.uuid4().hex, _CODE_TEXT.MATERIAL_ID: mat_id, _CODE_TEXT.SPEED_ID: speed_id, _CODE_TEXT.SOURCE_TIMERANGE: {_CODE_TEXT.START: 0, _CODE_TEXT.DURATION: DEFAULT_IMAGE_DURATION}, _CODE_TEXT.TARGET_TIMERANGE: {_CODE_TEXT.START: current_aud_start, _CODE_TEXT.DURATION: DEFAULT_IMAGE_DURATION}, _CODE_TEXT.VISIBLE: True, _CODE_TEXT.VOLUME: 1.0}
        )
        current_aud_start += DEFAULT_IMAGE_DURATION
    out_json_path = os.path.join(project_dir, _CODE_TEXT.DRAFT_CONTENT_JSON)
    with open(out_json_path, _CODE_TEXT.W, encoding=_CODE_TEXT.UTF_8) as f:
        json.dump(draft_content, f, ensure_ascii=False, indent=2)
    return out_json_path
