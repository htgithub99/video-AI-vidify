import sys
try:
    from .dialog_focus_texts import ALPHA_ATTRIBUTE, TOPMOST_ATTRIBUTE, HIDDEN_GEOMETRY, WINDOWS_PLATFORM, ASFW_ANY, VK_MENU, KEYEVENTF_KEYUP, DESKTOP_ACCESS_ALL, UOI_NAME, NAME_BUFFER_CHARS
except ImportError:
    from dialog_focus_texts import ALPHA_ATTRIBUTE, TOPMOST_ATTRIBUTE, HIDDEN_GEOMETRY, WINDOWS_PLATFORM, ASFW_ANY, VK_MENU, KEYEVENTF_KEYUP, DESKTOP_ACCESS_ALL, UOI_NAME, NAME_BUFFER_CHARS
def _bring_to_front(root):
    if sys.platform != WINDOWS_PLATFORM:
        return
    try:
        import ctypes
        user32 = ctypes.windll.user32
        user32.AllowSetForegroundWindow(ASFW_ANY)
        hwnd = user32.GetParent(root.winfo_id()) or root.winfo_id()
        user32.keybd_event(VK_MENU, 0, 0, 0)
        user32.keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, 0)
        user32.SetForegroundWindow(hwnd)
        user32.BringWindowToTop(hwnd)
    except Exception:
        pass
def _object_name(user32, handle):
    import ctypes
    buffer = ctypes.create_unicode_buffer(NAME_BUFFER_CHARS)
    needed = ctypes.c_ulong()
    user32.GetUserObjectInformationW(ctypes.c_void_p(handle), UOI_NAME, buffer, NAME_BUFFER_CHARS * 2, ctypes.byref(needed))
    return buffer.value
def attach_input_desktop():
    if sys.platform != WINDOWS_PLATFORM:
        return False
    try:
        import ctypes
        user32 = ctypes.windll.user32
        user32.OpenInputDesktop.restype = ctypes.c_void_p
        user32.GetThreadDesktop.restype = ctypes.c_void_p
        input_desktop = user32.OpenInputDesktop(0, False, DESKTOP_ACCESS_ALL)
        if not input_desktop:
            return False
        current_desktop = user32.GetThreadDesktop(ctypes.windll.kernel32.GetCurrentThreadId())
        if _object_name(user32, current_desktop) == _object_name(user32, input_desktop):
            return True
        return bool(user32.SetThreadDesktop(ctypes.c_void_p(input_desktop)))
    except Exception:
        return False
def open_dialog_root():
    attach_input_desktop()
    import tkinter as tk
    root = tk.Tk()
    root.overrideredirect(True)
    root.geometry(HIDDEN_GEOMETRY)
    root.attributes(ALPHA_ATTRIBUTE, 0.0)
    root.attributes(TOPMOST_ATTRIBUTE, True)
    root.deiconify()
    root.update()
    root.lift()
    root.focus_force()
    _bring_to_front(root)
    root.update()
    return root
