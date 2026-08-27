import _ from "lodash";
import { MANUAL_REVIEW_CONFIG } from "../constants/config";
import { ManualReviewStatus, SceneAssetStatus, VideoProject } from "../types";

const approveScene = (project: VideoProject, targetId?: string): VideoProject["storyboard"] => _.map(project.storyboard, (scene) => (scene.id === targetId && scene.assetUrl ? { ...scene, assetStatus: SceneAssetStatus.Approved, assetError: undefined } : scene));

const approveThumbnail = (project: VideoProject, targetId?: string): VideoProject["thumbnails"] => _.map(project.thumbnails, (thumbnail) => (thumbnail.id === targetId && thumbnail.imageUrl ? { ...thumbnail, approved: true } : thumbnail));

export const resolveManualReview = (project: VideoProject, reviewId: string, status: ManualReviewStatus, note = ""): VideoProject => {
  const item = _.find(project.manualReviewItems, { id: reviewId });
  if (!item) throw new Error(MANUAL_REVIEW_CONFIG.ITEM_NOT_FOUND_ERROR);
  const resolvedAt = new Date().toISOString();
  const manualReviewItems = _.map(project.manualReviewItems, (current) => (current.id === reviewId ? { ...current, status, note, resolvedAt } : current));
  const isApproved = status === ManualReviewStatus.Approved;
  const storyboard = isApproved && item.scope === MANUAL_REVIEW_CONFIG.SCOPE_SCENE ? approveScene(project, item.targetId) : project.storyboard;
  const thumbnails = isApproved && item.scope === MANUAL_REVIEW_CONFIG.SCOPE_THUMBNAIL ? approveThumbnail(project, item.targetId) : project.thumbnails;
  return { ...project, manualReviewItems, storyboard, thumbnails, updatedAt: resolvedAt };
};
