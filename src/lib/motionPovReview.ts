import { MOTION_POV_REVIEW as R } from "../constants/motionPovReview.js";
import { motionVideoGenre } from "../constants/motionGenre.js";
import type { MotionBeat, MotionStoryAnalysis } from "../types/motionVideo.js";
export interface MotionPovFinding {
  id: string;
  issue: string;
}
const normalize = (text: string): string => (text.toLowerCase().match(R.WORD) || []).join(" ");
export const motionPovReviewFindings = (beats: MotionBeat[], analysis: Pick<MotionStoryAnalysis, "chapters" | "videoGenre"> & Partial<Pick<MotionStoryAnalysis, "motifs">>, language: string): { findings: MotionPovFinding[]; dropIds: Set<string>; dropRefs: Map<string, string> } => {
  const findings: MotionPovFinding[] = [];
  const dropIds = new Set<string>();
  const dropRefs = new Map<string, string>();
  if (motionVideoGenre(analysis.videoGenre) !== R.GENRE) return { findings, dropIds, dropRefs };
  const vi = R.VI.test(language.trim());
  const add = (id: string, issue: string, ref?: string) => {
    const known = findings.find((finding) => finding.id === id);
    if (!known) findings.push({ id, issue });
    else if (!known.issue.includes(issue)) known.issue += "; " + issue;
    if (ref && !dropIds.has(id)) {
      dropIds.add(id);
      dropRefs.set(id, ref);
    }
  };
  const spoken = beats.filter((beat) => beat.narration?.trim());
  const motifs = analysis.motifs || [];
  const motifWords = new Set(motifs.flatMap((motif) => motif.toLowerCase().match(R.WORD) || []));
  const min = R.RETELL.MIN_LENGTH[vi ? "vi" : "en"];
  const tokens = (text: string): Set<string> => {
    const list = (text.replace(R.QUOTE, " ").toLowerCase().match(R.WORD) || []).filter((word) => word.length >= min && !motifWords.has(word) && !R.STOP.test(word) && !R.MONTH.test(word) && !R.DIGIT.test(word));
    return new Set(vi ? list.slice(1).map((word, index) => list[index] + " " + word) : list.map((word) => word.slice(0, R.RETELL.STEM)));
  };
  const dated = (text: string): boolean => R.DIGIT.test(text) || R.MONTH.test(text);
  const sets = spoken.map((beat) => tokens(beat.narration));
  spoken.forEach((beat, index) => {
    for (let back = 1; back <= R.RETELL.DISTANCE && index - back >= 0; back++) {
      const before = spoken[index - back];
      if (before.chapterId !== beat.chapterId) break;
      const shared = [...sets[index]].filter((token) => sets[index - back].has(token)).length;
      const ratio = shared / Math.max(1, Math.min(sets[index].size, sets[index - back].size));
      const close = (shared >= R.RETELL.SHARED && ratio >= R.RETELL.RATIO) || ((dated(beat.narration) || dated(before.narration)) && shared >= R.RETELL.DATED_SHARED && ratio >= R.RETELL.DATED_RATIO);
      if (close) {
        add(beat.id, R.ISSUE.RETELL(before.id, before.narration.trim().slice(0, 80)), before.id);
        break;
      }
    }
    if (R.DIGIT.test(beat.narration.replace(R.QUOTE, " "))) add(beat.id, R.ISSUE.DIGITS(vi));
    if (R.COMMENTARY.test(beat.narration)) add(beat.id, R.ISSUE.COMMENTARY);
  });
  const jumps = spoken.filter((beat) => R.TIME_JUMP.test(beat.narration));
  for (const beat of jumps.slice(1)) add(beat.id, R.ISSUE.TIME_JUMP, jumps[0].id);
  const hindsight = spoken.filter((beat) => R.HINDSIGHT.test(beat.narration));
  for (const beat of hindsight.slice(1)) add(beat.id, R.ISSUE.HINDSIGHT);
  for (const refrain of motifs.filter((motif) => (motif.match(R.WORD) || []).length >= R.REFRAIN_WORDS)) {
    const exact = normalize(refrain);
    const uses = spoken.filter((beat) => normalize(beat.narration).includes(exact));
    for (const beat of uses.slice(1, -1)) add(beat.id, R.ISSUE.REFRAIN(refrain));
  }
  for (const chapter of analysis.chapters.filter((item) => item.stages?.includes(R.ORDEAL_STAGE))) {
    const lines = spoken.filter((beat) => beat.chapterId === chapter.id);
    if (lines.length && !lines.some((beat) => R.COUNT.test(beat.narration))) add(lines[Math.floor(lines.length / 2)].id, R.ISSUE.ORDEAL);
  }
  return { findings: [...findings.filter((finding) => dropIds.has(finding.id)), ...findings.filter((finding) => !dropIds.has(finding.id))], dropIds, dropRefs };
};
