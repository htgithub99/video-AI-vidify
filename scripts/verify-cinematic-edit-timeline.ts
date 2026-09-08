import assert from "node:assert/strict";
import fs from "node:fs";
import { createCinematicEditTimeline, hasCinematicSceneDialogue } from "../src/services/cinematicEditTimelineService";
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
assert.equal(timeline.length, 1);
assert.deepEqual(timeline.map((item) => [item.sourceTrimStartSeconds, item.sourceTrimEndSeconds]), [[0, 0]]);
assert.deepEqual(timeline.map((item) => item.duration), [10]);
assert.equal(timeline[0].spokenDialogue, "One line");
assert.equal(hasCinematicSceneDialogue(scene), true);
assert.equal(hasCinematicSceneDialogue({ generationPrompt: "The hero speaks once in Vietnamese with natural lip sync." }), true);
const pipelineSource = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
assert.match(pipelineSource, /expectedRenderDuration = nativeFilmAudio[\s\S]*_\.sumBy\(renderableScenes/);
process.stdout.write(JSON.stringify({ passed: true, timelineShots: timeline.length }));
