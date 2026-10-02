import sys
import json
import os
import zipfile

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Missing manifest path argument"}))
        sys.exit(1)

    manifest_path = sys.argv[1]
    if not os.path.exists(manifest_path):
        print(json.dumps({"success": False, "error": f"Manifest file not found: {manifest_path}"}))
        sys.exit(1)

    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        target_zip = manifest.get("targetZipPath")
        folders = manifest.get("folders", [])

        if not target_zip:
            print(json.dumps({"success": False, "error": "Missing targetZipPath in manifest"}))
            sys.exit(1)

        target_dir = os.path.dirname(target_zip)
        if target_dir and not os.path.exists(target_dir):
            os.makedirs(target_dir, exist_ok=True)

        temp_zip = f"{target_zip}.tmp_{os.getpid()}"

        with zipfile.ZipFile(temp_zip, "w", zipfile.ZIP_DEFLATED, allowZip64=True) as zf:
            for folder in folders:
                folder_name = folder.get("name", "")
                files = folder.get("files", [])
                texts = folder.get("texts", [])

                for file_item in files:
                    src = file_item.get("sourcePath")
                    zip_path = file_item.get("zipPath")
                    if src and os.path.isfile(src):
                        zf.write(src, zip_path)

                for text_item in texts:
                    content = text_item.get("content", "")
                    zip_path = text_item.get("zipPath")
                    if zip_path:
                        zf.writestr(zip_path, content.encode("utf-8"))

        if os.path.exists(target_zip):
            try:
                os.remove(target_zip)
            except Exception:
                pass

        os.replace(temp_zip, target_zip)
        print(json.dumps({"success": True, "path": target_zip}))

    except Exception as e:
        if "temp_zip" in locals() and os.path.exists(temp_zip):
            try:
                os.remove(temp_zip)
            except Exception:
                pass
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
