import type { ReupCommentaryEnding, ReupCommentaryHook, ReupCommentaryVoice } from "../types/reup.js";
/**
 * Commentary styles a run can take (prompt lines for the script AI). Each run picks the least recently used voice,
 * opening and ending, so a channel's videos do not all follow one template (YouTube's "mass-produced" rule).
 */
export const REUP_COMMENTARY = {
  VOICES: {
    expert: "Narrator: a seasoned practitioner. Explain what is being done, why it works, and what a beginner would get wrong.",
    storyteller: "Narrator: a warm storyteller. Follow the effort as a story with stakes, small setbacks and the payoff.",
    analyst: "Narrator: a calm analyst. Weigh the choices on screen (materials, order of work, trade-offs) and say what is smart or risky.",
    curious: "Narrator: a curious guide. Ask the question the viewer is thinking, then answer it from what the footage shows and general know-how.",
    wry: "Narrator: light, dry humour. Playful asides about the effort and the setbacks, never mocking the person, still informative.",
    coach: "Narrator: a practical coach. Turn each stage into a tip the viewer could use (what to prepare, what to watch for).",
  } satisfies Record<ReupCommentaryVoice, string>,
  HOOKS: {
    result: "Opening: the finished result first, then jump back to the empty start.",
    question: "Opening: one sharp question this video answers.",
    contrast: "Opening: the contrast between the 'before' state and what it becomes.",
    stakes: "Opening: what could go wrong here (weather, terrain, tools, time) and why it is hard.",
    tease: "Opening: one surprising moment from the middle, not explained yet.",
  } satisfies Record<ReupCommentaryHook, string>,
  ENDINGS: {
    question: "Ending: one question to the viewer that invites a comment.",
    lesson: "Ending: the one practical lesson from this work.",
    reflection: "Ending: a short reflection on the effort and the result.",
    next: "Ending: tease what could come next, without promising anything specific.",
  } satisfies Record<ReupCommentaryEnding, string>,
  /** Runs looked back on when rotating styles and checking repetition. */
  HISTORY: 8,
} as const;
export const REUP_COMMENTARY_VOICES = Object.keys(REUP_COMMENTARY.VOICES) as ReupCommentaryVoice[];
export const REUP_COMMENTARY_HOOKS = Object.keys(REUP_COMMENTARY.HOOKS) as ReupCommentaryHook[];
export const REUP_COMMENTARY_ENDINGS = Object.keys(REUP_COMMENTARY.ENDINGS) as ReupCommentaryEnding[];
