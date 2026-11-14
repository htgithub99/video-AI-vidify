export const SKIN_PART_PINE_DARK = `(c, o, K) => {
  const R = K.num(o.r, 40), night = K.NIGHT(), col = o.color || (night ? K.organic.pineNight : K.organic.pine), h = R * 4.6, wd = R * 1.9, w = K.LW(R);
  const pts = [[0, -h]];
  for (let i = 1; i <= 5; i++) { const k = i / 5; pts.push([wd * k * 0.5, -h + h * k * 0.92 - h * 0.05], [wd * k * 0.26, -h + h * k * 0.92 - h * 0.02]); }
  const right = pts.slice(), left = right.slice(1).reverse().map(([x, y]) => [-x, y]);
  c.save();
  c.translate(o.x, o.y);
  c.fillStyle = "rgba(20,16,12,0.18)";
  c.fill(K.ell(0, 0, 0.9 * R, 0.12 * R));
  K.paint(c, K.smooth([[-0.1 * R, 0], [-0.1 * R, -0.5 * R], [0.1 * R, -0.5 * R], [0.1 * R, 0]], true), K.organic.bark, w);
  const p = new Path2D();
  right.concat([[0.12 * R, -0.45 * R], [-0.12 * R, -0.45 * R]], left).forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  K.paint(c, p, col, w);
  c.restore();
  return true;
}`;
