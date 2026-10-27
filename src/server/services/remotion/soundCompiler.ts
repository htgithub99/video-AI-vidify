import { normalizeSoundEvents, normalizeSoundCues } from "../../../lib/motionSound.js";
import type { MotionStoryScript, MotionVoiceTrack } from "../../../types/motionVideo.js";
import type { MotionRemotionSpec } from "../../../types/motionVisual.js";
export const compileRemotionSound = (spec: MotionRemotionSpec, script: MotionStoryScript, starts: number[], ends: number[], voice?: MotionVoiceTrack) =>
  normalizeSoundCues(
    script.beats.flatMap((beat, index) =>
      normalizeSoundEvents(beat.data?.soundEvents).flatMap((event) => {
        if (event.kind === "footstep" && event.source !== "offscreen") return [];
        const scenes = spec.scenes.filter((scene) => scene.beatId === beat.id);
        const cut = event.anchor === "cut" ? scenes[(event.camera || 1) - 1] : undefined;
        const line = event.utterance ? voice?.clips?.find((clip) => clip.id === event.utterance && clip.beatId === beat.id) : undefined;
        const t = line ? (event.edge === "end" ? line.end : line.start) + (event.t || 0) : cut ? cut.startFrame / spec.fps + (event.t || 0) : starts[index] + (event.t ?? (event.at || 0) * (ends[index] - starts[index]));
        if ((event.anchor === "cut" && !cut) || (event.utterance && !line) || t < starts[index] || t >= ends[index]) return [];
        if (event.source !== "offscreen" && event.actor && !scenes.some((scene) => scene.nodes.some((node) => node.entityId === event.actor))) return [];
        return [{ ...event, id: `${beat.id}:${event.id}`, beatId: beat.id, t, duration: Math.min(event.duration || 1, ends[index] - t) }];
      }),
    ),
    spec.duration,
  );
