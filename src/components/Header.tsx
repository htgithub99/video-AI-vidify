import { FC, ReactNode, useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import { Lang, translations } from "../lib/lang.js";
import { Video, Image as ImageIcon, Mic, Sun, Moon, LogOut, Sparkles, Trash2, ChevronDown } from "lucide-react";
import { AppTheme, AppLanguage } from "../constants/enums";
import { useLicense } from "../contexts/LicenseContext";
import { UIConstants, SecurityConstants } from "../constants/security";
import { CINEMATIC_SETUP_TEXTS, QUOTA_TEXTS } from "../constants/texts";
import { API_ROUTES } from "../constants/apiRoutes";
import { safeSystemFetch } from "../lib/shared-utils";
import { AiPlanningFallbackProvider } from "../types";
import { toast } from "sonner";
import _ from "lodash";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { REFACTOR_CONSTANTS } from "../constants";

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
        "header-control-item hidden lg:flex items-center gap-2 bg-slate-955/60 border border-slate-800/80 rounded-xl px-2.5 shadow-sm transition-all hover:border-slate-700 hover:bg-slate-900/60 cursor-default shrink-0",
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

export default function Header({ currentLang, setLang, theme, toggleTheme }: HeaderProps) {
  const t = translations[currentLang as Lang];
  const isVietnamese = _.isEqual(currentLang, AppLanguage.VI);
  const langKey = isVietnamese ? UIConstants.LANG_VI : UIConstants.LANG_EN;
  const quotaText = _.get(QUOTA_TEXTS, langKey, QUOTA_TEXTS.VN);
  const { licenseInfo, logoutLicense } = useLicense();
  const [clearingProvider, setClearingProvider] = useState<AiPlanningFallbackProvider | null>(null);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<{ provider: AiPlanningFallbackProvider; name: string; label: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const planningTexts = CINEMATIC_SETUP_TEXTS[currentLang as Lang] || CINEMATIC_SETUP_TEXTS.vi;
  const roomActions = [
    {
      provider: AiPlanningFallbackProvider.GeminiChat,
      name: planningTexts.GEMINI_CHAT_OPTION,
      label: planningTexts.CLEAR_GEMINI_ROOMS,
      hoverClass: "hover:bg-blue-500/10 dark:hover:bg-blue-500/20 hover:border-blue-500/40",
      iconClass: "text-blue-600 dark:text-blue-400 group-hover:scale-110",
      textHoverClass: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
    },
    {
      provider: AiPlanningFallbackProvider.GrokChat,
      name: planningTexts.GROK_CHAT_OPTION,
      label: planningTexts.CLEAR_GROK_ROOMS,
      hoverClass: "hover:bg-amber-500/10 dark:hover:bg-amber-500/20 hover:border-amber-500/40",
      iconClass: "text-amber-600 dark:text-amber-400 group-hover:scale-110",
      textHoverClass: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
    },
    {
      provider: AiPlanningFallbackProvider.ChatGptUi,
      name: planningTexts.CHATGPT_UI_OPTION,
      label: planningTexts.CLEAR_CHATGPT_ROOMS,
      hoverClass: "hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 hover:border-emerald-500/40",
      iconClass: "text-emerald-600 dark:text-emerald-400 group-hover:scale-110",
      textHoverClass: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
    },
  ];

  const handleExecuteClearRooms = async () => {
    if (!confirmAction) return;
    const { provider, name } = confirmAction;
    setIsClearing(true);
    setClearingProvider(provider);
    try {
      const response = await safeSystemFetch(API_ROUTES.PIPELINE_CLEAR_CHAT_ROOMS, { provider });
      const message = (response.success ? planningTexts.CLEAR_ROOM_SUCCESS : planningTexts.CLEAR_ROOM_ERROR)
        .replace("{0}", name)
        .replace("{1}", _.toString(response.data?.deletedConversationCount || 0));
      if (response.success) toast.success(message);
      else toast.error(message);
    } catch (error) {
      toast.error(planningTexts.CLEAR_ROOM_ERROR.replace("{0}", name).replace("{1}", "0"));
    } finally {
      setIsClearing(false);
      setClearingProvider(null);
      setConfirmAction(null);
    }
  };

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

          <div className={cn("relative shrink-0")} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={cn(
                "header-control-item group px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-150 cursor-pointer shadow-sm select-none",
                "bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700",
                "text-slate-300 hover:text-rose-400 active:scale-95",
                isDropdownOpen && "border-rose-500/40 text-rose-400 bg-rose-500/10",
              )}
              title={isVietnamese ? "Dọn dẹp phiên chat AI" : "Clear AI Chat Sessions"}
              aria-label="Clear AI Chat Sessions"
              aria-expanded={isDropdownOpen}>
              <Trash2 className={cn("w-3.5 h-3.5 text-rose-500 group-hover:text-rose-400 transition-transform group-hover:scale-110 shrink-0 -translate-y-[0.5px]")} />
              <span className={cn("text-[11px] font-bold hidden sm:inline-flex items-center leading-none translate-y-[0.5px]")}>{isVietnamese ? "Dọn AI" : "Clear AI"}</span>
              <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0", isDropdownOpen && "rotate-180 text-rose-400")} />
            </button>

            {isDropdownOpen && (
              <div
                className={cn(
                  "absolute right-0 top-full mt-1.5 w-52 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl flex flex-col gap-1",
                )}>
                <div className={cn("px-3 py-1.5 text-[9.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between")}>
                  <span>{isVietnamese ? "Dọn phiên AI" : "Clear AI"}</span>
                  <Sparkles className={cn("w-2.5 h-2.5 text-rose-500")} />
                </div>

                <div className={cn("flex flex-col gap-1 pt-1")}>
                  {_.map(roomActions, (action) => (
                    <button
                      key={action.provider}
                      type="button"
                      disabled={!_.isNull(clearingProvider)}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setConfirmAction(action);
                      }}
                      className={cn(
                        "w-full px-3 py-2 rounded-xl flex items-center justify-between gap-3 text-left transition-all duration-150 cursor-pointer select-none group",
                        "bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-sm active:scale-[0.98]",
                        action.hoverClass,
                      )}
                      title={planningTexts.CLEAR_ROOM_TOOLTIP.replace("{0}", action.name)}
                      aria-label={action.label}>
                      <div className={cn("flex items-center gap-2.5 min-w-0")}>
                        <Trash2 className={cn("w-4 h-4 transition-transform shrink-0", action.iconClass)} />
                        <span className={cn("text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors", action.textHoverClass)}>
                          {action.name}
                        </span>
                      </div>
                      <span className={cn("text-[10.5px] font-bold text-rose-500 dark:text-rose-400 transition-transform group-hover:translate-x-0.5")}>
                        {isVietnamese ? "Xóa" : "Clear"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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

      <Modal
        isOpen={!_.isNull(confirmAction)}
        onClose={() => {
          if (!isClearing && _.isNull(clearingProvider)) setConfirmAction(null);
        }}
        maxWidth="max-w-md"
        title={
          <div className={cn("flex items-center gap-2")}>
            <Trash2 className={cn("w-4 h-4 text-rose-500")} />
            <span>{isVietnamese ? "Xác nhận xóa phòng chat" : "Confirm Room Cleanup"}</span>
          </div>
        }>
        <div className={cn("space-y-4 pt-1")}>
          <p className={cn("text-slate-700 dark:text-slate-200 text-sm font-medium leading-relaxed")}>
            {planningTexts.CLEAR_ROOM_CONFIRM.replace("{0}", confirmAction?.name || "")}
          </p>
          <div className={cn("p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold leading-relaxed flex items-start gap-2 shadow-sm")}>
            <span className={cn("inline-block mt-0.5 shrink-0")}>⚠️</span>
            <span>
              {isVietnamese
                ? "Hành động này sẽ đóng các tab trình duyệt AI và làm mới hoàn toàn phiên làm việc để giải phóng tài nguyên."
                : "This action will close AI browser tabs and completely refresh the session to free up resources."}
            </span>
          </div>
          <div className={cn("flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800")}>
            <Button
              variant={REFACTOR_CONSTANTS.VARIANT_GHOST}
              disabled={isClearing || !_.isNull(clearingProvider)}
              onClick={() => setConfirmAction(null)}
              className={cn("px-5 py-2.5 text-xs font-bold rounded-xl")}>
              {t.cancel || "Hủy"}
            </Button>
            <Button
              variant={REFACTOR_CONSTANTS.VARIANT_DANGER}
              isLoading={isClearing || !_.isNull(clearingProvider)}
              onClick={handleExecuteClearRooms}
              className={cn("px-6 py-2.5 text-xs font-bold rounded-xl shadow-md shadow-rose-600/20")}>
              {t.delete || "Xóa ngay"}
            </Button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
