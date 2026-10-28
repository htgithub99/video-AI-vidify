import {
  SOURCE_TEMPLATE_CUE_AMBIENCE,
  SOURCE_TEMPLATE_CUE_DIRECTED,
  SOURCE_TEMPLATE_CUE_SFX,
  SOURCE_TEMPLATE_CUE_SFX_IMPACT,
  SOURCE_TEMPLATE_CUE_SFX_REACTION,
  SOURCE_TEMPLATE_CUE_SFX_TRANSITION,
  SOURCE_TEMPLATE_SYMBOL_73,
  SOURCE_TEXT_CHAPTER_TURN,
  SOURCE_TEXT_DOCUMENTARY_EDITORIAL,
  SOURCE_TEXT_ID,
  SOURCE_TEXT_PUNCHLINE,
  SOURCE_TEXT_REVEAL,
  SOURCE_TEXT_SYNCHRONIZE_A_STORY_VISIBLE_PRODUCTION_SOUND,
} from "../constants/sourceText";
import _ from "lodash";
import { AudioCue, AudioCueSheet, AudioCueStatus, AudioCueType, StoryboardScene } from "../types";
import { SOUND_DESIGN_CONFIG } from "../constants/config";
import { resolveGenreEditorialBlueprint } from "./genreEditorialBlueprintService";
export const resolveAutomaticMusicProfile = (genre: string = ""): string => {
  const resolved = resolveGenreEditorialBlueprint(genre).musicProfile;
  if (!_.isEmpty(resolved)) return resolved;
  return SOURCE_TEXT_DOCUMENTARY_EDITORIAL;
};
const visibleActionText = (scene: StoryboardScene): string => _.toString(scene.visibleAction);
export const createAudioCueSheet = (scenes: StoryboardScene[], genre: string = ""): AudioCueSheet => {
  const cues: AudioCue[] = [];
  const editorialBlueprint = resolveGenreEditorialBlueprint(genre);
  const totalDuration = _.sumBy(scenes, (scene) => scene.duration);
  let sceneStartSeconds = 0;
  let lastTransitionSfxIndex = -4;
  cues.push({
    id: SOUND_DESIGN_CONFIG.MAIN_MUSIC_CUE_ID,
    sceneId: _.get(_.first(scenes), SOURCE_TEXT_ID, SOUND_DESIGN_CONFIG.TIMELINE_SCENE_ID),
    type: AudioCueType.Music,
    description: SOURCE_TEMPLATE_SYMBOL_73(`${SOUND_DESIGN_CONFIG.MUSIC_DESCRIPTION}`, `${editorialBlueprint.audioDirection}`),
    emotionalIntent: SOURCE_TEMPLATE_SYMBOL_73(`${SOUND_DESIGN_CONFIG.MUSIC_INTENT}`, `${editorialBlueprint.voiceDirection}`),
    startOffsetSeconds: 0,
    durationSeconds: totalDuration,
    status: AudioCueStatus.Planned,
  });
  _.forEach(scenes, (scene, index) => {
    cues.push({
      id: SOURCE_TEMPLATE_CUE_AMBIENCE(`${scene.id}`),
      sceneId: scene.id,
      type: AudioCueType.Ambience,
      description: SOUND_DESIGN_CONFIG.AMBIENCE_DESCRIPTION,
      emotionalIntent: index < scenes.length / 2 ? SOUND_DESIGN_CONFIG.AMBIENCE_TENSION_INTENT : SOUND_DESIGN_CONFIG.AMBIENCE_RESOLUTION_INTENT,
      startOffsetSeconds: sceneStartSeconds,
      durationSeconds: scene.duration,
      status: AudioCueStatus.Planned,
    });
    if (index === 0) {
      cues.push({ id: SOURCE_TEMPLATE_CUE_SFX_IMPACT(`${scene.id}`), sceneId: scene.id, type: AudioCueType.SoundEffect, description: SOUND_DESIGN_CONFIG.HOOK_SFX_DESCRIPTION, emotionalIntent: SOUND_DESIGN_CONFIG.HOOK_SFX_INTENT, startOffsetSeconds: 0, durationSeconds: SOUND_DESIGN_CONFIG.HOOK_SFX_DURATION_SECONDS, status: AudioCueStatus.Planned });
    }
    _.forEach(_.take(_.compact(scene.soundDesignCues || []), 3), (description, cueIndex) => {
      cues.push({ id: SOURCE_TEMPLATE_CUE_DIRECTED(`${scene.id}`, `${cueIndex + 1}`), sceneId: scene.id, type: AudioCueType.SoundEffect, description, emotionalIntent: SOURCE_TEXT_SYNCHRONIZE_A_STORY_VISIBLE_PRODUCTION_SOUND, startOffsetSeconds: sceneStartSeconds, durationSeconds: Math.min(SOUND_DESIGN_CONFIG.MAX_SOUND_EFFECT_DURATION_SECONDS, scene.duration), status: AudioCueStatus.Planned });
    });
    const emphaticPurpose = _.includes([SOURCE_TEXT_REVEAL, SOURCE_TEXT_PUNCHLINE, SOURCE_TEXT_CHAPTER_TURN] as string[], _.toLower(_.toString(scene.shotPurpose)));
    const transitionSfxHasBreathingRoom = _.gte(index - lastTransitionSfxIndex, 4);
    if (index > 0 && scene.transition && !_.isEqual(scene.transition, SOUND_DESIGN_CONFIG.CUT_TRANSITION) && (emphaticPurpose || transitionSfxHasBreathingRoom)) {
      const isDynamic = SOUND_DESIGN_CONFIG.DYNAMIC_TRANSITION_PATTERN.test(scene.transition);
      cues.push({
        id: SOURCE_TEMPLATE_CUE_SFX_TRANSITION(`${scene.id}`),
        sceneId: scene.id,
        type: AudioCueType.SoundEffect,
        description: isDynamic ? SOUND_DESIGN_CONFIG.DYNAMIC_TRANSITION_DESCRIPTION : SOUND_DESIGN_CONFIG.SMOOTH_TRANSITION_DESCRIPTION,
        emotionalIntent: SOUND_DESIGN_CONFIG.TRANSITION_INTENT,
        startOffsetSeconds: Math.max(0, sceneStartSeconds - SOUND_DESIGN_CONFIG.TRANSITION_OFFSET_SECONDS),
        durationSeconds: isDynamic ? SOUND_DESIGN_CONFIG.DYNAMIC_TRANSITION_DURATION : SOUND_DESIGN_CONFIG.SMOOTH_TRANSITION_DURATION,
        status: AudioCueStatus.Planned,
      });
      lastTransitionSfxIndex = index;
    }
    if (_.isEmpty(scene.soundDesignCues) && scene.reaction && SOUND_DESIGN_CONFIG.DRAMATIC_REACTION_PATTERN.test(scene.reaction)) {
      cues.push({
        id: SOURCE_TEMPLATE_CUE_SFX_REACTION(`${scene.id}`),
        sceneId: scene.id,
        type: AudioCueType.SoundEffect,
        description: SOUND_DESIGN_CONFIG.DRAMATIC_REACTION_DESCRIPTION,
        emotionalIntent: SOUND_DESIGN_CONFIG.DRAMATIC_REACTION_INTENT,
        startOffsetSeconds: sceneStartSeconds + SOUND_DESIGN_CONFIG.DRAMATIC_REACTION_OFFSET_SECONDS,
        durationSeconds: SOUND_DESIGN_CONFIG.DRAMATIC_REACTION_DURATION_SECONDS,
        status: AudioCueStatus.Planned,
      });
    }
    const visibleActionCue = _.isEmpty(scene.soundDesignCues) ? _.find(SOUND_DESIGN_CONFIG.VISIBLE_ACTIONS, (item) => item.pattern.test(visibleActionText(scene))) : undefined;
    if (visibleActionCue) {
      cues.push({
        id: SOURCE_TEMPLATE_CUE_SFX(`${scene.id}`, `${cues.length}`),
        sceneId: scene.id,
        type: AudioCueType.SoundEffect,
        description: visibleActionCue.description,
        emotionalIntent: SOUND_DESIGN_CONFIG.SOUND_EFFECT_INTENT,
        startOffsetSeconds: sceneStartSeconds,
        durationSeconds: Math.min(SOUND_DESIGN_CONFIG.MAX_SOUND_EFFECT_DURATION_SECONDS, scene.duration),
        status: AudioCueStatus.Planned,
      });
    }
    sceneStartSeconds = _.add(sceneStartSeconds, scene.duration);
  });
  return { musicArc: [...SOUND_DESIGN_CONFIG.MUSIC_ARC], cues, mixTargets: { narrationLufs: SOUND_DESIGN_CONFIG.NARRATION_LUFS, musicUnderVoiceDb: SOUND_DESIGN_CONFIG.MUSIC_UNDER_VOICE_DB, peakDb: SOUND_DESIGN_CONFIG.PEAK_DB } };
};
export const applyOptionalMusicAsset = (cueSheet: AudioCueSheet, assetUrl?: string): AudioCueSheet => {
  if (_.isEmpty(assetUrl)) return cueSheet;
  return { ...cueSheet, cues: _.map(cueSheet.cues, (cue) => (_.isEqual(cue.type, AudioCueType.Music) ? { ...cue, assetUrl, status: AudioCueStatus.Approved } : cue)) };
};
