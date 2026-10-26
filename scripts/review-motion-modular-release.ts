import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { MODULAR_RELEASE as M } from "./motionModularReleaseCatalog.js";
import { MOTION_LIBRARY_RELEASE as C } from "../src/constants/motionLibraryRelease.js";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import type { PuppetSet } from "../src/types/motionPuppet.js";
const directory = path.resolve(M.ROOT, C.RELEASES, M.ID);
const output = path.resolve("scratch/modular-library-release-20261026/boards");
const sets = fs.readdirSync(path.join(directory, "set")).map((file) => JSON.parse(fs.readFileSync(path.join(directory, "set", file), "utf8")) as PuppetSet);
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1230 }, deviceScaleFactor: 1 });
  for (const [preset, styleId] of Object.entries(K.PRESETS)) {
    const cells = M.PROFILES.map(([family]) => {
      const set = sets.filter((asset) => asset.styleId === styleId && asset.locationFamily === family && asset.time === "day").sort((a, b) => a.name.localeCompare(b.name))[0];
      return `<article><img src="data:image/svg+xml;base64,${Buffer.from(set.svg).toString("base64")}"/><label>${family} · ${set.plan!.pieces.length} pieces</label></article>`;
    }).join("");
    const html = `<html><head><style>body{margin:0;background:#202329;color:white;font:14px Arial;display:grid;grid-template-columns:repeat(5,320px)}article{margin:0;height:205px}img{display:block;width:320px;height:180px}label{display:block;padding:4px}</style></head><body>${cells}</body></html>`;
    fs.writeFileSync(path.join(output, preset + ".html"), html);
    await page.setContent(html);
    await page.locator("img").evaluateAll((images) => Promise.all(images.map((image) => (image as HTMLImageElement).decode())));
    await page.screenshot({ path: path.join(output, preset + ".jpg"), type: "jpeg", quality: 88, fullPage: true });
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ output, boards: 2, scenes: M.PROFILES.length * 2, videoCreated: false }));
