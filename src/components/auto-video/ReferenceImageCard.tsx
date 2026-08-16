import React from "react";
import { Image as ImageIcon, X, ZoomIn } from "lucide-react";

interface ReferenceImageCardProps {
  imageSrc: string;
  index: number;
  badgePrefix?: string;
  borderColorClass?: string;
  deleteTooltip?: string;
  previewTooltip?: string;
  onPreview: (src: string) => void;
  onDelete: (index: number) => void;
}

export const ReferenceImageCard: React.FC<ReferenceImageCardProps> = ({
  imageSrc,
  index,
  badgePrefix = "#",
  borderColorClass = "hover:border-sky-500/80 dark:hover:border-sky-400/80",
  deleteTooltip = "Xóa",
  previewTooltip = "Xem ảnh",
  onPreview,
  onDelete,
}) => {
  return (
    <div
      className={`group relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 ${borderColorClass} bg-slate-100 dark:bg-slate-950 shadow-sm transition-all duration-200 shrink-0`}
    >
      <img
        src={imageSrc}
        alt={`${badgePrefix}${index + 1}`}
        className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          (e.target as HTMLElement).style.display = "none";
        }}
      />
      <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600 -z-10">
        <ImageIcon className="w-6 h-6" />
      </div>
      <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md text-[9px] font-mono font-bold text-white px-1.5 py-0.5 rounded border border-white/10 pointer-events-none">
        {badgePrefix}{index + 1}
      </span>
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 p-1">
        <button
          type="button"
          onClick={() => onPreview(imageSrc)}
          title={previewTooltip}
          className="w-6 h-6 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-white/20 shadow-md transition-transform hover:scale-110"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(index)}
          title={deleteTooltip}
          className="w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center border border-white/20 shadow-md transition-transform hover:scale-110"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
