import { FC, ReactNode, useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import { Lang, translations } from "../lib/lang.js";
import { Video, Image as ImageIcon, Mic, Sun, Moon, LogOut, Sparkles, Trash2, ChevronDown, Zap, Bot, AlertTriangle, ClipboardList } from "lucide-react";
import WorkflowActivityDialog from "./WorkflowActivityDialog";
import { WORKFLOW_ACTIVITY_CONFIG, WORKFLOW_ACTIVITY_TEXT } from "../constants/workflowActivity";
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
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener(UIConstants.MOUSE_DOWN_EVENT, handleClickOutside);
    }
    return () => document.removeEventListener(UIConstants.MOUSE_DOWN_EVENT, handleClickOutside);
  }, [isDropdownOpen]);

  const isDark = _.isEqual(theme, AppTheme.DARK);
  const planningTexts = CINEMATIC_SETUP_TEXTS[currentLang as Lang] || CINEMATIC_SETUP_TEXTS.vi;
  const roomActions = [
    {
      provider: AiPlanningFallbackProvider.GeminiChat,
      name: planningTexts.GEMINI_CHAT_OPTION,
      label: planningTexts.CLEAR_GEMINI_ROOMS,
      subtext: planningTexts.GEMINI_BROWSER,
      badgeStyle: isDark
        ? "bg-blue-500/15 text-blue-400 border-blue-500/25"
        : "bg-blue-50 text-blue-600 border-blue-200",
      icon: <Sparkles className={cn("w-3.5 h-3.5")} />,
    },
    {
      provider: AiPlanningFallbackProvider.GrokChat,
      name: planningTexts.GROK_CHAT_OPTION,
      label: planningTexts.CLEAR_GROK_ROOMS,
      subtext: planningTexts.GROK_BROWSER,
      badgeStyle: isDark
        ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
        : "bg-amber-50 text-amber-600 border-amber-200",
      icon: <Zap className={cn("w-3.5 h-3.5")} />,
    },
    {
      provider: AiPlanningFallbackProvider.ChatGptUi,
      name: planningTexts.CHATGPT_UI_OPTION,
      label: planningTexts.CLEAR_CHATGPT_ROOMS,
      subtext: planningTexts.CHATGPT_BROWSER,
      badgeStyle: isDark
        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
        : "bg-emerald-50 text-emerald-600 border-emerald-200",
      icon: <Bot className={cn("w-3.5 h-3.5")} />,
    },
  ];

  const handleExecuteClearRooms = async () => {
    if (!confirmAction) return;
    const { provider, name } = confirmAction;
    setIsClearing(true);
    setClearingProvider(provider);
    try {
      const response = await safeSystemFetch(API_ROUTES.PIPELINE_CLEAR_CHAT_ROOMS, { provider });
      const successTemplate = response.data?.deletedAll ? planningTexts.CLEAR_ROOM_ALL_SUCCESS : planningTexts.CLEAR_ROOM_SUCCESS;
      const message = (response.success ? successTemplate : planningTexts.CLEAR_ROOM_ERROR)
        .replace(SecurityConstants.PLACEHOLDER_0, name)
        .replace(SecurityConstants.PLACEHOLDER_1, response.success
          ? _.toString(response.data?.deletedConversationCount || SecurityConstants.ZERO)
          : _.toString(response.error || planningTexts.CLEAR_ROOM_ERROR));
      if (response.success) toast.success(message);
      else toast.error(message);
    } catch (error) {
      toast.error(
        planningTexts.CLEAR_ROOM_ERROR
          .replace(SecurityConstants.PLACEHOLDER_0, name)
          .replace(SecurityConstants.PLACEHOLDER_1, _.toString(_.get(error, "message", SecurityConstants.ZERO))),
      );
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
          <Button variant="unstyled" type="button" onClick={() => setIsActivityOpen(true)} title={WORKFLOW_ACTIVITY_TEXT[isVietnamese ? WORKFLOW_ACTIVITY_CONFIG.LANGUAGES.vi : WORKFLOW_ACTIVITY_CONFIG.LANGUAGES.en].title} aria-label={WORKFLOW_ACTIVITY_TEXT[isVietnamese ? WORKFLOW_ACTIVITY_CONFIG.LANGUAGES.vi : WORKFLOW_ACTIVITY_CONFIG.LANGUAGES.en].title} className={cn("header-control-item w-8 min-w-[32px] p-0 rounded-xl flex items-center justify-center bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white")}><ClipboardList className={cn("w-4 h-4")} /></Button>
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
            <Button variant="unstyled"
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={cn("header-control-item px-2.5 rounded-xl inline-flex items-center gap-1.5 text-[11px] font-bold cursor-pointer shadow-sm select-none", { "bg-slate-900/80 border border-slate-800 text-slate-200": isDark, "bg-white/90 border border-stone-200 text-zinc-700": !isDark, "border-slate-700 bg-slate-850 text-white": isDropdownOpen && isDark, "border-stone-300 bg-stone-50 text-zinc-900": isDropdownOpen && !isDark })}
              title={planningTexts.CLEAR_AI_SESSIONS}
              aria-label={planningTexts.CLEAR_AI_SESSIONS}
              aria-expanded={isDropdownOpen}>
              <Trash2 className={cn("w-3.5 h-3.5 shrink-0 text-rose-500")} />
              <span className={cn("leading-none hidden sm:inline")}>{planningTexts.CLEAR_AI_SHORT}</span>
              <ChevronDown className={cn("w-3 h-3 shrink-0 text-slate-400 transition-transform duration-150", isDropdownOpen && "rotate-180")} />
            </Button>

            {isDropdownOpen && (
              <div
                className={cn("absolute right-0 top-full mt-2 w-64 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl flex flex-col gap-1.5", { "bg-[#181424]/98 border border-[#2c233a] shadow-black/60": isDark, "bg-white/98 border border-zinc-200/90 shadow-xl shadow-zinc-900/10": !(isDark) })}>
                <div
                  className={cn("px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between border-b", { "border-[#2c233a] text-zinc-400": isDark, "border-zinc-100 text-zinc-500": !(isDark) })}>
                  <div className={cn("flex items-center gap-1.5")}>
                    <Trash2 className={cn("w-3 h-3 text-rose-500")} />
                    <span className={cn({ "text-zinc-200": isDark, "text-zinc-800": !isDark })}>
                      {planningTexts.CLEAR_AI_MENU}
                    </span>
                  </div>
                  <span
                    className={cn("text-[9px] font-medium normal-case px-1.5 py-0.5 rounded border", { "text-zinc-400 bg-zinc-800/80 border-zinc-700/50": isDark, "text-zinc-500 bg-zinc-100 border-zinc-200": !(isDark) })}>
                    {planningTexts.CLOSE_HIDDEN_TABS}
                  </span>
                </div>

                <div className={cn("flex flex-col gap-1.5 pt-0.5")}>
                  {_.map(roomActions, (action) => (
                    <div
                      key={action.provider}
                      className={cn("w-full p-2 rounded-xl flex items-center justify-between gap-2.5 text-left border cursor-default select-none transition-none", { "bg-[#221b2d]/60 border-[#2c233a]/80": isDark, "bg-zinc-50/80 border-zinc-200/70": !(isDark) })}>
                      <div className={cn("flex items-center gap-2.5 min-w-0 flex-1")}>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-xs", action.badgeStyle)}>
                          {action.icon}
                        </div>
                        <div className={cn("flex flex-col min-w-0")}>
                          <span
                            className={cn("text-xs font-bold truncate leading-tight", { "text-zinc-100": isDark, "text-zinc-900": !(isDark) })}>
                            {action.name}
                          </span>
                          <span
                            className={cn("text-[10px] font-medium truncate leading-tight mt-0.5", { "text-zinc-400": isDark, "text-zinc-500": !(isDark) })}>
                            {action.subtext}
                          </span>
                        </div>
                      </div>

                      <Button variant="unstyled"
                        type="button"
                        disabled={!_.isNull(clearingProvider)}
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setConfirmAction(action);
                        }}
                        className={cn("btn-icon-tiny group/btn w-7 h-7 min-w-[28px] max-w-[28px] min-h-[28px] max-h-[28px] p-0 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs active:scale-90 shrink-0", { "bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 hover:border-rose-600 hover:shadow-sm hover:shadow-rose-600/30": isDark, "bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-200 hover:border-rose-600 hover:shadow-sm hover:shadow-rose-600/20": !(isDark) }, "disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-rose-500/30")}
                        title={planningTexts.CLEAR_ROOM_TOOLTIP.replace(SecurityConstants.PLACEHOLDER_0, action.name)}
                        aria-label={action.label}>
                        <Trash2 className={cn("w-3.5 h-3.5 shrink-0 transition-transform group-hover/btn:scale-110")} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button variant="unstyled"
            type="button"
            onClick={toggleTheme}
            className={cn(
              "header-control-item w-8 min-w-[32px] max-w-[32px] p-0 text-slate-400 hover:text-slate-100 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-center cursor-pointer shadow-sm",
            )}
            title={themeTooltip}>
            {_.isEqual(theme, AppTheme.DARK) ? <Sun className={cn("w-3.5 h-3.5 text-amber-400")} /> : <Moon className={cn("w-3.5 h-3.5 text-sky-400")} />}
          </Button>

          <Button variant="unstyled"
            type="button"
            onClick={logoutLicense}
            className={cn(
              "header-control-item px-2.5 rounded-xl flex items-center gap-1.5 font-bold text-xs bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 cursor-pointer shadow-sm",
            )}
            title={logoutTooltip}>
            <LogOut className={cn("w-3.5 h-3.5")} />
            <span className={cn("hidden lg:inline text-[10px]")}>{logoutLabel}</span>
          </Button>

          <div className={cn("header-control-container bg-slate-900/80 border border-slate-800 rounded-xl shrink-0 gap-0.5 shadow-inner relative")}>
            {_.map(Object.values(AppLanguage), (langCode) => (
              <Button variant="unstyled"
                key={langCode}
                onClick={() => setLang(langCode as Lang)}
                className={cn("btn-lang-item px-2 sm:px-2.5 text-[9px] sm:text-[10px] rounded-lg font-black outline-none flex items-center justify-center relative z-10 cursor-pointer", { "bg-rose-600 text-white shadow-sm shadow-rose-600/30": _.isEqual(currentLang, langCode), "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60": !(_.isEqual(currentLang, langCode)) })}>
                {langCode.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <WorkflowActivityDialog isOpen={isActivityOpen} onClose={() => setIsActivityOpen(false)} language={isVietnamese ? WORKFLOW_ACTIVITY_CONFIG.LANGUAGES.vi : WORKFLOW_ACTIVITY_CONFIG.LANGUAGES.en} />
      <Modal
        isOpen={!_.isNull(confirmAction)}
        onClose={() => {
          if (!isClearing && _.isNull(clearingProvider)) setConfirmAction(null);
        }}
        maxWidth="max-w-md"
        title={
          <div className={cn("flex items-center gap-2 uppercase tracking-wider font-extrabold")}>
            <Trash2 className={cn("w-4 h-4 text-rose-500")} />
            <span className={cn("uppercase font-extrabold tracking-wider")}>{planningTexts.CONFIRM_ROOM_CLEANUP}</span>
          </div>
        }>
        <div className={cn("space-y-4 pt-1")}>
          <p className={cn("text-slate-700 dark:text-slate-200 text-sm font-medium leading-relaxed")}>
            {planningTexts.CLEAR_ROOM_CONFIRM.replace(SecurityConstants.PLACEHOLDER_0, confirmAction?.name || REFACTOR_CONSTANTS.VD_EMPTY_STRING)}
          </p>
          <div className={cn("p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold leading-relaxed flex items-start gap-2 shadow-sm")}>
            <AlertTriangle className={cn("w-4 h-4 shrink-0 text-amber-500 mt-0.5")} />
            <span>
              {planningTexts.CLEAR_ROOM_RESOURCE_NOTICE}
            </span>
          </div>
          <div className={cn("flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800")}>
            <Button variant={REFACTOR_CONSTANTS.VARIANT_GHOST}
              disabled={isClearing || !_.isNull(clearingProvider)}
              onClick={() => setConfirmAction(null)}
              className={cn("px-5 py-2.5 text-xs font-bold rounded-xl")}>
              {t.cancel || planningTexts.CANCEL_FALLBACK}
            </Button>
            <Button variant={REFACTOR_CONSTANTS.VARIANT_DANGER}
              isLoading={isClearing || !_.isNull(clearingProvider)}
              onClick={handleExecuteClearRooms}
              className={cn("px-6 py-2.5 text-xs font-bold rounded-xl shadow-md shadow-rose-600/20")}>
              {t.delete || planningTexts.DELETE_NOW_FALLBACK}
            </Button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
