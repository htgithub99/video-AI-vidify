import _ from "lodash";
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

const isUsableSegment = (segment: CinematicEditSegment, sourceDuration: number): boolean => {
  const start = _.toNumber(segment.inSeconds);
  const end = _.toNumber(segment.outSeconds);
  return _.gte(start, 0) && _.lte(end, sourceDuration) && _.gt(end, start);
};

export const createCinematicEditTimeline = (scenes: StoryboardScene[]): StoryboardScene[] =>
  _.reduce<StoryboardScene, StoryboardScene[]>(
    scenes,
    (timeline, scene) => {
      const sourceDuration = _.toNumber(scene.duration);
      const segments = _.filter(scene.cinematicEditSegments || [], (segment) => isUsableSegment(segment, sourceDuration));
      if (_.isEmpty(segments)) return [...timeline, scene];
      const editedSegments = _.map(segments, (segment, index): StoryboardScene => ({
        ...scene,
        id: `${scene.id}__${segment.segmentId || index + 1}`,
        duration: Number((_.toNumber(segment.outSeconds) - _.toNumber(segment.inSeconds)).toFixed(3)),
        sourceTrimStartSeconds: Number(_.toNumber(segment.inSeconds).toFixed(3)),
        sourceTrimEndSeconds: Number((_.max([0, sourceDuration - _.toNumber(segment.outSeconds)]) || 0).toFixed(3)),
        shotRole: segment.shotRole,
        transition: segment.transition,
        cinematicAudioBridgeMode: segment.audioBridgeMode,
        subtitle: segment.containsDialogue ? scene.subtitle : "",
        spokenDialogue: segment.containsDialogue ? scene.spokenDialogue : "",
        subtitleCues: [],
      }));
      return [...timeline, ...editedSegments];
    },
    [],
  );

export const countCinematicTimelineShots = (scenes: StoryboardScene[]): number =>
  _.sumBy(scenes, (scene) => (_.isEmpty(scene.cinematicEditSegments) ? 1 : _.size(scene.cinematicEditSegments)));
