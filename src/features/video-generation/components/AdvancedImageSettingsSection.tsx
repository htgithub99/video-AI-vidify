import { RUNTIME_TEXT as RT_VIDEO_GENERATION } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { StudioCard, StudioSelect } from "../../../components/ui/Studio.js";
import React from "react";
import _ from "lodash";
import { ChevronDown, Globe, RefreshCw, Sliders } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";
import { AUTO_GENERATOR_CONSTANTS } from "../../../constants/config";
import { REFACTOR_CONSTANTS } from "../../../constants";
import { BackgroundMode, TextInImageMode, ImageFocusMode } from "../../../types";
import { BackgroundModeSelect } from "./BackgroundModeSelect";
import { ImageFocusModeSelect } from "./ImageFocusModeSelect";
import { AppLanguage } from "../../../constants/enums";
import { SceneTextModeSelect } from "./SceneTextModeSelect";
import { ADVANCED_SETTING_GROUPS } from "../../../constants/texts";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";
interface AdvancedImageSettingsSectionProps {
  showAdvancedImageSettings: boolean;
  setShowAdvancedImageSettings: (val: boolean) => void;
  chromeHeadless: boolean;
  setChromeHeadless: (val: boolean) => void;
  resumeMode: boolean;
  setResumeMode: (val: boolean) => void;
  backgroundMode: BackgroundMode;
  setBackgroundMode: (value: BackgroundMode) => void;
  textMode: TextInImageMode;
  setTextMode: (value: TextInImageMode) => void;
  imageFocusMode: ImageFocusMode;
  setImageFocusMode: (value: ImageFocusMode) => void;
  language: AppLanguage;
  T: ReturnType<typeof getAutoVideoTexts>;
}
const buildOptionGroups = (lang: AppLanguage) => {
  const isVi = _.isEqual(lang, AppLanguage.VI);
  const texts = isVi ? ADVANCED_SETTING_GROUPS.vi : ADVANCED_SETTING_GROUPS.en;
  const chromeGroups = [
    {
      label: texts.chromeGroup,
      options: [
        { value: REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS, label: texts.headlessLabel, desc: texts.headlessDesc },
        { value: REFACTOR_CONSTANTS.CHROME_MODE_WINDOWED, label: texts.windowedLabel, desc: texts.windowedDesc },
      ],
    },
  ];
  const resumeGroups = [
    {
      label: texts.resumeGroup,
      options: [
        { value: REFACTOR_CONSTANTS.RESUME_MODE_RESUME, label: texts.resumeLabel, desc: texts.resumeDesc },
        { value: REFACTOR_CONSTANTS.RESUME_MODE_NEW, label: texts.newLabel, desc: texts.newDesc },
      ],
    },
  ];
  return { chromeGroups, resumeGroups };
};
export const AdvancedImageSettingsSection: React.FC<AdvancedImageSettingsSectionProps> = ({ showAdvancedImageSettings, setShowAdvancedImageSettings, chromeHeadless, setChromeHeadless, resumeMode, setResumeMode, backgroundMode, setBackgroundMode, textMode, setTextMode, imageFocusMode, setImageFocusMode, language, T }) => {
  const { chromeGroups, resumeGroups } = buildOptionGroups(language);
  const currentChromeValue = chromeHeadless ? REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS : REFACTOR_CONSTANTS.CHROME_MODE_WINDOWED;
  const currentResumeValue = resumeMode ? REFACTOR_CONSTANTS.RESUME_MODE_RESUME : REFACTOR_CONSTANTS.RESUME_MODE_NEW;
  return (
    <StudioCard className={cn(RT_VIDEO_GENERATION.GLASS_CARD_BG_SLATE_900_80_ROUNDED_2XL_SHADOW_SM, AUTO_GENERATOR_CONSTANTS.ADVANCED_PANEL_CLASS, showAdvancedImageSettings && AUTO_GENERATOR_CONSTANTS.ADVANCED_PANEL_OPEN_CLASS)}>
      <Button type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON} variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED} onClick={() => setShowAdvancedImageSettings(!showAdvancedImageSettings)} aria-expanded={showAdvancedImageSettings} className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_TRIGGER_CLASS, RT_VIDEO_GENERATION.CURSOR_POINTER_HOVER_BG_SLATE_800_40_ROUNDED_2XL)}>
        <span className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_LAYOUT_CLASS)}>
          <span className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_ICON_WRAP_CLASS, RT_VIDEO_GENERATION.BG_BLUE_500_15_TEXT_BLUE_400)}>
            <Sliders className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_ICON_CLASS)} />
          </span>
          <span className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_TEXT_WRAP_CLASS)}>
            <span className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_TITLE_CLASS)}>{T.advancedConfig}</span>
            <span className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_HINT_CLASS)} title={T.advancedConfigTooltip}>
              {T.advancedConfigHint}
            </span>
          </span>
        </span>
        <span className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_CHEVRON_WRAP_CLASS)}>
          <ChevronDown className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_CHEVRON_CLASS, showAdvancedImageSettings && AUTO_GENERATOR_CONSTANTS.ADVANCED_CHEVRON_OPEN_CLASS)} />
        </span>
      </Button>
      {showAdvancedImageSettings && (
        <div className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_CONTENT_CLASS, RT_VIDEO_GENERATION.GRID_COLS_1_SM_GRID_COLS_2_MD_GRID_COLS)}>
          <BackgroundModeSelect value={backgroundMode} onChange={setBackgroundMode} language={language} label={T.styleBgModeLabel} />
          <SceneTextModeSelect value={textMode} onChange={setTextMode} language={language} label={T.styleTextModeLabel} />
          <ImageFocusModeSelect value={imageFocusMode} onChange={setImageFocusMode} language={language} label={T.imageFocusModeLabel} />
          <div className={cn(RT_SHARED.SPACE_Y_1)}>
            <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE)} title={T.lblChromeHeadlessTooltip}>
              {T.lblChromeHeadless}
            </span>
            <div className={cn(RT_VIDEO_GENERATION.RELATIVE_FLEX_ITEMS_CENTER_BG_SLATE_955_BORDER_BORDER_SLATE)} title={T.lblChromeHeadlessTooltip}>
              <Globe className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_SLATE_400_MR)} />
              <StudioSelect value={currentChromeValue} onChange={(e) => setChromeHeadless(_.isEqual(e.target.value, REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS))} className={cn(RT_VIDEO_GENERATION.FLEX_1_BG_TRANSPARENT_TEXT_SLATE_200_TEXT_XS_FONT)}>
                {_.map(chromeGroups, (group) => (
                  <optgroup key={group.label} label={group.label} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_400_FONT_BOLD)}>
                    {_.map(group.options, (option) => (
                      <option key={option.value} value={option.value} title={option.desc} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_300_FONT_NORMAL)}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </StudioSelect>
              <ChevronDown className={cn(RT_VIDEO_GENERATION.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_2_TEXT_SLATE_500_W)} />
            </div>
          </div>
          <div className={cn(RT_SHARED.SPACE_Y_1)}>
            <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE)} title={T.lblResumeModeTooltip}>
              {T.lblResumeMode}
            </span>
            <div className={cn(RT_VIDEO_GENERATION.RELATIVE_FLEX_ITEMS_CENTER_BG_SLATE_955_BORDER_BORDER_SLATE)} title={T.lblResumeModeTooltip}>
              <RefreshCw className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_SLATE_400_MR)} />
              <StudioSelect value={currentResumeValue} onChange={(e) => setResumeMode(_.isEqual(e.target.value, REFACTOR_CONSTANTS.RESUME_MODE_RESUME))} className={cn(RT_VIDEO_GENERATION.FLEX_1_BG_TRANSPARENT_TEXT_SLATE_200_TEXT_XS_FONT)}>
                {_.map(resumeGroups, (group) => (
                  <optgroup key={group.label} label={group.label} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_400_FONT_BOLD)}>
                    {_.map(group.options, (option) => (
                      <option key={option.value} value={option.value} title={option.desc} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_300_FONT_NORMAL)}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </StudioSelect>
              <ChevronDown className={cn(RT_VIDEO_GENERATION.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_2_TEXT_SLATE_500_W)} />
            </div>
          </div>
        </div>
      )}
    </StudioCard>
  );
};
