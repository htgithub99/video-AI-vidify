import assert from "node:assert/strict";
import { SplitStrategy } from "../src/constants/enums.ts";
import { calculateStoryboardScriptCoverage, createScriptGroundedStoryboard, ensureScriptGroundedSceneDetails, ensureStoryboardScriptCoverage } from "../src/services/storyboardFallbackService.ts";

const script = "Minh bước vào căn phòng tối. Anh đặt chiếc chìa khóa lên bàn. Cánh cửa phía sau bất ngờ khép lại.";
const scenes = createScriptGroundedStoryboard({
  rewrittenScript: script,
  chapters: [{ id: "chapter_1", title: "Mở đầu", scriptSegment: script }],
  splitStrategy: SplitStrategy.SHORT_SENTENCE,
  aspectRatio: "16:9",
  targetStyle: "cinematic editorial illustration",
});

assert.equal(scenes.length, 3);
assert.equal(scenes.map(scene => scene.script).join(" "), script);
assert.equal(scenes.every(scene => scene.chapterId === "chapter_1"), true);
assert.equal(scenes.every(scene => Boolean(scene.prompt)), true);
assert.equal(scenes.every(scene => scene.prompt.includes("16:9")), true);
assert.equal(scenes.some(scene => scene.assetUrl), false);

const hydratedScenes = ensureScriptGroundedSceneDetails([{ ...scenes[0], prompt: "", visibleAction: "" }]);
assert.equal(hydratedScenes[0].visibleAction, scenes[0].script);
assert.notEqual(hydratedScenes[0].prompt, "");

const sparseStoryboard = ensureStoryboardScriptCoverage([scenes[0]], {
  rewrittenScript: script,
  chapters: [{ id: "chapter_1", title: "Má»Ÿ Ä‘áº§u", scriptSegment: script }],
  splitStrategy: SplitStrategy.SHORT_SENTENCE,
  aspectRatio: "16:9",
  targetStyle: "cinematic editorial illustration",
});
assert.equal(sparseStoryboard.length, 3);
assert.equal(calculateStoryboardScriptCoverage(script, sparseStoryboard), 1);

process.stdout.write("Storyboard fallback assertions passed.\n");
