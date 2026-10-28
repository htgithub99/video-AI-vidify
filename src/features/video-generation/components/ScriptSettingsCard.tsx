import { RUNTIME_TEXT as RT_VIDEO_GENERATION } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { StudioCard, StudioSelect } from "../../../components/ui/Studio.js";
import { SOURCE_TEXT_VI } from "../../../constants/sourceText";
import React from "react";
import _ from "lodash";
import { Clock, Globe, Layers, Settings2, Sliders, ChevronDown } from "lucide-react";
import { cn } from "../../../lib/utils";
import { ProjectLanguage } from "../../../types";
import { DURATION_OPTIONS, GENRE_OPTION_GROUPS, PROJECT_LANGUAGE_OPTIONS, SPLIT_STRATEGY_OPTIONS, genreLabels } from "../../../constants";
import { SCRIPT_DURATION_LABELS, GENRE_GROUP_LABELS } from "../../../constants/texts";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";
import { Lang } from "../../../lib/lang";
interface ScriptSettingsCardProps {
  genre: string;
  setGenre: (val: string) => void;
  language: ProjectLanguage;
  setLanguage: (val: ProjectLanguage) => void;
  duration: string;
  setDuration: (val: string) => void;
  splitStrategy: string;
  setSplitStrategy: (val: string) => void;
  splitLabelMap: Record<string, string>;
  T: ReturnType<typeof getAutoVideoTexts>;
  lockedGenreLabel?: string;
  currentLang?: Lang;
}
export const ScriptSettingsCard: React.FC<ScriptSettingsCardProps> = ({ genre, setGenre, language, setLanguage, duration, setDuration, splitStrategy, setSplitStrategy, splitLabelMap, T, lockedGenreLabel, currentLang = SOURCE_TEXT_VI }) => {
  const safeLang = (currentLang as "vi" | "en") || SOURCE_TEXT_VI;
  const durationLabels = SCRIPT_DURATION_LABELS[safeLang] || SCRIPT_DURATION_LABELS.vi;
  const genreGroupLabels = GENRE_GROUP_LABELS[safeLang] || GENRE_GROUP_LABELS.vi;
  const selectFields = [
    {
      label: T.lblGenre,
      icon: <Layers className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_AMBER_400_MR)} />,
      value: genre,
      onChange: setGenre,
      optionGroups: _.map(GENRE_OPTION_GROUPS, (group, idx) => ({ label: idx === 0 ? genreGroupLabels.SATIRICAL : idx === 1 ? genreGroupLabels.STORY_EXPLAINER : idx === 2 ? genreGroupLabels.DOCUMENTARY_KNOWLEDGE : genreGroupLabels.YOUTUBE_TRENDING, options: group.options })),
    },
    { label: T.lblLanguage, icon: <Globe className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_SKY_400_MR)} />, value: language, onChange: (v: string) => setLanguage(v as ProjectLanguage), options: _.map(PROJECT_LANGUAGE_OPTIONS, (l) => ({ value: l.value, label: _.isEqual(l.value, ProjectLanguage.VI) ? T.langVi : T.langEn })) },
    { label: T.lblDuration, icon: <Clock className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_AMBER_400_MR)} />, value: duration, onChange: setDuration, options: _.map(DURATION_OPTIONS, (d) => ({ value: d.val, label: _.get(durationLabels, d.val, d.label) })) },
    { label: T.lblSplitStrategy, icon: <Sliders className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_EMERALD_400_MR)} />, value: splitStrategy, onChange: setSplitStrategy, options: _.map(SPLIT_STRATEGY_OPTIONS, (s) => ({ value: s.value, label: _.get(splitLabelMap, s.value, s.value) })) },
  ];
  return (
    <StudioCard className={cn(RT_VIDEO_GENERATION.GLASS_CARD_ROUNDED_3XL_P_4_SM_P_5_MD)}>
      <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_GAP_2_5_RELATIVE_Z_10_BORDER)}>
        <span className={cn(RT_VIDEO_GENERATION.W_6_H_6_ROUNDED_XL_BG_AMBER_500_15_08CB6F)}>
          <Settings2 className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_AMBER_400)} />
        </span>
        <h3 className={cn(RT_VIDEO_GENERATION.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)}>{T.scriptSettingsTitle}</h3>
      </div>
      <div className={cn(RT_VIDEO_GENERATION.GRID_GRID_COLS_1_SM_GRID_COLS_2_GAP_3)}>
        {_.map(selectFields, ({ label, icon, value, onChange, options, optionGroups }, fieldIndex) => (
          <div key={label} className={cn(RT_SHARED.SPACE_Y_1_5_MIN_W_0)}>
            <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE_0AAFBB)}>{label}</span>
            <div className={cn(RT_VIDEO_GENERATION.RELATIVE_FLEX_ITEMS_CENTER_BG_SLATE_955_80_BORDER_BORDER)}>
              {icon}
              {fieldIndex === 0 && lockedGenreLabel ? (
                <span className={cn(RT_VIDEO_GENERATION.FLEX_1_TEXT_AMBER_400_TEXT_XS_FONT_SEMIBOLD_TRUNCATE)}>{lockedGenreLabel}</span>
              ) : (
                <StudioSelect value={value} onChange={(e) => onChange(e.target.value)} className={cn(RT_VIDEO_GENERATION.FLEX_1_BG_TRANSPARENT_TEXT_SLATE_200_TEXT_XS_FONT_640CAE)}>
                  {optionGroups
                    ? _.map(optionGroups, (group) => (
                        <optgroup key={group.label} label={group.label} className={cn(RT_VIDEO_GENERATION.BG_SLATE_950_TEXT_SLATE_400)}>
                          {_.map(group.options, (option) => (
                            <option key={option} value={option} className={cn(RT_VIDEO_GENERATION.BG_SLATE_950_TEXT_SLATE_300)}>
                              {genreLabels[option as keyof typeof genreLabels] || option}
                            </option>
                          ))}
                        </optgroup>
                      ))
                    : _.map(options, (o) => (
                        <option key={o.value} value={o.value} className={cn(RT_VIDEO_GENERATION.BG_SLATE_950_TEXT_SLATE_300)}>
                          {o.label}
                        </option>
                      ))}
                </StudioSelect>
              )}
              {!(fieldIndex === 0 && lockedGenreLabel) && <ChevronDown className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_SLATE_500_ABSOLUTE)} />}
            </div>
          </div>
        ))}
      </div>
    </StudioCard>
  );
};
