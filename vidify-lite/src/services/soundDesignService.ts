import _ from "lodash";
import { AudioCue, AudioCueSheet, StoryboardScene } from "../types";

const VISIBLE_ACTIONS = [
  { pattern: /\bdoor\b|cửa/i, description: "door movement or latch" },
  { pattern: /\bfootsteps?\b|\bwalk(?:s|ing|ed)?\b|chạy|bước chân/i, description: "character footsteps" },
  { pattern: /\bphone\b|điện thoại/i, description: "phone interaction" },
  { pattern: /\bcar\b|\bvehicle\b|\bxe(?:\s|$)/i, description: "vehicle movement" },
] as const;

const visibleActionText = (scene: StoryboardScene): string => _.join([
  scene.script,
  scene.subtitle,
  _.replace(scene.prompt || "", /character/gi, "subject"),
], " ");

export const createAudioCueSheet = (scenes: StoryboardScene[]): AudioCueSheet => {
  const cues: AudioCue[] = [];
  _.forEach(scenes, (scene, index) => {
    cues.push({
      id: `cue_${scene.id}_ambience`,
      sceneId: scene.id,
      type: "ambience",
      description: "subtle location ambience matching the visible environment",
      emotionalIntent: index < scenes.length / 2 ? "restrained tension" : "reflective resolution",
      startOffsetSeconds: 0,
      durationSeconds: scene.duration,
      required: false,
      status: "planned",
    });
    _.forEach(VISIBLE_ACTIONS, item => {
      if (!item.pattern.test(visibleActionText(scene))) return;
      cues.push({
        id: `cue_${scene.id}_sfx_${cues.length}`,
        sceneId: scene.id,
        type: "sfx",
        description: item.description,
        emotionalIntent: "reinforce visible action without masking narration",
        startOffsetSeconds: 0,
        durationSeconds: Math.min(1.2, scene.duration),
        required: false,
        status: "planned",
      });
    });
  });
  return {
    musicArc: [
      "restrained sparse opening",
      "controlled tension build",
      "intimate low point",
      "urgent but restrained climax",
      "warm reflective resolution",
    ],
    cues,
    mixTargets: { narrationLufs: -16, musicUnderVoiceDb: -18, peakDb: -1 },
  };
};
