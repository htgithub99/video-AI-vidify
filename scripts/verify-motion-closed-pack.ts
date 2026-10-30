import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { PUPPET as P, PUPPET_TYPES as T } from "../src/constants/motionPuppet.js";
import { cleanPuppetCompositions } from "../src/features/motion/server/services/puppet/blocking.js";
import { layoutPuppetFrame, puppetSetMissingRequirements } from "../src/features/motion/server/services/puppet/layout.js";
import { composePuppetSet } from "../src/features/motion/server/services/puppet/setComposer.js";
import { capturePuppetPack, closedPuppetPackId, runWithPuppetPack, withPuppetPackSnapshot } from "../src/features/motion/server/services/puppet/packPolicy.js";
import { currentPuppetSet, listPuppets, newPuppetId, readPuppet, writePuppet, livePuppetLibrary } from "../src/features/motion/server/services/puppet/kitLibrary.js";
import { MOTION_LIBRARY_RELEASE as RELEASE } from "../src/constants/motionLibraryRelease.js";
import { drawPuppetCharacters, drawPuppetSets, drawPuppetProps, drawPuppetSprites } from "../src/features/motion/server/services/puppet/kitDraw.js";
import { puppetKitSpec, puppetLayoutFrames } from "../src/features/motion/server/services/puppet/compilePuppet.js";
import { normalizePuppetReadContinuity } from "../src/features/motion/server/services/puppet/readContinuity.js";
import { normalizePuppetVisualState } from "../src/features/motion/server/services/puppet/visualContract.js";
import { openStillSession } from "../src/features/motion/server/services/motionRenderService.js";
import { puppetSpotGeometryValid } from "../src/lib/motionPlacement.js";
import { puppetSetWithFixtureStates } from "../src/features/motion/server/services/puppet/packFixtures.js";
import { puppetPackSetLocationFits } from "../src/features/motion/server/services/puppet/packLocation.js";
import { repairPuppetFrameReferences } from "../src/features/motion/server/services/puppet/frameReferences.js";
import type { PuppetAsset, PuppetBase, PuppetCharacter, PuppetFrame, PuppetGen, PuppetPiece, PuppetProp, PuppetRead, PuppetSet, PuppetStylePack } from "../src/types/motionPuppet.js";
import type { MotionSpec } from "../src/types/motionVideo.js";
const root = path.resolve("scratch/closed-pack-20261024");
const installed = process.argv.includes("--installed");
if (installed && livePuppetLibrary().version === RELEASE.VERSION) {
  await import("./verify-motion-library-release.js");
  process.exit(0);
}
const manifest = JSON.parse(await fs.readFile(path.join(root, installed ? "installed.json" : "staged.json"), "utf8"));
const records: any[] = manifest.records;
const staged = await Promise.all(
  records.map(async (row) => {
    const bytes = await fs.readFile(row.path);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), row.sha256);
    return JSON.parse(bytes.toString("utf8")) as PuppetAsset;
  }),
);
const inventory = [T.STYLE, T.CHARACTER, T.SET, T.PROP, T.BASE, T.PIECE].flatMap((type) => listPuppets(type));
const out = path.join(root, "stills");
await fs.mkdir(out, { recursive: true });
const cases: any[] = [];
let checks = 0;
let aiCalls = 0;
const options: any = {
  exec: {},
  log() {},
  ai: async () => {
    aiCalls++;
    throw new Error(K.DRAW_BLOCKED);
  },
};
const session = await openStillSession();
try {
  for (const styleId of Object.values(K.PRESETS)) {
    const style = readPuppet<PuppetStylePack>(T.STYLE, styleId)!;
    const lockedSet = staged.find((asset): asset is PuppetSet => asset.type === T.SET && asset.styleId === styleId)!;
    const newerSet = { ...lockedSet, id: newPuppetId(T.SET, K.POLICY + lockedSet.id), replaces: [lockedSet.id], placementVersion: (lockedSet.placementVersion || 0) + 1 };
    runWithPuppetPack(styleId, [...inventory, ...staged, newerSet], () => assert.equal(currentPuppetSet(lockedSet.id)?.id, lockedSet.id));
    checks++;
    const stock = inventory.filter((asset): asset is PuppetCharacter => asset.type === T.CHARACTER && asset.styleId === styleId && !!asset.archetype && asset.group !== "ghost");
    const adults = stock.filter((asset) => asset.age === "adult");
    const child = stock.filter((asset) => asset.age === "child" && asset.group !== "baby").sort((a, b) => b.height - a.height)[0];
    const makeCharacters = (roles: string[]) => Object.fromEntries(roles.map((role, i) => [role, ["child", "carried", "infant"].includes(role) ? child : adults[i]]));
    await runWithPuppetPack(styleId, [...inventory, ...staged], async () => {
      assert.equal(closedPuppetPackId(styleId), styleId);
      assert.ok(listPuppets<PuppetSet>(T.SET).every((asset) => asset.styleId === styleId && asset.tags.includes(K.SEED)));
      const foreign = inventory.find((asset) => asset.type === T.CHARACTER && asset.styleId !== styleId)!;
      assert.equal(readPuppet(T.CHARACTER, foreign.id), null);
      assert.throws(() => writePuppet({ ...style, description: style.description + " invalid" }), /Không được/);
      assert.throws(() => writePuppet({ ...style, id: "stl-0000000000000000" }), /Không được/);
      assert.equal(writePuppet(style).id, styleId);
      await assert.rejects(drawPuppetCharacters(style, [], "", "", options));
      await assert.rejects(drawPuppetSets(style, [], options));
      await assert.rejects(drawPuppetProps(style, [], {}, "", options));
      await assert.rejects(drawPuppetSprites(style, adults[0], options));
      for (const asset of staged.filter((asset): asset is PuppetSet => asset.type === T.SET && asset.styleId === styleId)) {
        assert.ok(asset.spots!.every(puppetSpotGeometryValid));
        assert.deepEqual(cleanPuppetCompositions(asset.compositions, asset.spots!), asset.compositions);
        if (asset.interior) {
          const projected = puppetSetWithFixtureStates(asset, { door: "closed", lamp: "off" })!;
          assert.ok(projected);
          assert.deepEqual(projected.spots, asset.spots);
          assert.deepEqual(projected.compositions, asset.compositions);
          assert.equal(projected.group, asset.group);
          assert.ok(projected.fixtures!.every((fixture) => projected.svg.includes(fixture.layer)));
          assert.ok(projected.svg.includes(projected.fixtures!.find((fixture) => fixture.key === "door")!.states.closed));
          const reopened = puppetSetWithFixtureStates(projected, { door: "open", lamp: "lit" })!;
          assert.ok(reopened);
          assert.equal(puppetSetWithFixtureStates(asset, { door: "missing" }), null);
          assert.equal(puppetSetWithFixtureStates(asset, { nonexistent: "closed" }), null);
          const gen: PuppetGen = { version: P.VERSION, styleId, characters: {}, sets: { room: projected.id }, props: {}, frames: {}, places: {} };
          gen.pack = capturePuppetPack(gen);
          assert.ok(puppetKitSpec(gen, false)?.sets.room);
          checks += 8;
          if (asset.tags[0] === "fixed_family_conversation") {
            const key = asset.id + "-closed-door";
            const frame = { shot: "wide", set: "room", actors: [], start: 0, end: 4 };
            const spec: MotionSpec = { title: key, aspect: "16:9", fps: 24, duration: 4, fadeIn: 0, fadeOut: 0, subtitles: [], kit: { style, sets: { room: { ...projected, wallY: projected.horizonY } }, characters: {}, props: {}, motion: false }, shots: [{ id: key, start: 0, end: 4, template: P.TEMPLATE, params: { frames: [frame] } }] };
            const [image] = await session.render(spec, [{ id: key, t: 1 }], out, { width: 960, height: 540 });
            assert.deepEqual(image.issues, []);
            cases.push({ key, name: asset.name + " / Closed Door", styleId, file: image.file });
          }
        }
        for (const composition of asset.compositions || []) {
          const roles = Object.keys(composition.roles);
          const characters = makeCharacters(roles);
          const actors = roles.map((role) => {
            const spot = asset.spots!.find((spot) => spot.key === composition.roles[role])!;
            return {
              char: role,
              pose: spot.kind === "sit" ? "sit" : spot.kind === "lie" ? "lie" : composition.kind === "chase" ? "run" : composition.kind === "search" ? "walk" : "idle",
              gesture: role === "carrier" ? "cradle" : undefined,
              face: composition.kind === "chase" || composition.kind === "search" ? "right" : "front",
              expr: "neutral",
              target: composition.kind === "chase" || composition.kind === "search" ? undefined : roles.find((other) => other !== role),
            };
          });
          const blocking = { kind: composition.kind, variant: composition.variant, roles: Object.fromEntries(roles.map((role) => [role, role])) };
          const read: PuppetRead = { focus: roles[0], who: roles, action: "talk", emotion: "neutral", overlays: [], blocking, states: actors.map((actor) => ({ char: actor.char, action: "talk", posture: actor.pose })) };
          assert.deepEqual(puppetSetMissingRequirements(asset, [read]), []);
          const frame = layoutPuppetFrame({ shot: "wide", set: "room", actors, blocking } as PuppetFrame, { set: asset, body: style.body, heights: Object.fromEntries(Object.entries(characters).map(([role, character]) => [role, character.height])) });
          for (const actor of frame.actors) assert.ok(Math.abs(actor.x! * 1920 - asset.spots!.find((spot) => spot.key === actor.spot)!.x) < 1);
          assert.equal(frame.contacts?.length || 0, composition.contacts?.length || 0);
          checks++;
          if (asset.time !== "day" || asset.name.includes("Mirrored")) continue;
          const key = [asset.id, composition.key].join("-");
          const spec: MotionSpec = { title: asset.name, aspect: "16:9", fps: 24, duration: 4, fadeIn: 0, fadeOut: 0, subtitles: [], kit: { style, sets: { room: { ...asset, wallY: asset.horizonY } }, characters, props: {}, motion: false }, shots: [{ id: key, start: 0, end: 4, template: P.TEMPLATE, params: { frames: [{ ...frame, start: 0, end: 4 }] } }] };
          const [image] = await session.render(spec, [{ id: key, t: 1 }], out, { width: 960, height: 540 });
          assert.deepEqual(image.issues, []);
          cases.push({ key: composition.key, styleId, name: asset.name, file: image.file, frame });
        }
      }
      const base = listPuppets<PuppetBase>(T.BASE, (asset) => asset.styleId === styleId && asset.interior)[0];
      for (const piece of staged.filter((asset): asset is PuppetPiece => asset.type === T.PIECE && asset.styleId === styleId)) {
        for (const mirror of [false, true]) {
          const scene = composePuppetSet(base, [{ slot: "scene_center", piece }], false, mirror);
          assert.ok(scene.spots.every(puppetSpotGeometryValid));
          assert.equal(scene.compositions.length, piece.compositions?.length || 0);
          assert.deepEqual(cleanPuppetCompositions(scene.compositions, scene.spots), scene.compositions);
          checks++;
        }
      }
      const props = Object.fromEntries(staged.filter((asset): asset is PuppetProp => asset.type === T.PROP && asset.styleId === styleId).map((asset) => [asset.key, asset]));
      const set = staged.find((asset): asset is PuppetSet => asset.type === T.SET && asset.styleId === styleId && asset.tags[0] === "fixed_dining_table" && asset.time === "day" && !asset.name.includes("Mirrored"))!;
      const characters = { a: adults[0], b: adults[1] };
      const gen: PuppetGen = { version: P.VERSION, styleId, characters: Object.fromEntries(Object.entries(characters).map(([key, asset]) => [key, asset.id])), sets: { room: set.id }, props: Object.fromEntries(Object.entries(props).map(([key, asset]) => [key, asset.id])), frames: {}, places: {} };
      const snapshot = capturePuppetPack(gen)!;
      assert.ok(snapshot.fingerprint);
      withPuppetPackSnapshot(snapshot, () => assert.equal(readPuppet<PuppetSet>(T.SET, set.id)?.svg, set.svg));
      const altered = structuredClone(snapshot);
      (altered.assets[set.id] as PuppetSet).svg += " ";
      assert.throws(() => withPuppetPackSnapshot(altered, () => null));
      gen.pack = snapshot;
      assert.ok(puppetKitSpec(gen, false)?.sets.room);
      assert.ok(puppetLayoutFrames([{ shot: "wide", set: "room", actors: [], start: 0, end: 4 }], gen));
      const missing = structuredClone(gen);
      missing.props.missing = "prp-0000000000000000";
      assert.throws(() => puppetKitSpec(missing, false));
      assert.throws(() => repairPuppetFrameReferences({ shot: "wide", actors: [], prop: "unknown" }, gen));
      const twoProps = layoutPuppetFrame({ shot: "people", actors: [], prop: "rice_porridge_bowl", propMount: "table", propSupport: "table", items: [{ prop: "earthen_water_bowl", propMount: "table", propSupport: "table" }] }, { set, props, prop: props.rice_porridge_bowl, body: style.body, heights: {} });
      assert.notEqual(twoProps.propAt, twoProps.items![0].propAt);
      assert.notEqual(twoProps.propX, twoProps.items![0].propX);
      const ditch = staged.find((asset): asset is PuppetSet => asset.type === T.SET && asset.styleId === styleId && asset.tags[0] === "fixed_ditch_bank")!;
      assert.ok(puppetPackSetLocationFits({ key: "ditch", name: "Drainage Ditch", desc: "", interior: false, time: "day" }, ditch));
      assert.equal(puppetPackSetLocationFits({ key: "well", name: "Village Well", desc: "", interior: false, time: "day" }, ditch), false);
      checks += 6;
      for (const [key, asset, rawFrame] of [
        ["table_bowls", set, twoProps],
        ["neck_sash_stand", set, { shot: "people", actors: [{ char: "a", pose: "idle", face: "right", expr: "neutral", wear: ["white_mourning_sash"] }] }],
        ["neck_sash_lying", staged.find((asset) => asset.type === T.SET && asset.styleId === styleId && asset.tags[0] === "fixed_bedside_postures" && asset.time === "day" && !asset.name.includes("Mirrored")) as PuppetSet, { shot: "wide", actors: [{ char: "a", pose: "lie", support: "bed", face: "right", expr: "neutral", wear: ["white_mourning_sash"] }] }],
        ["rice_on_ditch", ditch, { shot: "wide", actors: [{ char: "a", pose: "idle", support: "ditch", face: "right", expr: "neutral" }], prop: "rice_floating_on_water", propSupport: "ditch_water", propMount: "table" }],
      ] as [string, PuppetSet, PuppetFrame][]) {
        const frame = layoutPuppetFrame(rawFrame, { set: asset, props, prop: rawFrame.prop ? props[rawFrame.prop] : undefined, body: style.body, heights: { a: adults[0].height, b: adults[1].height } });
        const spec: MotionSpec = { title: key, aspect: "16:9", fps: 24, duration: 4, fadeIn: 0, fadeOut: 0, subtitles: [], kit: { style, sets: { room: { ...asset, wallY: asset.horizonY } }, characters, props, motion: false }, shots: [{ id: key, start: 0, end: 4, template: P.TEMPLATE, params: { frames: [{ ...frame, set: "room", start: 0, end: 4 }] } }] };
        const [image] = await session.render(spec, [{ id: styleId + key, t: 1 }], out, { width: 960, height: 540 });
        assert.deepEqual(image.issues, []);
        cases.push({ key, name: key, styleId, file: image.file, frame });
      }
      const propRows = Object.entries(props);
      for (let i = 0; i < propRows.length; i += 6) {
        const key = styleId + "-props-" + i;
        const frame = { shot: "wide", set: "room", actors: [], start: 0, end: 4, items: propRows.slice(i, i + 6).map(([prop], n) => ({ prop, propX: ((n % 3) + 0.5) / 3, propY: n < 3 ? 480 : 1000, propH: 280 })) };
        const spec: MotionSpec = { title: key, aspect: "16:9", fps: 24, duration: 4, fadeIn: 0, fadeOut: 0, subtitles: [], kit: { style, sets: { room: { ...set, wallY: set.horizonY } }, characters: {}, props, motion: false }, shots: [{ id: key, start: 0, end: 4, template: P.TEMPLATE, params: { frames: [frame] } }] };
        const [image] = await session.render(spec, [{ id: key, t: 1 }], out, { width: 960, height: 540 });
        assert.deepEqual(image.issues, []);
        cases.push({ key, name: "Props", styleId, file: image.file });
      }
      const tableSpots = set.spots!;
      const propFrame = layoutPuppetFrame({ shot: "people", actors: [], prop: "bowl", propMount: "table", propSupport: "table", propAt: "wrong" }, { set, prop: { size: 0.25, height: 0.25, mount: "table" }, body: style.body, heights: {} });
      assert.ok(tableSpots.some((spot) => spot.key === propFrame.propAt && spot.fixture === "table"));
      assert.throws(() => layoutPuppetFrame({ shot: "people", actors: [], prop: "bowl", propMount: "table", propSupport: "well" }, { set, prop: { size: 0.25, height: 0.25 }, body: style.body, heights: {} }));
    });
  }
  const lines: any[] = [0, 1, 2].map((i) => ({ key: String(i), chapterId: "one", place: "room", text: "Người trong nhà nhìn nhau." }));
  const read = (state: any, objects: any[] = []): PuppetRead => ({ focus: "a", who: ["a"], place: "room", action: state.action, emotion: "neutral", overlays: [], visual: { scene: "room", timeline: "present", evidence: ["event"], fixtures: [] }, states: [{ char: "a", ...state }], objects });
  const heldPosture = normalizePuppetReadContinuity(lines, { 0: read({ action: "lie", posture: "lie", support: "bed", transition: true }), 1: read({ action: "talk", posture: "lie", transition: false }) });
  assert.equal(heldPosture[1].states![0].posture, "lie");
  assert.equal(heldPosture[1].states![0].support, "bed");
  const postures = normalizePuppetReadContinuity(lines, { 0: read({ action: "lie", posture: "lie", support: "bed", transition: true }), 1: read({ action: "stand", posture: "idle", transition: true }), 2: read({ action: "run", posture: "idle", transition: true }) });
  assert.equal(postures[1].states![0].posture, "idle");
  assert.equal(postures[1].states![0].support, undefined);
  assert.equal(postures[2].states![0].support, undefined);
  const object = (key: string, owner?: string, mount = "held") => ({ key, word: key, identity: key, owner, mount, type: "small", size: 0.2, note: key });
  const states = normalizePuppetVisualState(lines, { 0: read({ action: "hold" }, [object("cloth", "a")]), 1: read({ action: "hold" }, [object("bowl", "a")]), 2: read({ action: "stand" }, [{ ...object("bowl", undefined, "table"), transition: true }]) }, { room: { key: "room", name: "room", desc: "room", interior: true, time: "day" } });
  assert.equal(
    states[1].objects?.some((object) => object.key === "cloth"),
    false,
  );
  assert.equal(states[2].objects?.find((object) => object.key === "bowl")?.owner, undefined);
  assert.equal(aiCalls, 0);
  await fs.writeFile(path.join(root, "verification.json"), JSON.stringify({ checks, stills: cases.length, aiCalls, cases }, null, 2));
  process.stdout.write(JSON.stringify({ checks, stills: cases.length, aiCalls }) + "\n");
} finally {
  await session.close();
}
