import { MOTION_WRITING as W } from "../constants/motionWriting.js";
import { MOTION_SPOKEN_NUMBERS as N } from "../constants/motionSpokenNumbers.js";
import { stringifyJson } from "./jsonStringify.js";
import { motionVideoGenre } from "../constants/motionGenre.js";
import { motionGenreChapterWriting, motionGenreWritingPlan } from "./motionGenres/autofix.js";
import type { MotionBeat, MotionChapter, MotionStoryAnalysis, MotionWritingChapter, MotionWritingPlan } from "../types/motionVideo.js";
export const motionWritingChapterCount = (seconds: number, genre: unknown): number => Math.max(W.CHAPTERS.GENRE_MIN[motionVideoGenre(genre)] || W.CHAPTERS.MIN, Math.min(W.CHAPTERS.MAX, Math.round(seconds / W.CHAPTERS.SECONDS)));
export const motionWritingReviewAnchors = (analysis: Partial<Pick<MotionStoryAnalysis, "motifs" | "cast" | "places">>): string[] => [
  ...(analysis.motifs || []),
  [
    W.REVIEW_ANCHORS,
    ...N.EN,
    ...N.TENS,
    ...N.ORDINAL,
    ...N.ORDINAL.filter(Boolean).map((word) => word + "'s"),
    ...N.MONTHS,
    ...N.VI,
    ...N.SCALES.en,
    ...N.SCALES.vi,
    N.HUNDRED.en,
    N.HUNDRED.vi,
    N.TEN,
    N.TENS_VI,
    N.ZERO_VI,
    N.ONE_VI,
    N.FIVE_VI,
    ...(analysis.cast || []).flatMap((member) => [member.name, member.name + "'s", member.alias || ""]),
    ...(analysis.places || []).map((place) => place.name),
  ].join(" "),
];
const text = (value: unknown, limit = 500): string => (typeof value === "string" ? value.trim().slice(0, limit) : "");
export const normalizeMotionWritingPlan = (raw: any): MotionWritingPlan | undefined => (raw && typeof raw === "object" && !Array.isArray(raw) ? { question: text(raw.question), criterion: text(raw.criterion), device: text(raw.device, 100), labels: Array.isArray(raw.labels) ? ([...new Set(raw.labels.map((item: unknown) => text(item, 80)).filter(Boolean))] as string[]) : [] } : undefined);
export const normalizeMotionWritingChapter = (raw: any): MotionWritingChapter | undefined =>
  raw && typeof raw === "object" && !Array.isArray(raw)
    ? {
        purpose: text(raw.purpose),
        startState: text(raw.startState),
        endState: text(raw.endState),
        events: Array.isArray(raw.events) ? raw.events.filter((item: any) => item && text(item.id) && text(item.point)).map((item: any) => ({ id: text(item.id, 80), point: text(item.point), quote: text(item.quote, 250) })) : [],
        candidate: text(raw.candidate),
        verdictLabel: text(raw.verdictLabel, 80),
        evidence: text(raw.evidence),
        limitation: text(raw.limitation),
      }
    : undefined;
export const motionWritingBiblePrompt = (analysis: MotionStoryAnalysis): string =>
  [
    W.BIBLE_LIMITS,
    analysis.factual ? W.FACTUAL : "",
    W.NUMBERS,
    analysis.writingPlan ? W.CHAPTER + stringifyJson({ plan: motionGenreWritingPlan(analysis) }) : "",
    motionVideoGenre(analysis.videoGenre) === "verdict" ? W.LABELS : "",
  ]
    .filter(Boolean)
    .join("\n");
export const motionWritingChapterLean = (analysis: MotionStoryAnalysis, chapter: MotionChapter): string => (chapter.writing ? W.CHAPTER + stringifyJson({ chapter: motionGenreChapterWriting(analysis, chapter.writing) }) : "");
export const motionWritingProtectedMotifs = (analysis: MotionStoryAnalysis): string[] => (motionVideoGenre(analysis.videoGenre) === "verdict" ? [] : analysis.motifs || []);
export const motionWritingState = (beats: MotionBeat[], analysis: MotionStoryAnalysis): string => stringifyJson(analysis.chapters.filter((chapter) => beats.some((beat) => beat.chapterId === chapter.id)).map((chapter) => ({ chapter: chapter.id, state: chapter.writing?.endState, events: chapter.writing?.events })));
