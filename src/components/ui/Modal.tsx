import { cn } from "../../lib/utils";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { IBaseModalProps } from "../../types";
import { X } from "lucide-react";
import { stopPropagation } from "../../utils/helpers";
import { Button } from "./Button";

const SIZE_MAP: Record<string, string> = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
};

export const Modal: React.FC<IBaseModalProps> = ({ isOpen, onClose, title, children, maxWidth }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"; else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isFullClass = maxWidth?.startsWith("max-w-");
  const maxWidthClass = maxWidth ? (isFullClass ? maxWidth : SIZE_MAP[maxWidth] || `max-w-${maxWidth}`) : "max-w-2xl";

  return createPortal(
    <div className={cn("fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-955/75 backdrop-blur-lg animate-in fade-in duration-200")} onClick={onClose}>
      <div className={cn("glass-panel bg-slate-900/95 border border-slate-700/60 rounded-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-left", maxWidthClass)} onClick={stopPropagation}>
        <div className={cn("absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.05] rounded-full blur-3xl pointer-events-none z-0")} />
        <div className={cn("absolute bottom-0 left-0 w-64 h-64 bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none z-0")} />

        <div className={cn("flex items-center justify-between px-6 py-4 border-b border-slate-800/80 relative z-10 bg-slate-900/40 backdrop-blur-sm")}>
          {title && <h2 className={cn("text-sm font-extrabold text-slate-100 flex items-center gap-2 font-mono uppercase tracking-wide truncate")}>{title}</h2>}
          <Button variant="ghost" size="xs" onClick={onClose} className={cn("p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shadow-none ml-auto shrink-0")}>
            <X className={cn("w-4 h-4")} />
          </Button>
        </div>

        <div className={cn("flex-1 overflow-y-auto bg-transparent relative z-10 p-6")}>{children}</div>
      </div>
    </div>,
    document.body,
  );
};
