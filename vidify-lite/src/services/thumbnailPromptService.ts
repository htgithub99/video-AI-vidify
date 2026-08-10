import _ from "lodash";
import { THUMBNAIL_LAYOUT_CATALOG, THUMBNAIL_PROMPT_CONFIG, ThumbnailLayoutId } from "../constants/thumbnail";
import { CharacterConfig, ThumbnailItem, VisualConfig } from "../types";
import { appendImagePromptAspectRatio } from "./imagePromptQualityService";

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
  fallbackItems: Partial<ThumbnailItem>[],
  requestedCount: number,
  textMode: string = "auto",
): ThumbnailItem[] => {
  const validGeneratedItems = _.filter(generatedItems, item => !_.isEmpty(_.trim(_.toString(item.prompt))));
  const sourceItems = _.take(_.concat(validGeneratedItems, fallbackItems), requestedCount);
  const usedLayoutIds = new Set<string>();
  return _.map(_.range(requestedCount), index => normalizeThumbnail(
    sourceItems[index] || fallbackItems[index % _.max([_.size(fallbackItems), 1])!] || {},
    index,
    usedLayoutIds,
    textMode,
  ));
};

export const createThumbnailGenerationPrompt = (
  thumbnail: ThumbnailItem,
  _style: string,
  aspectRatio: string,
  _hasReferences: boolean = false,
  _characters: CharacterConfig[] = [],
): string => appendImagePromptAspectRatio(thumbnail.prompt, aspectRatio);

export const resolveThumbnailReferenceImages = (
  visualConfig: Pick<VisualConfig, "characters" | "thumbnailReferenceImages">,
  includeCharacterImages: boolean = false,
): string[] => _.take(_.uniq(_.concat(
  _.defaultTo(visualConfig.thumbnailReferenceImages, []),
  includeCharacterImages
    ? _.flatMap(_.defaultTo(visualConfig.characters, []), character => character.images)
    : [],
)), THUMBNAIL_PROMPT_CONFIG.MAX_REFERENCE_IMAGES);
