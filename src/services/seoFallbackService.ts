import _ from "lodash";
import { SEO_FALLBACK_CONFIG } from "../constants/config";
import { smartSplitSentences } from "../lib/textProcessor";
import { SEOMetadata, SEOPackage } from "../types";

const createUnknownScoreMetadata = (text: string): SEOMetadata => ({
  text,
  searchScore: SEO_FALLBACK_CONFIG.UNKNOWN_SCORE,
  ctrScore: SEO_FALLBACK_CONFIG.UNKNOWN_SCORE,
  compScore: SEO_FALLBACK_CONFIG.UNKNOWN_SCORE,
  seoScore: SEO_FALLBACK_CONFIG.UNKNOWN_SCORE,
});

const createTerms = (script: string): string[] => _.uniq(_.filter(_.words(_.toLower(script)), (word) => _.size(word) >= SEO_FALLBACK_CONFIG.TAG_MIN_LENGTH));

export const createSourceGroundedSeo = (script: string, config: Partial<Record<"numTitles" | "numDescriptions" | "numHashtags" | "numTags", number>> = {}): SEOPackage => {
  const normalizedScript = _.trim(script);
  const sentences = smartSplitSentences(normalizedScript);
  const sourceTitles = _.take(sentences, config.numTitles || SEO_FALLBACK_CONFIG.DEFAULT_TITLE_COUNT);
  const titleSources = _.isEmpty(sourceTitles) ? [normalizedScript] : sourceTitles;
  const titles = _.map(titleSources, (title) =>
    createUnknownScoreMetadata(
      _.truncate(title, {
        length: SEO_FALLBACK_CONFIG.TITLE_MAX_LENGTH,
      }),
    ),
  );
  const descriptionText = _.truncate(normalizedScript, { length: SEO_FALLBACK_CONFIG.DESCRIPTION_MAX_LENGTH });
  const descriptions = _.times(config.numDescriptions || SEO_FALLBACK_CONFIG.DEFAULT_DESCRIPTION_COUNT, () => createUnknownScoreMetadata(descriptionText));
  const terms = createTerms(normalizedScript);
  return { titles, descriptions, hashtags: _.take(terms, config.numHashtags || SEO_FALLBACK_CONFIG.DEFAULT_HASHTAG_COUNT), tags: _.take(terms, config.numTags || SEO_FALLBACK_CONFIG.DEFAULT_TAG_COUNT), };
};
