import { motionFiniteNumber } from "./motionNumber.js";
import { MOTION_PATTERNS as MP } from "../constants/motionPatterns.js";
import * as MR from "../constants/motionRuntime.js";
import { MOTION_SOUND_CONFIG as C, MOTION_SOUND_FOLDER_KINDS, MOTION_SOUND_KINDS } from "../constants/motionSound.js";
import type { MotionSoundCue, MotionSoundEvent } from "../types/motionVideo.js";
export const soundText = (value: unknown): string =>
  String(value || C.EMPTY)
    .normalize(MR.MOTION_TEXT_NFD)
    .replace(MP.DIACRITICS, C.EMPTY)
    .replace(MP.VIETNAMESE_D_LOWER, MR.MOTION_TEXT_D)
    .replace(MP.VIETNAMESE_D_UPPER, MR.MOTION_TEXT_D)
    .toLowerCase()
    .replace(MP.WORD_SEPARATORS, MR.MOTION_TEXT_SYMBOL_13);
export const soundKind = (value: unknown): string | undefined => {
  const text = soundText(value);
  return MOTION_SOUND_KINDS.find((item) => soundText(item.kind) === text)?.kind || MOTION_SOUND_KINDS.find((item) => item.pattern.test(text))?.kind;
};
export const soundAssetKinds = (name: string, file: string = C.EMPTY): string[] => {
  const text = soundText(name),
    kinds = MOTION_SOUND_KINDS.filter((kind) => kind.pattern.test(text)).map((kind) => kind.kind);
  if (kinds.length) return kinds;
  const folder = String(file).split(MP.PATH_SEPARATOR).slice(-2, -1)[0] || C.EMPTY,
    fallback = MOTION_SOUND_FOLDER_KINDS[folder];
  return fallback ? [fallback] : [];
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
        ...(typeof value.utterance === C.STRING && value.utterance ? { utterance: value.utterance.slice(0, 100), edge: value.edge === C.EDGE_END ? C.EDGE_END : C.EDGE_START } : {}),
        description: String(value.description || C.EMPTY).slice(0, 240),
        source: value.source === C.SOURCES[1] ? C.SOURCES[1] : C.SOURCES[0],
        actor: typeof value.actor === MR.MOTION_TEXT_STRING ? value.actor.slice(0, 80) : undefined,
        prop: typeof value.prop === MR.MOTION_TEXT_STRING ? value.prop.slice(0, 80) : undefined,
        part: typeof value.part === MR.MOTION_TEXT_STRING ? value.part.slice(0, 80) : undefined,
        assetId: MP.SHA256.test(value.assetId) ? value.assetId : undefined,
        gainDb: motionFiniteNumber(value.gainDb, C.BASE_GAIN[layer as keyof typeof C.BASE_GAIN], -40, 0),
        pan: motionFiniteNumber(value.pan, 0, -1, 1),
      },
    ];
  });
export const motionCueLimit = (duration: number): number => Math.max(C.MAX_CUES, Math.ceil((Number.isFinite(duration) ? duration : 0) / C.MINUTE_SECONDS) * C.CUES_PER_MINUTE);
export const normalizeSoundCues = (raw: unknown, duration: number = C.MAX_DURATION): MotionSoundCue[] =>
  (Array.isArray(raw) ? raw : []).slice(0, motionCueLimit(duration)).flatMap((value, index) => {
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
export const motionAutoSoundEvents = (parts: unknown[]): MotionSoundEvent[] => {
  const text = soundText(parts.filter(Boolean).join(C.SPACE));
  const kinds = MOTION_SOUND_KINDS.filter((item) => item.pattern.test(text)).slice(0, C.AUTO_MAX_EVENTS);
  return normalizeSoundEvents(kinds.map((item, index) => ({ id: item.kind, kind: item.kind, layer: item.layer, at: C.AUTO_AT[index] ?? C.AUTO_AT[0], description: item.kind, source: C.SOURCES[0] })));
};
export const motionNarratedSoundEvents = (narration: string): MotionSoundEvent[] => {
  const text = soundText(narration);
  const rules: [string, RegExp][] = [
    ["dish", /\b(?:dua|thia|muong)\b.{0,24}\b(?:go|cham|va)\b.{0,24}\b(?:bat|chen|dia)\b|\b(?:chopsticks?|cutlery)\b.{0,24}\b(?:tap|tapping|clink)\b/u],
    ["door", /\b(?:tieng go cua|knocking at the door|door slams?)\b/u],
    ["bell", /\b(?:tieng chuong|chuong reo|bells? ring(?:ing)?)\b/u],
    ["footstep", /\b(?:tieng buoc chan|heard footsteps?|sound of footsteps?)\b/u],
    ["rain", /\b(?:tieng mua|sound of rain)\b/u],
  ];
  const events: Record<string, unknown>[] = [];
  for (const clause of text.split(/[.!?;:…]/u)) {
    if (/\b(?:khong (?:co|con|nghe|thay|duoc)|chua nghe|dung|neu|gia su|if|never|do not|no sound|did not hear|could not hear)\b/u.test(clause)) continue;
    for (const [kind, rule] of rules) {
      const match = rule.exec(clause);
      if (!match || events.some((event) => event.kind === kind)) continue;
      events.push({ id: `heard_${kind}`, kind, at: Math.min(0.95, Math.max(0, (text.indexOf(clause) + match.index) / Math.max(1, text.length))), description: clause.trim(), source: "offscreen" });
    }
  }
  return normalizeSoundEvents(events.slice(0, C.AUTO_MAX_EVENTS));
};
