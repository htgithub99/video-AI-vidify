import _ from "lodash";
import { smartSplitSentences } from "../lib/textProcessor";
import { StoryboardScene } from "../types";

const SIMILARITY_THRESHOLD = 0.82;
const COMPARISON_SENTENCE_COUNT = 3;
const MINIMUM_TOKEN_COUNT = 6;
const RECENT_NARRATION_WINDOW = 3;
const CUMULATIVE_COVERAGE_THRESHOLD = 0.86;
const PHRASE_OVERLAP_THRESHOLD = 0.65;
const MINIMUM_REPEATED_PHRASE_TOKENS = 6;
const MAXIMUM_NOVEL_TOKENS_IN_RESTATEMENT = 4;

const normalizeNarrationTokens = (value: string): string[] =>
  Array.from(
    new Set(
      _.words(
        _.deburr(_.toLower(value))
          .replace(/%/g, " phan tram ")
          .replace(/\bpercent\b/g, " phan tram "),
      ),
    ),
  );

export const getNarrationSentenceSimilarity = (first: string, second: string): number => {
  const firstTokens = normalizeNarrationTokens(first);
  const secondTokens = normalizeNarrationTokens(second);
  if (_.lt(_.min([firstTokens.length, secondTokens.length]) || 0, MINIMUM_TOKEN_COUNT)) return 0;
  const union = _.union(firstTokens, secondTokens);
  return _.isEmpty(union) ? 0 : _.divide(_.size(_.intersection(firstTokens, secondTokens)), _.size(union));
};

const getNarrationCoverage = (candidate: string, precedingText: string): number => {
  const candidateTokens = normalizeNarrationTokens(candidate);
  if (_.lt(candidateTokens.length, MINIMUM_TOKEN_COUNT)) return 0;
  const precedingTokens = normalizeNarrationTokens(precedingText);
  return _.isEmpty(candidateTokens) ? 0 : _.divide(_.size(_.intersection(candidateTokens, precedingTokens)), candidateTokens.length);
};

const getLongestSharedTokenRun = (first: string[], second: string[]): number => {
  const previous = new Array(second.length + 1).fill(0);
  let longest = 0;
  for (let firstIndex = 1; firstIndex <= first.length; firstIndex++) {
    const current = new Array(second.length + 1).fill(0);
    for (let secondIndex = 1; secondIndex <= second.length; secondIndex++) {
      if (_.isEqual(first[firstIndex - 1], second[secondIndex - 1])) {
        current[secondIndex] = previous[secondIndex - 1] + 1;
        longest = _.max([longest, current[secondIndex]]) || longest;
      }
    }
    for (let index = 0; index < current.length; index++) previous[index] = current[index];
  }
  return longest;
};

const substantiallyRestatesRecentNarration = (candidate: string, precedingText: string): boolean => {
  const candidateTokens = normalizeNarrationTokens(candidate);
  const precedingTokens = normalizeNarrationTokens(precedingText);
  if (_.lt(candidateTokens.length, MINIMUM_TOKEN_COUNT) || _.isEmpty(precedingTokens)) return false;
  const sharedRun = getLongestSharedTokenRun(candidateTokens, precedingTokens);
  const overlapRatio = _.divide(sharedRun, candidateTokens.length);
  const novelTokenCount = _.size(_.difference(candidateTokens, precedingTokens));
  return _.gte(sharedRun, MINIMUM_REPEATED_PHRASE_TOKENS) && _.gte(overlapRatio, PHRASE_OVERLAP_THRESHOLD) && _.lte(novelTokenCount, MAXIMUM_NOVEL_TOKENS_IN_RESTATEMENT);
};

export const removeRepeatedNarrationOpening = (segment: string, precedingText: string): string => {
  const precedingSentences = _.takeRight(smartSplitSentences(precedingText), COMPARISON_SENTENCE_COUNT);
  const segmentSentences = smartSplitSentences(segment);
  while (!_.isEmpty(segmentSentences) && _.some(precedingSentences, (sentence) => _.gte(getNarrationSentenceSimilarity(segmentSentences[0], sentence), SIMILARITY_THRESHOLD))) {
    segmentSentences.shift();
  }
  return _.trim(_.join(segmentSentences, " "));
};

export const removeAdjacentRepeatedNarrationSentences = (text: string): string => {
  const sentences = smartSplitSentences(text);
  const acceptedSentences = _.reduce(
    sentences,
    (accepted: string[], sentence) => {
      const recentNarration = _.join(_.takeRight(accepted, RECENT_NARRATION_WINDOW), " ");
      const repeatsPreviousSentence = !_.isEmpty(accepted) && _.gte(getNarrationSentenceSimilarity(sentence, _.last(accepted) || ""), SIMILARITY_THRESHOLD);
      const restatesRecentNarration = (!_.isEmpty(recentNarration) && _.gte(getNarrationCoverage(sentence, recentNarration), CUMULATIVE_COVERAGE_THRESHOLD)) || substantiallyRestatesRecentNarration(sentence, recentNarration);
      if (!repeatsPreviousSentence && !restatesRecentNarration) accepted.push(sentence);
      return accepted;
    },
    [] as string[],
  );
  return _.join(acceptedSentences, " ");
};

export const removeAdjacentRepeatedStoryboardScenes = (scenes: StoryboardScene[]): StoryboardScene[] =>
  _.reduce(
    scenes,
    (accepted: StoryboardScene[], scene) => {
      const currentText = _.trim(scene.script || scene.subtitle || "");
      const previousText = _.trim(_.last(accepted)?.script || _.last(accepted)?.subtitle || "");
      const recentText = _.join(
        _.map(_.takeRight(accepted, RECENT_NARRATION_WINDOW), (item) => _.trim(item.script || item.subtitle || "")),
        " ",
      );
      const isRepeated = _.gte(getNarrationSentenceSimilarity(currentText, previousText), SIMILARITY_THRESHOLD) || _.gte(getNarrationCoverage(currentText, recentText), CUMULATIVE_COVERAGE_THRESHOLD) || substantiallyRestatesRecentNarration(currentText, recentText);
      if (!isRepeated) accepted.push(scene);
      return accepted;
    },
    [] as StoryboardScene[],
  );
