import _ from "lodash";
import { SOURCE_TEXT_BUTTON, SOURCE_TEXT_FILE, SOURCE_TEXT_SYMBOL, SOURCE_TEXT_UNSTYLED } from "../../constants/sourceText";
import { useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { FLOW_VIDEO_TEXTS } from "../../constants";
import { FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG } from "../../constants/flowVideoSettings";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
export interface FlowVideoCharacterImage {
  id: string;
  name: string;
  dataUrl: string;
}
interface Props {
  images: FlowVideoCharacterImage[];
  disabled: boolean;
  texts: typeof FLOW_VIDEO_TEXTS.vi | typeof FLOW_VIDEO_TEXTS.en;
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
}
export default function FlowVideoCharacterImages({ images, disabled, texts, onAdd, onRemove }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={cn("space-y-2")}>
      <div className={cn("flex items-center justify-between gap-2")}>
        <span className={cn("text-xs font-bold text-slate-200")}>{texts.CHARACTER_IMAGES}</span>
        <span className={cn("text-[10px] text-slate-500")}>
          {images.length}
          {SOURCE_TEXT_SYMBOL}
          {FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG.MAX_IMAGES}
        </span>
      </div>
      <input
        ref={fileInputRef}
        type={SOURCE_TEXT_FILE}
        accept={FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG.ACCEPT_ATTRIBUTE}
        multiple
        disabled={disabled}
        onChange={(event) => {
          if (event.target.files?.length) onAdd(event.target.files);
          event.target.value = "";
        }}
        className={cn("hidden")}
      />
      <div className={cn("flex flex-wrap gap-2")}>
        {_.map(images, (image) => (
          <div key={image.id} className={cn("relative w-20 h-20 rounded-lg border border-slate-700 overflow-hidden bg-slate-900")} title={image.name}>
            <img src={image.dataUrl} alt={image.name} className={cn("w-full h-full object-cover")} />
            <Button
              variant={SOURCE_TEXT_UNSTYLED}
              type={SOURCE_TEXT_BUTTON}
              disabled={disabled}
              onClick={() => onRemove(image.id)}
              title={texts.REMOVE_CHARACTER_IMAGE}
              aria-label={texts.REMOVE_CHARACTER_IMAGE}
              className={cn("btn-icon-tiny absolute top-1 right-1 p-0.5 text-rose-400 hover:text-rose-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition-transform hover:scale-110 disabled:opacity-50")}>
              <Trash2 className={cn("w-3.5 h-3.5")} />
            </Button>
          </div>
        ))}
        {images.length < FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG.MAX_IMAGES && (
          <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} disabled={disabled} onClick={() => fileInputRef.current?.click()} title={texts.ADD_CHARACTER_IMAGES} className={cn("w-20 h-20 rounded-lg border border-dashed border-purple-500/40 text-purple-300 hover:bg-purple-500/10 flex flex-col items-center justify-center gap-1 disabled:opacity-50")}>
            <ImagePlus className={cn("w-5 h-5")} />
            <span className={cn("text-[10px] font-semibold")}>{texts.BROWSE}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
