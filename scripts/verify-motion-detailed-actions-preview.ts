import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chromium } from "playwright";
import { findNativeChrome } from "../src/server/services/nativeProxyBrowser.ts";
import { compositionFrameSvg } from "../src/lib/motionSceneComposition.ts";
const out = path.resolve("storage/output/motion-video/clip-demo/detailed-actions-structured-20261106");
const spec = JSON.parse(await fs.readFile(path.join(out, "candidate-spec.json"), "utf8")), scene = spec.scenes[0], asset = spec.assets[scene.composition.assetKey], duration = (scene.endFrame - scene.startFrame) / spec.fps;
const raw = JSON.parse(await fs.readFile(path.join(out, "response-3.json"), "utf8"));
assert.deepEqual(scene.composition.animations, raw.animations);
const frames = Array.from({ length: scene.endFrame - scene.startFrame }, (_, i) => compositionFrameSvg(asset, scene.composition, i / spec.fps, spec.renderBehavior, new Set(), spec.profileId, duration));
const browser = await chromium.launch({ executablePath: findNativeChrome(), headless: false });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent('<html><body style="margin:0;background:#111"><div id="scene" style="width:1280px;height:720px"></div><style>svg{width:100%;height:100%}</style></body></html>');
  await page.addScriptTag({ content: "window.__name=(fn)=>fn;" });
  await page.evaluate(({ frames, fps }) => {
    const host = document.getElementById("scene")!;
    const started = performance.now();
    const tick = () => { const i = Math.min(frames.length - 1, Math.floor((performance.now() - started) * fps / 1000)); host.innerHTML = frames[i]; (window as any).lastFrame = i; if (i < frames.length - 1) requestAnimationFrame(tick); };
    tick();
  }, { frames, fps: spec.fps });
  await page.waitForFunction((end) => (window as any).lastFrame >= end, frames.length - 1, { timeout: 30000 });
  for (const [label, at] of [["start", 0], ["middle", Math.floor(frames.length / 2)], ["end", frames.length - 1]] as const) {
    await page.evaluate((svg) => { document.getElementById("scene")!.innerHTML = svg; }, frames[at]);
    await page.screenshot({ path: path.join(out, `preview-${label}.png`) });
  }
  assert.deepEqual(errors, []);
  const originalBytes = await fs.readFile("storage/output/motion-video/productions/f82fe2c76c1ab22004a52e6147acdf2c.json"), run = JSON.parse(await fs.readFile(path.join(out, "run.json"), "utf8"));
  assert.equal(createHash("sha256").update(originalBytes).digest("hex"), run.sourceHash);
  await fs.writeFile(path.join(out, "preview-verification.json"), JSON.stringify({ visibleInstalledChrome: true, frameCount: frames.length, pageErrors: errors, animationsUnchanged: true, sourceUnchanged: true, renderer: "Production compositionFrameSvg, direct native-Chrome SVG playback", exportStatus: "Separate Remotion MP4 render timed out at frame 102; this preview does not claim export passed", scope: "Data-flow and preview playback, not a quality score for the action" }, null, 2));
  console.log("PASS: original AI keyframes sampled with production SVG renderer and played in visible installed Chrome; no animation edits. Separate MP4 export timeout remains recorded.");
} finally { await browser.close(); }
process.exit(0);
