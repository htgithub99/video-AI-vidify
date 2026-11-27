import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
const PW = process.env.PLAYWRIGHT;
const { chromium } = await import(PW && path.isAbsolute(PW) ? pathToFileURL(PW).href : PW || "playwright");
const [dir, out, textsPath, facesPath] = process.argv.slice(2);
const ev = JSON.parse(fs.readFileSync(textsPath, "utf8"));
const FM = JSON.parse(fs.readFileSync(facesPath, "utf8"));
const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--no-sandbox", "--allow-file-access-from-files"] });
const vert = process.env.BORN_VERT === "1";
const p = await b.newPage({ viewport: vert ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } });
await p.goto(pathToFileURL(path.join(dir, "index.html")).href);
await p.waitForFunction(() => window.__timelines && document.fonts.status === "loaded");
const rep = [];
const times = [...new Set(ev.flatMap((e) => { const n = Math.max(2, Math.ceil((e.end - e.t - 0.6) / 0.4)); return Array.from({ length: n + 1 }, (_, j) => +(e.t + 0.6 + ((e.end - e.t - 0.66) * j) / n).toFixed(2)); }))].sort((a, c) => a - c);
for (const t of times) {
  const r = await p.evaluate(([t, FM]) => {
    document.querySelectorAll(".clip").forEach((c) => { const s = +c.dataset.start, d = +c.dataset.duration; c.style.display = t >= s && t < s + d ? "block" : "none"; });
    window.__timelines.root.seek(t, false);
    const clip = [...document.querySelectorAll(".clip")].find((c) => c.style.display === "block");
    if (!clip) return null;
    const R = (e) => { const q = e.getBoundingClientRect(); return { l: q.left, r: q.right, t: q.top, b: q.bottom }; };
    const vis = (e) => { let n = e; while (n && n !== clip) { if (+getComputedStyle(n).opacity < 0.5) return false; n = n.parentElement; } return true; };
    const texts = [...clip.querySelectorAll(".bl-t,.bp-p,.bb-p")].filter(vis).map((e) => ({ s: e.textContent.slice(0, 24), plate: e.classList.contains("bp-p"), ...R(e) }));
    const bodies = [...clip.querySelectorAll(".cam > svg use")].filter((u) => FM[u.getAttribute("href").slice(3)] && !/^bust/.test(u.getAttribute("href").slice(3))).map((u) => ({ n: u.getAttribute("href").slice(3), ...R(u) }));
    const arrows = [...clip.querySelectorAll(".bl")].filter((w) => vis(w.querySelector(".bl-t")) && vis(w.querySelector(".h"))).map((w) => { const p = w.querySelector(".bl-a > path.w"), L = p.getTotalLength(), a = p.getPointAtLength(0), m = p.getScreenCTM(), st = { x: m.a * a.x + m.c * a.y + m.e, y: m.b * a.x + m.d * a.y + m.f }; return { s: w.querySelector(".bl-t").textContent.slice(0, 24), txt: R(w.querySelector(".bl-t b")), sub: w.querySelector(".bl-t i") ? R(w.querySelector(".bl-t i")) : null, st, head: R(w.querySelector(".h")) }; });
    const spr = [...clip.querySelectorAll(".cam > svg use")].map((u) => { const q = R(u), n = u.getAttribute("href").slice(3), f = FM[n] || { l: 0, r: 0, t: 0, b: 0 }, flip = /scale\(-/.test(u.parentElement.getAttribute("transform")), W = q.r - q.l, H = q.b - q.t; const fl = flip ? 1 - f.r : f.l, fr = flip ? 1 - f.l : f.r; return { n, l: q.l + W * fl, r: q.l + W * fr, t: q.t + H * f.t, b: q.t + H * f.b }; });
    const out = [];
    for (const x of texts) {
      if (x.l < 20 || x.r > innerWidth - 20 || x.t < 20 || x.b > innerHeight - 20) out.push(`${x.s}: tràn mép ${Math.round(x.l)},${Math.round(x.t)},${Math.round(x.r)},${Math.round(x.b)}`);
      if (x.plate) for (const y of bodies) { const a = Math.max(0, Math.min(x.r, y.r) - Math.max(x.l, y.l)) * Math.max(0, Math.min(x.b, y.b) - Math.max(x.t, y.t)); if (a / ((x.r - x.l) * (x.b - x.t)) > 0.06) out.push(`${x.s}: thẻ đè người ${y.n} ${Math.round((a / ((x.r - x.l) * (x.b - x.t))) * 100)}%`); }
      for (const y of spr) { const a = Math.max(0, Math.min(x.r, y.r) - Math.max(x.l, y.l)) * Math.max(0, Math.min(x.b, y.b) - Math.max(x.t, y.t)); const fr = a / ((x.r - x.l) * (x.b - x.t)); if (fr > 0.04) out.push(`${x.s}: che đầu/mặt ${y.n} ${Math.round(fr * 100)}%`); }
      for (const z of texts) if (z !== x && z.s !== x.s) { const a = Math.max(0, Math.min(x.r, z.r) - Math.max(x.l, z.l)) * Math.max(0, Math.min(x.b, z.b) - Math.max(x.t, z.t)); if (a > 50) out.push(`${x.s}: đè chữ ${z.s}`); }
    }
    for (const ar of arrows) {
      const box = ar.sub ? { l: Math.min(ar.txt.l, ar.sub.l), r: Math.max(ar.txt.r, ar.sub.r), t: ar.txt.t, b: ar.sub.b } : ar.txt;
      const gx = Math.max(box.l - ar.st.x, 0, ar.st.x - box.r), gy = Math.max(box.t - ar.st.y, 0, ar.st.y - box.b), g = Math.hypot(gx, gy);
      if (g > 22) out.push(`${ar.s}: đuôi mũi tên cách chữ ${Math.round(g)}px`);
      for (const y of spr) { const a = Math.max(0, Math.min(ar.head.r, y.r) - Math.max(ar.head.l, y.l)) * Math.max(0, Math.min(ar.head.b, y.b) - Math.max(ar.head.t, y.t)); if (a / ((ar.head.r - ar.head.l) * (ar.head.b - ar.head.t)) > 0.35) out.push(`${ar.s}: đầu mũi tên che đầu ${y.n}`); }
    }
    return { id: clip.id, out };
  }, [t, FM]);
  if (r && r.out.length) { rep.push(`${t}s [${r.id}] ` + [...new Set(r.out)].join(" | ")); await p.screenshot({ path: `${out}/c${t.toFixed(2)}.jpg`, type: "jpeg", quality: 60 }); }
}
console.log(rep.join("\n") || "OK");
await b.close();
