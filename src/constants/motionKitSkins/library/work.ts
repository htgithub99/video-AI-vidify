import { motionLibraryPart, type MotionLibraryPart } from "./common.js";
const items = [
  { id: "harrow", names: ["rake"] },
  { id: "yoke", names: ["oxYoke"] },
  { id: "threshingFlail", names: ["thresher"] },
  { id: "winnowingBasket", names: ["winnower", "nia"], fit: "rigid" as const },
  { id: "waterWheel", from: -300, names: ["noria", "waterMill"] },
  { id: "shadoof", from: -2000, names: ["wellSweep"] },
  { id: "millstone", names: ["quern", "grindstone"], fit: "rigid" as const },
  { id: "granaryJar", names: ["storageJar", "grainJar"], fit: "rigid" as const },
  { id: "chickenCoop", names: ["henhouse", "coop"] },
  { id: "pigsty", names: ["pigpen", "sty"] },
  { id: "animalPen", names: ["corral", "sheepfold", "paddock"] },
  { id: "ricePlants", names: ["riceSeedlings", "paddyRice"] },
  { id: "wheatSheaf", names: ["sheaf", "grainSheaf", "wheat"] },
  { id: "cornStalks", from: 1500, names: ["maize", "corn"] },
  { id: "purse", names: ["moneyBag", "pouch", "coinPurse"], fit: "rigid" as const },
  { id: "counter", names: ["shopCounter", "serviceCounter"] },
  { id: "shopSign", names: ["hangingSign", "tavernSign"] },
  { id: "goodsBales", names: ["bales", "cargo", "bundles"] },
  { id: "spiceSacks", names: ["spices", "grainSacks"] },
  { id: "clothRolls", names: ["fabric", "silk", "textiles"] },
  { id: "potteryStack", names: ["pots", "pottery", "ceramics"] },
  { id: "abacus", from: -500 },
  { id: "ledger", from: 1300, names: ["accountBook"] },
  { id: "paperMoney", from: 1000, names: ["banknotes", "cash"] },
  { id: "cashRegister", from: 1880, names: ["till"] },
  { id: "handcart", names: ["pushcart", "barrow"] },
  { id: "forge", names: ["smithy", "blacksmithForge"] },
  { id: "bellows", names: ["forgeBellows"] },
  { id: "spinningWheel", from: 1000, to: 1950 },
  { id: "potteryWheel", from: -3000, names: ["pottersWheel"] },
  { id: "kiln", names: ["potteryKiln", "brickKiln"] },
  { id: "carpenterBench", names: ["workbench", "carpentryBench"] },
  { id: "chisel" },
  { id: "woodPlane", names: ["handPlane"] },
  { id: "printingPress", from: 1440, to: 1950, names: ["gutenbergPress"] },
  { id: "inkStone", from: -200, names: ["inkSlab"] },
  { id: "dyeVat", names: ["dyeTub"] },
  { id: "tanningRack", names: ["hideRack", "dryingRack"] },
  { id: "shipHull", names: ["boatUnderConstruction"] },
  { id: "steamEngine", from: 1770, to: 1950, names: ["beamEngine"] },
];
const helpers = `const sack = (x, y, s, col) => { fl(S([[x - 0.35 * s, y], [x - 0.4 * s, y - 0.55 * s], [x - 0.22 * s, y - 0.8 * s], [x + 0.22 * s, y - 0.8 * s], [x + 0.4 * s, y - 0.55 * s], [x + 0.35 * s, y]]), col || T("#c9b48a")); ln([[x - 0.15 * s, y - 0.75 * s], [x + 0.15 * s, y - 0.75 * s]], 0.8, rope); };
  const pot = (x, y, s, col) => fl(S([[x - 0.25 * s, y], [x - 0.45 * s, y - 0.4 * s], [x - 0.3 * s, y - 0.8 * s], [x + 0.3 * s, y - 0.8 * s], [x + 0.45 * s, y - 0.4 * s], [x + 0.25 * s, y]]), col || T(night ? "#7a4a3a" : "#b8643e"));
  const fenceRow = (x0, x1, h) => { for (let x = x0; x <= x1 + 0.01; x += 0.5) beam([[x, 0], [x, -h]], 0.07); beam([[x0, -h * 0.4], [x1, -h * 0.4]], 0.06); beam([[x0, -h * 0.85], [x1, -h * 0.85]], 0.06); };`;
const body = `
    case "harrow": fl(P([[-1.2, -0.5], [1.2, -0.5], [1.2, -0.3], [-1.2, -0.3]]), wood); for (let i = 0; i < 8; i++) fl(P([[-1.1 + i * 0.31, -0.3], [-1.05 + i * 0.31, 0], [-1.0 + i * 0.31, -0.3]]), iron); beam([[1.2, -0.4], [2.2, -0.8]], 0.06); break;
    case "yoke": { const p = new Path2D(); p.moveTo(-1.4 * R, -0.9 * R); p.quadraticCurveTo(0, -1.25 * R, 1.4 * R, -0.9 * R); c.lineWidth = 0.18 * R + w * 2; c.strokeStyle = ol; c.stroke(p); c.lineWidth = 0.18 * R; c.strokeStyle = wood; c.stroke(p); } [-0.9, -0.5, 0.5, 0.9].forEach((x) => beam([[x, -0.95], [x, -0.4]], 0.05)); break;
    case "threshingFlail": beam([[-1.6, -0.1], [0.4, -0.12]], 0.07); ln([[0.4, -0.12], [0.6, -0.12]], 0.8, rope); beam([[0.6, -0.12], [1.5, -0.1]], 0.1); break;
    case "winnowingBasket": fl(E(0, -0.12, 1.1, 0.16), straw); fl(E(0, -0.16, 0.9, 0.1), K.shade(straw, 0.9), { hatch: false }); for (let i = 0; i < 6; i++) ln([[-0.9 + i * 0.36, -0.2], [-0.8 + i * 0.36, -0.04]], 0.35); break;
    case "waterWheel": ring(0, -1.6, 1.5, wood); ring(0, -1.6, 1.15, K.shade(wood, 1.12)); for (let i = 0; i < 12; i++) { const a = spin * 0.3 + i * Math.PI / 6; ln([[0, -1.6], [Math.cos(a) * 1.15, -1.6 + Math.sin(a) * 1.15]], 0.6, dark); fl(rect(Math.cos(a) * 1.45 - 0.08, -1.6 + Math.sin(a) * 1.45 - 0.08, Math.cos(a) * 1.45 + 0.08, -1.6 + Math.sin(a) * 1.45 + 0.08), dark); } ring(0, -1.6, 0.2, dark); beam([[-1.7, 0], [-0.2, -1.6]], 0.1); beam([[1.7, 0], [0.2, -1.6]], 0.1); break;
    case "shadoof": beam([[-0.2, 0], [-0.2, -2.0]], 0.1); beam([[-1.8, -1.2], [1.8, -2.6]], 0.07); fl(E(-1.85, -1.15, 0.25, 0.25), stone); ln([[1.8, -2.6], [1.8, -0.6]], 0.6, rope); pot(1.8, -0.2, 0.7, wood); break;
    case "millstone": fl(E(0, -0.25, 1.0, 0.25), stone); fl(rect(-1.0, -0.25, 1.0, 0), stone); fl(E(0, -0.6, 0.9, 0.22), K.shade(stone, 1.05)); fl(rect(-0.9, -0.6, 0.9, -0.3), K.shade(stone, 1.05)); ring(0, -0.6, 0.12, dark); beam([[0.6, -0.6], [0.6, -1.0]], 0.08); break;
    case "granaryJar": pot(0, 0, 2.2, T(night ? "#6a4a3a" : "#9a6a4a")); fl(E(0, -1.78, 0.6, 0.12), K.shade(T("#9a6a4a"), 0.8)); fl(S([[-0.65, -1.8], [0, -2.2], [0.65, -1.8]]), straw); break;
    case "chickenCoop": fl(rect(-1.0, -1.4, 1.0, -0.3), wood); clip(rect(-1.0, -1.4, 1.0, -0.3), () => { for (let x = -1.0; x < 1.0; x += 0.25) ln([[x, -1.4], [x, -0.3]], 0.35); }); fl(P([[-1.2, -1.4], [0, -2.0], [1.2, -1.4]]), straw); [-0.85, 0.85].forEach((x) => beam([[x, -0.3], [x, 0]], 0.07)); fl(rect(-0.2, -0.9, 0.2, -0.5), black, { hatch: false }); beam([[0.2, -0.5], [0.7, 0]], 0.05); break;
    case "pigsty": fenceRow(-1.8, 1.8, 0.9); fl(rect(-1.5, -1.6, -0.2, -0.0), wood); fl(P([[-1.7, -1.5], [-0.85, -2.1], [0.0, -1.5]]), straw); break;
    case "animalPen": fenceRow(-2.0, 2.0, 1.1); break;
    case "ricePlants": for (let i = 0; i < 9; i++) { const x = -1.6 + i * 0.4; for (let k = -1; k <= 1; k++) ln([[x, 0], [x + k * 0.15, -0.6 - rnd(i) * 0.2]], 0.8, green); } ln([[-1.8, 0.02], [1.8, 0.02]], 0.6, T("#6a8a9a")); break;
    case "wheatSheaf": for (let i = 0; i < 9; i++) { const x = -0.35 + i * 0.09; ln([[x * 0.4, 0], [x, -1.5]], 0.6, straw); fl(E(x * 1.3, -1.55, 0.06, 0.16, x), straw); } ln([[-0.3, -0.7], [0.3, -0.7]], 1.2, rope); break;
    case "cornStalks": for (let i = 0; i < 4; i++) { const x = -0.9 + i * 0.6; beam([[x, 0], [x, -2.2]], 0.06, green); [[-0.4, -1.2], [0.4, -1.6], [-0.35, -1.9]].forEach(([dx, y]) => ln([[x, y + 0.3], [x + dx, y]], 0.9, green)); fl(E(x + 0.12, -1.3, 0.08, 0.22), T("#e8c43a")); } break;
    case "purse": fl(S([[-0.4, 0], [-0.5, -0.45], [-0.25, -0.7], [0.25, -0.7], [0.5, -0.45], [0.4, 0]]), leather); ln([[-0.25, -0.68], [0, -0.6], [0.25, -0.68]], 0.8, rope); ln([[0, -0.6], [0.1, -0.9]], 0.6, rope); break;
    case "counter": fl(rect(-1.6, -1.2, 1.6, 0), wood); fl(rect(-1.75, -1.35, 1.75, -1.2), dark); clip(rect(-1.6, -1.2, 1.6, 0), () => { for (let x = -1.2; x < 1.6; x += 0.8) ln([[x, -1.2], [x, 0]], 0.5); }); break;
    case "shopSign": beam([[-0.9, -2.4], [0.9, -2.4]], 0.07, iron); beam([[-0.9, -2.4], [-0.9, -2.7]], 0.06, iron); ln([[-0.5, -2.4], [-0.5, -2.0]], 0.5, iron); ln([[0.5, -2.4], [0.5, -2.0]], 0.5, iron); fl(rect(-0.7, -2.0, 0.7, -1.2), wood); fl(rect(-0.55, -1.85, 0.55, -1.35), gold, { hatch: false }); break;
    case "goodsBales": [[-0.7, 0, 1.2], [0.6, 0, 1.0], [0.0, -0.95, 1.0]].forEach(([x, y, s]) => { fl(S([[x - 0.6 * s, y], [x - 0.6 * s, y - 0.9 * s], [x + 0.6 * s, y - 0.9 * s], [x + 0.6 * s, y]]), T("#c8b088")); ln([[x - 0.2 * s, y], [x - 0.2 * s, y - 0.9 * s]], 0.8, rope); ln([[x + 0.2 * s, y], [x + 0.2 * s, y - 0.9 * s]], 0.8, rope); }); break;
    case "spiceSacks": [[-0.8, T("#c8641e")], [0, T("#e8b43a")], [0.8, T("#8a3a1e")]].forEach(([x, col]) => { sack(x, 0, 1.0, T("#c9b48a")); fl(E(x, -0.78, 0.3, 0.1), col, { hatch: false }); fl(S([[x - 0.25, -0.8], [x, -1.0], [x + 0.25, -0.8]]), col, { hatch: false }); }); break;
    case "clothRolls": [[-0.6, red], [0, blue], [0.6, gold], [-0.3, green], [0.3, T("#8a4a8a")]].forEach(([x, col], i) => { const y = i < 3 ? -0.3 : -0.85; fl(rect(x - 0.3, y - 0.27, x + 0.3, y + 0.27), col); fl(E(x + 0.3, y, 0.08, 0.27), K.shade(col, 0.85)); }); break;
    case "potteryStack": [[-0.8, 0, 1.0], [0.0, 0, 1.2], [0.8, 0, 0.9], [-0.4, -0.95, 0.8], [0.4, -1.05, 0.8]].forEach(([x, y, s]) => pot(x, y, s)); break;
    case "abacus": fl(rect(-1.0, -1.2, 1.0, 0), wood); fl(rect(-0.85, -1.05, 0.85, -0.15), paper, { hatch: false }); ln([[-0.85, -0.75], [0.85, -0.75]], 0.6); for (let i = 0; i < 7; i++) { const x = -0.7 + i * 0.23; ln([[x, -1.05], [x, -0.15]], 0.4); [-0.95, -0.4, -0.27].forEach((y) => fl(E(x, y, 0.1, 0.06), red)); } break;
    case "ledger": fl(P([[-0.8, -0.1], [0, -0.25], [0.8, -0.1], [0.8, 0], [0, -0.12], [-0.8, 0]]), leather); fl(P([[-0.75, -0.12], [0, -0.28], [0, -0.2], [-0.75, -0.06]]), paper, { hatch: false }); fl(P([[0, -0.28], [0.75, -0.12], [0.75, -0.06], [0, -0.2]]), paper, { hatch: false }); break;
    case "paperMoney": for (let i = 0; i < 3; i++) { fl(rect(-0.7 + i * 0.08, -0.4 - i * 0.06, 0.7 + i * 0.08, -0.06 - i * 0.06), T("#8ab07a")); ring(i * 0.08, -0.23 - i * 0.06, 0.1, T("#6a905a")); } break;
    case "cashRegister": fl(P([[-0.8, 0], [0.8, 0], [0.7, -0.9], [-0.7, -0.9]]), gold); fl(rect(-0.5, -1.4, 0.5, -0.9), gold); fl(rect(-0.4, -1.3, 0.4, -1.05), white, { hatch: false }); for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) ring(-0.5 + i * 0.25, -0.65 + r * 0.25, 0.07, white); beam([[0.8, -0.5], [1.1, -0.7]], 0.05, black); break;
    case "handcart": fl(rect(-1.2, -1.1, 0.6, -0.7), wood); [-1.0, -0.5, 0.0, 0.5].forEach((x) => beam([[x, -1.1], [x, -1.4]], 0.05)); woodWheel(-0.3, 0.65); beam([[0.6, -0.95], [1.9, -1.4]], 0.06); beam([[-1.2, -0.75], [-1.2, 0]], 0.06); break;
    case "forge": fl(rect(-1.2, -1.0, 1.2, 0), stone); clip(rect(-1.2, -1.0, 1.2, 0), () => { for (let y = -0.25; y > -1.0; y -= 0.25) ln([[-1.2, y], [1.2, y]], 0.3); }); glow(0, -1.2, 1.4); flame(0, -1.0, 0.6); fl(P([[-0.9, -1.1], [0.9, -1.1], [0.5, -2.2], [-0.5, -2.2]]), K.shade(stone, 0.85)); fl(rect(-0.3, -3.6, 0.3, -2.2), brick); if (o.smoking) smoke(0, -4.2, 0.6); break;
    case "bellows": fl(S([[-1.0, -0.35], [0.4, -0.55], [0.7, -0.35], [0.4, -0.15], [-1.0, -0.25]]), leather); beam([[-1.0, -0.6], [0.5, -0.6]], 0.06); beam([[-1.0, -0.05], [0.5, -0.05]], 0.06); beam([[0.65, -0.35], [1.2, -0.35]], 0.06, iron); break;
    case "spinningWheel": beam([[-1.0, 0], [-0.6, -0.8]], 0.06); beam([[0.6, 0], [0.4, -0.8]], 0.06); fl(rect(-1.1, -0.85, 0.8, -0.7), wood); { const p = new Path2D(); p.arc(0.3 * R, -1.6 * R, 0.75 * R, 0, Math.PI * 2); c.lineWidth = 0.08 * R + w * 2; c.strokeStyle = ol; c.stroke(p); c.lineWidth = 0.08 * R; c.strokeStyle = wood; c.stroke(p); } for (let i = 0; i < 8; i++) { const a = spin * 0.5 + i * Math.PI / 4; ln([[0.3, -1.6], [0.3 + Math.cos(a) * 0.72, -1.6 + Math.sin(a) * 0.72]], 0.4); } beam([[0.3, -0.85], [0.3, -1.6]], 0.06); beam([[-0.8, -0.85], [-0.8, -1.4]], 0.05); fl(E(-0.8, -1.5, 0.12, 0.2), cloth); break;
    case "potteryWheel": fl(rect(-0.7, -0.9, 0.7, -0.8), wood); beam([[0, -0.8], [0, -0.1]], 0.08); fl(E(0, -0.05, 0.6, 0.08), wood); pot(0, -0.9, 0.9); break;
    case "kiln": fl(S([[-1.3, 0], [-1.2, -1.4], [-0.6, -2.0], [0.6, -2.0], [1.2, -1.4], [1.3, 0]]), brick); clip(S([[-1.3, 0], [-1.2, -1.4], [-0.6, -2.0], [0.6, -2.0], [1.2, -1.4], [1.3, 0]]), () => { for (let y = -0.25; y > -2.0; y -= 0.25) ln([[-1.4, y], [1.4, y]], 0.3); }); fl(S([[-0.45, 0], [-0.45, -0.6], [0, -0.85], [0.45, -0.6], [0.45, 0]]), black, { hatch: false }); glow(0, -0.3, 1.0); flame(0, 0, 0.4); fl(rect(-0.25, -2.6, 0.25, -1.95), brick); if (o.smoking) smoke(0, -3.1, 0.5); break;
    case "carpenterBench": fl(rect(-1.5, -1.0, 1.5, -0.8), wood); [-1.3, 1.3].forEach((x) => beam([[x, -0.8], [x, 0]], 0.1)); beam([[-1.3, -0.25], [1.3, -0.25]], 0.06); fl(rect(1.2, -1.15, 1.45, -1.0), iron); fl(rect(-0.8, -1.12, 0.2, -1.0), K.shade(wood, 1.2)); break;
    case "chisel": beam([[-0.8, -0.1], [0.0, -0.1]], 0.12); beam([[0.0, -0.1], [0.7, -0.1]], 0.06, steel); fl(P([[0.7, -0.15], [0.85, -0.1], [0.7, -0.05]]), steel); break;
    case "woodPlane": fl(S([[-0.7, 0], [-0.7, -0.3], [0.7, -0.35], [0.7, 0]]), wood); fl(S([[-0.5, -0.3], [-0.45, -0.6], [-0.15, -0.65], [-0.1, -0.32]]), dark); fl(P([[0.1, -0.33], [0.25, -0.55], [0.32, -0.33]]), steel); break;
    case "printingPress": [-0.9, 0.9].forEach((x) => beam([[x, 0], [x, -3.0]], 0.15)); beam([[-1.0, -3.0], [1.0, -3.0]], 0.15); beam([[0, -3.0], [0, -1.8]], 0.08, iron); beam([[0, -2.3], [0.9, -2.5]], 0.05, iron); fl(rect(-0.6, -1.8, 0.6, -1.6), iron); fl(rect(-1.2, -1.3, 1.6, -1.1), wood); fl(rect(-0.5, -1.38, 0.5, -1.3), paper, { hatch: false }); break;
    case "inkStone": fl(S([[-0.7, 0], [-0.75, -0.25], [0.75, -0.25], [0.7, 0]]), T("#3a3a40")); fl(E(-0.2, -0.27, 0.35, 0.05), black, { hatch: false }); beam([[0.3, -0.35], [0.9, -0.6]], 0.08, T("#2a2a2e")); break;
    case "dyeVat": fl(S([[-0.9, 0], [-1.0, -0.9], [1.0, -0.9], [0.9, 0]]), wood); clip(S([[-0.9, 0], [-1.0, -0.9], [1.0, -0.9], [0.9, 0]]), () => { for (let x = -0.8; x < 0.9; x += 0.25) ln([[x, -0.9], [x, 0]], 0.3); }); fl(E(0, -0.9, 1.0, 0.15), T("#3a5aa8"), { hatch: false }); beam([[0.3, -0.85], [0.9, -2.0]], 0.05); break;
    case "tanningRack": [-1.0, 1.0].forEach((x) => beam([[x, 0], [x, -2.0]], 0.08)); beam([[-1.1, -1.9], [1.1, -1.9]], 0.07); fl(S([[-0.8, -1.8], [0.8, -1.8], [0.9, -1.2], [0.7, -0.4], [-0.7, -0.4], [-0.9, -1.2]]), leather); for (let i = 0; i < 5; i++) ln([[-0.8 + i * 0.4, -1.85], [-0.75 + i * 0.4, -1.75]], 0.6, rope); break;
    case "shipHull": fl(S([[-2.6, -1.6], [-2.2, -0.4], [-1.0, 0], [1.6, 0], [2.6, -1.4]]), K.shade(wood, 1.1)); for (let i = 0; i < 9; i++) { const x = -2.0 + i * 0.5; ln([[x, -1.55 + Math.abs(x) * 0.05], [x, -0.05]], 0.9, dark); } [-1.8, 0, 1.8].forEach((x) => beam([[x, 0], [x + 0.5, -2.0]], 0.07)); beam([[-2.8, 0.1], [2.8, 0.1]], 0.1); break;
    case "steamEngine": fl(rect(-2.0, -0.3, 2.0, 0), stone); fl(rect(-1.6, -1.8, -0.8, -0.3), iron); beam([[-1.2, -1.8], [0.6, -2.3]], 0.12, iron); beam([[-0.2, -2.3], [-0.2, -0.3]], 0.12, iron); ring(1.2, -1.2, 0.9, iron); ring(1.2, -1.2, 0.7, K.shade(iron, 1.2)); for (let i = 0; i < 6; i++) { const a = spin * 0.3 + i * Math.PI / 3; ln([[1.2, -1.2], [1.2 + Math.cos(a) * 0.7, -1.2 + Math.sin(a) * 0.7]], 0.8); } if (o.smoking) smoke(-1.2, -2.6, 0.4); break;`;
export const MOTION_LIBRARY_WORK: MotionLibraryPart = { part: "lib_work", fn: "prop", items, js: motionLibraryPart(items, body, 1, helpers) };
