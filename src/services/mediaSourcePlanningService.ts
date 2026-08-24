import _ from "lodash";
import { VideoGenre } from "../constants/enums";
import { StoryboardScene } from "../types";

const FACTUAL_ARCHIVAL_RATIOS: Record<string, number> = {
  History: 0.65,
  Documentary: 0.6,
  Architecture: 0.7,
  Science: 0.3,
  News: 0.4,
  Review: 0.3,
  "Top List": 0.25,
  "True Crime": 0.4,
  Psychology: 0.2,
  [VideoGenre.NARRATIVE_EXPLAINER]: 0.25,
  [VideoGenre.CHARACTER_PSYCHOLOGY]: 0.15,
};

const AUTHENTIC_EVIDENCE_PATTERN = /(?:\b(?:năm|year)\s+\d{3,4}\b|\b\d{3,4}\b|Nhà Trần|Đại Việt|nhà Lý|Trần Hưng Đạo|Trần Nhân Tông|Bạch Đằng|Thăng Long|Diên Hồng|Vạn Kiếp|Đông Bộ Đầu|Hồ Quý Ly|Trần Thủ Độ|Nguyên Mông|Mongol|historic(?:al)? (?:site|map|document|artifact|building|person)|bản đồ|sắc phong|chiếu|ấn triều|di tích|đền|lăng|thành cổ|hiện vật|tài liệu|công trình)/i;

const getAuthenticEvidenceScore = (scene: StoryboardScene): number => {
  const text = _.join(_.compact([scene.storyEvidence, scene.archivalSearchQuery]), " ");
  return _.size(text.match(new RegExp(AUTHENTIC_EVIDENCE_PATTERN.source, "gi")) || []);
};

export const getMinimumArchivalRatio = (genre?: string): number => _.get(FACTUAL_ARCHIVAL_RATIOS, genre || "", 0);

const REQUIRED_EDITORIAL_FIELDS: Array<keyof StoryboardScene> = [
  "visualIntent", "visibleAction", "reaction", "storyEvidence", "visualHook", "composition",
];

const hasRequiredEditorialData = (scene: StoryboardScene): boolean => _.every(
  REQUIRED_EDITORIAL_FIELDS,
  field => !_.isEmpty(_.trim(_.toString(scene[field]))),
);

const hasUsableStrategy = (scene: StoryboardScene): boolean => {
  if (!_.includes(["archival", "ai_generated"], scene.assetStrategy)) return false;
  if (!_.isEqual(scene.assetStrategy, "archival")) return true;
  const query = _.trim(scene.archivalSearchQuery);
  const narration = _.trim(scene.script || scene.subtitle);
  return hasRequiredEditorialData(scene)
    && !_.isEmpty(query)
    && !_.isEqual(_.deburr(_.toLower(query)), _.deburr(_.toLower(narration)))
    && getAuthenticEvidenceScore(scene) > 0;
};

export const ensureMediaSourcePlan = (
  scenes: StoryboardScene[],
  genre?: string,
): StoryboardScene[] => {
  const minimumRatio = getMinimumArchivalRatio(genre);
  return _.map(scenes, scene => hasUsableStrategy(scene)
    ? scene
    : {
      ...scene,
      assetStrategy: "ai_generated" as const,
      archivalSearchQuery: "",
      archivalRationale: minimumRatio > 0
        ? "Authentic evidence was not fully specified by AI; use an explicit reconstruction instead of unrelated source media"
        : "AI visual planning did not request authentic source media for this scene",
    });
};
