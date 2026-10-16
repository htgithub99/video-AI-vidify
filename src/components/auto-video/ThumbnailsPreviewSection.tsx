import { StudioCard } from "../ui/Studio.js";
import { SOURCE_TEXT_A, SOURCE_TEXT_SYMBOL, SOURCE_TEXT_THUMBNAILS, SOURCE_TEXT_VI } from "../../constants/sourceText";
import { cn } from "../../lib/utils";
import React, { useState } from "react";
import _ from "lodash";
import { Download, ImageIcon, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";
import { AUTO_GENERATOR_CONSTANTS } from "../../constants/config";
import { THUMBNAILS_PREVIEW_TEXTS } from "../../constants/texts";
import { ThumbnailItem, VideoProject } from "../../types";
import { Lang } from "../../lib/lang";
import { ImagePreviewModal } from "./ImagePreviewModal";
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
    <div className={cn("bg-slate-955/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-md flex flex-col sm:flex-row p-3 gap-3.5")}>
      <div className={cn("sm:w-1/2 aspect-video relative overflow-hidden bg-slate-900 rounded-xl border border-slate-800/80 shrink-0")}>
        {thumb.imageUrl ? (
          <img src={thumb.imageUrl} alt={AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_IDEA_FALLBACK} className={cn("w-full h-full object-cover cursor-pointer")} onClick={() => onPreview(thumb.imageUrl!)} title={thumbTexts.ZOOM_TOOLTIP} onError={() => onLoadError?.(thumb.id)} />
        ) : (
          <div className={cn("w-full h-full skeleton-shimmer flex flex-col items-center justify-center text-slate-400 text-[10px] gap-1.5 p-2")}>
            <Sparkles className={cn("w-4 h-4 text-purple-400 animate-pulse")} />
            <span className={cn("font-mono font-bold animate-pulse")}>{thumbTexts.UNRENDERED}</span>
          </div>
        )}
      </div>
      <div className={cn("flex-1 flex flex-col justify-between py-0.5 min-w-0")}>
        <div className={cn("space-y-1.5")}>
          {hasValidHeadline && (
            <div className={cn("flex items-center gap-1.5")}>
              <span className={cn("w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0")} />
              <h4 className={cn("text-purple-300 font-extrabold text-xs uppercase line-clamp-1 tracking-wide")}>{headlineText}</h4>
            </div>
          )}
          {!_.isEmpty(promptText) && <p className={cn("text-[10.5px] text-slate-400 font-normal line-clamp-3 leading-relaxed")}>{promptText}</p>}
        </div>
        {thumb.imageUrl && (
          <div className={cn("pt-3")}>
            <Button
              type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
              variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
              onClick={() => onDownload(thumb.imageUrl!, thumb.id)}
              className={cn("w-full bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-md shadow-purple-950/40 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group/btn")}
              title={thumbTexts.DOWNLOAD_TOOLTIP}>
              <Download className={cn("w-3.5 h-3.5")} />
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
    <StudioCard className={cn("bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xl backdrop-blur-md text-left")}>
      <div className={cn("flex items-center justify-between")}>
        <div className={cn("flex items-center gap-2")}>
          <span className={cn("w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-extrabold text-xs shadow-sm shadow-purple-500/20")}>
            <ImageIcon className={cn("w-3.5 h-3.5")} />
          </span>
          <h3 className={cn("text-xs font-bold text-slate-100 font-mono uppercase flex items-center gap-1.5")} title={thumbTexts.TITLE_TOOLTIP}>
            {thumbTexts.TITLE}
          </h3>
        </div>
        <span className={cn("text-[10px] font-mono font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full")}>
          {completedThumbnailCount}
          {SOURCE_TEXT_SYMBOL}
          {_.size(thumbnails)} {thumbTexts.SAMPLE_UNIT}
        </span>
      </div>
      <div className={cn("grid grid-cols-1 gap-3.5")}>
        {_.map(thumbnails, (thumb, idx) => (
          <ThumbnailCardItem key={thumb.id || idx} thumb={thumb} onPreview={setPreviewImage} onDownload={handleDownloadThumbnail} onLoadError={onThumbnailLoadError} currentLang={currentLang} />
        ))}
      </div>
      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </StudioCard>
  );
};
