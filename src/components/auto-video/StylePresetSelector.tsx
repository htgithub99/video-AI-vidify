import React, { useState, useMemo } from "react";
import _ from "lodash";
import { Palette, Check, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { CURATED_STYLE_PRESETS, STYLE_CATEGORIES, StyleCategory } from "../../constants/stylePresets";
import { cn } from "../../lib/utils";

interface StylePresetSelectorProps {
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;
  language?: string;
  label?: string;
  accentColor?: "blue" | "purple";
}

export const StylePresetSelector: React.FC<StylePresetSelectorProps> = ({
  selectedStyle,
  onSelectStyle,
  language = "vi",
  label = "Phong cách hình ảnh",
  accentColor = "blue",
}) => {
  const isVi = language === "vi";
  const isPurple = accentColor === "purple";
  const [activeCategory, setActiveCategory] = useState<StyleCategory>("all");
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const presetsList = useMemo(() => Object.values(CURATED_STYLE_PRESETS), []);

  const currentPreset = useMemo(() => {
    return _.find(presetsList, (p) => 
      p.id === selectedStyle || 
      _.isEqual(_.toLower(p.name), _.toLower(selectedStyle)) ||
      _.some(p.keywords, (k) => _.includes(_.toLower(selectedStyle), _.toLower(k)))
    ) || CURATED_STYLE_PRESETS.stickman;
  }, [presetsList, selectedStyle]);

  const filteredPresets = useMemo(() => {
    if (activeCategory === "all") return presetsList;
    return presetsList.filter((p) => p.category === activeCategory);
  }, [presetsList, activeCategory]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Palette className={cn("w-3.5 h-3.5", isPurple ? "text-purple-400" : "text-blue-400")} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            {label}
          </span>
          <span className={cn(
            "text-[9px] px-1.5 py-0.2 rounded-md font-mono font-bold border",
            isPurple 
              ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
          )}>
            {presetsList.length} Styles
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsDetailOpen(!isDetailOpen)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
            isPurple
              ? "bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
              : "bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
          )}
          title={isVi ? "Xem chi tiết quy tắc phong cách" : "View style rules"}
        >
          <span className="text-sm">{currentPreset.icon}</span>
          <span className="font-bold truncate max-w-[130px] sm:max-w-none">
            {isVi ? currentPreset.nameVi : currentPreset.name}
          </span>
          {isDetailOpen ? (
            <ChevronUp className="w-3.5 h-3.5 opacity-70" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {STYLE_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono tracking-wider uppercase whitespace-nowrap transition-all duration-150 cursor-pointer border select-none",
                isActive
                  ? isPurple
                    ? "bg-purple-600 border-purple-500 text-white shadow-sm shadow-purple-950/50"
                    : "bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-950/50"
                  : "bg-slate-955 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              )}
            >
              {isVi ? cat.nameVi : cat.nameEn}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredPresets.map((preset) => {
          const isSelected = currentPreset.id === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectStyle(preset.id)}
              className={cn(
                "group relative flex items-center gap-2 p-2 rounded-xl border text-left transition-all duration-150 cursor-pointer select-none",
                isSelected
                  ? isPurple
                    ? "bg-purple-500/15 border-purple-500/80 ring-1 ring-purple-500/30 text-purple-200 shadow-sm shadow-purple-950/50"
                    : "bg-blue-500/15 border-blue-500/80 ring-1 ring-blue-500/30 text-blue-200 shadow-sm shadow-blue-950/50"
                  : "bg-slate-955 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60"
              )}
            >
              <span className="text-base shrink-0 group-hover:scale-110 transition-transform">{preset.icon}</span>
              <div className="min-w-0 flex-1">
                <span className={cn(
                  "text-[11px] font-semibold tracking-tight block truncate leading-tight",
                  isSelected 
                    ? isPurple ? "font-bold text-purple-200" : "font-bold text-blue-200"
                    : "text-slate-200 group-hover:text-white"
                )}>
                  {isVi ? preset.nameVi : preset.name}
                </span>
                <span className="text-[9px] text-slate-400 block truncate leading-tight mt-0.5">
                  {preset.description}
                </span>
              </div>
              {isSelected && (
                <div className={cn(
                  "w-3.5 h-3.5 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs",
                  isPurple ? "bg-purple-500" : "bg-blue-500"
                )}>
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {isDetailOpen && (
        <div className={cn(
          "border rounded-xl p-2.5 space-y-1 text-xs animate-in fade-in duration-200 bg-slate-955",
          isPurple ? "border-purple-500/30" : "border-blue-500/30"
        )}>
          <div className={cn(
            "flex items-center gap-1.5 font-bold font-mono text-[10px] uppercase tracking-wider",
            isPurple ? "text-purple-300" : "text-blue-300"
          )}>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Quy tắc phong cách: {isVi ? currentPreset.nameVi : currentPreset.name}</span>
          </div>
          <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans">
            <strong className={cn("font-semibold", isPurple ? "text-purple-300" : "text-blue-300")}>Đặc trưng:</strong> {currentPreset.positivePrompt}
          </p>
          <p className="text-[10.5px] text-rose-400/90 leading-relaxed font-sans">
            <strong className="font-semibold text-rose-400">Từ khóa bị chặn (Negative):</strong> {currentPreset.negativePrompt}
          </p>
        </div>
      )}
    </div>
  );
};
