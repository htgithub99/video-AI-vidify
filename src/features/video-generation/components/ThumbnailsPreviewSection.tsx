import { RUNTIME_TEXT as RT_VIDEO_GENERATION } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { SOURCE_TEXT_A, SOURCE_TEXT_SYMBOL, SOURCE_TEXT_THUMBNAILS, SOURCE_TEXT_VI } from "../../../constants/sourceText";
import { cn } from "../../../lib/utils";
import React, { useState } from "react";
import _ from "lodash";
import { Download, ImageIcon, Sparkles } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { REFACTOR_CONSTANTS } from "../../../constants";
import { AUTO_GENERATOR_CONSTANTS } from "../../../constants/config";
import { THUMBNAILS_PREVIEW_TEXTS } from "../../../constants/texts";
import { ThumbnailItem, VideoProject } from "../../../types";
import { Lang } from "../../../lib/lang";
import { ImagePreviewModal } from "../../../components/common/ImagePreviewModal";
interface ThumbnailsPreviewSectionProps {
  activeCreatedProject: VideoProject | null | undefined;
  onThumbnailLoadError?: (thumbnailId: string) => void;
  currentLang?: Lang;
}
interface ThumbnailCardItemProps {
  thumb: ThumbnailItem;
  onPreview: (url: string) => void;
  onDownload: (imageUrl: string, thumbnailId?: string) => void;
  onLoadError?: (thumbnailId: string) => void;
  currentLang?: Lang;
}
const cleanThumbnailText = (text?: string): string => {
  if (!text || _.isEmpty(_.trim(text))) return REFACTOR_CONSTANTS.VD_EMPTY_STRING;
  return _.trim(text).replace(/^["'«“]+|["'»”]+$/g, "");
};
const handleDownloadThumbnail = (imageUrl: string, thumbnailId?: string): void => {
  const downloadLink = document.createElement(SOURCE_TEXT_A);
  downloadLink.href = imageUrl;
  const fileNameId = thumbnailId || AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_IDEA_FALLBACK;
  downloadLink.download = `${AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_FILE_PREFIX}${fileNameId}${REFACTOR_CONSTANTS.CACHE_EXT_PNG}`;
  downloadLink.click();
};
const ThumbnailCardItem: React.FC<ThumbnailCardItemProps> = ({ thumb, onPreview, onDownload, onLoadError, currentLang = SOURCE_TEXT_VI }) => {
  const thumbTexts = _.get(THUMBNAILS_PREVIEW_TEXTS, currentLang, THUMBNAILS_PREVIEW_TEXTS.vi);
  const promptText = cleanThumbnailText(thumb.generationPrompt || thumb.prompt);
  const headlineText = cleanThumbnailText(thumb.textText);
  const hasValidHeadline = thumb.hasText && !_.isEmpty(headlineText);
  return (
    <div className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_90_BORDER_BORDER_SLATE_800_90_ROUNDED)}>
      <div className={cn(RT_VIDEO_GENERATION.SM_W_1_2_ASPECT_VIDEO_RELATIVE_OVERFLOW_HIDDEN_BG)}>
        {thumb.imageUrl ? (
          <img src={thumb.imageUrl} alt={AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_IDEA_FALLBACK} className={cn(RT_VIDEO_GENERATION.W_FULL_H_FULL_OBJECT_COVER_CURSOR_POINTER)} onClick={() => onPreview(thumb.imageUrl!)} title={thumbTexts.ZOOM_TOOLTIP} onError={() => onLoadError?.(thumb.id)} />
        ) : (
          <div className={cn(RT_VIDEO_GENERATION.W_FULL_H_FULL_SKELETON_SHIMMER_FLEX_FLEX_COL_ITEMS)}>
            <Sparkles className={cn(RT_VIDEO_GENERATION.W_4_H_4_TEXT_PURPLE_400_ANIMATE_PULSE)} />
            <span className={cn(RT_VIDEO_GENERATION.FONT_MONO_FONT_BOLD_ANIMATE_PULSE)}>{thumbTexts.UNRENDERED}</span>
          </div>
        )}
      </div>
      <div className={cn(RT_VIDEO_GENERATION.FLEX_1_FLEX_FLEX_COL_JUSTIFY_BETWEEN_PY_0_5)}>
        <div className={cn(RT_SHARED.SPACE_Y_1_5)}>
          {hasValidHeadline && (
            <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_1_5)}>
              <span className={cn(RT_VIDEO_GENERATION.W_1_5_H_1_5_ROUNDED_FULL_BG_PURPLE)} />
              <h4 className={cn(RT_VIDEO_GENERATION.TEXT_PURPLE_300_FONT_EXTRABOLD_TEXT_XS_UPPERCASE_LINE_CLAMP)}>{headlineText}</h4>
            </div>
          )}
          {!_.isEmpty(promptText) && <p className={cn(RT_VIDEO_GENERATION.TEXT_10_5PX_TEXT_SLATE_400_FONT_NORMAL_LINE_CLAMP)}>{promptText}</p>}
        </div>
        {thumb.imageUrl && (
          <div className={cn(RT_VIDEO_GENERATION.PT_3)}>
            <Button type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON} variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED} onClick={() => onDownload(thumb.imageUrl!, thumb.id)} className={cn(RT_VIDEO_GENERATION.W_FULL_BG_GRADIENT_TO_R_FROM_PURPLE_600_VIA)} title={thumbTexts.DOWNLOAD_TOOLTIP}>
              <Download className={cn(RT_SHARED.W_3_5_H_3_5)} />
              <span>{thumbTexts.DOWNLOAD}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
export const ThumbnailsPreviewSection: React.FC<ThumbnailsPreviewSectionProps> = ({ activeCreatedProject, onThumbnailLoadError, currentLang = SOURCE_TEXT_VI }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const thumbTexts = _.get(THUMBNAILS_PREVIEW_TEXTS, currentLang, THUMBNAILS_PREVIEW_TEXTS.vi);
  const thumbnails = (_.get(activeCreatedProject, SOURCE_TEXT_THUMBNAILS, []) as ThumbnailItem[]) || [];
  const completedThumbnailCount = _.size(_.filter(thumbnails, (thumbnail) => !_.isEmpty(thumbnail.imageUrl)));
  if (_.isEmpty(thumbnails)) {
    return null;
  }
  return (
    <StudioCard className={cn(RT_VIDEO_GENERATION.BG_SLATE_900_60_BORDER_BORDER_SLATE_800_80_P)}>
      <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
        <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2)}>
          <span className={cn(RT_VIDEO_GENERATION.W_6_H_6_ROUNDED_LG_BG_PURPLE_500_15_1E2B1F)}>
            <ImageIcon className={cn(RT_SHARED.W_3_5_H_3_5)} />
          </span>
          <h3 className={cn(RT_VIDEO_GENERATION.TEXT_XS_FONT_BOLD_TEXT_SLATE_100_FONT_MONO_UPPERCASE_508AAB)} title={thumbTexts.TITLE_TOOLTIP}>
            {thumbTexts.TITLE}
          </h3>
        </div>
        <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_FONT_MONO_FONT_SEMIBOLD_TEXT_PURPLE_400_BG)}>
          {completedThumbnailCount}
          {SOURCE_TEXT_SYMBOL}
          {_.size(thumbnails)} {thumbTexts.SAMPLE_UNIT}
        </span>
      </div>
      <div className={cn(RT_VIDEO_GENERATION.GRID_GRID_COLS_1_GAP_3_5)}>
        {_.map(thumbnails, (thumb, idx) => (
          <ThumbnailCardItem key={thumb.id || idx} thumb={thumb} onPreview={setPreviewImage} onDownload={handleDownloadThumbnail} onLoadError={onThumbnailLoadError} currentLang={currentLang} />
        ))}
      </div>
      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </StudioCard>
  );
};
