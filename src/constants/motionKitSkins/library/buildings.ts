import { motionLibraryPart, type MotionLibraryPart } from "./common.js";
const items = [
  { id: "cave", to: -3000, names: ["caveDwelling", "rockShelter"] },
  { id: "hideTent", to: 1900, names: ["teepee", "tipi", "wigwam", "skinTent"] },
  { id: "igloo", names: ["snowHouse"] },
  { id: "adobeHouse", names: ["mudBrickHouse", "pueblo"] },
  { id: "romanVilla", from: -200, to: 450, names: ["villa", "domus"] },
  { id: "insula", from: -150, to: 450, names: ["romanApartment"] },
  { id: "halfTimberHouse", from: 1300, to: 1800, names: ["tudorHouse", "timberFramedHouse", "fachwerk"] },
  { id: "townhouse", from: 1600, to: 1950, names: ["rowHouse", "terraceHouse"] },
  { id: "shophouse", from: 1800, names: ["streetShop"] },
  { id: "tubeHouse", from: 1990, names: ["nhaOng", "narrowHouse"] },
  { id: "frenchVilla", from: 1880, to: 1960, names: ["colonialVilla", "colonialHouse"] },
  { id: "apartmentBlock", from: 1920, names: ["apartment", "flats", "khuTapThe"] },
  { id: "machiya", from: 1300, to: 1950, names: ["japaneseHouse", "minka"] },
  { id: "siheyuan", from: 1000, to: 1950, names: ["courtyardHouse", "chineseHouse"] },
  { id: "hanok", from: 1300, to: 1950, names: ["koreanHouse"] },
  { id: "logCabin", from: 1600, names: ["cabin"] },
  { id: "palace", from: 1500, names: ["royalPalace", "chateau", "mansion"] },
  { id: "imperialPalace", from: -200, to: 1945, names: ["citadelPalace", "forbiddenCity", "thaiHoaPalace"] },
  { id: "cathedral", from: 1100, names: ["gothicCathedral", "basilica"] },
  { id: "torii", from: 700, names: ["shintoGate", "toriiGate"] },
  { id: "stupa", from: -300, names: ["dagoba", "chedi"] },
  { id: "ziggurat", from: -3000, to: -500 },
  { id: "amphitheater", from: -100, to: 500, names: ["colosseum", "arena"] },
  { id: "aqueduct", from: -300, to: 1900 },
  { id: "marketHall", from: 1200, names: ["coveredMarket", "bazaar"] },
  { id: "inn", from: -500, to: 1950, names: ["tavern", "pub", "saloon"] },
  { id: "teahouse", from: 800 },
  { id: "school", from: 1700, names: ["schoolhouse"] },
  { id: "hospital", from: 1800, names: ["clinic"] },
  { id: "railwayStation", from: 1830, names: ["trainStation", "station"] },
  { id: "bank", from: 1700 },
  { id: "townHall", from: 1300, names: ["cityHall"] },
  { id: "prison", from: 1700, names: ["jail", "gaol"] },
  { id: "warehouse", from: 1700, names: ["depot", "godown"] },
  { id: "dock", names: ["wharf", "quay", "jetty"] },
  { id: "waterTower", from: 1850 },
  { id: "powerPlant", from: 1890, names: ["powerStation"] },
  { id: "oilRig", from: 1947, names: ["oilPlatform"] },
  { id: "oilDerrick", from: 1859, names: ["oilWell"] },
  { id: "fieldHospitalTent", from: 1850, names: ["redCrossTent", "medicalTent"] },
];
const helpers = `const wall = (x0, y0, x1, y1, col, pat) => { const p = rect(x0, y0, x1, y1); fl(p, col); clip(p, () => { if (pat === "brick") for (let r = 0, y = y1; y > y0; r++, y -= 0.22) { ln([[x0, y], [x1, y]], 0.3); for (let x = x0 + (r % 2 ? 0.2 : 0); x < x1; x += 0.4) ln([[x, y], [x, y - 0.22]], 0.3); } if (pat === "stone") for (let r = 0, y = y1; y > y0; r++, y -= 0.3) { ln([[x0, y], [x1, y]], 0.35); for (let x = x0 + (r % 2 ? 0.3 : 0); x < x1; x += 0.6) ln([[x, y], [x, y - 0.3]], 0.35); } if (pat === "plank") for (let x = x0; x < x1; x += 0.3) ln([[x, y0], [x, y1]], 0.35); if (pat === "log") for (let y = y1; y > y0; y -= 0.28) { ln([[x0, y], [x1, y]], 0.5); } }); return p; };
  const gable = (x0, x1, y, h, col) => fl(P([[x0 - 0.2, y], [(x0 + x1) / 2, y - h], [x1 + 0.2, y]]), col);
  const hip = (x0, x1, y, h, col) => fl(P([[x0 - 0.25, y], [x0 + 0.4, y - h], [x1 - 0.4, y - h], [x1 + 0.25, y]]), col);
  const asian = (x0, x1, y, h, col) => { const p = S([[x0 - 0.5, y - 0.15], [x0 - 0.55, y - 0.15], [x0 - 0.1, y - 0.3], [x0 + 0.5, y - h], [x1 - 0.5, y - h], [x1 + 0.1, y - 0.3], [x1 + 0.55, y - 0.15], [x1 + 0.5, y - 0.15], [x1, y + 0.05], [x0, y + 0.05]]); fl(p, col); clip(p, () => { for (let x = x0 - 0.5; x < x1 + 0.6; x += 0.18) ln([[x, y - h - 0.1], [x, y + 0.1]], 0.3); }); ln([[x0 + 0.45, y - h], [x1 - 0.45, y - h]], 1.2); };
  const door = (x, wd, h, col, arch) => fl(arch ? S([[x - wd / 2, 0], [x - wd / 2, -h + wd / 2], [x, -h], [x + wd / 2, -h + wd / 2], [x + wd / 2, 0]]) : rect(x - wd / 2, -h, x + wd / 2, 0), col || dark);
  const win = (x, y, wd, h, arch) => { fl(arch ? S([[x - wd / 2, y + h / 2], [x - wd / 2, y - h / 2 + wd / 2], [x, y - h / 2], [x + wd / 2, y - h / 2 + wd / 2], [x + wd / 2, y + h / 2]]) : rect(x - wd / 2, y - h / 2, x + wd / 2, y + h / 2), night ? T("#f2d27a") : glass, { hatch: false }); ln([[x, y - h / 2], [x, y + h / 2]], 0.35); };
  const cols = (x0, x1, n, y0, y1, col) => { for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * i / (n - 1); fl(rect(x - 0.12, y0, x + 0.12, y1), col || white); } };
  const flatRoof = (x0, x1, y, col) => fl(rect(x0 - 0.1, y - 0.18, x1 + 0.1, y), col || K.shade(stone, 0.85));
  const plaster = T(night ? "#a8a090" : "#e4dac4"), cream = T(night ? "#b8b0a0" : "#efe2c4"), concrete = T(night ? "#7a7a7a" : "#a8a8a4"), snow = T("#eef2f6"), mud = T(night ? "#7a6450" : "#c09a6a");`;
const body = `
    case "cave": fl(S([[-2.4, 0], [-2.3, -1.6], [-1.4, -2.7], [0.4, -3.0], [1.9, -2.4], [2.5, -1.2], [2.5, 0]]), T(night ? "#6a645c" : "#9a9288")); fl(S([[-1.0, 0], [-1.0, -1.1], [-0.4, -1.65], [0.4, -1.6], [1.0, -1.0], [1.0, 0]]), black, { hatch: false }); ln([[-1.9, -2.0], [-1.2, -1.5]], 0.5); ln([[1.4, -2.2], [2.0, -1.7]], 0.5); break;
    case "hideTent": fl(P([[-1.4, 0], [0, -3.0], [1.4, 0]]), leather); for (let i = 0; i < 4; i++) ln([[0, -3.0], [-1.4 + i * 0.93, 0]], 0.35); [-0.2, 0.2].forEach((dx) => beam([[dx, -2.9], [dx * 4, -3.6]], 0.05)); fl(P([[-0.4, 0], [0, -1.0], [0.4, 0]]), black, { hatch: false }); ln([[-0.6, -1.6], [0.6, -1.6]], 0.8, red); break;
    case "igloo": { const p = S([[-1.8, 0], [-1.6, -1.2], [0, -1.9], [1.6, -1.2], [1.8, 0]]); fl(p, snow); clip(p, () => { for (let y = -0.4; y > -2.0; y -= 0.4) ln([[-2, y], [2, y]], 0.4); for (let i = 0; i < 10; i++) ln([[-1.8 + i * 0.4, 0], [-1.6 + i * 0.4, -0.4]], 0.4); }); fl(S([[1.0, 0], [1.1, -0.65], [1.7, -0.75], [2.2, -0.6], [2.3, 0]]), snow); fl(S([[1.75, 0], [1.75, -0.35], [2.05, -0.4], [2.05, 0]]), black, { hatch: false }); break; }
    case "adobeHouse": fl(S([[-1.7, 0], [-1.7, -2.2], [1.7, -2.2], [1.7, 0]]), mud); flatRoof(-1.7, 1.7, -2.2, K.shade(mud, 0.85)); for (let i = 0; i < 5; i++) beam([[-1.4 + i * 0.7, -2.0], [-1.4 + i * 0.7 - 0.3, -2.0]], 0.08); door(0, 0.6, 1.1, dark); win(-1.0, -1.3, 0.35, 0.35); win(1.0, -1.3, 0.35, 0.35); break;
    case "romanVilla": wall(-2.6, -1.8, 2.6, 0, plaster); hip(-2.6, 2.6, -1.8, 0.7, tile); cols(-1.4, 1.4, 5, -1.7, 0, white); door(0, 0.7, 1.3, dark); break;
    case "insula": wall(-1.6, -4.6, 1.6, 0, brick, "brick"); hip(-1.6, 1.6, -4.6, 0.5, tile); for (let r = 0; r < 4; r++) for (let i = 0; i < 3; i++) win(-1.0 + i, -3.9 + r * 0.95, 0.35, 0.45); fl(rect(-1.6, -1.0, 1.6, -0.9), wood); break;
    case "halfTimberHouse": wall(-1.6, -3.4, 1.6, 0, cream); [[-1.6, -1.6], [-0.55, -0.55], [0.55, 0.55], [1.6, 1.6]].forEach(([a]) => beam([[a, 0], [a, -3.4]], 0.12, dark)); beam([[-1.6, -1.7], [1.6, -1.7]], 0.12, dark); [[-1.6, -1.7, -0.55, -3.4], [0.55, -3.4, 1.6, -1.7], [-1.6, 0, -0.55, -1.7], [1.6, 0, 0.55, -1.7]].forEach(([a, b, c0, d]) => beam([[a, b], [c0, d]], 0.1, dark)); gable(-1.7, 1.7, -3.4, 1.5, tile); door(0, 0.6, 1.2, wood); win(0, -2.5, 0.5, 0.5); break;
    case "townhouse": wall(-1.1, -4.4, 1.1, 0, brick, "brick"); flatRoof(-1.1, 1.1, -4.4); for (let r = 0; r < 3; r++) [-0.5, 0.5].forEach((x) => win(x, -3.7 + r * 1.05, 0.4, 0.6)); door(0, 0.55, 1.0, T("#2a3a5a")); fl(rect(-0.4, -1.05, 0.4, -1.0), stone); break;
    case "shophouse": wall(-1.2, -4.0, 1.2, 0, cream); flatRoof(-1.2, 1.2, -4.0); [-0.45, 0.45].forEach((x) => win(x, -3.2, 0.5, 0.75, true)); fl(rect(-1.25, -2.3, 1.25, -2.15), dark); fl(P([[-1.3, -1.6], [1.3, -1.6], [1.4, -1.9], [-1.4, -1.9]]), red); fl(rect(-1.0, -1.5, 1.0, 0), dark); fl(rect(-0.8, -1.1, 0.8, -0.6), T("#c9a24a")); break;
    case "tubeHouse": wall(-0.8, -5.4, 0.8, 0, T("#e8e0a8")); flatRoof(-0.8, 0.8, -5.4); for (let r = 0; r < 4; r++) { fl(rect(-0.85, -4.6 + r * 1.15, 0.85, -4.5 + r * 1.15), dark); win(0, -5.0 + r * 1.15, 0.9, 0.55); } fl(rect(-0.7, -0.95, 0.7, 0), concrete); for (let i = 0; i < 6; i++) ln([[-0.7, -0.85 + i * 0.15], [0.7, -0.85 + i * 0.15]], 0.3); break;
    case "frenchVilla": wall(-2.2, -3.0, 2.2, 0, T(night ? "#a89a6a" : "#e8d48a")); hip(-2.3, 2.3, -3.0, 1.0, tile); [-1.4, -0.45, 0.45, 1.4].forEach((x) => { win(x, -2.2, 0.45, 0.8, true); fl(rect(x - 0.38, -2.6, x - 0.24, -1.8), green); fl(rect(x + 0.24, -2.6, x + 0.38, -1.8), green); }); fl(rect(-2.2, -1.5, 2.2, -1.38), white); door(0, 0.7, 1.2, green, true); break;
    case "apartmentBlock": wall(-2.4, -5.2, 2.4, 0, concrete); flatRoof(-2.4, 2.4, -5.2); for (let r = 0; r < 5; r++) for (let i = 0; i < 5; i++) win(-1.9 + i * 0.95, -4.7 + r * 0.95, 0.5, 0.5); fl(rect(-0.4, -0.9, 0.4, 0), dark); break;
    case "machiya": wall(-1.8, -2.0, 1.8, 0, T("#6a4a32"), "plank"); asian(-1.8, 1.8, -2.0, 0.8, T("#4a4c52")); for (let i = 0; i < 8; i++) ln([[-1.6 + i * 0.45, -1.8], [-1.6 + i * 0.45, -0.3]], 0.6, T("#3a2a1e")); fl(rect(-0.4, -1.4, 0.4, 0), T("#2a1e16")); fl(rect(-0.3, -1.4, 0.3, -1.0), white, { hatch: false }); break;
    case "siheyuan": wall(-2.6, -1.5, 2.6, 0, T("#8a8a90"), "brick"); asian(-2.6, 2.6, -1.5, 0.6, T("#4a4c52")); fl(rect(-0.5, -1.8, 0.5, 0), red); asian(-0.7, 0.7, -1.9, 0.35, T("#3a3c42")); door(0, 0.7, 1.2, red); break;
    case "hanok": wall(-2.0, -1.4, 2.0, 0, white); for (let i = 0; i < 5; i++) beam([[-1.8 + i * 0.9, 0], [-1.8 + i * 0.9, -1.4]], 0.1, wood); fl(rect(-2.2, 0, 2.2, 0.15), stone); asian(-2.0, 2.0, -1.4, 0.9, T("#3a3c42")); door(0, 0.7, 1.0, wood); break;
    case "logCabin": wall(-1.8, -2.0, 1.8, 0, wood, "log"); gable(-1.9, 1.9, -2.0, 1.1, dark); for (let y = -0.14; y > -2.0; y -= 0.28) [-1.85, 1.85].forEach((x) => ring(x, y, 0.13, K.shade(wood, 1.15))); door(0.6, 0.6, 1.1, dark); win(-0.8, -1.2, 0.5, 0.45); fl(rect(1.1, -3.3, 1.4, -2.4), stone); break;
    case "palace": wall(-3.0, -2.6, 3.0, 0, cream); fl(P([[-1.0, -2.6], [0, -3.6], [1.0, -2.6]]), cream); cols(-0.8, 0.8, 4, -2.5, -0.1, white); hip(-3.1, -1.0, -2.6, 0.7, T("#5a6a7a")); hip(1.0, 3.1, -2.6, 0.7, T("#5a6a7a")); for (let r = 0; r < 2; r++) for (const x of [-2.6, -2.0, -1.4, 1.4, 2.0, 2.6]) win(x, -1.9 + r * 1.1, 0.35, 0.65, true); fl(S([[-0.5, -3.6], [0, -4.6], [0.5, -3.6]]), T("#5a6a7a")); break;
    case "imperialPalace": fl(rect(-3.0, -0.7, 3.0, 0), T("#c8b89a")); for (let i = 0; i < 6; i++) fl(rect(-2.5 + i * 1.0, -2.2, -2.3 + i * 1.0, -0.7), red); fl(rect(-2.6, -2.2, 2.6, -2.0), gold); asian(-2.8, 2.8, -2.2, 0.9, T("#c9a24a")); asian(-2.0, 2.0, -3.4, 0.7, T("#c9a24a")); fl(rect(-1.8, -3.4, 1.8, -3.05), red); fl(rect(-0.5, -1.4, 0.5, -0.7), dark); break;
    case "cathedral": wall(-2.2, -3.2, 2.2, 0, stone, "stone"); gable(-1.0, 1.0, -3.2, 1.5, T("#6a6e74")); [-1.7, 1.7].forEach((x) => { wall(x - 0.5, -5.8, x + 0.5, 0, stone, "stone"); fl(P([[x - 0.6, -5.8], [x, -7.4], [x + 0.6, -5.8]]), T("#6a6e74")); win(x, -4.6, 0.3, 0.8, true); }); ring(0, -2.3, 0.45, T("#a83a4a")); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ln([[0, -2.3], [Math.cos(a) * 0.45, -2.3 + Math.sin(a) * 0.45]], 0.35); } door(0, 0.9, 1.6, dark, true); break;
    case "torii": [-1.3, 1.3].forEach((x) => fl(rect(x - 0.15, -3.0, x + 0.15, 0), red)); fl(rect(-1.6, -2.4, 1.6, -2.15), red); fl(S([[-2.1, -3.1], [-1.9, -3.25], [1.9, -3.25], [2.1, -3.1], [1.9, -2.9], [-1.9, -2.9]]), black); fl(rect(-1.8, -2.95, 1.8, -2.75), red); fl(rect(-0.1, -2.75, 0.1, -2.4), red); break;
    case "stupa": fl(rect(-2.0, -0.4, 2.0, 0), white); fl(rect(-1.6, -0.8, 1.6, -0.4), white); fl(S([[-1.4, -0.8], [-1.3, -1.9], [0, -2.5], [1.3, -1.9], [1.4, -0.8]]), white); fl(rect(-0.3, -2.75, 0.3, -2.45), gold); for (let i = 0; i < 5; i++) fl(rect(-0.25 + i * 0.04, -2.95 - i * 0.22, 0.25 - i * 0.04, -2.75 - i * 0.22), gold); fl(P([[-0.06, -3.85], [0, -4.4], [0.06, -3.85]]), gold); break;
    case "ziggurat": [[3.0, 0, -1.0], [2.2, -1.0, -2.0], [1.4, -2.0, -2.9], [0.7, -2.9, -3.6]].forEach(([hw, y1, y0]) => wall(-hw, y0, hw, y1, mud, "brick")); fl(P([[-0.25, 0], [-0.25, -2.0], [0.25, -2.0], [0.25, 0]]), K.shade(mud, 0.85)); break;
    case "amphitheater": { const p = S([[-3.0, 0], [-3.0, -3.0], [-1.5, -3.3], [1.5, -3.3], [3.0, -3.0], [3.0, 0]]); fl(p, stone); clip(p, () => { for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) fl(S([[-2.6 + i * 0.65, -0.2 - r * 1.0], [-2.6 + i * 0.65, -0.65 - r * 1.0], [-2.38 + i * 0.65, -0.85 - r * 1.0], [-2.16 + i * 0.65, -0.65 - r * 1.0], [-2.16 + i * 0.65, -0.2 - r * 1.0]]), black, { hatch: false }); }); break; }
    case "aqueduct": fl(rect(-3.0, -3.4, 3.0, -2.9), stone); for (let i = 0; i < 4; i++) { const x = -2.25 + i * 1.5; const p = new Path2D(); p.moveTo((x - 0.75) * R, -2.9 * R); p.lineTo((x - 0.75) * R, 0); p.lineTo((x - 0.5) * R, 0); p.lineTo((x - 0.5) * R, -2.0 * R); p.arc(x * R, -2.0 * R, 0.5 * R, Math.PI, 0); p.lineTo((x + 0.5) * R, 0); p.lineTo((x + 0.75) * R, 0); p.lineTo((x + 0.75) * R, -2.9 * R); p.closePath(); fl(p, stone); } break;
    case "marketHall": for (let i = 0; i < 6; i++) beam([[-2.5 + i * 1.0, 0], [-2.5 + i * 1.0, -2.0]], 0.15, dark); fl(rect(-2.8, -2.1, 2.8, -1.95), dark); hip(-2.9, 2.9, -2.1, 1.2, tile); for (let i = 0; i < 4; i++) fl(rect(-2.2 + i * 1.3, -0.8, -1.4 + i * 1.3, -0.5), wood); break;
    case "inn": wall(-1.8, -3.0, 1.8, 0, cream); beam([[-1.8, -1.5], [1.8, -1.5]], 0.12, dark); gable(-1.9, 1.9, -3.0, 1.2, tile); door(-0.8, 0.6, 1.1, wood); win(0.6, -0.8, 0.5, 0.5); win(-0.8, -2.2, 0.45, 0.45); win(0.8, -2.2, 0.45, 0.45); beam([[1.8, -2.2], [2.6, -2.2]], 0.06, iron); fl(rect(2.2, -2.2, 2.7, -1.7), wood); break;
    case "teahouse": wall(-1.8, -1.6, 1.8, 0, T("#8a6a4a"), "plank"); asian(-1.8, 1.8, -1.6, 0.8, tile); fl(rect(-1.9, 0, 1.9, 0.12), stone); [-0.9, 0.9].forEach((x) => { beam([[x, -1.8], [x, -1.5]], 0.03, ol); fl(S([[x - 0.18, -1.5], [x + 0.18, -1.5], [x + 0.15, -1.1], [x - 0.15, -1.1]]), red); }); door(0, 0.8, 1.2, T("#3a2a1e")); break;
    case "school": wall(-2.6, -2.4, 2.6, 0, brick, "brick"); gable(-1.0, 1.0, -2.4, 1.0, tile); fl(rect(-0.15, -4.0, 0.15, -3.4), wood); for (const x of [-2.0, -1.2, 1.2, 2.0]) win(x, -1.3, 0.5, 0.8); door(0, 0.7, 1.3, wood); beam([[0, -3.4], [0, -4.4]], 0.04, iron); fl(rect(0.0, -4.4, 0.5, -4.1), red, { hatch: false }); break;
    case "hospital": wall(-2.6, -3.0, 2.6, 0, white); flatRoof(-2.6, 2.6, -3.0); for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) win(-2.1 + i * 0.84, -2.3 + r * 1.0, 0.45, 0.5); fl(rect(-0.25, -3.8, 0.25, -3.2), red, { hatch: false }); fl(rect(-0.6, -3.65, 0.6, -3.35), red, { hatch: false }); door(0, 0.9, 1.1, glass); break;
    case "railwayStation": wall(-3.0, -2.6, 3.0, 0, brick, "brick"); hip(-3.1, 3.1, -2.6, 0.7, T("#5a6a7a")); fl(rect(-0.6, -4.2, 0.6, -2.6), brick); fl(P([[-0.7, -4.2], [0, -4.9], [0.7, -4.2]]), T("#5a6a7a")); ring(0, -3.5, 0.35, white); ln([[0, -3.5], [0, -3.75]], 0.5); ln([[0, -3.5], [0.18, -3.45]], 0.5); for (const x of [-2.3, -1.4, 1.4, 2.3]) win(x, -1.4, 0.55, 1.0, true); door(0, 1.0, 1.6, dark, true); break;
    case "bank": fl(rect(-2.4, -0.4, 2.4, 0), stone); wall(-2.2, -3.2, 2.2, -0.4, stone, "stone"); cols(-1.7, 1.7, 6, -3.1, -0.4, white); fl(P([[-2.5, -3.2], [0, -4.1], [2.5, -3.2]]), stone); fl(rect(-2.5, -3.35, 2.5, -3.15), K.shade(stone, 0.9)); door(0, 0.7, 1.6, dark); break;
    case "townHall": wall(-2.6, -2.8, 2.6, 0, cream); hip(-2.7, 2.7, -2.8, 0.8, T("#5a6a7a")); wall(-0.6, -5.0, 0.6, -2.8, cream); fl(P([[-0.7, -5.0], [0, -6.0], [0.7, -5.0]]), T("#5a6a7a")); ring(0, -4.2, 0.35, white); for (const x of [-2.0, -1.2, 1.2, 2.0]) win(x, -1.6, 0.5, 0.9, true); door(0, 0.8, 1.4, dark, true); break;
    case "prison": wall(-2.6, -3.0, 2.6, 0, T("#8a8680"), "stone"); flatRoof(-2.6, 2.6, -3.0); for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const x = -2.1 + i * 0.84, y = -2.3 + r * 1.0; fl(rect(x - 0.2, y - 0.25, x + 0.2, y + 0.25), black, { hatch: false }); for (let b = 0; b < 3; b++) ln([[x - 0.12 + b * 0.12, y - 0.25], [x - 0.12 + b * 0.12, y + 0.25]], 0.5, iron); } door(0, 0.8, 1.3, iron); break;
    case "warehouse": wall(-2.8, -2.4, 2.8, 0, T("#8a6a4a"), "plank"); gable(-2.9, 2.9, -2.4, 0.9, T("#6a6e74")); fl(rect(-1.0, -1.8, 1.0, 0), dark); ln([[-1.0, -1.8], [1.0, 0]], 0.5); ln([[1.0, -1.8], [-1.0, 0]], 0.5); break;
    case "dock": fl(rect(-3.0, -0.75, 3.0, -0.55), wood); for (let i = 0; i < 7; i++) beam([[-2.8 + i * 0.93, -0.55], [-2.8 + i * 0.93, 0.4]], 0.12, dark); ln([[-3.0, 0.15], [3.0, 0.15]], 0.5, T("#5a7a8a")); [[-1.6, 1], [0.8, 2]].forEach(([x]) => fl(rect(x - 0.4, -1.4, x + 0.4, -0.75), wood)); ring(2.2, -0.95, 0.2, rope); break;
    case "waterTower": [-0.9, 0.9].forEach((x) => beam([[x, 0], [x * 0.7, -3.2]], 0.1, iron)); ln([[-0.85, -0.5], [0.75, -2.0]], 0.5, iron); ln([[0.85, -0.5], [-0.75, -2.0]], 0.5, iron); fl(rect(-1.2, -4.8, 1.2, -3.2), T("#7a8a9a")); fl(P([[-1.3, -4.8], [0, -5.5], [1.3, -4.8]]), T("#5a6a7a")); break;
    case "powerPlant": wall(-2.8, -2.2, 1.0, 0, concrete); for (let i = 0; i < 3; i++) win(-2.2 + i * 1.1, -1.3, 0.6, 0.6); [1.5, 2.4].forEach((x) => { fl(S([[x - 0.45, 0], [x - 0.3, -2.5], [x - 0.4, -3.8], [x + 0.4, -3.8], [x + 0.3, -2.5], [x + 0.45, 0]]), T("#c8c4bc")); if (o.smoking) smoke(x, -4.5, 0.7); }); break;
    case "oilRig": water(3.0); [-1.6, 1.6].forEach((x) => beam([[x, 0.2], [x, -2.0]], 0.14, iron)); fl(rect(-2.2, -2.4, 2.2, -2.0), T("#8a8a80")); [-0.5, 0.5].forEach((x) => beam([[x, -2.4], [x * 0.2, -5.4]], 0.06, iron)); for (let y = -2.8; y > -5.2; y -= 0.5) ln([[-0.4 * (1 + (y + 2.4) / 3), y], [0.4 * (1 + (y + 2.4) / 3), y]], 0.5, iron); fl(rect(1.0, -3.0, 2.0, -2.4), white); break;
    case "oilDerrick": [-0.8, 0.8].forEach((x) => beam([[x, 0], [x * 0.15, -4.6]], 0.08, wood)); for (let y = -0.6; y > -4.4; y -= 0.6) { const k = 1 + y / 5.4; ln([[-0.8 * k, y], [0.8 * k, y]], 0.5, wood); ln([[-0.8 * k, y], [0.8 * (1 + (y - 0.6) / 5.4), y - 0.6]], 0.4, wood); } fl(rect(-1.1, -0.4, 1.1, 0), dark); break;
    case "fieldHospitalTent": fl(P([[-2.2, 0], [-1.8, -1.6], [0, -2.2], [1.8, -1.6], [2.2, 0]]), T(night ? "#8a8a74" : "#c8c4a8")); fl(rect(-0.25, -1.6, 0.25, -0.9), red, { hatch: false }); fl(rect(-0.6, -1.45, 0.6, -1.05), red, { hatch: false }); fl(P([[-0.5, 0], [0, -0.8], [0.5, 0]]), black, { hatch: false }); break;`;
export const MOTION_LIBRARY_BUILDINGS: MotionLibraryPart = {
  part: "lib_buildings",
  fn: "building",
  items,
  js: motionLibraryPart(
    items,
    body,
    2.2,
    helpers +
      `
  const water = (hw) => { for (let i = 0; i < 4; i++) { const x = -hw + 0.3 + i * (2 * hw - 0.6) / 3 + Math.sin(t + i) * 0.1; ln([[x, 0.15], [x + 0.35, 0.12], [x + 0.6, 0.15]], 0.45, T("#5a7a8a")); } };`,
  ),
};
