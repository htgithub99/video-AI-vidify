import _ from "lodash";
import {
  THUMBNAIL_LAYOUT_CATALOG,
  THUMBNAIL_PROMPT_CONFIG,
  ThumbnailLayoutId,
} from "../constants/thumbnail";
import { ThumbnailItem, VisualConfig } from "../types";
import { sanitizeImagePrompt } from "./imagePromptQualityService";
import { applyImagePromptDirectives } from "../lib/imagePromptDirectives";

const validLayoutIds = new Set<string>(_.map(THUMBNAIL_LAYOUT_CATALOG, "id"));

const getNextLayoutId = (
  usedLayoutIds: Set<string>,
  index: number,
): ThumbnailLayoutId => {
  const unusedLayout = _.find(
    THUMBNAIL_LAYOUT_CATALOG,
    (layout) => !usedLayoutIds.has(layout.id),
  );
  return (
    unusedLayout ||
    THUMBNAIL_LAYOUT_CATALOG[index % _.size(THUMBNAIL_LAYOUT_CATALOG)]
  ).id;
};

const normalizeThumbnail = (
  source: Partial<ThumbnailItem>,
  index: number,
  usedLayoutIds: Set<string>,
  textMode: string,
): ThumbnailItem => {
  const requestedLayoutId = _.toString(source.layoutId);
  const layoutId =
    validLayoutIds.has(requestedLayoutId) &&
    !usedLayoutIds.has(requestedLayoutId)
      ? (requestedLayoutId as ThumbnailLayoutId)
      : getNextLayoutId(usedLayoutIds, index);
  usedLayoutIds.add(layoutId);
  const layoutDefinition = _.find(THUMBNAIL_LAYOUT_CATALOG, (layout) =>
    _.isEqual(layout.id, layoutId),
  )!;
  const hasText =
    textMode === THUMBNAIL_PROMPT_CONFIG.NO_TEXT_MODE
      ? false
      : Boolean(source.hasText);
  return {
    id: `th_${_.add(index, 1)}`,
    prompt: _.trim(_.toString(source.prompt)),
    style:
      _.trim(_.toString(source.style)) || THUMBNAIL_PROMPT_CONFIG.DEFAULT_STYLE,
    hasText,
    textText: hasText ? _.trim(_.toString(source.textText)) : "",
    layoutId,
    layout: _.trim(_.toString(source.layout)) || layoutDefinition.composition,
    layoutRationale:
      _.trim(_.toString(source.layoutRationale)) || layoutDefinition.bestFor,
    typography:
      _.trim(_.toString(source.typography)) ||
      THUMBNAIL_PROMPT_CONFIG.DEFAULT_TYPOGRAPHY,
    colorSuggestion:
      _.trim(_.toString(source.colorSuggestion)) ||
      THUMBNAIL_PROMPT_CONFIG.DEFAULT_COLOR,
    subjectFocus: _.trim(_.toString(source.subjectFocus)),
  };
};

export const normalizeThumbnailIdeas = (
  generatedItems: Partial<ThumbnailItem>[],
  fallbackItems: Partial<ThumbnailItem>[],
  requestedCount: number,
  textMode: string = "auto",
): ThumbnailItem[] => {
  const validGeneratedItems = _.filter(
    generatedItems,
    (item) => !_.isEmpty(_.trim(_.toString(item.prompt))),
  );
  const sourceItems = _.take(
    _.concat(validGeneratedItems, fallbackItems),
    requestedCount,
  );
  const usedLayoutIds = new Set<string>();
  return _.map(_.range(requestedCount), (index) =>
    normalizeThumbnail(
      sourceItems[index] ||
        fallbackItems[index % _.max([_.size(fallbackItems), 1])!] ||
        {},
      index,
      usedLayoutIds,
      textMode,
    ),
  );
};

export const createThumbnailGenerationPrompt = (
  thumbnail: ThumbnailItem,
  style: string,
  aspectRatio: string,
  hasReferences: boolean = false,
): string => {
  const layoutDefinition = _.find(THUMBNAIL_LAYOUT_CATALOG, (layout) =>
    _.isEqual(layout.id, thumbnail.layoutId),
  );
  const textDirective =
    thumbnail.hasText && !_.isEmpty(thumbnail.textText)
      ? `${THUMBNAIL_PROMPT_CONFIG.TEXT_DIRECTIVE}: "${thumbnail.textText}"`
      : THUMBNAIL_PROMPT_CONFIG.NO_TEXT_DIRECTIVE;
  return sanitizeImagePrompt(
    _.join(
      _.compact([
        `${THUMBNAIL_PROMPT_CONFIG.GENERATION_PREFIX} for ${aspectRatio}`,
        thumbnail.prompt,
        `${THUMBNAIL_PROMPT_CONFIG.LAYOUT_LABEL}: ${layoutDefinition?.composition || thumbnail.layout}`,
        `${THUMBNAIL_PROMPT_CONFIG.SUBJECT_LABEL}: ${thumbnail.subjectFocus}`,
        `${THUMBNAIL_PROMPT_CONFIG.TEXT_LABEL}: ${textDirective}`,
        THUMBNAIL_PROMPT_CONFIG.PHONE_READABILITY,
        THUMBNAIL_PROMPT_CONFIG.SAFE_ZONE,
        THUMBNAIL_PROMPT_CONFIG.FULL_BLEED,
        hasReferences ? THUMBNAIL_PROMPT_CONFIG.REFERENCE_DIRECTIVE : "",
        style,
      ]),
      ", ",
    ),
  );
};

export const resolveThumbnailReferenceImages = (
  visualConfig: Pick<VisualConfig, "characters" | "thumbnailReferenceImages">,
): string[] =>
  _.take(
    _.uniq(
      _.concat(
        _.defaultTo(visualConfig.thumbnailReferenceImages, []),
        _.flatMap(
          _.defaultTo(visualConfig.characters, []),
          (character) => character.images,
        ),
      ),
    ),
    THUMBNAIL_PROMPT_CONFIG.MAX_REFERENCE_IMAGES,
  );

export const applyThumbnailPromptDirectives = (
  prompt: string,
  visualConfig: Pick<
    VisualConfig,
    | "thumbnailBackgroundMode"
    | "thumbnailTextInImageMode"
    | "thumbnailImageFocusMode"
  >,
): string =>
  applyImagePromptDirectives(prompt, {
    backgroundMode: visualConfig.thumbnailBackgroundMode,
    textMode: visualConfig.thumbnailTextInImageMode,
    focusMode: visualConfig.thumbnailImageFocusMode,
  });
