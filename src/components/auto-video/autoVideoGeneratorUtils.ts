import _ from "lodash";
import { ImageGenerationMode, ImageGeneratorEngine, GenerateType, BackgroundMode, AspectRatio, ThumbnailTextMode, ImageFocusMode, ProjectLanguage } from "../../types";
import { REFACTOR_CONSTANTS } from "../../constants";
import { AUTO_GENERATOR_PANEL_TEXTS, PRESET_CONSTANTS } from "../../constants/texts";
import { Lang } from "../../lib/lang";
import { AutoVideoFormActions, AutoVideoFormState } from "../../hooks/useAutoVideoState";
import { normalizeBackgroundMode, SCENE_TEXT_MODE } from "../../services/visualConfigModeService";
export const getAutoVideoTexts = (language: Lang) => AUTO_GENERATOR_PANEL_TEXTS[language as "vi" | "en"] || AUTO_GENERATOR_PANEL_TEXTS.vi;
export const getSplitLabels = (texts: ReturnType<typeof getAutoVideoTexts>) => ({
  word: texts.splitWord,
  short_sentence: texts.splitShort,
  long_sentence: texts.splitLong,
  mixed_sentences: texts.splitMixed,
  paragraph: texts.splitParagraph,
});
export const getImageEngineOptions = (generationMode: ImageGenerationMode, generationType: GenerateType): { value: ImageGeneratorEngine; label: string }[] => {
  if (_.isEqual(generationMode, ImageGenerationMode.GeminiChat)) {
    if (_.includes([GenerateType.Video, GenerateType.Mixed], generationType)) {
      return [
        { value: ImageGeneratorEngine.LabsSandbox, label: REFACTOR_CONSTANTS.ENGINE_LABS_SANDBOX },
        { value: ImageGeneratorEngine.Veo3, label: REFACTOR_CONSTANTS.ENGINE_VEO3 },
      ];
    }
    return [{ value: ImageGeneratorEngine.LabsSandbox, label: REFACTOR_CONSTANTS.ENGINE_GEMINI_IMAGES }];
  }
  if (_.includes([GenerateType.Video, GenerateType.Mixed], generationType)) {
    return [
      { value: ImageGeneratorEngine.GrokImagine, label: REFACTOR_CONSTANTS.ENGINE_GROK_IMAGINE },
      { value: ImageGeneratorEngine.Veo3, label: REFACTOR_CONSTANTS.ENGINE_OMNI_FLASH },
      { value: ImageGeneratorEngine.Veo3Lite, label: REFACTOR_CONSTANTS.ENGINE_VEO3_LITE },
      { value: ImageGeneratorEngine.Veo3Fast, label: REFACTOR_CONSTANTS.ENGINE_VEO3_FAST },
      { value: ImageGeneratorEngine.Veo3Quality, label: REFACTOR_CONSTANTS.ENGINE_VEO3_QUALITY },
    ];
  }
  return [
    { value: ImageGeneratorEngine.GrokImagine, label: REFACTOR_CONSTANTS.ENGINE_GROK_IMAGINE },
    { value: ImageGeneratorEngine.Imagen, label: REFACTOR_CONSTANTS.ENGINE_IMAGEN_3_BATCH },
    { value: ImageGeneratorEngine.Veo3, label: REFACTOR_CONSTANTS.ENGINE_VEO_3_0_FLUID },
    { value: ImageGeneratorEngine.LabsSandbox, label: REFACTOR_CONSTANTS.ENGINE_LABS_SANDBOX_STILL },
  ];
};
export const truncateWords = (text: string, maxWords: number): string => {
  const words = _.words(text);
  return _.gt(words.length, maxWords) ? _.join(_.take(words, maxWords), REFACTOR_CONSTANTS.VD_BLANK) + REFACTOR_CONSTANTS.AVG_ELLIPSIS : text;
};
export const buildPresetPayload = (state: AutoVideoFormState, presetName: string) => ({
  id: `${PRESET_CONSTANTS.ID_PREFIX}${Date.now()}`,
  name: presetName,
  config: {
    [REFACTOR_CONSTANTS.AVG_INPUT_TYPE_KEY]: state.inputType,
    [REFACTOR_CONSTANTS.AVG_GENRE_KEY]: state.genre,
    [REFACTOR_CONSTANTS.AVG_LANGUAGE_KEY]: state.language,
    [REFACTOR_CONSTANTS.AVG_DURATION_KEY]: state.duration,
    [REFACTOR_CONSTANTS.AVG_SPLIT_STRATEGY_KEY]: state.splitStrategy,
    [REFACTOR_CONSTANTS.AVG_VOICE_PROVIDER_KEY]: state.voiceProvider,
    [REFACTOR_CONSTANTS.AVG_VOICE_URI_KEY]: state.voiceURI,
    [REFACTOR_CONSTANTS.AVG_VOICE_NAME_KEY]: state.voiceName,
    [REFACTOR_CONSTANTS.AVG_GENERATION_MODE_KEY]: state.generationMode,
    [REFACTOR_CONSTANTS.AVG_GENERATE_TYPE_KEY]: state.generateType,
    [REFACTOR_CONSTANTS.AVG_MAX_VIDEO_SCENES_KEY]: state.maxVideoScenes,
    [REFACTOR_CONSTANTS.AVG_IMAGE_GENERATOR_ENGINE_KEY]: state.imageGeneratorEngine,
    [REFACTOR_CONSTANTS.AVG_ASPECT_RATIO_KEY]: state.aspectRatio,
    [REFACTOR_CONSTANTS.AVG_STYLE_PRESET_KEY]: state.stylePreset,
    [REFACTOR_CONSTANTS.STYLE_BACKGROUND_MODE_KEY]: state.styleBackgroundMode,
    [REFACTOR_CONSTANTS.STYLE_TEXT_IN_IMAGE_MODE_KEY]: state.styleTextInImageMode,
    [REFACTOR_CONSTANTS.IMAGE_FOCUS_MODE_KEY]: state.imageFocusMode,
    [REFACTOR_CONSTANTS.AVG_THUMBNAIL_COUNT_KEY]: state.thumbnailCount,
    [REFACTOR_CONSTANTS.AVG_THUMBNAIL_STYLE_PRESET_KEY]: state.thumbnailStylePreset,
    [REFACTOR_CONSTANTS.THUMBNAIL_BACKGROUND_MODE_KEY]: state.thumbnailBackgroundMode,
    [REFACTOR_CONSTANTS.THUMBNAIL_TEXT_IN_IMAGE_MODE_KEY]: state.thumbnailTextInImageMode,
    [REFACTOR_CONSTANTS.THUMBNAIL_IMAGE_FOCUS_MODE_KEY]: state.thumbnailImageFocusMode,
  },
});
export const applyPresetConfigToState = (presetConfig: Record<string, unknown>, actions: AutoVideoFormActions) => {
  const applyIfExists = (key: string, setter: (val: any) => void) => {
    const val = _.get(presetConfig, key);
    if (!_.isUndefined(val)) setter(val);
  };
  applyIfExists(REFACTOR_CONSTANTS.AVG_GENRE_KEY, (v) => actions.setGenre(v as string));
  applyIfExists(REFACTOR_CONSTANTS.AVG_LANGUAGE_KEY, (v) => actions.setLanguage(v as ProjectLanguage));
  applyIfExists(REFACTOR_CONSTANTS.AVG_DURATION_KEY, (v) => actions.setDuration(v as string));
  applyIfExists(REFACTOR_CONSTANTS.AVG_SPLIT_STRATEGY_KEY, (v) => actions.setSplitStrategy(v as string));
  applyIfExists(REFACTOR_CONSTANTS.AVG_VOICE_URI_KEY, (v) => actions.setVoiceURI(v as string));
  applyIfExists(REFACTOR_CONSTANTS.AVG_VOICE_NAME_KEY, (v) => actions.setVoiceName(v as string));
  applyIfExists(REFACTOR_CONSTANTS.AVG_ASPECT_RATIO_KEY, (v) => actions.setAspectRatio(v as AspectRatio));
  applyIfExists(REFACTOR_CONSTANTS.AVG_GENERATION_MODE_KEY, (v) => actions.setGenerationMode(v as ImageGenerationMode));
  applyIfExists(REFACTOR_CONSTANTS.AVG_GENERATE_TYPE_KEY, (v) => actions.setGenerateType(v as GenerateType));
  applyIfExists(REFACTOR_CONSTANTS.AVG_STYLE_PRESET_KEY, (v) => actions.setStylePreset(v as string));
  applyIfExists(REFACTOR_CONSTANTS.STYLE_BACKGROUND_MODE_KEY, (v) => actions.setStyleBackgroundMode(normalizeBackgroundMode(v as BackgroundMode)));
  actions.setStyleTextInImageMode(SCENE_TEXT_MODE);
  applyIfExists(REFACTOR_CONSTANTS.IMAGE_FOCUS_MODE_KEY, (v) => actions.setImageFocusMode(v as ImageFocusMode));
  applyIfExists(REFACTOR_CONSTANTS.AVG_MAX_VIDEO_SCENES_KEY, (v) => actions.setMaxVideoScenes(v as number));
  applyIfExists(REFACTOR_CONSTANTS.AVG_THUMBNAIL_COUNT_KEY, (v) => actions.setThumbnailCount(v as number));
  applyIfExists(REFACTOR_CONSTANTS.AVG_THUMBNAIL_STYLE_PRESET_KEY, (v) => actions.setThumbnailStylePreset(v as string));
  applyIfExists(REFACTOR_CONSTANTS.THUMBNAIL_BACKGROUND_MODE_KEY, (v) => actions.setThumbnailBackgroundMode(normalizeBackgroundMode(v as BackgroundMode)));
  applyIfExists(REFACTOR_CONSTANTS.THUMBNAIL_TEXT_IN_IMAGE_MODE_KEY, (v) => actions.setThumbnailTextInImageMode(v as ThumbnailTextMode));
  applyIfExists(REFACTOR_CONSTANTS.THUMBNAIL_IMAGE_FOCUS_MODE_KEY, (v) => actions.setThumbnailImageFocusMode(v as ImageFocusMode));
};
