import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import { creativeBlueprintErrors, normalizeCreativeBlueprint } from "../src/lib/motionCreativeBlueprint.ts";
import { productionPreamble } from "../src/lib/motionDirection.ts";
import { MOTION_GEN_ANALYSIS_PROMPT } from "../src/constants/motionGenPrompts.ts";
import { analyzeStory, normalizeAnalysis, parseStorySource, resolveTargetSeconds } from "../src/server/services/motionStoryService.ts";
import { stageBeats, emptyGen, prepareMotionGen, designBible, designLocation } from "../src/server/services/motionGenService.ts";
import { planMotionCoverage } from "../src/lib/motionCoverage.ts";
import { MotionStoryLength } from "../src/types/motionVideo.ts";
const makeBlueprint = (style: string) => ({
  intent: `${VT.CREATE_AN_ORIGINAL}${style}${VT.VIDEO_2}`,
  audience: VT.AUDIENCE_SPECIFIED_BY_SOURCE,
  narrative: { voice: VT.NATURAL_AND_PLAYFUL, structure: VT.OBSERVATION_COMPARISON_PAYOFF, pacing: VT.SLOW_ONE_UNINTERRUPTED_VIEW_PER_SCENE },
  visualDna: { style, composition: VT.OBJECT_LED_NO_PEOPLE, camera: VT.LOCKED_OVERHEAD_VIEWS, lighting: VT.BRIGHT_DIFFUSE_LIGHT, palette: VT.PASTEL_PINK_AND_MINT, materials: VT.STYLIZED_TRANSLUCENT_FORMS, subjectHierarchy: VT.THE_OBJECT_IS_THE_HERO },
  creativeProfile: { role: VT.VISUAL_DESIGNER_EXPLAINING_THROUGH_SHAPE, writingPrinciples: [VT.USE_CLEAR_COMPARISONS], productionPrinciples: [VT.KEEP_OBJECTS_LEGIBLE] },
  mustPreserve: [style],
  mustVary: [VT.OBJECT_SCALE],
  mustNotCopy: [VT.REFERENCE_SPECIFIC_COMPOSITIONS],
  uncertainties: [],
  evidence: [{ claim: style, sourceClue: VT.INPUT_ASKS_FOR_PLAYFUL_PASTEL_OBJECTS }],
});
const blueprint = makeBlueprint(VT.PLAYFUL_ABSTRACT_DEMONSTRATION);
const input = VT.EXPLAIN_COLOUR_MIXING_THROUGH_PLAYFUL_PASTEL_OBJECTS_WITH_LO;
assert.equal(parseStorySource(input).text, input, VT.A_SINGLE_CREATIVE_INPUT_MUST_NOT_BE_DISCARDED_AS_A_TITLE);
assert.equal(resolveTargetSeconds(parseStorySource(input), MotionStoryLength.FIVE), 300, VT.BRIEF_WORD_COUNT_MUST_NOT_TRUNCATE_THE_REQUESTED_DURATION);
assert.equal(parseStorySource(VT.OBJECTS_IN_MOTION).words, 3, VT.SHORT_CREATIVE_BRIEFS_DO_NOT_REQUIRE_A_TRANSCRIPT);
assert.deepEqual(creativeBlueprintErrors(blueprint), []);
assert.equal(normalizeCreativeBlueprint({ ...blueprint, mustPreserve: [] }), undefined);
const source: any = { title: VT.SHAPES, text: VT.A_PLAYFUL_DEMONSTRATION_WITH_PASTEL_OBJECTS_USE_OVERHEAD_VIE, segments: [{ t: 0, text: VT.A_PLAYFUL_DEMONSTRATION_WITH_PASTEL_OBJECTS_USE_OVERHEAD_VIE }], words: 18, sourceSeconds: 60 };
const base = { title: VT.SHAPES, logline: VT.COMPARE_FORMS, genre: VT.HISTORY, cast: [], places: [{ key: VT.SPACE, name: VT.ABSTRACT_SPACE, description: VT.PASTEL_OBJECTS_IN_OPEN_SPACE }], chapters: [{ title: VT.COMPARISON, summary: VT.COMPARE_FORMS }], creativeBlueprint: blueprint };
const analysis = normalizeAnalysis(base, source, 60);
assert.equal(analysis.factual, undefined, VT.GENRE_METADATA_MUST_NOT_DETERMINE_FACTUALITY);
assert.equal(analysis.look, VT.CLEAN, VT.GENRE_METADATA_MUST_NOT_DETERMINE_RENDERING_LOOK);
const preamble = productionPreamble(analysis, VT.VISUAL);
assert.ok(preamble.includes(blueprint.visualDna.style));
assert.ok(!preamble.includes(VT.HISTORY_DOCUMENTARY_SCRIPTWRITER));
const prompt = MOTION_GEN_ANALYSIS_PROMPT({ preamble: VT.EMPTY_2, title: source.title, seconds: 60, language: VT.ENGLISH, chapters: 1, transcript: source.text });
assert.ok(!prompt.includes(VT.CHOOSE_EXACTLY_ONE_ID));
let calls = 0;
const requests: string[] = [];
const dnaFields = {
  characters: { design: VT.NO_PEOPLE, proportions: VT.OBJECT_ONLY, poseLanguage: VT.NO_HUMAN_POSES, continuity: [VT.NO_CAST] },
  environment: { space: VT.OPEN_SPACE, scale: VT.READABLE_OBJECTS, propRules: VT.NAMED_FORMS, continuity: [VT.SAME_SHAPES] },
  cinematography: { framing: VT.OVERHEAD, focus: VT.OBJECTS, movement: VT.LOCKED, editing: VT.ONE_VIEW },
  audioText: { narration: VT.NATURAL_ENGLISH, sound: VT.QUIET, subtitles: VT.READABLE_SUBTITLES },
  opening: { visual: VT.TWO_FORMS_VISIBLE, purpose: VT.ESTABLISH_COMPARISON, acceptance: [VT.BOTH_FORMS_FIT] },
  qualityChecks: [VT.NO_OBJECT_IS_CROPPED],
  evidence: [{ claim: VT.PASTEL_OBJECTS, sourceClue: VT.INPUT_ASKS_FOR_PASTEL_OBJECTS, confidence: 100 }],
};
const generated = await analyzeStory(source, {
  language: VT.EN,
  length: MotionStoryLength.ONE,
  exec: {} as any,
  ai: async (request: string) => {
    requests.push(request);
    calls++;
    return calls === 1 ? { ...base, videoDna: {} } : { ...base, videoDna: { ...blueprint, ...dnaFields } };
  },
});
assert.equal(calls, 2);
assert.ok(requests[1].includes(VT.VIDEODNA));
assert.equal(generated.videoDna?.visualDna.style, blueprint.visualDna.style);
assert.equal(generated.videoDna?.version, 1);
assert.equal(generated.creativeBlueprint, undefined, VT.NEW_ANALYSES_MUST_NOT_STORE_DUPLICATE_PLANNING_DATA);
assert.equal((generated as any).dna, undefined);
assert.ok(requests.every((request) => !request.includes(VT.DNA)));
const recovered = await analyzeStory(source, { language: VT.EN, length: MotionStoryLength.ONE, exec: {} as any, ai: async () => ({ ...base, creativeBlueprint: {} }) });
assert.equal(recovered.title, base.title);
assert.ok(recovered.chapters.length);
assert.equal(recovered.characterMotion, false);
const gen = emptyGen();
gen.locations.space = { name: VT.ABSTRACT_SPACE, stage: { center: [0, 0], size: [10, 10] }, camera: { pos: [0, 8, 1], target: [0, 0, 0] }, materials: {}, marks: {} };
const beat: any = { id: VT.B1, visual: VT.SCENE, place: VT.SPACE, narration: VT.COMPARE_THESE_FORMS, cast: [], duration: 9 };
await stageBeats([beat], { language: VT.EN, beats: [beat] } as any, generated, gen, {
  exec: {} as any,
  log: () => {},
  ai: async (request: string) => {
    assert.ok(request.includes(blueprint.visualDna.style));
    assert.ok(request.includes(blueprint.mustPreserve[0]));
    return { beats: [{ id: VT.B1, location: VT.SPACE, actors: [], cameras: [{ shot: VT.HIGH, at: 0, move: VT.STATIC, amount: 0, pos: [0, 8, 1], target: [0, 0, 0] }] }] };
  },
});
const cameras = planMotionCoverage(gen.staging.b1, 9);
assert.equal(cameras.length, 1, VT.A_LONG_LOCKED_SCENE_MUST_NOT_ACQUIRE_COMPULSORY_CUTS);
assert.equal(cameras[0].move, VT.STATIC);
assert.equal(cameras[0].shot, VT.HIGH);
assert.equal(gen.staging.b1.actors.length, 0);
const other = normalizeAnalysis({ ...base, creativeBlueprint: makeBlueprint(VT.WARM_HANDCRAFTED_MINIATURE) }, source, 60);
assert.notEqual(productionPreamble(other, VT.VISUAL), preamble, VT.DIFFERENT_INPUT_BLUEPRINTS_MUST_PRODUCE_DIFFERENT_DIRECTION_);
const cached = prepareMotionGen(undefined, generated);
cached.locations.old = { name: VT.OLD_STYLE };
assert.ok(prepareMotionGen(cached, generated).locations.old);
assert.deepEqual(prepareMotionGen(cached, other).locations, {}, VT.A_NEW_BLUEPRINT_MUST_NOT_REUSE_PREVIOUS_STYLE_ASSETS);
await designBible(generated, gen, {
  exec: {} as any,
  log: () => {},
  ai: async (request: string) => {
    assert.ok(request.includes(blueprint.visualDna.style));
    return { style: { grade: VT.NEUTRAL, notes: blueprint.visualDna.style }, cast: {} };
  },
});
let locationRequests = 0,
  previewRequests = 0;
await designLocation(
  { key: VT.AIRCRAFT_CABIN, name: VT.AIRCRAFT_CABIN_2, description: VT.INPUT_ASKS_FOR_A_STYLIZED_CABIN, interior: true },
  { language: VT.EN, beats: [] } as any,
  generated,
  gen,
  {
    render: async (spec: any) => {
      assert.ok(
        spec.shots.every((shot: any) => !shot.params.actors?.length),
        VT.ENVIRONMENT_PREVIEWS_MUST_NOT_INJECT_UNREQUESTED_CHARACTERS,
      );
      previewRequests++;
      return [{ file: VT.TEST_PREVIEW_JPG, issues: [] }];
    },
  } as any,
  {
    exec: {} as any,
    log: () => {},
    review: false,
    runId: VT.BLUEPRINT_CONTRACT_TEST,
    ai: async (request: string) => {
      locationRequests++;
      assert.ok(request.includes(blueprint.visualDna.style));
      return { name: VT.USER_DESIGNED_CABIN, materials: { surface: { color: VT.E3AAC8 } }, nodes: [{ shape: VT.BOX, name: VT.HERO, size: [1, 1, 1], pos: [0, 0.5, 0], mat: VT.SURFACE }], stage: { center: [0, 0], size: [8, 8] }, camera: { pos: [0, 2, 5], target: [0, 0.5, 0] } };
    },
  },
);
assert.equal(locationRequests, 1, VT.A_CABIN_NAME_MUST_NOT_BYPASS_AI_WITH_AN_AUTOMATIC_FIXED_PRES);
assert.equal(previewRequests, 2);
assert.equal((gen.locations.aircraft_cabin as any).name, VT.USER_DESIGNED_CABIN);
process.stdout.write(VT.CREATIVE_BLUEPRINT_PASSED_SOURCE_DERIVED_CONTRACT_BOUNDED_CO);
