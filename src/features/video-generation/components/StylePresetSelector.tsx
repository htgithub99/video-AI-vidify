import { RUNTIME_TEXT as RT_VIDEO_GENERATION } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { SOURCE_TEMPLATE_SYMBOL_20, SOURCE_TEXT_ALL, SOURCE_TEXT_BLUE, SOURCE_TEXT_BUTTON, SOURCE_TEXT_DESC, SOURCE_TEXT_PURPLE, SOURCE_TEXT_UNSTYLED, SOURCE_TEXT_VI } from "../../../constants/sourceText";
import React, { useState, useMemo } from "react";
import _ from "lodash";
import { Palette, Check, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { CURATED_STYLE_PRESETS, STYLE_CATEGORIES, StyleCategory, getRecommendedStylePresetIds, resolveStylePreset } from "../../../constants/stylePresets";
import { AUTO_VIDEO_UI_TEXTS } from "../../../constants/texts";
import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/Button";
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
    <div className={cn(RT_VIDEO_GENERATION.SPACE_Y_3_TEXT_LEFT_W_FULL)}>
      <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2)}>
        <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_MIN_W_0)}>
          <Palette className={cn(RT_SHARED.W_4_H_4_SHRINK_0, { "text-purple-400": isPurple, "text-blue-400": !isPurple })} />
          <span className={cn(RT_VIDEO_GENERATION.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)} title={displayLabel}>
            {displayLabel}
          </span>
        </div>
        <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => setIsOpen(!isOpen)} className={cn(RT_VIDEO_GENERATION.HEADER_ACTION_BTN_FLEX_ITEMS_CENTER_GAP_2_PX_3, { "bg-purple-950/80 text-purple-300 hover:bg-purple-900/80": isPurple, "bg-blue-950/80 text-blue-300 hover:bg-blue-900/80": !isPurple })} title={isVi ? currentPreset.nameVi : currentPreset.name}>
          <span className={cn(RT_VIDEO_GENERATION.TEXT_SM_SHRINK_0)}>{currentPreset.icon}</span>
          <span className={cn(RT_SHARED.TRUNCATE)}>{isVi ? currentPreset.nameVi : currentPreset.name}</span>
          {isOpen ? <ChevronUp className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_SHRINK_0_TEXT_AMBER)} /> : <ChevronDown className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_SHRINK_0_ML_1)} />}
        </Button>
      </div>
      {isOpen && (
        <div className={cn(RT_VIDEO_GENERATION.SPACE_Y_3_PT_1_ANIMATE_FADEIN)}>
          <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_GAP_1_5_OVERFLOW_X_AUTO_PB)}>
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
                    className={cn(RT_VIDEO_GENERATION.PX_3_PY_1_5_ROUNDED_XL_TEXT_11PX_FONT, { "bg-purple-600 text-white shadow-xs": isActive && isPurple, "bg-blue-600 text-white shadow-xs": isActive && !isPurple, "bg-slate-955 text-slate-400 hover:bg-slate-850 hover:text-slate-100": !isActive })}>
                    {catName}
                  </Button>
                );
              },
            )}
          </div>
          <div className={cn(RT_VIDEO_GENERATION.GRID_GRID_COLS_1_SM_GRID_COLS_2_2XL_GRID)}>
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
                  className={cn(RT_VIDEO_GENERATION.RELATIVE_FLEX_ITEMS_CENTER_GAP_2_5_P_2_5, { "bg-purple-950/90 shadow-md ring-1 ring-purple-500/40": isSelected && isPurple, "bg-blue-950/90 shadow-md ring-1 ring-blue-500/40": isSelected && !isPurple, "bg-slate-900/90 hover:bg-purple-950/50": !isSelected && isPurple, "bg-slate-900/90 hover:bg-blue-950/50": !isSelected && !isPurple })}>
                  <div className={cn(RT_VIDEO_GENERATION.P_1_5_SM_P_2_ROUNDED_XL_TEXT_BASE, { "bg-purple-900 text-purple-200": isPurple && isSelected, "bg-purple-950/80 text-purple-400": isPurple && !isSelected, "bg-blue-900 text-blue-200": !isPurple && isSelected, "bg-blue-950/80 text-blue-400": !isPurple && !isSelected })}>{preset.icon}</div>
                  <div className={cn(RT_VIDEO_GENERATION.MIN_W_0_FLEX_1_FLEX_FLEX_COL_JUSTIFY_CENTER)}>
                    <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_GAP_1_5_MIN_W_0)}>
                      <span className={cn(RT_VIDEO_GENERATION.TEXT_XS_BLOCK_LEADING_TIGHT_TRUNCATE_FONT_BOLD, { "text-purple-300 font-extrabold": isSelected && isPurple, "text-blue-300 font-extrabold": isSelected && !isPurple, "text-slate-100": !isSelected })} title={name}>
                        {name}
                      </span>
                      {recommendedIds.has(preset.id) && (
                        <span className={cn(RT_VIDEO_GENERATION.TEXT_8PX_UPPERCASE_TRACKING_WIDER_TEXT_AMBER_400_FONT_BOLD)} title={uiTexts.recommendedBadge}>
                          {uiTexts.recommendedBadge}
                        </span>
                      )}
                    </div>
                    <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_BLOCK_TRUNCATE_LEADING_TIGHT_MT_0_5_FONT, { "text-purple-400": isSelected && isPurple, "text-blue-400": isSelected && !isPurple, "text-slate-400": !isSelected })} title={tagline}>
                      {tagline}
                    </span>
                  </div>
                  {isSelected ? (
                    <div className={cn(RT_VIDEO_GENERATION.W_4_H_4_ROUNDED_FULL_TEXT_WHITE_FLEX_ITEMS, { "bg-purple-600": isPurple, "bg-blue-600": !isPurple })}>
                      <Check className={cn(RT_VIDEO_GENERATION.W_2_5_H_2_5_STROKE_3_5)} />
                    </div>
                  ) : (
                    <div className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_ROUNDED_FULL_BG_SLATE)} />
                  )}
                </Button>
              );
            })}
          </div>
          <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_PT_1)}>
            <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => setIsDetailOpen(!isDetailOpen)} className={cn(RT_VIDEO_GENERATION.TEXT_11PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_HOVER)}>
              <Sparkles className={cn(RT_SHARED.W_3_H_3_TEXT_AMBER_400)} />
              <span>{isDetailOpen ? uiTexts.hideRulesTooltip : uiTexts.toggleRulesTooltip}</span>
            </Button>
            <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => setIsOpen(false)} className={cn(RT_VIDEO_GENERATION.TEXT_11PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_HOVER)}>
              <span>{uiTexts.collapseLabel}</span>
              <ChevronUp className={cn(RT_VIDEO_GENERATION.W_3_H_3_TEXT_SLATE_400)} />
            </Button>
          </div>
          {isDetailOpen && (
            <div className={cn(RT_VIDEO_GENERATION.ROUNDED_2XL_P_3_SPACE_Y_1_5_TEXT_XS, { "bg-purple-950 text-slate-100": isPurple, "bg-blue-950 text-slate-100": !isPurple })}>
              <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_GAP_1_5_FONT_BOLD_FONT_MONO, { "text-purple-400": isPurple, "text-blue-400": !isPurple })} title={`${uiTexts.styleRulesPrefix}${isVi ? currentPreset.nameVi : currentPreset.name}`}>
                <Sparkles className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_AMBER_400_SHRINK)} />
                <span className={cn(RT_SHARED.TRUNCATE)}>
                  {uiTexts.styleRulesPrefix}
                  {isVi ? currentPreset.nameVi : currentPreset.name}
                </span>
              </div>
              <p className={cn(RT_VIDEO_GENERATION.TEXT_10_5PX_TEXT_SLATE_100_LEADING_RELAXED_FONT_SANS)} title={currentPreset.positivePrompt}>
                <strong className={cn(RT_VIDEO_GENERATION.FONT_SEMIBOLD, { "text-purple-400": isPurple, "text-blue-400": !isPurple })}>{uiTexts.coreFeatureLabel}</strong> {currentPreset.positivePrompt}
              </p>
              <p className={cn(RT_VIDEO_GENERATION.TEXT_10_5PX_TEXT_ROSE_400_LEADING_RELAXED_FONT_SANS)} title={currentPreset.negativePrompt}>
                <strong className={cn(RT_VIDEO_GENERATION.FONT_SEMIBOLD_TEXT_ROSE_400)}>{uiTexts.negativePromptLabel}</strong> {currentPreset.negativePrompt}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
