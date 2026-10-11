import assert from "node:assert/strict";
import { productionBriefFor, productionLocationErrors, productionStagingErrors, productionStaging } from "../src/lib/motionProductionDesign.ts";
import { planMotionCoverage } from "../src/lib/motionCoverage.ts";
import { emptyGen, stageBeats } from "../src/server/services/motionGenService.ts";
const settings = [ { name: "Historic palace meeting", interior: true }, { name: "Forest missile launch", interior: false }, { name: "Truck on a road", interior: false }, { name: "Factory machine", interior: true }, { name: "Abstract space diagram", interior: false }, ] as const;
for (const place of settings) {
  const brief = productionBriefFor(place);
  assert.ok(brief.includes(place.name));
  assert.ok(brief.includes("Do not classify its name into a preset"));
  assert.ok(!/NATURE:|ARCHITECTURE:|MECHANICAL:|VEHICLES:/.test(brief));
}
const location = { name: "Office", stage: { center: [0, 0], size: [8, 8] }, marks: { stand_left: [-1, 0], seat_right: [5, 0] }, camera: { pos: [0, 2, 6], target: [0, 1, 0] } };
assert.deepEqual(productionLocationErrors(location), []);
assert.ok(productionLocationErrors({ ...location, camera: { pos: [0, 0, 0], target: [0, 0, 0] } }).length);
assert.ok(
  productionStagingErrors(
    {
      actors: [
        { cast: "a", at: [0, 0] },
        { cast: "b", at: [0.2, 0] },
      ],
    },
    location,
  ).some((e) => e.includes("overlap")),
);
assert.ok(productionStagingErrors({ actors: [{ cast: "a", action: "sit", at: "stand_left" }] }, location).some((e) => e.includes("standing station")));
assert.ok(productionStagingErrors({ actors: [{ cast: "a", at: [30, 0] }] }, location).length);
assert.deepEqual(productionStagingErrors({ actors: [{ cast: "a", action: "sit", at: "seat_right" }] }, location), []);
assert.deepEqual(
  productionStagingErrors(
    {
      actors: [
        { cast: "a", at: [-1, 1, 0] },
        { cast: "b", at: [1, 1, 0] },
      ],
    },
    location,
  ),
  [],
);
const planted = productionStaging({ actors: [{ cast: "a", at: [-1, 0], moveTo: [1, 0], then: "run" }] }, location);
assert.equal(planted.actors[0].moveTo, undefined);
assert.equal(planted.actors[0].then, undefined);
assert.deepEqual(planted.actors[0].at, [-1, 0]);
const noDetail = planMotionCoverage({ actors: [{ cast: "a" }] }, 9, 0, "At 8:46 AM in 2001");
assert.ok(noDetail.every((c) => c.shot !== "insert"));
const propShots = planMotionCoverage({ actors: [], props: [{ name: "grass" }, { name: "truck" }] }, 9, 0, "A truck crosses the field");
assert.equal(propShots[1].focusProp, "truck");
assert.ok(propShots.every((c) => !c.focus));
const authored = planMotionCoverage( { actors: [{ cast: "a" }], cameras: [ { shot: "wide", move: "static", amount: 0, focus: "a" }, { shot: "medium", pos: [2, 2, 4], move: "static" }, ], }, 6, );
assert.equal(authored[0].focus, "a");
assert.equal(authored[0].move, "static");
assert.equal(authored[0].amount, 0);
assert.deepEqual(authored[1].pos, [2, 2, 4]);
assert.ok(planMotionCoverage({ actors: [], cameras: [{}, {}, {}, {}] }, 12).every((c) => c.move));
const gen = emptyGen();
gen.locations.office = { ...location, nodes: [], materials: {} };
gen.cast = { a: { height: 1.8 }, b: { height: 1.8 } } as any;
const beat: any = { id: "b1", place: "office", visual: "scene", cast: ["a", "b"], narration: "Two people discuss a document", duration: 6 };
let calls = 0;
const prompts: string[] = [];
await stageBeats(
  [beat],
  { language: "en", beats: [beat] } as any,
  {
    title: "Meeting",
    logline: "Discussion",
    cast: [
      { key: "a", name: "A" },
      { key: "b", name: "B" },
    ],
    places: [{ key: "office", name: "Office" }],
  } as any,
  gen,
  {
    exec: {} as any,
    log: () => {},
    ai: async (prompt: string) => {
      prompts.push(prompt);
      calls++;
      return { beats: [ { id: "b1", location: "office", actors: [ { cast: "a", action: "stand", at: [0, 0], moveTo: [3, 0] }, { cast: "b", action: "stand", at: calls === 1 ? [0, 0] : [1, 0] }, ], }, ], };
    },
  },
);
assert.equal(calls, 2, "Overlapping actors must be rejected before accepting staging");
assert.ok(prompts[0].includes("Do not classify its name into a preset"));
assert.equal(gen.staging.b1.actors[0].moveTo, undefined);
assert.deepEqual(gen.staging.b1.actors[1].at, [1, 0]);
console.log("Multi-scene production passed: 5 setting families, structural preflight, static cast, real object detail targets, preserved authored cameras.");
