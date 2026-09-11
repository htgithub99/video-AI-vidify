import _ from "lodash";
import {
  THUMBNAIL_LAYOUT_CATALOG,
  THUMBNAIL_PROMPT_CONFIG,
  ThumbnailLayoutId,
} from "../constants/thumbnail";
import { CharacterConfig, ThumbnailItem, ThumbnailTextMode, VisualConfig } from "../types";
import { appendImagePromptAspectRatio } from "./imagePromptQualityService";
import { IMAGE_PROMPT_QA_CONFIG } from "../constants/config";

const cleanTextValue = (val: unknown): string => {
  const str = _.trim(_.toString(val));
  if (_.isEmpty(str)) return "";
  return str.replace(/^["'«“]+|["'»”]+$/g, "").normalize("NFC");
};

export const normalizeThumbnailHeadline = (value: unknown): string => cleanTextValue(value).replace(/\s+/g, " ").trim().normalize("NFC");

const normalizeThumbnail = (source: Partial<ThumbnailItem>, textMode: string): ThumbnailItem => {
  const hasText = Boolean(source.hasText);
  if (hasText !== !_.isEqual(textMode, THUMBNAIL_PROMPT_CONFIG.NO_TEXT_MODE)) throw new Error("thumbnail_text_mode_mismatch");
  const generationPrompt = _.trim(_.toString(source.generationPrompt || source.prompt));

  return {
    id: _.toString(source.id),
    prompt: generationPrompt,
    generationPrompt,
    style: _.trim(_.toString(source.style)),
    hasText,
    textText: _.trim(_.toString(source.textText)).normalize("NFC"),
    layoutId: source.layoutId,
    layout: _.trim(_.toString(source.layout)),
    layoutRationale: _.trim(_.toString(source.layoutRationale)),
    typography: _.trim(_.toString(source.typography)),
    typographyId: source.typographyId,
    accentWords: _.uniq(_.compact(_.castArray(source.accentWords))),
    colorSuggestion: _.trim(_.toString(source.colorSuggestion)),
    subjectFocus: _.trim(_.toString(source.subjectFocus)),
  };
};

export const normalizeThumbnailIdeas = (generatedItems: Partial<ThumbnailItem>[], requestedCount: number, textMode: string = ThumbnailTextMode.Headline): ThumbnailItem[] => {
  if (!_.isEqual(_.size(generatedItems), requestedCount)) throw new Error("thumbnail_count_mismatch");
  return _.map(generatedItems, (item) => normalizeThumbnail(item, textMode));
};

export const resolveThumbnailGenerationPrompt = (
  thumbnail: ThumbnailItem,
  _cinematicMode: boolean,
  style: string,
  aspectRatio: string,
  hasReferences?: boolean,
  characters?: CharacterConfig[],
): string =>
  createThumbnailGenerationPrompt(thumbnail, style, aspectRatio, hasReferences, characters);

export const getThumbnailTechnicalPlanningIssues = (
  generatedItems: Array<Partial<ThumbnailItem>>,
  requestedCount: number = _.size(generatedItems),
  textMode: string = ThumbnailTextMode.Headline,
): string[] =>
  (() => {
    const ids = _.map(generatedItems, (item) => _.trim(_.toString(item.id)));
    return _.uniq(
      _.compact(
        _.concat(
          [
            _.lt(_.size(generatedItems), requestedCount) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.INSUFFICIENT_COUNT,
            _.some(ids, _.isEmpty) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.MISSING_ID,
            _.uniq(ids).length !== ids.length && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.DUPLICATE_ID,
          ],
          _.flatMap(generatedItems, (item) => {
            const layout = _.find(THUMBNAIL_LAYOUT_CATALOG, { id: item.layoutId as ThumbnailLayoutId });
            const generationPrompt = cleanTextValue(item.generationPrompt || item.prompt);
            const headline = cleanTextValue(item.textText);
            const hasText = !_.isEqual(textMode, THUMBNAIL_PROMPT_CONFIG.NO_TEXT_MODE);
            const headlineWordCount = _.size(_.words(headline, /[^\s]+/g));
            return _.compact([
              ..._.map(
                ["id", "style", "layout", "layoutRationale", "typography", "typographyId", "colorSuggestion", "subjectFocus"],
                (field) => _.isEmpty(_.trim(_.toString(_.get(item, field)))) && `thumbnail_${field}_missing`,
              ),
              !_.isBoolean(item.hasText) && "thumbnail_hasText_invalid",
              !_.isArray(item.accentWords) && "thumbnail_accentWords_invalid",
              _.isEmpty(generationPrompt) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.MISSING_PROMPT,
              !layout && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.INVALID_LAYOUT,
              layout && !_.isEqual(item.typographyId, layout.typographyId) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.TYPOGRAPHY_MISMATCH,
              hasText && _.isEmpty(headline) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.MISSING_HEADLINE,
              hasText && !_.isEmpty(headline) && !_.includes(generationPrompt.normalize("NFC"), headline.normalize("NFC")) &&
                THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.HEADLINE_NOT_IN_PROMPT,
              hasText &&
                (headlineWordCount > THUMBNAIL_PROMPT_CONFIG.MAX_TEXT_WORDS || _.size(headline) > THUMBNAIL_PROMPT_CONFIG.MAX_TEXT_CHARACTERS) &&
                THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.HEADLINE_TOO_LONG,
              layout &&
                _.includes(layout.arrowPolicy, "required") &&
                !THUMBNAIL_PROMPT_CONFIG.ARROW_PATTERN.test(generationPrompt) &&
                THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.ARROW_POLICY_MISMATCH,
              !hasText && !THUMBNAIL_PROMPT_CONFIG.TEXT_FREE_PATTERN.test(generationPrompt) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.TEXT_POLICY_MISMATCH,
            ]);
          }),
        ),
      ),
    );
  })();

export const createThumbnailGenerationPrompt = (
  thumbnail: ThumbnailItem,
  _style: string,
  aspectRatio: string,
  _hasReferences?: boolean,
  _characters?: CharacterConfig[],
): string => {
  const aiAuthoredPrompt = _.trim(_.toString(thumbnail.generationPrompt || thumbnail.prompt));
  if (_.isEmpty(aiAuthoredPrompt)) throw new Error("thumbnail_generation_prompt_missing");
  return appendImagePromptAspectRatio(aiAuthoredPrompt, aspectRatio);
};

export const getThumbnailPlanningIssues = (
  generatedItems: Array<Partial<ThumbnailItem>>,
  textMode: string,
  requestedCount: number = _.size(generatedItems),
  styleLock: string = "",
): string[] =>
  _.uniq(
    _.concat(
      _.lt(_.size(generatedItems), requestedCount) ? [THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.INSUFFICIENT_COUNT] : [],
      _.flatMap(generatedItems, (item) => {
        const layout = _.find(THUMBNAIL_LAYOUT_CATALOG, { id: item.layoutId as ThumbnailLayoutId });
        const generationPrompt = cleanTextValue(item.generationPrompt || item.prompt);
        const headline = cleanTextValue(item.textText);
        const headlineWordCount = _.size(_.words(headline, /[^\s]+/g));
        const hasText = !_.isEqual(textMode, THUMBNAIL_PROMPT_CONFIG.NO_TEXT_MODE);
        const containsAspectRatio = IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN.test(generationPrompt);
        IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN.lastIndex = 0;
        const normalizedPrompt = _.join(_.words(_.toLower(_.deburr(generationPrompt))), " ");
        const normalizedStyleLock = _.join(_.words(_.toLower(_.deburr(styleLock))), " ");

        return _.compact([
          ..._.map(
            ["id", "style", "layout", "layoutRationale", "typography", "typographyId", "colorSuggestion", "subjectFocus"],
            (field) => _.isEmpty(_.trim(_.toString(_.get(item, field)))) && `thumbnail_${field}_missing`,
          ),
          !_.isBoolean(item.hasText) && "thumbnail_hasText_invalid",
          !_.isArray(item.accentWords) && "thumbnail_accentWords_invalid",
          !layout && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.INVALID_LAYOUT,
          layout && !_.isEqual(item.typographyId, layout.typographyId) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.TYPOGRAPHY_MISMATCH,
          _.isEmpty(generationPrompt) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.MISSING_PROMPT,
          hasText && _.isEmpty(headline) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.MISSING_HEADLINE,
          hasText &&
            (headlineWordCount > THUMBNAIL_PROMPT_CONFIG.MAX_TEXT_WORDS || _.size(headline) > THUMBNAIL_PROMPT_CONFIG.MAX_TEXT_CHARACTERS) &&
            THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.HEADLINE_TOO_LONG,
          hasText && THUMBNAIL_PROMPT_CONFIG.WEAK_HEADLINE_PREFIX_PATTERN.test(headline) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.HEADLINE_WEAK_PREFIX,
          hasText && !_.isEmpty(headline) && !_.includes(generationPrompt.normalize("NFC"), headline) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.HEADLINE_NOT_IN_PROMPT,
          layout &&
            _.includes(layout.arrowPolicy, "required") &&
            !THUMBNAIL_PROMPT_CONFIG.ARROW_PATTERN.test(generationPrompt) &&
            THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.ARROW_POLICY_MISMATCH,
          !hasText && !THUMBNAIL_PROMPT_CONFIG.TEXT_FREE_PATTERN.test(generationPrompt) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.TEXT_POLICY_MISMATCH,
          containsAspectRatio && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.ASPECT_RATIO_PRESENT,
          !_.isEmpty(normalizedStyleLock) && !_.includes(normalizedPrompt, normalizedStyleLock) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.STYLE_LOCK_MISSING,
        ]) as string[];
      }),
    ),
  );

export const resolveThumbnailReferenceImages = (
  visualConfig: Partial<Pick<VisualConfig, "styleReferenceImages" | "thumbnailReferenceImages" | "thumbnailSceneReferenceImages">> = {},
): string[] => {
  const sceneStyleReference = _.first(_.defaultTo(visualConfig.styleReferenceImages, []));
  const thumbnailPresentationReferences = _.defaultTo(visualConfig.thumbnailReferenceImages, []);
  const thumbnailSceneReferences = _.defaultTo(visualConfig.thumbnailSceneReferenceImages, []);
  return _.take(
    _.uniq(_.compact(_.concat(sceneStyleReference, thumbnailPresentationReferences, thumbnailSceneReferences))) as string[],
    THUMBNAIL_PROMPT_CONFIG.MAX_REFERENCE_IMAGES,
  );
};
