// Marks of kit-drawn figures carry the box the kit painted: a person given only a height and a map icon given only a
// radius must be measured as visible (they used to be recorded as empty boxes and rejected as "outside the frame").
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";
import { motionHtmlFigures } from "../src/lib/motionFigures.js";
import { motionHtmlFigureFaults, motionHtmlMarkId, motionHtmlMissing } from "../src/lib/motionHtmlQuality.js";
import { MOTION_HTML_QUALITY } from "../src/constants/motionHtmlQuality.js";
import type { MotionHtmlMark } from "../src/types/motionHtmlScene.js";
const dir = "scripts/fixtures/motion-figures/marks";
const cases = [
  { file: "person-height-only.html", required: ["you", "miklos", "refugees"] },
  { file: "map-icon.html", required: ["mongol_army", "camp", "bridge"] },
  { file: "limb-options.html", required: ["tomas", "you"], limbOptions: ["frontHandPos", "suppressFrontArm", "backHandPos"] },
  // A posture set outside pose is reported apart; the amounts the kit reads itself (sitUp) are not.
  { file: "pose-options.html", required: ["tomas", "you"], poseOptions: ["lyingDown", "standUp"] },
];
const RECORD = "window.__MOTION_HOST__=true;window.__motionMarks=[];window.motionMark=function(ctx,id,x,y,w,h){const t=ctx.getTransform(),c=ctx.canvas;const p=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([a,b])=>[t.a*a+t.c*b+t.e,t.b*a+t.d*b+t.f]);const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]);window.__motionMarks.push({id:String(id),x:Math.min(...xs)/c.width,y:Math.min(...ys)/c.height,w:(Math.max(...xs)-Math.min(...xs))/c.width,h:(Math.max(...ys)-Math.min(...ys))/c.height})}";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
try {
  for (const item of cases) {
    const raw = fs.readFileSync(`${dir}/${item.file}`, "utf8");
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.setContent(motionHtmlFigures(raw, { kit: true, profile: "comic", proportion: "storybook", layout: "wide" } as never).replace("<head>", `<head><script>${RECORD}</script>`));
    const marks = (await page.evaluate(async () => {
      const w = window as unknown as { motionScene: { ready: Promise<void>; renderAt: (i: object) => Promise<void> }; __motionMarks: unknown[] };
      await w.motionScene.ready;
      w.__motionMarks = [];
      await w.motionScene.renderAt({ mode: "export", width: 1280, height: 720, time: 2, frame: 60, fps: 30, duration: 4, progress: 0.5, motionEnabled: true, cameraEnabled: true, sceneEffectsEnabled: true, seed: "x", speaking: [] });
      return w.__motionMarks;
    })) as MotionHtmlMark[];
    await page.close();
    // A person option that places or hides a limb outside OPTIONS comes back as a fault mark, split from the real marks.
    const faults = motionHtmlFigureFaults(marks);
    assert.deepEqual(faults.limbOptions.sort(), [...((item as { limbOptions?: string[] }).limbOptions || [])].sort(), `${item.file}: limb options`);
    assert.deepEqual(faults.poseOptions.sort(), [...((item as { poseOptions?: string[] }).poseOptions || [])].sort(), `${item.file}: pose options`);
    assert.ok(faults.marks.every((mark) => !mark.id.startsWith(MOTION_HTML_QUALITY.FAULT_PREFIX) && !mark.id.startsWith(MOTION_HTML_QUALITY.POSE_PREFIX)));
    const issues = motionHtmlMissing(item.required.map((id) => ({ id: motionHtmlMarkId(id), focal: false })) as never, faults.marks);
    assert.deepEqual(issues, [], `${item.file}: ${issues.join("; ")}`);
  }
  assert.deepEqual(motionHtmlMissing([{ id: "route", focal: false }] as never, [{ id: "route", x: 0.2, y: 0.5, w: 0.4, h: 0 } as MotionHtmlMark]), [], "a straight arrow is judged by its centre");
  assert.deepEqual(["suppressFrontArm", "hideArm", "frontHandPos", "noLegs"].filter((key) => MOTION_HTML_QUALITY.LIMB_HIDE.test(key)), ["suppressFrontArm", "hideArm", "noLegs"], "Hiding a limb asks for a new drawing; placing one is a warning");
  console.log("Figure marks: kit-drawn people, map icons and flat arrows are measured as drawn, not as outside the frame; invented limb and posture options are reported apart.");
} finally {
  await browser.close();
}
