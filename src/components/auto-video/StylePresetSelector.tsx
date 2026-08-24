import React, { useState, useMemo } from "react";
import _ from "lodash";
import { Palette, Check, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { CURATED_STYLE_PRESETS, STYLE_CATEGORIES, StyleCategory, getRecommendedStylePresetIds, resolveStylePreset } from "../../constants/stylePresets";
import { cn } from "../../lib/utils";

interface StylePresetSelectorProps {
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;
  language?: string;
  label?: string;
  accentColor?: "blue" | "purple";
  genre?: string;
}

export const StylePresetSelector: React.FC<StylePresetSelectorProps> = ({
  selectedStyle,
  onSelectStyle,
  language = "vi",
  label = "Phong cách hình ảnh",
  accentColor = "blue",
  genre,
}) => {
  const isVi = _.isEqual(language, "vi");
  const isPurple = _.isEqual(accentColor, "purple");
  const [activeCategory, setActiveCategory] = useState<StyleCategory>("all");
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const presetsList = useMemo(() => _.values(CURATED_STYLE_PRESETS), []);
  const recommendedIds = useMemo(() => new Set(getRecommendedStylePresetIds(genre)), [genre]);

  const currentPreset = useMemo(() => {
    return resolveStylePreset(selectedStyle);
  }, [selectedStyle]);

  const filteredPresets = useMemo(() => {
    const categoryPresets = _.isEqual(activeCategory, "all") ? presetsList : _.filter(presetsList, (p) => _.isEqual(p.category, activeCategory));
    return _.orderBy(categoryPresets, preset => recommendedIds.has(preset.id), "desc");
  }, [presetsList, activeCategory, recommendedIds]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className={cn("w-4 h-4", isPurple ? "text-purple-400" : "text-blue-400")} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold font-mono",
            isPurple
              ? "bg-purple-950 border-purple-800 text-purple-300"
              : "bg-blue-950 border-blue-800 text-blue-300"
          )}>
            <span className="text-sm">{currentPreset.icon}</span>
            <span>{isVi ? currentPreset.nameVi : currentPreset.name}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsDetailOpen(!isDetailOpen)}
            className="p-1 rounded-lg border border-slate-800 bg-slate-950 text-slate-700 hover:text-slate-100 hover:bg-slate-850 cursor-pointer transition-colors"
            title={isVi ? "Xem chi tiết quy tắc prompt" : "Toggle style prompt rules"}
          >
            {isDetailOpen ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {_.map(STYLE_CATEGORIES, (cat) => {
          const isActive = _.isEqual(activeCategory, cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono tracking-wider uppercase whitespace-nowrap cursor-pointer select-none transition-colors border",
                isActive
                  ? isPurple
                    ? "bg-purple-600 border-purple-600 text-white shadow-xs"
                    : "bg-blue-600 border-blue-600 text-white shadow-xs"
                  : "bg-slate-950 text-slate-700 border-slate-800 hover:bg-slate-850 hover:text-slate-100"
              )}
            >
              {isVi ? cat.nameVi : cat.nameEn}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {_.map(filteredPresets, (preset) => {
          const isSelected = _.isEqual(currentPreset.id, preset.id);

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectStyle(preset.id)}
              className={cn(
                "relative flex items-center gap-2.5 p-2.5 rounded-2xl border-2 text-left cursor-pointer select-none transition-colors min-h-[66px]",
                isSelected
                  ? isPurple
                    ? "bg-purple-950 border-purple-600 shadow-sm"
                    : "bg-blue-950 border-blue-600 shadow-sm"
                  : isPurple
                    ? "bg-slate-900 border-slate-800 hover:border-purple-800 hover:bg-purple-950/40"
                    : "bg-slate-900 border-slate-800 hover:border-blue-800 hover:bg-blue-950/40"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl text-lg flex items-center justify-center shrink-0 border",
                isPurple
                  ? isSelected
                    ? "bg-purple-900 border-purple-800 text-purple-400"
                    : "bg-purple-950 border-purple-800 text-purple-500"
                  : isSelected
                    ? "bg-blue-900 border-blue-800 text-blue-400"
                    : "bg-blue-950 border-blue-800 text-blue-500"
              )}>
                {preset.icon}
              </div>

              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <span className={cn(
                  "text-xs block leading-tight line-clamp-2 break-words",
                  isSelected
                    ? isPurple
                      ? "text-purple-300 font-black tracking-tight"
                      : "text-blue-300 font-black tracking-tight"
                    : "text-slate-100 font-bold"
                )} title={isVi ? preset.nameVi : preset.name}>
                  {isVi ? preset.nameVi : preset.name}
                </span>
                <span className={cn(
                  "text-[10px] block truncate leading-tight mt-0.5",
                  isSelected
                    ? isPurple
                      ? "text-purple-400 font-bold"
                      : "text-blue-400 font-bold"
                    : "text-slate-700 font-medium"
                )}>
                  {preset.tagline || preset.description}
                </span>
              </div>

              {isSelected ? (
                <div className={cn(
                  "w-4 h-4 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs ml-1",
                  isPurple ? "bg-purple-600" : "bg-blue-600"
                )}>
                  <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                </div>
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-slate-800 shrink-0 ml-1" />
              )}
              {recommendedIds.has(preset.id) && (
                <span className="absolute right-2 top-1 text-[8px] uppercase tracking-wide text-amber-400 font-bold">
                  {isVi ? "Gợi ý" : "Recommended"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isDetailOpen && (
        <div className={cn(
          "border rounded-2xl p-3 space-y-1.5 text-xs shadow-xs",
          isPurple 
            ? "bg-purple-950 border-purple-800 text-slate-100" 
            : "bg-blue-950 border-blue-800 text-slate-100"
        )}>
          <div className={cn(
            "flex items-center gap-1.5 font-bold font-mono text-[10px] uppercase tracking-wider",
            isPurple ? "text-purple-400" : "text-blue-400"
          )}>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Quy tắc phong cách: {isVi ? currentPreset.nameVi : currentPreset.name}</span>
          </div>
          <p className="text-[10.5px] text-slate-100 leading-relaxed font-sans">
            <strong className={cn("font-semibold", isPurple ? "text-purple-400" : "text-blue-400")}>Đặc trưng cốt lõi:</strong> {currentPreset.positivePrompt}
          </p>
          <p className="text-[10.5px] text-rose-700 leading-relaxed font-sans">
            <strong className="font-semibold text-rose-700">Từ khóa bị chặn (Negative):</strong> {currentPreset.negativePrompt}
          </p>
        </div>
      )}
    </div>
  );
};
