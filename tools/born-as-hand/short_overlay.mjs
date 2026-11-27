import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT).href);
const KIT = "/home/claude/kitv2";
const [, , name, out] = process.argv;
const LINE = "WHAT IF YOU WERE BORN AS";
const CTA = "FULL STORY ON THE CHANNEL";
const url = (f) => pathToFileURL(f).href;
const fonts = fs.readFileSync(path.join(KIT, "fonts", "fonts.css"), "utf8").replace(/url\(([^)]+)\)/g, (_, f) => `url(${url(path.join(KIT, "fonts", f))})`);
const size = Math.min(150, Math.floor(1000 / ([...name].length * 0.6)));
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
*{margin:0;padding:0}html,body{width:1080px;height:1920px;background:transparent}
.t{position:absolute;left:0;right:0;text-align:center;font-family:'Alegreya Sans',sans-serif;font-weight:900;text-transform:uppercase;line-height:1.12;padding-top:.14em;paint-order:stroke fill}
.l{top:330px;font-size:56px;letter-spacing:.08em;color:#f3e9d2;-webkit-text-stroke:10px #150c06}
.n{top:410px;font-size:${size}px;color:#fff;-webkit-text-stroke:${Math.round(size * 0.12)}px #150c06;filter:drop-shadow(0 8px 0 #150c06)}
.c{top:1520px;display:flex;justify-content:center}
.c span{font-family:'Alegreya Sans',sans-serif;font-weight:900;font-size:52px;color:#1b120b;background:#f4eee0;border:6px solid #1b120b;border-radius:22px;padding:8px 34px 4px;box-shadow:0 8px 0 #1b120b}
</style></head><body><div class="t l">${LINE}</div><div class="t n">${name}?</div><div class="t c"><span>${CTA} ▶</span></div></body></html>`;
const f = `/tmp/ov_${Date.now()}.html`;
fs.writeFileSync(f, html);
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ["--no-sandbox", "--allow-file-access-from-files"] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(url(f));
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: out, omitBackground: true });
await b.close();
fs.unlinkSync(f);
