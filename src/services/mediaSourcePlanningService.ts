import _ from "lodash";
import { VideoGenre } from "../constants/enums";
import { StoryboardScene } from "../types";

const FACTUAL_ARCHIVAL_RATIOS: Record<string, number> = {
  History: 0.4,
  Documentary: 0.4,
  Science: 0.3,
  News: 0.4,
  Review: 0.3,
  "Top List": 0.25,
  "True Crime": 0.4,
  Psychology: 0.2,
  [VideoGenre.NARRATIVE_EXPLAINER]: 0.25,
  [VideoGenre.CHARACTER_PSYCHOLOGY]: 0.15,
};

export const getMinimumArchivalRatio = (genre?: string): number => _.get(FACTUAL_ARCHIVAL_RATIOS, genre || "", 0);

const hasUsableStrategy = (scene: StoryboardScene): boolean => (
  _.includes(["archival", "ai_generated"], scene.assetStrategy)
  && (!_.isEqual(scene.assetStrategy, "archival") || !_.isEmpty(_.trim(scene.archivalSearchQuery)))
);

export const ensureMediaSourcePlan = (
  scenes: StoryboardScene[],
  genre?: string,
): StoryboardScene[] => {
  const planned = _.map(scenes, scene => hasUsableStrategy(scene)
    ? scene
    : { ...scene, assetStrategy: "ai_generated" as const, archivalSearchQuery: "", archivalRationale: "AI visual planning did not request authentic source media for this scene" });
  const minimumRatio = getMinimumArchivalRatio(genre);
  if (minimumRatio <= 0 || _.isEmpty(planned)) return planned;
  const minimumCount = _.max([1, _.ceil(_.multiply(_.size(planned), minimumRatio))]) || 1;
  const existingArchivalCount = _.filter(planned, { assetStrategy: "archival" }).length;
  if (existingArchivalCount >= minimumCount) return planned;

  const candidates = _.filter(planned, scene => !_.isEqual(scene.assetStrategy, "archival"));
  const needed = _.subtract(minimumCount, existingArchivalCount);
  const stride = _.divide(_.size(candidates), _.max([needed, 1]) || 1);
  const selectedIds = new Set(_.map(_.times(needed, index => candidates[_.min([_.floor(index * stride), _.subtract(_.size(candidates), 1)])!]), "id"));
  return _.map(planned, scene => selectedIds.has(scene.id)
    ? {
      ...scene,
      assetStrategy: "archival" as const,
      archivalSearchQuery: _.trim(scene.archivalSearchQuery || scene.script || scene.subtitle),
      archivalRationale: scene.archivalRationale || "Authentic visual evidence is required to ground this factual genre",
    }
    : scene);
};
