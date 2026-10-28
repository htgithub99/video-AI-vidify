import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";
import { buildMotionRenderHtml, MOTION_ASSET_BASE, resolveMotionAsset } from "../src/server/services/motionEngineService.ts";
import { planMotionCoverage } from "../src/lib/motionCoverage.ts";
const cameras = planMotionCoverage({ actors: [], camera: { pos: [0, 1.4, 1], target: [0, 1.2, -2.9] } }, 6);
assert.deepEqual(cameras[1].target, [0, 1.2, -2.9], "Prop-only coverage must preserve its narrative anchor");
const spec = JSON.parse(fs.readFileSync("motion-engine/demo/editorial-qa.json", "utf8"));
const room = spec.gen.locations.studio;
room.stage = { center: [0, 0], size: [3.6, 8] };
room.camera = { pos: [0, 1.5, 3], target: [0, 1.3, 0], fov: 40 };
room.ground = { size: [4, 8], mat: "floor" };
const box = (name: string, pos: number[], size: number[]) => ({ shape: "box", name, pos, size, mat: "wall" });
room.nodes = [box("left", [-1.8, 1.15, 0], [0.1, 2.3, 8]), box("right", [1.8, 1.15, 0], [0.1, 2.3, 8]), box("back", [0, 1.15, -3], [3.6, 2.3, 0.1]), box("ceiling", [0, 2.3, 0], [3.6, 0.1, 8]), { shape: "group", name: "seat_group", children: [box("seat_left", [-1, 0.5, 1], [0.6, 1, 0.6]), box("seat_right", [1, 0.5, 1], [0.6, 1, 0.6])] }];
spec.duration = 3;
spec.shots = [{ id: "clearance", template: "gen3d", start: 0, end: 3, params: { location: "studio", actors: [{ cast: "person0", at: [0, 0], face: 0, action: "stand" }], cameras: [{ shot: "medium", pos: [3.5, 1.5, 2], target: [0, 1.3, 0], move: "orbit_left", amount: 0.28 }] } }];
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  await page.route(MOTION_ASSET_BASE + "**", async (route) => {
    const file = resolveMotionAsset(new URL(route.request().url()).pathname);
    await route.fulfill({ status: file ? 200 : 404, body: file ? fs.readFileSync(file) : "", headers: { "Access-Control-Allow-Origin": "*" } });
  });
  await page.setContent(buildMotionRenderHtml(spec));
  await page.evaluate(async (spec) => (window as any).__load(spec, { supersample: 1, motionBlur: 1, bloom: false, grain: false, layerScale: 1 }, 640, 360), spec);
  const info = await page.evaluate(() => {
    (window as any).__still(1.5, 0.8);
    return (window as any).MotionEngine.GEN.info.clearance;
  });
  assert.ok(info, "Camera diagnostics must be emitted");
  assert.ok(!info.issues.some((i: string) => i.includes("No unobstructed")), JSON.stringify(info));
  assert.ok(Math.abs(info.camera.pos[0]) < 1.67 && info.camera.pos[1] < 2.17 && info.camera.pos[2] > -2.87, JSON.stringify(info));
  room.nodes.push({ shape: "sphere", name: "detail_target", pos: [0, 1.4, 0], radius: 0.1, mat: { color: "#ffffff" } } as any);
  spec.shots = [{ id: "detail", start: 0, end: 3, template: "gen3d", params: { location: "studio", actors: [{ cast: "person0", at: [-0.8, -0.5], face: 0, action: "stand" }], cameras: [{ shot: "insert", focusProp: "detail_target", pos: [0, 1.4, 0.7], target: [0, 1.4, 0], fov: 28, move: "static" }] } }];
  await page.evaluate(async (spec) => (window as any).__load(spec, { supersample: 1, motionBlur: 1, bloom: false, grain: false, layerScale: 1 }, 640, 360), spec);
  const detail = await page.evaluate(() => {
    (window as any).__still(1, 0.8);
    return (window as any).MotionEngine.GEN.info.detail;
  });
  assert.deepEqual(detail.camera.target, [0, 1.4, 0], "Object insert must preserve the authored detail target");
  assert.ok(Math.hypot(...detail.camera.pos.map((n: number, i: number) => n - detail.camera.target[i])) < 0.9, JSON.stringify(detail));
  room.nodes.push({ shape: "group", name: "rotated_assembly", pos: [0.5, 1.3, -0.4], rot: [0, 90, 0], children: [{ shape: "sphere", name: "nested_display", pos: [0, 0.1, 0.2], radius: 0.1, mat: { color: "#ffffff" } }] } as any);
  spec.shots = [{ id: "nested", start: 0, end: 3, template: "gen3d", params: { location: "studio", actors: [], cameras: [{ shot: "insert", focusProp: "nested_display", pos: [0.7, 1.4, 0.3], target: [0, 0.3, 0], fov: 28, move: "static" }] } }];
  await page.evaluate(async (spec) => (window as any).__load(spec, { supersample: 1, motionBlur: 1, bloom: false, grain: false, layerScale: 1 }, 640, 360), spec);
  const nested = await page.evaluate(() => {
    (window as any).__still(1, 0.8);
    return (window as any).MotionEngine.GEN.info.nested;
  });
  assert.deepEqual(nested.camera.target, [0.7, 1.4, -0.4], "Detail focus must resolve nested rotation and translation, replacing an invalid stale target");
  room.nodes = room.nodes.filter((node: any) => !["detail_target", "rotated_assembly"].includes(node.name));
  spec.shots = [{ id: "profile", start: 0, end: 3, template: "gen3d", params: { location: "studio", actors: [{ cast: "person0", at: [0.8, -0.4], face: -90, action: "stand" }], cameras: [{ shot: "medium", view: "profile", pos: [0.3, 1.5, 2], target: [0.8, 1.3, -0.4], fov: 38, move: "static" }] } }];
  await page.evaluate(async (spec) => (window as any).__load(spec, { supersample: 1, motionBlur: 1, bloom: false, grain: false, layerScale: 1 }, 640, 360), spec);
  const profile = await page.evaluate(() => {
    (window as any).__still(1, 0.8);
    return (window as any).MotionEngine.GEN.info.profile;
  });
  const facing = (0.8 - profile.camera.pos[0]) / Math.hypot(profile.camera.pos[0] - 0.8, profile.camera.pos[2] + 0.4);
  assert.ok(Math.abs(facing) < 0.35, "An explicit profile must not be replaced with a frontal view: " + JSON.stringify(profile));
  console.log("Camera passed: exterior request relocated inside narrow room, grouped seats preserve the aisle, prop coverage retains target.");
} finally {
  await browser.close();
}
