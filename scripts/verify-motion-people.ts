// People of every period through the kit, in every drawing style: an outfit dresses a role for the story's year and
// region (and a part the scene gives wins), the everyday poses and the new held things draw, body marks (bandage, tied,
// wet, dirty) add to the figure, and filled shapes are shaded as volumes rather than flat colour.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { motionFigureKitPage as motionHtmlFigures } from "../src/lib/motionFigures.js";

const SCENE = `<!doctype html><html><head></head><body><canvas id="motion-canvas" width="400" height="400"></canvas><script>
var FIG = window.MotionFigures.use({});
window.motionScene = { ready: Promise.resolve(), renderAt: async () => {} };
</script></body></html>`;
const STYLES = ["history", "horror", "sketch", "comic", "stick"];
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome" });
const page = await browser.newPage();
page.on("pageerror", (error) => assert.fail(String(error)));
// Draws one person on a clear canvas at the given year and returns a fingerprint of its pixels.
const draw = (o: Record<string, unknown>, year: number) =>
  page.evaluate(
    ([o, year]) => {
      const canvas = document.getElementById("motion-canvas") as HTMLCanvasElement;
      const c = canvas.getContext("2d")!;
      c.clearRect(0, 0, 400, 400);
      (window as any).__motionView = Object.assign((window as any).__motionView || {}, { year });
      const out = (window as any).MotionFigures.use({}).person(c, Object.assign({ x: 200, y: 360, h: 300, facing: 1 }, o));
      const d = c.getImageData(0, 0, 400, 400).data;
      let n = 0, sum = 0;
      const tones = new Set<number>();
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { n++; sum += d[i] * 3 + d[i + 1] * 5 + d[i + 2] * 7; tones.add((d[i] >> 3) * 1024 + (d[i + 1] >> 3) * 32 + (d[i + 2] >> 3)); }
      return { box: !!(out && out.box), n, sum, tones: tones.size };
    },
    [o, year] as const,
  );
for (const profile of STYLES) {
  await page.setContent(motionHtmlFigures(SCENE, { profile, proportion: "balanced", layout: "wide" } as any));
  const medieval = await draw({ outfit: "soldier" }, 1250), modern = await draw({ outfit: "soldier" }, 1916);
  assert.ok(medieval.box && modern.box && medieval.n > 2000, `${profile}: an outfit draws`);
  assert.notEqual(medieval.sum, modern.sum, `${profile}: a soldier of 1250 is dressed unlike one of 1916`);
  const viet = await draw({ outfit: "peasant", region: "vietnam" }, 1400), europe = await draw({ outfit: "peasant", region: "europe" }, 1400);
  assert.notEqual(viet.sum, europe.sum, `${profile}: the region changes the dress`);
  const given = await draw({ outfit: "soldier", top: "#00ff00" }, 1250);
  assert.notEqual(given.sum, medieval.sum, `${profile}: a colour the scene gives wins over the outfit`);
  for (const pose of ["cross", "eat", "shoulder", "plow", "tied", "huddle", "sleep"]) assert.ok((await draw({ pose, outfit: "peasant" }, 1500)).n > 1500, `${profile}: pose ${pose} draws`);
  for (const hold of ["bowl", "bucket", "sickle", "hoe", "net"]) assert.ok((await draw({ pose: "hold", hold }, 1500)).n > 1500, `${profile}: holds a ${hold}`);
  const plain = await draw({ outfit: "soldier" }, 1500);
  for (const mark of [{ bandage: "head" }, { bandage: "arm" }, { wounded: true }, { tied: true }, { wet: true }, { dirty: true }, { barefoot: true }]) assert.notEqual((await draw({ outfit: "soldier", ...mark }, 1500)).sum, plain.sum, `${profile}: ${Object.keys(mark)[0]} marks the body`);
  // Volume: one coat colour shows as many tones (light, core, shadow), not a flat fill.
  assert.ok((await draw({ top: "#3a5a8a", pants: "#3a5a8a" }, 1900)).tones > 60, `${profile}: shapes are shaded as volumes`);
}
await browser.close();
console.log("People: outfits by role, year and region; everyday poses; new held things; body marks; volume shading in all five styles.");
