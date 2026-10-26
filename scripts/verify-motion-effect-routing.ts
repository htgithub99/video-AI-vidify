import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
import { VISUAL_QA as T } from "./motionVisualContractVerificationTexts.js";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(T.HTML);
  await page.addScriptTag({ content: T.EVALUATE_HELPER });
  for (const file of T.FILES) await page.addScriptTag({ content: (await fs.readFile(file, T.UTF8)).replace(T.HOOK, T.EXPOSE) });
  const result = await page.evaluate((values) => {
    const win = window as any,
      api = win.MotionEngine.visualTest,
      constants = win.MotionEngineText.PUPPET;
    const source = { x: 100, y: 450, scale: 1 },
      target = { x: 800, y: 100, scale: 1 },
      feet = { x: 800, y: 450, scale: 1 };
    const route = (mode: string, valid: boolean, reverse: boolean) => {
      let path: number[][] = [];
      const strokes: number[][][] = [];
      const gradient = { addColorStop() {} };
      const context: any = { W: 960, H: 540 };
      const g: any = {
        beginPath() {
          path = [];
        },
        moveTo(x: number, y: number) {
          path.push([x, y]);
        },
        lineTo(x: number, y: number) {
          path.push([x, y]);
        },
        stroke() {
          strokes.push(path);
        },
        fillRect() {},
        createRadialGradient() {
          return gradient;
        },
        createLinearGradient() {
          return gradient;
        },
      };
      const points = [
        [values.A, target],
        [values.B, { x: 10, y: 20, scale: 1 }],
      ] as const;
      const state: any = { style: { vignette: 0 }, view: null, emitters: { [values.PROP]: source }, targets: valid ? Object.fromEntries(reverse ? [...points].reverse() : points) : {}, feet: { [values.A]: feet } };
      api.drawOverlays(g, context, state, { overlays: [constants.S.SMOKE], effectSource: values.PROP, effectTarget: values.A, effectMode: mode }, 3);
      return strokes;
    };
    const toward = route(constants.EFFECT.toward, true, false),
      reversed = route(constants.EFFECT.toward, true, true),
      ground = route(constants.EFFECT.ground, true, false),
      missing = route(constants.EFFECT.toward, false, false);
    const stage: any = { targets: {}, effectContext: null };
    const transformed: any = { getTransform: () => ({ a: 2, b: 0, c: 0, d: 2, e: 30, f: 40 }) };
    stage.effectContext = transformed;
    api.effectPoint(transformed, stage, values.A, 20, 30, constants.EFFECT.targets);
    return { toward, reversed, ground, missing, transformed: stage.targets[values.A], source, target, feet };
  }, T);
  assert.equal(result.toward.length, 3);
  assert.deepEqual(result.toward, result.reversed);
  for (const stroke of result.toward) {
    assert.deepEqual(stroke[0], [result.source.x, result.source.y]);
    assert.ok(Math.abs(stroke.at(-1)![0] - result.target.x) < 0.0001);
    assert.ok(Math.abs(stroke.at(-1)![1] - result.target.y) < 0.0001);
  }
  for (const stroke of result.ground) {
    assert.ok(stroke.every((point) => Math.abs(point[1] - result.feet.y) < 5));
    assert.ok(Math.abs(stroke.at(-1)![0] - result.feet.x) < 0.0001);
  }
  assert.deepEqual(result.missing, []);
  assert.equal(result.transformed.x, 70);
  assert.equal(result.transformed.y, 100);
  process.stdout.write(T.ENGINE_PASSED);
} finally {
  await browser.close();
}
