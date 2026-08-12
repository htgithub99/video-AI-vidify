import _ from "lodash";
import { AudioCueStatus, FinalQualityReport, ManualReviewItem, ManualReviewStatus, SceneAssetStatus, VideoProject } from "../types";

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
  const requiredThumbnails = _.max([1, _.toInteger(project.visualConfig?.thumbnailCount)]) || 1;
  const approvedThumbnails = _.size(_.filter(project.thumbnails, { approved: true }));
  const unapprovedThumbnails = _.max([0, requiredThumbnails - approvedThumbnails]) || 0;
  const audioBlockingErrors = project.voiceConfig.audioQa?.passed ? 0 : 1;
  const subtitleBlockingErrors = project.subtitleQa?.passed ? 0 : 1;
  const blockingErrors = _.compact([
    missingAssets > 0 && "missing_scene_assets",
    unapprovedScenes > 0 && "unapproved_scene_assets",
    unapprovedThumbnails > 0 && "unapproved_required_thumbnails",
    audioBlockingErrors > 0 && "audio_qa_failed",
    subtitleBlockingErrors > 0 && "subtitle_qa_failed",
    !project.editorQa?.passed && "editor_qa_failed",
    project.audioCueSheet && _.some(project.audioCueSheet.cues, cue => cue.required && (cue.status !== AudioCueStatus.Approved || _.isEmpty(cue.assetUrl))) && "required_sound_assets_missing",
    !project.scriptQa?.passed && "script_qa_failed",
    !project.storyboardQa?.passed && "storyboard_qa_failed",
    !project.contentSafety?.allowed && "content_safety_not_approved",
    _.isEmpty(project.renderedVideoUrl) && "final_render_missing",
    !project.finalMultimodalQa?.reviewAvailable && "final_multimodal_qa_required",
    project.finalMultimodalQa && !project.finalMultimodalQa.passed && "final_multimodal_qa_failed",
    _.some(project.manualReviewItems, { status: ManualReviewStatus.Pending }) && "manual_review_pending",
  ]);
  const warnings = _.uniq(_.compact(_.flatMap([
    project.scriptQa?.warnings,
    project.storyboardQa?.warnings,
    project.audioCueSheet && _.some(project.audioCueSheet.cues, { status: AudioCueStatus.Planned }) ? ["sound_design_cues_not_mixed"] : [],
    project.voiceConfig.audioQa?.warnings,
    project.subtitleQa?.warnings,
    project.editorQa?.warnings,
    _.some(project.storyboard, scene => scene.assetStatus === SceneAssetStatus.Approved && scene.assetError === "visual_qa_unavailable") ? ["scene_visual_qa_unavailable"] : [],
    _.some(project.storyboard, scene => scene.assetStatus === SceneAssetStatus.Approved && scene.assetError === "visual_quality_below_target") ? ["scene_visual_quality_below_target"] : [],
    _.some(project.thumbnails, thumbnail => thumbnail.approved && !thumbnail.qa?.passed) ? ["thumbnail_quality_below_target"] : [],
    !project.finalMultimodalQa ? ["final_multimodal_qa_missing"] : [],
    project.finalMultimodalQa?.warnings,
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
