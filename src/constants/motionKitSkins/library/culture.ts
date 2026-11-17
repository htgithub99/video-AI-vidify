// Writing and news, faith and festivals, medicine, and the things of law and punishment.
import { motionLibraryPart, type MotionLibraryPart } from "./common.js";

const items = [
  { id: "book", names: ["tome", "codex"], fit: "rigid" as const },
  { id: "bookStack", names: ["books"] },
  { id: "letter", names: ["sealedLetter", "envelope", "message"] },
  { id: "brushInk", names: ["calligraphyBrush", "inkBrush"] },
  { id: "quillPen", from: 600, to: 1900, names: ["quill", "featherPen", "inkwell"] },
  { id: "mapScroll", names: ["treasureMap", "chart", "map"] },
  { id: "newspaper", from: 1605, names: ["gazette"] },
  { id: "poster", from: 1800, names: ["propagandaPoster", "wantedPoster", "notice"] },
  { id: "telegraph", from: 1840, to: 1960, names: ["telegraphKey", "morseKey"] },
  { id: "camera", from: 1840, names: ["photoCamera"] },
  { id: "smartphone", from: 2007, names: ["mobilePhone", "cellphone"] },
  { id: "tablet", from: 2010, names: ["ipad"] },
  { id: "satelliteDish", from: 1960, names: ["dishAntenna"] },
  { id: "signalFlag", names: ["semaphoreFlags"] },
  { id: "loudspeaker", from: 1920, names: ["megaphone", "speaker"] },
  { id: "buddhaStatue", from: -100, names: ["buddha"] },
  { id: "prayerWheel", from: 400, names: ["maniWheel"] },
  { id: "rosary", names: ["prayerBeads"] },
  { id: "offeringTray", names: ["offerings", "mamCung"] },
  { id: "firecrackers", from: 900, names: ["fireworks", "phao"] },
  { id: "lionDanceHead", from: 700, names: ["lionDance", "dragonDanceHead"] },
  { id: "paperLantern", names: ["lanternString", "chineseLantern"] },
  { id: "kite", from: -400 },
  { id: "maypole", from: 1300 },
  { id: "menorah", from: -1000 },
  { id: "prayerRug", from: 650, names: ["prayerMat"], fit: "ground" as const },
  { id: "bandageRoll", names: ["bandage", "bandages"] },
  { id: "medicineBag", names: ["doctorBag", "medkit", "firstAidKit"] },
  { id: "herbBasket", names: ["herbs", "medicinalHerbs"] },
  { id: "syringe", from: 1850 },
  { id: "hospitalBed", from: 1850, names: ["sickbed"] },
  { id: "cage", names: ["birdcage", "prisonCage"] },
  { id: "shackles", names: ["manacles", "fetters", "irons"] },
  { id: "prisonCart", to: 1900, names: ["cageCart"] },
  { id: "cangue", to: 1910, names: ["neckCangue", "woodenCollar"] },
  { id: "judgeTable", names: ["courtBench", "magistrateDesk", "tribunal"] },
];

const body = `
    case "book": fl(P([[-0.6, 0], [0.6, 0], [0.6, -0.25], [-0.6, -0.25]]), leather); fl(P([[-0.55, -0.25], [0.55, -0.25], [0.5, -0.3], [-0.5, -0.3]]), paper, { hatch: false }); fl(P([[-0.6, -0.3], [0.6, -0.3], [0.6, -0.4], [-0.6, -0.4]]), leather); ln([[-0.1, -0.33], [0.3, -0.36]], 0.8, gold); break;
    case "bookStack": [[0, red], [-0.1, blue], [0.08, green], [-0.05, leather]].forEach(([dx, col], i) => { const y = -i * 0.32; fl(rect(-0.7 + dx, y - 0.3, 0.7 + dx, y), col); fl(rect(-0.6 + dx, y - 0.25, 0.65 + dx, y - 0.05), paper, { hatch: false }); }); break;
    case "letter": fl(rect(-0.7, -0.5, 0.7, 0), paper); ln([[-0.7, -0.5], [0, -0.15], [0.7, -0.5]], 0.5); ring(0, -0.15, 0.12, red); break;
    case "brushInk": fl(rect(-0.8, -0.18, 0.2, 0), T("#3a3a40")); fl(E(-0.3, -0.19, 0.35, 0.04), black, { hatch: false }); beam([[0.0, -0.25], [1.0, -0.6]], 0.06, T("#c8a45a")); fl(S([[0.95, -0.66], [1.25, -0.72], [1.2, -0.56], [1.0, -0.52]]), black); break;
    case "quillPen": fl(S([[-0.3, 0], [-0.35, -0.35], [0.35, -0.35], [0.3, 0]]), T("#2a2a3a")); beam([[0, -0.35], [0.5, -1.4]], 0.03, white); fl(S([[0.15, -0.7], [0.3, -0.75], [0.75, -1.5], [0.55, -1.55], [0.4, -1.2]]), white); break;
    case "mapScroll": fl(rect(-1.0, -1.2, 1.0, 0), T("#e8d8a8")); [-1.0, 1.0].forEach((x) => fl(E(x, -0.6, 0.1, 0.65), T("#c8b07a"))); ln([[-0.7, -0.9], [-0.3, -0.6], [0.1, -0.8], [0.6, -0.4]], 0.8, T("#8a5a3a")); ln([[0.45, -0.55], [0.75, -0.25]], 1.2, red); ln([[0.75, -0.55], [0.45, -0.25]], 1.2, red); break;
    case "newspaper": fl(rect(-0.8, -1.2, 0.8, 0), paper); fl(rect(-0.7, -1.1, 0.7, -0.85), black, { hatch: false }); for (let i = 0; i < 6; i++) { ln([[-0.7, -0.7 + i * 0.12], [-0.05, -0.7 + i * 0.12]], 0.3, T("#7a7064")); } fl(rect(0.05, -0.75, 0.7, -0.15), T("#a8a094"), { hatch: false }); break;
    case "poster": fl(rect(-0.8, -2.2, 0.8, -0.2), T("#e8d8b0")); fl(rect(-0.65, -2.05, 0.65, -1.7), red, { hatch: false }); ring(0, -1.2, 0.35, T("#5a4a3a")); for (let i = 0; i < 3; i++) ln([[-0.6, -0.65 + i * 0.13], [0.6, -0.65 + i * 0.13]], 0.4); beam([[-0.8, -0.2], [-0.8, 0]], 0.03, wood); beam([[0.8, -0.2], [0.8, 0]], 0.03, wood); break;
    case "telegraph": fl(rect(-0.9, -0.25, 0.9, 0), wood); beam([[-0.5, -0.35], [0.5, -0.45]], 0.06, gold); ring(0.5, -0.55, 0.12, black); fl(rect(-0.8, -0.6, -0.4, -0.25), gold); ring(-0.6, -0.68, 0.08, gold); break;
    case "camera": fl(rect(-0.6, -0.8, 0.6, -0.2), black); fl(rect(-0.4, -0.95, 0.0, -0.8), black); ring(0.05, -0.5, 0.25, T("#3a3a40")); ring(0.05, -0.5, 0.14, glass); fl(rect(0.35, -0.75, 0.5, -0.65), white, { hatch: false }); break;
    case "smartphone": fl(S([[-0.3, 0], [-0.3, -1.2], [0.3, -1.2], [0.3, 0]]), black); fl(rect(-0.25, -1.1, 0.25, -0.1), glass, { hatch: false }); break;
    case "tablet": fl(S([[-0.7, 0], [-0.7, -1.0], [0.7, -1.0], [0.7, 0]]), black); fl(rect(-0.62, -0.92, 0.62, -0.08), glass, { hatch: false }); break;
    case "satelliteDish": beam([[0, 0], [0, -0.9]], 0.1, white); fl(S([[-0.9, -2.1], [-0.6, -1.3], [0, -0.9], [0.5, -1.0], [0.9, -1.6], [0.4, -1.4], [-0.2, -1.6]]), white); beam([[0.0, -1.3], [0.6, -2.1]], 0.04, steel); break;
    case "signalFlag": [-0.4, 0.4].forEach((x, i) => { beam([[x, 0], [x, -1.4]], 0.04); fl(rect(x, -1.4, x + 0.5, -0.95), i ? T("#e8c43a") : red, { hatch: false }); fl(P([[x, -1.4], [x + 0.5, -1.4], [x, -0.95]]), i ? red : T("#e8c43a"), { hatch: false }); }); break;
    case "loudspeaker": beam([[0, 0], [0, -2.4]], 0.06, iron); fl(P([[0.0, -2.6], [0.9, -3.0], [0.9, -2.0], [0.0, -2.4]]), T("#8a8a90")); fl(E(0.9, -2.5, 0.12, 0.5), black); break;
    case "buddhaStatue": fl(rect(-1.1, -0.4, 1.1, 0), stone); fl(S([[-1.0, -0.4], [-0.9, -0.75], [0.9, -0.75], [1.0, -0.4]]), gold); fl(S([[-0.6, -0.7], [-0.65, -1.5], [-0.3, -1.85], [0.3, -1.85], [0.65, -1.5], [0.6, -0.7]]), gold); ring(0, -2.15, 0.35, gold); fl(E(0, -2.55, 0.12, 0.12), gold); ln([[-0.12, -2.15], [-0.04, -2.15]], 0.6); ln([[0.04, -2.15], [0.12, -2.15]], 0.6); fl(E(0, -1.0, 0.25, 0.1), K.shade(gold, 0.85)); break;
    case "prayerWheel": beam([[0, 0], [0, -1.8]], 0.06); fl(S([[-0.4, -0.6], [-0.4, -1.4], [0.4, -1.4], [0.4, -0.6]]), gold); for (let i = 0; i < 3; i++) ln([[-0.4, -0.8 - i * 0.2], [0.4, -0.8 - i * 0.2]], 0.4, red); fl(E(0, -1.45, 0.4, 0.08), red); break;
    case "rosary": for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; ring(Math.cos(a) * 0.4, -0.7 + Math.sin(a) * 0.35, 0.06, wood); } beam([[0, -0.35], [0, 0.05]], 0.02, dark); beam([[-0.12, -0.1], [0.12, -0.1]], 0.02, dark); break;
    case "offeringTray": fl(E(0, -0.1, 1.0, 0.15), red); fl(rect(-0.9, -0.1, 0.9, 0), red); [[-0.6, T("#e8c43a")], [-0.1, red], [0.4, green]].forEach(([x, col]) => fl(S([[x - 0.25, -0.15], [x, -0.65], [x + 0.25, -0.15]]), col)); fl(S([[0.6, -0.15], [0.7, -0.5], [0.85, -0.15]]), white); break;
    case "firecrackers": ln([[0, -2.2], [0, 0]], 0.5, rope); for (let i = 0; i < 9; i++) { const y = -2.0 + i * 0.22; [-1, 1].forEach((s) => { c.save(); c.translate(s * 0.1 * R, y * R); c.rotate(s * 0.9); fl(rect(-0.05, -0.18, 0.05, 0.0), red, { hatch: false }); c.restore(); }); } break;
    case "lionDanceHead": fl(S([[-0.9, 0], [-1.0, -0.9], [-0.6, -1.5], [0.5, -1.55], [1.0, -1.1], [1.0, -0.3], [0.6, 0]]), red); ring(-0.2, -1.0, 0.22, white); ring(0.4, -1.0, 0.22, white); ring(-0.2, -1.0, 0.1, black); ring(0.4, -1.0, 0.1, black); fl(P([[-0.4, -1.45], [0.1, -1.95], [0.5, -1.45]]), gold); fl(S([[-0.5, -0.45], [0.7, -0.45], [0.6, -0.15], [-0.4, -0.15]]), white); for (let i = 0; i < 6; i++) ln([[-0.9 + i * 0.35, -1.5], [-0.95 + i * 0.35, -1.8]], 1.0, T("#e8e8e0")); break;
    case "paperLantern": ln([[-1.5, -2.4], [1.5, -2.4]], 0.6, rope); [-1.0, 0, 1.0].forEach((x) => { ln([[x, -2.4], [x, -2.1]], 0.4); fl(E(x, -1.75, 0.32, 0.38), red); fl(rect(x - 0.15, -2.15, x + 0.15, -2.08), gold); fl(rect(x - 0.15, -1.42, x + 0.15, -1.35), gold); if (night) glow(x, -1.75, 0.8); }); break;
    case "kite": fl(P([[0, -2.6], [0.6, -1.9], [0, -1.0], [-0.6, -1.9]]), red); ln([[0, -2.6], [0, -1.0]], 0.4); ln([[-0.6, -1.9], [0.6, -1.9]], 0.4); ln([[0, -1.0], [0.3, -0.6], [-0.1, -0.3], [0.2, 0]], 0.5, rope); break;
    case "maypole": beam([[0, 0], [0, -4.0]], 0.08, white); fl(E(0, -4.0, 0.4, 0.12), green); [red, blue, T("#e8c43a"), green].forEach((col, i) => ln([[0, -3.9], [-1.5 + i, 0]], 0.7, col)); break;
    case "menorah": fl(rect(-0.3, -0.15, 0.3, 0), gold); beam([[0, -0.15], [0, -1.5]], 0.07, gold); for (let i = 1; i <= 3; i++) { const p = new Path2D(); p.arc(0, -0.95 * R, i * 0.25 * R, 0, Math.PI); c.lineWidth = 0.06 * R + w * 2; c.strokeStyle = ol; c.stroke(p); c.lineWidth = 0.06 * R; c.strokeStyle = gold; c.stroke(p); } for (let i = -3; i <= 3; i++) { const x = i * 0.25; beam([[x, -0.95 - (i === 0 ? 0.55 : 0)], [x, -1.55]], 0.05, gold); fl(E(x, -1.65, 0.04, 0.08), T("#f2b03a"), { hatch: false }); } break;
    case "prayerRug": fl(rect(-1.2, -0.12, 1.2, 0), red); fl(rect(-1.05, -0.1, 1.05, -0.02), T("#2a4a6a"), { hatch: false }); for (let i = 0; i < 10; i++) ln([[-1.2 + i * 0.26, 0], [-1.25 + i * 0.26, 0.06]], 0.4, gold); break;
    case "bandageRoll": fl(rect(-0.4, -0.5, 0.4, 0), white); fl(E(0.4, -0.25, 0.1, 0.25), K.shade(white, 0.92)); ln([[0.45, -0.05], [0.9, 0.0]], 1.4, white); break;
    case "medicineBag": fl(S([[-0.7, 0], [-0.8, -0.7], [0.8, -0.7], [0.7, 0]]), black); ln([[-0.3, -0.7], [-0.25, -0.95], [0.25, -0.95], [0.3, -0.7]], 1.0); fl(rect(-0.08, -0.55, 0.08, -0.2), red, { hatch: false }); fl(rect(-0.25, -0.45, 0.25, -0.3), red, { hatch: false }); break;
    case "herbBasket": fl(S([[-0.7, -0.5], [0.7, -0.5], [0.55, 0], [-0.55, 0]]), straw); for (let i = 0; i < 7; i++) ln([[-0.5 + i * 0.17, -0.5], [-0.6 + i * 0.2, -0.95 - rnd(i) * 0.2]], 1.0, green); break;
    case "syringe": fl(rect(-0.6, -0.18, 0.4, -0.02), glass); beam([[0.4, -0.1], [0.9, -0.1]], 0.015, steel); beam([[-0.9, -0.1], [-0.6, -0.1]], 0.05, white); fl(rect(-0.95, -0.25, -0.9, 0.05), white); break;
    case "hospitalBed": fl(rect(-1.6, -1.0, 1.6, -0.75), steel); fl(rect(-1.5, -1.15, 1.5, -1.0), white); fl(E(-1.15, -1.22, 0.3, 0.1), white); [-1.6, 1.6].forEach((x) => beam([[x, 0], [x, -1.5]], 0.06, steel)); [-1.4, 1.4].forEach((x) => ring(x, -0.12, 0.12, black)); break;
    case "cage": fl(E(0, -0.05, 0.9, 0.12), iron); for (let i = 0; i < 9; i++) ln([[-0.8 + i * 0.2, -0.05], [-0.8 + i * 0.2, -2.0]], 0.6, iron); fl(E(0, -2.0, 0.9, 0.12), iron); ln([[0, -2.1], [0, -2.5]], 0.6, iron); break;
    case "shackles": [-0.4, 0.4].forEach((x) => { const p = new Path2D(); p.arc(x * R, -0.25 * R, 0.25 * R, 0, Math.PI * 2); c.lineWidth = 0.1 * R + w * 2; c.strokeStyle = ol; c.stroke(p); c.lineWidth = 0.1 * R; c.strokeStyle = iron; c.stroke(p); }); for (let i = 0; i < 3; i++) ring(-0.12 + i * 0.12, -0.25, 0.05, iron); break;
    case "prisonCart": fl(rect(-1.4, -0.9, 1.0, -0.7), wood); for (let i = 0; i < 9; i++) beam([[-1.3 + i * 0.28, -0.9], [-1.3 + i * 0.28, -2.4]], 0.05); beam([[-1.4, -2.4], [1.0, -2.4]], 0.08); woodWheel(-0.2, 0.7); beam([[1.0, -0.8], [2.2, -1.2]], 0.07); break;
    case "cangue": fl(rect(-1.0, -0.35, 1.0, 0), wood); fl(E(0, -0.18, 0.18, 0.15), black, { hatch: false }); ln([[-1.0, -0.18], [1.0, -0.18]], 0.4); fl(rect(-0.8, -0.32, -0.4, -0.05), paper, { hatch: false }); break;
    case "judgeTable": fl(rect(-1.8, -1.3, 1.8, 0), red); fl(rect(-2.0, -1.45, 2.0, -1.3), dark); clip(rect(-1.8, -1.3, 1.8, 0), () => { for (let x = -1.2; x < 1.8; x += 1.2) ln([[x, -1.3], [x, 0]], 0.5, gold); }); fl(rect(0.6, -1.65, 1.0, -1.45), dark); beam([[-0.8, -1.55], [-0.3, -1.6]], 0.08, dark); break;`;

export const MOTION_LIBRARY_CULTURE: MotionLibraryPart = { part: "lib_culture", fn: "prop", items, js: motionLibraryPart(items, body, 0.9) };
