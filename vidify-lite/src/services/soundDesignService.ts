import _ from "lodash";
import { AudioCue, AudioCueSheet, AudioCueStatus, AudioCueType, StoryboardScene } from "../types";
import { SOUND_DESIGN_CONFIG } from "../constants/config";

const visibleActionText = (scene: StoryboardScene): string => _.join([
  scene.script,
  scene.subtitle,
  _.replace(scene.prompt || "", /character/gi, "subject"),
], " ");

export const createAudioCueSheet = (scenes: StoryboardScene[]): AudioCueSheet => {
  const cues: AudioCue[] = [];
  const totalDuration = _.sumBy(scenes, scene => scene.duration);
  let sceneStartSeconds = 0;
  cues.push({
    id: SOUND_DESIGN_CONFIG.MAIN_MUSIC_CUE_ID,
    sceneId: _.get(_.first(scenes), "id", SOUND_DESIGN_CONFIG.TIMELINE_SCENE_ID),
    type: AudioCueType.Music,
    description: SOUND_DESIGN_CONFIG.MUSIC_DESCRIPTION,
    emotionalIntent: SOUND_DESIGN_CONFIG.MUSIC_INTENT,
    startOffsetSeconds: 0,
    durationSeconds: totalDuration,
    required: true,
    status: AudioCueStatus.Planned,
  });
  _.forEach(scenes, (scene, index) => {
    cues.push({
      id: `cue_${scene.id}_ambience`,
      sceneId: scene.id,
      type: AudioCueType.Ambience,
      description: SOUND_DESIGN_CONFIG.AMBIENCE_DESCRIPTION,
      emotionalIntent: index < scenes.length / 2 ? SOUND_DESIGN_CONFIG.AMBIENCE_TENSION_INTENT : SOUND_DESIGN_CONFIG.AMBIENCE_RESOLUTION_INTENT,
      startOffsetSeconds: sceneStartSeconds,
      durationSeconds: scene.duration,
      required: false,
      status: AudioCueStatus.Planned,
    });
    _.forEach(SOUND_DESIGN_CONFIG.VISIBLE_ACTIONS, item => {
      if (!item.pattern.test(visibleActionText(scene))) return;
      cues.push({
        id: `cue_${scene.id}_sfx_${cues.length}`,
        sceneId: scene.id,
        type: AudioCueType.SoundEffect,
        description: item.description,
        emotionalIntent: SOUND_DESIGN_CONFIG.SOUND_EFFECT_INTENT,
        startOffsetSeconds: sceneStartSeconds,
        durationSeconds: Math.min(SOUND_DESIGN_CONFIG.MAX_SOUND_EFFECT_DURATION_SECONDS, scene.duration),
        required: false,
        status: AudioCueStatus.Planned,
      });
    });
    sceneStartSeconds = _.add(sceneStartSeconds, scene.duration);
  });
  return {
    musicArc: [...SOUND_DESIGN_CONFIG.MUSIC_ARC],
    cues,
    mixTargets: {
      narrationLufs: SOUND_DESIGN_CONFIG.NARRATION_LUFS,
      musicUnderVoiceDb: SOUND_DESIGN_CONFIG.MUSIC_UNDER_VOICE_DB,
      peakDb: SOUND_DESIGN_CONFIG.PEAK_DB,
    },
  };
};
