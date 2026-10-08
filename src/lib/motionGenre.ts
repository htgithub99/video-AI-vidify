import _ from "lodash";
import { MOTION_GEN_PREAMBLE } from "../constants/motionGenPrompts.js";
import { MOTION_GENRE_DEFAULT, MOTION_GENRE_PART, MOTION_GENRE_PREAMBLE_BASE, MOTION_GENRE_TEXT, MOTION_GENRES, type MotionGenre } from "../constants/motionGenres.js";
import type { MotionStoryDna } from "../types/motionVideo.js";
export interface MotionGenreInfo {
  dna?: MotionStoryDna;
  genre?: string;
  genre2?: string;
  factual?: boolean;
}
export const findGenre = (id?: string): MotionGenre | undefined => _.find(MOTION_GENRES, { id });
export const genreOf = (a?: MotionGenreInfo | null): MotionGenre => findGenre(a?.genre) || findGenre(MOTION_GENRE_DEFAULT)!;
export const genrePreamble = (a: MotionGenreInfo | null | undefined, part: (typeof MOTION_GENRE_PART)[keyof typeof MOTION_GENRE_PART]): string => {
  const g = findGenre(a?.genre);
  if (!g) return MOTION_GEN_PREAMBLE;
  const factual = _.isBoolean(a?.factual) ? a!.factual : g.factual;
  const frame = factual ? MOTION_GENRE_TEXT.FACTUAL(g.label.en) : MOTION_GENRE_TEXT.FICTION(g.label.en);
  const g2 = findGenre(a?.genre2);
  const extra = part === MOTION_GENRE_PART.VISUAL ? MOTION_GENRE_TEXT.VISUAL(g) + (g2 ? MOTION_GENRE_TEXT.SECOND_VISUAL(g2) : "") : part === MOTION_GENRE_PART.STORY ? MOTION_GENRE_TEXT.STORY(g) + (g2 ? MOTION_GENRE_TEXT.SECOND_STORY(g2) : "") : "";
  return MOTION_GENRE_PREAMBLE_BASE + frame + extra + (a?.dna && part !== MOTION_GENRE_PART.NONE ? MOTION_GENRE_TEXT.DNA(a.dna) : "");
};
export const analysisPreamble = (): string => MOTION_GENRE_PREAMBLE_BASE + MOTION_GENRE_TEXT.NEUTRAL;
