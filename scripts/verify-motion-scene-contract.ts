import { RUNTIME_VERIFICATION_TEXTS as RT } from "./runtimeVerificationTexts.ts";
import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import { buriedSurfaceErrors, productionLocationErrors, productionStagingErrors } from "../src/lib/motionProductionDesign.ts";
import { emptyGen, stageBeats } from "../src/server/services/motionGenService.ts";
import { MOTION_GEN_CONFIG } from "../src/constants/motionGenPrompts.ts";
import { validateGenStaging } from "../src/features/motion/server/services/motionEngineService.ts";
const room = { interior: true, stage: { center: [0, 0], size: [5, 5] }, camera: { pos: [0, 2, 4], target: [0, 1, 0] }, defs: { dial: [{ shape: VT.SPHERE }] }, nodes: [] as any[] };
assert.ok(productionLocationErrors(room).some((e) => e.includes(VT.NEVER_PLACED)));
assert.ok(productionLocationErrors(room).some((e) => e.includes(VT.NO_MOTIVATED_LIGHTS)));
room.nodes = [
  { shape: VT.USE, ref: VT.DIAL, name: VT.INSTRUMENT, pos: [0, 1, 0] },
  { shape: VT.LIGHT, type: VT.AMBIENT, intensity: 0.5 },
];
assert.deepEqual(productionLocationErrors(room), []);
assert.ok(productionStagingErrors({ props: [{ shape: VT.BOX, pos: [0, 0, 0] }] }, room).some((e) => e.includes(VT.NO_MATERIAL)));
assert.ok(productionStagingErrors({ props: [{ shape: VT.USE, ref: VT.DIAL, name: VT.INSTRUMENT }] }, room).some((e) => e.includes(VT.DUPLICATES)));
assert.ok(
  productionStagingErrors(
    {
      props: [
        { shape: VT.BOX, mat: VT.METAL, pos: [0, 0, 0] },
        { shape: VT.SPHERE, mat: VT.METAL, pos: [0, 0, 0] },
      ],
    },
    room,
  ).some((e) => e.includes(VT.OVERLAP_AT_WORLD_ORIGIN)),
);
room.defs = { dial: [{ shape: VT.USE, ref: VT.FACE }], face: [{ shape: VT.SPHERE }] } as any;
assert.deepEqual(productionLocationErrors(room), [], VT.REACHABLE_NESTED_COMPONENTS_MUST_BE_ACCEPTED);
const casing = { shape: VT.CYLINDER, name: VT.HOUSING, pos: [0, 0, 0.02], rot: [90, 0, 0], radius: 0.12, height: 0.06, mat: { color: VT.VALUE_888888 } };
const dial = { shape: VT.CYLINDER, name: VT.DETAIL, pos: [0, 0, 0.04], rot: [90, 0, 0], radius: 0.1, height: 0.005, mat: { color: VT.FFFFFF } };
assert.ok(buriedSurfaceErrors({ nodes: [{ shape: VT.GROUP, children: [casing, dial] }] }).some((e) => e.includes(VT.FULLY_INSIDE)));
assert.deepEqual(buriedSurfaceErrors({ nodes: [casing, { ...dial, pos: [0, 0, 0.055] }] }), [], VT.SURFACE_IN_FRONT_OF_THE_CAP_IS_VISIBLE);
assert.deepEqual(buriedSurfaceErrors({ nodes: [{ ...casing, mat: { glass: true, opacity: 0.25 } }, dial] }), [], VT.TRANSPARENT_COVERS_MUST_NOT_BE_TREATED_AS_OPAQUE_SHELLS);
const gen = emptyGen();
gen.locations.room = room;
const beat: any = { id: VT.INVALID, visual: VT.SCENE, place: VT.ROOM, cast: [], narration: VT.SHOW_THE_INSTRUMENT };
let attempts = 0;
const logs: string[] = [];
const script = { title: VT.TEST, language: VT.EN, beats: [beat] } as any;
const analysis = { title: VT.TEST, cast: [], places: [{ key: VT.ROOM, name: VT.ROOM_2 }] } as any;
const failed = await stageBeats([beat], script, analysis, gen, {
  log: (line: string) => logs.push(line),
  ai: async () => {
    attempts++;
    return { beats: [{ id: VT.INVALID, location: VT.ROOM, props: [{ shape: VT.BOX }] }] };
  },
} as any);
assert.deepEqual(failed, []);
assert.equal(attempts, 1, VT.OPTIONAL_PROP_DETAILS_MUST_NOT_TRIGGER_AI_CORRECTION_REQUESTS);
assert.ok(gen.staging.invalid, VT.USABLE_STAGING_IS_KEPT_DESPITE_ADVISORY_PROP_DETAILS);
assert.ok(
  logs.some((line) => line.includes(VT.NO_MATERIAL)),
  VT.MISSING_PROP_DETAILS_REMAIN_VISIBLE_IN_THE_ADVISORY_LOG,
);
delete gen.staging.invalid;
attempts = 0;
const missing = await stageBeats([beat], script, analysis, gen, {
  log: () => {},
  ai: async () => {
    attempts++;
    return { beats: [] };
  },
} as any);
assert.deepEqual(missing, [beat.id], VT.MISSING_SCENE_DATA_IS_REPORTED_FOR_RECOVERY);
assert.equal(attempts, MOTION_GEN_CONFIG.STAGING_TRIES);
assert.equal(gen.staging.invalid, undefined, VT.MISSING_SCENE_DATA_MUST_NOT_SILENTLY_BECOME_DEFAULT_STAGING);
room.defs = { oil_lamp: [{ shape: VT.USE, ref: RT.LAMP_BODY }], lamp_body: [{ shape: VT.BOX, size: [0.2, 0.3, 0.2] }] } as any;
const ctx = { locations: { room }, cast: [] };
const source = { location: VT.ROOM, props: [{ shape: VT.GROUP, children: [{ shape: VT.USE, ref: RT.OIL_LAMP, pos: [1, 1, 0] }] }] };
const checked = validateGenStaging(source, ctx);
assert.deepEqual(checked.errors, []);
assert.equal(checked.value.props[0].children[0].ref, RT.OIL_LAMP);
assert.ok(validateGenStaging({ location: VT.ROOM, props: [{ shape: VT.USE, ref: RT.MISSING_LAMP }] }, ctx).errors.some((error) => error.includes(RT.NOT_IN_DEFS)));
assert.deepEqual(Object.keys(room.defs), [RT.OIL_LAMP, RT.LAMP_BODY], RT.VALIDATION_MUST_NOT_MUTATE_THE_LOCATION);
for (const [input, output] of [
  [undefined, VT.POINT],
  [RT.POINTLIGHT, VT.POINT],
  [RT.SPOT_LIGHT, RT.SPOT],
  [RT.DIRECTIONALLIGHT, RT.SUN],
  [RT.HEMISPHERE, RT.HEMI],
  [RT.AMBIENTLIGHT, VT.AMBIENT],
]) {
  const result = validateGenStaging({ location: VT.ROOM, props: [{ shape: VT.LIGHT, type: input }] }, ctx);
  assert.deepEqual(result.errors, []);
  assert.equal(result.value.props[0].type, output);
  assert.equal(result.warnings?.length, 1, RT.A_NORMALIZED_LIGHT_REMAINS_VISIBLE_AS_A_WARNING);
}
assert.ok(validateGenStaging({ location: VT.ROOM, props: [{ shape: VT.LIGHT, type: RT.UNSUPPORTED_LASER }] }, ctx).errors.length, RT.UNSUPPORTED_LIGHTS_MUST_STILL_BE_REJECTED);
attempts = 0;
await stageBeats([beat], script, analysis, gen, {
  log: (line: string) => logs.push(line),
  ai: async () => {
    attempts++;
    return { beats: [{ id: beat.id, ...source, props: [...source.props, { shape: VT.LIGHT, type: RT.POINTLIGHT }] }] };
  },
} as any);
assert.equal(attempts, 1, RT.KNOWN_REFS_AND_RECOVERABLE_LIGHTS_MUST_NOT_TRIGGER_ANOTHER_AI_REQUEST);
assert.ok(gen.staging.invalid);
process.stdout.write(VT.SCENE_CONTRACT_PASSED_STRUCTURAL_DIAGNOSTICS_NESTED_INSTANCES_ADVISORY_P + VT.EMPTY);
