// Helmets drawn by the skins: Roman / Greek (below) and modern steel helmets.
// Hook: skinPart('headwear', kind, c, {o, hx, hy, r}) draws and returns true.
// Roman / Greek helmet (reference: marching hoplites): a bronze bowl down to just above the brows with a raised brow band and
// rivets, a cheek guard over the cheek in front of the ear, a flared neck guard, and a tall curved fin crest along the top
// (bronze unless the scene gives crest a colour; crest: false leaves it off). Seen from the front or back the crest is a
// narrow ridge and both cheek guards show.
export const SKIN_PART_HELMET_ROMAN = `(c, a, K) => {
  const { o, hx, hy, r } = a;
  const w = K.LW(r);
  const col = o.headColor || "#b7863e";
  const dark = K.shade(col, 0.82);
  const P = (pts) => K.smooth(pts.map((q) => [hx + q[0] * r, hy + q[1] * r]), true);
  const front = o.__back || o.view === "front" || o.view === "back";
  const crestCol = o.crest === false ? null : typeof o.crest === "string" ? o.crest : K.shade(col, 1.06);
  const grooves = (path, lines) => { c.save(); c.clip(path); c.strokeStyle = "rgba(40,24,10,0.35)"; c.lineWidth = w * 0.45; lines.forEach((l) => { c.beginPath(); c.moveTo(hx + l[0] * r, hy + l[1] * r); c.quadraticCurveTo(hx + l[2] * r, hy + l[3] * r, hx + l[4] * r, hy + l[5] * r); c.stroke(); }); c.restore(); };
  if (front) {
    if (crestCol) {
      const cp = P([[-0.16, -0.95], [-0.2, -1.6], [0, -1.86], [0.2, -1.6], [0.16, -0.95]]);
      K.paint(c, cp, crestCol, w);
      grooves(cp, [[-0.08, -1.0, -0.1, -1.4, -0.06, -1.78], [0.08, -1.0, 0.1, -1.4, 0.06, -1.78]]);
    }
    const bowl = P([[-1.08, 0.12], [-1.04, -0.5], [-0.78, -0.98], [0, -1.16], [0.78, -0.98], [1.04, -0.5], [1.08, 0.12], [0.86, -0.3], [0.4, -0.38], [0, -0.4], [-0.4, -0.38], [-0.86, -0.3]]);
    K.paint(c, bowl, col, w);
    c.save(); c.clip(bowl); c.fillStyle = "rgba(255,255,255,0.25)"; c.fill(K.ell(hx - 0.42 * r, hy - 0.82 * r, 0.16 * r, 0.26 * r, -0.4)); c.restore();
    if (!o.__back) {
      K.paint(c, P([[-0.92, -0.46], [-0.4, -0.5], [0, -0.52], [0.4, -0.5], [0.92, -0.46], [0.92, -0.32], [0.4, -0.36], [0, -0.38], [-0.4, -0.36], [-0.92, -0.32]]), dark, w * 0.9);
      [-1, 1].forEach((k) => K.paint(c, P([[k * 0.66, -0.34], [k * 0.98, -0.3], [k * 1.0, 0.3], [k * 0.86, 0.6], [k * 0.66, 0.42], [k * 0.6, 0.02]]), K.shade(col, 0.95), w * 0.9));
    }
    return true;
  }
  if (crestCol) {
    const cp = P([[0.36, -1.0], [0.46, -1.42], [0.3, -1.8], [-0.1, -1.95], [-0.62, -1.86], [-1.0, -1.56], [-1.18, -1.2], [-1.02, -0.92], [-0.7, -1.0], [-0.3, -1.08], [0.08, -1.06]]);
    K.paint(c, cp, crestCol, w);
    grooves(cp, [[0.3, -1.1, 0.36, -1.7, -0.2, -1.86], [0.2, -1.12, 0.1, -1.6, -0.6, -1.74], [0.05, -1.2, -0.3, -1.6, -0.95, -1.42]]);
  }
  const bowl = P([[-1.2, 0.36], [-1.08, -0.1], [-0.98, -0.66], [-0.6, -1.04], [0.1, -1.16], [0.72, -0.96], [1.04, -0.56], [1.1, -0.36], [0.98, -0.3], [0.55, -0.34], [0.1, -0.38], [-0.3, -0.3], [-0.62, -0.16], [-0.84, 0.18], [-0.96, 0.34]]);
  K.paint(c, bowl, col, w);
  c.save(); c.clip(bowl); c.fillStyle = "rgba(255,255,255,0.25)"; c.fill(K.ell(hx + 0.15 * r, hy - 0.85 * r, 0.3 * r, 0.14 * r, -0.2)); c.fillStyle = "rgba(40,24,10,0.14)"; c.fill(K.ell(hx - 0.9 * r, hy - 0.2 * r, 0.3 * r, 0.7 * r)); c.restore();
  const band = P([[-0.34, -0.42], [0.1, -0.5], [0.6, -0.48], [1.12, -0.44], [1.14, -0.3], [0.6, -0.33], [0.1, -0.35], [-0.32, -0.28]]);
  K.paint(c, band, dark, w * 0.9);
  c.fillStyle = K.shade(col, 0.6);
  [-0.15, 0.25, 0.65].forEach((u) => c.fill(K.ell(hx + u * r, hy - 0.4 * r, 0.035 * r, 0.035 * r)));
  const cheek = P([[-0.44, -0.3], [-0.06, -0.32], [0.0, 0.08], [-0.08, 0.5], [-0.24, 0.62], [-0.38, 0.36]]);
  K.paint(c, cheek, K.shade(col, 0.95), w * 0.9);
  c.fillStyle = K.shade(col, 0.6);
  c.fill(K.ell(hx - 0.22 * r, hy - 0.14 * r, 0.035 * r, 0.035 * r));
  return true;
}`;
export const SKIN_PART_HELMET_MODERN = `(c, a, K) => {
  const { o, hx, hy, r } = a;
  const h = o.head, w = K.LW(r), back = o.__back;
  const col = o.headColor || (h === "stahlhelm" ? "#5c6156" : h === "brodie" ? "#6a6a48" : h === "adrian" ? "#6c7a86" : "#5f6b3e");
  const P = (pts) => K.smooth(pts.map((q) => [hx + q[0] * r, hy + q[1] * r]), true);
  const box = [hx - 2 * r, hy - 2 * r, hx + 2 * r, hy + r];
  if (h === "brodie") {
    K.fill(c, P([[-0.82, -0.42], [-0.72, -1.0], [0, -1.22], [0.72, -1.0], [0.82, -0.42]]), col, w, { R: r, box });
    K.fill(c, K.ell(hx, hy - 0.42 * r, 1.5 * r, 0.24 * r), col, w, { R: r * 0.5, box });
  } else if (h === "stahlhelm") {
    K.fill(c, P([[-1.18, 0.28], [-1.12, -0.35], [-0.95, -0.92], [-0.4, -1.26], [0.3, -1.26], [0.92, -0.92], [1.08, -0.42], [0.98, -0.3], [1.16, -0.18], [0.6, -0.28], [-0.4, -0.28], [-0.92, -0.2], [-1.0, 0.3]]), col, w, { R: r, box });
  } else {
    const pts = [[-1.22, -0.12], [-1.14, -0.62], [-0.8, -1.12], [0, -1.36], [0.8, -1.12], [1.14, -0.62], [1.22, -0.12], [0.6, -0.3], [0, -0.33], [-0.6, -0.3]];
    K.fill(c, P(pts), col, w, { R: r, box });
    K.line(c, [[hx - 1.2 * r, hy - 0.16 * r], [hx, hy - 0.3 * r], [hx + 1.2 * r, hy - 0.16 * r]], w * 0.7);
    if (h === "adrian") K.paint(c, P([[-0.12, -1.2], [-0.08, -1.55], [0.4, -1.5], [0.12, -1.18]]), K.shade(col, 0.9), w * 0.8);
    if (!back && h === "m1") K.line(c, [[hx - 1.1 * r, hy - 0.2 * r], [hx - 0.9 * r, hy + 0.55 * r]], w * 0.6);
  }
  c.save(); c.fillStyle = "rgba(255,255,255,0.18)"; c.fill(K.ell(hx - 0.45 * r, hy - 0.95 * r, 0.12 * r, 0.24 * r, -0.6)); c.restore();
  return true;
}`;
