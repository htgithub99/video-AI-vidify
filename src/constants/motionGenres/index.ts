import { MOTION_POV_STORY } from "../motionPovStory.js";
import { MOTION_WITNESS_STORY } from "../motionWitnessStory.js";
import { MOTION_CHRONICLE_STORY } from "../motionChronicleStory.js";
import { MOTION_VERDICT_STORY } from "../motionVerdictStory.js";
import { POV_RULES } from "./pov/rules.js";
import { WITNESS_RULES } from "./witness/rules.js";
import { CHRONICLE_RULES } from "./chronicle/rules.js";
import { VERDICT_RULES } from "./verdict/rules.js";
import type { MotionGenreSpec } from "./types.js";
export const MOTION_GENRE_SPECS: Record<string, MotionGenreSpec> = {
  pov: { ...MOTION_POV_STORY, ...POV_RULES },
  witness: { ...MOTION_WITNESS_STORY, ...WITNESS_RULES },
  chronicle: { ...MOTION_CHRONICLE_STORY, ...CHRONICLE_RULES },
  verdict: { ...MOTION_VERDICT_STORY, ...VERDICT_RULES },
};
