import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../../constants/runtime/shared.js";
import { normalizeSoundEvents, normalizeSoundCues } from "../../../../../lib/motionSound.js";
import type { MotionStoryScript, MotionVoiceTrack } from "../../../../../types/motionVideo.js";
import type { MotionRemotionSpec } from "../../../../../types/motionVisual.js";
export const compileRemotionSound = (spec: MotionRemotionSpec, script: MotionStoryScript, starts: number[], ends: number[], voice?: MotionVoiceTrack) =>
  normalizeSoundCues(
    script.beats.flatMap((beat, index) =>
      normalizeSoundEvents(beat.data?.soundEvents).flatMap((event) => {
        if (event.kind === RT_SERVER.FOOTSTEP && event.source !== RT_SERVER.OFFSCREEN) return [];
        const scenes = spec.scenes.filter((scene) => (scene.sourceBeatIds || [scene.beatId]).includes(beat.id));
        const cut = event.anchor === RT_SERVER.CUT ? scenes[(event.camera || 1) - 1] : undefined;
        const line = event.utterance ? voice?.clips?.find((clip) => clip.id === event.utterance && clip.beatId === beat.id) : undefined;
        const t = line ? (event.edge === RT_SERVER.END ? line.end : line.start) + (event.t || 0) : cut ? cut.startFrame / spec.fps + (event.t || 0) : starts[index] + (event.t ?? (event.at || 0) * (ends[index] - starts[index]));
        if ((event.anchor === RT_SERVER.CUT && !cut) || (event.utterance && !line) || t < starts[index] || t >= ends[index]) return [];
        if (event.source !== RT_SERVER.OFFSCREEN && event.actor && !scenes.some((scene) => scene.nodes.some((node) => node.entityId === event.actor))) return [];
        return [{ ...event, id: `${beat.id}${RT_SHARED.SYMBOL_E7AC07}${event.id}`, beatId: beat.id, t, duration: Math.min(event.duration || 1, ends[index] - t) }];
      }),
    ),
    spec.duration,
  );
