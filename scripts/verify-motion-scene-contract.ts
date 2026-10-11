import assert from "node:assert/strict";
import { buriedSurfaceErrors, productionLocationErrors, productionStagingErrors } from "../src/lib/motionProductionDesign.ts";
import { emptyGen, stageBeats } from "../src/server/services/motionGenService.ts";
const room = { interior: true, stage: { center: [0, 0], size: [5, 5] }, camera: { pos: [0, 2, 4], target: [0, 1, 0] }, defs: { dial: [{ shape: "sphere" }] }, nodes: [] as any[] };
assert.ok(productionLocationErrors(room).some((e) => e.includes("never placed")));
assert.ok(productionLocationErrors(room).some((e) => e.includes("no motivated lights")));
room.nodes = [
  { shape: "use", ref: "dial", name: "instrument", pos: [0, 1, 0] },
  { shape: "light", type: "ambient", intensity: 0.5 },
];
assert.deepEqual(productionLocationErrors(room), []);
assert.ok(productionStagingErrors({ props: [{ shape: "box", pos: [0, 0, 0] }] }, room).some((e) => e.includes("no material")));
assert.ok(productionStagingErrors({ props: [{ shape: "use", ref: "dial", name: "instrument" }] }, room).some((e) => e.includes("duplicates")));
assert.ok(
  productionStagingErrors(
    {
      props: [
        { shape: "box", mat: "metal", pos: [0, 0, 0] },
        { shape: "sphere", mat: "metal", pos: [0, 0, 0] },
      ],
    },
    room,
  ).some((e) => e.includes("overlap at world origin")),
);
room.defs = { dial: [{ shape: "use", ref: "face" }], face: [{ shape: "sphere" }] } as any;
assert.deepEqual(productionLocationErrors(room), [], "Reachable nested components must be accepted");
const casing = { shape: "cylinder", name: "housing", pos: [0, 0, 0.02], rot: [90, 0, 0], radius: 0.12, height: 0.06, mat: { color: "#888888" } };
const dial = { shape: "cylinder", name: "detail", pos: [0, 0, 0.04], rot: [90, 0, 0], radius: 0.1, height: 0.005, mat: { color: "#ffffff" } };
assert.ok(buriedSurfaceErrors({ nodes: [{ shape: "group", children: [casing, dial] }] }).some((e) => e.includes("fully inside")));
assert.deepEqual(buriedSurfaceErrors({ nodes: [casing, { ...dial, pos: [0, 0, 0.055] }] }), [], "Surface in front of the cap is visible");
assert.deepEqual(buriedSurfaceErrors({ nodes: [{ ...casing, mat: { glass: true, opacity: 0.25 } }, dial] }), [], "Transparent covers must not be treated as opaque shells");
const gen = emptyGen();
gen.locations.room = room;
const beat: any = { id: "invalid", visual: "scene", place: "room", cast: [], narration: "Show the instrument" };
let attempts = 0;
await assert.rejects(
  () =>
    stageBeats([beat], { title: "Test", language: "en", beats: [beat] } as any, { title: "Test", cast: [], places: [{ key: "room", name: "Room" }] } as any, gen, {
      log: () => {},
      ai: async () => {
        attempts++;
        return { beats: [{ id: "invalid", location: "room", props: [{ shape: "box" }] }] };
      },
    } as any),
  /after 3 correction attempts/,
);
assert.equal(attempts, 3);
assert.equal(gen.staging.invalid, undefined, "Invalid AI geometry must not silently become default staging");
console.log("Scene contract passed: invisible definitions, unlit interiors, placeholder and duplicate props are blocked; nested instances accepted.");
