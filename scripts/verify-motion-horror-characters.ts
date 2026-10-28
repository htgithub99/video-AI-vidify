import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { horrorCharacterAsset, horrorCharacterFrame, horrorCharacterSupported } from "../src/lib/motionHorrorCharacter.js";
import { motionVectorCutoutIssue } from "../src/lib/motionVectorCutout.js";
import { createVectorCutoutInspector } from "../src/server/services/remotion/vectorCutoutInspector.js";
import { layoutRemotionNodes } from "../src/lib/motionRemotion.js";
import { findNativeChrome } from "../src/server/services/nativeProxyBrowser.js";
const dir = path.resolve("scratch/horror-character-verification-20261027");
fs.mkdirSync(dir, { recursive: true });
assert.equal(horrorCharacterSupported({ look: "black dog" }), false);
assert.equal(horrorCharacterSupported(undefined), false);
assert.equal(horrorCharacterSupported({ gender: "male", look: "soldier in brown uniform" }), false);
assert.equal(horrorCharacterSupported({ gender: "female", look: "woman in a gray blouse" }), true);
const male = { gender: "male", age: "adult", look: "Vietnamese man, purple shirt #605d76, black hair" };
const female = { gender: "female", age: "adult", look: "Vietnamese woman, charcoal blouse, low bun" };
const assets = [
  horrorCharacterAsset("man", "man", male),
  horrorCharacterAsset("woman", "woman", female),
  horrorCharacterAsset("seated", "seated", male, "seated, frightened"),
  horrorCharacterAsset("ghost", "ghost", { gender: "female", age: "senior", look: "ghost, white shirt, hollow eyes" }, "sitting, frightened"),
  horrorCharacterAsset("back", "back", female, "standing with back turned"),
  horrorCharacterAsset("sleep", "sleep", male, "lying asleep"),
];
assert.notEqual(assets[0].svg, assets[1].svg);
assert.ok(assets[3].svg.includes("#e1e2da"));
assert.equal(assets[2].characterScale, 310 / 385);
assert.equal(horrorCharacterFrame(assets[0], 1, false, "man"), assets[0].svg);
const blinkFrames = Array.from({ length: 180 }, (_, frame) => horrorCharacterFrame(assets[0], frame / 30, true, "man"));
assert.ok(blinkFrames.some((svg) => svg.includes('id="horror-lids" opacity="1"')));
assert.ok(blinkFrames.some((svg) => svg === assets[0].svg));
assert.equal(horrorCharacterFrame(assets[0], 3, true, "man"), horrorCharacterFrame(assets[0], 3, true, "man"));
const inspector = createVectorCutoutInspector();
try {
  for (const asset of assets) {
    assert.equal(motionVectorCutoutIssue(asset.svg), undefined);
    assert.equal(await inspector.check(asset), undefined);
    for (const p of Object.values(asset.anchors!)) assert.ok(p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);
  }
} finally {
  await inspector.close();
}
const placed = layoutRemotionNodes(
  assets.slice(0, 3).map((asset, i) => ({ id: asset.key, kind: "character", assetKey: asset.key, description: asset.key, pose: i === 2 ? "seated" : "standing", slot: (["left", "center", "right"] as const)[i], evidence: "fixture" })),
  Object.fromEntries(assets.map((a) => [a.key, a])),
  1920,
  1080,
);
assert.ok(placed[2].height < placed[0].height);
const html = `<!doctype html><meta charset="utf-8"><style>body{background:#555e69;color:#eee;font:18px Arial}main{display:flex;gap:15px}article{flex:1;background:#454d58;padding:12px}img{height:450px;width:100%;object-fit:contain}</style><main>${assets.map((a) => `<article><h2>${a.key}</h2><img src="data:image/svg+xml;base64,${Buffer.from(a.svg).toString("base64")}"></article>`).join("")}</main>`;
fs.writeFileSync(path.join(dir, "index.html"), html);
const browser = await chromium.launch({ executablePath: findNativeChrome(), headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 600 } });
  await page.goto(pathToFileURL(path.join(dir, "index.html")).href);
  await page.locator("img").evaluateAll((images) => Promise.all(images.map((img) => img.decode())));
  await page.screenshot({ path: path.join(dir, "characters.jpg"), fullPage: true, type: "jpeg" });
} finally {
  await browser.close();
}
console.log("Horror characters verified: human identity, white ghost, distinct seated/back/lying poses, transparent layers, physical anchors and proportions. No AI/TTS or production run.");
