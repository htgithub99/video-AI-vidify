import { forwardRef, useCallback, useEffect, useRef, useState, type ChangeEvent, type FocusEvent, type HTMLAttributes, type FieldsetHTMLAttributes, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Disc3, SlidersHorizontal, Sparkles, type LucideIcon } from "lucide-react";
import { STUDIO_UI as S } from "../../constants/studioTheme.js";
import { cn } from "../../lib/utils.js";
import { studioControlClassName } from "../../lib/studioTheme.js";
import { Button } from "./Button.js";
import type { IBaseButtonProps } from "../../types.js";
export const StudioLoadingState = ({ title, description, icon: Icon = Disc3, secondary = false, className }: { title: ReactNode; description?: ReactNode; icon?: LucideIcon; secondary?: boolean; className?: string }) => (
  <div role={S.STATUS_ROLE} aria-live={S.POLITE_LIVE} className={cn(S.LOADING, className)}>
    <div className={cn(S.LOADING_FRAME, secondary ? S.LOADING_FRAME_SECONDARY : S.LOADING_FRAME_PRIMARY)}>
      <Icon className={secondary ? S.LOADING_ICON_SECONDARY : S.LOADING_ICON_PRIMARY} />
    </div>
    <div className={S.LOADING_COPY}>
      <p className={S.LOADING_TITLE}>{title}</p>
      {description && <p className={S.LOADING_DESCRIPTION}>{description}</p>}
    </div>
  </div>
);
export const StudioPage = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div {...props} ref={ref} className={cn(S.PAGE, className)} />);
export const StudioCanvas = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div {...props} ref={ref} className={cn(S.CANVAS, className)} />);
export const StudioCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div {...props} ref={ref} className={cn(S.CARD, className)} />);
export const StudioFieldset = forwardRef<HTMLFieldSetElement, FieldsetHTMLAttributes<HTMLFieldSetElement>>(({ className, ...props }, ref) => <fieldset {...props} ref={ref} className={cn(S.FIELDSET, className)} />);
type Deferred = { deferred?: boolean };
const useDeferredValue = <E extends HTMLInputElement | HTMLTextAreaElement>(deferred: boolean | undefined, value: unknown, onChange?: (event: ChangeEvent<E>) => void, onBlur?: (event: FocusEvent<E>) => void) => {
  const [local, setLocal] = useState(value);
  const pending = useRef<ChangeEvent<E> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef(onChange);
  latest.current = onChange;
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const event = pending.current;
    pending.current = null;
    if (event) latest.current?.(event);
  }, []);
  useEffect(() => {
    if (!pending.current) setLocal(value);
  }, [value]);
  useEffect(() => flush, [flush]);
  if (!deferred) return { value, onChange, onBlur };
  return {
    value: local as typeof value,
    onChange: (event: ChangeEvent<E>) => {
      setLocal(event.target.value);
      pending.current = event;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, S.DEFER_MS);
    },
    onBlur: (event: FocusEvent<E>) => {
      flush();
      onBlur?.(event);
    },
  };
};
export const StudioInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & Deferred>(({ className, deferred, value, onChange, onBlur, ...props }, ref) => {
  const field = useDeferredValue<HTMLInputElement>(deferred, value, onChange, onBlur);
  return <input {...props} value={field.value as InputHTMLAttributes<HTMLInputElement>["value"]} onChange={field.onChange} onBlur={field.onBlur} ref={ref} className={studioControlClassName(cn(S.INPUT, className))} />;
});
export const StudioSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => <select {...props} ref={ref} className={studioControlClassName(cn(S.SELECT, className))} />);
export const StudioTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & Deferred>(({ className, deferred, value, onChange, onBlur, ...props }, ref) => {
  const field = useDeferredValue<HTMLTextAreaElement>(deferred, value, onChange, onBlur);
  return <textarea {...props} value={field.value as TextareaHTMLAttributes<HTMLTextAreaElement>["value"]} onChange={field.onChange} onBlur={field.onBlur} ref={ref} className={studioControlClassName(cn(S.TEXTAREA, className))} />;
});
export const StudioSegmentedControl = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div role={S.GROUP_ROLE} {...props} ref={ref} className={cn(S.SEGMENTED, className)} />);
export const StudioSegmentButton = ({ selected, className, ...props }: Omit<IBaseButtonProps, "variant"> & { selected: boolean }) => <Button {...props} type={props.type ?? S.BUTTON_TYPE} variant={S.UNSTYLED} aria-pressed={selected} className={cn(S.SEGMENT, className)} />;
export const StudioIcon = ({ icon: Icon }: { icon: LucideIcon }) => (
  <div className={S.ICON_FRAME}>
    <div className={S.ICON_INNER}>
      <Icon className={S.ICON} />
    </div>
  </div>
);
export const StudioHeader = ({ icon: Icon, title, description, badge, actions, children, className }: { icon: LucideIcon; title: ReactNode; description?: ReactNode; badge?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string }) => (
  <StudioCard className={cn(S.HEADER, className)}>
    <div className={S.HEADER_CONTENT}>
      <StudioIcon icon={Icon} />
      <div className={S.MIN_WIDTH}>
        <div className={S.TITLE_ROW}>
          <h1 className={S.TITLE}>{title}</h1>
          {badge && (
            <span className={S.BADGE}>
              <Sparkles className={S.BADGE_ICON} />
              {badge}
            </span>
          )}
          {children}
        </div>
        {description && <p className={S.DESCRIPTION}>{description}</p>}
      </div>
    </div>
    {actions && <div className={S.ACTIONS}>{actions}</div>}
  </StudioCard>
);
export const StudioDisclosureButton = ({ expanded, label, className, ...props }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { expanded: boolean; label: ReactNode }) => (
  <Button {...props} type={props.type ?? S.BUTTON_TYPE} variant={S.UNSTYLED} aria-expanded={expanded} className={cn(S.DISCLOSURE, className)}>
    <SlidersHorizontal className={S.DISCLOSURE_ICON} />
    <span>{label}</span>
    {expanded ? <ChevronUp className={S.DISCLOSURE_ICON} /> : <ChevronDown className={S.DISCLOSURE_ICON} />}
  </Button>
);
