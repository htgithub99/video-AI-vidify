import { StudioSelect, StudioInput } from "../ui/Studio.js";
import { SOURCE_TEXT_LABEL, SOURCE_TEXT_MAXVIDEOSTOOLTIP, SOURCE_TEXT_MIXED, SOURCE_TEXT_RANGE, SOURCE_TEXT_RELATIVE_FLEX_ITEMS_CENTER_BG_SLATE, SOURCE_TEXT_SELECTING, SOURCE_TEXT_SYMBOL_18, SOURCE_TEXT_SYMBOL_23, SOURCE_TEXT_SYMBOL_27, SOURCE_TEXT_SYMBOL_7, SOURCE_TEXT_VALUE, SOURCE_TEXT_VI } from "../../constants/sourceText";
import { cn } from "../../lib/utils";
import React from "react";
import _ from "lodash";
import { ChevronDown, Film, Globe, Layout, Sparkles, Wand2 } from "lucide-react";
import { AspectRatio, GenerateType, ImageGenerationMode, ImageGeneratorEngine } from "../../types";
import { AUTO_VIDEO_DEFAULTS, FLOW_DIRECT_VIDEO_CONFIG, MEDIA_MIX_CONFIG, REFACTOR_CONSTANTS } from "../../constants";
import { PIPELINE_STEPS } from "../../constants/enums";
import { AUTO_VIDEO_UI_TEXTS } from "../../constants/texts";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";
import { Lang } from "../../lib/lang";
import { getVideoModelCapabilities, normalizeVideoModelSettings } from "../../services/videoModelCapabilityService";
interface GenerationSettingsSectionProps {
  generationMode: ImageGenerationMode;
  setGenerationMode: (val: ImageGenerationMode) => void;
  imageGeneratorEngine: ImageGeneratorEngine;
  setImageGeneratorEngine: (val: ImageGeneratorEngine) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (val: AspectRatio) => void;
  generateType: GenerateType;
  setGenerateType: (val: GenerateType) => void;
  maxVideoScenes: number;
  setMaxVideoScenes: (val: number) => void;
  getImageEngineOptions: (mode: ImageGenerationMode, type: GenerateType) => { value: string; label: string }[];
  T: ReturnType<typeof getAutoVideoTexts>;
  mediaMixTexts: Record<string, string>;
  forceVideoOnly?: boolean;
  chromeHeadless?: boolean;
  setChromeHeadless?: (val: boolean) => void;
  videoDuration: string;
  setVideoDuration: (value: string) => void;
  videoResolution: string;
  setVideoResolution: (value: string) => void;
  currentLang?: Lang;
}
const FIELD_BASE_CLASSNAME = SOURCE_TEXT_RELATIVE_FLEX_ITEMS_CENTER_BG_SLATE;
export const GenerationSettingsSection: React.FC<GenerationSettingsSectionProps> = ({
  generationMode,
  setGenerationMode,
  imageGeneratorEngine,
  setImageGeneratorEngine,
  aspectRatio,
  setAspectRatio,
  generateType,
  setGenerateType,
  maxVideoScenes,
  setMaxVideoScenes,
  getImageEngineOptions,
  T,
  mediaMixTexts,
  forceVideoOnly = false,
  chromeHeadless = AUTO_VIDEO_DEFAULTS.CHROME_HEADLESS,
  setChromeHeadless,
  videoDuration,
  setVideoDuration,
  videoResolution,
  setVideoResolution,
  currentLang = SOURCE_TEXT_VI,
}) => {
  const uiTexts = _.get(AUTO_VIDEO_UI_TEXTS, currentLang, AUTO_VIDEO_UI_TEXTS.vi);
  const mixedTitle = _.get(mediaMixTexts, SOURCE_TEXT_MIXED, uiTexts.mediaMixed);
  const maxVideosLabel = mediaMixTexts?.maxVideos || uiTexts.maxVideos;
  const maxVideosTooltip = _.get(mediaMixTexts, SOURCE_TEXT_MAXVIDEOSTOOLTIP, uiTexts.maxVideosTooltip);
  const selectingLabel = _.get(mediaMixTexts, SOURCE_TEXT_SELECTING, uiTexts.selectingScenes);
  const allEngineOptions = getImageEngineOptions(generationMode, forceVideoOnly ? GenerateType.Video : generateType);
  const engineOptions = forceVideoOnly ? _.reject(allEngineOptions, (option) => _.isEqual(option.value, ImageGeneratorEngine.GrokImagine)) : allEngineOptions;
  const selectedEngineLabel = _.get(_.find(engineOptions, (option) => _.isEqual(option.value, imageGeneratorEngine)) || _.first(engineOptions), SOURCE_TEXT_LABEL, uiTexts.aiEngineDefault);
  const videoModelCapabilities = getVideoModelCapabilities(imageGeneratorEngine);
  const aspectRatioOptions = forceVideoOnly ? videoModelCapabilities.aspectRatios : _.values(AspectRatio);
  const videoDurationOptions = videoModelCapabilities.durations;
  const videoResolutionOptions = videoModelCapabilities.resolutions;
  const applyVideoModel = (nextEngine: ImageGeneratorEngine): void => {
    const normalized = normalizeVideoModelSettings(nextEngine, { duration: videoDuration, resolution: videoResolution, aspectRatio });
    setImageGeneratorEngine(nextEngine);
    if (!_.isEqual(videoDuration, normalized.duration)) setVideoDuration(normalized.duration);
    if (!_.isEqual(videoResolution, normalized.resolution)) setVideoResolution(normalized.resolution);
    if (!_.isEqual(aspectRatio, normalized.aspectRatio)) setAspectRatio(normalized.aspectRatio);
  };
  return (
    <div className={cn("space-y-4")}>
      <div className={cn("flex items-center justify-between")}>
        <div className={cn("flex items-center gap-2")}>
          <span className={cn("w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-mono font-extrabold text-xs shadow-sm shadow-blue-500/20")}>{forceVideoOnly ? 2 : PIPELINE_STEPS.STEP_3}</span>
          <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")} title={forceVideoOnly ? uiTexts.cinematicSetupTooltip : T.sec3TitleTooltip}>
            <Wand2 className={cn("w-3.5 h-3.5 text-blue-400")} /> {forceVideoOnly ? uiTexts.cinematicSetupTitle : T.sec3Title}
          </h3>
        </div>
        <div className={cn("header-badge flex items-center gap-2 text-[11px] font-mono font-bold text-slate-300 bg-slate-955/80 px-3 py-1 rounded-full")}>
          <Sparkles className={cn("w-3.5 h-3.5 text-blue-400")} />
          <span className={cn("font-semibold text-slate-300")}>
            {aspectRatio}
            {SOURCE_TEXT_SYMBOL_18}
            {selectedEngineLabel}
          </span>
        </div>
      </div>
      <div className={cn("space-y-3.5")}>
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3")}>
          {!forceVideoOnly && (
            <div className={cn("space-y-1")}>
              <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")}>{T.lblGenMode}</span>
              <div className={cn(FIELD_BASE_CLASSNAME)}>
                <Wand2 className={cn("w-3.5 h-3.5 text-slate-400 mr-2 shrink-0")} />
                <StudioSelect
                  value={generationMode}
                  onChange={(e) => {
                    const mode = e.target.value as ImageGenerationMode;
                    setGenerationMode(mode);
                    setImageGeneratorEngine(_.isEqual(mode, ImageGenerationMode.GeminiChat) ? ImageGeneratorEngine.LabsSandbox : ImageGeneratorEngine.Veo3);
                  }}
                  className={cn("flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5")}>
                  <option value={ImageGenerationMode.LabsFlow} className={cn("bg-slate-955 text-slate-300")}>
                    {T.optionFlowMode}
                  </option>
                  <option value={ImageGenerationMode.GeminiChat} className={cn("bg-slate-955 text-slate-300")}>
                    {T.optionAssistantMode}
                  </option>
                </StudioSelect>
                <ChevronDown className={cn("pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5")} />
              </div>
            </div>
          )}
          {forceVideoOnly && (
            <div className={cn("space-y-1")}>
              <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")}>{T.clipWorkflowLabel}</span>
              <div className={cn(FIELD_BASE_CLASSNAME, "cursor-default")}>
                <Wand2 className={cn("w-3.5 h-3.5 text-slate-400 mr-2 shrink-0")} />
                <span className={cn("truncate text-xs font-semibold text-slate-200")}>{T.clipWorkflowGoogleFlow(FLOW_DIRECT_VIDEO_CONFIG.PROMPTS_PER_BATCH)}</span>
              </div>
            </div>
          )}
          <div className={cn("space-y-1")}>
            <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")}>{forceVideoOnly ? uiTexts.videoModelLabel : T.lblEngine}</span>
            <div className={cn(FIELD_BASE_CLASSNAME)}>
              <Sparkles className={cn("w-3.5 h-3.5 text-slate-400 mr-2 shrink-0")} />
              <StudioSelect value={imageGeneratorEngine} onChange={(e) => applyVideoModel(e.target.value as ImageGeneratorEngine)} className={cn("flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5")}>
                {_.map(engineOptions, (opt) => (
                  <option key={opt.value + opt.label} value={opt.value} className={cn("bg-slate-955 text-slate-300")}>
                    {opt.label}
                  </option>
                ))}
              </StudioSelect>
              <ChevronDown className={cn("pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5")} />
            </div>
          </div>
          {forceVideoOnly && setChromeHeadless && (
            <div className={cn("space-y-1")}>
              <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")}>{forceVideoOnly ? T.lblChromeVideoGen : T.lblChromeHeadless}</span>
              <div className={cn(FIELD_BASE_CLASSNAME)} title={T.lblChromeHeadlessTooltip}>
                <Globe className={cn("w-3.5 h-3.5 text-slate-400 mr-2 shrink-0")} />
                <StudioSelect value={chromeHeadless ? uiTexts.headlessModeValue : uiTexts.windowedModeValue} onChange={(event) => setChromeHeadless(_.isEqual(event.target.value, uiTexts.headlessModeValue))} className={cn("flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5")}>
                  <option value={uiTexts.windowedModeValue} className={cn("bg-slate-955 text-slate-300")}>
                    {T.optionWindowed}
                  </option>
                  <option value={uiTexts.headlessModeValue} className={cn("bg-slate-955 text-slate-300")}>
                    {T.optionHeadless}
                  </option>
                </StudioSelect>
                <ChevronDown className={cn("pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5")} />
              </div>
            </div>
          )}
          {forceVideoOnly && (
            <>
              <div className={cn("space-y-1")}>
                <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")}>{T.lblDuration}</span>
                <div className={cn(FIELD_BASE_CLASSNAME)}>
                  <Film className={cn("w-3.5 h-3.5 text-slate-400 mr-2 shrink-0")} />
                  <StudioSelect value={videoDuration} onChange={(event) => setVideoDuration(event.target.value)} className={cn("flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5")}>
                    {_.map(videoDurationOptions, (duration) => (
                      <option key={duration} value={duration} className={cn("bg-slate-955 text-slate-300")}>
                        {duration}
                      </option>
                    ))}
                  </StudioSelect>
                  <ChevronDown className={cn("pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5")} />
                </div>
              </div>
              <div className={cn("space-y-1")}>
                <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")}>{T.lblVideoResolution}</span>
                <div className={cn(FIELD_BASE_CLASSNAME)}>
                  <Sparkles className={cn("w-3.5 h-3.5 text-slate-400 mr-2 shrink-0")} />
                  <StudioSelect value={videoResolution} onChange={(event) => setVideoResolution(event.target.value)} className={cn("flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5")}>
                    {_.map(videoResolutionOptions, (resolution) => (
                      <option key={resolution} value={resolution} className={cn("bg-slate-955 text-slate-300")}>
                        {resolution}
                      </option>
                    ))}
                  </StudioSelect>
                  <ChevronDown className={cn("pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5")} />
                </div>
              </div>
            </>
          )}
          <div className={cn("space-y-1")}>
            <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")}>{T.lblAspectRatio}</span>
            <div className={cn(FIELD_BASE_CLASSNAME)}>
              <Layout className={cn("w-3.5 h-3.5 text-slate-400 mr-2 shrink-0")} />
              <StudioSelect value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className={cn("flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5")}>
                {_.map(aspectRatioOptions, (r) => (
                  <option key={r} value={r} className={cn("bg-slate-955 text-slate-300")}>
                    {r} {_.isEqual(r, AspectRatio.NineSixteen) ? REFACTOR_CONSTANTS.RATIO_TIKTOK_SUFFIX : _.isEqual(r, AspectRatio.SixteenNine) ? REFACTOR_CONSTANTS.RATIO_YOUTUBE_SUFFIX : REFACTOR_CONSTANTS.VD_EMPTY_STRING}
                  </option>
                ))}
              </StudioSelect>
              <ChevronDown className={cn("pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5")} />
            </div>
          </div>
          {!forceVideoOnly && (
            <div className={cn("space-y-1")}>
              <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")}>{T.lblGenType || uiTexts.contentToGenerate}</span>
              <div className={cn(FIELD_BASE_CLASSNAME)}>
                <Film className={cn("w-3.5 h-3.5 text-slate-400 mr-2 shrink-0")} />
                <StudioSelect
                  value={forceVideoOnly ? GenerateType.Video : generateType}
                  disabled={forceVideoOnly}
                  onChange={(e) => {
                    const newType = e.target.value as GenerateType;
                    setGenerateType(newType);
                    const validOptions = getImageEngineOptions(generationMode, newType);
                    if (!_.some(validOptions, (o) => _.isEqual(o.value, imageGeneratorEngine))) {
                      const fallback = _.get(_.first(validOptions), SOURCE_TEXT_VALUE);
                      if (fallback) setImageGeneratorEngine(fallback as ImageGeneratorEngine);
                    }
                  }}
                  className={cn("flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer disabled:cursor-not-allowed disabled:text-amber-300 appearance-none pr-5")}>
                  <option value={GenerateType.Image} className={cn("bg-slate-955 text-slate-300")}>
                    {T.optionImage || uiTexts.imageOnly}
                  </option>
                  <option value={GenerateType.Video} className={cn("bg-slate-955 text-slate-300")}>
                    {T.optionVideo || uiTexts.videoOnly}
                  </option>
                  <option value={GenerateType.Mixed} className={cn("bg-slate-955 text-slate-300")}>
                    {T.optionMixed || uiTexts.mixedMedia}
                  </option>
                </StudioSelect>
                <ChevronDown className={cn("pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5")} />
              </div>
            </div>
          )}
        </div>
        {!forceVideoOnly && _.isEqual(generateType, GenerateType.Mixed) && (
          <div className={cn("bg-purple-950/20 border border-purple-800/40 rounded-xl p-3 space-y-2 text-xs")}>
            <div className={cn("flex items-center justify-between")}>
              <span className={cn("text-purple-300 font-bold flex items-center gap-1.5")}>
                <Sparkles className={cn("w-3.5 h-3.5 text-purple-400")} />
                {mixedTitle}
              </span>
              <span className={cn("text-purple-400 font-mono text-[10px]")}>
                {maxVideosLabel}
                {SOURCE_TEXT_SYMBOL_7}
                {maxVideoScenes}
              </span>
            </div>
            <p className={cn("text-slate-400 text-[11px] leading-relaxed")} title={maxVideosTooltip}>
              {selectingLabel}
              {SOURCE_TEXT_SYMBOL_27}
              {maxVideosTooltip}
              {SOURCE_TEXT_SYMBOL_23}
            </p>
            <div className={cn("flex items-center gap-3 pt-1")}>
              <span className={cn("text-[10px] text-slate-400 whitespace-nowrap")}>{maxVideosLabel}</span>
              <StudioInput type={SOURCE_TEXT_RANGE} min={MEDIA_MIX_CONFIG.MIN_VIDEOS} max={MEDIA_MIX_CONFIG.MAX_VIDEOS} value={maxVideoScenes} onChange={(e) => setMaxVideoScenes(Number(e.target.value))} className={cn("flex-1 accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer")} />
              <span className={cn("text-xs font-mono font-bold text-purple-300 w-6 text-right")}>{maxVideoScenes}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
