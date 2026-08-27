import _ from "lodash";
import { REFACTOR_CONSTANTS, VOICE_PRESET_MAP, VOICE_TTS_ROUTING_CONFIG } from "../constants";
import type { VideoProject, VoiceConfig } from "../types";

export interface VoiceRoutingInput { provider?: string; voiceId?: string; }

export interface VoiceRoutingResult { finalVoiceId: string; }

export const resolveVoiceRouting = ({ voiceId }: VoiceRoutingInput): VoiceRoutingResult => {
  const requestedVoiceId = _.trim(voiceId);
  const mappedVoiceId = VOICE_PRESET_MAP[requestedVoiceId] || requestedVoiceId;
  const hasKnownPrefix = _.some(REFACTOR_CONSTANTS.VALID_VOICE_PREFIXES, (prefix) => _.startsWith(mappedVoiceId, prefix));
  const finalVoiceId = _.isEmpty(mappedVoiceId) ? REFACTOR_CONSTANTS.DEFAULT_EDGE_VOICE_ID : hasKnownPrefix ? mappedVoiceId : requestedVoiceId === mappedVoiceId ? mappedVoiceId : `${REFACTOR_CONSTANTS.EDGE_PREFIX}${mappedVoiceId}`;
  return { finalVoiceId };
};

export const applyVoiceSelection = (project: VideoProject, selection: Partial<VoiceConfig>): VideoProject => {
  const currentIdentity = _.pick(project.voiceConfig, VOICE_TTS_ROUTING_CONFIG.IDENTITY_KEYS);
  const nextVoiceConfig = { ...project.voiceConfig, ...selection } as VoiceConfig;
  const nextIdentity = _.pick(nextVoiceConfig, VOICE_TTS_ROUTING_CONFIG.IDENTITY_KEYS);
  if (_.isEqual(currentIdentity, nextIdentity)) return { ...project, voiceConfig: nextVoiceConfig };
  return {
    ...project,
    voiceConfig: {
      ..._.omit(nextVoiceConfig, VOICE_TTS_ROUTING_CONFIG.GENERATED_AUDIO_KEYS),
      audioBase64: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
      audioUrl: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
    } as VoiceConfig,
    storyboard: project.storyboard ? _.map(project.storyboard, (scene) => _.omit(scene, VOICE_TTS_ROUTING_CONFIG.SCENE_AUDIO_KEYS)) : project.storyboard,
  };
};
