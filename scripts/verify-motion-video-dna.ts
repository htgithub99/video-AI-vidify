import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { MotionStoryLength } from "../src/types/motionVideo.ts";
import { bindVideoDnaSettings, sceneExecutionKey, normalizeScenePlan, scenePlanErrors, scenePlanStagingErrors, videoDnaErrors, videoDnaSourceKey } from "../src/lib/motionVideoDna.ts";
import { productionPreamble } from "../src/lib/motionDirection.ts";
import { analyzeStory, parseStorySource, writeChapterBeats } from "../src/server/services/motionStoryService.ts";
import { beatPreviewSpec, prepareMotionGen, previewBeats, reviewBeats, stageBeats } from "../src/server/services/motionGenService.ts";
import { compileStorySpec } from "../src/server/services/motionDirectorService.ts";
import { openStillSession } from "../src/server/services/motionRenderService.ts";
import { getMotionRootDirectory } from "../src/server/services/motionLibraryService.ts";
const rawDna = (style: string) => ({
  intent: `${VT.EXPLAIN}${style}`,
  audience: VT.VIEWERS_REQUESTED_BY_THE_INPUT,
  narrative: { voice: VT.NATURAL_ENGLISH, structure: VT.SHOW_COMPARE_EXPLAIN, pacing: VT.ONE_IDEA_AT_A_TIME },
  visualDna: { style, composition: VT.KEEP_OBJECTS_SEPARATED, camera: VT.OVERHEAD_AND_DETAIL_VIEWS, lighting: VT.READABLE_SURFACES, palette: VT.INPUT_DERIVED_COLOURS, materials: VT.MATTE, subjectHierarchy: VT.OBJECT_FIRST },
  creativeProfile: { role: VT.VISUAL_EDUCATOR, writingPrinciples: [VT.EXPLAIN_WITH_VISIBLE_EVIDENCE], productionPrinciples: [VT.OBJECTS_REMAIN_READABLE] },
  mustPreserve: [style],
  mustVary: [VT.VIEW_SIZE],
  mustNotCopy: [VT.REFERENCE_COMPOSITIONS],
  uncertainties: [],
  evidence: [{ claim: style, sourceClue: VT.USER_GUIDANCE, confidence: 100 }],
  characters: { design: VT.NO_PEOPLE_NEEDED, proportions: VT.OBJECT_ONLY, poseLanguage: VT.NO_HUMAN_ACTIONS, continuity: [VT.DO_NOT_INTRODUCE_CAST] },
  environment: { space: VT.OPEN_TABLETOP, scale: VT.TWO_PALM_SIZED_OBJECTS, propRules: VT.GIVE_OBJECTS_STABLE_NODE_NAMES, continuity: [VT.SAME_OBJECTS_BETWEEN_VIEWS] },
  cinematography: { framing: VT.WIDE_THEN_INSERT, focus: VT.NAMED_HERO, movement: VT.SLOW_CAMERA_PUSH, editing: VT.CUT_FOR_EVIDENCE },
  audioText: { narration: VT.ENGLISH, sound: VT.RESTRAINED, subtitles: VT.EXISTING_SUBTITLE_STYLE_NO_FLOATING_LABELS },
  opening: { visual: VT.SHOW_BOTH_OBJECTS, purpose: VT.MAKE_THE_COMPARISON_CLEAR_IMMEDIATELY, acceptance: [VT.BOTH_OBJECTS_ARE_VISIBLE_FROM_THE_FIRST_FRAME] },
  qualityChecks: [VT.HERO_IS_NOT_CROPPED, VT.NO_ADDED_EXPLANATORY_TEXT],
});
const source = parseStorySource(VT.EXPLAIN_COLOUR_MIXING_THROUGH_TWO_PASTEL_OBJECTS_NO_PEOPLE_C);
const raw = { title: VT.MIXING, logline: VT.COMPARE_TWO_OBJECTS, cast: [], places: [{ key: VT.STUDIO, name: VT.TABLETOP, description: VT.TWO_FORMS }], chapters: [{ title: VT.COMPARISON, summary: VT.COMPARE_OBJECTS }] };
const prompts: string[] = [];
const analysis = await analyzeStory(source, {
  language: VT.EN,
  length: MotionStoryLength.ONE,
  drawingMode: VT.VALUE_2D,
  aspect: VT.VALUE_9_16,
  exec: {} as any,
  ai: async (prompt) => {
    prompts.push(prompt);
    return { ...raw, videoDna: rawDna(VT.PASTEL_FORMS) };
  },
});
assert.ok(analysis?.videoDna);
assert.equal(prompts.length, 1);
assert.deepEqual(analysis.videoDna.settings, { language: VT.EN, length: MotionStoryLength.ONE, targetSeconds: 60, drawingMode: VT.VALUE_2D, characterMode: VT.DRAWN, aspect: VT.VALUE_9_16 });
assert.equal(analysis.videoDna.sourceKey, videoDnaSourceKey(source));
assert.notEqual(videoDnaSourceKey({ ...source, text: source.text + VT.CHANGED_ENDING }), videoDnaSourceKey(source));
assert.ok(prompts[0].includes(VT.USER_SETTINGS_ARE_AUTHORITATIVE));
assert.ok(productionPreamble(analysis, VT.VISUAL).includes(VT.APPROVED_VIDEO_DNA));
assert.ok(videoDnaErrors({ ...rawDna(VT.FORMS), opening: {} }).some((error) => error.includes(VT.OPENING)));
assert.ok(videoDnaErrors({ ...rawDna(VT.FORMS), evidence: [{ claim: VT.FORM, sourceClue: VT.INPUT, confidence: 101 }] }).length);
let corrections = 0;
const other = await analyzeStory(parseStorySource(VT.TEACH_SAFE_WORKSHOP_OBSERVATION_WITH_RESTRAINED_REALISTIC_MA), {
  language: VT.VI,
  length: MotionStoryLength.FIVE,
  drawingMode: VT.VALUE_3D,
  exec: {} as any,
  ai: async (prompt) => {
    corrections++;
    if (corrections === 1) return { ...raw, videoDna: { ...rawDna(VT.WORKSHOP), qualityChecks: [] } };
    assert.ok(prompt.includes(VT.VIDEODNA_QUALITYCHECKS));
    return { ...raw, videoDna: { ...rawDna(VT.WORKSHOP), settings: { drawingMode: VT.VALUE_2D, language: VT.EN } } };
  },
});
assert.equal(corrections, 2);
assert.equal(other.videoDna?.settings.drawingMode, VT.VALUE_3D, VT.AI_CANNOT_OVERRIDE_USER_CONTROLS);
assert.equal(other.videoDna?.settings.language, VT.VI);
assert.equal(other.videoDna?.settings.targetSeconds, 300);
assert.notEqual(productionPreamble(analysis, VT.VISUAL), productionPreamble(other, VT.VISUAL));
const recovered = await analyzeStory(source, { language: VT.EN, length: MotionStoryLength.ONE, exec: {} as any, ai: async () => raw });
assert.equal(recovered.title, raw.title);
assert.ok(recovered.chapters.length);
assert.equal(recovered.characterMotion, false);
for (const [length, target] of [
  [MotionStoryLength.TEN, 600],
  [MotionStoryLength.SHORT, 75],
  [MotionStoryLength.FULL, 60],
] as const) {
  const result = await analyzeStory(source, { language: VT.EN, length, exec: {} as any, ai: async () => ({ ...raw, videoDna: rawDna(VT.FORMS) }) });
  assert.equal(result.videoDna?.settings.length, length);
  assert.equal(result.videoDna?.settings.targetSeconds, target);
}
const plan = { purpose: VT.COMPARE_OBJECTS, subject: VT.HERO, before: VT.BOTH_OBJECTS_ARE_VISIBLE, after: VT.BOTH_OBJECTS_REMAIN_VISIBLE, composition: VT.HERO_LEFT_OF_COMPARISON, spatialRelations: [VT.HERO_LEFT_OF_COMPARISON], requiredProps: [VT.HERO, VT.COMPARISON_2], continuity: [VT.SAME_POSITIONS], acceptance: [VT.HERO_AND_COMPARISON_ARE_SEPARATE] };
assert.deepEqual(scenePlanErrors(plan), []);
assert.equal(normalizeScenePlan({ ...plan, after: VT.EMPTY_2 }), undefined);
let chapterCalls = 0;
const beats = await writeChapterBeats(
  source,
  analysis,
  { ...analysis.chapters[0], targetSeconds: 8 },
  {
    language: VT.EN,
    exec: {} as any,
    isFirst: true,
    isLast: true,
    ai: async (prompt) => {
      chapterCalls++;
      assert.ok(prompt.includes(VT.APPROVED_VIDEO_DNA));
      assert.ok(prompt.includes(VT.SCENEPLAN));
      return { beats: [{ visual: VT.SCENE, narration: VT.THESE_TWO_FORMS_HAVE_DIFFERENT_SHAPES_AND_COLOURS_WE_CAN_COM, place: VT.STUDIO, cast: [], action: VT.KEEP_BOTH_OBJECTS_SEPARATED, scenePlan: chapterCalls === 1 ? undefined : plan }] };
    },
  },
);
assert.equal(chapterCalls, 2, VT.WRITING_MUST_CORRECT_MISSING_SCENE_EXECUTION_PLANS);
const shortChapter = await writeChapterBeats(source, analysis, { ...analysis.chapters[0], targetSeconds: 60 }, { language: VT.EN, exec: {} as any, isFirst: true, isLast: true, ai: async () => ({ beats: [{ visual: VT.SCENE, narration: VT.TWO_FORMS_REMAIN_VISIBLE, scenePlan: plan }] }) });
assert.ok(shortChapter.length && shortChapter[0].narration);
assert.deepEqual(beats[0].scenePlan, plan);
assert.notEqual(sceneExecutionKey(beats[0]), sceneExecutionKey({ ...beats[0], scenePlan: { ...plan, after: VT.NEW_STATE } }), VT.EDITING_EXECUTION_PLANS_MUST_INVALIDATE_SCENE_ASSETS);
beats[0].duration = 8;
const fixture = JSON.parse(fs.readFileSync(VT.MOTION_ENGINE_DEMO_EDITORIAL_QA_JSON, VT.UTF8));
const location = fixture.gen.locations.studio;
location.nodes = [
  { shape: VT.SPHERE, name: VT.HERO, radius: 0.3, pos: [-0.6, 0.6, 0], mat: { color: VT.E69DAB } },
  { shape: VT.BOX, name: VT.COMPARISON_2, size: [0.5, 0.5, 0.5], pos: [0.6, 0.6, 0], mat: { color: VT.VALUE_99CEB6 } },
];
location.camera = { pos: [0, 3, 4], target: [0, 0.6, 0], fov: 40 };
const comparison = location.nodes.pop();
const gen = prepareMotionGen(undefined, analysis, VT.VALUE_2D);
gen.locations.studio = location;
const script: any = { title: VT.DNA_TEST, language: VT.EN, beats, gen };
let stageCalls = 0;
const staging = {
  location: VT.STUDIO,
  actors: [],
  cameras: [
    { shot: VT.WIDE, at: 0, move: VT.STATIC, pos: [0, 3, 4], target: [0, 0.6, 0] },
    { shot: VT.INSERT, at: 0.5, focusProp: VT.HERO, move: VT.DOLLY_IN, amount: 0.2 },
  ],
};
await stageBeats(beats, script, analysis, gen, {
  exec: {} as any,
  log: () => {},
  ai: async (prompt) => {
    stageCalls++;
    assert.ok(prompt.includes(VT.SCENE_EXECUTION_PLAN));
    return { beats: [{ id: beats[0].id, ...staging, props: stageCalls === 1 ? [] : [comparison] }] };
  },
});
assert.equal(stageCalls, 1, VT.SEMANTIC_QA_SUGGESTIONS_MUST_NOT_BLOCK_RENDERABLE_STAGING);
gen.cast.unrequested = fixture.gen.cast.person0;
let actorCalls = 0;
await stageBeats(beats, script, analysis, gen, {
  exec: {} as any,
  log: () => {},
  ai: async () => {
    actorCalls++;
    return { beats: [{ id: beats[0].id, ...staging, props: [comparison], actors: actorCalls === 1 ? [{ cast: VT.UNREQUESTED, action: VT.STAND, at: [0, 0] }] : [] }] };
  },
});
assert.equal(actorCalls, 2, VT.OBJECT_ONLY_BEATS_MUST_REJECT_EVEN_A_KNOWN_CAST_MEMBER);
assert.deepEqual((gen.staging[beats[0].id] as any).actors, []);
delete gen.cast.unrequested;
assert.deepEqual(scenePlanStagingErrors(plan, gen.staging[beats[0].id], location), []);
assert.ok(scenePlanStagingErrors({ ...plan, requiredProps: [VT.MISSING] }, staging, location).length);
const preview = beatPreviewSpec(beats[0], gen, VT.EN, VT.VALUE_9_16);
assert.equal(preview.spec.shots.length, 2);
assert.equal(preview.picks.length, 4, VT.REVIEW_MUST_INCLUDE_FIRST_FRAME_EVERY_CAMERA_SLOT_AND_LAST_F);
assert.equal(preview.picks[0].t, 0.04);
assert.equal(preview.spec.fadeIn, 0);
assert.equal(preview.spec.gen?.videoDna?.sourceKey, analysis.videoDna.sourceKey);
const compiled = compileStorySpec(script, analysis, { aspect: VT.VALUE_9_16 }).spec;
assert.equal(compiled.gen?.videoDna?.version, 1);
assert.equal(compiled.fadeIn, 0);
assert.deepEqual(compiled.shots[0].transition, { type: VT.CUT, duration: 0 });
const bound = bindVideoDnaSettings(analysis, { drawingMode: VT.VALUE_3D, characterMode: VT.DRAWN });
assert.equal(bound.videoDna?.settings.drawingMode, VT.VALUE_3D);
assert.equal(analysis.videoDna.settings.drawingMode, VT.VALUE_2D, VT.BINDING_MUST_NOT_MUTATE_PREVIOUS_ANALYSIS);
assert.deepEqual(prepareMotionGen(gen, bound).locations, {}, VT.CHANGED_DNA_INVALIDATES_ASSETS_AND_THEIR_REVIEWS);
const session = await openStillSession();
try {
  const runId = `${VT.VIDEO_DNA_CHECK}${Date.now()}`;
  await previewBeats(beats, script, gen, session, { exec: {} as any, log: () => {}, runId, aspect: VT.VALUE_9_16 });
  assert.equal(gen.previews[beats[0].id].files?.length, 4);
  assert.equal(gen.previews[beats[0].id].score, undefined);
  assert.ok(gen.previews[beats[0].id].file);
  assert.ok(!gen.previews[beats[0].id].issues?.some((issue) => /failed|render error/.test(issue)));
  const review = await reviewBeats(beats, gen, {
    exec: {} as any,
    log: () => {},
    openingBeatId: beats[0].id,
    preamble: productionPreamble(analysis, VT.VISUAL),
    ai: async (prompt, _artifact, _exec, _signal, _log, images) => {
      assert.equal(images?.length, 4);
      assert.ok(prompt.includes(VT.BOTH_OBJECTS_ARE_VISIBLE_FROM_THE_FIRST_FRAME));
      assert.ok(prompt.includes(VT.SCENE_EXECUTION_PLAN));
      assert.ok(prompt.includes(VT.HERO));
      return { beats: [{ id: beats[0].id, ok: false, fix: VT.THE_DETAIL_CAMERA_MUST_SHOW_THE_HERO_UNOBSTRUCTED }] };
    },
  });
  assert.ok(review.staging[beats[0].id]);
  assert.equal(gen.previews[beats[0].id].score, 4, VT.A_FAILED_ANGLE_MUST_FAIL_THE_WHOLE_BEAT);
  const missingVerdict = await reviewBeats(beats, gen, { exec: {} as any, log: () => {}, ai: async () => ({ beats: [] }) });
  assert.ok(missingVerdict.staging[beats[0].id], VT.MISSING_VERDICTS_MUST_NOT_SILENTLY_APPROVE_SCENES);
  const output = VT.SCRATCH_VIDEO_DNA_CHECK;
  fs.mkdirSync(output, { recursive: true });
  for (const file of gen.previews[beats[0].id].files || []) fs.copyFileSync(path.join(getMotionRootDirectory(), VT.GEN_PREVIEW, file), path.join(output, path.basename(file)));
  const browser = await chromium.launch({ channel: VT.CHROME, headless: true });
  try {
    const page = await browser.newPage();
    const image = fs.readFileSync(path.join(output, `${beats[0].id}${VT.OPENING_JPG}`)).toString(VT.BASE64);
    const stats = await page.evaluate(
      async ({ payload: image, texts: VT }) => {
        const img = new Image();
        img.src = `${VT.DATA_IMAGE_JPEG_BASE64}${image}`;
        await img.decode();
        const canvas = document.createElement(VT.CANVAS);
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext(VT.VALUE_2D)!;
        ctx.drawImage(img, 0, 0, 32, 32);
        const pixels = ctx.getImageData(0, 0, 32, 32).data;
        let brightness = 0;
        for (let i = 0; i < pixels.length; i += 4) brightness += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        return { brightness: brightness / 1024, width: img.width, height: img.height };
      },
      { payload: image, texts: VT },
    );
    assert.ok(stats.brightness > 15, `${VT.OPENING_IMAGE_MUST_NOT_BE_COVERED_BY_A_BLACK_FADE}${stats.brightness}`);
    assert.equal(stats.width / stats.height, 9 / 16, VT.REVIEW_MUST_USE_THE_SELECTED_ASPECT_RATIO);
  } finally {
    await browser.close();
  }
} finally {
  await session.close();
}
process.stdout.write(VT.VIDEO_DNA_PASSED_AUTHORITATIVE_CONTROLS_BOUNDED_RECOVERY_SCE);
