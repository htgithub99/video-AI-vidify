import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import { productionBriefFor, productionLocationErrors, productionStagingErrors, productionStaging } from "../src/lib/motionProductionDesign.ts";
import { planMotionCoverage } from "../src/lib/motionCoverage.ts";
import { emptyGen, stageBeats } from "../src/server/services/motionGenService.ts";
const settings = [
  { name: VT.HISTORIC_PALACE_MEETING, interior: true },
  { name: VT.FOREST_MISSILE_LAUNCH, interior: false },
  { name: VT.TRUCK_ON_A_ROAD, interior: false },
  { name: VT.FACTORY_MACHINE, interior: true },
  { name: VT.ABSTRACT_SPACE_DIAGRAM, interior: false },
] as const;
for (const place of settings) {
  const brief = productionBriefFor(place);
  assert.ok(brief.includes(place.name));
  assert.ok(brief.includes(VT.DO_NOT_CLASSIFY_ITS_NAME_INTO_A_PRESET));
  assert.ok(!VT.PRESET_CATEGORY_RE.test(brief));
}
const location = { name: VT.OFFICE, stage: { center: [0, 0], size: [8, 8] }, marks: { stand_left: [-1, 0], seat_right: [5, 0] }, camera: { pos: [0, 2, 6], target: [0, 1, 0] } };
assert.deepEqual(productionLocationErrors(location), []);
assert.ok(productionLocationErrors({ ...location, camera: { pos: [0, 0, 0], target: [0, 0, 0] } }).length);
assert.ok(
  productionStagingErrors(
    {
      actors: [
        { cast: VT.A_2, at: [0, 0] },
        { cast: VT.B, at: [0.2, 0] },
      ],
    },
    location,
  ).some((e) => e.includes(VT.OVERLAP)),
);
assert.ok(productionStagingErrors({ actors: [{ cast: VT.A_2, action: VT.SIT, at: VT.STAND_LEFT }] }, location).some((e) => e.includes(VT.STANDING_STATION)));
assert.ok(productionStagingErrors({ actors: [{ cast: VT.A_2, at: [30, 0] }] }, location).length);
assert.deepEqual(productionStagingErrors({ actors: [{ cast: VT.A_2, action: VT.SIT, at: VT.SEAT_RIGHT }] }, location), []);
assert.deepEqual(
  productionStagingErrors(
    {
      actors: [
        { cast: VT.A_2, at: [-1, 1, 0] },
        { cast: VT.B, at: [1, 1, 0] },
      ],
    },
    location,
  ),
  [],
);
const planted = productionStaging({ actors: [{ cast: VT.A_2, at: [-1, 0], moveTo: [1, 0], then: VT.RUN }] }, location);
assert.equal(planted.actors[0].moveTo, undefined);
assert.equal(planted.actors[0].then, undefined);
assert.deepEqual(planted.actors[0].at, [-1, 0]);
const noDetail = planMotionCoverage({ actors: [{ cast: VT.A_2 }] }, 9, 0, VT.AT_8_46_AM_IN_2001);
assert.ok(noDetail.every((c) => c.shot !== VT.INSERT));
const propShots = planMotionCoverage({ actors: [], props: [{ name: VT.GRASS }, { name: VT.TRUCK }] }, 9, 0, VT.A_TRUCK_CROSSES_THE_FIELD);
assert.equal(propShots[1].focusProp, VT.TRUCK);
assert.ok(propShots.every((c) => !c.focus));
const authored = planMotionCoverage(
  {
    actors: [{ cast: VT.A_2 }],
    cameras: [
      { shot: VT.WIDE, move: VT.STATIC, amount: 0, focus: VT.A_2 },
      { shot: VT.MEDIUM, pos: [2, 2, 4], move: VT.STATIC },
    ],
  },
  6,
);
assert.equal(authored[0].focus, VT.A_2);
assert.equal(authored[0].move, VT.STATIC);
assert.equal(authored[0].amount, 0);
assert.deepEqual(authored[1].pos, [2, 2, 4]);
assert.ok(planMotionCoverage({ actors: [], cameras: [{}, {}, {}, {}] }, 12).every((c) => c.move));
const gen = emptyGen();
gen.locations.office = { ...location, nodes: [], materials: {} };
gen.cast = { a: { height: 1.8 }, b: { height: 1.8 } } as any;
const beat: any = { id: VT.B1, place: VT.OFFICE_2, visual: VT.SCENE, cast: [VT.A_2, VT.B], narration: VT.TWO_PEOPLE_DISCUSS_A_DOCUMENT, duration: 6 };
let calls = 0;
const prompts: string[] = [];
const logs: string[] = [];
await stageBeats(
  [beat],
  { language: VT.EN, beats: [beat] } as any,
  {
    title: VT.MEETING,
    logline: VT.DISCUSSION,
    cast: [
      { key: VT.A_2, name: VT.A },
      { key: VT.B, name: VT.B_2 },
    ],
    places: [{ key: VT.OFFICE_2, name: VT.OFFICE }],
  } as any,
  gen,
  {
    exec: {} as any,
    log: (line: string) => logs.push(line),
    ai: async (prompt: string) => {
      prompts.push(prompt);
      calls++;
      return {
        beats: [
          {
            id: VT.B1,
            location: VT.OFFICE_2,
            actors: [
              { cast: VT.A_2, action: VT.STAND, at: [0, 0], moveTo: [3, 0] },
              { cast: VT.B, action: VT.STAND, at: calls === 1 ? [0, 0] : [1, 0] },
            ],
          },
        ],
      };
    },
  },
);
assert.equal(calls, 1, VT.OVERLAPPING_ACTORS_ARE_ADVISORY_AND_MUST_NOT_TRIGGER_ANOTHER_AI_REQUEST);
assert.ok(
  logs.some((line) => line.includes(VT.OVERLAP)),
  VT.THE_OVERLAP_REMAINS_VISIBLE_IN_THE_ADVISORY_LOG,
);
assert.ok(prompts[0].includes(VT.DO_NOT_CLASSIFY_ITS_NAME_INTO_A_PRESET));
assert.equal(gen.staging.b1.actors[0].moveTo, undefined);
assert.deepEqual(gen.staging.b1.actors[1].at, [0, 0]);
process.stdout.write(VT.MULTI_SCENE_PRODUCTION_PASSED_5_SETTING_FAMILIES_STRUCTURAL_PREFLIGHT_ST + VT.EMPTY);
