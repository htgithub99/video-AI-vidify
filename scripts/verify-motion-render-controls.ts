import { RUNTIME_VERIFICATION_TEXTS as RT, RUNTIME_VERIFICATION_FORMATS as RF } from "./runtimeVerificationTexts.ts";
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
  const propsBuilt = await page.evaluate(
    ({ VT, RT }) => {
      const G = (window as any).MotionEngine.GEN,
        T = G.T;
      const location = G.validateLocation({
        stage: { center: [0, 0], size: [8, 8] },
        defs: { oil_lamp: [{ shape: VT.USE, ref: RT.LAMP_BODY }], lamp_body: [{ shape: VT.BOX, size: [0.2, 0.3, 0.2], mat: { color: RT.CC7700 } }] },
        nodes: [],
      }).value;
      const validated = G.validateStaging(
        {
          location: VT.ROOM,
          props: [
            { shape: VT.USE, ref: RT.OIL_LAMP, pos: [1, 1, 0] },
            { shape: VT.LIGHT, type: RT.POINTLIGHT },
          ],
        },
        { locations: { room: location }, cast: [] },
      );
      const root = new T.Scene();
      const env = G.newBuildEnv({ materials: location.materials, defs: location.defs, root });
      G.buildNodes(validated.value.props, env, root);
      let meshes = 0,
        pointLights = 0;
      root.traverse((object: any) => {
        if (object.isMesh) meshes++;
        if (object.isPointLight) pointLights++;
      });
      G.disposeEnv(env);
      return { errors: validated.errors, meshes, pointLights };
    },
    { VT: { USE: VT.USE, BOX: VT.BOX, ROOM: VT.ROOM, LIGHT: VT.LIGHT }, RT: { LAMP_BODY: RT.LAMP_BODY, CC7700: RT.CC7700, OIL_LAMP: RT.OIL_LAMP, POINTLIGHT: RT.POINTLIGHT } },
  );
  assert.deepEqual(propsBuilt, { errors: [], meshes: 1, pointLights: 1 }, RT.VALIDATED_NESTED_LOCATION_REFS_AND_NORMALIZED_LIGHTS_MUST_BUILD_REAL_R);
  const framing = await page.evaluate(
    ({ VT, RT }) => {
      const G = (window as any).MotionEngine.GEN;
      return [VT.VALUE_2D, VT.VALUE_3D].map((drawingMode) => {
        const payload = {
          gen: {
            drawingMode,
            cast: {
              speaker: {
                parts: [
                  { id: VT.BODY, pos: [0, 0.25, 0], nodes: [{ shape: VT.BOX, size: [0.45, 0.5, 0.05], mat: { color: RT.VALUE_5A6068, unlit: true } }] },
                  { id: VT.HEAD, pos: [0, 0.8, 0], nodes: [{ shape: VT.DISC, radius: 0.3, mat: { color: RT.EEF3F6, unlit: true } }] },
                ],
                anchors: { body: VT.BODY, head: VT.HEAD },
                poses: { idle: {} },
              },
            },
            locations: {
              yard: {
                ground: { none: true },
                nodes: [],
                stage: { center: [0, 2.5], size: [10, 20] },
                camera: { pos: [0, 2.65, 12.8], target: [0, 1.9, -0.35], fov: 34 },
              },
            },
          },
        };
        const shot = G.buildShot(
          { spec: payload, W: 640, H: 360, dur: 6, preview: true },
          {
            location: RT.YARD,
            actors: [{ cast: RT.SPEAKER, at: [0, 2.5], face: 0 }],
            camera: { shot: VT.MEDIUM, focus: RT.SPEAKER, pos: [0, 2.65, 12.8], target: [0, 1.9, -0.35], fov: 34 },
          },
          { noFx: true },
        );
        const head = shot.actors[0].actor.anchor(VT.HEAD).project(shot.camera);
        const result = { drawingMode, cameraZ: shot.camera.position.z, head: head.toArray(), issues: shot.issues };
        G.disposeShot(shot);
        return result;
      });
    },
    { VT: { VALUE_2D: VT.VALUE_2D, VALUE_3D: VT.VALUE_3D, BODY: VT.BODY, BOX: VT.BOX, HEAD: VT.HEAD, DISC: VT.DISC, MEDIUM: VT.MEDIUM }, RT: { VALUE_5A6068: RT.VALUE_5A6068, EEF3F6: RT.EEF3F6, YARD: RT.YARD, SPEAKER: RT.SPEAKER } },
  );
  for (const result of framing) {
    assert.ok(result.cameraZ > 2.8 && result.cameraZ < 12.8, RF.ZOOM_MESSAGE(result.drawingMode));
    assert.ok(result.head.every(Number.isFinite) && Math.abs(result.head[0]) < 1 && Math.abs(result.head[1]) < 1 && Math.abs(result.head[2]) < 1, RF.HEAD_VISIBLE_MESSAGE(result.drawingMode));
    assert.ok(!result.issues.some((issue: string) => issue.includes(RT.MOSTLY_OUT_OF_FRAME)));
  }
  const skyPixel = await page.evaluate(
    ({ VT, RT }) => {
      const G = (window as any).MotionEngine.GEN;
      const payload = {
        gen: {
          drawingMode: VT.VALUE_2D,
          style: { grade: VT.NEUTRAL },
          locations: {
            sky: {
              time: VT.NIGHT,
              sky: { top: RT.VALUE_9AA3AB, horizon: RT.VALUE_9AA3AB, city: 0, stars: false },
              ground: { none: true },
              nodes: [],
              stage: { center: [0, 0], size: [8, 8] },
              camera: { pos: [0, 1, 6], target: [0, 1, 0], fov: 40 },
            },
          },
        },
      };
      const canvas = document.createElement(VT.CANVAS);
      canvas.width = 320;
      canvas.height = 180;
      const ctx = { spec: payload, W: 320, H: 180, dur: 3, preview: true, quality: { bloom: false } };
      const shot = G.buildShot(ctx, { location: RT.SKY, actors: [], camera: { shot: VT.WIDE } }, { noFx: true });
      G.drawShot(canvas.getContext(VT.VALUE_2D), ctx, shot, 0);
      const pixel = [...canvas.getContext(VT.VALUE_2D).getImageData(160, 60, 1, 1).data];
      G.disposeShot(shot);
      return pixel;
    },
    { VT: { VALUE_2D: VT.VALUE_2D, NEUTRAL: VT.NEUTRAL, NIGHT: VT.NIGHT, CANVAS: VT.CANVAS, WIDE: VT.WIDE }, RT: { VALUE_9AA3AB: RT.VALUE_9AA3AB, SKY: RT.SKY } },
  );
  for (const [index, expected] of [154, 163, 171].entries()) assert.ok(Math.abs(skyPixel[index] - expected) <= 4, RF.SKY_COLOUR_MESSAGE(skyPixel));
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
      assert.ok(check.first !== check.middle, RF.MOTION_FRAME_MESSAGE(check.drawingMode, VT.MOTION_FRAME_UNCHANGED));
    } else {
      assert.equal(check.positions[0], check.positions[1]);
      assert.equal(check.rotations[0], check.rotations[1]);
      assert.ok(check.first === check.middle, RF.STATIC_FRAME_MESSAGE(check.drawingMode, VT.STATIC_FRAME_CHANGED));
    }
    assert.ok(check.first === check.seek, RF.SEEK_FRAME_MESSAGE(check.drawingMode, VT.EMPTY_7, check.enabled, VT.SEEKING_CHANGED_FRAME));
  }
  process.stdout.write(VT.RENDERER_CONTROLS_PASSED_IN_CHROME_2D_3D_REFERENCE_OUTLINES_);
} finally {
  await browser.close();
}
