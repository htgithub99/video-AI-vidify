import _ from "lodash";
import { QualityMode, StoryboardScene } from "../types";

export interface QualityProfile {
  draftCandidates: number;
  upscale: "key_only" | "approved" | "all_approved";
}

const QUALITY_PROFILES: Record<QualityMode, QualityProfile> = {
  [QualityMode.Economy]: { draftCandidates: 1, upscale: "key_only" },
  [QualityMode.Balanced]: { draftCandidates: 1, upscale: "key_only" },
  [QualityMode.Premium]: { draftCandidates: 1, upscale: "all_approved" },
};

export const resolveQualityProfile = (mode?: QualityMode): QualityProfile => QUALITY_PROFILES[mode || QualityMode.Balanced];

export const selectScenesForUpscale = (scenes: StoryboardScene[], validatedSceneIds: Set<string>, mode?: QualityMode): StoryboardScene[] => {
  const profile = resolveQualityProfile(mode);
  if (_.isEqual(profile.upscale, "all_approved")) return scenes;
  if (_.isEqual(profile.upscale, "approved")) return _.filter(scenes, (scene) => validatedSceneIds.has(scene.id));
  return _.uniqBy(_.compact([_.first(scenes), _.last(scenes)]), "id");
};
