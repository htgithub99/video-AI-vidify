import { MOTION_GENRE_VOCABULARY as X } from "../vocabulary.js";
import { MOTION_GENRE_REVIEW as R } from "../../motionGenreReview.js";
import type { MotionGenreSpec } from "../types.js";
const S = X.SHOTS;
const V = X.VISUALS;
export const VERDICT_RULES: Pick<MotionGenreSpec, "VOICE" | "GRAMMAR" | "OPENING" | "CLOSING" | "PLAN_FIELDS" | "REVIEW" | "EXPANSION_RULE" | "HOOKS" | "DIALOGUE" | "TEXTURE" | "STYLE_BRIEF" | "CONTRACT"> = {
  DIALOGUE: { minLines: 1, skipProtagonist: true, needsSourceQuotes: true },
  TEXTURE: "1) a fair counter-argument for the candidate; 2) a concrete piece of evidence already in the source; 3) a one-line question to the viewer about the criterion; 4) a plain comparison between two candidates on the same criterion; 5) what a contemporary said, only if the source quotes it",
  STYLE_BRIEF: "VERDICT: a presenter weighing candidates against stated criteria, addressing the viewer with questions and bets. Each candidate gets its case, a fair counter-argument and a verdict line. Evidence only from the source; quotes only when the source quotes them. Returns to the common criterion every chapter; the final chapter ranks and decides.",
  CONTRACT: {
    voice: "a host who asks one question and weighs every candidate fairly on one criterion",
    opening: "the question and what is at stake in the very first line",
    spine: "the question, the criterion, at least three candidates each weighed on the criterion, the verdict",
    devices: "the common criterion and candidate labels; physical comparison props are optional",
    closing: "the verdict and the reason for it",
  },
  VOICE: { frames: [], maxUnits: 28, longIssue: "split so that each sentence makes one claim or one piece of evidence" },
  GRAMMAR: {
    shots: [S.MEDIUM, S.MEDIUM_CLOSE, S.CLOSE, S.WIDE, S.INSERT, S.ESTABLISHING, S.AERIAL],
    mix: { [S.MEDIUM]: 30, [S.MEDIUM_CLOSE]: 15, [S.CLOSE]: 15, [S.WIDE]: 25, [V.MAP]: 15 },
    visuals: [V.SCENE, V.VERDICT, V.SCOREBOARD, V.MAP, V.QUOTE, V.TITLE],
    devices: ["source evidence", "candidate comparison"],
    rule: "PICTURE GRAMMAR (verdict): each beat names in subject the one thing on screen. Questions, criteria and judgments can show the relevant source event, people or evidence as scene beats. Neither a verdict prop nor a scoreboard is mandatory. Use these visual devices only when they help the actual subject or the user asks for them. A map beat when geography is the argument. Close for a decision on one face; wide for armies, fleets, cities.",
    picture: "each candidate is assessed by the same criterion; show its people, events and evidence, and the decisive element the narration argues about",
    sample:
      '{"narration":"So the question stands: which of these actually turned the war?","shot":"medium","subject":"the contested river crossing and its two opposing forces","visual":"scene"} {"narration":"On the plain, five thousand men wait in the heat.","shot":"wide","subject":"the Roman line on the dusty plain","visual":"scene"} {"narration":"Decisive, then. But only because the fleet never came.","shot":"medium","subject":"the empty harbor where the expected fleet never arrived","visual":"scene"}',
  },
  OPENING: { kinds: "the big question and what is at stake, within the first three beats; the criterion stated once", maxBeats: 8 },
  CLOSING: { kinds: "recap each candidate and label in narration, then give the answer in plain words; the picture follows the source", maxBeats: 6 },
  PLAN_FIELDS: ["purpose", "startState", "endState", "events", "candidate", "verdictLabel", "evidence", "limitation"],
  EXPANSION_RULE: "stretch a candidate by restating the common criterion, giving one fair counter-argument from the source, comparing it to the previous candidate using the common criterion, and weighing in two short sentences; no new numbers.",
  HOOKS: {
    light: "RETENTION (light): open every candidate chapter with the question of that chapter stated as a bet, close with the approved label. Vary shots as the source allows. The finale recaps the evidence and the last line returns to the question or verdict. No mandatory comparison prop or scoreboard.",
    full: "RETENTION (full): everything in the light level, plus the narrator's own bet stated once in the opening and confirmed or overturned in the finale, at most one question to the viewer per chapter, one everyday-scale comparison per big number, and a three-fragment tension recap before the final weighing.",
  },
  REVIEW: { ...R.DEFAULT, retell: true, crossChapter: true, experts: true, labels: true },
};
