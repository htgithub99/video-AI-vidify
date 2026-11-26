gsap.registerPlugin(DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, SplitText, CustomEase, CustomWiggle);
const BORN = {
  W: 1920,
  H: 1080,
  cam(S, tx, ty, sx = 960, sy = 540) {
    let x = sx - S * tx, y = sy - S * ty;
    x = Math.min(0, Math.max(1920 - 1920 * S, x));
    y = Math.min(0, Math.max(1080 - 1080 * S, y));
    return { scale: S, x, y };
  },
  camPath(tl, sel, keys) {
    gsap.set(sel, { transformOrigin: "0 0", ...keys[0].v });
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1], b = keys[i];
      tl.to(sel, { ...b.v, duration: b.t - a.t, ease: b.ease || "none" }, a.t);
    }
  },
  anchor(root, x, y, k = 1) {
    const el = document.createElement("div");
    el.className = "ba";
    el.style.transform = `translate(${x}px,${y}px) scale(${k}) translate(${-x}px,${-y}px)`;
    root.appendChild(el);
    return el;
  },
  curve(sx, sy, ex, ey, cut = 0) {
    const cx = sx + (ex - sx) * 0.3, cy = sy + (ey - sy) * 0.7;
    const ang = Math.atan2(ey - cy, ex - cx), L = Math.hypot(ex - cx, ey - cy);
    const k = Math.min(cut, Math.max(0, L - 30)), hx = ex - Math.cos(ang) * k, hy = ey - Math.sin(ang) * k;
    return { d: `M${sx} ${sy} Q${cx} ${cy} ${hx} ${hy}`, ang, hx, hy };
  },
  arrowStart(box, ex, ey, pad = 14) {
    const x = ex > box.r ? box.r + pad * 0.6 : ex < box.l ? box.l - pad * 0.6 : Math.min(box.r - 20, Math.max(box.l + 20, ex));
    const y = ey > box.b ? box.b + pad : ey < box.t ? box.t - pad : (box.t + box.b) / 2;
    return [x, y];
  },
  label(root, { id, text, sub = "", to, dx = 140, dy = -100, w = 300, h = 90, stop = 0 }) {
    const wrap = document.createElement("div");
    wrap.className = "bl";
    wrap.id = id;
    wrap.innerHTML = `<div class="bl-t"><b>${text}</b>${sub ? `<i>${sub}</i>` : ""}</div><svg class="bl-a" width="1920" height="1080" viewBox="0 0 1920 1080"><path class="o"/><path class="w"/><g class="h"><path class="o"/><path class="w"/></g></svg>`;
    root.appendChild(wrap);
    const t = wrap.querySelector(".bl-t");
    const [ex, ey] = to;
    const dir = dx > 20 ? 1 : dx < -20 ? -1 : 0, below = dy > 0;
    const ax = ex + dx, ay = ey + dy;
    t.style.left = ax + "px";
    t.style.top = ay + "px";
    gsap.set(t, { xPercent: dir === 1 ? 0 : dir === -1 ? -100 : -50, yPercent: below ? 0 : -100 });
    const l = dir === 1 ? ax : dir === -1 ? ax - w : ax - w / 2, tp = below ? ay : ay - h;
    const [sx, sy] = BORN.arrowStart({ l, r: l + w, t: tp, b: tp + h }, ex, ey);
    const a = BORN.curve(sx, sy, ex, ey, stop), hx = a.hx, hy = a.hy;
    wrap.querySelectorAll(".bl-a > path").forEach((p) => p.setAttribute("d", a.d));
    const hl = 28, sp = 0.6;
    const hd = `M${hx - hl * Math.cos(a.ang - sp)} ${hy - hl * Math.sin(a.ang - sp)} L${hx} ${hy} L${hx - hl * Math.cos(a.ang + sp)} ${hy - hl * Math.sin(a.ang + sp)}`;
    wrap.querySelectorAll(".h path").forEach((p) => p.setAttribute("d", hd));
    return { wrap, ex: hx, ey: hy, dir };
  },
  labelIn(tl, lab, t) {
    const w = lab.wrap;
    tl.fromTo(w.querySelector(".bl-t"), { scale: 0.2, rotation: -12, opacity: 0 }, { scale: 1, rotation: -3 * (lab.dir || 1), opacity: 1, duration: 0.22, ease: "back.out(2.4)" }, t);
    tl.fromTo(w.querySelectorAll(".bl-a > path"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.32, ease: "power2.out" }, t + 0.22);
    tl.fromTo(w.querySelector(".h"), { opacity: 0, scale: 0.3, svgOrigin: `${lab.ex} ${lab.ey}` }, { opacity: 1, scale: 1, duration: 0.14, ease: "back.out(3)", svgOrigin: `${lab.ex} ${lab.ey}` }, t + 0.52);
  },
  out(tl, el, t) { tl.to(el.wrap || el, { opacity: 0, duration: 0.25 }, t); },
  plate(root, { id, text, sub = "", x, y, size = 56, rot = -3, tail, cls = "" }) {
    const wrap = document.createElement("div");
    wrap.className = "bp " + cls;
    wrap.id = id;
    const tl2 = tail ? BORN.curve(x, y, tail[0], tail[1]) : null;
    wrap.innerHTML = (tl2 ? `<svg class="bl-a" width="1920" height="1080" viewBox="0 0 1920 1080"><path class="o" d="${tl2.d}"/><path class="w" d="${tl2.d}"/></svg>` : "") + `<div class="bp-p" style="left:${x}px;top:${y}px;font-size:${size}px"><b>${text}</b>${sub ? `<i>${sub}</i>` : ""}</div>`;
    root.appendChild(wrap);
    const p = wrap.querySelector(".bp-p");
    gsap.set(p, { xPercent: -50, yPercent: -50, rotation: rot });
    return { wrap, p, rot, tail: !!tl2 };
  },
  plateIn(tl, pl, t) {
    tl.fromTo(pl.p, { scale: 0.3, opacity: 0, rotation: pl.rot - 8 }, { scale: 1, opacity: 1, rotation: pl.rot, duration: 0.26, ease: "back.out(2.2)" }, t);
    if (pl.tail) tl.fromTo(pl.wrap.querySelectorAll(".bl-a path"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.3, ease: "power2.out" }, t + 0.2);
  },
  tag(root, { id, text, sub = "", corner = "tr", size = 52 }) {
    const x = corner === "tl" ? 330 : 1570, y = corner[0] === "b" ? 950 : 140;
    return BORN.plate(root, { id, text, sub, x, y, size, rot: corner === "tl" ? -3 : 3 });
  },
  bubble(root, { id, text, x, y, tail, size = 50 }) {
    const wrap = document.createElement("div");
    wrap.className = "bb";
    wrap.id = id;
    const [tx, ty] = tail, s = tx < x ? -1 : 1;
    wrap.innerHTML = `<svg class="bb-a" width="1920" height="1080" viewBox="0 0 1920 1080"><path d="M${x - 34 + s * 30} ${y} L${tx} ${ty} L${x + 34 + s * 30} ${y}Z"/></svg><div class="bb-p" style="left:${x}px;top:${y}px;font-size:${size}px">${text}</div>`;
    root.appendChild(wrap);
    const p = wrap.querySelector(".bb-p");
    gsap.set(p, { xPercent: -50, yPercent: -50 });
    return { wrap, p, tx, ty };
  },
  bubbleIn(tl, b, t) {
    tl.fromTo(b.wrap.querySelector(".bb-a"), { opacity: 0 }, { opacity: 1, duration: 0.1 }, t);
    tl.fromTo(b.p, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.24, ease: "back.out(2.6)" }, t);
  },
  series(root, { id, text }) {
    const el = document.createElement("div");
    el.className = "bsr";
    el.id = id;
    el.innerHTML = text;
    root.appendChild(el);
    return el;
  },
  rubber(root, { id, text, x, y, size = 120, rot = -8 }) {
    const el = document.createElement("div");
    el.className = "brb";
    el.id = id;
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.fontSize = size + "px";
    el.innerHTML = text;
    root.appendChild(el);
    gsap.set(el, { xPercent: -50, yPercent: -50, rotation: rot });
    return { el, rot };
  },
  rubberIn(tl, r, t) { tl.fromTo(r.el, { opacity: 0, scale: 2.2, rotation: r.rot - 10 }, { opacity: 0.94, scale: 1, rotation: r.rot, duration: 0.24, ease: "power4.in" }, t); },
  focus(root, id, x, y, inner = 170, outer = 620, dark = 0.7) {
    const el = document.createElement("div");
    el.className = "bf";
    el.id = id;
    el.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(0,0,0,0) ${inner}px, rgba(12,5,18,${dark}) ${outer}px)`;
    root.appendChild(el);
    return el;
  },
  glow(root, id, x, y, r = 260, color = "255,200,120", a = 0.5) {
    const el = document.createElement("div");
    el.className = "bg";
    el.id = id;
    el.style.left = x - r + "px";
    el.style.top = y - r + "px";
    el.style.width = el.style.height = r * 2 + "px";
    el.style.background = `radial-gradient(closest-side, rgba(${color},${a}), rgba(${color},0))`;
    root.appendChild(el);
    return el;
  },
  fadeIn(tl, el, t, d = 0.8, to = 1) { tl.fromTo(el, { opacity: 0 }, { opacity: to, duration: d, ease: "power2.inOut" }, t); },
  fadeOut(tl, el, t, d = 0.8) { tl.to(el, { opacity: 0, duration: d, ease: "power2.inOut" }, t); },
  sway(tl, nodes, dur, amp = 3, period = 1.05) { nodes.forEach((n, i) => { for (let k = 0; k * period < dur; k++) tl.to(n, { rotation: k % 2 ? -amp : amp, duration: period, ease: "sine.inOut", svgOrigin: n.dataset.o }, k * period + i * 0.15); }); },
  rise(tl, nodes, dur, dy = -60) { nodes.forEach((n, i) => tl.fromTo(n, { y: 0, x: 0 }, { y: dy, x: 20 + i * 8, duration: dur, ease: "none" }, 0)); },
  blink(tl, sel, t, origin) { tl.fromTo(sel, { scaleY: 1, svgOrigin: origin }, { scaleY: 0.1, duration: 0.07, yoyo: true, repeat: 1, svgOrigin: origin }, t); },
  bob(tl, sel, dur, amp = 2.5, period = 0.6) { tl.fromTo(sel, { y: 0 }, { y: -amp, duration: period, yoyo: true, repeat: Math.max(1, Math.floor(dur / period) - 1), ease: "sine.inOut" }, 0); },
  shake(tl, sel, t, dur = 0.5, strength = 14, wiggles = 8) {
    const ease = CustomWiggle.create("bw" + Math.round(t * 1000), { wiggles, type: "easeOut" });
    tl.to(sel, { x: strength, y: strength * 0.5, duration: dur, ease }, t);
  },
  noise: (seed) => BORN_NOISE(seed),
  flicker(tl, el, from, dur, { seed = "f", base = 0.85, amp = 0.15, step = 0.1, speed = 2.2 } = {}) {
    const n = BORN_NOISE(seed);
    for (let k = 0; k * step < dur; k++) tl.to(el, { opacity: base + amp * n(k * step * speed, 0), duration: step, ease: "none" }, from + k * step);
  },
  drift(tl, el, from, dur, { seed = "d", amp = 18, step = 0.2, speed = 0.6 } = {}) {
    const n = BORN_NOISE(seed);
    for (let k = 0; k * step < dur; k++) tl.to(el, { x: amp * n(k * step * speed, 1), y: amp * 0.6 * n(k * step * speed, 7), duration: step, ease: "none" }, from + k * step);
  },
  flash(root, id) { const el = document.createElement("div"); el.className = "bw"; el.id = id; root.appendChild(el); return el; },
  flashAt(tl, el, t) { tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.08 }, t); tl.to(el, { opacity: 0, duration: 0.14 }, t + 0.1); },
};
const BORN_CSS = `
.ba{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;pointer-events:none}
.bl,.bp,.bb{position:absolute;inset:0;pointer-events:none}.bl-t{position:absolute;transform-origin:40% 70%;white-space:nowrap;font-variant-numeric:lining-nums}.bl-t b{display:block;font-family:'Alegreya Sans';font-weight:900;font-size:70px;color:#fff;-webkit-text-stroke:12px #16100c;paint-order:stroke fill;line-height:1.12;padding-top:.14em}.bl-t i{display:block;margin:-.12em 0 0 4px;font-family:'Alegreya Sans';font-style:normal;font-weight:800;font-size:38px;color:#f3e3bf;-webkit-text-stroke:8px #16100c;paint-order:stroke fill;line-height:1.2;padding-top:.1em}
.bl-a{position:absolute;inset:0;overflow:visible}.bl-a path{fill:none;stroke-linecap:round;stroke-linejoin:round}.bl-a path.o{stroke:#16100c;stroke-width:16}.bl-a path.w{stroke:#fff;stroke-width:9}
.bp-p{position:absolute;white-space:nowrap;font-variant-numeric:lining-nums;text-align:center;background:#f4eee0;border:.1em solid #16100c;border-radius:.36em;padding:.1em .62em .16em;box-shadow:.1em .13em 0 rgba(8,5,3,.6);transform-origin:50% 60%}.bp-p b{display:block;font-family:'Alegreya Sans';font-weight:900;color:#16100c;line-height:1.12;padding-top:.12em}.bp-p i{display:block;font-family:'Alegreya Sans';font-style:normal;font-weight:800;font-size:.52em;color:#6e4526;line-height:1.1;margin-top:-.08em;padding-bottom:.08em}
.bb-a{position:absolute;inset:0;overflow:visible}.bb-a path{fill:#fff;stroke:#16100c;stroke-width:6;stroke-linejoin:round}.bb-p{position:absolute;font-variant-numeric:lining-nums;max-width:640px;text-align:center;background:#fff;border:6px solid #16100c;border-radius:44px;padding:.32em .8em .36em;font-family:'Alegreya Sans';font-weight:800;color:#16100c;line-height:1.15}
.bsr{position:absolute;right:56px;top:46px;background:#16100c;border:3px solid #c7a15a;border-radius:10px;padding:8px 22px 9px;font-family:'Alegreya Sans SC';font-weight:800;font-size:25px;letter-spacing:5px;color:#ead9ae;line-height:1.2}
.brb{position:absolute;white-space:nowrap;font-variant-numeric:lining-nums;font-family:'Alegreya Sans';font-weight:900;color:#b8231a;border:.09em solid #b8231a;border-radius:.14em;padding:.08em .32em 0;letter-spacing:.04em;line-height:1.15;mix-blend-mode:multiply}
.bf{position:absolute;inset:0;opacity:0;pointer-events:none}.bg{position:absolute;border-radius:50%;mix-blend-mode:soft-light;opacity:0;pointer-events:none}.bw{position:absolute;inset:0;background:#fff;opacity:0}
`;
