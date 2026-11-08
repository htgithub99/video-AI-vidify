if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import sys
import json
import os
import re
import zipfile
if hasattr(sys.stdout, _CODE_TEXT.RECONFIGURE):
    sys.stdout.reconfigure(encoding=_CODE_TEXT.UTF_8)
if hasattr(sys.stderr, _CODE_TEXT.RECONFIGURE):
    sys.stderr.reconfigure(encoding=_CODE_TEXT.UTF_8)
def _resolve_fs_path(raw_path):
    if not raw_path:
        return ""
    norm = os.path.abspath(os.path.normpath(str(raw_path)))
    if os.name == "nt" and not norm.startswith("\\\\?\\"):
        if len(norm) >= 240 or not os.path.exists(norm):
            long_norm = "\\\\?\\UNC\\" + norm[2:] if norm.startswith("\\\\") else "\\\\?\\" + norm
            if os.path.exists(long_norm) or len(norm) >= 240:
                return long_norm
    return norm
def _sanitize_zip_entry_path(raw_zip_path, seen_paths):
    normalized = str(raw_zip_path or "").replace("\\", "/").strip("/")
    if not normalized:
        return ""
    segments = []
    for part in normalized.split("/"):
        cleaned = re.sub(r'[<>:"|?*\x00-\x1f]', "_", part).strip()
        if cleaned and cleaned not in (".", ".."):
            segments.append(cleaned)
    if not segments:
        return ""
    candidate = "/".join(segments)
    base_key = candidate.lower()
    if base_key not in seen_paths:
        seen_paths.add(base_key)
        return candidate
    stem, ext = os.path.splitext(candidate)
    counter = 2
    while True:
        deduped = f"{stem} ({counter}){ext}"
        if deduped.lower() not in seen_paths:
            seen_paths.add(deduped.lower())
            return deduped
        counter += 1
def main():
    if len(sys.argv) < 2:
        print(json.dumps({_CODE_TEXT.SUCCESS: False, _CODE_TEXT.ERROR_CA00FC: _CODE_TEXT.MISSING_MANIFEST_PATH_ARGUMENT}))
        sys.exit(1)
    manifest_path = _resolve_fs_path(sys.argv[1])
    if not os.path.exists(manifest_path):
        print(json.dumps({_CODE_TEXT.SUCCESS: False, _CODE_TEXT.ERROR_CA00FC: f'{_CODE_TEXT.MANIFEST_FILE_NOT_FOUND}{manifest_path}'}))
        sys.exit(1)
    try:
        with open(manifest_path, _CODE_TEXT.R, encoding=_CODE_TEXT.UTF_8) as f:
            manifest = json.load(f)
        raw_target_zip = manifest.get(_CODE_TEXT.TARGETZIPPATH)
        folders = manifest.get(_CODE_TEXT.FOLDERS, [])
        if not raw_target_zip:
            print(json.dumps({_CODE_TEXT.SUCCESS: False, _CODE_TEXT.ERROR_CA00FC: _CODE_TEXT.MISSING_TARGETZIPPATH_IN_MANIFEST}))
            sys.exit(1)
        target_zip = _resolve_fs_path(raw_target_zip)
        target_dir = os.path.dirname(target_zip)
        if target_dir and not os.path.exists(target_dir):
            os.makedirs(target_dir, exist_ok=True)
        temp_zip = _resolve_fs_path(f'{raw_target_zip}{_CODE_TEXT.TMP_160ED0}{os.getpid()}')
        seen_zip_paths = set()
        written_files = 0
        with zipfile.ZipFile(temp_zip, _CODE_TEXT.W, zipfile.ZIP_STORED, allowZip64=True, strict_timestamps=False) as zf:
            for folder in folders:
                files = folder.get(_CODE_TEXT.FILES_3D7DB3, [])
                texts = folder.get(_CODE_TEXT.TEXTS, [])
                for file_item in files:
                    src = _resolve_fs_path(file_item.get(_CODE_TEXT.SOURCEPATH))
                    zip_path = _sanitize_zip_entry_path(file_item.get(_CODE_TEXT.ZIPPATH), seen_zip_paths)
                    if src and zip_path and os.path.isfile(src):
                        zf.write(src, zip_path, compress_type=zipfile.ZIP_STORED)
                        written_files += 1
                for text_item in texts:
                    content = text_item.get(_CODE_TEXT.CONTENT, "")
                    zip_path = _sanitize_zip_entry_path(text_item.get(_CODE_TEXT.ZIPPATH), seen_zip_paths)
                    if zip_path:
                        zf.writestr(zip_path, str(content).encode(_CODE_TEXT.UTF_8), compress_type=zipfile.ZIP_DEFLATED)
        if written_files == 0:
            raise RuntimeError("No readable audio source files found to build ZIP archive.")
        if os.path.exists(target_zip):
            try:
                os.remove(target_zip)
            except Exception:
                pass
        os.replace(temp_zip, target_zip)
        print(json.dumps({_CODE_TEXT.SUCCESS: True, _CODE_TEXT.PATH: str(raw_target_zip)}))
    except Exception as e:
        if _CODE_TEXT.TEMP_ZIP in locals() and os.path.exists(temp_zip):
            try:
                os.remove(temp_zip)
            except Exception:
                pass
        print(json.dumps({_CODE_TEXT.SUCCESS: False, _CODE_TEXT.ERROR_CA00FC: str(e)}))
        sys.exit(1)
if __name__ == _CODE_TEXT.MAIN:
    main()
