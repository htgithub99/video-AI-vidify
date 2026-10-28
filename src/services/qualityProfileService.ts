import { SOURCE_TEXT_ALL_APPROVED, SOURCE_TEXT_APPROVED, SOURCE_TEXT_ID, SOURCE_TEXT_KEY_ONLY } from "../constants/sourceText";
import _ from "lodash";
import { QualityMode, StoryboardScene } from "../types";
export interface QualityProfile {
  draftCandidates: number;
  upscale: "key_only" | "approved" | "all_approved";
}
const QUALITY_PROFILES: Record<QualityMode, QualityProfile> = { [QualityMode.Economy]: { draftCandidates: 1, upscale: SOURCE_TEXT_KEY_ONLY }, [QualityMode.Balanced]: { draftCandidates: 1, upscale: SOURCE_TEXT_KEY_ONLY }, [QualityMode.Premium]: { draftCandidates: 1, upscale: SOURCE_TEXT_ALL_APPROVED } };
export const resolveQualityProfile = (mode?: QualityMode): QualityProfile => QUALITY_PROFILES[mode || QualityMode.Balanced];
export const selectScenesForUpscale = (scenes: StoryboardScene[], validatedSceneIds: Set<string>, mode?: QualityMode): StoryboardScene[] => {
  const profile = resolveQualityProfile(mode);
  if (_.isEqual(profile.upscale, SOURCE_TEXT_ALL_APPROVED)) return scenes;
  if (_.isEqual(profile.upscale, SOURCE_TEXT_APPROVED)) return _.filter(scenes, (scene) => validatedSceneIds.has(scene.id));
  return _.uniqBy(_.compact([_.first(scenes), _.last(scenes)]), SOURCE_TEXT_ID);
};
