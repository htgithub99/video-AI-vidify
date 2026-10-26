import assert from "node:assert/strict";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { PUPPET as P, PUPPET_TYPES as T } from "../src/constants/motionPuppet.js";
import { listPuppets, readPuppet } from "../src/server/services/puppet/kitLibrary.js";
import { runWithPuppetPack } from "../src/server/services/puppet/packPolicy.js";
import { buildPuppetSets, composePuppetSet } from "../src/server/services/puppet/setComposer.js";
import { puppetSetMissingRequirements, puppetSetPlacementNeeds } from "../src/server/services/puppet/layout.js";
import { puppetPackAssemblyBaseFits, puppetPackAssemblyLocationFits } from "../src/server/services/puppet/packLocation.js";
import type { PuppetBase, PuppetPiece, PuppetRead, PuppetStylePack } from "../src/types/motionPuppet.js";
const assets = [T.STYLE, T.CHARACTER, T.SET, T.PROP, T.BASE, T.PIECE].flatMap((type) => listPuppets(type));
const objects = ["plate", "lamp"].map((key) => ({ key, identity: key, word: key, type: "small", category: "prop", mount: P.MOUNT_TABLE, support: "table", size: 0.3 }));
const bedside = {
  who: ["patient", "visitor"],
  states: [
    { char: "patient", posture: "lie", action: "stand", support: "bed" },
    { char: "visitor", posture: "sit", action: "sit", support: "chair" },
  ],
  action: "stand",
  emotion: "neutral",
  focus: "people",
  overlays: [],
  object: objects[0],
  objects,
} as PuppetRead;
const doorway = {
  ...bedside,
  states: [
    { char: "patient", posture: "lie", action: "lie", support: "bed" },
    { char: "visitor", posture: "stand", action: "stand", support: "door" },
  ],
};
const reads = [bedside, doorway];
const placements = puppetSetPlacementNeeds(reads);
assert.equal(placements.find((need) => need.support === "table")?.count, 2);
assert.equal(puppetSetPlacementNeeds([{ ...bedside, objects: [objects[0]] }]).find((need) => need.support === "table")?.count, 1);
assert.equal(
  puppetSetPlacementNeeds([{ ...bedside, objects: [{ ...objects[0], mount: "held", owner: "visitor" }], object: null }]).some((need) => need.kind === P.SPOT_SURFACE),
  false,
);
for (const styleId of Object.values(K.PRESETS)) {
  await runWithPuppetPack(styleId, assets, async () => {
    const style = readPuppet<PuppetStylePack>(T.STYLE, styleId)!;
    const base = listPuppets<PuppetBase>(T.BASE).find((asset) => asset.interior && !asset.recipeOnly)!;
    const piece = listPuppets<PuppetPiece>(T.PIECE).find((asset) => asset.slots.includes("mid_left"))!;
    assert.throws(() =>
      composePuppetSet(
        base,
        [
          { piece, slot: "mid_left" },
          { piece, slot: "mid_left" },
        ],
        false,
        false,
      ),
    );
    let calls = 0;
    const built = await buildPuppetSets(
      style,
      [{ place: { key: "bedroom", name: "Village Bedroom", desc: "Village bedroom with a bed, chair, table and wooden door", interior: true, time: "night" }, must: ["bed", "chair", "table", "door"], placements, uses: "", validate: (set) => puppetSetMissingRequirements(set, reads) }],
      {
        exec: {} as any,
        log: () => {},
        ai: async () => {
          calls++;
          throw new Error(K.DRAW_BLOCKED);
        },
      },
      styleId,
    );
    assert.equal(calls, 0);
    assert.ok(built.bedroom, styleId);
    assert.deepEqual(puppetSetMissingRequirements(built.bedroom, reads), []);
    assert.equal(built.bedroom.time, "night");
    const room = { key: "bedroom", name: "Bedroom", desc: "Bedroom", interior: true, time: "night" };
    assert.equal(puppetPackAssemblyBaseFits(room, { ...base, locationFamily: "temple" }), false);
    assert.equal(puppetPackAssemblyBaseFits(room, { ...base, interior: false }), false);
    const parts = listPuppets<PuppetPiece>(T.PIECE);
    const bed = parts.find((part) => part.key === "bed")!;
    const table = parts.find((part) => part.key === "folk_ritual_table")!;
    const shell = { ...base, key: "room_plain", locationFamily: "living" as const };
    assert.equal(puppetPackAssemblyLocationFits(room, shell, [table, bed]), true);
    assert.equal(puppetPackAssemblyLocationFits(room, shell, [table]), false);
    process.stdout.write(JSON.stringify({ styleId, pieces: built.bedroom.plan?.pieces }) + "\n");
  });
}
