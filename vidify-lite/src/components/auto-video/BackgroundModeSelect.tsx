import { ChevronDown, Layers } from "lucide-react";
import { BackgroundMode } from "../../types";
import { BACKGROUND_MODE_CONFIG } from "../../constants/config";

interface BackgroundModeSelectProps {
  value: BackgroundMode;
  onChange: (value: BackgroundMode) => void;
  language: "vi" | "en";
  label: string;
}

export const BackgroundModeSelect = ({ value, onChange, language, label }: BackgroundModeSelectProps) => {
  const labels = BACKGROUND_MODE_CONFIG.LABELS[language];
  const descriptions = BACKGROUND_MODE_CONFIG.DESCRIPTIONS[language];
  return (
    <label className="space-y-1 block">
      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{label}</span>
      <span className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2">
        <Layers className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
        <select value={value} onChange={(event) => onChange(event.target.value as BackgroundMode)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
          {BACKGROUND_MODE_CONFIG.OPTIONS.map((option) => <option key={option} value={option} className="bg-slate-955 text-slate-300">{`${labels[option]} — ${descriptions[option]}`}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
      </span>
    </label>
  );
};
