import { stringifyJson } from "./jsonStringify.js";
import * as MR from "../constants/motionRuntime.js";
import { MOTION_AUDIO_DIRECTION as C, MOTION_SPEAKER_TRAITS as T } from "../constants/motionAudioDirection.js";
import { soundText } from "./motionSound.js";
import type { MotionAudioDirection, MotionStoryAnalysis, MotionStoryScript, MotionCastMember } from "../types/motionVideo.js";
export const motionSpeakerTraits = (member: Partial<MotionCastMember>): { gender?: "male" | "female"; age?: "child" | "adult" | "senior" } => {
  const text = soundText([member.name, member.role, member.description, member.look].join(MR.MOTION_TEXT_SYMBOL_13));
  const gender = member.gender || (/\b(female|woman|girl|grandmother|ba lao|ba gia|co gai|be gai|phu nu|nu gioi)\b/.test(text) || T.FEMALE_RE.test(text) ? MR.MOTION_TEXT_FEMALE : /\b(male|man|boy|grandfather|ong lao|ong gia|be trai|dan ong|nam gioi)\b/.test(text) || T.MALE_RE.test(text) ? MR.MOTION_TEXT_MALE : undefined);
  const years = Number(T.YEARS_RE.exec(text)?.[1]);
  const age =
    member.age && C.AGES.includes(member.age)
      ? member.age
      : years >= T.SENIOR_FROM
        ? MR.MOTION_TEXT_SENIOR
        : years > 0 && years <= T.CHILD_UNTIL
          ? MR.MOTION_TEXT_CHILD
          : /\b(elderly|senior|grandfather|grandmother|old man|old woman|ong lao|ong gia|ba lao|ba gia|cao tuoi)\b/.test(text) || T.SENIOR_RE.test(text)
            ? MR.MOTION_TEXT_SENIOR
            : /\b(child|little boy|little girl|tre em|em be|be trai|be gai)\b/.test(text) || T.CHILD_RE.test(text)
              ? MR.MOTION_TEXT_CHILD
              : years > 0
                ? C.ADULT_AGE
                : undefined;
  return { gender, age };
};
const formatMode = (text: string): MotionAudioDirection["mode"] | undefined =>
  /\b(documentary|documental|tai lieu|phong su|news|tin tuc)\b/.test(text)
    ? MR.MOTION_TEXT_DOCUMENTARY
    : /\b(storytelling|ke chuyen|truyen ke|audiobook|truyen doc)\b/.test(text)
      ? MR.MOTION_TEXT_STORYTELLING
      : /\b(explainer|explanation|giai thich|huong dan|educational)\b/.test(text)
        ? MR.MOTION_TEXT_EXPLAINER
        : /\b(film|cinema|drama|phim|screenplay|kich)\b/.test(text)
          ? MR.MOTION_TEXT_FILM
          : /\b(mixed|hon hop)\b/.test(text)
            ? MR.MOTION_TEXT_MIXED
            : undefined;
export const motionAudioDirection = (script: MotionStoryScript | null, analysis: MotionStoryAnalysis | null, suggested?: any): MotionAudioDirection => {
  const dna = analysis?.videoDna,
    explicit = formatMode(soundText(dna?.format?.primary));
  const context = soundText([analysis?.genre, analysis?.genre2, dna?.narrativeDna?.narrativeVoice, dna?.narrative?.voice, analysis?.creativeBlueprint?.narrative?.voice].join(MR.MOTION_TEXT_SYMBOL_13));
  const factual = dna?.format?.factual ?? analysis?.factual ?? false;
  const lines = script?.beats.flatMap((beat) => beat.utterances || []) || [],
    dialogue = lines.filter((line) => line.speaker !== MR.MOTION_TEXT_NARRATOR).length;
  const baseline = explicit || (factual ? MR.MOTION_TEXT_DOCUMENTARY : formatMode(context)) || (dialogue > 1 && dialogue > lines.length / 2 ? MR.MOTION_TEXT_FILM : MR.MOTION_TEXT_STORYTELLING);
  const proposed = C.MODES.includes(suggested?.mode) ? (suggested.mode as MotionAudioDirection["mode"]) : baseline;
  const mode = factual && (explicit || proposed) === MR.MOTION_TEXT_FILM ? MR.MOTION_TEXT_DOCUMENTARY : explicit || proposed;
  return { mode, factual, narrationStyle: [C.NARRATION[mode], dna?.audioText?.narration, dna?.editDna?.narratorVoice, dna?.narrativeDna?.narrativeVoice].filter(Boolean).join(MR.MOTION_TEXT_SYMBOL_13), soundStyle: [C.SOUND[mode], dna?.audioText?.sound, dna?.editDna?.soundBed].filter(Boolean).join(MR.MOTION_TEXT_SYMBOL_13), dialect: dna?.audienceProfile?.dialect || MR.MOTION_TEXT_EMPTY };
};
export const motionAudioContext = (script: MotionStoryScript | null, analysis: MotionStoryAnalysis | null): string => C.CONTEXT + stringifyJson(motionAudioDirection(script, analysis));
