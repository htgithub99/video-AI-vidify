import { soundText } from "./motionSound.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript, MotionUtterance, MotionVoicePlan } from "../types/motionVideo.js";

const normalized = (value: string) => soundText(value).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const containsName = (text: string, name: string) => !!name && (` ${normalized(text)} `).includes(` ${normalized(name)} `);
const attribution = /(?:^|[.!?…]\s+)([^.!?…:：]{0,140}?(?:nói|hỏi|đáp|dặn|bảo|thì thào|quát|kêu|said|asked|replied|whispered)\s*[:：]\s*)/giu;
export const hasUnassignedMotionSpeech = (lines: MotionUtterance[]) => lines.some((line) => line.speaker === "narrator" && [...line.text.matchAll(attribution)].some((match) => line.text.slice(match.index! + match[0].length).trim()));

/** Repair only an attributable direct-speech span, retaining every source word. */
export const repairMotionSpeechAttribution = (lines: MotionUtterance[], beat: MotionBeat, analysis: MotionStoryAnalysis | null): MotionUtterance[] => {
  const cast = analysis?.cast || [];
  const repaired = lines.flatMap((line, index): MotionUtterance[] => {
    if (line.speaker !== "narrator" || line.role !== "narration") return [line];
    const match = [...line.text.matchAll(attribution)].at(-1);
    if (!match) return [line];
    const label = match[1];
    const named = cast.map((member) => ({ member, specificity: Math.max(0, ...[member.name, member.alias, member.key.replaceAll("_", " ")].filter((name): name is string => !!name && containsName(label, name)).map((name) => normalized(name).length)) })).filter((item) => item.specificity).sort((a, b) => b.specificity - a.specificity);
    // A pronoun can be resolved from one adjacent, already attributed continuation.
    const following = lines[index + 1];
    const pronoun = /^(?:roi\s+)?(?:no|han|co ay|anh ay|ba ay|ong ay|he|she)\b/u.test(normalized(label));
    const speaker = named.length && (!named[1] || named[0].specificity > named[1].specificity) ? named[0].member.key : !named.length && pronoun && following?.role === "dialogue" && following.speaker !== "narrator" ? following.speaker : undefined;
    if (!speaker || !cast.some((member) => member.key === speaker)) return [line];
    const split = match.index! + match[0].length;
    const tail = line.text.slice(split);
    if (!tail.trim()) return [line];
    let end = tail.length;
    const quoted = /^[“"«‘]/u.exec(tail);
    if (quoted) {
      const close = tail.indexOf(({ "“": "”", '"': '"', "«": "»", "‘": "’" } as Record<string, string>)[quoted[0]], 1);
      if (close < 0) return [line];
      end = close + 1;
    } else {
      const resume = /(?<=[.!?…])\s+(?:Nói xong|Hỏi xong|Dứt lời|Having said that|After saying that)\b/iu.exec(tail);
      if (resume) end = resume.index;
      // Unquoted speech with no attributed continuation has an uncertain endpoint.
      else if (!following || following.speaker !== speaker || following.role !== "dialogue") return [line];
    }
    const leading = line.text.slice(0, split).trim();
    const spoken = tail.slice(0, end).trim();
    const trailing = tail.slice(end).trim();
    return [
      { ...line, id: line.id + "_lead", text: leading, pauseAfter: 0 },
      { ...line, id: line.id + "_speech", speaker, role: "dialogue", text: spoken, pauseBefore: 0, pauseAfter: trailing ? 0 : line.pauseAfter },
      ...(trailing ? [{ ...line, id: line.id + "_tail", text: trailing, pauseBefore: 0 }] : []),
    ];
  });
  const words = (rows: MotionUtterance[]) => normalized(rows.map((row) => row.text).join(" "));
  return words(repaired) === normalized(beat.narration) ? repaired : lines;
};

const borrowed = /\b(?:bi (?:ma|vong|quy)(?: [\p{L}]+){0,3} nhap|(?:ma|vong|quy|co hon)(?: [\p{L}]+){0,3} muon giong|giong khong phai cua|khong phai (?:la )?giong|possessed|borrowed voice|speaking through)\b/u;
const restored = /\b(?:giong(?: [\p{L}]+){0,4} (?:tro lai|binh thuong)|het bi nhap|tinh lai|voice returned|no longer possessed)\b/u;
const ghostName = /\b(?:vong|co hon|hon ma|linh hon|ma quy|ghost|spirit|demon)\b/u;
const lastMatch = (pattern: RegExp, text: string) => [...text.matchAll(new RegExp(pattern.source, "gu"))].at(-1)?.index ?? -1;

/** Keep the visible speaker stable; an explicit borrowed voice may use another cast voice. */
export const resolveMotionVoiceSources = (beats: MotionVoicePlan["beats"], script: MotionStoryScript, analysis: MotionStoryAnalysis | null): MotionVoicePlan["beats"] => {
  const cast = analysis?.cast || [];
  const sources = cast.filter((member) => ghostName.test(normalized(member.name + " " + member.key.replaceAll("_", " "))));
  const states = new Map<string, string>();
  let previousChapter: string | undefined;
  return beats.map((row, index) => {
    const beat = script.beats[index];
    if (previousChapter !== beat.chapterId) states.clear();
    previousChapter = beat.chapterId;
    const manual = script.voiceSettings?.utterances?.[beat.id];
    // Never infer a fictional possession in documentary/explainer content.
    const automatic = !manual && !(analysis?.factual || analysis?.videoDna?.format?.factual);
    return { ...row, utterances: row.utterances.map((line) => {
      if (line.role === "narration" || line.role === "thought" || script.voiceSettings?.voices?.[line.speaker]) return line;
      if (!automatic) return line;
      const member = cast.find((item) => item.key === line.speaker);
      const offset = beat.narration.indexOf(line.text);
      const before = beat.narration.slice(0, offset < 0 ? 0 : offset);
      const preceding = index && script.beats[index - 1].chapterId === beat.chapterId ? script.beats[index - 1].narration : "";
      const evidence = normalized((preceding + " " + before).slice(-700));
      const identity = normalized([member?.description, member?.role].join(" "));
      // Current explicit restoration wins over older descriptions.
      const changeAt = lastMatch(borrowed, evidence);
      if (lastMatch(restored, evidence) > changeAt) { states.delete(line.speaker); const { voiceSpeaker: _source, ...ordinary } = line; return ordinary; }
      if (line.voiceSpeaker && cast.some((item) => item.key === line.voiceSpeaker) && changeAt >= 0) { states.set(line.speaker, line.voiceSpeaker); return line; }
      const candidates = sources.filter((source) => source.key !== line.speaker);
      const named = candidates.filter((source) => containsName(evidence, source.name));
      const source = named.length === 1 ? named[0] : candidates.length === 1 ? candidates[0] : undefined;
      if (source && changeAt >= 0 && (borrowed.test(identity) || member && [member.name, member.key.replaceAll("_", " ")].some((name) => containsName(evidence, name)))) states.set(line.speaker, source.key);
      const voiceSpeaker = states.get(line.speaker);
      if (voiceSpeaker) return { ...line, voiceSpeaker };
      const { voiceSpeaker: _source, ...ordinary } = line;
      return ordinary;
    }) };
  });
};
