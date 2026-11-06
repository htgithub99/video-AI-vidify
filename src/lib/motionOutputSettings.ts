import { MotionEncoderPreference, MotionQuality, type MotionOutputSettings, type MotionProductionResult } from "../types/motionVideo.js";
import { motionVisualSettingsFor } from "./motionVisual.js";
import { motionRenderBehaviorFor } from "./motionRenderBehavior.js";
import { MOTION_MUSIC } from "../constants/motionMusic.js";

export const motionEffectiveEncoder = (input: Record<string, any>): MotionEncoderPreference =>
  input.visualSettings?.mode === "remotion" || input.engine === "remotion" ? MotionEncoderPreference.CPU : input.encoder || MotionEncoderPreference.AUTO;

/** The configuration which actually produced this output, independent of later UI changes. */
export const motionOutputSettings = (input: Record<string, any>, result?: MotionProductionResult): MotionOutputSettings => {
  const visualSettings = motionVisualSettingsFor(input);
  const renderBehavior = motionRenderBehaviorFor(input);
  return {
    version: 1,
    visualSettings,
    renderBehavior,
    characterMotion: renderBehavior.actors === "simple",
    stylePreset: visualSettings.mode === "library" ? visualSettings.packId : undefined,
    aspect: input.aspect || result?.compiled?.spec.aspect || "16:9",
    fps: input.fps || result?.compiled?.spec.fps || 30,
    subtitles: input.subtitles !== false,
    sfx: input.sfx === true,
    sfxVolume: input.sfxVolume ?? 0.5,
    soundOverrides: structuredClone(input.soundOverrides || {}),
    look: input.look || "",
    asrCheck: input.asrCheck === true,
    quality: input.quality || MotionQuality.STANDARD,
    encoder: motionEffectiveEncoder({ ...input, visualSettings }),
    musicMood: input.musicMood || MOTION_MUSIC.AUTO,
    musicVolume: input.musicVolume ?? 0,
  };
};
