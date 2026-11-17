// Hand weapons of every age, drawn lying (handle or stock at -x, the working end at +x) so a standing one is turned up
// in its box: blades from stone to sabre, pole arms, bows, and guns from the hand cannon to the assault rifle.
import { motionLibraryPart, type MotionLibraryPart } from "./common.js";

const items = [
  { id: "stoneAxe", to: -2000, names: ["flintAxe", "handAxe"] },
  { id: "sling" },
  { id: "javelin", to: 1600 },
  { id: "pilum", from: -400, to: 300 },
  { id: "gladius", from: -300, to: 400, names: ["shortSword"] },
  { id: "khopesh", from: -2500, to: -1100, names: ["sickleSword"] },
  { id: "trident", names: ["fishingSpear"] },
  { id: "longsword", from: 1100, to: 1600, names: ["knightSword", "broadsword"] },
  { id: "greatsword", from: 1300, to: 1650, names: ["zweihander", "claymore"] },
  { id: "falchion", from: 1100, to: 1600 },
  { id: "scimitar", from: 800, to: 1900, names: ["shamshir", "talwar"] },
  { id: "sabre", from: 1600, to: 1945, names: ["saber", "cavalrySword"] },
  { id: "katana", from: 1400, to: 1880, names: ["samuraiSword"] },
  { id: "naginata", from: 900, to: 1880 },
  { id: "guandao", from: 200, to: 1900, names: ["crescentBlade", "glaive"] },
  { id: "morningstar", from: 1200, to: 1600 },
  { id: "flail", from: 1200, to: 1600, names: ["warFlail"] },
  { id: "warhammer", from: 1300, to: 1600, names: ["pollaxe"] },
  { id: "lance", from: 1000, to: 1918, names: ["cavalryLance"] },
  { id: "pike", from: 1300, to: 1720 },
  { id: "longbow", from: 1200, to: 1600, names: ["englishLongbow"] },
  { id: "compositeBow", from: -2000, to: 1800, names: ["recurveBow", "hornBow"] },
  { id: "quiver", to: 1800 },
  { id: "handCannon", from: 1300, to: 1500, names: ["fireLance"] },
  { id: "pistol", from: 1550, to: 1860, names: ["flintlockPistol", "wheellockPistol"] },
  { id: "revolver", from: 1836, names: ["sixShooter"] },
  { id: "boltRifle", from: 1886, to: 1960, names: ["mauser", "leeEnfield", "springfield"] },
  { id: "submachineGun", from: 1918, names: ["smg", "tommyGun", "ppsh", "mp40"] },
  { id: "machineGun", from: 1884, names: ["maxim", "mg42", "heavyMachineGun"] },
  { id: "assaultRifle", from: 1944, names: ["ak47", "kalashnikov", "m16", "stg44"] },
  { id: "grenade", from: 1915, names: ["handGrenade"], fit: "rigid" as const },
  { id: "stickGrenade", from: 1915, to: 1945, names: ["potatoMasher"] },
  { id: "rocketLauncher", from: 1942, names: ["bazooka", "rpg", "panzerfaust"] },
  { id: "mortarTube", from: 1915, names: ["fieldMortar", "trenchMortar"] },
  { id: "flamethrower", from: 1915 },
];

const blade = `const sword = (L, curve, guard, col, hilt) => { beam([[-0.95, -0.12], [-0.3, -0.12]], 0.13, hilt || leather); ring(-1.0, -0.12, 0.09, gold); if (guard === "cross") beam([[-0.3, -0.42], [-0.3, 0.18]], 0.08, gold); if (guard === "disc") fl(E(-0.3, -0.12, 0.08, 0.2), gold); if (guard === "hand") ln([[-0.3, -0.26], [-0.6, -0.34], [-0.9, -0.22]], 1.2, gold); const p = S([[-0.28, -0.2], [L * 0.5, -0.22 - curve * 0.5], [L, -0.12 - curve], [L * 0.55, -0.02 - curve * 0.35], [-0.28, -0.04]]); fl(p, col || steel); ln([[-0.2, -0.13], [L * 0.8, -0.13 - curve * 0.8]], 0.3, K.shade(col || steel, 0.75)); };
  const gun = (L, stock, mag, col) => { fl(S([[-1.7, -0.32], [-1.15, -0.42], [-0.3, -0.32], [0.2, -0.28], [0.2, -0.1], [-0.3, -0.08], [-1.15, -0.02], [-1.7, 0]]), stock || dark); beam([[0.15, -0.24], [L, -0.24]], 0.08, col || iron); ln([[-0.45, -0.1], [-0.35, 0.06], [-0.15, 0.06]], 0.5); if (mag) fl(P([[-0.05, -0.12], [0.2, -0.12], mag === "curve" ? [0.35, 0.35] : [0.2, 0.3], mag === "curve" ? [0.12, 0.38] : [-0.05, 0.3]]), iron); };`;

const body = `
    case "stoneAxe": beam([[-1.2, -0.1], [0.7, -0.18]], 0.12); fl(S([[0.45, -0.45], [0.95, -0.55], [1.1, -0.2], [0.9, 0.12], [0.5, 0.05]]), stone); ln([[0.55, -0.35], [0.6, 0.0]], 0.8, rope); break;
    case "sling": ln([[-1.0, -0.1], [0.2, -0.15]], 0.8, rope); fl(E(0.35, -0.15, 0.18, 0.12), leather); ln([[0.5, -0.15], [1.2, -0.1]], 0.8, rope); ring(0.35, -0.22, 0.07, stone); break;
    case "javelin": beam([[-2.0, -0.1], [1.7, -0.14]], 0.07); fl(P([[1.7, -0.22], [2.15, -0.14], [1.7, -0.06]]), steel); break;
    case "pilum": beam([[-1.8, -0.12], [0.6, -0.12]], 0.1); beam([[0.6, -0.12], [1.9, -0.12]], 0.035, iron); fl(P([[1.9, -0.18], [2.15, -0.12], [1.9, -0.06]]), steel); fl(rect(0.45, -0.2, 0.65, -0.04), iron); break;
    case "gladius": sword(0.85, 0, "disc", steel, dark); break;
    case "khopesh": beam([[-0.95, -0.12], [-0.1, -0.12]], 0.12, leather); fl(S([[-0.1, -0.2], [0.5, -0.24], [0.9, -0.55], [1.25, -0.4], [1.0, -0.15], [0.55, 0.0], [-0.1, -0.04]]), T("#b88a4a")); break;
    case "trident": beam([[-2.0, -0.12], [1.2, -0.12]], 0.08); beam([[1.2, -0.42], [1.2, 0.18]], 0.06, iron); [-0.36, -0.12, 0.12].forEach((y) => { beam([[1.2, y], [1.75, y]], 0.05, iron); fl(P([[1.75, y - 0.07], [1.9, y], [1.75, y + 0.07]]), iron); }); break;
    case "longsword": sword(1.9, 0, "cross"); break;
    case "greatsword": beam([[-1.4, -0.12], [-0.4, -0.12]], 0.13, leather); sword(2.4, 0, "cross"); break;
    case "falchion": beam([[-0.95, -0.12], [-0.3, -0.12]], 0.13, leather); beam([[-0.3, -0.38], [-0.3, 0.14]], 0.08, gold); fl(S([[-0.28, -0.2], [0.9, -0.22], [1.35, -0.42], [1.4, -0.15], [-0.28, -0.04]]), steel); break;
    case "scimitar": sword(1.4, 0.35, "cross"); break;
    case "sabre": sword(1.55, 0.22, "hand"); break;
    case "katana": beam([[-1.15, -0.12], [-0.3, -0.12]], 0.12, black); for (let i = 0; i < 5; i++) ln([[-1.1 + i * 0.17, -0.18], [-1.02 + i * 0.17, -0.06]], 0.4, white); fl(E(-0.3, -0.12, 0.06, 0.16), gold); sword(1.6, 0.12, "", steel); break;
    case "naginata": beam([[-2.0, -0.12], [0.9, -0.12]], 0.09, black); fl(S([[0.9, -0.2], [1.6, -0.3], [2.1, -0.55], [1.9, -0.15], [0.9, -0.04]]), steel); break;
    case "guandao": beam([[-2.0, -0.12], [0.8, -0.12]], 0.1, red); fl(S([[0.75, -0.18], [1.3, -0.35], [1.9, -0.75], [2.05, -0.3], [1.6, 0.02], [0.75, -0.02]]), steel); ln([[1.2, -0.3], [1.15, -0.55]], 1.0, red); break;
    case "morningstar": beam([[-1.1, -0.12], [0.6, -0.12]], 0.12); ring(0.85, -0.12, 0.28, iron); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; fl(P([[0.85 + Math.cos(a) * 0.24, -0.12 + Math.sin(a) * 0.24 - 0.05], [0.85 + Math.cos(a) * 0.44, -0.12 + Math.sin(a) * 0.44], [0.85 + Math.cos(a) * 0.24 + 0.04, -0.12 + Math.sin(a) * 0.24 + 0.05]]), iron); } break;
    case "flail": beam([[-1.0, -0.12], [0.3, -0.12]], 0.12); for (let i = 0; i < 4; i++) ring(0.4 + i * 0.12, -0.12 + i * 0.1, 0.06, iron); ring(1.0, 0.35, 0.22, iron); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ln([[1.0 + Math.cos(a) * 0.2, 0.35 + Math.sin(a) * 0.2], [1.0 + Math.cos(a) * 0.34, 0.35 + Math.sin(a) * 0.34]], 1.0, iron); } break;
    case "warhammer": beam([[-1.8, -0.12], [1.1, -0.12]], 0.09); fl(rect(0.85, -0.5, 1.15, 0.26), iron); fl(P([[1.15, -0.4], [1.55, -0.12], [1.15, 0.16]]), iron); fl(P([[1.1, -0.2], [1.4, -0.12], [1.1, -0.04]]), steel); break;
    case "lance": fl(P([[-1.9, -0.1], [-1.9, -0.16], [1.9, -0.13], [1.9, -0.13]]), red); fl(S([[-1.4, -0.35], [-1.1, -0.4], [-1.0, -0.12], [-1.1, 0.16], [-1.4, 0.11]]), steel); ln([[-1.9, -0.13], [2.4, -0.13]], 1.0); break;
    case "pike": beam([[-2.6, -0.1], [2.3, -0.12]], 0.06); fl(P([[2.3, -0.2], [2.7, -0.12], [2.3, -0.04]]), steel); break;
    case "longbow": { const p = new Path2D(); p.moveTo(-2.0 * R, -0.12 * R); p.quadraticCurveTo(0, -0.95 * R, 2.0 * R, -0.12 * R); c.lineWidth = 0.12 * R + w * 2; c.strokeStyle = ol; c.stroke(p); c.lineWidth = 0.12 * R; c.strokeStyle = wood; c.stroke(p); ln([[-2.0, -0.12], [2.0, -0.12]], 0.4, white); break; }
    case "compositeBow": { const p = new Path2D(); p.moveTo(-1.2 * R, 0.0); p.quadraticCurveTo(-1.0 * R, -0.35 * R, -0.6 * R, -0.45 * R); p.quadraticCurveTo(0, -0.7 * R, 0.6 * R, -0.45 * R); p.quadraticCurveTo(1.0 * R, -0.35 * R, 1.2 * R, 0); c.lineWidth = 0.13 * R + w * 2; c.strokeStyle = ol; c.stroke(p); c.lineWidth = 0.13 * R; c.strokeStyle = leather; c.stroke(p); ln([[-1.2, 0], [1.2, 0]], 0.4, white); break; }
    case "quiver": fl(S([[-0.3, 0], [-0.38, -1.6], [0.38, -1.7], [0.3, 0]]), leather); for (let i = 0; i < 5; i++) { const x = -0.25 + i * 0.12; beam([[x, -1.6], [x + 0.05, -2.2]], 0.03); fl(P([[x - 0.06, -2.05], [x + 0.05, -2.35], [x + 0.14, -2.05]]), white); } ln([[-0.3, -1.2], [0.3, -1.25]], 0.6, gold); break;
    case "handCannon": beam([[-1.8, -0.12], [0.0, -0.12]], 0.1); fl(S([[0.0, -0.28], [1.1, -0.26], [1.15, 0.02], [0.0, 0.04]]), T("#9a7a4a")); ring(1.15, -0.12, 0.08, black); break;
    case "pistol": fl(S([[-0.9, 0.3], [-0.7, -0.05], [-0.4, -0.25], [0.0, -0.28], [0.0, -0.08], [-0.45, 0.0], [-0.6, 0.35]]), dark); beam([[-0.05, -0.2], [1.0, -0.2]], 0.08, iron); ln([[-0.25, -0.05], [-0.15, 0.1], [0.0, 0.08]], 0.5); fl(P([[-0.3, -0.38], [-0.15, -0.3], [-0.2, -0.24]]), iron); break;
    case "revolver": fl(S([[-0.8, 0.35], [-0.6, -0.05], [-0.35, -0.18], [-0.35, 0.0], [-0.55, 0.38]]), dark); fl(rect(-0.35, -0.32, 0.1, -0.04), iron); for (let i = 0; i < 3; i++) ln([[-0.3 + i * 0.13, -0.32], [-0.3 + i * 0.13, -0.04]], 0.4); beam([[0.1, -0.22], [0.95, -0.22]], 0.08, iron); ln([[-0.3, -0.02], [-0.2, 0.12], [-0.05, 0.1]], 0.5); break;
    case "boltRifle": gun(2.0); ln([[0.0, -0.32], [-0.05, -0.48]], 0.7, iron); ring(-0.05, -0.5, 0.05, iron); break;
    case "submachineGun": gun(1.1, dark, "straight"); beam([[0.3, -0.24], [1.0, -0.24]], 0.14, iron); for (let i = 0; i < 4; i++) ring(0.4 + i * 0.16, -0.24, 0.025, black); break;
    case "machineGun": beam([[-1.0, -0.3], [-0.4, -0.3]], 0.2, iron); fl(rect(-0.5, -0.55, 0.55, -0.05), iron); beam([[0.55, -0.3], [1.9, -0.3]], 0.16, iron); for (let i = 0; i < 5; i++) ln([[0.7 + i * 0.22, -0.4], [0.7 + i * 0.22, -0.2]], 0.4); beam([[0.2, -0.05], [-0.2, 0.35]], 0.05, iron); beam([[0.2, -0.05], [0.6, 0.35]], 0.05, iron); fl(rect(-0.3, -0.05, 0.0, 0.3), olive); break;
    case "assaultRifle": gun(1.5, dark, "curve"); fl(P([[0.25, -0.34], [0.9, -0.32], [0.9, -0.18], [0.25, -0.18]]), dark); break;
    case "grenade": fl(E(0, -0.38, 0.28, 0.36), olive); for (let i = 0; i < 3; i++) ln([[-0.26, -0.55 + i * 0.17], [0.26, -0.55 + i * 0.17]], 0.4); fl(rect(-0.1, -0.85, 0.12, -0.7), iron); ln([[0.12, -0.8], [0.32, -0.6], [0.3, -0.35]], 0.8, iron); ring(-0.15, -0.88, 0.06, iron); break;
    case "stickGrenade": beam([[-1.0, -0.12], [0.3, -0.12]], 0.12); fl(S([[0.3, -0.36], [0.85, -0.36], [0.9, 0.12], [0.3, 0.12]]), olive); break;
    case "rocketLauncher": fl(rect(-1.6, -0.36, 1.4, -0.06), olive); fl(P([[1.4, -0.42], [1.7, -0.5], [1.7, 0.02], [1.4, -0.0]]), olive); fl(rect(-0.2, -0.06, 0.0, 0.3), dark); fl(rect(0.3, -0.06, 0.45, 0.22), dark); ring(-1.6, -0.21, 0.13, black); break;
    case "mortarTube": beam([[-0.5, 0.0], [0.9, -1.5]], 0.22, olive); ring(0.92, -1.53, 0.09, black); beam([[0.2, -0.75], [0.7, 0.0]], 0.05, iron); beam([[0.2, -0.75], [-0.05, 0.0]], 0.05, iron); fl(E(-0.55, 0.0, 0.45, 0.08), iron); break;
    case "flamethrower": fl(rect(-1.5, -0.95, -1.15, 0.0), olive); fl(rect(-1.1, -0.95, -0.75, 0.0), olive); ln([[-0.95, -0.5], [-0.6, -0.35], [0.0, -0.3]], 1.4, black); beam([[-0.1, -0.3], [1.3, -0.3]], 0.1, iron); fl(rect(0.0, -0.3, 0.12, 0.0), dark); if (o.firing) flame(1.8, -0.2, 0.6); break;`;

export const MOTION_LIBRARY_ARMS: MotionLibraryPart = { part: "lib_arms", fn: "prop", items, js: motionLibraryPart(items, body, 0, blade) };
