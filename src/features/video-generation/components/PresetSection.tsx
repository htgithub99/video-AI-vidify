import { RUNTIME_TEXT as RT_VIDEO_GENERATION } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { StudioCard, StudioSelect, StudioInput } from "../../../components/ui/Studio.js";
import { SOURCE_TEXT_AMBER, SOURCE_TEXT_SYMBOL_16 } from "../../../constants/sourceText";
import { cn } from "../../../lib/utils";
import React from "react";
import _ from "lodash";
import { Bookmark, ChevronDown, Save, Trash } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { REFACTOR_CONSTANTS } from "../../../constants";
import { AUTO_VIDEO_UI_TEXTS } from "../../../constants/texts";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";
interface PresetItem {
  id: string;
  name: string;
  config?: Record<string, unknown>;
}
interface PresetSectionProps {
  presets: PresetItem[];
  selectedPresetId: string;
  handleApplyPreset: (id: string) => void;
  presetNameInputState: string;
  setPresetNameInputState: (val: string) => void;
  handleSavePreset: () => void;
  handleDeletePreset: (id: string) => void;
  T: ReturnType<typeof getAutoVideoTexts>;
  truncateWords: (str: string, maxWords: number) => string;
}
export const PresetSection: React.FC<PresetSectionProps> = ({ presets, selectedPresetId, handleApplyPreset, presetNameInputState, setPresetNameInputState, handleSavePreset, handleDeletePreset, T, truncateWords }) => {
  const uiTexts = AUTO_VIDEO_UI_TEXTS.vi;
  return (
    <StudioCard className={cn(RT_VIDEO_GENERATION.GLASS_CARD_BG_SLATE_900_60_ROUNDED_2XL_PX_4)}>
      <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_GAP_2_5_FLEX_1_MIN_W)}>
        <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_1_5_SHRINK_0)}>
          <span className={cn(RT_VIDEO_GENERATION.W_6_H_6_ROUNDED_LG_BG_PURPLE_500_15)}>
            <Bookmark className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_PURPLE_400)} />
          </span>
          <span className={cn(RT_VIDEO_GENERATION.TEXT_XS_FONT_BOLD_TEXT_SLATE_200_UPPERCASE_TRACKING_WIDER)}>{_.trimEnd(T.presetLabel || uiTexts.presetConfigDefault, SOURCE_TEXT_SYMBOL_16)}</span>
        </div>
        <div className={cn(RT_VIDEO_GENERATION.RELATIVE_FLEX_1_MIN_W_140PX_MAX_W_240PX_FLEX)}>
          <StudioSelect value={selectedPresetId} onChange={(e) => handleApplyPreset(e.target.value)} className={cn(RT_VIDEO_GENERATION.W_FULL_BG_TRANSPARENT_TEXT_XS_TEXT_SLATE_200_FOCUS)}>
            <option value={REFACTOR_CONSTANTS.VD_EMPTY_STRING} className={cn(RT_VIDEO_GENERATION.BG_SLATE_900_TEXT_SLATE_300)}>
              {T.presetDefaultOption || uiTexts.defaultPreset}
            </option>
            {_.map(presets, (p) => (
              <option key={p.id} value={p.id} className={cn(RT_VIDEO_GENERATION.BG_SLATE_900_TEXT_SLATE_200)} title={p.name}>
                {truncateWords(p.name, 5)}
              </option>
            ))}
          </StudioSelect>
          <ChevronDown className={cn(RT_VIDEO_GENERATION.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_2_5_TEXT_SLATE_400)} />
        </div>
        {!_.isEmpty(selectedPresetId) && (
          <Button type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON} variant={REFACTOR_CONSTANTS.VARIANT_GHOST} size={REFACTOR_CONSTANTS.SIZE_MD} onClick={() => handleDeletePreset(selectedPresetId)} title={T.deletePresetTooltip} className={cn(RT_VIDEO_GENERATION.BG_ROSE_500_10_HOVER_BG_ROSE_500_20_TEXT)}>
            <Trash className={cn(RT_SHARED.W_3_5_H_3_5)} />
          </Button>
        )}
      </div>
      <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_GAP_2_SHRINK_0)}>
        <StudioInput type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT} placeholder={T.presetNamePlaceholder} value={presetNameInputState} onChange={(e) => setPresetNameInputState(e.target.value)} className={cn(RT_VIDEO_GENERATION.W_36_SM_W_44_H_9_BG_SLATE_955)} />
        <Button type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON} variant={SOURCE_TEXT_AMBER} size={REFACTOR_CONSTANTS.SIZE_MD} onClick={handleSavePreset} title={T.savePresetTooltip} className={cn(RT_VIDEO_GENERATION.H_9_MIN_H_36PX_MAX_H_36PX_PX_3)}>
          <Save className={cn(RT_SHARED.W_3_5_H_3_5)} />
          <span className={cn(RT_SHARED.HIDDEN_SM_INLINE)}>{T.savePresetBtn}</span>
        </Button>
      </div>
    </StudioCard>
  );
};
