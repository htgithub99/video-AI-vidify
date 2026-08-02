import _ from "lodash";
import { ChevronDown, Globe, RefreshCw, Sliders } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { AUTO_GENERATOR_CONSTANTS } from "../../constants/config";
import { REFACTOR_CONSTANTS } from "../../constants";

interface AdvancedImageSettingsSectionProps {
  showAdvancedImageSettings: boolean;
  setShowAdvancedImageSettings: (val: boolean) => void;
  chromeHeadless: boolean;
  setChromeHeadless: (val: boolean) => void;
  resumeMode: boolean;
  setResumeMode: (val: boolean) => void;
  T: any;
}

export const AdvancedImageSettingsSection: React.FC<AdvancedImageSettingsSectionProps> = ({
  showAdvancedImageSettings,
  setShowAdvancedImageSettings,
  chromeHeadless,
  setChromeHeadless,
  resumeMode,
  setResumeMode,
  T,
}) => {
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
          <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_ICON_WRAP_CLASS}><Sliders className={AUTO_GENERATOR_CONSTANTS.ADVANCED_ICON_CLASS} /></span>
          <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_TEXT_WRAP_CLASS}>
            <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_TITLE_CLASS}>{T.advancedConfig}</span>
            <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_HINT_CLASS} title={T.advancedConfigTooltip}>{T.advancedConfigHint}</span>
          </span>
        </span>
        <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_CHEVRON_WRAP_CLASS}>
          <ChevronDown className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_CHEVRON_CLASS, showAdvancedImageSettings && AUTO_GENERATOR_CONSTANTS.ADVANCED_CHEVRON_OPEN_CLASS)} />
        </span>
      </Button>
      {showAdvancedImageSettings && (
        <div className={AUTO_GENERATOR_CONSTANTS.ADVANCED_CONTENT_CLASS}>
          {[
            {
              label: T.lblChromeHeadless,
              tooltip: T.lblChromeHeadlessTooltip,
              icon: <Globe className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />,
              value: chromeHeadless ? REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS : REFACTOR_CONSTANTS.CHROME_MODE_WINDOWED,
              onChange: (v: string) => setChromeHeadless(v === REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS),
              options: [
                { value: REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS, label: T.optionHeadless },
                { value: REFACTOR_CONSTANTS.CHROME_MODE_WINDOWED, label: T.optionWindowed },
              ] as { value: string; label: string }[],
            },
            {
              label: T.lblResumeMode,
              tooltip: T.lblResumeModeTooltip,
              icon: <RefreshCw className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />,
              value: resumeMode ? REFACTOR_CONSTANTS.RESUME_MODE_RESUME : REFACTOR_CONSTANTS.RESUME_MODE_NEW,
              onChange: (v: string) => setResumeMode(v === REFACTOR_CONSTANTS.RESUME_MODE_RESUME),
              options: [
                { value: REFACTOR_CONSTANTS.RESUME_MODE_RESUME, label: T.optionResume },
                { value: REFACTOR_CONSTANTS.RESUME_MODE_NEW, label: T.optionNew },
              ] as { value: string; label: string }[],
            },
          ].map(({ label, tooltip, icon, value, onChange, options }) => (
            <div key={label} className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block" title={tooltip}>{label}</span>
              <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors" title={tooltip}>
                {icon}
                <select value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                  {_.map(options, (o) => <option key={o.value} value={o.value} className="bg-slate-955 text-slate-300">{o.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
