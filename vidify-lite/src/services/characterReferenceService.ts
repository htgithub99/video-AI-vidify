import _ from "lodash";
import { API_ROUTES, CHARACTER_REFERENCE_CONFIG, REFACTOR_CONSTANTS } from "../constants";
import { safeSystemFetch } from "../lib/shared-utils";
import { CharacterConfig, GenerateType, ImageGeneratorEngine, VisualConfig } from "../types";
import { isUsableGeneratedAssetUrl } from "./projectImageGenerationService";

interface CharacterReferenceOptions {
  projectId: string;
  characters: CharacterConfig[];
  visualConfig: VisualConfig;
  targetStyle?: string;
  signal?: AbortSignal;
}

const createCharacterReferencePrompt = (character: CharacterConfig, targetStyle: string): string => _.join(_.compact([
  `${CHARACTER_REFERENCE_CONFIG.MODEL_SHEET_PREFIX} ${character.name}`,
  character.prompt || character.description,
  CHARACTER_REFERENCE_CONFIG.VIEW_DIRECTIVE,
  CHARACTER_REFERENCE_CONFIG.IDENTITY_DIRECTIVE,
  CHARACTER_REFERENCE_CONFIG.LAYOUT_DIRECTIVE,
  CHARACTER_REFERENCE_CONFIG.TEXT_DIRECTIVE,
  _.replace(CHARACTER_REFERENCE_CONFIG.STYLE_TEMPLATE, "{style}", targetStyle),
]), ". ");

const createAssetUrl = (data: Record<string, unknown>): string => {
  const base64 = _.toString(_.get(data, REFACTOR_CONSTANTS.AVG_IMAGE_BASE64_KEY) || _.get(data, REFACTOR_CONSTANTS.AVG_BASE64_KEY));
  const fallbackUrl = _.toString(_.get(data, REFACTOR_CONSTANTS.AVG_FALLBACK_URL_KEY));
  if (!_.isEmpty(base64)) return `${REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX}${base64}`;
  return isUsableGeneratedAssetUrl(fallbackUrl) ? fallbackUrl : REFACTOR_CONSTANTS.VD_EMPTY_STRING;
};

const approveExistingReference = (character: CharacterConfig): CharacterConfig => ({
  ...character,
  images: _.uniq(_.filter(character.images, isUsableGeneratedAssetUrl)),
  referenceApproved: true,
  referenceViews: [...CHARACTER_REFERENCE_CONFIG_VIEW_TYPES],
});

const validateCharacterReference = async (
  character: CharacterConfig,
  assetUrl: string,
  targetStyle: string,
  signal?: AbortSignal,
): Promise<void> => {
  const response = await safeSystemFetch(API_ROUTES.PIPELINE_VALIDATE_CHARACTER_REFERENCE, {
    name: character.name,
    identity: character.prompt || character.description,
    targetStyle,
    assetUrl,
  }, signal);
  if (!response.success || !response.data?.success) throw new Error(CHARACTER_REFERENCE_CONFIG.QA_REQUIRED);
  const quality = response.data.quality;
  const scores = [
    quality.identityConsistencyScore,
    quality.viewCoverageScore,
    quality.styleConsistencyScore,
    quality.anatomyScore,
  ];
  if (!quality.usableAsReference
    || !_.isEmpty(quality.blockingErrors)
    || _.some(scores, score => _.toNumber(score) < CHARACTER_REFERENCE_CONFIG.MIN_QA_SCORE)) {
    throw new Error(CHARACTER_REFERENCE_CONFIG.QA_REJECTED);
  }
};

const CHARACTER_REFERENCE_CONFIG_VIEW_TYPES: NonNullable<CharacterConfig["referenceViews"]> = [
  "front",
  "side",
  "three_quarter",
  "expression",
];

export const generateCharacterReferenceLibrary = async ({
  projectId,
  characters,
  visualConfig,
  targetStyle,
  signal,
}: CharacterReferenceOptions): Promise<CharacterConfig[]> => {
  const style = _.trim(targetStyle) || CHARACTER_REFERENCE_CONFIG.DEFAULT_STYLE;
  const approvedCharacters: CharacterConfig[] = [];
  for (const character of characters) {
    const existingImages = _.filter(character.images, isUsableGeneratedAssetUrl);
    if (character.referenceApproved && !_.isEmpty(existingImages)) {
      await validateCharacterReference(character, existingImages[0], style, signal);
      approvedCharacters.push(approveExistingReference({ ...character, images: existingImages }));
      continue;
    }
    const response = await safeSystemFetch(API_ROUTES.PIPELINE_GENERATE_IMAGE, {
      prompt: createCharacterReferencePrompt(character, style),
      style,
      resolution: visualConfig.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
      engine: visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen,
      sandboxConfig: { projectId },
      visualConfig: {
        ...visualConfig,
        generateType: GenerateType.Image,
        referenceImages: visualConfig.styleReferenceImages,
      },
    }, signal);
    const assetUrl = createAssetUrl(_.defaultTo(response.data, {}));
    if (!response.success || _.isEmpty(assetUrl)) {
      throw new Error(_.replace(CHARACTER_REFERENCE_CONFIG.GENERATION_FAILED, "{name}", character.name));
    }
    await validateCharacterReference(character, assetUrl, style, signal);
    approvedCharacters.push(approveExistingReference({ ...character, images: [assetUrl] }));
  }
  return approvedCharacters;
};
