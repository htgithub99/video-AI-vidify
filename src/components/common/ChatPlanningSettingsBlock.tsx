import _ from "lodash";
import { Bot, ChevronDown, Cpu, Eye, Sparkles } from "lucide-react";
import { CINEMATIC_CHAT_MODEL_OPTIONS } from "../../constants/cinematicConstants";
import { CINEMATIC_SETUP_TEXTS } from "../../constants/texts";
import { Lang } from "../../lib/lang";
import { cn } from "../../lib/utils";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../types";

const CHROME_WINDOW_MODE = {
  HIDDEN: "hidden",
  VISIBLE: "visible",
} as const;

const SELECT_BASE_CLASSNAME =
  "flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5 truncate disabled:text-slate-500 disabled:cursor-not-allowed";

const FIELD_BASE_CLASSNAME =
  "relative flex items-center bg-slate-955/90 border border-slate-800/90 rounded-xl px-3 h-10 transition-all hover:border-violet-500/50 focus-within:border-violet-500/80 focus-within:ring-1 focus-within:ring-violet-500/20 shadow-sm";

interface PlanningTexts {
  readonly GEMINI_CHAT_OPTION: string;
  readonly GROK_CHAT_OPTION: string;
  readonly CHATGPT_UI_OPTION: string;
  readonly DISABLED_CHAT_OPTION: string;
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
}

const resolveProviderName = (provider: AiPlanningFallbackProvider, texts: PlanningTexts): string => {
  if (_.isEqual(provider, AiPlanningFallbackProvider.GeminiChat)) return texts.GEMINI_CHAT_OPTION;
  if (_.isEqual(provider, AiPlanningFallbackProvider.GrokChat)) return texts.GROK_CHAT_OPTION;
  return texts.CHATGPT_UI_OPTION;
};

const resolveBadgeSummary = (
  isApiOnly: boolean,
  provider: AiPlanningFallbackProvider,
  chromeHeadless: boolean,
  texts: PlanningTexts
): string => {
  if (isApiOnly) return texts.DISABLED_CHAT_OPTION;
  const name = resolveProviderName(provider, texts);
  const modeText = chromeHeadless ? texts.PLANNING_CHROME_HIDDEN : texts.PLANNING_CHROME_VISIBLE;
  return `${name} • ${modeText}`;
};

export default function ChatPlanningSettingsBlock({
  provider,
  model,
  executionMode,
  chromeHeadless,
  onProviderChange,
  onModelChange,
  onExecutionModeChange,
  onChromeHeadlessChange,
  currentLang = "vi",
  title,
  note,
}: ChatPlanningSettingsBlockProps) {
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
    <div className={cn("bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-md w-full text-left")}>
      <div className={cn("flex items-center justify-between gap-3")}>
        <div className={cn("flex items-center gap-2.5 min-w-0")}>
          <span className={cn("w-6 h-6 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-400 flex items-center justify-center font-mono font-extrabold text-xs shadow-sm shadow-violet-500/20 shrink-0")}>
            <Sparkles className={cn("w-3.5 h-3.5 text-violet-400")} />
          </span>
          <div className={cn("min-w-0")}>
            <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")} title={title || texts.CHAT_CONFIG_TITLE}>
              {title || texts.CHAT_CONFIG_TITLE}
            </h3>
            <p className={cn("text-[11px] text-slate-400 leading-relaxed mt-0.5")} title={note || texts.CHAT_CONFIG_NOTE}>
              {note || texts.CHAT_CONFIG_NOTE}
            </p>
          </div>
        </div>

        <div className={cn("header-badge flex items-center gap-2 text-[11px] font-mono font-bold text-slate-300 bg-slate-955/80 border border-slate-800/80 px-3 py-1 rounded-full shrink-0")}>
          <span className={cn("w-2 h-2 rounded-full", isApiOnly ? "bg-slate-600" : "bg-violet-400 animate-pulse")} />
          <span className={cn("font-semibold text-slate-300")}>{badgeSummary}</span>
        </div>
      </div>

      <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-3")}>
        <div className={cn(FIELD_BASE_CLASSNAME)} title={texts.PLANNING_AI_LABEL}>
          <Bot className={cn("w-3.5 h-3.5 text-violet-400 mr-2 shrink-0")} />
          <select value={sourceValue} onChange={(e) => handleSourceChange(e.target.value)} className={cn(SELECT_BASE_CLASSNAME)}>
            <option value={AiPlanningFallbackProvider.GeminiChat} className={cn("bg-slate-955 text-slate-200")}>{texts.GEMINI_CHAT_OPTION}</option>
            <option value={AiPlanningFallbackProvider.GrokChat} className={cn("bg-slate-955 text-slate-200")}>{texts.GROK_CHAT_OPTION}</option>
            <option value={AiPlanningFallbackProvider.ChatGptUi} className={cn("bg-slate-955 text-slate-200")}>{texts.CHATGPT_UI_OPTION}</option>
            <option value={AiPlanningExecutionMode.Hybrid} className={cn("bg-slate-955 text-slate-200")}>{texts.PLANNING_HYBRID}</option>
            <option value={AiPlanningExecutionMode.ApiOnly} className={cn("bg-slate-955 text-slate-400")}>{texts.DISABLED_CHAT_OPTION}</option>
          </select>
          <ChevronDown className={cn("pointer-events-none absolute right-3 text-slate-500 w-4 h-4")} />
        </div>

        <div className={cn(FIELD_BASE_CLASSNAME, isApiOnly && "opacity-40")} title={texts.PLANNING_MODEL_LABEL}>
          <Cpu className={cn("w-3.5 h-3.5 text-purple-400 mr-2 shrink-0")} />
          <select
            disabled={isApiOnly || _.isEmpty(availableModels)}
            value={model}
            onChange={(e) => onModelChange(e.target.value as AiPlanningChatModel)}
            className={cn(SELECT_BASE_CLASSNAME)}>
            {_.map(availableModels, (item) => (
              <option key={item.value} value={item.value} className={cn("bg-slate-955 text-slate-200")}>
                {item.label}
              </option>
            ))}
          </select>
          <ChevronDown className={cn("pointer-events-none absolute right-3 text-slate-500 w-4 h-4")} />
        </div>

        <div className={cn(FIELD_BASE_CLASSNAME, isApiOnly && "opacity-40")} title={texts.PLANNING_CHROME_LABEL}>
          <Eye className={cn("w-3.5 h-3.5 text-sky-400 mr-2 shrink-0")} />
          <select
            disabled={isApiOnly}
            value={chromeHeadless ? CHROME_WINDOW_MODE.HIDDEN : CHROME_WINDOW_MODE.VISIBLE}
            onChange={(e) => handleChromeModeChange(e.target.value)}
            className={cn(SELECT_BASE_CLASSNAME)}>
            <option value={CHROME_WINDOW_MODE.HIDDEN} className={cn("bg-slate-955 text-slate-200")}>{texts.PLANNING_CHROME_HIDDEN}</option>
            <option value={CHROME_WINDOW_MODE.VISIBLE} className={cn("bg-slate-955 text-slate-200")}>{texts.PLANNING_CHROME_VISIBLE}</option>
          </select>
          <ChevronDown className={cn("pointer-events-none absolute right-3 text-slate-500 w-4 h-4")} />
        </div>
      </div>
    </div>
  );
}


