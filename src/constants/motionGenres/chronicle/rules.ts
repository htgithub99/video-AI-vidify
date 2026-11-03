import { MOTION_GENRE_VOCABULARY as X } from "../vocabulary.js";
import { MOTION_GENRE_REVIEW as R } from "../../motionGenreReview.js";
import type { MotionGenreSpec } from "../types.js";
const S = X.SHOTS;
const V = X.VISUALS;
export const CHRONICLE_RULES: Pick<MotionGenreSpec, "VOICE" | "GRAMMAR" | "OPENING" | "CLOSING" | "PLAN_FIELDS" | "REVIEW" | "EXPANSION_RULE" | "HOOKS" | "DIALOGUE" | "TEXTURE" | "CONTRACT"> = {
  DIALOGUE: { minLines: 1, skipProtagonist: true, needsSourceQuotes: true },
  TEXTURE: "everyday life of the era (an object, a price, a street, a job), a plain comparison that makes a number tangible, the place where it happened",
  CONTRACT: {
    voice: "a fast overview narrator; one milestone per sentence, dates and names exact",
    opening: "the promise of the whole sweep and the first milestone",
    spine: "milestones in time order, a card when the era changes",
    devices: "year and name cards, maps of the moving front or territory",
    closing: "the consequence and the last milestone",
  },
  VOICE: {
    frames: [],
    maxUnits: 26,
    longIssue: "cut into two brisk sentences, each carrying one date, name or number",
  },
  GRAMMAR: {
    shots: [S.WIDE, S.MEDIUM, S.MEDIUM_CLOSE, S.CLOSE, S.INSERT, S.ESTABLISHING, S.AERIAL],
    mix: { [S.WIDE]: 30, [S.MEDIUM]: 20, [S.MEDIUM_CLOSE]: 10, [V.MAP]: 15, [V.TIMELINE]: 15, [S.CLOSE]: 10 },
    visuals: [V.SCENE, V.MAP, V.TIMELINE, V.CHAPTER, V.STATS, V.TITLE],
    devices: ["map", "year card", "organisation chart"],
    rule:
      "PICTURE GRAMMAR (chronicle): each beat names in subject the one dated thing on screen. A new era opens with a chapter or timeline beat carrying the year. A real figure appearing for the first time gets a medium or close beat that shows the iconic traits in the cast look. A change of region or front is a map beat. Numbers that compare (budgets, agents, divisions) are a stats beat. Wide for institutions, parades, cities; insert for documents, seals, weapons, devices. No beat shows a narrator or a figure addressing the viewer.",
    sample:
      '{"narration":"Nineteen fifty-four. The agency is born from the ashes of its predecessor.","shot":"medium","subject":"year card nineteen fifty-four over the new headquarters","visual":"chapter"} {"narration":"Its first chairman wears the uniform he will never take off.","shot":"close","subject":"the chairman in uniform, iconic traits from the cast look","visual":"scene"} {"narration":"From Berlin to Havana, the network spreads.","shot":"wide","subject":"map with the two cities linked by a red line","visual":"map"}',
  },
  OPENING: { kinds: "a flash-forward of two or three beats at a late dramatic moment, then one beat that turns back to the beginning with its year", maxBeats: 4 },
  CLOSING: { kinds: "the latest documented milestone and one consequence sentence; no moral", maxBeats: 3 },
  PLAN_FIELDS: ["purpose", "startState", "endState", "events"],
  EXPANSION_RULE: "stretch an era by translating each big number into an everyday scale the viewer can picture, by one sentence of geography the source supplies, and by naming who was there when a date is given; keep every sentence anchored to a date, name or number.",
  HOOKS: {
    light: "RETENTION (light): open every era with a flash of its ending in one line, then the year card; close the loop before the era ends. Every twelve beats or so, break the flow with a map, a year card or a stats beat. The final era returns to the cold-open moment with its new meaning.",
    full: "RETENTION (full): everything in the light level, plus one 'what almost nobody notices' beat per era drawn from a secondary detail in the source, one everyday-scale comparison per big number, and at most one question to the viewer per chapter.",
  },
  REVIEW: { ...R.DEFAULT, retell: true, crossChapter: true, experts: true },
};
