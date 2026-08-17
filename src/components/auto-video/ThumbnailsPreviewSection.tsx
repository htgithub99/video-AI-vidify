import React, { useState } from "react";
import _ from "lodash";
import { Download, ImageIcon, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";
import { AUTO_GENERATOR_CONSTANTS } from "../../constants/config";
import { ThumbnailItem, VideoProject } from "../../types";
import { ImagePreviewModal } from "./ImagePreviewModal";

interface ThumbnailsPreviewSectionProps {
  activeCreatedProject: VideoProject | null | undefined;
  onThumbnailLoadError?: (thumbnailId: string) => void;
}

const handleDownloadThumbnail = (imageUrl: string, thumbnailId?: string): void => {
  const downloadLink = document.createElement("a");
  downloadLink.href = imageUrl;
  const fileNameId = thumbnailId || AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_IDEA_FALLBACK;
  downloadLink.download = `${AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_FILE_PREFIX}${fileNameId}${REFACTOR_CONSTANTS.CACHE_EXT_PNG}`;
  downloadLink.click();
};

export const ThumbnailsPreviewSection: React.FC<ThumbnailsPreviewSectionProps> = ({
  activeCreatedProject,
  onThumbnailLoadError,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const thumbnails = _.get(activeCreatedProject, "thumbnails", []) as ThumbnailItem[];
  if (_.isEmpty(thumbnails)) {
    return null;
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xl backdrop-blur-md text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-extrabold text-xs shadow-sm shadow-purple-500/20">
            <ImageIcon className="w-3.5 h-3.5" />
          </span>
          <h3 className="text-xs font-bold text-slate-100 font-mono uppercase flex items-center gap-1.5" title={AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_TITLE_TOOLTIP}>
            {AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_TITLE}
          </h3>
        </div>

        <span className="text-[10px] font-mono font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
          {thumbnails.length} mẫu
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {_.map(thumbnails, (thumb, idx) => {
          const promptText = thumb.generationPrompt || thumb.prompt;
          return (
            <div key={thumb.id || idx} className="bg-slate-955/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-md flex flex-col sm:flex-row p-3 gap-3.5">
              <div className="sm:w-1/2 aspect-video relative overflow-hidden bg-slate-900 rounded-xl border border-slate-800/80 shrink-0">
                {thumb.imageUrl ? (
                  <img
                    src={thumb.imageUrl}
                    alt={AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_IDEA_FALLBACK}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setPreviewImage(thumb.imageUrl!)}
                    title="Bấm để xem ảnh phóng to"
                    onError={() => onThumbnailLoadError?.(thumb.id)}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-slate-500 text-[10px] gap-1">
                    <Sparkles className="w-4 h-4 text-slate-600 animate-pulse" />
                    <span>{AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_UNRENDERED}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                <div className="space-y-1.5">
                  {thumb.hasText && !_.isEmpty(thumb.textText) && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      <h4 className="text-purple-300 font-extrabold text-xs uppercase line-clamp-1 tracking-wide">
                        "{thumb.textText}"
                      </h4>
                    </div>
                  )}
                  {!_.isEmpty(promptText) && (
                    <p className="text-[10.5px] text-slate-400 font-normal line-clamp-3 leading-relaxed">
                      "{promptText}"
                    </p>
                  )}
                </div>

                {thumb.imageUrl && (
                  <div className="pt-3">
                    <Button
                      type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                      variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                      onClick={() => handleDownloadThumbnail(thumb.imageUrl!, thumb.id)}
                      className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-md shadow-purple-950/40 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group/btn"
                      title={AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_DOWNLOAD_TOOLTIP}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_DOWNLOAD}</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
};
