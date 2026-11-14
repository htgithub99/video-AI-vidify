import { MOTION_GENRE_VOCABULARY as X } from "../vocabulary.js";
import { MOTION_GENRE_REVIEW as R } from "../../motionGenreReview.js";
import type { MotionGenreSpec } from "../types.js";
const S = X.SHOTS;
const V = X.VISUALS;
const F = X.FRAMES;
export const WITNESS_RULES: Pick<MotionGenreSpec, "VOICE" | "GRAMMAR" | "OPENING" | "CLOSING" | "PLAN_FIELDS" | "REVIEW" | "EXPANSION_RULE" | "HOOKS" | "DIALOGUE" | "TEXTURE" | "STYLE_BRIEF" | "CONTRACT"> = {
  DIALOGUE: { minLines: 1, skipProtagonist: true, needsSourceQuotes: false },
  TEXTURE: "1) the narrator's own body and fear; 2) an ordinary household chore or object of that day; 3) a small sign that something is off (a sound, a smell, a light); 4) what a neighbour or elder whispered, with who said it; 5) the hour and the weather around the house; 6) a short question-and-answer between two people",
  STYLE_BRIEF:
    'WITNESS: the narrator is an ordinary person inside the events, speaking as "tôi/I" in plain village words, sentences of five to fourteen syllables. Fear is shown through the narrator\'s body and the house: a sound, a smell, an object out of place. Elders set a rule or taboo early and it has a consequence later. Short question-and-answer exchanges. What the narrator only heard is told as hearsay with who told it. No sermon, no summary of the moral.',
  CONTRACT: {
    voice: "first person (t\u00f4i / I); the narrator is the one who loses and is inside every event; plain spoken words; sentences of five to fourteen syllables, one idea each",
    opening: "a bare fact or number about the narrator's own family, then its consequence",
    spine: "the loss, signs growing closer, someone who explains and sets a rule, a calm that does not last, the broken rule, the climax, the price, a time jump telling what became of each person",
    devices: "a rule or taboo set early that has a consequence later; short question-and-answer exchanges; repetition that comes closer each time",
    closing: "one haunting detail and a concrete action; no lesson",
  },
  VOICE: {
    frames: [F.LIVED, F.TOLD, F.HINDSIGHT],
    maxUnits: 16,
    perceptionFrame: true,
    toldIssue: "this beat retells an older tale the narrator only heard; drop the 'tôi thấy / tôi nghe' framing and tell it in the third person as it was told, or open once with who told it",
    hindsightIssue: "only one 'sau này tôi mới biết' hindsight line is allowed per chapter; keep this beat in the moment or return \"drop\": true if it only repeats a later reveal",
    longIssue: "split this into short spoken sentences of five to fourteen syllables, one idea each, as the narrator would say them aloud",
  },
  GRAMMAR: {
    shots: [S.CLOSE, S.MEDIUM_CLOSE, S.MEDIUM, S.INSERT, S.ESTABLISHING, S.WIDE, S.OVER_SHOULDER],
    mix: { [S.CLOSE]: 20, [S.MEDIUM_CLOSE]: 15, [S.MEDIUM]: 20, [S.INSERT]: 15, [S.ESTABLISHING]: 15, [S.WIDE]: 15 },
    visuals: [V.SCENE, V.TITLE, V.QUOTE],
    devices: ["household object", "taboo object", "lingering detail"],
    rule: "PICTURE GRAMMAR (witness): each beat names in subject the one thing the viewer sees for that sentence. A change of place or hour opens with an establishing beat without people. Fear, a taboo being spoken or a loss is a close beat on one face. A household or taboo object (bowl, well bucket, bead string, oil jar, lamp) gets its own insert beat when the narrator names it. Two people talking use medium or over_shoulder. Wide only for a whole village, river or crowd. A frame=told beat shows the people of that older tale in the third person; the narrator is never drawn into a tale they only heard. Each chapter has at least two insert or object-centred beats.",
    picture: "the narrator is the ordinary person the story names, seen from outside at the place where they stand; what they feel sits in faces and hands; what they only heard about is drawn where it happened (cutaway) or on a map, never with the narrator standing in it",
    sample:
      '{"narration":"Bà tôi bảo: \\"Từ giờ đến rằm, đừng ai kéo nước sau giờ Dậu.\\"","frame":"lived","shot":"close","subject":"bà tôi nói, mắt nhìn ra giếng","visual":"scene"} {"narration":"Đêm thứ hai, tôi nghe tiếng gàu chạm thành giếng.","frame":"lived","shot":"insert","subject":"cái gàu tre treo trên thành giếng trong bóng tối","visual":"scene"} {"narration":"Các cụ kể, năm ấy có hai anh em ngoài cồn hoang.","frame":"told","shot":"establishing","subject":"cồn đất giữa sình lầy, cây cầu tre","visual":"scene"}',
  },
  OPENING: { kinds: "a loss already suffered by the narrator's people, or the taboo spoken aloud by the one who knows; never scenery or background explanation", maxBeats: 6 },
  CLOSING: { kinds: "the latest documented outcome and one small lingering detail the narrator still sees or touches; no moral lesson, no summary", maxBeats: 4 },
  PLAN_FIELDS: ["purpose", "startState", "endState", "events"],
  EXPANSION_RULE: "stretch a moment through the narrator's body (breath, hands, cold, a held tongue), the household objects in reach, the hour and weather, and the same sign returning a little closer each time; pair short mirrored sentences; let an elder's rule be spoken once and recalled once.",
  HOOKS: {
    light:
      "RETENTION (light): open every chapter except the last with one beat that names something the narrator will only understand later in this same chapter, in plain words, without giving the outcome; close that loop inside the chapter. Every twelve beats or so, break the flow with an insert of an object, a place without people or the elder's words. In the last four beats, bring back the first object or saying with its new meaning.",
    full: "RETENTION (full): everything in the light level, plus one beat right before the climax that lists in three to five short fragments what the narrator already knows; no questions to the audience in this genre.",
  },
  REVIEW: { ...R.DEFAULT, retell: true, hindsight: true },
};
