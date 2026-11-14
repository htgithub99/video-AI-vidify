// Two-wheel cart pulled behind an animal (option cart: true), drawn in the skin ink for the sketch and comic skins.
// Called by horse.ts and quad.ts through K.part("cartRig") with pixel coordinates in the animal's facing frame:
// {x0: rump x, y: ground, R, f: facing, ph: gait phase, hitch: [x, y] shoulder point, color, cover}.
export const SKIN_PART_CART_RIG = `(c, a, K) => {
  const { R, f, ph } = a, st = K.S(), w = K.LW(R / 1.6), ol = st.ol;
  const wood = a.color ? K.toneOf(a.color) : "#8a6a44", dark = K.shade(wood, 0.72);
  const cx = a.x0 - 1.9 * R, wy = -0.55 * R, wr = 0.55 * R, bodyY = -1.25 * R;
  c.save();
  c.translate(K.num(a.ox, 0), K.num(a.oy, 0));
  c.scale(f, 1);
  c.fillStyle = "rgba(20,16,12,0.2)";
  c.fill(K.ell(cx, 0, 1.2 * R, 0.12 * R));
  const shaft = [[cx + 0.9 * R, bodyY + 0.75 * R], [a.hitch[0], a.hitch[1]]];
  K.line(c, shaft, 0.1 * R + w * 2, ol); K.line(c, shaft, 0.1 * R, dark);
  const bx = K.smooth([[cx - 1.05 * R, bodyY], [cx - 1.05 * R, bodyY], [cx + 1.05 * R, bodyY], [cx + 1.05 * R, bodyY], [cx + 0.95 * R, bodyY + 0.85 * R], [cx + 0.95 * R, bodyY + 0.85 * R], [cx - 0.95 * R, bodyY + 0.85 * R], [cx - 0.95 * R, bodyY + 0.85 * R]], true);
  if (a.cover) K.fill(c, K.smooth([[cx - 1.0 * R, bodyY + 0.05 * R], [cx - 0.95 * R, bodyY - 0.95 * R], [cx, bodyY - 1.2 * R], [cx + 0.95 * R, bodyY - 0.95 * R], [cx + 1.0 * R, bodyY + 0.05 * R]], true), "#e6dcc6", w, { R, box: [cx - 1.2 * R, bodyY - 1.4 * R, cx + 1.2 * R, bodyY + 0.2 * R] });
  K.fill(c, bx, wood, w, { R, box: [cx - 1.2 * R, bodyY - 0.2 * R, cx + 1.2 * R, bodyY + R] });
  [0.3, 0.58].forEach((k) => K.line(c, [[cx - 0.98 * R, bodyY + k * R], [cx + 0.98 * R, bodyY + k * R]], w * 0.55, ol));
  [-0.5, 0.5].forEach((k) => K.line(c, [[cx + k * R, bodyY], [cx + k * R, bodyY + 0.85 * R]], w * 0.45, ol));
  K.fill(c, K.ell(cx, wy, wr, wr), dark, w, { R: wr, hatch: false });
  K.paint(c, K.ell(cx, wy, wr * 0.78, wr * 0.78), K.shade(wood, 0.95), w * 0.6);
  for (let i = 0; i < 4; i++) { const an = i * Math.PI / 4 + ph * 0.4; K.line(c, [[cx - Math.cos(an) * wr * 0.75, wy - Math.sin(an) * wr * 0.75], [cx + Math.cos(an) * wr * 0.75, wy + Math.sin(an) * wr * 0.75]], Math.max(1, 0.06 * R), ol); }
  K.paint(c, K.ell(cx, wy, wr * 0.16, wr * 0.16), dark, w * 0.6);
  c.restore();
  return true;
}`;
