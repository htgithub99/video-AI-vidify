import _ from "lodash";
import {
  FinalQualityReport,
  ManualReviewItem,
  ManualReviewStatus,
  SceneAssetStatus,
  VideoProject,
} from "../types";
export const createManualReviewItems = (
  project: VideoProject,
): ManualReviewItem[] => {
  const createdAt = new Date().toISOString();
  const scenes = _.map(
    _.filter(
      project.storyboard,
      (scene) => scene.assetStatus !== SceneAssetStatus.Approved,
    ),
    (scene) => ({
      id: `review_scene_${scene.id}`,
      scope: "scene" as const,
      targetId: scene.id,
      reason: scene.assetError || `scene_${scene.assetStatus}`,
      status: ManualReviewStatus.Pending,
      createdAt,
    }),
  );
  const thumbnails = _.map(
    _.filter(project.thumbnails, (thumbnail) => !thumbnail.approved),
    (thumbnail) => ({
      id: `review_thumbnail_${thumbnail.id}`,
      scope: "thumbnail" as const,
      targetId: thumbnail.id,
      reason:
        _.join(thumbnail.qa?.blockingErrors, ",") || "thumbnail_not_approved",
      status: ManualReviewStatus.Pending,
      createdAt,
    }),
  );
  return _.uniqBy(
    [
      ..._.filter(
        project.manualReviewItems,
        (item) => item.status !== ManualReviewStatus.Pending,
      ),
      ...scenes,
      ...thumbnails,
    ],
    "id",
  );
};
export const evaluateFinalQuality = (
  project: VideoProject,
): FinalQualityReport => {
  const missingAssets = _.size(
    _.filter(project.storyboard, (scene) => _.isEmpty(scene.assetUrl)),
  );
  const unapprovedScenes = _.size(
    _.filter(
      project.storyboard,
      (scene) => scene.assetStatus !== SceneAssetStatus.Approved,
    ),
  );
  const requiredThumbnails =
    _.max([1, _.toInteger(project.visualConfig?.thumbnailCount)]) || 1;
  const unapprovedThumbnails =
    _.max([
      0,
      requiredThumbnails -
        _.size(_.filter(project.thumbnails, { approved: true })),
    ]) || 0;
  const audioBlockingErrors = project.voiceConfig.audioQa?.passed ? 0 : 1;
  const subtitleBlockingErrors = project.subtitleQa?.passed ? 0 : 1;
  const blockingErrors = _.compact([
    missingAssets > 0 && "missing_scene_assets",
    unapprovedScenes > 0 && "unapproved_scene_assets",
    unapprovedThumbnails > 0 && "unapproved_required_thumbnails",
    audioBlockingErrors > 0 && "audio_qa_failed",
    subtitleBlockingErrors > 0 && "subtitle_qa_failed",
    !project.editorQa?.passed && "editor_qa_failed",
    !project.scriptQa?.passed && "script_qa_failed",
    !project.storyboardQa?.passed && "storyboard_qa_failed",
    !project.contentSafety?.allowed && "content_safety_not_approved",
    _.isEmpty(project.audioCueSheet) && "sound_design_cue_sheet_missing",
    _.isEmpty(project.renderedVideoUrl) && "final_render_missing",
    _.some(project.manualReviewItems, { status: ManualReviewStatus.Pending }) &&
      "manual_review_pending",
  ]);
  return {
    visualBlockingErrors: unapprovedScenes + unapprovedThumbnails,
    audioBlockingErrors,
    subtitleBlockingErrors,
    missingAssets,
    continuityScore: project.scriptQa?.continuityScore || 0,
    emotionalArcScore: project.scriptQa?.emotionalArcScore || 0,
    pacingScore: project.editorQa?.passed ? 100 : 0,
    promiseAlignmentScore: project.scriptQa?.hookPayoffScore || 0,
    blockingErrors,
    warnings: [],
    publishable: _.isEmpty(blockingErrors),
  };
};
