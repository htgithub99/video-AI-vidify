import assert from "node:assert/strict";
import fs from "node:fs";
import { applyCinematicClipAnalysisDecisions, countCinematicTimelineShots, createCinematicEditTimeline, hasCinematicSceneDialogue } from "../src/services/cinematicEditTimelineService";
import { GenerateType, StoryboardScene } from "../src/types";

const scene = {
  id: "sc_1",
  duration: 10,
  assetType: GenerateType.Video,
  assetUrl: "/assets/projects/test/videos/sc_1.mp4",
  subtitle: "One line",
  spokenDialogue: "One line",
  cinematicEditSegments: [
    { segmentId: "master", inSeconds: 0.4, outSeconds: 2.8, shotRole: "master", storyContribution: "Establish geography", transition: "cut", audioBridgeMode: "ambience", containsDialogue: false },
    { segmentId: "speaker", inSeconds: 3.1, outSeconds: 6.7, shotRole: "coverage", storyContribution: "Character changes the plan", transition: "match_cut", audioBridgeMode: "l_cut", containsDialogue: true },
    { segmentId: "reaction", inSeconds: 7.2, outSeconds: 9.6, shotRole: "reaction", storyContribution: "Show the consequence", transition: "cut", audioBridgeMode: "hard", containsDialogue: false },
  ],
} as StoryboardScene;

const timeline = createCinematicEditTimeline([scene]);
assert.equal(timeline.length, 3);
assert.deepEqual(timeline.map((item) => [item.sourceTrimStartSeconds, item.sourceTrimEndSeconds]), [[0.4, 7.2], [3.1, 3.3], [7.2, 0.4]]);
assert.deepEqual(timeline.map((item) => item.duration), [2.4, 3.6, 2.4]);
assert.deepEqual(timeline.map((item) => item.spokenDialogue), ["", "One line", ""]);
assert.deepEqual(timeline.map((item) => item.id), ["sc_1__master-1", "sc_1__speaker-2", "sc_1__reaction-3"]);
assert.equal(countCinematicTimelineShots([scene]), 3);
assert.equal(hasCinematicSceneDialogue(scene), true);
assert.equal(hasCinematicSceneDialogue({ generationPrompt: "The hero speaks once in Vietnamese with natural lip sync." }), true);
assert.equal(hasCinematicSceneDialogue({ generationPrompt: "Production sound only. No dialogue." }), false);
const refreshedDecision = applyCinematicClipAnalysisDecisions(
  [{ ...scene, cinematicTakeDecision: "omit" }],
  [{ sceneId: scene.id, takeDecision: "use", segments: scene.cinematicEditSegments }],
);
assert.equal(refreshedDecision[0].cinematicTakeDecision, "use");

const rejectedBookends = applyCinematicClipAnalysisDecisions(
  [
    { ...scene, id: "opening" },
    { ...scene, id: "middle" },
    { ...scene, id: "resolution" },
  ],
  [
    { sceneId: "opening", takeDecision: "omit", segments: [], reason: "duplicate" },
    { sceneId: "middle", takeDecision: "omit", segments: [], reason: "duplicate" },
    { sceneId: "resolution", takeDecision: "omit", segments: [], reason: "duplicate" },
  ],
);
assert.deepEqual(rejectedBookends.map((item) => item.cinematicTakeDecision), ["omit", "omit", "omit"]);

const overlappingTimeline = createCinematicEditTimeline([{
  ...scene,
  id: "sc_overlap",
  subtitle: "",
  spokenDialogue: "",
  cinematicEditSegments: [
    { ...scene.cinematicEditSegments![0], segmentId: "first", inSeconds: 0.2, outSeconds: 3 },
    { ...scene.cinematicEditSegments![0], segmentId: "overlap", inSeconds: 2.8, outSeconds: 5 },
  ],
}]);
assert.equal(overlappingTimeline.length, 1);
assert.deepEqual(
  [overlappingTimeline[0].sourceTrimStartSeconds, overlappingTimeline[0].sourceTrimEndSeconds, overlappingTimeline[0].duration],
  [0.2, 5, 4.8],
);

const adjacentTimeline = createCinematicEditTimeline([{
  ...scene,
  id: "sc_adjacent",
  subtitle: "",
  spokenDialogue: "",
  cinematicEditSegments: [
    { ...scene.cinematicEditSegments![0], segmentId: "first", inSeconds: 0.2, outSeconds: 3 },
    { ...scene.cinematicEditSegments![0], segmentId: "next", inSeconds: 3, outSeconds: 5 },
  ],
}]);
assert.equal(adjacentTimeline.length, 1);
assert.deepEqual(
  [adjacentTimeline[0].sourceTrimStartSeconds, adjacentTimeline[0].sourceTrimEndSeconds, adjacentTimeline[0].duration],
  [0.2, 5, 4.8],
);

const fallbackTimeline = createCinematicEditTimeline([{
  ...scene,
  id: "sc_fallback",
  sourceTrimStartSeconds: 1,
  sourceTrimEndSeconds: 2,
  cinematicEditSegments: [],
}]);
assert.deepEqual(
  [fallbackTimeline[0].sourceTrimStartSeconds, fallbackTimeline[0].sourceTrimEndSeconds, fallbackTimeline[0].duration],
  [1, 2, 7],
);
const pipelineSource = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
assert.match(pipelineSource, /expectedRenderDuration = nativeFilmAudio[\s\S]*_\.sumBy\(renderableScenes/);
assert.match(pipelineSource, /storyboard: _\.cloneDeep\(realScenes\)/);
process.stdout.write(JSON.stringify({ passed: true, timelineShots: timeline.length }));
