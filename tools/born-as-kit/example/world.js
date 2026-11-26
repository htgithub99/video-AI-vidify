const QW = (() => {
  let seed = 11;
  const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const reseed = (s) => { seed = s; };
  const INK = "#1c120d";
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  const f = (n) => (+n).toFixed(1);
  const P = (d, fill, sw = 0, extra = "") => `<path d="${d}" fill="${fill}"${sw ? ` stroke="${INK}" stroke-width="${f(sw)}" stroke-linejoin="round" stroke-linecap="round"` : ""} ${extra}/>`;
  const E = (cx, cy, rx, ry, fill, sw = 0, extra = "") => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${sw ? ` stroke="${INK}" stroke-width="${f(sw)}"` : ""} ${extra}/>`;
  const G = (x, y, s, inner, extra = "") => { const g = `<g transform="translate(${f(x)} ${f(y)}) scale(${(+s).toFixed(4)})">${inner}</g>`; return extra && extra.trim() ? `<g ${extra}>${g}</g>` : g; };

  const DEFS = `<defs>
<filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="blur14" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="blur30" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="30"/></filter>
<radialGradient id="gFire" cx=".5" cy=".6" r=".5"><stop offset="0" stop-color="#fff2b0"/><stop offset=".35" stop-color="#ffb347" stop-opacity=".9"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></radialGradient>
<radialGradient id="gWarm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffc77a" stop-opacity=".75"/><stop offset="1" stop-color="#ff8a3c" stop-opacity="0"/></radialGradient>
<radialGradient id="gCool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#bcd6ff" stop-opacity=".6"/><stop offset="1" stop-color="#6a8cd0" stop-opacity="0"/></radialGradient>
<linearGradient id="gFloorDark" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0b0608" stop-opacity=".55"/></linearGradient>
<radialGradient id="gVig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0a0508" stop-opacity=".6"/></radialGradient>
</defs>`;

  const sky = (id, stops, sun) => {
    let o = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o2, c]) => `<stop offset="${o2}" stop-color="${c}"/>`).join("")}</linearGradient></defs><rect width="1920" height="1080" fill="url(#${id})"/>`;
    if (sun) o += `<circle cx="${sun[0]}" cy="${sun[1]}" r="${sun[2] * 7}" fill="url(#${sun[4] || "gWarm"})" opacity=".8"/><circle cx="${sun[0]}" cy="${sun[1]}" r="${sun[2]}" fill="${sun[3]}"/>`;
    return o;
  };
  const clouds = (n, y0, y1, c, edge, op = 0.85) => {
    let o = "";
    for (let k = 0; k < n; k++) {
      const x = R() * 2100 - 100, y = y0 + R() * (y1 - y0), w = 260 + R() * 360, h = 26 + R() * 30;
      const d = `M${f(x)} ${f(y)} q${f(w * 0.2)} ${f(-h)} ${f(w * 0.45)} ${f(-h * 0.3)} q${f(w * 0.2)} ${f(-h * 0.9)} ${f(w * 0.4)} ${f(-h * 0.1)} q${f(w * 0.12)} ${f(h * 0.5)} ${f(w * 0.15)} ${f(h * 0.4)}Z`;
      o += P(d, c, 0, `opacity="${op}"`) + `<path d="${d}" fill="none" stroke="${edge}" stroke-width="3" opacity=".7"/>`;
    }
    return o;
  };
  const ridge = (y, amp, c, step = 120, extra = "") => {
    let d = `M-20 ${f(y)}`;
    for (let x = 0; x <= 1960; x += step) d += ` L${x} ${f(y - R() * amp)}`;
    return P(d + " V1080 H-20Z", c, 0, extra);
  };
  const softRidge = (y, amp, c, step = 160, extra = "") => {
    let d = `M-20 ${f(y)}`, px = -20, py = y;
    for (let x = step - 20; x <= 2000; x += step) { const ny = y - R() * amp; d += ` Q${f(px + step / 2)} ${f(Math.min(py, ny) - amp * 0.3)} ${x} ${f(ny)}`; px = x; py = ny; }
    return P(d + " V1080 H-20Z", c, 0, extra);
  };
  const ground = (y, c, line, n = 14) => {
    let o = `<rect x="-20" y="${y}" width="1960" height="${1100 - y}" fill="${c}"/>`;
    for (let k = 0; k < n; k++) { const yy = y + Math.pow((k + 1) / n, 2.1) * (1080 - y); o += `<path d="M-20 ${f(yy)} H1940" stroke="${line}" stroke-width="${f(1 + k * 0.5)}" opacity=".45"/>`; }
    return o;
  };
  const grass = (x, y, s, c) => P(`M${x} ${y} l${f(-4 * s)} ${f(-16 * s)} M${x} ${y} l${f(2 * s)} ${f(-22 * s)} M${x} ${y} l${f(7 * s)} ${f(-14 * s)}`, "none", 0, `stroke="${c}" stroke-width="${f(2.2 * s)}" stroke-linecap="round"`);
  const tree = (x, y, s, c = "#3f5a2c", trunk = "#4a3424") => {
    let o = P(`M${f(x - 10 * s)} ${y} Q${f(x - 4 * s)} ${f(y - 60 * s)} ${f(x - 6 * s)} ${f(y - 110 * s)} L${f(x + 8 * s)} ${f(y - 110 * s)} Q${f(x + 6 * s)} ${f(y - 60 * s)} ${f(x + 14 * s)} ${y}Z`, trunk, 3 * s);
    const blobs = [[0, -150, 70], [-50, -120, 52], [50, -118, 55], [-22, -190, 48], [30, -182, 50]];
    o += blobs.map(([dx, dy, r]) => E(x + dx * s, y + dy * s, r * s, r * 0.82 * s, c, 3.5 * s)).join("");
    o += blobs.slice(0, 3).map(([dx, dy, r]) => E(x + (dx - r * 0.25) * s, y + (dy - r * 0.3) * s, r * 0.45 * s, r * 0.3 * s, mix(c, "#f4d27a", 0.35), 0, 'opacity=".55"')).join("");
    return o;
  };
  const bamboo = (x, y, s, c = "#6f8a3c") => {
    let o = "";
    for (let k = 0; k < 6; k++) {
      const dx = (k - 2.5) * 12 * s, h = (230 + R() * 90) * s, lean = (k - 2.5) * 10 * s;
      o += P(`M${f(x + dx)} ${y} Q${f(x + dx + lean * 0.3)} ${f(y - h * 0.6)} ${f(x + dx + lean)} ${f(y - h)}`, "none", 0, `stroke="${INK}" stroke-width="${f(9 * s)}" stroke-linecap="round"`);
      o += P(`M${f(x + dx)} ${y} Q${f(x + dx + lean * 0.3)} ${f(y - h * 0.6)} ${f(x + dx + lean)} ${f(y - h)}`, "none", 0, `stroke="${c}" stroke-width="${f(5 * s)}" stroke-linecap="round"`);
      for (let j = 0; j < 5; j++) { const t = 0.35 + j * 0.15, lx = x + dx + lean * t, ly = y - h * t, side = j % 2 ? 1 : -1; o += P(`M${f(lx)} ${f(ly)} q${f(side * 30 * s)} ${f(-6 * s)} ${f(side * 52 * s)} ${f(10 * s)} q${f(-side * 26 * s)} ${f(-2 * s)} ${f(-side * 52 * s)} ${f(-10 * s)}Z`, mix(c, "#2e4a1c", 0.2), 2 * s); }
    }
    return o;
  };
  const fire = (x, y, s, id = "") => `<g class="fire" ${id ? `id="${id}"` : ""} data-o="${f(x)} ${f(y)}"><circle cx="${f(x)}" cy="${f(y - 40 * s)}" r="${f(110 * s)}" fill="url(#gFire)" opacity=".75"/>${P(`M${f(x - 40 * s)} ${y} Q${f(x - 50 * s)} ${f(y - 60 * s)} ${f(x - 10 * s)} ${f(y - 110 * s)} Q${f(x - 8 * s)} ${f(y - 60 * s)} ${f(x + 10 * s)} ${f(y - 70 * s)} Q${f(x + 30 * s)} ${f(y - 120 * s)} ${f(x + 26 * s)} ${f(y - 150 * s)} Q${f(x + 70 * s)} ${f(y - 80 * s)} ${f(x + 42 * s)} ${y}Z`, "#ff8a2a", 3 * s)}${P(`M${f(x - 18 * s)} ${y} Q${f(x - 20 * s)} ${f(y - 40 * s)} ${f(x)} ${f(y - 66 * s)} Q${f(x + 8 * s)} ${f(y - 40 * s)} ${f(x + 18 * s)} ${f(y - 50 * s)} Q${f(x + 28 * s)} ${f(y - 20 * s)} ${f(x + 20 * s)} ${y}Z`, "#ffe08a")}</g>`;
  const smokeCol = (x, y, s, c = "#3a3040", id = "") => `<g class="smk" ${id ? `id="${id}"` : ""} filter="url(#blur14)" opacity=".75">${[0, 1, 2, 3, 4].map((k) => E(x + Math.sin(k * 1.7) * 40 * s, y - k * 90 * s, (70 + k * 26) * s, (50 + k * 18) * s, c)).join("")}</g>`;
  const banner = (x, y, s, c = "#c0281c", id = "", glyph = "") => {
    const pole = P(`M${f(x)} ${y} V${f(y - 300 * s)}`, "none", 0, `stroke="${INK}" stroke-width="${f(9 * s)}" stroke-linecap="round"`) + P(`M${f(x)} ${y} V${f(y - 300 * s)}`, "none", 0, `stroke="#7a5030" stroke-width="${f(5 * s)}"`);
    const flag = `<g class="flag" ${id ? `id="${id}"` : ""} data-o="${f(x)} ${f(y - 290 * s)}">${P(`M${f(x)} ${f(y - 296 * s)} Q${f(x + 70 * s)} ${f(y - 316 * s)} ${f(x + 150 * s)} ${f(y - 290 * s)} L${f(x + 140 * s)} ${f(y - 180 * s)} Q${f(x + 70 * s)} ${f(y - 200 * s)} ${f(x)} ${f(y - 186 * s)}Z`, c, 5 * s)}${P(`M${f(x + 6 * s)} ${f(y - 240 * s)} Q${f(x + 70 * s)} ${f(y - 255 * s)} ${f(x + 140 * s)} ${f(y - 232 * s)}`, "none", 0, `stroke="${mix(c, "#000", 0.35)}" stroke-width="${f(8 * s)}" opacity=".5"`)}${glyph ? `<text x="${f(x + 72 * s)}" y="${f(y - 222 * s)}" font-family="Playfair Display" font-weight="900" font-size="${f(64 * s)}" fill="#f6d27a" text-anchor="middle">${glyph}</text>` : ""}</g>`;
    return pole + flag;
  };

  const HEADS = {
    khan: (c = "#e8dcc0") => P("M-38 -102 Q-40 -138 0 -140 Q40 -138 38 -102 Q20 -112 0 -110 Q-20 -112 -38 -102Z", c, 4) + P("M-36 -110 Q0 -124 36 -110", "none", 0, `stroke="${mix(c, "#000", 0.35)}" stroke-width="4"`),
    nonla: (c) => P("M-70 -98 L0 -160 L70 -98 Q0 -88 -70 -98Z", c || "#d9b56a", 4) + P("M-40 -106 L0 -150 M40 -106 L0 -150", "none", 0, `stroke="#a8843a" stroke-width="2.5"`),
    helm: (c) => P("M-42 -100 Q-44 -146 0 -148 Q44 -146 42 -100 Q0 -112 -42 -100Z", c || "#5a5048", 4) + P("M0 -148 V-172", "none", 0, `stroke="${INK}" stroke-width="5"`) + E(0, -176, 9, 9, "#c0281c", 3),
    qing: (c) => P("M-46 -104 Q-40 -136 0 -138 Q40 -136 46 -104 Q0 -96 -46 -104Z", c || "#2a2430", 4) + P("M-50 -104 Q0 -92 50 -104 L46 -96 Q0 -86 -46 -96Z", "#3a3040", 3) + E(0, -142, 8, 8, "#c0281c", 3),
    topknot: () => P("M-38 -100 Q-42 -136 0 -138 Q42 -136 38 -100 Q24 -118 0 -116 Q-24 -118 -38 -100Z", "#1c1412", 4) + E(0, -142, 13, 11, "#1c1412", 3.5),
    crown: () => P("M-40 -104 Q-38 -150 0 -156 Q38 -150 40 -104 Q0 -112 -40 -104Z", "#2a1d14", 4) + P("M-46 -112 H46 L40 -100 H-40Z", "#d8a83a", 3.5) + P("M-30 -150 Q0 -170 30 -150", "none", 0, `stroke="#d8a83a" stroke-width="7"`),
    old: () => P("M-36 -104 Q-40 -132 0 -134 Q40 -132 36 -104 Q20 -114 0 -112 Q-20 -114 -36 -104Z", "#d8d2c8", 4) + E(0, -138, 12, 10, "#d8d2c8", 3) + P("M-14 -62 Q0 -30 14 -62", "#e8e2d8", 3),
  };
  const adult = (x, y, s, o = {}) => {
    const robe = o.robe || "#6e5a3c", skin = o.skin || "#e3b28c", pants = o.pants || "#3a2a22", head = o.head || "khan", hc = o.hc;
    const flip = o.flip ? -1 : 1, legA = o.walk ? 8 : 0;
    let g = E(0, 0, 46, 10, "#1a0c06", 0, 'opacity=".35"');
    g += P(`M${-22 - legA} 0 L-18 -48 L-4 -48 L${-6 + legA} 0Z`, pants, 3.5) + P(`M${6 - legA} 0 L4 -48 L18 -48 L${22 + legA} 0Z`, mix(pants, "#000", 0.2), 3.5);
    g += P(`M${-26 - legA} 2 h22 v-8 h-20Z M${4 - legA} 2 h22 v-8 h-20Z`, "#2a1d14", 2.5);
    g += P("M-34 -40 Q-38 -96 -18 -108 L18 -108 Q38 -96 34 -40 Q0 -30 -34 -40Z", robe, 4);
    g += P("M6 -108 L18 -108 Q38 -96 34 -40 Q20 -36 8 -38Z", mix(robe, "#1a1020", 0.35), 0, 'opacity=".6"');
    g += P("M-34 -44 Q0 -36 34 -44", "none", 0, `stroke="${o.belt || "#c0503a"}" stroke-width="6"`);
    g += P("M0 -106 L-10 -80 L0 -60", "none", 0, `stroke="${mix(robe, "#000", 0.4)}" stroke-width="3.5"`);
    const arm = o.arm || "down";
    if (arm === "up") g += P("M28 -98 Q50 -126 46 -160", "none", 0, `stroke="${INK}" stroke-width="16" stroke-linecap="round"`) + P("M28 -98 Q50 -126 46 -160", "none", 0, `stroke="${robe}" stroke-width="9" stroke-linecap="round"`) + E(46, -166, 8, 8, skin, 3);
    else if (arm === "fwd") g += P("M28 -98 Q60 -94 76 -84", "none", 0, `stroke="${INK}" stroke-width="16" stroke-linecap="round"`) + P("M28 -98 Q60 -94 76 -84", "none", 0, `stroke="${robe}" stroke-width="9" stroke-linecap="round"`) + E(80, -82, 8, 8, skin, 3);
    else g += P("M28 -98 Q42 -76 38 -54", "none", 0, `stroke="${INK}" stroke-width="16" stroke-linecap="round"`) + P("M28 -98 Q42 -76 38 -54", "none", 0, `stroke="${robe}" stroke-width="9" stroke-linecap="round"`) + E(38, -50, 8, 8, skin, 3);
    g += P("M-28 -98 Q-42 -76 -38 -54", "none", 0, `stroke="${INK}" stroke-width="16" stroke-linecap="round"`) + P("M-28 -98 Q-42 -76 -38 -54", "none", 0, `stroke="${mix(robe, "#000", 0.15)}" stroke-width="9" stroke-linecap="round"`) + E(-38, -50, 8, 8, skin, 3);
    if (o.spear) g += P("M-40 20 L-40 -230", "none", 0, `stroke="${INK}" stroke-width="8"`) + P("M-40 20 L-40 -230", "none", 0, `stroke="#7a5030" stroke-width="4"`) + P("M-40 -230 l-9 0 l9 -34 l9 34z", "#c8c8c8", 3) + (o.tassel ? P("M-48 -228 q8 14 16 0", o.tassel, 2.5) : "");
    if (o.sword) g += P("M76 -84 L130 -150", "none", 0, `stroke="${INK}" stroke-width="9" stroke-linecap="round"`) + P("M76 -84 L130 -150", "none", 0, `stroke="#dfe4ea" stroke-width="5" stroke-linecap="round"`);
    if (o.book) g += P("M-46 -70 h30 v-22 h-30z", "#e8dcc0", 3) + P("M-31 -70 v-22", "none", 0, `stroke="${INK}" stroke-width="2"`);
    if (o.staff) g += P("M42 20 L42 -200", "none", 0, `stroke="${INK}" stroke-width="9"`) + P("M42 20 L42 -200", "none", 0, `stroke="#8a6a3a" stroke-width="5"`);
    g += P("M-10 -108 h20 v-10 h-20z", mix(skin, "#000", 0.15), 3);
    g += E(0, -82, 36, 38, skin, 4);
    g += P("M8 -118 Q40 -104 36 -78 Q32 -54 12 -46 Q28 -76 8 -118Z", mix(skin, "#5a2a2a", 0.45), 0, 'opacity=".55"');
    const face = o.face || "calm";
    g += E(-12, -84, 4.5, 6, INK) + E(12, -84, 4.5, 6, INK) + E(-10, -86, 1.6, 1.6, "#fff") + E(14, -86, 1.6, 1.6, "#fff");
    g += P(face === "angry" ? "M-22 -98 l14 6 M22 -98 l-14 6" : face === "sad" ? "M-22 -92 l14 -5 M22 -92 l-14 -5" : "M-22 -96 q8 -4 15 -1 M22 -96 q-8 -4 -15 -1", "none", 0, `stroke="${INK}" stroke-width="3.5" stroke-linecap="round"`);
    g += P(face === "sad" ? "M-8 -62 Q0 -68 8 -62" : face === "shout" ? "M-9 -66 Q0 -52 9 -66Z" : "M-7 -66 Q0 -61 7 -66", face === "shout" ? "#5a1a14" : "none", 0, `stroke="${INK}" stroke-width="3" stroke-linecap="round"`);
    if (o.beard) g += P("M-20 -60 Q0 -36 20 -60 Q10 -52 0 -52 Q-10 -52 -20 -60Z", "#2a1d14", 2.5) + P("M-16 -68 Q0 -62 16 -68", "none", 0, `stroke="#2a1d14" stroke-width="4"`);
    g += (HEADS[head] || HEADS.khan)(hc);
    if (o.soot) g += E(6, -80, 34, 30, "#1a1418", 0, 'opacity=".32"') + P("M-34 -96 Q-36 -50 -16 -36 Q-30 -70 -34 -96Z", "#1a1418", 0, 'opacity=".25"');
    return G(x, y, s * flip === s ? s : s, o.flip ? `<g transform="scale(-1 1)">${g}</g>` : g, o.id ? `id="${o.id}"` : "");
  };
  const silhouette = (x, y, s, o = {}) => {
    const c = o.c || "#140c10";
    let g = P(`M-20 0 L-16 -48 L16 -48 L20 0Z M-30 -40 Q-34 -96 -16 -108 L16 -108 Q34 -96 30 -40Z`, c);
    g += E(0, -132, 26, 28, c);
    if (o.hat === "nonla") g += P("M-50 -136 L0 -182 L50 -136Z", c);
    else if (o.hat === "qing") g += P("M-34 -146 Q0 -176 34 -146Z", c) + E(0, -176, 6, 6, c);
    else g += E(0, -152, 22, 14, c);
    if (o.spear) g += P(`M${o.spearX || 30} 10 L${(o.spearX || 30) + (o.spearLean || 14)} -250`, "none", 0, `stroke="${c}" stroke-width="7"`) + P(`M${(o.spearX || 30) + (o.spearLean || 14) - 8} -248 l8 -30 l8 30z`, c);
    if (o.flag) g += P(`M-30 10 L-30 -290`, "none", 0, `stroke="${c}" stroke-width="7"`) + P(`M-30 -288 Q20 -300 60 -282 L54 -220 Q10 -232 -30 -222Z`, o.flagC || c);
    if (o.torch) g += P(`M30 -40 L44 -170`, "none", 0, `stroke="${c}" stroke-width="7"`) + `<circle cx="46" cy="-182" r="22" fill="#ffb347"/><circle cx="46" cy="-182" r="60" fill="url(#gFire)" opacity=".7"/>`;
    return G(x, y, s, o.flip ? `<g transform="scale(-1 1)">${g}</g>` : g);
  };
  const crowd = (x0, x1, y, s, n, o = {}) => {
    let out = "";
    for (let k = 0; k < n; k++) { const t = n === 1 ? 0.5 : k / (n - 1); out += silhouette(x0 + (x1 - x0) * t + (R() - 0.5) * 20 * s, y + (R() - 0.5) * 10 * s, s * (0.9 + R() * 0.2), { ...o, spearLean: (R() - 0.5) * 24, flag: o.flagEvery && k % o.flagEvery === 2, flip: o.flip }); }
    return out;
  };
  const horse = (x, y, s, o = {}) => {
    const c = o.c || "#5a3a2a", rider = o.rider;
    let g = "";
    g += P("M-90 -40 L-110 0 M-70 -40 L-60 0 M50 -40 L30 0 M70 -40 L96 -6", "none", 0, `stroke="${INK}" stroke-width="14" stroke-linecap="round"`) + P("M-90 -40 L-110 0 M-70 -40 L-60 0 M50 -40 L30 0 M70 -40 L96 -6", "none", 0, `stroke="${c}" stroke-width="8" stroke-linecap="round"`);
    g += P("M-110 -60 Q-120 -110 -60 -118 L60 -118 Q100 -116 110 -140 L150 -190 Q172 -196 176 -176 L150 -120 Q130 -70 80 -46 Q0 -30 -90 -40 Q-112 -44 -110 -60Z", c, 5);
    g += P("M110 -140 L130 -200 L150 -190", mix(c, "#000", 0.3), 4) + P("M-110 -70 Q-150 -60 -160 -20", "none", 0, `stroke="${INK}" stroke-width="12" stroke-linecap="round"`) + E(156, -178, 4, 4, INK);
    if (rider) g += adult(0, -96, 0.95, rider);
    return G(x, y, s, o.flip ? `<g transform="scale(-1 1)">${g}</g>` : g, o.id ? `id="${o.id}"` : "");
  };
  const elephant = (x, y, s, o = {}) => {
    const c = "#8a8079";
    let g = "";
    g += P("M-120 -10 V-110 M-60 -10 V-110 M70 -10 V-110 M130 -10 V-110", "none", 0, `stroke="${INK}" stroke-width="44" stroke-linecap="round"`) + P("M-120 -10 V-110 M-60 -10 V-110 M70 -10 V-110 M130 -10 V-110", "none", 0, `stroke="${c}" stroke-width="34" stroke-linecap="round"`);
    g += P("M-170 -120 Q-180 -260 -20 -270 Q120 -276 170 -210 Q200 -160 170 -110 Q100 -70 0 -80 Q-150 -70 -170 -120Z", c, 6);
    g += P("M150 -230 Q260 -250 250 -150 Q244 -60 280 -30 Q250 -20 220 -60 Q206 -120 190 -150Z", c, 6) + P("M150 -210 Q110 -160 150 -120 Q190 -140 190 -190Z", mix(c, "#000", 0.2), 5) + E(214, -206, 6, 6, INK) + P("M236 -150 Q262 -140 270 -118", "none", 0, `stroke="#f2ead8" stroke-width="10" stroke-linecap="round"`);
    g += P("M-110 -260 Q0 -290 110 -262 L100 -200 Q0 -220 -100 -200Z", o.cloth || "#b5281c", 5) + P("M-100 -200 l-10 40 M-60 -206 l-6 40 M60 -206 l6 40 M100 -200 l10 40", "none", 0, `stroke="#d8a83a" stroke-width="6"`);
    if (o.rider) g += adult(0, -262, 0.95, o.rider);
    return G(x, y, s, g, o.id ? `id="${o.id}"` : "");
  };
  const boat = (x, y, s, o = {}) => {
    const c = o.c || "#5a3a24";
    let g = P("M-200 -40 Q-190 10 -120 16 H130 Q190 10 210 -50 Q60 -30 -200 -40Z", c, 5) + P("M-180 -28 Q0 -16 196 -40", "none", 0, `stroke="${mix(c, "#fff", 0.25)}" stroke-width="5"`);
    if (o.sail) g += P("M-10 -40 V-260", "none", 0, `stroke="${INK}" stroke-width="8"`) + P("M-6 -250 Q90 -200 96 -70 L-6 -60Z", o.sail, 5) + P("M-6 -200 L80 -190 M-6 -140 L92 -134", "none", 0, `stroke="${mix(o.sail, "#000", 0.3)}" stroke-width="4"`);
    if (o.crew) for (let k = 0; k < o.crew; k++) g += silhouette(-140 + k * 60, -36, 0.42, { c: o.crewC || "#1a1014", hat: o.hat, spear: k % 2 === 0 });
    return G(x, y, s, o.flip ? `<g transform="scale(-1 1)">${g}</g>` : g, o.id ? `id="${o.id}"` : "");
  };
  const cannon = (x, y, s) => G(x, y, s, P("M-60 -20 Q-70 -60 -20 -62 L90 -80 Q104 -70 96 -50 L-10 -18Z", "#3a3430", 5) + E(96, -66, 10, 16, "#1a1418", 3) + E(-30, -10, 30, 30, "#6a4a2a", 5) + E(-30, -10, 8, 8, INK) + P("M-60 -40 h-30", "none", 0, `stroke="#a88a4a" stroke-width="5"`));
  const tent = (x, y, s, c = "#c9b48a", lit = false) => G(x, y, s, P("M-140 0 L0 -170 L140 0Z", c, 5) + P("M0 -170 L140 0 L60 0Z", mix(c, "#2a1a20", 0.3), 0, 'opacity=".6"') + P("M-34 0 L0 -90 L34 0Z", lit ? "#ffb35a" : "#2a1a14", 4) + (lit ? E(0, -30, 120, 70, "#ffb35a", 0, 'opacity=".22" filter="url(#blur14)"') : "") + P("M0 -170 V-200", "none", 0, `stroke="${INK}" stroke-width="5"`));
  const lantern = (x, y, s, id = "") => `<g class="lan" ${id ? `id="${id}"` : ""} data-o="${f(x)} ${f(y - 40 * s)}">${P(`M${f(x)} ${f(y - 40 * s)} V${f(y - 22 * s)}`, "none", 0, `stroke="${INK}" stroke-width="${f(3 * s)}"`)}${E(x, y, 18 * s, 22 * s, "#d8402a", 4 * s)}${E(x, y, 60 * s, 60 * s, "#ffb35a", 0, 'opacity=".25" filter="url(#blur14)"')}${P(`M${f(x - 12 * s)} ${f(y - 20 * s)} h${f(24 * s)} M${f(x - 12 * s)} ${f(y + 20 * s)} h${f(24 * s)}`, "none", 0, `stroke="#ffd27a" stroke-width="${f(4 * s)}"`)}</g>`;
  const wall = (x0, x1, y, h, c = "#7a6a5a", top = "#5a4a3a") => {
    let o = P(`M${x0} ${y} V${y - h} H${x1} V${y}Z`, c, 6);
    for (let x = x0; x < x1; x += 60) o += P(`M${x} ${y - h} v-34 h34 v34`, top, 5);
    for (let r = 0; r < h / 40; r++) for (let x = x0 + (r % 2) * 40; x < x1 - 20; x += 80) o += P(`M${x} ${y - r * 40 - 4} h70`, "none", 0, `stroke="${mix(c, "#000", 0.3)}" stroke-width="3" opacity=".5"`);
    return o;
  };
  const gate = (x, y, s, c = "#8a6e56") => G(x, y, s, wall(-420, 420, 0, 260, c) + P("M-110 0 V-150 Q0 -250 110 -150 V0Z", "#1a1014", 6) + P("M-300 -260 L-300 -380 L300 -380 L300 -260Z", "#9b2a1c", 6) + P("M-380 -380 L0 -470 L380 -380 L330 -360 L-330 -360Z", "#4a3a3a", 6) + P("M-380 -380 Q-420 -390 -440 -420 M380 -380 Q420 -390 440 -420", "none", 0, `stroke="${INK}" stroke-width="8" stroke-linecap="round"`) + [-200, -100, 0, 100, 200].map((dx) => P(`M${dx - 12} -262 V-358 H${dx + 12} V-262Z`, "#5a1a12", 4)).join(""));

  const SETS = {};
  SETS.battle = (night = true) => {
    reseed(31);
    let s = sky("skB", night ? [[0, "#0d0a1a"], [0.55, "#3a1a2a"], [1, "#a4462a"]] : [[0, "#5a5a6a"], [1, "#c98a5a"]]);
    s += clouds(6, 80, 300, "#2a1a28", "#a4462a", 0.7);
    s += ridge(560, 90, "#24141e", 140) + ridge(620, 60, "#2e1a20", 110);
    s += `<circle cx="1300" cy="560" r="520" fill="url(#gFire)" opacity=".45"/>`;
    s += G(1300, 650, 0.8, wall(-500, 500, 0, 220, "#5a4a44", "#3a2e2a"));
    s += ground(640, "#3a2418", "#5a3420");
    for (let k = 0; k < 40; k++) s += grass(R() * 1920, 660 + R() * 420, 1 + R(), "#6a3a20");
    s += `<rect width="1920" height="1080" fill="url(#gFloorDark)"/><rect width="1920" height="1080" fill="url(#gVig)"/>`;
    let d = fire(1060, 450, 1.2, "bf1") + fire(1300, 430, 1.6, "bf2") + fire(1560, 455, 1.1, "bf3");
    d += smokeCol(1180, 380, 1.2, "#2a2030", "bs1") + smokeCol(1480, 360, 1.4, "#2a2030", "bs2");
    d += `<g id="tsArmy">${crowd(40, 980, 930, 1.15, 9, { spear: true, flag: true, flagC: "#c0281c", flagEvery: 4 })}</g>`;
    d += `<g id="qingArmy">${crowd(1080, 1880, 700, 0.55, 12, { hat: "qing", spear: true, flip: true })}</g>`;
    return { s, d, a: { fort: [1300, 430], army: [500, 760], enemy: [1480, 600] } };
  };
  SETS.gate = () => {
    reseed(41);
    let s = sky("skG", [[0, "#6a5a7a"], [0.6, "#d7a07a"], [1, "#f0c890"]], [1500, 230, 70, "#fff0c8"]);
    s += clouds(7, 80, 260, "#c89a8a", "#ffe0b0", 0.8);
    s += softRidge(520, 80, "#a07a78", 180, 'opacity=".8"');
    s += G(960, 700, 1.0, `<g transform="translate(0 0)">${""}</g>`);
    s += G(960, 690, 1.05, wall(-1100, 1100, 0, 200, "#8a6e56", "#6a5242"));
    s += G(960, 690, 1.05, P("M-110 0 V-150 Q0 -250 110 -150 V0Z", "#1a1014", 6) + P("M-300 -200 L-300 -330 L300 -330 L300 -200Z", "#9b2a1c", 6) + P("M-380 -330 L0 -420 L380 -330 L330 -310 L-330 -310Z", "#4a3a3a", 6) + [-200, -100, 0, 100, 200].map((dx) => P(`M${dx - 12} -202 V-308 H${dx + 12} V-202Z`, "#5a1a12", 4)).join("") + `<text x="0" y="-232" font-family="Playfair Display" font-weight="900" font-size="54" fill="#f6d27a" text-anchor="middle">昇龍</text>`);
    s += ground(690, "#9a7a52", "#7a5a3a");
    for (let k = 0; k < 30; k++) s += E(R() * 1920, 720 + R() * 360, 8 + R() * 10, 4, "#6a4a2a", 0, 'opacity=".5"');
    s += `<rect width="1920" height="1080" fill="url(#gFloorDark)"/>`;
    let d = banner(560, 700, 0.9, "#c0281c", "gf1", "西山") + banner(1360, 700, 0.9, "#c0281c", "gf2", "西山");
    d += `<g id="people">${crowd(60, 520, 1000, 1.0, 5, { c: "#2a1a1a", hat: "nonla" })}${crowd(1400, 1880, 1000, 1.0, 5, { c: "#2a1a1a", hat: "nonla", flip: true })}</g>`;
    d += `<g id="ele">${elephant(960, 960, 1.05, { rider: { robe: "#c9a23a", head: "crown", soot: true, beard: true, face: "calm" } })}</g>`;
    return { s, d, a: { king: [960, 590], gate: [960, 420], board: [1500, 760] } };
  };
  SETS.palace = () => {
    reseed(51);
    let s = `<rect width="1920" height="1080" fill="#1a1016"/>`;
    s += P("M0 0 H1920 V640 H0Z", "#2a1a1c") + P("M560 120 H1360 V560 H560Z", "#0e0c1c", 6) + `<circle cx="1120" cy="260" r="60" fill="#e8e0c8"/><circle cx="1120" cy="260" r="200" fill="url(#gCool)" opacity=".5"/>`;
    for (let k = 1; k < 4; k++) s += P(`M${560 + k * 200} 120 V560`, "none", 0, `stroke="#3a2418" stroke-width="14"`);
    s += P("M560 340 H1360", "none", 0, `stroke="#3a2418" stroke-width="12"`);
    [180, 1740].forEach((x) => { s += P(`M${x - 40} 0 V1080 H${x + 40} V0Z`, "#7a1e16", 6) + P(`M${x - 40} 0 V1080 H${x - 10} V0Z`, "#a8322a", 0, 'opacity=".5"'); });
    s += P("M0 640 H1920 V1080 H0Z", "#3a2418") + ground(640, "#4a2e20", "#2a1810", 10);
    s += P("M420 900 Q420 700 520 660 H1400 Q1500 700 1500 900Z", "#5a2a1c", 6) + P("M460 900 V700 Q960 640 1460 700 V900Z", "#c9a23a", 5) + P("M520 780 Q960 720 1400 780 V900 H520Z", "#e8d8b0", 5);
    s += P("M380 300 Q400 640 470 900 L420 900 Q350 640 330 300Z", "#9b2418", 5) + P("M1540 300 Q1520 640 1450 900 L1500 900 Q1570 640 1590 300Z", "#9b2418", 5);
    s += `<rect width="1920" height="1080" fill="url(#gVig)"/>`;
    let d = `<g id="candle">${P("M1600 900 V780 h30 V900Z", "#efe6d0", 4)}${fire(1615, 780, 0.35, "cf")}<circle cx="1615" cy="760" r="260" fill="url(#gWarm)" opacity=".55"/></g>`;
    d += `<g id="sick">${G(960, 760, 1.2, E(0, 0, 50, 54, "#d8a882", 5) + P("M-12 26 Q0 22 12 26", "none", 0, `stroke="${INK}" stroke-width="4" stroke-linecap="round"`) + P("M-26 -2 q8 5 16 0 M10 -2 q8 5 16 0", "none", 0, `stroke="${INK}" stroke-width="4" stroke-linecap="round"`) + E(28, 10, 18, 22, "#5a3a5a", 0, 'opacity=".25"') + P("M-50 -10 Q-56 -60 0 -62 Q56 -60 50 -10 Q30 -40 0 -36 Q-30 -40 -50 -10Z", "#1c1412", 4) + P("M-18 34 Q0 60 18 34 Q8 44 0 44 Q-8 44 -18 34Z", "#2a1d14", 3) + P("M-60 40 Q0 70 60 40 L70 90 H-70Z", "#c9a23a", 5))}</g>`;
    return { s, d, a: { bed: [960, 760], window: [1120, 260] } };
  };
  SETS.hill = (mode = "dusk") => {
    reseed(61);
    const pal = mode === "dawn" ? [[0, "#3a4a7a"], [0.55, "#e6a07a"], [1, "#ffd8a0"]] : mode === "gold" ? [[0, "#5a6a9a"], [0.6, "#f0c080"], [1, "#ffe8b0"]] : [[0, "#1e1a3a"], [0.5, "#7a3a4a"], [1, "#e0784a"]];
    let s = sky("skH" + mode, pal, mode === "dusk" ? [1380, 560, 80, "#ffd09a"] : [1380, 520, 70, "#fff2c8"]);
    s += clouds(8, 80, 360, mode === "dusk" ? "#5a2a3a" : "#e8b8a0", mode === "dusk" ? "#f0884a" : "#fff0d0", 0.8);
    s += softRidge(640, 120, mode === "dusk" ? "#4a2438" : "#8a6a88", 200, 'opacity=".85"') + softRidge(700, 90, mode === "dusk" ? "#3a1a28" : "#6a5070", 170);
    s += P("M-20 1080 V820 Q380 600 900 620 Q1300 640 1940 860 V1080Z", mode === "dusk" ? "#2a2a1c" : "#5a6a34", 6);
    for (let k = 0; k < 50; k++) { const x = R() * 1920; s += grass(x, 780 + R() * 300, 1.2 + R(), mode === "dusk" ? "#4a4a2a" : "#7a8a44"); }
    s += tree(180, 860, 1.3, mode === "dusk" ? "#2a3a24" : "#4a6a2c") + bamboo(1760, 900, 1.2, mode === "dusk" ? "#3a4a24" : "#6f8a3c");
    s += `<rect width="1920" height="1080" fill="url(#gVig)"/>`;
    let d = banner(900, 640, 1.5, "#c0281c", "hf", "西山");
    return { s, d, a: { top: [900, 600], flagTop: [1000, 220] } };
  };
  SETS.river = (night = false) => {
    reseed(71);
    let s = sky("skR" + (night ? "n" : "d"), night ? [[0, "#070a1a"], [0.6, "#1a2448"], [1, "#2a3a5a"]] : [[0, "#5a8ac0"], [0.6, "#c8d8e0"], [1, "#f0e0c0"]], night ? [1500, 180, 40, "#f0ecd8", "gCool"] : [1500, 200, 60, "#fff6d8"]);
    s += clouds(6, 80, 280, night ? "#1a2040" : "#e8eef4", night ? "#3a4a7a" : "#ffffff", 0.7);
    s += softRidge(470, 60, night ? "#141a30" : "#7a9a8a", 200, 'opacity=".9"');
    s += P("M-20 470 H1940 V1080 H-20Z", night ? "#0e1628" : "#4a7a8a");
    for (let k = 0; k < 40; k++) { const y = 480 + Math.pow(R(), 1.6) * 600, x = R() * 1920, w = 40 + (y - 470) * 0.3; s += P(`M${f(x)} ${f(y)} h${f(w)}`, "none", 0, `stroke="${night ? "#3a5a8a" : "#a8d0d8"}" stroke-width="${f(2 + (y - 470) / 160)}" opacity=".6"`); }
    s += P("M-20 700 Q200 640 460 680 Q520 760 380 820 Q120 860 -20 840Z", night ? "#141e14" : "#5a7a3a", 6) + bamboo(160, 760, 0.8, night ? "#2a3a24" : "#6f8a3c") + bamboo(320, 780, 0.7, night ? "#2a3a24" : "#6f8a3c");
    s += P("M1940 690 Q1700 640 1440 680 Q1400 760 1560 820 Q1800 850 1940 830Z", night ? "#141e14" : "#5a7a3a", 6) + tree(1720, 740, 0.9, night ? "#1e2e1a" : "#3f5a2c");
    s += `<rect width="1920" height="1080" fill="url(#gVig)"/>`;
    let d = "";
    if (night) d += `<g id="crossing">${boat(760, 840, 0.9, { c: "#2a1e18", crew: 5, crewC: "#0a0810" })}${boat(1180, 760, 0.65, { c: "#2a1e18", crew: 5, crewC: "#0a0810" })}${boat(1480, 700, 0.45, { c: "#2a1e18", crew: 5, crewC: "#0a0810" })}</g>${silhouette(820, 760, 0.6, { torch: true, c: "#0a0810" })}`;
    else {
      d += `<g id="siam">${boat(880, 640, 0.55, { sail: "#d8c8a0", crew: 4, hat: "qing" })}${boat(1180, 610, 0.45, { sail: "#d8c8a0", crew: 4 })}${boat(1420, 580, 0.36, { sail: "#d8c8a0", crew: 4 })}${boat(640, 700, 0.7, { sail: "#d8c8a0", crew: 4 })}</g>`;
      d += `<g id="cannons">${cannon(260, 740, 0.9)}${cannon(1620, 740, -0.9)}</g>`;
    }
    return { s, d, a: { left: [300, 700], right: [1640, 690], mid: [960, 620] } };
  };
  SETS.march = (qing = false) => {
    reseed(81);
    let s = sky("skM" + (qing ? "q" : "n"), qing ? [[0, "#6a6a7a"], [0.6, "#c8a880"], [1, "#e8c890"]] : [[0, "#060814"], [0.6, "#141a34"], [1, "#2a2a40"]], qing ? null : [1560, 160, 36, "#f0ecd8", "gCool"]);
    for (let k = 0; k < 80 && !qing; k++) s += E(R() * 1920, R() * 420, 1.6, 1.6, "#e8e8f8", 0, `opacity="${(0.3 + R() * 0.6).toFixed(2)}"`);
    s += softRidge(560, 140, qing ? "#8a7a7a" : "#10142a", 220) + softRidge(640, 90, qing ? "#6a5a5a" : "#0c1020", 170);
    s += P("M-20 1080 V760 Q600 680 1940 720 V1080Z", qing ? "#7a6a4a" : "#14141c", 6);
    s += P("M200 1080 Q700 760 1940 700 V740 Q800 800 520 1080Z", qing ? "#a08a5a" : "#2a2420", 0);
    s += `<rect width="1920" height="1080" fill="url(#gVig)"/>`;
    let d = "";
    if (qing) d += `<g id="col">${[0, 1, 2].map((r) => crowd(200 + r * 260, 1900, 760 + r * 70 + 60, 0.5 + r * 0.12, 10, { c: "#2a2430", hat: "qing", spear: true, flagEvery: 3, flagC: "#d8b83a" })).join("")}</g>`;
    else d += `<g id="col">${[0, 1].map((r) => crowd(260 + r * 200, 1900, 800 + r * 90, 0.55 + r * 0.15, 11, { c: "#0a0810", torch: true, spear: true })).join("")}</g>`;
    return { s, d, a: { head: [1700, 720], tail: [300, 900] } };
  };
  SETS.camp = () => {
    reseed(91);
    let s = sky("skC", [[0, "#0a0c1c"], [0.6, "#2a2040"], [1, "#4a2a3a"]], [300, 150, 34, "#f0ecd8", "gCool"]);
    for (let k = 0; k < 60; k++) s += E(R() * 1920, R() * 380, 1.6, 1.6, "#e8e8f8", 0, `opacity="${(0.3 + R() * 0.6).toFixed(2)}"`);
    s += softRidge(560, 160, "#1a1428", 200) + ground(600, "#2a2018", "#3a2a20");
    [[260, 620, 0.7], [600, 600, 0.6, true], [1360, 610, 0.65, true], [1700, 630, 0.75]].forEach(([x, y, sc, lit]) => { s += tent(x, y, sc, "#a89470", lit); });
    s += P("M500 860 H1420 L1380 900 H540Z", "#6a4a2a", 5) + P("M520 860 H1400", "none", 0, `stroke="#8a6a3a" stroke-width="6"`);
    [620, 760, 900, 1040, 1180, 1300].forEach((x, i) => { s += E(x, 846, 42, 14, "#e8e0d0", 4) + P(`M${x - 22} 832 h44 v14 h-44z`, i % 2 ? "#4a7a3a" : "#c8a060", 3); });
    s += `<rect width="1920" height="1080" fill="url(#gVig)"/>`;
    let d = lantern(420, 380, 1.1, "cl1") + lantern(960, 340, 1.2, "cl2") + lantern(1500, 380, 1.1, "cl3") + fire(960, 640, 1.0, "cfire");
    d += `<g id="eaters">${[540, 680, 1240, 1380].map((x, i) => adult(x, 980, 0.95, { robe: i % 2 ? "#4a5a6a" : "#6a3a2a", head: i % 2 ? "helm" : "khan", arm: "fwd", face: "calm" })).join("")}</g>`;
    d += `<g id="king">${adult(960, 1000, 1.25, { robe: "#c9a23a", head: "crown", beard: true, arm: "up" })}</g>`;
    return { s, d, a: { king: [960, 820], table: [960, 846] } };
  };
  SETS.yard = () => {
    reseed(101);
    let s = sky("skY", [[0, "#7a9ac8"], [0.6, "#f0d0a0"], [1, "#f8e0b0"]], [1600, 220, 60, "#fff6d8"]);
    s += clouds(6, 80, 260, "#f0e0d0", "#ffffff", 0.8) + softRidge(520, 80, "#8aa08a", 200, 'opacity=".8"');
    s += G(560, 700, 1.0, P("M-420 0 V-230 H360 V0Z", "#b9855a", 6) + P("M-480 -220 L-40 -440 L420 -220Z", "#b68a3f", 6) + P("M-200 0 V-160 H-60 V0Z", "#2b1a12", 5) + P("M120 -110 H280 V-40 H120Z", "#3a2618", 5));
    for (let k = 1; k < 26; k++) { const t = k / 26; s += P(`M520 262 L${f(80 + t * 900)} 478`, "none", 0, `stroke="#8d6a2a" stroke-width="2.5" opacity=".55"`); }
    s += G(560, 700, 1.0, [-380, -300, -220, 180, 260, 330].map((dx) => P(`M${dx} -232 v232`, "none", 0, `stroke="#8f6340" stroke-width="3" opacity=".6"`)).join("") + P("M-420 -230 H360", "none", 0, `stroke="#2a140a" stroke-width="18" opacity=".3"`) + [130, 175, 220, 265].map((x) => P(`M${x} -110 v70`, "none", 0, `stroke="${INK}" stroke-width="4"`)).join(""));
    s += ground(700, "#b09068", "#8a6a48") + bamboo(1700, 760, 1.0) + tree(1350, 720, 0.9);
    [[150, 760], [215, 770], [900, 742]].forEach(([x, y]) => { s += P(`M${x - 30} ${y} Q${x - 46} ${y - 40} ${x - 20} ${y - 70} H${x + 20} Q${x + 46} ${y - 40} ${x + 30} ${y}Z`, "#7a4a2c", 4) + P(`M${x - 18} ${y - 66} H${x + 18}`, "none", 0, `stroke="#a8643c" stroke-width="5"`); });
    for (let z = 0; z < 22; z++) s += P(`M${1000 + z * 40} 700 v-80`, "none", 0, `stroke="#a8964f" stroke-width="6"`);
    s += P("M1000 650 H1880 M1000 676 H1880", "none", 0, `stroke="#8a7a3e" stroke-width="7"`);
    for (let k = 0; k < 60; k++) s += grass(R() * 1920, 720 + R() * 340, 1 + R(), "#7a7a3a");
    s += `<rect width="1920" height="1080" fill="url(#gFloorDark)"/>`;
    return { s, d: "", a: { door: [430, 620] } };
  };
  return { DEFS, SETS, adult, silhouette, crowd, horse, elephant, boat, cannon, tent, lantern, banner, fire, smokeCol, mix, P, E, G };
})();
