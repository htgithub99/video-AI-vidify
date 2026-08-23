import assert from "node:assert/strict";
import fs from "node:fs";
import { getDurationText } from "../src/constants/data.ts";
import { ensureMediaSourcePlan } from "../src/services/mediaSourcePlanningService.ts";
import { pruneUnsupportedSceneCharacterIds } from "../src/services/sceneReferenceService.ts";
import { compileImagePrompt } from "../src/services/imagePromptCompilerService.ts";
import { isArchivalSearchCandidateRelevant } from "../src/server/services/archivalImageSearchService.ts";

const historicalScenes = Array.from({ length: 10 }, (_, index) => ({
  id: `sc_${index + 1}`,
  script: index === 0 ? "Trần Thủ Độ triệu tập các quan" : `Sự kiện lịch sử thứ ${index + 1}`,
  characterIds: ["tran_thu_do"],
})) as any[];
const planned = ensureMediaSourcePlan(historicalScenes, "History");
assert.ok(planned.filter(scene => scene.assetStrategy === "archival").length >= 4);
assert.ok(planned.filter(scene => scene.assetStrategy === "archival").every(scene => scene.archivalSearchQuery));

const characters = [{ id: "tran_thu_do", name: "Trần Thủ Độ", images: [], description: "statesman" }] as any[];
const pruned = pruneUnsupportedSceneCharacterIds(historicalScenes as any, characters);
assert.deepEqual(pruned[0].characterIds, ["tran_thu_do"]);
assert.deepEqual(pruned[1].characterIds, []);

const fallbackPrompt = compileImagePrompt({
  id: "sc_vi", script: "Chiến thắng Bạch Đằng với bãi cọc gỗ trên sông", textAllowed: false,
} as any, { targetStyle: "historical painterly reconstruction", aspectRatio: "16:9" });
assert.match(fallbackPrompt, /literal narrated event to depict: Chiến thắng Bạch Đằng/i);

assert.equal(getDurationText(true, "2m").targetWordCount, 500);
assert.equal(getDurationText(false, "2m").targetWordCount, 300);

const pipeline = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
assert.match(pipeline, /targetDurationSeconds: parseTargetDurationSeconds\(config\.duration\)/);
assert.match(pipeline, /failedSceneIds = new Set\(generationSummary\.failedSceneIds\)/);
assert.match(pipeline, /failedSceneIds\.has\(scene\.id\) && !hasSceneAsset\(scene\)/);
assert.equal(isArchivalSearchCandidateRelevant({
  mediaUrl: "https://example.com/cat.jpg",
  sourceUrl: "https://www.artofit.org/image-gallery/gorgeous-cat-breeds/",
  title: "21 gorgeous cat breeds with pictures",
}, "chiến thắng Bạch Đằng bãi cọc gỗ lịch sử"), false);
assert.equal(isArchivalSearchCandidateRelevant({
  mediaUrl: "https://example.com/bach-dang.jpg",
  sourceUrl: "https://example.com/di-tich-bach-dang",
  title: "Bãi cọc Bạch Đằng",
}, "chiến thắng Bạch Đằng bãi cọc gỗ lịch sử"), true);
console.log("Global story/media grounding assertions passed.");
