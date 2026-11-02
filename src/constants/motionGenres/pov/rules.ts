import { MOTION_GENRE_VOCABULARY as X } from "../vocabulary.js";
import { MOTION_GENRE_REVIEW as R } from "../../motionGenreReview.js";
import type { MotionGenreSpec } from "../types.js";
const S = X.SHOTS;
const V = X.VISUALS;
export const POV_RULES: Pick<MotionGenreSpec, "VOICE" | "GRAMMAR" | "OPENING" | "CLOSING" | "PLAN_FIELDS" | "REVIEW" | "EXPANSION_RULE" | "HOOKS"> = {
  VOICE: {
    frames: [],
    maxUnits: 24,
    detached: true,
    detachedIssue: "this line explains from outside; anchor it in what you (bạn) see, hear, feel, do or are told right now",
    longIssue: "shorten into two present-tense sentences the protagonist could think in the moment",
  },
  GRAMMAR: {
    shots: [S.POV, S.CLOSE, S.MEDIUM, S.WIDE, S.INSERT, S.OVER_SHOULDER],
    mix: { [S.POV]: 30, [S.CLOSE]: 25, [S.MEDIUM]: 20, [S.WIDE]: 15, [S.INSERT]: 10 },
    visuals: [V.SCENE, V.MAP, V.TITLE],
    devices: ["personal token"],
    rule:
      "PICTURE GRAMMAR (pov): each beat names in subject what you see from inside your own body. A body sensation, your hands, your weapon or tool, the ground under you is a pov beat (hands or held object at the bottom edge, no face of the protagonist). A companion speaking or reacting is a close or over_shoulder beat. Wide only when you look out over a battlefield, a column or a landscape. The personal token gets an insert beat when it changes state. A map beat is allowed only when the front or the journey moves. No beat shows the protagonist from the outside looking at the viewer.",
    sample:
      '{"narration":"Bạn siết chặt quai ba lô. Tay bạn vẫn run.","shot":"pov","subject":"hai bàn tay bạn trên quai ba lô ướt mưa","visual":"scene"} {"narration":"Người lính bên cạnh nhìn bạn, không nói gì.","shot":"close","subject":"gương mặt người lính bên cạnh dưới vành mũ sắt","visual":"scene"} {"narration":"Phía trước, bãi biển dài hút tầm mắt.","shot":"wide","subject":"bãi biển, khói, hàng rào kẽm gai nhìn từ cửa tàu","visual":"scene"}',
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
