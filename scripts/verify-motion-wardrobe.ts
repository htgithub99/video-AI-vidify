import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";
import { buildMotionRenderHtml, MOTION_ASSET_BASE, resolveMotionAsset } from "../src/server/services/motionEngineService.ts";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  await page.route(MOTION_ASSET_BASE + "**", async (route) => {
    const file = resolveMotionAsset(new URL(route.request().url()).pathname);
    await route.fulfill({ status: file ? 200 : 404, body: file ? fs.readFileSync(file) : "", headers: { "Access-Control-Allow-Origin": "*" } });
  });
  const spec = JSON.parse(fs.readFileSync("motion-engine/demo/editorial-qa.json", "utf8"));
  await page.setContent(buildMotionRenderHtml(spec));
  await page.evaluate(async (spec) => (window as any).__load(spec, { supersample: 1, motionBlur: 1, bloom: false, grain: false, layerScale: 1 }, 640, 360), spec);
  const cases = await page.evaluate(() => {
    const GEN = (window as any).MotionEngine.GEN;
    return ["male", "female"].flatMap((body) =>
      ["stand", "sit"].flatMap((action) =>
        ["long", "short", "none"].map((sleeves) => {
          const actor = GEN.createActor( { body, layers: [ { kind: "shirt", color: "#526070", sleeves }, { kind: "trousers", color: "#262a30" }, ], }, {}, );
          actor.pose([{ id: action, time: 0.75, weight: 1 }], 0.75);
          GEN.staticWardrobe(actor);
          const wardrobe = actor.group.getObjectByName("staticWardrobe");
          let finite = true, baseIndices = 0;
          actor.group.traverse((o: any) => {
            if (o.geometry) { finite &&= Array.from(o.geometry.attributes.position.array).every(Number.isFinite); if (o.isSkinnedMesh && !o.userData.keep) baseIndices += o.geometry.index.count; }
          });
          const count = wardrobe?.children.length || 0;
          GEN.staticWardrobe(actor);
          const stable = count === wardrobe?.children.length;
          actor.dispose();
          return { body, action, sleeves, finite, count, stable, baseIndices };
        }),
      ),
    );
  });
  for (const c of cases) {
    assert.ok(c.finite && c.stable && c.count >= 3, JSON.stringify(c));
    if (c.sleeves === "short") { const long = cases.find((x) => x.body === c.body && x.action === c.action && x.sleeves === "long")!; assert.ok(c.baseIndices > long.baseIndices, "Short sleeves must preserve exposed arm geometry"); }
  }
  console.log(`Wardrobe passed: ${cases.length} real skeleton/outfit cases, finite geometry, preserved bare arms, idempotent construction.`);
} finally {
  await browser.close();
}
