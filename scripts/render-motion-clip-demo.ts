import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { compileMotionClips, validateMotionClips } from "../src/lib/motionClipCompiler.ts";
import { assessMotionClips, motionClipPartIds, motionClipRig } from "../src/lib/motionClipDirector.ts";
import { createCompositionGeometryInspector } from "../src/features/motion/server/services/remotion/compositionGeometryInspector.ts";
import { normalizeMotionVector } from "../src/lib/motionVectorAsset.ts";
import type { MotionSceneMotion } from "../src/types/motionClip.ts";
import { DEMO_RESPONSE, DEMO_SCRIPT, DEMO_SVG } from "./motionClipDemoScene.ts";
const FPS = 30;
const DURATION = 8;
const output = path.resolve("storage/output/motion-video/clip-demo");
const framesDir = path.join(output, "frames");
// 1) Production path: measure the drawn groups with Chrome, build the rig, assess the AI response.
const asset = normalizeMotionVector(DEMO_SVG, "clip-demo", "clip-demo", "demo", true);
const geometry = createCompositionGeometryInspector();
let motion: MotionSceneMotion;
try {
  const rig = motionClipRig(asset, await geometry.measure(asset, motionClipPartIds(asset.svg)));
  const checked = assessMotionClips(DEMO_RESPONSE, rig, asset.svg, DEMO_SCRIPT.scene, "demo");
  assert.deepEqual(checked.errors, [], checked.errors.join("\n"));
  assert.ok(checked.bible?.horse_1, "Motion bible notes are kept for later scenes");
  motion = checked.value as MotionSceneMotion;
  assert.equal(rig.parts.find((part) => part.id === "horse_1_leg_fl")?.parent, "horse_1", "Rig parents come from SVG nesting");
} finally {
  await geometry.close();
}
// 2) Contract checks: invalid AI output is rejected instead of guessed.
const broken = validateMotionClips(
  { ...motion, clips: [{ op: "swing", target: "horse_1_leg_x" }, { op: "spin", target: "car_1_wheel_f", couple: "missing" }, { op: "teleport" as never, target: "car_1" }, { op: "scroll", target: "car_1" }, { op: "swing", target: "horse_1_tail", amount: "huge" as never }] },
  asset.svg,
);
assert.equal(broken.length, 5, broken.join("\n"));
assert.ok(assessMotionClips({ clips: [{ op: "spin" }] }, motion.rig, asset.svg, "x", "x").errors.length, "Missing target is rejected");
// Salvage (repair answers only): drop exactly the invalid clips and those coupled to a dropped travel; keep the rest.
const mixed = { clips: [...DEMO_RESPONSE.clips, { op: "emit", at: "bottom", particle: "dust" }, { op: "scroll", target: "car_1" }] };
assert.ok(assessMotionClips(mixed, motion.rig, asset.svg, "x", "x").errors.length, "First answer must be fully valid");
const salvaged = assessMotionClips(mixed, motion.rig, asset.svg, "x", "x", true);
assert.deepEqual(salvaged.errors, []);
assert.equal((salvaged.value as MotionSceneMotion).clips.length, DEMO_RESPONSE.clips.length, "Only the 2 invalid clips are dropped");
assert.equal(salvaged.dropped?.length, 2);
const cascade = assessMotionClips({ clips: [{ id: "drive", op: "travel", target: "car_x", mode: "path", from: { x: 1, y: 0.8 }, to: { x: 0, y: 0.8 } }, { op: "spin", group: ["car_1_wheel_f", "car_1_wheel_b"], couple: "drive" }, ...DEMO_RESPONSE.clips.slice(0, 6)] }, motion.rig, asset.svg, "x", "x", true);
assert.equal((cascade.value as MotionSceneMotion).clips.length, 6, "Clips coupled to a dropped travel are dropped too");
assert.ok(assessMotionClips({ clips: [{ op: "swing", target: "nope_1" }, { op: "swing", target: "nope_2" }, DEMO_RESPONSE.clips[5]] }, motion.rig, asset.svg, "x", "x", true).errors.length, "Mostly-invalid answers are still rejected");
// 3) Motion checks on the compiled program.
const program = compileMotionClips(motion, asset.svg, DURATION);
assert.deepEqual(program.issues, []);
const legAngle = (svg: string) => Number(svg.match(/id="horse_1_leg_fl"[^>]*transform="rotate\((-?[\d.]+)/)?.[1] ?? 0);
assert.equal(legAngle(program.frame(0)), 0, "No motion before the clip starts");
assert.ok(Math.abs(legAngle(program.frame(2.1))) > 1, "Legs swing once riding");
const angle = (svg: string) => Number(svg.match(/id="car_1_wheel_f"[^>]*transform="rotate\((-?[\d.]+)/)?.[1]);
const carX = (svg: string) => Number(svg.match(/id="car_1"[^>]*transform="translate\((-?[\d.]+)/)?.[1]);
const [a, b] = [program.frame(4), program.frame(4.1)];
const rolled = ((((angle(b) - angle(a)) % 360) + 540) % 360) - 180;
const expected = (((carX(b) - carX(a)) / 22) * 180) / Math.PI;
assert.ok(Math.abs(rolled - expected) < 1, `Wheel roll ${rolled.toFixed(2)}° must match travel ${expected.toFixed(2)}°`);
assert.equal(compileMotionClips(motion, asset.svg, DURATION, false).frame(3).includes("motion_flow"), false, "sceneEffects=off removes flow/emit overlays");
// 4) Render frames with Chrome and encode an MP4.
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(framesDir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: motion.rig.width, height: motion.rig.height } });
  await page.setContent(`<html><body style="margin:0;overflow:hidden"><div id="stage"></div></body></html>`);
  for (let i = 0; i < Math.round(DURATION * FPS); i++) {
    await page.evaluate((markup) => {
      document.getElementById("stage")!.innerHTML = markup;
    }, program.frame(i / FPS));
    await page.screenshot({ path: path.join(framesDir, `f${String(i).padStart(4, "0")}.png`) });
  }
  const sheet = [0.2, 1.5, 2.6, 3.8, 5, 6.6].map((t) => `<div style="position:relative"><div style="width:640px;height:360px;overflow:hidden"><div style="transform:scale(.5);transform-origin:0 0">${program.frame(t)}</div></div><b style="position:absolute;left:8px;top:6px;font:700 20px Arial;color:#fff;text-shadow:0 1px 3px #000">t=${t}s</b></div>`);
  await page.setViewportSize({ width: 1280, height: 1080 });
  await page.setContent(`<html><body style="margin:0;display:grid;grid-template-columns:640px 640px">${sheet.join("")}</body></html>`);
  await page.screenshot({ path: path.join(output, "contact-sheet.png") });
} finally {
  await browser.close();
}
const mp4 = path.join(output, "motion-clip-demo.mp4");
const ffmpeg = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(framesDir, "f%04d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", mp4], { encoding: "utf8" });
assert.equal(ffmpeg.status, 0, ffmpeg.stderr);
await fs.rm(framesDir, { recursive: true, force: true });
await fs.writeFile(path.join(output, "motion-script.json"), JSON.stringify(DEMO_RESPONSE, null, 2));
process.stdout.write(`PASS: rig measured by Chrome (${motion.rig.parts.length} parts), AI response accepted (${motion.clips.length} clips), invalid clips rejected, wheel roll matches travel, effects toggle respected.\nVideo: ${mp4}\nPreview: ${path.join(output, "contact-sheet.png")}\n`);
