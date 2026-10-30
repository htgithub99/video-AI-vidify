import { RUNTIME_TEXT as RT_SHARED } from "../../../../../constants/runtime/shared.js";
import { stringifyJson } from "../../../../../lib/jsonStringify.js";
import { MOTION_VISUAL as V } from "../../../../../constants/motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "../../../../../constants/motionRemotionLayout.js";
import { motionVisualSettingsFor } from "../../../../../lib/motionVisual.js";
import { layoutRemotionNodes, validateRemotionSpec, remotionStateMissingScenes } from "../../../../../lib/motionRemotion.js";
import { MOTION_SCENE_COMPOSITION as C } from "../../../../../constants/motionSceneComposition.js";
import { puppetBeatLines } from "../../../../../lib/motionPuppet.js";
import { motionNarratorCastKey } from "../../../../../lib/motionVoice.js";
import { MOTION_ASPECT_BASE } from "../../../../../constants/motionVideo.js";
import type { MotionStoryAnalysis, MotionStoryScript, MotionVoiceTrack } from "../../../../../types/motionVideo.js";
import type { MotionRemotionSpec, MotionRemotionTimedScene, MotionRenderBehavior } from "../../../../../types/motionVisual.js";
import { normalizeMotionRenderBehavior } from "../../../../../lib/motionRenderBehavior.js";
import { buildSubtitles, computeBeatTimeline, estimateBeatSeconds } from "../motionDirectorService.js";
import { remotionStoryRenderable, remotionPlanGroups } from "./sceneKeys.js";
import { MOTION_SCENE_PACING as PACING } from "../../../../../constants/motionScenePacing.js";
import { compileRemotionSound } from "./soundCompiler.js";
import { motionMusicMood, motionMusicSegments } from "../motionMusicService.js";
import type { PuppetLine } from "../../../../../lib/motionPuppet.js";
export const compileRemotionStory = (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, opts: { aspect?: string; fps?: number; durations?: number[]; voiceTrack?: MotionVoiceTrack; characterMotion?: boolean; renderBehavior?: MotionRenderBehavior; review?: boolean; subtitles?: boolean }) => {
  const behavior = normalizeMotionRenderBehavior(opts.renderBehavior ?? script.gen?.renderBehavior, opts.characterMotion ?? script.gen?.characterMotion);
  const settings = motionVisualSettingsFor({ analysis, script });
  const state = script.gen?.remotion;
  if (settings.mode !== RT_SHARED.REMOTION || !state || stringifyJson(settings) !== stringifyJson(state.settings)) throw new Error(V.SETTINGS_CHANGED);
  const owners = state.pacingRevision === PACING.REVISION ? (analysis ? remotionPlanGroups(script, analysis, state).map((group) => group.id) : Object.keys(state.scenes)) : script.beats.map((beat) => beat.id);
  const missing = [...new Set([...owners.filter((id) => !state.scenes[id]?.length), ...remotionStateMissingScenes(state)])];
  if (!opts.review && missing.length) throw new Error(C.INCOMPLETE(missing));
  if (!opts.review && analysis && !remotionStoryRenderable(script, analysis)) throw new Error(V.SCENES_REQUIRED);
  const aspect = opts.aspect || RT_SHARED.VALUE_16_9;
  const dimensions = MOTION_ASPECT_BASE[aspect] || MOTION_ASPECT_BASE[RT_SHARED.VALUE_16_9];
  const fps = opts.fps || 30;
  const durations = script.beats.map((beat, index) => opts.durations?.[index] || estimateBeatSeconds(beat, script.language));
  const timeline = computeBeatTimeline(script.beats, durations, opts.voiceTrack?.continuous);
  const duration = Math.ceil(timeline.total * fps) / fps;
  const scenes: MotionRemotionTimedScene[] = [];
  const subtitles: MotionRemotionSpec["subtitles"] = [];
  const timedLines: { line: PuppetLine; start: number; end: number }[] = [];
  script.beats.forEach((beat, index) => {
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
    lines.forEach((line, lineIndex) => {
      const clip = line.utterance && clips.find((item) => item.id === line.utterance);
      const siblings = lines.filter((item) => item.utterance === line.utterance);
      const chars = siblings.reduce((sum, item) => sum + item.text.length, 0) || 1;
      const after = siblings.slice(0, siblings.findIndex((item) => item.key === line.key) + 1).reduce((sum, item) => sum + item.text.length, 0);
      timedLines.push({ line, start: startAt(lineIndex), end: clip ? clip.start + ((clip.end - clip.start) * after) / chars : lineIndex + 1 < lines.length ? startAt(lineIndex + 1) : beatEnd / fps });
    });
    if (opts.subtitles !== false) {
      if (clips.length) for (const clip of clips) subtitles.push(...buildSubtitles({ ...beat, narration: clip.text }, clip.start, clip.end));
      else subtitles.push(...buildSubtitles(beat, timeline.starts[index], timeline.ends[index]));
    }
  });
  const positions = new Map(timedLines.map((item, index) => [item.line.key, index]));
  const planned = script.beats.flatMap((beat) => state.scenes[beat.id] || []);
  let frame = 0;
  for (const [index, scene] of planned.entries()) {
    if (scene.composition && scene.aspect !== aspect) throw new Error(V.SCENES_REQUIRED);
    const from = positions.get(scene.fromLineId),
      to = positions.get(scene.toLineId);
    const next = planned[index + 1],
      nextPosition = next && positions.get(next.fromLineId);
    if (from === undefined || to === undefined || to < from || (next && (nextPosition === undefined || nextPosition !== to + 1)) || (!index && from !== 0) || (!next && to !== timedLines.length - 1)) throw new Error(V.INVALID_SPEC);
    const endFrame = next ? Math.min(Math.ceil(duration * fps), Math.max(frame + 1, Math.round(timedLines[nextPosition!].start * fps))) : Math.ceil(duration * fps);
    if (endFrame <= frame) throw new Error(V.INVALID_SPEC);
    const covered = timedLines.slice(from, to + 1);
    const speaking = covered.flatMap(({ line, start, end }) => {
      if (!line.speaker) return [];
      const startFrame = Math.max(frame, Math.round(start * fps)),
        lastFrame = Math.min(endFrame, Math.round(end * fps));
      return lastFrame > startFrame ? [{ entityId: line.speaker, startFrame, endFrame: lastFrame }] : [];
    });
    scenes.push({ ...scene, sourceBeatIds: [...new Set(covered.map(({ line }) => line.beatId))], startFrame: frame, endFrame, speaking, nodes: scene.composition ? scene.nodes.map((node, depth) => ({ ...node, x: 0, y: 0, width: dimensions.w, height: dimensions.h, depth })) : layoutRemotionNodes(scene.nodes, state.assets, dimensions.w, dimensions.h, state.assets[scene.backgroundKey || ""]) });
    frame = endFrame;
  }
  if (!scenes.length) throw new Error(V.SCENES_REQUIRED);
  const used = new Set(scenes.flatMap((scene) => (scene.composition ? [scene.composition.assetKey] : [scene.backgroundKey, ...scene.nodes.map((node) => node.assetKey)])).filter(Boolean));
  const spec: MotionRemotionSpec = {
    engine: RT_SHARED.REMOTION,
    version: V.VERSION,
    title: script.title,
    aspect,
    fps,
    width: dimensions.w,
    height: dimensions.h,
    duration,
    motion: behavior.actors === RT_SHARED.SIMPLE,
    renderBehavior: behavior,
    resolvedSettings: { layoutRevision: L.REVISION, effectRevision: L.EFFECT_REVISION, sceneRevision: L.SCENE_REVISION, behavior },
    profileId: settings.profileId,
    assets: Object.fromEntries(Object.entries(state.assets).filter(([key]) => used.has(key))),
    scenes,
    subtitles,
    music: { mood: motionMusicMood(analysis), cues: [], segments: motionMusicSegments(analysis, script.beats, timeline.starts) },
  };
  return { spec: validateRemotionSpec(spec), starts: timeline.starts, sfxCues: compileRemotionSound(spec, script, timeline.starts, timeline.ends, opts.voiceTrack), missing };
};
