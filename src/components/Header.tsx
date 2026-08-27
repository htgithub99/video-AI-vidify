import { FC, ReactNode } from "react";
import { cn } from "../lib/utils";
import { Lang, translations } from "../lib/lang.js";
import { Video, Image as ImageIcon, Mic, Sun, Moon, LogOut } from "lucide-react";
import { Button } from "./ui/Button";
import { AppTheme, AppLanguage } from "../constants/enums";
import { useLicense } from "../contexts/LicenseContext";
import { UIConstants, SecurityConstants } from "../constants/security";
import { QUOTA_TEXTS } from "../constants/texts";
import _ from "lodash";

const LANG_BTN_BASE = "px-3 py-1.5 text-[10px] rounded-lg font-extrabold transition-all duration-200 outline-none flex items-center justify-center relative z-10 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 active:scale-95";
const LANG_BTN_ACTIVE = "bg-white dark:bg-slate-800 text-rose-600 shadow-md border border-slate-200 dark:border-slate-700";
const LANG_BTN_INACTIVE = "text-slate-500 hover:text-slate-700 hover:bg-slate-300/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 border border-transparent";

interface HeaderProps { currentLang: AppLanguage | Lang; setLang: (lang: Lang) => void; theme: AppTheme | string; toggleTheme: () => void; }

interface QuotaBadgeProps { icon: ReactNode; usage: number; limit: number; isUnlimited: boolean; colorClass: string; tooltip: string; formatNumber?: boolean; }

const QuotaBadge: FC<QuotaBadgeProps> = ({ icon, usage, limit, isUnlimited, colorClass, tooltip, formatNumber = false }) => {
  const formattedUsage = formatNumber ? usage.toLocaleString() : usage;
  const formattedLimit = isUnlimited ? UIConstants.INFINITY : formatNumber ? limit.toLocaleString() : limit;

  return (
    <div className="hidden sm:flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg px-2.5 py-1.5 shadow-sm transition-colors hover:bg-slate-800" title={tooltip}>
      {icon}
      <span className="text-[10px] font-bold text-slate-400">
        <span className={cn(colorClass, "font-black")}>{formattedUsage}</span> / {formattedLimit}
      </span>
    </div>
  );
};

export default function Header({ currentLang, setLang, theme, toggleTheme }: HeaderProps) {
  const t = translations[currentLang as Lang];
  const isVietnamese = _.isEqual(currentLang, AppLanguage.VI);
  const langKey = isVietnamese ? UIConstants.LANG_VI : UIConstants.LANG_EN;
  const quotaText = _.get(QUOTA_TEXTS, langKey, QUOTA_TEXTS.VN);
  const { licenseInfo, logoutLicense } = useLicense();

  const limitVideo = _.get(licenseInfo, SecurityConstants.LIMITS_VIDEO, SecurityConstants.ZERO);
  const limitImage = _.get(licenseInfo, SecurityConstants.LIMITS_IMAGE, SecurityConstants.ZERO);
  const limitVoice = _.get(licenseInfo, SecurityConstants.LIMITS_VOICE, SecurityConstants.ZERO);
  const isUnlimited = _.get(licenseInfo, SecurityConstants.LIMITS_UNLIMITED, false);

  const usageVideo = _.get(licenseInfo, SecurityConstants.USAGE_VIDEO, SecurityConstants.ZERO);
  const usageImage = _.get(licenseInfo, SecurityConstants.USAGE_IMAGE, SecurityConstants.ZERO);
  const usageVoice = _.get(licenseInfo, SecurityConstants.USAGE_VOICE, SecurityConstants.ZERO);

  const themeTooltip = _.isEqual(theme, AppTheme.DARK) ? SecurityConstants.THEME_LIGHT_TOOLTIP : SecurityConstants.THEME_DARK_TOOLTIP;

  const logoutTooltip = isVietnamese ? SecurityConstants.LOGOUT_KEY_TOOLTIP_VI : SecurityConstants.LOGOUT_KEY_TOOLTIP_EN;

  const logoutLabel = isVietnamese ? SecurityConstants.LOGOUT_KEY_LABEL_VI : SecurityConstants.LOGOUT_KEY_LABEL_EN;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-200 sticky top-0 z-50 shadow-sm flex-shrink-0">
      <div className="w-full max-w-[100vw] xl:max-w-screen-2xl mx-auto px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4 relative">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-rose-600 rounded-xl flex items-center justify-center shadow-md shadow-rose-500/10">
            <Video className="w-4.5 h-4.5 text-slate-100 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wide text-slate-100 flex items-center gap-2 font-logo">
              {t.appTitle}
              <span className="text-[9px] bg-rose-500/10 text-rose-400 font-extrabold px-1.5 py-0.5 rounded border border-rose-500/20 tracking-tighter">{t.v2_4_PRO}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <div className="hidden md:flex items-center gap-1.5 mr-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">{t.Live_Sync}</span>
          </div>

          <QuotaBadge icon={<Video className="w-3.5 h-3.5 text-blue-400" />} usage={usageVideo} limit={limitVideo} isUnlimited={isUnlimited} colorClass="text-blue-400" tooltip={quotaText.VIDEO_TOOLTIP} />

          <QuotaBadge icon={<ImageIcon className="w-3.5 h-3.5 text-emerald-400" />} usage={usageImage} limit={limitImage} isUnlimited={isUnlimited} colorClass="text-emerald-400" tooltip={quotaText.IMAGE_TOOLTIP} />

          <QuotaBadge icon={<Mic className="w-3.5 h-3.5 text-amber-400" />} usage={usageVoice} limit={limitVoice} isUnlimited={isUnlimited} colorClass="text-amber-400" tooltip={quotaText.VOICE_TOOLTIP} formatNumber />

          <Button variant="secondary" size="xs" onClick={toggleTheme} className="p-2 bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-xl shadow-none" title={themeTooltip}>
            {_.isEqual(theme, AppTheme.DARK) ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <Button variant="secondary" size="xs" onClick={logoutLicense} className="px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl shadow-none flex items-center gap-1.5 font-bold text-xs" title={logoutTooltip}>
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden lg:inline text-[10px]">{logoutLabel}</span>
          </Button>

          <div className="flex items-center bg-slate-200/60 dark:bg-slate-900/60 border border-slate-300/50 dark:border-slate-800/80 rounded-xl p-1 shrink-0 gap-1 shadow-inner relative">
            {_.map(Object.values(AppLanguage), (langCode) => (
              <button key={langCode} onClick={() => setLang(langCode as Lang)} className={cn(LANG_BTN_BASE, _.isEqual(currentLang, langCode) ? LANG_BTN_ACTIVE : LANG_BTN_INACTIVE)}>
                {langCode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
