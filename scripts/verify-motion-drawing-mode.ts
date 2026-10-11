import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";
import { prepareMotionGen } from "../src/server/services/motionGenService.ts";
import { compileStorySpec } from "../src/server/services/motionDirectorService.ts";
import { buildMotionRenderHtml, MOTION_ASSET_BASE, resolveMotionAsset } from "../src/server/services/motionEngineService.ts";
const analysis: any = { title: "Object only", logline: "An object changes", look: "clean", cast: [], places: [], language: "en" };
const previous = prepareMotionGen(undefined, analysis, false, "3d");
previous.locations.room = { nodes: [] };
previous.previews.old = { file: "old.jpg" } as any;
assert.equal(prepareMotionGen(previous, analysis, false, "3d").locations.room !== undefined, true);
const flat = prepareMotionGen(previous, analysis, false, "2d");
assert.deepEqual(flat.locations, {}, "Dimension changes invalidate object-only scenes too");
assert.deepEqual(flat.previews, {}, "A 3D review cannot certify a 2D image");
assert.equal(flat.drawingMode, "2d");
assert.equal(prepareMotionGen(undefined, analysis).drawingMode, "3d");
const story: any = { title: "Test", language: "en", gen: flat, beats: [{ id: "a", visual: "title", label: "TEST", narration: "Test", duration: 3 }] };
assert.equal(compileStorySpec(story, analysis, { aspect: "16:9" }).spec.gen?.drawingMode, "2d");
const spec = JSON.parse(fs.readFileSync(process.argv[2] || "motion-engine/demo/editorial-qa.json", "utf8"));
if (!process.argv[2]) { spec.shots = [{ id: "style", template: "gen3d", start: 0, end: 3, params: { location: "studio", actors: [{ cast: "person0", at: [0, 0], face: 0, action: "stand" }], cameras: [{ shot: "medium", move: "dolly_in", amount: 0.3 }] } }]; spec.duration = 3; }
const dir = "scratch/drawing-mode-check";
fs.mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route(MOTION_ASSET_BASE + "**", async (route) => {
    const file = resolveMotionAsset(new URL(route.request().url()).pathname);
    await route.fulfill({ status: file ? 200 : 404, body: file ? fs.readFileSync(file) : "", headers: { "Access-Control-Allow-Origin": "*" } });
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
  for (const mode of ["3d", "2d", "3d"] as const) {
    spec.gen.drawingMode = mode;
    await page.evaluate(async (spec) => (window as any).__load(spec, { supersample: 1, motionBlur: 1, bloom: false, grain: false, layerScale: 1 }, 960, 540), spec);
    const result = await page.evaluate(() => {
      const frame = (window as any).__still(1, 0.86);
      const shot = (window as any).__drawingShot;
      let flat = 0, physical = 0;
      shot.scene.traverse((o: any) => {
        if (!o.isMesh) return;
        for (const mat of Array.isArray(o.material) ? o.material : [o.material]) {
          if (mat.isMeshBasicMaterial) flat++;
          if (mat.isMeshStandardMaterial) physical++;
        }
      });
      const thumbnail = document.createElement("canvas");
      thumbnail.width = 32;
      thumbnail.height = 18;
      const ctx = thumbnail.getContext("2d")!;
      ctx.drawImage(document.querySelector("canvas")!, 0, 0, 32, 18);
      return { pixels: Array.from(ctx.getImageData(0, 0, 32, 18).data), img: frame.img, flat, physical, orthographic: !!shot.camera.isOrthographicCamera, zoom: shot.camera.zoom, fx: !!shot.composer };
    });
    assert.equal(result.orthographic, mode === "2d");
    if (mode === "2d") { assert.ok(result.flat > 0); assert.equal(result.physical, 0); assert.equal(result.fx, false); assert.ok(Number.isFinite(result.zoom) && result.zoom > 0); } else assert.ok(result.physical > 0);
    pictures.push(result.img);
    pixels.push(result.pixels);
    fs.writeFileSync(`${dir}/${mode}.jpg`, Buffer.from(result.img, "base64"));
  }
  assert.notEqual(pictures[0], pictures[1], "Changing dimension must change the actual rendered frame");
  const meanDifference = (a: number[], b: number[]) => a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0) / a.length;
  const restoredDifference = meanDifference(pixels[0], pixels[2]);
  assert.ok(restoredDifference < 3, `Returning to 3D must restore its shading (mean difference ${restoredDifference})`);
  assert.ok(meanDifference(pixels[0], pixels[1]) > 5, "Flat illustration must visibly differ from physical shading");
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
console.log("Drawing mode passed: default 3D, cache/review invalidation, compilation, flat orthographic render and reversible 2D/3D switching.");
