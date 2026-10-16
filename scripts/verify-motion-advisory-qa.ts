import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getMotionRootDirectory } from "../src/server/services/motionLibraryService.ts";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { MOTION_GEN_CONFIG as C } from "../src/constants/motionGenPrompts.ts";
const previewRoot = path.join(getMotionRootDirectory(), VT.GEN_PREVIEW);
fs.mkdirSync(previewRoot, { recursive: true });
const directory = fs.mkdtempSync(path.join(previewRoot, VT.MOTION_QA_TEST));
const file = path.join(directory, VT.PREVIEW_JPG);
fs.writeFileSync(file, Buffer.from([255, 216, 255, 217]));
const fixture = { file, renders: 0, broken: false };
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
        builder.onLoad({ filter: VT.MOTION_RENDER_MODULE_RE }, () => ({ contents: VT.EXPORT_CONST_OPENSTILLSESSION_ASYNC_CLOSE_ASYNC_RENDER_ASYNC, loader: VT.TS }));
        builder.onLoad({ filter: VT.MOTION_ASSET_LIBRARY_MODULE_RE }, () => ({
          contents: VT.EXPORT_CONST_ENSUREMOTIONLIBRARY_ASYNC_EXPORT_CONST_ENSURELI,
          loader: VT.TS,
        }));
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
  const ai = async (_prompt: string, artifact: string) => {
    calls.push(artifact);
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
  const reference = { name: VT.STYLE_PNG, dataUrl: VT.DATA_IMAGE_PNG_BASE64_IVBORW0KGGOAAAANSUHEUGAAAAEAAAABCAQAAA };
  const styled = await buildScenes(script, analysis, {
    exec: {},
    log: () => {},
    characterMotion: true,
    styleReferences: [reference],
    ai: async (prompt, artifact, _exec, _signal, _log, images) => {
      assert.ok(prompt.includes(VT.AUTHORITATIVE_CHARACTER_MOTION_ENABLED));
      assert.ok((images || []).every((image) => !image.name.startsWith(VT.STYLE_REFERENCE) && fs.existsSync(image.path)));
      return ai(prompt, artifact);
    },
  });
  assert.equal(styled.gen.characterMotion, true);
  assert.deepEqual(styled.gen.failed, []);
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
