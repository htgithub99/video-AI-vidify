import { motionFiniteNumber } from "./motionNumber.js";
import { stringifyJson } from "./jsonStringify.js";
import * as MR from "../constants/motionRuntime.js";
import { MOTION_VOICE as C, MOTION_VOICE_RANK as RANK, MOTION_VOICE_DELIVERY as D, MOTION_VOICE_GROUP as G, MOTION_VOICE_LIBRARY, MOTION_VOICE_FILTER as F, MOTION_VOICE_PATTERNS as P, MOTION_VOICE_FX as FX, MOTION_VOICE_PACING as PACE } from "../constants/motionVoice.js";
import { soundText } from "./motionSound.js";
import { motionAudioDirection, motionSpeakerTraits } from "./motionAudioDirection.js";
import { MOTION_SPEECH } from "../constants/motionSpeech.js";
import { motionQuotedSpeech } from "./motionSpeech.js";
import type { MotionSceneMood, MotionVoiceDelivery, MotionStoryScript, MotionUtterance, MotionVoicePreset, MotionVoicePlan, MotionStoryAnalysis, MotionAudioDirection, MotionVoiceChannel, MotionVoiceGroup, MotionCastMember } from "../types/motionVideo.js";
export const motionVoiceCastContext = (analysis: MotionStoryAnalysis | null) => analysis?.cast.map((member) => ({ key: member.key, name: member.name, role: member.role, narrator: member.narrator, appearanceOf: member.appearanceOf, ...motionSpeakerTraits(member) }));
export const motionVoiceSignature = (script: MotionStoryScript | null, analysis: MotionStoryAnalysis | null = null, channelVersion = script?.voiceChannel): string =>
  stringifyJson([C.VERSION, C.TRACK_VERSION, C.ASR.VERSION, FX.VERSION, C.TEMPO, PACE, script?.language, script?.beats.map((beat) => [beat.id, beat.narration, beat.utterances, beat.sceneMood]), script?.voiceSettings, motionVoiceCastContext(analysis), motionAudioDirection(script, analysis), channelVersion || MR.MOTION_TEXT_EMPTY]);
export const voiceChannelRef = (channel?: Pick<MotionVoiceChannel, "id" | "updatedAt"> | null): string => (channel ? channel.id + MOTION_VOICE_LIBRARY.REF_SEPARATOR + channel.updatedAt : MR.MOTION_TEXT_EMPTY);
export const motionLanguageCode = (value: unknown): string => {
  const raw = String(value ?? MR.MOTION_TEXT_EMPTY)
    .trim()
    .toLowerCase();
  return MOTION_VOICE_LIBRARY.LANGUAGE_NAMES[raw] || raw.slice(0, MOTION_VOICE_LIBRARY.LANGUAGE_CODE_LENGTH);
};
export const motionVoiceSpeaks = (voice: Pick<MotionVoicePreset, "language">, language: unknown): boolean => !voice.language || !language || motionLanguageCode(voice.language) === motionLanguageCode(language);
export const isAi33Voice = (id: string): boolean => id.startsWith(MOTION_VOICE_LIBRARY.AI33_PREFIX);
export const motionVoiceMatchesFilter = (voice: MotionVoicePreset, filter: (typeof F)[keyof typeof F]): boolean => {
  switch (filter) {
    case F.PRESET:
      return !voice.custom && voice.source !== MOTION_VOICE_LIBRARY.AI33_SOURCE;
    case F.CUSTOM:
      return !!voice.custom;
    case F.AI33:
      return voice.source === MOTION_VOICE_LIBRARY.AI33_SOURCE;
    case F.MALE:
      return voice.gender === MR.MOTION_TEXT_MALE;
    case F.FEMALE:
      return voice.gender === MR.MOTION_TEXT_FEMALE;
    default:
      return true;
  }
};
export const speechWords = (text: string): string => text.replace(C.TAGS, MR.MOTION_TEXT_EMPTY).replace(P.NON_WORD, MR.MOTION_TEXT_EMPTY).toLowerCase();
export const normalizeMotionNarratorSpeakers = (raw: unknown, narratorKey?: string): unknown => (Array.isArray(raw) && narratorKey ? raw.map((line) => (line?.speaker === narratorKey && line?.role === MR.MOTION_TEXT_NARRATION ? { ...line, speaker: C.NARRATOR } : line)) : raw);
const fxStrength = (line: MotionUtterance, delivery: Pick<MotionVoiceDelivery, "mood" | "strength">): number => {
  const share = FX.ROLES.includes(line.role) ? 1 : FX.NARRATOR_SHARE;
  const s = Math.round(delivery.strength * share * 100) / 100;
  return s >= FX.MIN_STRENGTH && FX.MOODS[delivery.mood] ? s : 0;
};
export const directedSpeechText = (line: MotionUtterance): string => {
  const text = line.text.replace(P.QUOTES, MR.MOTION_TEXT_EMPTY).replace(P.MULTIPLE_SPACES, MR.MOTION_TEXT_SYMBOL_13).trim();
  const ending = FX.ENDINGS[line.emotion];
  if (!ending || !FX.ROLES.includes(line.role) || (line.intensity ?? 1) < FX.ENDING_STRENGTH) return text;
  return text.replace(FX.END_PUNCT_RE, MR.MOTION_TEXT_EMPTY) + ending;
};
export const motionVoiceFilter = (line: MotionUtterance, delivery: Pick<MotionVoiceDelivery, "mood" | "strength">, tempo: number): string => {
  const s = fxStrength(line, delivery);
  const fx = s ? FX.MOODS[delivery.mood] : FX.NONE;
  const r = Math.pow(FX.SEMITONE, fx.pitch * s);
  const parts: string[] = [FX.CLEAN.TRIM, FX.F.RESAMPLE(FX.SAMPLE_RATE)];
  if (Math.abs(r - 1) > 0.001) parts.push(FX.F.SETRATE(Math.round(FX.SAMPLE_RATE * r)), FX.F.RESAMPLE(FX.SAMPLE_RATE));
  parts.push(FX.F.ATEMPO(tempo / r), FX.CLEAN.FILTER);
  if (fx.vibrato * s > 0.01) parts.push(FX.F.VIBRATO(fx.vibratoHz, fx.vibrato * s));
  if (Math.abs(fx.treble * s) > 0.2) parts.push(FX.F.TREBLE(fx.treble * s));
  if (Math.abs(fx.presence * s) > 0.2) parts.push(FX.F.PRESENCE(fx.presence * s));
  if (fx.lowpass && s > 0.3) parts.push(FX.F.LOWPASS(fx.lowpass));
  parts.push(FX.CLEAN.TAIL);
  return parts.join(FX.SEP);
};
export const normalizeMotionUtterances = (raw: unknown, beatId: string, speakers: string[], narration?: string): MotionUtterance[] => {
  const used = new Set<string>();
  const lines = (Array.isArray(raw) ? raw : []).slice(0, C.MAX_LINES).flatMap((item, index): MotionUtterance[] => {
    if (!item || typeof item.text !== MR.MOTION_TEXT_STRING || !item.text.trim() || item.text.length > C.MAX_CHARS) return [];
    const speaker = speakers.includes(item.speaker) ? item.speaker : C.NARRATOR;
    let id = String(item.id || MR.MOTION_TEMPLATE_EMPTY(beatId, index + 1))
      .replace(P.LINE_ID, MR.MOTION_TEXT_EMPTY)
      .slice(0, 100);
    if (!id || used.has(id)) id = MR.MOTION_TEMPLATE_EMPTY(beatId, index + 1);
    used.add(id);
    return [
      {
        id,
        speaker,
        role: speaker === C.NARRATOR ? MR.MOTION_TEXT_NARRATION : (MOTION_SPEECH.ROLES as readonly string[]).includes(item.role) ? item.role : MR.MOTION_TEXT_DIALOGUE,
        text: item.text.trim().replace(C.TAGS, MR.MOTION_TEXT_EMPTY),
        emotion: C.EMOTIONS.includes(item.emotion) ? item.emotion : MR.MOTION_TEXT_NEUTRAL,
        ...(item.intensity != null ? { intensity: motionFiniteNumber(item.intensity, 1, 0, 1) } : {}),
        speed: motionFiniteNumber(item.speed, 1, 0.85, 1.15),
        pauseBefore: motionFiniteNumber(item.pauseBefore, 0, 0, 2),
        pauseAfter: motionFiniteNumber(item.pauseAfter, 0.18, 0, 3),
        emphasis: (Array.isArray(item.emphasis) ? item.emphasis : []).filter((word: unknown) => typeof word === MR.MOTION_TEXT_STRING && item.text.includes(word)).slice(0, 6),
      },
    ];
  });
  return narration != null && speechWords(lines.map((line) => line.text).join(MR.MOTION_TEXT_SYMBOL_13)) !== speechWords(narration) ? [] : lines;
};
export const fallbackMotionUtterances = (id: string, text: string): MotionUtterance[] => (text.trim() ? [{ id: MR.MOTION_TEMPLATE_NARRATOR(id), speaker: C.NARRATOR, role: MR.MOTION_TEXT_NARRATION, text: text.trim(), emotion: MR.MOTION_TEXT_NEUTRAL, speed: 1, pauseBefore: 0, pauseAfter: 0.18, emphasis: [] }] : []);
export const motionVoiceAge = (voice: MotionVoicePreset): string => {
  if (voice.age === MR.MOTION_TEXT_SENIOR || voice.age === MR.MOTION_TEXT_CHILD || voice.age === C.ADULT) return voice.age;
  const text = soundText([voice.name, voice.description].join(MR.MOTION_TEXT_SYMBOL_13));
  if ((C.SENIOR as readonly string[]).includes(voice.name) || (C.SENIOR_FEMALE as readonly string[]).includes(voice.name) || C.SENIOR_TAG.test(text)) return MR.MOTION_TEXT_SENIOR;
  return C.CHILD_TAG.test(text) ? MR.MOTION_TEXT_CHILD : C.ADULT;
};
export const motionVoiceGroup = (gender?: string, age?: string): MotionVoiceGroup => (age === MR.MOTION_TEXT_CHILD ? G.CHILD : age === MR.MOTION_TEXT_SENIOR ? (gender === MR.MOTION_TEXT_FEMALE ? G.SENIOR_FEMALE : G.SENIOR_MALE) : gender === MR.MOTION_TEXT_FEMALE ? G.FEMALE_ADULT : G.MALE_ADULT);
export const motionVoiceRegion = (voice?: Pick<MotionVoicePreset, "name" | "description">): string | undefined => {
  if (!voice) return undefined;
  const raw = [voice.name, voice.description].join(MR.MOTION_TEXT_SYMBOL_13),
    text = soundText(raw);
  const named = Object.entries(P.REGIONS).find(([, re]) => re.test(text))?.[0];
  if (named) return named;
  const parts = String(voice.description || MR.MOTION_TEXT_EMPTY)
    .split(P.PART_SEPARATOR)
    .map((part) => soundText(part).trim());
  return parts.length >= 3 && P.GENDER_PART.test(parts[0]) ? P.REGION_SHORT[parts[1]] : undefined;
};
const voiceRank = (voice: MotionVoicePreset, region?: string): number => {
  const text = soundText([voice.name, voice.description].join(MR.MOTION_TEXT_SYMBOL_13)),
    own = motionVoiceRegion(voice);
  return (region && own ? (own === region ? RANK.REGION : RANK.REGION_MISS) : 0) + (P.STORY_STYLE.test(text) ? RANK.STORY : 0) + (P.NEWS_STYLE.test(text) ? RANK.NEWS : 0);
};
export const motionNarratorCastKey = (analysis: MotionStoryAnalysis | null | undefined): string | undefined => {
  const cast = analysis?.cast || [];
  const flagged = cast.find((member) => (member as Partial<MotionCastMember>).narrator === true);
  if (flagged) return flagged.key;
  return cast.find((member) => [member.key, member.name, member.alias].some((v) => P.NARRATOR_SELF.test(soundText(v).replace(P.NON_WORD, MR.MOTION_TEXT_SYMBOL_13).trim())) || P.NARRATOR_ROLE.test(soundText(member.role)))?.key;
};
export const motionNarratorLines = (lines: MotionUtterance[], narratorKey?: string, narration?: string): MotionUtterance[] => (narratorKey ? lines.map((line) => (line.speaker === narratorKey && (line.role !== MR.MOTION_TEXT_DIALOGUE || (narration != null && !motionQuotedSpeech(narration, line.text))) ? { ...line, speaker: C.NARRATOR, role: MR.MOTION_TEXT_NARRATION } : line)) : lines);
export const selectMotionVoiceRoles = (analysis: MotionStoryAnalysis | null, voices: MotionVoicePreset[], requested: Record<string, string> = {}, direction?: MotionAudioDirection, inferred: Record<string, { gender?: "male" | "female"; age?: string }> = {}, channel?: MotionVoiceChannel | null, fixed: Record<string, string> = {}): MotionVoicePlan["roles"] => {
  const existing = (name: string) => voices.find((voice) => voice.id === name || voice.name === name);
  const region = motionVoiceRegion(channel ? existing(channel.narratorVoiceId) : undefined) || Object.entries(P.REGIONS).find(([, re]) => re.test(soundText(direction?.dialect)))?.[0];
  const ranked = [...voices].sort((a, b) => voiceRank(b, region) - voiceRank(a, region));
  const used = new Set<string>();
  let narratorVoice: MotionVoicePreset | undefined;
  const narratorKey = motionNarratorCastKey(analysis);
  const cast = [{ key: C.NARRATOR, name: C.NARRATOR, description: direction?.narrationStyle || MR.MOTION_TEXT_EMPTY, role: MR.MOTION_TEXT_EMPTY, look: MR.MOTION_TEXT_EMPTY }, ...(analysis?.cast || [])];
  const kept: Record<string, string> = Object.fromEntries(Object.entries(fixed).filter(([key, id]) => cast.some((member) => member.key === key) && !!existing(id) && !(key === C.NARRATOR && channel && channel.narratorVoiceId !== id)));
  const reserved = new Set<string>([...(channel ? [channel.narratorVoiceId, ...Object.values(channel.roleVoices || {})].filter((id): id is string => !!id && !!existing(id)) : []), ...Object.values(kept)]);
  return cast.map((member) => {
    const traits = motionSpeakerTraits(member),
      gender = traits.gender || inferred[member.key]?.gender,
      age = traits.age || inferred[member.key]?.age;
    const senior = age === MR.MOTION_TEXT_SENIOR,
      female = gender === MR.MOTION_TEXT_FEMALE,
      wantedAge = senior ? MR.MOTION_TEXT_SENIOR : age === MR.MOTION_TEXT_CHILD ? MR.MOTION_TEXT_CHILD : C.ADULT;
    const named = (senior ? (female ? C.SENIOR_FEMALE : C.SENIOR) : wantedAge === C.ADULT ? (female ? C.PRESET_FEMALE : C.PRESET_MALE) : []).map(existing);
    const trained = voices.filter((voice) => voice.id.startsWith(MR.MOTION_TEXT_CUSTOM) && motionVoiceAge(voice) === wantedAge);
    const candidates = [...named, ...trained];
    const compatible = (voice: MotionVoicePreset | undefined): voice is MotionVoicePreset => !!voice && (!gender || voice.gender === gender);
    const fresh = (voice: MotionVoicePreset | undefined): voice is MotionVoicePreset => compatible(voice) && !used.has(voice.id) && !reserved.has(voice.id);
    const lockedId = !channel ? undefined : member.key === C.NARRATOR ? channel.narratorVoiceId : channel.roleVoices?.[motionVoiceGroup(gender, wantedAge)];
    const locked = lockedId && !used.has(lockedId) && !Object.entries(kept).some(([key, id]) => key !== member.key && id === lockedId) ? [existing(lockedId)].find(compatible) : undefined;
    const ageOk = (voice: MotionVoicePreset) => motionVoiceAge(voice) === wantedAge;
    const own = kept[member.key] && (!lockedId || kept[member.key] === lockedId) ? existing(kept[member.key]) : undefined;
    if (((member as Partial<MotionCastMember>).narrator || member.key === narratorKey) && narratorVoice) return { speaker: member.key, name: member.name, voiceId: narratorVoice.id, gender: gender || narratorVoice.gender, age, shared: true };
    if (own && compatible(own) && !used.has(own.id)) {
      used.add(own.id);
      if (member.key === C.NARRATOR) narratorVoice = own;
      return { speaker: member.key, name: member.name, voiceId: own.id, gender: gender || own.gender, age, ...(own.id === lockedId ? { locked: true } : {}) };
    }
    const preferred = existing(requested[member.key]);
    const narrator = member.key === C.NARRATOR && direction?.mode === MR.MOTION_TEXT_STORYTELLING ? voices.find((voice) => fresh(voice) && ageOk(voice) && P.NARRATOR.test(soundText([voice.name, voice.description].join(MR.MOTION_TEXT_SYMBOL_13)))) : undefined;
    const chosen = locked || (fresh(preferred) ? preferred : undefined) || narrator || [...candidates].sort((a, b) => voiceRank(b!, region) - voiceRank(a!, region)).find(fresh) || ranked.find((voice) => fresh(voice) && ageOk(voice)) || ranked.find(fresh) || candidates.find(compatible) || ranked.find(compatible);
    if (!chosen) throw new Error(gender ? C.GENDER_UNAVAILABLE : C.FAILED);
    used.add(chosen.id);
    if (member.key === C.NARRATOR) narratorVoice = chosen;
    return { speaker: member.key, name: member.name, voiceId: chosen.id, gender: gender || chosen.gender, age, ...(locked ? { locked: true } : {}) };
  });
};
export const normalizeMotionSceneMood = (raw: any): MotionSceneMood | undefined => (raw && C.EMOTIONS.includes(raw.mood) && raw.mood !== MR.MOTION_TEXT_NEUTRAL ? { mood: raw.mood, intensity: motionFiniteNumber(raw.intensity, 0.6, 0, 1) } : undefined);
export const resolveMotionDelivery = (line: MotionUtterance, sceneMood?: MotionSceneMood): MotionVoiceDelivery => {
  const own = line.emotion !== MR.MOTION_TEXT_NEUTRAL;
  const mood = own ? line.emotion : line.speaker === C.NARRATOR && sceneMood ? sceneMood.mood : MR.MOTION_TEXT_NEUTRAL;
  const strength = mood === MR.MOTION_TEXT_NEUTRAL ? 0 : Math.round(Math.min(1, own ? (line.intensity ?? 1) : (sceneMood?.intensity ?? 0) * D.NARRATOR_SHARE) * 100) / 100;
  const target = D.MOODS[mood] || D.NEUTRAL;
  const values = Object.fromEntries(Object.entries(D.NEUTRAL).map(([key, neutral]) => [key, Math.round((neutral + (target[key as keyof typeof target] - neutral) * strength) * 1000) / 1000])) as Omit<MotionVoiceDelivery, "mood" | "strength">;
  return { mood, strength, ...values };
};
export const motionVoiceCast = (previous: Record<string, string> | undefined, roles: MotionVoicePlan["roles"]): Record<string, string> => ({ ...(previous || {}), ...Object.fromEntries(roles.map((role) => [role.speaker, role.voiceId])) });
