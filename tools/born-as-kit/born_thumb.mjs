import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
const KIT = path.dirname(fileURLToPath(import.meta.url));
const PW = process.env.PLAYWRIGHT;
const { chromium } = await import(PW && path.isAbsolute(PW) ? pathToFileURL(PW).href : PW || "playwright");
const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const W = 1280, H = 720;
const url = (f) => pathToFileURL(f).href;
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fonts = fs.readFileSync(path.join(KIT, "fonts", "fonts.css"), "utf8").replace(/url\(([^)]+)\)/g, (_, f) => `url(${url(path.join(KIT, "fonts", f))})`);
const CSS = `${fonts}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#000}
.t{position:absolute;font-family:'Alegreya Sans',sans-serif;font-weight:900;line-height:1.12;padding-top:.14em;text-transform:uppercase;paint-order:stroke fill;font-variant-numeric:lining-nums;white-space:nowrap}
.half{position:absolute;top:0;bottom:0;overflow:hidden}
.wall{background:radial-gradient(ellipse at 45% 40%,#f6ead2 0%,#ead6b2 60%,#d9bf93 100%)}
.wall:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(150,110,60,.07) 0 2px,transparent 2px 46px)}
.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(1.1) brightness(.62)}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 35%,rgba(10,5,2,.65) 100%)}
.spr{position:absolute;bottom:0;left:50%;transform:translateX(-50%);object-fit:contain;object-position:bottom;filter:drop-shadow(0 10px 18px rgba(0,0,0,.45))}
.seam{position:absolute;top:0;bottom:0;left:${W / 2 - 4}px;width:8px;background:#1b120b}
.born{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 42%,#6b4527 0%,#3a2414 55%,#150c06 100%)}
.grain{position:absolute;inset:0;opacity:.18;background-image:url(${url(path.join(KIT, "grain.png"))});mix-blend-mode:overlay}
`;
const anger = (x, y, s) => `<svg style="position:absolute;left:${x}px;top:${y}px" width="${s}" height="${s}" viewBox="0 0 100 100"><g fill="none" stroke="#e3262b" stroke-width="13" stroke-linecap="round"><path d="M38 8 Q42 34 14 38"/><path d="M62 8 Q58 34 86 38"/><path d="M38 92 Q42 66 14 62"/><path d="M62 92 Q58 66 86 62"/></g></svg>`;
const fit = (text, maxW, maxPx, ratio = 0.62) => Math.max(40, Math.min(maxPx, Math.floor(maxW / Math.max(1, [...text].length * ratio))));
const split = (it) => {
  const word = esc(it.word);
  const size = fit(it.word, 560, 92, 0.6);
  return `<div class="half wall" style="left:0;width:${W / 2}px">${it.baby ? `<img class="spr" src="${url(it.baby)}" style="height:${it.babyH || 470}px;max-width:560px">` : ""}
  ${anger(468, 150, 92)}
  <div class="t" style="left:44px;top:34px;font-size:104px;color:#fff;-webkit-text-stroke:16px #1b120b">${esc(it.age)}</div></div>
  <div class="half" style="left:${W / 2}px;width:${W / 2}px">${it.bg ? `<img class="bg" src="${url(it.bg)}">` : ""}<div class="vig"></div>
  ${it.bust ? `<img class="spr" src="${url(it.bust)}" style="height:600px;max-width:620px">` : ""}
  <div class="t" style="right:30px;top:36px;font-size:${size}px;color:#e3262b;-webkit-text-stroke:${Math.round(size * 0.2)}px #fff;filter:drop-shadow(0 6px 0 #1b120b) drop-shadow(0 0 2px #1b120b);transform:rotate(-2deg)">${word}</div></div>
  <div class="seam"></div>`;
};
const born = (it) => {
  const size = fit(it.name, 1200, 300, 0.66);
  return `<div class="born"></div><div class="grain"></div>
  <div class="t" style="left:0;right:0;top:40px;text-align:center;font-size:44px;letter-spacing:.12em;color:#f3e9d2;-webkit-text-stroke:6px #150c06">${esc(it.line)}</div>
  ${it.bust ? `<img class="spr" src="${url(it.bust)}" style="height:590px;max-width:700px">` : ""}
  <div class="t" style="left:0;right:0;top:${Math.round(H - 46 - size * 1.05)}px;text-align:center;font-size:${size}px;color:#f3e9d2;-webkit-text-stroke:${Math.round(size * 0.06)}px #150c06;filter:drop-shadow(0 10px 18px rgba(0,0,0,.6))">${esc(it.name)}</div>
  <div class="vig" style="background:radial-gradient(ellipse at 50% 50%,transparent 55%,rgba(8,4,2,.55) 100%)"></div>`;
};
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "born_thumb_"));
const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--no-sandbox", "--allow-file-access-from-files"] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const done = [];
for (const it of spec.items) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${it.kind === "split" ? split(it) : born(it)}</body></html>`;
  const file = path.join(dir, `${done.length}.html`);
  fs.writeFileSync(file, html);
  await p.goto(url(file));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => [...document.images].every((i) => i.complete));
  await p.screenshot({ path: it.out, type: "jpeg", quality: 90 });
  done.push(it.out);
}
await b.close();
fs.rmSync(dir, { recursive: true, force: true });
console.log(JSON.stringify(done));
