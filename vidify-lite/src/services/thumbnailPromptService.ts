import _ from "lodash";
import { THUMBNAIL_LAYOUT_CATALOG, THUMBNAIL_PROMPT_CONFIG, ThumbnailLayoutId } from "../constants/thumbnail";
import { CharacterConfig, ThumbnailItem, VisualConfig } from "../types";
import { appendImagePromptAspectRatio } from "./imagePromptQualityService";
import { smartSplitSentences } from "../lib/textProcessor";

const validLayoutIds = new Set<string>(_.map(THUMBNAIL_LAYOUT_CATALOG, "id"));

const getNextLayoutId = (usedLayoutIds: Set<string>, index: number): ThumbnailLayoutId => {
  const unusedLayout = _.find(THUMBNAIL_LAYOUT_CATALOG, layout => !usedLayoutIds.has(layout.id));
  return (unusedLayout || THUMBNAIL_LAYOUT_CATALOG[index % _.size(THUMBNAIL_LAYOUT_CATALOG)]).id;
};

const normalizeThumbnail = (
  source: Partial<ThumbnailItem>,
  index: number,
  usedLayoutIds: Set<string>,
  textMode: string,
): ThumbnailItem => {
  const requestedLayoutId = _.toString(source.layoutId);
  const layoutId = validLayoutIds.has(requestedLayoutId) && !usedLayoutIds.has(requestedLayoutId)
    ? requestedLayoutId as ThumbnailLayoutId
    : getNextLayoutId(usedLayoutIds, index);
  usedLayoutIds.add(layoutId);
  const layoutDefinition = _.find(THUMBNAIL_LAYOUT_CATALOG, { id: layoutId })!;
  const hasText = textMode === THUMBNAIL_PROMPT_CONFIG.NO_TEXT_MODE
    ? false
    : Boolean(source.hasText);
  return {
    id: `th_${_.add(index, 1)}`,
    prompt: _.trim(_.toString(source.prompt)),
    style: _.trim(_.toString(source.style)) || THUMBNAIL_PROMPT_CONFIG.DEFAULT_STYLE,
    hasText,
    textText: hasText ? _.trim(_.toString(source.textText)) : "",
    layoutId,
    layout: _.trim(_.toString(source.layout)) || layoutDefinition.composition,
    layoutRationale: _.trim(_.toString(source.layoutRationale)) || layoutDefinition.bestFor,
    typography: _.trim(_.toString(source.typography)) || THUMBNAIL_PROMPT_CONFIG.DEFAULT_TYPOGRAPHY,
    colorSuggestion: _.trim(_.toString(source.colorSuggestion)) || THUMBNAIL_PROMPT_CONFIG.DEFAULT_COLOR,
    subjectFocus: _.trim(_.toString(source.subjectFocus)),
  };
};

export const normalizeThumbnailIdeas = (
  generatedItems: Partial<ThumbnailItem>[],
  requestedCount: number,
  textMode: string = "auto",
): ThumbnailItem[] => {
  const validGeneratedItems = _.filter(generatedItems, item => !_.isEmpty(_.trim(_.toString(item.prompt))));
  const sourceItems = _.take(validGeneratedItems, requestedCount);
  const usedLayoutIds = new Set<string>();
  return _.map(sourceItems, (item, index) => normalizeThumbnail(
    item,
    index,
    usedLayoutIds,
    textMode,
  ));
};

export const createSourceGroundedThumbnailIdeas = (
  script: string,
  requestedCount: number,
  style: string,
  textMode: string = "auto",
): ThumbnailItem[] => {
  const normalizedScript = _.trim(script);
  const sentences = smartSplitSentences(normalizedScript);
  const sources = _.isEmpty(sentences) ? [normalizedScript] : sentences;
  const generatedItems = _.times(requestedCount, index => {
    const layout = THUMBNAIL_LAYOUT_CATALOG[index % _.size(THUMBNAIL_LAYOUT_CATALOG)];
    const source = sources[index % _.size(sources)];
    const prompt = _.replace(
      _.replace(
        _.replace(THUMBNAIL_PROMPT_CONFIG.SOURCE_FALLBACK_PROMPT_TEMPLATE, THUMBNAIL_PROMPT_CONFIG.SOURCE_TOKEN, source),
        THUMBNAIL_PROMPT_CONFIG.COMPOSITION_TOKEN,
        layout.composition,
      ),
      THUMBNAIL_PROMPT_CONFIG.STYLE_TOKEN,
      style || THUMBNAIL_PROMPT_CONFIG.DEFAULT_STYLE,
    );
    return {
      prompt,
      style: style || THUMBNAIL_PROMPT_CONFIG.DEFAULT_STYLE,
      hasText: false,
      textText: "",
      layoutId: layout.id,
      layout: layout.composition,
      layoutRationale: layout.bestFor,
      subjectFocus: source,
    };
  });
  return normalizeThumbnailIdeas(generatedItems, requestedCount, textMode);
};

export const createThumbnailGenerationPrompt = (
  thumbnail: ThumbnailItem,
  style: string,
  aspectRatio: string,
  hasReferences: boolean = false,
  _characters: CharacterConfig[] = [],
): string => appendImagePromptAspectRatio(_.join(_.compact([
  THUMBNAIL_PROMPT_CONFIG.GENERATION_PREFIX,
  thumbnail.prompt,
  `${THUMBNAIL_PROMPT_CONFIG.LAYOUT_LABEL}: ${thumbnail.layout}`,
  `${THUMBNAIL_PROMPT_CONFIG.SUBJECT_LABEL}: ${thumbnail.subjectFocus}`,
  THUMBNAIL_PROMPT_CONFIG.FULL_BLEED,
  THUMBNAIL_PROMPT_CONFIG.PHONE_READABILITY,
  THUMBNAIL_PROMPT_CONFIG.SAFE_ZONE,
  thumbnail.hasText && !_.isEmpty(thumbnail.textText)
    ? THUMBNAIL_PROMPT_CONFIG.NO_TEXT_BACKGROUND_DIRECTIVE
    : THUMBNAIL_PROMPT_CONFIG.NO_TEXT_DIRECTIVE,
  hasReferences ? THUMBNAIL_PROMPT_CONFIG.REFERENCE_DIRECTIVE : "",
  style,
]), ". "), aspectRatio);

export const resolveThumbnailReferenceImages = (
  visualConfig: Pick<VisualConfig, "characters" | "thumbnailReferenceImages">,
  includeCharacterImages: boolean = false,
): string[] => _.take(_.uniq(_.concat(
  _.defaultTo(visualConfig.thumbnailReferenceImages, []),
  includeCharacterImages
    ? _.flatMap(_.defaultTo(visualConfig.characters, []), character => character.images)
    : [],
)), THUMBNAIL_PROMPT_CONFIG.MAX_REFERENCE_IMAGES);
