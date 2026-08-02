import React from "react";
import _ from "lodash";
import { Download, Layout } from "lucide-react";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";

interface ThumbnailsPanelSectionProps {
  activeCreatedProject: any;
  T: any;
}

export const ThumbnailsPanelSection: React.FC<ThumbnailsPanelSectionProps> = ({ activeCreatedProject, T }) => {
  if (!activeCreatedProject?.thumbnails || _.isEmpty(activeCreatedProject.thumbnails)) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl col-span-1 sm:col-span-2 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

      <h3 className="text-xs font-bold text-slate-100 font-mono uppercase flex items-center gap-2" title={T.thumbnailsTitleTooltip}>
        <Layout className="w-4 h-4 text-purple-400" /> {T.thumbnailsTitle}
      </h3>

      <div className="bg-slate-950 rounded-2xl border border-slate-800/80 p-4 shadow-inner">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {_.map(activeCreatedProject.thumbnails, (thumbUrl: string, idx: number) => (
            <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group shadow-md border border-slate-800 hover:border-purple-500/30 transition-colors">
              <img src={thumbUrl} alt={`${T.thumbAltText} ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant={REFACTOR_CONSTANTS.VARIANT_SECONDARY}
                  size={REFACTOR_CONSTANTS.SIZE_SM}
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = thumbUrl;
                    a.download = _.join([activeCreatedProject.name, REFACTOR_CONSTANTS.AVG_THUMB_SUFFIX, idx + 1, REFACTOR_CONSTANTS.AVG_PNG_SUFFIX], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
                    a.click();
                  }}
                  className="bg-slate-900/80 hover:bg-slate-800 text-slate-100 backdrop-blur-sm border-none shadow-xl"
                  title={T.downloadThumbTooltip}
                >
                  <Download className="w-4 h-4" /> {T.downloadThumbBtn}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
