import { RUNTIME_VERIFICATION_TEXTS as RT } from "./runtimeVerificationTexts.ts";
import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getMotionRootDirectory } from "../src/server/services/motionLibraryService.ts";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { MOTION_GEN_CONFIG as C } from "../src/constants/motionGenPrompts.ts";
import { MOTION_STORY_CONFIG } from "../src/constants/motionVideo.ts";
import { MOTION_REFERENCE_PROMPTS } from "../src/constants/motionReference.ts";
import { normalizeMotionReferenceStyle } from "../src/lib/motionReference.ts";
import { MOTION_SCENE_LIBRARY_MODES } from "../src/constants/motionSceneCatalog.ts";
delete process.env.APP_DATA_DIR;
fs.mkdirSync(path.resolve(VT.SCRATCH), { recursive: true });
process.env.VIDIFY_STORAGE_DIR = fs.mkdtempSync(path.resolve(RT.SCRATCH_MOTION_ADVISORY_STYLE));
const previewRoot = path.join(getMotionRootDirectory(), VT.GEN_PREVIEW);
fs.mkdirSync(previewRoot, { recursive: true });
const directory = fs.mkdtempSync(path.join(previewRoot, VT.MOTION_QA_TEST));
const file = path.join(directory, VT.PREVIEW_JPG);
fs.writeFileSync(file, Buffer.from([255, 216, 255, 217]));
const fixture = { file, renders: 0, broken: false, requests: [] as { ids: string[]; width: number }[] };
(globalThis as any).motionQaFixture = fixture;
const bundled = await build({
  entryPoints: [VT.SRC_SERVER_SERVICES_MOTIONGENSERVICE_TS],
  bundle: true,
  platform: VT.NODE,
  format: VT.ESM,
  packages: VT.EXTERNAL,
  write: false,
  plugins: [
    {
      name: VT.QA_FIXTURES,
      setup(builder) {
        builder.onLoad({ filter: VT.MOTION_RENDER_MODULE_RE }, () => ({ contents: RT.EXPORT_CONST_OPENSTILLSESSION_ASYNC_CLOSE_ASYNC_RENDER_ASYNC_SPEC_PICK, loader: VT.TS }));
        builder.onLoad({ filter: VT.MOTION_ASSET_LIBRARY_MODULE_RE }, () => ({ contents: VT.EXPORT_CONST_ENSUREMOTIONLIBRARY_ASYNC_EXPORT_CONST_ENSURELI, loader: VT.TS }));
      },
    },
  ],
});
const modulePath = path.resolve(VT.SCRATCH_MOTION_ADVISORY_QA_TEST_MJS);
fs.mkdirSync(path.dirname(modulePath), { recursive: true });
fs.writeFileSync(modulePath, bundled.outputFiles[0].text);
try {
  const { buildScenes } = await import(pathToFileURL(modulePath).href);
  const analysis = { title: VT.TABLETOP, logline: VT.TWO_OBJECTS, look: VT.CLEAN, cast: [], places: [{ key: VT.ROOM, name: VT.ROOM_2, description: VT.TABLETOP, interior: true }], chapters: [], facts: [] };
  const script = { title: VT.OBJECTS, language: VT.EN, beats: [{ id: VT.B1, chapterId: VT.C1, narration: VT.A_BLUE_OBJECT_RESTS_ON_THE_TABLE, visual: VT.SCENE, place: VT.ROOM }] };
  const calls: string[] = [];
  const prompts: { prompt: string; artifact: string }[] = [];
  const referenceProfile = {
    description: RT.FLAT_REFERENCE_WITH_WHITE_CIRCULAR_FACES_AND_MINIMAL_SETS,
    palette: [VT.FFFFFF, VT.VALUE_111111],
    outlineWidth: 0.02,
    kit: { render: { mode: RT.FLAT, shadingTones: RT.VALUE_1 }, character: { headShape: RT.WHITE_CIRCLE, hair: RT.NONE, eyes: RT.BLACK_OVALS }, background: { detail: RT.SPARSE_FLAT_SHAPES } },
    images: [{ name: RT.STYLE_REFERENCE_1, role: VT.STYLE, details: RT.WHITE_CIRCLE_FACE_AND_BLACK_OVAL_FEATURES, subjects: [] }],
  };
  const ai = async (_prompt: string, artifact: string) => {
    calls.push(artifact);
    prompts.push({ prompt: _prompt, artifact });
    if (artifact === C.ARTIFACT_BIBLE) return { style: { notes: VT.FLAT_SHAPES }, cast: {} };
    if (artifact === C.ARTIFACT_LOCATION) return { location: { interior: true, nodes: [{ shape: VT.BOX, name: VT.TABLE, size: [2, 1, 1], pos: [0, 0.5, 0], mat: { color: VT.VALUE_506080 } }], stage: { center: [0, 0], size: [8, 8] }, camera: { pos: [0, 2, 6], target: [0, 0.5, 0] } } };
    if (artifact === C.ARTIFACT_STAGING) return { beats: [{ id: VT.B1, location: VT.ROOM, actors: [], props: [], cameras: [{ shot: VT.WIDE, move: VT.STATIC }] }] };
    if (artifact === C.ARTIFACT_LOCATION_REVIEW) return { score: 1, issues: [VT.REFERENCE_STYLE_COULD_BE_CLOSER] };
    return { beats: [{ id: VT.B1, ok: false, fix: VT.IMPROVE_COMPOSITION, locationFix: VT.MORE_DETAIL }] };
  };
  const result = await buildScenes(script, analysis, { exec: {}, log: () => {}, ai });
  assert.deepEqual(result.gen.failed, []);
  assert.equal(calls.filter((artifact) => artifact === C.ARTIFACT_LOCATION).length, 1);
  assert.equal(calls.filter((artifact) => artifact === C.ARTIFACT_STAGING).length, 1);
  assert.equal(result.gen.previews.b1.score, undefined);
  assert.equal(calls.includes(C.ARTIFACT_LOCATION_REVIEW), false);
  assert.ok(result.gen.previews.b1.file);
  fixture.requests.length = 0;
  calls.length = 0;
  const snapshots: any[] = [];
  const withoutPreviews = { ...result, gen: { ...result.gen, previews: {} } };
  const thumbnails = await buildScenes(withoutPreviews, analysis, { exec: {}, log: () => {}, ai, skipPreviews: true, partial: (value: any) => value && snapshots.push(value) });
  assert.ok(thumbnails.gen.previews.b1.file, RT.AUTO_EXPORT_MUST_STILL_POPULATE_SCENE_CARDS);
  assert.equal(thumbnails.gen.previews.b1.files.length, 1, RT.ONE_REPRESENTATIVE_FRAME_IS_SUFFICIENT_FOR_THE_SCENE_THUMBNAIL);
  assert.ok(fixture.requests.some((request) => request.ids.some((id) => id.startsWith(VT.B1)) && request.ids.length === 1 && request.width === C.THUMBNAIL_WIDTH));
  assert.equal(calls.filter((artifact) => artifact === C.ARTIFACT_LOCATION || artifact === C.ARTIFACT_STAGING).length, 0, RT.MISSING_THUMBNAILS_MUST_NOT_REDRAW_OR_RESTAGE_ALREADY_BUILT_SCENES);
  assert.ok(
    snapshots.some((snapshot) => snapshot.gen?.previews?.b1?.file),
    RT.PUBLISH_THUMBNAIL_UPDATES_TO_THE_UI,
  );
  fixture.requests.length = 0;
  const kept = await buildScenes(thumbnails, analysis, { exec: {}, log: () => {}, ai, skipPreviews: true });
  assert.equal(kept.gen.previews.b1.file, thumbnails.gen.previews.b1.file);
  assert.equal(fixture.requests.filter((request) => request.ids.some((id) => id.startsWith(VT.B1))).length, 0, RT.REUSE_EXISTING_THUMBNAILS_WHEN_THE_SCENE_HAS_NOT_CHANGED);
  const storedLocation = Object.values(result.gen.assetSources || {})[0];
  assert.ok(storedLocation, RT.THE_FIXTURE_HAS_A_SAVED_LOCATION_THAT_COULD_OTHERWISE_BE_REUSED);
  calls.length = 0;
  const freshAnalysis = { ...analysis, libraryMode: MOTION_SCENE_LIBRARY_MODES.OFF, places: [{ ...analysis.places[0], reuse: storedLocation }] };
  await buildScenes(script, freshAnalysis, { exec: {}, log: () => {}, ai });
  assert.equal(calls.filter((artifact) => artifact === C.ARTIFACT_LOCATION).length, 1, RT.DRAW_NEW_MODE_MUST_IGNORE_REUSE_FIELDS_LEFT_OVER_FROM_AN_OLDER_ANALYSI);
  const reference = { name: VT.STYLE_PNG, dataUrl: VT.DATA_IMAGE_PNG_BASE64_IVBORW0KGGOAAAANSUHEUGAAAAEAAAABCAQAAA };
  const styled = await buildScenes(script, { ...analysis, referenceStyle: { ...referenceProfile, description: RT.OLD_STYLE_MARKER } } as any, {
    exec: {},
    log: () => {},
    characterMotion: true,
    styleReferences: [reference],
    ai: async (prompt, artifact, _exec, _signal, _log, images) => {
      if (artifact === MOTION_STORY_CONFIG.ARTIFACT_STYLE) {
        assert.equal(images?.length, 1);
        return { referenceStyle: referenceProfile };
      }
      assert.ok(prompt.includes(VT.AUTHORITATIVE_CHARACTER_MOTION_ENABLED));
      assert.ok((images || []).every((image) => !image.name.startsWith(VT.STYLE_REFERENCE) && fs.existsSync(image.path)));
      return ai(prompt, artifact);
    },
  });
  assert.equal(styled.gen.characterMotion, true);
  assert.deepEqual(styled.gen.failed, []);
  const locationPrompt = prompts.filter((item) => item.artifact === C.ARTIFACT_LOCATION).at(-1)!.prompt;
  assert.ok(locationPrompt.endsWith(MOTION_REFERENCE_PROMPTS.DRAW_STYLE(normalizeMotionReferenceStyle(referenceProfile), VT.LOCATION, VT.VALUE_3D)), RT.REPEAT_THE_ACTUAL_UPLOADED_REFERENCE_REQUIREMENTS_AFTER_GENERIC_DSL_EX);
  assert.ok(!locationPrompt.includes(RT.OLD_STYLE_MARKER), RT.THE_CURRENT_IMAGES_MUST_REPLACE_A_STALE_ANALYSIS_STYLE);
  const characterContract = MOTION_REFERENCE_PROMPTS.DRAW_STYLE(referenceProfile, VT.CHARACTER, VT.VALUE_2D);
  assert.ok(characterContract.includes(RT.HAIR_NONE) && characterContract.includes(RT.CONTINUOUS_AND_UNOBSTRUCTED));
  assert.ok(characterContract.includes(RT.AT_LEAST_32_SEGMENTS), RT.SMOOTH_FLAT_FACES_MUST_NOT_BECOME_COARSE_GEOMETRIC_FEATURES);
  fixture.broken = true;
  const rendersBefore = fixture.renders;
  calls.length = 0;
  const broken = await buildScenes(script, analysis, { exec: {}, log: () => {}, ai, review: false });
  assert.deepEqual(broken.gen.failed, [VT.B1]);
  assert.equal(calls.filter((artifact) => artifact === C.ARTIFACT_STAGING).length, 1);
  assert.ok(fixture.renders - rendersBefore >= C.AUTO_RESTAGE_ATTEMPTS + 1);
  process.stdout.write(VT.ADVISORY_QA_PASSED_LOW_SCORES_RETAIN_VALID_SCENES_RENDER_FAI);
} finally {
  fs.unlinkSync(modulePath);
  fs.rmSync(directory, { recursive: true, force: true });
  delete (globalThis as any).motionQaFixture;
}
