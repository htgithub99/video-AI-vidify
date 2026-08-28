import React, { useState, useMemo } from "react";
import _ from "lodash";
import { Palette, Check, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { CURATED_STYLE_PRESETS, STYLE_CATEGORIES, StyleCategory, getRecommendedStylePresetIds, resolveStylePreset } from "../../constants/stylePresets";
import { AUTO_VIDEO_UI_TEXTS } from "../../constants/texts";
import { cn } from "../../lib/utils";

interface StylePresetSelectorProps { selectedStyle: string; onSelectStyle: (styleId: string) => void; language?: string; label?: string; accentColor?: "blue" | "purple"; genre?: string; allowedPresetIds?: readonly string[]; }

export const StylePresetSelector: React.FC<StylePresetSelectorProps> = ({ selectedStyle, onSelectStyle, language = "vi", label, accentColor = "blue", genre, allowedPresetIds }) => {
  const isVi = _.isEqual(language, "vi");
  const isPurple = _.isEqual(accentColor, "purple");
  const uiTexts = _.get(AUTO_VIDEO_UI_TEXTS, language, AUTO_VIDEO_UI_TEXTS.vi);
  const displayLabel = label || uiTexts.stylePresetDefaultLabel;

  const [activeCategory, setActiveCategory] = useState<StyleCategory>("all");
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const presetsList = useMemo(() => {
    const allPresets = _.values(CURATED_STYLE_PRESETS);
    if (_.isEmpty(allowedPresetIds)) return allPresets;
    const allowed = new Set(allowedPresetIds);
    return _.filter(allPresets, (preset) => allowed.has(preset.id));
  }, [allowedPresetIds]);

  const recommendedIds = useMemo(() => new Set(getRecommendedStylePresetIds(genre)), [genre]);

  const currentPreset = useMemo(() => resolveStylePreset(selectedStyle), [selectedStyle]);

  const filteredPresets = useMemo(() => {
    const categoryPresets = _.isEqual(activeCategory, "all") ? presetsList : _.filter(presetsList, (p) => _.isEqual(p.category, activeCategory));
    return _.orderBy(categoryPresets, (preset) => recommendedIds.has(preset.id), "desc");
  }, [presetsList, activeCategory, recommendedIds]);

  return (
    <div className={cn("space-y-3 text-left")}>
      <div className={cn("flex items-center justify-between gap-2")}>
        <div className={cn("flex items-center gap-2 min-w-0")}>
          <Palette className={cn("w-4 h-4 shrink-0", isPurple ? "text-purple-400" : "text-blue-400")} />
          <span className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono truncate")} title={displayLabel}>{displayLabel}</span>
        </div>

        <div className={cn("flex items-center gap-2 shrink-0")}>
          <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold font-mono max-w-[200px]", isPurple ? "bg-purple-950 border-purple-800 text-purple-300" : "bg-blue-950 border-blue-800 text-blue-300")} title={isVi ? currentPreset.nameVi : currentPreset.name}>
            <span className={cn("text-sm shrink-0")}>{currentPreset.icon}</span>
            <span className={cn("truncate")}>{isVi ? currentPreset.nameVi : currentPreset.name}</span>
          </div>

          <button type="button" onClick={() => setIsDetailOpen(!isDetailOpen)} className={cn("p-1 rounded-lg border border-slate-800 bg-slate-955 text-slate-400 hover:text-slate-100 hover:bg-slate-850 cursor-pointer transition-colors")} title={uiTexts.toggleRulesTooltip}>
            {isDetailOpen ? <ChevronUp className={cn("w-3.5 h-3.5 text-amber-400")} /> : <ChevronDown className={cn("w-3.5 h-3.5")} />}
          </button>
        </div>
      </div>

      <div className={cn("flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none")}>
        {_.map(
          _.filter(STYLE_CATEGORIES, (cat) => _.isEqual(cat.id, "all") || _.some(presetsList, { category: cat.id })),
          (cat) => {
            const isActive = _.isEqual(activeCategory, cat.id);
            const catName = isVi ? cat.nameVi : cat.nameEn;
            return (
              <button key={cat.id} type="button" onClick={() => setActiveCategory(cat.id)} title={catName} className={cn("px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono tracking-wider uppercase whitespace-nowrap cursor-pointer select-none transition-colors border truncate", isActive ? (isPurple ? "bg-purple-600 border-purple-600 text-white shadow-xs" : "bg-blue-600 border-blue-600 text-white shadow-xs") : "bg-slate-955 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-100")}>
                {catName}
              </button>
            );
          },
        )}
      </div>

      <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-2.5")}>
        {_.map(filteredPresets, (preset) => {
          const isSelected = _.isEqual(currentPreset.id, preset.id);
          const name = isVi ? preset.nameVi : preset.name;
          const tagline = preset.tagline || preset.description;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectStyle(preset.id)}
              title={`${name} - ${tagline}`}
              className={cn("relative flex items-center gap-2.5 p-2.5 rounded-2xl border-2 text-left cursor-pointer select-none transition-all min-h-[66px] overflow-hidden group", isSelected ? (isPurple ? "bg-purple-950/80 border-purple-500 shadow-md ring-1 ring-purple-500/30" : "bg-blue-950/80 border-blue-500 shadow-md ring-1 ring-blue-500/30") : isPurple ? "bg-slate-900/90 border-slate-800 hover:border-purple-800 hover:bg-purple-950/40" : "bg-slate-900/90 border-slate-800 hover:border-blue-800 hover:bg-blue-950/40")}>
              <div className={cn("p-2 rounded-xl text-lg flex items-center justify-center shrink-0 border", isPurple ? (isSelected ? "bg-purple-900 border-purple-700 text-purple-300" : "bg-purple-950/80 border-purple-800/80 text-purple-400") : isSelected ? "bg-blue-900 border-blue-700 text-blue-300" : "bg-blue-950/80 border-blue-800/80 text-blue-400")}>{preset.icon}</div>

              <div className={cn("min-w-0 flex-1 flex flex-col justify-center overflow-hidden")}>
                <span className={cn("text-xs block leading-tight truncate whitespace-nowrap font-bold", isSelected ? (isPurple ? "text-purple-300 font-extrabold" : "text-blue-300 font-extrabold") : "text-slate-100")} title={name}>
                  {name}
                </span>
                <span className={cn("text-[10px] block truncate whitespace-nowrap leading-tight mt-0.5 font-medium", isSelected ? (isPurple ? "text-purple-400" : "text-blue-400") : "text-slate-400")} title={tagline}>
                  {tagline}
                </span>
              </div>

              {isSelected ? (
                <div className={cn("w-4 h-4 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs ml-1", isPurple ? "bg-purple-600" : "bg-blue-600")}>
                  <Check className={cn("w-2.5 h-2.5 stroke-[3.5]")} />
                </div>
              ) : (
                <div className={cn("w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0 ml-1 group-hover:border-slate-500")} />
              )}
              {recommendedIds.has(preset.id) && (
                <span className={cn("absolute right-2 top-1 text-[8px] uppercase tracking-wide text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-1 py-0.2 rounded font-mono")} title={uiTexts.recommendedBadge}>
                  {uiTexts.recommendedBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isDetailOpen && (
        <div className={cn("border rounded-2xl p-3 space-y-1.5 text-xs shadow-xs", isPurple ? "bg-purple-950 border-purple-800 text-slate-100" : "bg-blue-950 border-blue-800 text-slate-100")}>
          <div className={cn("flex items-center gap-1.5 font-bold font-mono text-[10px] uppercase tracking-wider truncate", isPurple ? "text-purple-400" : "text-blue-400")} title={`${uiTexts.styleRulesPrefix}${isVi ? currentPreset.nameVi : currentPreset.name}`}>
            <Sparkles className={cn("w-3.5 h-3.5 text-amber-400 shrink-0")} />
            <span className={cn("truncate")}>
              {uiTexts.styleRulesPrefix}
              {isVi ? currentPreset.nameVi : currentPreset.name}
            </span>
          </div>
          <p className={cn("text-[10.5px] text-slate-100 leading-relaxed font-sans truncate")} title={currentPreset.positivePrompt}>
            <strong className={cn("font-semibold", isPurple ? "text-purple-400" : "text-blue-400")}>{uiTexts.coreFeatureLabel}</strong> {currentPreset.positivePrompt}
          </p>
          <p className={cn("text-[10.5px] text-rose-400 leading-relaxed font-sans truncate")} title={currentPreset.negativePrompt}>
            <strong className={cn("font-semibold text-rose-400")}>{uiTexts.negativePromptLabel}</strong> {currentPreset.negativePrompt}
          </p>
        </div>
      )}
    </div>
  );
};
