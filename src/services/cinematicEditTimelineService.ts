import _ from "lodash";
import { CinematicEditSegment, StoryboardScene } from "../types";

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
        duration: sourceDuration,
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
