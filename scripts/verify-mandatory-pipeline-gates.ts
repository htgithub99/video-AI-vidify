import assert from "node:assert/strict";
import fs from "node:fs";
import { getCinematicScriptReadinessIssues, getCinematicGeneratedTakeIssues } from "../src/services/cinematicProductionPolicyService";
import { AssetAcceptance, GenerateType, QaStatus, SceneAssetStatus } from "../src/types";

const incompleteScriptIssues = getCinematicScriptReadinessIssues(
  "Tôn Ngộ Không vung gậy nhưng câu chuyện đang v",
  [{ id: "ch_1", title: "Một", scriptSegment: "Câu chuyện đang v" }],
  { passed: true, durationFit: true } as any,
  { allowed: true } as any,
);
assert(incompleteScriptIssues.includes("script:incomplete_ending"));
assert(incompleteScriptIssues.includes("chapters:incomplete_ending"));

const takeIssues = getCinematicGeneratedTakeIssues(
  [
    {
      id: "sc_1",
      assetUrl: "/assets/projects/test/videos/sc_1.mp4",
      assetType: GenerateType.Video,
      assetStatus: SceneAssetStatus.Approved,
      qaStatus: QaStatus.Passed,
      acceptance: AssetAcceptance.Approved,
    },
    { id: "sc_2", assetType: GenerateType.Video, assetStatus: SceneAssetStatus.Failed, qaStatus: QaStatus.Failed, acceptance: AssetAcceptance.Rejected },
  ] as any,
  2,
);
assert(takeIssues.includes("sc_2:asset_missing"));
assert(takeIssues.includes("sc_2:qa_failed"));

const pipelineSource = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
assert.doesNotMatch(pipelineSource, /No valid take remains[\s\S]{0,300}realScenes\s*=\s*_\.filter/, "pipeline still deletes failed scenes before render");
assert.match(pipelineSource, /getCinematicGeneratedTakeIssues/, "mandatory take gate is not connected");
assert.match(pipelineSource, /retryScenes[\s\S]*runSceneGeneration\(retryScenes/, "failed-scene-only media retry is not connected");
process.stdout.write(JSON.stringify({ passed: true, incompleteScriptIssues, takeIssues }));
