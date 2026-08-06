import _ from "lodash";
import { AssetRevision, SceneAssetStatus, StoryboardScene } from "../types";

const DATA_URL_PATTERN = /^data:[^;]+;base64,/i;
const stableValue = (value: unknown): unknown => {
  if (_.isString(value) && DATA_URL_PATTERN.test(value)) return `[base64:${_.size(value)}]`;
  if (_.isArray(value)) return _.map(value, stableValue);
  if (_.isPlainObject(value)) return _.fromPairs(_.map(_.sortBy(_.keys(value)), key => [key, stableValue(_.get(value, key))]));
  return value;
};
export const createDependencyHash = (value: unknown): string => {
  const input = JSON.stringify(stableValue(value));
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) { hash ^= input.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return `fnv1a_${(hash >>> 0).toString(16).padStart(8, "0")}`;
};
export const createSceneDependencyHash = (scene: Pick<StoryboardScene, "id" | "prompt" | "script">, visualDependencies: unknown): string => createDependencyHash({ sceneId: scene.id, prompt: scene.prompt, script: scene.script, visualDependencies });
export const inheritApprovedSceneAsset = (scene: StoryboardScene, previous?: StoryboardScene): StoryboardScene => previous?.dependencyHash === scene.dependencyHash && previous.assetStatus === SceneAssetStatus.Approved ? { ...scene, assetUrl: previous.assetUrl, assetUrls: previous.assetUrls, assetType: previous.assetType, assetStatus: previous.assetStatus, assetRevisionId: previous.assetRevisionId, assetRevisions: previous.assetRevisions } : scene;
export const appendAssetRevision = (scene: StoryboardScene, assetUrl: string, status: SceneAssetStatus): AssetRevision => { const revision: AssetRevision = { id: `${scene.id}_${Date.now()}_${_.size(scene.assetRevisions) + 1}`, parentRevisionId: scene.assetRevisionId, createdAt: new Date().toISOString(), promptHash: scene.dependencyHash || createDependencyHash(scene.prompt), assetUrl, status, approvedAt: status === SceneAssetStatus.Approved ? new Date().toISOString() : undefined }; scene.assetRevisionId = revision.id; scene.assetRevisions = [..._.defaultTo(scene.assetRevisions, []), revision]; return revision; };
export const rollbackSceneAssetRevision = (scene: StoryboardScene, revisionId: string): StoryboardScene => {
  const target=_.find(scene.assetRevisions,{id:revisionId,status:SceneAssetStatus.Approved});if(!target)throw new Error("Only an approved asset revision can be restored.");const restored={...scene,assetUrl:target.assetUrl,assetUrls:[target.assetUrl],assetStatus:SceneAssetStatus.Approved};const revision=appendAssetRevision(restored,target.assetUrl,SceneAssetStatus.Approved);revision.operation="rollback";revision.parentRevisionId=scene.assetRevisionId;return restored;
};
