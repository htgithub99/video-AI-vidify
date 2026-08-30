import { FC, ReactNode } from "react";
import { cn } from "../lib/utils";
import { Lang, translations } from "../lib/lang.js";
import { Video, Image as ImageIcon, Mic, Sun, Moon, LogOut, Sparkles, Menu, X } from "lucide-react";
import { AppTheme, AppLanguage } from "../constants/enums";
import { useLicense } from "../contexts/LicenseContext";
import { UIConstants, SecurityConstants } from "../constants/security";
import { QUOTA_TEXTS } from "../constants/texts";
import _ from "lodash";

interface HeaderProps {
  currentLang: AppLanguage | Lang;
  setLang: (lang: Lang) => void;
  theme: AppTheme | string;
  toggleTheme: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

interface QuotaBadgeProps {
  icon: ReactNode;
  usage: number;
  limit: number;
  isUnlimited: boolean;
  colorClass: string;
  tooltip: string;
  formatNumber?: boolean;
}

const QuotaBadge: FC<QuotaBadgeProps> = ({ icon, usage, limit, isUnlimited, colorClass, tooltip, formatNumber = false }) => {
  const formattedUsage = formatNumber ? usage.toLocaleString() : usage;
  const formattedLimit = isUnlimited ? UIConstants.INFINITY : formatNumber ? limit.toLocaleString() : limit;

  return (
    <div
      className={cn(
        "header-control-item hidden lg:flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 rounded-xl px-2.5 shadow-sm transition-all hover:border-slate-700 hover:bg-slate-900/60 cursor-default shrink-0",
      )}
      title={tooltip}>
      {icon}
      <span className={cn("text-[11px] font-bold text-slate-400 font-mono flex items-center")}>
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
    <header className={cn("app-header bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 text-slate-200 sticky top-0 z-50 flex-shrink-0")}>
      <div className={cn("w-full px-3 sm:px-5 lg:px-6 py-2 flex items-center justify-between gap-3 sm:gap-5 relative")}>
        <div className={cn("flex items-center gap-2 sm:gap-3 min-w-0")}>
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className={cn(
                "header-action-btn xl:hidden w-8 h-8 p-0 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shrink-0 flex items-center justify-center",
              )}
              title="Menu">
              {isMobileMenuOpen ? <X className={cn("w-4 h-4 text-rose-400")} /> : <Menu className={cn("w-4 h-4")} />}
            </button>
          )}

          <div className={cn("w-8 h-8 bg-rose-600 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-white/15 shrink-0")}>
            <Video className={cn("w-4 h-4 text-white")} />
          </div>
          <div className={cn("min-w-0")}>
            <h1 className={cn("text-sm sm:text-base font-extrabold text-slate-100 flex items-center gap-2 font-logo truncate")}>
              <span className={cn("truncate")}>{t.appTitle}</span>
              <span
                className={cn("hidden sm:flex text-[9px] bg-rose-500/10 text-rose-500 font-bold px-2 py-0.5 rounded-full border border-rose-500/20 items-center gap-1 shrink-0")}>
                <Sparkles className={cn("w-2.5 h-2.5 text-rose-400")} />
                {t.v2_4_PRO}
              </span>
            </h1>
          </div>
        </div>

        <div className={cn("flex items-center justify-end gap-1.5 sm:gap-2 shrink-0")}>
          <div className={cn("header-control-item hidden xl:flex items-center gap-2 px-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20")}>
            <div className={cn("w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]")} />
            <span className={cn("text-[9px] uppercase font-bold text-emerald-400 font-mono tracking-wider")}>{t.Live_Sync}</span>
          </div>

          <QuotaBadge
            icon={<Video className={cn("w-3.5 h-3.5 text-blue-400")} />}
            usage={usageVideo}
            limit={limitVideo}
            isUnlimited={isUnlimited}
            colorClass="text-blue-400"
            tooltip={quotaText.VIDEO_TOOLTIP}
          />
          <QuotaBadge
            icon={<ImageIcon className={cn("w-3.5 h-3.5 text-emerald-400")} />}
            usage={usageImage}
            limit={limitImage}
            isUnlimited={isUnlimited}
            colorClass="text-emerald-400"
            tooltip={quotaText.IMAGE_TOOLTIP}
          />
          <QuotaBadge
            icon={<Mic className={cn("w-3.5 h-3.5 text-amber-400")} />}
            usage={usageVoice}
            limit={limitVoice}
            isUnlimited={isUnlimited}
            colorClass="text-amber-400"
            tooltip={quotaText.VOICE_TOOLTIP}
            formatNumber
          />

          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              "header-control-item w-8 min-w-[32px] max-w-[32px] p-0 text-slate-400 hover:text-slate-100 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-center cursor-pointer shadow-sm",
            )}
            title={themeTooltip}>
            {_.isEqual(theme, AppTheme.DARK) ? <Sun className={cn("w-3.5 h-3.5 text-amber-400")} /> : <Moon className={cn("w-3.5 h-3.5 text-sky-400")} />}
          </button>

          <button
            type="button"
            onClick={logoutLicense}
            className={cn(
              "header-control-item px-2.5 rounded-xl flex items-center gap-1.5 font-bold text-xs bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 cursor-pointer shadow-sm",
            )}
            title={logoutTooltip}>
            <LogOut className={cn("w-3.5 h-3.5")} />
            <span className={cn("hidden lg:inline text-[10px]")}>{logoutLabel}</span>
          </button>

          <div className={cn("header-control-container bg-slate-900/80 border border-slate-800 rounded-xl shrink-0 gap-0.5 shadow-inner relative")}>
            {_.map(Object.values(AppLanguage), (langCode) => (
              <button
                key={langCode}
                onClick={() => setLang(langCode as Lang)}
                className={cn(
                  "btn-lang-item px-2 sm:px-2.5 text-[9px] sm:text-[10px] rounded-lg font-black outline-none flex items-center justify-center relative z-10 cursor-pointer",
                  _.isEqual(currentLang, langCode) ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60",
                )}>
                {langCode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
