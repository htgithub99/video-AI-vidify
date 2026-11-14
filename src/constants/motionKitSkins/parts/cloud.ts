// Clouds for the sketch and comic skins: merged puffs with a flat base, outlined in the skin ink.
// Sketch: pale grey-white, one darker underside. Comic: warmer paper white with hatching under the belly.
export const SKIN_PART_CLOUD = `(c, o0, K) => {
  const o = Object.assign({ x: 0, y: 0, r: 40, drift: 8, seed: 1 }, o0 || {});
  const st = K.S(), t = K.num(o.t, K.num(window.__motionKitTime, 0)), R = o.r, x = o.x + t * o.drift, y = o.y, w = K.LW(R) * 0.8;
  const night = K.NIGHT() || o.dark;
  const col = o.color || (night ? "#8a8f9e" : st.cloud || "#eef0f0");
  const list = [];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1) - 0.5, rr = R * (0.55 + Math.cos(k * 2.6) * 0.45) * (0.85 + K.rnd(o.seed, i) * 0.3);
    list.push(K.ell(x + k * R * 2.6, y - rr * 0.55, rr, rr * 0.92));
  }
  list.push(K.ell(x, y - R * 0.15, R * 1.75, R * 0.42));
  K.union(c, list, col, w, { R: R * 0.6, dx: R * 0.1, dy: -R * 0.22, dark: 0.86, box: [x - 2.5 * R, y - 2 * R, x + 2.5 * R, y + R] });
  return true;
}`;
