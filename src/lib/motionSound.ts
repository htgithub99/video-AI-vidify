import { motionFiniteNumber } from "./motionNumber.js";
import * as MR from "../constants/motionRuntime.js";
import { MOTION_SOUND_CONFIG as C, MOTION_SOUND_KINDS } from "../constants/motionSound.js";
import type { MotionSoundCue, MotionSoundEvent } from "../types/motionVideo.js";
export const soundText = (value: unknown): string =>
  String(value || C.EMPTY)
    .normalize(MR.MOTION_TEXT_NFD)
    .replace(/[\u0300-\u036f]/g, C.EMPTY)
    .replace(/đ/g, MR.MOTION_TEXT_D)
    .replace(/Đ/g, MR.MOTION_TEXT_D)
    .toLowerCase()
    .replace(/[_-]/g, MR.MOTION_TEXT_SYMBOL_13);
export const soundKind = (value: unknown): string | undefined => {
  const text = soundText(value);
  return MOTION_SOUND_KINDS.find((item) => soundText(item.kind) === text)?.kind || MOTION_SOUND_KINDS.find((item) => item.pattern.test(text))?.kind;
};
export const normalizeSoundEvents = (raw: unknown): MotionSoundEvent[] =>
  (Array.isArray(raw) ? raw : []).slice(0, C.MAX_EVENTS).flatMap((value, index) => {
    if (!value || typeof value !== C.OBJECT) return [];
    const kind = soundKind(value.kind || value.description);
    if (!kind) return [];
    const layer = C.LAYERS.includes(value.layer) ? value.layer : MOTION_SOUND_KINDS.find((item) => item.kind === kind)!.layer;
    return [
      {
        id: String(value.id || index).slice(0, 80),
        kind,
        layer,
        at: motionFiniteNumber(value.at, 0, 0, 1),
        ...(value.t != null ? { t: motionFiniteNumber(value.t, 0, 0, 120) } : {}),
        ...(value.duration != null ? { duration: motionFiniteNumber(value.duration, 1, 0.04, 120) } : {}),
        anchor: value.anchor === MR.MOTION_TEXT_CUT ? MR.MOTION_TEXT_CUT : MR.MOTION_TEXT_BEAT,
        camera: Math.round(motionFiniteNumber(value.camera, 1, 1, 4)),
        description: String(value.description || C.EMPTY).slice(0, 240),
        source: value.source === C.SOURCES[1] ? C.SOURCES[1] : C.SOURCES[0],
        actor: typeof value.actor === "string" ? value.actor.slice(0, 80) : undefined,
        prop: typeof value.prop === "string" ? value.prop.slice(0, 80) : undefined,
        part: typeof value.part === "string" ? value.part.slice(0, 80) : undefined,
        assetId: /^[a-f0-9]{64}$/.test(value.assetId) ? value.assetId : undefined,
        gainDb: motionFiniteNumber(value.gainDb, C.BASE_GAIN[layer as keyof typeof C.BASE_GAIN], -40, 0),
        pan: motionFiniteNumber(value.pan, 0, -1, 1),
      },
    ];
  });
export const normalizeSoundCues = (raw: unknown, duration: number = C.MAX_DURATION): MotionSoundCue[] =>
  (Array.isArray(raw) ? raw : []).slice(0, C.MAX_CUES).flatMap((value, index) => {
    if (!value || !Number.isFinite(Number(value.t)) || value.t < 0 || value.t >= duration) return [];
    const event = normalizeSoundEvents([{ ...value, kind: value.kind === MR.MOTION_TEXT_HIT || value.kind === MR.MOTION_TEXT_CHAPTER ? MR.MOTION_TEXT_IMPACT : value.kind === MR.MOTION_TEXT_RISE ? MR.MOTION_TEXT_WHOOSH : value.kind }])[0];
    if (!event) return [];
    return [
      {
        ...event,
        id: String(value.id || index).slice(0, 160),
        beatId: String(value.beatId || C.EMPTY).slice(0, 80),
        t: Number(value.t),
        duration: motionFiniteNumber(value.duration, MOTION_SOUND_KINDS.find((item) => item.kind === event.kind)!.duration, 0.04, duration - Number(value.t)),
        gainDb: Math.max(-52, (event.gainDb ?? C.BASE_GAIN[event.layer]) + motionFiniteNumber(value.attenuation, 0, -12, 0)),
        loop: event.layer === MR.MOTION_TEXT_AMBIENCE,
        position: Array.isArray(value.position) ? value.position.slice(0, 3).map((n: unknown) => motionFiniteNumber(n, 0, -10000, 10000)) : undefined,
        priority: motionFiniteNumber(value.priority, event.layer === MR.MOTION_TEXT_ACTION ? 3 : event.layer === MR.MOTION_TEXT_AMBIENCE ? 1 : 2, 0, 3),
        speakerGender: ([MR.MOTION_TEXT_MALE, MR.MOTION_TEXT_FEMALE] as readonly string[]).includes(value.speakerGender) ? value.speakerGender : undefined,
      },
    ];
  });
export const formatSoundCueTime = (seconds: number): string => {
  const value = Math.max(0, Math.round(seconds * 1000));
  return MR.MOTION_TEMPLATE_EMPTY_2(Math.floor(value / 60000), String(Math.floor(value / 1000) % 60).padStart(2, MR.MOTION_TEXT_0), String(value % 1000).padStart(3, MR.MOTION_TEXT_0));
};
