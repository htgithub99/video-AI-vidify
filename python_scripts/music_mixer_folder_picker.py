import json
import os
import sys
import tkinter as tk
from tkinter import filedialog


def main():
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    parent = filedialog.askdirectory(
        title="Chọn thư mục chứa các folder nhạc",
        mustexist=True,
    )
    root.destroy()
    if not parent:
        return 0
    print(json.dumps([os.path.normpath(parent)], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
