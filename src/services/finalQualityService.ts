import {
  SOURCE_TEMPLATE_REVIEW_SCENE,
  SOURCE_TEMPLATE_REVIEW_THUMBNAIL,
  SOURCE_TEMPLATE_SCENE,
  SOURCE_TEMPLATE_THUMBNAIL,
  SOURCE_TEXT_AUDIO,
  SOURCE_TEXT_AUDIO_QA_FAILED,
  SOURCE_TEXT_AUDIO_QUALITY_REVIEW_RECOMMENDED,
  SOURCE_TEXT_COMPLETED_WITH_WARNINGS,
  SOURCE_TEXT_EDITORIALLY_PUBLISHABLE,
  SOURCE_TEXT_EDITOR_QUALITY_REVIEW_RECOMMENDED,
  SOURCE_TEXT_FINAL,
  SOURCE_TEXT_FINAL_MULTIMODAL_QA_FAILED,
  SOURCE_TEXT_FINAL_MULTIMODAL_QA_MISSING,
  SOURCE_TEXT_FINAL_MULTIMODAL_QA_UNAVAILABLE,
  SOURCE_TEXT_FINAL_QUALITY_REVIEW_RECOMMENDED,
  SOURCE_TEXT_ID,
  SOURCE_TEXT_NOT_APPROVED,
  SOURCE_TEXT_REVIEW_AUDIO,
  SOURCE_TEXT_REVIEW_FINAL,
  SOURCE_TEXT_REVIEW_SUBTITLE,
  SOURCE_TEXT_SCENE,
  SOURCE_TEXT_SCENE_QUALITY_REVIEW_RECOMMENDED,
  SOURCE_TEXT_SCENE_VISUAL_QA_UNAVAILABLE,
  SOURCE_TEXT_SCENE_VISUAL_QUALITY_BELOW_TARGET,
  SOURCE_TEXT_SCRIPT_QUALITY_REVIEW_RECOMMENDED,
  SOURCE_TEXT_STORYBOARD_QUALITY_REVIEW_RECOMMENDED,
  SOURCE_TEXT_SUBTITLE,
  SOURCE_TEXT_SUBTITLE_QA_FAILED,
  SOURCE_TEXT_SUBTITLE_QUALITY_REVIEW_RECOMMENDED,
  SOURCE_TEXT_SYMBOL_4,
  SOURCE_TEXT_TECHNICAL_COMPLETE,
  SOURCE_TEXT_THUMBNAIL,
  SOURCE_TEXT_THUMBNAIL_QUALITY_BELOW_TARGET,
  SOURCE_TEXT_THUMBNAIL_QUALITY_REVIEW_RECOMMENDED,
  SOURCE_TEXT_VISUAL_QA_UNAVAILABLE,
  SOURCE_TEXT_VISUAL_QUALITY_BELOW_TARGET,
} from "../constants/sourceText";
import _ from "lodash";
import { AssetAcceptance, FinalQualityReport, ManualReviewItem, ManualReviewStatus, QaStatus, SceneAssetStatus, SubtitleMode, VideoProject } from "../types";
import { getFinalCompletionReadiness } from "./pipelineCompletionPolicyService";
import { hasSceneAsset } from "./projectImageGenerationService";
const FINAL_QA_EVIDENCE_UNAVAILABLE_PATTERN = /(?:no chronological frames|rendered audio mix.*(?:supplied|provided)|final[_ ]?qa.*(?:unavailable|missing)|visual[_ ]?qa.*unavailable)/i;
const getUsableFinalQaBlockingErrors = (project: VideoProject): string[] => _.filter(_.defaultTo(project.finalMultimodalQa?.blockingErrors, []), (error) => !FINAL_QA_EVIDENCE_UNAVAILABLE_PATTERN.test(_.toString(error)));
const requiresSceneReview = (scene: VideoProject["storyboard"][number]): boolean => !hasSceneAsset(scene) || scene.acceptance === AssetAcceptance.Rejected || _.includes([SceneAssetStatus.Rejected, SceneAssetStatus.Failed], scene.assetStatus);
export const createManualReviewItems = (project: VideoProject): ManualReviewItem[] => {
  const createdAt = new Date().toISOString();
  const finalQaBlockingErrors = getUsableFinalQaBlockingErrors(project);
  const scenes: ManualReviewItem[] = _.map(_.filter(project.storyboard || [], requiresSceneReview), (scene) => ({ id: SOURCE_TEMPLATE_REVIEW_SCENE(`${scene.id}`), scope: SOURCE_TEXT_SCENE, targetId: scene.id, reason: scene.assetError || SOURCE_TEMPLATE_SCENE(`${scene.qaStatus || scene.assetStatus}`), status: ManualReviewStatus.Pending, createdAt }));
  const thumbnails: ManualReviewItem[] = _.map(
    _.filter(project.thumbnails || [], (thumbnail) => thumbnail.acceptance === AssetAcceptance.Rejected),
    (thumbnail) => ({ id: SOURCE_TEMPLATE_REVIEW_THUMBNAIL(`${thumbnail.id}`), scope: SOURCE_TEXT_THUMBNAIL, targetId: thumbnail.id, reason: _.join(thumbnail.qa?.blockingErrors, SOURCE_TEXT_SYMBOL_4) || SOURCE_TEMPLATE_THUMBNAIL(`${thumbnail.qaStatus || SOURCE_TEXT_NOT_APPROVED}`), status: ManualReviewStatus.Pending, createdAt }),
  );
  const audio: ManualReviewItem[] = project.voiceConfig.audioQa && !_.isEmpty(project.voiceConfig.audioQa.blockingErrors) ? [{ id: SOURCE_TEXT_REVIEW_AUDIO, scope: SOURCE_TEXT_AUDIO, reason: _.join(project.voiceConfig.audioQa.blockingErrors, SOURCE_TEXT_SYMBOL_4) || SOURCE_TEXT_AUDIO_QA_FAILED, status: ManualReviewStatus.Pending, createdAt }] : [];
  const subtitles: ManualReviewItem[] = project.config?.subtitleMode !== SubtitleMode.None && project.subtitleQa && !_.isEmpty(project.subtitleQa.blockingErrors) ? [{ id: SOURCE_TEXT_REVIEW_SUBTITLE, scope: SOURCE_TEXT_SUBTITLE, reason: _.join(project.subtitleQa.blockingErrors, SOURCE_TEXT_SYMBOL_4) || SOURCE_TEXT_SUBTITLE_QA_FAILED, status: ManualReviewStatus.Pending, createdAt }] : [];
  const finalVideo: ManualReviewItem[] = project.finalMultimodalQa && project.finalMultimodalQa.reviewAvailable !== false && !_.isEmpty(finalQaBlockingErrors) ? [{ id: SOURCE_TEXT_REVIEW_FINAL, scope: SOURCE_TEXT_FINAL, reason: _.join(finalQaBlockingErrors, SOURCE_TEXT_SYMBOL_4) || SOURCE_TEXT_FINAL_MULTIMODAL_QA_FAILED, status: ManualReviewStatus.Pending, createdAt }] : [];
  const resolvedHistory = _.filter(project.manualReviewItems || [], (item) => item.status !== ManualReviewStatus.Pending);
  return _.uniqBy([...resolvedHistory, ...scenes, ...thumbnails, ...audio, ...subtitles, ...finalVideo], SOURCE_TEXT_ID);
};
export const evaluateFinalQuality = (project: VideoProject): FinalQualityReport => {
  const subtitlesEnabled = project.config?.subtitleMode !== SubtitleMode.None;
  const missingAssets = _.size(_.filter(project.storyboard, (scene) => _.isEmpty(scene.assetUrl)));
  const unapprovedScenes = _.size(_.filter(project.storyboard, requiresSceneReview));
  const unapprovedThumbnails = _.size(_.filter(project.thumbnails, (thumbnail) => thumbnail.acceptance === AssetAcceptance.Rejected));
  const audioBlockingErrors = _.size(project.voiceConfig.audioQa?.blockingErrors);
  const subtitleBlockingErrors = subtitlesEnabled ? _.size(project.subtitleQa?.blockingErrors) : 0;
  const completionReadiness = getFinalCompletionReadiness(project);
  const finalQaBlockingErrors = getUsableFinalQaBlockingErrors(project);
  const blockingErrors = _.uniq([...completionReadiness.blockers, ...(project.finalMultimodalQa?.reviewAvailable === false ? [] : finalQaBlockingErrors)]);
  const warnings = _.uniq(
    _.compact(
      _.flatMap([
        project.scriptQa?.warnings,
        project.storyboardQa?.warnings,
        project.voiceConfig.audioQa?.warnings,
        subtitlesEnabled ? project.subtitleQa?.warnings : [],
        project.editorQa?.warnings,
        _.some(project.storyboard, (scene) => scene.qaStatus === QaStatus.Unavailable || scene.assetError === SOURCE_TEXT_VISUAL_QA_UNAVAILABLE) ? [SOURCE_TEXT_SCENE_VISUAL_QA_UNAVAILABLE] : [],
        _.some(project.storyboard, (scene) => scene.assetStatus === SceneAssetStatus.Approved && scene.assetError === SOURCE_TEXT_VISUAL_QUALITY_BELOW_TARGET) ? [SOURCE_TEXT_SCENE_VISUAL_QUALITY_BELOW_TARGET] : [],
        _.some(project.thumbnails, (thumbnail) => thumbnail.acceptance === AssetAcceptance.AcceptedWithWarning) ? [SOURCE_TEXT_THUMBNAIL_QUALITY_BELOW_TARGET] : [],
        !project.finalMultimodalQa ? [SOURCE_TEXT_FINAL_MULTIMODAL_QA_MISSING] : [],
        project.finalMultimodalQa?.warnings,
        _.some(project.finalMultimodalQa?.blockingErrors, (error) => FINAL_QA_EVIDENCE_UNAVAILABLE_PATTERN.test(_.toString(error))) ? [SOURCE_TEXT_FINAL_MULTIMODAL_QA_UNAVAILABLE] : [],
        unapprovedScenes > 0 ? [SOURCE_TEXT_SCENE_QUALITY_REVIEW_RECOMMENDED] : [],
        unapprovedThumbnails > 0 ? [SOURCE_TEXT_THUMBNAIL_QUALITY_REVIEW_RECOMMENDED] : [],
        project.voiceConfig.audioQa && !project.voiceConfig.audioQa.passed ? [SOURCE_TEXT_AUDIO_QUALITY_REVIEW_RECOMMENDED] : [],
        subtitlesEnabled && project.subtitleQa && !project.subtitleQa.passed ? [SOURCE_TEXT_SUBTITLE_QUALITY_REVIEW_RECOMMENDED] : [],
        project.editorQa && !project.editorQa.passed ? [SOURCE_TEXT_EDITOR_QUALITY_REVIEW_RECOMMENDED] : [],
        project.scriptQa && !project.scriptQa.passed ? [SOURCE_TEXT_SCRIPT_QUALITY_REVIEW_RECOMMENDED] : [],
        project.storyboardQa && !project.storyboardQa.passed ? [SOURCE_TEXT_STORYBOARD_QUALITY_REVIEW_RECOMMENDED] : [],
        project.finalMultimodalQa && !project.finalMultimodalQa.passed ? [SOURCE_TEXT_FINAL_QUALITY_REVIEW_RECOMMENDED] : [],
      ]),
    ),
  );
  const technicallyComplete = _.isEmpty(blockingErrors);
  const publishable = technicallyComplete;
  const releaseStatus: FinalQualityReport["releaseStatus"] = !technicallyComplete ? SOURCE_TEXT_TECHNICAL_COMPLETE : _.isEmpty(warnings) ? SOURCE_TEXT_EDITORIALLY_PUBLISHABLE : SOURCE_TEXT_COMPLETED_WITH_WARNINGS;
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
    publishable,
    releaseStatus,
  };
};
