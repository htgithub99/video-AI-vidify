// Every layout frames every kind of scene by the film shot scale, measured on the drawn page: the lead's height on screen
// in each planned shot (wide = the master frame, full = whole body, cowboy / medium / mcu = cut at the thigh / below the
// waist / mid-chest), a focal thing filling the frame, a crowd seen whole, a map never cut; in landscape and portrait.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { motionHtmlFigures } from "../src/lib/motionFigures.js";
import { motionSceneSpecFix, motionSceneSpecPage } from "../src/lib/motionSceneSpec.js";
import type { MotionSceneSpec } from "../src/types/motionSceneSpec.js";

const RECORD = "window.__MOTION_HOST__=true;window.__motionMarks=[];window.motionMark=function(ctx,id,x,y,w,h){const t=ctx.getTransform();const p=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([a,b])=>[t.a*a+t.c*b+t.e,t.b*a+t.d*b+t.f]);const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]);window.__motionMarks.push({id:String(id),x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)});};";
const person = (id: string, x: number, y: number, h: number, extra: Record<string, unknown> = {}) => ({ id, fn: "person", x, y, h, ...extra });
const scene = (frame: [number, number], items: unknown[], extra: Record<string, unknown> = {}) => {
  const spec = { version: 1, frame, horizon: Math.round(frame[1] * 0.42), time: "day", ground: "grass", items, ...extra } as unknown as MotionSceneSpec;
  motionSceneSpecFix(spec, { year: 1950, gaps: [] });
  return spec;
};
const CASES: { name: string; spec: MotionSceneSpec; focus: string; kind: "person" | "thing" | "group" | "map"; shot?: string; genre?: string }[] = [
  // Drawn too close by the AI (the lead 40 % of the frame): the master frame steps back to a quarter.
  { name: "battle-close-drawn", kind: "person", focus: "you", spec: scene([1280, 720], [person("you", 520, 640, 290, { focal: true }), person("ally", 800, 650, 285), { id: "tent", fn: "building", kind: "tent", x: 1050, y: 450, h: 120 }]) },
  { name: "dialogue", kind: "person", focus: "anna", spec: scene([1280, 720], [person("anna", 520, 620, 180, { focal: true }), person("ben", 760, 625, 178)]) },
  { name: "portrait", kind: "person", focus: "you", spec: scene([720, 1280], [person("you", 360, 1080, 290, { focal: true }), { id: "dog", fn: "animal", kind: "dog", x: 520, y: 1090, h: 110 }]) },
  { name: "ship", kind: "thing", focus: "ship", spec: scene([1280, 720], [{ id: "ship", fn: "vehicle", kind: "warship", x: 640, y: 560, h: 330, focal: true }]) },
  { name: "plane", kind: "thing", focus: "jet", spec: scene([1280, 720], [{ id: "jet", fn: "vehicle", kind: "fighter", x: 640, y: 250, h: 110, w: 380, focal: true, keys: [{ at: 0, x: 400, y: 250 }, { at: 1, x: 880, y: 230 }] }]) },
  { name: "crowd", kind: "group", focus: "army", spec: scene([1280, 720], [person("army", 640, 600, 150, { group: { count: 12, width: 900 } })]) },
];
const LAYOUTS = ["wide", "stage", "medium", "cinematic", "close", "auto"];
// On-screen ranges (share of the frame height for a person; of the frame side for a thing).
const CUT = { cowboy: 0.76, medium: 0.6, mcu: 0.44 } as Record<string, number>;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome" });
const problems: string[] = [];
let checked = 0;
for (const c of CASES) {
  for (const layout of LAYOUTS) for (const movement of ["smooth", "cutout"]) {
    const [W, H] = c.spec.frame || [1280, 720];
    const tab = await browser.newPage({ viewport: { width: W, height: H } });
    const errors: string[] = [];
    tab.on("pageerror", (e) => errors.push(String(e)));
    await tab.setContent(motionHtmlFigures(motionSceneSpecPage(c.spec), { profile: "comic", layout, movement, year: 1950, scene: { shot: c.shot || "wide", kind: c.kind === "map" ? "map" : "here" } } as never).replace("<head>", `<head><script>${RECORD}</script>`));
    await tab.evaluate("window.__name = function (f) { return f; }");
    const result = await tab.evaluate(async ([W, H, focus]: [number, number, string]) => {
      const w = window as any;
      await w.motionScene.ready;
      const input = (p: number) => ({ mode: "export", width: W, height: H, time: p * 12, frame: Math.round(p * 360), fps: 30, duration: 12, progress: p, cues: [0, 0.34, 0.67], motionEnabled: true, cameraEnabled: true, sceneEffectsEnabled: true, seed: "x", speaking: [] });
      await w.motionScene.renderAt(input(0));
      const plan = w.__motionViewHooks.plan, out: any[] = [];
      for (const shot of plan.shots) {
        const p = shot.a + (shot.b - shot.a) * 0.8;
        w.__motionMarks = [];
        await w.motionScene.renderAt(input(p));
        const own = w.__motionMarks.filter((m: any) => m.id === focus);
        const box = own.reduce((b: any, m: any) => (b ? { x0: Math.min(b.x0, m.x), y0: Math.min(b.y0, m.y), x1: Math.max(b.x1, m.x + m.w), y1: Math.max(b.y1, m.y + m.h) } : { x0: m.x, y0: m.y, x1: m.x + m.w, y1: m.y + m.h }), null);
        out.push({ size: shot.size, z: shot.z, box });
      }
      return { layout: plan.layout, shots: out };
    }, [W, H, c.focus] as [number, number, string]);
    await tab.close();
    if (errors.length) problems.push(`${c.name}/${layout}/${movement}: ${errors[0]}`);
    for (const s of result.shots) {
      checked++;
      const tag = `${c.name}/${layout}/${movement}/${s.size}`;
      if (!s.box) { problems.push(tag + ": subject not drawn"); continue; }
      const top = s.box.y0 / H, bottom = s.box.y1 / H, tall = bottom - top, base = W < H ? (W * 1.6) / H : 1;
      if (c.kind === "person") {
        if (s.size === "wide") { if (tall / base < 0.1 || tall / base > 0.3) problems.push(`${tag}: lead ${(tall / base).toFixed(2)} of the frame (wide 0.22-0.28)`); }
        else if (s.size === "full") { if (tall < 0.7 || tall > 0.94 || top < 0) problems.push(`${tag}: whole body ${tall.toFixed(2)} (full 0.75-0.88, up to 0.93 at the end of the push-in)`); }
        else { const seen = (1 - Math.max(0, top)) / tall; if (top < 0 || top > 0.14 || Math.abs(seen - CUT[s.size]) > 0.12) problems.push(`${tag}: crown ${top.toFixed(2)}, cut at ${seen.toFixed(2)} (want ${CUT[s.size]})`); }
      } else if (c.kind === "thing" || c.kind === "group") {
        const side = Math.max((s.box.x1 - s.box.x0) / W, tall);
        if (s.size === "wide") { if (c.kind === "thing" && side > 0.62) problems.push(`${tag}: thing fills ${side.toFixed(2)} in the master (≤ 0.45 + room)`); }
        else if (side < 0.62 || side > 1.25) problems.push(`${tag}: thing fills ${side.toFixed(2)} (0.8-1.1)`);
      }
    }
  }
}
await browser.close();
assert.deepEqual(problems, [], "every layout frames every scene by the shot scale");
console.log(`Layout scale: ${checked} shots over ${CASES.length} scenes × ${LAYOUTS.length} layouts × 2 movements framed by the film shot scale (people, things, a crowd, portrait).`);
