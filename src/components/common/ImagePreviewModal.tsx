import { IMAGE_PREVIEW } from "../../constants/imagePreview.js";
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
    <div className={cn(IMAGE_PREVIEW.OVERLAY)} onClick={onClose}>
      <div className={cn(IMAGE_PREVIEW.CONTENT)} onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt={REFACTOR_CONSTANTS.THUMB_REF_PREFIX} className={cn(IMAGE_PREVIEW.IMAGE)} />
        <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={onClose} className={cn(IMAGE_PREVIEW.CLOSE)} title={uiTexts.closeEsc}>
          <X className={cn(IMAGE_PREVIEW.ICON)} />
        </Button>
      </div>
    </div>,
    document.body,
  );
};
