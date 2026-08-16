import React from "react";
import { X } from "lucide-react";
import { REFACTOR_CONSTANTS } from "../../constants";

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-950"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={imageUrl} alt={REFACTOR_CONSTANTS.THUMB_REF_PREFIX} className="max-w-full max-h-[85vh] object-contain" />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/90 text-white flex items-center justify-center border border-white/20 shadow-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
