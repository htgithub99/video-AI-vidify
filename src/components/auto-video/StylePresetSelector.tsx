import { SOURCE_TEMPLATE_SYMBOL_20, SOURCE_TEXT_ALL, SOURCE_TEXT_BLUE, SOURCE_TEXT_BUTTON, SOURCE_TEXT_DESC, SOURCE_TEXT_PURPLE, SOURCE_TEXT_UNSTYLED, SOURCE_TEXT_VI } from "../../constants/sourceText";
import React, { useState, useMemo } from "react";
import _ from "lodash";
import { Palette, Check, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { CURATED_STYLE_PRESETS, STYLE_CATEGORIES, StyleCategory, getRecommendedStylePresetIds, resolveStylePreset } from "../../constants/stylePresets";
import { AUTO_VIDEO_UI_TEXTS } from "../../constants/texts";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
interface StylePresetSelectorProps {
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;
  language?: string;
  label?: string;
  accentColor?: "blue" | "purple";
  genre?: string;
  allowedPresetIds?: readonly string[];
}
export const StylePresetSelector: React.FC<StylePresetSelectorProps> = ({ selectedStyle, onSelectStyle, language = SOURCE_TEXT_VI, label, accentColor = SOURCE_TEXT_BLUE, genre, allowedPresetIds }) => {
  const isVi = _.isEqual(language, SOURCE_TEXT_VI);
  const isPurple = _.isEqual(accentColor, SOURCE_TEXT_PURPLE);
  const uiTexts = _.get(AUTO_VIDEO_UI_TEXTS, language, AUTO_VIDEO_UI_TEXTS.vi);
  const displayLabel = label || uiTexts.stylePresetDefaultLabel;
  const [activeCategory, setActiveCategory] = useState<StyleCategory>(SOURCE_TEXT_ALL);
  const [isOpen, setIsOpen] = useState(false);
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
    const categoryPresets = _.isEqual(activeCategory, SOURCE_TEXT_ALL) ? presetsList : _.filter(presetsList, (p) => _.isEqual(p.category, activeCategory));
    return _.orderBy(categoryPresets, (preset) => recommendedIds.has(preset.id), SOURCE_TEXT_DESC);
  }, [presetsList, activeCategory, recommendedIds]);
  return (
    <div className={cn("space-y-3 text-left w-full")}>
      <div className={cn("flex items-center justify-between gap-2")}>
        <div className={cn("flex items-center gap-2 min-w-0")}>
          <Palette className={cn("w-4 h-4 shrink-0", { "text-purple-400": isPurple, "text-blue-400": !isPurple })} />
          <span className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono truncate")} title={displayLabel}>
            {displayLabel}
          </span>
        </div>
        <Button
          variant={SOURCE_TEXT_UNSTYLED}
          type={SOURCE_TEXT_BUTTON}
          onClick={() => setIsOpen(!isOpen)}
          className={cn("header-action-btn flex items-center gap-2 px-3 py-1.5 rounded-xl border-none text-xs font-bold font-mono cursor-pointer select-none transition-colors max-w-[260px] shadow-sm", { "bg-purple-950/80 text-purple-300 hover:bg-purple-900/80": isPurple, "bg-blue-950/80 text-blue-300 hover:bg-blue-900/80": !isPurple })}
          title={isVi ? currentPreset.nameVi : currentPreset.name}>
          <span className={cn("text-sm shrink-0")}>{currentPreset.icon}</span>
          <span className={cn("truncate")}>{isVi ? currentPreset.nameVi : currentPreset.name}</span>
          {isOpen ? <ChevronUp className={cn("w-3.5 h-3.5 shrink-0 text-amber-400 ml-1")} /> : <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 ml-1 text-slate-400")} />}
        </Button>
      </div>
      {isOpen && (
        <div className={cn("space-y-3 pt-1 animate-fadeIn")}>
          <div className={cn("flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none")}>
            {_.map(
              _.filter(STYLE_CATEGORIES, (cat) => _.isEqual(cat.id, SOURCE_TEXT_ALL) || _.some(presetsList, { category: cat.id })),
              (cat) => {
                const isActive = _.isEqual(activeCategory, cat.id);
                const catName = isVi ? cat.nameVi : cat.nameEn;
                return (
                  <Button
                    variant={SOURCE_TEXT_UNSTYLED}
                    key={cat.id}
                    type={SOURCE_TEXT_BUTTON}
                    onClick={() => setActiveCategory(cat.id)}
                    title={catName}
                    className={cn("px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono tracking-wider uppercase whitespace-nowrap cursor-pointer select-none transition-colors border-none truncate", {
                      "bg-purple-600 text-white shadow-xs": isActive && isPurple,
                      "bg-blue-600 text-white shadow-xs": isActive && !isPurple,
                      "bg-slate-955 text-slate-400 hover:bg-slate-850 hover:text-slate-100": !isActive,
                    })}>
                    {catName}
                  </Button>
                );
              },
            )}
          </div>
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2.5 sm:gap-3")}>
            {_.map(filteredPresets, (preset) => {
              const isSelected = _.isEqual(currentPreset.id, preset.id);
              const name = isVi ? preset.nameVi : preset.name;
              const tagline = preset.tagline || preset.description;
              return (
                <Button
                  variant={SOURCE_TEXT_UNSTYLED}
                  key={preset.id}
                  type={SOURCE_TEXT_BUTTON}
                  onClick={() => onSelectStyle(preset.id)}
                  title={SOURCE_TEMPLATE_SYMBOL_20(`${name}`, `${tagline}`)}
                  className={cn("relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border-none text-left cursor-pointer select-none transition-all min-h-[60px] overflow-hidden group shadow-sm", {
                    "bg-purple-950/90 shadow-md ring-1 ring-purple-500/40": isSelected && isPurple,
                    "bg-blue-950/90 shadow-md ring-1 ring-blue-500/40": isSelected && !isPurple,
                    "bg-slate-900/90 hover:bg-purple-950/50": !isSelected && isPurple,
                    "bg-slate-900/90 hover:bg-blue-950/50": !isSelected && !isPurple,
                  })}>
                  <div className={cn("p-1.5 sm:p-2 rounded-xl text-base sm:text-lg flex items-center justify-center shrink-0 border-none", { "bg-purple-900 text-purple-200": isPurple && isSelected, "bg-purple-950/80 text-purple-400": isPurple && !isSelected, "bg-blue-900 text-blue-200": !isPurple && isSelected, "bg-blue-950/80 text-blue-400": !isPurple && !isSelected })}>{preset.icon}</div>
                  <div className={cn("min-w-0 flex-1 flex flex-col justify-center overflow-hidden pr-1")}>
                    <div className={cn("flex items-center gap-1.5 min-w-0")}>
                      <span
                        className={cn("text-xs block leading-tight truncate font-bold", {
                          "text-purple-300 font-extrabold": isSelected && isPurple,
                          "text-blue-300 font-extrabold": isSelected && !isPurple,
                          "text-slate-100": !isSelected,
                        })}
                        title={name}>
                        {name}
                      </span>
                      {recommendedIds.has(preset.id) && (
                        <span className={cn("text-[8px] uppercase tracking-wider text-amber-400 font-bold bg-amber-500/15 px-1 py-0.2 rounded font-mono shrink-0")} title={uiTexts.recommendedBadge}>
                          {uiTexts.recommendedBadge}
                        </span>
                      )}
                    </div>
                    <span
                      className={cn("text-[10px] block truncate leading-tight mt-0.5 font-medium", {
                        "text-purple-400": isSelected && isPurple,
                        "text-blue-400": isSelected && !isPurple,
                        "text-slate-400": !isSelected,
                      })}
                      title={tagline}>
                      {tagline}
                    </span>
                  </div>
                  {isSelected ? (
                    <div className={cn("w-4 h-4 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs ml-auto", { "bg-purple-600": isPurple, "bg-blue-600": !isPurple })}>
                      <Check className={cn("w-2.5 h-2.5 stroke-[3.5]")} />
                    </div>
                  ) : (
                    <div className={cn("w-3.5 h-3.5 rounded-full bg-slate-800 shrink-0 ml-auto group-hover:bg-slate-700")} />
                  )}
                </Button>
              );
            })}
          </div>
          <div className={cn("flex items-center justify-between pt-1")}>
            <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => setIsDetailOpen(!isDetailOpen)} className={cn("text-[11px] font-mono font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer bg-transparent border-none p-0")}>
              <Sparkles className={cn("w-3 h-3 text-amber-400")} />
              <span>{isDetailOpen ? uiTexts.hideRulesTooltip : uiTexts.toggleRulesTooltip}</span>
            </Button>
            <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => setIsOpen(false)} className={cn("text-[11px] font-mono font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer bg-transparent border-none p-0")}>
              <span>{uiTexts.collapseLabel}</span>
              <ChevronUp className={cn("w-3 h-3 text-slate-400")} />
            </Button>
          </div>
          {isDetailOpen && (
            <div className={cn("rounded-2xl p-3 space-y-1.5 text-xs shadow-inner", { "bg-purple-950 text-slate-100": isPurple, "bg-blue-950 text-slate-100": !isPurple })}>
              <div className={cn("flex items-center gap-1.5 font-bold font-mono text-[10px] uppercase tracking-wider truncate", { "text-purple-400": isPurple, "text-blue-400": !isPurple })} title={`${uiTexts.styleRulesPrefix}${isVi ? currentPreset.nameVi : currentPreset.name}`}>
                <Sparkles className={cn("w-3.5 h-3.5 text-amber-400 shrink-0")} />
                <span className={cn("truncate")}>
                  {uiTexts.styleRulesPrefix}
                  {isVi ? currentPreset.nameVi : currentPreset.name}
                </span>
              </div>
              <p className={cn("text-[10.5px] text-slate-100 leading-relaxed font-sans truncate")} title={currentPreset.positivePrompt}>
                <strong className={cn("font-semibold", { "text-purple-400": isPurple, "text-blue-400": !isPurple })}>{uiTexts.coreFeatureLabel}</strong> {currentPreset.positivePrompt}
              </p>
              <p className={cn("text-[10.5px] text-rose-400 leading-relaxed font-sans truncate")} title={currentPreset.negativePrompt}>
                <strong className={cn("font-semibold text-rose-400")}>{uiTexts.negativePromptLabel}</strong> {currentPreset.negativePrompt}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
