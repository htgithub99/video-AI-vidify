import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { IBaseModalProps } from "../../types";
import { X } from "lucide-react";
import { stopPropagation } from "../../utils/helpers";

export const Modal: React.FC<IBaseModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth,
}) => {
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
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-slate-900 border border-slate-800 rounded-2xl w-full ${maxWidthClass} max-h-[90vh] flex flex-col shadow-xl overflow-hidden animate-in zoom-in-95 duration-200`}
        onClick={stopPropagation}
      >
        {}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
          {title && (
            <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {}
        <div className="flex-1 overflow-y-auto bg-slate-900">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
