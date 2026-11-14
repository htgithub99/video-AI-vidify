import { useEffect, useRef, useState, type FC, type KeyboardEvent } from "react";
import { MOTION_STYLES as S } from "../constants/motionStyles.js";
import { MOTION_PICKER_KEYS as K } from "../constants/motionPicker.js";
export interface MotionPickerOption {
  id: string;
  name: string;
  hint: string;
  preview: string;
}
export const MotionVisualPicker: FC<{ label: string; value: string; options: MotionPickerOption[]; disabled?: boolean; onChange: (id: string) => void }> = ({ label, value, options, disabled, onChange }) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value) || options[0];
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!wrap.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener(K.MOUSEDOWN, close);
    return () => document.removeEventListener(K.MOUSEDOWN, close);
  }, [open]);
  const pick = (i: number) => { onChange(options[i].id); setOpen(false); };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === K.ESC) return setOpen(false);
    if (!open && (event.key === K.ENTER || event.key === K.DOWN || event.key === K.SPACE)) { event.preventDefault(); setActive(Math.max(0, options.indexOf(current))); return setOpen(true); }
    if (!open) return;
    if (event.key === K.DOWN || event.key === K.UP) { event.preventDefault(); setActive((i) => (i + (event.key === K.DOWN ? 1 : options.length - 1)) % options.length); }
    else if (event.key === K.ENTER || event.key === K.SPACE) { event.preventDefault(); pick(active); }
  };
  return (
    <div ref={wrap} className={S.PICKER_WRAP} onKeyDown={onKey}>
      <button type="button" disabled={disabled} aria-label={label} aria-haspopup="listbox" aria-expanded={open} title={current?.hint} className={S.PICKER_BUTTON} onClick={() => { setActive(Math.max(0, options.indexOf(current))); setOpen(!open); }}>
        <img src={current?.preview} alt="" className={S.PICKER_THUMB} />
        <span>{current?.name}</span>
      </button>
      {open && (
        <ul role="listbox" aria-label={label} className={S.PICKER_LIST}>
          {options.map((o, i) => (
            <li key={o.id} role="option" aria-selected={o.id === value}>
              <button type="button" className={[S.PICKER_OPTION, o.id === value ? S.PICKER_OPTION_ACTIVE : i === active ? S.PICKER_OPTION_HOVER : null].filter(Boolean).join(K.SPACE)} onMouseEnter={() => setActive(i)} onClick={() => pick(i)}>
                <img src={o.preview} alt="" className={S.PICKER_OPTION_THUMB} />
                <span className={S.PICKER_OPTION_TEXT}>
                  <span className={S.PICKER_OPTION_NAME}>{o.name}</span>
                  <span className={S.PICKER_OPTION_HINT}>{o.hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
