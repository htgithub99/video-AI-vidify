import React from "react";
import _ from "lodash";
import { ChevronDown, Globe, RefreshCw, Sliders } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { AUTO_GENERATOR_CONSTANTS } from "../../constants/config";
import { REFACTOR_CONSTANTS } from "../../constants";
import { BackgroundMode, TextInImageMode, ImageFocusMode } from "../../types";
import { BackgroundModeSelect } from "./BackgroundModeSelect";
import { ImageFocusModeSelect } from "./ImageFocusModeSelect";
import { AppLanguage } from "../../constants/enums";
import { SceneTextModeSelect } from "./SceneTextModeSelect";
import { ADVANCED_SETTING_GROUPS } from "../../constants/texts";
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

export const AdvancedImageSettingsSection: React.FC<AdvancedImageSettingsSectionProps> = ({
  showAdvancedImageSettings,
  setShowAdvancedImageSettings,
  chromeHeadless,
  setChromeHeadless,
  resumeMode,
  setResumeMode,
  backgroundMode,
  setBackgroundMode,
  textMode,
  setTextMode,
  imageFocusMode,
  setImageFocusMode,
  language,
  T,
}) => {
  const { chromeGroups, resumeGroups } = buildOptionGroups(language);

  const currentChromeValue = chromeHeadless ? REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS : REFACTOR_CONSTANTS.CHROME_MODE_WINDOWED;

  const currentResumeValue = resumeMode ? REFACTOR_CONSTANTS.RESUME_MODE_RESUME : REFACTOR_CONSTANTS.RESUME_MODE_NEW;

  return (
    <div className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_PANEL_CLASS, showAdvancedImageSettings && AUTO_GENERATOR_CONSTANTS.ADVANCED_PANEL_OPEN_CLASS)}>
      <Button
        type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
        variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
        onClick={() => setShowAdvancedImageSettings(!showAdvancedImageSettings)}
        aria-expanded={showAdvancedImageSettings}
        className={AUTO_GENERATOR_CONSTANTS.ADVANCED_TRIGGER_CLASS}>
        <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_LAYOUT_CLASS}>
          <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_ICON_WRAP_CLASS}>
            <Sliders className={AUTO_GENERATOR_CONSTANTS.ADVANCED_ICON_CLASS} />
          </span>
          <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_TEXT_WRAP_CLASS}>
            <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_TITLE_CLASS}>{T.advancedConfig}</span>
            <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_HINT_CLASS} title={T.advancedConfigTooltip}>
              {T.advancedConfigHint}
            </span>
          </span>
        </span>
        <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_CHEVRON_WRAP_CLASS}>
          <ChevronDown className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_CHEVRON_CLASS, showAdvancedImageSettings && AUTO_GENERATOR_CONSTANTS.ADVANCED_CHEVRON_OPEN_CLASS)} />
        </span>
      </Button>

      {showAdvancedImageSettings && (
        <div className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_CONTENT_CLASS, "!grid-cols-1 sm:!grid-cols-2 md:!grid-cols-3 lg:!grid-cols-5")}>
          <BackgroundModeSelect value={backgroundMode} onChange={setBackgroundMode} language={language} label={T.styleBgModeLabel} />
          <SceneTextModeSelect value={textMode} onChange={setTextMode} language={language} label={T.styleTextModeLabel} />
          <ImageFocusModeSelect value={imageFocusMode} onChange={setImageFocusMode} language={language} label={T.imageFocusModeLabel} />

          <div className={cn("space-y-1")}>
            <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")} title={T.lblChromeHeadlessTooltip}>
              {T.lblChromeHeadless}
            </span>
            <div
              className={cn("relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 h-10 focus-within:border-rose-500/50 transition-colors")}
              title={T.lblChromeHeadlessTooltip}>
              <Globe className={cn("w-3.5 h-3.5 text-slate-400 mr-2 shrink-0")} />
              <select
                value={currentChromeValue}
                onChange={(e) => setChromeHeadless(_.isEqual(e.target.value, REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS))}
                className={cn("flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5")}>
                {_.map(chromeGroups, (group) => (
                  <optgroup key={group.label} label={group.label} className={cn("bg-slate-955 text-slate-400 font-bold")}>
                    {_.map(group.options, (option) => (
                      <option key={option.value} value={option.value} title={option.desc} className={cn("bg-slate-955 text-slate-300 font-normal")}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className={cn("pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5")} />
            </div>
          </div>

          <div className={cn("space-y-1")}>
            <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")} title={T.lblResumeModeTooltip}>
              {T.lblResumeMode}
            </span>
            <div
              className={cn("relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 h-10 focus-within:border-rose-500/50 transition-colors")}
              title={T.lblResumeModeTooltip}>
              <RefreshCw className={cn("w-3.5 h-3.5 text-slate-400 mr-2 shrink-0")} />
              <select
                value={currentResumeValue}
                onChange={(e) => setResumeMode(_.isEqual(e.target.value, REFACTOR_CONSTANTS.RESUME_MODE_RESUME))}
                className={cn("flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5")}>
                {_.map(resumeGroups, (group) => (
                  <optgroup key={group.label} label={group.label} className={cn("bg-slate-955 text-slate-400 font-bold")}>
                    {_.map(group.options, (option) => (
                      <option key={option.value} value={option.value} title={option.desc} className={cn("bg-slate-955 text-slate-300 font-normal")}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className={cn("pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5")} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
