import { cn } from "../../lib/utils";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { IBaseModalProps } from "../../types";
import { X } from "lucide-react";
import { stopPropagation } from "../../utils/helpers";
import { Button } from "./Button";
import { MODAL_CLASS_NAME, MODAL_SIZE_CLASS_NAME } from "../../constants";

export const Modal: React.FC<IBaseModalProps> = ({ isOpen, onClose, title, children, maxWidth }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isFullClass = maxWidth?.startsWith(MODAL_CLASS_NAME.WIDTH_PREFIX);
  const maxWidthClass = maxWidth
    ? isFullClass
      ? maxWidth
      : MODAL_SIZE_CLASS_NAME[maxWidth] || `${MODAL_CLASS_NAME.WIDTH_PREFIX}${maxWidth}`
    : MODAL_CLASS_NAME.DEFAULT_WIDTH;

  return createPortal(
    <div className={cn(MODAL_CLASS_NAME.OVERLAY)} onClick={onClose}>
      <div
        className={cn(
          MODAL_CLASS_NAME.CONTENT,
          maxWidthClass,
        )}
        onClick={stopPropagation}>
        <div className={cn(MODAL_CLASS_NAME.TOP_DECORATION)} />
        <div className={cn(MODAL_CLASS_NAME.BOTTOM_DECORATION)} />

        <div className={cn(MODAL_CLASS_NAME.HEADER)}>
          {title && (
            <h2
              className={cn(MODAL_CLASS_NAME.TITLE, "uppercase tracking-wider font-extrabold select-none [&_*]:uppercase")}>
              {typeof title === "string" ? title.toUpperCase() : title}
            </h2>
          )}
          <Button
            type="button"
            variant="unstyled"
            onClick={onClose}
            aria-label="Close"
            className={cn(MODAL_CLASS_NAME.CLOSE_BUTTON, "btn-icon-tiny !w-8 !h-8 !min-w-[32px] !min-h-[32px] !max-w-[32px] !max-h-[32px] !p-0 aspect-square rounded-lg")}>
            <X className={cn(MODAL_CLASS_NAME.CLOSE_ICON, "shrink-0")} />
          </Button>
        </div>

        <div className={cn(MODAL_CLASS_NAME.BODY)}>{children}</div>
      </div>
    </div>,
    document.body,
  );
};
