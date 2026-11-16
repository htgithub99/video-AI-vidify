import type { ReactNode } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { STUDIO_CONFIRM as C } from "../../constants/studioTheme.js";
import { SOURCE_TEXT_BUTTON, SOURCE_TEXT_DANGER, SOURCE_TEXT_OUTLINE, SOURCE_TEXT_SM } from "../../constants/sourceText.js";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  message: ReactNode;
  warning: ReactNode;
  cancelLabel: ReactNode;
  confirmLabel: ReactNode;
  busy?: boolean;
  children?: ReactNode;
}

/** The one delete confirmation dialog shared by every screen. */
export const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message, warning, cancelLabel, confirmLabel, busy, children }: ConfirmDeleteModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    maxWidth={C.MAX_WIDTH}
    title={
      <span className={C.TITLE}>
        <Trash2 className={C.TITLE_ICON} />
        <span className={C.TITLE_TEXT}>{title}</span>
      </span>
    }>
    <div className={C.BODY}>
      <p className={C.MESSAGE}>{message}</p>
      {children}
      <div className={C.WARNING}>
        <AlertTriangle className={C.WARNING_ICON} />
        <span>{warning}</span>
      </div>
      <div className={C.ACTIONS}>
        <Button type={SOURCE_TEXT_BUTTON} variant={SOURCE_TEXT_OUTLINE} size={SOURCE_TEXT_SM} onClick={onClose} className={C.CANCEL}>
          {cancelLabel}
        </Button>
        <Button type={SOURCE_TEXT_BUTTON} variant={SOURCE_TEXT_DANGER} size={SOURCE_TEXT_SM} disabled={busy} onClick={onConfirm} className={C.CONFIRM}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
);
