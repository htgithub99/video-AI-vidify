import { MOTION_GENRE_VOCABULARY as X } from "../vocabulary.js";
import { MOTION_GENRE_REVIEW as R } from "../../motionGenreReview.js";
import type { MotionGenreSpec } from "../types.js";
const S = X.SHOTS;
const V = X.VISUALS;
export const VERDICT_RULES: Pick<MotionGenreSpec, "VOICE" | "GRAMMAR" | "OPENING" | "CLOSING" | "PLAN_FIELDS" | "REVIEW" | "EXPANSION_RULE" | "HOOKS"> = {
  VOICE: {
    frames: [],
    maxUnits: 28,
    longIssue: "split so that each sentence makes one claim or one piece of evidence",
  },
  GRAMMAR: {
    shots: [S.MEDIUM, S.CLOSE, S.WIDE, S.INSERT, S.ESTABLISHING, S.AERIAL],
    mix: { [S.MEDIUM]: 30, [V.VERDICT]: 20, [S.CLOSE]: 15, [S.WIDE]: 15, [V.SCOREBOARD]: 10, [V.MAP]: 10 },
    visuals: [V.SCENE, V.VERDICT, V.SCOREBOARD, V.MAP, V.QUOTE, V.TITLE],
    devices: ["comparison device", "candidate card", "scoreboard"],
    rule:
      "PICTURE GRAMMAR (verdict): each beat names in subject the one thing on screen. A beat that weighs, judges, asks the question or states the criterion is a verdict beat showing the recurring device (scale, stamp, ledger) with the candidate beside it, never a person staring at the viewer. Each candidate chapter has at least one verdict beat. Evidence is a scene beat with the real people and places. The finale has one scoreboard beat listing every candidate with its label. A map beat when geography is the argument. Close for a decision on one face; wide for armies, fleets, cities.",
    sample:
      '{"narration":"So the question stands: which of these actually turned the war?","shot":"medium","subject":"the brass scale, empty, under the question","visual":"verdict"} {"narration":"On the plain, five thousand men wait in the heat.","shot":"wide","subject":"the Roman line on the dusty plain","visual":"scene"} {"narration":"Decisive, then. But only because the fleet never came.","shot":"medium","subject":"the scale tipping with the candidate card and its label","visual":"verdict"}',
  },
  OPENING: { kinds: "the big question and what is at stake, within the first three beats; the criterion stated once", maxBeats: 8 },
  CLOSING: { kinds: "one scoreboard beat with every candidate and label, then the answer in plain words", maxBeats: 6 },
  PLAN_FIELDS: ["purpose", "startState", "endState", "events", "candidate", "verdictLabel", "evidence", "limitation"],
  EXPANSION_RULE: "stretch a candidate by restating the common criterion, giving one fair counter-argument from the source, comparing it to the previous candidate on the device, and weighing in two short sentences; no new numbers.",
  HOOKS: {
    light: "RETENTION (light): open every candidate chapter with the question of that chapter stated as a bet, close with the stamped label. Every twelve beats or so, break the flow with a verdict or map picture. The finale shows the scoreboard line by line and the last line returns to the device with new meaning.",
    full: "RETENTION (full): everything in the light level, plus the narrator's own bet stated once in the opening and confirmed or overturned in the finale, at most one question to the viewer per chapter, one everyday-scale comparison per big number, and a three-fragment tension recap before the final weighing.",
  },
  REVIEW: { ...R.DEFAULT, retell: true, crossChapter: true, experts: true, labels: true },
};
