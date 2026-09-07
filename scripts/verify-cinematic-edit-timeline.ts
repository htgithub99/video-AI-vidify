import assert from "node:assert/strict";
import fs from "node:fs";
import { createCinematicEditTimeline } from "../src/services/cinematicEditTimelineService";
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
assert.deepEqual(
  timeline.map((item) => [item.sourceTrimStartSeconds, item.sourceTrimEndSeconds]),
  [
    [0.4, 7.2],
    [3.1, 3.3],
    [7.2, 0.4],
  ],
);
assert.deepEqual(timeline.map((item) => item.duration), [2.4, 3.6, 2.4]);
assert.equal(timeline[0].spokenDialogue, "");
assert.equal(timeline[1].spokenDialogue, "One line");
assert.equal(timeline[2].spokenDialogue, "");
const pipelineSource = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
assert.match(pipelineSource, /expectedRenderDuration = nativeFilmAudio[\s\S]*_\.sumBy\(renderableScenes/);
process.stdout.write(JSON.stringify({ passed: true, timelineShots: timeline.length }));
