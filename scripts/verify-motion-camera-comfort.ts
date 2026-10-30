import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { chromium } from "playwright";
import { motionCameraFrame, type MotionCameraMode } from "../src/lib/motionCamera.js";
import { getMotionEngineClientScript } from "../src/features/motion/server/services/motionEngineService.js";
const modes: MotionCameraMode[] = ["push", "pull", "left", "right", "up", "down"];
let samples = 0;
for (const [width, height] of [
  [1280, 720],
  [720, 1280],
  [1080, 1080],
  [1080, 1350],
]) {
  for (const duration of [1, 2, 4, 8, 12, 60])
    for (const mode of modes) {
      for (const protectedRects of [[], [{ x: width * 0.1, y: height * 0.1, width: width * 0.8, height: height * 0.8 }], [{ x: 0, y: height * 0.2, width: width * 0.25, height: height * 0.6 }]]) {
        const input = { enabled: true, start: 120, end: 120 + duration, width, height, seed: "shot", mode, protectedRects };
        let before = motionCameraFrame({ ...input, seconds: 120 });
        for (let frame = 0; frame <= duration * 60; frame++) {
          const current = motionCameraFrame({ ...input, seconds: 120 + frame / 60 });
          const x = (width / 2) * (1 - current.scale) + current.x;
          const y = (height / 2) * (1 - current.scale) + current.y;
          assert.ok(x <= 1e-6 && y <= 1e-6 && x + width * current.scale >= width - 1e-6 && y + height * current.scale >= height - 1e-6, "no empty borders");
          for (const rect of protectedRects) {
            assert.ok(x + rect.x * current.scale >= -1e-6 && x + (rect.x + rect.width) * current.scale <= width + 1e-6);
            assert.ok(y + rect.y * current.scale >= -1e-6 && y + (rect.y + rect.height) * current.scale <= height + 1e-6);
          }
          assert.ok((Math.abs(current.x - before.x) * 60) / width <= 0.0056 + 1e-6);
          assert.ok((Math.abs(current.y - before.y) * 60) / height <= 0.0056 + 1e-6);
          assert.ok(Math.abs(current.scale - before.scale) * 60 <= 0.0056 + 1e-6);
          before = current;
          samples++;
        }
        assert.deepEqual(motionCameraFrame({ ...input, enabled: false, seconds: 125 }), { scale: 1, x: 0, y: 0, mode });
        assert.deepEqual(motionCameraFrame({ ...input, seconds: 124 }), motionCameraFrame({ ...input, seconds: 124 }));
        if (duration >= 2 && !protectedRects.length) assert.notDeepEqual(motionCameraFrame({ ...input, seconds: input.start }), motionCameraFrame({ ...input, seconds: input.end }));
      }
    }
}
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.addScriptTag({ content: getMotionEngineClientScript() });
  const results = await page.evaluate((modes) => modes.map((mode) => (window as any).MotionEngine.cameraFrame({ enabled: true, seconds: 8, start: 0, end: 12, width: 1280, height: 720, seed: "test", mode })), modes);
  for (const [index, mode] of modes.entries()) assert.deepEqual(results[index], motionCameraFrame({ enabled: true, seconds: 8, start: 0, end: 12, width: 1280, height: 720, seed: "test", mode }));
  if (process.argv.includes("--render")) {
    const { renderRemotionStill } = await import("../src/features/motion/server/services/motionRemotionRenderService.js");
    const production = JSON.parse(await fs.readFile("storage/output/motion-video/productions/0171ab25909369c6e9f2ca0dec29ff64.json", "utf8"));
    const document = production.result?.compiled?.spec || production.compiled?.spec;
    assert.ok(document?.scenes?.length, "stored compiled document required");
    const scene = document.scenes.find((s: any) => s.composition);
    assert.ok(scene);
    const out = "scratch/motion-camera-20261029";
    await fs.mkdir(out, { recursive: true });
    for (const camera of ["fixed", "gentle"]) {
      const hashes: string[] = [];
      for (const frame of [scene.startFrame, scene.endFrame - 1]) {
        const file = `${out}/${camera}-${frame}.png`;
        await renderRemotionStill({ ...document, renderBehavior: { version: 1, actors: "fixed", sceneEffects: "off", camera } }, file, frame);
        hashes.push(
          createHash("sha256")
            .update(await fs.readFile(file))
            .digest("hex"),
        );
      }
      assert.equal(hashes[0] === hashes[1], camera === "fixed", "real Remotion output obeys Camera independently of actors/effects");
    }
    process.stdout.write(`Saved real Remotion frame pairs to ${out}`);
  }
} finally {
  await browser.close();
}
process.stdout.write(`Camera comfort passed: ${samples} samples, 6 directions, four aspects, bounded speed, subject protection, no empty borders, fixed off, seek and serialized Canvas parity.`);
