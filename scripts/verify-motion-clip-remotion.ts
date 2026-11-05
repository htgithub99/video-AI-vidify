import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-clip-remotion-"));
const priorStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
const { MOTION_VISUAL: V } = await import("../src/constants/motionVisual.js");
const { normalizeMotionVector } = await import("../src/lib/motionVectorAsset.js");
const { assessMotionClips, motionClipPartIds, motionClipRig } = await import("../src/lib/motionClipDirector.js");
const { createCompositionGeometryInspector } = await import("../src/features/motion/server/services/remotion/compositionGeometryInspector.js");
const { normalizeFirstSceneComposition } = await import("../src/lib/motionSceneComposition.js");
const { validateRemotionSpec } = await import("../src/lib/motionRemotion.js");
const { renderRemotionStill } = await import("../src/features/motion/server/services/motionRemotionRenderService.js");
const { DEMO_RESPONSE, DEMO_SVG } = await import("./motionClipDemoScene.js");
try {
  // Real drawn-scene path: normalize the composition, measure the rig, accept AI clips, render through Remotion.
  const layers = [
    { id: "sky", kind: "background" },
    { id: "river", kind: "effect", effectKind: "water" },
    { id: "horse_1", kind: "prop" },
    { id: "car_1", kind: "prop" },
  ];
  const built = normalizeFirstSceneComposition({ svg: DEMO_SVG, layers, animations: [] }, "clip-remotion", "clip-remotion", "cavalry by the river", [], new Set(), 1280, 720);
  const geometry = createCompositionGeometryInspector();
  let motion;
  try {
    const rig = motionClipRig(built.asset, await geometry.measure(built.asset, motionClipPartIds(built.asset.svg)));
    const checked = assessMotionClips(DEMO_RESPONSE, rig, built.asset.svg, "clip", "clip");
    assert.deepEqual(checked.errors, [], checked.errors.join("\n"));
    motion = checked.value;
  } finally {
    await geometry.close();
  }
  const fps = 30;
  const seconds = 8;
  const composition = { ...built.composition, motion };
  const spec = validateRemotionSpec({
    version: V.VERSION,
    engine: "remotion",
    title: "clip",
    aspect: "16:9",
    motion: true,
    profileId: "history",
    fps,
    width: 1280,
    height: 720,
    duration: seconds,
    assets: { [built.asset.key]: built.asset },
    scenes: [{ id: "clip", beatId: "clip", fromLineId: "a", toLineId: "a", purpose: "cavalry", text: "", environment: "river", sourceKey: "clip", nodes: [], composition, startFrame: 0, endFrame: fps * seconds }],
    subtitles: [],
    renderBehavior: { version: 1, actors: "simple", sceneEffects: "gentle", camera: "fixed" },
  });
  const files = [15, 75, 150].map((frame) => path.join(root, `frame-${frame}.png`));
  for (const [index, frame] of [15, 75, 150].entries()) await renderRemotionStill(spec, files[index], frame);
  const hashes = files.map((file) => createHash("sha256").update(fs.readFileSync(file)).digest("hex"));
  assert.equal(new Set(hashes).size, hashes.length, "Remotion frames differ over time, so AI clips animate the rendered scene");
  const out = path.resolve("storage/output/motion-video/clip-demo");
  fs.mkdirSync(out, { recursive: true });
  fs.copyFileSync(files[1], path.join(out, "remotion-frame-75.png"));
  process.stdout.write(`PASS: real Remotion renderer animates AI motion clips (3 distinct stills). Sample: ${path.join(out, "remotion-frame-75.png")}\n`);
} finally {
  if (priorStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = priorStorage;
  fs.rmSync(root, { recursive: true, force: true });
}
