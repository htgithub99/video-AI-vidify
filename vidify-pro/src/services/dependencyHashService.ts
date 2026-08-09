import _ from "lodash";
import { AssetRevision, SceneAssetStatus, StoryboardScene } from "../types";
const DATA = /^data:[^;]+;base64,/i;
const stable = (v: unknown): unknown => {
  if (_.isString(v) && DATA.test(v)) return `[base64:${_.size(v)}]`;
  if (_.isArray(v)) return _.map(v, stable);
  if (_.isPlainObject(v))
    return _.fromPairs(
      _.map(_.sortBy(_.keys(v)), (k) => [k, stable(_.get(v, k))]),
    );
  return v;
};
export const createDependencyHash = (v: unknown) => {
  const input = JSON.stringify(stable(v));
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a_${(hash >>> 0).toString(16).padStart(8, "0")}`;
};
export const createSceneDependencyHash = (
  s: Pick<StoryboardScene, "id" | "prompt" | "script">,
  v: unknown,
) =>
  createDependencyHash({
    sceneId: s.id,
    prompt: s.prompt,
    script: s.script,
    visualDependencies: v,
  });
export const inheritApprovedSceneAsset = (
  s: StoryboardScene,
  p?: StoryboardScene,
): StoryboardScene =>
  p?.dependencyHash === s.dependencyHash &&
  p.assetStatus === SceneAssetStatus.Approved
    ? {
        ...s,
        assetUrl: p.assetUrl,
        assetUrls: p.assetUrls,
        assetType: p.assetType,
        assetStatus: p.assetStatus,
        assetRevisionId: p.assetRevisionId,
        assetRevisions: p.assetRevisions,
      }
    : s;
export const appendAssetRevision = (
  s: StoryboardScene,
  url: string,
  status: SceneAssetStatus,
): AssetRevision => {
  const r: AssetRevision = {
    id: `${s.id}_${Date.now()}_${_.size(s.assetRevisions) + 1}`,
    parentRevisionId: s.assetRevisionId,
    createdAt: new Date().toISOString(),
    promptHash: s.dependencyHash || createDependencyHash(s.prompt),
    assetUrl: url,
    status,
    approvedAt:
      status === SceneAssetStatus.Approved
        ? new Date().toISOString()
        : undefined,
  };
  s.assetRevisionId = r.id;
  s.assetRevisions = [..._.defaultTo(s.assetRevisions, []), r];
  return r;
};
export const rollbackSceneAssetRevision = (
  s: StoryboardScene,
  id: string,
): StoryboardScene => {
  const target = _.find(s.assetRevisions, {
    id,
    status: SceneAssetStatus.Approved,
  });
  if (!target)
    throw new Error("Only an approved asset revision can be restored.");
  const restored = {
    ...s,
    assetUrl: target.assetUrl,
    assetUrls: [target.assetUrl],
    assetStatus: SceneAssetStatus.Approved,
  };
  const revision = appendAssetRevision(
    restored,
    target.assetUrl,
    SceneAssetStatus.Approved,
  );
  revision.operation = "rollback";
  revision.parentRevisionId = s.assetRevisionId;
  return restored;
};
