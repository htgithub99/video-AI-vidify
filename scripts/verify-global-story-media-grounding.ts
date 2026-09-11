import assert from "node:assert/strict";
import fs from "node:fs";
import { getDurationText } from "../src/constants/data.ts";
import { ensureMediaSourcePlan } from "../src/services/mediaSourcePlanningService.ts";
import { pruneUnsupportedSceneCharacterIds } from "../src/services/sceneReferenceService.ts";
import { isArchivalSearchCandidateRelevant } from "../src/server/services/archivalImageSearchService.ts";

const historicalScenes = Array.from({ length: 10 }, (_, index) => ({
  id: `sc_${index + 1}`,
  script: [
    "Trần Thủ Độ triệu tập các quan",
    "Năm 1225 diễn ra chuyển giao triều đại",
    "Hoàng thành Thăng Long trở thành trung tâm quyền lực",
    "Bản đồ trận Bạch Đằng năm 1288",
    "Ấn triều đình được lưu giữ như hiện vật",
  ][index] || `Sự kiện lịch sử thứ ${index + 1}`,
  characterIds: ["tran_thu_do"],
  visualIntent: "Show exact material evidence for the narrated historical claim",
  visibleAction: "A conservator points to the dated artifact in a museum display",
  reaction: "Visitors lean closer to inspect the evidence",
  storyEvidence: index < 7 ? "Surviving Tran dynasty artifact, inscription, map or documented historic site" : "Explicit historical reconstruction",
  visualHook: "The dated evidence is isolated as the clear focal point",
  composition: "Evidence-led foreground with contextual museum or site background",
  assetStrategy: index < 7 ? "archival" : "ai_generated",
  archivalSearchQuery: index < 7 ? `Tran dynasty Vietnam museum artifact historical evidence item ${index + 1}` : "",
  archivalRationale: index < 7 ? "A licensed authentic artifact directly grounds this factual scene" : "Reconstruction is editorially appropriate",
})) as any[];
const planned = ensureMediaSourcePlan(historicalScenes, "History");
assert.ok(planned.filter(scene => scene.assetStrategy === "archival").length >= 6);
assert.ok(planned.filter(scene => scene.assetStrategy === "archival").every(scene => scene.archivalSearchQuery));
const unsafeRawNarrationPlan = ensureMediaSourcePlan([{
  ...historicalScenes[0],
  id: "unsafe_raw_query",
  assetStrategy: "archival",
  archivalSearchQuery: historicalScenes[0].script,
} as any], "History");
assert.equal(unsafeRawNarrationPlan[0].assetStrategy, "ai_generated");

const characters = [{ id: "tran_thu_do", name: "Trần Thủ Độ", images: [], description: "statesman" }] as any[];
const pruned = pruneUnsupportedSceneCharacterIds(historicalScenes as any, characters);
assert.deepEqual(pruned[0].characterIds, ["tran_thu_do"]);
assert.deepEqual(pruned[1].characterIds, []);

assert.equal(getDurationText(true, "2m").targetWordCount, 500);
assert.equal(getDurationText(false, "2m").targetWordCount, 300);

const pipeline = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
assert.match(pipeline, /targetDurationSeconds: parseTargetDurationSeconds\(config\.duration\)/);
assert.match(pipeline, /failedSceneIds = new Set\(generationSummary\.failedSceneIds\)/);
assert.match(pipeline, /failedSceneIds\.has\(scene\.id\) && !hasSceneAsset\(scene\)/);
assert.match(pipeline, /unresolvedSourceScenes/);
assert.match(pipeline, /Authentic source unavailable; AI reconstruction used/);
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
assert.equal(isArchivalSearchCandidateRelevant({
  mediaUrl: "https://example.com/tent.jpg",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Xay_dung_leu.jpg",
  title: "Xây dựng lều",
}, "Để xây dựng một triều đại, quân Nguyên Mông tràn sang biên giới"), false);
assert.equal(isArchivalSearchCandidateRelevant({
  mediaUrl: "https://example.com/pharmacy.jpg",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Hieu_thuoc_duong_Tran_Hung_Dao.jpg",
  title: "Hiệu thuốc trên đường Trần Hưng Đạo",
}, "Trần Quốc Tuấn triển khai mai phục trên sông Bạch Đằng"), false);
assert.match(pipeline, /Authentic candidates failed semantic QA; explicit AI reconstruction required/);
assert.doesNotMatch(pipeline, /compileImagePrompt|createScriptGroundedStoryboard|ensureStoryboardScriptCoverage/);
console.log("Global story/media grounding assertions passed.");
