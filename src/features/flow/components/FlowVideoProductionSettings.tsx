import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_FLOW } from "../constants/runtimeText.js";
import { StudioSelect } from "../../../components/ui/Studio.js";
import _ from "lodash";
import { SOURCE_TEXT_RELATIVE_FLEX_ITEMS_CENTER_H_10, SOURCE_TEXT_W_FULL_MIN_W_0_BG } from "../../../constants/sourceText";
import { ChevronDown, Film, Globe, Layout, Sparkles, WandSparkles } from "lucide-react";
import { FLOW_DIRECT_VIDEO_CONFIG, FLOW_VIDEO_TEXTS } from "../../../constants";
import { FLOW_VIDEO_MODEL_OPTIONS } from "../constants/flowVideoSettings";
import { cn } from "../../../lib/utils";
import { getVideoModelCapabilities, normalizeVideoModelSettings } from "../../../services/videoModelCapabilityService";
import { AspectRatio, ImageGeneratorEngine } from "../../../types";
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
const FIELD_CLASS = SOURCE_TEXT_RELATIVE_FLEX_ITEMS_CENTER_H_10;
const SELECT_CLASS = SOURCE_TEXT_W_FULL_MIN_W_0_BG;
export default function FlowVideoProductionSettings({ config, onChange, disabled, texts, hasCharacterImages }: Props) {
  const capabilities = getVideoModelCapabilities(config.engine);
  const updateModel = (engine: ImageGeneratorEngine) => {
    const normalized = normalizeVideoModelSettings(engine, config);
    onChange({ ...config, engine, duration: normalized.duration, resolution: normalized.resolution, aspectRatio: normalized.aspectRatio });
  };
  return (
    <div className={cn(RT_SHARED.GRID_GRID_COLS_1_SM_GRID_COLS_2_GAP_3)}>
      <label className={cn(RT_FLOW.SPACE_Y_1_MIN_W_0)}>
        <span className={cn(RT_FLOW.TEXT_10PX_FONT_BOLD_TEXT_SLATE_400)}>{texts.VIDEO_WORKFLOW}</span>
        <span className={cn(FIELD_CLASS, RT_FLOW.GAP_2_TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_200)}>
          <WandSparkles className={cn(RT_FLOW.W_4_H_4_SHRINK_0_TEXT_PURPLE_400)} />
          <span className={cn(RT_SHARED.TRUNCATE)}>{texts.VIDEO_WORKFLOW_VALUE(FLOW_DIRECT_VIDEO_CONFIG.PROMPTS_PER_BATCH)}</span>
        </span>
      </label>
      <label className={cn(RT_FLOW.SPACE_Y_1_MIN_W_0)}>
        <span className={cn(RT_FLOW.TEXT_10PX_FONT_BOLD_TEXT_SLATE_400)}>{texts.VIDEO_MODEL}</span>
        <span className={cn(FIELD_CLASS)}>
          <Sparkles className={cn(RT_FLOW.W_4_H_4_SHRINK_0_MR_2_TEXT_PURPLE)} />
          <StudioSelect value={config.engine} disabled={disabled} onChange={(event) => updateModel(event.target.value as ImageGeneratorEngine)} className={cn(SELECT_CLASS)}>
            {_.map(FLOW_VIDEO_MODEL_OPTIONS, (option) => (
              <option key={option.value} value={option.value} disabled={hasCharacterImages && !getVideoModelCapabilities(option.value).supportsReferences}>
                {option.label}
              </option>
            ))}
          </StudioSelect>
          <ChevronDown className={cn(RT_FLOW.W_3_5_H_3_5_ABSOLUTE_RIGHT_2_POINTER)} />
        </span>
      </label>
      <label className={cn(RT_FLOW.SPACE_Y_1_MIN_W_0)}>
        <span className={cn(RT_FLOW.TEXT_10PX_FONT_BOLD_TEXT_SLATE_400)}>{texts.VIDEO_BROWSER}</span>
        <span className={cn(FIELD_CLASS)}>
          <Globe className={cn(RT_FLOW.W_4_H_4_SHRINK_0_MR_2_TEXT_PURPLE)} />
          <StudioSelect value={String(config.chromeHeadless)} disabled={disabled} onChange={(event) => onChange({ ...config, chromeHeadless: event.target.value === String(true) })} className={cn(SELECT_CLASS)}>
            <option value={String(false)}>{texts.VIDEO_BROWSER_VISIBLE}</option>
            <option value={String(true)}>{texts.VIDEO_BROWSER_HIDDEN}</option>
          </StudioSelect>
          <ChevronDown className={cn(RT_FLOW.W_3_5_H_3_5_ABSOLUTE_RIGHT_2_POINTER)} />
        </span>
      </label>
      <label className={cn(RT_FLOW.SPACE_Y_1_MIN_W_0)}>
        <span className={cn(RT_FLOW.TEXT_10PX_FONT_BOLD_TEXT_SLATE_400)}>{texts.VIDEO_DURATION}</span>
        <span className={cn(FIELD_CLASS)}>
          <Film className={cn(RT_FLOW.W_4_H_4_SHRINK_0_MR_2_TEXT_PURPLE)} />
          <StudioSelect value={config.duration} disabled={disabled} onChange={(event) => onChange({ ...config, duration: event.target.value })} className={cn(SELECT_CLASS)}>
            {_.map(capabilities.durations, (duration) => (
              <option key={duration} value={duration}>
                {duration}
              </option>
            ))}
          </StudioSelect>
          <ChevronDown className={cn(RT_FLOW.W_3_5_H_3_5_ABSOLUTE_RIGHT_2_POINTER)} />
        </span>
      </label>
      <label className={cn(RT_FLOW.SPACE_Y_1_MIN_W_0)}>
        <span className={cn(RT_FLOW.TEXT_10PX_FONT_BOLD_TEXT_SLATE_400)}>{texts.VIDEO_RESOLUTION}</span>
        <span className={cn(FIELD_CLASS)}>
          <Sparkles className={cn(RT_FLOW.W_4_H_4_SHRINK_0_MR_2_TEXT_PURPLE)} />
          <StudioSelect value={config.resolution} disabled={disabled} onChange={(event) => onChange({ ...config, resolution: event.target.value })} className={cn(SELECT_CLASS)}>
            {_.map(capabilities.resolutions, (resolution) => (
              <option key={resolution} value={resolution}>
                {resolution}
              </option>
            ))}
          </StudioSelect>
          <ChevronDown className={cn(RT_FLOW.W_3_5_H_3_5_ABSOLUTE_RIGHT_2_POINTER)} />
        </span>
      </label>
      <label className={cn(RT_FLOW.SPACE_Y_1_MIN_W_0)}>
        <span className={cn(RT_FLOW.TEXT_10PX_FONT_BOLD_TEXT_SLATE_400)}>{texts.VIDEO_ASPECT_RATIO}</span>
        <span className={cn(FIELD_CLASS)}>
          <Layout className={cn(RT_FLOW.W_4_H_4_SHRINK_0_MR_2_TEXT_PURPLE)} />
          <StudioSelect value={config.aspectRatio} disabled={disabled} onChange={(event) => onChange({ ...config, aspectRatio: event.target.value as AspectRatio })} className={cn(SELECT_CLASS)}>
            {_.map(capabilities.aspectRatios, (ratio) => (
              <option key={ratio} value={ratio}>
                {ratio}
              </option>
            ))}
          </StudioSelect>
          <ChevronDown className={cn(RT_FLOW.W_3_5_H_3_5_ABSOLUTE_RIGHT_2_POINTER)} />
        </span>
      </label>
    </div>
  );
}
