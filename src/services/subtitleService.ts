import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { SOURCE_TEXT_IMBALANCE, SOURCE_TEXT_LINES } from "../constants/sourceText";
import _ from "lodash";
import { PRODUCTION_QA_THRESHOLDS } from "./productionQualityService";
import { StoryboardScene, SubtitleCue } from "../types";
import { smartSplitSentences } from "../lib/textProcessor";
import { SEMANTIC_BREAK_PATTERN } from "../constants/regexes";
const MAX_CUE_CHARACTERS = PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_CHARS_PER_LINE;
const splitLongWord = (word: string): string[] => _.map(_.range(0, _.size(word), PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_CHARS_PER_LINE), (start) => _.slice(word, start, start + PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_CHARS_PER_LINE).join(""));
const findBestSemanticBreak = (text: string): number => {
  const lowerBound = _.floor(text.length * 0.3);
  const upperBound = _.ceil(text.length * 0.7);
  const midpoint = text.length / 2;
  const candidates: number[] = [];
  for (const match of text.matchAll(SEMANTIC_BREAK_PATTERN)) {
    const boundary = _.add(match.index || 0, match[0].length);
    if (_.inRange(boundary, lowerBound, upperBound + 1)) candidates.push(boundary);
  }
  if (!_.isEmpty(candidates)) return _.minBy(candidates, (boundary) => Math.abs(boundary - midpoint))!;
  const spaces = _.compact(_.map(text, (char, index) => (_.isEqual(char, RT_SHARED.SYMBOL_36A9E7) ? index + 1 : 0)));
  return _.minBy(spaces, (boundary) => Math.abs(boundary - midpoint)) || text.length;
};
const splitSemanticPhrases = (text: string): string[] =>
  _.flatMap(smartSplitSentences(_.trim(text)), (sentence) => {
    const phrases: string[] = [];
    const queue = [sentence];
    while (!_.isEmpty(queue)) {
      const phrase = _.trim(queue.shift());
      if (_.size(phrase) <= MAX_CUE_CHARACTERS) {
        if (!_.isEmpty(phrase)) phrases.push(phrase);
        continue;
      }
      const breakAt = findBestSemanticBreak(phrase);
      if (!_.inRange(breakAt, 1, phrase.length)) {
        phrases.push(phrase);
        continue;
      }
      queue.unshift(_.trim(phrase.slice(breakAt)));
      queue.unshift(_.trim(phrase.slice(0, breakAt)));
    }
    return phrases;
  });
const createBalancedSubtitleLines = (text: string): string[] => {
  const words = _.flatMap(_.words(text, /[^\s]+/g), (word) => (_.size(word) > PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_CHARS_PER_LINE ? splitLongWord(word) : [word]));
  if (_.isEqual(PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_LINES, 1) || _.size(_.join(words, RT_SHARED.SYMBOL_36A9E7)) <= PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_CHARS_PER_LINE) return [_.join(words, RT_SHARED.SYMBOL_36A9E7)] as string[];
  const candidates = _.compact(
    _.map(_.range(1, words.length), (index) => {
      const first = _.join(_.slice(words, 0, index), RT_SHARED.SYMBOL_36A9E7);
      const second = _.join(_.slice(words, index), RT_SHARED.SYMBOL_36A9E7);
      if (_.some([first, second], (line) => _.size(line) > PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_CHARS_PER_LINE)) return null;
      return { lines: [first, second], imbalance: Math.abs(first.length - second.length) };
    }),
  );
  return _.get(_.minBy(candidates, SOURCE_TEXT_IMBALANCE), SOURCE_TEXT_LINES, [_.join(words, RT_SHARED.SYMBOL_36A9E7)] as string[]);
};
export const createSceneSubtitleCues = (scene: StoryboardScene): SubtitleCue[] => {
  const cueTexts = _.map(splitSemanticPhrases(scene.subtitle || scene.script), (phrase) => _.join(createBalancedSubtitleLines(phrase), RT_SHARED.SYMBOL_01BA47));
  const cueWeights = _.map(cueTexts, (text) => _.max([_.size(_.replace(text, /\s/g, "")), PRODUCTION_QA_THRESHOLDS.MIN_SUBTITLE_DURATION_SECONDS * PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_CHARS_PER_SECOND]) || 0);
  const totalWeight = _.sum(cueWeights);
  let cursor = 0;
  return _.map(cueTexts, (text, index) => {
    const isLastCue = _.isEqual(index, _.subtract(_.size(cueTexts), 1));
    const proportionalDuration = totalWeight > 0 ? _.multiply(scene.duration, _.divide(cueWeights[index], totalWeight)) : 0;
    const remainingCues = _.subtract(_.size(cueTexts), _.add(index, 1));
    const reservedDuration = remainingCues * PRODUCTION_QA_THRESHOLDS.MIN_SUBTITLE_DURATION_SECONDS;
    const availableDuration = _.max([0, _.subtract(_.subtract(scene.duration, cursor), reservedDuration)]) || 0;
    const durationSeconds = isLastCue ? _.max([0, _.subtract(scene.duration, cursor)]) || 0 : _.min([_.max([PRODUCTION_QA_THRESHOLDS.MIN_SUBTITLE_DURATION_SECONDS, proportionalDuration]) || proportionalDuration, availableDuration]) || 0;
    const cue = { text, startOffsetSeconds: cursor, durationSeconds };
    cursor = _.add(cursor, durationSeconds);
    return cue;
  });
};
export const createSubtitleCues = (scenes: StoryboardScene[]): StoryboardScene[] => _.map(scenes, (scene) => ({ ...scene, subtitleCues: createSceneSubtitleCues(scene) }));
