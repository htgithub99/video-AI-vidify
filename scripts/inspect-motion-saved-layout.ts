import fs from "node:fs";
import path from "node:path";
import { layoutRemotionNodes } from "../src/lib/motionRemotion.js";
import { resolveRemotionContinuity } from "./legacy-motion-remotion/sceneContinuity.js";
import { createVectorCutoutInspector } from "../src/server/services/remotion/vectorCutoutInspector.js";
import { renderRemotionStill } from "../src/server/services/motionRemotionRenderService.js";
import { normalizeMotionRenderBehavior } from "../src/lib/motionRenderBehavior.js";
import type { MotionStoryScript } from "../src/types/motionVideo.js";
import type { MotionRemotionSpec } from "../src/types/motionVisual.js";
const source = process.argv[2];
if (!source) throw new Error("Usage: tsx scripts/inspect-motion-saved-layout.ts <saved-story-job.json> [--stills]");
const script: MotionStoryScript = structuredClone(JSON.parse(fs.readFileSync(path.resolve(source), "utf8")).job.result);
const state = script.gen?.remotion;
if (!state) throw new Error("Saved job has no Remotion scene state");
const folder = path.resolve("scratch/motion-layout-offline-20261027", path.basename(source, ".json"));
fs.mkdirSync(folder, { recursive: true });
const inspector = createVectorCutoutInspector();
try {
  const entities = new Set(Object.values(state.scenes).flatMap((scenes) => scenes.flatMap((scene) => scene.nodes.map((node) => node.assetKey).filter(Boolean))));
  for (const key of entities) {
    const issue = await inspector.check(state.assets[key!]);
    if (issue) throw new Error(`${key}: ${issue}`);
  }
} finally {
  await inspector.close();
}
resolveRemotionContinuity(script, { places: [] } as any);
const scenes = script.beats.flatMap((beat) => state.scenes[beat.id] || []),
  checks = [];
for (const [index, scene] of scenes.entries()) {
  try {
    const nodes = layoutRemotionNodes(scene.nodes, state.assets, 1280, 720, state.assets[scene.backgroundKey || ""]);
    const needsMetadata = nodes.filter((node) => node.kind === "character" && node.relation === "on" && !state.assets[node.assetKey || ""]?.anchors?.seat).map((node) => node.id);
    const spec: MotionRemotionSpec = {
      engine: "remotion",
      version: 1,
      title: script.title,
      aspect: "16:9",
      fps: 30,
      duration: 1,
      width: 1280,
      height: 720,
      motion: false,
      renderBehavior: normalizeMotionRenderBehavior(),
      profileId: state.settings.mode === "remotion" ? state.settings.profileId : "horror",
      assets: state.assets,
      scenes: [{ ...scene, nodes, startFrame: 0, endFrame: 30 }],
      subtitles: [],
    };
    if (process.argv.includes("--stills")) await renderRemotionStill(spec, path.join(folder, `scene-${String(index + 1).padStart(2, "0")}.png`));
    checks.push({ index: index + 1, id: scene.id, ok: true, time: scene.time, text: scene.text, needsMetadata, nodes: nodes.map(({ assetKey, ...node }) => ({ ...node, assetKey })) });
  } catch (error) {
    checks.push({ index: index + 1, id: scene.id, ok: false, error: String((error as Error).message) });
  }
}
fs.writeFileSync(path.join(folder, "layout.json"), JSON.stringify(checks, null, 2));
console.log(JSON.stringify({ source: path.resolve(source), output: folder, passed: checks.filter((row) => row.ok).length, total: checks.length, failures: checks.filter((row) => !row.ok) }));
if (checks.some((row) => !row.ok)) process.exitCode = 1;
