import { motionLibraryPart, type MotionLibraryPart } from "./common.js";
const items = [
  { id: "siegeTower", from: -400, to: 1500, names: ["belfry", "assaultTower"] },
  { id: "ballista", from: -400, to: 1400, names: ["scorpio", "boltThrower"] },
  { id: "siegeLadder", to: 1700, names: ["scalingLadder"] },
  { id: "mantlet", from: -400, to: 1600, names: ["pavise", "siegeShield"] },
  { id: "bombard", from: 1380, to: 1550, names: ["greatBombard"] },
  { id: "siegeMortar", from: 1450, to: 1900, names: ["heavyMortar", "mortarGun"] },
  { id: "fieldGun", from: 1700, to: 1900, names: ["napoleonGun", "twelvePounder"] },
  { id: "antiTankGun", from: 1936, to: 1975, names: ["atGun", "pak40"] },
  { id: "antiAircraftGun", from: 1915, names: ["aaGun", "flak"] },
  { id: "rocketArtillery", from: 1941, names: ["katyusha", "rocketLauncherTruck", "mlrs"] },
  { id: "supplyCart", to: 1920, names: ["baggageCart"] },
  { id: "turtleShip", from: 1590, to: 1600, names: ["geobukseon"] },
  { id: "shipOfTheLine", from: 1650, to: 1850, names: ["manOfWar", "threeDecker"] },
  { id: "ironclad", from: 1859, to: 1900, names: ["monitor"] },
  { id: "gunboat", from: 1840, to: 1950, names: ["steamGunboat", "riverGunboat"] },
  { id: "landingCraft", from: 1940, names: ["higginsBoat", "lcvp"] },
  { id: "patrolBoat", from: 1940, names: ["pbr", "torpedoBoat", "ptBoat"] },
  { id: "carrier", from: 1920, names: ["aircraftCarrier"] },
  { id: "transportPlane", from: 1935, names: ["cargoPlane", "dakota", "c47"] },
  { id: "attackHelicopter", from: 1965, names: ["gunship", "apache", "huey"] },
  { id: "drone", from: 2000, names: ["uav", "quadcopter"] },
];
const helpers = `const water = (hw) => { for (let i = 0; i < 4; i++) { const x = -hw + 0.3 + i * (2 * hw - 0.6) / 3 + Math.sin(t + i) * 0.1; ln([[x, 0.15], [x + 0.35, 0.12], [x + 0.6, 0.15]], 0.45, T("#5a7a8a")); } };
  const hull = (pts, col) => { const p = S(pts); fl(p, col || wood); clip(p, () => { for (let y = -3; y < 1; y += 0.22) ln([[-6, y], [6, y - 0.02]], 0.35); }); return p; };
  const carriage = (x, r) => { fl(P([[x - 1.6, -0.25], [x - 1.6, -0.45], [x + 0.6, -r * 1.25], [x + 0.6, -r * 0.8]]), wood); woodWheel(x, r); };
  const prop = (x, y, s) => { const a = t * 30; ln([[x, y - s * Math.cos(a)], [x, y + s * Math.cos(a)]], 0.9, T("#5a5a5a")); };
  const sail = (x, top, bot, wd, col) => { const p = S([[x - wd / 2, top], [x + wd / 2, top], [x + wd / 2 + 0.06, (top + bot) / 2], [x + wd / 2, bot], [x - wd / 2, bot], [x - wd / 2 + 0.06, (top + bot) / 2]]); fl(p, col || cloth, { hatch: false }); };`;
const body = `
    case "siegeTower": { const p = P([[-1.3, -0.4], [-1.0, -6.0], [1.0, -6.0], [1.3, -0.4]]); fl(p, wood); clip(p, () => { for (let y = -5.8; y < 0; y += 0.45) ln([[-1.4, y], [1.4, y]], 0.4); }); fl(P([[-1.0, -6.0], [1.0, -6.0], [1.1, -6.4], [-1.1, -6.4]]), leather); fl(rect(0.4, -5.6, 1.0, -4.6), black, { hatch: false }); [-0.8, 0.8].forEach((x) => woodWheel(x, 0.45)); break; }
    case "ballista": beam([[-1.4, -0.9], [1.0, -1.1]], 0.16); beam([[-0.2, -1.0], [-0.4, 0]], 0.1); beam([[-0.2, -1.0], [0.4, 0]], 0.1); { const p = new Path2D(); p.moveTo(0.7 * R, -2.0 * R); p.quadraticCurveTo(0.2 * R, -1.1 * R, 0.7 * R, -0.2 * R); c.lineWidth = 0.12 * R + w * 2; c.strokeStyle = ol; c.stroke(p); c.lineWidth = 0.12 * R; c.strokeStyle = wood; c.stroke(p); } ln([[0.7, -2.0], [-1.1, -1.0], [0.7, -0.2]], 0.5, white); beam([[-1.1, -1.0], [1.5, -1.12]], 0.05, iron); break;
    case "siegeLadder": [-0.45, 0.45].forEach((x) => beam([[x, 0], [x * 0.7, -5.0]], 0.1)); for (let y = -0.4; y > -5.0; y -= 0.45) beam([[-0.45 * (1 + y / 16.7), y], [0.45 * (1 + y / 16.7), y]], 0.07); break;
    case "mantlet": { const p = P([[-0.9, 0], [-0.9, -2.0], [0.9, -2.2], [0.9, 0]]); fl(p, wood); clip(p, () => { for (let x = -0.9; x < 0.9; x += 0.3) ln([[x, -2.3], [x, 0]], 0.4); }); fl(rect(-0.2, -1.5, 0.2, -1.35), black, { hatch: false }); beam([[0.5, -1.6], [1.4, 0]], 0.08); break; }
    case "bombard": fl(S([[-1.8, -0.25], [-1.8, -0.95], [1.9, -1.1], [1.95, -0.2], [-1.0, -0.15]]), T("#6a6050")); for (let x = -1.4; x < 1.9; x += 0.45) ln([[x, -1.0], [x, -0.18]], 0.8); ring(1.95, -0.65, 0.4, black); fl(rect(-2.0, -0.2, 2.0, 0), wood); break;
    case "siegeMortar": fl(rect(-1.1, -0.5, 1.1, 0), wood); fl(S([[-0.7, -0.45], [-0.5, -1.4], [0.4, -1.75], [0.85, -1.3], [0.55, -0.45]]), iron); ring(0.62, -1.55, 0.3, black); break;
    case "fieldGun": carriage(0, 0.85); beam([[-0.3, -1.05], [1.9, -1.25]], 0.24, T("#7a6a4a")); ring(1.95, -1.25, 0.1, black); break;
    case "antiTankGun": [-1.6, 1.0].forEach((x, i) => beam([[x, 0], [-0.2, -0.65]], 0.1, olive)); wheel(-0.2, 0.55, 0, olive); fl(P([[-0.7, -0.6], [0.4, -0.6], [0.5, -1.4], [-0.6, -1.4]]), olive); beam([[0.1, -1.0], [2.6, -1.05]], 0.1, olive); fl(rect(2.5, -1.15, 2.75, -0.95), iron); break;
    case "antiAircraftGun": fl(P([[-1.2, 0], [1.2, 0], [0.8, -0.4], [-0.8, -0.4]]), olive); [-1.4, 1.4].forEach((x) => beam([[0, -0.2], [x, 0.05]], 0.08, olive)); fl(rect(-0.5, -0.9, 0.5, -0.4), olive); beam([[0.0, -0.75], [1.4, -2.6]], 0.11, iron); beam([[0.25, -0.65], [1.65, -2.5]], 0.11, iron); break;
    case "rocketArtillery": fl(rect(-2.4, -0.95, 0.9, -0.65), olive); fl(S([[0.9, -0.65], [0.9, -1.9], [1.5, -1.95], [1.75, -1.3], [2.3, -1.2], [2.35, -0.65]]), olive); fl(P([[1.05, -1.75], [1.45, -1.78], [1.58, -1.3], [1.05, -1.3]]), glass); c.save(); c.translate(-0.8 * R, -1.0 * R); c.rotate(-0.3); for (let i = 0; i < 4; i++) beam([[-1.3, -0.15 * i], [1.0, -0.15 * i]], 0.09, iron); c.restore(); wheel(-1.9, 0.5); wheel(-0.8, 0.5); wheel(1.7, 0.5); break;
    case "supplyCart": fl(rect(-1.6, -1.3, 0.9, -0.95), wood); fl(S([[-1.5, -1.3], [-1.3, -1.95], [-0.4, -2.0], [0.4, -1.95], [0.8, -1.3]]), cloth); [[-1.0, 1], [0.0, 2], [-0.5, 3]].forEach(([x, i]) => fl(E(x, -1.6, 0.35, 0.25), T("#c9b48a"))); beam([[0.9, -1.1], [2.4, -1.5]], 0.07); woodWheel(-0.35, 0.85); break;
    case "turtleShip": water(3.0); hull([[-2.9, -0.9], [-2.6, 0.0], [2.4, 0.15], [2.9, -0.7]]); { const p = S([[-2.6, -0.95], [-2.0, -2.0], [2.0, -2.05], [2.7, -0.85]]); fl(p, T("#5a5a52")); clip(p, () => { for (let x = -2.6; x < 2.8; x += 0.3) for (let y = -2.0; y < -0.9; y += 0.3) fl(P([[x, y], [x + 0.08, y - 0.14], [x + 0.16, y]]), iron); }); } fl(S([[2.6, -1.5], [3.1, -1.6], [3.2, -1.25], [2.75, -1.0]]), red); for (let i = 0; i < 6; i++) ln([[-2.0 + i * 0.75, -0.45], [-2.2 + i * 0.75, 0.25]], 0.8, wood); break;
    case "shipOfTheLine": water(3.2); hull([[-3.0, -2.2], [-2.6, 0.0], [2.2, 0.2], [3.0, -1.6]]); for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) fl(rect(-2.3 + i * 0.52, -1.85 + row * 0.55, -2.15 + i * 0.52, -1.7 + row * 0.55), black, { hatch: false }); [-1.6, 0.0, 1.6].forEach((x, i) => { const h = i === 1 ? 7.4 : 6.6; beam([[x, -2.0], [x, -h]], 0.11, dark); [[h - 0.6, h - 2.0], [h - 2.2, h - 3.6], [h - 3.8, h - 5.1]].forEach(([a, b]) => sail(x, -a, -b, 1.5 - (i === 1 ? 0 : 0.15))); }); beam([[3.0, -1.7], [4.0, -2.6]], 0.08, dark); break;
    case "ironclad": water(3.0); hull([[-2.9, -0.6], [-2.6, 0.1], [2.6, 0.1], [3.0, -0.5]], T("#4a4a4e")); fl(P([[-1.6, -0.6], [-1.2, -1.5], [1.4, -1.5], [1.8, -0.6]]), T("#5a5a60")); fl(rect(-0.2, -2.6, 0.25, -1.5), black); ring(0.0, -2.8, 0.18, T("#9a9aa0")); fl(rect(1.0, -1.1, 1.2, -0.9), black, { hatch: false }); fl(rect(-1.3, -1.1, -1.1, -0.9), black, { hatch: false }); break;
    case "gunboat": water(2.8); hull([[-2.6, -0.8], [-2.3, 0.1], [2.3, 0.1], [2.7, -0.75]], T("#d8d4c8")); fl(rect(-1.0, -1.6, 0.8, -0.8), white); fl(rect(-0.3, -2.8, 0.15, -1.6), black); beam([[1.2, -1.0], [2.2, -1.15]], 0.12, iron); fl(rect(0.9, -1.25, 1.3, -0.8), T("#8a8a90")); break;
    case "landingCraft": water(2.4); fl(P([[-2.2, -1.2], [1.8, -1.2], [2.2, 0.1], [-2.0, 0.1]]), T("#5a6a5a")); fl(P([[1.8, -1.2], [2.3, -1.25], [2.4, 0.05], [2.2, 0.1]]), T("#4a5a4a")); fl(rect(-2.0, -1.8, -1.3, -1.2), T("#4a5a4a")); break;
    case "patrolBoat": water(2.6); hull([[-2.5, -0.7], [-2.4, 0.05], [1.8, 0.05], [2.7, -0.75]], T("#6a7a6a")); fl(rect(-0.6, -1.5, 0.6, -0.7), T("#5a6a5a")); fl(rect(-0.4, -1.4, 0.4, -1.1), glass, { hatch: false }); beam([[1.0, -0.95], [1.8, -1.05]], 0.06, iron); beam([[-1.6, -0.95], [-2.3, -1.1]], 0.06, iron); break;
    case "carrier": water(3.4); hull([[-3.3, -1.1], [-3.0, 0.1], [2.9, 0.1], [3.4, -1.0]], T("#6a6e74")); fl(rect(-3.5, -1.3, 3.6, -1.1), T("#4a4e54")); fl(rect(1.2, -2.6, 2.0, -1.3), T("#6a6e74")); beam([[1.6, -2.6], [1.6, -3.3]], 0.04, iron); ln([[-3.2, -1.2], [1.0, -1.2]], 0.5, white); break;
    case "transportPlane": fl(S([[-2.8, -1.25], [-2.2, -1.45], [2.0, -1.4], [2.7, -1.15], [2.0, -0.85], [-2.2, -0.95]]), T("#8a9478")); fl(P([[-2.4, -1.35], [-2.9, -2.2], [-2.5, -2.2], [-1.9, -1.4]]), T("#7a8468")); fl(P([[-0.3, -1.15], [0.6, -1.15], [0.2, 0.0], [-0.4, 0.0]]), T("#7a8468")); [0.6, -0.6].forEach((x) => { fl(E(x, -1.15, 0.25, 0.14), T("#5a6450")); prop(x + 0.28, -1.15, 0.5); }); for (let i = 0; i < 6; i++) ring(-1.6 + i * 0.5, -1.2, 0.07, glass); break;
    case "attackHelicopter": { fl(S([[-0.9, -0.9], [-0.6, -1.4], [0.9, -1.4], [1.5, -1.05], [1.0, -0.75], [-0.6, -0.75]]), olive); fl(P([[0.6, -1.38], [1.2, -1.2], [0.9, -1.0], [0.5, -1.0]]), glass); beam([[-0.9, -1.1], [-2.7, -1.3]], 0.14, olive); fl(P([[-2.6, -1.3], [-2.9, -1.9], [-2.7, -1.9], [-2.4, -1.35]]), olive); beam([[-0.5, -0.75], [-0.5, -0.4]], 0.04, iron); beam([[0.6, -0.75], [0.6, -0.4]], 0.04, iron); beam([[-0.9, -0.4], [1.0, -0.4]], 0.05, iron); fl(rect(-0.3, -0.95, 0.5, -0.8), iron); const a = Math.cos(t * 40) * 2.4; ln([[0.1 - a, -1.6], [0.1 + a, -1.6]], 0.9); beam([[0.1, -1.4], [0.1, -1.6]], 0.05, iron); break; }
    case "drone": fl(rect(-0.35, -0.6, 0.35, -0.38), T("#3a3a40")); [-0.8, 0.8].forEach((x) => { beam([[0, -0.5], [x, -0.65]], 0.05, T("#3a3a40")); const a = Math.cos(t * 50) * 0.35; ln([[x - a, -0.72], [x + a, -0.72]], 0.8); }); ring(0, -0.3, 0.1, black); beam([[-0.3, -0.38], [-0.35, -0.1]], 0.03, T("#3a3a40")); beam([[0.3, -0.38], [0.35, -0.1]], 0.03, T("#3a3a40")); break;`;
export const MOTION_LIBRARY_SIEGE: MotionLibraryPart = { part: "lib_siege", fn: "vehicle", items, js: motionLibraryPart(items, body, 1.8, helpers) };
