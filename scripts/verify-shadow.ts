import { writeVerificationLog } from "./verificationLogger.ts";
import { createShadowComparison } from "../src/services/shadowComparisonService.ts";
import { SceneAssetStatus } from "../src/types.ts";
const baseline: any = { id: "old", storyboard: [{ duration: 60, assetStatus: SceneAssetStatus.Approved }], scriptQa: { continuityScore: 90, hookPayoffScore: 85 } };
const current: any = {
  storyboard: [
    { duration: 30, assetStatus: SceneAssetStatus.Approved },
    { duration: 30, assetStatus: SceneAssetStatus.Approved },
  ],
  scriptQa: { continuityScore: 96, hookPayoffScore: 90 },
  benchmark: { estimatedCostUsd: 0.2 },
};
const result = createShadowComparison(baseline, current);
if (!result.improved || result.regressions.length || result.approvedSceneDelta !== 1) throw new Error("Shadow comparison failed");
writeVerificationLog("Shadow comparison assertion passed");
