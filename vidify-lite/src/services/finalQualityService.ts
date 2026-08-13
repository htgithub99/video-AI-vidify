import _ from "lodash";
import { FinalQualityReport, ManualReviewItem, ManualReviewStatus, SceneAssetStatus, VideoProject } from "../types";
import { getFinalCompletionReadiness } from "./pipelineCompletionPolicyService";

export const createManualReviewItems = (project: VideoProject): ManualReviewItem[] => {
  const createdAt = new Date().toISOString();
  const scenes = _.map(_.filter(project.storyboard || [], scene => scene.assetStatus !== SceneAssetStatus.Approved), scene => ({ id:`review_scene_${scene.id}`,scope:"scene" as const,targetId:scene.id,reason:scene.assetError||`scene_${scene.assetStatus}`,status:ManualReviewStatus.Pending,createdAt }));
  const thumbnails = _.map(_.filter(project.thumbnails || [], thumbnail => !thumbnail.approved), thumbnail => ({ id:`review_thumbnail_${thumbnail.id}`,scope:"thumbnail" as const,targetId:thumbnail.id,reason:_.join(thumbnail.qa?.blockingErrors,",")||"thumbnail_not_approved",status:ManualReviewStatus.Pending,createdAt }));
  const audio = project.voiceConfig.audioQa && !project.voiceConfig.audioQa.passed ? [{ id:"review_audio",scope:"audio" as const,reason:_.join(project.voiceConfig.audioQa.blockingErrors,",")||"audio_qa_failed",status:ManualReviewStatus.Pending,createdAt }] : [];
  const subtitles = project.subtitleQa && !project.subtitleQa.passed ? [{ id:"review_subtitle",scope:"subtitle" as const,reason:_.join(project.subtitleQa.blockingErrors,",")||"subtitle_qa_failed",status:ManualReviewStatus.Pending,createdAt }] : [];
  const finalVideo = project.finalMultimodalQa && project.finalMultimodalQa.reviewAvailable !== false && !project.finalMultimodalQa.passed ? [{ id:"review_final",scope:"final" as const,reason:_.join(project.finalMultimodalQa.blockingErrors,",")||"final_multimodal_qa_failed",status:ManualReviewStatus.Pending,createdAt }] : [];
  const resolvedHistory = _.filter(project.manualReviewItems || [], item => item.status !== ManualReviewStatus.Pending);
  return _.uniqBy([...resolvedHistory, ...scenes, ...thumbnails, ...audio, ...subtitles, ...finalVideo], "id");
};
export const evaluateFinalQuality = (project: VideoProject): FinalQualityReport => {
  const missingAssets = _.size(_.filter(project.storyboard, scene => _.isEmpty(scene.assetUrl)));
  const unapprovedScenes = _.size(_.filter(project.storyboard, scene => scene.assetStatus !== SceneAssetStatus.Approved));
  const unapprovedThumbnails = _.size(_.filter(project.thumbnails, thumbnail => !thumbnail.approved));
  const audioBlockingErrors = project.voiceConfig.audioQa?.blockingErrors?.length || 0;
  const subtitleBlockingErrors = project.subtitleQa?.blockingErrors?.length || 0;
  const completionReadiness = getFinalCompletionReadiness(project);
  const blockingErrors = completionReadiness.blockers;
  const warnings = _.uniq(_.compact(_.flatMap([
    project.scriptQa?.warnings,
    project.storyboardQa?.warnings,
    project.voiceConfig.audioQa?.warnings,
    project.subtitleQa?.warnings,
    project.editorQa?.warnings,
    _.some(project.storyboard, scene => scene.assetStatus === SceneAssetStatus.Approved && scene.assetError === "visual_qa_unavailable") ? ["scene_visual_qa_unavailable"] : [],
    _.some(project.storyboard, scene => scene.assetStatus === SceneAssetStatus.Approved && scene.assetError === "visual_quality_below_target") ? ["scene_visual_quality_below_target"] : [],
    _.some(project.thumbnails, thumbnail => thumbnail.approved && !thumbnail.qa?.passed) ? ["thumbnail_quality_below_target"] : [],
    !project.finalMultimodalQa ? ["final_multimodal_qa_missing"] : [],
    project.finalMultimodalQa?.warnings,
    unapprovedScenes > 0 ? ["scene_quality_review_recommended"] : [],
    unapprovedThumbnails > 0 ? ["thumbnail_quality_review_recommended"] : [],
    project.voiceConfig.audioQa && !project.voiceConfig.audioQa.passed ? ["audio_quality_review_recommended"] : [],
    project.subtitleQa && !project.subtitleQa.passed ? ["subtitle_quality_review_recommended"] : [],
    project.editorQa && !project.editorQa.passed ? ["editor_quality_review_recommended"] : [],
    project.scriptQa && !project.scriptQa.passed ? ["script_quality_review_recommended"] : [],
    project.storyboardQa && !project.storyboardQa.passed ? ["storyboard_quality_review_recommended"] : [],
    project.finalMultimodalQa && !project.finalMultimodalQa.passed ? ["final_quality_review_recommended"] : [],
  ])));
  return {
    visualBlockingErrors: unapprovedScenes + unapprovedThumbnails,
    audioBlockingErrors,
    subtitleBlockingErrors,
    missingAssets,
    continuityScore: project.finalMultimodalQa?.continuityScore || project.scriptQa?.continuityScore || 0,
    emotionalArcScore: project.scriptQa?.emotionalArcScore || 0,
    pacingScore: project.finalMultimodalQa?.pacingScore || 0,
    promiseAlignmentScore: project.finalMultimodalQa?.promiseAlignmentScore || project.scriptQa?.hookPayoffScore || 0,
    blockingErrors,
    warnings,
    publishable: _.isEmpty(blockingErrors),
  };
};
