import fs from "fs";
import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
const KIT = path.dirname(fileURLToPath(import.meta.url));
const [planFile, jobDir] = process.argv.slice(2);
const { sp, box, spriteDefs, takeBoxes, markGroup, FACEMAP, pngUsed } = await import(pathToFileURL(path.join(KIT, "sprites.mjs")).href);
const { camState, textJs, checkActors, plateSize, textW } = await import(pathToFileURL(path.join(KIT, "layout.mjs")).href);
const plan = JSON.parse(fs.readFileSync(planFile, "utf8"));
const { direct } = await import(pathToFileURL(path.join(KIT, "born_direct.mjs")).href);
const { VERT, VIEW, TAG_AT } = await import(pathToFileURL(path.join(KIT, "vert.mjs")).href);
const VERT_CSS = `#root{width:1080px!important;height:1920px!important}#stage{position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:hidden;transform-origin:0 0;transform:translateX(${-((VIEW.l + VIEW.r) / 2) * VIEW.k + 540}px) scale(${VIEW.k})}#ovl,#ovt{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:60;pointer-events:none}.bl-t b{font-size:54px!important;-webkit-text-stroke:10px #16100c!important}.bl-t i{font-size:30px!important}`;
const FIXRAW = process.env.BORN_FIX ? JSON.parse(fs.readFileSync(process.env.BORN_FIX, "utf8")) : {};
const FIX = new Map(Array.isArray(FIXRAW) ? FIXRAW.map((id) => [id, ["tag", "wide"]]) : Object.entries(FIXRAW));
const planShots = plan.beats ? direct(plan) : plan.shots;
const CAST = {};
const TOTAL = plan.total;
const safe = (s) => String(s ?? "").replace(/'/g, "’").replace(/[\\`$]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\s+/g, " ").trim();
const up = (s) => safe(String(s ?? "").toLocaleUpperCase("vi"));
const PAPER_W = VERT ? 540 : 1640;
const OVT_OUT = 2.6;
const FX = {
  dust: { n: 26, size: [2, 5], color: "rgba(235,220,190,.55)", dx: [-60, 60], dy: [-40, -120], dur: [7, 12], blur: 0.4 },
  embers: { n: 18, size: [2, 4], color: "rgba(255,150,70,.6)", dx: [-40, 40], dy: [-220, -420], dur: [5, 9], blur: 0.6 },
  motes: { n: 22, size: [3, 6], color: "rgba(255,226,160,.45)", dx: [-30, 30], dy: [-60, -140], dur: [8, 14], blur: 1.5 },
  petals: { n: 12, size: [8, 12], color: "rgba(246,190,205,.7)", dx: [120, 260], dy: [260, 520], dur: [7, 11], blur: 0, petal: true },
  fog: { n: 5, size: [520, 820], color: "rgba(210,215,225,.08)", dx: [180, 320], dy: [-20, 20], dur: [20, 30], blur: 40, fog: true },
  ash: { n: 24, size: [2, 4], color: "rgba(205,205,205,.45)", dx: [-50, 50], dy: [60, 160], dur: [8, 13], blur: 0.5 },
};
const PAPER_BIG = 1.6;
const PAPER_OPTICAL = 0.92;
const PAPER_STAMP_GAP = 150;
const PAPER_LEAD = 0.15;
const DEFS = `<defs><radialGradient id="shd"><stop offset="0" stop-color="#120a06" stop-opacity=".4"/><stop offset=".55" stop-color="#120a06" stop-opacity=".3"/><stop offset="1" stop-color="#120a06" stop-opacity="0"/></radialGradient></defs>`;
const TAG_MAX_W = 600;
const fitPlate = (text, sub, size) => {
  let z = size;
  while (z > 34 && plateSize(text, sub, z).w > (VERT ? 520 : 860)) z -= 2;
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
  const o = { id: s.id, t0: s.t0, kind: s.kind || "scene", bg: s.bg, blur: !!s.blur, cam: (s.cam?.length ? s.cam : [{ t: 0, s: 1, x: 960, y: 540 }]).map((c) => ({ t: c.t, s: c.s, tx: c.x, ty: c.y, sx: c.sx ?? 960, sy: c.sy ?? 540, ease: c.ease })), tags: (s.tags || []).map((g) => [g[0], up(g[1]), up(g[2]), g[3], g[4]]), labels: (s.labels || []).map((l) => [l[0], up(l[1]), up(l[2]), l[3], l[4], l[5]]), plates: s.endCard ? [] : (s.plates || []).map((p) => [p[0], up(p[1]), up(p[2]), p[3], p[4], p[5] ?? null, fitPlate(up(p[1]), up(p[2]), p[6] || 56)]), roll: s.roll, bubbles: (s.bubbles || []).map((b) => [b[0], safe(b[1]), b[2], null, b[4]]), glowAt: s.glowAt, focusOn: s.focusOn, labelOut: s.labelOut, dark: s.dark, warm: s.warm, cool: s.cool, smoke: s.smoke, focusAt: s.focus, flashAt: s.flash, bar: s.bar, series: s.series && plan.series ? safe(plan.series) : "", rew: s.rew, paper: s.paper, montage: s.montage, chapter: s.chapter, endCard: s.endCard, moves: "" };
  const wide = o.tags.filter((g) => plateSize(g[1], g[2], 52).w > TAG_MAX_W);
  if (wide.length) {
    o.tags = o.tags.filter((g) => !wide.includes(g));
    o.plates.push(...wide.map((g) => [g[0], g[1], g[2], g[3], [960, 150], null, fitPlate(g[1], g[2], 52)]));
  }
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
    if (drop.length) {
      s.actors = (s.actors || []).filter((a) => !drop.includes(a.sprite));
      const lost = o.labels.filter((l) => drop.includes(l[4]));
      o.tags.push(...lost.map((l) => [l[0], l[1], l[2], l[3], o.tags.some((g) => g[4] === "tl") ? "tr" : "tl"]));
      o.labels = o.labels.filter((l) => !drop.includes(l[4]));
      if (o.focusOn && drop.includes(o.focusOn.sprite)) o.focusOn = null;
    }
    const flip = acts.filter((a) => a.startsWith("flip:")).map((a) => a.slice(5));
    s.actors = (s.actors || []).map((a) => (flip.includes(a.sprite) ? { ...a, dir: a.dir === "l" ? "r" : "l", move: undefined } : a));
    if (acts.includes("apart")) s.apart = true;
  }

  if (o.kind === "scene") {
    const actors = (s.actors || []).map((a) => ({ ...a }));
    if (!plan.beats || s.apart) spread(actors);
    CAST[s.id] = [...actors].sort((a, b) => a.x - b.x).map((a) => a.sprite);
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
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const SEPIA = "colorchannelmixer=rr=.6965:rg=.3845:rb=.0945:gr=.1745:gg=.843:gb=.084:br=.136:bg=.267:bb=.5655";
const GRADES = {
  old: `${SEPIA},eq=saturation=0.68:contrast=1.06:brightness=-0.015`,
  war: "eq=saturation=0.74:contrast=1.08:brightness=-0.02,colorbalance=rs=-0.03:bs=0.05:rm=-0.02:bm=0.03",
  warm: "eq=saturation=1.04:contrast=1.04,colorbalance=rm=0.05:gm=0.02:bm=-0.05:rh=0.03:bh=-0.03",
  anime: "eq=saturation=1.08:contrast=1.03:brightness=0.01",
};
const GRADE = GRADES[plan.grade] || "";
const BG_Q = "3";
const BLUR = { W: 1920, SIGMA: 18, DIM: 0.7 };
const ff = (args) => execFileSync(FFMPEG, ["-y", "-loglevel", "error", ...args], { windowsHide: true });
const chain = (...f) => f.filter(Boolean).join(",") || "null";
const baked = new Set();
const bakeBg = (k) => {
  const src = path.join(jobDir, `${k}.png`), dst = path.join(jobDir, `${k}.jpg`);
  if (!baked.has(k) && fs.existsSync(src)) {
    ff(["-i", src, "-vf", chain(GRADE), "-q:v", BG_Q, dst]);
    ff(["-i", src, "-vf", chain(`scale=${BLUR.W}:-2`, `gblur=sigma=${BLUR.SIGMA}`, GRADE, `colorchannelmixer=rr=${BLUR.DIM}:gg=${BLUR.DIM}:bb=${BLUR.DIM}`), "-q:v", BG_Q, path.join(jobDir, `${k}_blur.jpg`)]);
    fs.rmSync(src);
    baked.add(k);
  }
  return fs.existsSync(dst);
};
const BG = (k) => (bakeBg(k) ? `${k}.jpg` : `${k}.png`);
const BG_BLUR = (k) => (bakeBg(k) ? `${k}_blur.jpg` : `${k}.png`);
const TEXTEV = [];
let html = "", js = "";
const camJs = (s) => ["c", "t"].map((k) => `BORN.camPath(tl,'#${s.id}${k}',[${s.cam.map((c) => `{t:${(s.t0 + c.t).toFixed(3)},v:BORN.cam(${c.s},${c.tx},${c.ty},${c.sx},${c.sy})${c.ease ? `,ease:'${c.ease}'` : ""}}`).join(",")}]);`).join("");
const breath = (s) => `tl.fromTo('#${s.id} .cam > svg > g',{scaleY:1,transformOrigin:'50% 100%'},{scaleY:1.008,duration:.9,yoyo:true,repeat:${Math.max(1, Math.floor((s.t1 - s.t0) / 0.9))},ease:'sine.inOut'},${s.t0});`;
const bar = (s) => `{const h=document.getElementById('${s.id}h');const e=document.createElement('div');e.className='sbar';e.innerHTML='<div class="sbl">${safe(s.bar.label)}</div><div class="sbt"><div class="sbf" id="${s.id}bf"></div></div><div class="sbv" id="${s.id}bv">${s.bar.from}%</div>';h.appendChild(e);tl.fromTo(e,{opacity:0,y:-30},{opacity:1,y:0,duration:.3},${s.bar.t});tl.fromTo('#${s.id}bf',{width:'${s.bar.from}%'},{width:'${s.bar.to}%',duration:.8,ease:'power2.out'},${s.bar.t + 0.4});const o={v:${s.bar.from}};tl.to(o,{v:${s.bar.to},duration:.8,ease:'power2.out',onUpdate:()=>{document.getElementById('${s.id}bv').textContent=Math.round(o.v)+'%'}},${s.bar.t + 0.4});}`;
for (const s of shots) {
  const d = (s.t1 - s.t0).toFixed(3);
  let inner = "";
  if (s.kind === "rew" && s.rew?.length) {
    const frame = (f, i) => {
      if (typeof f === "string") return `<img class="rwi" id="${s.id}rw${i}" src="${BG(f)}">`;
      const svg = (f.actors || []).map((a) => sp(a.sprite, a.x, a.y, a.h, { ...(a.dir ? { dir: a.dir } : {}), crowd: !!a.crowd, allow: true, noBox: true, anchorX: a.anchorX ?? 0.5 })).join("");
      takeBoxes();
      return `<div class="rwi" id="${s.id}rw${i}"><img src="${BG(f.bg)}" width="1920" height="1080"><svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0">${DEFS}<g>${svg}</g></svg></div>`;
    };
    inner = `<div class="rew">${s.rew.map(frame).join("")}<div class="scan"></div><div class="rwt">◀◀ REW</div></div>`;
    const step = (s.t1 - s.t0) / s.rew.length;
    js += s.rew.map((_, i) => `tl.set('#${s.id}rw${i}',{opacity:1},${(s.t0 + i * step).toFixed(3)});tl.fromTo('#${s.id}rw${i}',{scale:1.25},{scale:1.05,duration:${step.toFixed(3)},ease:'none'},${(s.t0 + i * step).toFixed(3)});${i < s.rew.length - 1 ? `tl.set('#${s.id}rw${i}',{opacity:0},${(s.t0 + (i + 1) * step).toFixed(3)});` : ""}`).join("");
    js += `tl.fromTo('#${s.id} .rwt',{opacity:0},{opacity:1,duration:.05,yoyo:true,repeat:7},${s.t0});`;
  } else if (s.kind === "paper" && s.paper) {
    const lines = s.paper.lines || [];
    const tops = { h: [92, "#2a1a10", 900], n: [210, "#8a1c10", 900], l: [64, "#5a3a22", 800], s: [58, "#5a3a22", 800] };
    const big = lines.length <= 2 ? PAPER_BIG : 1;
    const sizes = lines.map((l) => { const [full, , w] = tops[l.size] || tops.l; return Math.min(Math.round(full * big), Math.floor(PAPER_W / Math.max(0.01, textW(safe(l.text), 1, w)))); });
    const block = sizes.reduce((n, z) => n + Math.round(z * 1.35) + 24, -24) + (s.paper.stamp ? PAPER_STAMP_GAP : 0);
    let y = Math.max(60, Math.round(540 * PAPER_OPTICAL - block / 2));
    inner = `<div class="paper" id="${s.id}p">${lines.map((l, i) => { const [, col, w] = tops[l.size] || tops.l, size = sizes[i]; const el = `<div class="pl" id="${s.id}p${i}" style="top:${y}px;font:${w} ${size}px 'Alegreya Sans';color:${col}">${safe(l.text)}</div>`; y += Math.round(size * 1.35) + 24; return el; }).join("")}</div>`;
    js += lines.map((l, i) => `tl.fromTo('#${s.id}p${i}',{opacity:0,y:-20},{opacity:1,y:0,duration:.3},${(i ? l.t : Math.min(l.t, s.t0 + PAPER_LEAD)).toFixed(3)});`).join("");
    if (s.paper.stamp) js += `{const r=BORN.rubber(document.getElementById('${s.id}p'),{id:'${s.id}st',text:'${safe(s.paper.stamp.text)}',x:960,y:${Math.min(960, y + 90)},size:104,rot:-6});BORN.rubberIn(tl,r,${s.paper.stamp.t});}`;
  } else if (s.kind === "montage" && s.montage) {
    const m = s.montage, n = m.bgs.length, gap = 1920 / n;
    inner = `<div class="mont">${m.bgs.map((b, i) => `<div class="pol" id="${s.id}mo${i}" style="left:${Math.round(gap * i + gap / 2 - 248)}px;transform:rotate(${[-6, 3, -2, 4][i % 4]}deg)"><img src="${BG(b)}"><div class="polc">${safe(m.caps[i])}</div></div>`).join("")}</div>`;
    js += m.bgs.map((_, i) => `tl.fromTo('#${s.id}mo${i}',{y:900},{y:0,duration:.35,ease:'back.out(1.4)'},${(m.capT[i] ?? s.t0).toFixed(3)});`).join("");
  } else if (s.kind === "chapter" && s.chapter) {
    inner = `<div class="chap" id="${s.id}ch"><div class="chl" id="${s.id}cl">${safe(s.chapter.label)}</div><div class="cht" id="${s.id}ct"${VERT ? ` style="font-size:${Math.min(148, Math.floor(540 / Math.max(0.01, textW(safe(s.chapter.title), 1, 900))))}px;max-width:560px"` : ""}>${safe(s.chapter.title)}</div></div>`;
    js += `tl.fromTo('#${s.id}cl',{opacity:0,y:12},{opacity:1,y:0,duration:.5,ease:'power2.out'},${s.t0.toFixed(3)});tl.fromTo('#${s.id}ct',{opacity:0,scale:1.06},{opacity:1,scale:1,duration:.6,ease:'power2.out'},${(s.t0 + 0.2).toFixed(3)});tl.to('#${s.id}ch',{opacity:0,duration:.3,ease:'power1.in'},${(s.t0 + Math.max(0.6, d - 0.3)).toFixed(3)});`;
  } else if (s.kind === "black") {
    inner = `<div class="blk"></div><div class="hud" id="${s.id}h"></div>`;
  } else {
    inner = `<div class="shake" id="${s.id}k"><div class="cam" id="${s.id}c"><img${s.blur ? ' class="blurbg"' : ""} src="${s.blur ? BG_BLUR(s.bg) : BG(s.bg)}">${s.blur ? '<div class="dim"></div>' : ""}<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">${DEFS}<g>${s.svg}</g></svg></div></div><div class="ov" id="${s.id}o"></div><div class="cam txt" id="${s.id}t"></div><div class="hud" id="${s.id}h"></div>`;
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
  if (s.roll) {
    const cover = (d) => (Math.cos((Math.abs(d) * Math.PI) / 180) + (16 / 9) * Math.sin((Math.abs(d) * Math.PI) / 180)).toFixed(3);
    js += `tl.fromTo('#${s.id}k',{rotation:0,scale:1},{rotation:${s.roll.deg},scale:${cover(s.roll.deg)},duration:${s.roll.dur.toFixed(3)},ease:'sine.inOut',transformOrigin:'50% 50%'},${s.roll.t});`;
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
  if (s.flashAt !== undefined) js += `{const e=document.createElement('div');e.className='bw';${ov}.appendChild(e);tl.fromTo(e,{opacity:.55},{opacity:0,duration:.4,immediateRender:false},${s.flashAt});}`;
  if (s.smoke) js += `{const e=document.createElement('div');e.className='haze';${ov}.appendChild(e);tl.fromTo(e,{x:-200,opacity:0},{x:200,opacity:.45,duration:${(s.t1 - s.t0).toFixed(2)},ease:'none'},${s.t0});}`;
  if (s.endCard) js += `{const e=BORN.plate(${hud},{id:'${s.id}end',text:'${up(s.endCard.text)}',sub:'${up(s.endCard.sub)}',x:960,y:${VERT ? 760 : 190},size:${VERT ? 44 : 64},rot:-2});BORN.plateIn(tl,e,${s.endCard.t});}`;
}
const css = fs.readFileSync(path.join(KIT, "born_style.css"), "utf8");
const scripts = ["gsap.min.js", "DrawSVGPlugin.min.js", "MorphSVGPlugin.min.js", "MotionPathPlugin.min.js", "SplitText.min.js", "CustomEase.min.js", "CustomWiggle.min.js", "noise.min.js", "kit.js"].map((f) => `<script src="${f}"></script>`).join("");
const fxDef = FX[plan.fx];
const rnd = ((seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647))(97);
const pick = ([a, b]) => a + (b - a) * rnd();
const fxItems = fxDef ? Array.from({ length: fxDef.n }, (_, i) => ({ i, x: pick([0, 1920]), y: pick([0, 1080]), size: pick(fxDef.size), dx: pick(fxDef.dx), dy: pick(fxDef.dy), dur: pick(fxDef.dur), delay: pick([0, 6]) })) : [];
const fxHtml = fxDef ? `<div class="fx">${fxItems.map((p) => `<i id="fx${p.i}" style="left:${p.x.toFixed(0)}px;top:${p.y.toFixed(0)}px;width:${p.size.toFixed(1)}px;height:${(fxDef.petal ? p.size * 0.62 : fxDef.fog ? p.size * 0.32 : p.size).toFixed(1)}px;background:${fxDef.color};border-radius:${fxDef.petal ? "60% 0" : "50%"};filter:blur(${fxDef.blur}px)"></i>`).join("")}</div>` : "";
const fxJs = fxItems.map((p) => `tl.fromTo('#fx${p.i}',{x:0,y:0,opacity:0,rotation:0},{keyframes:[{opacity:1,duration:${(p.dur * 0.2).toFixed(2)}},{opacity:1,duration:${(p.dur * 0.6).toFixed(2)}},{opacity:0,duration:${(p.dur * 0.2).toFixed(2)}}],x:${p.dx.toFixed(0)},y:${p.dy.toFixed(0)},rotation:${fxDef.petal ? 220 : 0},ease:'none',repeat:${Math.max(0, Math.floor((TOTAL - p.delay) / p.dur) - 1)}},${p.delay.toFixed(2)});`).join("");
const out = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="fonts/fonts.css"><style>${css}${VERT ? VERT_CSS : ""}</style></head><body>${spriteDefs()}<div id="root"${plan.grade ? ` class="grade-${plan.grade}"` : ""} data-composition-id="root" data-width="${VERT ? 1080 : 1920}" data-height="${VERT ? 1920 : 1080}" data-start="0" data-duration="${TOTAL}">\n${VERT ? `<div id="stage">${html}${fxHtml}</div>` : html + fxHtml}<div class="grain"></div><div class="vig"></div>${VERT && fs.existsSync(path.join(jobDir, "ov.png")) ? '<img id="ovl" src="ov.png">' : ""}${VERT && fs.existsSync(path.join(jobDir, "ovt.png")) ? '<img id="ovt" src="ovt.png">' : ""}<audio id="vo" src="voice.wav" data-start="0" data-duration="${TOTAL}" data-volume="1"></audio></div>${scripts}<script>document.head.insertAdjacentHTML('beforeend','<style>'+BORN_CSS+'</style>');${VERT ? `BORN.TAG_AT=${JSON.stringify(TAG_AT)};` : ''}const tl=gsap.timeline({paused:true});${fxJs}${VERT ? `if(document.getElementById('ovt'))tl.to('#ovt',{opacity:0,duration:.4},${OVT_OUT});` : ''}\n${js}\ntl.to({},{duration:${TOTAL}},0);window.__timelines={root:tl};</script></body></html>`;
fs.mkdirSync(path.join(jobDir, "png"), { recursive: true });
fs.writeFileSync(path.join(jobDir, "index.html"), out);
for (const n of pngUsed()) {
  const src = path.join(process.env.BORN_ASSETS, "png", `${n}.png`), dst = path.join(jobDir, "png", `${n}.png`);
  if (GRADE) ff(["-i", src, "-vf", GRADE, "-pix_fmt", "rgba", dst]);
  else fs.copyFileSync(src, dst);
}
fs.writeFileSync(path.join(jobDir, "texts.json"), JSON.stringify(TEXTEV));
fs.writeFileSync(path.join(jobDir, "shots.json"), JSON.stringify(shots.map((s) => ({ id: s.id, t0: s.t0, t1: s.t1, kind: s.kind }))));
fs.writeFileSync(path.join(jobDir, "faces_all.json"), JSON.stringify(FACEMAP()));
fs.writeFileSync(path.join(jobDir, "layout_report.json"), JSON.stringify(planShots.report || []));
fs.writeFileSync(path.join(jobDir, "cast.json"), JSON.stringify(CAST));
console.log(JSON.stringify({ shots: shots.length, bytes: out.length, png: pngUsed().length, warns }));
