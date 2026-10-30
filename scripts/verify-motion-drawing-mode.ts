import { MOTION_VERIFICATION_TEXTS as VT, MOTION_VERIFICATION_FORMATS as VF } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";
import { prepareMotionGen } from "../src/server/services/motionGenService.ts";
import { compileStorySpec } from "../src/features/motion/server/services/motionDirectorService.ts";
import { buildMotionRenderHtml, MOTION_ASSET_BASE, resolveMotionAsset } from "../src/features/motion/server/services/motionEngineService.ts";
const analysis: any = { title: VT.OBJECT_ONLY_2, logline: VT.AN_OBJECT_CHANGES, look: VT.CLEAN, cast: [], places: [], language: VT.EN };
const previous = prepareMotionGen(undefined, analysis, VT.VALUE_3D);
previous.locations.room = { nodes: [] };
previous.previews.old = { file: VT.OLD_JPG } as any;
assert.equal(prepareMotionGen(previous, analysis, VT.VALUE_3D).locations.room !== undefined, true);
const flat = prepareMotionGen(previous, analysis, VT.VALUE_2D);
assert.deepEqual(flat.locations, {}, VT.DIMENSION_CHANGES_INVALIDATE_OBJECT_ONLY_SCENES_TOO);
assert.deepEqual(flat.previews, {}, VT.A_3D_REVIEW_CANNOT_CERTIFY_A_2D_IMAGE);
assert.equal(flat.drawingMode, VT.VALUE_2D);
assert.equal(prepareMotionGen(undefined, analysis).drawingMode, VT.VALUE_3D);
const story: any = { title: VT.TEST, language: VT.EN, gen: flat, beats: [{ id: VT.A_2, visual: VT.TITLE, label: VT.TEST_3, narration: VT.TEST, duration: 3 }] };
assert.equal(compileStorySpec(story, analysis, { aspect: VT.VALUE_16_9 }).spec.gen?.drawingMode, VT.VALUE_2D);
const spec = JSON.parse(fs.readFileSync(process.argv[2] || VT.MOTION_ENGINE_DEMO_EDITORIAL_QA_JSON, VT.UTF8));
if (!process.argv[2]) {
  spec.shots = [{ id: VT.STYLE, template: VT.GEN3D, start: 0, end: 3, params: { location: VT.STUDIO, actors: [{ cast: VT.PERSON0, at: [0, 0], face: 0, action: VT.STAND }], cameras: [{ shot: VT.MEDIUM, move: VT.DOLLY_IN, amount: 0.3 }] } }];
  spec.duration = 3;
}
const dir = VT.SCRATCH_DRAWING_MODE_CHECK;
fs.mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ channel: VT.CHROME, headless: true });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on(VT.PAGEERROR, (error) => errors.push(error.message));
  await page.route(MOTION_ASSET_BASE + VT.EMPTY_4, async (route) => {
    const file = resolveMotionAsset(new URL(route.request().url()).pathname);
    await route.fulfill({ status: file ? 200 : 404, body: file ? fs.readFileSync(file) : VT.EMPTY_2, headers: { "Access-Control-Allow-Origin": VT.EMPTY_6 } });
  });
  await page.setContent(buildMotionRenderHtml(spec));
  await page.evaluate(() => {
    const engine = (window as any).MotionEngine;
    const build = engine.GEN.buildShot;
    engine.GEN.buildShot = (...args: any[]) => {
      const shot = build(...args);
      (window as any).__drawingShot = shot;
      return shot;
    };
  });
  const pictures: string[] = [];
  const pixels: number[][] = [];
  for (const mode of [VT.VALUE_3D, VT.VALUE_2D, VT.VALUE_3D] as const) {
    spec.gen.drawingMode = mode;
    await page.evaluate(async (spec) => (window as any).__load(spec, { supersample: 1, motionBlur: 1, bloom: false, grain: false, layerScale: 1 }, 960, 540), spec);
    const result = await page.evaluate(
      (VT) => {
        const frame = (window as any).__still(1, 0.86);
        const shot = (window as any).__drawingShot;
        let flat = 0,
          physical = 0;
        shot.scene.traverse((o: any) => {
          if (!o.isMesh) return;
          for (const mat of Array.isArray(o.material) ? o.material : [o.material]) {
            if (mat.isMeshBasicMaterial) flat++;
            if (mat.isMeshStandardMaterial) physical++;
          }
        });
        const thumbnail = document.createElement(VT.CANVAS);
        thumbnail.width = 32;
        thumbnail.height = 18;
        const ctx = thumbnail.getContext(VT.VALUE_2D)!;
        ctx.drawImage(document.querySelector(VT.CANVAS)!, 0, 0, 32, 18);
        return { pixels: Array.from(ctx.getImageData(0, 0, 32, 18).data), img: frame.img, flat, physical, orthographic: !!shot.camera.isOrthographicCamera, zoom: shot.camera.zoom, fx: !!shot.composer };
      },
      { CANVAS: VT.CANVAS, VALUE_2D: VT.VALUE_2D },
    );
    assert.equal(result.orthographic, mode === VT.VALUE_2D);
    if (mode === VT.VALUE_2D) {
      assert.ok(result.flat > 0);
      assert.equal(result.physical, 0);
      assert.equal(result.fx, false);
      assert.ok(Number.isFinite(result.zoom) && result.zoom > 0);
    } else assert.ok(result.physical > 0);
    pictures.push(result.img);
    pixels.push(result.pixels);
    fs.writeFileSync(VF.RENDERED_MODE_FILE(dir, mode), Buffer.from(result.img, VT.BASE64));
  }
  assert.notEqual(pictures[0], pictures[1], VT.CHANGING_DIMENSION_MUST_CHANGE_THE_ACTUAL_RENDERED_FRAME);
  const meanDifference = (a: number[], b: number[]) => a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0) / a.length;
  const restoredDifference = meanDifference(pixels[0], pixels[2]);
  assert.ok(restoredDifference < 3, VF.RESTORED_SHADING_MESSAGE(restoredDifference));
  assert.ok(meanDifference(pixels[0], pixels[1]) > 5, VT.FLAT_ILLUSTRATION_MUST_VISIBLY_DIFFER_FROM_PHYSICAL_SHADING);
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
process.stdout.write(VT.DRAWING_MODE_PASSED_DEFAULT_3D_CACHE_REVIEW_INVALIDATION_COMPILATION_FLA + VT.EMPTY);
