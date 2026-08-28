import { FC, ReactNode } from "react";
import { cn } from "../lib/utils";
import { Lang, translations } from "../lib/lang.js";
import { Video, Image as ImageIcon, Mic, Sun, Moon, LogOut, Sparkles, Menu, X } from "lucide-react";
import { Button } from "./ui/Button";
import { AppTheme, AppLanguage } from "../constants/enums";
import { useLicense } from "../contexts/LicenseContext";
import { UIConstants, SecurityConstants } from "../constants/security";
import { QUOTA_TEXTS } from "../constants/texts";
import _ from "lodash";

const LANG_BTN_BASE = "px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] rounded-lg font-black transition-all duration-200 outline-none flex items-center justify-center relative z-10 focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-95";
const LANG_BTN_ACTIVE = "bg-rose-600 text-white shadow-sm shadow-rose-600/30";
const LANG_BTN_INACTIVE = "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60";

interface HeaderProps {
  currentLang: AppLanguage | Lang;
  setLang: (lang: Lang) => void;
  theme: AppTheme | string;
  toggleTheme: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

interface QuotaBadgeProps { icon: ReactNode; usage: number; limit: number; isUnlimited: boolean; colorClass: string; tooltip: string; formatNumber?: boolean; }

const QuotaBadge: FC<QuotaBadgeProps> = ({ icon, usage, limit, isUnlimited, colorClass, tooltip, formatNumber = false }) => {
  const formattedUsage = formatNumber ? usage.toLocaleString() : usage;
  const formattedLimit = isUnlimited ? UIConstants.INFINITY : formatNumber ? limit.toLocaleString() : limit;

  return (
    <div className={cn("hidden lg:flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 rounded-xl px-2.5 py-1.5 shadow-sm transition-all hover:border-slate-700 hover:bg-slate-900/60 cursor-default shrink-0")} title={tooltip}>
      {icon}
      <span className={cn("text-[11px] font-bold text-slate-400 font-mono")}>
        <span className={cn(colorClass, "font-black")}>{formattedUsage}</span>
        <span className={cn("text-slate-600 mx-1")}>/</span>
        <span className={cn("text-slate-300")}>{formattedLimit}</span>
      </span>
    </div>
  );
};

export default function Header({ currentLang, setLang, theme, toggleTheme, isMobileMenuOpen = false, onToggleMobileMenu }: HeaderProps) {
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
    <header className={cn("bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 text-slate-200 sticky top-0 z-50 shadow-sm flex-shrink-0")}>
      <div className={cn("w-full max-w-[100vw] xl:max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-8 py-2.5 flex items-center justify-between gap-2 sm:gap-4 relative")}>
        <div className={cn("flex items-center gap-2 sm:gap-3 min-w-0")}>
          
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className={cn("md:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shrink-0")}
              title="Menu">
              {isMobileMenuOpen ? <X className={cn("w-4 h-4 text-rose-400")} /> : <Menu className={cn("w-4 h-4")} />}
            </button>
          )}

          <div className={cn("p-1.5 sm:p-2 bg-gradient-to-tr from-rose-600 to-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-rose-600/25 ring-1 ring-white/20 shrink-0")}>
            <Video className={cn("w-4 h-4 sm:w-4.5 sm:h-4.5 text-white")} />
          </div>
          <div className={cn("min-w-0")}>
            <h1 className={cn("text-xs sm:text-sm font-black tracking-wide text-slate-100 flex items-center gap-1.5 sm:gap-2 font-logo truncate")}>
              <span className={cn("truncate")}>{t.appTitle}</span>
              <span className={cn("text-[8px] sm:text-[9px] bg-rose-500/15 text-rose-400 font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full border border-rose-500/30 tracking-tight flex items-center gap-1 shrink-0")}>
                <Sparkles className={cn("w-2.5 h-2.5 text-rose-400")} />
                {t.v2_4_PRO}
              </span>
            </h1>
          </div>
        </div>

        <div className={cn("flex items-center justify-end gap-1.5 sm:gap-2.5 shrink-0")}>
          <div className={cn("hidden xl:flex items-center gap-2 mr-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20")}>
            <div className={cn("w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse")} />
            <span className={cn("text-[9px] uppercase font-bold text-emerald-400 font-mono tracking-wider")}>{t.Live_Sync}</span>
          </div>

          <QuotaBadge icon={<Video className={cn("w-3.5 h-3.5 text-blue-400")} />} usage={usageVideo} limit={limitVideo} isUnlimited={isUnlimited} colorClass="text-blue-400" tooltip={quotaText.VIDEO_TOOLTIP} />
          <QuotaBadge icon={<ImageIcon className={cn("w-3.5 h-3.5 text-emerald-400")} />} usage={usageImage} limit={limitImage} isUnlimited={isUnlimited} colorClass="text-emerald-400" tooltip={quotaText.IMAGE_TOOLTIP} />
          <QuotaBadge icon={<Mic className={cn("w-3.5 h-3.5 text-amber-400")} />} usage={usageVoice} limit={limitVoice} isUnlimited={isUnlimited} colorClass="text-amber-400" tooltip={quotaText.VOICE_TOOLTIP} formatNumber />

          <Button variant="outline" size="xs" onClick={toggleTheme} className={cn("p-1.5 sm:p-2 text-slate-400 hover:text-slate-100 rounded-xl")} title={themeTooltip}>
            {_.isEqual(theme, AppTheme.DARK) ? <Sun className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400")} /> : <Moon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400")} />}
          </Button>

          <Button variant="danger" size="xs" onClick={logoutLicense} className={cn("px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl flex items-center gap-1.5 font-bold text-xs")} title={logoutTooltip}>
            <LogOut className={cn("w-3.5 h-3.5")} />
            <span className={cn("hidden lg:inline text-[10px]")}>{logoutLabel}</span>
          </Button>

          <div className={cn("flex items-center bg-slate-900/80 border border-slate-800 rounded-xl p-0.5 sm:p-1 shrink-0 gap-0.5 sm:gap-1 shadow-inner relative")}>
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
