import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { MOTION_OBJECT_CATALOG } from "../src/constants/motionObjectCatalog.js";
import { MOTION_DRAW_STYLES } from "../src/constants/motionDrawStyles/index.js";
import { MOTION_KIT_AUDIT as A } from "../src/constants/motionKitAudit.js";
import { MOTION_SCENE_REVISE as R } from "../src/constants/motionSceneSpec.js";
import { motionFigureKitPage } from "../src/lib/motionFigures.js";
import { motionCatalogGap } from "../src/lib/motionObjectCatalog.js";
import { motionSceneSpecOf } from "../src/lib/motionSceneSpec.js";
const out = process.argv[2] || A.OUT;
const specFiles = process.argv.slice(3);
fs.mkdirSync(out, { recursive: true });
const SCENE = `<!doctype html><html><head></head><body><canvas id="motion-canvas" width="${A.CELL * A.COLS}" height="${A.CELL}"></canvas><script>window.motionScene = { ready: Promise.resolve(), renderAt: async () => {} };</script></body></html>`;
const inYears = (e: { from?: number; to?: number }, y: number) => !((e.from != null && y < e.from) || (e.to != null && y > e.to));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome" });
const page = await browser.newPage({ viewport: { width: A.CELL * A.COLS, height: A.CELL } });
const report: { style: string; year: number; what: string; issue: string; size?: number }[] = [];
const measure = (list: Record<string, unknown>[]) =>
  page.evaluate(
    ({ list, A }) => {
      const cv = document.getElementById("motion-canvas") as HTMLCanvasElement,
        c = cv.getContext("2d")!,
        FIG = (window as any).MotionFigures.use({});
      return list.map((o) => {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, cv.width, cv.height);
        let ok = false;
        try {
          const r = FIG[o.fn as string](c, Object.assign({ x: A.CELL / 2, y: A.CELL * 0.85, h: A.H, facing: 1 }, o));
          ok = !!(r && r.box);
        } catch (e) {}
        const d = c.getImageData(0, 0, A.CELL, A.CELL).data;
        let changed = 0,
          shot = cv.toDataURL("image/png");
        if (o.hold) {
          const bare = Object.assign({}, o);
          delete bare.hold;
          c.setTransform(1, 0, 0, 1, 0, 0);
          c.clearRect(0, 0, cv.width, cv.height);
          try {
            FIG.person(c, Object.assign({ x: A.CELL / 2, y: A.CELL * 0.85, h: A.H, facing: 1 }, bare));
          } catch (e) {}
          const e0 = c.getImageData(0, 0, A.CELL, A.CELL).data;
          for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - e0[i]) + Math.abs(d[i + 1] - e0[i + 1]) + Math.abs(d[i + 2] - e0[i + 2]) + Math.abs(d[i + 3] - e0[i + 3]) > 60) changed++;
        }
        let n = 0,
          x0 = A.CELL,
          x1 = -1,
          y0 = A.CELL,
          y1 = -1;
        for (let y = 0; y < A.CELL; y++)
          for (let x = 0; x < A.CELL; x++)
            if (d[(y * A.CELL + x) * 4 + 3] > 40) {
              n++;
              if (x < x0) x0 = x;
              if (x > x1) x1 = x;
              if (y < y0) y0 = y;
              if (y > y1) y1 = y;
            }
        return { ok, n, changed, w: x1 - x0 + 1, h: y1 - y0 + 1, png: shot };
      });
    },
    { list, A: { CELL: A.CELL, H: A.H } },
  );
const sheet = async (name: string, cells: { label: string; png: string; bad: boolean }[]) => {
  const html = `<html><body style="margin:0;background:#fff;font:10px sans-serif;display:flex;flex-wrap:wrap">${cells.map((c) => `<div style="width:${A.CELL}px;border:1px solid ${c.bad ? "#d00" : "#ddd"}"><img src="${c.png}" style="width:${A.CELL}px;height:${A.CELL}px;object-fit:none;object-position:left top"><div>${c.label}</div></div>`).join("")}</body></html>`;
  const p = await browser.newPage({ viewport: { width: A.CELL * 8 + 20, height: 400 } });
  await p.setContent(html);
  await p.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
  await p.close();
};
for (const style of Object.keys(MOTION_DRAW_STYLES)) {
  for (const year of A.YEARS) {
    await page.setContent(motionFigureKitPage(SCENE, { profile: style, proportion: "balanced", layout: "wide", year }));
    const things = MOTION_OBJECT_CATALOG.filter((e) => inYears(e, year) && !e.variants.every((v) => v.kit.join(":").startsWith("bridge:")));
    const got = await measure(things.map((e) => ({ fn: e.fn, kind: e.id, ...(e.variants.every((v) => v.builds) && e.builds ? { build: e.builds[0] } : {}), ...((A.SPAN as readonly string[]).includes(e.fn) || (A.SPAN as readonly string[]).includes(e.id) ? { w: A.H * 1.4, h: A.H * 0.35 } : {}) })));
    const cells = things.map((e, i) => {
      const g = got[i],
        what = `${e.fn}:${e.id}`,
        issue = !g.ok || g.n < A.MIN_PIXELS ? "undrawn" : Math.max(g.w, g.h) < A.MIN_SIDE ? "tiny" : "";
      if (issue) report.push({ style, year, what, issue, size: Math.max(g.w, g.h) });
      return { label: what, png: g.png, bad: !!issue };
    });
    const flat = things.filter((e) => e.fn === "prop" && new RegExp(R.LIE_FLAT).test(e.id)),
      up = await measure(flat.map((e) => ({ fn: "prop", kind: e.id }))),
      down = await measure(flat.map((e) => ({ fn: "prop", kind: e.id, lying: true })));
    flat.forEach((e, i) => {
      if (down[i].h > up[i].h * A.LIE_MAX) report.push({ style, year, what: `lying:${e.id}`, issue: "not-flat", size: down[i].h });
    });
    const [plain, mitre] = await measure([{ fn: "person", pose: "stand", head: "none" }, { fn: "person", pose: "stand", head: "mitre" }]);
    if (!(mitre.h > plain.h * A.HEAD_TALLER)) report.push({ style, year, what: "head:mitre", issue: "not-drawn", size: mitre.h });
    const bare = (await measure([{ fn: "person", look: undefined, pose: "stand" }]))[0];
    const holds = A.HOLDS.flatMap((hold) => A.POSES.map((pose) => ({ hold, pose })));
    const held = await measure(holds.map(({ hold, pose }) => ({ fn: "person", hold, pose, outfit: "levy" })));
    const holdCells = holds.map(({ hold, pose }, i) => {
      const extra = held[i].changed,
        what = `hold:${hold}:${pose}`,
        issue = !held[i].ok ? "undrawn" : extra < A.HOLD_PIXELS * (bare.n / 1000) * ((A.SMALL_HOLDS as readonly string[]).includes(hold) ? A.SMALL_SHARE : 1) ? "hold-small" : "";
      if (issue) report.push({ style, year, what, issue, size: extra });
      return { label: what, png: held[i].png, bad: !!issue };
    });
    if (year === A.SHEET_YEAR) {
      await sheet(`kit_${style}`, cells.filter((c) => c.bad).concat(cells.filter((c) => !c.bad).slice(0, A.SHEET_OK)));
      await sheet(`hold_${style}`, holdCells);
    }
  }
}
const unknown: { file: string; what: string }[] = [];
for (const file of specFiles) {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const specs = Object.values(raw as Record<string, { spec?: unknown; html?: string }>)
    .map((v) => (v.spec ? v.spec : motionSceneSpecOf(v.html)))
    .filter(Boolean) as { items: { fn: string; kind?: string }[]; map?: unknown }[];
  specs.forEach((s) => !s.map && s.items.forEach((it) => it.kind && ["vehicle", "building", "prop", "animal", "tree"].includes(it.fn) && motionCatalogGap(it.fn as never, it.kind, undefined, undefined)?.reason === "unknown" && unknown.push({ file, what: `${it.fn}:${it.kind}` })));
}
fs.writeFileSync(path.join(out, A.REPORT), JSON.stringify({ issues: report, unknown }, null, 1));
console.log(A.SUMMARY(report.length, unknown.length, out));
await browser.close();
