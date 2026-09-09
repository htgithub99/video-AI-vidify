import _ from "lodash";
import { AssetAcceptance, FinalQualityReport, ManualReviewItem, ManualReviewStatus, QaStatus, SceneAssetStatus, SubtitleMode, VideoProject } from "../types";
import { getFinalCompletionReadiness } from "./pipelineCompletionPolicyService";
import { hasSceneAsset } from "./projectImageGenerationService";

const FINAL_QA_EVIDENCE_UNAVAILABLE_PATTERN = /(?:no chronological frames|rendered audio mix.*(?:supplied|provided)|final[_ ]?qa.*(?:unavailable|missing)|visual[_ ]?qa.*unavailable)/i;

const getUsableFinalQaBlockingErrors = (project: VideoProject): string[] =>
  _.filter(
    _.defaultTo(project.finalMultimodalQa?.blockingErrors, []),
    (error) => !FINAL_QA_EVIDENCE_UNAVAILABLE_PATTERN.test(_.toString(error)),
  );

const requiresSceneReview = (scene: VideoProject["storyboard"][number]): boolean =>
  !hasSceneAsset(scene) ||
  scene.acceptance === AssetAcceptance.Rejected ||
  _.includes([SceneAssetStatus.Rejected, SceneAssetStatus.Failed], scene.assetStatus);

export const createManualReviewItems = (project: VideoProject): ManualReviewItem[] => {
  const createdAt = new Date().toISOString();
  const finalQaBlockingErrors = getUsableFinalQaBlockingErrors(project);

  const scenes: ManualReviewItem[] = _.map(
    _.filter(project.storyboard || [], requiresSceneReview),
    (scene) => ({
      id: `review_scene_${scene.id}`,
      scope: "scene" as const,
      targetId: scene.id,
      reason: scene.assetError || `scene_${scene.qaStatus || scene.assetStatus}`,
      status: ManualReviewStatus.Pending,
      createdAt,
    }),
  );

  const thumbnails: ManualReviewItem[] = _.map(
    _.filter(project.thumbnails || [], (thumbnail) => thumbnail.acceptance === AssetAcceptance.Rejected),
    (thumbnail) => ({
      id: `review_thumbnail_${thumbnail.id}`,
      scope: "thumbnail" as const,
      targetId: thumbnail.id,
      reason: _.join(thumbnail.qa?.blockingErrors, ",") || `thumbnail_${thumbnail.qaStatus || "not_approved"}`,
      status: ManualReviewStatus.Pending,
      createdAt,
    }),
  );

  const audio: ManualReviewItem[] =
    project.voiceConfig.audioQa && !_.isEmpty(project.voiceConfig.audioQa.blockingErrors)
      ? [
          {
            id: "review_audio",
            scope: "audio" as const,
            reason: _.join(project.voiceConfig.audioQa.blockingErrors, ",") || "audio_qa_failed",
            status: ManualReviewStatus.Pending,
            createdAt,
          },
        ]
      : [];

  const subtitles: ManualReviewItem[] =
    project.config?.subtitleMode !== SubtitleMode.None && project.subtitleQa && !_.isEmpty(project.subtitleQa.blockingErrors)
      ? [
          {
            id: "review_subtitle",
            scope: "subtitle" as const,
            reason: _.join(project.subtitleQa.blockingErrors, ",") || "subtitle_qa_failed",
            status: ManualReviewStatus.Pending,
            createdAt,
          },
        ]
      : [];

  const finalVideo: ManualReviewItem[] =
    project.finalMultimodalQa && project.finalMultimodalQa.reviewAvailable !== false && !_.isEmpty(finalQaBlockingErrors)
      ? [
          {
            id: "review_final",
            scope: "final" as const,
            reason: _.join(finalQaBlockingErrors, ",") || "final_multimodal_qa_failed",
            status: ManualReviewStatus.Pending,
            createdAt,
          },
        ]
      : [];

  const resolvedHistory = _.filter(project.manualReviewItems || [], (item) => item.status !== ManualReviewStatus.Pending);
  return _.uniqBy([...resolvedHistory, ...scenes, ...thumbnails, ...audio, ...subtitles, ...finalVideo], "id");
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
  const blockingErrors = _.uniq([
    ...completionReadiness.blockers,
    ...(project.finalMultimodalQa?.reviewAvailable === false ? [] : finalQaBlockingErrors),
  ]);

  const warnings = _.uniq(
    _.compact(
      _.flatMap([
        project.scriptQa?.warnings,
        project.storyboardQa?.warnings,
        project.voiceConfig.audioQa?.warnings,
        subtitlesEnabled ? project.subtitleQa?.warnings : [],
        project.editorQa?.warnings,
        _.some(project.storyboard, (scene) => scene.qaStatus === QaStatus.Unavailable || scene.assetError === "visual_qa_unavailable") ? ["scene_visual_qa_unavailable"] : [],
        _.some(project.storyboard, (scene) => scene.assetStatus === SceneAssetStatus.Approved && scene.assetError === "visual_quality_below_target")
          ? ["scene_visual_quality_below_target"]
          : [],
        _.some(project.thumbnails, (thumbnail) => thumbnail.acceptance === AssetAcceptance.AcceptedWithWarning) ? ["thumbnail_quality_below_target"] : [],
        !project.finalMultimodalQa ? ["final_multimodal_qa_missing"] : [],
        project.finalMultimodalQa?.warnings,
        _.some(project.finalMultimodalQa?.blockingErrors, (error) => FINAL_QA_EVIDENCE_UNAVAILABLE_PATTERN.test(_.toString(error)))
          ? ["final_multimodal_qa_unavailable"]
          : [],
        unapprovedScenes > 0 ? ["scene_quality_review_recommended"] : [],
        unapprovedThumbnails > 0 ? ["thumbnail_quality_review_recommended"] : [],
        project.voiceConfig.audioQa && !project.voiceConfig.audioQa.passed ? ["audio_quality_review_recommended"] : [],
        subtitlesEnabled && project.subtitleQa && !project.subtitleQa.passed ? ["subtitle_quality_review_recommended"] : [],
        project.editorQa && !project.editorQa.passed ? ["editor_quality_review_recommended"] : [],
        project.scriptQa && !project.scriptQa.passed ? ["script_quality_review_recommended"] : [],
        project.storyboardQa && !project.storyboardQa.passed ? ["storyboard_quality_review_recommended"] : [],
        project.finalMultimodalQa && !project.finalMultimodalQa.passed ? ["final_quality_review_recommended"] : [],
      ]),
    ),
  );

  const technicallyComplete = _.isEmpty(blockingErrors);
  const publishable = technicallyComplete;
  const releaseStatus: FinalQualityReport["releaseStatus"] = !technicallyComplete
    ? "technical_complete"
    : _.isEmpty(warnings)
      ? "editorially_publishable"
      : "completed_with_warnings";

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
