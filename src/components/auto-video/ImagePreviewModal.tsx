import { SOURCE_TEXT_BUTTON, SOURCE_TEXT_ESCAPE, SOURCE_TEXT_KEYDOWN, SOURCE_TEXT_UNSTYLED } from "../../constants/sourceText";
import { cn } from "../../lib/utils";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import _ from "lodash";
import { X } from "lucide-react";
import { REFACTOR_CONSTANTS } from "../../constants";
import { AUTO_VIDEO_UI_TEXTS } from "../../constants/texts";
import { Button } from "../ui/Button";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}
export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  const uiTexts = AUTO_VIDEO_UI_TEXTS.vi;
  useBodyScrollLock(Boolean(imageUrl));
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (_.isEqual(e.key, SOURCE_TEXT_ESCAPE)) {
        onClose();
      }
    };
    if (imageUrl) {
      document.addEventListener(SOURCE_TEXT_KEYDOWN, handleKeyDown);
    }
    return () => {
      document.removeEventListener(SOURCE_TEXT_KEYDOWN, handleKeyDown);
    };
  }, [imageUrl, onClose]);
  if (!imageUrl || typeof document === "undefined") return null;
  return createPortal(
    <div className={cn("fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-150")} onClick={onClose}>
      <div className={cn("relative max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-slate-955 flex items-center justify-center")} onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt={REFACTOR_CONSTANTS.THUMB_REF_PREFIX} className={cn("max-w-full max-h-[85vh] object-contain rounded-2xl select-none")} />
        <Button
          variant={SOURCE_TEXT_UNSTYLED}
          type={SOURCE_TEXT_BUTTON}
          onClick={onClose}
          className={cn("btn-icon-tiny absolute top-3 right-3 w-9 h-9 min-w-[36px] max-w-[36px] min-h-[36px] max-h-[36px] !p-0 aspect-square rounded-xl bg-black/70 hover:bg-black/95 text-white flex items-center justify-center border border-white/30 backdrop-blur-md shadow-xl transition-all cursor-pointer active:scale-95")}
          title={uiTexts.closeEsc}>
          <X className={cn("w-5 h-5 stroke-[2.5] shrink-0")} />
        </Button>
      </div>
    </div>,
    document.body,
  );
};
