import { assignStoryboardChapterIds } from "../src/utils/storyboardChapterUtils.ts";
const scenes = assignStoryboardChapterIds(
  [{ script: "one two three" }, { script: "four five six" }, { script: "seven eight nine" }, { script: "ten eleven twelve" }],
  [
    { id: "ch_1", scriptSegment: "one two three four five six" },
    { id: "ch_2", scriptSegment: "seven eight nine ten eleven twelve" },
  ],
);
if (scenes.map((scene) => scene.chapterId).join(",") !== "ch_1,ch_1,ch_2,ch_2") throw new Error("Storyboard chapters were assigned cyclically");
process.stdout.write("Storyboard chapter assertions passed\n");
