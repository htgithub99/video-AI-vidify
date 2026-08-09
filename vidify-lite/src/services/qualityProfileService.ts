import _ from "lodash";
import { QualityMode, StoryboardScene } from "../types";
export interface QualityProfile { draftCandidates:number; visionQa:"suspicious_and_key"|"all_character_scenes"|"all"; visionSampleStride:number; characterSampleLimit:number; finalCandidates:number; upscale:"key_only"|"approved"|"all_approved"; finalMultimodalReview:boolean; }
export const QUALITY_PROFILES: Record<QualityMode, QualityProfile> = {
  [QualityMode.Economy]: { draftCandidates:1, visionQa:"suspicious_and_key", visionSampleStride:6, characterSampleLimit:2, finalCandidates:1, upscale:"key_only", finalMultimodalReview:false },
  [QualityMode.Balanced]: { draftCandidates:1, visionQa:"suspicious_and_key", visionSampleStride:4, characterSampleLimit:5, finalCandidates:2, upscale:"key_only", finalMultimodalReview:true },
  [QualityMode.Premium]: { draftCandidates:2, visionQa:"all", visionSampleStride:1, characterSampleLimit:Number.MAX_SAFE_INTEGER, finalCandidates:3, upscale:"all_approved", finalMultimodalReview:true },
};
export const resolveQualityProfile = (mode?: QualityMode): QualityProfile => QUALITY_PROFILES[mode || QualityMode.Balanced];

export const resolveCorrectiveRetryLimit = (mode?: QualityMode): number => {
  const profile = resolveQualityProfile(mode);
  return _.max([0, _.subtract(profile.finalCandidates, profile.draftCandidates)]) || 0;
};

const CHARACTER_SCENE_PATTERN = /\b(man|woman|boy|girl|person|people|character|prisoner|soldier|child|face|portrait|người|đàn ông|phụ nữ|nhân vật|tù nhân|lính|trẻ em|khuôn mặt)\b/i;

export const selectScenesForVisionQa = (
  scenes: StoryboardScene[],
  mode?: QualityMode,
): StoryboardScene[] => {
  const profile = resolveQualityProfile(mode);
  if (_.isEqual(profile.visionQa, "all")) return scenes;

  const keySceneIds = _.compact([_.first(scenes)?.id, _.last(scenes)?.id]);
  const characterScenes = _.filter(scenes, scene => CHARACTER_SCENE_PATTERN.test(
    _.join([scene.script, scene.prompt], " "),
  ));

  if (_.isEqual(profile.visionQa, "all_character_scenes")) {
    return _.uniqBy([...characterScenes, ..._.filter(scenes, scene => _.includes(keySceneIds, scene.id))], "id");
  }

  const sampledScenes = _.filter(scenes, (_scene, index) => _.isEqual(index % profile.visionSampleStride, 0));
  return _.uniqBy([
    ..._.take(characterScenes, profile.characterSampleLimit),
    ...sampledScenes,
    ..._.filter(scenes, scene => _.includes(keySceneIds, scene.id)),
  ], "id");
};

export const selectScenesForUpscale = (
  scenes: StoryboardScene[],
  validatedSceneIds: Set<string>,
  mode?: QualityMode,
): StoryboardScene[] => {
  const profile = resolveQualityProfile(mode);
  if (_.isEqual(profile.upscale, "all_approved")) return scenes;
  if (_.isEqual(profile.upscale, "approved")) return _.filter(scenes, scene => validatedSceneIds.has(scene.id));
  return _.uniqBy(_.compact([_.first(scenes), _.last(scenes)]), "id");
};
