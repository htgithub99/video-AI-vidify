import { MOTION_VERIFICATION_TEXTS as VT, MOTION_VERIFICATION_FORMATS as VF } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { isProductionCabin, productionBriefFor, productionStaging } from "../src/lib/motionProductionDesign.ts";
import { validateGenLocation } from "../src/server/services/motionEngineService.ts";
assert.equal(isProductionCabin({ key: VT.COCKPIT, name: VT.AIRCRAFT_COCKPIT }), false);
assert.equal(isProductionCabin({ key: VT.AIRPORT, name: VT.AIRPORT_TERMINAL }), false);
assert.match(productionBriefFor({ name: VT.AIRCRAFT_CABIN_2 }), VT.NO_PRESET_CLASSIFICATION_RE);
const seats = Array.from({ length: 8 }, (_, row) =>
  [VT.LEFT, VT.RIGHT].flatMap((side) =>
    [0, 1].map((seat) => ({
      name: VF.CABIN_SEAT_NAME(row, side, seat),
      point: [(side === VT.LEFT ? -1 : 1) * (0.72 + seat * 0.5), -1.4 - row * 1.2],
    })),
  ),
).flat();
const raw = {
  name: VT.AIRCRAFT_CABIN_2,
  interior: true,
  stage: { center: [0, -6], size: [4, 14] },
  camera: { pos: [0, 1.55, -0.3], target: [0, 1.1, -3.6] },
  marks: { ...Object.fromEntries(seats.map((seat) => [seat.name, seat.point])), door_front: [0, -12] },
  materials: { floor: { color: VT.VALUE_686868 }, seat: { color: VT.VALUE_516075 } },
  nodes: [{ shape: VT.BOX, name: VT.CABIN_FLOOR, pos: [0, -0.06, -6], size: [4, 0.12, 14], mat: VT.FLOOR }, { shape: VT.LIGHT, type: VT.AMBIENT, intensity: 0.5 }, ...seats.map((seat) => ({ shape: VT.BOX, name: seat.name, pos: [seat.point[0], 0.45, seat.point[1]], size: [0.45, 0.12, 0.5], mat: VT.SEAT }))],
};
const result = validateGenLocation(raw);
assert.deepEqual(result.errors, []);
assert.equal(Object.keys(result.value.marks).filter((k) => k.startsWith(VT.SEAT_2)).length, 32);
assert.ok(raw.nodes.filter((n: any) => n.shape === VT.LIGHT).every((n: any) => n.intensity <= 0.8));
assert.ok(!Object.values(raw.materials).some((m: any) => m.emissive || m.pattern === VT.TILES));
const planted = productionStaging(
  {
    location: VT.AIRCRAFT_CABIN,
    actors: [
      { cast: VT.A_2, action: VT.SIT_TALK, at: [0, -20] },
      { cast: VT.B, action: VT.SIT, at: [0, -20] },
      { cast: VT.C, action: VT.STAND, at: [4, -30] },
    ],
  },
  result.value,
);
assert.ok(planted.actors[0].at.startsWith(VT.SEAT_2));
assert.notEqual(planted.actors[0].at, planted.actors[1].at);
assert.equal(planted.actors[0].face, 180);
assert.equal(planted.actors[2].at, VT.DOOR_FRONT);
const demo = JSON.parse(fs.readFileSync(VT.MOTION_ENGINE_DEMO_EDITORIAL_QA_JSON, VT.UTF8));
const actors = [
  { cast: VT.PERSON0, action: VT.SIT, at: raw.marks.seat_1_left_0, face: 180 },
  { cast: VT.PERSON1, action: VT.STAND, at: raw.marks.door_front, face: 0 },
];
const cameras = [
  { shot: VT.WIDE, pos: [0, 1.55, -0.3], target: [0, 1.1, -3.6], fov: 46, move: VT.DOLLY_IN, amount: 0.12 },
  { shot: VT.MEDIUM, focus: VT.PERSON0, pos: [0, 1.3, -4.4], target: [-0.72, 1, -2.78], fov: 42, move: VT.DOLLY_IN, amount: 0.12 },
  { shot: VT.MEDIUM, focus: VT.PERSON1, pos: [0, 1.5, -2.5], target: [0, 1.4, -4.9], fov: 42, move: VT.DOLLY_IN, amount: 0.12 },
];
const spec = { ...demo, title: VT.PRODUCTION_CABIN_FIRST_RENDER, duration: 9, gen: { ...demo.gen, style: { ...demo.gen.style, grade: VT.NEUTRAL }, locations: { cabin: result.value } }, shots: cameras.map((camera, i) => ({ id: VF.PRODUCTION_SHOT_ID(i), start: i * 3, end: (i + 1) * 3, template: VT.GEN3D, params: { location: VT.CABIN, actors, cameras: [camera] } })) };
fs.mkdirSync(VT.SCRATCH_PRODUCTION_FIRST_PASS, { recursive: true });
fs.writeFileSync(VT.SCRATCH_PRODUCTION_FIRST_PASS_SPEC_JSON, JSON.stringify(spec, null, 2));
process.stdout.write(VT.PRODUCTION_SET_PASSED_VALIDATED_CABIN_32_REAL_SEATING_STATIONS_RESTRAINE + VT.EMPTY);
