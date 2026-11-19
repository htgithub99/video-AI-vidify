import type { ReupCommentaryEnding, ReupCommentaryHook, ReupCommentaryVoice } from "../types/reup.js";
export const REUP_COMMENTARY = {
  VOICES: {
    expert: "Narrator: a seasoned practitioner. Explain what is being done, why it works, and what a beginner would get wrong.",
    storyteller: "Narrator: a warm storyteller. Follow the effort as a story with stakes, small setbacks and the payoff.",
    analyst: "Narrator: a calm analyst. Weigh the choices on screen (materials, order of work, trade-offs) and say what is smart or risky.",
    curious: "Narrator: a curious guide. Every body section asks the question the viewer is thinking, then answers it from what the footage shows and general know-how.",
    wry: "Narrator: light, dry humour. At least one playful aside per section about the effort or a setback, never mocking the person, still informative.",
    coach: "Narrator: a practical coach. Every section ends with a tip the viewer could use (what to prepare, what to watch for).",
  } satisfies Record<ReupCommentaryVoice, string>,
  HOOKS: {
    result: "Opening: the finished result first, then jump back to the empty start.",
    question: "Opening: one sharp question this video answers.",
    contrast: "Opening: the contrast between the 'before' state and what it becomes.",
    stakes: "Opening: what could go wrong here (weather, terrain, tools, time) and why it is hard.",
    tease: "Opening: one surprising moment from the middle, not explained yet.",
  } satisfies Record<ReupCommentaryHook, string>,
  ENDINGS: { question: "Ending: one question to the viewer that invites a comment.", lesson: "Ending: the one practical lesson from this work.", reflection: "Ending: a short reflection on the effort and the result.", next: "Ending: tease what could come next, without promising anything specific." } satisfies Record<ReupCommentaryEnding, string>,
  HISTORY: 8,
} as const;
export const REUP_COMMENTARY_VOICES = Object.keys(REUP_COMMENTARY.VOICES) as ReupCommentaryVoice[];
export const REUP_COMMENTARY_HOOKS = Object.keys(REUP_COMMENTARY.HOOKS) as ReupCommentaryHook[];
export const REUP_COMMENTARY_ENDINGS = Object.keys(REUP_COMMENTARY.ENDINGS) as ReupCommentaryEnding[];
