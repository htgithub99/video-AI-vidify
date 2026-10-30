import assert from "node:assert/strict";
import { MOTION_VERIFICATION_TEXTS as V } from "./motionVerificationTexts.js";
import { PRODUCTION_QA as Q } from "./motionProductionVerificationTexts.js";
import { motionDnaRepairDraft, motionDnaRepairPrompt } from "../src/lib/motionDnaRepair.js";
import { videoDnaErrors } from "../src/lib/motionVideoDna.js";
import { analyzeStory, parseStorySource, type MotionAnalysisDraft } from "../src/features/motion/server/services/motionStoryService.js";
import { MOTION_PRODUCTION as P } from "../src/constants/motionProduction.js";
import { MotionStoryLength } from "../src/types/motionVideo.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../src/constants/cinematicConstants.js";
import { PLANNING_PROFILE } from "./motionPlanningVerificationFixtures.js";
const dna: any = {
  intent: V.EXPLAIN,
  audience: V.VIEWERS_REQUESTED_BY_THE_INPUT,
  narrative: { voice: V.NATURAL_ENGLISH, structure: V.SHOW_COMPARE_EXPLAIN, pacing: V.ONE_IDEA_AT_A_TIME },
  visualDna: { style: V.PASTEL_FORMS, composition: V.KEEP_OBJECTS_SEPARATED, camera: V.OVERHEAD_AND_DETAIL_VIEWS, lighting: V.READABLE_SURFACES, palette: V.INPUT_DERIVED_COLOURS, materials: V.MATTE, subjectHierarchy: V.OBJECT_FIRST },
  creativeProfile: { role: V.VISUAL_EDUCATOR, writingPrinciples: [V.EXPLAIN_WITH_VISIBLE_EVIDENCE], productionPrinciples: [V.OBJECTS_REMAIN_READABLE] },
  mustPreserve: [V.PASTEL_FORMS],
  mustVary: [V.VIEW_SIZE],
  mustNotCopy: [V.REFERENCE_COMPOSITIONS],
  uncertainties: [],
  evidence: [{ claim: V.FORM, sourceClue: V.INPUT, confidence: 100 }],
  characters: { design: V.NO_PEOPLE_NEEDED, proportions: V.OBJECT_ONLY, poseLanguage: V.NO_HUMAN_ACTIONS, continuity: [V.DO_NOT_INTRODUCE_CAST] },
  environment: { space: V.OPEN_TABLETOP, scale: V.TWO_PALM_SIZED_OBJECTS, continuity: [V.SAME_OBJECTS_BETWEEN_VIEWS] },
  cinematography: { framing: V.WIDE_THEN_INSERT, focus: V.NAMED_HERO, movement: V.SLOW_CAMERA_PUSH, editing: V.CUT_FOR_EVIDENCE },
  audioText: { narration: V.ENGLISH, sound: V.RESTRAINED, subtitles: V.EXISTING_SUBTITLE_STYLE_NO_FLOATING_LABELS },
  opening: { visual: V.SHOW_BOTH_OBJECTS, purpose: V.MAKE_THE_COMPARISON_CLEAR_IMMEDIATELY, acceptance: [V.BOTH_OBJECTS_ARE_VISIBLE_FROM_THE_FIRST_FRAME] },
  qualityChecks: [V.HERO_IS_NOT_CROPPED, V.NO_ADDED_EXPLANATORY_TEXT],
};
const original: any = { title: V.MIXING, logline: V.COMPARE_TWO_OBJECTS, cast: [], places: [{ key: V.STUDIO, name: V.TABLETOP, description: V.TWO_FORMS }], chapters: [{ id: Q.CHAPTERS[0].id, title: V.COMPARISON, summary: V.COMPARE_OBJECTS }], videoDna: dna };
Object.assign(dna, PLANNING_PROFILE, { creativeProfile: { ...dna.creativeProfile, ...PLANNING_PROFILE.creativeProfile } });
const errors = videoDnaErrors(dna);
assert.equal(errors.length, 1);
const snapshot = JSON.stringify(original);
const response = { title: V.CHANGED_ENDING, cast: [{ key: V.FORM }], chapters: [], videoDna: { intent: V.CHANGED_ENDING, environment: { propRules: V.GIVE_OBJECTS_STABLE_NODE_NAMES, space: V.CHANGED_ENDING } } };
const repaired = motionDnaRepairDraft(original, response, errors);
assert.equal(JSON.stringify(original), snapshot);
assert.deepEqual(repaired, { ...original, videoDna: { ...dna, environment: { ...dna.environment, propRules: V.GIVE_OBJECTS_STABLE_NODE_NAMES } } });
assert.deepEqual(motionDnaRepairDraft(original, null, errors), original);
const absentDna = { ...original, videoDna: null };
const completeDna = { ...dna, environment: { ...dna.environment, propRules: V.GIVE_OBJECTS_STABLE_NODE_NAMES } };
const filledDna = motionDnaRepairDraft(absentDna, { videoDna: completeDna }, videoDnaErrors(null));
assert.deepEqual({ ...filledDna, videoDna: null }, absentDna);
assert.deepEqual(videoDnaErrors(filledDna.videoDna), []);
const badEvidence = { ...original, videoDna: { ...dna, evidence: [{ ...dna.evidence[0], confidence: 101 }] } };
const corrected = motionDnaRepairDraft(badEvidence, { videoDna: { evidence: [{ claim: V.CHANGED_ENDING, confidence: 80 }] } }, videoDnaErrors(badEvidence.videoDna));
assert.deepEqual(corrected.videoDna.evidence, [{ ...dna.evidence[0], confidence: 80 }]);
assert.equal(videoDnaErrors(corrected.videoDna).length, 1);
const question = motionDnaRepairPrompt(original, errors);
assert.ok(question.includes(errors[0]));
assert.ok(question.length < C.PROMPT_MESSAGE_LIMIT);
const prompts: string[] = [];
const result = await analyzeStory(parseStorySource(V.EXPLAIN_COLOUR_MIXING_THROUGH_TWO_PASTEL_OBJECTS_NO_PEOPLE_C), {
  language: V.EN,
  length: MotionStoryLength.ONE,
  exec: {} as any,
  ai: async (prompt) => {
    prompts.push(prompt);
    return prompts.length === 1 ? original : response;
  },
});
assert.equal(prompts.length, 2);
assert.ok(prompts[1].includes(errors[0]));
assert.ok(prompts[1].length < prompts[0].length);
assert.equal(result.videoDna?.environment.propRules, V.GIVE_OBJECTS_STABLE_NODE_NAMES);
assert.equal(result.title, original.title);
assert.equal(result.chapters.length, original.chapters.length);
assert.equal(result.chapters[0].title, original.chapters[0].title);
assert.equal(result.places[0].key, original.places[0].key);
let saved: MotionAnalysisDraft | undefined;
const source = parseStorySource(V.EXPLAIN_COLOUR_MIXING_THROUGH_TWO_PASTEL_OBJECTS_NO_PEOPLE_C);
const controller = new AbortController();
const settings = { language: V.EN, length: MotionStoryLength.ONE, exec: {} };
await assert.rejects(
  analyzeStory(source, {
    ...settings,
    signal: controller.signal,
    ai: async () => original,
    onDraft: (draft) => {
      saved = draft;
      controller.abort();
    },
  }),
);
assert.equal(saved?.rejected, 1);
let resumeCalls = 0;
const resumed = await analyzeStory(source, {
  ...settings,
  draft: saved,
  ai: async (prompt) => {
    resumeCalls++;
    assert.ok(prompt.includes(errors[0]));
    return response;
  },
});
assert.equal(resumeCalls, 1);
assert.equal(resumed.videoDna?.environment.propRules, V.GIVE_OBJECTS_STABLE_NODE_NAMES);
await assert.rejects(
  analyzeStory(source, {
    ...settings,
    ai: async () => original,
    onDraft: (draft) => {
      saved = draft;
    },
  }),
  (error: any) => error[P.CONTRACT_EXHAUSTED] === true || error[P.CONTRACT_ROUTE_EXHAUSTED] === true,
);
assert.ok(saved!.rejected > 1);
await assert.rejects(
  analyzeStory(source, {
    ...settings,
    draft: saved,
    ai: async () => {
      throw new Error(V.CHANGED_ENDING);
    },
  }),
  (error: any) => error[P.CONTRACT_EXHAUSTED] === true || error[P.CONTRACT_ROUTE_EXHAUSTED] === true,
);
process.stdout.write(Q.DNA_REPAIR_PASSED);
