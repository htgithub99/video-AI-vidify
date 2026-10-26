import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ILLUSTRATION_QA as Q } from "./motionIllustrationVerificationTexts.js";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { PUPPET as P, PUPPET_TYPES as T } from "../src/constants/motionPuppet.js";
import { MOTION_ILLUSTRATION as I } from "../src/constants/motionIllustration.js";
import { MOTION_PACK_SELECTION as SELECTION } from "../src/constants/motionPackSelection.js";
import { MOTION_VISUAL_CONTRACT as V } from "../src/constants/motionVisualContract.js";
import { listPuppets, puppetSetForLight, readPuppet } from "../src/server/services/puppet/kitLibrary.js";
import { capturePuppetPack, runWithPuppetPack } from "../src/server/services/puppet/packPolicy.js";
import { choosePuppetBlocking } from "../src/server/services/puppet/blocking.js";
import { puppetPackCapabilities } from "../src/server/services/puppet/packCatalog.js";
import { buildPuppetSets } from "../src/server/services/puppet/setComposer.js";
import { normalizePuppetVisualState } from "../src/server/services/puppet/visualContract.js";
import { puppetReadObjects, readPuppetLines } from "../src/server/services/puppet/director.js";
import { puppetPropFits } from "../src/lib/motionPuppetAssets.js";
import { layoutPuppetFrame, puppetSetMissingRequirements } from "../src/server/services/puppet/layout.js";
import type { PuppetAsset, PuppetBase, PuppetGen, PuppetObject, PuppetPiece, PuppetProp, PuppetRead, PuppetSet, PuppetStylePack } from "../src/types/motionPuppet.js";
const root = path.resolve(Q.ROOT);
const manifest = JSON.parse(fs.readFileSync(path.join(root, Q.MANIFEST), "utf8"));
const inventory = K.TYPES.flatMap((type) => listPuppets(type as any));
const migrated = manifest.records.map((row: any) => JSON.parse(fs.readFileSync(row.staged, "utf8")) as PuppetAsset);
const assets = [...new Map([...inventory, ...migrated].map((asset) => [asset.id, asset])).values()];
const results: unknown[] = [];
for (const [preset, styleId] of Object.entries(K.PRESETS))
  await runWithPuppetPack(styleId, assets, async () => {
    const style = readPuppet<PuppetStylePack>(T.STYLE, styleId)!;
    const sets = listPuppets<PuppetSet>(T.SET);
    const catalogText = puppetPackCapabilities(preset);
    const catalog = JSON.parse(catalogText.slice(catalogText.indexOf("{")));
    assert.ok(catalogText.length < SELECTION.CATALOG_MAX_CHARACTERS);
    for (const set of sets) {
      const location = catalog.illustrations.find((row: any) => row[3].some((variant: any) => variant[3].includes(set.id)));
      assert.ok(location);
      assert.equal(location[0], set.group || set.tags[0]);
      const [stageSpots, stageLayouts] = catalog.stages[location[2]];
      assert.deepEqual(
        stageSpots.map((id: number) => catalog.spots[id]),
        (set.spots || []).map((spot) => [spot.key, spot.kind, spot.fixture || null, spot.relation || null]),
      );
      for (const composition of set.compositions || []) {
        assert.ok(
          stageLayouts.some((id: number) => {
            const [kind, variant, roles] = catalog.layouts[id];
            return (
              kind === composition.kind &&
              variant === (composition.variant || null) &&
              Object.keys(roles).length === Object.keys(composition.roles).length &&
              Object.entries(composition.roles).every(([role, key]) => {
                const spot = set.spots?.find((entry) => entry.key === key);
                return catalog.spots[roles[role]]?.[0] === spot?.key && catalog.spots[roles[role]]?.[1] === spot?.kind && catalog.spots[roles[role]]?.[2] === (spot?.fixture || null);
              })
            );
          }),
        );
      }
    }
    const day = sets.find((set) => set.time === Q.DAY && set.variants?.night && readPuppet<PuppetSet>(T.SET, set.variants.night)?.name.includes(P.VARIANT_SEP))!;
    assert.ok(day);
    const night = puppetSetForLight(day, Q.NIGHT);
    assert.equal(night.time, Q.NIGHT);
    assert.equal(puppetSetForLight({ ...night, variants: {} }, Q.DAY).id, day.id);
    const stage = {
      spots: [
        { key: Q.CAST[0], kind: "stand", x: 600, y: 900 },
        { key: Q.CAST[1], kind: "stand", x: 1150, y: 900 },
      ],
    } as any;
    const blocking = { kind: "conversation", roles: { host: Q.CAST[0], guest: Q.CAST[1] } };
    const actors = Q.CAST.map((char) => ({ char, pose: Q.IDLE, expr: Q.NEUTRAL, face: Q.FRONT }));
    assert.equal(choosePuppetBlocking(blocking, actors, stage)?.assignments.size, 2);
    assert.equal(choosePuppetBlocking(blocking, [{ ...actors[0], pose: "sit", support: "chair" }, actors[1]], stage), null);
    const place: any = { key: Q.ROOM, name: Q.ROOM, desc: Q.ROOM, interior: true, time: Q.DAY };
    const line: any = { key: Q.ROOM, chapterId: Q.CHAPTER, beatId: Q.CHAPTER, text: Q.SOURCE, cast: [...Q.CAST], place: Q.ROOM };
    const rawObjects = Q.INSTANCES.map((identity, index) => ({ key: Q.BOWL, identity, word: "bát", description: "Rice bowl", category: "prop", type: "small", mount: "held", owner: Q.CAST[index], size: 0.3 }));
    const raw = { i: 0, focus: Q.CAST[0], who: [...Q.CAST], place: Q.ROOM, action: "talk", emotion: Q.NEUTRAL, overlays: [], states: Q.CAST.map((char) => ({ char, action: "talk", posture: Q.IDLE })), object: rawObjects[1], objects: rawObjects, visual: { scene: Q.ROOM, timeline: Q.PRESENT, evidence: [Q.SOURCE], fixtures: [] } };
    const nextLine = { ...line, key: Q.PLACES[1] };
    const { reads } = await readPuppetLines(
      [line, nextLine],
      [line, nextLine],
      { title: Q.TITLE, logline: Q.SOURCE, cast: Q.CAST.map((key) => ({ key, name: key })), places: [] } as any,
      { room: place },
      {},
      {
        exec: {},
        readCatalog: Q.TEST_CATALOG,
        log() {},
        ai: async (prompt) => {
          assert.equal(prompt.split(Q.TEST_CATALOG).length, 2);
          return { lines: [raw, { ...raw, i: 1 }] };
        },
      },
    );
    assert.equal(puppetReadObjects(reads.room).length, 2);
    assert.equal(reads.room.object?.identity, Q.INSTANCES[1]);
    const normalized = normalizePuppetVisualState([line], reads, { room: place });
    const instances = puppetReadObjects(normalized.room);
    assert.deepEqual(new Set(instances.map((object) => object.key)), new Set(Q.INSTANCES));
    const bowl = listPuppets<PuppetProp>(T.PROP).find((prop) => prop.key === Q.BOWL)!;
    assert.ok(instances.every((object) => puppetPropFits(object, bowl)));
    assert.ok(puppetPropFits({ ...instances[0], physicalState: Q.COLD, requirements: [Q.COLD] }, bowl));
    const table = sets.find((set) => set.tags.includes(Q.SCENE) && set.time === Q.DAY)!;
    const props = Object.fromEntries(instances.map((object) => [object.key, bowl]));
    const frame = layoutPuppetFrame({ shot: Q.PEOPLE, actors: [], prop: Q.INSTANCES[0], propMount: "table", propSupport: "table", items: [{ prop: Q.INSTANCES[1], propMount: "table", propSupport: "table" }] }, { set: table, props, prop: bowl, body: style.body, heights: {} });
    assert.notEqual(frame.propAt, frame.items![0].propAt);
    assert.notEqual(frame.propX, frame.items![0].propX);
    const stateLines = Q.PLACES.map((key) => ({ ...line, key }));
    const stateReads: Record<string, PuppetRead> = Object.fromEntries(stateLines.map((entry) => [entry.key, structuredClone(reads.room)]));
    stateReads.next.objects!.forEach((object) => {
      if (object.identity === Q.INSTANCES[0]) Object.assign(object, { owner: Q.CAST[1], transition: true });
    });
    stateReads.memory.visual!.timeline = Q.PLACES[2];
    stateReads.memory.objects![0].owner = Q.CAST[0];
    const state = normalizePuppetVisualState(stateLines, stateReads, { room: place });
    assert.equal(puppetReadObjects(state.return).find((object) => object.identity === Q.INSTANCES[0])?.owner, Q.CAST[1]);
    assert.deepEqual(normalizePuppetVisualState(stateLines, state, { room: place }), state);
    const machete: PuppetObject = { ...rawObjects[0], key: Q.TOOL_INSTANCE + V.STATE_SEPARATOR + Q.BROKEN, catalogKey: Q.TOOL, identity: Q.TOOL_INSTANCE, physicalState: Q.BROKEN, requirements: [Q.BROKEN], type: "tool" };
    const tool = listPuppets<PuppetProp>(T.PROP).find((prop) => prop.key === Q.TOOL)!;
    assert.ok(puppetPropFits(machete, { ...tool, key: Q.TOOL + I.SEPARATOR + Q.BROKEN, desc: Q.BROKEN + P.SPACE + Q.TOOL }));
    assert.equal(puppetPropFits(machete, tool), false);
    const piece = listPuppets<PuppetPiece>(T.PIECE).find((piece) => piece.key === Q.BED)!;
    const bases = listPuppets<PuppetBase>(T.BASE)
      .filter((base) => base.interior)
      .slice(0, 2);
    let validations = 0;
    let calls = 0;
    await runWithPuppetPack(styleId, [style, piece, ...bases], async () => {
      const result = await buildPuppetSets(
        style,
        [
          {
            place: { key: Q.BEDROOM, name: Q.BEDROOM_NAME, desc: Q.BEDROOM_DESC, interior: true, time: Q.NIGHT },
            must: ["bed"],
            uses: Q.BEDROOM_DESC,
            validate: (set) => {
              validations++;
              return validations === 1 ? [Q.INVALID] : puppetSetMissingRequirements(set, [{ states: [{ char: Q.CAST[0], action: "lie", posture: "lie", support: "bed" }] } as any]);
            },
          },
        ],
        {
          exec: {},
          log() {},
          ai: async () => {
            calls++;
            return null;
          },
        },
        Q.TITLE,
      );
      assert.ok(result.bedroom);
      assert.ok(validations >= 2);
      assert.equal(calls, 0);
      assert.equal(listPuppets<PuppetSet>(T.SET).length, 2);
      assert.equal(result.bedroom.time, Q.NIGHT);
      const gen = { version: P.VERSION, styleId, characters: {}, sets: { room: result.bedroom.id }, props: {}, frames: {}, places: {} } as PuppetGen;
      const snapshot = capturePuppetPack(gen)!;
      assert.ok(snapshot.assemblies[result.bedroom.id].includes(piece.id));
      assert.equal(Object.keys(snapshot.assemblies).length, 2);
    });
    results.push({ preset, catalogCharacters: catalogText.length, catalogPreservesPhysicalLayouts: true, timeVariants: true, simpleBlocking: true, distinctPropInstances: true, propTransferAndFlashback: true, physicalStateAsset: true, validatedAssemblyAfterAiFailure: true });
  });
fs.writeFileSync(path.join(root, Q.TEST_RESULT), JSON.stringify(results, null, 2));
process.stdout.write(Q.OUTPUT + "\n");
