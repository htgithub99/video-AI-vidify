import { cn } from "../../lib/utils";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { IBaseModalProps } from "../../types";
import { X } from "lucide-react";
import { stopPropagation } from "../../utils/helpers";
import { Button } from "./Button";

export const Modal: React.FC<IBaseModalProps> = ({ isOpen, onClose, title, children, maxWidth }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isFullClass = maxWidth?.startsWith("max-w-");
  const maxWidthClass = maxWidth ? (isFullClass ? maxWidth : `max-w-${maxWidth}`) : "max-w-6xl";

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-955/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className={cn("bg-gradient-to-b from-slate-900/90 to-slate-955/95 border border-slate-800/85 rounded-xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200", maxWidthClass)} onClick={stopPropagation}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none z-0" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50 relative z-10 bg-transparent">
          {title && <h2 className="text-base font-semibold text-slate-100">{title}</h2>}
          <Button 
            variant="ghost" 
            size="xs" 
            onClick={onClose} 
            className="p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shadow-none"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto bg-transparent relative z-10">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
