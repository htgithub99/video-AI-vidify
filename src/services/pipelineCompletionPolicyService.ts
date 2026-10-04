import _ from "lodash";
import { CINEMATIC_CONFIG, PIPELINE_COMPLETION_CONFIG } from "../constants/config";
import { VideoProject } from "../types";
import { hasProductionAudioSource } from "./productionAudioService";
import { hasSceneAsset } from "./projectImageGenerationService";
export interface PipelineReadiness {
  ready: boolean;
  blockers: string[];
}
export const getRenderReadiness = (project: VideoProject): PipelineReadiness => {
  const storyboard = _.defaultTo(project.storyboard, []);
  const hasNarration = hasProductionAudioSource([project.voiceConfig?.audioBase64, project.voiceConfig?.audioUrl, ..._.flatMap(storyboard, (scene) => [scene.audioBase64, scene.audioUrl])]);
  const usesNativeVideoAudio = _.isEqual(project.voiceConfig?.provider, CINEMATIC_CONFIG.PIPELINE_PROFILE.VOICE_PROVIDER);
  const blockers = _.compact([
    _.isEmpty(storyboard) && PIPELINE_COMPLETION_CONFIG.STORYBOARD_MISSING,
    !_.isEmpty(storyboard) && _.some(storyboard, (scene) => !hasSceneAsset(scene)) && PIPELINE_COMPLETION_CONFIG.SCENE_ASSETS_MISSING,
    !hasNarration && !usesNativeVideoAudio && PIPELINE_COMPLETION_CONFIG.NARRATION_MISSING,
    project.contentSafety && !project.contentSafety.allowed && PIPELINE_COMPLETION_CONFIG.CONTENT_SAFETY_BLOCKED,
  ]);
  return { ready: _.isEmpty(blockers), blockers };
};
export const getFinalCompletionReadiness = (project: VideoProject): PipelineReadiness => {
  const renderReadiness = getRenderReadiness(project);
  const blockers = _.uniq(_.compact([...renderReadiness.blockers, _.isEmpty(project.renderedVideoUrl) && PIPELINE_COMPLETION_CONFIG.FINAL_RENDER_MISSING]));
  return { ready: _.isEmpty(blockers), blockers };
};
