import { StudioCard, StudioSelect } from "../ui/Studio.js";
import { CHAT_PLANNING_RUNTIME as C } from "../../constants/chatPlanningRuntime.js";
import * as ST from "../../constants/sourceText.js";
import _ from "lodash";
import { useEffect } from "react";
import { Bot, ChevronDown, Cpu, Eye, Sparkles } from "lucide-react";
import { CHAT_PLANNING_STYLES } from "../../constants/chatPlanningStyles.js";
import { CINEMATIC_CHAT_MODEL_OPTIONS } from "../../constants/cinematicConstants";
import { CLAUDE_CHAT_MODELS, CLAUDE_CHAT_BASE_MODEL_OPTIONS, CLAUDE_MODEL_ENCODING, CLAUDE_EFFORT_OPTIONS, encodeClaudeChatModel, parseClaudeChatModel, type ClaudeEffort } from "../../constants/claudeChatModels";
import { GEMINI_CHAT_BASE_MODEL_OPTIONS, GEMINI_THINKING_LEVEL_OPTIONS, encodeGeminiChatModel, parseGeminiChatModel, type GeminiThinkingLevel } from "../../constants/geminiChatModels.js";
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
    <StudioSelect aria-label={title} disabled={disabled} value={value} onChange={onChange} className={SELECT_BASE_CLASSNAME}>
      {children}
    </StudioSelect>
    <ChevronDown className={CHAT_PLANNING_STYLES.CHEVRON} />
  </div>
);
const PlanningLevelField = ({ title, defaultLabel, value, onChange, disabled, options, currentLang }: { title: string; defaultLabel: string; value: string; onChange: (value: string) => void; disabled: boolean; options: readonly { value: string; label: string; labelEn: string }[]; currentLang: Lang }) => (
  <PlanningSelectField title={title} icon={Sparkles} iconClassName={CHAT_PLANNING_STYLES.MODEL_ICON} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} fieldDisabled={disabled}>
    <option value={C.EMPTY} className={CHAT_PLANNING_STYLES.OPTION}>
      {defaultLabel}
    </option>
    {options.map((option) => (
      <option key={option.value} value={option.value} className={CHAT_PLANNING_STYLES.OPTION}>
        {currentLang === ST.SOURCE_TEXT_EN ? option.labelEn : option.label}
      </option>
    ))}
  </PlanningSelectField>
);
interface PlanningTexts { readonly GEMINI_CHAT_OPTION: string; readonly GROK_CHAT_OPTION: string; readonly CHATGPT_UI_OPTION: string; readonly CLAUDE_CHAT_OPTION: string; readonly DEEPSEEK_CHAT_OPTION: string; readonly PLANNING_API_ONLY: string; readonly PLANNING_HYBRID: string; readonly PLANNING_CHROME_HIDDEN: string; readonly PLANNING_CHROME_VISIBLE: string; }
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
  if (_.isEqual(provider, AiPlanningFallbackProvider.ClaudeChat)) return texts.CLAUDE_CHAT_OPTION;
  if (_.isEqual(provider, AiPlanningFallbackProvider.DeepSeekChat)) return texts.DEEPSEEK_CHAT_OPTION;
  return texts.CHATGPT_UI_OPTION;
};
const resolveBadgeSummary = (isApiOnly: boolean, provider: AiPlanningFallbackProvider, chromeHeadless: boolean, texts: PlanningTexts): string => {
  if (isApiOnly) return texts.PLANNING_API_ONLY;
  const name = resolveProviderName(provider, texts);
  const modeText = chromeHeadless ? texts.PLANNING_CHROME_HIDDEN : texts.PLANNING_CHROME_VISIBLE;
  return SOURCE_TEMPLATE_SYMBOL_32(name, modeText);
};
export default function ChatPlanningSettingsBlock({ provider, model, executionMode, chromeHeadless, onProviderChange, onModelChange, onExecutionModeChange, onChromeHeadlessChange, currentLang = SOURCE_TEXT_VI, title, note, allowHybrid = true, extraControl }: ChatPlanningSettingsBlockProps) {
  const texts = CINEMATIC_SETUP_TEXTS[currentLang] || CINEMATIC_SETUP_TEXTS.vi;
  const isApiOnly = _.isEqual(executionMode, AiPlanningExecutionMode.ApiOnly);
  const resolvedProvider = _.isEqual(provider, AiPlanningFallbackProvider.Disabled) ? AiPlanningFallbackProvider.GeminiChat : provider;
  const availableModels = CINEMATIC_CHAT_MODEL_OPTIONS[resolvedProvider] || [];
  const isClaude = resolvedProvider === AiPlanningFallbackProvider.ClaudeChat;
  const isGemini = resolvedProvider === AiPlanningFallbackProvider.GeminiChat;
  const claudeSelection = isClaude ? parseClaudeChatModel(model) : undefined;
  const geminiSelection = isGemini ? parseGeminiChatModel(model) : undefined;
  const modelOptions = isClaude ? CLAUDE_CHAT_BASE_MODEL_OPTIONS : isGemini ? GEMINI_CHAT_BASE_MODEL_OPTIONS : availableModels;
  const hasClaudeEffort = isClaude && Boolean(claudeSelection?.spec?.efforts.length);
  const hasGeminiThinking = isGemini && !!geminiSelection && !geminiSelection.legacy;
  useEffect(() => {
    if (!isApiOnly && availableModels.length && !availableModels.some((option) => option.value === model)) onModelChange(availableModels[0].value);
  }, [isApiOnly, availableModels, model, onModelChange]);
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
    <StudioCard className={CHAT_PLANNING_STYLES.WRAPPER}>
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
      <div className={cn(CHAT_PLANNING_STYLES.GRID, extraControl || hasClaudeEffort || hasGeminiThinking ? CHAT_PLANNING_STYLES.GRID_WITH_EXTRA : CHAT_PLANNING_STYLES.GRID_DEFAULT, CHAT_PLANNING_STYLES.GAP)}>
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
          <option value={AiPlanningFallbackProvider.ClaudeChat} className={CHAT_PLANNING_STYLES.OPTION}>
            {texts.CLAUDE_CHAT_OPTION}
          </option>
          <option value={AiPlanningFallbackProvider.DeepSeekChat} className={CHAT_PLANNING_STYLES.OPTION}>
            {texts.DEEPSEEK_CHAT_OPTION}
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
        <PlanningSelectField
          title={texts.PLANNING_MODEL_LABEL}
          icon={Cpu}
          iconClassName={CHAT_PLANNING_STYLES.MODEL_ICON}
          value={claudeSelection?.model || geminiSelection?.model || model}
          onChange={(e) => onModelChange(isClaude ? encodeClaudeChatModel(e.target.value as AiPlanningChatModel, claudeSelection?.effort) : isGemini ? encodeGeminiChatModel(e.target.value as AiPlanningChatModel, geminiSelection?.level) : (e.target.value as AiPlanningChatModel))}
          disabled={isApiOnly || _.isEmpty(availableModels)}
          fieldDisabled={isApiOnly}>
          {_.map(modelOptions, (item) => (
            <option key={item.value} value={item.value} className={CHAT_PLANNING_STYLES.OPTION}>
              {item.label}
              {isClaude && CLAUDE_CHAT_MODELS.find((entry) => entry.value === item.value && CLAUDE_MODEL_ENCODING.PAID_MODEL_PATTERN.test(entry.label)) ? texts.CLAUDE_PAID_MODEL_SUFFIX : C.EMPTY}
            </option>
          ))}
        </PlanningSelectField>
        {hasGeminiThinking && (
          <PlanningLevelField title={texts.GEMINI_THINKING_LEVEL_LABEL} defaultLabel={texts.GEMINI_THINKING_LEVEL_DEFAULT} value={geminiSelection.level || C.EMPTY} onChange={(value) => onModelChange(encodeGeminiChatModel(geminiSelection.model, value ? (value as GeminiThinkingLevel) : undefined))} disabled={isApiOnly} options={GEMINI_THINKING_LEVEL_OPTIONS} currentLang={currentLang} />
        )}
        {hasClaudeEffort && (
          <PlanningLevelField
            title={texts.CLAUDE_EFFORT_LABEL}
            defaultLabel={texts.CLAUDE_EFFORT_DEFAULT}
            value={claudeSelection?.effort || C.EMPTY}
            onChange={(value) => onModelChange(encodeClaudeChatModel(claudeSelection!.model, value ? (value as ClaudeEffort) : undefined))}
            disabled={isApiOnly}
            options={CLAUDE_EFFORT_OPTIONS.filter((option) => claudeSelection?.spec?.efforts.includes(option.value))}
            currentLang={currentLang}
          />
        )}
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
      {!isApiOnly && resolvedProvider === AiPlanningFallbackProvider.ClaudeChat && <p className={CHAT_PLANNING_STYLES.NOTE}>{texts.CLAUDE_CHAT_NOTE}</p>}
      {!isApiOnly && resolvedProvider === AiPlanningFallbackProvider.DeepSeekChat && <p className={CHAT_PLANNING_STYLES.NOTE}>{texts.DEEPSEEK_CHAT_NOTE}</p>}
    </StudioCard>
  );
}
