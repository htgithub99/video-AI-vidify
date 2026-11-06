import fs from "node:fs/promises";
import assert from "node:assert/strict";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { puppetBeatLines } from "../src/lib/motionPuppet.ts";
import { motionNarratorCastKey } from "../src/lib/motionVoice.ts";
import { mergeRemotionSceneDraft } from "../src/features/motion/server/services/remotion/sceneContract.ts";

const root = "scratch/motion-real-recovery-20261105";
const original = JSON.parse(await fs.readFile(root + "/baseline/output/motion-video/ai-debug/motion_remotion_scene-plan_7ee92585776fcf026eb0592a7790cd7e93274eb0cf0852239d628057fc50f3d4-1.json", "utf8"));
const patch = JSON.parse(await fs.readFile(root + "/format-live-patch.json", "utf8"));
const analysis = JSON.parse(await fs.readFile(root + "/analysis-source.json", "utf8"));
const moduleFile = path.resolve("node_modules/.cache/scene-contract-original.mjs");
const bundle = await build({
  entryPoints: ["src/features/motion/server/services/remotion/sceneContract.ts"], bundle: true, platform: "node", format: "esm", packages: "external", write: false,
  plugins: [{ name: "head-merge-baseline", setup(builder) {
    builder.onLoad({ filter: /[\\/]src[\\/].*\.ts$/ }, (args) => ({
      contents: execFileSync("git", ["show", "HEAD:" + path.relative(process.cwd(), args.path).replaceAll("\\", "/")], { encoding: "utf8", maxBuffer: 20000000 }), loader: "ts",
    }));
  } }],
});
await fs.mkdir(path.dirname(moduleFile), { recursive: true });
await fs.writeFile(moduleFile, bundle.outputFiles[0].text);
let baseline: any;
try { baseline = await import(pathToFileURL(moduleFile).href); }
finally { await fs.rm(moduleFile, { force: true }); }
let checked = false;
for (const id of ["4c7366b2-da62-4588-9619-40cd8e497b91", "f61fc4d8-bc64-4678-8ccc-40ae950dac07"]) {
  const script = JSON.parse(await fs.readFile("storage/output/motion-video/story-jobs/" + id + ".json", "utf8")).job.result;
  const lines = script.beats.flatMap((beat: any) => puppetBeatLines(beat, motionNarratorCastKey(analysis)));
  const first = lines.findIndex((line: any) => line.key === original.draft.scenes[0].fromLineId);
  const last = lines.findIndex((line: any) => line.key === original.draft.scenes.at(-1).toLineId);
  if (first < 0 || last < first) continue;
  const sourceLines = lines.slice(first, last + 1);
  const cast = new Set<string>(analysis.cast.map((person: any) => person.key));
  const merged = mergeRemotionSceneDraft(patch, original.draft.scenes, sourceLines, cast);
  assert.deepEqual(merged.errors, []);
  assert.equal(merged.accepted.length, original.draft.scenes.length);
  const before = baseline.mergeRemotionSceneDraft(patch, original.draft.scenes, sourceLines, cast);
  assert.deepEqual(merged, before, "Merging and all existing pose/evidence normalization must match HEAD exactly");
  const report = JSON.parse(await fs.readFile(root + "/format-gemini-live-results.json", "utf8"));
  report.productionMerge = { sourceJob: id, sourceLines: sourceLines.length, acceptedRows: merged.accepted.length, identicalToHeadMerge: true, errors: merged.errors };
  await fs.writeFile(root + "/format-gemini-live-results.json", JSON.stringify(report, null, 2));
  process.stdout.write(JSON.stringify(report.productionMerge) + "\n");
  checked = true;
  break;
}
assert.ok(checked, "No original stored script matches the rejected plan ranges; never fabricate source line IDs");
