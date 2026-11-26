import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
const KIT = path.dirname(fileURLToPath(import.meta.url));
const [planFile, jobDir] = process.argv.slice(2);
const { sp, box, spriteDefs, takeBoxes, markGroup, FACEMAP, pngUsed } = await import(pathToFileURL(path.join(KIT, "sprites.mjs")).href);
const { camState, textJs, checkActors, plateSize } = await import(pathToFileURL(path.join(KIT, "layout.mjs")).href);
const plan = JSON.parse(fs.readFileSync(planFile, "utf8"));
const { direct } = await import(pathToFileURL(path.join(KIT, "born_direct.mjs")).href);
const FIXRAW = process.env.BORN_FIX ? JSON.parse(fs.readFileSync(process.env.BORN_FIX, "utf8")) : {};
const FIX = new Map(Array.isArray(FIXRAW) ? FIXRAW.map((id) => [id, ["tag", "wide"]]) : Object.entries(FIXRAW));
const planShots = plan.beats ? direct(plan) : plan.shots;
const TOTAL = plan.total;
const safe = (s) => String(s ?? "").replace(/'/g, "’").replace(/[\\`$]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\s+/g, " ").trim();
const DEFS = `<defs><filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter></defs>`;
const fitPlate = (text, sub, size) => {
  let z = size;
  while (z > 34 && plateSize(text, sub, z).w > 860) z -= 2;
  return z;
};
const shots = [];
const warns = [];
const MV = {};
const MOVES = {};
const groupOf = (inner, id) => {
  markGroup(id);
  return `<g id="${id}">${inner}</g>`;
};
const mvJs = (id, dx, dur, t, bob) => {
  MV[id] = { dx, dur, t };
  MOVES[id] = `tl.fromTo(f,{x:0},{x:${dx},duration:${dur},ease:'none'},${t});`;
  return `tl.fromTo('#${id}',{x:0},{x:${dx},duration:${dur.toFixed(3)},ease:'none'},${t.toFixed(3)});` + (bob ? `tl.fromTo('#${id}',{y:0},{y:${-bob},duration:.18,yoyo:true,repeat:${Math.max(1, Math.floor(dur / 0.18))},ease:'sine.inOut'},${t.toFixed(3)});` : "");
};
const spread = (actors) => {
  const solid = actors.filter((a) => !a.crowd && !a.allow && !a.noBox);
  const width = (a) => {
    const b = box(a.sprite, a.x, a.y, a.h);
    return b.r - b.l;
  };
  solid.sort((a, b) => a.x - b.x);
  for (let i = 1; i < solid.length; i++) {
    const a = solid[i - 1], b = solid[i];
    const need = (width(a) + width(b)) / 2 - Math.min(width(a), width(b)) * 0.15;
    if (b.x - a.x < need) b.x = a.x + need;
  }
  const over = solid.length ? Math.max(0, ...solid.map((a) => a.x + width(a) / 2 - 1880)) : 0;
  if (over) for (const a of solid) a.x = Math.max(40 + width(a) / 2, a.x - over);
};
for (const s of planShots) {
  const o = { id: s.id, t0: s.t0, kind: s.kind || "scene", bg: s.bg, blur: !!s.blur, cam: (s.cam?.length ? s.cam : [{ t: 0, s: 1, x: 960, y: 540 }]).map((c) => ({ t: c.t, s: c.s, tx: c.x, ty: c.y, sx: c.sx ?? 960, sy: c.sy ?? 540, ease: c.ease })), tags: (s.tags || []).map((g) => [g[0], safe(g[1]), safe(g[2]), g[3], g[4]]), labels: (s.labels || []).map((l) => [l[0], safe(l[1]), safe(l[2]), l[3], l[4], l[5]]), plates: (s.plates || []).map((p) => [p[0], safe(p[1]), safe(p[2]), p[3], p[4], p[5] ?? null, fitPlate(safe(p[1]), safe(p[2]), p[6] || 56)]), roll: s.roll, bubbles: (s.bubbles || []).map((b) => [b[0], safe(b[1]), b[2], null, b[4]]), glowAt: s.glowAt, focusOn: s.focusOn, labelOut: s.labelOut, dark: s.dark, warm: s.warm, cool: s.cool, smoke: s.smoke, focusAt: s.focus, flashAt: s.flash, shake: s.shake, bar: s.bar, series: s.series && plan.series ? safe(plan.series) : "", rew: s.rew, paper: s.paper, montage: s.montage, endCard: s.endCard, moves: "" };
  if (FIX.has(o.id)) {
    const acts = FIX.get(o.id);
    if (acts.includes("tag")) {
      const short = o.labels.filter((l) => l[1].length <= 18);
      o.tags.push(...short.map((l) => [l[0], l[1], l[2], l[3], o.tags.some((g) => g[4] === "tl") ? "tr" : "tl"]));
      o.plates.push(...o.labels.filter((l) => l[1].length > 18).map((l) => [l[0], l[1], l[2], l[3], [960, 200], null, fitPlate(l[1], l[2], 50)]));
      o.labels = [];
      o.plates = o.plates.map((p) => [...p.slice(0, 5), null, p[6]]);
    }
    if (acts.includes("drop_text")) {
      o.labels = [];
      o.plates = [];
      o.bubbles = [];
    }
    if (acts.includes("wide")) {
      o.cam = [{ t: 0, s: 1, tx: 960, ty: 540, sx: 960, sy: 540 }, { t: 4, s: 1.06, tx: 960, ty: 520, sx: 960, sy: 540 }];
      o.focusOn = null;
    }
    const drop = acts.filter((a) => a.startsWith("drop:")).map((a) => a.slice(5));
    if (drop.length) s.actors = (s.actors || []).filter((a) => !drop.includes(a.sprite));
  }

  if (o.kind === "scene") {
    const actors = (s.actors || []).map((a) => ({ ...a }));
    if (!plan.beats) spread(actors);
    let svg = "";
    actors.forEach((a, i) => {
      const dir = a.move?.dx ? (a.move.dx > 0 ? "r" : "l") : a.dir;
      const swaps = (s.swaps || []).filter((w) => w.from === a.sprite);
      let one = sp(a.sprite, a.x, a.y, a.h, { ...(dir ? { dir } : {}), crowd: !!a.crowd, allow: !!a.allow, noBox: !!a.noBox, shadow: a.shadow !== false, anchorX: a.anchorX ?? 0.5 });
      if (swaps.length) {
        one = `<g id="${s.id}a${i}p">${one}</g>` + swaps.map((w, k) => `<g id="${s.id}a${i}w${k}" style="opacity:0">${sp(w.to, w.x, w.y, w.h, { ...(dir ? { dir } : {}), allow: true, shadow: false, anchorX: w.anchorX ?? 0.5 })}</g>`).join("");
        o.moves += swaps.map((w, k) => `tl.set('#${s.id}a${i}${k ? `w${k - 1}` : "p"}',{opacity:0},${w.t});tl.set('#${s.id}a${i}w${k}',{opacity:1},${w.t});tl.fromTo('#${s.id}a${i}w${k}',{y:14},{y:0,duration:.25,ease:'back.out(2)',immediateRender:false},${w.t});`).join("");
      }
      if (a.move?.dx) {
        const gid = `${s.id}a${i}m`;
        svg += groupOf(one, gid);
        o.moves += mvJs(gid, a.move.dx, a.move.dur, a.move.t, a.move.bob ?? 5);
        o.labels = o.labels.map((l) => (l[4] === a.sprite ? [...l.slice(0, 6), gid] : l));
      } else svg += one;
    });
    o.svg = svg;
    o.boxes = takeBoxes();
    warns.push(...checkActors(o.boxes, s.id));
  }
  shots.push(o);
}
for (let i = 0; i < shots.length; i++) shots[i].t1 = i + 1 < shots.length ? shots[i + 1].t0 : TOTAL;
const camAt = (s, t) => camState(s.cam, s.t0, t);
const BG = (k) => `${k}.png`;
const TEXTEV = [];
let html = "", js = "";
const camJs = (s) => ["c", "t"].map((k) => `BORN.camPath(tl,'#${s.id}${k}',[${s.cam.map((c) => `{t:${(s.t0 + c.t).toFixed(3)},v:BORN.cam(${c.s},${c.tx},${c.ty},${c.sx},${c.sy})${c.ease ? `,ease:'${c.ease}'` : ""}}`).join(",")}]);`).join("");
const breath = (s) => `tl.fromTo('#${s.id} .cam > svg > g',{scaleY:1,transformOrigin:'50% 100%'},{scaleY:1.008,duration:.9,yoyo:true,repeat:${Math.max(1, Math.floor((s.t1 - s.t0) / 0.9))},ease:'sine.inOut'},${s.t0});`;
const bar = (s) => `{const h=document.getElementById('${s.id}h');const e=document.createElement('div');e.className='sbar';e.innerHTML='<div class="sbl">${safe(s.bar.label)}</div><div class="sbt"><div class="sbf" id="${s.id}bf"></div></div><div class="sbv" id="${s.id}bv">${s.bar.from}%</div>';h.appendChild(e);tl.fromTo(e,{opacity:0,y:-30},{opacity:1,y:0,duration:.3},${s.bar.t});tl.fromTo('#${s.id}bf',{width:'${s.bar.from}%'},{width:'${s.bar.to}%',duration:.8,ease:'power2.out'},${s.bar.t + 0.4});const o={v:${s.bar.from}};tl.to(o,{v:${s.bar.to},duration:.8,ease:'power2.out',onUpdate:()=>{document.getElementById('${s.id}bv').textContent=Math.round(o.v)+'%'}},${s.bar.t + 0.4});}`;
for (const s of shots) {
  const d = (s.t1 - s.t0).toFixed(3);
  let inner = "";
  if (s.kind === "rew" && s.rew?.length) {
    inner = `<div class="rew">${s.rew.map((b, i) => `<img class="rwi" id="${s.id}rw${i}" src="${BG(b)}">`).join("")}<div class="scan"></div><div class="rwt">◀◀ REW</div></div>`;
    const step = (s.t1 - s.t0) / s.rew.length;
    js += s.rew.map((_, i) => `tl.set('#${s.id}rw${i}',{opacity:1},${(s.t0 + i * step).toFixed(3)});tl.fromTo('#${s.id}rw${i}',{scale:1.25},{scale:1.05,duration:${step.toFixed(3)},ease:'none'},${(s.t0 + i * step).toFixed(3)});${i < s.rew.length - 1 ? `tl.set('#${s.id}rw${i}',{opacity:0},${(s.t0 + (i + 1) * step).toFixed(3)});` : ""}`).join("");
    js += `tl.fromTo('#${s.id} .rwt',{opacity:0},{opacity:1,duration:.05,yoyo:true,repeat:7},${s.t0});`;
  } else if (s.kind === "paper" && s.paper) {
    const lines = s.paper.lines || [];
    const tops = { h: [92, "#2a1a10", 900], n: [210, "#8a1c10", 900], l: [64, "#5a3a22", 800], s: [58, "#5a3a22", 800] };
    let y = 110;
    inner = `<div class="paper" id="${s.id}p">${lines.map((l, i) => { const [size, col, w] = tops[l.size] || tops.l; const el = `<div class="pl" id="${s.id}p${i}" style="top:${y}px;font:${w} ${size}px 'Alegreya Sans';color:${col}">${safe(l.text)}</div>`; y += Math.round(size * 1.35) + 24; return el; }).join("")}</div>`;
    js += lines.map((l, i) => `tl.fromTo('#${s.id}p${i}',{opacity:0,y:-20},{opacity:1,y:0,duration:.3},${l.t.toFixed(3)});`).join("");
    if (s.paper.stamp) js += `{const r=BORN.rubber(document.getElementById('${s.id}p'),{id:'${s.id}st',text:'${safe(s.paper.stamp.text)}',x:960,y:${Math.min(960, y + 90)},size:104,rot:-6});BORN.rubberIn(tl,r,${s.paper.stamp.t});}`;
  } else if (s.kind === "montage" && s.montage) {
    const m = s.montage, n = m.bgs.length, gap = 1920 / n;
    inner = `<div class="mont">${m.bgs.map((b, i) => `<div class="pol" id="${s.id}mo${i}" style="left:${Math.round(gap * i + gap / 2 - 248)}px;transform:rotate(${[-6, 3, -2, 4][i % 4]}deg)"><img src="${BG(b)}"><div class="polc">${safe(m.caps[i])}</div></div>`).join("")}</div>`;
    js += m.bgs.map((_, i) => `tl.fromTo('#${s.id}mo${i}',{y:900},{y:0,duration:.35,ease:'back.out(1.4)'},${(m.capT[i] ?? s.t0).toFixed(3)});`).join("");
  } else if (s.kind === "black") {
    inner = `<div class="blk"></div><div class="hud" id="${s.id}h"></div>`;
  } else {
    inner = `<div class="shake" id="${s.id}k"><div class="cam" id="${s.id}c"><img${s.blur ? ' class="blurbg"' : ""} src="${BG(s.bg)}">${s.blur ? '<div class="dim"></div>' : ""}<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">${DEFS}<g>${s.svg}</g></svg></div></div><div class="ov" id="${s.id}o"></div><div class="cam txt" id="${s.id}t"></div><div class="hud" id="${s.id}h"></div>`;
    js += camJs(s);
    if (s.svg && !s.blur) js += breath(s);
    js += s.moves;
  }
  html += `<div class="clip" id="${s.id}" data-start="${s.t0.toFixed(3)}" data-duration="${d}">${inner}</div>\n`;
  if (s.kind !== "scene") {
    if (s.kind === "black" && s.plates?.length) js += textJs({ ...s, boxes: [], cam: [{ t: 0, s: 1, tx: 960, ty: 540, sx: 960, sy: 540 }] }, { camAt, MV, MOVES, hud: `document.getElementById('${s.id}h')` });
    continue;
  }
  const ov = `document.getElementById('${s.id}o')`, hud = `document.getElementById('${s.id}h')`;
  if (s.dark) js += `{const e=document.createElement('div');e.className='bw';e.style.background='#000';${ov}.appendChild(e);tl.set(e,{opacity:${Math.min(1, s.dark)}},${s.t0});}`;
  if (s.cool) js += `{const g=BORN.glow(${ov},'${s.id}cg',960,520,380,'120,150,230',.45);BORN.fadeIn(tl,g,${s.t0 + 0.2},.6);}`;
  if (s.warm) js += `{const g=BORN.glow(${ov},'${s.id}wg',960,600,560,'255,180,100',.5);BORN.fadeIn(tl,g,${s.t0},.6);}`;
  if (s.shake) js += `BORN.shake(tl,'#${s.id}k',${s.shake.t},${s.shake.dur || 0.4},${s.shake.amp || 14},8);`;
  if (s.roll) {
    const cover = (d) => (Math.cos((Math.abs(d) * Math.PI) / 180) + (16 / 9) * Math.sin((Math.abs(d) * Math.PI) / 180)).toFixed(3);
    const end = s.roll.deg * 0.25;
    js += s.roll.hold ? `tl.fromTo('#${s.id}k',{rotation:0,scale:1},{rotation:${s.roll.deg},scale:${cover(s.roll.deg)},duration:.22,ease:'power3.out',transformOrigin:'50% 50%',immediateRender:false},${s.roll.t});tl.to('#${s.id}k',{rotation:${end.toFixed(2)},scale:${cover(end)},duration:.8,ease:'power2.inOut'},${(s.roll.t + 0.3).toFixed(3)});` : `tl.fromTo('#${s.id}k',{rotation:0,scale:1},{rotation:${s.roll.deg},scale:${cover(s.roll.deg)},duration:${s.roll.dur.toFixed(3)},ease:'sine.inOut',transformOrigin:'50% 50%'},${s.roll.t});`;
  }
  if (s.bar) js += bar(s);
  js += textJs(s, { camAt, MV, MOVES, hud });
  for (const x of [...(s.tags || []), ...(s.labels || []), ...(s.plates || [])]) TEXTEV.push({ id: s.id, t: x[3], end: s.labelOut && (s.labels || []).includes(x) ? s.labelOut : s.t1 });
  for (const x of s.bubbles || []) TEXTEV.push({ id: s.id, t: x[2], end: s.t1 });
  if (s.glowAt) js += `{const g=BORN.glow(${ov},'${s.id}gl',${s.glowAt.x},${s.glowAt.y},${s.glowAt.r},'${s.glowAt.color}',.5);BORN.fadeIn(tl,g,${s.glowAt.t},.6);}`;
  if (s.focusOn) {
    const fb = (s.boxes || []).find((b) => b.n === s.focusOn.sprite && b.fb)?.fb;
    if (fb) {
      const c = camAt(s, s.focusOn.t), fx = c.x + c.s * ((fb.l + fb.r) / 2), fy = c.y + c.s * ((fb.t + fb.b) / 2);
      js += `{const f=BORN.focus(${ov},'${s.id}fo',${Math.round(fx)},${Math.round(fy)},${Math.round(150 * c.s)},${Math.round(560 * c.s)},.6);BORN.fadeIn(tl,f,${s.focusOn.t},.6);tl.to(f,{opacity:0,duration:.8},${s.focusOn.out});const g=BORN.glow(${ov},'${s.id}rim',${Math.round(fx)},${Math.round(fy)},${Math.round(200 * c.s)},'255,190,110',.35);BORN.fadeIn(tl,g,${s.focusOn.t},.6);tl.to(g,{opacity:0,duration:.8},${s.focusOn.out});}`;
    }
  }
  if (s.series) js += `{const e=BORN.series(${hud},{id:'${s.id}sr',text:'${s.series}'});tl.set(e,{opacity:1},${s.t0});}`;
  if (s.focusAt) js += `{const f=BORN.focus(${ov},'${s.id}fo',${s.focusAt[0]},${s.focusAt[1]},150,560,.75);BORN.fadeIn(tl,f,${s.focusAt[2]},.6);}`;
  if (s.flashAt !== undefined) js += `{const e=document.createElement('div');e.className='bw';${ov}.appendChild(e);tl.fromTo(e,{opacity:.95},{opacity:0,duration:.25,immediateRender:false},${s.flashAt});}`;
  if (s.smoke) js += `{const e=document.createElement('div');e.className='haze';${ov}.appendChild(e);tl.fromTo(e,{x:-200,opacity:0},{x:200,opacity:.45,duration:${(s.t1 - s.t0).toFixed(2)},ease:'none'},${s.t0});}`;
  if (s.endCard) js += `{const e=BORN.plate(${hud},{id:'${s.id}end',text:'${safe(s.endCard.text)}',sub:'${safe(s.endCard.sub)}',x:960,y:190,size:64,rot:-2});BORN.plateIn(tl,e,${s.endCard.t});}`;
}
const css = fs.readFileSync(path.join(KIT, "born_style.css"), "utf8");
const scripts = ["gsap.min.js", "DrawSVGPlugin.min.js", "MorphSVGPlugin.min.js", "MotionPathPlugin.min.js", "SplitText.min.js", "CustomEase.min.js", "CustomWiggle.min.js", "noise.min.js", "kit.js"].map((f) => `<script src="${f}"></script>`).join("");
const out = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="fonts/fonts.css"><style>${css}</style></head><body>${spriteDefs()}<div id="root"${plan.grade ? ` class="grade-${plan.grade}"` : ""} data-composition-id="root" data-width="1920" data-height="1080" data-start="0" data-duration="${TOTAL}">\n${html}<div class="grain"></div><div class="vig"></div><audio id="vo" src="voice.wav" data-start="0" data-duration="${TOTAL}" data-volume="1"></audio></div>${scripts}<script>document.head.insertAdjacentHTML('beforeend','<style>'+BORN_CSS+'</style>');const tl=gsap.timeline({paused:true});\n${js}\ntl.to({},{duration:${TOTAL}},0);window.__timelines={root:tl};</script></body></html>`;
fs.mkdirSync(path.join(jobDir, "png"), { recursive: true });
fs.writeFileSync(path.join(jobDir, "index.html"), out);
for (const n of pngUsed()) fs.copyFileSync(path.join(process.env.BORN_ASSETS, "png", `${n}.png`), path.join(jobDir, "png", `${n}.png`));
fs.writeFileSync(path.join(jobDir, "texts.json"), JSON.stringify(TEXTEV));
fs.writeFileSync(path.join(jobDir, "shots.json"), JSON.stringify(shots.map((s) => ({ id: s.id, t0: s.t0, t1: s.t1 }))));
fs.writeFileSync(path.join(jobDir, "faces_all.json"), JSON.stringify(FACEMAP()));
console.log(JSON.stringify({ shots: shots.length, bytes: out.length, png: pngUsed().length, warns }));
