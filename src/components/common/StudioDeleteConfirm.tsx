import { useCallback, useState, type ReactNode } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "../ui/Button.js";
import { Modal } from "../ui/Modal.js";
import { STUDIO_RESULTS as S, STUDIO_RESULTS_TEXT } from "../../constants/studioResults.js";
import type { Lang } from "../../lib/lang.js";
export interface StudioDeleteRequest {
  names: string[];
  message: ReactNode;
  run: () => Promise<unknown> | unknown;
}
export const useStudioDeleteConfirm = () => {
  const [request, setRequest] = useState<StudioDeleteRequest | null>(null);
  const ask = useCallback((next: StudioDeleteRequest) => setRequest(next), []);
  const close = useCallback(() => setRequest(null), []);
  return { request, ask, close };
};
export const StudioDeleteConfirm = ({ request, onClose, lang }: { request: StudioDeleteRequest | null; onClose: () => void; lang: Lang }) => {
  const text = STUDIO_RESULTS_TEXT[lang] || STUDIO_RESULTS_TEXT.vi;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const confirm = async () => {
    if (!request) return;
    setBusy(true);
    setError("");
    try {
      await request.run();
      onClose();
    } catch (e) {
      setError(String((e as Error)?.message || e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      isOpen={!!request}
      onClose={() => !busy && (setError(""), onClose())}
      maxWidth={S.MODAL_WIDTH}
      title={
        <div className={S.MODAL_TITLE}>
          <Trash2 className={S.MODAL_TITLE_ICON} />
          <span>{text.CONFIRM_TITLE}</span>
        </div>
      }
    >
      <div className={S.MODAL_BODY}>
        {!!request?.names.length && (
          <ul className={S.MODAL_LIST}>
            {request.names.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}
        <p className={S.MODAL_MESSAGE}>{request?.message}</p>
        {error && (
          <p role="alert" className={S.MODAL_ERROR}>
            {error}
          </p>
        )}
        <div className={S.MODAL_WARNING}>{text.IRREVERSIBLE}</div>
        <div className={S.MODAL_ACTIONS}>
          <Button variant="unstyled" type="button" onClick={onClose} disabled={busy} className={S.MODAL_CANCEL}>
            {text.CANCEL}
          </Button>
          <Button variant="unstyled" type="button" onClick={() => void confirm()} disabled={busy} className={S.MODAL_CONFIRM}>
            {busy ? <Loader2 className={S.MODAL_SPIN} /> : <Trash2 className={S.MODAL_ICON} />}
            <span>{text.CONFIRM_YES}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
