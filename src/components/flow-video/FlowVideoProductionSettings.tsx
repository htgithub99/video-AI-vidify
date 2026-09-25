import { ChevronDown, Film, Globe, Layout, Sparkles, WandSparkles } from "lucide-react";
import { FLOW_DIRECT_VIDEO_CONFIG, FLOW_VIDEO_TEXTS } from "../../constants";
import { FLOW_VIDEO_MODEL_OPTIONS } from "../../constants/flowVideoSettings";
import { cn } from "../../lib/utils";
import { getVideoModelCapabilities, normalizeVideoModelSettings } from "../../services/videoModelCapabilityService";
import { AspectRatio, ImageGeneratorEngine } from "../../types";

export interface FlowVideoProductionConfig {
  engine: ImageGeneratorEngine;
  duration: string;
  resolution: string;
  aspectRatio: AspectRatio;
  chromeHeadless: boolean;
}

interface Props {
  config: FlowVideoProductionConfig;
  onChange: (config: FlowVideoProductionConfig) => void;
  disabled: boolean;
  texts: typeof FLOW_VIDEO_TEXTS.vi | typeof FLOW_VIDEO_TEXTS.en;
  hasCharacterImages: boolean;
}

const FIELD_CLASS = "relative flex items-center h-10 px-2.5 rounded-lg border border-slate-800 bg-slate-955/90 focus-within:border-purple-500/70";
const SELECT_CLASS = "w-full min-w-0 bg-transparent text-xs font-semibold text-slate-200 outline-none appearance-none pr-5 disabled:opacity-50";

export default function FlowVideoProductionSettings({ config, onChange, disabled, texts, hasCharacterImages }: Props) {
  const capabilities = getVideoModelCapabilities(config.engine);
  const updateModel = (engine: ImageGeneratorEngine) => {
    const normalized = normalizeVideoModelSettings(engine, config);
    onChange({ ...config, engine, duration: normalized.duration, resolution: normalized.resolution, aspectRatio: normalized.aspectRatio });
  };

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3")}>
      <label className={cn("space-y-1 min-w-0")}>
        <span className={cn("text-[10px] font-bold text-slate-400")}>{texts.VIDEO_WORKFLOW}</span>
        <span className={cn(FIELD_CLASS, "gap-2 text-xs font-semibold text-slate-200")}>
          <WandSparkles className={cn("w-4 h-4 shrink-0 text-purple-400")} />
          <span className={cn("truncate")}>{texts.VIDEO_WORKFLOW_VALUE(FLOW_DIRECT_VIDEO_CONFIG.PROMPTS_PER_BATCH)}</span>
        </span>
      </label>
      <label className={cn("space-y-1 min-w-0")}>
        <span className={cn("text-[10px] font-bold text-slate-400")}>{texts.VIDEO_MODEL}</span>
        <span className={cn(FIELD_CLASS)}>
          <Sparkles className={cn("w-4 h-4 shrink-0 mr-2 text-purple-400")} />
          <select value={config.engine} disabled={disabled} onChange={(event) => updateModel(event.target.value as ImageGeneratorEngine)} className={cn(SELECT_CLASS)}>
            {FLOW_VIDEO_MODEL_OPTIONS.map((option) => <option key={option.value} value={option.value} disabled={hasCharacterImages && !getVideoModelCapabilities(option.value).supportsReferences}>{option.label}</option>)}
          </select>
          <ChevronDown className={cn("w-3.5 h-3.5 absolute right-2 pointer-events-none text-slate-500")} />
        </span>
      </label>
      <label className={cn("space-y-1 min-w-0")}>
        <span className={cn("text-[10px] font-bold text-slate-400")}>{texts.VIDEO_BROWSER}</span>
        <span className={cn(FIELD_CLASS)}>
          <Globe className={cn("w-4 h-4 shrink-0 mr-2 text-purple-400")} />
          <select value={String(config.chromeHeadless)} disabled={disabled} onChange={(event) => onChange({ ...config, chromeHeadless: event.target.value === String(true) })} className={cn(SELECT_CLASS)}>
            <option value={String(false)}>{texts.VIDEO_BROWSER_VISIBLE}</option>
            <option value={String(true)}>{texts.VIDEO_BROWSER_HIDDEN}</option>
          </select>
          <ChevronDown className={cn("w-3.5 h-3.5 absolute right-2 pointer-events-none text-slate-500")} />
        </span>
      </label>
      <label className={cn("space-y-1 min-w-0")}>
        <span className={cn("text-[10px] font-bold text-slate-400")}>{texts.VIDEO_DURATION}</span>
        <span className={cn(FIELD_CLASS)}>
          <Film className={cn("w-4 h-4 shrink-0 mr-2 text-purple-400")} />
          <select value={config.duration} disabled={disabled} onChange={(event) => onChange({ ...config, duration: event.target.value })} className={cn(SELECT_CLASS)}>
            {capabilities.durations.map((duration) => <option key={duration} value={duration}>{duration}</option>)}
          </select>
          <ChevronDown className={cn("w-3.5 h-3.5 absolute right-2 pointer-events-none text-slate-500")} />
        </span>
      </label>
      <label className={cn("space-y-1 min-w-0")}>
        <span className={cn("text-[10px] font-bold text-slate-400")}>{texts.VIDEO_RESOLUTION}</span>
        <span className={cn(FIELD_CLASS)}>
          <Sparkles className={cn("w-4 h-4 shrink-0 mr-2 text-purple-400")} />
          <select value={config.resolution} disabled={disabled} onChange={(event) => onChange({ ...config, resolution: event.target.value })} className={cn(SELECT_CLASS)}>
            {capabilities.resolutions.map((resolution) => <option key={resolution} value={resolution}>{resolution}</option>)}
          </select>
          <ChevronDown className={cn("w-3.5 h-3.5 absolute right-2 pointer-events-none text-slate-500")} />
        </span>
      </label>
      <label className={cn("space-y-1 min-w-0")}>
        <span className={cn("text-[10px] font-bold text-slate-400")}>{texts.VIDEO_ASPECT_RATIO}</span>
        <span className={cn(FIELD_CLASS)}>
          <Layout className={cn("w-4 h-4 shrink-0 mr-2 text-purple-400")} />
          <select value={config.aspectRatio} disabled={disabled} onChange={(event) => onChange({ ...config, aspectRatio: event.target.value as AspectRatio })} className={cn(SELECT_CLASS)}>
            {capabilities.aspectRatios.map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}
          </select>
          <ChevronDown className={cn("w-3.5 h-3.5 absolute right-2 pointer-events-none text-slate-500")} />
        </span>
      </label>
    </div>
  );
}
