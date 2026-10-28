import { SOURCE_TEMPLATE_SYMBOL_69, SOURCE_TEMPLATE_SYMBOL_70, SOURCE_TEXT_DATA } from "../constants/sourceText";
import _ from "lodash";
import { jsonUtils } from "../lib/json";
import { DEPENDENCY_HASH_CONFIG } from "../constants/config";
import { AssetRevision, SceneAssetStatus, StoryboardScene } from "../types";
const stableValue = (value: unknown): unknown => {
  if (_.isString(value) && DEPENDENCY_HASH_CONFIG.DATA_URL_PATTERN.test(value)) {
    return SOURCE_TEMPLATE_SYMBOL_69(`${DEPENDENCY_HASH_CONFIG.BASE64_PLACEHOLDER_PREFIX}`, `${_.size(value)}`);
  }
  if (_.isArray(value)) return _.map(value, stableValue);
  if (_.isPlainObject(value)) {
    return _.fromPairs(_.map(_.sortBy(_.keys(value)), (key) => [key, stableValue(_.get(value, key))]));
  }
  return value;
};
export const createDependencyHash = (value: unknown): string => {
  const input = jsonUtils.safeStringify(stableValue(value));
  let hash: number = DEPENDENCY_HASH_CONFIG.FNV_OFFSET_BASIS;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, DEPENDENCY_HASH_CONFIG.FNV_PRIME);
  }
  const hexadecimalHash = (hash >>> 0).toString(DEPENDENCY_HASH_CONFIG.RADIX_HEXADECIMAL).padStart(DEPENDENCY_HASH_CONFIG.HASH_PADDING_LENGTH, DEPENDENCY_HASH_CONFIG.HASH_PADDING_CHARACTER);
  return `${DEPENDENCY_HASH_CONFIG.HASH_PREFIX}${hexadecimalHash}`;
};
export const createSceneDependencyHash = (scene: Pick<StoryboardScene, "id" | "prompt" | "script">, visualDependencies: unknown): string => createDependencyHash({ sceneId: scene.id, prompt: scene.prompt, script: scene.script, visualDependencies });
export const inheritApprovedSceneAsset = (scene: StoryboardScene, previous?: StoryboardScene): StoryboardScene =>
  previous?.dependencyHash === scene.dependencyHash && previous.assetStatus === SceneAssetStatus.Approved
    ? { ...scene, assetUrl: previous.assetUrl, assetUrls: previous.assetUrls, assetType: previous.assetType, assetStatus: previous.assetStatus, assetRevisionId: previous.assetRevisionId, assetRevisions: previous.assetRevisions }
    : previous?.remoteVideoDownloadPending && (!_.isEmpty(previous.remoteVideoMediaIds) || !_.isEmpty(previous.remoteVideoMediaId))
      ? { ...scene, assetStatus: SceneAssetStatus.Failed, assetError: previous.assetError, remoteVideoMediaId: previous.remoteVideoMediaId, remoteVideoMediaIds: previous.remoteVideoMediaIds, remoteVideoSourceUrl: previous.remoteVideoSourceUrl, remoteVideoExpectedCount: previous.remoteVideoExpectedCount, remoteVideoDownloadPending: true }
      : scene;
export const appendAssetRevision = (scene: StoryboardScene, assetUrl: string, status: SceneAssetStatus): AssetRevision => {
  const revisionIndex = _.size(scene.assetRevisions) + DEPENDENCY_HASH_CONFIG.REVISION_INDEX_OFFSET;
  const revision: AssetRevision = {
    id: SOURCE_TEMPLATE_SYMBOL_70(`${scene.id}`, `${Date.now()}`, `${revisionIndex}`),
    parentRevisionId: scene.assetRevisionId,
    createdAt: new Date().toISOString(),
    promptHash: scene.dependencyHash || createDependencyHash(scene.prompt),
    assetUrl: _.startsWith(assetUrl, SOURCE_TEXT_DATA) ? "" : assetUrl,
    status,
    approvedAt: status === SceneAssetStatus.Approved ? new Date().toISOString() : undefined,
  };
  scene.assetRevisionId = revision.id;
  scene.assetRevisions = [..._.defaultTo(scene.assetRevisions, []), revision];
  return revision;
};
export const rollbackSceneAssetRevision = (scene: StoryboardScene, revisionId: string): StoryboardScene => {
  const target = _.find(scene.assetRevisions, { id: revisionId, status: SceneAssetStatus.Approved });
  if (!target) throw new Error(DEPENDENCY_HASH_CONFIG.APPROVED_REVISION_REQUIRED);
  const restored = { ...scene, assetUrl: target.assetUrl, assetUrls: [target.assetUrl], assetStatus: SceneAssetStatus.Approved };
  const revision = appendAssetRevision(restored, target.assetUrl, SceneAssetStatus.Approved);
  revision.operation = DEPENDENCY_HASH_CONFIG.ROLLBACK_OPERATION;
  revision.parentRevisionId = scene.assetRevisionId;
  return restored;
};
