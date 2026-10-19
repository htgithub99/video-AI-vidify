import _ from "lodash";
import { MOTION_2D as C } from "../../../constants/motion2d.js";
import { MOTION_2D_SVG as S } from "../../../constants/motion2dSvg.js";
import * as MR from "../../../constants/motionRuntime.js";
import type { MotionBoard2dSet, MotionPlace } from "../../../types/motionVideo.js";

const mix = (a: string, b: string, t: number): string => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a),
    y = p(b);
  return S.HASH + _.map(x, (v, i) => _.padStart(Math.round(v + (y[i] - v) * t).toString(16), 2, S.ZERO)).join(C.EMPTY);
};
const seedOf = (s: string): number => _.reduce(s, (h, ch) => (h * 31 + ch.charCodeAt(0)) % 9973, 7);
const rnd = (seed: number, i: number): number => {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const set2dKind = (place: MotionPlace): string => {
  const text = [place.name, place.description, ...(place.tags || [])].join(C.SPACE).normalize(MR.MOTION_TEXT_NFC).toLowerCase();
  const hit = _.find(C.SET_KINDS, ([, re]) => re.test(text));
  if (hit && !(place.interior && hit[0] !== C.SET_KIND_DEFAULT_IN && hit[0] !== C.SET_KINDS[1][0])) return hit[0];
  return place.interior ? C.SET_KIND_DEFAULT_IN : C.SET_KIND_DEFAULT_OUT;
};
export const set2dTime = (time: string | undefined): string => (C.NIGHT_RE.test(time || C.EMPTY) ? S.NIGHT : C.DUSK_RE.test(time || C.EMPTY) ? S.DUSK : C.DAWN_RE.test(time || C.EMPTY) ? S.DAWN : S.DAY);

export const codeSet2d = (place: MotionPlace, kind: string, rawTime: string | undefined): MotionBoard2dSet => {
  const time = set2dTime(rawTime || place.time);
  const night = time === S.NIGHT;
  const tint = night ? C.NIGHT_TINT : time === S.DUSK ? C.DUSK_TINT : null;
  const k = night ? C.NIGHT_MIX : 0.22;
  const col = (key: string): string => (tint ? mix(C.PAL[key], tint, k) : C.PAL[key]);
  const seed = seedOf(place.key + kind);
  const sky = C.SKY[time] || C.SKY.day;
  const interior = kind === C.SET_KIND_DEFAULT_IN || (kind === C.SET_KINDS[1][0] && !!place.interior);
  const lines: string[] = [];
  const line = (s: string) => lines.push(s);
  const fy = C.FLOOR_Y;
  const lights: MotionBoard2dSet["lights"] = [];
  line(S.G_OPEN(S.ID_SKY));
  line(S.RECT(0, 0, 1920, 1080, sky[0], S.NONE, 0));
  line(S.RECT(0, 520, 1920, 560, sky[1], S.NONE, 0));
  if (!interior && night) {
    line(S.CIRCLE(1580, 170, 62, C.MOON, S.NONE, 0));
    lights.push({ x: 1580, y: 170, color: C.MOON, kind: C.KIND_MOON });
  }
  line(S.G_CLOSE);
  line(S.G_OPEN(S.ID_BACK));
  const hills = (base: number, h: number, color: string, n: number, off: number) => {
    const pts: string[] = [S.PT(0, base)];
    for (let i = 0; i <= n; i++) pts.push(S.PT(Math.round((1920 * i) / n), Math.round(base - h * (0.45 + 0.55 * rnd(seed + off, i)))));
    pts.push(S.PT(1920, base));
    line(S.POLY(pts.join(C.SPACE), color, C.OUTLINE, C.STROKE));
  };
  const tree = (x: number, base: number, h: number, i: number) => {
    const w = h * 0.12;
    line(S.RECT(x - w / 2, base - h * 0.55, w, h * 0.55, col(S.P_TRUNK), C.OUTLINE, C.STROKE));
    const r = h * (0.24 + 0.06 * rnd(seed, i));
    line(S.CIRCLE(x - r * 0.55, base - h * 0.62, r * 0.8, col(S.P_LEAF), C.OUTLINE, C.STROKE));
    line(S.CIRCLE(x + r * 0.55, base - h * 0.6, r * 0.78, col(S.P_LEAF), C.OUTLINE, C.STROKE));
    line(S.CIRCLE(x, base - h * 0.82, r, col(S.P_LEAF_LIGHT), C.OUTLINE, C.STROKE));
  };
  const house = (x: number, w: number, base: number, h: number) => {
    line(S.RECT(x, base - h, w, h, col(S.P_WALL), C.OUTLINE, C.STROKE));
    line(S.POLY([S.PT(x - 60, base - h), S.PT(x + w / 2, base - h - h * 0.62), S.PT(x + w + 60, base - h)].join(C.SPACE), col(S.P_ROOF), C.OUTLINE, C.STROKE));
    line(S.RECT(x + w * 0.4, base - h * 0.72, w * 0.2, h * 0.72, col(S.P_WOOD_DARK), C.OUTLINE, C.STROKE));
    line(S.RECT(x + w * 0.1, base - h * 0.7, w * 0.18, h * 0.32, night ? C.PAL.glass : col(S.P_WOOD), C.OUTLINE, C.STROKE));
    line(S.RECT(x + w * 0.72, base - h * 0.7, w * 0.18, h * 0.32, night ? C.PAL.glass : col(S.P_WOOD), C.OUTLINE, C.STROKE));
    if (night) lights.push({ x: x + w * 0.19, y: base - h * 0.54, color: C.LIGHT_LAMP, kind: S.WINDOW });
  };
  if (interior) {
    line(S.RECT(0, 0, 1920, fy, col(S.P_WALL), C.OUTLINE, C.STROKE));
    line(S.RECT(0, fy - 170, 1920, 170, col(S.P_WALL_DARK), C.OUTLINE, C.STROKE));
    line(S.RECT(0, 0, 1920, 60, col(S.P_WOOD_DARK), C.OUTLINE, C.STROKE));
    for (const x of [120, 1780]) line(S.RECT(x - 26, 0, 52, fy, col(S.P_WOOD), C.OUTLINE, C.STROKE));
    line(S.RECT(250, 230, 230, 260, night ? mix(C.SKY.night[0], C.PAL.glass, 0.15) : C.SKY.day[0], C.OUTLINE, C.STROKE));
    line(S.LINE(365, 230, 365, 490, C.OUTLINE, C.STROKE));
    line(S.LINE(250, 360, 480, 360, C.OUTLINE, C.STROKE));
    line(S.RECT(1460, 300, 210, fy - 300, col(S.P_WOOD_DARK), C.OUTLINE, C.STROKE));
    if (kind === C.SET_KINDS[1][0]) {
      line(S.RECT(760, 300, 400, 240, C.PAL.red, C.OUTLINE, C.STROKE));
      line(S.RECT(820, 340, 280, 160, C.PAL.paper, C.OUTLINE, C.STROKE));
    }
    lights.push({ x: 365, y: 360, color: C.LIGHT_LAMP, kind: S.WINDOW });
  } else if (kind === C.SET_KINDS[1][0]) {
    hills(620, 220, col(S.P_HILL_FAR), 6, 1);
    line(S.RECT(560, 360, 800, 300, col(S.P_WALL), C.OUTLINE, C.STROKE));
    line(S.PATH(S.TEMPLE_ROOF, col(S.P_ROOF), C.OUTLINE, C.STROKE));
    line(S.PATH(S.TEMPLE_ROOF_TOP, col(S.P_ROOF_DARK), C.OUTLINE, C.STROKE));
    for (const x of [600, 760, 1160, 1320]) line(S.RECT(x - 18, 400, 36, 260, C.PAL.red, C.OUTLINE, C.STROKE));
    line(S.RECT(880, 450, 160, 210, col(S.P_WOOD_DARK), C.OUTLINE, C.STROKE));
    line(S.RECT(500, 660, 920, 40, col(S.P_STONE), C.OUTLINE, C.STROKE));
    line(S.RECT(460, 700, 1000, 40, col(S.P_STONE_DARK), C.OUTLINE, C.STROKE));
    tree(220, 760, 520, 1);
    tree(1720, 760, 480, 2);
  } else if (kind === S.K_FOREST) {
    hills(620, 300, col(S.P_HILL_FAR), 5, 1);
    hills(700, 200, col(S.P_HILL), 7, 2);
    _.forEach(S.FOREST_X, (x, i) => tree(x, 780 + (i % 2) * 30, 520 + 120 * rnd(seed, i), i));
  } else if (kind === S.K_WATER) {
    hills(560, 160, col(S.P_HILL_FAR), 6, 1);
    line(S.RECT(0, 560, 1920, 110, col(S.P_GRASS_DARK), C.OUTLINE, C.STROKE));
    line(S.RECT(0, 670, 1920, 150, col(S.P_WATER), C.OUTLINE, C.STROKE));
    for (let i = 0; i < 9; i++) {
      const x = Math.round(80 + rnd(seed, i) * 1760),
        y = Math.round(700 + rnd(seed, i + 9) * 90);
      line(S.LINE(x, y, x + 90, y, col(S.P_WATER_LINE), C.STROKE));
    }
    tree(170, 600, 380, 1);
  } else if (kind === S.K_CEMETERY) {
    hills(640, 230, col(S.P_HILL_FAR), 6, 1);
    line(S.RECT(0, 640, 1920, 210, col(S.P_GRASS_DARK), C.OUTLINE, C.STROKE));
    _.forEach(S.GRAVE_X, (x, i) => {
      const y = 590 + (i % 3) * 22;
      line(S.ELLIPSE(x, y + 40, 110, 40, col(S.P_MOUND), C.OUTLINE, C.STROKE));
      line(S.PATH(S.TOMB(x, y), col(S.P_STONE), C.OUTLINE, C.STROKE));
    });
    line(S.PATH(S.DEAD_TREE, col(S.P_TRUNK), C.OUTLINE, C.STROKE));
  } else if (kind === S.K_ROAD) {
    hills(600, 240, col(S.P_HILL_FAR), 6, 1);
    house(160, 340, 700, 230);
    house(1440, 320, 700, 220);
    tree(700, 720, 420, 1);
    tree(1260, 720, 380, 2);
    line(S.RECT(0, 700, 1920, 150, col(S.P_GRASS), C.OUTLINE, C.STROKE));
  } else {
    hills(560, 200, col(S.P_HILL_FAR), 6, 1);
    house(560, 800, 700, 330);
    line(S.RECT(0, 640, 520, 60, col(S.P_WOOD), C.OUTLINE, C.STROKE));
    line(S.RECT(1400, 640, 520, 60, col(S.P_WOOD), C.OUTLINE, C.STROKE));
    tree(240, 700, 560, 1);
    tree(1700, 700, 520, 2);
  }
  line(S.G_CLOSE);
  line(S.G_OPEN(S.ID_MID));
  line(S.G_CLOSE);
  line(S.G_OPEN(S.ID_FLOOR));
  const floorTop = interior ? fy : kind === S.K_ROAD || kind === S.K_WATER ? 820 : 700;
  const floorColor = interior ? col(S.P_WOOD) : kind === C.SET_KINDS[1][0] ? col(S.P_STONE) : kind === S.K_FOREST || kind === S.K_CEMETERY || kind === S.K_WATER ? col(S.P_GRASS) : col(S.P_SAND);
  line(S.RECT(0, floorTop, 1920, 1080 - floorTop, floorColor, C.OUTLINE, C.STROKE));
  if (kind === S.K_ROAD) line(S.POLY([S.PT(760, floorTop), S.PT(1160, floorTop), S.PT(1500, 1080), S.PT(420, 1080)].join(C.SPACE), col(S.P_SAND), C.OUTLINE, C.STROKE));
  const step = interior ? 70 : 90;
  for (let y = floorTop + step; y < 1080; y += step) line(S.LINE(0, y, 1920, y, interior ? col(S.P_WOOD_DARK) : mix(floorColor, C.OUTLINE, 0.25), 2));
  line(S.G_CLOSE);
  return { svg: S.HEAD + lines.join(C.EMPTY) + S.TAIL, code: kind, time: rawTime || place.time || S.DAY, floorY: fy, marks: [], lights };
};
