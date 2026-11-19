import { motionLibraryPart, type MotionLibraryPart } from "./common.js";
const items = [
  { id: "roundShield", to: 1500, names: ["vikingShield"], fit: "rigid" as const },
  { id: "kiteShield", from: 1000, to: 1250, names: ["normanShield"] },
  { id: "heaterShield", from: 1200, to: 1500, names: ["knightShield"] },
  { id: "scutum", from: -300, to: 300, names: ["romanShield"] },
  { id: "hopliteShield", from: -700, to: -100, names: ["aspis", "greekShield"], fit: "rigid" as const },
  { id: "rattanShield", from: 1000, to: 1900, names: ["caneShield"], fit: "rigid" as const },
  { id: "chainmail", from: -300, to: 1600, names: ["mailShirt", "hauberk"] },
  { id: "plateArmor", from: 1350, to: 1650, names: ["suitOfArmor", "fullPlate"] },
  { id: "lamellar", from: -500, to: 1700, names: ["lamellarArmor", "scaleArmor"] },
  { id: "samuraiArmor", from: 900, to: 1870, names: ["yoroi", "oYoroi"] },
  { id: "caltrops", to: 1950, names: ["caltrop"], fit: "ground" as const },
  { id: "punjiSticks", from: 1940, to: 1975, names: ["punjiTrap", "spikeTrap"], fit: "ground" as const },
  { id: "tankTrap", from: 1935, to: 1960, names: ["czechHedgehog", "hedgehog"] },
  { id: "foxhole", from: 1914, names: ["rifleTrench"], fit: "ground" as const },
  { id: "tunnelEntrance", names: ["tunnel", "tunnelHatch"], fit: "ground" as const },
  { id: "earthwork", names: ["rampartMound", "earthenWall"], fit: "ground" as const },
  { id: "stakeRow", to: 1918, names: ["stakes", "sharpenedStakes", "stakeLine", "archerStakes", "chevalDeFrise", "spikedStakes"], fit: "ground" as const },
  { id: "minefieldSign", from: 1915, names: ["mineSign"] },
  { id: "hitchingPost", names: ["horsePost"] },
  { id: "supplyCrates", names: ["supplies", "crateStack"] },
  { id: "ammoBox", from: 1850, names: ["ammunitionBox", "ammoCrate"] },
  { id: "fieldTelephone", from: 1914, to: 1975 },
  { id: "radioSet", from: 1930, to: 1990, names: ["fieldRadio", "walkieTalkie"] },
  { id: "flagPole" },
  { id: "signalFire", to: 1900, names: ["beacon", "beaconFire"] },
  { id: "brokenWheel" },
  { id: "fallenBanner", names: ["tornFlag"], fit: "ground" as const },
  { id: "scatteredWeapons", names: ["droppedWeapons", "battlefieldDebris"], fit: "ground" as const },
  { id: "crater", from: 1850, names: ["shellCrater", "bombCrater"], fit: "ground" as const },
  { id: "stretcher", names: ["litterStretcher"], fit: "ground" as const },
  { id: "grave", names: ["fieldGrave", "freshGrave"], fit: "ground" as const },
  { id: "bodyCovered", names: ["coveredBody", "shroud"], fit: "ground" as const },
];
const helpers = `const stand = (h) => { beam([[0, 0], [0, -h]], 0.07); beam([[-0.45, 0], [0.45, 0]], 0.08); beam([[-0.5, -h + 0.25], [0.5, -h + 0.25]], 0.06); };
  const flag = (x, y, col) => { const wv = Math.sin(t * 3) * 0.08; fl(S([[x, y], [x + 0.6, y + wv], [x + 1.2, y - 0.05], [x + 1.15, y + 0.5], [x + 0.6, y + 0.55 + wv], [x, y + 0.5]]), col || red, { hatch: false }); };`;
const body = `
    case "roundShield": ring(0, -1.0, 1.0, wood); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ln([[0, -1.0], [Math.cos(a) * 0.95, -1.0 + Math.sin(a) * 0.95]], 0.4, dark); } ring(0, -1.0, 0.25, iron); break;
    case "kiteShield": fl(S([[-0.6, -2.2], [0.6, -2.2], [0.65, -1.4], [0, 0], [-0.65, -1.4]]), T("#d8cfb8")); fl(S([[-0.12, -2.15], [0.12, -2.15], [0.1, -0.4], [-0.1, -0.4]]), red, { hatch: false }); break;
    case "heaterShield": fl(S([[-0.7, -1.6], [0.7, -1.6], [0.68, -0.9], [0, 0], [-0.68, -0.9]]), blue); fl(P([[-0.7, -1.6], [0, -1.6], [0, -0.05], [-0.4, -0.5], [-0.68, -0.9]]), T("#e8d8a8"), { hatch: false }); break;
    case "scutum": fl(S([[-0.55, -2.0], [0.55, -2.0], [0.6, -1.0], [0.55, 0], [-0.55, 0], [-0.6, -1.0]]), red); ring(0, -1.0, 0.18, gold); ln([[0, -1.9], [0, -0.1]], 0.6, gold); ln([[-0.5, -1.0], [0.5, -1.0]], 0.6, gold); break;
    case "hopliteShield": ring(0, -0.95, 0.95, T("#b88a3a")); ring(0, -0.95, 0.78, red); fl(P([[-0.25, -1.3], [0.25, -1.3], [0, -0.55]]), T("#e8d8a8"), { hatch: false }); break;
    case "rattanShield": ring(0, -0.9, 0.9, straw); for (let r = 0.2; r < 0.9; r += 0.14) { const p = new Path2D(); p.arc(0, -0.9 * R, r * R, 0, Math.PI * 2); c.lineWidth = w * 0.4; c.strokeStyle = ol; c.stroke(p); } ring(0, -0.9, 0.18, wood); break;
    case "chainmail": stand(2.4); fl(S([[-0.6, -2.15], [0.6, -2.15], [0.75, -1.0], [0.7, -0.35], [-0.7, -0.35], [-0.75, -1.0]]), steel); clip(S([[-0.6, -2.15], [0.6, -2.15], [0.75, -1.0], [0.7, -0.35], [-0.7, -0.35], [-0.75, -1.0]]), () => { for (let y = -2.1; y < -0.3; y += 0.12) for (let x = -0.75; x < 0.75; x += 0.12) { const p = new Path2D(); p.arc((x + (Math.round(y * 10) % 2 ? 0.06 : 0)) * R, y * R, 0.045 * R, 0, Math.PI); c.lineWidth = w * 0.35; c.strokeStyle = ol; c.stroke(p); } }); break;
    case "plateArmor": stand(2.8); fl(S([[-0.45, -2.55], [0.45, -2.55], [0.5, -2.85], [0, -3.05], [-0.5, -2.85]]), steel); fl(S([[-0.65, -2.35], [0.65, -2.35], [0.55, -1.35], [-0.55, -1.35]]), steel); ln([[0, -2.3], [0, -1.4]], 0.5); [-1, 1].forEach((s) => fl(E(s * 0.72, -2.25, 0.25, 0.2), steel)); fl(S([[-0.5, -1.35], [0.5, -1.35], [0.6, -0.9], [-0.6, -0.9]]), K.shade(steel, 0.9)); break;
    case "lamellar": stand(2.4); { const p = S([[-0.6, -2.15], [0.6, -2.15], [0.72, -0.5], [-0.72, -0.5]]); fl(p, T("#8a5a3a")); clip(p, () => { for (let y = -2.1; y < -0.5; y += 0.2) { ln([[-0.8, y], [0.8, y]], 0.4); for (let x = -0.7; x < 0.8; x += 0.14) ln([[x + (Math.round(y * 5) % 2 ? 0.07 : 0), y], [x + (Math.round(y * 5) % 2 ? 0.07 : 0), y + 0.2]], 0.3); } }); } break;
    case "samuraiArmor": stand(2.5); fl(S([[-0.55, -2.35], [0.55, -2.35], [0.6, -1.4], [-0.6, -1.4]]), black); for (let i = 0; i < 4; i++) fl(rect(-0.75 + (i % 2) * 0.05, -1.4 + i * 0.22, 0.75, -1.2 + i * 0.22), i % 2 ? red : black, { hatch: false }); [-1, 1].forEach((s) => fl(S([[s * 0.55, -2.35], [s * 1.05, -2.2], [s * 1.0, -1.65], [s * 0.6, -1.75]]), red)); fl(S([[-0.4, -2.4], [0.4, -2.4], [0.5, -2.75], [0, -2.95], [-0.5, -2.75]]), black); fl(P([[-0.35, -2.85], [0, -3.35], [0.35, -2.85]]), gold); break;
    case "caltrops": for (let i = 0; i < 5; i++) { const x = -0.9 + i * 0.45, y = -0.05 - rnd(i) * 0.1; [[0, -0.3], [-0.22, 0.05], [0.22, 0.05], [0, -0.05]].forEach(([dx, dy]) => ln([[x, y], [x + dx, y + dy]], 1.0, iron)); } break;
    case "punjiSticks": fl(E(0, 0, 1.6, 0.18), T("#5a4a32")); for (let i = 0; i < 11; i++) { const x = -1.4 + i * 0.28, h = 0.55 + rnd(i) * 0.3; fl(P([[x - 0.05, 0], [x + 0.03, -h], [x + 0.08, 0]]), T("#b8a46a")); } break;
    case "tankTrap": [[-0.9, 0, 0.9, -1.4], [0.9, 0, -0.9, -1.4], [0, -1.45, 0, 0.05]].forEach(([a, b, c0, d]) => beam([[a, b], [c0, d]], 0.18, iron)); break;
    case "foxhole": fl(E(0, 0, 1.3, 0.3), T("#4a3a2a")); for (let i = 0; i < 6; i++) fl(E(-1.3 + i * 0.52, -0.12, 0.3, 0.17), T("#b8a47a")); break;
    case "tunnelEntrance": fl(S([[-1.0, 0], [-0.9, -0.5], [0.9, -0.5], [1.0, 0]]), T("#6a5a42")); fl(E(0, -0.12, 0.55, 0.28), black, { hatch: false }); [-0.6, 0.6].forEach((x) => beam([[x, 0], [x, -0.45]], 0.08)); beam([[-0.7, -0.45], [0.7, -0.45]], 0.08); break;
    case "stakeRow": beam([[-2.3, -0.35], [2.3, -0.35]], 0.06, dark); for (let i = 0; i < 7; i++) { const x = -2.1 + i * 0.7, h = 1.25 + rnd(i) * 0.2; fl(P([[x - 0.09, 0], [x + 0.09, 0], [x + 0.55, -h + 0.18], [x + 0.62, -h]]), wood); ln([[x + 0.43, -h + 0.32], [x + 0.6, -h + 0.04]], 0.5, T("#e0caa0")); } fl(E(0, 0.02, 2.4, 0.12), T(night ? "#4a3e30" : "#7a6448")); break;
    case "earthwork": fl(S([[-2.4, 0], [-1.6, -1.0], [1.6, -1.05], [2.4, 0]]), T(night ? "#5a4a36" : "#8a7452")); for (let i = 0; i < 12; i++) ln([[-1.8 + i * 0.32, -0.95 + rnd(i) * 0.1], [-1.75 + i * 0.32, -1.08]], 0.6, green); break;
    case "minefieldSign": beam([[0, 0], [0, -1.6]], 0.08); fl(P([[-0.55, -1.95], [0.55, -1.95], [0, -1.3]]), T("#e8c43a")); ln([[-0.15, -1.7], [0.15, -1.7]], 1.2); break;
    case "hitchingPost": [-1.0, 1.0].forEach((x) => beam([[x, 0], [x, -1.4]], 0.12)); beam([[-1.15, -1.3], [1.15, -1.3]], 0.1); for (let i = 0; i < 3; i++) ring(-0.6 + i * 0.6, -1.25, 0.06, iron); break;
    case "supplyCrates": [[-0.7, 0, 1.3], [0.65, 0, 1.2], [0, -1.2, 1.1]].forEach(([x, y, s]) => { fl(rect(x - s / 2, y - s * 0.9, x + s / 2, y), wood); ln([[x - s / 2, y - s * 0.9], [x + s / 2, y]], 0.5); ln([[x - s / 2, y], [x + s / 2, y - s * 0.9]], 0.5); }); break;
    case "ammoBox": fl(rect(-0.7, -0.55, 0.7, 0), olive); fl(rect(-0.72, -0.65, 0.72, -0.5), K.shade(olive, 0.85)); ln([[-0.4, -0.65], [-0.2, -0.85], [0.2, -0.85], [0.4, -0.65]], 0.8, iron); ln([[-0.45, -0.3], [0.45, -0.3]], 1.2, T("#e8c43a")); break;
    case "fieldTelephone": fl(rect(-0.6, -0.8, 0.6, 0), T("#5a4a32")); fl(S([[-0.45, -1.05], [-0.3, -0.85], [0.3, -0.85], [0.45, -1.05], [0.3, -0.98], [-0.3, -0.98]]), black); ring(0.7, -0.4, 0.15, iron); ln([[0.55, -0.4], [0.3, -0.4]], 0.8, iron); break;
    case "radioSet": fl(rect(-0.65, -1.2, 0.65, 0), olive); for (let i = 0; i < 3; i++) ring(-0.35 + i * 0.35, -0.85, 0.11, black); fl(rect(-0.5, -0.5, 0.5, -0.2), black); beam([[0.5, -1.2], [0.7, -2.6]], 0.03, iron); break;
    case "flagPole": beam([[0, 0], [0, -4.2]], 0.07, iron); ring(0, -4.25, 0.08, gold); flag(0.03, -4.1, o.color ? T(o.color) : red); break;
    case "signalFire": [[-0.5, 0.2], [0.5, -0.2], [0, 0]].forEach(([x, a]) => { c.save(); c.rotate(a); fl(rect(x - 0.6, -0.25, x + 0.6, 0), dark); c.restore(); }); glow(0, -1.0, 2.2); flame(0, -0.2, 1.1); if (o.smoking) smoke(0, -2.4, 1.0); break;
    case "brokenWheel": fl(S([[-0.9, 0], [-0.85, -0.6], [-0.3, -1.05], [0.3, -0.98], [0.15, -0.6], [-0.2, -0.15], [0.3, 0]]), K.shade(wood, 0.85)); ring(-0.3, -0.45, 0.16, dark); [[0.1, -0.5, 0.75, -0.45], [-0.3, -0.45, -0.75, -0.9], [-0.3, -0.45, 0.5, 0.0]].forEach(([a, b, c0, d]) => beam([[a, b], [c0, d]], 0.07, dark)); break;
    case "fallenBanner": beam([[-1.8, -0.05], [1.0, -0.2]], 0.07); fl(S([[0.9, -0.2], [1.8, -0.1], [2.1, 0.0], [1.4, 0.05], [0.9, 0.0]]), o.color ? T(o.color) : red, { hatch: false }); break;
    case "scatteredWeapons": beam([[-1.6, -0.06], [0.2, -0.16]], 0.06); fl(P([[0.2, -0.22], [0.5, -0.16], [0.2, -0.1]]), steel); fl(S([[-0.4, -0.3], [0.9, -0.36], [0.95, -0.25], [-0.4, -0.2]]), steel); ring(1.3, -0.4, 0.4, wood); ring(1.3, -0.4, 0.12, iron); fl(E(-1.0, -0.2, 0.35, 0.2), steel); break;
    case "crater": fl(E(0, 0, 2.0, 0.35), T(night ? "#3a3026" : "#5a4a36")); fl(E(0, 0.02, 1.4, 0.2), T("#2a2018"), { hatch: false }); for (let i = 0; i < 8; i++) fl(E(-1.9 + i * 0.55, -0.15 - rnd(i) * 0.12, 0.25, 0.12), T(night ? "#4a3e30" : "#7a6448")); break;
    case "stretcher": [-1.4, 1.4].forEach((x) => beam([[x - 0.3, -0.5], [x + 0.3, -0.5]], 0.06)); beam([[-1.7, -0.5], [1.7, -0.5]], 0.07); fl(rect(-1.1, -0.62, 1.1, -0.45), cloth); [-1.0, 1.0].forEach((x) => beam([[x, -0.45], [x, 0]], 0.05)); break;
    case "grave": fl(S([[-1.1, 0], [-0.9, -0.35], [0.9, -0.35], [1.1, 0]]), T(night ? "#4a3e30" : "#7a6448")); beam([[-0.7, 0], [-0.7, -1.4]], 0.08); beam([[-1.0, -1.05], [-0.4, -1.05]], 0.07); break;
    case "bodyCovered": fl(S([[-1.4, 0], [-1.35, -0.35], [-0.8, -0.5], [0.6, -0.42], [1.2, -0.5], [1.45, -0.2], [1.4, 0]]), cloth); for (let i = 0; i < 4; i++) ln([[-0.9 + i * 0.5, -0.45], [-0.8 + i * 0.5, -0.05]], 0.35); break;`;
export const MOTION_LIBRARY_WAR: MotionLibraryPart = { part: "lib_war", fn: "prop", items, js: motionLibraryPart(items, body, 1, helpers) };
const flying = [
  { id: "arrow", to: 1900, names: ["flyingArrow", "shotArrow", "arrowShot", "arrowInFlight"] },
  { id: "bolt", from: -400, to: 1650, names: ["crossbowBolt", "quarrel", "flyingBolt", "bolts"] },
  { id: "thrownSpear", to: 1700, names: ["thrownJavelin", "flyingJavelin", "flyingSpear", "spearThrown", "javelinThrown"] },
  { id: "cannonShot", from: 1350, to: 1900, names: ["flyingCannonball", "cannonballInFlight", "cannonShell"] },
  { id: "slingStone", to: 1700, names: ["thrownStone", "flyingStone", "catapultStone", "flyingRock"] },
  { id: "fireArrow", to: 1900, names: ["flamingArrow", "burningArrow", "fireArrows"] },
  { id: "arrowVolley", to: 1900, names: ["volley", "arrowRain", "arrowsInFlight", "arrowStorm", "arrowShower"] },
];
const flyingBody = `
    case "arrow": beam([[-1.6, -0.5], [1.2, -0.5]], 0.05, wood); fl(P([[1.2, -0.62], [1.6, -0.5], [1.2, -0.38]]), iron); [[-1.6, -0.62], [-1.6, -0.38]].forEach(([x, y]) => fl(P([[x, y], [x + 0.45, -0.5], [x + 0.15, y]]), cloth, { hatch: false })); if (moving) streak(-1.7, -0.5, 1.1, 2); break;
    case "bolt": beam([[-0.95, -0.5], [0.7, -0.5]], 0.08, wood); fl(P([[0.7, -0.66], [1.15, -0.5], [0.7, -0.34]]), iron); [[-0.95, -0.62], [-0.95, -0.38]].forEach(([x, y]) => fl(P([[x, y], [x + 0.3, -0.5], [x + 0.08, y]]), dark, { hatch: false })); if (moving) streak(-1.05, -0.5, 1.0, 2); break;
    case "thrownSpear": beam([[-2.4, -0.5], [1.7, -0.5]], 0.08, wood); fl(P([[1.6, -0.62], [1.95, -0.64], [2.45, -0.5], [1.95, -0.36], [1.6, -0.38]]), steel); if (moving) streak(-2.5, -0.5, 1.2, 2); break;
    case "cannonShot": fl(E(0.6, -0.5, 0.42, 0.42), iron); if (moving) streak(0.1, -0.5, 2.2, 3); break;
    case "slingStone": fl(S([[0.2, -0.85], [0.75, -0.8], [0.95, -0.45], [0.7, -0.15], [0.2, -0.18], [0.0, -0.5]]), stone); if (moving) streak(-0.05, -0.5, 1.8, 3); break;
    case "fireArrow": { c.save(); beam([[-1.6, -0.5], [1.2, -0.5]], 0.05, wood); fl(P([[1.2, -0.62], [1.6, -0.5], [1.2, -0.38]]), iron); [[-1.6, -0.62], [-1.6, -0.38]].forEach(([x, y]) => fl(P([[x, y], [x + 0.45, -0.5], [x + 0.15, y]]), red, { hatch: false })); glow(1.25, -0.5, 1.0); flame(1.15, -0.35, 0.45); c.restore(); break; }
    case "arrowVolley": for (let i = 0; i < 14; i++) { const x = -2.2 + (i % 7) * 0.7 + rnd(i) * 0.25, y = -0.6 - Math.floor(i / 7) * 0.9 - rnd(i + 9) * 0.5; c.save(); c.translate(x * R, y * R); c.rotate(0.45); beam([[-0.7, 0], [0.5, 0]], 0.03, wood); fl(P([[0.5, -0.07], [0.72, 0], [0.5, 0.07]]), iron); fl(P([[-0.7, -0.08], [-0.45, 0], [-0.7, 0.08]]), cloth, { hatch: false }); c.restore(); } break;`;
const flyingHelpers = `const streak = (x, y, len, n) => { for (let i = 0; i < n; i++) { const dy = (i - (n - 1) / 2) * 0.22; c.save(); c.globalAlpha *= 0.55; ln([[x, y + dy], [x - len * (1 - Math.abs(dy)), y + dy]], 0.35); c.restore(); } };`;
export const MOTION_LIBRARY_WAR_FLYING: MotionLibraryPart = { part: "lib_warFlying", fn: "prop", items: flying, js: motionLibraryPart(flying, flyingBody, 0, flyingHelpers) };
