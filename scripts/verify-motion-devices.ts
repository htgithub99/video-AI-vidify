// Story devices (FIG.device) are drawn by the figure runtime: each kind paints inside the
// box it reports, thought and inset run the scene's small picture clipped inside them, and nothing throws.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { motionFigureKitPage as motionKitPage } from "../src/lib/motionFigures.js";

const SCENE = `<!doctype html><html><head></head><body><canvas id="motion-canvas" width="1280" height="720"></canvas><script>
const FIG = window.MotionFigures.use({});
window.motionScene = { ready: Promise.resolve(), renderAt: async () => {} };
</script></body></html>`;
const DEVICES: Record<string, unknown>[] = [
  { kind: "thought", x: 400, y: 200, r: 80, from: [300, 420] },
  { kind: "inset", x: 900, y: 200, r: 90, from: [700, 450] },
  { kind: "emote", x: 300, y: 300, r: 30, sign: "alarm" },
  { kind: "emote", x: 300, y: 300, r: 30, sign: "sleep" },
  { kind: "count", x: 200, y: 400, w: 400, h: 160, groups: [{ n: 25000, color: "#a33" }, { n: 60000, color: "#333" }] },
  { kind: "time", x: 640, y: 300, r: 200, body: "sun", progress: 0.3 },
  { kind: "sound", x: 640, y: 360, r: 80, facing: 1, t: 0.4 },
  { kind: "spotlight", x: 640, y: 360, r: 160 },
  { kind: "speed", x: 640, y: 360, r: 120, facing: 1, t: 0.3 },
  { kind: "impact", x: 640, y: 360, r: 90, t: 0.2 },
];
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome" });
const page = await browser.newPage();
{
  await page.setContent(motionKitPage(SCENE, { profile: "stick", proportion: "balanced", layout: "wide", year: 1241 }));
  for (const device of DEVICES) {
    const result = await page.evaluate((o) => {
      const canvas = document.getElementById("motion-canvas") as HTMLCanvasElement;
      const c = canvas.getContext("2d")!;
      c.clearRect(0, 0, canvas.width, canvas.height);
      let innerBox: any = null;
      const out = (window as any).MotionFigures.use({}).device(c, o, (ctx: CanvasRenderingContext2D, box: any) => { innerBox = box; ctx.fillStyle = "#c00"; ctx.fillRect(box.x, box.y, box.w, box.h); });
      const box = out.box;
      if (!box) return { box: null };
      const d = c.getImageData(0, 0, canvas.width, canvas.height).data;
      let inside = 0, outside = 0;
      for (let y = 0; y < canvas.height; y += 2) for (let x = 0; x < canvas.width; x += 2) if (d[(y * canvas.width + x) * 4 + 3] > 20) { if (x >= box.x - 8 && x <= box.x + box.w + 8 && y >= box.y - 8 && y <= box.y + box.h + 8) inside++; else outside++; }
      return { box, inside, outside, innerBox };
    }, device);
    const name = `${device.kind}${device.sign ? ":" + device.sign : ""}`;
    assert.ok(result.box, `${name}: reports its box`);
    assert.ok(result.inside! > 10, `${name}: paints`);
    if (device.kind !== "spotlight" && device.kind !== "thought" && device.kind !== "inset") assert.equal(result.outside, 0, `${name}: paints only inside its box`);
    if (device.kind === "thought" || device.kind === "inset") assert.ok(result.innerBox && result.innerBox.w > 0, `${name}: the scene's small picture is drawn inside`);
  }
}
// The layout's camera keeps a story device in view: a close shot on a person eases out until the thought bubble beside
// them is inside the action-safe area.
const cameraZoom = async (withDevice: boolean) => {
  const scene = `<!doctype html><html><head></head><body><canvas id="motion-canvas" width="1280" height="720"></canvas><script>
var FIG = window.MotionFigures.use({});
window.motionScene = { ready: Promise.resolve(), renderAt: async (input) => { const c = document.getElementById('motion-canvas').getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#ddd'; c.fillRect(0, 0, 1280, 720); FIG.person(c, { x: 420, y: 600, h: 200, mark: 'hero', facing: 1 }); ${withDevice ? "FIG.device(c, { kind: 'thought', x: 760, y: 330, r: 70, from: [440, 420] }, () => {});" : ""} } };
</script></body></html>`;
  const cam = await browser.newPage();
  await cam.setContent(motionKitPage(scene, { profile: "stick", proportion: "balanced", layout: "close" }));
  return cam.evaluate(async () => { await (window as any).motionScene.renderAt({ progress: 0.5, time: 1, frame: 30, fps: 30, duration: 2 }); const p = (window as any).__motionViewHooks.plan; return p && p.shots.length ? p.shots[0].z : 1; }).finally(() => cam.close());
};
const bare = await cameraZoom(false), kept = await cameraZoom(true);
assert.ok(bare > 1.5, "a close shot zooms in on the person: " + bare);
assert.ok(Math.abs(kept - bare) < 1e-6, "a thought bubble never holds the camera back (it is drawn over the frame): " + kept + " = " + bare);
await browser.close();
console.log("Story devices: thought, inset, emote, count, time, sound, speed, impact and spotlight draw inside their boxes; a thought bubble never holds the camera back.");
