import _ from "lodash";
import {
  ImageGenerationMode,
  ImageGeneratorEngine,
  GenerateType,
} from "../../types";
import { REFACTOR_CONSTANTS } from "../../constants";
import { AUTO_GENERATOR_PANEL_TEXTS } from "../../constants/texts";
import { Lang } from "../../lib/lang";

export const getAutoVideoTexts = (language: Lang) =>
  AUTO_GENERATOR_PANEL_TEXTS[language as "vi" | "en"] ||
  AUTO_GENERATOR_PANEL_TEXTS.vi;

export const getSplitLabels = (
  texts: ReturnType<typeof getAutoVideoTexts>,
) => ({
  word: texts.splitWord,
  short_sentence: texts.splitShort,
  long_sentence: texts.splitLong,
  mixed_sentences: texts.splitMixed,
  paragraph: texts.splitParagraph,
});

export const getImageEngineOptions = (
  generationMode: ImageGenerationMode,
  generationType: GenerateType,
): { value: ImageGeneratorEngine; label: string }[] => {
  if (_.isEqual(generationMode, ImageGenerationMode.GeminiChat)) {
    return [
      {
        value: ImageGeneratorEngine.Imagen,
        label: REFACTOR_CONSTANTS.ENGINE_IMAGEN,
      },
      {
        value: ImageGeneratorEngine.Veo3,
        label: REFACTOR_CONSTANTS.ENGINE_VEO3,
      },
      {
        value: ImageGeneratorEngine.LabsSandbox,
        label: REFACTOR_CONSTANTS.ENGINE_LABS_SANDBOX,
      },
    ];
  }

  if (_.includes([GenerateType.Video, GenerateType.Mixed], generationType)) {
    return [
      {
        value: ImageGeneratorEngine.Veo3,
        label: REFACTOR_CONSTANTS.ENGINE_OMNI_FLASH,
      },
      {
        value: ImageGeneratorEngine.Veo3Lite,
        label: REFACTOR_CONSTANTS.ENGINE_VEO3_LITE,
      },
      {
        value: ImageGeneratorEngine.Veo3Fast,
        label: REFACTOR_CONSTANTS.ENGINE_VEO3_FAST,
      },
      {
        value: ImageGeneratorEngine.Veo3Quality,
        label: REFACTOR_CONSTANTS.ENGINE_VEO3_QUALITY,
      },
    ];
  }

  return [
    {
      value: ImageGeneratorEngine.Imagen,
      label: REFACTOR_CONSTANTS.ENGINE_IMAGEN_3_BATCH,
    },
    {
      value: ImageGeneratorEngine.Veo3,
      label: REFACTOR_CONSTANTS.ENGINE_VEO_3_0_FLUID,
    },
    {
      value: ImageGeneratorEngine.LabsSandbox,
      label: REFACTOR_CONSTANTS.ENGINE_LABS_SANDBOX_STILL,
    },
  ];
};

export const truncateWords = (text: string, maxWords: number): string => {
  const words = _.words(text);
  return _.gt(words.length, maxWords)
    ? _.join(_.take(words, maxWords), REFACTOR_CONSTANTS.VD_BLANK) +
        REFACTOR_CONSTANTS.AVG_ELLIPSIS
    : text;
};
