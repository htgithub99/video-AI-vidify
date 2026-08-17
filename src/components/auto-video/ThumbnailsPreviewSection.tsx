import _ from "lodash";
import { Download, ImageIcon } from "lucide-react";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";
import { AUTO_GENERATOR_CONSTANTS } from "../../constants/config";
import { deduplicateVisualStyleText } from "../../services/visualStyleDisplayService";
import { ThumbnailItem, VideoProject } from "../../types";

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
  const thumbnails = _.get(activeCreatedProject, "thumbnails", []) as ThumbnailItem[];
  if (_.isEmpty(thumbnails)) {
    return null;
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-left">
      <h3 className="text-xs font-bold text-slate-100 font-mono uppercase flex items-center gap-2" title={AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_TITLE_TOOLTIP}>
        <ImageIcon className="w-4 h-4 text-rose-500" /> {AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_TITLE}
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {_.map(thumbnails, (thumb) => {
          const displayStyle = deduplicateVisualStyleText(thumb.style);
          const promptText = thumb.generationPrompt || thumb.prompt;
          return (
            <div key={thumb.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-md flex flex-col sm:flex-row p-3 gap-3">
              <div className="sm:w-1/2 aspect-video relative overflow-hidden bg-slate-900 rounded-xl border border-slate-800">
                {thumb.imageUrl ? (
                  <img
                    src={thumb.imageUrl}
                    alt={AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_IDEA_FALLBACK}
                    className="w-full h-full object-cover"
                    onError={() => onThumbnailLoadError?.(thumb.id)}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500 text-[10px]">
                    <span>{AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_UNRENDERED}</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 right-2 min-w-0">
                  <span
                    className="block max-w-full overflow-hidden whitespace-nowrap text-ellipsis bg-black/60 backdrop-blur-md text-white border border-white/10 text-[9px] font-bold px-2 py-0.5 rounded-full"
                    title={displayStyle}
                  >
                    {displayStyle}
                  </span>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                <div>
                  {thumb.hasText && !_.isEmpty(thumb.textText) && (
                    <h4 className="text-amber-400 font-black text-xs uppercase mb-1 line-clamp-1">"{thumb.textText}"</h4>
                  )}
                  {!_.isEmpty(promptText) && (
                    <p className="text-[10px] text-slate-400 italic line-clamp-2 leading-relaxed">"{promptText}"</p>
                  )}
                </div>
                {thumb.imageUrl && (
                  <div className="pt-2 flex gap-2">
                    <Button
                      variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY as any}
                      size={REFACTOR_CONSTANTS.SIZE_SM as any}
                      onClick={() => handleDownloadThumbnail(thumb.imageUrl!, thumb.id)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold py-1.5 h-auto"
                      title={AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_DOWNLOAD_TOOLTIP}
                    >
                      <Download className="w-3.5 h-3.5" /> {AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_DOWNLOAD}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
