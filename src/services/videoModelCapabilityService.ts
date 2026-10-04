import _ from "lodash";
import { VIDEO_MODEL_CAPABILITY_CONFIG } from "../constants/config";
import { AspectRatio, ImageGeneratorEngine } from "../types";
export interface VideoModelCapabilities {
  durations: readonly string[];
  resolutions: readonly string[];
  aspectRatios: readonly AspectRatio[];
  defaultDuration: string;
  defaultResolution: string;
  supportsReferences: boolean;
  referenceDurations: readonly string[];
}
export const getVideoModelCapabilities = (engine?: ImageGeneratorEngine): VideoModelCapabilities => _.get(VIDEO_MODEL_CAPABILITY_CONFIG.MODELS, engine || ImageGeneratorEngine.Veo3, VIDEO_MODEL_CAPABILITY_CONFIG.MODELS[ImageGeneratorEngine.Veo3]) as VideoModelCapabilities;
export const normalizeVideoModelSettings = (engine: ImageGeneratorEngine, current: { duration?: string; resolution?: string; aspectRatio?: AspectRatio }, hasReferences: boolean = false): { duration: string; resolution: string; aspectRatio: AspectRatio; supportsReferences: boolean } => {
  const capabilities = getVideoModelCapabilities(engine);
  const durations = hasReferences ? capabilities.referenceDurations : capabilities.durations;
  const duration = _.includes(durations, current.duration) ? current.duration! : capabilities.defaultDuration;
  const resolution = _.includes(capabilities.resolutions, current.resolution) ? current.resolution! : capabilities.defaultResolution;
  const aspectRatio = _.includes(capabilities.aspectRatios, current.aspectRatio) ? current.aspectRatio! : capabilities.aspectRatios[0];
  return { duration, resolution, aspectRatio, supportsReferences: !hasReferences || capabilities.supportsReferences };
};
