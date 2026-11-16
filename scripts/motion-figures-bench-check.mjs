// Renders every figure-bench page (scripts/verify-motion-figures-bench.ts) frame by frame and checks:
// - the boxes the figure table records are the same in every renderer (the kit figure stands on the scene's ground point
//   with the scene's height and width);
// - the contract edge cases (fixtures/motion-figures/edges.html) are painted where the scene put them: a wagon-fort row
//   fills its box, an icon with pop 0 or a pulse ring is visible at full size, an arrow bends by the px the scene gave;
// - each layout's camera over the real scenes keeps one zoom, the subject's crown in the frame and the subject inside the
//   action-safe area, and never zooms a map.
// Usage: node scripts/motion-figures-bench-check.mjs <dir> <chrome> [shots dir]
import fs from "node:fs";
import path from "node:path";
const [dir, chrome, shots] = process.argv.slice(2);
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const pages = JSON.parse(fs.readFileSync(path.join(dir, "pages.json"), "utf8"));
const browser = await chromium.launch({ executablePath: chrome, args: ["--no-sandbox"] });
const host = "window.__MOTION_HOST__=true;window.__motionMarks=[];window.motionMark=function(ctx,id,x,y,w,h){const t=ctx.getTransform(),c=ctx.canvas,p=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(q=>[t.a*q[0]+t.c*q[1]+t.e,t.b*q[0]+t.d*q[1]+t.f]),X=p.map(q=>q[0]),Y=p.map(q=>q[1]),l=Math.min(...X),u=Math.min(...Y);window.__motionMarks.push({id:String(id),x:l,y:u,w:Math.max(...X)-l,h:Math.max(...Y)-u});};";
const failures = [];
const boxes = {};
// Painted extent inside a rectangle of the scene canvas: pixels that differ from the same frame drawn without the
// figures (window.__benchBlank), so a drawing style's tone and finish over the ground do not count.
const painted = (rect, blank) => {
  const c = document.getElementById("motion-canvas"), d = c.getContext("2d").getImageData(rect[0], rect[1], rect[2], rect[3]).data, b = blank.getContext("2d").getImageData(rect[0], rect[1], rect[2], rect[3]).data;
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = 0; y < rect[3]; y++) for (let x = 0; x < rect[2]; x++) { const i = (y * rect[2] + x) * 4; if (Math.abs(d[i] - b[i]) + Math.abs(d[i + 1] - b[i + 1]) + Math.abs(d[i + 2] - b[i + 2]) > 60) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
  return x1 < 0 ? null : { x0: rect[0] + x0, y0: rect[1] + y0, x1: rect[0] + x1 + 1, y1: rect[1] + y1 + 1 };
};
const EDGE_RECTS = { fort: [0, 0, 640, 360], battle: [640, 0, 640, 360], march: [0, 360, 640, 360], pulse: [640, 360, 640, 360] };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const checkEdges = (file, ext) => {
  const fail = (what) => failures.push(`${file}: ${what}`);
  // Outlines and the solid ground shadow add a few px around the box; the fault this guards against was three times the box.
  if (!ext.fort || !near(ext.fort.y1, 300, 10) || !near(ext.fort.y1 - ext.fort.y0, 80, 80 * 0.15) || !near(ext.fort.x1 - ext.fort.x0, 440, 440 * 0.12)) fail(`wagon fort is not its 440x80 box: ${JSON.stringify(ext.fort)}`);
  if (!ext.battle || (ext.battle.x1 - ext.battle.x0) < 60 || ext.battle.x0 < 960 - 66 || ext.battle.x1 > 960 + 66) fail(`icon with pop 0 is not shown at its size: ${JSON.stringify(ext.battle)}`);
  // Positive curve bends to the right of travel: an arrow heading right bends down.
  if (!ext.march || !near(ext.march.x0, 80, 14) || !near(ext.march.x1, 560, 14) || !near(ext.march.y1 - 560, 60, 25) || ext.march.y0 < 545) fail(`arrow does not bend 60 px to the right of travel: ${JSON.stringify(ext.march)}`);
  if (!ext.pulse || (ext.pulse.x1 - ext.pulse.x0) < 100) fail(`icon with a pulse ring is missing: ${JSON.stringify(ext.pulse)}`);
};
const cameras = {};
const FRAMES = 90, SAMPLE = [30, 75];
for (const entry of pages) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error).slice(0, 200)));
  await page.addInitScript(host);
  await page.goto("file://" + path.resolve(dir, entry.file));
  await page.evaluate(async () => { await window.motionScene.ready; });
  for (let frame = 0; frame <= Math.max(...SAMPLE); frame++) {
    const { marks, path: view, edges } = await page.evaluate(async ({ frame, edgeRects, measure }) => {
      const input = { time: frame / 30, progress: frame / 89, frame, fps: 30, duration: 3, width: 1280, height: 720, mode: "export", motionEnabled: true, cameraEnabled: true, sceneEffectsEnabled: true, seed: "s", speaking: [], cues: [0] };
      let blank = null;
      if (edgeRects) {
        window.__benchBlank = true;
        await window.motionScene.renderAt(input);
        const scene = document.getElementById("motion-canvas");
        blank = document.createElement("canvas"); blank.width = scene.width; blank.height = scene.height;
        blank.getContext("2d").drawImage(scene, 0, 0);
        window.__benchBlank = false;
      }
      window.__motionMarks = [];
      await window.motionScene.renderAt(input);
      const paint = edgeRects && new Function("return " + measure)();
      const path = window.__motionViewHooks && window.__motionViewHooks.path;
      return { marks: window.__motionMarks.slice(), path: path ? { z: path.z, subjects: path.subjects } : path, edges: edgeRects && Object.fromEntries(Object.entries(edgeRects).map(([id, rect]) => [id, paint(rect, blank)])) };
    }, { frame, edgeRects: entry.scene === "edges" ? EDGE_RECTS : null, measure: painted.toString() });
    if (!SAMPLE.includes(frame)) continue;
    if (edges) checkEdges(`${entry.file}@${frame}`, edges);
    if (entry.layout) { (cameras[entry.file] ||= []).push({ frame, view, marks }); }
    else (boxes[entry.scene + "@" + frame] ||= {})[entry.mode] = marks;
    if (shots) await page.screenshot({ path: path.join(shots, `${entry.file.replace(/\.html$/, "")}_${frame}.png`) });
  }
  if (errors.length) failures.push(`${entry.file}: ${errors.join(" | ")}`);
  await page.close();
}
await browser.close();
// The table marks the box it was given in both renderers, so every id must sit in the same place in every renderer. A
// real scene's "free" marks are drawn by the scene relative to a figure (a whetstone at the returned hand, hooves inside
// the scene's own horse), so they follow the figure the renderer drew.
const real = JSON.parse(fs.readFileSync(new URL("./fixtures/motion-figures/real/scenes.json", import.meta.url), "utf8"));
for (const [key, modes] of Object.entries(boxes)) {
  const free = real[key.split("@")[0]]?.free || [];
  const base = (modes.ai || []).filter((mark) => !free.includes(mark.id));
  for (const [mode, marks] of Object.entries(modes)) {
    if (mode === "ai") continue;
    // A group marks every member with its id, so the n-th mark of an id is compared with the n-th one.
    const seen = {};
    for (const mark of base) {
      const nth = (seen[mark.id] = (seen[mark.id] || 0) + 1) - 1;
      const other = marks.filter((item) => item.id === mark.id)[nth];
      if (!other) { failures.push(`${key} ${mode}: ${mark.id} not drawn`); continue; }
      const foot = Math.abs(other.y + other.h - (mark.y + mark.h)), tall = Math.abs(other.h - mark.h) / Math.max(1, mark.h), mid = Math.abs(other.x + other.w / 2 - (mark.x + mark.w / 2));
      if (foot > 1 || tall > 0.02 || mid > 1) failures.push(`${key} ${mode}: ${mark.id} box differs (feet ${foot.toFixed(1)}px, height ${(tall * 100).toFixed(1)}%, centre ${mid.toFixed(1)}px)`);
    }
  }
}
// The camera: one zoom for the scene, the subject's crown in the frame and its body in the action-safe area (93 %), and no
// camera over a map.
for (const [file, list] of Object.entries(cameras)) {
  const zooms = new Set(list.map((item) => item.view ? item.view.z.toFixed(4) : "none"));
  if (zooms.size > 1) failures.push(`${file}: zoom changes within the scene (${[...zooms].join(", ")})`);
  if (/^b1_html_1__/.test(file) && list.some((item) => item.view)) failures.push(`${file}: a map is zoomed`);
  for (const { frame, view, marks } of list) {
    if (!view) continue;
    for (const id of view.subjects) {
      const box = marks.find((mark) => mark.id === id);
      if (!box) continue;
      // Marks are in canvas pixels (1280 x 720).
      if (box.y / 720 < -0.005) failures.push(`${file}@${frame}: ${id} crown cut (${((box.y / 720) * 100).toFixed(1)}%)`);
      const mid = (box.x + box.w / 2) / 1280;
      if (mid < 0.035 || mid > 0.965) failures.push(`${file}@${frame}: ${id} outside the action-safe area (${(mid * 100).toFixed(1)}%)`);
    }
  }
}
if (failures.length) { console.log(failures.join("\n")); process.exit(1); }
console.log(`figures bench ok (${pages.length} pages)`);
