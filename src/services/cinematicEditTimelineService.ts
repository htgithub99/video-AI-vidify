import _ from "lodash";
import { CINEMATIC_EDIT_ANALYSIS_CONFIG } from "../constants/config";
import { CinematicEditSegment, StoryboardScene } from "../types";

export interface CinematicClipAnalysisDecision {
  sceneId: string;
  takeDecision?: string;
  trimStartSeconds?: number;
  trimEndSeconds?: number;
  sourceCrop?: string;
  warnings?: string[];
  reason?: string;
  recommendedTransition?: string;
  audioBridgeMode?: StoryboardScene["cinematicAudioBridgeMode"];
  continuityScore?: number;
  storyClarityScore?: number;
  performanceScore?: number;
  dialogueCoverageScore?: number;
  dialogueDetected?: boolean;
  observedShotCount?: number;
  segments?: CinematicEditSegment[];
  supportShotType?: StoryboardScene["cinematicSupportShotType"];
}

export const hasCinematicSceneDialogue = (scene: Partial<StoryboardScene>): boolean =>
  (_.includes(["on_screen_dialogue", "off_screen_dialogue"], _.toString(scene.dialogueMode)) && !_.isEmpty(_.trim(_.toString(scene.spokenDialogue)))) ||
  !_.isEmpty(_.trim(_.toString(scene.subtitle))) ||
  CINEMATIC_EDIT_ANALYSIS_CONFIG.DIALOGUE_PROMPT_PATTERN.test(_.toString(scene.generationPrompt));

export const applyCinematicClipAnalysisDecisions = (scenes: StoryboardScene[], decisions: CinematicClipAnalysisDecision[]): StoryboardScene[] => {
  const decisionsByScene = _.keyBy(decisions, "sceneId");
  return _.map(scenes, (scene) => {
    const decision = decisionsByScene[scene.id];
    if (!decision) return scene;
    const technicalDecision = _.toString(decision.takeDecision);
    const takeDecision: StoryboardScene["cinematicTakeDecision"] = _.isEqual(technicalDecision, "omit")
      ? "omit"
      : _.isEqual(technicalDecision, "trim")
        ? "trim"
        : scene.cinematicTakeDecision || "use";
    return {
      ...scene,
      sourceTrimStartSeconds: _.toNumber(decision.trimStartSeconds),
      sourceTrimEndSeconds: _.toNumber(decision.trimEndSeconds),
      sourceCrop: _.toString(decision.sourceCrop || ""),
      clipQaWarnings: _.castArray(decision.warnings || []),
      cinematicTakeDecision: takeDecision,
      cinematicTakeDecisionReason: _.join(_.compact([scene.cinematicTakeDecisionReason, decision.reason]), ";"),
      transition: _.toString(decision.recommendedTransition || scene.transition),
      cinematicAudioBridgeMode: decision.audioBridgeMode,
      cinematicContinuityScore: _.isNumber(decision.continuityScore) ? decision.continuityScore : scene.cinematicContinuityScore,
      cinematicStoryClarityScore: _.isNumber(decision.storyClarityScore) ? decision.storyClarityScore : scene.cinematicStoryClarityScore,
      cinematicPerformanceScore: _.isNumber(decision.performanceScore) ? decision.performanceScore : scene.cinematicPerformanceScore,
      cinematicDialogueCoverageScore: _.isNumber(decision.dialogueCoverageScore) ? decision.dialogueCoverageScore : scene.cinematicDialogueCoverageScore,
      cinematicDialogueDetected: _.isBoolean(decision.dialogueDetected) ? decision.dialogueDetected : scene.cinematicDialogueDetected,
      cinematicObservedShotCount: _.toNumber(decision.observedShotCount),
      cinematicEditSegments: _.castArray(decision.segments || []),
      cinematicSupportShotType: decision.supportShotType,
    };
  });
};

export const createCinematicEditTimeline = (scenes: StoryboardScene[]): StoryboardScene[] =>
  _.map(scenes, (scene) => {
    const sourceDuration = _.toNumber(scene.duration);
    const trimStartSeconds = _.clamp(_.defaultTo(_.toNumber(scene.sourceTrimStartSeconds), 0), 0, sourceDuration);
    const trimEndSeconds = _.clamp(_.defaultTo(_.toNumber(scene.sourceTrimEndSeconds), 0), 0, _.max([0, sourceDuration - trimStartSeconds]) || 0);
    const duration = _.max([0, sourceDuration - trimStartSeconds - trimEndSeconds]) || 0;
    return {
      ...scene,
      duration: Number(duration.toFixed(3)),
      sourceTrimStartSeconds: Number(trimStartSeconds.toFixed(3)),
      sourceTrimEndSeconds: Number(trimEndSeconds.toFixed(3)),
      subtitleCues: [],
    };
  });

export const countCinematicTimelineShots = (scenes: StoryboardScene[]): number =>
  scenes.length;
