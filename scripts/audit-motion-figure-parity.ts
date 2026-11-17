// Measures, on productions already made (no AI request, no voice), how the two renderers of each scene compare:
// - lines of scene code;
// - figure calls drawn by the kit vs. left to the scene's own drawing in "Bộ vẽ chuẩn" (own = the kit could not);
// - options left out of calls (outside the figure vocabulary);
// - marks one renderer shows and the other does not ("khác nội dung"), over three moments of the scene;
// - arrows on scenes that are not maps; things drawn into figure functions outside their options.
// Usage: tsx scripts/audit-motion-figure-parity.ts <out dir> <production.json>... [--sheets]
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { motionHtmlFigures, motionFigureOwnExtras } from "../src/lib/motionFigures.js";

const args = process.argv.slice(2);
const sheets = args.includes("--sheets");
const [out, ...files] = args.filter((a) => a !== "--sheets");
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome" });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.addInitScript("window.__MOTION_HOST__=true;window.__motionMarks=[];window.motionMark=function(ctx,id,x,y,w,h){window.__motionMarks.push({id:String(id)})};");
const totals = { scenes: 0, lines: 0, kit: 0, own: 0, dropped: 0, differ: 0, arrows: 0, extras: 0 };
const rows: any[] = [];
for (const file of files) {
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  const year = d.result?.analysis?.eraYear ?? d.result?.script?.analysis?.eraYear ?? d.analysis?.eraYear;
  const groups = d.result?.script?.gen?.remotion?.scenes || {};
  let n = 0;
  for (const list of Object.values<any[]>(groups)) for (const s of list) {
    const html = s.html?.html;
    if (!html || !/MotionFigures/.test(html)) continue;
    n++;
    const scene = { shot: s.shot, kind: s.kind, sceneTemplate: s.sceneTemplate };
    const marks: Record<string, Set<string>> = {}, stats: Record<string, number> = {};
    const dropped = new Set<string>();
    for (const mode of ["ai", "kit"]) {
      fs.writeFileSync(path.join(out, "p.html"), motionHtmlFigures(html, { kit: mode === "kit", profile: "cutout", layout: "wide", year, scene } as never));
      await page.goto("file://" + path.resolve(out, "p.html"));
      const r = await page.evaluate(async () => {
        const W = window as any, seen: string[] = [], drop: string[] = [];
        W.__motionFigureStats = {};
        try { await W.motionScene.ready; } catch {}
        for (const p of [0.2, 0.5, 0.8]) {
          W.__motionMarks = [];
          try { await W.motionScene.renderAt({ progress: p, time: p * 8, duration: 8, fps: 30, width: 1280, height: 720, cameraEnabled: false, motionEnabled: true }); } catch {}
          for (const m of W.__motionMarks) (String(m.id).startsWith("!fault:drop:") ? drop : seen).push(p + "|" + m.id);
        }
        return { seen, drop, stats: W.__motionFigureStats };
      }).catch(() => ({ seen: [], drop: [], stats: {} }));
      marks[mode] = new Set(r.seen.filter((id: string) => !id.split("|")[1].startsWith("~")));
      r.drop.forEach((id: string) => dropped.add(id.split("|")[1]));
      if (mode === "kit") Object.assign(stats, r.stats);
      if (sheets && mode) await page.screenshot({ path: path.join(out, `${path.basename(file, ".json").slice(0, 8)}_${n}_${mode}.jpg`), type: "jpeg", quality: 70 });
    }
    const differ = [...marks.ai].filter((m) => !marks.kit.has(m)).concat([...marks.kit].filter((m) => !marks.ai.has(m))).map((m) => m.split("|")[1]);
    const kit = Object.entries(stats).filter(([k]) => k.startsWith("kit:")).reduce((a, [, v]) => a + v, 0);
    const ownList = Object.entries(stats).filter(([k]) => k.startsWith("own:"));
    const own = ownList.reduce((a, [, v]) => a + v, 0);
    const arrows = s.kind !== "map" ? (html.match(/\bFIG\.arrow\s*\(/g) || []).length : 0;
    const extras = motionFigureOwnExtras(html);
    const row = { file: path.basename(file).slice(0, 8), n, lines: html.split("\n").length, kit, own, ownKinds: ownList.map(([k]) => k.slice(4)).slice(0, 8), dropped: [...dropped], differ: [...new Set(differ)], arrows, extras };
    rows.push(row);
    totals.scenes++; totals.lines += row.lines; totals.kit += kit; totals.own += own; totals.dropped += dropped.size; totals.differ += row.differ.length; totals.arrows += arrows; totals.extras += extras.length;
  }
}
await browser.close();
fs.writeFileSync(path.join(out, "rows.json"), JSON.stringify({ totals, rows }, null, 1));
console.log(JSON.stringify(totals));
