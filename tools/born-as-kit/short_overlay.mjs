import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
const PW = process.env.PLAYWRIGHT;
const { chromium } = await import(PW && path.isAbsolute(PW) ? pathToFileURL(PW).href : PW || "playwright");
const KIT = path.dirname(fileURLToPath(import.meta.url));
const [name, dir, line = "WHAT IF YOU WERE BORN AS", cta = "FULL STORY ON THE CHANNEL"] = process.argv.slice(2);
const url = (f) => pathToFileURL(f).href;
const fonts = fs.readFileSync(path.join(KIT, "fonts", "fonts.css"), "utf8").replace(/url\(([^)]+)\)/g, (_, f) => `url(${url(path.join(KIT, "fonts", f.replace(/["']/g, "")))})`);
const size = Math.min(150, Math.floor(1000 / Math.max(1, [...name].length * 0.6)));
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;background:transparent}
.t{position:absolute;left:0;right:0;text-align:center;font-family:'Alegreya Sans',sans-serif;font-weight:900;text-transform:uppercase;line-height:1.12;padding-top:.14em;paint-order:stroke fill}
.l{top:330px;font-size:56px;letter-spacing:.08em;color:#f3e9d2;-webkit-text-stroke:10px #150c06}
.n{top:410px;font-size:${size}px;color:#fff;-webkit-text-stroke:${Math.round(size * 0.12)}px #150c06;filter:drop-shadow(0 8px 0 #150c06)}
.c{top:1520px;display:flex;justify-content:center}
.c span{font-family:'Alegreya Sans',sans-serif;font-weight:900;font-size:52px;color:#1b120b;background:#f4eee0;border:6px solid #1b120b;border-radius:22px;padding:8px 34px 4px;box-shadow:0 8px 0 #1b120b}
body.cta .l,body.cta .n,body.title .c{display:none}
</style></head><body><div class="t l">${line}</div><div class="t n">${name}?</div><div class="t c"><span>${cta} ▶</span></div></body></html>`;
const f = path.join(os.tmpdir(), `born_ov_${process.pid}.html`);
fs.writeFileSync(f, html);
const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--no-sandbox", "--allow-file-access-from-files"] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(url(f));
await p.evaluate(() => document.fonts.ready);
for (const [part, file] of [["title", "ovt.png"], ["cta", "ov.png"]]) {
  await p.evaluate((c) => (document.body.className = c), part);
  await p.screenshot({ path: path.join(dir, file), omitBackground: true });
}
await b.close();
fs.unlinkSync(f);
console.log(JSON.stringify({ ok: true }));
