// Sketch-skin head parts traced from reference video 1 (frame 582): a rounded-square face and the Imperial Gallic helmet.
// Hooks: skinPart('head', 'face', c, {o, hx, hy, r}) returns the face Path2D; skinPart('headwear', kind, c, {o, hx, hy, r}) draws and returns true.
export const SKIN_PART_FACE_SQUARE = `(c, a, K) => {
  const { hx, hy, r } = a;
  return K.smooth([[0, -1.02], [0.74, -0.96], [1.0, -0.62], [1.03, 0], [0.96, 0.62], [0.7, 0.96], [0, 1.06], [-0.7, 0.96], [-0.96, 0.62], [-1.03, 0], [-1.0, -0.62], [-0.74, -0.96]].map((q) => [hx + q[0] * r, hy + q[1] * r]), true);
}`;
export const SKIN_PART_HELMET_ROMAN = `(c, a, K) => {
  const { o, hx, hy, r } = a;
  const w = K.LW(r);
  const crest = o.crest && o.crest !== false;
  const col = o.headColor || (crest ? "#a58c52" : "#8f949c");
  const P = (pts) => K.smooth(pts.map((q) => [hx + q[0] * r, hy + q[1] * r]), true);
  const back = o.__back;
  if (crest) {
    const cc = typeof o.crest === "string" ? o.crest : "#9a2e28";
    const cp = P([[-0.9, -1.0], [-1.0, -1.6], [-0.62, -2.1], [0, -2.28], [0.55, -2.1], [0.88, -1.62], [0.78, -1.0], [0, -1.2]]);
    K.paint(c, cp, cc, w);
    c.save(); c.clip(cp); c.strokeStyle = "rgba(20,16,20,0.45)"; c.lineWidth = w * 0.5;
    for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(hx + i * 0.1 * r, hy - 1.15 * r); c.lineTo(hx + i * 0.17 * r, hy - 2.3 * r); c.stroke(); }
    c.restore();
  }
  K.paint(c, P([[-0.98, -0.12], [-1.4, 0.16], [-1.36, 0.32], [-0.9, 0.2]]), K.shade(col, 0.9), w);
  const bowl = P([[-1.1, -0.34], [-1.06, -0.86], [-0.62, -1.2], [0, -1.3], [0.62, -1.2], [1.06, -0.86], [1.1, -0.34], [0, -0.4]]);
  K.paint(c, bowl, col, w);
  c.save(); c.clip(bowl); c.fillStyle = "rgba(255,255,255,0.28)"; c.fill(K.ell(hx - 0.42 * r, hy - 0.9 * r, 0.14 * r, 0.3 * r, -0.5)); c.restore();
  K.paint(c, P([[-1.12, -0.5], [-0.6, -0.56], [0, -0.58], [0.6, -0.56], [1.12, -0.5], [1.12, -0.36], [0.6, -0.4], [0, -0.42], [-0.6, -0.4], [-1.12, -0.36]]), K.shade(col, 0.88), w * 0.9);
  if (!back) [-1, 1].forEach((k) => K.paint(c, P([[k * 0.74, -0.42], [k * 1.1, -0.38], [k * 1.06, 0.42], [k * 0.86, 0.58], [k * 0.7, 0.12]]), K.shade(col, 0.95), w * 0.9));
  if (!crest) K.paint(c, K.ell(hx, hy - 1.32 * r, 0.12 * r, 0.08 * r), K.shade(col, 0.85), w * 0.8);
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
