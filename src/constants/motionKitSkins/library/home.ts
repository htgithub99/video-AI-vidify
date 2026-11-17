// Furniture, lamps and household machines, kitchen ware and food (front or side view, ground y = 0).
import { motionLibraryPart, type MotionLibraryPart } from "./common.js";

const items = [
  { id: "mat", names: ["sleepingMat", "chieu", "tatami", "rug"], fit: "ground" as const },
  { id: "stool" },
  { id: "cupboard", names: ["cabinet", "dresser"] },
  { id: "shelf", names: ["shelves"] },
  { id: "fireplace", from: 1200, names: ["chimneyFireplace"] },
  { id: "hearth", names: ["threeStoneStove", "kitchenFire"] },
  { id: "stove", from: 1750, names: ["ironStove", "cookingStove", "range"] },
  { id: "cradle", names: ["babyCradle", "crib"] },
  { id: "foldingScreen", names: ["screen", "partition"] },
  { id: "wardrobe", from: 1600, names: ["closet", "armoire"] },
  { id: "desk", names: ["writingDesk", "bureau"] },
  { id: "bookshelf", from: 1400, names: ["bookcase"] },
  { id: "sofa", from: 1700, names: ["couch", "settee"] },
  { id: "bathtub", from: 1800, names: ["bath"] },
  { id: "electricLamp", from: 1880, names: ["tableLamp", "deskLamp", "lamp"] },
  { id: "electricFan", from: 1890, names: ["fan", "ceilingFan"] },
  { id: "radio", from: 1920, names: ["wireless", "transistorRadio"] },
  { id: "television", from: 1938, names: ["tv", "tvSet"] },
  { id: "fridge", from: 1930, names: ["refrigerator", "icebox"] },
  { id: "sewingMachine", from: 1850 },
  { id: "typewriter", from: 1870 },
  { id: "gramophone", from: 1890, to: 1960, names: ["phonograph", "recordPlayer"] },
  { id: "pan", names: ["fryingPan", "skillet", "wok"] },
  { id: "plate", names: ["dish"], fit: "rigid" as const },
  { id: "chopsticks", from: -1200 },
  { id: "amphora", from: -1500, to: 600, fit: "rigid" as const },
  { id: "wineBottle", from: 1650, names: ["bottle"] },
  { id: "riceBowl", names: ["bowlOfRice"], fit: "rigid" as const },
  { id: "fruitBasket", names: ["fruit", "fruits"] },
  { id: "vegetables", names: ["veggies", "cabbages"] },
  { id: "eggs", names: ["eggBasket"] },
  { id: "roastChicken", names: ["roast", "roastMeat", "feast"] },
  { id: "kettle", names: ["teakettle"], fit: "rigid" as const },
  { id: "samovar", from: 1700, fit: "rigid" as const },
  { id: "teaSet", names: ["teaCups"] },
  { id: "wineCup", names: ["goblet", "chalice"], fit: "rigid" as const },
  { id: "gourd", names: ["waterGourd", "canteen", "flask"], fit: "rigid" as const },
];

const helpers = `const legs4 = (x0, x1, top, wd) => { beam([[x0, top], [x0, 0]], wd || 0.08); beam([[x1, top], [x1, 0]], wd || 0.08); };
  const box = (x0, y0, x1, y1, col) => fl(rect(x0, y0, x1, y1), col || wood);
  const knob = (x, y) => ring(x, y, 0.05, gold);`;

const body = `
    case "mat": fl(P([[-1.6, 0], [1.6, 0], [1.4, -0.18], [-1.4, -0.18]]), straw); for (let i = 0; i < 8; i++) ln([[-1.5 + i * 0.42, 0], [-1.3 + i * 0.4, -0.18]], 0.35); ln([[-1.5, -0.09], [1.5, -0.09]], 0.5, red); break;
    case "stool": fl(rect(-0.5, -1.0, 0.5, -0.85), wood); legs4(-0.4, 0.4, -0.85, 0.07); beam([[-0.4, -0.35], [0.4, -0.35]], 0.05); break;
    case "cupboard": box(-0.9, -2.6, 0.9, 0); box(-1.0, -2.75, 1.0, -2.6, dark); box(-0.8, -2.45, -0.03, -1.3, K.shade(wood, 1.1)); box(0.03, -2.45, 0.8, -1.3, K.shade(wood, 1.1)); box(-0.8, -1.15, 0.8, -0.6, K.shade(wood, 1.1)); box(-0.8, -0.5, 0.8, -0.1, K.shade(wood, 1.1)); knob(-0.12, -1.85); knob(0.12, -1.85); knob(0, -0.88); knob(0, -0.3); break;
    case "shelf": [-1.0, 1.0].forEach((x) => beam([[x, 0], [x, -2.2]], 0.08)); for (let i = 0; i < 4; i++) { const y = -0.4 - i * 0.6; beam([[-1.05, y], [1.05, y]], 0.07); [[-0.7, red], [-0.35, blue], [0.2, green], [0.6, gold]].forEach(([x, col], k) => (k + i) % 2 ? fl(rect(x - 0.1, y - 0.45, x + 0.1, y - 0.04), col) : fl(E(x, y - 0.2, 0.15, 0.17), clay())); } break;
    case "fireplace": box(-1.4, -2.0, 1.4, 0, stone); clip(rect(-1.4, -2.0, 1.4, 0), () => { for (let y = -0.3; y > -2.0; y -= 0.3) ln([[-1.4, y], [1.4, y]], 0.3); }); box(-1.6, -2.15, 1.6, -1.95, K.shade(stone, 0.85)); fl(S([[-0.8, 0], [-0.8, -1.1], [0, -1.35], [0.8, -1.1], [0.8, 0]]), black, { hatch: false }); glow(0, -0.4, 1.4); flame(0, -0.05, 0.6); break;
    case "hearth": [[-0.5, 0], [0.5, 0], [0, -0.1]].forEach(([x]) => fl(E(x, -0.15, 0.22, 0.18), stone)); glow(0, -0.4, 1.4); flame(0, -0.1, 0.55); fl(S([[-0.55, -0.4], [0.55, -0.4], [0.45, -0.95], [-0.45, -0.95]]), black); ln([[-0.5, -0.95], [0.5, -0.95]], 1.0); break;
    case "stove": box(-0.9, -1.4, 0.9, -0.2, black); legs4(-0.8, 0.8, -0.2, 0.08); box(-0.7, -1.1, 0.0, -0.5, T("#3a3a3a")); fl(rect(-0.55, -0.95, -0.15, -0.65), T("#e2672b"), { hatch: false }); beam([[0.5, -1.4], [0.5, -3.0]], 0.2, black); fl(E(0.35, -1.45, 0.3, 0.08), T("#4a4a4a")); break;
    case "cradle": fl(S([[-0.9, -0.9], [-0.8, -0.35], [0.8, -0.35], [0.9, -0.9]]), wood); { const p = new Path2D(); p.arc(0, 0.2 * R, 1.0 * R, Math.PI * 1.15, Math.PI * 1.85); c.lineWidth = 0.1 * R + w * 2; c.strokeStyle = ol; c.stroke(p); c.lineWidth = 0.1 * R; c.strokeStyle = dark; c.stroke(p); } fl(S([[-0.75, -0.8], [0.75, -0.8], [0.6, -0.95], [-0.6, -0.95]]), cloth); break;
    case "foldingScreen": for (let i = 0; i < 4; i++) { const x = -1.6 + i * 0.8; fl(rect(x, -2.2, x + 0.78, 0), black); fl(rect(x + 0.08, -2.1, x + 0.7, -0.1), paper, { hatch: false }); } ln([[-1.3, -1.6], [-0.6, -1.0], [0.4, -1.3], [1.3, -0.6]], 0.8, T("#6a8a5a")); fl(E(0.9, -1.5, 0.2, 0.2), red, { hatch: false }); break;
    case "wardrobe": box(-0.9, -3.0, 0.9, 0); box(-1.0, -3.15, 1.0, -3.0, dark); box(-0.8, -2.85, -0.03, -0.15, K.shade(wood, 1.1)); box(0.03, -2.85, 0.8, -0.15, K.shade(wood, 1.1)); knob(-0.12, -1.5); knob(0.12, -1.5); break;
    case "desk": box(-1.3, -1.25, 1.3, -1.1); box(0.3, -1.1, 1.2, 0, K.shade(wood, 0.9)); for (let i = 0; i < 3; i++) { ln([[0.3, -0.75 + i * 0.35], [1.2, -0.75 + i * 0.35]], 0.4); knob(0.75, -0.92 + i * 0.35); } beam([[-1.2, -1.1], [-1.2, 0]], 0.08); fl(rect(-0.9, -1.45, -0.3, -1.25), paper, { hatch: false }); break;
    case "bookshelf": box(-1.0, -3.0, 1.0, 0); for (let i = 0; i < 4; i++) { const y = -0.15 - i * 0.7; box(-0.9, y - 0.6, 0.9, y, K.shade(wood, 0.7)); for (let k = 0; k < 9; k++) fl(rect(-0.85 + k * 0.19, y - 0.5 - (k % 3) * 0.04, -0.7 + k * 0.19, y), [red, blue, green, gold, leather][(k + i) % 5], { hatch: false }); } break;
    case "sofa": fl(S([[-1.6, -0.3], [-1.6, -1.3], [1.6, -1.3], [1.6, -0.3]]), red); fl(S([[-1.8, -0.3], [-1.8, -0.95], [-1.4, -0.95], [-1.4, -0.3]]), K.shade(red, 0.9)); fl(S([[1.4, -0.3], [1.4, -0.95], [1.8, -0.95], [1.8, -0.3]]), K.shade(red, 0.9)); fl(rect(-1.4, -0.75, 1.4, -0.3), K.shade(red, 1.1)); ln([[0, -0.75], [0, -0.3]], 0.5); legs4(-1.6, 1.6, -0.3, 0.06); break;
    case "bathtub": fl(S([[-1.5, -1.0], [1.5, -1.0], [1.4, -0.3], [-1.4, -0.3]]), white); [-1.2, 1.2].forEach((x) => fl(E(x, -0.15, 0.12, 0.15), gold)); beam([[1.3, -1.0], [1.3, -1.5], [1.0, -1.5]], 0.05, steel); break;
    case "electricLamp": fl(E(0, -0.05, 0.4, 0.08), dark); beam([[0, -0.05], [0, -1.3]], 0.05, gold); fl(P([[-0.45, -1.1], [0.45, -1.1], [0.25, -1.75], [-0.25, -1.75]]), T("#e8d8a8")); if (night) glow(0, -1.0, 1.4); break;
    case "electricFan": fl(E(0, -0.05, 0.45, 0.1), T("#4a5a6a")); beam([[0, -0.05], [0, -1.2]], 0.07, T("#4a5a6a")); { const p = new Path2D(); p.arc(0, -1.5 * R, 0.55 * R, 0, Math.PI * 2); c.lineWidth = w * 0.6; c.strokeStyle = ol; c.stroke(p); } for (let i = 0; i < 3; i++) { const a = t * 20 + i * Math.PI * 2 / 3; fl(E(Math.cos(a) * 0.28, -1.5 + Math.sin(a) * 0.28, 0.24, 0.12, a), T("#7a9ab0")); } ring(0, -1.5, 0.1, T("#4a5a6a")); break;
    case "radio": fl(S([[-0.8, 0], [-0.85, -0.9], [-0.4, -1.3], [0.4, -1.3], [0.85, -0.9], [0.8, 0]]), wood); fl(S([[-0.55, -0.5], [-0.55, -0.95], [0, -1.12], [0.55, -0.95], [0.55, -0.5]]), cloth, { hatch: false }); for (let i = 0; i < 4; i++) ln([[-0.5, -0.6 - i * 0.12], [0.5, -0.6 - i * 0.12]], 0.3); [-0.3, 0.3].forEach((x) => ring(x, -0.22, 0.09, dark)); break;
    case "television": fl(S([[-1.0, -0.4], [-1.0, -1.8], [1.0, -1.8], [1.0, -0.4]]), wood); fl(S([[-0.85, -0.55], [-0.85, -1.65], [0.55, -1.65], [0.55, -0.55]]), T(night ? "#7aa0c0" : "#5a6a6a"), { hatch: false }); [0.78].forEach((x) => { ring(x, -1.4, 0.08, dark); ring(x, -1.1, 0.08, dark); }); legs4(-0.8, 0.8, -0.4, 0.05); ln([[-0.2, -1.8], [-0.5, -2.4]], 0.6); ln([[0.2, -1.8], [0.5, -2.4]], 0.6); break;
    case "fridge": fl(S([[-0.7, 0], [-0.7, -2.6], [0.7, -2.6], [0.7, 0]]), white); ln([[-0.7, -1.7], [0.7, -1.7]], 0.5); beam([[0.5, -2.4], [0.5, -1.9]], 0.05, steel); beam([[0.5, -1.5], [0.5, -0.9]], 0.05, steel); break;
    case "sewingMachine": box(-1.0, -1.0, 1.0, -0.85); legs4(-0.8, 0.8, -0.85, 0.06); fl(S([[-0.7, -1.0], [-0.7, -1.7], [0.5, -1.75], [0.65, -1.5], [0.4, -1.4], [-0.35, -1.4], [-0.35, -1.0]]), black); ln([[-0.5, -1.55], [0.3, -1.6]], 0.4, gold); beam([[0.5, -1.45], [0.5, -1.05]], 0.03, steel); ring(-0.7, -1.35, 0.18, steel); break;
    case "typewriter": fl(P([[-0.9, 0], [0.9, 0], [0.75, -0.55], [-0.75, -0.55]]), black); fl(rect(-0.85, -0.8, 0.85, -0.6), black); ring(-0.9, -0.7, 0.08, steel); ring(0.9, -0.7, 0.08, steel); fl(rect(-0.5, -1.25, 0.5, -0.75), paper, { hatch: false }); for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) ring(-0.6 + i * 0.2, -0.12 - r * 0.13, 0.05, white); break;
    case "gramophone": box(-0.7, -0.6, 0.7, 0); fl(E(0, -0.65, 0.6, 0.1), black); beam([[0.5, -0.65], [0.3, -1.3]], 0.05, gold); fl(S([[0.3, -1.25], [0.55, -1.6], [1.1, -2.3], [0.5, -2.6], [0.15, -2.0], [0.2, -1.3]]), gold); break;
    case "pan": fl(E(0, -0.15, 0.75, 0.16), black); fl(rect(-0.7, -0.15, 0.7, 0), black); beam([[0.7, -0.12], [1.6, -0.25]], 0.08, dark); break;
    case "plate": fl(E(0, -0.12, 0.8, 0.14), white); fl(E(0, -0.14, 0.5, 0.08), K.shade(white, 0.92), { hatch: false }); break;
    case "chopsticks": [-0.05, 0.05].forEach((d) => beam([[-0.9, -0.08 + d], [0.9, -0.12 + d * 2]], 0.04, wood)); break;
    case "amphora": fl(S([[-0.15, 0], [-0.45, -0.6], [-0.5, -1.2], [-0.25, -1.6], [-0.15, -1.9], [0.15, -1.9], [0.25, -1.6], [0.5, -1.2], [0.45, -0.6], [0.15, 0]]), clay()); [-1, 1].forEach((s) => ln([[s * 0.15, -1.85], [s * 0.4, -1.75], [s * 0.3, -1.4]], 0.8)); ln([[-0.45, -1.0], [0.45, -1.0]], 0.5, black); break;
    case "wineBottle": fl(S([[-0.22, 0], [-0.22, -0.95], [-0.08, -1.2], [-0.08, -1.5], [0.08, -1.5], [0.08, -1.2], [0.22, -0.95], [0.22, 0]]), T("#2a5a3a")); fl(rect(-0.2, -0.75, 0.2, -0.35), paper, { hatch: false }); fl(rect(-0.07, -1.58, 0.07, -1.45), red); break;
    case "riceBowl": fl(S([[-0.55, -0.35], [0.55, -0.35], [0.35, -0.02], [-0.35, -0.02]]), T("#c8d8e8")); fl(S([[-0.5, -0.35], [-0.3, -0.62], [0.3, -0.62], [0.5, -0.35]]), white); fl(rect(-0.18, -0.02, 0.18, 0), T("#a8b8c8")); break;
    case "fruitBasket": fl(S([[-0.8, -0.5], [0.8, -0.5], [0.6, 0], [-0.6, 0]]), straw); [[-0.45, red], [0, T("#e8a83a")], [0.45, green], [-0.22, T("#e8d84a")], [0.22, red]].forEach(([x, col], i) => ring(x, i < 3 ? -0.62 : -0.88, 0.22, col)); break;
    case "vegetables": [[-0.5, green], [0.1, T("#e8823a")], [0.6, green]].forEach(([x, col], i) => i === 1 ? fl(P([[x - 0.12, -0.25], [x + 0.6, -0.15], [x - 0.1, -0.05]]), col) : ring(x, -0.35, 0.35, col)); ln([[0.1, -0.2], [-0.1, -0.35]], 0.8, green); break;
    case "eggs": fl(S([[-0.7, -0.45], [0.7, -0.45], [0.55, 0], [-0.55, 0]]), straw); for (let i = 0; i < 5; i++) fl(E(-0.4 + i * 0.2, -0.55 - (i % 2) * 0.1, 0.12, 0.15), white); break;
    case "roastChicken": fl(E(0, -0.12, 0.95, 0.15), white); fl(S([[-0.6, -0.15], [-0.65, -0.55], [-0.2, -0.85], [0.45, -0.75], [0.6, -0.4], [0.5, -0.15]]), T("#c87a3a")); [-1, 1].forEach((s) => { beam([[s * 0.4, -0.4], [s * 0.85, -0.65]], 0.12, T("#c87a3a")); ring(s * 0.9, -0.68, 0.07, white); }); break;
    case "kettle": fl(S([[-0.5, 0], [-0.55, -0.55], [-0.3, -0.8], [0.3, -0.8], [0.55, -0.55], [0.5, 0]]), steel); fl(P([[0.5, -0.45], [0.9, -0.75], [0.95, -0.68], [0.55, -0.25]]), steel); ln([[-0.35, -0.85], [0, -1.15], [0.35, -0.85]], 1.0); break;
    case "samovar": fl(S([[-0.4, 0], [-0.3, -0.25], [-0.55, -0.5], [-0.6, -1.3], [-0.35, -1.6], [0.35, -1.6], [0.6, -1.3], [0.55, -0.5], [0.3, -0.25], [0.4, 0]]), gold); beam([[0.55, -0.7], [0.85, -0.65]], 0.06, gold); fl(S([[-0.2, -1.6], [0.2, -1.6], [0.15, -1.9], [-0.15, -1.9]]), gold); fl(E(0, -2.0, 0.2, 0.15), white); break;
    case "teaSet": fl(E(0, -0.05, 1.1, 0.1), wood); fl(S([[-0.4, -0.1], [-0.45, -0.5], [-0.2, -0.7], [0.2, -0.7], [0.45, -0.5], [0.4, -0.1]]), T("#7a5a8a")); fl(P([[0.4, -0.35], [0.75, -0.6], [0.4, -0.2]]), T("#7a5a8a")); [-0.85, 0.85].forEach((x) => fl(S([[x - 0.15, -0.35], [x + 0.15, -0.35], [x + 0.1, -0.1], [x - 0.1, -0.1]]), white)); break;
    case "wineCup": fl(S([[-0.35, -0.95], [0.35, -0.95], [0.25, -0.55], [0.05, -0.45], [-0.05, -0.45], [-0.25, -0.55]]), gold); beam([[0, -0.45], [0, -0.1]], 0.06, gold); fl(E(0, -0.05, 0.28, 0.07), gold); break;
    case "gourd": fl(S([[-0.4, 0], [-0.5, -0.4], [-0.3, -0.75], [-0.15, -0.9], [-0.2, -1.1], [0, -1.3], [0.2, -1.1], [0.15, -0.9], [0.3, -0.75], [0.5, -0.4], [0.4, 0]]), T("#c8a04a")); ln([[-0.2, -0.95], [0.2, -0.95]], 0.8, red); break;`;

export const MOTION_LIBRARY_HOME: MotionLibraryPart = { part: "lib_home", fn: "prop", items, js: motionLibraryPart(items, body, 0.9, helpers + `\n  const clay = () => T(night ? "#7a4a3a" : "#b8643e");`) };
