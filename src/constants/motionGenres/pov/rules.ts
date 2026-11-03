import { MOTION_GENRE_VOCABULARY as X } from "../vocabulary.js";
import { MOTION_GENRE_REVIEW as R } from "../../motionGenreReview.js";
import type { MotionGenreSpec } from "../types.js";
const S = X.SHOTS;
const V = X.VISUALS;
export const POV_RULES: Pick<MotionGenreSpec, "VOICE" | "GRAMMAR" | "OPENING" | "CLOSING" | "PLAN_FIELDS" | "REVIEW" | "EXPANSION_RULE" | "HOOKS" | "DIALOGUE" | "TEXTURE" | "CONTRACT"> = {
  DIALOGUE: { minLines: 1, skipProtagonist: true, needsSourceQuotes: false },
  TEXTURE: "the body and senses inside the moment (breath, weight, cold, hands at work), the personal token, a companion's habit, joke or small promise",
  CONTRACT: {
    voice: "second person (you / b\u1ea1n), present tense, short plain sentences; feelings shown through the body and the senses; what you cannot witness reaches you as an order, news, a rumour or one hindsight line",
    opening: "your age, the exact place and moment, an ordinary task with two or three sensory details and a small plan; the change arrives only in a later line",
    spine: "ordinary life, the order or change, preparation told as lists, waiting, the ordeal told almost in real time, the grind as a rhythm of verbs, losing a companion, the end of the fighting, a return that no longer fits, years later closing with the token",
    devices: "one or two personal tokens with a refrain (full at first and last use, broken or changed in between); two or three companions, each with a habit, an object and a line of their own",
    closing: "a quiet present moment held one beat longer, the token and the refrain with a new meaning; no summary of what history records",
  },
  VOICE: {
    frames: [],
    maxUnits: 24,
    detached: true,
    detachedIssue: "this line explains from outside; anchor it in what you (bạn) see, hear, feel, do or are told right now",
    longIssue: "shorten into two present-tense sentences the protagonist could think in the moment",
  },
  GRAMMAR: {
    shots: [S.CLOSE, S.MEDIUM_CLOSE, S.MEDIUM, S.WIDE, S.INSERT, S.OVER_SHOULDER],
    mix: { [S.CLOSE]: 20, [S.MEDIUM_CLOSE]: 15, [S.MEDIUM]: 25, [S.WIDE]: 15, [S.INSERT]: 15, [S.OVER_SHOULDER]: 10 },
    visuals: [V.SCENE, V.MAP, V.TITLE],
    devices: ["personal token"],
    rule:
      "PICTURE GRAMMAR (pov): the narration speaks to you, the camera watches you from outside like a film. What you do, hold or feel is a medium or close beat of the protagonist (the cast member \"protagonist\") doing it, or an insert of the object in your hands seen from the side; a companion speaking or reacting is a close or over_shoulder beat; wide only when you stand inside a battlefield, a column or a landscape; the personal token gets an insert beat when it changes state; a map beat only when the front or the journey moves. Never a first-person camera through your own eyes.",
    sample:
      '{"narration":"Bạn siết chặt quai ba lô. Tay bạn vẫn run.","shot":"insert","subject":"hai bàn tay bạn trên quai ba lô ướt mưa, nhìn ngang","visual":"scene"} {"narration":"Người lính bên cạnh nhìn bạn, không nói gì.","shot":"close","subject":"gương mặt người lính bên cạnh dưới vành mũ sắt","visual":"scene"} {"narration":"Phía trước, bãi biển dài hút tầm mắt.","shot":"wide","subject":"bãi biển, khói, hàng rào kẽm gai nhìn từ cửa tàu","visual":"scene"}',
  },
  OPENING: { kinds: "a body sensation or an immediate order in the present tense; no historical summary", maxBeats: 6 },
  CLOSING: { kinds: "the present moment held one beat longer; no hindsight, no summary of what history records", maxBeats: 4 },
  PLAN_FIELDS: ["purpose", "startState", "endState", "events"],
  EXPANSION_RULE: "stretch a moment through the five senses, the weight of what you carry, a count of steps or breaths, an order cut short, and the token in your pocket changing state; stay in the present tense.",
  HOOKS: {
    light: "RETENTION (light): open every chapter except the last with one beat that points at what is about to happen to you in this chapter, without telling it; close that loop in the chapter. Every twelve beats or so, break the flow with a pov insert of your hands or token, or a short map beat when the front moves. In the last four beats, the token or refrain returns with its new meaning.",
    full: "RETENTION (full): everything in the light level, plus at most one question to the viewer per chapter ('what would you do'), one tension recap of three to five fragments right before the ordeal or climax, and at most one dramatic-irony line per chapter ('you do not know it yet, but') that only uses a source event.",
  },
  REVIEW: { ...R.DEFAULT, retell: true, timeJump: true, hindsight: true, commentary: true, refrain: true, ordeal: true, experts: true },
};
