import _ from "lodash";
import { AssetAcceptance, QaStatus, SceneAssetStatus, VideoProject } from "../types";
const CURRENT_PROJECT_SCHEMA_VERSION = 4;
export const migrateVideoProject = (project: VideoProject | null): VideoProject | null => {
  if (!project) return null;
  if (_.toInteger(project.schemaVersion) >= CURRENT_PROJECT_SCHEMA_VERSION) return project;
  return {
    ...project,
    schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
    storyboard: _.map(project.storyboard, (scene) => ({
      ...scene,
      assetStatus: scene.assetStatus || (scene.assetUrl ? SceneAssetStatus.Generated : SceneAssetStatus.Pending),
      qaStatus: scene.qaStatus || (scene.assetStatus === SceneAssetStatus.Approved ? QaStatus.Passed : scene.assetUrl ? QaStatus.Unavailable : undefined),
      acceptance: scene.acceptance || (scene.assetStatus === SceneAssetStatus.Approved ? AssetAcceptance.Approved : scene.assetUrl ? AssetAcceptance.AcceptedWithWarning : undefined),
      assetRevisions: _.defaultTo(scene.assetRevisions, []),
    })),
    thumbnails: _.map(project.thumbnails, (thumbnail) => ({
      ...thumbnail,
      qaStatus: thumbnail.qaStatus || (thumbnail.qa?.passed ? QaStatus.Passed : thumbnail.qa ? QaStatus.Failed : QaStatus.Unavailable),
      acceptance: thumbnail.acceptance || (thumbnail.qa?.passed ? AssetAcceptance.Approved : thumbnail.imageUrl ? AssetAcceptance.AcceptedWithWarning : AssetAcceptance.Rejected),
    })),
    manualReviewItems: _.defaultTo(project.manualReviewItems, []),
    aiMetrics: _.defaultTo(project.aiMetrics, []),
  };
};
