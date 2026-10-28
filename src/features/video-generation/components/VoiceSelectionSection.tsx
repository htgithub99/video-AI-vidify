import { RUNTIME_TEXT as RT_VIDEO_GENERATION } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { SOURCE_TEXT_EN, SOURCE_TEXT_TOP, SOURCE_TEXT_VI } from "../../../constants/sourceText";
import { cn } from "../../../lib/utils";
import React from "react";
import _ from "lodash";
import { ChevronDown, Mic, Volume2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Tooltip } from "../../../components/ui/Tooltip";
import { VoiceSelectionDialog, type Voice as CatalogVoice } from "../../../components/VoiceSelectionDialog";
import { REFACTOR_CONSTANTS } from "../../../constants";
import { Lang } from "../../../lib/lang";
import { PIPELINE_STEPS } from "../../../constants/enums";
import { AUTO_VIDEO_UI_TEXTS } from "../../../constants/texts";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";
interface VoiceSelectionSectionProps {
  voiceName: string;
  voiceURI: string;
  voiceProvider: string;
  isVoiceDialogOpen: boolean;
  setIsVoiceDialogOpen: (val: boolean) => void;
  voiceDialogPersistenceScope: string;
  currentLang: Lang;
  handleVoiceSelect: (v: CatalogVoice) => void;
  truncateWords: (str: string, maxWords: number) => string;
  T: ReturnType<typeof getAutoVideoTexts>;
}
export const VoiceSelectionSection: React.FC<VoiceSelectionSectionProps> = ({ voiceName, voiceURI, voiceProvider, isVoiceDialogOpen, setIsVoiceDialogOpen, voiceDialogPersistenceScope, currentLang, handleVoiceSelect, truncateWords, T }) => {
  const uiTexts = _.get(AUTO_VIDEO_UI_TEXTS, currentLang, AUTO_VIDEO_UI_TEXTS.vi);
  const displayVoiceName = voiceName || voiceURI;
  return (
    <StudioCard className={cn(RT_VIDEO_GENERATION.BG_SLATE_900_60_BORDER_BORDER_SLATE_800_80_ROUNDED)}>
      <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
        <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2)}>
          <span className={cn(RT_VIDEO_GENERATION.W_6_H_6_ROUNDED_LG_BG_AMBER_500_15)}>{PIPELINE_STEPS.STEP_2}</span>
          <h3 className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)} title={T.sec2TitleTooltip}>
            <Mic className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_AMBER_400)} /> {T.sec2Title}
          </h3>
        </div>
        <div className={cn(RT_VIDEO_GENERATION.HEADER_BADGE_FLEX_ITEMS_CENTER_GAP_2_TEXT_11PX_FONT)}>
          <Volume2 className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_AMBER_400)} />
          <span className={cn(RT_VIDEO_GENERATION.FONT_SEMIBOLD_TEXT_SLATE_300)}>{voiceProvider || uiTexts.aiVoiceDefault}</span>
        </div>
      </div>
      <div>
        <Button type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON} variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED} onClick={() => setIsVoiceDialogOpen(true)} className={cn(RT_VIDEO_GENERATION.W_FULL_BG_SLATE_955_90_BORDER_BORDER_SLATE_800)} title={T.voiceBtnTooltip}>
          <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_GAP_3)}>
            <div className={cn(RT_VIDEO_GENERATION.P_2_5_ROUNDED_XL_BG_AMBER_500_10_BORDER)}>
              <Mic className={cn(RT_SHARED.W_4_H_4)} />
            </div>
            <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_5)}>
              <Tooltip content={displayVoiceName} position={SOURCE_TEXT_TOP}>
                <span className={cn(RT_VIDEO_GENERATION.FONT_BOLD_TEXT_SLATE_100_TEXT_XS_GROUP_HOVER_TEXT)}>{truncateWords(displayVoiceName, 5)}</span>
              </Tooltip>
              {!_.isEmpty(voiceProvider) && <span className={cn(RT_VIDEO_GENERATION.TEXT_9PX_TEXT_AMBER_400_90_FONT_MONO_FONT_SEMIBOLD)}>{voiceProvider}</span>}
            </div>
          </div>
          <ChevronDown className={cn(RT_VIDEO_GENERATION.W_4_H_4_TEXT_SLATE_500_GROUP_HOVER_TEXT)} />
        </Button>
      </div>
      {isVoiceDialogOpen && (
        <VoiceSelectionDialog key={voiceDialogPersistenceScope} isOpen={isVoiceDialogOpen} onClose={() => setIsVoiceDialogOpen(false)} currentLang={_.isEqual(currentLang, SOURCE_TEXT_EN) ? SOURCE_TEXT_EN : SOURCE_TEXT_VI} selectedVoiceId={voiceURI} favoriteVoices={[]} onToggleFavoriteVoice={_.noop} onSelectVoice={handleVoiceSelect} persistenceScope={voiceDialogPersistenceScope} />
      )}
    </StudioCard>
  );
};
