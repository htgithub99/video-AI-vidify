import { Upload, X, type LucideIcon } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import * as MR from "../../constants/motionRuntime.js";
import { VOICE_WORKSPACE_CONFIG as C, VOICE_WORKSPACE_STYLES as W } from "../../constants/motionVoiceWorkspace.js";
import { Button } from "../ui/Button.js";
import { StudioIcon } from "../ui/Studio.js";
export function MotionVoiceToolCard({ icon, title, description, badge, children }: { icon: LucideIcon; title: ReactNode; description: ReactNode; badge?: ReactNode; children: ReactNode }) {
  const titleId = useId() + C.TITLE_SUFFIX;
  return ( <section className={W.CARD} aria-labelledby={titleId}><div className={W.HEADER}><div className={W.HEADER_MAIN}><StudioIcon icon={icon} /><div className={W.COPY}><h3 id={titleId} className={W.TITLE}>{title}</h3><p className={W.HINT}>{description}</p></div></div>{badge && <span className={W.BADGE}>{badge}</span>}</div>{children}</section> );
}
export const MotionVoiceField = ({ label, children, className = W.FIELD, labelClassName = W.LABEL }: { label: ReactNode; children: ReactNode; className?: string; labelClassName?: string }) => ( <label className={className}><span className={labelClassName}>{label}</span>{children}</label> );
export function MotionVoiceAudioUpload({ title, hint, accept, disabled, multiple = false, onFiles }: { title: ReactNode; hint: ReactNode; accept: string; disabled: boolean; multiple?: boolean; onFiles: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input type={MR.MOTION_TEXT_FILE} ref={input} accept={accept} hidden multiple={multiple} disabled={disabled} onChange={(event) => { const files = Array.from(event.target.files || []); event.target.value = MR.MOTION_TEXT_EMPTY; if (files.length) onFiles(files); }} />
      <Button type={MR.MOTION_TEXT_BUTTON} variant={MR.MOTION_TEXT_UNSTYLED} className={W.UPLOAD} disabled={disabled} onClick={() => input.current?.click()}><span className={W.UPLOAD_ICON}><Upload className={W.ICON} /></span><span className={W.COPY}><span className={W.UPLOAD_TITLE}>{title}</span><span className={W.META}>{hint}</span></span></Button>
    </>
  );
}
export const MotionVoiceListItem = ({ icon: Icon, title, children, removeLabel, removeIcon: RemoveIcon = X, disabled, onRemove }: { icon: LucideIcon; title: string; children: ReactNode; removeLabel: string; removeIcon?: LucideIcon; disabled: boolean; onRemove: () => void }) => (
  <li className={W.FILE_ROW}><Icon className={W.ICON} /><div className={W.COPY}><p title={title} className={W.FILE_NAME}>{title}</p>{children}</div><Button type={MR.MOTION_TEXT_BUTTON} variant={MR.MOTION_TEXT_UNSTYLED} className={W.REMOVE} title={removeLabel} aria-label={removeLabel} disabled={disabled} onClick={onRemove}><RemoveIcon className={W.ICON_SMALL} /></Button></li>
);
