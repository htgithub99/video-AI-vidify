import _ from "lodash";
import { Bot, ChevronDown, Cpu, Eye, Sparkles } from "lucide-react";
import { CHAT_PLANNING_STYLES } from "../../constants/chatPlanningStyles.js";
import { CINEMATIC_CHAT_MODEL_OPTIONS } from "../../constants/cinematicConstants";
import { SOURCE_TEMPLATE_SYMBOL_32, SOURCE_TEXT_FLEX_1_BG_TRANSPARENT_TEXT_SLATE, SOURCE_TEXT_HIDDEN, SOURCE_TEXT_RELATIVE_FLEX_ITEMS_CENTER_BG_SLATE_2, SOURCE_TEXT_VI, SOURCE_TEXT_VISIBLE } from "../../constants/sourceText";
import { CINEMATIC_SETUP_TEXTS } from "../../constants/texts";
import { Lang } from "../../lib/lang";
import { cn } from "../../lib/utils";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../types";
const CHROME_WINDOW_MODE = {
  HIDDEN: SOURCE_TEXT_HIDDEN,
  VISIBLE: SOURCE_TEXT_VISIBLE,
} as const;
const SELECT_BASE_CLASSNAME = SOURCE_TEXT_FLEX_1_BG_TRANSPARENT_TEXT_SLATE;
const FIELD_BASE_CLASSNAME = SOURCE_TEXT_RELATIVE_FLEX_ITEMS_CENTER_BG_SLATE_2;
const PlanningSelectField = ({ title, icon: Icon, iconClassName, value, onChange, disabled = false, fieldDisabled = false, children }: { title: string; icon: typeof Bot; iconClassName: string; value: string; onChange: React.ChangeEventHandler<HTMLSelectElement>; disabled?: boolean; fieldDisabled?: boolean; children: React.ReactNode }) => (
  <div className={cn(FIELD_BASE_CLASSNAME, fieldDisabled && CHAT_PLANNING_STYLES.DISABLED)} title={title}>
    <Icon className={iconClassName} />
    <select disabled={disabled} value={value} onChange={onChange} className={SELECT_BASE_CLASSNAME}>
      {children}
    </select>
    <ChevronDown className={CHAT_PLANNING_STYLES.CHEVRON} />
  </div>
);
interface PlanningTexts {
  readonly GEMINI_CHAT_OPTION: string;
  readonly GROK_CHAT_OPTION: string;
  readonly CHATGPT_UI_OPTION: string;
  readonly PLANNING_API_ONLY: string;
  readonly PLANNING_HYBRID: string;
  readonly PLANNING_CHROME_HIDDEN: string;
  readonly PLANNING_CHROME_VISIBLE: string;
}
interface ChatPlanningSettingsBlockProps {
  provider: AiPlanningFallbackProvider;
  model: AiPlanningChatModel;
  executionMode: AiPlanningExecutionMode;
  chromeHeadless: boolean;
  onProviderChange: (provider: AiPlanningFallbackProvider) => void;
  onModelChange: (model: AiPlanningChatModel) => void;
  onExecutionModeChange: (mode: AiPlanningExecutionMode) => void;
  onChromeHeadlessChange: (headless: boolean) => void;
  currentLang?: Lang;
  title?: string;
  note?: string;
  allowHybrid?: boolean;
  extraControl?: React.ReactNode;
}
const resolveProviderName = (provider: AiPlanningFallbackProvider, texts: PlanningTexts): string => {
  if (_.isEqual(provider, AiPlanningFallbackProvider.GeminiChat)) return texts.GEMINI_CHAT_OPTION;
  if (_.isEqual(provider, AiPlanningFallbackProvider.GrokChat)) return texts.GROK_CHAT_OPTION;
  return texts.CHATGPT_UI_OPTION;
};
const resolveBadgeSummary = (isApiOnly: boolean, provider: AiPlanningFallbackProvider, chromeHeadless: boolean, texts: PlanningTexts): string => {
  if (isApiOnly) return texts.PLANNING_API_ONLY;
  const name = resolveProviderName(provider, texts);
  const modeText = chromeHeadless ? texts.PLANNING_CHROME_HIDDEN : texts.PLANNING_CHROME_VISIBLE;
  return SOURCE_TEMPLATE_SYMBOL_32(`${name}`, `${modeText}`);
};
export default function ChatPlanningSettingsBlock({ provider, model, executionMode, chromeHeadless, onProviderChange, onModelChange, onExecutionModeChange, onChromeHeadlessChange, currentLang = SOURCE_TEXT_VI, title, note, allowHybrid = true, extraControl }: ChatPlanningSettingsBlockProps) {
  const texts = CINEMATIC_SETUP_TEXTS[currentLang] || CINEMATIC_SETUP_TEXTS.vi;
  const isApiOnly = _.isEqual(executionMode, AiPlanningExecutionMode.ApiOnly);
  const resolvedProvider = _.isEqual(provider, AiPlanningFallbackProvider.Disabled) ? AiPlanningFallbackProvider.GeminiChat : provider;
  const availableModels = CINEMATIC_CHAT_MODEL_OPTIONS[resolvedProvider] || [];
  const sourceValue = _.isEqual(executionMode, AiPlanningExecutionMode.RoomOnly) ? resolvedProvider : executionMode;
  const handleSourceChange = (value: string) => {
    if (_.isEqual(value, AiPlanningExecutionMode.Hybrid)) {
      onProviderChange(AiPlanningFallbackProvider.GeminiChat);
      onExecutionModeChange(AiPlanningExecutionMode.Hybrid);
      return;
    }
    if (_.isEqual(value, AiPlanningExecutionMode.ApiOnly)) {
      onExecutionModeChange(AiPlanningExecutionMode.ApiOnly);
      return;
    }
    onProviderChange(value as AiPlanningFallbackProvider);
    onExecutionModeChange(AiPlanningExecutionMode.RoomOnly);
  };
  const handleChromeModeChange = (modeValue: string) => {
    onChromeHeadlessChange(_.isEqual(modeValue, CHROME_WINDOW_MODE.HIDDEN));
  };
  const badgeSummary = resolveBadgeSummary(isApiOnly, resolvedProvider, chromeHeadless, texts);
  return (
    <div className={CHAT_PLANNING_STYLES.WRAPPER}>
      <div className={CHAT_PLANNING_STYLES.HEADER}>
        <div className={CHAT_PLANNING_STYLES.HEADER_INFO}>
          <span className={CHAT_PLANNING_STYLES.HEADER_ICON_FRAME}>
            <Sparkles className={CHAT_PLANNING_STYLES.HEADER_ICON} />
          </span>
          <div className={CHAT_PLANNING_STYLES.MIN_WIDTH}>
            <h3 className={CHAT_PLANNING_STYLES.TITLE} title={title || texts.CHAT_CONFIG_TITLE}>
              {title || texts.CHAT_CONFIG_TITLE}
            </h3>
            <p className={CHAT_PLANNING_STYLES.NOTE} title={note || texts.CHAT_CONFIG_NOTE}>
              {note || texts.CHAT_CONFIG_NOTE}
            </p>
          </div>
        </div>
        <div className={CHAT_PLANNING_STYLES.BADGE}>
          <span className={cn(CHAT_PLANNING_STYLES.BADGE_DOT, { [CHAT_PLANNING_STYLES.BADGE_DOT_API]: isApiOnly, [CHAT_PLANNING_STYLES.BADGE_DOT_ROOM]: !isApiOnly })} />
          <span className={CHAT_PLANNING_STYLES.BADGE_TEXT}>{badgeSummary}</span>
        </div>
      </div>
      <div className={cn(CHAT_PLANNING_STYLES.GRID, extraControl ? CHAT_PLANNING_STYLES.GRID_WITH_EXTRA : CHAT_PLANNING_STYLES.GRID_DEFAULT, CHAT_PLANNING_STYLES.GAP)}>
        <PlanningSelectField title={texts.PLANNING_AI_LABEL} icon={Bot} iconClassName={CHAT_PLANNING_STYLES.PROVIDER_ICON} value={sourceValue} onChange={(e) => handleSourceChange(e.target.value)}>
          <option value={AiPlanningFallbackProvider.GeminiChat} className={CHAT_PLANNING_STYLES.OPTION}>
            {texts.GEMINI_CHAT_OPTION}
          </option>
          <option value={AiPlanningFallbackProvider.GrokChat} className={CHAT_PLANNING_STYLES.OPTION}>
            {texts.GROK_CHAT_OPTION}
          </option>
          <option value={AiPlanningFallbackProvider.ChatGptUi} className={CHAT_PLANNING_STYLES.OPTION}>
            {texts.CHATGPT_UI_OPTION}
          </option>
          {allowHybrid && (
            <option value={AiPlanningExecutionMode.Hybrid} className={CHAT_PLANNING_STYLES.OPTION}>
              {texts.PLANNING_HYBRID}
            </option>
          )}
          <option value={AiPlanningExecutionMode.ApiOnly} className={CHAT_PLANNING_STYLES.OPTION}>
            {texts.PLANNING_API_ONLY}
          </option>
        </PlanningSelectField>
        <PlanningSelectField title={texts.PLANNING_MODEL_LABEL} icon={Cpu} iconClassName={CHAT_PLANNING_STYLES.MODEL_ICON} value={model} onChange={(e) => onModelChange(e.target.value as AiPlanningChatModel)} disabled={isApiOnly || _.isEmpty(availableModels)} fieldDisabled={isApiOnly}>
          {_.map(availableModels, (item) => (
            <option key={item.value} value={item.value} className={CHAT_PLANNING_STYLES.OPTION}>
              {item.label}
            </option>
          ))}
        </PlanningSelectField>
        <PlanningSelectField title={texts.PLANNING_CHROME_LABEL} icon={Eye} iconClassName={CHAT_PLANNING_STYLES.CHROME_ICON} value={chromeHeadless ? CHROME_WINDOW_MODE.HIDDEN : CHROME_WINDOW_MODE.VISIBLE} onChange={(e) => handleChromeModeChange(e.target.value)} disabled={isApiOnly} fieldDisabled={isApiOnly}>
          <option value={CHROME_WINDOW_MODE.HIDDEN} className={CHAT_PLANNING_STYLES.OPTION}>
            {texts.PLANNING_CHROME_HIDDEN}
          </option>
          <option value={CHROME_WINDOW_MODE.VISIBLE} className={CHAT_PLANNING_STYLES.OPTION}>
            {texts.PLANNING_CHROME_VISIBLE}
          </option>
        </PlanningSelectField>
        {extraControl && <div className={cn(FIELD_BASE_CLASSNAME, CHAT_PLANNING_STYLES.EXTRA_FIELD)}>{extraControl}</div>}
      </div>
    </div>
  );
}
