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
  T: any;
}

const CHROME_OPTION_GROUPS = {
  vi: [
    {
      label: "Trình duyệt tự động",
      options: [
        { value: REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS, label: "Chạy ngầm", desc: "Chạy ẩn ngầm không mở cửa sổ trình duyệt khi AI tạo ảnh và video" },
        { value: REFACTOR_CONSTANTS.CHROME_MODE_WINDOWED, label: "Hiển thị cửa sổ", desc: "Mở cửa sổ trình duyệt để theo dõi trực quan quá trình tạo" },
      ],
    },
  ],
  en: [
    {
      label: "Browser Mode",
      options: [
        { value: REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS, label: "Headless", desc: "Run in background without opening browser window" },
        { value: REFACTOR_CONSTANTS.CHROME_MODE_WINDOWED, label: "Windowed", desc: "Show browser window visually during generation" },
      ],
    },
  ],
};

const RESUME_OPTION_GROUPS = {
  vi: [
    {
      label: "Tiến trình tạo video",
      options: [
        { value: REFACTOR_CONSTANTS.RESUME_MODE_RESUME, label: "Dùng lại nội dung đã có", desc: "Tái sử dụng kịch bản, giọng đọc và các ảnh phân cảnh đã tạo thành công trước đó để tiết kiệm thời gian và chi phí" },
        { value: REFACTOR_CONSTANTS.RESUME_MODE_NEW, label: "Bắt đầu tạo mới", desc: "Tạo mới toàn bộ kịch bản, giọng đọc và phân cảnh từ đầu" },
      ],
    },
  ],
  en: [
    {
      label: "Generation Flow",
      options: [
        { value: REFACTOR_CONSTANTS.RESUME_MODE_RESUME, label: "Resume Existing", desc: "Reuse previously generated script, voice, and scene images to save time and tokens" },
        { value: REFACTOR_CONSTANTS.RESUME_MODE_NEW, label: "Start Fresh", desc: "Generate fresh script, voice, and visual assets from scratch" },
      ],
    },
  ],
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
  const isVi = _.isEqual(language, AppLanguage.VI);
  const chromeGroups = CHROME_OPTION_GROUPS[isVi ? "vi" : "en"];
  const resumeGroups = RESUME_OPTION_GROUPS[isVi ? "vi" : "en"];

  const currentChromeValue = chromeHeadless
    ? REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS
    : REFACTOR_CONSTANTS.CHROME_MODE_WINDOWED;

  const currentResumeValue = resumeMode
    ? REFACTOR_CONSTANTS.RESUME_MODE_RESUME
    : REFACTOR_CONSTANTS.RESUME_MODE_NEW;

  return (
    <div className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_PANEL_CLASS, showAdvancedImageSettings && AUTO_GENERATOR_CONSTANTS.ADVANCED_PANEL_OPEN_CLASS)}>
      <Button
        type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON as any}
        variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED as any}
        onClick={() => setShowAdvancedImageSettings(!showAdvancedImageSettings)}
        aria-expanded={showAdvancedImageSettings}
        className={AUTO_GENERATOR_CONSTANTS.ADVANCED_TRIGGER_CLASS}
      >
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
        <div className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_CONTENT_CLASS, "sm:grid-cols-5")}>
          <BackgroundModeSelect
            value={backgroundMode}
            onChange={setBackgroundMode}
            language={language}
            label={T.styleBgModeLabel}
          />
          <SceneTextModeSelect
            value={textMode}
            onChange={setTextMode}
            language={language}
            label={T.styleTextModeLabel}
          />
          <ImageFocusModeSelect
            value={imageFocusMode}
            onChange={setImageFocusMode}
            language={language}
            label={T.imageFocusModeLabel}
          />

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block" title={T.lblChromeHeadlessTooltip}>
              {T.lblChromeHeadless}
            </span>
            <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors" title={T.lblChromeHeadlessTooltip}>
              <Globe className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <select
                value={currentChromeValue}
                onChange={(e) => setChromeHeadless(e.target.value === REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS)}
                className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
              >
                {_.map(chromeGroups, (group) => (
                  <optgroup key={group.label} label={group.label} className="bg-slate-955 text-slate-400 font-bold">
                    {_.map(group.options, (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        title={option.desc}
                        className="bg-slate-955 text-slate-300 font-normal"
                      >
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block" title={T.lblResumeModeTooltip}>
              {T.lblResumeMode}
            </span>
            <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors" title={T.lblResumeModeTooltip}>
              <RefreshCw className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <select
                value={currentResumeValue}
                onChange={(e) => setResumeMode(e.target.value === REFACTOR_CONSTANTS.RESUME_MODE_RESUME)}
                className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
              >
                {_.map(resumeGroups, (group) => (
                  <optgroup key={group.label} label={group.label} className="bg-slate-955 text-slate-400 font-bold">
                    {_.map(group.options, (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        title={option.desc}
                        className="bg-slate-955 text-slate-300 font-normal"
                      >
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
