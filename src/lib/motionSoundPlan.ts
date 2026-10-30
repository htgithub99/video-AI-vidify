import { stringifyJson } from "./jsonStringify.js";
import * as MR from "../constants/motionRuntime.js";
import { MOTION_SOUND_BEDS, MOTION_SOUND_CONFIG as C, MOTION_SOUND_GENRE_ALIAS, MOTION_SOUND_GENRE_CUE as G, MOTION_SOUND_GENRES, MOTION_SOUND_KINDS, MOTION_SOUND_SCARY_PLACE } from "../constants/motionSound.js";
import { motionCueLimit, normalizeSoundEvents, normalizeSoundCues, soundText } from "./motionSound.js";
import { motionAudioDirection, motionSpeakerTraits } from "./motionAudioDirection.js";
import { MOTION_AUDIO_DIRECTION } from "../constants/motionAudioDirection.js";
import type { MotionSoundCue, MotionSoundGenrePalette, MotionSpec, MotionStoryAnalysis, MotionStoryScript, MotionVoiceClip, MotionVoicePlan } from "../types/motionVideo.js";
export const motionSoundSpatial = (spec: MotionSpec, time: number, actor: any, duration: number, localTime: number): { pan?: number; position?: number[]; attenuation: number } => {
  if (!actor || !Array.isArray(actor.at)) return { attenuation: 0 };
  const shot = spec.shots.find((item) => item.start <= time && item.end > time),
    camera: any = (shot?.params as any)?.cameras?.[0] || (shot?.params as any)?.camera;
  const progress = actor.moveTo ? Math.max(0, Math.min(1, (localTime - (actor.moveStart || 0) * duration) / Math.max(0.05, ((actor.moveEnd ?? 1) - (actor.moveStart || 0)) * duration))) : 0;
  const position = [actor.at[0] + ((actor.moveTo?.[0] ?? actor.at[0]) - actor.at[0]) * progress, actor.y || 0, actor.at[1] + ((actor.moveTo?.[1] ?? actor.at[1]) - actor.at[1]) * progress];
  if (!camera?.pos || !camera?.target) return { position, attenuation: 0 };
  const dx = camera.target[0] - camera.pos[0],
    dz = camera.target[2] - camera.pos[2],
    span = Math.max(0.01, Math.hypot(dx, dz)),
    distance = Math.hypot(position[0] - camera.pos[0], position[2] - camera.pos[2]);
  const screenX = ((position[0] - camera.target[0]) * -dz + (position[2] - camera.target[2]) * dx) / span;
  return { position, pan: Math.max(-0.8, Math.min(0.8, screenX / Math.max(1, distance * 0.65))), attenuation: -Math.min(12, Math.max(0, 20 * Math.log10(Math.max(1, distance / 2)))) };
};
export const motionSoundGenre = (analysis?: MotionStoryAnalysis | null): MotionSoundGenrePalette | undefined => {
  const chosen = MOTION_SOUND_GENRE_ALIAS[analysis?.videoGenre || C.EMPTY] || MOTION_SOUND_GENRE_ALIAS[analysis?.genre || C.EMPTY];
  return chosen ? MOTION_SOUND_GENRES[chosen] || MOTION_SOUND_GENRES[MOTION_SOUND_GENRE_ALIAS[chosen]] : undefined;
};
const wordTime = (clips: MotionVoiceClip[], pattern: RegExp): number | undefined => {
  for (const clip of clips) {
    const text = soundText(clip.text),
      match = pattern.exec(text);
    if (match) return clip.start + ((clip.end - clip.start) * match.index) / Math.max(1, text.length) - G.WORD_LEAD;
  }
  return undefined;
};
export const compileMotionSoundPlan = (spec: MotionSpec, script?: MotionStoryScript, analysis?: MotionStoryAnalysis | null, direction = motionAudioDirection(script || null, analysis || null), roles?: MotionVoicePlan["roles"], clips?: MotionVoiceClip[]): MotionSoundCue[] => {
  const result: MotionSoundCue[] = [],
    seen = new Set<string>(),
    cueLimit = motionCueLimit(spec.duration || 0);
  const add = (cue: Record<string, unknown>) => {
    const normalized = normalizeSoundCues([cue], spec.duration || C.MAX_DURATION)[0];
    if (normalized && !seen.has(normalized.id)) {
      normalized.gainDb = Math.max(-52, (normalized.gainDb || 0) + MOTION_AUDIO_DIRECTION.SOUND_OFFSETS[direction.mode][normalized.layer]);
      if (normalized.actor) {
        const gender = roles?.find((role) => role.speaker === normalized.actor)?.gender || motionSpeakerTraits(analysis?.cast?.find((member) => member.key === normalized.actor) || {}).gender;
        normalized.speakerGender = gender === MR.MOTION_TEXT_MALE || gender === MR.MOTION_TEXT_FEMALE ? gender : undefined;
      }
      seen.add(normalized.id);
      result.push(normalized);
    }
  };
  const groups = new Map<string, { start: number; duration: number; staging: any; camera: any }>();
  for (const shot of spec.shots) {
    if (!shot.params) continue;
    const staging: any = shot.params,
      key = String(staging.soundBeatId || shot.id.replace(C.CAMERA_SUFFIX_RE, C.EMPTY)),
      start = shot.start - (Number(staging.tOffset) || 0);
    if (!groups.has(key)) groups.set(key, { start, duration: Number(staging.beatDur) || shot.end - start, staging, camera: staging.cameras?.[0] || staging.camera });
  }
  const palette = motionSoundGenre(analysis),
    suppressed = new Set(palette?.suppress || []),
    lastAccent = new Map<string, number>();
  let lastBed: MotionSoundCue | undefined,
    lastPlace: string = C.EMPTY,
    lastChapter: string | undefined;
  for (const [beatId, group] of groups) {
    const { start, duration, staging } = group,
      beat = script?.beats.find((item) => item.id === beatId),
      place = analysis?.places?.find((item) => item.key === staging.location),
      location: any = spec.gen?.locations?.[staging.location];
    if (staging.soundSilence || beat?.data?.soundSilence) {
      lastBed = undefined;
      lastPlace = C.EMPTY;
      continue;
    }
    const context = soundText([place?.description, location?.name, location?.time, staging.time, beat?.time, staging.weather, beat?.weather].join(MR.MOTION_TEXT_SYMBOL_13));
    const interior = place?.interior ?? location?.interior;
    const bed = MOTION_SOUND_BEDS.find((item) => item.pattern.test(context) && !(item.exteriorOnly && interior))?.kind || (interior ? MR.MOTION_TEXT_ROOM : undefined);
    const genreBed = palette?.bed;
    if (genreBed && (genreBed.always || MOTION_SOUND_SCARY_PLACE.test(context) || (!interior && C.NIGHT_RE.test(context)))) add({ id: MR.MOTION_TEMPLATE_AMBIENCE(beatId, genreBed.kind), beatId, t: start, kind: genreBed.kind, layer: MR.MOTION_TEXT_AMBIENCE, duration, gainDb: genreBed.gainDb, description: place?.description || location?.name, source: MR.MOTION_TEXT_OFFSCREEN });
    const events = normalizeSoundEvents(staging.soundEvents || beat?.data?.soundEvents).filter((event) => !suppressed.has(event.kind));
    if (palette?.chapter && beat?.chapterId && lastChapter !== undefined && beat.chapterId !== lastChapter)
      add({ id: MR.MOTION_TEMPLATE_EVENT(beatId, G.CHAPTER), beatId, t: start + G.CHAPTER_OFFSET, kind: palette.chapter.kind, layer: palette.chapter.layer, duration: MOTION_SOUND_KINDS.find((item) => item.kind === palette.chapter!.kind)!.duration, gainDb: palette.chapter.gainDb, description: palette.chapter.description, source: MR.MOTION_TEXT_OFFSCREEN });
    if (beat?.chapterId) lastChapter = beat.chapterId;
    const beatText = soundText([beat?.narration, ...(beat?.utterances || []).map((line) => line.text)].join(C.SPACE)),
      beatClips = (clips || []).filter((clip) => clip.beatId === beatId);
    for (const accent of palette?.accents || []) {
      const worded = accent.pattern.test(beatText),
        moved = !!beat?.sceneMood && (accent.moods || []).some((item) => item.mood === beat.sceneMood!.mood && beat.sceneMood!.intensity >= item.min);
      if ((!worded && !moved) || events.some((event) => event.kind === accent.kind)) continue;
      const at = Math.max(start, accent.at === G.WORD ? ((worded ? wordTime(beatClips, accent.pattern) : undefined) ?? start + duration * G.WORD_FALLBACK) : start + duration * accent.at);
      if (at < start || at >= start + duration || at - (lastAccent.get(accent.kind) ?? -Infinity) < accent.gap) continue;
      lastAccent.set(accent.kind, at);
      add({ id: MR.MOTION_TEMPLATE_EVENT(beatId, G.ACCENT + accent.kind), beatId, t: at, kind: accent.kind, layer: accent.layer, duration: Math.min(MOTION_SOUND_KINDS.find((item) => item.kind === accent.kind)!.duration, start + duration - at), gainDb: accent.gainDb, description: accent.description, source: MR.MOTION_TEXT_OFFSCREEN });
      break;
    }
    if (bed && !events.some((event) => event.layer === MR.MOTION_TEXT_AMBIENCE)) {
      const placeKey = MR.MOTION_TEMPLATE_EMPTY_3(staging.location, staging.time || location?.time, bed);
      if (lastBed && lastPlace === placeKey && Math.abs(lastBed.t + lastBed.duration - start) < 0.25) lastBed.duration = start + duration - lastBed.t;
      else {
        add({ id: MR.MOTION_TEMPLATE_AMBIENCE(beatId, bed), beatId, t: start, kind: bed, layer: MR.MOTION_TEXT_AMBIENCE, duration, description: place?.description || location?.name, source: MR.MOTION_TEXT_OFFSCREEN });
        lastBed = result[result.length - 1];
        lastPlace = placeKey;
      }
    } else {
      lastBed = undefined;
      lastPlace = C.EMPTY;
    }
    for (const event of events) {
      const actor = (Array.isArray(staging.actors) ? staging.actors : []).find((a: any) => a.cast === event.actor);
      if (event.actor && !actor && event.source !== MR.MOTION_TEXT_OFFSCREEN) continue;
      if (event.kind === MR.MOTION_TEXT_FOOTSTEP && event.source !== MR.MOTION_TEXT_OFFSCREEN && (!spec.gen?.characterMotion || !actor?.moveTo)) continue;
      if (event.prop && !stringifyJson([location?.nodes, staging.props]).includes(MR.MOTION_TEMPLATE_EMPTY_4(event.prop))) continue;
      const cut = event.anchor === MR.MOTION_TEXT_CUT ? spec.shots.filter((shot) => (shot.params as any)?.soundBeatId === beatId).sort((a, b) => a.start - b.start)[(event.camera || 1) - 1] : undefined;
      if (event.anchor === MR.MOTION_TEXT_CUT && !cut) continue;
      const line = event.utterance ? clips?.find((clip) => clip.beatId === beatId && clip.id === event.utterance) : undefined;
      const localTime = line ? (event.edge === C.EDGE_END ? line.end : line.start) - start + (event.t || 0) : cut ? cut.start - start + (event.t || 0) : event.utterance ? (event.at || 0) * duration : (event.t ?? (event.at || 0) * duration);
      if (localTime < 0) continue;
      if (localTime >= duration) continue;
      const spatial = motionSoundSpatial(spec, start + localTime, actor, duration, localTime);
      add({ ...event, id: MR.MOTION_TEMPLATE_EVENT(beatId, event.id), beatId, t: start + localTime, duration: Math.min(event.duration || (event.layer === MR.MOTION_TEXT_AMBIENCE ? duration : MOTION_SOUND_KINDS.find((item) => item.kind === event.kind)!.duration), duration - localTime), ...spatial, gainDb: event.gainDb });
    }
    if (spec.gen?.characterMotion)
      for (const actor of staging.actors || []) {
        const design: any = spec.gen.cast?.[actor.cast],
          motions = design?.motions || {};
        const transition = actor.then ? duration * (actor.moveTo ? (actor.moveEnd ?? 1) : (actor.thenAt ?? 0.6)) : duration;
        const segments = [{ action: actor.action, start: 0, end: transition }, ...(actor.then ? [{ action: actor.then, start: transition, end: duration }] : [])];
        for (const segment of segments) {
          const motion = motions[segment.action],
            markers = normalizeSoundEvents(motion?.events);
          if (!motion || !(motion.duration > 0)) continue;
          const offset = Math.max(0, Number(actor.offset) || 0),
            period = Math.max(0.05, Math.min(120, motion.duration));
          for (const marker of markers) {
            if (suppressed.has(marker.kind)) continue;
            if (marker.part && !design.parts?.some((part: any) => part.id === marker.part)) continue;
            if (marker.kind === MR.MOTION_TEXT_FOOTSTEP && actor.moveTo && !(segment.action === actor.action)) continue;
            const cycles = motion.loop ? Math.ceil((segment.end - segment.start + offset) / period) : 1;
            for (let cycle = 0; cycle < Math.min(cueLimit, cycles) && result.length < cueLimit; cycle++) {
              const local = segment.start + cycle * period + (marker.t || 0) - offset;
              if (local < segment.start || local >= segment.end || (marker.kind === MR.MOTION_TEXT_FOOTSTEP && actor.moveTo && (local < (actor.moveStart || 0) * duration || local >= (actor.moveEnd ?? 1) * duration))) continue;
              add({ ...marker, id: MR.MOTION_TEMPLATE_MOTION_2(beatId, actor.cast, segment.action, marker.id, cycle), beatId, actor: actor.cast, t: start + local, duration: marker.duration || MOTION_SOUND_KINDS.find((item) => item.kind === marker.kind)!.duration, ...motionSoundSpatial(spec, start + local, actor, duration, local) });
            }
          }
        }
        if (actor.moveTo && !result.some((cue) => cue.beatId === beatId && cue.actor === actor.cast && cue.kind === MR.MOTION_TEXT_FOOTSTEP)) {
          const first = (actor.moveStart || 0) * duration,
            end = (actor.moveEnd ?? 1) * duration,
            distance = Math.hypot(actor.moveTo[0] - actor.at[0], actor.moveTo[1] - actor.at[1]);
          if (distance < 0.05) continue;
          const interval = Math.max(0.22, Math.min(0.8, (end - first) / Math.max(1, distance / 0.55)));
          for (let time = first, step = 0; time < end && result.length < cueLimit; time += interval, step++)
            add({
              id: MR.MOTION_TEMPLATE_WALK(beatId, actor.cast, step),
              beatId,
              actor: actor.cast,
              t: start + time,
              kind: MR.MOTION_TEXT_FOOTSTEP,
              layer: MR.MOTION_TEXT_ACTION,
              duration: 0.28,
              description: (typeof location?.ground?.mat === MR.MOTION_TEXT_STRING ? location?.materials?.[location.ground.mat]?.pattern : location?.ground?.mat?.pattern) || place?.description || C.EMPTY,
              ...motionSoundSpatial(spec, start + time, actor, duration, time),
            });
        }
      }
  }
  const sorted = result.sort((a, b) => a.t - b.t || (b.priority || 0) - (a.priority || 0));
  const merged: MotionSoundCue[] = [];
  for (const cue of sorted) {
    if (cue.layer === MR.MOTION_TEXT_AMBIENCE) {
      const place = groups.get(cue.beatId)?.staging;
      const previous = merged
        .slice()
        .reverse()
        .find((other) => {
          const otherPlace = groups.get(other.beatId)?.staging;
          return other.layer === cue.layer && other.kind === cue.kind && other.assetId === cue.assetId && other.gainDb === cue.gainDb && other.pan === cue.pan && otherPlace?.location === place?.location && otherPlace?.time === place?.time && otherPlace?.weather === place?.weather && Math.abs(other.t + other.duration - cue.t) < 0.25;
        });
      if (previous) {
        previous.duration = Math.max(previous.t + previous.duration, cue.t + cue.duration) - previous.t;
        continue;
      }
    }
    if (!merged.some((other) => other.beatId === cue.beatId && other.actor === cue.actor && other.prop === cue.prop && other.part === cue.part && other.kind === cue.kind && other.layer !== MR.MOTION_TEXT_AMBIENCE && Math.abs(other.t - cue.t) < 0.08)) merged.push(cue);
  }
  return merged.slice(0, cueLimit);
};
