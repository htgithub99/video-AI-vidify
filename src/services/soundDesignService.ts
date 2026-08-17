import _ from "lodash";
import { AudioCue, AudioCueSheet, AudioCueStatus, AudioCueType, StoryboardScene } from "../types";
import { SOUND_DESIGN_CONFIG } from "../constants/config";

const visibleActionText = (scene: StoryboardScene): string => _.toString(scene.visibleAction);

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
      status: AudioCueStatus.Planned,
    });
    if (index === 0) {
      cues.push({
        id: `cue_${scene.id}_sfx_impact`,
        sceneId: scene.id,
        type: AudioCueType.SoundEffect,
        description: SOUND_DESIGN_CONFIG.HOOK_SFX_DESCRIPTION,
        emotionalIntent: SOUND_DESIGN_CONFIG.HOOK_SFX_INTENT,
        startOffsetSeconds: 0,
        durationSeconds: SOUND_DESIGN_CONFIG.HOOK_SFX_DURATION_SECONDS,
        status: AudioCueStatus.Planned,
      });
    }

    if (index > 0 && scene.transition && !_.isEqual(scene.transition, SOUND_DESIGN_CONFIG.CUT_TRANSITION)) {
      const isDynamic = SOUND_DESIGN_CONFIG.DYNAMIC_TRANSITION_PATTERN.test(scene.transition);
      cues.push({
        id: `cue_${scene.id}_sfx_transition`,
        sceneId: scene.id,
        type: AudioCueType.SoundEffect,
        description: isDynamic ? SOUND_DESIGN_CONFIG.DYNAMIC_TRANSITION_DESCRIPTION : SOUND_DESIGN_CONFIG.SMOOTH_TRANSITION_DESCRIPTION,
        emotionalIntent: SOUND_DESIGN_CONFIG.TRANSITION_INTENT,
        startOffsetSeconds: Math.max(0, sceneStartSeconds - SOUND_DESIGN_CONFIG.TRANSITION_OFFSET_SECONDS),
        durationSeconds: isDynamic ? SOUND_DESIGN_CONFIG.DYNAMIC_TRANSITION_DURATION : SOUND_DESIGN_CONFIG.SMOOTH_TRANSITION_DURATION,
        status: AudioCueStatus.Planned,
      });
    }

    if (scene.reaction && SOUND_DESIGN_CONFIG.DRAMATIC_REACTION_PATTERN.test(scene.reaction)) {
      cues.push({
        id: `cue_${scene.id}_sfx_reaction`,
        sceneId: scene.id,
        type: AudioCueType.SoundEffect,
        description: SOUND_DESIGN_CONFIG.DRAMATIC_REACTION_DESCRIPTION,
        emotionalIntent: SOUND_DESIGN_CONFIG.DRAMATIC_REACTION_INTENT,
        startOffsetSeconds: sceneStartSeconds + SOUND_DESIGN_CONFIG.DRAMATIC_REACTION_OFFSET_SECONDS,
        durationSeconds: SOUND_DESIGN_CONFIG.DRAMATIC_REACTION_DURATION_SECONDS,
        status: AudioCueStatus.Planned,
      });
    }

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

export const applyOptionalMusicAsset = (cueSheet: AudioCueSheet, assetUrl?: string): AudioCueSheet => {
  if (_.isEmpty(assetUrl)) return cueSheet;
  return {
    ...cueSheet,
    cues: _.map(cueSheet.cues, cue => (
      _.isEqual(cue.type, AudioCueType.Music)
        ? { ...cue, assetUrl, status: AudioCueStatus.Approved }
        : cue
    )),
  };
};
