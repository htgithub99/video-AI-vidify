// Renders every figure-bench page (scripts/verify-motion-figures-bench.ts) frame by frame and checks that the boxes the
// figure table records are the same in every renderer: the kit figure stands on the scene's ground point with the scene's
// height and width. Usage: node scripts/motion-figures-bench-check.mjs <dir> <chrome> [shots dir]
import fs from "node:fs";
import path from "node:path";
const [dir, chrome, shots] = process.argv.slice(2);
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const pages = JSON.parse(fs.readFileSync(path.join(dir, "pages.json"), "utf8"));
const browser = await chromium.launch({ executablePath: chrome, args: ["--no-sandbox"] });
const host = "window.__MOTION_HOST__=true;window.__motionMarks=[];window.motionMark=function(ctx,id,x,y,w,h){const t=ctx.getTransform(),c=ctx.canvas,p=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(q=>[t.a*q[0]+t.c*q[1]+t.e,t.b*q[0]+t.d*q[1]+t.f]),X=p.map(q=>q[0]),Y=p.map(q=>q[1]),l=Math.min(...X),u=Math.min(...Y);window.__motionMarks.push({id:String(id),x:l,y:u,w:Math.max(...X)-l,h:Math.max(...Y)-u});};";
const failures = [];
const boxes = {};
const FRAMES = 90, SAMPLE = [30, 75];
for (const entry of pages) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error).slice(0, 200)));
  await page.addInitScript(host);
  await page.goto("file://" + path.resolve(dir, entry.file));
  await page.evaluate(async () => { await window.motionScene.ready; });
  for (let frame = 0; frame <= Math.max(...SAMPLE); frame++) {
    const marks = await page.evaluate(async (frame) => {
      window.__motionMarks = [];
      await window.motionScene.renderAt({ time: frame / 30, progress: frame / 89, frame, fps: 30, duration: 3, width: 1280, height: 720, mode: "export", motionEnabled: true, cameraEnabled: true, sceneEffectsEnabled: true, seed: "s", speaking: [], cues: [0] });
      return window.__motionMarks.slice();
    }, frame);
    if (!SAMPLE.includes(frame)) continue;
    (boxes[entry.scene + "@" + frame] ||= {})[entry.mode] = marks;
    if (shots) await page.screenshot({ path: path.join(shots, `${entry.file.replace(/\.html$/, "")}_${frame}.png`) });
  }
  if (errors.length) failures.push(`${entry.file}: ${errors.join(" | ")}`);
  await page.close();
}
await browser.close();
// The table marks the box it was given in both renderers, so every id must sit in the same place in every renderer.
for (const [key, modes] of Object.entries(boxes)) {
  const base = modes.ai || [];
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
if (failures.length) { console.log(failures.join("\n")); process.exit(1); }
console.log(`figures bench ok (${pages.length} pages)`);
