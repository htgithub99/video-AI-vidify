import { MOTION_GENRE_VOCABULARY as X } from "../vocabulary.js";
import { MOTION_GENRE_REVIEW as R } from "../../motionGenreReview.js";
import type { MotionGenreSpec } from "../types.js";
const S = X.SHOTS;
const V = X.VISUALS;
const F = X.FRAMES;
export const WITNESS_RULES: Pick<MotionGenreSpec, "VOICE" | "GRAMMAR" | "OPENING" | "CLOSING" | "PLAN_FIELDS" | "REVIEW" | "EXPANSION_RULE" | "HOOKS"> = {
  VOICE: {
    frames: [F.LIVED, F.TOLD, F.HINDSIGHT],
    maxUnits: 16,
    perceptionFrame: true,
    toldIssue: "this beat retells an older tale the narrator only heard; drop the 'tôi thấy / tôi nghe' framing and tell it in the third person as it was told, or open once with who told it",
    hindsightIssue: "only one 'sau này tôi mới biết' hindsight line is allowed per chapter; keep this beat in the moment or return \"drop\": true if it only repeats a later reveal",
    longIssue: "split this into short spoken sentences of five to fourteen syllables, one idea each, as the narrator would say them aloud",
  },
  GRAMMAR: {
    shots: [S.CLOSE, S.MEDIUM, S.INSERT, S.ESTABLISHING, S.WIDE, S.OVER_SHOULDER],
    mix: { [S.CLOSE]: 30, [S.MEDIUM]: 25, [S.INSERT]: 15, [S.ESTABLISHING]: 15, [S.WIDE]: 15 },
    visuals: [V.SCENE, V.TITLE, V.QUOTE],
    devices: ["household object", "taboo object", "lingering detail"],
    rule:
      "PICTURE GRAMMAR (witness): each beat names in subject the one thing the viewer sees for that sentence. A change of place or hour opens with an establishing beat without people. Fear, a taboo being spoken or a loss is a close beat on one face. A household or taboo object (bowl, well bucket, bead string, oil jar, lamp) gets its own insert beat when the narrator names it. Two people talking use medium or over_shoulder. Wide only for a whole village, river or crowd. A frame=told beat shows the people of that older tale in the third person; the narrator is never drawn into a tale they only heard. Each chapter has at least two insert or object-centred beats.",
    sample:
      '{"narration":"Bà tôi bảo: \\"Từ giờ đến rằm, đừng ai kéo nước sau giờ Dậu.\\"","frame":"lived","shot":"close","subject":"bà tôi nói, mắt nhìn ra giếng","visual":"scene"} {"narration":"Đêm thứ hai, tôi nghe tiếng gàu chạm thành giếng.","frame":"lived","shot":"insert","subject":"cái gàu tre treo trên thành giếng trong bóng tối","visual":"scene"} {"narration":"Các cụ kể, năm ấy có hai anh em ngoài cồn hoang.","frame":"told","shot":"establishing","subject":"cồn đất giữa sình lầy, cây cầu tre","visual":"scene"}',
  },
  OPENING: { kinds: "a loss already suffered by the narrator's people, or the taboo spoken aloud by the one who knows; never scenery or background explanation", maxBeats: 6 },
  CLOSING: { kinds: "the latest documented outcome and one small lingering detail the narrator still sees or touches; no moral lesson, no summary", maxBeats: 4 },
  PLAN_FIELDS: ["purpose", "startState", "endState", "events"],
  EXPANSION_RULE: "stretch a moment through the narrator's body (breath, hands, cold, a held tongue), the household objects in reach, the hour and weather, and the same sign returning a little closer each time; pair short mirrored sentences; let an elder's rule be spoken once and recalled once.",
  HOOKS: {
    light: "RETENTION (light): open every chapter except the last with one beat that names something the narrator will only understand later in this same chapter, in plain words, without giving the outcome; close that loop inside the chapter. Every twelve beats or so, break the flow with an insert of an object, a place without people or the elder's words. In the last four beats, bring back the first object or saying with its new meaning.",
    full: "RETENTION (full): everything in the light level, plus one beat right before the climax that lists in three to five short fragments what the narrator already knows; no questions to the audience in this genre.",
  },
  REVIEW: { ...R.DEFAULT, retell: true, hindsight: true },
};
