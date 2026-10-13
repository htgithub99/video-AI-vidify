import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";
import { buildMotionRenderHtml, MOTION_ASSET_BASE, resolveMotionAsset } from "../src/server/services/motionEngineService.ts";
const spec = JSON.parse(fs.readFileSync(VT.MOTION_ENGINE_DEMO_EDITORIAL_QA_JSON, VT.UTF8));
spec.gen.style = { outlineColor: VT.VALUE_101010, outlineWidth: 0.04 };
spec.shots = [spec.shots[0]];
const browser = await chromium.launch({ channel: VT.CHROME, headless: true });
try {
  const page = await browser.newPage();
  await page.route(MOTION_ASSET_BASE + VT.EMPTY_4, async (route) => {
    const file = resolveMotionAsset(new URL(route.request().url()).pathname);
    await route.fulfill({ status: file ? 200 : 404, body: file ? fs.readFileSync(file) : VT.EMPTY_2, headers: { "Access-Control-Allow-Origin": VT.EMPTY_6 } });
  });
  await page.setContent(buildMotionRenderHtml(spec));
  await page.evaluate(VT.WINDOW_NAME_FN_FN);
  const checks = await page.evaluate(
    async ({ payload: spec, texts: VT }) => {
      const engine = (window as any).MotionEngine,
        G = engine.GEN,
        T = G.T;
      const actor = spec.shots[0].params.actors[0];
      actor.action = VT.WALK;
      actor.moveTo = [0, 0];
      actor.moveStart = 0;
      actor.moveEnd = 1;
      spec.gen.cast[actor.cast].motions = {
        walk: {
          duration: 3,
          loop: true,
          tracks: [
            {
              part: VT.ARM_LEFT,
              keys: [
                { t: 0, rot: [0, 0, -25] },
                { t: 1.5, rot: [0, 0, 25] },
                { t: 3, rot: [0, 0, -25] },
              ],
            },
          ],
        },
      };
      await G.prepare(spec, VT.HTTPS_MOTION_ASSETS_LOCAL);
      const result = [];
      for (const drawingMode of [VT.VALUE_2D, VT.VALUE_3D])
        for (const enabled of [false, true]) {
          const current = JSON.parse(JSON.stringify(spec));
          current.gen.drawingMode = drawingMode;
          current.gen.characterMotion = enabled;
          const canvas = document.createElement(VT.CANVAS);
          canvas.width = 640;
          canvas.height = 360;
          const context = { spec: current, W: 640, H: 360, dur: 3, preview: true, quality: { bloom: false } };
          const shot = G.buildShot(context, current.shots[0].params, { noFx: true });
          let ink = 0;
          shot.actors[0].actor.group.traverse((object) => {
            if (object.material?.side === T.BackSide && object.material?.color?.getHexString() === VT.VALUE_101010_2) ink++;
          });
          const positions = [];
          const rotations = [];
          const frames = [];
          for (const time of [0, 1.5, 0]) {
            G.drawShot(canvas.getContext(VT.VALUE_2D), context, shot, time);
            positions.push(shot.actors[0].actor.group.position.x);
            rotations.push(shot.actors[0].actor.parts.arm_left.rotation.z);
            frames.push(canvas.toDataURL());
          }
          result.push({ drawingMode, enabled, ink, positions, rotations, first: frames[0], middle: frames[1], seek: frames[2], orthographic: shot.camera.isOrthographicCamera === true });
          G.disposeShot(shot);
        }
      return result;
    },
    { payload: spec, texts: VT },
  );
  for (const check of checks) {
    assert.ok(check.ink > 0);
    assert.equal(check.orthographic, check.drawingMode === VT.VALUE_2D);
    assert.equal(check.positions[0], check.positions[2]);
    if (check.enabled) {
      assert.notEqual(check.positions[0], check.positions[1]);
      assert.notEqual(check.rotations[0], check.rotations[1]);
      assert.ok(check.first !== check.middle, `${check.drawingMode}${VT.MOTION_FRAME_UNCHANGED}`);
    } else {
      assert.equal(check.positions[0], check.positions[1]);
      assert.equal(check.rotations[0], check.rotations[1]);
      assert.ok(check.first === check.middle, `${check.drawingMode}${VT.STATIC_FRAME_CHANGED}`);
    }
    assert.ok(check.first === check.seek, `${check.drawingMode}${VT.EMPTY_7}${check.enabled}${VT.SEEKING_CHANGED_FRAME}`);
  }
  process.stdout.write(VT.RENDERER_CONTROLS_PASSED_IN_CHROME_2D_3D_REFERENCE_OUTLINES_);
} finally {
  await browser.close();
}
