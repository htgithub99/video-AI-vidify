import _ from "lodash";
import { LEGACY_THUMBNAIL_LAYOUT_MAP, THUMBNAIL_LAYOUT_CATALOG, THUMBNAIL_PROMPT_CONFIG, THUMBNAIL_TYPOGRAPHY_CATALOG, ThumbnailLayoutId, ThumbnailTypographyId } from "../constants/thumbnail";
import { CharacterConfig, ThumbnailItem, ThumbnailTextMode, VisualConfig } from "../types";
import { appendImagePromptAspectRatio, sanitizeImagePrompt } from "./imagePromptQualityService";
import { smartSplitSentences } from "../lib/textProcessor";
import { IMAGE_PROMPT_QA_CONFIG } from "../constants/config";
import { resolveStylePreset } from "../constants/stylePresets";

const VALID_LAYOUT_IDS = new Set<string>(_.map(THUMBNAIL_LAYOUT_CATALOG, "id"));
const VALID_TYPOGRAPHY_IDS = new Set<string>(_.map(THUMBNAIL_TYPOGRAPHY_CATALOG, "id"));

const getNextLayoutId = (usedLayoutIds: Set<string>, index: number): ThumbnailLayoutId => {
  const unusedLayout = _.find(THUMBNAIL_LAYOUT_CATALOG, (layout) => !usedLayoutIds.has(layout.id));
  return (unusedLayout || THUMBNAIL_LAYOUT_CATALOG[index % _.size(THUMBNAIL_LAYOUT_CATALOG)]).id;
};

const resolveLayoutId = (sourceLayoutId: unknown, usedLayoutIds: Set<string>, index: number): ThumbnailLayoutId => {
  const rawId = _.toString(sourceLayoutId);
  const mappedId = _.get(LEGACY_THUMBNAIL_LAYOUT_MAP, rawId, rawId);
  const layoutId = VALID_LAYOUT_IDS.has(mappedId) ? (mappedId as ThumbnailLayoutId) : getNextLayoutId(usedLayoutIds, index);
  usedLayoutIds.add(layoutId);
  return layoutId;
};

const resolveTypographyId = (sourceTypographyId: unknown, templateTypographyId: ThumbnailTypographyId): ThumbnailTypographyId => {
  if (VALID_TYPOGRAPHY_IDS.has(templateTypographyId)) {
    return templateTypographyId;
  }
  const requestedId = _.toString(sourceTypographyId);
  if (VALID_TYPOGRAPHY_IDS.has(requestedId)) {
    return requestedId as ThumbnailTypographyId;
  }
  return THUMBNAIL_PROMPT_CONFIG.DEFAULT_TYPOGRAPHY_ID;
};

const cleanTextValue = (val: unknown): string => {
  const str = _.trim(_.toString(val));
  if (_.isEmpty(str)) return "";
  return str.replace(/^["'«“]+|["'»”]+$/g, "").normalize("NFC");
};

export const normalizeThumbnailHeadline = (value: unknown): string => cleanTextValue(value).replace(/\s+/g, " ").trim().normalize("NFC");

const normalizeThumbnail = (source: Partial<ThumbnailItem>, index: number, usedLayoutIds: Set<string>, textMode: string): ThumbnailItem => {
  const layoutId = resolveLayoutId(source.layoutId, usedLayoutIds, index);
  const layoutDefinition = _.find(THUMBNAIL_LAYOUT_CATALOG, { id: layoutId })!;
  const typographyId = resolveTypographyId(source.typographyId, layoutDefinition.typographyId);
  const typographyDefinition = _.find(THUMBNAIL_TYPOGRAPHY_CATALOG, { id: typographyId })!;
  const hasText = !_.isEqual(textMode, THUMBNAIL_PROMPT_CONFIG.NO_TEXT_MODE);
  const sourceHeadline = cleanTextValue(source.textText);
  const textText = hasText ? normalizeThumbnailHeadline(sourceHeadline) : "";
  const rawGenerationPrompt = cleanTextValue(source.generationPrompt || source.prompt);
  const generationPrompt = rawGenerationPrompt;

  return {
    id: `${THUMBNAIL_PROMPT_CONFIG.ID_PREFIX}${_.add(index, 1)}`,
    prompt: generationPrompt,
    generationPrompt,
    style: _.trim(_.toString(source.style)) || THUMBNAIL_PROMPT_CONFIG.DEFAULT_STYLE,
    hasText,
    textText,
    layoutId,
    layout: _.trim(_.toString(source.layout)) || layoutDefinition.composition,
    layoutRationale: _.trim(_.toString(source.layoutRationale)) || layoutDefinition.bestFor,
    typography: typographyDefinition.description,
    typographyId,
    accentWords: _.uniq(_.compact(_.castArray(source.accentWords))),
    colorSuggestion: _.trim(_.toString(source.colorSuggestion)) || THUMBNAIL_PROMPT_CONFIG.DEFAULT_COLOR,
    subjectFocus: _.trim(_.toString(source.subjectFocus)),
  };
};

export const normalizeThumbnailIdeas = (generatedItems: Partial<ThumbnailItem>[], requestedCount: number, textMode: string = ThumbnailTextMode.Headline): ThumbnailItem[] => {
  const validGeneratedItems = _.filter(generatedItems, (item) => !_.isEmpty(_.trim(_.toString(item.generationPrompt || item.prompt))));
  const sourceItems = _.take(validGeneratedItems, requestedCount);
  const usedLayoutIds = new Set<string>();

  return _.map(sourceItems, (item, index) => normalizeThumbnail(item, index, usedLayoutIds, textMode));
};

export const createSourceGroundedThumbnailIdeas = (script: string, requestedCount: number, style: string, textMode: string = ThumbnailTextMode.Headline): ThumbnailItem[] => {
  const normalizedScript = _.trim(script);
  const sentences = smartSplitSentences(normalizedScript);
  const sources = _.isEmpty(sentences) ? [normalizedScript] : sentences;

  const generatedItems = _.times(requestedCount, (index) => {
    const layout = THUMBNAIL_LAYOUT_CATALOG[index % _.size(THUMBNAIL_LAYOUT_CATALOG)];
    const source = sources[index % _.size(sources)];
    const prompt = _.replace(_.replace(_.replace(THUMBNAIL_PROMPT_CONFIG.SOURCE_FALLBACK_PROMPT_TEMPLATE, THUMBNAIL_PROMPT_CONFIG.SOURCE_TOKEN, source), THUMBNAIL_PROMPT_CONFIG.COMPOSITION_TOKEN, layout.composition), THUMBNAIL_PROMPT_CONFIG.STYLE_TOKEN, style || THUMBNAIL_PROMPT_CONFIG.DEFAULT_STYLE);

    return { prompt, style: style || THUMBNAIL_PROMPT_CONFIG.DEFAULT_STYLE, hasText: !_.isEqual(textMode, ThumbnailTextMode.NoText), textText: "", generationPrompt: prompt, layoutId: layout.id, layout: layout.composition, layoutRationale: layout.bestFor, subjectFocus: source, };
  });

  return normalizeThumbnailIdeas(generatedItems, requestedCount, textMode);
};

export const createThumbnailGenerationPrompt = (thumbnail: ThumbnailItem, style: string, aspectRatio: string, _hasReferences?: boolean, _characters?: CharacterConfig[]): string => {
  const preset = resolveStylePreset(thumbnail.style || style);
  const headline = cleanTextValue(thumbnail.textText);
  const hasText = thumbnail.hasText && !_.isEmpty(headline);
  const layoutDesc = _.get(_.find(THUMBNAIL_LAYOUT_CATALOG, { id: thumbnail.layoutId as ThumbnailLayoutId }), "composition", THUMBNAIL_LAYOUT_CATALOG[0].composition);

  const parts = _.compact([preset.positivePrompt, _.replace(THUMBNAIL_PROMPT_CONFIG.LAYOUT_DIRECTIVE_TEMPLATE, "{layout}", layoutDesc), thumbnail.subjectFocus ? `${THUMBNAIL_PROMPT_CONFIG.SUBJECT_FOCUS_PREFIX}${thumbnail.subjectFocus}` : "", hasText ? _.replace(THUMBNAIL_PROMPT_CONFIG.HEADLINE_DIRECTIVE_TEMPLATE, "{headline}", headline) : THUMBNAIL_PROMPT_CONFIG.TEXT_FREE_DIRECTIVE, THUMBNAIL_PROMPT_CONFIG.COMPOSITION_DIRECTIVE, THUMBNAIL_PROMPT_CONFIG.SAFE_ZONE_DIRECTIVE]);

  const rawCombined = _.join(parts, " ");
  return appendImagePromptAspectRatio(sanitizeImagePrompt(rawCombined), aspectRatio);
};

export const getThumbnailPlanningIssues = (generatedItems: Array<Partial<ThumbnailItem>>, textMode: string, requestedCount: number = _.size(generatedItems), styleLock: string = ""): string[] =>
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

        return _.compact([ !layout && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.INVALID_LAYOUT,
          layout && !_.isEqual(item.typographyId, layout.typographyId) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.TYPOGRAPHY_MISMATCH,
          _.isEmpty(generationPrompt) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.MISSING_PROMPT,
          hasText && _.isEmpty(headline) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.MISSING_HEADLINE,
          hasText && (headlineWordCount > THUMBNAIL_PROMPT_CONFIG.MAX_TEXT_WORDS || _.size(headline) > THUMBNAIL_PROMPT_CONFIG.MAX_TEXT_CHARACTERS) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.HEADLINE_TOO_LONG,
          hasText && THUMBNAIL_PROMPT_CONFIG.WEAK_HEADLINE_PREFIX_PATTERN.test(headline) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.HEADLINE_WEAK_PREFIX,
          hasText && !_.isEmpty(headline) && !_.includes(generationPrompt.normalize("NFC"), headline) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.HEADLINE_NOT_IN_PROMPT,
          layout && _.includes(layout.arrowPolicy, "required") && !THUMBNAIL_PROMPT_CONFIG.ARROW_PATTERN.test(generationPrompt) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.ARROW_POLICY_MISMATCH,
          !hasText && !THUMBNAIL_PROMPT_CONFIG.TEXT_FREE_PATTERN.test(generationPrompt) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.TEXT_POLICY_MISMATCH,
          containsAspectRatio && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.ASPECT_RATIO_PRESENT,
          !_.isEmpty(normalizedStyleLock) && !_.includes(normalizedPrompt, normalizedStyleLock) && THUMBNAIL_PROMPT_CONFIG.PLANNING_ISSUES.STYLE_LOCK_MISSING, ]) as string[];
      }),
    ),
  );

export const resolveThumbnailReferenceImages = (visualConfig: Partial<Pick<VisualConfig, "styleReferenceImages" | "thumbnailReferenceImages" | "thumbnailSceneReferenceImages">> = {}): string[] => {
  const sceneStyleReference = _.first(_.defaultTo(visualConfig.styleReferenceImages, []));
  const thumbnailPresentationReferences = _.defaultTo(visualConfig.thumbnailReferenceImages, []);
  const thumbnailSceneReferences = _.defaultTo(visualConfig.thumbnailSceneReferenceImages, []);
  return _.take(_.uniq(_.compact(_.concat(sceneStyleReference, thumbnailPresentationReferences, thumbnailSceneReferences))) as string[], THUMBNAIL_PROMPT_CONFIG.MAX_REFERENCE_IMAGES);
};
