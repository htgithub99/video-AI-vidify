import { cn } from "../../lib/utils";
import { ChevronDown, Clapperboard, Clock, Globe } from "lucide-react";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider, ProjectLanguage } from "../../types";
import { CINEMATIC_SETUP_TEXTS, UI_COMMON_TEXTS } from "../../constants/texts";
import ChatPlanningSettingsBlock from "../common/ChatPlanningSettingsBlock";
import { Lang } from "../../lib/lang";
import _ from "lodash";

const SELECT_BASE_CLASSNAME =
  "flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5 truncate disabled:text-slate-500 disabled:cursor-not-allowed";

const FIELD_BASE_CLASSNAME =
  "relative flex items-center bg-slate-955/90 border border-slate-800/90 rounded-xl px-3 h-10 transition-all hover:border-violet-500/50 focus-within:border-violet-500/80 focus-within:ring-1 focus-within:ring-violet-500/20 shadow-sm";

interface Props {
  idea: string;
  setIdea: (value: string) => void;
  language: ProjectLanguage;
  setLanguage: (value: ProjectLanguage) => void;
  duration: string;
  setDuration: (value: string) => void;
  planningFallbackProvider: AiPlanningFallbackProvider;
  setPlanningFallbackProvider: (value: AiPlanningFallbackProvider) => void;
  planningChatModel: AiPlanningChatModel;
  setPlanningChatModel: (value: AiPlanningChatModel) => void;
  planningExecutionMode: AiPlanningExecutionMode;
  setPlanningExecutionMode: (value: AiPlanningExecutionMode) => void;
  planningChromeHeadless: boolean;
  setPlanningChromeHeadless: (value: boolean) => void;
  currentLang?: Lang;
}

export default function CinematicFilmSetupSection({
  idea,
  setIdea,
  language,
  setLanguage,
  duration,
  setDuration,
  planningFallbackProvider,
  setPlanningFallbackProvider,
  planningChatModel,
  setPlanningChatModel,
  planningExecutionMode,
  setPlanningExecutionMode,
  planningChromeHeadless,
  setPlanningChromeHeadless,
  currentLang = "vi",
}: Props) {
  const texts = _.get(CINEMATIC_SETUP_TEXTS, currentLang, CINEMATIC_SETUP_TEXTS.vi);
  const common = _.get(UI_COMMON_TEXTS, currentLang, UI_COMMON_TEXTS.vi);

  return (
    <div className={cn("glass-card rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl text-left border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden")}>
      <div className={cn("flex items-center gap-3 min-w-0 relative z-10")}>
        <div className={cn("w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 p-0.5 shadow-md shadow-amber-500/20 shrink-0")}>
          <div className={cn("w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center")}>
            <Clapperboard className={cn("w-5 h-5 text-amber-400")} />
          </div>
        </div>
        <div className={cn("min-w-0 flex-1")}>
          <h2 className={cn("text-sm font-extrabold text-slate-100 flex items-center gap-2 truncate")} title={texts.TITLE}>
            <span className={cn("truncate")}>{texts.TITLE}</span>
            <span className={cn("px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-black tracking-normal shrink-0")}>
              {common.CINEMATIC_ENGINE}
            </span>
          </h2>
          <p className={cn("text-[11px] text-slate-400 mt-0.5 truncate")} title={texts.SUBTITLE}>
            {texts.SUBTITLE}
          </p>
        </div>
      </div>

      <div className={cn("relative z-10")}>
        <textarea
          rows={4}
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          placeholder={texts.PLACEHOLDER}
          className={cn(
            "w-full min-h-[120px] sm:min-h-[140px] bg-slate-955/90 text-slate-100 p-3.5 rounded-2xl text-xs leading-relaxed outline-none resize-y placeholder:text-slate-500 transition-all shadow-inner font-sans",
          )}
        />
      </div>

      <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3")}>
        <div className={cn("space-y-1.5 min-w-0")}>
          <span className={cn("text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block truncate")} title={texts.LANGUAGE_LABEL}>
            {texts.LANGUAGE_LABEL}
          </span>
          <div className={cn(FIELD_BASE_CLASSNAME)} title={texts.LANGUAGE_LABEL}>
            <Globe className={cn("w-3.5 h-3.5 text-sky-400 mr-2 shrink-0")} />
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as ProjectLanguage)}
              className={cn(SELECT_BASE_CLASSNAME)}>
              <option value={ProjectLanguage.VI} className={cn("bg-slate-955 text-slate-200")}>Tiếng Việt</option>
              <option value={ProjectLanguage.EN} className={cn("bg-slate-955 text-slate-200")}>English</option>
            </select>
            <ChevronDown className={cn("pointer-events-none absolute right-3 text-slate-500 w-4 h-4")} />
          </div>
        </div>

        <div className={cn("space-y-1.5 min-w-0")}>
          <span className={cn("text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block truncate")} title={texts.DURATION_LABEL}>
            {texts.DURATION_LABEL}
          </span>
          <div className={cn(FIELD_BASE_CLASSNAME)} title={texts.DURATION_LABEL}>
            <Clock className={cn("w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0")} />
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className={cn(SELECT_BASE_CLASSNAME)}>
              <option value="1 minute" className={cn("bg-slate-955 text-slate-200")}>{texts.DURATIONS.ONE_MIN}</option>
              <option value="2 minutes" className={cn("bg-slate-955 text-slate-200")}>{texts.DURATIONS.TWO_MIN}</option>
              <option value="3 minutes" className={cn("bg-slate-955 text-slate-200")}>{texts.DURATIONS.THREE_MIN}</option>
              <option value="5 minutes" className={cn("bg-slate-955 text-slate-200")}>{currentLang === "vi" ? "5 phút" : "5 minutes"}</option>
              <option value="8 minutes" className={cn("bg-slate-955 text-slate-200")}>{currentLang === "vi" ? "8 phút" : "8 minutes"}</option>
              <option value="10 minutes" className={cn("bg-slate-955 text-slate-200")}>{currentLang === "vi" ? "10 phút" : "10 minutes"}</option>
              <option value="15 minutes" className={cn("bg-slate-955 text-slate-200")}>{currentLang === "vi" ? "15 phút" : "15 minutes"}</option>
            </select>
            <ChevronDown className={cn("pointer-events-none absolute right-3 text-slate-500 w-4 h-4")} />
          </div>
        </div>
      </div>

      <ChatPlanningSettingsBlock
        provider={planningFallbackProvider}
        model={planningChatModel}
        onProviderChange={setPlanningFallbackProvider}
        onModelChange={setPlanningChatModel}
        executionMode={planningExecutionMode}
        onExecutionModeChange={setPlanningExecutionMode}
        chromeHeadless={planningChromeHeadless}
        onChromeHeadlessChange={setPlanningChromeHeadless}
        currentLang={currentLang}
        allowHybrid={false}
        title={currentLang === "vi" ? "AI viết và đạo diễn" : "AI writer and director"}
        note={
          _.isEqual(planningExecutionMode, AiPlanningExecutionMode.ApiOnly)
            ? texts.PLANNING_API_NOTE
            : texts.PLANNING_ROOM_NOTE
        }
      />
    </div>
  );
}
