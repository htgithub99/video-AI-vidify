import { resolveQualityProfile } from "../src/services/qualityProfileService.ts";
import { normalizeContentSafety } from "../src/services/contentSafetyService.ts";
import { rollbackSceneAssetRevision } from "../src/services/dependencyHashService.ts";
import { resolveRolloutConfig } from "../src/services/rolloutService.ts";
import { QualityMode, SceneAssetStatus } from "../src/types.ts";
import { writeVerificationLog } from "./verificationLogger.ts";
const assert = (value: unknown, message: string): void => {
  if (!value) throw new Error(message);
};
assert(!normalizeContentSafety({ sexualExploitationRisk: true }).allowed, "sexual exploitation safety gate failed");
assert(normalizeContentSafety({}).allowed, "incomplete safety review incorrectly blocked the pipeline");
const scene: any = {
  id: "sc_1",
  prompt: "p",
  script: "s",
  assetRevisionId: "r2",
  assetRevisions: [
    { id: "r1", assetUrl: "approved", status: SceneAssetStatus.Approved, promptHash: "h", createdAt: "" },
    { id: "r2", assetUrl: "current", status: SceneAssetStatus.Rejected, promptHash: "h", createdAt: "" },
  ],
};
const restored = rollbackSceneAssetRevision(scene, "r1");
assert(restored.assetUrl === "approved" && restored.assetRevisions.at(-1)?.operation === "rollback" && restored.assetRevisions.at(-1)?.parentRevisionId === "r2", "asset rollback lineage failed");
assert(resolveQualityProfile(QualityMode.Premium).draftCandidates === 1 && resolveQualityProfile().draftCandidates === 1, "single image generation policy failed");
const rollout = resolveRolloutConfig("project_1");
assert(rollout.flags.finalQc && rollout.flags.visualQa && rollout.qaMode === "advisory" && ["stable", "canary"].includes(rollout.releaseChannel), "advisory rollout config failed");
writeVerificationLog("Advanced safety/rollback/rollout assertions passed");
