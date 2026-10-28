import { RUNTIME_TEXT as RT_VIDEO_GENERATION } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { StudioSelect, StudioInput } from "../../../components/ui/Studio.js";
import { SOURCE_TEXT_LABEL, SOURCE_TEXT_MAXVIDEOSTOOLTIP, SOURCE_TEXT_MIXED, SOURCE_TEXT_RANGE, SOURCE_TEXT_RELATIVE_FLEX_ITEMS_CENTER_BG_SLATE, SOURCE_TEXT_SELECTING, SOURCE_TEXT_SYMBOL_18, SOURCE_TEXT_SYMBOL_23, SOURCE_TEXT_SYMBOL_27, SOURCE_TEXT_SYMBOL_7, SOURCE_TEXT_VALUE, SOURCE_TEXT_VI } from "../../../constants/sourceText";
import { cn } from "../../../lib/utils";
import React from "react";
import _ from "lodash";
import { ChevronDown, Film, Globe, Layout, Sparkles, Wand2 } from "lucide-react";
import { AspectRatio, GenerateType, ImageGenerationMode, ImageGeneratorEngine } from "../../../types";
import { AUTO_VIDEO_DEFAULTS, FLOW_DIRECT_VIDEO_CONFIG, MEDIA_MIX_CONFIG, REFACTOR_CONSTANTS } from "../../../constants";
import { PIPELINE_STEPS } from "../../../constants/enums";
import { AUTO_VIDEO_UI_TEXTS } from "../../../constants/texts";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";
import { Lang } from "../../../lib/lang";
import { getVideoModelCapabilities, normalizeVideoModelSettings } from "../../../services/videoModelCapabilityService";
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
    <div className={cn(RT_VIDEO_GENERATION.SPACE_Y_4)}>
      <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
        <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2)}>
          <span className={cn(RT_VIDEO_GENERATION.W_6_H_6_ROUNDED_LG_BG_BLUE_500_15)}>{forceVideoOnly ? 2 : PIPELINE_STEPS.STEP_3}</span>
          <h3 className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)} title={forceVideoOnly ? uiTexts.cinematicSetupTooltip : T.sec3TitleTooltip}>
            <Wand2 className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_BLUE_400)} /> {forceVideoOnly ? uiTexts.cinematicSetupTitle : T.sec3Title}
          </h3>
        </div>
        <div className={cn(RT_VIDEO_GENERATION.HEADER_BADGE_FLEX_ITEMS_CENTER_GAP_2_TEXT_11PX_FONT)}>
          <Sparkles className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_BLUE_400)} />
          <span className={cn(RT_VIDEO_GENERATION.FONT_SEMIBOLD_TEXT_SLATE_300)}>
            {aspectRatio}
            {SOURCE_TEXT_SYMBOL_18}
            {selectedEngineLabel}
          </span>
        </div>
      </div>
      <div className={cn(RT_VIDEO_GENERATION.SPACE_Y_3_5)}>
        <div className={cn(RT_VIDEO_GENERATION.GRID_GRID_COLS_1_SM_GRID_COLS_2_MD_GRID)}>
          {!forceVideoOnly && (
            <div className={cn(RT_SHARED.SPACE_Y_1)}>
              <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE)}>{T.lblGenMode}</span>
              <div className={cn(FIELD_BASE_CLASSNAME)}>
                <Wand2 className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_SLATE_400_MR)} />
                <StudioSelect
                  value={generationMode}
                  onChange={(e) => {
                    const mode = e.target.value as ImageGenerationMode;
                    setGenerationMode(mode);
                    setImageGeneratorEngine(_.isEqual(mode, ImageGenerationMode.GeminiChat) ? ImageGeneratorEngine.LabsSandbox : ImageGeneratorEngine.Veo3);
                  }}
                  className={cn(RT_VIDEO_GENERATION.FLEX_1_BG_TRANSPARENT_TEXT_SLATE_200_TEXT_XS_FONT)}>
                  <option value={ImageGenerationMode.LabsFlow} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_300)}>
                    {T.optionFlowMode}
                  </option>
                  <option value={ImageGenerationMode.GeminiChat} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_300)}>
                    {T.optionAssistantMode}
                  </option>
                </StudioSelect>
                <ChevronDown className={cn(RT_VIDEO_GENERATION.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_2_TEXT_SLATE_500_W)} />
              </div>
            </div>
          )}
          {forceVideoOnly && (
            <div className={cn(RT_SHARED.SPACE_Y_1)}>
              <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE)}>{T.clipWorkflowLabel}</span>
              <div className={cn(FIELD_BASE_CLASSNAME, RT_VIDEO_GENERATION.CURSOR_DEFAULT)}>
                <Wand2 className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_SLATE_400_MR)} />
                <span className={cn(RT_VIDEO_GENERATION.TRUNCATE_TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_200)}>{T.clipWorkflowGoogleFlow(FLOW_DIRECT_VIDEO_CONFIG.PROMPTS_PER_BATCH)}</span>
              </div>
            </div>
          )}
          <div className={cn(RT_SHARED.SPACE_Y_1)}>
            <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE)}>{forceVideoOnly ? uiTexts.videoModelLabel : T.lblEngine}</span>
            <div className={cn(FIELD_BASE_CLASSNAME)}>
              <Sparkles className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_SLATE_400_MR)} />
              <StudioSelect value={imageGeneratorEngine} onChange={(e) => applyVideoModel(e.target.value as ImageGeneratorEngine)} className={cn(RT_VIDEO_GENERATION.FLEX_1_BG_TRANSPARENT_TEXT_SLATE_200_TEXT_XS_FONT)}>
                {_.map(engineOptions, (opt) => (
                  <option key={opt.value + opt.label} value={opt.value} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_300)}>
                    {opt.label}
                  </option>
                ))}
              </StudioSelect>
              <ChevronDown className={cn(RT_VIDEO_GENERATION.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_2_TEXT_SLATE_500_W)} />
            </div>
          </div>
          {forceVideoOnly && setChromeHeadless && (
            <div className={cn(RT_SHARED.SPACE_Y_1)}>
              <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE)}>{forceVideoOnly ? T.lblChromeVideoGen : T.lblChromeHeadless}</span>
              <div className={cn(FIELD_BASE_CLASSNAME)} title={T.lblChromeHeadlessTooltip}>
                <Globe className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_SLATE_400_MR)} />
                <StudioSelect value={chromeHeadless ? uiTexts.headlessModeValue : uiTexts.windowedModeValue} onChange={(event) => setChromeHeadless(_.isEqual(event.target.value, uiTexts.headlessModeValue))} className={cn(RT_VIDEO_GENERATION.FLEX_1_BG_TRANSPARENT_TEXT_SLATE_200_TEXT_XS_FONT)}>
                  <option value={uiTexts.windowedModeValue} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_300)}>
                    {T.optionWindowed}
                  </option>
                  <option value={uiTexts.headlessModeValue} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_300)}>
                    {T.optionHeadless}
                  </option>
                </StudioSelect>
                <ChevronDown className={cn(RT_VIDEO_GENERATION.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_2_TEXT_SLATE_500_W)} />
              </div>
            </div>
          )}
          {forceVideoOnly && (
            <>
              <div className={cn(RT_SHARED.SPACE_Y_1)}>
                <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE)}>{T.lblDuration}</span>
                <div className={cn(FIELD_BASE_CLASSNAME)}>
                  <Film className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_SLATE_400_MR)} />
                  <StudioSelect value={videoDuration} onChange={(event) => setVideoDuration(event.target.value)} className={cn(RT_VIDEO_GENERATION.FLEX_1_BG_TRANSPARENT_TEXT_SLATE_200_TEXT_XS_FONT)}>
                    {_.map(videoDurationOptions, (duration) => (
                      <option key={duration} value={duration} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_300)}>
                        {duration}
                      </option>
                    ))}
                  </StudioSelect>
                  <ChevronDown className={cn(RT_VIDEO_GENERATION.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_2_TEXT_SLATE_500_W)} />
                </div>
              </div>
              <div className={cn(RT_SHARED.SPACE_Y_1)}>
                <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE)}>{T.lblVideoResolution}</span>
                <div className={cn(FIELD_BASE_CLASSNAME)}>
                  <Sparkles className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_SLATE_400_MR)} />
                  <StudioSelect value={videoResolution} onChange={(event) => setVideoResolution(event.target.value)} className={cn(RT_VIDEO_GENERATION.FLEX_1_BG_TRANSPARENT_TEXT_SLATE_200_TEXT_XS_FONT)}>
                    {_.map(videoResolutionOptions, (resolution) => (
                      <option key={resolution} value={resolution} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_300)}>
                        {resolution}
                      </option>
                    ))}
                  </StudioSelect>
                  <ChevronDown className={cn(RT_VIDEO_GENERATION.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_2_TEXT_SLATE_500_W)} />
                </div>
              </div>
            </>
          )}
          <div className={cn(RT_SHARED.SPACE_Y_1)}>
            <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE)}>{T.lblAspectRatio}</span>
            <div className={cn(FIELD_BASE_CLASSNAME)}>
              <Layout className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_SLATE_400_MR)} />
              <StudioSelect value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className={cn(RT_VIDEO_GENERATION.FLEX_1_BG_TRANSPARENT_TEXT_SLATE_200_TEXT_XS_FONT)}>
                {_.map(aspectRatioOptions, (r) => (
                  <option key={r} value={r} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_300)}>
                    {r} {_.isEqual(r, AspectRatio.NineSixteen) ? REFACTOR_CONSTANTS.RATIO_TIKTOK_SUFFIX : _.isEqual(r, AspectRatio.SixteenNine) ? REFACTOR_CONSTANTS.RATIO_YOUTUBE_SUFFIX : REFACTOR_CONSTANTS.VD_EMPTY_STRING}
                  </option>
                ))}
              </StudioSelect>
              <ChevronDown className={cn(RT_VIDEO_GENERATION.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_2_TEXT_SLATE_500_W)} />
            </div>
          </div>
          {!forceVideoOnly && (
            <div className={cn(RT_SHARED.SPACE_Y_1)}>
              <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE)}>{T.lblGenType || uiTexts.contentToGenerate}</span>
              <div className={cn(FIELD_BASE_CLASSNAME)}>
                <Film className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_SLATE_400_MR)} />
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
                  className={cn(RT_VIDEO_GENERATION.FLEX_1_BG_TRANSPARENT_TEXT_SLATE_200_TEXT_XS_FONT_794FBB)}>
                  <option value={GenerateType.Image} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_300)}>
                    {T.optionImage || uiTexts.imageOnly}
                  </option>
                  <option value={GenerateType.Video} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_300)}>
                    {T.optionVideo || uiTexts.videoOnly}
                  </option>
                  <option value={GenerateType.Mixed} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_300)}>
                    {T.optionMixed || uiTexts.mixedMedia}
                  </option>
                </StudioSelect>
                <ChevronDown className={cn(RT_VIDEO_GENERATION.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_2_TEXT_SLATE_500_W)} />
              </div>
            </div>
          )}
        </div>
        {!forceVideoOnly && _.isEqual(generateType, GenerateType.Mixed) && (
          <div className={cn(RT_VIDEO_GENERATION.BG_PURPLE_950_20_BORDER_BORDER_PURPLE_800_40_ROUNDED)}>
            <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
              <span className={cn(RT_VIDEO_GENERATION.TEXT_PURPLE_300_FONT_BOLD_FLEX_ITEMS_CENTER_GAP_1)}>
                <Sparkles className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_PURPLE_400)} />
                {mixedTitle}
              </span>
              <span className={cn(RT_VIDEO_GENERATION.TEXT_PURPLE_400_FONT_MONO_TEXT_10PX)}>
                {maxVideosLabel}
                {SOURCE_TEXT_SYMBOL_7}
                {maxVideoScenes}
              </span>
            </div>
            <p className={cn(RT_VIDEO_GENERATION.TEXT_SLATE_400_TEXT_11PX_LEADING_RELAXED)} title={maxVideosTooltip}>
              {selectingLabel}
              {SOURCE_TEXT_SYMBOL_27}
              {maxVideosTooltip}
              {SOURCE_TEXT_SYMBOL_23}
            </p>
            <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_GAP_3_PT_1)}>
              <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_WHITESPACE_NOWRAP)}>{maxVideosLabel}</span>
              <StudioInput type={SOURCE_TEXT_RANGE} min={MEDIA_MIX_CONFIG.MIN_VIDEOS} max={MEDIA_MIX_CONFIG.MAX_VIDEOS} value={maxVideoScenes} onChange={(e) => setMaxVideoScenes(Number(e.target.value))} className={cn(RT_VIDEO_GENERATION.FLEX_1_ACCENT_PURPLE_500_H_1_5_BG_SLATE)} />
              <span className={cn(RT_VIDEO_GENERATION.TEXT_XS_FONT_MONO_FONT_BOLD_TEXT_PURPLE_300_W)}>{maxVideoScenes}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
