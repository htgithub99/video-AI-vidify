import os
import json
import uuid
import glob
from pathlib import Path

MICROSECONDS_PER_SEC = 1000000
DEFAULT_IMAGE_DURATION = int(5 * MICROSECONDS_PER_SEC) # 5 seconds

def generate_capcut_project(template_json_path, parent_folder, project_name, data_dir=None, images_dir_opt=None, voices_dir_opt=None):
    """
    Creates a new CapCut project based on a template, importing images and voices
    from the given parent_folder or independent image/voice dirs.
    """
    # 1. Determine local CapCut drafts folder (Windows)
    local_app_data = os.environ.get('LOCALAPPDATA', '')
    capcut_drafts_dir = os.path.join(local_app_data, 'CapCut', 'User Data', 'Projects', 'com.lveditor.draft')
    
    if not os.path.exists(capcut_drafts_dir):
        # Fallback if CapCut is not installed or different path
        capcut_drafts_dir = os.path.join(os.environ.get('USERPROFILE', ''), 'AppData', 'Local', 'CapCut', 'User Data', 'Projects', 'com.lveditor.draft')
        if not os.path.exists(capcut_drafts_dir):
            if data_dir:
                capcut_drafts_dir = os.path.join(data_dir, 'CapcutDrafts')
            else:
                capcut_drafts_dir = os.path.join(os.getcwd(), 'CapcutDrafts')
            os.makedirs(capcut_drafts_dir, exist_ok=True)
            
    project_dir = os.path.join(capcut_drafts_dir, project_name)
    os.makedirs(project_dir, exist_ok=True)

    # 2. Extract ZIP or resolve paths
    source_dir = parent_folder
    images_dir = images_dir_opt
    voices_dir = voices_dir_opt

    if source_dir and source_dir.lower().endswith('.zip'):
        import zipfile
        import tempfile
        temp_dir = tempfile.mkdtemp(prefix="capcut_source_")
        with zipfile.ZipFile(source_dir, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
        source_dir = temp_dir
        
    if source_dir and not images_dir:
        images_dir = os.path.join(source_dir, 'images')
        if not os.path.exists(images_dir):
            images_dir = source_dir # fallback
            
    if source_dir and not voices_dir:
        voices_dir = os.path.join(source_dir, 'voices')
        if not os.path.exists(voices_dir):
            voices_dir = source_dir

    # 3. Create meta info
    meta_info = {
        "draft_materials": [{"value": [], "type": 0}],
        "draft_name": project_name,
        "draft_fps": 30,
        "draft_version": "5.6.0",
        "create_time": 0,
        "modify_time": 0,
        "draft_type": "video"
    }
    with open(os.path.join(project_dir, 'draft_meta_info.json'), 'w', encoding='utf-8') as f:
        json.dump(meta_info, f, ensure_ascii=False, indent=2)

    # 4. Read template content
    with open(template_json_path, 'r', encoding='utf-8') as f:
        draft_content = json.load(f)

    # Init structure if not exist
    if 'materials' not in draft_content:
        draft_content['materials'] = {}
    if 'videos' not in draft_content['materials']: draft_content['materials']['videos'] = []
    if 'audios' not in draft_content['materials']: draft_content['materials']['audios'] = []
    if 'speeds' not in draft_content['materials']: draft_content['materials']['speeds'] = []
    if 'canvases' not in draft_content['materials']: draft_content['materials']['canvases'] = []

    if 'tracks' not in draft_content:
        draft_content['tracks'] = []
        
    # Find tracks
    video_track = next((t for t in draft_content['tracks'] if t.get('type') == 'video'), None)
    audio_track = next((t for t in draft_content['tracks'] if t.get('type') == 'audio'), None)

    if not video_track:
        video_track = {"id": uuid.uuid4().hex, "type": "video", "segments": []}
        draft_content['tracks'].insert(0, video_track)
    if not audio_track:
        audio_track = {"id": uuid.uuid4().hex, "type": "audio", "segments": []}
        draft_content['tracks'].append(audio_track)

    # DO NOT clean existing segments so we preserve template intros/outros
    # Instead, we will find the end time of the current track and append after it
    def get_track_end_time(track):
        if not track.get('segments'):
            return 0
        return max([s.get('target_timerange', {}).get('start', 0) + s.get('target_timerange', {}).get('duration', 0) for s in track['segments']])

    current_vid_start = get_track_end_time(video_track)
    current_aud_start = get_track_end_time(audio_track)

    # 5. Populate images (or single file)
    image_files = []
    if images_dir:
        if os.path.isfile(images_dir):
            image_files = [images_dir]
        else:
            for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.JPG', '*.PNG']:
                image_files.extend(glob.glob(os.path.join(images_dir, ext)))
            image_files = sorted(image_files)

    for img_path in image_files:
        mat_id = uuid.uuid4().hex
        speed_id = uuid.uuid4().hex
        canvas_id = uuid.uuid4().hex
        
        draft_content['materials']['speeds'].append({
            "id": speed_id, "speed": 1.0, "type": "speed", "mode": 0
        })
        draft_content['materials']['canvases'].append({
            "id": canvas_id, "type": "canvas_color", "color": "", "image_id": ""
        })

        draft_content['materials']['videos'].append({
            "id": mat_id,
            "material_id": mat_id,
            "path": img_path.replace("\\", "/"),
            "file_Path": img_path.replace("\\", "/"),
            "type": 0,
            "duration": DEFAULT_IMAGE_DURATION,
            "width": 1920,
            "height": 1080
        })

        video_track['segments'].append({
            "id": uuid.uuid4().hex,
            "material_id": mat_id,
            "speed_id": speed_id,
            "canvas_id": canvas_id,
            "source_timerange": {"start": 0, "duration": DEFAULT_IMAGE_DURATION},
            "target_timerange": {"start": current_vid_start, "duration": DEFAULT_IMAGE_DURATION},
            "visible": True,
            "volume": 1.0,
            "clip": {"alpha": 1.0, "scale": {"x": 1.0, "y": 1.0}, "transform": {"x": 0.0, "y": 0.0}}
        })
        current_vid_start += DEFAULT_IMAGE_DURATION

    # 6. Populate audios (or single file)
    audio_files = []
    if voices_dir:
        if os.path.isfile(voices_dir):
            audio_files = [voices_dir]
        else:
            for ext in ['*.mp3', '*.wav', '*.m4a', '*.MP3', '*.WAV']:
                audio_files.extend(glob.glob(os.path.join(voices_dir, ext)))
            audio_files = sorted(audio_files)

    for aud_path in audio_files:
        mat_id = uuid.uuid4().hex
        speed_id = uuid.uuid4().hex
        
        draft_content['materials']['speeds'].append({
            "id": speed_id, "speed": 1.0, "type": "speed", "mode": 0
        })

        draft_content['materials']['audios'].append({
            "id": mat_id,
            "material_id": mat_id,
            "path": aud_path.replace("\\", "/"),
            "file_Path": aud_path.replace("\\", "/"),
            "type": 0,
            "duration": DEFAULT_IMAGE_DURATION, # Will be synced by main tool
        })

        audio_track['segments'].append({
            "id": uuid.uuid4().hex,
            "material_id": mat_id,
            "speed_id": speed_id,
            "source_timerange": {"start": 0, "duration": DEFAULT_IMAGE_DURATION},
            "target_timerange": {"start": current_aud_start, "duration": DEFAULT_IMAGE_DURATION},
            "visible": True,
            "volume": 1.0
        })
        current_aud_start += DEFAULT_IMAGE_DURATION

    # Save
    out_json_path = os.path.join(project_dir, 'draft_content.json')
    with open(out_json_path, 'w', encoding='utf-8') as f:
        json.dump(draft_content, f, ensure_ascii=False, indent=2)

    return out_json_path
