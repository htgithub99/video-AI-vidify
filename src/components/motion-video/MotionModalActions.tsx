import type { FC, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { MOTION_TEXT_BUTTON } from "../../constants/motionRuntime.js";
import { cn } from "../../lib/utils";
interface Props {
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel: string;
  confirmLabel: string;
  busy?: boolean;
  danger?: boolean;
  icon?: ReactNode;
}
export const MotionModalActions: FC<Props> = ({ onCancel, onConfirm, cancelLabel, confirmLabel, busy, danger, icon }) => (
  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
    <button type={MOTION_TEXT_BUTTON} disabled={busy} onClick={onCancel} className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-800 bg-slate-955 text-slate-300 hover:text-slate-100 cursor-pointer transition-colors disabled:opacity-50">
      {cancelLabel}
    </button>
    <button type={MOTION_TEXT_BUTTON} disabled={busy} onClick={onConfirm} className={cn("px-5 py-2 text-xs font-bold rounded-xl text-white cursor-pointer transition-all shadow-md disabled:opacity-50 inline-flex items-center gap-1.5", danger ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" : "bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-600/30 hover:brightness-110")}>
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      <span>{confirmLabel}</span>
    </button>
  </div>
);
