import { StudioCard, StudioInput } from "../ui/Studio.js";
import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { Activity, ImagePlus, Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { MOTION_REFERENCE_CONFIG as C, MOTION_REFERENCE_TEXTS as TEXT } from "../../constants/motionReference.js";
import { MOTION_STYLES as S } from "../../constants/motionStyles.js";
import * as MR from "../../constants/motionRuntime.js";
import type { MotionStyleReference } from "../../types/motionVideo.js";
import { Button } from "../ui/Button.js";
import { cn } from "../../lib/utils.js";
import { MotionToggleIndicator } from "./MotionToggle.js";
const encodeReference = async (file: File): Promise<MotionStyleReference> => {
  if (!C.ACCEPT.split(C.SEPARATOR).includes(file.type)) throw new Error(TEXT.vi.invalid);
  if (file.size > C.MAX_SOURCE_BYTES) throw new Error(TEXT.vi.size);
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, C.MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement(C.CANVAS);
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext(C.CONTEXT);
    if (!context) throw new Error(TEXT.vi.failed);
    context.fillStyle = C.WHITE;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { name: file.name, dataUrl: canvas.toDataURL(C.MIME_JPEG, C.JPEG_QUALITY) };
  } finally {
    bitmap.close();
  }
};
export interface MotionReferenceControlsProps {
  images: MotionStyleReference[];
  characterMotion?: boolean;
  disabled?: boolean;
  language?: "vi" | "en";
  onImages: (images: MotionStyleReference[]) => void;
  onMotion?: (enabled: boolean) => void;
  hideMotionToggle?: boolean;
  className?: string;
}
export const MotionReferenceControls = ({ images, characterMotion = false, disabled = false, language = MR.MOTION_TEXT_VI, onImages, onMotion, hideMotionToggle = false, className }: MotionReferenceControlsProps) => {
  const text = TEXT[language] ?? TEXT.vi;
  const input = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const upload = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    if (images.length + fileList.length > C.MAX_IMAGES) {
      toast.error(text.limit);
      return;
    }
    if (fileList.some((file) => !C.ACCEPT.split(C.SEPARATOR).includes(file.type))) {
      toast.error(text.invalid);
      return;
    }
    if (fileList.some((file) => file.size > C.MAX_SOURCE_BYTES)) {
      toast.error(text.size);
      return;
    }
    setUploadingCount(fileList.length);
    setLoading(true);
    try {
      const added = await Promise.all(fileList.map(encodeReference));
      onImages([...images, ...added]);
    } catch {
      toast.error(text.failed);
    } finally {
      setUploadingCount(0);
      setLoading(false);
    }
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !loading && images.length < C.MAX_IMAGES) {
      setIsDragging(true);
    }
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || loading) return;
    void upload(e.dataTransfer.files);
  };
  const isFull = images.length >= C.MAX_IMAGES;
  const hasAddButton = !isFull && images.length + uploadingCount < C.MAX_IMAGES;
  const loadingSlotsCount = Math.min(uploadingCount, C.MAX_IMAGES - images.length);
  const occupiedSlots = images.length + loadingSlotsCount + (hasAddButton ? 1 : 0);
  const emptySlotsCount = Math.max(0, C.MAX_IMAGES - occupiedSlots);
  return (
    <StudioCard className={cn(MR.MOTION_TEXT_ROUNDED_2XL_BORDER_BORDER_SLATE_200_90_DARK_BORDER_SLATE_800, isDragging && MR.MOTION_TEXT_BORDER_PURPLE_500_80_BG_PURPLE_50_70_DARK_BG_PURPLE_950_20_R, className)} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <div className={MR.MOTION_TEXT_FLEX_ITEMS_START_JUSTIFY_BETWEEN_GAP_3_PB_0_5}>
        <div className={MR.MOTION_TEXT_SPACE_Y_0_5_MIN_W_0}>
          <h3 className={MR.MOTION_TEXT_TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_800_DA}>
            <Sparkles className={MR.MOTION_TEXT_W_3_5_H_3_5_TEXT_PURPLE_600_DARK_TEXT_PURPLE_400_SHRINK_0} />
            {text.title}
          </h3>
          <p className={MR.MOTION_TEXT_TEXT_11PX_TEXT_SLATE_500_DARK_TEXT_SLATE_400_FONT_SANS_LEADI}>{text.hint}</p>
        </div>
        <span className={MR.MOTION_TEXT_TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_PURPLE_700_DARK_TEXT_PURP}>
          {images.length}
          {MR.MOTION_TEXT_SYMBOL_16}
          {C.MAX_IMAGES}
        </span>
      </div>
      <StudioInput
        ref={input}
        type={MR.MOTION_TEXT_FILE}
        accept={C.ACCEPT}
        multiple
        className={S.HIDDEN}
        disabled={disabled || loading}
        onChange={(event) => {
          void upload(event.target.files);
          event.target.value = C.EMPTY;
        }}
      />
      <div className={MR.MOTION_TEXT_GRID_GRID_COLS_2_SM_GRID_COLS_4_GAP_2_5_SM_GAP_3_ITEMS_START}>
        {images.map((image, index) => (
          <div key={MR.MOTION_TEMPLATE_EMPTY(image.name, index)} className={MR.MOTION_TEXT_RELATIVE_MIN_W_0_W_FULL_ASPECT_VIDEO_ROUNDED_XL_BORDER_BORDE}>
            <img src={image.dataUrl} alt={image.name} className={MR.MOTION_TEXT_ABSOLUTE_INSET_0_W_FULL_H_FULL_OBJECT_CONTAIN} />
            <div className={MR.MOTION_TEXT_POINTER_EVENTS_NONE_ABSOLUTE_INSET_0_BG_GRADIENT_TO_T_FROM_B}>
              <span className={MR.MOTION_TEXT_TEXT_9PX_FONT_MONO_FONT_BOLD_TEXT_WHITE_90_BG_BLACK_60_PX_1_}>{image.name}</span>
              <span className={MR.MOTION_TEXT_TEXT_9PX_FONT_MONO_TEXT_PURPLE_300_BG_PURPLE_950_80_BORDER_B}>
                {MR.MOTION_TEXT_SYMBOL_44}
                {index + 1}
              </span>
            </div>
            <Button variant={MR.MOTION_TEXT_UNSTYLED} disabled={disabled || loading} title={text.remove} aria-label={text.remove} onClick={() => onImages(images.filter((_, i) => i !== index))} className={MR.MOTION_TEXT_ABSOLUTE_TOP_2_RIGHT_2_P_1_TEXT_ROSE_500_HOVER_TEXT_ROSE_600}>
              <Trash2 className={MR.MOTION_TEXT_W_4_H_4} />
              <span className={MR.MOTION_TEXT_SR_ONLY}>{text.remove}</span>
            </Button>
          </div>
        ))}
        {Array.from({ length: loadingSlotsCount }).map((_, slotIdx) => (
          <div key={MR.MOTION_TEMPLATE_LOADING_SLOT(slotIdx)} className={MR.MOTION_TEXT_RELATIVE_MIN_W_0_W_FULL_ASPECT_VIDEO_ROUNDED_XL_BORDER_BORDE_2}>
            <Loader2 className={cn(MR.MOTION_TEXT_W_5_H_5_ANIMATE_SPIN, S.TEXT_PURPLE_400)} />
            <span className={cn(S.RENDER_CONTROL_LABEL, MR.MOTION_TEXT_TEXT_10PX_FONT_BOLD)}>{text.loading}</span>
          </div>
        ))}
        {hasAddButton ? (
          <Button
            variant={MR.MOTION_TEXT_UNSTYLED}
            disabled={disabled || loading}
            title={text.add}
            aria-label={text.add}
            onClick={() => input.current?.click()}
            className={cn(MR.MOTION_TEXT_RELATIVE_MIN_W_0_W_FULL_ASPECT_VIDEO_ROUNDED_XL_BORDER_BORDE_3, MR.MOTION_TEXT_BORDER_PURPLE_500_50_HOVER_BORDER_PURPLE_400_BG_PURPLE_50_50, (disabled || loading) && MR.MOTION_TEXT_OPACITY_60_CURSOR_NOT_ALLOWED_POINTER_EVENTS_NONE)}>
            <div className={MR.MOTION_TEXT_FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_GAP_1_TRANSITION_O}>
              {images.length === 0 ? <Upload className={cn(MR.MOTION_TEXT_W_5_H_5_GROUP_HOVER_SCALE_110_TRANSITION_TRANSFORM, S.TEXT_PURPLE_400)} /> : <ImagePlus className={cn(MR.MOTION_TEXT_W_4_H_4_SM_W_5_SM_H_5_TRANSITION_TRANSFORM_GROUP_HOVER_SCALE, S.TEXT_PURPLE_400)} />}
              <span className={cn(S.RENDER_CONTROL_LABEL, MR.MOTION_TEXT_LEADING_TIGHT_FONT_BOLD)}>{text.add}</span>
              <span className={cn(MR.MOTION_TEXT_TEXT_9PX_FONT_MONO, S.TEXT_SLATE_400)}>
                {images.length}
                {MR.MOTION_TEXT_SYMBOL_16}
                {C.MAX_IMAGES}
                {MR.MOTION_TEXT_PNG_JPG}
              </span>
            </div>
          </Button>
        ) : (
          <Button variant={MR.MOTION_TEXT_UNSTYLED} disabled={true} title={text.add} aria-label={text.add} className={MR.MOTION_TEXT_SR_ONLY}>
            {text.add}
          </Button>
        )}
        {Array.from({ length: emptySlotsCount }).map((_, emptyIdx) => {
          const slotNumber = images.length + loadingSlotsCount + (hasAddButton ? 1 : 0) + emptyIdx + 1;
          return (
            <div
              key={MR.MOTION_TEMPLATE_EMPTY_SLOT(slotNumber)}
              onClick={() => {
                if (!disabled && !loading) input.current?.click();
              }}
              title={text.add}
              className={cn(MR.MOTION_TEXT_RELATIVE_MIN_W_0_W_FULL_ASPECT_VIDEO_ROUNDED_XL_BORDER_BORDE_4, MR.MOTION_TEXT_BORDER_SLATE_200_80_HOVER_BORDER_PURPLE_400_50_DARK_BORDER_S, (disabled || loading) && MR.MOTION_TEXT_OPACITY_40_CURSOR_NOT_ALLOWED_POINTER_EVENTS_NONE)}>
              <ImagePlus className={MR.MOTION_TEXT_W_4_H_4_TEXT_SLATE_300_DARK_TEXT_SLATE_700_GROUP_HOVER_TEXT_} />
              <span className={MR.MOTION_TEXT_TEXT_9PX_FONT_MONO_TEXT_SLATE_400_DARK_TEXT_SLATE_600_GROUP_}>
                {MR.MOTION_TEXT_SYMBOL_44}
                {slotNumber}
              </span>
            </div>
          );
        })}
      </div>
      {!hideMotionToggle && onMotion && (
        <div className={MR.MOTION_TEXT_PT_2_5_BORDER_T_BORDER_SLATE_200_90_DARK_BORDER_SLATE_800_80}>
          <div className={MR.MOTION_TEXT_SPACE_Y_0_5_MIN_W_0_FLEX_1}>
            <span className={MR.MOTION_TEXT_TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_600_DARK_TEXT_SLATE}>{text.motion}</span>
            <p className={MR.MOTION_TEXT_TEXT_11PX_TEXT_SLATE_500_DARK_TEXT_SLATE_400_LEADING_RELAXED}>{text.motionHint}</p>
          </div>
          <Button
            variant={MR.MOTION_TEXT_UNSTYLED}
            role={MR.MOTION_TEXT_SWITCH}
            aria-checked={characterMotion}
            aria-label={text.motion}
            title={text.motionHint}
            disabled={disabled || loading}
            onClick={() => onMotion(!characterMotion)}
            className={cn(MR.MOTION_TEXT_PX_3_5_PY_2_ROUNDED_XL_BG_WHITE_DARK_BG_SLATE_955_80_BORDER_, (disabled || loading) && MR.MOTION_TEXT_OPACITY_50_CURSOR_NOT_ALLOWED_POINTER_EVENTS_NONE)}>
            <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2}>
              <Activity className={cn(MR.MOTION_TEXT_W_3_5_H_3_5_SHRINK_0, characterMotion ? MR.MOTION_TEXT_TEXT_PURPLE_600_DARK_TEXT_PURPLE_400 : MR.MOTION_TEXT_TEXT_SLATE_400_DARK_TEXT_SLATE_500)} />
              <span className={MR.MOTION_TEXT_TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_800_DARK_TEXT_SLATE_200}>{characterMotion ? text.on : text.off}</span>
            </div>
            <MotionToggleIndicator
              checked={characterMotion}
              trackClassName={MR.MOTION_TEXT_RELATIVE_INLINE_FLEX_H_5_W_9_SHRINK_0_ITEMS_CENTER_ROUNDED_F}
              activeTrackClassName={MR.MOTION_TEXT_BG_PURPLE_600}
              inactiveTrackClassName={MR.MOTION_TEXT_BG_SLATE_300_DARK_BG_SLATE_700}
              thumbClassName={MR.MOTION_TEXT_INLINE_BLOCK_H_4_W_4_ROUNDED_FULL_BG_WHITE_SHADOW_SM_TRANSIT}
              activeThumbClassName={MR.MOTION_TEXT_TRANSLATE_X_4}
              inactiveThumbClassName={MR.MOTION_TEXT_TRANSLATE_X_0}
            />
          </Button>
        </div>
      )}
    </StudioCard>
  );
};
