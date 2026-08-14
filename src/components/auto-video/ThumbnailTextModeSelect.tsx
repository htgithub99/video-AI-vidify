import { ChevronDown, Type } from "lucide-react";
import { THUMBNAIL_TEXT_MODE_CONFIG } from "../../constants/config";
import { ThumbnailTextMode } from "../../types";

interface ThumbnailTextModeSelectProps {
  value: ThumbnailTextMode;
  onChange: (value: ThumbnailTextMode) => void;
  language: "vi" | "en";
  label: string;
}

export const ThumbnailTextModeSelect = ({ value, onChange, language, label }: ThumbnailTextModeSelectProps) => {
  const labels = THUMBNAIL_TEXT_MODE_CONFIG.LABELS[language];
  const descriptions = THUMBNAIL_TEXT_MODE_CONFIG.DESCRIPTIONS[language];
  return (
    <label className="space-y-1 block">
      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{label}</span>
      <span className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2">
        <Type className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
        <select value={value} onChange={(event) => onChange(event.target.value as ThumbnailTextMode)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
          {THUMBNAIL_TEXT_MODE_CONFIG.OPTIONS.map(option => <option key={option} value={option} className="bg-slate-955 text-slate-300">{`${labels[option]} — ${descriptions[option]}`}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
      </span>
    </label>
  );
};
