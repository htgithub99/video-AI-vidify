import _ from "lodash";
import {
  GenerateType,
  ImageGenerationMode,
  ImageGeneratorEngine,
  TextInImageMode,
  VisualConfig,
} from "../types";

export enum ConfigIssueSeverity {
  Warning = "warning",
  Blocking = "blocking",
}

export enum ConfigIssueCode {
  CharacterConsistencyDisabled = "character_consistency_disabled",
  ImageModeVideoSettingsRemoved = "image_mode_video_settings_removed",
  ImageModeVideoEngineReplaced = "image_mode_video_engine_replaced",
  NoTextConstraintApplied = "no_text_constraint_applied",
  VideoModeImageEngineUnsupported = "video_mode_image_engine_unsupported",
  VideoModeRoutedThroughGemini = "video_mode_routed_through_gemini",
}

export interface ConfigIssue {
  code: ConfigIssueCode;
  severity: ConfigIssueSeverity;
}

export interface ResolvedVisualConfig {
  config: VisualConfig;
  issues: ConfigIssue[];
  blocked: boolean;
}

const VIDEO_ENGINES = [
  ImageGeneratorEngine.Veo3,
  ImageGeneratorEngine.Veo3Lite,
  ImageGeneratorEngine.Veo3Fast,
  ImageGeneratorEngine.Veo3Quality,
] as const;

const IMAGE_ENGINES = [ImageGeneratorEngine.Imagen] as const;

const hasCharacterIdentity = (config: VisualConfig): boolean => _.some([
  !_.isEmpty(config.characterPrompt),
  _.some(config.characters, character => !_.isEmpty(character.prompt || character.description)),
], Boolean);

export const resolveVisualConfig = (source: VisualConfig): ResolvedVisualConfig => {
  const config = _.cloneDeep(source);
  const issues: ConfigIssue[] = [];
  const requestsGeneratedVideo = _.includes(
    [GenerateType.Video, GenerateType.Mixed],
    config.generateType as GenerateType,
  );
  if (requestsGeneratedVideo && !_.isEqual(config.generationMode, ImageGenerationMode.GeminiChat)) {
    // All generated-video workflows use the Gemini UI. The selected engine is
    // deliberately preserved because it represents the user's model choice
    // inside Gemini (Veo Fast/Quality/etc.), not a competing transport.
    config.generationMode = ImageGenerationMode.GeminiChat;
    issues.push({
      code: ConfigIssueCode.VideoModeRoutedThroughGemini,
      severity: ConfigIssueSeverity.Warning,
    });
  }
  const usesGeminiModelPicker = _.isEqual(config.generationMode, ImageGenerationMode.GeminiChat);

  if (_.every([config.characterConsistency, !hasCharacterIdentity(config)], Boolean)) {
    config.characterConsistency = false;
    issues.push({
      code: ConfigIssueCode.CharacterConsistencyDisabled,
      severity: ConfigIssueSeverity.Warning,
    });
  }

  if (_.isEqual(config.generateType, GenerateType.Image)) {
    if (_.some([config.videoDuration, config.maxVideoScenes], (value) => !_.isNil(value))) {
      delete config.videoDuration;
      delete config.maxVideoScenes;
      issues.push({
        code: ConfigIssueCode.ImageModeVideoSettingsRemoved,
        severity: ConfigIssueSeverity.Warning,
      });
    }

    if (!usesGeminiModelPicker && _.includes(VIDEO_ENGINES, config.imageGeneratorEngine as typeof VIDEO_ENGINES[number])) {
      config.imageGeneratorEngine = ImageGeneratorEngine.Imagen;
      issues.push({
        code: ConfigIssueCode.ImageModeVideoEngineReplaced,
        severity: ConfigIssueSeverity.Warning,
      });
    }
  }

  if (_.some([
    _.isEqual(config.generateType, GenerateType.Video),
    _.isEqual(config.generateType, GenerateType.Mixed),
  ]) && !usesGeminiModelPicker && _.includes(IMAGE_ENGINES, config.imageGeneratorEngine as typeof IMAGE_ENGINES[number])) {
    config.generateType = GenerateType.Image;
    issues.push({
      code: ConfigIssueCode.VideoModeImageEngineUnsupported,
      severity: ConfigIssueSeverity.Warning,
    });
  }

  if (_.isEqual(config.styleTextInImageMode, TextInImageMode.NoText)) {
    issues.push({
      code: ConfigIssueCode.NoTextConstraintApplied,
      severity: ConfigIssueSeverity.Warning,
    });
  }

  return {
    config,
    issues,
    blocked: _.some(issues, { severity: ConfigIssueSeverity.Blocking }),
  };
};
