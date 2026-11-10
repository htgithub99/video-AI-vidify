import json
import os
import sys
import tkinter as tk
try:
    from .dialog_focus import open_dialog_root
except ImportError:
    from dialog_focus import open_dialog_root
from tkinter import filedialog
from video_export_texts import OUTPUT_ENCODING, RECONFIGURE_METHOD, TOPMOST_ATTRIBUTE, FOLDER_PICKER_TITLE, FOLDER_PATH_KEY, MAIN_MODULE_NAME
if hasattr(sys.stdout, RECONFIGURE_METHOD):
    sys.stdout.reconfigure(encoding=OUTPUT_ENCODING)
if hasattr(sys.stderr, RECONFIGURE_METHOD):
    sys.stderr.reconfigure(encoding=OUTPUT_ENCODING)
def main():
    root = open_dialog_root()
    folder = filedialog.askdirectory(
        parent=root,
        title=FOLDER_PICKER_TITLE,
        mustexist=True,
    )
    root.destroy()
    if not folder:
        return 0
    print(json.dumps({FOLDER_PATH_KEY: os.path.normpath(folder)}, ensure_ascii=True))
    return 0
if __name__ == MAIN_MODULE_NAME:
    sys.exit(main())
