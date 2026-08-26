import React from "react";
import _ from "lodash";
import { ChevronDown, Film, Globe, Layout, Sparkles, Wand2 } from "lucide-react";
import { AspectRatio, GenerateType, ImageGenerationMode, ImageGeneratorEngine } from "../../types";
import { MEDIA_MIX_CONFIG, REFACTOR_CONSTANTS } from "../../constants";
import { PIPELINE_STEPS } from "../../constants/enums";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";

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
}

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
  chromeHeadless = false,
  setChromeHeadless,
}) => {
  const mixedTitle = _.get(mediaMixTexts, "mixed", "Ảnh + video");
  const maxVideosLabel = _.get(mediaMixTexts, "maxVideos", "Video tối đa");
  const maxVideosTooltip = _.get(mediaMixTexts, "maxVideosTooltip", "Số cảnh video tối đa do AI lựa chọn");
  const selectingLabel = _.get(mediaMixTexts, "selecting", "AI chọn cảnh");
  const engineOptions = getImageEngineOptions(generationMode, forceVideoOnly ? GenerateType.Video : generateType);
  const selectedEngineLabel = _.get(
    _.find(engineOptions, option => _.isEqual(option.value, imageGeneratorEngine)) || _.first(engineOptions),
    "label",
    "AI Engine",
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-mono font-extrabold text-xs shadow-sm shadow-blue-500/20">
            {PIPELINE_STEPS.STEP_3}
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5" title={forceVideoOnly ? "Model video và định dạng khung hình cho toàn bộ phim" : T.sec3TitleTooltip}>
            <Wand2 className="w-3.5 h-3.5 text-blue-400" /> {forceVideoOnly ? "Cấu hình sản xuất phim" : T.sec3Title}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-955/80 border border-slate-800/80 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3 h-3 text-blue-400" />
          <span className="font-semibold text-slate-300">{aspectRatio} • {selectedEngineLabel}</span>
        </div>
      </div>

      <div className="space-y-3.5">
        <div className={`grid grid-cols-2 ${forceVideoOnly ? "sm:grid-cols-3" : "sm:grid-cols-4"} gap-3`}>
          {!forceVideoOnly && (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblGenMode}</span>
              <div className="relative flex items-center bg-slate-955/90 border border-slate-800/90 rounded-xl px-2.5 py-2.5 focus-within:border-blue-500/60 transition-colors">
                <Wand2 className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                <select
                  value={generationMode}
                  onChange={(e) => {
                    const mode = e.target.value as ImageGenerationMode;
                    setGenerationMode(mode);
                    setImageGeneratorEngine(
                      _.isEqual(mode, ImageGenerationMode.GeminiChat)
                        ? ImageGeneratorEngine.LabsSandbox
                        : ImageGeneratorEngine.Veo3
                    );
                  }}
                  className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                >
                  <option value={ImageGenerationMode.LabsFlow} className="bg-slate-955 text-slate-300">{T.optionFlowMode}</option>
                  <option value={ImageGenerationMode.GeminiChat} className="bg-slate-955 text-slate-300">{T.optionAssistantMode}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{forceVideoOnly ? "Model tạo video" : T.lblEngine}</span>
            <div className="relative flex items-center bg-slate-955/90 border border-slate-800/90 rounded-xl px-2.5 py-2.5 focus-within:border-blue-500/60 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <select value={imageGeneratorEngine} onChange={(e) => setImageGeneratorEngine(e.target.value as ImageGeneratorEngine)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                {_.map(engineOptions, (opt) => (
                  <option key={opt.value + opt.label} value={opt.value} className="bg-slate-955 text-slate-300">{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
            </div>
          </div>

          {forceVideoOnly && setChromeHeadless && (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblChromeHeadless}</span>
              <div className="relative flex items-center bg-slate-955/90 border border-slate-800/90 rounded-xl px-2.5 py-2.5 focus-within:border-blue-500/60 transition-colors" title={T.lblChromeHeadlessTooltip}>
                <Globe className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                <select value={chromeHeadless ? "headless" : "windowed"} onChange={(event) => setChromeHeadless(_.isEqual(event.target.value, "headless"))} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                  <option value="windowed" className="bg-slate-955 text-slate-300">{T.optionWindowed}</option>
                  <option value="headless" className="bg-slate-955 text-slate-300">{T.optionHeadless}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblAspectRatio}</span>
            <div className="relative flex items-center bg-slate-955/90 border border-slate-800/90 rounded-xl px-2.5 py-2.5 focus-within:border-blue-500/60 transition-colors">
              <Layout className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                {_.map(_.values(AspectRatio), (r) => (
                  <option key={r} value={r} className="bg-slate-955 text-slate-300">
                    {r} {_.isEqual(r, AspectRatio.NineSixteen) ? REFACTOR_CONSTANTS.RATIO_TIKTOK_SUFFIX : _.isEqual(r, AspectRatio.SixteenNine) ? REFACTOR_CONSTANTS.RATIO_YOUTUBE_SUFFIX : REFACTOR_CONSTANTS.VD_EMPTY_STRING}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
            </div>
          </div>

          {!forceVideoOnly && (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblGenType || "Nội dung cần tạo"}</span>
              <div className="relative flex items-center bg-slate-955/90 border border-slate-800/90 rounded-xl px-2.5 py-2.5 focus-within:border-blue-500/60 transition-colors">
                <Film className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                <select
                  value={forceVideoOnly ? GenerateType.Video : generateType}
                  disabled={forceVideoOnly}
                  onChange={(e) => {
                    const newType = e.target.value as GenerateType;
                    setGenerateType(newType);
                    const validOptions = getImageEngineOptions(generationMode, newType);
                    if (!_.some(validOptions, (o) => _.isEqual(o.value, imageGeneratorEngine))) {
                      const fallback = _.get(_.first(validOptions), "value");
                      if (fallback) setImageGeneratorEngine(fallback as ImageGeneratorEngine);
                    }
                  }}
                  className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer disabled:cursor-not-allowed disabled:text-amber-300 appearance-none pr-5"
                >
                  <option value={GenerateType.Image} className="bg-slate-955 text-slate-300">{T.optionImage || "Chỉ tạo hình ảnh"}</option>
                  <option value={GenerateType.Video} className="bg-slate-955 text-slate-300">{T.optionVideo || "Chỉ tạo video"}</option>
                  <option value={GenerateType.Mixed} className="bg-slate-955 text-slate-300">{T.optionMixed || "Kết hợp ảnh và video"}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
              </div>
            </div>
          )}
        </div>

        {!forceVideoOnly && _.isEqual(generateType, GenerateType.Mixed) && (
          <div className="bg-purple-950/20 border border-purple-800/40 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-purple-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                {mixedTitle}
              </span>
              <span className="text-purple-400 font-mono text-[10px]">
                {maxVideosLabel}: {maxVideoScenes}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed" title={maxVideosTooltip}>
              {selectingLabel}. {maxVideosTooltip}.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[10px] text-slate-400 whitespace-nowrap">{maxVideosLabel}</span>
              <input
                type="range"
                min={MEDIA_MIX_CONFIG.MIN_VIDEOS}
                max={MEDIA_MIX_CONFIG.MAX_VIDEOS}
                value={maxVideoScenes}
                onChange={(e) => setMaxVideoScenes(Number(e.target.value))}
                className="flex-1 accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-purple-300 w-6 text-right">{maxVideoScenes}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
