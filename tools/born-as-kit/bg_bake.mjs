import { chromium } from "/home/claude/web/node_modules/playwright/index.mjs";
import fs from "fs";
const [svgDir, outDir, ...names] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
for (const n of names) {
  await p.setContent(`<html><body style="margin:0">${fs.readFileSync(`${svgDir}/${n}.svg`, "utf8")}</body></html>`);
  await p.screenshot({ path: `${outDir}/${n}.png` });
  console.log(n);
}
await b.close();
