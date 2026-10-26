import { MOTION_STORYBOARD as S } from "../constants/motionStoryboard.js";
import { PUPPET as P } from "../constants/motionPuppet.js";
import { MOTION_ILLUSTRATION as I } from "../constants/motionIllustration.js";
import { collectPuppetLines, puppetBeatLines, puppetVisualInputKey, type PuppetLine } from "./motionPuppet.js";
import type { PuppetGen, PuppetStoryboard, PuppetVisualSource } from "../types/motionPuppet.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript } from "../types/motionVideo.js";
export const puppetWords = (text: string): { key: string; start: number; end: number }[] => Array.from(text.matchAll(S.WORD_RE), (match) => ({ key: match[0].normalize(P.NFC).toLowerCase(), start: match.index!, end: match.index! + match[0].length }));
export const puppetSourceText = (line: PuppetLine, range: Pick<PuppetVisualSource, "from" | "to">): string => {
  const words = puppetWords(line.text);
  if (!words[range.from] || range.to <= range.from || range.to > words.length) return P.EMPTY;
  return line.text.slice(range.from === 0 ? 0 : words[range.from].start, range.to === words.length ? line.text.length : words[range.to].start).trim();
};
export const puppetStoryboardProfile = (analysis: MotionStoryAnalysis) => ({ style: analysis.stylePreset, illustrationVersion: I.VERSION, genre: analysis.videoGenre, format: analysis.videoDna?.format, editing: analysis.videoDna?.editDna, cinematography: analysis.videoDna?.cinematography });
export const puppetStoryboardInputKey = (lines: PuppetLine[], analysis: MotionStoryAnalysis): string => puppetVisualInputKey([{ text: JSON.stringify([puppetVisualInputKey(lines), puppetStoryboardProfile(analysis), analysis.cast, analysis.places, analysis.illustrationNeeds]) } as PuppetLine]);
export const puppetStoryboardCovers = (storyboard: PuppetStoryboard | undefined, lines: PuppetLine[]): boolean => {
  if (!storyboard || storyboard.version !== S.VERSION || !Array.isArray(storyboard.units) || (!storyboard.units.length && lines.length)) return false;
  const expected = lines.flatMap((line) => puppetWords(line.text).map((_word, index) => [line.key, index].join(P.VARIANT_SEP)));
  const actual: string[] = [];
  const names = new Set<string>();
  const sources = new Map(lines.map((line) => [line.key, line]));
  for (const unit of storyboard.units) {
    if (!unit || typeof unit.key !== "string" || !unit.key || names.has(unit.key) || typeof unit.scene !== "string" || !unit.scene || !S.PURPOSES.includes(unit.purpose) || typeof unit.show !== "string" || !unit.show.trim() || !Array.isArray(unit.sources) || !unit.sources.length) return false;
    names.add(unit.key);
    for (const range of unit.sources) {
      if (!range) return false;
      const line = sources.get(range.line);
      if (!line || !Number.isInteger(range.from) || !Number.isInteger(range.to) || range.from < 0 || range.to <= range.from || range.to > puppetWords(line.text).length) return false;
      for (let word = range.from; word < range.to; word++) actual.push([range.line, word].join(P.VARIANT_SEP));
    }
  }
  return expected.length === actual.length && expected.every((key, index) => key === actual[index]);
};
export const puppetVisualLines = (source: PuppetLine[], storyboard: PuppetStoryboard): PuppetLine[] => {
  const byKey = new Map(source.map((line) => [line.key, line]));
  return storyboard.units.flatMap((unit) => {
    const ranges = unit.sources.filter((range) => byKey.has(range.line));
    const first = byKey.get(ranges[0]?.line);
    if (!first) return [];
    const sources = ranges.map((range) => byKey.get(range.line)!);
    const speakers = [...new Set(sources.flatMap((line) => (line.speaker ? [line.speaker] : [])))];
    return [
      {
        ...first,
        key: unit.key,
        text: ranges.map((range) => puppetSourceText(byKey.get(range.line)!, range)).join(P.SPACE),
        cast: [...new Set(sources.flatMap((line) => line.cast))],
        speaker: sources.every((line) => line.speaker === first.speaker) ? first.speaker : undefined,
        speakers,
        visualUnit: unit,
        sourcePlans: [...new Map(sources.map((line) => [line.beatId, { beatId: line.beatId, place: line.place, time: line.time, action: line.action, scenePlan: line.scenePlan }])).values()],
      },
    ];
  });
};
export const collectPuppetVisualLines = (script: MotionStoryScript, sceneVisual: string): PuppetLine[] => {
  const lines = collectPuppetLines(script, sceneVisual);
  const plan = script.gen?.puppet?.storyboard;
  return puppetStoryboardCovers(plan, lines) ? puppetVisualLines(lines, plan!) : lines;
};
export const puppetBeatVisualLines = (beat: MotionBeat, gen?: PuppetGen): PuppetLine[] => {
  const lines = puppetBeatLines(beat, gen?.narratorKey);
  return gen?.storyboard ? puppetVisualLines(lines, gen.storyboard) : lines;
};
