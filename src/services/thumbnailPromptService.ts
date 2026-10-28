import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import {
  SOURCE_TEMPLATE_INVALID_AI_THUMBNAIL_ARTIFACT,
  SOURCE_TEMPLATE_THUMBNAIL_MISSING,
  SOURCE_TEXT_COLORSUGGESTION,
  SOURCE_TEXT_ID,
  SOURCE_TEXT_LAYOUT,
  SOURCE_TEXT_LAYOUTRATIONALE,
  SOURCE_TEXT_NFC,
  SOURCE_TEXT_REQUIRED,
  SOURCE_TEXT_STYLE,
  SOURCE_TEXT_SUBJECTFOCUS,
  SOURCE_TEXT_SYMBOL_4,
  SOURCE_TEXT_THUMBNAIL_ACCENTWORDS_INVALID,
  SOURCE_TEXT_THUMBNAIL_COUNT_MISMATCH,
  SOURCE_TEXT_THUMBNAIL_GENERATION_PROMPT_MISSING,
  SOURCE_TEXT_THUMBNAIL_HASTEXT_INVALID,
  SOURCE_TEXT_THUMBNAIL_TEXT_MODE_MISMATCH,
  SOURCE_TEXT_TYPOGRAPHY,
  SOURCE_TEXT_TYPOGRAPHYID,
} from "../constants/sourceText";
import _ from "lodash";
import { THUMBNAIL_LAYOUT_CATALOG, THUMBNAIL_PROMPT_CONFIG, ThumbnailLayoutId } from "../constants/thumbnail";
import { CharacterConfig, ThumbnailItem, ThumbnailTextMode, VisualConfig } from "../types";
import { appendImagePromptAspectRatio } from "./imagePromptQualityService";
import { IMAGE_PROMPT_QA_CONFIG } from "../constants/config";
const cleanTextValue = (val: unknown): string => {
  const str = _.trim(_.toString(val));
  if (_.isEmpty(str)) return "";
  return str.normalize(SOURCE_TEXT_NFC);
};
export const normalizeThumbnailHeadline = (value: unknown): string => cleanTextValue(value).replace(/\s+/g, RT_SHARED.SYMBOL_36A9E7).trim().normalize(SOURCE_TEXT_NFC);
const normalizeThumbnail = (source: Partial<ThumbnailItem>, textMode: string): ThumbnailItem => {
  const hasText = Boolean(source.hasText);
  if (hasText !== !_.isEqual(textMode, THUMBNAIL_PROMPT_CONFIG.NO_TEXT_MODE)) throw new Error(SOURCE_TEXT_THUMBNAIL_TEXT_MODE_MISMATCH);
  const generationPrompt = source.generationPrompt as string;
  return {
    id: source.id as string,
    prompt: generationPrompt,
    generationPrompt,
    style: source.style as string,
    hasText,
    textText: source.textText as string,
    layoutId: source.layoutId,
    layout: source.layout as string,
    layoutRationale: source.layoutRationale as string,
    typography: source.typography as string,
    typographyId: source.typographyId,
    accentWords: source.accentWords as string[],
    colorSuggestion: source.colorSuggestion as string,
    subjectFocus: source.subjectFocus as string,
  };
};
export const normalizeThumbnailIdeas = (generatedItems: Partial<ThumbnailItem>[], requestedCount: number, textMode: string = ThumbnailTextMode.Headline): ThumbnailItem[] => {
  const issues = getThumbnailTechnicalPlanningIssues(generatedItems, requestedCount, textMode);
  if (!_.isEmpty(issues)) throw new Error(SOURCE_TEMPLATE_INVALID_AI_THUMBNAIL_ARTIFACT(`${_.join(issues, SOURCE_TEXT_SYMBOL_4)}`));
  return _.map(generatedItems, (item) => normalizeThumbnail(item, textMode));
};
export const resolveThumbnailGenerationPrompt = (thumbnail: ThumbnailItem, _cinematicMode: boolean, style: string, aspectRatio: string, hasReferences?: boolean, characters?: CharacterConfig[]): string => createThumbnailGenerationPrompt(thumbnail, style, aspectRatio, hasReferences, characters);
export const getThumbnailTechnicalPlanningIssues = (generatedItems: Array<Partial<ThumbnailItem>>, requestedCount: number = _.size(generatedItems), textMode: string = ThumbnailTextMode.Headline): string[] =>
  (() => {
    const ids = _.map(generatedItems, (item) => _.trim(_.toString(item.id)));
    return _.uniq(
      _.compact(
        _.concat(
          [!_.isEqual(_.size(generatedItems), requestedCount) && SOURCE_TEXT_THUMBNAIL_COUNT_MISMATCH, _.some(ids, _.isEmpty) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.MISSING_ID, _.uniq(ids).length !== ids.length && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.DUPLICATE_ID],
          _.flatMap(generatedItems, (item) => {
            const layout = _.find(THUMBNAIL_LAYOUT_CATALOG, { id: item.layoutId as ThumbnailLayoutId });
            const generationPrompt = cleanTextValue(item.generationPrompt || item.prompt);
            const headline = cleanTextValue(item.textText);
            const hasText = !_.isEqual(textMode, THUMBNAIL_PROMPT_CONFIG.NO_TEXT_MODE);
            const headlineWordCount = _.size(_.words(headline, /[^\s]+/g));
            return _.compact([
              ..._.map([SOURCE_TEXT_ID, SOURCE_TEXT_STYLE, SOURCE_TEXT_LAYOUT, SOURCE_TEXT_LAYOUTRATIONALE, SOURCE_TEXT_TYPOGRAPHY, SOURCE_TEXT_TYPOGRAPHYID, SOURCE_TEXT_COLORSUGGESTION, SOURCE_TEXT_SUBJECTFOCUS], (field) => _.isEmpty(_.trim(_.toString(_.get(item, field)))) && SOURCE_TEMPLATE_THUMBNAIL_MISSING(`${field}`)),
              !_.isBoolean(item.hasText) && SOURCE_TEXT_THUMBNAIL_HASTEXT_INVALID,
              !_.isArray(item.accentWords) && SOURCE_TEXT_THUMBNAIL_ACCENTWORDS_INVALID,
              _.isEmpty(generationPrompt) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.MISSING_PROMPT,
              !layout && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.INVALID_LAYOUT,
              layout && !_.isEqual(item.typographyId, layout.typographyId) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.TYPOGRAPHY_MISMATCH,
              hasText && _.isEmpty(headline) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.MISSING_HEADLINE,
              hasText && !_.isEmpty(headline) && !_.includes(generationPrompt.normalize(SOURCE_TEXT_NFC), headline.normalize(SOURCE_TEXT_NFC)) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.HEADLINE_NOT_IN_PROMPT,
              hasText && (headlineWordCount > THUMBNAIL_PROMPT_CONFIG.MAX_TEXT_WORDS || _.size(headline) > THUMBNAIL_PROMPT_CONFIG.MAX_TEXT_CHARACTERS) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.HEADLINE_TOO_LONG,
              layout && _.includes(layout.arrowPolicy, SOURCE_TEXT_REQUIRED) && !THUMBNAIL_PROMPT_CONFIG.ARROW_PATTERN.test(generationPrompt) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.ARROW_POLICY_MISMATCH,
              !hasText && !THUMBNAIL_PROMPT_CONFIG.TEXT_FREE_PATTERN.test(generationPrompt) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.TEXT_POLICY_MISMATCH,
            ]);
          }),
        ),
      ),
    );
  })();
export const createThumbnailGenerationPrompt = (thumbnail: ThumbnailItem, _style: string, aspectRatio: string, _hasReferences?: boolean, _characters?: CharacterConfig[]): string => {
  const aiAuthoredPrompt = _.trim(_.toString(thumbnail.generationPrompt || thumbnail.prompt));
  if (_.isEmpty(aiAuthoredPrompt)) throw new Error(SOURCE_TEXT_THUMBNAIL_GENERATION_PROMPT_MISSING);
  return appendImagePromptAspectRatio(aiAuthoredPrompt, aspectRatio);
};
export const getThumbnailPlanningIssues = (generatedItems: Array<Partial<ThumbnailItem>>, textMode: string, requestedCount: number = _.size(generatedItems), styleLock: string = ""): string[] =>
  _.uniq(
    _.concat(
      !_.isEqual(_.size(generatedItems), requestedCount) ? [SOURCE_TEXT_THUMBNAIL_COUNT_MISMATCH] : [],
      _.flatMap(generatedItems, (item) => {
        const layout = _.find(THUMBNAIL_LAYOUT_CATALOG, { id: item.layoutId as ThumbnailLayoutId });
        const generationPrompt = cleanTextValue(item.generationPrompt || item.prompt);
        const headline = cleanTextValue(item.textText);
        const headlineWordCount = _.size(_.words(headline, /[^\s]+/g));
        const hasText = !_.isEqual(textMode, THUMBNAIL_PROMPT_CONFIG.NO_TEXT_MODE);
        const containsAspectRatio = IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN.test(generationPrompt);
        IMAGE_PROMPT_QA_CONFIG.ASPECT_FLAG_PATTERN.lastIndex = 0;
        const normalizedPrompt = _.join(_.words(_.toLower(_.deburr(generationPrompt))), RT_SHARED.SYMBOL_36A9E7);
        const normalizedStyleLock = _.join(_.words(_.toLower(_.deburr(styleLock))), RT_SHARED.SYMBOL_36A9E7);
        return _.compact([
          ..._.map([SOURCE_TEXT_ID, SOURCE_TEXT_STYLE, SOURCE_TEXT_LAYOUT, SOURCE_TEXT_LAYOUTRATIONALE, SOURCE_TEXT_TYPOGRAPHY, SOURCE_TEXT_TYPOGRAPHYID, SOURCE_TEXT_COLORSUGGESTION, SOURCE_TEXT_SUBJECTFOCUS], (field) => _.isEmpty(_.trim(_.toString(_.get(item, field)))) && SOURCE_TEMPLATE_THUMBNAIL_MISSING(`${field}`)),
          !_.isBoolean(item.hasText) && SOURCE_TEXT_THUMBNAIL_HASTEXT_INVALID,
          !_.isArray(item.accentWords) && SOURCE_TEXT_THUMBNAIL_ACCENTWORDS_INVALID,
          !layout && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.INVALID_LAYOUT,
          layout && !_.isEqual(item.typographyId, layout.typographyId) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.TYPOGRAPHY_MISMATCH,
          _.isEmpty(generationPrompt) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.MISSING_PROMPT,
          hasText && _.isEmpty(headline) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.MISSING_HEADLINE,
          hasText && (headlineWordCount > THUMBNAIL_PROMPT_CONFIG.MAX_TEXT_WORDS || _.size(headline) > THUMBNAIL_PROMPT_CONFIG.MAX_TEXT_CHARACTERS) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.HEADLINE_TOO_LONG,
          hasText && THUMBNAIL_PROMPT_CONFIG.WEAK_HEADLINE_PREFIX_PATTERN.test(headline) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.HEADLINE_WEAK_PREFIX,
          hasText && !_.isEmpty(headline) && !_.includes(generationPrompt.normalize(SOURCE_TEXT_NFC), headline) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.HEADLINE_NOT_IN_PROMPT,
          layout && _.includes(layout.arrowPolicy, SOURCE_TEXT_REQUIRED) && !THUMBNAIL_PROMPT_CONFIG.ARROW_PATTERN.test(generationPrompt) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.ARROW_POLICY_MISMATCH,
          !hasText && !THUMBNAIL_PROMPT_CONFIG.TEXT_FREE_PATTERN.test(generationPrompt) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.TEXT_POLICY_MISMATCH,
          containsAspectRatio && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.ASPECT_RATIO_PRESENT,
          !_.isEmpty(normalizedStyleLock) && !_.includes(normalizedPrompt, normalizedStyleLock) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.STYLE_LOCK_MISSING,
        ]) as string[];
      }),
    ),
  );
export const resolveThumbnailReferenceImages = (visualConfig: Partial<Pick<VisualConfig, "styleReferenceImages" | "thumbnailReferenceImages" | "thumbnailSceneReferenceImages">> = {}): string[] => {
  const sceneStyleReference = _.first(_.defaultTo(visualConfig.styleReferenceImages, []));
  const thumbnailPresentationReferences = _.defaultTo(visualConfig.thumbnailReferenceImages, []);
  const thumbnailSceneReferences = _.defaultTo(visualConfig.thumbnailSceneReferenceImages, []);
  return _.take(_.uniq(_.compact(_.concat(sceneStyleReference, thumbnailPresentationReferences, thumbnailSceneReferences))) as string[], THUMBNAIL_PROMPT_CONFIG.MAX_REFERENCE_IMAGES);
};
