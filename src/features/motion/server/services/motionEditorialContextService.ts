import { stringifyJson } from "../../../../lib/jsonStringify.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript, MotionStorySource } from "../../../../types/motionVideo.js";
import { MOTION_EDITORIAL as E } from "../../../../constants/motionEditorial.js";
export const motionEditorialContext = (source: MotionStorySource, analysis?: MotionStoryAnalysis, script?: MotionStoryScript, beats?: MotionBeat[], language?: string): string =>
  stringifyJson({
    source: { title: source.title, kind: source.kind, url: source.url, notes: source.notes },
    analysis: analysis ? { title: analysis.title, logline: analysis.logline, cast: analysis.cast?.map(({ key, name, appearanceOf, gender, age }) => ({ key, name, appearanceOf, gender, age })), places: analysis.places?.map(({ key, name, interior, time }) => ({ key, name, interior, time })), chapters: analysis.chapters?.map(({ id, title }) => ({ id, title })) } : undefined,
    continuity: (script?.beats || beats || []).slice(-E.CONTINUITY_BEATS).map(({ id, chapterId, cast, place }) => ({ id, chapterId, cast, place })),
    language,
  });
