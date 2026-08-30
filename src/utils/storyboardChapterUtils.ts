import _ from "lodash";

const countWords = (value: unknown): number => _.size(_.words(_.toString(value)));

export const assignStoryboardChapterIds = <T extends { chapterId?: string; script?: string; subtitle?: string }>(
  scenes: T[],
  chapters: Array<{ id?: string; scriptSegment?: string }>,
): Array<T & { chapterId?: string }> => {
  const validChapters = _.filter(chapters, (chapter) => !_.isEmpty(chapter.id));
  if (_.isEmpty(scenes) || _.isEmpty(validChapters)) return scenes;

  const sceneWordCounts = _.map(scenes, (scene) => _.max([countWords(scene.script || scene.subtitle), 1]) || 1);
  const chapterWordCounts = _.map(validChapters, (chapter) => countWords(chapter.scriptSegment));
  const totalSceneWords = _.sum(sceneWordCounts);
  const totalChapterWords = _.sum(chapterWordCounts);
  const effectiveChapterWeights = totalChapterWords > 0 ? chapterWordCounts : _.map(validChapters, () => 1);
  const effectiveTotalWeight = _.sum(effectiveChapterWeights);
  const chapterBoundaries = _.map(effectiveChapterWeights, (_weight, index) => _.sum(_.slice(effectiveChapterWeights, 0, index + 1)) / effectiveTotalWeight);
  let elapsedSceneWords = 0;

  return _.map(scenes, (scene, index) => {
    const midpoint = (elapsedSceneWords + sceneWordCounts[index] / 2) / totalSceneWords;
    const chapterIndex = _.findIndex(chapterBoundaries, (boundary) => midpoint <= boundary);
    elapsedSceneWords += sceneWordCounts[index];
    return { ...scene, chapterId: validChapters[chapterIndex < 0 ? validChapters.length - 1 : chapterIndex].id };
  });
};
