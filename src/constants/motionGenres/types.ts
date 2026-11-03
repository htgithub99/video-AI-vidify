import type { MotionGenreReviewChecks } from "../motionGenreReview.js";
export interface MotionGenreStageSpec {
  RULE: string;
  SOLO?: boolean;
}
export interface MotionGenreVoiceSpec {
  frames: readonly string[];
  maxUnits: number;
  detached?: boolean;
  detachedIssue?: string;
  perceptionFrame?: boolean;
  toldIssue?: string;
  hindsightIssue?: string;
  longIssue: string;
}
export interface MotionGenreGrammarSpec {
  shots: readonly string[];
  mix: Record<string, number>;
  visuals: readonly string[];
  devices: readonly string[];
  rule: string;
  picture: string;
  sample: string;
}
export interface MotionGenreBookendSpec {
  kinds: string;
  maxBeats: number;
}
export interface MotionGenreDialogueSpec {
  minLines: number;
  skipProtagonist: boolean;
  needsSourceQuotes: boolean;
}
export interface MotionGenreContract {
  voice: string;
  opening: string;
  spine: string;
  devices: string;
  closing: string;
}
export interface MotionGenreSpec {
  PROFILE: string;
  PACKAGING: string;
  PLAN: string;
  SAMPLE: string;
  CHECK: string;
  TIMELINE: string;
  SIGNATURE: string;
  STAGES: Record<string, MotionGenreStageSpec>;
  MOTIFS: string;
  MERGE: boolean;
  VOICE: MotionGenreVoiceSpec;
  GRAMMAR: MotionGenreGrammarSpec;
  OPENING: MotionGenreBookendSpec;
  CLOSING: MotionGenreBookendSpec;
  PLAN_FIELDS: readonly string[];
  REVIEW: MotionGenreReviewChecks;
  EXPANSION_RULE: string;
  HOOKS: { light: string; full: string };
  DIALOGUE: MotionGenreDialogueSpec;
  TEXTURE: string;
  STYLE_BRIEF: string;
  CONTRACT: MotionGenreContract;
}
