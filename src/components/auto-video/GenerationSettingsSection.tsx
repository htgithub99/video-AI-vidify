import React from "react";
import _ from "lodash";
import { ChevronDown, Film, Layout, Sparkles, Wand2 } from "lucide-react";
import { AspectRatio, GenerateType, ImageGenerationMode, ImageGeneratorEngine } from "../../types";
import { MEDIA_MIX_CONFIG, REFACTOR_CONSTANTS } from "../../constants";
import { PIPELINE_STEPS } from "../../constants/enums";

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
  T: any;
  mediaMixTexts: any;
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
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-mono font-extrabold text-xs shadow-sm shadow-blue-500/20">
            {PIPELINE_STEPS.STEP_3}
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5" title={T.sec3TitleTooltip}>
            <Wand2 className="w-3.5 h-3.5 text-blue-400" /> {T.sec3Title}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-955/80 border border-slate-800/80 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3 h-3 text-blue-400" />
          <span className="font-semibold text-slate-300">{aspectRatio} • {imageGeneratorEngine || "AI Engine"}</span>
        </div>
      </div>

      <div className="space-y-3.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblEngine}</span>
            <div className="relative flex items-center bg-slate-955/90 border border-slate-800/90 rounded-xl px-2.5 py-2.5 focus-within:border-blue-500/60 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <select value={imageGeneratorEngine} onChange={(e) => setImageGeneratorEngine(e.target.value as ImageGeneratorEngine)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                {_.map(getImageEngineOptions(generationMode, generateType), (opt) => (
                  <option key={opt.value + opt.label} value={opt.value} className="bg-slate-955 text-slate-300">{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
            </div>
          </div>

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

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblGenType || "Nội dung cần tạo"}</span>
            <div className="relative flex items-center bg-slate-955/90 border border-slate-800/90 rounded-xl px-2.5 py-2.5 focus-within:border-blue-500/60 transition-colors">
              <Film className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <select
                value={generateType}
                onChange={(e) => {
                  const newType = e.target.value as GenerateType;
                  setGenerateType(newType);
                  const validOptions = getImageEngineOptions(generationMode, newType);
                  if (!_.some(validOptions, (o) => _.isEqual(o.value, imageGeneratorEngine))) {
                    const fallback = _.get(_.first(validOptions), "value");
                    if (fallback) setImageGeneratorEngine(fallback as ImageGeneratorEngine);
                  }
                }}
                className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
              >
                <option value={GenerateType.Image} className="bg-slate-955 text-slate-300">{T.optionImage || "Chỉ tạo hình ảnh"}</option>
                <option value={GenerateType.Video} className="bg-slate-955 text-slate-300">{T.optionVideo || "Chỉ tạo video"}</option>
                <option value={GenerateType.Mixed} className="bg-slate-955 text-slate-300">{T.optionMixed || "Kết hợp ảnh và video"}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {_.isEqual(generateType, GenerateType.Mixed) && (
          <div className="bg-purple-950/20 border border-purple-800/40 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-purple-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                {mediaMixTexts.title}
              </span>
              <span className="text-purple-400 font-mono text-[10px]">
                {mediaMixTexts.badge(maxVideoScenes)}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {mediaMixTexts.desc}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[10px] text-slate-400 whitespace-nowrap">{mediaMixTexts.sliderLabel}</span>
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
