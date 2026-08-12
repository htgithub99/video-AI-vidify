import _ from "lodash";
import { PRODUCTION_QA_THRESHOLDS } from "./productionQualityService";
import { StoryboardScene, SubtitleCue } from "../types";

const splitLongWord = (word: string): string[] => _.map(
  _.range(0, _.size(word), PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_CHARS_PER_LINE),
  start => _.slice(word, start, start + PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_CHARS_PER_LINE).join(""),
);

const createSubtitleLines = (text: string): string[] => {
  const words = _.flatMap(_.words(text, /[^\s]+/g), word => (
    _.size(word) > PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_CHARS_PER_LINE ? splitLongWord(word) : [word]
  ));
  return _.reduce(words, (lines: string[], word) => {
    const currentLine = _.last(lines);
    const candidate = _.trim(_.join([currentLine, word], " "));
    if (!currentLine || _.size(candidate) > PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_CHARS_PER_LINE) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = candidate;
    }
    return lines;
  }, []);
};

export const createSceneSubtitleCues = (scene: StoryboardScene): SubtitleCue[] => {
  const cueTexts = _.map(
    _.chunk(createSubtitleLines(scene.subtitle || scene.script), PRODUCTION_QA_THRESHOLDS.MAX_SUBTITLE_LINES),
    lines => _.join(lines, "\n"),
  );
  const characterCount = _.sumBy(cueTexts, text => _.size(_.replace(text, /\s/g, "")));
  let cursor = 0;
  return _.map(cueTexts, (text, index) => {
    const isLastCue = _.isEqual(index, _.subtract(_.size(cueTexts), 1));
    const proportionalDuration = characterCount > 0
      ? _.multiply(scene.duration, _.divide(_.size(_.replace(text, /\s/g, "")), characterCount))
      : 0;
    const durationSeconds = isLastCue
      ? _.max([0, _.subtract(scene.duration, cursor)]) || 0
      : proportionalDuration;
    const cue = { text, startOffsetSeconds: cursor, durationSeconds };
    cursor = _.add(cursor, durationSeconds);
    return cue;
  });
};

export const createSubtitleCues = (scenes: StoryboardScene[]): StoryboardScene[] => _.map(
  scenes,
  scene => ({ ...scene, subtitleCues: createSceneSubtitleCues(scene) }),
);
