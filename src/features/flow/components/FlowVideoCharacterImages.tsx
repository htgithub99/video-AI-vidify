import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_FLOW } from "../constants/runtimeText.js";
import { StudioInput } from "../../../components/ui/Studio.js";
import _ from "lodash";
import { SOURCE_TEXT_BUTTON, SOURCE_TEXT_FILE, SOURCE_TEXT_SYMBOL, SOURCE_TEXT_UNSTYLED } from "../../../constants/sourceText";
import { useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { FLOW_VIDEO_TEXTS } from "../../../constants";
import { FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG } from "../constants/flowVideoSettings";
import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/Button";
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
    <div className={cn(RT_SHARED.SPACE_Y_2)}>
      <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2)}>
        <span className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_TEXT_SLATE_200)}>{texts.CHARACTER_IMAGES}</span>
        <span className={cn(RT_FLOW.TEXT_10PX_TEXT_SLATE_500)}>
          {images.length}
          {SOURCE_TEXT_SYMBOL}
          {FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG.MAX_IMAGES}
        </span>
      </div>
      <StudioInput
        ref={fileInputRef}
        type={SOURCE_TEXT_FILE}
        accept={FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG.ACCEPT_ATTRIBUTE}
        multiple
        disabled={disabled}
        onChange={(event) => {
          if (event.target.files?.length) onAdd(event.target.files);
          event.target.value = "";
        }}
        className={cn(RT_SHARED.HIDDEN)}
      />
      <div className={cn(RT_FLOW.FLEX_FLEX_WRAP_GAP_2)}>
        {_.map(images, (image) => (
          <div key={image.id} className={cn(RT_FLOW.RELATIVE_W_20_H_20_ROUNDED_LG_BORDER_BORDER_SLATE)} title={image.name}>
            <img src={image.dataUrl} alt={image.name} className={cn(RT_SHARED.W_FULL_H_FULL_OBJECT_COVER)} />
            <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} disabled={disabled} onClick={() => onRemove(image.id)} title={texts.REMOVE_CHARACTER_IMAGE} aria-label={texts.REMOVE_CHARACTER_IMAGE} className={cn(RT_FLOW.BTN_ICON_TINY_ABSOLUTE_TOP_1_RIGHT_1_P_0)}>
              <Trash2 className={cn(RT_SHARED.W_3_5_H_3_5)} />
            </Button>
          </div>
        ))}
        {images.length < FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG.MAX_IMAGES && (
          <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} disabled={disabled} onClick={() => fileInputRef.current?.click()} title={texts.ADD_CHARACTER_IMAGES} className={cn(RT_FLOW.W_20_H_20_ROUNDED_LG_BORDER_BORDER_DASHED_BORDER)}>
            <ImagePlus className={cn(RT_SHARED.W_5_H_5)} />
            <span className={cn(RT_FLOW.TEXT_10PX_FONT_SEMIBOLD)}>{texts.BROWSE}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
