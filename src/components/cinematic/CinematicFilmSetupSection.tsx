import { cn } from "../../lib/utils";
import { Clapperboard, Film, Globe, Layers3, Sparkles } from "lucide-react";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider, ProjectLanguage } from "../../types";
import { CINEMATIC_SETUP_TEXTS, UI_COMMON_TEXTS } from "../../constants/texts";
import ChatPlanningSettingsBlock from "../common/ChatPlanningSettingsBlock";
import { Lang } from "../../lib/lang";
import _ from "lodash";

interface Props {
  idea: string;
  setIdea: (value: string) => void;
  language: ProjectLanguage;
  setLanguage: (value: ProjectLanguage) => void;
  duration: string;
  setDuration: (value: string) => void;
  seriesMode: "single" | "series";
  setSeriesMode: (value: "single" | "series") => void;
  episodeCount: number;
  setEpisodeCount: (value: number) => void;
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
  seriesMode,
  setSeriesMode,
  episodeCount,
  setEpisodeCount,
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

      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3")}>
        <div className={cn("space-y-1.5 min-w-0")}>
          <span className={cn("text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider truncate")} title={texts.FORMAT_LABEL}>
            <Film className={cn("w-3 h-3 text-amber-400 shrink-0")} /> <span className={cn("truncate")}>{texts.FORMAT_LABEL}</span>
          </span>
          <div className={cn("relative flex items-center w-full h-10 bg-slate-955 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors")}>
            <select
              value={seriesMode}
              onChange={(event) => setSeriesMode(event.target.value as "single" | "series")}
              className={cn("w-full h-full bg-transparent px-3 text-xs text-slate-200 outline-none cursor-pointer truncate flex items-center")}>
              <option value="single">{texts.SINGLE_EPISODE}</option>
              <option value="series">{texts.SERIES_EPISODE}</option>
            </select>
          </div>
        </div>
        <div className={cn("space-y-1.5 min-w-0")}>
          <span className={cn("text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider truncate")} title={texts.EPISODES_LABEL}>
            <Layers3 className={cn("w-3 h-3 text-rose-400 shrink-0")} /> <span className={cn("truncate")}>{texts.EPISODES_LABEL}</span>
          </span>
          <input
            type="number"
            min={1}
            max={24}
            disabled={seriesMode === "single"}
            value={seriesMode === "single" ? 1 : episodeCount}
            onChange={(event) => setEpisodeCount(Math.max(2, Math.min(24, Number(event.target.value))))}
            className={cn(
              "w-full h-10 bg-slate-955 border border-slate-800 rounded-xl px-3 text-xs text-slate-200 disabled:text-slate-600 outline-none hover:border-slate-700 transition-colors",
            )}
          />
        </div>
        <div className={cn("space-y-1.5 min-w-0")}>
          <span className={cn("text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider truncate")} title={texts.LANGUAGE_LABEL}>
            <Globe className={cn("w-3 h-3 text-sky-400 shrink-0")} /> <span className={cn("truncate")}>{texts.LANGUAGE_LABEL}</span>
          </span>
          <div className={cn("relative flex items-center w-full h-10 bg-slate-955 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors")}>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as ProjectLanguage)}
              className={cn("w-full h-full bg-transparent px-3 text-xs text-slate-200 outline-none cursor-pointer truncate flex items-center")}>
              <option value={ProjectLanguage.VI}>Tiếng Việt</option>
              <option value={ProjectLanguage.EN}>English</option>
            </select>
          </div>
        </div>
        <div className={cn("space-y-1.5 min-w-0")}>
          <span className={cn("text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block truncate")} title={texts.DURATION_LABEL}>
            {texts.DURATION_LABEL}
          </span>
          <div className={cn("relative flex items-center w-full h-10 bg-slate-955 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors")}>
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className={cn("w-full h-full bg-transparent px-3 text-xs text-slate-200 outline-none cursor-pointer truncate flex items-center")}>
              <option value="1 minute">{texts.DURATIONS.ONE_MIN}</option>
              <option value="2 minutes">{texts.DURATIONS.TWO_MIN}</option>
              <option value="3 minutes">{texts.DURATIONS.THREE_MIN}</option>
              <option value="3-5 minutes">{texts.DURATIONS.THREE_FIVE_MIN}</option>
              <option value="5-10 minutes">{texts.DURATIONS.FIVE_TEN_MIN}</option>
              <option value="10-15 minutes">{texts.DURATIONS.TEN_FIFTEEN_MIN}</option>
            </select>
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
      />

      {seriesMode === "series" && (
        <div
          className={cn("rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2 min-w-0")}
          title={texts.SERIES_NOTICE(episodeCount)}>
          <Sparkles className={cn("w-4 h-4 text-amber-400 shrink-0")} />
          <span className={cn("truncate")}>{texts.SERIES_NOTICE(episodeCount)}</span>
        </div>
      )}
    </div>
  );
}
