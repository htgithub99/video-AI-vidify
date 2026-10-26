import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
import { COMFORT_QA as V } from "./motionComfortVerificationTexts.js";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(V.HTML);
  for (const file of V.MOTION_ENGINE) await page.addScriptTag({ content: (await fs.readFile(file, V.UTF8)).replace(V.HOOK, V.EXPOSE) });
  const result = await page.evaluate((values) => {
    const win = window as any,
      me = win.MotionEngine,
      k = win.MotionEngineText.PUPPET;
    const samples = [1, 4, 7, 8, 12, 45, 90].map((duration) => ({ duration, progress: me.puppetCameraProgress({ start: 10, end: 10 + duration }, 10 + duration) }));
    const rates = values.MOVES.map((move) => {
      let maximumRate = 0;
      const frame = { start: 0, end: k.CAMERA_PACE.seconds, camera: { move } };
      const box = { cx: 0, cy: 0, h: 1 };
      let before = me.comfortCamera(box, frame, 0);
      for (let t = 0.05; t <= frame.end; t += 0.05) {
        const current = me.comfortCamera(box, frame, me.puppetCameraProgress(frame, t));
        maximumRate = Math.max(maximumRate, Math.abs(current.h - before.h) / 0.05, Math.abs(current.cx - before.cx) / 0.05);
        before = current;
      }
      return { move, maximumRate };
    });
    return { samples, rates, defaultMove: k.MOVE.none, changed: k.TRANSITION, same: k.SAME_SCENE_TRANSITION, pace: k.CAMERA_PACE };
  }, V);
  assert.deepEqual(result.defaultMove, [1, 1]);
  for (const sample of result.samples) assert.equal(sample.progress, sample.duration < result.pace.minimumShot ? 0 : Math.min(sample.duration / result.pace.seconds, 1));
  assert.ok(result.rates.every((rate: any) => rate.maximumRate < 0.0006));
  assert.ok(result.same.duration >= 1 && result.changed.duration >= 1.5);
  process.stdout.write(V.CAMERA_PASSED);
} finally {
  await browser.close();
}
