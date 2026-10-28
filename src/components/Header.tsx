import { RUNTIME_TEXT as RT_UI } from "../constants/runtime/ui.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import {
  SOURCE_TEXT_BG_AMBER_500_15_TEXT_AMBER,
  SOURCE_TEXT_BG_AMBER_50_TEXT_AMBER_600,
  SOURCE_TEXT_BG_BLUE_500_15_TEXT_BLUE,
  SOURCE_TEXT_BG_BLUE_50_TEXT_BLUE_600,
  SOURCE_TEXT_BG_EMERALD_500_15_TEXT_EMERALD,
  SOURCE_TEXT_BG_EMERALD_50_TEXT_EMERALD_600,
  SOURCE_TEXT_BUTTON,
  SOURCE_TEXT_MAX_W_MD,
  SOURCE_TEXT_MESSAGE,
  SOURCE_TEXT_SYMBOL,
  SOURCE_TEXT_TEXT_AMBER_400,
  SOURCE_TEXT_TEXT_BLUE_400,
  SOURCE_TEXT_TEXT_EMERALD_400,
  SOURCE_TEXT_UNSTYLED,
} from "../constants/sourceText";
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
import { StudioIcon } from "./ui/Studio.js";
import { STUDIO_UI, STUDIO_TEXTS } from "../constants/studioTheme.js";
import { Menu } from "lucide-react";
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
    <div className={cn(RT_UI.HEADER_CONTROL_ITEM_HIDDEN_LG_FLEX_ITEMS_CENTER_GAP_2)} title={tooltip}>
      {icon}
      <span className={cn(RT_UI.TEXT_11PX_FONT_BOLD_TEXT_SLATE_400_FONT_MONO_FLEX)}>
        <span className={cn(colorClass, RT_UI.FONT_BLACK)}>{formattedUsage}</span>
        <span className={cn(RT_SHARED.TEXT_SLATE_600_MX_1)}>{SOURCE_TEXT_SYMBOL}</span>
        <span className={cn(RT_UI.TEXT_SLATE_300)}>{formattedLimit}</span>
      </span>
    </div>
  );
};
export default function Header({ currentLang, setLang, theme, toggleTheme, isMobileMenuOpen, onToggleMobileMenu }: HeaderProps) {
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
    { provider: AiPlanningFallbackProvider.GeminiChat, name: planningTexts.GEMINI_CHAT_OPTION, label: planningTexts.CLEAR_GEMINI_ROOMS, subtext: planningTexts.GEMINI_BROWSER, badgeStyle: isDark ? SOURCE_TEXT_BG_BLUE_500_15_TEXT_BLUE : SOURCE_TEXT_BG_BLUE_50_TEXT_BLUE_600, icon: <Sparkles className={cn(RT_SHARED.W_3_5_H_3_5)} /> },
    { provider: AiPlanningFallbackProvider.GrokChat, name: planningTexts.GROK_CHAT_OPTION, label: planningTexts.CLEAR_GROK_ROOMS, subtext: planningTexts.GROK_BROWSER, badgeStyle: isDark ? SOURCE_TEXT_BG_AMBER_500_15_TEXT_AMBER : SOURCE_TEXT_BG_AMBER_50_TEXT_AMBER_600, icon: <Zap className={cn(RT_SHARED.W_3_5_H_3_5)} /> },
    { provider: AiPlanningFallbackProvider.ChatGptUi, name: planningTexts.CHATGPT_UI_OPTION, label: planningTexts.CLEAR_CHATGPT_ROOMS, subtext: planningTexts.CHATGPT_BROWSER, badgeStyle: isDark ? SOURCE_TEXT_BG_EMERALD_500_15_TEXT_EMERALD : SOURCE_TEXT_BG_EMERALD_50_TEXT_EMERALD_600, icon: <Bot className={cn(RT_SHARED.W_3_5_H_3_5)} /> },
  ];
  const handleExecuteClearRooms = async () => {
    if (!confirmAction) return;
    const { provider, name } = confirmAction;
    setIsClearing(true);
    setClearingProvider(provider);
    try {
      const response = await safeSystemFetch(API_ROUTES.PIPELINE_CLEAR_CHAT_ROOMS, { provider });
      const successTemplate = response.data?.deletedAll ? planningTexts.CLEAR_ROOM_ALL_SUCCESS : planningTexts.CLEAR_ROOM_SUCCESS;
      const message = (response.success ? successTemplate : planningTexts.CLEAR_ROOM_ERROR).replace(SecurityConstants.PLACEHOLDER_0, name).replace(SecurityConstants.PLACEHOLDER_1, response.success ? _.toString(response.data?.deletedConversationCount || SecurityConstants.ZERO) : _.toString(response.error || planningTexts.CLEAR_ROOM_ERROR));
      if (response.success) toast.success(message);
      else toast.error(message);
    } catch (error) {
      toast.error(planningTexts.CLEAR_ROOM_ERROR.replace(SecurityConstants.PLACEHOLDER_0, name).replace(SecurityConstants.PLACEHOLDER_1, _.toString(_.get(error, SOURCE_TEXT_MESSAGE, SecurityConstants.ZERO))));
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
    <header className={cn(RT_UI.APP_HEADER_BG_SLATE_950_90_BACKDROP_BLUR_XL_BORDER)}>
      <div className={STUDIO_UI.APP_HEADER_ROW}>
        <div className={STUDIO_UI.APP_HEADER_BRAND}>
          {onToggleMobileMenu && (
            <Button variant={STUDIO_UI.UNSTYLED} type={STUDIO_UI.BUTTON_TYPE} className={STUDIO_UI.MENU_BUTTON} onClick={onToggleMobileMenu} aria-expanded={!!isMobileMenuOpen} aria-label={isMobileMenuOpen ? STUDIO_TEXTS[currentLang].CLOSE_MENU : STUDIO_TEXTS[currentLang].OPEN_MENU}>
              <Menu className={STUDIO_UI.ICON} />
            </Button>
          )}
          <StudioIcon icon={Video} />
          <div className={STUDIO_UI.APP_HEADER_TITLE}>
            <h1 className={cn(RT_UI.TEXT_SM_SM_TEXT_BASE_FONT_EXTRABOLD_TEXT_SLATE_100)}>
              <span className={cn(RT_SHARED.TRUNCATE)}>{t.appTitle}</span>
              <span className={cn(RT_UI.HIDDEN_SM_FLEX_TEXT_9PX_BG_ROSE_500_10_TEXT)}>
                <Sparkles className={cn(RT_UI.W_2_5_H_2_5_TEXT_ROSE_400)} />
                {t.v2_4_PRO}
              </span>
            </h1>
          </div>
        </div>
        <div className={STUDIO_UI.APP_HEADER_ACTIONS}>
          <Button
            variant={SOURCE_TEXT_UNSTYLED}
            type={SOURCE_TEXT_BUTTON}
            onClick={() => setIsActivityOpen(true)}
            title={WORKFLOW_ACTIVITY_TEXT[isVietnamese ? WORKFLOW_ACTIVITY_CONFIG.LANGUAGES.vi : WORKFLOW_ACTIVITY_CONFIG.LANGUAGES.en].title}
            aria-label={WORKFLOW_ACTIVITY_TEXT[isVietnamese ? WORKFLOW_ACTIVITY_CONFIG.LANGUAGES.vi : WORKFLOW_ACTIVITY_CONFIG.LANGUAGES.en].title}
            className={cn(RT_UI.HEADER_CONTROL_ITEM_W_8_MIN_W_32PX_P_0)}>
            <ClipboardList className={cn(RT_SHARED.W_4_H_4)} />
          </Button>
          <div className={cn(RT_UI.HEADER_CONTROL_ITEM_HIDDEN_XL_FLEX_ITEMS_CENTER_GAP_2)}>
            <div className={cn(RT_UI.W_1_5_H_1_5_ROUNDED_FULL_BG_EMERALD)} />
            <span className={cn(RT_UI.TEXT_9PX_UPPERCASE_FONT_BOLD_TEXT_EMERALD_400_FONT_MONO)}>{t.Live_Sync}</span>
          </div>
          <QuotaBadge icon={<Video className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_BLUE_400)} />} usage={usageVideo} limit={limitVideo} isUnlimited={isUnlimited} colorClass={SOURCE_TEXT_TEXT_BLUE_400} tooltip={quotaText.VIDEO_TOOLTIP} />
          <QuotaBadge icon={<ImageIcon className={cn(RT_UI.W_3_5_H_3_5_TEXT_EMERALD_400)} />} usage={usageImage} limit={limitImage} isUnlimited={isUnlimited} colorClass={SOURCE_TEXT_TEXT_EMERALD_400} tooltip={quotaText.IMAGE_TOOLTIP} />
          <QuotaBadge icon={<Mic className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_AMBER_400)} />} usage={usageVoice} limit={limitVoice} isUnlimited={isUnlimited} colorClass={SOURCE_TEXT_TEXT_AMBER_400} tooltip={quotaText.VOICE_TOOLTIP} formatNumber />
          <div className={cn(RT_UI.RELATIVE_SHRINK_0)} ref={dropdownRef}>
            <Button
              variant={SOURCE_TEXT_UNSTYLED}
              type={SOURCE_TEXT_BUTTON}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={cn(RT_UI.HEADER_CONTROL_ITEM_PX_2_5_ROUNDED_XL_INLINE_FLEX, { "bg-slate-900/80 border border-slate-800 text-slate-200": isDark, "bg-white/90 border border-stone-200 text-zinc-700": !isDark, "border-slate-700 bg-slate-850 text-white": isDropdownOpen && isDark, "border-stone-300 bg-stone-50 text-zinc-900": isDropdownOpen && !isDark })}
              title={planningTexts.CLEAR_AI_SESSIONS}
              aria-label={planningTexts.CLEAR_AI_SESSIONS}
              aria-expanded={isDropdownOpen}>
              <Trash2 className={cn(RT_UI.W_3_5_H_3_5_SHRINK_0_TEXT_ROSE)} />
              <span className={cn(RT_UI.LEADING_NONE_HIDDEN_SM_INLINE)}>{planningTexts.CLEAR_AI_SHORT}</span>
              <ChevronDown className={cn(RT_UI.W_3_H_3_SHRINK_0_TEXT_SLATE_400_TRANSITION, isDropdownOpen && RT_UI.ROTATE_180)} />
            </Button>
            {isDropdownOpen && (
              <div className={cn(RT_UI.ABSOLUTE_RIGHT_0_TOP_FULL_MT_2_W_64_ROUNDED, { "bg-[#181424]/98 border border-[#2c233a] shadow-black/60": isDark, "bg-white/98 border border-zinc-200/90 shadow-xl shadow-zinc-900/10": !isDark })}>
                <div className={cn(RT_UI.PX_2_5_PY_1_5_TEXT_10PX_FONT_BOLD, { "border-[#2c233a] text-zinc-400": isDark, "border-zinc-100 text-zinc-500": !isDark })}>
                  <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_1_5)}>
                    <Trash2 className={cn(RT_UI.W_3_H_3_TEXT_ROSE_500)} />
                    <span className={cn({ "text-zinc-200": isDark, "text-zinc-800": !isDark })}>{planningTexts.CLEAR_AI_MENU}</span>
                  </div>
                  <span className={cn(RT_UI.TEXT_9PX_FONT_MEDIUM_NORMAL_CASE_PX_1_5_PY, { "text-zinc-400 bg-zinc-800/80 border-zinc-700/50": isDark, "text-zinc-500 bg-zinc-100 border-zinc-200": !isDark })}>{planningTexts.CLOSE_HIDDEN_TABS}</span>
                </div>
                <div className={cn(RT_UI.FLEX_FLEX_COL_GAP_1_5_PT_0_5)}>
                  {_.map(roomActions, (action) => (
                    <div key={action.provider} className={cn(RT_UI.W_FULL_P_2_ROUNDED_XL_FLEX_ITEMS_CENTER_JUSTIFY, { "bg-[#221b2d]/60 border-[#2c233a]/80": isDark, "bg-zinc-50/80 border-zinc-200/70": !isDark })}>
                      <div className={cn(RT_UI.FLEX_ITEMS_CENTER_GAP_2_5_MIN_W_0_FLEX)}>
                        <div className={cn(RT_UI.W_8_H_8_ROUNDED_LG_FLEX_ITEMS_CENTER_JUSTIFY, action.badgeStyle)}>{action.icon}</div>
                        <div className={cn(RT_UI.FLEX_FLEX_COL_MIN_W_0)}>
                          <span className={cn(RT_UI.TEXT_XS_FONT_BOLD_TRUNCATE_LEADING_TIGHT, { "text-zinc-100": isDark, "text-zinc-900": !isDark })}>{action.name}</span>
                          <span className={cn(RT_UI.TEXT_10PX_FONT_MEDIUM_TRUNCATE_LEADING_TIGHT_MT_0_5, { "text-zinc-400": isDark, "text-zinc-500": !isDark })}>{action.subtext}</span>
                        </div>
                      </div>
                      <Button
                        variant={SOURCE_TEXT_UNSTYLED}
                        type={SOURCE_TEXT_BUTTON}
                        disabled={!_.isNull(clearingProvider)}
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setConfirmAction(action);
                        }}
                        className={cn(
                          RT_UI.BTN_ICON_TINY_GROUP_BTN_W_7_H_7_MIN,
                          { "bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 hover:border-rose-600 hover:shadow-sm hover:shadow-rose-600/30": isDark, "bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-200 hover:border-rose-600 hover:shadow-sm hover:shadow-rose-600/20": !isDark },
                          RT_UI.DISABLED_OPACITY_50_DISABLED_CURSOR_NOT_ALLOWED_FOCUS_OUTLINE_NONE,
                        )}
                        title={planningTexts.CLEAR_ROOM_TOOLTIP.replace(SecurityConstants.PLACEHOLDER_0, action.name)}
                        aria-label={action.label}>
                        <Trash2 className={cn(RT_UI.W_3_5_H_3_5_SHRINK_0_TRANSITION_TRANSFORM)} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={toggleTheme} className={cn(RT_UI.HEADER_CONTROL_ITEM_W_8_MIN_W_32PX_MAX_W)} title={themeTooltip}>
            {_.isEqual(theme, AppTheme.DARK) ? <Sun className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_AMBER_400)} /> : <Moon className={cn(RT_UI.W_3_5_H_3_5_TEXT_SKY_400)} />}
          </Button>
          <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={logoutLicense} className={cn(RT_UI.HEADER_CONTROL_ITEM_PX_2_5_ROUNDED_XL_FLEX_ITEMS)} title={logoutTooltip}>
            <LogOut className={cn(RT_SHARED.W_3_5_H_3_5)} />
            <span className={cn(RT_UI.HIDDEN_LG_INLINE_TEXT_10PX)}>{logoutLabel}</span>
          </Button>
          <div className={cn(RT_UI.HEADER_CONTROL_CONTAINER_BG_SLATE_900_80_BORDER_BORDER_SLATE)}>
            {_.map(_.values(AppLanguage), (langCode) => (
              <Button variant={SOURCE_TEXT_UNSTYLED} key={langCode} onClick={() => setLang(langCode as Lang)} className={cn(RT_UI.BTN_LANG_ITEM_PX_2_SM_PX_2_5_TEXT, { "bg-rose-600 text-white shadow-sm shadow-rose-600/30": _.isEqual(currentLang, langCode), "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60": !_.isEqual(currentLang, langCode) })}>
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
        maxWidth={SOURCE_TEXT_MAX_W_MD}
        title={
          <div className={cn(RT_UI.FLEX_ITEMS_CENTER_GAP_2_UPPERCASE_TRACKING_WIDER_FONT_EXTRABOLD)}>
            <Trash2 className={cn(RT_SHARED.W_4_H_4_TEXT_ROSE_500)} />
            <span className={cn(RT_UI.UPPERCASE_FONT_EXTRABOLD_TRACKING_WIDER)}>{planningTexts.CONFIRM_ROOM_CLEANUP}</span>
          </div>
        }>
        <div className={cn(RT_UI.SPACE_Y_4_PT_1)}>
          <p className={cn(RT_UI.TEXT_SLATE_700_DARK_TEXT_SLATE_200_TEXT_SM_FONT)}>{planningTexts.CLEAR_ROOM_CONFIRM.replace(SecurityConstants.PLACEHOLDER_0, confirmAction?.name || REFACTOR_CONSTANTS.VD_EMPTY_STRING)}</p>
          <div className={cn(RT_UI.P_3_5_ROUNDED_2XL_BG_ROSE_500_10_BORDER)}>
            <AlertTriangle className={cn(RT_UI.W_4_H_4_SHRINK_0_TEXT_AMBER_500_MT)} />
            <span>{planningTexts.CLEAR_ROOM_RESOURCE_NOTICE}</span>
          </div>
          <div className={cn(RT_UI.FLEX_ITEMS_CENTER_JUSTIFY_END_GAP_3_PT_4_BORDER)}>
            <Button variant={REFACTOR_CONSTANTS.VARIANT_GHOST} disabled={isClearing || !_.isNull(clearingProvider)} onClick={() => setConfirmAction(null)} className={cn(RT_UI.PX_5_PY_2_5_TEXT_XS_FONT_BOLD_ROUNDED)}>
              {t.cancel || planningTexts.CANCEL_FALLBACK}
            </Button>
            <Button variant={REFACTOR_CONSTANTS.VARIANT_DANGER} isLoading={isClearing || !_.isNull(clearingProvider)} onClick={handleExecuteClearRooms} className={cn(RT_UI.PX_6_PY_2_5_TEXT_XS_FONT_BOLD_ROUNDED)}>
              {t.delete || planningTexts.DELETE_NOW_FALLBACK}
            </Button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
