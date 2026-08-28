import { cn } from "../../lib/utils";
import React from "react";
import _ from "lodash";
import { Image as ImageIcon, X, ZoomIn } from "lucide-react";
import { REFACTOR_CONSTANTS, SecurityConstants } from "../../constants";

interface ReferenceImageCardProps {
  imageSrc: string;
  index: number;
  badgePrefix?: string;
  deleteTooltip?: string;
  previewTooltip?: string;
  onPreview: (src: string) => void;
  onDelete: (index: number) => void;
}

export const ReferenceImageCard: React.FC<ReferenceImageCardProps> = ({ imageSrc, index, badgePrefix = REFACTOR_CONSTANTS.VD_EMPTY_STRING, deleteTooltip = REFACTOR_CONSTANTS.VD_EMPTY_STRING, previewTooltip = REFACTOR_CONSTANTS.VD_EMPTY_STRING, onPreview, onDelete }) => {
  const displayIndex = _.add(index, SecurityConstants.DEFAULT_AMOUNT);
  const badgeLabel = _.join([badgePrefix, displayIndex], REFACTOR_CONSTANTS.VD_EMPTY_STRING);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLElement).style.display = REFACTOR_CONSTANTS.DISPLAY_NONE;
  };

  return (
    <div className={cn("group relative w-28 h-28 rounded-2xl overflow-hidden shadow-sm hover:shadow-md bg-slate-100 dark:bg-slate-900 transition-all duration-200 shrink-0")}>
      <img src={imageSrc} alt={badgeLabel} className={cn("w-full h-full object-cover transition-transform duration-300 group-hover:scale-105")} onError={handleImageError} />
      <div className={cn("absolute inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600 -z-10")}>
        <ImageIcon className={cn("w-6 h-6")} />
      </div>
      <span className={cn("absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md text-[9px] font-mono font-bold text-white px-1.5 py-0.5 rounded border border-white/10 pointer-events-none")}>{badgeLabel}</span>
      <div className={cn("absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 p-1")}>
        <button type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON} onClick={() => onPreview(imageSrc)} title={previewTooltip} className={cn("w-7 h-7 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-white/20 shadow-md transition-transform hover:scale-110 cursor-pointer")}>
          <ZoomIn className={cn("w-3.5 h-3.5")} />
        </button>
        <button type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON} onClick={() => onDelete(index)} title={deleteTooltip} className={cn("w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center border border-white/20 shadow-md transition-transform hover:scale-110 cursor-pointer")}>
          <X className={cn("w-3.5 h-3.5")} />
        </button>
      </div>
    </div>
  );
};
