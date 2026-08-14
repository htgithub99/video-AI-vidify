import _ from "lodash";
import { Download, ImageIcon } from "lucide-react";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";
import { AUTO_GENERATOR_CONSTANTS } from "../../constants/config";
import { deduplicateVisualStyleText } from "../../services/visualStyleDisplayService";

interface ThumbnailsPreviewSectionProps {
  activeCreatedProject: any;
  onThumbnailLoadError?: (thumbnailId: string) => void;
}

export const ThumbnailsPreviewSection: React.FC<ThumbnailsPreviewSectionProps> = ({ activeCreatedProject, onThumbnailLoadError }) => {
  if (!activeCreatedProject?.thumbnails || activeCreatedProject.thumbnails.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-left">
      <h3 className="text-xs font-bold text-slate-100 font-mono uppercase flex items-center gap-2" title={AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_TITLE_TOOLTIP}>
        <ImageIcon className="w-4 h-4 text-rose-500" /> {AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_TITLE}
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {_.map(activeCreatedProject.thumbnails, (thumb) => {
          const displayStyle = deduplicateVisualStyleText(thumb.style);
          return (
          <div key={thumb.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-md flex flex-col sm:flex-row p-3 gap-3">
            <div className="sm:w-1/2 aspect-video relative overflow-hidden bg-slate-900 rounded-xl border border-slate-800">
              {thumb.imageUrl ? (
                <img
                  src={thumb.imageUrl}
                  alt="Thumbnail Idea"
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
                {thumb.hasText && thumb.textText && (
                  <h4 className="text-amber-400 font-black text-xs uppercase mb-1 line-clamp-1">"{thumb.textText}"</h4>
                )}
                <p className="text-[10px] text-slate-400 italic line-clamp-2 leading-relaxed">"{thumb.prompt}"</p>
              </div>
              {thumb.imageUrl && (
                <div className="pt-2 flex gap-2">
                  <Button
                    variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY as any}
                    size={REFACTOR_CONSTANTS.SIZE_SM as any}
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = thumb.imageUrl!;
                      a.download = `${AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_FILE_PREFIX}${thumb.id || AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_IDEA_FALLBACK}${REFACTOR_CONSTANTS.CACHE_EXT_PNG}`;
                      a.click();
                    }}
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
