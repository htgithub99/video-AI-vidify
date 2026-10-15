import { motionFiniteNumber } from "./motionNumber.js";
import * as MR from "../constants/motionRuntime.js";
import { MOTION_VOICE as C, MOTION_VOICE_GROUP as G, MOTION_VOICE_LIBRARY } from "../constants/motionVoice.js";
import { soundText } from "./motionSound.js";
import { motionAudioDirection, motionSpeakerTraits } from "./motionAudioDirection.js";
import type { MotionStoryScript, MotionUtterance, MotionVoicePreset, MotionVoicePlan, MotionStoryAnalysis, MotionAudioDirection, MotionVoiceChannel, MotionVoiceGroup } from "../types/motionVideo.js";
export const motionVoiceSignature = (script: MotionStoryScript | null, analysis: MotionStoryAnalysis | null = null): string => JSON.stringify([C.VERSION, script?.language, script?.beats.map((beat) => [beat.id, beat.chapterId, beat.visual, beat.narration, beat.utterances]), script?.voiceSettings, analysis?.cast, motionAudioDirection(script, analysis), script?.voiceChannel || MR.MOTION_TEXT_EMPTY]);
export const voiceChannelRef = (channel?: Pick<MotionVoiceChannel, "id" | "updatedAt"> | null): string => (channel ? channel.id + MOTION_VOICE_LIBRARY.REF_SEPARATOR + channel.updatedAt : MR.MOTION_TEXT_EMPTY);
export const speechWords = (text: string): string =>
  text
    .replace(C.TAGS, MR.MOTION_TEXT_EMPTY)
    .replace(/[^\p{L}\p{N}]/gu, MR.MOTION_TEXT_EMPTY)
    .toLowerCase();
export const directedSpeechText = (line: MotionUtterance): string =>
  line.text
    .replace(/[“”"«»]/g, MR.MOTION_TEXT_EMPTY)
    .replace(/\s{2,}/g, MR.MOTION_TEXT_SYMBOL_13)
    .trim();
export const normalizeMotionUtterances = (raw: unknown, beatId: string, speakers: string[], narration?: string): MotionUtterance[] => {
  const used = new Set<string>();
  const lines = (Array.isArray(raw) ? raw : []).slice(0, C.MAX_LINES).flatMap((item, index): MotionUtterance[] => {
    if (!item || typeof item.text !== "string" || !item.text.trim() || item.text.length > C.MAX_CHARS) return [];
    const speaker = speakers.includes(item.speaker) ? item.speaker : C.NARRATOR;
    let id = String(item.id || MR.MOTION_TEMPLATE_EMPTY(beatId, index + 1))
      .replace(/[^a-zA-Z0-9_-]/g, MR.MOTION_TEXT_EMPTY)
      .slice(0, 100);
    if (!id || used.has(id)) id = MR.MOTION_TEMPLATE_EMPTY(beatId, index + 1);
    used.add(id);
    return [
      {
        id,
        speaker,
        role: speaker === C.NARRATOR ? MR.MOTION_TEXT_NARRATION : ([MR.MOTION_TEXT_DIALOGUE, MR.MOTION_TEXT_THOUGHT, MR.MOTION_TEXT_OFFSCREEN] as readonly string[]).includes(item.role) ? item.role : MR.MOTION_TEXT_DIALOGUE,
        text: item.text.trim().replace(C.TAGS, MR.MOTION_TEXT_EMPTY),
        emotion: C.EMOTIONS.includes(item.emotion) ? item.emotion : MR.MOTION_TEXT_NEUTRAL,
        speed: motionFiniteNumber(item.speed, 1, 0.85, 1.15),
        pauseBefore: motionFiniteNumber(item.pauseBefore, 0, 0, 2),
        pauseAfter: motionFiniteNumber(item.pauseAfter, 0.18, 0, 3),
        emphasis: (Array.isArray(item.emphasis) ? item.emphasis : []).filter((word: unknown) => typeof word === "string" && item.text.includes(word)).slice(0, 6),
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
export const selectMotionVoiceRoles = (analysis: MotionStoryAnalysis | null, voices: MotionVoicePreset[], requested: Record<string, string> = {}, direction?: MotionAudioDirection, inferred: Record<string, { gender?: "male" | "female"; age?: string }> = {}, channel?: MotionVoiceChannel | null): MotionVoicePlan["roles"] => {
  const existing = (name: string) => voices.find((voice) => voice.id === name || voice.name === name);
  const used = new Set<string>();
  const reserved = new Set<string>(channel ? [channel.narratorVoiceId, ...Object.values(channel.roleVoices || {})].filter((id): id is string => !!id && !!existing(id)) : []);
  const cast = [{ key: C.NARRATOR, name: C.NARRATOR, description: direction?.narrationStyle || MR.MOTION_TEXT_EMPTY, role: MR.MOTION_TEXT_EMPTY, look: MR.MOTION_TEXT_EMPTY }, ...(analysis?.cast || [])];
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
    const locked = lockedId && !used.has(lockedId) ? existing(lockedId) : undefined;
    const ageOk = (voice: MotionVoicePreset) => motionVoiceAge(voice) === wantedAge;
    const preferred = existing(requested[member.key]);
    const narrator = member.key === C.NARRATOR && direction?.mode === MR.MOTION_TEXT_STORYTELLING ? voices.find((voice) => fresh(voice) && ageOk(voice) && /ke chuyen|story|natural|tu nhien/.test(soundText([voice.name, voice.description].join(MR.MOTION_TEXT_SYMBOL_13)))) : undefined;
    const chosen = locked || (fresh(preferred) ? preferred : undefined) || narrator || candidates.find(fresh) || voices.find((voice) => fresh(voice) && ageOk(voice)) || voices.find(fresh) || candidates.find(compatible) || voices.find(compatible);
    if (!chosen) throw new Error(gender ? C.GENDER_UNAVAILABLE : C.FAILED);
    used.add(chosen.id);
    return { speaker: member.key, name: member.name, voiceId: chosen.id, gender: gender || chosen.gender, age, ...(locked ? { locked: true } : {}) };
  });
};
