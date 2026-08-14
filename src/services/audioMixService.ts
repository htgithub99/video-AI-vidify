import _ from "lodash";
import { AudioCueSheet, AudioCueStatus, AudioCueType, RenderAudioTrack } from "../types";
import { SOUND_DESIGN_CONFIG } from "../constants/config";

export const createRenderAudioTracks = (cueSheet?: AudioCueSheet): RenderAudioTrack[] => {
  if (!cueSheet) return [];
  const musicVolumeDb = cueSheet.mixTargets.musicUnderVoiceDb;
  return _.map(
    _.filter(cueSheet.cues, cue => cue.status === AudioCueStatus.Approved && !_.isEmpty(cue.assetUrl)),
    cue => ({
      id: cue.id,
      type: cue.type,
      assetUrl: cue.assetUrl!,
      startSeconds: cue.startOffsetSeconds,
      durationSeconds: cue.durationSeconds,
      volumeDb: _.isEqual(cue.type, AudioCueType.Music) ? musicVolumeDb : _.divide(musicVolumeDb, SOUND_DESIGN_CONFIG.SECONDARY_AUDIO_VOLUME_DIVISOR),
      loop: _.includes([AudioCueType.Music, AudioCueType.Ambience], cue.type),
      fadeInSeconds: _.isEqual(cue.type, AudioCueType.SoundEffect) ? SOUND_DESIGN_CONFIG.NO_FADE_SECONDS : SOUND_DESIGN_CONFIG.DEFAULT_FADE_IN_SECONDS,
      fadeOutSeconds: _.isEqual(cue.type, AudioCueType.SoundEffect) ? SOUND_DESIGN_CONFIG.NO_FADE_SECONDS : SOUND_DESIGN_CONFIG.DEFAULT_FADE_OUT_SECONDS,
    }),
  );
};
