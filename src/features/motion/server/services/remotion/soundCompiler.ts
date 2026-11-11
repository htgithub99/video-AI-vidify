import * as RT_MAINTENANCE from "../../../../../constants/runtime/maintenance.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../../constants/runtime/shared.js";
import { normalizeSoundEvents, normalizeSoundCues } from "../../../../../lib/motionSound.js";
import type { MotionStoryScript, MotionVoiceTrack } from "../../../../../types/motionVideo.js";
import type { MotionRemotionSpec } from "../../../../../types/motionVisual.js";
export const compileRemotionSound = (spec: MotionRemotionSpec, script: MotionStoryScript, starts: number[], ends: number[], voice?: MotionVoiceTrack) =>
  normalizeSoundCues(
    script.beats.flatMap((beat, index) =>
      normalizeSoundEvents([...(Array.isArray(beat.data?.soundEvents) ? beat.data.soundEvents : []), ...spec.scenes.filter((scene) => scene.renderer === RT_MAINTENANCE.HTML_CANVAS && (scene.sourceBeatIds || [scene.beatId])[0] === beat.id).flatMap((scene) => scene.soundEvents || [])]).flatMap((event) => {
        if (spec.renderer !== RT_MAINTENANCE.HTML_CANVAS && event.kind === RT_SERVER.FOOTSTEP && event.source !== RT_SERVER.OFFSCREEN) return [];
        const scenes = spec.scenes.filter((scene) => (scene.sourceBeatIds || [scene.beatId]).includes(beat.id));
        const cut = event.anchor === RT_SERVER.CUT ? scenes[(event.camera || 1) - 1] : undefined;
        const line = event.utterance ? voice?.clips?.find((clip) => clip.id === event.utterance && clip.beatId === beat.id) : undefined;
        const html = scenes.find((scene) => scene.renderer === RT_MAINTENANCE.HTML_CANVAS && scene.soundEvents?.some((item) => item.id === event.id));
        const t = line ? (event.edge === RT_SERVER.END ? line.end : line.start) + (event.t || 0) : cut ? cut.startFrame / spec.fps + (event.t || 0) : html ? html.startFrame / spec.fps + (event.t ?? ((event.at || 0) * (html.endFrame - html.startFrame)) / spec.fps) : starts[index] + (event.t ?? (event.at || 0) * (ends[index] - starts[index]));
        if ((event.anchor === RT_SERVER.CUT && !cut) || (event.utterance && !line) || t < (html ? html.startFrame / spec.fps : starts[index]) || t >= (html ? html.endFrame / spec.fps : ends[index])) return [];
        if (!html && event.source !== RT_SERVER.OFFSCREEN && event.actor && !scenes.some((scene) => scene.nodes.some((node) => node.entityId === event.actor))) return [];
        return [{ ...event, id: `${beat.id}${RT_SHARED.SYMBOL_E7AC07}${event.id}`, beatId: beat.id, t, duration: Math.min(event.duration || 1, (html ? html.endFrame / spec.fps : ends[index]) - t) }];
      }),
    ),
    spec.duration,
  );
