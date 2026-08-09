import _ from "lodash";
import { ManualReviewStatus, SceneAssetStatus, VideoProject } from "../types";
export const resolveManualReview = (
  project: VideoProject,
  reviewId: string,
  status: ManualReviewStatus,
  note = "",
): VideoProject => {
  const item = _.find(project.manualReviewItems, { id: reviewId });
  if (!item) throw new Error("Manual review item was not found.");
  const resolvedAt = new Date().toISOString();
  const manualReviewItems = _.map(project.manualReviewItems, (current) =>
    current.id === reviewId
      ? { ...current, status, note, resolvedAt }
      : current,
  );
  let storyboard = project.storyboard,
    thumbnails = project.thumbnails;
  if (status === ManualReviewStatus.Approved && item.scope === "scene")
    storyboard = _.map(storyboard, (scene) =>
      scene.id === item.targetId && scene.assetUrl
        ? {
            ...scene,
            assetStatus: SceneAssetStatus.Approved,
            assetError: undefined,
          }
        : scene,
    );
  if (status === ManualReviewStatus.Approved && item.scope === "thumbnail")
    thumbnails = _.map(thumbnails, (thumbnail) =>
      thumbnail.id === item.targetId && thumbnail.imageUrl
        ? { ...thumbnail, approved: true }
        : thumbnail,
    );
  return {
    ...project,
    manualReviewItems,
    storyboard,
    thumbnails,
    updatedAt: resolvedAt,
  };
};
