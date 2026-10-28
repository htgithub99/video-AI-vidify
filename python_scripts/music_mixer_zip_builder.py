if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import sys
import json
import os
import zipfile
def main():
    if len(sys.argv) < 2:
        print(json.dumps({_CODE_TEXT.SUCCESS: False, _CODE_TEXT.ERROR_CA00FC: _CODE_TEXT.MISSING_MANIFEST_PATH_ARGUMENT}))
        sys.exit(1)
    manifest_path = sys.argv[1]
    if not os.path.exists(manifest_path):
        print(json.dumps({_CODE_TEXT.SUCCESS: False, _CODE_TEXT.ERROR_CA00FC: f'{_CODE_TEXT.MANIFEST_FILE_NOT_FOUND}{manifest_path}'}))
        sys.exit(1)
    try:
        with open(manifest_path, _CODE_TEXT.R, encoding=_CODE_TEXT.UTF_8) as f:
            manifest = json.load(f)
        target_zip = manifest.get(_CODE_TEXT.TARGETZIPPATH)
        folders = manifest.get(_CODE_TEXT.FOLDERS, [])
        if not target_zip:
            print(json.dumps({_CODE_TEXT.SUCCESS: False, _CODE_TEXT.ERROR_CA00FC: _CODE_TEXT.MISSING_TARGETZIPPATH_IN_MANIFEST}))
            sys.exit(1)
        target_dir = os.path.dirname(target_zip)
        if target_dir and not os.path.exists(target_dir):
            os.makedirs(target_dir, exist_ok=True)
        temp_zip = f'{target_zip}{_CODE_TEXT.TMP_160ED0}{os.getpid()}'
        with zipfile.ZipFile(temp_zip, _CODE_TEXT.W, zipfile.ZIP_DEFLATED, allowZip64=True) as zf:
            for folder in folders:
                folder_name = folder.get(_CODE_TEXT.NAME, "")
                files = folder.get(_CODE_TEXT.FILES_3D7DB3, [])
                texts = folder.get(_CODE_TEXT.TEXTS, [])
                for file_item in files:
                    src = file_item.get(_CODE_TEXT.SOURCEPATH)
                    zip_path = file_item.get(_CODE_TEXT.ZIPPATH)
                    if src and os.path.isfile(src):
                        zf.write(src, zip_path)
                for text_item in texts:
                    content = text_item.get(_CODE_TEXT.CONTENT, "")
                    zip_path = text_item.get(_CODE_TEXT.ZIPPATH)
                    if zip_path:
                        zf.writestr(zip_path, content.encode(_CODE_TEXT.UTF_8))
        if os.path.exists(target_zip):
            try:
                os.remove(target_zip)
            except Exception:
                pass
        os.replace(temp_zip, target_zip)
        print(json.dumps({_CODE_TEXT.SUCCESS: True, _CODE_TEXT.PATH: target_zip}))
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
