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
): Promise<boolean> => {
  const response = await safeSystemFetch(API_ROUTES.PIPELINE_VALIDATE_CHARACTER_REFERENCE, {
    name: character.name,
    identity: character.prompt || character.description,
    targetStyle,
    assetUrl,
  }, signal);
  if (!response.success || !response.data?.success) return false;
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
    return false;
  }
  return true;
};

const generateCharacterReference = async (
  projectId: string,
  character: CharacterConfig,
  visualConfig: VisualConfig,
  style: string,
  signal?: AbortSignal,
): Promise<string> => {
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
  return assetUrl;
};

const CHARACTER_REFERENCE_CONFIG_VIEW_TYPES: NonNullable<CharacterConfig["referenceViews"]> = [
  "front",
  "side",
  "three_quarter",
  "expression",
];

const createValidatedReference = async (
  projectId: string,
  character: CharacterConfig,
  visualConfig: VisualConfig,
  style: string,
  existingAssetUrl?: string,
  signal?: AbortSignal,
): Promise<{ assetUrl: string; approved: boolean }> => {
  let assetUrl = existingAssetUrl || await generateCharacterReference(projectId, character, visualConfig, style, signal);
  let approved = await validateCharacterReference(character, assetUrl, style, signal);
  for (let repairAttempt = 0; !approved && repairAttempt < CHARACTER_REFERENCE_CONFIG.MAX_REPAIR_ATTEMPTS; repairAttempt++) {
    try {
      assetUrl = await generateCharacterReference(projectId, character, visualConfig, style, signal);
      approved = await validateCharacterReference(character, assetUrl, style, signal);
    } catch {
      break;
    }
  }
  return { assetUrl, approved };
};

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
      const validation = await createValidatedReference(
        projectId,
        character,
        visualConfig,
        style,
        existingImages[0],
        signal,
      );
      approvedCharacters.push({
        ...approveExistingReference({ ...character, images: _.uniq([validation.assetUrl, ...existingImages]) }),
        referenceApproved: validation.approved,
      });
      continue;
    }
    const validation = await createValidatedReference(projectId, character, visualConfig, style, undefined, signal);
    approvedCharacters.push({
      ...approveExistingReference({ ...character, images: [validation.assetUrl] }),
      referenceApproved: validation.approved,
    });
  }
  return approvedCharacters;
};
