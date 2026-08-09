import _ from "lodash";
import { ChevronDown, Film, Layout, Sparkles, Wand2 } from "lucide-react";
import {
  AspectRatio,
  GenerateType,
  ImageGenerationMode,
  ImageGeneratorEngine,
} from "../../types";
import { MEDIA_MIX_CONFIG, REFACTOR_CONSTANTS } from "../../constants";

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
  getImageEngineOptions: (
    mode: ImageGenerationMode,
    type: GenerateType,
  ) => { value: string; label: string }[];
  T: any;
  mediaMixTexts: any;
}

export const GenerationSettingsSection: React.FC<
  GenerationSettingsSectionProps
> = ({
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
    <>
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
          3
        </span>
        <h3
          className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5"
          title={T.sec3TitleTooltip}
        >
          <Wand2 className="w-3.5 h-3.5 text-blue-400" /> {T.sec3Title}
        </h3>
      </div>

      <div className="space-y-3.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
              {T.lblGenMode}
            </span>
            <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
              <Wand2 className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <select
                value={generationMode}
                onChange={(e) => {
                  setGenerationMode(e.target.value as ImageGenerationMode);
                  setImageGeneratorEngine(ImageGeneratorEngine.Veo3);
                }}
                className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
              >
                <option
                  value={ImageGenerationMode.LabsFlow}
                  className="bg-slate-955 text-slate-300"
                >
                  {T.optionFlowMode}
                </option>
                <option
                  value={ImageGenerationMode.GeminiChat}
                  className="bg-slate-955 text-slate-300"
                >
                  {T.optionAssistantMode}
                </option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
              {T.lblEngine}
            </span>
            <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <select
                value={imageGeneratorEngine}
                onChange={(e) =>
                  setImageGeneratorEngine(
                    e.target.value as ImageGeneratorEngine,
                  )
                }
                className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
              >
                {_.map(
                  getImageEngineOptions(generationMode, generateType),
                  (opt) => (
                    <option
                      key={opt.value + opt.label}
                      value={opt.value}
                      className="bg-slate-955 text-slate-300"
                    >
                      {opt.label}
                    </option>
                  ),
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
              {T.lblAspectRatio}
            </span>
            <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
              <Layout className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
              >
                {_.map(_.values(AspectRatio), (r) => (
                  <option
                    key={r}
                    value={r}
                    className="bg-slate-955 text-slate-300"
                  >
                    {r}{" "}
                    {_.isEqual(r, AspectRatio.NineSixteen)
                      ? REFACTOR_CONSTANTS.RATIO_TIKTOK_SUFFIX
                      : _.isEqual(r, AspectRatio.SixteenNine)
                        ? REFACTOR_CONSTANTS.RATIO_YOUTUBE_SUFFIX
                        : REFACTOR_CONSTANTS.VD_EMPTY_STRING}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
              {T.lblGenType}
            </span>
            <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
              <Film className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <select
                value={generateType}
                onChange={(e) => {
                  setGenerateType(e.target.value as GenerateType);
                  if (generationMode !== ImageGenerationMode.GeminiChat) {
                    setImageGeneratorEngine(ImageGeneratorEngine.Veo3);
                  }
                }}
                className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
              >
                <option
                  value={GenerateType.Image}
                  className="bg-slate-955 text-slate-300"
                >
                  {T.optionImage}
                </option>
                <option
                  value={GenerateType.Video}
                  className="bg-slate-955 text-slate-300"
                >
                  {T.optionVideo}
                </option>
                <option
                  value={GenerateType.Mixed}
                  className="bg-slate-955 text-slate-300"
                >
                  {T.optionMixed}
                </option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {_.isEqual(generateType, GenerateType.Mixed) && (
          <div className="max-w-xs">
            <div className="space-y-1">
              <span
                className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block"
                title={mediaMixTexts.maxVideosTooltip}
              >
                {mediaMixTexts.maxVideos}
              </span>
              <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
                <Film className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                <select
                  value={maxVideoScenes}
                  onChange={(event) =>
                    setMaxVideoScenes(_.toInteger(event.target.value))
                  }
                  className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                >
                  {_.map(MEDIA_MIX_CONFIG.VIDEO_COUNT_OPTIONS, (count) => (
                    <option
                      key={count}
                      value={count}
                      className="bg-slate-955 text-slate-300"
                    >
                      {count}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
