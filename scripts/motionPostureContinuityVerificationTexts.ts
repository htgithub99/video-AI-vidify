import type { PuppetLine } from "../src/lib/motionPuppet.js";
import type { PuppetRead } from "../src/types/motionPuppet.js";
export const POSTURE_QA = {
  PASSED: "Posture continuity: lying speech, seated object use, English support aliases, scene resets and explicit standing passed.\n",
  LINES: ["rest", "speech", "stand", "yard", "return", "memory", "present"].map((key) => ({ key, text: key, beatId: key, place: key === "yard" ? "yard" : "room", chapterId: "chapter", cast: ["a", "b"] })) as PuppetLine[],
  READS: {
    rest: {
      focus: "a",
      who: ["a", "b"],
      action: "lie",
      emotion: "neutral",
      light: "day",
      place: "room",
      overlays: [],
      object: { word: "chõng tre", key: "bamboo_daybed", type: "furniture", mount: "floor", size: 1.8, note: "bamboo daybed" },
      states: [
        { char: "a", action: "lie", support: "bed" },
        { char: "b", action: "sit", support: "chair" },
      ],
    },
    speech: {
      focus: "a",
      who: ["a", "b"],
      action: "talk",
      emotion: "neutral",
      light: "day",
      place: "room",
      overlays: [],
      states: [
        { char: "a", action: "talk", support: "chong_tre" },
        { char: "b", action: "hold" },
      ],
    },
    stand: {
      focus: "a",
      who: ["a", "b"],
      action: "stand",
      emotion: "neutral",
      light: "day",
      place: "room",
      overlays: [],
      states: [
        { char: "a", action: "stand" },
        { char: "b", action: "sit", support: "chair" },
      ],
    },
    yard: { focus: "a", who: ["a"], action: "talk", emotion: "neutral", light: "day", place: "yard", overlays: [], states: [{ char: "a", action: "talk" }] },
    return: { focus: "a", who: ["a"], action: "talk", emotion: "neutral", light: "day", place: "room", overlays: [], states: [{ char: "a", action: "talk", support: "bed" }] },
    memory: { focus: "a", who: ["a"], action: "lie", emotion: "neutral", light: "day", place: "room", overlays: ["flashback"], states: [{ char: "a", action: "lie", support: "bed" }] },
    present: { focus: "a", who: ["a"], action: "talk", emotion: "neutral", light: "day", place: "room", overlays: [], states: [{ char: "a", action: "talk" }] },
  } as Record<string, PuppetRead>,
  DAYBED_SPOT: { key: "bed", kind: "lie", x: 800, y: 800, label: "on the bamboo bed" },
  KEYS: { REST: "rest", SPEECH: "speech", STAND: "stand", YARD: "yard", RETURN: "return", MEMORY: "memory", PRESENT: "present", BED: "bamboo_daybed", BED_SPOT: "bed", CHAIR: "chair", A: "a", LIE: "lie", SIT: "sit", IDLE: "idle" },
} as const;
