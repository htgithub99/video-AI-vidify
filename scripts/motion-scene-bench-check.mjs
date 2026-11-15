// Step 2 of the scene layout bench (see verify-motion-scene-bench.ts).
// usage: node scripts/motion-scene-bench-check.mjs [benchDir] [chromePath]
// PLAYWRIGHT_MODULE overrides where playwright is imported from.
import fs from "node:fs";
import path from "node:path";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const dir = path.resolve(process.argv[2] || "storage/tmp/scene-bench");
const exe = process.argv[3] || process.env.CHROME_PATH || undefined;
const { styles, fixtures } = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
const host = "window.__MOTION_HOST__=true;window.__motionMarks=[];window.motionMark=function(ctx,id,x,y,w,h){const t=ctx.getTransform(),c=ctx.canvas,p=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(q=>[t.a*q[0]+t.c*q[1]+t.e,t.b*q[0]+t.d*q[1]+t.f]),X=p.map(q=>q[0]),Y=p.map(q=>q[1]),l=Math.min(...X),u=Math.min(...Y);window.__motionMarks.push({id:String(id),x:l/c.width,y:u/c.height,w:(Math.max(...X)-l)/c.width,h:(Math.max(...Y)-u)/c.height})};";
const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const failures = [], notes = [];
const fail = (style, name, text) => failures.push(`${style}/${name}: ${text}`);
const render = (progress) =>
  page.evaluate(async (progress) => {
    window.__motionMarks = [];
    await window.motionScene.renderAt({ time: progress * 8, progress, frame: Math.round(progress * 240), fps: 30, duration: 8, width: 1280, height: 720, mode: "preview", motionEnabled: true, cameraEnabled: true, sceneEffectsEnabled: false, seed: "bench", speaking: [] });
    const c = document.getElementById("motion-canvas"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const sky = [0, 0, 0], low = { n: 0, hit: 0 };
    let k = 0;
    for (let y = 2; y < 30; y += 4) for (let x = 0; x < c.width; x += 16) { const i = (y * c.width + x) * 4; sky[0] += d[i]; sky[1] += d[i + 1]; sky[2] += d[i + 2]; k++; }
    sky.forEach((v, i) => (sky[i] = v / k));
    for (let y = Math.round(c.height * 0.8); y < c.height; y += 4) for (let x = 0; x < c.width; x += 8) { const i = (y * c.width + x) * 4; low.n++; if (Math.abs(d[i] - sky[0]) + Math.abs(d[i + 1] - sky[1]) + Math.abs(d[i + 2] - sky[2]) < 24) low.hit++; }
    return { marks: window.__motionMarks.slice(), issues: (window.__motionKitIssues || []).slice(), skyLow: low.hit / low.n, errors: (window.__benchErrors || []).slice() };
  }, progress);
const leak = () =>
  page.evaluate(async () => {
    const K = window.MotionKit, terrain = K.terrain, effect = K.effect;
    K.terrain = function (c, o) { if (o && o.kind === "sky") { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = "#ff00ff"; c.fillRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); return null; } return terrain.apply(this, arguments); };
    K.effect = function (c, o) { if (o && ["night", "dusk", "dawn", "storm", "fog", "firelight"].includes(o.kind)) return null; return effect.apply(this, arguments); };
    try {
      await window.motionScene.renderAt({ time: 4, progress: 0.5, frame: 120, fps: 30, duration: 8, width: 1280, height: 720, mode: "preview", motionEnabled: true, cameraEnabled: true, sceneEffectsEnabled: false, seed: "bench", speaking: [] });
      const c = document.getElementById("motion-canvas"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let n = 0, hit = 0;
      for (let y = Math.round(c.height * 0.85); y < c.height; y += 4) for (let x = 0; x < c.width; x += 8) { const i = (y * c.width + x) * 4; n++; if (d[i + 3] < 200 || (d[i] > 235 && d[i + 1] < 30 && d[i + 2] > 235)) hit++; }
      return hit / n;
    } finally { K.terrain = terrain; K.effect = effect; }
  });
const box = (marks, id) => {
  const list = marks.filter((m) => String(m.id).toLowerCase() === id && m.src === "kit");
  if (!list.length) return null;
  const x = Math.min(...list.map((m) => m.x)), y = Math.min(...list.map((m) => m.y));
  return { x, y, w: Math.max(...list.map((m) => m.x + m.w)) - x, h: Math.max(...list.map((m) => m.y + m.h)) - y };
};
for (const style of styles) {
  for (const name of fixtures) {
    const html = fs.readFileSync(path.join(dir, `${style}__${name}.html`), "utf8").replace(/<head>/i, `<head><script>window.__benchErrors=[];addEventListener('error',e=>window.__benchErrors.push(e.message));${host}</script>`);
    fs.writeFileSync(path.join(dir, "_page.html"), html);
    await page.goto("file://" + path.join(dir, "_page.html").replace(/\\/g, "/"));
    const a = await render(0.1), key = await render(0.5);
    await page.screenshot({ path: path.join(dir, `${style}__${name}__key.png`) });
    const b = await render(0.9);
    if ([...a.errors, ...key.errors, ...b.errors].length) fail(style, name, "script error " + [...a.errors, ...key.errors, ...b.errors][0]);
    const sky = await leak();
    if (sky > 0.01) fail(style, name, `sky or empty canvas shows in the lowest 15% of the frame (${(sky * 100).toFixed(1)}%)`);
    const hero0 = box(a.marks, "hero"), hero1 = box(b.marks, "hero"), hero = box(key.marks, "hero");
    if (!hero) fail(style, name, "kit did not record the mark 'hero'");
    if (hero0 && hero1 && Math.abs(hero0.x - hero1.x) + Math.abs(hero0.h - hero1.h) < 0.02) fail(style, name, "hero does not move between 10% and 90%");
    const moved = (id) => key.issues.some((text) => text.includes(" " + id + " "));
    if (name === "river_bridge") {
      if (!moved("wetfire")) fail(style, name, "fire on open water was not moved to a bank");
      if (!moved("wetman")) fail(style, name, "person on open water was not moved to a bank");
      for (const id of ["farfire", "hero", "rider"]) if (moved(id)) fail(style, name, `${id} was moved although it stands on a bank or the bridge`);
    }
    if (name === "march_wide") {
      if (!moved("floater")) fail(style, name, "person in the sky was not moved down");
      if (moved("hero") || moved("king")) fail(style, name, "a person on the ground was moved");
    }
    if (name === "camp_night") {
      const rope = box(key.marks, "rope");
      if (rope && hero && rope.h > hero.h * 0.35) fail(style, name, `rope coil is ${(rope.h / hero.h * 100).toFixed(0)}% of a person's height`);
    }
    if (name === "kit_coverage") {
      const unknownIds = key.marks.filter((m) => String(m.id).startsWith("!unknown:")).map((m) => m.id);
      if (!unknownIds.some((id) => id.includes("zzgizmo"))) fail(style, name, "an unknown kind was not reported");
      for (const id of unknownIds) if (!id.includes("zzgizmo")) fail(style, name, `kit reports ${id} as unknown`);
      for (const id of ["pyramid", "palace", "spear", "axe", "scroll", "bow", "bucket", "stonepile", "riders"]) { const b = box(key.marks, id); if (!b || b.w <= 0 || b.h <= 0) fail(style, name, `${id} was not drawn or not marked`); }
    }
    if (name === "explainer_board") {
      for (const id of ["hero", "scroll"]) if (!box(key.marks, id)) fail(style, name, `${id} was not drawn or not marked`);
    }
    if (name === "siege_far_bank") {
      const cut = key.marks.filter((m) => m.large && m.y < 0).map((m) => `${m.id} ${(-m.y / m.h * 100).toFixed(0)}%`);
      notes.push(`${style}/${name}: large objects cut at the top: ${cut.join(", ") || "none"}`);
    }
  }
  // Probe: kit parity (props honour width; sizes agree across styles).
  await page.goto("file://" + path.join(dir, `${style}__probe.html`).replace(/\\/g, "/"));
  const sizes = await page.evaluate(() => {
    const c = document.getElementById("motion-canvas"), ctx = c.getContext("2d"), K = window.MotionKit;
    const measure = (draw) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); K.time(0); draw(); const d = ctx.getImageData(0, 0, c.width, c.height).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) if (d[(y * c.width + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return x1 < 0 ? { w: 0, h: 0 } : { w: x1 - x0, h: y1 - y0 }; };
    const person = measure(() => K.person(ctx, { x: 640, y: 600, p: 30, seed: 1 }));
    const res = { person };
    for (const kind of ["campfire", "barrel", "cart", "haystack", "well", "torch", "banner", "rope", "sack", "crate", "fence", "tent"]) res[kind] = measure(() => (kind === "tent" ? K.building(ctx, { kind, x: 640, y: 600, p: 30, seed: 2 }) : K.prop(ctx, { kind, x: 640, y: 600, p: 30, seed: 2 })));
    res.wagon = measure(() => K.vehicle(ctx, { kind: "wagon", x: 640, y: 600, p: 30, seed: 3 }));
    res.horse = measure(() => K.animal(ctx, { kind: "horse", x: 640, y: 600, p: 30, seed: 4 }));
    for (const kind of ["bridge", "wall", "barbedWire", "gate"]) { res[kind + "@400"] = measure(() => K.prop(ctx, { kind, x: 640, y: 500, width: 400, height: 120, p: 30, seed: 5 })); res[kind + "@800"] = measure(() => K.prop(ctx, { kind, x: 640, y: 500, width: 800, height: 120, p: 30, seed: 5 })); }
    return res;
  });
  for (const kind of ["bridge", "wall", "barbedWire", "gate"]) { const a = sizes[kind + "@400"].w, b = sizes[kind + "@800"].w; if (a && b / a < 1.5) fail(style, "probe", `${kind} ignores width (400 -> ${a}px, 800 -> ${b}px)`); }
  fs.writeFileSync(path.join(dir, `${style}__sizes.json`), JSON.stringify(sizes));
}
const kinds = ["campfire", "barrel", "cart", "haystack", "well", "torch", "banner", "rope", "sack", "crate", "fence", "tent", "wagon", "horse"];
const table = Object.fromEntries(styles.map((style) => [style, JSON.parse(fs.readFileSync(path.join(dir, `${style}__sizes.json`), "utf8"))]));
for (const kind of kinds) {
  const ratios = styles.map((style) => ({ style, r: table[style][kind].h / Math.max(1, table[style].person.h) })).filter((e) => e.r > 0);
  const sorted = ratios.map((e) => e.r).sort((a, b) => a - b), median = sorted[Math.floor(sorted.length / 2)];
  for (const e of ratios) if (Math.abs(e.r - median) / median > 0.35) fail(e.style, "probe", `${kind} is ${(e.r * 100).toFixed(0)}% of a person's height (median of styles ${(median * 100).toFixed(0)}%)`);
}
await browser.close();
fs.writeFileSync(path.join(dir, "report.json"), JSON.stringify({ failures, notes }, null, 1));
console.log(notes.join("\n"));
console.log(failures.length ? "FAIL\n" + failures.join("\n") : "scene bench ok");
process.exitCode = failures.length ? 1 : 0;
