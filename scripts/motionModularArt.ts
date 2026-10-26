import type { PuppetBase, PuppetPiece } from "../src/types/motionPuppet.js";
const SVG = (inner: string, box = "0 0 1920 1080") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}">${inner}</svg>`;
const palette = (chibi: boolean, night: boolean) => ({ line: chibi ? "#402c30" : "#0d0e10", sky: night ? "#172033" : chibi ? "#b4d9dc" : "#95a3ad", wall: night ? "#343341" : chibi ? "#e5cfa9" : "#b9ad97", floor: night ? "#34312d" : chibi ? "#bb9160" : "#8b795e", wood: night ? "#3d3030" : chibi ? "#9b633f" : "#6b4a32", water: night ? "#213a45" : chibi ? "#6ca6a7" : "#66888a" });
export const modularShell = (base: PuppetBase, key: string, family: string): PuppetBase => {
  const art = (night: boolean) => {
    const p = palette(base.styleId === "stl-e70fac00bbf44662", night);
    const stroke = `stroke="${p.line}" stroke-width="5" stroke-linejoin="round"`;
    const exterior = family !== "attic" && family !== "cave";
    let back = `<rect width="1920" height="720" fill="${exterior ? p.sky : p.wall}"/>`;
    let floor = `<rect y="720" width="1920" height="360" fill="${p.floor}" ${stroke}/>`;
    if (family === "pond") back += `<ellipse cx="960" cy="550" rx="870" ry="220" fill="${p.water}" ${stroke}/><path d="M350 540h240m300-70h250m130 140h220" fill="none" ${stroke}/>`;
    if (family === "ditch") back += `<path d="M0 550 Q700 280 1920 570 L1920 750 Q800 430 0 730Z" fill="${p.water}" ${stroke}/>`;
    if (family === "cave") back += `<path d="M0 0H1920V720H1730L1510 310 1260 160 970 100 620 180 350 370 180 720H0Z" fill="${p.wood}" ${stroke}/><path d="M150 0l100 160 90-160m1120 0 100 200 110-200" fill="${p.floor}" ${stroke}/>`;
    if (family === "attic") back += `<path d="M0 0H1920L960 410Z" fill="${p.wood}" ${stroke}/><path d="M0 110L960 520 1920 110M960 0V520" fill="none" ${stroke}/>`;
    if (family === "porch") back += `<path d="M0 50H1920V180H0Z" fill="${p.wood}" ${stroke}/><path d="M70 180H125V720H70ZM1795 180H1850V720H1795Z" fill="${p.wood}" ${stroke}/>`;
    if (family === "roof") {
      back += `<path d="M0 700L960 310 1920 700Z" fill="${p.wood}" ${stroke}/>`;
      floor = `<path d="M0 700L960 520 1920 700V1080H0Z" fill="${p.wood}" ${stroke}/>` + [0, 1, 2, 3, 4].map((n) => `<path d="M0 ${740 + n * 70}Q960 ${570 + n * 90} 1920 ${740 + n * 70}" fill="none" ${stroke}/>`).join("");
    }
    return SVG(`<g id="sky"></g><g id="back">${back}</g><g id="floor">${floor}</g>`);
  };
  return {
    ...base,
    key,
    family: family === "attic" || family === "cave" ? "interior" : "exterior",
    interior: family === "attic" || family === "cave",
    locationFamily: family as PuppetBase["locationFamily"],
    desc: `Empty ${family} shell; fixed architecture and ground only; add independent furniture and people.`,
    svg: art(false),
    night: art(true),
    tags: ["seed", key, "modular_v3"],
    horizonY: 720,
    floorY: 950,
    ...(family === "pond" ? { regions: { water: { bounds: [500, 510, 920, 160] as [number, number, number, number] } } } : {}),
  };
};
export const modularBridge = (piece: PuppetPiece): PuppetPiece => {
  const art = (night: boolean) => {
    const p = palette(piece.styleId === "stl-e70fac00bbf44662", night);
    return SVG(`<g fill="${p.wood}" stroke="${p.line}" stroke-width="5"><path d="M40 270L470 270 470 325 40 325Z"/><path d="M75 180h18v180H75Zm340 0h18v180h-18Z"/><path d="M80 185H425V202H80Z"/><path d="M140 270v55m70-55v55m70-55v55m70-55v55" fill="none"/></g>`, "0 0 512 512");
  };
  return {
    ...piece,
    key: "modular_wooden_bridge",
    name: "Wooden footbridge",
    desc: "Independent wooden footbridge across water; clear walking contact on deck.",
    kind: "fixture",
    environment: "exterior",
    allowedEnvironments: ["exterior"],
    slots: ["far_center"],
    box: [30, 170, 450, 200],
    anchor: [256, 360],
    size: 3.6,
    native: undefined,
    svg: art(false),
    night: art(true),
    spots: [{ key: "bridge_stand", kind: "stand", x: 256, y: 270, groundY: 270, fixture: "bridge", label: "Standing on wooden bridge deck" }],
    compositions: [],
    lights: [],
    front: false,
    tags: ["seed", "modular_wooden_bridge", "modular_v3"],
  };
};
export const modularDoor = (piece: PuppetPiece): PuppetPiece => {
  const art = (night: boolean, open: boolean | "ajar") => {
    const p = palette(piece.styleId === "stl-e70fac00bbf44662", night);
    return SVG(
      `<g stroke="${p.line}" stroke-width="6" stroke-linejoin="round"><rect x="100" y="35" width="310" height="445" fill="${p.wood}"/><rect x="120" y="55" width="270" height="425" fill="${open ? "#1b1922" : p.floor}"/>${open === "ajar" ? `<path d="M120 55L245 75V460L120 480ZM390 55L265 75V460L390 480Z" fill="${p.wood}"/>` : open ? `<path d="M120 55L175 90V460L120 480ZM390 55L335 90V460L390 480Z" fill="${p.wood}"/>` : `<path d="M255 55V480M135 75H235V445H135ZM275 75H375V445H275Z" fill="none"/>`}</g>`,
      "0 0 512 512",
    );
  };
  return {
    ...piece,
    key: "modular_door",
    name: "Wooden doorway",
    desc: "Independent wooden door with open and closed states; standing contacts beside doorway.",
    kind: "fixture",
    environment: "interior",
    allowedEnvironments: ["interior"],
    slots: ["door_left", "door_right"],
    box: [90, 25, 330, 465],
    anchor: [255, 480],
    native: undefined,
    size: 2.2,
    svg: art(false, false),
    night: art(true, false),
    stateKey: "door",
    states: { closed: { svg: art(false, false), night: art(true, false) }, open: { svg: art(false, true), night: art(true, true) }, ajar: { svg: art(false, "ajar"), night: art(true, "ajar") } },
    spots: [
      { key: "door_stand", kind: "door", x: 255, y: 480, groundY: 480, fixture: "door", label: "Standing beside doorway" },
      { key: "door_left_stand", kind: "stand", x: 40, y: 490, groundY: 490, fixture: "door", relation: "beside", label: "Standing beside doorway" },
    ],
    compositions: [],
    lights: [],
    front: false,
    tags: ["seed", "modular_door", "modular_v3"],
  };
};
