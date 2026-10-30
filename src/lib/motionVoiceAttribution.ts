import * as COMMON_RUNTIME from "../constants/sourceText.js";
import { RUNTIME_VALUES } from "../constants/runtime/values.js";
import { soundText } from "./motionSound.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript, MotionUtterance, MotionVoicePlan } from "../types/motionVideo.js";
const normalized = (value: string) =>
  soundText(value)
    .replace(/[^\p{L}\p{N}]+/gu, COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52)
    .trim();
const containsName = (text: string, name: string) => !!name && `${COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52}${normalized(text)}${COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52}`.includes(`${COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52}${normalized(name)}${COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52}`);
const attribution = /(?:^|[.!?…]\s+)([^.!?…:：]{0,140}?(?:nói|hỏi|đáp|dặn|bảo|thì thào|quát|kêu|said|asked|replied|whispered)\s*[:：]\s*)/giu;
export const hasUnassignedMotionSpeech = (lines: MotionUtterance[]) => lines.some((line) => line.speaker === RUNTIME_VALUES.NARRATOR_663EE49C && [...line.text.matchAll(attribution)].some((match) => line.text.slice(match.index! + match[0].length).trim()));
export const repairMotionSpeechAttribution = (lines: MotionUtterance[], beat: MotionBeat, analysis: MotionStoryAnalysis | null): MotionUtterance[] => {
  const cast = analysis?.cast || [];
  const repaired = lines.flatMap((line, index): MotionUtterance[] => {
    if (line.speaker !== RUNTIME_VALUES.NARRATOR_663EE49C || line.role !== RUNTIME_VALUES.NARRATION_59AD8FF3) return [line];
    const match = [...line.text.matchAll(attribution)].at(-1);
    if (!match) return [line];
    const label = match[1];
    const named = cast
      .map((member) => ({ member, specificity: Math.max(0, ...[member.name, member.alias, member.key.replaceAll(COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_25, COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52)].filter((name): name is string => !!name && containsName(label, name)).map((name) => normalized(name).length)) }))
      .filter((item) => item.specificity)
      .sort((a, b) => b.specificity - a.specificity);
    const following = lines[index + 1];
    const pronoun = /^(?:roi\s+)?(?:no|han|co ay|anh ay|ba ay|ong ay|he|she)\b/u.test(normalized(label));
    const speaker = named.length && (!named[1] || named[0].specificity > named[1].specificity) ? named[0].member.key : !named.length && pronoun && following?.role === RUNTIME_VALUES.DIALOGUE_ABE0BA24 && following.speaker !== RUNTIME_VALUES.NARRATOR_663EE49C ? following.speaker : undefined;
    if (!speaker || !cast.some((member) => member.key === speaker)) return [line];
    const split = match.index! + match[0].length;
    const tail = line.text.slice(split);
    if (!tail.trim()) return [line];
    let end = tail.length;
    const quoted = /^[“"«‘]/u.exec(tail);
    if (quoted) {
      const close = tail.indexOf(({ "“": COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_20, '"': COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_3, "«": RUNTIME_VALUES.VALUE_07E83E3F, "‘": RUNTIME_VALUES.VALUE_FBE7A432 } as Record<string, string>)[quoted[0]], 1);
      if (close < 0) return [line];
      end = close + 1;
    } else {
      const resume = /(?<=[.!?…])\s+(?:Nói xong|Hỏi xong|Dứt lời|Having said that|After saying that)\b/iu.exec(tail);
      if (resume) end = resume.index;
      // Unquoted speech with no attributed continuation has an uncertain endpoint.
      else if (!following || following.speaker !== speaker || following.role !== RUNTIME_VALUES.DIALOGUE_ABE0BA24) return [line];
    }
    const leading = line.text.slice(0, split).trim();
    const spoken = tail.slice(0, end).trim();
    const trailing = tail.slice(end).trim();
    return [{ ...line, id: line.id + RUNTIME_VALUES.LEAD_C481E8EF, text: leading, pauseAfter: 0 }, { ...line, id: line.id + RUNTIME_VALUES.SPEECH_BEC58EFF, speaker, role: RUNTIME_VALUES.DIALOGUE_ABE0BA24, text: spoken, pauseBefore: 0, pauseAfter: trailing ? 0 : line.pauseAfter }, ...(trailing ? [{ ...line, id: line.id + RUNTIME_VALUES.TAIL_06614391, text: trailing, pauseBefore: 0 }] : [])];
  });
  const words = (rows: MotionUtterance[]) => normalized(rows.map((row) => row.text).join(COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52));
  return words(repaired) === normalized(beat.narration) ? repaired : lines;
};
const borrowed = /\b(?:bi (?:ma|vong|quy)(?: [\p{L}]+){0,3} nhap|(?:ma|vong|quy|co hon)(?: [\p{L}]+){0,3} muon giong|giong khong phai cua|khong phai (?:la )?giong|possessed|borrowed voice|speaking through)\b/u;
const restored = /\b(?:giong(?: [\p{L}]+){0,4} (?:tro lai|binh thuong)|het bi nhap|tinh lai|voice returned|no longer possessed)\b/u;
const ghostName = /\b(?:vong|co hon|hon ma|linh hon|ma quy|ghost|spirit|demon)\b/u;
const invades = /\b(?:chiem than|chiem xac|nhap vao|muon giong|possess(?:es|ing|ed)?|speaks? through)\b/u;
const displaced = /\b(?:bi day (?:ra|khoi)|bi duoi (?:ra|khoi)|displaced soul|disembodied victim)\b/u;
const lastMatch = (pattern: RegExp, text: string) => [...text.matchAll(new RegExp(pattern.source, RUNTIME_VALUES.GU_6152D43C))].at(-1)?.index ?? -1;
export const resolveMotionVoiceSources = (beats: MotionVoicePlan["beats"], script: MotionStoryScript, analysis: MotionStoryAnalysis | null): MotionVoicePlan["beats"] => {
  const cast = analysis?.cast || [];
  const sources = cast.filter((member) => ghostName.test(normalized([member.name, member.key.replaceAll(COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_25, COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52), member.role, member.description].join(COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52))));
  const states = new Map<string, string>();
  let previousChapter: string | undefined;
  return beats.map((row, index) => {
    const beat = script.beats[index];
    if (previousChapter !== beat.chapterId) states.clear();
    previousChapter = beat.chapterId;
    const manual = script.voiceSettings?.utterances?.[beat.id];
    const automatic = !manual && !(analysis?.factual || analysis?.videoDna?.format?.factual);
    return {
      ...row,
      utterances: row.utterances.map((line) => {
        if (line.role === RUNTIME_VALUES.NARRATION_59AD8FF3 || line.role === RUNTIME_VALUES.THOUGHT_B8192353 || script.voiceSettings?.voices?.[line.speaker]) return line;
        if (!automatic) return line;
        const member = cast.find((item) => item.key === line.speaker);
        const offset = beat.narration.indexOf(line.text);
        const before = beat.narration.slice(0, offset < 0 ? 0 : offset);
        const preceding = index && script.beats[index - 1].chapterId === beat.chapterId ? script.beats[index - 1].narration : "";
        const evidence = normalized((preceding + COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52 + before).slice(-700));
        const identity = normalized([member?.description, member?.role].join(COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52));
        const changeAt = lastMatch(borrowed, evidence);
        if (lastMatch(restored, evidence) > changeAt) {
          states.delete(line.speaker);
          const { voiceSpeaker: _source, ...ordinary } = line;
          return ordinary;
        }
        const candidates = sources.filter((source) => {
          const role = normalized([source.description, source.role].join(COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52));
          return source.key !== line.speaker && !displaced.test(role) && (source.appearanceOf !== line.speaker || invades.test(role));
        });
        const linked = candidates.filter((source) => {
          const role = normalized([source.description, source.role].join(COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52));
          const after = role.slice(lastMatch(invades, role) < 0 ? role.length : lastMatch(invades, role));
          return !!member && [member.name, member.alias].some((name) => !!name && containsName(after, name));
        });
        const named = candidates.filter((source) => containsName(evidence, source.name));
        const source = linked.length === 1 ? linked[0] : named.length === 1 ? named[0] : candidates.length === 1 ? candidates[0] : undefined;
        if (line.voiceSpeaker && candidates.some((item) => item.key === line.voiceSpeaker) && (!source || source.key === line.voiceSpeaker) && changeAt >= 0) {
          states.set(line.speaker, line.voiceSpeaker);
          return line;
        }
        if (line.voiceSpeaker && !candidates.some((item) => item.key === line.voiceSpeaker)) states.delete(line.speaker);
        if (source && changeAt >= 0 && (borrowed.test(identity) || (member && [member.name, member.key.replaceAll(COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_25, COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52)].some((name) => containsName(evidence, name))))) states.set(line.speaker, source.key);
        const voiceSpeaker = states.get(line.speaker);
        if (voiceSpeaker) return { ...line, voiceSpeaker };
        const { voiceSpeaker: _source, ...ordinary } = line;
        return ordinary;
      }),
    };
  });
};
