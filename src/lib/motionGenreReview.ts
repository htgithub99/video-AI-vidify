import { MOTION_GENRE_REVIEW as R } from "../constants/motionGenreReview.js";
import { MOTION_WRITING as W } from "../constants/motionWriting.js";
import { motionOpeningTeaserIds } from "./motionStoryTimeline.js";
import { motionUnsupportedFigures } from "./motionWritingNumbers.js";
import { motionWritingReviewAnchors } from "./motionWriting.js";
import { motionGenreSpec } from "../constants/motionGenre.js";
import { motionLanguage } from "./motionLanguage.js";
import { MOTION_LANGUAGE_UNITS as U } from "../constants/motionLanguages/index.js";
import { MOTION_SPOKEN_NUMBERS as N } from "../constants/motionSpokenNumbers.js";
import type { MotionBeat, MotionStoryAnalysis } from "../types/motionVideo.js";
export interface MotionGenreReviewFinding {
  id: string;
  issue: string;
  kind?: "source" | "label" | "handoff" | "retell" | "speech" | "style";
}
const normalize = (text: string): string => (text.toLowerCase().match(R.WORD) || []).join(" ");
const tokenizer = (language: string, motifs: string[]) => {
  const vi = R.VI.test(language.trim());
  const min = R.RETELL.MIN_LENGTH[vi ? "vi" : "en"];
  const motifWords = new Set(motifs.flatMap((motif) => motif.toLowerCase().match(R.WORD) || []));
  return (text: string): Set<string> => {
    const list = (text.replace(R.QUOTE, " ").replace(U.CJK, " $& ").toLowerCase().match(R.WORD) || []).filter((word) => word.length >= min && !motifWords.has(word) && !R.STOP.test(word) && !R.MONTH.test(word) && !R.DIGIT.test(word));
    return new Set(vi ? list.slice(1).map((word, index) => list[index] + " " + word) : list.map((word) => word.slice(0, R.RETELL.STEM)));
  };
};
const overlap = (a: Set<string>, b: Set<string>): { shared: number; ratio: number } => {
  const shared = [...a].filter((token) => b.has(token)).length;
  return { shared, ratio: shared / Math.max(1, Math.min(a.size, b.size)) };
};
export const motionLineSimilarity = (a: string, b: string, language: string): number => {
  const tokens = tokenizer(language, []);
  return overlap(tokens(a), tokens(b)).ratio;
};
export const motionGenreReviewFindings = (beats: MotionBeat[], analysis: Pick<MotionStoryAnalysis, "chapters" | "videoGenre"> & Partial<Pick<MotionStoryAnalysis, "motifs" | "cast" | "places">>, language: string, sourceText = ""): { findings: MotionGenreReviewFinding[]; dropIds: Set<string>; dropRefs: Map<string, string> } => {
  const findings: MotionGenreReviewFinding[] = [];
  const dropIds = new Set<string>();
  const dropRefs = new Map<string, string>();
  const checks = motionGenreSpec(analysis.videoGenre).REVIEW;
  const vi = R.VI.test(language.trim());
  const add = (id: string, issue: string, ref?: string, kind: MotionGenreReviewFinding["kind"] = "retell") => {
    const known = findings.find((finding) => finding.id === id);
    if (!known) findings.push({ id, issue, kind });
    else {
      if (!known.issue.includes(issue)) known.issue += "; " + issue;
      if ((W.PRIORITY[kind || "style"] ?? 5) < (W.PRIORITY[known.kind || "style"] ?? 5)) known.kind = kind;
    }
    if (ref && !dropIds.has(id)) {
      dropIds.add(id);
      dropRefs.set(id, ref);
    }
  };
  const spoken = beats.filter((beat) => beat.narration?.trim());
  const teasers = motionOpeningTeaserIds(beats, analysis);
  const motifs = analysis.motifs || [];
  const tokens = tokenizer(language, motionWritingReviewAnchors(analysis));
  const sets = spoken.map((beat) => tokens(beat.narration));
  const dated = (text: string): boolean => R.DIGIT.test(text) || R.MONTH.test(text);
  const quote = (beat: MotionBeat): string => beat.narration.trim().slice(0, 80);
  const chapterIndex = new Map(analysis.chapters.map((chapter, index) => [chapter.id, index]));
  spoken.forEach((beat, index) => {
    const previous = spoken[index - 1];
    const duplicate = (other: MotionBeat): string | undefined => (normalize(other.narration) === normalize(beat.narration) ? other.id : undefined);
    if (previous && !teasers.has(previous.id) && previous.chapterId !== beat.chapterId && overlap(sets[index], sets[index - 1]).shared >= R.RETELL.SHARED && overlap(sets[index], sets[index - 1]).ratio >= R.RETELL.HANDOFF_RATIO) add(beat.id, R.ISSUE.HANDOFF(previous.id), duplicate(previous), "handoff");
    if (checks.retell)
      for (let back = 1; back <= R.RETELL.DISTANCE && index - back >= 0; back++) {
        const before = spoken[index - back];
        if (teasers.has(before.id)) continue;
        if (before.chapterId !== beat.chapterId) break;
        const { shared, ratio } = overlap(sets[index], sets[index - back]);
        if ((shared >= R.RETELL.SHARED && ratio >= R.RETELL.RATIO) || ((dated(beat.narration) || dated(before.narration)) && shared >= R.RETELL.DATED_SHARED && ratio >= R.RETELL.DATED_RATIO)) {
          add(beat.id, R.ISSUE.RETELL(before.id, quote(before)), duplicate(before));
          break;
        }
      }
    if (checks.crossChapter && !analysis.chapters.find((chapter) => chapter.id === beat.chapterId)?.stages?.includes("verdict")) {
      const own = chapterIndex.get(beat.chapterId) ?? 0;
      const earlier = spoken.findIndex(
        (other, at) =>
          at < index &&
          !teasers.has(other.id) &&
          chapterIndex.get(other.chapterId) === own - 1 &&
          (() => {
            const { shared, ratio } = overlap(sets[index], sets[at]);
            return shared >= R.RETELL.CROSS_SHARED && ratio >= R.RETELL.CROSS_RATIO;
          })(),
      );
      if (earlier >= 0) add(beat.id, R.ISSUE.CROSS(spoken[earlier].id, quote(spoken[earlier])), duplicate(spoken[earlier]));
    }
    if (checks.digits && motionLanguage(language).numbers === N.SPOKEN && R.DIGIT.test(beat.narration.replace(R.QUOTE, " "))) add(beat.id, R.ISSUE.DIGITS(vi), undefined, "speech");
    if (checks.commentary && R.COMMENTARY.test(beat.narration)) add(beat.id, R.ISSUE.COMMENTARY);
    if (checks.experts && sourceText && R.EXPERTS.test(beat.narration) && !R.EXPERTS.test(sourceText)) add(beat.id, R.ISSUE.EXPERTS, undefined, "source");
    if ((analysis as MotionStoryAnalysis).factual && sourceText) for (const figure of motionUnsupportedFigures(beat.narration, sourceText)) add(beat.id, W.FIGURES.ISSUE(figure), undefined, "source");
  });
  if (checks.timeJump) {
    const jumps = spoken.filter((beat) => R.TIME_JUMP.test(beat.narration));
    for (const beat of jumps.slice(1)) add(beat.id, R.ISSUE.TIME_JUMP, jumps[0].id);
  }
  if (checks.hindsight) for (const beat of spoken.filter((item) => R.HINDSIGHT.test(item.narration)).slice(1)) add(beat.id, R.ISSUE.HINDSIGHT);
  if (checks.refrain)
    for (const refrain of motifs.filter((motif) => (motif.match(R.WORD) || []).length >= R.REFRAIN_WORDS)) {
      const exact = normalize(refrain);
      const uses = spoken.filter((beat) => normalize(beat.narration).includes(exact));
      for (const beat of uses.slice(1, -1)) add(beat.id, R.ISSUE.REFRAIN(refrain));
    }
  if (checks.ordeal)
    for (const chapter of analysis.chapters.filter((item) => item.stages?.includes(R.ORDEAL_STAGE))) {
      const lines = spoken.filter((beat) => beat.chapterId === chapter.id);
      if (lines.length && !lines.some((beat) => R.COUNT.test(beat.narration))) add(lines[Math.floor(lines.length / 2)].id, R.ISSUE.ORDEAL);
    }
  if (checks.labels && ((analysis as MotionStoryAnalysis).writingPlan?.labels?.length || motifs.length > 1)) {
    const labels = ((analysis as MotionStoryAnalysis).writingPlan?.labels?.length ? (analysis as MotionStoryAnalysis).writingPlan!.labels : motifs.slice(1)).map((label) => ({ label, pattern: " " + normalize(label) + " " }));
    for (const chapter of analysis.chapters.filter((item) => item.stages?.includes(R.CANDIDATE_STAGE))) {
      const lines = spoken.filter((beat) => beat.chapterId === chapter.id);
      const asked = lines.map((beat) => R.QUESTION.test(beat.narration)).lastIndexOf(true);
      if (asked < 0) continue;
      const weighing = lines.slice(asked);
      const used = labels.filter((item) => weighing.some((beat) => (" " + normalize(beat.narration) + " ").includes(item.pattern)));
      const target = weighing.find((beat) => used.some((item) => (" " + normalize(beat.narration) + " ").includes(item.pattern)));
      if (used.length > 1 && target) add(target.id, R.ISSUE.LABELS(used.map((item) => item.label)), undefined, "label");
      const chosen = chapter.writing?.verdictLabel;
      if (chosen && weighing.length && (used.length !== 1 || normalize(used[0].label) !== normalize(chosen))) add((target || weighing[0]).id, R.ISSUE.EXPECTED_LABEL(chosen), undefined, "label");
    }
  }
  return { findings: [...findings.filter((finding) => dropIds.has(finding.id)), ...findings.filter((finding) => !dropIds.has(finding.id))], dropIds, dropRefs };
};
