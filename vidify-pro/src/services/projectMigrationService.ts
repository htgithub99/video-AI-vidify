import _ from "lodash";
import { SceneAssetStatus, VideoProject } from "../types";
export const CURRENT_PROJECT_SCHEMA_VERSION = 3;
export const migrateVideoProject = (
  project: VideoProject | null,
): VideoProject | null => {
  if (!project) return null;
  if (_.toInteger(project.schemaVersion) >= CURRENT_PROJECT_SCHEMA_VERSION)
    return project;
  return {
    ...project,
    schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
    storyboard: _.map(project.storyboard, (scene) => ({
      ...scene,
      assetStatus:
        scene.assetStatus ||
        (scene.assetUrl
          ? SceneAssetStatus.Generated
          : SceneAssetStatus.Pending),
      assetRevisions: _.defaultTo(scene.assetRevisions, []),
    })),
    manualReviewItems: _.defaultTo(project.manualReviewItems, []),
    aiMetrics: _.defaultTo(project.aiMetrics, []),
  };
};
