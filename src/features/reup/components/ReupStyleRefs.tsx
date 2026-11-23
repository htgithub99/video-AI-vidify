import { useRef, useState, type ChangeEvent, type FC } from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { readBlobAsDataUrl } from "../../../lib/fileUtils.js";
import { motionRequest } from "../../motion/components/motionApi.js";
import { REUP_THUMBS, REUP_URL } from "../constants/reupConfig.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import type { ReupStudio } from "../hooks/useReupStudio.js";
export const ReupStyleRefs: FC<{ studio: ReupStudio; disabled: boolean }> = ({ studio, disabled }) => {
  const { text, settings, patch } = studio;
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const list = settings.thumbStyles || [];
  const room = REUP_THUMBS.STYLE.MAX - list.length;
  const add = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, room);
    event.target.value = "";
    if (!files.length) return;
    setBusy(true);
    const urls: string[] = [];
    let bad = 0;
    for (const file of files) {
      const res = file.type.startsWith("image/")
        ? await readBlobAsDataUrl(file)
            .then((image) => motionRequest<{ url: string }>(REUP_URL.STYLE, { image }))
            .catch(() => null)
        : null;
      if (res?.url) urls.push(res.url);
      else bad++;
    }
    setBusy(false);
    if (bad) toast.error(text.THUMB_STYLE_BAD);
    if (urls.length) patch({ thumbStyles: [...new Set([...list, ...urls])].slice(0, REUP_THUMBS.STYLE.MAX) });
  };
  return (
    <div className={S.STYLE_BOX}>
      <p className={S.STYLE_LABEL}>{text.THUMB_STYLE}</p>
      <p className={S.STYLE_HINT}>{text.THUMB_STYLE_HINT}</p>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => void add(e)} disabled={disabled || busy} className={S.HIDDEN} />
      <div className={S.STYLE_GRID}>
        {list.map((url) => (
          <div key={url} className={S.STYLE_ITEM}>
            <a href={url} target="_blank" rel="noreferrer">
              <img src={url} alt={text.THUMB_STYLE_ALT} className={S.STYLE_IMG} />
            </a>
            <button type="button" disabled={disabled} title={text.THUMB_STYLE_REMOVE} aria-label={text.THUMB_STYLE_REMOVE} onClick={() => patch({ thumbStyles: list.filter((u) => u !== url) })} className={S.STYLE_REMOVE}>
              <X className={S.STYLE_ADD_ICON} />
            </button>
          </div>
        ))}
        {room > 0 && (
          <button type="button" disabled={disabled || busy} onClick={() => input.current?.click()} className={S.STYLE_ADD}>
            <Upload className={S.STYLE_ADD_ICON} />
            <span className={S.STYLE_ADD_TEXT}>{text.THUMB_STYLE_ADD}</span>
            <span className={S.STYLE_ADD_SUB}>{text.THUMB_STYLE_SUB}</span>
          </button>
        )}
      </div>
    </div>
  );
};
