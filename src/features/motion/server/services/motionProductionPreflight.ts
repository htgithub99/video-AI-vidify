import { MOTION_PRODUCTION as P } from "../../../../constants/motionProduction.js";
import { listMotionVoices } from "./motionVoiceSourceService.js";
import { findVoiceChannel, voiceChannelRef } from "./motionVoiceLibraryService.js";
export const checkMotionProductionVoice = async (channelRef: string | undefined, signal?: AbortSignal): Promise<void> => {
  const channel = findVoiceChannel(channelRef);
  if (channelRef && (!channel || voiceChannelRef(channel) !== channelRef)) throw new Error(P.VOICE_CHANGED);
  const voices = await listMotionVoices(signal);
  signal?.throwIfAborted();
  const required = channel ? [channel.narratorVoiceId, ...Object.values(channel.roleVoices || {})].filter(Boolean) : [];
  if (!voices.length || required.some((id) => !voices.some((voice) => voice.id === id))) throw new Error(P.VOICE_UNAVAILABLE);
};
