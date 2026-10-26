import { MOTION_STAGE_GEOMETRY as G } from "../constants/motionStageGeometry.js";
import { PUPPET as P } from "../constants/motionPuppet.js";
import type { PuppetSpot } from "../types/motionPuppet.js";
export const puppetFloorContacts = (floorY: number, horizonY = floorY - P.HORIZON_GAP): PuppetSpot[] => [
  ...G.FLOOR_DEPTH.flatMap((depth, row) => G.STAND_X.map((x, column) => ({ key: G.STAND_KEY(row, column), kind: P.SPOT_STAND, x: Math.round(x * P.SET_W), y: Math.round(horizonY + depth * (floorY - horizonY)), fixture: P.SPOT_FLOOR_KEY, label: G.STAND_LABEL }))),
  ...G.FLOOR_DEPTH.flatMap((depth, row) => G.FLOOR_X.map((x, column) => ({ key: G.FLOOR_KEY(row, column), kind: P.SPOT_OPEN, x: Math.round(x * P.SET_W), y: Math.round(horizonY + depth * (floorY - horizonY)), fixture: P.SPOT_FLOOR_KEY, label: G.FLOOR_LABEL }))),
  ...G.LIE_X.map((x, column) => ({ key: G.LIE_KEY(column), kind: P.SPOT_LIE, x: Math.round(x * P.SET_W), y: Math.round(horizonY + G.LIE_DEPTH * (floorY - horizonY)), fixture: P.SPOT_FLOOR_KEY, label: G.LIE_LABEL })),
];
