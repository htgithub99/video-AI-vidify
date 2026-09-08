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
  (!CINEMATIC_EDIT_ANALYSIS_CONFIG.DIALOGUE_NEGATION_PROMPT_PATTERN.test(_.toString(scene.generationPrompt)) &&
    CINEMATIC_EDIT_ANALYSIS_CONFIG.DIALOGUE_PROMPT_PATTERN.test(_.toString(scene.generationPrompt)));

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

const roundTimelineSeconds = (value: number): number =>
  Number(value.toFixed(CINEMATIC_EDIT_ANALYSIS_CONFIG.TIMELINE_NUMBER_PRECISION));

const normalizeCinematicEditSegments = (
  scene: StoryboardScene,
  safeStartSeconds: number,
  safeEndSeconds: number,
): CinematicEditSegment[] => {
  const validSegments = _.sortBy(
    _.compact(
      _.map(_.castArray(scene.cinematicEditSegments || []), (segment) => {
        const inSeconds = _.clamp(_.toNumber(segment.inSeconds), safeStartSeconds, safeEndSeconds);
        const outSeconds = _.clamp(_.toNumber(segment.outSeconds), inSeconds, safeEndSeconds);
        if (_.lt(outSeconds - inSeconds, CINEMATIC_EDIT_ANALYSIS_CONFIG.MIN_USABLE_SECONDS)) return undefined;
        return { ...segment, inSeconds, outSeconds };
      }),
    ),
    ["inSeconds", "outSeconds"],
  );

  return _.reduce(
    validSegments,
    (segments, segment) => {
      const previous = _.last(segments);
      if (previous && _.lt(segment.inSeconds, previous.outSeconds)) {
        previous.outSeconds = _.max([previous.outSeconds, segment.outSeconds]) || previous.outSeconds;
        previous.containsDialogue = previous.containsDialogue || segment.containsDialogue;
        previous.storyContribution = _.join(
          _.uniq(_.compact([_.trim(previous.storyContribution), _.trim(segment.storyContribution)])),
          "; ",
        );
        return segments;
      }
      segments.push({ ...segment });
      return segments;
    },
    [] as CinematicEditSegment[],
  );
};

export const createCinematicEditTimeline = (scenes: StoryboardScene[]): StoryboardScene[] =>
  _.flatMap(scenes, (scene) => {
    const zeroSeconds = CINEMATIC_EDIT_ANALYSIS_CONFIG.TIMELINE_ZERO_SECONDS;
    const sourceDuration = _.max([zeroSeconds, _.toNumber(scene.duration)]) || zeroSeconds;
    const safeStartSeconds = _.clamp(_.defaultTo(_.toNumber(scene.sourceTrimStartSeconds), zeroSeconds), zeroSeconds, sourceDuration);
    const safeEndTrimSeconds = _.clamp(
      _.defaultTo(_.toNumber(scene.sourceTrimEndSeconds), zeroSeconds),
      zeroSeconds,
      _.max([zeroSeconds, sourceDuration - safeStartSeconds]) || zeroSeconds,
    );
    const safeEndSeconds = _.max([safeStartSeconds, sourceDuration - safeEndTrimSeconds]) || safeStartSeconds;
    const segments = normalizeCinematicEditSegments(scene, safeStartSeconds, safeEndSeconds);
    if (_.isEmpty(segments)) {
      const duration = _.max([zeroSeconds, safeEndSeconds - safeStartSeconds]) || zeroSeconds;
      return [{
        ...scene,
        duration: roundTimelineSeconds(duration),
        sourceTrimStartSeconds: roundTimelineSeconds(safeStartSeconds),
        sourceTrimEndSeconds: roundTimelineSeconds(sourceDuration - safeEndSeconds),
        subtitleCues: [],
      }];
    }

    const sceneHasDialogue = hasCinematicSceneDialogue(scene);
    const hasLocatedDialogue = _.some(segments, "containsDialogue");
    return _.map(segments, (segment, segmentIndex) => {
      const preserveDialogueMetadata = sceneHasDialogue && (segment.containsDialogue || !hasLocatedDialogue);
      const segmentName = _.kebabCase(segment.segmentId) || CINEMATIC_EDIT_ANALYSIS_CONFIG.TIMELINE_SEGMENT_FALLBACK_PREFIX;
      const timelineId = _.join(
        [scene.id, `${segmentName}-${segmentIndex + CINEMATIC_EDIT_ANALYSIS_CONFIG.TIMELINE_INDEX_OFFSET}`],
        CINEMATIC_EDIT_ANALYSIS_CONFIG.TIMELINE_SEGMENT_ID_SEPARATOR,
      );
      return {
        ...scene,
        id: timelineId,
        duration: roundTimelineSeconds(segment.outSeconds - segment.inSeconds),
        sourceTrimStartSeconds: roundTimelineSeconds(segment.inSeconds),
        sourceTrimEndSeconds: roundTimelineSeconds(sourceDuration - segment.outSeconds),
        transition: segment.transition || scene.transition,
        cinematicAudioBridgeMode: segment.audioBridgeMode,
        cinematicDialogueDetected: segment.containsDialogue,
        cinematicEditSegments: [{ ...segment }],
        spokenDialogue: preserveDialogueMetadata ? scene.spokenDialogue : "",
        subtitle: preserveDialogueMetadata ? scene.subtitle : "",
        subtitleCues: [],
      };
    });
  });

export const countCinematicTimelineShots = (scenes: StoryboardScene[]): number =>
  _.size(createCinematicEditTimeline(scenes));
