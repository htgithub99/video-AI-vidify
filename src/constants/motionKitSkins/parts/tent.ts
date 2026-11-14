export const SKIN_PART_TENT = `(c, o, K) => {
  const R = K.num(o.r, 40), w = K.LW(R), col = o.color || "#6e5a44", W = 2.6 * R, H = 2.0 * R;
  c.save();
  c.translate(o.x, o.y);
  c.fillStyle = "rgba(20,16,12,0.18)";
  c.fill(K.ell(0, 0, W * 0.6, 0.15 * R));
  const p = new Path2D(); p.moveTo(-W / 2, 0); p.lineTo(0, -H); p.lineTo(W / 2, 0); p.closePath();
  K.paint(c, p, col, w);
  const d = new Path2D(); d.moveTo(-0.28 * R, 0); d.lineTo(0, -0.95 * H); d.lineTo(0.28 * R, 0); d.closePath();
  K.paint(c, d, K.shade(col, 0.45), w * 0.8);
  K.line(c, [[0, -H], [0, -H - 0.25 * R]], w * 1.2);
  K.line(c, [[W / 2, 0], [W / 2 + 0.5 * R, 0.05 * R]], w * 0.6);
  K.line(c, [[-W / 2, 0], [-W / 2 - 0.5 * R, 0.05 * R]], w * 0.6);
  c.restore();
  return true;
}`;
