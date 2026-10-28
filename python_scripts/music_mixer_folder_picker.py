if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import json
import os
import sys
import tkinter as tk
from tkinter import filedialog
if hasattr(sys.stdout, _CODE_TEXT.RECONFIGURE):
    sys.stdout.reconfigure(encoding=_CODE_TEXT.UTF_8)
if hasattr(sys.stderr, _CODE_TEXT.RECONFIGURE):
    sys.stderr.reconfigure(encoding=_CODE_TEXT.UTF_8)
def main():
    root = tk.Tk()
    root.withdraw()
    root.attributes(_CODE_TEXT.TOPMOST, True)
    parent = filedialog.askdirectory(
        title=_CODE_TEXT.CH_N_TH_M_C_CH_A_C_C_FOLDER_NH_C,
        mustexist=True,
    )
    root.destroy()
    if not parent:
        return 0
    print(json.dumps([os.path.normpath(parent)], ensure_ascii=True))
    return 0
if __name__ == _CODE_TEXT.MAIN:
    sys.exit(main())
