import { RUNTIME_TEXT as RT_UI } from "../../constants/runtime/ui.js";
import { SOURCE_TEXT_BUTTON, SOURCE_TEXT_CLOSE, SOURCE_TEXT_UNSTYLED } from "../../constants/sourceText";
import { cn } from "../../lib/utils";
import React from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { createPortal } from "react-dom";
import { IBaseModalProps } from "../../types";
import { X } from "lucide-react";
import { stopPropagation } from "../../utils/helpers";
import { Button } from "./Button";
import { MODAL_CLASS_NAME, MODAL_SIZE_CLASS_NAME } from "../../constants";
export const Modal: React.FC<IBaseModalProps> = ({ isOpen, onClose, title, children, maxWidth }) => {
  useBodyScrollLock(isOpen);
  if (!isOpen) return null;
  const isFullClass = maxWidth?.startsWith(MODAL_CLASS_NAME.WIDTH_PREFIX);
  const maxWidthClass = maxWidth ? (isFullClass ? maxWidth : MODAL_SIZE_CLASS_NAME[maxWidth] || `${MODAL_CLASS_NAME.WIDTH_PREFIX}${maxWidth}`) : MODAL_CLASS_NAME.DEFAULT_WIDTH;
  return createPortal(
    <div className={cn(MODAL_CLASS_NAME.OVERLAY)} onClick={onClose}>
      <div className={cn(MODAL_CLASS_NAME.CONTENT, maxWidthClass)} onClick={stopPropagation}>
        <div className={cn(MODAL_CLASS_NAME.TOP_DECORATION)} />
        <div className={cn(MODAL_CLASS_NAME.BOTTOM_DECORATION)} />
        <div className={cn(MODAL_CLASS_NAME.HEADER)}>
          {title && <h2 className={cn(MODAL_CLASS_NAME.TITLE, RT_UI.UPPERCASE_TRACKING_WIDER_FONT_EXTRABOLD_SELECT_NONE_UPPERCASE)}>{typeof title === "string" ? title.toUpperCase() : title}</h2>}
          <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={onClose} aria-label={SOURCE_TEXT_CLOSE} className={cn(MODAL_CLASS_NAME.CLOSE_BUTTON, RT_UI.BTN_ICON_TINY_W_8_H_8_MIN_W_32PX)}>
            <X className={cn(MODAL_CLASS_NAME.CLOSE_ICON, RT_UI.SHRINK_0)} />
          </Button>
        </div>
        <div className={cn(MODAL_CLASS_NAME.BODY)}>{children}</div>
      </div>
    </div>,
    document.body,
  );
};
