import assert from "node:assert/strict";
import { motionGenreGrammarFindings } from "../src/lib/motionGenres/grammar.ts";
import { VERDICT_RULES as R } from "../src/constants/motionGenres/verdict/rules.ts";
import { MOTION_VERDICT_STORY as V } from "../src/constants/motionVerdictStory.ts";
import { MOTION_WRITING as W } from "../src/constants/motionWriting.ts";
const chapters = [
  { id: "candidate-a", title: "Crossing", summary: "A crossing changes supply" },
  { id: "candidate-b", title: "Fleet", summary: "A fleet fails to arrive" },
  { id: "final", title: "Decision", summary: "The absent fleet decides" },
];
const analysis: any = { videoGenre: "verdict", writingPlan: { question: "What decided it?", criterion: "Lasting change", device: "", labels: ["enabling", "decisive"] }, chapters };
const beats: any[] = chapters.map((chapter, i) => ({ id: "b" + i, chapterId: chapter.id, narration: chapter.summary, subject: "The source event and its participants", visual: "scene", shot: "wide" }));
assert.deepEqual(motionGenreGrammarFindings(beats, analysis), [], "Questions and verdicts must accept source-event scene beats without scales or scoreboards");
assert.ok(!R.GRAMMAR.devices.some((device) => /scales?|stamp|scoreboard/iu.test(device)));
assert.match(R.GRAMMAR.rule, /Neither a verdict prop nor a scoreboard is mandatory/u);
assert.match(V.PROFILE, /never require scales, stamps or scoreboards/u);
assert.match(W.PLAN, /device is an optional metaphor/u);
assert.match(V.PACKAGING, /optional and must never be required/u);
console.log("PASS: verdict questions, criteria and final judgments accept ordinary source-event pictures; no mandatory scale, prop or scoreboard in writing, grammar or packaging.");
