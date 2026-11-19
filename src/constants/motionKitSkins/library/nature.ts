import { motionLibraryPart, type MotionLibraryPart } from "./common.js";
const trees = [
  { id: "coconut", names: ["coconutPalm"] },
  { id: "mangrove" },
  { id: "cactus", names: ["saguaro"] },
  { id: "baobab" },
  { id: "olive", names: ["oliveTree"] },
  { id: "maple", names: ["mapleTree"] },
  { id: "fir", names: ["spruce", "snowyPine", "christmasTree"] },
  { id: "sugarcane" },
  { id: "teaBush", names: ["teaPlant"] },
  { id: "vine", names: ["grapevine", "vineyard"] },
  { id: "acacia", names: ["savannaTree"] },
  { id: "lotusPlant", names: ["waterLily"] },
];
const leaf = `const canopy = (pts, col) => { const p = S(pts); fl(p, col || green); return p; };
  const trunk = (x0, y0, x1, y1, wd) => beam([[x0, y0], [x1, y1]], wd || 0.25, T(night ? "#4a3a2a" : "#7a5638"));
  const sway = Math.sin(t * 1.2 + K.num(o.seed, 1)) * 0.04;`;
const treeBody = `
    case "coconut": { const p = new Path2D(); p.moveTo(0, 0); p.quadraticCurveTo(0.6 * R, -2.5 * R, 0.3 * R, -4.6 * R); c.lineWidth = 0.28 * R + w * 2; c.strokeStyle = ol; c.stroke(p); c.lineWidth = 0.28 * R; c.strokeStyle = T("#9a7a52"); c.stroke(p); for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.55 + sway; fl(S([[0.3, -4.6], [0.3 + Math.cos(a) * 1.0, -4.6 + Math.sin(a) * 1.0 - 0.2], [0.3 + Math.cos(a) * 1.9, -4.6 + Math.sin(a) * 1.9 + 0.5], [0.3 + Math.cos(a) * 1.0, -4.6 + Math.sin(a) * 1.0 + 0.05]]), green); } [-0.1, 0.25, 0.55].forEach((x) => ring(x + 0.05, -4.45, 0.16, T("#6a4a2a"))); break; }
    case "mangrove": for (let i = 0; i < 6; i++) { const x = -1.0 + i * 0.4; ln([[x, 0.1], [x * 0.3, -1.0]], 1.4, T("#6a5038")); } trunk(0, -0.9, 0, -2.2, 0.3); canopy([[-1.6, -1.9], [-1.4, -2.9], [-0.4, -3.4], [0.8, -3.3], [1.6, -2.6], [1.4, -1.9], [0, -1.7]]); break;
    case "cactus": fl(S([[-0.3, 0], [-0.32, -3.0], [0, -3.3], [0.32, -3.0], [0.3, 0]]), T("#5a8a4a")); fl(S([[-0.3, -1.4], [-0.9, -1.5], [-0.95, -2.4], [-0.75, -2.5], [-0.6, -1.8], [-0.3, -1.75]]), T("#5a8a4a")); fl(S([[0.3, -1.8], [0.85, -1.9], [0.9, -2.6], [0.7, -2.7], [0.6, -2.15], [0.3, -2.15]]), T("#5a8a4a")); for (let y = -0.4; y > -3.0; y -= 0.35) ln([[0, y], [0, y - 0.15]], 0.4); break;
    case "baobab": fl(S([[-0.9, 0], [-0.7, -1.5], [-0.55, -3.0], [0.55, -3.0], [0.7, -1.5], [0.9, 0]]), T("#9a8270")); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.45; beam([[Math.cos(a) * 0.4, -3.0], [Math.cos(a) * 1.4, -3.0 + Math.sin(a) * 0.9]], 0.12, T("#9a8270")); fl(E(Math.cos(a) * 1.4, -3.05 + Math.sin(a) * 0.9, 0.3, 0.18), green); } break;
    case "olive": trunk(0, 0, -0.2, -1.4, 0.3); trunk(-0.2, -1.4, 0.4, -2.0, 0.18); canopy([[-1.5, -1.6], [-1.3, -2.5], [-0.3, -2.9], [0.9, -2.8], [1.5, -2.1], [1.1, -1.5], [-0.2, -1.4]], T(night ? "#4e5a44" : "#8a9a6a")); break;
    case "maple": trunk(0, 0, 0, -1.8); canopy([[-1.6, -1.8], [-1.7, -2.8], [-0.9, -3.7], [0.3, -3.9], [1.4, -3.4], [1.8, -2.4], [1.2, -1.6], [0, -1.5]], T(o.autumn ? "#d0602a" : night ? "#4a6a3e" : "#6a9a4a")); break;
    case "fir": trunk(0, 0, 0, -0.6, 0.2); [[1.4, -0.5, -1.9], [1.1, -1.4, -2.9], [0.8, -2.3, -3.8], [0.5, -3.2, -4.6]].forEach(([hw, b, tp]) => { fl(P([[-hw, b], [0, tp], [hw, b]]), T(night ? "#2a4a3a" : "#2f5a42")); fl(P([[-hw * 0.9, b], [-hw * 0.5, b - 0.15], [0, b - 0.05], [hw * 0.5, b - 0.15], [hw * 0.9, b]]), o.snow ? white : T(night ? "#2a4a3a" : "#2f5a42"), { hatch: false }); }); break;
    case "sugarcane": for (let i = 0; i < 7; i++) { const x = -0.9 + i * 0.3; beam([[x, 0], [x + sway, -3.0]], 0.08, T("#9aaa5a")); for (let y = -0.4; y > -3.0; y -= 0.5) ln([[x - 0.06, y], [x + 0.06, y]], 0.5); ln([[x + sway, -3.0], [x - 0.6, -2.4]], 0.8, green); ln([[x + sway, -3.0], [x + 0.6, -2.5]], 0.8, green); } break;
    case "teaBush": fl(S([[-1.4, 0], [-1.5, -0.8], [-0.8, -1.25], [0.8, -1.25], [1.5, -0.8], [1.4, 0]]), T(night ? "#3a5a3a" : "#4e7e4a")); for (let i = 0; i < 12; i++) fl(E(-1.2 + (i % 6) * 0.48, -1.05 + Math.floor(i / 6) * 0.4, 0.12, 0.07), T("#7ab05a"), { hatch: false }); break;
    case "vine": [-1.0, 1.0].forEach((x) => beam([[x, 0], [x, -1.8]], 0.07)); ln([[-1.1, -1.6], [1.1, -1.6]], 0.6, rope); ln([[-1.0, -0.2], [-0.5, -1.0], [0, -1.55], [0.6, -1.0], [1.0, -1.5]], 1.2, T("#6a4a2a")); for (let i = 0; i < 8; i++) fl(E(-0.9 + i * 0.26, -1.4 + (i % 2) * 0.25, 0.16, 0.12), green); [-0.4, 0.5].forEach((x) => { for (let k = 0; k < 5; k++) ring(x + (k % 2) * 0.08, -1.1 + k * 0.08, 0.06, T("#6a3a7a")); }); break;
    case "acacia": trunk(0, 0, 0.2, -2.2, 0.22); trunk(0.2, -2.2, -0.8, -2.8, 0.12); trunk(0.2, -2.2, 1.0, -2.9, 0.12); fl(S([[-2.0, -2.8], [-1.6, -3.3], [0, -3.5], [1.7, -3.3], [2.1, -2.8], [0, -2.7]]), T(night ? "#4a5a3a" : "#7a9a4a")); break;
    case "lotusPlant": ln([[-1.4, 0.05], [1.4, 0.05]], 0.6, T("#6a8a9a")); [-0.8, 0.6].forEach((x) => fl(E(x, -0.05, 0.5, 0.12), green)); beam([[0.0, 0], [0.1, -1.2]], 0.04, green); [[-0.17, -1.3, -0.5], [0.17, -1.3, 0.5], [0, -1.38, 0]].forEach(([dx, y, r]) => fl(E(0.1 + dx, y, 0.1, 0.24, r), T("#e8a0b4"))); break;`;
const ground = [
  { id: "mushroom", names: ["mushrooms", "toadstool"], fit: "rigid" as const },
  { id: "fallenLeaves", names: ["leaves", "leafPile"], fit: "ground" as const },
  { id: "snowdrift", names: ["snowPile", "snowbank"], fit: "ground" as const },
  { id: "puddle", names: ["mudPuddle"], fit: "ground" as const },
  { id: "termiteMound", names: ["anthill"] },
  { id: "bushes", names: ["shrubs", "hedge", "undergrowth"], fit: "ground" as const },
];
const groundBody = `
    case "mushroom": [[-0.3, 0.8], [0.35, 0.6]].forEach(([x, s]) => { beam([[x, 0], [x, -0.6 * s]], 0.14 * s, white); fl(S([[x - 0.45 * s, -0.55 * s], [x - 0.35 * s, -0.95 * s], [x, -1.05 * s], [x + 0.35 * s, -0.95 * s], [x + 0.45 * s, -0.55 * s]]), red); [[-0.15, -0.8], [0.15, -0.85]].forEach(([dx, dy]) => ring(x + dx * s, dy * s, 0.06 * s, white)); }); break;
    case "fallenLeaves": for (let i = 0; i < 14; i++) fl(E(-1.4 + rnd(i) * 2.8, -0.06 - rnd(i + 20) * 0.1, 0.14, 0.06, rnd(i + 40) * 3), [T("#d0602a"), T("#e8a83a"), T("#9a5a2a")][i % 3], { hatch: false }); break;
    case "snowdrift": fl(S([[-1.8, 0], [-1.4, -0.35], [-0.5, -0.55], [0.4, -0.45], [1.2, -0.6], [1.8, 0]]), T("#eef2f6")); break;
    case "puddle": fl(E(0, -0.04, 1.2, 0.18), T(night ? "#4e6680" : "#8ab0c8"), { hatch: false }); ln([[-0.5, -0.06], [-0.1, -0.06]], 0.5, white); break;
    case "termiteMound": fl(S([[-0.8, 0], [-0.6, -1.0], [-0.3, -2.2], [0, -2.5], [0.3, -2.0], [0.5, -1.0], [0.8, 0]]), T("#b88a5a")); ln([[-0.2, -0.6], [-0.1, -1.5]], 0.4); ln([[0.25, -0.4], [0.2, -1.2]], 0.4); break;
    case "bushes": [[-1.0, 0.7], [0.0, 0.9], [1.0, 0.75]].forEach(([x, s]) => fl(S([[x - 0.75 * s, 0], [x - 0.8 * s, -0.6 * s], [x - 0.3 * s, -1.0 * s], [x + 0.35 * s, -0.95 * s], [x + 0.8 * s, -0.55 * s], [x + 0.75 * s, 0]]), green)); break;`;
const lands = [
  { id: "mountain", names: ["mountains", "peak"] },
  { id: "volcano" },
  { id: "waterfall", names: ["cascade", "falls"] },
  { id: "karst", names: ["limestoneRocks", "halongRocks", "karstPeaks"] },
  { id: "glacier", names: ["iceCliff", "iceberg"] },
  { id: "dunes", names: ["sandDunes", "desertDunes"] },
  { id: "caveMouth", names: ["caveEntrance"] },
  { id: "riceTerraces", names: ["terraces", "terracedFields", "riceTerrace"] },
  { id: "cliff", names: ["rockFace", "bluff"] },
  { id: "hillFort", names: ["moundFort", "tumulus"] },
  { id: "villageCluster", names: ["village", "hamlet", "distantVillage", "farVillage", "town", "smallTown", "settlement"] },
];
const landBody = `
    case "mountain": fl(P([[-3.0, 0], [-1.2, -3.2], [-0.6, -2.6], [0.4, -4.4], [3.0, 0]]), T(night ? "#5a5e6a" : "#8a8e9a")); fl(P([[-0.25, -3.8], [0.4, -4.4], [1.0, -3.6], [0.6, -3.7], [0.2, -3.4]]), white, { hatch: false }); fl(P([[-1.7, -2.4], [-1.2, -3.2], [-0.8, -2.6], [-1.2, -2.7]]), white, { hatch: false }); break;
    case "volcano": fl(P([[-3.0, 0], [-0.7, -3.4], [0.7, -3.4], [3.0, 0]]), T(night ? "#4a4038" : "#6e5e50")); fl(E(0, -3.4, 0.7, 0.12), T("#e2672b"), { hatch: false }); ln([[-0.3, -3.3], [-0.6, -2.2], [-0.4, -1.4]], 1.4, T("#e2672b")); glow(0, -3.4, 1.5); if (o.smoking) smoke(0, -4.6, 1.2); break;
    case "waterfall": fl(rect(-2.6, -4.0, -0.6, 0), T(night ? "#6a6458" : "#8a8070")); fl(rect(0.6, -4.0, 2.6, 0), T(night ? "#6a6458" : "#8a8070")); const wf = rect(-0.65, -4.0, 0.65, 0); fl(wf, T(night ? "#6a8aa8" : "#a8d0e8"), { hatch: false }); clip(wf, () => { for (let i = 0; i < 6; i++) { const x = -0.5 + i * 0.2, off = (t * 2 + i * 0.3) % 1; ln([[x, -4.0 + off * 1.0], [x, -2.0 + off * 1.0]], 0.4, white); } }); fl(E(0, 0, 1.4, 0.3), white, { hatch: false }); break;
    case "karst": [[-1.8, 0.9, 3.4], [0, 1.1, 4.4], [1.8, 0.8, 2.8]].forEach(([x, hw, h]) => { fl(S([[x - hw, 0], [x - hw * 0.9, -h * 0.6], [x - hw * 0.5, -h * 0.95], [x + hw * 0.1, -h], [x + hw * 0.7, -h * 0.75], [x + hw, 0]]), T(night ? "#5a6058" : "#8a9488")); fl(S([[x - hw * 0.5, -h * 0.95], [x + hw * 0.1, -h], [x + hw * 0.7, -h * 0.75], [x + hw * 0.2, -h * 0.82]]), green, { hatch: false }); }); ln([[-3, 0.05], [3, 0.05]], 0.6, T("#5a7a8a")); break;
    case "glacier": fl(P([[-3.0, 0], [-2.6, -2.4], [-1.4, -2.9], [0.2, -2.6], [1.6, -3.1], [3.0, -2.2], [3.0, 0]]), T("#d8eaf4")); for (let i = 0; i < 6; i++) ln([[-2.4 + i * 0.9, -2.5], [-2.3 + i * 0.9, -0.2]], 0.5, T("#9ac0d8")); break;
    case "dunes": fl(S([[-3.0, 0], [-2.0, -0.9], [-0.8, -0.6], [0.4, -1.4], [1.8, -0.7], [3.0, 0]]), T(night ? "#a8946a" : "#e2c88a")); ln([[0.4, -1.4], [1.0, -0.4]], 0.5, T("#c8a868")); break;
    case "caveMouth": fl(S([[-2.6, 0], [-2.4, -2.2], [-1.0, -3.0], [1.2, -2.9], [2.6, -2.0], [2.6, 0]]), T(night ? "#6a645c" : "#9a9288")); fl(S([[-1.2, 0], [-1.1, -1.4], [0, -2.0], [1.1, -1.4], [1.2, 0]]), black, { hatch: false }); break;
    case "riceTerraces": for (let i = 0; i < 5; i++) { const y = -i * 0.6; fl(S([[-3.0 + i * 0.4, y], [-2.8 + i * 0.4, y - 0.6], [2.8 - i * 0.4, y - 0.6], [3.0 - i * 0.4, y]]), i % 2 ? T("#7aa05a") : T("#8ab06a")); ln([[-2.8 + i * 0.4, y - 0.6], [2.8 - i * 0.4, y - 0.6]], 0.6, T("#6a8a9a")); } break;
    case "cliff": fl(P([[-2.4, 0], [-2.2, -4.0], [0.6, -4.2], [1.0, -2.6], [1.4, -1.0], [2.4, 0]]), T(night ? "#6a645c" : "#9a9288")); for (let i = 0; i < 5; i++) ln([[-1.8 + i * 0.6, -3.8], [-1.6 + i * 0.6, -0.4]], 0.4); fl(rect(-2.3, -4.2, 0.7, -3.95), green, { hatch: false }); break;
    case "villageCluster": { const wall = T(night ? "#9a8e7a" : "#d8ccb0"), roof = T(o.color || (night ? "#5a3a2e" : "#9a4a34")), thatch = T(night ? "#7a6a46" : "#b89a5a"), yr = K.num(window.__motionView && window.__motionView.year, 1500), tower = yr >= 600;
      const houses = [[-2.6, 0.55, 0.55, 1], [-1.9, 0.7, 0.75, 0], [-1.0, 0.6, 0.6, 1], [0.95, 0.65, 0.7, 0], [1.75, 0.55, 0.6, 1], [2.5, 0.6, 0.65, 0], [-0.4, 0.5, 0.5, 0], [0.5, 0.45, 0.5, 1]];
      if (tower) { fl(rect(-0.2, -2.3, 0.25, -0.2), wall); fl(P([[-0.3, -2.3], [0.03, -3.1], [0.35, -2.3]]), roof); fl(rect(-0.07, -1.95, 0.12, -1.65), T("#3a3028"), { hatch: false }); }
      houses.forEach(([x, hw, h, k], i) => { const y = -0.05 * (i % 3); fl(rect(x - hw, y - h, x + hw, y), wall); fl(P([[x - hw - 0.12, y - h], [x, y - h - hw * 0.9], [x + hw + 0.12, y - h]]), k || yr < 1300 ? thatch : roof); fl(rect(x - 0.1, y - h * 0.55, x + 0.1, y), T("#4a3a2c"), { hatch: false }); });
      for (let i = 0; i < 5; i++) fl(E(-2.8 + i * 1.4, 0.05, 0.6, 0.18), green); if (o.smoking !== false) smoke(-1.9, -1.6, 0.35); break; }
    case "hillFort": fl(S([[-3.0, 0], [-1.8, -1.6], [1.8, -1.6], [3.0, 0]]), green); for (let i = 0; i < 12; i++) { const x = -1.7 + i * 0.31; beam([[x, -1.55], [x, -2.2]], 0.07); } break;`;
export const MOTION_LIBRARY_TREES: MotionLibraryPart = { part: "lib_trees", fn: "tree", items: trees, js: motionLibraryPart(trees, treeBody, 1.0, leaf) };
export const MOTION_LIBRARY_GROUND: MotionLibraryPart = { part: "lib_ground", fn: "prop", items: ground, js: motionLibraryPart(ground, groundBody, 0) };
export const MOTION_LIBRARY_LANDS: MotionLibraryPart = { part: "lib_lands", fn: "building", items: lands, js: motionLibraryPart(lands, landBody, 0) };
