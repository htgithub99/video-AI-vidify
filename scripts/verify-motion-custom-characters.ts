import assert from "node:assert/strict";
import fs from "node:fs";
import { reconcileCharacterMode } from "../src/lib/motionVideoDna.ts";
import { validateGenOutfit } from "../src/server/services/motionEngineService.ts";
import { designBible, designLocation, emptyGen, prepareMotionGen } from "../src/server/services/motionGenService.ts";
import { openStillSession } from "../src/server/services/motionRenderService.ts";
const mat = (color: string) => ({ color, roughness: 0.8 });
const box = (size: number[], pos: number[], color: string) => ({ shape: "box", size, pos, bevel: 0.025, mat: mat(color) });
const limb = (radius: number, height: number, y: number) => ({ shape: "capsule", radius, height, pos: [0, y, 0], mat: mat("#385b74") });
const parts: any[] = [
  { socket: "head", nodes: [{ shape: "sphere", radius: 0.12, scale: [0.85, 1.1, 0.85], mat: mat("#bf8f70") }, ...[-1, 1].map((sign) => ({ shape: "sphere", radius: 0.015, pos: [sign * 0.037, 0.01, 0.098], mat: mat("#242c36") }))] },
  { socket: "neck", nodes: [{ shape: "capsule", radius: 0.045, height: 0.07, pos: [0, 0.01, 0], mat: mat("#bf8f70") }] },
  { socket: "chest", nodes: [box([0.4, 0.45, 0.23], [0, -0.17, -0.11], "#d68943")] },
  { socket: "waist", nodes: [box([0.3, 0.2, 0.21], [0, -0.07, 0], "#385b74")] },
];
for (const side of ["r", "l"])
  parts.push(
    { socket: `upperarm_${side}`, nodes: [limb(0.065, 0.2, -0.13)] },
    { socket: `forearm_${side}`, nodes: [limb(0.055, 0.18, -0.12)] },
    { socket: `hand_${side}`, nodes: [{ shape: "sphere", radius: 0.06, scale: [0.65, 1, 0.5], mat: mat("#bf8f70") }] },
    { socket: `thigh_${side}`, nodes: [limb(0.085, 0.25, -0.2)] },
    { socket: `calf_${side}`, nodes: [limb(0.07, 0.25, -0.2)] },
    { socket: `foot_${side}`, nodes: [box([0.13, 0.09, 0.26], [0, -0.035, 0.08], "#242c36")] },
  );
const outfit = { body: "male", height: 1.8, layers: [], drawnBody: parts };
const validated = validateGenOutfit(outfit);
assert.deepEqual(validated.errors, []);
assert.equal(validated.value.drawnBody.length, 16);
assert.ok(validateGenOutfit({ ...outfit, drawnBody: parts.slice(1) }).errors.some((e) => e.includes("missing head")));
const analysis: any = { title: "Test", logline: "Test character", look: "clean", cast: [{ key: "person0", name: "Person", gender: "male" }], places: [] };
const previous = prepareMotionGen(undefined, analysis, false);
previous.cast.person0 = { body: "male" };
assert.deepEqual(prepareMotionGen(previous, analysis, true).cast, {});
assert.equal(prepareMotionGen(previous, analysis, true).characterMode, "drawn");
const drawn = emptyGen();
await designBible(analysis, drawn, {
  exec: {} as any,
  log: () => {},
  customCharacters: true,
  ai: async (prompt: string) => {
    assert.ok(prompt.includes("USER CHARACTER MODE: custom drawn characters"));
    return { style: {}, cast: { person0: outfit } };
  },
});
assert.equal((drawn.cast.person0 as any).drawnBody.length, 16);
const standard = emptyGen();
await designBible(analysis, standard, { exec: {} as any, log: () => {}, customCharacters: false, ai: async () => ({ style: {}, cast: { person0: outfit } }) });
assert.equal((standard.cast.person0 as any).drawnBody, undefined);
const sculptedOutfit = { body: "male", height: 1.8, skin: "#cba58c", customDesign: { anatomy: "sculpted-rig-v1", headWidth: 1.04, headDepth: 0.97 }, layers: [ { kind: "jacket", color: "#263d55" }, { kind: "trousers", color: "#bdab8d" }, { kind: "shoes", color: "#554132" }, ], };
assert.deepEqual(validateGenOutfit(sculptedOutfit).errors, []);
const sculpted = emptyGen();
await designBible(analysis, sculpted, { exec: {} as any, log: () => {}, customCharacters: true, ai: async () => ({ cast: { person0: sculptedOutfit } }) });
assert.equal((sculpted.cast.person0 as any).customDesign.anatomy, "sculpted-rig-v1");
const plain = emptyGen();
await designBible(analysis, plain, { exec: {} as any, log: () => {}, customCharacters: false, ai: async () => ({ cast: { person0: sculptedOutfit } }) });
assert.equal((plain.cast.person0 as any).customDesign, undefined);
await assert.rejects(designBible(analysis, emptyGen(), { exec: {} as any, log: () => {}, customCharacters: true, ai: async () => ({ style: {}, cast: { person0: { body: "male", layers: [] } } }) }), /Cannot build custom characters/);
if (process.argv.includes("--render")) {
  const spec = JSON.parse(fs.readFileSync("motion-engine/demo/editorial-qa.json", "utf8"));
  spec.gen.characterMode = "drawn";
  spec.gen.cast.person0 = validated.value;
  spec.shots = [{ id: "drawn", start: 0, end: 3, template: "gen3d", params: { location: "studio", actors: [{ cast: "person0", action: "stand", at: [0, 0], face: 0 }], cameras: [{ shot: "medium", move: "static" }] } }];
  spec.duration = 3;
  const session = await openStillSession();
  try {
    await designLocation(
      { key: "studio", name: "Object-only studio", description: "No people", interior: false },
      { language: "en", beats: [] } as any,
      analysis,
      drawn,
      {
        render: async (...args: Parameters<typeof session.render>) => {
          assert.ok(args[0].shots.every((shot) => !(shot.params?.actors as any[])?.length));
          return session.render(...args);
        },
      } as any,
      { exec: {} as any, log: () => {}, review: false, runId: "no-reference-mannequin", ai: async () => spec.gen.locations.studio },
    );
    console.log(await session.render(spec, [{ id: "drawn", t: 1 }], "scratch/custom-character-check", { width: 960, height: 540, quality: "high" }));
  } finally {
    await session.close();
  }
}
console.log("Custom characters passed: full geometry validation, option on/off, mode cache invalidation, no silent mannequin fallback.");
const oldScript: any = { language: "en", beats: [{ id: "b", narration: "Keep this" }], gen: previous };
assert.equal(reconcileCharacterMode(oldScript, true)?.gen, undefined);
assert.deepEqual(reconcileCharacterMode(oldScript, true)?.beats, oldScript.beats);
assert.equal(reconcileCharacterMode(oldScript, false), oldScript);
const ready: any = { ...oldScript, gen: { ...drawn, characterMode: "drawn" } };
assert.equal(reconcileCharacterMode(ready, true), ready);
assert.equal(reconcileCharacterMode(ready, false)?.gen, undefined);
