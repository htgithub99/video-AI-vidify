import path from "path";
import { pathToFileURL } from "url";
const PW = process.env.PLAYWRIGHT;
const { chromium } = await import(PW && path.isAbsolute(PW) ? pathToFileURL(PW).href : PW || "playwright");
const [dir, out, ...ts] = process.argv.slice(2);
const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--no-sandbox", "--allow-file-access-from-files"] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(pathToFileURL(path.join(dir, "index.html")).href);
await p.waitForFunction(() => window.__timelines && document.fonts.status === "loaded");
await p.evaluate(() => document.fonts.ready);
for (const t of ts) {
  await p.evaluate((t) => {
    document.querySelectorAll(".clip").forEach((c) => { const s = +c.dataset.start, d = +c.dataset.duration; c.style.display = t >= s && t < s + d ? "block" : "none"; });
    window.__timelines.root.seek(t, false);
  }, +t);
  await p.waitForTimeout(60);
  await p.screenshot({ path: `${out}/t${(+t).toFixed(2)}.jpg`, type: "jpeg", quality: 70 });
}
console.log(errs.join("\n") || "no errors");
await b.close();
