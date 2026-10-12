import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";
import { buildMotionRenderHtml, MOTION_ASSET_BASE, resolveMotionAsset } from "../src/server/services/motionEngineService.ts";
const spec = JSON.parse(fs.readFileSync("motion-engine/demo/editorial-qa.json", "utf8"));
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  await page.route(MOTION_ASSET_BASE + "**", async (route) => {
    const file = resolveMotionAsset(new URL(route.request().url()).pathname);
    await route.fulfill({ status: file ? 200 : 404, body: file ? fs.readFileSync(file) : "", headers: { "Access-Control-Allow-Origin": "*" } });
  });
  await page.setContent(buildMotionRenderHtml(spec));
  await page.evaluate(async (spec) => (window as any).__load(spec, { supersample: 1, motionBlur: 1, bloom: false, grain: false, layerScale: 1 }, 640, 360), spec);
  await page.evaluate("window.__name = fn => fn");
  const checks = await page.evaluate(() => {
    const G = (window as any).MotionEngine.GEN, T = G.T;
    const sockets = ["head", "neck", "chest", "waist", ...["upperarm", "forearm", "hand", "thigh", "calf", "foot"].flatMap((s) => [s + "_r", s + "_l"])];
    const outfit = { body: "male", height: 1.83, layers: [], drawnBody: sockets.map((socket) => ({ socket, nodes: [{ shape: "box", size: socket === "chest" ? [0.38, 0.42, 0.24] : [0.1, 0.2, 0.1], pos: socket === "chest" ? [0, -0.17, -0.11] : [0, -0.1, 0], mat: { color: "#576575" } }] })) };
    const actor = G.createActor(outfit, {});
    const result: any[] = [];
    const segments = { upperarm_r: ["upperarm_r", "lowerarm_r"], upperarm_l: ["upperarm_l", "lowerarm_l"], forearm_r: ["lowerarm_r", "hand_r"], forearm_l: ["lowerarm_l", "hand_l"], thigh_r: ["thigh_r", "calf_r"], thigh_l: ["thigh_l", "calf_l"], calf_r: ["calf_r", "foot_r"], calf_l: ["calf_l", "foot_l"] };
    for (const pose of ["idle", "sit"]) {
      actor.pose([{ id: pose, weight: 1, time: 0.75 }], 0.75);
      for (const [socket, [from, to]] of Object.entries(segments)) {
        const direction = actor.bones[to].getWorldPosition(new T.Vector3()).sub(actor.bones[from].getWorldPosition(new T.Vector3())).normalize();
        const geometryDirection = new T.Vector3(0, -1, 0).applyQuaternion(actor.model.getObjectByName("drawnBody_" + socket).getWorldQuaternion(new T.Quaternion()));
        result.push({ pose, socket, alignment: direction.dot(geometryDirection) });
      }
      if (pose === "idle") { const bounds = new T.Box3().setFromObject(actor.model.getObjectByName("drawnBody_chest")); const neck = actor.bones.neck_01.getWorldPosition(new T.Vector3()).y; result.push({ pose, torsoTop: bounds.max.y, neck }); }
    }
    actor.dispose();
    let originalVisible = 0, authoredMeshes = 0;
    actor.model.traverse((o: any) => { if (o.isSkinnedMesh && o.visible) originalVisible++; if (o.isMesh && o.visible && !o.isSkinnedMesh) authoredMeshes++; });
    result.push({ originalVisible, authoredMeshes });
    const renderer = new T.WebGLRenderer({ antialias: false });
    renderer.setSize(320, 240);
    const target = new T.WebGLRenderTarget(320, 240);
    const camera = new T.PerspectiveCamera(40, 320 / 240, 0.1, 20);
    camera.position.set(2, 1.5, 3);
    camera.lookAt(0, 1, 0);
    const renderActor = (custom: boolean) => {
      const a = G.createActor({ ...outfit, drawnBody: outfit.drawnBody.map(part => ({ ...part, nodes: part.nodes.map(node => ({ ...node, mat: { color: custom ? "#d35428" : "#28446a" } })) })) }, {});
      const scene = new T.Scene();
      scene.background = new T.Color("#cccccc");
      scene.add(a.group, new T.HemisphereLight("#ffffff", "#888888", 2));
      const light = new T.DirectionalLight("#ffffff", 2);
      light.position.set(2, 3, 3);
      scene.add(light);
      a.pose([{ id: "idle", weight: 1, time: 0.75 }], 0.75);
      G.staticWardrobe(a);
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      const pixels = new Uint8Array(320 * 240 * 4);
      renderer.readRenderTargetPixels(target, 0, 0, 320, 240, pixels);
      a.dispose();
      return pixels;
    };
    const reference = renderActor(false), custom = renderActor(true);
    let different = 0;
    for (let i = 0; i < custom.length; i += 4) if (Math.abs(custom[i] - reference[i]) + Math.abs(custom[i + 1] - reference[i + 1]) + Math.abs(custom[i + 2] - reference[i + 2]) > 60) different++;
    result.push({ renderDifference: different / (320 * 240) });
    actor.dispose();
    renderer.dispose();
    target.dispose();
    return result;
  });
  for (const check of checks) {
    if (check.alignment !== undefined) assert.ok(check.alignment > 0.98, JSON.stringify(check));
    else if (check.authoredMeshes !== undefined) { assert.ok(check.authoredMeshes > 0); assert.equal(check.originalVisible, 0); } else if (check.renderDifference !== undefined) assert.ok(check.renderDifference > 0.01, JSON.stringify(check)); else assert.ok(check.torsoTop >= check.neck - 0.035, JSON.stringify(check));
  }
  console.log("Drawn rig passed: eight limb axes follow the actual posed bones in standing and sitting; torso reaches the neck.");
} finally {
  await browser.close();
}
