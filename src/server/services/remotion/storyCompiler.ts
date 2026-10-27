import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "../../../constants/motionRemotionLayout.js";
import { motionVisualSettingsFor } from "../../../lib/motionVisual.js";
import { layoutRemotionNodes, validateRemotionSpec } from "../../../lib/motionRemotion.js";
import { puppetBeatLines } from "../../../lib/motionPuppet.js";
import { motionNarratorCastKey } from "../../../lib/motionVoice.js";
import { MOTION_ASPECT_BASE } from "../../../constants/motionVideo.js";
import type { MotionStoryAnalysis, MotionStoryScript, MotionVoiceTrack } from "../../../types/motionVideo.js";
import type { MotionRemotionSpec, MotionRemotionTimedScene, MotionRenderBehavior } from "../../../types/motionVisual.js";
import { normalizeMotionRenderBehavior } from "../../../lib/motionRenderBehavior.js";
import { buildSubtitles, computeBeatTimeline, estimateBeatSeconds } from "../motionDirectorService.js";
import { remotionBeatPlanCurrent, remotionStoryBuildCurrent } from "./sceneKeys.js";
import { compileRemotionSound } from "./soundCompiler.js";
import { motionMusicMood, motionMusicSegments } from "../motionMusicService.js";
export const compileRemotionStory = (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, opts: { aspect?: string; fps?: number; durations?: number[]; voiceTrack?: MotionVoiceTrack; characterMotion?: boolean; renderBehavior?: MotionRenderBehavior; review?: boolean; subtitles?: boolean }) => {
  const behavior = normalizeMotionRenderBehavior(opts.renderBehavior ?? script.gen?.renderBehavior, opts.characterMotion ?? script.gen?.characterMotion);
  const settings = motionVisualSettingsFor({ analysis, script });
  const state = script.gen?.remotion;
  if (settings.mode !== "remotion" || !state || JSON.stringify(settings) !== JSON.stringify(state.settings)) throw new Error(V.SETTINGS_CHANGED);
  if (!opts.review && Object.keys(state.failures).length) throw new Error(V.SCENES_REQUIRED);
  if (!opts.review && analysis && !remotionStoryBuildCurrent(script, analysis)) throw new Error(V.SCENES_REQUIRED);
  const aspect = opts.aspect || "16:9";
  const dimensions = MOTION_ASPECT_BASE[aspect] || MOTION_ASPECT_BASE["16:9"];
  const fps = opts.fps || 30;
  const durations = script.beats.map((beat, index) => opts.durations?.[index] || estimateBeatSeconds(beat, script.language));
  const timeline = computeBeatTimeline(script.beats, durations, opts.voiceTrack?.continuous);
  const duration = Math.ceil(timeline.total * fps) / fps;
  const scenes: MotionRemotionTimedScene[] = [];
  const subtitles: MotionRemotionSpec["subtitles"] = [];
  let frame = 0;
  script.beats.forEach((beat, index) => {
    const planned = state.scenes[beat.id];
    if (!planned?.length) throw new Error(V.SCENES_REQUIRED);
    if (!opts.review && analysis && !remotionBeatPlanCurrent(beat, analysis, state)) throw new Error(V.SCENES_REQUIRED);
    const lines = puppetBeatLines(beat, motionNarratorCastKey(analysis));
    const clips = opts.voiceTrack?.clips?.filter((clip) => clip.beatId === beat.id) || [];
    const beatEnd = index === script.beats.length - 1 ? Math.ceil(duration * fps) : Math.round(timeline.starts[index + 1] * fps);
    const weights = lines.map((line) => Math.max(1, line.text.trim().split(/\s+/u).length));
    const total = weights.reduce((sum, n) => sum + n, 0) || 1;
    const startAt = (lineIndex: number) => {
      const line = lines[lineIndex];
      const clip = line?.utterance ? clips.find((item) => item.id === line.utterance) : undefined;
      if (clip) {
        const siblings = lines.filter((item) => item.utterance === line.utterance);
        const before = siblings
          .slice(
            0,
            siblings.findIndex((item) => item.key === line.key),
          )
          .reduce((sum, item) => sum + item.text.length, 0);
        const chars = siblings.reduce((sum, item) => sum + item.text.length, 0) || 1;
        return clip.start + ((clip.end - clip.start) * before) / chars;
      }
      return timeline.starts[index] + ((timeline.ends[index] - timeline.starts[index]) * weights.slice(0, lineIndex).reduce((sum, n) => sum + n, 0)) / total;
    };
    planned.forEach((scene, sceneIndex) => {
      const next = planned[sceneIndex + 1];
      const endFrame = next ? Math.min(beatEnd, Math.max(frame + 1, Math.round(startAt(lines.findIndex((line) => line.key === next.fromLineId)) * fps))) : beatEnd;
      if (endFrame <= frame) throw new Error(V.INVALID_SPEC);
      scenes.push({ ...scene, startFrame: frame, endFrame, nodes: layoutRemotionNodes(scene.nodes, state.assets, dimensions.w, dimensions.h, state.assets[scene.backgroundKey || ""]) });
      frame = endFrame;
    });
    if (opts.subtitles !== false) {
      if (clips.length) for (const clip of clips) subtitles.push(...buildSubtitles({ ...beat, narration: clip.text }, clip.start, clip.end));
      else subtitles.push(...buildSubtitles(beat, timeline.starts[index], timeline.ends[index]));
    }
  });
  const used = new Set(scenes.flatMap((scene) => [scene.backgroundKey, ...scene.nodes.map((node) => node.assetKey)]).filter(Boolean));
  const spec: MotionRemotionSpec = {
    engine: "remotion",
    version: V.VERSION,
    title: script.title,
    aspect,
    fps,
    width: dimensions.w,
    height: dimensions.h,
    duration,
    motion: behavior.actors === "simple",
    renderBehavior: behavior,
    resolvedSettings: { layoutRevision: L.REVISION, effectRevision: L.EFFECT_REVISION, sceneRevision: L.SCENE_REVISION, behavior },
    profileId: settings.profileId,
    assets: Object.fromEntries(Object.entries(state.assets).filter(([key]) => used.has(key))),
    scenes,
    subtitles,
    music: { mood: motionMusicMood(analysis), cues: [], segments: motionMusicSegments(analysis, script.beats, timeline.starts) },
  };
  return { spec: validateRemotionSpec(spec), starts: timeline.starts, sfxCues: compileRemotionSound(spec, script, timeline.starts, timeline.ends, opts.voiceTrack), missing: [] as string[] };
};
