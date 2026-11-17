// The object library's skin parts: each file holds one family of things, with the catalogue facts of each kind (years,
// other names, how it fits its box) next to its drawing, so a kind is added in one place. Drawings use the shared
// prelude below (units of R, ground y = 0, front toward +x) and the active skin's ink, fill and tone.
import type { MotionCatalogFn } from "../../../types/motionObjectCatalog.js";

export type MotionLibraryItem = { id: string; from?: number; to?: number; names?: string[]; fit?: "stretch" | "elastic" | "rigid" | "ground" };
export type MotionLibraryPart = { part: string; fn: MotionCatalogFn; items: MotionLibraryItem[]; js: string };

// Helpers every library drawing may use:
// P(pts) polygon, S(pts) smooth closed shape, E(x, y, a, b) ellipse, rect(x0, y0, x1, y1), fl(path, colour, opts) skin fill
// with cel shading, ln(pts, k, colour) ink line, beam(pts, width, colour) outlined bar, ring(x, y, r, colour), clip(path, fn),
// rnd(i) seeded 0..1, glow(x, y, r), flame(x, y, s), smoke(x, y, s); colours below (toned by the skin).
const PRELUDE = `const st = K.S(), R = K.num(o.r, 30), w = K.LW(R), ol = st.ol, night = K.NIGHT(), t = K.num(o.t, K.num(window.__motionKitTime, 0));
  const f = K.num(o.facing, 1) < 0 ? -1 : 1, moving = o.moving !== false && o.pose !== "stand", spin = moving ? (o.distance != null ? +o.distance / R : t * 6) : 0;
  const rnd = (i) => K.rnd(K.num(o.seed, 3), i);
  const T = (c0) => K.toneOf(c0);
  const wood = T(o.color || (night ? "#5e4a3a" : "#8a6444")), dark = K.shade(wood, 0.72), iron = T(night ? "#4a4c52" : "#5e6268"), steel = T(night ? "#8a8e96" : "#bcc2ca"), stone = T(night ? "#8e8a84" : "#c4bcae"), cloth = T(night ? "#a8a090" : "#e6dcc4"), gold = T("#d4a83a"), red = T("#a8382e"), paper = T(night ? "#cfc6b0" : "#f2ead6"), glass = T(night ? "#6a8094" : "#b4d4e6"), leather = T(night ? "#5a3a2a" : "#8a4a2e"), rope = T("#c9b07a"), straw = T(night ? "#9a8a5a" : "#d8bc6a"), green = T(night ? "#3e5a3a" : "#5e8a4a"), olive = T(night ? "#4a5038" : "#6a7350"), brick = T(night ? "#6a3a30" : "#a8543a"), tile = T(night ? "#6e3e34" : "#a24a38"), rubber = T("#24242a"), black = T("#2a2a30"), white = T(night ? "#c8c4bc" : "#f4f2ec"), blue = T("#3a5a98");
  const P = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x * R, y * R) : p.moveTo(x * R, y * R))); p.closePath(); return p; };
  const S = (pts) => K.smooth(pts.map(([x, y]) => [x * R, y * R]), true);
  const E = (x, y, a, b, r) => K.ell(x * R, y * R, a * R, b * R, r);
  const rect = (x0, y0, x1, y1) => P([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
  const fl = (p, col, k) => K.fill(c, p, col, w, Object.assign({ R, box: [-4 * R, -7 * R, 4 * R, 0.6 * R] }, k || {}));
  const ln = (pts, k, col) => K.line(c, pts.map(([x, y]) => [x * R, y * R]), w * (k || 0.5), col || ol);
  const beam = (pts, wd, col) => { const q = pts.map(([x, y]) => [x * R, y * R]); K.line(c, q, wd * R + w * 2, ol); K.line(c, q, wd * R, col || wood); };
  const ring = (x, y, r, col) => fl(E(x, y, r, r), col);
  const clip = (p, fn) => { c.save(); c.clip(p); fn(); c.restore(); };
  const glow = (x, y, r) => { const g = c.createRadialGradient(x * R, y * R, 0, x * R, y * R, r * R); g.addColorStop(0, "rgba(255,200,110," + (night ? 0.5 : 0.28) + ")"); g.addColorStop(1, "rgba(255,200,110,0)"); c.fillStyle = g; c.fillRect((x - r) * R, (y - r) * R, 2 * r * R, 2 * r * R); };
  const flame = (x, y, s) => { const fx = K.part && K.part("effect"); if (fx) fx(c, { kind: "fire", x: x * R, y: y * R, r: s * R, t, seed: 3 }, K); };
  const smoke = (x, y, s) => { const fx = K.part && K.part("effect"); if (fx) fx(c, { kind: "smoke", x: x * R, y: y * R, r: s * R, t, seed: 5 }, K); };
  const wheel = (x, r, n, col) => { ring(x, -r, r, rubber); ring(x, -r, r * 0.7, col || T("#8a8c90")); for (let i = 0; i < (n || 0); i++) { const a = spin + i * Math.PI * 2 / n; ln([[x, -r], [x + Math.cos(a) * r * 0.68, -r + Math.sin(a) * r * 0.68]], 0.45); } ring(x, -r, r * 0.16, T("#4a4c52")); };
  const woodWheel = (x, r) => { ring(x, -r, r, K.shade(wood, 0.8)); ring(x, -r, r * 0.8, K.shade(wood, 1.1)); for (let i = 0; i < 10; i++) { const a = spin + i * Math.PI / 5; ln([[x, -r], [x + Math.cos(a) * r * 0.8, -r + Math.sin(a) * r * 0.8]], 0.5, dark); } ring(x, -r, r * 0.18, dark); };`;

// One skin part drawing the given kinds; body is the switch's cases (each ends with break), helpers the family's own
// shared drawing functions. shadow: half-width of the ground shadow in R (0 for none).
export const motionLibraryPart = (items: MotionLibraryItem[], body: string, shadow = 1, helpers = ""): string => `(c, o, K) => {
  const kind = o.kind;
  if (${JSON.stringify(items.map((item) => item.id))}.indexOf(kind) < 0 || (o.view && o.view !== "side")) return null;
  ${PRELUDE}
  c.save();
  c.translate(K.num(o.x, 0), K.num(o.y, 0));
  c.scale(f, 1);
  if (o.alpha != null) c.globalAlpha *= K.clamp(o.alpha, 0, 1);
  ${shadow ? `K.shadow(c, E(0, 0.03, ${shadow}, 0.1), 0.18, 0.1 * R);` : ""}
  ${helpers}
  let out = true;
  switch (kind) {
${body}
  }
  c.restore();
  return out;
}`;
