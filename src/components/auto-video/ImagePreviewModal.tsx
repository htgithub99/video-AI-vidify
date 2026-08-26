import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import _ from "lodash";
import { X } from "lucide-react";
import { REFACTOR_CONSTANTS } from "../../constants";

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (_.isEqual(e.key, "Escape")) {
        onClose();
      }
    };
    if (imageUrl) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [imageUrl, onClose]);

  if (!imageUrl || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-slate-955 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={REFACTOR_CONSTANTS.THUMB_REF_PREFIX}
          className="max-w-full max-h-[85vh] object-contain rounded-2xl select-none"
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/30 shadow-xl transition-colors cursor-pointer"
          title="Đóng (ESC)"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>,
    document.body
  );
};
