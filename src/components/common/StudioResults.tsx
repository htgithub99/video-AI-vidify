import { useEffect, useState, type ReactNode } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button.js";
import { Modal } from "../ui/Modal.js";
import { Pagination } from "../ui/Pagination.js";
import { StudioCard, StudioInput } from "../ui/Studio.js";
import { STUDIO_PAGINATION_TEXT } from "../../constants/studioTheme.js";
import { STUDIO_RESULTS as S, STUDIO_RESULTS_TEXT } from "../../constants/studioResults.js";
import { getPagination } from "../../lib/pagination.js";
import { formatMediaFileSize } from "../../lib/mediaFormat.js";
import { cn } from "../../lib/utils.js";
import type { Lang } from "../../lib/lang.js";
export type StudioDeleteOutcome = { failed?: string[]; error?: string; freedBytes?: number };
export type StudioResultSlots = { selected: boolean; select: ReactNode; remove: ReactNode };
type Props<T> = {
  items: T[];
  lang: Lang;
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  remove: (items: T[], all: boolean) => Promise<StudioDeleteOutcome | void>;
  renderItem: (item: T, slots: StudioResultSlots) => ReactNode;
  gridClassName: string;
  summary?: ReactNode;
  actions?: ReactNode;
  locked?: (item: T) => boolean;
  disabled?: boolean;
  scope?: "disk" | "list";
  pageSize?: number;
  className?: string;
};
const count = (template: string, n: number): string => template.replace(S.COUNT, String(n));
export const StudioResults = <T,>({ items, lang, getId, getTitle, remove, renderItem, gridClassName, summary, actions, locked, disabled = false, scope = "disk", pageSize = S.PAGE_SIZE, className }: Props<T>) => {
  const text = STUDIO_RESULTS_TEXT[lang] || STUDIO_RESULTS_TEXT.vi;
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ items: T[]; all: boolean } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pickable = locked ? items.filter((item) => !locked(item)) : items;
  const selected = pickable.filter((item) => picked.has(getId(item)));
  const allSelected = pickable.length > 0 && selected.length === pickable.length;
  const blocked = busy || disabled;
  const pickableIds = pickable.map(getId).join("\n");
  useEffect(() => {
    setPicked((previous) => {
      const next = new Set(pickableIds.split("\n").filter((id) => previous.has(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [pickableIds]);
  if (!items.length) return null;
  const { page: current, start, end } = getPagination(items.length, page, pageSize);
  const ask = (list: T[], all = false) => {
    setError("");
    setConfirm({ items: list, all });
  };
  const toggle = (id: string, on: boolean) =>
    setPicked((previous) => {
      const next = new Set(previous);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const run = async () => {
    if (!confirm) return;
    setBusy(true);
    setError("");
    try {
      const outcome = (await remove(confirm.items, confirm.all)) || {};
      const failedIds = new Set(outcome.failed || []);
      const failed = confirm.items.filter((item) => failedIds.has(getId(item)));
      const done = confirm.items.length - failed.length;
      if (done > 0) toast.success(outcome.freedBytes ? `${text.FREED} ${formatMediaFileSize(outcome.freedBytes)}` : count(text.DELETED, done));
      if (failed.length) {
        const message = [count(text.DELETE_FAILED, failed.length), outcome.error].filter(Boolean).join(" — ");
        setConfirm({ items: failed, all: false });
        setError(message);
        toast.error(message);
      } else setConfirm(null);
    } catch (e: any) {
      const message = e?.message || count(text.DELETE_FAILED, confirm.items.length);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };
  const list = scope === "list";
  const message = !confirm ? "" : confirm.all ? (list ? text.LIST_ALL : text.CONFIRM_ALL) : confirm.items.length === 1 ? (list ? text.LIST_ONE : text.CONFIRM_ONE) : count(list ? text.LIST_SELECTED : text.CONFIRM_SELECTED, confirm.items.length);
  return (
    <div className={cn(S.WRAP, className)}>
      <StudioCard className={S.TOOLBAR}>
        <label className={S.SELECT_ALL}>
          <StudioInput
            type="checkbox"
            className={S.CHECKBOX}
            checked={allSelected}
            ref={(input) => {
              if (input) input.indeterminate = selected.length > 0 && !allSelected;
            }}
            disabled={blocked || !pickable.length}
            onChange={() => setPicked(allSelected ? new Set() : new Set(pickable.map(getId)))}
          />
          <span>{text.SELECT_ALL}</span>
        </label>
        <div className={S.SUMMARY}>
          <span>
            {items.length} {text.SUMMARY}
            {summary}
          </span>
        </div>
        <div className={S.ACTIONS}>
          {selected.length > 0 && (
            <span className={S.SELECTION_COUNT} aria-live="polite">
              {text.SELECTED} {selected.length}/{pickable.length}
            </span>
          )}
          <Button variant="unstyled" type="button" onClick={() => ask(selected)} disabled={blocked || !selected.length} className={S.ACTION}>
            <Trash2 className={S.ACTION_ICON} />
            <span>
              {text.DELETE_SELECTED}
              {selected.length ? ` (${selected.length})` : ""}
            </span>
          </Button>
          {actions}
          <Button variant="unstyled" type="button" onClick={() => ask(pickable, true)} disabled={blocked || !pickable.length} title={text.DELETE_ALL} className={S.ACTION}>
            <Trash2 className={S.ACTION_ICON} />
            <span>{text.DELETE_ALL}</span>
          </Button>
        </div>
      </StudioCard>
      <div className={gridClassName}>
        {items.slice(start, end).map((item) => {
          const id = getId(item);
          const title = getTitle(item);
          const off = blocked || !!locked?.(item);
          const label = `${text.SELECT_ITEM}: ${title}`;
          return (
            <div key={id} className="contents">
              {renderItem(item, {
                selected: picked.has(id),
                select: (
                  <label className={S.SELECT} title={label}>
                    <StudioInput type="checkbox" className={S.CHECKBOX} aria-label={label} checked={picked.has(id)} disabled={off} onChange={(event) => toggle(id, event.target.checked)} />
                  </label>
                ),
                remove: (
                  <Button variant="unstyled" type="button" onClick={() => ask([item])} disabled={off} title={text.DELETE} aria-label={`${text.DELETE}: ${title}`} className={S.DELETE}>
                    <Trash2 className={S.DELETE_ICON} />
                  </Button>
                ),
              })}
            </div>
          );
        })}
      </div>
      <Pagination page={current} pageSize={pageSize} total={items.length} onChange={setPage} texts={STUDIO_PAGINATION_TEXT[lang] || STUDIO_PAGINATION_TEXT.vi} hideUnavailableNavigation />
      <Modal
        isOpen={!!confirm}
        onClose={() => !busy && setConfirm(null)}
        maxWidth={S.MODAL_WIDTH}
        title={
          <div className={S.MODAL_TITLE}>
            <Trash2 className={S.MODAL_TITLE_ICON} />
            <span>{text.CONFIRM_TITLE}</span>
          </div>
        }>
        <div className={S.MODAL_BODY}>
          {confirm && !confirm.all && (
            <ul className={S.MODAL_LIST}>
              {confirm.items.map((item) => (
                <li key={getId(item)}>{getTitle(item)}</li>
              ))}
            </ul>
          )}
          <p className={S.MODAL_MESSAGE}>{message}</p>
          {error && (
            <p role="alert" className={S.MODAL_ERROR}>
              {error}
            </p>
          )}
          <div className={S.MODAL_WARNING}>{text.IRREVERSIBLE}</div>
          <div className={S.MODAL_ACTIONS}>
            <Button variant="unstyled" type="button" onClick={() => setConfirm(null)} disabled={busy} className={S.MODAL_CANCEL}>
              {text.CANCEL}
            </Button>
            <Button variant="unstyled" type="button" onClick={() => void run()} disabled={busy} className={S.MODAL_CONFIRM}>
              {busy ? <Loader2 className={S.MODAL_SPIN} /> : <Trash2 className={S.MODAL_ICON} />}
              <span>{text.CONFIRM_YES}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
